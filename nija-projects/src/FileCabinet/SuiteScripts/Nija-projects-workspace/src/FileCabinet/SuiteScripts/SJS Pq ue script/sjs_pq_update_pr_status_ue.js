/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Script Description:
 * User Event Script deployed on Purchase Quotation record (customrecord_njt_pq_h).
 * Upon save (afterSubmit), it checks the sublist lines (recmachcustrecord_njt_pq_items_parent_link).
 * If the requested quantity (custrecord_njt_pq_items_request_quantity) matches the quoted quantity
 * (custrecord_njt_pq_items_quantity), it loads the associated Purchase Request record
 * (customrecord_njt_pur_req_h) referenced in custrecord_njt_pq_pr.
 * 
 * It matches the item in the Purchase Request sublist (recmachcustrecord_njt_pur_req_det_pl -> custrecord_njt_pur_req_det_item)
 * and sets the line status field (custrecord_njt_pur_req_status) to 2 (Closed).
 * 
 * If all lines in the Purchase Request are closed (status 2), it updates the body level status field
 * (custrecord_njt_pur_req_status) to 2 (Closed).
 */
define(['N/record', 'N/log'], (record, log) => {

    /**
     * Function executed after a record is submitted.
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {Record} context.oldRecord - Old record
     * @param {string} context.type - Trigger type
     */
    const afterSubmit = (context) => {
        // Run on CREATE, EDIT, or XEDIT events (skip DELETE)
        if (context.type === context.UserEventType.DELETE) {
            return;
        }

        try {
            const pqRecord = context.newRecord;
            const pqId = pqRecord.id;

            // Get Purchase Request ID from PQ body field
            const prId = pqRecord.getValue({ fieldId: 'custrecord_njt_pq_pr' });
            if (!prId) {
                log.debug('afterSubmit', `No Purchase Request linked to Purchase Quotation ID: ${pqId}`);
                return;
            }

            const pqSublistId = 'recmachcustrecord_njt_pq_items_parent_link';
            const pqLineCount = pqRecord.getLineCount({ sublistId: pqSublistId });

            if (pqLineCount <= 0) {
                log.debug('afterSubmit', `No line items in Purchase Quotation ID: ${pqId}`);
                return;
            }

            // Store items where request quantity matches quoted quantity
            const matchedItemMap = {};

            for (let i = 0; i < pqLineCount; i++) {
                const item = pqRecord.getSublistValue({
                    sublistId: pqSublistId,
                    fieldId: 'custrecord_njt_pq_items_items',
                    line: i
                });

                const reqQtyVal = pqRecord.getSublistValue({
                    sublistId: pqSublistId,
                    fieldId: 'custrecord_njt_pq_items_request_quantity',
                    line: i
                });

                const pqQtyVal = pqRecord.getSublistValue({
                    sublistId: pqSublistId,
                    fieldId: 'custrecord_njt_pq_items_quantity',
                    line: i
                });

                const reqQty = parseFloat(reqQtyVal);
                const pqQty = parseFloat(pqQtyVal);

                log.debug('Line Qty Check', `Line: ${i}, Item: ${item}, Request Qty: ${reqQtyVal} (${reqQty}), Quoted Qty: ${pqQtyVal} (${pqQty})`);

                if (!isNaN(reqQty) && !isNaN(pqQty) && Math.abs(reqQty - pqQty) < 0.00001) {
                    matchedItemMap[item] = true;
                }
            }

            const matchedItemIds = Object.keys(matchedItemMap);
            log.debug('Matched Items (Qty equal)', matchedItemIds);

            if (matchedItemIds.length === 0) {
                log.debug('afterSubmit', 'No item line quantities matched between request and quoted quantity.');
                return;
            }

            // Load Purchase Request record
            const prRecord = record.load({
                type: 'customrecord_njt_pur_req_h',
                id: prId,
                isDynamic: false
            });

            const prSublistId = 'recmachcustrecord_njt_pur_req_det_pl';
            const prLineCount = prRecord.getLineCount({ sublistId: prSublistId });

            let isRecordModified = false;

            // Update line status to 2 for matching items
            for (let j = 0; j < prLineCount; j++) {
                const prItem = prRecord.getSublistValue({
                    sublistId: prSublistId,
                    fieldId: 'custrecord_njt_pur_req_det_item',
                    line: j
                });

                if (matchedItemMap[prItem]) {
                    const currentLineStatus = prRecord.getSublistValue({
                        sublistId: prSublistId,
                        fieldId: 'custrecord_njt_pur_req_det_status',
                        line: j
                    });

                    if (Number(currentLineStatus) !== 2) {
                        prRecord.setSublistValue({
                            sublistId: prSublistId,
                            fieldId: 'custrecord_njt_pur_req_det_status',
                            line: j,
                            value: 2 // Closed
                        });
                        isRecordModified = true;
                        log.audit('PR Line Closed', `PR ID: ${prId}, Line: ${j}, Item: ${prItem} set status (custrecord_njt_pur_req_det_status) to 2`);
                    }
                }
            }

            // Check if ALL lines in the Purchase Request are now closed (status == 2)
            let allLinesClosed = true;
            for (let k = 0; k < prLineCount; k++) {
                const lineStatus = prRecord.getSublistValue({
                    sublistId: prSublistId,
                    fieldId: 'custrecord_njt_pur_req_det_status',
                    line: k
                });

                if (Number(lineStatus) !== 2) {
                    allLinesClosed = false;
                    break;
                }
            }

            // If all lines are closed, update PR body level status field to 2
            if (allLinesClosed && prLineCount > 0) {
                const bodyStatus = prRecord.getValue({ fieldId: 'custrecord_njt_pur_req_status' });
                if (Number(bodyStatus) !== 2) {
                    prRecord.setValue({
                        fieldId: 'custrecord_njt_pur_req_status',
                        value: 2 // Closed
                    });
                    isRecordModified = true;
                    log.audit('PR Body Status Closed', `PR ID: ${prId} body status set to 2 (All lines closed)`);
                }
            }

            // Save the Purchase Request record if any line or body status was updated
            if (isRecordModified) {
                const updatedPrId = prRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.audit('PR Record Saved', `Successfully updated Purchase Request ID: ${updatedPrId}`);
            } else {
                log.debug('afterSubmit', `No status updates required for Purchase Request ID: ${prId}`);
            }

        } catch (e) {
            log.error('Error in afterSubmit of PQ User Event Script', e.stack || e.toString());
        }
    };

    return {
        afterSubmit
    };
});
