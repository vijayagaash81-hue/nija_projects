/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/log', 'N/search', 'N/record'], (serverWidget, log, search, record) => {

    const SUBLIST_ID = 'recmachcustrecord_production_completion';
    const ICON_FIELD_ID = 'custrecord_njt_pc_inv_detail_icon';
    const JSON_FIELD_ID = 'custrecord_njt_pc_inv_detail_json';
    const CLIENT_SCRIPT_PATH = './njt_prod_completion_cs.js';

    const beforeLoad = (scriptContext) => {
        try {
            const form = scriptContext.form;
            const newRecord = scriptContext.newRecord;
            const type = scriptContext.type;

            log.debug('beforeLoad Start', { type, recordId: newRecord.id });

            // Attach client script
            form.clientScriptModulePath = CLIENT_SCRIPT_PATH;

            if (type !== 'create' && type !== 'edit') {
                log.debug('Skipping UI modification in beforeLoad', 'Operation type is not create or edit: ' + type);
                return;
            }

            const sublist = form.getSublist({ id: SUBLIST_ID });
            if (sublist) {
                // Hide standard database fields
                const standardLoc = sublist.getField({ id: 'custrecord_location_pc' });
                if (standardLoc) standardLoc.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                const standardBin = sublist.getField({ id: 'custrecord_bin_pc' });
                if (standardBin) standardBin.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                // Add custom UI select fields
                const customLocationField = sublist.addField({
                    id: 'custpage_location_pc_ui',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Location'
                });

                const customBinField = sublist.addField({
                    id: 'custpage_bin_pc_ui',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Bin'
                });

                // Populate customLocationField with locations filtered by subsidiary
                let workOrderId = newRecord.getValue('custrecord_work_order');
                if (!workOrderId && scriptContext.request) {
                    workOrderId = scriptContext.request.parameters.workOrderid;
                }
                let subsidiaryId = '';
                if (workOrderId) {
                    try {
                        const lookup = search.lookupFields({
                            type: 'customrecord_njt_product_order',
                            id: workOrderId,
                            columns: ['custrecord_njt_subsidiar']
                        });
                        if (lookup && lookup.custrecord_njt_subsidiar) {
                            const subVal = lookup.custrecord_njt_subsidiar;
                            subsidiaryId = (Array.isArray(subVal) && subVal.length > 0) ? subVal[0].value : (subVal.value || subVal);
                        }
                    } catch (e) {
                        log.error('Error looking up subsidiary in beforeLoad', e);
                    }
                }

                const locations = [];
                try {
                    const filters = [['isinactive', 'is', 'F']];
                    if (subsidiaryId) {
                        filters.push('AND');
                        filters.push(['subsidiary', 'anyof', [subsidiaryId]]);
                    }
                    const locSearch = search.create({
                        type: 'location',
                        filters: filters,
                        columns: ['name']
                    });
                    locSearch.run().each((result) => {
                        locations.push({
                            id: result.id,
                            name: result.getValue('name')
                        });
                        return true;
                    });
                } catch (err) {
                    log.error('Error querying locations in beforeLoad', err);
                }

                customLocationField.addSelectOption({
                    value: ' ',
                    text: ' '
                });
                locations.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                locations.forEach(loc => {
                    customLocationField.addSelectOption({
                        value: String(loc.id),
                        text: loc.name
                    });
                });

                // In edit or view mode, populate custom sublist fields with already saved values
                if (type === 'edit' || type === 'view') {
                    const lineCount = newRecord.getLineCount({ sublistId: SUBLIST_ID });
                    for (let i = 0; i < lineCount; i++) {
                        const savedLocation = newRecord.getSublistValue({
                            sublistId: SUBLIST_ID,
                            fieldId: 'custrecord_location_pc',
                            line: i
                        });
                        const savedBin = newRecord.getSublistValue({
                            sublistId: SUBLIST_ID,
                            fieldId: 'custrecord_bin_pc',
                            line: i
                        });
                        const savedBinText = newRecord.getSublistText({
                            sublistId: SUBLIST_ID,
                            fieldId: 'custrecord_bin_pc',
                            line: i
                        });

                        if (savedLocation) {
                            newRecord.setSublistValue({
                                sublistId: SUBLIST_ID,
                                fieldId: 'custpage_location_pc_ui',
                                line: i,
                                value: String(savedLocation)
                            });
                        }

                        if (savedBin) {
                            customBinField.addSelectOption({
                                value: String(savedBin),
                                text: savedBinText || ' '
                            });
                            newRecord.setSublistValue({
                                sublistId: SUBLIST_ID,
                                fieldId: 'custpage_bin_pc_ui',
                                line: i,
                                value: String(savedBin)
                            });
                        }
                    }
                }
            }

        } catch (e) {
            log.error('Error in beforeLoad User Event', e);
        }
    };
    const afterSubmit = (scriptContext) => {
        try {
            const type = scriptContext.type;
            log.debug('afterSubmit Start', { type });

            // Create Inventory Adjustment on create/edit
            if (type !== 'create' && type !== 'edit') {
                log.debug('Skipping Inventory Adjustment', 'Operation type is not create or edit: ' + type);
                return;
            }

            var newRecord = scriptContext.newRecord;

            // Load the full record to ensure all parent-child sublist lines are fully loaded from database
            var recordObj = record.load({
                type: newRecord.type,
                id: newRecord.id
            });

            // Check if Inventory Adjustment already exists on this record
            var existingInvAdj = recordObj.getValue({
                fieldId: 'custrecord_inventory_adjustment'
            });

            /*
            // If in edit mode, delete the existing Inventory Adjustment first
            if (type === 'edit' && existingInvAdj) {
                try {
                    record.delete({
                        type: record.Type.INVENTORY_ADJUSTMENT,
                        id: existingInvAdj
                    });
                    log.audit('Deleted existing Inventory Adjustment for recreation', existingInvAdj);
                    existingInvAdj = null;
                } catch (deleteErr) {
                    log.error('Error deleting existing Inventory Adjustment ' + existingInvAdj, deleteErr);
                }
            }
            */

            if (existingInvAdj) {
                log.debug('Skipping Inventory Adjustment', 'Inventory Adjustment already exists: ' + existingInvAdj);
                return;
            }

            var projcode = recordObj.getValue({
                fieldId: 'custrecord_project_code'
            });

            if (!projcode) {
                log.debug('Skipping Inventory Adjustment', 'No Project Code found on record');
                return;
            }

            const workOrderSearch = search.create({
                type: 'customrecord_njt_product_order',
                filters: [
                    ['custrecord_njt_project_2', 'is', projcode]
                ],
                columns: [
                    'internalid',
                    'custrecord_njt_acnt',
                    'custrecord_njt_subsidiar'
                ]
            });

            const results = workOrderSearch.run().getRange({
                start: 0,
                end: 10
            });

            if (results.length === 0) {
                log.error('Skipping Inventory Adjustment', 'No matching Work Order / Product Order found for Project Code: ' + projcode);
                return;
            }

            const workOrderId = results[0].getValue('internalid');
            const workOrderAccnt = results[0].getValue('custrecord_njt_acnt');
            const workOrderSubsidiary = results[0].getValue('custrecord_njt_subsidiar');

            log.debug('Work Order Found', {
                id: workOrderId,
                account: workOrderAccnt,
                subsidiary: workOrderSubsidiary
            });

            if (!workOrderAccnt) {
                log.error('Skipping Inventory Adjustment', 'Adjustment Account is empty on Product Order');
                return;
            }
            if (!workOrderSubsidiary) {
                log.error('Skipping Inventory Adjustment', 'Subsidiary is empty on Product Order');
                return;
            }

            const lineCount = recordObj.getLineCount({ sublistId: SUBLIST_ID });
            log.debug('Line Count from Database', lineCount);

            if (lineCount === 0) {
                log.debug('Skipping Inventory Adjustment', 'No lines found in sublist: ' + SUBLIST_ID);
                return;
            }

            // Identify default location from first valid line
            var firstLocation = null;
            for (var i = 0; i < lineCount; i++) {
                var loc = recordObj.getSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_location_pc',
                    line: i
                });
                if (loc) {
                    firstLocation = loc;
                    break;
                }
            }

            // Create Inventory Adjustment record
            const invAdj = record.create({
                type: record.Type.INVENTORY_ADJUSTMENT,
                isDynamic: true
            });

            invAdj.setValue({ fieldId: 'subsidiary', value: workOrderSubsidiary });
            invAdj.setValue({ fieldId: 'account', value: workOrderAccnt });
            if (firstLocation) {
                invAdj.setValue({ fieldId: 'adjlocation', value: firstLocation });
            }
            invAdj.setValue({ fieldId: 'cseg_njt_seg_proj', value: projcode });
            invAdj.setValue({ fieldId: 'memo', value: 'Created from Production Completion ID: ' + recordObj.id });

            var addedLines = 0;

            for (var i = 0; i < lineCount; i++) {
                var itemId = recordObj.getSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_item',
                    line: i
                });
                var qty = recordObj.getSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_quantity',
                    line: i
                });
                var locationId = recordObj.getSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_location_pc',
                    line: i
                });
                var binId = recordObj.getSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_bin_pc',
                    line: i
                });
                var heatLotNo = recordObj.getSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_heatlot_no',
                    line: i
                });

                if (!itemId || !qty || parseFloat(qty) <= 0) {
                    log.debug('Skipping line ' + i, 'Invalid item or quantity');
                    continue;
                }

                invAdj.selectNewLine({ sublistId: 'inventory' });
                invAdj.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: itemId });
                invAdj.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: locationId || firstLocation });
                invAdj.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: parseFloat(qty) });

                // Configure inventory details using JSON detail (first choice) or fallback to binId/heatLotNo
                var hasDetail = false;
                var detailsJson = recordObj.getSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: JSON_FIELD_ID,
                    line: i
                });

                var details = [];
                if (detailsJson) {
                    try {
                        details = JSON.parse(detailsJson);
                    } catch (jsonErr) {
                        log.error('Error parsing JSON detail for line ' + i, jsonErr);
                    }
                }

                if (details && details.length > 0) {
                    hasDetail = true;
                } else if (binId || heatLotNo) {
                    hasDetail = true;
                    details = [{
                        binId: binId ? Number(binId) : null,
                        lot: heatLotNo || null,
                        qty: parseFloat(qty)
                    }];
                }

                if (hasDetail) {
                    try {
                        var subrec = invAdj.getCurrentSublistSubrecord({
                            sublistId: 'inventory',
                            fieldId: 'inventorydetail'
                        });

                        for (var d = 0; d < details.length; d++) {
                            var detailItem = details[d];
                            subrec.selectNewLine({ sublistId: 'inventoryassignment' });

                            if (detailItem.binId) {
                                subrec.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'binnumber',
                                    value: Number(detailItem.binId)
                                });
                            }

                            if (detailItem.lot) {
                                subrec.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'receiptinventorynumber',
                                    value: detailItem.lot
                                });
                            }

                            subrec.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'quantity',
                                value: parseFloat(detailItem.qty)
                            });

                            subrec.commitLine({ sublistId: 'inventoryassignment' });
                        }
                        log.debug('Configured inventory detail for line ' + i, details);
                    } catch (detailErr) {
                        log.error('Error configuring inventory detail for line ' + i, detailErr.message);
                    }
                }

                invAdj.commitLine({ sublistId: 'inventory' });
                addedLines++;
            }

            if (addedLines > 0) {
                const invAdjId = invAdj.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.audit('Inventory Adjustment Created Successfully', { id: invAdjId });

                // Set created Inventory Adjustment reference on the current record
                record.submitFields({
                    type: recordObj.type,
                    id: recordObj.id,
                    values: {
                        'custrecord_inventory_adjustment': invAdjId
                    }
                });
                log.debug('Updated current record with Inventory Adjustment link', {
                    recordId: recordObj.id,
                    invAdjId: invAdjId
                });
            } else {
                log.debug('No lines added; Inventory Adjustment was not created.');
            }

        } catch (e) {
            log.error('Error in afterSubmit User Event', e);
        }
    };

    /**
     * Generates HTML for the Inventory Detail status label
     */
    function getIconHtml(line, jsonVal) {
        const hasDetails = !!jsonVal && jsonVal.trim().length > 2;
        return hasDetails 
            ? '<span style="color:#2ecc71; font-weight:bold; font-size:13px; user-select:none;">✅ Configured</span>' 
            : '<span style="color:#e74c3c; font-weight:bold; font-size:13px; user-select:none;">❌ Pending</span>';
    }

    return { beforeLoad,afterSubmit };
});
