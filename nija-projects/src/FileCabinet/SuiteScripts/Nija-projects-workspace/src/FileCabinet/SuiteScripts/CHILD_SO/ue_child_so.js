/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/url', 'N/record'], (serverWidget, url, record) => {

    const beforeLoad = (context) => {

        try {
            const form = context.form;
            const rec = context.newRecord;

            // ==============================
            // 1. ADD BUTTON (VIEW MODE ONLY)
            // ==============================
            if (context.type === context.UserEventType.VIEW) {

                const parentId = rec.id;

                // Resolve URL to create new Sales Order
                const suiteletURL = url.resolveScript({
                    scriptId: 'customscript_child_so_sl',   
                    deploymentId: 'customdeploy_child_so_sl',
                    params: {
                        parentId: parentId
                    }
                });

                form.addButton({
                    id: 'custpage_create_child_so',
                    label: 'Child SO',
                    functionName: `openChildSO('${suiteletURL}')`
                });

                // Attach client script
                form.clientScriptModulePath = './cs_child_so.js';
            }

            // ==========================================
            // 2. HANDLE CHILD SO (CREATE MODE)
            // ==========================================
            if (context.type === context.UserEventType.CREATE) {

                const request = context.request;

                if (request && request.parameters.parentId) {

                    const parentId = request.parameters.parentId;

                    // Set parent reference field
                    rec.setValue({
                        fieldId: 'custbody_parent_so', // 🔁 your custom field
                        value: parentId
                    });

                    // ==============================
                    // LOAD PARENT SO
                    // ==============================
                    const parentSO = record.load({
                        type: record.Type.SALES_ORDER,
                        id: parentId
                    });

                    // Copy some body fields (optional)
                    rec.setValue({
                        fieldId: 'entity',
                        value: parentSO.getValue('entity')
                    });

                    rec.setValue({
                        fieldId: 'location',
                        value: parentSO.getValue('location')
                    });

                    rec.setValue({
                        fieldId: 'trandate',
                        value: new Date()
                    });

                    // ==============================
                    // COPY ITEM LINES
                    // ==============================
                    const lineCount = parentSO.getLineCount({ sublistId: 'item' });

                    for (let i = 0; i < lineCount; i++) {

                        const item = parentSO.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        });

                        const quantity = parentSO.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        });

                        const rate = parentSO.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: i
                        });

                        rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i,
                            value: item
                        });

                        rec.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i,
                            value: quantity
                        });

                        // Optional
                        if (rate) {
                            rec.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                line: i,
                                value: rate
                            });
                        }
                    }
                }
            }

        } catch (e) {
            log.error('Error in beforeLoad', e);
        }
    };

    return {
        beforeLoad
    };
});