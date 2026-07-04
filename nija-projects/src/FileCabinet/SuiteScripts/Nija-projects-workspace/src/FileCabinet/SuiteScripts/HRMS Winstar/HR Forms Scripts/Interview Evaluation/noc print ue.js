/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], (serverWidget) => {
    const beforeLoad = (scriptContext) => {
        // Only show the button when viewing the record
        if (scriptContext.type === scriptContext.UserEventType.VIEW) {
            const form = scriptContext.form;
            const recordId = scriptContext.newRecord.id;
            const recordType = scriptContext.newRecord.type;

            // Link the Client Script to this form so the button knows which function to call
            form.clientScriptModulePath = './noc print layout cs.js';

            // Add the button
            form.addButton({
                id: 'custpage_print_noc_btn',
                label: 'Print NOC',
                // Call the function from the Client Script
                functionName: `onPrintNoc("${recordId}", "${recordType}")`
            });
        }
    };

    return { beforeLoad };
});