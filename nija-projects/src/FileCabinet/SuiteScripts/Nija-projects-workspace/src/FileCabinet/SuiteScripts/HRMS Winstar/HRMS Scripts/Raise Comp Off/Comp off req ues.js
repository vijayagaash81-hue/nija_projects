/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/task'], function (log, task) {

    function afterSubmit(context) {
        if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE) {
            var rec = context.newRecord;
            var compOffId = rec.id;
            var isChecked = rec.getValue({ fieldId: 'custrecord_hris_rcomp_checked' });

            log.debug("Comp Off Record Id", compOffId);
            log.debug("Checkbox Value", isChecked);

            // Run scheduled script only if checkbox is not checked
            
                var params = {
                    custscript_hris_compoff_id: compOffId
                };

                // Try deployment 1
                var scriptTask = task.create({
                    taskType: task.TaskType.SCHEDULED_SCRIPT,
                    scriptId: 'customscript_post_comp_off_req_sch',
                    // deploymentId: 'customdeploy_post_comp_off_req_sch',
                    params: params
                });

                var taskId = scriptTask.submit();
                var status = task.checkStatus({ taskId: taskId }).status;
                log.debug("Status from deployment 1", status);

                // if (status === task.TaskStatus.PENDING || status === task.TaskStatus.PROCESSING) {
                //     log.debug("Deployment 1 busy", "Switching to deployment 2");
                //     var fallbackTask = task.create({
                //         taskType: task.TaskType.SCHEDULED_SCRIPT,
                //         scriptId: 'customscript_post_comp_off_req_sch',
                //         deploymentId: 'customdeploy_post_comp_off_req_sch2',
                //         params: params
                //     });
                //     var fallbackId = fallbackTask.submit();
                //     log.debug("Submitted on deployment 2", fallbackId);
                // } else {
                //     log.debug("Submitted on deployment 1", taskId);
                // }
           
        }
    }

    return { afterSubmit: afterSubmit };
});
