/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/search', 'N/query', 'N/format', 'N/record', 'N/currentRecord', 'N/url', 'N/runtime', 'N/ui/serverWidget', './moment.js'],
    (search, query, format, record, currentRecord, url, runtime, serverWidget, moment) => {

    const CS_hris_annual_leave_cs = (() => {
define(['N/search', 'N/query', 'N/format', 'N/record', 'N/currentRecord', 'N/url', './moment.js', 'N/runtime'],
    function (search, query, format, record, currentRecord, url, moment, runtime) {


        function pageInit(scriptContext) {
           // debugger;
            try {

                let leaverecord = scriptContext.currentRecord;
                if (scriptContext.mode === 'create') {
                    let windowUrl = window.location.href;

                    let urlParams = new URL(windowUrl).searchParams;
                    let emp = urlParams.get('record.custrecord_hris_lve_employeename');

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

                let leaverecord = scriptContext.currentRecord;
                if (scriptContext.fieldId == 'custrecord_hris_lve_fromdate' || scriptContext.fieldId == 'custrecord_hris_lve_todate' || scriptContext.fieldId == 'custrecord_hris_lve_totalnodays') {
                    let fromdate = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_fromdate'
                    }) || '';
                    log.debug('fromdate', fromdate);
                    let todate = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_todate'
                    }) || '';
                    log.debug('todate', todate);


                    let approvalstatus = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_hrmsapprovalstatus'

                    });
                    let leavetype = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_leavetype'
                    }) || '';
                    log.debug('Leave Type', leavetype);
                    let Leave_type_seqno = get_sequence_no(leavetype);
                    // For Annual Leave Calculation

                    if (fromdate && approvalstatus != 2 && Leave_type_seqno == 3) {
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
                        let empDetails = [];



                        let empname = leaverecord.getValue({
                            fieldId: 'custrecord_hris_lve_employeename'
                        }) || '';
                        log.debug('Employee Name', empname);
                        empDetails = getEmployeeStatus(empname);
                        log.debug('empDetails', JSON.stringify(empDetails));
                        let empDetailsRecord = empDetails[0];
                        log.debug('empDetailsRecord', JSON.stringify(empDetailsRecord));
                        let empStatus = empDetailsRecord.empStatus;
                        let empJoinDate = empDetailsRecord.empJoinDate;
                        let empHireDateObj = format.parse({
                            value: empJoinDate,
                            type: format.Type.DATE,
                            //   timezone: format.Timezone.ASIA_MUSCAT
                        });
                        log.debug('empStatus', empStatus);
                        //if (empStatus == 3 && leavetype == 1) {
                        if (empStatus == 3) {
                            // let leavebalsearch = [];
                            let leavebalsearch = 0;
                            let obDetails = [];
                            let dateConsidered;
                            let finalleavebal = 0;
                            let obLeaveBalance = 0;


                            obDetails = getEmployeeOBDetails(empname, leavetype);
                            log.debug('obDetails', JSON.stringify(obDetails));
                            if (obDetails && obDetails.length > 0) {
                                //  If OB Date is present. Consider it for Calculation
                                let obDetailsecord = obDetails[0];
                                obLeaveBalance = obDetailsecord.obleavebalance;
                                let obDate = obDetailsecord.obdate;
                                let parsedOBDate = format.parse({
                                    value: obDate,
                                    type: format.Type.DATE,
                                    // timezone: format.Timezone.ASIA_MUSCAT
                                });
                                // dateConsidered = parsedOBDate;
                                dateConsidered = new Date(parsedOBDate); // clone the date to avoid modifying the original
                                dateConsidered.setDate(dateConsidered.getDate() + 1);

                            } else {
                                // Step 3: If OB Date is not present. Consider Emp Join Date for Calculation
                                dateConsidered = empHireDateObj;
                            }
                            leavebalsearch = searchLeaveBalance(empname, query, empHireDateObj, format, moment, dateConsidered, fromdate, leavetype)
                            log.debug('leavebalsearch', JSON.stringify(leavebalsearch));
                            // if (leavebalsearch && leavebalsearch.length > 0) {
                            finalleavebal = leavebalsearch;
                            // Changed Rounded Value
                            leaverecord.setValue({

                                fieldId: 'custrecord_hris_lve_leavebalance',
                                value: finalleavebal.toFixed(2),
                                ignoreFieldChange: true,
                                forceSyncSourcing: true
                            });
                            let roundfinalleavebal = GetRoundOffvalue(finalleavebal);
                            leaverecord.setValue({
                                fieldId: 'custrecord_hris_lve_leavebalance_wholeno',
                                value: roundfinalleavebal,
                                ignoreFieldChange: true,
                                forceSyncSourcing: true
                            });


                        }

                    }
                    // Checking for emergency leave
                    if (fromdate && todate && Leave_type_seqno == 13) {
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
                        let fromdateyear = fromdate.getFullYear();
                        log.debug("Month year", fromdateyear);

                        let totaldays = leaverecord.getValue({
                            fieldId: 'custrecord_hris_lve_totalnodays'
                        }) || 0;
                        log.debug('totaldays', totaldays);


                        let empname = leaverecord.getValue({
                            fieldId: 'custrecord_hris_lve_employeename'
                        }) || '';
                        log.debug('Employee Name', empname);
                        let totalnodays = gettingemergencyleavedays(empname, leavetype, fromdateyear);

                        totaldays = parseFloat(totaldays) + parseFloat(totalnodays);
                        if (totaldays != 0 && totaldays > 15) {
                            alert('You Should not apply Emergency Leave greater than 15');

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
                    if (fromdate && todate && Leave_type_seqno == 3) {
                        let empname = leaverecord.getValue({
                            fieldId: 'custrecord_hris_lve_employeename'
                        }) || '';
                        log.debug('Employee Name', empname);


                        // let empcatagory = gettingempcatagorysequence(empname);
                        let empcatagorylist = getemployeecatagorysequence(empname);
                        let empcatagorydetails = empcatagorylist.toString().split("#")
                        let empcatagory = empcatagorydetails[0];
                        let empcatagorydays = empcatagorydetails[1];
                        let airticketcal = empcatagorydetails[2];
                        let negativeallowancelist = getnegativeallow(leavetype);
                        let negativeallowancedetails = negativeallowancelist.toString().split("#")
                        let leavesequence = negativeallowancedetails[0];
                        let negativeallowcheck = negativeallowancedetails[1];
                        let maxnegativeallow = negativeallowancedetails[2];

                        let fromdateno = fromdate.getMonth() + 1


                        log.debug('Month Number', fromdateno);
                        let fromdateyear = fromdate.getFullYear();
                        log.debug("Month year", fromdateyear);

                        let totaldays = leaverecord.getValue({
                            fieldId: 'custrecord_hris_lve_totalnodays'
                        }) || 0;
                        log.debug('totaldays', totaldays);

                        let totalnodays = gettingannualleavedays(empname, leavetype, fromdateyear);

                        totaldays = parseFloat(totaldays) + parseFloat(totalnodays);
                        if (negativeallowcheck == 'T') {
                            let comparedays = parseFloat(empcatagorydays) + parseFloat(maxnegativeallow)
                        }
                        else {
                            let comparedays = parseFloat(empcatagorydays)
                        }



                        if (totaldays != 0 && empcatagory == 2 && totaldays > comparedays) {
                            alert('You should not apply Annual Leave greater than ' + ' ' + comparedays);

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





                        }
                        else if (totaldays != 0 && (empcatagory == 1 || empcatagory == 3) && totaldays > comparedays) {
                            alert('You should not apply Annual Leave greater than ' + ' ' + comparedays);

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





                        }

                    }


                }

                if (scriptContext.fieldId == 'custrecord_hris_lve_fromdate') {
                    let emp_name = leaverecord.getValue('custrecord_hris_lve_employeename');
                    let Leave_type = leaverecord.getValue('custrecord_hris_lve_leavetype') || '';

                    let hireDate = leaverecord.getValue('custrecord_hris_lve_hiredate');
                    let curDate = new Date();
                    let fromdate = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_fromdate'
                    }) || '';
                    //Extract External ID
                    //	let Leave_type = nlapiLookupField('customrecord_hris_leaveconfig', v_Leave_type, 'externalid');
                    log.debug("Leave_type", Leave_type);
                    if (Leave_type) {
                        // we are checking with sequence no
                        let Leave_type_seqno = get_sequence_no(Leave_type);
                        let proratacheck = proratecheck(Leave_type);
                        let servicecheckdetails = get_service_check(Leave_type);

                        let servicecheckdetailsarray = servicecheckdetails.split('#');
                        let servicecheck = servicecheckdetailsarray[0];
                        let servicedays = servicecheckdetailsarray[1];

                        // if (Leave_type_seqno == 3 && emp_name && hireDate &&  atacheck == 'F') {
                        if (Leave_type_seqno == 3 && servicecheck == 'T' && emp_name && hireDate && fromdate != '') {


                            //  let empcatagory = gettingempcatagorysequence(emp_name);

                            let empcatagorylist = getemployeecatagorysequence(emp_name);
                            let empcatagorydetails = empcatagorylist.toString().split("#")
                            let empcatagory = empcatagorydetails[0];
                            let empcatagorydays = empcatagorydetails[1];
                            let airticketcal = empcatagorydetails[2];
                            if (empcatagory == 2) {
                                //  it is changed to 670 days
                                let compareDate = moment(hireDate).add(servicedays, 'days');
                                compareDate = format.parse({
                                    value: compareDate,
                                    type: format.Type.DATE
                                });


                                if (compareDate >= fromdate) {
                                    alert('You are allowed to take Annual Leave only after completion of service')
                                    leaverecord.setValue({
                                        fieldId: 'custrecord_hris_lve_fromdate',
                                        value: '',
                                        ignoreFieldChange: true,
                                        forceSyncSourcing: true
                                    });
                                    return false;
                                }
                                // Annual Leave Rejoin date Checking

                                let rejoindate = gettingleaverejoindate(Leave_type, emp_name);
                                if (rejoindate != '') {

                                    let compareDate = moment(rejoindate).add(servicedays, 'days');
                                    compareDate = format.parse({
                                        value: compareDate,
                                        type: format.Type.DATE
                                    });


                                    if (compareDate >= fromdate) {

                                        alert('You are allowed to take Annual Leave only after completion of rejoining date of the previous annual leave.')
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

                                //   let visaQuery = "select max(custrecord_hris_date_issue) as renewaldate from customrecord_hris_emp_id_info  where  isinactive ='F'and custrecord_hris_emp_link = "+ emp_name;
                                /*  let visaQuery = "select max(a.custrecord_hris_date_issue) as renewaldate from customrecord_hris_emp_id_info a \
                                             join customrecordhris_idcardmaster b on a.custrecord_hris_emp_id_type = b.id \
                                              where  a.isinactive ='F' and b.custrecord_hris_idcard_seqno =1 and a.custrecord_hris_emp_link = "+ emp_name;
     
                                 let queryResults = query.runSuiteQL({
                                     query: visaQuery,
                                 });
                                 let visaQueryrecords = queryResults.asMappedResults();
                             */
                                /*    let renewaldate = gettingvisarenewaldate(emp_name);
       
                                   if (renewaldate != '') {
       
                                       let compareDate = moment(renewaldate).add(6, 'months');
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
       
                                   } */


                            }
                            else if (empcatagory == 1 || empcatagory == 3) {
                                //  it is changed to 670 days
                                let compareDate = moment(hireDate).add(servicedays, 'days');
                                compareDate = format.parse({
                                    value: compareDate,
                                    type: format.Type.DATE
                                });


                                if (compareDate >= fromdate) {
                                    alert('You are allowed to take Annual Leave only after completion of service')
                                    leaverecord.setValue({
                                        fieldId: 'custrecord_hris_lve_fromdate',
                                        value: '',
                                        ignoreFieldChange: true,
                                        forceSyncSourcing: true
                                    });
                                    return false;
                                }
                                // Annual Leave Rejoin date Checking
                                /*     let leaveQuery = "select * from customrecord_hris_leaveapplication  where custrecord_hris_lve_leavetype = " + Leave_type + "\
                                 and custrecord_hris_lve_workresume ='T' and  isinactive ='F'and custrecord_hris_lve_employeename ="+ emp_name;
        
                                    let queryResults = query.runSuiteQL({
                                        query: leaveQuery,
                                    });
                                    let leaveQueryrecords = queryResults.asMappedResults();
                               */
                                let rejoindate = gettingleaverejoindate(Leave_type, emp_name);
                                if (rejoindate != '') {

                                    let compareDate = moment(rejoindate).add(servicedays, 'days');
                                    compareDate = format.parse({
                                        value: compareDate,
                                        type: format.Type.DATE
                                    });


                                    if (compareDate >= fromdate) {

                                        alert('You are allowed to take Annual Leave only after completion of rejoining date of the previous annual leave.')

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

                                //   let visaQuery = "select max(custrecord_hris_date_issue) as renewaldate from customrecord_hris_emp_id_info  where  isinactive ='F'and custrecord_hris_emp_link = "+ emp_name;
                                /*   let visaQuery = "select max(a.custrecord_hris_date_issue) as renewaldate from customrecord_hris_emp_id_info a  join customrecordhris_idcardmaster b on a.custrecord_hris_emp_id_type = b.id \
                                    where  a.isinactive ='F' and b.custrecord_hris_idcard_seqno =1 and a.custrecord_hris_emp_link = "+ emp_name;
      
                                  let queryResults = query.runSuiteQL({
                                      query: visaQuery,
                                  });
                                  let visaQueryrecords = queryResults.asMappedResults();
                             
                                  let renewaldate = '';
                                  if (visaQueryrecords.length > 0) {
                                      let rec = visaQueryrecords[0];
                                      renewaldate = rec.renewaldate || '';
                          */
                                /*  let renewaldate = gettingvisarenewaldate(emp_name);
                                 if (renewaldate != '') {
     
                                     //  renewaldate = new Date(renewaldate);
                                     //  renewaldate.setMonth(renewaldate.getMonth() + 6);
                                     let compareDate = moment(renewaldate).add(6, 'months');
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
     
                                 } */



                            }

                        }
                        if (servicecheck == 'T' && servicedays != 0 && fromdate != '') {
                            let compareDate = moment(hireDate).add(servicedays, 'days');
                            compareDate = format.parse({
                                value: compareDate,
                                type: format.Type.DATE
                            });


                            if (compareDate >= fromdate) {
                                alert('You are allowed to take this leave after completion of one year')
                                leaverecord.setValue({
                                    fieldId: 'custrecord_hris_lve_fromdate',
                                    value: '',
                                    ignoreFieldChange: true,
                                    forceSyncSourcing: true
                                });
                                return false;
                            }

                        }
                        /* else if (Leave_type_seqno == 3 && emp_name && hireDate && proratacheck == 'T') {
    
                            let empname = leaverecord.getValue({
                                fieldId: 'custrecord_hris_lve_employeename'
                            }) || '';
                            log.debug('Employee Name', empname);
                          
                            let rejoindate = gettingemployeerejoindate(empname);
                            if (rejoindate != '') {
                                let formatrejoindate = format.parse({
                                    value: rejoindate,
                                    type: format.Type.DATE
                                });
                                let compareDate = moment(formatrejoindate).add(6, 'months');
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
    
                                let formathiredate = format.parse({
                                    value: hireDate,
                                    type: format.Type.DATE
                                });
                                let compareDate = moment(formathiredate).add(6, 'months');
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
                        if (Leave_type_seqno != 2 && Leave_type_seqno !=5 && Leave_type_seqno !=25) {




                            let employeesql = "select * from employee where id ='" + emp_name + "' and custentity_emp_employee_job_status =3 and isinactive ='F'"
                            log.debug("employeesql", employeesql);
                            let queryResult = query.runSuiteQL({
                                query: employeesql,
                            });
                            let employeesqlrecords = queryResult.asMappedResults();


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
                        if (Leave_type_seqno == 5) {

                            let ValidtillDate = leaverecord.getValue('custrecord_hris_lve_validtilldate');
                            /*  ValidtillDate = format.parse({
                                   value: ValidtillDate,
                                   type: format.Type.DATE
                               }); */
                            let fromDATE = leaverecord.getValue({
                                fieldId: 'custrecord_hris_lve_fromdate'
                            }) || '';
                            if(ValidtillDate){

                            
                            ValidtillDate = moment(ValidtillDate).format('DD/MM/YYYY');

                            let compoffDATE = getcompoffdate(ValidtillDate, emp_name);

                            //  compoffDATE= nlapiStringToDate(compoffDATE)
                            if (compoffDATE != '') {
                                compoffDATE = format.parse({
                                    value: compoffDATE,
                                    type: format.Type.DATE
                                });
                                //   fromDATE= nlapiStringToDate(fromDATE)
                                fromDATE = format.parse({
                                    value: fromDATE,
                                    type: format.Type.DATE
                                });
                                if (fromDATE < compoffDATE) {
                                    alert('You can not apply leave on before date of raise compoff date');
                                    return false;
                                }
                            }
                        }
                        else{
                              alert('Please raise the compoff first.')
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

                    // Validate Leave Year Rotation
                    /*  let leaveType = leaverecord.getValue('custrecord_hris_lve_leavetype') || '';
                     let employeeId = leaverecord.getValue("custrecord_hris_lve_employeename");
                     if (leaveType) {
                     
                         let isRotation = check_rotation(leaveType);
                         if (isRotation == "T") {
                    
                             let rotationsql = "select * from customrecord_hris_rotational_leave_roste where custrecord_hris_employee_name ='" + employeeId + "'\
                                            and custrecord_hris_rotational_leave_categor ='"+ leaveType + "' and custrecord_hris_work_rotation_end ='F'\
                                            and isinactive ='F'"
 
                             log.debug("rotationsql", rotationsql);
                             let queryResult = query.runSuiteQL({
                                 query: rotationsql,
                             });
                             let rotationsqlrecords = queryResult.asMappedResults();
 
 
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
                    /* let leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + Leave_type + "' and isinactive ='F'\
                        and custrecord_hris_lvecnfg_considerpayroll ='T'"
                     log.debug("leavesequencesql", leavesequencesql);
                     let queryResult = query.runSuiteQL({
                         query: leavesequencesql,
                     });
                     let leavesequencesqlrecords = queryResult.asMappedResults();
 
 
                     log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
                     if (leavesequencesqlrecords.length > 0) { */
                    let employee = leaverecord.getValue('custrecord_hris_lve_employeename');
                    let employeecompensql = "select * from customrecord_hris_employee_compen_change where custrecord_hris_empchange_employee_nam ='" + employee + "' and isinactive ='F'"

                    log.debug("employeecompensql", employeecompensql);
                    let queryResult = query.runSuiteQL({
                        query: employeecompensql,
                    });
                    let employeecompensqlrecords = queryResult.asMappedResults();


                    log.debug(" employeecompensqlrecords.length", employeecompensqlrecords.length);
                    if (employeecompensqlrecords.length == 0) {
                        alert('Selected Employee is connected with Payroll. And Pay Process Group is not defined for selected employee. Please contact HR team for further details !')
                        leaverecord.setValue({
                            fieldId: 'custrecord_hris_lve_employeename',
                            value: '',
                            ignoreFieldChange: true,
                            forceSyncSourcing: true
                        });
                        return false;
                        /*   let recordUrl = url.resolveRecord({
                              recordType: 'customrecord_hris_leaveapplication',
                              recordId: null,
                              isEditMode: true
                          });
 
                          window.onbeforeunload = null;
                          window.open(recordUrl, '_self');
 
                          window.location.reload(); */

                    }
                }
                if (scriptContext.fieldId == 'custrecord_hris_lve_leavetype') {
                    let Leave_type = leaverecord.getValue('custrecord_hris_lve_leavetype') || '';
                    let emp_name = leaverecord.getValue('custrecord_hris_lve_employeename');

                    log.debug("Leave_type", Leave_type);
                    if (Leave_type) {
                        // we are checking with sequence no
                        let Leave_type_seqno = get_sequence_no(Leave_type);

                        if (Leave_type_seqno != 2 && Leave_type_seqno != 5 &&  Leave_type_seqno !=25) {




                            let employeesql = "select * from employee where id ='" + emp_name + "' and custentity_emp_employee_job_status =3 and isinactive ='F'"
                            log.debug("employeesql", employeesql);
                            let queryResult = query.runSuiteQL({
                                query: employeesql,
                            });
                            let employeesqlrecords = queryResult.asMappedResults();


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
                        if (Leave_type_seqno == 5) {


                            let fromDATE = leaverecord.getValue({
                                fieldId: 'custrecord_hris_lve_fromdate'
                            }) || '';


                           // let compoffvalidDATE = getcompoffvalidtilldate(emp_name);
                            let compoffvalidDATElist = getcompoffvalidtilldate(emp_name);
                        let getcompoffvalidtilldatedetails = compoffvalidDATElist.toString().split("#")
                        let compoffvalidDATE = getcompoffvalidtilldatedetails[0];
                        let compoffvalidType = getcompoffvalidtilldatedetails[1];
                        //let maxnegativeallow = negativeallowancedetails[2];

                            //  compoffDATE= nlapiStringToDate(compoffDATE)
                            if (compoffvalidDATE != '') {
                                compoffvalidDATE = format.parse({
                                    value: compoffvalidDATE,
                                    type: format.Type.DATE
                                });
                                leaverecord.setValue('custrecord_hris_lve_validtilldate', compoffvalidDATE, true, true);
                              leaverecord.setValue('custrecord_hris_comp_off_type', compoffvalidType, true, true);
                                //   fromDATE= nlapiStringToDate(fromDATE)

                            }
                            /* else {

                                alert('Please raise the compoff first.')
                                return false;
                            } */


                        }
                    }
                }
                // Encashement 
                if (scriptContext.fieldId == 'custrecord_hris_lve_noofencashmentdays') {
                    let applied_no_of_encashmentDays = leaverecord.getValue('custrecord_hris_lve_noofencashmentdays');
                    let total_avail_encash_days = leaverecord.getValue('custrecord_hris_total_encashable_balance') || 0;

                    let max_encashDays = leaverecord.getValue('custrecord_hris_lve_maxencashabledayalow') || 0;

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

                    let encash = leaverecord.getValue('custrecord_hris_lve_applylveencashment');
                    if (encash == true) {
                        let emp_id = leaverecord.getValue('custrecord_hris_lve_employeename');
                        let leave_type = leaverecord.getValue('custrecord_hris_lve_leavetype');


                        let leavebalancesql = "select * from customrecord_hris_leavebalance where custrecord_hris_lvbal_employee_name = '" + emp_id + "' and  custrecord_hris_lvbal_leave_type = '" + leave_type + "' and isinactive ='F'"
                        log.debug("leavebalancesql", leavebalancesql);
                        let queryResult = query.runSuiteQL({
                            query: leavebalancesql,
                        });
                        let leavebalancesqlrecords = queryResult.asMappedResults();


                        log.debug(" leavebalancesqlrecords.length", leavebalancesqlrecords.length);
                        if (leavebalancesqlrecords.length > 0) {

                            let encash_bal = leavebalancesqlrecords[0].custrecord_hris_lvbal_encashable_days || 0;

                            if (!encash_bal)
                                encash_bal = 0;

                            leaverecord.setValue('custrecord_hris_lve_encashmentlevbalance', encash_bal, true, true);

                            let leave_ball = leaverecord.getValue('custrecord_hris_lve_leavebalance');
                            let noOfDays = leaverecord.getValue('custrecord_hris_lve_totalnodays');

                            let remaining_bal = parseFloat(leave_ball) - parseFloat(noOfDays);

                            let total_avail_encash_days = parseFloat(encash_bal) + parseFloat(remaining_bal);
                            total_avail_encash_days = GetRoundOffvalue(total_avail_encash_days);

                            leaverecord.setValue('custrecord_hris_total_encashable_balance', total_avail_encash_days, true, true);



                        }


                    }
                }
                if (scriptContext.fieldId == 'custrecord_hris_lve_fromdate') {

                    let emp_name = leaverecord.getValue('custrecord_hris_lve_employeename');
                    let Leave_type = leaverecord.getValue('custrecord_hris_lve_leavetype') || '';

                    let from_date = leaverecord.getValue('custrecord_hris_lve_fromdate');
                    let seq_no = get_sequence_no(Leave_type);

                    // By Florence 
                    /*  if (seq_no == 3) {
                     
                         let expirydate = gettingpassportexpirydate(emp_name);
                         if (expirydate != '') {
 
                             expirydate = format.parse({
                                 value: expirydate,
                                 type: format.Type.DATE
                             });
                             let compareDate = moment(from_date).add(9, 'months');
                             compareDate = format.parse({
                                 value: compareDate,
                                 type: format.Type.DATE
                             });
 
                             if (expirydate < compareDate) {
 
                                 alert('You are allowed to take leave only if Passport should be valid minimum of 9months from the leave start date.')
                                 leaverecord.setValue({
                                     fieldId: 'custrecord_hris_lve_fromdate',
                                     value: '',
                                     ignoreFieldChange: true,
                                     forceSyncSourcing: true
                                 });
 
 
 
                                 return false;
 
 
                             }
 
 
 
                         }
                       
                         let expirydate = gettingvisaexpirydate(emp_name)
                         if (expirydate != '') {
 
                             expirydate = format.parse({
                                 value: expirydate,
                                 type: format.Type.DATE
                             });
                             let compareDate = moment(from_date).add(75, 'days');
                             compareDate = format.parse({
                                 value: compareDate,
                                 type: format.Type.DATE
                             });
                             if (expirydate < compareDate) {
 
                                 alert('You are allowed to take leave only if the visa is valid for at least 75days from leave start date..')
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



                    let leave_bal = leaverecord.getValue('custrecord_hris_lve_leavebalance');

                    let sequence_value = get_sequence_no(Leave_type);
                    if (seq_no == 5) {
                        leaverecord.setValue('custrecord_hris_lve_todate', from_date)
                        //  nlapiDisableField('custrecord_hris_lve_todate',true);
                        leaverecord.getField({ fieldId: 'custrecord_hris_lve_todate' }).isDisabled = true;
                        if (leave_bal < 1) {
                            leaverecord.setValue('custrecord_hris_lve_totalnodays', leave_bal, false)
                        }
                        if (leave_bal >= 1) {
                            leaverecord.setValue('custrecord_hris_lve_totalnodays', 1, false)
                        }
                        let to_date = leaverecord.getValue('custrecord_hris_lve_todate');



                        let compoffsql = "select min(custrecord_hris_rcomp_valid_till_date) validdate from customrecord_hris_lve_raise_comp_off where custrecord_hris_rcomp_employee_name ='" + emp_name + "' and custrecord_hris_rcomp_valid_till_date is not null"
                        log.debug("compoffsql", compoffsql);
                        let queryResult = query.runSuiteQL({
                            query: compoffsql,
                        });
                        let compoffsqlrecords = queryResult.asMappedResults();


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
                    let leaveType = leaverecord.getValue("custrecord_hris_lve_leavetype");

                    let leaveType_seq = get_sequence_no(leaveType);
                    //  let userRole = nlapiGetRole();
                    let userRole = runtime.getCurrentUser().role;
                    /* if (leaveType && (seq_no == 2 || seq_no == 13) && userRole != 1019) {
                        let date = new Date();
                        let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                        let d_startDate = leaverecord.getValue("custrecord_hris_lve_fromdate");
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
                    } */

                    return true;


                }
                // Set Month Year Coding
                if (scriptContext.fieldId == "custrecord_hris_lve_todate") {
                    let toDate = leaverecord.getValue("custrecord_hris_lve_todate");
                    let fromdate = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_fromdate'
                    }) || '';
                    log.debug('fromdate', fromdate);
                    let todate = leaverecord.getValue({
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
                    let todayDate = new Date();
                    let totalDelayDays = leaverecord.getValue(
                        "custrecord_hris_lve_actualresumedate"
                    );
                    let from_date = leaverecord.getValue("custrecord_hris_lve_fromdate");
                    //  from_date = nlapiStringToDate(from_date);
                    from_date = format.parse({
                        value: from_date,
                        type: format.Type.DATE
                    });

                    let expectedResumeDate = leaverecord.getValue(
                        "custrecord_hris_lve_expectedresumebackdt"
                    );

                    if (totalDelayDays && totalDelayDays != "" && totalDelayDays != null) {


                        {


                            let fromDate = leaverecord.getValue(
                                "custrecord_hris_lve_expectedresumebackdt"
                            );
                            let toDate = leaverecord.getValue("custrecord_hris_lve_actualresumedate");

                            let leave_type = leaverecord.getValue("custrecord_hris_lve_leavetype");
                            totalDelayDays = moment(totalDelayDays);
                            expectedResumeDate = moment(expectedResumeDate);

                            // Calculate the difference in days between the two dates
                            let daysDiff = totalDelayDays.diff(expectedResumeDate, 'days');
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
                    let airTicketAllChkbox = leaverecord.getValue(
                        "custrecord_hris_lve_airticketrequired"
                    );
                    let emp_Id = leaverecord.getValue("custrecord_hris_lve_employeename");
                    let fromDate = leaverecord.getValue("custrecord_hris_lve_fromdate");
                    let leaveType = leaverecord.getValue("custrecord_hris_lve_leavetype");
                    /* let E_leavetype = leaverecord.getValue('custrecord_hris_lve_leavetype');
                 
                   //Extract External ID
                  let leaveType = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');*/

                    let LeaveConfigRecord = record.load({
                        type: 'customrecord_hris_leaveconfig',
                        id: leaveType,
                        isDynamic: true
                    });
                    /*  let b_allowRotation = nlapiLookupField(
                       "customrecord_hris_leaveconfig",
                       leaveType,
                       "custrecord_hris_lveconfig_rotationlve"
                     ); */
                    let b_allowRotation = LeaveConfigRecord.getValue('custrecord_hris_lveconfig_rotationlve');
                    if (fromDate) {
                        // fromDate = nlapiStringToDate(fromDate);
                        fromDate = format.parse({
                            value: fromDate,
                            type: format.Type.DATE
                        });
                        let year = fromDate.getFullYear();
                        year = year.toString();
                        let YearId = searchYear(year);
                        if (airTicketAllChkbox == true) {


                            let monthlysalarysql = "select * from  customrecord_hris_monthlysalinput a join customrecord_hris_payroll_component\
                               b  on a.custrecord_hris_mthsal_paycomponent =b.id where a.custrecord_hris_mthsal_empname ='" + emp_Id + "' and \
                               b.custrecord_hris__sequence_no_ =36 and a.isinactive ='F' and custrecord_hris_mthsal_year = " + YearId;
                            log.debug("monthlysalarysql", monthlysalarysql);
                            let queryResult = query.runSuiteQL({
                                query: monthlysalarysql,
                            });
                            let monthlysalarysqlrecords = queryResult.asMappedResults();


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
                // Finished Setmonth year

            }
            catch (e) {
                log.debug("error in fieldchange : " + e);

            }

        }

        function searchYear(year) {
            try {
                let yearVal = "";
                let yearsql = "select  id as internalid  from  customlist_hris_year_master  where name = " + year;
                let yearsqlrecord = getResult(yearsql);
                log.debug('yearsql', yearsql)
                if (yearsqlrecord.length > 0) {
                    for (r = 0; r < yearsqlrecord.length; r++) {
                        let yearVal = yearsqlrecord[r].internalid || 0;

                    }
                }
                log.debug("yearVal in SearchYear  Func", yearVal);
                return yearVal;
            }
            catch (e) {
                log.debug("error in searchyear : " + e);

            }

        }
        function get_sequence_no(Leave_type) {
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
        function get_service_check(Leave_type) {

            let leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + Leave_type + "' and isinactive ='F'"
            log.debug("leavesequencesql", leavesequencesql);
            let queryResult = query.runSuiteQL({
                query: leavesequencesql,
            });
            let leavesequencesqlrecords = queryResult.asMappedResults();


            log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
            if (leavesequencesqlrecords.length > 0) {


                let servicecheck = leavesequencesqlrecords[0].custrecord_hris_lveconfig_servicecomplet;
                let servicedays = leavesequencesqlrecords[0].custrecord_hris_lveconfig_sercompdays
            }
            return servicecheck + '#' + servicedays;
        }
        function proratecheck(Leave_type) {
            try {
                let proratacheck = 'F'
                let leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + Leave_type + "' and isinactive ='F'"
                log.debug("leavesequencesql", leavesequencesql);
                let queryResult = query.runSuiteQL({
                    query: leavesequencesql,
                });
                let leavesequencesqlrecords = queryResult.asMappedResults();


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
                let expirydate = '';
                let passportQuery = "select max(a.custrecord_hris_date_exp) as expirydate from customrecord_hris_emp_id_info a  join customrecordhris_idcardmaster b on a.custrecord_hris_emp_id_type = b.id\
                where  a.isinactive ='F' and b.custrecord_hris_idcard_seqno =2 and a.custrecord_hris_emp_link = "+ emp_name;

                let queryResults = query.runSuiteQL({
                    query: passportQuery,
                });
                let passportQueryrecords = queryResults.asMappedResults();
                // let visatextField = recordObj.getField("custpage_visaprocessingtext");
                expirydate = '';
                if (passportQueryrecords.length > 0) {
                    let rec = passportQueryrecords[0];
                    expirydate = rec.expirydate || '';
                }
                return expirydate;
            }
            catch (e) {
                log.debug("error in gettingpassportexpirydate : " + e);

            }
        }
        function gettingvisaexpirydate(emp_name) {
            try {
                let expirydate = '';
                let visaQuery = "select max(a.custrecord_hris_date_exp) as expirydate from customrecord_hris_emp_id_info a  join customrecordhris_idcardmaster b on a.custrecord_hris_emp_id_type = b.id \
                where  a.isinactive ='F' and b.custrecord_hris_idcard_seqno =1 and a.custrecord_hris_emp_link = "+ emp_name;

                let queryResults = query.runSuiteQL({
                    query: visaQuery,
                });
                let visaQueryrecords = queryResults.asMappedResults();
                // let visatextField = recordObj.getField("custpage_visaprocessingtext");
                expirydate = '';
                if (visaQueryrecords.length > 0) {
                    let rec = visaQueryrecords[0];
                    expirydate = rec.expirydate || '';
                }
            }
            catch (e) {
                log.debug("error in gettingvisatexpirydate : " + e);

            }
        }
        function gettingempcatagorysequence(empname) {
            try {
                let empQuery = "select b.id as empcatagoryid ,b.custrecord_hris_empcat_seqno as seqno from employee  a join\
            customrecord_hris_employeecategory b on  a.custentity_hris_empcategory = b.id where a.id =" + empname + " and b.isinactive='F'"

                let queryResults = query.runSuiteQL({
                    query: empQuery,
                });
                let empQueryrecords = queryResults.asMappedResults();
                // let visatextField = recordObj.getField("custpage_visaprocessingtext");

                if (empQueryrecords.length > 0) {
                    let rec = empQueryrecords[0];
                    let empcatagory = rec.seqno;
                }
                return empcatagory;
            }
            catch (e) {
                log.debug("error in gettingempcatagorysequence : " + e);

            }

        }
        function gettingvisarenewaldate(emp_name) {
            try {
                let renewaldate = '';
                let visaQuery = "select max(a.custrecord_hris_date_issue) as renewaldate from customrecord_hris_emp_id_info a  join \
                            customrecordhris_idcardmaster b on a.custrecord_hris_emp_id_type = b.id \
                              where  a.isinactive ='F' and b.custrecord_hris_idcard_seqno =1 and a.custrecord_hris_emp_link = "+ emp_name;

                let queryResults = query.runSuiteQL({
                    query: visaQuery,
                });
                let visaQueryrecords = queryResults.asMappedResults();
                // let visatextField = recordObj.getField("custpage_visaprocessingtext");
                renewaldate = '';
                if (visaQueryrecords.length > 0) {
                    let rec = visaQueryrecords[0];
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
                let rejoindate = '';
                let empQuery = "select b.id as empcatagoryid ,b.custrecord_hris_empcat_seqno as seqno,a.custentity_hris_rejoin_date as rejoindate from employee  a join\
                customrecord_hris_employeecategory b on  a.custentity_hris_empcategory = b.id where a.id =" + empname + " and b.isinactive='F'"

                let queryResults = query.runSuiteQL({
                    query: empQuery,
                });
                let empQueryrecords = queryResults.asMappedResults();
                // let visatextField = recordObj.getField("custpage_visaprocessingtext");

                if (empQueryrecords.length > 0) {
                    let rec = empQueryrecords[0];
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
                let leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + Leave_type + "' and isinactive ='F'"
                log.debug("leavesequencesql", leavesequencesql);
                let queryResult = query.runSuiteQL({
                    query: leavesequencesql,
                });
                let leavesequencesqlrecords = queryResult.asMappedResults();


                log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
                if (leavesequencesqlrecords.length > 0) {


                    let rotation = leavesequencesqlrecords[0].custrecord_hris_lveconfig_rotationlve;
                }
                return rotation;
            }
            catch (e) {
                log.debug("error in check_rotation : " + e);

            }

        }
        function GetRoundOffvalue(finalAnnual) {
            let final_days = finalAnnual;
            log.debug(
                "final_days************************************" + final_days
            );
            let rounded_final_value;
            let split_final_days = new Array();

            split_final_days = final_days.toString().split(".");

            let integer_no = split_final_days[0];
            log.debug("integer_no************************************" + integer_no);

            let i_decimal_val = split_final_days[1];
            log.debug(
                "i_decimal_val************************************" + i_decimal_val
            );



            let compare_no = "0" + "." + i_decimal_val;
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
                let result = [];
                let finalleavebal = 0;
                let leavebalancesql = "select * from customrecord_hris_leavebalance where custrecord_hris_lvbal_employee_name = '" + empInternalId + "' and  custrecord_hris_lvbal_leave_type = '" + leavetype + "' and isinactive ='F'"
                log.debug("leavebalancesql", leavebalancesql);
                let queryResult = query.runSuiteQL({
                    query: leavebalancesql,
                });
                let leavebalancesqlrecords = queryResult.asMappedResults();


                log.debug(" leavebalancesqlrecords.length", leavebalancesqlrecords.length);
                if (leavebalancesqlrecords.length > 0) {
                    let obdate = leavebalancesqlrecords[0].custrecord_hris_lvbal_obdate;
                    let obleavebalance = leavebalancesqlrecords[0].custrecord_hris_lvbal_openingbalance || 0;
                    let leavebalcredited = leavebalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_cred || 0;
                    let leavebaltaken = leavebalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_take || 0;
                    let availableleavebal = leavebalancesqlrecords[0].custrecord_hris_lvbal_available_leave_ba || 0;

                    let leavebalid = leavebalancesqlrecords[0].id;
                    log.debug('Leavebalance Id', leavebalid);
                    //  let diffDays = currentdate.diff(empHireDateObj, 'days');          
                    log.debug('Emphiredateobj', empHireDateObj);
                    //  let diffDays = moment.duration(currentdate.diff(empHireDateObj));
                    // Convert JavaScript Date objects to Moment.js objects
                    let currentMoment = moment(currentdate);
                    let dateConsideredMoment = moment(dateConsidered);

                    // Calculate the difference in days between the two dates
                    let diffDays = currentMoment.diff(dateConsideredMoment, 'days');
                    log.debug("Diff Days", diffDays);
                    let leaveBalance = diffDays * 0.08219;
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
            let result = [];
            let finalleavebal = 0;
            // let leavebalancesql = "select * from customrecord_hris_leavebalance where custrecord_hris_lvbal_employee_name = '" + empInternalId + "' and  custrecord_hris_lvbal_leave_type = '"+leavetype+"' and isinactive ='F'"

            let leavebalancesql = "select a.*,b.custrecord_hris_lvecfg_accuraldays as accuraldays from customrecord_hris_leavebalance a join customrecord_hris_leaveconfig b on a.custrecord_hris_lvbal_leave_type=b.id\
            where a.custrecord_hris_lvbal_employee_name = '" + empInternalId + "'and a.custrecord_hris_lvbal_leave_type = '" + leavetype + "'  and a.isinactive ='F'\
            and b.custrecord_hris_lvecnfg_seqno = 3 "


            log.debug("leavebalancesql", leavebalancesql);
            let queryResult = query.runSuiteQL({
                query: leavebalancesql,
            });
            let leavebalancesqlrecords = queryResult.asMappedResults();


            log.debug(" leavebalancesqlrecords.length", leavebalancesqlrecords.length);
            if (leavebalancesqlrecords.length > 0) {
                let obdate = leavebalancesqlrecords[0].custrecord_hris_lvbal_obdate;
                let obleavebalance = leavebalancesqlrecords[0].custrecord_hris_lvbal_openingbalance || 0;
                let leavebalcredited = leavebalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_cred || 0;
                let leavebaltaken = leavebalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_take || 0;
                let availableleavebal = leavebalancesqlrecords[0].custrecord_hris_lvbal_available_leave_ba || 0;
                let accuraldays = leavebalancesqlrecords[0].accuraldays || 1;
                let leavebalid = leavebalancesqlrecords[0].id;
                log.debug('Leavebalance Id', leavebalid);
                //  let diffDays = currentdate.diff(empHireDateObj, 'days');          
                log.debug('Emphiredateobj', empHireDateObj);

                //   let currentMoment = moment(currentdate);
                // let dateConsideredMoment = moment(dateConsidered);
                let currentMoment = formatdate(currentdate);
                let dateConsideredMoment = formatdate(dateConsidered);
                // Calculate the difference in days between the two dates
                //  let diffDays = currentMoment.diff(dateConsideredMoment, 'days');
                let diffDays = getDaysDifference(currentMoment, dateConsideredMoment);
                log.debug("Diff Days", diffDays);
                diffDays = diffDays + 1;
                log.audit("Add Diff Days", diffDays);
                // let leaveBalance = diffDays * 0.08219;
                // let leaveBalance = diffDays * (accuraldays/25);
                let leaveBalance = diffDays * accuraldays;
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
                let emergencysql = "SELECT NVL(SUM(a.custrecord_hris_lve_totalnodays), 0) AS totdays,\
    EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate) as  leave_year FROM customrecord_hris_leaveapplication a JOIN customrecord_hris_leaveconfig b ON a.custrecord_hris_lve_leavetype = b.id  \
   WHERE a.custrecord_hris_lve_employeename = "+ empname + " and a.custrecord_hris_lve_leavetype =" + leavetype + " and EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate)=" + fromdateyear + "\
    and a.custrecord_hris_lve_hrmsapprovalstatus =2 and custrecord_hris_lve_cancellation='F' GROUP BY  EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate)"


                let queryResults = query.runSuiteQL({
                    query: emergencysql
                });
                let emergencysqlrecord = queryResults.asMappedResults();
                log.debug('emergencysql', emergencysql)
                log.debug(' emergencysql.length * ', emergencysql.length);
                let totalnodays = 0;
                if (emergencysql.length > 0) {
                    totalnodays = emergencysqlrecord[0].totdays || 0;
                }
                return totalnodays;
            } catch (e) {
                log.error("Error in gettingemergencyleavedays", e);

            }
        }
        function formatdate(currentdate) {


            let day = currentdate.getDate();
            let month = currentdate.getMonth() + 1; // Months are 0-based
            let year = currentdate.getFullYear();

            return day + '/' + month + '/' + year;
        }

        function parseDate(str) {
            let parts = str.split('/');
            let day = parseInt(parts[0], 10);
            let month = parseInt(parts[1], 10) - 1; // JS month is 0-based
            let year = parseInt(parts[2], 10);
            return new Date(year, month, day);  // This returns a Date object!
        }

        function getDaysDifference(dateStr1, dateStr2) {
            let date1 = parseDate(dateStr1);
            let date2 = parseDate(dateStr2);

            // Confirm these are Date objects
            if (!(date1 instanceof Date) || !(date2 instanceof Date)) {
                throw new Error('Invalid Date conversion');
            }

            let diffMs = date1.getTime() - date2.getTime();  // now both are Date objects
            log.audit('diffMs', diffMs)
            log.audit('diffMs / (1000 * 60 * 60 * 24)', diffMs / (1000 * 60 * 60 * 24))
            log.audit('round diffMs / (1000 * 60 * 60 * 24)', Math.round(diffMs / (1000 * 60 * 60 * 24)))
            return Math.round(diffMs / (1000 * 60 * 60 * 24));
        }
        function getemployeecatagorysequence(empname) {
            try {
                //let empcatagorysql = "select * from customrecord_hris_employeecategory where id=" + empcatagoryid;
                let empcatagorysql = "select b.id as empcatagoryid ,b.custrecord_hris_empcat_seqno as seqno,b.custrecord_hris_empcat_noofdays as noofdays,b.custrecord_hris_empcat_airticket as airticketdays from employee  a join\
            customrecord_hris_employeecategory b on  a.custentity_hris_empcategory = b.id where a.id =" + empname + " and b.isinactive='F'"

                log.debug('empcatagorysql', empcatagorysql);

                //let empcatagorysqlrecords = getResult(empcatagorysql);
                let queryResults = query.runSuiteQL({
                    query: empcatagorysql
                });
                log.debug("empcatagorysql", empcatagorysql);
                let empcatagorysqlrecords = queryResults.asMappedResults();

                if (empcatagorysqlrecords.length > 0) {
                    let empcatid = empcatagorysqlrecords[0].seqno;
                    let noofdays = empcatagorysqlrecords[0].noofdays || 0;
                    let airticketcal = empcatagorysqlrecords[0].airticketdays || 0;
                }
                return empcatid + "#" + noofdays + "#" + airticketcal;

            }
            catch (e) {
                log.error("Error in getemployeecatagorysequence", e);
                // log.debug("Error in getEmpTotalLeaveTaken : " + e);
            }
        }
        function getnegativeallow(leaveType) {
            let sequenceNo = '';
            let negAllowChk = '';
            let maxNegAllow = '';

            let resultSet = query.runSuiteQL({
                query: "SELECT custrecord_hris_lvecnfg_seqno,custrecord_hris_lveconfig_allowneglevbal,\
                    custrecord_hris_lvecfg_maxnegativebal FROM  customrecord_hris_leaveconfig WHERE  id = ? ",
                params: [leaveType]
            });

            let results = resultSet.asMappedResults();

            if (results.length > 0) {
                let result = results[0];
                sequenceNo = result.custrecord_hris_lvecnfg_seqno || '';
                negAllowChk = result.custrecord_hris_lveconfig_allowneglevbal || '';
                maxNegAllow = result.custrecord_hris_lvecfg_maxnegativebal || '';
            }

            return sequenceNo + "#" + negAllowChk + "#" + maxNegAllow;
        }


        function gettingannualleavedays(empname, leavetype, fromdateyear) {
            try {

                let annualsql = "SELECT NVL(SUM(a.custrecord_hris_lve_totalnodays), 0) AS totdays,\
        EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate) as  leave_year FROM customrecord_hris_leaveapplication a JOIN customrecord_hris_leaveconfig b ON a.custrecord_hris_lve_leavetype = b.id  \
       WHERE a.custrecord_hris_lve_employeename = "+ empname + " and a.custrecord_hris_lve_leavetype =" + leavetype + " and EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate)=" + fromdateyear + "\
        and a.custrecord_hris_lve_hrmsapprovalstatus =2 and custrecord_hris_lve_cancellation='F' GROUP BY  EXTRACT(YEAR FROM a.custrecord_hris_lve_fromdate)"


                let queryResults = query.runSuiteQL({
                    query: annualsql
                });
                let annualsqlrecord = queryResults.asMappedResults();
                log.debug('annualsql', annualsql)
                log.debug(' annualsql.length * ', annualsql.length);
                let totalnodays = 0;
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
                let rejoindate = '';
                let leaveQuery = "select * from customrecord_hris_leaveapplication  where custrecord_hris_lve_leavetype = " + Leave_type + "\
        and custrecord_hris_lve_workresume ='T' and  isinactive ='F'and custrecord_hris_lve_employeename ="+ emp_name;

                let queryResults = query.runSuiteQL({
                    query: leaveQuery,
                });
                let leaveQueryrecords = queryResults.asMappedResults();
                // let visatextField = recordObj.getField("custpage_visaprocessingtext");

                if (leaveQueryrecords.length > 0) {
                    let rec = leaveQueryrecords[0];
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
                let result = [];
                let empStatus = '';
                let empJoinDate = '';
                /*   let empStatusSQL = "SELECT  CASE WHEN (TO_DATE('" + toDate + "','DD/MM/YYYY') <= TO_DATE(custentity_hris_empjobconfirmationdt,'DD/MM/YYYY')) OR (TO_DATE('" + fromDate + "','DD/MM/YYYY') <= TO_DATE(custentity_hris_empjobconfirmationdt,'DD/MM/YYYY')) THEN 'In Probation' \
                  WHEN (TO_DATE('" + toDate + "','DD/MM/YYYY') > TO_DATE(custentity_hris_empjobconfirmationdt,'DD/MM/YYYY')) AND((TO_DATE('" + toDate + "','DD/MM/YYYY') - TO_DATE(hiredate,'DD/MM/YYYY')) <= 365) THEN 'Within 1 Year'  \
                  ELSE 'More than a Year' END AS empStatus, hiredate as empJoinDate\
                  FROM EMPLOYEE WHERE ID =  " + empID; */
                let empStatusSQL = "Select * from employee where id = " + empID + "  and isinactive ='F'";
                log.debug('empStatusSQL', empStatusSQL);
                console.log(empStatusSQL);
                let records = getResult(empStatusSQL);
                // log.debug('records in getEmployeeStatus', JSON.stringify(records));
                if (records.length > 0) {
                    let record = records[0];
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
            let Compoff_Date = ''
            /* let filters = new Array();
            let columns = new Array();
        	
            filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_valid_till_date', null, 'on', ValidtillDate))
            filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_employee_name', null, 'is', EmployeeName))
        	
            columns.push(new nlobjSearchColumn('custrecord_hris_rcomp_comp_off_from_date'));
        	
            let compoff_recorddata_result = nlapiSearchRecord('customrecord_hris_lve_raise_comp_off', null, filters, columns);
        	
            if (compoff_recorddata_result != null) 
            {
        	
                Compoff_Date = compoff_recorddata_result[0].getValue('custrecord_hris_rcomp_comp_off_from_date')
            	
            }
         */
            let compoffsql = "select * from customrecord_hris_lve_raise_comp_off where custrecord_hris_rcomp_employee_name ='" + EmployeeName + "' and custrecord_hris_rcomp_valid_till_date ='" + ValidtillDate + "'\
            and custrecord_hris_rcomp_appstatus =2 and custrecord_hris_rcomp_checked='F' and  isinactive='F'";
            log.debug("compoffsql", compoffsql);
            let queryResult = query.runSuiteQL({
                query: compoffsql,
            });
            let compoffsqlrecords = queryResult.asMappedResults();


            log.debug(" compoffsqlrecords.length", compoffsqlrecords.length);
            if (compoffsqlrecords.length > 0) {


                Compoff_Date = compoffsqlrecords[0].custrecord_hris_rcomp_comp_off_from_date || '';
            }
            return Compoff_Date;

        }
        function getcompoffvalidtilldate(EmployeeName) {
            let Compoff_Date = ''
            /* let filters = new Array();
            let columns = new Array();
        	
            filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_valid_till_date', null, 'on', ValidtillDate))
            filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_employee_name', null, 'is', EmployeeName))
        	
            columns.push(new nlobjSearchColumn('custrecord_hris_rcomp_comp_off_from_date'));
        	
            let compoff_recorddata_result = nlapiSearchRecord('customrecord_hris_lve_raise_comp_off', null, filters, columns);
        	
            if (compoff_recorddata_result != null) 
            {
        	
                Compoff_Date = compoff_recorddata_result[0].getValue('custrecord_hris_rcomp_comp_off_from_date')
            	
            }
         */
            let compoffsql = "select * from customrecord_hris_lve_raise_comp_off where custrecord_hris_rcomp_employee_name ='" + EmployeeName + "' \
            and custrecord_hris_rcomp_appstatus =2 and custrecord_hris_rcomp_checked='F' and  isinactive='F'";
            log.debug("compoffsql", compoffsql);
            let queryResult = query.runSuiteQL({
                query: compoffsql,
            });
            let compoffsqlrecords = queryResult.asMappedResults();


            log.debug(" compoffsqlrecords.length", compoffsqlrecords.length);
            if (compoffsqlrecords.length > 0) {


                Compoff_Date = compoffsqlrecords[0].custrecord_hris_rcomp_valid_till_date || '';
                Compoff_Type=compoffsqlrecords[0].custrecord_hris_rcomp_compofftype || '';
            }
            return Compoff_Date + "#" + Compoff_Type;

        }
        function getEmployeeOBDetails(empInternalId, leavetype) {
            try {
                let result = [];
                let obdate = '';
                let obleavebalance = 0;
                let leaveobbalancesql = "select * from customrecord_hris_leavebalance where custrecord_hris_lvbal_employee_name = '" + empInternalId + "' and  custrecord_hris_lvbal_leave_type = '" + leavetype + "' and isinactive ='F'\
                                   AND custrecord_hris_lvbal_openingbalance  IS NOT NULL"
                log.debug("leaveobbalancesql", leaveobbalancesql);
                let queryResult = query.runSuiteQL({
                    query: leaveobbalancesql,
                });
                let leaveobbalancesqlrecords = queryResult.asMappedResults();


                log.debug(" leaveobbalancesqlrecords.length", leaveobbalancesqlrecords.length);
                if (leaveobbalancesqlrecords.length > 0) {
                    obdate = leaveobbalancesqlrecords[0].custrecord_hris_lvbal_obdate || '';
                    obleavebalance = leaveobbalancesqlrecords[0].custrecord_hris_lvbal_openingbalance || 0;
                    let leavebalcredited = leaveobbalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_cred || 0;
                    let leavebaltaken = leaveobbalancesqlrecords[0].custrecord_hris_lvbal_leave_balance_take || 0;
                    let availableleavebal = leaveobbalancesqlrecords[0].custrecord_hris_lvbal_available_leave_ba || 0;

                    let leavebalid = leaveobbalancesqlrecords[0].id;
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
            let LeaveID = LeaveTYPE;
            /*    let filters = new Array();
               let columns = new Array();
             
               filters.push(new nlobjSearchFilter("internalid", null, "is", LeaveID));
             //  filters.push(new nlobjSearchFilter("externalid", null, "is", LeaveID));
               columns.push(new nlobjSearchColumn("custrecord_hris_lveconfig_levcarryforwrd"));
               columns.push(new nlobjSearchColumn("custrecord_hris_lvecfg_nextyrleaveapply"));
             
               let LeaveTypeConfSearch = nlapiSearchRecord(
                 "customrecord_hris_leaveconfig",
                 null,
                 filters,
                 columns
               );
             
               if (LeaveTypeConfSearch != null) {
                 let LC_CarryFwdCheck = LeaveTypeConfSearch[0].getValue(
                   "custrecord_hris_lveconfig_levcarryforwrd"
                 );
                 let LC_CarryFwddays = LeaveTypeConfSearch[0].getValue(
                   "custrecord_hris_lvecfg_nextyrleaveapply"
                 );
    */
            let leavesequencesql = "select * from customrecord_hris_leaveconfig where id ='" + LeaveID + "' and isinactive ='F'";

            log.debug("leavesequencesql", leavesequencesql);
            let queryResult = query.runSuiteQL({
                query: leavesequencesql,
            });
            let leavesequencesqlrecords = queryResult.asMappedResults();


            log.debug(" leavesequencesqlrecords.length", leavesequencesqlrecords.length);
            if (leavesequencesqlrecords.length > 0) {
                let LC_CarryFwdCheck = leavesequencesqlrecords[0].custrecord_hris_lveconfig_levcarryforwrd;
                let LC_CarryFwddays = leavesequencesqlrecords[0].custrecord_hris_lvecfg_nextyrleaveapply;


                return LC_CarryFwdCheck + "," + LC_CarryFwddays;
            }
        }

        function getmonthno(Cal_Endmonth) {
            let M_No;
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

                let leaverecord = scriptContext.currentRecord;
                let Leave_Encashment = leaverecord.getValue(
                    "custrecord_hris_lve_applylveencashment"
                );

                if (Leave_Encashment == false) {
                    let date = leaverecord.getValue("custrecord_hris_lve_fromdate");
                    if (date) {
                        //  date = nlapiStringToDate(date);
                        date = format.parse({
                            value: date,
                            type: format.Type.DATE
                        });
                        let month = date.getMonth() + 1;
                        let year = date.getFullYear();
                        leaverecord.setValue("custrecord_hris_lva_year", year, true, true);

                        leaverecord.setValue("custrecord_hris_lve_month", month, true, true);
                    }
                }
                // Compoff validate Checking
                let leave_type = leaverecord.getValue('custrecord_hris_lve_leavetype');
                if (leave_type) {

                    let EmployeeName = leaverecord.getValue('custrecord_hris_lve_employeename');
                    let fromDATE = leaverecord.getValue('custrecord_hris_lve_fromdate');
                    let SequenceNo = get_sequence_no(leave_type);
                    if (SequenceNo == '5') {
                        let ValidtillDate = leaverecord.getValue('custrecord_hris_lve_validtilldate');
                        /*  ValidtillDate = format.parse({
                               value: ValidtillDate,
                               type: format.Type.DATE
                           }); */
                        ValidtillDate = moment(ValidtillDate).format('DD/MM/YYYY');

                        let compoffDATE = getcompoffdate(ValidtillDate, EmployeeName);

                        //  compoffDATE= nlapiStringToDate(compoffDATE)
                        if (compoffDATE) {
                            compoffDATE = format.parse({
                                value: compoffDATE,
                                type: format.Type.DATE
                            });
                            //   fromDATE= nlapiStringToDate(fromDATE)
                            fromDATE = format.parse({
                                value: fromDATE,
                                type: format.Type.DATE
                            });
                            if (fromDATE < compoffDATE) {
                                alert('You can not apply leave on before date of raise compoff date');
                                return false;
                            }
                        }


                    }


                }


                // Validate Leave Year Save Record
                let FromDate = leaverecord.getValue("custrecord_hris_lve_fromdate");
                let ToDate = leaverecord.getValue("custrecord_hris_lve_todate");
                let LeaveTYPE = leaverecord.getValue("custrecord_hris_lve_leavetype");
                let LeaveTYPE_text = leaverecord.getText("custrecord_hris_lve_leavetype");

                if (FromDate && ToDate) {
                    // FromDate_STRING = nlapiStringToDate(FromDate);
                    let FromDate_STRING = format.parse({
                        value: FromDate,
                        type: format.Type.DATE
                    });

                    let FromDate_YEAR = FromDate_STRING.getFullYear();

                    //ToDate_STRING = nlapiStringToDate(ToDate);
                    let ToDate_STRING = format.parse({
                        value: ToDate,
                        type: format.Type.DATE
                    });

                    let ToDate_YEAR = ToDate_STRING.getFullYear();

                    /*  let Fields = [
                       "custrecord_hris_lvecalyr_startyr",
                       "custrecord_hris_lvecalyr_endyr",
                       "custrecord_hris_lvecalyr_endmth",
                     ];
                     let CalenderYear_Record = nlapiLookupField(
                       "customrecord_hris_leave_calender_year",
                       1,
                       Fields,
                       true
                     ); */
                    let CalenderYear_Record = record.load({
                        type: 'customrecord_hris_leave_calender_year',
                        id: 1,
                        isDynamic: true,
                    });
                    let Cal_StartYear = CalenderYear_Record.getValue('custrecord_hris_lvecalyr_startyr');
                    let Cal_EndYear = CalenderYear_Record.getValue('custrecord_hris_lvecalyr_endyr');
                    let Cal_Endmonth = CalenderYear_Record.getValue('custrecord_hris_lvecalyr_endmth');
                    //Added by Florence
                    let Cal_StartYear_String = CalenderYear_Record.getText('custrecord_hris_lvecalyr_startyr');
                    let Cal_EndYear_String = CalenderYear_Record.getText('custrecord_hris_lvecalyr_endyr');

                    let monthNo = getmonthno(Cal_Endmonth);

                    let leavetypeSettings = getvalidations(LeaveTYPE);

                    leavetypeSettings = leavetypeSettings.split(",");
                    let carryforwardCHECK = leavetypeSettings[0];
                    let carryforwardDAYS = leavetypeSettings[1];

                    if (ToDate_YEAR > Cal_StartYear_String || ToDate_YEAR > Cal_EndYear_String) {
                        if (carryforwardCHECK == "T") {
                            carryforwardDAYS = parseInt(carryforwardDAYS);

                            if (carryforwardDAYS == 0) {
                                carryforwardDAYS = "";
                            }

                            if (carryforwardDAYS != null || carryforwardDAYS != "") {
                                Cal_EndYear = parseInt(Cal_EndYear);
                                monthNo = parseInt(monthNo);

                                let lastDay = new Date(Cal_EndYear, monthNo + 1, 0);
                                //  let LastCarryFwd_DATE = nlapiAddDays(lastDay, carryforwardDAYS);
                                let LastCarryFwd_DATE = moment(lastDay).add(carryforwardDAYS, 'days').format('DD/MM/YYYY')
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
                return true;




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
            let records = queryResults.asMappedResults();
            return records;
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
        return {
            pageInit: typeof pageInit !== 'undefined' ? pageInit : (typeof pageInit_leaveApplication !== 'undefined' ? pageInit_leaveApplication : (typeof pageInit_getType !== 'undefined' ? pageInit_getType : null)),
            fieldChanged: typeof fieldChanged !== 'undefined' ? fieldChanged : (typeof fieldchange_Leave_apply !== 'undefined' ? fieldchange_Leave_apply : (typeof fieldChange_callPOPWindow !== 'undefined' ? fieldChange_callPOPWindow : null)),
            saveRecord: typeof saveRecord !== 'undefined' ? saveRecord : (typeof onSave_Leave_Application !== 'undefined' ? onSave_Leave_Application : null),
            Cancelclick: typeof Cancelclick !== 'undefined' ? Cancelclick : null,
            Settlementclick: typeof Settlementclick !== 'undefined' ? Settlementclick : null,
            HRSettlementclick: typeof HRSettlementclick !== 'undefined' ? HRSettlementclick : null
        };
    })();
    const CS_hris_leave_cancel_cs = (() => {
define(['N/search', 'N/query', 'N/format', 'N/record', 'N/currentRecord', 'N/url'],
    function (search, query, format, record, currentRecord, url) {


        function pageInit(scriptContext) {
            //debugger;
            try {

                let leaverecord = scriptContext.currentRecord;
              // 1. Load the specific record instance
 /*    let compChangeRecord = record.load({
        type: 'customrecord_hris_employee_compen_change',
        id: 1// Replace with your actual dynamic ID variable
    });

    // 2. Get the field value and store it in a variable
    let annualGrossSalary = compChangeRecord.getValue({
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
        function fieldChanged(scriptContext) {
            //debugger;
            try {

                let leaverecord = scriptContext.currentRecord;
                if (scriptContext.fieldId == 'custrecord_hris_lve_fromdate' || scriptContext.fieldId == 'custrecord_hris_lve_todate' || scriptContext.fieldId == 'custrecord_hris_lve_leavereason') {
                    let fromdate = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_fromdate'
                    }) || '';
                    log.debug('fromdate', fromdate);
                    let todate = leaverecord.getValue({
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
                    let fromdateyear = fromdate.getFullYear();
                    log.debug("Month year", fromdateyear);
                    let totaldays = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_totalnodays'
                    }) || 0;
                    log.debug('totaldays', totaldays);
                    let leavetype = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_leavetype'
                    }) || '';
                    log.debug('Leave Type', leavetype);

                    let empname = leaverecord.getValue({
                        fieldId: 'custrecord_hris_lve_employeename'
                    }) || '';
                    log.debug('Employee Name', empname);
                    let Leave_type_seqno = get_sequence_no(leavetype);
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
                        let sicksqlrecord = queryResults.asMappedResults();
                        log.debug('sicksql', sicksql)
                        log.debug(' sicksqlrecord.length * ', sicksqlrecord.length);
                        let totalnodays = 0;
                        if (sicksqlrecord.length > 0) {
                            totalnodays = sicksqlrecord[0].totdays || 0;
                        }
                        totaldays = parseFloat(totaldays) + parseFloat(totalnodays);

                        /*    let leavesql = "select a.custrecord_hris_lveconfig_leavename ,a.custrecord_hris_lveconfig_leaveshortname from customrecord_hris_leaveconfig a join customrecord_hris_emp_leave_type_master b \
                                      on a.custrecord_hris_lveconfig_leavename = b.id  where b.id = 9 and a.id =" + leavetype;
                                   let queryResults = query.runSuiteQL({
                                       query: leavesql
                                   });
                                   let leavesqlrecord = queryResults.asMappedResults();
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

                let params = {
                    custparam_flag: 1 // Replace 'paramName' with the name of your parameter and 'paramValue' with its value
                };


                let flagid = 1;
                let url = '/app/common/custom/custrecordentry.nl?rectype=894&e=T&id=' + leaverecordid + '&flag=' + flagid;


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
                  let url = '/app/common/custom/custrecordentry.nl?rectype=1905&leaverecordid=' + leaverecordid + '&flag=' + flagid +'&empid='+empid;
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
              let url = '/app/common/custom/custrecordentry.nl?rectype=1873&leaverecordid=' + leaverecordid + '&flag=' + flagid +'&empid='+empid;
              window.location.href = url; 
          
    } 
    
       catch (e) {
           console.log("error in open: " + e);
       }
   } 
        function saveRecord(scriptContext) {
            debugger;
            try {

                let leaverecord = scriptContext.currentRecord;
                let leaverecordid = leaverecord.id;
                let flag = getUrlParameter('flag');
                log.debug('Flag Check', flag);
                log.debug('leaverecordid', leaverecordid);

                let cancelcheck = leaverecord.getValue({
                    fieldId: 'custrecord_hris_lve_cancellation'
                });
                log.debug('Cancel check', cancelcheck);
                let cancelstatus = leaverecord.getValue({
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
            let records = queryResults.asMappedResults();
            return records;
        }
        function getUrlParameter(param) {
            debugger;
            let query = window.location.search.substring(1);
            let vars = query.split("&");
            for (let i = 0; i < vars.length; i++) {
                let pair = vars[i].split("=");
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
        return {
            pageInit: typeof pageInit !== 'undefined' ? pageInit : (typeof pageInit_leaveApplication !== 'undefined' ? pageInit_leaveApplication : (typeof pageInit_getType !== 'undefined' ? pageInit_getType : null)),
            fieldChanged: typeof fieldChanged !== 'undefined' ? fieldChanged : (typeof fieldchange_Leave_apply !== 'undefined' ? fieldchange_Leave_apply : (typeof fieldChange_callPOPWindow !== 'undefined' ? fieldChange_callPOPWindow : null)),
            saveRecord: typeof saveRecord !== 'undefined' ? saveRecord : (typeof onSave_Leave_Application !== 'undefined' ? onSave_Leave_Application : null),
            Cancelclick: typeof Cancelclick !== 'undefined' ? Cancelclick : null,
            Settlementclick: typeof Settlementclick !== 'undefined' ? Settlementclick : null,
            HRSettlementclick: typeof HRSettlementclick !== 'undefined' ? HRSettlementclick : null
        };
    })();
    const CS_hris_leave_fileuploadwindow_cs = (() => {
let g_Type = "";

function pageInit_getType(type)
{
	g_Type = type;
}


function validateDelete_fileUpload(type){
	
	//getting the current employee and exp rep employee
	let i_Current_User = nlapiGetUser();
	let i_Exp_Emp = nlapiGetFieldValue('entity');
   
 
	if (type == 'recmachcustrecord_exp_link') 
	{
		
			let i_File_Upload_Id = nlapiGetCurrentLineItemValue('recmachcustrecord_exp_link', 'custrecord_attach_file');
			if (_logValidation(i_File_Upload_Id)) {
				let url = nlapiResolveURL('SUITELET', 'customscript_hris_ess_deletefilecab_sl', 'customdeploy_hris_ess_deletefilecab_sl') + '&entity=' + i_File_Upload_Id;
				nlapiRequestURL(url);
			}		
	}//end of if (type == 'recmachcustrecord_exp_link') 
	return true;

}
// END VALIDATE FIELD ===============================================


function fieldChange_callPOPWindow(type, name, linenum){
	
	let i_Current_User = nlapiGetUser();
	let s_record_type = nlapiGetRecordType();
	let _prefix = '';
	let s_folder_name_document = '';
    let custformscript =nlapiGetFieldValue('custrecord_hris_lve_script_version');
 //  nlapiLogExecution("DEBUG","custformscript",custformscript)
//if (custformscript == 1){ 

	
	if (s_record_type.toString().toLowerCase() == 'customrecord_hris_leaveapplication') // If record is Employee Profile
    {
		
		_prefix = 'ihr_la';
		//alert('_prefix');
		s_folder_name_document = 'ELS Support Document';
    }
	
	if(name == 'custrecord_hris_lve_attachdocument')
	{	
		let s_folder_name = s_folder_name_document;
		let s_fld_attach_file = 'custrecord_hris_lve_supportdocument';
		let s_sublist_id = '';
		
		let b_attachFile = nlapiGetFieldValue(name);
		
		 if (b_attachFile == 'T') {
			 //POPUP window Open
            fileUploadOptimized(s_record_type, name, s_fld_attach_file, false, s_sublist_id, s_folder_name);
        }
        else {
            let i_File_Upload_Id = nlapiGetFieldValue(s_fld_attach_file);
            if (_logValidation(i_File_Upload_Id)) {
                let url = nlapiResolveURL('SUITELET', 'customscript_hris_ess_deletefilecab_sl', 'customdeploy_hris_ess_deletefilecab_sl');
                    url += '&entity=' + i_File_Upload_Id
				nlapiRequestURL(url);
                // alert('success');
                nlapiSetFieldValue(s_fld_attach_file, '');
            }
        }
	} 
	
	
	
	
//}// End function field change
}
function fileUploadOptimized(recType, changedFldID, attchFldID, isLineFld, machineNm, folderNmPrefix){
//alert('folderNmPrefix-'+folderNmPrefix);
    if (isLineFld == true) {
    
        let b_uploafFileCheck = nlapiGetCurrentLineItemValue(machineNm, changedFldID);
        
        if (b_uploafFileCheck == 'T') {//POP Open
            //-------------------Open the popup for upload file-------------------------
            let i_File_Upload_Id = nlapiGetCurrentLineItemValue(machineNm, attchFldID);
            
            let i_recLineId = nlapiGetCurrentLineItemIndex(machineNm);
            
            let winURL = nlapiResolveURL('SUITELET', 'customscript_hris_ess_uploadfile_sl', 'customdeploy_hris_ess_uploadfile_sl');
            
            winURL += '&recType=' + recType + '&attachFldNm=' + attchFldID + '&changedFldNm=' + changedFldID + '&fileUploadId=' + i_File_Upload_Id + '&machineNm=' + machineNm + '&isLineFld=' + isLineFld + '&folderNmPrefix=' + folderNmPrefix;
            
            nlExtOpenWindow(winURL, '', 450, 300, '', false, "Upload File");
            
        }//POP Open
        
    }//end if (isLineFld == true)
    else
    {
    	let b_uploafFileCheck = nlapiGetFieldValue(changedFldID);
        
        if (b_uploafFileCheck == 'T') {//POP Open
            //-------------------Open the popup for upload file-------------------------
            let i_File_Upload_Id = nlapiGetFieldValue(attchFldID);
            let winURL = nlapiResolveURL('SUITELET', 'customscript_hris_ess_uploadfile_sl', 'customdeploy_hris_ess_uploadfile_sl');
            
            winURL += '&recType=' + recType + '&attachFldNm=' + attchFldID + '&changedFldNm=' + changedFldID + '&fileUploadId=' + i_File_Upload_Id + '&machineNm=' + machineNm + '&isLineFld=' + isLineFld + '&folderNmPrefix=' + folderNmPrefix;
            
            nlExtOpenWindow(winURL, '', 450, 300, '', false, "Upload File");
        }
    }//else of if (isLineFld == true)
   
    
}// End function fileUploadOptimized

//Below function trigger from suitelet form (upload file suitelet)
function setFileOptimized(File_Id, type, attchFldID, fileExist, foldername, fileSize, fileType, changedFldID, machineNm, isLineFld)
{
	
	//For line level upload
    if (isLineFld == 'true') 
    {     
        nlapiSetCurrentLineItemValue(machineNm, attchFldID, File_Id);            
        closePopup();        
    }//end if (isLineFld)
    else
    {
    	//For Body field upload    	
    	nlapiSetFieldValue(attchFldID, File_Id);            
        closePopup();
    }    
}//End function setFileOptimized


//Below function trigger from suitelet form (upload file suitelet)
function folderDoesNotExist()
{
	alert('Please Create Folder');
	closePopup();
}

//-----------------------------------------

function _logValidation(value){
    if (value != null && value.toString() != null && value != '' && value != undefined && value.toString() != undefined && value != 'undefined' && value.toString() != 'undefined' && value.toString() != 'NaN' && value != NaN) {
        return true;
    }
    else {
        return false;
    }
}
        return {
            pageInit: typeof pageInit !== 'undefined' ? pageInit : (typeof pageInit_leaveApplication !== 'undefined' ? pageInit_leaveApplication : (typeof pageInit_getType !== 'undefined' ? pageInit_getType : null)),
            fieldChanged: typeof fieldChanged !== 'undefined' ? fieldChanged : (typeof fieldchange_Leave_apply !== 'undefined' ? fieldchange_Leave_apply : (typeof fieldChange_callPOPWindow !== 'undefined' ? fieldChange_callPOPWindow : null)),
            saveRecord: typeof saveRecord !== 'undefined' ? saveRecord : (typeof onSave_Leave_Application !== 'undefined' ? onSave_Leave_Application : null),
            Cancelclick: typeof Cancelclick !== 'undefined' ? Cancelclick : null,
            Settlementclick: typeof Settlementclick !== 'undefined' ? Settlementclick : null,
            HRSettlementclick: typeof HRSettlementclick !== 'undefined' ? HRSettlementclick : null
        };
    })();
    const CS_hris_leaveapplicationupdated_cs = (() => {
let frmhalfDay;
let toHalfDay;
let datediff = 0;

function pageInit_leaveApplication(type) {
    if (type == 'create') {
        debugger;
        nlapiDisableField('custrecord_hris_lve_noofencashmentdays', true);
        nlapiDisableField('customrecord_hris_leaveapplication', true);
        nlapiDisableField('custrecord_hris_lve_cancelreason', true);
        nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff);
    }

}
let TYPE;
function onSave_Leave_Application() {
    let encashmentCheck = nlapiGetFieldValue('custrecord_hris_lve_applylveencashment')
    let FromDate = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
    let ToDate = nlapiGetFieldValue('custrecord_hris_lve_todate');
    let noOfEncashDays = nlapiGetFieldValue('custrecord_hris_lve_noofencashmentdays');

    if (encashmentCheck == 'T' && (noOfEncashDays == '' || noOfEncashDays == 'undefined' || noOfEncashDays == null)) {
        alert('Please Enter No. of Encashment Days')
        return false;
    }


    if (encashmentCheck == 'F') {
        if (FromDate == '' || FromDate == 'undeefined' || FromDate == null) {
            alert('Please Enter From Date')
            return false;
        }
    }
    if (encashmentCheck == 'F') {
        if (ToDate == '' || ToDate == 'undeefined' || ToDate == null) {
            alert('Please Enter To Date');
            return false;
        }
    }
  let leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
  let seq_no_search = get_sequence_no(leave_type)
 /*   let E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
    let leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');  */
    let emp_name = nlapiGetFieldValue('custrecord_hris_lve_employeename')
    nlapiLogExecution('DEBUG','Seq No',seq_no_search);
    let seq_no_split = seq_no_search.split('#')
    let seq_no = seq_no_split[0];

    if(seq_no !=3){
    let leavebalanceRec = searchLeaveBalance(leave_type, emp_name)
    let LEAVEBAL = leavebalanceRec.split('#');
    let leavebalance = LEAVEBAL[0];
    nlapiLogExecution('DEBUG', 'leavebalance', leavebalance)
    nlapiSetFieldValue('custrecord_hris_lve_leavebalance', leavebalance, false)
    let roundoffleavebalance = GetRoundOffvalue(leavebalance);
    nlapiSetFieldValue('custrecord_hris_lve_leavebalance_wholeno', roundoffleavebalance, false)
    }


    let reason = nlapiGetFieldValue('custrecord_hris_lve_leavereason')
    let encashment = nlapiGetFieldValue('custrecord_hris_lve_applylveencashment')
    if (encashment == 'F') {
        if (reason == '' || reason == 'undefined' || reason == null) {

        }

    }

// Getting External Id

   leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')
    
/* let E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
let leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');   */


    seq_no_search = get_sequence_no(leave_type)
    seq_no_split = seq_no_search.split('#')
    seq_no = seq_no_split[0];

    if (seq_no == 5) {

        let tot_days = nlapiGetFieldValue('custrecord_hris_lve_totalnodays')
        let validTillDate = nlapiGetFieldValue('custrecord_hris_lve_validtilldate')

        if (tot_days == 0.5) {

            let f_hday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
            let t_hday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');


            if (f_hday == 'F' && t_hday == 'F') {
                alert('check anyof halfday ')
                return false;
            }
        }
        if (validTillDate == null || validTillDate == '' || validTillDate == 'undefined') {

            alert('Please select the compoff first.')
            return false;
        }



    }
    let leave_array = new Array();
    let filters = new Array();
    let column = new Array();
    let total_days = nlapiGetFieldValue('custrecord_hris_lve_totalnodays');
    //Get External id
    leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
   /*  let E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
    let leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');   */

    filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
  // filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type))
    column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_suportdocallow'));
    column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_mindaysupport'));
    let leaveconf_results = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
    if (leaveconf_results != null) {
        let support_doc_allowed = leaveconf_results[0].getValue('custrecord_hris_lveconfig_suportdocallow')
        if (support_doc_allowed == 'T') {
            let support_doc_days = leaveconf_results[0].getValue('custrecord_hris_lveconfig_mindaysupport')
            if (total_days > support_doc_days) {
                let support_doc = nlapiGetFieldValue('custrecord_hris_lve_supportdocument');
                if (support_doc == '' || support_doc == 'undefined' || support_doc == null) {
                    alert('Please attach support document');
                    return false;
                }
            }
        }
    }



    return true;

}

function fieldchange_Leave_apply(type, name, linenum) {
    debugger;
    let leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');

    




    if (name == 'custrecord_hris_lve_todate') {

        let fromDate = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
        let toDate = nlapiGetFieldValue('custrecord_hris_lve_todate');
        fromDate = nlapiStringToDate(fromDate);
        toDate = nlapiStringToDate(toDate);
        if (toDate < fromDate) {
            alert('To Date should be greater than From Date ')
            nlapiSetFieldValue('custrecord_hris_lve_todate', '', false);
            return false;
        }

        if (!fromDate) {
            alert("Please select From Date First and then you can select To Date ");
            nlapiSetFieldValue('custrecord_hris_lve_todate', '', false);
            return false;
        }

    }

    if (name == 'custrecord_hris_lve_fromdate') {

        let fromDate = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
        let toDate = nlapiGetFieldValue('custrecord_hris_lve_todate');
        fromDate = nlapiStringToDate(fromDate);
        if(toDate){
        toDate = nlapiStringToDate(toDate);
        
        if (fromDate > toDate) {
            alert('From Date should be lesser than To Date ')
            nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false);
            return false;
        }
    }
      

    }

    




    let getUserId = nlapiGetFieldValue('custrecord_hris_lve_employeename');

    if (name == 'custrecord_hris_lve_leavetype') {
       let leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
      /*  let E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
        let leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');  */
        let employee_name = nlapiGetFieldValue('custrecord_hris_lve_employeename');



        if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
            let seq_no_search = get_sequence_no(leave_type)
            let seq_no_split = seq_no_search.split('#')
            let seq_no = seq_no_split[0];


            if (seq_no == 5) {
                nlapiDisableField('custrecord_hris_lve_todate', true)

            } else if(seq_no !=3)  {
                let leavebalanceRec = searchLeaveBalance(leave_type, employee_name);
                let LEAVEBAL = leavebalanceRec.split('#');
                let leavebalance = LEAVEBAL[0];
                let LeaveEncashbal = LEAVEBAL[1];
                nlapiSetFieldValue('custrecord_hris_lve_leavebalance', leavebalance, false)
                if (leavebalance > 1){
                    let roundoffleavebalance = GetRoundOffvalue(leavebalance);
                }
                else{
                    let roundoffleavebalance = leavebalance
                }
               
                nlapiSetFieldValue('custrecord_hris_lve_leavebalance_wholeno', roundoffleavebalance, false)
                nlapiSetFieldValue('custrecord_hris_lve_validtilldate', '', false)
                if (LeaveEncashbal != null && LeaveEncashbal != '') {
                    nlapiSetFieldValue('custrecord_hris_lve_encashmentlevbalance', LeaveEncashbal, false)

                }
            }
        }

        if (leave_type == '')
        {
            nlapiSetFieldValue('custrecord_hris_lve_leavebalance', '', false, false);
            nlapiSetFieldValue('custrecord_hris_lve_leavebalance_wholeno', '',false,false); 

            let url = nlapiResolveURL('RECORD', 'customrecord_hris_leaveapplication', null, null)
            window.onbeforeunload = null;
            window.open(url, '_self')

        }

    }
    if (name == 'custrecord_hris_lve_fromdate' || name == 'custrecord_hris_lve_todate') {

        let FrmDt;
        let ToDt;
       let leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
      /* let E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
    let leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');  */

        if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
            let fromDate = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
            frmhalfDay = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
            let toDate = nlapiGetFieldValue('custrecord_hris_lve_todate');
            toHalfDay = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');

            let Leave_bal = nlapiGetFieldValue('custrecord_hris_lve_leavebalance');
            if (fromDate != '' && fromDate != 'undefined' && fromDate != null && toDate != '' && toDate != 'undefined' && toDate != null) {
                if (fromDate == toDate ) {

                  let leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')
                /*   let E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
                   let leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid'); */ 
                    let seq_no_search = get_sequence_no(leave_type)
                    let seq_no_split = seq_no_search.split('#')
                    let seq_no = seq_no_split[0];

                    if (seq_no == 2 || seq_no == 8 || seq_no ==13) {

                        if (Leave_bal == 0) {


                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 1, false)
                        }


                    }

                    if (seq_no != 2 && seq_no != 8 && seq_no !=13) {
                        if (Leave_bal < 1) {
                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', Leave_bal, false)
                        }
                        if (Leave_bal >= 1) {
                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 1, false)
                        }


                    }



                }

               
                if (fromDate != toDate) {

                    fromDate = nlapiStringToDate(fromDate);

                    let FrmMonth = fromDate.getMonth() + 1;

                    FrmDt = fromDate.getDate();



                    toDate = nlapiStringToDate(toDate);

                    let TOMonth = toDate.getMonth() + 1;

                    ToDt = toDate.getDate();



                    let weeklyoffIncCheck = weeklyOffInclude(leave_type);
                    let holiday_TF_check = holidayInclude(leave_type)
                    nlapiLogExecution("debug", "holiday_TF_check", holiday_TF_check);
                    nlapiLogExecution("debug", "weeklyoffIncCheck", weeklyoffIncCheck);
                    let empWeeklyoff = searchEmpsWeeklyOff(getUserId);
                    nlapiLogExecution("debug", "empWeeklyoff", empWeeklyoff);
                    let WEEKLYOFF = empWeeklyoff.split('#')
                    let WeeklyOfCount = WEEKLYOFF[0]

                    let WeeklyOffInW = WEEKLYOFF[1];

                    if (WeeklyOfCount == 2 || WeeklyOfCount == 1)
                    {

                        let finalWeeklyOff = WeeklyOffInW.split(',');
                        let firstWeeklyOffD = finalWeeklyOff[0];
                        // By Florence
                       /*  if (firstWeeklyOffD) {
                            firstWeeklyOffD = nlapiLookupField('customlist_hris_week_days', firstWeeklyOffD, 'custrecord_hris_lve_wkday_act_seq_no');
                        } */
                        let secWeeklyOffD = finalWeeklyOff[1];
                       /*  if (secWeeklyOffD) {
                            secWeeklyOffD = nlapiLookupField('customlist_hris_week_days', secWeeklyOffD, 'custrecord_hris_lve_wkday_act_seq_no');
                        } */

                        if (FrmMonth == TOMonth) 
						{
                            if (weeklyoffIncCheck == 'T') 
							{


                                let frm_halfday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                                let to_halfday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');

                               
                               
                               // if (frm_halfday == 'F' && to_halfday == 'F') {


                                    if (holiday_TF_check == 'T') {
                                        let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());

                                        let diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                                        diffDays = diffDays + 1;

                                        nlapiSetFieldValue('custrecord_hris_lve_totalnodays', diffDays, false)



                                    }
                                    if (holiday_TF_check == 'F') {
                                        let holiday_count = searchEmpholidays(getUserId, fromDate, toDate, FrmDt, ToDt)
                                        if (holiday_count == 0) {
                                            datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        } else {
                                            datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(holiday_count) + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                    }
                             //  } 

                            } 
                            else
                            {
                                let frm_halfday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                                nlapiLogExecution("debug", "frm_halfday", frm_halfday);
                                let to_halfday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');
                                nlapiLogExecution("debug", "frm_halfday", to_halfday);
                              
                             //   if (frm_halfday == 'F' && to_halfday == 'F') {
                                    nlapiLogExecution("debug", "holiday_TF_check", holiday_TF_check);
                                    if (holiday_TF_check == 'T') {

                                        let frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
                                        let to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate')
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
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                        if (flag == '1') {
                                            let final_flag = parseFloat(flag) * 1
                                            datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                        if (flag == '2') {
                                            let final_flag = parseFloat(flag) * 1
                                            datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                        if (flag > '2') {
                                            let final_flag = parseFloat(flag) * 1
                                            datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                    }
                                    if (holiday_TF_check == 'F') {

                                        let holiday_count = searchEmpholidays(getUserId, fromDate, toDate, FrmDt, ToDt, FrmMonth, TOMonth)

                                        let context = nlapiGetContext();
                                        let user = context.getUser();
                                        // by florence
                                     /*    nlapiLogExecution('DEBUG', 'user', user);
                                        if (user == '329738') {
                                            alert('holiday_count' + holiday_count)
                                        } */

                                        let frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
                                        let to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate')

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
                                                datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            } else {
                                                let datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(holiday_count) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            }
                                        }
                                        if (flag == '1') {
                                            if (holiday_count == 0) {
                                                let final_flag = parseFloat(flag) * 1
                                                datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            } else {
                                                let final_flag = parseFloat(flag) * 1
                                                datediff = (((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            }
                                        }
                                        if (flag == '2') {
                                            if (holiday_count == 0) {
                                                let final_flag = parseFloat(flag) * 1
                                                datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            } else {
                                                let final_flag = parseFloat(flag) * 1
                                                datediff = (((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            }

                                        }
                                        if (flag > '2') {
                                            let final_flag = parseFloat(flag) * 1
                                            datediff = (((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag)) - parseFloat(holiday_count);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                    }
                                //}

                            }

                        }
                        else
                        {
                            if (weeklyoffIncCheck == 'T') 
							{
                                let frm_halfday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                                let to_halfday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');
                               

                               // if (frm_halfday == 'F' && to_halfday == 'F') {
                                    if (holiday_TF_check == 'T') {

                                        let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());

                                        let diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                                        diffDays = diffDays + 1;

                                        nlapiSetFieldValue('custrecord_hris_lve_totalnodays', diffDays, false)

                                    }
                                    if (holiday_TF_check == 'F') {
                                        let holiday_count = searchEmpholidays(getUserId, fromDate, toDate, FrmDt, ToDt, FrmMonth, TOMonth)

                                        if (holiday_count == 0) {
                                            let monthdays = getArryMonthDays(FrmMonth);
                                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                            let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                            let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                            finaldays = finaldays + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)

                                        } else {
                                            let monthdays = getArryMonthDays(FrmMonth);
                                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;

                                            let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                            let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                            finaldays = finaldays + 1;
                                            finaldays = finaldays - parseFloat(holiday_count);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }
                                    }
                               // }

                            }
                            else
                            {
                                let frm_halfday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                                let to_halfday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');

                                
                                //if (frm_halfday == 'F' && to_halfday == 'F') 
								//{
                                    if (holiday_TF_check == 'T') 
									{
                                        let frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
                                        let to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate')
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
										nlapiLogExecution('DEBUG', 'holiday_TF_check T day_split', day_split)
                                        nlapiLogExecution('DEBUG', 'holiday_TF_check T firstWeeklyOffD', firstWeeklyOffD)
                                        nlapiLogExecution('DEBUG', 'holiday_TF_check T secWeeklyOffD', secWeeklyOffD)
										nlapiLogExecution('DEBUG', 'holiday_TF_check T flag', flag)
                                        if (flag == '0') {
                                            let monthdays = getArryMonthDays(FrmMonth);
                                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                            let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                            let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                            finaldays = finaldays + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }

                                        if (flag == '1') {
                                            let final_flag = parseFloat(flag) * 1
                                            let monthdays = getArryMonthDays(FrmMonth);
                                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);

                                            let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                            let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                            finaldays = finaldays + 1;
                                            finaldays = finaldays - parseFloat(final_flag);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }
                                        if (flag == '2') {
                                            let final_flag = parseFloat(flag) * 1
                                            let monthdays = getArryMonthDays(FrmMonth);
                                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);

                                            let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                            let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                            finaldays = finaldays + 1;
                                            finaldays = finaldays - parseFloat(final_flag);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }
                                        if (flag > '2') {
                                            let final_flag = parseFloat(flag) * 1


                                            let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                            let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                            finaldays = finaldays + 1 - parseFloat(final_flag);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }
                                    }
                                    if (holiday_TF_check == 'F') 
									{
                                        let holiday_count = searchEmpholidays(getUserId, fromDate, toDate, FrmDt, ToDt, FrmMonth, TOMonth)
                                        let frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
                                        let to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate')
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
                                        nlapiLogExecution('DEBUG', 'a1 day_split', day_split)
                                        nlapiLogExecution('DEBUG', 'a1 firstWeeklyOffD', firstWeeklyOffD)
                                        nlapiLogExecution('DEBUG', 'a1 secWeeklyOffD', secWeeklyOffD)

                                        let flag = 0;
                                        for (let j = 0; j < tot_days_count; j++) {
                                            let one_by_one_day = day_split[j]
                                            if (one_by_one_day == firstWeeklyOffD || one_by_one_day == secWeeklyOffD) {
                                                flag = flag + 1;

                                            }

                                        }
										nlapiLogExecution('DEBUG', 'a1 flag', flag)
										nlapiLogExecution('DEBUG', 'a1 holiday_count', holiday_count)
                                        if (flag == '0') {
                                            if (holiday_count == 0) {
                                                let monthdays = getArryMonthDays(FrmMonth);
                                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);

                                                let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            } else {
                                                let monthdays = getArryMonthDays(FrmMonth);
                                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);

                                                let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                finaldays = finaldays - parseFloat(holiday_count);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            }
                                        }
                                        if (flag == '1') {
                                            if (holiday_count == 0) {
                                                let final_flag = parseFloat(flag) * 1
                                                let monthdays = getArryMonthDays(FrmMonth);
                                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                finaldays = finaldays - parseFloat(final_flag)
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            } else {
                                                let final_flag = parseFloat(flag) * 1
                                                let monthdays = getArryMonthDays(FrmMonth);
                                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                finaldays = finaldays - parseFloat(final_flag)
                                                finaldays = finaldays - parseFloat(holiday_count)
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            }
                                        }
                                        if (flag == '2') {
                                            if (holiday_count == 0) {
                                                let final_flag = parseFloat(flag) * 1
                                                let monthdays = getArryMonthDays(FrmMonth);
                                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                finaldays = finaldays - parseFloat(final_flag)
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            } else {
                                                let final_flag = parseFloat(flag) * 1
                                                let monthdays = getArryMonthDays(FrmMonth);
                                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                finaldays = finaldays - parseFloat(final_flag)
                                                finaldays = finaldays - parseFloat(holiday_count)

                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            }
                                        }
                                        if (flag > '2') {
                                            if (holiday_count == 0) {

                                                let final_flag = parseFloat(flag) * 1
                                                let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1;
                                                finaldays = finaldays - parseFloat(final_flag);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            } else {
                                                let final_flag = parseFloat(flag) * 1

                                                let timeDiff = Math.abs(toDate.getTime() - fromDate.getTime());
                                                let finaldays = Math.ceil(timeDiff / (1000 * 3600 * 24));
                                                finaldays = finaldays + 1 - parseFloat(final_flag);
                                                finaldays = finaldays - parseFloat(holiday_count);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            }
                                        }
                                    }
                                //}

                            }
                        }
                    }
                    else
                    {
                        if (FrmMonth == TOMonth) {
                            if (weeklyoffIncCheck == 'T') {
                                let frm_halfday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                                let to_halfday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');

                                
                              //  if (frm_halfday == 'F' && to_halfday == 'F') {
                                    if (holiday_TF_check == 'T') {
                                        datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                        nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                    }
                                    if (holiday_TF_check == 'F') {

                                        let holiday_count = searchEmpholidays(getUserId, fromDate, toDate)

                                        if (holiday_count == 0) {
                                            datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        } else {

                                            datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(holiday_count) + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                    }
                               // }
                            } else
                            {
                                let frm_halfday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                                let to_halfday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');
                               
                               // if (frm_halfday == 'F' && to_halfday == 'F') {

                                    if (holiday_TF_check == 'T') {

                                        let frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
                                        let to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate')
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

                                            if (one_by_one_day == WeeklyOffInW) {
                                                flag = flag + 1;

                                            }

                                        }
                                        if (flag == '0') {
                                            datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                        if (flag == '1') {
                                            let final_flag = parseFloat(flag) * 1
                                            datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1)
                                            datediff = parseFloat(datediff) - parseFloat(final_flag);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                        if (flag >= '2') {

                                            let final_flag = parseFloat(flag) * 1
                                            datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                        }
                                    }
                                    if (holiday_TF_check == 'F') {
                                        let holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                                        let frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
                                        let to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate')
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
                                            if (one_by_one_day == WeeklyOffInW) {
                                                flag = flag + 1;
                                            }

                                        }
                                        if (flag == '0') {
                                            if (holiday_count == 0) {
                                                datediff = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            } else {
                                                let datediff = (parseFloat(ToDt) - parseFloat(FrmDt)) - parseFloat(holiday_count) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            }
                                        }
                                        if (flag == '1') {
                                            if (holiday_count == 0) {
                                                let final_flag = parseFloat(flag) * 1
                                                datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            } else {

                                                let final_flag = parseFloat(flag) * 1

                                                datediff = (parseFloat(ToDt) - parseFloat(FrmDt) + 1);
                                                datediff = parseFloat(datediff) - parseFloat(final_flag)
                                                datediff = parseFloat(datediff) - parseFloat(holiday_count);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            }
                                        }

                                        if (flag >= '2') {
                                            if (holiday_count == 0) {
                                                let final_flag = parseFloat(flag) * 1
                                                datediff = ((parseFloat(ToDt) - parseFloat(FrmDt)) + 1) - parseFloat(final_flag);
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            } else {

                                                let final_flag = parseFloat(flag) * 1

                                                datediff = (parseFloat(ToDt) - parseFloat(FrmDt) + 1);
                                                datediff = (parseFloat(datediff) - parseFloat(final_flag));
                                                datediff = (parseFloat(datediff) - parseFloat(holiday_count));
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', datediff, false)
                                            }
                                        }

                                    }
                                //}
                            }
                        }
                        else
                        {
                            if (weeklyoffIncCheck == 'T') {
                                let frm_halfday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                                let to_halfday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');
                                
                                //if (frm_halfday == 'F' && to_halfday == 'F') {
                                    if (holiday_TF_check == 'T') {
                                        let monthdays = getArryMonthDays(FrmMonth);
                                        let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                        let finaldays = parseFloat(ToDt) + firstMonthDays;
                                        nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                    }
                                    if (holiday_TF_check == 'F') {
                                        let holiday_count = searchEmpholidays(getUserId, fromDate, toDate)
                                        if (holiday_count == 0) {
                                            let monthdays = getArryMonthDays(FrmMonth);
                                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                            let finaldays = parseFloat(ToDt) + firstMonthDays;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        } else {
                                            let monthdays = getArryMonthDays(FrmMonth);
                                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt) + 1;
                                            let finaldays = (parseFloat(ToDt) + parseFloat(firstMonthDays)) - parseFloat(holiday_count);
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }
                                    }
                               // }
                            }
                            else
                            {
                                let frm_halfday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                                let to_halfday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');
                                
                              //  if (frm_halfday == 'F' && to_halfday == 'F') {
                                    if (holiday_TF_check == 'T') {
                                        let frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
                                        let to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate')
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
                                            if (one_by_one_day == WeeklyOffInW) {
                                                flag = flag + 1;
                                            }

                                        }
                                        if (flag == '0') {
                                            let monthdays = getArryMonthDays(FrmMonth);
                                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                            let finaldays = parseFloat(ToDt) + firstMonthDays + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }
                                        if (flag == '1') {
                                            let final_flag = parseFloat(flag);
                                            let monthdays = getArryMonthDays(FrmMonth);
                                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                            let finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }
                                        if (flag == '2') {
                                            let final_flag = parseFloat(flag);
                                            let monthdays = getArryMonthDays(FrmMonth);
                                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                            let finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }
                                        if (flag > '2') {
                                            let final_flag = parseFloat(flag);
                                            let monthdays = getArryMonthDays(FrmMonth);
                                            let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                            let finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                        }

                                    }
                                    if (holiday_TF_check == 'F') {
                                        let holiday_count = searchEmpholidays(getUserId, fromDate, toDate)

                                        let frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate')
                                        let to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate')
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
                                            if (one_by_one_day == WeeklyOffInW) {
                                                flag = flag + 1;

                                            }

                                        }
                                        if (flag == '0') {
                                            if (holiday_count == 0) {
                                                let monthdays = getArryMonthDays(FrmMonth);
                                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                let finaldays = parseFloat(ToDt) + firstMonthDays + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            } else {
                                                let monthdays = getArryMonthDays(FrmMonth);
                                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                let finaldays = (parseFloat(ToDt) + parseFloat(firstMonthDays)) - parseFloat(holiday_count) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            }
                                        }
                                        if (flag == '1') {
                                            if (holiday_count == 0) {
                                                let final_flag = parseFloat(flag);
                                                let monthdays = getArryMonthDays(FrmMonth);
                                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                let finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            } else {
                                                let final_flag = parseFloat(flag);
                                                let monthdays = getArryMonthDays(FrmMonth);
                                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                let finaldays = ((parseFloat(ToDt) + parseFloat(firstMonthDays)) - parseFloat(final_flag)) - parseFloat(holiday_count) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)

                                            }
                                        }
                                        if (flag == '2') {
                                            if (holiday_count == 0) {
                                                let final_flag = parseFloat(flag);
                                                let monthdays = getArryMonthDays(FrmMonth);
                                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                let finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            } else {
                                                let final_flag = parseFloat(flag);
                                                let monthdays = getArryMonthDays(FrmMonth);
                                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                let finaldays = ((parseFloat(ToDt) + parseFloat(firstMonthDays)) - parseFloat(final_flag)) - parseFloat(holiday_count) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            }
                                        }
                                        if (flag > '2') {
                                            if (holiday_count == 0) {
                                                let final_flag = parseFloat(flag);
                                                let monthdays = getArryMonthDays(FrmMonth);
                                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                let finaldays = parseFloat(ToDt) + firstMonthDays - parseFloat(final_flag) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            } else {
                                                let final_flag = parseFloat(flag);
                                                let monthdays = getArryMonthDays(FrmMonth);
                                                let firstMonthDays = parseFloat(monthdays) - parseFloat(FrmDt);
                                                let finaldays = ((parseFloat(ToDt) + parseFloat(firstMonthDays)) - parseFloat(final_flag)) - parseFloat(holiday_count) + 1;
                                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', finaldays, false)
                                            }
                                        }
                                    }
                              //  }
                            }
                        }
                    }
                }
            }

        } else {

            if (name == 'custrecord_hris_lve_todate') {
                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 1, false)

            }
            if (name == 'custrecord_hris_lve_fromdate') {
                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 1, false)

            }
            if (name == 'custrecord_hris_lve_fromhalfday') {
                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 0.5, false)

            }

            if (name == 'custrecord_hris_lve_tohalfday') {
                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 0.5, false)

            }
        }





        if (name == 'custrecord_hris_lve_todate') {
            let Total_no_days = nlapiGetFieldValue('custrecord_hris_lve_totalnodays');
            Total_no_days = parseFloat(Total_no_days)
            let balance = nlapiGetFieldValue('custrecord_hris_lve_leavebalance');
            balance = parseFloat(balance)

            let leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')

            let seq_no_search = get_sequence_no(leave_type)
            let seq_no_split = seq_no_search.split('#')
            let seq_no = seq_no_split[0];
            let negAllowChk = seq_no_split[1];
            let maxNegAllow = seq_no_split[2];

            if (seq_no != 2 && seq_no != 8 && seq_no !=13) {
                if (parseFloat(Total_no_days) > parseFloat(balance)) {
                    let bal_diff = parseFloat(Total_no_days) - parseFloat(balance);

                    if (negAllowChk == 'F') {
                        alert(' Leave Balance is low');
                        nlapiSetFieldValue('custrecord_hris_lve_todate', '', false);
                        nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false);
                        nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false);
                        return false;
                    } else {
                        if (maxNegAllow < bal_diff) {
                            alert('You are allowed to take maximum 15 days of negative balance')
                            nlapiSetFieldValue('custrecord_hris_lve_todate', '', false);
                            nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false);
                            nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false);
                            return false;
                        }
                    }

                }


            }



        }


        if (name == 'custrecord_hris_lve_fromdate') {

            let seq_no_search = get_sequence_no(leave_type)
            let seq_no_split = seq_no_search.split('#')
            let seq_no = seq_no_split[0];
            let getUserId = nlapiGetFieldValue('custrecord_hris_lve_employeename');
            let frm_date = nlapiGetFieldValue('custrecord_hris_lve_fromdate');






            if (frm_date != '' && frm_date != null && frm_date != 'undefined') {
           
            let check_holiday_frm_date = check_from_to_date_holiday(frm_date, getUserId)
         let leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
        /*   let E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
           let leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid'); 
 */
            if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
                // Florence Changed here
             //   if (check_holiday_frm_date == false && seq_no != '2' && seq_no != '6' && leave_type != 11 && leave_type != 12 && leave_type != 16 && leave_type != 22 && leave_type != 23 && leave_type != 24 && leave_type != 25 && leave_type != 9 && leave_type != 18) {
                if (check_holiday_frm_date == false && seq_no != '2' && seq_no != '6' && seq_no !=13 && leave_type != 5 ) {

                    alert('Holiday present on this date');
                    nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                    nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false)
                    return false;
                }
                let check_weeklyoff_frm_date = check_weeklyoff_on_frm_to_date(frm_date, getUserId);

              //  if (check_weeklyoff_frm_date == true && seq_no != '2' && seq_no != '6' && leave_type != 11 && leave_type != 12 && leave_type != 16 && leave_type != 22 && leave_type != 23 && leave_type != 24 && leave_type != 25 && leave_type != 9 && leave_type != 18) {
                if (check_weeklyoff_frm_date == true && seq_no != '2' && seq_no != '6' && seq_no !=13 && leave_type != 5) {
                    alert('weeklyoff present on this date');
                    nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                    nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false)
                    return false;
                }
            } else {
                nlapiDisableField('custrecord_hris_lve_applylveencashment', false)
            }

                let Total_no_days = nlapiGetFieldValue('custrecord_hris_lve_totalnodays');

                let tdate = nlapiGetFieldValue('custrecord_hris_lve_todate');
                let min_no_days = min_days_apply(leave_type)
                let max_no_days = max_days_apply(leave_type)

                leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')
                 let seq_no_search = get_sequence_no(leave_type)
                let seq_no_split = seq_no_search.split('#')
                let seq_no = seq_no_split[0];

                {
                    if (tdate != '' && tdate != 'undefined' && tdate != null) {

                       let leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
     
                        if (seq_no == 4) {

                            if (parseFloat(Total_no_days) == parseFloat(min_no_days)) {

                                return true;

                            }
                            if (parseFloat(Total_no_days) != parseFloat(min_no_days)) {
                                if (parseFloat(Total_no_days) == parseFloat(max_no_days)) {

                                    return true;

                                }
                                nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                                nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 0, false)
                                alert('Apply Vacation Leave 5 days or 10 days');
                                return false;

                            }

                            if (parseFloat(Total_no_days) == parseFloat(max_no_days)) {

                                return true;

                            }
                            if (parseFloat(Total_no_days) != parseFloat(max_no_days)) {
                                nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                                nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 0, false)
                                alert('Apply Vacation Leave 5 days or 10 days');
                                return false;

                            }


                        }




                        if (seq_no != 4) {

                            if (min_no_days != 0 || max_no_days != 0) {
                                if (parseFloat(Total_no_days) < parseFloat(min_no_days)) {

                                    alert('Minimum no. of days for selected leave is ' + min_no_days)
                                    nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                                    nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                                    nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false)
                                    return false;

                                }
                            }
                            if (max_no_days != 0) {

                                if (parseFloat(Total_no_days) > parseFloat(max_no_days)) {

                                    alert('total no of days should not more than ' + max_no_days)
                                    nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                                    nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                                    nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false)
                                    return false;

                                }
                            }



                        }




                    }




                }



                return true;
            } else {

                alert('enter leave type')
                return false;
            }

        }




        if (name == 'custrecord_hris_lve_todate') {
           let to_date = nlapiGetFieldValue('custrecord_hris_lve_todate');
            if (to_date != '' && to_date != null && to_date != 'undefined') {
           
                let E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
                let leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');
                let seq_no_search = get_sequence_no(E_leavetype)
                let seq_no_split = seq_no_search.split('#')
                let seq_no = seq_no_split[0];
                let getUserId = nlapiGetFieldValue('custrecord_hris_lve_employeename');
               

            let check_holiday_to_date = check_from_to_date_holiday(to_date, getUserId)

            if (check_holiday_to_date == false && seq_no != '2' && seq_no != '6' && leave_type != 11 && leave_type != 12 && leave_type != 16 && leave_type != 22 && leave_type != 23 && leave_type != 24 && leave_type != 25 && leave_type != 9 && leave_type != 18) {
                alert('Holiday present on this date');
                nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false)
                return false;
            }

            let check_weeklyoff_to_date = check_weeklyoff_on_frm_to_date(to_date, getUserId);

            if (check_weeklyoff_to_date == true && seq_no != '2' && seq_no != '6' && leave_type != 11 && leave_type != 12 && leave_type != 16 && leave_type != 22 && leave_type != 23 && leave_type != 24 && leave_type != 25 && leave_type != 9 && leave_type != 18) {
                alert('weeklyoff present on this date');
                nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false)
                return false;
            }
        } else {
            nlapiDisableField('custrecord_hris_lve_applylveencashment', false)
        }

            let Total_no_days = nlapiGetFieldValue('custrecord_hris_lve_totalnodays');
            let leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
            if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
                let fdate = nlapiGetFieldValue('custrecord_hris_lve_fromdate');
                let min_no_days = min_days_apply(leave_type)
                let max_no_days = max_days_apply(leave_type)

                let leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')
          
                {


                    if (fdate != '' && fdate != 'undefined' && fdate != null) {


                       let leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');

                         if (seq_no == 4) {


                            if (parseFloat(Total_no_days) != parseFloat(min_no_days)) {

                                if (parseFloat(Total_no_days) == parseFloat(max_no_days)) {

                                    return true;

                                }

                                nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                                nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 0, false)
                                alert('Apply Vacation Leave 5 days or 10 days');
                                return false;

                            }
                            if (parseFloat(Total_no_days) == parseFloat(min_no_days)) {

                                return true;

                            }

                            if (parseFloat(Total_no_days) != parseFloat(max_no_days)) {
                                nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                                nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                                nlapiSetFieldValue('custrecord_hris_lve_totalnodays', 0, false)
                                alert('Apply Vacation Leave 5 days or 10 days');
                                return false;

                            }

                            if (parseFloat(Total_no_days) == parseFloat(max_no_days)) {

                                return true;

                            }



                        }

                        if (seq_no != 4) {


                            if (min_no_days != 0) {
                                if (parseFloat(Total_no_days) < parseFloat(min_no_days)) {

                                    alert('Minimum no. of days for selected leave is ' + min_no_days)
                                    nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                                    nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                                    nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false)
                                    return false;

                                }

                            }
                            if (max_no_days != 0) {

                                if (parseFloat(Total_no_days) > parseFloat(max_no_days)) {

                                    alert('total no of days should not more than ' + max_no_days)
                                    nlapiSetFieldValue('custrecord_hris_lve_fromdate', '', false)
                                    nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                                    nlapiSetFieldValue('custrecord_hris_lve_totalnodays', '', false)
                                    return false;

                                }

                            }




                        }


                    }




                }




                return true;


            } else {
                alert('enter leave type');
                nlapiSetFieldValue('custrecord_hris_lve_todate', '', false)
                return false;
            }

        }





        




        if (name == 'custrecord_hris_lve_leavebalance') {

          let leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
         /*  let E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
            let leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid');  */
            let seq_no_search = get_sequence_no(leave_type)
            let seq_no_split = seq_no_search.split('#')
            let seq_no = seq_no_split[0];
            if (seq_no == 5) {

                let leave_bal = nlapiGetFieldValue('custrecord_hris_lve_leavebalance')


                if (leave_bal != 0) {

                    if (leave_bal == 1) {
                        nlapiSetFieldValue('custrecord_hris_lve_totalnodays', leave_bal, false)
                        nlapiDisableField('custrecord_hris_lve_fromhalfday', true)
                        nlapiDisableField('custrecord_hris_lve_tohalfday', true)
                    }
                    if (leave_bal == 0.5) {
                        nlapiSetFieldValue('custrecord_hris_lve_totalnodays', leave_bal, false)

                        let f_hday = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
                        let t_hday = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');
                        if (f_hday == 'T') {
                            nlapiDisableField('custrecord_hris_lve_tohalfday', true)
                        }
                        if (f_hday == 'F') {
                            nlapiDisableField('custrecord_hris_lve_tohalfday', false)


                        }
                        if (t_hday == 'T') {
                            nlapiDisableField('custrecord_hris_lve_fromhalfday', true)
                        }
                        if (t_hday == 'F') {
                            nlapiDisableField('custrecord_hris_lve_fromhalfday', false)


                        }
                    }

                }
                if (leave_bal == 0) {
                    nlapiSetFieldValue('custrecord_hris_lve_leavebalance', leave_bal, false)
                    nlapiSetFieldValue('custrecord_hris_lve_leavebalance_wholeno', leave_bal, false)
                    nlapiSetFieldValue('custrecord_hris_lve_validtilldate', '', false)
                }


            }


        }

        if (name == 'custrecord_hris_lve_cancellation') {
            

            let leave_cancel_check = nlapiGetFieldValue('custrecord_hris_lve_cancellation');
            let application_status = nlapiGetFieldText('custrecord_hris_lve_hrmsapprovalstatus');
            let application_status_id = nlapiGetFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
    
            if (leave_cancel_check == 'F') {
                nlapiDisableField('custrecord_hris_lve_cancelreason', true)
            }
            if (leave_cancel_check == 'T') {
                nlapiDisableField('custrecord_hris_lve_cancelreason', false)
            }
    
            if (application_status_id == '2') {
    
                let to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate');
    
             let leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
             /*  let E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
               let leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid'); */ 
                let leave_type_conf = nlapiLoadRecord('customrecord_hris_leaveconfig', leave_type)
    
                let leave_cancel_period = leave_type_conf.getFieldValue('custrecord_hris_lveconfig_levcancelperod');
    
                if (leave_cancel_period != 0) {
    
                    let checkbox_value = nlapiGetFieldValue('custrecord_hris_lve_cancellation');
    
                    let to_date_val_obj = nlapiStringToDate(to_date_val)
    
    
                    let cancel_date = nlapiAddDays(to_date_val_obj, leave_cancel_period);
    
    
                    let current_date = new Date();
    
    
    
                    if (cancel_date < current_date) {
                        alert('You are not allowed to cancel this leave')
                        nlapiSetFieldValue('custrecord_hris_lve_cancellation', '', false)
                        nlapiDisableField('custrecord_hris_lve_cancelreason', true)
                    }
    
                }
    
            }
    
        }


    }
   



}




function postSourcing_validate_checkbox(type, name) {
    let leaveType = nlapiGetFieldValue('custrecord_hris_lve_leavetype');


}








function searchLeaveBalance(leave_type, getUserId) {

    let leave_balance = 0;
    let encash_balance = 0;
    let filters = new Array();
    let leave_balanceNme;
    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
        nlapiLogExecution('DEBUG', 'leave_type', leave_type);
        nlapiLogExecution('DEBUG', 'getUserId', getUserId);

        filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
        filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', getUserId))
        filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'))
        let column = new Array();
        column.push(new nlobjSearchColumn('custrecord_hris_lvbal_available_leave_ba'));
        column.push(new nlobjSearchColumn('custrecord_hris_lvbal_encashable_days'));
        column.push(new nlobjSearchColumn('custrecord_hris_lvbal_leave_type'));

        let leaveBalanceresults = nlapiSearchRecord('customrecord_hris_leavebalance', null, filters, column);
        if (leaveBalanceresults != null) {
            leave_balance = leaveBalanceresults[0].getValue('custrecord_hris_lvbal_available_leave_ba')
            leave_balanceNme = leaveBalanceresults[0].getText('custrecord_hris_lvbal_leave_type')
            nlapiLogExecution('DEBUG', 'leave_balance name', leave_balanceNme);
            encash_balance = leaveBalanceresults[0].getValue('custrecord_hris_lvbal_encashable_days')

        } else {
            leave_balance = 0.00
            encash_balance = 0.00;
            alert('Leave balance is not available for selected leave type.');
        }

    }


    return leave_balance + "#" + encash_balance;
}




