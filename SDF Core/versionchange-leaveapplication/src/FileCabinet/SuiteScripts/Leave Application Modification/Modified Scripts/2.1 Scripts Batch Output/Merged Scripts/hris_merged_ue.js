/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/search', 'N/query', 'N/format', 'N/record', 'N/currentRecord', 'N/url', 'N/runtime', 'N/ui/serverWidget', './moment.js'],
    (search, query, format, record, currentRecord, url, runtime, serverWidget, moment) => {

    const UE_hris_emergencyleavedeductionannual_ue = (() => {
define(['N/search', 'N/query', 'N/format', 'N/record', 'N/currentRecord', 'N/url', './moment.js', 'N/runtime'],
    function (search, query, format, record, currentRecord, url, moment, runtime) {


    function beforeSubmit(context) {
        if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.DELETE) {
            let flag = 0;

            log.debug('##################:', '******************');

            let rec_id = context.newRecord.id;
            log.debug('rec_id :', ' rec_id' + rec_id);

            if (_logValidation(rec_id)) {

                let leave_record = record.load({
                    type: 'customrecord_hris_leaveapplication',
                    id: rec_id
                });
                log.debug('leave_record :', 'leave_record' + leave_record);

                let leave_type = leave_record.getValue('custrecord_hris_lve_leavetype');
                log.debug('leave_type :', 'leave_type' + leave_type);
                let seq_no = get_sequence_no(leave_type,query);

                let hireDate = leave_record.getValue('custrecord_hris_lve_hiredate');
                let employee = leave_record.getValue('custrecord_hris_lve_employeename');
                log.debug('employee', 'employee =' + employee);

                let leave_status = leave_record.getValue('custrecord_hris_lve_hrmsapprovalstatus');
                log.debug('leave_status :', 'leave_status' + leave_status);

                let leaveCANCEL_status = leave_record.getValue('custrecord_hris_lve_cancel_leavestatus');
                log.debug('leaveCANCEL_status :', 'leaveCANCEL_status' + leaveCANCEL_status);

                let cancelCHECk = leave_record.getValue('custrecord_hris_lve_cancellation');
                log.debug('cancelCHECk :', 'cancelCHECk' + cancelCHECk);

                let tot_no_days = leave_record.getValue('custrecord_hris_lve_totalnodays') || 0;
                log.debug('tot_no_days', 'tot_no_days =' + tot_no_days);

                let curDate = new Date();
                let annualcheck =0;
                let annualleavetype =1;
                if (seq_no == 2 && employee && hireDate) {
                    log.debug("Inside")
                  //    let empQuery = "select * from employee  where id = " + employee + " and isinactive ='F'";
                      let empQuery = "select b.id as empcatagoryid ,b.custrecord_hris_empcat_seqno as seqno from employee  a join\
                      customrecord_hris_employeecategory b on  a.custentity_hris_empcategory = b.id where a.id =" + employee + " and b.isinactive='F'"

                    let queryResults = query.runSuiteQL({
                        query: empQuery,
                    });
                    let empQueryrecords = queryResults.asMappedResults();
                    // let visatextField = recordObj.getField("custpage_visaprocessingtext");

                    if (empQueryrecords.length > 0) {
                        let rec = empQueryrecords[0];
                       // let empcatagory = rec.custentity_hris_empcategory;
                       let empcatagory =rec.seqno;
                    }
                    log.audit("empcatagory",empcatagory)
                    if (empcatagory == 1 || empcatagory ==3) {
                        // For Azzurro it is changed to 670 days
                        let compareDate = moment(hireDate).add(670, 'days');
                        compareDate = format.parse({
                            value: compareDate,
                            type: format.Type.DATE
                        });


                        if (compareDate >= curDate) {
                           annualcheck=1;
                           // return false;
                        }
                        // Annual Leave Rejoin date Checking
                        let leaveQuery = "select * from customrecord_hris_leaveapplication  where custrecord_hris_lve_leavetype = " + annualleavetype + "\
                         and custrecord_hris_lve_workresume ='T' and  isinactive ='F'and custrecord_hris_lve_employeename ="+ employee;

                        let queryResults = query.runSuiteQL({
                            query: leaveQuery,
                        });
                        log.debug("Labour Leavequery",leaveQuery);
                        let leaveQueryrecords = queryResults.asMappedResults();
                        // let visatextField = recordObj.getField("custpage_visaprocessingtext");

                        if (leaveQueryrecords.length > 0) {
                            let rec = leaveQueryrecords[0];
                            let rejoindate = rec.custrecord_hris_lve_actualresumedate;
                            rejoindate = format.parse({
                                value: rejoindate,
                                type: format.Type.DATE
                            });
                            let compareDate = moment(rejoindate).add(670, 'days');
                            compareDate = format.parse({
                                value: compareDate,
                                type: format.Type.DATE
                            });


                            if (compareDate >= curDate) {

                               log.debug("Not completion of 22 months of rejoining date of the previous annual leave.");
                               annualcheck=1;
                              // return false;

                            }
                        }

                      

                    }
                    else if (empcatagory == 2) {
                        // For Azzurro it is changed to 670 days
                         log.debug('Inside Office staff');
                        let compareDate = moment(hireDate).add(365, 'days');
                        compareDate = format.parse({
                            value: compareDate,
                            type: format.Type.DATE
                        });
                     
                      log.debug("Staff Comparedate 1",compareDate);
                        if (compareDate >= curDate) {
                           log.debug('Not completion of 12 months of service')
                           annualcheck=1;
                          //  return false;
                        }
                        // Annual Leave Rejoin date Checking
                        let leaveQuery = "select * from customrecord_hris_leaveapplication  where custrecord_hris_lve_leavetype = " + annualleavetype + "\
                         and custrecord_hris_lve_workresume ='T' and  isinactive ='F'and custrecord_hris_lve_employeename ="+ employee;
                         log.debug("Staff Leavequery",leaveQuery);
                        let queryResults = query.runSuiteQL({
                            query: leaveQuery,
                        });
                       
                        let leaveQueryrecords = queryResults.asMappedResults();
                        // let visatextField = recordObj.getField("custpage_visaprocessingtext");

                        if (leaveQueryrecords.length > 0) {
                            let rec = leaveQueryrecords[0];
                            let rejoindate = rec.custrecord_hris_lve_actualresumedate;
                            rejoindate = format.parse({
                                value: rejoindate,
                                type: format.Type.DATE
                            });
                            let compareDate = moment(rejoindate).add(365, 'days');
                            compareDate = format.parse({
                                value: compareDate,
                                type: format.Type.DATE
                            });


                            if (compareDate >= curDate) {

                                log.debug('Not completion of 22 months of service')
                                annualcheck=1;
                                //return false;

                            }
                        }

                      
                    }
              let total_applied =0;
              let leavebalancetaken =0;
              log.audit('annualcheck',annualcheck)
                    if (leave_status == 2 && annualcheck ==1)  {
                        let annualleavetype =2;
                        if (cancelCHECk == false) {
                         
                                let leavebalQuery = "select * from customrecord_hris_leavebalance  where custrecord_hris_lvbal_leave_type = " + annualleavetype+ "\
                                and isinactive ='F'and custrecord_hris_lvbal_employee_name ="+ employee;
       
                                   let queryResults = query.runSuiteQL({
                                       query: leavebalQuery,
                                   });
                                   let leavebalQueryrecords = queryResults.asMappedResults();
                                   // let visatextField = recordObj.getField("custpage_visaprocessingtext");
       
                                   if (leavebalQueryrecords.length > 0) {
                                       let rec = leavebalQueryrecords[0];
                                       let leavebalid = rec.id ;
                                total_applied = rec.custrecord_hris_lvbal_total_applied_days || 0;
                                leavebalancetaken = rec.custrecord_hris_lvbal_leave_balance_take||0;
                              

                                log.debug('total_applied', 'total_applied =' + total_applied);

                                let final_days = parseFloat(total_applied) + parseFloat(tot_no_days);
                                let final_leavetaken = parseFloat(leavebalancetaken)+parseFloat(tot_no_days)
                                log.debug('final_days', 'final_days =' + final_days);

                              
                                let updatedleavebalid = record.submitFields({
                                    type: 'customrecord_hris_leavebalance',
                                    id: leavebalid,
                                    values: {
                                        'custrecord_hris_lvbal_total_applied_days': final_days,
                                        'custrecord_hris_lvbal_leave_balance_take':final_leavetaken
                                    },
                                    options: {
                                        enableSourcing: false,
                                        ignoreMandatoryFields : true
                                    }
                                });
                                log.debug(" updatedleavebalid", updatedleavebalid)

                               
                            }
                           // }
                        }
                        else if (cancelCHECk == true && leaveCANCEL_status ==2){

                            let leavebalQuery = "select * from customrecord_hris_leavebalance  where custrecord_hris_lvbal_leave_type = " + annualleavetype+ "\
                            and isinactive ='F'and custrecord_hris_lvbal_employee_name ="+ employee;
   
                               let queryResults = query.runSuiteQL({
                                   query: leavebalQuery,
                               });
                               let leavebalQueryrecords = queryResults.asMappedResults();
                               // let visatextField = recordObj.getField("custpage_visaprocessingtext");
   
                               if (leavebalQueryrecords.length > 0) {
                                   let rec = leavebalQueryrecords[0];
   
                            total_applied = rec.custrecord_hris_lvbal_total_applied_days || 0;
                            leavebalancetaken = rec.custrecord_hris_lvbal_leave_balance_take||0;
                            let leavebalid = rec.id ;

                            log.debug('total_applied', 'total_applied =' + total_applied);

                            let final_days = parseFloat(total_applied) - parseFloat(tot_no_days);
                            log.debug('final_days', 'final_days =' + final_days);
                            let final_leavetaken = parseFloat(leavebalancetaken)-parseFloat(tot_no_days)    
                          
                            let updatedleavebalid = record.submitFields({
                                type: 'customrecord_hris_leavebalance',
                                id: leavebalid,
                                values: {
                                    'custrecord_hris_lvbal_total_applied_days': final_days,
                                    'custrecord_hris_lvbal_leave_balance_take':final_leavetaken
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields : true
                                }
                            });
                            log.debug(" updatedleavebalid", updatedleavebalid)

                           
                        }

                        }
                    }

                    if (leave_status == 3 && annualcheck ==1) {
                      
                        let leavebalQuery = "select * from customrecord_hris_leavebalance  where custrecord_hris_lvbal_leave_type = " + annualleavetype+ "\
                        and isinactive ='F'and custrecord_hris_lvbal_employee_name ="+ employee;

                           let queryResults = query.runSuiteQL({
                               query: leavebalQuery,
                           });
                           let leavebalQueryrecords = queryResults.asMappedResults();
                           // let visatextField = recordObj.getField("custpage_visaprocessingtext");

                           if (leavebalQueryrecords.length > 0) {
                               let rec = leavebalQueryrecords[0];

                        total_applied = rec.custrecord_hris_lvbal_total_applied_days || 0;
                        leavebalancetaken = rec.custrecord_hris_lvbal_leave_balance_take||0;
                        let leavebalid = rec.id ;

                        log.debug('total_applied', 'total_applied =' + total_applied);

                        let final_days = parseFloat(total_applied) - parseFloat(tot_no_days);
                        log.debug('final_days', 'final_days =' + final_days);
                        let final_leavetaken = parseFloat(leavebalancetaken)-parseFloat(tot_no_days)
                      
                        let updatedleavebalid = record.submitFields({
                            type: 'customrecord_hris_leavebalance',
                            id: leavebalid,
                            values: {
                                'custrecord_hris_lvbal_total_applied_days': final_days,
                                'custrecord_hris_lvbal_leave_balance_take':final_leavetaken
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields : true
                            }
                        });
                        log.debug(" updatedleavebalid", updatedleavebalid)

                       
                    }
                      
                    }
                }
            }
        }
    }

    function _logValidation(value) {
        return (value !== null && value !== undefined && value !== '');
    }

    return {
        beforeSubmit: beforeSubmit
    };
});
function get_sequence_no(leave_type,query) {

    let leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + leave_type + "' and isinactive ='F'"
    log.debug("leavesequencesql", leavesequencesql);
    let queryResult = query.runSuiteQL({
        query: leavesequencesql,
    });
    let leavesequencesqlrecords = queryResult.asMappedResults();


    log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
    if (leavesequencesqlrecords.length > 0) {


        let sequence_no = leavesequencesqlrecords[0].custrecord_hris_lvecnfg_seqno;
    }
    return sequence_no;
}
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_encashmentvalidation_ue = (() => {
let QUERY;
define(['N/record', 'N/ui/serverWidget', 'N/search', 'N/query', './moment.js', 'N/runtime','N/format'], function (record, serverWidget, search, query, moment, runtime,format) {
    QUERY = query;


    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.EDIT) {


                let newRecord = context.newRecord;
                let i_recID = newRecord.id;
                let i_recType = newRecord.type;
                let i_empID = newRecord.getValue('custrecord_hris_lve_employeename');
                let leave_type = newRecord.getValue('custrecord_hris_lve_leavetype');
                let leave_status = newRecord.getValue('custrecord_hris_lve_hrmsapprovalstatus');
                let cancel_check = newRecord.getValue('custrecord_hris_lve_cancellation');
                let appliy_encashment = newRecord.getValue('custrecord_hris_lve_applylveencashment');
                log.audit('apply Encash',appliy_encashment);
                let omani_nonOmani = newRecord.getValue('custrecord_hris_lve_nation_omani_non');


                log.debug('afterSubmit record', 'i_recType: ' + i_recType + ', i_recID: ' + i_recID);
                log.audit("leave_status",leave_status);
                if (appliy_encashment === true && leave_status === '2' && cancel_check === false) {
                    let leave_from_date = newRecord.getValue('custrecord_hris_lve_fromdate');
                    leave_from_date = format.parse({ value: leave_from_date, type: format.Type.DATE });
                    let leave_get_month = leave_from_date.getMonth() + 1;
                    let leave_year = leave_from_date.getFullYear();
                    let leave_YearId = searchYear(leave_year);
                    let to_Date = newRecord.getValue('custrecord_hris_lve_todate');
                    let no_of_encash_days = parseFloat(newRecord.getValue('custrecord_hris_lve_noofencashmentdays'));
                    let payGroup = searchPaygroup(i_empID);
                    let encash_internal_id = getEncashCompId(payGroup);
                    let get_wage_date = searchWagePeriod(payGroup);
                    let w_Date = get_wage_date.split('#');
                    let end_date = w_Date[0];
                    let start_date = w_Date[1];
                   // let pay_Date = format.format({ value: new Date(leave_year, leave_get_month, 0), type: format.Type.DATE });
                    let pay_Date=format.parse({ value: end_date, type: format.Type.DATE });
                    let wage_period = gethrisMonth(leave_get_month);
                    let wage_year_id = searchYear(leave_year);
                    let leave_balance = searchLeaveBalance(i_empID, leave_type);

                    let denominator = getDenominatorForLeaveEncashment(leave_type);
                    let Encash_amt_all_comps = getEncashAmount(i_empID, payGroup, encash_internal_id, omani_nonOmani);
                    log.audit('Encash All Comps',Encash_amt_all_comps);
                    let amount = (Encash_amt_all_comps / denominator) * no_of_encash_days;
                    log.audit('Encash Amount',amount);

                    let existingEncashment = searchExistingEncashment(i_empID, payGroup, wage_period, wage_year_id, encash_internal_id, i_recID);
                    log.audit('Existing Encashment',existingEncashment);
                    if (!existingEncashment) {
                        log.debug("Inside Encashcreat")
                        let rec_create = record.create({ type: 'customrecord_hris_monthlysalinput', isDynamic: true });
                        rec_create.setValue('custrecord_hris_mthsal_empname', i_empID);
                        rec_create.setValue('custrecord_hris_mthsal_paygroup', payGroup);
                        rec_create.setValue('custrecord_hris_mthsal_month', wage_period);
                        rec_create.setValue('custrecord_hris_mthsal_year', wage_year_id);
                        rec_create.setValue('custrecord_hris_mthsal_paycomponent', encash_internal_id);
                        rec_create.setValue('custrecord_hris_mthsal_leave_encashment', denominator);
                        rec_create.setValue('custrecord_hris_mthsal_paydt', pay_Date);
                        rec_create.setValue('custrecord_hris_mthsal_salaryamount', amount);
                        rec_create.setValue('custrecord_hris_mthsal_no_of_encashable', no_of_encash_days);
                        rec_create.setValue('custrecord_hris_mthsal_msileaverefno', i_recID);
                        rec_create.setValue('custrecord_hris_mthsal_remarks', 'This entry is auto created from Leave Application against Leave Encashment');
                        let rec_submit = rec_create.save();
                        log.debug('Encashment Record Created', 'Record ID: ' + rec_submit);
                    }
                }
                let seqNo =getLeaveConfigSequence(leave_type);
                let leaveBalance = newRecord.getValue('custrecord_hris_lve_leavebalance');

                if (seqNo == '24' && leave_status == '2') {
                    let leaveFromDate = newRecord.getValue('custrecord_hris_lve_expectedresumebackdt');
                    leaveFromDate = format.parse({ value: leaveFromDate, type: format.Type.DATE });
                    let leaveMonth = leaveFromDate.getMonth() + 1;
                    let leaveYear = leaveFromDate.getFullYear();
                    let leaveYearId = searchYear(leaveYear);

                    let payGroup = search_paygroup(i_empID);
                    let encashInternalId = getEncashCompId(payGroup);
                    log.debug('Encash Internal ID', encashInternalId);

                    let encashAmount = getEncashAmount(i_empID, payGroup, encashInternalId);
                    log.debug('Encash Amount', encashAmount);

                    let denominator = getLeaveEncashmentDenominator(leave_type);
                    let amount = (parseFloat(encashAmount) / parseFloat(denominator)) * parseFloat(leaveBalance);
                    log.debug('Calculated Amount', amount);

                    let wagePeriod = gethrisMonth(leaveMonth);
                    let wageYearId = leaveYearId;
                    let payDate = getLastDayOfMonth(leaveFromDate);
                    
                    let leaveBalanceSearch = searchLeaveBalance(i_empID, leave_type);
                    if (leaveBalanceSearch) {
                        let leaveBalanceId = leaveBalanceSearch.id;
                        record.submitFields({
                            type: 'customrecord_hris_leavebalance',
                            id: leaveBalanceId,
                            values: { 'custrecord_hris_lvbal_encashment_msi': true }
                        });
                    }
                    
                    createMonthlySalaryRecord(i_empID, payGroup, wagePeriod, wageYearId, encashInternalId, leaveBalance, denominator, payDate, amount, i_recID);
                }
                // rotational create MSI
                let leaveBalanceSearch = searchLeaveBalance(i_empID, leave_type);

                if ((seqNo == 6) && leaveStatus == 2 && cancelCheck == false && leaveBalanceSearch.length > 0) {
                    processLeaveApplication(newRecord, leaveBalanceSearch[0]);
                }
            
            }
        } catch (e) {
            log.error('Error in afterSubmit', e);
        }
    }
    function searchLeaveBalanceold(empId, leaveType) {
        return search.create({
            type: 'customrecord_hris_leavebalance',
            filters: [
                ['custrecord_hris_lvbal_employee_name.internalid', 'anyof', empId],
                'AND',
                ['custrecord_hris_lvbal_employee_name.isinactive', 'is', 'F'],
                'AND',
                ['custrecord_hris_lvbal_leave_type', 'anyof', leaveType],
                'AND',
                ['custrecord_hris_rt_basic_pay_msi_created', 'is', 'F']
            ],
            columns: ['internalid', 'custrecord_hris_lvbal_leave_balance_cred']
        }).run().getRange({ start: 0, end: 1 });
    }

    function processLeaveApplication(newRecord, leaveBalance) {
        let i_recID = newRecord.id;
        let leaveBalanceId = leaveBalance.id;
        let leaveBalCredited = leaveBalance.getValue('custrecord_hris_lvbal_leave_balance_cred') || 0;
        
        let leaveFromDate = newRecord.getValue('custrecord_hris_lve_fromdate');
        let expectedResumeDate = newRecord.getValue('custrecord_hris_lve_expectedresumebackdt');

        let payGroup = searchPayGroup(newRecord.getValue('custrecord_hris_lve_employeename'));
        let compId = getBasicCompId(payGroup);
        let wagePeriodData = searchWagePeriod(payGroup);

        let wageMonth = getHRISMonth(expectedResumeDate.getMonth() + 1);
        let wageYearId = searchYear(expectedResumeDate.getFullYear());
        let lastDayOfMonth = new Date(expectedResumeDate.getFullYear(), expectedResumeDate.getMonth() + 1, 0);
        let payDate = format.format({ value: lastDayOfMonth, type: format.Type.DATE });

        let basicAmount = getBasic(payGroup, newRecord.getValue('custrecord_hris_lve_employeename'));
        let salaryAmount = (basicAmount / 30) * parseFloat(leaveBalCredited);
        
        createrotateMonthlySalaryRecord(newRecord.id, newRecord.getValue('custrecord_hris_lve_employeename'), payGroup, wageMonth, wageYearId, compId, payDate, salaryAmount, basicAmount, leaveBalCredited);
    }
    function createrotateMonthlySalaryRecord(leaveRefId, empId, payGroup, month, year, compId, payDate, amount, basicAmt, noOfDays) {
        let salaryRecord = record.create({ type: 'customrecord_hris_monthlysalinput', isDynamic: true });
        
        salaryRecord.setValue('custrecord_hris_mthsal_empname', empId);
        salaryRecord.setValue('custrecord_hris_mthsal_paygroup', payGroup);
        salaryRecord.setValue('custrecord_hris_mthsal_month', month);
        salaryRecord.setValue('custrecord_hris_mthsal_year', year);
        salaryRecord.setValue('custrecord_hris_mthsal_paycomponent', compId);
        salaryRecord.setValue('custrecord_hris_mthsal_paydt', payDate);
        salaryRecord.setValue('custrecord_hris_mthsal_salaryamount', amount);
        salaryRecord.setValue('custrecord_hris_mthsal_fixedmonthlybasic', basicAmt);
        salaryRecord.setValue('custrecord_hris_mthsal_noofrtleavedays', noOfDays);
        salaryRecord.setValue('custrecord_hris_mthsal_msileaverefno', leaveRefId);
        salaryRecord.setValue('custrecord_hris_mthsal_remarks', 'Auto-created from leave application against rotational leave');
        
        salaryRecord.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
    }
    function createMonthlySalaryRecord(empID, payGroup, wagePeriod, wageYearId, encashInternalId, leaveBalance, denominator, payDate, amount, recID) {
        let rec = record.create({ type: 'customrecord_hris_monthlysalinput', isDynamic: true  });
        rec.setValue('custrecord_hris_mthsal_empname', empID);
        rec.setValue('custrecord_hris_mthsal_paygroup', payGroup);
        rec.setValue('custrecord_hris_mthsal_month', wagePeriod);
        rec.setValue('custrecord_hris_mthsal_year', wageYearId);
        rec.setValue('custrecord_hris_mthsal_paycomponent', encashInternalId);
        rec.setValue('custrecord_hris_mthsal_annual_leave_bala', leaveBalance);
        rec.setValue('custrecord_hris_mthsal_leave_encashment', denominator);
        rec.setValue('custrecord_hris_mthsal_paydt', payDate);
        rec.setValue('custrecord_hris_mthsal_salaryamount', amount);
        rec.setValue('custrecord_hris_mthsal_no_of_encashable', leaveBalance);
        rec.setValue('custrecord_hris_mthsal_msileaverefno', recID);
        rec.setValue('custrecord_hris_mthsal_remarks', 'Auto created from Leave Application against Rotational Leave Encashment');
        let recSubmit = rec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
        log.debug('Monthly Salary Record Created', recSubmit);
    }
    function getDenominatorForLeaveEncashment(leave_type) {
        let searchResult = search.lookupFields({
            type: 'customrecord_hris_leaveconfig',
            id: leave_type,
            columns: ['custrecord_hris_lveconfig_lveencashcal']
        });
        return searchResult.custrecord_hris_lveconfig_lveencashcal || 0;
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
    function searchExistingEncashment(i_empID, payGroup, wage_period, wage_year_id, encash_internal_id, i_recID) {
        let searchResult = search.create({
            type: 'customrecord_hris_monthlysalinput',
            filters: [
                ['custrecord_hris_mthsal_empname', 'is', i_empID],
                'AND', ['custrecord_hris_mthsal_paygroup', 'is', payGroup],
                'AND', ['custrecord_hris_mthsal_month', 'is', wage_period],
                'AND', ['custrecord_hris_mthsal_year', 'is', wage_year_id],
                'AND', ['custrecord_hris_mthsal_paycomponent', 'is', encash_internal_id],
                'AND', ['isinactive', 'is', false],
                'AND', ['custrecord_hris_mthsal_msileaverefno', 'anyof', i_recID]
            ]
        }).run().getRange({ start: 0, end: 1 });
        return searchResult.length > 0;
    }
    function getLeaveConfigSequence(Leave_type) {
        try {

            let leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + Leave_type + "' and isinactive ='F'"
            log.debug("leavesequencesql", leavesequencesql);
            let queryResult = query.runSuiteQL({
                query: leavesequencesql,
            });
            let leavesequencesqlrecords = queryResult.asMappedResults();


            log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
            if (leavesequencesqlrecords.length > 0) {


                let sequence_no = leavesequencesqlrecords[0].custrecord_hris_lvecnfg_seqno;
            }
            return sequence_no;
        }
        catch (e) {
            log.debug("error in get_sequence_no : " + e);

        }

    }

    function searchPaygroup(employee_name) {

        let employeecompensql = "Select * from customrecord_hris_employee_compen_change where custrecord_hris_empchange_employee_nam = " + employee_name + "  and isinactive ='F'";
        log.debug('employeecompensql', employeecompensql);
       
        let wageperiodsqlrecords = getResult(employeecompensql);

        if (wageperiodsqlrecords.length > 0) {
            let rec = wageperiodsqlrecords[0];

            let s_paygroup = rec.custrecord_hris_empchange_emp_pay_pro_gp;
        }

        return s_paygroup
    }

    function searchWagePeriod(pay_group) {

        let wageperiodsql = " select * from customrecord_hris_wage_period_details \
                           where custrecord_hris_pay_group = "+ pay_group + " and isinactive='F'"

        log.debug('wageperiodsql',wageperiodsql);
        let wageperiodsqlrecords = getResult(wageperiodsql);

        if (wageperiodsqlrecords.length > 0) {
            let rec = wageperiodsqlrecords[0];
            let WagePeriod_EndDate = rec.custrecord_hris_end_date;

            let start_date = rec.custrecord_hris_start_date;

            let month = rec.custrecord_hris_month;

            let year = rec.custrecord_hris_year;

        }//End of if(searchResult !=null)
        return WagePeriod_EndDate + "#" + start_date + "#" + month + "#" + year;
    }

    function searchPayComp(i_paygroup_earn) {
        let PTID;
        let employeecompensql = "Select * from customrecord_hris_payroll_component \
             where custrecord_hris_pay_process_group = " + i_paygroup_earn + " \
             and custrecord_hris__sequence_no_=24  and isinactive ='F'";
        log.debug('employeecompensql', employeecompensql);
        
        let employeecompensqlrecords = getResult(employeecompensql);

        if (employeecompensqlrecords.length > 0) {
            let rec = employeecompensqlrecords[0];

            PTID = rec.id;
        }

        return PTID;
    }//sea

    function searchYear(year) {
        let yearVal = '';
        year = year.toString();
        log.debug('Year in searchYear function', year);

        // Create the search filters
        let filters = [
            ['name', 'contains', year],
            'AND',
            ['isinactive', 'is', 'F']
        ];

        // Create the search columns
        let columns = [
            search.createColumn({ name: 'internalid' })
        ];

        // Perform the search
        let searchResult = search.create({
            type: 'customlist_hris_year_master',
            filters: filters,
            columns: columns
        }).run().getRange({ start: 0, end: 1 });

        // Check if there are results
        if (searchResult.length > 0) {
            yearVal = searchResult[0].getValue('internalid');
        }

        log.debug('yearVal in SearchYear Func', yearVal);
        return yearVal;
    }
    function getBasic(payGroup, empId) {
        let salAmt = 0.00;
        
        let payCompSearch = search.create({
            type: 'customrecord_hris_payroll_component',
            filters: [
                ['isinactive', 'is', 'F'],
                'AND',
                ['custrecord_hris_pay_process_group', 'anyof', payGroup],
                'AND',
                ['internalid', 'is', 1]
            ],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1000 });
        
        if (payCompSearch) {
            payCompSearch.forEach(function (result) {
                let compId = result.getValue('internalid');
                log.debug('payCompSearch compId', compId);
                
                let edcSearch = search.create({
                    type: 'customrecord_hris_employee_compen_change',
                    filters: [
                        ['custrecord_hris_empchange_employee_nam', 'anyof', empId],
                        'AND',
                        ['custrecord_hris_employee_data_change.custrecord_hris_cde_payroll_component', 'anyof', compId]
                    ],
                    columns: [
                        'custrecord_hris_empchange_employee_nam',
                        { name: 'custrecord_hris_cde_monthly', join: 'CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE' },
                        { name: 'custrecord_hris_cde_process_group', join: 'CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE' },
                        { name: 'internalid', join: 'CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE' }
                    ]
                }).run().getRange({ start: 0, end: 1000 });
                
                if (edcSearch) {
                    edcSearch.forEach(function (edcResult) {
                        let payGrpCompDetail = edcResult.getValue({ name: 'custrecord_hris_cde_monthly', join: 'CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE' });
                        let compValue = edcResult.getValue({ name: 'custrecord_hris_cde_process_group', join: 'CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE' });
                        
                        log.debug('compValue', compValue);
                        log.debug('payGrpCompDetail', payGrpCompDetail);
                        
                        salAmt += parseFloat(payGrpCompDetail) || 0;
                    });
                }
            });
        }
        
        return salAmt;
    }
    function getEncashAmount(empName, processGrp, encashInternalId) {
        let compType = encashInternalId;
        let salAmt = 0.00;

        let searchComp = search.create({
            type: 'customrecord_hris_payroll_component',
            filters: [
                ['custrecord_hris_pay_process_group', 'anyof', processGrp],
                'AND',
                ['custrecord_hris__sequence_no_', 'equalto', 40]
            ],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });

        if (searchComp.length > 0) {
            let compIntID = searchComp[0].getValue('internalid');

            if (compType == compIntID) {
                log.debug('inside LeaveType condition');

                let payCompSearch = search.create({
                    type: 'customrecord_hris_payroll_component',
                    filters: [
                        ['isinactive', 'is', 'F'],
                        'AND',
                        ['custrecord_hris_pay_process_group', 'anyof', processGrp],
                        'AND',
                        ['custrecord_hris_consider_for_encashment', 'is', 'T']
                    ],
                    columns: ['internalid']
                }).run().getRange({ start: 0, end: 1000 });

                if (payCompSearch.length > 0) {
                    payCompSearch.forEach(function (result) {
                        let compId = result.getValue('internalid');

                        let edcSearch = search.create({
                            type: 'customrecord_hris_employee_compen_change',
                            filters: [
                                ['custrecord_hris_empchange_employee_nam', 'anyof', empName],
                                'AND',
                                ['custrecord_hris_employee_data_change.custrecord_hris_cde_payroll_component', 'anyof', compId]
                            ],
                            columns: [
                                'custrecord_hris_empchange_employee_nam',
                                { name: 'custrecord_hris_cde_monthly', join: 'CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE' },
                                { name: 'custrecord_hris_cde_process_group', join: 'CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE' },
                                { name: 'internalid', join: 'CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE' }
                            ]
                        }).run().getRange({ start: 0, end: 1000 });

                        if (edcSearch.length > 0) {
                            edcSearch.forEach(function (edcResult) {
                                let payGrpCompDetail = edcResult.getValue({ name: 'custrecord_hris_cde_monthly', join: 'CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE' });
                                let compValue = edcResult.getValue({ name: 'custrecord_hris_cde_process_group', join: 'CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE' });

                                log.debug('comp_value', compValue);
                                log.debug('payGrp_Comp_Detail', payGrpCompDetail);

                                salAmt += parseFloat(payGrpCompDetail) || 0;
                            });
                        }
                    });
                }
                salAmt = salAmt.toFixed(3);
            }
        }
        return salAmt;
    }
    function searchLeaveBalance(employee, leaveType) {
        let bal = 0.00;
        let leaveBalanceSearch = search.create({
            type: 'customrecord_hris_leavebalance',
            filters: [
                ['custrecord_hris_lvbal_employee_name', 'anyof', employee],
                'AND',
                ['custrecord_hris_lvbal_leave_type', 'anyof', leaveType]
            ],
            columns: [
                'custrecord_hris_lvbal_available_leave_ba',
                'custrecord_hris_lvbal_encashable_days'
            ]
        }).run().getRange({ start: 0, end: 1 });

        if (leaveBalanceSearch.length > 0) {
            let annual = leaveBalanceSearch[0].getValue('custrecord_hris_lvbal_available_leave_ba') || 0;
            let encash = leaveBalanceSearch[0].getValue('custrecord_hris_lvbal_encashable_days') || 0;
            bal = parseFloat(annual) + parseFloat(encash);
        }
        return bal;
    }

    function getEncashCompId(id) {
        let payrollComponentSearch = search.create({
            type: 'customrecord_hris_payroll_component',
            filters: [
                ['custrecord_hris_pay_process_group', 'anyof', id],
                'AND',
                ['custrecord_hris__sequence_no_', 'equalto', '40']
            ],
            columns: [
                'internalid',
                search.createColumn({ name: 'custrecord_hris_component_short_name', sort: search.Sort.ASC }),
                'custrecord_hris__sequence_no_'
            ]
        }).run().getRange({ start: 0, end: 1 });

        if (payrollComponentSearch.length > 0) {
            id = payrollComponentSearch[0].id;
        }
        return id;
    }

    function getResult(pSQL) {
        // log.debug("QUERY", pSQL);
        let queryResults = QUERY.runSuiteQL({
            query: pSQL
        });
        let records = queryResults.asMappedResults();
        return records;
    }

    return {
        afterSubmit: afterSubmit
    };

});
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_generatereferencenumber_us = (() => {
{


	let _prefix = '';
	let _record_Type = '';

}
function beforeLoad_highlightStatus(type,form)
{
	try
	{	
	    let _Role = nlapiGetContext().getRoleId();
	    let i_role = nlapiGetRole();
	    
		let _record_Type = nlapiGetRecordType().toString().toLowerCase();
		
		 let hiddenfield = form.getField("name" );
	        hiddenfield.setDisplayType("disabled");
		if(type == 'create')
		{
			
			hiddenfield = form.getField("custrecord_" + _prefix + "_workflowstatus");
	        hiddenfield.setDisplayType("hidden"); 
		}
		
		
		if(type == 'view' && _record_Type == 'customrecord_hris_lve_letter_req')
		{
			let i_currentWFLevel = nlapiGetFieldValue('custrecord_hris_letreq_current_approval');
			let i_certificate = nlapiGetFieldValue('custrecord_hris_letreq_certificateletter');
			let s_signature = nlapiGetFieldText('custrecord_hris_letreq_signature');
			let i_workflowStatus = nlapiGetFieldValue('custrecord_hris_letreq_workflow_statuslr');
			let i_requester = nlapiGetFieldValue('custrecord_hris_letreq_requester');
			let i_internalId = nlapiGetRecordId();
			
			form.setScript('customscript_cli_ihr_ess_ssr_btnclick');
			if((i_role == 1001 || i_role == 1003)  && i_currentWFLevel == '2')
			{
				if(i_workflowStatus != 5)
				{
					if(_nullValidation(i_certificate))
					{
						form.addButton('custpage_preview_document', 'Preview Document', 'onClickPreviewDocBtn(\'' + s_signature + '\');');
					}
					else{
						form.addButton('custpage_preview_document', 'Issue Letter', 'onClickIssueLatterBtn(\'' + i_requester + '\');');
					}
				}
				
			}
		}
	 	
		/* if(type == 'view' && _record_Type == 'customrecord_ihr_ess_awardrequest')
		{
			let i_currentWFLevel = nlapiGetFieldValue('custrecord_ihr_ess_awd_current_wflevelno');
			let i_certificate = nlapiGetFieldValue('custrecord_ihr_awd_awardcertificate');			
			let i_internalId = nlapiGetRecordId();
			let i_workflowStatus = nlapiGetFieldValue('custrecord_ihr_ess_awd_workflowstatus');
			form.setScript('customscript_cli_ihr_ess_ssr_btnclick');
			if(i_role == 1003)
			{
				if(i_workflowStatus == 5)
				{
					if(_nullValidation(i_certificate))
					{
						form.addButton('custpage_award_certificate', 'Generate Award Certificate', 'onClickAward_Certificate();');
					}
					
				}
				
			}
		} */
		
		
		
		
	    if (!isFieldEmpty(nlapiGetFieldValue("custrecord_" + _prefix + "_status")))
		{
			let statusInColor = '<BR>' + '<font size=2>' + 'STATUS' + '</font>' +
			'<BR>' +
			'<font color="red" size=2>' +
			nlapiGetFieldValue("custrecord_" + _prefix + "_status") +
			'</font>';
		}
		else
		{
			if(type != 'create')
			{
				let statusInColor = '<BR>' + '<font size=2>' + 'STATUS' + '</font>' +
				'<BR>' +
				'<font color="red" size=2>' +
				'Draft' +
				'</font>';
				
				
			}
		}
	    nlapiSetFieldValue("custrecord_" + _prefix + "_status_in_color", statusInColor, false);
	    
	    let statusInColorfield = form.getField("custrecord_" + _prefix + "_status_in_color");
	    
	    let namefield = form.getField("custrecord_" + _prefix + "_status");
	    namefield.setDisplayType("hidden");
	    
	    let curWFLval = nlapiGetFieldValue("custrecord_" + _prefix + "_current_wflevelno");
	    nlapiSetFieldValue("custrecord_" + _prefix + "_crntwflvlnohighli", curWFLval, false);	    
	    
	    if (_Role != "administrator" && _Role != "full_access") 
	    {
	        let hiddenfield = form.getField("custrecord_" + _prefix + "_wfhelp");
	        hiddenfield.setDisplayType("hidden");
	        hiddenfield = form.getField("custrecord_" + _prefix + "_app_no");
	        hiddenfield.setDisplayType("hidden");
	        hiddenfield = form.getField("custrecord_" + _prefix + "_wfs");
	        hiddenfield.setDisplayType("hidden");
	        hiddenfield = form.getField("custrecord_" + _prefix + "_currentapprover");
	        hiddenfield.setDisplayType("hidden"); 
	        hiddenfield = form.getField("custrecord_" + _prefix + "_special_comments");
	        hiddenfield.setDisplayType("hidden");
	        hiddenfield = form.getField("custrecord_" + _prefix + "_workflowstatus");
	        hiddenfield = form.getField("custrecord_" + _prefix + "_current_wflevelno");
	        hiddenfield.setDisplayType("hidden");
	        hiddenfield = form.getField("custrecord_" + _prefix + "_next_wflevel_no");
	        hiddenfield.setDisplayType("hidden");
	        hiddenfield = form.getField("custrecord_" + _prefix + "_nextapprover");
	        hiddenfield.setDisplayType("hidden");
	        hiddenfield = form.getField("custrecord_" + _prefix + "_currenteditor");
	        hiddenfield.setDisplayType("hidden");
	        hiddenfield = form.getField("custrecord_" + _prefix + "_additionalmsg");
	        hiddenfield.setDisplayType("hidden");
	        hiddenfield = form.getField("custrecord_" + _prefix + "_comments");
	        hiddenfield.setDisplayType("hidden");
	        hiddenfield = form.getField("custrecord_" + _prefix + "_confirmflag");
	        hiddenfield.setDisplayType("hidden");
	        hiddenfield = form.getField("custrecord_" + _prefix + "_actiontaken");
	        hiddenfield.setDisplayType("hidden");
	        hiddenfield = form.getField("custrecord_" + _prefix + "_html2");
	        hiddenfield.setDisplayType("hidden");	
	        hiddenfield = form.getField("custrecord_" + _prefix + "_approval_dt");
	        hiddenfield.setDisplayType("hidden");
	        hiddenfield = form.getField("custrecord_" + _prefix + "_furthraprovalflag");
	        hiddenfield.setDisplayType("hidden");
	        hiddenfield = form.getField("custrecord_" + _prefix + "_tot_no");
	        hiddenfield.setDisplayType("hidden");
	    }	    
	    
	   let nonEditableTillLevel = parseInt(nlapiGetFieldValue("custrecord_" + _prefix + "_app_no"));
	    
	   for (let i = i_total_no_appr+1; i <= 5; i++)
        {
            
            let apprFld = form.getField("custrecord_" + _prefix + "_approver" + i);
            if (_logValidation(apprFld))
            {
                apprFld.setDisplayType("hidden");
            }
        }
	    
	    
	}
	catch(e)
	{
		nlapiLogExecution('DEBUG', 'userEventBeforeLoad', 'Exception: ' + e);
	}
	return true;

}

function beforeSubmit_AutoNumber(type){
	  
    if (type == 'create') 
    {
        try 
        {
			let leaveBal = nlapiGetFieldValue('custrecord_hris_lve_leavebalance');
			if(leaveBal){
				
				nlapiSetFieldValue('custrecord_lms_leave_bal_for_cal', leaveBal);
				
			}
			
        	let s_auto_prfix = '';
        	_record_Type = nlapiGetRecordType().toString().toLowerCase();
    	    nlapiLogExecution('DEBUG', 'userEventBeforeLoad', '_record_Type: ' + _record_Type);
    	    let recordType = nlapiGetRecordType();
			if(recordType == 'customrecord_hris_lve_letter_req')
			{
				s_auto_prfix = 'LTR';
			}
			else if(recordType=='customrecord_hris_empchange_loan_applicn'){
    	        s_auto_prfix = 'LON';
			}
			else if(recordType == 'customrecord_hris_lve_raise_comp_off')
			{
				s_auto_prfix = 'RC';
			}
              else if(recordType == 'customrecord_hris_empallocationtransfer')
			{
				s_auto_prfix = 'EA';
			}
			else
			{
				s_auto_prfix = 'LA'
			}
    	    
    	    let i_rec_type_id = nlapiGetFieldValue('rectype');
    	    nlapiLogExecution('DEBUG', 'i_rec_type_id', i_rec_type_id)
    	    let a_filter_unique_rec = new Array();
    	    a_filter_unique_rec[0] = new nlobjSearchFilter('custrecord_hris_record_type', null, 'anyof', i_rec_type_id);
    	    a_filter_unique_rec[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
            let a_col_unique_rec = new Array();
            a_col_unique_rec[0] = new nlobjSearchColumn('custrecord_hris_record_type');
            a_col_unique_rec[1] = new nlobjSearchColumn('custrecord_hris_unique_number');        
            let o_search_unique_ref = nlapiSearchRecord('customrecord_hris_unique_reference_numbe', null, a_filter_unique_rec, a_col_unique_rec);
            if (_logValidation(o_search_unique_ref)) 
            {            	
            	let i_id_unique_ref =  o_search_unique_ref[0].getId();
            	let i_unique_num = o_search_unique_ref[0].getValue('custrecord_hris_unique_number');
            	i_unique_num = parseInt(i_unique_num)+1;
            	let d_current_date = getCompanyCurrentDateTime();
            	d_current_date = nlapiDateToString(d_current_date, 'date');
            	d_current_date = nlapiStringToDate(d_current_date, 'date');
            	
            	let i_fullYear = d_current_date.getFullYear();
            	
				if(recordType == 'customrecord_hris_lve_letter_req')
				{
                  let i_employee = nlapiGetFieldValue('custrecord_hris_letreq_employee_name');
				}
				else if(recordType=='customrecord_hris_empchange_loan_applicn'){
					
                  let i_employee = nlapiGetFieldValue('custrecord_hris_loan_emp_code');
            	
				}
                  else if(recordType=='customrecord_hris_empallocationtransfer'){
					
                  let i_employee = nlapiGetFieldValue('custrecord_hris_alloc_empid');
            	
				}
				else if(recordType == 'customrecord_hris_lve_raise_comp_off')
				{
					let i_employee = nlapiGetFieldValue('custrecord_hris_rcomp_employee_name');
				}
				else{
				  
				  let i_employee = nlapiGetFieldValue('custrecord_hris_lve_employeename');
            	
				}
				
            	let s_name = nlapiLookupField('employee', i_employee, 'firstname');
            	let s_emp_char = '';
            	/* if(_logValidation(s_name))
            	{
            		s_name = s_name.toUpperCase();
            		s_emp_char = s_name.substring(0, 1);
					let lastFour = s_name.substr(s_name.length - 3); 
            	} */
              if (_logValidation(s_name)) {
    let nameParts = s_name.split(" ");
    if (!isNaN(nameParts[0])) {
        nameParts.shift(); // Remove numeric prefix
    }
    s_name = nameParts.join(" "); // Rejoin the remaining parts
    s_name = s_name.toUpperCase();
    s_emp_char = s_name.substring(0, 2); // Extract the first two letters
}
            	
            	let s_auto_number = s_auto_prfix+'-'+i_unique_num+'-'+i_fullYear;
            	nlapiSetFieldValue('name', s_auto_number);
            	
            	nlapiSubmitField('customrecord_hris_unique_reference_numbe', i_id_unique_ref, 'custrecord_hris_unique_number', i_unique_num);
            	
            }
    	    
        }
        catch (e) {
            if (e instanceof nlobjError) {                
                nlapiLogExecution('DEBUG', 'SearchRecforSameidformed_1 system error', e.getCode() + '\n' + e.getDetails());
            }
            else {               
                nlapiLogExecution('DEBUG', 'SearchRecforSameidformed_1 unexpected error', e.toString());
            }
        }
    }
}
function _AfterSubmit_set_Extended_leaveRefnum(type) 
{
	try{
	 if(type == 'create') 
	 {
		 let id = nlapiGetRecordId();
		 let rec_type = nlapiGetRecordType();
		 let rec_load = nlapiLoadRecord(rec_type,id);
		 let extended_from_leave = rec_load.getFieldValue('custrecord_hris_lve_levappextenfromlev');
		 if(extended_from_leave)
		 {
			nlapiSubmitField(rec_type,extended_from_leave,'custrecord_hris_lve_exten_lveappli_refn0',id);
		 }
	 }
	}catch(e)
	{
		
	}
}


function _Is_Valid(value)
{
    if (value != null && value != '' && value != 'undefined')
    {
        return true;
    }
    return false;
}

function _logValidation(value){
    if (value != null && value != undefined && value != '' && value != 'undefined') {
        return true;
    }
    else {
        return false;
    }
    
}

function _nullValidation(val){
    if (val == null || val == undefined || val == '') {
        return true;
    }
    else {
        return false;
    }
    
}
function getCompanyCurrentDateTime(){
    let currentDateTime = new Date();
    let companyTimeZone = nlapiLoadConfiguration('companyinformation').getFieldText('timezone');
    let timeZoneOffSet = (companyTimeZone.indexOf('(GMT)') == 0) ? 0 : new Number(companyTimeZone.substr(4, 6).replace(/\+|:00/gi, '').replace(/:30/gi, '.5'));
    let UTC = currentDateTime.getTime() + (currentDateTime.getTimezoneOffset() * 60000);
    let companyDateTime = UTC + (timeZoneOffSet * 60 * 60 * 1000);
    
    return new Date(companyDateTime);
}
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_la_delete_record_ues = (() => {
{
  let LeaveApp_status = nlapiGetFieldValue(
    "custrecord_hris_lve_leaveapplicationsts"
  );
  let leaveEncash_Status = nlapiGetFieldValue(
    "custrecord_hris_lve_encashstatus"
  );
  let encashment_Check = nlapiGetFieldValue(
    "custrecord_hris_lve_applylveencashment"
  );
  let Tot_no_Days = nlapiGetFieldValue("custrecord_hris_lve_totalnodays");
  let role = nlapiGetRole();
}

function Leave_pullback_beforeLoadRecord(type, form) {
  let contextObj = nlapiGetContext();
  if (type == "view") {
    let newType = contextObj.getExecutionContext();
    if (newType == "userinterface") {
      let EditButtonOBJ = form.getButton("edit");
      if (LeaveApp_status == "3" && role != "3") {
        EditButtonOBJ.setDisabled(true);
      }
      if (leaveEncash_Status == "3" && role != "3") {
        EditButtonOBJ.setDisabled(true);
      }
    }
  }
  if (type == "edit") {
    let newType = contextObj.getExecutionContext();
    if (newType == "userinterface") {
      if (LeaveApp_status == "3" && role != "3") {
        throw "You can not edit this record";
      }
      if (leaveEncash_Status == "3" && role != "3") {
        throw "You can not edit this record";
      }
    }
  }

  return true;
}

function Leave_pullback_beforeSubmitRecord(type) {
  if (Tot_no_Days < 0) {
    throw "Please Select Comp-Off";
    return false;
  }

  if (LeaveApp_status == "2" || LeaveApp_status == "3") {
    if (type == "delete") {
      throw "You Can not Delete Approved or Rejected Leave";
      return false;
    }
  }
  if (leaveEncash_Status == "2" || leaveEncash_Status == "3") {
    if (type == "delete") {
      throw "You can not delete Approved or Rejected Leave Encashmeent record";
      return false;
    }
  }
  return true;
}

function afterSubmit_delete_record(type) {
  let empArr = [];
  let employeeSearch = nlapiSearchRecord(
    "employee",
    null,
    [["role", "anyof", "1028"]],
    [
      new nlobjSearchColumn("entityid").setSort(false),
      new nlobjSearchColumn("email"),
      new nlobjSearchColumn("role"),
    ]
  );
  if (employeeSearch) {
    for (let i = 0; i < employeeSearch.length; i++) {
      empArr.push(employeeSearch[i].getValue("email"));
    }
  }
  empArr = empArr.toString();

  if (LeaveApp_status == "1") {
    if (type == "delete") {
      let old_record_id = nlapiGetOldRecord();
      let Leave_Status = old_record_id.getFieldValue(
        "custrecord_hris_lve_leaveapplicationsts"
      );
      if (Leave_Status == "1") {
      }
    }
  }
  if (leaveEncash_Status == "1" && encashment_Check == "T") {
    if (type == "delete") {
      let old_record_id = nlapiGetOldRecord();
      let LeaveEncashmnt_Status = old_record_id.getFieldValue(
        "custrecord_hris_lve_leaveapplicationsts"
      );
      if (LeaveEncashmnt_Status == "1") {
      }
    }
  }
}

function HTMLDesign_LeaveApp(old_record_id) {
  let emp_name = old_record_id.getFieldValue(
    "custrecord_hris_lve_employeename"
  );
  let emp_name_txt = old_record_id.getFieldText(
    "custrecord_hris_lve_employeename"
  );
  let Leave_type = old_record_id.getFieldText("custrecord_hris_lve_leavetype");

  let from_date = old_record_id.getFieldValue("custrecord_hris_lve_fromdate");

  let to_date = old_record_id.getFieldValue("custrecord_hris_lve_todate");

  let tot_days = old_record_id.getFieldValue("custrecord_hris_lve_totalnodays");

  let Leave_reason = old_record_id.getFieldValue(
    "custrecord_hris_lve_leavereason"
  );

  let Leave_status = old_record_id.getFieldValue(
    "custrecord_hris_lve_leaveapplicationsts"
  );
  let Leave_statusTxt = old_record_id.getFieldText(
    "custrecord_hris_lve_leaveapplicationsts"
  );
  let Manager = old_record_id.getFieldValue("custrecord_hris_lve_supervisor");

  let Manager_txt = old_record_id.getFieldText(
    "custrecord_hris_lve_supervisor"
  );
  let manager_email = seachManagerMailId(Manager);

  let strVar = "";
  strVar +=
    "	Leave Application raised by " +
    emp_name_txt +
    " has been Pullback. Following are the leave application details:";
  strVar += "<tr>";
  strVar += "		<td>&nbsp;</td>";
  strVar += "	</tr>";
  strVar += '<table border="1" width="493">';
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Employee Name</b></font></td>';
  strVar += '		<td><font color="000000">' + emp_name_txt + "</font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Leave</span> ';
  strVar += "		Type</b></font></td>";
  strVar += "		<td>" + Leave_type + "</span></font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>From Date</b></font></td>';
  strVar += "		<td>" + from_date + "</td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>To Date</b></font></td>';
  strVar += "		<td>" + to_date + "</td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Total no. Of Days</b></font> ';
  strVar += "		</td>";
  strVar += '		<td><font color="000000">' + tot_days + "</font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Leave</span> ';
  strVar += "		Reason</b></font></td>";
  strVar += "		<td>" + Leave_reason + "</font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Leave</span> ';
  strVar += "		Status</b></font></td>";
  strVar += "		<td>" + Leave_statusTxt + "</font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Manager <br>';
  strVar += "&nbsp;</b></font></td>";
  strVar += "		<td>" + Manager_txt + "</font></td>";
  strVar += "	</tr>";
  strVar += "</table>";
  return strVar + "#" + manager_email + "#" + emp_name_txt + "#" + Leave_type;
}

function HTMLDesign_LeaveEncash(old_record_id) {
  let emp_name = old_record_id.getFieldValue(
    "custrecord_hris_lve_employeename"
  );
  let emp_name_txt = old_record_id.getFieldText(
    "custrecord_hris_lve_employeename"
  );
  let Leave_type = old_record_id.getFieldText("custrecord_hris_lve_leavetype");

  let tot_EncashDays = old_record_id.getFieldValue(
    "custrecord_hris_lve_noofencashmentdays"
  );

  let Leave_EncashStatus = old_record_id.getFieldValue(
    "custrecord_hris_lve_encashstatus"
  );
  let Leave_EncashStatusTxt = old_record_id.getFieldText(
    "custrecord_hris_lve_encashstatus"
  );
  let Manager = old_record_id.getFieldValue("custrecord_hris_lve_supervisor");

  let Manager_txt = old_record_id.getFieldText(
    "custrecord_hris_lve_supervisor"
  );
  let manager_email = seachManagerMailId(Manager);

  let strVar = "";
  strVar +=
    "	Leave Encashment application raised by " +
    emp_name_txt +
    " has been Pullback. Following are the leave encashment details:";
  strVar += "<tr>";
  strVar += "		<td>&nbsp;</td>";
  strVar += "	</tr>";
  strVar += '<table border="1" width="493">';
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Employee Name</b></font></td>';
  strVar += '		<td><font color="000000">' + emp_name_txt + "</font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Leave</span> ';
  strVar += "		Type</b></font></td>";
  strVar += "		<td>" + Leave_type + "</span></font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>No. of Encashment days</b></font> ';
  strVar += "		</td>";
  strVar += '		<td><font color="000000">' + tot_EncashDays + "</font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Leave</span> ';
  strVar += "		Status</b></font></td>";
  strVar += "		<td>" + Leave_EncashStatusTxt + "</font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Manager <br>';
  strVar += "&nbsp;</b></font></td>";
  strVar += "		<td>" + Manager_txt + "</font></td>";
  strVar += "	</tr>";
  strVar += "</table>";
  return strVar + "#" + manager_email + "#" + emp_name_txt + "#" + Leave_type;
}
function seachManagerMailId(ManagerId) {
  let EmailId;
  let Filters = new Array();
  Filters.push(new nlobjSearchFilter("internalid", null, "is", ManagerId));
  let Column = new Array();
  Column.push(new nlobjSearchColumn("email"));
  let ManagerMailSearchResult = nlapiSearchRecord(
    "employee",
    null,
    Filters,
    Column
  );
  if (ManagerMailSearchResult != null) {
    EmailId = ManagerMailSearchResult[0].getValue("email");
  }
  return EmailId;
}
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_leave_cancelbutton_ue = (() => {
define(['N/search', 'N/query', 'N/format', 'N/record', 'N/log','N/ui/serverWidget','N/runtime'], function (search, query, format, record, log,serverWidget, runtime) {


    function beforeLoad(scriptContext) {
        let form = scriptContext.form;
        form.clientScriptModulePath = './hris_leave_cancel_cs.js';
        let currentrecord = scriptContext.newRecord;
        let Leaverecordid = currentrecord.id;
        log.debug(' Leaverecordid',  Leaverecordid);
        let currentUser = runtime.getCurrentUser();
        let userRole = currentUser.role;
        log.debug('Current User Role', userRole);

        let approvalstatus = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_hrmsapprovalstatus'
        });
        log.debug('Approval Status',approvalstatus);
        let cancelstatus = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_cancel_leavestatus'
        })||1;
        log.debug('Cancel Status',cancelstatus);
        let cancelcheck = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_cancellation'
        });
              log.debug('Cancel Check',cancelcheck);
              let settlecheck =currentrecord.getValue({
                fieldId:'custrecord_hris_lve_leavesettlement'
              });
              log.debug('Settle check',settlecheck);
              let settlementrefid=currentrecord.getValue({
                fieldId:'custrecord_hris_lve_settlerefno'
              })||'';
             /*  let settlementid=currentrecord.getValue({
                fieldId:'custrecord_hris_lve_settlement_refno'
              })||''; */
              
              let workresumecheck = currentrecord.getValue({
                fieldId: 'custrecord_hris_lve_workresume'
            });
                  log.debug('workresumecheck',workresumecheck);     
        if ( Leaverecordid) {
            let LeaveRecord = record.load({
                type: 'customrecord_hris_leaveapplication',
                id:Leaverecordid,
                isDynamic: true
            });

        //  if (scriptContext.type == 'view' && approvalstatus == 2 && cancelstatus == 1) {    
            if (scriptContext.type == 'view' && approvalstatus == 2 && cancelcheck == false && settlecheck==false && workresumecheck == false) {                 
                form.addButton({
                    id: 'custpage_cancel',
                    label: 'Leavecancel',
                    functionName: 'Cancelclick()' //upload CS Function name
                });
            }

            if (scriptContext.type == 'view' && approvalstatus == 2 && cancelcheck == false && settlecheck==true && settlementrefid=='') {                 
                form.addButton({
                    id: 'custpage_settle',
                    label: 'Leavesettlement',
                    functionName: 'Settlementclick()' //upload CS Function name
                });
            }
            
           

      

        }



    }
   

    return {
        beforeLoad: beforeLoad
    };

});
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_leaveapplicationrecord_ue = (() => {
function beforeLoadRecord(type)
{
return true;
}
function beforeSubmitRecord_record_check(type)
{

	if (type == 'create')
	 {
	
		let emp_name = nlapiGetFieldValue('custrecord_hris_lve_employeename');
		let error = 'This record is already Present for the applied date'
		
		let frm_dt_VL = nlapiGetFieldValue('custrecord_hris_lve_fromdate');
		let frm_date_val = nlapiStringToDate(frm_dt_VL) ;
		
		let to_DTVL = nlapiGetFieldValue('custrecord_hris_lve_todate');
		let to_date_val  = nlapiStringToDate(to_DTVL) ;
		
		if (frm_date_val != '' && frm_date_val != 'undefined' && frm_date_val != null && to_date_val != '' && to_date_val != 'undefined' && to_date_val != null)
		 {
			let LAfilters = new Array();
			let LAcolumns = new Array();
			
			LAfilters.push(new nlobjSearchFilter('custrecord_hris_lve_employeename', null, 'is', emp_name))
			LAfilters.push(new nlobjSearchFilter('custrecord_hris_lve_hrmsapprovalstatus', null, 'noneof', 3 ))
			LAfilters.push(new nlobjSearchFilter('custrecord_hris_lve_cancel_leavestatus', null, 'noneof', 2 ))
			LAcolumns.push(new nlobjSearchColumn('custrecord_hris_lve_fromdate'));
			LAcolumns.push(new nlobjSearchColumn('custrecord_hris_lve_todate'));
			LAcolumns.push(new nlobjSearchColumn('custrecord_hris_lve_leavetype'));
			
			let searchdate = nlapiSearchRecord('customrecord_hris_leaveapplication', null, LAfilters, LAcolumns);
			nlapiLogExecution('DEBUG', 'searchdate', 'searchdate ***********=' + searchdate);
			
			
			if (searchdate != null) 
			{
			   for (let i = 0; i < searchdate.length; i++)
				 {
				    let present_FRMDATE = searchdate[i].getValue('custrecord_hris_lve_fromdate')
                    let present_frm_dt  = nlapiStringToDate(present_FRMDATE) ;
					nlapiLogExecution('DEBUG', 'present_frm_dt', 'present_frm_dt ***********=' + present_frm_dt);
									   
				    let present_TODT = searchdate[i].getValue('custrecord_hris_lve_todate')
                    let present_to_dt  = nlapiStringToDate(present_TODT) ;
					
					nlapiLogExecution('DEBUG', 'present_to_dt', 'present_to_dt ***********=' + present_to_dt);
						
						
					//let leave_type = searchdate[i].getValue('custrecord_hris_lve_leavetype')	
					let E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
        			let leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid'); 
					
				
	                if( leave_type != 6)
					{
						if ((frm_date_val <= present_frm_dt) && (frm_date_val < present_to_dt) && (to_date_val >= present_frm_dt) && (to_date_val <= present_to_dt))
					 {
					 	throw error;
					 }
					else if ((frm_date_val <= present_frm_dt) && (frm_date_val < present_to_dt) && (to_date_val > present_frm_dt) && (to_date_val >= present_to_dt))
					 {
					 	throw error;
					}
					else if ((frm_date_val >= present_frm_dt) && (frm_date_val <= present_to_dt) && (to_date_val > present_frm_dt) && (to_date_val >= present_to_dt)) 
					{
						throw error;
					}
					else if((present_frm_dt < frm_date_val)&& (to_date_val < present_to_dt))
					{
						throw error;
					}
					else if((frm_date_val > present_frm_dt) && (frm_date_val < present_to_dt))
				     {
					    throw error;
				     }
				    else if (+frm_date_val == +present_frm_dt)
			         {
					  throw error;
			         }
						
					}
						
					
				}
				return true;
			}
		}
	}
}
	
	
function afterSubmitRecord_compoff_check(type)
{
	
	if(type != 'delete')
	{
		let RECid = nlapiGetRecordId();
		let LoadRec = nlapiLoadRecord('customrecord_hris_leaveapplication',RECid)
		let Leave_type = LoadRec.getFieldValue('custrecord_hris_lve_leavetype');
		let Employee = LoadRec.getFieldValue('custrecord_hris_lve_employeename');
		nlapiLogExecution('DEBUG', 'Leave_type', 'Leave_type*******'+Leave_type);
		
	let sequence_value = get_sequence_no(Leave_type);
	nlapiLogExecution('DEBUG', 'sequence_value', 'sequence_value*******'+sequence_value);
	
	 if (sequence_value == 5)
	 {
		let status = LoadRec.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
		nlapiLogExecution('DEBUG', 'status', 'status*******'+status);
		let cancel_status = LoadRec.getFieldValue('custrecord_hris_lve_cancel_leavestatus');
		nlapiLogExecution('DEBUG', 'cancel_status', 'cancel_status*******'+cancel_status);
		if (status != 3)
		{
		    let valid_till_date = LoadRec.getFieldValue('custrecord_hris_lve_validtilldate');
			
			let filters = new Array();
			let columns = new Array();
			filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_valid_till_date', null, 'on', valid_till_date))
			filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_employee_name', null, 'is', Employee))
			columns.push(new nlobjSearchColumn('internalid'));
			let compoff_record_result = nlapiSearchRecord('customrecord_hris_lve_raise_comp_off', null, filters, columns);
			if (compoff_record_result != null) 
			{
			    let id = compoff_record_result[0].getValue('internalid')
				let compoff_record = nlapiLoadRecord('customrecord_hris_lve_raise_comp_off', id)
				let check_box = compoff_record.getFieldValue('custrecord_hris_rcomp_checked')
				compoff_record.setFieldValue('custrecord_hris_rcomp_checked', 'T')
				nlapiSubmitRecord(compoff_record);
			}
		}
		
		if (status == 3)
		{
			nlapiLogExecution('DEBUG', '*******reject******', 'into rejected');
		    let valid_till_date = LoadRec.getFieldValue('custrecord_hris_lve_validtilldate');
			nlapiLogExecution('DEBUG', '*******valid_till_date******', 'valid_till_date'+valid_till_date);
			let filters = new Array();
			let columns = new Array();
			filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_valid_till_date', null, 'on',valid_till_date))
            filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_employee_name', null, 'is', Employee))
		    columns.push(new nlobjSearchColumn('internalid'));
			let compoff_record_result = nlapiSearchRecord('customrecord_hris_lve_raise_comp_off', null, filters, columns);
			nlapiLogExecution('DEBUG', '*******compoff_record_result******', 'compoff_record_result'+compoff_record_result);
			if (compoff_record_result != null) 
			{
			    let id = compoff_record_result[0].getValue('internalid')
				nlapiLogExecution('DEBUG', '*******id******', 'id'+id);
				let compoff_record = nlapiLoadRecord('customrecord_hris_lve_raise_comp_off', id)
				let check_box = compoff_record.getFieldValue('custrecord_hris_rcomp_checked')
				nlapiLogExecution('DEBUG', '*******check_box******', 'check_box'+check_box);
				compoff_record.setFieldValue('custrecord_hris_rcomp_checked', 'F')
				nlapiSubmitRecord(compoff_record);
			}
		}
		if (cancel_status == 2)
		{
		    let valid_till_date = LoadRec.getFieldValue('custrecord_hris_lve_validtilldate');
			
			let filters = new Array();
			let columns = new Array();
			filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_valid_till_date', null, 'on', valid_till_date))
            filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_employee_name', null, 'is', Employee))
		
			columns.push(new nlobjSearchColumn('internalid'));
			let compoff_record_result = nlapiSearchRecord('customrecord_hris_lve_raise_comp_off', null, filters, columns);
			if (compoff_record_result != null) 
			{
			    let id = compoff_record_result[0].getValue('internalid')
				let compoff_record = nlapiLoadRecord('customrecord_hris_lve_raise_comp_off', id)
				let check_box = compoff_record.getFieldValue('custrecord_hris_rcomp_checked')
				compoff_record.setFieldValue('custrecord_hris_rcomp_checked', 'F')
				nlapiSubmitRecord(compoff_record);
			}
		}
	}	
		
	}
	
}	
function getDatediffIndays(startDate, endDate)

{
   let one_day=1000*60*60*24;
   let fromDate = startDate;
   let toDate=endDate
   nlapiLogExecution('DEBUG', 'getDatediffIndays', 'From Date = '+fromDate+'To Date = '+toDate);
   let x=fromDate.split("/");
   let y=toDate.split("/");
   let date1=new Date(x[2],(x[1]-1),x[0]);
   let date2=new Date(y[2],(y[1]-1),y[0]);
   let month1=x[1];
   let month2=y[1];
   let Diff = Math.ceil((date2.getTime()-date1.getTime())/(one_day));
   nlapiLogExecution('DEBUG', 'getDatediffIndays', 'Date difference Return Value = '+Diff);
   return Diff;

}



function get_sequence_no(Leave_type)
	{
		
		 nlapiLogExecution('DEBUG', 'intofunction', 'into function leave type'+Leave_type);
		let LCR = nlapiLoadRecord('customrecord_hris_leaveconfig',Leave_type);
		
		let sequence_no = LCR.getFieldValue('custrecord_hris_lvecnfg_seqno')
		return sequence_no ;
	}
{

}
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_leaveapplicationvalidation_ue = (() => {
let QUERY;
define(['N/record', 'N/ui/serverWidget', 'N/search', 'N/query','./moment.js', 'N/runtime','N/format'], function (record, serverWidget, search, query,moment,runtime,format) {
    QUERY = query;
    function beforeLoad(scriptContext) {
        // Leave Cancel / Leave Settlement  Before Load
        let form = scriptContext.form;
        form.clientScriptModulePath = './hris_leave_cancel_cs.js';
        let currentrecord = scriptContext.newRecord;
        let Leaverecordid = currentrecord.id;
        log.debug(' Leaverecordid',  Leaverecordid);
        let currentUser = runtime.getCurrentUser();
        let userRole = currentUser.role;
        log.debug('Current User Role', userRole);
        let user = runtime.getCurrentUser().id;
        let approvalstatus = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_hrmsapprovalstatus'
        });
        log.debug('Approval Status',approvalstatus);
        let cancelstatus = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_cancel_leavestatus'
        })||1;
        log.debug('Cancel Status',cancelstatus);
        let cancelcheck = currentrecord.getValue({
            fieldId: 'custrecord_hris_lve_cancellation'
        });
        let EmpName = currentrecord.getValue('custrecord_hris_lve_employeename');
        let Requestor = currentrecord.getValue('custrecordhris_lve_requestor');
              log.debug('Cancel Check',cancelcheck);
              let settlecheck =currentrecord.getValue({
                fieldId:'custrecord_hris_lve_leavesettlement'
              });
              log.debug('Settle check',settlecheck);
              let settlementrefid=currentrecord.getValue({
                fieldId:'custrecord_hris_lve_settlerefno'
              })||'';
              let settlementid=currentrecord.getValue({
                fieldId:'custrecord_hris_lve_settlement_refno'
              })||'';
              
              let workresumecheck = currentrecord.getValue({
                fieldId: 'custrecord_hris_lve_workresume'
            });
                  log.debug('workresumecheck',workresumecheck);     
        if ( Leaverecordid) {
            let LeaveRecord = record.load({
                type: 'customrecord_hris_leaveapplication',
                id:Leaverecordid,
                isDynamic: true
            });

        //  if (scriptContext.type == 'view' && approvalstatus == 2 && cancelstatus == 1) {    
            if (scriptContext.type == 'view' && approvalstatus == 2 && cancelcheck == false && settlecheck==false && workresumecheck == false) {                 
                form.addButton({
                    id: 'custpage_cancel',
                    label: 'Leavecancel',
                    functionName: 'Cancelclick()' //upload CS Function name
                });
            }

           /*  if (scriptContext.type == 'view' && approvalstatus == 2 && cancelcheck == false && settlecheck==true && settlementrefid==''&& (userRole==1000 || userRole==3)) {                 
                form.addButton({
                    id: 'custpage_settle',
                    label: 'Leavesettlement',
                    functionName: 'HRSettlementclick()' //upload CS Function name
                });
            } */
            if (scriptContext.type == 'view' && approvalstatus == 2 && cancelcheck == false && settlecheck==true && settlementid==''&& (userRole==1008 || userRole==1012 || userRole==3)) {                 
                form.addButton({
                    id: 'custpage_settle',
                    label: 'Leave Settlement',
                    functionName: 'Settlementclick()' //upload CS Function name
                });
            }
            if(scriptContext.type =='view' && approvalstatus==1 && cancelcheck == false &&(user == EmpName || user == Requestor)){
              //  form.clientScriptFileId = 'customscript_hris_lve_pullbackcall_cs';
                form.clientScriptModulePath = './hris_pullbackcall_cs.js';
                form.addButton({
                    id: 'custpage_DeleteButton',
                    label: 'Pullback Leave',
                    functionName: 'PullbackLeave("' + Leaverecordid + '")'
                });
            }
           

      

        }

      // LMS Work Flow Before Load
        
        let status = currentrecord.getValue({ fieldId: 'custrecord_hris_lve_staus' });
        let statusInColor = '<BR><font size=2>STATUS</font><BR><font color="red" size=2>' + (status ? status : 'Draft') + '</font>';
        currentrecord.setValue({ fieldId: 'custrecord_hris_lve_status_incolor', value: statusInColor });
        
        let statusInColorfield = form.getField({ id: 'custrecord_hris_lve_status_incolor' });
        statusInColorfield.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
        
        let namefield = form.getField({ id: 'custrecord_hris_lve_staus' });
        namefield.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

// LA Delete Record


        let newType = runtime.executionContext;
        let LeaveApp_status = currentrecord.getValue('custrecord_hris_lve_hrmsapprovalstatus');
        let leaveEncash_Status = currentrecord.getValue('custrecord_hris_lve_encashstatus');
        let role = runtime.getCurrentUser().role;

        if (scriptContext.type == 'view' && newType === runtime.ContextType.USER_INTERFACE) {
            let editButton = form.getButton('edit');
            if ((LeaveApp_status === '3' || leaveEncash_Status === '3') && role !== '3') {
                editButton.isDisabled = true;
            }
        }

        if (scriptContext.type == 'edit' && newType === runtime.ContextType.USER_INTERFACE) {
            if ((LeaveApp_status === '3' || leaveEncash_Status === '3') && role !== '3') {
                throw new Error('You cannot edit this record');
            }
        }


    }
    function afterSubmit(scriptContext) {
        try {
            let newRecord = scriptContext.newRecord;
            let _record_id = newRecord.id;
            // Section Record Check This record is already present for the applied date

            if (scriptContext.type == scriptContext.UserEventType.CREATE) {
              
                let empName = scriptContext.newRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
                let errorMessage = 'This record is already present for the applied date';
                let fromDate = scriptContext.newRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' });
                let toDate = scriptContext.newRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' });

                let filters = [
                    ['custrecord_hris_lve_employeename', 'anyof', empName], 'AND', [
                        ['custrecord_hris_lve_fromdate', 'onorafter', fromDate], 'AND',
                        ['custrecord_hris_lve_todate', 'onorbefore', toDate]
                    ], 'OR', [
                        ['custrecord_hris_lve_fromdate', 'within', fromDate, toDate]
                    ], 'OR', [
                        ['custrecord_hris_lve_todate', 'within', fromDate, toDate]
                    ]
                ];

                let columns = [
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: 'custrecord_hris_lve_cancellation' }),
                    search.createColumn({ name: 'custrecord_hris_lve_hrmsapprovalstatus' }),
                    search.createColumn({ name: 'custrecord_hris_lve_cancel_leavestatus' })
                ];

                let leaveSearch = search.create({
                    type: 'customrecord_hris_leaveapplication',
                    filters: filters,
                    columns: columns
                }).run().getRange({ start: 0, end: 1000 });

                if (leaveSearch.length > 0) {
                    leaveSearch.forEach(function (result) {
                        let cancelStatus = result.getValue({ name: 'custrecord_hris_lve_cancel_leavestatus' });
                        let approveStatus = result.getValue({ name: 'custrecord_hris_lve_hrmsapprovalstatus' });
                        let cancelChkBox = result.getValue({ name: 'custrecord_hris_lve_cancellation' });

                        log.debug('Leave Check', 'Leave Id: ' + result.getValue({ name: 'internalid' }));

                        if (cancelStatus === '3' || (approveStatus === '1' && cancelChkBox === 'F') || (cancelStatus === '3' && cancelChkBox === 'T')) {
                            throw new Error(errorMessage);
                        }

                        if (!((approveStatus === '2' && cancelChkBox === 'T' && cancelStatus === '2') || approveStatus === '3')) {
                            throw new Error(errorMessage);
                        }
                    });
                }
            }

            // Workresume Functionality
            if (scriptContext.type == scriptContext.UserEventType.EDIT) {
                let newRecord = record.load({ type: 'customrecord_hris_leaveapplication', id: _record_id, isDynamic: true, });
                let todayDate = new Date();
                let workResume = newRecord.getValue('custrecord_hris_lve_workresume');
                let leaveType = newRecord.getValue('custrecord_hris_lve_leavetype');
                let status = newRecord.getValue('custrecord_hris_lve_hrmsapprovalstatus');
                let workResumptionDone = newRecord.getValue('custrecord_hris_lve_workresumptiondone');
                let empployee_name = newRecord.getValue('custrecord_hris_lve_employeename');
                let sequenceNo = getLeaveConfigSequence(leaveType);
                log.debug(" workResumptionDone Sequence No", sequenceNo);
                if (status == 2 && workResumptionDone === false && sequenceNo !== '11' && sequenceNo !== '22') {
                    log.debug('Processing Work Resumption');

                    let workResume = newRecord.getValue('custrecord_hris_lve_workresume');
                    if (workResume) {


                        let expected_resume_back_date = newRecord.getValue('custrecord_hris_lve_expectedresumebackdt');
                        let actual_work_resume_date = newRecord.getValue('custrecord_hris_lve_actualresumedate');
                        let leave_total_number_of_days = newRecord.getValue('custrecord_hris_lve_totalnodays');
                        let total_delay_days = newRecord.getValue('custrecord_hris_lve_actualtotdelaydays');
                        let total_updated_delay_days = newRecord.getValue('custrecord_hris_lve_totalupdateddelayday') || 0;
                        let leave_from_date = newRecord.getValue('custrecord_hris_lve_fromdate');
        
                        actual_work_resume_date = format.parse({ value: actual_work_resume_date, type: format.Type.DATE });
                        expected_resume_back_date = format.parse({ value: expected_resume_back_date, type: format.Type.DATE });
        
                        if (!total_delay_days || total_delay_days === '' || total_delay_days === null || total_delay_days === 'null' || total_delay_days === NaN || total_delay_days === 'NaN') {
                            total_delay_days = 0;
                        }
        
                        total_delay_days = parseInt(total_delay_days, 10);
                        total_updated_delay_days = parseInt(total_updated_delay_days, 10);
        
                        let searchPayGrp = searchPaygroup(empployee_name);
                        log.debug('actual_work_resume_date', actual_work_resume_date);
                        log.debug('expected_resume_back_date', expected_resume_back_date);
                        log.debug('total_delay_days', total_delay_days);
                        log.debug('total_updated_delay_days', total_updated_delay_days);
                        log.debug('todayDate', todayDate);
        
                        let date_day = todayDate.getDate();
                        let wageDate = searchWagePeriod(searchPayGrp);
                        let wDate = wageDate.split('#');
                        log.debug('w_Date', wDate);
                        let end_date = wDate[0];
                       end_date= format.parse({value: end_date, type: format.Type.DATE})
                        log.debug('end_date', end_date);
                        let start_date = wDate[1];
                        start_date=format.parse({value: start_date, type: format.Type.DATE})
                        log.debug('start_date', start_date);
                        let leave_month = wDate[2];
                        log.debug('leave_month', leave_month);
                        let leave_year_id = wDate[3];
                        log.debug('leave_year_id', leave_year_id);
        
                        let mth = actual_work_resume_date.getMonth() + 1;
                        log.debug('mth', mth);
                        let arrear_month = mth;
        
                        if (workResume == true) {
                            if ((actual_work_resume_date < todayDate || total_delay_days < total_updated_delay_days) && sequenceNo !== '2') {
                                log.debug('Called Sequence not equal to 2 $$$$$$$$$$$$$$$$$$$$$$');
        
                                if (empployee_name && leaveType && total_delay_days < 0) {
                                    total_delay_days = Math.abs(total_delay_days);
                                    let leaveBalanceSearch = search.create({
                                        type: 'customrecord_hris_leavebalance',
                                        filters: [
                                            ['isinactive', 'is', 'F'],
                                            'AND',
                                            ['custrecord_hris_lvbal_employee_name', 'anyof', empployee_name],
                                            'AND',
                                            ['custrecord_hris_lvbal_leave_type', 'anyof', leaveType]
                                        ],
                                        columns: [
                                            'internalid',
                                            'custrecord_hris_lvbal_available_leave_ba',
                                            'custrecord_hris_lvbal_leave_balance_take'
                                        ]
                                    });
        
                                    let leaveBalanceResult = leaveBalanceSearch.run().getRange({ start: 0, end: 1 });
        
                                    if (leaveBalanceResult.length > 0) {
                                        let internal_id = leaveBalanceResult[0].getValue('internalid');
                                        let balanceRecord = record.load({ type: 'customrecord_hris_leavebalance', id: internal_id });
        
                                        let avl_leave_bal = balanceRecord.getValue('custrecord_hris_lvbal_available_leave_ba');
                                        let leave_bal_taken = balanceRecord.getValue('custrecord_hris_lvbal_leave_balance_take');
        
                                        avl_leave_bal = avl_leave_bal || 0;
                                        leave_bal_taken = leave_bal_taken || 0;
        
                                        avl_leave_bal = parseFloat(avl_leave_bal) + parseFloat(total_delay_days);
                                        leave_bal_taken = parseFloat(leave_bal_taken) - parseFloat(total_delay_days);
        
                                        if (sequenceNo !== '2') {
                                            balanceRecord.setValue('custrecord_hris_lvbal_available_leave_ba', avl_leave_bal);
                                        }
                                        balanceRecord.setValue('custrecord_hris_lvbal_leave_balance_take', leave_bal_taken);
        
                                        let leaveBalanceSubmit = record.submitFields({
                                            type: 'customrecord_hris_leavebalance',
                                            id: internal_id,
                                            values: {
                                                'custrecord_hris_lvbal_available_leave_ba': avl_leave_bal,
                                                'custrecord_hris_lvbal_leave_balance_take': leave_bal_taken
                                            }
                                        });
                                        log.debug('leave_balnce_submit', leaveBalanceSubmit);
                                    }
                                }
                               else if (total_delay_days > 0) {
                                    let leaveBalanceSearch = search.create({
                                        type: 'customrecord_hris_leavebalance',
                                        filters: [
                                            ['isinactive', 'is', 'F'],
                                            'AND',
                                            ['custrecord_hris_lvbal_employee_name', 'anyof', empployee_name],
                                            'AND',
                                            ['custrecord_hris_lvbal_leave_type.custrecord_hris_lvecnfg_seqno', 'equalto', '2']
                                        ],
                                        columns: [
                                            'internalid',
                                            'custrecord_hris_lvbal_available_leave_ba',
                                            'custrecord_hris_lvbal_leave_balance_take'
                                        ]
                                    });
                        
                                    let leaveBalanceResult = leaveBalanceSearch.run().getRange({ start: 0, end: 1 });
                        
                                    if (leaveBalanceResult.length > 0) {
                                        let balanceRecordId = leaveBalanceResult[0].getValue('internalid');
                                        let balanceRecord = record.load({
                                            type: 'customrecord_hris_leavebalance',
                                            id: balanceRecordId,
                                            isDynamic: true,
                                        });
                        
                                        let leave_bal_taken = parseFloat(balanceRecord.getValue('custrecord_hris_lvbal_leave_balance_take')) || 0;
                                        leave_bal_taken += total_delay_days;
                        
                                        balanceRecord.setValue({
                                            fieldId: 'custrecord_hris_lvbal_leave_balance_take',
                                            value: leave_bal_taken
                                        });
                        
                                        balanceRecord.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });;
                                        log.debug('Leave Balance Updated', 'Leave Balance Take updated for employee ' + empployee_name);
                                    }
                                }
                                if (empployee_name && leaveType) {

                                    if (todayDate > expected_resume_back_date) { // create arrears only if today date is greater than expected resume date
                                        log.debug('create arrear entry');
                                        
                                        // calculating the arrears days based on the below condition
                                        let calculate_date;
                                        if (actual_work_resume_date < expected_resume_back_date) {
                                            calculate_date = expected_resume_back_date;
                                        } else {
                                            calculate_date = actual_work_resume_date;
                                        }
                    
                                        let daysDiff = Math.round((todayDate.getTime() - calculate_date.getTime()) / (24 * 60 * 60 * 1000));
                                        log.debug('create arrear entry daysDiff', daysDiff);
                    
                                        if (daysDiff > 0) { // arrears create only greater than 0 days
                                            let arrears_record = search.create({
                                                type: "customrecord_hris_unpaid_arrear_entry",
                                                filters: [
                                                    ["isinactive", "is", "F"],
                                                    "AND",
                                                    ["custrecord_hris_uae_employee_name", "anyof", empployee_name],
                                                    "AND",
                                                    ["custrecord_hris_uae_pay_group", "anyof", searchPayGrp],
                                                    "AND",
                                                    ["custrecord_hris_uae_month", "is", leave_month],
                                                    "AND",
                                                    ["custrecord_hris_uae_year", "is", leave_year_id],
                                                    "AND",
                                                    ["custrecord_hris_uae_leave_reference_no", "is", _record_id]
                                                ],
                                                columns: [
                                                    search.createColumn({ name: "internalid" })
                                                ]
                                            }).run().getRange({ start: 0, end: 1 });
                    
                                            if (!arrears_record || arrears_record.length === 0) {
                                                log.debug('Arrear creation below 25');
                    
                                                let create_arrears = record.create({
                                                    type: 'customrecord_hris_unpaid_arrear_entry',
                                                    isDynamic: true,
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_employee_name',
                                                    value: empployee_name
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_pay_group',
                                                    value: searchPayGrp
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_pay_date',
                                                    value: end_date
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_month',
                                                    value: leave_month
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_year',
                                                    value: leave_year_id
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_arrear_days',
                                                    value: daysDiff
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_arrear_month',
                                                    value: arrear_month
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_leave_reference_no',
                                                    value: _record_id
                                                });
                    
                                                create_arrears.setValue({
                                                    fieldId: 'custrecord_hris_uae_remark',
                                                    value: 'Unpaid Arrear entry against work resumption'
                                                });
                    
                                                let create_arrears_id = create_arrears.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                                log.debug('create_arrears submit', create_arrears_id);
                                            } else {
                                                let internal_id = arrears_record[0].id;
                                                let load_record = record.load({
                                                    type: 'customrecord_hris_unpaid_arrear_entry',
                                                   
                                                    id: internal_id,
                                                    isDynamic: true,
                                                });
                    
                                                load_record.setValue({
                                                    fieldId: 'custrecord_hris_uae_arrear_days',
                                                    value: daysDiff
                                                });
                    
                                                let load_arrears_submit = load_record.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                                log.debug('load_arrears_submit', load_arrears_submit);
                                            }
                                        }
                                    }
                                }
                            }
                            if (sequenceNo == '2') {
                                log.debug('Called Sequence equal to 2 ***********************');
                    
                                let employeeName = newRecord.getValue({ fieldId: 'employee_name' });
                                let leaveType = newRecord.getValue({ fieldId: 'leave_type' });
                                let totalDelayDays = newRecord.getValue({ fieldId: 'total_delay_days' });
                                let actualWorkResumeDate =newRecord.getValue({ fieldId: 'actual_work_resume_date' });
                                let todayDate = new Date();
                    
                                if (employeeName && leaveType) {
                                    let leaveBalanceSearch = search.create({
                                        type: 'customrecord_hris_leavebalance',
                                        filters: [
                                            ['isinactive', 'is', 'F'],
                                            'AND',
                                            ['custrecord_hris_lvbal_employee_name', 'anyof', employeeName],
                                            'AND',
                                            ['custrecord_hris_lvbal_leave_type', 'anyof', leaveType]
                                        ],
                                        columns: [
                                            'internalid',
                                            'custrecord_hris_lvbal_available_leave_ba',
                                            'custrecord_hris_lvbal_leave_balance_take'
                                        ]
                                    });
                    
                                    let searchResult = leaveBalanceSearch.run().getRange({ start: 0, end: 1 });
                    
                                    if (searchResult.length > 0) {
                                        let internalId = searchResult[0].getValue({ name: 'internalid' });
                                        let balanceRecord = record.load({
                                            type: 'customrecord_hris_leavebalance',
                                            id: internalId,
                                            isDynamic: true,
                                        });
                    
                                        let leaveBalTaken = balanceRecord.getValue({ fieldId: 'custrecord_hris_lvbal_leave_balance_take' });
                                        if (!leaveBalTaken) {
                                            leaveBalTaken = 0;
                                        }
                    
                                        leaveBalTaken = parseFloat(leaveBalTaken) + parseFloat(totalDelayDays);
                                        balanceRecord.setValue({
                                            fieldId: 'custrecord_hris_lvbal_leave_balance_take',
                                            value: leaveBalTaken
                                        });
                    
                                        let leaveBalanceSubmit = balanceRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                        log.debug('leave_balance_submit for sequence_no 2', leaveBalanceSubmit);
                    
                                        let oneDay = 24 * 60 * 60 * 1000;
                                        let daysDiff = Math.round((new Date(actualWorkResumeDate).getTime() - todayDate.getTime()) / oneDay);
                    
                                        if (daysDiff > 0) {
                                            let arrearsSearch = search.create({
                                                type: 'customrecord_hris_unpaid_arrear_entry',
                                                filters: [
                                                    ['isinactive', 'is', 'F'],
                                                    'AND',
                                                    ['custrecord_hris_uae_employee_name', 'anyof', employeeName],
                                                    'AND',
                                                    ['custrecord_hris_uae_pay_group', 'anyof', searchPayGrp],
                                                    'AND',
                                                    ['custrecord_hris_uae_month', 'is', leave_month],
                                                    'AND',
                                                    ['custrecord_hris_uae_year', 'is', leave_year_id],
                                                    'AND',
                                                    ['custrecord_hris_uae_leave_reference_no', 'is', _record_id]
                                                ],
                                                columns: ['internalid']
                                            });
                    
                                            let arrearsResult = arrearsSearch.run().getRange({ start: 0, end: 1 });
                    
                                            if (arrearsResult.length === 0) {
                                                log.debug('Arrear creation for sequence_no 2');
                                                let createArrears = record.create({
                                                    type: 'customrecord_hris_unpaid_arrear_entry',
                                                    isDynamic: true,
                                                });
                    
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_employee_name', value: employeeName });
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_pay_group', value:searchPayGrp });
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_pay_date', value: end_date });
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_month', value: leave_month });
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_year', value: leave_year_id});
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_arrear_days', value: daysDiff });
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_arrear_month', value: arrear_month });
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_leave_reference_no', value: _record_id});
                                                createArrears.setValue({ fieldId: 'custrecord_hris_uae_remark', value: 'Unpaid Arrear entry against work resumption' });
                    
                                                let createArrearsSubmit = createArrears.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                                log.debug('create_arrears submit', createArrearsSubmit);
                                            } else {
                                                let internalIdArrears = arrearsResult[0].getValue({ name: 'internalid' });
                                                let loadRecord = record.load({
                                                    type: 'customrecord_hris_unpaid_arrear_entry',
                                                    id: internalIdArrears,
                                                    isDynamic: true,
                                                });
                    
                                                loadRecord.setValue({ fieldId: 'custrecord_hris_uae_arrear_days', value: daysDiff });
                    
                                                let loadArrearsSubmit = loadRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
                                                log.debug('load_arrears_submit for sequence_no 2', loadArrearsSubmit);
                                            }
                                        }
                                    }
                                }
                            }
                        
                            
                        }
              


                        newRecord.setValue('custrecord_hris_lve_workresumptiondone', true);
                        newRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
                        log.debug('Work Resumption Done Updated', 'Success');


                        //  }
                        // }

                        // Work resume date and Status Updation
                        // Get the value of 'custrecord_hris_lve_workresume'
                        // if (workResume) {
                        // Fetch 'custrecord_hris_lve_actualresumedate' and 'custrecord_hris_lve_employeename'
                        let actualResumeDate = newRecord.getValue('custrecord_hris_lve_actualresumedate');
                        let employeeId = newRecord.getValue('custrecord_hris_lve_employeename');

                        if (actualResumeDate && employeeId) {
                            let employeeRecord = record.load({
                                type: record.Type.EMPLOYEE,
                                id: employeeId,
                                isDynamic: true
                            });

                            // Set the rejoin date
                            employeeRecord.setValue({
                                fieldId: 'custentity_hris_rejoin_date',
                                value: actualResumeDate
                            });
                            employeeRecord.setValue({
                                fieldId: 'custentity_hris_empemploymentstatus',
                                value: 1,
                                ignoreFieldChange: true
                            });
                            // Save the record ignoring mandatory fields
                            employeeRecord.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            });

                            log.debug({
                                title: 'Employee Record Updated',
                                details: 'Employee ID: ' + employeeId + ', Rejoin Date: ' + actualResumeDate
                            });
                            let empcompensql = "select * from customrecord_hris_employee_compen_change \
                    where custrecord_hris_empchange_employee_nam ="+ employeeId + " and isinactive ='F'"

                            log.debug('empcompensql', empcompensql);

                            let empcompensqlrecords = getResult(empcompensql);

                            if (empcompensqlrecords.length > 0) {
                                let compenid = empcompensqlrecords[0].id;
                                let EmployeecompenID = record.submitFields({
                                    type: 'customrecord_hris_employee_compen_change',
                                    id: compenid,
                                    values: {
                                        'custrecord_hris_empchange_emp_active_sts': 1
                                    }
                                });

                            }
                            log.debug("Info", "EmployeeCompensationStatus also Updated. Internal ID : " + EmployeecompenID);
                        }
                        else {
                            log.error({
                                title: 'Missing Data',
                                details: 'Actual Resume Date or Employee ID is missing.'
                            });
                        }

                    }
                }
                if (status == 2 && workResumptionDone == false && work_resume == true && sequenceNo == '11') {
                        
                    log.debug('sequenceNo', sequenceNo);
                    
                 
                    
                    let expected_resume_back_date = newRecord.getValue('custrecord_hris_lve_expectedresumebackdt');
                    let actual_work_resume_date = newRecord.getValue('custrecord_hris_lve_actualresumedate');
                    let leave_total_number_of_days = newRecord.getValue('custrecord_hris_lve_totalnodays');
                    let total_delay_days = newRecord.getValue('custrecord_hris_lve_actualtotdelaydays');
                    let total_updated_delay_days = newRecord.getValue('custrecord_hris_lve_totalupdateddelayday');
                    let leave_from_date = newRecord.getValue('custrecord_hris_lve_fromdate');
                    leave_from_date=format.parse({value: leave_from_date, type: format.Type.DATE})
                    
                   // let paid_leave_end_date = util.addDays(format.parse({value: leave_from_date, type: format.Type.DATE}), 45);
                    let paid_leave_end_date=  moment(leave_from_date).add(45, 'days');
                    log.debug('leave_from_date', leave_from_date);
                    log.debug('paid_leave_end_date', paid_leave_end_date);
                    
                    function monthDiff(dateFrom, dateTo) {
                        return dateTo.getMonth() - dateFrom.getMonth() + 1 +
                            (12 * (dateTo.getFullYear() - dateFrom.getFullYear()));
                    }
                    
                    let total_months_difference = monthDiff(new Date(format.parse({value: leave_from_date, type: format.Type.DATE})), new Date(paid_leave_end_date));
        
                    actual_work_resume_date = format.parse({value: actual_work_resume_date, type: format.Type.DATE});
                    expected_resume_back_date = format.parse({value: expected_resume_back_date, type: format.Type.DATE});
                    
                    if (!total_delay_days || total_delay_days == '' || total_delay_days == null || total_delay_days == 'null' || total_delay_days == NaN || total_delay_days == 'NaN') {
                        total_delay_days = 0;
                    }
                    
                    total_delay_days = parseInt(total_delay_days);
                    total_updated_delay_days = parseInt(total_updated_delay_days);
                    
                    let searchPayGrp = searchPayGroup(empployee_name);
                    
                    log.debug('actual_work_resume_date', actual_work_resume_date);
                    log.debug('expected_resume_back_date', expected_resume_back_date);
                    log.debug('total_delay_days', total_delay_days);
                    log.debug('total_updated_delay_days', total_updated_delay_days);
                    log.debug('todayDate', todayDate);
                    
                    let date_day = todayDate.getDate();
                    
                    let leave_month = actual_work_resume_date.getMonth() + 1;
                    let leave_year = actual_work_resume_date.getFullYear();
                    
                    log.debug('leave_month', leave_month);
                    log.debug('leave_year', leave_year);
                    
                    let leave_year_id = searchYear(leave_year);
                    
                    let arrear_month = leave_month;
                    let current_month = todayDate.getMonth() + 1;
                    log.debug('current_month', current_month);
                    
                    if (todayDate.getDate() > 24 && current_month == leave_month) {
                        leave_month = leave_month + 1;
                        if (leave_month == 12) {
                            leave_year = parseInt(leave_year) + 1;
                            leave_year_id = searchYear(leave_year);
                        }
                    }
                    
                    if (current_month != leave_month && todayDate.getDate() < 25) {
                        leave_month = leave_month + 1;
                        if (leave_month == 12) {
                            leave_year = parseInt(leave_year) + 1;
                            leave_year_id = searchYear(leave_year);
                        }
                    }
                    
                    log.debug('unpaid creation month ', leave_month);
                    log.debug('unpaid creation year', leave_year);
                    log.debug('unpaid creation year id', leave_year_id);
                    
                    let finalDate = remFormatedDate(leave_year, leave_month, '01');
                    let date = format.parse({value: finalDate, type: format.Type.DATE});
                    let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                    let end_date = formatedDate(format.format({value: lastDay, type: format.Type.DATE}));
                    log.debug('formate end_date', end_date);
                    
                    if (work_resume == 'T') {
                        if (empployee_name && leaveType && total_delay_days != 0) {
                            let customrecord_hris_leavebalanceSearch = search.create({
                                type: 'customrecord_hris_leavebalance',
                                filters: [
                                    ['isinactive', 'is', 'F'],
                                    'AND',
                                    ['custrecord_hris_lvbal_employee_name', 'anyof', empployee_name],
                                    'AND',
                                    ['externalidstring', 'custrecord_hris_lvbal_leave_type', 'is', '1']
                                ],
                                columns: [
                                    'internalid',
                                    'custrecord_hris_lvbal_available_leave_ba',
                                    'custrecord_hris_lvbal_leave_balance_take'
                                ]
                            }).run().getRange({start: 0, end: 1});
                            
                            if (customrecord_hris_leavebalanceSearch.length > 0) {
                                let internal_id = customrecord_hris_leavebalanceSearch[0].getValue('internalid');
                                let _balace_record = record.load({
                                    type: 'customrecord_hris_leavebalance',
                                    id: internal_id,
                                    isDynamic: true,
                                });
                                
                                let avl_leave_bal = _balace_record.getValue('custrecord_hris_lvbal_available_leave_ba');
                                let leave_bal_taken = _balace_record.getValue('custrecord_hris_lvbal_leave_balance_take');
                                
                                avl_leave_bal = avl_leave_bal || 0;
                                leave_bal_taken = leave_bal_taken || 0;
                                
                                leave_bal_taken = parseFloat(leave_bal_taken) + parseFloat(total_delay_days);
                                _balace_record.setValue('custrecord_hris_lvbal_leave_balance_take', leave_bal_taken);
                                
                                let leave_balnce_submit = _balace_record.save();
                                log.debug('leave_balnce_submit', leave_balnce_submit);
                            }
                            
                            if (total_delay_days > 0) {
                                let filter = [];
                                let column = [];
                                leave_month = gethrisMonth(leave_month);
                                filter.push(['custrecord_hris_ule_leave_reference_no', null, 'is', _record_id]);
                                filter.push(['custrecord_hris_ule_pay_group', null, 'is', searchPayGrp]);
                                filter.push(['custrecord_hris_ule_month', null, 'is', leave_month]);
                                filter.push(['custrecord_hris_ule_year', null, 'is', leave_year_id]);
                                filter.push(['custrecord_hris_ule_leave_type', null, 'is', 3]);
                                filter.push(['isinactive', null, 'is', 'F']);
                                
                                column.push('internalid');
                                let unpLeaveSearch = search.create({
                                    type: 'customrecord_hris_unpaid_leave_entry',
                                    filters: filter,
                                    columns: column
                                }).run().getRange({start: 0, end: 1});
                                
                                if (unpLeaveSearch.length === 0) {
                                    log.debug('Inside !unpLeaveSearch Create part');
                                    let unpLeavRecord = record.create({
                                        type: 'customrecord_hris_unpaid_leave_entry',
                                        isDynamic: true,
                                    });
                                    
                                    unpLeavRecord.setValue('custrecord_hris_ule_leave_reference_no', _record_id);
                                    unpLeavRecord.setValue('custrecord_hris_ule_employee_name', empployee_name);
                                    unpLeavRecord.setValue('custrecord_hris_ule_leave_type', 3);
                                    unpLeavRecord.setValue('custrecord_hris_ule_noof_days', total_delay_days);
                                    unpLeavRecord.setValue('custrecord_hris_ule_pay_group', searchPayGrp);
                                    unpLeavRecord.setValue('custrecord_hris_ule_reason', 'Work Resumption');
                                    unpLeavRecord.setValue('custrecord_hris_ule_pay_date', end_date);
                                    unpLeavRecord.setValue('custrecord_hris_ule_month', leave_month);
                                    unpLeavRecord.setValue('custrecord_hris_ule_year', leave_year_id);
                                    unpLeavRecord.setValue('custrecord_hris_ule_final_days', total_delay_days);
                                    
                                    let createdRecordID = unpLeavRecord.save();
                                    log.debug('createdRecordID unpaid', createdRecordID);
                                } else {
                                    let unpaid_id = unpLeaveSearch[0].id;
                                    let load_record = record.load({
                                        type: 'customrecord_hris_unpaid_leave_entry',
                                        id: unpaid_id,
                                        isDynamic: true,
                                    });
                                    
                                    let no_of_days = load_record.getValue('custrecord_hris_ule_noof_days');
                                    no_of_days = parseInt(no_of_days);
                                    load_record.setValue('custrecord_hris_ule_noof_days', no_of_days + total_delay_days);
                                    load_record.setValue('custrecord_hris_ule_final_days', no_of_days + total_delay_days);
                                    
                                    let createdRecordID = load_record.save();
                                    log.debug('updated createdRecordID unpaid', createdRecordID);
                                }
                            }
                        }
                    }
                }
            }
            // Monthly Salary Input creation
            if (scriptContext.type == scriptContext.UserEventType.EDIT) {
               
                let newRecord = scriptContext.newRecord;
                let recordId= newRecord.id;
                log.debug('recordId', recordId);
                let o_leaveApp = record.load({ type: 'customrecord_hris_leaveapplication', id: recordId, isDynamic: true, });
    
                let emp_Id = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
                log.debug('WFH', 'emp_Id --> ' + emp_Id);
    
                let leaveType = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
                log.debug('WFH', 'leaveType --> ' + leaveType);
    
                let leaveRefNo = o_leaveApp.getValue({ fieldId: 'name' });
                let LeaveApplication_Status = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_hrmsapprovalstatus' });
                log.debug('WFH', 'LeaveApplication_Status --> ' + LeaveApplication_Status);
    
                let leaveCancelStatus = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_cancel_leavestatus' });
                let cancel_check = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_cancellation' });
                let salAmt = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_airticketamount' });
                let airTicketChk = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_airticketrequired' });
    
                log.debug('LeaveApplication_Status', LeaveApplication_Status);
                log.debug('cancel_check', cancel_check);
                log.debug('airTicketChk', airTicketChk);
    
                let seq_no = getLeaveConfigSequence(leaveType);
                if (airTicketChk == true && cancel_check == false && LeaveApplication_Status == '2') {
                    let fromDate = o_leaveApp.getValue({ fieldId: 'custrecord_hris_lve_fromdate' });
                    log.debug('Integration fromDate', fromDate);
                    fromDate = format.parse({ value: fromDate, type: format.Type.DATE });
                    
                    let searchPayGrp = searchPayGrp(emp_Id);
                    let payComp = searchPayComp(searchPayGrp);
    
                    fromDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0);  // Get last day of the month
                    let lastDayDate_frmDate = fromDate.getDate();
                    let lastDayMonth_frmDate = fromDate.getMonth() + 1;
                    let lastDayYear_frmDate = fromDate.getFullYear();
    
                    let finalDate_toDate = remFormatedDate(lastDayYear_frmDate, lastDayMonth_frmDate, lastDayDate_frmDate);
                    log.debug('Integration finalDate_toDate', finalDate_toDate);
                    log.debug('payComp', payComp);
    
                    let year = lastDayYear_frmDate;
                    year = year.toString();
                    let YearId = searchYear(year);
    
                    let filters = [
                        ['custrecord_hris_mthsal_empname', 'is', emp_Id],
                        'AND',
                        ['custrecord_hris_mthsal_year', 'is', YearId],
                        'AND',
                        ['custrecord_hris_mthsal_paycomponent', 'is', payComp],
                        'AND',
                        ['custrecord_hris_mthsal_msileaverefno', 'anyof', recordId],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ];
    
                    let searchResult = search.create({
                        type: 'customrecord_hris_monthlysalinput',
                        filters: filters,
                        columns: ['internalid']
                    }).run().getRange({ start: 0, end: 1 });
    
                    if (searchResult.length === 0) {
                        let msi_rec = record.create({ type: 'customrecord_hris_monthlysalinput', isDynamic: true, });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_empname', value: emp_Id });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_paygroup', value: searchPayGrp });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_paydt', value: finalDate_toDate });
    
                        lastDayMonth_frmDate = gethrisMonth(lastDayMonth_frmDate);  // Assuming this function returns the correct month format
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_month', value: lastDayMonth_frmDate });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_year', value: YearId });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_paycomponent', value: payComp });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_salaryamount', value: salAmt });
                        msi_rec.setValue({ fieldId: 'custrecord_hris_mthsal_msileaverefno', value: recordId });
    
                        let id = msi_rec.save({ enableSourcing: true, ignoreMandatoryFields: true });
                        log.debug('created id', id);
                    }
                }
            }
        } catch (error) {
            log.error({
                title: 'Error in After Submit',
                details: error.message
            });
        }
    }
    function beforeSubmit(scriptContext){


        // Generate Reference No

      
        if (scriptContext.type === scriptContext.UserEventType.CREATE) {
            
                let newRecord = scriptContext.newRecord;
                
                let s_auto_prfix = '';
                let recordType = newRecord.type;
                log.debug('userEventBeforeLoad', 'Record Type: ' + recordType);
                if (recordType =="customrecord_hris_leaveapplication") {
                    s_auto_prfix = "LA";
                  }
                
                
                
                let i_rec_type_id = newRecord.getValue({ fieldId: 'rectype' });
                log.debug('i_rec_type_id', i_rec_type_id);
                
                let searchResults = search.create({
                    type: 'customrecord_hris_unique_reference_numbe',
                    filters: [
                        ['custrecord_hris_record_type', 'anyof', i_rec_type_id],
                        'AND',
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['custrecord_hris_record_type', 'custrecord_hris_unique_number']
                }).run().getRange({ start: 0, end: 1 });
                
                if (searchResults.length > 0) {
                    let uniqueRefRecord = searchResults[0];
                    let i_id_unique_ref = uniqueRefRecord.id;
                    let i_unique_num = parseInt(uniqueRefRecord.getValue('custrecord_hris_unique_number')) + 1;
                    
                    let d_current_date = new Date();
                    let i_fullYear = d_current_date.getFullYear();
                    
                    let i_employee;
                   
                            i_employee = newRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
                   
                    
                    let s_name = search.lookupFields({
                        type: 'employee',
                        id: i_employee,
                        columns: ['firstname']
                    }).firstname;
                    
                    let s_emp_char = '';
                    if (s_name) {
                        let nameParts = s_name.split(' ');
                        if (!isNaN(nameParts[0])) {
                            nameParts.shift();
                        }
                        s_name = nameParts.join(' ').toUpperCase();
                        s_emp_char = s_name.substring(0, 2);
                    }
                    
                    let s_auto_number = s_auto_prfix + '-' + i_unique_num + '-' + i_fullYear;
                    newRecord.setValue({ fieldId: 'name', value: s_auto_number });
                    
                    record.submitFields({
                        type: 'customrecord_hris_unique_reference_numbe',
                        id: i_id_unique_ref,
                        values: { 'custrecord_hris_unique_number': i_unique_num }
                    });
                }
           
    }

        // Pull Back Details

        if (scriptContext.type == scriptContext.UserEventType.DELETE) {
        
        
        let newRecord = scriptContext.newRecord;
        let custformscript =newRecord.getValue('custrecord_hris_lve_script_version');
       log.debug("custformscript",custformscript)
     if (custformscript == 1){ 
       
        // Get field values
        let EmployeeNAME = newRecord.getValue('custrecord_hris_lve_employeename');
        let EmployeeCODE = newRecord.getValue('custrecord_hris_lve_empcode');
        let Manager = newRecord.getValue('custrecord_hris_lve_supervisor');
        let ProjectSupervisor = newRecord.getValue('custrecord_hris_lve_project_supervisor');
        let LeaveType = newRecord.getValue('custrecord_hris_lve_leavetype');
        let LeaveBalance = newRecord.getValue('custrecord_hris_lve_leavebalance');
        let FromDate = newRecord.getValue('custrecord_hris_lve_fromdate');
        let FromHalfDay = newRecord.getValue('custrecord_hris_lve_fromhalfday');
        let ToDate = newRecord.getValue('custrecord_hris_lve_todate');
        let ToHalfDay = newRecord.getValue('custrecord_hris_lve_tohalfday');
        let TotalNoDays = newRecord.getValue('custrecord_hris_lve_totalnodays');
        let ValidTillDate = newRecord.getValue('custrecord_hris_lve_validtilldate');
        let LeaveReason = newRecord.getValue('custrecord_hris_lve_leavereason');
        let SupportDoc = newRecord.getValue('custrecord_hris_lve_supportdocument');
        let LeaveAppStatus = newRecord.getValue('custrecord_hris_lve_staus');
        
        // Create Pullback record
        let pullBackRecord = record.create({
            type: 'customrecord_hris_pullback_lveapplicatio',
            isDynamic: true
        });
        
        pullBackRecord.setValue('custrecord_hris_plb_employee_name', EmployeeNAME);
        pullBackRecord.setValue('custrecord_hris_plb_employee_code', EmployeeCODE);
        pullBackRecord.setValue('custrecord_hris_plb_supervisor', Manager);
        pullBackRecord.setValue('custrecord_hris_plb_hod', ProjectSupervisor);
        pullBackRecord.setValue('custrecord_hris_plb_leave_type', LeaveType);
        pullBackRecord.setValue('custrecord_hris_plb_leave_balance', LeaveBalance);
        pullBackRecord.setValue('custrecord_hris_plb_from_date', FromDate);
        pullBackRecord.setValue('custrecord_hris_plb_from_halfday', FromHalfDay);
        pullBackRecord.setValue('custrecord_hris_plb_todate', ToDate);
        pullBackRecord.setValue('custrecord_hris_plb_to_halfday', ToHalfDay);
        pullBackRecord.setValue('custrecord_hris_plb_total_days', TotalNoDays);
        pullBackRecord.setValue('custrecord_hris_plb_vaid_tilldate', ValidTillDate);
        pullBackRecord.setValue('custrecord_hris_plb_leave_reason', LeaveReason);
        pullBackRecord.setValue('custrecord_hris_plb_support_document', SupportDoc);
        pullBackRecord.setValue('custrecord_hris_plb_leave_applica_status', LeaveAppStatus);
        
        let pullBackRecord_ID = pullBackRecord.save({ enableSourcing: true, ignoreMandatoryFields: true });
        log.debug('Pullback Record Created', pullBackRecord_ID);
    }
}
// LA Delete Record Validation
let newRecord = scriptContext.newRecord;
let Tot_no_Days = newRecord.getValue('custrecord_hris_lve_totalnodays');
let LeaveApp_status = newRecord.getValue('custrecord_hris_lve_hrmsapprovalstatus');
let leaveEncash_Status = newRecord.getValue('custrecord_hris_lve_encashstatus');

/* if (Tot_no_Days < 0) {
    throw new Error('Please Select Comp-Off');
} */

if ((LeaveApp_status === '2' || LeaveApp_status === '3') && scriptContext.type === scriptContext.UserEventType.DELETE) {
    throw new Error('You cannot delete an Approved or Rejected Leave');
}

if ((leaveEncash_Status === '2' || leaveEncash_Status === '3') && scriptContext.type === scriptContext.UserEventType.DELETE) {
    throw new Error('You cannot delete an Approved or Rejected Leave Encashment record');
}
}
    function getCurrentDate() {
        let today = new Date();
        let dd = today.getDate();
        let mm = today.getMonth() + 1;
        let yyyy = today.getFullYear();
        return mm + '/' + dd + '/' + yyyy;
    }
    function getResult(pSQL) {
        // log.debug("QUERY", pSQL);
        let queryResults = QUERY.runSuiteQL({
            query: pSQL
        });
        let records = queryResults.asMappedResults();
        return records;
    }
    function searchWagePeriod(pay_group) {

        let wageperiodsql = " select * from customrecord_hris_wage_period_details \
                           where custrecord_hris_pay_group = "+ pay_group + " and isinactive='F'"

        log.debug('wageperiodsql',wageperiodsql);
        let wageperiodsqlrecords = getResult(wageperiodsql);

        if (wageperiodsqlrecords.length > 0) {
            let rec = wageperiodsqlrecords[0];
            let WagePeriod_EndDate = rec.custrecord_hris_end_date;

            let start_date = rec.custrecord_hris_start_date;

            let month = rec.custrecord_hris_month;

            let year = rec.custrecord_hris_year;

        }//End of if(searchResult !=null)
        return WagePeriod_EndDate + "#" + start_date + "#" + month + "#" + year;
    }
    function getLeaveConfigSequence(Leave_type) {
        try {

            let leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + Leave_type + "' and isinactive ='F'"
            log.debug("leavesequencesql", leavesequencesql);
            let queryResult = query.runSuiteQL({
                query: leavesequencesql,
            });
            let leavesequencesqlrecords = queryResult.asMappedResults();


            log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
            if (leavesequencesqlrecords.length > 0) {


                let sequence_no = leavesequencesqlrecords[0].custrecord_hris_lvecnfg_seqno;
            }
            return sequence_no;
        }
        catch (e) {
            log.debug("error in get_sequence_no : " + e);

        }

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
    function searchPaygroup(employee_name) {
       /*  let filters = new Array();
        let columns = new Array();
    
        filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_name));
        filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
        columns.push(new nlobjSearchColumn('internalid'));
        columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))
    
        columns[0].setSort(true);
    
        let s_result = nlapiSearchRecord('customrecord_hris_employee_compen_change', null, filters, columns)
    
        if (s_result != null) {
            let s_paygroup = s_result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp')
        } //End of if (s_result != null) 
 */
        let employeecompensql = "Select * from customrecord_hris_employee_compen_change where custrecord_hris_empchange_employee_nam = " + employee_name + "  and isinactive ='F'";
                log.debug('employeecompensql', employeecompensql);
             //   console.log(employeecompensql);
                let employeecompensqlrecords = getResult(employeecompensql);
            
                if (employeecompensqlrecords.length > 0) {
                    let rec = employeecompensqlrecords[0];
                  
                   let s_paygroup = rec.custrecord_hris_empchange_emp_pay_pro_gp;
                }
                    
        return s_paygroup
    }
    function searchPayCompold(i_paygroup_earn)
{
	let PTID;
	let Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_paygroup_earn));
	Filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto',36));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	let column = new Array();
	column.push(new nlobjSearchColumn('internalid'));	
	let searchPTCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
	if(searchPTCheck !=null)
	{
		PTID = searchPTCheck[0].getValue('internalid');	
	}//End if(searchNetCheck !=null)
	return PTID;
}//searchPTId(i_paygroup_earn)
function searchPayComp(i_paygroup_earn)
{
	let PTID;
	let employeecompensql = "Select * from customrecord_hris_payroll_component \
             where custrecord_hris_pay_process_group = " + i_paygroup_earn + " \
             and custrecord_hris__sequence_no_=36  and isinactive ='F'";
                log.debug('employeecompensql', employeecompensql);
               // console.log(employeecompensql);
                let employeecompensqlrecords = getResult(employeecompensql);
            
                if (employeecompensqlrecords.length > 0) {
                    let rec = employeecompensqlrecords[0];
                  
                    PTID = rec.id;
                }

	return PTID;
}//searchPTId(i_paygroup_earn)
    
    function formatedDateold(end_date) {
    
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
        if (date_format == 'D/M/YYYY') {
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
    function formatedDate(end_date) {
        // Check the date format
        let date_format = checkDateFormat();  // Assuming checkDateFormat() is defined elsewhere
        let endDate = format.parse({ value: end_date, type: format.Type.DATE });

        let year = endDate.getFullYear();
        log.debug('Formatted year', year);
        let Anvr_month = endDate.getMonth() + 1;
        log.debug('Formatted Anvr_month', Anvr_month);
        let Anvr_DateVal = endDate.getDate();
        log.debug('Formatted Anvr_DateVal', Anvr_DateVal);

        let newDate;
        // Format based on the date_format variable
        if (date_format == 'YYYY-MM-DD') {
            newDate = year + '-' + (Anvr_month < 10 ? '0' + Anvr_month : Anvr_month) + '-' + (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal);
        }
        else if (date_format == 'DD/MM/YYYY') {
            newDate = (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal) + '/' + (Anvr_month < 10 ? '0' + Anvr_month : Anvr_month) + '/' + year;
        }
        else if (date_format == 'D/M/YYYY') {
            newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
        }
        else if (date_format == 'MM/DD/YYYY') {
            newDate = (Anvr_month < 10 ? '0' + Anvr_month : Anvr_month) + '/' + (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal) + '/' + year;
        }
        else if (date_format == 'M/D/YYYY') {
            newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
        }
        else if (date_format == 'DD-MM-YYYY') {
            newDate = (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal) + '-' + (Anvr_month < 10 ? '0' + Anvr_month : Anvr_month) + '-' + year;
        }
        else if (date_format == 'DD-Mon-YYYY') {
            newDate = (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal) + '-' + getMonthAbbr(Anvr_month) + '-' + year; // You'll need to implement getMonthAbbr()
        }
        else if (date_format == 'DD.MM.YYYY') {
            newDate = (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal) + '.' + (Anvr_month < 10 ? '0' + Anvr_month : Anvr_month) + '.' + year;
        }
        else if (date_format == 'DD-Month-YYYY') {
            newDate = (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal) + '-' + getMonthName(Anvr_month) + '-' + year; // Implement getMonthName()
        }
        else if (date_format == 'YYYY/MM/DD') {
            newDate = year + '/' + (Anvr_month < 10 ? '0' + Anvr_month : Anvr_month) + '/' + (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal);
        }
        else if (date_format == 'DD MONTH, YYYY') {
            newDate = (Anvr_DateVal < 10 ? '0' + Anvr_DateVal : Anvr_DateVal) + ' ' + getMonthName(Anvr_month) + ',' + year;
        }

        log.debug('Formatted newDate', newDate);
        return newDate;
    }

  
    
    function searchYearold(year) {
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
    
    function searchYear(year) {
        let yearVal = '';
        year = year.toString();
        log.debug('Year in searchYear function', year);

        // Create the search filters
        let filters = [
            ['name', 'contains', year],
            'AND',
            ['isinactive', 'is', 'F']
        ];

        // Create the search columns
        let columns = [
            search.createColumn({ name: 'internalid' })
        ];

        // Perform the search
        let searchResult = search.create({
            type: 'customlist_hris_year_master',
            filters: filters,
            columns: columns
        }).run().getRange({ start: 0, end: 1 });

        // Check if there are results
        if (searchResult.length > 0) {
            yearVal = searchResult[0].getValue('internalid');
        }

        log.debug('yearVal in SearchYear Func', yearVal);
        return yearVal;
    }
    
    function _Is_Valid(value) //
    {
        if (value != null && value != '' && value != 'undefined') // 
        {
            return true;
        }
        return false;
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
        if (date_format == 'D/M/YYYY') {
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
    
    
    
    function checkDateFormatold() {
        let context = nlapiGetContext();
    
        let dateFormatPref = context.getPreference('dateformat');
    
        return dateFormatPref;
    }
    function checkDateFormat() {
        let context = runtime.getCurrentContext();
        let dateFormatPref = context.getPreference({ name: 'dateformat' });

        return dateFormatPref;
    }
    return {
        afterSubmit: afterSubmit,
        beforeSubmit: beforeSubmit,
        beforeLoad: beforeLoad
    };
});
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_leavebalanceapply_ue = (() => {
function beforeSubmitRecord_check_balance_value(type)
{
   
   if (type == 'create')
    {
		
	let error = 'Leaves exceeds than leave balance available' ;
		
	let leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')
	nlapiLogExecution('DEBUG', 'leave_type', 'leave_type =' + leave_type);
	
	let tot_no_days = nlapiGetFieldValue('custrecord_hris_lve_totalnodays')
	nlapiLogExecution('DEBUG', 'tot_no_days', 'tot_no_days =' + tot_no_days);
	
	let balance = nlapiGetFieldValue('custrecord_hris_lve_leavebalance')
	nlapiLogExecution('DEBUG', 'balance', 'balance =' + balance);
	
	let employee = nlapiGetFieldValue('custrecord_hris_lve_employeename')
	nlapiLogExecution('DEBUG', 'employee', 'employee =' + employee);
	
	 let filters = new Array();
	 let columns = new Array();
	 leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')
// Add by florence For Unpaid Leave annual
	 let seq_no_search = get_sequence_no(leave_type)
	 let seq_no_split = seq_no_search.split('#')
	 let seq_no = seq_no_split[0];
	 let negAllowChk = seq_no_split[1];
	 let maxNegAllow = seq_no_split[2];

	 if (seq_no != 3 && seq_no != 2 && seq_no != 8 && seq_no != 13) {
    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
  
    columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('custrecord_hris_lvbal_total_applied_days'));
	columns.push(new nlobjSearchColumn('custrecord_hris_lvbal_available_leave_ba'));
	
	
	 let leaveBalanceresults = nlapiSearchRecord('customrecord_hris_leavebalance', null, filters, columns);
	 nlapiLogExecution('DEBUG', 'leaveBalanceresults', 'leaveBalanceresults$$$$$$$$$$$$$ =' + leaveBalanceresults);
	 
	 if (leaveBalanceresults != null)
	 {
        let internal_id = leaveBalanceresults[0].getValue('internalid')
		nlapiLogExecution('DEBUG', 'internal_id', 'internal_id =' + internal_id);
		
		let applied_bal = leaveBalanceresults[0].getValue('custrecord_hris_lvbal_total_applied_days')||0;
		nlapiLogExecution('DEBUG', 'applied_bal', 'applied_bal =' + applied_bal);
		
		let LeaveBALANCE = leaveBalanceresults[0].getValue('custrecord_hris_lvbal_available_leave_ba')
		nlapiLogExecution('DEBUG', 'LeaveBALANCE', 'LeaveBALANCE =' + LeaveBALANCE);
		
		let final_APPLIEDdays = parseFloat(applied_bal) + parseFloat(tot_no_days)
		nlapiLogExecution('DEBUG', 'final_APPLIEDdays', 'final_APPLIEDdays =' + final_APPLIEDdays);
		
		
		if(parseFloat(final_APPLIEDdays) > parseFloat(LeaveBALANCE))
		{
						
						throw error ;
						return false ;
		}
	 }

	 }	 
  }
   
   
    
if (type == 'delete') 
	{
		
		let rec_id = nlapiGetRecordId();
		nlapiLogExecution('Debug', 'rec_id :', ' rec_id' + rec_id);
		
		if (_logValidation(rec_id))
		 {
		
		    nlapiLogExecution('Debug', 'leave_record :', ' in......................');
			
			
			let old_record = nlapiGetOldRecord();
			nlapiLogExecution('Debug', 'old_record :', ' old_record' + old_record);
			
			
	
			let leave_type = old_record.getFieldValue('custrecord_hris_lve_leavetype')
			nlapiLogExecution('Debug', 'leave_type :', ' leave_type' + leave_type);
			
			let employee = old_record.getFieldValue('custrecord_hris_lve_employeename')
			nlapiLogExecution('DEBUG', 'employee', 'employee =' + employee);
			
			let leave_status = old_record.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus')
			nlapiLogExecution('Debug', 'leave_status :', ' leave_status' + leave_status);
			
			let tot_no_days = old_record.getFieldValue('custrecord_hris_lve_totalnodays')||0;
			nlapiLogExecution('DEBUG', 'tot_no_days', 'tot_no_days =' + tot_no_days);
			
			leave_status = old_record.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus')
			nlapiLogExecution('Debug', 'leave_status :', ' leave_status' + leave_status); 
			
			if (leave_status != 3) 
			{
				
				let filters = new Array();
	            let columns = new Array();
	 
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
				filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
			  
			    columns.push(new nlobjSearchColumn('internalid'));
				
				 let leaveBalanceresults = nlapiSearchRecord('customrecord_hris_leavebalance', null, filters, columns);
				 let total_applied =0;
				 nlapiLogExecution('DEBUG', 'total_applied', 'total_applied =' + total_applied);
				 if (leaveBalanceresults != null)
				 {
			        let internal_id = leaveBalanceresults[0].getValue('internalid')
					
					let load_balance_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id)
					
					total_applied = load_balance_record.getFieldValue('custrecord_hris_lvbal_total_applied_days')||0;
					nlapiLogExecution('DEBUG', 'total_applied', 'total_applied =' + total_applied);
					
					let final_days = parseFloat(total_applied) - parseFloat(tot_no_days)
					nlapiLogExecution('DEBUG', 'final_days', 'final_days =' + final_days);
					
					load_balance_record.setFieldValue('custrecord_hris_lvbal_total_applied_days',final_days)
					
					let balrecid =nlapiSubmitRecord(load_balance_record);
					nlapiLogExecution('DEBUG', 'balrecid', 'balrecid =' + balrecid);

				 }
			}
		}
	}

	nlapiLogExecution('DEBUG', 'check1');
   return true;

}

function afterSubmitRecord_balance_check(type)
{
   
  if (type == 'create')
   {
   	
	nlapiLogExecution('DEBUG', 'into_AfterDUBMIT', 'into_AfterDUBMIT');
	
	let leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')
	nlapiLogExecution('DEBUG', 'leave_type', 'leave_type =' + leave_type);
	
	let tot_no_days = nlapiGetFieldValue('custrecord_hris_lve_totalnodays')
	nlapiLogExecution('DEBUG', 'tot_no_days', 'tot_no_days =' + tot_no_days);
	
	let balance = nlapiGetFieldValue('custrecord_hris_lve_leavebalance')
	nlapiLogExecution('DEBUG', 'balance', 'balance =' + balance);
	
	let employee = nlapiGetFieldValue('custrecord_hris_lve_employeename')
	nlapiLogExecution('DEBUG', 'employee', 'employee =' + employee);
	
	 let filters = new Array();
	 let columns = new Array();
	 
    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
  
    columns.push(new nlobjSearchColumn('internalid'));
	
	 let leaveBalanceresults = nlapiSearchRecord('customrecord_hris_leavebalance', null, filters, columns);
	 nlapiLogExecution('DEBUG', 'leaveBalanceresults', 'leaveBalanceresults =' + leaveBalanceresults);
	 
	 if (leaveBalanceresults != null)
	 {
        let internal_id = leaveBalanceresults[0].getValue('internalid')
		nlapiLogExecution('DEBUG', 'internal_id', 'internal_id =' + internal_id);
		
		let load_balance_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id)
		
		let applied_bal = 0 ;
		
		 applied_bal = load_balance_record.getFieldValue('custrecord_hris_lvbal_total_applied_days')||0;
		nlapiLogExecution('DEBUG', 'applied_bal', 'applied_bal =' + applied_bal);
		
		nlapiLogExecution('DEBUG', 'tot_no_days', 'tot_no_days =' + tot_no_days);
		
		applied_bal = parseFloat(applied_bal) + parseFloat(tot_no_days) 
		
		
		load_balance_record.setFieldValue('custrecord_hris_lvbal_total_applied_days', applied_bal);
		
		nlapiSubmitRecord(load_balance_record);
	 }
	
 }
		nlapiLogExecution('Debug', 'type :', ' type' + type); 
	// florence  for pullback error	
 //  if (type != 'create' || type != 'delete')
   if (type != 'create' && type != 'delete')
	 {
	 	
		let flag = 0 ;
	 	
		nlapiLogExecution('Debug', '##################:', ' ******************');
		
		let rec_id = nlapiGetRecordId();
		nlapiLogExecution('Debug', 'rec_id :', ' rec_id' + rec_id);
		
		if (_logValidation(rec_id)) 
		{
			
			let leave_record = nlapiLoadRecord('customrecord_hris_leaveapplication', rec_id);
		    nlapiLogExecution('Debug', 'leave_record :', ' leave_record' + leave_record); 
			
			
			let leave_type = leave_record.getFieldValue('custrecord_hris_lve_leavetype')
			nlapiLogExecution('Debug', 'leave_type :', ' leave_type' + leave_type); 
			
			let employee = leave_record.getFieldValue('custrecord_hris_lve_employeename')
	        nlapiLogExecution('DEBUG', 'employee', 'employee =' + employee);
			
			let leave_status = leave_record.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus')
			nlapiLogExecution('Debug', 'leave_status :', ' leave_status' + leave_status); 
			
			let leaveCANCEL_status = leave_record.getFieldValue('custrecord_hris_lve_cancel_leavestatus')
			nlapiLogExecution('Debug', 'leaveCANCEL_status :', ' leaveCANCEL_status' + leaveCANCEL_status);
			
			let cancelCHECk = leave_record.getFieldValue('custrecord_hris_lve_cancellation')
			nlapiLogExecution('Debug', 'cancelCHECk :', ' cancelCHECk' + cancelCHECk); 
			
			let tot_no_days = leave_record.getFieldValue('custrecord_hris_lve_totalnodays')||0;
	        nlapiLogExecution('DEBUG', 'tot_no_days', 'tot_no_days =' + tot_no_days);
			
			if(leave_status == 2 )
			{
				
				if(cancelCHECk == 'F')
				{
					let filters = new Array();
	            let columns = new Array();
	 
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
				filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
			  
			    columns.push(new nlobjSearchColumn('internalid'));
				
				 let leaveBalanceresults = nlapiSearchRecord('customrecord_hris_leavebalance', null, filters, columns);
				let total_applied=0;
				 if (leaveBalanceresults != null)
				 {
			        let internal_id = leaveBalanceresults[0].getValue('internalid')
					
					let load_balance_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id)
					
					 total_applied = load_balance_record.getFieldValue('custrecord_hris_lvbal_total_applied_days')||0;
					nlapiLogExecution('DEBUG', 'total_applied', 'total_applied =' + total_applied);
					
					let final_days = parseFloat(total_applied) - parseFloat(tot_no_days)
					nlapiLogExecution('DEBUG', 'final_days', 'final_days =' + final_days);
					
					load_balance_record.setFieldValue('custrecord_hris_lvbal_total_applied_days',final_days)
					
					nlapiSubmitRecord(load_balance_record);
				 }
							
				
				
					
				}
				
				
				
			}
			if(leave_status == 3)
			{
				if(flag == 0)
				{
					
					nlapiLogExecution('DEBUG', '**************into reject*************', '******************into reject****************');
				
				let filters = new Array();
	            let columns = new Array();
	 
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
				filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
			  
			    columns.push(new nlobjSearchColumn('internalid'));
				
				 let leaveBalanceresults = nlapiSearchRecord('customrecord_hris_leavebalance', null, filters, columns);
				
				 if (leaveBalanceresults != null)
				 {
			        let internal_id = leaveBalanceresults[0].getValue('internalid')
					
					let load_balance_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id)
					
					let total_applied = load_balance_record.getFieldValue('custrecord_hris_lvbal_total_applied_days')||0;
					nlapiLogExecution('DEBUG', 'total_applied', 'total_applied =' + total_applied);
					
					let final_days = parseFloat(total_applied) - parseFloat(tot_no_days)
					nlapiLogExecution('DEBUG', 'final_days', 'final_days =' + final_days);
					
					load_balance_record.setFieldValue('custrecord_hris_lvbal_total_applied_days',final_days)
					
					nlapiSubmitRecord(load_balance_record);
				 }
							
					
				}
				
				
				flag = flag + 1;
				
				
			}
			
			
		}
		
		
		
		
	}
	

  

   
   
   
	return true;

}










