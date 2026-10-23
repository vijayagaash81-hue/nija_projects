/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 *
 * Description: Scheduled script to credit leave balance for newly joined/updated employees based on leave configuration.
 * Upgraded to SuiteScript 2.1.
 */
define(['N/record', 'N/search', 'N/runtime', 'N/log', 'N/format'], (record, search, runtime, log, format) => {

    /**
     * Executes the scheduled script task.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed
     */
    const execute = (scriptContext) => {
        try {
            log.debug('execute', 'Schedule script is working');

            const currentScript = runtime.getCurrentScript();
            const empInternalId = currentScript.getParameter({
                name: 'custscript_hr21empidtocreateleaves'
            }) || currentScript.getParameter({
                name: 'custscript_hris_leavecredit_empid'
            }) || currentScript.getParameter({
                name: 'custscript_employee_id_to_create_leaves'
            });

            log.debug('empInternalId', empInternalId);

            if (!empInternalId) {
                log.error('Missing Parameter', 'custscript_hrisempidtocreateleaves parameter is missing or empty.');
                return;
            }

            const employeeData = search.lookupFields({
                type: search.Type.EMPLOYEE,
                id: empInternalId,
                columns: [
                    'hiredate',
                    'custentity_hris_empgender',
                    'custentity_emp_employee_job_status',
                    'custentity_hris_empreligion',
                    'custentity_emp_grade_',
                    'subsidiary',
                    'location',
                    'custentity_hris_empmaritalstatus',
                    'custentity_hris_empweeklyoffcriteria',
                    'custentity_hris_empomani',
                    'custentity_hris_empcategory',
                    'custentity_hris_empleaveentitlement'
                ]
            });

            if (!employeeData || !employeeData.hiredate) {
                log.error('Employee Data Error', `Could not find employee or hire date for ID: ${empInternalId}`);
                return;
            }

            let empHireDateObj = null;
            try {
                empHireDateObj = format.parse({
                    value: employeeData.hiredate,
                    type: format.Type.DATE
                });
            } catch (parseErr) {
                log.warn('format.parse failed, falling back to Date constructor', parseErr);
                empHireDateObj = new Date(employeeData.hiredate);
            }

            log.debug('empHireDateObj', empHireDateObj);

            const empGender = getLookupValue(employeeData.custentity_hris_empgender);
            log.debug('empGender', empGender);

            const emp_job_Status = getLookupValue(employeeData.custentity_emp_employee_job_status);
            log.debug('emp_job_Status', emp_job_Status);

            const emp_religion = getLookupValue(employeeData.custentity_hris_empreligion);
            log.debug('emp_religion', emp_religion);

            const emp_grade = getLookupValue(employeeData.custentity_emp_grade_);
            log.debug('emp_grade', emp_grade);

            const emp_weeklyOffCriteria = getLookupValue(employeeData.custentity_hris_empweeklyoffcriteria);
            log.debug('emp_weeklyOffCriteria', emp_weeklyOffCriteria);

            const subsidiary = getLookupValue(employeeData.subsidiary);
            log.debug('subsidiary', subsidiary);

            const locationID = getLookupValue(employeeData.location);
            log.debug('locationID', locationID);

            const maritalStatus = getLookupValue(employeeData.custentity_hris_empmaritalstatus);
            log.debug('maritalStatus', maritalStatus);

            const omani_non_Omani = getLookupValue(employeeData.custentity_hris_empomani);
            log.debug('omani_non_Omani', omani_non_Omani);

            const emp_category = getLookupValue(employeeData.custentity_hris_empcategory);
            log.debug('emp_category', emp_category);

            const leaveentitlement = getLookupValue(employeeData.custentity_hris_empleaveentitlement);
            log.audit('Leave Entitlement', leaveentitlement);

            searchLeaveCreditConfigRecords(
                empInternalId,
                empHireDateObj,
                empGender,
                emp_job_Status,
                emp_religion,
                emp_grade,
                subsidiary,
                locationID,
                maritalStatus,
                emp_weeklyOffCriteria,
                omani_non_Omani,
                emp_category,
                leaveentitlement
            );

        } catch (e) {
            log.error('Error in execute (hris_emp_leavecredit_ss)', e.message || e);
        }
    };

    /**
     * Extracts value from lookupFields result (handles array or string).
     */
    const getLookupValue = (field) => {
        if (Array.isArray(field) && field.length > 0) {
            return field[0].value;
        }
        return field || '';
    };

    /**
     * Searches leave configuration records matching employee profile and generates leave balances.
     */
    const searchLeaveCreditConfigRecords = (
        empInternalId,
        empHireDateObj,
        empGender,
        emp_job_Status,
        emp_religion,
        emp_grade,
        subsidiary,
        locationID,
        maritalStatus,
        emp_weeklyOffCriteria,
        omani_non_Omani,
        emp_category,
        leaveentitlement
    ) => {
        try {
            let finalAnnual = 0;

            const filters = [
                ['custrecord_hris_lvecfg_credit_on_joining', 'is', 'T'],
                'AND',
                ['custrecord_hris_lveconfig_empjobstatus', 'anyof', emp_job_Status],
                'AND',
                ['custrecord_hris_lveconfig_religion', 'anyof', emp_religion],
                'AND',
                ['custrecord_hris_lveconfig_grade', 'anyof', emp_grade],
                'AND',
                ['custrecord_hris_lveconf_wklyoffcriteria', 'anyof', emp_weeklyOffCriteria],
                'AND',
                ['custrecord_hris_lveconfig_maritalstatus', 'anyof', maritalStatus],
                'AND',
                ['isinactive', 'is', 'F'],
                'AND',
                ['custrecord_hris_lveconfig_gender', 'anyof', empGender],
                'AND',
                ['custrecord_hris_lvecfg_omaninonomani', 'anyof', omani_non_Omani],
                'AND',
                ['custrecord_hris_lvecfg_employee_catagory', 'anyof', emp_category],
                'AND',
                ['custrecord_hris_lvecfg_creditseqno', 'notequalto', 4],
                'AND',
                ['custrecord_hris_lveconfig_excluautobalan', 'is', 'F']
            ];

            if (leaveentitlement) {
                filters.push('AND', ['custrecord_hris_lvecfg_leaveentitlement', 'anyof', leaveentitlement]);
            }

            const columns = [
                'internalid',
                'custrecord_hris_lveconfig_rotationlve',
                'custrecord_hris_lvecfg_creditseqno',
                'custrecord_hris_lvecfg_accuralcheck'
            ];

            const searchresults = search.create({
                type: 'customrecord_hris_leaveconfig',
                filters: filters,
                columns: columns
            }).run().getRange({ start: 0, end: 1000 });

            log.debug('searching credit config', `results count: ${searchresults ? searchresults.length : 0}`);

            if (searchresults && searchresults.length > 0) {
                log.debug('Leave credit config search complete', `searchresults=${searchresults.length}`);

                for (let i = 0; i < searchresults.length; i++) {
                    const LeaveCreditId = searchresults[i].getValue({ name: 'internalid' });
                    log.debug('Leave credit config id', LeaveCreditId);

                    const Leavecreditfreq = searchresults[i].getValue({ name: 'custrecord_hris_lvecfg_creditseqno' }) || '';
                    log.debug('Leave Credit freq', Leavecreditfreq);

                    const o_leaveCreditConfig = record.load({
                        type: 'customrecord_hris_leaveconfig',
                        id: LeaveCreditId,
                        isDynamic: false
                    });

                    const leaveType = LeaveCreditId;
                    log.debug('Leave type: ', leaveType);

                    const rot_chkbx = o_leaveCreditConfig.getValue({ fieldId: 'custrecord_hris_lveconfig_rotationlve' });
                    log.debug('rot_chkbx: ', rot_chkbx);

                    const CreditFreq = o_leaveCreditConfig.getValue({ fieldId: 'custrecord_hris_lveconfig_levcreditfrqy' });
                    log.debug('Credit frequency: ', CreditFreq);

                    const CreditMonth = o_leaveCreditConfig.getValue({ fieldId: 'custrecord_hris_lvecfg_credit_month' });
                    log.debug('Credit month: ', CreditMonth);

                    const NoOfDaysCredited = parseFloat(o_leaveCreditConfig.getValue({ fieldId: 'custrecord_hris_lvecfg_noofdaysto_credit' }) || 0);
                    log.debug('No of days credited', NoOfDaysCredited);

                    const CreditOnJoining = o_leaveCreditConfig.getValue({ fieldId: 'custrecord_hris_lvecfg_credit_on_joining' });
                    log.debug('Credit on joining', CreditOnJoining);

                    const rounded_off_type = o_leaveCreditConfig.getValue({ fieldId: 'custrecord_hris_lvecfg_round_off' });
                    log.debug('Round off Type ', rounded_off_type);

                    const rounded_off_value_text = o_leaveCreditConfig.getText({ fieldId: 'custrecord_hris_lvecfg_round_off' });
                    log.debug('Round off Value text ', rounded_off_value_text);

                    const proRataCheck = o_leaveCreditConfig.getValue({ fieldId: 'custrecord_hris_lvecfg_pro_rata' });
                    const accuraldays = parseFloat(o_leaveCreditConfig.getValue({ fieldId: 'custrecord_hris_lvecfg_accuraldays' }) || 0);
                    const accuralcheck = o_leaveCreditConfig.getValue({ fieldId: 'custrecord_hris_lvecfg_accuralcheck' });

                    // CreditFreq == 3
                    if (CreditFreq == 3) {
                        log.debug('INside (CreditFreq==3)');
                        const final_days_to_credit = NoOfDaysCredited;
                        log.debug('final_days_to_credit (CreditFreq==3)', final_days_to_credit);
                        searchEmpInLeavebalance(
                            rot_chkbx,
                            empInternalId,
                            leaveType,
                            CreditFreq,
                            CreditMonth,
                            NoOfDaysCredited,
                            final_days_to_credit
                        );
                    }

                    // CreditFreq == 1 (Monthly)
                    if (CreditFreq == 1) {
                        log.debug('INside (CreditFreq==1)');
                        const date = new Date();
                        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                        const lastDayMth = parseFloat(lastDay.getDate());
                        const date_no = getdatenumber(empHireDateObj);
                        log.debug('Date Number: ', date_no);

                        const month = empHireDateObj.getMonth() + 1;
                        const year = empHireDateObj.getFullYear();
                        const month_days = getmonth_days(month, year);
                        log.debug('month_days : ', month_days);

                        let Calender_start_month = 1;
                        try {
                            const calYearLookup = search.lookupFields({
                                type: 'customrecord_hris_leave_calender_year',
                                id: 1,
                                columns: ['custrecord_hris_lvecalyr_startmth']
                            });
                            Calender_start_month = getLookupValue(calYearLookup.custrecord_hris_lvecalyr_startmth) || 1;
                        } catch (e) {
                            log.warn('Could not lookup calendar year start month, defaulting to 1', e);
                        }
                        log.debug('Calender_start_month : ', Calender_start_month);

                        const hireDATE = parseFloat(empHireDateObj.getDate());
                        log.debug('hireMonth : ', month);

                        let final_days_to_credit;
                        if (proRataCheck === true || proRataCheck === 'T') {
                            final_days_to_credit = (NoOfDaysCredited * (lastDayMth - hireDATE + 1)) / 31;
                            log.debug('Pro rata checked : calculating the leave according to pro rata', final_days_to_credit);
                        } else {
                            final_days_to_credit = NoOfDaysCredited;
                            log.debug('Pro rata NOT checked : final count = no of days credited', final_days_to_credit);
                        }

                        log.debug('final_days_to_credit ', final_days_to_credit);
                        log.debug('Creating leave balance for config type : ' + LeaveCreditId);
                        searchEmpInLeavebalance(
                            rot_chkbx,
                            empInternalId,
                            leaveType,
                            CreditFreq,
                            CreditMonth,
                            NoOfDaysCredited,
                            final_days_to_credit
                        );
                    }

                    // CreditFreq == 2 (Annual)
                    if (CreditFreq == 2) {
                        log.debug('INside (CreditFreq==2)');
                        let final_days_to_credit;

                        if (Leavecreditfreq != 3) {
                            const date_no = getdatenumber(empHireDateObj);
                            log.debug('Date Number: ', date_no);

                            const month = empHireDateObj.getMonth() + 1;
                            const year = empHireDateObj.getFullYear();
                            log.debug('aa month', month);
                            log.debug('aa year', year);
                            const month_days = getmonth_days(month, year);
                            log.debug('month_days : ', month_days);

                            let Calender_start_month = 1;
                            try {
                                const calYearLookup = search.lookupFields({
                                    type: 'customrecord_hris_leave_calender_year',
                                    id: 1,
                                    columns: ['custrecord_hris_lvecalyr_startmth']
                                });
                                Calender_start_month = getLookupValue(calYearLookup.custrecord_hris_lvecalyr_startmth) || 1;
                            } catch (e) {
                                log.warn('Could not lookup calendar year start month, defaulting to 1', e);
                            }
                            log.debug('Calender_start_month : ', Calender_start_month);

                            const hireDate = empHireDateObj;
                            const hireMonth = hireDate.getMonth() + 1;
                            log.debug('hireMonth : ', hireMonth);

                            let total_months = 0;
                            if (Calender_start_month == 1 || Calender_start_month === '01') {
                                total_months = getmonthcountforendDec(hireMonth);
                            } else if (Calender_start_month == 9 || Calender_start_month === '09') {
                                total_months = getmonthcountforendaugust(hireMonth);
                            }
                            log.debug('Total Months remaining : ', total_months);

                            const days_count = addMonths(hireDate, total_months);
                            log.debug('Days Count : ', days_count);
                            const oneDay = 24 * 60 * 60 * 1000;
                            const diffDays = Math.round(Math.abs((hireDate.getTime() - days_count.getTime()) / oneDay));
                            log.debug('diffDays : ', diffDays);

                            const No_Of_Daysin_month = parseInt(month_days, 10) - parseInt(date_no, 10);
                            log.debug('No_Of_Daysin_month : ', No_Of_Daysin_month);

                            let total_days = parseInt(No_Of_Daysin_month, 10) + parseInt(diffDays, 10) + 1;
                            log.debug('total_days : ', total_days);

                            if (total_days === 366) {
                                total_days = 365;
                            }
                            const credit_till_month = NoOfDaysCredited * parseFloat(total_days);
                            log.debug('credit_till_month : ', credit_till_month);

                            finalAnnual = parseInt(credit_till_month, 10) / 365;
                            log.debug('finalAnnual : ', finalAnnual);

                            final_days_to_credit = NoOfDaysCredited;
                        } else {
                            // Leavecreditfreq == 3 (accrual)
                            const current_date = new Date();
                            log.audit('Current Date', current_date);

                            if (accuralcheck === true || accuralcheck === 'T') {
                                const dayDifference = date_difference(current_date, empHireDateObj);
                                log.audit('Date Difference', 'The difference in days is: ' + dayDifference);
                                log.audit('accuraldays', accuraldays);
                                finalAnnual = dayDifference * (accuraldays / 30);
                                log.audit('Final Annual', finalAnnual);
                            } else {
                                finalAnnual = NoOfDaysCredited;
                            }
                        }

                        if (proRataCheck === true || proRataCheck === 'T') {
                            log.debug('Pro rata checked : calculating the leave according to pro rata');
                            final_days_to_credit = GetRoundOffvalueEmper(
                                rounded_off_type,
                                rounded_off_value_text,
                                finalAnnual
                            );
                        } else {
                            log.debug('Pro rata NOT checked : final count = no of days credited');
                            final_days_to_credit = NoOfDaysCredited;
                        }

                        log.debug('final_days_to_credit ', final_days_to_credit);
                        log.debug('Creating leave balance for config type : ' + LeaveCreditId);
                        searchEmpInLeavebalance(
                            rot_chkbx,
                            empInternalId,
                            leaveType,
                            CreditFreq,
                            CreditMonth,
                            NoOfDaysCredited,
                            final_days_to_credit
                        );
                    }

                    // CreditFreq == 4
                    if (CreditFreq == 4) {
                        log.debug('INside (CreditFreq==4)');
                        finalAnnual = NoOfDaysCredited * 4;
                    }

                    // Sick Leave
                    if (empHireDateObj) {
                        processSickLeave(
                            empInternalId,
                            empHireDateObj,
                            empGender,
                            emp_job_Status,
                            emp_grade,
                            emp_weeklyOffCriteria,
                            maritalStatus,
                            omani_non_Omani
                        );
                    }
                }
            }
        } catch (e) {
            log.error('Error in function searchLeaveCreditConfigRecords()', e.message || e);
        }
    };

    /**
     * Processes Sick Leave balance configuration (CreditSeqNo = 4).
     */
    const processSickLeave = (
        empInternalId,
        empHireDateObj,
        empGender,
        emp_job_Status,
        emp_grade,
        emp_weeklyOffCriteria,
        maritalStatus,
        omani_non_Omani
    ) => {
        try {
            const filters2 = [
                ['custrecord_hris_lvecfg_credit_on_joining', 'is', 'T'],
                'AND',
                ['custrecord_hris_lveconfig_empjobstatus', 'anyof', emp_job_Status],
                'AND',
                ['custrecord_hris_lveconfig_grade', 'anyof', emp_grade],
                'AND',
                ['custrecord_hris_lveconf_wklyoffcriteria', 'anyof', emp_weeklyOffCriteria],
                'AND',
                ['custrecord_hris_lveconfig_maritalstatus', 'anyof', maritalStatus],
                'AND',
                ['isinactive', 'is', 'F'],
                'AND',
                ['custrecord_hris_lveconfig_gender', 'anyof', empGender],
                'AND',
                ['custrecord_hris_lvecfg_omaninonomani', 'anyof', omani_non_Omani],
                'AND',
                ['custrecord_hris_lvecfg_creditseqno', 'equalto', 4]
            ];

            const columns2 = [
                search.createColumn({ name: 'internalid', sort: search.Sort.ASC }),
                'custrecord_hris_lvecfg_noofdaysto_credit'
            ];

            const searchresults2 = search.create({
                type: 'customrecord_hris_leaveconfig',
                filters: filters2,
                columns: columns2
            }).run().getRange({ start: 0, end: 1000 });

            log.debug('searchresults2 length', searchresults2 ? searchresults2.length : 0);

            const _year = parseInt(empHireDateObj.getFullYear(), 10) + 1;
            const _yearEndObj = new Date(_year, 0, 0);
            const DiffDays = DaysBetweenDates(empHireDateObj, _yearEndObj);
            log.debug('DiffDays', DiffDays);
            log.debug('_yearEndObj', _yearEndObj);
            log.debug('empHireDateObj', empHireDateObj);

            if (searchresults2 && searchresults2.length > 0) {
                let totalDaysToCredit = 0;
                for (let k = 0; k < searchresults2.length; k++) {
                    const to_be_credited_days = parseFloat(searchresults2[k].getValue({ name: 'custrecord_hris_lvecfg_noofdaysto_credit' }) || 0);
                    log.debug('to_be_credited_days:::::::::::', to_be_credited_days);
                    totalDaysToCredit += to_be_credited_days;
                    log.debug('totalDaysToCredit:::::::::::', totalDaysToCredit);
                }
                log.debug('totalDaysToCredit', totalDaysToCredit);

                let TotalDays = (totalDaysToCredit * DiffDays) / 365;
                TotalDays = parseFloat(TotalDays.toFixed(2));
                log.debug('TotalDays%%%%%%%%%%%', TotalDays);

                let credetedDays = 0;
                for (let j = 0; j < searchresults2.length; j++) {
                    const leave_type = searchresults2[j].getValue({ name: 'internalid' });
                    const dyanamic_Days = parseFloat(searchresults2[j].getValue({ name: 'custrecord_hris_lvecfg_noofdaysto_credit' }) || 0);

                    const LeaveBalSearchResults3 = search.create({
                        type: 'customrecord_hris_leavebalance',
                        filters: [
                            ['custrecord_hris_lvbal_employee_name', 'is', empInternalId],
                            'AND',
                            ['custrecord_hris_lvbal_leave_type', 'is', leave_type]
                        ],
                        columns: ['internalid']
                    }).run().getRange({ start: 0, end: 1 });

                    log.debug('LeaveBalSearchResults3 length', LeaveBalSearchResults3 ? LeaveBalSearchResults3.length : 0);

                    if (!LeaveBalSearchResults3 || LeaveBalSearchResults3.length === 0) {
                        let _days = 0;

                        if (parseFloat(credetedDays) < parseFloat(TotalDays)) {
                            const RemaingDays = parseFloat(TotalDays) - parseFloat(credetedDays);
                            if (parseFloat(RemaingDays) >= parseFloat(dyanamic_Days)) {
                                _days = parseFloat(dyanamic_Days);
                            } else {
                                _days = parseFloat(RemaingDays);
                            }
                        } else {
                            _days = 0;
                        }

                        const SL_Type = searchresults2[j].getValue({ name: 'internalid' });
                        const Rec = record.create({
                            type: 'customrecord_hris_leavebalance',
                            isDynamic: false
                        });

                        Rec.setValue({ fieldId: 'custrecord_hris_lvbal_employee_name', value: empInternalId });
                        Rec.setValue({ fieldId: 'custrecord_hris_lvbal_leave_type', value: SL_Type });
                        Rec.setValue({ fieldId: 'custrecord_hris_lvbal_annual_leave_bal', value: dyanamic_Days });
                        Rec.setValue({ fieldId: 'custrecord_hris_lvbal_leave_balance_cred', value: dyanamic_Days });
                        Rec.setValue({ fieldId: 'custrecord_hris_lvbal_leave_balance_take', value: 0 });
                        Rec.setValue({ fieldId: 'custrecord_hris_lvbal_available_leave_ba', value: dyanamic_Days });

                        const slRecId = Rec.save({ enableSourcing: false, ignoreMandatoryFields: true });
                        log.debug('Sick Leave Balance submitted', slRecId);

                        credetedDays = parseInt(credetedDays, 10) + parseInt(RoundValue(_days), 10);
                    }
                }
            }
        } catch (err) {
            log.error('Error in processSickLeave', err.message || err);
        }
    };

    /**
     * Checks if a leave balance already exists for the employee & leave type, otherwise creates it.
     */
    const searchEmpInLeavebalance = (
        rot_chkbx,
        empInternalId,
        leaveType,
        CreditFreq,
        CreditMonth,
        NoOfDaysCredited,
        final_days_to_credit
    ) => {
        log.debug('In searchEmpInLeavebalance', `empIntenalId=${empInternalId} , leaveType ${leaveType}`);

        const LeaveBalSearchResults = search.create({
            type: 'customrecord_hris_leavebalance',
            filters: [
                ['custrecord_hris_lvbal_employee_name', 'is', empInternalId],
                'AND',
                ['custrecord_hris_lvbal_leave_type', 'is', leaveType]
            ],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });

        if (!LeaveBalSearchResults || LeaveBalSearchResults.length === 0) {
            log.debug('Searching for leave balance records complete', 'No record found for given combination of employee and leave type');

            try {
                let numDaysCredited = parseFloat(NoOfDaysCredited) || 0;
                let finalDays = parseFloat(final_days_to_credit) || 0;

                if (rot_chkbx === true || rot_chkbx === 'T') {
                    numDaysCredited = 0;
                    finalDays = 0;
                }

                const LeavebalanceRec = record.create({
                    type: 'customrecord_hris_leavebalance',
                    isDynamic: false
                });

                LeavebalanceRec.setValue({
                    fieldId: 'custrecord_hris_lvbal_employee_name',
                    value: empInternalId
                });
                LeavebalanceRec.setValue({
                    fieldId: 'custrecord_hris_lvbal_leave_type',
                    value: leaveType
                });

                if (CreditFreq == 1) {
                    LeavebalanceRec.setValue({
                        fieldId: 'custrecord_hris_lvbal_annual_leave_bal',
                        value: parseFloat((numDaysCredited * 12).toFixed(2))
                    });
                } else {
                    LeavebalanceRec.setValue({
                        fieldId: 'custrecord_hris_lvbal_annual_leave_bal',
                        value: parseFloat(numDaysCredited.toFixed(2))
                    });
                }

                LeavebalanceRec.setValue({
                    fieldId: 'custrecord_hris_lvbal_leave_balance_cred',
                    value: parseFloat(finalDays.toFixed(2))
                });
                LeavebalanceRec.setValue({
                    fieldId: 'custrecord_hris_lvbal_available_leave_ba',
                    value: parseFloat(finalDays.toFixed(2))
                });
                LeavebalanceRec.setValue({
                    fieldId: 'custrecord_hris_lvbal_leave_balance_take',
                    value: 0
                });

                const leaveBalanceID = LeavebalanceRec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                log.debug('Inside searchEmpInLeavebalance', `Leave balance ID = ${leaveBalanceID}`);

            } catch (e) {
                log.error('Error occurred while creating leave balance record', e.message || e);
            }
        } else {
            log.debug('Leave balance record already present. Record ID : ' + LeaveBalSearchResults[0].id, `employee id : ${empInternalId} , Leave Type : ${leaveType}`);
        }
    };

    /**
     * Date difference in days.
     */
    const date_difference = (date1, date2) => {
        const timeDiff = Math.abs(date2.getTime() - date1.getTime());
        const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        return diffDays - 1;
    };

    /**
     * Inclusive days between dates.
     */
    const DaysBetweenDates = (val1, val2) => {
        const diffTime = Math.abs(val2.getTime() - val1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1;
    };

    /**
     * Adds specified number of months to a date.
     */
    const addMonths = (date, months) => {
        const d = new Date(date);
        d.setMonth(d.getMonth() + parseInt(months, 10));
        return d;
    };

    /**
     * Month offset for December calendar year end.
     */
    const getmonthcountforendDec = (month) => {
        const map = { 1: 11, 2: 10, 3: 9, 4: 8, 5: 7, 6: 6, 7: 5, 8: 4, 9: 3, 10: 2, 11: 1, 12: 0 };
        return map[parseInt(month, 10)] !== undefined ? map[parseInt(month, 10)] : 0;
    };

    /**
     * Month offset for August calendar year end.
     */
    const getmonthcountforendaugust = (month) => {
        const map = { 1: 7, 2: 6, 3: 5, 4: 4, 5: 3, 6: 2, 7: 1, 8: 0, 9: 11, 10: 10, 11: 9, 12: 8 };
        return map[parseInt(month, 10)] !== undefined ? map[parseInt(month, 10)] : 0;
    };

    /**
     * Total days in a month.
     */
    const getmonth_days = (wage_month, year) => {
        const m = parseInt(wage_month, 10);
        if ([1, 3, 5, 7, 8, 10, 12].includes(m)) {
            return 31;
        }
        if ([4, 6, 9, 11].includes(m)) {
            return 30;
        }
        if (m === 2) {
            const yearStr = year.toString();
            const splitYear = yearStr.split('-');
            const actualYear = parseInt(splitYear[splitYear.length - 1], 10);
            return (actualYear % 4 === 0) ? 29 : 28;
        }
        return 30;
    };

    /**
     * Extracts day number from Date.
     */
    const getdatenumber = (DOC) => {
        return DOC.getDate();
    };

    /**
     * Calculates rounded off value based on configuration.
     */
    const GetRoundOffvalueEmper = (rounded_off_type, rounded_off_value_text, finalAnnual) => {
        const final_days = parseFloat(finalAnnual) || 0;
        log.debug('GetRoundOffvalueEmper', `final_days: ${final_days}, type: ${rounded_off_type}, text: ${rounded_off_value_text}`);

        let rounded_final_value = final_days;
        const split_final_days = final_days.toString().split('.');
        const integer_no = parseInt(split_final_days[0], 10) || 0;
        const i_decimal_val = split_final_days[1] || '0';
        const compare_no = parseFloat('0.' + i_decimal_val);

        if (String(rounded_off_type) === '1') {
            // Next near
            if (rounded_off_value_text == 0.25 || rounded_off_value_text == 0.75) {
                if (compare_no > 0 && compare_no <= 0.25) {
                    rounded_final_value = integer_no + 0.25;
                } else if (compare_no > 0.25 && compare_no <= 0.5) {
                    rounded_final_value = integer_no + 0.5;
                } else if (compare_no > 0.5 && compare_no <= 0.75) {
                    rounded_final_value = integer_no + 0.75;
                } else if (compare_no > 0.75 && compare_no <= 1.0) {
                    rounded_final_value = integer_no + 1;
                } else if (compare_no === 0) {
                    rounded_final_value = integer_no + 0.0;
                }
            } else if (rounded_off_value_text == 0.5) {
                if (compare_no > 0 && compare_no <= 0.5) {
                    rounded_final_value = integer_no + 0.5;
                } else if (compare_no > 0.5 && compare_no <= 1.0) {
                    rounded_final_value = integer_no + 1;
                }
            } else if (rounded_off_value_text == 1.0) {
                if (compare_no > 0 && compare_no <= 1.0) {
                    rounded_final_value = integer_no + 1.0;
                }
            }
        } else if (String(rounded_off_type) === '2') {
            // Previous near
            if (rounded_off_value_text == 0.25 || rounded_off_value_text == 0.75) {
                if (compare_no > 0 && compare_no <= 0.25) {
                    rounded_final_value = integer_no + 0.0;
                } else if (compare_no > 0.25 && compare_no <= 0.5) {
                    rounded_final_value = integer_no + 0.25;
                } else if (compare_no > 0.5 && compare_no <= 0.75) {
                    rounded_final_value = integer_no + 0.5;
                } else if (compare_no > 0.75 && compare_no <= 1.0) {
                    rounded_final_value = integer_no + 0.75;
                } else if (compare_no === 0) {
                    rounded_final_value = integer_no + 0.0;
                }
            } else if (rounded_off_value_text === 'Nearest to 0.5' || rounded_off_value_text == 0.5) {
                if (compare_no > 0.0 && compare_no <= 0.25) {
                    rounded_final_value = integer_no + 0.0;
                } else if (compare_no > 0.25 && compare_no <= 0.5) {
                    rounded_final_value = integer_no + 0.5;
                } else if (compare_no > 0.5 && compare_no <= 0.75) {
                    rounded_final_value = integer_no + 0.5;
                } else if (compare_no > 0.75 && compare_no <= 1.0) {
                    rounded_final_value = integer_no + 1.0;
                } else if (compare_no === 0.0) {
                    rounded_final_value = integer_no + 0.0;
                }
            } else if (rounded_off_value_text == 1.0) {
                if (compare_no > 0 && compare_no <= 1.0) {
                    rounded_final_value = integer_no + 0.0;
                }
            }
        } else {
            rounded_final_value = parseFloat(final_days.toFixed(2));
        }

        log.debug('rounded_final_value', rounded_final_value);
        return rounded_final_value;
    };

    /**
     * Rounds value to nearest 0.5 or integer.
     */
    const RoundValue = (val) => {
        val = parseFloat(val) || 0;
        const integerPart = Math.trunc(val);
        const diff = val - integerPart;
        if (diff < 0.25) {
            return integerPart;
        } else if (diff >= 0.25 && diff < 0.75) {
            return integerPart + 0.5;
        } else {
            return integerPart + 1;
        }
    };

    return {
        execute
    };
});
