/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Description User Event script to disable edit button and prevent edit mode on inactive/settled employee records.
 */
define(['N/runtime', 'N/log', 'N/error'], (runtime, log, error) => {

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
            const type = scriptContext.type;
            const currentUser = runtime.getCurrentUser();
            const role = currentUser.role;
            const executionContext = runtime.executionContext;

            // Only enforce for non-Administrator roles (Administrator = 3) and User Interface execution
            if (Number(role) !== 3 && executionContext === runtime.ContextType.USER_INTERFACE) {
                const newRecord = scriptContext.newRecord;
                const empId = newRecord.id;

                if (empId) {
                    const customForm = newRecord.getValue({ fieldId: 'customform' });
                    const isInactive = newRecord.getValue({ fieldId: 'isinactive' });

                    log.debug({
                        title: 'beforeLoad Execution',
                        details: { type, customForm, isInactive, role, executionContext }
                    });

                    if (String(customForm) === '167') {
                        // In View mode, disable the Edit button if employee is inactive
                        if (type === scriptContext.UserEventType.VIEW) {
                            if (isInactive === true || isInactive === 'T') {
                                const editButton = scriptContext.form.getButton({ id: 'edit' });
                                if (editButton) {
                                    editButton.isDisabled = true;
                                    log.debug({ title: 'Edit Button Disabled', details: `Employee ID: ${empId}` });
                                }
                            }
                        }

                        // In Edit mode, prevent user from editing if employee is inactive/settled
                        if (type === scriptContext.UserEventType.EDIT) {
                            if (isInactive === true || isInactive === 'T') {
                                log.debug({ title: 'Blocking Edit Mode', details: `Employee ID: ${empId}` });
                                throw error.create({
                                    name: 'SETTLEMENT_ALREADY_CONFIRMED',
                                    message: 'Confirm settlement has been done for this employee. You cannot edit this record',
                                    notifyOff: true
                                });
                            }
                        }
                    }
                }
            }
        } catch (e) {
            log.error({ title: 'Error in beforeLoad', details: e.message || e });
            throw e;
        }
    };

    return {
        beforeLoad
    };
});
