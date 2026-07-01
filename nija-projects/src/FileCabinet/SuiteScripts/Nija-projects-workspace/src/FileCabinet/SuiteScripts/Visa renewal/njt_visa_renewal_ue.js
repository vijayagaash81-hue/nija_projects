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

                // Retrieve the category value
                const category = newRecord.getValue({ fieldId: 'custrecord_hris_visaren_category' });
                log.debug({
                    title: 'Checking Category for Print Button',
                    details: `Record ID: ${recId}, Category: ${category}`
                });

                let buttonLabel = '';
                let printFunctionName = '';

                // Category IDs: 
                // 6 = Staff, 9 = Management -> Staff Notice (HR42)
                // 8 = Labour, 10 = Daily Wages -> Workers Notice (HR42A)
                if (category == '6') {
                    buttonLabel = 'Print - Staff';
                    printFunctionName = 'printVisaRenewalStaff';
                } else if (category == '8') {
                    buttonLabel = 'Print - Labour';
                    printFunctionName = 'printVisaRenewalWorkers';
                }

                // Only add the button if the category matches
                if (buttonLabel && printFunctionName) {
                    // Resolve the Suitelet URL dynamically
                    const suiteletUrl = url.resolveScript({
                        scriptId: 'customscript_njt_visa_renewal_sl',
                        deploymentId: 'customdeploy_njt_visa_renewal_sl',
                        params: {
                            id: recId
                        }
                    });

                    // Add the custom print button
                    form.addButton({
                        id: 'custpage_btn_print_visa_renewal',
                        label: buttonLabel,
                        functionName: printFunctionName
                    });

                    // Inject client-side helper function to open the PDF in a new tab
                    const inlineHtmlField = form.addField({
                        id: 'custpage_visa_renewal_inline_script',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: ' '
                    });

                    inlineHtmlField.defaultValue = `
                        <script type="text/javascript">
                            function ${printFunctionName}() {
                                window.open('${suiteletUrl}', '_blank');
                            }
                        </script>
                    `;
                }
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
