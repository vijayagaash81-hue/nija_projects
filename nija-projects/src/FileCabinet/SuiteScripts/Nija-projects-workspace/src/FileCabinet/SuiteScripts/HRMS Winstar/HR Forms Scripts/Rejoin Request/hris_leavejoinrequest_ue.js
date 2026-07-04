/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/log'], 
function(record, search, log) {

    /**
     * Function to be executed after a record is submitted to the database.
     * @param {Object} context
     * @param {Record} context.newRecord - The new/updated record instance
     * @param {string} context.type - The trigger type
     */
    function afterSubmit(context) {
        // Run on create, edit, or inline edit transformations
        if (context.type !== context.UserEventType.CREATE && 
            context.type !== context.UserEventType.EDIT && 
            context.type !== context.UserEventType.XEDIT) {
            return;
        }

        try {
            // 1. Load the fields from the newly saved Rejoin Request record
            var rejoinRecord = record.load({
                type: context.newRecord.type,
                id: context.newRecord.id
            });

            var approvalStatus = rejoinRecord.getValue('custrecord_rejoin_request_aproval_status');
            var leaveAppId = rejoinRecord.getValue('custrecord_rejoin_requ_leave_application');
            var actualresumedate = rejoinRecord.getValue('custrecord_rejoin_reques_resumption_date');
            var totaldelaydays = rejoinRecord.getValue('custrecord_rejoin_reque_total_delay_days') || 0;
            var empname = rejoinRecord.getValue('custrecord_rejoin_request_employee');
            var paygroup = rejoinRecord.getValue('custrecord_rejoin_request_paygroup');
            var unpaidcreaated = rejoinRecord.getValue('custrecord_rejoin_request_unpaidcreated') || false;
            var discidocno = rejoinRecord.getValue('custrecord_rejoin_request_discimemo') || '';
            var loantype = rejoinRecord.getValue('custrecord_rejoin_request_loantype'); 
            var loancreated = rejoinRecord.getValue('custrecord_rejoin_request_loancreated') || false;          
            var issuememo = rejoinRecord.getValue('custrecord_rejoi_issue_disciplinary_memo') || false;
            var paygroup = rejoinRecord.getValue('custrecord_rejoin_request_paygroup');

            log.debug('Rejoin Details', 'Approval Status: ' + approvalStatus + ' | Leave App ID: ' + leaveAppId);

            // 2. Check if Status is Approved (2) and Leave Application exists
            if (approvalStatus == 2 && leaveAppId) {
                
                // 3. Update the fields on the Leave Application record instantly
                record.submitFields({
                    type: 'customrecord_hris_leaveapplication', 
                    id: leaveAppId,
                    values: {
                        'custrecord_hris_lve_workresume': true,
                        'custrecord_hris_lve_workresumptiondone': true,
                        'custrecord_hris_lve_actualresumedate': actualresumedate,
                        'custrecord_hris_lve_actualtotdelaydays': totaldelaydays,
                        'custrecord_hris_lve_rejoin_date': actualresumedate
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });

                log.audit('Leave Application Updated', 'Successfully updated Leave App ID: ' + leaveAppId + ' to Resumed.');

                // Parse days safely to make sure comparison handles text inputs
                totaldelaydays = parseInt(totaldelaydays, 10) || 0;

                if (totaldelaydays > 0 && unpaidcreaated === false) {
                    
                    var leave_month = '';
                    var leave_year = '';
                    var payDate = null;

                    if (actualresumedate && actualresumedate instanceof Date) {
                        leave_month = actualresumedate.getMonth() + 1; 
                        leave_year = actualresumedate.getFullYear();

                        log.debug('Extracted Date Values', 'Month: ' + leave_month + ' | Year: ' + leave_year);

                        payDate = new Date(actualresumedate.getTime());
                        payDate.setMonth(payDate.getMonth() + 1);
                        payDate.setDate(0); // Rolls back to last day of current month
                    }

                    var filter = [
                        ['custrecord_hris_ule_leave_reference_no', 'is', leaveAppId], 'AND',
                        ['custrecord_hris_ule_leave_type', 'is', 2], 'AND',                     
                        ['isinactive', 'is', 'F']
                    ];

                    var unpLeaveSearch = search.create({
                        type: 'customrecord_hris_unpaid_leave_entry',
                        filters: filter,
                        columns: ['internalid', 'custrecord_hris_ule_noof_days']
                    }).run().getRange({ start: 0, end: 1 });

                    if (!unpLeaveSearch || unpLeaveSearch.length === 0) {
                        log.debug('Inside !unpLeaveSearch Create part');
                        
                        var unpLeavRecord = record.create({
                            type: 'customrecord_hris_unpaid_leave_entry',
                            isDynamic: true
                        });
                        
                        unpLeavRecord.setValue('custrecord_hris_ule_leave_reference_no', leaveAppId);
                        unpLeavRecord.setValue('custrecord_hris_ule_employee_name', empname);
                        unpLeavRecord.setValue('custrecord_hris_ule_leave_type', 2);
                        unpLeavRecord.setValue('custrecord_hris_ule_noof_days', totaldelaydays);
                        unpLeavRecord.setValue('custrecord_hris_ule_pay_group', paygroup);
                        unpLeavRecord.setValue('custrecord_hris_ule_reason', 'This Entry is created From Rejoin Request ');
                        if (payDate) unpLeavRecord.setValue('custrecord_hris_ule_pay_date', payDate); 
                        unpLeavRecord.setValue('custrecord_hris_ule_month', leave_month);
                        
                        if (leave_year) {
                            unpLeavRecord.setText('custrecord_hris_ule_year', leave_year.toString());
                        }
                        unpLeavRecord.setValue('custrecord_hris_ule_final_days', totaldelaydays);
                        
                        var createdRecordID = unpLeavRecord.save({ ignoreMandatoryFields: true });
                        log.debug('createdRecordID unpaid success', createdRecordID);

                    } else {
                        var unpaid_id = unpLeaveSearch[0].id;
                        var updated_days = totaldelaydays;

                        record.submitFields({
                            type: 'customrecord_hris_unpaid_leave_entry',
                            id: unpaid_id,
                            values: {
                                'custrecord_hris_ule_noof_days': updated_days,
                                'custrecord_hris_ule_final_days': updated_days
                            },
                            options: { enableSourcing: false, ignoreMandatoryFields: true }
                        });
                        log.debug('updated createdRecordID unpaid structural change successful', unpaid_id);
                    }
                    rejoinRecord.setValue('custrecord_rejoin_request_unpaidcreated', true);
                }

                // Create Loan Record
                if (issuememo === true && loancreated === false) {
                    var loanamount = 0;
                    var effectivedate = '';
                    var DisciplinaryRecord = null;

                    if (discidocno) {
                        DisciplinaryRecord = record.load({
                            type: 'customrecord_disciplinary_memo',
                            id: discidocno
                        });
                        loanamount = DisciplinaryRecord.getValue('custrecord_dm_penalty_amount') || 0;
                        effectivedate = DisciplinaryRecord.getValue('custrecord_dm_effective_date');
                    }

                    var loanRecord = record.create({
                        type: 'customrecord_hris_empchange_loan_applicn',
                        isDynamic: true
                    });

                   // loanRecord.setValue('custrecord_hris_loan_emp_name', empname,false);
                    loanRecord.setValue({
                        fieldId: "custrecord_hris_loan_emp_name",
                        value: empname,
                        ignoreFieldChange: false,
                    });
                      loanRecord.setValue({
                        fieldId: "custrecord_hris_loan_process_group",
                        value: paygroup,
                        ignoreFieldChange: false,
                    });

                    loanRecord.setValue('custrecord_hris_loan_loan_type', loantype);
                    loanRecord.setValue('custrecord_hris_loan_amount', loanamount);
                    loanRecord.setValue('custrecord_hris_loan_outstanding_amount', loanamount);
                    if (effectivedate) loanRecord.setValue('custrecord_hris_loan_amount_issue_date', effectivedate);
                    loanRecord.setValue('custrecord_hris_loan_status', 1); 
                    loanRecord.setValue('custrecord_hris_loan_remarks', 'This Loan is created From Rejoin Request ');

                    // Auto-number calculation engine sequence
                    var i_rec_type_id = 523; // Auto numbering targeting configuration mapping
                    var uniqueRefSearch = search.create({
                        type: "customrecord_hris_unique_reference_numbe",
                        filters: [
                            ["custrecord_hris_record_type", "anyof", i_rec_type_id],
                            "AND",
                            ["isinactive", "is", "F"]
                        ],
                        columns: [
                            search.createColumn({ name: "custrecord_hris_unique_number" }),
                            search.createColumn({ name: "internalid" }),
                            search.createColumn({ name: "custrecord_hris_employee_code_prefix" }) // Grab prefix dynamically
                        ]
                    });

                    var searchResults = uniqueRefSearch.run().getRange({ start: 0, end: 1 });
                    var s_auto_number = '';

                    if (searchResults && searchResults.length > 0) {
                        var targetConfigRow = searchResults[0];
                        var i_id_unique_ref = targetConfigRow.getValue({ name: 'internalid' });
                        var i_unique_num = parseInt(targetConfigRow.getValue({ name: 'custrecord_hris_unique_number' }), 10) || 0;
                        var s_auto_prefix = targetConfigRow.getValue({ name: 'custrecord_hris_employee_code_prefix' }) || 'LN';

                        i_unique_num = i_unique_num + 1;
                        var i_fullYear = new Date().getFullYear();

                        if (empname) {
                            var empLookup = search.lookupFields({
                                type: search.Type.EMPLOYEE,
                                id: empname,
                                columns: ['firstname', 'custentity_hris_empfname']
                            });

                            var s_name = empLookup.firstname ? empLookup.firstname.toUpperCase() : '';
                            if (!s_name) {
                                s_name = empLookup.custentity_hris_empfname ? empLookup.custentity_hris_empfname.toUpperCase() : '';
                            }
                            
                            if (s_name) {
                                var s_emp_char = s_name.substring(0, 1);
                                var lastFour = s_name.substring(s_name.length - 3);
                                s_auto_number = s_auto_prefix + '-' + s_emp_char + lastFour + '-' + i_unique_num + '-' + i_fullYear;
                            }
                        }

                        if (!s_auto_number) {
                            s_auto_number = s_auto_prefix + '-' + i_unique_num + '-' + i_fullYear;
                        }

                        // Update back sequence value
                        record.submitFields({
                            type: 'customrecord_hris_unique_reference_numbe',
                            id: i_id_unique_ref,
                            values: {
                                'custrecord_hris_unique_number': i_unique_num
                            }
                        });
                    }

                    if (s_auto_number) {
                        loanRecord.setValue('name', s_auto_number);
                    }

                    var loanRecordID = loanRecord.save({ ignoreMandatoryFields: true });
                    log.debug('createdLoanRecordID success', loanRecordID);

                    // Update parent and linkage mappings
                    rejoinRecord.setValue('custrecord_rejoin_request_loancreated', true);
                    rejoinRecord.setValue('custrecord_rejoin_request_loanno', loanRecordID);
                    
                    var rejoinRecordID = rejoinRecord.save({ ignoreMandatoryFields: true });
                    log.debug('rejoinRecord Saved successfully', rejoinRecordID);

                    if (DisciplinaryRecord) {
                        DisciplinaryRecord.setValue('custrecord_dm_rejoinreq_done', true);
                        var DisciplinaryRecordid = DisciplinaryRecord.save({ ignoreMandatoryFields: true });
                        log.debug('Disciplinary Record Updated', DisciplinaryRecordid);
                    }
                }
            }

        } catch (e) {
            log.error('Error in Rejoin afterSubmit Process', e.message || e);
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});