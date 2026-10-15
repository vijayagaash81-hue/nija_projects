/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/search', 'N/query', 'N/format', 'N/record', 'N/currentRecord', 'N/url', 'N/runtime', 'N/ui/serverWidget', './moment.js'],
    (search, query, format, record, currentRecord, url, runtime, serverWidget, moment) => {

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

function LMS_LeaveBalanceDebitCredit_AfterSubmit(type) {
    if (type != 'delete') {
        nlapiLogExecution('DEBUG', 'WFH ', 'type --> ' + type)
        let error_message = 'Leave type is not present'
        let LeaveAppliAvailDays = 0.00;
        let TotalLeaveBalTaken = 0.00;
        let available_leave_bal = 0.00;
        let totalEncash = 0.00;
        let recordId = nlapiGetRecordId()
        let o_leaveApp = nlapiLoadRecord('customrecord_hris_leaveapplication', recordId)

        let emp_Id = o_leaveApp.getFieldValue('custrecord_hris_lve_employeename')
        nlapiLogExecution('DEBUG', 'WFH ', 'emp_Id --> ' + emp_Id)

        let Leave_type = o_leaveApp.getFieldValue('custrecord_hris_lve_leavetype')
        /*let E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
        let Leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');  */

        nlapiLogExecution('DEBUG', 'WFH ', 'Leave_type --> ' + Leave_type)


        let leaveTypeRecord = nlapiLoadRecord('customrecord_hris_leaveconfig', Leave_type);
        let unpaidCheck = leaveTypeRecord.getFieldValue('custrecord_hris_lveconfig_unpaid')
        let halfPaidCheck = leaveTypeRecord.getFieldValue('custrecord_hris_lveconfig_halfpaid')
        let considerForPayroll = leaveTypeRecord.getFieldValue('custrecord_hris_lvecnfg_considerpayroll')
        let LeaveApplication_Status = o_leaveApp.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
        nlapiLogExecution('DEBUG', 'WFH ', 'LeaveApplication_Status --> ' + LeaveApplication_Status)

        let leaveCancelStatus = o_leaveApp.getFieldValue('custrecord_hris_lve_cancel_leavestatus');

        let Leave_approval_Check = o_leaveApp.getFieldValue('custrecord_hris_lve_applve_approval');

        let cancel_check = o_leaveApp.getFieldValue('custrecord_hris_lve_cancellation');

        let No_of_Leave_Days = o_leaveApp.getFieldValue('custrecord_hris_lve_totalnodays');

        let unpaidCreated = o_leaveApp.getFieldValue('custrecord_hris_lve_unpaidentry_created')

        let leaveReason = o_leaveApp.getFieldValue('custrecord_hris_lve_leavereason');

        let workResumeChkBx = o_leaveApp.getFieldValue('custrecord_hris_lve_workresume');

        // added for annual leave
        let lbwholeno= o_leaveApp.getFieldValue('custrecord_hris_lve_leavebalance_wholeno');
        let lbbalance= o_leaveApp.getFieldValue('custrecord_hris_lve_leavebalance');
         nlapiLogExecution('AUDIT', 'WFH ', 'LeaveApplication_whole --> ',+lbwholeno);
         nlapiLogExecution('AUDIT', 'WFH ', 'LeaveApplication_LB --> ',+lbbalance);
        let refNumber = o_leaveApp.getFieldValue('name');
        nlapiLogExecution('DEBUG', 'refNumber', refNumber);

        let seq_no = get_sequence_no(Leave_type)

        let Leave_id = SearchLeaveBalanceMaster(emp_Id, Leave_type);
        nlapiLogExecution('DEBUG', 'WFH ', 'Leave_id --> ' + Leave_id);

        let isEncashAllowed = isEncashmentAllowed(Leave_type);
        nlapiLogExecution('DEBUG', 'WFH ', 'isEncashAllowed --> ' + isEncashAllowed);

        let isEncashApplied = o_leaveApp.getFieldValue('custrecord_hris_lve_applylveencashment');
        nlapiLogExecution('DEBUG', 'WFH ', 'isEncashApplied --> ' + isEncashApplied);

        let fromDate = o_leaveApp.getFieldValue('custrecord_hris_lve_fromdate');
        nlapiLogExecution('DEBUG', 'Integration fromDate', fromDate);
        fromDate = nlapiStringToDate(fromDate)
        let toDate = o_leaveApp.getFieldValue('custrecord_hris_lve_todate');
        nlapiLogExecution('DEBUG', 'Integration toDate', toDate);
        toDate = nlapiStringToDate(toDate)

        let search_pay_grp = get_paygroup(emp_Id);


        let lastDay_frmDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0);
        let lastDayDate_frmDate = lastDay_frmDate.getDate();
        let lastDayMonth_frmDate = lastDay_frmDate.getMonth() + 1;
        let lastDayYear_frmDate = lastDay_frmDate.getFullYear();

        let finalDate_frmDate = remFormatedDate(lastDayYear_frmDate, lastDayMonth_frmDate, lastDayDate_frmDate)
        if (considerForPayroll == 'T' && cancel_check == 'F' && unpaidCreated == 'F') {

            if (unpaidCheck || halfPaidCheck) {




                nlapiLogExecution('DEBUG', 'Integration finalDate_frmDate', finalDate_frmDate)

                let lastDay_toDate = new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0);
                let lastDayDate_toDate = lastDay_toDate.getDate();
                let lastDayMonth_toDate = lastDay_toDate.getMonth() + 1;
                let lastDayYear_toDate = lastDay_toDate.getFullYear();

                let finalDate_toDate = remFormatedDate(lastDayYear_toDate, lastDayMonth_toDate, lastDayDate_toDate)
                nlapiLogExecution('DEBUG', 'Integration finalDate_toDate', finalDate_toDate)

                if (cancel_check == 'F' && LeaveApplication_Status == '2') {


                    let fromDateMonth = fromDate.getMonth() + 1;
                    nlapiLogExecution('DEBUG', ' integration', 'fromDateMonth---> ' + fromDateMonth)
                    let fromDateYear = fromDate.getFullYear();
                    nlapiLogExecution('DEBUG', ' integration', 'fromDateYear---> ' + fromDateYear);

                    let toDateMonth = toDate.getMonth() + 1;
                    nlapiLogExecution('DEBUG', ' integration', 'toDateMonth---> ' + toDateMonth)
                    let toDateYear = toDate.getFullYear();
                    nlapiLogExecution('DEBUG', ' integration', 'toDateYear---> ' + toDateYear)


                    o_leaveApp.setFieldValue('custrecord_hris_lve_unpaidentry_created', 'T')

                    if (fromDateMonth != toDateMonth) {

                        let filter = [];
                        let column = [];

                        filter.push(new nlobjSearchFilter('custrecord_hris_ule_leave_reference_no', null, 'is', recordId));
                        filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));

                        column.push(new nlobjSearchColumn('internalid'))
                        let unpLeaveSearch = nlapiSearchRecord('customrecord_hris_unpaid_leave_entry', null, filter, column);
                        if (!unpLeaveSearch) {
                            let fromDate = o_leaveApp.getFieldValue('custrecord_hris_lve_fromdate');

                            fromDate = nlapiStringToDate(fromDate)

                            let toDate = o_leaveApp.getFieldValue('custrecord_hris_lve_todate');

                            toDate = nlapiStringToDate(toDate)

                            nlapiLogExecution('DEBUG', 'Integration fromDate', fromDate);
                            nlapiLogExecution('DEBUG', 'Integration toDate', toDate);
                            let d1 = fromDate;
                            let d2 = toDate;

                            if (d1 > d2) {
                                let count = monthDiff(d2, d1)
                                count = parseFloat(count) - parseFloat(1)
                            }
                            else {
                                let count = monthDiff(d1, d2)
                                count = parseFloat(count) - parseFloat(1)
                            }

                            nlapiLogExecution('DEBUG', 'COUNT', count);



                            let lastFromDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0);
                            let lastFromDay = lastFromDate.getDate();
                            let monthFromDay = lastFromDate.getMonth() + 1;
                            let yearFromDay = lastFromDate.getFullYear();

                            let lastToDate = new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0);
                            let lastToDay = lastToDate.getDate();

                            let firstMonthDays = parseFloat(lastFromDay) - parseFloat(fromDate.getDate())
                            firstMonthDays = firstMonthDays + 1;

                            if (firstMonthDays) {
                                let end_date = finalDate_frmDate;
                                let year = lastDayYear_frmDate;
                                let YearId = searchYear(year)
                                let get_month = lastDayMonth_frmDate;
                                //added by florence 
                                get_month = gethrisMonth(get_month);
                                nlapiLogExecution('DEBUG', 'get_month in firstMonthDays Condition', get_month);
                                nlapiLogExecution('DEBUG', 'end_date in firstMonthDays Condition', end_date);


                                let frmDate = nlapiDateToString(fromDate);
                                let tDate = remFormatedDate(yearFromDay, monthFromDay, lastFromDay)

                                firstMonthDays = totalDaysCalculation(frmDate, tDate, Leave_type, o_leaveApp)
                                nlapiLogExecution('DEBUG', 'aa firstMonthDays', firstMonthDays);
                                firstMonthUnpaidEntry(unpaidCheck, halfPaidCheck, refNumber, emp_Id, Leave_type, firstMonthDays, search_pay_grp, leaveReason, end_date, get_month, YearId, recordId)
                            }

                            let lastMonthDays = parseFloat(toDate.getDate())

                            if (lastMonthDays) {
                                let end_date = finalDate_toDate;
                                let year = lastDayYear_toDate;

                                let YearId = searchYear(year)
                                let get_month = lastDayMonth_toDate;
                                //added by florence 
                                get_month = gethrisMonth(get_month);
                                nlapiLogExecution('DEBUG', 'get_month in lastMonthDays Condition', get_month);
                                nlapiLogExecution('DEBUG', 'end_date in lastMonthDays Condition', end_date);

                                let lastDayDate_toDate = '01'


                                let toStartDate = remFormatedDate(lastDayYear_toDate, lastDayMonth_toDate, lastDayDate_toDate)
                                nlapiLogExecution('DEBUG', 'aa toStartDate', toStartDate)
                                nlapiLogExecution('DEBUG', 'aa finalDate_toDate', finalDate_toDate)

                                finalDate_toDate = nlapiDateToString(toDate);
                                lastMonthDays = totalDaysCalculation(toStartDate, finalDate_toDate, Leave_type, o_leaveApp)
                                nlapiLogExecution('DEBUG', 'aa lastMonthDays', lastMonthDays);
                                lastMonthUnpaidEntry(unpaidCheck, halfPaidCheck, refNumber, emp_Id, Leave_type, lastMonthDays, search_pay_grp, leaveReason, end_date, get_month, YearId, recordId)
                            }

                            if (count > 0 || count > '0') {
                                nlapiLogExecution('DEBUG', 'Integration condition if(count > 0 || count > "0")');
                                unpaidEntryForMoreThanOneMonth(count, fromDate, unpaidCheck, halfPaidCheck, refNumber, emp_Id, Leave_type, lastMonthDays, search_pay_grp, leaveReason, get_month, YearId, recordId, o_leaveApp)


                            }

                        }

                    }
                    else {
                        let end_date = finalDate_frmDate;
                        let get_month = lastDayMonth_frmDate;
                        //added by florence 
                        get_month = gethrisMonth(get_month);
                        nlapiLogExecution('DEBUG', 'end_date in ELSE Condition', end_date);
                        let filter = [];
                        let column = [];

                        filter.push(new nlobjSearchFilter('custrecord_hris_ule_leave_reference_no', null, 'is', recordId));
                        filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));

                        column.push(new nlobjSearchColumn('internalid'))
                        let unpLeaveSearch = nlapiSearchRecord('customrecord_hris_unpaid_leave_entry', null, filter, column);

                        if (!unpLeaveSearch) {
                            nlapiLogExecution('DEBUG', 'Inside !unpLeaveSearch')
                            end_date = formatedDate(end_date);
                            nlapiLogExecution('DEBUG', 'formate end_date', end_date);
                            let unpLeavRecord = nlapiCreateRecord('customrecord_hris_unpaid_leave_entry');
                            unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_reference_no', recordId);
                            unpLeavRecord.setFieldValue('custrecord_hris_ule_employee_name', emp_Id);
                            unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_type', Leave_type);
                            unpLeavRecord.setFieldValue('custrecord_hris_ule_noof_days', No_of_Leave_Days);
                            unpLeavRecord.setFieldValue('custrecord_hris_ule_pay_group', search_pay_grp);
                            unpLeavRecord.setFieldValue('custrecord_hris_ule_reason', leaveReason);
                            unpLeavRecord.setFieldValue('custrecord_hris_ule_pay_date', end_date);
                            let year = lastDayYear_frmDate;
                            year = year.toString();
                            let YearId = searchYear(year);
                            nlapiLogExecution('DEBUG', 'YearId in ElSE Condition', YearId)

                            unpLeavRecord.setFieldValue('custrecord_hris_ule_month', get_month);
                            unpLeavRecord.setFieldValue('custrecord_hris_ule_year', YearId);


                            if (unpaidCheck == 'T') {
                                unpLeavRecord.setFieldValue('custrecord_hris_ule_final_days', No_of_Leave_Days);
                            } else if (halfPaidCheck == 'T') {
                                unpLeavRecord.setFieldValue('custrecord_hris_ule_final_days', No_of_Leave_Days / 2);
                            }
                            let createdRecordID = nlapiSubmitRecord(unpLeavRecord);
                            nlapiLogExecution('DEBUG', 'createdRecordID', createdRecordID);

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

                    let o_leaveBalRec = nlapiLoadRecord('customrecord_hris_leavebalance', Leave_id);
                    let available_leave_bal = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_available_leave_ba');
                    o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance', parseFloat(available_leave_bal).toFixed(2));
                    let round_available_leave_bal =  parseFloat(available_leave_bal).toFixed(2);
                    round_available_leave_bal = GetRoundOffvalue(round_available_leave_bal);
                    nlapiLogExecution('AUDIT', 'Leave Balance', round_available_leave_bal);
                    o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance_wholeno',  round_available_leave_bal); 
    

                }

            }


            if (LeaveApplication_Status == '2' && Leave_approval_Check == 'F' && workResumeChkBx == 'F') {

                if (seq_no == 2 || seq_no == 8||seq_no == 13) {

                    let o_leaveBalRec = nlapiLoadRecord('customrecord_hris_leavebalance', Leave_id);

                    let leave_bal_taken = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_take') || 0;
                    nlapiLogExecution('DEBUG', 'WFH ', 'leave_bal_taken --> ' + leave_bal_taken)

                    TotalLeaveBalTaken = parseFloat(leave_bal_taken) + parseFloat(No_of_Leave_Days);

                    o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_leave_balance_take', TotalLeaveBalTaken)

                    let submitLeavebalRec = nlapiSubmitRecord(o_leaveBalRec, true, true);

                    o_leaveApp.setFieldValue('custrecord_hris_lve_applve_approval', 'T');

                }
// for annual leave florence add
              //  if (seq_no != 2 && seq_no != 8 && seq_no != 5 && seq_no !=13) {

                    if (seq_no != 2 && seq_no != 8 && seq_no != 5 && seq_no !=13 && seq_no !=3) {

                    let o_leaveBalRec = nlapiLoadRecord('customrecord_hris_leavebalance', Leave_id);

                    let leave_bal_taken = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_take') || 0;
                    nlapiLogExecution('DEBUG', 'wother', 'leave_bal_taken --> ' + leave_bal_taken)

                    TotalLeaveBalTaken = parseFloat(leave_bal_taken) + parseFloat(No_of_Leave_Days);
                    nlapiLogExecution('DEBUG', 'wother ', 'TotalLeaveBalTaken --> ' + TotalLeaveBalTaken)

                    let Leave_bal_credited = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_cred') || 0;

                    let available_leave_bal = parseFloat(Leave_bal_credited) - parseFloat(TotalLeaveBalTaken)
                    nlapiLogExecution('DEBUG', 'wother ', ' available_leave_bal --> ' + available_leave_bal)

                    o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_leave_balance_take', parseFloat(TotalLeaveBalTaken).toFixed(2))

                    o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_available_leave_ba', parseFloat(available_leave_bal).toFixed(2))


                    if (isEncashAllowed == 'T' && isEncashApplied == 'T') {

                        let total_encash_Days = o_leaveApp.getFieldValue('custrecord_hris_lve_noofencashmentdays');
                        total_encash_Days = parseFloat(total_encash_Days);
                        No_of_Leave_Days = parseFloat(No_of_Leave_Days);


                        let encash_bal = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_encashable_days')||0;
                        encash_bal = parseFloat(encash_bal);

                        let encash_taken = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_encashable_days_ta')||0;
                        encash_taken = parseFloat(encash_taken);

                        let avail_leave_bal = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_available_leave_ba');
                        avail_leave_bal = parseFloat(avail_leave_bal);

                        let leave_taken_bal = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_take')||0;
                        leave_taken_bal = parseFloat(leave_taken_bal);
                        nlapiLogExecution('DEBUG', 'Encashment encash_bal ', encash_bal);
                        nlapiLogExecution('DEBUG', 'Encashment encash_taken', encash_taken);
                        nlapiLogExecution('DEBUG', 'Encashment avail_leave_bal ', avail_leave_bal);
                        nlapiLogExecution('DEBUG', 'Encashment leave_taken_bal',leave_taken_bal);
                        nlapiLogExecution('DEBUG', 'Encashment total_encash_Days',total_encash_Days);
                      
                        if (total_encash_Days < encash_bal) {
                            let remaining_encash_bal = encash_bal - total_encash_Days;

                            let total_taken_encash = encash_taken + total_encash_Days;

                            nlapiLogExecution('DEBUG', 'Encashment part if remaining_encash_bal', remaining_encash_bal);

                            nlapiLogExecution('DEBUG', 'Encashment part if total_taken_encash', total_taken_encash);

                            o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_encashable_days', parseFloat(remaining_encash_bal).toFixed(2));

                            o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_encashable_days_ta', parseFloat(total_taken_encash).toFixed(2));

                        } else {
                            let total_taken_encash = encash_taken + total_encash_Days;
                          
                              

                            let remaining_negative_encash_bal = total_encash_Days - encash_bal;
                            nlapiLogExecution('DEBUG', 'Encashment  remaining_negative_encash_bal',  remaining_negative_encash_bal);
                         

                            let remaining_avail_bal = avail_leave_bal - remaining_negative_encash_bal;
                           
                         

                            let remaing_leave_bal_taken = leave_taken_bal + remaining_negative_encash_bal;
                           
                         
                            let negative_bal = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_additional_encasha')||0;


                            negative_bal = parseFloat(negative_bal) + parseFloat(remaining_negative_encash_bal);

                            nlapiLogExecution('DEBUG', 'Encashment part else remaining_avail_bal', remaining_avail_bal);
                            nlapiLogExecution('DEBUG', 'Encashment part else remaing_leave_bal_taken', remaing_leave_bal_taken);
                            nlapiLogExecution('DEBUG', 'Encashment part else total_taken_encash', total_taken_encash);
                            nlapiLogExecution('DEBUG', 'Encashment part else negative_bal', negative_bal);

                            o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_encashable_days', '0');

                            o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_encashable_days_ta', parseFloat(total_taken_encash).toFixed(2));

                            o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_leave_balance_take', parseFloat(remaing_leave_bal_taken).toFixed(2));

                            o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_available_leave_ba', parseFloat(remaining_avail_bal).toFixed(2));

                            o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_additional_encasha', parseFloat(negative_bal).toFixed(2));
                            available_leave_bal = remaining_avail_bal;
                        }


                    }

                    let submitLeavebalRec = nlapiSubmitRecord(o_leaveBalRec, true, true);

                    o_leaveApp.setFieldValue('custrecord_hris_lve_applve_approval', 'T');

                    o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance', parseFloat(available_leave_bal).toFixed(2))
                    let round_available_leave_bal =  parseFloat(available_leave_bal).toFixed(2);
                    round_available_leave_bal = GetRoundOffvalue(round_available_leave_bal);
                    o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance_wholeno',  round_available_leave_bal); 
    




                }

                // added by florence
                if(seq_no==3){
                    let o_leaveBalRec = nlapiLoadRecord('customrecord_hris_leavebalance', Leave_id);

                    let leave_bal_taken = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_take') || 0;
                    nlapiLogExecution('DEBUG', 'wother', 'leave_bal_taken --> ' + leave_bal_taken)

                    TotalLeaveBalTaken = parseFloat(leave_bal_taken) + parseFloat(No_of_Leave_Days);
                    nlapiLogExecution('DEBUG', 'wother ', 'TotalLeaveBalTaken --> ' + TotalLeaveBalTaken)

                    let Leave_bal_credited = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_cred') || 0;
                    
                    let available_leave_bal = parseFloat(lbwholeno) - parseFloat(TotalLeaveBalTaken)
                    nlapiLogExecution('DEBUG', 'wother ', ' available_leave_bal --> ' + available_leave_bal)

                    o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_leave_balance_take', parseFloat(TotalLeaveBalTaken).toFixed(2))

                    o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_available_leave_ba', parseFloat(available_leave_bal).toFixed(2))


                    let submitLeavebalRec = nlapiSubmitRecord(o_leaveBalRec, true, true);

                    o_leaveApp.setFieldValue('custrecord_hris_lve_applve_approval', 'T');

                    o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance', parseFloat(available_leave_bal).toFixed(2))
                    let round_available_leave_bal =  parseFloat(available_leave_bal).toFixed(2);
                    round_available_leave_bal = GetRoundOffvalue(round_available_leave_bal);
                    o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance_wholeno',  round_available_leave_bal); 
    

                }

                if (seq_no == 5) {
                    let RECID = nlapiGetRecordId();
                    let LeaveRECORD = nlapiLoadRecord('customrecord_hris_leaveapplication', RECID);

                    let total_N_days = LeaveRECORD.getFieldValue('custrecord_hris_lve_totalnodays');
                    nlapiLogExecution('DEBUG', 'total_N_days ', 'total_N_days #######--> ' + total_N_days)

                    nlapiLogExecution('DEBUG', 'WFH ', 'into seq no 5 ')

                    let o_leaveBalRec = nlapiLoadRecord('customrecord_hris_leavebalance', Leave_id);

                    let AvailableBAL = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_available_leave_ba') || 0;
                    nlapiLogExecution('DEBUG', 'AvailableBAL ', 'AvailableBAL --> ' + AvailableBAL)

                    let leave_bal_taken = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_take') || 0;
                    nlapiLogExecution('DEBUG', 'leave_bal_taken ', 'leave_bal_taken --> ' + leave_bal_taken)

                    let available_leave_bal = parseFloat(AvailableBAL) - parseFloat(total_N_days)
                    nlapiLogExecution('DEBUG', 'available_leave_bal ', 'available_leave_bal --> ' + available_leave_bal)

                    let Taken_leave_bal = parseFloat(leave_bal_taken) + parseFloat(total_N_days)
                    nlapiLogExecution('DEBUG', 'Taken_leave_bal ', 'Taken_leave_bal --> ' + Taken_leave_bal)



                    o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_available_leave_ba', parseFloat(available_leave_bal).toFixed(2))
                    o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_leave_balance_take', parseFloat(Taken_leave_bal).toFixed(2))

                    let submitLeavebalRec = nlapiSubmitRecord(o_leaveBalRec, true, true);

                    o_leaveApp.setFieldValue('custrecord_hris_lve_applve_approval', 'T');
                    o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance', parseFloat(available_leave_bal).toFixed(2))
                    let round_available_leave_bal =  parseFloat(available_leave_bal).toFixed(2);
                    round_available_leave_bal = GetRoundOffvalue(round_available_leave_bal);
                    o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance_wholeno',  round_available_leave_bal); 
    


                }
            }
        }
        if (_Is_in_Valid(Leave_id)) {

            throw error_message;

        }


        let RecID = nlapiGetRecordId();
        let LeaveRecord = nlapiLoadRecord('customrecord_hris_leaveapplication', RecID)

        let LeaveCancelSTATUS = LeaveRecord.getFieldValue('custrecord_hris_lve_cancel_leavestatus')
        nlapiLogExecution('DEBUG', 'LeaveCancelSTATUS', 'LeaveCancelSTATUS --> ' + LeaveCancelSTATUS)

        let LeaveCancelApprovalCHECK = LeaveRecord.getFieldValue('custrecord_hris_lve_cancellve_approval')
        nlapiLogExecution('DEBUG', 'LeaveCancelApprovalCHECK', 'LeaveCancelApprovalCHECK --> ' + LeaveCancelApprovalCHECK)

        let LeaveCancellation_Status = nlapiGetFieldValue('custrecord_hris_lve_cancel_leavestatus');
        nlapiLogExecution('DEBUG', 'LeaveCancellation_Status', 'LeaveCancellation_Status --> ' + LeaveCancellation_Status)

        let Leave_cancellation_approval_Check = nlapiGetFieldValue('custrecord_hris_lve_cancellve_approval');
        nlapiLogExecution('DEBUG', 'Leave_cancellation_approval_Check', 'Leave_cancellation_approval_Check --> ' + Leave_cancellation_approval_Check)
