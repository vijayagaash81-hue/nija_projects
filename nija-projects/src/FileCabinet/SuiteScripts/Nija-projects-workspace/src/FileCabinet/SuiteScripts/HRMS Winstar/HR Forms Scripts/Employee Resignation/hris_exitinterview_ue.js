/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/ui/serverWidget', 'N/search', 'N/query', 'N/runtime','N/format','N/log'], function (record, serverWidget, search, query,runtime,format,log) {

    function beforeLoad(scriptContext) {
        // Only display the button when viewing an existing record
        if (scriptContext.type === scriptContext.UserEventType.VIEW) {
            const form = scriptContext.form;
            
            // 1. Attach your Client Script file path to listen for the button click event
            // Verify this path exactly matches your destination naming structure in the File Cabinet
           form.clientScriptModulePath = './hris_exitinterview_cs.js';
           // form.clientScriptFileId=24071;

            // 2. Add the dynamic operational button
            form.addButton({
                id: 'custpage_btn_print_exit_interview',
                label: 'Print Exit Interview',
                functionName: 'printMemo' // Triggers the linked function in your Client Script
            });
        }
    }
    function afterSubmit(context) {
        // Enforce execution contexts (Bypass on deletion)
        if (context.type === context.UserEventType.DELETE) return;

        try {
            var newRecordObj = context.newRecord;
            var exitInterviewId = newRecordObj.id; // Get the ID of the current Exit Interview record

            // 1. Fetch the linked Resignation Form ID from the Exit Interview
            var resignid = newRecordObj.getValue('custrecord_hr_exit_interview_resignlink'); 

            log.debug('IDs Overview', 'Exit Interview ID: ' + exitInterviewId + ' | Resignation ID: ' + resignid);

            // 2. If a resignation record link exists, update it to point back to this Exit Interview
            if (resignid) {
                var updatedResignId = record.submitFields({
                    type: 'customrecord_hris_resign_form',
                    id: resignid,
                    values: {
                        // Corrected: Passing the Exit Interview's ID to link them together
                        'custrecord_hris_res_exitinterlink': exitInterviewId, 
                        'custrecord_hris_res_exitcheck':true
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });

                log.debug('Resignation Updated Successfully', 'Resignation ID ' + updatedResignId + ' now links to Exit Interview ' + exitInterviewId);
            } else {
                log.audit('Skipped Update', 'No Resignation Link found on this Exit Interview record.');
            }

        } catch (e) {
            log.error({
                title: 'Error in afterSubmit linking records',
                details: e
            });
        }
    }

    return {
        beforeLoad:beforeLoad,
        afterSubmit: afterSubmit
    };

});