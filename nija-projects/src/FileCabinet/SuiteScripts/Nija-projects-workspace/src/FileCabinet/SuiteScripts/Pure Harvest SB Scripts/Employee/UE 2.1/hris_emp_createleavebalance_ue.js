/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Description: User Event script to trigger Scheduled Script for leave credit balance creation upon Employee record create/edit.
 * Upgraded to SuiteScript 2.1.
 */
define(['N/task', 'N/log'], (task, log) => {

    /**
     * Executes after a record is submitted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type (create, edit, etc.)
     */
    const afterSubmit = (scriptContext) => {
        try {
            log.debug('afterSubmit', 'Function called');
            const triggerType = scriptContext.type;
            log.debug('triggerType', triggerType);

            if (triggerType === scriptContext.UserEventType.CREATE || triggerType === scriptContext.UserEventType.EDIT) {
                const newRecord = scriptContext.newRecord;
                const employeeID = newRecord.id;
                log.debug('employeeID', employeeID);

                const customForm = newRecord.getValue({ fieldId: 'customform' });
                log.debug('customform', customForm);

                if (String(customForm) === '565') {
                    const empType = newRecord.getValue({ fieldId: 'custentity_hris_empcategory' });
                    log.debug('empType', empType);

                    const scriptParams = {
                        custscript_hrisempidtocreateleaves: employeeID
                    };
                    log.debug('param', scriptParams);

                    // Submit scheduled script task in SuiteScript 2.1
                    try {
                        const scheduledTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_hris_emp_leavecredit',
                            deploymentId: 'customdeploy_hris_emp_leavecredit',
                            params: scriptParams
                        });
                        const taskId = scheduledTask.submit();
                        log.debug('Scheduler status 1 : Task Submitted', { taskId, params: scriptParams });
                    } catch (deployErr) {
                        log.warn('Scheduled script deployment submission failed with specific deployment, attempting default deployment', deployErr);
                        const scheduledTask = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: 'customscript_hris_emp_leavecredit',
                            params: scriptParams
                        });
                        const taskId = scheduledTask.submit();
                        log.debug('Scheduler status 2 : Task Submitted (Auto Deployment)', { taskId, params: scriptParams });
                    }
                }
            }
        } catch (e) {
            log.error('Error in afterSubmit (hris_emp_createleavebalance_ue)', e.message || e);
        }
    };

    return {
        afterSubmit
    };
});