// By florence
       if (LeaveApplication_Status == '2' && LeaveCancellation_Status == '1') {
       // if (LeaveApplication_Status == '2' ) {
            let o_leaveBalRec = nlapiLoadRecord('customrecord_hris_leavebalance', Leave_id);
            let available_leave_bal = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_available_leave_ba');
            o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance', parseFloat(available_leave_bal).toFixed(2))
            let round_available_leave_bal =  parseFloat(available_leave_bal).toFixed(2);
            round_available_leave_bal = GetRoundOffvalue(round_available_leave_bal);
            o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance_wholeno',  round_available_leave_bal); 

        }
        //by florenc
        if (workResumeChkBx == 'F' && LeaveCancellation_Status == '2' && Leave_cancellation_approval_Check == 'F' || LeaveCancelSTATUS == '2' && LeaveCancelApprovalCHECK == 'F') {
           // if (workResumeChkBx == 'F'  && Leave_cancellation_approval_Check == 'F' || LeaveCancelApprovalCHECK == 'F') {    
            nlapiLogExecution('DEBUG', 'LeaveCancellation_Status', 'into correct condition of cancel leave')
            if (seq_no == 2 || seq_no == 8 || seq_no ==13) {

                let o_leaveBalRec = nlapiLoadRecord('customrecord_hris_leavebalance', Leave_id);

                let leave_bal_taken = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_take') || 0;
                nlapiLogExecution('DEBUG', 'WFH ', 'leave_bal_taken --> ' + leave_bal_taken)
                TotalLeaveBalTaken = parseFloat(leave_bal_taken) - parseFloat(No_of_Leave_Days);
                nlapiLogExecution('DEBUG', 'WFH ', 'TotalLeaveBalTaken --> ' + TotalLeaveBalTaken)
                o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_leave_balance_take', TotalLeaveBalTaken)

                let submitLeavebalRec = nlapiSubmitRecord(o_leaveBalRec, true, true);

                o_leaveApp.setFieldValue('custrecord_hris_lve_cancellve_approval', 'T');
            }

            if (seq_no != 2 && seq_no != 8 && seq_no !=13) {
                nlapiLogExecution('DEBUG', 'LeaveCancellation_Status', 'into correct condition of cancel leave not equal to 2 and 8')
                let o_leaveBalRec = nlapiLoadRecord('customrecord_hris_leavebalance', Leave_id);
                let leave_bal_taken = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_take') || 0;
                TotalLeaveBalTaken = parseFloat(leave_bal_taken) - parseFloat(No_of_Leave_Days);
                let Leave_bal_credited = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_leave_balance_cred') || 0;
                let available_leave_bal = parseFloat(Leave_bal_credited) - parseFloat(TotalLeaveBalTaken)
                o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_leave_balance_take', parseFloat(TotalLeaveBalTaken).toFixed(2))
                o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_available_leave_ba', parseFloat(available_leave_bal).toFixed(2))
                let b_leaveEnchashment = o_leaveApp.getFieldValue("custrecord_hris_lve_applylveencashment");
                nlapiLogExecution("debug", "b_leaveEnchashment", b_leaveEnchashment);
                //by florence
                if (b_leaveEnchashment == "T" && LeaveCancelSTATUS == '2') {
                    //if (b_leaveEnchashment == "T" ) {   
                    let i_noOfLeaveEnchashed = o_leaveApp.getFieldValue("custrecord_hris_lve_noofencashmentdays");
                    if (i_noOfLeaveEnchashed) {
                        i_noOfLeaveEnchashed = parseFloat(i_noOfLeaveEnchashed);
                    } else {
                        i_noOfLeaveEnchashed = 0
                    }
                    nlapiLogExecution("debug", "i_noOfLeaveEnchashed", i_noOfLeaveEnchashed)
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
                    nlapiLogExecution("debug", "TotalLeaveBalTaken", TotalLeaveBalTaken)
                    let total_available_leave_bal = parseFloat(Leave_bal_credited) - parseFloat(TotalLeaveBalTaken);
                    nlapiLogExecution("debug", "total_available_leave_bal", total_available_leave_bal)
                    let i_encashDaysTaken = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_encashable_days_ta');
                    if (i_encashDaysTaken) {
                        i_encashDaysTaken = parseFloat(i_encashDaysTaken);
                    } else {
                        i_encashDaysTaken = 0
                    }

                    let i_additionalEncashment = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_additional_encasha');
                    if (i_additionalEncashment) {
                        i_additionalEncashment = parseFloat(i_additionalEncashment);
                    } else {
                        i_additionalEncashment = 0
                    }
                    let remainEncashmentDays = parseFloat(i_encashDaysTaken) - parseFloat(i_noOfLeaveEnchashed);
                    let remainAdditionalEncashmentDays = parseFloat(i_additionalEncashment) - parseFloat(i_noOfLeaveEnchashed)
                    o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_additional_encasha', parseFloat(remainAdditionalEncashmentDays).toFixed(2))
                    o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_encashable_days_ta', parseFloat(remainEncashmentDays).toFixed(2))
                    o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_leave_balance_take', parseFloat(TotalLeaveBalTaken).toFixed(2))
                    o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_available_leave_ba', parseFloat(total_available_leave_bal).toFixed(2))
                    available_leave_bal = total_available_leave_bal;
                    nlapiLogExecution("debug", "available_leave_bal", available_leave_bal)
                }
                let submitLeavebalRec = nlapiSubmitRecord(o_leaveBalRec, true, true);
                o_leaveApp.setFieldValue('custrecord_hris_lve_cancellve_approval', 'T');
                o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance', parseFloat(available_leave_bal).toFixed(2));
                let round_available_leave_bal =  parseFloat(available_leave_bal).toFixed(2);
                round_available_leave_bal = GetRoundOffvalue(round_available_leave_bal);
                o_leaveApp.setFieldValue('custrecord_hris_lve_leavebalance_wholeno',  round_available_leave_bal); 




            }

        }
