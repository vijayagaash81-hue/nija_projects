/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/currentRecord', 'N/log'], function(url, currentRecord, log) {

    function pageInit(scriptContext) {
        // Initialization if needed
    }

    /**
     * Function to be called when the "Print" button is clicked
     */
    function printExitInterview() {
        try {
            var rec = currentRecord.get();
            var recordId = rec.id;

            if (!recordId) {
                alert('Please save the record first before printing.');
                return;
            }

            // Resolve the Suitelet URL
            // IMPORTANT: Update scriptId and deploymentId to match your Suitelet deployment
            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript_sl_eif_pdf', // Replace with your Suitelet Script ID
                deploymentId: 'customdeploy_sl_eif_pdf', // Replace with your Suitelet Deployment ID
                params: {
                    recId: recordId
                }
            });

            // Open the PDF in a new window
            window.open(suiteletUrl, '_blank');

        } catch (e) {
            log.error({ title: 'Error printing PDF', details: e });
            alert('An error occurred while trying to print: ' + e.message);
        }
    }

    return {
        pageInit: pageInit,
        printExitInterview: printExitInterview
    };
});
