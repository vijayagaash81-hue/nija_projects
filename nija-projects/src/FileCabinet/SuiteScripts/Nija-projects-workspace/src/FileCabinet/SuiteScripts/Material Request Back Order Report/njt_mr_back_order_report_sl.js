/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * 
 * Material Request Back Order Report Suitelet
 * SJS ENERSOL | Executive Modern Slate & Accents Theme
 */

define(['N/ui/serverWidget', 'N/log', 'N/query', 'N/runtime', 'N/url', 'N/format'],
    (serverWidget, log, query, runtime, url, format) => {

        function onRequest(context) {
            try {
                const params = context.request.parameters;
                const subId = params.custpage_subsidiary || '';
                const itemTypeId = params.custpage_itemtype || '';
                const divisionId = params.custpage_division || '';
                const isExport = (params.custpage_export === 'T');

                // --- 1. FETCH FILTER OPTIONS ---
                const filterData = getFilterOptions();

                // --- 2. QUERY REPORT DATA ---
                const reportResults = getReportData(subId, itemTypeId, divisionId);

                // --- 3. EXPORT TO CSV LOGIC ---
                if (isExport) {
                    const csvContent = buildCSV(reportResults);
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

                htmlField.defaultValue = buildReportHtml(reportResults, filterData, subId, itemTypeId, divisionId);

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
                        other_stock_text: otherStockText
                    });
                });

            } catch (e) {
                log.error('Error fetching report data', e);
            }
            return results;
        }

        /**
         * Construct the HTML presentation code
         */
        function buildReportHtml(data, filterData, subId, itemTypeId, divisionId) {
            // Pre-calculate sums for KPI Cards
            let totalOpenLines = data.length;
            let totalRequiredQty = 0;
            let totalQtyOnHand = 0;
            let totalNeededQty = 0;

            data.forEach(row => {
                totalRequiredQty += row.req_qty;
                totalQtyOnHand += row.qty_on_hand;
                totalNeededQty += row.needed_qty;
            });

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

            // Build Report Grid Rows
            let tableRowsHtml = '';
            data.forEach((row, idx) => {
                const neededClass = row.needed_qty > 0 ? 'backorder-alert' : 'backorder-ok';
                const rowClass = row.needed_qty > 0 ? 'row-needed' : '';
                tableRowsHtml += `
                    <tr class="${rowClass}">
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
            });

            if (data.length === 0) {
                tableRowsHtml = `
                    <tr>
                        <td colspan="10" class="welcome-msg">No open material requests matching the selected filters were found.</td>
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
                    </style>
                </head>
                <body>

                    <!-- Header -->
                    <div class="header">
                        <div class="header-logo">SJS ENERSOL <span>| Material Request Back Order Report Details</span></div>
                        <div class="filter-bar">
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
                            const type = document.getElementById("custpage_itemtype").value;
                            const div = document.getElementById("custpage_division").value;
                            
                            let url = window.location.href.split("&custpage_")[0].split("?custpage_")[0];
                            url += url.indexOf("?") === -1 ? "?" : "&";
                            
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

                            for (let i = 0; i < trs.length; i++) {
                                const tr = trs[i];
                                // Skip empty indicator line
                                if (tr.cells.length < 10) continue;

                                const text = tr.innerText || tr.textContent;
                                if (text.toUpperCase().indexOf(filter) > -1) {
                                    tr.style.display = "";
                                    visibleCount++;

                                    reqSum += parseFloat(tr.cells[6].innerText) || 0;
                                    stockSum += parseFloat(tr.cells[8].innerText) || 0;
                                    neededSum += parseFloat(tr.cells[9].innerText) || 0;
                                } else {
                                    tr.style.display = "none";
                                }
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
                            if (rows.length === 1 && rows[0].cells.length < 10) return; // Skip if no data

                            const isAsc = !sortDirections[colIdx];
                            sortDirections[colIdx] = isAsc;

                            rows.sort((a, b) => {
                                let valA = a.cells[colIdx].innerText.trim();
                                let valB = b.cells[colIdx].innerText.trim();
                                
                                // Parse numbers if sorting numeric columns
                                if (colIdx === 6 || colIdx === 8 || colIdx === 9) {
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
                            const sub = document.getElementById("custpage_subsidiary").value;
                            const type = document.getElementById("custpage_itemtype").value;
                            const div = document.getElementById("custpage_division").value;
                            
                            let exportUrl = window.location.href.split("&custpage_")[0].split("?custpage_")[0];
                            exportUrl += exportUrl.indexOf("?") === -1 ? "?" : "&";
                            exportUrl += "custpage_export=T";
                            
                            if (sub) exportUrl += "&custpage_subsidiary=" + sub;
                            if (type) exportUrl += "&custpage_itemtype=" + type;
                            if (div) exportUrl += "&custpage_division=" + div;
                            
                            window.open(exportUrl, "_blank");
                        }
                    </script>
                </body>
                </html>
            `;
        }

        /**
         * Construct the CSV export payload
         */
        function buildCSV(data) {
            let csv = 'Material Request,Subsidiary,Division,Item,Item Type,Required Qty,MR Location,Qty On Hand,Needed Qty\r\n';
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
            return csv;
        }

        return { onRequest };
    });
