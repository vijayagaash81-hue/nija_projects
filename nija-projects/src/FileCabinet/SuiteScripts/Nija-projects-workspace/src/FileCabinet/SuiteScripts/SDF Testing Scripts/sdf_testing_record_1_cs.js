/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/ui/dialog'], (dialog) => {

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is loaded ('create', 'edit', or 'view')
     */
    const pageInit = (scriptContext) => {
        dialog.alert({
            title: 'SDF Testing Record 1',
            message: 'SDF Testing Record 1 Opened'
        });
    };

    return {
        pageInit: pageInit
    };
});
