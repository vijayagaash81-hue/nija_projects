/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/ui/serverWidget', 'N/url'], (log, serverWidget, url) => {

    const beforeLoad = (context) => {
        try {
            const form = context.form;
            const newRecord = context.newRecord;

            // 1. Programmatically set the default value on CREATE and EDIT if the field is empty
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                
                const overstayValue = newRecord.getValue({
                    fieldId: 'custrecord_dm_memocont_details'
                });

                // Only populate the default text if the field is currently blank/empty
                if (!overstayValue) {
                    const defaultText = `It has been observed that you have failed to report to the duty on the agreed date after your ANNUAL LEAVE completion which was approved from [[leave_start]] to [[leave_end]]. You have reported to duty on [[reporting_date]] with [[delay_days]] days' delay in joining. This is not at all acceptable to the management and HR as it is against our policy.

As a result of this noncompliance, you shall be liable to pay a fine amount of AED [[penalty_amount]] which will be deducted from your next salary.

Henceforth HRD Strictly instructs you to adhere to our company leaves policy.`;

                    // For Rich Text fields in beforeLoad, set the defaultValue on the form field directly to ensure NetSuite renders it
                    const memoField = form.getField({
                        id: 'custrecord_dm_memocont_details'
                    });

                    if (memoField) {
                        memoField.defaultValue = defaultText;
                        log.debug({
                            title: 'Default Value Set on Form Field',
                            details: `Populated empty field "custrecord_dm_memocont_details" on form in ${context.type} mode`
                        });
                    }
                }
            }

            // 2. Add the Print button in VIEW mode
            if (context.type === context.UserEventType.VIEW) {
                const recId = newRecord.id;

                log.debug({
                    title: 'Adding Print Button',
                    details: `Record ID: ${recId}`
                });

                const suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_njt_dis_memo_sl',
                    deploymentId: 'customdeploy_njt_dis_memo_sl',
                    params: {
                        id: recId
                    }
                });

                // Add the custom Print button
                form.addButton({
                    id: 'custpage_btn_print_dis_memo',
                    label: 'Print Disciplinary Memo',
                    functionName: 'printDisciplinaryMemo'
                });

                // Inject Client-Side logic via an INLINEHTML field
                const inlineHtmlField = form.addField({
                    id: 'custpage_dis_memo_inline_script',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Inline Script'
                });

                // Define the JavaScript function to open the Suitelet PDF in a new tab
                inlineHtmlField.defaultValue = `
                    <script type="text/javascript">
                        function printDisciplinaryMemo() {
                            window.open('${suiteletUrl}', '_blank');
                        }
                    </script>
                `;
            }

        } catch (e) {
            log.error({
                title: 'Error in beforeLoad User Event script',
                details: e
            });
        }
    };

    return {
        beforeLoad
    };

});
