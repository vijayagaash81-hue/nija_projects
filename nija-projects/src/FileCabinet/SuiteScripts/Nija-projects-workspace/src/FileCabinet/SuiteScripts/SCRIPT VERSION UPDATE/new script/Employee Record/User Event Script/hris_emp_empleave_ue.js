/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Description User Event script to attach Client Script customscript_hris_empleave_cs to Employee form in view mode.
 */
define(['N/log'], (log) => {

    /**
     * Function executed before record/form is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Form} scriptContext.form - Current form
     * @param {string} scriptContext.type - Trigger type (e.g. view, edit)
     */
    const beforeLoad = (scriptContext) => {
        try {
            const triggerType = scriptContext.type;
            log.debug({ title: 'beforeLoad triggerType', details: triggerType });

            if (triggerType === scriptContext.UserEventType.VIEW) {
                const newRecord = scriptContext.newRecord;
                const recId = newRecord.id;

                if (recId) {
                    const customForm = newRecord.getValue({ fieldId: 'customform' });
                    log.debug({ title: 'customform', details: customForm });

                    if (String(customForm) === '167') {
                        const recType = newRecord.type;
                        log.debug({ title: 'recType', details: recType });

                        if (recType === 'employee') {
                            const form = scriptContext.form;
                            // Attach Client Script to the NetSuite form in SuiteScript 2.1
                            form.clientScriptFileId = 'customscript_hris_empleave_cs';
                            log.debug({ title: 'Client Script attached', details: 'customscript_hris_empleave_cs' });
                        }
                    }
                }
            }
        } catch (e) {
            log.error({
                title: 'Error in beforeLoadAction',
                details: e.message || e
            });
        }
    };

    return {
        beforeLoad
    };
});
