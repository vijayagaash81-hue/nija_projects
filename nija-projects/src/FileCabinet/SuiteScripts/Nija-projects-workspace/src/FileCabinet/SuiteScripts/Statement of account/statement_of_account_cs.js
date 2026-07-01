/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', 'N/currentRecord'], function(url, currentRecord) {

    function pageInit(context) {
        // Entry point for Client Script
    }
    
    function fieldChanged(context) {
        if (context.fieldId === 'custpage_type') {
            var rec = context.currentRecord;
            var type = rec.getValue({fieldId: 'custpage_type'});
            var subsidiary = rec.getValue({fieldId: 'custpage_subsidiary'});
            var fromDate = rec.getText({fieldId: 'custpage_from_date'});
            var toDate = rec.getText({fieldId: 'custpage_to_date'});
            
            // IMPORTANT: Replace these with your actual Script ID and Deployment ID for the Statement of Account Suitelet
            var scriptId = 'customscript_statement_of_account_sl'; 
            var deploymentId = 'customdeploy_statement_of_account_sl';
            
            var suiteletUrl = url.resolveScript({
                scriptId: scriptId,
                deploymentId: deploymentId,
                params: {
                    custpage_type: type,
                    custpage_subsidiary: subsidiary || '',
                    custpage_from_date: fromDate || '',
                    custpage_to_date: toDate || ''
                }
            });
            
            // Prevent the "Leave site? Changes you made may not be saved" warning
            window.onbeforeunload = null;
            window.location.href = suiteletUrl;
        }
    }
    
    function printPdf() {
        var rec = currentRecord.get();
        var type = rec.getValue({fieldId: 'custpage_type'});
        var subsidiary = rec.getValue({fieldId: 'custpage_subsidiary'});
        var entity = rec.getValue({fieldId: 'custpage_entity'});
        var fromDate = rec.getText({fieldId: 'custpage_from_date'});
        var toDate = rec.getText({fieldId: 'custpage_to_date'});
        
        if (!entity) {
            alert('Please select a Customer/Vendor before printing.');
            return;
        }
        
        // IMPORTANT: Replace these with your actual Script ID and Deployment ID for the Statement of Account Suitelet
        var scriptId = 'customscript_statement_of_account_sl'; 
        var deploymentId = 'customdeploy_statement_of_account_sl';
        
        var suiteletUrl = url.resolveScript({
            scriptId: scriptId,
            deploymentId: deploymentId,
            params: {
                action: 'print',
                custpage_type: type,
                custpage_subsidiary: subsidiary,
                custpage_entity: entity,
                custpage_from_date: fromDate,
                custpage_to_date: toDate
            }
        });
        
        // Opens the PDF in a new tab
        window.open(suiteletUrl, '_blank');
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        printPdf: printPdf
    };
});