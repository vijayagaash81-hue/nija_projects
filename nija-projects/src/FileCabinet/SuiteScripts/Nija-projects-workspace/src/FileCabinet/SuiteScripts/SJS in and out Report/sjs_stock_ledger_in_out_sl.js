/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * Script Name: SJS Stock Ledger IN/OUT Report Suitelet
 * Description: Generates dynamic Stock Ledger IN/OUT Report using NetSuite N/search
 *              styled with official SJS Enersol Executive Report View UI.
 * Author: Nija Projects
 */

define(['N/ui/serverWidget', 'N/log', 'N/search', 'N/runtime', 'N/format', 'N/file', 'N/render', 'N/xml', 'N/url', 'N/query'],
    (serverWidget, log, search, runtime, format, file, render, xml, url, query) => {

        function onRequest(context) {
            try {
                const req = context.request;
                const params = req.parameters;

                // Action modes: csv, pdf, or view
                const action = params.action || '';

                // Date Filters (Default to YTD)
                const now = new Date();
                const defaultFromDateStr = `01/01/${now.getFullYear()}`;
                const defaultToDateStr = format.format({ value: now, type: format.Type.DATE });

                const fromDateStr = params.custpage_fromdate || defaultFromDateStr;
                const toDateStr = params.custpage_todate || defaultToDateStr;
                const itemId = params.custpage_item || '';
                const subId = params.custpage_subsidiary || '';
                const divisionId = params.custpage_division || '';
                const cat1Id = params.custpage_cat1 || '';
                const cat2Id = params.custpage_cat2 || '';
                const cat3Id = params.custpage_cat3 || '';
                const cat4Text = params.custpage_cat4 || '';
                const cat5Text = params.custpage_cat5 || '';
                const pageParam = parseInt(params.custpage_page || '1', 10) || 1;
                const pageSizeParam = params.custpage_pagesize || '25';
                const sortDirParam = params.custpage_sortdir || 'asc';
                const sortColParam = params.custpage_sortcol || 'itemcode';

                log.audit('Stock Ledger Request Params', { fromDateStr, toDateStr, itemId, subId, divisionId, cat1Id, cat2Id, cat3Id, cat4Text, cat5Text, pageParam, pageSizeParam, sortDirParam, sortColParam, action });

                // --- 1. FETCH FILTER DROPDOWN DATA ---
                const filterOptions = getFilterDropdownOptions();

                // --- 2. QUERY REPORT DATA USING N/SEARCH ---
                const reportData = getStockLedgerData({
                    fromDateStr,
                    toDateStr,
                    itemId,
                    subId,
                    divisionId,
                    cat1Id,
                    cat2Id,
                    cat3Id,
                    cat4Text,
                    cat5Text
                });

                // --- 2.1 SORT REPORT DATA BY HIGHLIGHTED ITEM HEADER LABEL ---
                sortReportData(reportData, sortDirParam);

                // --- 3. HANDLE EXPORT ACTIONS (Exports ALL items regardless of pagination) ---
                if (action === 'csv') {
                    const csvContent = generateCSVExport(reportData, fromDateStr, toDateStr);
                    context.response.setHeader({ name: 'Content-Type', value: 'text/csv; charset=utf-8' });
                    context.response.setHeader({ name: 'Content-Disposition', value: `attachment; filename="Stock_Ledger_IN_OUT_${fromDateStr}_to_${toDateStr}.csv"` });
                    context.response.write('\uFEFF' + csvContent);
                    return;
                }

                if (action === 'pdf') {
                    const pdfFile = generatePDFExport(reportData, fromDateStr, toDateStr);
                    context.response.writeFile(pdfFile, true);
                    return;
                }

                // --- 4. RENDER HTML DASHBOARD WITH OFFICIAL SJS REPORT VIEW UI ---
                const scriptId = params.script || runtime.getCurrentScript().id;
                const deployId = params.deploy || runtime.getCurrentScript().deploymentId;

                const htmlContent = buildHtmlReportView({
                    reportData,
                    filterOptions,
                    fromDateStr,
                    toDateStr,
                    itemId,
                    subId,
                    divisionId,
                    cat1Id,
                    cat2Id,
                    cat3Id,
                    cat4Text,
                    cat5Text,
                    pageParam,
                    pageSizeParam,
                    sortDirParam,
                    sortColParam,
                    scriptId,
                    deployId
                });

                context.response.write(htmlContent);

            } catch (e) {
                log.error('Error in Stock Ledger Suitelet', e);
                context.response.write(`<h3>An error occurred while generating the report: ${e.message}</h3><pre>${e.stack}</pre>`);
            }
        }

        /**
         * Fetch dropdown filter options using N/search
         */
        function getFilterDropdownOptions() {
            const options = {
                subsidiaries: [],
                divisions: [],
                items: [],
                cat1: [],
                cat2: [],
                cat3: []
            };

            try {
                // Subsidiaries search
                search.create({
                    type: 'subsidiary',
                    filters: [['isinactive', 'is', 'F']],
                    columns: ['name']
                }).run().each(res => {
                    options.subsidiaries.push({ id: res.id, name: res.getValue('name') });
                    return true;
                });

                // Divisions search (Class primary, Custom Segment fallback)
                try {
                    search.create({
                        type: 'classification',
                        filters: [['isinactive', 'is', 'F']],
                        columns: ['name']
                    }).run().each(res => {
                        options.divisions.push({ id: res.id, name: res.getValue('name') });
                        return true;
                    });
                } catch (e) {
                    log.error('Classification search notice', e.message);
                }

                // Fallback to custom segment record if classification returns 0 options
                if (options.divisions.length === 0) {
                    try {
                        search.create({
                            type: 'customrecord_cseg_njt_divisions',
                            filters: [['isinactive', 'is', 'F']],
                            columns: ['name']
                        }).run().each(res => {
                            options.divisions.push({ id: res.id, name: res.getValue('name') });
                            return true;
                        });
                    } catch (e) {
                        log.error('Custom segment divisions search notice', e.message);
                    }
                }

                // Items search
                const itemSearch = search.create({
                    type: 'item',
                    filters: [
                        ['isinactive', 'is', 'F'],
                        'AND',
                        ['type', 'anyof', 'InvtPart', 'Assembly', 'LotDepInvtPart', 'SerialDepInvtPart']
                    ],
                    columns: ['itemid', 'displayname']
                });
                const itemPaged = itemSearch.runPaged({ pageSize: 1000 });
                itemPaged.pageRanges.forEach(pr => {
                    itemPaged.fetch({ index: pr.index }).data.forEach(res => {
                        options.items.push({
                            id: res.id,
                            code: res.getValue('itemid'),
                            displayname: res.getValue('displayname')
                        });
                    });
                });

                // Category 1 options — customrecord_njt_item_cat1
                try {
                    search.create({
                        type: 'customrecord_njt_item_cat1',
                        filters: [['isinactive', 'is', 'F']],
                        columns: ['name']
                    }).run().each(res => {
                        options.cat1.push({ id: res.id, name: res.getValue('name') });
                        return true;
                    });
                } catch (e) {
                    log.error('Error fetching Category 1 options', e.message);
                }

                // Category 2 options — customrecord_njt_item_cat2
                try {
                    search.create({
                        type: 'customrecord_njt_item_cat2',
                        filters: [['isinactive', 'is', 'F']],
                        columns: ['name']
                    }).run().each(res => {
                        options.cat2.push({ id: res.id, name: res.getValue('name') });
                        return true;
                    });
                } catch (e) {
                    log.error('Error fetching Category 2 options', e.message);
                }

                // Category 3 options — customrecord_njt_item_cat3
                try {
                    search.create({
                        type: 'customrecord_njt_item_cat3',
                        filters: [['isinactive', 'is', 'F']],
                        columns: ['name']
                    }).run().each(res => {
                        options.cat3.push({ id: res.id, name: res.getValue('name') });
                        return true;
                    });
                } catch (e) {
                    log.error('Error fetching Category 3 options', e.message);
                }

            } catch (e) {
                log.error('Error fetching filter options', e);
            }

            return options;
        }

        /**
         * Map selected Division ID to both standard Class ID and Custom Segment (cseg_njt_divisions) ID.
         * Accounts for NetSuite internal ID mismatch:
         * - Fasteners:   Class ID 1 <-> cseg_njt_divisions ID 3
         * - Fabrication: Class ID 2 <-> cseg_njt_divisions ID 1
         * - Pipe Fitting:Class ID 3 <-> cseg_njt_divisions ID 2
         * - General:     Class ID 4 <-> cseg_njt_divisions ID 4
         */
        function getDivisionFilterTarget(divisionId) {
            if (!divisionId) return { targetClassId: '', targetCsegId: '' };

            const divIdStr = String(divisionId);

            const classToCseg = {
                '1': '3', // Fasteners
                '2': '1', // Fabrication
                '3': '2', // Pipe Fitting
                '4': '4'  // General
            };

            const csegToClass = {
                '3': '1', // Fasteners
                '1': '2', // Fabrication
                '2': '3', // Pipe Fitting
                '4': '4'  // General
            };

            let targetClassId = divIdStr;
            let targetCsegId = divIdStr;

            if (classToCseg[divIdStr]) {
                targetClassId = divIdStr;
                targetCsegId = classToCseg[divIdStr];
            } else if (csegToClass[divIdStr]) {
                targetCsegId = divIdStr;
                targetClassId = csegToClass[divIdStr];
            }

            return { targetClassId, targetCsegId };
        }

        /**
         * Query Stock Ledger Data using N/search criteria
         */
        function getStockLedgerData(filters) {
            const { fromDateStr, toDateStr, itemId, subId, divisionId, cat1Id, cat2Id, cat3Id, cat4Text, cat5Text } = filters;
            const { targetClassId, targetCsegId } = getDivisionFilterTarget(divisionId);

            // --- PRE-FILTER: Resolve allowed item IDs by category if any category filter is active ---
            let categoryFilteredItemIds = null; // null means no category filter applied
            if (cat1Id || cat2Id || cat3Id || cat4Text || cat5Text) {
                try {
                    const catItemFilters = [
                        ['isinactive', 'is', 'F'],
                        'AND',
                        ['type', 'anyof', 'InvtPart', 'Assembly', 'LotDepInvtPart', 'SerialDepInvtPart']
                    ];
                    if (cat1Id)   catItemFilters.push('AND', ['custitem_njt_item_category1', 'anyof',    cat1Id]);
                    if (cat2Id)   catItemFilters.push('AND', ['custitem_njt_item_category2', 'anyof',    cat2Id]);
                    if (cat3Id)   catItemFilters.push('AND', ['custitem_njt_item_category3', 'anyof',    cat3Id]);
                    if (cat4Text) catItemFilters.push('AND', ['custitem_njt_item_category4', 'contains', cat4Text.trim()]);
                    if (cat5Text) catItemFilters.push('AND', ['custitem_njt_item_category5', 'contains', cat5Text.trim()]);

                    categoryFilteredItemIds = [];
                    const catItemSearch = search.create({
                        type: 'item',
                        filters: catItemFilters,
                        columns: ['internalid']
                    });
                    const catPaged = catItemSearch.runPaged({ pageSize: 1000 });
                    catPaged.pageRanges.forEach(pr => {
                        catPaged.fetch({ index: pr.index }).data.forEach(res => {
                            categoryFilteredItemIds.push(res.id);
                        });
                    });
                    log.audit('Category Pre-filter Item IDs', { cat1Id, cat2Id, cat3Id, cat4Text, cat5Text, count: categoryFilteredItemIds.length });

                    // If no items match the categories, return empty immediately
                    if (categoryFilteredItemIds.length === 0) return [];
                } catch (e) {
                    log.error('Error resolving category item IDs', e);
                    categoryFilteredItemIds = null;
                }
            }
            const itemsMap = {};

            try {
                // --- A. QUERY OPENING STOCK BALANCES (including Inventory Adjustments) ---
                const openingSearchFilters = [
                    ["item", "noneof", "@NONE@"],
                    "AND",
                    ["mainline", "is", "F"],
                    "AND",
                    [
                        [["type", "anyof", "ItemShip", "ItemRcpt"], "AND", ["trandate", "before", fromDateStr]],
                        "OR",
                        [["type", "anyof", "InvAdjst"], "AND", ["trandate", "onorbefore", toDateStr]]
                    ]
                ];

                // Apply category-resolved item IDs (or explicit itemId) to opening stock filter
                if (itemId) {
                    openingSearchFilters.push("AND", ["item", "anyof", itemId]);
                } else if (categoryFilteredItemIds && categoryFilteredItemIds.length > 0) {
                    openingSearchFilters.push("AND", ["item", "anyof", categoryFilteredItemIds]);
                }
                if (subId) openingSearchFilters.push("AND", ["subsidiary", "anyof", subId]);
                if (divisionId) {
                    openingSearchFilters.push("AND", [
                        ["class", "anyof", targetClassId],
                        "OR",
                        ["cseg_njt_divisions", "anyof", targetCsegId]
                    ]);
                }

                const openingSearch = search.create({
                    type: "transaction",
                    settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
                    filters: openingSearchFilters,
                    columns: [
                        search.createColumn({ name: "item", summary: search.Summary.GROUP }),
                        search.createColumn({ name: "itemid", join: "item", summary: search.Summary.GROUP }),
                        search.createColumn({ name: "displayname", join: "item", summary: search.Summary.GROUP }),
                        search.createColumn({
                            name: "formulanumeric",
                            // InvAdjst: quantity is already signed (+ve = stock in, -ve = stock out)
                            // ItemRcpt: always positive (IN), ItemShip: always negative (OUT)
                            formula: "CASE WHEN {type} IN ('Inventory Adjustment', 'InvAdjst') THEN {quantity} WHEN {type} IN ('Item Receipt', 'ItemRcpt') THEN ABS({quantity}) ELSE -1 * ABS({quantity}) END",
                            summary: search.Summary.SUM
                        }),
                        search.createColumn({
                            name: "formulanumeric",
                            formula: "CASE WHEN {type} IN ('Inventory Adjustment', 'InvAdjst') THEN {quantity} * {rate} WHEN {type} IN ('Item Receipt', 'ItemRcpt') THEN ABS({quantity}) * {rate} ELSE -1 * (ABS({quantity}) * {rate}) END",
                            summary: search.Summary.SUM
                        })
                    ]
                });

                const openingPaged = openingSearch.runPaged({ pageSize: 1000 });
                openingPaged.pageRanges.forEach(pr => {
                    openingPaged.fetch({ index: pr.index }).data.forEach(res => {
                        const cols = res.columns;
                        const itmId = res.getValue(cols[0]);
                        const itmCode = res.getValue(cols[1]);
                        const itmName = res.getValue(cols[2]);
                        const opQty = parseFloat(res.getValue(cols[3])) || 0;
                        const opVal = parseFloat(res.getValue(cols[4])) || 0;

                        itemsMap[itmId] = {
                            item_id: itmId,
                            item_code: itmCode || '',
                            item_name: itmName || '',
                            opening_qty: opQty,
                            opening_value: opVal > 0 ? opVal : 0,
                            opening_rate: opQty > 0 ? (opVal / opQty) : 0,
                            transactions: []
                        };
                    });
                });

                // --- B. QUERY IN & OUT TRANSACTIONS (within date range) ---
                // Fulfillment & Receipt movements inside the period (Inventory Adjustments absorbed into Balance Qty above)
                const txSearchFilters = [
                    ["type", "anyof", "ItemShip", "ItemRcpt"],
                    "AND",
                    ["item", "noneof", "@NONE@"],
                    "AND",
                    ["mainline", "is", "F"],
                    "AND",
                    ["trandate", "within", fromDateStr, toDateStr]
                ];

                // Apply category-resolved item IDs (or explicit itemId) to transaction filter
                if (itemId) {
                    txSearchFilters.push("AND", ["item", "anyof", itemId]);
                } else if (categoryFilteredItemIds && categoryFilteredItemIds.length > 0) {
                    txSearchFilters.push("AND", ["item", "anyof", categoryFilteredItemIds]);
                }
                if (subId) txSearchFilters.push("AND", ["subsidiary", "anyof", subId]);

                const colItem = search.createColumn({ name: "item" });
                const colItemCode = search.createColumn({ name: "itemid", join: "item" });
                const colItemDispName = search.createColumn({ name: "displayname", join: "item" });
                const colDivision = search.createColumn({ name: "cseg_njt_divisions" });
                const colClass = search.createColumn({ name: "class" });
                const colCreatedFromClass = search.createColumn({ name: "class", join: "createdfrom" });
                const colCreatedFromDiv = search.createColumn({ name: "cseg_njt_divisions", join: "createdfrom" });
                const colItemClass = search.createColumn({ name: "class", join: "item" });
                const colItemDiv = search.createColumn({ name: "cseg_njt_divisions", join: "item" });
                const colEntity = search.createColumn({ name: "entity" });
                const colCreatedFromEntity = search.createColumn({ name: "entity", join: "createdfrom" });
                const colTranDate = search.createColumn({ name: "trandate", sort: search.Sort.ASC });
                const colDocNo = search.createColumn({ name: "tranid" });
                // For Item Receipts: fetch the Vendor Bill's transactionnumber via applyingtransaction join
                // (transactionnumber is the system bill number; tranid is the vendor's reference)
                const colRefNo = search.createColumn({ name: "transactionnumber", join: "applyingtransaction" });
                const colLineSeq = search.createColumn({ name: "linesequencenumber" });
                const colCreatedFrom = search.createColumn({ name: "createdfrom" });
                const colSubsidiary = search.createColumn({ name: "subsidiary" });
                const colCreatedFromSub = search.createColumn({ name: "subsidiary", join: "createdfrom" });

                const colItemRcpt = search.createColumn({
                    name: "formulatext",
                    formula: "CASE WHEN {type} IN ('Item Receipt', 'ItemRcpt') THEN {tranid} END"
                });
                const colItemShip = search.createColumn({
                    name: "formulatext",
                    formula: "CASE WHEN {type} IN ('Item Fulfillment', 'ItemShip') THEN {tranid} END"
                });
                const colSalesOrder = search.createColumn({
                    name: "formulatext",
                    formula: "{createdfrom.tranid}"
                });

                const colQtyReceived = search.createColumn({
                    name: "formulanumeric",
                    formula: "CASE WHEN {type} IN ('Item Receipt', 'ItemRcpt') OR ({type} IN ('Inventory Adjustment', 'InvAdjst') AND {quantity} > 0) THEN ABS({quantity}) ELSE 0 END"
                });
                const colRateReceived = search.createColumn({
                    name: "formulanumeric",
                    formula: "CASE WHEN {type} IN ('Item Receipt', 'ItemRcpt') OR ({type} IN ('Inventory Adjustment', 'InvAdjst') AND {quantity} > 0) THEN {rate} ELSE NULL END"
                });
                const colCost = search.createColumn({
                    name: "formulanumeric",
                    formula: "CASE WHEN {type} IN ('Item Receipt', 'ItemRcpt') OR ({type} IN ('Inventory Adjustment', 'InvAdjst') AND {quantity} > 0) THEN ABS({amount}) ELSE 0 END"
                });

                const colQtyIssued = search.createColumn({
                    name: "formulanumeric",
                    formula: "CASE WHEN {type} IN ('Item Fulfillment', 'ItemShip') OR ({type} IN ('Inventory Adjustment', 'InvAdjst') AND {quantity} < 0) THEN ABS({quantity}) ELSE 0 END"
                });
                const colRateIssued = search.createColumn({
                    name: "formulanumeric",
                    formula: "CASE WHEN {type} IN ('Item Fulfillment', 'ItemShip') OR ({type} IN ('Inventory Adjustment', 'InvAdjst') AND {quantity} < 0) THEN {rate} ELSE 0 END"
                });
                const colValueIssued = search.createColumn({
                    name: "formulanumeric",
                    formula: "CASE WHEN {type} IN ('Item Fulfillment', 'ItemShip') OR ({type} IN ('Inventory Adjustment', 'InvAdjst') AND {quantity} < 0) THEN ABS({amount}) ELSE 0 END"
                });

                const txSearch = search.create({
                    type: "transaction",
                    settings: [{ name: "consolidationtype", value: "ACCTTYPE" }],
                    filters: txSearchFilters,
                    columns: [
                        colItem, colItemCode, colItemDispName, colDivision, colClass, colCreatedFromClass, colCreatedFromDiv, colItemClass, colItemDiv, colEntity, colCreatedFromEntity,
                        colTranDate, colDocNo, colRefNo, colLineSeq, colItemRcpt, colItemShip, colSalesOrder, colCreatedFrom, colSubsidiary, colCreatedFromSub,
                        colQtyReceived, colRateReceived, colCost,
                        colQtyIssued, colRateIssued, colValueIssued
                    ]
                });

                const txMap = {};
                const processedTxItemKeys = {};
                const pagedTxData = txSearch.runPaged({ pageSize: 1000 });
                pagedTxData.pageRanges.forEach(pageRange => {
                    const page = pagedTxData.fetch({ index: pageRange.index });
                    page.data.forEach(res => {
                        const itmId = res.getValue(colItem);
                        if (!itmId) return;

                        const uniqueKey = `${res.id}_${itmId}`;
                        const isTxItemProcessed = processedTxItemKeys[uniqueKey];
                        processedTxItemKeys[uniqueKey] = true;

                        const itmCode = res.getValue(colItemCode) || res.getText(colItem) || '';
                        const itmName = res.getValue(colItemDispName) || '';

                        const txSubId = res.getValue(colSubsidiary) || '';
                        const createdFromSubId = res.getValue(colCreatedFromSub) || '';

                        // Strict Subsidiary Validation:
                        if (subId) {
                            if (txSubId && txSubId != subId && createdFromSubId && createdFromSubId != subId) return;
                        }

                        // Strict Division Validation:
                        if (divisionId) {
                            const txDivId = res.getValue(colDivision) || '';
                            const txClassId = res.getValue(colClass) || '';
                            const cfClassId = res.getValue(colCreatedFromClass) || '';
                            const cfDivId = res.getValue(colCreatedFromDiv) || '';
                            const itemClassId = res.getValue(colItemClass) || '';
                            const itemDivId = res.getValue(colItemDiv) || '';

                            const matchesClass = (txClassId == targetClassId || cfClassId == targetClassId || itemClassId == targetClassId);
                            const matchesCseg  = (txDivId == targetCsegId || cfDivId == targetCsegId || itemDivId == targetCsegId);
                            if (!matchesClass && !matchesCseg) {
                                return;
                            }
                        }

                        const itemRcptDoc = res.getValue(colItemRcpt) || '';
                        const itemShipDoc = res.getValue(colItemShip) || '';
                        const docNoStr = itemRcptDoc || res.getValue(colDocNo) || '';

                        if (!itemsMap[itmId]) {
                            itemsMap[itmId] = {
                                item_id: itmId,
                                item_code: itmCode,
                                item_name: itmName,
                                opening_qty: 0,
                                opening_value: 0,
                                opening_rate: 0,
                                transactions: []
                            };
                        }

                        const dateStr = res.getValue(colTranDate) || '';
                        const divisionStr = res.getText(colDivision) || res.getText(colClass) || res.getText(colCreatedFromClass) || res.getText(colCreatedFromDiv) || res.getText(colItemDiv) || res.getText(colItemClass) || '';
                        const entityStr = res.getText(colEntity) || res.getText(colCreatedFromEntity) || '';
                        const invoiceNoStr = res.getValue(colRefNo) || '';
                        const salesOrderStr = res.getValue(colSalesOrder) || '';
                        const createdFromId = res.getValue(colCreatedFrom) || '';

                        const qtyRec = isTxItemProcessed ? 0 : (parseFloat(res.getValue(colQtyReceived)) || 0);
                        const rateRec = parseFloat(res.getValue(colRateReceived)) || 0;
                        const costVal = isTxItemProcessed ? 0 : (Math.abs(parseFloat(res.getValue(colCost))) || (qtyRec * rateRec));

                        const qtyIss = isTxItemProcessed ? 0 : (parseFloat(res.getValue(colQtyIssued)) || 0);
                        const rateIss = parseFloat(res.getValue(colRateIssued)) || 0;
                        const valIss = isTxItemProcessed ? 0 : (Math.abs(parseFloat(res.getValue(colValueIssued))) || (qtyIss * rateIss));

                        const existingTx = txMap[uniqueKey];
                        if (!existingTx) {
                            const newTx = {
                                tran_id: res.id,
                                created_from_id: createdFromId,
                                date: dateStr,
                                division: divisionStr,
                                doc_no: docNoStr,
                                invoice_no: invoiceNoStr,
                                account_name: entityStr,
                                sales_order_no: salesOrderStr || itemShipDoc || docNoStr,
                                // IN movement
                                qty_received: qtyRec,
                                rate_received: rateRec,
                                cost_received: costVal,
                                // OUT movement
                                qty_issued: qtyIss,
                                rate_issued: rateIss,
                                value_issued: valIss
                            };
                            txMap[uniqueKey] = newTx;
                            itemsMap[itmId].transactions.push(newTx);
                        } else {
                            if (qtyRec > 0) {
                                existingTx.qty_received += qtyRec;
                                existingTx.cost_received += costVal;
                                if (rateRec > 0) existingTx.rate_received = rateRec;
                            }
                            if (qtyIss > 0) {
                                existingTx.qty_issued += qtyIss;
                                existingTx.value_issued += valIss;
                                if (rateIss > 0) existingTx.rate_issued = rateIss;
                            }
                            if (!existingTx.account_name && entityStr) existingTx.account_name = entityStr;
                            if (!existingTx.division && divisionStr) existingTx.division = divisionStr;
                            if (!existingTx.invoice_no && invoiceNoStr) existingTx.invoice_no = invoiceNoStr;
                        }
                    });
                });

                // --- B2. SECONDARY LOOKUP: Customer Invoice tranid for Item Fulfillments ---
                // Item Fulfillment and Invoice can be siblings (children of Sales Order) or parent/child.
                const targetCreatedFromIds = [];
                Object.values(txMap).forEach(tx => {
                    if (tx.qty_issued > 0) {
                        if (tx.created_from_id && !targetCreatedFromIds.includes(tx.created_from_id)) {
                            targetCreatedFromIds.push(tx.created_from_id);
                        }
                        if (tx.tran_id && !targetCreatedFromIds.includes(tx.tran_id)) {
                            targetCreatedFromIds.push(tx.tran_id);
                        }
                    }
                });

                if (targetCreatedFromIds.length > 0) {
                    const invMapByCreatedFrom = {};
                    try {
                        search.create({
                            type: 'transaction',
                            filters: [
                                ['type', 'anyof', 'CustInvc'],
                                'AND',
                                ['createdfrom', 'anyof', targetCreatedFromIds],
                                'AND',
                                ['mainline', 'is', 'T']
                            ],
                            columns: [
                                search.createColumn({ name: 'tranid' }),
                                search.createColumn({ name: 'createdfrom' })
                            ]
                        }).run().each(res => {
                            const createdFromId = res.getValue({ name: 'createdfrom' });
                            const invTranId = res.getValue({ name: 'tranid' });
                            if (createdFromId && invTranId) {
                                invMapByCreatedFrom[createdFromId] = invTranId;
                            }
                            return true;
                        });
                        log.audit('SO/Fulfillment → Invoice Map', { count: Object.keys(invMapByCreatedFrom).length, invMapByCreatedFrom });
                    } catch (invLookupErr) {
                        log.error('Error fetching Customer Invoice tranids for fulfillments', invLookupErr);
                    }

                    // Populate invoice_no on fulfillment transactions using the Invoice map
                    Object.values(txMap).forEach(tx => {
                        if (tx.qty_issued > 0) {
                            const foundInv = (tx.tran_id && invMapByCreatedFrom[tx.tran_id]) ||
                                             (tx.created_from_id && invMapByCreatedFrom[tx.created_from_id]) || '';
                            if (foundInv) {
                                tx.invoice_no = foundInv;
                            }
                        }
                    });
                }

                // --- B3. DIRECT INVOICES & BILLS (no SO / no PO) ---
                // Fetch Customer Invoices and Vendor Bills created directly without a Sales Order or Purchase Order.
                // These represent standalone financial transactions and are appended as separate rows
                // after the normal Item Receipt / Item Fulfillment lines for each item.
                const directBaseFilters = [
                    ["item", "noneof", "@NONE@"],
                    "AND",
                    ["mainline", "is", "F"],
                    "AND",
                    ["taxline", "is", "F"],
                    "AND",
                    ["shipping", "is", "F"],
                    "AND",
                    ["cogs", "is", "F"],
                    "AND",
                    ["createdfrom", "anyof", "@NONE@"],
                    "AND",
                    ["trandate", "within", fromDateStr, toDateStr]
                ];
                // Apply category-resolved item IDs (or explicit itemId) to direct invoice/bill filter
                if (itemId) {
                    directBaseFilters.push("AND", ["item", "anyof", itemId]);
                } else if (categoryFilteredItemIds && categoryFilteredItemIds.length > 0) {
                    directBaseFilters.push("AND", ["item", "anyof", categoryFilteredItemIds]);
                }
                if (subId) directBaseFilters.push("AND", ["subsidiary", "anyof", subId]);
                if (divisionId) {
                    directBaseFilters.push("AND", [
                        ["class", "anyof", targetClassId],
                        "OR",
                        ["cseg_njt_divisions", "anyof", targetCsegId]
                    ]);
                }

                // Shared columns for direct searches
                const directColItem       = search.createColumn({ name: "item" });
                const directColItemCode   = search.createColumn({ name: "itemid",  join: "item" });
                const directColItemName   = search.createColumn({ name: "displayname", join: "item" });
                const directColTranid     = search.createColumn({ name: "tranid" });
                const directColTxnNum     = search.createColumn({ name: "transactionnumber" });
                const directColDate       = search.createColumn({ name: "trandate", sort: search.Sort.ASC });
                const directColClass      = search.createColumn({ name: "class" });
                const directColDivision   = search.createColumn({ name: "cseg_njt_divisions" });
                const directColQty        = search.createColumn({ name: "quantity" });
                const directColRate       = search.createColumn({ name: "rate" });
                const directColAmount     = search.createColumn({ name: "amount" });

                // Type-specific entity columns:
                // CustInvc → 'customer' join  |  VendBill → 'vendor' join
                // Using type-specific joins avoids SSS_INVALID_SRCH_COLUMN_JOIN
                // and gives reliable altname (full display name) for each entity type
                const directInvcEntityCol  = search.createColumn({ name: "altname", join: "customer" });
                const directInvcEntityCode = search.createColumn({ name: "entityid", join: "customer" });
                const directBillEntityCol  = search.createColumn({ name: "altname", join: "vendor" });
                const directBillEntityCode = search.createColumn({ name: "entityid", join: "vendor" });

                const directSharedCols = [
                    directColItem, directColItemCode, directColItemName,
                    directColTranid, directColTxnNum, directColDate,
                    directColClass, directColDivision,
                    directColQty, directColRate, directColAmount
                ];

                // pushDirectTx: entityCol/entityCodeCol passed per-search for type-specific resolution
                const pushDirectTx = (res, isInvoice, entityCol, entityCodeCol) => {
                    const itmId = res.getValue(directColItem);
                    if (!itmId) return;
                    const itmCode = res.getValue(directColItemCode) || '';
                    const itmName = res.getValue(directColItemName) || '';
                    const qty    = Math.abs(parseFloat(res.getValue(directColQty))   || 0);
                    const rate   = parseFloat(res.getValue(directColRate))            || 0;
                    const amount = Math.abs(parseFloat(res.getValue(directColAmount)) || 0) || (qty * rate);
                    const tranid  = res.getValue(directColTranid)  || '';
                    const txnNum  = res.getValue(directColTxnNum)  || tranid;
                    const docNo   = isInvoice ? tranid : txnNum;
                    // altname join customer/vendor gives the entity full display name reliably
                    const entityName = res.getValue(entityCol) || res.getValue(entityCodeCol) || '';
                    const divisionStr = res.getText(directColClass) || res.getText(directColDivision) || '';

                    if (!itemsMap[itmId]) {
                        itemsMap[itmId] = {
                            item_id: itmId, item_code: itmCode, item_name: itmName,
                            opening_qty: 0, opening_value: 0, opening_rate: 0, transactions: []
                        };
                    }
                    itemsMap[itmId].transactions.push({
                        tran_id: res.id,
                        created_from_id: '',
                        date: res.getValue(directColDate) || '',
                        division: divisionStr,
                        doc_no: docNo,
                        invoice_no: docNo,
                        account_name: entityName,
                        sales_order_no: '',
                        qty_received:  isInvoice ? 0      : qty,
                        rate_received: isInvoice ? 0      : rate,
                        cost_received: isInvoice ? 0      : amount,
                        qty_issued:    isInvoice ? qty    : 0,
                        rate_issued:   isInvoice ? rate   : 0,
                        value_issued:  isInvoice ? amount : 0,
                        balance_qty: 0, balance_value: 0, average_rate: rate,
                        is_direct: true
                    });
                };

                // B3a. Direct Customer Invoices (OUT — no Sales Order)
                // Entity resolved via 'customer' join which is valid in CustInvc search
                try {
                    const directInvcSearch = search.create({
                        type: "transaction",
                        filters: [["type", "anyof", "CustInvc"], "AND", ...directBaseFilters],
                        columns: [...directSharedCols, directInvcEntityCol, directInvcEntityCode]
                    });
                    const directInvcPaged = directInvcSearch.runPaged({ pageSize: 1000 });
                    directInvcPaged.pageRanges.forEach(pr => {
                        directInvcPaged.fetch({ index: pr.index }).data.forEach(res =>
                            pushDirectTx(res, true, directInvcEntityCol, directInvcEntityCode));
                    });
                    log.audit('Direct Customer Invoices fetched', { count: directInvcPaged.count });
                } catch (e) {
                    log.error('Error fetching direct Customer Invoices (B3a)', e);
                }

                // B3b. Direct Vendor Bills (IN — no Purchase Order)
                // Entity resolved via 'vendor' join which is valid in VendBill search
                try {
                    const directBillSearch = search.create({
                        type: "transaction",
                        filters: [["type", "anyof", "VendBill"], "AND", ...directBaseFilters],
                        columns: [...directSharedCols, directBillEntityCol, directBillEntityCode]
                    });
                    const directBillPaged = directBillSearch.runPaged({ pageSize: 1000 });
                    directBillPaged.pageRanges.forEach(pr => {
                        directBillPaged.fetch({ index: pr.index }).data.forEach(res =>
                            pushDirectTx(res, false, directBillEntityCol, directBillEntityCode));
                    });
                    log.audit('Direct Vendor Bills fetched', { count: directBillPaged.count });
                } catch (e) {
                    log.error('Error fetching direct Vendor Bills (B3b)', e);
                }

                // --- C. FETCH NETSUITE INVENTORY BALANCES & CALCULATE ITEM BALANCES ---
                const reportItemsList = Object.values(itemsMap);
                const allItemIds = reportItemsList.map(g => g.item_id).filter(Boolean);
                const itemBalanceMap = getItemInventoryBalances(allItemIds, subId);

                // Bulk fetch Sales Order selling rates for all item fulfillment transactions
                const fulfillmentList = [];
                reportItemsList.forEach(grp => {
                    grp.transactions.forEach(tx => {
                        if (tx.qty_issued > 0) {
                            fulfillmentList.push({
                                tranId: tx.tran_id,
                                createdFromId: tx.created_from_id,
                                salesOrderNo: tx.sales_order_no,
                                itemId: grp.item_id
                            });
                        }
                    });
                });
                const soRateMap = getSalesOrderLineRates(fulfillmentList);

                reportItemsList.forEach(itemGroup => {
                    const itemData = itemBalanceMap[itemGroup.item_id] || { onHand: 0, rate: 0, basePrice: 0 };
                    const defaultRate = itemData.rate || 0;
                    const invBalanceQty = itemData.onHand;
                    // Base Price from item's Sales/Pricing tab — used for Balance Value column
                    const itemBasePrice = itemData.basePrice || 0;
                    itemGroup.base_price = itemBasePrice;

                    let runningRate = itemGroup.opening_rate || defaultRate;

                    // First pass: find initial non-zero rate if opening_rate was 0
                    if (runningRate <= 0) {
                        for (let i = 0; i < itemGroup.transactions.length; i++) {
                            const t = itemGroup.transactions[i];
                            if (t.rate_received > 0) {
                                runningRate = t.rate_received;
                                break;
                            } else if (t.rate_issued > 0) {
                                runningRate = t.rate_issued;
                                break;
                            }
                        }
                    }

                    // Calculate Opening Stock Quantity (beginning stock before period transactions)
                    let openingQty = itemGroup.opening_qty;
                    if (!openingQty && openingQty !== 0) {
                        let sumInPeriod = 0;
                        let sumOutPeriod = 0;
                        itemGroup.transactions.forEach(t => {
                            sumInPeriod += t.qty_received || 0;
                            sumOutPeriod += t.qty_issued || 0;
                        });
                        openingQty = Math.max(0, invBalanceQty - sumInPeriod + sumOutPeriod);
                    } else if (openingQty === 0 && invBalanceQty > 0) {
                        let sumInPeriod = 0;
                        let sumOutPeriod = 0;
                        itemGroup.transactions.forEach(t => {
                            sumInPeriod += t.qty_received || 0;
                            sumOutPeriod += t.qty_issued || 0;
                        });
                        if (sumInPeriod > 0 || sumOutPeriod > 0) {
                            const calcOp = invBalanceQty - sumInPeriod + sumOutPeriod;
                            if (calcOp >= 0) openingQty = calcOp;
                        }
                    }

                    itemGroup.opening_qty = openingQty;
                    itemGroup.opening_rate = runningRate;
                    // Opening Balance Value = Opening Qty × Base Price (zero if no base price)
                    itemGroup.opening_value = itemBasePrice > 0 ? (itemGroup.opening_qty * itemBasePrice) : 0;

                    let runningQty = itemGroup.opening_qty;

                    itemGroup.transactions.forEach(tx => {
                        // Received items rate & cost fallback
                        if (tx.qty_received > 0) {
                            runningQty += tx.qty_received;
                            if (tx.rate_received > 0) {
                                runningRate = tx.rate_received;
                            } else if (tx.cost_received > 0 && tx.qty_received > 0) {
                                tx.rate_received = tx.cost_received / tx.qty_received;
                                runningRate = tx.rate_received;
                            } else {
                                tx.rate_received = runningRate;
                                tx.cost_received = tx.qty_received * tx.rate_received;
                            }
                        }

                        // Issued items: Primary rate is Sales Order line rate, fallback to runningRate
                        if (tx.qty_issued > 0) {
                            runningQty -= tx.qty_issued;
                            const keyById = tx.created_from_id ? `${tx.created_from_id}_${itemGroup.item_id}` : '';
                            const keyByTran = tx.sales_order_no ? `${tx.sales_order_no}_${itemGroup.item_id}` : '';
                            const cleanTran = tx.sales_order_no ? tx.sales_order_no.replace(/^Sales Order #/i, '').trim() : '';
                            const keyByCleanTran = cleanTran ? `${cleanTran}_${itemGroup.item_id}` : '';
                            const keyByFulfill = tx.tran_id ? `${tx.tran_id}_${itemGroup.item_id}` : '';

                            const salesOrderRate = (keyById && soRateMap[keyById]) ||
                                                   (keyByTran && soRateMap[keyByTran]) ||
                                                   (keyByCleanTran && soRateMap[keyByCleanTran]) ||
                                                   (keyByFulfill && soRateMap[keyByFulfill]) || 0;

                            if (salesOrderRate > 0) {
                                tx.rate_issued = salesOrderRate;
                            } else if (tx.rate_issued <= 0) {
                                tx.rate_issued = runningRate;
                            }
                            tx.value_issued = tx.qty_issued * tx.rate_issued;
                        }

                        tx.balance_qty = runningQty;
                        tx.average_rate = runningRate;
                        // Balance Value = Balance Qty × Item Base Price (zero if no base price on item record)
                        tx.balance_value = itemBasePrice > 0 ? (tx.balance_qty * itemBasePrice) : 0;
                    });
                });

                // --- D. FILTER ITEMS BY BALANCE QTY REQUIREMENT ---
                // Enhancement: If the item had zero Balance Qty before transactions happened (opening_qty == 0)
                // and did NOT have an Inventory Adjustment, Item Receipt, or stock incoming that created/impacted a balance quantity,
                // do NOT show that item.
                // If the item HAD a balance quantity before transaction happened (opening_qty != 0), SHOW that item with that Balance Qty.
                const filteredReportItems = reportItemsList.filter(itemGroup => {
                    const hasOpeningStock = (itemGroup.opening_qty && Math.abs(itemGroup.opening_qty) > 0.0001);

                    const hasStockInOrAdjustment = itemGroup.transactions && itemGroup.transactions.some(tx => {
                        return (tx.qty_received && tx.qty_received > 0);
                    });

                    const hasPositiveBalance = itemGroup.transactions && itemGroup.transactions.some(tx => {
                        return (tx.balance_qty && tx.balance_qty > 0);
                    });

                    return hasOpeningStock || hasStockInOrAdjustment || hasPositiveBalance;
                });

                return filteredReportItems;

            } catch (e) {
                log.error('Error in getStockLedgerData', e);
                return [];
            }
        }

        /**
         * Bulk query Sales Order line rates for Item Fulfillments using N/search & SuiteQL fallback
         */
        function getSalesOrderLineRates(fulfillmentList) {
            const rateMap = {};
            if (!fulfillmentList || fulfillmentList.length === 0) return rateMap;

            const soInternalIds = [];
            const soTranIds = [];
            const itemIds = [];

            fulfillmentList.forEach(item => {
                if (item.createdFromId && !soInternalIds.includes(item.createdFromId)) {
                    soInternalIds.push(item.createdFromId);
                }
                if (item.salesOrderNo) {
                    const rawNo = item.salesOrderNo;
                    const cleanNo = rawNo.replace(/^Sales Order #/i, '').trim();
                    if (!soTranIds.includes(rawNo)) soTranIds.push(rawNo);
                    if (cleanNo && !soTranIds.includes(cleanNo)) soTranIds.push(cleanNo);
                }
                if (item.itemId && !itemIds.includes(item.itemId)) {
                    itemIds.push(item.itemId);
                }
            });

            if (soInternalIds.length === 0 && soTranIds.length === 0) return rateMap;

            try {
                const filters = [
                    ['type', 'anyof', 'SalesOrd'],
                    'AND',
                    ['mainline', 'is', 'F'],
                    'AND',
                    ['taxline', 'is', 'F'],
                    'AND',
                    ['shipping', 'is', 'F'],
                    'AND',
                    ['cogs', 'is', 'F']
                ];

                const idFilters = [];
                if (soInternalIds.length > 0) {
                    idFilters.push(['internalid', 'anyof', soInternalIds]);
                }
                if (soTranIds.length > 0) {
                    if (idFilters.length > 0) idFilters.push('OR');
                    idFilters.push(['tranid', 'anyof', soTranIds]);
                }
                if (idFilters.length > 0) {
                    filters.push('AND', idFilters);
                }

                if (itemIds.length > 0) {
                    filters.push('AND', ['item', 'anyof', itemIds]);
                }

                const soSearch = search.create({
                    type: 'transaction',
                    filters: filters,
                    columns: [
                        search.createColumn({ name: 'internalid' }),
                        search.createColumn({ name: 'tranid' }),
                        search.createColumn({ name: 'item' }),
                        search.createColumn({ name: 'rate' }),
                        search.createColumn({ name: 'amount' }),
                        search.createColumn({ name: 'quantity' })
                    ]
                });

                const paged = soSearch.runPaged({ pageSize: 1000 });
                paged.pageRanges.forEach(pr => {
                    paged.fetch({ index: pr.index }).data.forEach(res => {
                        const internalId = res.id;
                        const tranId = res.getValue({ name: 'tranid' });
                        const itmId = res.getValue({ name: 'item' });
                        let rateVal = parseFloat(res.getValue({ name: 'rate' })) || 0;

                        if (rateVal === 0) {
                            const qty = Math.abs(parseFloat(res.getValue({ name: 'quantity' }))) || 0;
                            const amt = Math.abs(parseFloat(res.getValue({ name: 'amount' }))) || 0;
                            if (qty > 0) {
                                rateVal = amt / qty;
                            }
                        }

                        if (itmId && rateVal > 0) {
                            if (internalId) rateMap[`${internalId}_${itmId}`] = rateVal;
                            if (tranId) rateMap[`${tranId}_${itmId}`] = rateVal;
                        }
                    });
                });

                log.audit('Sales Order Rates Map via N/search', { rateMapKeysCount: Object.keys(rateMap).length, rateMap });

            } catch (e) {
                log.error('Error fetching Sales Order line rates via N/search', e);

                // SuiteQL Fallback
                try {
                    let whereClause = "t.type = 'SalesOrd'";
                    const conds = [];
                    if (soInternalIds.length > 0) conds.push(`t.id IN (${soInternalIds.join(',')})`);
                    if (soTranIds.length > 0) conds.push(`t.tranid IN (${soTranIds.map(id => `'${id}'`).join(',')})`);
                    if (conds.length > 0) whereClause += ` AND (${conds.join(' OR ')})`;
                    if (itemIds.length > 0) whereClause += ` AND tl.item IN (${itemIds.join(',')})`;

                    const sql = `
                        SELECT t.id AS so_id, t.tranid, tl.item AS item_id, 
                               NVL(tl.rate, CASE WHEN NVL(tl.quantity, 0) <> 0 THEN ABS(tl.foreignamount / tl.quantity) ELSE 0 END) AS rate
                        FROM transaction t
                        JOIN transactionline tl ON t.id = tl.transaction
                        WHERE ${whereClause}
                    `;
                    const results = query.runSuiteQL({ query: sql }).asMappedResults();
                    results.forEach(r => {
                        const rateVal = parseFloat(r.rate) || 0;
                        if (rateVal > 0) {
                            if (r.so_id && r.item_id) rateMap[`${r.so_id}_${r.item_id}`] = rateVal;
                            if (r.tranid && r.item_id) rateMap[`${r.tranid}_${r.item_id}`] = rateVal;
                        }
                    });
                } catch (sqlErr) {
                    log.error('Error fetching Sales Order line rates via SuiteQL', sqlErr);
                }
            }

            return rateMap;
        }

        /**
         * Fetch current NetSuite inventory balance (Quantity On Hand) & Item Rate for given item IDs and optional subsidiary
         */
        function getItemInventoryBalances(itemIds, subId) {
            const balanceMap = {};
            if (!itemIds || itemIds.length === 0) return balanceMap;

            try {
                const filters = [
                    ['internalid', 'anyof', itemIds]
                ];
                if (subId) {
                    filters.push('AND', ['inventorylocation.subsidiary', 'anyof', subId]);
                }

                const itemSearch = search.create({
                    type: 'item',
                    filters: filters,
                    columns: [
                        search.createColumn({ name: 'locationquantityonhand' }),
                        search.createColumn({ name: 'quantityonhand' }),
                        search.createColumn({ name: 'cost' }),
                        search.createColumn({ name: 'averagecost' }),
                        // Base Price from item's Sales/Pricing tab (price level 1)
                        search.createColumn({ name: 'baseprice' })
                    ]
                });

                const itemPaged = itemSearch.runPaged({ pageSize: 1000 });
                itemPaged.pageRanges.forEach(pr => {
                    itemPaged.fetch({ index: pr.index }).data.forEach(res => {
                        const locOnHand = parseFloat(res.getValue({ name: 'locationquantityonhand' })) || 0;
                        const totalOnHand = subId ? locOnHand : (parseFloat(res.getValue({ name: 'quantityonhand' })) || locOnHand);
                        const purchaseCost = parseFloat(res.getValue({ name: 'cost' })) || 0;
                        const avgCost = parseFloat(res.getValue({ name: 'averagecost' })) || purchaseCost;
                        const basePrice = parseFloat(res.getValue({ name: 'baseprice' })) || 0;
                        balanceMap[res.id] = {
                            onHand: totalOnHand,
                            rate: avgCost || purchaseCost || 0,
                            basePrice: basePrice
                        };
                    });
                });
            } catch (e) {
                log.error('Error fetching item inventory balances via N/search', e);
                try {
                    // SuiteQL fallback: item table uses totalquantityonhand / averagecost
                    let sql = `SELECT id, NVL(totalquantityonhand, 0) AS onhand, NVL(averagecost, NVL(cost, 0)) AS rate FROM item WHERE id IN (${itemIds.join(',')})`;
                    if (subId) {
                        // inventorybalance table for subsidiary-specific balance
                        sql = `SELECT item AS id, SUM(quantityonhand) AS onhand, 0 AS rate FROM inventorybalance WHERE subsidiary = ${subId} AND item IN (${itemIds.join(',')}) GROUP BY item`;
                    }
                    const results = query.runSuiteQL({ query: sql }).asMappedResults();
                    results.forEach(r => {
                        balanceMap[r.id] = {
                            onHand: parseFloat(r.onhand) || 0,
                            rate: parseFloat(r.rate) || 0
                        };
                    });
                } catch (err) {
                    log.error('Error fetching item inventory balances via SuiteQL fallback', err);
                }
            }
            return balanceMap;
        }

        /**
         * Format numeric values cleanly
         */
        function formatNum(val, decimals = 2) {
            if (val === null || val === undefined || isNaN(val)) return '';
            if (val === 0) return '0.00';
            return parseFloat(val).toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        }

        /**
         * Escape HTML
         */
        function escapeHtml(str) {
            if (!str) return '';
            return xml.escape({ xmlText: String(str) });
        }

        /**
         * Sort Report Data by highlighted item header label (Item Code + Item Name)
         */
        function sortReportData(reportData, sortDir) {
            if (!reportData || !Array.isArray(reportData)) return;
            reportData.sort((a, b) => {
                const labelA = `${a.item_code || ''} ${a.item_name || ''}`.trim().toLowerCase();
                const labelB = `${b.item_code || ''} ${b.item_name || ''}`.trim().toLowerCase();
                const comp = labelA.localeCompare(labelB, undefined, { numeric: true, sensitivity: 'base' });
                return sortDir === 'desc' ? -comp : comp;
            });
        }

        /**
         * Build SJS Enersol Standard Executive HTML Dashboard
         */
        function buildHtmlReportView(opts) {
            const { reportData, filterOptions, fromDateStr, toDateStr, itemId, subId, divisionId, cat1Id, cat2Id, cat3Id, cat4Text, cat5Text, pageParam, pageSizeParam, sortDirParam = 'asc', sortColParam = 'itemcode', scriptId, deployId } = opts;

            const totalItems = reportData.length;
            const pageSize = pageSizeParam === 'all' ? totalItems : (parseInt(pageSizeParam, 10) || 25);
            const totalPages = Math.max(1, Math.ceil(totalItems / (pageSize || 1)));
            const currentPage = Math.min(Math.max(1, pageParam), totalPages);

            const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize;
            const endIndex = totalItems === 0 ? 0 : Math.min(startIndex + pageSize, totalItems);

            const pagedReportData = reportData.slice(startIndex, endIndex);

            // Calculate KPI Dashboard Totals across ALL items
            let totalQtyRec = 0;
            let totalCostRec = 0;
            let totalQtyIss = 0;
            let totalValIss = 0;
            let totalBalQty = 0;
            let totalBalVal = 0;

            reportData.forEach(grp => {
                let lastBalQty = grp.opening_qty;
                let lastBalVal = grp.opening_value;

                grp.transactions.forEach(tx => {
                    totalQtyRec += tx.qty_received;
                    totalCostRec += tx.cost_received;
                    totalQtyIss += tx.qty_issued;
                    totalValIss += tx.value_issued;
                    lastBalQty = tx.balance_qty;
                    lastBalVal = tx.balance_value;
                });

                totalBalQty += lastBalQty;
                totalBalVal += lastBalVal;
            });

            const subOptions = filterOptions.subsidiaries.map(s =>
                `<option value="${s.id}" ${subId == s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`
            ).join('');

            const classOptions = filterOptions.divisions.map(c =>
                `<option value="${c.id}" ${divisionId == c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
            ).join('');

            const itemOptions = filterOptions.items.map(i =>
                `<option value="${i.id}" ${itemId == i.id ? 'selected' : ''}>${escapeHtml(i.code)}${i.displayname ? ' - ' + escapeHtml(i.displayname) : ''}</option>`
            ).join('');

            const cat1Options = (filterOptions.cat1 || []).map(c =>
                `<option value="${c.id}" ${cat1Id == c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
            ).join('');

            const cat2Options = (filterOptions.cat2 || []).map(c =>
                `<option value="${c.id}" ${cat2Id == c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
            ).join('');

            const cat3Options = (filterOptions.cat3 || []).map(c =>
                `<option value="${c.id}" ${cat3Id == c.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
            ).join('');

            // Determine which category type is currently active so we can pre-select the picker
            const activeCatType = cat1Id ? '1' : cat2Id ? '2' : cat3Id ? '3' : cat4Text ? '4' : cat5Text ? '5' : '';

            // Build Report Rows HTML using pagedReportData
            let reportRowsHtml = '';

            pagedReportData.forEach(group => {
                const itemHeaderLabel = `${escapeHtml(group.item_code)} ${escapeHtml(group.item_name)}`;
                const itemIdAttr = escapeHtml(group.item_id);

                // Item Header Row
                reportRowsHtml += `
                    <tr class="item-group-row" data-item-id="${itemIdAttr}">
                        <td colspan="7" class="item-header-title">${itemHeaderLabel}</td>
                        <td colspan="9"></td>
                    </tr>
                `;

                // Opening Stock Row
                reportRowsHtml += `
                    <tr class="opening-stock-row" data-item-id="${itemIdAttr}">
                        <td style="text-align:left;">${escapeHtml(group.item_code)}</td>
                        <td colspan="5"></td>
                        <td class="bold italic" style="text-align:left;">Opening Stock</td>
                        <td></td><td></td><td></td>
                        <td></td><td></td><td></td>
                        <td class="num font-mono bold">${formatNum(group.opening_qty)}</td>
                        <td class="num font-mono bold">${formatNum(group.opening_value)}</td>
                        <td class="num font-mono">${group.opening_rate > 0 ? formatNum(group.opening_rate) : ''}</td>
                    </tr>
                `;

                // Transaction Rows: regular first, then direct (no SO/PO) rows below
                const regularTxs = group.transactions.filter(tx => !tx.is_direct);
                const directTxs  = group.transactions.filter(tx =>  tx.is_direct);

                regularTxs.forEach(tx => {
                    reportRowsHtml += `
                        <tr class="data-row" data-item-id="${itemIdAttr}">
                            <td style="text-align:left;">${escapeHtml(group.item_code)}</td>
                            <td style="text-align:left;">${escapeHtml(tx.division)}</td>
                            <td style="text-align:left;">${escapeHtml(tx.doc_no)}</td>
                            <td style="text-align:left;">${escapeHtml(tx.invoice_no)}</td>
                            <td style="text-align:left;">${escapeHtml(tx.account_name)}</td>
                            <td style="text-align:center;">${escapeHtml(tx.date)}</td>
                            <td style="text-align:left;">${escapeHtml(tx.sales_order_no)}</td>
                            <!-- IN Received -->
                            <td class="num font-mono">${tx.qty_received > 0 ? formatNum(tx.qty_received) : ''}</td>
                            <td class="num font-mono">${tx.rate_received > 0 ? formatNum(tx.rate_received) : ''}</td>
                            <td class="num font-mono">${tx.cost_received > 0 ? formatNum(tx.cost_received) : ''}</td>
                            <!-- OUT Issued -->
                            <td class="num font-mono">${tx.qty_issued > 0 ? formatNum(tx.qty_issued) : ''}</td>
                            <td class="num font-mono">${tx.rate_issued > 0 ? formatNum(tx.rate_issued) : ''}</td>
                            <td class="num font-mono">${tx.value_issued > 0 ? formatNum(tx.value_issued) : ''}</td>
                            <!-- Cumulative Balances -->
                            <td class="num font-mono bold">${formatNum(tx.balance_qty)}</td>
                            <td class="num font-mono bold">${formatNum(tx.balance_value)}</td>
                            <td class="num font-mono">${formatNum(tx.average_rate)}</td>
                        </tr>
                    `;
                });

                if (directTxs.length > 0) {
                    // Separator row
                    reportRowsHtml += `
                        <tr class="direct-tx-separator" data-item-id="${itemIdAttr}">
                            <td colspan="16" style="padding:4px 12px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#F5F4F2; background:#F5F4F2; border-top:1px dashed #F5F4F2; border-bottom:1px dashed #F5F4F2;">
                                
                            </td>
                        </tr>
                    `;
                    directTxs.forEach(tx => {
                        reportRowsHtml += `
                            <tr class="data-row direct-tx-row" data-item-id="${itemIdAttr}">
                                <td style="text-align:left;">${escapeHtml(group.item_code)}</td>
                                <td style="text-align:left;">${escapeHtml(tx.division)}</td>
                                <td style="text-align:left;">${escapeHtml(tx.doc_no)}</td>
                                <td style="text-align:left;">${escapeHtml(tx.invoice_no)}</td>
                                <td style="text-align:left;">${escapeHtml(tx.account_name)}</td>
                                <td style="text-align:center;">${escapeHtml(tx.date)}</td>
                                <td style="text-align:left;"></td>
                                <!-- IN Received -->
                                <td class="num font-mono">${tx.qty_received > 0 ? formatNum(tx.qty_received) : ''}</td>
                                <td class="num font-mono">${tx.rate_received > 0 ? formatNum(tx.rate_received) : ''}</td>
                                <td class="num font-mono">${tx.cost_received > 0 ? formatNum(tx.cost_received) : ''}</td>
                                <!-- OUT Issued -->
                                <td class="num font-mono">${tx.qty_issued > 0 ? formatNum(tx.qty_issued) : ''}</td>
                                <td class="num font-mono">${tx.rate_issued > 0 ? formatNum(tx.rate_issued) : ''}</td>
                                <td class="num font-mono">${tx.value_issued > 0 ? formatNum(tx.value_issued) : ''}</td>
                                <!-- No running balance for direct rows -->
                                <td></td><td></td><td></td>
                            </tr>
                        `;
                    });
                }
            });

            if (pagedReportData.length === 0) {
                reportRowsHtml = `
                    <tr>
                        <td colspan="16" class="no-data-msg">No stock ledger transactions found matching the selected criteria.</td>
                    </tr>
                `;
            }

            const pageOptionsHtml = Array.from({ length: totalPages }, (_, i) => i + 1)
                .map(p => `<option value="${p}" ${p === currentPage ? 'selected' : ''}>Page ${p} of ${totalPages}</option>`)
                .join('');

            const paginationHtml = `
                <div class="pagination-bar">
                    <div class="pagination-info">
                        Showing <strong>${totalItems > 0 ? startIndex + 1 : 0} - ${endIndex}</strong> of <strong>${totalItems}</strong> items
                    </div>
                    <div class="pagination-controls">
                        <div class="pagination-size">
                            <label>Items per page:</label>
                            <select onchange="changePageSize(this.value)">
                                <option value="10" ${pageSizeParam == '10' ? 'selected' : ''}>10</option>
                                <option value="25" ${pageSizeParam == '25' ? 'selected' : ''}>25</option>
                                <option value="50" ${pageSizeParam == '50' ? 'selected' : ''}>50</option>
                                <option value="100" ${pageSizeParam == '100' ? 'selected' : ''}>100</option>
                                <option value="250" ${pageSizeParam == '250' ? 'selected' : ''}>250</option>
                                <option value="all" ${pageSizeParam == 'all' ? 'selected' : ''}>All</option>
                            </select>
                        </div>

                        <button type="button" class="btn-page" onclick="goToPage(1)" ${currentPage <= 1 ? 'disabled' : ''}>&laquo; First</button>
                        <button type="button" class="btn-page" onclick="goToPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>&lsaquo; Prev</button>

                        <select class="page-select" onchange="goToPage(this.value)">
                            ${pageOptionsHtml}
                        </select>

                        <button type="button" class="btn-page" onclick="goToPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>Next &rsaquo;</button>
                        <button type="button" class="btn-page" onclick="goToPage(${totalPages})" ${currentPage >= totalPages ? 'disabled' : ''}>Last &raquo;</button>
                    </div>
                </div>
            `;

            return `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>SJS Enersol - Stock Ledger IN/OUT Report</title>
                    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap">
                    <style>
                        :root {
                            --primary: #0284c7;
                            --primary-hover: #0369a1;
                            --primary-light: rgba(2, 132, 199, 0.1);
                            --bg-body: #f8fafc;
                            --card-bg: #ffffff;
                            --text-main: #0f172a;
                            --text-muted: #64748b;
                            --border-color: #e2e8f0;
                            --success: #10b981;
                            --success-light: #dcfce7;
                            --danger: #ef4444;
                            --danger-light: #fee2e2;
                            --amber-bg: #fffbeb;
                        }

                        * { box-sizing: border-box; }
                        body {
                            font-family: "Inter", -apple-system, sans-serif;
                            background-color: var(--bg-body);
                            color: var(--text-main);
                            margin: 0;
                            padding: 0;
                            -webkit-font-smoothing: antialiased;
                        }

                        /* SJS Enersol Official App Header */
                        .app-header {
                            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                            color: #ffffff;
                            padding: 24px 32px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            border-bottom: 4px solid var(--primary);
                            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                        }

                        .header-title h1 {
                            margin: 0;
                            font-size: 22px;
                            font-weight: 800;
                            letter-spacing: -0.5px;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        }

                        .header-title h1 span {
                            color: var(--primary);
                            font-weight: 400;
                        }

                        .header-subtitle {
                            margin: 4px 0 0 0;
                            font-size: 13px;
                            color: #94a3b8;
                            font-weight: 400;
                        }

                        /* Filter Controls Panel */
                        .filter-panel {
                            background-color: var(--card-bg);
                            border-bottom: 1px solid var(--border-color);
                            padding: 20px 32px;
                            display: flex;
                            flex-wrap: wrap;
                            gap: 16px;
                            align-items: center;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                        }

                        .filter-group {
                            display: flex;
                            flex-direction: column;
                            gap: 6px;
                        }

                        .filter-label {
                            font-size: 11px;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            color: var(--text-muted);
                        }

                        .filter-panel select, .filter-panel input[type="text"] {
                            background-color: #f8fafc;
                            border: 1px solid #cbd5e1;
                            color: var(--text-main);
                            padding: 9px 14px;
                            border-radius: 8px;
                            font-size: 13px;
                            font-weight: 600;
                            min-width: 160px;
                            outline: none;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        }

                        .filter-panel select:hover, .filter-panel select:focus,
                        .filter-panel input[type="text"]:hover, .filter-panel input[type="text"]:focus {
                            border-color: var(--primary);
                            background-color: #ffffff;
                            box-shadow: 0 0 0 3px var(--primary-light);
                        }

                        /* Dashboard KPI Cards Grid */
                        .dashboard-metrics {
                            display: flex;
                            gap: 16px;
                            padding: 20px 32px;
                            overflow-x: auto;
                        }

                        .metric-card {
                            flex: 1;
                            min-width: 170px;
                            background-color: var(--card-bg);
                            border: 1px solid var(--border-color);
                            border-radius: 12px;
                            padding: 16px 20px;
                            display: flex;
                            flex-direction: column;
                            gap: 4px;
                            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
                            transition: all 0.25s ease;
                            position: relative;
                            overflow: hidden;
                        }

                        .metric-card:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 8px 15px -4px rgba(0, 0, 0, 0.06);
                            border-color: #cbd5e1;
                        }

                        .metric-card::before {
                            content: '';
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 4px;
                            height: 100%;
                        }

                        .metric-card.items::before { background-color: #3b82f6; }
                        .metric-card.received::before { background-color: var(--success); }
                        .metric-card.issued::before { background-color: #ef4444; }
                        .metric-card.balance::before { background-color: var(--primary); }

                        .metric-value {
                            font-size: 22px;
                            font-weight: 800;
                            color: var(--text-main);
                            line-height: 1.1;
                        }

                        .metric-label {
                            font-size: 11px;
                            font-weight: 700;
                            color: var(--text-muted);
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        }

                        /* Report Section Workspace */
                        .report-section {
                            background-color: var(--card-bg);
                            margin: 0 32px 32px 32px;
                            border: 1px solid var(--border-color);
                            border-radius: 12px;
                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
                            overflow: hidden;
                        }

                        .report-toolbar {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            padding: 16px 24px;
                            border-bottom: 1px solid var(--border-color);
                            background-color: #fafbfc;
                        }

                        .search-container input {
                            padding: 9px 16px;
                            border: 1px solid #cbd5e1;
                            border-radius: 8px;
                            width: 300px;
                            font-size: 13px;
                            outline: none;
                            background-color: #ffffff;
                            transition: all 0.2s ease;
                        }

                        .search-container input:focus {
                            border-color: var(--primary);
                            box-shadow: 0 0 0 3px var(--primary-light);
                            width: 340px;
                        }

                        .action-buttons {
                            display: flex;
                            gap: 10px;
                        }

                        .btn {
                            padding: 9px 18px;
                            border-radius: 8px;
                            font-size: 13px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            outline: none;
                            display: inline-flex;
                            align-items: center;
                            gap: 6px;
                        }

                        .btn-primary {
                            background-color: var(--primary);
                            border: 1px solid var(--primary);
                            color: #ffffff;
                        }

                        .btn-primary:hover {
                            background-color: var(--primary-hover);
                        }

                        .btn-export {
                            background-color: #ffffff;
                            border: 1px solid var(--success);
                            color: var(--success);
                        }

                        .btn-export:hover {
                            background-color: var(--success);
                            color: #ffffff;
                            box-shadow: 0 4px 10px rgba(16, 185, 129, 0.15);
                        }

                        .btn-pdf {
                            background-color: #ffffff;
                            border: 1px solid var(--danger);
                            color: var(--danger);
                        }

                        .btn-pdf:hover {
                            background-color: var(--danger);
                            color: #ffffff;
                            box-shadow: 0 4px 10px rgba(239, 68, 68, 0.15);
                        }

                        /* Pagination Bar */
                        .pagination-bar {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            padding: 12px 24px;
                            background: #ffffff;
                            border-bottom: 1px solid var(--border-color);
                            flex-wrap: wrap;
                            gap: 10px;
                        }

                        .pagination-info {
                            font-size: 12px;
                            color: var(--text-muted);
                        }

                        .pagination-controls {
                            display: flex;
                            align-items: center;
                            gap: 6px;
                        }

                        .pagination-size {
                            display: flex;
                            align-items: center;
                            gap: 6px;
                            font-size: 12px;
                            margin-right: 12px;
                            color: var(--text-muted);
                        }

                        .pagination-size select, .page-select {
                            padding: 6px 10px;
                            font-size: 12px;
                            border-radius: 6px;
                            border: 1px solid #cbd5e1;
                            background: #ffffff;
                            cursor: pointer;
                        }

                        .btn-page {
                            padding: 6px 12px;
                            font-size: 12px;
                            font-weight: 600;
                            border: 1px solid #cbd5e1;
                            background: #ffffff;
                            color: var(--text-main);
                            border-radius: 6px;
                            cursor: pointer;
                            transition: all 0.15s ease;
                        }

                        .btn-page:hover:not(:disabled) {
                            background: var(--primary);
                            color: #ffffff;
                            border-color: var(--primary);
                        }

                        .btn-page:disabled {
                            opacity: 0.4;
                            cursor: not-allowed;
                        }

                        /* Data Grid Styling */
                        .grid-container {
                            overflow-x: auto;
                            max-height: 62vh;
                        }

                        table {
                            width: 100%;
                            border-collapse: separate;
                            border-spacing: 0;
                        }

                        th {
                            background-color: #404a7a;
                            color: #ffffff;
                            font-size: 11px;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            padding: 12px 14px;
                            border-bottom: 2px solid var(--border-color);
                            border-right: 1px solid #333b63;
                            position: sticky;
                            top: 0;
                            z-index: 10;
                            text-align: center;
                            white-space: nowrap;
                        }

                        th.sortable-header {
                            cursor: pointer;
                            user-select: none;
                            transition: background-color 0.2s ease, color 0.2s ease;
                        }

                        th.sortable-header:hover {
                            background-color: #333b63;
                            color: #38bdf8;
                        }

                        .sort-icon {
                            display: inline-block;
                            margin-left: 5px;
                            font-size: 11px;
                            color: #38bdf8;
                        }

                        td {
                            padding: 10px 14px;
                            font-size: 12.5px;
                            color: #334155;
                            border-bottom: 1px solid #f1f5f9;
                            border-right: 1px solid #f1f5f9;
                            vertical-align: middle;
                            background-color: #ffffff;
                            white-space: nowrap;
                            transition: background-color 0.15s ease;
                        }

                        tr:hover td {
                            background-color: #f8fafc;
                        }

                        .item-group-row td {
                            background-color: #f1f5f9;
                            font-weight: 700;
                            color: var(--text-main);
                        }

                        .item-header-title {
                            font-size: 13px;
                            padding: 12px 14px !important;
                        }

                        .opening-stock-row td {
                            background-color: #ffffff;
                        }

                        .num {
                            text-align: right;
                            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                            font-size: 13px;
                        }

                        .bold { font-weight: 700; }
                        .italic { font-style: italic; }
                        .no-data-msg { text-align: center; padding: 60px; font-size: 14px; color: var(--text-muted); }

                        /* Category Popover Filter */
                        .cat-filter-wrapper {
                            position: relative;
                        }
                        .cat-filter-btn {
                            background-color: #f8fafc;
                            border: 1px solid #cbd5e1;
                            color: var(--text-main);
                            padding: 9px 14px;
                            border-radius: 8px;
                            font-size: 13px;
                            font-family: inherit;
                            font-weight: 600;
                            min-width: 160px;
                            text-align: left;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            gap: 8px;
                            transition: all 0.2s ease;
                        }
                        .cat-filter-btn:hover {
                            border-color: var(--primary);
                            background-color: #ffffff;
                            box-shadow: 0 0 0 3px var(--primary-light);
                        }
                        .cat-filter-btn.active {
                            border-color: var(--primary);
                            background-color: var(--primary-light);
                            color: var(--primary);
                        }
                        .cat-filter-panel {
                            position: absolute;
                            top: calc(100% + 8px);
                            left: 0;
                            z-index: 9999;
                            background: #ffffff;
                            border: 1px solid #cbd5e1;
                            border-radius: 12px;
                            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
                            padding: 16px;
                            min-width: 300px;
                            display: flex;
                            flex-direction: column;
                            gap: 12px;
                        }
                        .cat-panel-row {
                            display: flex;
                            flex-direction: column;
                            gap: 5px;
                        }
                        .cat-panel-label {
                            font-size: 11px;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            color: var(--text-muted);
                        }
                        .cat-panel-row select,
                        .cat-panel-row input[type="text"] {
                            width: 100%;
                            background-color: #f8fafc;
                            border: 1px solid #cbd5e1;
                            color: var(--text-main);
                            padding: 8px 12px;
                            border-radius: 7px;
                            font-size: 13px;
                            font-family: inherit;
                            font-weight: 500;
                            outline: none;
                            transition: all 0.2s ease;
                            box-sizing: border-box;
                        }
                        .cat-panel-row select:focus,
                        .cat-panel-row input[type="text"]:focus {
                            border-color: var(--primary);
                            background: #ffffff;
                            box-shadow: 0 0 0 3px var(--primary-light);
                        }
                        .cat-panel-divider {
                            border: none;
                            border-top: 1px solid var(--border-color);
                            margin: 0;
                        }
                        .cat-panel-footer {
                            display: flex;
                            gap: 8px;
                            justify-content: flex-end;
                        }
                    </style>
                    <script>
                        function toggleSort(col) {
                            var sortDirInput = document.getElementById('custpage_sortdir');
                            var currentDir = sortDirInput ? sortDirInput.value : 'asc';
                            var newDir = currentDir === 'asc' ? 'desc' : 'asc';
                            if (sortDirInput) sortDirInput.value = newDir;
                            var pageInput = document.getElementById('custpage_page');
                            if (pageInput) pageInput.value = 1;
                            document.getElementById('filterForm').submit();
                        }
                        function submitFilter() {
                            document.getElementById('custpage_page').value = 1;
                            document.getElementById('filterForm').submit();
                        }
                        function goToPage(page) {
                            document.getElementById('custpage_page').value = page;
                            document.getElementById('filterForm').submit();
                        }
                        function changePageSize(size) {
                            document.getElementById('custpage_pagesize').value = size;
                            document.getElementById('custpage_page').value = 1;
                            document.getElementById('filterForm').submit();
                        }
                        function exportCSV() {
                            var form = document.getElementById('filterForm');
                            var hiddenAction = document.getElementById('custpage_action');
                            hiddenAction.value = 'csv';
                            form.submit();
                            hiddenAction.value = '';
                        }
                        function exportPDF() {
                            var form = document.getElementById('filterForm');
                            var hiddenAction = document.getElementById('custpage_action');
                            hiddenAction.value = 'pdf';
                            form.submit();
                            hiddenAction.value = '';
                        }
                        function clientSearchTable() {
                            var input = document.getElementById("reportSearch");
                            var filter = input ? input.value.trim().toUpperCase() : "";
                            var itemHeaders = document.querySelectorAll(".item-group-row");

                            itemHeaders.forEach(function(header) {
                                var itemId = header.getAttribute("data-item-id");
                                var openingRow   = document.querySelector(".opening-stock-row[data-item-id='" + itemId + "']");
                                var separatorRow = document.querySelector(".direct-tx-separator[data-item-id='" + itemId + "']");
                                var dataRows     = document.querySelectorAll(".data-row[data-item-id='" + itemId + "']");

                                if (!filter) {
                                    header.style.display      = "";
                                    if (openingRow)   openingRow.style.display   = "";
                                    if (separatorRow) separatorRow.style.display = "";
                                    dataRows.forEach(function(r) { r.style.display = ""; });
                                    return;
                                }

                                var headerTxt    = (header.textContent || header.innerText || "").toUpperCase();
                                var headerMatches = headerTxt.indexOf(filter) > -1;

                                var anyDataRowMatches = false;
                                dataRows.forEach(function(r) {
                                    var txt = (r.textContent || r.innerText || "").toUpperCase();
                                    if (txt.indexOf(filter) > -1) {
                                        anyDataRowMatches = true;
                                        r.style.display = "";
                                    } else {
                                        r.style.display = headerMatches ? "" : "none";
                                    }
                                });

                                var groupVisible = headerMatches || anyDataRowMatches;
                                header.style.display      = groupVisible ? "" : "none";
                                if (openingRow)   openingRow.style.display   = groupVisible ? "" : "none";
                                if (separatorRow) separatorRow.style.display = groupVisible ? "" : "none";
                            });
                        }

                        function resetFilters() {
                            const baseUrl = window.location.href.split('?')[0];
                            const scriptVal = document.getElementById('script_id') ? document.getElementById('script_id').value : "${escapeHtml(scriptId)}";
                            const deployVal = document.getElementById('deploy_id') ? document.getElementById('deploy_id').value : "${escapeHtml(deployId)}";
                            window.location.href = baseUrl + '?script=' + scriptVal + '&deploy=' + deployVal;
                        }

                        // --- Category Popover ---
                        function toggleCatPanel(event) {
                            event.stopPropagation();
                            var panel = document.getElementById('cat_filter_panel');
                            if (!panel) return;
                            var isOpen = panel.style.display !== 'none';
                            panel.style.display = isOpen ? 'none' : '';
                        }

                        function clearCatFilters() {
                            var el;
                            el = document.getElementById('cat1_select'); if (el) el.value = '';
                            el = document.getElementById('cat2_select'); if (el) el.value = '';
                            el = document.getElementById('cat3_select'); if (el) el.value = '';
                            el = document.getElementById('cat4_input');  if (el) el.value = '';
                            el = document.getElementById('cat5_input');  if (el) el.value = '';
                            updateCatBtnLabel();
                        }

                        function updateCatBtnLabel() {
                            var btn = document.getElementById('cat_filter_btn');
                            if (!btn) return;
                            var active = [];
                            var c1 = document.getElementById('cat1_select'); if (c1 && c1.value) active.push('Cat 1');
                            var c2 = document.getElementById('cat2_select'); if (c2 && c2.value) active.push('Cat 2');
                            var c3 = document.getElementById('cat3_select'); if (c3 && c3.value) active.push('Cat 3');
                            var c4 = document.getElementById('cat4_input');  if (c4 && c4.value.trim()) active.push('Cat 4');
                            var c5 = document.getElementById('cat5_input');  if (c5 && c5.value.trim()) active.push('Cat 5');
                            if (active.length > 0) {
                                btn.querySelector('.cat-btn-text').textContent = active.join(', ');
                                btn.classList.add('active');
                            } else {
                                btn.querySelector('.cat-btn-text').textContent = 'All Categories';
                                btn.classList.remove('active');
                            }
                        }

                        // Close the popover when clicking anywhere outside it
                        document.addEventListener('click', function(e) {
                            var wrapper = document.getElementById('cat_filter_wrapper');
                            var panel = document.getElementById('cat_filter_panel');
                            if (wrapper && panel && !wrapper.contains(e.target)) {
                                panel.style.display = 'none';
                            }
                        });

                        document.addEventListener('DOMContentLoaded', function() {
                            updateCatBtnLabel();
                        });
                    </script>
                </head>
                <body>

                    <!-- SJS Enersol Official App Header -->
                    <header class="app-header">
                        <div class="header-title">
                            <h1>SJS ENERSOL <span>| Stock Ledger IN/OUT Report</span></h1>
                            <p class="header-subtitle">Interactive Dynamic Stock Ledger Receipts, Issues, and Cumulative Balances Dashboard</p>
                        </div>
                    </header>

                    <form id="filterForm" method="GET" action="${url.resolveScript({ scriptId: scriptId, deploymentId: deployId })}">
                        <input type="hidden" name="script" id="script_id" value="${escapeHtml(scriptId)}" />
                        <input type="hidden" name="deploy" id="deploy_id" value="${escapeHtml(deployId)}" />
                        <input type="hidden" name="action" id="custpage_action" value="" />
                        <input type="hidden" name="custpage_page" id="custpage_page" value="${currentPage}" />
                        <input type="hidden" name="custpage_pagesize" id="custpage_pagesize" value="${pageSizeParam}" />
                        <input type="hidden" name="custpage_sortdir" id="custpage_sortdir" value="${escapeHtml(sortDirParam)}" />
                        <input type="hidden" name="custpage_sortcol" id="custpage_sortcol" value="${escapeHtml(sortColParam)}" />

                        <!-- Filter Controls Panel -->
                        <section class="filter-panel">
                            <div class="filter-group">
                                <label class="filter-label">From Date</label>
                                <input type="text" name="custpage_fromdate" value="${escapeHtml(fromDateStr)}" placeholder="DD/MM/YYYY" />
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">To Date</label>
                                <input type="text" name="custpage_todate" value="${escapeHtml(toDateStr)}" placeholder="DD/MM/YYYY" />
                            </div>
                            <!-- Category Popover Filter -->
                            <div class="filter-group cat-filter-wrapper" id="cat_filter_wrapper">
                                <label class="filter-label">Category</label>
                                <button type="button" id="cat_filter_btn" class="cat-filter-btn" onclick="toggleCatPanel(event)">
                                    <span class="cat-btn-text">All Categories</span>
                                    <span>&#9660;</span>
                                </button>
                                <!-- Popover panel with all 5 category filters -->
                                <div id="cat_filter_panel" class="cat-filter-panel" style="display:none" onclick="event.stopPropagation()">
                                    <div class="cat-panel-row">
                                        <span class="cat-panel-label">Category 1</span>
                                        <select name="custpage_cat1" id="cat1_select" onchange="updateCatBtnLabel()">
                                            <option value="">All Cat 1</option>
                                            ${cat1Options}
                                        </select>
                                    </div>
                                    <div class="cat-panel-row">
                                        <span class="cat-panel-label">Category 2</span>
                                        <select name="custpage_cat2" id="cat2_select" onchange="updateCatBtnLabel()">
                                            <option value="">All Cat 2</option>
                                            ${cat2Options}
                                        </select>
                                    </div>
                                    <div class="cat-panel-row">
                                        <span class="cat-panel-label">Category 3</span>
                                        <select name="custpage_cat3" id="cat3_select" onchange="updateCatBtnLabel()">
                                            <option value="">All Cat 3</option>
                                            ${cat3Options}
                                        </select>
                                    </div>
                                    <div class="cat-panel-row">
                                        <span class="cat-panel-label">Category 4</span>
                                        <input type="text" name="custpage_cat4" id="cat4_input" value="${escapeHtml(cat4Text)}" placeholder="Type to search..." oninput="updateCatBtnLabel()" />
                                    </div>
                                    <div class="cat-panel-row">
                                        <span class="cat-panel-label">Category 5</span>
                                        <input type="text" name="custpage_cat5" id="cat5_input" value="${escapeHtml(cat5Text)}" placeholder="Type to search..." oninput="updateCatBtnLabel()" />
                                    </div>
                                    <hr class="cat-panel-divider" />
                                    <div class="cat-panel-footer">
                                        <button type="button" class="btn btn-page" onclick="clearCatFilters()">Clear</button>
                                        <button type="button" class="btn btn-primary" onclick="submitFilter()">Apply</button>
                                    </div>
                                </div>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">Item</label>
                                <select name="custpage_item" onchange="submitFilter()">
                                    <option value="">All Items</option>
                                    ${itemOptions}
                                </select>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">Division</label>
                                <select name="custpage_division" onchange="submitFilter()">
                                    <option value="">All Divisions</option>
                                    ${classOptions}
                                </select>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">Subsidiary</label>
                                <select name="custpage_subsidiary" onchange="submitFilter()">
                                    <option value="">All Subsidiaries</option>
                                    ${subOptions}
                                </select>
                            </div>
                            <div style="margin-left: auto; align-self: flex-end; display: flex; gap: 8px;">
                                <button type="button" class="btn btn-primary" onclick="submitFilter()">Apply Filters</button>
                                <button type="button" class="btn btn-page" onclick="resetFilters()">Reset</button>
                            </div>
                        </section>

                        <!-- Dashboard KPI Cards -->
                        <section class="dashboard-metrics">
                            <div class="metric-card items">
                                <span class="metric-value">${totalItems}</span>
                                <span class="metric-label">Total Items</span>
                            </div>
                            <div class="metric-card received">
                                <span class="metric-value">${formatNum(totalQtyRec)}</span>
                                <span class="metric-label">Qty Received</span>
                            </div>
                            <div class="metric-card issued">
                                <span class="metric-value">${formatNum(totalQtyIss)}</span>
                                <span class="metric-label">Qty Issued</span>
                            </div>
                            <div class="metric-card balance">
                                <span class="metric-value">${formatNum(totalBalQty)}</span>
                                <span class="metric-label">Cumulative Balance Qty</span>
                            </div>
                        </section>

                        <!-- Report Section Workspace -->
                        <section class="report-section">
                            <div class="report-toolbar">
                                <div class="search-container">
                                    <input type="text" id="reportSearch" placeholder="Search item, document or customer..." oninput="clientSearchTable()">
                                </div>
                                <div class="action-buttons">
                                    <button type="button" class="btn btn-export" onclick="exportCSV()">Export to CSV</button>
                                    <button type="button" class="btn btn-pdf" onclick="exportPDF()">Print PDF</button>
                                </div>
                            </div>

                            <!-- Upper Pagination Bar -->
                            ${paginationHtml}

                            <!-- Main Data Grid -->
                            <div class="grid-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th class="sortable-header" onclick="toggleSort('itemcode')" title="Click to sort by Item Code (${sortDirParam === 'asc' ? 'Descending' : 'Ascending'})">
                                                Item Code <span class="sort-icon">${sortDirParam === 'desc' ? '▼' : '▲'}</span>
                                            </th>
                                            <th>Division</th>
                                            <th>Document No</th>
                                            <th>Invoice No</th>
                                            <th>Account Name</th>
                                            <th>Date</th>
                                            <th>Sales Order No/ Invoice No</th>
                                            <th>Qty Received</th>
                                            <th>Rate received at</th>
                                            <th>Cost</th>
                                            <th>Qty. Issues</th>
                                            <th>Rate issued at</th>
                                            <th>Value of issue</th>
                                            <th>Balance Qty</th>
                                            <th>Balance Value</th>
                                            <th>Average Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${reportRowsHtml}
                                    </tbody>
                                </table>
                            </div>

                            <!-- Lower Pagination Bar -->
                            ${paginationHtml}
                        </section>
                    </form>
                </body>
                </html>
            `;
        }

        /**
         * Generate CSV Content for Excel Export
         */
        function generateCSVExport(reportData, fromDateStr, toDateStr) {
            let csv = [];
            csv.push(`SJS Enersol Engineering Works LLC.`);
            csv.push(`Stock Ledger IN/OUT Ledger ${fromDateStr} To ${toDateStr}`);
            csv.push(``);
            csv.push(`"Item Code","Division","Document No","Invoice No","Account Name","Date","Sales Order No/ Invoice No","Qty Received","Rate received at","Cost","Qty. Issues","Rate issued at","Value of issue","Balance Qty","Balance Value","Average Rate"`);

            reportData.forEach(group => {
                const groupTitle = `${group.item_code} ${group.item_name}`.replace(/"/g, '""');
                csv.push(`"${groupTitle}","","","","","","","","","","","","","","",""`);
                csv.push(`"${(group.item_code || '').replace(/"/g, '""')}","","","","","","Opening Stock","","","","","","","${group.opening_qty}","${group.opening_value.toFixed(2)}","${group.opening_rate.toFixed(2)}"`);

                group.transactions.forEach(tx => {
                    const row = [
                        `"${(group.item_code || '').replace(/"/g, '""')}"`,
                        `"${(tx.division || '').replace(/"/g, '""')}"`,
                        `"${(tx.doc_no || '').replace(/"/g, '""')}"`,
                        `"${(tx.invoice_no || '').replace(/"/g, '""')}"`,
                        `"${(tx.account_name || '').replace(/"/g, '""')}"`,
                        `"${tx.date}"`,
                        `"${(tx.sales_order_no || '').replace(/"/g, '""')}"`,
                        tx.qty_received > 0 ? tx.qty_received : '',
                        tx.rate_received > 0 ? tx.rate_received.toFixed(2) : '',
                        tx.cost_received > 0 ? tx.cost_received.toFixed(2) : '',
                        tx.qty_issued > 0 ? tx.qty_issued : '',
                        tx.rate_issued > 0 ? tx.rate_issued.toFixed(2) : '',
                        tx.value_issued > 0 ? tx.value_issued.toFixed(2) : '',
                        tx.balance_qty,
                        tx.balance_value.toFixed(2),
                        tx.average_rate.toFixed(2)
                    ];
                    csv.push(row.join(','));
                });
            });

            return csv.join('\r\n');
        }

        /**
         * Generate PDF Document for Print/Download
         */
        function generatePDFExport(reportData, fromDateStr, toDateStr) {
            let pdfRowsHtml = '';

            reportData.forEach(group => {
                pdfRowsHtml += `
                    <tr class="item-group-row">
                        <td colspan="7" style="background-color:#f1f5f9; font-weight:bold; font-size:6.5pt; color:#0f172a; padding:4px 2px;">
                            ${escapeHtml(group.item_code)} ${escapeHtml(group.item_name)}
                        </td>
                        <td colspan="9" style="background-color:#f1f5f9;"></td>
                    </tr>
                    <tr class="opening-stock-row">
                        <td>${escapeHtml(group.item_code)}</td>
                        <td colspan="5"></td>
                        <td class="bold italic" style="font-style:italic; font-weight:bold; color:#334155;">Opening Stock</td>
                        <td></td><td></td><td></td>
                        <td></td><td></td><td></td>
                        <td class="num bold">${formatNum(group.opening_qty)}</td>
                        <td class="num bold">${formatNum(group.opening_value)}</td>
                        <td class="num">${group.opening_rate > 0 ? formatNum(group.opening_rate) : ''}</td>
                    </tr>
                `;

                group.transactions.forEach(tx => {
                    pdfRowsHtml += `
                        <tr>
                            <td>${escapeHtml(group.item_code)}</td>
                            <td>${escapeHtml(tx.division)}</td>
                            <td>${escapeHtml(tx.doc_no)}</td>
                            <td>${escapeHtml(tx.invoice_no)}</td>
                            <td>${escapeHtml(tx.account_name)}</td>
                            <td align="center">${escapeHtml(tx.date)}</td>
                            <td>${escapeHtml(tx.sales_order_no)}</td>
                            <td class="num">${tx.qty_received > 0 ? formatNum(tx.qty_received) : ''}</td>
                            <td class="num">${tx.rate_received > 0 ? formatNum(tx.rate_received) : ''}</td>
                            <td class="num">${tx.cost_received > 0 ? formatNum(tx.cost_received) : ''}</td>
                            <td class="num">${tx.qty_issued > 0 ? formatNum(tx.qty_issued) : ''}</td>
                            <td class="num">${tx.rate_issued > 0 ? formatNum(tx.rate_issued) : ''}</td>
                            <td class="num">${tx.value_issued > 0 ? formatNum(tx.value_issued) : ''}</td>
                            <td class="num bold">${formatNum(tx.balance_qty)}</td>
                            <td class="num bold">${formatNum(tx.balance_value)}</td>
                            <td class="num">${formatNum(tx.average_rate)}</td>
                        </tr>
                    `;
                });
            });

            const currentDateStr = format.format({ value: new Date(), type: format.Type.DATE });

            const xmlStr = `<?xml version="1.0"?>
                <!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
                <pdf>
                <head>
                    <style type="text/css">
                        body {
                            font-family: sans-serif;
                            font-size: 5.5pt;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            table-layout: fixed;
                        }
                        th {
                            background-color: #2c385e;
                            color: #ffffff;
                            font-weight: bold;
                            padding: 4px 2px;
                            border: 0.5pt solid #1e2745;
                            font-size: 5.5pt;
                            text-align: center;
                            vertical-align: middle;
                        }
                        td {
                            border: 0.5pt solid #cbd5e1;
                            padding: 3px 2px;
                            font-size: 5.5pt;
                            vertical-align: middle;
                        }
                        .header-table {
                            width: 100%;
                            border: none;
                            margin-bottom: 6px;
                        }
                        .header-table td {
                            border: none;
                            padding: 0;
                        }
                        .company-title {
                            font-size: 11pt;
                            font-weight: bold;
                            color: #0f172a;
                        }
                        .report-subtitle {
                            font-size: 8pt;
                            color: #0284c7;
                            font-weight: bold;
                        }
                        .meta-info {
                            font-size: 7pt;
                            color: #475569;
                            text-align: right;
                        }
                        .num {
                            text-align: right;
                        }
                        .bold {
                            font-weight: bold;
                        }
                        .italic {
                            font-style: italic;
                        }
                    </style>
                    <macrolist>
                        <macro id="nlfooter">
                            <table width="100%" style="font-size: 6pt; color: #64748b;">
                                <tr>
                                    <td align="left" style="border:none;">SJS Enersol Engineering Works LLC — Confidential Stock Ledger Report</td>
                                    <td align="right" style="border:none;">Page <pagenumber/> of <totalpages/></td>
                                </tr>
                            </table>
                        </macro>
                    </macrolist>
                </head>
                <body orientation="landscape" page-size="A4" footer="nlfooter" footer-height="15pt">
                    <table class="header-table">
                        <tr>
                            <td width="60%">
                                <div class="company-title">SJS ENERSOL</div>
                                <div class="report-subtitle">Stock Ledger IN/OUT Report</div>
                            </td>
                            <td width="40%" class="meta-info">
                                <b>Date Range:</b> ${escapeHtml(fromDateStr)} to ${escapeHtml(toDateStr)}<br/>
                                <b>Generated On:</b> ${escapeHtml(currentDateStr)}
                            </td>
                        </tr>
                    </table>
                    <br/>
                    <table>
                        <thead>
                            <tr>
                                <th width="9%">Item Code</th>
                                <th width="6%">Division</th>
                                <th width="8%">Document No</th>
                                <th width="6%">Invoice No</th>
                                <th width="14%">Account Name</th>
                                <th width="5%">Date</th>
                                <th width="9%">Sales Order No/<br/>Invoice No</th>
                                <th width="4%">Qty<br/>Recd</th>
                                <th width="5%">Rate Recd<br/>At</th>
                                <th width="5%">Cost</th>
                                <th width="4%">Qty<br/>Issued</th>
                                <th width="5%">Rate Issued<br/>At</th>
                                <th width="5%">Value of<br/>Issue</th>
                                <th width="5%">Bal<br/>Qty</th>
                                <th width="5%">Bal<br/>Value</th>
                                <th width="5%">Avg<br/>Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pdfRowsHtml}
                        </tbody>
                    </table>
                </body>
                </pdf>
            `;

            return render.xmlToPdf({ xmlString: xmlStr });
        }

        return {
            onRequest: onRequest
        };

    });