// by florence
       if (LeaveCancellation_Status == '3' && Leave_cancellation_approval_Check == 'F') {
        
         //   if (Leave_cancellation_approval_Check == 'F') {    
            o_leaveApp.setFieldValue('custrecord_hris_lve_cancellve_approval', 'T');
        }

        let leave_Encash_status = nlapiGetFieldValue('custrecord_hris_lve_encashstatus');
        let Leave_encashment_approval_Check = nlapiGetFieldValue('custrecord_hris_lve_encash_approval');
        //by florence for encashment early approval
        //if (leave_Encash_status == '2' && Leave_encashment_approval_Check == 'F' && workResumeChkBx == 'F') {
            
            if (LeaveApplication_Status == '2' && leave_Encash_status == '2' && Leave_encashment_approval_Check == 'F' && workResumeChkBx == 'F') {
         
            //   if (Leave_encashment_approval_Check == 'F' && workResumeChkBx == 'F') {   
            let Leave_id = SearchLeaveBalanceMaster(emp_Id, Leave_type);

            let o_leaveBalRec = nlapiLoadRecord('customrecord_hris_leavebalance', Leave_id);
            let Encash_bal = o_leaveBalRec.getFieldValue('custrecord_hris_lvbal_encashable_days');
            let EncashDays = nlapiGetFieldValue('custrecord_hris_lve_noofencashmentdays');
            totalEncash = parseFloat(Encash_bal) - parseFloat(EncashDays)
            o_leaveBalRec.setFieldValue('custrecord_hris_lvbal_encashable_days', totalEncash)
            let submitLeavebalRec = nlapiSubmitRecord(o_leaveBalRec, true, true);
            nlapiLogExecution('DEBUG', 'after Submit', 'submitLeavebalRec=' + submitLeavebalRec);
            o_leaveApp.setFieldValue('custrecord_hris_lve_encash_approval', 'T')
            o_leaveApp.setFieldValue('custrecord_hris_lve_encashmentlevbalance', totalEncash);
        }
        nlapiSubmitRecord(o_leaveApp, true, true);
    }
}