function _logValidation(value) 
{
 if(value!='null' && value != null && value != null && value != '' && value != undefined && value != undefined && value != 'undefined' && value != 'undefined'&& value != 'NaN' && value != NaN) 
 {
  return true;
 }
 else 
 { 
  return false;
 }
}
function get_sequence_no(leave_type) {

    let filters = new Array();
    let columns = new Array();

    filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
    //filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type))

    columns.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_seqno'));
    columns.push(new nlobjSearchColumn('custrecord_hris_lveconfig_allowneglevbal'));
    columns.push(new nlobjSearchColumn('custrecord_hris_lvecfg_maxnegativebal'));

    let compoff_record_result = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, columns);

    if (compoff_record_result != null) {

        let sequence_no = compoff_record_result[0].getValue('custrecord_hris_lvecnfg_seqno')
        let negAllowChk = compoff_record_result[0].getValue('custrecord_hris_lveconfig_allowneglevbal')
        let maxNegAllow = compoff_record_result[0].getValue('custrecord_hris_lvecfg_maxnegativebal')


    }
    return sequence_no + "#" + negAllowChk + "#" + maxNegAllow;
}
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_leavebalancedebitchange_ue = (() => {
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
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_leavebalanceupdation_ue = (() => {
define(['N/search', 'N/query', 'N/format', 'N/record', 'N/currentRecord', 'N/url', './moment.js', 'N/runtime'],
    function (search, query, format, record, currentRecord, url, moment, runtime) {


        function beforeSubmit(scriptContext) {
            // Leave Balance Apply
            if (scriptContext.type == scriptContext.UserEventType.CREATE) {
                let error = 'Leaves exceed the leave balance available';
                let newRecord = scriptContext.newRecord;
                let leaveType = newRecord.getValue('custrecord_hris_lve_leavetype');
                let totalDays = parseFloat(newRecord.getValue('custrecord_hris_lve_totalnodays')) || 0;
                let employee = newRecord.getValue('custrecord_hris_lve_employeename');

                log.debug('leaveType', leaveType);
                log.debug('totalDays', totalDays);
                log.debug('employee', employee);

                let seqNoData = getsequenceno(leaveType,search);
                let seqNoSplit = seqNoData.split('#');
                let seqNo = seqNoSplit[0];

                //if (![3, 2, 8, 13].includes(parseInt(seqNo))) {
                if(seqNo !=3 && seqNo !=2 && seqNo !=8 && seqNo !=13){    
                    let leaveBalanceResults = searchLeaveBalance(leaveType, employee,search);
                    if (leaveBalanceResults.length > 0) {
                        let leaveBalance = parseFloat(leaveBalanceResults[0].getValue('custrecord_hris_lvbal_available_leave_ba')) || 0;
                        let appliedBal = parseFloat(leaveBalanceResults[0].getValue('custrecord_hris_lvbal_total_applied_days')) || 0;
                        let finalAppliedDays = appliedBal + totalDays;

                        log.debug('leaveBalance', leaveBalance);
                        log.debug('finalAppliedDays', finalAppliedDays);

                        if (finalAppliedDays > leaveBalance) {
                            throw new Error(error);
                        }
                    }
                }
           

            // Leave Application Record 
            newRecord = scriptContext.newRecord;
            let emp_name = newRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
            let errornew = 'This record is already Present for the applied date';

            let frm_dt_VL = newRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' });
         //  let frm_date_val = format.parse({ value: frm_dt_VL, type: format.Type.DATE });
           let frm_date_val = moment(frm_dt_VL).format('DD/MM/YYYY');
           log.audit('frm_date_val',frm_date_val)
          //  let frm_date_val= frm_dt_VL;
            
            let to_DTVL = newRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' });
           // let to_date_val = format.parse({ value: to_DTVL, type: format.Type.DATE });
           let to_date_val = moment(to_DTVL).format('DD/MM/YYYY');
           log.audit('to_date_val',to_date_val);
          // let to_date_val = to_DTVL;
            
            if (frm_date_val && to_date_val) {
                let searchdate = search.create({
                    type: 'customrecord_hris_leaveapplication',
                    filters: [
                        ['custrecord_hris_lve_employeename', 'is', emp_name],
                        'AND',
                        ['custrecord_hris_lve_hrmsapprovalstatus', 'noneof', 3],
                        'AND',
                        ['custrecord_hris_lve_cancel_leavestatus', 'noneof', 2],
                        'AND',
                        /* [
                            [
                                ['custrecord_hris_lve_fromdate', 'within', frm_date_val, to_date_val],
                                'OR',
                                ['custrecord_hris_lve_todate', 'within', frm_date_val, to_date_val],
                                'OR',
                                [
                                    ['custrecord_hris_lve_fromdate', 'onorafter', frm_date_val],
                                    'AND',
                                    ['custrecord_hris_lve_todate', 'onorbefore', to_date_val]
                                ]
                            ]
                        ] */

                        [[["custrecord_hris_lve_fromdate","within",frm_date_val,to_date_val]],
                        "OR",[["custrecord_hris_lve_todate","within",frm_date_val,to_date_val]],
                        "OR",[["custrecord_hris_lve_fromdate","onorafter",frm_date_val],
                        "AND",["custrecord_hris_lve_todate","onorbefore",to_date_val]]]

                    ],
                    columns: [
                        'custrecord_hris_lve_fromdate',
                        'custrecord_hris_lve_todate',
                        'custrecord_hris_lve_leavetype'
                    ]
                }).run().getRange({ start: 0, end: 1000 });
                log.audit('Searchdate',searchdate.length);

                if (searchdate.length > 0) {
                    for (let i = 0; i < searchdate.length; i++) {
                        /* let present_frm_dt = format.parse({ value: searchdate[i].getValue('custrecord_hris_lve_fromdate'), type: format.Type.DATE });
                        let present_to_dt = format.parse({ value: searchdate[i].getValue('custrecord_hris_lve_todate'), type: format.Type.DATE });

                        let E_leavetype = newRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
                        let leave_type = search.lookupFields({ type: 'customrecord_hris_leaveconfig', id: E_leavetype, columns: ['externalid'] }).externalid;

                        if (leave_type !== '6' && (
                            (frm_date_val <= present_frm_dt && to_date_val >= present_frm_dt) ||
                            (frm_date_val >= present_frm_dt && frm_date_val <= present_to_dt)
                        )) { */
                            throw new Error(errornew);
                        //}
                    }
                }
            }
       
        }
            // Emergency Leave Deduction in Annual
            if (scriptContext.type !== scriptContext.UserEventType.CREATE && scriptContext.type !== scriptContext.UserEventType.DELETE) {
                let flag = 0;

                log.debug('##################:', '******************');

                let rec_id = scriptContext.newRecord.id;
                log.debug('rec_id :', ' rec_id' + rec_id);

                if (_logValidation(rec_id)) {

                    let leave_record = record.load({
                        type: 'customrecord_hris_leaveapplication',
                        id: rec_id
                    });
                    log.debug('leave_record :', 'leave_record' + leave_record);

                    let leave_type = leave_record.getValue('custrecord_hris_lve_leavetype');
                    log.debug('leave_type :', 'leave_type' + leave_type);
                    let seq_no = get_sequence_no(leave_type, query);

                    let hireDate = leave_record.getValue('custrecord_hris_lve_hiredate');
                    let employee = leave_record.getValue('custrecord_hris_lve_employeename');
                    log.debug('employee', 'employee =' + employee);

                    let leave_status = leave_record.getValue('custrecord_hris_lve_hrmsapprovalstatus');
                    log.debug('leave_status :', 'leave_status' + leave_status);

                    let leaveCANCEL_status = leave_record.getValue('custrecord_hris_lve_cancel_leavestatus');
                    log.debug('leaveCANCEL_status :', 'leaveCANCEL_status' + leaveCANCEL_status);

                    let cancelCHECk = leave_record.getValue('custrecord_hris_lve_cancellation');
                    log.debug('cancelCHECk :', 'cancelCHECk' + cancelCHECk);

                    let tot_no_days = leave_record.getValue('custrecord_hris_lve_totalnodays') || 0;
                    log.debug('tot_no_days', 'tot_no_days =' + tot_no_days);

                    let curDate = new Date();
                    let annualcheck = 0;
                    let annualseqno = 3;
                    //  let annualleavetype =1;
                    let annualleavetype = get_annualleave_type(annualseqno, query);
                    if (seq_no == 2 && employee && hireDate) {
                        log.debug("Inside")
                        //    let empQuery = "select * from employee  where id = " + employee + " and isinactive ='F'";
                        let empQuery = "select b.id as empcatagoryid ,b.custrecord_hris_empcat_seqno as seqno from employee  a join\
                      customrecord_hris_employeecategory b on  a.custentity_hris_empcategory = b.id where a.id =" + employee + " and b.isinactive='F'"

                        let queryResults = query.runSuiteQL({
                            query: empQuery,
                        });
                        let empQueryrecords = queryResults.asMappedResults();
                        // let visatextField = recordObj.getField("custpage_visaprocessingtext");

                        if (empQueryrecords.length > 0) {
                            let rec = empQueryrecords[0];
                            // let empcatagory = rec.custentity_hris_empcategory;
                            let empcatagory = rec.seqno;
                        }
                        log.audit("empcatagory", empcatagory)
                        if (empcatagory == 1 || empcatagory == 3) {

                            let compareDate = moment(hireDate).add(670, 'days');
                            compareDate = format.parse({
                                value: compareDate,
                                type: format.Type.DATE
                            });


                            if (compareDate >= curDate) {
                                annualcheck = 1;
                                // return false;
                            }
                            // Annual Leave Rejoin date Checking
                            let leaveQuery = "select * from customrecord_hris_leaveapplication  where custrecord_hris_lve_leavetype in(" + annualleavetype + ")\
                         and custrecord_hris_lve_workresume ='T' and  isinactive ='F'and custrecord_hris_lve_employeename ="+ employee;

                            let queryResults = query.runSuiteQL({
                                query: leaveQuery,
                            });
                            log.debug("Labour Leavequery", leaveQuery);
                            let leaveQueryrecords = queryResults.asMappedResults();
                            // let visatextField = recordObj.getField("custpage_visaprocessingtext");

                            if (leaveQueryrecords.length > 0) {
                                let rec = leaveQueryrecords[0];
                                let rejoindate = rec.custrecord_hris_lve_actualresumedate;
                                rejoindate = format.parse({
                                    value: rejoindate,
                                    type: format.Type.DATE
                                });
                                let compareDate = moment(rejoindate).add(670, 'days');
                                compareDate = format.parse({
                                    value: compareDate,
                                    type: format.Type.DATE
                                });


                                if (compareDate >= curDate) {

                                    log.debug("Not completion of 22 months of rejoining date of the previous annual leave.");
                                    annualcheck = 1;
                                    // return false;

                                }
                            }



                        }
                        else if (empcatagory == 2) {

                            log.debug('Inside Office staff');
                            let compareDate = moment(hireDate).add(365, 'days');
                            compareDate = format.parse({
                                value: compareDate,
                                type: format.Type.DATE
                            });

                            log.debug("Staff Comparedate 1", compareDate);
                            if (compareDate >= curDate) {
                                log.debug('Not completion of 12 months of service')
                                annualcheck = 1;
                                //  return false;
                            }
                            // Annual Leave Rejoin date Checking
                            let leaveQuery = "select * from customrecord_hris_leaveapplication  where custrecord_hris_lve_leavetype in(" + annualleavetype + ")\
                         and custrecord_hris_lve_workresume ='T' and  isinactive ='F'and custrecord_hris_lve_employeename ="+ employee;
                            log.debug("Staff Leavequery", leaveQuery);
                            let queryResults = query.runSuiteQL({
                                query: leaveQuery,
                            });

                            let leaveQueryrecords = queryResults.asMappedResults();
                            // let visatextField = recordObj.getField("custpage_visaprocessingtext");

                            if (leaveQueryrecords.length > 0) {
                                let rec = leaveQueryrecords[0];
                                let rejoindate = rec.custrecord_hris_lve_actualresumedate;
                                rejoindate = format.parse({
                                    value: rejoindate,
                                    type: format.Type.DATE
                                });
                                let compareDate = moment(rejoindate).add(365, 'days');
                                compareDate = format.parse({
                                    value: compareDate,
                                    type: format.Type.DATE
                                });


                                if (compareDate >= curDate) {

                                    log.debug('Not completion of 22 months of service')
                                    annualcheck = 1;
                                    //return false;

                                }
                            }


                        }
                        let total_applied = 0;
                        let leavebalancetaken = 0;
                        log.audit('annualcheck', annualcheck)
                        if (leave_status == 2 && annualcheck == 1) {
                            //let annualleavetype =2;
                            if (cancelCHECk == false) {

                                let leavebalQuery = "select * from customrecord_hris_leavebalance  where custrecord_hris_lvbal_leave_type in(" + annualleavetype + ")\
                                and isinactive ='F'and custrecord_hris_lvbal_employee_name ="+ employee;

                                let queryResults = query.runSuiteQL({
                                    query: leavebalQuery,
                                });
                                let leavebalQueryrecords = queryResults.asMappedResults();
                                // let visatextField = recordObj.getField("custpage_visaprocessingtext");

                                if (leavebalQueryrecords.length > 0) {
                                    let rec = leavebalQueryrecords[0];
                                    let leavebalid = rec.id;
                                    total_applied = rec.custrecord_hris_lvbal_total_applied_days || 0;
                                    leavebalancetaken = rec.custrecord_hris_lvbal_leave_balance_take || 0;


                                    log.debug('total_applied', 'total_applied =' + total_applied);

                                    let final_days = parseFloat(total_applied) + parseFloat(tot_no_days);
                                    let final_leavetaken = parseFloat(leavebalancetaken) + parseFloat(tot_no_days)
                                    log.debug('final_days', 'final_days =' + final_days);


                                    let updatedleavebalid = record.submitFields({
                                        type: 'customrecord_hris_leavebalance',
                                        id: leavebalid,
                                        values: {
                                            'custrecord_hris_lvbal_total_applied_days': final_days,
                                            'custrecord_hris_lvbal_leave_balance_take': final_leavetaken
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });
                                    log.debug(" updatedleavebalid", updatedleavebalid)


                                }
                                // }
                            }
                            else if (cancelCHECk == true && leaveCANCEL_status == 2) {

                                let leavebalQuery = "select * from customrecord_hris_leavebalance  where custrecord_hris_lvbal_leave_type in(" + annualleavetype + ")\
                            and isinactive ='F'and custrecord_hris_lvbal_employee_name ="+ employee;

                                let queryResults = query.runSuiteQL({
                                    query: leavebalQuery,
                                });
                                let leavebalQueryrecords = queryResults.asMappedResults();
                                // let visatextField = recordObj.getField("custpage_visaprocessingtext");

                                if (leavebalQueryrecords.length > 0) {
                                    let rec = leavebalQueryrecords[0];

                                    total_applied = rec.custrecord_hris_lvbal_total_applied_days || 0;
                                    leavebalancetaken = rec.custrecord_hris_lvbal_leave_balance_take || 0;
                                    let leavebalid = rec.id;

                                    log.debug('total_applied', 'total_applied =' + total_applied);

                                    let final_days = parseFloat(total_applied) - parseFloat(tot_no_days);
                                    log.debug('final_days', 'final_days =' + final_days);
                                    let final_leavetaken = parseFloat(leavebalancetaken) - parseFloat(tot_no_days)

                                    let updatedleavebalid = record.submitFields({
                                        type: 'customrecord_hris_leavebalance',
                                        id: leavebalid,
                                        values: {
                                            'custrecord_hris_lvbal_total_applied_days': final_days,
                                            'custrecord_hris_lvbal_leave_balance_take': final_leavetaken
                                        },
                                        options: {
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true
                                        }
                                    });
                                    log.debug(" updatedleavebalid", updatedleavebalid)


                                }

                            }
                        }

                        if (leave_status == 3 && annualcheck == 1) {

                            let leavebalQuery = "select * from customrecord_hris_leavebalance  where custrecord_hris_lvbal_leave_type in(" + annualleavetype + ")\
                        and isinactive ='F'and custrecord_hris_lvbal_employee_name ="+ employee;

                            let queryResults = query.runSuiteQL({
                                query: leavebalQuery,
                            });
                            let leavebalQueryrecords = queryResults.asMappedResults();
                            // let visatextField = recordObj.getField("custpage_visaprocessingtext");

                            if (leavebalQueryrecords.length > 0) {
                                let rec = leavebalQueryrecords[0];

                                total_applied = rec.custrecord_hris_lvbal_total_applied_days || 0;
                                leavebalancetaken = rec.custrecord_hris_lvbal_leave_balance_take || 0;
                                let leavebalid = rec.id;

                                log.debug('total_applied', 'total_applied =' + total_applied);

                                let final_days = parseFloat(total_applied) - parseFloat(tot_no_days);
                                log.debug('final_days', 'final_days =' + final_days);
                                let final_leavetaken = parseFloat(leavebalancetaken) - parseFloat(tot_no_days)

                                let updatedleavebalid = record.submitFields({
                                    type: 'customrecord_hris_leavebalance',
                                    id: leavebalid,
                                    values: {
                                        'custrecord_hris_lvbal_total_applied_days': final_days,
                                        'custrecord_hris_lvbal_leave_balance_take': final_leavetaken
                                    },
                                    options: {
                                        enableSourcing: false,
                                        ignoreMandatoryFields: true
                                    }
                                });
                                log.debug(" updatedleavebalid", updatedleavebalid)


                            }

                        }
                    }
                }
            }
        }

        function _logValidation(value) {
            return (value !== null && value !== undefined && value !== '');
        }
        function afterSubmit(scriptContext) {
            if (scriptContext.type !== scriptContext.UserEventType.DELETE) {
                let newRecord = scriptContext.newRecord;
                let RECid = newRecord.id;
                let LoadRec = record.load({ type: 'customrecord_hris_leaveapplication', id: RECid });
                let Leave_type = LoadRec.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
                let Employee = LoadRec.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
    
                let sequence_value = get_sequence_no(Leave_type,query);
                if (sequence_value === '5') {
                    let status = LoadRec.getValue({ fieldId: 'custrecord_hris_lve_hrmsapprovalstatus' });
                    let cancel_status = LoadRec.getValue({ fieldId: 'custrecord_hris_lve_cancel_leavestatus' });
                    let valid_till_date = LoadRec.getValue({ fieldId: 'custrecord_hris_lve_validtilldate' });
    
                    let filters = [
                        ['custrecord_hris_rcomp_valid_till_date', 'on', valid_till_date],
                        'AND',
                        ['custrecord_hris_rcomp_employee_name', 'is', Employee]
                    ];
    
                    let compoff_record_result = search.create({
                        type: 'customrecord_hris_lve_raise_comp_off',
                        filters: filters,
                        columns: ['internalid']
                    }).run().getRange({ start: 0, end: 1 });
    
                    if (compoff_record_result.length > 0) {
                        let id = compoff_record_result[0].getValue({ name: 'internalid' });
                        record.submitFields({
                            type: 'customrecord_hris_lve_raise_comp_off',
                            id: id,
                            values: { 'custrecord_hris_rcomp_checked': status === '3' || cancel_status === '2' ? 'F' : 'T' }
                        });
                    }
                }
            }
        }
    
        
    
        return {
            beforeSubmit: beforeSubmit,
            afterSubmit:afterSubmit
        };
    });
function get_sequence_no(leave_type, query) {

    let leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + leave_type + "' and isinactive ='F'"
    log.debug("leavesequencesql", leavesequencesql);
    let queryResult = query.runSuiteQL({
        query: leavesequencesql,
    });
    let leavesequencesqlrecords = queryResult.asMappedResults();


    log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
    if (leavesequencesqlrecords.length > 0) {


        let sequence_no = leavesequencesqlrecords[0].custrecord_hris_lvecnfg_seqno;
    }
    return sequence_no;
}
function get_annualleave_type(sequence_no, query) {
let annualleavetypearray=[];
    let leavesequencesql = "select * from customrecord_hris_leaveconfig where custrecord_hris_lvecnfg_seqno = " + sequence_no + " and isinactive ='F'"
    log.debug("leavesequencesql", leavesequencesql);
    let queryResult = query.runSuiteQL({
        query: leavesequencesql,
    });
    let leavesequencesqlrecords = queryResult.asMappedResults();


    log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
    if (leavesequencesqlrecords.length > 0) {
        for(let i=0;i<leavesequencesqlrecords.length;i++){
            let annualleavetype = leavesequencesqlrecords[0].id;
            annualleavetypearray.push(annualleavetype);
        }


       
    }
    return annualleavetypearray;
}
function searchLeaveBalance(leaveType, employee,search) {
    let leaveBalanceResults = search.create({
        type: 'customrecord_hris_leavebalance',
        filters: [
            ['custrecord_hris_lvbal_leave_type', 'is', leaveType],
            'AND',
            ['custrecord_hris_lvbal_employee_name', 'is', employee],
            'AND',
            ['isinactive', 'is', 'F']
        ],
        columns: [
            'internalid',
            'custrecord_hris_lvbal_total_applied_days',
            'custrecord_hris_lvbal_available_leave_ba'
        ]
    }).run().getRange({ start: 0, end: 1 });

    return leaveBalanceResults;
}

function getsequenceno(leaveType,search) {
    let results = search.create({
        type: 'customrecord_hris_leaveconfig',
        filters: [['internalid', 'is', leaveType]],
        columns: [
            'custrecord_hris_lvecnfg_seqno',
            'custrecord_hris_lveconfig_allowneglevbal',
            'custrecord_hris_lvecfg_maxnegativebal'
        ]
    }).run().getRange({ start: 0, end: 1 });

    if (results.length > 0) {
        return results[0].getValue('custrecord_hris_lvecnfg_seqno') + "#" +
            results[0].getValue('custrecord_hris_lveconfig_allowneglevbal') + "#" +
            results[0].getValue('custrecord_hris_lvecfg_maxnegativebal');
    }
    return "0#F#0";
}
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_lve_encashmentcreatemsi_ue = (() => {
function afterSubmitRecord_encasment_msi_creatio(type)
{
    
		
	 try
	  {
		   	// Get current user 
					  let i_Current_User = nlapiGetUser();
					  //nlapiLogExecution('DEBUG', 'Before submit record', 'i_Current_User : '+i_Current_User);
					  
					  //Get record type
					  let i_recType = nlapiGetRecordType();
					  nlapiLogExecution('DEBUG', 'after submit record', 'i_recType : '+i_recType);
					  
					  //Get record ID
					  let i_recID  = nlapiGetRecordId();
					  nlapiLogExecution('DEBUG', 'after submit record', 'i_recID : '+i_recID);
					  
					  // Load record for getting value
					  let o_recordObj = nlapiLoadRecord(i_recType, i_recID);
					  
					  let leave_type =   o_recordObj.getFieldValue('custrecord_hris_lve_leavetype');
					  
					  let leave_status = o_recordObj.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
					   
					  let cancel_check = o_recordObj.getFieldValue('custrecord_hris_lve_cancellation');
					  
					  let i_empID = 	 o_recordObj.getFieldValue('custrecord_hris_lve_employeename');
					  
					  let seq_no = get_sequence_no(leave_type);
					  
					  let appliy_encashment =   o_recordObj.getFieldValue('custrecord_hris_lve_applylveencashment');
					  
					  leave_status =   o_recordObj.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
							
					  let omani_nonOmani = o_recordObj.getFieldValue('custrecord_hris_lve_nation_omani_non');
					 
					if(appliy_encashment == 'T' && leave_status == '2' && cancel_check == 'F') //Cancel check added as after final approval of cancellation MSI was getting created-------Sumant Kumar----19/03/2021
					 {
					  
						 
						  
						  let leave_from_date =  o_recordObj.getFieldValue('custrecord_hris_lve_fromdate');
						  
						  leave_from_date = nlapiStringToDate(leave_from_date);
						  
						  let leave_get_month = leave_from_date.getMonth() + 1;
						  let leave_year = leave_from_date.getFullYear();
						  
						  let leave_YearId = searchYear(leave_year);
						  
						  let to_Date = o_recordObj.getFieldValue('custrecord_hris_lve_todate');
						  
						  let leave_type = o_recordObj.getFieldValue('custrecord_hris_lve_leavetype');
						  
						  let no_of_encash_days = o_recordObj.getFieldValue('custrecord_hris_lve_noofencashmentdays');
						  
						  
						  let payGroup = search_paygroup(i_empID);
						  
						  let encash_internal_id = getEncashCompId(payGroup);
						  nlapiLogExecution('Debug','encash_internal_id',encash_internal_id);
						  
						let todayDate = new Date('03/25/2020');
						let current_month = todayDate.getMonth() + 1
						
						let get_wage_date = search_wageperiod(payGroup);
						let w_Date = get_wage_date.toString().split('#');
						let end_date = w_Date[0];
						let start_date = w_Date[1];
						let mth = nlapiStringToDate(end_date);
						let get_month = leave_get_month;//mth.getMonth() + 1;
						let year = leave_year;//mth.getFullYear();
						 
						let yearId = searchYear(year);
						let lastDay  = new Date(leave_from_date.getFullYear(), leave_from_date.getMonth() + 1, 0);
						let pay_Date =  nlapiDateToString(lastDay);				
						
						
						
						nlapiLogExecution('Debug','pay_Date',pay_Date);
						
						let wage_period = get_month ;

						// added by florence for hris month
						wage_period=gethrisMonth(wage_period);
						
						let wage_year_id = yearId ;
						
						
						
						let leave_balance = getLeaveBanlce(i_empID,leave_type);
						nlapiLogExecution('DEBUG','leave_balance',leave_balance);
						
						let DENOMINATOR_CONSIDERED_configSearch = nlapiSearchRecord("customrecord_hris_leaveconfig",null,
						[
						   ["internalidnumber","equalto",leave_type]
						], 
						[
						   new nlobjSearchColumn("custrecord_hris_lveconfig_lveencashcal")
						]
						);
						
						let denominator = 0;
						if(DENOMINATOR_CONSIDERED_configSearch)
						{
							denominator = DENOMINATOR_CONSIDERED_configSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lveconfig_lveencashcal"));
						}
						
						if(!denominator)
						{
							denominator = 0;
						}
						
						let Encash_amt_all_comps = getEncashAmount(i_empID,payGroup,encash_internal_id,omani_nonOmani);
						nlapiLogExecution('DEBUG','Encash_amt_all_comps',Encash_amt_all_comps);

						nlapiLogExecution('DEBUG','Denominator',denominator);
						nlapiLogExecution('DEBUG','no_of_encash_days',no_of_encash_days);
						let amount = (Encash_amt_all_comps /parseFloat(denominator))  * parseFloat(no_of_encash_days);
						nlapiLogExecution('DEBUG','amount',amount);
						
						no_of_encash_days = parseFloat(no_of_encash_days);
						
									let filters_i = new Array();
				
									let columns_i = new Array(); 
									
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_empname', null, 'is', i_empID ))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_paygroup', null, 'is', payGroup))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_month', null, 'is', wage_period))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_year', null, 'is', wage_year_id))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_paycomponent', null, 'is', encash_internal_id))
									filters_i.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_msileaverefno', null, 'anyof', i_recID))
									
									
									let searchEmp_i = nlapiSearchRecord('customrecord_hris_monthlysalinput', null, filters_i, null);
									
									if (!searchEmp_i) // if old record not exists then create new appraisal
									{
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'searchEmp_i IFFFFFFFF : ');
										
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'searchEmp_i IFFFFFFFF : ');
							
										let rec_create = nlapiCreateRecord('customrecord_hris_monthlysalinput');
										
										rec_create.setFieldValue('custrecord_hris_mthsal_empname',i_empID);
										
										if(payGroup)
										rec_create.setFieldValue('custrecord_hris_mthsal_paygroup',payGroup);
										
										if(wage_period)
										rec_create.setFieldValue('custrecord_hris_mthsal_month',wage_period);
										
										if(wage_year_id)
										rec_create.setFieldValue('custrecord_hris_mthsal_year',wage_year_id);
										
										
										rec_create.setFieldValue('custrecord_hris_mthsal_paycomponent',encash_internal_id);
										
										//if(leave_balance)
										//	rec_create.setFieldValue('custrecord_apm_msi_annualavailablebal',leave_balance);
										
										rec_create.setFieldValue('custrecord_hris_mthsal_leave_encashment',denominator);
										
										rec_create.setFieldValue('custrecord_hris_mthsal_paydt',pay_Date);
										
										if(amount)
										rec_create.setFieldValue('custrecord_hris_mthsal_salaryamount',amount);
									
										if(no_of_encash_days)
											rec_create.setFieldValue('custrecord_hris_mthsal_no_of_encashable',no_of_encash_days);
									
										if(i_recID)
											rec_create.setFieldValue('custrecord_hris_mthsal_msileaverefno',i_recID);
										
										rec_create.setFieldValue('custrecord_hris_mthsal_remarks','This entry is auto created from Leave Application against Leave Encashment');
										
										
										let rec_submit = nlapiSubmitRecord(rec_create,true,true);
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'rec_submitrec_submit : ' + rec_submit);
										
										
									}
					 }
						
					  
					  
					 
					  
					 
 		  
	  } 
	  catch(e)
	  {
		  if (e instanceof nlobjError)
	          nlapiLogExecution('DEBUG', 'system error', e.getCode() + '\n'+ e.getDetails());
	    else
	          nlapiLogExecution('DEBUG', 'unexpected error', e.toString());
	  }
		
	

	return true;

}


