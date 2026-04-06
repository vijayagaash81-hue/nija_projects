/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log'], function(record, log) {

    function afterSubmit(context) {
        try {
            // Run only on CREATE or EDIT mode
            if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) {
                return;
            }

            var newRecord = context.newRecord;

            // Load the current Material Request record dynamically to allow updating its sublist later
            var currRec = record.load({
                type: newRecord.type,
                id: newRecord.id,
                isDynamic: true
            });

            // Get the Production Order ID from the current Material Request record
            var prodOrderId = currRec.getValue({
                fieldId: 'custrecord_njt_mr_prodorder'
            });

            if (!prodOrderId) {
                log.debug('No Production Order', 'No Production Order linked. Exiting script.');
                return;
            }

            // Load the Production Order record dynamically to easily interact with sublists
            var prodOrderRec = record.load({
                type: 'customrecord_njt_product_order',
                id: prodOrderId,
                isDynamic: true
            });
            var account = prodOrderRec.getValue({
                fieldId: 'custrecord_njt_acnt'
            })

            // Get the number of lines in the current Material Request sublist
            var lineCount = currRec.getLineCount({
                sublistId: 'recmachcustrecord_njt_mat_request'
            });

            var newLinesMapping = [];
            var currentPoLineCount = prodOrderRec.getLineCount({ sublistId: 'recmachcustrecord_njt_pro_2' });
            var poNeedsSave = false;
            var mrNeedsSave = false;

            for (var i = 0; i < lineCount; i++) {
                
                // Extract values from the current record's sublist
                var item = currRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_mat_request',
                    fieldId: 'custrecord_njt_mat_req_details_item',
                    line: i
                });

                var quantity = currRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_mat_request',
                    fieldId: 'custrecord_njt_mat_req_det_quantity',
                    line: i
                });

                var description = currRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_mat_request',
                    fieldId: 'custrecord_njt_mat_req_det_description',
                    line: i
                });

                var subsidiary = currRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_mat_request',
                    fieldId: 'custrecord_njt_mat_req_det_subsidery',
                    line: i
                });

                var division = currRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_mat_request',
                    fieldId: 'custrecord_njt_sjs_devision_materidet',
                    line: i
                });

                var itemType = currRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_mat_request',
                    fieldId: 'custrecord1289',
                    line: i
                });

                // Read existing mapped child target line ID (if present)
                var childLineId = currRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_mat_request',
                    fieldId: 'custrecord_njt_maatreq_work_detail_id',
                    line: i
                });

                if (childLineId) {
                    // If the child line ID is already recorded, find the matching existing line and update it
                    var poLineIndex = prodOrderRec.findSublistLineWithValue({
                        sublistId: 'recmachcustrecord_njt_pro_2',
                        fieldId: 'id',
                        value: childLineId
                    });

                    if (poLineIndex !== -1) {
                        prodOrderRec.selectLine({ sublistId: 'recmachcustrecord_njt_pro_2', line: poLineIndex });
                        setPoLineFields(prodOrderRec, item, quantity, description, subsidiary, division, account, itemType);
                        prodOrderRec.commitLine({ sublistId: 'recmachcustrecord_njt_pro_2' });
                        poNeedsSave = true;
                    }
                } else {
                    // Add a new line to the Production Order sublist
                    prodOrderRec.selectNewLine({
                        sublistId: 'recmachcustrecord_njt_pro_2'
                    });

                    setPoLineFields(prodOrderRec, item, quantity, description, subsidiary, division, account, itemType);
                    prodOrderRec.commitLine({ sublistId: 'recmachcustrecord_njt_pro_2' });
                    poNeedsSave = true;

                    // Track mapping between current Material Request line index and the upcoming Production Order line index
                    newLinesMapping.push({
                        mrLineIndex: i,
                        poLineIndex: currentPoLineCount
                    });
                    currentPoLineCount++;
                }
            }

            // Save the updated Production Order
            if (poNeedsSave) {
                var savedPoId = prodOrderRec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('Success', 'Successfully updated Production Order ID: ' + savedPoId);

                // Re-load the Production Order to fetch the newly generated internal IDs for the added lines
                if (newLinesMapping.length > 0) {
                    var reloadedPo = record.load({
                        type: 'customrecord_njt_product_order',
                        id: savedPoId,
                        isDynamic: true
                    });

                    for (var j = 0; j < newLinesMapping.length; j++) {
                        var mapping = newLinesMapping[j];
                        var generatedId = reloadedPo.getSublistValue({
                            sublistId: 'recmachcustrecord_njt_pro_2',
                            fieldId: 'id',
                            line: mapping.poLineIndex
                        });

                        if (generatedId) {
                            currRec.selectLine({
                                sublistId: 'recmachcustrecord_njt_mat_request',
                                line: mapping.mrLineIndex
                            });
                            currRec.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_njt_mat_request',
                                fieldId: 'custrecord_njt_maatreq_work_detail_id',
                                value: generatedId
                            });
                            currRec.commitLine({ sublistId: 'recmachcustrecord_njt_mat_request' });
                            mrNeedsSave = true;
                        }
                    }
                }
            }

            // Save the current Material Request with populated child record IDs if any new lines were tracked
            if (mrNeedsSave) {
                var savedMrId = currRec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('Material Request Updated', 'Successfully appended missing child record IDs to MR: ' + savedMrId);
            }

        } catch (e) {
            log.error('Error Updating Production Order', e.message);
        }
    }

    // Helper function to extract and configure standard sublist fields
    function setPoLineFields(poRec, item, quantity, description, subsidiary, division, account, itemType) {
        if (item) poRec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_njt_pro_2', fieldId: 'custrecord_njt_itm_code', value: item });
        if (quantity) {
            poRec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_njt_pro_2', fieldId: 'custrecord_njt_planned_qnty', value: quantity });
            poRec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_njt_pro_2', fieldId: 'custrecord_njt_base_qnty', value: quantity });
        }
        if (description) poRec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_njt_pro_2', fieldId: 'custrecord_njt_item_name_', value: description });
        if (subsidiary) poRec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_njt_pro_2', fieldId: 'custrecord_njt_po_subsidiary', value: subsidiary });
        if (division) poRec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_njt_pro_2', fieldId: 'custrecord_njt_production_division', value: division });
        if (account) poRec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_njt_pro_2', fieldId: 'custrecord_njt_account_', value: account });
        if (itemType) poRec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_njt_pro_2', fieldId: 'custrecord_njt_itm_type', value: itemType });
    }

    return {
        afterSubmit: afterSubmit
    };
});