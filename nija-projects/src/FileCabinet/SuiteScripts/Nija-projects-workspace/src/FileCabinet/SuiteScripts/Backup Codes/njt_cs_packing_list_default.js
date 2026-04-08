/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord'], function (url, currentRecord) {

    function pageInit(context) {
        if (context.mode !== 'create') return;

        var curRec = context.currentRecord;

        try {
            var urlParams = new URLSearchParams(window.location.search);

            var soId = urlParams.get('soid');
            var customerId = urlParams.get('custid'); // NEW

            console.log('SO ID from URL:', soId);
            console.log('Customer ID from URL:', customerId);

            // Set Sales Order
            if (soId) {
                curRec.setValue({
                    fieldId: 'custrecord_njt_packing_list_sales_order',
                    value: parseInt(soId, 10),
                    ignoreFieldChange: false
                });

                console.log('Sales Order set:', soId);
            }

            // Set Customer
            if (customerId) {
                curRec.setValue({
                    fieldId: 'custrecord_njt_packing_list_customer', // your actual field ID
                    value: parseInt(customerId, 10),
                    ignoreFieldChange: false
                });

                console.log('Customer set:', customerId);
            }

        } catch (e) {
            console.error('Error in pageInit:', e);
        }
    }

    function openPackingList(salesOrderId, customerId) {

        if (!salesOrderId) {
            alert('No Sales Order ID provided.');
            return;
        }

        var recUrl = url.resolveRecord({
            recordType: 'customrecord_njt_packing_list',
            isEditMode: true
        });

        // Append parameters safely
        recUrl += '&soid=' + encodeURIComponent(salesOrderId);

        if (customerId) {
            recUrl += '&custid=' + encodeURIComponent(customerId);
        }

        console.log('Redirect URL:', recUrl);

        window.open(recUrl, '_self');
    }

    return {
        pageInit: pageInit,
        openPackingList: openPackingList
    };
});