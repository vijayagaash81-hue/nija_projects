/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 *
 * WinStar HR Attendance Portal
 * Theme: Navy Blue (#1e3a5f)
 * Features: 
 *  - Excel Export Grouped: Employee info only on the first row of each group.
 *  - Fixed Search Icon: No overlapping text.
 *  - Designation Color: Professional blue #0056a3.
 *  - Sub-row borders: Color-coded left accents.
 *  - Project Code: Displayed as "GN".
 *  - Sticky Columns: FIXED horizontal scrolling to hide dates behind Name/Dept.
 *  - Added RP: Regularize Present logic based on reg_in/reg_out fields.
 *  - Separated SM: Swipe Missing count in its own column.
 *  - UPDATED: Enhanced Excel spacing, alignment, and light borders between employees.
 *  - DYNAMIC: Wage period fetched from customrecord_hris_wage_period_details based on Pay Group.
 *  - FILTERED: Only active Pay Groups and Subsidiaries are shown in dropdowns.
 */

define(["N/ui/serverWidget", "N/log", "N/query", "N/runtime", "N/url", "N/file"],
function (serverWidget, log, query, runtime, url, file) {

    var YEAR_MAP = {
        '1':'2019','2':'2020','3':'2021','4':'2022','5':'2023',
        '6':'2024','7':'2025','8':'2026','9':'2027'
    };

    function onRequest(context) {
        var p       = context.request.parameters;
        var subId   = p.custpage_subsidiary || '';
        var monthId = p.custpage_month      || '';
        var yearId  = p.custpage_year       || '';
        var payGrp  = p.custpage_paygroup   || '';
        var isExp   = (p.custpage_export === 'T');

        var dr = calculateWagePeriod(monthId, yearId, payGrp);

        /* =========================================================
           EXCEL EXPORT LOGIC
        ========================================================= */
        if (isExp && subId && monthId && yearId && payGrp && dr) {
            var expData = getAttendanceData(subId, dr);
            var htmlTable = buildExcelHtml(expData, dr);
            
            var excelFile = file.create({
                name: 'WinStar_Attendance_Report.xls',
                fileType: file.Type.PLAINTEXT,
                contents: htmlTable
            });

            context.response.writeFile({ file: excelFile });
            return;
        }

        /* =========================================================
           PAGE RENDER LOGIC
        ========================================================= */
        var form = serverWidget.createForm({ title: ' ' });
        if (subId && monthId && yearId && payGrp && dr) {
            var ad = getAttendanceData(subId, dr);
            var f  = form.addField({ id:'custpage_html', type:serverWidget.FieldType.INLINEHTML, label:' ' });
            f.defaultValue = buildAttendanceHtml(ad, dr, subId, monthId, yearId, payGrp);
        } else {
            var fi = form.addField({ id:'custpage_info', type:serverWidget.FieldType.INLINEHTML, label:' ' });
            fi.defaultValue = getStyles() + buildHeader(subId, monthId, yearId, payGrp) +
                '<div class="welcome-msg">Select Subsidiary, Pay Group, Wage Month, and Year to load the Attendance Portal.</div>';
        }
        context.response.writePage(form);
    }

    function calculateWagePeriod(monthId, yearId, payGrp) {
        if (!monthId || !yearId || !payGrp) return null;

        var sql = "SELECT TO_CHAR(custrecord_hris_start_date, 'DD/MM/YYYY') as start_date, " +
                  "TO_CHAR(custrecord_hris_end_date, 'DD/MM/YYYY') as end_date " +
                  "FROM customrecord_hris_wage_period_details " +
                  "WHERE custrecord_hris_pay_group = ? AND custrecord_hris_month = ? AND custrecord_hris_year = ?";
        
        var res = query.runSuiteQL({ query: sql, params: [payGrp, monthId, yearId] }).asMappedResults();
        
        if (res.length > 0) {
            var sStr = res[0].start_date.split('/');
            var eStr = res[0].end_date.split('/');
            
            var start = new Date(parseInt(sStr[2]), parseInt(sStr[1]) - 1, parseInt(sStr[0]));
            var end   = new Date(parseInt(eStr[2]), parseInt(eStr[1]) - 1, parseInt(eStr[0]));
            
            var days  = [], t = new Date(start);
            while (t <= end) { 
                days.push(new Date(t)); 
                t.setDate(t.getDate() + 1); 
            }
            return { start: start, end: end, days: days };
        }
        return null;
    }

    function toMins(str) {
        if (!str || str === '-' || str === '00:00' || str === '0') return 0;
        if (str.indexOf(':') === -1) {
            var hrs = parseFloat(str);
            return isNaN(hrs) ? 0 : Math.round(hrs * 60);
        }
        var p = str.split(':');
        return parseInt(p[0] || 0) * 60 + parseInt(p[1] || 0);
    }

    function minsToHHMM(mins) {
        if (!mins || mins <= 0) return '00:00';
        var h = Math.floor(mins / 60);
        var m = mins % 60;
        return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
    }

    function getAttendanceData(subId, dr) {
        var typeMap = getTypeMapping();
        function fmt(d) { return (d.getDate()<10?'0'+d.getDate():d.getDate())+'/'+((d.getMonth()+1)<10?'0'+(d.getMonth()+1):(d.getMonth()+1))+'/'+d.getFullYear(); }

        var sql = "SELECT BUILTIN.DF(A.custrecord_njt_emp_atten_employee) AS emp_name, C.custentity_hris_empcode AS emp_code, " +
                  "TO_CHAR(B.custrecord_njt_emp_daily_date, 'DD/MM/YYYY') AS d_date, B.custrecord_njt_emp_daily_intatt AS type_id, " +
                  "B.custrecord_njt_emp_daily_in_time AS in_time, B.custrecord_njt_emp_daily_out_time AS out_time, " +
                  "B.custrecord_njt_emp_daily_reg_in AS reg_in, B.custrecord_njt_emp_daily_reg_out AS reg_out, " +
                  "B.custrecord_njt_emp_daily_regularizahrs AS reg_hrs, " +
                  "B.custrecord_njt_emp_daily_totalhours AS total_hours, B.custrecord_njt_ot_hours AS ot_hours, " +
                  "BUILTIN.DF(C.custentity_hris_empdesignation) AS design, BUILTIN.DF(C.custentity_hris_empdepartment_new) AS dept " +
                  "FROM CUSTOMRECORD_NJT_EMP_DAILY_ATTENDANCE AS A " +
                  "JOIN CUSTOMRECORD_NJT_EMP_DAILY_ATTEN_CH AS B ON B.custrecord_njt_emp_daily_parent = A.id " +
                  "JOIN employee AS C ON A.custrecord_njt_emp_atten_employee = C.id " +
                  "WHERE C.subsidiary = ? AND B.custrecord_njt_emp_daily_date BETWEEN TO_DATE(?, 'DD/MM/YYYY') AND TO_DATE(?, 'DD/MM/YYYY') " +
                  "ORDER BY emp_name";

        var results = query.runSuiteQL({ query: sql, params: [subId, fmt(dr.start), fmt(dr.end)] }).asMappedResults();
        var dataMap = {};
        var empOrder = [];
        var stats = { total: 0, p: 0, a: 0, l: 0, sm: 0 };

        results.forEach(function (row) {
            if (!dataMap[row.emp_name]) {
                dataMap[row.emp_name] = { 
                    code: row.emp_code || '-', design: row.design || '-', department: row.dept || '-',
                    att: {}, workHrs: {}, otHrs: {},
                    countP: 0, countA: 0, countL: 0, countHD: 0, countOff: 0, countSM: 0, totalWorkMins: 0, totalOTMins: 0
                };
                empOrder.push(row.emp_name);
            }
            var emp = dataMap[row.emp_name];
            var ds = row.d_date;
            var tid = row.type_id;

            if (row.reg_in && row.reg_out && row.reg_in !== '-' && row.reg_out !== '-') {
                tid = 'RP';
            } else if (row.in_time && row.out_time && row.in_time === row.out_time && row.in_time !== '-') { 
                tid = '24'; 
            }
            
            emp.att[ds] = tid;
            
            // LOGIC FOR RP WORK HOURS
            var currentWorkHrs = (tid === 'RP' && row.reg_hrs && row.reg_hrs !== '-') ? row.reg_hrs : (row.total_hours || '00:00');
            emp.workHrs[ds] = currentWorkHrs;
            emp.otHrs[ds] = row.ot_hours || '00:00';

            emp.totalWorkMins += toMins(currentWorkHrs);
            emp.totalOTMins += toMins(row.ot_hours);

            var info = typeMap[tid];
            if (info) {
                if (info.code === 'P' || info.code === 'RP') { stats.p++; emp.countP++; }
                else if (info.code === 'SM') { stats.sm++; emp.countSM++; }
                else if (info.code === 'A' || info.code === 'UL') { stats.a++; emp.countA++; }
                else if (info.code === 'HD') { emp.countHD++; }
                else if (info.code === 'WO' || info.code === 'H') { emp.countOff++; }
                else if (info.cls === 'c-l') { stats.l++; emp.countL++; }
            }
        });
        stats.total = empOrder.length;
        return { dataMap: dataMap, empOrder: empOrder, stats: stats, typeMapping: typeMap };
    }

    function buildAttendanceHtml(data, dr, subId, monthId, yearId, payGrp) {
        var html = getStyles() + buildHeader(subId, monthId, yearId, payGrp);

        var iconEmp = '<div class="c-ico c-ico-emp"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg></div>';
        var iconPrs = '<div class="c-ico c-ico-prs"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg></div>';
        var iconAbs = '<div class="c-ico c-ico-abs"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div>';
        var iconLve = '<div class="c-ico c-ico-lve"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg></div>';
        var iconSm  = '<div class="c-ico c-ico-abs" style="background:#fff7ed; color:#ea580c;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12" y2="16"></line></svg></div>';

        html += '<div class="kpi-bar">' +
            makeKpiCard('Total Employees', data.stats.total, iconEmp) +
            makeKpiCard('Total Present', data.stats.p, iconPrs) +
            makeKpiCard('Absent / Unpaid', data.stats.a, iconAbs) +
            makeKpiCard('Swipe Missing', data.stats.sm, iconSm) +
            makeKpiCard('Leave Days', data.stats.l, iconLve) +
            '</div>';

        var range = dr.start.toDateString().slice(4) + ' – ' + dr.end.toDateString().slice(4);
        html += '<div class="toolbar">' +
            '<div class="t-left"><span class="pill">' + range.toUpperCase() + '</span>' +
            '<div class="search-box"><span>🔍</span><input type="text" id="attSearch" placeholder="Search name or code..." onkeyup="filterTable()"></div></div>' +
            '<div class="t-right"><button class="btn-exp" onclick="triggerExcelExport()">⇓ Export to Excel</button></div>' +
            '</div>';

        html += '<div class="legend"><span class="leg-lbl">Legend:</span>' +
            '<span class="leg-i"><span class="badge c-p">P</span> Present</span>' +
            '<span class="leg-i"><span class="badge c-rp">RP</span> Regularize</span>' +
            '<span class="leg-i"><span class="badge c-a">A/UL</span> Absent</span>' +
            '<span class="leg-i"><span class="badge c-sm">SM</span> Swipe Missing</span>' +
            '<span class="leg-i"><span class="badge c-wo">WO</span> Week Off</span>' +
            '<span class="leg-i"><span class="badge c-h">H</span> Holiday</span>' +
            '<span class="leg-i"><span class="badge c-l">L</span> Leave</span></div>';

        html += '<div class="tbl-wrap"><div class="tbl-scroll"><table id="attTable"><thead>';
        
        html += '<tr>' +
            '<th class="fx fx-code" rowspan="2">CODE</th>' +
            '<th class="fx fx-name" rowspan="2">NAME / DESIGNATION</th>' +
            '<th class="fx fx-dept" rowspan="2">DEPARTMENT</th>' +
            '<th class="fx fx-rtype" rowspan="2"></th>';
        dr.days.forEach(function (day) {
            html += '<th class="dh ' + (day.getDay() === 5 || day.getDay() === 6 ? 'we-h' : '') + '">' + day.getDate() + '</th>';
        });
        html += '<th class="sh" rowspan="2">TOTAL<br>DAYS</th>' +
                '<th class="sh" rowspan="2">Present</th>' +
                '<th class="sh" rowspan="2">Absent</th>' +
                '<th class="sh" rowspan="2">SM</th>' +
                '<th class="sh" rowspan="2">HalfDay</th>' +
                '<th class="sh" rowspan="2">OFF</th>' +
                '<th class="sh" rowspan="2">WORK<br>HRS</th>' +
                '<th class="sh" rowspan="2">OT<br>HRS</th></tr>';

        html += '<tr>';
        dr.days.forEach(function (day) {
            var dow = ['SUN','MON','TUE','WED','THU','FRI','SAT'][day.getDay()];
            html += '<th class="dh ' + (day.getDay() === 5 || day.getDay() === 6 ? 'we-h' : '') + '"><small>' + dow + '</small></th>';
        });
        html += '</tr></thead><tbody id="attBody">';

        data.empOrder.forEach(function (name, idx) {
            var emp = data.dataMap[name];
            var rgc = (idx % 2 === 0) ? 'rg-e' : 'rg-o';
            var rowAttr = 'data-emp="' + name.toUpperCase() + ' ' + emp.code + '"';

            html += '<tr class="' + rgc + '" ' + rowAttr + '>' +
                '<td class="fx fx-code cd-cell ' + rgc + '" rowspan="4">' + emp.code + '</td>' +
                '<td class="fx fx-name cd-cell ' + rgc + '" rowspan="4"><b>' + name + '</b><br><small class="desig-txt">' + emp.design + '</small></td>' +
                '<td class="fx fx-dept cd-cell ' + rgc + '" rowspan="4">' + emp.department + '</td>' +
                '<td class="fx fx-rtype rl-st ' + rgc + '">Status</td>';
            dr.days.forEach(function (day) {
                var ds = (day.getDate()<10?'0'+day.getDate():day.getDate())+'/'+((day.getMonth()+1)<10?'0'+(day.getMonth()+1):(day.getMonth()+1))+'/'+day.getFullYear();
                var info = data.typeMapping[emp.att[ds]] || { code: '', cls: 'c-na' };
                html += '<td class="dc ' + (day.getDay() === 5 || day.getDay() === 6 ? 'we-c' : '') + '">' +
                    (info.code ? '<span class="badge ' + info.cls + '">' + info.code + '</span>' : '-') + '</td>';
            });
            html += '<td class="sc" rowspan="4">' + dr.days.length + '</td>' +
                    '<td class="sc sn-p" rowspan="4">' + emp.countP + '</td>' +
                    '<td class="sc sn-a" rowspan="4">' + emp.countA + '</td>' +
                    '<td class="sc sn-sm" rowspan="4" style="color:#ea580c;">' + emp.countSM + '</td>' +
                    '<td class="sc sn-hd" rowspan="4">' + emp.countHD + '</td>' +
                    '<td class="sc sn-of" rowspan="4">' + emp.countOff + '</td>' +
                    '<td class="sc wh-v-txt" rowspan="4">' + minsToHHMM(emp.totalWorkMins) + '</td>' +
                    '<td class="sc ot-v-txt" rowspan="4">' + minsToHHMM(emp.totalOTMins) + '</td></tr>';

            html += '<tr class="' + rgc + '" ' + rowAttr + '><td class="fx fx-rtype rl-wh ' + rgc + '">Work Hrs</td>';
            dr.days.forEach(function (day) {
                var ds = (day.getDate()<10?'0'+day.getDate():day.getDate())+'/'+((day.getMonth()+1)<10?'0'+(day.getMonth()+1):(day.getMonth()+1))+'/'+day.getFullYear();
                html += '<td class="dc val-c wh-v-txt">' + (emp.workHrs[ds] || '-') + '</td>';
            });
            html += '</tr>';

            html += '<tr class="' + rgc + '" ' + rowAttr + '><td class="fx fx-rtype rl-ot ' + rgc + '">OT Hrs</td>';
            dr.days.forEach(function (day) {
                var ds = (day.getDate()<10?'0'+day.getDate():day.getDate())+'/'+((day.getMonth()+1)<10?'0'+(day.getMonth()+1):(day.getMonth()+1))+'/'+day.getFullYear();
                html += '<td class="dc val-c ot-v-txt">' + (emp.otHrs[ds] || '-') + '</td>';
            });
            html += '</tr>';

            html += '<tr class="eg-bot ' + rgc + '" ' + rowAttr + '><td class="fx fx-rtype rl-pj ' + rgc + '">Project</td>';
            dr.days.forEach(function (day) {
                html += '<td class="dc val-c pj-txt">GN</td>';
            });
            html += '</tr>';
        });

        html += '</tbody></table></div></div>';

        html += '<script>' +
            'function triggerExcelExport() {' +
            '  var scriptId = "' + runtime.getCurrentScript().id + '";' +
            '  var deployId = "' + runtime.getCurrentScript().deploymentId + '";' +
            '  var sub = "' + subId + '"; var mo = "' + monthId + '"; var yr = "' + yearId + '"; var pg = "' + payGrp + '";' +
            '  var url = "/app/site/hosting/scriptlet.nl?script=" + scriptId + "&deploy=" + deployId + "&custpage_subsidiary=" + sub + "&custpage_month=" + mo + "&custpage_year=" + yr + "&custpage_paygroup=" + pg + "&custpage_export=T";' +
            '  window.open(url, "_blank");' +
            '}' +
            'function filterTable(){' +
            '  var f = document.getElementById("attSearch").value.toUpperCase();' +
            '  var trs = document.getElementById("attBody").getElementsByTagName("tr");' +
            '  for(var i=0; i<trs.length; i++){' +
                'var txt = trs[i].getAttribute("data-emp");' +
                'if(txt) { trs[i].style.display = (txt.indexOf(f) > -1) ? "" : "none"; }' +
            '  }' +
            '}' +
            '</script>';

        return html;
    }

    function buildExcelHtml(data, dr) {
        var hSty = 'background-color:#1e3a5f; color:#ffffff; font-weight:bold; border:1px solid #ffffff; text-align:center; padding:10px 5px; height:35pt; vertical-align:middle; font-size:10pt;';
        var border = 'border:1px solid #e2e8f0;';
        var typeMap = getTypeMapping();
        
        var html = '<html><head><meta charset="utf-8"></head><body>';
        html += '<table border="1"><thead>';
        html += '<tr>';
        html += '<th style="' + hSty + '" rowspan="2">CODE</th>';
        html += '<th style="' + hSty + '; width:220pt;" rowspan="2">NAME / DESIGNATION</th>';
        html += '<th style="' + hSty + '; width:110pt;" rowspan="2">DEPARTMENT</th>';
        html += '<th style="' + hSty + '; width:90pt;" rowspan="2">TYPE</th>';
        dr.days.forEach(function (day) {
            html += '<th style="' + hSty + '; width:35pt;">' + day.getDate() + '</th>';
        });
        html += '<th style="' + hSty + '" rowspan="2">TOTAL DAYS</th>';
        html += '<th style="' + hSty + '" rowspan="2">Present</th>';
        html += '<th style="' + hSty + '" rowspan="2">Absent</th>';
        html += '<th style="' + hSty + '" rowspan="2">SM</th>';
        html += '<th style="' + hSty + '" rowspan="2">HalfDay</th>';
        html += '<th style="' + hSty + '" rowspan="2">OFF</th>';
        html += '<th style="' + hSty + '" rowspan="2">WORK HRS</th>';
        html += '<th style="' + hSty + '" rowspan="2">OT HRS</th>';
        html += '</tr><tr>';
        dr.days.forEach(function (day) {
            var dow = ['SUN','MON','TUE','WED','THU','FRI','SAT'][day.getDay()];
            html += '<th style="' + hSty + '; height:22pt; font-size:9pt;">' + dow + '</th>';
        });
        html += '</tr></thead><tbody>';

        data.empOrder.forEach(function (name, idx) {
            var emp = data.dataMap[name];
            var rgc = (idx % 2 === 0) ? 'background-color:#ffffff;' : 'background-color:#f7f9ff;';
            var empCell = rgc + border + ' vertical-align:middle; padding:12px 5px; text-align:center; height:25pt;';
            var separator = 'border-bottom:2px solid #dae5f5;'; // Light blue bottom separator

            // Row 1: Status (Main Employee Info)
            html += '<tr>';
            html += '<td style="' + empCell + ' mso-number-format:\'\\@\';" rowspan="4">' + emp.code + '</td>';
            html += '<td style="' + empCell + ' text-align:left; padding-left:12px;" rowspan="4"><b>' + name + '</b><br><span style="color:#0056a3; font-size:9pt;">' + emp.design + '</span></td>';
            html += '<td style="' + empCell + '" rowspan="4">' + emp.department + '</td>';
            html += '<td style="' + rgc + border + ' border-left:5px solid #22c55e; font-weight:bold; text-align:center; padding:10px 2px; color:#166534;">Status</td>';
            
            dr.days.forEach(function (day) {
                var ds = (day.getDate()<10?'0'+day.getDate():day.getDate())+'/'+((day.getMonth()+1)<10?'0'+(day.getMonth()+1):(day.getMonth()+1))+'/'+day.getFullYear();
                var info = typeMap[emp.att[ds]] || { code: '-', cls: '' };
                
                var cellStyle = border + ' text-align:center; font-weight:bold; padding:10px 2px; mso-number-format:\'\\@\';';
                if (info.code === 'P') cellStyle += 'background-color:#22c55e; color:#ffffff;';
                else if (info.code === 'RP') cellStyle += 'background-color:#059669; color:#ffffff;';
                else if (info.code === 'A') cellStyle += 'background-color:#ef4444; color:#ffffff;';
                else if (info.code === 'WO') cellStyle += 'background-color:#94a3b8; color:#ffffff;';
                else if (info.code === 'H') cellStyle += 'background-color:#eab308; color:#000000;';
                else if (info.code === 'L') cellStyle += 'background-color:#a855f7; color:#ffffff;';
                else if (info.code === 'SM' || info.code === 'HD') cellStyle += 'background-color:#f97316; color:#ffffff;';
                else cellStyle += rgc;

                html += '<td style="' + cellStyle + '">' + info.code + '</td>';
            });
            
            // Right Side Summary (Spaced)
            html += '<td style="' + empCell + ' font-weight:bold;" rowspan="4">' + dr.days.length + '</td>';
            html += '<td style="' + empCell + ' font-weight:bold; color:#059669;" rowspan="4">' + emp.countP + '</td>';
            html += '<td style="' + empCell + ' font-weight:bold; color:#dc2626;" rowspan="4">' + emp.countA + '</td>';
            html += '<td style="' + empCell + ' font-weight:bold; color:#ea580c;" rowspan="4">' + emp.countSM + '</td>';
            html += '<td style="' + empCell + ' font-weight:bold; color:#ea580c;" rowspan="4">' + emp.countHD + '</td>';
            html += '<td style="' + empCell + ' font-weight:bold; color:#64748b;" rowspan="4">' + emp.countOff + '</td>';
            html += '<td style="' + empCell + ' font-weight:bold; color:#1e40af;" rowspan="4">' + minsToHHMM(emp.totalWorkMins) + '</td>';
            html += '<td style="' + empCell + ' font-weight:bold; color:#b45309;" rowspan="4">' + minsToHHMM(emp.totalOTMins) + '</td>';
            html += '</tr>';

            // Row 2: Work Hrs
            html += '<tr>';
            html += '<td style="' + rgc + border + ' border-left:5px solid #3b82f6; font-weight:bold; text-align:center; padding:10px 2px; color:#1e40af;">Work Hrs</td>';
            dr.days.forEach(function (day) {
                var ds = (day.getDate()<10?'0'+day.getDate():day.getDate())+'/'+((day.getMonth()+1)<10?'0'+(day.getMonth()+1):(day.getMonth()+1))+'/'+day.getFullYear();
                html += '<td style="' + rgc + border + ' text-align:center; font-weight:bold; color:#1e40af; mso-number-format:\'\\@\';">' + (emp.workHrs[ds] || '00:00') + '</td>';
            });
            html += '</tr>';

            // Row 3: OT Hrs
            html += '<tr>';
            html += '<td style="' + rgc + border + ' border-left:5px solid #f97316; font-weight:bold; text-align:center; padding:10px 2px; color:#9a3412;">OT Hrs</td>';
            dr.days.forEach(function (day) {
                var ds = (day.getDate()<10?'0'+day.getDate():day.getDate())+'/'+((day.getMonth()+1)<10?'0'+(day.getMonth()+1):(day.getMonth()+1))+'/'+day.getFullYear();
                html += '<td style="' + rgc + border + ' text-align:center; font-weight:bold; color:#b45309; mso-number-format:\'\\@\';">' + (emp.otHrs[ds] || '00:00') + '</td>';
            });
            html += '</tr>';

            // Row 4: Project (Separator Border added to bottom)
            html += '<tr>';
            html += '<td style="' + rgc + border + separator + ' border-left:5px solid #a855f7; font-weight:bold; text-align:center; padding:10px 2px; color:#5b21b6;">Project</td>';
            dr.days.forEach(function (day) {
                html += '<td style="' + rgc + border + separator + ' text-align:center; font-weight:bold; color:#5b21b6; font-size:8.5pt;">GN</td>';
            });
            html += '</tr>';
        });

        html += '</tbody></table></body></html>';
        return html;
    }

    function getStyles() {
        return '<style>' +
        '#div__titlebar, .uir-page-title { display:none !important; }' +
        '#custpage_html_val { padding:0 !important; }' +
        '.uir-content-wrapper { padding:0 !important; margin:0 !important; }' +
        '#main_form { margin:0 !important; }' +
        'body{margin:0; font-family:"Segoe UI", sans-serif; background:#f4f7f9;}' +
        '.pg-header{background:#1e3a5f; color:#fff; padding:10px 20px; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:1000; border-bottom:3px solid #38bdf8;}' +
        '.pg-header select{background:#2d4878; color:#fff; border:1px solid #5070b0; padding:5px; border-radius:4px; margin-left:5px; font-size:12px; cursor:pointer;}' +
        '.kpi-bar{display:flex; background:#fff; position:sticky; top:45px; z-index:990; border-bottom:1px solid #e2e8f0;}' +
        '.kpi-card{flex:1; padding:12px 20px; display:flex; align-items:center; gap:15px; border-right:1px solid #f1f5f9;}' +
        '.c-ico{width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;}' +
        '.c-ico-emp{background:#ede9fe; color:#5b21b6;}' +
        '.c-ico-prs{background:#d1fae5; color:#065f46;}' +
        '.c-ico-abs{background:#fee2e2; color:#991b1b;}' +
        '.c-ico-lve{background:#fef9c3; color:#78350f;}' +
        '.kpi-num{font-size:22px; font-weight:800; color:#1e293b; line-height:1;}' +
        '.kpi-lbl{font-size:11px; color:#64748b; margin-top:4px;}' +
        '.toolbar{padding:12px 20px; background:#fff; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0;}' +
        '.t-left{display:flex; align-items:center; gap:25px;}' +
        '.pill{background:#eff6ff; color:#1e40af; padding:5px 14px; border-radius:20px; font-size:11px; font-weight:700; border:1px solid #bfdbfe; white-space:nowrap;}' +
        '.search-box{position:relative; display:flex; align-items:center;}' +
        '.search-box input{padding:7px 10px 7px 35px !important; border:1px solid #cbd5e1; border-radius:6px; font-size:12px; width:220px; outline:none;}' +
        '.search-box span{position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:13px; pointer-events:none; display:block;}' +
        '.btn-exp{background:#fff; color:#1e3a5f; border:1px solid #1e3a5f; padding:7px 15px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600;}' +
        '.legend{padding:8px 20px; background:#f8fafc; border-bottom:1px solid #e2e8f0; font-size:11px; display:flex; gap:15px; align-items:center;}' +
        '.badge{padding:2px 4px; border-radius:3px; font-weight:800; color:#fff; min-width:20px; display:inline-block; text-align:center; font-size:9px;}' +
        '.tbl-wrap{margin:10px; background:#fff; border:1px solid #e2e8f0; border-radius:5px; overflow:hidden;}' +
        '.tbl-scroll{overflow:auto; max-height:70vh; scrollbar-width: auto;}' +
        '.tbl-scroll::-webkit-scrollbar { width: 10px; height: 10px; display: block !important; }' +
        '.tbl-scroll::-webkit-scrollbar-track { background: #f1f1f1; }' +
        '.tbl-scroll::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 5px; }' +
        'table{border-collapse:separate; border-spacing:0; width:auto; table-layout: fixed;}' +
        'thead th{background:#1e3a5f!important; color:#fff!important; font-size:10px; padding:10px 4px; text-align:center; border-right:1px solid #334b80; border-bottom:1px solid #334b80; position:sticky; top:0; z-index:500; box-sizing: border-box; height:34px;}' +
        'thead tr:nth-child(2) th{top:34px; background:#253f6e!important; z-index:499; height:28px;}' +
        '.fx{position:sticky; z-index:100; border-right:1px solid #e2e8f0!important; background-clip: padding-box; outline: 1px solid #e2e8f0;}' +
        '.fx-code{left:0; width:60px; min-width:60px; text-align:center;}' +
        '.fx-name{left:60px; width:175px; min-width:175px; padding:8px 8px; line-height:1.2; overflow: hidden;}' +
        '.fx-dept{left:235px; width:100px; min-width:100px; text-align:center;}' +
        '.fx-rtype{left:335px; width:75px; min-width:75px; text-align:center; border-right:3.5px solid #1e3a5f!important; font-size:9px; font-weight:700;}' +
        'thead th.fx{z-index:600;}' +
        'td.fx.rg-e{background-color:#ffffff!important;}' +
        'td.fx.rg-o{background-color:#f7f9ff!important;}' +
        '.cd-cell{padding-top:10px !important; padding-bottom:10px !important; vertical-align:middle;}' +
        '.dc{width:38px; min-width:38px; text-align:center; border-right:1px solid #f1f5f9; border-bottom:1px solid #f1f5f9; font-size:10px; background:#fff; padding:6px 1px;}' +
        '.we-h{background:#2e4580!important;}' +
        '.we-c{background:#f9fafb!important;}' +
        '.rg-e{background:#fff;}' +
        '.rg-o{background:#f7f9ff;}' +
        '.rl-st{color:#166534; border-left:4px solid #22c55e!important;}' +
        '.rl-wh{color:#1e40af; border-left:4px solid #3b82f6!important;}' +
        '.rl-ot{color:#9a3412; border-left:4px solid #f97316!important;}' +
        '.rl-pj{color:#5b21b6; border-left:4px solid #a855f7!important;}' +
        '.eg-bot td{border-bottom:2px solid #dae5f5!important;}' +
        '.sh{width:50px; min-width:50px; background:#1e3a5f!important; color:#fff!important; font-size:9px; border-left:1px solid #334b80;}' +
        '.sc{width:50px; min-width:50px; text-align:center; font-weight:700; border-right:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0; vertical-align:middle; font-size:11px; padding:8px 5px;}' +
        '.desig-txt{color:#0056a3; font-weight:normal; font-size:9px;}' +
        '.wh-v-txt{color:#1e40af; font-weight:700;}' +
        '.ot-v-txt{color:#b45309; font-weight:700;}' +
        '.pj-txt{color:#5b21b6; font-size:9px; font-weight:700;}' +
        '.sn-p{color:#059669; font-weight:800;}' +
        '.sn-a{color:#dc2626; font-weight:800;}' +
        '.sn-hd{color:#ea580c; font-weight:800;}' +
        '.sn-of{color:#64748b; font-weight:800;}' +
        '.c-p{background:#22c55e;}' +
        '.c-rp{background:#059669;}' +
        '.c-a{background:#ef4444;}' +
        '.c-sm{background:#f97316;}' +
        '.c-wo{background:#94a3b8;}' +
        '.c-h{background:#eab308;}' +
        '.c-l{background:#a855f7;}' +
        '.c-na{background:#fff; color:#cbd5e1; border:1px solid #e2e8f0;}' +
        '.welcome-msg{padding:80px; text-align:center; color:#94a3b8; font-size:14px;}' +
        '</style>';
    }

    function buildHeader(subId, monthId, yearId, payGrp) {
        var su = url.resolveScript({ scriptId: runtime.getCurrentScript().id, deploymentId: runtime.getCurrentScript().deploymentId });
        return '<div class="pg-header"><div class="pg-logo">■ WINSTAR HRMS <small style="opacity:0.7; font-weight:normal; margin-left:10px;">| HR Attendance Portal</small></div>' +
            '<div><form method="GET" action="' + su + '">' +
            '<input type="hidden" name="script" value="' + runtime.getCurrentScript().id + '"><input type="hidden" name="deploy" value="' + runtime.getCurrentScript().deploymentId + '">' +
            '<select name="custpage_subsidiary" onchange="this.form.submit()"><option value="">Select Subsidiary</option>' + getOpts('subsidiary', subId) + '</select>' +
            '<select name="custpage_paygroup" onchange="this.form.submit()"><option value="">Select Pay Group</option>' + getOpts('customrecord_hris_process_groupmaster', payGrp) + '</select>' +
            '<select name="custpage_year" onchange="this.form.submit()">' + getOpts('customlist_hris_year_master', yearId) + '</select>' +
            '<select name="custpage_month" onchange="this.form.submit()">' + getOpts('customlist_hris_month_list', monthId) + '</select>' +
            '</form></div></div>';
    }

    function getOpts(type, sel) {
        var sql = "SELECT id, name FROM " + type;
        
        // Add inactive filter for custom records and subsidiary
        if (type === 'subsidiary' || type === 'customrecord_hris_process_groupmaster') {
            sql += " WHERE isinactive = 'F'";
        }
        
        sql += (type === 'subsidiary') ? " ORDER BY name" : " ORDER BY id";
        
        return query.runSuiteQL({ query: sql }).asMappedResults().map(function (r) {
            return '<option value="' + r.id + '"' + (sel == r.id ? ' selected' : '') + '>' + r.name + '</option>';
        }).join('');
    }

    function makeKpiCard(lbl, val, ico) {
        return '<div class="kpi-card">' + ico + '<div><div class="kpi-num">' + val + '</div><div class="kpi-lbl">' + lbl + '</div></div></div>';
    }

    function getTypeMapping() {
        return {
            'RP': { code: 'RP', cls: 'c-rp' },
            '18': { code: 'P',  cls: 'c-p'  }, '1' : { code: 'A',  cls: 'c-a'  },
            '21': { code: 'WO', cls: 'c-wo' }, '19': { code: 'H',  cls: 'c-h'  },
            '5' : { code: 'L', cls: 'c-l'  },  '14': { code: 'L', cls: 'c-l'  },
            '17': { code: 'A', cls: 'c-a'  },  '24': { code: 'SM', cls: 'c-sm' },
            '6' : { code: 'HD', cls: 'c-sm' }
        };
    }

    return { onRequest: onRequest };

});