function SearchLeaveBalanceMaster(emp_Id, Leave_type) {
    nlapiLogExecution('DEBUG', 'WFH ', 'emp_Id --> ' + emp_Id)

    nlapiLogExecution('DEBUG', 'WFH ', 'Leave_type --> ' + Leave_type)

    let LeaveType_id;
    let Filters = new Array();
    Filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', emp_Id));
    Filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', Leave_type));
    let Column = new Array();
    Column.push(new nlobjSearchColumn('internalid'));

    let LeaveBalanceSearchResult = nlapiSearchRecord('customrecord_hris_leavebalance', null, Filters, Column);
    if (LeaveBalanceSearchResult != null) {
        LeaveType_id = LeaveBalanceSearchResult[0].getValue('internalid');
        nlapiLogExecution('DEBUG', 'WFH ', 'LeaveType_id --> ' + LeaveType_id)
    }
    return LeaveType_id;
}




function get_sequence_no(leave_type) {
    let sequence_no = ''
    let filters = new Array();
    let columns = new Array();

    filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
    //  filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type))
    columns.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_seqno'));

    let compoff_record_result = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, columns);

    if (compoff_record_result != null) {

        sequence_no = compoff_record_result[0].getValue('custrecord_hris_lvecnfg_seqno')

        nlapiLogExecution('DEBUG', 'WFH ', 'sequence_no --> ' + sequence_no)
    }
    return sequence_no;
}


function get_paygroup(employee_id) {
    let filters = new Array();
    let columns = new Array();
    filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_id));
    filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))

    let result = nlapiSearchRecord('customrecord_hris_employee_compen_change', null, filters, columns)

    if (result != null) {
        let paygroup = result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp')
    }
    return paygroup;
}


function get_wagedetails(search_pay_grp) {
    let filters = new Array();
    let columns = new Array();
    filters.push(new nlobjSearchFilter('custrecord_hris_pay_group', null, 'is', search_pay_grp))
    filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));

    columns.push(new nlobjSearchColumn('custrecord_hris_end_date'))
    columns.push(new nlobjSearchColumn('custrecord_hris_start_date'))
    columns.push(new nlobjSearchColumn('internalid'));
    columns.push(columns[2].setSort(true));


    let result = nlapiSearchRecord('customrecord_hris_wage_period_details', null, filters, columns)

    if (result != null) {
        let end_date = result[0].getValue('custrecord_hris_end_date')

        let start_date = result[0].getValue('custrecord_hris_start_date')
    }
    return end_date + "#" + start_date;
}


function firstMonthUnpaidEntry(unpaidCheck, halfPaidCheck, refNumber, emp_Id, Leave_type, firstMonthDays, search_pay_grp, leaveReason, end_date, get_month, YearId, recordId) {

    end_date = formatedDate(end_date);
    let unpLeavRecord = nlapiCreateRecord('customrecord_hris_unpaid_leave_entry');
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
    let createdRecordID = nlapiSubmitRecord(unpLeavRecord);
    nlapiLogExecution('DEBUG', 'Unpaid Leave Entry First Month', createdRecordID);




}


function lastMonthUnpaidEntry(unpaidCheck, halfPaidCheck, refNumber, emp_Id, Leave_type, lastMonthDays, search_pay_grp, leaveReason, end_date, get_month, YearId, recordId) {
    end_date = formatedDate(end_date);
    let unpLeavRecord = nlapiCreateRecord('customrecord_hris_unpaid_leave_entry');
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
    let createdRecordID = nlapiSubmitRecord(unpLeavRecord);
    nlapiLogExecution('DEBUG', 'Unpaid Leave Entry Last Month', createdRecordID);



}

function unpaidEntryForMoreThanOneMonth(count, fromDate, unpaidCheck, halfPaidCheck, refNumber, emp_Id, Leave_type, lastMonthDays, search_pay_grp, leaveReason, get_month, YearId, recordId, o_leaveApp) {
    count = count;
    nlapiLogExecution('DEBUG', 'Intgration refNumber', refNumber);
    for (let index = '0'; index < count; index++) {

        let remainMonth = new Date(fromDate.getFullYear(), fromDate.getMonth() + parseFloat(index) + 2, 0);
        let remainMonth_year = remainMonth.getFullYear();
        let remainMonth_month = remainMonth.getMonth() + 1;
        let lastdayOfEachMonth = remainMonth.getDate();
        let finalDate_toDate = remFormatedDate(remainMonth_year, remainMonth_month, lastdayOfEachMonth)
        let firstDaysOfEachMonth = '01'
        let finalDate_fromDate = remFormatedDate(remainMonth_year, remainMonth_month, firstDaysOfEachMonth)
        let totalPeriodDays = totalDaysCalculation(finalDate_fromDate, finalDate_toDate, Leave_type, o_leaveApp)

        nlapiLogExecution('DEBUG', 'Intgration finalDate_toDate', finalDate_toDate);
        let unpLeavRecord = nlapiCreateRecord('customrecord_hris_unpaid_leave_entry');
        unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_reference_no', recordId);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_employee_name', emp_Id);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_type', Leave_type);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_noof_days', totalPeriodDays);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_pay_group', search_pay_grp);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_reason', leaveReason);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_pay_date', finalDate_toDate);






        let year = remainMonth_year;
        let YearId = searchYear(year);
        nlapiLogExecution('DEBUG', 'Integration YearId inside unpaidEntryForMoreThanOneMonth', YearId)



        unpLeavRecord.setFieldValue('custrecord_hris_ule_month', remainMonth_month);
        unpLeavRecord.setFieldValue('custrecord_hris_ule_year', YearId);


        if (unpaidCheck == 'T') {
            unpLeavRecord.setFieldValue('custrecord_hris_ule_final_days', totalPeriodDays);
        } else if (halfPaidCheck == 'T') {
            unpLeavRecord.setFieldValue('custrecord_hris_ule_final_days', totalPeriodDays / 2);
        }
        let createdRecordID = nlapiSubmitRecord(unpLeavRecord);
        nlapiLogExecution('DEBUG', 'Unpaid Leave Entry For Middle Months', createdRecordID);

    }

}


