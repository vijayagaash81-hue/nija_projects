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
            // Check if the record is opened in VIEW mode
            if (scriptContext.type === scriptContext.UserEventType.VIEW) {
                const newRecord = scriptContext.newRecord;
                const recId = newRecord.id;
                const form = scriptContext.form;

                log.debug({
                    title: 'Adding Print Button',
                    details: `Passport Request ID: ${recId}`
                });

                // Resolve the Suitelet URL dynamically
                const suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_njt_passport_req_sl',
                    deploymentId: 'customdeploy_njt_passport_req_sl',
                    params: {
                        id: recId
                    }
                });

                // Add the custom Print button
                form.addButton({
                    id: 'custpage_btn_print_passport_req',
                    label: 'Print Documents Release Form',
                    functionName: 'printPassportRequestForm'
                });

                // Inject client-side execution script using an INLINEHTML field
                const inlineHtmlField = form.addField({
                    id: 'custpage_passport_req_inline_script',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: ' '
                });

                // Define the JavaScript function to open the Suitelet PDF in a new tab
                inlineHtmlField.defaultValue = `
                    <script type="text/javascript">
                        function printPassportRequestForm() {
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