{
	function _logValidation(value) 
	{
	  if(value!='null' && value != null  && value != '' && value != undefined && value != 'undefined' && value != 'NaN' && value != NaN) 
	  {
	   return true;
	  }
	  else 
	  { 
	   return false;
	  }
	}


}
// END FUNCTION =====================================================
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

function getLatestRecordId(empid)
{
	let rec_id = null;

			let filters = new Array();
					
			filters[0] = new nlobjSearchFilter('custrecord1421', null, "anyof", empid);
					
					
			let columns = new Array();
			
					columns[0] = new nlobjSearchColumn('internalid').setSort(true);
					
					let SearchResult = nlapiSearchRecord('customrecord_ihr_air_ticket_eligibility', null, filters, columns);
					nlapiLogExecution('DEBUG', 'after submit', 'SearchResult.length :'+SearchResult.length);
					
					if (_logValidation(SearchResult))//
					{
					   rec_id =	SearchResult[0].getValue('internalid', null, null);
					}
		return rec_id;			
}

function remFormatedDate(remainMonth_year, remainMonth_month, lastdayOfEachMonth){
	            
	            let date_format = checkDateFormat();
				let year        = remainMonth_year;
				let Anvr_month  = remainMonth_month
				let Anvr_DateVal = lastdayOfEachMonth;
				
				if (date_format == 'YYYY-MM-DD')
		  		{
		  	 let newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
		  		}
		 		 if (date_format == 'DD/MM/YYYY')
		 		 {
		  			let newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
			
		  		}
				if (date_format == 'D/M/YYYY')
		 		 {
		  			let newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
			
		  		}
		  		if (date_format == 'MM/DD/YYYY')
		  		{
		  			let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
		   		}
				if (date_format == 'M/D/YYYY')
		  		{
		  			let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
		   		}
				
				if (date_format == 'DD-MM-YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				
				if (date_format == 'DD-Mon-YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				
				if (date_format == 'DD.MM.YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
		   		}
				if (date_format == 'DD-Month-YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				if (date_format == 'YYYY/MM/DD')
		  		{
		  	 let newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
		  		}
				
				if (date_format == 'DD MONTH, YYYY')
		  		{
					
		  	 let newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;
			 
		  		}
				
			return newDate;
				
}


 function checkDateFormat()
{
    let context = nlapiGetContext();

    let dateFormatPref = context.getPreference('dateformat');

    return dateFormatPref;
}


function search_paygroup(employee_name)
{
    let filters = new Array();
    let columns = new Array();
    
    filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_name));
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
    columns.push(new nlobjSearchColumn('internalid'));
    columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))
	    
    columns[0].setSort(true);
    
    let s_result = nlapiSearchRecord('customrecord_hris_employee_compen_change', null, filters, columns)
    
    if (s_result != null) 
	{
        let s_paygroup = s_result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp')      
    }//End of if (s_result != null) 
    return s_paygroup 
}//End of function search_paygroup(employee_name)

