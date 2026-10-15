/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/task', 'N/log'], function (task, log) {

    function afterSubmit(context) {
        var newRecord = context.newRecord;
        var internalId = newRecord.id;
        var eventType = context.type;

        // Trigger only on create or edit
        if (eventType !== context.UserEventType.CREATE && eventType !== context.UserEventType.EDIT) {
            return;
        }

        try {
            var params = {
                custscript_announcementid: internalId
            };

            // --- Primary Deployment ---
            var taskObj = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                scriptId: 'customscript_hris_comp_annment_sch',
                deploymentId: 'customdeploy_hris_comp_annment_sch',
                params: params
            });

            var taskId = taskObj.submit();

            // Check status of submitted task
            var statusObj = task.checkStatus({ taskId: taskId });
            var status = statusObj.status;
            log.debug("status",status);

            if (status === task.TaskStatus.PENDING || status === task.TaskStatus.PROCESSING) {
                
                log.debug("Primary deployment busy", "Switching to fallback deployment");

                var fallbackTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: 'customscript_hris_comp_annment_sch',
                    deploymentId: 'customdeploy_hris_comp_annment_sch2', 
                    params: params
                });

                var fallbackId = fallbackTask.submit();
                log.debug("Scheduled Script (Fallback)", "Task ID: " + fallbackId + " for Announcement ID: " + internalId);
            } else {
                log.debug("Scheduled Script (Primary)", "Task ID: " + taskId + " for Announcement ID: " + internalId);
            }

        } catch (e) {
            log.error('Error Scheduling Script', 'Announcement ID: ' + internalId + ', Error: ' + e.message);
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
