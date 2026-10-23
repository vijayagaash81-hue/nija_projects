/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Scenario: Open Record & Source Fields via Button
 * Purpose: Adds a custom button on the source transaction/custom record in VIEW mode.
 *          When clicked, it opens a target record in CREATE mode, passing the source Record ID
 *          and custom URL parameters so the Client Script can pre-populate fields & sublist lines.
 */
define(['N/url', 'N/log', 'N/ui/serverWidget'], (url, log, serverWidget) => {

    /**
     * Defines the function that is executed before a form is loaded.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     */
    const beforeLoad = (scriptContext) => {
        try {
            // Only display the action button in VIEW mode
            if (scriptContext.type !== scriptContext.UserEventType.VIEW) {
                return;
            }

            const currentRec = scriptContext.newRecord;
            const form = scriptContext.form;
            const sourceRecId = currentRec.id;
            const sourceRecType = currentRec.type;

            // Optional: Check status or conditions before showing the button
            // e.g., const approvalStatus = currentRec.getValue('custrecord_approval_status');

            // 1. Resolve target record URL in CREATE mode
            // Example: Opening a custom record 'customrecord_work_order' or standard 'salesorder'
            const targetRecType = 'customrecord_work_order'; // Change to your target record type
            const createRecordUrl = url.resolveRecord({
                recordType: targetRecType,
                isEditMode: true // opens in edit/create mode
            });

            // 2. Append source parameters to the URL
            // customSourceId: ID of source record (e.g., Material Request, Production Order)
            // customSourceType: Type string for dynamic handling
            const redirectUrl = `${createRecordUrl}&customSourceId=${encodeURIComponent(sourceRecId)}&customSourceType=${encodeURIComponent(sourceRecType)}`;

            // 3. Option A: Attach Client Script via form.clientScriptModulePath
            // form.clientScriptModulePath = './cs_source_fields_on_create.js';

            // 4. Option B: Inject lightweight inline trigger for direct button click
            const inlineScriptField = form.addField({
                id: 'custpage_open_record_script',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Inline Script'
            });

            inlineScriptField.defaultValue = `
                <script type="text/javascript">
                    function openCreateRecordWithSourcing() {
                        var targetUrl = "${redirectUrl}";
                        window.open(targetUrl, '_blank');
                    }
                </script>
            `;

            // 5. Add custom button on Form
            form.addButton({
                id: 'custpage_btn_create_child_rec',
                label: 'Generate Work Order',
                functionName: 'openCreateRecordWithSourcing'
            });

            log.debug({
                title: 'Create Button Added',
                details: `Source ID: ${sourceRecId}, Target URL: ${redirectUrl}`
            });

        } catch (e) {
            log.error({
                title: 'Error in beforeLoad (Open Record Button)',
                details: e
            });
        }
    };

    return { beforeLoad };
});