function search_payComponent(paygroup)
{
    let filters = new Array();
    let columns = new Array();
    
    filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto', 24));
	filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',paygroup));
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	
	
    columns.push(new nlobjSearchColumn('internalid'));
    	    
    columns[0].setSort(true);
    
    let s_result = nlapiSearchRecord('customrecord_hris_payroll_component', null, filters, columns)
    
    if (s_result != null) 
	{
        let s_paycomponent = s_result[0].getValue('internalid')      
    }//End of if (s_result != null) 
    return s_paycomponent 
}//End of function search_paygroup(employee_name)



function getmonth(month)
 {
 	//alert('into function')
	if( month == 1)
	{
		return 'january' ;
	}
	if( month == 2)
	{
		return 'feb' ;
	}
	if( month == 3)
	{
		return 'march' ;
	}
	if( month == 4)
	{
		return 'April' ;
	}
	if( month == 5)
	{
		return 'May' ;
	}
	if( month == 6)
	{
		return 'June' ;
	}
	if( month == 7)
	{
		return 'July' ;
	}
	if( month == 8)
	{
		return 'August' ;
	}
	if( month == 9)
	{
		return 'September';
	}
	if( month == 10)
	{
		return 'October';
	}
	if( month == 11)
	{
		return 'November';
	}
	if( month == 12)
	{
		return 'December';
	}
	
	
 }
 function searchmonth(month)
{
	//alert('into function')
	let yearId; 
	let filters = new Array();
    let columns = new Array();
    filters.push(new nlobjSearchFilter('internalid', null, 'is', month))
	//columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('name'));
	let result = nlapiSearchRecord('customlist_hris_month_list', null, filters, columns)
	//alert('result'+result)
	if (result != null) 
	{
	 	month_name = result[0].getValue('name');		
	}
	return month_name;
}
function search_wageperiod(pay_group)
{	
	let Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_group', null,'is',pay_group));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	let Column= new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_end_date'));
	Column.push(new nlobjSearchColumn('custrecord_hris_start_date'));
	Column.push(new nlobjSearchColumn('custrecord_hris_month'));
	Column.push(new nlobjSearchColumn('custrecord_hris_year'));
	Column.push(Column[0].setSort(true));
	
	let searchResult =nlapiSearchRecord('customrecord_hris_wage_period_details',null,Filters,Column);
		
	if(searchResult !=null)
	{
		let WagePeriod_EndDate = searchResult[0].getValue('custrecord_hris_end_date')
		
		let start_date = searchResult[0].getValue('custrecord_hris_start_date');
		
		let month = searchResult[0].getValue('custrecord_hris_month')
		
		let year = searchResult[0].getValue('custrecord_hris_year')
		
	}//End of if(searchResult !=null)
	return WagePeriod_EndDate+"#"+ start_date +"#"+month+"#"+year;
}//End of function search_wageperiod(pay_group)

