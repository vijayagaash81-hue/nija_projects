/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 *
 * Daily Attendance Summary Report  -  PRE-APPROVAL REVIEW (Clean Streamlined Layout)
 * Script ID     : customscript_hris_dailyattensumreport_sl
 * Deployment ID : customdeploy_hris_dailyattensumreport_sl
 *
 * Called by the "Daily Attendance Summary - Filters" Suitelet (unchanged), which redirects here with:
 *    fromdate, todate, subsidiary, paygroup
 *
 * Data source : customrecord_hris_man_dailyattendance
 *    attendance date  custrecord_hris_man_daily_attendate
 *    employee         custrecord_hris_man_daily_employee
 *    subsidiary       custrecord_hris_man_daily_subsidiary
 *    pay group        custrecord_hris_man_daily_paygroup
 *    status           custrecord_hris_emp_atten_status      (1 = Present, 2 = Absent, 3 = Day Off, 4 = Public Holiday)
 *    project          custrecord_hris_man_daily_stdproject
 *
 * Purpose: the HR analyst reviews this report BEFORE approving the daily timesheet.
 *   - Monthly Total / Present / Absent / Day Off / Public Holiday / Difference days per employee
 *   - Duplicate records (same employee + date + project entered more than once)
 *   - Conflicting records (same employee + date with Present AND Absent)
 *   - Missing project (Present record with no project)
 *   - Multi-project tracking (employees logging multiple projects per day)
 *   - Day-strip heat map per employee + drill-down to every record (with link to open the record)
 *   - Excel export (summary + monthly + issue list)
 *
 * NOTE: all record / field ids live in the CFG block below - change them there only.
 */
