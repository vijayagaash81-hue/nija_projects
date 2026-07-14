/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */

 var SEARCH, MOMENT, RECORD, QUERY;
 define(['N/currentRecord', 'N/record', 'N/search', './moment.js', 'N/format', 'N/query'],
     function (currentRecord, record, search, moment, format, query) {
         SEARCH = search;
         MOMENT = moment;
         RECORD = record;
         QUERY = query;
 
         function pageInit(context) {
             debugger;
             try {
 
                 var leaverecord = context.currentRecord;
 
                 var flag = getUrlParameter('flag');
                 log.debug('Flag Check', flag);
                 if (flag == 1) {
 
                     var empid = getUrlParameter('empid');
                     var leaverecordid = getUrlParameter('leaverecordid')
                     leaverecord.setValue({
                         fieldId: 'custrecord_hrms_lveset_empname',
                         value: empid,
                         ignoreFieldChange: false,
                         forceSyncSourcing: true
                     });
 
                     leaverecord.setValue({
                         fieldId: 'custpage_leave_app_no',
                         value: leaverecordid,
                         ignoreFieldChange: false,
                         forceSyncSourcing: true
                     });
 
                     /*   leaverecord.setValue({
                           fieldId: 'custrecord_hrms_lveset_leaverefno',
                           value: leaverecordid,
                           ignoreFieldChange: true,
                           forceSyncSourcing: true
                       }); */
 
                     /*   var fromdate =  leaverecord.getValue('custrecord_hrms_lveset_fromdate')
                       var previousDate = moment(fromdate, "dd/mm/yyyy").subtract(1, 'days').format("dd/mm/yyyy");
                           if (previousDate) {
                               previousDate = format.format({
                                   value: previousDate,
                                   type: format.Type.DATE,
                                   timezone: format.Timezone.ASIA_MUSCAT
                               });
                               leaverecord.setValue({
                                  fieldId: 'custrecord_hrms_lveset_lastworkingdate',
                                  value: previousDate,
                                  ignoreFieldChange:true
                              });
                             
                           } */
                 }
 
 
             } catch (e) {
                 log.error('Error in pageInit', e);
             }
         }
 
         function fieldChanged(context) {
             try {
                 debugger;
                 var recordObj = context.currentRecord;
 
 
 
 
 
 
                 if (context.fieldId == "custrecord_hrms_lveset_empname") {
 
 
 
                     var empID = recordObj.getValue('custrecord_hrms_lveset_empname');
                     var paygroup = getpaygroup(empID);
 
 
 
                     if (paygroup != null && paygroup != "undefined" && paygroup != "") {
                         recordObj.setValue({
                             fieldId: 'custrecord_hrms_lveset_paygroup',
                             value: paygroup,
                             ignoreFieldChange: true
                         });
                         var componenttype = get_paycomponent(paygroup);
                         // Getting Wage Period
                         var get_wage_date = search_wageperiod(paygroup);
                         var w_Date = get_wage_date.toString().split("#");
                         var end_date = w_Date[0];
                         var start_date = w_Date[1];
                         var wage_month = w_Date[2];
                         var wage_year = w_Date[3];
                         if (componenttype != null && componenttype != "undefined" && componenttype != "") {
                             recordObj.setValue({
                                 fieldId: 'custrecord_hrms_lveset_paycomponent',
                                 value: componenttype,
                                 ignoreFieldChange: true
                             });
                         }
                         if (get_wage_date != null && get_wage_date != "undefined" && get_wage_date != "") {
                            end_date = format.parse({
                                value: end_date,
                                type: format.Type.DATE
                            });
                            recordObj.setValue({
                                fieldId: 'custrecord_hrms_lveset_paydt',
                                value: end_date,
                                ignoreFieldChange: true
                            });
                            recordObj.setValue({
                                fieldId: 'custrecord_hrms_lveset_month',
                                value: wage_month,
                                ignoreFieldChange: true
                            });
                            recordObj.setValue({
                                fieldId: 'custrecord_hrms_lveset_year',
                                value: wage_year,
                                ignoreFieldChange: true
                            });
                        
                        /*     var leaveapplsql = "select * from customrecord_hris_leaveapplication where custrecord_hris_lve_employeename = '" + empID + "' and custrecord_hris_lve_leavetype=2 and custrecord_hris_lve_hrmsapprovalstatus =2 and custrecord_hris_lve_cancellation='F' and custrecord_hris_lve_leavesettlement = 'T' and custrecord_hris_lve_settlerefno  is null"
 */
                             var leaveapplsql = "select a.id as id,a.name as name from customrecord_hris_leaveapplication a join customrecord_hris_leaveconfig b on a.custrecord_hris_lve_leavetype=b.id where a.custrecord_hris_lve_employeename = '" + empID + "' and b.custrecord_hris_lvecnfg_seqno=3 and a.custrecord_hris_lve_hrmsapprovalstatus =2 and a.custrecord_hris_lve_cancellation='F' and a.custrecord_hris_lve_leavesettlement = 'T' and a.custrecord_hris_lve_settlerefno  is null"
                              
                            // Fist remove select Option from the field
                            var leaveapplsqlrecords = getResult(leaveapplsql);
                            log.debug('leaveappsql', leaveapplsql);
                            // log.debug('records in getEmpTotalLeaveTaken', JSON.stringify(records));
                            var empLeaveAppField = recordObj.getField({
                                fieldId: 'custpage_leave_app_no'
                            });
                            // log.debug('empLeaveAppField', empLeaveAppField);
                            empLeaveAppField.removeSelectOption({
                                value: null
                            });
                            if (leaveapplsqlrecords.length > 0) {
                                for (var i = 0; i < leaveapplsqlrecords.length; i++) {
                                    var leaveAppNoValue = leaveapplsqlrecords[i].id;
                                    var leaveAppNoText = leaveapplsqlrecords[i].name;
                                    empLeaveAppField.insertSelectOption({
                                        value: leaveAppNoValue,
                                        text: leaveAppNoText
                                    });
                                }
                                if (leaveapplsqlrecords.length == 1) {
                                    recordObj.setValue({
                                        fieldId: 'custrecord_hrms_lveset_leaverefno',
                                        value: leaveAppNoValue,
                                        ignoreFieldChange: false
                                    });
                                }
                            }
                            else if (leaveapplsqlrecords.length == 0) {
                                recordObj.setValue({
                                    fieldId: 'custrecord_hrms_lveset_leaverefno',
                                    value: '',
                                    ignoreFieldChange: false
                                });
                            }


                        }
                    }
 
                 }
                
                 if (context.fieldId == 'custrecord_hrms_lveset_paidthropayroll') {
                     var paidpayroll = recordObj.getValue('custrecord_hrms_lveset_paidthropayroll');
                     log.debug('paidpayroll', paidpayroll);
                     if (paidpayroll == true) {
                         recordObj.setValue({
                             fieldId: 'custrecord_hrms_lveset_salaryadvancedays',
                             value: 0,
                             ignoreFieldChange: true
                         });
                         recordObj.setValue({
                             fieldId: 'custrecord_hrms_lveset_salaryadvance',
                             value: 0,
                             ignoreFieldChange: true
                         });
                     }
 
                 }
                
                 if (context.fieldId == "custpage_leave_app_no") {
                     // Get Leave Application number
                     var LeaveAppNo = recordObj.getValue('custpage_leave_app_no');
                     log.debug('LeaveAppNo', LeaveAppNo);
                     // Set Value
                     recordObj.setValue({
                         fieldId: 'custrecord_hrms_lveset_leaverefno',
                         value: LeaveAppNo,
                         ignoreFieldChange: false
                     });
 
                 }
                
             
                  if (context.sublistId == 'recmachcustrecord_hrms_addded_settlelink' && context.fieldId == 'custrecord_hrms_addded_amount') {
                      recalculateAdditionsDeductions(recordObj);
                  }
              } catch (e) {
                 log.error("Error in fieldChanged", e);
             }
         }
         function lineInit(context) {
             try {
                 debugger;
 
                 var recordObj = context.currentRecord;
 
                 if (context.sublistId == 'recmachcustrecord_hrms_addded_settlelink' && context.fieldId == 'custrecord_hrms_addded_processgrp') {
                     var paygroup = recordObj.getValue('custrecord_hrms_lveset_paygroup');
                     recordObj.setCurrentSublistValue({
                         sublistId: 'recmachcustrecord_hrms_addded_settlelink',
                         fieldId: 'custrecord_hrms_addded_processgrp',
                         value: paygroup,
                         ignoreFieldChange: false,
                     });
                 }
 
             }
             catch (e) {
                 log.debug("error in lineinit : " + e);
 
             }
         }

         function sublistChanged(context) {
             try {
                 var recordObj = context.currentRecord;
                 if (context.sublistId == 'recmachcustrecord_hrms_addded_settlelink') {
                     recalculateAdditionsDeductions(recordObj);
                 }
             } catch (e) {
                 log.error("Error in sublistChanged", e);
             }
         }

         function validateLine(context) {
             try {
                 var recordObj = context.currentRecord;
                 if (context.sublistId == 'recmachcustrecord_hrms_addded_settlelink') {
                     recalculateAdditionsDeductions(recordObj);
                 }
             } catch (e) {
                 log.error("Error in validateLine", e);
             }
             return true;
         }
 
 
         function saveRecord(context) {
             try {
                 debugger;
 
                 var recordObj = context.currentRecord;
 
                 
                 var totalloanamount = 0;
            
                 var leavesalaryamt = recordObj.getValue('custrecord_hrms_lveset_lvesalaryamount') || 0;
                 var salaryadvanceamt = recordObj.getValue('custrecord_hrms_lveset_salaryadvance') || 0;
                 var hraamount = recordObj.getValue('custrecord_hrms_lveset_hraamount') || 0;
                 var airticketamount = recordObj.getValue('custrecord_hrms_lveset_airticketamount') || 0;
                 var loanamount = recordObj.getValue('custrecord_hrms_lveset_loan_amount') || 0;
                 var otheradditionamt = recordObj.getValue('custrecord_hrms_lveset_additionamount') || 0;
                 var otherdeductionamt = recordObj.getValue('custrecord_hrms_lveset_deductionamount') || 0;
                 settleamount = (parseFloat(leavesalaryamt) + parseFloat(salaryadvanceamt) + parseFloat(hraamount) + parseFloat(airticketamount) + parseFloat(otheradditionamt)) - (parseFloat(loanamount) + parseFloat(otherdeductionamt));
                 settleamount = settleamount.toFixed(2);
                 recordObj.setValue({
                     fieldId: 'custrecord_hrms_lveset_settleamount',
                     value: settleamount,
                     ignoreFieldChange: true
 
                 });
                 return true;
             }
             catch (e) {
                 log.debug("error in saveRecord : " + e);
 
             }
         }
         function getUrlParameter(param) {
             //   debugger;
             var query = window.location.search.substring(1);
             var vars = query.split("&");
             for (var i = 0; i < vars.length; i++) {
                 var pair = vars[i].split("=");
                 if (pair[0] == param) {
                     return decodeURIComponent(pair[1]);
                 }
             }
             return (false);
         }
 
 
 
 
 
 
 
 
         function leavesalary() {
 
             debugger;
             try {
                 var recordObj = currentRecord.get();
                 var AdvanceSalDays = 0;
                 var NetPay = 0;
                 var Basic = 0;
                 var EmpLeaveSalBase = 0;
                 var NoOfYears = 0;
                 var airticketyears = 0;
                 var DayBasic = 0;
                 var DayLeaveSal = 0;
                 var SalAdvanceAmt = 0;
                 var LeaveSalAmt = 0;
                 var airticketamount = 0;
                 var airamount = 0;
                 var salaryadvanceamt = 0;
                 var HRAAmt = 0;
                 var settleamount = 0;
                 var actualsettleamount = 0;
                var accuraldays =0;
                 var emp = recordObj.getValue('custrecord_hrms_lveset_empname');
                 var fromdatenew = recordObj.getValue('custrecord_hrms_lveset_fromdate');
                 var todate = recordObj.getValue('custrecord_hrms_lveset_todate');
                 var rejoindate = recordObj.getValue('custrecord_hrms_lveset_rejoindate') || '';
                 var hiredate = recordObj.getValue('custrecord_hrms_lveset_dateofjoin');
                 var employeecatagoryid = recordObj.getValue('custrecord_hrms_lveset_empcatagory');
                 var paygroup = recordObj.getValue('custrecord_hrms_lveset_paygroup');
                 var NoOfDays = recordObj.getValue('custrecord_hrms_lveset_totleavedays');
                 var previousDate = recordObj.getValue('custrecord_hrms_lveset_lastworkingdate');
                 var settlementid = recordObj.getValue('id') || '';
                 var NoOfWorkingdays = 0;
                 var NoOfWorkingyears = 0;
                 var yearleavecal = 0;
                 var monthleavecal = 0;
                 var yearairticketcal = 0;
                 var monthairticketcal = 0;

                 var employeecatagory = getemployeecatagorysequence(employeecatagoryid);
 
                 var fromdate = previousDate;
 
 
                 // Payroll Enddate
                 var get_wage_date = search_wageperiod(paygroup);
                 var w_Date = get_wage_date.toString().split("#");
                 var end_date = w_Date[0];
                 var start_date = w_Date[1];
                 var wage_month = w_Date[2];
                 var wage_year = w_Date[3];
                 var CalDays = w_Date[4];
                 // CalDays=30;
                 start_date = format.parse({
                     value: start_date,
                     type: format.Type.DATE
                 });
                
 
                 //--Net pay
                 NetPay = getnetpay(emp);
 
                 //--DayBasic
                 Basic = daybasic(emp);
                 recordObj.setValue({
                     fieldId: 'custrecord_hrms_lveset_basicsalary',
                     value: Basic,
                     ignoreFieldChange: true
                 });
 
                 //--EmpLeaveSalBased on component total
                 EmpLeaveSalBase = getempleavesalbase(emp);
 
                 //--No of working years
                 if (rejoindate != '') {
                     NoOfYears = CountDays_BetweenTwodates(rejoindate, fromdate);
 
                 }
                 else if (rejoindate == '') {
                     NoOfYears = CountDays_BetweenTwodates(hiredate, fromdate);
 
                 }
                 NoOfWorkingyears = CountDays_BetweenTwodates(hiredate, fromdatenew);
                 NoOfWorkingdays = CountDays_BetweenTwodatesWorkingdays(hiredate, fromdatenew);
                 recordObj.setValue({
                     fieldId: 'custrecord_hrms_lveset_noofyears',
                     value: NoOfWorkingyears,
                     ignoreFieldChange: true
                 });
                 recordObj.setValue({
                     fieldId: 'custrecord_hrms_lveset_noofdays',
                     value: NoOfWorkingdays,
                     ignoreFieldChange: true
                 });
 
                 //Airticket years
                 airticketyears = CountDays_BetweenTwodates(hiredate, fromdate);
 
                 //    --Calender Days for payroll month
 
 
                 //--Day Basic 
                 DayBasic = Basic / CalDays;
                 var DayBasicnew = Basic / 30;
                 recordObj.setValue({
                     fieldId: 'custrecord_hrms_lveset_rateperday',
                     value: DayBasicnew.toFixed(2),
                     ignoreFieldChange: true
                 }); 
                
        
                 
                 LeaveSalAmt=getleavesalaryamount(emp);
                 LeaveSalAmt = LeaveSalAmt.toFixed(2);
                 recordObj.setValue({
                     fieldId: 'custrecord_hrms_lveset_lvesalaryamount',
                     value: LeaveSalAmt,
                     ignoreFieldChange: true
                 });
 
                 recordObj.setValue({
                     fieldId: 'custrecord_hrms_lveset_actlvesalaryamt',
                     value: LeaveSalAmt,
                     ignoreFieldChange: true
                 });
           
                accuraldays=getleavedays(emp);
                recordObj.setValue({
                    fieldId: 'custrecord_hrms_lveset_accuraldays',
                    value: accuraldays,
                    ignoreFieldChange: true
                });

                recordObj.setValue({
                    fieldId: 'custrecord_hrms_lveset_actual_accuralday',
                    value: accuraldays,
                    ignoreFieldChange: true
                });
          
              
                 
                 airamount = getairtickeaccuralamount(emp)
                 airamount = airamount.toFixed(2);
                 recordObj.setValue({
                     fieldId: 'custrecord_hrms_lveset_airticketamount',
                     value: airamount,
                     ignoreFieldChange: true
                 });
                 recordObj.setValue({
                     fieldId: 'custrecord_hrms_lveset_actairticketamt',
                     value: airamount,
                     ignoreFieldChange: true
                 });
 
 
                 
 
            
             
                 var leavesalaryamt = recordObj.getValue('custrecord_hrms_lveset_lvesalaryamount') || 0;
                 var salaryadvanceamt = recordObj.getValue('custrecord_hrms_lveset_salaryadvance') || 0;
                 var hraamount = recordObj.getValue('custrecord_hrms_lveset_hraamount') || 0;
                 var airticketamount = recordObj.getValue('custrecord_hrms_lveset_airticketamount') || 0;
                 var loanamount = recordObj.getValue('custrecord_hrms_lveset_loan_amount') || 0;
 
                 // Getting Actual Amount
                 var actualleavesalaryamt = recordObj.getValue('custrecord_hrms_lveset_actlvesalaryamt') || 0;
                 var actualsalaryadvanceamt = recordObj.getValue('custrecord_hrms_lveset_actsaladvanceamt') || 0;
                 var actualhraamount = recordObj.getValue('custrecord_hrms_lveset_acthraamount') || 0;
                 var actualairticketamount = recordObj.getValue('custrecord_hrms_lveset_actairticketamt') || 0;
                 var actualloanamount = recordObj.getValue('custrecord_hrms_lveset_actloanamount') || 0;
 
 
                 var otheradditionamt = recordObj.getValue('custrecord_hrms_lveset_additionamount') || 0;
                 var otherdeductionamt = recordObj.getValue('custrecord_hrms_lveset_deductionamount') || 0;
                 settleamount = (parseFloat(leavesalaryamt) + parseFloat(salaryadvanceamt) + parseFloat(hraamount) + parseFloat(airticketamount) + parseFloat(otheradditionamt)) - (parseFloat(loanamount) + parseFloat(otherdeductionamt));
                 settleamount = settleamount.toFixed(2);
                 actualsettleamount = (parseFloat(actualleavesalaryamt) + parseFloat(actualsalaryadvanceamt) + parseFloat(actualhraamount) + parseFloat(actualairticketamount) + parseFloat(otheradditionamt)) - (parseFloat(actualloanamount) + parseFloat(otherdeductionamt));
                 actualsettleamount = actualsettleamount.toFixed(2);
                 recordObj.setValue({
                     fieldId: 'custrecord_hrms_lveset_settleamount',
                     value: settleamount,
                     ignoreFieldChange: true
 
                 });
                 recordObj.setValue({
                     fieldId: 'custrecord_hrms_lveset_actsettleamount',
                     value: actualsettleamount,
                     ignoreFieldChange: true
 
                 });
                 var salaryamount = parseFloat(salaryadvanceamt) + parseFloat(otheradditionamt);
                 recordObj.setValue({
                     fieldId: 'custrecord_hrms_lveset_salaryadvanceamt',
                     value: salaryamount,
                     ignoreFieldChange: true
 
                 });
 
             }
             catch (e) {
                 log.error("Error in leavesalary", e);
                 // log.debug("Error in getEmpTotalLeaveTaken : " + e);
             }
 
         }
         function recalculate() {
 
             debugger;
             try {
                 var recordObj = currentRecord.get();
 
                 var settlementid = recordObj.getValue('id') || '';
 
                 var emp = recordObj.getValue('custrecord_hrms_lveset_empname');
                 var fromdate = recordObj.getValue('custrecord_hrms_lveset_fromdate');
                 var rejoindate = recordObj.getValue('custrecord_hrms_lveset_rejoindate') || '';
                 var hiredate = recordObj.getValue('custrecord_hrms_lveset_dateofjoin');
                 var employeecatagory = recordObj.getValue('custrecord_hrms_lveset_empcatagory');
                 var paygroup = recordObj.getValue('custrecord_hrms_lveset_paygroup');
                 var AdvanceSalDays = recordObj.getValue('custrecord_hrms_lveset_salaryadvancedays');
                 var advancesalaryamount = 0;
                 var otamount = recordObj.getValue('custrecord_hrms_lveset_otamount') || 0;
                 var settleamount = 0;
                 var actualsettleamount = 0;
                 var get_wage_date = search_wageperiod(paygroup);
                 var w_Date = get_wage_date.toString().split("#");
                 var end_date = w_Date[0];
                 var start_date = w_Date[1];
                 var wage_month = w_Date[2];
                 var wage_year = w_Date[3];
                 var CalDays = w_Date[4];
 
               
 
              
 
                 var leavesalaryamt = recordObj.getValue('custrecord_hrms_lveset_lvesalaryamount') || 0;
                 var salaryadvanceamt = recordObj.getValue('custrecord_hrms_lveset_salaryadvance') || 0;
                 var hraamount = recordObj.getValue('custrecord_hrms_lveset_hraamount') || 0;
                 var airticketamount = recordObj.getValue('custrecord_hrms_lveset_airticketamount') || 0;
                 var loanamount = recordObj.getValue('custrecord_hrms_lveset_loan_amount') || 0;
                 var otheradditionamt = recordObj.getValue('custrecord_hrms_lveset_additionamount') || 0;
                 var otherdeductionamt = recordObj.getValue('custrecord_hrms_lveset_deductionamount') || 0;
                 //actual
                 var actualleavesalaryamt = recordObj.getValue('custrecord_hrms_lveset_actlvesalaryamt') || 0;
                 var actualsalaryadvanceamt = recordObj.getValue('custrecord_hrms_lveset_actsaladvanceamt') || 0;
                 var actualhraamount = recordObj.getValue('custrecord_hrms_lveset_acthraamount') || 0;
                 var actualairticketamount = recordObj.getValue('custrecord_hrms_lveset_actairticketamt') || 0;
                 var actualloanamount = recordObj.getValue('custrecord_hrms_lveset_actloanamount') || 0;
 
                 settleamount = (parseFloat(leavesalaryamt) + parseFloat(salaryadvanceamt) + parseFloat(hraamount) + parseFloat(airticketamount) + parseFloat(otheradditionamt)) - (parseFloat(loanamount) + parseFloat(otherdeductionamt));
                 settleamount = settleamount.toFixed(2);
                 recordObj.setValue({
                     fieldId: 'custrecord_hrms_lveset_settleamount',
                     value: settleamount,
                     ignoreFieldChange: true
 
                 });
 
             
 
                 actualsettleamount = (parseFloat(actualleavesalaryamt) + parseFloat(actualsalaryadvanceamt) + parseFloat(actualhraamount) + parseFloat(actualairticketamount) + parseFloat(otheradditionamt)) - (parseFloat(actualloanamount) + parseFloat(otherdeductionamt));
                 actualsettleamount = actualsettleamount.toFixed(2);
 
                 recordObj.setValue({
                     fieldId: 'custrecord_hrms_actlveset_settleamount',
                     value: actualsettleamount,
                     ignoreFieldChange: true
 
                 });
             }
             catch (e) {
                 log.error("Error in recalculate", e);
                 // log.debug("Error in getEmpTotalLeaveTaken : " + e);
             }
 
         }
         function jvcreation() {
             debugger;
 
             try {
 
 
                 var jvarray = [];
                 var currentrecord = currentRecord.get()
                 var leaveSettlemenID = currentrecord.id;
                 var newRecordObj = record.load({
                     type: 'customrecord_hrms_leavesettlement',
                     id: leaveSettlemenID,
                     isDynamic: true,
                 });
 
                 var approvalStatus = newRecordObj.getValue('custrecord_hrms_lveset_approvalstatus');
 
                 log.debug("approvalStatus", approvalStatus);
                 var leaveAppNo = newRecordObj.getValue('custrecord_hrms_lveset_leaverefno') || '';
                 log.debug("leaveAppNo", leaveAppNo);
                 var jeno = newRecordObj.getValue('custrecord_hrms_lveset_jevoucherno') || '';
                 log.debug('jeno', jeno);
 
                 var empid = newRecordObj.getValue('custrecord_hrms_lveset_empname');
                 var empname = newRecordObj.getValue('custrecord_hrms_lveset_emplegalname');
                 var paygroup = newRecordObj.getValue('custrecord_hrms_lveset_paygroup');
                 var paymonth = newRecordObj.getValue('custrecord_hrms_lveset_month');
                 var paymonthname = newRecordObj.getText('custrecord_hrms_lveset_month');
                 var yearname = newRecordObj.getText('custrecord_hrms_lveset_year');
                 var year = newRecordObj.getValue('custrecord_hrms_lveset_year');
                 var paycomponent = newRecordObj.getValue('custrecord_hrms_lveset_paycomponent');
                 var subsidiaries = newRecordObj.getValue('custrecord_hrms_lveset_subsidiary');
                 var leavesalaryamt = newRecordObj.getValue('custrecord_hrms_lveset_lvesalaryamount') || 0;
 
                 //  var salaryadvanceamt = newRecordObj.getValue('custrecord_hrms_lveset_salaryadvance') || 0
                 var salaryadvanceamt = newRecordObj.getValue('custrecord_hrms_lveset_salaryadvanceamt') || 0
                 var hraamount = newRecordObj.getValue('custrecord_hrms_lveset_hraamount') || 0;
                 var airticketamount = newRecordObj.getValue('custrecord_hrms_lveset_airticketamount') || 0;
                 var loanamount = newRecordObj.getValue('custrecord_hrms_lveset_loan_amount') || 0;
                 var otheradditionamt = newRecordObj.getValue('custrecord_hrms_lveset_additionamount') || 0;
                 var otherdeductionamt = newRecordObj.getValue('custrecord_hrms_lveset_deductionamount') || 0;
                 var paydate = newRecordObj.getValue('custrecord_hrms_lveset_paydt');
                 var docdate = newRecordObj.getValue('custrecord_hrms_lveset_docdate');
                 jvarray.push({
                     'leavesettleid': leaveSettlemenID,
                     'empid': empid,
                     'empname': empname,
                     'paygroup': paygroup,
                     'paymonth': paymonth,
                     'year': year,
                     'paycomponent': paycomponent,
                     'subsidiary': subsidiaries,
                     'paymonthname': paymonthname,
                     'yearname': yearname,
                     'paydate': paydate,
                     'leavesalaryamt': leavesalaryamt,
                     'salaryadvanceamt': salaryadvanceamt,
                     'hraamount': hraamount,
                     'airticketamount': airticketamount,
                     'loanamount': loanamount,
                     'otheradditionamt': otheradditionamt,
                     'otherdeductionamt': otherdeductionamt,
                     'docdate': docdate
 
                 });
                 log.debug('JV Array', jvarray);
 
                 var paycomponent = jvarray[0].paycomponent;
                 log.debug('Paycomponent', paycomponent);
                 var subsidiariesRes = jvarray[0].subsidiary;
 
                 // According to vanitha mam 
                 // var today = jvarray[0].paydate;
                 var today = jvarray[0].docdate;
 
                 var year = jvarray[0].yearname;
                 var paygroupParameter = jvarray[0].paygroup;
 
                 //  var monthParameter = jvarray[0].paymonth;
                 var monthParameter = getMonthFromDate(today);
                 var month = getMonth(monthParameter);
                 var yearParameter = getYearFromDate(today);
                 // var yearParameter = jvarray[0].year;
                 var emp = jvarray[0].empid;
                 var empTxt = jvarray[0].empname;
 
                 var leavesalaryamt = jvarray[0].leavesalaryamt;
                 var salaryadvanceamt = jvarray[0].salaryadvanceamt;
                 var hraamount = jvarray[0].hraamount;
                 var airticketamount = jvarray[0].airticketamount;
                 var loanamount = jvarray[0].loanamount;
                 var otheradditionamt = jvarray[0].otheradditionamt;
                 var otherdeductionamt = jvarray[0].otherdeductionamt;
                 var settleamount = 0;
 
                 //   settleamount=(parseFloat(leavesalaryamt)+parseFloat(salaryadvanceamt)+parseFloat(hraamount)+parseFloat(airticketamount)+parseFloat(otheradditionamt))-(parseFloat(loanamount)+parseFloat(otherdeductionamt))
                 settleamount = (parseFloat(leavesalaryamt) + parseFloat(salaryadvanceamt) + parseFloat(airticketamount)) - (parseFloat(loanamount));
                 /*   var componentsql = " select * from  customrecord_hris_payroll_component where id  =" + paycomponent;
   
                   log.debug('componentsql  ', componentsql);
   
   
                   var queryResults = query.runSuiteQL({
                       query: componentsql
                   });
   
                   var componentsqlrecords = queryResults.asMappedResults();
                   if (componentsqlrecords.length > 0) {
                       var sett_comp_accountCodeID = componentsqlrecords[0].custrecord_hris_account_name || '';
                       log.debug('Account id', sett_comp_accountCodeID);
                   }
    */
 
 
                 var jvObject = record.create({
                     type: 'journalentry',
                     isDynamic: true
                 });
                 var debit = 0;
                 jvObject.setValue('customform', 117);
 
                 jvObject.setValue('approvalstatus', 2);
                 jvObject.setValue('subsidiary', subsidiariesRes);
                 jvObject.setValue('trandate', today);
                 jvObject.setText('postingperiod', month + " " + year);
                 //by florence
                 //jvObject.setValue('custbody_auto_num_business_area', 12);
                 jvObject.setValue('memo', 'Leave Settlement for ' + month + ' ' + year);
                 //jvObject.setValue('custbody_dept_jv', departmentParam);
                 jvObject.setValue('custbody_hris_paygroup_jv', paygroupParameter);
                 jvObject.setValue('custbody_hris_jv_month', monthParameter);
                 // jvObject.setValue('custbody_hris_jv_year', yearParameter);
                 yearParameter = getyearid(yearParameter)
                 jvObject.setValue('custbody_hris_jv_year', yearParameter);
                 jvObject.setValue('custbody_hris_jv_employeename', emp);
                 jvObject.setValue('custbody_hris_jv_emplegalname', empTxt);
 
 
                 /* if (salaryadvanceamt > 0) {
                     Deduct = parseFloat(salaryadvanceamt)
                     // var get_paycomponent = getleavesalarycomponent(paygroup);
                     var get_paycomponent = getadvancesalarycomponent(paygroup);
                     var getpaycomponent = get_paycomponent.toString().split("#");
 
                     var comp_accountCodeID = getpaycomponent[0];
                     var paycompname = getpaycomponent[2];
                     jvObject.selectNewLine('line');
                     jvObject.setCurrentSublistValue('line', 'account', comp_accountCodeID); //Credit Account code//Component_Code
                     jvObject.setCurrentSublistValue('line', 'debit', Deduct.toFixed(2));
                     jvObject.setCurrentSublistValue('line', 'credit', 0.0);
                     jvObject.setCurrentSublistValue('line', 'memo', paycompname);
                     jvObject.setCurrentSublistValue('line', 'entity', emp);
                     jvObject.setCurrentSublistValue('line', 'entity_display', empTxt);
                     jvObject.commitLine('line')
 
                 } */
                 //create salary advance account
                 if (leavesalaryamt > 0) {
                     Credit = parseFloat(leavesalaryamt)
                     //var get_paycomponent = getadvancesalarycomponent(paygroup);
                     var get_paycomponent = getleavesalarycomponentCredit(paygroup);
                     var getpaycomponent = get_paycomponent.toString().split("#");
                     var comp_accountCodeID = getpaycomponent[0];
                     var paycompname = getpaycomponent[2];
                     jvObject.selectNewLine('line');
                     jvObject.setCurrentSublistValue('line', 'account', comp_accountCodeID); //Credit Account code//Component_Code
                     jvObject.setCurrentSublistValue('line', 'credit', Credit.toFixed(2));
                     jvObject.setCurrentSublistValue('line', 'debit', 0.0);
                     jvObject.setCurrentSublistValue('line', 'memo', paycompname);
                     //jvObject.setCurrentSublistValue('line', 'entity', emp);
                    // jvObject.setCurrentSublistValue('line', 'entity_display', empTxt);
                     jvObject.commitLine('line')
                 }
                 //leave salary advance debit
                 if (leavesalaryamt > 0) {
                    Deduct = parseFloat(leavesalaryamt)
                    //var get_paycomponent = getadvancesalarycomponent(paygroup);
                    var get_paycomponent = getleavesalarycomponentDebit(paygroup);
                    var getpaycomponent = get_paycomponent.toString().split("#");
                    var comp_accountCodeID = getpaycomponent[0];
                    var paycompname = getpaycomponent[2];
                    jvObject.selectNewLine('line');
                    jvObject.setCurrentSublistValue('line', 'account', comp_accountCodeID); //Credit Account code//Component_Code
                    jvObject.setCurrentSublistValue('line', 'debit', Deduct.toFixed(2));
                    jvObject.setCurrentSublistValue('line', 'credit', 0.0);
                    jvObject.setCurrentSublistValue('line', 'memo', paycompname);
                    //jvObject.setCurrentSublistValue('line', 'entity', emp);
                   //jvObject.setCurrentSublistValue('line', 'entity_display', empTxt);
                    jvObject.commitLine('line')
                }
                 if (airticketamount > 0) {
                     create = parseFloat(airticketamount)
                     var get_paycomponent = getairticketcomponentCreate(paygroup);
                     var getpaycomponent = get_paycomponent.toString().split("#");
                     var comp_accountCodeID = getpaycomponent[0];
                     var paycompname = getpaycomponent[2];
                     jvObject.selectNewLine('line');
                     jvObject.setCurrentSublistValue('line', 'account', comp_accountCodeID); //Credit Account code//Component_Code
                     jvObject.setCurrentSublistValue('line', 'credit', create.toFixed(2));
                     jvObject.setCurrentSublistValue('line', 'debit', 0.0);
                     jvObject.setCurrentSublistValue('line', 'memo', paycompname);
                     //jvObject.setCurrentSublistValue('line', 'entity', emp);
                     //jvObject.setCurrentSublistValue('line', 'entity_display', empTxt);
                     jvObject.commitLine('line')
 
 
                 }
                 if (airticketamount > 0) {
                    Deduct = parseFloat(airticketamount)
                    var get_paycomponent = getairticketcomponentDebit(paygroup);
                    var getpaycomponent = get_paycomponent.toString().split("#");
                    var comp_accountCodeID = getpaycomponent[0];
                    var paycompname = getpaycomponent[2];
                    jvObject.selectNewLine('line');
                    jvObject.setCurrentSublistValue('line', 'account', comp_accountCodeID); //Credit Account code//Component_Code
                    jvObject.setCurrentSublistValue('line', 'debit', Deduct.toFixed(2));
                    jvObject.setCurrentSublistValue('line', 'credit', 0.0);
                    jvObject.setCurrentSublistValue('line', 'memo', paycompname);
                    //jvObject.setCurrentSublistValue('line', 'entity', emp);
                   // jvObject.setCurrentSublistValue('line', 'entity_display', empTxt);
                    jvObject.commitLine('line')


                }
                /*  if (loanamount > 0) {
                     Deduct = parseFloat(loanamount)
                     var get_paycomponent = getloancomponent(paygroup);
                     var getpaycomponent = get_paycomponent.toString().split("#");
                     var comp_accountCodeID = getpaycomponent[0];
                     var paycompname = getpaycomponent[2];
                     jvObject.selectNewLine('line');
                     jvObject.setCurrentSublistValue('line', 'account', comp_accountCodeID); //Credit Account code//Component_Code
                     jvObject.setCurrentSublistValue('line', 'debit', 0.0);
                     jvObject.setCurrentSublistValue('line', 'credit', Deduct.toFixed(2));
                     jvObject.setCurrentSublistValue('line', 'memo', paycompname);
                     jvObject.setCurrentSublistValue('line', 'entity', emp);
                     jvObject.setCurrentSublistValue('line', 'entity_display', empTxt);
                     jvObject.commitLine('line')
 
 
                 } */



                 //   jvObject.setCurrentSublistValue('line', 'class', 12);
 
 
 
                /*  var get_paycomponent = getleavesettlementcomponent(paygroup);
                 var getpaycomponent = get_paycomponent.toString().split("#");
                 var sett_comp_accountCodeID = getpaycomponent[0];
                 var paycompname = getpaycomponent[2];
                 log.debug('Account id', sett_comp_accountCodeID);
                 Deduct = settleamount;
                 jvObject.selectNewLine('line');
                 jvObject.setCurrentSublistValue('line', 'account', sett_comp_accountCodeID); //Credit Account code//Component_Code
                 jvObject.setCurrentSublistValue('line', 'debit', 0.0);
                 jvObject.setCurrentSublistValue('line', 'credit', Deduct.toFixed(2));
                 jvObject.setCurrentSublistValue('line', 'memo', paycompname);
                 jvObject.setCurrentSublistValue('line', 'entity', emp);
                 jvObject.setCurrentSublistValue('line', 'entity_display', empTxt); */
                 //   jvObject.setCurrentSublistValue('line', 'class', 12);
                 //jvObject.commitLine('line')
                 var jvrecordId = jvObject.save({
                     enableSourcing: true,
                     ignoreMandatoryFields: true
                 });
                 log.debug("jvrecordid", jvrecordId);
 
                 var leavesettleID = record.submitFields({
                     type: 'customrecord_hrms_leavesettlement',
                     id: leaveSettlemenID,
                     values: {
                         'custrecord_hrms_lveset_jevoucherno': jvrecordId
                     }
                 });
 
                 log.debug("Info", "Leave settlement voucher Updated. Internal ID : " + leavesettleID);
 
                 var url = '/app/common/custom/custrecordentry.nl?rectype=250&id=' + leavesettleID
 
 
                 window.location.href = url;
             }
             catch (e) {
                 log.error("Error in JV Creation", e);
                 // log.debug("Error in getEmpTotalLeaveTaken : " + e);
             }
 
         }
         function getMonthFromDate(date) {
             if (!date) {
                 throw new Error("Date is required");
             }
 
             // Convert the date to a JavaScript Date object if necessary
             const jsDate = new Date(date);
 
             // Get the month (0-indexed, so add 1)
             const month = jsDate.getMonth() + 1;
 
             return month;
         }
         function getYearFromDate(date) {
             if (!date) {
                 throw new Error("Date is required");
             }
 
             // Convert the date to a JavaScript Date object if necessary
             const jsDate = new Date(date);
 
             // Get the year
             const year = jsDate.getFullYear();
 
             return year;
         }

         /* function getleavesettlementcomponent(paygroup) {
             var comp_accountCodeID = ''
             var componentsql = " select id as paycompid,BUILTIN.DF(id) paycompname,custrecord_hris_account_name as accountid  from  customrecord_hris_payroll_component where custrecord_hris__sequence_no_ = 48  and isinactive ='F'and custrecord_hris_pay_process_group  =" + paygroup;
 
             log.debug('componentsql  ', componentsql);
 
 
             var queryResults = query.runSuiteQL({
                 query: componentsql
             });
 
             var componentsqlrecords = queryResults.asMappedResults();
             if (componentsqlrecords.length > 0) {
                 var paycompid = componentsqlrecords[0].paycompid;
                 var paycompname = componentsqlrecords[0].paycompname;
                 comp_accountCodeID = componentsqlrecords[0].accountid;
                 log.debug('Account id', comp_accountCodeID);
             }
 
             return comp_accountCodeID + "#" + paycompid + "#" + paycompname;
         } */
         function getleavesalaryamount(empid){
            debugger;
            var leaveaccuralamount=0
        /*     var leaveaccuralsql ="SELECT SUM(COALESCE(custrecord_hris_accural_amount, 0)) AS accuralamount, SUM(COALESCE(custrecord_hris_accural_utilised_amount, 0)) AS utilisedamount, SUM(COALESCE(custrecord_hris_accural_amount, 0)) - SUM(COALESCE(custrecord_hris_accural_utilised_amount, 0)) as balanceamount FROM customrecord_hris_monthly_accural_trans where custrecord_hris_accural_type =1 and  custrecord_hris_accural_trans_type=1 and custrecord_hris_accural_empid = " + empid+" and isinactive='F'"
 */
        
                           /*    var leaveaccuralsql ="SELECT SUM(COALESCE(a.custrecord_hris_accural_amount, 0)) AS accuralamount, SUM(COALESCE(a.custrecord_hris_accural_utilised_amount, 0)) AS utilisedamount, SUM(COALESCE(a.custrecord_hris_accural_amount, 0)) - SUM(COALESCE(a.custrecord_hris_accural_utilised_amount, 0)) as balanceamount FROM a.customrecord_hris_monthly_accural_trans  a join customrecord_hris_accuraltype_master b on a.custrecord_hris_accural_type=b.id  join customrecord_hrms_accural_transactiontyp c on a.custrecord_hris_accural_trans_type =c.id where  b.custrecord_hris_accural_seqno=1 and c.custrecord_hris_accural_trans_seqno=1 and a.custrecord_hris_accural_empid = " + empid+" and b.isinactive='F'"
                      */
                            
                            
                            var leaveaccuralsql="SELECT T0.accuralamount,T1.utilisedamount,COALESCE(T0.accuralamount, 0) - COALESCE(T1.utilisedamount, 0) as balanceamount FROM (SELECT a.custrecord_hris_accural_empid,SUM(COALESCE(a.custrecord_hris_accural_amount, 0)) AS accuralamount FROM customrecord_hris_monthly_accural_trans a JOIN customrecord_hris_accuraltype_master b ON a.custrecord_hris_accural_type = b.id JOIN customrecord_hrms_accural_transactiontyp c ON a.custrecord_hris_accural_trans_type = c.id WHERE b.custrecord_hris_accural_seqno = 1 AND c.custrecord_hris_accural_trans_seqno = 1  AND a.custrecord_hris_accural_empid = "+empid+" AND a.isinactive = 'F' GROUP BY  a.custrecord_hris_accural_empid) T0 LEFT JOIN ( SELECT  a1.custrecord_hris_accural_empid,SUM(COALESCE(a1.custrecord_hris_accural_utilised_amount, 0)) AS utilisedamount, FROM customrecord_hris_monthly_accural_trans a1  JOIN customrecord_hris_accuraltype_master b1 ON a1.custrecord_hris_accural_type = b1.id JOIN customrecord_hrms_accural_transactiontyp c1 ON a1.custrecord_hris_accural_trans_type = c1.id WHERE b1.custrecord_hris_accural_seqno = 1  AND c1.custrecord_hris_accural_trans_seqno = 3 AND a1.custrecord_hris_accural_empid = "+empid+" AND a1.isinactive = 'F' GROUP BY a1.custrecord_hris_accural_empid ) T1 ON T0.custrecord_hris_accural_empid = T1.custrecord_hris_accural_empid"
                             log.debug('leaveaccuralsql  ',  leaveaccuralsql);


                              var queryResults = query.runSuiteQL({
                                  query:  leaveaccuralsql
                              });
                  
                              var  leaveaccuralsqlrecords = queryResults.asMappedResults();
                              if ( leaveaccuralsqlrecords.length > 0) {  
                                var leaverecord = leaveaccuralsqlrecords[0];
                                leaveaccuralamount=leaverecord.balanceamount||0
                                
                              
                              }
                   return leaveaccuralamount;           
        
         }
         function getleavedays(empid){
            debugger;
            var leaveaccuraldays=0
        /*   var leaveaccuralsql="select sum(COALESCE(a.custrecord_hris_accural_days,0)) as accuralleave , sum(COALESCE(a.custrecord_hris_accural_utilised_leave,0)) as utilisedleave, sum(COALESCE(a.custrecord_hris_accural_days,0))+sum(COALESCE(a.custrecord_hris_accural_leave_canceldays,0))-  sum(COALESCE(a.custrecord_hris_accural_utilised_leave,0)) as accuraldays, sum(COALESCE(a.custrecord_hris_accural_leave_canceldays,0)) as cancelday from a.customrecord_hris_monthly_accural_trans  a join customrecord_hris_accuraltype_master b on a.custrecord_hris_accural_type=b.id join customrecord_hrms_accural_transactiontyp c on a.custrecord_hris_accural_trans_type =c.id where b.custrecord_hris_accural_seqno=1  and a.custrecord_hris_accural_empid= " + empid+" and a.isinactive='F'"
 */


         var leaveaccuraldayssql ="SELECT T0.utilisedleave,T0.cancelday,T2.accuredleave,T1.settledleave, COALESCE(T0.utilisedleave, 0) - (COALESCE(T1.settledleave, 0) + COALESCE(T0.cancelday, 0)) AS accuraldays , COALESCE(T2.accuredleave, 0) + (COALESCE(T0.cancelday, 0) - COALESCE(T0.utilisedleave, 0)) AS balanceutilised from( SELECT a.custrecord_hris_accural_empid, SUM(COALESCE(a.custrecord_hris_accural_utilised_leave, 0)) AS utilisedleave, SUM(COALESCE(a.custrecord_hris_accural_leave_canceldays, 0)) AS cancelday FROM customrecord_hris_monthly_accural_trans a JOIN customrecord_hris_accuraltype_master b ON a.custrecord_hris_accural_type = b.id JOIN customrecord_hrms_accural_transactiontyp c ON a.custrecord_hris_accural_trans_type = c.id WHERE b.custrecord_hris_accural_seqno = 1 and c.custrecord_hris_accural_trans_seqno=5 AND a.custrecord_hris_accural_empid = "+empid+" GROUP BY a.custrecord_hris_accural_empid ) T0 LEFT JOIN ( SELECT a1.custrecord_hris_accural_empid,SUM(COALESCE(a1.custrecord_hris_accural_utilised_leave, 0)) AS settledleave FROM customrecord_hris_monthly_accural_trans a1 JOIN customrecord_hris_accuraltype_master b1 ON a1.custrecord_hris_accural_type = b1.id JOIN customrecord_hrms_accural_transactiontyp c1 ON a1.custrecord_hris_accural_trans_type = c1.id WHERE b1.custrecord_hris_accural_seqno = 1 AND c1.custrecord_hris_accural_trans_seqno = 3 AND a1.custrecord_hris_accural_empid = "+empid+" GROUP BY  a1.custrecord_hris_accural_empid) T1 ON T0.custrecord_hris_accural_empid = T1.custrecord_hris_accural_empid LEFT JOIN ( SELECT a2.custrecord_hris_accural_empid,SUM(COALESCE(a2.custrecord_hris_accural_days, 0)) AS accuredleave FROM customrecord_hris_monthly_accural_trans a2 JOIN customrecord_hris_accuraltype_master b2 ON a2.custrecord_hris_accural_type = b2.id  JOIN customrecord_hrms_accural_transactiontyp c2 ON a2.custrecord_hris_accural_trans_type = c2.id WHERE b2.custrecord_hris_accural_seqno = 1 and c2.custrecord_hris_accural_trans_seqno = 1 AND a2.custrecord_hris_accural_empid = "+empid+" GROUP BY a2.custrecord_hris_accural_empid) T2 ON T0.custrecord_hris_accural_empid = T2.custrecord_hris_accural_empid"
                              log.debug('leaveaccuraldayssql  ',  leaveaccuraldayssql);





                              var queryResults = query.runSuiteQL({
                                  query:  leaveaccuraldayssql
                              });
                  
                              var  leaveaccuraldayssqlrecords = queryResults.asMappedResults();
                              if ( leaveaccuraldayssqlrecords.length > 0) {  
                                var leaverecord = leaveaccuraldayssqlrecords[0];
                                leaveaccuraldays=leaverecord.accuraldays||0
                                
                              
                              }
                   return leaveaccuraldays;           
        
         }
         function getairtickeaccuralamount(empid){
            debugger;
            var leaveaccuralamount=0
/*             var leaveaccuralsql ="SELECT SUM(COALESCE(custrecord_hris_accural_amount, 0)) AS accuralamount, SUM(COALESCE(custrecord_hris_accural_utilised_amount, 0)) AS utilisedamount, SUM(COALESCE(custrecord_hris_accural_amount, 0)) - SUM(COALESCE(custrecord_hris_accural_utilised_amount, 0)) as balanceamount FROM customrecord_hris_monthly_accural_trans where custrecord_hris_accural_type =2 and  custrecord_hris_accural_trans_type=2 and custrecord_hris_accural_empid = " + empid+" and isinactive='F'"

 */                        

                            /*   var leaveaccuralsql ="SELECT SUM(COALESCE(a.custrecord_hris_accural_amount, 0)) AS accuralamount, SUM(COALESCE(a.custrecord_hris_accural_utilised_amount, 0)) AS utilisedamount, SUM(COALESCE(a.custrecord_hris_accural_amount, 0)) - SUM(COALESCE(a.custrecord_hris_accural_utilised_amount, 0)) as balanceamount FROM customrecord_hris_monthly_accural_trans a join customrecord_hris_accuraltype_master b on a.custrecord_hris_accural_type=b.id  join customrecord_hrms_accural_transactiontyp c on a.custrecord_hris_accural_trans_type =c.id where b.custrecord_hris_accural_seqno=2 and c.custrecord_hris_accural_trans_seqno=2 and a.custrecord_hris_accural_empid = " + empid+" and a.isinactive='F'"
 */

                             var airticketaccuralsql="SELECT T0.accuralamount,T1.utilisedamount,COALESCE(T0.accuralamount, 0) - COALESCE(T1.utilisedamount, 0) as balanceamount FROM (SELECT a.custrecord_hris_accural_empid,SUM(COALESCE(a.custrecord_hris_accural_amount, 0)) AS accuralamount FROM customrecord_hris_monthly_accural_trans a JOIN customrecord_hris_accuraltype_master b ON a.custrecord_hris_accural_type = b.id JOIN customrecord_hrms_accural_transactiontyp c ON a.custrecord_hris_accural_trans_type = c.id WHERE b.custrecord_hris_accural_seqno = 2 AND c.custrecord_hris_accural_trans_seqno = 2  AND a.custrecord_hris_accural_empid = "+empid+" AND a.isinactive = 'F' GROUP BY  a.custrecord_hris_accural_empid) T0 LEFT JOIN ( SELECT  a1.custrecord_hris_accural_empid,SUM(COALESCE(a1.custrecord_hris_accural_utilised_amount, 0)) AS utilisedamount, FROM customrecord_hris_monthly_accural_trans a1  JOIN customrecord_hris_accuraltype_master b1 ON a1.custrecord_hris_accural_type = b1.id JOIN customrecord_hrms_accural_transactiontyp c1 ON a1.custrecord_hris_accural_trans_type = c1.id WHERE b1.custrecord_hris_accural_seqno = 2  AND c1.custrecord_hris_accural_trans_seqno = 4 AND a1.custrecord_hris_accural_empid = "+empid+" AND a1.isinactive = 'F' GROUP BY a1.custrecord_hris_accural_empid ) T1 ON T0.custrecord_hris_accural_empid = T1.custrecord_hris_accural_empid"



                              log.debug('airticketaccuralsql  ',  airticketaccuralsql);


                              var queryResults = query.runSuiteQL({
                                  query:  airticketaccuralsql
                              });
                  
                              var  airticketaccuralsqlrecords = queryResults.asMappedResults();
                              if ( airticketaccuralsqlrecords.length > 0) {  
                                var leaverecord = airticketaccuralsqlrecords[0];
                                leaveaccuralamount=leaverecord.balanceamount||0
                                
                              
                              }
                   return leaveaccuralamount;           
        
         }
         
       
         function getleavesalarycomponentCredit(paygroup) {
             var comp_accountCodeID = ''
             var componentsql = " select id as paycompid,BUILTIN.DF(id) paycompname,custrecord_hris_account_name as accountid from  customrecord_hris_payroll_component where custrecord_hris__sequence_no_ = 51 and isinactive ='F' and custrecord_hris_pay_process_group  =" + paygroup;
 
             log.debug('componentsql  ', componentsql);
 
 
             var queryResults = query.runSuiteQL({
                 query: componentsql
             });
 
             var componentsqlrecords = queryResults.asMappedResults();
             if (componentsqlrecords.length > 0) {
                 var paycompid = componentsqlrecords[0].paycompid;
                 var paycompname = componentsqlrecords[0].paycompname;
                 comp_accountCodeID = componentsqlrecords[0].accountid;
                 log.debug('Account id', comp_accountCodeID);
             }
 
             return comp_accountCodeID + "#" + paycompid + "#" + paycompname;
         }
         function getleavesalarycomponentDebit(paygroup) {
            var comp_accountCodeID = ''
            var componentsql = " select id as paycompid,BUILTIN.DF(id) paycompname,custrecord_hris_account_name as accountid from  customrecord_hris_payroll_component where custrecord_hris__sequence_no_ = 48 and isinactive ='F' and custrecord_hris_pay_process_group  =" + paygroup;

            log.debug('componentsql  ', componentsql);


            var queryResults = query.runSuiteQL({
                query: componentsql
            });

            var componentsqlrecords = queryResults.asMappedResults();
            if (componentsqlrecords.length > 0) {
                var paycompid = componentsqlrecords[0].paycompid;
                var paycompname = componentsqlrecords[0].paycompname;
                comp_accountCodeID = componentsqlrecords[0].accountid;
                log.debug('Account id', comp_accountCodeID);
            }

            return comp_accountCodeID + "#" + paycompid + "#" + paycompname;
        }
         function getloancomponent(paygroup) {
             var comp_accountCodeID = ''
             var componentsql = " select id as paycompid,BUILTIN.DF(id) paycompname,custrecord_hris_account_name as accountid from  customrecord_hris_payroll_component where custrecord_hris__sequence_no_ = 62 and isinactive ='F' and custrecord_hris_pay_process_group  =" + paygroup;
 
             log.debug('componentsql  ', componentsql);
 
 
             var queryResults = query.runSuiteQL({
                 query: componentsql
             });
 
             var componentsqlrecords = queryResults.asMappedResults();
             if (componentsqlrecords.length > 0) {
                 var paycompid = componentsqlrecords[0].paycompid;
                 var paycompname = componentsqlrecords[0].paycompname;
                 comp_accountCodeID = componentsqlrecords[0].accountid;
                 log.debug('Account id', comp_accountCodeID);
             }
 
             return comp_accountCodeID + "#" + paycompid + "#" + paycompname;
         }
         function getyearid(yearname) {
 
             var yearsql = " select * from  customlist_hris_year_master where  isinactive ='F' and name=" + yearname;
 
             log.debug('yearsql  ', yearsql);
 
 
             var queryResults = query.runSuiteQL({
                 query: yearsql
             });
 
             var yearsqlrecords = queryResults.asMappedResults();
             if (yearsqlrecords.length > 0) {
                 var yearid = yearsqlrecords[0].id;
 
             }
 
             return yearid;
         }
         function getnationality(empid) {
 
            var empsql = " select * from  employee where  isinactive ='F' and id=" + empid;

            log.debug('empsql  ',empsql);


            var queryResults = query.runSuiteQL({
                query: empsql
            });

            var empsqlrecords = queryResults.asMappedResults();
            if (empsqlrecords.length > 0) {
                var nationality= empsqlrecords[0].custentity_hris_empnationality;

            }

            return nationality;
        }
         function getadvancesalarycomponent(paygroup) {
             var comp_accountCodeID = ''
             var componentsql = " select id as paycompid,BUILTIN.DF(id) paycompname,custrecord_hris_account_name as accountid from  customrecord_hris_payroll_component where custrecord_hris__sequence_no_ = 52 and isinactive ='F' and custrecord_hris_pay_process_group  =" + paygroup;
 
             log.debug('componentsql  ', componentsql);
 
 
             var queryResults = query.runSuiteQL({
                 query: componentsql
             });
 
             var componentsqlrecords = queryResults.asMappedResults();
             if (componentsqlrecords.length > 0) {
                 var paycompid = componentsqlrecords[0].paycompid;
                 var paycompname = componentsqlrecords[0].paycompname;
                 comp_accountCodeID = componentsqlrecords[0].accountid;
                 log.debug('Account id', comp_accountCodeID);
             }
 
             return comp_accountCodeID + "#" + paycompid + "#" + paycompname;
         }
         function getairticketcomponentCreate(paygroup) {
             var comp_accountCodeID = ''
             var componentsql = " select id as paycompid,BUILTIN.DF(id) paycompname,custrecord_hris_account_name as accountid from  customrecord_hris_payroll_component where custrecord_hris__sequence_no_ = 36 and isinactive ='F' and custrecord_hris_pay_process_group  =" + paygroup;
 
             log.debug('componentsql  ', componentsql);
 
 
             var queryResults = query.runSuiteQL({
                 query: componentsql
             });
 
             var componentsqlrecords = queryResults.asMappedResults();
             if (componentsqlrecords.length > 0) {
                 var paycompid = componentsqlrecords[0].paycompid;
                 var paycompname = componentsqlrecords[0].paycompname;
                 comp_accountCodeID = componentsqlrecords[0].accountid;
                 log.debug('Account id', comp_accountCodeID);
             }
 
             return comp_accountCodeID + "#" + paycompid + "#" + paycompname;
         }
         //airticket debit Account
         function getairticketcomponentDebit(paygroup) {
            var comp_accountCodeID = ''
            var componentsql = " select id as paycompid,BUILTIN.DF(id) paycompname,custrecord_hris_account_name as accountid from  customrecord_hris_payroll_component where custrecord_hris__sequence_no_ = 37 and isinactive ='F' and custrecord_hris_pay_process_group  =" + paygroup;

            log.debug('componentsql  ', componentsql);


            var queryResults = query.runSuiteQL({
                query: componentsql
            });

            var componentsqlrecords = queryResults.asMappedResults();
            if (componentsqlrecords.length > 0) {
                var paycompid = componentsqlrecords[0].paycompid;
                var paycompname = componentsqlrecords[0].paycompname;
                comp_accountCodeID = componentsqlrecords[0].accountid;
                log.debug('Account id', comp_accountCodeID);
            }

            return comp_accountCodeID + "#" + paycompid + "#" + paycompname;
        }
         function getMonth(monthParameter) {
             if (monthParameter == 1) {
                 return 'Jan'
             }
             else if (monthParameter == 2) {
                 return 'Feb'
             }
             else if (monthParameter == 3) {
                 return 'Mar'
             }
             else if (monthParameter == 4) {
                 return 'Apr'
             }
             else if (monthParameter == 5) {
                 return 'May'
             }
             else if (monthParameter == 6) {
                 return 'Jun'
             }
             else if (monthParameter == 7) {
                 return 'Jul'
             }
             else if (monthParameter == 8) {
                 return 'Aug'
             }
             else if (monthParameter == 9) {
                 return 'Sep'
             }
             else if (monthParameter == 10) {
                 return 'Oct'
             }
             else if (monthParameter == 11) {
                 return 'Nov'
             }
             else if (monthParameter == 12) {
                 return 'Dec'
             }
         }//End function getMon
 
         return {
             pageInit: pageInit,
             fieldChanged: fieldChanged,
             lineInit: lineInit,
             saveRecord: saveRecord,
             sublistChanged: sublistChanged,
             validateLine: validateLine,
             leavesalary: leavesalary,
             jvcreation: jvcreation,
             recalculate: recalculate
             // validateField: validateField
         }
     });
 
 function calculateDateDifference(startDate, endDate) {
     // Parse dates if they are in string format
     var parsedStartDate = format.parse({
         value: startDate,
         type: format.Type.DATE
     });
     /*  var parsedEndDate = format.parse({
           value: endDate,
           type: format.Type.DATE
       }); */
     // var parsedStartDate = startDate
     var parsedEndDate = endDate
 
     // Calculate the difference in milliseconds
     var differenceInMilliseconds = parsedEndDate - parsedStartDate;
 
     // Convert milliseconds to days
     var differenceInDays = differenceInMilliseconds / (1000 * 60 * 60 * 24);
 
     return differenceInDays;
 }
 
 
 
 
 
 
 
 
 
 
 
 function formatDate(date) {
     date = new Date(date);
 
     var day = ('0' + date.getDate()).slice(-2);
     var month = ('0' + (date.getMonth() + 1)).slice(-2);
     var year = date.getFullYear();
 
     return day + "/" + month + "/" + year;
 }
 
 function EmpSalaryDetails(emp, paygroup) {
     debugger;
     try {
         var DataArray = []
 
 
         var employeesalarysql = "select b.custrecord_hris_cde_payroll_component as paycomponent, BUILTIN.DF(b.custrecord_hris_cde_payroll_component) as paycomponentname , b.custrecord_hris_cde_monthly as amount,c.custrecord_hris_payroll_component_type as componenttype  from customrecord_hris_employee_compen_change a join  customrecord_hris_compensation_details_e b on a.id = b.custrecord_hris_employee_data_change join customrecord_hris_payroll_component c on b.custrecord_hris_cde_payroll_component = c.id where a.custrecord_hris_empchange_employee_nam ='"+ emp + "' and a.custrecord_hris_empchange_emp_pay_pro_gp =" + paygroup + " and b.custrecord_hris_cde_monthly > 0";
 
         log.debug('employeesalarysql', employeesalarysql);
         var employeesalarysqlrecords = getResult(employeesalarysql);
 
         if (employeesalarysqlrecords.length > 0) {
 
             for (var j = 0; j < employeesalarysqlrecords.length; j++) {
 
                 var Code = employeesalarysqlrecords[j].paycomponent;
                 var Name = employeesalarysqlrecords[j].paycomponentname;
                 var Amount = employeesalarysqlrecords[j].amount;
                 var PayType = employeesalarysqlrecords[j].componenttype
 
 
 
                 DataArray.push({
                     'code': Code,
                     'name': Name,
                     'amount': Amount,
                     'type': PayType
                 });
             }
         }
 
 
 
         return DataArray;
     } catch (e) {
         log.error("Error in EmpSalaryDetails", e);
         log.debug("Error in EmpSalaryDetails : " + JSON.stringify(e));
     }
 }
 
 
 function advancesalary(emp, fromdate) {
     var salaryadvanceamt = 0;
 
     var employeesalarysql = "SELECT COALESCE(SUM(custrecord_hris_loan_outstanding_amount), 0) as advanceamt FROM  customrecord_hris_empchange_loan_applicn WHERE  custrecord_hris_loan_outstanding_amount > 0 and custrecord_hris_loan_emp_name =" + emp;
     log.debug('employeesalarysql', employeesalarysql);
     var employeesalarysqlrecords = getResult(employeesalarysql);
 
     if (employeesalarysqlrecords.length > 0) {
 
         salaryadvanceamt = employeesalarysqlrecords[0].advanceamt
     }
 
     return salaryadvanceamt
 }
 function getloandetails(emp) {
     var loanarray = [];
 
     var employeesalarysql = "SELECT * FROM  customrecord_hris_empchange_loan_applicn WHERE  custrecord_hris_loan_outstanding_amount > 0 and custrecord_hris_loan_emp_name =" + emp;
     log.debug('employeesalarysql', employeesalarysql);
     var employeesalarysqlrecords = getResult(employeesalarysql);
 
     if (employeesalarysqlrecords.length > 0) {
         for (var l = 0; l < employeesalarysqlrecords.length; l++) {
             var loanrecord = employeesalarysqlrecords[l];
             var loanid = loanrecord.id;
             var loantype = loanrecord.custrecord_hris_loan_loan_type;
             var loanamt = loanrecord.custrecord_hris_loan_amount || 0;
             var paidamt = loanrecord.custrecord_hris_loan_paid_amount || 0;
             var outstandingamt = loanrecord.custrecord_hris_loan_outstanding_amount || 0;
             loanarray.push({
                 'loanid': loanid,
                 'loantype': loantype,
                 'loanamt': loanamt,
                 'paidamt': paidamt,
                 'outstandingamt': outstandingamt
             });
         }
 
 
 
     }
     log.debug('Loan Array', loanarray);
     if (loanarray.length > 0) {
         return loanarray;
     } else {
         return null;
     }
 
 
 }
 
 function getairticketamount(paygroup, workingyears,employeecatagoryid,nationality) {
     var airticketamount = 0;
     var airticketsql = "select * from customrecord_hris_ticket_master where custrecord_hris_tkt_empcatagory="+employeecatagoryid+" and custrecord_hris_tkt_nationality="+nationality+" and custrecord_hris_status=1 and custrecord_hris_employee_type =" + paygroup
     log.debug('airticketsql', airticketsql);
     var airticketsqlrecords = getResult(airticketsql);
 
     if (airticketsqlrecords.length > 0) {
         airticketamount = airticketsqlrecords[0].custrecord_hris_actual_amount;
     }
     return airticketamount
 }
 
 
 function getairticketamountLabour(paygroup, workingyears, rejoindate, airticketyears) {
     var airticketamount = 0;
 
     debugger;
     console.log('Formatrejoindate', rejoindate);
 
     /*  var airticketsql = "Select Case When NVL('"+rejoindate+"','')='' Then SUM(AIRTCKTWOR) else SUM(AIRTCKTWR) end as AIRTCKT from (Select *,CASE WHEN "+workingyears+" >=custrecord_hris_tkt_toyear THEN custrecord_hris_tkt_toyear*custrecord_hris_actual_amount WHEN "+workingyears+"<custrecord_hris_tkt_fromyear THEN 0 ELSE ("+workingyears+"-custrecord_hris_tkt_fromyear)*custrecord_hris_actual_amount END as AIRTCKTWOR, CASE WHEN "+workingyears+">=custrecord_hris_tkt_toyear THEN 0  WHEN "+workingyears+" < custrecord_hris_tkt_fromyear THEN 0 ELSE "+workingyears+"*custrecord_hris_actual_amount END as AIRTCKTWR, custrecord_hris_actual_amount from customrecord_hris_ticket_master  where custrecord_hris_status =1 and custrecord_hris_employee_type ="+paygroup+")";
       */
 
     /*  var airticketsql = "Select Case When NVL('" + rejoindate + "','')='' Then SUM(AIRTCKTWOR) else SUM(AIRTCKTWR) end as AIRTCKT from (Select *,CASE WHEN "+ airticketyears + " >=custrecord_hris_tkt_toyear THEN custrecord_hris_tkt_toyear*custrecord_hris_actual_amount WHEN "+ airticketyears + "<custrecord_hris_tkt_fromyear THEN 0 ELSE (" + workingyears + "-custrecord_hris_tkt_fromyear)*custrecord_hris_actual_amount END as AIRTCKTWOR, CASE WHEN "+ airticketyears + ">=custrecord_hris_tkt_toyear THEN 0  WHEN "+ airticketyears + " < custrecord_hris_tkt_fromyear THEN 0 ELSE " + workingyears + "*custrecord_hris_actual_amount END as AIRTCKTWR, custrecord_hris_actual_amount from customrecord_hris_ticket_master  where custrecord_hris_status =1 and custrecord_hris_employee_type ="+ paygroup + ")";
   */
     var airticketsql = "Select  SUM(AIRTCKTWOR) as withoutrejoinamt , SUM(AIRTCKTWR) as withrejoinamt   from (Select CASE WHEN "+ airticketyears + " >=custrecord_hris_tkt_toyear THEN custrecord_hris_tkt_toyear*custrecord_hris_actual_amount WHEN "+ airticketyears + "<custrecord_hris_tkt_fromyear THEN 0 ELSE (" + workingyears + "-custrecord_hris_tkt_fromyear)*custrecord_hris_actual_amount END as AIRTCKTWOR, CASE WHEN "+ airticketyears + ">=custrecord_hris_tkt_toyear THEN 0  WHEN "+ airticketyears + " < custrecord_hris_tkt_fromyear THEN 0 ELSE " + workingyears + "*custrecord_hris_actual_amount END as AIRTCKTWR, custrecord_hris_actual_amount from customrecord_hris_ticket_master  where custrecord_hris_status =1 and custrecord_hris_employee_type ="+ paygroup + ")";
 
     log.debug('airticketsql', airticketsql);
     console.log('airticketsql', airticketsql)
     var airticketsqlrecords = getResult(airticketsql);
 
     if (airticketsqlrecords.length > 0) {
         if (rejoindate == '') {
             airticketamount = airticketsqlrecords[0].withoutrejoinamt;
         }
         else {
             airticketamount = airticketsqlrecords[0].withrejoinamt;
         }
 
     }
     return airticketamount
 }
 
 
 
 
 
 
 function getnetpay(empid) {
     var netpay = 0;
     try {
         var empcompensql = "Select * from customrecord_hris_employee_compen_change  where custrecord_hris_empchange_employee_nam= " + empid + "  and isinactive ='F'";
         log.debug('empcompensql', empcompensql);
         // log.debug(empLeaveTakenSQL);
         var empcompensqlrecords = getResult(empcompensql);
         // log.debug('records in getEmpTotalLeaveTaken', JSON.stringify(records));
         if (empcompensqlrecords.length > 0) {
             netpay = empcompensqlrecords[0].custrecord_hris_empchange_month_cross_sy;
 
         }
         return netpay;
 
     }
     catch (e) {
         log.error("Error in getnetpay", e);
         // log.debug("Error in getEmpTotalLeaveTaken : " + e);
     }
 }
 function daybasic(empid) {
     var basic = 0;
     try {
 
         var empcompensql = "select COALESCE(sum(b.custrecord_hris_cde_monthly),0) as basic from  customrecord_hris_employee_compen_change a  join customrecord_hris_compensation_details_e b on a.id = b.custrecord_hris_employee_data_change join customrecord_hris_payroll_component c on b.custrecord_hris_cde_payroll_component = c.id  where a.custrecord_hris_empchange_employee_nam= "+ empid + "  and a.isinactive ='F' and c.custrecord_hris__sequence_no_ =1 "
         log.debug('empcompensql', empcompensql);
         // log.debug(empLeaveTakenSQL);
         var empcompensqlrecords = getResult(empcompensql);
         // log.debug('records in getEmpTotalLeaveTaken', JSON.stringify(records));
         if (empcompensqlrecords.length > 0) {
             basic = empcompensqlrecords[0].basic;
 
         }
         return basic;
 
     }
     catch (e) {
         log.error("Error in getbasicpay", e);
         // log.debug("Error in getEmpTotalLeaveTaken : " + e);
     }
 
 }
 function gerhra(empid) {
     var hraamount = 0;
     try {
 
         var empcompensql = "select COALESCE(sum(b.custrecord_hris_cde_monthly),0) as basic from  customrecord_hris_employee_compen_change a  join customrecord_hris_compensation_details_e b on a.id = b.custrecord_hris_employee_data_change join customrecord_hris_payroll_component c on b.custrecord_hris_cde_payroll_component = c.id  where a.custrecord_hris_empchange_employee_nam= "+ empid + "  and a.isinactive ='F' and c.custrecord_hris__sequence_no_ =2 "
         log.debug('empcompensql', empcompensql);
         // log.debug(empLeaveTakenSQL);
         var empcompensqlrecords = getResult(empcompensql);
         // log.debug('records in getEmpTotalLeaveTaken', JSON.stringify(records));
         if (empcompensqlrecords.length > 0) {
             hraamount = empcompensqlrecords[0].basic;
 
         }
         return hraamount;
 
     }
     catch (e) {
         log.error("Error in gethra", e);
         // log.debug("Error in getEmpTotalLeaveTaken : " + e);
     }
 
 }
 function getempleavesalbase(empid) {
     var leavesalbase = 0;
     try {
 
      /*    var empcompensql = "select COALESCE(sum(b.custrecord_hris_cde_monthly),0) as leavebase from  customrecord_hris_employee_compen_change a  join customrecord_hris_compensation_details_e b on a.id = b.custrecord_hris_employee_data_change join customrecord_hris_payroll_component c on b.custrecord_hris_cde_payroll_component = c.id  where a.custrecord_hris_empchange_employee_nam= "+ empid + "  and a.isinactive ='F' and c.custrecord_hris_consider_for_encashment ='T' "
    */    
                     var empcompensql = "select custrecord_hris_empchange_month_cross_sy as leavebase from  customrecord_hris_employee_compen_change a  where a.custrecord_hris_empchange_employee_nam= "+ empid + "  and a.isinactive ='F'"
       
         log.debug('empcompensql', empcompensql);
         // log.debug(empLeaveTakenSQL);
         var empcompensqlrecords = getResult(empcompensql);
         // log.debug('records in getEmpTotalLeaveTaken', JSON.stringify(records));
         if (empcompensqlrecords.length > 0) {
             leavesalbase = empcompensqlrecords[0].leavebase||0;
 
         }
         return leavesalbase;
 
     }
     catch (e) {
         log.error("Error in getempleavesalbase", e);
         // log.debug("Error in getEmpTotalLeaveTaken : " + e);
     }
 
 }
 function getpaygroup(empid) {
     try {
         var empcompensql = "Select * from customrecord_hris_employee_compen_change  where custrecord_hris_empchange_employee_nam= " + empid + "  and isinactive ='F'";
         log.debug('empcompensql', empcompensql);
         // log.debug(empLeaveTakenSQL);
         var empcompensqlrecords = getResult(empcompensql);
         // log.debug('records in getEmpTotalLeaveTaken', JSON.stringify(records));
         if (empcompensqlrecords.length > 0) {
             var paygroup = empcompensqlrecords[0].custrecord_hris_empchange_emp_pay_pro_gp;
 
         }
         return paygroup;
 
     }
     catch (e) {
         log.error("Error in getpaygroup", e);
         // log.debug("Error in getEmpTotalLeaveTaken : " + e);
     }
 }
 function search_wageperiod(pay_group) {
     // debugger;
     try {
         var wageperiodsql = "Select * from customrecord_hris_wage_period_details  where custrecord_hris_pay_group= " + pay_group + "  and isinactive ='F'";
         log.debug(' wageperiodsql', wageperiodsql);
         // log.debug(empLeaveTakenSQL);
         var wageperiodsqlrecords = getResult(wageperiodsql);
         // log.debug('records in getEmpTotalLeaveTaken', JSON.stringify(records));
         if (wageperiodsqlrecords.length > 0) {
 
             var WagePeriod_EndDate = wageperiodsqlrecords[0].custrecord_hris_end_date;
             var start_date = wageperiodsqlrecords[0].custrecord_hris_start_date;
             var wage_month = wageperiodsqlrecords[0].custrecord_hris_month;
             var wage_year = wageperiodsqlrecords[0].custrecord_hris_year;
             var wage_cycledays = wageperiodsqlrecords[0].custrecord_hris_wage_cycle_day_s;
 
         }
         return WagePeriod_EndDate + "#" + start_date + "#" + wage_month + "#" + wage_year + "#" + wage_cycledays;
 
     }
     catch (e) {
         log.error("Error in getwageperiod", e);
         // log.debug("Error in getEmpTotalLeaveTaken : " + e);
     }
 }
 function getemployeecatagorysequence(empcatagoryid){
 try{
     var empcatagorysql ="select * from customrecord_hris_employeecategory where id=" +empcatagoryid;
     log.debug('empcatagorysql', empcatagorysql);
 
     var empcatagorysqlrecords = getResult(empcatagorysql);
 
     if (empcatagorysqlrecords.length > 0) {
         var empcatid = empcatagorysqlrecords[0].custrecord_hris_empcat_seqno;
     }
 return empcatid;
 
 }
  catch (e) {
         log.error("Error in getemployeecatagorysequence", e);
         // log.debug("Error in getEmpTotalLeaveTaken : " + e);
     }
 }
 function get_paycomponent(pay_group) {
     //  debugger;
     try {
 
         var componentsql = "select * from customrecord_hris_payroll_component  where custrecord_hris_pay_process_group = " + pay_group + " and isinactive ='F' and custrecord_hris__sequence_no_ =48 "
         log.debug(' componentsql', componentsql);
 
         var componentsqlrecords = getResult(componentsql);
 
         if (componentsqlrecords.length > 0) {
 
             var componentid = componentsqlrecords[0].id;
 
 
         }
         return componentid;
 
     }
     catch (e) {
         log.error("Error in getpaycomponent", e);
         // log.debug("Error in getEmpTotalLeaveTaken : " + e);
     }
 }
 function getResult(pSQL) {
     // log.debug("QUERY", pSQL);
     var queryResults = QUERY.runSuiteQL({
         query: pSQL
     });
     var records = queryResults.asMappedResults();
     return records;
 }
 
 function CountDays_BetweenTwodatesWorking(startDate, endDate) {
     // debugger;
     try {
 
         var count = 0;
         var momentStartDate = MOMENT(startDate);
 
         momentStartDate = momentStartDate
         momentStartDate = momentStartDate.subtract(1, 'days');
         var momentEndDate = MOMENT(endDate);
         var duration = MOMENT.duration(momentEndDate.diff(momentStartDate));
         count = duration.asDays();
         return count;
     } catch (e) {
         log.debug("CountDays_BetweenTwodates/Error", JSON.stringify(e));
     }
 }
 function CountDays_BetweenTwodates(startDate, endDate) {
     // debugger;
     try {
         // log.debug('startDate',startDate);
         // log.debug('endDate',endDate);
         var count = 0;
         var momentStartDate = MOMENT(startDate);
 
         momentStartDate = momentStartDate.subtract(1, 'days'); // Subtract 1 day. Because we want to include both Start and End dates.
         //momentStartDate = momentStartDate 
 
         var momentEndDate = MOMENT(endDate);
         var duration = MOMENT.duration(momentEndDate.diff(momentStartDate));
         count = duration.asDays();
         count = count / 365;
 
         count = parseFloat(count).toFixed(2)
 
 
 
         return count;
     } catch (e) {
         log.debug("CountDays_BetweenTwodates/Error", JSON.stringify(e));
     }
 }
 function CountDays_BetweenTwodatesWorkingdays(startDate, endDate) {
     // debugger;
     try {
         // log.debug('startDate',startDate);
         // log.debug('endDate',endDate);
         var count = 0;
         var momentStartDate = MOMENT(startDate);
 
         //momentStartDate = momentStartDate.subtract(1, 'days'); // Subtract 1 day. Because we want to include both Start and End dates.
         //momentStartDate = momentStartDate 
 
         var momentEndDate = MOMENT(endDate);
         var duration = MOMENT.duration(momentEndDate.diff(momentStartDate));
         count = duration.asDays();
 
 
 
 
         return count;
     } catch (e) {
         log.debug("CountDays_BetweenTwodates/Error", JSON.stringify(e));
     }
 }
 
 function EmpSalaryDetails(emp, paygroup) {
     // debugger;
     try {
         var DataArray = []
 
 
         var employeesalarysql = "select b.custrecord_hris_cde_payroll_component as paycomponent, BUILTIN.DF(b.custrecord_hris_cde_payroll_component) as paycomponentname , b.custrecord_hris_cde_monthly as amount,c.custrecord_hris_payroll_component_type as componenttype,c.custrecord_hris__sequence_no_ as seqno  from customrecord_hris_employee_compen_change a join  customrecord_hris_compensation_details_e b on a.id = b.custrecord_hris_employee_data_change join customrecord_hris_payroll_component c on b.custrecord_hris_cde_payroll_component = c.id where a.custrecord_hris_empchange_employee_nam ='"+ emp + "' and a.custrecord_hris_empchange_emp_pay_pro_gp =" + paygroup + "";// and b.custrecord_hris_cde_monthly > 0";    
 
         log.debug('employeesalarysql', employeesalarysql);
         var employeesalarysqlrecords = getResult(employeesalarysql);
 
         if (employeesalarysqlrecords.length > 0) {
 
             for (var j = 0; j < employeesalarysqlrecords.length; j++) {
 
 
                 var Code = employeesalarysqlrecords[j].paycomponent;
                 var Name = employeesalarysqlrecords[j].paycomponentname;
                 var Amount = employeesalarysqlrecords[j].amount;
                 var PayType = employeesalarysqlrecords[j].componenttype;
                 var seqno = employeesalarysqlrecords[j].seqno
 
 
 
                 DataArray.push({
                     'paygroup': paygroup,
                     'code': Code,
                     'name': Name,
                     'amount': Amount,
                     'type': PayType,
                     'seqno': seqno
                 });
             }
         }
 
 
 
         return DataArray;
     } catch (e) {
         log.error("Error in EmpSalaryDetails", e);
         log.debug("Error in EmpSalaryDetails : " + JSON.stringify(e));
     }
 }
 function CollectSalaryDetails(data, CalDays, Salary) {
     //  debugger;
     try {
         //  if (data.length > 0) {
         var DataArray = [];
         /* for (var m = 0; m < data.length; m++) {
             var Days_ = data[m].days || 0;
             var Month_ = data[m].monthcount || 0;
             var Month_Name = data[m].month || '';
             var Month_id = data[m].id || '';
             var year = data[m].year||'';
             var paydate = data[m].paydate||''; */
         var Days_ = data || 0;
         var Month_ = CalDays || 30;
         for (var i = 0; i < Salary.length; i++) {
             var paygroup = Salary[i].paygroup;
             var Code = Salary[i].code || '';
             var Name = Salary[i].name || '';
             var Amount = Salary[i].amount || 0;
             var Type = Salary[i].type || '';
             var seqno = Salary[i].seqno;
             var convert = Math.round(Amount * 100) / 100;
             var Cal1 = convert / Month_;
             var leaveSettlement = Cal1 * parseInt(Days_);
             var leaveSettlement1 = Math.round(leaveSettlement * 100) / 100;
 
             var Total = 0;
             if (Type == 1) {
                 Total = leaveSettlement1;
             } else {
                 Total = -Math.abs(leaveSettlement1);
             }
 
             DataArray.push({
                 'paygroup': paygroup,
                 'code': Code,
                 'name': Name,
                 'amount': Amount,
                 'salaryamount': Total,
                 'componenttype': Type,
                 'seqno': seqno
 
             });
         }
         // }
         log.debug("Collect Salary", DataArray);
         if (DataArray.length > 0) {
             return DataArray;
         } else {
             return null;
         }
 
         //  }
     } //try
     catch (e) {
         log.debug('CollectSalaryDetails/Error', e);
         log.error("Error in CollectSalaryDetails", e);
         log.debug("Error in CollectSalaryDetails : " + JSON.stringify(e));
     }
 }
 

