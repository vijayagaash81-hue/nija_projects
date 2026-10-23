/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Description: Disables or blocks editing of employee records when inactive (settlement done), unless the user is an Administrator.
 * Converted from SuiteScript 1.0 to SuiteScript 2.1.
 */
define(['N/runtime', 'N/record', 'N/log'], (runtime, record, log) => {

    /**
     * Executes before a record is loaded.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     */
    const beforeLoad = (scriptContext) => {
        try {
            const { type, form, newRecord } = scriptContext;
            const currentUser = runtime.getCurrentUser();
            const role = currentUser.role;
            const executionContext = runtime.executionContext;

            log.debug('beforeLoad', {
                type,
                role,
                executionContext
            });

            // Administrator role is 3. Only apply restriction to non-admins in user interface mode
            if (role == 3 || executionContext !== runtime.ContextType.USER_INTERFACE) {
                return;
            }

            const empId = newRecord ? newRecord.id : null;
            if (!empId) {
                return;
            }

            let customForm = newRecord.getValue({ fieldId: 'customform' });
            let isInactive = newRecord.getValue({ fieldId: 'isinactive' });

            // Ensure values are populated by loading the record if necessary
            if (customForm === undefined || customForm === null || isInactive === undefined || isInactive === null) {
                try {
                    const empRec = record.load({
                        type: record.Type.EMPLOYEE,
                        id: empId,
                        isDynamic: false
                    });
                    customForm = empRec.getValue({ fieldId: 'customform' });
                    isInactive = empRec.getValue({ fieldId: 'isinactive' });
                } catch (loadErr) {
                    log.error('Error loading employee record', loadErr);
                }
            }

            log.debug('Employee Checks', { customForm, isInactive });

            if (String(customForm) !== '565') {
                return;
            }

            const isInactiveBool = isInactive === true || isInactive === 'T';

            if (type === scriptContext.UserEventType.VIEW) {
                if (isInactiveBool) {
                    const editButton = form.getButton({ id: 'edit' });
                    if (editButton) {
                        editButton.isDisabled = true;
                        log.debug('beforeLoad', 'Edit button disabled on view');
                    }
                }
            } else if (type === scriptContext.UserEventType.EDIT) {
                if (isInactiveBool) {
                    throw new Error('Confirm settlement has been done for this employee. You cannot edit this record');
                }
            }
        } catch (e) {
            log.error('Error in beforeLoad', e);
            throw e;
        }
    };

    return {
        beforeLoad
    };
});