function searchSupportDocCheck(leave_type) {
    let supportDocCheck = false;
    let filters = new Array();
    let column = new Array();
    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
        filters.push(new nlobjSearchFilter('name', null, 'is', leave_type))


        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_suportdocallow'));
        let leaveTypeConfig = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
        if (leaveTypeConfig != null) {
            supportDocCheck = leaveTypeConfig[0].getValue('custrecord_hris_lveconfig_suportdocallow')
        }
        return supportDocCheck;


    }

}



function weeklyOffInclude(leave_type) {

    let weeklyoffCheck = false;
    let filters = new Array();
    let column = new Array();
    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
       filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
       //filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type))
        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_includeweekoff'));
        let leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
        if (leaveTypeConfigWO != null) {
            weeklyoffCheck = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_includeweekoff')
        }
        return weeklyoffCheck;

    }


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





function Get_sequence_no_of_week_days(getUserId) {
    let filters = new Array();
    let columns = new Array();

    filters.push(new nlobjSearchFilter('internalid', null, 'is', getUserId));

    columns.push(new nlobjSearchColumn('custentity_hris_empweeklyoffs'));

    let EmployeeWeeklyOff = nlapiSearchRecord('employee', null, filters, columns);

    if (EmployeeWeeklyOff != null) {
        let s_weeklyoff = new Array();
        s_weeklyoff = EmployeeWeeklyOff[0].getValue('custentity_hris_empweeklyoffs')

        nlapiLogExecution('DEBUG', 'before s_weeklyoff.length')
        let s_weeklyoff_length = s_weeklyoff.length;
        nlapiLogExecution('DEBUG', 'after s_weeklyoff.length')

        let s_weeklyoff_split = s_weeklyoff.split(',');

        let firstWeeklyOff = s_weeklyoff_split[0];

        let secWeeklyOff = s_weeklyoff_split[1];

        if (firstWeeklyOff != '' && firstWeeklyOff != 'undefined' && firstWeeklyOff != null) {
            let Filters1_week_day = new Array();
            let Columns1_week_days = new Array();


            Filters1_week_day.push(new nlobjSearchFilter('internalid', null, 'is', firstWeeklyOff));

            Columns1_week_days.push(new nlobjSearchColumn('custrecord_hris_lve_wkday_seq_no'));

            let WeeklyOff_search1 = nlapiSearchRecord('customlist_hris_week_days', null, Filters1_week_day, Columns1_week_days);

            if (WeeklyOff_search1 != null) {
                let seq_one = WeeklyOff_search1[0].getValue('custrecord_hris_lve_wkday_seq_no')
            }

            if (secWeeklyOff != '' && secWeeklyOff != 'undefined' && secWeeklyOff != null) {
                let Filters2_week_day = new Array();
                let Columns2_week_days = new Array();


                Filters2_week_day.push(new nlobjSearchFilter('internalid', null, 'is', secWeeklyOff));

                Columns2_week_days.push(new nlobjSearchColumn('custrecord_hris_lve_wkday_seq_no'));

                let WeeklyOff_search2 = nlapiSearchRecord('customlist_hris_week_days', null, Filters2_week_day, Columns2_week_days);

                if (WeeklyOff_search2 != null) {
                    let seq_two = WeeklyOff_search2[0].getValue('custrecord_hris_lve_wkday_seq_no')
                }

                return seq_one + ',' + seq_two;
            } else {
                return seq_one;

            }

        } else {
            return seq_one + ',' + seq_two;
        }




    }



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
            new nlobjSearchColumn("custrecord_hris_eds_employeeholidays")
        ]
    );

    if (EmployeeWeeklyOff != null) {
        let s_weeklyoff = EmployeeWeeklyOff[0].getValue('custrecord_hris_eds_employeeweeklyoff');
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




function get_excluded_weeklyoff_days(fromDate, toDate, FrmDt, ToDt) {

debugger;
    let date_day = 0

    let date_push = new Array();

    let frm_dt = new Date(fromDate);

    let to_dt = new Date(toDate)

    let count_date = parseFloat(ToDt) - parseFloat(FrmDt) + 1;

    date_day = frm_dt.getDay();

    date_day = parseFloat(date_day);

    for (let i = 1; i <= count_date; i++) {
        if (date_day >= '8') {

            date_day = 1


        }
        date_push.push(date_day);
        date_day = parseInt(date_day) + 1;
    }
    return date_push;
}



function searchEmpholidays(getUserId, fromDate, toDate) {
    let fromdate = fromDate;
    let todate = toDate;
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
    if (Employee_holiday_searchResult) {
    for (let i = 0; i < Employee_holiday_searchResult.length; i++) {
        let holidayList = Employee_holiday_searchResult[0].getValue('custrecord_hris_eds_employeeholidays');
        holidayList = holidayList.split(',')
    };


   
        for (let holidayCount = 0; holidayCount < holidayList.length; holidayCount++) {
            let holidayId = holidayList[holidayCount];
            if (holidayId) {
                let a_holidayData = nlapiLookupField('customrecord_hris_holiday_master', holidayId, ['custrecord_hris_holiday_date', 'isinactive', 'custrecord_hris_holidayconsiderforleave']);
                if (a_holidayData) {
                    let holidayDate = a_holidayData.custrecord_hris_holiday_date
                    let isInactive = a_holidayData.isinactive;
                    let ISHOLIDAYCONSIDERFORLEAVE = a_holidayData.custrecord_hris_holidayconsiderforleave;
                    holidayDate = nlapiStringToDate(holidayDate);
                    if ((holidayDate > fromDate) && (holidayDate < toDate) && isInactive == 'F' && ISHOLIDAYCONSIDERFORLEAVE == "T") {

                        count = count + 1;

                    }
                }
            }


        }

    }

    return count;
}


function getDatediffIndays(startDate, endDate) {

    let one_day = 1000 * 60 * 60 * 24;
    let fromDate = startDate;
    let toDate = endDate
    nlapiLogExecution('DEBUG', 'getDatediffIndays', 'From Date = ' + fromDate + 'To Date = ' + toDate);
    let x = fromDate.split("/");
    let y = toDate.split("/");
    let date1 = new Date((x[2]), (x[1]), x[0]);
    let date2 = new Date((y[1] - 1), y[2], y[0]);
    let month1 = x[2] - 1;
    let month2 = y[2] - 1;
    let Diff = Math.ceil((date2.getTime() - date1.getTime()) / (one_day));
    nlapiLogExecution('DEBUG', 'getDatediffIndays', 'Date difference Return Value = ' + Diff);
    return Diff;

}


function SearchHolidayDate(s_holiday) {
    let holiday_master_filter = new Array();
    let holiday_master_column = new Array();
    s_holiday = parseFloat(s_holiday);

    holiday_master_filter.push(new nlobjSearchFilter('internalid', null, 'anyof', s_holiday))
    holiday_master_filter.push(new nlobjSearchFilter('custrecord_hris_holidayconsiderforleave', null, 'is', "T"))
    holiday_master_column.push(new nlobjSearchColumn('custrecord_hris_holiday_date'));
    holiday_master_column.push(new nlobjSearchColumn('name'));

    let holiday_date_result = nlapiSearchRecord('customrecord_hris_holiday_master', null, holiday_master_filter, holiday_master_column);
    if (holiday_date_result != null) {
        for (let HoL = 0; HoL < holiday_date_result.length; HoL++) {
            let s_holiday_name = holiday_date_result[HoL].getValue('name')
            let s_holiday_date = holiday_date_result[HoL].getValue('custrecord_hris_holiday_date')

            s_holiday_date = nlapiStringToDate(s_holiday_date);

            let month = s_holiday_date.getMonth() + 1;

            let actual_date = s_holiday_date.getDate();

        }
    }
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

        if (date_day > '7') {

            let date_day = 1;
        }


        date_push.push(date_day);



        date_day = parseFloat(date_day) + 1
    }


    return date_push;
}

