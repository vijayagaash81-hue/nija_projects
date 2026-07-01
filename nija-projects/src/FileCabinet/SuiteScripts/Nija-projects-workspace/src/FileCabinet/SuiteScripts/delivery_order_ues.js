/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', 'N/record'], (search, record) => {

    const afterSubmit = (context) => {

        try {

            const rec = context.newRecord;
            const invoiceId = rec.id;

            // Load Invoice
            const invoiceRec = record.load({
                type: record.Type.INVOICE,
                id: invoiceId
            });

            // Get Created From Sales Order
            const salesOrderId = invoiceRec.getValue('createdfrom');

            if (!salesOrderId) return;

            // Search Item Fulfillment
            const fulfillmentSearch = search.create({
                type: search.Type.ITEM_FULFILLMENT,
                filters: [
                    ['createdfrom', 'anyof', salesOrderId]
                ],
                columns: [
                    'tranid'
                ]
            });

            let fulfillmentNumbers = [];

            fulfillmentSearch.run().each(result => {

                fulfillmentNumbers.push(
                    result.getValue('tranid')
                );

                return true;
            });

            // Update Invoice custom field
            record.submitFields({
                type: record.Type.INVOICE,
                id: invoiceId,
                values: {
                    custbodycustbody_do_number: fulfillmentNumbers.join(', ')
                }
            });

        } catch (e) {
            log.error('Error', e);
        }
    };

    return {
        afterSubmit
    };

});