define(['N/ui/serverWidget', 'N/query', 'N/runtime', 'N/url', 'N/format', 'N/file', 'N/log'],
    (serverWidget, query, runtime, url, format, file, log) => {

        /* =========================================================
           CONFIG  (change record / field ids here only)
        ========================================================= */
        const CFG = {
            recordType: 'customrecord_hris_man_dailyattendance',
            f: {
                emp: 'custrecord_hris_man_daily_employee',
                date: 'custrecord_hris_man_daily_attendate',
                subsidiary: 'custrecord_hris_man_daily_subsidiary',
                paygroup: 'custrecord_hris_man_daily_paygroup',
                status: 'custrecord_hris_emp_atten_status',
                project: 'custrecord_hris_man_daily_stdproject'          // <-- project field id
            },
            PRESENT: 1,
            ABSENT: 2,
            DAY_OFF: 3,
            HOLIDAY: 4
        };

        const DAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const STATUS_LABEL = {
            P: 'Present', A: 'Absent', DO: 'Day Off', PH: 'Public Holiday', O: 'Other status', NR: 'No record'
        };

        const FLAG_LABEL = {
            dup: 'Duplicate',
            conflict: 'Present + Absent',
            noproj: 'No Project',
            multi: 'Multi-project'
        };

        /* =========================================================
           ENTRY POINT
        ========================================================= */
        const onRequest = (context) => {
            const p = context.request.parameters;
            const fromRaw = p.fromdate || '';
            const toRaw = p.todate || '';
            const subId = p.subsidiary || '';
            const pgId = p.paygroup || '';
            const isExport = (p.export === 'T');

            const form = serverWidget.createForm({ title: ' ' });
            const fld = form.addField({ id: 'custpage_html', type: serverWidget.FieldType.INLINEHTML, label: ' ' });

            if (!fromRaw || !toRaw) {
                fld.defaultValue = getStyles() + buildTopBar(null, '', '', subId, pgId) +
                    '<div class="msg-box"><b>No date range received.</b><br>Choose a From Date and To Date (and optionally a Subsidiary / Pay Group) above, then click Generate Report.</div>';
                context.response.writePage(form);
                return;
            }

            let dr;
            try {
                dr = buildDateRange(fromRaw, toRaw);
            } catch (e) {
                log.error({ title: 'Date parse error', details: e.message });
                fld.defaultValue = getStyles() + buildTopBar(null, fromRaw, toRaw, subId, pgId) +
                    '<div class="msg-box err"><b>Could not read the dates.</b><br>' + esc(e.message) + '</div>';
                context.response.writePage(form);
                return;
            }

            let data;
            try {
                data = analyze(subId, pgId, dr);
            } catch (e) {
                log.error({ title: 'Report query error', details: e.name + ' : ' + e.message });
                fld.defaultValue = getStyles() + buildTopBar(dr, fromRaw, toRaw, subId, pgId) +
                    '<div class="msg-box err"><b>The report query failed.</b><br>' + esc(e.message || String(e)) +
                    '<br><small>Check the record / field ids in the CFG block at the top of the script (record: ' +
                    esc(CFG.recordType) + ').</small></div>';
                context.response.writePage(form);
                return;
            }

            if (isExport) {
                const xls = file.create({
                    name: 'Daily_Attendance_Review_' + fmtDD(dr.start).replace(/\//g, '') + '_' + fmtDD(dr.end).replace(/\//g, '') + '.xls',
                    fileType: file.Type.PLAINTEXT,
                    contents: buildExcelHtml(data, dr)
                });
                context.response.writeFile({ file: xls });
                return;
            }

            fld.defaultValue = buildReportHtml(data, dr, fromRaw, toRaw, subId, pgId);
            context.response.writePage(form);
        };

        /* =========================================================
           HELPERS
        ========================================================= */
        const pad2 = (n) => (n < 10 ? '0' + n : '' + n);
        const fmtDD = (d) => pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear();
        const fmtNice = (d) => pad2(d.getDate()) + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();

        const esc = (s) => String(s === null || s === undefined ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        const parseDateInput = (raw) => {
            const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(raw));
            if (m) return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
            return format.parse({ value: raw, type: format.Type.DATE });
        };

        const buildDateRange = (fromRaw, toRaw) => {
            const f = parseDateInput(fromRaw);
            const t = parseDateInput(toRaw);
            const start = new Date(f.getFullYear(), f.getMonth(), f.getDate());
            const end = new Date(t.getFullYear(), t.getMonth(), t.getDate());
            if (end < start) throw new Error('To Date is earlier than From Date.');
            const days = [];
            const c = new Date(start);
            while (c <= end) {
                days.push(new Date(c));
                c.setDate(c.getDate() + 1);
            }
            if (days.length > 93) throw new Error('Please choose a range of 93 days or less (selected ' + days.length + ' days).');
            return { start: start, end: end, days: days };
        };

        const runAll = (sql, params) => {
            let out = [];
            const startTime = new Date().getTime();
            try {
                const direct = query.runSuiteQL({ query: sql, params: params || [] });
                out = direct.asMappedResults();
            } catch (e) {
                log.audit({ title: 'FALLBACK_TO_PAGED', details: e.message });
                const paged = query.runSuiteQLPaged({ query: sql, params: params || [], pageSize: 1000 });
                paged.pageRanges.forEach((pr) => {
                    out = out.concat(paged.fetch({ index: pr.index }).data.asMappedResults());
                });
            }
            const duration = new Date().getTime() - startTime;
            log.audit({
                title: 'SQL_QUERY_SUCCESS',
                details: { totalRowsReturned: out.length, durationMs: duration }
            });
            return out;
        };

        const getField = (r, names) => {
            if (!r) return '';
            for (let i = 0; i < names.length; i++) {
                const n = names[i];
                if (r[n] !== undefined && r[n] !== null) return r[n];
                if (r[n.toLowerCase()] !== undefined && r[n.toLowerCase()] !== null) return r[n.toLowerCase()];
                if (r[n.toUpperCase()] !== undefined && r[n.toUpperCase()] !== null) return r[n.toUpperCase()];
            }
            return '';
        };

        /* =========================================================
           DATA + ANALYSIS (KEYSET CURSOR STREAMING FOR 100k - 200k+ ROWS)
        ========================================================= */
        const analyze = (subId, pgId, dr) => {
            const warnings = [];
            const sumRowsMap = {};
            const empInfo = {};
            const recByEmp = {};

            const whereClauses = [];
            const sqlParams = [];

            whereClauses.push(`TRUNC(custrecord_hris_man_daily_attendate) >= TO_DATE(?, 'YYYY-MM-DD')`);
            sqlParams.push(toISO(dr.start));
            whereClauses.push(`TRUNC(custrecord_hris_man_daily_attendate) <= TO_DATE(?, 'YYYY-MM-DD')`);
            sqlParams.push(toISO(dr.end));

            if (subId) {
                whereClauses.push(`custrecord_hris_man_daily_subsidiary = ?`);
                sqlParams.push(Number(subId));
            }

            if (pgId) {
                whereClauses.push(`custrecord_hris_man_daily_paygroup = ?`);
                sqlParams.push(Number(pgId));
            }

            const where = whereClauses.join(' AND ');

            // 1. Single-pass Monthly Summary Aggregation Query across full range
            const sumSql = `
                SELECT
                    employee,
                    employee_name,
                    paygroup_name,
                    TO_CHAR(attendance_date, 'MM') AS attendance_month,
                    TO_CHAR(attendance_date, 'FMMonth') AS attendance_monthname,
                    TO_CHAR(attendance_date, 'YYYY') AS attendance_year,
                    LAST_DAY(attendance_date) - TRUNC(attendance_date, 'MM') + 1 AS total_days,
                    SUM(CASE WHEN attendance_status = 1 THEN 1 ELSE 0 END) AS present_days,
                    SUM(CASE WHEN attendance_status = 2 THEN 1 ELSE 0 END) AS absent_days,
                    SUM(CASE WHEN attendance_status = 3 THEN 1 ELSE 0 END) AS dayoff_days,
                    SUM(CASE WHEN attendance_status = 4 THEN 1 ELSE 0 END) AS holiday_days
                FROM
                (
                    SELECT
                        custrecord_hris_man_daily_employee AS employee,
                        BUILTIN.DF(custrecord_hris_man_daily_employee) AS employee_name,
                        BUILTIN.DF(custrecord_hris_man_daily_paygroup) AS paygroup_name,
                        TRUNC(custrecord_hris_man_daily_attendate) AS attendance_date,
                        MIN(custrecord_hris_emp_atten_status) AS attendance_status
                    FROM customrecord_hris_man_dailyattendance
                    WHERE ${where}
                    GROUP BY
                        custrecord_hris_man_daily_employee,
                        BUILTIN.DF(custrecord_hris_man_daily_employee),
                        BUILTIN.DF(custrecord_hris_man_daily_paygroup),
                        TRUNC(custrecord_hris_man_daily_attendate),
                        custrecord_hris_man_daily_stdproject
                ) daily_attendance
                GROUP BY
                    employee,
                    employee_name,
                    paygroup_name,
                    TO_CHAR(attendance_date, 'MM'),
                    TO_CHAR(attendance_date, 'FMMonth'),
                    TO_CHAR(attendance_date, 'YYYY'),
                    LAST_DAY(attendance_date) - TRUNC(attendance_date, 'MM') + 1
                ORDER BY employee, attendance_year, attendance_month
            `;

            try {
                const sumRowsRaw = runAll(sumSql, sqlParams);
                sumRowsRaw.forEach((s) => {
                    const empId = String(getField(s, ['employee', 'EMPLOYEE']));
                    const mo = getField(s, ['attendance_month', 'ATTENDANCE_MONTH']);
                    const yr = getField(s, ['attendance_year', 'ATTENDANCE_YEAR']);
                    const key = empId + '_' + yr + '_' + mo;

                    sumRowsMap[key] = {
                        employee: empId,
                        employee_name: getField(s, ['employee_name', 'EMPLOYEE_NAME']),
                        paygroup_name: getField(s, ['paygroup_name', 'PAYGROUP_NAME']),
                        attendance_month: mo,
                        attendance_monthname: getField(s, ['attendance_monthname', 'ATTENDANCE_MONTHNAME']),
                        attendance_year: yr,
                        total_days: Number(getField(s, ['total_days', 'TOTAL_DAYS'])) || 0,
                        present_days: Number(getField(s, ['present_days', 'PRESENT_DAYS'])) || 0,
                        absent_days: Number(getField(s, ['absent_days', 'ABSENT_DAYS'])) || 0,
                        dayoff_days: Number(getField(s, ['dayoff_days', 'DAYOFF_DAYS'])) || 0,
                        holiday_days: Number(getField(s, ['holiday_days', 'HOLIDAY_DAYS'])) || 0
                    };
                });
            } catch (e) {
                log.error({ title: 'Monthly Summary Error', details: e.message });
                warnings.push('Monthly summary aggregation error: ' + e.message);
            }

            // 2. Stream all records using Keyset Pagination (Bypasses both 10k & 100k limits)
            let lastRecId = 0;
            const batchLimit = 5000;
            let totalRecordsLoaded = 0;
            const recStartTime = new Date().getTime();

            while (true) {
                if (runtime.getCurrentScript().getRemainingUsage() < 60) {
                    warnings.push('Record volume is extremely large. Streamed ' + totalRecordsLoaded + ' records safely within governance limits.');
                    log.audit({ title: 'GOVERNANCE_SAFETY_STOP', details: 'Stopped keyset streaming at ' + totalRecordsLoaded + ' records.' });
                    break;
                }

                const currentWhere = where ? `${where} AND R.id > ${lastRecId}` : `R.id > ${lastRecId}`;
                const recSql = `
                    SELECT
                        R.id AS rec_id,
                        R.custrecord_hris_man_daily_employee AS emp_id,
                        BUILTIN.DF(R.custrecord_hris_man_daily_employee) AS emp_name,
                        BUILTIN.DF(R.custrecord_hris_man_daily_paygroup) AS pg_name,
                        TO_CHAR(R.custrecord_hris_man_daily_attendate, 'YYYY-MM-DD') AS d_iso,
                        TO_CHAR(R.custrecord_hris_man_daily_attendate, 'DD/MM/YYYY') AS d_date,
                        R.custrecord_hris_emp_atten_status AS att_status,
                        R.custrecord_hris_man_daily_stdproject AS proj_id,
                        BUILTIN.DF(R.custrecord_hris_man_daily_stdproject) AS proj_name
                    FROM customrecord_hris_man_dailyattendance AS R
                    WHERE ${currentWhere}
                    ORDER BY R.id ASC
                    FETCH FIRST ${batchLimit} ROWS ONLY
                `;

                let batch;
                try {
                    batch = query.runSuiteQL({ query: recSql, params: sqlParams || [] }).asMappedResults();
                } catch (recErr) {
                    log.error({ title: 'Keyset Batch Error', details: 'Failed at lastRecId: ' + lastRecId + ' - ' + recErr.message });
                    warnings.push('Error loading attendance batch past ID ' + lastRecId + ': ' + recErr.message);
                    break;
                }

                if (!batch || !batch.length) break;

                totalRecordsLoaded += batch.length;

                for (let b = 0; b < batch.length; b++) {
                    const r = batch[b];
                    const eid = String(getField(r, ['emp_id', 'EMP_ID']));
                    if (!eid) continue;

                    if (!empInfo[eid]) {
                        empInfo[eid] = {
                            name: getField(r, ['emp_name', 'EMP_NAME']) || ('Employee ' + eid),
                            paygroup: getField(r, ['pg_name', 'PG_NAME']) || '-'
                        };
                        recByEmp[eid] = {};
                    }

                    const dk = recDateKey(r);
                    if (!recByEmp[eid][dk]) recByEmp[eid][dk] = [];
                    recByEmp[eid][dk].push({
                        id: getField(r, ['rec_id', 'REC_ID', 'id', 'ID']),
                        st: Number(getField(r, ['att_status', 'ATT_STATUS'])),
                        projId: getField(r, ['proj_id', 'PROJ_ID']),
                        projName: getField(r, ['proj_name', 'PROJ_NAME'])
                    });
                }

                lastRecId = Number(getField(batch[batch.length - 1], ['rec_id', 'REC_ID', 'id', 'ID'])) || 0;
                if (!lastRecId || batch.length < batchLimit) break;
            }

            log.audit({
                title: 'KEYSET_STREAMING_COMPLETE',
                details: { totalRecordsLoaded: totalRecordsLoaded, durationMs: new Date().getTime() - recStartTime }
            });

            const sumRows = Object.values(sumRowsMap).map((s) => {
                s.difference_days = s.total_days - s.present_days - s.absent_days - s.dayoff_days - s.holiday_days;
                return s;
            });

            if (!totalRecordsLoaded && sumRows.length) {
                warnings.push('Monthly summary returned data but record-level query returned 0 rows. Check execution logs.');
            }

            const recDateKey = (r) => {
                const isoVal = getField(r, ['d_iso', 'D_ISO']);
                const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoVal || ''));
                if (m) return m[3] + '/' + m[2] + '/' + m[1];
                return String(getField(r, ['d_date', 'D_DATE']) || '').trim();
            };

            // 3. Load Employee Metadata (Code, Designation, Department)
            const empExtra = {};
            try {
                const idMap = {};
                Object.keys(empInfo).forEach((eid) => { idMap[eid] = true; });
                sumRows.forEach((s) => {
                    const eidVal = getField(s, ['employee', 'EMPLOYEE']);
                    if (eidVal) idMap[String(Number(eidVal))] = true;
                });
                const idList = Object.keys(idMap).filter((x) => x && x !== 'NaN');
                for (let i = 0; i < idList.length; i += 500) {
                    const chunk = idList.slice(i, i + 500);
                    const extraRows = runAll(`
                        SELECT
                            E.id AS emp_id,
                            E.custentity_hris_empcode AS emp_code,
                            BUILTIN.DF(E.custentity_hris_empdesignation) AS design,
                            BUILTIN.DF(E.custentity_hris_empdepartment_new) AS dept
                        FROM employee AS E
                        WHERE E.id IN (${chunk.join(',')})
                    `);
                    extraRows.forEach((x) => {
                        const xeid = getField(x, ['emp_id', 'ID']);
                        empExtra[String(xeid)] = x;
                    });
                }
            } catch (e) {
                log.error({ title: 'Employee info query error', details: e.name + ' : ' + e.message });
                warnings.push('Employee code / designation / department could not be loaded: ' + e.message);
            }

            const monthsByEmp = {};
            sumRows.forEach((s) => {
                const eid = String(getField(s, ['employee', 'EMPLOYEE']));
                const eName = getField(s, ['employee_name', 'EMPLOYEE_NAME']);
                const paygroupNameVal = getField(s, ['paygroup_name', 'PAYGROUP_NAME']);

                if (!monthsByEmp[eid]) monthsByEmp[eid] = [];
                monthsByEmp[eid].push({
                    month: getField(s, ['attendance_month', 'ATTENDANCE_MONTH']),
                    monthName: getField(s, ['attendance_monthname', 'ATTENDANCE_MONTHNAME']),
                    year: getField(s, ['attendance_year', 'ATTENDANCE_YEAR']),
                    total: Number(getField(s, ['total_days', 'TOTAL_DAYS'])) || 0,
                    present: Number(getField(s, ['present_days', 'PRESENT_DAYS'])) || 0,
                    absent: Number(getField(s, ['absent_days', 'ABSENT_DAYS'])) || 0,
                    dayoff: Number(getField(s, ['dayoff_days', 'DAYOFF_DAYS'])) || 0,
                    holiday: Number(getField(s, ['holiday_days', 'HOLIDAY_DAYS'])) || 0,
                    diff: Number(getField(s, ['difference_days', 'DIFFERENCE_DAYS'])) || 0
                });

                if (!empInfo[eid]) {
                    empInfo[eid] = {
                        name: eName || ('Employee ' + eid),
                        paygroup: paygroupNameVal || '-'
                    };
                    recByEmp[eid] = {};
                }
            });

            Object.keys(empInfo).forEach((eid) => {
                const ex = empExtra[eid] || {};
                empInfo[eid].code = getField(ex, ['emp_code', 'CUSTENTITY_HRIS_EMPCODE']) || empInfo[eid].code || '-';
                empInfo[eid].design = getField(ex, ['design', 'CUSTENTITY_HRIS_EMPDESIGNATION']) || empInfo[eid].design || '-';
                empInfo[eid].dept = getField(ex, ['dept', 'CUSTENTITY_HRIS_EMPDEPARTMENT_NEW']) || empInfo[eid].dept || '-';
            });

            // 4. Compute KPIs, Review Flags, and Daily Matrix
            const kpi = {
                employees: 0, clear: 0, review: 0,
                records: 0, dupRecords: 0, conflicts: 0, missingProject: 0, multiDaysCount: 0,
                totalDays: 0, present: 0, absent: 0, dayoff: 0, holiday: 0, diff: 0
            };
            const emps = [];

            Object.keys(empInfo).forEach((eid) => {
                const info = empInfo[eid];
                const emp = {
                    id: eid,
                    code: info.code,
                    name: info.name,
                    design: info.design,
                    dept: info.dept,
                    paygroup: info.paygroup,
                    months: monthsByEmp[eid] || [],
                    days: [],
                    totalDays: 0, present: 0, absent: 0, dayoff: 0, holiday: 0, diff: 0,
                    records: 0, dupRecords: 0, dupDays: 0, conflictDays: 0, multiDays: 0,
                    missingProject: 0, noRecordDays: 0, issues: 0
                };

                emp.months.forEach((m) => {
                    emp.totalDays += m.total;
                    emp.present += m.present;
                    emp.absent += m.absent;
                    emp.dayoff += m.dayoff;
                    emp.holiday += m.holiday;
                    emp.diff += m.diff;
                });

                dr.days.forEach((day) => {
                    const ds = fmtDD(day);
                    const rows = (recByEmp[eid] && recByEmp[eid][ds]) ? recByEmp[eid][ds] : [];
                    const d = { ds: ds, dow: day.getDay(), date: day, status: 'NR', flags: [], rows: [] };

                    const sigCount = {};
                    const projSigCount = {};
                    const statusSet = {};
                    const projSet = {};
                    let maxStatus = null;

                    rows.forEach((r) => {
                        const st = Number(r.st !== undefined ? r.st : getField(r, ['att_status', 'ATT_STATUS']));
                        const projNameVal = r.projName !== undefined ? r.projName : getField(r, ['proj_name', 'PROJ_NAME']);
                        const projIdVal = r.projId !== undefined ? r.projId : getField(r, ['proj_id', 'PROJ_ID']);
                        const recIdVal = r.id !== undefined ? r.id : getField(r, ['rec_id', 'REC_ID', 'id', 'ID']);

                        const projText = (projNameVal && projNameVal !== '-') ? String(projNameVal) : '';
                        const hasProj = !!(projText || (projIdVal !== null && projIdVal !== undefined && projIdVal !== ''));
                        const projKey = hasProj ? String(projIdVal || projText) : '';
                        if (!isNaN(st)) {
                            statusSet[st] = true;
                        }
                        projSet[projKey] = true;
                        const sig = [projKey, isNaN(st) ? '' : st].join('|');
                        sigCount[sig] = (sigCount[sig] || 0) + 1;
                        projSigCount[projKey] = (projSigCount[projKey] || 0) + 1;
                        d.rows.push({
                            id: recIdVal,
                            statusNum: st,
                            project: projText || (hasProj ? String(projIdVal) : ''),
                            hasProj: hasProj,
                            sig: sig,
                            projKey: projKey,
                            dupRow: false,
                            noProj: false
                        });
                    });

                    if (rows.length) {
                        if (statusSet[CFG.PRESENT]) maxStatus = CFG.PRESENT;
                        else if (statusSet[CFG.ABSENT]) maxStatus = CFG.ABSENT;
                        else if (statusSet[CFG.DAY_OFF]) maxStatus = CFG.DAY_OFF;
                        else if (statusSet[CFG.HOLIDAY]) maxStatus = CFG.HOLIDAY;
                        else {
                            let m = null;
                            Object.keys(statusSet).forEach(st => {
                                const n = Number(st);
                                if (m === null || n < m) m = n;
                            });
                            maxStatus = m;
                        }

                        if (maxStatus === CFG.PRESENT) d.status = 'P';
                        else if (maxStatus === CFG.ABSENT) d.status = 'A';
                        else if (maxStatus === CFG.DAY_OFF) d.status = 'DO';
                        else if (maxStatus === CFG.HOLIDAY) d.status = 'PH';
                        else d.status = 'O';
                    } else {
                        emp.noRecordDays++;
                    }

                    if (statusSet[CFG.PRESENT] && statusSet[CFG.ABSENT]) {
                        d.flags.push('conflict');
                        emp.conflictDays++;
                    }

                    let dupExtra = 0;
                    Object.keys(projSigCount).forEach((pk) => {
                        if (projSigCount[pk] > 1) dupExtra += projSigCount[pk] - 1;
                    });
                    let statusDup = false;
                    if (dupExtra === 0 && d.rows.length > 1 && Object.keys(statusSet).length > 1) {
                        dupExtra = d.rows.length - 1;
                        statusDup = true;
                    }
                    if (dupExtra > 0) {
                        d.rows.forEach((rw) => { if (statusDup || projSigCount[rw.projKey] > 1) rw.dupRow = true; });
                        d.flags.push('dup');
                        emp.dupRecords += dupExtra;
                        emp.dupDays++;
                    } else if (d.rows.length > 1 && Object.keys(projSet).length > 1) {
                        d.flags.push('multi');
                        emp.multiDays++;
                    }

                    let missingOnDay = 0;
                    d.rows.forEach((rw) => {
                        if (!rw.hasProj && rw.statusNum === CFG.PRESENT) { rw.noProj = true; missingOnDay++; }
                    });
                    if (missingOnDay > 0) {
                        d.flags.push('noproj');
                        emp.missingProject += missingOnDay;
                    }

                    emp.records += d.rows.length;
                    emp.days.push(d);
                });

                emp.issues = emp.dupRecords + emp.conflictDays + emp.missingProject;

                kpi.employees++;
                if (emp.issues > 0) kpi.review++; else kpi.clear++;
                kpi.records += emp.records;
                kpi.dupRecords += emp.dupRecords;
                kpi.conflicts += emp.conflictDays;
                kpi.missingProject += emp.missingProject;
                if (emp.multiDays > 0) kpi.multiDaysCount++;
                kpi.totalDays += emp.totalDays;
                kpi.present += emp.present;
                kpi.absent += emp.absent;
                kpi.dayoff += emp.dayoff;
                kpi.holiday += emp.holiday;
                kpi.diff += emp.diff;

                emps.push(emp);
            });

            emps.sort((a, b) => {
                const ar = a.issues > 0 ? 0 : 1;
                const br = b.issues > 0 ? 0 : 1;
                if (ar !== br) return ar - br;
                if (a.issues !== b.issues) return b.issues - a.issues;
                return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
            });

            return { emps: emps, kpi: kpi, warnings: warnings };
        };

        /* =========================================================
           HTML  -  PAGE
        ========================================================= */
        const getReportUrl = (fromRaw, toRaw, subId, pgId, exportFlag) => {
            const params = { fromdate: fromRaw, todate: toRaw, subsidiary: subId, paygroup: pgId };
            if (exportFlag) params.export = 'T';
            return url.resolveScript({
                scriptId: runtime.getCurrentScript().id,
                deploymentId: runtime.getCurrentScript().deploymentId,
                params: params
            });
        };

        const toISO = (d) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());

        const getOpts = (sql, sel) => {
            try {
                return runAll(sql).map((r) => {
                    const rId = getField(r, ['id', 'ID']);
                    const rName = getField(r, ['name', 'NAME']);
                    return '<option value="' + esc(rId) + '"' + (String(sel) === String(rId) ? ' selected' : '') + '>' + esc(rName) + '</option>';
                }).join('');
            } catch (e) {
                log.error({ title: 'Filter options error', details: e.message });
                return '';
            }
        };

        const buildTopBar = (dr, fromRaw, toRaw, subId, pgId) => {
            const range = dr ? (fmtNice(dr.start) + '  &rarr;  ' + fmtNice(dr.end) + '  &middot;  ' + dr.days.length + ' days') : 'Select the filters and click Generate Report';

            let fromVal = '';
            let toVal = '';
            if (dr) {
                fromVal = toISO(dr.start);
                toVal = toISO(dr.end);
            } else {
                if (/^\d{4}-\d{2}-\d{2}$/.test(fromRaw || '')) fromVal = fromRaw;
                if (/^\d{4}-\d{2}-\d{2}$/.test(toRaw || '')) toVal = toRaw;
                if (!fromVal && !toVal) {
                    const now = new Date();
                    fromVal = toISO(new Date(now.getFullYear(), now.getMonth(), 1));
                    toVal = toISO(now);
                }
            }

            const su = url.resolveScript({ scriptId: runtime.getCurrentScript().id, deploymentId: runtime.getCurrentScript().deploymentId });
            const subOpts = getOpts("SELECT id, name FROM subsidiary WHERE isinactive = 'F' ORDER BY name", subId);
            const pgOpts = getOpts("SELECT id, name FROM customrecord_hris_process_groupmaster WHERE isinactive = 'F' ORDER BY name", pgId);

            return '<div class="topbar">' +
                '<div class="tb-left"><div class="tb-logo">&#9638;</div>' +
                '<div><div class="tb-title">Daily Attendance Summary</div>' +
                '<div class="tb-sub">Pre-approval review &middot; ' + range + '</div></div></div>' +
                '<div class="fbar">' +
                '<label>From Date<input type="date" id="fld_fromdate" value="' + esc(fromVal) + '" required></label>' +
                '<label>To Date<input type="date" id="fld_todate" value="' + esc(toVal) + '" required></label>' +
                '<label>Subsidiary<select id="fld_subsidiary"><option value="">All Subsidiaries</option>' + subOpts + '</select></label>' +
                '<label>Pay Group<select id="fld_paygroup"><option value="">All Pay Groups</option>' + pgOpts + '</select></label>' +
                '<button type="button" class="btn go" onclick="generateReport()">Generate Report</button>' +
                '</div>' +
                '<script>' +
                'function generateReport(){' +
                '  var f = document.getElementById("fld_fromdate").value;' +
                '  var t = document.getElementById("fld_todate").value;' +
                '  var s = document.getElementById("fld_subsidiary").value;' +
                '  var pg = document.getElementById("fld_paygroup").value;' +
                '  if(!f || !t){ alert("Please select both From Date and To Date."); return; }' +
                '  var targetUrl = "' + su + '&fromdate=" + encodeURIComponent(f) + "&todate=" + encodeURIComponent(t);' +
                '  if(s) targetUrl += "&subsidiary=" + encodeURIComponent(s);' +
                '  if(pg) targetUrl += "&paygroup=" + encodeURIComponent(pg);' +
                '  window.location.href = targetUrl;' +
                '}' +
                '</script>' +
                '</div>';
        };

        const statusBadge = (st) => '<span class="bd s-' + st + '" title="' + esc(STATUS_LABEL[st] || st) + '">' + (st === 'NR' ? '-' : st) + '</span>';

        const flagChip = (f) => '<span class="fl f-' + f + '">' + esc(FLAG_LABEL[f] || f) + '</span>';

        const rowStatusCode = (n) => {
            if (n === CFG.PRESENT) return 'P';
            if (n === CFG.ABSENT) return 'A';
            if (n === CFG.DAY_OFF) return 'DO';
            if (n === CFG.HOLIDAY) return 'PH';
            return 'O';
        };

        const buildStrip = (emp) => {
            let h = '<div class="strip">';
            emp.days.forEach((d) => {
                const iss = (d.flags.indexOf('dup') !== -1 || d.flags.indexOf('noproj') !== -1 || d.flags.indexOf('conflict') !== -1) ? ' iss' : '';
                const tip = pad2(d.date.getDate()) + ' ' + MONTHS[d.date.getMonth()] + ' ' + DAY_SHORT[d.dow] + ' - ' +
                    (STATUS_LABEL[d.status] || d.status) +
                    (d.flags.length ? ' [' + d.flags.map((f) => FLAG_LABEL[f] || f).join(', ') + ']' : '');
                h += '<i class="sq s-' + d.status + iss + '" title="' + esc(tip) + '"></i>';
            });
            return h + '</div>';
        };

        const buildReportHtml = (data, dr, fromRaw, toRaw, subId, pgId) => {
            const k = data.kpi;
            let html = getStyles() + buildTopBar(dr, fromRaw, toRaw, subId, pgId);

            if (data.warnings.length) {
                html += '<div class="msg-box warn">' + data.warnings.map(esc).join('<br>') + '</div>';
            }

            const readyPct = k.employees ? Math.round((k.clear / k.employees) * 100) : 0;

            html += '<div class="ready">' +
                '<div class="ready-txt"><b>' + k.clear + ' of ' + k.employees + '</b> employees are clear for approval' +
                '<span class="muted"> &nbsp;&middot;&nbsp; ' + k.review + ' need review before you approve</span></div>' +
                '<div class="ready-bar"><div class="ready-fill" style="width:' + readyPct + '%"></div></div>' +
                '<div class="ready-pct">' + readyPct + '%</div></div>';

            html += '<div class="toolbar">' +
                '<div class="chips" id="chips">' +
                '<button class="chip on" data-f="all" onclick="setChip(this)">All <span>' + k.employees + '</span></button>' +
                '<button class="chip" data-f="review" onclick="setChip(this)">Needs review <span>' + k.review + '</span></button>' +
                '<button class="chip" data-f="dup" onclick="setChip(this)">Duplicates <span>' + data.emps.filter((e) => e.dupRecords > 0).length + '</span></button>' +
                '<button class="chip" data-f="conflict" onclick="setChip(this)">Present + Absent <span>' + data.emps.filter((e) => e.conflictDays > 0).length + '</span></button>' +
                '<button class="chip" data-f="noproj" onclick="setChip(this)">Missing project <span>' + data.emps.filter((e) => e.missingProject > 0).length + '</span></button>' +
                '<button class="chip" data-f="multi" onclick="setChip(this)">Multi-project <span>' + data.emps.filter((e) => e.multiDays > 0).length + '</span></button>' +
                '<button class="chip" data-f="diff" onclick="setChip(this)">Difference &gt; 0 <span>' + data.emps.filter((e) => e.diff > 0).length + '</span></button>' +
                '<button class="chip" data-f="absent" onclick="setChip(this)">Has absent <span>' + data.emps.filter((e) => e.absent > 0).length + '</span></button>' +
                '<button class="chip" data-f="clear" onclick="setChip(this)">Clear <span>' + k.clear + '</span></button>' +
                '</div>' +
                '<div class="tools"><div class="search"><span>&#128269;</span><input type="text" id="q" placeholder="Search name, code, department..." onkeyup="applyFilters()"></div>' +
                '<button class="btn" onclick="window.open(\'' + getReportUrl(fromRaw, toRaw, subId, pgId, true) + '\',\'_blank\')">&#8681; Export to Excel</button></div>' +
                '</div>';

            html += '<div class="legend"><span class="lg-t">Day strip:</span>' +
                '<span class="lg"><i class="sq s-P"></i>Present</span>' +
                '<span class="lg"><i class="sq s-A"></i>Absent</span>' +
                '<span class="lg"><i class="sq s-DO"></i>Day Off</span>' +
                '<span class="lg"><i class="sq s-PH"></i>Public Holiday</span>' +
                '<span class="lg"><i class="sq s-O"></i>Other status</span>' +
                '<span class="lg"><i class="sq s-NR"></i>No record</span>' +
                '<span class="lg"><i class="sq s-P iss"></i>Red outline = duplicate / Present + Absent / missing project</span>' +
                '<span class="lg-hint">Click an employee row to see every record.</span></div>';

            html += '<div class="tbl-wrap"><div class="tbl-scroll"><table class="main" id="mainTbl"><thead><tr>' +
                '<th class="l">Code</th><th class="l">Employee</th><th class="l">Pay group</th><th class="l">Attendance Matrix (' + dr.days.length + ' Days)</th>' +
                '<th>Total<br>days</th><th>Present</th><th>Absent</th><th>Day<br>Off</th><th>Public<br>Holiday</th><th>Difference</th>' +
                '<th>Records</th><th>Dup</th><th>Conflicts</th><th>No<br>Proj</th><th>Review</th></tr></thead><tbody>';

            if (!data.emps.length) {
                html += '<tr><td colspan="15" class="empty">No attendance records found for the selected filters.</td></tr>';
            }

            // Compact serialized map for instant lazy detail rendering on click
            const empDetailMap = {};
            let recUrlPrefix = '';
            try {
                recUrlPrefix = url.resolveRecord({ recordType: CFG.recordType, recordId: 1 }).replace(/([?&]id=)\d+/, '$1');
            } catch (e) {
                recUrlPrefix = '/app/common/custom/custrecordentry.nl?rectype=' + CFG.recordType + '&id=';
            }

            data.emps.forEach((emp) => {
                const flags = [];
                if (emp.issues > 0) flags.push('review'); else flags.push('clear');
                if (emp.dupRecords > 0) flags.push('dup');
                if (emp.conflictDays > 0) flags.push('conflict');
                if (emp.missingProject > 0) flags.push('noproj');
                if (emp.multiDays > 0) flags.push('multi');
                if (emp.diff > 0) flags.push('diff');
                if (emp.absent > 0) flags.push('absent');
                const search = (emp.name + ' ' + emp.code + ' ' + emp.dept + ' ' + emp.design + ' ' + emp.paygroup).toUpperCase();
                const num = (v, cls) => '<td class="n ' + cls + (v > 0 ? ' has' : ' zero') + '">' + v + '</td>';

                empDetailMap[emp.id] = {
                    name: emp.name,
                    code: emp.code,
                    paygroup: emp.paygroup,
                    months: emp.months,
                    days: emp.days.map((d) => ({
                        ds: d.ds,
                        dow: d.dow,
                        status: d.status,
                        flags: d.flags,
                        rows: d.rows.map((rw) => ({
                            id: rw.id,
                            statusNum: rw.statusNum,
                            project: rw.project,
                            hasProj: rw.hasProj,
                            dupRow: rw.dupRow,
                            noProj: rw.noProj
                        }))
                    }))
                };

                html += '<tr class="er' + (emp.issues > 0 ? ' rv' : '') + '" data-flags="' + flags.join(' ') + '" data-s="' + esc(search) + '" onclick="toggleRow(this, \'' + esc(emp.id) + '\')">' +
                    '<td class="code">' + esc(emp.code) + '</td>' +
                    '<td class="nm"><b>' + esc(emp.name) + '</b>' +
                    '<br><small>' + esc(emp.design) + ' &middot; ' + esc(emp.dept) + '</small></td>' +
                    '<td class="pgc">' + esc(emp.paygroup) + '</td>' +
                    '<td>' + buildStrip(emp) + '</td>' +
                    '<td class="n">' + emp.totalDays + '</td>' +
                    num(emp.present, 'c-pr') + num(emp.absent, 'c-ab') + num(emp.dayoff, 'c-do') + num(emp.holiday, 'c-ph') + num(emp.diff, 'c-df') +
                    '<td class="n">' + emp.records + '</td>' +
                    num(emp.dupRecords, 'c-bad') + num(emp.conflictDays, 'c-bad') + num(emp.missingProject, 'c-bad') +
                    '<td class="n">' + (emp.issues > 0 ? '<span class="rv-pill bad">' + emp.issues + ' to review</span>' : '<span class="rv-pill ok">&#10003; Clear</span>') + '</td></tr>';

                html += '<tr class="dr" id="dr_' + esc(emp.id) + '"><td colspan="15"></td></tr>';
            });

            html += '</tbody></table></div></div>';

            html += '<div class="pagination-bar" id="paginationContainer"></div>';

            html += '<div class="foot-note">Total / Present (status 1) / Absent (status 2) / Day Off (status 3) / Public Holiday (status 4) / Difference are calculated per calendar month, exactly as the monthly summary query: ' +
                'Difference = days in month - Present - Absent - Day Off - Public Holiday. ' +
                'Duplicate = same employee and date with the same project entered more than once, or more than one record on the same date with different statuses. ' +
                'Conflicts = the same employee and date has both a Present and an Absent record. ' +
                'No Proj = a Present record with no value in the project field. ' +
                'Multi-project = employees working on multiple projects on the same day.</div>';

            html += '<script>' +
                'window.EMP_DATA=' + JSON.stringify(empDetailMap) + ';' +
                'window.REC_URL_PREFIX=' + JSON.stringify(recUrlPrefix) + ';' +
                'var DAY_SHORT=["SUN","MON","TUE","WED","THU","FRI","SAT"];' +
                'var MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];' +
                'var STATUS_LABEL={P:"Present",A:"Absent",DO:"Day Off",PH:"Public Holiday",O:"Other status",NR:"No record"};' +
                'var FLAG_LABEL={dup:"Duplicate",conflict:"Present + Absent",noproj:"No Project",multi:"Multi-project"};' +
                'var curFlag="all";' +
                'var currentPage=1;' +
                'var pageSize=25;' +
                'function esc(s){return String(s===null||s===undefined?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/\'/g,"&#39;");}' +
                'function statusBadge(st){return \'<span class="bd s-\'+st+\'" title="\'+esc(STATUS_LABEL[st]||st)+\'">\'+(st==="NR"?"-":st)+\'</span>\';}' +
                'function flagChip(f){return \'<span class="fl f-\'+f+\'">\'+esc(FLAG_LABEL[f]||f)+\'</span>\';}' +
                'function rowStatusCode(n){if(n===1)return "P";if(n===2)return "A";if(n===3)return "DO";if(n===4)return "PH";return "O";}' +
                'function recordLink(id){if(!id)return "";return \'<a class="rl" href="\'+(window.REC_URL_PREFIX?window.REC_URL_PREFIX+id:"#")+\'" target="_blank">Open &#8599;</a>\';}' +
                'function renderDetailHtml(emp){' +
                '  var monthHtml="";' +
                '  (emp.months||[]).forEach(function(m){' +
                '    monthHtml += "<tr><td class=\\"c-date\\">"+esc(m.monthName)+" "+esc(m.year)+"</td>"+' +
                '      "<td class=\\"n\\">"+m.total+"</td><td class=\\"n pr\\">"+m.present+"</td><td class=\\"n ab\\">"+m.absent+"</td>"+' +
                '      "<td class=\\"n do\\">"+m.dayoff+"</td><td class=\\"n ph\\">"+m.holiday+"</td>"+' +
                '      "<td class=\\"n"+(m.diff>0?" df":"")+"\\">"+m.diff+"</td></tr>";' +
                '  });' +
                '  var rowsHtml="";' +
                '  (emp.days||[]).forEach(function(d){' +
                '    var hasIssue=d.flags&&d.flags.length>0;' +
                '    var trCls=hasIssue?"iss-row":"ok";' +
                '    var parts=(d.ds||"").split("/");' +
                '    var dayLabel=parts.length>=2?(parts[0]+" "+MONTHS[parseInt(parts[1],10)-1]):d.ds;' +
                '    var dayCell="<td class=\\"c-date\\">"+esc(dayLabel)+"</td>"+' +
                '      "<td class=\\"c-dow"+((d.dow===5||d.dow===6)?" wk":"")+"\\">"+DAY_SHORT[d.dow]+"</td>";' +
                '    if(!d.rows||!d.rows.length){' +
                '      rowsHtml += "<tr class=\\""+trCls+"\\">"+dayCell+"<td>"+statusBadge("NR")+"</td><td class=\\"muted\\">-</td><td><span class=\\"muted\\">No record</span></td><td></td></tr>";' +
                '    } else {' +
                '      d.rows.forEach(function(rw,i){' +
                '        var rowFlags="";' +
                '        if(rw.dupRow) rowFlags += flagChip("dup")+" ";' +
                '        if(rw.noProj) rowFlags += flagChip("noproj")+" ";' +
                '        if(i===0 && d.flags){' +
                '          ["conflict","multi"].forEach(function(f){if(d.flags.indexOf(f)!==-1) rowFlags += flagChip(f)+" ";});' +
                '        }' +
                '        rowsHtml += "<tr class=\\""+trCls+(rw.dupRow?" dup-row":"")+"\\">"+dayCell+' +
                '          "<td>"+statusBadge(rowStatusCode(rw.statusNum))+"</td>"+' +
                '          "<td class=\\""+(rw.hasProj?"":"miss")+"\\">"+(rw.hasProj?esc(rw.project):(rw.statusNum===1?"Not set":"-"))+"</td>"+' +
                '          "<td>"+rowFlags+"</td><td>"+recordLink(rw.id)+"</td></tr>";' +
                '      });' +
                '    }' +
                '  });' +
                '  return "<div class=\\"dwrap\\"><div class=\\"d-head\\"><div class=\\"d-title\\">"+esc(emp.name)+" <span class=\\"muted\\">("+esc(emp.code)+") &middot; "+esc(emp.paygroup)+"</span></div>"+' +
                '    "<div class=\\"d-tools\\"><label class=\\"sw\\"><input type=\\"checkbox\\" onchange=\\"toggleAllDays(this)\\"> Show all days</label></div></div>"+' +
                '    "<div class=\\"d-cols\\"><div class=\\"d-left\\"><table class=\\"dt mt\\"><thead><tr><th>Month</th><th>Total days</th><th>Present</th><th>Absent</th><th>Day Off</th><th>Holiday</th><th>Difference</th></tr></thead><tbody>"+' +
                '    (monthHtml||"<tr><td colspan=\\"7\\" class=\\"muted\\">No data</td></tr>")+"</tbody></table></div>"+' +
                '    "<div class=\\"d-right\\"><table class=\\"dt\\"><thead><tr><th>Date</th><th>Day</th><th>Status</th><th>Project</th><th>Review flags</th><th></th></tr></thead><tbody>"+' +
                '    rowsHtml+"</tbody></table></div></div></div>";' +
                '}' +
                'function setChip(btn){var cs=document.querySelectorAll("#chips .chip");for(var i=0;i<cs.length;i++){cs[i].className="chip";}btn.className="chip on";curFlag=btn.getAttribute("data-f");currentPage=1;applyFilters();}' +
                'function setChipByFlag(f){var cs=document.querySelectorAll("#chips .chip");for(var i=0;i<cs.length;i++){if(cs[i].getAttribute("data-f")===f){setChip(cs[i]);return;}}}' +
                'function setPage(p){currentPage=p;applyFilters();}' +
                'function applyFilters(){' +
                '  var q=document.getElementById("q").value.toUpperCase();' +
                '  var rows=document.querySelectorAll("#mainTbl tr.er");' +
                '  var visibleRows=[];' +
                '  for(var i=0;i<rows.length;i++){' +
                '    var r=rows[i];' +
                '    var fl=" "+r.getAttribute("data-flags")+" ";' +
                '    var okF=(curFlag==="all")||(fl.indexOf(" "+curFlag+" ")>-1);' +
                '    var okS=(q==="")||(r.getAttribute("data-s").indexOf(q)>-1);' +
                '    var show=okF&&okS;' +
                '    if(show){ visibleRows.push(r); } else { r.style.display="none"; var d=r.nextElementSibling; if(d){ d.style.display="none"; r.className=r.className.replace(" open",""); } }' +
                '  }' +
                '  var totalPages=Math.ceil(visibleRows.length/pageSize)||1;' +
                '  if(currentPage>totalPages) currentPage=1;' +
                '  var startIdx=(currentPage-1)*pageSize;' +
                '  var endIdx=startIdx+pageSize;' +
                '  for(var i=0;i<visibleRows.length;i++){' +
                '    var r=visibleRows[i];' +
                '    var d=r.nextElementSibling;' +
                '    if(i>=startIdx && i<endIdx){' +
                '      r.style.display="";' +
                '    } else {' +
                '      r.style.display="none";' +
                '      if(d && d.style.display==="table-row"){ d.style.display="none"; r.className=r.className.replace(" open",""); }' +
                '    }' +
                '  }' +
                '  renderPaginationControls(visibleRows.length,totalPages);' +
                '}' +
                'function renderPaginationControls(totalItems,totalPages){' +
                '  var container=document.getElementById("paginationContainer");' +
                '  if(!container) return;' +
                '  if(totalItems<=pageSize){ container.innerHTML=\'<span class="muted">Showing all \'+totalItems+\' employees</span>\'; return; }' +
                '  var html=\'<div class="pg-controls">\';' +
                '  html+=\'<button class="pg-btn" onclick="setPage(currentPage - 1)" \'+(currentPage===1?\'disabled\':\'\')+\'>&laquo; Prev</button>\';' +
                '  for(var p=1;p<=totalPages;p++){' +
                '    if(p===1 || p===totalPages || (p>=currentPage-2 && p<=currentPage+2)){' +
                '      html+=\'<button class="pg-btn \'+(p===currentPage?\'active\':\'\')+\'" onclick="setPage(\'+p+\')">\'+p+\'</button>\';' +
                '    } else if(p===currentPage-3 || p===currentPage+3){' +
                '      html+=\'<span class="pg-dots">...</span>\';' +
                '    }' +
                '  }' +
                '  html+=\'<button class="pg-btn" onclick="setPage(currentPage + 1)" \'+(currentPage===totalPages?\'disabled\':\'\')+\'>Next &raquo;</button>\';' +
                '  html+=\'<span class="pg-info">Page \'+currentPage+\' of \'+totalPages+\' (\'+totalItems+\' employees)</span>\';' +
                '  html+=\'</div>\';' +
                '  container.innerHTML=html;' +
                '}' +
                'window.onload=function(){applyFilters();};' +
                'function toggleRow(tr, empId){' +
                '  var d=tr.nextElementSibling;' +
                '  var open=(d.style.display==="table-row");' +
                '  d.style.display=open?"none":"table-row";' +
                '  if(open){' +
                '    tr.className=tr.className.replace(" open","");' +
                '  } else {' +
                '    tr.className+=" open";' +
                '    var td=d.firstElementChild;' +
                '    if(!td.getAttribute("data-loaded") && window.EMP_DATA && window.EMP_DATA[empId]){' +
                '      td.innerHTML=renderDetailHtml(window.EMP_DATA[empId]);' +
                '      td.setAttribute("data-loaded","1");' +
                '    }' +
                '  }' +
                '}' +
                'function toggleAllDays(cb){var w=cb;while(w&&w.className.indexOf("dwrap")===-1){w=w.parentNode;}if(w){if(cb.checked){w.className+=" showall";}else{w.className=w.className.replace(" showall","");}}}' +
                '</script>';

            return html;
        };

        /* =========================================================
           EXCEL EXPORT
        ========================================================= */
        const buildExcelHtml = (data, dr) => {
            const hS = 'background-color:#1e3a5f;color:#ffffff;font-weight:bold;border:1px solid #ffffff;text-align:center;padding:6px;';
            const cS = 'border:1px solid #cbd5e1;padding:4px;text-align:center;';
            const lS = 'border:1px solid #cbd5e1;padding:4px;text-align:left;';
            const bad = 'background-color:#fee2e2;color:#991b1b;font-weight:bold;';
            const txt = "mso-number-format:'\\@';";

            let h = '<html><head><meta charset="utf-8"></head><body>';
            h += '<table border="1"><tr><td colspan="16" style="font-weight:bold;font-size:14pt;">Daily Attendance Summary - Pre-approval Review (' +
                fmtNice(dr.start) + ' to ' + fmtNice(dr.end) + ')</td></tr></table><br>';

            h += '<table border="1"><thead><tr>' +
                ['Code', 'Employee', 'Pay Group', 'Designation', 'Department', 'Total Days', 'Present', 'Absent', 'Day Off', 'Public Holiday', 'Difference',
                    'Records', 'Duplicate Records', 'Present + Absent Days', 'Missing Project', 'Review Status']
                    .map((t) => '<th style="' + hS + '">' + t + '</th>').join('') + '</tr></thead><tbody>';
            data.emps.forEach((e) => {
                const m = (v) => '<td style="' + cS + (v > 0 ? bad : '') + '">' + v + '</td>';
                h += '<tr><td style="' + lS + txt + '">' + esc(e.code) + '</td>' +
                    '<td style="' + lS + '">' + esc(e.name) + '</td><td style="' + lS + '">' + esc(e.paygroup) + '</td>' +
                    '<td style="' + lS + '">' + esc(e.design) + '</td><td style="' + lS + '">' + esc(e.dept) + '</td>' +
                    '<td style="' + cS + '">' + e.totalDays + '</td><td style="' + cS + '">' + e.present + '</td><td style="' + cS + '">' + e.absent + '</td>' +
                    '<td style="' + cS + '">' + e.dayoff + '</td><td style="' + cS + '">' + e.holiday + '</td>' +
                    '<td style="' + cS + (e.diff > 0 ? 'background-color:#fef3c7;font-weight:bold;' : '') + '">' + e.diff + '</td>' +
                    '<td style="' + cS + '">' + e.records + '</td>' + m(e.dupRecords) + m(e.conflictDays) + m(e.missingProject) +
                    '<td style="' + cS + (e.issues > 0 ? bad : 'background-color:#dcfce7;color:#166534;font-weight:bold;') + '">' +
                    (e.issues > 0 ? 'REVIEW (' + e.issues + ')' : 'CLEAR') + '</td></tr>';
            });
            h += '</tbody></table><br><br>';

            h += '<table border="1"><thead><tr><td colspan="10" style="font-weight:bold;font-size:12pt;">Monthly summary</td></tr><tr>' +
                ['Code', 'Employee', 'Pay Group', 'Month', 'Year', 'Total Days', 'Present', 'Absent', 'Day Off', 'Public Holiday', 'Difference']
                    .map((t) => '<th style="' + hS + '">' + t + '</th>').join('') + '</tr></thead><tbody>';
            data.emps.forEach((e) => {
e.months.forEach((mo) => {
                    h += '<tr><td style="' + lS + txt + '">' + esc(e.code) + '</td><td style="' + lS + '">' + esc(e.name) + '</td>' +
                        '<td style="' + lS + '">' + esc(e.paygroup) + '</td>' +
                        '<td style="' + cS + '">' + esc(mo.monthName) + '</td><td style="' + cS + '">' + esc(mo.year) + '</td>' +
                        '<td style="' + cS + '">' + mo.total + '</td><td style="' + cS + '">' + mo.present + '</td><td style="' + cS + '">' + mo.absent + '</td>' +
                        '<td style="' + cS + '">' + mo.dayoff + '</td><td style="' + cS + '">' + mo.holiday + '</td>' +
                        '<td style="' + cS + (mo.diff > 0 ? 'background-color:#fef3c7;font-weight:bold;' : '') + '">' + mo.diff + '</td></tr>';
                });
            });
            h += '</tbody></table><br><br>';

            h += '<table border="1"><thead><tr><td colspan="6" style="font-weight:bold;font-size:12pt;">Issue list</td></tr><tr>' +
                ['Code', 'Employee', 'Date', 'Day', 'Project', 'Issue'].map((t) => '<th style="' + hS + '">' + t + '</th>').join('') +
                '</tr></thead><tbody>';
            data.emps.forEach((e) => {
                e.days.forEach((d) => {
                    if (d.flags.indexOf('dup') === -1 && d.flags.indexOf('noproj') === -1 && d.flags.indexOf('conflict') === -1) return;
                    d.rows.forEach((rw) => {
                        const iss = [];
                        if (rw.dupRow) iss.push(FLAG_LABEL.dup);
                        if (rw.noProj) iss.push(FLAG_LABEL.noproj);
                        if (d.flags.indexOf('conflict') !== -1) iss.push(FLAG_LABEL.conflict);
                        if (!iss.length) return;
                        h += '<tr><td style="' + lS + txt + '">' + esc(e.code) + '</td><td style="' + lS + '">' + esc(e.name) + '</td>' +
                            '<td style="' + cS + txt + '">' + d.ds + '</td><td style="' + cS + '">' + DAY_SHORT[d.dow] + '</td>' +
                            '<td style="' + lS + '">' + (rw.hasProj ? esc(rw.project) : 'NOT SET') + '</td>' +
                            '<td style="' + lS + bad + '">' + iss.join(', ') + '</td></tr>';
                    });
                });
            });
            h += '</tbody></table></body></html>';
            return h;
        };

        /* =========================================================
           STYLES
        ========================================================= */
        const getStyles = () => '<style>' +
            '#div__titlebar,.uir-page-title{display:none!important;}' +
            '#custpage_html_val{padding:0!important;}' +
            '.uir-content-wrapper{padding:0!important;margin:0!important;}' +
            '#main_form{margin:0!important;}' +
            'body{margin:0;font-family:"Segoe UI",Roboto,Arial,sans-serif;background:#f1f5f9;color:#0f172a;}' +
            '.mono{font-variant-numeric:tabular-nums;font-family:Consolas,Menlo,monospace;font-size:11px;}' +
            '.muted{color:#64748b;font-weight:normal;}' +

            '.topbar{background:#1e3a5f;color:#fff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #38bdf8;}' +
            '.tb-left{display:flex;align-items:center;gap:14px;}' +
            '.tb-logo{width:38px;height:38px;border-radius:10px;background:#2d4878;display:flex;align-items:center;justify-content:center;font-size:20px;color:#38bdf8;}' +
            '.tb-title{font-size:17px;font-weight:700;letter-spacing:.2px;}' +
            '.tb-sub{font-size:12px;color:#cbd5e1;margin-top:2px;}' +
            '.btn{background:#fff;color:#1e3a5f;border:1px solid #1e3a5f;padding:7px 14px;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;}' +
            '.btn:hover{background:#eff6ff;}' +
            '.btn.ghost{background:transparent;color:#fff;border-color:#5070b0;}' +
            '.btn.ghost:hover{background:#2d4878;}' +
            '.topbar{flex-wrap:wrap;gap:12px;}' +
            '.fbar{display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap;margin:0;}' +
            '.fbar label{display:flex;flex-direction:column;font-size:10.5px;color:#cbd5e1;gap:3px;font-weight:600;}' +
            '.fbar input,.fbar select{background:#2d4878;color:#fff;border:1px solid #5070b0;padding:6px 8px;border-radius:6px;font-size:12px;min-width:140px;color-scheme:dark;}' +
            '.fbar select{min-width:170px;max-width:240px;}' +
            '.btn.go{background:#38bdf8;color:#0f172a;border-color:#38bdf8;padding:8px 16px;}' +
            '.btn.go:hover{background:#7dd3fc;}' +

            '.msg-box{margin:16px 20px;padding:18px 20px;background:#fff;border:1px solid #e2e8f0;border-left:5px solid #38bdf8;border-radius:8px;font-size:13px;line-height:1.5;}' +
            '.msg-box.err{border-left-color:#ef4444;background:#fef2f2;}' +
            '.msg-box.warn{border-left-color:#f59e0b;background:#fffbeb;margin-bottom:0;}' +

            '.ready{display:flex;align-items:center;gap:16px;margin:14px 20px 0;padding:12px 18px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;font-size:13px;}' +
            '.ready-bar{flex:1;height:10px;background:#e2e8f0;border-radius:6px;overflow:hidden;}' +
            '.ready-fill{height:100%;background:linear-gradient(90deg,#22c55e,#16a34a);border-radius:6px;}' +
            '.ready-pct{font-weight:800;color:#166534;font-size:15px;min-width:42px;text-align:right;}' +

            '.toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:14px 20px 0;}' +
            '.chips{display:flex;gap:6px;flex-wrap:wrap;}' +
            '.chip{background:#fff;border:1px solid #cbd5e1;border-radius:20px;padding:6px 12px;font-size:12px;font-weight:600;color:#334155;cursor:pointer;}' +
            '.chip span{background:#e2e8f0;border-radius:10px;padding:1px 7px;margin-left:4px;font-size:11px;}' +
            '.chip.on{background:#1e3a5f;color:#fff;border-color:#1e3a5f;}.chip.on span{background:#38bdf8;color:#0f172a;}' +
            '.tools{display:flex;gap:10px;align-items:center;}' +
            '.search{position:relative;}' +
            '.search span{position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:12px;color:#94a3b8;pointer-events:none;}' +
            '.search input{padding:7px 10px 7px 30px;border:1px solid #cbd5e1;border-radius:7px;width:240px;font-size:12px;outline:none;}' +

            '.legend{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:10px 20px 0;font-size:11px;color:#475569;}' +
            '.lg-t{font-weight:700;}.lg{display:flex;align-items:center;gap:5px;}.lg-hint{margin-left:auto;color:#94a3b8;}' +

            '.tbl-wrap{margin:10px 20px 0;background:#fff;border:1px solid #e2e8f0;border-radius:10px 10px 0 0;overflow:hidden;}' +
            '.tbl-scroll{overflow:auto;max-height:68vh;}' +
            '.tbl-scroll::-webkit-scrollbar{width:10px;height:10px;}.tbl-scroll::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:5px;}' +
            'table.main{border-collapse:separate;border-spacing:0;width:100%;}' +
            'table.main thead th{position:sticky;top:0;z-index:5;background:#1e3a5f;color:#fff;font-size:10.5px;padding:9px 6px;text-align:center;border-right:1px solid #334b80;white-space:nowrap;}' +
            'table.main thead th.l{text-align:left;padding-left:10px;}' +
            'tr.er{cursor:pointer;}tr.er td{padding:8px 6px;border-bottom:1px solid #eef2f7;font-size:12px;vertical-align:middle;background:#fff;}' +
            'tr.er:hover td{background:#f8fafc;}' +
            'tr.er.rv td:first-child{box-shadow:inset 4px 0 0 #ef4444;}' +
            'tr.er.open td{background:#eff6ff;}' +
            'td.code{padding-left:12px!important;font-weight:600;color:#475569;white-space:nowrap;}' +
            'td.nm{min-width:190px;}td.nm small{color:#0056a3;font-size:10.5px;}' +
            'td.pgc{color:#475569;font-size:11px;white-space:nowrap;}' +
            'td.n{text-align:center;font-weight:700;}' +
            'td.n.zero{color:#cbd5e1;font-weight:500;}' +
            'td.c-pr.has{color:#15803d;}td.c-ab.has{color:#dc2626;}td.c-do.has{color:#0f766e;}td.c-ph.has{color:#7e22ce;}td.c-df.has{color:#b45309;background:#fffbeb!important;}' +
            'td.c-bad.has{color:#b91c1c;background:#fef2f2!important;}' +
            '.rv-pill{display:inline-block;border-radius:12px;padding:3px 9px;font-size:11px;font-weight:700;white-space:nowrap;}' +
            '.rv-pill.bad{background:#fee2e2;color:#b91c1c;}.rv-pill.ok{background:#dcfce7;color:#166534;}' +
            'td.empty{text-align:center;padding:50px!important;color:#94a3b8;}' +

            '.strip{display:flex;gap:2px;flex-wrap:nowrap;}' +
            'i.sq{display:inline-block;width:9px;height:18px;border-radius:2px;background:#e2e8f0;}' +
            'i.sq.iss{outline:2px solid #ef4444;outline-offset:-1px;}' +
            '.s-P{background:#22c55e;}.s-A{background:#ef4444;}.s-DO{background:#14b8a6;}.s-PH{background:#a855f7;}.s-O{background:#f97316;}.s-NR{background:#e2e8f0;}' +
            '.bd{display:inline-block;min-width:24px;text-align:center;border-radius:4px;padding:2px 5px;font-size:10px;font-weight:800;color:#fff;}' +
            '.bd.s-P{background:#22c55e;}.bd.s-A{background:#ef4444;}.bd.s-DO{background:#14b8a6;}.bd.s-PH{background:#a855f7;}.bd.s-O{background:#f97316;}.bd.s-NR{color:#64748b;background:#e2e8f0;}' +

            'tr.dr{display:none;}tr.dr>td{background:#f8fafc;padding:0;border-bottom:2px solid #dbe4f0;}' +
            '.dwrap{padding:12px 18px 16px 18px;}' +
            '.d-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}' +
            '.d-title{font-weight:700;font-size:13px;}' +
            '.d-cols{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;}' +
            '.d-left{flex:0 0 380px;}.d-right{flex:1;min-width:420px;}' +
            '.sw{font-size:12px;color:#334155;cursor:pointer;}.sw input{margin-right:5px;vertical-align:middle;}' +
            'table.dt{border-collapse:collapse;width:100%;background:#fff;border:1px solid #e2e8f0;}' +
            'table.dt th{background:#e8eef7;color:#1e3a5f;font-size:10.5px;padding:6px 8px;text-align:left;}' +
            'table.dt td{padding:5px 8px;border-top:1px solid #eef2f7;font-size:11.5px;}' +
            'table.dt.mt td.n{text-align:center;font-weight:700;}td.n.pr{color:#15803d;}td.n.ab{color:#dc2626;}td.n.do{color:#0f766e;}td.n.ph{color:#7e22ce;}td.n.df{color:#b45309;background:#fffbeb;}' +
            '.dwrap:not(.showall) tr.ok{display:none;}' +
            'tr.iss-row td{background:#fffbeb;}' +
            'tr.dup-row td{background:#fef2f2;}' +
            'td.c-date{font-weight:600;white-space:nowrap;}td.c-dow{color:#64748b;font-size:10px;}td.c-dow.wk{color:#2e4580;font-weight:700;}' +
            'td.miss{color:#b91c1c;font-weight:700;}' +
            '.fl{display:inline-block;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;margin-right:3px;white-space:nowrap;}' +
            '.f-dup{background:#fee2e2;color:#b91c1c;}.f-noproj{background:#fef3c7;color:#92400e;}.f-conflict{background:#ffe4e6;color:#be123c;}' +
            '.f-multi{background:#e0f2fe;color:#0369a1;}' +
            'a.rl{color:#1d4ed8;font-weight:600;text-decoration:none;font-size:11px;}a.rl:hover{text-decoration:underline;}' +

            '.pagination-bar{display:flex;justify-content:space-between;align-items:center;padding:12px 20px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;margin:0 20px 20px;}' +
            '.pg-controls{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}' +
            '.pg-btn{background:#fff;border:1px solid #cbd5e1;padding:5px 10px;border-radius:5px;font-size:12px;font-weight:600;cursor:pointer;color:#334155;}' +
            '.pg-btn:hover:not(:disabled){background:#eff6ff;border-color:#38bdf8;}' +
            '.pg-btn.active{background:#1e3a5f;color:#fff;border-color:#1e3a5f;}' +
            '.pg-btn:disabled{opacity:0.5;cursor:not-allowed;}' +
            '.pg-dots{padding:0 4px;color:#94a3b8;font-weight:bold;}' +
            '.pg-info{margin-left:15px;font-size:12px;color:#64748b;}' +

            '.foot-note{margin:12px 20px 24px;font-size:11px;color:#64748b;line-height:1.6;}' +
            '</style>';

        return { onRequest };
    }
);