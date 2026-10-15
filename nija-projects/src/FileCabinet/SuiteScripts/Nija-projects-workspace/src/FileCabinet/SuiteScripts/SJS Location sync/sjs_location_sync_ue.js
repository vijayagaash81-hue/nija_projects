/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Script Name: SJS Location Sync UE
 * Description: User Event Script to enforce header/body Location on all sublist lines (Item & Expense) 
 *              prior to saving the record (handles new lines, deleted lines, CSV imports, and backend updates).
 */
define(['N/log'], (log) => {

    // List of sublists to synchronize location
    const SUBLISTS = ['item', 'expense'];

    /**
     * Function executed before record is submitted to database.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record state
     * @param {Record} scriptContext.oldRecord - Old record state
     * @param {string} scriptContext.type - Event type (create, edit, delete, etc.)
     */
    const beforeSubmit = (scriptContext) => {
        try {
            // Ignore delete event
            if (scriptContext.type === scriptContext.UserEventType.DELETE) {
                return;
            }

            const newRecord = scriptContext.newRecord;
            const headerLocation = newRecord.getValue({ fieldId: 'location' });

            log.debug('UE BeforeSubmit SJS Location Sync', `Record Type: ${newRecord.type}, Event Type: ${scriptContext.type}, Body Location: ${headerLocation}`);

            if (!headerLocation) {
                log.debug('Location Sync Skipped', 'Body location field is empty.');
                return;
            }

            SUBLISTS.forEach((sublistId) => {
                try {
                    const lineCount = newRecord.getLineCount({ sublistId: sublistId });

                    if (lineCount > 0) {
                        for (let i = 0; i < lineCount; i++) {
                            const currentLineLocation = newRecord.getSublistValue({
                                sublistId: sublistId,
                                fieldId: 'location',
                                line: i
                            });

                            if (currentLineLocation !== headerLocation) {
                                newRecord.setSublistValue({
                                    sublistId: sublistId,
                                    fieldId: 'location',
                                    line: i,
                                    value: headerLocation
                                });

                                log.debug('Line Location Synchronized', `Sublist: ${sublistId}, Line: ${i}, Location Set: ${headerLocation}`);
                            }
                        }
                    }
                } catch (sublistError) {
                    // Sublist might not exist on this specific record type
                    log.debug(`Sublist ${sublistId} not applicable or not found`, sublistError.message);
                }
            });

        } catch (e) {
            log.error('Error in beforeSubmit Location Sync', e);
        }
    };

    return {
        beforeSubmit: beforeSubmit
    };

});
