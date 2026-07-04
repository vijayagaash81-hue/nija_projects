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
                var monthlyprocess =currentRecord.getValue('custrecord_njt_monthly_atten_process');
                var otprocess = currentRecord.getValue('custrecord_hris_regmonthlyatten_process')
                if(monthlyprocess==false && otprocess==false){
                    var requestButton = form.addButton({
                    id: 'custpage_delete_button',
                    label: 'Delete',
                    functionName: 'dutydeletion()'
                });

                }
               
            }
          
         form.clientScriptModulePath = './hris_emp_dailyatten_deletion_cs.js';
        }
 
        return {
            beforeLoad: beforeLoad
        };
    }
);