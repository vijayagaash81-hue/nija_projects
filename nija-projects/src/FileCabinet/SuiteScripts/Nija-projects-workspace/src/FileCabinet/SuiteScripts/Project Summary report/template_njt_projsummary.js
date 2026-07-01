/**
* @NApiVersion 2.1
* @NScriptType Suitelet
* @NModuleScope Public
* 
* WinStar HR Attendance Portal
* Branding: WINSTAR HRMS | Theme: Navy Blue (#004b8d)
* Features: Fixed Excel Export, Designation below Name, TP/TA Summary
*/

define(["N/ui/serverWidget", "N/log", "N/query", "N/runtime", "N/url"],
    function (serverWidget, log, query, runtime, url) {

        var YEAR_MAP = { '1': '2019', '2': '2020', '3': '2021', '4': '2022', '5': '2023', '6': '2024', '7': '2025', '8': '2026', '9': '2027' };

        function onRequest(context) {
            var params = context.request.parameters;
            var subId = params.custpage_subsidiary || '';
            var monthId = params.custpage_month || '';
            var yearId = params.custpage_year || '';
            var isExport = (params.custpage_export === 'T');

            // Wage Cycle Calculation: 21st to 20th
            var dateRange = calculateWagePeriod(monthId, yearId);

            // --- EXPORT TO EXCEL LOGIC ---
            if (isExport && subId && monthId && yearId) {
                var expData = getAttendanceData(subId, dateRange);
                var csvContent = buildCSV(expData, dateRange);
                context.response.setHeader({ name: 'Content-Type', value: 'text/csv; charset=utf-8' });
                context.response.setHeader({ name: 'Content-Disposition', value: 'attachment; filename="WinStar_Attendance_Report.csv"' });
                // Write Byte Order Mark for Excel UTF-8 support
                context.response.write('\uFEFF' + csvContent);
                return;
            }

            var form = serverWidget.createForm({ title: ' ' });

            if (subId && monthId && yearId) {
                var attendanceData = getAttendanceData(subId, dateRange);
                var htmlField = form.addField({ id: 'custpage_html', type: serverWidget.FieldType.INLINEHTML, label: ' ' });
                htmlField.defaultValue = buildAttendanceHtml(attendanceData, dateRange, subId, monthId, yearId);
            } else {
                var info = form.addField({ id: 'custpage_info', type: serverWidget.FieldType.INLINEHTML, label: ' ' });
                info.defaultValue = getStyles() + buildHeader(subId, monthId, yearId) +
                    '<div class="welcome-msg">Select Subsidiary, Wage Month, and Year to load the Attendance Portal.</div>';
            }

            context.response.writePage(form);
        }

        function calculateWagePeriod(monthId, yearId) {
            if (!monthId || !yearId) return null;
            var actualYear = parseInt(YEAR_MAP[yearId]);
            var mIdx = parseInt(monthId) - 1;
            var start = new Date(actualYear, mIdx - 1, 21);
            var end = new Date(actualYear, mIdx, 20);
            var days = [];
            var temp = new Date(start);
            while (temp <= end) {
                days.push(new Date(temp));
                temp.setDate(temp.getDate() + 1);
            }
            return { start: start, end: end, days: days };
        }

        function getAttendanceData(subId, dateRange) {
            var typeMap = getAttendanceTypeMapping();
            function toSql(d) { return (d.getDate() < 10 ? '0' + d.getDate() : d.getDate()) + '/' + ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1)) + '/' + d.getFullYear(); }

            var sql = "SELECT BUILTIN.DF(A.custrecord_njt_emp_atten_employee) AS emp_name, C.custentity_hris_empcode AS emp_code, " +
                "TO_CHAR(B.custrecord_njt_emp_daily_date, 'DD/MM/YYYY') AS d_date, B.custrecord_njt_emp_daily_intatt AS type_id, " +
                "B.custrecord_njt_emp_daily_in_time AS in_time, B.custrecord_njt_emp_daily_out_time AS out_time, " +
                "BUILTIN.DF(C.custentity_hris_empdesignation) AS design " +
                "FROM CUSTOMRECORD_NJT_EMP_DAILY_ATTENDANCE AS A " +
                "JOIN CUSTOMRECORD_NJT_EMP_DAILY_ATTEN_CH AS B ON B.custrecord_njt_emp_daily_parent = A.id " +
                "JOIN employee AS C ON A.custrecord_njt_emp_atten_employee = C.id " +
                "WHERE C.subsidiary = ? AND B.custrecord_njt_emp_daily_date BETWEEN TO_DATE(?, 'DD/MM/YYYY') AND TO_DATE(?, 'DD/MM/YYYY') " +
                "ORDER BY emp_name";

            var results = query.runSuiteQL({ query: sql, params: [subId, toSql(dateRange.start), toSql(dateRange.end)] }).asMappedResults();
            var dataMap = {};
            var stats = { total: 0, p: 0, a: 0, l: 0 };

            results.forEach(function (row) {
                if (!dataMap[row.emp_name]) {
                    dataMap[row.emp_name] = { code: row.emp_code || '-', design: row.design || '-', att: {}, countP: 0, countA: 0, countL: 0 };
                }
                var finalTypeId = row.type_id;
                if (row.in_time && row.out_time && row.in_time === row.out_time) { finalTypeId = '24'; }
                dataMap[row.emp_name].att[row.d_date] = finalTypeId;
                var info = typeMap[finalTypeId];
                if (info) {
                    if (info.code === 'P') { stats.p++; dataMap[row.emp_name].countP++; }
                    else if (info.code === 'A' || info.code === 'UL') { stats.a++; dataMap[row.emp_name].countA++; }
                    else if (info.cls === 'c-l') { stats.l++; dataMap[row.emp_name].countL++; }
                }
            });
            stats.total = Object.keys(dataMap).length;
            return { dataMap: dataMap, stats: stats, typeMapping: typeMap };
        }

        function buildAttendanceHtml(data, dateRange, subId, monthId, yearId) {
            var html = getStyles();
            html += buildHeader(subId, monthId, yearId);

            // Metrics Cards
            html += '<div class="metrics-bar">' +
                makeMetricCard('Total Employees', data.stats.total, 'total', '👥') +
                makeMetricCard('Total Present', data.stats.p, 'present', '✓') +
                makeMetricCard('Absent / Unpaid', data.stats.a, 'absent', '✕') +
                makeMetricCard('Leave Days', data.stats.l, 'lop', '📋') +
                '</div>';

            // Toolbar
            var rangeStr = dateRange.start.toDateString().substring(4) + ' – ' + dateRange.end.toDateString().substring(4);
            html += '<div class="toolbar">' +
                '  <div class="toolbar-left">' +
                '    <span class="period-badge">' + rangeStr.toUpperCase() + '</span>' +
                '    <div class="search-wrap"><span class="search-icon">🔍</span><input type="text" id="attSearch" placeholder="Search name or code..." onkeyup="filterTable()"></div>' +
                '  </div>' +
                '  <div class="toolbar-right"><button type="button" class="btn-export" onclick="triggerExcelExport()">⇓ Export to Excel</button></div>' +
                '</div>';

            // Legend Row
            html += '<div class="legend"><span class="legend-label">Legend:</span>' + buildLegend() + '</div>';

            // Table
            html += '<div class="table-container"><div class="table-scroll"><table id="attTable"><thead>';
            html += '<tr><th class="sticky-col code-col" style="top:0; z-index:110;">CODE</th><th class="sticky-col name-col" style="top:0; z-index:110;">NAME / DESIGNATION</th>';
            dateRange.days.forEach(function (day) {
                var isWE = (day.getDay() === 5 || day.getDay() === 6);
                html += '<th class="day-th ' + (isWE ? 'we-head' : '') + '">' + day.getDate() + '</th>';
            });
            html += '<th class="summary-head">TP</th><th class="summary-head">TA</th></tr>';

            html += '<tr class="head-days"><th class="sticky-col code-col" style="top:38px; z-index:110;"></th><th class="sticky-col name-col" style="top:38px; z-index:110;"></th>';
            dateRange.days.forEach(function (day) {
                var isWE = (day.getDay() === 5 || day.getDay() === 6);
                html += '<th class="day-th ' + (isWE ? 'we-head' : '') + '"><span class="day-name">' + ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][day.getDay()] + '</span></th>';
            });
            html += '<th class="summary-head" style="top:38px;"></th><th class="summary-head" style="top:38px;"></th></tr></thead><tbody id="attBody">';

            for (var name in data.dataMap) {
                var emp = data.dataMap[name];
                html += '<tr>' +
                    '<td class="sticky-col code-col cell-data">' + emp.code + '</td>' +
                    '<td class="sticky-col name-col cell-data"><b>' + name + '</b><br><small class="desig-sub">' + emp.design + '</small></td>';
                dateRange.days.forEach(function (day) {
                    var ds = (day.getDate() < 10 ? '0' + day.getDate() : day.getDate()) + '/' + ((day.getMonth() + 1) < 10 ? '0' + (day.getMonth() + 1) : (day.getMonth() + 1)) + '/' + day.getFullYear();
                    var info = data.typeMapping[emp.att[ds]] || { code: '', cls: 'c-na' };
                    var isWE = (day.getDay() === 5 || day.getDay() === 6);
                    html += '<td class="day-cell ' + (isWE ? 'we-col' : '') + '">' +
                        (info.code ? '<span class="badge ' + info.cls + '">' + info.code + '</span>' : '<span class="badge c-na">-</span>') +
                        '</td>';
                });

                html += '<td class="summary-cell tp-txt">' + emp.countP + '</td>' +
                    '<td class="summary-cell ta-txt">' + emp.countA + '</td></tr>';
            }
            html += '</tbody></table></div></div>';

            // JavaScript for Search and Export
            html += '<script>' +
                'function triggerExcelExport() {' +
                '  var scriptId = "' + runtime.getCurrentScript().id + '";' +
                '  var deployId = "' + runtime.getCurrentScript().deploymentId + '";' +
                '  var sub = "' + subId + '"; var month = "' + monthId + '"; var year = "' + yearId + '";' +
                '  var exportUrl = "/app/site/hosting/scriptlet.nl?script=" + scriptId + "&deploy=" + deployId + "&custpage_subsidiary=" + sub + "&custpage_month=" + month + "&custpage_year=" + year + "&custpage_export=T";' +
                '  window.open(exportUrl, "_blank");' +
                '}' +
                'function filterTable() {' +
                '  var input = document.getElementById("attSearch"); var filter = input.value.toUpperCase();' +
                '  var tr = document.getElementById("attBody").getElementsByTagName("tr");' +
                '  for (var i = 0; i < tr.length; i++) {' +
                '    var txt = tr[i].innerText.toUpperCase(); tr[i].style.display = txt.indexOf(filter) > -1 ? "" : "none";' +
                '  }' +
                '}' +
                '</script>';

            return html;
        }

        function getStyles() {
            return '<style>' +
                'body { font-family: "Segoe UI", sans-serif; background: #f4f7f9; margin: 0; }' +
                '.header { background: #004b8d; color: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4db6ac; }' +
                '.header-logo { font-size: 16px; font-weight: 700; letter-spacing: 1px; }' +
                '.header-right select { background: #003a6d; border: 1px solid #0056a3; color: #fff; padding: 6px; border-radius: 4px; font-size: 12px; margin-left: 6px; cursor: pointer; }' +
                '.metrics-bar { display: flex; gap: 12px; padding: 15px 20px; background: #fff; border-bottom: 1px solid #e2e8f0; }' +
                '.metric-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; display: flex; align-items: center; gap: 12px; }' +
                '.metric-icon { width: 36px; height: 36px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 16px; }' +
                '.metric-icon.total { background: #e8eaf6; color: #3949ab; } .metric-icon.present { background: #e8f5e9; color: #10b981; }' +
                '.metric-icon.absent { background: #ffebee; color: #ef4444; } .metric-icon.lop { background: #fff3e0; color: #f97316; }' +
                '.metric-val { font-size: 22px; font-weight: 700; line-height: 1; } .metric-lbl { font-size: 11px; color: #718096; }' +
                '.toolbar { display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; background: #fff; border-bottom: 1px solid #e2e8f0; }' +
                '.period-badge { background: #e8eaf6; color: #3949ab; padding: 4px 10px; border-radius: 5px; font-size: 11px; font-weight: 700; }' +
                '.search-wrap { position: relative; } #attSearch { padding: 6px 10px 6px 30px; border: 1px solid #e2e8f0; border-radius: 6px; width: 220px; font-size: 12px; }' +
                '.search-icon { position: absolute; left: 10px; top: 8px; color: #a0aec0; }' +
                '.btn-export { padding: 7px 15px; border: 1px solid #3949ab; border-radius: 6px; background: #fff; color: #3949ab; font-size: 12px; font-weight: 600; cursor: pointer; transition: 0.2s; }' +
                '.btn-export:hover { background: #3949ab; color: #fff; }' +
                '.legend { display: flex; gap: 10px; padding: 10px 20px; background: #fff; border-bottom: 1px solid #e2e8f0; align-items: center; }' +
                '.leg-item { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; }' +
                '.table-container { margin: 15px 20px; background: #fff; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; }' +
                '.table-scroll { overflow: auto; max-height: 72vh; }' +
                'table { border-collapse: separate; border-spacing: 0; width: 100%; table-layout: fixed; }' +
                'thead th { background: #004b8d !important; color: #fff !important; font-size: 11px; padding: 10px 5px; border-right: 1px solid #003a6d; border-bottom: 1px solid #003a6d; position: sticky; top: 0; z-index: 50; }' +
                '.head-days th { top: 38px; font-weight: normal; }' +
                '.day-name { font-size: 9px; opacity: 0.8; }' +
                '.sticky-col { position: sticky; background: #fff; z-index: 40; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #f1f5f9; }' +
                'thead .sticky-col { background: #004b8d !important; color: #fff !important; z-index: 110; }' +
                '.code-col { left: 0; width: 70px; text-align: center; } .name-col { left: 70px; width: 230px; padding: 10px; line-height: 1.3; }' +
                '.cell-data { font-size: 11px; color: #1e293b; }' +
                '.desig-sub { color: #64748b; font-weight: normal; font-size: 10px; }' +
                '.day-th, .day-cell { width: 45px; text-align: center; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }' +
                '.summary-head { width: 50px; background: #003a6d !important; }' +
                '.summary-cell { width: 50px; text-align: center; font-weight: 700; border-bottom: 1px solid #f1f5f9; }' +
                '.tp-txt { color: #10b981; } .ta-txt { color: #ef4444; }' +
                '.badge { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 21px; border-radius: 4px; font-size: 10px; font-weight: 800; color: #fff; }' +
                '.c-p { background: #10b981; } .c-a { background: #ef4444; } .c-sm { background: #f97316; }' +
                '.c-wo { background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; }' +
                '.c-h { background: #facc15; color: #854d0e; } .c-l { background: #8b5cf6; }' +
                '.c-na { background: #ffffff; color: #cbd5e1; border: 1px dotted #cbd5e1; }' +
                '.we-col { background: #f9fafb; } .we-head { background: #003a6d !important; }' +
                '.welcome-msg { padding: 100px; text-align: center; color: #94a3b8; font-size: 14px; }' +
                '</style>';
        }

        function buildHeader(subId, monthId, yearId) {
            var scriptUrl = url.resolveScript({ scriptId: runtime.getCurrentScript().id, deploymentId: runtime.getCurrentScript().deploymentId });
            return '<div class="header">' +
                '  <div class="header-left"><div class="header-logo">■ <span>WINSTAR HRMS</span></div></div>' +
                '  <div class="header-right">' +
                '    <form method="GET" action="' + scriptUrl + '">' +
                '      <input type="hidden" name="script" value="' + runtime.getCurrentScript().id + '">' +
                '      <input type="hidden" name="deploy" value="' + runtime.getCurrentScript().deploymentId + '">' +
                '      <select name="custpage_subsidiary" onchange="this.form.submit()"><option value="">Select Subsidiary</option>' + getOptions('subsidiary', subId) + '</select>' +
                '      <select name="custpage_year" onchange="this.form.submit()">' + getOptions('customlist_hris_year_master', yearId) + '</select>' +
                '      <select name="custpage_month" onchange="this.form.submit()">' + getOptions('customlist_hris_month_list', monthId) + '</select>' +
                '    </form>' +
                '  </div>' +
                '</div>';
        }

        function getOptions(type, selected) {
            var sql = (type === 'subsidiary') ? "SELECT id, name FROM subsidiary ORDER BY name" : "SELECT id, name FROM " + type + " ORDER BY id";
            var results = query.runSuiteQL({ query: sql }).asMappedResults();
            return results.map(function (r) { return '<option value="' + r.id + '" ' + (selected == r.id ? 'selected' : '') + '>' + r.name + '</option>'; }).join('');
        }

        function makeMetricCard(label, val, cls, icon) {
            return '<div class="metric-card"><div class="metric-icon ' + cls + '">' + icon + '</div><div><div class="metric-val">' + val + '</div><div class="metric-lbl">' + label + '</div></div></div>';
        }

        function buildLegend() {
            return '<div class="leg-item"><span class="badge c-p">P</span> Present</div>' +
                '<div class="leg-item"><span class="badge c-a">A/UL</span> Absent</div>' +
                '<div class="leg-item"><span class="badge c-sm">SM</span> Swipe Missing</div>' +
                '<div class="leg-item"><span class="badge c-wo">WO</span> Week Off</div>' +
                '<div class="leg-item"><span class="badge c-h">H</span> Holiday</div>' +
                '<div class="leg-item"><span class="badge c-l">L</span> Leave</div>';
        }

        function getAttendanceTypeMapping() {
            var map = {};
            map['18'] = { code: 'P', cls: 'c-p' }; map['1'] = { code: 'A', cls: 'c-a' }; map['21'] = { code: 'WO', cls: 'c-wo' }; map['19'] = { code: 'H', cls: 'c-h' };
            map['5'] = { code: 'AL', cls: 'c-l' }; map['6'] = { code: 'AL', cls: 'c-l' }; map['14'] = { code: 'SL', cls: 'c-l' }; map['4'] = { code: 'EL', cls: 'c-l' };
            map['17'] = { code: 'UL', cls: 'c-a' }; map['24'] = { code: 'SM', cls: 'c-sm' }; map['23'] = { code: 'NA', cls: 'c-na' };
            return map;
        }

        function buildCSV(data, dr) {
            var c = 'Code,Employee Name,Designation';
            dr.days.forEach(function (d) { c += ',' + d.getDate() + '/' + (d.getMonth() + 1); });
            c += ',Total Present (TP),Total Absent (TA)\n';
            for (var n in data.dataMap) {
                var e = data.dataMap[n];
                c += '"' + e.code + '","' + n + '","' + e.design + '"';
                dr.days.forEach(function (day) {
                    var ds = (day.getDate() < 10 ? '0' + day.getDate() : day.getDate()) + '/' + ((day.getMonth() + 1) < 10 ? '0' + (day.getMonth() + 1) : (day.getMonth() + 1)) + '/' + day.getFullYear();
                    c += ',' + (e.att[ds] && getAttendanceTypeMapping()[e.att[ds]] ? getAttendanceTypeMapping()[e.att[ds]].code : '');
                });
                c += ',' + e.countP + ',' + e.countA + '\n';
            }
            return c;
        }

        return { onRequest: onRequest };
    }
);