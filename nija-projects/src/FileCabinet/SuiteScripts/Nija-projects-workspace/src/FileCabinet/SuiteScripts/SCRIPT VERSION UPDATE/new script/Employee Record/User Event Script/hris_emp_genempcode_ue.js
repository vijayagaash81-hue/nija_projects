/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Description User Event script to generate unique employee codes and entity ID strings before record submission.
 */
define(['N/record', 'N/search', 'N/log'], (record, search, log) => {

    /**
     * Function executed before a record is submitted to the database.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type (e.g. create, edit)
     */
    const beforeSubmit = (scriptContext) => {
        try {
            const triggerType = scriptContext.type;
            log.debug({ title: 'beforeSubmit type', details: triggerType });

            if (triggerType === scriptContext.UserEventType.CREATE) {
                const newRecord = scriptContext.newRecord;
                const customForm = newRecord.getValue({ fieldId: 'customform' });
                log.debug({ title: 'customform', details: customForm });

                if (String(customForm) === '167') {
                    const empCode = newRecord.getValue({ fieldId: 'custentity_hris_empcode' });
                    const subsidiary = newRecord.getValue({ fieldId: 'subsidiary' });
                    const empfullname = newRecord.getValue({ fieldId: 'custentity_hris_emplegalname' }) || '';

                    log.debug({
                        title: 'Field Values',
                        details: { empCode, subsidiary, empfullname }
                    });

                    if (!empCode) {
                        // Search customrecord_hris_unique_reference_numbe for unique reference configuration
                        const uniqueRefSearch = search.create({
                            type: 'customrecord_hris_unique_reference_numbe',
                            filters: [
                                ['custrecord_hris_record_type', 'anyof', '-4'],
                                'AND',
                                ['custrecord_hris_urn_subsidiary', 'anyof', subsidiary],
                                'AND',
                                ['isinactive', 'is', 'F']
                            ],
                            columns: [
                                'custrecord_hris_record_type',
                                'custrecord_hris_unique_number',
                                'custrecord_hris_employee_code_prefix'
                            ]
                        }).run().getRange({ start: 0, end: 1 });

                        if (uniqueRefSearch && uniqueRefSearch.length > 0) {
                            const refRecord = uniqueRefSearch[0];
                            const iIdUniqueRef = refRecord.id;
                            const currentUniqueNum = parseInt(refRecord.getValue({ name: 'custrecord_hris_unique_number' }), 10) || 0;
                            const nextUniqueNum = currentUniqueNum + 1;
                            const autoPrefix = refRecord.getValue({ name: 'custrecord_hris_employee_code_prefix' }) || '';

                            // Pad the unique number to 5 digits using native ES6 String.prototype.padStart
                            const formattedUniqueNumber = String(nextUniqueNum).padStart(5, '0');
                            log.debug({ title: 'formattedUniqueNumber', details: formattedUniqueNumber });

                            const empCodeWithFullname = (autoPrefix + formattedUniqueNumber + ' ' + empfullname).trim();
                            const empCodeOnly = autoPrefix + formattedUniqueNumber;

                            log.debug({
                                title: 'Generated Employee Codes',
                                details: { empCodeWithFullname, empCodeOnly }
                            });

                            newRecord.setValue({ fieldId: 'entityid', value: empCodeWithFullname });
                            newRecord.setValue({ fieldId: 'custentity_hris_empcode', value: empCodeOnly });

                            // Update the unique sequence counter in the custom record
                            record.submitFields({
                                type: 'customrecord_hris_unique_reference_numbe',
                                id: iIdUniqueRef,
                                values: {
                                    custrecord_hris_unique_number: nextUniqueNum
                                }
                            });
                        }
                    } else {
                        // If empCode already exists, concatenate with employee legal full name
                        const entityIdValue = (empCode + ' ' + empfullname).trim();
                        newRecord.setValue({ fieldId: 'entityid', value: entityIdValue });
                        log.debug({ title: 'Existing empCode EntityId', details: entityIdValue });
                    }
                }
            }
        } catch (e) {
            log.error({
                title: 'Error in beforeSubmit generate_employee_code',
                details: e.message || e
            });
        }
    };

    return {
        beforeSubmit
    };
});
