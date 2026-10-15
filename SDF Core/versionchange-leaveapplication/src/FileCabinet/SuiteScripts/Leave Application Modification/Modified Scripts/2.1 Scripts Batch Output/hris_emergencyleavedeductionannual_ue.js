/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/search', 'N/query', 'N/format', 'N/record', 'N/currentRecord', 'N/url', './moment.js', 'N/runtime'],
    (search, query, format, record, currentRecord, url, moment, runtime) => {


    const beforeSubmit = (context) => {
        if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.DELETE) {
            const flag = 0;

            log.debug('##################:', '******************');

            const rec_id = context.newRecord.id;
            log.debug('rec_id :', ' rec_id' + rec_id);

            if (_logValidation(rec_id)) {

                const leave_record = record.load({
                    type: 'customrecord_hris_leaveapplication',
                    id: rec_id
                });
                log.debug('leave_record :', 'leave_record' + leave_record);

                const leave_type = leave_record.getValue('custrecord_hris_lve_leavetype');
                log.debug('leave_type :', 'leave_type' + leave_type);
                const seq_no = get_sequence_no(leave_type,query);

                const hireDate = leave_record.getValue('custrecord_hris_lve_hiredate');
                let employee = leave_record.getValue('custrecord_hris_lve_employeename');
                log.debug('employee', 'employee =' + employee);

                const leave_status = leave_record.getValue('custrecord_hris_lve_hrmsapprovalstatus');
                log.debug('leave_status :', 'leave_status' + leave_status);

                const leaveCANCEL_status = leave_record.getValue('custrecord_hris_lve_cancel_leavestatus');
                log.debug('leaveCANCEL_status :', 'leaveCANCEL_status' + leaveCANCEL_status);

                const cancelCHECk = leave_record.getValue('custrecord_hris_lve_cancellation');
                log.debug('cancelCHECk :', 'cancelCHECk' + cancelCHECk);

                let tot_no_days = leave_record.getValue('custrecord_hris_lve_totalnodays') || 0;
                log.debug('tot_no_days', 'tot_no_days =' + tot_no_days);

                const curDate = new Date();
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
                    const empQueryrecords = queryResults.asMappedResults();
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

    const leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + leave_type + "' and isinactive ='F'"
    log.debug("leavesequencesql", leavesequencesql);
    const queryResult = query.runSuiteQL({
        query: leavesequencesql,
    });
    const leavesequencesqlrecords = queryResult.asMappedResults();


    log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
    if (leavesequencesqlrecords.length > 0) {


        const sequence_no = leavesequencesqlrecords[0].custrecord_hris_lvecnfg_seqno;
    }
    return sequence_no;
}