function totalDaysCalculation(fromDate, toDate, leave_type, o_leaveApp) {
    nlapiLogExecution('DEBUG', 'fromDate totalDaysCalculation', fromDate);
    nlapiLogExecution('DEBUG', 'toDate totalDaysCalculation', toDate);
    let datediff = 0;
    let FrmDt;
    let ToDt;

    fromDate = fromDate;
    frmhalfDay = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');
    toDate = toDate;
    toHalfDay = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');

    {

        fromDate = nlapiStringToDate(fromDate);

        let FrmMonth = fromDate.getMonth() + 1;

        FrmDt = fromDate.getDate();



        toDate = nlapiStringToDate(toDate);

        let TOMonth = toDate.getMonth() + 1;

        ToDt = toDate.getDate();





        let getUserId = o_leaveApp.getFieldValue('custrecord_hris_lve_employeename');
        let weeklyoffIncCheck = weeklyOffInclude(leave_type);
        let holiday_TF_check = holidayInclude(leave_type)
        let empWeeklyoff = searchEmpsWeeklyOff(getUserId);
        let WEEKLYOFF = empWeeklyoff.split('#')
        let WeeklyOfCount = WEEKLYOFF[0]

        let WeeklyOffInW = WEEKLYOFF[1];



        if (WeeklyOfCount == 2 || WeeklyOfCount == 1) {

            let finalWeeklyOff = WeeklyOffInW.split(',');
            let firstWeeklyOffD = finalWeeklyOff[0];
            let secWeeklyOffD = finalWeeklyOff[1];

            if (FrmMonth == TOMonth) {
                if (weeklyoffIncCheck == 'T') {


                    let frm_halfday = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');
                    let to_halfday = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');

                    if (frm_halfday == 'T' || to_halfday == 'T') {
                        if (holiday_TF_check == 'T') {


                            datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 0.5;


                        }
                        if (holiday_TF_check == 'F') {
                            let holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                            datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 0.5;
                            datediff = datediff - parseFloat(holiday_count);
                        }
                    }
                    if (frm_halfday == 'T' && to_halfday == 'T') {
                        if (holiday_TF_check == 'T') {
                            datediff = parseFloat(ToDt) - parseFloat(FrmDt);

                        }
                        if (holiday_TF_check == 'F') {
                            let holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                            datediff = parseFloat(ToDt) - parseFloat(FrmDt);
                            datediff = parseFloat(datediff) - parseFloat(holiday_count);
                        }
                    }
                    if (frm_halfday == 'F' && to_halfday == 'F') {


                        if (holiday_TF_check == 'T') {
                            nlapiLogExecution('DEBUG', 'bb fromDate', fromDate)
                            nlapiLogExecution('DEBUG', 'bb toDate', toDate)
                            let datediff = parseFloat(toDate.getDate()) - parseFloat(fromDate.getDate());

                            datediff = datediff + 1;

                            nlapiLogExecution('DEBUG', 'bb diffDays', datediff)



                        }
                        if (holiday_TF_check == 'F') {
                            let holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                            if (holiday_count == 0) {
                                datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                            } else {
                                datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(holiday_count) + 1;
                            }
                        }
                    }

                } else {
                    let frm_halfday = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');
                    let to_halfday = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');

                    if (frm_halfday == 'T' || to_halfday == 'T') {
                        if (holiday_TF_check == 'T') {
                            let frm_date_val = fromDate;
                            let to_date_val = toDate;


                            let frm_date_val_obj = nlapiStringToDate(frm_date_val)
                            let date_split = frm_date_val_obj.toString().split(' ');
                            let day = date_split[0];
                            let frm_week_day = WeeklyOff(day)
                            let to_date_val_obj = nlapiStringToDate(to_date_val)
                            let date_split1 = to_date_val_obj.toString().split(' ');
                            let day1 = date_split1[0];
                            let to_week_day = WeeklyOff(day1)

                            let get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                            let tot_days_count = get_all_dates.length;
                            let day_split = get_all_dates.toString().split(',')
                            let flag = 0;
                            for (let j = 0; j < tot_days_count; j++) {
                                let one_by_one_day = day_split[j]
                                if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                    flag = flag + 1;
                                }

                            }

                            if (flag == '0') {
                                datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 0.5;
                            }

                            if (flag == '1') {
                                let final_flag = parseFloat(flag) * 1
                                datediff = parseFloat(ToDt) - parseFloat(FrmDt);

                                datediff = parseFloat(datediff) - parseFloat(final_flag) + 0.5
                            }
                            if (flag == '2') {
                                let final_flag = parseFloat(flag) * 1
                                datediff = parseFloat(ToDt) - parseFloat(FrmDt);
                                datediff = parseFloat(datediff) - parseFloat(final_flag) + 0.5
                            }
                        }
                        if (holiday_TF_check == 'F') {

                            let holiday_count = searchEmpholidays(getUserId, fromDate, toDate)

                            let frm_date_val = fromDate;
                            let to_date_val = toDate;

                            let frm_date_val_obj = nlapiStringToDate(frm_date_val)

                            let date_split = frm_date_val_obj.toString().split(' ');
                            let day = date_split[0];
                            let frm_week_day = WeeklyOff(day)
                            let to_date_val_obj = nlapiStringToDate(to_date_val)
                            let date_split1 = to_date_val_obj.toString().split(' ');

                            let day1 = date_split1[0];
                            let to_week_day = WeeklyOff(day1)

                            let get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                            let tot_days_count = get_all_dates.length;
                            let day_split = get_all_dates.toString().split(',')
                            let flag = 0;
                            for (let j = 0; j < tot_days_count; j++) {
                                let one_by_one_day = day_split[j]
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
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(final_flag);
                                    datediff = parseFloat(datediff) + 0.5;
                                } else {
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(final_flag);
                                    datediff = parseFloat(datediff) - parseFloat(holiday_count) + 0.5;
                                }
                            }
                            if (flag == '2') {
                                if (holiday_count == 0) {
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(final_flag);
                                    datediff = parseFloat(datediff) + 0.5;
                                } else {
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(final_flag);
                                    datediff = parseFloat(datediff) - parseFloat(holiday_count) + 0.5;
                                }
                            }
                        }
                    }
                    if (frm_halfday == 'T' && to_halfday == 'T') {

                        if (holiday_TF_check == 'T') {
                            let frm_date_val = fromDate;
                            let to_date_val = toDate;


                            let frm_date_val_obj = nlapiStringToDate(frm_date_val)
                            let date_split = frm_date_val_obj.toString().split(' ');
                            let day = date_split[0];
                            let frm_week_day = WeeklyOff(day)
                            let to_date_val_obj = nlapiStringToDate(to_date_val)
                            let date_split1 = to_date_val_obj.toString().split(' ');
                            let day1 = date_split1[0];
                            let to_week_day = WeeklyOff(day1)

                            let get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                            let tot_days_count = get_all_dates.length;
                            let day_split = get_all_dates.toString().split(',')
                            let flag = 0;
                            for (let j = 0; j < tot_days_count; j++) {
                                let one_by_one_day = day_split[j]
                                if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                    flag = flag + 1;
                                }

                            }

                            if (flag == '0') {
                                datediff = parseFloat(ToDt) - parseFloat(FrmDt);
                            }

                            if (flag == '1') {
                                let final_flag = parseFloat(flag) * 1

                                datediff = parseFloat(ToDt) - parseFloat(FrmDt);
                                datediff = parseFloat(datediff) - parseFloat(final_flag);
                            }
                            if (flag == '2') {
                                let final_flag = parseFloat(flag) * 1

                                datediff = parseFloat(ToDt) - parseFloat(FrmDt);
                                datediff = parseFloat(datediff) - parseFloat(final_flag);

                            }
                        }
                        if (holiday_TF_check == 'F') {

                            let holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                            let frm_date_val = fromDate;
                            let to_date_val = toDate;

                            let frm_date_val_obj = nlapiStringToDate(frm_date_val)
                            let date_split = frm_date_val_obj.toString().split(' ');
                            let day = date_split[0];
                            let frm_week_day = WeeklyOff(day)
                            let to_date_val_obj = nlapiStringToDate(to_date_val)
                            let date_split1 = to_date_val_obj.toString().split(' ');
                            let day1 = date_split1[0];
                            let to_week_day = WeeklyOff(day1)

                            let get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                            let tot_days_count = get_all_dates.length;
                            let day_split = get_all_dates.toString().split(',')
                            let flag = 0;
                            for (let j = 0; j < tot_days_count; j++) {
                                let one_by_one_day = day_split[j]
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
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(final_flag);
                                } else {
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(final_flag);
                                    datediff = parseFloat(datediff) - parseFloat(holiday_count);
                                }
                            }
                            if (flag == '2') {
                                if (holiday_count == 0) {
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(final_flag);
                                } else {
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(final_flag);
                                    datediff = parseFloat(datediff) - parseFloat(holiday_count);
                                }
                            }

                        }

                    }
                    if (frm_halfday == 'F' && to_halfday == 'F') {
                        if (holiday_TF_check == 'T') {

                            let frm_date_val = fromDate;
                            let to_date_val = toDate;
                            let frm_date_val_obj = nlapiStringToDate(frm_date_val)
                            let date_split = frm_date_val_obj.toString().split(' ');
                            let day = date_split[0];
                            let frm_week_day = WeeklyOff(day)
                            let to_date_val_obj = nlapiStringToDate(to_date_val)
                            let date_split1 = to_date_val_obj.toString().split(' ');
                            let day1 = date_split1[0];
                            let to_week_day = WeeklyOff(day1)
                            let get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                            let tot_days_count = get_all_dates.length;
                            let day_split = get_all_dates.toString().split(',')
                            let flag = 0;
                            for (let j = 0; j < tot_days_count; j++) {

                                let one_by_one_day = day_split[j]
                                if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                    flag = flag + 1;
                                }

                            }
                            if (flag == '0') {
                                datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                            }
                            if (flag == '1') {
                                let final_flag = parseFloat(flag) * 1
                                datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                            }
                            if (flag == '2') {
                                let final_flag = parseFloat(flag) * 1
                                datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                            }
                            if (flag > '2') {
                                let final_flag = parseFloat(flag) * 1
                                datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                            }
                        }
                        if (holiday_TF_check == 'F') {

                            let holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                            nlapiLogExecution('DEBUG', 'aa holiday_count', holiday_count);

                            let frm_date_val = fromDate;
                            let to_date_val = toDate;

                            let frm_date_val_obj = nlapiStringToDate(frm_date_val)
                            let date_split = frm_date_val_obj.toString().split(' ');
                            let day = date_split[0];
                            let frm_week_day = WeeklyOff(day)

                            let to_date_val_obj = nlapiStringToDate(to_date_val)
                            let date_split1 = to_date_val_obj.toString().split(' ');
                            let day1 = date_split1[0];
                            let to_week_day = WeeklyOff(day1)

                            let get_all_dates = get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt)
                            nlapiLogExecution('DEBUG', 'aa excluded_weeklyoff_days', get_all_dates);

                            let tot_days_count = get_all_dates.length;
                            nlapiLogExecution('DEBUG', 'aa tot_days_count', tot_days_count)

                            let day_split = get_all_dates.toString().split(',')
                            nlapiLogExecution('DEBUG', 'aa day_split', day_split);
                            let flag = 0;
                            nlapiLogExecution('DEBUG', 'aa WeeklyOfCount', WeeklyOfCount)
                            for (let j = 0; j < tot_days_count; j++) {


                                let one_by_one_day = day_split[j]

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
                            nlapiLogExecution('DEBUG', 'abb flag', flag)

                            if (flag == '0') {
                                if (holiday_count == 0) {
                                    nlapiLogExecution('DEBUG', 'Inside flag 0')
                                    datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                } else {
                                    let datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(holiday_count) + 1;
                                }
                            }
                            if (flag == '1') {
                                if (holiday_count == 0) {
                                    nlapiLogExecution('DEBUG', 'Inside flag 1')
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                } else {
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = (((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                }
                            }
                            if (flag == '2') {
                                if (holiday_count == 0) {
                                    nlapiLogExecution('DEBUG', 'Inside flag 2')
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                } else {
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = (((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                }

                            }
                            if (flag > '2') {
                                nlapiLogExecution('DEBUG', 'Inside flag  > 2')
                                nlapiLogExecution('DEBUG', 'aa ToDt', ToDt);
                                nlapiLogExecution('DEBUG', 'aa FrmDt', FrmDt);

                                let final_flag = parseFloat(flag) * 1
                                nlapiLogExecution('DEBUG', 'aa final_flag', final_flag);
                                datediff = (((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag)) - parseFloat(holiday_count);
                            }
                        }
                    }

                }

            }
            else {
                if (weeklyoffIncCheck == 'T') {
                    let frm_halfday = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');
                    let to_halfday = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');
                    if (frm_halfday == 'T' || to_halfday == 'T') {
                        if (holiday_TF_check == 'T') {

                            let monthdays = getArryMonthDays(FrmMonth);
                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                            let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                            let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                            finaldays = finaldays + 1;
                            datediff = parseFloat(finaldays) + 0.5;
                        }
                        if (holiday_TF_check == 'F') {
                            let monthdays = getArryMonthDays(FrmMonth);
                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                            let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                            let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                            finaldays = finaldays + 1;
                            let holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                            datediff = parseFloat(finaldays) + 0.5;
                            datediff = datediff - parseFloat(holiday_count);

                        }
                    }
                    if (frm_halfday == 'T' && to_halfday == 'T') {
                        if (holiday_TF_check == 'T') {
                            let monthdays = getArryMonthDays(FrmMonth);
                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                            let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                            let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                            finaldays = finaldays + 1;
                            datediff = parseFloat(finaldays);
                        }
                        if (holiday_TF_check == 'F') {
                            let monthdays = getArryMonthDays(FrmMonth);
                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                            let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                            let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                            finaldays = finaldays + 1;
                            let holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                            datediff = parseFloat(finaldays) - parseFloat(holiday_count);

                        }

                    }

                    if (frm_halfday == 'F' && to_halfday == 'F') {
                        if (holiday_TF_check == 'T') {

                            let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());

                            let datediff = Math.ceil(timeDiff / (1000 * 3600 * 24));

                            datediff = datediff + 1;
                            nlapiLogExecution('DEBUG', 'bb datediff', datediff)

                        }
                        if (holiday_TF_check == 'F') {
                            let holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                            nlapiLogExecution('DEBUG', 'bb holiday_count', holiday_count)
                            if (holiday_count == 0) {
                                let monthdays = getArryMonthDays(FrmMonth);
                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                let datediff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                datediff = datediff + 1;
                                nlapiLogExecution('DEBUG', 'bbb datediff', datediff)

                            } else {
                                let monthdays = getArryMonthDays(FrmMonth);
                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;

                                let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                let datediff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                datediff = datediff + 1;
                                datediff = datediff - parseFloat(holiday_count);
                                nlapiLogExecution('DEBUG', 'bbbb datediff', datediff)
                            }
                        }
                    }

                }
                else {
                    let frm_halfday = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');
                    let to_halfday = o_leaveApp.getFieldValue('custrecord_hris_lve_tohalfday');

                    if (frm_halfday == 'T' || to_halfday == 'T') {
                        if (holiday_TF_check == 'T') {
                            let monthdays = getArryMonthDays(FrmMonth);
                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                            let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                            let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                            let frm_date_val = fromDate;
                            let to_date_val = toDate;
                            monthdays = getArryMonthDays(FrmMonth);
                            firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                            let frm_date_val_obj = nlapiStringToDate(frm_date_val)
                            let date_split = frm_date_val_obj.toString().split(' ');
                            let day = date_split[0];
                            let frm_week_day = WeeklyOff(day)
                            let to_date_val_obj = nlapiStringToDate(to_date_val)
                            let date_split1 = to_date_val_obj.toString().split(' ');
                            let day1 = date_split1[0];
                            let to_week_day = WeeklyOff(day1)
                            let get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                            let tot_days_count = get_all_dates.length;
                            let day_split = get_all_dates.toString().split(',')
                            let flag = 0;
                            for (let j = 0; j < tot_days_count; j++) {
                                let one_by_one_day = day_split[j]
                                if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                    flag = flag + 1;
                                }

                            }
                            if (flag == '0') {
                                datediff = parseFloat(finaldays) + 0.5;
                                datediff = parseFloat(datediff) - 1;
                            }
                            if (flag == '1') {
                                let final_flag = parseFloat(flag) * 1
                                datediff = parseFloat(finaldays) - parseFloat(final_flag) + 0.5;
                                datediff = parseFloat(datediff) - 1;
                            }
                            if (flag == '2') {
                                let final_flag = parseFloat(flag) * 1
                                datediff = parseFloat(finaldays) - parseFloat(final_flag) + 0.5;
                                datediff = parseFloat(datediff) - 1;
                            }
                            if (flag > '2') {
                                let final_flag = parseFloat(flag) * 1
                                datediff = parseFloat(finaldays) - parseFloat(final_flag) + 0.5;
                                datediff = parseFloat(datediff) - 1;
                            }
                        }
                        if (holiday_TF_check == 'F') {
                            let monthdays = getArryMonthDays(FrmMonth);
                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                            let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                            let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                            let holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                            let frm_date_val = fromDate;
                            let to_date_val = toDate;
                            monthdays = getArryMonthDays(FrmMonth);
                            firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                            let frm_date_val_obj = nlapiStringToDate(frm_date_val)
                            let date_split = frm_date_val_obj.toString().split(' ');
                            let day = date_split[0];
                            let frm_week_day = WeeklyOff(day)
                            let to_date_val_obj = nlapiStringToDate(to_date_val)
                            let date_split1 = to_date_val_obj.toString().split(' ');
                            let day1 = date_split1[0];
                            let to_week_day = WeeklyOff(day1)
                            let get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                            let tot_days_count = get_all_dates.length;
                            let day_split = get_all_dates.toString().split(',')
                            let flag = 0;
                            for (let j = 0; j < tot_days_count; j++) {
                                let one_by_one_day = day_split[j]
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
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = parseFloat(finaldays) + 0.5;
                                    datediff = parseFloat(datediff) - parseFloat(final_flag);
                                } else {
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = parseFloat(finaldays)
                                    datediff = (parseFloat(datediff) - parseFloat(final_flag)) - parseFloat(holiday_count) + 0.5;
                                }

                            }
                            if (flag == '2') {
                                if (holiday_count == 0) {
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = parseFloat(finaldays) + 0.5;
                                    datediff = parseFloat(datediff) - parseFloat(final_flag);
                                } else {
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = parseFloat(finaldays) + 0.5;
                                    datediff = (parseFloat(datediff) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                }
                            }
                            if (flag > '2') {
                                if (holiday_count == 0) {
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = parseFloat(finaldays) + 0.5;
                                    datediff = parseFloat(datediff) - parseFloat(final_flag);
                                } else {
                                    let final_flag = parseFloat(flag) * 1
                                    datediff = parseFloat(finaldays) + 0.5;
                                    datediff = (parseFloat(datediff) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                    datediff = datediff + 1;
                                }
                            }
                        }
                    }
                    if (frm_halfday == 'T' && to_halfday == 'T') {
                        if (holiday_TF_check == 'T') {
                            let monthdays = getArryMonthDays(FrmMonth);
                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                            let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                            let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                            finaldays = finaldays + 1;
                            let frm_date_val = fromDate;
                            let to_date_val = toDate;
                            monthdays = getArryMonthDays(FrmMonth);
                            firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                            let frm_date_val_obj = nlapiStringToDate(frm_date_val)
                            let date_split = frm_date_val_obj.toString().split(' ');
                            let day = date_split[0];
                            let frm_week_day = WeeklyOff(day)
                            let to_date_val_obj = nlapiStringToDate(to_date_val)
                            let date_split1 = to_date_val_obj.toString().split(' ');
                            let day1 = date_split1[0];
                            let to_week_day = WeeklyOff(day1)
                            let get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                            let tot_days_count = get_all_dates.length;
                            let day_split = get_all_dates.toString().split(',')
                            let flag = 0;
                            for (let j = 0; j < tot_days_count; j++) {
                                let one_by_one_day = day_split[j]
                                if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                    flag = flag + 1;
                                }

                            }
                            if (flag == '0') {
                                datediff = parseFloat(finaldays);
                            }
                            if (flag == '1') {
                                let final_flag = parseFloat(flag) * 1

                                datediff = parseFloat(finaldays) - parseFloat(final_flag);
                            }
                            if (flag == '2') {
                                let final_flag = parseFloat(flag) * 1
                                datediff = parseFloat(finaldays) - parseFloat(final_flag);
                            }
                            if (flag > '2') {
                                let final_flag = parseFloat(flag) * 1
                                datediff = parseFloat(finaldays) - parseFloat(final_flag);
                            }
                        }

                        if (holiday_TF_check == 'F') {
                            let monthdays = getArryMonthDays(FrmMonth);
                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                            let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                            let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                            finaldays = finaldays + 1;
                            let holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                            let frm_date_val = o_leaveApp.getFieldValue('custrecord_hris_lve_fromdate')
                            let to_date_val = o_leaveApp.getFieldValue('custrecord_hris_lve_todate')
                            monthdays = getArryMonthDays(FrmMonth);
                            firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                            let frm_date_val_obj = nlapiStringToDate(frm_date_val)
                            let date_split = frm_date_val_obj.toString().split(' ');
                            let day = date_split[0];
                            let frm_week_day = WeeklyOff(day)
                            let to_date_val_obj = nlapiStringToDate(to_date_val)
                            let date_split1 = to_date_val_obj.toString().split(' ');
                            let day1 = date_split1[0];
                            let to_week_day = WeeklyOff(day1)
                            let get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                            let tot_days_count = get_all_dates.length;
                            let day_split = get_all_dates.toString().split(',')
                            let flag = 0;
                            for (let j = 0; j < tot_days_count; j++) {
                                let one_by_one_day = day_split[j]
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
                                    let final_flag = parseFloat(flag) * 1;
                                    datediff = parseFloat(finaldays) - parseFloat(final_flag);
                                } else {
                                    let final_flag = parseFloat(flag) * 1;
                                    datediff = parseFloat(finaldays) - parseFloat(final_flag)
                                    datediff = parseFloat(datediff) - parseFloat(holiday_count);
                                }

                            }
                            if (flag == '2') {
                                if (holiday_count == 0) {
                                    let final_flag = parseFloat(flag) * 1;
                                    datediff = parseFloat(finaldays);
                                    datediff = parseFloat(datediff) - parseFloat(final_flag);
                                } else {
                                    let final_flag = parseFloat(flag) * 1;
                                    datediff = parseFloat(finaldays) - parseFloat(final_flag);
                                    datediff = parseFloat(datediff) - parseFloat(holiday_count);
                                }
                            }
                            if (flag > '2') {
                                if (holiday_count == 0) {
                                    let final_flag = parseFloat(flag) * 1;
                                    datediff = parseFloat(finaldays);
                                    datediff = parseFloat(datediff) - parseFloat(final_flag);
                                } else {
                                    let final_flag = parseFloat(flag) * 1;
                                    datediff = parseFloat(finaldays) - parseFloat(final_flag);
                                    datediff = parseFloat(datediff) - parseFloat(holiday_count);
                                }
                            }
                        }
                    }
                    if (frm_halfday == 'F' && to_halfday == 'F') {
                        if (holiday_TF_check == 'T') {
                            let frm_date_val = fromDate;
                            let to_date_val = toDate
                            let monthdays = getArryMonthDays(FrmMonth);
                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                            let frm_date_val_obj = nlapiStringToDate(frm_date_val)
                            let date_split = frm_date_val_obj.toString().split(' ');
                            let day = date_split[0];
                            let frm_week_day = WeeklyOff(day)
                            let to_date_val_obj = nlapiStringToDate(to_date_val)
                            let date_split1 = to_date_val_obj.toString().split(' ');
                            let day1 = date_split1[0];
                            let to_week_day = WeeklyOff(day1)
                            let get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                            let tot_days_count = get_all_dates.length;
                            let day_split = get_all_dates.toString().split(',')
                            let flag = 0;
                            for (let j = 0; j < tot_days_count; j++) {

                                let one_by_one_day = day_split[j]
                                if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                    flag = flag + 1;

                                }

                            }
                            if (flag == '0') {
                                let monthdays = getArryMonthDays(FrmMonth);
                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                finaldays = finaldays + 1;
                            }

                            if (flag == '1') {
                                let final_flag = parseFloat(flag) * 1
                                let monthdays = getArryMonthDays(FrmMonth);
                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);

                                let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                finaldays = finaldays + 1;
                                finaldays = finaldays - parseFloat(final_flag);
                            }
                            if (flag == '2') {
                                let final_flag = parseFloat(flag) * 1
                                let monthdays = getArryMonthDays(FrmMonth);
                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);

                                let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                finaldays = finaldays + 1;
                                finaldays = finaldays - parseFloat(final_flag);
                            }
                            if (flag > '2') {
                                let final_flag = parseFloat(flag) * 1


                                let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                finaldays = finaldays + 1 - parseFloat(final_flag);
                            }
                        }
                        if (holiday_TF_check == 'F') {
                            let holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                            let frm_date_val = o_leaveApp.getFieldValue('custrecord_hris_lve_fromdate')
                            let to_date_val = o_leaveApp.getFieldValue('custrecord_hris_lve_todate')
                            let monthdays = getArryMonthDays(FrmMonth);
                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                            let frm_date_val_obj = nlapiStringToDate(frm_date_val)
                            let date_split = frm_date_val_obj.toString().split(' ');
                            let day = date_split[0];
                            let frm_week_day = WeeklyOff(day)
                            let to_date_val_obj = nlapiStringToDate(to_date_val)
                            let date_split1 = to_date_val_obj.toString().split(' ');
                            let day1 = date_split1[0];
                            let to_week_day = WeeklyOff(day1)
                            let get_all_dates = get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt)
                            let tot_days_count = get_all_dates.length;
                            let day_split = get_all_dates.toString().split(',')
                            let flag = 0;
                            for (let j = 0; j < tot_days_count; j++) {
                                let one_by_one_day = day_split[j]
                                if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                    flag = flag + 1;

                                }

                            }
                            if (flag == '0') {
                                nlapiLogExecution('DEBUG', 'inside flag 0')
                                if (holiday_count == 0) {
                                    let monthdays = getArryMonthDays(FrmMonth);
                                    nlapiLogExecution('DEBUG', 'aa monthDays', monthdays);
                                    let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);

                                    let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                    let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                    finaldays = finaldays + 1;
                                } else {
                                    let monthdays = getArryMonthDays(FrmMonth);
                                    let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);

                                    let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                    let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                    finaldays = finaldays + 1;
                                    finaldays = finaldays - parseFloat(holiday_count);
                                }
                            }
                            if (flag == '1') {
                                if (holiday_count == 0) {
                                    nlapiLogExecution('DEBUG', 'inside flag 1')
                                    let final_flag = parseFloat(flag) * 1
                                    let monthdays = getArryMonthDays(FrmMonth);
                                    let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                    let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                    let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                    finaldays = finaldays + 1;
                                    finaldays = finaldays - parseFloat(final_flag)
                                } else {
                                    let final_flag = parseFloat(flag) * 1
                                    let monthdays = getArryMonthDays(FrmMonth);
                                    let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                    let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                    let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                    finaldays = finaldays + 1;
                                    finaldays = finaldays - parseFloat(final_flag)
                                    finaldays = finaldays - parseFloat(holiday_count)
                                }
                            }
                            if (flag == '2') {
                                if (holiday_count == 0) {
                                    nlapiLogExecution('DEBUG', 'inside flag 2')
                                    let final_flag = parseFloat(flag) * 1
                                    let monthdays = getArryMonthDays(FrmMonth);
                                    let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                    let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                    let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                    finaldays = finaldays + 1;
                                    finaldays = finaldays - parseFloat(final_flag)
                                } else {
                                    let final_flag = parseFloat(flag) * 1
                                    let monthdays = getArryMonthDays(FrmMonth);
                                    let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                    let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                    let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                    finaldays = finaldays + 1;
                                    finaldays = finaldays - parseFloat(final_flag)
                                    finaldays = finaldays - parseFloat(holiday_count)

                                }
                            }
                            if (flag > '2') {
                                if (holiday_count == 0) {
                                    nlapiLogExecution('DEBUG', 'inside flag  > 2')
                                    let final_flag = parseFloat(flag) * 1
                                    let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                    let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                    nlapiLogExecution('DEBUG', 'aab finaldays', finaldays);
                                    nlapiLogExecution('DEBUG', 'aab final_flag', final_flag);
                                    nlapiLogExecution('DEBUG', 'aab toDate', toDate);
                                    nlapiLogExecution('DEBUG', 'aab fromDate', fromDate);
                                    finaldays = parseFloat(finaldays) - parseFloat(final_flag);
                                } else {
                                    let final_flag = parseFloat(flag) * 1

                                    let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                    let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
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
    nlapiLogExecution('DEBUG', 'aa datediff', datediff);
    nlapiLogExecution('DEBUG', 'aa finaldays', finaldays);

    return datediff;
}

function weeklyOffInclude(leave_type) {

    let weeklyoffCheck = false;
    let filters = new Array();
    let column = new Array();
    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))

        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_includeweekoff'));
        let leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
        if (leaveTypeConfigWO != null) {
            weeklyoffCheck = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_includeweekoff')
        }
        return weeklyoffCheck;

    }


}


