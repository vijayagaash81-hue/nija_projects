/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * 
 * Module Description: Automatically assigns and re-indexes line serial numbers in the sales order item sublist.
 */
define(['N/currentRecord'], (currentRecord) => {

    // Semaphore flag to prevent recursive updates when modifying sublist lines programmatically
    let isRecalculating = false;

    /**
     * Helper function to recalculate and update serial numbers for all lines in the item sublist.
     * Only updates lines where the serial number does not match the 1-based index to optimize performance.
     * 
     * @param {Record} rec - The active currentRecord instance
     */
    function recalculateSerials(rec) {
        if (isRecalculating) return;
        isRecalculating = true;
        try {
            const sublistId = 'item';
            const fieldId = 'custcol_njt_serial_no';
            const lineCount = rec.getLineCount({ sublistId: sublistId });
            
            for (let i = 0; i < lineCount; i++) {
                const currentSerial = parseInt(rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: fieldId,
                    line: i
                }), 10);
                const expectedSerial = i + 1;
                
                // Only select and commit if there is a mismatch to avoid triggering unnecessary validations
                if (isNaN(currentSerial) || currentSerial !== expectedSerial) {
                    rec.selectLine({ sublistId: sublistId, line: i });
                    rec.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: fieldId,
                        value: expectedSerial,
                        ignoreFieldChange: true
                    });
                    rec.commitLine({ sublistId: sublistId });
                }
            }
        } catch (e) {
            console.error('Error recalculating serial numbers:', e);
        } finally {
            isRecalculating = false;
        }
    }

    /**
     * Page Init function required by ClientScript script type.
     * 
     * @param {Object} context
     * @param {Record} context.currentRecord - The current record
     * @param {string} context.mode - The mode the record is open in
     */
    function pageInit(context) {
        // No action needed on initialization
    }

    /**
     * Validation function when a line is committed (added or updated).
     * Automatically sets the serial number on the current line and schedules recalculation for other lines.
     * 
     * @param {Object} context
     * @param {Record} context.currentRecord - The current record
     * @param {string} context.sublistId - The sublist ID being changed
     * @returns {boolean} True if the line commit should proceed
     */
    function validateLine(context) {
        if (context.sublistId !== 'item') return true;
        if (isRecalculating) return true;

        const rec = context.currentRecord;
        const currentLine = rec.getCurrentSublistIndex({ sublistId: 'item' });
        
        // Directly update the serial number on the line being validated to avoid selecting it again
        rec.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: 'custcol_njt_serial_no',
            value: currentLine + 1,
            ignoreFieldChange: true
        });

        // Defer recalculation to let this line finish committing first
        setTimeout(() => {
            const activeRec = currentRecord.get();
            recalculateSerials(activeRec);
        }, 100);

        return true;
    }

    /**
     * Validation function when a line is deleted.
     * Schedules recalculation for the remaining lines after the deletion is finalized.
     * 
     * @param {Object} context
     * @param {Record} context.currentRecord - The current record
     * @param {string} context.sublistId - The sublist ID being changed
     * @returns {boolean} True if the line deletion should proceed
     */
    function validateDelete(context) {
        if (context.sublistId !== 'item') return true;
        if (isRecalculating) return true;

        const rec = context.currentRecord;

        // Defer recalculation so it runs after the line is actually removed and indices shift
        setTimeout(() => {
            const activeRec = currentRecord.get();
            recalculateSerials(activeRec);
        }, 100);

        return true;
    }

    return {
        pageInit: pageInit,
        validateLine: validateLine,
        validateDelete: validateDelete
    };
});
