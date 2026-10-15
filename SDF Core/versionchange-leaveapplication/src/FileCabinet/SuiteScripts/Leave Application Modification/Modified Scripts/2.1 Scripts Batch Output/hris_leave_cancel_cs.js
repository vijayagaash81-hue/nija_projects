/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
 define(['N/search', 'N/query', 'N/format', 'N/record', 'N/currentRecord', 'N/url'],
    (search, query, format, record, currentRecord, url) => {


        const pageInit = (scriptContext) => {
            //debugger;
            try {

                let leaverecord = scriptContext.currentRecord;
              // 1. Load the specific record instance
 /*    const compChangeRecord = record.load({
        type: 'customrecord_hris_employee_compen_change',
        id: 1// Replace with your actual dynamic ID variable
    });

    // 2. Get the field value and store it in a variable
    const annualGrossSalary = compChangeRecord.getValue({
        fieldId: 'custrecord_hris_empchange_an_gross_salar'
    })||0;
              alert('The Annual Gross Salary is: ' + annualGrossSalary); */

                let flag = getUrlParameter('flag');
                log.debug('Flag Check', flag);
                if (flag == 1) {
                    leaverecord.setValue({
                        fieldId: 'custrecord_hris_lve_cancellation',
                        value: true,
                        ignoreFieldChange: false,
                        forceSyncSourcing: true
                    });

                    // hide upto approval ok florence
                    /*  leaverecord.setValue({
                         fieldId:'custrecord_hris_lveapp_approvalstatus',
                         value: 2,
                         ignoreFieldChange: true,
                         forceSyncSourcing: true
                     }); */
                    leaverecord.setValue("custrecord_hris_lveappapprovallevel", '', true, true);
                    leaverecord.setValue("custrecord_hris_lveapp_approvalusrtype", '', true, true);
                    leaverecord.setValue("custrecord_hris_lveapp_role", '', true, true);
                    leaverecord.setValue("custrecord_hris_lveapp_appruser", '', true, true);
                }

            }
            catch (e) {
                console.log("error in pageinit : " + e);

            }

        }
        const fieldChanged = (scriptContext) => {
            //debugger;
            try {

                let leaverecord = scriptContext.currentRecord;
                if (scriptContext.fieldId == 'custrecord_hris_lve_fromdate' || scriptContext.fieldId == 'custrecord_hris_lve_todate' || scriptContext.fieldId == 'custrecord_hris_lve_leavereason') {
                    let fromdate = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_fromdate'
                    }) || '';
                    log.debug('fromdate', fromdate);
                    const todate = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_todate'
                    }) || '';
                    log.debug('todate', todate);
                    let fromdateno = fromdate.getMonth() + 1
                    /*  fromdate = format.parse({
                         value: fromdate,
                         type: format.Type.DATE
                     });                
                     // Extract the month number from the parsed date
                     let fromdateno = format.format({
                         value: fromdate,
                         type: format.Type.MONTH
                     });
                  */


                    log.debug('Month Number', fromdateno);
                    const fromdateyear = fromdate.getFullYear();
                    log.debug("Month year", fromdateyear);
                    let totaldays = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_totalnodays'
                    }) || 0;
                    log.debug('totaldays', totaldays);
                    const leavetype = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_leavetype'
                    }) || '';
                    log.debug('Leave Type', leavetype);

                    const empname = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_employeename'
                    }) || '';
                    log.debug('Employee Name', empname);
                    const Leave_type_seqno = get_sequence_no(leavetype);
                    // for sick leave
                    if (Leave_type_seqno == 7) {
                     /*   let sicksql = "SELECT NVL(SUM(a.custrecord_hris_lve_totalnodays), 0) AS totdays, EXTRACT(MONTH FROM a.custrecord_hris_lve_fromdate) AS leave_month,\
                    EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate) as  leave_year FROM customrecord_hris_leaveapplication a JOIN customrecord_hris_leaveconfig b ON a.custrecord_hris_lve_leavetype = b.id join \
                    customrecord_hris_emp_leave_type_master c on b.custrecord_hris_lveconfig_leavename = c.id\
                    WHERE c.id = 9 AND a.custrecord_hris_lve_employeename = "+ empname + " and EXTRACT(MONTH FROM a.custrecord_hris_lve_fromdate) =" + fromdateno + " and EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate)=" + fromdateyear + "\
                    and a.custrecord_hris_lve_hrmsapprovalstatus =2 and custrecord_hris_lve_cancellation='F' GROUP BY EXTRACT(MONTH FROM a.custrecord_hris_lve_fromdate), EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate)"
                     */ 
                    
                    let sicksql = "SELECT NVL(SUM(a.custrecord_hris_lve_totalnodays), 0) AS totdays, EXTRACT(MONTH FROM a.custrecord_hris_lve_fromdate) AS leave_month,\
                    EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate) as  leave_year FROM customrecord_hris_leaveapplication a JOIN customrecord_hris_leaveconfig b ON a.custrecord_hris_lve_leavetype = b.id  \
                   WHERE a.custrecord_hris_lve_employeename = "+ empname + " and a.custrecord_hris_lve_leavetype="+leavetype+" and EXTRACT(MONTH FROM a.custrecord_hris_lve_fromdate) =" + fromdateno + " and EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate)=" + fromdateyear + "\
                    and a.custrecord_hris_lve_hrmsapprovalstatus =2 and custrecord_hris_lve_cancellation='F' GROUP BY EXTRACT(MONTH FROM a.custrecord_hris_lve_fromdate), EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate)"
                      
                    
                    let queryResults = query.runSuiteQL({
                            query: sicksql
                        });
                        const sicksqlrecord = queryResults.asMappedResults();
                        log.debug('sicksql', sicksql)
                        log.debug(' sicksqlrecord.length * ', sicksqlrecord.length);
                        let totalnodays = 0;
                        if (sicksqlrecord.length > 0) {
                            totalnodays = sicksqlrecord[0].totdays || 0;
                        }
                        totaldays = parseFloat(totaldays) + parseFloat(totalnodays);

                        /*    const leavesql = "select a.custrecord_hris_lveconfig_leavename ,a.custrecord_hris_lveconfig_leaveshortname from customrecord_hris_leaveconfig a join customrecord_hris_emp_leave_type_master b \
                                      on a.custrecord_hris_lveconfig_leavename = b.id  where b.id = 9 and a.id =" + leavetype;
                                   let queryResults = query.runSuiteQL({
                                       query: leavesql
                                   });
                                   const leavesqlrecord = queryResults.asMappedResults();
                                   log.debug('leavesql',leavesql)
                                   log.debug(' leavesqlrecord.length * ',leavesqlrecord.length); */
                        if (totaldays != 0 && totaldays > 2) {
                            leaverecord.getField({ fieldId: 'custrecord_hris_lve_attachdocument' }).isMandatory = true;
                            // leaverecord.getField({ fieldId:' custrecord_hris_lve_supportdocument' }).isMandatory = true;
                            leaverecord.setValue({
                                fieldId: 'custrecord_hris_lve_attachdocument',
                                value: true,
                                ignoreFieldChange: false,
                                forceSyncSourcing: true
                            });

                        }



                        else {
                            leaverecord.getField({ fieldId: 'custrecord_hris_lve_attachdocument' }).isMandatory = false;
                            //   leaverecord.getField({ fieldId: ' custrecord_hris_lve_supportdocument' }).isMandatory = true;
                            leaverecord.setValue({
                                fieldId: 'custrecord_hris_lve_attachdocument',
                                value: false,
                                ignoreFieldChange: false,
                                forceSyncSourcing: true
                            });
                        }

                    }
                }



            }
            catch (e) {
                console.log("error in fieldchange : " + e);

            }

        }

        function get_sequence_no(Leave_type) {

            const leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + Leave_type + "' and isinactive ='F'"
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
        function Cancelclick() {
            debugger;
            try {

                let leaverecord1 = currentRecord.get();
                let leaverecordid = leaverecord1.id;
                log.debug('leaverecordid', leaverecordid);
                let leaverecord = record.load({
                    type: 'customrecord_hris_leaveapplication',
                    id: leaverecordid,
                    isDynamic: true
                });

                /*  leaverecord.setValue({
                     fieldId:'custrecord_hris_lve_cancellation',
                     value: true,
                     ignoreFieldChange: true,
                     forceSyncSourcing: true
                 }); */

                leaverecord.setValue({
                    fieldId: 'custrecord_hris_lve_cancel_leavestatus',
                    value: 2,
                    ignoreFieldChange: true,
                    forceSyncSourcing: true
                });
                /* leaverecord.setValue({
                    fieldId:'custrecord_hris_lveapp_approvalstatus',
                    value: 2,
                    ignoreFieldChange: true,
                    forceSyncSourcing: true
                });  */
                leaverecord.setValue("custrecord_hris_lveappapprovallevel", '', true, true);
                leaverecord.setValue("custrecord_hris_lveapp_approvalusrtype", '', true, true);
                leaverecord.setValue("custrecord_hris_lveapp_role", '', true, true);
                leaverecord.setValue("custrecord_hris_lveapp_appruser", '', true, true);

                const params = {
                    custparam_flag: 1 // Replace 'paramName' with the name of your parameter and 'paramValue' with its value
                };


                let flagid = 1;
                let url = `/app/common/custom/custrecordentry.nl?rectype=894&e=T&id=${leaverecordid}&flag=` + flagid;


                console.log("url", + url);
                window.location.href = url;
            }

            catch (e) {

                log.debug('Error in cancel click', e.name + ' ' + e.message);
            }

        }

        function Settlementclick(){
            try{
                   debugger;
              
                 
                  let leaverecord1 = currentRecord.get();
                  let leaverecordid = leaverecord1.id;
                  log.debug('leaverecordid', leaverecordid);
                  let leaverecord = record.load({
                      type: 'customrecord_hris_leaveapplication',
                      id: leaverecordid,
                      isDynamic: true
                  });
                  let empid =leaverecord.getValue({
                    fieldId:'custrecord_hris_lve_employeename'
                  })
                  let flagid =1;
                  let url = `/app/common/custom/custrecordentry.nl?rectype=1905&leaverecordid=${leaverecordid}&flag=` + flagid +'&empid='+empid;
                  window.location.href = url; 
              
        } 
        
           catch (e) {
               console.log("error in open: " + e);
           }
       }  
       function HRSettlementclick(){
        try{
               debugger;
          
             
              let leaverecord1 = currentRecord.get();
              let leaverecordid = leaverecord1.id;
              log.debug('leaverecordid', leaverecordid);
              let leaverecord = record.load({
                  type: 'customrecord_hris_leaveapplication',
                  id: leaverecordid,
                  isDynamic: true
              });
              let empid =leaverecord.getValue({
                fieldId:'custrecord_hris_lve_employeename'
              })
              let flagid =1;
              let url = `/app/common/custom/custrecordentry.nl?rectype=1873&leaverecordid=${leaverecordid}&flag=` + flagid +'&empid='+empid;
              window.location.href = url; 
          
    } 
    
       catch (e) {
           console.log("error in open: " + e);
       }
   } 
        const saveRecord = (scriptContext) => {
            debugger;
            try {

                let leaverecord = scriptContext.currentRecord;
                let leaverecordid = leaverecord.id;
                let flag = getUrlParameter('flag');
                log.debug('Flag Check', flag);
                log.debug('leaverecordid', leaverecordid);

                const cancelcheck = leaverecord.getValue({
                    fieldId: 'custrecord_hris_lve_cancellation'
                });
                log.debug('Cancel check', cancelcheck);
                const cancelstatus = leaverecord.getValue({
                    fieldId: 'custrecord_hris_lve_cancel_leavestatus'
                });
                log.debug('Cancel status', cancelstatus);

                if (cancelcheck == true && cancelstatus == 1 && flag == 1) {
                    /*     leaverecord.setValue({
                            fieldId:'custrecord_hris_lve_cancel_leavestatus',
                            value: 2,
                            ignoreFieldChange: true,
                            forceSyncSourcing: true
                        }); 
         */
                    leaverecord.setValue({
                        fieldId: 'custrecord_hris_lveapp_approvalstatus',
                        value: 3,
                        ignoreFieldChange: true,
                        forceSyncSourcing: true
                    });
                    leaverecord.setValue("custrecord_hris_lveappapprovallevel", '', true, true);
                    leaverecord.setValue("custrecord_hris_lveapp_approvalusrtype", '', true, true);
                    leaverecord.setValue("custrecord_hris_lveapp_role", '', true, true);
                    leaverecord.setValue("custrecord_hris_lveapp_appruser", '', true, true);


                }
                return true
            }
            catch (e) {
                console.log("error in saverecord : " + e);

            }

        }






        function getResult(pSQL) {
            // log.debug("QUERY", pSQL);

            let queryResults = query.runSuiteQL({
                query: pSQL
            });
            const records = queryResults.asMappedResults();
            return records;
        }
        function getUrlParameter(param) {
            debugger;
            const query = window.location.search.substring(1);
            const vars = query.split("&");
            for (const i = 0; i < vars.length; i++) {
                const pair = vars[i].split("=");
                if (pair[0] == param) {
                    return decodeURIComponent(pair[1]);
                }
            }
            return (false);
        }

        return {
            pageInit: pageInit,
            Cancelclick: Cancelclick,
            Settlementclick:Settlementclick,
            HRSettlementclick:HRSettlementclick,
            //  saveRecord: saveRecord,
            fieldChanged: fieldChanged

        }
    });

function _logValidation(value) {
    if (value != null && value !== '' && value != undefined && value.toString() != 'NaN' && value != NaN) {
        return true;
    } else {
        return false;
    }
}






