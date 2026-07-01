/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/redirect', 'N/log'], (record, search, redirect, log) => {

    /**
     * Helper to safely extract field values from search lookup results.
     */
    const extractValue = (data) => {
        if (Array.isArray(data) && data.length > 0) {
            return data[0].value;
        }
        if (typeof data === 'object' && data !== null) {
            return data.value || '';
        }
        return data || '';
    };

    /**
     * Function definition to be triggered before record is loaded.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     */
    const beforeLoad = (scriptContext) => {
        try {
            if (scriptContext.type !== scriptContext.UserEventType.VIEW) {
                return;
            }

            const currentRecord = scriptContext.newRecord;
            const form = scriptContext.form;
            const request = scriptContext.request;

            // Get standard fields from current record
            const parentWO = currentRecord.getValue({ fieldId: 'custrecord_work_order_parent' });
            const creditAccount = currentRecord.getValue({ fieldId: 'custrecordexp_account' });
            const jvRef = currentRecord.getValue({ fieldId: 'custrecord_exp_jv_ref' });
            const amount = parseFloat(currentRecord.getValue({ fieldId: 'custrecordexp_amount' })) || 0;
            const remarks = currentRecord.getValue({ fieldId: 'custrecord_exp_remarks' }) || '';
            const projectCode = currentRecord.getValue({ fieldId: 'custrecordexp_project_code' });
            const division = currentRecord.getValue({ fieldId: 'custrecordexp_division' });

            log.debug('beforeLoad Check', {
                recordId: currentRecord.id,
                parentWO,
                creditAccount,
                jvRef,
                amount
            });

            // 1. Check if we need to perform the Post JV action (query param is present)
            if (request && request.parameters.custparam_postjv === 'T') {
                log.debug('Action Triggered', 'Post JV execution started.');
                
                try {
                    // Validations
                    if (jvRef) {
                        throw new Error('A Journal Entry has already been posted/linked for this Expense Record.');
                    }
                    if (!creditAccount) {
                        throw new Error('Credit Account (custrecordexp_account) is missing on this Expense Record.');
                    }
                    if (!parentWO) {
                        throw new Error('Parent Work Order (custrecord_work_order_parent) is missing on this Expense Record.');
                    }
                    if (amount <= 0) {
                        throw new Error('Expense Amount (custrecordexp_amount) must be greater than 0 to post a Journal Entry.');
                    }

                    // Lookup Parent Work Order details
                    const woFields = search.lookupFields({
                        type: 'customrecord_njt_product_order',
                        id: parentWO,
                        columns: ['custrecord_njt_acnt', 'custrecord_njt_subsidiar']
                    });

                    const debitAccount = extractValue(woFields.custrecord_njt_acnt);
                    const subsidiary = extractValue(woFields.custrecord_njt_subsidiar);

                    log.debug('Work Order details retrieved', { debitAccount, subsidiary });

                    if (!debitAccount) {
                        throw new Error('Debit Account (custrecord_njt_acnt) is missing on the parent Work Order record.');
                    }
                    if (!subsidiary) {
                        throw new Error('Subsidiary (custrecord_njt_subsidiar) is missing on the parent Work Order record.');
                    }

                    // Create the Journal Entry record
                    const jvRec = record.create({
                        type: 'journalentry',
                        isDynamic: true
                    });

                    // Set Header Fields
                    jvRec.setValue({
                        fieldId: 'subsidiary',
                        value: subsidiary
                    });

                    jvRec.setValue({
                        fieldId: 'trandate',
                        value: new Date()
                    });

                    const jvMemo = remarks || `JV for Expense Record #${currentRecord.id}`;
                    jvRec.setValue({
                        fieldId: 'memo',
                        value: jvMemo
                    });

                    // ---- Add Debit Line ----
                    jvRec.selectNewLine({ sublistId: 'line' });
                    jvRec.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: debitAccount
                    });
                    jvRec.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'debit',
                        value: amount
                    });
                    jvRec.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'memo',
                        value: jvMemo
                    });
                    if (projectCode) {
                        jvRec.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'cseg_njt_seg_proj',
                            value: projectCode
                        });
                    }
                    if (division) {
                        jvRec.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'class',
                            value: division
                        });
                    }
                    jvRec.commitLine({ sublistId: 'line' });

                    // ---- Add Credit Line ----
                    jvRec.selectNewLine({ sublistId: 'line' });
                    jvRec.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: creditAccount
                    });
                    jvRec.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'credit',
                        value: amount
                    });
                    jvRec.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'memo',
                        value: jvMemo
                    });
                    if (projectCode) {
                        jvRec.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'cseg_njt_seg_proj',
                            value: projectCode
                        });
                    }
                    if (division) {
                        jvRec.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'class',
                            value: division
                        });
                    }
                    jvRec.commitLine({ sublistId: 'line' });

                    // Save the Journal Entry
                    const jvId = jvRec.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });

                    log.audit('Journal Entry Created', `JV ID: ${jvId} for Expense ID: ${currentRecord.id}`);

                    // Update the Expense Record with the JV Link
                    record.submitFields({
                        type: currentRecord.type,
                        id: currentRecord.id,
                        values: {
                            'custrecord_exp_jv_ref': jvId
                        },
                        options: {
                            ignoreMandatoryFields: true
                        }
                    });

                    // Redirect to the created Journal Entry
                    redirect.toRecord({
                        type: 'journalentry',
                        id: jvId
                    });
                    return;

                } catch (actionError) {
                    log.error('Post JV Action Error', actionError.toString());

                    // Display a styled warning banner at the top of the form in case of errors
                    const errorField = form.addField({
                        id: 'custpage_jv_error_banner',
                        type: 'inlinehtml',
                        label: ' '
                    });
                    errorField.defaultValue = `
                        <div style="background-color: #fef2f2; border: 1px solid #f87171; border-left: 5px solid #dc2626; padding: 15px; margin-bottom: 20px; border-radius: 4px; color: #991b1b; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px;">
                            <strong style="font-size: 16px; display: block; margin-bottom: 5px;">Failed to Post Journal Entry</strong>
                            ${actionError.message}
                        </div>
                    `;
                }
            }

            // 2. Add the Post JV button if conditions are met and JV has not been posted
            if (parentWO && creditAccount && !jvRef) {
                // Attach the client script to handle the button click action safely
                form.clientScriptModulePath = './njt_exp_post_jv_cs.js';

                form.addButton({
                    id: 'custpage_post_jv_btn',
                    label: 'Post JV',
                    functionName: 'postJvTriggered'
                });
                log.debug('Button Added', 'Post JV button added to form with Client Script attached.');
            }

        } catch (e) {
            log.error('Error in beforeLoad User Event', e.toString());
        }
    };

    return {
        beforeLoad
    };
});