function searchYear(year)
{
	
	nlapiLogExecution('DEBUG', 'after submit record', 'searchYear year : '+year);	
	let yearId; 
	let filters = new Array();
    let columns = new Array();
    filters.push(new nlobjSearchFilter('name', null, 'contains', year))
	columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('name'));
	let result = nlapiSearchRecord('customlist_hris_year_master', null, filters, columns)
	if (result != null) 
	{
	 	yearId = result[0].getValue('internalid');	
		nlapiLogExecution('DEBUG', 'after submit record', 'searchYear yearIdyearId : '+yearId);			
	}
	return yearId;
}
//Function to search employee's wage period end date


function getCompanyCurrentDateTime(){
    let currentDateTime = new Date();
    let companyTimeZone = nlapiLoadConfiguration('companyinformation').getFieldText('timezone');
    let timeZoneOffSet = (companyTimeZone.indexOf('(GMT)') == 0) ? 0 : new Number(companyTimeZone.substr(4, 6).replace(/\+|:00/gi, '').replace(/:30/gi, '.5'));
    let UTC = currentDateTime.getTime() + (currentDateTime.getTimezoneOffset() * 60000);
    let companyDateTime = UTC + (timeZoneOffSet * 60 * 60 * 1000);
    
    return new Date(companyDateTime);
}
// END FUNCTION =====================================================


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



function getBasic(pay_group, emp_id) {
    let salAmt = 0.00;
    let filter = [];
    let column = [];
    filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    filter.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'anyof', pay_group));
   // filter.push(new nlobjSearchFilter('custrecord_hris_consider_for_encashment', null, 'is', 'T'));
    filter.push(new nlobjSearchFilter('internalid', null, 'is', 1));


    column.push(new nlobjSearchColumn('internalid'));

    let pay_comp_search = nlapiSearchRecord('customrecord_hris_payroll_component', null, filter, column);
    //nlapiLogExecution('DEBUG', 'pay_comp_search length', pay_comp_search.length)
    if (pay_comp_search != null) {
        for (let i = 0; i < pay_comp_search.length; i++) {

            let comp_id = pay_comp_search[i].getValue('internalid');

            nlapiLogExecution('DEBUG', 'pay_comp_search comp_id', comp_id)

            let edc_search = nlapiSearchRecord("customrecord_hris_employee_compen_change", null,
                [
                    ["custrecord_hris_empchange_employee_nam", "anyof", emp_id],
                    "AND",
                    ["custrecord_hris_employee_data_change.custrecord_hris_cde_payroll_component", "anyof", comp_id]

                ],
                [
                    new nlobjSearchColumn("custrecord_hris_empchange_employee_nam"),
                    new nlobjSearchColumn("custrecord_hris_cde_monthly", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null),
                    new nlobjSearchColumn("custrecord_hris_cde_process_group", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null),
                    new nlobjSearchColumn("internalid", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null)
                ]
            );
            //nlapiLogExecution('DEBUG', 'edc_search length', edc_search.length)
            if (edc_search != null) {
                for (let j = 0; j < edc_search.length; j++) {
                    let payGrp_Comp_Detail = edc_search[j].getValue("custrecord_hris_cde_monthly", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null);
                    let comp_value = edc_search[j].getValue("custrecord_hris_cde_process_group", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null);


                    nlapiLogExecution('DEBUG', 'comp_value', comp_value)
                    nlapiLogExecution('DEBUG', 'payGrp_Comp_Detail', payGrp_Comp_Detail)
                    salAmt = parseFloat(salAmt) + parseFloat(payGrp_Comp_Detail);



                }
            }
        }
    }

    return salAmt;
}




function get_sequence_no(leave_type)
{
	let sequence_no =''
	let filters = new Array();
	let columns = new Array();
	
	filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
	
	columns.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_seqno'));
	
	let compoff_record_result = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, columns);
	
	if (compoff_record_result != null) 
	{
	
		sequence_no = compoff_record_result[0].getValue('custrecord_hris_lvecnfg_seqno')
		
	 nlapiLogExecution('DEBUG','WFH ', 'sequence_no --> '+ sequence_no)	
	}
	return sequence_no ;
} // end of function get_sequence_no(leave_type)






function getEncashAmount(empName,processGrp,encash_internal_id){
	    
    let compType = encash_internal_id;
     
   
    let salAmt = 0.00;
    
    let filter3 = [];
    filter3.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'anyof', processGrp));
    filter3.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null,'equalto', 40));
    
    let column3 = [];
    column3.push(new nlobjSearchColumn('internalid'))
    let search_comp = nlapiSearchRecord('customrecord_hris_payroll_component', null, filter3, column3)
    if(search_comp){
        let comp_intID = search_comp[0].getValue('internalid');
        
        if(compType == comp_intID){
        nlapiLogExecution('DEBUG', 'inside LeaveType condition')
        let filter = [];
        let column = [];
        filter.push(new nlobjSearchFilter('isinactive',null, 'is', 'F'));
        filter.push(new nlobjSearchFilter('custrecord_hris_pay_process_group',null, 'anyof', processGrp));
        filter.push(new nlobjSearchFilter('custrecord_hris_consider_for_encashment', null, 'is', 'T'));
        
        column.push(new nlobjSearchColumn('internalid'));
        
        let pay_comp_search = nlapiSearchRecord('customrecord_hris_payroll_component', null, filter, column);
       // nlapiLogExecution('DEBUG', 'pay_comp_search length', pay_comp_search.length)
        if(pay_comp_search!= null){
            for(let i = 0; i < pay_comp_search.length; i++){
                
             let comp_id = pay_comp_search[i].getValue('internalid');
             
             let edc_search = nlapiSearchRecord("customrecord_hris_employee_compen_change",null,
                [
                   ["custrecord_hris_empchange_employee_nam","anyof", empName],
                   "AND", 
                   ["custrecord_hris_employee_data_change.custrecord_hris_cde_payroll_component","anyof",comp_id]					  
                   
                ], 
                [
                   new nlobjSearchColumn("custrecord_hris_empchange_employee_nam"), 
                   new nlobjSearchColumn("custrecord_hris_cde_monthly","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null), 
                   new nlobjSearchColumn("custrecord_hris_cde_process_group","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null), 
                   new nlobjSearchColumn("internalid","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null)
                ]
                );
             //nlapiLogExecution('DEBUG', 'edc_search length', edc_search.length)
              if(edc_search!=null){
                  for(let j=0; j < edc_search.length; j++){
                      let payGrp_Comp_Detail = edc_search[j].getValue("custrecord_hris_cde_monthly","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null);
                      let comp_value = edc_search[j].getValue("custrecord_hris_cde_process_group","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null);
                      
                         
                          nlapiLogExecution('DEBUG', 'comp_value', comp_value)
                          nlapiLogExecution('DEBUG', 'payGrp_Comp_Detail', payGrp_Comp_Detail)
                          salAmt = parseFloat(salAmt) + parseFloat(payGrp_Comp_Detail);
                      
                      
                      
                  }
              }
          }
            
            
       }
      salAmt = salAmt.toFixed(3)
   
   }//if(leaveType== 22)
 }
    
 return   salAmt; 
    
}//if(name== 'custrecord_apm_msi_noofencashabledays')
       
function getLeaveBanlce(employee,leave_type)
{
	let bal = 0.00;  
	let customrecord_hris_leavebalanceSearch = nlapiSearchRecord("customrecord_hris_leavebalance",null,
	[
	   ["custrecord_hris_lvbal_employee_name","anyof",employee], 
	   "AND", 
	   ["custrecord_hris_lvbal_leave_type","anyof",leave_type]
	], 
	[
	   new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"), 
	   new nlobjSearchColumn("custrecord_hris_lvbal_encashable_days")
	]
	);
	if(customrecord_hris_leavebalanceSearch)
	{
		let annual = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"));
		let encash = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lvbal_encashable_days"));
		
		if(!annual)
			annual = 0;
		
		
		if(!encash)
			encash = 0;
		
		bal = parseFloat(annual) + parseFloat(encash)
	}
	
	return bal;
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
    if (date_format == 'D/M/YYYY') {
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

function checkDateFormat() {
    let context = nlapiGetContext();

    let dateFormatPref = context.getPreference('dateformat');

    return dateFormatPref;
}

function getEncashCompId(id)
{
	let customrecord_hris_payroll_componentSearch = nlapiSearchRecord("customrecord_hris_payroll_component",null,
		[
		   ["custrecord_hris_pay_process_group","anyof",id],
		   "AND",
		   ["custrecord_hris__sequence_no_","equalto","40"]
		], 
		[
		   new nlobjSearchColumn("internalid"), 
		   new nlobjSearchColumn("custrecord_hris_component_short_name").setSort(false),
		   new nlobjSearchColumn("custrecord_hris__sequence_no_")
		]
		);

		if(customrecord_hris_payroll_componentSearch)
		{
			let id = customrecord_hris_payroll_componentSearch[0].getId();

		}
	return id;	
}
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_lve_encashrotationalcreatemsi_ue = (() => {
function afterSubmitRecord_encasment_msi_creatio(type)
{
    
		
	 try
	  {
        if (type !== 'delete') {
		   	// Get current user 
					  let i_Current_User = nlapiGetUser();
					  //nlapiLogExecution('DEBUG', 'Before submit record', 'i_Current_User : '+i_Current_User);
					  
					  //Get record type
					  let i_recType = nlapiGetRecordType();
					  nlapiLogExecution('DEBUG', 'after submit record', 'i_recType : '+i_recType);
					  
					  //Get record ID
					  let i_recID  = nlapiGetRecordId();
					  nlapiLogExecution('DEBUG', 'after submit record', 'i_recID : '+i_recID);
					  
					  // Load record for getting value
					  let o_recordObj = nlapiLoadRecord(i_recType, i_recID);
					  
					  let leave_type =   o_recordObj.getFieldValue('custrecord_hris_lve_leavetype');
					  
					  let leave_status = o_recordObj.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
					   
					  let cancel_check = o_recordObj.getFieldValue('custrecord_hris_lve_cancellation');
					  
					  let i_empID = 	 o_recordObj.getFieldValue('custrecord_hris_lve_employeename');
					  
					  let seq_no = get_sequence_no(leave_type);
					  
					  let appliy_encashment =   o_recordObj.getFieldValue('custrecord_hris_lve_applylveencashment');
					  
					  leave_status =   o_recordObj.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
					  
					  let leave_balance =   o_recordObj.getFieldValue('custrecord_hris_lve_leavebalance');
							
					  
       
					if(seq_no == '24' && leave_status == '2' ) 
					 {
					  
						 
						  
						  let leave_from_date =  o_recordObj.getFieldValue('custrecord_hris_lve_expectedresumebackdt');// changed FROM DATE to expected work resum date. earliear it was Leave From date. just changed the ID variables remains same // 13-08-2020
						  
						  leave_from_date = nlapiStringToDate(leave_from_date);
						  
						  let leave_get_month = leave_from_date.getMonth() + 1;
						  let leave_year = leave_from_date.getFullYear();
						  
						  let leave_YearId = searchYear(leave_year);
						  
						  let to_Date = o_recordObj.getFieldValue('custrecord_hris_lve_todate');
						  
						  let leave_type = o_recordObj.getFieldValue('custrecord_hris_lve_leavetype');
						  
						  let no_of_encash_days = o_recordObj.getFieldValue('custrecord_hris_lve_noofencashmentdays');
						  
						  
						  let payGroup = search_paygroup(i_empID);
						  
						  let encash_internal_id = getEncashCompId(payGroup);
						  nlapiLogExecution('Debug','encash_internal_id',encash_internal_id);
						  
						let todayDate = new Date();
						let current_month = todayDate.getMonth() + 1
						
						let get_wage_date = search_wageperiod(payGroup);
						let w_Date = get_wage_date.toString().split('#');
						let end_date = w_Date[0];
						let start_date = w_Date[1];
						let mth = nlapiStringToDate(end_date);
						let get_month = leave_get_month;//mth.getMonth() + 1;
						let year = leave_year;//mth.getFullYear();
						 
						let yearId = searchYear(year);
						let lastDay  = new Date(leave_from_date.getFullYear(), leave_from_date.getMonth() + 1, 0);
						let pay_Date =  nlapiDateToString(lastDay);			
											
						
						nlapiLogExecution('Debug','pay_Date',pay_Date);
						
						let wage_period = get_month ;
						// added by florence to get hris month
						wage_period=gethrisMonth(wage_period);
						let wage_year_id = yearId ;
						
						
											
						
						 let customrecord_hris_leavebalanceSearch = nlapiSearchRecord("customrecord_hris_leavebalance",null,
							[
							   
                               ["custrecord_hris_lvbal_employee_name.internalid","anyof",i_empID], 
							   "AND", 
							   ["custrecord_hris_lvbal_employee_name.isinactive","is","F"], 
							   "AND", 
							   ["custrecord_hris_lvbal_leave_type","anyof",leave_type], 
							   "AND", 
							   ["custrecord_hris_rt_basic_pay_msi_created","is","F"]
							], 
							[
							    new nlobjSearchColumn("custrecord_hris_lvbal_leave_type"), 
							   new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"), 
							   new nlobjSearchColumn("internalid","custrecord_hris_lvbal_leave_type",null), 
							   new nlobjSearchColumn("custrecord_hris_lvbal_employee_name"), 
							   new nlobjSearchColumn("custrecord_hris_lvbal_encashable_days"), 
							   new nlobjSearchColumn("internalid")
							]
							);
							
						if(customrecord_hris_leavebalanceSearch)
						{
							 let leave_banalence_id = customrecord_hris_leavebalanceSearch[0].getId();
							 let _load_leave_balance = nlapiLoadRecord('customrecord_hris_leavebalance',leave_banalence_id);
							 _load_leave_balance.setFieldValue('custrecord_hris_lvbal_encashment_msi','T');
						}							
						
						let DENOMINATOR_CONSIDERED_configSearch = nlapiSearchRecord("customrecord_hris_leaveconfig",null,
						[
						   ["internalidnumber","equalto",leave_type]
						], 
						[
						   new nlobjSearchColumn("custrecord_hris_lveconfig_lveencashcal")
						]
						);
						
						let denominator = 0;
						if(DENOMINATOR_CONSIDERED_configSearch)
						{
							denominator = DENOMINATOR_CONSIDERED_configSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lveconfig_lveencashcal"));
						}
						
						if(!denominator)
						{
							denominator = 0;
						}
						
						let Encash_amt_all_comps = getEncashAmount(i_empID,payGroup,encash_internal_id);
						nlapiLogExecution('DEBUG','Encash_amt_all_comps',Encash_amt_all_comps);
						
						let amount = (Encash_amt_all_comps /parseFloat(denominator))  * parseFloat(leave_balance);
						nlapiLogExecution('DEBUG','amount',amount);
						
						no_of_encash_days = parseFloat(no_of_encash_days);
						
									let filters_i = new Array();
				
									let columns_i = new Array(); 
									
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_empname', null, 'is', i_empID ))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_paygroup', null, 'is', payGroup))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_month', null, 'is', wage_period))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_year', null, 'is', wage_year_id))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_paycomponent', null, 'is', encash_internal_id))
									filters_i.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_msileaverefno', null, 'anyof', i_recID))
									
									
									let searchEmp_i = nlapiSearchRecord('customrecord_hris_monthlysalinput', null, filters_i, null);
									
									if (!searchEmp_i && customrecord_hris_leavebalanceSearch) // if old record not exists then create new appraisal
									{
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'searchEmp_i IFFFFFFFF : ');
										
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'searchEmp_i IFFFFFFFF : ');
							
										let rec_create = nlapiCreateRecord('customrecord_hris_monthlysalinput');
										
										rec_create.setFieldValue('custrecord_hris_mthsal_empname',i_empID);
										
										if(payGroup)
										rec_create.setFieldValue('custrecord_hris_mthsal_paygroup',payGroup);
										
										if(wage_period)
										rec_create.setFieldValue('custrecord_hris_mthsal_month',wage_period);
										
										if(wage_year_id)
										rec_create.setFieldValue('custrecord_hris_mthsal_year',wage_year_id);
										
										
										rec_create.setFieldValue('custrecord_hris_mthsal_paycomponent',encash_internal_id);
										
										if(leave_balance)
											rec_create.setFieldValue('custrecord_hris_mthsal_annual_leave_bala',leave_balance);
										
										rec_create.setFieldValue('custrecord_hris_mthsal_leave_encashment',denominator);
										
										rec_create.setFieldValue('custrecord_hris_mthsal_paydt',pay_Date);
										
										if(amount)
										rec_create.setFieldValue('custrecord_hris_mthsal_salaryamount',amount);
									
										if(leave_balance)
											rec_create.setFieldValue('custrecord_hris_mthsal_no_of_encashable',leave_balance);
									
										if(i_recID)
											rec_create.setFieldValue('custrecord_hris_mthsal_msileaverefno',i_recID);
										
										rec_create.setFieldValue('custrecord_hris_mthsal_remarks','This entry is auto created from Leave Application against Rotational Leavae Encashment');
										
										
										let rec_submit = nlapiSubmitRecord(rec_create,true,true);
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'rec_submitrec_submit : ' + rec_submit);
										let bal_submit = nlapiSubmitRecord(_load_leave_balance,true,true);
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'bal_submit : ' + bal_submit);
										
										
									}
					 }
                      }
					  
					  
					 
					  
					 
 		  
	  } 
	  catch(e)//
	  {
		  if (e instanceof nlobjError)
	          nlapiLogExecution('DEBUG', 'system error', e.getCode() + '\n'+ e.getDetails());
	    else
	          nlapiLogExecution('DEBUG', 'unexpected error', e.toString());
	  }
		
	

	return true;

}


