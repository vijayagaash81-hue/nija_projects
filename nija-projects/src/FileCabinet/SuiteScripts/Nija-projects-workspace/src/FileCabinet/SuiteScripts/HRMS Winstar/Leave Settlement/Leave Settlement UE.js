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
            // form.clientScriptModulePath = 'SuiteScripts/Powergroup layout scripts/ Taxinvoice/Taxinv CS.js';
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
            // form.clientScriptFileId = 1107;
                      // form.clientScriptFileId = 3793;
          // log.debug("logid",clientScriptFileId)
         form.clientScriptModulePath = './Leave Settlement CS.js';
        }
 
        return {
            beforeLoad: beforeLoad
        };
    }
);