function get_dates_between_dates(fromDate, toDate, FrmDt, ToDt) {
    let date_push_date = new Array();
    let frm_dt = new Date(fromDate);

    let count_date = parseFloat(ToDt) - parseFloat(FrmDt) + 1;
    for (let i = 0; i < count_date; i++) {
        let date_date = frm_dt.getDate() + i;
        date_day = parseFloat(date_date);
        date_push_date.push(date_day);
    }

    return date_push_date;

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





function get_between_dates_in_different_months(FrmMonth, FrmDt, TOMonth, ToDt, fromDate) {
    let date_push_date = new Array();
    let frm_month_total_days = getArryMonthDays(FrmMonth);
    let frm_month_days = parseFloat(frm_month_total_days) - parseFloat(FrmDt) + 1;
    let frm_dt = new Date(fromDate);
    let to_month_days = ToDt;
    let total_days = parseFloat(frm_month_days) + parseFloat(to_month_days);
    for (let i = 0; i < total_days; i++) {
        let date_date = frm_dt.getDate() + i;
        date_date = parseFloat(date_date);
        if (date_date > frm_month_total_days) {
            date_date = (parseFloat(date_date) - parseFloat(date_date) + i) - 2;
        }
        date_push_date.push(date_date);
    }
    return date_push_date;

}




function halfday_Include(leave_type) {
    let halfdayCheck = false;
    let filters = new Array();


    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
        let column = new Array();
        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_allowhalfday'));
        let leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
        if (leaveTypeConfigWO != null) {
            halfdayCheck = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_allowhalfday')
        }

    }

    return halfdayCheck;
}


