/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/runtime', 'N/log'], function(record, runtime, log) {

    function execute(context) {

        try {
            // 🔹 Get Item Receipt ID from script parameter
            var script = runtime.getCurrentScript();
            var itemReceiptId = 4847;

            if (!itemReceiptId) {
                log.error('Missing Parameter', 'Item Receipt ID is required');
                return;
            }

            log.audit('START', 'Transforming Item Receipt ID: ' + itemReceiptId);

            // 🔁 Transform Item Receipt → Vendor Bill
            var vendorBill = record.transform({
                fromType: record.Type.ITEM_RECEIPT,
                fromId: itemReceiptId,
                toType: record.Type.VENDOR_BILL,
                isDynamic: true
            });

            // 🔹 Optional: Set additional fields
            vendorBill.setValue({
                fieldId: 'memo',
                value: 'Auto created from Item Receipt ' + itemReceiptId
            });

            // 👉 Example: Set custom body field if needed
            // vendorBill.setValue({
            //     fieldId: 'custbody_your_field',
            //     value: 'some value'
            // });

            // 💾 Save Vendor Bill
            var billId = vendorBill.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });

            log.audit('SUCCESS', 'Vendor Bill Created ID: ' + billId);

        } catch (e) {
            log.error('ERROR', e.message + ' | ' + e.stack);
        }
    }

    return {
        execute: execute
    };

});