function holidayInclude(leave_type) {

    let holidayCheck = false;
    let filters = new Array();
    let column = new Array();
    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))

        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_includeholiday'));
        let leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
        if (leaveTypeConfigWO != null) {
            holidayCheck = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_includeholiday')
        }

    }

    return holidayCheck;
}






function searchEmpsWeeklyOff(getUserId) {

    let Count = 0;
    let weekly_Count = new Array();
    let EmployeeWeeklyOff = nlapiSearchRecord("customrecord_hris_employeedatasourcing", null,
        [
            ["custrecord_hris_eds_employee", "anyof", getUserId]
        ],
        [
            new nlobjSearchColumn("custrecord_hris_eds_employee"),
            new nlobjSearchColumn("custrecord_hris_eds_employeeweeklyoff"),
            new nlobjSearchColumn("custrecord_hris_eds_employeeholidays"),
            new nlobjSearchColumn("internalid")
        ]
    );

    if (EmployeeWeeklyOff != null) {
        let s_weeklyoff = EmployeeWeeklyOff[0].getValue('custrecord_hris_eds_employeeweeklyoff')
        nlapiLogExecution('DEBUG', 's_weeklyoff length', s_weeklyoff)
        nlapiLogExecution('DEBUG', 's_weeklyoff internal ID', EmployeeWeeklyOff[0].getValue('internalid'))
        if (s_weeklyoff.length == 3) {
            let split_s_weeklyoff = s_weeklyoff.toString().split(',')

            let split_s_weeklyoff_1 = split_s_weeklyoff[0]

            Count++;
            let split_s_weeklyoff_2 = split_s_weeklyoff[1]

            Count++;
            weekly_Count.push(split_s_weeklyoff_1 + "##" + split_s_weeklyoff_2)
        } else
            if (s_weeklyoff.length == 1) {
                let split_s_weeklyoff_1 = s_weeklyoff[0]
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
    let fromdate = fromDate;
    let todate = toDate;
    nlapiLogExecution('DEBUG', 'searchEmpholidays fromDate', fromDate)
    nlapiLogExecution('DEBUG', 'searchEmpholidays toDate', toDate)
    let holiday_date;
    let count = 0;
    let all_holiday_dates = new Array();
    let filters = new Array();
    let column = new Array();
    let s_holiday = new Array();
    let get_holiday_filters = new Array();
    let get_holiday_column = new Array();
    let emp_holidays = [];

    let Employee_holiday_searchResult = nlapiSearchRecord("customrecord_hris_employeedatasourcing", null,
        [
            ["custrecord_hris_eds_employee", "anyof", getUserId]
        ],
        [
            new nlobjSearchColumn("custrecord_hris_eds_employee"),
            new nlobjSearchColumn("custrecord_hris_eds_employeeweeklyoff"),
            new nlobjSearchColumn("custrecord_hris_eds_employeeholidays")
        ]
    );
    for (let i = 0; i < Employee_holiday_searchResult.length; i++) {
        let holidayList = Employee_holiday_searchResult[0].getValue('custrecord_hris_eds_employeeholidays');
        holidayList = holidayList.split(',')
    };


    nlapiLogExecution('DEBUG', 'Employee_holiday_searchResult length', Employee_holiday_searchResult.length)
    for (let holidayCount = 0; holidayCount < holidayList.length; holidayCount++) {
        let holidayId = holidayList[holidayCount];
        let holidayDate = nlapiLookupField('customrecord_hris_holiday_master', holidayId, 'custrecord_hris_holiday_date');
        let isInactive = nlapiLookupField('customrecord_hris_holiday_master', holidayId, 'isinactive');
        holidayDate = nlapiStringToDate(holidayDate);
        nlapiLogExecution('DEBUG', 'holidayDate', holidayDate);
        if ((holidayDate >= fromDate) && (holidayDate <= toDate) && isInactive == 'F') {

            count = count + 1;

        }

    }

    return count;
}




function searchYear(year) {
    let yearVal = '';
    year = year.toString();
    nlapiLogExecution('DEBUG', 'Year in searchYear function', year);
    let filter = [];
    filter.push(new nlobjSearchFilter('name', null, 'contains', year));
    filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));

    let column = [];
    column.push(new nlobjSearchColumn('internalid'));

    let search = nlapiSearchRecord('customlist_hris_year_master', null, filter, column);
    if (search) {
        yearVal = search[0].getValue('internalid')
    }
    nlapiLogExecution('DEBUG', 'yearVal in SearchYear  Func', yearVal);
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

    let date_format = checkDateFormat();
    let endDate = nlapiStringToDate(end_date);
    let year = endDate.getFullYear();
    nlapiLogExecution('DEBUG', 'formated year', year)
    let Anvr_month = endDate.getMonth() + 1;
    nlapiLogExecution('DEBUG', 'formated Anvr_month', Anvr_month)
    let Anvr_DateVal = endDate.getDate();
    nlapiLogExecution('DEBUG', 'formated Anvr_DateVal', Anvr_DateVal)

    if (date_format == 'YYYY-MM-DD') {
        let newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
    }
    if (date_format == 'DD/MM/YYYY') {
        let newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;

    }
    if (date_format == 'MM/DD/YYYY') {
        let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
    }
    if (date_format == 'M/D/YYYY') {
        let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
    }

    if (date_format == 'DD-MM-YYYY') {
        let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
    }

    if (date_format == 'DD-Mon-YYYY') {
        let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
    }

    if (date_format == 'DD.MM.YYYY') {
        let newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
    }
    if (date_format == 'DD-Month-YYYY') {
        let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
    }
    if (date_format == 'YYYY/MM/DD') {
        let newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
    }

    if (date_format == 'DD MONTH, YYYY') {

        let newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;

    }
    nlapiLogExecution('DEBUG', 'formated newDate', newDate);
    return newDate;

}

