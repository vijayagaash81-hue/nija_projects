/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord', 'N/ui/message'], function(url, currentRecord, message) {
    
    function pageInit(context) {
        // Required entry point
    }

    function printPdf() {
        var rec = currentRecord.get();
        
        var customerId = rec.getValue({ fieldId: 'custpage_customer' });
        var asOfDate = rec.getText({ fieldId: 'custpage_as_of_date' });
        var division = rec.getValue({ fieldId: 'custpage_division' });
        
        if (!customerId) {
            message.create({
                title: 'Error',
                message: 'Please select a Customer (BP) before printing.',
                type: message.Type.ERROR
            }).show({ duration: 5000 });
            return;
        }
        
        // Resolve the Suitelet URL dynamically
        // IMPORTANT: Change scriptId and deploymentId to match your deployment in NetSuite!
        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_bp_outstanding_sl', // Update this
            deploymentId: 'customdeploy_bp_outstanding_sl', // Update this
            params: {
                action: 'print',
                custpage_customer: customerId,
                custpage_as_of_date: asOfDate,
                custpage_division: division
            }
        });
        
        // Open the PDF in a new window/tab
        window.open(suiteletUrl, '_blank');
    }
    
    return {
        pageInit: pageInit,
        printPdf: printPdf
    };
});