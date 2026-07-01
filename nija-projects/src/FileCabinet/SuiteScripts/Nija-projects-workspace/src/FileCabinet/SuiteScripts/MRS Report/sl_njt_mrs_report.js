/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 * 
 * MRS Report Suitelet
 * Custom branding: SJS ENERSOL | Theme: Executive Modern Slate & Accents
 * Features: Multi-Month Range Filter, Live search, Column Sorting, CSV Export, Interactive Metrics
 */

define(["N/ui/serverWidget", "N/log", "N/query", "N/runtime", "N/url"],
    function (serverWidget, log, query, runtime, url) {

        function fetchReportData(subId, startDateVal, endDateVal) {
            try {
                var startParts = startDateVal.split('-');
                var endParts = endDateVal.split('-');
                if (startParts.length !== 3 || endParts.length !== 3) return [];

                var startDate = startParts[2] + '/' + startParts[1] + '/' + startParts[0];
                var endDate = endParts[2] + '/' + endParts[1] + '/' + endParts[0];

                var sql = "SELECT " +
                    "  po.id, " +
                    "  TO_CHAR(so.trandate, 'MM-DD-YYYY') AS tran_date, " +
                    "  po.name AS work_order, " +
                    "  so.otherrefnum AS lpo, " +
                    "  BUILTIN.DF(so.entity) AS customer_name, " +
                    "  NVL((SELECT SUM(ABS(NVL(sol.foreignamount, 0))) FROM transactionline sol WHERE sol.transaction = so.id AND sol.mainline = 'F' AND sol.taxline = 'F'), 0) AS exclusive_vat_amount, " +
                    "  NVL((SELECT SUM(NVL(det.custrecord_njt_production_details_amount, 0)) FROM customrecord_njt_prod_deta det LEFT JOIN customrecord_njt_overhead oh ON det.custrecord_njt_po_overhead = oh.id WHERE det.custrecord_njt_pro_2 = po.id AND (oh.custrecord_njt_oh_proctype IS NULL OR UPPER(BUILTIN.DF(oh.custrecord_njt_oh_proctype)) NOT LIKE '%GALVANIS%')), 0) + " +
                    "  NVL((SELECT SUM(NVL(exp.custrecordexp_amount, 0)) FROM customrecord_expense exp WHERE exp.custrecord_work_order_parent = po.id AND (exp.custrecord_exp_remarks IS NULL OR UPPER(exp.custrecord_exp_remarks) NOT LIKE '%GALVANIS%')), 0) AS cost, " +
                    "  NVL((SELECT SUM(NVL(det.custrecord_njt_production_details_amount, 0)) FROM customrecord_njt_prod_deta det JOIN customrecord_njt_overhead oh ON det.custrecord_njt_po_overhead = oh.id WHERE det.custrecord_njt_pro_2 = po.id AND UPPER(BUILTIN.DF(oh.custrecord_njt_oh_proctype)) LIKE '%GALVANIS%'), 0) + " +
                    "  NVL((SELECT SUM(NVL(exp.custrecordexp_amount, 0)) FROM customrecord_expense exp WHERE exp.custrecord_work_order_parent = po.id AND UPPER(exp.custrecord_exp_remarks) LIKE '%GALVANIS%'), 0) AS galvanizing, " +
                    "  NVL((SELECT SUM(ABS(NVL(sol.foreignamount, 0))) FROM transactionline sol WHERE sol.transaction = so.id AND sol.taxline = 'T'), 0) AS vat " +
                    "FROM customrecord_njt_product_order po " +
                    "JOIN transaction so ON so.id = po.custrecord_njt_sales_order_num " +
                    "WHERE po.custrecord_njt_subsidiar = ? " +
                    "  AND so.trandate BETWEEN TO_DATE(?, 'DD/MM/YYYY') AND TO_DATE(?, 'DD/MM/YYYY') " +
                    "  AND po.custrecord_njt_pro_ord_devision IN (1, 3) " +
                    "ORDER BY po.id";

                var queryParams = [subId, startDate, endDate];

                log.debug("fetchReportData SQL", sql);
                log.debug("fetchReportData Params", queryParams);

                var results = query.runSuiteQL({
                    query: sql,
                    params: queryParams
                }).asMappedResults();

                return results.map(function (row, idx) {
                    var exclVat = parseFloat(row.exclusive_vat_amount) || 0;
                    var costVal = parseFloat(row.cost) || 0;
                    var galvVal = parseFloat(row.galvanizing) || 0;

                    var vatVal = parseFloat(row.vat) || 0;

                    return {
                        id: row.id,
                        sno: idx + 1,
                        date: row.tran_date || '',
                        workOrder: row.work_order || '',
                        lpo: row.lpo || '',
                        customerName: row.customer_name || '',
                        exclusiveVatAmount: exclVat,
                        cost: costVal,
                        galvanizing: galvVal,
                        vat: vatVal
                    };
                });
            } catch (e) {
                log.error("fetchReportData Error", e);
                return [];
            }
        }

        // Server-side helper: Format currency without dollar sign, matching UAE standard report
        function formatNumber(val) {
            var sign = val < 0 ? '-' : '';
            var absVal = Math.abs(val);
            return sign + absVal.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
        }

        // Server-side helper: Format percentage
        function formatPercentage(val) {
            return (val * 100).toFixed(0) + '%';
        }

        function onRequest(context) {
            var params = context.request.parameters;
            var subId = params.custpage_subsidiary || '';
            var startDateVal = params.custpage_start_date || '';
            var endDateVal = params.custpage_end_date || '';
            var isExport = (params.custpage_export === 'T');

            var reportData = [];
            if (subId && startDateVal && endDateVal) {
                reportData = fetchReportData(subId, startDateVal, endDateVal);
            }

            // --- EXPORT TO CSV LOGIC ---
            if (isExport && subId && startDateVal && endDateVal) {
                var csvContent = buildCSV(reportData);
                context.response.setHeader({ name: 'Content-Type', value: 'text/csv; charset=utf-8' });
                context.response.setHeader({ name: 'Content-Disposition', value: 'attachment; filename="MRS_Report.csv"' });
                context.response.write('\uFEFF' + csvContent);
                return;
            }

            var form = serverWidget.createForm({ title: ' ' });

            var html = '';
            if (subId && startDateVal && endDateVal) {
                html = buildMRSReportHtml(reportData, subId, startDateVal, endDateVal);
            } else {
                html = getStyles() + buildHeader(subId, startDateVal, endDateVal) +
                    '<div class="welcome-msg">Select Subsidiary and date range to load the MRS Report.</div>';
            }
            html += getFilterSetupScript();

            var htmlField = form.addField({ id: 'custpage_html', type: serverWidget.FieldType.INLINEHTML, label: ' ' });
            htmlField.defaultValue = html;

            context.response.writePage(form);
        }

        function getFilterSetupScript() {
            return '<script>' +
                'function reloadReport() {' +
                '  var subEl = document.getElementById("custpage_subsidiary");' +
                '  var startDateEl = document.getElementById("custpage_start_date");' +
                '  var endDateEl = document.getElementById("custpage_end_date");' +
                '  var sub = subEl ? subEl.value : "";' +
                '  var startDate = startDateEl ? startDateEl.value : "";' +
                '  var endDate = endDateEl ? endDateEl.value : "";' +
                '  var scriptId = "' + runtime.getCurrentScript().id + '";' +
                '  var deployId = "' + runtime.getCurrentScript().deploymentId + '";' +
                '  var url = "/app/site/hosting/scriptlet.nl?script=" + scriptId + "&deploy=" + deployId;' +
                '  if (sub) url += "&custpage_subsidiary=" + sub;' +
                '  if (startDate) url += "&custpage_start_date=" + startDate;' +
                '  if (endDate) url += "&custpage_end_date=" + endDate;' +
                '  window.location.href = url;' +
                '}' +
                'window.reloadReport = reloadReport;' +
                '</script>';
        }

        function buildMRSReportHtml(data, subId, startDateVal, endDateVal) {
            var html = getStyles();
            html += buildHeader(subId, startDateVal, endDateVal);

            // Server-side pre-calculation of totals and table rows
            var totals = { exclVat: 0, cost: 0, galv: 0, vat: 0, inclVat: 0, profit: 0 };
            var tableBodyHtml = '';

            data.forEach(function (row) {
                var inclVat = row.exclusiveVatAmount + row.vat;
                var profit = row.exclusiveVatAmount - row.cost - row.galvanizing;
                var margin = row.exclusiveVatAmount > 0 ? (profit / row.exclusiveVatAmount) : 0;

                totals.exclVat += row.exclusiveVatAmount;
                totals.cost += row.cost;
                totals.galv += row.galvanizing;
                totals.vat += row.vat;
                totals.inclVat += inclVat;
                totals.profit += profit;

                var profitClass = profit >= 0 ? "prof-pos" : "prof-neg";
                var badgeClass = margin >= 0 ? "badge-pos" : "badge-neg";

                var rowClass = "";
                if (profit < 0) {
                    rowClass = "row-loss";
                } else if (margin >= 0.40) {
                    rowClass = "row-high-profit";
                }

                tableBodyHtml += '<tr class="' + rowClass + '">' +
                    '  <td class="cell-data">' + row.date + '</td>' +
                    '  <td class="cell-data" style="font-weight:700;">' + row.workOrder + '</td>' +
                    '  <td class="cell-data" style="text-align:left;">' + row.lpo + '</td>' +
                    '  <td class="cell-data" style="text-align:left; font-weight:600;">' + row.customerName + '</td>' +
                    '  <td class="cell-data num">' + formatNumber(row.exclusiveVatAmount) + '</td>' +
                    '  <td class="cell-data num">' + formatNumber(row.cost) + '</td>' +
                    '  <td class="cell-data num">' + formatNumber(row.galvanizing) + '</td>' +
                    '  <td class="cell-data num">' + formatNumber(row.vat) + '</td>' +
                    '  <td class="cell-data num">' + formatNumber(inclVat) + '</td>' +
                    '  <td class="cell-data num ' + profitClass + '">' + formatNumber(profit) + '</td>' +
                    '  <td class="cell-data" style="text-align:center;"><span class="badge ' + badgeClass + '">' + formatPercentage(margin) + '</span></td>' +
                    '</tr>';
            });

            var overallMargin = totals.exclVat > 0 ? (totals.profit / totals.exclVat) : 0;
            var totalRowHtml = '<tr class="total-row">' +
                '  <td class="cell-data" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1; white-space: nowrap;">TOTAL</td>' +
                '  <td class="cell-data" style="background:#f8fafc; border-top: 2px solid #cbd5e1;"></td>' +
                '  <td class="cell-data" style="background:#f8fafc; border-top: 2px solid #cbd5e1;"></td>' +
                '  <td class="cell-data" style="background:#f8fafc; border-top: 2px solid #cbd5e1;"></td>' +
                '  <td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatNumber(totals.exclVat) + '</td>' +
                '  <td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatNumber(totals.cost) + '</td>' +
                '  <td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatNumber(totals.galv) + '</td>' +
                '  <td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatNumber(totals.vat) + '</td>' +
                '  <td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatNumber(totals.inclVat) + '</td>' +
                '  <td class="cell-data num ' + (totals.profit >= 0 ? "prof-pos" : "prof-neg") + '" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatNumber(totals.profit) + '</td>' +
                '  <td class="cell-data" style="text-align:center; background:#f8fafc; border-top: 2px solid #cbd5e1;"><span class="badge ' + (overallMargin >= 0 ? "badge-pos" : "badge-neg") + '" style="font-weight:700;">' + formatPercentage(overallMargin) + '</span></td>' +
                '</tr>';

            // Metrics Cards populated with SSR totals
            html += '<div class="metrics-bar">' +
                makeMetricCard('Total Exclusive VAT', formatNumber(totals.exclVat), 'excl-vat') +
                makeMetricCard('Total Cost', formatNumber(totals.cost), 'cost-val') +
                makeMetricCard('Total Galvanizing', formatNumber(totals.galv), 'galv-val') +
                makeMetricCard('Total VAT', formatNumber(totals.vat), 'vat-val') +
                makeMetricCard('Total Inclusive VAT', formatNumber(totals.inclVat), 'incl-vat') +
                makeMetricCard('Total Profit / (Loss)', formatNumber(totals.profit), 'profit-val') +
                makeMetricCard('Overall Margin', formatPercentage(overallMargin), 'margin-val') +
                '</div>';

            // Toolbar
            html += '<div class="toolbar">' +
                '  <div class="toolbar-left">' +
                '    <span class="period-badge">MRS REPORT</span>' +
                '    <div class="search-wrap"><input type="text" id="mrsSearch" placeholder="Search work order, customer or LPO..." oninput="filterMRSTable()"></div>' +
                '  </div>' +
                '  <div class="toolbar-right"><button type="button" id="btnExport" class="btn-export" onclick="triggerCSVExport()">Export to CSV</button></div>' +
                '</div>';

            // Table
            html += '<div class="table-container"><div class="table-scroll"><table id="mrsTable"><thead>' +
                '<tr>' +
                '  <th id="th-date" style="top:0; z-index:110; width:8%; cursor:pointer;" onclick="sortTable(\'date\')">DATE</th>' +
                '  <th id="th-workOrder" style="top:0; z-index:110; width:10%; cursor:pointer;" onclick="sortTable(\'workOrder\')">WORK ORDER</th>' +
                '  <th id="th-lpo" style="top:0; z-index:100; width:10%; text-align:left; cursor:pointer;" onclick="sortTable(\'lpo\')">LPO #</th>' +
                '  <th id="th-customerName" style="top:0; z-index:100; width:18%; text-align:left; cursor:pointer;" onclick="sortTable(\'customerName\')">CUSTOMER NAME</th>' +
                '  <th id="th-exclusiveVatAmount" style="top:0; z-index:100; width:10%; text-align:right; cursor:pointer;" onclick="sortTable(\'exclusiveVatAmount\')">EXCLUSIVE VAT AMOUNT</th>' +
                '  <th id="th-cost" style="top:0; z-index:100; width:9%; text-align:right; cursor:pointer;" onclick="sortTable(\'cost\')">COST</th>' +
                '  <th id="th-galvanizing" style="top:0; z-index:100; width:9%; text-align:right; cursor:pointer;" onclick="sortTable(\'galvanizing\')">GALVANIZING</th>' +
                '  <th id="th-vat" style="top:0; z-index:100; width:8%; text-align:right; cursor:pointer;" onclick="sortTable(\'vat\')">VAT</th>' +
                '  <th id="th-inclusiveVat" style="top:0; z-index:100; width:10%; text-align:right; cursor:pointer;" onclick="sortTable(\'inclusiveVat\')">INCLUSIVE VAT AMOUNT</th>' +
                '  <th id="th-profit" style="top:0; z-index:100; width:10%; text-align:right; cursor:pointer;" onclick="sortTable(\'profit\')">PROFIT / (LOSS)</th>' +
                '  <th id="th-margin" style="top:0; z-index:100; width:8%; text-align:center; cursor:pointer;" onclick="sortTable(\'margin\')">PROFIT% / (LOSS%)</th>' +
                '</tr>' +
                '</thead><tbody id="mrsBody">' +
                tableBodyHtml +
                totalRowHtml +
                '</tbody></table></div></div>';

            // Client-side execution script for data rendering, filtering, formatting, and metrics calculations
            html += '<script>' +
                'var reportData = ' + JSON.stringify(data) + ';' +
                'var currentSort = { col: null, desc: false };' +

                'function formatNumber(val) {' +
                '  var sign = val < 0 ? "-" : "";' +
                '  var absVal = Math.abs(val);' +
                '  return sign + absVal.toFixed(2).replace(/\\d(?=(\\d{3})+\\.)/g, "$&,");' +
                '}' +

                'function formatPercentage(val) {' +
                '  return (val * 100).toFixed(0) + "%";' +
                '}' +

                'function setMetricText(selector, text) {' +
                '  var elem = document.querySelector(selector);' +
                '  if (elem) elem.textContent = text;' +
                '}' +

                'function renderMRSTable(rows) {' +
                '  var tbody = document.getElementById("mrsBody");' +
                '  if (!tbody) return;' +
                '  tbody.innerHTML = "";' +
                '  var totals = { exclVat:0, cost:0, galv:0, vat:0, inclVat:0, profit:0 };' +

                '  rows.forEach(function(row) {' +
                '    var inclVat = row.exclusiveVatAmount + row.vat;' +
                '    var profit = row.exclusiveVatAmount - row.cost - row.galvanizing;' +
                '    var margin = row.exclusiveVatAmount > 0 ? (profit / row.exclusiveVatAmount) : 0;' +

                '    totals.exclVat += row.exclusiveVatAmount;' +
                '    totals.cost += row.cost;' +
                '    totals.galv += row.galvanizing;' +
                '    totals.vat += row.vat;' +
                '    totals.inclVat += inclVat;' +
                '    totals.profit += profit;' +

                '    var profitClass = profit >= 0 ? "prof-pos" : "prof-neg";' +
                '    var badgeClass = margin >= 0 ? "badge-pos" : "badge-neg";' +

                '    var rowClass = "";' +
                '    if (profit < 0) {' +
                '      rowClass = "row-loss";' +
                '    } else if (margin >= 0.40) {' +
                '      rowClass = "row-high-profit";' +
                '    }' +

                '    var tr = document.createElement("tr");' +
                '    if (rowClass) tr.className = rowClass;' +
                '    tr.innerHTML = ' +
                '      \'<td class="cell-data">\' + row.date + \'</td>\' +' +
                '      \'<td class="cell-data" style="font-weight:700;">\' + row.workOrder + \'</td>\' +' +
                '      \'<td class="cell-data" style="text-align:left;">\' + row.lpo + \'</td>\' +' +
                '      \'<td class="cell-data" style="text-align:left; font-weight:600;">\' + row.customerName + \'</td>\' +' +
                '      \'<td class="cell-data num">\' + formatNumber(row.exclusiveVatAmount) + \'</td>\' +' +
                '      \'<td class="cell-data num">\' + formatNumber(row.cost) + \'</td>\' +' +
                '      \'<td class="cell-data num">\' + formatNumber(row.galvanizing) + \'</td>\' +' +
                '      \'<td class="cell-data num">\' + formatNumber(row.vat) + \'</td>\' +' +
                '      \'<td class="cell-data num">\' + formatNumber(inclVat) + \'</td>\' +' +
                '      \'<td class="cell-data num \' + profitClass + \'">\' + formatNumber(profit) + \'</td>\' +' +
                '      \'<td class="cell-data" style="text-align:center;"><span class="badge \' + badgeClass + \'">\' + formatPercentage(margin) + \'</span></td>\';' +
                '    tbody.appendChild(tr);' +
                '  });' +

                '  var overallMargin = totals.exclVat > 0 ? (totals.profit / totals.exclVat) : 0;' +
                '  var trTotal = document.createElement("tr");' +
                '  trTotal.className = "total-row";' +
                '  trTotal.innerHTML = ' +
                '    \'<td class="cell-data" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1; white-space: nowrap;">TOTAL</td>\' +' +
                '    \'<td class="cell-data" style="background:#f8fafc; border-top: 2px solid #cbd5e1;"></td>\' +' +
                '    \'<td class="cell-data" style="background:#f8fafc; border-top: 2px solid #cbd5e1;"></td>\' +' +
                '    \'<td class="cell-data" style="background:#f8fafc; border-top: 2px solid #cbd5e1;"></td>\' +' +
                '    \'<td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">\' + formatNumber(totals.exclVat) + \'</td>\' +' +
                '    \'<td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">\' + formatNumber(totals.cost) + \'</td>\' +' +
                '    \'<td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">\' + formatNumber(totals.galv) + \'</td>\' +' +
                '    \'<td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">\' + formatNumber(totals.vat) + \'</td>\' +' +
                '    \'<td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">\' + formatNumber(totals.inclVat) + \'</td>\' +' +
                '    \'<td class="cell-data num \' + (totals.profit >= 0 ? "prof-pos" : "prof-neg") + \'" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">\' + formatNumber(totals.profit) + \'</td>\' +' +
                '    \'<td class="cell-data" style="text-align:center; background:#f8fafc; border-top: 2px solid #cbd5e1;"><span class="badge \' + (overallMargin >= 0 ? "badge-pos" : "badge-neg") + \'" style="font-weight:700;">\' + formatPercentage(overallMargin) + \'</span></td>\';' +
                '  tbody.appendChild(trTotal);' +

                '  setMetricText(".metric-card .excl-vat", formatNumber(totals.exclVat));' +
                '  setMetricText(".metric-card .cost-val", formatNumber(totals.cost));' +
                '  setMetricText(".metric-card .galv-val", formatNumber(totals.galv));' +
                '  setMetricText(".metric-card .vat-val", formatNumber(totals.vat));' +
                '  setMetricText(".metric-card .incl-vat", formatNumber(totals.inclVat));' +
                '  setMetricText(".metric-card .profit-val", formatNumber(totals.profit));' +
                '  setMetricText(".metric-card .margin-val", formatPercentage(overallMargin));' +
                '}' +

                'function parseCurrency(str) {' +
                '  if (!str) return 0;' +
                '  var clean = str.replace(/[^0-9.-]/g, "");' +
                '  var num = parseFloat(clean);' +
                '  return isNaN(num) ? 0 : num;' +
                '}' +

                'function filterMRSTable() {' +
                '  try {' +
                '    var searchInput = document.getElementById("mrsSearch");' +
                '    if (!searchInput) return;' +
                '    var filter = searchInput.value.toUpperCase();' +
                '    var tbody = document.getElementById("mrsBody");' +
                '    if (!tbody) return;' +
                '    var trs = tbody.getElementsByTagName("tr");' +
                '    var totals = { exclVat: 0, cost: 0, galv: 0, vat: 0, inclVat: 0, profit: 0 };' +

                '    for (var i = 0; i < trs.length; i++) {' +
                '      var tr = trs[i];' +
                '      if (tr.className && tr.className.indexOf("total-row") !== -1) continue;' +
                '      var txt = tr.textContent || tr.innerText || "";' +
                '      if (txt.toUpperCase().indexOf(filter) > -1) {' +
                '        tr.style.display = "";' +
                '        totals.exclVat += parseCurrency(tr.cells[4] ? (tr.cells[4].textContent || tr.cells[4].innerText || "") : "");' +
                '        totals.cost += parseCurrency(tr.cells[5] ? (tr.cells[5].textContent || tr.cells[5].innerText || "") : "");' +
                '        totals.galv += parseCurrency(tr.cells[6] ? (tr.cells[6].textContent || tr.cells[6].innerText || "") : "");' +
                '        totals.vat += parseCurrency(tr.cells[7] ? (tr.cells[7].textContent || tr.cells[7].innerText || "") : "");' +
                '        totals.inclVat += parseCurrency(tr.cells[8] ? (tr.cells[8].textContent || tr.cells[8].innerText || "") : "");' +
                '        totals.profit += parseCurrency(tr.cells[9] ? (tr.cells[9].textContent || tr.cells[9].innerText || "") : "");' +
                '      } else {' +
                '        tr.style.display = "none";' +
                '      }' +
                '    }' +

                '    var overallMargin = totals.exclVat > 0 ? (totals.profit / totals.exclVat) : 0;' +
                '    setMetricText(".metric-card .excl-vat", formatNumber(totals.exclVat));' +
                '    setMetricText(".metric-card .cost-val", formatNumber(totals.cost));' +
                '    setMetricText(".metric-card .galv-val", formatNumber(totals.galv));' +
                '    setMetricText(".metric-card .vat-val", formatNumber(totals.vat));' +
                '    setMetricText(".metric-card .incl-vat", formatNumber(totals.inclVat));' +
                '    setMetricText(".metric-card .profit-val", formatNumber(totals.profit));' +
                '    setMetricText(".metric-card .margin-val", formatPercentage(overallMargin));' +

                '    var totalRow = tbody.querySelector("tr.total-row");' +
                '    if (totalRow) {' +
                '      if (totalRow.cells[4]) totalRow.cells[4].textContent = formatNumber(totals.exclVat);' +
                '      if (totalRow.cells[5]) totalRow.cells[5].textContent = formatNumber(totals.cost);' +
                '      if (totalRow.cells[6]) totalRow.cells[6].textContent = formatNumber(totals.galv);' +
                '      if (totalRow.cells[7]) totalRow.cells[7].textContent = formatNumber(totals.vat);' +
                '      if (totalRow.cells[8]) totalRow.cells[8].textContent = formatNumber(totals.inclVat);' +
                '      if (totalRow.cells[9]) totalRow.cells[9].textContent = formatNumber(totals.profit);' +
                '      var badge = totalRow.cells[10] ? totalRow.cells[10].querySelector(".badge") : null;' +
                '      if (badge) {' +
                '        badge.textContent = formatPercentage(overallMargin);' +
                '        badge.className = "badge " + (overallMargin >= 0 ? "badge-pos" : "badge-neg");' +
                '      }' +
                '    }' +
                '  } catch (err) {' +
                '    console.error("Error in filterMRSTable:", err);' +
                '  }' +
                '}' +

                'function sortTable(colName) {' +
                '  if (currentSort.col === colName) {' +
                '    currentSort.desc = !currentSort.desc;' +
                '  } else {' +
                '    currentSort.col = colName;' +
                '    currentSort.desc = false;' +
                '  }' +
                '  updateSortHeaders();' +
                '  sortRows(reportData, colName, currentSort.desc);' +
                '  filterMRSTable();' +
                '}' +

                'function sortRows(arr, col, desc) {' +
                '  arr.sort(function(a, b) {' +
                '    var valA = getSortValue(a, col);' +
                '    var valB = getSortValue(b, col);' +
                '    if (valA === valB) return 0;' +
                '    var cmp = valA > valB ? 1 : -1;' +
                '    return desc ? -cmp : cmp;' +
                '  });' +
                '  renderMRSTable(arr);' +
                '}' +

                'function getSortValue(row, col) {' +
                '  if (col === "inclusiveVat") return row.exclusiveVatAmount + row.vat;' +
                '  if (col === "profit") return row.exclusiveVatAmount - row.cost - row.galvanizing;' +
                '  if (col === "margin") return row.exclusiveVatAmount > 0 ? ((row.exclusiveVatAmount - row.cost - row.galvanizing) / row.exclusiveVatAmount) : 0;' +
                '  return row[col];' +
                '}' +

                'function updateSortHeaders() {' +
                '  var headers = { date: "DATE", workOrder: "WORK ORDER", lpo: "LPO #", customerName: "CUSTOMER NAME", exclusiveVatAmount: "EXCLUSIVE VAT AMOUNT", cost: "COST", galvanizing: "GALVANIZING", vat: "VAT", inclusiveVat: "INCLUSIVE VAT AMOUNT", profit: "PROFIT / (LOSS)", margin: "PROFIT% / (LOSS%)" };' +
                '  for (var key in headers) {' +
                '    var elem = document.getElementById("th-" + key);' +
                '    if (elem) {' +
                '      var text = headers[key];' +
                '      if (currentSort.col === key) {' +
                '        text += currentSort.desc ? " \\\\u25be" : " \\\\u25b4";' +
                '      }' +
                '      elem.textContent = text;' +
                '    }' +
                '  }' +
                '}' +

                'function triggerCSVExport() {' +
                '  var scriptId = "' + runtime.getCurrentScript().id + '";' +
                '  var deployId = "' + runtime.getCurrentScript().deploymentId + '";' +
                '  var sub = document.getElementById("custpage_subsidiary").value;' +
                '  var startDate = document.getElementById("custpage_start_date").value;' +
                '  var endDate = document.getElementById("custpage_end_date").value;' +
                '  var exportUrl = "/app/site/hosting/scriptlet.nl?script=" + scriptId + "&deploy=" + deployId + "&custpage_subsidiary=" + sub + "&custpage_start_date=" + startDate + "&custpage_end_date=" + endDate + "&custpage_export=T";' +
                '  window.open(exportUrl, "_blank");' +
                '}' +
                '</script>';

            return html;
        }

        function getStyles() {
            return '<style>' +
                '/* Google Font Inter */' +
                '@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");' +

                'body {' +
                '  font-family: "Inter", -apple-system, sans-serif;' +
                '  background: #f8fafc;' +
                '  color: #1e293b;' +
                '  margin: 0;' +
                '  padding: 0;' +
                '  -webkit-font-smoothing: antialiased;' +
                '}' +

                '/* Premium Modern Header */' +
                '.header {' +
                '  background: #ffffff;' +
                '  color: #1e293b;' +
                '  padding: 16px 28px;' +
                '  display: flex;' +
                '  justify-content: space-between;' +
                '  align-items: center;' +
                '  border-bottom: 3px solid #0284c7;' +
                '  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);' +
                '}' +
                '.header-logo {' +
                '  font-size: 18px;' +
                '  font-weight: 800;' +
                '  letter-spacing: 0.5px;' +
                '  display: flex;' +
                '  align-items: center;' +
                '  gap: 10px;' +
                '  color: #0f172a;' +
                '}' +
                '.header-logo span {' +
                '  color: #0284c7;' +
                '}' +
                '.header-right {' +
                '  display: flex;' +
                '  align-items: center;' +
                '  gap: 6px;' +
                '  flex-wrap: wrap;' +
                '}' +
                '.header-right select, .header-right input[type="date"] {' +
                '  background: #f8fafc;' +
                '  border: 1px solid #cbd5e1;' +
                '  color: #1e293b;' +
                '  padding: 8px 14px;' +
                '  border-radius: 6px;' +
                '  font-size: 13px;' +
                '  font-weight: 600;' +
                '  font-family: inherit;' +
                '  cursor: pointer;' +
                '  outline: none;' +
                '  transition: all 0.2s;' +
                '}' +
                '.header-right select:hover, .header-right select:focus,' +
                '.header-right input[type="date"]:hover, .header-right input[type="date"]:focus {' +
                '  border-color: #0284c7;' +
                '  background: #ffffff;' +
                '  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);' +
                '}' +
                '.filter-label {' +
                '  font-size: 11px;' +
                '  font-weight: 700;' +
                '  text-transform: uppercase;' +
                '  color: #64748b;' +
                '  margin-left: 10px;' +
                '  letter-spacing: 0.05em;' +
                '}' +

                '/* Executive Minimalist KPI Bar */' +
                '.metrics-bar {' +
                '  display: flex;' +
                '  gap: 16px;' +
                '  padding: 24px 28px;' +
                '  background: #ffffff;' +
                '  border-bottom: 1px solid #f1f5f9;' +
                '  overflow-x: auto;' +
                '}' +
                '.metric-card {' +
                '  flex: 1;' +
                '  min-width: 150px;' +
                '  background: #ffffff;' +
                '  border: 1px solid #e2e8f0;' +
                '  border-radius: 12px;' +
                '  padding: 16px 20px;' +
                '  display: flex;' +
                '  flex-direction: column;' +
                '  gap: 6px;' +
                '  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);' +
                '  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);' +
                '}' +
                '.metric-card:hover {' +
                '  transform: translateY(-2px);' +
                '  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);' +
                '  border-color: #cbd5e1;' +
                '}' +
                '.metric-card.excl-vat-card { border-left: 4px solid #2563eb; }' +
                '.metric-card.cost-val-card { border-left: 4px solid #7c3aed; }' +
                '.metric-card.galv-val-card { border-left: 4px solid #f59e0b; }' +
                '.metric-card.vat-val-card { border-left: 4px solid #ea580c; }' +
                '.metric-card.incl-vat-card { border-left: 4px solid #0891b2; }' +
                '.metric-card.profit-val-card { border-left: 4px solid #10b981; }' +
                '.metric-card.margin-val-card { border-left: 4px solid #0d9488; }' +

                '.metric-val {' +
                '  font-size: 18px;' +
                '  font-weight: 700;' +
                '  line-height: 1.2;' +
                '  color: #0f172a;' +
                '  letter-spacing: -0.02em;' +
                '}' +
                '.metric-lbl {' +
                '  font-size: 11px;' +
                '  font-weight: 600;' +
                '  color: #64748b;' +
                '  text-transform: uppercase;' +
                '  letter-spacing: 0.05em;' +
                '}' +

                '/* Modern Control Toolbar */' +
                '.toolbar {' +
                '  display: flex;' +
                '  justify-content: space-between;' +
                '  align-items: center;' +
                '  padding: 16px 28px;' +
                '  background: #ffffff;' +
                '  border-bottom: 1px solid #e2e8f0;' +
                '}' +
                '.period-badge {' +
                '  background: #f1f5f9;' +
                '  color: #475569;' +
                '  padding: 6px 12px;' +
                '  border-radius: 8px;' +
                '  font-size: 12px;' +
                '  font-weight: 700;' +
                '  letter-spacing: 0.05em;' +
                '}' +
                '.search-wrap {' +
                '  display: inline-block;' +
                '  margin-left: 16px;' +
                '}' +
                '#mrsSearch {' +
                '  padding: 8px 16px;' +
                '  border: 1px solid #cbd5e1;' +
                '  border-radius: 8px;' +
                '  width: 280px;' +
                '  font-size: 13px;' +
                '  font-family: inherit;' +
                '  outline: none;' +
                '  transition: all 0.2s;' +
                '  background-color: #f8fafc;' +
                '}' +
                '#mrsSearch:focus {' +
                '  background-color: #ffffff;' +
                '  border-color: #0284c7;' +
                '  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);' +
                '}' +
                '.btn-export {' +
                '  padding: 8px 16px;' +
                '  border: 1px solid #10b981;' +
                '  border-radius: 8px;' +
                '  background: #ffffff;' +
                '  color: #10b981;' +
                '  font-size: 13px;' +
                '  font-family: inherit;' +
                '  font-weight: 600;' +
                '  cursor: pointer;' +
                '  transition: all 0.2s;' +
                '}' +
                '.btn-export:hover {' +
                '  background: #10b981;' +
                '  color: #ffffff;' +
                '  box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.15);' +
                '}' +

                '/* Tabular Reporting Grid */' +
                '.table-container {' +
                '  margin: 24px 28px;' +
                '  background: #ffffff;' +
                '  border: 1px solid #e2e8f0;' +
                '  border-radius: 12px;' +
                '  overflow: hidden;' +
                '  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);' +
                '}' +
                '.table-scroll {' +
                '  overflow-y: auto;' +
                '  overflow-x: hidden;' +
                '  max-height: 60vh;' +
                '}' +
                '/* Premium Scrollbar */' +
                '.table-scroll::-webkit-scrollbar {' +
                '  width: 8px;' +
                '  height: 8px;' +
                '}' +
                '.table-scroll::-webkit-scrollbar-track {' +
                '  background: #f8fafc;' +
                '}' +
                '.table-scroll::-webkit-scrollbar-thumb {' +
                '  background: #cbd5e1;' +
                '  border-radius: 99px;' +
                '}' +
                '.table-scroll::-webkit-scrollbar-thumb:hover {' +
                '  background: #94a3b8;' +
                '}' +
                'table {' +
                '  border-collapse: separate;' +
                '  border-spacing: 0;' +
                '  width: 100%;' +
                '  table-layout: fixed;' +
                '}' +
                'thead th {' +
                '  background: #f8fafc !important;' +
                '  color: #475569 !important;' +
                '  font-size: 11px;' +
                '  font-weight: 700;' +
                '  text-transform: uppercase;' +
                '  letter-spacing: 0.05em;' +
                '  padding: 14px 16px;' +
                '  border-right: 1px solid #e2e8f0;' +
                '  border-bottom: 2px solid #e2e8f0;' +
                '  position: sticky;' +
                '  top: 0;' +
                '  z-index: 50;' +
                '  transition: background-color 0.2s;' +
                '}' +
                'thead th:hover {' +
                '  background-color: #f1f5f9 !important;' +
                '}' +
                '.cell-data {' +
                '  font-size: 13px;' +
                '  color: #334155;' +
                '  padding: 12px 10px;' +
                '  border-right: 1px solid #f1f5f9;' +
                '  border-bottom: 1px solid #f1f5f9;' +
                '  text-align: center;' +
                '  vertical-align: middle;' +
                '  word-wrap: break-word;' +
                '}' +
                'tbody tr:hover td {' +
                '  background-color: #f1f5f9 !important;' +
                '}' +
                'td.num, th.num { text-align: right; }' +
                '.num {' +
                '  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;' +
                '  font-size: 12px;' +
                '}' +
                '.prof-pos {' +
                '  color: #10b981;' +
                '  font-weight: 600;' +
                '}' +
                '.prof-neg {' +
                '  color: #ef4444;' +
                '  font-weight: 600;' +
                '}' +

                '/* Row Highlights for performance visual cues */' +
                'tr.row-loss td {' +
                '  background-color: #fef2f2;' +
                '}' +
                'tr.row-high-profit td {' +
                '  background-color: #f0fdf4;' +
                '}' +
                'tr.total-row td {' +
                '  border-bottom: 2px solid #cbd5e1;' +
                '}' +

                '/* Badges */' +
                '.badge {' +
                '  display: inline-flex;' +
                '  align-items: center;' +
                '  justify-content: center;' +
                '  padding: 4px 10px;' +
                '  border-radius: 9999px;' +
                '  font-size: 11px;' +
                '  font-weight: 600;' +
                '}' +
                '.badge-pos {' +
                '  background: #dcfce7;' +
                '  color: #15803d;' +
                '}' +
                '.badge-neg {' +
                '  background: #fee2e2;' +
                '  color: #b91c1c;' +
                '}' +
                '.welcome-msg {' +
                '  padding: 120px 20px;' +
                '  text-align: center;' +
                '  color: #94a3b8;' +
                '  font-size: 15px;' +
                '}' +
                '</style>';
        }

        function buildHeader(subId, startDateVal, endDateVal) {
            var title = 'MRS Report - Fastners and Pipe Fitting';
            return '<div class="header">' +
                '  <div class="header-left"><div class="header-logo"><span>' + title + '</span></div></div>' +
                '  <div class="header-right">' +
                '    <select id="custpage_subsidiary" name="custpage_subsidiary" onchange="reloadReport()"><option value="">Select Subsidiary</option>' + getOptions('subsidiary', subId) + '</select>' +
                '    <span class="filter-label">From:</span>' +
                '    <input type="date" id="custpage_start_date" name="custpage_start_date" value="' + startDateVal + '" onchange="reloadReport()">' +
                '    <span class="filter-label">To:</span>' +
                '    <input type="date" id="custpage_end_date" name="custpage_end_date" value="' + endDateVal + '" onchange="reloadReport()">' +
                '  </div>' +
                '</div>';
        }

        function getOptions(type, selected) {
            try {
                var sql;
                if (type === 'subsidiary') {
                    sql = "SELECT id, name FROM subsidiary ORDER BY name";
                } else {
                    sql = "SELECT id, name FROM " + type + " ORDER BY id";
                }
                var results = query.runSuiteQL({ query: sql }).asMappedResults();
                return results.map(function (r) { return '<option value="' + r.id + '" ' + (selected == r.id ? 'selected' : '') + '>' + r.name + '</option>'; }).join('');
            } catch (e) {
                log.error("getOptions error for " + type, e);
                return '<option value="">(Error)</option>';
            }
        }

        function makeMetricCard(label, val, cls) {
            return '<div class="metric-card ' + cls + '-card"><div class="metric-lbl">' + label + '</div><div class="metric-val ' + cls + '">' + val + '</div></div>';
        }

        function buildCSV(data) {
            var c = 'DATE,WORK ORDER,LPO #,CUSTOMER NAME,EXCLUSIVE VAT AMOUNT,COST,GALVANIZING,VAT,INCLUSIVE VAT AMOUNT,PROFIT / (LOSS),PROFIT% / (LOSS%)\n';
            data.forEach(function (row) {
                var inclVat = row.exclusiveVatAmount + row.vat;
                var profit = row.exclusiveVatAmount - row.cost - row.galvanizing;
                var margin = row.exclusiveVatAmount > 0 ? (profit / row.exclusiveVatAmount) : 0;
                var marginPct = (margin * 100).toFixed(0) + '%';

                c += '"' + row.date + '","' + row.workOrder + '","' + row.lpo.replace(/"/g, '""') + '","' + row.customerName.replace(/"/g, '""') + '","' + row.exclusiveVatAmount + '","' + row.cost + '","' + row.galvanizing + '","' + row.vat + '","' + inclVat + '","' + profit + '","' + marginPct + '"\n';
            });
            return c;
        }

        return { onRequest: onRequest };
    }
);
