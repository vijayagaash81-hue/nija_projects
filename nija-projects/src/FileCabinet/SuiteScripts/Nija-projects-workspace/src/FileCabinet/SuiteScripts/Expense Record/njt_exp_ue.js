/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/log'], (log) => {
    /**
     * Function definition to be triggered before record is loaded.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     */
    const beforeLoad = (scriptContext) => {
        try {
            if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                const currentRecord = scriptContext.newRecord;
                const status = currentRecord.getValue({ fieldId: 'custrecord_njt_prod_status' });

                log.debug('beforeLoad', 'Record ID: ' + currentRecord.id + ' | Status: ' + status);

                if (status == 2) {
                    const form = scriptContext.form;
                    
                    // Attach the client script
                    form.clientScriptModulePath = './njt_exp_cs.js';
                    
                    // Add the custom button
                    form.addButton({
                        id: 'custpage_create_expenses_btn',
                        label: 'Create Expenses',
                        functionName: 'createExpensesTriggered'
                    });
                    
                    log.debug('beforeLoad', 'Create Expenses button added and client script attached.');
                }
            }
        } catch (e) {
            log.error('Error in beforeLoad User Event', e.toString());
        }
    };

    return {
        beforeLoad
    };
});
