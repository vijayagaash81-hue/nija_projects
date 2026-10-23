/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Scenario: Printing PDF from Button using UE, CS, SL, and XML
 * Component: User Event Script
 * Purpose: Adds a custom "Print PDF" button to the record in VIEW mode.
 *          Resolves the Suitelet URL and links it to the Client Script trigger.
 */
define(['N/url', 'N/log', 'N/ui/serverWidget'], (url, log, serverWidget) => {

    /**
     * Executes before the record form is loaded
     * @param {Object} context
     * @param {Record} context.newRecord
     * @param {string} context.type
     * @param {Form} context.form
     */
    const beforeLoad = (context) => {
        try {
            // Button should only be visible when viewing an existing saved record
            if (context.type !== context.UserEventType.VIEW) {
                return;
            }

            const currentRecord = context.newRecord;
            const form = context.form;
            const recordId = currentRecord.id;
            const recordType = currentRecord.type;

            log.debug({
                title: 'Adding PDF Print Button',
                details: `Record Type: ${recordType}, Record ID: ${recordId}`
            });

            // 1. Resolve Suitelet URL with parameters
            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript_njt_pdf_renderer_sl',
                deploymentId: 'customdeploy_njt_pdf_renderer_sl',
                params: {
                    recId: recordId,
                    recType: recordType
                }
            });

            // 2. Attach Client Script that handles the click logic
            // Option 1: Attach external Client Script file
            form.clientScriptModulePath = './cs_print_button_trigger.js';

            // Option 2: Provide inline helper fallback to guarantee execution
            const inlineScriptField = form.addField({
                id: 'custpage_pdf_print_helper',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'PDF Helper Script'
            });

            inlineScriptField.defaultValue = `
                <script type="text/javascript">
                    function triggerSuiteletPdfPrint() {
                        var printUrl = "${suiteletUrl}";
                        window.open(printUrl, '_blank', 'noopener,noreferrer,width=1000,height=800');
                    }
                </script>
            `;

            // 3. Add custom Print Button to Form header
            form.addButton({
                id: 'custpage_btn_print_custom_pdf',
                label: 'Print Custom Document',
                functionName: 'triggerSuiteletPdfPrint'
            });

        } catch (e) {
            log.error({
                title: 'Error in beforeLoad (Print PDF Button)',
                details: e
            });
        }
    };

    return { beforeLoad };
});
