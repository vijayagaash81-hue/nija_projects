/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Description: Restricts Employee Salary Structure (Compensation Change) to role 1294 only.
 * All other roles (including standard Administrator) are blocked from viewing, creating, or editing.
 * Converted to SuiteScript 2.1.
 */
define(['N/runtime', 'N/error', 'N/log'], (runtime, error, log) => {

    const ALLOWED_ROLE = 1294;

    /**
     * Executes before a record is loaded into the user interface.
     * Blocks access if the current user role is not the allowed role.
     * @param {Object} scriptContext
     */
    const beforeLoad = (scriptContext) => {
        try {
            const user = runtime.getCurrentUser();
            const roleId = user.role;

            if (Number(roleId) !== ALLOWED_ROLE) {
                throw error.create({
                    name: 'PERMISSION_VIOLATION',
                    message: 'You do not have privilege to access Employee Salary Structure. Only the designated role is allowed.',
                    notifyOff: true
                });
            }
        } catch (e) {
            if (e.name === 'PERMISSION_VIOLATION') throw e;
            log.error('Error in beforeLoad restriction', e);
        }
    };

    /**
     * Executes before a record is submitted to the database.
     * Blocks create/edit/delete if the current user role is not the allowed role.
     * @param {Object} scriptContext
     */
    const beforeSubmit = (scriptContext) => {
        try {
            const user = runtime.getCurrentUser();
            const roleId = user.role;

            if (Number(roleId) !== ALLOWED_ROLE) {
                throw error.create({
                    name: 'PERMISSION_VIOLATION',
                    message: 'You do not have privilege to create or edit Employee Salary Structure.',
                    notifyOff: true
                });
            }
        } catch (e) {
            if (e.name === 'PERMISSION_VIOLATION') throw e;
            log.error('Error in beforeSubmit restriction', e);
        }
    };

    return {
        beforeLoad,
        beforeSubmit
    };
});