{
	function _logValidation(value) //
	{
	  if(value!='null' && value != null  && value != '' && value != undefined && value != 'undefined' && value != 'NaN' && value != NaN) 
	  {
	   return true;
	  }
	  else 
	  { 
	   return false;
	  }
	}


}



function getLatestRecordId(empid)
{
	let rec_id = null;

			let filters = new Array();
					
			filters[0] = new nlobjSearchFilter('custrecord1421', null, "anyof", empid);
					
					
			let columns = new Array();
			
					columns[0] = new nlobjSearchColumn('internalid').setSort(true);
					
					let SearchResult = nlapiSearchRecord('customrecord_ihr_air_ticket_eligibility', null, filters, columns);
					nlapiLogExecution('DEBUG', 'after submit', 'SearchResult.length :'+SearchResult.length);
					
					if (_logValidation(SearchResult))//
					{
					   rec_id =	SearchResult[0].getValue('internalid', null, null);
					}
		return rec_id;			
}

function remFormatedDate(remainMonth_year, remainMonth_month, lastdayOfEachMonth){
	            
	            let date_format = checkDateFormat();
				let year        = remainMonth_year;
				let Anvr_month  = remainMonth_month
				let Anvr_DateVal = lastdayOfEachMonth;
				
				if (date_format == 'YYYY-MM-DD')
		  		{
		  	 let newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
		  		}
		 		 if (date_format == 'DD/MM/YYYY')
		 		 {
		  			let newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
			
		  		}
				if (date_format == 'D/M/YYYY')
		 		 {
		  			let newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
			
		  		}
		  		if (date_format == 'MM/DD/YYYY')
		  		{
		  			let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
		   		}
				if (date_format == 'M/D/YYYY')
		  		{
		  			let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
		   		}
				
				if (date_format == 'DD-MM-YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				
				if (date_format == 'DD-Mon-YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				
				if (date_format == 'DD.MM.YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
		   		}
				if (date_format == 'DD-Month-YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				if (date_format == 'YYYY/MM/DD')
		  		{
		  	 let newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
		  		}
				
				if (date_format == 'DD MONTH, YYYY')
		  		{
					
		  	 let newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;
			 
		  		}
				
			return newDate;
				
}


 function checkDateFormat()
{
    let context = nlapiGetContext();

    let dateFormatPref = context.getPreference('dateformat');

    return dateFormatPref;
}


function search_paygroup(employee_name)
{
    let filters = new Array();
    let columns = new Array();
    
    filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_name));
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
    columns.push(new nlobjSearchColumn('internalid'));
    columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))
	    
    columns[0].setSort(true);
    
    let s_result = nlapiSearchRecord('customrecord_hris_employee_compen_change', null, filters, columns)
    
    if (s_result != null) 
	{
        let s_paygroup = s_result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp')      
    }//End of if (s_result != null) 
    return s_paygroup 
}//End of function search_paygroup(employee_name)
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

function search_payComponent(paygroup)
{
    let filters = new Array();
    let columns = new Array();
    
    filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto', 24));
	filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',paygroup));
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	
	
    columns.push(new nlobjSearchColumn('internalid'));
    	    
    columns[0].setSort(true);
    
    let s_result = nlapiSearchRecord('customrecord_hris_payroll_component', null, filters, columns)
    
    if (s_result != null) 
	{
        let s_paycomponent = s_result[0].getValue('internalid')      
    }//End of if (s_result != null) 
    return s_paycomponent 
}//End of function search_paygroup(employee_name)


function getmonth(month)
 {
 	//alert('into function')
	if( month == 1)
	{
		return 'january' ;
	}
	if( month == 2)
	{
		return 'feb' ;
	}
	if( month == 3)
	{
		return 'march' ;
	}
	if( month == 4)
	{
		return 'April' ;
	}
	if( month == 5)
	{
		return 'May' ;
	}
	if( month == 6)
	{
		return 'June' ;
	}
	if( month == 7)
	{
		return 'July' ;
	}
	if( month == 8)
	{
		return 'August' ;
	}
	if( month == 9)
	{
		return 'September';
	}
	if( month == 10)
	{
		return 'October';
	}
	if( month == 11)
	{
		return 'November';
	}
	if( month == 12)
	{
		return 'December';
	}
	
	
 }
 function searchmonth(month)
{
	//alert('into function')
	let yearId; 
	let filters = new Array();
    let columns = new Array();
    filters.push(new nlobjSearchFilter('internalid', null, 'is', month))
	//columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('name'));
	let result = nlapiSearchRecord('customlist_hris_month_list', null, filters, columns)
	//alert('result'+result)
	if (result != null) 
	{
	 	month_name = result[0].getValue('name');		
	}
	return month_name;
}
function search_wageperiod(pay_group)
{	
	let Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_group', null,'is',pay_group));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	let Column= new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_end_date'));
	Column.push(new nlobjSearchColumn('custrecord_hris_start_date'));
	Column.push(new nlobjSearchColumn('custrecord_hris_month'));
	Column.push(new nlobjSearchColumn('custrecord_hris_year'));
	Column.push(Column[0].setSort(true));
	
	let searchResult =nlapiSearchRecord('customrecord_hris_wage_period_details',null,Filters,Column);
		
	if(searchResult !=null)
	{
		let WagePeriod_EndDate = searchResult[0].getValue('custrecord_hris_end_date')
		
		let start_date = searchResult[0].getValue('custrecord_hris_start_date');
		
		let month = searchResult[0].getValue('custrecord_hris_month')
		
		let year = searchResult[0].getValue('custrecord_hris_year')
		
	}//End of if(searchResult !=null)
	return WagePeriod_EndDate+"#"+ start_date +"#"+month+"#"+year;
}//End of function search_wageperiod(pay_group)

function searchYear(year)
{
	
	nlapiLogExecution('DEBUG', 'after submit record', 'searchYear year : '+year);	
	let yearId; 
	let filters = new Array();
    let columns = new Array();
    filters.push(new nlobjSearchFilter('name', null, 'contains', year))
	columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('name'));
	let result = nlapiSearchRecord('customlist_hris_year_master', null, filters, columns)
	if (result != null) 
	{
	 	yearId = result[0].getValue('internalid');	
		nlapiLogExecution('DEBUG', 'after submit record', 'searchYear yearIdyearId : '+yearId);			
	}
	return yearId;
}
//Function to search employee's wage period end date


function getCompanyCurrentDateTime(){
    let currentDateTime = new Date();
    let companyTimeZone = nlapiLoadConfiguration('companyinformation').getFieldText('timezone');
    let timeZoneOffSet = (companyTimeZone.indexOf('(GMT)') == 0) ? 0 : new Number(companyTimeZone.substr(4, 6).replace(/\+|:00/gi, '').replace(/:30/gi, '.5'));
    let UTC = currentDateTime.getTime() + (currentDateTime.getTimezoneOffset() * 60000);
    let companyDateTime = UTC + (timeZoneOffSet * 60 * 60 * 1000);
    
    return new Date(companyDateTime);
}
// END FUNCTION =====================================================


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



function getBasic(pay_group, emp_id) {
    let salAmt = 0.00;
    let filter = [];
    let column = [];
    filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    filter.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'anyof', pay_group));
   // filter.push(new nlobjSearchFilter('custrecord_hris_consider_for_encashment', null, 'is', 'T'));
    filter.push(new nlobjSearchFilter('internalid', null, 'is', 1));


    column.push(new nlobjSearchColumn('internalid'));

    let pay_comp_search = nlapiSearchRecord('customrecord_hris_payroll_component', null, filter, column);
    //nlapiLogExecution('DEBUG', 'pay_comp_search length', pay_comp_search.length)
    if (pay_comp_search != null) {
        for (let i = 0; i < pay_comp_search.length; i++) {

            let comp_id = pay_comp_search[i].getValue('internalid');

            nlapiLogExecution('DEBUG', 'pay_comp_search comp_id', comp_id)

            let edc_search = nlapiSearchRecord("customrecord_hris_employee_compen_change", null,
                [
                    ["custrecord_hris_empchange_employee_nam", "anyof", emp_id],
                    "AND",
                    ["custrecord_hris_employee_data_change.custrecord_hris_cde_payroll_component", "anyof", comp_id]

                ],
                [
                    new nlobjSearchColumn("custrecord_hris_empchange_employee_nam"),
                    new nlobjSearchColumn("custrecord_hris_cde_monthly", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null),
                    new nlobjSearchColumn("custrecord_hris_cde_process_group", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null),
                    new nlobjSearchColumn("internalid", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null)
                ]
            );
            //nlapiLogExecution('DEBUG', 'edc_search length', edc_search.length)
            if (edc_search != null) {
                for (let j = 0; j < edc_search.length; j++) {
                    let payGrp_Comp_Detail = edc_search[j].getValue("custrecord_hris_cde_monthly", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null);
                    let comp_value = edc_search[j].getValue("custrecord_hris_cde_process_group", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null);


                    nlapiLogExecution('DEBUG', 'comp_value', comp_value)
                    nlapiLogExecution('DEBUG', 'payGrp_Comp_Detail', payGrp_Comp_Detail)
                    salAmt = parseFloat(salAmt) + parseFloat(payGrp_Comp_Detail);



                }
            }
        }
    }

    return salAmt;
}



function get_sequence_no(leave_type)
{
	let sequence_no =''
	let filters = new Array();
	let columns = new Array();
	
	filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
	
	columns.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_seqno'));
	
	let compoff_record_result = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, columns);
	
	if (compoff_record_result != null) 
	{
	
		sequence_no = compoff_record_result[0].getValue('custrecord_hris_lvecnfg_seqno')
		
	 nlapiLogExecution('DEBUG','WFH ', 'sequence_no --> '+ sequence_no)	
	}
	return sequence_no ;
} // end of function get_sequence_no(leave_type)






function getEncashAmount(empName,processGrp,encash_internal_id){
	    
	   let compType = encash_internal_id;
	    
	  
	   let salAmt = 0.00;
	   
	   let filter3 = [];
	   filter3.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'anyof', processGrp));
	   filter3.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null,'equalto', 40));
	   
	   let column3 = [];
	   column3.push(new nlobjSearchColumn('internalid'))
	   let search_comp = nlapiSearchRecord('customrecord_hris_payroll_component', null, filter3, column3)
	   if(search_comp){
		   let comp_intID = search_comp[0].getValue('internalid');
		   
		   if(compType == comp_intID){
		   nlapiLogExecution('DEBUG', 'inside LeaveType condition')
		   let filter = [];
		   let column = [];
		   filter.push(new nlobjSearchFilter('isinactive',null, 'is', 'F'));
		   filter.push(new nlobjSearchFilter('custrecord_hris_pay_process_group',null, 'anyof', processGrp));
		   filter.push(new nlobjSearchFilter('custrecord_hris_consider_for_encashment', null, 'is', 'T'));
		   
		   column.push(new nlobjSearchColumn('internalid'));
		   
		   let pay_comp_search = nlapiSearchRecord('customrecord_hris_payroll_component', null, filter, column);
		  // nlapiLogExecution('DEBUG', 'pay_comp_search length', pay_comp_search.length)
		   if(pay_comp_search!= null){
			   for(let i = 0; i < pay_comp_search.length; i++){
				   
				let comp_id = pay_comp_search[i].getValue('internalid');
				
				let edc_search = nlapiSearchRecord("customrecord_hris_employee_compen_change",null,
                   [
                      ["custrecord_hris_empchange_employee_nam","anyof", empName],
                      "AND", 
                      ["custrecord_hris_employee_data_change.custrecord_hris_cde_payroll_component","anyof",comp_id]					  
                      
                   ], 
                   [
                      new nlobjSearchColumn("custrecord_hris_empchange_employee_nam"), 
                      new nlobjSearchColumn("custrecord_hris_cde_monthly","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null), 
                      new nlobjSearchColumn("custrecord_hris_cde_process_group","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null), 
                      new nlobjSearchColumn("internalid","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null)
                   ]
                   );
				//nlapiLogExecution('DEBUG', 'edc_search length', edc_search.length)
			     if(edc_search!=null){
					 for(let j=0; j < edc_search.length; j++){
						 let payGrp_Comp_Detail = edc_search[j].getValue("custrecord_hris_cde_monthly","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null);
						 let comp_value = edc_search[j].getValue("custrecord_hris_cde_process_group","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null);
						 
						    
							 nlapiLogExecution('DEBUG', 'comp_value', comp_value)
							 nlapiLogExecution('DEBUG', 'payGrp_Comp_Detail', payGrp_Comp_Detail)
						     salAmt = parseFloat(salAmt) + parseFloat(payGrp_Comp_Detail);
						 
						 
						 
					 }
				 }
			 }
		       
			   
		  }
		 salAmt = salAmt.toFixed(3)
	  
      }//if(leaveType== 22)
	}
	   
	return   salAmt; 
	   
   }//if(name== 'custrecord_apm_msi_noofencashabledays')
	   
   
   
function getLeaveBanlce(employee,leave_type)
{
	let bal = 0.00;  
	let customrecord_hris_leavebalanceSearch = nlapiSearchRecord("customrecord_hris_leavebalance",null,
	[
	   ["custrecord_hris_lvbal_employee_name","anyof",employee], 
	   "AND", 
	   ["custrecord_hris_lvbal_leave_type","anyof",leave_type]
	], 
	[
	   new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"), 
	   new nlobjSearchColumn("custrecord_hris_lvbal_encashable_days")
	]
	);
	if(customrecord_hris_leavebalanceSearch)
	{
		let annual = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"));
		let encash = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lvbal_encashable_days"));
		
		if(!annual)
			annual = 0;
		
		
		if(!encash)
			encash = 0;
		
		bal = parseFloat(annual) + parseFloat(encash)
	}
	
	return bal;
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
    if (date_format == 'D/M/YYYY') {
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

function checkDateFormat() {
    let context = nlapiGetContext();

    let dateFormatPref = context.getPreference('dateformat');

    return dateFormatPref;
}

function getEncashCompId(id)
{
	let customrecord_hris_payroll_componentSearch = nlapiSearchRecord("customrecord_hris_payroll_component",null,
		[
		   ["custrecord_hris_pay_process_group","anyof",id],
		   "AND",
		   ["custrecord_hris__sequence_no_","equalto","40"]
		], 
		[
		   new nlobjSearchColumn("internalid"), 
		   new nlobjSearchColumn("custrecord_hris_component_short_name").setSort(false),
		   new nlobjSearchColumn("custrecord_hris__sequence_no_")
		]
		);

		if(customrecord_hris_payroll_componentSearch)
		{
			let id = customrecord_hris_payroll_componentSearch[0].getId();

		}
	return id;	
}
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_lve_lmsworkflow_ue = (() => {
function userEventBeforeLoad(type, form, request) {
	
	if (!isFieldEmpty(nlapiGetFieldValue("custrecord_hris_lve_staus"))) {

		let statusInColor = '<BR>' + '<font size=2>' + 'STATUS' + '</font>'
				+ '<BR>' + '<font color="red" size=2>'
				+ nlapiGetFieldValue("custrecord_hris_lve_staus") + '</font>';
	} else {
		let statusInColor = '<BR>' + '<font size=2>' + 'STATUS' + '</font>'
				+ '<BR>' + '<font color="red" size=2>' + 'Draft' + '</font>';
	}
	nlapiSetFieldValue("custrecord_hris_lve_status_incolor", statusInColor, false);
	
	let statusInColorfield = form.getField("custrecord_hris_lve_status_incolor");
	statusInColorfield.setLabel("");
	
	let namefield = form.getField("custrecord_hris_lve_staus");
	namefield.setDisplayType("hidden");
	/* hide status in text */
	
	
	let curWFLval = nlapiGetFieldValue("custrecord_hris_lve_current_wflevel_no");
  nlapiSetFieldValue("custrecord_hris_lve_curt_wflevel_no_high", curWFLval, false);
	

	
	let nonEditableTillLevel = parseInt(nlapiGetFieldValue("custrecord_hris_lve_current_wflevel_no"));

	if (nlapiGetFieldValue("custrecord_hris_lve_current_wflevel_no") >= 20) {
		nonEditableTillLevel = 8; // set it to Total WF Levels
	}

	if (nlapiGetFieldValue("custrecord_hris_lve_current_wflevel_no") > 0
			& nlapiGetFieldValue("custrecord_hris_lve_current_wflevel_no") < 8) {
		for (let n = 1; n <= nonEditableTillLevel; n++) {
			let approverfield = form.getField("custrecord_hris_lve_approver" + n);
			//approverfield.setDisplayType("inline");
		}
	}
	
	
	let _Role = nlapiGetContext().getRoleId();
    nlapiLogExecution('DEBUG', '', 'Role: ' + _Role);
    
    if (_Role != "administrator" && _Role != "full_access" && _Role != "customrole1128") //
	//if (nlapiGetContext().getRoleId() != "administrator") 
	
	{
		let hiddenfield = form.getField("custrecord_hris_lve_wfhelp");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_totno_approvers");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_wflow_setup");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_current_approver");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_current_wflevel_no");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_next_wflevel_no");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_next_approver");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_current_editor");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_additional_msg");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_comments");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_workflow_actionflag");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_action_taken");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_approval_date");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_html2");
		hiddenfield.setDisplayType("hidden");

	}
	
	let totNoWFLevel = nlapiGetFieldValue("custrecord_hris_lve_total_wflevels");
	if(!isFieldEmpty(totNoWFLevel)){
		totNoWFLevel = parseInt(totNoWFLevel);
		if(totNoWFLevel< 10){
			nlapiLogExecution('DEBUG', 'Hide Unused Apporvers Fields', 'totNoWFLevel:'+totNoWFLevel)
			for(let i = totNoWFLevel+1;i<=10;i++){
				nlapiLogExecution('DEBUG', 'Hide Unused Apporvers Fields', 'custrecord_hris_lve_approver:'+i)
				let apprFld = form.getField("custrecord_hris_lve_approver"+i)
				if(apprFld != null){
					nlapiLogExecution('DEBUG', 'Hide Unused Apporvers Fields', 'Hide: custrecord_hris_lve_approver:'+i)
					apprFld.setDisplayType("hidden");
				}
			}
		}
	}
	
}



function isFieldEmpty(value)
{
    if(value =='null' || value == null || value == null || value == '' || value == undefined || value == undefined || value == 'undefined' || value == 'undefined'|| value == 'NaN' || value == NaN)
    {
        return true;
    }
    else
    {
        return false;
    }
}
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_lve_monthly_salary_entry_ue = (() => {
function UES_Monthly_salary_entry(type)
{
	

	if (type != 'delete') 
	{
		
		let recordId = nlapiGetRecordId()
		nlapiLogExecution('DEBUG', 'recordId', recordId)
		let o_leaveApp = nlapiLoadRecord('customrecord_hris_leaveapplication', recordId)
		
		let emp_Id = o_leaveApp.getFieldValue('custrecord_hris_lve_employeename')
		nlapiLogExecution('DEBUG','WFH ', 'emp_Id --> '+ emp_Id)
		
		let Leave_type = o_leaveApp.getFieldValue('custrecord_hris_lve_leavetype')
		nlapiLogExecution('DEBUG','WFH ', 'Leave_type --> '+ Leave_type)
		
		
		//let leaveTypeRecord = nlapiLoadRecord('customrecord_hris_leaveconfig', Leave_type);
		let leaveRefNo = o_leaveApp.getFieldValue('name');
		let LeaveApplication_Status = o_leaveApp.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
		 nlapiLogExecution('DEBUG','WFH ', 'LeaveApplication_Status --> '+ LeaveApplication_Status)
		 
		let leaveCancelStatus = o_leaveApp.getFieldValue('custrecord_hris_lve_cancel_leavestatus');
		 
		let cancel_check = o_leaveApp.getFieldValue('custrecord_hris_lve_cancellation');
		
		let salAmt = o_leaveApp.getFieldValue('custrecord_hris_lve_airticketamount');
		
	//	let airTicketChk = o_leaveApp.getFieldValue('custrecord_hris_lve_airticketapplicable');
		
		let airTicketChk = o_leaveApp.getFieldValue('custrecord_hris_lve_airticketrequired');
		nlapiLogExecution('DEBUG', 'LeaveApplication_Status', LeaveApplication_Status)
		nlapiLogExecution('DEBUG', 'cancel_check', cancel_check)
		nlapiLogExecution('DEBUG', 'airTicketChk', airTicketChk)
		let seq_no = get_sequence_no(Leave_type)
		if(airTicketChk == 'T' && cancel_check=='F' && LeaveApplication_Status=='2')
		{
			
		let fromDate = o_leaveApp.getFieldValue('custrecord_hris_lve_fromdate');
		nlapiLogExecution('DEBUG', 'Integration fromDate', fromDate);
		    fromDate = nlapiStringToDate(fromDate)
		let search_pay_grp = get_paygroup(emp_Id);
		let payComp = searchPayComp(search_pay_grp)
		
		
			fromDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0);
            let lastDayDate_frmDate = fromDate.getDate();
            let lastDayMonth_frmDate = fromDate.getMonth()+1;
            let lastDayYear_frmDate = fromDate.getFullYear();
			
			let finalDate_toDate = remFormatedDate(lastDayYear_frmDate, lastDayMonth_frmDate, lastDayDate_frmDate)
			nlapiLogExecution('DEBUG', 'Integration finalDate_toDate', finalDate_toDate)
		    nlapiLogExecution('DEBUG', 'payComp',payComp)
			
			let year = lastDayYear_frmDate;	
					    year = year.toString();
					let YearId = searchYear(year);
					
			let filter = [];
			let column = [];
			
			//filter.push(new nlobjSearchFilter('custrecord_apm_pc_pay_pro_grp', null, 'anyof', search_pay_grp));
			filter.push(new nlobjSearchFilter('custrecord_hris_mthsal_empname', null, 'is', emp_Id));
			filter.push(new nlobjSearchFilter('custrecord_hris_mthsal_year', null, 'is', YearId));
			//filter.push(new nlobjSearchFilter('custrecord_hris_mthsal_month', null, 'is', lastDayMonth_frmDate));
			filter.push(new nlobjSearchFilter('custrecord_hris_mthsal_paycomponent', null, 'is', payComp));
          filter.push(new nlobjSearchFilter('custrecord_hris_mthsal_msileaverefno', null, 'anyof', recordId));
			filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
			
			let search = nlapiSearchRecord('customrecord_hris_monthlysalinput', null, filter, column)
			if(search == null)
			{
				let msi_rec = nlapiCreateRecord('customrecord_hris_monthlysalinput');
			msi_rec.setFieldValue('custrecord_hris_mthsal_empname', emp_Id)
			//msi_rec.setFieldValue('custrecord_hris_mthsal_paygroup', search_pay_grp)
			    msi_rec.setFieldValue('custrecord_hris_mthsal_paygroup', search_pay_grp)
				msi_rec.setFieldValue('custrecord_hris_mthsal_paydt', finalDate_toDate)
				// Added by florence for getting month
				lastDayMonth_frmDate = gethrisMonth(lastDayMonth_frmDate);
				msi_rec.setFieldValue('custrecord_hris_mthsal_month', lastDayMonth_frmDate)
				msi_rec.setFieldValue('custrecord_hris_mthsal_year', YearId)
				
				msi_rec.setFieldValue('custrecord_hris_mthsal_paycomponent', payComp)
				msi_rec.setFieldValue('custrecord_hris_mthsal_salaryamount', salAmt)
				msi_rec.setFieldValue('custrecord_hris_mthsal_year', YearId)
				msi_rec.setFieldValue('custrecord_hris_mthsal_msileaverefno', recordId);
				
			let id = nlapiSubmitRecord(msi_rec, true, true);
			nlapiLogExecution('DEBUG', 'created id', id);
			}
			
			
			
			
		}
		

	}//End if (type == 'create' || type == 'edit') 
//}// End function LMS_LeaveBalanceDebitCredit_AfterSubmit(type)
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


function searchYear(year)
{
	let yearVal = '';
	year = year.toString();
	nlapiLogExecution('DEBUG', 'Year in searchYear function', year);
	let filter = [];
    filter.push(new nlobjSearchFilter('name', null, 'contains', year));
    filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    
    let column = [];
    column.push(new nlobjSearchColumn('internalid'));
    
    let search = nlapiSearchRecord('customlist_hris_year_master', null, filter, column);
  if(search){
	  yearVal = search[0].getValue('internalid')
  }
  nlapiLogExecution('DEBUG', 'yearVal in SearchYear  Func', yearVal);
    return yearVal;  
}




function get_sequence_no(leave_type)
{
	let sequence_no =''
	let filters = new Array();
	let columns = new Array();
	
	filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
	
	columns.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_seqno'));
	
	let compoff_record_result = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, columns);
	
	if (compoff_record_result != null) 
	{
	
		sequence_no = compoff_record_result[0].getValue('custrecord_hris_lvecnfg_seqno')
		
	 nlapiLogExecution('DEBUG','WFH ', 'sequence_no --> '+ sequence_no)	
	}
	return sequence_no ;
} // end of function get_sequence_no(leave_type)


function get_paygroup(employee_id)
{   
    let filters = new Array();
    let columns = new Array();
    filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_id));
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
    columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))
    
    let result = nlapiSearchRecord('customrecord_hris_employee_compen_change', null, filters, columns)
    
    if (result != null) 
	{
        let paygroup = result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp') 
    }//End of if (result != null)
    return paygroup;
}//End of function get_paygroup(employee_id)