function encashment_min_days(leave_type) {
    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
        let filters = new Array();
        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
        let column = new Array();
        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_minencashallow '));//leave type config id 
        let leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
        if (leaveTypeConfigWO != null) {
            let min_encashment_days = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_minencashallow ')
        }


    }

    return min_encashment_days;
}




function encashment_max_days(leave_type) {
    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
        let filters = new Array();
        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
        let column = new Array();
        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_maxencashallow'));
        let leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
        if (leaveTypeConfigWO != null) {
            let max_encashment_days = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_maxencashallow')
        }

    }

    return max_encashment_days;
}



function min_days_apply(leave_type) {
    let filters = new Array();
    let column = new Array();

    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {
        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
        column.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_mindaystoapply'));
        let leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
        if (leaveTypeConfigWO != null) {
            let min_days = leaveTypeConfigWO[0].getValue('custrecord_hris_lvecnfg_mindaystoapply')
            nlapiLogExecution('DEBUG', 'min_days', min_days);
        }

    }

    return min_days;
}


function max_days_apply(leave_type) {
    let filters = new Array();
    let column = new Array();
    filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
    column.push(new nlobjSearchColumn('custrecord_hris_lvecfg_maxdaystoapply'));
    let leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);
    if (leaveTypeConfigWO != null) {
        let max_days = leaveTypeConfigWO[0].getValue('custrecord_hris_lvecfg_maxdaystoapply')
    }
    return max_days;
}



