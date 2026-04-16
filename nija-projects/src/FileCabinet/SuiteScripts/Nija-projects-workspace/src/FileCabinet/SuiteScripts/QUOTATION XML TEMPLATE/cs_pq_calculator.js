/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([], function() {

    function calculateTotals(context) {
        var rec = context.currentRecord;
        var sublistId = 'recmachcustrecord_njt_pq_items_parent_link';
        
        var lineCount = rec.getLineCount({ sublistId: sublistId });
        
        var totalAmount = 0;
        var totalTax = 0;

        // Loop through all the lines in the sublist to calculate the sums
        for (var i = 0; i < lineCount; i++) {
            var lineAmount = parseFloat(rec.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_njt_pq_items_amount',
                line: i
            })) || 0;

            var lineTax = parseFloat(rec.getSublistValue({
                sublistId: sublistId,
                fieldId: 'custrecord_njt_pq_items_taxamt',
                line: i
            })) || 0;

            totalAmount += lineAmount;
            totalTax += lineTax;
        }

        // Set the calculated sums into the respective body fields
        rec.setValue({ fieldId: 'custrecord_amount', value: totalAmount.toFixed(2), ignoreFieldChange: true });
        rec.setValue({ fieldId: 'custrecord_tax', value: totalTax.toFixed(2), ignoreFieldChange: true });
        
        // Set the grand total
        rec.setValue({ fieldId: 'custrecord_total', value: (totalAmount + totalTax).toFixed(2), ignoreFieldChange: true });
    }

    function sublistChanged(context) {
        if (context.sublistId === 'recmachcustrecord_njt_pq_items_parent_link') {
            calculateTotals(context);
        }
    }

    return {
        sublistChanged: sublistChanged
    };
});