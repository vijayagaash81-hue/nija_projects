/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * 
 * Script Name: sjs_picklist_print_ue.js
 * Description: User Event script to add "Print Pick List" button directly triggering the Suitelet without an external Client Script.
 */
define(['N/url', 'N/log'], (url, log) => {

    /**
     * Function executed before the page is loaded.
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {string} context.type - Trigger type
     * @param {Form} context.form - Current form object
     */
    const beforeLoad = (context) => {
        try {
            // Only add button in VIEW mode
            if (context.type !== context.UserEventType.VIEW) {
                return;
            }

            const form = context.form;
            const newRecord = context.newRecord;

            if (!newRecord || !newRecord.id) {
                return;
            }

            // Resolve Suitelet URL directly in User Event script
            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript_sjs_picklist_print_sl',
                deploymentId: 'customdeploy_sjs_picklist_print_sl',
                params: {
                    customRecordId: newRecord.id,
                    recordType: newRecord.type
                }
            });

            // Add button that directly opens the Suitelet in a new window/tab without requiring a Client Script
            form.addButton({
                id: 'custpage_print_sjs_picklist',
                label: 'Print Pick List',
                functionName: `window.open('${suiteletUrl}', '_blank')`
            });

            log.debug('beforeLoad', `Print Pick List button added successfully. Suitelet URL: ${suiteletUrl}`);

        } catch (e) {
            log.error('Error in beforeLoad of sjs_picklist_print_ue.js', e);
        }
    };

    return {
        beforeLoad: beforeLoad
    };
});