function encashment_days_apply_check(leave_type) {
    let encashment_days_check = false;
    let falsevalue = false;
    let filters = new Array();
    let column = new Array();

    if (leave_type != '' && leave_type != 'undefined' && leave_type != null) {

        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
       // filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type))
        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_encashallowed'));
        column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_encashavailed'));
        let leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);

        if (leaveTypeConfigWO != null) {
            encashment_days_check = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_encashallowed')

            if (encashment_days_check == 'T') {
                let encashment_days_avail = leaveTypeConfigWO[0].getText('custrecord_hris_lveconfig_encashavailed')

                if (encashment_days_avail == 'Yearly') {

                    return encashment_days_check;

                } else {

                    return falsevalue;

                }
            } else {
                return falsevalue;

            }
        }


    }
   filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type));
    //filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type));
    column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_encashallowed'));
    column.push(new nlobjSearchColumn('custrecord_hris_lveconfig_encashavailed'));
    let leaveTypeConfigWO = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, column);

    if (leaveTypeConfigWO != null) {
        encashment_days_check = leaveTypeConfigWO[0].getValue('custrecord_hris_lveconfig_encashallowed')

        if (encashment_days_check == 'T') {
            let encashment_days_avail = leaveTypeConfigWO[0].getText('custrecord_hris_lveconfig_encashavailed')

            if (encashment_days_avail == 'Yearly') {

                return encashment_days_check;

            } else {

                return falsevalue;

            }
        } else {
            return falsevalue;

        }
    }

}


