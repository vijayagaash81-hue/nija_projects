/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define([], () => {

    /**
     * Function executed before page is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type; use values from the scriptContext.UserEventType enum
     * @param {Form} scriptContext.form - Current form
     */
    const beforeLoad = (scriptContext) => {
        if (scriptContext.type === scriptContext.UserEventType.CREATE) {
            scriptContext.form.addButton({
                id: 'custpage_sdf_testing_rec_3_btn',
                label: 'SDF Testing Record 3'
            });
        }
    };

    return {
        beforeLoad: beforeLoad
    };
});
