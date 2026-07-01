/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */

define(['N/record', 'N/log'], (record, log) => {

    const execute = () => {

        try {

            // Purchase Order Internal ID
            const poId = 7652;

            // Transform PO to Item Receipt
            const itemReceipt = record.transform({
                fromType: record.Type.PURCHASE_ORDER,
                fromId: poId,
                toType: record.Type.ITEM_RECEIPT,
                isDynamic: true
            });

            // Optional: Set fields
            itemReceipt.setValue({
                fieldId: 'trandate',
                value: new Date()
            });

            // Save Item Receipt
            const itemReceiptId = itemReceipt.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });

            log.audit({
                title: 'Item Receipt Created',
                details: 'Item Receipt ID: ' + itemReceiptId
            });

        } catch (e) {
            log.error({
                title: 'Error Creating Item Receipt',
                details: e
            });
        }
    };

    return {
        execute
    };

});