function searchPayComp(i_paygroup_earn)
{
	let PTID;
	let Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_paygroup_earn));
	Filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto',36));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	let column = new Array();
	column.push(new nlobjSearchColumn('internalid'));	
	let searchPTCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
	if(searchPTCheck !=null)
	{
		PTID = searchPTCheck[0].getValue('internalid');	
	}//End if(searchNetCheck !=null)
	return PTID;
}//searchPTId(i_paygroup_earn)




  function remFormatedDate(remainMonth_year, remainMonth_month, lastdayOfEachMonth){
	            
	            let date_format = checkDateFormat();
				let year        = remainMonth_year;
				let Anvr_month  = remainMonth_month
				let Anvr_DateVal = lastdayOfEachMonth;
				
				if (date_format == 'YYYY-MM-DD')
		  		{
		  	 let newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
		  		}
		 		 if (date_format == 'DD/MM/YYYY' || date_format == 'D/M/YYYY')
		 		 {
		  			let newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
			
		  		}
		  		if (date_format == 'MM/DD/YYYY')
		  		{
		  			let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
		   		}
				if (date_format == 'M/D/YYYY')
		  		{
		  			let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
		   		}
				
				if (date_format == 'DD-MM-YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				
				if (date_format == 'DD-Mon-YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				
				if (date_format == 'DD.MM.YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
		   		}
				if (date_format == 'DD-Month-YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				if (date_format == 'YYYY/MM/DD')
		  		{
		  	 let newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
		  		}
				
				if (date_format == 'DD MONTH, YYYY')
		  		{
					
		  	 let newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;
			 
		  		}
				
			return newDate;
				
}



 function checkDateFormat()
{
    let context = nlapiGetContext();

    let dateFormatPref = context.getPreference('dateformat');

    return dateFormatPref;
}
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_lve_pullbackbutton_ue = (() => {
function beforeLoadRecord_ShowButton(type)
{

	if(type == 'view')
	{
		let LeaveRecID = nlapiGetRecordId();
		let user = nlapiGetUser();
		if(LeaveRecID != null)
		{
			let LeaveRec_OBJ = nlapiLoadRecord('customrecord_hris_leaveapplication',LeaveRecID);
			let EmpName = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_employeename')
			let approver0 = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_approver0')
			
			/* let CurrentApp_Level = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_current_wflevel_no')
			nlapiLogExecution('DEBUG', 'CurrentApp_Level', 'CurrentApp_Level*************' + CurrentApp_Level);
 */
			
			let CurrentApp_Level = LeaveRec_OBJ.getFieldValue('custrecord_hris_lveappapprovallevel')
			nlapiLogExecution('DEBUG', 'CurrentApp_Level', 'CurrentApp_Level*************' + CurrentApp_Level);
			let Cancelcheck = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_cancellation')
			nlapiLogExecution('DEBUG', 'Cancelcheck', 'Cancelcheck*************' + Cancelcheck);
			let Approvalstatus = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus')
			nlapiLogExecution('DEBUG', 'Approvalstatus', 'Approvalstatus*************' + Approvalstatus);
			
			let Requestor = LeaveRec_OBJ.getFieldValue('custrecordhris_lve_requestor')
			nlapiLogExecution('DEBUG', 'Requestor', 'Requestor*************' +Requestor);
			//if((CurrentApp_Level == '1' || CurrentApp_Level == '2' || CurrentApp_Level == '3' || CurrentApp_Level == '4') && (Approvalstatus ==1 ))
			if (Approvalstatus ==1 )

			{
				if(Cancelcheck == 'F')
				{
					if(user == EmpName || user == Requestor)
				{
					form.setScript('customscript_hris_lve_pullbackcall_cs');
				    form.addButton('custpage_DeleteButton', 'Pullback Leave', 'PullbackLeave(\'' +LeaveRecID+ '\');');
				}
			   }
				
			}
		}
	}
}
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_lve_pullbackleave_ue = (() => {
function BeforeSubmit_Create_Pullback_Record(type)
{
   let custformscript =nlapiGetFieldValue('custrecord_hris_lve_script_version');
   nlapiLogExecution("DEBUG","custformscript",custformscript)
if (custformscript == 1){ 

   if(type =='delete')
  {
  
   //Get field values
   let EmployeeNAME = nlapiGetFieldValue('custrecord_hris_lve_employeename');
   let EmployeeCODE = nlapiGetFieldValue('custrecord_hris_lve_empcode');
   let Manager = nlapiGetFieldValue('custrecord_hris_lve_supervisor');
   let ProjectSupervisor = nlapiGetFieldValue('custrecord_hris_lve_project_supervisor');
   let LeaveType = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
   let LeaveBalance = nlapiGetFieldValue('custrecord_hris_lve_leavebalance');
   let FromDate = nlapiGetFieldValue('custrecord_hris_lve_fromdate');
   let FromHalfDay = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
   let ToDate = nlapiGetFieldValue('custrecord_hris_lve_todate');
   let ToHalfDay = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');
   let TotalNoDays = nlapiGetFieldValue('custrecord_hris_lve_totalnodays');
   let ValidTillDate = nlapiGetFieldValue('custrecord_hris_lve_validtilldate');
   let LeaveReason = nlapiGetFieldValue('custrecord_hris_lve_leavereason');
   let SupportDoc = nlapiGetFieldValue('custrecord_hris_lve_supportdocument');
   let LeaveAppStatus = nlapiGetFieldValue('custrecord_hris_lve_staus');
   
   //create Pullback record
   let PullBackRecord = nlapiCreateRecord('customrecord_hris_pullback_lveapplicatio');   
   PullBackRecord.setFieldValue('custrecord_hris_plb_employee_name',EmployeeNAME);
   PullBackRecord.setFieldValue('custrecord_hris_plb_employee_code',EmployeeCODE);
   PullBackRecord.setFieldValue('custrecord_hris_plb_supervisor',Manager);
   PullBackRecord.setFieldValue('custrecord_hris_plb_hod',ProjectSupervisor);
   PullBackRecord.setFieldValue('custrecord_hris_plb_leave_type',LeaveType);
   PullBackRecord.setFieldValue('custrecord_hris_plb_leave_balance',LeaveBalance);
   PullBackRecord.setFieldValue('custrecord_hris_plb_from_date',FromDate);
   PullBackRecord.setFieldValue('custrecord_hris_plb_from_halfday',FromHalfDay);
   PullBackRecord.setFieldValue('custrecord_hris_plb_todate',ToDate);
   PullBackRecord.setFieldValue('custrecord_hris_plb_to_halfday',ToHalfDay);
   PullBackRecord.setFieldValue('custrecord_hris_plb_total_days',TotalNoDays);
   PullBackRecord.setFieldValue('custrecord_hris_plb_vaid_tilldate',ValidTillDate);
   PullBackRecord.setFieldValue('custrecord_hris_plb_leave_reason',LeaveReason);
   PullBackRecord.setFieldValue('custrecord_hris_plb_support_document',SupportDoc);
   PullBackRecord.setFieldValue('custrecord_hris_plb_leave_applica_status',LeaveAppStatus);   
   let PullBackRecord_ID = nlapiSubmitRecord(PullBackRecord,true,true)
   nlapiLogExecution('DEBUG', 'pullid', PullBackRecord_ID);
	return true;

	
   }
 
}
}
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_lve_rotationalcreatemsi_ue = (() => {
function afterSubmitRecord_rotational_msi_creatio(type)
{
    
		
	 try
	  {
        nlapiLogExecution('DEBUG', 'type', 'type : '+type);
        if (type !== 'delete') {
		   	// Get current user 
					  let i_Current_User = nlapiGetUser();
					  //nlapiLogExecution('DEBUG', 'Before submit record', 'i_Current_User : '+i_Current_User);
					  
					  //Get record type
					  let i_recType = nlapiGetRecordType();
					  nlapiLogExecution('DEBUG', 'after submit record', 'i_recType : '+i_recType);
					  
					  //Get record ID
					  let i_recID  = nlapiGetRecordId();
					  nlapiLogExecution('DEBUG', 'after submit record', 'i_recID : '+i_recID);
					  
                        
					  // Load record for getting value
					  let o_recordObj = nlapiLoadRecord(i_recType, i_recID);					  
					  let leave_type =   o_recordObj.getFieldValue('custrecord_hris_lve_leavetype');					  
					  let leave_status = o_recordObj.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
					   
					  let cancel_check = o_recordObj.getFieldValue('custrecord_hris_lve_cancellation');
					  
					  let i_empID = 	 o_recordObj.getFieldValue('custrecord_hris_lve_employeename');
					  
					  let seq_no = get_sequence_no(leave_type);
					  
					   let customrecord_hris_leavebalanceSearch = nlapiSearchRecord("customrecord_hris_leavebalance",null,
							[
							   ["custrecord_hris_lvbal_employee_name.internalid","anyof",i_empID], 
							   "AND", 
							   ["custrecord_hris_lvbal_employee_name.isinactive","is","F"], 
							   "AND", 
							   ["custrecord_hris_lvbal_leave_type","anyof",leave_type], 
							   "AND", 
							   ["custrecord_hris_rt_basic_pay_msi_created","is","F"]
							], 
							[
							   new nlobjSearchColumn("custrecord_hris_lvbal_leave_type"), 
							   new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"), 
							   new nlobjSearchColumn("internalid","custrecord_hris_lvbal_leave_type",null), 
							   new nlobjSearchColumn("custrecord_hris_lvbal_employee_name"), 
							   new nlobjSearchColumn("custrecord_hris_lvbal_encashable_days"), 
							   new nlobjSearchColumn("internalid")
							]
							);
							
					  
					 //if((leave_type == 11 || leave_type == 13 || leave_type == 14 || leave_type == 15 ) && leave_status == 1 && cancel_check == 'F' ) 
					if((seq_no == 6 || seq_no == '6') && leave_status == 2 && cancel_check == 'F' && customrecord_hris_leavebalanceSearch ) 
					 {
					  
						  let leave_banalence_id = customrecord_hris_leavebalanceSearch[0].getId();
						  
						  let _load_leave_balance = nlapiLoadRecord('customrecord_hris_leavebalance',leave_banalence_id);
						  
						  let leave_bal_credited = _load_leave_balance.getFieldValue('custrecord_hris_lvbal_leave_balance_cred')||0;
						  
						  _load_leave_balance.setFieldValue('custrecord_hris_rt_basic_pay_msi_created','T');
						  
						  let leave_from_date =    o_recordObj.getFieldValue('custrecord_hris_lve_fromdate');
						  
						  leave_from_date = nlapiStringToDate(leave_from_date);
						  
						  let leave_get_month = leave_from_date.getMonth() + 1;
						  let leave_year = leave_from_date.getFullYear();
						  
						  let leave_YearId = searchYear(leave_year);
						  
						  let to_Date = o_recordObj.getFieldValue('custrecord_hris_lve_todate');
						  
						  let leave_type = o_recordObj.getFieldValue('custrecord_hris_lve_leavetypee');
						  
						  let no_of_days = leave_bal_credited;//o_recordObj.getFieldValue('custrecord_lms_la_total_no_of_days');
						  
						  let expected_resume_date = o_recordObj.getFieldValue('custrecord_hris_lve_expectedresumebackdt');
						  
						  expected_resume_date = nlapiStringToDate(expected_resume_date);
						  
						  let expected_get_month = expected_resume_date.getMonth() + 1;
						  let expected_year = expected_resume_date.getFullYear();
						  
						  let payGroup = search_paygroup(i_empID);
						  
						 let comp_id =  getBasicCompId(payGroup)
						  
						
						let get_wage_date = search_wageperiod(payGroup);
						let w_Date = get_wage_date.toString().split('#');
						let end_date = w_Date[0];
						let start_date = w_Date[1];
						let mth = nlapiStringToDate(end_date);
						let get_month = expected_get_month;//mth.getMonth() + 1;
						let year = expected_year;//mth.getFullYear();
						 
						let yearId = searchYear(year);
						let lastDay  = new Date(expected_resume_date.getFullYear(), expected_resume_date.getMonth() + 1, 0);
						let pay_Date =  nlapiDateToString(lastDay);				
						

						let todayDate = new Date();
						let leave_month = leave_from_date.getMonth() + 1;
						leave_year = leave_from_date.getFullYear();

						nlapiLogExecution('Debug', 'leave_month', leave_month);
						nlapiLogExecution('Debug', 'leave_year', leave_year);

						let leave_year_id = searchYear(leave_year);

						let arrear_month = leave_month;
						let current_month = todayDate.getMonth() + 1
						nlapiLogExecution('Debug', 'current_month', current_month);

						
						let wage_period = get_month;
						// added by florence to get hris month
						wage_period = gethrisMonth(wage_period);
						let wage_year_id = yearId;
						
						
						
						let baisc_amt = getBasic(payGroup, i_empID);
						let amount = (baisc_amt /30)  * parseFloat(no_of_days);
						
						no_of_days = parseFloat(no_of_days)
						
									let filters_i = new Array();
				
									let columns_i = new Array(); 
									
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_empname', null, 'is', i_empID ))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_paygroup', null, 'is', payGroup))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_month', null, 'is', wage_period))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_year', null, 'is', wage_year_id))
									
									// By Florence Paycomponent field is used
									//filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_component_name', null, 'is', comp_id))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_paycomponent', null, 'is', comp_id))
									filters_i.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_msileaverefno', null, 'anyof', i_recID))
									
									
									let searchEmp_i = nlapiSearchRecord('customrecord_hris_monthlysalinput', null, filters_i, null);
									
									if (!searchEmp_i) // if old record not exists then create new appraisal
									{
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'searchEmp_i IFFFFFFFF : ');
										
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'searchEmp_i IFFFFFFFF : ');
							
										let rec_create = nlapiCreateRecord('customrecord_hris_monthlysalinput');
										
										rec_create.setFieldValue('custrecord_hris_mthsal_empname',i_empID);
										
										if(payGroup)
										rec_create.setFieldValue('custrecord_hris_mthsal_paygroup',payGroup);
										
										if(wage_period)
										rec_create.setFieldValue('custrecord_hris_mthsal_month',wage_period);
										
										if(wage_year_id)
										rec_create.setFieldValue('custrecord_hris_mthsal_year',wage_year_id);
										
										// Florence
										rec_create.setFieldValue('custrecord_hris_mthsal_paycomponent',comp_id);
										
										
										rec_create.setFieldValue('custrecord_hris_mthsal_paydt',pay_Date);
										
										if(amount)
										rec_create.setFieldValue('custrecord_hris_mthsal_salaryamount',amount);
										
										if(baisc_amt)
										rec_create.setFieldValue('custrecord_hris_mthsal_fixedmonthlybasic',baisc_amt);
									
										if(no_of_days)
											rec_create.setFieldValue('custrecord_hris_mthsal_noofrtleavedays',no_of_days);
									
										if(i_recID)
											rec_create.setFieldValue('custrecord_hris_mthsal_msileaverefno',i_recID);
										
										rec_create.setFieldValue('custrecord_hris_mthsal_remarks','This Transaction auto is auto created from leave application agaist rotational leave');
										
										
										let rec_submit = nlapiSubmitRecord(rec_create,true,true);
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'rec_submitrec_submit : ' + rec_submit);
										let bal_submit = nlapiSubmitRecord(_load_leave_balance,true,true);
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'bal_submit : ' + bal_submit);
										
									}
					 }
                      }	
					  
					  
					 
					  
					 
 		  
	  } //END -try
	  catch(e)//
	  {
		  if (e instanceof nlobjError)
	          nlapiLogExecution('DEBUG', 'system error', e.getCode() + '\n'+ e.getDetails());
	    else
	          nlapiLogExecution('DEBUG', 'unexpected error', e.toString());
	  }
		
 	

	return true;

}


{
	function _logValidation(value) //
	{
	  if(value!='null' && value != null  && value != '' && value != undefined && value != 'undefined' && value != 'NaN' && value != NaN) 
	  {
	   return true;
	  }
	  else 
	  { 
	   return false;
	  }
	}


}



function getLatestRecordId(empid)
{
	let rec_id = null;

			let filters = new Array();
					
			filters[0] = new nlobjSearchFilter('custrecord1421', null, "anyof", empid);
					
					
			let columns = new Array();
			
					columns[0] = new nlobjSearchColumn('internalid').setSort(true);
					
					let SearchResult = nlapiSearchRecord('customrecord_ihr_air_ticket_eligibility', null, filters, columns);
					nlapiLogExecution('DEBUG', 'after submit', 'SearchResult.length :'+SearchResult.length);
					
					if (_logValidation(SearchResult))//
					{
					   rec_id =	SearchResult[0].getValue('internalid', null, null);
					}
		return rec_id;			
}

function remFormatedDate(remainMonth_year, remainMonth_month, lastdayOfEachMonth){
	            
	            let date_format = checkDateFormat();
				let year        = remainMonth_year;
				let Anvr_month  = remainMonth_month
				let Anvr_DateVal = lastdayOfEachMonth;
				
				if (date_format == 'YYYY-MM-DD')
		  		{
		  	 let newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
		  		}
		 		 if (date_format == 'DD/MM/YYYY')
		 		 {
		  			let newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
			
		  		}
				if (date_format == 'D/M/YYYY')
		 		 {
		  			let newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
			
		  		}
		  		if (date_format == 'MM/DD/YYYY')
		  		{
		  			let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
		   		}
				if (date_format == 'M/D/YYYY')
		  		{
		  			let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
		   		}
				
				if (date_format == 'DD-MM-YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				
				if (date_format == 'DD-Mon-YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				
				if (date_format == 'DD.MM.YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
		   		}
				if (date_format == 'DD-Month-YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				if (date_format == 'YYYY/MM/DD')
		  		{
		  	 let newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
		  		}
				
				if (date_format == 'DD MONTH, YYYY')
		  		{
					
		  	 let newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;
			 
		  		}
				
			return newDate;
				
}


 function checkDateFormat()
{
    let context = nlapiGetContext();

    let dateFormatPref = context.getPreference('dateformat');

    return dateFormatPref;
}


function search_paygroup(employee_name)
{
    let filters = new Array();
    let columns = new Array();
    
    filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_name));
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
    columns.push(new nlobjSearchColumn('internalid'));
    columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))
	    
    columns[0].setSort(true);
    
    let s_result = nlapiSearchRecord('customrecord_hris_employee_compen_change', null, filters, columns)
    
    if (s_result != null) 
	{
        let s_paygroup = s_result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp')      
    }//End of if (s_result != null) 
    return s_paygroup 
}//End of function search_paygroup(employee_name)
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
function search_payComponent(paygroup)
{
    let filters = new Array();
    let columns = new Array();
    
    filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto', 24));
	filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',paygroup));
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	
	
    columns.push(new nlobjSearchColumn('internalid'));
    	    
    columns[0].setSort(true);
    
    let s_result = nlapiSearchRecord('customrecord_hris_payroll_component', null, filters, columns)
    
    if (s_result != null) 
	{
        let s_paycomponent = s_result[0].getValue('internalid')      
    }//End of if (s_result != null) 
    return s_paycomponent 
}//End of function search_paygroup(employee_name)


function getmonth(month)
 {
 	//alert('into function')
	if( month == 1)
	{
		return 'january' ;
	}
	if( month == 2)
	{
		return 'feb' ;
	}
	if( month == 3)
	{
		return 'march' ;
	}
	if( month == 4)
	{
		return 'April' ;
	}
	if( month == 5)
	{
		return 'May' ;
	}
	if( month == 6)
	{
		return 'June' ;
	}
	if( month == 7)
	{
		return 'July' ;
	}
	if( month == 8)
	{
		return 'August' ;
	}
	if( month == 9)
	{
		return 'September';
	}
	if( month == 10)
	{
		return 'October';
	}
	if( month == 11)
	{
		return 'November';
	}
	if( month == 12)
	{
		return 'December';
	}
	
	
 }
 function searchmonth(month)
{
	//alert('into function')
	let yearId; 
	let filters = new Array();
    let columns = new Array();
    filters.push(new nlobjSearchFilter('internalid', null, 'is', month))
	//columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('name'));
	let result = nlapiSearchRecord('customlist_hris_month_list', null, filters, columns)
	//alert('result'+result)
	if (result != null) 
	{
	 	month_name = result[0].getValue('name');		
	}
	return month_name;
}
function search_wageperiod(pay_group)
{	
	let Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_group', null,'is',pay_group));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	let Column= new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_end_date'));
	Column.push(new nlobjSearchColumn('custrecord_hris_start_date'));
	Column.push(new nlobjSearchColumn('custrecord_hris_month'));
	Column.push(new nlobjSearchColumn('custrecord_hris_year'));
	Column.push(Column[0].setSort(true));
	
	let searchResult =nlapiSearchRecord('customrecord_hris_wage_period_details',null,Filters,Column);
		
	if(searchResult !=null)
	{
		let WagePeriod_EndDate = searchResult[0].getValue('custrecord_hris_end_date')
		
		let start_date = searchResult[0].getValue('custrecord_hris_start_date');
		
		let month = searchResult[0].getValue('custrecord_hris_month')
		
		let year = searchResult[0].getValue('custrecord_hris_year')
		
	}//End of if(searchResult !=null)
	return WagePeriod_EndDate+"#"+ start_date +"#"+month+"#"+year;
}//End of function search_wageperiod(pay_group)

function searchYear(year)
{
	
	nlapiLogExecution('DEBUG', 'after submit record', 'searchYear year : '+year);	
	let yearId; 
	let filters = new Array();
    let columns = new Array();
    filters.push(new nlobjSearchFilter('name', null, 'contains', year))
	columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('name'));
	let result = nlapiSearchRecord('customlist_hris_year_master', null, filters, columns)
	if (result != null) 
	{
	 	yearId = result[0].getValue('internalid');	
		nlapiLogExecution('DEBUG', 'after submit record', 'searchYear yearIdyearId : '+yearId);			
	}
	return yearId;
}
//Function to search employee's wage period end date


function getCompanyCurrentDateTime(){
    let currentDateTime = new Date();
    let companyTimeZone = nlapiLoadConfiguration('companyinformation').getFieldText('timezone');
    let timeZoneOffSet = (companyTimeZone.indexOf('(GMT)') == 0) ? 0 : new Number(companyTimeZone.substr(4, 6).replace(/\+|:00/gi, '').replace(/:30/gi, '.5'));
    let UTC = currentDateTime.getTime() + (currentDateTime.getTimezoneOffset() * 60000);
    let companyDateTime = UTC + (timeZoneOffSet * 60 * 60 * 1000);
    
    return new Date(companyDateTime);
}
// END FUNCTION =====================================================


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



function getBasic(pay_group, emp_id) {
    let salAmt = 0.00;
    let filter = [];
    let column = [];
    filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    filter.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'anyof', pay_group));
   // filter.push(new nlobjSearchFilter('custrecord_apm_pc_consider_for_encash', null, 'is', 'T'));
    filter.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto', '1'));


    column.push(new nlobjSearchColumn('internalid'));

    let pay_comp_search = nlapiSearchRecord('customrecord_hris_payroll_component', null, filter, column);
    //nlapiLogExecution('DEBUG', 'pay_comp_search length', pay_comp_search.length)
    if (pay_comp_search != null) {
        for (let i = 0; i < pay_comp_search.length; i++) {

            let comp_id = pay_comp_search[i].getValue('internalid');

            nlapiLogExecution('DEBUG', 'pay_comp_search comp_id', comp_id)

            let edc_search = nlapiSearchRecord("customrecord_hris_employee_compen_change", null,
                [
                    ["custrecord_hris_empchange_employee_nam", "anyof", emp_id],
                    "AND",
                    ["custrecord_hris_employee_data_change.custrecord_hris_cde_payroll_component", "anyof", comp_id]

                ],
                [
                    new nlobjSearchColumn("custrecord_hris_empchange_employee_nam"),
                    new nlobjSearchColumn("custrecord_hris_cde_monthly", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null),
                    new nlobjSearchColumn("custrecord_hris_cde_process_group", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null),
                    new nlobjSearchColumn("internalid", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null)
                ]
            );
            //nlapiLogExecution('DEBUG', 'edc_search length', edc_search.length)
            if (edc_search != null) {
                for (let j = 0; j < edc_search.length; j++) {
                    let payGrp_Comp_Detail = edc_search[j].getValue("custrecord_hris_cde_monthly", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null);
                    let comp_value = edc_search[j].getValue("custrecord_hris_cde_process_group", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null);


                    nlapiLogExecution('DEBUG', 'comp_value', comp_value)
                    nlapiLogExecution('DEBUG', 'payGrp_Comp_Detail', payGrp_Comp_Detail)
                    salAmt = parseFloat(salAmt) + parseFloat(payGrp_Comp_Detail);



                }
            }
        }
    }

    return salAmt;
}



function get_sequence_no(leave_type)
{
	let sequence_no =''
	let filters = new Array();
	let columns = new Array();
	
	filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
	
	columns.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_seqno'));
	
	let compoff_record_result = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, columns);
	
	if (compoff_record_result != null) 
	{
	
		sequence_no = compoff_record_result[0].getValue('custrecord_hris_lvecnfg_seqno')
		
	 nlapiLogExecution('DEBUG','WFH ', 'sequence_no --> '+ sequence_no)	
	}
	return sequence_no ;
} // end of function get_sequence_no(leave_type)


function getBasicCompId(id)
{
	let customrecord_hris_payroll_componentSearch = nlapiSearchRecord("customrecord_hris_payroll_component",null,
		[
		   ["custrecord_hris_pay_process_group","anyof",id],
		   "AND",
		   ["custrecord_hris__sequence_no_","equalto","19"]
		], 
		[
		   new nlobjSearchColumn("internalid"), 
		   new nlobjSearchColumn("custrecord_hris_component_short_name").setSort(false),
		   new nlobjSearchColumn("custrecord_hris__sequence_no_")
		]
		);

		if(customrecord_hris_payroll_componentSearch)
		{
			let id = customrecord_hris_payroll_componentSearch[0].getId();

		}
		
	return id;	
}
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_lve_workmaternityfunc_ue = (() => {
function LMS_workResume_Maternity_AfterSubmit(type) 
{


	 if (type != 'delete') 
	 {
		 let _record_type = nlapiGetRecordType();
		 let _record_id = nlapiGetRecordId(); 
		
		 let todayDate = new Date();
		 
		 let _record_load = nlapiLoadRecord(_record_type,_record_id);
		 
		 let _status = _record_load.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
		 let work_resumption_done = _record_load.getFieldValue('custrecord_hris_lve_workresumptiondone');
		 let empployee_name = _record_load.getFieldValue('custrecord_hris_lve_employeename');
		 
		 let leave_type = _record_load.getFieldValue('custrecord_hris_lve_leavetype');
			
			let customrecord_hris_leaveconfigSearch = nlapiSearchRecord("customrecord_hris_leaveconfig",null,
			[
			   ["internalidnumber","equalto",leave_type]
			], 
			[
			   new nlobjSearchColumn("name").setSort(false), 
			   new nlobjSearchColumn("custrecord_hris_lvecnfg_seqno")
			]
			);
			
			let sequnce_no  = '';
			if(customrecord_hris_leaveconfigSearch)
			{
				 sequnce_no = customrecord_hris_leaveconfigSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lvecnfg_seqno"));
			}
		 
		 let work_resume = _record_load.getFieldValue('custrecord_hris_lve_workresume');
		 
		 if(_status == 2 && work_resumption_done == 'F' && work_resume == 'T' && sequnce_no == '11' )
		 {
			
			nlapiLogExecution('Debug','sequnce_no',sequnce_no);
			 
			
			
			let expected_resume_back_date = _record_load.getFieldValue('custrecord_hris_lve_expectedresumebackdt');
			
			let actual_work_resume_date = _record_load.getFieldValue('custrecord_hris_lve_actualresumedate');
			
			let leave_total_number_of_days = _record_load.getFieldValue('custrecord_hris_lve_totalnodays');
			
			let total_delay_days = _record_load.getFieldValue('custrecord_hris_lve_actualtotdelaydays');
			
			let total_updated_delay_days = _record_load.getFieldValue('custrecord_hris_lve_totalupdateddelayday');
			
			 let leave_from_date = _record_load.getFieldValue('custrecord_hris_lve_fromdate');
			 
			 let paid_leave_end_date = nlapiAddDays(nlapiStringToDate(leave_from_date),45);
			 
			 nlapiLogExecution('Debug','leave_from_date',leave_from_date);
			 nlapiLogExecution('Debug','paid_leave_end_date',paid_leave_end_date);
			 
			 function monthDiff(dateFrom, dateTo) 
			 {
				 return dateTo.getMonth() - dateFrom.getMonth() + 1+
				   (12 * (dateTo.getFullYear() - dateFrom.getFullYear()))
			 }
	
				let total_months_difference = monthDiff(new Date(nlapiStringToDate(leave_from_date)), new Date(paid_leave_end_date));
				
				
			 
			
			
			actual_work_resume_date = nlapiStringToDate(actual_work_resume_date);
			
			expected_resume_back_date = nlapiStringToDate(expected_resume_back_date);
			
			if(!total_delay_days || total_delay_days == '' || total_delay_days == null || total_delay_days == 'null' || total_delay_days == NaN || total_delay_days == 'NaN')
			{
				total_delay_days = 0;
			}
			
			total_delay_days = parseInt(total_delay_days);
			
			total_updated_delay_days = parseInt(total_updated_delay_days);
			
			 let search_pay_grp = search_paygroup(empployee_name);
			nlapiLogExecution('Debug','actual_work_resume_date',actual_work_resume_date);
			nlapiLogExecution('Debug','expected_resume_back_date',expected_resume_back_date);
			nlapiLogExecution('Debug','total_delay_days',total_delay_days);
			nlapiLogExecution('Debug','total_updated_delay_days',total_updated_delay_days);
			nlapiLogExecution('Debug','todayDate',todayDate);
			
			
			let date_day = todayDate.getDate();
					
		//////////////////////////////////////////Getting wage period details /////////////////////////////////////////////////////////////////////////////// 			
					

						let leave_month = actual_work_resume_date.getMonth() + 1;
						let leave_year = actual_work_resume_date.getFullYear();

						nlapiLogExecution('Debug', 'leave_month', leave_month);
						nlapiLogExecution('Debug', 'leave_year', leave_year);

						let leave_year_id = searchYear(leave_year);

						let arrear_month = leave_month;
						let current_month = todayDate.getMonth() + 1
						nlapiLogExecution('Debug', 'current_month', current_month);

						if (todayDate.getDate() > 24 && current_month == leave_month) // date crossed the 24th of the month so and current month and leave month is same so adding next wage period (leave month + 1)
						{
							leave_month = leave_month + 1;

							if (leave_month == 12) {
								leave_year = parseInt(leave_year) + 1;
								leave_year_id = searchYear(leave_year);
							}
						}

						if (current_month != leave_month && todayDate.getDate() < 25) // previous leave record wok resume not done then that time current month and leave month is not same so adding next wage period (leave month + 1)
						{
							leave_month = leave_month + 1;

							if (leave_month == 12) {
								leave_year = parseInt(leave_year) + 1;
								leave_year_id = searchYear(leave_year);
							}
						}
						
						
						nlapiLogExecution('Debug', 'unpaid creation month ', leave_month);
						nlapiLogExecution('Debug', 'unpaid creation year', leave_year);
						nlapiLogExecution('Debug', 'unpaid creation year id', leave_year_id);

						let finalDate = remFormatedDate(leave_year, leave_month, '01')

						let date = nlapiStringToDate(finalDate);

						let lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
					    let end_date = formatedDate(nlapiDateToString(lastDay));
                        nlapiLogExecution('DEBUG', 'formate end_date', end_date);
					
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			
			
			
			
			if(work_resume == 'T')
			{
							if(empployee_name && leave_type && total_delay_days != 0 ) // update the leave balance if total delay days is less than 0 (employee early resumes )
							{
								//total_delay_days = Math.abs(total_delay_days);
								let customrecord_hris_leavebalanceSearch = nlapiSearchRecord("customrecord_hris_leavebalance",null,
								[
								   ["isinactive","is","F"], 
								   "AND", 
								   ["custrecord_hris_lvbal_employee_name","anyof",empployee_name], 
								   "AND", 
								  // ["custrecord_hris_lvbal_leave_type","anyof",1]
								   ["externalidstring","custrecord_hris_lvbal_leave_type","is","1"]
								 
								], 
								[
								   new nlobjSearchColumn("internalid"), 
								   new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"), 
								   new nlobjSearchColumn("custrecord_hris_lvbal_leave_balance_take")
								]
								);
								
								
								
								if(customrecord_hris_leavebalanceSearch)
								{
									 let internal_id = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("internalid")); 
									 
									 let _balace_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id);
									 
									let avl_leave_bal = _balace_record.getFieldValue('custrecord_hris_lvbal_available_leave_ba');
									let leave_bal_taken = _balace_record.getFieldValue('custrecord_hris_lvbal_leave_balance_take');
									 
									if(!avl_leave_bal) 
									{
										avl_leave_bal = 0;
									}
									
									if(!leave_bal_taken) 
									{
										leave_bal_taken = 0;
									}
									
									
									
									leave_bal_taken  = parseFloat(leave_bal_taken) + parseFloat(total_delay_days);

									
									_balace_record.setFieldValue('custrecord_hris_lvbal_leave_balance_take',leave_bal_taken);

									
									let leave_balnce_submit = nlapiSubmitRecord(_balace_record,true,true);	
									nlapiLogExecution('Debug','leave_balnce_submit',leave_balnce_submit);
									
									 
								}

								if(total_delay_days > 0)
								{
									let filter = [];
									let column = [];
									// added by florence to get hris month
									leave_month= gethrisMonth(leave_month);
									filter.push(new nlobjSearchFilter('custrecord_hris_ule_leave_reference_no', null, 'is', _record_id));
									filter.push(new nlobjSearchFilter('custrecord_hris_ule_pay_group', null, 'is', search_pay_grp));
									filter.push(new nlobjSearchFilter('custrecord_hris_ule_month', null, 'is', leave_month));
									filter.push(new nlobjSearchFilter('custrecord_hris_ule_year', null, 'is', leave_year_id));
									filter.push(new nlobjSearchFilter('custrecord_hris_ule_leave_type', null, 'is', 3));

									filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));

									column.push(new nlobjSearchColumn('internalid'))
									let unpLeaveSearch = nlapiSearchRecord('customrecord_hris_unpaid_leave_entry', null, filter, column);

									if (!unpLeaveSearch) {
										nlapiLogExecution('DEBUG', 'Inside !unpLeaveSearch Create part')
										let end_date = formatedDate(nlapiDateToString(lastDay));
										nlapiLogExecution('DEBUG', 'formate end_date', end_date);
										let unpLeavRecord = nlapiCreateRecord('customrecord_hris_unpaid_leave_entry');
										unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_reference_no', _record_id);
										unpLeavRecord.setFieldValue('custrecord_hris_ule_employee_name', empployee_name);
										
										unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_type', 3);
										//unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_type', 30);
										unpLeavRecord.setFieldValue('custrecord_hris_ule_noof_days', total_delay_days);
										unpLeavRecord.setFieldValue('custrecord_hris_ule_pay_group', search_pay_grp);
										unpLeavRecord.setFieldValue('custrecord_hris_ule_reason', 'Work Resumption');
										unpLeavRecord.setFieldValue('custrecord_hris_ule_pay_date', end_date);

										unpLeavRecord.setFieldValue('custrecord_hris_ule_month', leave_month);
										unpLeavRecord.setFieldValue('custrecord_hris_ule_year', leave_year_id);



										unpLeavRecord.setFieldValue('custrecord_hris_ule_final_days', total_delay_days);
										let createdRecordID = nlapiSubmitRecord(unpLeavRecord);
										nlapiLogExecution('DEBUG', 'createdRecordID unpaid', createdRecordID);


									} 
									else 
									{
										let unpaid_id = unpLeaveSearch[0].getId();

										let load_record = nlapiLoadRecord('customrecord_hris_unpaid_leave_entry', unpaid_id);

										let no_of_days = load_record.getFieldValue('custrecord_hris_ule_noof_days');

										no_of_days = parseInt(no_of_days) + total_delay_days;

										load_record.setFieldValue('custrecord_hris_ule_noof_days', no_of_days);
										
										load_record.setFieldValue('custrecord_hris_ule_final_days', no_of_days);

										let update_record = nlapiSubmitRecord(load_record);
										nlapiLogExecution('DEBUG', 'unpaid Update RecordID ', update_record);
									}
								}
									
							}
							
				let global_total_arrears_days = 45;
				nlapiLogExecution('Debug','total_months_difference',total_months_difference);
				
				leave_from_date = nlapiStringToDate(leave_from_date);
				for(let months = 1 ; months<=total_months_difference && global_total_arrears_days > 0 ; months++)
				{
					
					nlapiLogExecution('Debug','In For Loop $$$$$$$$$$$$$$$$$$$$$$');
					nlapiLogExecution('Debug','global_total_arrears_days','global_total_arrears_days-'+global_total_arrears_days);
					nlapiLogExecution('Debug','In For Loop $$$$$$$$$$$$$$$$$$$$$$ leave_from_date',leave_from_date);	
						
					let month_start_date = leave_from_date;
					
					if(months > 1)
					{
						nlapiLogExecution('Debug','In For Loop $$$$$$$$$$$$$$$$$$$$$$ month_start_date',month_start_date);
						month_start_date = nlapiAddMonths(month_start_date,(months-1)); // adding 1 month
						nlapiLogExecution('Debug','In For Loop &&&&&&&&&&&&&&&&&&&&&&&& month_start_date',month_start_date);
						month_start_date = new Date(month_start_date.getFullYear(), month_start_date.getMonth(), 1); // get month start date
					}
					
					nlapiLogExecution('Debug','month_start_date','month_start_date-'+month_start_date);
					let lastDay = new Date(month_start_date.getFullYear(), month_start_date.getMonth() + 1, 0);	// get month last date

					let arrear_month = month_start_date.getMonth()+1; // getting arrear month  
							
					
					nlapiLogExecution('Debug','lastDay','lastDay-'+lastDay);
					nlapiLogExecution('Debug','arrear_month','arrear_month-'+arrear_month);
					
					let oneDay = 24  * 60 * 60 * 1000;

					let daysDiff = Math.round((lastDay.getTime() - month_start_date.getTime()) / (oneDay))+1;
					nlapiLogExecution('Debug','daysDiff','daysDiff-'+daysDiff);
					
					if(daysDiff > global_total_arrears_days)
					{
						daysDiff = global_total_arrears_days
					}
					
					global_total_arrears_days = parseInt(global_total_arrears_days) - parseInt(daysDiff)
					
					//if(date_day < 25 )
					{
						
							if(empployee_name && leave_type)
							{
								
								//if(todayDate > expected_resume_back_date) // create arrears only if today date is greater than expected resume date
									{
										if(daysDiff > 0)// arrears create only greater than 0 days
										{
										// added by florence to get hris month
									leave_month= gethrisMonth(leave_month);
											let arrears_record = nlapiSearchRecord("customrecord_hris_unpaid_arrear_entry",null,
											[
											   ["isinactive","is","F"], 
											   "AND", 
											   ["custrecord_hris_uae_employee_name","anyof",empployee_name], 
											   "AND", 
											   ["custrecord_hris_uae_pay_group","anyof",search_pay_grp],
											   "AND",
											   ["custrecord_hris_uae_month","is",leave_month],
											   "AND",
											   ["custrecord_hris_uae_year","is",leave_year_id],
											   "AND",
											   ["custrecord_hris_uae_arrear_month","is",arrear_month],
											   "AND",
											   ["custrecord_hris_uae_leave_reference_no","is",_record_id]
											], 
											[
											   new nlobjSearchColumn("internalid")
											   
											]
											);
										
										
											if(!arrears_record)
											{										
												nlapiLogExecution('Debug','Arrear creation below 25');
												let create_arrears = nlapiCreateRecord('customrecord_hris_unpaid_arrear_entry');
												
												create_arrears.setFieldValue('custrecord_hris_uae_employee_name',empployee_name);
												
												create_arrears.setFieldValue('custrecord_hris_uae_pay_group',search_pay_grp);
												
												create_arrears.setFieldValue('custrecord_hris_uae_pay_date',end_date);
												
												create_arrears.setFieldValue('custrecord_hris_uae_month',leave_month);
												
												create_arrears.setFieldValue('custrecord_hris_uae_year',leave_year_id);
												
												create_arrears.setFieldValue('custrecord_hris_uae_arrear_days',daysDiff);
												
												create_arrears.setFieldValue('custrecord_hris_uae_arrear_month',arrear_month);
												
												create_arrears.setFieldValue('custrecord_hris_uae_leave_reference_no',_record_id);
												
												create_arrears.setFieldValue('custrecord_hris_uae_remark','Unpaid Arrear entry against work resumption');
												
												create_arrears = nlapiSubmitRecord(create_arrears,true,true);
												nlapiLogExecution('Debug','create_arrears submit',create_arrears);
											}
											else
											{
												let internal_id = arrears_record[0].getId();
												let load_record = nlapiLoadRecord('customrecord_hris_unpaid_arrear_entry',internal_id);
												
												load_record.setFieldValue('custrecord_hris_uae_arrear_days',daysDiff);
												
												let load_arrears_submit = nlapiSubmitRecord(load_record,true,true);
												nlapiLogExecution('Debug','load_arrears_submit',load_arrears_submit);
											}
										
											
										}
										
									}
								
								
								
							}
						
					}
									
					
					
							
				}
				
					
				
				
				_record_load.setFieldValue('custrecord_hris_lve_workresumptiondone','T');
				let leave_apl_submit = nlapiSubmitRecord(_record_load,true,true);
				nlapiLogExecution('Debug','leave_apl_submit-',leave_apl_submit);
				
			}
			 
		 }
		 
		 
	 }
	
//}
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

