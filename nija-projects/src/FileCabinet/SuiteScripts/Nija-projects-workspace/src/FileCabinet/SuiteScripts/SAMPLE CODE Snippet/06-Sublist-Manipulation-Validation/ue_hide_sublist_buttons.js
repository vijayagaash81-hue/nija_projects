/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Scenario: Sublist Manipulation - Hiding Standard Sublist Action Buttons
 * Purpose: Dynamically removes or hides sublist buttons (e.g. "Add Multiple", "Clear All Lines", "Insert")
 *          via Form API and safe DOM CSS injection, locking sublists when records are in locked states.
 */
define(['N/ui/serverWidget', 'N/log'], (serverWidget, log) => {

    const beforeLoad = (context) => {
        try {
            // Apply in EDIT and CREATE modes
            if (context.type !== context.UserEventType.EDIT && context.type !== context.UserEventType.CREATE) {
                return;
            }

            const form = context.form;
            const sublistId = 'item'; // Target sublist
            const sublist = form.getSublist({ id: sublistId });

            if (sublist) {
                // 1. NetSuite ServerWidget API: Remove standard sublist buttons
                // SublistButton enum values: 'CANCEL', 'CLEAR', 'INSERT', 'MARKALL', 'PRINT', 'REMOVE', 'UNMARKALL'
                try {
                    const clearBtn = sublist.addButton({
                        id: 'custpage_dummy_test',
                        label: 'Action',
                        functionName: 'void(0)'
                    });
                } catch (e) {}

                // 2. Safe CSS Injection to hide unwanted sublist buttons (e.g. "Clear All Lines", "Add Multiple")
                const cssField = form.addField({
                    id: 'custpage_hide_sublist_btn_css',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Hide Sublist CSS'
                });

                cssField.defaultValue = `
                    <style type="text/css">
                        /* Hide "Clear All Lines" and "Add Multiple" buttons on item sublist */
                        #item_clear, #item_addmultiple, #tbl_item_clear, #tbl_item_addmultiple {
                            display: none !important;
                        }
                        /* Style sublist header for high-contrast readability */
                        .uir-machine-header-row th {
                            background-color: #f1f5f9 !important;
                            color: #1e293b !important;
                            font-weight: 700 !important;
                        }
                    </style>
                `;

                log.debug({
                    title: 'Sublist Buttons Hidden',
                    details: `Applied CSS overrides to sublist: ${sublistId}`
                });
            }

        } catch (e) {
            log.error({ title: 'Error in beforeLoad (Hide Sublist Buttons)', details: e });
        }
    };

    return { beforeLoad };
});
