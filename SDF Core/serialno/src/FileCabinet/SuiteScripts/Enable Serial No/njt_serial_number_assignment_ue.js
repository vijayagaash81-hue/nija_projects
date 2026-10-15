/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Script Name: Serial Number Assignment UE
 * Description: User Event script that works on CREATE and EDIT modes to dynamically assign 
 *              sequential Serial Numbers (1, 2, 3...) to sublists (or header fields) configured 
 *              in the 'customrecord_serial_no' setup record.
 */
define(['N/search', 'N/log'], (search, log) => {

    /**
     * Helper function to fetch Serial No configurations for the current record type
     * from customrecord_serial_no.
     * 
     * @param {string} recordType 
     * @returns {Array<{sublistId: string, serialNoField: string}>}
     */
    const getSerialNoConfigs = (recordType) => {
        const configs = [];
        try {
            if (!recordType) return configs;

            const serialNoSearch = search.create({
                type: 'customrecord_serial_no',
                filters: [
                    ['custrecord_record_type', 'is', recordType]
                ],
                columns: ['custrecord_sublist_id', 'custrecord_serial_no_field']
            });

            serialNoSearch.run().each(result => {
                const sublistId = result.getValue({ name: 'custrecord_sublist_id' }) || '';
                const serialNoField = result.getValue({ name: 'custrecord_serial_no_field' }) || '';

                if (serialNoField) {
                    configs.push({
                        sublistId: sublistId.trim(),
                        serialNoField: serialNoField.trim()
                    });
                }
                return true; // continue iteration
            });
        } catch (e) {
            log.error('Error in getSerialNoConfigs', e);
        }
        return configs;
    };

    /**
     * Function executed before page load. Attaches Client Script for live UI interaction.
     * @param {Object} context
     */
    const beforeLoad = (context) => {
        try {
            if (context.type !== context.UserEventType.CREATE && 
                context.type !== context.UserEventType.EDIT && 
                context.type !== context.UserEventType.COPY) {
                return;
            }

            // Attach client script module path for client-side live serial number calculation
            context.form.clientScriptModulePath = 'SuiteScripts/Enable Serial No/njt_serial_number_assignment_cs.js';

        } catch (e) {
            log.error('Error in beforeLoad', e);
        }
    };

    /**
     * Function executed before record submit (CREATE / EDIT / COPY).
     * Guarantees 1-based sequential ordering for configured sublists on server submission.
     * @param {Object} context
     */
    const beforeSubmit = (context) => {
        try {
            if (context.type !== context.UserEventType.CREATE && 
                context.type !== context.UserEventType.EDIT && 
                context.type !== context.UserEventType.COPY) {
                return;
            }

            const newRecord = context.newRecord;
            const recType = newRecord.type;
            const configs = getSerialNoConfigs(recType);

            if (!configs || configs.length === 0) {
                log.debug('beforeSubmit', `No Serial No setup found for record type: ${recType}`);
                return;
            }

            configs.forEach(config => {
                const sublistId = config.sublistId;
                const serialNoField = config.serialNoField;

                if (sublistId) {
                    // Sublist Level Assignment: 1, 2, 3... N
                    const lineCount = newRecord.getLineCount({ sublistId: sublistId });
                    for (let i = 0; i < lineCount; i++) {
                        const expectedSerial = i + 1;
                        newRecord.setSublistValue({
                            sublistId: sublistId,
                            fieldId: serialNoField,
                            line: i,
                            value: expectedSerial
                        });
                    }
                    log.debug('beforeSubmit', `Successfully assigned sequential serial numbers (1 to ${lineCount}) for sublist '${sublistId}' field '${serialNoField}' on record type '${recType}'`);
                } else {
                    // Header Level Field Assignment
                    const currentVal = newRecord.getValue({ fieldId: serialNoField });
                    if (!currentVal) {
                        newRecord.setValue({
                            fieldId: serialNoField,
                            value: 1
                        });
                        log.debug('beforeSubmit', `Assigned header serial number for field '${serialNoField}' on record type '${recType}'`);
                    }
                }
            });

        } catch (e) {
            log.error('Error in beforeSubmit', e);
        }
    };

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
    };
});
