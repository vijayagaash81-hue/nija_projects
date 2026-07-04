/**
* @NApiVersion 2.x
* @NScriptType UserEventScript
* @NModuleScope SameAccount
*/
define(['N/record', 'N/log'],
    function (record, log) {
 
        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {
            var form = scriptContext.form;

            if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                form.addButton({
                    id: 'custpage_print_button',
                    label: 'Print',
                    functionName: 'printSelectedTemplate'
                });
            }

            // Correct the file path to the Client Script
            var clientScriptId = 21620 //1203; // Replace with the actual internal ID of your client script file
            form.clientScriptFileId = clientScriptId;
        }
 
        return {
            beforeLoad: beforeLoad
        };
    }
);
