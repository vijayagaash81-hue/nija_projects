/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
define(['N/search', 'N/query', 'N/format', 'N/record', 'N/currentRecord', 'N/url', './moment.js', 'N/runtime'],
    function (search, query, format, record, currentRecord, url, moment, runtime) {


        function pageInit(scriptContext) {
            debugger;
            try {

                var leaverecord = scriptContext.currentRecord;
                if (scriptContext.mode === 'create') {
                    var windowUrl = window.location.href;

                    var urlParams = new URL(windowUrl).searchParams;
                    var emp = urlParams.get('record.custrecord_hris_lve_employeename');

                    if (emp) {

                        leaverecord.setValue({
                            fieldId: 'custrecord_hris_lve_employeename',
                            value: emp,
                            ignoreFieldChange: true,
                            forceSyncSourcing: true

                        });
                    }
                }


            }
            catch (e) {
                console.log("error in pageinit : " + e);

            }

        }
        function fieldChanged(scriptContext) {
            debugger;
            try {

                var leaverecord = scriptContext.currentRecord;
                if (scriptContext.fieldId == 'custrecord_hris_lve_fromdate' || scriptContext.fieldId == 'custrecord_hris_lve_todate' || scriptContext.fieldId == 'custrecord_hris_lve_totalnodays' || scriptContext.fieldId == 'custrecord_hris_lve_leavetype' || scriptContext.fieldId == 'custrecord_hris_lve_employeename') {
                    var fromdate = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_fromdate'
                    }) || '';
                    log.debug('fromdate', fromdate);
                    var todate = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_todate'
                    }) || '';
                    log.debug('todate', todate);


                    var approvalstatus = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_hrmsapprovalstatus'

                    });
                    var leavetype = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_leavetype'
                    }) || '';
                    log.debug('Leave Type', leavetype);
                    var Leave_type_seqno = get_sequence_no(leavetype);
                    var accuralcheck = get_leaveaccuralcheck(leavetype);
                    log.emergency('Leave_type_seqno', Leave_type_seqno)
                    log.emergency('accuralcheck', accuralcheck)
                    log.emergency('approvalstatus', approvalstatus)
                    // For Annual Leave Calculation

                    var empname = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_employeename'
                    }) || '';

                    if (fromdate && approvalstatus != 2 && Leave_type_seqno == 3 && accuralcheck == 'T') {
                        fromdate = format.parse({
                            value: fromdate,
                            type: format.Type.DATE
                        });

                        if (todate) {
                            todate = format.parse({
                                value: todate,
                                type: format.Type.DATE
                            });
                        }
                        var empDetails = [];



                        log.debug('Employee Name', empname);
                        var employeeRecord = record.load({
                            type: record.Type.EMPLOYEE,
                            id: empname
                        });

                        var empHireDate = employeeRecord.getValue('hiredate');
                        var employeecategory = employeeRecord.getValue('custentity_hris_empcategory');
                        log.debug('Get employeecategory', employeecategory);

                        var empcatagory = getemployeecatagorysequence(employeecategory);
                        var empcatagorydetails = empcatagory.toString().split("#")
                        var empcatagorysequence = empcatagorydetails[0];
                        var empcatagorydays = empcatagorydetails[1];
                        var airticketcal = empcatagorydetails[2];
                        empDetails = getEmployeeStatus(empname);
                        log.debug('empDetails', JSON.stringify(empDetails));
                        var empDetailsRecord = empDetails[0];
                        log.debug('empDetailsRecord', JSON.stringify(empDetailsRecord));
                        var empStatus = empDetailsRecord.empStatus;
                        var empJoinDate = empDetailsRecord.empJoinDate;
                        var empHireDateObj = format.parse({
                            value: empJoinDate,
                            type: format.Type.DATE,
                            //   timezone: format.Timezone.ASIA_MUSCAT
                        });
                        log.debug('empStatus', empStatus);
                        //if (empStatus == 3 && leavetype == 1) {
                        if (empStatus == 3) {
                            // var leavebalsearch = [];
                            var leavebalsearch = 0;
                            var obDetails = [];
                            var dateConsidered;
                            var finalleavebal = 0;
                            var obLeaveBalance = 0;


                            obDetails = getEmployeeOBDetails(empname, leavetype);
                            log.debug('obDetails', JSON.stringify(obDetails));
                            if (obDetails && obDetails.length > 0) {
                                //  If OB Date is present. Consider it for Calculation
                                var obDetailsecord = obDetails[0];
                                obLeaveBalance = obDetailsecord.obleavebalance;
                                var obDate = obDetailsecord.obdate;
                                var parsedOBDate = format.parse({
                                    value: obDate,
                                    type: format.Type.DATE,
                                    // timezone: format.Timezone.ASIA_MUSCAT
                                });
                                dateConsidered = parsedOBDate;
                            } else {
                                // Step 3: If OB Date is not present. Consider Emp Join Date for Calculation
                                dateConsidered = empHireDateObj;
                            }
                            leavebalsearch = searchLeaveBalance(empname, query, empHireDateObj, format, moment, dateConsidered, fromdate, leavetype)
                            log.debug('leavebalsearch', JSON.stringify(leavebalsearch));
                            // if (leavebalsearch && leavebalsearch.length > 0) {
                            finalleavebal = leavebalsearch;
                            leaverecord.setValue({

                                fieldId: 'custrecord_hris_lve_leavebalance',
                                value: finalleavebal.toFixed(2),
                                ignoreFieldChange: true,
                                forceSyncSourcing: true
                            });
                            var roundfinalleavebal = GetRoundOffvalue(finalleavebal);
                            leaverecord.setValue({
                                fieldId: 'custrecord_hris_lve_leavebalance_wholeno',
                                value: roundfinalleavebal,
                                ignoreFieldChange: true,
                                forceSyncSourcing: true
                            });
                        }
                    } else if (empname && (leavetype == 11 || Leave_type_seqno == 5)) {
                        var leavebalancesql = "select custrecord_hris_lvbal_available_leave_ba from customrecord_hris_leavebalance where custrecord_hris_lvbal_employee_name = '" + empname + "' and custrecord_hris_lvbal_leave_type = '" + leavetype + "' and isinactive ='F'";
                        log.debug("leavebalancesql compoff", leavebalancesql);
                        var queryResult = query.runSuiteQL({
                            query: leavebalancesql,
                        });
                        var leavebalancesqlrecords = queryResult.asMappedResults();
                        log.debug("leavebalancesqlrecords compoff length", leavebalancesqlrecords.length);
                        if (leavebalancesqlrecords.length > 0) {
                            var availableleavebal = leavebalancesqlrecords[0].custrecord_hris_lvbal_available_leave_ba || 0;
                            leaverecord.setValue({
                                fieldId: 'custrecord_hris_lve_leavebalance_wholeno',
                                value: availableleavebal,
                                ignoreFieldChange: true,
                                forceSyncSourcing: true
                            });
                            leaverecord.setValue({
                                fieldId: 'custrecord_hris_lve_leavebalance',
                                value: availableleavebal,
                                ignoreFieldChange: true,
                                forceSyncSourcing: true
                            });
                        }
                    }
                    // Checking for emergency leave
                    if (fromdate && todate && Leave_type_seqno == 13) {
                        var fromdateno = fromdate.getMonth() + 1
                        /*  fromdate = format.parse({
                             value: fromdate,
                             type: format.Type.DATE
                         });                
                         // Extract the month number from the parsed date
                         var fromdateno = format.format({
                             value: fromdate,
                             type: format.Type.MONTH
                         });
                      */


                        log.debug('Month Number', fromdateno);
                        var fromdateyear = fromdate.getFullYear();
                        log.debug("Month year", fromdateyear);

                        var totaldays = leaverecord.getValue({
                            fieldId: 'custrecord_hris_lve_totalnodays'
                        }) || 0;
                        log.debug('totaldays', totaldays);


                        var empname = leaverecord.getValue({
                            fieldId: 'custrecord_hris_lve_employeename'
                        }) || '';
                        log.debug('Employee Name', empname);
                        var totalnodays = gettingemergencyleavedays(empname, leavetype, fromdateyear);
                        /*  var emergencysql = "SELECT NVL(SUM(a.custrecord_hris_lve_totalnodays), 0) AS totdays,\
                         EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate) as  leave_year FROM customrecord_hris_leaveapplication a JOIN customrecord_hris_leaveconfig b ON a.custrecord_hris_lve_leavetype = b.id  \
                        WHERE a.custrecord_hris_lve_employeename = "+ empname + " and a.custrecord_hris_lve_leavetype =" + leavetype + " and EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate)=" + fromdateyear + "\
                         and a.custrecord_hris_lve_hrmsapprovalstatus =2 and custrecord_hris_lve_cancellation='F' GROUP BY  EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate)"
 
 
                         var queryResults = query.runSuiteQL({
                             query: emergencysql
                         });
                         var emergencysqlrecord = queryResults.asMappedResults();
                         log.debug('emergencysql', emergencysql)
                         log.debug(' emergencysql.length * ', emergencysql.length);
                         var totalnodays = 0;
                         if (emergencysql.length > 0) {
                             totalnodays = emergencysqlrecord[0].totdays || 0;
                         } */
                        totaldays = parseFloat(totaldays) + parseFloat(totalnodays);
                        if (totaldays != 0 && totaldays > 15) {
                            alert('You Should not apply Emergency Leave greater than 15');
                            /*     leaverecord.setValue({
                                     fieldId: 'custrecord_hris_lve_leavetype',
                                     value: '',
                                     ignoreFieldChange: true,
                                     forceSyncSourcing: true
                                 });
                                  leaverecord.setValue({
                                     fieldId: 'custrecord_hris_lve_fromdate',
                                     value: '',
                                     ignoreFieldChange: true,
                                     forceSyncSourcing: true
                                 });*/
                            leaverecord.setValue({
                                fieldId: 'custrecord_hris_lve_todate',
                                value: '',
                                ignoreFieldChange: true,
                                forceSyncSourcing: true
                            });
                            leaverecord.setValue({
                                fieldId: 'custrecord_hris_lve_totalnodays',
                                value: '',
                                ignoreFieldChange: true,
                                forceSyncSourcing: true
                            });
                            return false;



                        }

                    }

                    // Checking For Annual Leave Labour
                    /* if (fromdate && todate && Leave_type_seqno == 3) {
                        var empname = leaverecord.getValue({
                            fieldId: 'custrecord_hris_lve_employeename'
                        }) || '';
                        log.debug('Employee Name', empname);

                        var empcatagory = gettingempcatagorysequence(empname);
                        //  var empQuery = "select b.id as empcatagoryid ,b.custrecord_hris_empcat_seqno as seqno from employee  a join\
                        //customrecord_hris_employeecategory b on  a.custentity_hris_empcategory = b.id where a.id =" + empname + " and b.isinactive='F'"
 
                       //  var queryResults = query.runSuiteQL({
                         //    query: empQuery,
                        // });
                       //  var empQueryrecords = queryResults.asMappedResults();
                       
 
                       //  if (empQueryrecords.length > 0) {
                        //     var rec = empQueryrecords[0];
                         //    var empcatagory = rec.seqno;
                        // }

                        var fromdateno = fromdate.getMonth() + 1


                        log.debug('Month Number', fromdateno);
                        var fromdateyear = fromdate.getFullYear();
                        log.debug("Month year", fromdateyear);

                        var totaldays = leaverecord.getValue({
                            fieldId: 'custrecord_hris_lve_totalnodays'
                        }) || 0;
                        log.debug('totaldays', totaldays);

                        var totalnodays = gettingannualleavedays(empname, leavetype, fromdateyear);

                        //  var annualsql = "SELECT NVL(SUM(a.custrecord_hris_lve_totalnodays), 0) AS totdays,\
                       //  EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate) as  leave_year FROM customrecord_hris_leaveapplication a JOIN customrecord_hris_leaveconfig b ON a.custrecord_hris_lve_leavetype = b.id  \
                       // WHERE a.custrecord_hris_lve_employeename = "+ empname + " and a.custrecord_hris_lve_leavetype =" + leavetype + " and EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate)=" + fromdateyear + "\
                        // and a.custrecord_hris_lve_hrmsapprovalstatus =2 and custrecord_hris_lve_cancellation='F' GROUP BY  EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate)"
 
 
                        // var queryResults = query.runSuiteQL({
                           //  query: annualsql
                       //  });
                       //  var annualsqlrecord = queryResults.asMappedResults();
                        // log.debug('annualsql', annualsql)
                       //  log.debug(' annualsql.length * ', annualsql.length);
                        // var totalnodays = 0;
                        // if (annualsqlrecord.length > 0) {
                            // totalnodays = annualsqlrecord[0].totdays || 0;
                       //  }
                        totaldays = parseFloat(totaldays) + parseFloat(totalnodays);
                      log.emergency("totaldays based ",totaldays);
                        if (totaldays != 0 && empcatagory == 2 && totaldays > 60) {
                            alert('You Should not apply Annual Leave greater than 60');
                            //  leaverecord.setValue({
                                 // fieldId: 'custrecord_hris_lve_leavetype',
                                 // value: '',
                                 // ignoreFieldChange: true,
                                 // forceSyncSourcing: true
                             // }); 
                              // leaverecord.setValue({
                                // fieldId: 'custrecord_hris_lve_fromdate',
                               //  value: '',
                               //  ignoreFieldChange: true,
                              //  forceSyncSourcing: true
                             //});
                            leaverecord.setValue({
                                fieldId: 'custrecord_hris_lve_todate',
                                value: '',
                                ignoreFieldChange: false,
                                forceSyncSourcing: true
                            });
                            leaverecord.setValue({
                                fieldId: 'custrecord_hris_lve_totalnodays',
                                value: '',
                                ignoreFieldChange: false,
                                forceSyncSourcing: true
                            });
                            return false;
                              // leaverecord.setValue({
                                 // fieldId: 'custrecord_hris_lve_employeename',
                                 // value: '',
                                //  ignoreFieldChange: true,
                                 // forceSyncSourcing: true
                             // });
                               




                        }
                        else if (totaldays != 0 && (empcatagory == 1 || empcatagory == 3) && totaldays > 22) {
                            alert('You Should not apply Annual Leave greater than 22');
                              //leaverecord.setValue({
                                  // fieldId: 'custrecord_hris_lve_leavetype',
                                  // value: '',
                                   //ignoreFieldChange: true,
                                  // forceSyncSourcing: true
                              // }); 
                              //leaverecord.setValue({
                               // fieldId: 'custrecord_hris_lve_fromdate',
                               // value: '',
                               // ignoreFieldChange: true,
                               // forceSyncSourcing: true
                           // }); 
                            leaverecord.setValue({
                                fieldId: 'custrecord_hris_lve_todate',
                                value: '',
                                ignoreFieldChange: false,
                                forceSyncSourcing: true
                            });
                            leaverecord.setValue({
                                fieldId: 'custrecord_hris_lve_totalnodays',
                                value: '',
                                ignoreFieldChange: false,
                                forceSyncSourcing: true
                            });
                            return false;
                               //leaverecord.setValue({
                                 // fieldId: 'custrecord_hris_lve_employeename',
                                 // value: '',
                                 // ignoreFieldChange: true,
                                 // forceSyncSourcing: true
                             // });
                               




                        }

                    } */
                    /* if (fromdate && todate && Leave_type_seqno == 3) {
       var empname = leaverecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' }) || '';
       var leavetype = leaverecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' }) || '';
       var isEmergency = leaverecord.getValue({ fieldId: 'custrecord_hris_leave_application_emerge' });
       var totaldays = leaverecord.getValue({ fieldId: 'custrecord_hris_lve_totalnodays' }) || 0;
       var fromDateValue = leaverecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' });
   
       // 1. VALIDATION: Emergency Leave Limit (7 Days)
       if (isEmergency == true && totaldays > 7) {
           alert('Emergency Annual Leave cannot exceed 7 days.');
           leaverecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '' });
           leaverecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: '' });
           return false;
       }
   
       // 2. NEW VALIDATION: 21 days advance notice
       // We skip this check if "isEmergency" is checked
       if (isEmergency != true) {
           var today = new Date();
           today.setHours(0, 0, 0, 0); // Normalize today to midnight
   
           var checkFromDate = new Date(fromDateValue);
           checkFromDate.setHours(0, 0, 0, 0); // Normalize From Date to midnight
   
           var noticeDiff = checkFromDate.getTime() - today.getTime();
           var noticeDays = Math.floor(noticeDiff / (1000 * 3600 * 24));
   
           if (noticeDays < 21) {
               alert('Standard Annual Leave must be applied for at least 21 days in advance. \n\n' +
                     'Days notice provided: ' + noticeDays + ' days.');
               leaverecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '' });
               leaverecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '' });
               return false;
           }
       }
   
       // 3. VALIDATION: 90 days gap between Annual Leave applications
       var lastLeaveEndDate = getLastLeaveDate(empname, leavetype);
   
       if (lastLeaveEndDate) {
           // Normalize dates for accurate day calculation
           var currentFromDate = new Date(fromDateValue);
           currentFromDate.setHours(0, 0, 0, 0);
   
           var previousToDate = new Date(lastLeaveEndDate);
           previousToDate.setHours(0, 0, 0, 0);
   
           // Calculate the gap in days
           var timeDiff = currentFromDate.getTime() - previousToDate.getTime();
           var gapDays = Math.floor(timeDiff / (1000 * 3600 * 24));
   
           if (gapDays < 90) {
               var formattedPrevDate = format.format({ value: previousToDate, type: format.Type.DATE });
               
               alert('Rule Violation: 90-day gap required.\n\n' +
                     'Your last Annual Leave ended on: ' + formattedPrevDate + '\n' +
                     'Days since last leave: ' + gapDays + ' days.\n' +
                     'Please select a date at least 90 days after your last leave.');
   
               // Clear the date fields
               leaverecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '' });
               leaverecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '' });
               return false;
           }
       }
   } */
                    //below comment line with out emergency leave max no 7 days
                    /* if (fromdate && todate && Leave_type_seqno == 3) {
       var empname = leaverecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' }) || '';
       var leavetype = leaverecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' }) || '';
       var isEmergency = leaverecord.getValue({ fieldId: 'custrecord_hris_leave_application_emerge' });
       var totaldays = leaverecord.getValue({ fieldId: 'custrecord_hris_lve_totalnodays' }) || 0;
       var fromDateValue = leaverecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' });
   
       // -------------------------------------------------------------------------
       // RULE 1 & 6: Maximum Leave Duration (12 Days)
       // Applies to BOTH Standard and Emergency Annual Leave
       // -------------------------------------------------------------------------
       if (totaldays > 12) {
           alert('Validation Error: Annual Leave duration cannot exceed 12 calendar days (this applies to Emergency Leave as well).');
           leaverecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '' });
           leaverecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: '' });
           return false;
       }
   
       // -------------------------------------------------------------------------
       // RULES 2, 3, 4, 5: Notice Period and Gap Validations
       // These ONLY apply if isEmergency is FALSE
       // -------------------------------------------------------------------------
       if (isEmergency == false || isEmergency == 'F') {
           
           var today = new Date();
           today.setHours(0, 0, 0, 0); // Normalize today to midnight
   
           var checkFromDate = new Date(fromDateValue);
           checkFromDate.setHours(0, 0, 0, 0); // Normalize From Date to midnight
   
           // RULE 2: 21 days advance notice
           var noticeDiff = checkFromDate.getTime() - today.getTime();
           var noticeDays = Math.floor(noticeDiff / (1000 * 3600 * 24));
   
           if (noticeDays < 21) {
               alert('Standard Annual Leave (Non-Emergency) must be applied for at least 21 days in advance. \n\n' +
                     'Days notice provided: ' + noticeDays + ' days.');
               leaverecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '' });
               leaverecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '' });
               return false;
           }
   
           // RULE 4: 90 days gap between Annual Leave applications
           var lastLeaveEndDate = getLastLeaveDate(empname, leavetype);
   
           if (lastLeaveEndDate) {
               var previousToDate = new Date(lastLeaveEndDate);
               previousToDate.setHours(0, 0, 0, 0);
   
               // Calculate the gap in days
               var timeDiff = checkFromDate.getTime() - previousToDate.getTime();
               var gapDays = Math.floor(timeDiff / (1000 * 3600 * 24));
   
               if (gapDays < 90) {
                   var formattedPrevDate = format.format({ value: previousToDate, type: format.Type.DATE });
                   
                   alert('Rule Violation: A minimum 90-day gap is required between Standard Annual Leave applications.\n\n' +
                         'Your last Annual Leave ended on: ' + formattedPrevDate + '\n' +
                         'Days since last leave: ' + gapDays + ' days.');
   
                   leaverecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '' });
                   leaverecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '' });
                   return false;
               }
           }
       }
       // If isEmergency is True, Rules 2 and 4 are bypassed, but Rule 1 (12 days) was already checked above.
   } */
                    if (fromdate && todate && Leave_type_seqno == 3) {
                        var empname = leaverecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' }) || '';
                        var leavetype = leaverecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' }) || '';
                        var isEmergency = leaverecord.getValue({ fieldId: 'custrecord_hris_leave_application_emerge' });
                        var totaldays = leaverecord.getValue({ fieldId: 'custrecord_hris_lve_totalnodays' }) || 0;
                        var fromDateValue = leaverecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' });

                        // ============================================================
                        // CASE A: EMERGENCY ANNUAL LEAVE
                        // ============================================================
                        if (isEmergency == true || isEmergency == 'T') {

                            // 1. VALIDATION: Emergency Leave Limit (7 Days)
                            if (totaldays > 7) {
                                alert('Emergency Annual Leave cannot exceed 7 calendar days.');
                                leaverecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '' });
                                leaverecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: '' });
                                return false;
                            }

                            // Note: Because it is Emergency, we skip the 21-day and 90-day validations.
                        }

                        // ============================================================
                        // CASE B: STANDARD ANNUAL LEAVE (isEmergency is False)
                        // ============================================================
                        else {

                            // 1. VALIDATION: Standard Max Duration (12 Days)
                            if (totaldays > 12) {
                                alert('Standard Annual Leave duration cannot exceed 12 calendar days.');
                                leaverecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '' });
                                leaverecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: '' });
                                return false;
                            }
                        }
                    }



                }

                if (scriptContext.fieldId == 'custrecord_hris_lve_fromdate') {
                    var emp_name = leaverecord.getValue('custrecord_hris_lve_employeename');
                    var Leave_type = leaverecord.getValue('custrecord_hris_lve_leavetype') || '';

                    var hireDate = leaverecord.getValue('custrecord_hris_lve_hiredate');
                    var curDate = new Date();
                    var fromdate = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_fromdate'
                    }) || '';
                    // Added for Last Working Date
                    if (fromdate) {

                        // Convert to Date object (safety)
                        var fromDateObj = new Date(fromdate);

                        // Subtract 1 day
                        fromDateObj.setDate(fromDateObj.getDate() - 1);

                        // Set Last Working Date
                        leaverecord.setValue({
                            fieldId: 'custrecord_hris_lve_lastworkingdate',
                            value: fromDateObj
                        });
                    }
                    //Extract External ID
                    //	var Leave_type = nlapiLookupField('customrecord_hris_leaveconfig', v_Leave_type, 'externalid');
                    log.debug("Leave_type", Leave_type);
                    if (Leave_type) {
                        // we are checking with sequence no
                        var Leave_type_seqno = get_sequence_no(Leave_type);
                        var proratacheck = proratecheck(Leave_type);

                        // if (Leave_type_seqno == 3 && emp_name && hireDate && proratacheck == 'F') {
                        if (Leave_type_seqno == 3 && emp_name && hireDate) {

                            /* var empQuery = "select b.id as empcatagoryid ,b.custrecord_hris_empcat_seqno as seqno from employee  a join\
                             customrecord_hris_employeecategory b on  a.custentity_hris_empcategory = b.id where a.id ="+ emp_name + " and b.isinactive='F'"
                            var queryResults = query.runSuiteQL({
                                query: empQuery,
                            });
                            var empQueryrecords = queryResults.asMappedResults();
                            // var visatextField = recordObj.getField("custpage_visaprocessingtext");
    
                            if (empQueryrecords.length > 0) {
                                var rec = empQueryrecords[0];
                                var empcatagory = rec.seqno;
                            } */
                            var empcatagory = gettingempcatagorysequence(emp_name);
                            if (empcatagory == 2) {
                                //  it is changed to 670 days
                                var compareDate = moment(hireDate).add(365, 'days');
                                compareDate = format.parse({
                                    value: compareDate,
                                    type: format.Type.DATE
                                });


                                if (compareDate >= fromdate) {
                                    alert('You are allowed to take Annual Leave only after completion of 12 months of service')
                                    leaverecord.setValue({
                                        fieldId: 'custrecord_hris_lve_fromdate',
                                        value: '',
                                        ignoreFieldChange: true,
                                        forceSyncSourcing: true
                                    });
                                    return false;
                                }
                                // Annual Leave Rejoin date Checking
                                /*   var leaveQuery = "select * from customrecord_hris_leaveapplication  where custrecord_hris_lve_leavetype = " + Leave_type + "\
                               and custrecord_hris_lve_workresume ='T' and  isinactive ='F'and custrecord_hris_lve_employeename ="+ emp_name;
      
                                  var queryResults = query.runSuiteQL({
                                      query: leaveQuery,
                                  });
                                  var leaveQueryrecords = queryResults.asMappedResults();
           */
                                var rejoindate = gettingleaverejoindate(Leave_type, emp_name);
                                if (rejoindate != '') {

                                    var compareDate = moment(rejoindate).add(365, 'days');
                                    compareDate = format.parse({
                                        value: compareDate,
                                        type: format.Type.DATE
                                    });


                                    if (compareDate >= fromdate) {

                                        alert('You are allowed to take Annual Leave only after completion of 12 months of rejoining date of the previous annual leave.')
                                        // leaverecord.setValue('custrecord_hris_lve_leavetype', '', false);
                                        leaverecord.setValue({
                                            fieldId: 'custrecord_hris_lve_fromdate',
                                            value: '',
                                            ignoreFieldChange: true,
                                            forceSyncSourcing: true
                                        });
                                        return false;

                                    }
                                }

                                // Visa Renewal Date Checking

                                //   var visaQuery = "select max(custrecord_hris_date_issue) as renewaldate from customrecord_hris_emp_id_info  where  isinactive ='F'and custrecord_hris_emp_link = "+ emp_name;
                                /*  var visaQuery = "select max(a.custrecord_hris_date_issue) as renewaldate from customrecord_hris_emp_id_info a \
                                             join customrecordhris_idcardmaster b on a.custrecord_hris_emp_id_type = b.id \
                                              where  a.isinactive ='F' and b.custrecord_hris_idcard_seqno =1 and a.custrecord_hris_emp_link = "+ emp_name;
     
                                 var queryResults = query.runSuiteQL({
                                     query: visaQuery,
                                 });
                                 var visaQueryrecords = queryResults.asMappedResults();
                             */
                                var renewaldate = gettingvisarenewaldate(emp_name);

                                if (renewaldate != '') {

                                    var compareDate = moment(renewaldate).add(6, 'months');
                                    compareDate = format.parse({
                                        value: compareDate,
                                        type: format.Type.DATE
                                    });
                                    if (compareDate >= fromdate) {

                                        alert('You are allowed to take Annual Leave only after completion of 6 months of visa renewal.')
                                        //  leaverecord.setValue('custrecord_hris_lve_leavetype', '', false);
                                        leaverecord.setValue({
                                            fieldId: 'custrecord_hris_lve_fromdate',
                                            value: '',
                                            ignoreFieldChange: true,
                                            forceSyncSourcing: true
                                        });
                                        return false;


                                    }

                                }


                            }
                            else if (empcatagory == 1 || empcatagory == 3) {
                                //  it is changed to 670 days
                                var compareDate = moment(hireDate).add(365, 'days');
                                compareDate = format.parse({
                                    value: compareDate,
                                    type: format.Type.DATE
                                });


                                if (compareDate >= fromdate) {
                                    alert('You are allowed to take Annual Leave only after completion of 12 months of service')
                                    leaverecord.setValue({
                                        fieldId: 'custrecord_hris_lve_fromdate',
                                        value: '',
                                        ignoreFieldChange: true,
                                        forceSyncSourcing: true
                                    });
                                    return false;
                                }
                                // Annual Leave Rejoin date Checking
                                /*     var leaveQuery = "select * from customrecord_hris_leaveapplication  where custrecord_hris_lve_leavetype = " + Leave_type + "\
                                 and custrecord_hris_lve_workresume ='T' and  isinactive ='F'and custrecord_hris_lve_employeename ="+ emp_name;
        
                                    var queryResults = query.runSuiteQL({
                                        query: leaveQuery,
                                    });
                                    var leaveQueryrecords = queryResults.asMappedResults();
                               */
                                var rejoindate = gettingleaverejoindate(Leave_type, emp_name);
                                if (rejoindate != '') {

                                    var compareDate = moment(rejoindate).add(365, 'days');
                                    compareDate = format.parse({
                                        value: compareDate,
                                        type: format.Type.DATE
                                    });


                                    if (compareDate >= fromdate) {

                                        alert('You are allowed to take Annual Leave only after completion of 12 months of rejoining date of the previous annual leave.')

                                        leaverecord.setValue({
                                            fieldId: 'custrecord_hris_lve_fromdate',
                                            value: '',
                                            ignoreFieldChange: true,
                                            forceSyncSourcing: true
                                        });
                                        return false;

                                    }
                                }

                                // Visa Renewal Date Checking

                                //   var visaQuery = "select max(custrecord_hris_date_issue) as renewaldate from customrecord_hris_emp_id_info  where  isinactive ='F'and custrecord_hris_emp_link = "+ emp_name;
                                /*   var visaQuery = "select max(a.custrecord_hris_date_issue) as renewaldate from customrecord_hris_emp_id_info a  join customrecordhris_idcardmaster b on a.custrecord_hris_emp_id_type = b.id \
                                    where  a.isinactive ='F' and b.custrecord_hris_idcard_seqno =1 and a.custrecord_hris_emp_link = "+ emp_name;
      
                                  var queryResults = query.runSuiteQL({
                                      query: visaQuery,
                                  });
                                  var visaQueryrecords = queryResults.asMappedResults();
                             
                                  var renewaldate = '';
                                  if (visaQueryrecords.length > 0) {
                                      var rec = visaQueryrecords[0];
                                      renewaldate = rec.renewaldate || '';
                          */
                                var renewaldate = gettingvisarenewaldate(emp_name);
                                if (renewaldate != '') {

                                    //  renewaldate = new Date(renewaldate);
                                    //  renewaldate.setMonth(renewaldate.getMonth() + 6);
                                    var compareDate = moment(renewaldate).add(6, 'months');
                                    compareDate = format.parse({
                                        value: compareDate,
                                        type: format.Type.DATE
                                    });
                                    if (compareDate >= fromdate) {

                                        alert('You are allowed to take Annual Leave only after completion of 6 months of visa renewal.')
                                        //  leaverecord.setValue('custrecord_hris_lve_leavetype', '', false);
                                        leaverecord.setValue({
                                            fieldId: 'custrecord_hris_lve_fromdate',
                                            value: '',
                                            ignoreFieldChange: true,
                                            forceSyncSourcing: true
                                        });
                                        return false;


                                    }

                                }



                            }

                        }
                        if (Leave_type_seqno == 21 && emp_name && hireDate) {

                            // Check 2 Years from Hire Date
                            var twoYearsFromHire = moment(hireDate).add(730, 'days'); // 2 years = 730 days
                            twoYearsFromHire = format.parse({
                                value: twoYearsFromHire,
                                type: format.Type.DATE
                            });

                            if (twoYearsFromHire > fromdate) {
                                alert('You are eligible for this leave only after completing 2 years of continuous service from your joining date.');
                                leaverecord.setValue({
                                    fieldId: 'custrecord_hris_lve_fromdate',
                                    value: '',
                                    ignoreFieldChange: true,
                                    forceSyncSourcing: true
                                });
                                return false;
                            }

                            // Check 2 Years from Last Rejoin Date (if any previous Long Service Leave taken)
                            var lastRejoinDate = gettingleaverejoindate(Leave_type, emp_name);
                            if (lastRejoinDate != '') {
                                var twoYearsFromRejoin = moment(lastRejoinDate).add(730, 'days');
                                twoYearsFromRejoin = format.parse({
                                    value: twoYearsFromRejoin,
                                    type: format.Type.DATE
                                });

                                if (twoYearsFromRejoin > fromdate) {
                                    alert('You are allowed to apply for this leave only after 2 years from the rejoining date of your previous similar leave.');
                                    leaverecord.setValue({
                                        fieldId: 'custrecord_hris_lve_fromdate',
                                        value: '',
                                        ignoreFieldChange: true,
                                        forceSyncSourcing: true
                                    });
                                    return false;
                                }
                            }
                        }
                        if (Leave_type_seqno === 22 && emp_name && hireDate) {
                            var threeYearsFromHire = moment(hireDate).add(1095, 'days'); // 3 years ≈ 1095 days
                            threeYearsFromHire = format.parse({ value: threeYearsFromHire, type: format.Type.DATE });

                            if (threeYearsFromHire > fromdate) {
                                return blockLeave('You are eligible for this leave only after completing 3 years of continuous service from your joining date.');
                            }

                            var lastRejoinDate1 = gettingleaverejoindate(Leave_type, emp_name);

                            if (lastRejoinDate1 != '') {
                                var threeYearsFromRejoin = moment(lastRejoinDate1).add(1095, 'days');
                                threeYearsFromRejoin = format.parse({
                                    value: threeYearsFromRejoin,
                                    type: format.Type.DATE
                                });

                                if (threeYearsFromRejoin > fromdate) {
                                    alert('You are allowed to apply for this leave only after 3 years from the rejoining date of your previous similar leave.');
                                    leaverecord.setValue({
                                        fieldId: 'custrecord_hris_lve_fromdate',
                                        value: '',
                                        ignoreFieldChange: true,
                                        forceSyncSourcing: true
                                    });
                                    return false;
                                }
                            }



                        }
                        /* else if (Leave_type_seqno == 3 && emp_name && hireDate && proratacheck == 'T') {
    
                            var empname = leaverecord.getValue({
                                fieldId: 'custrecord_hris_lve_employeename'
                            }) || '';
                            log.debug('Employee Name', empname);
                          
                            var rejoindate = gettingemployeerejoindate(empname);
                            if (rejoindate != '') {
                                var formatrejoindate = format.parse({
                                    value: rejoindate,
                                    type: format.Type.DATE
                                });
                                var compareDate = moment(formatrejoindate).add(6, 'months');
                                compareDate = format.parse({
                                    value: compareDate,
                                    type: format.Type.DATE
                                });
    
                                if (compareDate >= fromdate) {
    
                                    alert('You are allowed to take Annual Leave only after completion of 6 months of rejoining date of the previous annual leave.')
                                    // leaverecord.setValue('custrecord_hris_lve_leavetype', '', false);
                                    leaverecord.setValue({
                                        fieldId: 'custrecord_hris_lve_fromdate',
                                        value: '',
                                        ignoreFieldChange: true,
                                        forceSyncSourcing: true
                                    });
                                    return false;
                                }
    
                            }
                            else {
    
                                var formathiredate = format.parse({
                                    value: hireDate,
                                    type: format.Type.DATE
                                });
                                var compareDate = moment(formathiredate).add(6, 'months');
                                compareDate = format.parse({
                                    value: compareDate,
                                    type: format.Type.DATE
                                });
    
                                if (compareDate >= fromdate) {
    
                                    alert('You are allowed to take Annual Leave only after completion of 6 months of joining date.')
                                    // leaverecord.setValue('custrecord_hris_lve_leavetype', '', false);
                                    leaverecord.setValue({
                                        fieldId: 'custrecord_hris_lve_fromdate',
                                        value: '',
                                        ignoreFieldChange: true,
                                        forceSyncSourcing: true
                                    });
                                    return false;
                                }
    
                            }
    
    
                        } */
                        if (Leave_type_seqno != 2) {




                            var employeesql = "select * from employee where id ='" + emp_name + "' and custentity_emp_employee_job_status =3 and isinactive ='F'"
                            log.debug("employeesql", employeesql);
                            var queryResult = query.runSuiteQL({
                                query: employeesql,
                            });
                            var employeesqlrecords = queryResult.asMappedResults();


                            log.debug(" employeesqlrecords.length", employeesqlrecords.length);
                            if (employeesqlrecords.length == 0) {



                                alert(
                                    "Selected Leave can be applied once your appointment status is CONFIRMED!"
                                );
                                leaverecord.setValue({
                                    fieldId: 'custrecord_hris_lve_leavetype',
                                    value: '',
                                    ignoreFieldChange: true,
                                    forceSyncSourcing: true
                                });
                                leaverecord.setValue({
                                    fieldId: 'custrecord_hris_lve_leavebalance',
                                    value: '',
                                    ignoreFieldChange: true,
                                    forceSyncSourcing: true
                                });
                                leaverecord.setValue({
                                    fieldId: 'custrecord_hris_lve_leavebalance_wholeno',
                                    value: '',
                                    ignoreFieldChange: true,
                                    forceSyncSourcing: true
                                });

                                return false;



                            }


                        }

                    }
                    // 2. VALIDATION: 21 days advance notice
                    // var noticeDiff = checkFromDate.getTime() - today.getTime();
                    // var noticeDays = Math.floor(noticeDiff / (1000 * 3600 * 24));

                    // if (noticeDays < 21) {
                    //     alert('Standard Annual Leave must be applied for at least 21 days in advance. \n\n' +
                    //         'Days notice provided: ' + noticeDays + ' days.');
                    //     leaverecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '' });
                    //     leaverecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '' });
                    //     return false;
                    // }

                    // Validate Leave Year Rotation
                    /*  var leaveType = leaverecord.getValue('custrecord_hris_lve_leavetype') || '';
                     var employeeId = leaverecord.getValue("custrecord_hris_lve_employeename");
                     if (leaveType) {
                     
                         var isRotation = check_rotation(leaveType);
                         if (isRotation == "T") {
                    
                             var rotationsql = "select * from customrecord_hris_rotational_leave_roste where custrecord_hris_employee_name ='" + employeeId + "'\
                                            and custrecord_hris_rotational_leave_categor ='"+ leaveType + "' and custrecord_hris_work_rotation_end ='F'\
                                            and isinactive ='F'"
 
                             log.debug("rotationsql", rotationsql);
                             var queryResult = query.runSuiteQL({
                                 query: rotationsql,
                             });
                             var rotationsqlrecords = queryResult.asMappedResults();
 
 
                             log.debug(" rotationsqlrecords.length", rotationsqlrecords.length);
                             if (rotationsqlrecords.length > 0) {
 
                                 alert(
                                     "You are allowed to apply Rotation Leave only if your Rotation Rostering is completed. Please contact to HR or Manager."
                                 );
                                 leaverecord.setValue("custrecord_hris_lve_leavetype", "", false);
                             }
                         }
                     } */


                }
                // Compoffvalidleavetype coding
                if (scriptContext.fieldId == 'custrecord_hris_lve_employeename') {
                    /* var leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + Leave_type + "' and isinactive ='F'\
                        and custrecord_hris_lvecnfg_considerpayroll ='T'"
                     log.debug("leavesequencesql", leavesequencesql);
                     var queryResult = query.runSuiteQL({
                         query: leavesequencesql,
                     });
                     var leavesequencesqlrecords = queryResult.asMappedResults();
 
 
                     log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
                     if (leavesequencesqlrecords.length > 0) { */
                    var employee = leaverecord.getValue('custrecord_hris_lve_employeename');
                    var employeecompensql = "select * from customrecord_hris_employee_compen_change where custrecord_hris_empchange_employee_nam ='" + employee + "' and isinactive ='F'"

                    log.debug("employeecompensql", employeecompensql);
                    var queryResult = query.runSuiteQL({
                        query: employeecompensql,
                    });
                    var employeecompensqlrecords = queryResult.asMappedResults();


                    log.debug(" employeecompensqlrecords.length", employeecompensqlrecords.length);
                    if (employeecompensqlrecords.length == 0) {
                        alert('Selected Leave is connected with Payroll. And Pay Process Group is not defined for selected employee. Please contact HR team for further details !')
                        leaverecord.setValue({
                            fieldId: 'custrecord_hris_lve_employeename',
                            value: '',
                            ignoreFieldChange: true,
                            forceSyncSourcing: true
                        });
                        return false;
                        /*   var recordUrl = url.resolveRecord({
                              recordType: 'customrecord_hris_leaveapplication',
                              recordId: null,
                              isEditMode: true
                          });
 
                          window.onbeforeunload = null;
                          window.open(recordUrl, '_self');
 
                          window.location.reload(); */

                    }
                    //} 
                }
                // Encashement 
                if (scriptContext.fieldId == 'custrecord_hris_lve_noofencashmentdays') {
                    var applied_no_of_encashmentDays = leaverecord.getValue('custrecord_hris_lve_noofencashmentdays');
                    var total_avail_encash_days = leaverecord.getValue('custrecord_hris_total_encashable_balance') || 0;

                    var max_encashDays = leaverecord.getValue('custrecord_hris_lve_maxencashabledayalow') || 0;

                    applied_no_of_encashmentDays = parseFloat(applied_no_of_encashmentDays);

                    total_avail_encash_days = parseFloat(total_avail_encash_days);


                    if (parseFloat(applied_no_of_encashmentDays) > parseFloat(total_avail_encash_days)) {
                        alert('Encashment Balance low');
                        leaverecord.setValue('custrecord_hris_lve_noofencashmentdays', '', true, true);
                    }

                    if (parseFloat(applied_no_of_encashmentDays) > parseFloat(max_encashDays)) {
                        alert('You are allowed to Encash maximum ' + max_encashDays + ' days of leave');
                        leaverecord.setValue('custrecord_hris_lve_noofencashmentdays', '', true, true);
                    }

                }

                if (scriptContext.fieldId == 'custrecord_hris_lve_applylveencashment') {

                    var encash = leaverecord.getValue('custrecord_hris_lve_applylveencashment');
                    if (encash == true) {
                        var emp_id = leaverecord.getValue('custrecord_hris_lve_employeename');
                        var leave_type = leaverecord.getValue('custrecord_hris_lve_leavetype');


                        var leavebalancesql = "select * from customrecord_hris_leavebalance where custrecord_hris_lvbal_employee_name = '" + emp_id + "' and  custrecord_hris_lvbal_leave_type = '" + leave_type + "' and isinactive ='F'"
                        log.debug("leavebalancesql", leavebalancesql);
                        var queryResult = query.runSuiteQL({
                            query: leavebalancesql,
                        });
                        var leavebalancesqlrecords = queryResult.asMappedResults();


                        log.debug(" leavebalancesqlrecords.length", leavebalancesqlrecords.length);
                        if (leavebalancesqlrecords.length > 0) {

                            var encash_bal = leavebalancesqlrecords[0].custrecord_hris_lvbal_encashable_days || 0;

                            if (!encash_bal)
                                encash_bal = 0;

                            leaverecord.setValue('custrecord_hris_lve_encashmentlevbalance', encash_bal, true, true);

                            var leave_ball = leaverecord.getValue('custrecord_hris_lve_leavebalance');
                            var noOfDays = leaverecord.getValue('custrecord_hris_lve_totalnodays');

                            var remaining_bal = parseFloat(leave_ball) - parseFloat(noOfDays);

                            var total_avail_encash_days = parseFloat(encash_bal) + parseFloat(remaining_bal);
                            total_avail_encash_days = GetRoundOffvalue(total_avail_encash_days);

                            leaverecord.setValue('custrecord_hris_total_encashable_balance', total_avail_encash_days, true, true);



                        }


                    }
                }
                if (scriptContext.fieldId == 'custrecord_hris_lve_fromdate') {

                    var emp_name = leaverecord.getValue('custrecord_hris_lve_employeename');
                    var Leave_type = leaverecord.getValue('custrecord_hris_lve_leavetype') || '';
                    /* if(Leave_type == ''){
            
                        alert("Please Select Leave Type");
                        return false;
                            
                    } */
                    var from_date = leaverecord.getValue('custrecord_hris_lve_fromdate');
                    var seq_no = get_sequence_no(Leave_type);

                    // By Florence 
                    if (seq_no == 3) {
                        var isEmergency = leaverecord.getValue({ fieldId: 'custrecord_hris_leave_application_emerge' });
                        if (isEmergency !== true && isEmergency !== 'T') {
                            if (from_date) {
                                var today = new Date();
                                today.setHours(0, 0, 0, 0);

                                var checkFromDate = new Date(from_date);
                                checkFromDate.setHours(0, 0, 0, 0);

                                var noticeDiff = checkFromDate.getTime() - today.getTime();
                                var noticeDays = Math.floor(noticeDiff / (1000 * 3600 * 24));

                                if (noticeDays < 21) {
                                    alert('Standard Annual Leave must be applied for at least 21 days in advance. \n\n' +
                                        'Days notice provided: ' + noticeDays + ' days.');
                                    leaverecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '', ignoreFieldChange: true });
                                    leaverecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: true });
                                    return false;
                                }

                                // 3. VALIDATION: 90 days gap between Annual Leave applications
                                var lastLeaveEndDate = getLastLeaveDate(emp_name, Leave_type);
                                if (lastLeaveEndDate) {
                                    var previousToDate = new Date(lastLeaveEndDate);
                                    previousToDate.setHours(0, 0, 0, 0);

                                    var timeDiff = checkFromDate.getTime() - previousToDate.getTime();
                                    var gapDays = Math.floor(timeDiff / (1000 * 3600 * 24));

                                    if (gapDays < 90) {
                                        var formattedPrevDate = format.format({ value: previousToDate, type: format.Type.DATE });
                                        alert('Rule Violation: A minimum 90-day gap is required between Standard Annual Leave applications.\n\n' +
                                            'Your last Annual Leave ended on: ' + formattedPrevDate + '\n' +
                                            'Days since last leave: ' + gapDays + ' days.');
                                        leaverecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '', ignoreFieldChange: true });
                                        leaverecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: true });
                                        return false;
                                    }
                                }
                            }
                        }
                        /*   var passportQuery = "select max(a.custrecord_hris_date_exp) as expirydate from customrecord_hris_emp_id_info a  join customrecordhris_idcardmaster b on a.custrecord_hris_emp_id_type = b.id\
                      where  a.isinactive ='F' and b.custrecord_hris_idcard_seqno =2 and a.custrecord_hris_emp_link = "+ emp_name;
  
                          var queryResults = query.runSuiteQL({
                              query: passportQuery,
                          });
                          var passportQueryrecords = queryResults.asMappedResults();
                          // var visatextField = recordObj.getField("custpage_visaprocessingtext");
                          var expirydate = '';
                          if (passportQueryrecords.length > 0) {
                              var rec = passportQueryrecords[0];
                              expirydate = rec.expirydate || ''; */
                        var expirydate = gettingpassportexpirydate(emp_name);
                        if (expirydate != '') {

                            expirydate = format.parse({
                                value: expirydate,
                                type: format.Type.DATE
                            });
                            var compareDate = moment(from_date).add(9, 'months');
                            compareDate = format.parse({
                                value: compareDate,
                                type: format.Type.DATE
                            });

                            if (expirydate < compareDate) {

                                alert('You are allowed to take leave only if Passport should be valid minimum of 9months from the leave start date.')
                                //  leaverecord.setValue('custrecord_hris_lve_leavetype', '',true);
                                //  leaverecord.setValue('custrecord_hris_lve_fromdate', '', true)
                                leaverecord.setValue({
                                    fieldId: 'custrecord_hris_lve_fromdate',
                                    value: '',
                                    ignoreFieldChange: true,
                                    forceSyncSourcing: true
                                });



                                return false;


                            }



                        }
                        /*  var visaQuery = "select max(a.custrecord_hris_date_exp) as expirydate from customrecord_hris_emp_id_info a  join customrecordhris_idcardmaster b on a.custrecord_hris_emp_id_type = b.id \
                                                 where  a.isinactive ='F' and b.custrecord_hris_idcard_seqno =1 and a.custrecord_hris_emp_link = "+ emp_name;

                         var queryResults = query.runSuiteQL({
                             query: visaQuery,
                         });
                         var visaQueryrecords = queryResults.asMappedResults();
                         // var visatextField = recordObj.getField("custpage_visaprocessingtext");
                         var expirydate = '';
                         if (visaQueryrecords.length > 0) {
                             var rec = visaQueryrecords[0];
                             expirydate = rec.expirydate || ''; */
                        var expirydate = gettingvisaexpirydate(emp_name)
                        if (expirydate != '') {

                            expirydate = format.parse({
                                value: expirydate,
                                type: format.Type.DATE
                            });
                            var compareDate = moment(from_date).add(75, 'days');
                            compareDate = format.parse({
                                value: compareDate,
                                type: format.Type.DATE
                            });                            if (expirydate < compareDate) {

                                alert('You are allowed to take leave only if the visa is valid for at least 75days from leave start date..')
                                //     leaverecord.setValue('custrecord_hris_lve_fromdate', '', true)
                                //     leaverecord.setValue('custrecord_hris_lve_leavetype', '', true);
                                leaverecord.setValue({
                                    fieldId: 'custrecord_hris_lve_fromdate',
                                    value: '',
                                    ignoreFieldChange: true,
                                    forceSyncSourcing: true
                                });
                                return false;


                            }


                        }

                    }

                    var leave_bal = leaverecord.getValue('custrecord_hris_lve_leavebalance');

                    var sequence_value = get_sequence_no(Leave_type);
                    log.debug("sequence_value compoff", sequence_value);
                    if (sequence_value == 5) {
                        leaverecord.setValue('custrecord_hris_lve_todate', from_date)
                        log.debug("From date to to date", from_date);
                        //  nlapiDisableField('custrecord_hris_lve_todate',true);
                        leaverecord.getField({ fieldId: 'custrecord_hris_lve_todate' }).isDisabled = true;
                        if (leave_bal < 1) {
                            leaverecord.setValue('custrecord_hris_lve_totalnodays', leave_bal, false)
                        }
                        if (leave_bal >= 1) {
                            leaverecord.setValue('custrecord_hris_lve_totalnodays', 1, false)
                        }
                        var to_date = leaverecord.getValue('custrecord_hris_lve_todate');



                        var compoffsql = "select min(custrecord_hris_rcomp_valid_till_date) validdate from customrecord_hris_lve_raise_comp_off where custrecord_hris_rcomp_employee_name ='" + emp_name + "' and custrecord_hris_rcomp_valid_till_date is not null"
                        log.debug("compoffsql", compoffsql);
                        var queryResult = query.runSuiteQL({
                            query: compoffsql,
                        });
                        var compoffsqlrecords = queryResult.asMappedResults();


                        log.debug(" compoffsqlrecords.length", compoffsqlrecords.length);
                        if (compoffsqlrecords.length > 0) {


                            valid_till_date = compoffsqlrecords[0].validdate || '';

                            if (valid_till_date != '') {

                                valid_till_date = format.parse({
                                    value: valid_till_date,
                                    type: format.Type.DATE
                                });

                            }
                            from_date = format.parse({
                                value: from_date,
                                type: format.Type.DATE
                            });
                            to_date = format.parse({
                                value: to_date,
                                type: format.Type.DATE
                            });
                        }

                    }
                    // Validate Leave year Field change for unpaid leave entry backdated months
                    var leaveType = leaverecord.getValue("custrecord_hris_lve_leavetype");

                    var leaveType_seq = get_sequence_no(leaveType);
                    //  var userRole = nlapiGetRole();
                    var userRole = runtime.getCurrentUser().role;
                    if (leaveType && (leaveType_seq == 2 || leaveType_seq == 13) && userRole != 1217) {
                        var date = new Date();
                        var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                        var d_startDate = leaverecord.getValue("custrecord_hris_lve_fromdate");
                        if (d_startDate) {
                            //d_startDate = nlapiStringToDate(d_startDate);
                            d_startDate = format.parse({
                                value: d_startDate,
                                type: format.Type.DATE
                            });
                            if (d_startDate < firstDay) {
                                alert(
                                    "You are not allowed to apply Unpaid Leave for back dated months. Please contact to HR team"
                                );
                                leaverecord.getValue("custrecord_hris_lve_fromdate", "", false);
                                return false;
                            }
                        }
                    }

                    return true;
                }
                // Set Month Year Coding
                if (scriptContext.fieldId == "custrecord_hris_lve_todate") {
                    var toDate = leaverecord.getValue("custrecord_hris_lve_todate");
                    var fromdate = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_fromdate'
                    }) || '';
                    log.debug('fromdate', fromdate);
                    var todate = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_todate'
                    }) || '';
                    log.debug('todate', todate);


                    if (toDate) {

                        toDate = format.parse({
                            value: toDate,
                            type: format.Type.DATE
                        });


                        toDate = moment(toDate).add(1, 'days').format('DD/MM/YYYY')

                        toDate = format.parse({
                            value: toDate,
                            type: format.Type.DATE
                        });

                        leaverecord.setValue("custrecord_hris_lve_expectedresumebackdt", toDate, true, true);
                        leaverecord.setValue("custrecord_hris_lve_expectresback_dtorig", toDate, true, true);
                    } else {
                        leaverecord.setValue("custrecord_hris_lve_expectedresumebackdt", "", true, true);
                        leaverecord.setValue("custrecord_hris_lve_expectresback_dtorig", "", true, true);
                    }
                }
                if (scriptContext.fieldId == "custrecord_hris_lve_actualresumedate") {
                    var todayDate = new Date();
                    var totalDelayDays = leaverecord.getValue(
                        "custrecord_hris_lve_actualresumedate"
                    );
                    var from_date = leaverecord.getValue("custrecord_hris_lve_fromdate");
                    //  from_date = nlapiStringToDate(from_date);
                    from_date = format.parse({
                        value: from_date,
                        type: format.Type.DATE
                    });

                    var expectedResumeDate = leaverecord.getValue(
                        "custrecord_hris_lve_expectedresumebackdt"
                    );

                    if (totalDelayDays && totalDelayDays != "" && totalDelayDays != null) {


                        {


                            var fromDate = leaverecord.getValue(
                                "custrecord_hris_lve_expectedresumebackdt"
                            );
                            var toDate = leaverecord.getValue("custrecord_hris_lve_actualresumedate");

                            var leave_type = leaverecord.getValue("custrecord_hris_lve_leavetype");
                            totalDelayDays = moment(totalDelayDays);
                            expectedResumeDate = moment(expectedResumeDate);

                            // Calculate the difference in days between the two dates
                            var daysDiff = totalDelayDays.diff(expectedResumeDate, 'days');
                            leaverecord.setValue("custrecord_hris_lve_actualtotdelaydays", daysDiff, true, true);
                        }
                    } else {
                        leaverecord.setValue(
                            "custrecord_hris_lve_actualtotdelaydays",
                            "",
                            true,
                            true
                        );
                    }

                    if (from_date && totalDelayDays) {
                        if (totalDelayDays <= from_date) {
                            alert(
                                "You can not Select Work resume as Leave From Date or Less then Leave From Date"
                            );
                            leaverecord.setValue(
                                "custrecord_hris_lve_actualresumedate",
                                "",
                                false,
                                false
                            );
                            leaverecord.setValue(
                                "custrecord_hris_lve_actualtotdelaydays",
                                "",
                                false,
                                false
                            );
                        }
                    }
                }



                if (scriptContext.fieldId == "custrecord_hris_lve_airticketrequired") {
                    var airTicketAllChkbox = leaverecord.getValue(
                        "custrecord_hris_lve_airticketrequired"
                    );
                    var emp_Id = leaverecord.getValue("custrecord_hris_lve_employeename");
                    var fromDate = leaverecord.getValue("custrecord_hris_lve_fromdate");
                    var leaveType = leaverecord.getValue("custrecord_hris_lve_leavetype");
                    /* var E_leavetype = leaverecord.getValue('custrecord_hris_lve_leavetype');
                 
                   //Extract External ID
                  var leaveType = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');*/

                    var LeaveConfigRecord = record.load({
                        type: 'customrecord_hris_leaveconfig',
                        id: leaveType,
                        isDynamic: true
                    });
                    /*  var b_allowRotation = nlapiLookupField(
                       "customrecord_hris_leaveconfig",
                       leaveType,
                       "custrecord_hris_lveconfig_rotationlve"
                     ); */
                    var b_allowRotation = LeaveConfigRecord.getValue('custrecord_hris_lveconfig_rotationlve');
                    if (fromDate) {
                        // fromDate = nlapiStringToDate(fromDate);
                        fromDate = format.parse({
                            value: fromDate,
                            type: format.Type.DATE
                        });
                        var year = fromDate.getFullYear();
                        year = year.toString();
                        var YearId = searchYear(year);
                        if (airTicketAllChkbox == true) {


                            var monthlysalarysql = "select * from  customrecord_hris_monthlysalinput a join customrecord_hris_payroll_component\
                               b  on a.custrecord_hris_mthsal_paycomponent =b.id where a.custrecord_hris_mthsal_empname ='" + emp_Id + "' and \
                               b.custrecord_hris__sequence_no_ =36 and a.isinactive ='F' and custrecord_hris_mthsal_year = " + YearId;
                            log.debug("monthlysalarysql", monthlysalarysql);
                            var queryResult = query.runSuiteQL({
                                query: monthlysalarysql,
                            });
                            var monthlysalarysqlrecords = queryResult.asMappedResults();


                            log.debug(" monthlysalarysqlrecords.length", monthlysalarysqlrecords.length);
                            if (monthlysalarysqlrecords.length > 0 && b_allowRotation == false) {

                                alert(
                                    "You have already availed Air Ticket Allowance for the Year " + year
                                );
                                leaverecord.setValue(
                                    "custrecord_hris_lve_airticketrequired",
                                    false,
                                    false,
                                    false
                                );
                            }
                        }
                    } else {
                        alert("Please enter From Date and To Date first");
                        leaverecord.setValue(
                            "custrecord_hris_lve_airticketrequired",
                            false,
                            false,
                            false
                        );
                    }
                }
                if (scriptContext.fieldId === 'custrecord_hris_leave_application_emerge') {
                    var isEmergency = leaverecord.getValue('custrecord_hris_leave_application_emerge');
                    var fromdate = leaverecord.getValue('custrecord_hris_lve_fromdate');
                    var todate = leaverecord.getValue('custrecord_hris_lve_todate');
                    var leavetype = leaverecord.getValue('custrecord_hris_lve_leavetype') || '';
                    var Leave_type_seqno = get_sequence_no(leavetype);

                    if (Leave_type_seqno == 3 && fromdate && todate) {
                        var totaldays = leaverecord.getValue('custrecord_hris_lve_totalnodays') || 0;
                        if (isEmergency == true || isEmergency == 'T') {
                            if (totaldays > 7) {
                                alert('Emergency Annual Leave cannot exceed 7 calendar days.');
                                leaverecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: true });
                                leaverecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: '', ignoreFieldChange: true });
                            }
                        } else {
                            if (totaldays > 12) {
                                alert('Standard Annual Leave duration cannot exceed 12 calendar days.');
                                leaverecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: true });
                                leaverecord.setValue({ fieldId: 'custrecord_hris_lve_totalnodays', value: '', ignoreFieldChange: true });
                                return false;
                            }

                            var today = new Date();
                            today.setHours(0, 0, 0, 0);
                            var checkFromDate = new Date(fromdate);
                            checkFromDate.setHours(0, 0, 0, 0);

                            var noticeDiff = checkFromDate.getTime() - today.getTime();
                            var noticeDays = Math.floor(noticeDiff / (1000 * 3600 * 24));

                            if (noticeDays < 21) {
                                alert('Standard Annual Leave must be applied for at least 21 days in advance. \n\n' +
                                    'Days notice provided: ' + noticeDays + ' days.');
                                leaverecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '', ignoreFieldChange: true });
                                leaverecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: true });
                                return false;
                            }

                            var empname = leaverecord.getValue('custrecord_hris_lve_employeename') || '';
                            var lastLeaveEndDate = getLastLeaveDate(empname, leavetype);
                            if (lastLeaveEndDate) {
                                var previousToDate = new Date(lastLeaveEndDate);
                                previousToDate.setHours(0, 0, 0, 0);

                                var timeDiff = checkFromDate.getTime() - previousToDate.getTime();
                                var gapDays = Math.floor(timeDiff / (1000 * 3600 * 24));

                                if (gapDays < 90) {
                                    var formattedPrevDate = format.format({ value: previousToDate, type: format.Type.DATE });
                                    alert('Rule Violation: A minimum 90-day gap is required between Standard Annual Leave applications.\n\n' +
                                        'Your last Annual Leave ended on: ' + formattedPrevDate + '\n' +
                                        'Days since last leave: ' + gapDays + ' days.');
                                    leaverecord.setValue({ fieldId: 'custrecord_hris_lve_fromdate', value: '', ignoreFieldChange: true });
                                    leaverecord.setValue({ fieldId: 'custrecord_hris_lve_todate', value: '', ignoreFieldChange: true });
                                    return false;
                                }
                            }
                        }
                    }
                }
                // Finished Setmonth year

            }
            catch (e) {
                log.debug("error in fieldchange : " + e);

            }

        }

        function searchYear(year) {
            try {
                var yearVal = "";
                var yearsql = "select  id as internalid  from  customlist_hris_year_master  where name = " + year;
                var yearsqlrecord = getResult(yearsql);
                log.debug('yearsql', yearsql)
                if (yearsqlrecord.length > 0) {
                    for (r = 0; r < yearsqlrecord.length; r++) {
                        var yearVal = yearsqlrecord[r].internalid || 0;

                    }
                }
                log.debug("yearVal in SearchYear  Func", yearVal);
                return yearVal;
            }
            catch (e) {
                log.debug("error in searchyear : " + e);

            }

        }
        function getemployeecatagorysequence(empcatagoryid) {
            try {
                var empcatagorysql = "select * from customrecord_hris_employeecategory where id=" + empcatagoryid;
                log.debug('empcatagorysql', empcatagorysql);

                //var empcatagorysqlrecords = getResult(empcatagorysql);
                var queryResults = query.runSuiteQL({
                    query: empcatagorysql
                });
                log.debug("empcatagorysql", empcatagorysql);
                var empcatagorysqlrecords = queryResults.asMappedResults();

                if (empcatagorysqlrecords.length > 0) {
                    var empcatid = empcatagorysqlrecords[0].custrecord_hris_empcat_seqno;
                    var noofdays = empcatagorysqlrecords[0].custrecord_hris_empcat_noofdays;
                    var airticketcal = empcatagorysqlrecords[0].custrecord_hris_empcat_airticket;
                }
                return empcatid + "#" + noofdays + "#" + airticketcal;

            }
            catch (e) {
                log.error("Error in getemployeecatagorysequence", e);
                // log.debug("Error in getEmpTotalLeaveTaken : " + e);
            }
        }
        function get_sequence_no(Leave_type) {
            try {

                var leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + Leave_type + "' and isinactive ='F'"
                log.debug("leavesequencesql", leavesequencesql);
                var queryResult = query.runSuiteQL({
                    query: leavesequencesql,
                });
                var leavesequencesqlrecords = queryResult.asMappedResults();


                log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
                if (leavesequencesqlrecords.length > 0) {


                    var sequence_no = leavesequencesqlrecords[0].custrecord_hris_lvecnfg_seqno;
                }
                return sequence_no;
            }
            catch (e) {
                log.debug("error in get_sequence_no : " + e);

            }

        }

        function get_leaveaccuralcheck(Leave_type) {
            try {

                var leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + Leave_type + "' and isinactive ='F'"
                log.debug("leavesequencesql", leavesequencesql);
                var queryResult = query.runSuiteQL({
                    query: leavesequencesql,
                });
                var leavesequencesqlrecords = queryResult.asMappedResults();


                log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
                if (leavesequencesqlrecords.length > 0) {


                    var accuralcheck = leavesequencesqlrecords[0].custrecord_hris_lvecfg_accuralcheck;
                }
                return accuralcheck;
            }
            catch (e) {
                log.debug("error in get_leaveaccuralcheck : " + e);

            }

        }
        function proratecheck(Leave_type) {
            try {
                var proratacheck = 'F'
                var leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + Leave_type + "' and isinactive ='F'"
                log.debug("leavesequencesql", leavesequencesql);
                var queryResult = query.runSuiteQL({
                    query: leavesequencesql,
                });
                var leavesequencesqlrecords = queryResult.asMappedResults();


                log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
                if (leavesequencesqlrecords.length > 0) {


                    proratacheck = leavesequencesqlrecords[0].custrecord_hris_lvecfg_pro_rata;
                }
                return proratacheck;
            }
            catch (e) {
                log.debug("error in proratecheck : " + e);

            }

        }
        function gettingpassportexpirydate(emp_name) {
            try {
                var expirydate = '';
                var passportQuery = "select max(a.custrecord_hris_date_exp) as expirydate from customrecord_hris_emp_id_info a  join customrecordhris_idcardmaster b on a.custrecord_hris_emp_id_type = b.id\
                where  a.isinactive ='F' and b.custrecord_hris_idcard_seqno =2 and a.custrecord_hris_emp_link = "+ emp_name;

                var queryResults = query.runSuiteQL({
                    query: passportQuery,
                });
                var passportQueryrecords = queryResults.asMappedResults();
                // var visatextField = recordObj.getField("custpage_visaprocessingtext");
                var expirydate = '';
                if (passportQueryrecords.length > 0) {
                    var rec = passportQueryrecords[0];
                    expirydate = rec.expirydate || '';
                }
                return expirydate;
            }
            catch (e) {
                log.debug("error in gettingpassportexpirydate : " + e);

            }
        }
        function gettingvisaexpirydate(emp_name) {
            debugger;
            try {
                var expirydate = '';
                var visaQuery = "select max(a.custrecord_hris_date_exp) as expirydate from customrecord_hris_emp_id_info a  join customrecordhris_idcardmaster b on a.custrecord_hris_emp_id_type = b.id \
                where  a.isinactive ='F' and b.custrecord_hris_idcard_seqno =1 and a.custrecord_hris_emp_link = "+ emp_name;

                var queryResults = query.runSuiteQL({
                    query: visaQuery,
                });
                var visaQueryrecords = queryResults.asMappedResults();
                // var visatextField = recordObj.getField("custpage_visaprocessingtext");
                // var expirydate = '';
                if (visaQueryrecords.length > 0) {
                    var rec = visaQueryrecords[0];
                    expirydate = rec.expirydate || '';
                }
                return expirydate;
            }
            catch (e) {
                log.debug("error in gettingvisatexpirydate : " + e);

            }

        }
        function gettingempcatagorysequence(empname) {
            try {
                var empQuery = "select b.id as empcatagoryid ,b.custrecord_hris_empcat_seqno as seqno from employee  a join\
            customrecord_hris_employeecategory b on  a.custentity_hris_empcategory = b.id where a.id =" + empname + " and b.isinactive='F'"

                var queryResults = query.runSuiteQL({
                    query: empQuery,
                });
                var empQueryrecords = queryResults.asMappedResults();
                // var visatextField = recordObj.getField("custpage_visaprocessingtext");

                if (empQueryrecords.length > 0) {
                    var rec = empQueryrecords[0];
                    var empcatagory = rec.seqno;
                }
                return empcatagory;
            }
            catch (e) {
                log.debug("error in gettingempcatagorysequence : " + e);

            }

        }
        function gettingvisarenewaldate(emp_name) {
            try {
                var renewaldate = '';
                var visaQuery = "select max(a.custrecord_hris_date_issue) as renewaldate from customrecord_hris_emp_id_info a  join \
                            customrecordhris_idcardmaster b on a.custrecord_hris_emp_id_type = b.id \
                              where  a.isinactive ='F' and b.custrecord_hris_idcard_seqno =1 and a.custrecord_hris_emp_link = "+ emp_name;

                var queryResults = query.runSuiteQL({
                    query: visaQuery,
                });
                var visaQueryrecords = queryResults.asMappedResults();
                // var visatextField = recordObj.getField("custpage_visaprocessingtext");
                var renewaldate = '';
                if (visaQueryrecords.length > 0) {
                    var rec = visaQueryrecords[0];
                    renewaldate = rec.renewaldate || '';
                }
                return renewaldate;
            }

            catch (e) {
                log.debug("error in gettingvisarenewaldate : " + e);

            }
        }
        function gettingemployeerejoindate(empname) {
            try {
                var rejoindate = '';
                var empQuery = "select b.id as empcatagoryid ,b.custrecord_hris_empcat_seqno as seqno,a.custentity_hris_rejoin_date as rejoindate from employee  a join\
                customrecord_hris_employeecategory b on  a.custentity_hris_empcategory = b.id where a.id =" + empname + " and b.isinactive='F'"

                var queryResults = query.runSuiteQL({
                    query: empQuery,
                });
                var empQueryrecords = queryResults.asMappedResults();
                // var visatextField = recordObj.getField("custpage_visaprocessingtext");

                if (empQueryrecords.length > 0) {
                    var rec = empQueryrecords[0];
                    rejoindate = rec.rejoindate || '';
                }
                return rejoindate;
            }
            catch (e) {
                log.debug("error in gettingemployeerejoindate : " + e);

            }
        }
        function check_rotation(Leave_type) {
            try {
                var leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + Leave_type + "' and isinactive ='F'"
                log.debug("leavesequencesql", leavesequencesql);
                var queryResult = query.runSuiteQL({
                    query: leavesequencesql,
                });
                var leavesequencesqlrecords = queryResult.asMappedResults();


                log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
                if (leavesequencesqlrecords.length > 0) {


                    var rotation = leavesequencesqlrecords[0].custrecord_hris_lveconfig_rotationlve;
                }
                return rotation;
            }
            catch (e) {
                log.debug("error in check_rotation : " + e);

            }

        }
        function GetRoundOffvalue(finalAnnual) {
            var final_days = finalAnnual;
            log.debug(
                "final_days************************************" + final_days
            );
            var rounded_final_value;
            var split_final_days = new Array();

            split_final_days = final_days.toString().split(".");

            var integer_no = split_final_days[0];
            log.debug("integer_no************************************" + integer_no);

            var i_decimal_val = split_final_days[1];
            log.debug(
                "i_decimal_val************************************" + i_decimal_val
            );



            var compare_no = "0" + "." + i_decimal_val;
            log.debug(
                "typeof(compare_no)" + typeof compare_no,
                "compare_no************************************" + compare_no
            );
            rounded_final_value = parseFloat(integer_no);



            log.debug(
                "rounded_final_value************************************" +
                rounded_final_value
            );
            return rounded_final_value;
        }
        function searchLeaveBalanceold(empInternalId, query, empHireDateObj, format, moment, dateConsidered, currentdate, leavetype) {
            debugger;
            try {
                var result = [];
                var finalleavebal = 0;
                var leavebalancesql = "select * from customrecord_hris_leavebalance where custrecord_hris_lvbal_employee_name = '" + empInternalId + "' and  custrecord_hris_lvbal_leave_type = '" + leavetype + "' and isinactive ='F'"
                log.debug("leavebalancesql", leavebalancesql);
                var queryResult = query.runSuiteQL({
                    query: leavebalancesql,
                });
                var leavebalancesqlrecords = queryResult.asMappedResults();


                log.debug(" leavebalancesqlrecords.length", leavebalancesqlrecords.length);
                if (leavebalancesqlrecords.length > 0) {
                    var obdate = leavebalancesqlrecords[0].custrecord_hris_lvbal_obdate;
                    var obleavebalance = leavebalancesqlrecords[0].custrecord_hris_lvbal_openingbalance || 0;
                    var leavebalcredited = leavebalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_cred || 0;
                    var leavebaltaken = leavebalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_take || 0;
                    var availableleavebal = leavebalancesqlrecords[0].custrecord_hris_lvbal_available_leave_ba || 0;

                    var leavebalid = leavebalancesqlrecords[0].id;
                    log.debug('Leavebalance Id', leavebalid);
                    //  var diffDays = currentdate.diff(empHireDateObj, 'days');          
                    log.debug('Emphiredateobj', empHireDateObj);
                    //  var diffDays = moment.duration(currentdate.diff(empHireDateObj));
                    // Convert JavaScript Date objects to Moment.js objects
                    var currentMoment = moment(currentdate);
                    var dateConsideredMoment = moment(dateConsidered);

                    // Calculate the difference in days between the two dates
                    var diffDays = currentMoment.diff(dateConsideredMoment, 'days');
                    log.debug("Diff Days", diffDays);
                    var leaveBalance = diffDays * 0.08219;
                    log.debug('LeaveBalance', leaveBalance);
                    finalleavebal = parseFloat(obleavebalance) + parseFloat(leaveBalance) - parseFloat(leavebaltaken);
                    log.debug('finalleavebal', finalleavebal);
                    /*  result.push({
                         "finalleavebal": finalleavebal,
     
                     }); */


                }
                return finalleavebal;
            }
            catch (e) {
                log.debug("error in search leave balance : " + e);

            }

        }
        function searchLeaveBalance(empInternalId, query, empHireDateObj, format, moment, dateConsidered, currentdate, leavetype) {
            //debugger;
            var result = [];
            var finalleavebal = 0;
            // var leavebalancesql = "select * from customrecord_hris_leavebalance where custrecord_hris_lvbal_employee_name = '" + empInternalId + "' and  custrecord_hris_lvbal_leave_type = '"+leavetype+"' and isinactive ='F'"

            var leavebalancesql = "select a.*,b.custrecord_hris_lvecfg_accuraldays as accuraldays from customrecord_hris_leavebalance a join customrecord_hris_leaveconfig b on a.custrecord_hris_lvbal_leave_type=b.id\
            where a.custrecord_hris_lvbal_employee_name = '" + empInternalId + "'and a.custrecord_hris_lvbal_leave_type = '" + leavetype + "'  and a.isinactive ='F'\
            and b.custrecord_hris_lvecnfg_seqno = 3 "


            log.debug("leavebalancesql", leavebalancesql);
            var queryResult = query.runSuiteQL({
                query: leavebalancesql,
            });
            var leavebalancesqlrecords = queryResult.asMappedResults();


            log.debug(" leavebalancesqlrecords.length", leavebalancesqlrecords.length);
            if (leavebalancesqlrecords.length > 0) {
                var obdate = leavebalancesqlrecords[0].custrecord_hris_lvbal_obdate;
                var obleavebalance = leavebalancesqlrecords[0].custrecord_hris_lvbal_openingbalance || 0;
                var leavebalcredited = leavebalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_cred || 0;
                var leavebaltaken = leavebalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_take || 0;
                var availableleavebal = leavebalancesqlrecords[0].custrecord_hris_lvbal_available_leave_ba || 0;
                var accuraldays = leavebalancesqlrecords[0].accuraldays || 1;
                var leavebalid = leavebalancesqlrecords[0].id;
                log.debug('Leavebalance Id', leavebalid);
                //  var diffDays = currentdate.diff(empHireDateObj, 'days');          
                log.debug('Emphiredateobj', empHireDateObj);
                //  var diffDays = moment.duration(currentdate.diff(empHireDateObj));
                // Convert JavaScript Date objects to Moment.js objects
                var currentMoment = moment(currentdate);
                var dateConsideredMoment = moment(dateConsidered);

                // Calculate the difference in days between the two dates
                var diffDays = currentMoment.diff(dateConsideredMoment, 'days');
                log.debug("Diff Days", diffDays);
                // diffDays = diffDays + 1;
                // var leaveBalance = diffDays * 0.08219;
                var leaveBalance = diffDays * (accuraldays);
                log.debug('LeaveBalance', leaveBalance);
                finalleavebal = parseFloat(obleavebalance) + parseFloat(leaveBalance) - parseFloat(leavebaltaken);
                log.debug('finalleavebal', finalleavebal);
                /*  result.push({
                     "finalleavebal": finalleavebal,
 
                 }); */
                return finalleavebal;

            }
        }
        function gettingemergencyleavedays(empname, leavetype, fromdateyear) {
            try {
                var emergencysql = "SELECT NVL(SUM(a.custrecord_hris_lve_totalnodays), 0) AS totdays,\
    EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate) as  leave_year FROM customrecord_hris_leaveapplication a JOIN customrecord_hris_leaveconfig b ON a.custrecord_hris_lve_leavetype = b.id  \
   WHERE a.custrecord_hris_lve_employeename = "+ empname + " and a.custrecord_hris_lve_leavetype =" + leavetype + " and EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate)=" + fromdateyear + "\
    and a.custrecord_hris_lve_hrmsapprovalstatus =2 and custrecord_hris_lve_cancellation='F' GROUP BY  EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate)"


                var queryResults = query.runSuiteQL({
                    query: emergencysql
                });
                var emergencysqlrecord = queryResults.asMappedResults();
                log.debug('emergencysql', emergencysql)
                log.debug(' emergencysql.length * ', emergencysql.length);
                var totalnodays = 0;
                if (emergencysql.length > 0) {
                    totalnodays = emergencysqlrecord[0].totdays || 0;
                }
                return totalnodays;
            } catch (e) {
                log.error("Error in gettingemergencyleavedays", e);

            }
        }

        function gettingannualleavedays(empname, leavetype, fromdateyear) {
            try {

                var annualsql = "SELECT NVL(SUM(a.custrecord_hris_lve_totalnodays), 0) AS totdays,\
        EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate) as  leave_year FROM customrecord_hris_leaveapplication a JOIN customrecord_hris_leaveconfig b ON a.custrecord_hris_lve_leavetype = b.id  \
       WHERE a.custrecord_hris_lve_employeename = "+ empname + " and a.custrecord_hris_lve_leavetype =" + leavetype + " and EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate)=" + fromdateyear + "\
        and a.custrecord_hris_lve_hrmsapprovalstatus =2 and custrecord_hris_lve_cancellation='F' GROUP BY  EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate)"


                var queryResults = query.runSuiteQL({
                    query: annualsql
                });
                var annualsqlrecord = queryResults.asMappedResults();
                log.debug('annualsql', annualsql)
                log.debug(' annualsql.length * ', annualsql.length);
                var totalnodays = 0;
                if (annualsqlrecord.length > 0) {
                    totalnodays = annualsqlrecord[0].totdays || 0;
                }
                return totalnodays;
            }
            catch (e) {
                log.error("Error in gettingannualleavedays", e);

            }
        }
        function gettingleaverejoindate(Leave_type, emp_name, format) {
            try {
                var rejoindate = '';
                /*              var leaveQuery = "select * from customrecord_hris_leaveapplication  where custrecord_hris_lve_leavetype = " + Leave_type + "\
                     and custrecord_hris_lve_workresume ='T' and  isinactive ='F'and custrecord_hris_lve_employeename ="+ emp_name;
              */
                var leaveQuery = "select * from customrecord_hris_leaveapplication a  join  customrecord_hris_leaveconfig b on a.custrecord_hris_lve_leavetype=b.id   where a.custrecord_hris_lve_leavetype = " + Leave_type + "\
        and a.custrecord_hris_lve_workresume ='T' and  a.isinactive ='F'and  b.custrecord_hris_lvecnfg_seqno =3  and a.custrecord_hris_lve_employeename ="+ emp_name;

                var queryResults = query.runSuiteQL({
                    query: leaveQuery,
                });
                var leaveQueryrecords = queryResults.asMappedResults();
                // var visatextField = recordObj.getField("custpage_visaprocessingtext");

                if (leaveQueryrecords.length > 0) {
                    var rec = leaveQueryrecords[0];
                    rejoindate = rec.custrecord_hris_lve_actualresumedate;
                    rejoindate = format.parse({
                        value: rejoindate,
                        type: format.Type.DATE
                    });
                }
                return rejoindate
            }
            catch (e) {
                log.error("Error in gettingleaverejoindate", e);

            }
        }
        function getEmployeeStatus(empID) {
            try {
                var result = [];
                var empStatus = '';
                var empJoinDate = '';
                /*   var empStatusSQL = "SELECT  CASE WHEN (TO_DATE('" + toDate + "','DD/MM/YYYY') <= TO_DATE(custentity_hris_empjobconfirmationdt,'DD/MM/YYYY')) OR (TO_DATE('" + fromDate + "','DD/MM/YYYY') <= TO_DATE(custentity_hris_empjobconfirmationdt,'DD/MM/YYYY')) THEN 'In Probation' \
                  WHEN (TO_DATE('" + toDate + "','DD/MM/YYYY') > TO_DATE(custentity_hris_empjobconfirmationdt,'DD/MM/YYYY')) AND((TO_DATE('" + toDate + "','DD/MM/YYYY') - TO_DATE(hiredate,'DD/MM/YYYY')) <= 365) THEN 'Within 1 Year'  \
                  ELSE 'More than a Year' END AS empStatus, hiredate as empJoinDate\
                  FROM EMPLOYEE WHERE ID =  " + empID; */
                var empStatusSQL = "Select * from employee where id = " + empID + "  and isinactive ='F'";
                log.debug('empStatusSQL', empStatusSQL);
                console.log(empStatusSQL);
                var records = getResult(empStatusSQL);
                // log.debug('records in getEmployeeStatus', JSON.stringify(records));
                if (records.length > 0) {
                    var record = records[0];
                    // log.debug({ title: "record", details: record });
                    empStatus = record.custentity_emp_employee_job_status;
                    empJoinDate = record.hiredate;
                    result.push({
                        "empStatus": empStatus,
                        "empJoinDate": empJoinDate
                    });
                }
                return result;
            } catch (e) {
                log.error("Error in getEmployeeStatus", e);

            }
        }

        function getcompoffdate(ValidtillDate, EmployeeName) {
            var Compoff_Date = ''
            /* var filters = new Array();
            var columns = new Array();
        	
            filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_valid_till_date', null, 'on', ValidtillDate))
            filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_employee_name', null, 'is', EmployeeName))
        	
            columns.push(new nlobjSearchColumn('custrecord_hris_rcomp_comp_off_from_date'));
        	
            var compoff_recorddata_result = nlapiSearchRecord('customrecord_hris_lve_raise_comp_off', null, filters, columns);
        	
            if (compoff_recorddata_result != null) 
            {
        	
                Compoff_Date = compoff_recorddata_result[0].getValue('custrecord_hris_rcomp_comp_off_from_date')
            	
            }
         */
            var compoffsql = "select * from customrecord_hris_lve_raise_comp_off where custrecord_hris_rcomp_employee_name ='" + EmployeeName + "' and custrecord_hris_rcomp_valid_till_date ='" + ValidtillDate + "";
            log.debug("compoffsql", compoffsql);
            var queryResult = query.runSuiteQL({
                query: compoffsql,
            });
            var compoffsqlrecords = queryResult.asMappedResults();


            log.debug(" compoffsqlrecords.length", compoffsqlrecords.length);
            if (compoffsqlrecords.length > 0) {


                Compoff_Date = compoffsqlrecords[0].custrecord_hris_rcomp_comp_off_from_date || '';
            }
            return Compoff_Date;

        }
        function getEmployeeOBDetails(empInternalId, leavetype) {
            try {
                var result = [];
                var obdate = '';
                var obleavebalance = 0;
                var leaveobbalancesql = "select * from customrecord_hris_leavebalance where custrecord_hris_lvbal_employee_name = '" + empInternalId + "' and  custrecord_hris_lvbal_leave_type = '" + leavetype + "' and isinactive ='F'\
                                   AND custrecord_hris_lvbal_openingbalance  IS NOT NULL"
                log.debug("leaveobbalancesql", leaveobbalancesql);
                var queryResult = query.runSuiteQL({
                    query: leaveobbalancesql,
                });
                var leaveobbalancesqlrecords = queryResult.asMappedResults();


                log.debug(" leaveobbalancesqlrecords.length", leaveobbalancesqlrecords.length);
                if (leaveobbalancesqlrecords.length > 0) {
                    obdate = leaveobbalancesqlrecords[0].custrecord_hris_lvbal_obdate || '';
                    obleavebalance = leaveobbalancesqlrecords[0].custrecord_hris_lvbal_openingbalance || 0;
                    var leavebalcredited = leaveobbalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_cred || 0;
                    var leavebaltaken = leaveobbalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_take || 0;
                    var availableleavebal = leaveobbalancesqlrecords[0].custrecord_hris_lvbal_available_leave_ba || 0;

                    var leavebalid = leaveobbalancesqlrecords[0].id;
                    log.debug('Leavebalance Id', leavebalid);
                    result.push({
                        "obdate": obdate,
                        "obleavebalance": obleavebalance
                    });

                }
                return result;
            } catch (e) {
                log.error("Error in getEmployeeOBDetails", e);

            }
        }
        function getvalidations(LeaveTYPE) {
            var LeaveID = LeaveTYPE;
            /*    var filters = new Array();
               var columns = new Array();
             
               filters.push(new nlobjSearchFilter("internalid", null, "is", LeaveID));
             //  filters.push(new nlobjSearchFilter("externalid", null, "is", LeaveID));
               columns.push(new nlobjSearchColumn("custrecord_hris_lveconfig_levcarryforwrd"));
               columns.push(new nlobjSearchColumn("custrecord_hris_lvecfg_nextyrleaveapply"));
             
               var LeaveTypeConfSearch = nlapiSearchRecord(
                 "customrecord_hris_leaveconfig",
                 null,
                 filters,
                 columns
               );
             
               if (LeaveTypeConfSearch != null) {
                 var LC_CarryFwdCheck = LeaveTypeConfSearch[0].getValue(
                   "custrecord_hris_lveconfig_levcarryforwrd"
                 );
                 var LC_CarryFwddays = LeaveTypeConfSearch[0].getValue(
                   "custrecord_hris_lvecfg_nextyrleaveapply"
                 );
    */
            var leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + LeaveID + "' and isinactive ='F'";

            log.debug("leavesequencesql", leavesequencesql);
            var queryResult = query.runSuiteQL({
                query: leavesequencesql,
            });
            var leavesequencesqlrecords = queryResult.asMappedResults();


            log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
            if (leavesequencesqlrecords.length > 0) {
                var LC_CarryFwdCheck = leavesequencesqlrecords[0].custrecord_hris_lveconfig_levcarryforwrd;
                var LC_CarryFwddays = leavesequencesqlrecords[0].custrecord_hris_lvecfg_nextyrleaveapply;


                return LC_CarryFwdCheck + "," + LC_CarryFwddays;
            }
        }

        function getmonthno(Cal_Endmonth) {
            var M_No;
            if ((Cal_Endmonth = "January")) {
                M_No = "0";
            }
            if ((Cal_Endmonth = "February")) {
                M_No = "1";
            }
            if ((Cal_Endmonth = "March")) {
                M_No = "2";
            }
            if ((Cal_Endmonth = "April")) {
                M_No = "3";
            }
            if ((Cal_Endmonth = "May")) {
                M_No = "4";
            }
            if ((Cal_Endmonth = "June")) {
                M_No = "5";
            }
            if ((Cal_Endmonth = "July")) {
                M_No = "6";
            }
            if ((Cal_Endmonth = "August")) {
                M_No = "7";
            }
            if ((Cal_Endmonth = "September")) {
                M_No = "8";
            }
            if ((Cal_Endmonth = "October")) {
                M_No = "9";
            }
            if ((Cal_Endmonth = "November")) {
                M_No = "10";
            }
            if ((Cal_Endmonth = "December")) {
                M_No = "11";
            }
            return M_No;
        }

        function saveRecord(scriptContext) {
            debugger;
            try {

                var leaverecord = scriptContext.currentRecord;
                var Leave_Encashment = leaverecord.getValue(
                    "custrecord_hris_lve_applylveencashment"
                );

                if (Leave_Encashment == false) {
                    var date = leaverecord.getValue("custrecord_hris_lve_fromdate");
                    if (date) {
                        date = safeParseDate(date);
                        var month = date.getMonth() + 1;
                        var year = date.getFullYear();
                        leaverecord.setValue("custrecord_hris_lva_year", year, true, true);

                        leaverecord.setValue("custrecord_hris_lve_month", month, true, true);
                    }
                }
                // Compoff validate Checking
                var leave_type = leaverecord.getValue('custrecord_hris_lve_leavetype');
                if (leave_type) {

                    var EmployeeName = leaverecord.getValue('custrecord_hris_lve_employeename');
                    var fromDATE = leaverecord.getValue('custrecord_hris_lve_fromdate');
                    var SequenceNo = get_sequence_no(leave_type);
                    if (SequenceNo == '5') {
                        var ValidtillDate = leaverecord.getValue('custrecord_hris_lve_validtilldate');
                        var compoffDATE = getcompoffdate(ValidtillDate, EmployeeName);

                        compoffDATE = safeParseDate(compoffDATE);
                        fromDATE = safeParseDate(fromDATE);
                        if (fromDATE < compoffDATE) {
                            alert('You can not apply leave on before date of raise compoff date');
                            return false;
                        }

                    }

                }


                // Validate Leave Year Save Record
                var FromDate = leaverecord.getValue("custrecord_hris_lve_fromdate");
                var ToDate = leaverecord.getValue("custrecord_hris_lve_todate");
                var LeaveTYPE = leaverecord.getValue("custrecord_hris_lve_leavetype");
                var LeaveTYPE_text = leaverecord.getText("custrecord_hris_lve_leavetype");

                if (FromDate && ToDate) {
                    var FromDate_STRING = safeParseDate(FromDate);

                    var FromDate_YEAR = FromDate_STRING.getFullYear();

                    var ToDate_STRING = safeParseDate(ToDate);

                    var ToDate_YEAR = ToDate_STRING.getFullYear();

                    /*  var Fields = [
                       "custrecord_hris_lvecalyr_startyr",
                       "custrecord_hris_lvecalyr_endyr",
                       "custrecord_hris_lvecalyr_endmth",
                     ];
                     var CalenderYear_Record = nlapiLookupField(
                       "customrecord_hris_leave_calender_year",
                       1,
                       Fields,
                       true
                     ); */
                    var CalenderYear_Record = record.load({
                        type: 'customrecord_hris_leave_calender_year',
                        id: 1,
                        isDynamic: true,
                    });
                    var Cal_StartYear = CalenderYear_Record.getValue('custrecord_hris_lvecalyr_startyr');
                    var Cal_EndYear = CalenderYear_Record.getValue('custrecord_hris_lvecalyr_endyr');
                    var Cal_Endmonth = CalenderYear_Record.getValue('custrecord_hris_lvecalyr_endmth');
                    //Added by Florence
                    var Cal_StartYear_String = CalenderYear_Record.getText('custrecord_hris_lvecalyr_startyr');
                    var Cal_EndYear_String = CalenderYear_Record.getText('custrecord_hris_lvecalyr_endyr');

                    var monthNo = getmonthno(Cal_Endmonth);

                    var leavetypeSettings = getvalidations(LeaveTYPE);

                    var leavetypeSettings = leavetypeSettings.split(",");
                    var carryforwardCHECK = leavetypeSettings[0];
                    var carryforwardDAYS = leavetypeSettings[1];

                    if (ToDate_YEAR > Cal_StartYear_String || ToDate_YEAR > Cal_EndYear_String) {
                        if (carryforwardCHECK == "T") {
                            carryforwardDAYS = parseInt(carryforwardDAYS);

                            if (carryforwardDAYS == 0) {
                                carryforwardDAYS = "";
                            }

                            if (carryforwardDAYS != null || carryforwardDAYS != "") {
                                Cal_EndYear = parseInt(Cal_EndYear);
                                monthNo = parseInt(monthNo);

                                var lastDay = new Date(Cal_EndYear, monthNo + 1, 0);
                                var LastCarryFwd_DATE = moment(lastDay).add(carryforwardDAYS, 'days').toDate();
                                if (FromDate_STRING > LastCarryFwd_DATE) {
                                    alert(
                                        "You can apply " +
                                        LeaveTYPE_text +
                                        " for next year within " +
                                        carryforwardDAYS +
                                        " Days."
                                    );
                                    leaverecord.setValue("custrecord_hris_lve_todate", "", false);
                                    leaverecord.setValue("custrecord_hris_lve_fromdate", "", false);
                                    leaverecord.setValue("custrecord_hris_lve_leavetype", "", false);
                                    leaverecord.setValue("custrecord_hris_lve_leavebalance", "", false);
                                    leaverecord.setValue("custrecord_hris_lve_totalnodays", "", false);

                                    return false;
                                }
                                if (ToDate_STRING > LastCarryFwd_DATE) {
                                    alert(
                                        "You can apply " +
                                        LeaveTYPE_text +
                                        " for next year within " +
                                        carryforwardDAYS +
                                        " Days."
                                    );
                                    leaverecord.setValue("custrecord_hris_lve_todate", "", false);
                                    leaverecord.setValue("custrecord_hris_lve_fromdate", "", false);
                                    leaverecord.setValue("custrecord_hris_lve_leavetype", "", false);
                                    leaverecord.setValue("custrecord_hris_lve_leavebalance", "", false);
                                    leaverecord.setValue("custrecord_hris_lve_totalnodays", "", false);
                                    return false;
                                }
                            }
                            if (carryforwardDAYS == null || carryforwardDAYS == 0) {
                                return true;
                            }
                        }
                        if (carryforwardCHECK == "F") {
                            if (FromDate_YEAR > Cal_StartYear_String && FromDate_YEAR > Cal_EndYear_String) {
                                alert("You cannot Apply " + LeaveTYPE_text + " for Next Year");
                                leaverecord.setValue("custrecord_hris_lve_todate", "", false);
                                leaverecord.setValue("custrecord_hris_lve_fromdate", "", false);
                                leaverecord.setValue("custrecord_hris_lve_leavetype", "", false);
                                leaverecord.setValue("custrecord_hris_lve_leavebalance", "", false);
                                leaverecord.setValue("custrecord_hris_lve_totalnodays", "", false);
                                return false;
                            }
                            if (ToDate_YEAR > Cal_StartYear_String && ToDate_YEAR > Cal_EndYear_String) {
                                alert("You cannot Apply " + LeaveTYPE_text + " for Next Year");
                                leaverecord.setValue("custrecord_hris_lve_todate", "", false);
                                leaverecord.setValue("custrecord_hris_lve_fromdate", "", false);
                                leaverecord.setValue("custrecord_hris_lve_leavetype", "", false);
                                leaverecord.setValue("custrecord_hris_lve_leavebalance", "", false);
                                leaverecord.setValue("custrecord_hris_lve_totalnodays", "", false);
                                return false;
                            }
                        }
                    }
                }
                //save record if that checkbox is true then will appove the cancel status
                // ==================================================================================
                // NEW VALIDATION FOR ANNUAL LEAVE (SEQUENCE 3)
                // ==================================================================================
                var AnnualSeqCheck = get_sequence_no(LeaveTYPE);
                if (AnnualSeqCheck == '3' && FromDate && ToDate) {
                    var isEmergency = leaverecord.getValue('custrecord_hris_leave_application_emerge');
                    var totaldays = leaverecord.getValue('custrecord_hris_lve_totalnodays') || 0;

                    if (isEmergency == true || isEmergency == 'T') {
                        // Emergency Rule: Max 7 days limit only
                        if (totaldays > 7) {
                            alert('Emergency Annual Leave cannot exceed 7 calendar days.');
                            return false;
                        }
                    } else {
                        // Standard Rule: Max 12 days limit
                        if (totaldays > 12) {
                            alert('Standard Annual Leave duration cannot exceed 12 calendar days.');
                            return false;
                        }
                        // Standard Rule: 21 days advance notice
                        var today = new Date();
                        today.setHours(0, 0, 0, 0);
                        var checkFromDate = FromDate_STRING;
                        if (checkFromDate) {
                            checkFromDate.setHours(0, 0, 0, 0);
                            var noticeDiff = checkFromDate.getTime() - today.getTime();
                            var noticeDays = Math.floor(noticeDiff / (1000 * 3600 * 24));
                            if (noticeDays < 21) {
                                alert('Standard Annual Leave must be applied for at least 21 days in advance.');
                                return false;
                            }
                        }
                        // Standard Rule: 90 days gap
                        var empId = leaverecord.getValue('custrecord_hris_lve_employeename');
                        var lastLeaveEndDate = getLastLeaveDate(empId, LeaveTYPE);
                        if (lastLeaveEndDate && checkFromDate) {
                            var previousToDate = new Date(lastLeaveEndDate);
                            previousToDate.setHours(0, 0, 0, 0);
                            var gapDays = Math.floor((checkFromDate.getTime() - previousToDate.getTime()) / (1000 * 3600 * 24));
                            if (gapDays < 90) {
                                alert('Rule Violation: A minimum 90-day gap is required between Standard Annual Leave applications.');
                                return false;
                            }
                        }
                    }
                }

                return true;




            }
            catch (e) {
                console.log("error in saverecord : " + e);
                log.error("error in saverecord", e);
                alert("An unexpected error occurred: " + e.message + "\nPlease contact your administrator.");
                return false;
            }

        }






        function getResult(pSQL) {
            // log.debug("QUERY", pSQL);

            var queryResults = query.runSuiteQL({
                query: pSQL
            });
            var records = queryResults.asMappedResults();
            return records;
        }

        function safeParseDate(val) {
            if (!val) return null;
            if (val instanceof Date) return val;
            try {
                return format.parse({ value: val.toString(), type: format.Type.DATE });
            } catch (e) {
                return new Date(val);
            }
        }

        function getLastLeaveDate(empId, leaveTypeId) {
            debugger;
            var leaveSearch = search.create({
                type: 'customrecord_hris_leaveapplication',
                filters: [
                    ['custrecord_hris_lve_employeename', 'anyof', empId],
                    'AND',
                    ['custrecord_hris_lve_leavetype', 'anyof', leaveTypeId],
                    'AND',
                    ['custrecord_hris_lve_cancellation', 'is', 'F'] // Only consider records where cancellation is false
                ],
                columns: [
                    search.createColumn({ name: 'custrecord_hris_lve_fromdate', sort: search.Sort.DESC }), // Most recent From Date
                    search.createColumn({ name: 'custrecord_hris_lve_todate' })                          // Most recent To Date
                ]
            });

            var resultSet = leaveSearch.run().getRange({ start: 0, end: 1 });
            log.debug("resultSet", resultSet);

            if (resultSet && resultSet.length > 0) {
                var dateStr = resultSet[0].getValue({ name: 'custrecord_hris_lve_todate' });
                return format.parse({ value: dateStr, type: format.Type.DATE });
            }
            return null;
        }

        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
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






