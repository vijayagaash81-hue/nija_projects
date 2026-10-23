/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * Scenario: Standard & Custom Record Transformation Flow
 * Purpose: Demonstrates transforming a transaction into its downstream fulfillment/receipt record
 *          (e.g., Sales Order -> Item Fulfillment, or Purchase Order -> Item Receipt)
 *          using N/record.transform, modifying specific line quantities, setting custom body fields,
 *          and submitting with options.
 */
define(['N/record', 'N/log', 'N/ui/dialog'], (record, log, dialog) => {

    /**
     * Executes the record transformation
     * @param {Object} context
     */
    const onRequest = (context) => {
        try {
            const params = context.request.parameters;
            const sourceOrderId = params.orderId || params.id;
            const targetType = params.targetType || 'itemfulfillment'; // 'itemfulfillment' or 'itemreceipt'

            if (!sourceOrderId) {
                context.response.write('Missing source orderId. Usage: ?orderId=123&targetType=itemfulfillment');
                return;
            }

            log.audit({
                title: 'Initiating Record Transformation',
                details: `Source Order ID: ${sourceOrderId} -> Target: ${targetType}`
            });

            // =========================================================================
            // 1. EXECUTE RECORD TRANSFORM
            // =========================================================================
            // fromType: record.Type.SALES_ORDER or 'salesorder'
            // toType: record.Type.ITEM_FULFILLMENT or 'itemfulfillment'
            const fulfillmentRecord = record.transform({
                fromType: record.Type.SALES_ORDER,
                fromId: parseInt(sourceOrderId),
                toType: record.Type.ITEM_FULFILLMENT,
                isDynamic: true, // Dynamic mode allows line selection and field sourcing
                defaultValues: {
                    inventorylocation: 2 // Optional: specify target warehouse location
                }
            });

            // =========================================================================
            // 2. SET BODY-LEVEL FULFILLMENT FIELDS
            // =========================================================================
            // Ship Status: 'picked', 'packed', or 'shipped'
            fulfillmentRecord.setValue({
                fieldId: 'shipstatus',
                value: 'C' // 'C' = Shipped, 'B' = Packed, 'A' = Picked
            });

            fulfillmentRecord.setValue({
                fieldId: 'memo',
                value: `Automated fulfillment created from Sales Order #${sourceOrderId}`
            });

            // Set custom tracking / courier details
            try {
                fulfillmentRecord.setValue({
                    fieldId: 'custbody_carrier_tracking_number',
                    value: 'TRK-DXB-' + Date.now()
                });
            } catch (custFieldErr) {
                log.debug({ title: 'Custom field not on form', details: custFieldErr });
            }

            // =========================================================================
            // 3. ADJUST LINE ITEMS (PARTIAL FULFILLMENT EXAMPLE)
            // =========================================================================
            const lineCount = fulfillmentRecord.getLineCount({ sublistId: 'item' });
            log.debug({ title: 'Transform Line Count', details: `Found ${lineCount} items` });

            for (let i = 0; i < lineCount; i++) {
                fulfillmentRecord.selectLine({
                    sublistId: 'item',
                    line: i
                });

                const itemName = fulfillmentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemname'
                });
                const orderQty = fulfillmentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity'
                });

                // Toggle fulfillment line checkbox ('itemreceive' on fulfillment is boolean)
                fulfillmentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemreceive',
                    value: true
                });

                // Set actual fulfilled quantity if partial
                fulfillmentRecord.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    value: orderQty
                });

                fulfillmentRecord.commitLine({ sublistId: 'item' });
            }

            // =========================================================================
            // 4. SAVE TRANSFORMED RECORD
            // =========================================================================
            const createdRecordId = fulfillmentRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });

            log.audit({
                title: 'Transform Successful',
                details: `Item Fulfillment #${createdRecordId} created from Sales Order #${sourceOrderId}`
            });

            context.response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            });

            context.response.write(JSON.stringify({
                status: 'success',
                message: 'Record successfully transformed',
                sourceOrderId: sourceOrderId,
                createdRecordId: createdRecordId,
                createdRecordType: targetType
            }));

        } catch (e) {
            log.error({
                title: 'Record Transform Failed',
                details: e
            });

            context.response.write(JSON.stringify({
                status: 'error',
                message: e.message || e
            }));
        }
    };

    return { onRequest };
});
