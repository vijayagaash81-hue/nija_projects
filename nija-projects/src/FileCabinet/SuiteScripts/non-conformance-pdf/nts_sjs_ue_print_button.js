/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/log'], function(log) {
    function beforeLoad(context) {
        try {
            // Only show the button when viewing an existing record
            if (context.type === context.UserEventType.VIEW) {
                var form = context.form;
                
                // Attach the Client Script (UPDATE THIS PATH to match where your CS is uploaded in NetSuite File Cabinet)
                form.clientScriptModulePath = 'SuiteScripts/Layouts/nts_sjs_cs_print_button.js';
                
                form.addButton({
                    id: 'custpage_btn_print_ncr',
                    label: 'Print NCR',
                    functionName: 'onPrintButtonClick'
                });
            }
        } catch (e) {
            log.error('Error in beforeLoad adding Print button', e);
        }
    }
    return {
        beforeLoad: beforeLoad
    };
});