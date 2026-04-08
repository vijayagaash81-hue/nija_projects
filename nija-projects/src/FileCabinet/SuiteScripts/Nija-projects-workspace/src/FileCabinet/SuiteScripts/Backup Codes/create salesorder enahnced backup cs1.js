/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * Description: Handles the dynamic display of fields on the 'Generate Invoice' Suitelet form.
 */
define([], function() {

    /**
     * Function to be executed after page is initialized.
     * @param {Object} context The context object.
     * @param {Record} context.currentRecord The current form record.
     */
    function pageInit(context) {
        // 1. Run the toggle logic first so NetSuite native inline styles are applied
        toggleFields(context.currentRecord);

        // 2. ONLY THEN remove the anti-flicker CSS so we don't get a flash of visible fields
        if (typeof window !== 'undefined' && window.document) {
            var styleNode = window.document.getElementById('anti_flicker_css');
            if (styleNode && styleNode.parentNode) {
                styleNode.parentNode.removeChild(styleNode);
            }
        }
    }

    /**
     * Function to be executed when a field is changed.
     * @param {Object} context The context object.
     * @param {Record} context.currentRecord The current form record.
     * @param {string} context.fieldId The internal ID of the field that was changed.
     */
    function fieldChanged(context) {
        if (context.fieldId === 'custpage_invoice_method') {
            toggleFields(context.currentRecord);
        }
    }

    /**
     * Helper function to show/hide fields based on the selected Invoice Method.
     * @param {Record} currentRecord The current form record.
     */
    function toggleFields(currentRecord) {
        var invoiceMethod = currentRecord.getValue({ fieldId: 'custpage_invoice_method' });

        var isPercentage = (invoiceMethod === 'percentage');
        var isQuantity = (invoiceMethod === 'quantity');

        // Toggle visibility and mandatory status for Percentage fields
        ['custpage_inv_type', 'custpage_percentage', 'custpage_advance_pct', 'custpage_cogs_pct'].forEach(function(fieldId) {
            var field = currentRecord.getField({ fieldId: fieldId });
            if (field) {
                field.isDisplay = isPercentage;
                if (fieldId === 'custpage_inv_type' || fieldId === 'custpage_percentage') {
                    field.isMandatory = isPercentage;
                }
            }
        });

        // Toggle visibility for the Quantity sublist using standard DOM manipulation
        // because N/currentRecord Sublist does not support the .isDisplay property
        if (typeof window !== 'undefined' && window.document) {
            var sublistLayer = window.document.getElementById('custpage_item_sublist_layer');
            if (sublistLayer) {
                sublistLayer.style.display = isQuantity ? '' : 'none';
            }
        }
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };
});