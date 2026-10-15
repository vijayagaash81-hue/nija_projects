/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * 
 * Script Name: sjs_picklist_print_cs.js
 * Description: Client script to handle the "Print Pick List" button action on target records.
 */
define(['N/currentRecord', 'N/url', 'N/log'], (currentrecord, url, log) => {

    /**
     * Entry point required by NetSuite ClientScript specification
     * @param {Object} context 
     */
    const pageInit = (context) => {
        // Initialization code if needed
    };

    /**
     * Function triggered by custom "Print Pick List" button on the record view.
     */
    const printPickList = () => {
        try {
            const currentRec = currentrecord.get();
            const recordId = currentRec.id;
            const recordType = currentRec.type || 'workorder';

            if (!recordId) {
                alert('Please save the record before printing the Pick List.');
                return;
            }

            // Resolve the Suitelet URL
            const suiteletURL = url.resolveScript({
                scriptId: 'customscript_sjs_picklist_print_sl',
                deploymentId: 'customdeploy_sjs_picklist_print_sl',
                params: {
                    customRecordId: recordId,
                    recordType: recordType
                }
            });

            // Open PDF in a new window/tab
            window.open(suiteletURL, '_blank');

        } catch (e) {
            log.error('Error in printPickList action', e);
            alert(`An error occurred while attempting to print the Pick List: ${e.message}`);
        }
    };

    return {
        pageInit: pageInit,
        printPickList: printPickList
    };
});
