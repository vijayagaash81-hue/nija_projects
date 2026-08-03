/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/query', 'N/task', 'N/redirect', 'N/log', 'N/url', 'N/runtime'],
    (ui, query, task, redirect, log, url, runtime) => {

        const onRequest = (context) => {
            const params = context.request.parameters;

            if (context.request.method === 'POST') {

                const data = params.custpage_payload || '[]';

                const mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_pick_list_ceration_mrs',
                    deploymentId: 'customdeploy_pick_list_ceration_mrs',
                    params: {
                        custscript_picklist_data: data,
                        custscript_groupby: params.custpage_groupby,
                        custscript_pickdate: params.custpage_pick_date
                    }
                });

                const taskId = mrTask.submit();

                redirect.toSuitelet({
                    scriptId: 'customscript_pick_list_loading_bar_sut',
                    deploymentId: 'customdeploy_pick_list_loading_bar_sut',
                    parameters: {
                        custscript_chqall_tskid: taskId
                    }
                });

                return;
            }

            const form = ui.createForm({
                title: 'Pick List'
            });

            form.clientScriptModulePath = './Picklist wizard cs.js';

            form.addField({
                id: 'custpage_payload',
                type: ui.FieldType.LONGTEXT,
                label: 'payload'
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            const groupField = form.addField({
                id: 'custpage_groupby',
                type: ui.FieldType.TEXT,
                label: 'group'
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            const pickDateField = form.addField({
                id: 'custpage_pick_date',
                type: ui.FieldType.DATE,
                label: 'pickdate'
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            if (params.groupBy) {
                groupField.defaultValue = params.groupBy;
            }

            if (params.pickDate) {
                pickDateField.defaultValue = params.pickDate;
            }

            let conditions = [];

            if (params.docType == 'salesorder') {
                conditions.push(`t.recordtype = 'salesorder'`);
            }
            else if (params.docType == 'intercompany') {
                conditions.push(`t.recordtype = 'intercompanytransferorder'`);
            }
            else if (params.docType == 'transferorder') {
                conditions.push(`t.recordtype = 'transferorder'`);
            }

            conditions.push(`tl.mainline = 'F'`);
            conditions.push(`tl.taxline = 'F'`);

            if (params.subsidiary) {
                conditions.push(`tl.subsidiary = ${params.subsidiary}`);
            }

            if (params.location) {
                conditions.push(`tl.location = ${params.location}`);
            }

            if (params.dateFrom) {
                conditions.push(`
                    t.trandate >= TO_DATE('${params.dateFrom}','DD/MM/YYYY')
                `);
            }

            if (params.dateTo) {
                conditions.push(`
                    t.trandate <= TO_DATE('${params.dateTo}','DD/MM/YYYY')
                `);
            }


            if (params.customer) {
                conditions.push(`t.entity = ${params.customer}`);
            }

            if (params.document) {
                conditions.push(`t.id = ${params.document}`);
            }

            const whereClause = `WHERE ${conditions.join(' AND ')}`;

            const havingClause = `
                HAVING NVL(
                    ABS(tl.quantity) -
                    SUM(pl.custrecord_pl_det_picked_quantity),
                    ABS(tl.quantity)
                ) > 0
            `;

            const suiteQL = `
                SELECT
                    t.id,
                    t.tranid,
                    t.trandate,
                    t.entity AS customer,
                    BUILTIN.DF(t.entity) AS customer_name,
                    tl.item,
                    tl.location AS locvalue,
                    loc.name AS location_name,
                    tl.units AS unitid,
                    BUILTIN.DF(tl.units) AS unit_name,
                    ABS(tl.quantity) AS document_qty,
                    i.displayname AS item_name,
                    NVL(
                        ABS(tl.quantity) -
                        SUM(pl.custrecord_pl_det_picked_quantity),
                        ABS(tl.quantity)
                    ) AS remaining_qty
                FROM transaction t
                INNER JOIN transactionline tl
                    ON tl.transaction = t.id
                LEFT JOIN item i
                    ON i.id = tl.item
                LEFT JOIN location loc
                    ON loc.id = tl.location
                LEFT JOIN customrecord_pick_list_details pl
                    ON pl.custrecord_pl_det_doc_num = t.id
                    AND pl.custrecord_pl_det_item = tl.item
                ${whereClause}
                GROUP BY
                    t.id,
                    t.tranid,
                    t.trandate,
                    t.entity,
                    BUILTIN.DF(t.entity),
                    tl.item,
                    tl.location,
                    loc.name,
                    tl.units,
                    BUILTIN.DF(tl.units),
                    tl.quantity,
                    i.displayname
                ${havingClause}
            `;

            let results = [];
            if (params.document) {
                log.debug('suiteQL', suiteQL);
                results = query.runSuiteQL({
                    query: suiteQL,
                    pageSize: 1000
                }).asMappedResults();
            }

            // ===== Batched in-stock lookup (fixes SSS_USAGE_LIMIT_EXCEEDED caused by per-row queries) =====
            const inStockMap = getInStockMap(results);

            const rowsData = [];
            for (let i = 0; i < results.length; i++) {

                let r = results[i];

                let rowDate = params.pickDate ? params.pickDate : '';
                let rowDoc = r.id ? r.id.toString() : '';
                let rowTranId = r.tranid ? r.tranid.toString() : '';
                let rowCustomer = r.customer ? r.customer.toString() : '';
                let rowCustomerName = r.customer_name ? r.customer_name : '';
                let rowItem = r.item ? r.item.toString() : '';
                let rowItemName = r.item_name ? r.item_name : '';
                let rowUnits = r.unitid ? r.unitid.toString() : '';
                let rowUnitsName = r.unit_name ? r.unit_name : '';
                let rowLocation = r.locvalue ? r.locvalue : '';
                let rowLocationName = r.location_name ? r.location_name : '';
                let rowDocQty = r.document_qty ? parseFloat(r.document_qty) : 0;
                let rowRemainingQty = r.remaining_qty ? parseFloat(r.remaining_qty) : 0;

                var inStockKey = r.item + '_' + r.locvalue;
                var inStockValue = inStockMap[inStockKey] || 0;

                rowsData.push({
                    date: rowDate,
                    doc: rowDoc,
                    tranid: rowTranId,
                    customer: rowCustomer,
                    customername: rowCustomerName,
                    item: rowItem,
                    itemname: rowItemName,
                    units: rowUnits,
                    unitsname: rowUnitsName,
                    location: rowLocation,
                    locationname: rowLocationName,
                    docqty: rowDocQty,
                    remainingqty: rowRemainingQty,
                    instock: parseFloat(inStockValue || 0)
                });
            }

            const tableHtml = buildPicklistTable(rowsData);

            const inlineHtml = form.addField({
                id: 'custpage_report_html',
                type: ui.FieldType.INLINEHTML,
                label: ' '
            });
            inlineHtml.defaultValue = '<div style="margin-top:20px;">' + tableHtml + '</div>';

            form.addSubmitButton({
                label: 'Create Pick List'
            });

            context.response.writePage(form);
        };

        function getinstockdetails(item, location) {
            try {

                const sql = `
                  SELECT SUM(quantityavailable)  AS quantityavailable FROM InventoryBalance  WHERE item=${item} AND location=${location}

                `;

                const res = query.runSuiteQL({
                    query: sql,
                    pageSize: 1000
                }).asMappedResults();

                if (res.length > 0) {
                    return {

                        available: Number(res[0].quantityavailable || 0)
                    };
                }

                return {
                    onhand: 0,
                    available: 0
                };

            } catch (e) {

                log.error('INSTOCK_ERROR', e);

                return {
                    onhand: 0,
                    available: 0
                };
            }
        }

        function getInStockMap(results) {
            const map = {};

            if (!results || results.length === 0) {
                return map;
            }

            const seenPairs = {};
            const pairList = [];

            results.forEach((r) => {
                if (!r.item || !r.locvalue) {
                    return;
                }
                const key = r.item + '_' + r.locvalue;
                if (!seenPairs[key]) {
                    seenPairs[key] = true;
                    pairList.push(`(${r.item},${r.locvalue})`);
                }
            });

            if (pairList.length === 0) {
                return map;
            }

            try {
                const sql = `
                    SELECT item, location, SUM(quantityavailable) AS quantityavailable
                    FROM InventoryBalance
                    WHERE (item, location) IN (${pairList.join(',')})
                    GROUP BY item, location
                `;

                const res = query.runSuiteQL({
                    query: sql,
                    pageSize: 1000
                }).asMappedResults();

                res.forEach((row) => {
                    const key = row.item + '_' + row.location;
                    map[key] = Number(row.quantityavailable || 0);
                });

            } catch (e) {
                log.error('INSTOCK_MAP_ERROR', e);
            }

            return map;
        }

        const escapeHtml = (s) => { if (s === null || s === undefined) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };

        function buildPicklistTable(rowsData) {

            let style = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700&display=swap');
                
                .rpt-container {
                    width: 100%;
                    font-family: "Inter", sans-serif;
                    background-color: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
                    margin-bottom: 25px;
                    padding: 24px;
                    box-sizing: border-box;
                }
                
                .rpt-table-wrapper {
                    overflow-x: auto;
                    width: 100%;
                    border-radius: 8px;
                    border: 1px solid #cbd5e1;
                    box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
                }

                .rpt-table-wrapper::-webkit-scrollbar {
                    height: 8px;
                }
                .rpt-table-wrapper::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 4px;
                }
                .rpt-table-wrapper::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .rpt-table-wrapper::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }

                table#picklistTable {
                    width: 100% !important;
                    border-collapse: separate;
                    border-spacing: 0;
                    border: none !important;
                }
                
                #picklistTable th {
                    background: linear-gradient(135deg, #1e293b, #0f172a);
                    color: #f8fafc;
                    padding: 14px 16px;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 600;
                    border-top: none !important;
                    border-bottom: 2px solid #0f172a !important;
                    border-right: 1px solid #334155 !important;
                    text-align: left;
                    white-space: nowrap;
                }
                
                #picklistTable th:last-child {
                    border-right: none !important;
                }
                
                #picklistTable td {
                    padding: 12px 16px;
                    border-top: none !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    border-right: 1px solid #e2e8f0 !important;
                    font-size: 13px;
                    color: #334155;
                    white-space: nowrap;
                    vertical-align: middle;
                    background-color: #ffffff;
                }
                
                #picklistTable td:last-child {
                    border-right: none !important;
                }
                
                #picklistTable tbody tr:last-child td {
                    border-bottom: none !important;
                }
                
                #picklistTable tbody tr:hover td {
                    background-color: #f8fafc;
                    color: #0f172a;
                    transition: background-color 0.15s ease, color 0.15s ease;
                }

                .num-header {
                    text-align: right !important;
                }
                
                .center-header {
                    text-align: center !important;
                }
                
                .num {
                    text-align: right;
                    font-variant-numeric: tabular-nums;
                    font-weight: 500;
                }
                
                .center {
                    text-align: center;
                }

                .rpt-title {
                    font-family: 'Outfit', sans-serif;
                    font-size: 24px;
                    font-weight: 700;
                    color: #0f172a;
                    text-align: left;
                    margin-top: 5px;
                    margin-bottom: 24px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .rpt-title::before {
                    content: '';
                    display: inline-block;
                    width: 4px;
                    height: 24px;
                    background: linear-gradient(to bottom, #6366f1, #06b6d4);
                    border-radius: 4px;
                }

                input.picklist-qty-input {
                    width: 90px;
                    padding: 6px 12px;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 6px;
                    font-family: 'Inter', sans-serif;
                    font-size: 13px;
                    font-weight: 500;
                    text-align: right;
                    color: #1e293b;
                    background-color: #ffffff;
                    transition: all 0.2s ease-in-out;
                    box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
                }
                
                input.picklist-qty-input:focus {
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
                    outline: none;
                }

                input.picklist-select, input#picklistSelectAll {
                    accent-color: #6366f1;
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                    border-radius: 4px;
                }

                .picklist-controls-top {
                    margin-bottom: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 13px;
                    color: #64748b;
                }
                
                .picklist-controls-bottom {
                    margin-top: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 13px;
                    color: #64748b;
                }

                .dataTables_filter input {
                    padding: 6px 12px !important;
                    border: 1.5px solid #cbd5e1 !important;
                    border-radius: 6px !important;
                    background-color: #fff !important;
                    outline: none !important;
                    transition: all 0.2s ease !important;
                    font-size: 13px !important;
                    font-family: "Inter", sans-serif !important;
                }
                
                .dataTables_filter input:focus {
                    border-color: #6366f1 !important;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
                }
                
                .dataTables_length select {
                    padding: 6px 32px 6px 12px !important;
                    border: 1.5px solid #cbd5e1 !important;
                    border-radius: 6px !important;
                    outline: none !important;
                    font-size: 13px !important;
                    background-color: #fff !important;
                    font-family: "Inter", sans-serif !important;
                }

                .dataTables_wrapper .dataTables_paginate .paginate_button.current {
                    background: #6366f1 !important;
                    color: #ffffff !important;
                    border: 1px solid #6366f1 !important;
                    border-radius: 6px !important;
                    font-weight: 600 !important;
                }
                
                .dataTables_wrapper .dataTables_paginate .paginate_button:hover {
                    background: #f1f5f9 !important;
                    border-color: #cbd5e1 !important;
                    color: #0f172a !important;
                    border-radius: 6px !important;
                }

                /* Make NetSuite buttons on this page look premium */
                input[type="button"], input[type="submit"], button.pgBttn {
                    background: linear-gradient(135deg, #4f46e5, #6366f1) !important;
                    color: #ffffff !important;
                    border: none !important;
                    border-radius: 6px !important;
                    padding: 10px 20px !important;
                    font-family: "Inter", sans-serif !important;
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    cursor: pointer !important;
                    box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.15) !important;
                    transition: all 0.2s ease !important;
                }
                
                input[type="button"]:hover, input[type="submit"]:hover, button.pgBttn:hover {
                    background: linear-gradient(135deg, #4338ca, #4f46e5) !important;
                    box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.2) !important;
                    transform: translateY(-1px);
                }
                
                input[type="button"]:active, input[type="submit"]:active, button.pgBttn:active {
                    transform: translateY(0);
                }
            </style>
            <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.13.4/css/jquery.dataTables.min.css">
            <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
            <script src="https://cdn.datatables.net/1.13.4/js/jquery.dataTables.min.js"></script>`;

            let html = `<div class="rpt-container">${style}<div class="rpt-title">Pick List</div>`;
            html += `<div class="rpt-table-wrapper"><table id="picklistTable" class="display"><thead><tr>`;

            const headers = [
                { name: 'Date', class: '' },
                { name: 'Document Number', class: '' },
                { name: 'Customer', class: '' },
                { name: 'Item', class: '' },
                { name: 'Item Name', class: '' },
                { name: 'Units', class: '' },
                { name: 'Location', class: '' },
                { name: 'Instock', class: 'num-header' },
                { name: 'Document Qty', class: 'num-header' },
                { name: 'Remaining Pick Qty', class: 'num-header' },
                { name: 'Pick Qty', class: 'center-header' }
            ];
            
            html += `<th class="center-header"><input type="checkbox" id="picklistSelectAll"></th>`;
            headers.forEach(h => html += `<th class="${h.class}">${h.name}</th>`);
            html += `</tr></thead><tbody>`;

            rowsData.forEach((row, idx) => {
                html += `<tr>
                    <td class="picklist-select-cell center"><input type="checkbox" class="picklist-select custpage_select" id="custpage_select_${idx}" data-idx="${idx}"></td>
                    <td class="custpage_date" data-idx="${idx}">${escapeHtml(row.date)}</td>
                    <td class="picklist-doc custpage_doc" data-idx="${idx}">${escapeHtml(row.tranid)}</td>
                    <td class="picklist-customer custpage_customer" data-idx="${idx}">${escapeHtml(row.customername)}</td>
                    <td class="picklist-item custpage_item" data-idx="${idx}">${escapeHtml(row.item)}</td>
                    <td class="custpage_itemname" data-idx="${idx}">${escapeHtml(row.itemname)}</td>
                    <td class="picklist-units custpage_units" data-idx="${idx}">${escapeHtml(row.unitsname)}</td>
                    <td class="picklist-location custpage_location" data-idx="${idx}">${escapeHtml(row.locationname)}</td>
                    <td class="num custpage_instock" data-idx="${idx}">${row.instock}</td>
                    <td class="num custpage_docqty" data-idx="${idx}">${row.docqty}</td>
                    <td class="num custpage_remainingqty" data-idx="${idx}">${row.remainingqty}</td>
                    <td class="center"><input type="number" class="picklist-qty-input custpage_pickqty" id="custpage_pickqty_${idx}" data-idx="${idx}" value="0" step="any"></td>
                </tr>`;
            });

            html += `</tbody></table></div></div>`;

            html += `
            <script>
                var nsPicklistRowsData = ${JSON.stringify(rowsData)};
                var picklistTableApi;

                $(document).ready(function() {
                    picklistTableApi = $('#picklistTable').DataTable({
                        paging: true,
                        pageLength: 50,
                        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
                        info: true,
                        searching: true,
                        ordering: true,
                        scrollX: false,
                        autoWidth: false,
                        dom: '<"picklist-controls-top"lfp>rt<"picklist-controls-bottom"ip>',
                        columnDefs: [
                            { orderable: false, targets: [0, 11] }
                        ]
                    });

                    $('#picklistSelectAll').on('click', function() {
                        var isChecked = $(this).prop('checked');
                        picklistTableApi.rows({ search: 'applied' }).nodes().to$().find('.picklist-select').prop('checked', isChecked);
                    });

                    $('#picklistTable').on('change', '.picklist-select', function() {
                        updateSelectAllState();
                    });

                    // Qty Input change and validation logic
                    $('#picklistTable').on('change keyup', '.picklist-qty-input', function() {
                        var input = $(this);
                        var idx = input.data('idx');
                        var rowData = nsPicklistRowsData[idx];
                        var enteredQty = parseFloat(input.val()) || 0;
                        var instock = parseFloat(rowData.instock || 0);
                        var remQty = parseFloat(rowData.remainingqty || 0);
                        var checkbox = $('#picklistTable').find('.picklist-select[data-idx="' + idx + '"]');

                        if (enteredQty > instock) {
                            alert("Chosen Qty Stock is higher than stock available");
                            checkbox.prop('checked', false);
                            input.val(0);
                            updateSelectAllState();
                            return false;
                        } else if (enteredQty > remQty) {
                            alert('Chosen quantity exceeds required quantity.\\n\\nRemaining Qty: ' + remQty + '\\nSelected Qty: ' + enteredQty);
                            checkbox.prop('checked', false);
                            input.val(0);
                            updateSelectAllState();
                            return false;
                        } else if (enteredQty > 0) {
                            checkbox.prop('checked', true);
                        } else {
                            checkbox.prop('checked', false);
                        }

                        updateSelectAllState();
                    });
                });

                function updateSelectAllState() {
                    if (!picklistTableApi) return;
                    var totalVisible = picklistTableApi.rows({ search: 'applied' }).nodes().to$().find('.picklist-select').length;
                    var totalChecked = picklistTableApi.rows({ search: 'applied' }).nodes().to$().find('.picklist-select:checked').length;
                    $('#picklistSelectAll').prop('checked', totalVisible > 0 && totalVisible === totalChecked);
                }

                function nsPicklistValidateAndBuildPayload() {
                    if (!picklistTableApi) return false;
                    var payload = [];
                    var isValid = true;
                    var rows = picklistTableApi.rows().nodes().to$();

                    rows.each(function() {
                        var row = $(this);
                        var checkbox = row.find('.picklist-select');
                        if (checkbox.prop('checked')) {
                            var idx = checkbox.data('idx');
                            var rowData = nsPicklistRowsData[idx];
                            var qtyValStr = row.find('input.picklist-qty-input').val();
                            var qtyVal = parseFloat(qtyValStr) || 0;

                            // 1. Mandatory validation: selected lines must have pickqty > 0
                            if (qtyVal <= 0) {
                                alert('Pick Quantity is mandatory for selected items.');
                                isValid = false;
                                return false; // break jQuery each loop
                            }

                            // 2. Stock validation
                            if (qtyVal > parseFloat(rowData.instock || 0)) {
                                alert("Chosen Qty Stock is higher than stock available");
                                isValid = false;
                                return false;
                            }

                            // 3. Required Qty validation
                            if (qtyVal > parseFloat(rowData.remainingqty || 0)) {
                                alert('Chosen quantity exceeds required quantity.\\n\\nRemaining Qty: ' + rowData.remainingqty + '\\nSelected Qty: ' + qtyVal);
                                isValid = false;
                                return false;
                            }

                            payload.push({
                                // Short keys (for Map/Reduce compatibility)
                                doc: rowData.doc,
                                tranid: rowData.tranid,
                                customer: rowData.customer,
                                item: rowData.item,
                                itemname: rowData.itemname,
                                units: rowData.units,
                                Units: rowData.units,
                                location: rowData.location,
                                date: rowData.date,
                                instock: rowData.instock,
                                Instock: rowData.instock,
                                docqty: rowData.docqty,
                                remainingqty: rowData.remainingqty,
                                pickqty: qtyVal,

                                // Sublist Field IDs (for Client Script/Suitelet compatibility)
                                custpage_select: true,
                                custpage_date: rowData.date,
                                custpage_doc: rowData.doc,
                                custpage_customer: rowData.customer,
                                custpage_item: rowData.item,
                                custpage_itemname: rowData.itemname,
                                custpage_units: rowData.units,
                                custpage_location: rowData.location,
                                custpage_instock: rowData.instock,
                                custpage_docqty: rowData.docqty,
                                custpage_remainingqty: rowData.remainingqty,
                                custpage_pickqty: qtyVal
                            });
                        }
                    });

                    if (!isValid) {
                        return false;
                    }

                    if (payload.length === 0) {
                        alert('Please select at least one item to create a pick list.');
                        return false;
                    }

                    return payload;
                }
                window.nsPicklistValidateAndBuildPayload = nsPicklistValidateAndBuildPayload;
            </script>`;

            return html;
        }

        return {
            onRequest
        };
    });