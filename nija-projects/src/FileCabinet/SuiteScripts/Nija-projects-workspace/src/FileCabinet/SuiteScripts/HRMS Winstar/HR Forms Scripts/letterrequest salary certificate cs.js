/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord'], function(url, currentRecord) {

    function pageInit(context) {
        // Required entry point, but no logic needed here
    }

    function triggerPrintOfferLetter() {
        callPrintSuitelet('2');
    }

    function triggerPrintSalaryCertificate() {
        callPrintSuitelet('3');
    }

    /**
     * NEW: Logic for Experience Letter (Type 4)
     */
    function triggerPrintExperienceLetter() {
        callPrintSuitelet('4');
    }

    /**
     * Helper function to call the Suitelet
     * @param {string} type - The certificate type ID
     */
    function callPrintSuitelet(type) {
        try {
            var recordObj = currentRecord.get();
            var recordId = recordObj.id;

            // Resolve the Suitelet URL
            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript_salary_certificate_pdf',
                deploymentId: 'customdeploy_salary_certificate_pdf',
                params: {
                    recordId: recordId,
                    certType: type 
                }
            });

            // Open the PDF in a new browser tab
            window.open(suiteletUrl, '_blank');
        } catch (e) {
            alert('Error triggering print: ' + e.message);
        }
    }

    return {
        pageInit: pageInit,
        triggerPrintOfferLetter: triggerPrintOfferLetter,
        triggerPrintSalaryCertificate: triggerPrintSalaryCertificate,
        triggerPrintExperienceLetter: triggerPrintExperienceLetter
    };
});