/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/error', 'N/runtime', 'N/ui/serverWidget'], function(error, runtime, serverWidget) {

    /**
     * Function definition to be executed before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @param {ServletRequest} scriptContext.request - HTTP request information
     * @since 2015.2
     */
    function beforeLoad(scriptContext) {
        // Only run for View and Edit actions in the UI context
        if (scriptContext.type === scriptContext.UserEventType.VIEW || scriptContext.type === scriptContext.UserEventType.EDIT) {
            
            // Context check: only restrict requests coming from the User Interface
            if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
                var currentUser = runtime.getCurrentUser();
                
                // Example authorization check (e.g. check by role ID or user ID)
                // Adjust the role ID as appropriate for authorization.
                // Native role checking is the most secure way to control record visibility.
                var allowedRoles = [3]; // 3 is standard Administrator role ID
                
                if (allowedRoles.indexOf(currentUser.role) === -1) {
                    // Prevent page from loading the record content and display a native permission error
                    throw error.create({
                        name: 'UNAUTHORIZED_ACCESS',
                        message: 'You do not have the required permissions to view this record. Please contact your system administrator.',
                        notifyOff: true
                    });
                }
            }
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});
