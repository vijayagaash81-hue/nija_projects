/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/dialog', 'N/currentRecord', 'N/url', 'N/record'], function (dialog, currentrecord, url, record) {

    /**
     * Function executed when the page is fully loaded.
     */
    function pageInit(context) {
        // Entry point for Client Script - logic not required here for this use case.
    }

    /**
     * Function triggered by your custom "Print" button.
     * Logic: Loads the record, gets the currency, and shows a popup to select region.
     */
    function printSelectedTemplate() {
        // 1. Get the context of the current record on the screen
        var currentRecordObj = currentrecord.get();
        var recordId = currentRecordObj.id;
        var recordType = currentRecordObj.type;

        if (recordId) {
            // 2. Explicitly LOAD the record from the database to get accurate values
            var loadedRecord = record.load({
                type: recordType,
                id: recordId
            });

            // 3. Get the Text value of the currency field (e.g., "AED" or "USD")
            var currencyText = loadedRecord.getText({
                fieldId: 'currency'
            });

            // 4. Show dialog with three buttons
            dialog.create({
                title: 'Print Options',
                message: 'Please select the region format for the Tax Proforma Invoice:',
                buttons: [
                    { label: 'UAE Clients', value: 1 },
                    { label: 'OUTSIDE UAE', value: 2 },
                    { label: 'Close', value: 3 }
                ]
            }).then(function (result) {
                var scriptId = '';
                
                if (result === 1) {
                    scriptId = 'customscript544';
                } else if (result === 2) {
                    scriptId = 'customscript604';
                } else {
                    // Closed or cancelled
                    return;
                }

                var suiteletURL = url.resolveScript({
                    scriptId: scriptId,
                    deploymentId: 'customdeploy1',
                    params: {
                        customRecordId: recordId, 
                        currencyFormat: currencyText   
                    }
                });

                window.open(suiteletURL, '_blank');
            }).catch(function (reason) {
                console.error('Dialog failed', reason);
            });
        }
    }

    // 12. Return the script entry points
    return {
        pageInit: pageInit,
        printSelectedTemplate: printSelectedTemplate
    };
});