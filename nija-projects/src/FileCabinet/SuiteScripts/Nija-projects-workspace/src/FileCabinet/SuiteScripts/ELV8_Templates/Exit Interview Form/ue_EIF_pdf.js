/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/log', 'N/ui/serverWidget'], function(log, serverWidget) {

    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            var form = context.form;
            
            // Attach the Client Script
            // IMPORTANT: Update this path to the correct File Cabinet path if it changes
            // or use the file ID instead (e.g. form.clientScriptFileId = 1234;)
            form.clientScriptModulePath = './cs_EIF_pdf.js';
            
            // Add the Print button
            form.addButton({
                id: 'custpage_btn_print_eif',
                label: 'Print',
                functionName: 'printExitInterview' // This must match the function name in cs_EIF_pdf.js
            });
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
