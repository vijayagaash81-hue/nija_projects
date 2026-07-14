/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/ui/serverWidget', 'N/search'], function (record, serverWidget, search) {
    function beforeLoad(scriptContext) {
        var form = scriptContext.form;
        var recordObj = scriptContext.newRecord;
        var form = scriptContext.form;
        var type = scriptContext.type;
        log.debug("Type", type);
        var approvalStatus = recordObj.getValue('custrecord_hris_fin_approva');
        var uploadcheck = recordObj.getValue('custrecord_hris_fin_data_upload');
        log.emergency('uploadcheck', uploadcheck);

        log.debug("approvalStatus", approvalStatus);
        var jeno = recordObj.getValue('custrecord_hris_fin_jo_no') || '';
        log.debug('jeno', jeno);
        // var currentRecordObj = scriptContext.newRecord;
        //if ((scriptContext.type == 'create' || scriptContext.type == 'edit') && approvalStatus ==1 && uploadcheck==false) {
        if ((scriptContext.type == 'create') && approvalStatus == 1 && uploadcheck == false) {
            //if (scriptContext.type == 'view'){
            form.addButton({
                id: 'custpage_invoice',
                label: 'Load Details',
                functionName: 'leavesalary()'
            });
        }
        else if (scriptContext.type == 'view' && approvalStatus == 2 && jeno == '' && uploadcheck == false) {


            form.addButton({
                id: 'custpage_jvcreation',
                label: 'Post JV',
                functionName: 'jvcreation()'
            });
        }
        form.clientScriptModulePath = './Leave Final settlement validation cs.js';




    }

    function beforeSubmit(scriptContext) {
        if (scriptContext.type === scriptContext.UserEventType.CREATE) {
            var currentRecord = scriptContext.newRecord;

            var s_auto_prfix = "";
            var recordType = currentRecord.type.toLowerCase();

            if (recordType === "customrecord_hris_finasettlement_process") {
                s_auto_prfix = "FS";
            }

            var i_rec_type_id = currentRecord.getValue({
                fieldId: "rectype",
            });

            var customrecord_hris_unique_reference_numbeSearchObj = search.create({
                type: "customrecord_hris_unique_reference_numbe",
                filters: [
                    ["custrecord_hris_record_type", "anyof", i_rec_type_id],
                    "AND",
                    ["isinactive", "is", "F"],
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_hris_unique_number",
                        label: "Unique Number",
                    }),
                    search.createColumn({ name: "internalid", label: "Internal ID" }),
                ],
            });

            var searchResultCount =
                customrecord_hris_unique_reference_numbeSearchObj.runPaged().count;

            if (searchResultCount > 0) {
                customrecord_hris_unique_reference_numbeSearchObj
                    .run()
                    .each(function (result) {
                        var i_id_unique_ref = result.getValue({ name: "internalid" });
                        var i_unique_num = result.getValue({
                            name: "custrecord_hris_unique_number",
                        });

                        i_unique_num = parseInt(i_unique_num) + 1;

                        var zeros = "";
                        if (i_unique_num.toString().length == 1) {
                            zeros = "00";
                        }
                        if (i_unique_num.toString().length == 2) {
                            zeros = "0";
                        }
                        // if (i_unique_num.toString().length == 3) { zeros = '0'; }
                        // if (i_unique_num.toString().length == 4) { zeros = '0'; }

                        // log.debug('Internal No :', prefix1 + '-' + prefix2 + '-' + shortYear + '-' + zeros + docno);
                        var refnumber = zeros + i_unique_num;
                        log.debug("refnumber", refnumber);
                        var d_current_date = new Date();
                        var i_fullYear = d_current_date.getFullYear();

                        // var s_name = "";
                        var s_auto_number =
                            s_auto_prfix + "-" + "NO" + "-" + refnumber + "-" + i_fullYear;

                        currentRecord.setValue({
                            fieldId: "name",
                            value: s_auto_number,
                        });
                        record.submitFields({
                            type: "customrecord_hris_unique_reference_numbe",
                            id: i_id_unique_ref,
                            values: {
                                custrecord_hris_unique_number: i_unique_num,
                            },
                        });

                        // currentRecord.setValue({
                        //   fieldId: "name",
                        //   value: s_unique_ref_num,
                        // });

                        return true;
                    });
            }
        }
        else {
            var recordObj = scriptContext.newRecord;
            var conformSet = recordObj.getValue('custrecord_hris_fin_confirm_settlement');
            var approvalStatus = recordObj.getValue('custrecord_hris_fin_approva');
            var jeno = recordObj.getValue('custrecord_hris_fin_jo_no') || '';
            var uploadcheck = recordObj.getValue('custrecord_hris_fin_data_upload');
            log.emergency('uploadcheck', uploadcheck)

            if (approvalStatus == 2 && conformSet == true && jeno != '' && uploadcheck == false) {
                // Get the employee ID from the record
                var employeeId = recordObj.getValue('custrecordhris_fin_emplo_name'); // Replace with the actual field ID that stores the employee ID

                if (employeeId) {
                    try {
                        // Load the employee record
                        var employeeRecord = record.load({
                            type: record.Type.EMPLOYEE, // Specify the record type
                            id: employeeId, // Employee record ID
                            isDynamic: false // Load the record in standard mode
                        });

                        // Set the 'isinactive' field to true
                        employeeRecord.setValue({
                            fieldId: 'isinactive',
                            value: true
                        });

                        // Save the changes
                        employeeRecord.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });

                        log.debug('Employee Updated', 'Employee ID ' + employeeId + ' is now inactive.');
                    } catch (error) {
                        log.error('Error Updating Employee', error.message);
                    }
                } else {
                    log.error('Employee ID Missing', 'No employee ID found in the record.');
                }
            }

            var sublistcount = recordObj.getLineCount({
                sublistId: 'recmachcustrecord_njt_fin_loan_set_link'
            });
            log.debug("sublistcount", sublistcount);


            var totalloanamount = 0;

            for (var i = 0; i < sublistcount; i++) {

                /*  newRecordObj.selectLine({
                   sublistId: 'recmachcustrecord_njt_fin_loan_set_link',
                   line: i
                 }); */
                var loanid = recordObj.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_fin_loan_set_link',
                    fieldId: 'custrecord_njt_fin_set_loan_rec',
                    line: i,

                });
                var paidamount = recordObj.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_fin_loan_set_link',
                    fieldId: 'custrecord_njt_fin_sett_paid_amt',
                    line: i,

                }) || 0;
                var outstandingamt = recordObj.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_fin_loan_set_link',
                    fieldId: 'custrecord_njt_fin_sett_outstand_amt',
                    line: i,

                }) || 0;
                var amounttobepaid = recordObj.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_fin_loan_set_link',
                    fieldId: 'custrecord_njt_fin_settl_amt_paid',
                    line: i,

                }) || 0;
                var updatedloanid = record.submitFields({
                    type: 'customrecord_hris_empchange_loan_applicn',
                    id: loanid,
                    values: {
                        'custrecord_hris_loan_paid_amount': parseFloat(paidamount) + parseFloat(amounttobepaid),
                        'custrecord_hris_loan_outstanding_amount': parseFloat(outstandingamt) - parseFloat(amounttobepaid),
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
                log.debug('Updated Loanid', updatedloanid);
                /*  newRecordObj.commitLine({
                   sublistId: 'recmachcustrecord_njt_fin_loan_set_link'
                 }); */
            }

        }
    }
    function afterSubmit(scriptContext) {
        var recordObj = scriptContext.newRecord;
        var recId = recordObj.id;
        var uploadcheck = recordObj.getValue('custrecord_hris_fin_data_upload');
        log.emergency('uploadcheck', uploadcheck)

        /********************  CREATE SECTION  ********************/
        if (scriptContext.type === scriptContext.UserEventType.CREATE) {

            var s_auto_prfix = "";
            var recordType = recordObj.type.toLowerCase();

            if (recordType === "customrecord_hris_finasettlement_process") {
                s_auto_prfix = "FS";
            }

            var i_rec_type_id = recordObj.getValue({ fieldId: "rectype" });

            var uniqueNumSearch = search.create({
                type: "customrecord_hris_unique_reference_numbe",
                filters: [
                    ["custrecord_hris_record_type", "anyof", i_rec_type_id],
                    "AND",
                    ["isinactive", "is", "F"],
                ],
                columns: [
                    search.createColumn({ name: "custrecord_hris_unique_number" }),
                    search.createColumn({ name: "internalid" }),
                ],
            });

            var count = uniqueNumSearch.runPaged().count;

            if (count > 0) {
                uniqueNumSearch.run().each(function (result) {

                    var uniqueId = result.getValue("internalid");
                    var uniqueNum = parseInt(result.getValue("custrecord_hris_unique_number")) + 1;

                    var zeros = "";
                    if (uniqueNum.toString().length === 1) zeros = "00";
                    if (uniqueNum.toString().length === 2) zeros = "0";

                    var refnumber = zeros + uniqueNum;
                    var year = new Date().getFullYear();

                    var autoNumber = s_auto_prfix + "-NO-" + refnumber + "-" + year;

                    // Now update FS record name using submitFields because afterSubmit
                    record.submitFields({
                        type: recordObj.type,
                        id: recId,
                        values: { name: autoNumber }
                    });

                    // Update unique number
                    record.submitFields({
                        type: "customrecord_hris_unique_reference_numbe",
                        id: uniqueId,
                        values: { custrecord_hris_unique_number: uniqueNum }
                    });

                    return true;
                });
            }
        }

        /********************  EDIT SECTION  ********************/
        if (scriptContext.type === scriptContext.UserEventType.EDIT && uploadcheck == false) {

            var conformSet = recordObj.getValue('custrecord_hris_fin_confirm_settlement');
            var approvalStatus = recordObj.getValue('custrecord_hris_fin_approva');
            var jeno = recordObj.getValue('custrecord_hris_fin_jo_no') || '';

            /********* 1. Mark employee inactive *********/
            if (approvalStatus == 2 && conformSet === true && jeno != '') {

                var employeeId = recordObj.getValue('custrecordhris_fin_emplo_name');

                if (employeeId) {
                    try {
                        record.submitFields({
                            type: record.Type.EMPLOYEE,
                            id: employeeId,
                            values: { isinactive: true },
                            options: {
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            }
                        });

                        log.debug('Employee Updated', 'Employee ID ' + employeeId + ' is now inactive.');

                    } catch (e) {
                        log.error('Error Updating Employee', e.message);
                    }
                }
            }

            /********* 2. Update Loan Sublist Records *********/
            var sublistcount = recordObj.getLineCount({
                sublistId: 'recmachcustrecord_njt_fin_loan_set_link'
            });

            for (var i = 0; i < sublistcount; i++) {

                var loanid = recordObj.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_fin_loan_set_link',
                    fieldId: 'custrecord_njt_fin_set_loan_rec',
                    line: i
                });

                var paidamount = recordObj.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_fin_loan_set_link',
                    fieldId: 'custrecord_njt_fin_sett_paid_amt',
                    line: i
                }) || 0;

                var outstandingamt = recordObj.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_fin_loan_set_link',
                    fieldId: 'custrecord_njt_fin_sett_outstand_amt',
                    line: i
                }) || 0;

                var amounttobepaid = recordObj.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_fin_loan_set_link',
                    fieldId: 'custrecord_njt_fin_settl_amt_paid',
                    line: i
                }) || 0;

                var updatedloanid = record.submitFields({
                    type: 'customrecord_hris_empchange_loan_applicn',
                    id: loanid,
                    values: {
                        custrecord_hris_loan_paid_amount:
                            parseFloat(paidamount) + parseFloat(amounttobepaid),

                        custrecord_hris_loan_outstanding_amount:
                            parseFloat(outstandingamt) - parseFloat(amounttobepaid)
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });

                log.debug('Updated Loan ID', updatedloanid);
            }
        }
    }

    return {
        beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
});



