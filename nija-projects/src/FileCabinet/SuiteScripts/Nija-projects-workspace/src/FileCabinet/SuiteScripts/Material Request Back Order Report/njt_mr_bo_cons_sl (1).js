/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * 
 * Material Request Back Order Consolidated Report Suitelet
 */

define(['N/ui/serverWidget', 'N/log', 'N/query', 'N/runtime', 'N/url', 'N/format'],
    (serverWidget, log, query, runtime, url, format) => {

        function onRequest(context) {
            try {
                const params = context.request.parameters;
                const subId = params.custpage_subsidiary || '';
                const itemTypeId = params.custpage_itemtype || '';
                const divisionId = params.custpage_division || '';
                const viewType = params.custpage_view || 'detailed';
                const isExport = (params.custpage_export === 'T');

                // --- 1. FETCH FILTER OPTIONS ---
                const filterData = getFilterOptions();

                // --- 2. QUERY REPORT DATA ---
                let reportResults = getReportData(subId, itemTypeId, divisionId);

                // If viewType is consolidated, apply grouping & summation of required qty
                if (viewType === 'consolidated') {
                    reportResults = consolidateReportData(reportResults);
                }

                // --- 3. EXPORT TO CSV LOGIC ---
                if (isExport) {
                    const csvContent = buildCSV(reportResults, viewType);
                    context.response.setHeader({ name: 'Content-Type', value: 'text/csv; charset=utf-8' });
                    context.response.setHeader({ name: 'Content-Disposition', value: 'attachment; filename="Material_Request_Back_Order_Report.csv"' });
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

                htmlField.defaultValue = buildReportHtml(reportResults, filterData, subId, itemTypeId, divisionId, viewType);

                context.response.writePage(form);

            } catch (e) {
                log.error('Error on Suitelet Request', e);
                context.response.write(`<h3>An error occurred: ${e.message}</h3>`);
            }
        }

        /**
         * Fetch options for filters from the database using SuiteQL
         */
        function getFilterOptions() {
            const filterData = {
                subsidiaries: [],
                itemTypes: [],
                divisions: []
            };

            try {
                // Sourced from standard subsidiary record
                filterData.subsidiaries = query.runSuiteQL({
                    query: 'SELECT id, name FROM subsidiary ORDER BY name'
                }).asMappedResults();

                // Sourced dynamically from distinct values in Material Request Details to prevent stale values
                filterData.itemTypes = query.runSuiteQL({
                    query: `
                        SELECT DISTINCT 
                            d.custrecord1289 AS id, 
                            BUILTIN.DF(d.custrecord1289) AS name 
                        FROM customrecord_njt_mat_req_details d 
                        WHERE d.custrecord1289 IS NOT NULL 
                        ORDER BY name
                    `
                }).asMappedResults();

                filterData.divisions = query.runSuiteQL({
                    query: `
                        SELECT DISTINCT 
                            d.custrecord_njt_sjs_devision_materidet AS id, 
                            BUILTIN.DF(d.custrecord_njt_sjs_devision_materidet) AS name 
                        FROM customrecord_njt_mat_req_details d 
                        WHERE d.custrecord_njt_sjs_devision_materidet IS NOT NULL 
                        ORDER BY name
                    `
                }).asMappedResults();

            } catch (e) {
                log.error('Error fetching filter options', e);
            }

            return filterData;
        }

        /**
         * Fetch main dataset and join with stock calculations
         */
        function getReportData(subId, itemTypeId, divisionId) {
            const results = [];
            try {
                let sql = `
                    SELECT
                        d.id AS line_id,
                        d.custrecord_njt_mat_request AS parent_id,
                        BUILTIN.DF(d.custrecord_njt_mat_request) AS parent_name,
                        d.custrecord_njt_mat_req_details_item AS item_id,
                        BUILTIN.DF(d.custrecord_njt_mat_req_details_item) AS item_name,
                        d.custrecord1289 AS item_type_id,
                        BUILTIN.DF(d.custrecord1289) AS item_type_name,
                        d.custrecord_njt_mat_req_det_quantity AS req_qty,
                        h.custrecord_njt_mat_req_loc AS loc_id,
                        BUILTIN.DF(h.custrecord_njt_mat_req_loc) AS loc_name,
                        h.custrecord_njt_mat_req_subsidery AS subsidiary_id,
                        BUILTIN.DF(h.custrecord_njt_mat_req_subsidery) AS subsidiary_name,
                        d.custrecord_njt_sjs_devision_materidet AS division_id,
                        BUILTIN.DF(d.custrecord_njt_sjs_devision_materidet) AS division_name
                    FROM customrecord_njt_mat_req_details d
                    INNER JOIN customrecord_njt_material_req_h h ON d.custrecord_njt_mat_request = h.id
                    WHERE (LOWER(BUILTIN.DF(d.custrecord_njt_matreq_details_status)) LIKE '%open%' OR d.custrecord_njt_matreq_details_status IS NULL)
                `;

                const params = [];
                if (subId) {
                    sql += ' AND h.custrecord_njt_mat_req_subsidery = ?';
                    params.push(subId);
                }
                if (itemTypeId) {
                    sql += ' AND d.custrecord1289 = ?';
                    params.push(itemTypeId);
                }
                if (divisionId) {
                    sql += ' AND d.custrecord_njt_sjs_devision_materidet = ?';
                    params.push(divisionId);
                }

                sql += ' ORDER BY d.id DESC';

                const mainResults = query.runSuiteQL({ query: sql, params: params }).asMappedResults();
                if (mainResults.length === 0) return [];

                // Extract all unique item IDs to perform a batch lookup of location stock
                const itemIds = [...new Set(mainResults.map(r => r.item_id).filter(Boolean))];

                // Perform batch stock lookup across all item locations where quantity on hand > 0
                const stockMap = {};
                const otherStockMap = {};
                if (itemIds.length > 0) {
                    const stockSql = `
                        SELECT 
                            ib.item AS item_id,
                            ib.location AS location_id,
                            loc.name AS location_name,
                            SUM(ib.quantityonhand) AS qty_on_hand
                        FROM inventoryBalance ib
                        INNER JOIN location loc ON ib.location = loc.id
                        WHERE ib.item IN (${itemIds.join(',')})
                        GROUP BY ib.item, ib.location, loc.name
                        HAVING SUM(ib.quantityonhand) > 0
                    `;
                    const stockResults = query.runSuiteQL({ query: stockSql }).asMappedResults();

                    stockResults.forEach(s => {
                        const itemId = s.item_id;
                        const locId = s.location_id;
                        const locName = s.location_name;
                        const qty = Number(s.qty_on_hand) || 0;

                        if (!stockMap[itemId]) stockMap[itemId] = {};
                        stockMap[itemId][locId] = qty;

                        if (!otherStockMap[itemId]) otherStockMap[itemId] = [];
                        otherStockMap[itemId].push({ id: locId, name: locName, qty: qty });
                    });
                }

                // Map results and compute location Qty on Hand + Needed Qty + Other Stock breakdown
                mainResults.forEach(row => {
                    const itemId = row.item_id;
                    const requestedLocId = row.loc_id;
                    const reqQty = Number(row.req_qty) || 0;

                    // Qty on Hand at the requested location
                    const qtyOnHand = (stockMap[itemId] && stockMap[itemId][requestedLocId]) ? stockMap[itemId][requestedLocId] : 0;
                    const neededQty = Math.max(0, reqQty - qtyOnHand);

                    // Compile breakdown of other locations where inventory is available
                    const otherStockArr = (otherStockMap[itemId] || []).filter(s => s.id !== requestedLocId);
                    const otherStockText = otherStockArr.map(s => `${s.name} (${s.qty})`).join(', ') || 'None';

                    // Generate clickable link to Parent Material Request Record
                    let parentLink = '';
                    if (row.parent_id) {
                        parentLink = url.resolveRecord({
                            recordType: 'customrecord_njt_material_req_h',
                            recordId: row.parent_id,
                            isEditMode: false
                        });
                    }

                    results.push({
                        line_id: row.line_id,
                        parent_id: row.parent_id,
                        parent_name: row.parent_name,
                        parent_link: parentLink,
                        item_id: row.item_id,
                        item_name: row.item_name,
                        item_type_id: row.item_type_id,
                        item_type_name: row.item_type_name || 'None',
                        req_qty: reqQty,
                        loc_id: requestedLocId,
                        loc_name: row.loc_name || 'None',
                        qty_on_hand: qtyOnHand,
                        needed_qty: neededQty,
                        division_name: row.division_name || 'None',
                        subsidiary_name: row.subsidiary_name || 'None',
                        other_stock_text: otherStockText,
                        stock_locations: otherStockMap[itemId] || []
                    });
                });

            } catch (e) {
                log.error('Error fetching report data', e);
            }
            return results;
        }

        /**
         * Group and consolidate report data solely by Item
         */
        function consolidateReportData(data) {
            const grouped = {};
            data.forEach(row => {
                const key = row.item_id || '';
                if (!grouped[key]) {
                    grouped[key] = {
                        item_id: row.item_id,
                        item_name: row.item_name,
                        item_type_id: row.item_type_id,
                        item_type_name: row.item_type_name,
                        req_qty: 0,
                        qty_on_hand: 0,
                        needed_qty: 0,
                        stock_locations: row.stock_locations || []
                    };
                }
                grouped[key].req_qty += Number(row.req_qty) || 0;
            });

            return Object.keys(grouped).map(key => {
                const row = grouped[key];
                
                // Sum stock across ALL locations for this item
                let totalAllStock = 0;
                row.stock_locations.forEach(s => {
                    totalAllStock += Number(s.qty) || 0;
                });
                row.qty_on_hand = totalAllStock;
                
                // Calculate Needed Qty at the consolidated level
                row.needed_qty = Math.max(0, row.req_qty - row.qty_on_hand);
                
                return row;
            });
        }

        /**
         * Construct the HTML presentation code
         */
        function buildReportHtml(data, filterData, subId, itemTypeId, divisionId, viewType) {
            // Pre-calculate sums for KPI Cards
            // Pre-calculate sums for KPI Cards
            let totalOpenLines = data.length;
            let totalRequiredQty = 0;
            let totalQtyOnHand = 0;
            let totalNeededQty = 0;

            if (viewType === 'consolidated') {
                const itemTotals = {};
                data.forEach(row => {
                    const itemId = row.item_id || 'unknown';
                    if (!itemTotals[itemId]) {
                        // Sum stock across ALL locations for this item
                        let totalStock = 0;
                        const stockLocs = row.stock_locations || [];
                        stockLocs.forEach(s => {
                            totalStock += Number(s.qty) || 0;
                        });

                        itemTotals[itemId] = {
                            req_qty: 0,
                            qty_on_hand: totalStock
                        };
                    }
                    itemTotals[itemId].req_qty += Number(row.req_qty) || 0;
                });

                for (const itemId in itemTotals) {
                    const item = itemTotals[itemId];
                    totalRequiredQty += item.req_qty;
                    totalQtyOnHand += item.qty_on_hand;
                    totalNeededQty += Math.max(0, item.req_qty - item.qty_on_hand);
                }
            } else {
                // Detailed view: sum required line-by-line, and sum unique stock by (item, location)
                const uniqueStock = {};
                data.forEach(row => {
                    totalRequiredQty += Number(row.req_qty) || 0;
                    
                    const key = `${row.item_id}_${row.loc_id || ''}`;
                    if (!(key in uniqueStock)) {
                        uniqueStock[key] = Number(row.qty_on_hand) || 0;
                    }
                });

                for (const key in uniqueStock) {
                    totalQtyOnHand += uniqueStock[key];
                }

                // Total Needed Qty is total Required minus total stock at MR locations
                totalNeededQty = Math.max(0, totalRequiredQty - totalQtyOnHand);
            }

            // Generate Options HTML for Filters
            const subOptions = filterData.subsidiaries.map(s =>
                `<option value="${s.id}" ${subId == s.id ? 'selected' : ''}>${s.name}</option>`
            ).join('');

            const typeOptions = filterData.itemTypes.map(t =>
                `<option value="${t.id}" ${itemTypeId == t.id ? 'selected' : ''}>${t.name}</option>`
            ).join('');

            const divisionOptions = filterData.divisions.map(d =>
                `<option value="${d.id}" ${divisionId == d.id ? 'selected' : ''}>${d.name}</option>`
            ).join('');

            let tableHeaderHtml = '';
            if (viewType === 'consolidated') {
                tableHeaderHtml = `
                    <th style="width: 50px; text-align: center;">S.No</th>
                    <th onclick="sortTable(1)">Item Type</th>
                    <th onclick="sortTable(2)">Item</th>
                    <th onclick="sortTable(3)" style="text-align: right;">Required Qty</th>
                    <th onclick="sortTable(4)" style="text-align: right;">Qty On Hand</th>
                    <th onclick="sortTable(5)" style="text-align: right;">Needed Qty</th>
                    <th style="text-align: center; width: 150px;">Stock Locations</th>
                `;
            } else {
                tableHeaderHtml = `
                    <th style="width: 50px; text-align: center;">S.No</th>
                    <th onclick="sortTable(1)">Material Request</th>
                    <th onclick="sortTable(2)">Subsidiary</th>
                    <th onclick="sortTable(3)">Division</th>
                    <th onclick="sortTable(4)">Item</th>
                    <th onclick="sortTable(5)">Item Type</th>
                    <th onclick="sortTable(6)" style="text-align: right;">Required Qty</th>
                    <th onclick="sortTable(7)">MR Location</th>
                    <th onclick="sortTable(8)" style="text-align: right;">Qty On Hand</th>
                    <th onclick="sortTable(9)" style="text-align: right;">Needed Qty</th>
                `;
            }

            // Build Report Grid Rows
            let tableRowsHtml = '';
            data.forEach((row, idx) => {
                const neededClass = row.needed_qty > 0 ? 'backorder-alert' : 'backorder-ok';
                const rowClass = row.needed_qty > 0 ? 'row-needed' : '';

                let totalAllStock = 0;
                (row.stock_locations || []).forEach(s => {
                    totalAllStock += Number(s.qty) || 0;
                });

                if (viewType === 'consolidated') {
                    const stockJson = JSON.stringify(row.stock_locations || []).replace(/"/g, '&quot;');
                    tableRowsHtml += `
                        <tr class="${rowClass}" data-item-id="${row.item_id || ''}" data-all-stock="${row.qty_on_hand}">
                            <td class="sno-col cell-data">${idx + 1}</td>
                            <td class="cell-data" style="text-align:left;">${row.item_type_name}</td>
                            <td class="cell-data" style="text-align:left; font-weight:600;">${row.item_name}</td>
                            <td class="cell-data num">${row.req_qty}</td>
                            <td class="cell-data num">${row.qty_on_hand}</td>
                            <td class="cell-data num" style="font-weight:700;"><span class="${neededClass}">${row.needed_qty}</span></td>
                            <td class="cell-data" style="text-align:center;">
                                <button type="button" class="btn-view-stock" data-item="${(row.item_name || '').replace(/"/g, '&quot;')}" data-stock="${stockJson}" onclick="openStockModalFromButton(this)">View Stock</button>
                            </td>
                        </tr>
                    `;
                } else {
                    tableRowsHtml += `
                        <tr class="${rowClass}" data-item-id="${row.item_id || ''}" data-loc-id="${row.loc_id || ''}">
                            <td class="sno-col cell-data">${idx + 1}</td>
                            <td class="cell-data" style="text-align:left;">
                                <a href="${row.parent_link}" target="_blank" class="mr-link">${row.parent_name}</a>
                            </td>
                            <td class="cell-data" style="text-align:left;">${row.subsidiary_name}</td>
                            <td class="cell-data" style="text-align:left;">${row.division_name}</td>
                            <td class="cell-data" style="text-align:left; font-weight:600;">${row.item_name}</td>
                            <td class="cell-data">${row.item_type_name}</td>
                            <td class="cell-data num">${row.req_qty}</td>
                            <td class="cell-data" style="text-align:left;">${row.loc_name}</td>
                            <td class="cell-data num">${row.qty_on_hand}</td>
                            <td class="cell-data num" style="font-weight:700;"><span class="${neededClass}">${row.needed_qty}</span></td>
                        </tr>
                    `;
                }
            });

            if (data.length === 0) {
                const colSpanCount = viewType === 'consolidated' ? 7 : 10;
                tableRowsHtml = `
                    <tr>
                        <td colspan="${colSpanCount}" class="welcome-msg">No open material requests matching the selected filters were found.</td>
                    </tr>
                `;
            }

            // HTML Body Template
            return `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
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
                            padding: 20px 28px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            border-bottom: 3px solid #0284c7;
                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                        }
                        .header-logo {
                            font-size: 20px;
                            font-weight: 800;
                            letter-spacing: 0.5px;
                            color: #0f172a;
                        }
                        .header-logo span {
                            color: #0284c7;
                        }

                        /* Filter toolbar styling */
                        .filter-bar {
                            display: flex;
                            flex-wrap: wrap;
                            gap: 12px;
                            align-items: center;
                        }
                        .filter-bar select {
                            background: #f8fafc;
                            border: 1px solid #cbd5e1;
                            color: #1e293b;
                            padding: 10px 16px;
                            border-radius: 8px;
                            font-size: 13px;
                            font-weight: 600;
                            cursor: pointer;
                            outline: none;
                            transition: all 0.2s;
                        }
                        .filter-bar select:hover, .filter-bar select:focus {
                            border-color: #0284c7;
                            background: #ffffff;
                            box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
                        }

                        /* KPI dashboard block */
                        .metrics-bar {
                            display: flex;
                            gap: 16px;
                            padding: 24px 28px;
                            background: #ffffff;
                            border-bottom: 1px solid #f1f5f9;
                            overflow-x: auto;
                        }
                        .metric-card {
                            flex: 1;
                            min-width: 180px;
                            background: #ffffff;
                            border: 1px solid #e2e8f0;
                            border-radius: 12px;
                            padding: 16px 20px;
                            display: flex;
                            flex-direction: column;
                            gap: 6px;
                            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                        }
                        .metric-card:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
                            border-color: #cbd5e1;
                        }
                        .metric-card.lines-card { border-left: 4px solid #3b82f6; }
                        .metric-card.req-card { border-left: 4px solid #0284c7; }
                        .metric-card.stock-card { border-left: 4px solid #10b981; }
                        .metric-card.needed-card { border-left: 4px solid #f59e0b; }
                        
                        .metric-val {
                            font-size: 24px;
                            font-weight: 700;
                            color: #0f172a;
                        }
                        .metric-lbl {
                            font-size: 11px;
                            font-weight: 600;
                            color: #64748b;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                        }

                        /* Toolbar styling */
                        .toolbar {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            padding: 16px 28px;
                            background: #ffffff;
                            border-bottom: 1px solid #e2e8f0;
                        }
                        .search-wrap input {
                            padding: 8px 16px;
                            border: 1px solid #cbd5e1;
                            border-radius: 8px;
                            width: 300px;
                            font-size: 13px;
                            outline: none;
                            transition: all 0.2s;
                            background-color: #f8fafc;
                        }
                        .search-wrap input:focus {
                            background-color: #ffffff;
                            border-color: #0284c7;
                            box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
                        }
                        .btn-export {
                            padding: 10px 20px;
                            border: 1px solid #10b981;
                            border-radius: 8px;
                            background: #ffffff;
                            color: #10b981;
                            font-size: 13px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        }
                        .btn-export:hover {
                            background: #10b981;
                            color: #ffffff;
                            box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.15);
                        }

                        /* Table formatting */
                        .table-container {
                            margin: 24px 28px;
                            background: #ffffff;
                            border: 1px solid #e2e8f0;
                            border-radius: 12px;
                            overflow: hidden;
                            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
                        }
                        .table-scroll {
                            overflow-y: auto;
                            max-height: 75vh;
                        }
                        table {
                            border-collapse: separate;
                            border-spacing: 0;
                            width: 100%;
                        }
                        thead th {
                            background: #f8fafc;
                            color: #475569;
                            font-size: 11px;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 0.05em;
                            padding: 14px 16px;
                            border-right: 1px solid #e2e8f0;
                            border-bottom: 2px solid #e2e8f0;
                            position: sticky;
                            top: 0;
                            z-index: 10;
                            cursor: pointer;
                            text-align: left;
                        }
                        thead th:hover {
                            background-color: #f1f5f9;
                        }
                        .cell-data {
                            font-size: 13px;
                            color: #334155;
                            padding: 14px 16px;
                            border-right: 1px solid #f1f5f9;
                            border-bottom: 1px solid #f1f5f9;
                            vertical-align: middle;
                        }
                        tbody tr:hover td {
                            background-color: #f8fafc !important;
                        }
                        .num {
                            font-family: monospace;
                            font-size: 14px;
                            text-align: right !important;
                        }
                        .backorder-alert {
                            color: #ef4444;
                            background: #fee2e2;
                            padding: 4px 8px;
                            border-radius: 4px;
                            display: inline-block;
                        }
                        .backorder-ok {
                            color: #10b981;
                            background: #dcfce7;
                            padding: 4px 8px;
                            border-radius: 4px;
                            display: inline-block;
                        }
                        tr.row-needed td {
                            background-color: #fffbeb;
                        }
                        .mr-link {
                            color: #0284c7;
                            font-weight: 600;
                            text-decoration: none;
                        }
                        .mr-link:hover {
                            text-decoration: underline;
                        }
                        .welcome-msg {
                            padding: 80px 20px;
                            text-align: center;
                            color: #94a3b8;
                            font-size: 15px;
                        }

                        /* View Stock Button */
                        .btn-view-stock {
                            background: #0284c7;
                            color: #ffffff;
                            border: none;
                            padding: 6px 14px;
                            font-size: 12px;
                            font-weight: 600;
                            border-radius: 6px;
                            cursor: pointer;
                            transition: all 0.2s;
                            box-shadow: 0 1px 2px rgba(2, 132, 199, 0.05);
                        }
                        .btn-view-stock:hover {
                            background: #0369a1;
                            transform: translateY(-1px);
                            box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.15);
                        }
                        .btn-view-stock:active {
                            transform: translateY(0);
                        }

                        /* Modal Styling */
                        .modal-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: rgba(15, 23, 42, 0.5);
                            backdrop-filter: blur(4px);
                            display: none;
                            align-items: center;
                            justify-content: center;
                            z-index: 1000;
                            opacity: 0;
                            transition: opacity 0.25s ease;
                        }
                        .modal-overlay.active {
                            display: flex;
                            opacity: 1;
                        }
                        .modal-card {
                            background: #ffffff;
                            border-radius: 16px;
                            width: 480px;
                            max-width: 90%;
                            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                            border: 1px solid #e2e8f0;
                            transform: scale(0.95);
                            transition: transform 0.25s ease;
                            overflow: hidden;
                        }
                        .modal-overlay.active .modal-card {
                            transform: scale(1);
                        }
                        .modal-header {
                            padding: 16px 20px;
                            background: #f8fafc;
                            border-bottom: 1px solid #e2e8f0;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        .modal-header h3 {
                            margin: 0;
                            font-size: 15px;
                            font-weight: 700;
                            color: #0f172a;
                        }
                        .modal-close-btn {
                            background: transparent;
                            border: none;
                            font-size: 24px;
                            color: #64748b;
                            cursor: pointer;
                            transition: color 0.2s;
                            line-height: 1;
                        }
                        .modal-close-btn:hover {
                            color: #ef4444;
                        }
                        .modal-body {
                            padding: 20px;
                            max-height: 50vh;
                            overflow-y: auto;
                        }
                        .modal-table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        .modal-table th {
                            font-size: 11px;
                            font-weight: 700;
                            text-transform: uppercase;
                            color: #475569;
                            padding: 10px 12px;
                            border-bottom: 2px solid #e2e8f0;
                            text-align: left;
                        }
                        .modal-table td {
                            padding: 10px 12px;
                            font-size: 13px;
                            color: #334155;
                            border-bottom: 1px solid #f1f5f9;
                        }
                        .modal-table tr:last-child td {
                            border-bottom: none;
                        }
                        .modal-table td.num {
                            text-align: right;
                            font-family: monospace;
                            font-size: 14px;
                        }
                    </style>
                </head>
                <body>

                    <!-- Header -->
                    <div class="header">
                        <div class="header-logo">SJS ENERSOL <span>| ${viewType === 'consolidated' ? 'Material Request Back Order Report Consolidated' : 'Material Request Back Order Report Details'}</span></div>
                        <div class="filter-bar">
                            <select id="custpage_view" onchange="reloadReport()">
                                <option value="detailed" ${viewType === 'detailed' ? 'selected' : ''}>Detailed View</option>
                                <option value="consolidated" ${viewType === 'consolidated' ? 'selected' : ''}>Consolidated View</option>
                            </select>
                            <select id="custpage_subsidiary" onchange="reloadReport()">
                                <option value="">Select Subsidiary</option>
                                ${subOptions}
                            </select>
                            <select id="custpage_itemtype" onchange="reloadReport()">
                                <option value="">Select Item Type</option>
                                ${typeOptions}
                            </select>
                            <select id="custpage_division" onchange="reloadReport()">
                                <option value="">Select Division</option>
                                ${divisionOptions}
                            </select>
                        </div>
                    </div>

                    <!-- Metrics -->
                    <div class="metrics-bar">
                        <div class="metric-card lines-card">
                            <div class="metric-val">${totalOpenLines}</div>
                            <div class="metric-lbl">Total Open Lines</div>
                        </div>
                        <div class="metric-card req-card">
                            <div class="metric-val">${totalRequiredQty}</div>
                            <div class="metric-lbl">Total Required Qty</div>
                        </div>
                        <div class="metric-card stock-card">
                            <div class="metric-val">${totalQtyOnHand}</div>
                            <div class="metric-lbl">Total Qty on Hand</div>
                        </div>
                        <div class="metric-card needed-card">
                            <div class="metric-val">${totalNeededQty}</div>
                            <div class="metric-lbl">Total Needed Qty</div>
                        </div>
                    </div>

                    <!-- Toolbar -->
                    <div class="toolbar">
                        <div class="search-wrap">
                            <input type="text" id="reportSearch" placeholder="Search item, MR or location..." oninput="filterReportTable()">
                        </div>
                        <button type="button" class="btn-export" onclick="triggerExcelExport()">Export to CSV</button>
                    </div>

                    <!-- Report Table -->
                    <div class="table-container">
                        <div class="table-scroll">
                            <table id="reportTable">
                                <thead>
                                    <tr>
                                        ${tableHeaderHtml}
                                    </tr>
                                </thead>
                                <tbody id="reportTableBody">
                                    ${tableRowsHtml}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Stock Details Modal -->
                    <div id="stockModal" class="modal-overlay">
                        <div class="modal-card">
                            <div class="modal-header">
                                <h3 id="modalTitle">Location Stock Breakdown</h3>
                                <button type="button" class="modal-close-btn" onclick="closeStockModal()">&times;</button>
                            </div>
                            <div class="modal-body">
                                <table class="modal-table">
                                    <thead>
                                        <tr>
                                            <th style="text-align: left;">Location</th>
                                            <th style="text-align: right; width: 120px;">Qty On Hand</th>
                                        </tr>
                                    </thead>
                                    <tbody id="modalTableBody">
                                        <!-- Dynamic rows inserted via JS -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <script>
                        const VIEW_TYPE = "${viewType}";

                        function reloadReport() {
                            const view = document.getElementById("custpage_view").value;
                            const sub = document.getElementById("custpage_subsidiary").value;
                            const type = document.getElementById("custpage_itemtype").value;
                            const div = document.getElementById("custpage_division").value;
                            
                            let url = window.location.href.split("&custpage_")[0].split("?custpage_")[0];
                            url += url.indexOf("?") === -1 ? "?" : "&";
                            
                            if (view) url += "custpage_view=" + view + "&";
                            if (sub) url += "custpage_subsidiary=" + sub + "&";
                            if (type) url += "custpage_itemtype=" + type + "&";
                            if (div) url += "custpage_division=" + div + "&";
                            
                            // Remove trailing ampersand if exists
                            if (url.endsWith("&")) url = url.slice(0, -1);
                            
                            window.location.href = url;
                        }

                        function filterReportTable() {
                            const filter = document.getElementById("reportSearch").value.toUpperCase();
                            const tbody = document.getElementById("reportTableBody");
                            const trs = tbody.getElementsByTagName("tr");
                            
                            let visibleCount = 0;
                            let reqSum = 0;
                            let stockSum = 0;
                            let neededSum = 0;

                            const isConsolidated = (VIEW_TYPE === 'consolidated');
                            const limitCols = isConsolidated ? 7 : 10;
                            const reqIdx = isConsolidated ? 3 : 6;
                            const stockIdx = isConsolidated ? 4 : 8;
                            const neededIdx = isConsolidated ? 5 : 9;

                            if (isConsolidated) {
                                const visibleItemTotals = {};
                                for (let i = 0; i < trs.length; i++) {
                                    const tr = trs[i];
                                    if (tr.cells.length < limitCols) continue;

                                    const text = tr.innerText || tr.textContent;
                                    if (text.toUpperCase().indexOf(filter) > -1) {
                                        tr.style.display = "";
                                        visibleCount++;

                                        const itemId = tr.getAttribute("data-item-id") || "unknown";
                                        const allStock = parseFloat(tr.getAttribute("data-all-stock")) || 0;
                                        const reqQty = parseFloat(tr.cells[reqIdx].innerText) || 0;

                                        if (!visibleItemTotals[itemId]) {
                                            visibleItemTotals[itemId] = {
                                                req_qty: 0,
                                                qty_on_hand: allStock
                                            };
                                        }
                                        visibleItemTotals[itemId].req_qty += reqQty;
                                    } else {
                                        tr.style.display = "none";
                                    }
                                }

                                for (const itemId in visibleItemTotals) {
                                    const item = visibleItemTotals[itemId];
                                    reqSum += item.req_qty;
                                    stockSum += item.qty_on_hand;
                                    neededSum += Math.max(0, item.req_qty - item.qty_on_hand);
                                }
                            } else {
                                const uniqueStockTracker = {};
                                for (let i = 0; i < trs.length; i++) {
                                    const tr = trs[i];
                                    if (tr.cells.length < limitCols) continue;

                                    const text = tr.innerText || tr.textContent;
                                    if (text.toUpperCase().indexOf(filter) > -1) {
                                        tr.style.display = "";
                                        visibleCount++;

                                        reqSum += parseFloat(tr.cells[reqIdx].innerText) || 0;

                                        const itemId = tr.getAttribute("data-item-id") || "unknown";
                                        const locId = tr.getAttribute("data-loc-id") || "unknown";
                                        const key = itemId + "_" + locId;

                                        if (!(key in uniqueStockTracker)) {
                                            uniqueStockTracker[key] = parseFloat(tr.cells[stockIdx].innerText) || 0;
                                        }
                                    } else {
                                        tr.style.display = "none";
                                    }
                                }

                                for (const key in uniqueStockTracker) {
                                    stockSum += uniqueStockTracker[key];
                                }

                                neededSum = Math.max(0, reqSum - stockSum);
                            }

                            // Update KPI Cards dynamically on client-side search
                            document.querySelector(".lines-card .metric-val").textContent = visibleCount;
                            document.querySelector(".req-card .metric-val").textContent = reqSum;
                            document.querySelector(".stock-card .metric-val").textContent = stockSum;
                            document.querySelector(".needed-card .metric-val").textContent = neededSum;
                        }

                        let sortDirections = {};
                        function sortTable(colIdx) {
                            const tbody = document.getElementById("reportTableBody");
                            const rows = Array.from(tbody.querySelectorAll("tr"));
                            const isConsolidated = (VIEW_TYPE === 'consolidated');
                            const limitCols = isConsolidated ? 7 : 10;
                            if (rows.length === 1 && rows[0].cells.length < limitCols) return; // Skip if no data

                            const isAsc = !sortDirections[colIdx];
                            sortDirections[colIdx] = isAsc;

                            rows.sort((a, b) => {
                                let valA = a.cells[colIdx].innerText.trim();
                                let valB = b.cells[colIdx].innerText.trim();
                                
                                // Parse numbers if sorting numeric columns
                                const numericCols = isConsolidated ? [3, 4, 5] : [6, 8, 9];
                                if (numericCols.includes(colIdx)) {
                                    valA = parseFloat(valA) || 0;
                                    valB = parseFloat(valB) || 0;
                                }

                                if (valA === valB) return 0;
                                return isAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
                            });

                            tbody.innerHTML = "";
                            rows.forEach(r => tbody.appendChild(r));
                        }

                        function triggerExcelExport() {
                            const view = document.getElementById("custpage_view").value;
                            const sub = document.getElementById("custpage_subsidiary").value;
                            const type = document.getElementById("custpage_itemtype").value;
                            const div = document.getElementById("custpage_division").value;
                            
                            let exportUrl = window.location.href.split("&custpage_")[0].split("?custpage_")[0];
                            exportUrl += exportUrl.indexOf("?") === -1 ? "?" : "&";
                            exportUrl += "custpage_export=T";
                            
                            if (view) exportUrl += "&custpage_view=" + view;
                            if (sub) exportUrl += "&custpage_subsidiary=" + sub;
                            if (type) exportUrl += "&custpage_itemtype=" + type;
                            if (div) exportUrl += "&custpage_division=" + div;
                            
                            window.open(exportUrl, "_blank");
                        }

                        /* Modal JS Actions */
                        function openStockModalFromButton(btn) {
                            const itemName = btn.getAttribute("data-item");
                            const stockData = JSON.parse(btn.getAttribute("data-stock") || "[]");
                            showStockModal(itemName, stockData);
                        }

                        function showStockModal(itemName, stockList) {
                            document.getElementById("modalTitle").textContent = "Location Stock Breakdown - " + itemName;
                            const tbody = document.getElementById("modalTableBody");
                            tbody.innerHTML = "";
                            
                            if (!stockList || stockList.length === 0) {
                                const row = document.createElement("tr");
                                const td = document.createElement("td");
                                td.colSpan = 2;
                                td.style.textAlign = "center";
                                td.style.color = "#94a3b8";
                                td.style.padding = "20px";
                                td.textContent = "No stock available in any location.";
                                row.appendChild(td);
                                tbody.appendChild(row);
                            } else {
                                stockList.forEach(function(s) {
                                    const row = document.createElement("tr");
                                    
                                    const tdName = document.createElement("td");
                                    tdName.style.textAlign = "left";
                                    tdName.textContent = s.name;
                                    
                                    const tdQty = document.createElement("td");
                                    tdQty.className = "num";
                                    tdQty.style.textAlign = "right";
                                    tdQty.textContent = s.qty;
                                    
                                    row.appendChild(tdName);
                                    row.appendChild(tdQty);
                                    tbody.appendChild(row);
                                });
                            }
                            
                            const modal = document.getElementById("stockModal");
                            modal.style.display = "flex";
                            modal.offsetHeight; // force reflow
                            modal.classList.add("active");
                        }

                        function closeStockModal() {
                            const modal = document.getElementById("stockModal");
                            modal.classList.remove("active");
                            setTimeout(function() {
                                if (!modal.classList.contains("active")) {
                                    modal.style.display = "none";
                                }
                            }, 250);
                        }

                        window.addEventListener("click", function(event) {
                            const modal = document.getElementById("stockModal");
                            if (event.target === modal) {
                                closeStockModal();
                            }
                        });
                    </script>
                </body>
                </html>
            `;
        }

        /**
         * Construct the CSV export payload
         */
        function buildCSV(data, viewType) {
            let csv = '';
            if (viewType === 'consolidated') {
                csv = 'Item Type,Item,Required Qty,Qty On Hand,Needed Qty,Stock Locations\r\n';
                data.forEach(row => {
                    // Escape values containing commas or quotes
                    const escapeCSV = (val) => {
                        if (val === null || val === undefined) return '';
                        let str = String(val);
                        if (str.includes(',') || str.includes('"') || str.includes('\r') || str.includes('\n')) {
                            str = '"' + str.replace(/"/g, '""') + '"';
                        }
                        return str;
                    };

                    const stockText = (row.stock_locations || []).map(s => `${s.name} (${s.qty})`).join('; ') || 'None';

                    csv += `${escapeCSV(row.item_type_name)},` +
                        `${escapeCSV(row.item_name)},` +
                        `${row.req_qty},` +
                        `${row.qty_on_hand},` +
                        `${row.needed_qty},` +
                        `${escapeCSV(stockText)}\r\n`;
                });
            } else {
                csv = 'Material Request,Subsidiary,Division,Item,Item Type,Required Qty,MR Location,Qty On Hand,Needed Qty\r\n';
                data.forEach(row => {
                    // Escape values containing commas or quotes
                    const escapeCSV = (val) => {
                        if (val === null || val === undefined) return '';
                        let str = String(val);
                        if (str.includes(',') || str.includes('"') || str.includes('\r') || str.includes('\n')) {
                            str = '"' + str.replace(/"/g, '""') + '"';
                        }
                        return str;
                    };

                    csv += `${escapeCSV(row.parent_name)},` +
                        `${escapeCSV(row.subsidiary_name)},` +
                        `${escapeCSV(row.division_name)},` +
                        `${escapeCSV(row.item_name)},` +
                        `${escapeCSV(row.item_type_name)},` +
                        `${row.req_qty},` +
                        `${escapeCSV(row.loc_name)},` +
                        `${row.qty_on_hand},` +
                        `${row.needed_qty}\r\n`;
                });
            }
            return csv;
        }

        return { onRequest };
    });