function recalculateAdditionsDeductions(recordObj) {
    try {
        var sublistcount = recordObj.getLineCount({
            sublistId: 'recmachcustrecord_hrms_addded_settlelink'
        });
        
        var otheraddition = 0;
        var otherdeduction = 0;
        
        var currentIdx = recordObj.getCurrentSublistIndex({
            sublistId: 'recmachcustrecord_hrms_addded_settlelink'
        });
        
        for (var i = 0; i < sublistcount; i++) {
            var amount = 0;
            var componenttype = 0;
            
            if (i === currentIdx) {
                amount = recordObj.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_hrms_addded_settlelink',
                    fieldId: 'custrecord_hrms_addded_amount'
                }) || 0;
                componenttype = recordObj.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_hrms_addded_settlelink',
                    fieldId: 'custrecord_hrms_addded_componenttype'
                });
            } else {
                amount = recordObj.getSublistValue({
                    sublistId: 'recmachcustrecord_hrms_addded_settlelink',
                    fieldId: 'custrecord_hrms_addded_amount',
                    line: i
                }) || 0;
                componenttype = recordObj.getSublistValue({
                    sublistId: 'recmachcustrecord_hrms_addded_settlelink',
                    fieldId: 'custrecord_hrms_addded_componenttype',
                    line: i
                });
            }
            
            if (componenttype == 1) {
                otheraddition += parseFloat(amount);
            } else if (componenttype == 2) {
                otherdeduction += parseFloat(amount);
            }
        }
        
        // Handle if current active line is new line (currentIdx == sublistcount)
        if (currentIdx === sublistcount) {
            var amount = recordObj.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_hrms_addded_settlelink',
                fieldId: 'custrecord_hrms_addded_amount'
            }) || 0;
            var componenttype = recordObj.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_hrms_addded_settlelink',
                fieldId: 'custrecord_hrms_addded_componenttype'
            });
            if (componenttype == 1) {
                otheraddition += parseFloat(amount);
            } else if (componenttype == 2) {
                otherdeduction += parseFloat(amount);
            }
        }
        
        recordObj.setValue({
            fieldId: 'custrecord_hrms_lveset_additionamount',
            value: otheraddition.toFixed(2),
            ignoreFieldChange: true
        });
        
        recordObj.setValue({
            fieldId: 'custrecord_hrms_lveset_deductionamount',
            value: otherdeduction.toFixed(2),
            ignoreFieldChange: true
        });
        
        // Recalculate settlement amounts (Net Amount)
        var leavesalaryamt = parseFloat(recordObj.getValue('custrecord_hrms_lveset_actlvesalaryamt') || recordObj.getValue('custrecord_hrms_lveset_lvesalaryamount') || 0);
        var salaryadvanceamt = parseFloat(recordObj.getValue('custrecord_hrms_lveset_salaryadvance') || recordObj.getValue('custrecord_hrms_lveset_salaryadvanceamt') || 0);
        var airticketamount = parseFloat(recordObj.getValue('custrecord_hrms_lveset_actairticketamt') || recordObj.getValue('custrecord_hrms_lveset_airticketamount') || 0);
        var loanamount = parseFloat(recordObj.getValue('custrecord_hrms_lveset_actloanamount') || recordObj.getValue('custrecord_hrms_lveset_loan_amount') || 0);
        
        var settleamount = (leavesalaryamt + salaryadvanceamt + airticketamount + otheraddition) - (loanamount + otherdeduction);
        
        recordObj.setValue({
            fieldId: 'custrecord_hrms_lveset_settleamount',
            value: settleamount.toFixed(2),
            ignoreFieldChange: true
        });
        recordObj.setValue({
            fieldId: 'custrecord_hrms_lveset_actsettleamount',
            value: settleamount.toFixed(2),
            ignoreFieldChange: true
        });
        
    } catch (err) {
        log.error("Error in recalculateAdditionsDeductions", err);
    }
}
