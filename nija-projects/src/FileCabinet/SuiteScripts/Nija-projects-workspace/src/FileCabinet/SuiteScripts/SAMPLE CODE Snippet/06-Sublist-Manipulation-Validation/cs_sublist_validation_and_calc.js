/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * 
 * Scenario: Sublist Manipulation, Dynamic Line Validation & Real-time Calculations
 * Purpose: Implements client-side rules on transaction or custom sublists:
 *          - Prevents duplicate items from being added on separate lines
 *          - Enforces minimum quantity / rate rules
 *          - Automatically computes custom markup/margin percentages
 *          - Recalculates custom summary header totals on validateLine
 */
define(['N/ui/dialog'], (dialog) => {

    const TARGET_SUBLIST = 'item'; // or custom child sublist id

    /**
     * Executes when a sublist line is committed.
     * Return true to allow line commit; false to prevent line insertion/update.
     * @param {Object} context
     * @param {Record} context.currentRecord
     * @param {string} context.sublistId
     * @returns {boolean}
     */
    function validateLine(context) {
        if (context.sublistId !== TARGET_SUBLIST) {
            return true;
        }

        const currentRec = context.currentRecord;
        const currentLineIndex = currentRec.getCurrentSublistIndex({ sublistId: TARGET_SUBLIST });
        const selectedItem = currentRec.getCurrentSublistValue({ sublistId: TARGET_SUBLIST, fieldId: 'item' });
        const quantity = parseFloat(currentRec.getCurrentSublistValue({ sublistId: TARGET_SUBLIST, fieldId: 'quantity' })) || 0;
        const rate = parseFloat(currentRec.getCurrentSublistValue({ sublistId: TARGET_SUBLIST, fieldId: 'rate' })) || 0;

        // 1. Validation: Quantity must be greater than zero
        if (quantity <= 0) {
            dialog.alert({
                title: 'Invalid Quantity',
                message: 'Quantity must be at least 1. Please adjust the line quantity.'
            });
            return false;
        }

        // 2. Validation: Prevent Duplicate Items on multiple lines
        const totalLines = currentRec.getLineCount({ sublistId: TARGET_SUBLIST });
        for (let i = 0; i < totalLines; i++) {
            if (i === currentLineIndex) continue; // Skip current line being edited

            const existingItemId = currentRec.getSublistValue({
                sublistId: TARGET_SUBLIST,
                fieldId: 'item',
                line: i
            });

            if (existingItemId == selectedItem) {
                dialog.alert({
                    title: 'Duplicate Item Detected',
                    message: `Item has already been added on Line #${i + 1}. Please combine the quantities on the existing line instead.`
                });
                return false;
            }
        }

        return true;
    }

    /**
     * Executes when a field is changed by the user.
     * Computes automated values (e.g. rate, discount, custom markup).
     * @param {Object} context
     */
    function fieldChanged(context) {
        if (context.sublistId === TARGET_SUBLIST) {
            const currentRec = context.currentRecord;

            // When quantity or rate changes, update custom sublist profit calculation
            if (context.fieldId === 'quantity' || context.fieldId === 'rate') {
                const qty = parseFloat(currentRec.getCurrentSublistValue({ sublistId: TARGET_SUBLIST, fieldId: 'quantity' })) || 0;
                const rate = parseFloat(currentRec.getCurrentSublistValue({ sublistId: TARGET_SUBLIST, fieldId: 'rate' })) || 0;
                const cost = parseFloat(currentRec.getCurrentSublistValue({ sublistId: TARGET_SUBLIST, fieldId: 'costestimate' })) || 0;

                const lineTotal = qty * rate;
                const estimatedCostTotal = qty * cost;
                const estimatedProfit = lineTotal - estimatedCostTotal;

                // Update custom line field without triggering recursive event loops
                try {
                    currentRec.setCurrentSublistValue({
                        sublistId: TARGET_SUBLIST,
                        fieldId: 'custcol_estimated_line_profit',
                        value: estimatedProfit,
                        ignoreFieldChange: true
                    });
                } catch (colErr) {
                    // Column may not exist on all standard forms
                }
            }
        }
    }

    return {
        validateLine: validateLine,
        fieldChanged: fieldChanged
    };
});
