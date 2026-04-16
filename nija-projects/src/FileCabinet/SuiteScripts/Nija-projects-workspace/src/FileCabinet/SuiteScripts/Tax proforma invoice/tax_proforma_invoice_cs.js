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
     * Logic: Loads the record, gets the currency, and shows the matching button.
     */
    function printSelectedTemplate() {
        // 1. Get the context of the current record on the screen
        var currentRecordObj = currentrecord.get();
        var recordId = currentRecordObj.id;
        var recordType = currentRecordObj.type;

        // 2. Explicitly LOAD the record from the database to get accurate values
        // This ensures all field data is accessible
        var loadedRecord = record.load({
            type: recordType,
            id: recordId
        });

        // 3. Get the Text value of the currency field (e.g., "AED" or "USD")
        var currencyText = loadedRecord.getText({
            fieldId: 'currency'
        });

    

            if (recordId) {
                
                // 9. Generate the URL for the Suitelet
                // Pass the record ID and the selected currency as parameters
                var suiteletURL = url.resolveScript({
                    scriptId: 'customscript_hris_taxinvoice_sl_print',
                    deploymentId: 'customdeploy_hris_taxinvoice_sl_print',
                    params: {
                        customRecordId: recordId, 
                        currencyFormat: currencyText   
                    }
                });

                // 10. Open the Suitelet in a new browser tab
                window.open(suiteletURL, '_blank');
            }
            
        
    }

    // 12. Return the script entry points
    return {
        pageInit: pageInit,
        printSelectedTemplate: printSelectedTemplate
    };
});