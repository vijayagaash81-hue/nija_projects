/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @Description Triggers a Map/Reduce script to create time bills when a daily attendance record is approved.
 */
define(['N/task', 'N/log'], (task, log) => {

    /**
     * @param {Object} context
     * @param {Record} context.newRecord
     * @param {Record} context.oldRecord
     * @param {string} context.type
     */
    const afterSubmit = (context) => {
        try {
            // Only trigger on create, edit, or inline edit (xedit)
            if (context.type !== context.UserEventType.CREATE && 
                context.type !== context.UserEventType.EDIT && 
                context.type !== context.UserEventType.XEDIT) {
                return;
            }

            const newRecord = context.newRecord;
            const oldRecord = context.oldRecord;

            const recordId = newRecord.id;
            const newStatus = newRecord.getValue({ fieldId: 'custrecord_njt_emp_daily_approval_status' });
            
            log.debug('afterSubmit Check', {
                recordId: recordId,
                newStatus: newStatus,
                contextType: context.type
            });

            // Internal ID '2' represents the 'Approved' status
            let isApprovedTransition = (String(newStatus) === '2');

            // If it is an edit/xedit, ensure it wasn't already approved before to avoid double trigger
            if (isApprovedTransition && (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.XEDIT)) {
                if (oldRecord) {
                    const oldStatus = oldRecord.getValue({ fieldId: 'custrecord_njt_emp_daily_approval_status' });
                    if (String(oldStatus) === '2') {
                        log.debug('Record was already approved. Skipping MR trigger.', { recordId: recordId });
                        isApprovedTransition = false;
                    }
                }
            }

            if (isApprovedTransition) {
                log.audit('Triggering Map/Reduce Script for Approved Record', { recordId: recordId });
                
                const mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_njt_timesheet_timebill_mr',
                    deploymentId: 'customdeploy_njt_timesheet_timebill_mr',
                    params: {
                        'custscript_njt_atten_mr_rec_id': recordId
                    }
                });

                const taskId = mrTask.submit();
                log.audit('Map/Reduce Task Submitted successfully', { taskId: taskId });
            }

        } catch (e) {
            log.error('Error in afterSubmit', e);
        }
    };

    return {
        afterSubmit
    };

});
