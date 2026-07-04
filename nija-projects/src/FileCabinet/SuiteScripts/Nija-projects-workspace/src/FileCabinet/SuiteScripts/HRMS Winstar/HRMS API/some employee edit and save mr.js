/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * 
 * Description: Bulk update for specific Employee IDs to trigger a save 
 * while bypassing mandatory field requirements.
 */

define(['N/record', 'N/log'], (record, log) => {

    /**
     * Stage 1: GetInputData
     * Provides the list of Internal IDs to be processed.
     */
    const getInputData = () => {
        // Updated with your specific list of IDs
        const myFinalIds = [
           101,41,118
        ];

        log.audit('Starting Process', 'Total IDs to process: ' + myFinalIds.length);
        return myFinalIds;
    };

    /**
     * Stage 2: Map
     * Runs once for every ID in the list.
     */
    const map = (context) => {
        let employeeId = context.value;

        // Safety check - skip invalid or empty IDs
        if (!employeeId || parseInt(employeeId) <= 0) {
            log.error('Skipped', `ID: ${employeeId} is not a valid Internal ID.`);
            return;
        }

        try {
            // Load the Employee record
            let empRecord = record.load({
                type: record.Type.EMPLOYEE,
                id: employeeId,
                isDynamic: true
            });

            /**
             * Save the record.
             * ignoreMandatoryFields: true allows the save even if required 
             * fields are missing on the record.
             */
            let savedId = empRecord.save({
                enableSourcing: false,
                ignoreMandatoryFields: true 
            });

            log.info('Saved Successfully', `Employee ID: ${savedId} has been updated.`);

        } catch (e) {
            log.error(`Error processing ID ${employeeId}`, e.message);
        }
    };

    /**
     * Stage 3: Summarize
     * Runs once at the end of the script.
     */
    const summarize = (summary) => {
        summary.mapSummary.errors.iterator().each((key, error) => {
            log.error(`Map Error for ID: ${key}`, error);
            return true;
        });
        log.audit('Finished', 'The bulk update process is complete.');
    };

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});