function check_from_to_date_holiday(frm_date, getUserId) {

    let date = frm_date;
    let result = 'F';
    let Holiday_name = new Array();
    let filters = new Array();
    let column = new Array();
    filters.push(new nlobjSearchFilter('custrecord_hris_holidayconsiderforleave', null, 'is', "T"))
    filters.push(new nlobjSearchFilter('custrecord_hris_holiday_date', null, 'on', date))
    column.push(new nlobjSearchColumn('internalid'));

    let check_holiday_present_result = nlapiSearchRecord('customrecord_hris_holiday_master', null, filters, column);

    if (check_holiday_present_result != null) {
        for (let i = '0'; i < check_holiday_present_result.length; i++) {
            Holiday_name = check_holiday_present_result[i].getValue('internalid');

            let result = holiday_check_with_employee(getUserId, Holiday_name);
            if (result == false) {
                break;
            }
        }

    }
    return result;
}



function holiday_check_with_employee(getUserId, Holiday_name) {
    let Employee_holiday_result = nlapiSearchRecord("customrecord_hris_employeedatasourcing", null,
        [
            ["custrecord_hris_eds_employee", "anyof", getUserId],
            "AND",
            ["custrecord_hris_eds_employeeholidays", "anyof", Holiday_name]
        ],
        [
            new nlobjSearchColumn("custrecord_hris_eds_employeeholidays")
        ]
    );

    if (Employee_holiday_result) {
        return false;

    } else {
        return true;
    }


}


