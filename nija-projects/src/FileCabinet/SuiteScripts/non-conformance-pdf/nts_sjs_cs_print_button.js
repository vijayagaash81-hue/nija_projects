/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord'], function(url, currentRecord) {
    function pageInit(context) {
        // Required entry point for Client Script, even if empty
    }

    function onPrintButtonClick() {
        try {
            var rec = currentRecord.get();
            
            // Resolve the URL for your Suitelet
            // IMPORTANT: Update scriptId and deploymentId to match your Suitelet's IDs in NetSuite
            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript_nts_sjs_suitlet', 
                deploymentId: 'customdeploy_nts_sjs_suitlet',
                params: {
                    recordId: rec.id // Pass the current record ID to the Suitelet
                }
            });

            // Open the PDF Suitelet in a new tab/window
            window.open(suiteletUrl, '_blank');
        } catch (e) {
            console.error('Error triggering Print Suitelet', e);
        }
    }
    return {
        pageInit: pageInit,
        onPrintButtonClick: onPrintButtonClick
    };
});