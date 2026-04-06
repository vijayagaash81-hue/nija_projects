/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope Public
*/
define(['N/record', 'N/log', 'N/ui/serverWidget'], 
    function(record, log, serverWidget) {
        function beforeLoad(context) {
            // Create a form
            var form = context.form;
            form.clientScriptModulePath = 'SuiteScripts/Layouts/tax invoice cs.js';
            log.debug("form", form);
            if (context.type == context.UserEventType.VIEW) {
                // Get the current record
                var currentRecord = context.newRecord;
                log.debug("currentRecord", currentRecord);
                
                var requestButton = form.addButton({
                    id: 'custpage_print_button',
                    label: 'Print',
                    functionName: 'printSelectedTemplate()'
                });
            }
        }
 
        return {
            beforeLoad: beforeLoad
        };
    }
);