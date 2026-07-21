/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Description Hides specified child sublist(s) and subtab(s) on a parent record form using SuiteScript API and CSS injection fallback.
 */
define(['N/ui/serverWidget', 'N/runtime', 'N/log'], (serverWidget, runtime, log) => {

    // Default configuration (Set your recmach sublist IDs here if not using script parameters)
    // Example: ['recmachcustrecord_test_child_parent_field']
    const CONFIG = {
        SUBLIST_IDS: ['recmachcustrecord_test_parent_link']
    };

    /**
     * Function definition to be triggered before record is loaded.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     */
    const beforeLoad = (scriptContext) => {
        try {
            // Only execute in VIEW and EDIT modes (skip CREATE mode)
            if (scriptContext.type !== scriptContext.UserEventType.VIEW && 
                scriptContext.type !== scriptContext.UserEventType.EDIT) {
                return;
            }

            // Only execute in the User Interface context
            const executionContext = runtime.executionContext;
            if (executionContext !== runtime.ContextType.USER_INTERFACE) {
                return;
            }

            const form = scriptContext.form;
            const script = runtime.getCurrentScript();

            // Retrieve sublist IDs from script parameter 'custscript_hide_child_sublist_ids' if provided
            const paramSublistIds = script.getParameter({ name: 'custscript_hide_child_sublist_ids' });
            let targetSublistIds = [];

            if (paramSublistIds) {
                targetSublistIds = paramSublistIds.split(',').map(id => id.trim()).filter(id => id.length > 0);
            } else {
                targetSublistIds = CONFIG.SUBLIST_IDS;
            }

            if (targetSublistIds.length === 0) {
                log.debug({
                    title: 'No Sublists Specified',
                    details: 'No sublist IDs found in script parameter custscript_hide_child_sublist_ids or CONFIG.SUBLIST_IDS.'
                });
                return;
            }

            log.debug({
                title: 'Hiding Child Sublists',
                details: `Target Sublist IDs: ${targetSublistIds.join(', ')}`
            });

            let cssRules = '';

            targetSublistIds.forEach(sublistId => {
                // 1. Hide sublist via standard SuiteScript API
                try {
                    const sublistObj = form.getSublist({ id: sublistId });
                    if (sublistObj) {
                        sublistObj.displayType = serverWidget.SublistDisplayType.HIDDEN;
                    }
                } catch (subErr) {
                    log.warn({
                        title: 'Sublist API Hide Warning',
                        details: `Could not hide sublist ${sublistId} via API: ${subErr.message}`
                    });
                }

                // 2. Generate CSS selector fallback to ensure subtab and sublist pane are hidden in UI
                const domVariants = [
                    sublistId,
                    'rec' + sublistId,
                    'recrec' + sublistId.replace(/^recmach/, '')
                ];

                domVariants.forEach(id => {
                    cssRules += `
                        #${id}_tab,
                        #${id}_pane,
                        #${id}_div,
                        #${id}_layer,
                        #${id}_lnk {
                            display: none !important;
                        }
                    `;
                });
            });

            // 3. Inject CSS into form via Inline HTML field
            if (cssRules) {
                const inlineHtmlField = form.addField({
                    id: 'custpage_hide_child_sublists_css',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: ' '
                });

                inlineHtmlField.defaultValue = `<style type="text/css">${cssRules}</style>`;
            }

        } catch (e) {
            log.error({
                title: 'Error in beforeLoad (Hide Child Sublist)',
                details: e.toString()
            });
        }
    };

    return {
        beforeLoad
    };
});
