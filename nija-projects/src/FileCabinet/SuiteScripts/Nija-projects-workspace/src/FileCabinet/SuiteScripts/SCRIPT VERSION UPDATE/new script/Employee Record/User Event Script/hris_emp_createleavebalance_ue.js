/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Description User Event script to trigger Scheduled Script for leave credit balance creation upon Employee record save.
 */
define(['N/task', 'N/log'], (task, log) => {

    /**
     * Function executed after a record is submitted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type (create, edit, etc.)
     */
    const afterSubmit = (scriptContext) => {
        try {
            const triggerType = scriptContext.type;
            log.debug({ title: 'afterSubmit triggerType', details: triggerType });

            if (triggerType === scriptContext.UserEventType.CREATE || triggerType === scriptContext.UserEventType.EDIT) {
                const newRecord = scriptContext.newRecord;
                const employeeID = newRecord.id;
                const customForm = newRecord.getValue({ fieldId: 'customform' });

                log.debug({ title: 'customform', details: customForm });

                if (String(customForm) === '167') {
                    const empType = newRecord.getValue({ fieldId: 'custentity_hris_empcategory' });
                    log.debug({ title: 'empType', details: empType });

                    const scriptParams = {
                        custscript_hrisempidtocreateleaves: employeeID
                    };

                    // Create and submit scheduled script task in SuiteScript 2.1
                    const scheduledTask = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        scriptId: 'customscript_hris_emp_leavecredit',
                        deploymentId: 'customdeploy_hris_emp_leavecredit',
                        params: scriptParams
                    });

                    const taskId = scheduledTask.submit();
                    log.debug({ title: 'Scheduled Script Task Submitted', details: { taskId, params: scriptParams } });
                }
            }
        } catch (e) {
            log.error({
                title: 'Error in afterSubmitRecord_createRecord',
                details: e.message || e
            });
        }
    };

    return {
        afterSubmit
    };
});
