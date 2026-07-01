/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/log', 'N/ui/serverWidget', 'N/url'], (log, serverWidget, url) => {

    /**
     * Function definition to be triggered before record is loaded.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     */
    const beforeLoad = (scriptContext) => {
        try {
            // Add print button only when record is opened in VIEW mode
            if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                const newRecord = scriptContext.newRecord;
                const recId = newRecord.id;
                const form = scriptContext.form;

                log.debug({
                    title: 'Adding Print Button',
                    details: `Change in Status ID: ${recId}`
                });

                // Resolve the Suitelet URL dynamically using its Script ID and Deployment ID
                const suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_njt_designation_change_sl',
                    deploymentId: 'customdeploy_njt_designation_change_sl',
                    params: {
                        id: recId
                    }
                });

                // Add the custom Print button to the record form
                form.addButton({
                    id: 'custpage_btn_print_emp_transfer',
                    label: 'Print Employee Transfer Form',
                    functionName: 'printEmployeeTransferForm'
                });

                // Inject client-side execution script using an INLINEHTML field to open Suitelet in new tab
                const inlineHtmlField = form.addField({
                    id: 'custpage_emp_transfer_inline_script',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: ' '
                });

                inlineHtmlField.defaultValue = `
                    <script type="text/javascript">
                        function printEmployeeTransferForm() {
                            window.open('${suiteletUrl}', '_blank');
                        }
                    </script>
                `;
            }
        } catch (e) {
            log.error({
                title: 'Error in beforeLoad User Event',
                details: e.toString()
            });
        }
    };

    return {
        beforeLoad
    };

});
