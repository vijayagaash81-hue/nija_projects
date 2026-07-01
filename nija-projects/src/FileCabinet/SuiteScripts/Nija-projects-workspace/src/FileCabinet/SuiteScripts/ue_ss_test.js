/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/task', 'N/record'], function (task, record) {

    function afterSubmit(context) {
        try {
            var newRec = context.newRecord;

            // Get field values
            var recordId = newRec.id;
            var employee = newRec.getValue({ fieldId: 'entity' });
            var gender = newRec.getValue({ fieldId: 'custentity_hris_empgender' });
            var maritalStatus = newRec.getValue({ fieldId: 'custentity_hris_empmaritalstatus' });
            var height = newRec.getValue({ fieldId: 'custentity_hris_empheight' });
            var weight = newRec.getValue({ fieldId: 'custentity_hris_empweight' });

            // Create Scheduled Script Task
            var scheduledTask = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT
            });

            scheduledTask.scriptId = 'customscriptsstest_scheduled_script';
            scheduledTask.deploymentId = 'customdeploysstest_scheduled_script';

            // Pass parameters
            scheduledTask.params = {
                custscript_param_record_id: recordId,
                custscript_param_employee: employee,
                custscript_param_gender: gender,
                custscript_param_maritalstatus: maritalStatus,
                custscript_param_height: height,
                custscript_param_weight: weight
            };

            var taskId = scheduledTask.submit();

            log.debug('Scheduled Script Triggered', 'Task ID: ' + taskId);

        } catch (e) {
            log.error('Error in UE Script', e);
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});