function check_weeklyoff_on_frm_to_date(frm_date, getUserId) {

    let weeklyoff = new Array();
    let date = frm_date;
    date = nlapiStringToDate(date);

    let date_split = date.toString().split(' ');
    let day = date_split[0];


    let filters = new Array();
    let columns = new Array();

    filters.push(new nlobjSearchFilter('name', null, 'startswith', day))
    columns.push(new nlobjSearchColumn('internalid'));
    let week_result = nlapiSearchRecord('customlist_hris_week_days', null, filters, columns);
    if (week_result != null) {
        internal_id = week_result[0].getValue('internalid');
        let weeklyoff_function = check_function(getUserId, internal_id)
        return weeklyoff_function;
    }

    function check_function(getUserId, internal_id) {
        let Employee_weeklyoff_result = nlapiSearchRecord("customrecord_hris_employeedatasourcing", null,
            [
                ["custrecord_hris_eds_employee", "anyof", getUserId],
                "AND",
                ["custrecord_hris_eds_employeeweeklyoff", "anyof", internal_id]
            ],
            [
                new nlobjSearchColumn("custrecord_hris_eds_employee"),
                new nlobjSearchColumn("custrecord_hris_eds_hiredate")
            ]
        );


        if (Employee_weeklyoff_result != null) {

            return true;

        }

        return false;



    }




}


