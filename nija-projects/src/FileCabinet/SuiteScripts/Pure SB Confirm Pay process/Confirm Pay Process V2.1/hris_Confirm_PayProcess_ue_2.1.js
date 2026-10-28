/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/log'], (log) => {

    const beforeLoad = (scriptContext) => {
        try {
            if (scriptContext.type !== scriptContext.UserEventType.VIEW) {
                return;
            }

            const form = scriptContext.form;
            const confirmProcessId = scriptContext.newRecord.id;

            if (!confirmProcessId) {
                return;
            }

            // Use FULL File Cabinet path (recommended)
            // Example: 'SuiteScripts/HRIS/hris_Conf_Process_Oncall_cs_2.1.js'
            form.clientScriptModulePath = './hris_Conf_Process_Oncall_cs_2.1.js';

            // Pass the ID as parameter
            form.addButton({
                id: 'custpage_ConfButton',
                label: 'Confirm Process',
                functionName: `callConfirmPayProcess(${confirmProcessId})`
            });

        } catch (e) {
            log.error('beforeLoad Error', e.toString());
        }
    };

    return {
        beforeLoad
    };
});