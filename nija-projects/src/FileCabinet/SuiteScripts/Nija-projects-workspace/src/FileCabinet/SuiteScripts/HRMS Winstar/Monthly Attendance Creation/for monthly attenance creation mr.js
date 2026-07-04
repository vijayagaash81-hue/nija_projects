/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * @description Monthly Attendance: Hire-Date Prorated, Fast, 1000+ Employees
 * - Input: Multiple employees from Suitelet (custscript_hris_dailyemplist)
 * - Prorates based on hire date within wage period
 * - LOP: Only approved unpaid leaves overlapping with employee's effective period
 * - Present = Prorated Days - LOP
 * - Payable Days = Working Days = Present Days
 */
define(['N/record', 'N/search', 'N/log', 'N/runtime', 'N/query', 'N/format'],
function(record, search, log, runtime, query, format) {

    // ========================================================
    // GET INPUT DATA - FROM SUITELET (MULTIPLE EMPLOYEES)
    // ========================================================
    function getInputData() {
        try {
            var param = runtime.getCurrentScript().getParameter({ name: 'custscript_hris_dailyemplist1' });
            if (!param || param === '[]') {
                log.audit('No Data', 'No employees passed from Suitelet.');
                return [];
            }

            var employees = JSON.parse(param);
            log.audit('Input Received', 'Processing ' + employees.length + ' employee(s).');

            return employees.map(function(emp) {
                return {
                    employeeId: parseInt(emp.employeeId, 10),
                   monthlyAttendanceId: parseInt(emp.monthlyAttendanceId, 10) || null,
                    month: parseInt(emp.paymonth, 10),
                    yearId: parseInt(emp.payyear, 10),
                    paygroup: emp.paygroup || '',
                    subsidiaryId: parseInt(emp.subsidiary, 10) || null
                };
            });

        } catch (e) {
            log.error('getInputData Error', e.message || e);
            return [];
        }
    }

    // ========================================================
    // MAP - PROCESS ONE EMPLOYEE
    // ========================================================
    function map(context) {
        try {
            var data = JSON.parse(context.value);

            var empId      = data.employeeId;
          var monthlyAttendanceId = data.monthlyAttendanceId;
            var month      = data.month;
            var yearId     = data.yearId;
            var paygroup   = data.paygroup;
            var subId      = data.subsidiaryId;

            if (!empId || !paygroup || !subId) {
                log.debug('Skip Employee', 'Missing data - ID: ' + empId + ', Paygroup: ' + paygroup + ', Sub: ' + subId);
                return;
            }

            // === 1. GET EMPLOYEE HIRE DATE ===
            var hireDate = null;
            try {
                var empRec = record.load({
                    type: record.Type.EMPLOYEE,
                    id: empId,
                    isDynamic: false
                });
               // --- START OF NEW FILTER ---
                var empStatus = empRec.getValue({ fieldId: 'custentity_hris_empemploymentstatus' });
                if (empStatus != 1) {
                    log.audit('Skip Employee', 'ID: ' + empId + ' | Employment Status is not 1 (Current Status ID: ' + empStatus + ')');
                    return; 
                }
                var hireDateStr = empRec.getValue({ fieldId: 'hiredate' });
                if (hireDateStr) {
                    hireDate = format.parse({ value: hireDateStr, type: format.Type.DATE });
                }
            } catch (e) {
                log.error('Hire Date Load Error', 'Emp ID: ' + empId + ' | ' + (e.message || e));
            }

            if (!hireDate) {
                log.debug('No Hire Date', 'Employee ID: ' + empId + ' has no hire date. Skipping proration.');
                return;
            }

            // === 2. GET WAGE PERIOD (START, END, CYCLE DAYS) ===
            var wageSQL = '';
            wageSQL += 'SELECT custrecord_hris_start_date, ';
            wageSQL += '       custrecord_hris_end_date, ';
            wageSQL += '       custrecord_hris_wage_cycle_day_s ';
            wageSQL += 'FROM customrecord_hris_wage_period_details ';
            wageSQL += 'WHERE custrecord_hris_pay_group = ? ';
            wageSQL += '  AND isinactive = \'F\' ';
            wageSQL += '  AND custrecord_hris_month = ? ';
            wageSQL += '  AND custrecord_hris_year = ?';

            var wageResult = query.runSuiteQL({
                query: wageSQL,
                params: [paygroup, month, yearId]
            }).asMappedResults();

            if (wageResult.length === 0) {
                log.debug('No Wage Period', 'Emp: ' + empId + ' | Paygroup: ' + paygroup + ' | Month: ' + month + ' | Year: ' + yearId);
                return;
            }

            var wp = wageResult[0];
            var wageStart = format.parse({ value: wp.custrecord_hris_start_date, type: format.Type.DATE });
            var wageEnd   = format.parse({ value: wp.custrecord_hris_end_date,   type: format.Type.DATE });
            var cycleDays = parseInt(wp.custrecord_hris_wage_cycle_day_s, 10) || 0;

            if (!wageStart || !wageEnd || cycleDays <= 0) {
                log.debug('Invalid Wage Data', 'Emp: ' + empId + ' | Cycle: ' + cycleDays);
                return;
            }

            // === 3. DETERMINE EFFECTIVE PERIOD (HIRE DATE PRORATION) ===
            var effectiveStart = new Date(wageStart);
            var effectiveEnd   = new Date(wageEnd);

            // If hire date is after wage start, adjust effective start
            if (hireDate > wageStart) {
                effectiveStart = new Date(hireDate);
                log.audit('Prorated', 'Emp: ' + empId + ' | Hire: ' + format.format({value: hireDate, type: format.Type.DATE}) + 
                          ' | Effective Start: ' + format.format({value: effectiveStart, type: format.Type.DATE}));
            }

            // If hire date is after wage end, employee not eligible
            if (hireDate > wageEnd) {
                log.debug('Hire After Period', 'Emp: ' + empId + ' hired after wage end. Skipping.');
                return;
            }

            // Calculate prorated cycle days
            var totalMs = wageEnd.getTime() - wageStart.getTime();
            var effectiveMs = effectiveEnd.getTime() - effectiveStart.getTime();
            var proratedCycleDays = Math.round((effectiveMs / totalMs) * cycleDays);

            if (proratedCycleDays <= 0) {
                log.debug('Zero Prorated Days', 'Emp: ' + empId + ' | Prorated: ' + proratedCycleDays);
                return;
            }

            // === 4. GET LOP DAYS (UNPAID + APPROVED + WITHIN EFFECTIVE PERIOD) ===
            /* var lopSQL = '';
            lopSQL += 'SELECT la.custrecord_hris_lve_fromdate, ';
            lopSQL += '       la.custrecord_hris_lve_todate ';
            lopSQL += 'FROM customrecord_hris_leaveapplication la ';
            lopSQL += 'JOIN customrecord_hris_leaveconfig cfg ';
            lopSQL += '  ON la.custrecord_hris_lve_leavetype = cfg.id ';
            lopSQL += 'WHERE la.custrecord_hris_lve_employeename = ? ';
            lopSQL += '  AND la.custrecord_hris_lve_fromdate <= ? ';  // ends on or after effective start
            lopSQL += '  AND la.custrecord_hris_lve_todate   >= ? ';  // starts on or before effective end
            lopSQL += '  AND la.custrecord_hris_lve_hrmsapprovalstatus = \'2\' '; // Approved
            lopSQL += '  AND la.custrecord_hris_empapp_subsidiary = ? ';
            lopSQL += '  AND cfg.custrecord_hris_lveconfig_unpaid = \'T\''; */
          var lopSQL = '';
lopSQL += 'SELECT la.custrecord_hris_lve_fromdate, ';
lopSQL += ' la.custrecord_hris_lve_todate ';
lopSQL += 'FROM customrecord_hris_leaveapplication la ';
lopSQL += 'JOIN customrecord_hris_leaveconfig cfg ';
lopSQL += ' ON la.custrecord_hris_lve_leavetype = cfg.id ';
lopSQL += 'WHERE la.custrecord_hris_lve_employeename = ? ';
lopSQL += ' AND la.custrecord_hris_lve_fromdate <= ? '; // ends on or after effective start
lopSQL += ' AND la.custrecord_hris_lve_todate >= ? '; // starts on or before effective end
lopSQL += ' AND la.custrecord_hris_lve_hrmsapprovalstatus = \'2\' '; // Approved
lopSQL += ' AND la.custrecord_hris_empapp_subsidiary = ? ';
lopSQL += ' AND cfg.custrecord_hris_lveconfig_unpaid = \'T\' ';
lopSQL += ' AND la.isinactive = \'F\'';

            var effStartStr = format.format({ value: effectiveStart, type: format.Type.DATE });
            var effEndStr   = format.format({ value: effectiveEnd,   type: format.Type.DATE });

            var leaveResults = query.runSuiteQL({
                query: lopSQL,
                params: [empId, effEndStr, effStartStr, subId]
            }).asMappedResults();

            var lopDays = 0;
            for (var i = 0; i < leaveResults.length; i++) {
                var lv = leaveResults[i];
                var from = format.parse({ value: lv.custrecord_hris_lve_fromdate, type: format.Type.DATE });
                var to   = format.parse({ value: lv.custrecord_hris_lve_todate,   type: format.Type.DATE });

                if (!from || !to) continue;

                var leaveStart = new Date(from.getFullYear(), from.getMonth(), from.getDate());
                var leaveEnd   = new Date(to.getFullYear(),   to.getMonth(),   to.getDate());

                var overlapStart = new Date(Math.max(effectiveStart.getTime(), leaveStart.getTime()));
                var overlapEnd   = new Date(Math.min(effectiveEnd.getTime(),   leaveEnd.getTime()));

                if (overlapStart <= overlapEnd) {
                    var days = Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 86400000) + 1;
                    if (days > 0) {
                        lopDays += days;
                    }
                }
            }

            // === 5. CALCULATE PRESENT DAYS ===
            var presentDays = proratedCycleDays - lopDays;
            if (presentDays < 0) presentDays = 0;

            // Payable Days = Working Days = Present Days
            var payableDays = presentDays;
            var workingDays = presentDays;

             // === 6. LOAD RECORD USING PASSED ID (NO SEARCH) ===
            var attRec;
            if (monthlyAttendanceId && monthlyAttendanceId > 0) {
                attRec = record.load({
                    type: 'customrecord_hrms_monthlyattendance',
                    id: monthlyAttendanceId,
                    isDynamic: true
                });
                log.audit('Loaded Existing Record', 'ID: ' + monthlyAttendanceId + ' | Emp: ' + empId);
            } else {
                attRec = record.create({
                    type: 'customrecord_hrms_monthlyattendance',
                    isDynamic: true
                });
                attRec.setValue({ fieldId: 'custrecord_hrms_month_empid',      value: empId });
                attRec.setValue({ fieldId: 'custrecord_hrms_month_monthid',    value: month });
                attRec.setValue({ fieldId: 'custrecord_hrms_month_yearid',     value: yearId });
                attRec.setValue({ fieldId: 'custrecord_hrms_month_subsidiary', value: subId });
                log.audit('Created Record', 'Emp: ' + empId);
            }

            // === SET ALL VALUES ===
            attRec.setValue({ fieldId: 'custrecord_hrms_month_paygroup',        value: paygroup });
            attRec.setValue({ fieldId: 'custrecord_hrms_month_subsidiary',        value: subId });
            attRec.setValue({ fieldId: 'custrecord_hris_month_total_days',      value: cycleDays });
            attRec.setValue({ fieldId: 'custrecord_hrms_month_presentdays',     value: presentDays });
            attRec.setValue({ fieldId: 'custrecord_hrms_month_absentdays',      value: lopDays });
            attRec.setValue({ fieldId: 'custrecord_hris_month_unpaid_days',     value: lopDays });
            attRec.setValue({ fieldId: 'custrecord_hris_month_payable_days',    value: payableDays });
            attRec.setValue({ fieldId: 'custrecord_hris_month_working_days',    value: workingDays });

            var savedId = attRec.save({ ignoreMandatoryFields: false });
            log.audit('Saved Successfully', 
                'ID: ' + savedId + 
                ' | Emp: ' + empId + 
                ' | Cycle: ' + cycleDays + 
                ' | Prorated: ' + proratedCycleDays + 
                ' | LOP: ' + lopDays + 
                ' | Present/Payable: ' + presentDays
            );

        } catch (e) {
            log.error({
                title: 'Map Error - Employee ID: ' + (data ? data.employeeId : 'Unknown'),
                details: e.message || e
            });
        }
    }

    // ========================================================
    // SUMMARIZE
    // ========================================================
    function summarize(summary) {
        var processed = summary.inputSummary.count || 0;
        var errors    = summary.mapSummary.errors ? summary.mapSummary.errors.iterator().length : 0;

        log.audit('Process Complete', {
            totalProcessed: processed,
            totalErrors: errors
        });

        summary.mapSummary.errors.iterator().each(function(key, error) {
            log.error('Map Error Key: ' + key, error);
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});