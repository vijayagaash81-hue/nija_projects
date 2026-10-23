/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Restricts customrecord_hris_monthlysalinput to role 1294 only.
 * All other roles (including Administrator) are blocked from viewing/editing.
 */
define(['N/runtime', 'N/error'], (runtime, error) => {

    const ALLOWED_ROLE = 1294;

    const beforeLoad = (context) => {
        // Allow scripts / CSV / web services if needed; block UI for others
        // Remove this if you want to block ALL entry points
        // if (runtime.executionContext !== runtime.ContextType.USER_INTERFACE) return;

        const user = runtime.getCurrentUser();
        const roleId = user.role;

        if (Number(roleId) !== ALLOWED_ROLE) {
            throw error.create({
                name: 'PERMISSION_VIOLATION',
                message: 'You do not have privilege to access Employee Salary Structure. Only the designated role is allowed.',
                notifyOff: true
            });
        }
    };

    const beforeSubmit = (context) => {
        const user = runtime.getCurrentUser();
        const roleId = user.role;

        if (Number(roleId) !== ALLOWED_ROLE) {
            throw error.create({
                name: 'PERMISSION_VIOLATION',
                message: 'You do not have privilege to create or edit Employee Salary Structure.',
                notifyOff: true
            });
        }
    };

    return { beforeLoad, beforeSubmit };
});