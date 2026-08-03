/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/runtime', 'N/log', 'N/query', 'N/file','N/search'], (record, runtime, log, query, file, search) => {

    const getInputData = () => {
        try {
            log.debug('GETINPUTDATA_START', 'Script Started');

            const script = runtime.getCurrentScript();

            const rawData = script.getParameter({ name: 'custscript_picklist_data' }) || '[]';
            const groupBy = Number(script.getParameter({ name: 'custscript_groupby' }));
            const pickDate = script.getParameter({ name: 'custscript_pickdate' });

            log.debug('PARAMS', { rawDataLength: rawData.length, groupBy, pickDate });

            const data = JSON.parse(rawData);
            log.debug('DATA_PARSED', { count: data.length });

            let grouped = {};

            data.forEach((line, idx) => {
                log.debug('GROUP_LOOP', { idx, line });

                let key = 'single';
                if (groupBy === 2) key = line.customer || 'no_customer';
                if (groupBy === 1) key = line.doc || 'no_doc';

                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(line);

                log.debug('GROUPED_LINE', { key, item: line.item });
            });

            const output = Object.keys(grouped).map(k => {
                const obj = {
                    key: k,
                    lines: grouped[k],
                    groupBy,
                    pickDate
                };
                return JSON.stringify(obj);
            });

            log.debug('GETINPUTDATA_COMPLETE', { groups: output.length });

            return output;

        } catch (e) {
            log.error('GETINPUTDATA_ERROR', e);
            throw e;
        }
    };

    const reduce = (context) => {
        try {
            log.audit('REDUCE_START', context.key);

            const data = JSON.parse(context.values[0]);
            log.debug('REDUCE_DATA', {
                key: data.key,
                lineCount: data.lines.length,
                pickDate: data.pickDate
            });

            const parent = record.create({
                type: 'customrecord_njt_pick_list',
                isDynamic: true
            });

            log.debug('PICKLIST_CREATED', 'Parent record created');

            if (data.pickDate) {
                const p = data.pickDate.split('/');
                const d = new Date(p[2], p[1] - 1, p[0]);
                parent.setValue({ fieldId: 'custrecord_njt_pl_date', value: d });
                log.debug('DATE_SET', d);
            }

            parent.setValue({ fieldId: 'custrecord_group_by', value: data.groupBy });
            log.debug('GROUPBY_SET', data.groupBy);

            data.lines.forEach((line, idx) => {
                try {
                    log.audit('LINE_START', { idx, item: line.item });

                    parent.selectNewLine({ sublistId: 'recmachcustrecord_pl_det_parent_link' });

                    parent.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pl_det_parent_link',
                        fieldId: 'custrecord_pl_det_customer',
                        value: line.customer
                    });

                    parent.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pl_det_parent_link',
                        fieldId: 'custrecord_pl_det_doc_num',
                        value: line.doc
                    });

                    parent.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pl_det_parent_link',
                        fieldId: 'custrecord_pl_det_item',
                        value: line.item
                    });

                    parent.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pl_det_parent_link',
                        fieldId: 'custrecord_pl_det_item_name',
                        value: line.itemname
                    });

                    log.debug('Location', line.location);

                    parent.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pl_det_parent_link',
                        fieldId: 'custrecord_pl_det_location',
                        value: line.location
                    });

                    const lotdetails = getFifoLots(line.item, line.location);
                    log.debug('lot for line', lotdetails);

                    // FIFO qty-limited lot allocation for pick list
                    let remaining = Number(line.pickqty) || 0;
                    const allocatedLots = [];

                    for (let j = 0; j < lotdetails.length && remaining > 0; j++) {
                        const lot = lotdetails[j];
                        const takeQty = Math.min(remaining, lot.qty);
                        allocatedLots.push({
                            serialid: lot.serialid,
                            qty: takeQty,
                            bin_id: lot.bin_id || null,
                            bin_number: lot.bin_number || null
                        });
                        remaining -= takeQty;
                    }

                    // create custom inventory detail record and store ID in long text field
                    // const invDetId = createCustomInvDetail(line.item, line.pickqty, line.Units, allocatedLots);
                    // log.debug('INV_DET_CREATED', { invDetId });

                    // if (invDetId) {

                    //     const iconHtml = `
                    //         <span 
                    //             class="invdet-icon"
                    //             data-id="${invDetId}"
                    //             title="View Inventory Detail"
                    //             style="
                    //                 cursor:pointer !important;
                    //                 display:inline-block;
                    //                 font-size:18px;
                    //                 user-select:none;
                    //                 pointer-events:all !important;
                    //                 position:relative;
                    //                 z-index:999;
                    //             "
                    //             onclick="window.open('https://12148615.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=692&id=${invDetId}','invdetpopup','width=900,height=600,scrollbars=yes')"
                    //         >🔍</span>
                    //     `;

                    //     parent.setCurrentSublistValue({
                    //         sublistId: 'recmachcustrecord_pl_det_parent_link',
                    //         fieldId: 'custrecord_pl_det_inv_det',
                    //         value: iconHtml
                    //     });
                    // }

                    // parent.setCurrentSublistValue({
                    //     sublistId: 'recmachcustrecord_pl_det_parent_link',
                    //     fieldId: 'custrecord_pl_det_select_binlot',
                    //     value: true
                    // });

                    // parent.setCurrentSublistValue({
                    //     sublistId: 'recmachcustrecord_pl_det_parent_link',
                    //     fieldId: 'custrecord_binlot_details',
                    //     value: JSON.stringify(allocatedLots)
                    // });

                    parent.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pl_det_parent_link',
                        fieldId: 'custrecord_pl_det_doc_instock',
                        value: line.Instock
                    });

                    parent.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pl_det_parent_link',
                        fieldId: 'custrecord_pl_det_document_quantity',
                        value: line.docqty
                    });

                    parent.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pl_det_parent_link',
                        fieldId: 'custrecord_pl_det_pick_quantity',
                        value: line.pickqty
                    });

                    parent.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pl_det_parent_link',
                        fieldId: 'custrecord_pl_det_picked_quantity',
                        value: line.pickqty
                    });

                    parent.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_pl_det_parent_link',
                        fieldId: 'custrecord_pl_det_units',
                        value: line.Units
                    });

                    parent.commitLine({ sublistId: 'recmachcustrecord_pl_det_parent_link' });

                    log.audit('LINE_DONE', { idx });

                } catch (le) {
                    log.error('LINE_ERROR', le);
                }
            });

            const recId = parent.save();
            log.audit('PICKLIST_SAVED', recId);

            context.write('created_record', recId);

            // if (recId) {
            //     const ifMap = createitemFullfillment(recId, data.pickDate);
            //     updatePickListDetails(recId, ifMap);
            // }

            log.audit('REDUCE_COMPLETE', context.key);

        } catch (e) {
            log.error('REDUCE_ERROR', e);
            throw e;
        }
    };

    function createCustomInvDetail(itemId, qty, unit, allocatedLots) {
        try {
            log.debug('CREATE_INV_DET_START', { itemId, qty, unit, lotCount: allocatedLots.length });

            const invDet = record.create({
                type: 'customrecord_cuctom_inv_det',
                isDynamic: true
            });

            invDet.setValue({ fieldId: 'custrecord_cust_inv_det_item', value: Number(itemId) });
            invDet.setValue({ fieldId: 'custrecord_cust_inv_det_quantity', value: Number(qty) || 0 });

            if (unit) {
                invDet.setValue({ fieldId: 'custrecord_cust_inv_det_unit', value: unit });
            }

            allocatedLots.forEach((lot, i) => {
                try {
                    invDet.selectNewLine({ sublistId: 'recmachcustrecord_inv_bin_lot_det_parent_link' });

                    invDet.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_inv_bin_lot_det_parent_link',
                        fieldId: 'custrecord_inv_bin_lot_det_lot_num',
                        value: Number(lot.serialid)
                    });

                    if (lot.bin_id) {
                        invDet.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_inv_bin_lot_det_parent_link',
                            fieldId: 'custrecord_inv_bin_lot_det_bin_num',
                            value: Number(lot.bin_id)
                        });
                    }

                    invDet.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_inv_bin_lot_det_parent_link',
                        fieldId: 'custrecord_inv_bin_lot_det_quantity',
                        value: Number(lot.qty) || 0
                    });

                    invDet.commitLine({ sublistId: 'recmachcustrecord_inv_bin_lot_det_parent_link' });

                    log.debug('INV_DET_LOT_ADDED', { i, serialid: lot.serialid, qty: lot.qty });

                } catch (lotErr) {
                    log.error('INV_DET_LOT_ERROR', { i, error: lotErr.message });
                }
            });

            const savedId = invDet.save();
            log.audit('INV_DET_SAVED', savedId);

            return savedId;

        } catch (e) {
            log.error('CREATE_INV_DET_ERROR', e);
            return null;
        }
    }

    function updatePickListDetails(recId, ifMap) {
        try {
            log.audit('UPDATE_START', { recId, ifCount: Object.keys(ifMap).length });

            Object.keys(ifMap).forEach(soId => {
                const ifId = ifMap[soId];

                const sql = `
                    SELECT id 
                    FROM customrecord_pick_list_details 
                    WHERE custrecord_pl_det_parent_link = ${recId} 
                    AND custrecord_pl_det_doc_num = ${soId}
                `;

                log.debug('UPDATE_SQL', sql);

                const res = query.runSuiteQL({ query: sql }).asMappedResults();

                log.debug('UPDATE_FOUND', { soId, count: res.length });

                res.forEach(r => {
                    record.submitFields({
                        type: 'customrecord_pick_list_details',
                        id: r.id,
                        values: { custrecord_pl_det_item_fullfill: ifId }
                    });

                    log.debug('UPDATED_LINE', { id: r.id, ifId });
                });
            });

            log.audit('UPDATE_DONE', 'SUCCESS');

        } catch (e) {
            log.error('UPDATE_ERROR', e);
        }
    }

    function loadUnitType(id, targetunit) {
        try {
            var rec = record.load({ type: 'unitstype', id: id });
            var lineCount = rec.getLineCount({ sublistId: 'uom' });

            for (var i = 0; i < lineCount; i++) {
                var unitName = rec.getSublistValue({
                    sublistId: 'uom',
                    fieldId: 'internalid',
                    line: i
                });

                if (unitName == targetunit) {
                    return {
                        conversionrate: rec.getSublistValue({
                            sublistId: 'uom',
                            fieldId: 'conversionrate',
                            line: i
                        })
                    };
                }
            }

            return null;

        } catch (e) {
            log.error('Error loading unitstype', e);
        }
    }

    function getunitype(item) {
        try {
            var result = query.runSuiteQL({
                query: `SELECT unitstype FROM item WHERE id = ?`,
                params: [item]
            }).asMappedResults();

            return result.length > 0 ? result[0] : null;

        } catch (e) {
            log.error('Error in getunitype', e);
        }
    }

    function createitemFullfillment(recId, pickDate) {
        try {
            log.audit('IF_START', recId);

            const sql = `
                SELECT 
                    custrecord_pl_det_doc_num AS soid,
                    custrecord_pl_det_item AS item,
                    SUM(custrecord_pl_det_picked_quantity) AS qty,
                    custrecord_pl_det_location AS locationid
                FROM customrecord_pick_list_details
                WHERE custrecord_pl_det_parent_link = ${recId}
                GROUP BY
                    custrecord_pl_det_doc_num,
                    custrecord_pl_det_item,
                    custrecord_pl_det_location
            `;

            log.debug('IF_SQL', sql);

            const results = query.runSuiteQL({ query: sql }).asMappedResults();

            log.debug('IF_RESULTS', results.length);

            let soMap = {};

            results.forEach(r => {
                if (!soMap[r.soid]) soMap[r.soid] = [];
                soMap[r.soid].push({
                    item: Number(r.item),
                    qty: Number(r.qty || 0),
                    locationId: Number(r.locationid)
                });
            });

            let ifMap = {};

            Object.keys(soMap).forEach(soId => {
                try {

                    log.audit('TRANSFORM_START', soId);

                    var recordtypesql = `
                        SELECT recordtype 
                        FROM transaction 
                        WHERE id = ${soId}
                    `;

                    const recTypeResult = query.runSuiteQL({
                        query: recordtypesql
                    }).asMappedResults();

                    const recType = recTypeResult?.[0]?.recordtype;

                    log.debug('REC_TYPE', recType);

                    let fromType;

                    if (recType === 'salesorder') {
                        fromType = record.Type.SALES_ORDER;
                    } else if (recType === 'transferorder') {
                        fromType = "transferorder";
                    } else if (recType === 'intercompanytransferorder') {
                        fromType = "intercompanytransferorder";
                    } else {
                        throw new Error('Unsupported record type: ' + recType);
                    }

                    const ifRec = record.transform({
                        fromType: fromType,
                        fromId: soId,
                        toType: record.Type.ITEM_FULFILLMENT,
                        isDynamic: true
                    });

                    const items = soMap[soId];
                    const lineCount = ifRec.getLineCount({ sublistId: 'item' });

                    for (let i = 0; i < lineCount; i++) {

                        const itemId = Number(ifRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        }));

                        const match = items.find(x => Number(x.item) === itemId);

                        ifRec.selectLine({ sublistId: 'item', line: i });

                        if (!match) {
                            ifRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'itemreceive',
                                value: false
                            });
                            ifRec.commitLine({ sublistId: 'item' });
                            continue;
                        }

                        let remaining = Number(match.qty);

                        const locId = Number(ifRec.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'location'
                        }));

                        ifRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemreceive',
                            value: true
                        });

                        var getdetails = getunitype(itemId);
                        if (!getdetails) {
                            ifRec.commitLine({ sublistId: 'item' });
                            continue;
                        }

                        var baseunit = getdetails.unitstype;
                        var finalunitrate = 1;

                        if (baseunit) {
                            var unit = ifRec.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'units'
                            });

                            var unitData = loadUnitType(baseunit, unit);

                            if (unitData && unitData.conversionrate) {
                                finalunitrate = parseFloat(unitData.conversionrate) || 1;
                            }
                        }

                        ifRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: remaining
                        });

                        try {

                            const subrec = ifRec.getCurrentSublistSubrecord({
                                sublistId: 'item',
                                fieldId: 'inventorydetail'
                            });

                            if (subrec) {

                                const lots = getFifoLots(itemId, locId);

                                for (let j = 0; j < lots.length && remaining > 0; j++) {

                                    const lot = lots[j];

                                    const rawQty = Math.min(remaining, lot.qty);

                                    const useQty = parseFloat(rawQty * finalunitrate);

                                    subrec.selectNewLine({
                                        sublistId: 'inventoryassignment'
                                    });

                                    subrec.setCurrentSublistValue({
                                        sublistId: 'inventoryassignment',
                                        fieldId: 'issueinventorynumber',
                                        value: Number(lot.serialid)
                                    });

                                    if (lot.bin_id) {
                                        subrec.setCurrentSublistValue({
                                            sublistId: 'inventoryassignment',
                                            fieldId: 'binnumber',
                                            value: Number(lot.bin_id)
                                        });
                                    }

                                    subrec.setCurrentSublistValue({
                                        sublistId: 'inventoryassignment',
                                        fieldId: 'quantity',
                                        value: useQty
                                    });

                                    subrec.commitLine({
                                        sublistId: 'inventoryassignment'
                                    });

                                    remaining -= rawQty;
                                }
                            }

                        } catch (e) {
                            log.debug('NO_INVENTORY_DETAIL', {
                                itemId,
                                message: e.message
                            });
                        }

                        ifRec.commitLine({ sublistId: 'item' });
                    }

                    const ifId = ifRec.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });

                    ifMap[soId] = ifId;

                    log.audit('IF_SAVED', { soId, ifId });

                } catch (soErr) {
                    log.error({
                        title: 'SO_PROCESS_ERROR',
                        details: {
                            name: soErr.name,
                            message: soErr.message,
                            stack: soErr.stack
                        }
                    });
                }
            });

            return ifMap;

        } catch (e) {
            log.error('IF_CREATE_ERROR', e);
            throw e;
        }
    }

    function getFifoLots(itemId, locationID) {
        try {
            log.debug('FIFO_START', { itemId, locationID });

            const sql = `
                SELECT 
                    F.inventorynumber AS lot_number,
                    F.id AS serialid,
                    SUM(B.quantityavailable) AS available_qty,
                    B.location,
                    CASE 
                        WHEN I.usebins = 'T' THEN BN.id
                        ELSE NULL
                    END AS bin_id,
                    CASE 
                        WHEN I.usebins = 'T' THEN BN.binnumber
                        ELSE NULL
                    END AS bin_number
                FROM InventoryNumber F
                INNER JOIN InventoryBalance B
                    ON B.inventorynumber = F.id
                    AND B.item = F.item
                INNER JOIN Item I
                    ON I.id = F.item
                LEFT JOIN Bin BN
                    ON BN.id = B.binnumber
                    AND I.usebins = 'T'
                WHERE 
                    F.item = ${itemId}
                    AND B.location = ${locationID}
                GROUP BY 
                    F.inventorynumber,
                    F.id,
                    B.location,
                    I.usebins,
                    BN.id,
                    BN.binnumber
                HAVING SUM(B.quantityavailable) > 0
            `;

            log.debug('FIFO_SQL', sql);

            const res = query.runSuiteQL({ query: sql }).asMappedResults();

            log.debug('FIFO_COUNT', res.length);

            return res.map(r => ({
                serialid: r.serialid,
                qty: Number(r.available_qty || 0),
                bin_id: r.bin_id || null,
                bin_number: r.bin_number || null
            }));

        } catch (e) {
            log.error('FIFO_ERROR', e);
            return [];
        }
    }

    function getinstockdetails(item, location) {
        try {
            log.debug('INSTOCK_START', { item, location });

            const sql = `
                SELECT quantityonhand, quantityavailable 
                FROM AggregateItemLocation 
                WHERE item = ${item} AND location = ${location}
            `;

            const res = query.runSuiteQL({ query: sql }).asMappedResults();

            log.debug('INSTOCK_RESULT', res);

            if (res.length > 0) {
                return {
                    onhand: Number(res[0].quantityonhand || 0),
                    available: Number(res[0].quantityavailable || 0)
                };
            }

            return { onhand: 0, available: 0 };

        } catch (e) {
            log.error('INSTOCK_ERROR', e);
            return { onhand: 0, available: 0 };
        }
    }

    const summarize = (summary) => {
        try {
            const createdIds = [];
            summary.output.iterator().each((key, value) => {
                if (key === 'created_record') {
                    createdIds.push(value);
                }
                return true;
            });
            log.audit('SUMMARIZE_CREATED_IDS', createdIds);

            if (createdIds.length > 0) {
                const userId = runtime.getCurrentUser().id;
                
                const folderId = 574;

                // Delete any existing file for this user first to clean up
                try {
                    // const search = require('N/search');
                    search.create({
                        type: 'file',
                        filters: [
                            ['name', 'is', 'picklist_user_' + userId + '.json'],
                            'AND',
                            ['folder', 'anyof', folderId]
                        ]
                    }).run().each(function(result) {
                        file.delete({ id: result.id });
                        return true;
                    });
                } catch (delErr) {
                    log.error('Error deleting existing file', delErr);
                }

                // Create and save new file
                const fileObj = file.create({
                    name: 'picklist_user_' + userId + '.json',
                    fileType: file.Type.PLAINTEXT,
                    contents: JSON.stringify(createdIds),
                    folder: folderId
                });
                const fileId = fileObj.save();
                log.audit('FILE_CREATED', { fileId, userId, createdIds });
            }
        } catch (e) {
            log.error('SUMMARIZE_ERROR', e);
        }
    };

    return {
        getInputData,
        reduce,
        summarize
    };
});