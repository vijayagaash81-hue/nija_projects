/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/task', 'N/log', 'N/runtime'], function (task, log, runtime) {

    /**
     * afterSubmit - Triggered after a Employee Handbook record is saved.
     * Schedules the hris_emp_handbook_sch script and passes the record internal ID
     * as a parameter so the scheduled script can fetch and push data to the mobile API.
     *
     * @param {Object} context
     */
    function afterSubmit(context) {
        try {
            // Only trigger on CREATE or EDIT events
            if (
                context.type !== context.UserEventType.CREATE &&
                context.type !== context.UserEventType.EDIT
            ) {
                return;
            }

            var newRecord = context.newRecord;
            var recordId  = newRecord.id;

            log.debug({
                title: 'hris_emp_handbook_ues | afterSubmit',
                details: 'Employee Handbook record saved. Internal ID: ' + recordId
            });

            // Schedule the companion scheduled script and pass the record ID
            var scheduledTask = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                scriptId:    'customscript_hris_emp_handbook_sch',
                deploymentId: 'customdeploy_hris_emp_handbook_sch',
                params: {
                    custscript_handbook_id: String(recordId)
                }
            });

            var taskId = scheduledTask.submit();

            log.debug({
                title: 'hris_emp_handbook_ues | Scheduled Task Submitted',
                details: 'Task ID: ' + taskId + ' | Record ID: ' + recordId
            });

        } catch (e) {
            log.error({
                title: 'hris_emp_handbook_ues | afterSubmit Error',
                details: e.message
            });
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
