/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord'], function (currentRecord) {

    function pageInit(context) {
        // Use a small timeout to ensure the INLINEHTML field has been rendered by the browser
        // before we try to manipulate its DOM elements.
        // This is a common pattern for dealing with custom HTML in NetSuite forms.
        setTimeout(updateSummary, 150);
    }

    function fieldChanged(context) {
        updateSummary();
    }

    function postSourcing(context) {
        updateSummary();
    }

    function validateLine(context) {
        setTimeout(updateSummary, 100);
        return true;
    }

    function updateSummary() {
        try {
            var rec = currentRecord.get();

            // Read from your existing fields
            var amount = rec.getValue({ fieldId: 'custrecord_amount' }) || 0;
            var tax = rec.getValue({ fieldId: 'custrecord_tax' }) || 0;
            var total = rec.getValue({ fieldId: 'custrecord_total' }) || 0;

            // Update HTML only
            var amtEl = document.getElementById('subTotal');
            var taxEl = document.getElementById('taxTotal');
            var totEl = document.getElementById('grandTotal');

            if (amtEl) amtEl.innerText = formatCurrency(amount);
            if (taxEl) taxEl.innerText = formatCurrency(tax);
            if (totEl) totEl.innerText = formatCurrency(total);

        } catch (e) {
            console.log('Summary Error:', e);
        }
    }

    function formatCurrency(val) {
        return parseFloat(val || 0).toFixed(2);
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        postSourcing: postSourcing,
        validateLine: validateLine
    };
});