function remFormatedDate(remainMonth_year, remainMonth_month, lastdayOfEachMonth) {

    let date_format = checkDateFormat();
    let year = remainMonth_year;
    let Anvr_month = remainMonth_month
    let Anvr_DateVal = lastdayOfEachMonth;

    if (date_format == 'YYYY-MM-DD') {
        let newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
    }
    if (date_format == 'DD/MM/YYYY') {
        let newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;

    }
    if (date_format == 'MM/DD/YYYY') {
        let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
    }
    if (date_format == 'M/D/YYYY') {
        let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
    }

    if (date_format == 'DD-MM-YYYY') {
        let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
    }

    if (date_format == 'DD-Mon-YYYY') {
        let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
    }

    if (date_format == 'DD.MM.YYYY') {
        let newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
    }
    if (date_format == 'DD-Month-YYYY') {
        let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
    }
    if (date_format == 'YYYY/MM/DD') {
        let newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
    }

    if (date_format == 'DD MONTH, YYYY') {

        let newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;

    }

    return newDate;

}



function checkDateFormat() {
    let context = nlapiGetContext();

    let dateFormatPref = context.getPreference('dateformat');

    return dateFormatPref;
}



function getArryMonthDays(FrmMonth) {

    let standard_month_days; {
        if (FrmMonth == '1' || FrmMonth == '3' || FrmMonth == '5' || FrmMonth == '7' || FrmMonth == '8' || FrmMonth == '10' || FrmMonth == '12') {
            standard_month_days = 31;
        }
        if (FrmMonth == '4' || FrmMonth == '6' || FrmMonth == '9' || FrmMonth == '11') {
            standard_month_days = 30;
        }
        else
            if (FrmMonth == '2') {
                let date = new Date()
                let year = date.getFullYear()
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

    let whole_day;
    let filters = new Array();
    filters.push(new nlobjSearchFilter('name', null, 'startswith', DaysW))

    let column = new Array();

    column.push(new nlobjSearchColumn('internalid'));

    let whole_day_search = nlapiSearchRecord('customlist_hris_week_days', null, filters, column);

    if (whole_day_search != null) {
        whole_day = whole_day_search[0].getValue('internalid')

    }
    return whole_day;
}


function get_excluded_weeklyoff_days_for_different_months(firstMonthDays, fromDate, toDate, FrmDt, ToDt) {

    let date_push = new Array();
    let frm_dt = new Date(fromDate);
    let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
    let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    finaldays = parseFloat(finaldays) + 1;
    let count_date = finaldays;
    let date_day = frm_dt.getDay();
    for (let i = 1; i <= count_date; i++) {

        if (date_day >= '8') {



            let date_day = 1;
        }



        date_push.push(date_day);
        date_day = date_day + 1;

    }
    return date_push;
}



function get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt) {


    let date_day = 0

    let date_push = new Array();

    let frm_dt = new Date(fromDate);

    let to_dt = new Date(toDate)

    let count_date = parseFloat(ToDt) - parseFloat(FrmDt) + 1;

    date_day = frm_dt.getDay();

    date_day = parseFloat(date_day) + 1;

    for (let i = 1; i <= count_date; i++) {
        if (date_day >= '8') {

            date_day = 1


        }
        date_push.push(date_day);
        date_day = parseInt(date_day) + 1;
    }
    return date_push;
}


function isEncashmentAllowed(leaveid) {
    let flag = 'F';

    let customrecord_hris_leaveconfigSearch = nlapiSearchRecord("customrecord_hris_leaveconfig", null,
        [
            ["isinactive", "is", "F"],
            "AND",
            ["custrecord_hris_lveconfig_encashallowed", "is", "T"],
            "AND",
            ["internalidnumber", "equalto", leaveid]
        ],
        [
            new nlobjSearchColumn("internalid"),
            new nlobjSearchColumn("custrecord_hris_lveconfig_encashallowed")
        ]
    );
    if (customrecord_hris_leaveconfigSearch) {
        flag = 'T';
    }

    return flag;
}




function monthDiff(d1, d2) {
    let months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
}

function test(d1, d2) {
    let diff = monthDiff(d1, d2);
    console.log(
        d1.toISOString().substring(0, 10),
        "to",
        d2.toISOString().substring(0, 10),
        ":",
        diff
    );
}


function GetRoundOffvalue(finalAnnual) {
    let final_days = finalAnnual;
    nlapiLogExecution(
      "DEBUG",
      "",
      "final_days************************************" + final_days
    );
    let rounded_final_value;
    let split_final_days = new Array();
  
    split_final_days = final_days.toString().split(".");
  
    let integer_no = split_final_days[0];
    nlapiLogExecution(
      "DEBUG",
      "",
      "integer_no************************************" + integer_no
    );
  
    let i_decimal_val = split_final_days[1];
    nlapiLogExecution(
      "DEBUG",
      "",
      "i_decimal_val************************************" + i_decimal_val
    );
  
    
  
    let compare_no = "0" + "." + i_decimal_val;
    nlapiLogExecution(
      "DEBUG",
      "typeof(compare_no)" + typeof compare_no,
      "compare_no************************************" + compare_no
    );     
     rounded_final_value = parseFloat(integer_no); 
  
 
  
    nlapiLogExecution(
      "DEBUG",
      "",
      "rounded_final_value************************************" +
        rounded_final_value
    );
    return rounded_final_value;
  }

});
