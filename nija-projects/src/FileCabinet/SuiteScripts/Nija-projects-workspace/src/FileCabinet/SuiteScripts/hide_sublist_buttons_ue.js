/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @Description Hides the "New", "Attach", and "Customize View" buttons on specified child sublists using CSS and JS injection.
 */
define(['N/ui/serverWidget', 'N/runtime', 'N/log'], (serverWidget, runtime, log) => {

    // HARDCODED CONFIGURATION (Alternative to using Script Parameters)
    const CONFIG = {
        // Add your sublist IDs here if you prefer to hardcode them.
        // Example: ['recrecmachcustrecord_my_child_field', 'recrecordcustomrecord_my_child_record']
        SUBLIST_IDS: ['recmachcustrecord_hris_lvbal_employee_name', 'recmachcustrecord_hris_staff_employee_link']
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
            // Only execute in the User Interface
            const executionContext = runtime.executionContext;
            log.debug({
                title: 'beforeLoad Execution Started',
                details: `Context: ${executionContext}, Event Type: ${scriptContext.type}`
            });

            if (executionContext !== runtime.ContextType.USER_INTERFACE) {
                return;
            }

            const form = scriptContext.form;

            // Get sublist IDs from script parameter or configuration
            const script = runtime.getCurrentScript();
            const paramSublistIds = script.getParameter({ name: 'custscript_hide_sublist_ids' });

            let targetSublistIds = [];
            if (paramSublistIds) {
                // Split comma-separated parameter values
                targetSublistIds = paramSublistIds.split(',').map(id => id.trim()).filter(id => id.length > 0);
            } else {
                targetSublistIds = CONFIG.SUBLIST_IDS;
            }

            if (targetSublistIds.length === 0) {
                log.debug({
                    title: 'No Sublists Specified',
                    details: 'Please configure the "custscript_hide_sublist_ids" parameter or update CONFIG.SUBLIST_IDS in the script.'
                });
                return;
            }

            // Generate DOM variants for each sublist ID to guarantee matching in the HTML document.
            // NetSuite uses recrecmach... in DOM, but recmach... in SuiteScript server API.
            // When attaching records, NetSuite also prepends "existing" to the field IDs.
            let domSublistIds = [];
            targetSublistIds.forEach(id => {
                domSublistIds.push(id);
                domSublistIds.push('existing' + id);

                // Variant 1: recmach -> recrecmach / existingrecmach
                if (id.indexOf('recrecmach') === 0) {
                    var rawRecmach = id.substring(3); // recmach...
                    domSublistIds.push(rawRecmach);
                    domSublistIds.push('existing' + rawRecmach);
                } else if (id.indexOf('recmach') === 0) {
                    domSublistIds.push('rec' + id); // recrecmach...
                    domSublistIds.push('existing' + id);
                    domSublistIds.push('existingrec' + id);
                }

                // Variant 2: customrecord -> recrecordcustomrecord
                if (id.indexOf('recrecord') === 0) {
                    domSublistIds.push(id.substring(3)); // record...
                    domSublistIds.push(id.replace('recrecord', '')); // customrecord...
                    domSublistIds.push('existing' + id.replace('recrecord', ''));
                } else if (id.indexOf('customrecord') === 0) {
                    domSublistIds.push('recrecord' + id);
                    domSublistIds.push('rec' + id);
                    domSublistIds.push('existing' + id);
                    domSublistIds.push('existingrecrecord' + id);
                }

                // Variant 3: generic prepend
                if (id.indexOf('rec') !== 0) {
                    domSublistIds.push('rec' + id);
                    domSublistIds.push('recrec' + id);
                    domSublistIds.push('existing' + id);
                }
            });

            // Keep only unique elements
            domSublistIds = domSublistIds.filter((item, pos) => domSublistIds.indexOf(item) === pos);

            log.debug({
                title: 'Hiding Sublist Buttons',
                details: `Configured Sublist IDs: ${targetSublistIds.join(', ')} | Generated DOM IDs: ${domSublistIds.join(', ')}`
            });

            // Generate CSS rules for instant hiding (prevents element flash/flicker on load)
            let cssContent = '';
            domSublistIds.forEach(sublistId => {
                // Determine if this is the 'existing' select field variant
                const isExistingField = sublistId.indexOf('existing') === 0;

                cssContent += `
                    /* --- Hiding New / Add buttons for sublist: ${sublistId} --- */
                    #new${sublistId},
                    #new_${sublistId},
                    #${sublistId}_insert,
                    #${sublistId}_add,
                    td[id^="new${sublistId}"],
                    td[id$="${sublistId}_insert_cell"],
                    td[id$="${sublistId}_add_cell"],
                    [id*="${sublistId}"] input[value="New"],
                    [id*="${sublistId}"] input[value*="New"],
                    [id*="${sublistId}"] button[value*="New"],
                    [id*="${sublistId}"] a[id*="new"] {
                        display: none !important;
                    }

                    /* --- Hiding Attach buttons for sublist: ${sublistId} --- */
                    #attach${sublistId},
                    #attach_${sublistId},
                    #${sublistId}_attach,
                    td[id^="attach${sublistId}"],
                    td[id$="${sublistId}_attach_cell"],
                    [id*="${sublistId}"] input[value="Attach"],
                    [id*="${sublistId}"] input[value*="Attach"],
                    [id*="${sublistId}"] button[value*="Attach"],
                    [id*="${sublistId}"] a[id*="attach"] {
                        display: none !important;
                    }

                    /* --- Hiding Attach Select Dropdown & Label for sublist: ${sublistId} --- */
                    ${isExistingField ? `#${sublistId}, #${sublistId}_cell,` : ''}
                    #${sublistId}_fs,
                    #${sublistId}_fs_lbl,
                    #${sublistId}_fs_lbl_lnk,
                    #${sublistId}_txt,
                    #${sublistId}_display,
                    #${sublistId}_select,
                    #${sublistId}_dropdown,
                    td[id^="${sublistId}_fs"],
                    td[id^="${sublistId}_txt"],
                    td[id^="${sublistId}_display"],
                    td[id^="${sublistId}_dropdown"],
                    td[id^="${sublistId}_cell"],
                    td[id$="${sublistId}_cell"],
                    [id*="${sublistId}"] .nscombobox,
                    [id*="${sublistId}"] .nscombobox-input,
                    [id*="${sublistId}"] img[id*="_dropdown"],
                    [id*="${sublistId}"] td[id*="_select"],
                    [id*="${sublistId}"] td[id*="_txt"] {
                        display: none !important;
                    }

                    /* --- Hiding Customize View buttons/dropdowns/menus for sublist: ${sublistId} --- */
                    #${sublistId}_customize,
                    #${sublistId}_customize_view,
                    #${sublistId}customize,
                    td[id^="${sublistId}_customize"],
                    td[id$="${sublistId}_customize_cell"],
                    td[id$="${sublistId}customize_cell"],
                    #${sublistId}_buttons .uir-list-header-button-customize,
                    #${sublistId}_buttons td[id*="customize"],
                    #${sublistId}_header .uir-list-header-button-customize,
                    #${sublistId}_header [title*="Customize"],
                    #${sublistId}_header .uir-list-header-button-view,
                    #${sublistId}_header [title*="View"],
                    /* Attribute selectors for broad coverage */
                    [id*="${sublistId}"] input[value="Customize View"],
                    [id*="${sublistId}"] input[value*="Customize"],
                    [id*="${sublistId}"] button[value*="Customize"],
                    [id*="${sublistId}"] a[id*="customize"],
                    [id*="${sublistId}"] a[id*="Customize"],
                    [id*="${sublistId}"] a[class*="customize"],
                    [id*="${sublistId}"] a[class*="Customize"],
                    [id*="${sublistId}"] .uir-list-header-button-customize,
                    [id*="${sublistId}"] .uir-list-header-button-view,
                    [id*="${sublistId}"] td[id*="customize"],
                    [id*="${sublistId}"] td[id*="Customize"],
                    div[id^="${sublistId}"] .uir-list-header-button-customize,
                    div[id^="${sublistId}"] .uir-list-header-button-view,
                    div[id^="${sublistId}"] td.uir-list-header-customize,
                    div[id^="${sublistId}"] a[title*="Customize"],
                    div[id^="${sublistId}"] img[title*="Customize"],
                    div[id^="${sublistId}"] span[title*="Customize"],
                    div[id^="${sublistId}"] [data-action="customize-view"] {
                        display: none !important;
                    }
                `;
            });

            // Generate JS backup to clean up cells and elements dynamically
            let jsContent = '';
            domSublistIds.forEach(sublistId => {
                jsContent += `
                    try {
                        var subId = '${sublistId}';
                        
                        function hideButtons() {
                            // Find buttons by standard IDs and hide their parent cell (TD) wrapper
                            jQuery('#new' + subId + ', #' + subId + '_insert, #new_' + subId).closest('td').hide();
                            jQuery('#attach' + subId + ', #' + subId + '_attach, #attach_' + subId).closest('td').hide();
                            jQuery('#' + subId + '_customize, #' + subId + '_customize_view, #' + subId + 'customize').closest('td').hide();
                            
                            // Find and hide the select field wrapper cell and the label cell
                            var targets = [
                                '#' + subId + '_fs',
                                '#' + subId + '_txt',
                                '#' + subId + '_display',
                                '#' + subId + '_select',
                                '#' + subId + '_dropdown',
                                '#' + subId + '_cell'
                            ];
                            
                            // If this is the 'existing' select field variant, target it directly
                            if (subId.indexOf('existing') === 0) {
                                targets.push('#' + subId);
                            }

                            targets.forEach(function(selector) {
                                var el = jQuery(selector);
                                if (el.length) {
                                    el.hide();
                                    el.closest('td').hide();
                                    // Hide the label (which is usually the previous TD cell)
                                    el.closest('td').prev('td').hide();
                                }
                            });

                            // Find combobox input and hide it and its preceding label cell
                            var comboInput = jQuery('#new' + subId + '_txt, #' + subId + '_txt, #' + subId + '_display, [id*="' + subId + '"] .nscombobox-input');
                            comboInput.each(function() {
                                var txtEl = jQuery(this);
                                txtEl.hide();
                                txtEl.closest('td').hide();
                                // Hide the dropdown arrow if it's in a separate cell
                                txtEl.closest('td').next('td').has('img[id*="dropdown"]').hide();
                                // Hide the label cell (which usually immediately precedes the input cell)
                                txtEl.closest('td').prev('td').hide();
                            });
                            
                            // Text-based fallback search inside the sublist toolbar to ensure we catch all buttons
                            jQuery('#' + subId + '_buttons input[value*="Customize"], #' + subId + '_buttons a:contains("Customize")').closest('td').hide();
                            jQuery('#' + subId + '_buttons input[value*="New"], #' + subId + '_buttons a:contains("New")').closest('td').hide();
                            jQuery('#' + subId + '_buttons input[value*="Attach"], #' + subId + '_buttons a:contains("Attach")').closest('td').hide();

                            // Attribute-based fallback search anywhere inside the sublist containers
                            jQuery('[id*="' + subId + '"] input[value="Attach"]').closest('td').hide();
                            jQuery('[id*="' + subId + '"] input[value="Customize View"]').closest('td').hide();
                            jQuery('[id*="' + subId + '"] input[value*="Customize"]').closest('td').hide();
                            jQuery('[id*="' + subId + '"] input[value*="New"]').closest('td').hide();

                            // Target customize view on headers/panes
                            var headerContainer = jQuery('#' + subId + '_header, #' + subId + '_pane, [id^="' + subId + '"]');
                            headerContainer.find('.uir-list-header-button-customize, [title*="Customize"], a:contains("Customize")').hide();
                            headerContainer.find('.uir-list-header-button-view, [title*="View"], a:contains("View")').hide();
                        }
                        
                        // Execute immediately
                        hideButtons();
                        
                        // Execute on window load
                        jQuery(window).on('load', hideButtons);
                        
                        // Execute on a short delay to catch post-onload renders
                        setTimeout(hideButtons, 500);
                        setTimeout(hideButtons, 1500);
                        
                        // Set up MutationObserver to handle dynamic sublist refreshes/re-renders
                        if (window.MutationObserver) {
                            var targetNode = document.getElementById(subId + '_pane') || document.getElementById(subId + '_div') || document.getElementById(subId + '_buttons') || document.body;
                            if (targetNode) {
                                var observer = new MutationObserver(hideButtons);
                                observer.observe(targetNode, { childList: true, subtree: true });
                            }
                        }
                    } catch (err) {
                        console.error('Error hiding sublist buttons for ' + subId + ':', err);
                    }
                `;
            });

            // Create an Inline HTML field to inject the CSS and JS
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