function search_paygroup(employee_name) {
    let filters = new Array();
    let columns = new Array();

    filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_name));
    filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    columns.push(new nlobjSearchColumn('internalid'));
    columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))

    columns[0].setSort(true);

    let s_result = nlapiSearchRecord('customrecord_hris_employee_compen_change', null, filters, columns)

    if (s_result != null) {
        let s_paygroup = s_result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp')
    } //End of if (s_result != null) 
    return s_paygroup
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
    if (date_format == 'D/M/YYYY') {
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

function checkDateFormat() {
    let context = nlapiGetContext();

    let dateFormatPref = context.getPreference('dateformat');

    return dateFormatPref;
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



function _Is_Valid(value) //
{
    if (value != null && value != '' && value != 'undefined') // 
    {
        return true;
    }
    return false;
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
    if (date_format == 'D/M/YYYY') {
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
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_lve_workresumefuncseq22_ue = (() => {
function LMS_workResume_AfterSubmit(type) 
{
	
	 if (type != 'delete' && type != 'create') 
	 {
		 let _record_type = nlapiGetRecordType();
		 let _record_id = nlapiGetRecordId();
		 
		// let todayDate = new Date();
		 let todayDate = new Date();
		 
		 let _record_load = nlapiLoadRecord(_record_type,_record_id);
		 
		 let _status = _record_load.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
		 let work_resumption_done = _record_load.getFieldValue('custrecord_hris_lve_workresumptiondone');
		 let empployee_name = _record_load.getFieldValue('custrecord_hris_lve_employeename');
		 
		 let leave_type = _record_load.getFieldValue('custrecord_hris_lve_leavetype');
			
			let customrecord_hris_leaveconfigSearch = nlapiSearchRecord("customrecord_hris_leaveconfig",null,
			[
			   ["internalidnumber","equalto",leave_type]
			], 
			[
			   new nlobjSearchColumn("name").setSort(false), 
			   new nlobjSearchColumn("custrecord_hris_lvecnfg_seqno")
			]
			);
			
			let sequnce_no  = '';
			if(customrecord_hris_leaveconfigSearch)
			{
				 sequnce_no = customrecord_hris_leaveconfigSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lvecnfg_seqno"));
			}
		 
		 let work_resume = _record_load.getFieldValue('custrecord_hris_lve_workresume');
		  let cancel_check = _record_load.getFieldValue('custrecord_hris_lve_cancellation');
		  nlapiLogExecution('Debug','work_resumption_done',work_resumption_done);
		 
		 if(work_resume == 'T' && _status == 2 && work_resumption_done == 'F' && cancel_check =='F' && sequnce_no != '11' && sequnce_no != '22' )//&& empployee_name == 466163
		 {
			
			
			
			
			nlapiLogExecution('Debug','sequnce_no',sequnce_no);
			 
			
			
			let expected_resume_back_date = _record_load.getFieldValue('custrecord_hris_lve_expectedresumebackdt');
			
			let actual_work_resume_date = _record_load.getFieldValue('custrecord_hris_lve_actualresumedate');
			
			let leave_total_number_of_days = _record_load.getFieldValue('custrecord_hris_lve_totalnodays');
			
			let total_delay_days = _record_load.getFieldValue('custrecord_hris_lve_actualtotdelaydays');
			
			
			let total_updated_delay_days = _record_load.getFieldValue('custrecord_hris_lve_totalupdateddelayday')||0;
			
			 let leave_from_date = _record_load.getFieldValue('custrecord_hris_lve_fromdate');
			
			
			actual_work_resume_date = nlapiStringToDate(actual_work_resume_date);
			
			expected_resume_back_date = nlapiStringToDate(expected_resume_back_date);
			
			if(!total_delay_days || total_delay_days == '' || total_delay_days == null || total_delay_days == 'null' || total_delay_days == NaN || total_delay_days == 'NaN')
			{
				total_delay_days = 0;
			}
			
			total_delay_days = parseInt(total_delay_days);
			
			total_updated_delay_days = parseInt(total_updated_delay_days);
			
			 let search_pay_grp = search_paygroup(empployee_name);
			nlapiLogExecution('Debug','actual_work_resume_date',actual_work_resume_date);
			nlapiLogExecution('Debug','expected_resume_back_date',expected_resume_back_date);
			nlapiLogExecution('Debug','total_delay_days',total_delay_days);
			nlapiLogExecution('Debug','total_updated_delay_days',total_updated_delay_days);
			nlapiLogExecution('Debug','todayDate',todayDate);
			
			
			let date_day = todayDate.getDate();
			
			let get_wage_date = search_wageperiod(search_pay_grp);
			let w_Date = get_wage_date.toString().split('#');
			nlapiLogExecution('Debug','w_Date',w_Date);
			let end_date = w_Date[0];
			nlapiLogExecution('Debug','end_date',end_date);
			let start_date = w_Date[1];
			nlapiLogExecution('Debug','start_date',start_date);
			let leave_month = w_Date[2];//mth.getMonth() + 1;
			nlapiLogExecution('Debug','leave_month',leave_month);
			let leave_year_id = w_Date[3];//mth.getFullYear();
			nlapiLogExecution('Debug','leave_year_id',leave_year_id);
			//let mth = nlapiStringToDate(actual_work_resume_date).getMonth()+1;
			nlapiLogExecution('Debug','actual_work_resume_date1',actual_work_resume_date);
			let mth = actual_work_resume_date;
			nlapiLogExecution('Debug','mth1',mth);
			mth = mth.getMonth()+1;
			nlapiLogExecution('Debug','mth',mth);
			let arrear_month = mth;
					
	
			
			
			if(work_resume == 'T')
			{
				if((actual_work_resume_date < todayDate || total_delay_days < total_updated_delay_days) && sequnce_no != '2' )
				{
					
					nlapiLogExecution('Debug','Called Sequence not equal to 2 $$$$$$$$$$$$$$$$$$$$$$');
							
							if(empployee_name && leave_type && total_delay_days < 0) // update the leave balance if total delay days is less than 0 (employee early resumes )
							{
								total_delay_days = Math.abs(total_delay_days);
								let customrecord_hris_leavebalanceSearch = nlapiSearchRecord("customrecord_hris_leavebalance",null,
								[
								   ["isinactive","is","F"], 
								   "AND", 
								   ["custrecord_hris_lvbal_employee_name","anyof",empployee_name], 
								   "AND", 
								   ["custrecord_hris_lvbal_leave_type","anyof",leave_type]
								], 
								[
								   new nlobjSearchColumn("internalid"), 
								   new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"), 
								   new nlobjSearchColumn("custrecord_hris_lvbal_leave_balance_take")
								]
								);
								
								
								
								if(customrecord_hris_leavebalanceSearch)
								{
									 let internal_id = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("internalid")); 
									 
									 let _balace_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id);
									 
									let avl_leave_bal = _balace_record.getFieldValue('custrecord_hris_lvbal_available_leave_ba');
									let leave_bal_taken = _balace_record.getFieldValue('custrecord_hris_lvbal_leave_balance_take');
									 
									if(!avl_leave_bal) 
									{
										avl_leave_bal = 0;
									}
									
									if(!leave_bal_taken) 
									{
										leave_bal_taken = 0;
									}
									
									avl_leave_bal = parseFloat(avl_leave_bal) + parseFloat(total_delay_days)
									
									leave_bal_taken  = parseFloat(leave_bal_taken) - parseFloat(total_delay_days);

									if(sequnce_no != '2')// if unpaid not equal to
									{
										_balace_record.setFieldValue('custrecord_hris_lvbal_available_leave_ba',avl_leave_bal);
									}
									
									_balace_record.setFieldValue('custrecord_hris_lvbal_leave_balance_take',leave_bal_taken);

									
									let leave_balnce_submit = nlapiSubmitRecord(_balace_record,true,true);	
									nlapiLogExecution('Debug','leave_balnce_submit',leave_balnce_submit);
									
									 
								}	
							}
							else if(total_delay_days > 0)
							{
								let customrecord_hris_leavebalanceSearch = nlapiSearchRecord("customrecord_hris_leavebalance",null,
								[
								   ["isinactive","is","F"], 
								   "AND", 
								   ["custrecord_hris_lvbal_employee_name","anyof",empployee_name], 
								   "AND", 
								   ["custrecord_hris_lvbal_leave_type.custrecord_hris_lvecnfg_seqno","equalto","2"]
								], 
								[
								   new nlobjSearchColumn("internalid"), 
								   new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"), 
								   new nlobjSearchColumn("custrecord_hris_lvbal_leave_balance_take")
								]
								);
								
								
								
								if(customrecord_hris_leavebalanceSearch)
								{
									 let internal_id = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("internalid")); 
									 
								    let _balace_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id);
									 
									
									let leave_bal_taken = _balace_record.getFieldValue('custrecord_hris_lvbal_leave_balance_take');
									 
									
									
									if(!leave_bal_taken) 
									{
										leave_bal_taken = 0;
									}
									
									
									leave_bal_taken  = (parseFloat(leave_bal_taken) +  parseFloat(total_delay_days)); // it will deduct if negative value and it will add if positive value

									_balace_record.setFieldValue('custrecord_hris_lvbal_leave_balance_take',leave_bal_taken);

									
									let leave_balnce_submit = nlapiSubmitRecord(_balace_record,true,true);	
									nlapiLogExecution('Debug','leave_balnce_submit for sequnce_no 2',leave_balnce_submit);
									
								
								}
							}
					
					
					//if(date_day < 25 )
					{
						
							if(empployee_name && leave_type)
							{
								
								if(todayDate > expected_resume_back_date) // create arrears only if today date is greater than expected resume date
									{
									nlapiLogExecution('Debug','create arrear entry');	
									// calculating the arears days based on the below condition, calculate date is nothing but	
										if(actual_work_resume_date < expected_resume_back_date)
										{
											let calculate_date = expected_resume_back_date
										}
										else
										{
											let calculate_date = actual_work_resume_date
										}
											
										
										let oneDay = 24  * 60 * 60 * 1000;

										let daysDiff = Math.round((todayDate.getTime() - calculate_date.getTime()) / (oneDay));
										
										nlapiLogExecution('Debug','create arrear entry daysDiff',daysDiff);
										if(daysDiff > 0)// arrears create only greater than 0 days
										{
										
											let arrears_record = nlapiSearchRecord("customrecord_hris_unpaid_arrear_entry",null,
											[
											   ["isinactive","is","F"], 
											   "AND", 
											   ["custrecord_hris_uae_employee_name","anyof",empployee_name], 
											   "AND", 
											   ["custrecord_hris_uae_pay_group","anyof",search_pay_grp],
											   "AND",
											   ["custrecord_hris_uae_month","is",leave_month],
											   "AND",
											   ["custrecord_hris_uae_year","is",leave_year_id],
											   "AND",
											   ["custrecord_hris_uae_leave_reference_no","is",_record_id]
											], 
											[
											   new nlobjSearchColumn("internalid")
											   
											]
											);
										
										
											if(!arrears_record)
											{										
												nlapiLogExecution('Debug','Arrear creation below 25');
												let create_arrears = nlapiCreateRecord('customrecord_hris_unpaid_arrear_entry');
												
												create_arrears.setFieldValue('custrecord_hris_uae_employee_name',empployee_name);
												
												create_arrears.setFieldValue('custrecord_hris_uae_pay_group',search_pay_grp);
												
												create_arrears.setFieldValue('custrecord_hris_uae_pay_date',end_date);
												
												create_arrears.setFieldValue('custrecord_hris_uae_month',leave_month);
												
												create_arrears.setFieldValue('custrecord_hris_uae_year',leave_year_id);
												
												create_arrears.setFieldValue('custrecord_hris_uae_arrear_days',daysDiff);
												
												create_arrears.setFieldValue('custrecord_hris_uae_arrear_month',arrear_month);
												
												create_arrears.setFieldValue('custrecord_hris_uae_leave_reference_no',_record_id);
												
												create_arrears.setFieldValue('custrecord_hris_uae_remark','Unpaid Arrear entry against work resumption');
												
												create_arrears = nlapiSubmitRecord(create_arrears,true,true);
												nlapiLogExecution('Debug','create_arrears submit',create_arrears);
											}
											else
											{
												let internal_id = arrears_record[0].getId();
												let load_record = nlapiLoadRecord('customrecord_hris_unpaid_arrear_entry',internal_id);
												
												load_record.setFieldValue('custrecord_hris_uae_arrear_days',daysDiff);
												
												let load_arrears_submit = nlapiSubmitRecord(load_record,true,true);
												nlapiLogExecution('Debug','load_arrears_submit',load_arrears_submit);
											}
										
											
										}
										
									}
								
								
								
							}
						
					}
									
					
					
							
				}
				
				if(sequnce_no == '2')
				{
					nlapiLogExecution('Debug','Called Sequence equal to 2 ***********************');
					
						if(empployee_name && leave_type ) // update the leave balance if total delay days is 
							{
								//total_delay_days = Math.abs(total_delay_days);
								let customrecord_hris_leavebalanceSearch = nlapiSearchRecord("customrecord_hris_leavebalance",null,
								[
								   ["isinactive","is","F"], 
								   "AND", 
								   ["custrecord_hris_lvbal_employee_name","anyof",empployee_name], 
								   "AND", 
								   ["custrecord_hris_lvbal_leave_type","anyof",leave_type]
								], 
								[
								   new nlobjSearchColumn("internalid"), 
								   new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"), 
								   new nlobjSearchColumn("custrecord_hris_lvbal_leave_balance_take")
								]
								);
								
								
								
								if(customrecord_hris_leavebalanceSearch)
								{
									 let internal_id = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("internalid")); 
									 
									 let _balace_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id);
									 
									
									let leave_bal_taken = _balace_record.getFieldValue('custrecord_hris_lvbal_leave_balance_take');
									 
									
									
									if(!leave_bal_taken) 
									{
										leave_bal_taken = 0;
									}
									
									
									leave_bal_taken  = (parseFloat(leave_bal_taken) +  parseFloat(total_delay_days)); // it will deduct if negative value and it will add if positive value

									_balace_record.setFieldValue('custrecord_hris_lvbal_leave_balance_take',leave_bal_taken);

									
									let leave_balnce_submit = nlapiSubmitRecord(_balace_record,true,true);	
									nlapiLogExecution('Debug','leave_balnce_submit for sequnce_no 2',leave_balnce_submit);
									
									
									
										let oneDay = 24  * 60 * 60 * 1000;

										let daysDiff = Math.round((actual_work_resume_date.getTime() - todayDate.getTime()) / (oneDay));
										
										
										if(daysDiff > 0)// arrears create only greater than 0 days
										{
										
											let arrears_record = nlapiSearchRecord("customrecord_hris_unpaid_arrear_entry",null,
											[
											   ["isinactive","is","F"], 
											   "AND", 
											   ["custrecord_hris_uae_employee_name","anyof",empployee_name], 
											   "AND", 
											   ["custrecord_hris_uae_pay_group","anyof",search_pay_grp],
											   "AND",
											   ["custrecord_hris_uae_month","is",leave_month],
											   "AND",
											   ["custrecord_hris_uae_year","is",leave_year_id],
											   "AND",
											   ["custrecord_hris_uae_leave_reference_no","is",_record_id]
											], 
											[
											   new nlobjSearchColumn("internalid")
											   
											]
											);
										
										
											if(!arrears_record)
											{										
												nlapiLogExecution('Debug','Arrear creation for sequnce_no 2');
												let create_arrears = nlapiCreateRecord('customrecord_hris_unpaid_arrear_entry');
												
												create_arrears.setFieldValue('custrecord_hris_uae_employee_name',empployee_name);
												
												create_arrears.setFieldValue('custrecord_hris_uae_pay_group',search_pay_grp);
												
												create_arrears.setFieldValue('custrecord_hris_uae_pay_date',end_date);
												
												create_arrears.setFieldValue('custrecord_hris_uae_month',leave_month);
												
												create_arrears.setFieldValue('custrecord_hris_uae_year',leave_year_id);
												
												create_arrears.setFieldValue('custrecord_hris_uae_arrear_days',daysDiff);
												
												create_arrears.setFieldValue('custrecord_hris_uae_arrear_month',arrear_month);
												
												create_arrears.setFieldValue('custrecord_hris_uae_leave_reference_no',_record_id);
												
												create_arrears.setFieldValue('custrecord_hris_uae_remark','Unpaid Arrear entry against work resumption');
												
												create_arrears = nlapiSubmitRecord(create_arrears,true,true);
												nlapiLogExecution('Debug','create_arrears submit',create_arrears);
											}
											else
											{
												let internal_id = arrears_record[0].getId();
												let load_record = nlapiLoadRecord('customrecord_hris_unpaid_arrear_entry',internal_id);
												
												load_record.setFieldValue('custrecord_hris_uae_arrear_days',daysDiff);
												
												let load_arrears_submit = nlapiSubmitRecord(load_record,true,true);
												nlapiLogExecution('Debug','load_arrears_submit for sequnce_no 2',load_arrears_submit);
											}
										
											
										}
										
									
									
									
									
									
									
									 
								}	
							}
					
				}	
				
				
				_record_load.setFieldValue('custrecord_hris_lve_workresumptiondone','T');
				let leave_apl_submit = nlapiSubmitRecord(_record_load,true,true);
				nlapiLogExecution('Debug','leave_apl_submit-',leave_apl_submit);
				
			}
			 
		 }
		 
		 
	 }
	
}


function search_paygroup(employee_name) {
    let filters = new Array();
    let columns = new Array();

    filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_name));
    filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    columns.push(new nlobjSearchColumn('internalid'));
    columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))

    columns[0].setSort(true);

    let s_result = nlapiSearchRecord('customrecord_hris_employee_compen_change', null, filters, columns)

    if (s_result != null) {
        let s_paygroup = s_result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp')
    } //End of if (s_result != null) 
    return s_paygroup
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
    if (date_format == 'D/M/YYYY') {
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

function checkDateFormat() {
    let context = nlapiGetContext();

    let dateFormatPref = context.getPreference('dateformat');

    return dateFormatPref;
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



function _Is_Valid(value) //
{
    if (value != null && value != '' && value != 'undefined') // 
    {
        return true;
    }
    return false;
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
    if (date_format == 'D/M/YYYY') {
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

function search_wageperiod(pay_group)
{	
	let Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_group', null,'is',pay_group));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	let Column= new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_end_date'));
	Column.push(new nlobjSearchColumn('custrecord_hris_start_date'));
	Column.push(new nlobjSearchColumn('custrecord_hris_month'));
	Column.push(new nlobjSearchColumn('custrecord_hris_year'));
	Column.push(Column[0].setSort(true));
	
	let searchResult =nlapiSearchRecord('customrecord_hris_wage_period_details',null,Filters,Column);
		
	if(searchResult !=null)
	{
		let WagePeriod_EndDate = searchResult[0].getValue('custrecord_hris_end_date')
		
		let start_date = searchResult[0].getValue('custrecord_hris_start_date');
		
		let month = searchResult[0].getValue('custrecord_hris_month')
		
		let year = searchResult[0].getValue('custrecord_hris_year')
		
	}//End of if(searchResult !=null)
	return WagePeriod_EndDate+"#"+ start_date +"#"+month+"#"+year;
}//End of function search_wageperiod(pay_group)

function searchYear(year)
{
	
	nlapiLogExecution('DEBUG', 'after submit record', 'searchYear year : '+year);	
	let yearId; 
	let filters = new Array();
    let columns = new Array();
    filters.push(new nlobjSearchFilter('name', null, 'contains', year))
	columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('name'));
	let result = nlapiSearchRecord('customlist_hris_year_master', null, filters, columns)
	if (result != null) 
	{
	 	yearId = result[0].getValue('internalid');	
		nlapiLogExecution('DEBUG', 'after submit record', 'searchYear yearIdyearId : '+yearId);			
	}
	return yearId;
}
//Function to search employee's wage period end date
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_hris_secrecordcheck_ue = (() => {
function beforeLoadRecord(type)
{
return true;
}
function beforeSubmitRecord_SecCheck(type){

	if (type == 'create') 
	{
	
		let emp_name = nlapiGetFieldValue('custrecord_hris_lve_employeename');
		let error = 'This record is already Present for the applied date'
		let frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate');
		let to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate');
		
		 
		 let searchdate = nlapiSearchRecord("customrecord_hris_leaveapplication",null,
                          					  
						  [
                             ["custrecord_hris_lve_employeename","anyof", emp_name], 
                            
							"AND", 
                           [[
						     ["custrecord_hris_lve_fromdate","onorafter", frm_date_val],
							   
							   "AND",
							 ["custrecord_hris_lve_todate","onorbefore", to_date_val]],
							 
							  "OR",
                             [
                             [
                              ["custrecord_hris_lve_fromdate","within",frm_date_val,to_date_val]
                             ],
							 
                              "OR",
                             [
                                ["custrecord_hris_lve_todate","within",frm_date_val,to_date_val]
                             ]
                             
							 ]]
                           
						   ], 
						  
                          [
                             new nlobjSearchColumn("internalid"), 
                             new nlobjSearchColumn("custrecord_hris_lve_cancellation"), 
                             new nlobjSearchColumn("custrecord_hris_lve_hrmsapprovalstatus"), 
                             new nlobjSearchColumn("custrecord_hris_lve_cancel_leavestatus")
                          ]
                          );
		 if (searchdate != null)
		 {
			 for(let i= '0'; i < searchdate.length; i++)
			 {
				 nlapiLogExecution('DEBUG', 'searchdate', 'searchdate ***********=' + searchdate.length);
				 let cancelStatus  = searchdate[i].getValue('custrecord_hris_lve_cancel_leavestatus');
				 let approveStatus = searchdate[i].getValue('custrecord_hris_lve_hrmsapprovalstatus');
				 let cancelChkBox  = searchdate[i].getValue('custrecord_hris_lve_cancellation');
				 nlapiLogExecution('DEBUG', 'aa cancelStatus', cancelStatus)
				 if(cancelStatus == '3' || (approveStatus == '1' && cancelChkBox == 'F') || (cancelStatus == '3' && cancelChkBox == 'T'))
				 {
					 nlapiLogExecution('DEBUG', 'Inside  1 Leave Id', searchdate[i].getValue('internalid'))
					 throw error;
				 }
				 if((approveStatus == '2' && cancelChkBox == 'T' && cancelStatus == '2') || approveStatus == '3')
				 {
					 nlapiLogExecution('DEBUG', 'Inside  2 Leave Id', searchdate[i].getValue('internalid'))
				 }
				 else
				 {
					 nlapiLogExecution('DEBUG', 'Inside  3 Leave Id', searchdate[i].getValue('internalid'))
					 throw error;
				 }
			 }
		 
		 

		 }
	}
}
function GetCurrentDate()
{
	let today = new Date();
	let dd = today.getDate();
	let mm = today.getMonth() + 1;
	let yy = today.getFullYear();
	return mm+"/"+ dd+"/"+yy;
	
}
{
}
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();
    const UE_leave_application_resumedate_update_in_employee_ue = (() => {
let QUERY;
define(['N/record', 'N/ui/serverWidget', 'N/search','N/query'], function (record, serverWidget, search,query) {
  QUERY = query;
    function afterSubmit(context) {
        try {
            let newRecord = context.newRecord;

            // Get the value of 'custrecord_hris_lve_workresume'
            let workResume = newRecord.getValue('custrecord_hris_lve_workresume');

            if (workResume) {
                // Fetch 'custrecord_hris_lve_actualresumedate' and 'custrecord_hris_lve_employeename'
                let actualResumeDate = newRecord.getValue('custrecord_hris_lve_actualresumedate');
                let employeeId = newRecord.getValue('custrecord_hris_lve_employeename');

                if (actualResumeDate && employeeId) {
                    let employeeRecord = record.load({
                        type: record.Type.EMPLOYEE,
                        id: employeeId,
                        isDynamic: true
                    });

                    // Set the rejoin date
                    employeeRecord.setValue({
                        fieldId: 'custentity_hris_rejoin_date',
                        value: actualResumeDate
                    });
                    employeeRecord.setValue({
                        fieldId: 'custentity_hris_empemploymentstatus',
                        value: 1,
                        ignoreFieldChange: true
                      });
                    // Save the record ignoring mandatory fields
                    employeeRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    
                    log.debug({
                        title: 'Employee Record Updated',
                        details: 'Employee ID: ' + employeeId + ', Rejoin Date: ' + actualResumeDate
                    });
                    let empcompensql ="select * from customrecord_hris_employee_compen_change \
                    where custrecord_hris_empchange_employee_nam ="+employeeId+" and isinactive ='F'"  
      
                    log.debug('empcompensql', empcompensql);
                 
                    let empcompensqlrecords = getResult(empcompensql);
                   
                    if (empcompensqlrecords.length > 0) {
                      let compenid = empcompensqlrecords[0].id;
                      let EmployeecompenID = record.submitFields({
                        type: 'customrecord_hris_employee_compen_change',
                        id: compenid,
                        values: {
                          'custrecord_hris_empchange_emp_active_sts': 1
                        }
                      });
      
                    }  
                    log.debug("Info", "EmployeeCompensationStatus also Updated. Internal ID : " + EmployeecompenID);
                } else {
                    log.error({
                        title: 'Missing Data',
                        details: 'Actual Resume Date or Employee ID is missing.'
                    });
                }
            }
        } catch (error) {
            log.error({
                title: 'Error in After Submit',
                details: error.message
            });
        }
    }
    function getResult(pSQL) {
        // log.debug("QUERY", pSQL);
        let queryResults = QUERY.runSuiteQL({
            query: pSQL
        });
        let records = queryResults.asMappedResults();
        return records;
    }

    return {
        afterSubmit: afterSubmit
    };
});
        return typeof beforeSubmit !== 'undefined' || typeof beforeLoad !== 'undefined' || typeof afterSubmit !== 'undefined' ? 
            { beforeLoad: typeof beforeLoad !== 'undefined' ? beforeLoad : null,
              beforeSubmit: typeof beforeSubmit !== 'undefined' ? beforeSubmit : null,
              afterSubmit: typeof afterSubmit !== 'undefined' ? afterSubmit : null } : 
            (typeof returnObj !== 'undefined' ? returnObj : {});
    })();


        const beforeLoad = (scriptContext) => {
            try { if (UE_hris_emergencyleavedeductionannual_ue.beforeLoad) UE_hris_emergencyleavedeductionannual_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_emergencyleavedeductionannual_ue.beforeLoad', e); }
            try { if (UE_hris_encashmentvalidation_ue.beforeLoad) UE_hris_encashmentvalidation_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_encashmentvalidation_ue.beforeLoad', e); }
            try { if (UE_hris_generatereferencenumber_us.beforeLoad) UE_hris_generatereferencenumber_us.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_generatereferencenumber_us.beforeLoad', e); }
            try { if (UE_hris_la_delete_record_ues.beforeLoad) UE_hris_la_delete_record_ues.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_la_delete_record_ues.beforeLoad', e); }
            try { if (UE_hris_leave_cancelbutton_ue.beforeLoad) UE_hris_leave_cancelbutton_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_leave_cancelbutton_ue.beforeLoad', e); }
            try { if (UE_hris_leaveapplicationrecord_ue.beforeLoad) UE_hris_leaveapplicationrecord_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_leaveapplicationrecord_ue.beforeLoad', e); }
            try { if (UE_hris_leaveapplicationvalidation_ue.beforeLoad) UE_hris_leaveapplicationvalidation_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_leaveapplicationvalidation_ue.beforeLoad', e); }
            try { if (UE_hris_leavebalanceapply_ue.beforeLoad) UE_hris_leavebalanceapply_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_leavebalanceapply_ue.beforeLoad', e); }
            try { if (UE_hris_leavebalancedebitchange_ue.beforeLoad) UE_hris_leavebalancedebitchange_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_leavebalancedebitchange_ue.beforeLoad', e); }
            try { if (UE_hris_leavebalanceupdation_ue.beforeLoad) UE_hris_leavebalanceupdation_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_leavebalanceupdation_ue.beforeLoad', e); }
            try { if (UE_hris_lve_encashmentcreatemsi_ue.beforeLoad) UE_hris_lve_encashmentcreatemsi_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_encashmentcreatemsi_ue.beforeLoad', e); }
            try { if (UE_hris_lve_encashrotationalcreatemsi_ue.beforeLoad) UE_hris_lve_encashrotationalcreatemsi_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_encashrotationalcreatemsi_ue.beforeLoad', e); }
            try { if (UE_hris_lve_lmsworkflow_ue.beforeLoad) UE_hris_lve_lmsworkflow_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_lmsworkflow_ue.beforeLoad', e); }
            try { if (UE_hris_lve_monthly_salary_entry_ue.beforeLoad) UE_hris_lve_monthly_salary_entry_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_monthly_salary_entry_ue.beforeLoad', e); }
            try { if (UE_hris_lve_pullbackbutton_ue.beforeLoad) UE_hris_lve_pullbackbutton_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_pullbackbutton_ue.beforeLoad', e); }
            try { if (UE_hris_lve_pullbackleave_ue.beforeLoad) UE_hris_lve_pullbackleave_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_pullbackleave_ue.beforeLoad', e); }
            try { if (UE_hris_lve_rotationalcreatemsi_ue.beforeLoad) UE_hris_lve_rotationalcreatemsi_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_rotationalcreatemsi_ue.beforeLoad', e); }
            try { if (UE_hris_lve_workmaternityfunc_ue.beforeLoad) UE_hris_lve_workmaternityfunc_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_workmaternityfunc_ue.beforeLoad', e); }
            try { if (UE_hris_lve_workresumefuncseq22_ue.beforeLoad) UE_hris_lve_workresumefuncseq22_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_workresumefuncseq22_ue.beforeLoad', e); }
            try { if (UE_hris_secrecordcheck_ue.beforeLoad) UE_hris_secrecordcheck_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_hris_secrecordcheck_ue.beforeLoad', e); }
            try { if (UE_leave_application_resumedate_update_in_employee_ue.beforeLoad) UE_leave_application_resumedate_update_in_employee_ue.beforeLoad(scriptContext); } catch(e) { log.error('Error in UE_leave_application_resumedate_update_in_employee_ue.beforeLoad', e); }

        };

        const beforeSubmit = (scriptContext) => {
            try { if (UE_hris_emergencyleavedeductionannual_ue.beforeSubmit) UE_hris_emergencyleavedeductionannual_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_emergencyleavedeductionannual_ue.beforeSubmit', e); }
            try { if (UE_hris_encashmentvalidation_ue.beforeSubmit) UE_hris_encashmentvalidation_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_encashmentvalidation_ue.beforeSubmit', e); }
            try { if (UE_hris_generatereferencenumber_us.beforeSubmit) UE_hris_generatereferencenumber_us.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_generatereferencenumber_us.beforeSubmit', e); }
            try { if (UE_hris_la_delete_record_ues.beforeSubmit) UE_hris_la_delete_record_ues.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_la_delete_record_ues.beforeSubmit', e); }
            try { if (UE_hris_leave_cancelbutton_ue.beforeSubmit) UE_hris_leave_cancelbutton_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_leave_cancelbutton_ue.beforeSubmit', e); }
            try { if (UE_hris_leaveapplicationrecord_ue.beforeSubmit) UE_hris_leaveapplicationrecord_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_leaveapplicationrecord_ue.beforeSubmit', e); }
            try { if (UE_hris_leaveapplicationvalidation_ue.beforeSubmit) UE_hris_leaveapplicationvalidation_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_leaveapplicationvalidation_ue.beforeSubmit', e); }
            try { if (UE_hris_leavebalanceapply_ue.beforeSubmit) UE_hris_leavebalanceapply_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_leavebalanceapply_ue.beforeSubmit', e); }
            try { if (UE_hris_leavebalancedebitchange_ue.beforeSubmit) UE_hris_leavebalancedebitchange_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_leavebalancedebitchange_ue.beforeSubmit', e); }
            try { if (UE_hris_leavebalanceupdation_ue.beforeSubmit) UE_hris_leavebalanceupdation_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_leavebalanceupdation_ue.beforeSubmit', e); }
            try { if (UE_hris_lve_encashmentcreatemsi_ue.beforeSubmit) UE_hris_lve_encashmentcreatemsi_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_encashmentcreatemsi_ue.beforeSubmit', e); }
            try { if (UE_hris_lve_encashrotationalcreatemsi_ue.beforeSubmit) UE_hris_lve_encashrotationalcreatemsi_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_encashrotationalcreatemsi_ue.beforeSubmit', e); }
            try { if (UE_hris_lve_lmsworkflow_ue.beforeSubmit) UE_hris_lve_lmsworkflow_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_lmsworkflow_ue.beforeSubmit', e); }
            try { if (UE_hris_lve_monthly_salary_entry_ue.beforeSubmit) UE_hris_lve_monthly_salary_entry_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_monthly_salary_entry_ue.beforeSubmit', e); }
            try { if (UE_hris_lve_pullbackbutton_ue.beforeSubmit) UE_hris_lve_pullbackbutton_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_pullbackbutton_ue.beforeSubmit', e); }
            try { if (UE_hris_lve_pullbackleave_ue.beforeSubmit) UE_hris_lve_pullbackleave_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_pullbackleave_ue.beforeSubmit', e); }
            try { if (UE_hris_lve_rotationalcreatemsi_ue.beforeSubmit) UE_hris_lve_rotationalcreatemsi_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_rotationalcreatemsi_ue.beforeSubmit', e); }
            try { if (UE_hris_lve_workmaternityfunc_ue.beforeSubmit) UE_hris_lve_workmaternityfunc_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_workmaternityfunc_ue.beforeSubmit', e); }
            try { if (UE_hris_lve_workresumefuncseq22_ue.beforeSubmit) UE_hris_lve_workresumefuncseq22_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_workresumefuncseq22_ue.beforeSubmit', e); }
            try { if (UE_hris_secrecordcheck_ue.beforeSubmit) UE_hris_secrecordcheck_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_secrecordcheck_ue.beforeSubmit', e); }
            try { if (UE_leave_application_resumedate_update_in_employee_ue.beforeSubmit) UE_leave_application_resumedate_update_in_employee_ue.beforeSubmit(scriptContext); } catch(e) { log.error('Error in UE_leave_application_resumedate_update_in_employee_ue.beforeSubmit', e); }

        };

        const afterSubmit = (scriptContext) => {
            try { if (UE_hris_emergencyleavedeductionannual_ue.afterSubmit) UE_hris_emergencyleavedeductionannual_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_emergencyleavedeductionannual_ue.afterSubmit', e); }
            try { if (UE_hris_encashmentvalidation_ue.afterSubmit) UE_hris_encashmentvalidation_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_encashmentvalidation_ue.afterSubmit', e); }
            try { if (UE_hris_generatereferencenumber_us.afterSubmit) UE_hris_generatereferencenumber_us.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_generatereferencenumber_us.afterSubmit', e); }
            try { if (UE_hris_la_delete_record_ues.afterSubmit) UE_hris_la_delete_record_ues.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_la_delete_record_ues.afterSubmit', e); }
            try { if (UE_hris_leave_cancelbutton_ue.afterSubmit) UE_hris_leave_cancelbutton_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_leave_cancelbutton_ue.afterSubmit', e); }
            try { if (UE_hris_leaveapplicationrecord_ue.afterSubmit) UE_hris_leaveapplicationrecord_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_leaveapplicationrecord_ue.afterSubmit', e); }
            try { if (UE_hris_leaveapplicationvalidation_ue.afterSubmit) UE_hris_leaveapplicationvalidation_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_leaveapplicationvalidation_ue.afterSubmit', e); }
            try { if (UE_hris_leavebalanceapply_ue.afterSubmit) UE_hris_leavebalanceapply_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_leavebalanceapply_ue.afterSubmit', e); }
            try { if (UE_hris_leavebalancedebitchange_ue.afterSubmit) UE_hris_leavebalancedebitchange_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_leavebalancedebitchange_ue.afterSubmit', e); }
            try { if (UE_hris_leavebalanceupdation_ue.afterSubmit) UE_hris_leavebalanceupdation_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_leavebalanceupdation_ue.afterSubmit', e); }
            try { if (UE_hris_lve_encashmentcreatemsi_ue.afterSubmit) UE_hris_lve_encashmentcreatemsi_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_encashmentcreatemsi_ue.afterSubmit', e); }
            try { if (UE_hris_lve_encashrotationalcreatemsi_ue.afterSubmit) UE_hris_lve_encashrotationalcreatemsi_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_encashrotationalcreatemsi_ue.afterSubmit', e); }
            try { if (UE_hris_lve_lmsworkflow_ue.afterSubmit) UE_hris_lve_lmsworkflow_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_lmsworkflow_ue.afterSubmit', e); }
            try { if (UE_hris_lve_monthly_salary_entry_ue.afterSubmit) UE_hris_lve_monthly_salary_entry_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_monthly_salary_entry_ue.afterSubmit', e); }
            try { if (UE_hris_lve_pullbackbutton_ue.afterSubmit) UE_hris_lve_pullbackbutton_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_pullbackbutton_ue.afterSubmit', e); }
            try { if (UE_hris_lve_pullbackleave_ue.afterSubmit) UE_hris_lve_pullbackleave_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_pullbackleave_ue.afterSubmit', e); }
            try { if (UE_hris_lve_rotationalcreatemsi_ue.afterSubmit) UE_hris_lve_rotationalcreatemsi_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_rotationalcreatemsi_ue.afterSubmit', e); }
            try { if (UE_hris_lve_workmaternityfunc_ue.afterSubmit) UE_hris_lve_workmaternityfunc_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_workmaternityfunc_ue.afterSubmit', e); }
            try { if (UE_hris_lve_workresumefuncseq22_ue.afterSubmit) UE_hris_lve_workresumefuncseq22_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_lve_workresumefuncseq22_ue.afterSubmit', e); }
            try { if (UE_hris_secrecordcheck_ue.afterSubmit) UE_hris_secrecordcheck_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_hris_secrecordcheck_ue.afterSubmit', e); }
            try { if (UE_leave_application_resumedate_update_in_employee_ue.afterSubmit) UE_leave_application_resumedate_update_in_employee_ue.afterSubmit(scriptContext); } catch(e) { log.error('Error in UE_leave_application_resumedate_update_in_employee_ue.afterSubmit', e); }

        };

        return {
            beforeLoad,
            beforeSubmit,
            afterSubmit
        };
    });
