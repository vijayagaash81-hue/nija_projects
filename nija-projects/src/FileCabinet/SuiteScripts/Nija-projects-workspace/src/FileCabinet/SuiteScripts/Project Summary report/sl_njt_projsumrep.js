/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 * 
 * Project Summary Report Suitelet
 * Custom branding: SJS ENERSOL | Theme: Executive Modern Slate & Accents
 * Features: Server-Side Rendering (SSR) fallback, Column Sorting, Live search, CSV Export, Performance Highlights
 */

define(["N/ui/serverWidget", "N/log", "N/query", "N/runtime", "N/url"],
    function (serverWidget, log, query, runtime, url) {

        function fetchReportData(subId, monthId, yearId, divisionId) {
            try {
                var YEAR_MAP = {
                    '1': '2019', '2': '2020', '3': '2021', '4': '2022', '5': '2023',
                    '6': '2024', '7': '2025', '8': '2026', '9': '2027', '10': '2028'
                };
                var actualYear = YEAR_MAP[yearId];
                if (!actualYear) {
                    var yearRes = query.runSuiteQL({
                        query: "SELECT name FROM customlist_hris_year_master WHERE id = ?",
                        params: [yearId]
                    }).asMappedResults();
                    if (yearRes.length > 0) {
                        actualYear = yearRes[0].name;
                    }
                }
                if (!actualYear) {
                    actualYear = new Date().getFullYear().toString();
                }

                var monthNum = parseInt(monthId);
                if (isNaN(monthNum)) return [];

                var startDate = '01/' + (monthNum < 10 ? '0' + monthNum : monthNum) + '/' + actualYear;
                var lastDay = new Date(parseInt(actualYear), monthNum, 0).getDate();
                var endDate = lastDay + '/' + (monthNum < 10 ? '0' + monthNum : monthNum) + '/' + actualYear;

                var sql = "SELECT " +
                    "  po.id, " +
                    "  BUILTIN.DF(po.custrecord_njt_project_2) AS code, " +
                    "  so.otherrefnum AS lpo, " +
                    "  BUILTIN.DF(so.entity) AS name, " +
                    "  NVL(so.total, 0) AS lpo_value, " +
                    "  NVL((SELECT SUM(ABS(NVL(inv_line.foreignamount, 0))) FROM transactionline inv_line JOIN transactionline inv_main ON inv_main.transaction = inv_line.transaction JOIN transaction inv ON inv.id = inv_line.transaction WHERE inv_main.mainline = 'T' AND inv_main.createdfrom = so.id AND inv.type = 'CustInvc' AND inv_line.mainline = 'F' AND inv_line.taxline = 'F'), 0) AS revenue, " +
                    "  NVL((SELECT SUM(NVL(det.custrecord_njt_production_details_amount, 0)) FROM customrecord_njt_prod_deta det WHERE det.custrecord_njt_pro_2 = po.id), 0) + NVL((SELECT SUM(NVL(exp.custrecordexp_amount, 0)) FROM customrecord_expense exp WHERE exp.custrecord_work_order_parent = po.id), 0) AS expenses, " +
                    "  (NVL((SELECT SUM(NVL(det.custrecord_njt_production_details_amount, 0)) FROM customrecord_njt_prod_deta det WHERE det.custrecord_njt_pro_2 = po.id), 0) + NVL((SELECT SUM(NVL(exp.custrecordexp_amount, 0)) FROM customrecord_expense exp WHERE exp.custrecord_work_order_parent = po.id), 0)) * 0.20 AS admin " +
                    "FROM customrecord_njt_product_order po " +
                    "JOIN transaction so ON so.id = po.custrecord_njt_sales_order_num " +
                    "WHERE po.custrecord_njt_subsidiar = ? " +
                    "  AND so.trandate BETWEEN TO_DATE(?, 'DD/MM/YYYY') AND TO_DATE(?, 'DD/MM/YYYY') ";

                var queryParams = [subId, startDate, endDate];
                if (divisionId) {
                    sql += "  AND po.custrecord_njt_pro_ord_devision = ? ";
                    queryParams.push(divisionId);
                }
                sql += "ORDER BY po.id";

                log.debug("fetchReportData SQL", sql);
                log.debug("fetchReportData Params", queryParams);

                var results = query.runSuiteQL({
                    query: sql,
                    params: queryParams
                }).asMappedResults();

                return results.map(function (row, idx) {
                    var expensesVal = parseFloat(row.expenses) || 0;
                    return {
                        id: row.id,
                        sno: idx + 1,
                        code: row.code || '',
                        lpo: row.lpo || '',
                        name: row.name || '',
                        lpoValue: parseFloat(row.lpo_value) || 0,
                        revenue: parseFloat(row.revenue) || 0,
                        expenses: expensesVal,
                        admin: expensesVal * 0.20
                    };
                });
            } catch (e) {
                log.error("fetchReportData Error", e);
                return [];
            }
        }

        function fetchProjectAnalysisDetails(projectId) {
            try {
                var metaSql = "SELECT " +
                    "  po.id, " +
                    "  BUILTIN.DF(po.custrecord_njt_project_2) AS code, " +
                    "  so.otherrefnum AS lpo, " +
                    "  BUILTIN.DF(so.entity) AS name, " +
                    "  NVL(so.total, 0) AS lpo_value, " +
                    "  TO_CHAR(so.trandate, 'DD/MM/YYYY') AS lpo_date, " +
                    "  NVL((SELECT SUM(ABS(NVL(inv_line.foreignamount, 0))) FROM transactionline inv_line JOIN transactionline inv_main ON inv_main.transaction = inv_line.transaction JOIN transaction inv ON inv.id = inv_line.transaction WHERE inv_main.mainline = 'T' AND inv_main.createdfrom = so.id AND inv.type = 'CustInvc' AND inv_line.mainline = 'F' AND inv_line.taxline = 'F'), 0) AS revenue " +
                    "FROM customrecord_njt_product_order po " +
                    "JOIN transaction so ON so.id = po.custrecord_njt_sales_order_num " +
                    "WHERE po.id = ?";
                
                var metaRes = query.runSuiteQL({ query: metaSql, params: [projectId] }).asMappedResults();
                if (metaRes.length === 0) return { error: "Project not found" };
                var meta = metaRes[0];

                var prodSql = "SELECT " +
                    "  det.custrecordnjt_item_name_ AS item_name, " +
                    "  BUILTIN.DF(det.custrecord_njt_itm_code) AS item_code, " +
                    "  NVL(det.custrecord_njt_production_details_amount, 0) AS amount, " +
                    "  det.custrecord_project_cost_category AS category_id, " +
                    "  BUILTIN.DF(det.custrecord_project_cost_category) AS category_name, " +
                    "  det.custrecord_project_cost_type AS type_id, " +
                    "  BUILTIN.DF(det.custrecord_project_cost_type) AS type_name " +
                    "FROM customrecord_njt_prod_deta det " +
                    "WHERE det.custrecord_njt_pro_2 = ? " +
                    "ORDER BY category_name, type_name, item_name";
                
                var prodDetails = query.runSuiteQL({ query: prodSql, params: [projectId] }).asMappedResults();

                var expSql = "SELECT " +
                    "  exp.id, " +
                    "  NVL(exp.custrecord_exp_remarks, 'Unspecified Expense') AS remarks, " +
                    "  NVL(exp.custrecordexp_amount, 0) AS amount " +
                    "FROM customrecord_expense exp " +
                    "WHERE exp.custrecord_work_order_parent = ? " +
                    "ORDER BY remarks";
                
                var expDetails = query.runSuiteQL({ query: expSql, params: [projectId] }).asMappedResults();

                return {
                    meta: {
                        id: meta.id,
                        code: meta.code || '',
                        lpo: meta.lpo || '',
                        name: meta.name || '',
                        lpoValue: parseFloat(meta.lpo_value) || 0,
                        lpoDate: meta.lpo_date || '',
                        revenue: parseFloat(meta.revenue) || 0
                    },
                    prodDetails: prodDetails.map(function(r) {
                        return {
                            itemName: r.item_name || '',
                            itemCode: r.item_code || '',
                            amount: parseFloat(r.amount) || 0,
                            categoryId: r.category_id || '',
                            categoryName: r.category_name || '',
                            typeId: r.type_id || '',
                            typeName: r.type_name || ''
                        };
                    }),
                    expDetails: expDetails.map(function(r) {
                        return {
                            id: r.id,
                            remarks: r.remarks || '',
                            amount: parseFloat(r.amount) || 0
                        };
                    })
                };
            } catch(e) {
                log.error("fetchProjectAnalysisDetails error", e);
                return { error: e.message };
            }
        }

        // Server-side helper: Format currency
        function formatCurrency(val) {
            var sign = val < 0 ? '-' : '';
            var absVal = Math.abs(val);
            return sign + '$' + absVal.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
        }

        // Server-side helper: Format percentage
        function formatPercentage(val) {
            return (val * 100).toFixed(0) + '%';
        }

        function onRequest(context) {
            var params = context.request.parameters;
            var action = params.custpage_action || '';
            if (action === 'getDetails') {
                var projectId = params.custpage_project_id || '';
                var details = fetchProjectAnalysisDetails(projectId);
                context.response.setHeader({ name: 'Content-Type', value: 'application/json' });
                context.response.write(JSON.stringify(details));
                return;
            }
            var subId = params.custpage_subsidiary || '';
            var monthId = params.custpage_month || '';
            var yearId = params.custpage_year || '';
            var divisionId = params.custpage_division || '';
            var isExport = (params.custpage_export === 'T');

            var reportData = [];
            if (subId && monthId && yearId) {
                reportData = fetchReportData(subId, monthId, yearId, divisionId);
            }

            // --- EXPORT TO EXCEL/CSV LOGIC ---
            if (isExport && subId && monthId && yearId) {
                var csvContent = buildCSV(reportData);
                context.response.setHeader({ name: 'Content-Type', value: 'text/csv; charset=utf-8' });
                context.response.setHeader({ name: 'Content-Disposition', value: 'attachment; filename="Project_Summary_Report.csv"' });
                context.response.write('\uFEFF' + csvContent);
                return;
            }

            var form = serverWidget.createForm({ title: ' ' });

            var html = '';
            if (subId && monthId && yearId) {
                html = buildProjectSummaryHtml(reportData, subId, monthId, yearId, divisionId);
            } else {
                html = getStyles() + buildHeader(subId, monthId, yearId, divisionId) +
                    '<div class="welcome-msg">Select Subsidiary, Wage Month, and Year to load the Project Summary Report.</div>' +
                    getFilterSetupScript();
            }

            var htmlField = form.addField({ id: 'custpage_html', type: serverWidget.FieldType.INLINEHTML, label: ' ' });
            htmlField.defaultValue = html;

            context.response.writePage(form);
        }

        function getFilterSetupScript() {
            return '<script>' +
                'function reloadReport() {' +
                '  var subEl = document.getElementById("custpage_subsidiary");' +
                '  var yearEl = document.getElementById("custpage_year");' +
                '  var monthEl = document.getElementById("custpage_month");' +
                '  var divEl = document.getElementById("custpage_division");' +
                '  var sub = subEl ? subEl.value : "";' +
                '  var year = yearEl ? yearEl.value : "";' +
                '  var month = monthEl ? monthEl.value : "";' +
                '  var div = divEl ? divEl.value : "";' +
                '  var scriptId = "' + runtime.getCurrentScript().id + '";' +
                '  var deployId = "' + runtime.getCurrentScript().deploymentId + '";' +
                '  var url = "/app/site/hosting/scriptlet.nl?script=" + scriptId + "&deploy=" + deployId;' +
                '  if (sub) url += "&custpage_subsidiary=" + sub;' +
                '  if (year) url += "&custpage_year=" + year;' +
                '  if (month) url += "&custpage_month=" + month;' +
                '  if (div) url += "&custpage_division=" + div;' +
                '  window.location.href = url;' +
                '}' +
                'window.reloadReport = reloadReport;' +
                '</script>';
        }

        function buildProjectSummaryHtml(data, subId, monthId, yearId, divisionId) {
            var html = getStyles();
            html += buildHeader(subId, monthId, yearId, divisionId);

            // Server-side pre-calculation of totals and table rows (Server-Side Rendering fallback)
            var totals = { lpo: 0, rev: 0, exp: 0, gross: 0, admin: 0, net: 0 };
            var tableBodyHtml = '';

            data.forEach(function (row) {
                var grossProfit = row.revenue - row.expenses;
                var netProfit = grossProfit - row.admin;
                var margin = row.revenue > 0 ? (netProfit / row.revenue) : 0;

                totals.lpo += row.lpoValue;
                totals.rev += row.revenue;
                totals.exp += row.expenses;
                totals.gross += grossProfit;
                totals.admin += row.admin;
                totals.net += netProfit;

                var grossClass = grossProfit >= 0 ? "prof-pos" : "prof-neg";
                var netClass = netProfit >= 0 ? "prof-pos" : "prof-neg";
                var badgeClass = margin >= 0 ? "badge-pos" : "badge-neg";

                var rowClass = "";
                if (netProfit < 0) {
                    rowClass = "row-loss";
                } else if (margin >= 0.3) {
                    rowClass = "row-high-profit";
                }

                tableBodyHtml += '<tr class="' + rowClass + '">' +
                    '  <td class="sno-col cell-data">' + row.sno + '</td>' +
                    '  <td class="code-col cell-data">' + row.code + '</td>' +
                    '  <td class="cell-data" style="text-align:left;">' + row.lpo + '</td>' +
                    '  <td class="cell-data" style="text-align:left; font-weight:500;">' + row.name + '</td>' +
                    '  <td class="cell-data num">' + formatCurrency(row.lpoValue) + '</td>' +
                    '  <td class="cell-data num">' + formatCurrency(row.revenue) + '</td>' +
                    '  <td class="cell-data num">' + formatCurrency(row.expenses) + '</td>' +
                    '  <td class="cell-data num ' + grossClass + '">' + formatCurrency(grossProfit) + '</td>' +
                    '  <td class="cell-data num">' + formatCurrency(row.admin) + '</td>' +
                    '  <td class="cell-data num ' + netClass + '">' + formatCurrency(netProfit) + '</td>' +
                    '  <td class="cell-data" style="text-align:center;"><span class="badge ' + badgeClass + '">' + formatPercentage(margin) + '</span></td>' +
                    '  <td class="cell-data" style="text-align:center;"><button type="button" class="btn-action" onclick="openProjectAnalysis(' + row.id + '); return false;">Details</button></td>' +
                    '</tr>';
            });

            var overallMargin = totals.rev > 0 ? (totals.net / totals.rev) : 0;
            var totalRowHtml = '<tr class="total-row">' +
                '  <td class="sno-col cell-data" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1; white-space: nowrap;">TOTAL</td>' +
                '  <td class="code-col cell-data" style="background:#f8fafc; border-top: 2px solid #cbd5e1;"></td>' +
                '  <td class="cell-data" style="background:#f8fafc; border-top: 2px solid #cbd5e1;"></td>' +
                '  <td class="cell-data" style="background:#f8fafc; border-top: 2px solid #cbd5e1;"></td>' +
                '  <td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatCurrency(totals.lpo) + '</td>' +
                '  <td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatCurrency(totals.rev) + '</td>' +
                '  <td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatCurrency(totals.exp) + '</td>' +
                '  <td class="cell-data num ' + (totals.gross >= 0 ? "prof-pos" : "prof-neg") + '" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatCurrency(totals.gross) + '</td>' +
                '  <td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatCurrency(totals.admin) + '</td>' +
                '  <td class="cell-data num ' + (totals.net >= 0 ? "prof-pos" : "prof-neg") + '" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatCurrency(totals.net) + '</td>' +
                '  <td class="cell-data" style="text-align:center; background:#f8fafc; border-top: 2px solid #cbd5e1;"><span class="badge ' + (overallMargin >= 0 ? "badge-pos" : "badge-neg") + '" style="font-weight:700;">' + formatPercentage(overallMargin) + '</span></td>' +
                '  <td class="cell-data" style="background:#f8fafc; border-top: 2px solid #cbd5e1;"></td>' +
                '</tr>';

            // Metrics Cards populated with SSR totals
            html += '<div class="metrics-bar">' +
                makeMetricCard('Total LPO Value', formatCurrency(totals.lpo), 'lpo-val') +
                makeMetricCard('Total Revenue', formatCurrency(totals.rev), 'revenue-val') +
                makeMetricCard('Total Expenses', formatCurrency(totals.exp), 'expenses-val') +
                makeMetricCard('Gross Profit / (Loss)', formatCurrency(totals.gross), 'gross-profit-val') +
                makeMetricCard('Total Admin Expenses', formatCurrency(totals.admin), 'admin-val') +
                makeMetricCard('Net Profit / (Loss)', formatCurrency(totals.net), 'net-profit-val') +
                makeMetricCard('Net Margin', formatPercentage(overallMargin), 'margin-val') +
                '</div>';

            // Toolbar
            html += '<div class="toolbar">' +
                '  <div class="toolbar-left">' +
                '    <span class="period-badge">PROJECT REPORT</span>' +
                '    <div class="search-wrap"><input type="text" id="projSearch" placeholder="Search project, code or LPO..." oninput="filterProjectTable()" onkeyup="filterProjectTable()"></div>' +
                '  </div>' +
                '  <div class="toolbar-right"><button type="button" id="btnExport" class="btn-export" onclick="triggerExcelExport()">Export to CSV</button></div>' +
                '</div>';

            // Table
            html += '<div class="table-container"><div class="table-scroll"><table id="projTable"><thead>' +
                '<tr>' +
                '  <th id="th-sno" class="sno-col" style="top:0; z-index:110; width:4%; cursor:pointer;" onclick="sortTable(\'sno\')">S.NO</th>' +
                '  <th id="th-code" class="code-col" style="top:0; z-index:110; width:8%; cursor:pointer;" onclick="sortTable(\'code\')">PROJECT CODES</th>' +
                '  <th id="th-lpo" style="top:0; z-index:100; width:11%; text-align:left; cursor:pointer;" onclick="sortTable(\'lpo\')">LPO #</th>' +
                '  <th id="th-name" style="top:0; z-index:100; width:14%; text-align:left; cursor:pointer;" onclick="sortTable(\'name\')">PROJECT NAME</th>' +
                '  <th id="th-lpoValue" style="top:0; z-index:100; width:9%; text-align:right; cursor:pointer;" onclick="sortTable(\'lpoValue\')">LPO VALUE</th>' +
                '  <th id="th-revenue" style="top:0; z-index:100; width:9%; text-align:right; cursor:pointer;" onclick="sortTable(\'revenue\')">REVENUE</th>' +
                '  <th id="th-expenses" style="top:0; z-index:100; width:9%; text-align:right; cursor:pointer;" onclick="sortTable(\'expenses\')">EXPENSES</th>' +
                '  <th id="th-gross" style="top:0; z-index:100; width:9%; text-align:right; cursor:pointer;" onclick="sortTable(\'gross\')">PROFIT / (LOSS)</th>' +
                '  <th id="th-admin" style="top:0; z-index:100; width:9%; text-align:right; cursor:pointer;" onclick="sortTable(\'admin\')">Admin Expenses</th>' +
                '  <th id="th-net" style="top:0; z-index:100; width:9%; text-align:right; cursor:pointer;" onclick="sortTable(\'net\')">Profit / (Loss)</th>' +
                '  <th id="th-margin" style="top:0; z-index:100; width:7%; text-align:center; cursor:pointer;" onclick="sortTable(\'margin\')">% of Profit / (loss)</th>' +
                '  <th style="top:0; z-index:100; width:6%; text-align:center;">Action</th>' +
                '</tr>' +
                '</thead><tbody id="projBody">' +
                tableBodyHtml +
                totalRowHtml +
                '</tbody></table></div></div>';

            // Client-side execution script for data rendering, filtering, formatting, and metrics calculations
            html += '<script>' +
                'var projectData = ' + JSON.stringify(data) + ';' +
                'var currentSort = { col: null, desc: false };' +

                'function formatCurrency(val) {' +
                '  var sign = val < 0 ? "-" : "";' +
                '  var absVal = Math.abs(val);' +
                '  return sign + "$" + absVal.toFixed(2).replace(/\\d(?=(\\d{3})+\\.)/g, "$&,");' +
                '}' +

                'function formatPercentage(val) {' +
                '  return (val * 100).toFixed(0) + "%";' +
                '}' +

                'function setMetricText(selector, text) {' +
                '  var elem = document.querySelector(selector);' +
                '  if (elem) elem.textContent = text;' +
                '}' +

                'function renderProjectTable(rows) {' +
                '  var tbody = document.getElementById("projBody");' +
                '  if (!tbody) return;' +
                '  tbody.innerHTML = "";' +
                '  var totals = { lpo:0, rev:0, exp:0, gross:0, admin:0, net:0 };' +

                '  rows.forEach(function(row) {' +
                '    var grossProfit = row.revenue - row.expenses;' +
                '    var netProfit = grossProfit - row.admin;' +
                '    var margin = row.revenue > 0 ? (netProfit / row.revenue) : 0;' +

                '    totals.lpo += row.lpoValue;' +
                '    totals.rev += row.revenue;' +
                '    totals.exp += row.expenses;' +
                '    totals.gross += grossProfit;' +
                '    totals.admin += row.admin;' +
                '    totals.net += netProfit;' +

                '    var grossClass = grossProfit >= 0 ? "prof-pos" : "prof-neg";' +
                '    var netClass = netProfit >= 0 ? "prof-pos" : "prof-neg";' +
                '    var badgeClass = margin >= 0 ? "badge-pos" : "badge-neg";' +

                '    var rowClass = "";' +
                '    if (netProfit < 0) {' +
                '      rowClass = "row-loss";' +
                '    } else if (margin >= 0.3) {' +
                '      rowClass = "row-high-profit";' +
                '    }' +

                '    var tr = document.createElement("tr");' +
                '    if (rowClass) tr.className = rowClass;' +
                '    tr.innerHTML = ' +
                '      \'<td class="sno-col cell-data">\' + row.sno + \'</td>\' +' +
                '      \'<td class="code-col cell-data">\' + row.code + \'</td>\' +' +
                '      \'<td class="cell-data" style="text-align:left;">\' + row.lpo + \'</td>\' +' +
                '      \'<td class="cell-data" style="text-align:left; font-weight:500;">\' + row.name + \'</td>\' +' +
                '      \'<td class="cell-data num">\' + formatCurrency(row.lpoValue) + \'</td>\' +' +
                '      \'<td class="cell-data num">\' + formatCurrency(row.revenue) + \'</td>\' +' +
                '      \'<td class="cell-data num">\' + formatCurrency(row.expenses) + \'</td>\' +' +
                '      \'<td class="cell-data num \' + grossClass + \'">\' + formatCurrency(grossProfit) + \'</td>\' +' +
                '      \'<td class="cell-data num">\' + formatCurrency(row.admin) + \'</td>\' +' +
                '      \'<td class="cell-data num \' + netClass + \'">\' + formatCurrency(netProfit) + \'</td>\' +' +
                '      \'<td class="cell-data" style="text-align:center;"><span class="badge \' + badgeClass + \'">\' + formatPercentage(margin) + \'</span></td>\' +' +
                '      \'<td class="cell-data" style="text-align:center;"><button type="button" class="btn-action" onclick="openProjectAnalysis(\' + row.id + \'); return false;">Details</button></td>\';' +
                '    tbody.appendChild(tr);' +
                '  });' +

                '  /* Table Summary/Total Row at the bottom */' +
                '  var overallMargin = totals.rev > 0 ? (totals.net / totals.rev) : 0;' +
                '  var trTotal = document.createElement("tr");' +
                '  trTotal.className = "total-row";' +
                '  trTotal.innerHTML = ' +
                '    \'<td class="sno-col cell-data" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1; white-space: nowrap;">TOTAL</td>\' +' +
                '    \'<td class="code-col cell-data" style="background:#f8fafc; border-top: 2px solid #cbd5e1;"></td>\' +' +
                '    \'<td class="cell-data" style="background:#f8fafc; border-top: 2px solid #cbd5e1;"></td>\' +' +
                '    \'<td class="cell-data" style="background:#f8fafc; border-top: 2px solid #cbd5e1;"></td>\' +' +
                '    \'<td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">\' + formatCurrency(totals.lpo) + \'</td>\' +' +
                '    \'<td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">\' + formatCurrency(totals.rev) + \'</td>\' +' +
                '    \'<td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">\' + formatCurrency(totals.exp) + \'</td>\' +' +
                '    \'<td class="cell-data num \' + (totals.gross >= 0 ? "prof-pos" : "prof-neg") + \'" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">\' + formatCurrency(totals.gross) + \'</td>\' +' +
                '    \'<td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">\' + formatCurrency(totals.admin) + \'</td>\' +' +
                '    \'<td class="cell-data num \' + (totals.net >= 0 ? "prof-pos" : "prof-neg") + \'" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">\' + formatCurrency(totals.net) + \'</td>\' +' +
                '    \'<td class="cell-data" style="text-align:center; background:#f8fafc; border-top: 2px solid #cbd5e1;"><span class="badge \' + (overallMargin >= 0 ? "badge-pos" : "badge-neg") + \'" style="font-weight:700;">\' + formatPercentage(overallMargin) + \'</span></td>\' +' +
                '    \'<td class="cell-data" style="background:#f8fafc; border-top: 2px solid #cbd5e1;"></td>\';' +
                '  tbody.appendChild(trTotal);' +

                '  setMetricText(".metric-card .lpo-val", formatCurrency(totals.lpo));' +
                '  setMetricText(".metric-card .revenue-val", formatCurrency(totals.rev));' +
                '  setMetricText(".metric-card .expenses-val", formatCurrency(totals.exp));' +
                '  setMetricText(".metric-card .gross-profit-val", formatCurrency(totals.gross));' +
                '  setMetricText(".metric-card .admin-val", formatCurrency(totals.admin));' +
                '  setMetricText(".metric-card .net-profit-val", formatCurrency(totals.net));' +
                '  setMetricText(".metric-card .margin-val", formatPercentage(overallMargin));' +
                '}' +

                'function parseCurrency(str) {' +
                '  if (!str) return 0;' +
                '  var clean = str.replace(/[^0-9.-]/g, "");' +
                '  var num = parseFloat(clean);' +
                '  return isNaN(num) ? 0 : num;' +
                '}' +

                'function filterProjectTable() {' +
                '  try {' +
                '    var searchInput = document.getElementById("projSearch");' +
                '    if (!searchInput) return;' +
                '    var filter = searchInput.value.toUpperCase();' +
                '    console.log("[DEBUG] filterProjectTable started. Filter:", filter);' +
                '    var tbody = document.getElementById("projBody");' +
                '    if (!tbody) { console.warn("[DEBUG] tbody projBody not found"); return; }' +
                '    var trs = tbody.getElementsByTagName("tr");' +
                '    var totals = { lpo: 0, rev: 0, exp: 0, gross: 0, admin: 0, net: 0 };' +

                '    for (var i = 0; i < trs.length; i++) {' +
                '      var tr = trs[i];' +
                '      if (tr.className && tr.className.indexOf("total-row") !== -1) continue;' +
                '      var txt = tr.textContent || tr.innerText || "";' +
                '      if (txt.toUpperCase().indexOf(filter) > -1) {' +
                '        tr.style.display = "";' +
                '        totals.lpo += parseCurrency(tr.cells[4] ? (tr.cells[4].textContent || tr.cells[4].innerText || "") : "");' +
                '        totals.rev += parseCurrency(tr.cells[5] ? (tr.cells[5].textContent || tr.cells[5].innerText || "") : "");' +
                '        totals.exp += parseCurrency(tr.cells[6] ? (tr.cells[6].textContent || tr.cells[6].innerText || "") : "");' +
                '        totals.gross += parseCurrency(tr.cells[7] ? (tr.cells[7].textContent || tr.cells[7].innerText || "") : "");' +
                '        totals.admin += parseCurrency(tr.cells[8] ? (tr.cells[8].textContent || tr.cells[8].innerText || "") : "");' +
                '        totals.net += parseCurrency(tr.cells[9] ? (tr.cells[9].textContent || tr.cells[9].innerText || "") : "");' +
                '      } else {' +
                '        tr.style.display = "none";' +
                '      }' +
                '    }' +

                '    var overallMargin = totals.rev > 0 ? (totals.net / totals.rev) : 0;' +
                '    setMetricText(".metric-card .lpo-val", formatCurrency(totals.lpo));' +
                '    setMetricText(".metric-card .revenue-val", formatCurrency(totals.rev));' +
                '    setMetricText(".metric-card .expenses-val", formatCurrency(totals.exp));' +
                '    setMetricText(".metric-card .gross-profit-val", formatCurrency(totals.gross));' +
                '    setMetricText(".metric-card .admin-val", formatCurrency(totals.admin));' +
                '    setMetricText(".metric-card .net-profit-val", formatCurrency(totals.net));' +
                '    setMetricText(".metric-card .margin-val", formatPercentage(overallMargin));' +

                '    var totalRow = tbody.querySelector("tr.total-row");' +
                '    if (totalRow) {' +
                '      if (totalRow.cells[4]) totalRow.cells[4].textContent = formatCurrency(totals.lpo);' +
                '      if (totalRow.cells[5]) totalRow.cells[5].textContent = formatCurrency(totals.rev);' +
                '      if (totalRow.cells[6]) totalRow.cells[6].textContent = formatCurrency(totals.exp);' +
                '      if (totalRow.cells[7]) totalRow.cells[7].textContent = formatCurrency(totals.gross);' +
                '      if (totalRow.cells[8]) totalRow.cells[8].textContent = formatCurrency(totals.admin);' +
                '      if (totalRow.cells[9]) totalRow.cells[9].textContent = formatCurrency(totals.net);' +
                '      var badge = totalRow.cells[10] ? totalRow.cells[10].querySelector(".badge") : null;' +
                '      if (badge) {' +
                '        badge.textContent = formatPercentage(overallMargin);' +
                '        badge.className = "badge " + (overallMargin >= 0 ? "badge-pos" : "badge-neg");' +
                '      }' +
                '    }' +
                '    console.log("[DEBUG] filterProjectTable completed. Totals calculated:", totals);' +
                '  } catch (err) {' +
                '    console.error("[DEBUG] Error in filterProjectTable:", err);' +
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
                '  sortRows(projectData, colName, currentSort.desc);' +
                '  filterProjectTable();' +
                '}' +

                'function sortRows(arr, col, desc) {' +
                '  arr.sort(function(a, b) {' +
                '    var valA = getSortValue(a, col);' +
                '    var valB = getSortValue(b, col);' +
                '    if (valA === valB) return 0;' +
                '    var cmp = valA > valB ? 1 : -1;' +
                '    return desc ? -cmp : cmp;' +
                '  });' +
                '  renderProjectTable(arr);' +
                '}' +

                'function getSortValue(row, col) {' +
                '  if (col === "gross") return row.revenue - row.expenses;' +
                '  if (col === "net") return (row.revenue - row.expenses) - row.admin;' +
                '  if (col === "margin") return row.revenue > 0 ? (((row.revenue - row.expenses) - row.admin) / row.revenue) : 0;' +
                '  return row[col];' +
                '}' +

                'function updateSortHeaders() {' +
                '  var headers = { sno: "S.NO", code: "PROJECT CODES", lpo: "LPO #", name: "PROJECT NAME", lpoValue: "LPO VALUE", revenue: "REVENUE", expenses: "EXPENSES", gross: "PROFIT / (LOSS)", admin: "Admin Expenses", net: "Profit / (Loss)", margin: "% of Profit / (loss)" };' +
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

                'function triggerExcelExport() {' +
                '  var scriptId = "' + runtime.getCurrentScript().id + '";' +
                '  var deployId = "' + runtime.getCurrentScript().deploymentId + '";' +
                '  var subEl = document.getElementById("custpage_subsidiary");' +
                '  var yearEl = document.getElementById("custpage_year");' +
                '  var monthEl = document.getElementById("custpage_month");' +
                '  var divEl = document.getElementById("custpage_division");' +
                '  var sub = subEl ? subEl.value : "";' +
                '  var month = monthEl ? monthEl.value : "";' +
                '  var year = yearEl ? yearEl.value : "";' +
                '  var div = divEl ? divEl.value : "";' +
                '  var exportUrl = "/app/site/hosting/scriptlet.nl?script=" + scriptId + "&deploy=" + deployId + "&custpage_subsidiary=" + sub + "&custpage_month=" + month + "&custpage_year=" + year + "&custpage_division=" + div + "&custpage_export=T";' +
                '  window.open(exportUrl, "_blank");' +
                '}' +
 
                'function reloadReport() {' +
                '  var subEl = document.getElementById("custpage_subsidiary");' +
                '  var yearEl = document.getElementById("custpage_year");' +
                '  var monthEl = document.getElementById("custpage_month");' +
                '  var divEl = document.getElementById("custpage_division");' +
                '  var sub = subEl ? subEl.value : "";' +
                '  var year = yearEl ? yearEl.value : "";' +
                '  var month = monthEl ? monthEl.value : "";' +
                '  var div = divEl ? divEl.value : "";' +
                '  var scriptId = "' + runtime.getCurrentScript().id + '";' +
                '  var deployId = "' + runtime.getCurrentScript().deploymentId + '";' +
                '  var url = "/app/site/hosting/scriptlet.nl?script=" + scriptId + "&deploy=" + deployId;' +
                '  if (sub) url += "&custpage_subsidiary=" + sub;' +
                '  if (year) url += "&custpage_year=" + year;' +
                '  if (month) url += "&custpage_month=" + month;' +
                '  if (div) url += "&custpage_division=" + div;' +
                '  window.location.href = url;' +
                '}' +

                'function showModal() {' +
                '  var modal = document.getElementById("analysisModal");' +
                '  if (modal) modal.classList.add("active");' +
                '}' +
                'function hideModal() {' +
                '  var modal = document.getElementById("analysisModal");' +
                '  if (modal) modal.classList.remove("active");' +
                '}' +
                'function closeModalOnOutsideClick(e) {' +
                '  if (e.target.id === "analysisModal") {' +
                '    hideModal();' +
                '  }' +
                '}' +
                'function showModalLoader() {' +
                '  var tbody = document.getElementById("modalTableBody");' +
                '  if (tbody) tbody.innerHTML = "<tr><td colspan=\'4\' style=\'text-align:center; padding: 40px; color: #64748b;\'>Loading analysis details...</td></tr>";' +
                '  showModal();' +
                '}' +
                'function openProjectAnalysis(projectId) {' +
                '  showModalLoader();' +
                '  var scriptId = "' + runtime.getCurrentScript().id + '";' +
                '  var deployId = "' + runtime.getCurrentScript().deploymentId + '";' +
                '  var url = "/app/site/hosting/scriptlet.nl?script=" + scriptId + "&deploy=" + deployId + "&custpage_action=getDetails&custpage_project_id=" + projectId;' +
                '  fetch(url)' +
                '    .then(function(res) { return res.json(); })' +
                '    .then(function(data) {' +
                '      if (data.error) {' +
                '        alert("Error loading project details: " + data.error);' +
                '        hideModal();' +
                '        return;' +
                '      }' +
                '      renderProjectAnalysis(data);' +
                '    })' +
                '    .catch(function(err) {' +
                '      console.error(err);' +
                '      alert("Error fetching analysis details.");' +
                '      hideModal();' +
                '    });' +
                '}' +
                'function renderProjectAnalysis(data) {' +
                '  var meta = data.meta;' +
                '  document.getElementById("modalProjName").textContent = meta.name;' +
                '  document.getElementById("modalProjCode").textContent = meta.code;' +
                '  document.getElementById("modalLpoDate").textContent = meta.lpoDate || "-";' +
                '  document.getElementById("modalLpoNo").textContent = meta.lpo || "-";' +
                '  document.getElementById("modalLpoValue").textContent = formatCurrency(meta.lpoValue);' +
                '  ' +
                '  var tbody = document.getElementById("modalTableBody");' +
                '  tbody.innerHTML = "";' +
                '  ' +
                '  var materialCost = {};' +
                '  var prodCost = {};' +
                '  var otherExpenses = {};' +
                '  ' +
                '  data.prodDetails.forEach(function(row) {' +
                '    var catName = (row.categoryName || "").toUpperCase();' +
                '    if (catName.indexOf("MATERIAL") !== -1) {' +
                '      var key = row.typeName || "Unspecified Material Type";' +
                '      materialCost[key] = (materialCost[key] || 0) + row.amount;' +
                '    } else {' +
                '      var key = row.itemName || "Unspecified Item";' +
                '      prodCost[key] = (prodCost[key] || 0) + row.amount;' +
                '    }' +
                '  });' +
                '  ' +
                '  data.expDetails.forEach(function(row) {' +
                '    var key = row.remarks || "Unspecified Expense";' +
                '    otherExpenses[key] = (otherExpenses[key] || 0) + row.amount;' +
                '  });' +
                '  ' +
                '  var sno = 1;' +
                '  var totalMaterial = 0;' +
                '  var totalProd = 0;' +
                '  var totalOther = 0;' +
                '  ' +
                '  var trRev = document.createElement("tr");' +
                '  trRev.style.fontWeight = "700";' +
                '  trRev.innerHTML = ' +
                '    "<td></td>" +' +
                '    "<td>Revenue</td>" +' +
                '    "<td class=\'num\'>" + formatCurrency(meta.lpoValue) + "</td>" +' +
                '    "<td class=\'num\'>" + formatCurrency(meta.revenue) + "</td>";' +
                '  tbody.appendChild(trRev);' +
                '  ' +
                '  var trSpacer = document.createElement("tr");' +
                '  trSpacer.innerHTML = "<td colspan=\'4\' style=\'height: 8px; border: none;\'></td>";' +
                '  tbody.appendChild(trSpacer);' +
                '  ' +
                '  var trExpHeader = document.createElement("tr");' +
                '  trExpHeader.innerHTML = "<td colspan=\'4\'><b>Expenses:</b></td>";' +
                '  tbody.appendChild(trExpHeader);' +
                '  ' +
                '  function appendHeaderRow(title) {' +
                '    var tr = document.createElement("tr");' +
                '    tr.className = "category-row";' +
                '    tr.innerHTML = "<td colspan=\'4\' style=\'padding-left: 16px;\'><b>" + title + "</b></td>";' +
                '    tbody.appendChild(tr);' +
                '  }' +
                '  ' +
                '  function appendDetailRow(desc, booked) {' +
                '    var tr = document.createElement("tr");' +
                '    tr.innerHTML = ' +
                '      "<td style=\'padding-left: 24px;\'>" + (sno++) + "</td>" +' +
                '      "<td>" + desc + "</td>" +' +
                '      "<td class=\'num\'></td>" +' +
                '      "<td class=\'num\'>" + formatCurrency(booked) + "</td>";' +
                '    tbody.appendChild(tr);' +
                '  }' +
                '  ' +
                '  function appendTotalRow(title, totalVal) {' +
                '    var pct = meta.revenue > 0 ? ((totalVal / meta.revenue) * 100).toFixed(0) + "%" : (meta.lpoValue > 0 ? ((totalVal / meta.lpoValue) * 100).toFixed(0) + "%" : "0%");' +
                '    var tr = document.createElement("tr");' +
                '    tr.className = "total-row";' +
                '    tr.innerHTML = ' +
                '      "<td></td>" +' +
                '      "<td style=\'padding-left: 16px;\'><b>" + title + "</b></td>" +' +
                '      "<td class=\'num\'></td>" +' +
                '      "<td class=\'num\'><b>" + formatCurrency(totalVal) + " (" + pct + ")</b></td>";' +
                '    tbody.appendChild(tr);' +
                '  }' +
                '  ' +
                '  appendHeaderRow("MATERIAL COST:");' +
                '  var matKeys = Object.keys(materialCost);' +
                '  matKeys.forEach(function(key) {' +
                '    var amt = materialCost[key];' +
                '    appendDetailRow(key, amt);' +
                '    totalMaterial += amt;' +
                '  });' +
                '  appendTotalRow("TOTAL OF MATERIAL COST", totalMaterial);' +
                '  ' +
                '  appendHeaderRow("OTHER PRODUCTION COST:");' +
                '  var prodKeys = Object.keys(prodCost);' +
                '  prodKeys.forEach(function(key) {' +
                '    var amt = prodCost[key];' +
                '    appendDetailRow(key, amt);' +
                '    totalProd += amt;' +
                '  });' +
                '  appendTotalRow("TOTAL OF OTHER PROD COST", totalProd);' +
                '  ' +
                '  appendHeaderRow("OTHER EXPENSES:");' +
                '  var expKeys = Object.keys(otherExpenses);' +
                '  expKeys.forEach(function(key) {' +
                '    var amt = otherExpenses[key];' +
                '    appendDetailRow(key, amt);' +
                '    totalOther += amt;' +
                '  });' +
                '  appendTotalRow("TOTAL OF OTHER EXPENSES", totalOther);' +
                '  ' +
                '  var totalExpenses = totalMaterial + totalProd + totalOther;' +
                '  var netProfit = meta.revenue - totalExpenses;' +
                '  ' +
                '  var expPct = meta.revenue > 0 ? ((totalExpenses / meta.revenue) * 100).toFixed(0) + "%" : (meta.lpoValue > 0 ? ((totalExpenses / meta.lpoValue) * 100).toFixed(0) + "%" : "0%");' +
                '  var profitPct = meta.revenue > 0 ? ((netProfit / meta.revenue) * 100).toFixed(0) + "%" : (meta.lpoValue > 0 ? ((netProfit / meta.lpoValue) * 100).toFixed(0) + "%" : "0%");' +
                '  ' +
                '  var trTotalExp = document.createElement("tr");' +
                '  trTotalExp.className = "overall-total-row";' +
                '  trTotalExp.innerHTML = ' +
                '    "<td></td>" +' +
                '    "<td><b>TOTAL EXPENSES</b></td>" +' +
                '    "<td class=\'num\'></td>" +' +
                '    "<td class=\'num\'><b>" + formatCurrency(totalExpenses) + " (" + expPct + ")</b></td>";' +
                '  tbody.appendChild(trTotalExp);' +
                '  ' +
                '  var trNetProfit = document.createElement("tr");' +
                '  trNetProfit.className = "overall-total-row";' +
                '  trNetProfit.style.background = netProfit >= 0 ? "#f0fdf4" : "#fef2f2";' +
                '  trNetProfit.innerHTML = ' +
                '    "<td></td>" +' +
                '    "<td><b>PROFIT / (LOSS)</b></td>" +' +
                '    "<td class=\'num\'></td>" +' +
                '    "<td class=\'num\' style=\'color:" + (netProfit >= 0 ? "#15803d" : "#b91c1c") + ";\'><b>" + formatCurrency(netProfit) + " (" + profitPct + ")</b></td>";' +
                '  tbody.appendChild(trNetProfit);' +
                '}' +

                'window.projectData = projectData;' +
                'window.currentSort = currentSort;' +
                'window.formatCurrency = formatCurrency;' +
                'window.formatPercentage = formatPercentage;' +
                'window.setMetricText = setMetricText;' +
                'window.renderProjectTable = renderProjectTable;' +
                'window.parseCurrency = parseCurrency;' +
                'window.filterProjectTable = filterProjectTable;' +
                'window.sortTable = sortTable;' +
                'window.sortRows = sortRows;' +
                'window.getSortValue = getSortValue;' +
                'window.updateSortHeaders = updateSortHeaders;' +
                'window.triggerExcelExport = triggerExcelExport;' +
                'window.reloadReport = reloadReport;' +
                '</script>';

            // Modal HTML structure
            html += '<div id="analysisModal" class="modal-overlay" onclick="closeModalOnOutsideClick(event)">' +
                '  <div class="modal-container">' +
                '    <div class="modal-header">' +
                '      <div class="modal-title">PROJECT ANALYSIS REPORT</div>' +
                '      <button type="button" class="modal-close" onclick="hideModal()">&times;</button>' +
                '    </div>' +
                '    <div class="modal-body">' +
                '      <div class="analysis-meta">' +
                '        <div class="analysis-meta-item"><div class="analysis-meta-label">PROJECT NAME</div><div id="modalProjName" class="analysis-meta-val">-</div></div>' +
                '        <div class="analysis-meta-item"><div class="analysis-meta-label">PROJECT CODE</div><div id="modalProjCode" class="analysis-meta-val">-</div></div>' +
                '        <div class="analysis-meta-item"><div class="analysis-meta-label">LPO DATE</div><div id="modalLpoDate" class="analysis-meta-val">-</div></div>' +
                '        <div class="analysis-meta-item"><div class="analysis-meta-label">LPO NO</div><div id="modalLpoNo" class="analysis-meta-val">-</div></div>' +
                '        <div class="analysis-meta-item"><div class="analysis-meta-label">LPO VALUE</div><div id="modalLpoValue" class="analysis-meta-val">-</div></div>' +
                '      </div>' +
                '      <table class="analysis-table">' +
                '        <thead>' +
                '          <tr>' +
                '            <th style="width: 8%;">S.NO</th>' +
                '            <th style="width: 42%;">DESCRIPTION OF EXPENSES</th>' +
                '            <th style="width: 25%; text-align:right;">Expected Revenue & EXPENSES</th>' +
                '            <th style="width: 25%; text-align:right;">REVENUE & EXPENSES BOOKED</th>' +
                '          </tr>' +
                '        </thead>' +
                '        <tbody id="modalTableBody">' +
                '          <!-- Dynamic Rows -->' +
                '        </tbody>' +
                '      </table>' +
                '    </div>' +
                '  </div>' +
                '</div>';

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
                '.header-right select {' +
                '  background: #f8fafc;' +
                '  border: 1px solid #cbd5e1;' +
                '  color: #1e293b;' +
                '  padding: 8px 14px;' +
                '  border-radius: 6px;' +
                '  font-size: 13px;' +
                '  font-weight: 600;' +
                '  font-family: inherit;' +
                '  margin-left: 8px;' +
                '  cursor: pointer;' +
                '  outline: none;' +
                '  transition: all 0.2s;' +
                '}' +
                '.header-right select:hover, .header-right select:focus {' +
                '  border-color: #0284c7;' +
                '  background: #ffffff;' +
                '  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);' +
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
                '  min-width: 160px;' +
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
                '.metric-card.lpo-val-card { border-left: 4px solid #2563eb; }' +
                '.metric-card.revenue-val-card { border-left: 4px solid #0284c7; }' +
                '.metric-card.expenses-val-card { border-left: 4px solid #7c3aed; }' +
                '.metric-card.gross-profit-val-card { border-left: 4px solid #10b981; }' +
                '.metric-card.admin-val-card { border-left: 4px solid #ea580c; }' +
                '.metric-card.net-profit-val-card { border-left: 4px solid #0891b2; }' +
                '.metric-card.margin-val-card { border-left: 4px solid #0d9488; }' +

                '.metric-val {' +
                '  font-size: 20px;' +
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
                '#projSearch {' +
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
                '#projSearch:focus {' +
                '  background-color: #ffffff;' +
                '  border-color: #3b82f6;' +
                '  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);' +
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
                '  font-weight: 600;' +
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
                '.sno-col { text-align: center; }' +
                '.code-col { text-align: center; font-weight: 500; }' +
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
                '' +
                '/* Modal Styles */' +
                '.modal-overlay {' +
                '  position: fixed;' +
                '  top: 0; left: 0; width: 100%; height: 100%;' +
                '  background: rgba(15, 23, 42, 0.6);' +
                '  backdrop-filter: blur(4px);' +
                '  display: flex;' +
                '  justify-content: center;' +
                '  align-items: center;' +
                '  z-index: 1000;' +
                '  opacity: 0;' +
                '  pointer-events: none;' +
                '  transition: opacity 0.3s ease;' +
                '}' +
                '.modal-overlay.active {' +
                '  opacity: 1;' +
                '  pointer-events: auto;' +
                '}' +
                '.modal-container {' +
                '  background: #ffffff;' +
                '  border-radius: 16px;' +
                '  width: 95%;' +
                '  max-width: 1100px;' +
                '  max-height: 90vh;' +
                '  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);' +
                '  display: flex;' +
                '  flex-direction: column;' +
                '  overflow: hidden;' +
                '  transform: translateY(20px);' +
                '  transition: transform 0.3s ease;' +
                '}' +
                '.modal-overlay.active .modal-container {' +
                '  transform: translateY(0);' +
                '}' +
                '.modal-header {' +
                '  padding: 20px 24px;' +
                '  background: #0f172a;' +
                '  color: #ffffff;' +
                '  display: flex;' +
                '  justify-content: space-between;' +
                '  align-items: center;' +
                '  border-bottom: 1px solid #1e293b;' +
                '}' +
                '.modal-title {' +
                '  font-size: 16px;' +
                '  font-weight: 700;' +
                '  letter-spacing: 0.5px;' +
                '}' +
                '.modal-close {' +
                '  background: none;' +
                '  border: none;' +
                '  color: #94a3b8;' +
                '  font-size: 24px;' +
                '  cursor: pointer;' +
                '  transition: color 0.2s;' +
                '}' +
                '.modal-close:hover {' +
                '  color: #ffffff;' +
                '}' +
                '.modal-body {' +
                '  padding: 24px;' +
                '  overflow-y: auto;' +
                '  flex: 1;' +
                '}' +
                '.analysis-meta {' +
                '  display: grid;' +
                '  grid-template-columns: repeat(2, 1fr);' +
                '  gap: 16px;' +
                '  margin-bottom: 24px;' +
                '  padding: 16px;' +
                '  background: #f8fafc;' +
                '  border-radius: 12px;' +
                '  border: 1px solid #e2e8f0;' +
                '}' +
                '.analysis-meta-item {' +
                '  font-size: 13px;' +
                '}' +
                '.analysis-meta-label {' +
                '  color: #64748b;' +
                '  font-weight: 600;' +
                '  margin-bottom: 4px;' +
                '}' +
                '.analysis-meta-val {' +
                '  color: #1e293b;' +
                '  font-weight: 700;' +
                '}' +
                '.analysis-table {' +
                '  width: 100%;' +
                '  border-collapse: collapse;' +
                '  margin-top: 16px;' +
                '}' +
                '.analysis-table th {' +
                '  background: #f1f5f9;' +
                '  color: #475569;' +
                '  font-size: 11px;' +
                '  font-weight: 700;' +
                '  text-transform: uppercase;' +
                '  padding: 10px 12px;' +
                '  border-bottom: 2px solid #cbd5e1;' +
                '  text-align: left;' +
                '}' +
                '.analysis-table td {' +
                '  padding: 10px 12px;' +
                '  border-bottom: 1px solid #f1f5f9;' +
                '  font-size: 13px;' +
                '  color: #334155;' +
                '}' +
                '.analysis-table tr.category-row td {' +
                '  font-weight: 700;' +
                '  background: #f8fafc;' +
                '  color: #0f172a;' +
                '  border-bottom: 1px solid #e2e8f0;' +
                '  padding-top: 14px;' +
                '  padding-bottom: 8px;' +
                '}' +
                '.analysis-table tr.total-row td {' +
                '  font-weight: 700;' +
                '  background: #f8fafc;' +
                '  border-top: 2px solid #cbd5e1;' +
                '  border-bottom: 2px solid #cbd5e1;' +
                '  color: #0f172a;' +
                '}' +
                '.analysis-table tr.overall-total-row td {' +
                '  font-weight: 800;' +
                '  background: #f1f5f9;' +
                '  border-top: 2px solid #94a3b8;' +
                '  border-bottom: 2px solid #94a3b8;' +
                '  color: #0f172a;' +
                '  font-size: 14px;' +
                '}' +
                '.analysis-table td.num {' +
                '  text-align: right;' +
                '  font-family: monospace;' +
                '}' +
                '.btn-action {' +
                '  background: #ffffff;' +
                '  border: 1px solid #0284c7;' +
                '  color: #0284c7;' +
                '  padding: 5px 12px;' +
                '  border-radius: 6px;' +
                '  font-size: 11px;' +
                '  font-weight: 600;' +
                '  cursor: pointer;' +
                '  transition: all 0.2s ease;' +
                '  font-family: inherit;' +
                '}' +
                '.btn-action:hover {' +
                '  background: #0284c7;' +
                '  color: #ffffff;' +
                '  box-shadow: 0 2px 4px rgba(2, 132, 199, 0.15);' +
                '}' +
                '</style>';
        }

        function buildHeader(subId, monthId, yearId, divisionId) {
            var title = 'Project Summary Report';
            if (divisionId) {
                try {
                    var divRes = query.runSuiteQL({
                        query: "SELECT DISTINCT BUILTIN.DF(po.custrecord_njt_pro_ord_devision) AS name FROM customrecord_njt_product_order po WHERE po.custrecord_njt_pro_ord_devision = ?",
                        params: [divisionId]
                    }).asMappedResults();
                    if (divRes.length > 0 && divRes[0].name) {
                        title += ' - ' + divRes[0].name;
                    }
                } catch (e) {
                    log.error("Error fetching division name", e);
                }
            }
            return '<div class="header">' +
                '  <div class="header-left"><div class="header-logo"><span>' + title + '</span></div></div>' +
                '  <div class="header-right">' +
                '    <select id="custpage_subsidiary" name="custpage_subsidiary" onchange="reloadReport()"><option value="">Select Subsidiary</option>' + getOptions('subsidiary', subId) + '</select>' +
                '    <select id="custpage_division" name="custpage_division" onchange="reloadReport()"><option value="">Select Division</option>' + getOptions('division', divisionId) + '</select>' +
                '    <select id="custpage_year" name="custpage_year" onchange="reloadReport()">' + getOptions('customlist_hris_year_master', yearId) + '</select>' +
                '    <select id="custpage_month" name="custpage_month" onchange="reloadReport()">' + getOptions('customlist_hris_month_list', monthId) + '</select>' +
                '  </div>' +
                '</div>';
        }

        function getOptions(type, selected) {
            try {
                var sql;
                if (type === 'subsidiary') {
                    sql = "SELECT id, name FROM subsidiary ORDER BY name";
                } else if (type === 'division') {
                    sql = "SELECT DISTINCT po.custrecord_njt_pro_ord_devision AS id, BUILTIN.DF(po.custrecord_njt_pro_ord_devision) AS name FROM customrecord_njt_product_order po WHERE po.custrecord_njt_pro_ord_devision IS NOT NULL ORDER BY name";
                } else {
                    sql = "SELECT id, name FROM " + type + " ORDER BY id";
                }
                var results = query.runSuiteQL({ query: sql }).asMappedResults();
                return results.map(function (r) { return '<option value="' + r.id + '" ' + (selected == r.id ? 'selected' : '') + '>' + r.name + '</option>'; }).join('');
            } catch (e) {
                log.error("getOptions error for " + type, e);
                return '<option value="">(Error Loading options)</option>';
            }
        }

        function makeMetricCard(label, val, cls) {
            return '<div class="metric-card ' + cls + '-card"><div class="metric-lbl">' + label + '</div><div class="metric-val ' + cls + '">' + val + '</div></div>';
        }

        function buildCSV(data) {
            var c = 'S.NO,PROJECT CODES,LPO #,PROJECT NAME,LPO VALUE,REVENUE,EXPENSES,PROFIT / (LOSS),Admin Expenses,Profit / (Loss),% of Profit / (loss)\n';
            data.forEach(function (row) {
                var grossProfit = row.revenue - row.expenses;
                var netProfit = grossProfit - row.admin;
                var margin = row.revenue > 0 ? (netProfit / row.revenue) : 0;
                var marginPct = (margin * 100).toFixed(0) + '%';

                c += '"' + row.sno + '","' + row.code + '","' + row.lpo + '","' + row.name + '","' + row.lpoValue + '","' + row.revenue + '","' + row.expenses + '","' + grossProfit + '","' + row.admin + '","' + netProfit + '","' + marginPct + '"\n';
            });
            return c;
        }

        return { onRequest: onRequest };
    }
);