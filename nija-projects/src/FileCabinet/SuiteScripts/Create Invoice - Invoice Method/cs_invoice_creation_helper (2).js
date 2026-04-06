/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * Description: Handles reloading the Suitelet and validating sublist data.
 */
define([], function() {

    /**
     * Function to be executed when a field is changed.
     * @param {Object} context The context object.
     * @param {Record} context.currentRecord The current form record.
     * @param {string} context.fieldId The internal ID of the field that was changed.
     */
    function fieldChanged(context) {
        if (context.fieldId === 'custpage_invoice_method') {
            var rec = context.currentRecord;
            var method = rec.getValue({ fieldId: 'custpage_invoice_method' });

            // Use the URL object to safely update parameters without losing script/deploy IDs
            var currentUrl = new URL(window.location.href);

            if (method) {
                currentUrl.searchParams.set('method', method);
            } else {
                currentUrl.searchParams.delete('method');
            }

            // Bypass the NetSuite "Changes you made may not be saved" popup
            if (typeof window !== 'undefined' && window.onbeforeunload) {
                window.onbeforeunload = null;
            }
            
            window.location.replace(currentUrl.toString());
        }
    }

    return {
        fieldChanged: fieldChanged,
        validateLine: validateLine,
        saveRecord: saveRecord
    };

    /**
     * Validation function to be executed when a sublist line is committed.
     * @param {Object} context The context object.
     * @param {Record} context.currentRecord The current form record.
     * @param {string} context.sublistId The internal ID of the sublist.
     * @returns {boolean} Return true if the line is valid, or false to prevent the line from being committed.
     */
    function validateLine(context) {
        if (context.sublistId === 'custpage_item_sublist') {
            var rec = context.currentRecord;

            var qtyStr = rec.getCurrentSublistValue({
                sublistId: context.sublistId,
                fieldId: 'custpage_invoice_quantity'
            });

            // Allow the user to leave the line blank
            if (!qtyStr) return true;
            
            var qty = parseFloat(qtyStr) || 0;
            var remaining = parseFloat(rec.getCurrentSublistValue({
                sublistId: context.sublistId,
                fieldId: 'custpage_qty_remaining'
            }) || 0);

            if (qty < 0) {
                alert('Quantity cannot be negative.');
                return false;
            }

            if (qty > remaining) {
                alert('Quantity cannot exceed remaining quantity (' + remaining + ').');
                // UX Polish: Auto-clear the invalid entry so the user can try again easily
                rec.setCurrentSublistValue({
                    sublistId: context.sublistId,
                    fieldId: 'custpage_invoice_quantity',
                    value: '',
                    ignoreFieldChange: true
                });
                return false;
            }
        }

        return true;
    }

    /**
     * Validation function to be executed before the record is submitted.
     * @param {Object} context The context object.
     * @param {Record} context.currentRecord The current form record.
     * @returns {boolean} Return true if the record is valid, or false to prevent submission.
     */
    function saveRecord(context) {
        var rec = context.currentRecord;
        var method = rec.getValue({ fieldId: 'custpage_invoice_method' });

        // Only apply the empty grid check if they are using the Quantity method
        if (method === 'quantity') {
            var count = rec.getLineCount({ sublistId: 'custpage_item_sublist' });

            for (var i = 0; i < count; i++) {
                var qty = rec.getSublistValue({
                    sublistId: 'custpage_item_sublist',
                    fieldId: 'custpage_invoice_quantity',
                    line: i
                });

                if (qty && parseFloat(qty) > 0) {
                    return true; // Found at least one valid line
                }
            }

            alert('Please enter a quantity greater than 0 for at least one item to invoice.');
            return false; // Stop submission
        }

        return true;
    }
});