/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define([
    "N/search",
    "N/query",
    "N/format",
    "N/email",
    "N/record",
    "N/currentRecord",
    "N/url",
    "N/runtime",
    "N/ui/dialog",
    "N/task",
    'N/ui/serverWidget',
    'N/error'
], function (
    search,
    query,
    format,
    email,
    record,
    currentRecord,
    url,
    runtime,
    dialog,
    task,
    serverWidget,
    error
) {
    function beforeLoad(context) {
        var form = context.form;
        var role = runtime.getCurrentUser().role;
        /* if (role == 3) { // 3 = Administrator
                    throw error.create({
                        name: 'ACCESS_DENIED',
                        message: 'You are not allowed to view or edit this record.',
                        notifyOff: true
                    });
                } */

        // Example: hide "custbody_secret" field if not Admin
        /*  if (role != '1294') { // 3 = Administrator role ID
            var field1 = form.getField({ id: 'custrecord_hris_monthly_gross_salary' })
            if (field1) {

                field1.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            }
            var field2 = form.getField({ id: 'custrecord_hris_ctc' })
            if (field2) {
                field2.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            }
            var field3 = form.getField({ id: 'custrecord_hris_annual_gross_salary' })
            if (field3) {
                field3.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            }
            var field4 = form.getField({ id: 'custrecord_hris_monthly_gross_salary_in' })
            if (field4) {

                field4.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            }
            var field5 = form.getField({ id: 'custrecord_hris_annual_gross_salary_in_b' })
            if (field5) {
                field5.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
            }
  

            var sublist = form.getSublist({ id: 'recmachcustrecord_hris_comhis_compenhistoryid' });
            if (sublist) {
                sublist.getField({ id: 'custrecord_hris_comhis_monthlyamoun' }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                sublist.getField({ id: 'custrecord_hris_comhis_annuallyamount' }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                sublist.getField({ id: 'custrecord_hris_comhis_prev_monthlyamt' }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

            }
        }  */

        if (role != '1294') { // 3 = Administrator role ID
            form.getField({ id: 'custrecord_hris_monthly_gross_salary' }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            form.getField({ id: 'custrecord_hris_ctc' }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            form.getField({ id: 'custrecord_hris_annual_gross_salary' }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            form.getField({ id: 'custrecord_hris_monthly_gross_salary_in' }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            form.getField({ id: 'custrecord_hris_annual_gross_salary_in_b' }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });


            var sublist = form.getSublist({ id: 'recmachcustrecord_hris_comhis_compenhistoryid' });
            if (sublist) {
                sublist.getField({ id: 'custrecord_hris_comhis_monthlyamoun' }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                sublist.getField({ id: 'custrecord_hris_comhis_annuallyamount' }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });
                sublist.getField({ id: 'custrecord_hris_comhis_prev_monthlyamt' }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

            }


        }
    }



    function beforeSubmit(context) {
        if (
            context.type === context.UserEventType.CREATE ||
            context.type === context.UserEventType.EDIT
        ) {
            var loadedRec = context.newRecord;
            var recType = loadedRec.type;
            var recId = loadedRec.id;
            /* var loadedRec = record.load({
              type: recType,
              id: recId,
              isDynamic: true,
            });
            log.debug("loadedRec", loadedRec); */
            var totalMonthlyEarn = loadedRec.getValue(
                "custrecord_hris_monthly_gross_salary"
            );

            log.debug("totalMonthlyEarn", totalMonthlyEarn);

            totalMonthlyEarn = totalMonthlyEarn ? parseFloat(totalMonthlyEarn) : 0;
            var payGroupId = loadedRec.getValue(
                "custrecord_hris_employee_pay_process_gro"
            );
            log.debug("payGroupId", payGroupId);

            var exchangeRate = 0;
            if (payGroupId) {
                var excahngesql =
                    "SELECT custrecord_hris_allowance_currency_excha FROM customrecord_hris_process_groupmaster WHERE id = " +
                    payGroupId;

                var resultSet = query.runSuiteQL({ query: excahngesql });
                var tsResult = resultSet.asMappedResults();

                if (tsResult.length > 0) {
                    exchangeRate = tsResult[0].custrecord_hris_allowance_currency_excha;
                }

                log.debug("exchangeRate", exchangeRate);
                exchangeRate = parseFloat(exchangeRate);
            }

            var monthlyTotalAmountInAED = totalMonthlyEarn * exchangeRate;
            log.debug("monthlyTotalAmountInAED", monthlyTotalAmountInAED);

            monthlyTotalAmountInAED = parseFloat(monthlyTotalAmountInAED).toFixed(2);
            var annualTotalInAED = parseFloat(monthlyTotalAmountInAED) * 12;
            annualTotalInAED = parseFloat(annualTotalInAED).toFixed(2);

            loadedRec.setValue({
                fieldId: "custrecord_hris_monthly_gross_salary_in",
                value: monthlyTotalAmountInAED,
            });

            loadedRec.setValue({
                fieldId: "custrecord_hris_annual_gross_salary_in_b",
                value: annualTotalInAED,
            });


            /*       var updatedId = loadedRec.save({
              enableSourcing: true,
              ignoreMandatoryFields: true,
            });
      
            log.debug("Updated EDC Record ID", updatedId);*/
        }

    }

    function afterSubmit(context) {
        if (
            context.type === context.UserEventType.CREATE ||
            context.type === context.UserEventType.EDIT
        ) {
            var newRecord = context.newRecord;
            var recType = newRecord.type;
            var recId = newRecord.id;
            /*    var loadedRec = record.load({
                 type: recType,
                 id: recId,
                 isDynamic: true,
               });
               log.debug("loadedRec", loadedRec);
               var totalMonthlyEarn = loadedRec.getValue(
                 "custrecord_hris_monthly_gross_salary"
               );
         
               log.debug("totalMonthlyEarn", totalMonthlyEarn);
         
               totalMonthlyEarn = totalMonthlyEarn ? parseFloat(totalMonthlyEarn) : 0;
               var payGroupId = loadedRec.getValue(
                 "custrecord_hris_employee_pay_process_gro"
               );
               log.debug("payGroupId", payGroupId);
         
               var exchangeRate = 0;
               if (payGroupId) {
                 var excahngesql =
                   "SELECT custrecord_hris_allowance_currency_excha FROM customrecord_hris_process_groupmaster WHERE id = " +
                   payGroupId;
         
                 var resultSet = query.runSuiteQL({ query: excahngesql });
                 var tsResult = resultSet.asMappedResults();
         
                 if (tsResult.length > 0) {
                   exchangeRate = tsResult[0].custrecord_hris_allowance_currency_excha;
                 }
         
                 log.debug("exchangeRate", exchangeRate);
                 exchangeRate = parseFloat(exchangeRate);
               }
         
               var monthlyTotalAmountInAED = totalMonthlyEarn * exchangeRate;
               log.debug("monthlyTotalAmountInAED", monthlyTotalAmountInAED);
         
               monthlyTotalAmountInAED = parseFloat(monthlyTotalAmountInAED).toFixed(2);
               var annualTotalInAED = parseFloat(monthlyTotalAmountInAED) * 12;
               annualTotalInAED = parseFloat(annualTotalInAED).toFixed(2);
         
               loadedRec.setValue({
                 fieldId: "custrecord_hris_monthly_gross_salary_in",
                 value: monthlyTotalAmountInAED,
               });
         
               loadedRec.setValue({
                 fieldId: "custrecord_hris_annual_gross_salary_in_b",
                 value: annualTotalInAED,
               }); */

            //   get approver field
            var ApproverStatus = newRecord.getValue({
                fieldId: "custrecord_hris_emphis_approvalstatus"
            });
            var EmployeeId = newRecord.getValue({
                fieldId: "custrecord_hris_employee_name_"
            });
            log.debug("Reduce - Employee ID", EmployeeId);

            var EmployeeCompencheck = newRecord.getValue({
                fieldId: "custrecord_hris_comp_chnge_check"
            });

            if (ApproverStatus == 2 && EmployeeCompencheck == false) {
                /*  var mrTask = task.create({
                     taskType: task.TaskType.MAP_REDUCE,
                     scriptId: 'customscript_hris_emp_comp_his_mrs',
                     deploymentId: 'customdeploy_hris_emp_comp_his_mrs',
                     params: {
                         custscript_your_param: context.newRecord.id
                     }
                 });
         
                 var taskId = mrTask.submit();
                 log.debug('Map/Reduce Task Submitted', 'Task ID: ' + taskId);
         */







                var newRecordId = recId;
                log.debug("newRecord", newRecordId)

                var Salarypaygroup = newRecord.getValue({
                    fieldId: "custrecord_hris_employee_pay_process_gro"
                });

                var EmpcompChangeID = null;
                var Empcomppaygroup = '';

                var EmpCompensationSQL =
                    "SELECT id,custrecord_hris_empchange_emp_pay_pro_gp  FROM customrecord_hris_employee_compen_change WHERE custrecord_hris_empchange_employee_nam = " +
                    EmployeeId;

                var resultSet = query.runSuiteQL({ query: EmpCompensationSQL });
                var tsResult = resultSet.asMappedResults();

                if (tsResult.length > 0 && tsResult[0].id) {
                    EmpcompChangeID = tsResult[0].id;
                    Empcomppaygroup = tsResult[0].custrecord_hris_empchange_emp_pay_pro_gp;
                    log.debug("EmpcompChangeID", EmpcompChangeID);
                    log.debug("Empcomppaygroup", Empcomppaygroup);
                }

                if (EmpcompChangeID && Empcomppaygroup == Salarypaygroup) {
                    log.debug("is update check");
                    var Compupdate = updateCompensationchangeDetails(EmpcompChangeID, newRecordId);
                }
                else if (EmpcompChangeID && Empcomppaygroup != Salarypaygroup) {
                     log.debug("is compensa check");
                    var Compupdate = createCompensationchangeDetails(EmpcompChangeID, newRecordId);
                }

                else {
                    log.debug("iscreate check");
                    var createCompchangerec = createemployeecompensationchange(newRecordId, EmpcompChangeID);
                }





            }





        }
    }
    function updateCompensationchangeDetails(EmpcompChangeID, newRecordId) {
        var comphistoryrec = record.load({
            type: "customrecord_hris_employee_compensation",
            id: newRecordId,
            isDynamic: true,
        });

        var Empname = comphistoryrec.getValue({ fieldId: "custrecord_hris_employee_name_" });
        log.debug("Empname", Empname);
        var Paygroup = comphistoryrec.getValue({ fieldId: "custrecord_hris_employee_pay_process_gro" });
        var IncrmentType = comphistoryrec.getValue({ fieldId: "custrecord_hris_record_change_type" });
        log.debug("IncrmentType", IncrmentType);
        var monthlyGrossSalary = comphistoryrec.getValue({ fieldId: "custrecord_hris_monthly_gross_salary" });
        var monthlyGrossSalaryInAED = comphistoryrec.getValue({ fieldId: "custrecord_hris_monthly_gross_salary_in" });
        var annualGrossSalary = comphistoryrec.getValue({ fieldId: "custrecord_hris_annual_gross_salary" });
        var annualGrossSalaryInAED = comphistoryrec.getValue({ fieldId: "custrecord_hris_annual_gross_salary_in_b" });
        var ctc = comphistoryrec.getValue({ fieldId: "custrecord_hris_ctc" });
        var effectivedate = comphistoryrec.getValue({ fieldId: "custrecord_hris_effective_from_date" });
        var remarks = comphistoryrec.getValue({ fieldId: "custrecord_hris_remarks" });
        var checkboxforcompchangecheck = comphistoryrec.getValue({ fieldId: "custrecord_hris_comp_chnge_check" });
        log.debug("checkboxforcompchangecheck", checkboxforcompchangecheck);

        log.emergency('Compensation Fields', {
            monthlyGrossSalary: monthlyGrossSalary,
            monthlyGrossSalaryInAED: monthlyGrossSalaryInAED,
            annualGrossSalary: annualGrossSalary,
            annualGrossSalaryInAED: annualGrossSalaryInAED,
            ctc: ctc
        });

        var Linecount = comphistoryrec.getLineCount({ sublistId: "recmachcustrecord_hris_comhis_compenhistoryid" });
        var comphistoryArr = [];
        for (var k = 0; k < Linecount; k++) {
            var processGroup = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_processgroup",
                line: k,
            });
            var payrollComponent = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_payrollcomponent",
                line: k,
            });
            var payrollComponenttext = comphistoryrec.getSublistText({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_payrollcomponent",
                line: k,
            });
            var monthlyAmount = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_monthlyamount",
                line: k,
            });
            var annuallyAmount = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_annuallyamount",
                line: k,
            });
            var payrollSeqNo = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_payrollseqno",
                line: k,
            });
              var employeeid = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_empname",
                line: k,
            });
              var subsidiary = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_subsidi",
                line: k,
            });
              var department = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_department",
                line: k,
            });

            comphistoryArr.push({
                processGroup: processGroup,
                payrollComponent: payrollComponent,
                payrollComponentText: payrollComponenttext,
                monthlyAmount: monthlyAmount,
                annuallyAmount: annuallyAmount,
                payrollSeqNo: payrollSeqNo,
                employeeid:employeeid,
                subsidiary:subsidiary,
                department:department
            });
            log.debug("Line " + k, {
                processGroup: processGroup,
                payrollComponent: payrollComponent,
                monthlyAmount: monthlyAmount,
                annuallyAmount: annuallyAmount,
                payrollSeqNo: payrollSeqNo,
                employeeid:employeeid,
                subsidiary:subsidiary,
                department:department
            });
        }

        var empcomprec = record.load({
            type: "customrecord_hris_employee_compen_change",
            id: EmpcompChangeID,
            isDynamic: true
        });
        log.debug("empcomprec", empcomprec);

        empcomprec.setValue({
            fieldId: "custrecord_hris_empchange_employee_nam",
            value: Empname,
            ignoreFieldChange: false,
            forceSyncSourcing: true
        });
        empcomprec.setValue({
            fieldId: "custrecord_hris_empchange_emp_pay_pro_gp",
            value: Paygroup,
            ignoreFieldChange: true
        });
        if (effectivedate) {
            effectivedate = format.parse({
                value: effectivedate,
                type: format.Type.DATE
            });
            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_eff_from_date",
                value: effectivedate,
                ignoreFieldChange: true
            });
        }
        empcomprec.setValue({
            fieldId: "custrecord_hris_empchange_remarks",
            value: remarks,
            ignoreFieldChange: true
        });
        empcomprec.setValue({
            fieldId: "custrecord_hris_empchange_type",
            value: IncrmentType,
            ignoreFieldChange: true
        });

        var Linecountcomp = empcomprec.getLineCount({ sublistId: "recmachcustrecord_hris_employee_data_change" });
        var empcompchangearr = [];
        for (var t = 0; t < Linecountcomp; t++) {
            var annually = empcomprec.getSublistValue({
                sublistId: "recmachcustrecord_hris_employee_data_change",
                fieldId: "custrecord_hris_cde_annually",
                line: t
            });
            var monthly = empcomprec.getSublistValue({
                sublistId: "recmachcustrecord_hris_employee_data_change",
                fieldId: "custrecord_hris_cde_monthly",
                line: t
            });
            var component = empcomprec.getSublistValue({
                sublistId: "recmachcustrecord_hris_employee_data_change",
                fieldId: "custrecord_hris_cde_payroll_component",
                line: t
            });
            var componentseq = empcomprec.getSublistValue({
                sublistId: "recmachcustrecord_hris_employee_data_change",
                fieldId: "custrecord_hris_payroll_component_seq_no",
                line: t
            });
            empcompchangearr.push({
                annually: annually,
                monthly: monthly,
                component: component,
                componentseq: componentseq
            });
            log.emergency("empcompchangearr", empcompchangearr);
            log.debug("Linecompchange " + t, {
                annually: annually,
                monthly: monthly,
                component: component,
                componentseq: componentseq
            });
        }

        if (checkboxforcompchangecheck == false) {
            log.debug("Starting Line Comparison", {
                comphistoryArr: comphistoryArr,
                empcompchangearr: empcompchangearr
            });

            for (var i = 0; i < comphistoryArr.length; i++) {
                var compFound = false;

                for (var j = 0; j < empcompchangearr.length; j++) {
                    log.debug("Comparing Components", {
                        historyPayrollComponent: comphistoryArr[i].payrollComponent,
                        changeComponent: empcompchangearr[j].component,
                        historySeqNo: comphistoryArr[i].payrollSeqNo,
                        changeSeqNo: empcompchangearr[j].componentseq
                    });

                    if (comphistoryArr[i].payrollComponent == empcompchangearr[j].component) {
                        log.emergency("Matching Component Found", comphistoryArr[i].payrollComponent);

                        empcomprec.selectLine({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            line: j
                        });

                        empcomprec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_cde_process_group',
                            value: comphistoryArr[i].processGroup,
                            ignoreFieldChange: false,
                            forceSyncSourcing: true
                        });

                        empcomprec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_cde_payroll_component',
                            value: comphistoryArr[i].payrollComponent,
                            ignoreFieldChange: false
                        });

                        empcomprec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_cde_monthly',
                            value: comphistoryArr[i].monthlyAmount || 0,
                            ignoreFieldChange: true
                        });

                        empcomprec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_cde_annually',
                            value: comphistoryArr[i].annuallyAmount || 0,
                            ignoreFieldChange: true
                        });

                        empcomprec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_cde_payroll_seqno',
                            value: comphistoryArr[i].payrollSeqNo || '',
                            ignoreFieldChange: true
                        });
                         empcomprec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_cde_employee_name',
                            value: comphistoryArr[i].employeeid || '',
                            ignoreFieldChange: true,
                          // forceSyncSourcing: true
                        });
                         empcomprec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_cde_subsidiary',
                            value: comphistoryArr[i].subsidiary || '',
                            ignoreFieldChange: true
                        });
                         empcomprec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_compensationearing_dep_n',
                            value: comphistoryArr[i].department || '',
                            ignoreFieldChange: true
                        });

                        empcomprec.commitLine({
                            sublistId: 'recmachcustrecord_hris_employee_data_change'
                        });

                        compFound = true;
                        break;
                    }
                }

                if (!compFound) {
                    log.debug("No Matching Component Found, Creating New Line", comphistoryArr[i].payrollComponent);

                    empcomprec.selectNewLine({
                        sublistId: 'recmachcustrecord_hris_employee_data_change'
                    });

                    empcomprec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_hris_employee_data_change',
                        fieldId: 'custrecord_hris_cde_process_group',
                        value: comphistoryArr[i].processGroup,
                        ignoreFieldChange: false,
                        forceSyncSourcing: true
                    });

                    empcomprec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_hris_employee_data_change',
                        fieldId: 'custrecord_hris_cde_payroll_component',
                        value: comphistoryArr[i].payrollComponent,
                        ignoreFieldChange: true
                    });

                    empcomprec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_hris_employee_data_change',
                        fieldId: 'custrecord_hris_cde_annually',
                        value: comphistoryArr[i].annuallyAmount || '',
                        ignoreFieldChange: true
                    });

                    empcomprec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_hris_employee_data_change',
                        fieldId: 'custrecord_hris_cde_monthly',
                        value: comphistoryArr[i].monthlyAmount || '',
                        ignoreFieldChange: true
                    });

                    empcomprec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_hris_employee_data_change',
                        fieldId: 'custrecord_hris_cde_payroll_seqno',
                        value: comphistoryArr[i].payrollSeqNo || '',
                        ignoreFieldChange: true
                    });
                     empcomprec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_cde_employee_name',
                            value: comphistoryArr[i].employeeid || '',
                            ignoreFieldChange: true,
                       //forceSyncSourcing: true
                        });
                         empcomprec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_cde_subsidiary',
                            value: comphistoryArr[i].subsidiary || '',
                            ignoreFieldChange: true
                        });
                         empcomprec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_compensationearing_dep_n',
                            value: comphistoryArr[i].department || '',
                            ignoreFieldChange: true
                        });

                    empcomprec.commitLine({
                        sublistId: 'recmachcustrecord_hris_employee_data_change'
                    });
                }
            }
            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_month_cross_sy",
                value: monthlyGrossSalary,
                ignoreFieldChange: true
            });
            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_annualgrosssly",
                value: annualGrossSalary,
                ignoreFieldChange: true
            });

            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_mon_gross",
                value: monthlyGrossSalaryInAED,
                ignoreFieldChange: true
            });
            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_an_gross_salar",
                value: annualGrossSalaryInAED,
                ignoreFieldChange: true
            });
            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_ctc",
                value: ctc,
                ignoreFieldChange: true
            });

            try {
                var savedId = empcomprec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('Record saved', savedId);
            } catch (e) {
                log.error('Error while saving the record', e.message);
            }

            if (savedId) {
                log.debug("checkingissavedId exixts");
                var checkboxcheck = record.submitFields({
                    type: "customrecord_hris_employee_compensation",
                    id: newRecordId,
                    values: {
                        "custrecord_hris_comp_chnge_check": true
                    }
                });

                log.debug("checkboxcheck", checkboxcheck);


                var updateemployee = record.submitFields({
                    type: "employee",
                    id: Empname,
                    values: {
                        "custentity_njt_monthly_gross_sal": monthlyGrossSalary,
                        'custentity_njt_annual_gross_salary': annualGrossSalary
                    }
                });

                log.debug("updateemployee", updateemployee);
            }
        }
    }
    function createCompensationchangeDetails(EmpcompChangeID, newRecordId) {
        var comphistoryrec = record.load({
            type: "customrecord_hris_employee_compensation",
            id: newRecordId,
            isDynamic: true,
        });

        var Empname = comphistoryrec.getValue({ fieldId: "custrecord_hris_employee_name_" });
        log.debug("Empname", Empname);
        var Paygroup = comphistoryrec.getValue({ fieldId: "custrecord_hris_employee_pay_process_gro" });
        var IncrmentType = comphistoryrec.getValue({ fieldId: "custrecord_hris_record_change_type" });
        log.debug("IncrmentType", IncrmentType);
        var monthlyGrossSalary = comphistoryrec.getValue({ fieldId: "custrecord_hris_monthly_gross_salary" });
        var monthlyGrossSalaryInAED = comphistoryrec.getValue({ fieldId: "custrecord_hris_monthly_gross_salary_in" });
        var annualGrossSalary = comphistoryrec.getValue({ fieldId: "custrecord_hris_annual_gross_salary" });
        var annualGrossSalaryInAED = comphistoryrec.getValue({ fieldId: "custrecord_hris_annual_gross_salary_in_b" });
        var ctc = comphistoryrec.getValue({ fieldId: "custrecord_hris_ctc" });
        var effectivedate = comphistoryrec.getValue({ fieldId: "custrecord_hris_effective_from_date" });
        var remarks = comphistoryrec.getValue({ fieldId: "custrecord_hris_remarks" });
        var checkboxforcompchangecheck = comphistoryrec.getValue({ fieldId: "custrecord_hris_comp_chnge_check" });
        log.debug("checkboxforcompchangecheck", checkboxforcompchangecheck);

        log.emergency('Compensation Fields', {
            monthlyGrossSalary: monthlyGrossSalary,
            monthlyGrossSalaryInAED: monthlyGrossSalaryInAED,
            annualGrossSalary: annualGrossSalary,
            annualGrossSalaryInAED: annualGrossSalaryInAED,
            ctc: ctc
        });
        
        var Linecount = comphistoryrec.getLineCount({ sublistId: "recmachcustrecord_hris_comhis_compenhistoryid" });
        var comphistoryArr = [];
        for (var k = 0; k < Linecount; k++) {
            var processGroup = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_processgroup",
                line: k,
            });
            var payrollComponent = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_payrollcomponent",
                line: k,
            });
            var payrollComponenttext = comphistoryrec.getSublistText({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_payrollcomponent",
                line: k,
            });
            var monthlyAmount = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_monthlyamount",
                line: k,
            });
            var annuallyAmount = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_annuallyamount",
                line: k,
            });
            var payrollSeqNo = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_payrollseqno",
                line: k,
            });
              var employeeid = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_empname",
                line: k,
            });
              var subsidiary = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_subsidi",
                line: k,
            });
              var department = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_department",
                line: k,
            });
            comphistoryArr.push({
                processGroup: processGroup,
                payrollComponent: payrollComponent,
                payrollComponentText: payrollComponenttext,
                monthlyAmount: monthlyAmount,
                annuallyAmount: annuallyAmount,
                payrollSeqNo: payrollSeqNo,
                 employeeid:employeeid,
                subsidiary:subsidiary,
                department:department
            });
            log.debug("Line " + k, {
                processGroup: processGroup,
                payrollComponent: payrollComponent,
                monthlyAmount: monthlyAmount,
                annuallyAmount: annuallyAmount,
                payrollSeqNo: payrollSeqNo,
                 employeeid:employeeid,
                subsidiary:subsidiary,
                department:department
            });
        }

        var empcomprec = record.load({
            type: "customrecord_hris_employee_compen_change",
            id: EmpcompChangeID,
            isDynamic: true
        });
        log.debug("empcomprec", empcomprec);

        empcomprec.setValue({
            fieldId: "custrecord_hris_empchange_employee_nam",
            value: Empname,
            ignoreFieldChange: false,
            forceSyncSourcing: true
        });
        empcomprec.setValue({
            fieldId: "custrecord_hris_empchange_emp_pay_pro_gp",
            value: Paygroup,
            ignoreFieldChange: true
        });
        if (effectivedate) {
            effectivedate = format.parse({
                value: effectivedate,
                type: format.Type.DATE
            });
            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_eff_from_date",
                value: effectivedate,
                ignoreFieldChange: true
            });
        }
        empcomprec.setValue({
            fieldId: "custrecord_hris_empchange_remarks",
            value: remarks,
            ignoreFieldChange: true
        });
        empcomprec.setValue({
            fieldId: "custrecord_hris_empchange_type",
            value: IncrmentType,
            ignoreFieldChange: true
        });
          var savedId = empcomprec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('Record saved', savedId);

             var empcomprec = record.load({
            type: "customrecord_hris_employee_compen_change",
            id: EmpcompChangeID,
            isDynamic: true
        });
        log.debug("empcomprec", empcomprec);     
        var Linecountcomp = empcomprec.getLineCount({ sublistId: "recmachcustrecord_hris_employee_data_change" });
        var empcompchangearr = [];

        if (Linecountcomp > 0) {
            for (var i = Linecountcomp - 1; i >= 0; i--) {
                empcomprec.removeLine({
                    sublistId: "recmachcustrecord_hris_employee_data_change",
                    line: i,
                    ignoreRecalc: true // optional, improves performance if you don't need recalculation
                });
            }
        }
        var EmpCompensationdetailSQL =
            "SELECT id,custrecord_hris_employee_data_change  FROM customrecord_hris_compensation_details_e WHERE custrecord_hris_employee_data_change= " + EmpcompChangeID;

        var resultSet = query.runSuiteQL({ query: EmpCompensationdetailSQL });
        var tsResult = resultSet.asMappedResults();

        if (tsResult.length > 0 && tsResult[0].id) {
            for (var t = 0; t < tsResult.length; t++){
                var EmpcompEarningID = tsResult[t].id;
            log.debug("EmpcompEarningID", EmpcompEarningID);
            var featureRecord = record.delete({
                type: 'customrecord_hris_compensation_details_e',
                id: EmpcompEarningID,
            });
        }

        }




        if (checkboxforcompchangecheck == false) {
            log.debug("Starting Line Comparison", {
                comphistoryArr: comphistoryArr,
                empcompchangearr: empcompchangearr
            });



            for (var i = 0; i < comphistoryArr.length; i++) {
                var compFound = false;


                empcomprec.selectNewLine({
                    sublistId: 'recmachcustrecord_hris_employee_data_change'
                });

                empcomprec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_process_group',
                    value: comphistoryArr[i].processGroup,
                    ignoreFieldChange: false,
                    forceSyncSourcing: true
                });

                empcomprec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_payroll_component',
                    value: comphistoryArr[i].payrollComponent,
                    ignoreFieldChange: false,
                    forceSyncSourcing: true
                });

                empcomprec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_annually',
                    value: comphistoryArr[i].annuallyAmount || '',
                    ignoreFieldChange: true
                });

                empcomprec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_monthly',
                    value: comphistoryArr[i].monthlyAmount || '',
                    ignoreFieldChange: true
                });

                empcomprec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_payroll_seqno',
                    value: comphistoryArr[i].payrollSeqNo || '',
                    ignoreFieldChange: true
                });

                 empcomprec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_cde_employee_name',
                            value: comphistoryArr[i].employeeid || '',
                            ignoreFieldChange: true,
                            // forceSyncSourcing: true
                        });
                         empcomprec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_cde_subsidiary',
                            value: comphistoryArr[i].subsidiary || '',
                            ignoreFieldChange: true
                        });
                         empcomprec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_compensationearing_dep_n',
                            value: comphistoryArr[i].department || '',
                            ignoreFieldChange: true
                        });
                empcomprec.commitLine({
                    sublistId: 'recmachcustrecord_hris_employee_data_change'
                });

            }
            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_month_cross_sy",
                value: monthlyGrossSalary,
                ignoreFieldChange: true
            });
            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_annualgrosssly",
                value: annualGrossSalary,
                ignoreFieldChange: true
            });

            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_mon_gross",
                value: monthlyGrossSalaryInAED,
                ignoreFieldChange: true
            });
            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_an_gross_salar",
                value: annualGrossSalaryInAED,
                ignoreFieldChange: true
            });
            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_ctc",
                value: ctc,
                ignoreFieldChange: true
            });

            try {
                var savedId = empcomprec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('Record saved', savedId);
            } catch (e) {
                log.error('Error while saving the record', e.message);
            }

            if (savedId) {
                log.debug("checkingissavedId exixts");
                var checkboxcheck = record.submitFields({
                    type: "customrecord_hris_employee_compensation",
                    id: newRecordId,
                    values: {
                        "custrecord_hris_comp_chnge_check": true
                    }
                });

                log.debug("checkboxcheck", checkboxcheck);


                var updateemployee = record.submitFields({
                    type: "employee",
                    id: Empname,
                    values: {
                        "custentity_njt_monthly_gross_sal": monthlyGrossSalary,
                        'custentity_njt_annual_gross_salary': annualGrossSalary
                    }
                });

                log.debug("updateemployee", updateemployee);
            }
        }
    }
    function createemployeecompensationchange(
        newRecordId,
        EmpcompChangeID
    ) {
        var comphistoryrec = record.load({
            type: "customrecord_hris_employee_compensation",
            id: newRecordId,
            isDynamic: true,
        });
        var Empname = comphistoryrec.getValue({
            fieldId: "custrecord_hris_employee_name_"
        });
        log.debug("Empname", Empname);
        var Paygroup = comphistoryrec.getValue({
            fieldId: "custrecord_hris_employee_pay_process_gro"
        });

        var IncrmentType = comphistoryrec.getValue({
            fieldId: "custrecord_hris_record_change_type"
        });
        log.debug("IncrmentType", IncrmentType);


        var monthlyGrossSalary = comphistoryrec.getValue({
            fieldId: "custrecord_hris_monthly_gross_salary"
        });

        var monthlyGrossSalaryInAED = comphistoryrec.getValue({
            fieldId: "custrecord_hris_monthly_gross_salary_in"
        });

        var annualGrossSalary = comphistoryrec.getValue({
            fieldId: "custrecord_hris_annual_gross_salary"
        });

        var annualGrossSalaryInAED = comphistoryrec.getValue({
            fieldId: "custrecord_hris_annual_gross_salary_in_b"
        });

        var ctc = comphistoryrec.getValue({
            fieldId: "custrecord_hris_ctc"
        });
        var effectivedate = comphistoryrec.getValue({
            fieldId: "custrecord_hris_effective_from_date"
        });
        var remarks = comphistoryrec.getValue({
            fieldId: "custrecord_hris_remarks"
        });

        // Optional: log for debugging
        log.emergency('Compensation Fields', {
            monthlyGrossSalary: monthlyGrossSalary,
            monthlyGrossSalaryInAED: monthlyGrossSalaryInAED,
            annualGrossSalary: annualGrossSalary,
            annualGrossSalaryInAED: annualGrossSalaryInAED,
            ctc: ctc
        });



        var Linecount = comphistoryrec.getLineCount({
            sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
        });
        var comphistoryArrForNew = [];
        for (var k = 0; k < Linecount; k++) {
            var processGroup = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_processgroup",
                line: k,
            });

            var payrollComponent = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_payrollcomponent",
                line: k,
            });
            var payrollComponenttext = comphistoryrec.getSublistText({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_payrollcomponent",
                line: k,
            });

            var monthlyAmount = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_monthlyamount",
                line: k,
            });

            var annuallyAmount = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_annuallyamount",
                line: k,
            });

            var payrollSeqNo = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_payrollseqno",
                line: k,
            });

              var employeeid = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_empname",
                line: k,
            });
              var subsidiary = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_subsidi",
                line: k,
            });
              var department = comphistoryrec.getSublistValue({
                sublistId: "recmachcustrecord_hris_comhis_compenhistoryid",
                fieldId: "custrecord_hris_comhis_department",
                line: k,
              });
            // Push into array
            comphistoryArrForNew.push({
                processGroup: processGroup,
                payrollComponent: payrollComponent,
                payrollComponentText: payrollComponenttext,
                monthlyAmount: monthlyAmount,
                annuallyAmount: annuallyAmount,
                payrollSeqNo: payrollSeqNo,
                   employeeid:employeeid,
                subsidiary:subsidiary,
                department:department
            });
            log.debug("Linecreate " + k, {
                processGroup: processGroup,
                payrollComponent: payrollComponent,
                monthlyAmount: monthlyAmount,
                annuallyAmount: annuallyAmount,
                payrollSeqNo: payrollSeqNo,
                   employeeid:employeeid,
                subsidiary:subsidiary,
                department:department
            });
        }
        //         //   create new empcompensation chag record
        try {
            log.debug("trycheck");
            var empcomprec = record.create({
                type: "customrecord_hris_employee_compen_change",
                isDynamic: true
            });

            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_employee_nam",
                value: Empname,
                ignoreFieldChange: false,
                forceSyncSourcing: true
            });
            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_emp_pay_pro_gp",
                value: Paygroup,
                ignoreFieldChange: true
            });

            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_type",
                value: IncrmentType,
                ignoreFieldChange: true
            });
            if (effectivedate) {
                effectivedate = format.parse({
                    value: effectivedate,
                    type: format.Type.DATE
                });
                empcomprec.setValue({
                    fieldId: "custrecord_hris_empchange_eff_from_date",
                    value: effectivedate,
                    ignoreFieldChange: true
                });
            }
            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_remarks",
                value: remarks,
                ignoreFieldChange: true
            });
            // empcomprec.setValue({
            // fieldId:"custrecord_hris_empchange_annualgrosssly",
            // value:annualGrossSalary,
            // ignoreFieldChange:true
            // });

            // empcomprec.setValue({
            // fieldId:"custrecord_hris_empchange_mon_gross",
            // value:monthlyGrossSalaryInAED,
            // ignoreFieldChange:true
            // });
            // empcomprec.setValue({
            // fieldId:"custrecord_hris_empchange_an_gross_salar",
            // value:annualGrossSalaryInAED,
            // ignoreFieldChange:true
            // });
            // empcomprec.setValue({
            // fieldId:"custrecord_hris_empchange_ctc",
            // value:ctc,
            // ignoreFieldChange:true
            // });
            for (var y = 0; y < comphistoryArrForNew.length; y++) {
                empcomprec.selectNewLine({
                    sublistId: 'recmachcustrecord_hris_employee_data_change'
                });
                empcomprec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_process_group',
                    value: comphistoryArrForNew[y].processGroup,
                    ignoreFieldChange: true
                });

                empcomprec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_payroll_component',
                    value: comphistoryArrForNew[y].payrollComponent,

                    ignoreFieldChange: false
                });

                empcomprec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_annually',
                    value: comphistoryArrForNew[y].annuallyAmount,

                    ignoreFieldChange: true
                });
              empcomprec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_payroll_component_seq_no',
                    value: comphistoryArrForNew[y].payrollSeqNo || '',

                    ignoreFieldChange: true
                });

                empcomprec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_monthly',
                    value: comphistoryArrForNew[y].monthlyAmount,

                    ignoreFieldChange: false
                });

                
                 empcomprec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_cde_employee_name',
                            value:comphistoryArrForNew[y].employeeid || '',
                            ignoreFieldChange: false
                        });
                         empcomprec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_cde_subsidiary',
                            value: comphistoryArrForNew[y].subsidiary || '',
                            ignoreFieldChange: true
                        });
                         empcomprec.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_compensationearing_dep_n',
                            value:comphistoryArrForNew[y].department || '',
                            ignoreFieldChange: true
                        });

                empcomprec.commitLine({
                    sublistId: 'recmachcustrecord_hris_employee_data_change'
                });
            }

            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_month_cross_sy",
                value: monthlyGrossSalary,
                ignoreFieldChange: true
            });
            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_annualgrosssly",
                value: annualGrossSalary,
                ignoreFieldChange: true
            });

            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_mon_gross",
                value: monthlyGrossSalaryInAED,
                ignoreFieldChange: true
            });
            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_an_gross_salar",
                value: annualGrossSalaryInAED,
                ignoreFieldChange: true
            });
            empcomprec.setValue({
                fieldId: "custrecord_hris_empchange_ctc",
                value: ctc,
                ignoreFieldChange: true
            });

            var savedIdfornew = empcomprec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true,
                forceSyncSourcing: true,
                ignoreFieldChange: true
            });
            // log.debug('Saved Successfully', savedIdfornew); 
            log.debug("Saved without sublist", savedIdfornew);

            if (savedIdfornew) {
                log.debug("checkingissavedId exixts");
                var checkboxcheck = record.submitFields({
                    type: "customrecord_hris_employee_compensation",
                    id: newRecordId,
                    values: {
                        "custrecord_hris_comp_chnge_check": true
                    }
                });
                log.debug("checkboxcheck", checkboxcheck);
                var updateemployee = record.submitFields({
                    type: "employee",
                    id: Empname,
                    values: {
                        "custentity_njt_monthly_gross_sal": monthlyGrossSalary,
                        'custentity_njt_annual_gross_salary': annualGrossSalary
                    }
                });

                log.debug("updateemployee", updateemployee);
            }
        } catch (e) {
            log.error("Error saving Employee Compensation Change", {
                message: e.message,
                stack: e.stack
            });

        }




    }
    return {

        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit,
        // beforeLoad: beforeLoad
    };
});
