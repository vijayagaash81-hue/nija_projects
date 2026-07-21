/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @Description Hides "searchid" and "existingrecmachcustrecord_test_parent_link" ONLY inside the specified sublist ("recmachcustrecord_test_parent_link") without affecting other sublists or the data grid.
 */
define(['N/ui/serverWidget', 'N/runtime', 'N/log'], (serverWidget, runtime, log) => {

    // HARDCODED CONFIGURATION (Alternative to using Script Parameters)
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
            // Only execute in the User Interface context
            const executionContext = runtime.executionContext;
            if (executionContext !== runtime.ContextType.USER_INTERFACE) {
                return;
            }

            const form = scriptContext.form;
            const script = runtime.getCurrentScript();
            const paramSublistIds = script.getParameter({ name: 'custscript_hide_sublist_ids' });

            let targetSublistIds = [];
            if (paramSublistIds) {
                targetSublistIds = paramSublistIds.split(',').map(id => id.trim()).filter(id => id.length > 0);
            } else {
                targetSublistIds = CONFIG.SUBLIST_IDS;
            }

            log.debug({
                title: 'Hiding Specific Sublist Fields & Controls',
                details: `Scoped Sublists: ${targetSublistIds.join(', ')}`
            });

            let cssContent = '';

            // Generate CSS rules strictly scoped to each target sublist container
            targetSublistIds.forEach(sublistId => {
                const rawFieldId = sublistId.replace(/^recmach/, '').replace(/^rec/, ''); // e.g. custrecord_test_parent_link
                const cleanId = sublistId.replace(/^rec/, '');

                cssContent += `
                    /* --- Scoped rules ONLY inside sublist container: ${sublistId} --- */
                    [id*="${rawFieldId}"] #searchid,
                    [id*="${rawFieldId}"] #searchid_fs,
                    [id*="${rawFieldId}"] #searchid_fs_lbl,
                    [id*="${rawFieldId}"] #searchid_lbl,
                    [id*="${rawFieldId}"] #searchid_txt,
                    [id*="${rawFieldId}"] #searchid_display,
                    [id*="${rawFieldId}"] #searchid_select,
                    [id*="${rawFieldId}"] #searchid_cell,
                    [id*="${rawFieldId}"] select[name="searchid"],
                    [id*="${rawFieldId}"] select[name*="searchid"],
                    [id*="${rawFieldId}"] select[id*="searchid"],

                    [id*="${rawFieldId}"] #existing${sublistId},
                    [id*="${rawFieldId}"] #existing${sublistId}_fs,
                    [id*="${rawFieldId}"] #existing${sublistId}_fs_lbl,
                    [id*="${rawFieldId}"] #existing${sublistId}_lbl,
                    [id*="${rawFieldId}"] #existing${sublistId}_txt,
                    [id*="${rawFieldId}"] #existing${sublistId}_display,
                    [id*="${rawFieldId}"] #existing${sublistId}_select,
                    [id*="${rawFieldId}"] #existing${sublistId}_cell,
                    [id*="${rawFieldId}"] select[name="existing${sublistId}"],
                    [id*="${rawFieldId}"] select[name*="existing${rawFieldId}"],

                    [id*="${rawFieldId}"] #new${sublistId},
                    [id*="${rawFieldId}"] #new_${sublistId},
                    [id*="${rawFieldId}"] #${sublistId}_insert,
                    [id*="${rawFieldId}"] #${sublistId}_add,
                    [id*="${rawFieldId}"] #attach${sublistId},
                    [id*="${rawFieldId}"] #attach_${sublistId},
                    [id*="${rawFieldId}"] #${sublistId}_attach,
                    [id*="${rawFieldId}"] #${sublistId}_customize,
                    [id*="${rawFieldId}"] #${sublistId}_customize_view,
                    [id*="${rawFieldId}"] #${sublistId}customize,
                    [id*="${rawFieldId}"] #existing${cleanId},
                    [id*="${rawFieldId}"] #existing${cleanId}_fs {
                        display: none !important;
                    }
                `;
            });

            // Targeted JS DOM manipulation scoped to the target sublist
            let jsContent = `
                function hideTargetSublistFields() {
                    try {
                        var sublistIds = ${JSON.stringify(targetSublistIds)};
                        sublistIds.forEach(function(subId) {
                            var rawFieldId = subId.replace(/^recmach/, '').replace(/^rec/, '');

                            // Find all DOM containers strictly belonging to this sublist
                            var $containers = jQuery('[id*="' + rawFieldId + '"]');

                            $containers.each(function() {
                                var $c = jQuery(this);

                                // 1. Hide searchid ONLY inside this sublist
                                $c.find('#searchid, select[name="searchid"], select[name*="searchid"], select[id*="searchid"]').each(function() {
                                    var $el = jQuery(this);
                                    $el.hide();
                                    var $td = $el.closest('td');
                                    if ($td.length) {
                                        $td.hide();
                                        var $prev = $td.prev('td');
                                        if ($prev.length && ($prev.text().toUpperCase().indexOf('VIEW') !== -1 || $prev.hasClass('smallgraytextheader'))) {
                                            $prev.hide();
                                        }
                                    }
                                });

                                // 2. Hide existing attach field ONLY inside this sublist
                                $c.find('#existing' + subId + ', select[name="existing' + subId + '"], [id*="existing' + rawFieldId + '"]').each(function() {
                                    var $el = jQuery(this);
                                    $el.hide();
                                    var $td = $el.closest('td');
                                    if ($td.length) {
                                        $td.hide();
                                        var $prev = $td.prev('td');
                                        if ($prev.length) {
                                            $prev.hide();
                                        }
                                    }
                                });

                                // 3. Hide sublist buttons ONLY inside this sublist
                                $c.find('#new' + subId + ', #' + subId + '_insert, #new_' + subId + ', #attach' + subId + ', #' + subId + '_attach, #' + subId + '_customize, #' + subId + '_customize_view').each(function() {
                                    jQuery(this).closest('td').hide();
                                });
                            });
                        });
                    } catch (e) {
                        console.error('Error in hideTargetSublistFields:', e);
                    }
                }

                // Execute on page load events
                hideTargetSublistFields();
                jQuery(document).ready(hideTargetSublistFields);
                jQuery(window).on('load', hideTargetSublistFields);
                setTimeout(hideTargetSublistFields, 500);
                setTimeout(hideTargetSublistFields, 1500);

                if (window.MutationObserver) {
                    var observer = new MutationObserver(hideTargetSublistFields);
                    var bodyNode = document.body;
                    if (bodyNode) {
                        observer.observe(bodyNode, { childList: true, subtree: true });
                    }
                }
            `;

            // Inject Inline HTML CSS & JS into the form
            const inlineHtmlField = form.addField({
                id: 'custpage_hide_sublist_btns_field',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' '
            });

            inlineHtmlField.defaultValue = `
                <style type="text/css">
                    ${cssContent}
                </style>
                <script type="text/javascript">
                    require(['N/jQuery'], function(jQuery) {
                        jQuery(document).ready(function() {
                            ${jsContent}
                        });
                    });
                </script>
            `;

        } catch (e) {
            log.error({
                title: 'Error in beforeLoad (Hide Sublist Buttons)',
                details: e.toString()
            });
        }
    };

    return {
        beforeLoad
    };
});
