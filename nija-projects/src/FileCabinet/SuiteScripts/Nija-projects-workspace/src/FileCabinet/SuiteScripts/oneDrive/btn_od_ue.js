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
                form.clientScriptModulePath = './btn_od_cs.js';
                var lineCount = context.newRecord.getLineCount({
                    sublistId: 'recmachcustrecord_parent_test_od',
                });
                for (var i=0; i < lineCount; i++) {
                    var 
                }

                form.addButton({
                    id: 'custpage_btn_od',
                    label: 'Attach File',
                    functionName: 'attachFile()'
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