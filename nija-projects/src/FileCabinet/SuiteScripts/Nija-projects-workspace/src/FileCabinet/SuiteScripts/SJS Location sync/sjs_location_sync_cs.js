/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * 
 * Script Name: SJS Location Sync CS
 * Description: Client Script to automatically synchronize header/body Location to all sublist lines (Item & Expense),
 *              handling field changes, line initialization, post-sourcing, line additions, and line deletions.
 */
define(['N/log'], (log) => {

    // List of sublists to synchronize location
    const SUBLISTS = ['item', 'expense'];

    /**
     * Helper function to check if a sublist exists on the record
     */
    function isSublistValid(currentRecord, sublistId) {
        try {
            const count = currentRecord.getLineCount({ sublistId: sublistId });
            return count !== -1;
        } catch (e) {
            return false;
        }
    }

    /**
     * Function to sync location across all existing sublist lines when body location changes
     */
    function syncAllSublistLines(currentRecord, sublistId, headerLocation) {
        if (!isSublistValid(currentRecord, sublistId)) return;

        const lineCount = currentRecord.getLineCount({ sublistId: sublistId });
        log.debug('Syncing Sublist Lines', `Sublist: ${sublistId}, Total Lines: ${lineCount}, Location: ${headerLocation}`);

        for (let i = 0; i < lineCount; i++) {
            try {
                currentRecord.selectLine({ sublistId: sublistId, line: i });
                const currentLineLoc = currentRecord.getCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'location'
                });

                if (currentLineLoc !== headerLocation) {
                    currentRecord.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: 'location',
                        value: headerLocation,
                        ignoreFieldChange: true
                    });
                    currentRecord.commitLine({ sublistId: sublistId });
                }
            } catch (err) {
                log.error(`Error updating line ${i} in ${sublistId}`, err);
            }
        }
    }

    /**
     * Helper function to set line location on current active line
     */
    function setLineLocationIfHeaderSet(currentRecord, sublistId) {
        try {
            const headerLocation = currentRecord.getValue({ fieldId: 'location' });
            if (!headerLocation) return;

            const currentLineLoc = currentRecord.getCurrentSublistValue({
                sublistId: sublistId,
                fieldId: 'location'
            });

            if (currentLineLoc !== headerLocation) {
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: 'location',
                    value: headerLocation,
                    ignoreFieldChange: true
                });
                log.debug('Line Location Set', `Sublist: ${sublistId}, Value: ${headerLocation}`);
            }
        } catch (e) {
            log.error(`Error setting line location for sublist ${sublistId}`, e);
        }
    }

    /**
     * Validation function to be executed when a field is changed by a user or script.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number (1-based)
     * @param {number} scriptContext.columnNum - Column number (1-based)
     */
    function fieldChanged(scriptContext) {
        try {
            const currentRecord = scriptContext.currentRecord;
            const fieldId = scriptContext.fieldId;

            // Trigger when body 'location' field changes
            if (fieldId === 'location' && !scriptContext.sublistId) {
                const headerLocation = currentRecord.getValue({ fieldId: 'location' });
                log.debug('Body Location Changed', `New Location ID: ${headerLocation}`);

                SUBLISTS.forEach((sublistId) => {
                    syncAllSublistLines(currentRecord, sublistId, headerLocation);
                });
            }
        } catch (e) {
            log.error('Error in fieldChanged', e);
        }
    }

    /**
     * Function to be executed when a field is change is completed and post-sourcing has fired.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     */
    function postSourcing(scriptContext) {
        try {
            const currentRecord = scriptContext.currentRecord;
            const sublistId = scriptContext.sublistId;

            // When item or expense category is sourced on line, preserve/enforce body location
            if (SUBLISTS.includes(sublistId)) {
                setLineLocationIfHeaderSet(currentRecord, sublistId);
            }
        } catch (e) {
            log.error('Error in postSourcing', e);
        }
    }

    /**
     * Function to be executed when a line is selected or initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     */
    function lineInit(scriptContext) {
        try {
            const currentRecord = scriptContext.currentRecord;
            const sublistId = scriptContext.sublistId;

            if (SUBLISTS.includes(sublistId)) {
                setLineLocationIfHeaderSet(currentRecord, sublistId);
            }
        } catch (e) {
            log.error('Error in lineInit', e);
        }
    }

    /**
     * Validation function to be executed when sublist line is committed (new line added or edited line saved).
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @returns {boolean} Return true if sublist line is valid
     */
    function validateLine(scriptContext) {
        try {
            const currentRecord = scriptContext.currentRecord;
            const sublistId = scriptContext.sublistId;

            if (SUBLISTS.includes(sublistId)) {
                setLineLocationIfHeaderSet(currentRecord, sublistId);
            }
        } catch (e) {
            log.error('Error in validateLine', e);
        }
        return true;
    }

    /**
     * Validation function to be executed when a sublist line is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @returns {boolean} Return true if line delete is allowed
     */
    function validateDelete(scriptContext) {
        try {
            log.debug('Line Deleted', `Sublist: ${scriptContext.sublistId}`);
            // Clean up or log validation on line removal if required
        } catch (e) {
            log.error('Error in validateDelete', e);
        }
        return true;
    }

    return {
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,
        lineInit: lineInit,
        validateLine: validateLine,
        validateDelete: validateDelete
    };

});
