/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * 
 * Inventory Aging Report Suitelet (Optimized)
 * Theme: Minimalist Slate
 * Features:
 *   - FIFO Back-tracing aging calculation
 *   - Configured Buckets: 0-30 Days, 31-60 Days, 61-90 Days, 91-365 Days, > 1 Year (365+ Days)
 *   - Idle Days tracking (days since most recent receipt/inward transaction)
 *   - Custom field filter: item.custitem_xxflx_jm_item_field_list = 2
 *   - Dynamic Subsidiary & Location filters, KPI Cards, Client-side Sorting & Filtering, CSV Export
 */

define(['N/ui/serverWidget', 'N/log', 'N/query', 'N/runtime', 'N/url', 'N/format', 'N/search'],
    (serverWidget, log, query, runtime, url, format, search) => {

        function onRequest(context) {
            try {
                const params = context.request.parameters;
                const subId = params.custpage_subsidiary || '';
                const locId = params.custpage_location || '';
                const itemType = params.custpage_itemtype || '';
                const asOfDateStr = params.custpage_asofdate || '';
                const isExport = (params.custpage_export === 'T');

                // Parse As-Of Date
                let asOfDate = new Date();
                if (asOfDateStr) {
                    if (asOfDateStr.indexOf('-') !== -1) {
                        const parts = asOfDateStr.split('-');
                        asOfDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    } else if (asOfDateStr.indexOf('/') !== -1) {
                        const parts = asOfDateStr.split('/');
                        asOfDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    }
                }

                // Debug Endpoint to verify SuiteQL data matching
                if (params.custpage_debug === 'T') {
                    // Let's first query one of the items on hand to see its transactions
                    const debugSql = `
                        SELECT TOP 100
                            t.id AS tran_id,
                            t.tranid AS doc_number,
                            t.type AS type_id,
                            t.posting AS posting_status,
                            tl.item AS item_id,
                            BUILTIN.DF(tl.item) AS item_name,
                            tl.location AS location_id,
                            BUILTIN.DF(tl.location) AS location_name,
                            tl.quantity AS qty,
                            tl.mainline AS is_mainline,
                            t.trandate AS trandate
                        FROM transaction t
                        INNER JOIN transactionline tl ON t.id = tl.transaction
                        WHERE tl.item IS NOT NULL
                          AND t.type IN ('ItemRecpt', 'InvAdjst', 'Build', 'InvTrnfr', 'InvWksht', 'ItemShip')
                        ORDER BY t.id DESC
                    `;
                    const debugRes = query.runSuiteQL({ query: debugSql }).asMappedResults();
                    context.response.setHeader({ name: 'Content-Type', value: 'application/json' });
                    context.response.write(JSON.stringify(debugRes, null, 2));
                    return;
                }

                // --- 1. FETCH FILTER OPTIONS ---
                const filterData = getFilterOptions();

                // --- 2. QUERY & PROCESS REPORT DATA ---
                const reportResults = getReportData(subId, locId, itemType, asOfDate, filterData);

                // --- 3. EXPORT TO CSV LOGIC ---
                if (isExport) {
                    const csvContent = buildCSV(reportResults);
                    context.response.setHeader({ name: 'Content-Type', value: 'text/csv; charset=utf-8' });
                    context.response.setHeader({ name: 'Content-Disposition', value: 'attachment; filename="Inventory_Aging_Report.csv"' });
                    context.response.write('\uFEFF' + csvContent);
                    return;
                }

                // --- 4. BUILD SUITELET PAGE ---
                const form = serverWidget.createForm({ title: ' ' });
                const htmlField = form.addField({
                    id: 'custpage_html',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: ' '
                });

                htmlField.defaultValue = buildReportHtml(reportResults, filterData, subId, locId, itemType, asOfDate);

                context.response.writePage(form);

            } catch (e) {
                log.error('Error on Suitelet Request', e);
                context.response.write(`<h3>An error occurred: ${e.message}</h3>`);
            }
        }

        /**
         * Fetch options for Subsidiary, Location, and Item Type filters
         */
        function getFilterOptions() {
            const filterData = {
                subsidiaries: [],
                locations: [],
                itemTypes: []
            };

            try {
                // Fetch subsidiaries
                filterData.subsidiaries = query.runSuiteQL({
                    query: 'SELECT id, name FROM subsidiary ORDER BY name'
                }).asMappedResults();

                // Fetch locations (active only)
                filterData.locations = query.runSuiteQL({
                    query: 'SELECT id, name, subsidiary FROM location WHERE isinactive = \'F\' ORDER BY name'
                }).asMappedResults();

                // Fetch distinct item types for inventory items
                filterData.itemTypes = query.runSuiteQL({
                    query: 'SELECT DISTINCT itemtype AS id FROM item WHERE itemtype IN (\'InvtPart\', \'Assembly\', \'LotDepInvtPart\', \'SerialDepInvtPart\') ORDER BY itemtype'
                }).asMappedResults();

            } catch (e) {
                log.error('Error fetching filter options', e);
            }

            return filterData;
        }

        /**
         * Get Report Data: queries current stock balance via N/search and receipt transactions via SuiteQL for FIFO aging
         */
        function getReportData(subId, locId, itemType, asOfDate, filterData) {
            const results = [];
            try {
                // Build search filters dynamically
                const searchFilters = [
                    ['location', 'noneof', '@NONE@'],
                    'AND',
                    ['onhand', 'greaterthan', '0']
                ];
                if (subId) {
                    searchFilters.push('AND');
                    searchFilters.push(['location.subsidiary', 'anyof', subId]);
                }
                if (locId) {
                    searchFilters.push('AND');
                    searchFilters.push(['location', 'anyof', locId]);
                }
                if (itemType) {
                    searchFilters.push('AND');
                    searchFilters.push(['item.type', 'anyof', itemType]);
                } else {
                    searchFilters.push('AND');
                    searchFilters.push(['item.type', 'anyof', ['InvtPart', 'Assembly', 'LotDepInvtPart', 'SerialDepInvtPart']]);
                }

                // Define search columns
                const colItem = search.createColumn({ name: 'item', summary: search.Summary.GROUP });
                const colItemName = search.createColumn({ name: 'itemid', join: 'item', summary: search.Summary.GROUP });
                const colItemDispName = search.createColumn({ name: 'displayname', join: 'item', summary: search.Summary.GROUP });
                const colItemType = search.createColumn({ name: 'type', join: 'item', summary: search.Summary.GROUP });
                const colLoc = search.createColumn({ name: 'location', summary: search.Summary.GROUP });
                const colLocName = search.createColumn({ name: 'name', join: 'location', summary: search.Summary.GROUP });
                const colSub = search.createColumn({ name: 'subsidiary', join: 'location', summary: search.Summary.GROUP });
                const colOnHand = search.createColumn({ name: 'onhand', summary: search.Summary.SUM });
                const colAvgCost = search.createColumn({ name: 'averagecost', join: 'item', summary: search.Summary.MAX });
                const colPurchPrice = search.createColumn({ name: 'cost', join: 'item', summary: search.Summary.MAX });

                const stockResults = [];

                try {
                    const balSearch = search.create({
                        type: 'inventorybalance',
                        filters: searchFilters,
                        columns: [
                            colItem, colItemName, colItemDispName, colItemType,
                            colLoc, colLocName, colSub, colOnHand, colAvgCost, colPurchPrice
                        ]
                    });

                    const pagedData = balSearch.runPaged({ pageSize: 1000 });
                    for (let i = 0; i < pagedData.pageRanges.length; i++) {
                        const page = pagedData.fetch({ index: i });
                        page.data.forEach(res => {
                            const itemId = res.getValue(colItem);
                            const itemCode = res.getValue(colItemName);
                            const itemDisp = res.getValue(colItemDispName);
                            const itemTp = res.getValue(colItemType);
                            const locId = res.getValue(colLoc);
                            const locName = res.getValue(colLocName);
                            const subIdVal = res.getValue(colSub);
                            const subName = res.getText(colSub);
                            const qoh = parseFloat(res.getValue(colOnHand)) || 0;
                            const avgCst = parseFloat(res.getValue(colAvgCost)) || 0;
                            const purchPrc = parseFloat(res.getValue(colPurchPrice)) || 0;
                            const cost = avgCst || purchPrc || 0;

                            if (qoh > 0) {
                                stockResults.push({
                                    item_id: itemId,
                                    item_code: itemCode,
                                    item_displayname: itemDisp,
                                    item_type: itemTp,
                                    location_id: locId,
                                    location_name: locName,
                                    subsidiary_id: subIdVal,
                                    subsidiary_name: subName,
                                    qty_on_hand: qoh,
                                    unit_cost: cost
                                });
                            }
                        });
                    }
                } catch (balError) {
                    log.warn('inventorybalance search failed, falling back to item search', balError.message);

                    // Reconstruct filters for fallback item search
                    const fallbackFilters = [
                        ['inventorylocation', 'noneof', '@NONE@'],
                        'AND',
                        ['locationquantityonhand', 'greaterthan', '0']
                    ];
                    if (subId) {
                        fallbackFilters.push('AND');
                        fallbackFilters.push(['inventorylocation.subsidiary', 'anyof', subId]);
                    }
                    if (locId) {
                        fallbackFilters.push('AND');
                        fallbackFilters.push(['inventorylocation', 'anyof', locId]);
                    }
                    if (itemType) {
                        fallbackFilters.push('AND');
                        fallbackFilters.push(['type', 'anyof', itemType]);
                    } else {
                        fallbackFilters.push('AND');
                        fallbackFilters.push(['type', 'anyof', ['InvtPart', 'Assembly', 'LotDepInvtPart', 'SerialDepInvtPart']]);
                    }

                    const colItemId = search.createColumn({ name: 'internalid' });
                    const colItemCode = search.createColumn({ name: 'itemid' });
                    const colItemDispName = search.createColumn({ name: 'displayname' });
                    const colItemType = search.createColumn({ name: 'type' });
                    const colLoc = search.createColumn({ name: 'inventorylocation' });
                    const colSub = search.createColumn({ name: 'subsidiary', join: 'inventorylocation' });
                    const colOnHand = search.createColumn({ name: 'locationquantityonhand' });
                    const colAvgCost = search.createColumn({ name: 'locationaveragecost' });
                    const colPurchPrice = search.createColumn({ name: 'cost' });

                    const itemSearch = search.create({
                        type: 'item',
                        filters: fallbackFilters,
                        columns: [
                            colItemId, colItemCode, colItemDispName, colItemType,
                            colLoc, colSub, colOnHand, colAvgCost, colPurchPrice
                        ]
                    });

                    const pagedData = itemSearch.runPaged({ pageSize: 1000 });
                    for (let i = 0; i < pagedData.pageRanges.length; i++) {
                        const page = pagedData.fetch({ index: i });
                        page.data.forEach(res => {
                            const itemId = res.getValue(colItemId);
                            const itemCode = res.getValue(colItemCode);
                            const itemDisp = res.getValue(colItemDispName);
                            const itemTp = res.getValue(colItemType);
                            const locId = res.getValue(colLoc);
                            const locName = res.getText(colLoc);
                            const subIdVal = res.getValue(colSub);
                            const subName = res.getText(colSub);
                            const qoh = parseFloat(res.getValue(colOnHand)) || 0;
                            const avgCst = parseFloat(res.getValue(colAvgCost)) || 0;
                            const purchPrc = parseFloat(res.getValue(colPurchPrice)) || 0;
                            const cost = avgCst || purchPrc || 0;

                            if (qoh > 0) {
                                stockResults.push({
                                    item_id: itemId,
                                    item_code: itemCode,
                                    item_displayname: itemDisp,
                                    item_type: itemTp,
                                    location_id: locId,
                                    location_name: locName,
                                    subsidiary_id: subIdVal,
                                    subsidiary_name: subName,
                                    qty_on_hand: qoh,
                                    unit_cost: cost
                                });
                            }
                        });
                    }
                }

                if (stockResults.length === 0) return [];

                // Extract all unique item IDs to perform a batch lookup of receipts
                const itemIds = [...new Set(stockResults.map(r => r.item_id).filter(Boolean))];
                if (itemIds.length === 0) return [];

                // 2. Fetch receipt/inward and issue transactions in batches of 500 items to avoid query size limits
                let receiptResults = [];
                const batchSize = 500;

                // Calculate date range (730 days prior to asOfDate as a safeguard)
                const startDate = new Date(asOfDate.getTime() - 730 * 24 * 60 * 60 * 1000);
                const startDateSqlStr = formatDateSql(startDate);
                const endDateSqlStr = formatDateSql(asOfDate);

                for (let i = 0; i < itemIds.length; i += batchSize) {
                    const batchItemIds = itemIds.slice(i, i + batchSize);
                    const receiptSql = `
                          SELECT 
                              tl.item AS item_id,
                              tl.location AS location_id,
                              TO_CHAR(t.trandate, 'YYYY-MM-DD') AS receipt_date,
                              t.id AS tran_db_id,
                              t.tranid AS tran_id,
                              t.type AS tran_type,
                              BUILTIN.DF(t.type) AS tran_type_name,
                              tl.quantity AS qty_received,
                              NVL(tl.rate, 0) AS unit_rate,
                              t.trandate AS raw_trandate
                          FROM transactionline tl
                          INNER JOIN transaction t ON tl.transaction = t.id
                          WHERE tl.item IN (${batchItemIds.join(',')})
                            AND t.posting = 'T'
                            AND tl.isinventoryaffecting = 'T'
                            AND t.type IN ('ItemRcpt', 'InvAdjst', 'Build', 'InvWksht', 'CustCred', 'ItemShip', 'CustInvc', 'CashSale')
                            AND t.trandate BETWEEN TO_DATE('${startDateSqlStr}', 'YYYY-MM-DD') AND TO_DATE('${endDateSqlStr}', 'YYYY-MM-DD')

                          UNION ALL

                          -- Inventory Transfer: Source Location (Negative Qty)
                          SELECT 
                              tl.item AS item_id,
                              tl.location AS location_id,
                              TO_CHAR(t.trandate, 'YYYY-MM-DD') AS receipt_date,
                              t.id AS tran_db_id,
                              t.tranid AS tran_id,
                              t.type AS tran_type,
                              BUILTIN.DF(t.type) AS tran_type_name,
                              tl.quantity AS qty_received,
                              NVL(tl.rate, 0) AS unit_rate,
                              t.trandate AS raw_trandate
                          FROM transactionline tl
                          INNER JOIN transaction t ON tl.transaction = t.id
                          WHERE tl.item IN (${batchItemIds.join(',')})
                            AND t.type = 'InvTrnfr'
                            AND tl.location IS NOT NULL
                            AND t.trandate BETWEEN TO_DATE('${startDateSqlStr}', 'YYYY-MM-DD') AND TO_DATE('${endDateSqlStr}', 'YYYY-MM-DD')

                          UNION ALL

                          -- Inventory Transfer: Destination Location (Positive Qty)
                          SELECT 
                              tl.item AS item_id,
                              t.transferlocation AS location_id,
                              TO_CHAR(t.trandate, 'YYYY-MM-DD') AS receipt_date,
                              t.id AS tran_db_id,
                              t.tranid AS tran_id,
                              t.type AS tran_type,
                              BUILTIN.DF(t.type) AS tran_type_name,
                              -tl.quantity AS qty_received,
                              NVL(tl.rate, 0) AS unit_rate,
                              t.trandate AS raw_trandate
                          FROM transactionline tl
                          INNER JOIN transaction t ON tl.transaction = t.id
                          WHERE tl.item IN (${batchItemIds.join(',')})
                            AND t.type = 'InvTrnfr'
                            AND t.transferlocation IS NOT NULL
                            AND t.trandate BETWEEN TO_DATE('${startDateSqlStr}', 'YYYY-MM-DD') AND TO_DATE('${endDateSqlStr}', 'YYYY-MM-DD')

                          ORDER BY raw_trandate ASC, tran_db_id ASC
                      `;
                    const batchReceipts = query.runSuiteQL({ query: receiptSql }).asMappedResults();
                    receiptResults = receiptResults.concat(batchReceipts);
                }

                // Group transactions by item_id and location_id for O(1) matching
                const transactionsMap = {};
                receiptResults.forEach(r => {
                    const key = `${r.item_id}_${r.location_id}`;
                    if (!transactionsMap[key]) {
                        transactionsMap[key] = [];
                    }
                    transactionsMap[key].push({
                        date: parseSqlDate(r.receipt_date),
                        qty: parseFloat(r.qty_received) || 0,
                        rate: parseFloat(r.unit_rate) || 0,
                        doc_number: r.tran_id,
                        type_name: r.tran_type_name || r.tran_type,
                        db_id: r.tran_db_id
                    });
                });

                // 3. Perform True FIFO Queue Simulation
                stockResults.forEach(row => {
                    const itemId = row.item_id;
                    const locId = row.location_id;
                    const qtyOnHand = row.qty_on_hand;
                    const unitCost = row.unit_cost;

                    const key = `${itemId}_${locId}`;
                    const history = transactionsMap[key] || [];

                    // Simulating the FIFO Queue
                    const queue = [];
                    let mostRecentIssueDate = null;
                    let mostRecentReceiptDate = null;

                    history.forEach(tx => {
                        if (tx.qty > 0) {
                            // Receipt: add lot to the queue
                            queue.push({
                                date: tx.date,
                                qty: tx.qty,
                                doc_number: tx.doc_number,
                                type: tx.type_name || tx.type,
                                db_id: tx.db_id
                            });
                            mostRecentReceiptDate = tx.date;
                        } else if (tx.qty < 0) {
                            // Issue: consume from queue (FIFO - oldest first)
                            let consumeQty = Math.abs(tx.qty);
                            mostRecentIssueDate = tx.date;
                            while (consumeQty > 0 && queue.length > 0) {
                                const oldest = queue[0];
                                if (oldest.qty <= consumeQty) {
                                    consumeQty -= oldest.qty;
                                    queue.shift();
                                } else {
                                    oldest.qty -= consumeQty;
                                    consumeQty = 0;
                                }
                            }
                        }
                    });

                    // Reconcile simulated queue sum with actual quantity on hand
                    const queueSum = queue.reduce((sum, lot) => sum + lot.qty, 0);
                    let finalLots = [];

                    if (queueSum >= qtyOnHand) {
                        // Keep the newest stock (FIFO remaining lots). Walk backwards from the end of the queue.
                        let remainingToKeep = qtyOnHand;
                        for (let i = queue.length - 1; i >= 0; i--) {
                            if (remainingToKeep <= 0) break;
                            const lot = queue[i];
                            const keepQty = Math.min(remainingToKeep, lot.qty);
                            finalLots.unshift({
                                date: lot.date,
                                qty: keepQty,
                                doc_number: lot.doc_number,
                                type: lot.type,
                                db_id: lot.db_id
                            });
                            remainingToKeep -= keepQty;
                        }
                    } else {
                        // All queue lots are kept, and the missing stock is treated as opening balance (> 1 Year)
                        finalLots = queue.map(lot => ({
                            date: lot.date,
                            qty: lot.qty,
                            doc_number: lot.doc_number,
                            type: lot.type,
                            db_id: lot.db_id
                        }));
                        const diff = qtyOnHand - queueSum;
                        if (diff > 0) {
                            const openingDate = new Date(asOfDate.getTime() - 10 * 365 * 24 * 60 * 60 * 1000); // 10 years ago
                            finalLots.unshift({
                                date: openingDate,
                                qty: diff,
                                doc_number: 'Opening Balance',
                                type: 'Opening Balance',
                                db_id: ''
                            });
                        }
                    }

                    // Calculate aging buckets
                    let q0_30 = 0, q31_60 = 0, q61_90 = 0, q91_365 = 0, q365Plus = 0;
                    finalLots.forEach(lot => {
                        const diffTime = asOfDate.getTime() - lot.date.getTime();
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays <= 30) {
                            q0_30 += lot.qty;
                        } else if (diffDays <= 60) {
                            q31_60 += lot.qty;
                        } else if (diffDays <= 90) {
                            q61_90 += lot.qty;
                        } else if (diffDays <= 365) {
                            q91_365 += lot.qty;
                        } else {
                            q365Plus += lot.qty;
                        }
                    });

                    // Calculate Idle Days (days since most recent transaction of ANY type)
                    let idleDays = 'N/A';
                    let lastMovementDate = mostRecentReceiptDate;
                    if (mostRecentIssueDate && (!lastMovementDate || mostRecentIssueDate > lastMovementDate)) {
                        lastMovementDate = mostRecentIssueDate;
                    }
                    if (lastMovementDate) {
                        const idleTimeDiff = asOfDate.getTime() - lastMovementDate.getTime();
                        idleDays = Math.max(0, Math.floor(idleTimeDiff / (1000 * 60 * 60 * 24)));
                    }

                    const totalValue = qtyOnHand * unitCost;

                    // Map active inventory lots to a lightweight serializable list
                    const serializedHistory = finalLots.map(lot => ({
                        date: formatDateSql(lot.date),
                        doc_number: lot.doc_number,
                        type: lot.type,
                        qty: lot.qty,
                        id: lot.db_id
                    }));

                    results.push({
                        item_id: itemId,
                        item_code: row.item_code || 'Unnamed Item',
                        item_name: row.item_displayname || '',
                        item_type: row.item_type || '',
                        location_id: locId,
                        location_name: row.location_name || '',
                        subsidiary_id: row.subsidiary_id || '',
                        subsidiary_name: row.subsidiary_name || '',
                        qty_on_hand: qtyOnHand,
                        unit_cost: unitCost,
                        total_value: totalValue,
                        idle_days: idleDays,
                        // Quantities
                        q0_30: q0_30,
                        q31_60: q31_60,
                        q61_90: q61_90,
                        q91_365: q91_365,
                        q365Plus: q365Plus,
                        // Values
                        v0_30: q0_30 * unitCost,
                        v31_60: q31_60 * unitCost,
                        v61_90: q61_90 * unitCost,
                        v91_365: q91_365 * unitCost,
                        v365Plus: q365Plus * unitCost,
                        history: serializedHistory
                    });
                });

            } catch (e) {
                log.error('Error fetching report data', e);
            }
            return results;
        }

        /**
         * Helper: Date format for SuiteQL (YYYY-MM-DD)
         */
        function formatDateSql(d) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }

        /**
         * Helper: Parse SuiteQL Date safely
         */
        function parseSqlDate(dateStr) {
            if (!dateStr) return new Date();
            if (dateStr instanceof Date) return dateStr;
            // Since we standardized the output format via TO_CHAR(t.trandate, 'YYYY-MM-DD'),
            // it will always be in the YYYY-MM-DD format.
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2].split(' ')[0], 10);
                return new Date(year, month, day);
            }
            return new Date(dateStr);
        }

        /**
         * Helper: Format Date for HTML Input (YYYY-MM-DD)
         */
        function formatDateHtmlInput(d) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }

        /**
         * Build the HTML dashboard display
         */
        function buildReportHtml(data, filterData, subId, locId, itemType, asOfDate) {
            const reportDataRowsJson = JSON.stringify(data.map(row => ({
                item_code: row.item_code,
                location_name: row.location_name,
                history: row.history
            })));

            const itemTypeMap = {
                'InvtPart': 'Inventory Part',
                'Assembly': 'Assembly Item',
                'LotDepInvtPart': 'Lot Numbered Inventory Item',
                'SerialDepInvtPart': 'Serialized Inventory Item'
            };

            // Pre-calculate Sums
            let totalQty = 0;
            let totalValue = 0;
            let totalQ0_30 = 0;
            let totalQ31_60 = 0;
            let totalQ61_90 = 0;
            let totalQ91_365 = 0;
            let totalQ365Plus = 0;

            data.forEach(row => {
                totalQty += row.qty_on_hand;
                totalValue += row.total_value;
                totalQ0_30 += row.q0_30;
                totalQ31_60 += row.q31_60;
                totalQ61_90 += row.q61_90;
                totalQ91_365 += row.q91_365;
                totalQ365Plus += row.q365Plus;
            });

            // Build Options HTML
            const subOptions = filterData.subsidiaries.map(s =>
                `<option value="${s.id}" ${subId == s.id ? 'selected' : ''}>${s.name}</option>`
            ).join('');

            const filteredLocs = filterData.locations.filter(l => !subId || l.subsidiary == subId);
            const locOptions = filteredLocs.map(l =>
                `<option value="${l.id}" ${locId == l.id ? 'selected' : ''}>${l.name}</option>`
            ).join('');

            const typeOptions = filterData.itemTypes.map(t => {
                const label = itemTypeMap[t.id] || t.id;
                return `<option value="${t.id}" ${itemType == t.id ? 'selected' : ''}>${label}</option>`;
            }).join('');

            // Format date for browser display
            const asOfDateHtml = formatDateHtmlInput(asOfDate);

            // Table Rows HTML
            let tableRowsHtml = '';
            data.forEach((row, idx) => {
                const label = itemTypeMap[row.item_type] || row.item_type;
                tableRowsHtml += `
                    <tr>
                        <td class="sno-col cell-data">${idx + 1}</td>
                        <td class="cell-data" style="text-align:left; font-weight:600; color:#1e293b;">${row.item_code}</td>
                        <td class="cell-data" style="text-align:left;">${row.item_name}</td>
                        <td class="cell-data" style="text-align:left;">${row.location_name}</td>
                        <td class="cell-data">${label}</td>
                        <td class="cell-data num font-mono">${row.qty_on_hand.toLocaleString()}</td>
                        <td class="cell-data num font-mono">${row.unit_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="cell-data num font-mono font-bold">${row.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="cell-data num font-mono">${row.q0_30.toLocaleString()}</td>
                        <td class="cell-data num font-mono">${row.q31_60.toLocaleString()}</td>
                        <td class="cell-data num font-mono">${row.q61_90.toLocaleString()}</td>
                        <td class="cell-data num font-mono">${row.q91_365.toLocaleString()}</td>
                        <td class="cell-data num font-mono">${row.q365Plus.toLocaleString()}</td>
                        <td class="cell-data num font-mono font-bold">${row.idle_days}</td>
                        <td class="cell-data" style="text-align:center;">
                            <button type="button" class="btn-detail" onclick="showHistoryModal(${idx})">View</button>
                        </td>
                    </tr>
                `;
            });

            if (data.length === 0) {
                tableRowsHtml = `
                    <tr>
                        <td colspan="15" class="welcome-msg">No active inventory matching the selected filters was found.</td>
                    </tr>
                `;
            }

            // Return full HTML string
            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Inventory Aging Dashboard</title>
                    <meta name="description" content="Inventory Aging Dashboard with FIFO calculation and transaction details.">
                    <style>
                        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
                        
                        body {
                            font-family: "Inter", -apple-system, sans-serif;
                            background: #f8fafc;
                            color: #1e293b;
                            margin: 0;
                            padding: 0;
                            -webkit-font-smoothing: antialiased;
                        }

                        /* Header design */
                        .header {
                            background: #ffffff;
                            color: #1e293b;
                            padding: 16px 24px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            border-bottom: 1px solid #e2e8f0;
                        }
                        .header-logo {
                            font-size: 18px;
                            font-weight: 600;
                            letter-spacing: -0.02em;
                            color: #0f172a;
                        }

                        /* Filter toolbar styling */
                        .filter-bar {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 12px;
                            align-items: center;
                        }
                        .filter-bar label {
                            font-size: 12px;
                            font-weight: 700;
                            color: #64748b;
                            text-transform: uppercase;
                            margin-right: 4px;
                        }
                        .filter-bar select, .filter-bar input[type="date"] {
                            background: #ffffff;
                            border: 1px solid #e2e8f0;
                            color: #334155;
                            padding: 6px 12px;
                            border-radius: 6px;
                            font-size: 13px;
                            font-weight: 500;
                            cursor: pointer;
                            outline: none;
                            transition: all 0.15s ease;
                            font-family: inherit;
                        }
                        .filter-bar select:hover, .filter-bar select:focus, 
                        .filter-bar input[type="date"]:hover, .filter-bar input[type="date"]:focus {
                            border-color: #94a3b8;
                            box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.15);
                        }

                        /* KPI dashboard block */
                        .metrics-bar {
                            display: flex;
                            gap: 12px;
                            padding: 16px 24px;
                            background: #ffffff;
                            border-bottom: 1px solid #e2e8f0;
                            overflow-x: auto;
                        }
                        .metric-card {
                            flex: 1;
                            min-width: 130px;
                            background: #ffffff;
                            border: 1px solid #e2e8f0;
                            border-radius: 6px;
                            padding: 12px 14px;
                            display: flex;
                            flex-direction: column;
                            gap: 2px;
                            transition: all 0.15s ease;
                        }
                        .metric-card:hover {
                            border-color: #cbd5e1;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
                        }
                        
                        .metric-val {
                            font-size: 16px;
                            font-weight: 600;
                            color: #0f172a;
                            letter-spacing: -0.01em;
                        }
                        .metric-lbl {
                            font-size: 10px;
                            font-weight: 500;
                            color: #64748b;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        }

                        /* Toolbar styling */
                        .toolbar {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            padding: 12px 24px;
                            background: #ffffff;
                            border-bottom: 1px solid #e2e8f0;
                        }
                        .search-wrap input {
                            padding: 6px 12px;
                            border: 1px solid #e2e8f0;
                            border-radius: 6px;
                            width: 260px;
                            font-size: 13px;
                            outline: none;
                            transition: all 0.15s ease;
                            background-color: #ffffff;
                        }
                        .search-wrap input:focus {
                            border-color: #94a3b8;
                            box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.15);
                        }
                        .btn-export {
                            padding: 6px 12px;
                            border: 1px solid #e2e8f0;
                            border-radius: 6px;
                            background: #ffffff;
                            color: #475569;
                            font-size: 13px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.15s ease;
                        }
                        .btn-export:hover {
                            background: #f8fafc;
                            border-color: #cbd5e1;
                            color: #0f172a;
                        }

                        /* Table formatting */
                        .table-container {
                            margin: 16px 24px;
                            background: #ffffff;
                            border: 1px solid #e2e8f0;
                            border-radius: 6px;
                            overflow: hidden;
                        }
                        .table-scroll {
                            overflow-y: auto;
                            max-height: 70vh;
                        }
                        table {
                            border-collapse: separate;
                            border-spacing: 0;
                            width: 100%;
                        }
                        thead th {
                            background: #fafafa;
                            color: #475569;
                            font-size: 10px;
                            font-weight: 600;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            padding: 10px 12px;
                            border-right: 1px solid #e2e8f0;
                            border-bottom: 2px solid #e2e8f0;
                            position: sticky;
                            top: 0;
                            z-index: 10;
                            cursor: pointer;
                            text-align: left;
                        }
                        thead th:hover {
                            background-color: #f5f5f5;
                        }
                        .cell-data {
                            font-size: 12px;
                            color: #334155;
                            padding: 10px 12px;
                            border-right: 1px solid #f1f5f9;
                            border-bottom: 1px solid #f1f5f9;
                            vertical-align: middle;
                        }
                        tbody tr:hover td {
                            background-color: #fafafa !important;
                        }
                        .num {
                            text-align: right !important;
                        }
                        .font-mono {
                            font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
                            font-size: 11px;
                        }
                        .font-bold {
                            font-weight: 700;
                        }
                        .welcome-msg {
                            padding: 80px 20px;
                            text-align: center;
                            color: #94a3b8;
                            font-size: 15px;
                        }

                        /* Modal Styles */
                        .modal-overlay {
                            position: fixed;
                            top: 0; left: 0; width: 100%; height: 100%;
                            background: rgba(15, 23, 42, 0.4);
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            z-index: 9999;
                            backdrop-filter: blur(2px);
                            animation: fadeIn 0.15s ease-out;
                        }
                        .modal-card {
                            background: #ffffff;
                            border-radius: 8px;
                            width: 700px;
                            max-width: 95%;
                            max-height: 80vh;
                            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                            display: flex;
                            flex-direction: column;
                            overflow: hidden;
                            border: 1px solid #e2e8f0;
                            animation: slideUp 0.2s ease-out;
                        }
                        .modal-header {
                            padding: 14px 20px;
                            background: #ffffff;
                            border-bottom: 1px solid #e2e8f0;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        .modal-header h3 {
                            margin: 0;
                            font-size: 13px;
                            font-weight: 600;
                            color: #0f172a;
                        }
                        .modal-close {
                            background: none;
                            border: none;
                            font-size: 20px;
                            color: #94a3b8;
                            cursor: pointer;
                            padding: 0;
                            line-height: 1;
                            transition: color 0.15s;
                        }
                        .modal-close:hover {
                            color: #0f172a;
                        }
                        .modal-body {
                            padding: 20px;
                            overflow-y: auto;
                            background: #ffffff;
                        }
                        .modal-table {
                            width: 100%;
                            border-collapse: collapse;
                            text-align: left;
                        }
                        .modal-table th {
                            background: #fafafa;
                            color: #475569;
                            font-size: 10px;
                            font-weight: 600;
                            text-transform: uppercase;
                            padding: 8px 12px;
                            border-bottom: 2px solid #e2e8f0;
                            border-right: none;
                            position: static;
                        }
                        .modal-table td {
                            padding: 8px 12px;
                            font-size: 12px;
                            border-bottom: 1px solid #f1f5f9;
                            color: #334155;
                            border-right: none;
                        }
                        .modal-table tr:hover td {
                            background: #f8fafc !important;
                        }
                        .modal-table a {
                            color: #2563eb;
                            text-decoration: none;
                            font-weight: 500;
                        }
                        .modal-table a:hover {
                            text-decoration: underline;
                        }
                        .btn-detail {
                            padding: 4px 8px;
                            border: 1px solid #e2e8f0;
                            border-radius: 4px;
                            background: #ffffff;
                            color: #475569;
                            font-size: 11px;
                            font-weight: 500;
                            cursor: pointer;
                            transition: all 0.15s ease;
                        }
                        .btn-detail:hover {
                            background: #f8fafc;
                            border-color: #cbd5e1;
                            color: #0f172a;
                        }

                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes slideUp {
                            from { transform: translateY(12px); opacity: 0; }
                            to { transform: translateY(0); opacity: 1; }
                        }
                    </style>
                </head>
                <body>

                    <!-- Header -->
                    <div class="header">
                        <div class="header-logo">Inventory Aging Dashboard</div>
                        <div class="filter-bar">
                            <label for="custpage_subsidiary">Subsidiary</label>
                            <select id="custpage_subsidiary" onchange="reloadReport()">
                                <option value="">Select Subsidiary</option>
                                ${subOptions}
                            </select>

                            <label for="custpage_location">Location</label>
                            <select id="custpage_location" onchange="reloadReport()">
                                <option value="">Select Location</option>
                                ${locOptions}
                            </select>

                            <label for="custpage_itemtype">Item Type</label>
                            <select id="custpage_itemtype" onchange="reloadReport()">
                                <option value="">Select Item Type</option>
                                ${typeOptions}
                            </select>

                            <label for="custpage_asofdate">As Of Date</label>
                            <input type="date" id="custpage_asofdate" value="${asOfDateHtml}" onchange="reloadReport()">
                        </div>
                    </div>

                    <!-- Metrics -->
                    <div class="metrics-bar">
                        <div class="metric-card qty-card">
                            <div class="metric-val" id="kpi-qty">${totalQty.toLocaleString()}</div>
                            <div class="metric-lbl">Total Stock Qty</div>
                        </div>
                        <div class="metric-card val-card">
                            <div class="metric-val" id="kpi-val">AED ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div class="metric-lbl">Total Value</div>
                        </div>
                        <div class="metric-card a0-30-card">
                            <div class="metric-val" id="kpi-v0-30">${totalQ0_30.toLocaleString()}</div>
                            <div class="metric-lbl">0 - 30 Days</div>
                        </div>
                        <div class="metric-card a31-60-card">
                            <div class="metric-val" id="kpi-v31-60">${totalQ31_60.toLocaleString()}</div>
                            <div class="metric-lbl">31 - 60 Days</div>
                        </div>
                        <div class="metric-card a61-90-card">
                            <div class="metric-val" id="kpi-v61-90">${totalQ61_90.toLocaleString()}</div>
                            <div class="metric-lbl">61 - 90 Days</div>
                        </div>
                        <div class="metric-card a91-365-card">
                            <div class="metric-val" id="kpi-v91-365">${totalQ91_365.toLocaleString()}</div>
                            <div class="metric-lbl">91 - 365 Days</div>
                        </div>
                        <div class="metric-card a365-card">
                            <div class="metric-val" id="kpi-v365Plus">${totalQ365Plus.toLocaleString()}</div>
                            <div class="metric-lbl">&gt; 1 Year</div>
                        </div>
                    </div>

                    <!-- Toolbar -->
                    <div class="toolbar">
                        <div class="search-wrap">
                            <input type="text" id="reportSearch" placeholder="Search item code, display name or location..." oninput="filterReportTable()">
                        </div>
                        <button type="button" class="btn-export" onclick="triggerExcelExport()">Export to CSV</button>
                    </div>

                    <!-- Report Table -->
                    <div class="table-container">
                        <div class="table-scroll">
                            <table id="reportTable">
                                <thead>
                                    <tr>
                                        <th style="width: 50px; text-align: center;">S.No</th>
                                        <th onclick="sortTable(1)">Item Code</th>
                                        <th onclick="sortTable(2)">Display Name</th>
                                        <th onclick="sortTable(3)">Location</th>
                                        <th onclick="sortTable(4)">Item Type</th>
                                        <th onclick="sortTable(5)" style="text-align: right;">Qty On Hand</th>
                                        <th onclick="sortTable(6)" style="text-align: right;">Unit Cost</th>
                                        <th onclick="sortTable(7)" style="text-align: right;">Total Value</th>
                                        <th onclick="sortTable(8)" style="text-align: right;">0 - 30 Days</th>
                                        <th onclick="sortTable(9)" style="text-align: right;">31 - 60 Days</th>
                                        <th onclick="sortTable(10)" style="text-align: right;">61 - 90 Days</th>
                                        <th onclick="sortTable(11)" style="text-align: right;">91 - 365 Days</th>
                                        <th onclick="sortTable(12)" style="text-align: right;">&gt; 1 Year</th>
                                        <th onclick="sortTable(13)" style="text-align: right;">Idle Days</th>
                                        <th style="text-align: center;">Detail</th>
                                    </tr>
                                </thead>
                                <tbody id="reportTableBody">
                                    ${tableRowsHtml}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <script>
                        function reloadReport() {
                            const sub = document.getElementById("custpage_subsidiary").value;
                            const loc = document.getElementById("custpage_location").value;
                            const type = document.getElementById("custpage_itemtype").value;
                            const asof = document.getElementById("custpage_asofdate").value;
                            
                            const currentUrl = new URL(window.location.href);
                            const params = new URLSearchParams(currentUrl.search);
                            
                            params.delete("custpage_subsidiary");
                            params.delete("custpage_location");
                            params.delete("custpage_itemtype");
                            params.delete("custpage_asofdate");
                            params.delete("custpage_export");
                            
                            if (sub) params.set("custpage_subsidiary", sub);
                            if (loc) params.set("custpage_location", loc);
                            if (type) params.set("custpage_itemtype", type);
                            if (asof) params.set("custpage_asofdate", asof);
                            
                            window.location.href = currentUrl.origin + currentUrl.pathname + "?" + params.toString();
                        }

                        function parseCurrency(str) {
                            if (!str) return 0;
                            var clean = str.replace(/AED/g, "").replace(/[^0-9.-]/g, "").trim();
                            var num = parseFloat(clean);
                            return isNaN(num) ? 0 : num;
                        }

                        function filterReportTable() {
                            const filter = document.getElementById("reportSearch").value.toUpperCase();
                            const tbody = document.getElementById("reportTableBody");
                            const trs = tbody.getElementsByTagName("tr");
                            
                            let visibleCount = 0;
                            let totalQty = 0;
                            let totalVal = 0;
                            let totalQ0_30 = 0;
                            let totalQ31_60 = 0;
                            let totalQ61_90 = 0;
                            let totalQ91_365 = 0;
                            let totalQ365Plus = 0;

                            for (let i = 0; i < trs.length; i++) {
                                const tr = trs[i];
                                if (tr.cells.length < 14) continue; 

                                const text = tr.innerText || tr.textContent;
                                if (text.toUpperCase().indexOf(filter) > -1) {
                                    tr.style.display = "";
                                    visibleCount++;

                                    totalQty += parseFloat(tr.cells[5].innerText.replace(/,/g, "")) || 0;
                                    totalVal += parseCurrency(tr.cells[7].innerText);
                                    totalQ0_30 += parseFloat(tr.cells[8].innerText.replace(/,/g, "")) || 0;
                                    totalQ31_60 += parseFloat(tr.cells[9].innerText.replace(/,/g, "")) || 0;
                                    totalQ61_90 += parseFloat(tr.cells[10].innerText.replace(/,/g, "")) || 0;
                                    totalQ91_365 += parseFloat(tr.cells[11].innerText.replace(/,/g, "")) || 0;
                                    totalQ365Plus += parseFloat(tr.cells[12].innerText.replace(/,/g, "")) || 0;
                                } else {
                                    tr.style.display = "none";
                                }
                            }

                            // Dynamic UI update
                            document.getElementById("kpi-qty").textContent = totalQty.toLocaleString();
                            document.getElementById("kpi-val").textContent = "AED " + totalVal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                            document.getElementById("kpi-v0-30").textContent = totalQ0_30.toLocaleString();
                            document.getElementById("kpi-v31-60").textContent = totalQ31_60.toLocaleString();
                            document.getElementById("kpi-v61-90").textContent = totalQ61_90.toLocaleString();
                            document.getElementById("kpi-v91-365").textContent = totalQ91_365.toLocaleString();
                            document.getElementById("kpi-v365Plus").textContent = totalQ365Plus.toLocaleString();
                        }

                        let sortDirections = {};
                        function sortTable(colIdx) {
                            const tbody = document.getElementById("reportTableBody");
                            const rows = Array.from(tbody.querySelectorAll("tr"));
                            if (rows.length === 1 && rows[0].cells.length < 14) return;

                            const isAsc = !sortDirections[colIdx];
                            sortDirections[colIdx] = isAsc;

                            rows.sort((a, b) => {
                                let valA = a.cells[colIdx].innerText.trim();
                                let valB = b.cells[colIdx].innerText.trim();
                                
                                // Numeric column parsing
                                if (colIdx >= 5) {
                                    valA = parseCurrency(valA);
                                    valB = parseCurrency(valB);
                                }

                                if (valA === valB) return 0;
                                return isAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
                            });

                            tbody.innerHTML = "";
                            rows.forEach(r => tbody.appendChild(r));
                            
                            // Re-index S.No column
                            tbody.querySelectorAll("tr").forEach((row, idx) => {
                                row.cells[0].textContent = idx + 1;
                            });
                        }

                        function triggerExcelExport() {
                            const sub = document.getElementById("custpage_subsidiary").value;
                            const loc = document.getElementById("custpage_location").value;
                            const type = document.getElementById("custpage_itemtype").value;
                            const asof = document.getElementById("custpage_asofdate").value;
                            
                            const currentUrl = new URL(window.location.href);
                            const params = new URLSearchParams(currentUrl.search);
                            
                            params.set("custpage_export", "T");
                            if (sub) params.set("custpage_subsidiary", sub); else params.delete("custpage_subsidiary");
                            if (loc) params.set("custpage_location", loc); else params.delete("custpage_location");
                            if (type) params.set("custpage_itemtype", type); else params.delete("custpage_itemtype");
                            if (asof) params.set("custpage_asofdate", asof); else params.delete("custpage_asofdate");
                            
                            window.open(currentUrl.origin + currentUrl.pathname + "?" + params.toString(), "_blank");
                        }

                        // Initialize report rows for client side
                        const reportDataRows = ${reportDataRowsJson};

                        function formatDisplayDate(dateStr) {
                            if (!dateStr) return "";
                            const parts = dateStr.split('-');
                            if (parts.length !== 3) return dateStr;
                            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                            const day = parts[2];
                            const month = months[parseInt(parts[1], 10) - 1] || parts[1];
                            const year = parts[0];
                            return day + "-" + month + "-" + year;
                        }

                        function showHistoryModal(idx) {
                            const row = reportDataRows[idx];
                            if (!row) return;

                            document.getElementById("modalTitle").textContent = "Transaction Details: " + row.item_code + " (" + row.location_name + ")";
                            const tbody = document.getElementById("modalTableBody");
                            tbody.innerHTML = "";

                            // Get As-Of Date from input
                            const asOfDateStr = document.getElementById("custpage_asofdate").value;
                            let asOfDate = new Date();
                            if (asOfDateStr) {
                                const parts = asOfDateStr.split('-');
                                if (parts.length === 3) {
                                    asOfDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                                }
                            }

                            if (!row.history || row.history.length === 0) {
                                tbody.innerHTML = "<tr><td colspan='6' style='text-align: center; color: #94a3b8; padding: 30px;'>No active transaction lots found for this item.</td></tr>";
                            } else {
                                // Sort history by date descending (newest first)
                                const sortedHistory = [...row.history].sort((a, b) => b.date.localeCompare(a.date));

                                sortedHistory.forEach(tx => {
                                    const isPositive = tx.qty > 0;
                                    const qtyClass = isPositive ? "style='color: #10b981; font-weight: 600; text-align: right;'" : "style='color: #ef4444; font-weight: 600; text-align: right;'";
                                    const formattedQty = (isPositive ? "+" : "") + tx.qty.toLocaleString();
                                    
                                    // Calculate Age (Days)
                                    let ageDays = "N/A";
                                    let bucket = "N/A";
                                    if (tx.date) {
                                        const txParts = tx.date.split('-');
                                        if (txParts.length === 3) {
                                            const txDate = new Date(parseInt(txParts[0], 10), parseInt(txParts[1], 10) - 1, parseInt(txParts[2], 10));
                                            const diffTime = asOfDate.getTime() - txDate.getTime();
                                            ageDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                            if (ageDays < 0) ageDays = 0; // Handle any timezone mismatches
                                            
                                            // Determine Bucket
                                            if (ageDays <= 30) {
                                                bucket = "0 - 30 Days";
                                            } else if (ageDays <= 60) {
                                                bucket = "31 - 60 Days";
                                            } else if (ageDays <= 90) {
                                                bucket = "61 - 90 Days";
                                            } else if (ageDays <= 365) {
                                                bucket = "91 - 365 Days";
                                            } else {
                                                bucket = "> 1 Year";
                                            }
                                        }
                                    }
                                    
                                    // Build NetSuite transaction link
                                    let txLinkHtml = "";
                                    if (tx.id) {
                                        const txLink = "/app/accounting/transactions/transaction.nl?id=" + tx.id;
                                        txLinkHtml = "<a href='" + txLink + "' target='_blank'>" + (tx.doc_number || "View Transaction") + "</a>";
                                    } else {
                                        txLinkHtml = tx.doc_number || "Opening Balance";
                                    }
                                    
                                    tbody.innerHTML += "<tr>" +
                                        "<td>" + formatDisplayDate(tx.date) + "</td>" +
                                        "<td>" + tx.type + "</td>" +
                                        "<td>" + txLinkHtml + "</td>" +
                                        "<td class='num font-mono' " + qtyClass + ">" + formattedQty + "</td>" +
                                        "<td class='num font-mono'>" + (typeof ageDays === 'number' ? ageDays.toLocaleString() : ageDays) + "</td>" +
                                        "<td>" + bucket + "</td>" +
                                        "</tr>";
                                });
                            }

                            document.getElementById("historyModal").style.display = "flex";
                        }

                        function closeHistoryModal() {
                            document.getElementById("historyModal").style.display = "none";
                            return false;
                        }

                        // Close modal on click outside content
                        window.onclick = function(event) {
                            const modal = document.getElementById("historyModal");
                            if (event.target === modal) {
                                modal.style.display = "none";
                            }
                        }
                    </script>

                    <!-- History Detail Modal -->
                    <div id="historyModal" class="modal-overlay" style="display: none;">
                        <div class="modal-card">
                            <div class="modal-header">
                                <h3 id="modalTitle">Transaction Details</h3>
                                <button type="button" class="modal-close" onclick="closeHistoryModal(); return false;">&times;</button>
                            </div>
                            <div class="modal-body">
                                <table class="modal-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Document No.</th>
                                            <th style="text-align: right;">Quantity</th>
                                            <th style="text-align: right;">Age (Days)</th>
                                            <th>Bucket</th>
                                        </tr>
                                    </thead>
                                    <tbody id="modalTableBody">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;
        }

        /**
         * Construct the CSV export payload
         */
        function buildCSV(data) {
            let csv = 'Item Code,Display Name,Location,Subsidiary,Item Type,Qty On Hand,Unit Cost,Total Value,0-30 Days,31-60 Days,61-90 Days,91-365 Days,> 1 Year,Idle Days\r\n';
            data.forEach(row => {
                const escapeCSV = (val) => {
                    if (val === null || val === undefined) return '';
                    let str = String(val);
                    if (str.includes(',') || str.includes('"') || str.includes('\r') || str.includes('\n')) {
                        str = '"' + str.replace(/"/g, '""') + '"';
                    }
                    return str;
                };

                csv += `${escapeCSV(row.item_code)},` +
                    `${escapeCSV(row.item_name)},` +
                    `${escapeCSV(row.location_name)},` +
                    `${escapeCSV(row.subsidiary_name)},` +
                    `${escapeCSV(row.item_type)},` +
                    `${row.qty_on_hand},` +
                    `${row.unit_cost},` +
                    `${row.total_value},` +
                    `${row.q0_30},` +
                    `${row.q31_60},` +
                    `${row.q61_90},` +
                    `${row.q91_365},` +
                    `${row.q365Plus},` +
                    `${row.idle_days}\r\n`;
            });
            return csv;
        }

        return { onRequest };
    });
