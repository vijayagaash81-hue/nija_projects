/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord'], function(url, currentRecord) {
    
    function pageInit(context) {
        // Required entry point for Client Scripts, can remain empty
    }

    function printPackingList() {
        // 1. Get the current Record ID
        var recId = currentRecord.get().id;

        if (recId) {
            // 2. Generate the Suitelet URL
            // IMPORTANT: Replace 'customscript_YOUR_SUITELET_ID' and 'customdeploy_YOUR_DEPLOYMENT_ID'
            // with the actual IDs of your deployed Suitelet script.
            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript550',
                deploymentId: 'customdeploy1',
                params: {
                    recId: recId
                }
            });

            // 3. Open the PDF in a new tab
            window.open(suiteletUrl, '_blank');
        }
    }

    return {
        pageInit: pageInit,
        printPackingList: printPackingList
    };
});