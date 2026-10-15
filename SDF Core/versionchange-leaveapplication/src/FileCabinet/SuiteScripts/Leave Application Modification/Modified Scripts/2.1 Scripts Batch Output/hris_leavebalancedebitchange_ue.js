/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/runtime'], (record, search, runtime) => {

    
    function LMS_LeaveBalanceDebitCredit_AfterSubmit(type) {
        if (type != 'delete') {
            log.debug({ title: 'WFH ', details: 'type --> ' + type })
            const error_message = 'Leave type is not present'
            const LeaveAppliAvailDays = 0.00;
            const TotalLeaveBalTaken = 0.00;
            const available_leave_bal = 0.00;
            const totalEncash = 0.00;
            const recordId = (scriptContext.newRecord ? scriptContext.newRecord.id : scriptContext.currentRecord.id)
            const o_leaveApp = record.load({ type: 'customrecord_hris_leaveapplication', id: recordId })
    
            const emp_Id = o_leaveApp.getFieldValue('custrecord_hris_lve_employeename')
            log.debug({ title: 'WFH ', details: 'emp_Id --> ' + emp_Id })
    
            const Leave_type = o_leaveApp.getFieldValue('custrecord_hris_lve_leavetype')
            /*const E_leavetype = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_leavetype" });
            const Leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');  */
    
            log.debug({ title: 'WFH ', details: 'Leave_type --> ' + Leave_type })
    
    
            const leaveTypeRecord = record.load({ type: 'customrecord_hris_leaveconfig', id: Leave_type });
            const unpaidCheck = leaveTypeRecord.getFieldValue('custrecord_hris_lveconfig_unpaid')
            const halfPaidCheck = leaveTypeRecord.getFieldValue('custrecord_hris_lveconfig_halfpaid')
            const considerForPayroll = leaveTypeRecord.getFieldValue('custrecord_hris_lvecnfg_considerpayroll')
            const LeaveApplication_Status = o_leaveApp.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
            log.debug({ title: 'WFH ', details: 'LeaveApplication_Status --> ' + LeaveApplication_Status })
    
            const leaveCancelStatus = o_leaveApp.getFieldValue('custrecord_hris_lve_cancel_leavestatus');
    
            const Leave_approval_Check = o_leaveApp.getFieldValue('custrecord_hris_lve_applve_approval');
    
            const cancel_check = o_leaveApp.getFieldValue('custrecord_hris_lve_cancellation');
    
            const No_of_Leave_Days = o_leaveApp.getFieldValue('custrecord_hris_lve_totalnodays');
    
            const unpaidCreated = o_leaveApp.getFieldValue('custrecord_hris_lve_unpaidentry_created')
    
            const leaveReason = o_leaveApp.getFieldValue('custrecord_hris_lve_leavereason');
    
            const workResumeChkBx = o_leaveApp.getFieldValue('custrecord_hris_lve_workresume');
    
            // added for annual leave
            const lbwholeno= o_leaveApp.getFieldValue('custrecord_hris_lve_leavebalance_wholeno');
            const lbbalance= o_leaveApp.getFieldValue('custrecord_hris_lve_leavebalance');
             log.audit({ title: 'WFH ', details: 'LeaveApplication_whole --> ',+lbwholeno });
             log.audit({ title: 'WFH ', details: 'LeaveApplication_LB --> ',+lbbalance });
            const refNumber = o_leaveApp.getFieldValue('name');
            log.debug({ title: 'refNumber', details: refNumber });
    
            const seq_no = get_sequence_no(Leave_type)
    
            const Leave_id = SearchLeaveBalanceMaster(emp_Id, Leave_type);
            log.debug({ title: 'WFH ', details: 'Leave_id --> ' + Leave_id });
    
            const isEncashAllowed = isEncashmentAllowed(Leave_type);
            log.debug({ title: 'WFH ', details: 'isEncashAllowed --> ' + isEncashAllowed });
    
            const isEncashApplied = o_leaveApp.getFieldValue('custrecord_hris_lve_applylveencashment');
            log.debug({ title: 'WFH ', details: 'isEncashApplied --> ' + isEncashApplied });
    
            const fromDate = o_leaveApp.getFieldValue('custrecord_hris_lve_fromdate');
            log.debug({ title: 'Integration fromDate', details: fromDate });
            fromDate = nlapiStringToDate(fromDate)
            const toDate = o_leaveApp.getFieldValue('custrecord_hris_lve_todate');
            log.debug({ title: 'Integration toDate', details: toDate });
            toDate = nlapiStringToDate(toDate)
    
            const search_pay_grp = get_paygroup(emp_Id);
    
    
            const lastDay_frmDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0);
            const lastDayDate_frmDate = lastDay_frmDate.getDate();
            const lastDayMonth_frmDate = lastDay_frmDate.getMonth() + 1;
            const lastDayYear_frmDate = lastDay_frmDate.getFullYear();
    
            const finalDate_frmDate = remFormatedDate(lastDayYear_frmDate, lastDayMonth_frmDate, lastDayDate_frmDate)
            if (considerForPayroll == 'T' && cancel_check == 'F' && unpaidCreated == 'F') {
    
                if (unpaidCheck || halfPaidCheck) {
    
    
    
    
                    log.debug({ title: 'Integration finalDate_frmDate', details: finalDate_frmDate })
    
                    const lastDay_toDate = new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0);
                    const lastDayDate_toDate = lastDay_toDate.getDate();
                    const lastDayMonth_toDate = lastDay_toDate.getMonth() + 1;
                    const lastDayYear_toDate = lastDay_toDate.getFullYear();
    
                    const finalDate_toDate = remFormatedDate(lastDayYear_toDate, lastDayMonth_toDate, lastDayDate_toDate)
                    log.debug({ title: 'Integration finalDate_toDate', details: finalDate_toDate })
    
                    if (cancel_check == 'F' && LeaveApplication_Status == '2') {
    
    
                        const fromDateMonth = fromDate.getMonth() + 1;
                        log.debug({ title: ' integration', details: 'fromDateMonth---> ' + fromDateMonth })
                        const fromDateYear = fromDate.getFullYear();
                        log.debug({ title: ' integration', details: 'fromDateYear---> ' + fromDateYear });
    
                        const toDateMonth = toDate.getMonth() + 1;
                        log.debug({ title: ' integration', details: 'toDateMonth---> ' + toDateMonth })
                        const toDateYear = toDate.getFullYear();
                        log.debug({ title: ' integration', details: 'toDateYear---> ' + toDateYear })
    
    
                        o_leaveApp.setFieldValue('custrecord_hris_lve_unpaidentry_created', 'T')
    
                        if (fromDateMonth != toDateMonth) {
    
                            const filter = [];
                            const column = [];
    
                            filter.push(new nlobjSearchFilter('custrecord_hris_ule_leave_reference_no', null, 'is', recordId));
                            filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    
                            column.push(new nlobjSearchColumn('internalid'))
                            const unpLeaveSearch = search.create({ type: 'customrecord_hris_unpaid_leave_entry', filters: filter, columns: column }).run();
                            if (!unpLeaveSearch) {
                                const fromDate = o_leaveApp.getFieldValue('custrecord_hris_lve_fromdate');
    
                                fromDate = nlapiStringToDate(fromDate)
    
                                const toDate = o_leaveApp.getFieldValue('custrecord_hris_lve_todate');
    
                                toDate = nlapiStringToDate(toDate)
    
                                log.debug({ title: 'Integration fromDate', details: fromDate });
                                log.debug({ title: 'Integration toDate', details: toDate });
                                const d1 = fromDate;
                                const d2 = toDate;
    
                                if (d1 > d2) {
                                    const count = monthDiff(d2, d1)
                                    count = parseFloat(count) - parseFloat(1)
                                }
                                else {
                                    const count = monthDiff(d1, d2)
                                    count = parseFloat(count) - parseFloat(1)
                                }
    
                                log.debug({ title: 'COUNT', details: count });
    
    
    
                                const lastFromDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0);
                                const lastFromDay = lastFromDate.getDate();
                                const monthFromDay = lastFromDate.getMonth() + 1;
                                const yearFromDay = lastFromDate.getFullYear();
    
                                const lastToDate = new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0);
                                const lastToDay = lastToDate.getDate();
    
                                const firstMonthDays = parseFloat(lastFromDay) - parseFloat(fromDate.getDate())
                                firstMonthDays = firstMonthDays + 1;
    
                                if (firstMonthDays) {
                                    const end_date = finalDate_frmDate;
                                    const year = lastDayYear_frmDate;
                                    const YearId = searchYear(year)
                                    const get_month = lastDayMonth_frmDate;
                                    //added by florence 
                                    get_month = gethrisMonth(get_month);
                                    log.debug({ title: 'get_month in firstMonthDays Condition', details: get_month });
                                    log.debug({ title: 'end_date in firstMonthDays Condition', details: end_date });
    
    
                                    const frmDate = nlapiDateToString(fromDate);
                                    const tDate = remFormatedDate(yearFromDay, monthFromDay, lastFromDay)
    
                                    firstMonthDays = totalDaysCalculation(frmDate, tDate, Leave_type, o_leaveApp)
                                    log.debug({ title: 'aa firstMonthDays', details: firstMonthDays });
                                    firstMonthUnpaidEntry(unpaidCheck, halfPaidCheck, refNumber, emp_Id, Leave_type, firstMonthDays, search_pay_grp, leaveReason, end_date, get_month, YearId, recordId)
                                }
    
                                const lastMonthDays = parseFloat(toDate.getDate())
    
                                if (lastMonthDays) {
                                    const end_date = finalDate_toDate;
                                    const year = lastDayYear_toDate;
    
                                    const YearId = searchYear(year)
                                    const get_month = lastDayMonth_toDate;
                                    //added by florence 
                                    get_month = gethrisMonth(get_month);
                                    log.debug({ title: 'get_month in lastMonthDays Condition', details: get_month });
                                    log.debug({ title: 'end_date in lastMonthDays Condition', details: end_date });
    
                                    const lastDayDate_toDate = '01'
    
    
                                    const toStartDate = remFormatedDate(lastDayYear_toDate, lastDayMonth_toDate, lastDayDate_toDate)
                                    log.debug({ title: 'aa toStartDate', details: toStartDate })
                                    log.debug({ title: 'aa finalDate_toDate', details: finalDate_toDate })
    
                                    finalDate_toDate = nlapiDateToString(toDate);
                                    lastMonthDays = totalDaysCalculation(toStartDate, finalDate_toDate, Leave_type, o_leaveApp)
                                    log.debug({ title: 'aa lastMonthDays', details: lastMonthDays });
                                    lastMonthUnpaidEntry(unpaidCheck, halfPaidCheck, refNumber, emp_Id, Leave_type, lastMonthDays, search_pay_grp, leaveReason, end_date, get_month, YearId, recordId)
                                }
    
                                if (count > 0 || count > '0') {
                                    log.debug({ title: 'Integration condition if(count > 0 || count > "0", details: '' })');
                                    unpaidEntryForMoreThanOneMonth(count, fromDate, unpaidCheck, halfPaidCheck, refNumber, emp_Id, Leave_type, lastMonthDays, search_pay_grp, leaveReason, get_month, YearId, recordId, o_leaveApp)
    
    
                                }
    
                            }
    
                        }
                        else {
                            const end_date = finalDate_frmDate;
                            const get_month = lastDayMonth_frmDate;
                            //added by florence 
                            get_month = gethrisMonth(get_month);
                            log.debug({ title: 'end_date in ELSE Condition', details: end_date });
                            const filter = [];
                            const column = [];
    
                            filter.push(new nlobjSearchFilter('custrecord_hris_ule_leave_reference_no', null, 'is', recordId));
                            filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    
                            column.push(new nlobjSearchColumn('internalid'))
                            const unpLeaveSearch = search.create({ type: 'customrecord_hris_unpaid_leave_entry', filters: filter, columns: column }).run();
    
                            if (!unpLeaveSearch) {
                                log.debug({ title: 'Inside !unpLeaveSearch', details: '' })
                                end_date = formatedDate(end_date);
                                log.debug({ title: 'formate end_date', details: end_date });
                                const unpLeavRecord = nlapiCreateRecord('customrecord_hris_unpaid_leave_entry');
                                unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_reference_no', recordId);
                                unpLeavRecord.setFieldValue('custrecord_hris_ule_employee_name', emp_Id);
                                unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_type', Leave_type);
                                unpLeavRecord.setFieldValue('custrecord_hris_ule_noof_days', No_of_Leave_Days);
                                unpLeavRecord.setFieldValue('custrecord_hris_ule_pay_group', search_pay_grp);
                                unpLeavRecord.setFieldValue('custrecord_hris_ule_reason', leaveReason);
                                unpLeavRecord.setFieldValue('custrecord_hris_ule_pay_date', end_date);
                                const year = lastDayYear_frmDate;
                                year = year.toString();
                                const YearId = searchYear(year);
                                log.debug({ title: 'YearId in ElSE Condition', details: YearId })
    
                                unpLeavRecord.setFieldValue('custrecord_hris_ule_month', get_month);
                                unpLeavRecord.setFieldValue('custrecord_hris_ule_year', YearId);
    
    
                                if (unpaidCheck == 'T') {
                                    unpLeavRecord.setFieldValue('custrecord_hris_ule_final_days', No_of_Leave_Days);
                                } else if (halfPaidCheck == 'T') {
                                    unpLeavRecord.setFieldValue('custrecord_hris_ule_final_days', No_of_Leave_Days / 2);
                                }
                                const createdRecordID = unpLeavRecord.save();
                                log.debug({ title: 'createdRecordID', details: createdRecordID });
    
                            }
    
                        }
    
                    }
    
    
                }
            }
    
    
            if (_Is_Valid(Leave_id)) {
    
                if (LeaveApplication_Status == '1') {
    // by florence for annual leave
    //if (seq_no != 2 && seq_no != 8 && seq_no != 13 ){
                    if (seq_no != 2 && seq_no != 8 && seq_no != 13 && seq_no !=3) {
    
                        const o_leaveBalRec = record.load({ type: 'customrecord_hris_leavebalance', id: Leave_id });
                        const available_leave_bal = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_available_leave_ba');
                        o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance', parseFloat(available_leave_bal).toFixed(2));
                        const round_available_leave_bal =  parseFloat(available_leave_bal).toFixed(2);
                        round_available_leave_bal = GetRoundOffvalue(round_available_leave_bal);
                        log.audit({ title: 'Leave Balance', details: round_available_leave_bal });
                        o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance_wholeno',  round_available_leave_bal); 
        
    
                    }
    
                }
    
    
                if (LeaveApplication_Status == '2' && Leave_approval_Check == 'F' && workResumeChkBx == 'F') {
    
                    if (seq_no == 2 || seq_no == 8||seq_no == 13) {
    
                        const o_leaveBalRec = record.load({ type: 'customrecord_hris_leavebalance', id: Leave_id });
    
                        const leave_bal_taken = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_take') || 0;
                        log.debug({ title: 'WFH ', details: 'leave_bal_taken --> ' + leave_bal_taken })
    
                        TotalLeaveBalTaken = parseFloat(leave_bal_taken) + parseFloat(No_of_Leave_Days);
    
                        o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_leave_balance_take', TotalLeaveBalTaken)
    
                        const submitLeavebalRec = o_leaveBalRec.save();
    
                        o_leaveApp.setFieldValue('custrecord_hris_lve_applve_approval', 'T');
    
                    }
    // for annual leave florence add
                  //  if (seq_no != 2 && seq_no != 8 && seq_no != 5 && seq_no !=13) {
    
                        if (seq_no != 2 && seq_no != 8 && seq_no != 5 && seq_no !=13 && seq_no !=3) {
    
                        const o_leaveBalRec = record.load({ type: 'customrecord_hris_leavebalance', id: Leave_id });
    
                        const leave_bal_taken = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_take') || 0;
                        log.debug({ title: 'wother', details: 'leave_bal_taken --> ' + leave_bal_taken })
    
                        TotalLeaveBalTaken = parseFloat(leave_bal_taken) + parseFloat(No_of_Leave_Days);
                        log.debug({ title: 'wother ', details: 'TotalLeaveBalTaken --> ' + TotalLeaveBalTaken })
    
                        const Leave_bal_credited = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_cred') || 0;
    
                        const available_leave_bal = parseFloat(Leave_bal_credited) - parseFloat(TotalLeaveBalTaken)
                        log.debug({ title: 'wother ', details: ' available_leave_bal --> ' + available_leave_bal })
    
                        o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_leave_balance_take', parseFloat(TotalLeaveBalTaken).toFixed(2))
    
                        o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_available_leave_ba', parseFloat(available_leave_bal).toFixed(2))
    
    
                        if (isEncashAllowed == 'T' && isEncashApplied == 'T') {
    
                            const total_encash_Days = o_leaveApp.getFieldValue('custrecord_hris_lve_noofencashmentdays');
                            total_encash_Days = parseFloat(total_encash_Days);
                            No_of_Leave_Days = parseFloat(No_of_Leave_Days);
    
    
                            const encash_bal = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_encashable_days')||0;
                            encash_bal = parseFloat(encash_bal);
    
                            const encash_taken = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_encashable_days_ta')||0;
                            encash_taken = parseFloat(encash_taken);
    
                            const avail_leave_bal = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_available_leave_ba');
                            avail_leave_bal = parseFloat(avail_leave_bal);
    
                            const leave_taken_bal = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_take')||0;
                            leave_taken_bal = parseFloat(leave_taken_bal);
                            log.debug({ title: 'Encashment encash_bal ', details: encash_bal });
                            log.debug({ title: 'Encashment encash_taken', details: encash_taken });
                            log.debug({ title: 'Encashment avail_leave_bal ', details: avail_leave_bal });
                            log.debug({ title: 'Encashment leave_taken_bal', details: leave_taken_bal });
                            log.debug({ title: 'Encashment total_encash_Days', details: total_encash_Days });
                          
                            if (total_encash_Days < encash_bal) {
                                const remaining_encash_bal = encash_bal - total_encash_Days;
    
                                const total_taken_encash = encash_taken + total_encash_Days;
    
                                log.debug({ title: 'Encashment part if remaining_encash_bal', details: remaining_encash_bal });
    
                                log.debug({ title: 'Encashment part if total_taken_encash', details: total_taken_encash });
    
                                o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_encashable_days', parseFloat(remaining_encash_bal).toFixed(2));
    
                                o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_encashable_days_ta', parseFloat(total_taken_encash).toFixed(2));
    
                            } else {
                                const total_taken_encash = encash_taken + total_encash_Days;
                              
                                  
    
                                const remaining_negative_encash_bal = total_encash_Days - encash_bal;
                                log.debug({ title: 'Encashment  remaining_negative_encash_bal', details: remaining_negative_encash_bal });
                             
    
                                const remaining_avail_bal = avail_leave_bal - remaining_negative_encash_bal;
                               
                             
    
                                const remaing_leave_bal_taken = leave_taken_bal + remaining_negative_encash_bal;
                               
                             
                                const negative_bal = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_additional_encasha')||0;
    
    
                                negative_bal = parseFloat(negative_bal) + parseFloat(remaining_negative_encash_bal);
    
                                log.debug({ title: 'Encashment part else remaining_avail_bal', details: remaining_avail_bal });
                                log.debug({ title: 'Encashment part else remaing_leave_bal_taken', details: remaing_leave_bal_taken });
                                log.debug({ title: 'Encashment part else total_taken_encash', details: total_taken_encash });
                                log.debug({ title: 'Encashment part else negative_bal', details: negative_bal });
    
                                o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_encashable_days', '0');
    
                                o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_encashable_days_ta', parseFloat(total_taken_encash).toFixed(2));
    
                                o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_leave_balance_take', parseFloat(remaing_leave_bal_taken).toFixed(2));
    
                                o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_available_leave_ba', parseFloat(remaining_avail_bal).toFixed(2));
    
                                o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_additional_encasha', parseFloat(negative_bal).toFixed(2));
                                available_leave_bal = remaining_avail_bal;
                            }
    
    
                        }
    
                        const submitLeavebalRec = o_leaveBalRec.save();
    
                        o_leaveApp.setFieldValue('custrecord_hris_lve_applve_approval', 'T');
    
                        o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance', parseFloat(available_leave_bal).toFixed(2))
                        const round_available_leave_bal =  parseFloat(available_leave_bal).toFixed(2);
                        round_available_leave_bal = GetRoundOffvalue(round_available_leave_bal);
                        o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance_wholeno',  round_available_leave_bal); 
        
    
    
    
    
                    }
    
                    // added by florence
                    if(seq_no==3){
                        const o_leaveBalRec = record.load({ type: 'customrecord_hris_leavebalance', id: Leave_id });
    
                        const leave_bal_taken = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_take') || 0;
                        log.debug({ title: 'wother', details: 'leave_bal_taken --> ' + leave_bal_taken })
    
                        TotalLeaveBalTaken = parseFloat(leave_bal_taken) + parseFloat(No_of_Leave_Days);
                        log.debug({ title: 'wother ', details: 'TotalLeaveBalTaken --> ' + TotalLeaveBalTaken })
    
                        const Leave_bal_credited = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_cred') || 0;
                        
                        const available_leave_bal = parseFloat(lbwholeno) - parseFloat(TotalLeaveBalTaken)
                        log.debug({ title: 'wother ', details: ' available_leave_bal --> ' + available_leave_bal })
    
                        o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_leave_balance_take', parseFloat(TotalLeaveBalTaken).toFixed(2))
    
                        o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_available_leave_ba', parseFloat(available_leave_bal).toFixed(2))
    
    
                        const submitLeavebalRec = o_leaveBalRec.save();
    
                        o_leaveApp.setFieldValue('custrecord_hris_lve_applve_approval', 'T');
    
                        o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance', parseFloat(available_leave_bal).toFixed(2))
                        const round_available_leave_bal =  parseFloat(available_leave_bal).toFixed(2);
                        round_available_leave_bal = GetRoundOffvalue(round_available_leave_bal);
                        o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance_wholeno',  round_available_leave_bal); 
        
    
                    }
    
                    if (seq_no == 5) {
                        const RECID = (scriptContext.newRecord ? scriptContext.newRecord.id : scriptContext.currentRecord.id);
                        const LeaveRECORD = record.load({ type: 'customrecord_hris_leaveapplication', id: RECID });
    
                        const total_N_days = LeaveRECORD.getFieldValue('custrecord_hris_lve_totalnodays');
                        log.debug({ title: 'total_N_days ', details: 'total_N_days #######--> ' + total_N_days })
    
                        log.debug({ title: 'WFH ', details: 'into seq no 5 ' })
    
                        const o_leaveBalRec = record.load({ type: 'customrecord_hris_leavebalance', id: Leave_id });
    
                        const AvailableBAL = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_available_leave_ba') || 0;
                        log.debug({ title: 'AvailableBAL ', details: 'AvailableBAL --> ' + AvailableBAL })
    
                        const leave_bal_taken = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_take') || 0;
                        log.debug({ title: 'leave_bal_taken ', details: 'leave_bal_taken --> ' + leave_bal_taken })
    
                        const available_leave_bal = parseFloat(AvailableBAL) - parseFloat(total_N_days)
                        log.debug({ title: 'available_leave_bal ', details: 'available_leave_bal --> ' + available_leave_bal })
    
                        const Taken_leave_bal = parseFloat(leave_bal_taken) + parseFloat(total_N_days)
                        log.debug({ title: 'Taken_leave_bal ', details: 'Taken_leave_bal --> ' + Taken_leave_bal })
    
    
    
                        o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_available_leave_ba', parseFloat(available_leave_bal).toFixed(2))
                        o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_leave_balance_take', parseFloat(Taken_leave_bal).toFixed(2))
    
                        const submitLeavebalRec = o_leaveBalRec.save();
    
                        o_leaveApp.setFieldValue('custrecord_hris_lve_applve_approval', 'T');
                        o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance', parseFloat(available_leave_bal).toFixed(2))
                        const round_available_leave_bal =  parseFloat(available_leave_bal).toFixed(2);
                        round_available_leave_bal = GetRoundOffvalue(round_available_leave_bal);
                        o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance_wholeno',  round_available_leave_bal); 
        
    
    
                    }
                }
            }
            if (_Is_in_Valid(Leave_id)) {
    
                throw error_message;
    
            }
    
    
            const RecID = (scriptContext.newRecord ? scriptContext.newRecord.id : scriptContext.currentRecord.id);
            const LeaveRecord = record.load({ type: 'customrecord_hris_leaveapplication', id: RecID })
    
            const LeaveCancelSTATUS = LeaveRecord.getFieldValue('custrecord_hris_lve_cancel_leavestatus')
            log.debug({ title: 'LeaveCancelSTATUS', details: 'LeaveCancelSTATUS --> ' + LeaveCancelSTATUS })
    
            const LeaveCancelApprovalCHECK = LeaveRecord.getFieldValue('custrecord_hris_lve_cancellve_approval')
            log.debug({ title: 'LeaveCancelApprovalCHECK', details: 'LeaveCancelApprovalCHECK --> ' + LeaveCancelApprovalCHECK })
    
            const LeaveCancellation_Status = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_cancel_leavestatus' });
            log.debug({ title: 'LeaveCancellation_Status', details: 'LeaveCancellation_Status --> ' + LeaveCancellation_Status })
    
            const Leave_cancellation_approval_Check = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_cancellve_approval' });
            log.debug({ title: 'Leave_cancellation_approval_Check', details: 'Leave_cancellation_approval_Check --> ' + Leave_cancellation_approval_Check })
    // By florence
           if (LeaveApplication_Status == '2' && LeaveCancellation_Status == '1') {
           // if (LeaveApplication_Status == '2' ) {
                const o_leaveBalRec = record.load({ type: 'customrecord_hris_leavebalance', id: Leave_id });
                const available_leave_bal = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_available_leave_ba');
                o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance', parseFloat(available_leave_bal).toFixed(2))
                const round_available_leave_bal =  parseFloat(available_leave_bal).toFixed(2);
                round_available_leave_bal = GetRoundOffvalue(round_available_leave_bal);
                o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance_wholeno',  round_available_leave_bal); 
    
            }
            //by florenc
            if (workResumeChkBx == 'F' && LeaveCancellation_Status == '2' && Leave_cancellation_approval_Check == 'F' || LeaveCancelSTATUS == '2' && LeaveCancelApprovalCHECK == 'F') {
               // if (workResumeChkBx == 'F'  && Leave_cancellation_approval_Check == 'F' || LeaveCancelApprovalCHECK == 'F') {    
                log.debug({ title: 'LeaveCancellation_Status', details: 'into correct condition of cancel leave' })
                if (seq_no == 2 || seq_no == 8 || seq_no ==13) {
    
                    const o_leaveBalRec = record.load({ type: 'customrecord_hris_leavebalance', id: Leave_id });
    
                    const leave_bal_taken = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_take') || 0;
                    log.debug({ title: 'WFH ', details: 'leave_bal_taken --> ' + leave_bal_taken })
                    TotalLeaveBalTaken = parseFloat(leave_bal_taken) - parseFloat(No_of_Leave_Days);
                    log.debug({ title: 'WFH ', details: 'TotalLeaveBalTaken --> ' + TotalLeaveBalTaken })
                    o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_leave_balance_take', TotalLeaveBalTaken)
    
                    const submitLeavebalRec = o_leaveBalRec.save();
    
                    o_leaveApp.setFieldValue('custrecord_hris_lve_cancellve_approval', 'T');
                }
    
                if (seq_no != 2 && seq_no != 8 && seq_no !=13) {
                    log.debug({ title: 'LeaveCancellation_Status', details: 'into correct condition of cancel leave not equal to 2 and 8' })
                    const o_leaveBalRec = record.load({ type: 'customrecord_hris_leavebalance', id: Leave_id });
                    const leave_bal_taken = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_take') || 0;
                    TotalLeaveBalTaken = parseFloat(leave_bal_taken) - parseFloat(No_of_Leave_Days);
                    const Leave_bal_credited = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_cred') || 0;
                    const available_leave_bal = parseFloat(Leave_bal_credited) - parseFloat(TotalLeaveBalTaken)
                    o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_leave_balance_take', parseFloat(TotalLeaveBalTaken).toFixed(2))
                    o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_available_leave_ba', parseFloat(available_leave_bal).toFixed(2))
                    const b_leaveEnchashment = o_leaveApp.getFieldValue("custrecord_hris_lve_applylveencashment");
                    log.debug({ title: "b_leaveEnchashment", details: b_leaveEnchashment });
                    //by florence
                    if (b_leaveEnchashment == "T" && LeaveCancelSTATUS == '2') {
                        //if (b_leaveEnchashment == "T" ) {   
                        const i_noOfLeaveEnchashed = o_leaveApp.getFieldValue("custrecord_hris_lve_noofencashmentdays");
                        if (i_noOfLeaveEnchashed) {
                            i_noOfLeaveEnchashed = parseFloat(i_noOfLeaveEnchashed);
                        } else {
                            i_noOfLeaveEnchashed = 0
                        }
                        log.debug({ title: "i_noOfLeaveEnchashed", details: i_noOfLeaveEnchashed })
                        if (TotalLeaveBalTaken) {
                            TotalLeaveBalTaken = parseFloat(TotalLeaveBalTaken);
                        } else {
                            TotalLeaveBalTaken = 0
                        }
    
                        if (Leave_bal_credited) {
                            Leave_bal_credited = parseFloat(Leave_bal_credited);
                        } else {
                            Leave_bal_credited = 0
                        }
    
                        TotalLeaveBalTaken = parseFloat(TotalLeaveBalTaken) - parseFloat(i_noOfLeaveEnchashed);
                        log.debug({ title: "TotalLeaveBalTaken", details: TotalLeaveBalTaken })
                        const total_available_leave_bal = parseFloat(Leave_bal_credited) - parseFloat(TotalLeaveBalTaken);
                        log.debug({ title: "total_available_leave_bal", details: total_available_leave_bal })
                        const i_encashDaysTaken = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_encashable_days_ta');
                        if (i_encashDaysTaken) {
                            i_encashDaysTaken = parseFloat(i_encashDaysTaken);
                        } else {
                            i_encashDaysTaken = 0
                        }
    
                        const i_additionalEncashment = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_additional_encasha');
                        if (i_additionalEncashment) {
                            i_additionalEncashment = parseFloat(i_additionalEncashment);
                        } else {
                            i_additionalEncashment = 0
                        }
                        const remainEncashmentDays = parseFloat(i_encashDaysTaken) - parseFloat(i_noOfLeaveEnchashed);
                        const remainAdditionalEncashmentDays = parseFloat(i_additionalEncashment) - parseFloat(i_noOfLeaveEnchashed)
                        o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_additional_encasha', parseFloat(remainAdditionalEncashmentDays).toFixed(2))
                        o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_encashable_days_ta', parseFloat(remainEncashmentDays).toFixed(2))
                        o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_leave_balance_take', parseFloat(TotalLeaveBalTaken).toFixed(2))
                        o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_available_leave_ba', parseFloat(total_available_leave_bal).toFixed(2))
                        available_leave_bal = total_available_leave_bal;
                        log.debug({ title: "available_leave_bal", details: available_leave_bal })
                    }
                    const submitLeavebalRec = o_leaveBalRec.save();
                    o_leaveApp.setFieldValue('custrecord_hris_lve_cancellve_approval', 'T');
                    o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance', parseFloat(available_leave_bal).toFixed(2));
                    const round_available_leave_bal =  parseFloat(available_leave_bal).toFixed(2);
                    round_available_leave_bal = GetRoundOffvalue(round_available_leave_bal);
                    o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance_wholeno',  round_available_leave_bal); 
    
    
    
    
                }
    
            }
    // by florence
           if (LeaveCancellation_Status == '3' && Leave_cancellation_approval_Check == 'F') {
            
             //   if (Leave_cancellation_approval_Check == 'F') {    
                o_leaveApp.setFieldValue('custrecord_hris_lve_cancellve_approval', 'T');
            }
    
            const leave_Encash_status = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_encashstatus' });
            const Leave_encashment_approval_Check = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_encash_approval' });
            //by florence for encashment early approval
            //if (leave_Encash_status == '2' && Leave_encashment_approval_Check == 'F' && workResumeChkBx == 'F') {
                
                if (LeaveApplication_Status == '2' && leave_Encash_status == '2' && Leave_encashment_approval_Check == 'F' && workResumeChkBx == 'F') {
             
                //   if (Leave_encashment_approval_Check == 'F' && workResumeChkBx == 'F') {   
                const Leave_id = SearchLeaveBalanceMaster(emp_Id, Leave_type);
    
                const o_leaveBalRec = record.load({ type: 'customrecord_hris_leavebalance', id: Leave_id });
                const Encash_bal = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_encashable_days');
                const EncashDays = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_noofencashmentdays' });
                totalEncash = parseFloat(Encash_bal) - parseFloat(EncashDays)
                o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_encashable_days', totalEncash)
                const submitLeavebalRec = o_leaveBalRec.save();
                log.debug({ title: 'after Submit', details: 'submitLeavebalRec=' + submitLeavebalRec });
                o_leaveApp.setFieldValue('custrecord_hris_lve_encash_approval', 'T')
                o_leaveApp.setFieldValue('custrecord_hris_lve_encashmentlevbalance', totalEncash);
            }
            o_leaveApp.save();
        }
    }
    
    function SearchLeaveBalanceMaster(emp_Id, Leave_type) {
        log.debug({ title: 'WFH ', details: 'emp_Id --> ' + emp_Id })
    
        log.debug({ title: 'WFH ', details: 'Leave_type --> ' + Leave_type })
    
        const LeaveType_id;
        const Filters = new Array();
        Filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', emp_Id));
        Filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', Leave_type));
        const Column = new Array();
        Column.push(new nlobjSearchColumn('internalid'));
    
        const LeaveBalanceSearchResult = search.create({ type: 'customrecord_hris_leavebalance', filters: Filters, columns: Column }).run();
        if (LeaveBalanceSearchResult != null) {
            LeaveType_id = LeaveBalanceSearchResult[0].getValue('internalid');
            log.debug({ title: 'WFH ', details: 'LeaveType_id --> ' + LeaveType_id })
        }
        return LeaveType_id;
    }
    
    
    
    
    function get_sequence_no(leave_type) {
        const sequence_no = ''
        const filters = new Array();
        const columns = new Array();
    
        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
        //  filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type))
        columns.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_seqno'));
    
        const compoff_record_result = search.create({ type: 'customrecord_hris_leaveconfig', filters: filters, columns: columns }).run();
    
        if (compoff_record_result != null) {
    
            sequence_no = compoff_record_result[0].getValue('custrecord_hris_lvecnfg_seqno')
    
            log.debug({ title: 'WFH ', details: 'sequence_no --> ' + sequence_no })
        }
        return sequence_no;
    }
    
    
    function get_paygroup(employee_id) {
        const filters = new Array();
        const columns = new Array();
        filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_id));
        filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
        columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))
    
        const result = search.create({ type: 'customrecord_hris_employee_compen_change', filters: filters, columns: columns }).run()
    
        if (result != null) {
            const paygroup = result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp')
        }
        return paygroup;
    }
    
    
    function get_wagedetails(search_pay_grp) {
        const filters = new Array();
        const columns = new Array();
        filters.push(new nlobjSearchFilter('custrecord_hris_pay_group', null, 'is', search_pay_grp))
        filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    
        columns.push(new nlobjSearchColumn('custrecord_hris_end_date'))
        columns.push(new nlobjSearchColumn('custrecord_hris_start_date'))
        columns.push(new nlobjSearchColumn('internalid'));
        columns.push(columns[2].setSort(true));
    
    
        const result = search.create({ type: 'customrecord_hris_wage_period_details', filters: filters, columns: columns }).run()
    
        if (result != null) {
            const end_date = result[0].getValue('custrecord_hris_end_date')
    
            const start_date = result[0].getValue('custrecord_hris_start_date')
        }
        return end_date + "#" + start_date;
    }
    
    
    function firstMonthUnpaidEntry(unpaidCheck, halfPaidCheck, refNumber, emp_Id, Leave_type, firstMonthDays, search_pay_grp, leaveReason, end_date, get_month, YearId, recordId) {
    
        const end_date = formatedDate(end_date);
        const unpLeavRecord = nlapiCreateRecord('customrecord_hris_unpaid_leave_entry');
        unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_reference_no', recordId);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_employee_name', emp_Id);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_type', Leave_type);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_noof_days', firstMonthDays);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_pay_group', search_pay_grp);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_reason', leaveReason);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_pay_date', end_date);
    
    
    
        unpLeavRecord.setFieldValue('custrecord_hris_ule_month', get_month);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_year', YearId);
    
    
        if (unpaidCheck == 'T') {
            unpLeavRecord.setFieldValue('custrecord_hris_ule_final_days', firstMonthDays);
        } else if (halfPaidCheck == 'T') {
            unpLeavRecord.setFieldValue('custrecord_hris_ule_final_days', firstMonthDays / 2);
        }
        const createdRecordID = unpLeavRecord.save();
        log.debug({ title: 'Unpaid Leave Entry First Month', details: createdRecordID });
    
    
    
    
    }
    
    
    function lastMonthUnpaidEntry(unpaidCheck, halfPaidCheck, refNumber, emp_Id, Leave_type, lastMonthDays, search_pay_grp, leaveReason, end_date, get_month, YearId, recordId) {
        const end_date = formatedDate(end_date);
        const unpLeavRecord = nlapiCreateRecord('customrecord_hris_unpaid_leave_entry');
        unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_reference_no', recordId);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_employee_name', emp_Id);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_type', Leave_type);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_noof_days', lastMonthDays);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_pay_group', search_pay_grp);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_reason', leaveReason);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_pay_date', end_date);
    
    
    
        unpLeavRecord.setFieldValue('custrecord_hris_ule_month', get_month);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_year', YearId);
    
    
    
        if (unpaidCheck == 'T') {
            unpLeavRecord.setFieldValue('custrecord_hris_ule_final_days', lastMonthDays);
        } else if (halfPaidCheck == 'T') {
            unpLeavRecord.setFieldValue('custrecord_hris_ule_final_days', lastMonthDays / 2);
        }
        const createdRecordID = unpLeavRecord.save();
        log.debug({ title: 'Unpaid Leave Entry Last Month', details: createdRecordID });
    
    
    
    }
    
    function unpaidEntryForMoreThanOneMonth(count, fromDate, unpaidCheck, halfPaidCheck, refNumber, emp_Id, Leave_type, lastMonthDays, search_pay_grp, leaveReason, get_month, YearId, recordId, o_leaveApp) {
        const count = count;
        log.debug({ title: 'Intgration refNumber', details: refNumber });
        for (const index = '0'; index < count; index++) {
    
            const remainMonth = new Date(fromDate.getFullYear(), fromDate.getMonth() + parseFloat(index) + 2, 0);
            const remainMonth_year = remainMonth.getFullYear();
            const remainMonth_month = remainMonth.getMonth() + 1;
            const lastdayOfEachMonth = remainMonth.getDate();
            const finalDate_toDate = remFormatedDate(remainMonth_year, remainMonth_month, lastdayOfEachMonth)
            const firstDaysOfEachMonth = '01'
            const finalDate_fromDate = remFormatedDate(remainMonth_year, remainMonth_month, firstDaysOfEachMonth)
            const totalPeriodDays = totalDaysCalculation(finalDate_fromDate, finalDate_toDate, Leave_type, o_leaveApp)
    
            log.debug({ title: 'Intgration finalDate_toDate', details: finalDate_toDate });
            const unpLeavRecord = nlapiCreateRecord('customrecord_hris_unpaid_leave_entry');
            unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_reference_no', recordId);
            unpLeavRecord.setFieldValue('custrecord_hris_ule_employee_name', emp_Id);
            unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_type', Leave_type);
            unpLeavRecord.setFieldValue('custrecord_hris_ule_noof_days', totalPeriodDays);
            unpLeavRecord.setFieldValue('custrecord_hris_ule_pay_group', search_pay_grp);
            unpLeavRecord.setFieldValue('custrecord_hris_ule_reason', leaveReason);
            unpLeavRecord.setFieldValue('custrecord_hris_ule_pay_date', finalDate_toDate);
    
    
    
    
    
    
            const year = remainMonth_year;
            const YearId = searchYear(year);
            log.debug({ title: 'Integration YearId inside unpaidEntryForMoreThanOneMonth', details: YearId })
    
    
    
            unpLeavRecord.setFieldValue('custrecord_hris_ule_month', remainMonth_month);
            unpLeavRecord.setFieldValue('custrecord_hris_ule_year', YearId);
    
    
            if (unpaidCheck == 'T') {
                unpLeavRecord.setFieldValue('custrecord_hris_ule_final_days', totalPeriodDays);
            } else if (halfPaidCheck == 'T') {
                unpLeavRecord.setFieldValue('custrecord_hris_ule_final_days', totalPeriodDays / 2);
            }
            const createdRecordID = unpLeavRecord.save();
            log.debug({ title: 'Unpaid Leave Entry For Middle Months', details: createdRecordID });
    
        }
    
    }
    
    
    function totalDaysCalculation(fromDate, toDate, leave_type, o_leaveApp) {
        log.debug({ title: 'fromDate totalDaysCalculation', details: fromDate });
        log.debug({ title: 'toDate totalDaysCalculation', details: toDate });
        const datediff = 0;
        const FrmDt;
        const ToDt;
    
        const fromDate = fromDate;
        frmhalfDay = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');
        const toDate = toDate;
        toHalfDay = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');
    
        {
    
            fromDate = nlapiStringToDate(fromDate);
    
            const FrmMonth = fromDate.getMonth() + 1;
    
            FrmDt = fromDate.getDate();
    
    
    
            toDate = nlapiStringToDate(toDate);
    
            const TOMonth = toDate.getMonth() + 1;
    
            ToDt = toDate.getDate();
    
    
    
    
    
            const getUserId = o_leaveApp.getFieldValue('custrecord_hris_lve_employeename');
            const weeklyoffIncCheck = weeklyOffInclude(leave_type);
            const holiday_TF_check = holidayInclude(leave_type)
            const empWeeklyoff = searchEmpsWeeklyOff(getUserId);
            const WEEKLYOFF = empWeeklyoff.split('#')
            const WeeklyOfCount = WEEKLYOFF[0]
    
            const WeeklyOffInW = WEEKLYOFF[1];
    
    
    
            if (WeeklyOfCount == 2 || WeeklyOfCount == 1) {
    
                const finalWeeklyOff = WeeklyOffInW.split(',');
                const firstWeeklyOffD = finalWeeklyOff[0];
                const secWeeklyOffD = finalWeeklyOff[1];
    
                if (FrmMonth == TOMonth) {
                    if (weeklyoffIncCheck == 'T') {
    
    
                        const frm_halfday = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');
                        const to_halfday = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');
    
                        if (frm_halfday == 'T' || to_halfday == 'T') {
                            if (holiday_TF_check == 'T') {
    
    
                                datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 0.5;
    
    
                            }
                            if (holiday_TF_check == 'F') {
                                const holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                                datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 0.5;
                                datediff = datediff - parseFloat(holiday_count);
                            }
                        }
                        if (frm_halfday == 'T' && to_halfday == 'T') {
                            if (holiday_TF_check == 'T') {
                                datediff = parseFloat(ToDt) - parseFloat(FrmDt);
    
                            }
                            if (holiday_TF_check == 'F') {
                                const holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                                datediff = parseFloat(ToDt) - parseFloat(FrmDt);
                                datediff = parseFloat(datediff) - parseFloat(holiday_count);
                            }
                        }
                        if (frm_halfday == 'F' && to_halfday == 'F') {
    
    
                            if (holiday_TF_check == 'T') {
                                log.debug({ title: 'bb fromDate', details: fromDate })
                                log.debug({ title: 'bb toDate', details: toDate })
                                const datediff = parseFloat(toDate.getDate()) - parseFloat(fromDate.getDate());
    
                                datediff = datediff + 1;
    
                                log.debug({ title: 'bb diffDays', details: datediff })
    
    
    
                            }
                            if (holiday_TF_check == 'F') {
                                const holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                                if (holiday_count == 0) {
                                    datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                } else {
                                    datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(holiday_count) + 1;
                                }
                            }
                        }
    
                    } else {
                        const frm_halfday = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');
                        const to_halfday = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');
    
                        if (frm_halfday == 'T' || to_halfday == 'T') {
                            if (holiday_TF_check == 'T') {
                                const frm_date_val = fromDate;
                                const to_date_val = toDate;
    
    
                                const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                const date_split = frm_date_val_obj.toString().split(' ');
                                const day = date_split[0];
                                const frm_week_day = WeeklyOff(day)
                                const to_date_val_obj = nlapiStringToDate(to_date_val)
                                const date_split1 = to_date_val_obj.toString().split(' ');
                                const day1 = date_split1[0];
                                const to_week_day = WeeklyOff(day1)
    
                                const get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                                const tot_days_count = get_all_dates.length;
                                const day_split = get_all_dates.toString().split(',')
                                const flag = 0;
                                for (const j = 0; j < tot_days_count; j++) {
                                    const one_by_one_day = day_split[j]
                                    if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                        flag = flag + 1;
                                    }
    
                                }
    
                                if (flag == '0') {
                                    datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 0.5;
                                }
    
                                if (flag == '1') {
                                    const final_flag = parseFloat(flag) * 1
                                    datediff = parseFloat(ToDt) - parseFloat(FrmDt);
    
                                    datediff = parseFloat(datediff) - parseFloat(final_flag) + 0.5
                                }
                                if (flag == '2') {
                                    const final_flag = parseFloat(flag) * 1
                                    datediff = parseFloat(ToDt) - parseFloat(FrmDt);
                                    datediff = parseFloat(datediff) - parseFloat(final_flag) + 0.5
                                }
                            }
                            if (holiday_TF_check == 'F') {
    
                                const holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
    
                                const frm_date_val = fromDate;
                                const to_date_val = toDate;
    
                                const frm_date_val_obj = nlapiStringToDate(frm_date_val)
    
                                const date_split = frm_date_val_obj.toString().split(' ');
                                const day = date_split[0];
                                const frm_week_day = WeeklyOff(day)
                                const to_date_val_obj = nlapiStringToDate(to_date_val)
                                const date_split1 = to_date_val_obj.toString().split(' ');
    
                                const day1 = date_split1[0];
                                const to_week_day = WeeklyOff(day1)
    
                                const get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                                const tot_days_count = get_all_dates.length;
                                const day_split = get_all_dates.toString().split(',')
                                const flag = 0;
                                for (const j = 0; j < tot_days_count; j++) {
                                    const one_by_one_day = day_split[j]
                                    if (one_by_one_day == '0' || one_by_one_day == '7') {
                                        flag = flag + 1;
                                    }
    
                                }
                                if (flag == '0') {
                                    if (holiday_count == 0) {
    
                                        datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                        datediff = parseFloat(datediff) / 2;
                                    } else {
                                        datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 0.5;
                                        datediff = datediff - parseFloat(holiday_count);
                                    }
                                }
                                if (flag == '1') {
                                    if (holiday_count == 0) {
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(final_flag);
                                        datediff = parseFloat(datediff) + 0.5;
                                    } else {
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(final_flag);
                                        datediff = parseFloat(datediff) - parseFloat(holiday_count) + 0.5;
                                    }
                                }
                                if (flag == '2') {
                                    if (holiday_count == 0) {
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(final_flag);
                                        datediff = parseFloat(datediff) + 0.5;
                                    } else {
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(final_flag);
                                        datediff = parseFloat(datediff) - parseFloat(holiday_count) + 0.5;
                                    }
                                }
                            }
                        }
                        if (frm_halfday == 'T' && to_halfday == 'T') {
    
                            if (holiday_TF_check == 'T') {
                                const frm_date_val = fromDate;
                                const to_date_val = toDate;
    
    
                                const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                const date_split = frm_date_val_obj.toString().split(' ');
                                const day = date_split[0];
                                const frm_week_day = WeeklyOff(day)
                                const to_date_val_obj = nlapiStringToDate(to_date_val)
                                const date_split1 = to_date_val_obj.toString().split(' ');
                                const day1 = date_split1[0];
                                const to_week_day = WeeklyOff(day1)
    
                                const get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                                const tot_days_count = get_all_dates.length;
                                const day_split = get_all_dates.toString().split(',')
                                const flag = 0;
                                for (const j = 0; j < tot_days_count; j++) {
                                    const one_by_one_day = day_split[j]
                                    if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                        flag = flag + 1;
                                    }
    
                                }
    
                                if (flag == '0') {
                                    datediff = parseFloat(ToDt) - parseFloat(FrmDt);
                                }
    
                                if (flag == '1') {
                                    const final_flag = parseFloat(flag) * 1
    
                                    datediff = parseFloat(ToDt) - parseFloat(FrmDt);
                                    datediff = parseFloat(datediff) - parseFloat(final_flag);
                                }
                                if (flag == '2') {
                                    const final_flag = parseFloat(flag) * 1
    
                                    datediff = parseFloat(ToDt) - parseFloat(FrmDt);
                                    datediff = parseFloat(datediff) - parseFloat(final_flag);
    
                                }
                            }
                            if (holiday_TF_check == 'F') {
    
                                const holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                                const frm_date_val = fromDate;
                                const to_date_val = toDate;
    
                                const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                const date_split = frm_date_val_obj.toString().split(' ');
                                const day = date_split[0];
                                const frm_week_day = WeeklyOff(day)
                                const to_date_val_obj = nlapiStringToDate(to_date_val)
                                const date_split1 = to_date_val_obj.toString().split(' ');
                                const day1 = date_split1[0];
                                const to_week_day = WeeklyOff(day1)
    
                                const get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                                const tot_days_count = get_all_dates.length;
                                const day_split = get_all_dates.toString().split(',')
                                const flag = 0;
                                for (const j = 0; j < tot_days_count; j++) {
                                    const one_by_one_day = day_split[j]
                                    if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                        flag = flag + 1;
                                    }
    
                                }
                                if (flag == '0') {
                                    if (holiday_count == 0) {
                                        datediff = parseFloat(ToDt) - parseFloat(FrmDt);
                                    } else {
                                        datediff = parseFloat(ToDt) - parseFloat(FrmDt);
                                        datediff = parseFloat(datediff) - parseFloat(holiday_count);
    
                                    }
                                }
                                if (flag == '1') {
                                    if (holiday_count == 0) {
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(final_flag);
                                    } else {
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(final_flag);
                                        datediff = parseFloat(datediff) - parseFloat(holiday_count);
                                    }
                                }
                                if (flag == '2') {
                                    if (holiday_count == 0) {
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(final_flag);
                                    } else {
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(final_flag);
                                        datediff = parseFloat(datediff) - parseFloat(holiday_count);
                                    }
                                }
    
                            }
    
                        }
                        if (frm_halfday == 'F' && to_halfday == 'F') {
                            if (holiday_TF_check == 'T') {
    
                                const frm_date_val = fromDate;
                                const to_date_val = toDate;
                                const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                const date_split = frm_date_val_obj.toString().split(' ');
                                const day = date_split[0];
                                const frm_week_day = WeeklyOff(day)
                                const to_date_val_obj = nlapiStringToDate(to_date_val)
                                const date_split1 = to_date_val_obj.toString().split(' ');
                                const day1 = date_split1[0];
                                const to_week_day = WeeklyOff(day1)
                                const get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                                const tot_days_count = get_all_dates.length;
                                const day_split = get_all_dates.toString().split(',')
                                const flag = 0;
                                for (const j = 0; j < tot_days_count; j++) {
    
                                    const one_by_one_day = day_split[j]
                                    if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                        flag = flag + 1;
                                    }
    
                                }
                                if (flag == '0') {
                                    datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                }
                                if (flag == '1') {
                                    const final_flag = parseFloat(flag) * 1
                                    datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                }
                                if (flag == '2') {
                                    const final_flag = parseFloat(flag) * 1
                                    datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                }
                                if (flag > '2') {
                                    const final_flag = parseFloat(flag) * 1
                                    datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                }
                            }
                            if (holiday_TF_check == 'F') {
    
                                const holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                                log.debug({ title: 'aa holiday_count', details: holiday_count });
    
                                const frm_date_val = fromDate;
                                const to_date_val = toDate;
    
                                const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                const date_split = frm_date_val_obj.toString().split(' ');
                                const day = date_split[0];
                                const frm_week_day = WeeklyOff(day)
    
                                const to_date_val_obj = nlapiStringToDate(to_date_val)
                                const date_split1 = to_date_val_obj.toString().split(' ');
                                const day1 = date_split1[0];
                                const to_week_day = WeeklyOff(day1)
    
                                const get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                                log.debug({ title: 'aa excluded_weeklyoff_days', details: get_all_dates });
    
                                const tot_days_count = get_all_dates.length;
                                log.debug({ title: 'aa tot_days_count', details: tot_days_count })
    
                                const day_split = get_all_dates.toString().split(',')
                                log.debug({ title: 'aa day_split', details: day_split });
                                const flag = 0;
                                log.debug({ title: 'aa WeeklyOfCount', details: WeeklyOfCount })
                                for (const j = 0; j < tot_days_count; j++) {
    
    
                                    const one_by_one_day = day_split[j]
    
                                    if (WeeklyOfCount == '2') {
                                        if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                            flag = flag + 1;
                                        }
    
                                    } else {
                                        if (one_by_one_day == WeeklyOffInW) {
                                            flag = flag + 1;
                                        }
                                    }
    
                                }
                                log.debug({ title: 'abb flag', details: flag })
    
                                if (flag == '0') {
                                    if (holiday_count == 0) {
                                        log.debug({ title: 'Inside flag 0', details: '' })
                                        datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                    } else {
                                        const datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(holiday_count) + 1;
                                    }
                                }
                                if (flag == '1') {
                                    if (holiday_count == 0) {
                                        log.debug({ title: 'Inside flag 1', details: '' })
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                    } else {
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = (((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                    }
                                }
                                if (flag == '2') {
                                    if (holiday_count == 0) {
                                        log.debug({ title: 'Inside flag 2', details: '' })
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                    } else {
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = (((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                    }
    
                                }
                                if (flag > '2') {
                                    log.debug({ title: 'Inside flag  > 2', details: '' })
                                    log.debug({ title: 'aa ToDt', details: ToDt });
                                    log.debug({ title: 'aa FrmDt', details: FrmDt });
    
                                    const final_flag = parseFloat(flag) * 1
                                    log.debug({ title: 'aa final_flag', details: final_flag });
                                    datediff = (((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                }
                            }
                        }
    
                    }
    
                }
                else {
                    if (weeklyoffIncCheck == 'T') {
                        const frm_halfday = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');
                        const to_halfday = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');
                        if (frm_halfday == 'T' || to_halfday == 'T') {
                            if (holiday_TF_check == 'T') {
    
                                const monthdays = getArryMonthDays(FrmMonth);
                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                finaldays = finaldays + 1;
                                datediff = parseFloat(finaldays) + 0.5;
                            }
                            if (holiday_TF_check == 'F') {
                                const monthdays = getArryMonthDays(FrmMonth);
                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                finaldays = finaldays + 1;
                                const holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                                datediff = parseFloat(finaldays) + 0.5;
                                datediff = datediff - parseFloat(holiday_count);
    
                            }
                        }
                        if (frm_halfday == 'T' && to_halfday == 'T') {
                            if (holiday_TF_check == 'T') {
                                const monthdays = getArryMonthDays(FrmMonth);
                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                finaldays = finaldays + 1;
                                datediff = parseFloat(finaldays);
                            }
                            if (holiday_TF_check == 'F') {
                                const monthdays = getArryMonthDays(FrmMonth);
                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                finaldays = finaldays + 1;
                                const holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                                datediff = parseFloat(finaldays) - parseFloat(holiday_count);
    
                            }
    
                        }
    
                        if (frm_halfday == 'F' && to_halfday == 'F') {
                            if (holiday_TF_check == 'T') {
    
                                const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
    
                                const datediff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
                                datediff = datediff + 1;
                                log.debug({ title: 'bb datediff', details: datediff })
    
                            }
                            if (holiday_TF_check == 'F') {
                                const holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                                log.debug({ title: 'bb holiday_count', details: holiday_count })
                                if (holiday_count == 0) {
                                    const monthdays = getArryMonthDays(FrmMonth);
                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                    const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                    const datediff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                    datediff = datediff + 1;
                                    log.debug({ title: 'bbb datediff', details: datediff })
    
                                } else {
                                    const monthdays = getArryMonthDays(FrmMonth);
                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
    
                                    const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                    const datediff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                    datediff = datediff + 1;
                                    datediff = datediff - parseFloat(holiday_count);
                                    log.debug({ title: 'bbbb datediff', details: datediff })
                                }
                            }
                        }
    
                    }
                    else {
                        const frm_halfday = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');
                        const to_halfday = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');
    
                        if (frm_halfday == 'T' || to_halfday == 'T') {
                            if (holiday_TF_check == 'T') {
                                const monthdays = getArryMonthDays(FrmMonth);
                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                const frm_date_val = fromDate;
                                const to_date_val = toDate;
                                const monthdays = getArryMonthDays(FrmMonth);
                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                const date_split = frm_date_val_obj.toString().split(' ');
                                const day = date_split[0];
                                const frm_week_day = WeeklyOff(day)
                                const to_date_val_obj = nlapiStringToDate(to_date_val)
                                const date_split1 = to_date_val_obj.toString().split(' ');
                                const day1 = date_split1[0];
                                const to_week_day = WeeklyOff(day1)
                                const get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                                const tot_days_count = get_all_dates.length;
                                const day_split = get_all_dates.toString().split(',')
                                const flag = 0;
                                for (const j = 0; j < tot_days_count; j++) {
                                    const one_by_one_day = day_split[j]
                                    if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                        flag = flag + 1;
                                    }
    
                                }
                                if (flag == '0') {
                                    datediff = parseFloat(finaldays) + 0.5;
                                    datediff = parseFloat(datediff) - 1;
                                }
                                if (flag == '1') {
                                    const final_flag = parseFloat(flag) * 1
                                    datediff = parseFloat(finaldays) - parseFloat(final_flag) + 0.5;
                                    datediff = parseFloat(datediff) - 1;
                                }
                                if (flag == '2') {
                                    const final_flag = parseFloat(flag) * 1
                                    datediff = parseFloat(finaldays) - parseFloat(final_flag) + 0.5;
                                    datediff = parseFloat(datediff) - 1;
                                }
                                if (flag > '2') {
                                    const final_flag = parseFloat(flag) * 1
                                    datediff = parseFloat(finaldays) - parseFloat(final_flag) + 0.5;
                                    datediff = parseFloat(datediff) - 1;
                                }
                            }
                            if (holiday_TF_check == 'F') {
                                const monthdays = getArryMonthDays(FrmMonth);
                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                const holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                                const frm_date_val = fromDate;
                                const to_date_val = toDate;
                                const monthdays = getArryMonthDays(FrmMonth);
                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                const date_split = frm_date_val_obj.toString().split(' ');
                                const day = date_split[0];
                                const frm_week_day = WeeklyOff(day)
                                const to_date_val_obj = nlapiStringToDate(to_date_val)
                                const date_split1 = to_date_val_obj.toString().split(' ');
                                const day1 = date_split1[0];
                                const to_week_day = WeeklyOff(day1)
                                const get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                                const tot_days_count = get_all_dates.length;
                                const day_split = get_all_dates.toString().split(',')
                                const flag = 0;
                                for (const j = 0; j < tot_days_count; j++) {
                                    const one_by_one_day = day_split[j]
                                    if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                        flag = flag + 1;
                                    }
    
                                }
                                if (flag == '0') {
                                    if (holiday_count == 0) {
                                        datediff = parseFloat(finaldays) + 1;
                                        datediff = parseFloat(datediff) / 2;
                                        datediff = parseFloat(datediff) - parseFloat(holiday_count);
                                    } else {
                                        datediff = parseFloat(finaldays) + 0.5;
                                        datediff = parseFloat(datediff) - parseFloat(holiday_count);
                                    }
                                }
                                if (flag == '1') {
                                    if (holiday_count == 0) {
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = parseFloat(finaldays) + 0.5;
                                        datediff = parseFloat(datediff) - parseFloat(final_flag);
                                    } else {
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = parseFloat(finaldays)
                                        datediff = (parseFloat(datediff) - parseFloat(final_flag)) - parseFloat(holiday_count) + 0.5;
                                    }
    
                                }
                                if (flag == '2') {
                                    if (holiday_count == 0) {
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = parseFloat(finaldays) + 0.5;
                                        datediff = parseFloat(datediff) - parseFloat(final_flag);
                                    } else {
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = parseFloat(finaldays) + 0.5;
                                        datediff = (parseFloat(datediff) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                    }
                                }
                                if (flag > '2') {
                                    if (holiday_count == 0) {
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = parseFloat(finaldays) + 0.5;
                                        datediff = parseFloat(datediff) - parseFloat(final_flag);
                                    } else {
                                        const final_flag = parseFloat(flag) * 1
                                        datediff = parseFloat(finaldays) + 0.5;
                                        datediff = (parseFloat(datediff) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                        datediff = datediff + 1;
                                    }
                                }
                            }
                        }
                        if (frm_halfday == 'T' && to_halfday == 'T') {
                            if (holiday_TF_check == 'T') {
                                const monthdays = getArryMonthDays(FrmMonth);
                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                finaldays = finaldays + 1;
                                const frm_date_val = fromDate;
                                const to_date_val = toDate;
                                const monthdays = getArryMonthDays(FrmMonth);
                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                const date_split = frm_date_val_obj.toString().split(' ');
                                const day = date_split[0];
                                const frm_week_day = WeeklyOff(day)
                                const to_date_val_obj = nlapiStringToDate(to_date_val)
                                const date_split1 = to_date_val_obj.toString().split(' ');
                                const day1 = date_split1[0];
                                const to_week_day = WeeklyOff(day1)
                                const get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                                const tot_days_count = get_all_dates.length;
                                const day_split = get_all_dates.toString().split(',')
                                const flag = 0;
                                for (const j = 0; j < tot_days_count; j++) {
                                    const one_by_one_day = day_split[j]
                                    if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                        flag = flag + 1;
                                    }
    
                                }
                                if (flag == '0') {
                                    datediff = parseFloat(finaldays);
                                }
                                if (flag == '1') {
                                    const final_flag = parseFloat(flag) * 1
    
                                    datediff = parseFloat(finaldays) - parseFloat(final_flag);
                                }
                                if (flag == '2') {
                                    const final_flag = parseFloat(flag) * 1
                                    datediff = parseFloat(finaldays) - parseFloat(final_flag);
                                }
                                if (flag > '2') {
                                    const final_flag = parseFloat(flag) * 1
                                    datediff = parseFloat(finaldays) - parseFloat(final_flag);
                                }
                            }
    
                            if (holiday_TF_check == 'F') {
                                const monthdays = getArryMonthDays(FrmMonth);
                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                finaldays = finaldays + 1;
                                const holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                                const frm_date_val = o_leaveApp.getFieldValue('custrecord_hris_lve_fromdate')
                                const to_date_val = o_leaveApp.getFieldValue('custrecord_hris_lve_todate')
                                const monthdays = getArryMonthDays(FrmMonth);
                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                const date_split = frm_date_val_obj.toString().split(' ');
                                const day = date_split[0];
                                const frm_week_day = WeeklyOff(day)
                                const to_date_val_obj = nlapiStringToDate(to_date_val)
                                const date_split1 = to_date_val_obj.toString().split(' ');
                                const day1 = date_split1[0];
                                const to_week_day = WeeklyOff(day1)
                                const get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                                const tot_days_count = get_all_dates.length;
                                const day_split = get_all_dates.toString().split(',')
                                const flag = 0;
                                for (const j = 0; j < tot_days_count; j++) {
                                    const one_by_one_day = day_split[j]
                                    if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                        flag = flag + 1;
                                    }
    
                                }
                                if (flag == '0') {
                                    if (holiday_count == 0) {
                                        datediff = parseFloat(finaldays);
                                    } else {
                                        datediff = parseFloat(finaldays);
                                        datediff = parseFloat(datediff) - parseFloat(holiday_count);
                                    }
                                }
                                if (flag == '1') {
                                    if (holiday_count == 0) {
                                        const final_flag = parseFloat(flag) * 1;
                                        datediff = parseFloat(finaldays) - parseFloat(final_flag);
                                    } else {
                                        const final_flag = parseFloat(flag) * 1;
                                        datediff = parseFloat(finaldays) - parseFloat(final_flag)
                                        datediff = parseFloat(datediff) - parseFloat(holiday_count);
                                    }
    
                                }
                                if (flag == '2') {
                                    if (holiday_count == 0) {
                                        const final_flag = parseFloat(flag) * 1;
                                        datediff = parseFloat(finaldays);
                                        datediff = parseFloat(datediff) - parseFloat(final_flag);
                                    } else {
                                        const final_flag = parseFloat(flag) * 1;
                                        datediff = parseFloat(finaldays) - parseFloat(final_flag);
                                        datediff = parseFloat(datediff) - parseFloat(holiday_count);
                                    }
                                }
                                if (flag > '2') {
                                    if (holiday_count == 0) {
                                        const final_flag = parseFloat(flag) * 1;
                                        datediff = parseFloat(finaldays);
                                        datediff = parseFloat(datediff) - parseFloat(final_flag);
                                    } else {
                                        const final_flag = parseFloat(flag) * 1;
                                        datediff = parseFloat(finaldays) - parseFloat(final_flag);
                                        datediff = parseFloat(datediff) - parseFloat(holiday_count);
                                    }
                                }
                            }
                        }
                        if (frm_halfday == 'F' && to_halfday == 'F') {
                            if (holiday_TF_check == 'T') {
                                const frm_date_val = fromDate;
                                const to_date_val = toDate
                                const monthdays = getArryMonthDays(FrmMonth);
                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                const date_split = frm_date_val_obj.toString().split(' ');
                                const day = date_split[0];
                                const frm_week_day = WeeklyOff(day)
                                const to_date_val_obj = nlapiStringToDate(to_date_val)
                                const date_split1 = to_date_val_obj.toString().split(' ');
                                const day1 = date_split1[0];
                                const to_week_day = WeeklyOff(day1)
                                const get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                                const tot_days_count = get_all_dates.length;
                                const day_split = get_all_dates.toString().split(',')
                                const flag = 0;
                                for (const j = 0; j < tot_days_count; j++) {
    
                                    const one_by_one_day = day_split[j]
                                    if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                        flag = flag + 1;
    
                                    }
    
                                }
                                if (flag == '0') {
                                    const monthdays = getArryMonthDays(FrmMonth);
                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                    const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                    const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                    finaldays = finaldays + 1;
                                }
    
                                if (flag == '1') {
                                    const final_flag = parseFloat(flag) * 1
                                    const monthdays = getArryMonthDays(FrmMonth);
                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
    
                                    const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                    const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                    finaldays = finaldays + 1;
                                    finaldays = finaldays - parseFloat(final_flag);
                                }
                                if (flag == '2') {
                                    const final_flag = parseFloat(flag) * 1
                                    const monthdays = getArryMonthDays(FrmMonth);
                                    const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
    
                                    const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                    const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                    finaldays = finaldays + 1;
                                    finaldays = finaldays - parseFloat(final_flag);
                                }
                                if (flag > '2') {
                                    const final_flag = parseFloat(flag) * 1
    
    
                                    const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                    const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                    finaldays = finaldays + 1 - parseFloat(final_flag);
                                }
                            }
                            if (holiday_TF_check == 'F') {
                                const holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                                const frm_date_val = o_leaveApp.getFieldValue('custrecord_hris_lve_fromdate')
                                const to_date_val = o_leaveApp.getFieldValue('custrecord_hris_lve_todate')
                                const monthdays = getArryMonthDays(FrmMonth);
                                const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                const frm_date_val_obj = nlapiStringToDate(frm_date_val)
                                const date_split = frm_date_val_obj.toString().split(' ');
                                const day = date_split[0];
                                const frm_week_day = WeeklyOff(day)
                                const to_date_val_obj = nlapiStringToDate(to_date_val)
                                const date_split1 = to_date_val_obj.toString().split(' ');
                                const day1 = date_split1[0];
                                const to_week_day = WeeklyOff(day1)
                                const get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                                const tot_days_count = get_all_dates.length;
                                const day_split = get_all_dates.toString().split(',')
                                const flag = 0;
                                for (const j = 0; j < tot_days_count; j++) {
                                    const one_by_one_day = day_split[j]
                                    if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                        flag = flag + 1;
    
                                    }
    
                                }
                                if (flag == '0') {
                                    log.debug({ title: 'inside flag 0', details: '' })
                                    if (holiday_count == 0) {
                                        const monthdays = getArryMonthDays(FrmMonth);
                                        log.debug({ title: 'aa monthDays', details: monthdays });
                                        const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
    
                                        const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                        const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                        finaldays = finaldays + 1;
                                    } else {
                                        const monthdays = getArryMonthDays(FrmMonth);
                                        const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
    
                                        const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                        const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                        finaldays = finaldays + 1;
                                        finaldays = finaldays - parseFloat(holiday_count);
                                    }
                                }
                                if (flag == '1') {
                                    if (holiday_count == 0) {
                                        log.debug({ title: 'inside flag 1', details: '' })
                                        const final_flag = parseFloat(flag) * 1
                                        const monthdays = getArryMonthDays(FrmMonth);
                                        const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                        const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                        const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                        finaldays = finaldays + 1;
                                        finaldays = finaldays - parseFloat(final_flag)
                                    } else {
                                        const final_flag = parseFloat(flag) * 1
                                        const monthdays = getArryMonthDays(FrmMonth);
                                        const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                        const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                        const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                        finaldays = finaldays + 1;
                                        finaldays = finaldays - parseFloat(final_flag)
                                        finaldays = finaldays - parseFloat(holiday_count)
                                    }
                                }
                                if (flag == '2') {
                                    if (holiday_count == 0) {
                                        log.debug({ title: 'inside flag 2', details: '' })
                                        const final_flag = parseFloat(flag) * 1
                                        const monthdays = getArryMonthDays(FrmMonth);
                                        const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                        const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                        const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                        finaldays = finaldays + 1;
                                        finaldays = finaldays - parseFloat(final_flag)
                                    } else {
                                        const final_flag = parseFloat(flag) * 1
                                        const monthdays = getArryMonthDays(FrmMonth);
                                        const firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                        const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                        const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                        finaldays = finaldays + 1;
                                        finaldays = finaldays - parseFloat(final_flag)
                                        finaldays = finaldays - parseFloat(holiday_count)
    
                                    }
                                }
                                if (flag > '2') {
                                    if (holiday_count == 0) {
                                        log.debug({ title: 'inside flag  > 2', details: '' })
                                        const final_flag = parseFloat(flag) * 1
                                        const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                        const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                        log.debug({ title: 'aab finaldays', details: finaldays });
                                        log.debug({ title: 'aab final_flag', details: final_flag });
                                        log.debug({ title: 'aab toDate', details: toDate });
                                        log.debug({ title: 'aab fromDate', details: fromDate });
                                        finaldays = parseFloat(finaldays) - parseFloat(final_flag);
                                    } else {
                                        const final_flag = parseFloat(flag) * 1
    
                                        const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                        const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                        finaldays = finaldays + 1 - parseFloat(final_flag);
                                        finaldays = finaldays - parseFloat(holiday_count);
                                    }
                                }
                            }
                        }
    
                    }
                }
            }
        }
        log.debug({ title: 'aa datediff', details: datediff });
        log.debug({ title: 'aa finaldays', details: finaldays });
    
        return datediff;
    }
    
    function weeklyOffInclude(leave_type) {
    
        const weeklyoffCheck = false;
        const filters = new Array();
        const column = new Array();
        if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
            filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
    
            column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_includeweekoff'));
            const leaveTypeConfigWO = search.create({ type: 'customrecord_hris_leaveconfig', filters: filters, columns: column }).run();
            if (leaveTypeConfigWO != null) {
                weeklyoffCheck = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_includeweekoff')
            }
            return weeklyoffCheck;
    
        }
    
    
    }
    
    
    function holidayInclude(leave_type) {
    
        const holidayCheck = false;
        const filters = new Array();
        const column = new Array();
        if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
            filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
    
            column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_includeholiday'));
            const leaveTypeConfigWO = search.create({ type: 'customrecord_hris_leaveconfig', filters: filters, columns: column }).run();
            if (leaveTypeConfigWO != null) {
                holidayCheck = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_includeholiday')
            }
    
        }
    
        return holidayCheck;
    }
    
    
    
    
    
    
    function searchEmpsWeeklyOff(getUserId) {
    
        const Count = 0;
        const weekly_Count = new Array();
        const EmployeeWeeklyOff = search.create({ type: "customrecord_hris_employeedatasourcing", filters: [
                ["custrecord_hris_eds_employee", columns: "anyof", getUserId]
            ],
            [
                new nlobjSearchColumn("custrecord_hris_eds_employee" }).run(),
                new nlobjSearchColumn("custrecord_hris_eds_employeeweeklyoff"),
                new nlobjSearchColumn("custrecord_hris_eds_employeeholidays"),
                new nlobjSearchColumn("internalid")
            ]
        );
    
        if (EmployeeWeeklyOff != null) {
            const s_weeklyoff = EmployeeWeeklyOff[0].getValue('custrecord_hris_eds_employeeweeklyoff')
            log.debug({ title: 's_weeklyoff length', details: s_weeklyoff })
            log.debug({ title: 's_weeklyoff internal ID', details: EmployeeWeeklyOff[0].getValue('internalid' }))
            if (s_weeklyoff.length == 3) {
                const split_s_weeklyoff = s_weeklyoff.toString().split(',')
    
                const split_s_weeklyoff_1 = split_s_weeklyoff[0]
    
                Count++;
                const split_s_weeklyoff_2 = split_s_weeklyoff[1]
    
                Count++;
                weekly_Count.push(split_s_weeklyoff_1 + "##" + split_s_weeklyoff_2)
            } else
                if (s_weeklyoff.length == 1) {
                    const split_s_weeklyoff_1 = s_weeklyoff[0]
                    Count++;
                }
        }
        return Count + "#" + s_weeklyoff;
    
    }
    
    function gethrisMonth(monthParameter) {
        if (monthParameter == 1) {
            return '1';
        } else if (monthParameter == 2) {
            return '2';
        } else if (monthParameter == 3) {
            return '3';
        } else if (monthParameter == 4) {
            return '4';
        } else if (monthParameter == 5) {
            return '5';
        } else if (monthParameter == 6) {
            return '6';
        } else if (monthParameter == 7) {
            return '7';
        } else if (monthParameter == 8) {
            return '8';
        } else if (monthParameter == 9) {
            return '9';
        } else if (monthParameter == 10) {
            return '10';
        } else if (monthParameter == 11) {
            return '11';
        } else if (monthParameter == 12) {
            return '12';
        }
    } 
    function searchEmpholidays(getUserId, fromDate, toDate) {
        const fromdate = fromDate;
        const todate = toDate;
        log.debug({ title: 'searchEmpholidays fromDate', details: fromDate })
        log.debug({ title: 'searchEmpholidays toDate', details: toDate })
        const holiday_date;
        const count = 0;
        const all_holiday_dates = new Array();
        const filters = new Array();
        const column = new Array();
        const s_holiday = new Array();
        const get_holiday_filters = new Array();
        const get_holiday_column = new Array();
        const emp_holidays = [];
    
        const Employee_holiday_searchResult = search.create({ type: "customrecord_hris_employeedatasourcing", filters: [
                ["custrecord_hris_eds_employee", columns: "anyof", getUserId]
            ],
            [
                new nlobjSearchColumn("custrecord_hris_eds_employee" }).run(),
                new nlobjSearchColumn("custrecord_hris_eds_employeeweeklyoff"),
                new nlobjSearchColumn("custrecord_hris_eds_employeeholidays")
            ]
        );
        for (const i = 0; i < Employee_holiday_searchResult.length; i++) {
            const holidayList = Employee_holiday_searchResult[0].getValue('custrecord_hris_eds_employeeholidays');
            holidayList = holidayList.split(',')
        };
    
    
        log.debug({ title: 'Employee_holiday_searchResult length', details: Employee_holiday_searchResult.length })
        for (const holidayCount = 0; holidayCount < holidayList.length; holidayCount++) {
            const holidayId = holidayList[holidayCount];
            const holidayDate = nlapiLookupField('customrecord_hris_holiday_master', holidayId, 'custrecord_hris_holiday_date');
            const isInactive = nlapiLookupField('customrecord_hris_holiday_master', holidayId, 'isinactive');
            holidayDate = nlapiStringToDate(holidayDate);
            log.debug({ title: 'holidayDate', details: holidayDate });
            if ((holidayDate >= fromDate) && (holidayDate <= toDate) && isInactive == 'F') {
    
                count = count + 1;
    
            }
    
        }
    
        return count;
    }
    
    
    
    
    function searchYear(year) {
        const yearVal = '';
        year = year.toString();
        log.debug({ title: 'Year in searchYear function', details: year });
        const filter = [];
        filter.push(new nlobjSearchFilter('name', null, 'contains', year));
        filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    
        const column = [];
        column.push(new nlobjSearchColumn('internalid'));
    
        const search = search.create({ type: 'customlist_hris_year_master', filters: filter, columns: column }).run();
        if (search) {
            yearVal = search[0].getValue('internalid')
        }
        log.debug({ title: 'yearVal in SearchYear  Func', details: yearVal });
        return yearVal;
    }
    
    
    
    function _Is_Valid(value) {
        if (value != null && value != '' && value != 'undefined') {
            return true;
        }
        return false;
    }
    
    
    
    function _Is_in_Valid(Leave_id) {
    
        if (Leave_id == null && Leave_id == '' && Leave_id == 'undefined') {
            return true;
        }
        return false;
    
    }
    
    
    function formatedDate(end_date) {
    
        const date_format = checkDateFormat();
        const endDate = nlapiStringToDate(end_date);
        const year = endDate.getFullYear();
        log.debug({ title: 'formated year', details: year })
        const Anvr_month = endDate.getMonth() + 1;
        log.debug({ title: 'formated Anvr_month', details: Anvr_month })
        const Anvr_DateVal = endDate.getDate();
        log.debug({ title: 'formated Anvr_DateVal', details: Anvr_DateVal })
    
        if (date_format == 'YYYY-MM-DD') {
            const newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
        }
        if (date_format == 'DD/MM/YYYY') {
            const newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
    
        }
        if (date_format == 'MM/DD/YYYY') {
            const newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
        }
        if (date_format == 'M/D/YYYY') {
            const newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
        }
    
        if (date_format == 'DD-MM-YYYY') {
            const newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
    
        if (date_format == 'DD-Mon-YYYY') {
            const newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
    
        if (date_format == 'DD.MM.YYYY') {
            const newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
        }
        if (date_format == 'DD-Month-YYYY') {
            const newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
        if (date_format == 'YYYY/MM/DD') {
            const newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
        }
    
        if (date_format == 'DD MONTH, YYYY') {
    
            const newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;
    
        }
        log.debug({ title: 'formated newDate', details: newDate });
        return newDate;
    
    }
    
    function remFormatedDate(remainMonth_year, remainMonth_month, lastdayOfEachMonth) {
    
        const date_format = checkDateFormat();
        const year = remainMonth_year;
        const Anvr_month = remainMonth_month
        const Anvr_DateVal = lastdayOfEachMonth;
    
        if (date_format == 'YYYY-MM-DD') {
            const newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
        }
        if (date_format == 'DD/MM/YYYY') {
            const newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
    
        }
        if (date_format == 'MM/DD/YYYY') {
            const newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
        }
        if (date_format == 'M/D/YYYY') {
            const newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
        }
    
        if (date_format == 'DD-MM-YYYY') {
            const newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
    
        if (date_format == 'DD-Mon-YYYY') {
            const newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
    
        if (date_format == 'DD.MM.YYYY') {
            const newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
        }
        if (date_format == 'DD-Month-YYYY') {
            const newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
        if (date_format == 'YYYY/MM/DD') {
            const newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
        }
    
        if (date_format == 'DD MONTH, YYYY') {
    
            const newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;
    
        }
    
        return newDate;
    
    }
    
    
    
    function checkDateFormat() {
        const context = runtime;
    
        const dateFormatPref = context.getPreference('dateformat');
    
        return dateFormatPref;
    }
    
    
    
    function getArryMonthDays(FrmMonth) {
    
        const standard_month_days; {
            if (FrmMonth == '1' || FrmMonth == '3' || FrmMonth == '5' || FrmMonth == '7' || FrmMonth == '8' || FrmMonth == '10' || FrmMonth == '12') {
                standard_month_days = 31;
            }
            if (FrmMonth == '4' || FrmMonth == '6' || FrmMonth == '9' || FrmMonth == '11') {
                standard_month_days = 30;
            }
            else
                if (FrmMonth == '2') {
                    const date = new Date()
                    const year = date.getFullYear()
                    if (year % 4 == 0) {
                        standard_month_days = 29;
                    } else {
                        standard_month_days = 28;
                    }
                }
        }
        return standard_month_days;
    }
    
    function WeeklyOff(DaysW) {
    
        const whole_day;
        const filters = new Array();
        filters.push(new nlobjSearchFilter('name', null, 'startswith', DaysW))
    
        const column = new Array();
    
        column.push(new nlobjSearchColumn('internalid'));
    
        const whole_day_search = search.create({ type: 'customlist_hris_week_days', filters: filters, columns: column }).run();
    
        if (whole_day_search != null) {
            whole_day = whole_day_search[0].getValue('internalid')
    
        }
        return whole_day;
    }
    
    
    function get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt) {
    
        const date_push = new Array();
        const frm_dt = new Date(fromDate);
        const timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
        const finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
        finaldays = parseFloat(finaldays) + 1;
        const count_date = finaldays;
        const date_day = frm_dt.getDay();
        for (const i = 1; i <= count_date; i++) {
    
            if (date_day >= '8') {
    
    
    
                const date_day = 1;
            }
    
    
    
            date_push.push(date_day);
            date_day = date_day + 1;
    
        }
        return date_push;
    }
    
    
    
    function get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt) {
    
    
        const date_day = 0
    
        const date_push = new Array();
    
        const frm_dt = new Date(fromDate);
    
        const to_dt = new Date(toDate)
    
        const count_date = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
    
        const date_day = frm_dt.getDay();
    
        date_day = parseFloat(date_day) + 1;
    
        for (const i = 1; i <= count_date; i++) {
            if (date_day >= '8') {
    
                date_day = 1
    
    
            }
            date_push.push(date_day);
            date_day = parseInt(date_day) + 1;
        }
        return date_push;
    }
    
    
    function isEncashmentAllowed(leaveid) {
        const flag = 'F';
    
        const customrecord_hris_leaveconfigSearch = search.create({ type: "customrecord_hris_leaveconfig", filters: [
                ["isinactive", columns: "is", "F"],
                "AND",
                ["custrecord_hris_lveconfig_encashallowed", "is", "T"],
                "AND",
                ["internalidnumber", "equalto", leaveid]
            ],
            [
                new nlobjSearchColumn("internalid" }).run(),
                new nlobjSearchColumn("custrecord_hris_lveconfig_encashallowed")
            ]
        );
        if (customrecord_hris_leaveconfigSearch) {
            flag = 'T';
        }
    
        return flag;
    }
    
    
    
    
    function monthDiff(d1, d2) {
        const months;
        months = (d2.getFullYear() - d1.getFullYear()) * 12;
        months -= d1.getMonth();
        months += d2.getMonth();
        return months <= 0 ? 0 : months;
    }
    
    function test(d1, d2) {
        const diff = monthDiff(d1, d2);
        console.log(
            d1.toISOString().substring(0, 10),
            "to",
            d2.toISOString().substring(0, 10),
            ":",
            diff
        );
    }
    
    
    function GetRoundOffvalue(finalAnnual) {
        const final_days = finalAnnual;
        log.debug({ title: "", details: "final_days************************************" + final_days });
        const rounded_final_value;
        const split_final_days = new Array();
      
        split_final_days = final_days.toString().split(".");
      
        const integer_no = split_final_days[0];
        log.debug({ title: "", details: "integer_no************************************" + integer_no });
      
        const i_decimal_val = split_final_days[1];
        log.debug({ title: "", details: "i_decimal_val************************************" + i_decimal_val });
      
        
      
        const compare_no = "0" + "." + i_decimal_val;
        log.debug({ title: "typeof(compare_no, details: '' })" + typeof compare_no,
          "compare_no************************************" + compare_no
        );     
         rounded_final_value = parseFloat(integer_no); 
      
     
      
        log.debug({ title: "", details: "rounded_final_value************************************" +
            rounded_final_value });
        return rounded_final_value;
      }

    return {
        LMS_LeaveBalanceDebitCredit_AfterSubmit: LMS_LeaveBalanceDebitCredit_AfterSubmit
    };
});
