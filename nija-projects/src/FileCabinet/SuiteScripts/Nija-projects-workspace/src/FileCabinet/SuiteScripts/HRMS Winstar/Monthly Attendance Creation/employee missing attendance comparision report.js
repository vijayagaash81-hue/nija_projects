/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 * 
 * WinStar HR - Global Missing Attendance Report (Refined UI)
 * 
 * Features:
 * 1. Centered & Compact KPIs: Smaller boxes positioned in the center.
 * 2. Professional Buttons: Uniform blue color with clean hover effects.
 * 3. Excel Export: Includes Global Headcount and Missing Headcount in the file.
 * 4. Nija Exclusion: Strictly excludes any email containing "nija".
 */

define(["N/ui/serverWidget", "N/log", "N/query", "N/runtime", "N/url"],
    function (serverWidget, log, query, runtime, url) {

        var MONTH_MAP = {
            '1': 'January', '2': 'February', '3': 'March', '4': 'April',
            '5': 'May', '6': 'June', '7': 'July', '8': 'August',
            '9': 'September', '10': 'October', '11': 'November', '12': 'December'
        };
        
        var YEAR_MAP = {
            '1': '2019', '2': '2020', '3': '2021', '4': '2022',
            '5': '2023', '6': '2024', '7': '2025', '8': '2026', '9': '2027'
        };

        function onRequest(context) {
            var params = context.request.parameters;
            var monthId  = params.custpage_month || ''; 
            var yearId   = params.custpage_year  || ''; 
            var isExport = (params.custpage_export === 'T'); 

            var dateRange = calculateWagePeriod(monthId, yearId);

            // Handle Excel Export (CSV format optimized for Excel)
            if (isExport && monthId && yearId) {
                var expData = getMissingAttendanceData(dateRange);
                var csv = buildExcelCSV(expData, dateRange);
                context.response.setHeader({ name: 'Content-Type', value: 'text/csv' });
                context.response.setHeader({ name: 'Content-Disposition', value: 'attachment; filename="Attendance_Missing_Report.csv"' });
                context.response.write('\uFEFF' + csv);
                return;
            }

            var form = serverWidget.createForm({ title: 'Missing Employee Attendance Report' });
            
            // Standard NetSuite Blue Buttons
            form.addSubmitButton({ label: 'Check Missing Employees' });
            
            if (monthId && yearId) {
                var exportUrl = url.resolveScript({
                    scriptId: runtime.getCurrentScript().id,
                    deploymentId: runtime.getCurrentScript().deploymentId,
                    params: { custpage_month: monthId, custpage_year: yearId, custpage_export: 'T' }
                });
                form.addButton({
                    id: 'custpage_csv_btn',
                    label: 'Export as Excel',
                    functionName: "window.open('" + exportUrl + "', '_blank')"
                });
            }

            var fGrp = form.addFieldGroup({ id: 'custpage_filters', label: 'Report Filters' });
            
            var monF = form.addField({ id: 'custpage_month', type: serverWidget.FieldType.SELECT, label: 'Wage Month', source: 'customlist_hris_month_list', container: 'custpage_filters' });
            monF.isMandatory = true;
            if (monthId) monF.defaultValue = monthId;

            var yeaF = form.addField({ id: 'custpage_year', type: serverWidget.FieldType.SELECT, label: 'Year', source: 'customlist_hris_year_master', container: 'custpage_filters' });
            yeaF.isMandatory = true;
            if (yearId) yeaF.defaultValue = yearId;

            if (monthId && yearId) {
                var missingData = getMissingAttendanceData(dateRange);
                var htmlField = form.addField({ id: 'custpage_html', type: serverWidget.FieldType.INLINEHTML, label: ' ' });
                htmlField.defaultValue = buildMissingHtml(missingData, dateRange);
            } else {
                var info = form.addField({ id: 'custpage_info', type: serverWidget.FieldType.INLINEHTML, label: ' ' });
                info.defaultValue = getStyles() + '<div class="welcome-msg">Select Month and Year to view the missing report.</div>';
            }

            context.response.writePage(form);
        }

        /**
         * Fetch Logic: Filters out emails containing "nija"
         */
        function getMissingAttendanceData(dateRange) {
            function toSql(d) { return (d.getDate()<10?'0'+d.getDate():d.getDate())+'/'+((d.getMonth()+1)<10?'0'+(d.getMonth()+1):(d.getMonth()+1))+'/'+d.getFullYear(); }

            var empSql = "SELECT id, BUILTIN.DF(id) as emp_name, custentity_hris_empcode as emp_code, " +
                         "BUILTIN.DF(custentity_hris_empdesignation) as design, " +
                         "BUILTIN.DF(subsidiary) as sub_name " +
                         "FROM employee " +
                         "WHERE isinactive = 'F' " +
                         "AND LOWER(email) NOT LIKE '%nija%' " + 
                         "ORDER BY emp_name";
            var allEmployees = query.runSuiteQL({ query: empSql }).asMappedResults();

            var attSql = "SELECT DISTINCT A.custrecord_njt_emp_atten_employee as emp_id " +
                         "FROM CUSTOMRECORD_NJT_EMP_DAILY_ATTENDANCE AS A " +
                         "JOIN CUSTOMRECORD_NJT_EMP_DAILY_ATTEN_CH AS B ON B.custrecord_njt_emp_daily_parent = A.id " +
                         "WHERE B.custrecord_njt_emp_daily_date BETWEEN TO_DATE(?, 'DD/MM/YYYY') AND TO_DATE(?, 'DD/MM/YYYY')";
            var presentResults = query.runSuiteQL({ query: attSql, params: [toSql(dateRange.start), toSql(dateRange.end)] }).asMappedResults();
            
            var presentIds = {};
            presentResults.forEach(function(r) { presentIds[r.emp_id] = true; });

            var missingList = [];
            allEmployees.forEach(function(emp) {
                if (!presentIds[emp.id]) { missingList.push(emp); }
            });

            return { missingList: missingList, totalMaster: allEmployees.length };
        }

        /**
         * Build UI with Centered KPIs
         */
        function buildMissingHtml(data, dateRange) {
            var H = getStyles();

            H += '<div class="report-fullscreen-container">';

            // KPI Dashboard Row (Centered and Smaller)
            H += '<div class="kpi-centered-row">' +
                 makeKPI('Global Headcount', data.totalMaster, '#4f46e5') +
                 makeKPI('Missing Records', data.missingList.length, '#ef4444') +
                 '</div>';

            // Table Card
            H += '<div class="table-card-full">';
            
            H += '  <div class="table-header-row">';
            H += '    <div class="period-badge">PERIOD: ' + dateRange.start.toDateString() + ' - ' + dateRange.end.toDateString() + '</div>';
            H += '    <input type="text" id="attSearch" placeholder="Search by name, code or subsidiary..." onkeyup="doTableSearch()">';
            H += '  </div>';

            H += '  <div class="data-table-container">';
            H += '    <table class="report-table-ui" id="attendanceTable"><thead><tr>';
            H += '      <th style="width: 120px">Emp Code</th>';
            H += '      <th>Employee Name</th>';
            H += '      <th>Designation</th>';
            H += '      <th>Subsidiary</th>';
            H += '      <th style="width: 180px; text-align: center;">Status</th>';
            H += '    </tr></thead><tbody>';

            if (data.missingList.length === 0) {
                H += '<tr><td colspan="5" class="empty-notif">No missing records found.</td></tr>';
            } else {
                data.missingList.forEach(function(emp) {
                    H += '<tr>';
                    H += '  <td class="txt-bold">' + (emp.emp_code || '-') + '</td>';
                    H += '  <td class="txt-primary">' + emp.emp_name + '</td>';
                    H += '  <td>' + (emp.design || '-') + '</td>';
                    H += '  <td>' + (emp.sub_name || '-') + '</td>';
                    H += '  <td style="text-align:center"><span class="status-tag">MISSING ALL DATA</span></td>';
                    H += '</tr>';
                });
            }

            H += '</tbody></table></div></div></div>';

            H += '<script>' +
                 'function doTableSearch() {' +
                 '  var filter = document.getElementById("attSearch").value.toUpperCase();' +
                 '  var rows = document.getElementById("attendanceTable").getElementsByTagName("tr");' +
                 '  for (var i = 1; i < rows.length; i++) {' +
                 '    var text = rows[i].textContent.toUpperCase();' +
                 '    rows[i].style.display = (text.indexOf(filter) > -1) ? "" : "none";' +
                 '  }' +
                 '}' +
                 '</script>';
            return H;
        }

        function calculateWagePeriod(monthId, yearId) {
            var today = new Date();
            var actualYear = parseInt(YEAR_MAP[yearId] || today.getFullYear());
            var mIdx = parseInt(monthId) - 1;
            var start = new Date(actualYear, mIdx - 1, 21);
            var end   = new Date(actualYear, mIdx, 20);
            return { start: start, end: end };
        }

        function getStyles() {
            return '<style>' +
                '.uir-page-body { width: 100% !important; margin: 0 !important; }' +
                '.report-fullscreen-container { width: 97vw !important; margin: 0 auto; font-family: "Segoe UI", sans-serif; }' +
                
                /* Fixed Buttons Color & Hover */
                '#submitter, #custpage_csv_btn { background-color: #0070ba !important; color: white !important; font-weight: bold !important; border: 1px solid #005fa3 !important; padding: 10px 25px !important; border-radius: 4px !important; transition: background 0.2s; }' +
                '#submitter:hover, #custpage_csv_btn:hover { background-color: #005fa3 !important; cursor: pointer; }' +

                /* Centered KPIs */
                '.kpi-centered-row { display: flex; gap: 30px; width: 100%; justify-content: center; margin-bottom: 30px; }' +
                '.kpi-box-ui { background: #fff; width: 280px; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; border-top: 5px solid #4f46e5; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; }' +
                '.kpi-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }' +
                '.kpi-total { font-size: 32px; font-weight: 800; color: #1e293b; margin-top: 5px; }' +

                '.table-card-full { background: #fff; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 4px 10px rgba(0,0,0,0.05); width: 100%; overflow: hidden; }' +
                '.table-header-row { padding: 15px 25px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }' +
                '.period-badge { font-size: 13px; font-weight: 700; color: #475569; }' +
                '#attSearch { width: 450px; padding: 10px 15px; border-radius: 6px; border: 1px solid #cbd5e1; }' +

                '.data-table-container { width: 100%; overflow-x: auto; }' +
                '.report-table-ui { width: 100%; border-collapse: collapse; }' +
                '.report-table-ui thead th { background: #f8fafc; color: #475569; font-weight: 700; font-size: 12px; padding: 15px 25px; text-align: left; border-bottom: 2px solid #e2e8f0; }' +
                '.report-table-ui tbody td { padding: 15px 25px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; }' +

                '.txt-bold { font-family: monospace; font-weight: 600; color: #64748b; }' +
                '.txt-primary { font-weight: 700; color: #1e293b; }' +
                '.status-tag { background: #fee2e2; color: #991b1b; padding: 5px 12px; border-radius: 15px; font-size: 10px; font-weight: 800; border: 1px solid #fecaca; }' +
                '.welcome-msg { padding: 100px; text-align: center; color: #94a3b8; font-size: 18px; }' +
                '</style>';
        }

        function makeKPI(title, val, color) {
            return '<div class="kpi-box-ui" style="border-top-color: '+color+'"><div class="kpi-label">'+title+'</div><div class="kpi-total">'+val+'</div></div>';
        }

        /**
         * Enhanced CSV: Includes KPIs and Summary at the top
         */
        function buildExcelCSV(data, dr) {
            var c = 'MISSING ATTENDANCE SUMMARY REPORT\n';
            c += 'Report Period,' + dr.start.toDateString() + ' to ' + dr.end.toDateString() + '\n';
            c += 'Global Headcount (Excl. Nija),' + data.totalMaster + '\n';
            c += 'Total Employees Missing Records,' + data.missingList.length + '\n\n';
            
            c += 'Emp Code,Employee Name,Designation,Subsidiary,Status\n';
            data.missingList.forEach(function(e) {
                c += '"' + (e.emp_code || '-') + '","' + e.emp_name + '","' + (e.design || '-') + '","' + (e.sub_name || '-') + '","Missing All Attendance Records"\n';
            });
            return c;
        }

        return { onRequest: onRequest };
    }
);