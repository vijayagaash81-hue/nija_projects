/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/log'], function(log) {
    function beforeLoad(context) {
        // Only show the button when viewing the record
        if (context.type === context.UserEventType.VIEW) {
            var form = context.form;
            
            // Add the Print Packing List button
            form.addButton({
                id: 'custpage_print_packing_list',
                label: 'Print Packing List',
                functionName: 'printPackingList()'
            });

            // Attach the Client Script that contains the printPackingList() function
            form.clientScriptModulePath = 'SuiteScripts/Layouts/packing_list_cs.js'; 
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});