/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Description User event script deployed on customrecord_pay_process_status_update to sync the status to matching customrecord_hris_pay_process records.
 */
define(['N/record', 'N/search', 'N/log', 'N/ui/serverWidget', 'N/error', 'N/url'], (record, search, log, serverWidget, error, url) => {

    /**
     * Function definition to be triggered before record is loaded.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     */
    const beforeLoad = (scriptContext) => {
        const { type, form } = scriptContext;

        try {
            // Attach client script for UI-level duplicate check dialog
            if (type === scriptContext.UserEventType.CREATE || type === scriptContext.UserEventType.EDIT) {
                form.clientScriptModulePath = './hris_payprocess_status_update_cs.js';
            }

            // Execute field disabling only on Edit mode
            if (type !== scriptContext.UserEventType.EDIT) {
                return;
            }

            const fieldsToDisable = [
                'custrecord_hris_payupdate_employee',
                'custrecord_hris_payupdate_pay_month',
                'custrecord_hris_payupdate_pay_year'
            ];

            fieldsToDisable.forEach(fieldId => {
                const field = form.getField({ id: fieldId });
                if (field) {
                    field.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.DISABLED
                    });
                }
            });
        } catch (e) {
            log.error({
                title: 'Error in beforeLoad',
                details: e.toString()
            });
        }
    };

    /**
     * Function definition to be triggered before record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     */
    const beforeSubmit = (scriptContext) => {
        const { type, newRecord } = scriptContext;

        // Execute only on Create or Edit
        if (type !== scriptContext.UserEventType.CREATE && type !== scriptContext.UserEventType.EDIT) {
            return;
        }

        try {
            const employee = newRecord.getValue({ fieldId: 'custrecord_hris_payupdate_employee' });
            const payMonth = newRecord.getValue({ fieldId: 'custrecord_hris_payupdate_pay_month' });
            const payYear = newRecord.getValue({ fieldId: 'custrecord_hris_payupdate_pay_year' });

            log.debug({
                title: 'Triggered beforeSubmit',
                details: `Employee: ${employee}, Pay Month: ${payMonth}, Pay Year: ${payYear}`
            });

            if (!employee || !payMonth || !payYear) {
                return;
            }

            const filters = [
                ['custrecord_hris_payupdate_employee', 'anyof', employee],
                'and',
                ['custrecord_hris_payupdate_pay_month', 'anyof', payMonth],
                'and',
                ['custrecord_hris_payupdate_pay_year', 'anyof', payYear]
            ];

            // If editing, exclude the current record itself
            if (type === scriptContext.UserEventType.EDIT) {
                filters.push('and');
                filters.push(['internalid', 'noneof', newRecord.id]);
            }

            const duplicateSearch = search.create({
                type: 'customrecord_pay_process_status_update',
                filters: filters,
                columns: ['internalid']
            });

            const searchResults = duplicateSearch.run().getRange({ start: 0, end: 1 });

            if (searchResults && searchResults.length > 0) {
                const existingRecordId = searchResults[0].id;
                const recordUrl = url.resolveRecord({
                    recordType: 'customrecord_pay_process_status_update',
                    recordId: existingRecordId,
                    isEditMode: false
                });

                const message = `A Pay Process Status Update record already exists for this Employee, Month, and Year.\n\n` +
                                `You can view the existing record here:\n${recordUrl}`;

                throw error.create({
                    name: 'DUPLICATE_RECORD',
                    message: message,
                    notifyOff: true
                });
            }
        } catch (e) {
            if (e.name === 'DUPLICATE_RECORD') {
                throw e;
            }
            log.error({
                title: 'Error in beforeSubmit (Duplicate Check)',
                details: e.toString()
            });
        }
    };

    /**
     * Function definition to be triggered after record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     */
    const afterSubmit = (scriptContext) => {
        const { type, newRecord } = scriptContext;

        // Execute only on Create or Edit
        if (type !== scriptContext.UserEventType.CREATE && type !== scriptContext.UserEventType.EDIT) {
            return;
        }

        try {
            const employee = newRecord.getValue({ fieldId: 'custrecord_hris_payupdate_employee' });
            const payMonth = newRecord.getValue({ fieldId: 'custrecord_hris_payupdate_pay_month' });
            const payYear = newRecord.getValue({ fieldId: 'custrecord_hris_payupdate_pay_year' });
            const status = newRecord.getValue({ fieldId: 'custrecord_status_pay_process' });

            log.debug({
                title: 'Triggered afterSubmit',
                details: `Employee: ${employee}, Pay Month: ${payMonth}, Pay Year: ${payYear}, New Status: ${status}`
            });

            // Validation: Make sure key matching fields are present
            if (!employee || !payMonth || !payYear) {
                log.warn({
                    title: 'Missing Key Fields',
                    details: `Key fields missing on record ID ${newRecord.id}. Sync aborted.`
                });
                return;
            }

            // Define search on target customrecord_hris_pay_process
            const payProcessSearch = search.create({
                type: 'customrecord_hris_pay_process',
                filters: [
                    ['custrecord_hris_pay_proc_employee', 'anyof', employee],
                    'and',
                    ['custrecord_hris_pay_proc_pay_month', 'anyof', payMonth],
                    'and',
                    ['custrecord_hris_pay_proc_year', 'anyof', payYear]
                ],
                columns: ['internalid']
            });

            let updatedCount = 0;
            let errorCount = 0;

            payProcessSearch.run().each((result) => {
                const targetRecordId = result.id;
                try {
                    record.submitFields({
                        type: 'customrecord_hris_pay_process',
                        id: targetRecordId,
                        values: {
                            'custrecord_njt_status_pay_process': status
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                    updatedCount++;
                } catch (subErr) {
                    errorCount++;
                    log.error({
                        title: `Failed to update target record ID ${targetRecordId}`,
                        details: subErr.message
                    });
                }
                return true; // Continue iteration
            });

            log.audit({
                title: 'Sync Complete',
                details: `Successfully updated ${updatedCount} records. Errors: ${errorCount}.`
            });

        } catch (e) {
            log.error({
                title: 'Error in afterSubmit',
                details: e.toString()
            });
        }
    };

    return {
        beforeLoad,
        beforeSubmit,
        afterSubmit
    };
});