function GetCurrentDate() {
    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth() + 1;
    let yy = today.getFullYear();
    return mm + "/" + dd + "/" + yy;

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
        return {
            pageInit: typeof pageInit !== 'undefined' ? pageInit : (typeof pageInit_leaveApplication !== 'undefined' ? pageInit_leaveApplication : (typeof pageInit_getType !== 'undefined' ? pageInit_getType : null)),
            fieldChanged: typeof fieldChanged !== 'undefined' ? fieldChanged : (typeof fieldchange_Leave_apply !== 'undefined' ? fieldchange_Leave_apply : (typeof fieldChange_callPOPWindow !== 'undefined' ? fieldChange_callPOPWindow : null)),
            saveRecord: typeof saveRecord !== 'undefined' ? saveRecord : (typeof onSave_Leave_Application !== 'undefined' ? onSave_Leave_Application : null),
            Cancelclick: typeof Cancelclick !== 'undefined' ? Cancelclick : null,
            Settlementclick: typeof Settlementclick !== 'undefined' ? Settlementclick : null,
            HRSettlementclick: typeof HRSettlementclick !== 'undefined' ? HRSettlementclick : null
        };
    })();
    const CS_hris_pullback_cs = (() => {
define(['N/search', 'N/query', 'N/format', 'N/record', 'N/currentRecord', 'N/url', './moment.js', 'N/runtime'],
    function (search, query, format, record, currentRecord, url, moment, runtime) {
    
    function pageInit_open_window() {
        debugger;
        let rec = currentRecord.get();
        let openwindow = rec.getValue({ fieldId: 'custpage_triggerredirect' });
        
        log.debug({ title: 'openwindow', details: openwindow });
        
        if (openwindow === 'open') {
            window.open('https://2772245.app.netsuite.com/app/common/custom/custrecordentrylist.nl?rectype=894', '_self');
        }
    }
    
    function PullbackLeave(LeaveRecID) {
        let createURL = url.resolveScript({
            scriptId: 'customscript_hris_lve_pullbkwindow_sl',
            deploymentId: 'customdeploy_hris_lve_pullbkwindow_sl',
            params: { leavid: LeaveRecID }
        });
        
        window.open(createURL, '_self');
    }
    
    return {
        pageInit: pageInit_open_window,
        PullbackLeave: PullbackLeave
    };
});
        return {
            pageInit: typeof pageInit !== 'undefined' ? pageInit : (typeof pageInit_leaveApplication !== 'undefined' ? pageInit_leaveApplication : (typeof pageInit_getType !== 'undefined' ? pageInit_getType : null)),
            fieldChanged: typeof fieldChanged !== 'undefined' ? fieldChanged : (typeof fieldchange_Leave_apply !== 'undefined' ? fieldchange_Leave_apply : (typeof fieldChange_callPOPWindow !== 'undefined' ? fieldChange_callPOPWindow : null)),
            saveRecord: typeof saveRecord !== 'undefined' ? saveRecord : (typeof onSave_Leave_Application !== 'undefined' ? onSave_Leave_Application : null),
            Cancelclick: typeof Cancelclick !== 'undefined' ? Cancelclick : null,
            Settlementclick: typeof Settlementclick !== 'undefined' ? Settlementclick : null,
            HRSettlementclick: typeof HRSettlementclick !== 'undefined' ? HRSettlementclick : null
        };
    })();


        const pageInit = (scriptContext) => {
            try { if (CS_hris_annual_leave_cs.pageInit) CS_hris_annual_leave_cs.pageInit(scriptContext); } catch(e) { console.log('Error in CS_hris_annual_leave_cs.pageInit', e); }
            try { if (CS_hris_leave_cancel_cs.pageInit) CS_hris_leave_cancel_cs.pageInit(scriptContext); } catch(e) { console.log('Error in CS_hris_leave_cancel_cs.pageInit', e); }
            try { if (CS_hris_leave_fileuploadwindow_cs.pageInit) CS_hris_leave_fileuploadwindow_cs.pageInit(scriptContext); } catch(e) { console.log('Error in CS_hris_leave_fileuploadwindow_cs.pageInit', e); }
            try { if (CS_hris_leaveapplicationupdated_cs.pageInit) CS_hris_leaveapplicationupdated_cs.pageInit(scriptContext); } catch(e) { console.log('Error in CS_hris_leaveapplicationupdated_cs.pageInit', e); }
            try { if (CS_hris_pullback_cs.pageInit) CS_hris_pullback_cs.pageInit(scriptContext); } catch(e) { console.log('Error in CS_hris_pullback_cs.pageInit', e); }

        };

        const fieldChanged = (scriptContext) => {
            try { if (CS_hris_annual_leave_cs.fieldChanged) CS_hris_annual_leave_cs.fieldChanged(scriptContext); } catch(e) { console.log('Error in CS_hris_annual_leave_cs.fieldChanged', e); }
            try { if (CS_hris_leave_cancel_cs.fieldChanged) CS_hris_leave_cancel_cs.fieldChanged(scriptContext); } catch(e) { console.log('Error in CS_hris_leave_cancel_cs.fieldChanged', e); }
            try { if (CS_hris_leave_fileuploadwindow_cs.fieldChanged) CS_hris_leave_fileuploadwindow_cs.fieldChanged(scriptContext); } catch(e) { console.log('Error in CS_hris_leave_fileuploadwindow_cs.fieldChanged', e); }
            try { if (CS_hris_leaveapplicationupdated_cs.fieldChanged) CS_hris_leaveapplicationupdated_cs.fieldChanged(scriptContext); } catch(e) { console.log('Error in CS_hris_leaveapplicationupdated_cs.fieldChanged', e); }
            try { if (CS_hris_pullback_cs.fieldChanged) CS_hris_pullback_cs.fieldChanged(scriptContext); } catch(e) { console.log('Error in CS_hris_pullback_cs.fieldChanged', e); }

        };

        const saveRecord = (scriptContext) => {
            let allowSave = true;
            try { if (CS_hris_annual_leave_cs.saveRecord && CS_hris_annual_leave_cs.saveRecord(scriptContext) === false) allowSave = false; } catch(e) { console.log('Error in CS_hris_annual_leave_cs.saveRecord', e); allowSave = false; }
            try { if (CS_hris_leave_cancel_cs.saveRecord && CS_hris_leave_cancel_cs.saveRecord(scriptContext) === false) allowSave = false; } catch(e) { console.log('Error in CS_hris_leave_cancel_cs.saveRecord', e); allowSave = false; }
            try { if (CS_hris_leave_fileuploadwindow_cs.saveRecord && CS_hris_leave_fileuploadwindow_cs.saveRecord(scriptContext) === false) allowSave = false; } catch(e) { console.log('Error in CS_hris_leave_fileuploadwindow_cs.saveRecord', e); allowSave = false; }
            try { if (CS_hris_leaveapplicationupdated_cs.saveRecord && CS_hris_leaveapplicationupdated_cs.saveRecord(scriptContext) === false) allowSave = false; } catch(e) { console.log('Error in CS_hris_leaveapplicationupdated_cs.saveRecord', e); allowSave = false; }
            try { if (CS_hris_pullback_cs.saveRecord && CS_hris_pullback_cs.saveRecord(scriptContext) === false) allowSave = false; } catch(e) { console.log('Error in CS_hris_pullback_cs.saveRecord', e); allowSave = false; }

            return allowSave;
        };

        const Cancelclick = () => CS_hris_leave_cancel_cs.Cancelclick ? CS_hris_leave_cancel_cs.Cancelclick() : null;
        const Settlementclick = () => CS_hris_leave_cancel_cs.Settlementclick ? CS_hris_leave_cancel_cs.Settlementclick() : null;
        const HRSettlementclick = () => CS_hris_leave_cancel_cs.HRSettlementclick ? CS_hris_leave_cancel_cs.HRSettlementclick() : null;

        return {
            pageInit,
            fieldChanged,
            saveRecord,
            Cancelclick,
            Settlementclick,
            HRSettlementclick
        };
    });
