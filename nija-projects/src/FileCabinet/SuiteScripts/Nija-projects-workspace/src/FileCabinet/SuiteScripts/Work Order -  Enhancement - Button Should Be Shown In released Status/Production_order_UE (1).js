/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/query', 'N/ui/serverWidget','N/search'],
    function (record, log, query, serverWidget,search) {

        function beforeLoad(context) {
            var form = context.form;
            var currentrecord = context.newRecord;
            var recordId = currentrecord.id;
            log.debug('recordId', recordId);
            
            if (recordId) {
                var recordObj = record.load({
                    type: 'customrecord_njt_product_order',
                    id: recordId,
                    isDynamic: true
                });
                var approvalStatus = recordObj.getValue('custrecord_njt_prod_status');
                var lineCount = recordObj.getLineCount({ sublistId: "recmachcustrecord_njt_pro_2" });
                
                var hasMaterialRequestLine = false;
                var hasPurchaseReqLine = false;
              //var hasSFGProcessLine = false;
                
                for (var i = 0; i < lineCount; i++) {
                    var itemType = recordObj.getSublistValue({
                        sublistId: 'recmachcustrecord_njt_pro_2',
                        fieldId: 'custrecord_njt_itm_type',
                        line: i
                    });
                    var productionPosting = recordObj.getSublistValue({
                        sublistId: 'recmachcustrecord_njt_pro_2',
                        fieldId: 'custrecord_njt_production_posting',
                        line: i
                    });
                    var productionDetailsJE = recordObj.getSublistValue({
                        sublistId: 'recmachcustrecord_njt_pro_2',
                        fieldId: 'custrecord_njt_production_details_je',
                        line: i
                    });
                    var balanceQty = recordObj.getSublistValue({
                        sublistId: 'recmachcustrecord_njt_pro_2',
                        fieldId: 'custrecord_njt_balan_qnty',
                        line: i
                    });

                    // Parse balance quantity to ensure it can be checked as a number
                    var parsedBalanceQty = parseFloat(balanceQty) || 0;
                    
                    // Material Request: custrecord_njt_production_posting=true AND custrecord_njt_itm_type=1 AND custrecord_njt_production_details_je is EMPTY AND balanceQty > 0
                    if (itemType == 1 && productionPosting == true && !productionDetailsJE) {
                        hasMaterialRequestLine = true;
                    }
                    
                    // Purchase Req: custrecord_njt_itm_type=6 AND custrecord_njt_production_posting=false AND custrecord_njt_production_details_je empty AND balanceQty > 0
                    if (itemType == 6 && productionPosting == true && !productionDetailsJE) {
                        hasPurchaseReqLine = true;
                    }
                  /* if (itemType == 7 && productionPosting == true) {
                hasSFGProcessLine = true;
                log.debug('SFG Process Line Found', 'Line: ' + i);
            } */
                }
                
                log.debug('approvalStatus', approvalStatus);
                log.debug('hasMaterialRequestLine', hasMaterialRequestLine);
                log.debug('hasPurchaseReqLine', hasPurchaseReqLine);
                
                if (context.type == 'view' && approvalStatus == 2) {
                    form.addButton({
                        id: 'custpage_material_request',
                        label: 'Material Request',
                        functionName: 'createMaterialRequest()'
                    });
                    form.addButton({
                        id: 'custpage_btn_create_custom_record',
                        label: 'Over Head Request',
                        functionName: 'openCustomRecord'
                    });
                }
              
                
                // if (context.type == 'view' && approvalStatus == 2) {
                //     form.addButton({
                //         id: 'custpage_purchase_req',
                //         label: 'Purchase Req',
                //         functionName: 'createPurchaseReq()'
                //     });
                // }
//               if (
//     context.type == 'view' &&
//     approvalStatus == 2 
//    // && hasMultipleSubsidiary
// ) {
//     form.addButton({
//         id: 'custpage_inventory_company',
//         label: 'IC Transfer',
//         functionName: 'intercomReq()'
//     });
// }
                //create cogs button posting
               /* if (context.type == 'view' && approvalStatus == 2) {
                    form.addButton({
                        id: 'custpage_cogs_request',
                        label: 'COGS Posting',
                        functionName: 'createCogs()'
                    });
                } */
                
                /* if (context.type == 'view' && approvalStatus == 2) {
                    form.addButton({
                        id: 'custpage_production_receipt',
                        label: 'Production Receipt',
                        functionName: 'createPR()'
                    });
                } */
              //production issues button
              if (context.type == 'view' && approvalStatus == 2) {
                    form.addButton({
                        id: 'custpage_production_issues',
                        label: 'Production Issue',
                        functionName: 'prissue()'
                    });
                }
             // ===== CHECK MULTIPLE SUBSIDIARIES IN SUBLIST =====
var sublistId = 'recmachcustrecord_njt_pro_2';
var subsidiaryField = 'custrecord_njt_po_subsidiary';

var lineCount = recordObj.getLineCount({ sublistId: sublistId });

var subsidiaryMap = {}; // To store unique subsidiaries
var hasMultipleSubsidiary = false;

for (var i = 0; i < lineCount; i++) {

    var subValue = recordObj.getSublistValue({
        sublistId: sublistId,
        fieldId: subsidiaryField,
        line: i
    });

    if (subValue) {

        // If this subsidiary already exists → skip
        if (!subsidiaryMap[subValue]) {
            subsidiaryMap[subValue] = true;
        }

        // If more than 1 unique found → stop loop
        if (Object.keys(subsidiaryMap).length > 1) {
            hasMultipleSubsidiary = true;
            break;
        }
    }
}

log.debug('Unique Subsidiaries', Object.keys(subsidiaryMap));
log.debug('Has Multiple Subsidiary', hasMultipleSubsidiary);


// ===== SHOW BUTTON ONLY IF MULTIPLE SUBSIDIARY EXISTS =====

              /* if (context.type == 'view' && approvalStatus == 2 && hasSFGProcessLine) {
            form.addButton({
                id: 'custpage_sfg_process',
                label: 'SFG Process',
                functionName: 'createSFGProcess()'
            });
            log.debug('SFG Process Button Added');
        } */
                
                if (context.type === context.UserEventType.VIEW && approvalStatus == 3) {
                    form.removeButton({ id: 'edit' });
                }
                
                if (context.type === context.UserEventType.VIEW && (approvalStatus == 1 || approvalStatus == 2)) {
                    form.addButton({
                        id: 'custpage_close',
                        label: 'Close',
                        functionName: 'Close()'
                    });
                }
            }
            
            /* if (context.type === context.UserEventType.VIEW || 
                context.type === context.UserEventType.EDIT || 
                context.type === context.UserEventType.CREATE) {
                var newField = form.addField({
                    id: 'custpage_item_prod_ord',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Production Item'
                });
                newField.isMandatory = true;
                form.insertField({
                    field: newField,
                    nextfield: 'custrecord_njt_itm_name'
                });
            }
             */
            form.clientScriptModulePath = './Production_order_Validation_CS.js';
        }

        /* function afterSubmit(context) {
            var recordType = context.newRecord.type;
            var recordId = context.newRecord.id;
            var oldRecordObj = context.oldRecord;
            var productionOrder = record.load({
                type: recordType,
                id: recordId,
                isDynamic: true
            });
            var status = productionOrder.getValue('custrecord_njt_prod_status');
            var oldStatus = '';
            if (oldRecordObj) {
                oldStatus = oldRecordObj.getValue('custrecord_njt_prod_status');
            }
            
            if (oldStatus != 3 && status == 3) {
                var subSQLqty = "SELECT SUM(t2.custrecord_njt_recei_quan_item) as qty FROM customrecord_njt_prod_recei t1 " +
                               "LEFT JOIN customrecord_njt_prod_recei_detai t2 ON t2.custrecord_njt_recei_link = t1.id " +
                               "WHERE t1.custrecord_njt_order_numb = " + recordId;
                log.debug('SubSQLqty', subSQLqty);
                var records = getResult(subSQLqty);
                var qty = 0;
                if (records.length > 0) {
                    qty = records[0].qty || 0;
                }
                
                var sqlIA = "SELECT SUM(trl.rate) as estimateunitcost FROM customrecord_njt_prod_issue t1 " +
                           "LEFT JOIN transaction tr ON tr.id = t1.custrecord_njt_invent_adjust " +
                           "LEFT JOIN transactionline trl ON tr.id = trl.transaction " +
                           "LEFT JOIN item it ON it.id = trl.item " +
                           "WHERE t1.custrecord_njt_prod_num = " + recordId;
                log.debug('SQLIA', sqlIA);
                var recordsIA = getResult(sqlIA);
                var estimateunitcost = 0;
                if (recordsIA.length > 0) {
                    estimateunitcost = recordsIA[0].estimateunitcost || 0;
                }
                
                var sqlJV = "SELECT SUM(trl.netamount) as JVamount FROM customrecord_njt_prod_issue t1 " +
                           "LEFT JOIN transaction tr ON tr.id = t1.custrecord_njt_journal_entry " +
                           "LEFT JOIN transactionline trl ON tr.id = trl.transaction " +
                           "LEFT JOIN item it ON it.id = trl.item " +
                           "WHERE trl.netamount > 0 AND t1.custrecord_njt_prod_num = " + recordId;
                log.debug('SQLJV', sqlJV);
                var recordsJV = getResult(sqlJV);
                var JVamount = 0;
                if (recordsJV.length > 0) {
                    JVamount = recordsJV[0].JVamount || 0;
                }
                
                log.debug('JVamount', JVamount);
                log.debug('estimateunitcost', estimateunitcost);
                log.debug('qty', qty);
                
                var totalamount = parseFloat(JVamount) + parseFloat(estimateunitcost);
                log.debug('totalamount', totalamount);
                var adjustamount = qty > 0 ? totalamount / qty : 0;
                log.debug('adjustamount', adjustamount);
                
                var sqlRec = "SELECT t1.id as iaid FROM customrecord_njt_prod_recei t1 " +
                            "LEFT JOIN customrecord_njt_prod_recei_detai t2 ON t2.custrecord_njt_recei_link = t1.id " +
                            "WHERE t1.custrecord_njt_order_numb = " + recordId;
                log.debug('SQLRec', sqlRec);
                var recordsRec = getResult(sqlRec);
                
                if (recordsRec.length > 0) {
                    for (var r = 0; r < recordsRec.length; r++) {
                        var iaid = recordsRec[r].iaid;
                        if (iaid) {
                            var IARecobj = record.load({
                                type: 'inventoryadjustment',
                                id: iaid,
                                isDynamic: true
                            });
                            var IACount = IARecobj.getLineCount({ sublistId: 'inventory' });
                            for (var j = 0; j < IACount; j++) {
                                var IAqty = IARecobj.getSublistValue({
                                    sublistId: 'inventory',
                                    fieldId: 'adjustqtyby',
                                    line: j
                                });
                                var iaamount = adjustamount * IAqty;
                                IARecobj.setCurrentSublistValue({
                                    sublistId: 'inventory',
                                    fieldId: 'unitcost',
                                    value: iaamount,
                                    forceSyncSourcing: true,
                                    ignoreFieldChange: false
                                });
                                IARecobj.commitLine({ sublistId: 'inventory' });
                            }
                            var IARecobjSaved = IARecobj.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            });
                            log.debug('IARecobjSaved', IARecobjSaved);
                        }
                    }
                }
            }
        } */
       function afterSubmit(context) {
        try {
            // Skip DELETE events
            if (context.type === context.UserEventType.DELETE) return;

            var recordType = context.newRecord.type;
            var recordId = context.newRecord.id;
            var oldRecordObj = context.oldRecord;

            // Reload current record for processing
            var productionOrder = record.load({
                type: recordType,
                id: recordId,
                isDynamic: true
            });

            // Get current status
            var status = productionOrder.getValue('custrecord_njt_prod_status');
            var oldStatus = '';
            if (oldRecordObj) {
                oldStatus = oldRecordObj.getValue('custrecord_njt_prod_status');
            }

            log.debug('Status Check', 'Old: ' + oldStatus + ', New: ' + status);

            // === PART 1: EXISTING LOGIC - IA Update when status changes to 3 ===
            if (oldStatus != 3 && status == 3) {
                log.debug('Processing IA Update Logic', 'Status changed to 3');

                // Calculate total received quantity
                var subSQLqty = "SELECT SUM(t2.custrecord_njt_recei_quan_item) as qty FROM customrecord_njt_prod_recei t1 " +
                               "LEFT JOIN customrecord_njt_prod_recei_detai t2 ON t2.custrecord_njt_recei_link = t1.id " +
                               "WHERE t1.custrecord_njt_order_numb = " + recordId;
                log.debug('SubSQLqty', subSQLqty);
                var records = getResult(subSQLqty);
                var qty = 0;
                if (records.length > 0) {
                    qty = records[0].qty || 0;
                }

                // Calculate estimate unit cost from Inventory Adjustments
                var sqlIA = "SELECT SUM(trl.rate) as estimateunitcost FROM customrecord_njt_prod_issue t1 " +
                           "LEFT JOIN transaction tr ON tr.id = t1.custrecord_njt_invent_adjust " +
                           "LEFT JOIN transactionline trl ON tr.id = trl.transaction " +
                           "LEFT JOIN item it ON it.id = trl.item " +
                           "WHERE t1.custrecord_njt_prod_num = " + recordId;
                log.debug('SQLIA', sqlIA);
                var recordsIA = getResult(sqlIA);
                var estimateunitcost = 0;
                if (recordsIA.length > 0) {
                    estimateunitcost = recordsIA[0].estimateunitcost || 0;
                }

                // Calculate JV amount
                var sqlJV = "SELECT SUM(trl.netamount) as JVamount FROM customrecord_njt_prod_issue t1 " +
                           "LEFT JOIN transaction tr ON tr.id = t1.custrecord_njt_journal_entry " +
                           "LEFT JOIN transactionline trl ON tr.id = trl.transaction " +
                           "LEFT JOIN item it ON it.id = trl.item " +
                           "WHERE trl.netamount > 0 AND t1.custrecord_njt_prod_num = " + recordId;
                log.debug('SQLJV', sqlJV);
                var recordsJV = getResult(sqlJV);
                var JVamount = 0;
                if (recordsJV.length > 0) {
                    JVamount = recordsJV[0].JVamount || 0;
                }

                log.debug('Calculations', {
                    JVamount: JVamount,
                    estimateunitcost: estimateunitcost,
                    qty: qty
                });

                var totalamount = parseFloat(JVamount) + parseFloat(estimateunitcost);
                var adjustamount = qty > 0 ? totalamount / qty : 0;

                // Update IA records
                var sqlRec = "SELECT t1.id as iaid FROM customrecord_njt_prod_recei t1 " +
                            "LEFT JOIN customrecord_njt_prod_recei_detai t2 ON t2.custrecord_njt_recei_link = t1.id " +
                            "WHERE t1.custrecord_njt_order_numb = " + recordId;
                var recordsRec = getResult(sqlRec);

                if (recordsRec.length > 0) {
                    for (var r = 0; r < recordsRec.length; r++) {
                        var iaid = recordsRec[r].iaid;
                        if (iaid) {
                            var IARecobj = record.load({
                                type: 'inventoryadjustment',
                                id: iaid,
                                isDynamic: true
                            });
                            var IACount = IARecobj.getLineCount({ sublistId: 'inventory' });
                            for (var j = 0; j < IACount; j++) {
                                var IAqty = IARecobj.getSublistValue({
                                    sublistId: 'inventory',
                                    fieldId: 'adjustqtyby',
                                    line: j
                                });
                                var iaamount = adjustamount * IAqty;
                                IARecobj.setCurrentSublistValue({
                                    sublistId: 'inventory',
                                    fieldId: 'unitcost',
                                    value: iaamount,
                                    forceSyncSourcing: true,
                                    ignoreFieldChange: false
                                });
                                IARecobj.commitLine({ sublistId: 'inventory' });
                            }
                            var IARecobjSaved = IARecobj.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            });
                            log.debug('IA Updated', IARecobjSaved);
                        }
                    }
                }
            }

            /* // === PART 2: Create Child Production Order + Update Parent Sublist ===
            var lineCount = productionOrder.getLineCount({ sublistId: 'recmachcustrecord_njt_pro_2' });
            log.debug('Checking Lines for Type 7', 'Total Lines: ' + lineCount);

            var createChildOrder = false;
            for (var i = 0; i < lineCount; i++) {
                var itemType = productionOrder.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecord_njt_itm_type',
                    line: i
                });
                var productionPosting = productionOrder.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecord_njt_production_posting',
                    line: i
                });
              

                log.debug('Line ' + i, 'Type: ' + itemType + ', Posting: ' + productionPosting);

                if (itemType == 7 && productionPosting == true) {
                    createChildOrder = true;
                    log.debug('Child Order Trigger Found', 'Line: ' + i);
                    break;
                }
            }

            // Create Child Production Order if conditions met
            if (createChildOrder) {
                log.debug('Creating Child Production Order', 'Parent ID: ' + recordId);

                // Create new child production order record
                var childProdOrder = record.create({
                    type: 'customrecord_njt_product_order',
                    isDynamic: true
                });

                // Set Parent Production Order reference
                childProdOrder.setValue({
                    fieldId: 'custrecord_njt_parent_prodcu_ord',
                    value: recordId
                });
                log.debug('Parent Reference Set', recordId);

                // Set as Child Record
                childProdOrder.setValue({
                    fieldId: 'custrecord_njt_production_ischild',
                    value: true
                });
                log.debug('Child Flag Set', true);

                // Set Item = 18545
                childProdOrder.setValue({
                    fieldId: 'custrecord_njt_itm',
                    value: 18545
                });
                log.debug('Item Set', 18545);

                // Set Division = 2
                childProdOrder.setValue({
                    fieldId: 'custrecord_njt_pro_ord_devision',
                    value: 2
                });
                log.debug('Division Set', 2);

                // Get Parent record values for Project, Account, Location
                var parentProject = productionOrder.getValue('custrecord_njt_project_2');
                var parentAccount = productionOrder.getValue('custrecord_njt_acnt');
                var parentLocation = productionOrder.getValue('custrecord_njt_location_');

                log.debug('Parent Values', {
                    project: parentProject,
                    account: parentAccount,
                    location: parentLocation
                });

                // Set Project from parent
                if (parentProject) {
                    childProdOrder.setValue({
                        fieldId: 'custrecord_njt_project_2',
                        value: parentProject
                    });
                    log.debug('Project Copied from Parent', parentProject);
                }

                // Set Account from parent
                if (parentAccount) {
                    childProdOrder.setValue({
                        fieldId: 'custrecord_njt_acnt',
                        value: parentAccount
                    });
                    log.debug('Account Copied from Parent', parentAccount);
                }

                // Set Location from parent
                if (parentLocation) {
                    childProdOrder.setValue({
                        fieldId: 'custrecord_njt_location_',
                        value: parentLocation
                    });
                    log.debug('Location Copied from Parent', parentLocation);
                }

                // Save Child Production Order
                var childOrderId = childProdOrder.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('Child Production Order Created Successfully', childOrderId);

                // === NEW: RELOAD PARENT AND UPDATE SUBLIST ===
                log.debug('Updating Parent Sublist with SFG Reference', childOrderId);
                
                // Reload parent record (since it was modified earlier)
                var parentRecord = record.load({
                    type: 'customrecord_njt_product_order',
                    id: recordId,
                    isDynamic: true
                });
                
                log.debug('Parent Record Reloaded', parentRecord.id);

                // Get sublist line count
                var sublistLineCount = parentRecord.getLineCount({
                    sublistId: 'recmachcustrecord_njt_pro_2'
                });
                log.debug('Parent Sublist Lines', sublistLineCount);

                // Loop through ALL lines to find Type 7 lines
                for (var lineIndex = 0; lineIndex < sublistLineCount; lineIndex++) {
                    var lineItemType = parentRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_njt_pro_2',
                        fieldId: 'custrecord_njt_itm_type',
                        line: lineIndex
                    });
                    var lineProductionPosting = parentRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_njt_pro_2',
                        fieldId: 'custrecord_njt_production_posting',
                        line: lineIndex
                    });

                    log.debug('Checking Line ' + lineIndex, {
                        itemType: lineItemType,
                        productionPosting: lineProductionPosting
                    });

                    // Update ONLY lines where itemType=7 AND productionPosting=true
                    if (lineItemType == 7 && lineProductionPosting == true) {
                        log.debug('Updating SFG Reference - Line ' + lineIndex, childOrderId);
                        
                        parentRecord.selectLine({
                            sublistId: 'recmachcustrecord_njt_pro_2',
                            line: lineIndex
                        });

                        parentRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_njt_pro_2',
                            fieldId: 'custrecord_njt_product_details_sfgref',
                            value: childOrderId,
                            ignoreFieldChange: true
                        });

                        parentRecord.commitLine({
                            sublistId: 'recmachcustrecord_njt_pro_2'
                        });
                        
                        log.debug('SFG Reference Set Successfully', 'Line: ' + lineIndex + ', SFG ID: ' + childOrderId);
                    }
                }

                // Save updated parent record
                var parentSavedFinal = parentRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('Parent Record Saved with SFG References', parentSavedFinal);

                // Update Parent record with child order reference (header field)
                parentRecord.setValue({
                    fieldId: 'custrecord_njt_parent_prodcu_ord',
                    value: childOrderId
                });
                var parentSaved = parentRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('Parent Updated with Child Reference', parentSaved);
            } */
         /*  // === PART 2: Create Child Production Order + Update Parent Sublist ===
var lineCount = productionOrder.getLineCount({ sublistId: 'recmachcustrecord_njt_pro_2' });
log.debug('Checking Lines for Type 7', 'Total Lines: ' + lineCount);

var createChildOrder = false;
var type7LineData = null;  // Store Type 7 line data

// Loop 1: Find Type 7 line and collect dynamic data
for (var i = 0; i < lineCount; i++) {
    var itemType = productionOrder.getSublistValue({
        sublistId: 'recmachcustrecord_njt_pro_2',
        fieldId: 'custrecord_njt_itm_type',
        line: i
    });
    var productionPosting = productionOrder.getSublistValue({
        sublistId: 'recmachcustrecord_njt_pro_2',
        fieldId: 'custrecord_njt_production_posting',
        line: i
    });

    log.debug('Line ' + i, 'Type: ' + itemType + ', Posting: ' + productionPosting);

    // NEW: Collect DYNAMIC data from Type 7 line
    if (itemType == 7 && productionPosting == true) {
        createChildOrder = true;
        
        // Get DYNAMIC values from this Type 7 line
        type7LineData = {
            itemCode: productionOrder.getSublistValue({
                sublistId: 'recmachcustrecord_njt_pro_2',
                fieldId: 'custrecord_njt_itm_code',
                line: i
            }),
            plannedQty: productionOrder.getSublistValue({
                sublistId: 'recmachcustrecord_njt_pro_2',
                fieldId: 'custrecord_njt_planned_qnty',
                line: i
            }),
            productionDivision: productionOrder.getSublistValue({
                sublistId: 'recmachcustrecord_njt_pro_2',
                fieldId: 'custrecord_njt_production_division',
                line: i
            }),
            // NEW: Get Subsidiary from sublist
            subsidiary: productionOrder.getSublistValue({
                sublistId: 'recmachcustrecord_njt_pro_2',
                fieldId: 'custrecord_njt_po_subsidiary',
                line: i
            })
        };
        
        log.debug('Type 7 Line Data Found', 'Line: ' + i);
        log.debug('Dynamic Data Collected', JSON.stringify(type7LineData));
        log.debug('Child Order Trigger Found', 'Line: ' + i);
        break;  // Use first matching Type 7 line
    }
}

// Create Child Production Order if conditions met
if (createChildOrder && type7LineData) {
    log.debug('Creating Child Production Order with Dynamic Data', 'Parent ID: ' + recordId);

    // Create new child production order record
    var childProdOrder = record.create({
        type: 'customrecord_njt_product_order',
        isDynamic: true
    });
    log.debug('Child Record Created', 'Type: customrecord_njt_product_order');

    // Set Parent Production Order reference
    childProdOrder.setValue({
        fieldId: 'custrecord_njt_parent_prodcu_ord',
        value: recordId
    });
    log.debug('1. Parent Reference Set', recordId);

    // Set as Child Record
    childProdOrder.setValue({
        fieldId: 'custrecord_njt_production_ischild',
        value: true
    });
    log.debug('2. Child Flag Set', true);

    // DYNAMICALLY set Item from Type 7 line (custrecord_njt_itm_code)
    if (type7LineData.itemCode) {
        childProdOrder.setValue({
            fieldId: 'custrecord_njt_itm',
            value: type7LineData.itemCode
        });
        log.debug('3. DYNAMIC Item Set from Line', type7LineData.itemCode);
    } else {
        // Fallback to hardcoded 18545 if no item code
        childProdOrder.setValue({
            fieldId: 'custrecord_njt_itm',
            value: 18545
        });
        log.debug('3. FALLBACK Item Set', 18545);
    }

    // DYNAMICALLY set Planned Quantity from Type 7 line (custrecord_njt_planned_qnty)
    if (type7LineData.plannedQty) {
        childProdOrder.setValue({
            fieldId: 'custrecord_njt_plan_qnty',
            value: type7LineData.plannedQty
        });
        log.debug('4. DYNAMIC Planned Qty Set from Line', type7LineData.plannedQty);
    }
    log.debug('4. Planned Qty Processed');

    // DYNAMICALLY set Division from Type 7 line (custrecord_njt_production_division)
    if (type7LineData.productionDivision) {
        childProdOrder.setValue({
            fieldId: 'custrecord_njt_pro_ord_devision',
            value: type7LineData.productionDivision
        });
        log.debug('5. DYNAMIC Division Set from Line', type7LineData.productionDivision);
    } else {
        // Fallback to hardcoded division 2
        childProdOrder.setValue({
            fieldId: 'custrecord_njt_pro_ord_devision',
            value: 2
        });
        log.debug('5. FALLBACK Division Set', 2);
    }

    // NEW: DYNAMICALLY set Subsidiary from Type 7 line (custrecord_njt_po_subsidiary → custrecord_njt_subsidiar)
    if (type7LineData.subsidiary) {
        childProdOrder.setValue({
            fieldId: 'custrecord_njt_subsidiar',
            value: type7LineData.subsidiary
        });
        log.debug('6. DYNAMIC Subsidiary Set from Line', type7LineData.subsidiary);
    } else {
        // Fallback: Try parent header subsidiary or skip
        log.debug('6. No Subsidiary from Line, checking parent header');
        var parentSubsidiary = productionOrder.getValue('custrecord_njt_subsidiar');
        if (parentSubsidiary) {
            childProdOrder.setValue({
                fieldId: 'custrecord_njt_subsidiar',
                value: parentSubsidiary
            });
            log.debug('6. Parent Header Subsidiary Used', parentSubsidiary);
        } else {
            log.debug('6. WARNING: No Subsidiary Set');
        }
    }

    // Get Parent record values for Project, Account, Location
    var parentProject = productionOrder.getValue('custrecord_njt_project_2');
    var parentAccount = productionOrder.getValue('custrecord_njt_acnt');
    var parentLocation = productionOrder.getValue('custrecord_njt_location_');

    log.debug('Parent Header Values', {
        project: parentProject,
        account: parentAccount,
        location: parentLocation
    });

    // Set Project from parent
    if (parentProject) {
        childProdOrder.setValue({
            fieldId: 'custrecord_njt_project_2',
            value: parentProject
        });
        log.debug('7. Project Copied from Parent', parentProject);
    }

    // Set Account from parent
    if (parentAccount) {
        childProdOrder.setValue({
            fieldId: 'custrecord_njt_acnt',
            value: parentAccount
        });
        log.debug('8. Account Copied from Parent', parentAccount);
    }

    // Set Location from parent
    if (parentLocation) {
        childProdOrder.setValue({
            fieldId: 'custrecord_njt_location_',
            value: parentLocation
        });
        log.debug('9. Location Copied from Parent', parentLocation);
    }

    // Save Child Production Order
    var childOrderId = childProdOrder.save({
        enableSourcing: true,
        ignoreMandatoryFields: true
    });
    log.debug('10. Child Production Order CREATED Successfully', childOrderId);

    // === RELOAD PARENT AND UPDATE SUBLIST ===
    log.debug('11. Updating Parent Sublist with SFG Reference', childOrderId);
    
    // Reload parent record
    var parentRecord = record.load({
        type: 'customrecord_njt_product_order',
        id: recordId,
        isDynamic: true
    });
    log.debug('12. Parent Record Reloaded', parentRecord.id);

    // Get sublist line count
    var sublistLineCount = parentRecord.getLineCount({
        sublistId: 'recmachcustrecord_njt_pro_2'
    });
    log.debug('13. Parent Sublist Lines', sublistLineCount);

    // Loop through ALL lines to find Type 7 lines
    var sfgLinesUpdated = 0;
    for (var lineIndex = 0; lineIndex < sublistLineCount; lineIndex++) {
        var lineItemType = parentRecord.getSublistValue({
            sublistId: 'recmachcustrecord_njt_pro_2',
            fieldId: 'custrecord_njt_itm_type',
            line: lineIndex
        });
        var lineProductionPosting = parentRecord.getSublistValue({
            sublistId: 'recmachcustrecord_njt_pro_2',
            fieldId: 'custrecord_njt_production_posting',
            line: lineIndex
        });

        log.debug('14. Checking Line ' + lineIndex, {
            itemType: lineItemType,
            productionPosting: lineProductionPosting
        });

        // Update ONLY lines where itemType=7 AND productionPosting=true
        if (lineItemType == 7 && lineProductionPosting == true) {
            log.debug('15. Updating SFG Reference - Line ' + lineIndex, childOrderId);
            
            parentRecord.selectLine({
                sublistId: 'recmachcustrecord_njt_pro_2',
                line: lineIndex
            });

            parentRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_njt_pro_2',
                fieldId: 'custrecord_njt_product_details_sfgref',
                value: childOrderId,
                ignoreFieldChange: true
            });

            parentRecord.commitLine({
                sublistId: 'recmachcustrecord_njt_pro_2'
            });
            
            sfgLinesUpdated++;
            log.debug('16. SFG Reference Set Successfully', 'Line: ' + lineIndex + ', SFG ID: ' + childOrderId);
        }
    }
    log.debug('17. Total SFG Lines Updated', sfgLinesUpdated);

    // Save updated parent record
    var parentSavedFinal = parentRecord.save({
        enableSourcing: true,
        ignoreMandatoryFields: true
    });
    log.debug('18. FINAL: Parent Record Saved with SFG References', parentSavedFinal);
} */
// === PART 2: Create Child Production Order + Update Parent Sublist (NO DUPLICATES) ===

var lineCount = productionOrder.getLineCount({ sublistId: 'recmachcustrecord_njt_pro_2' });
log.debug('Checking Lines for Type 7', 'Total Lines: ' + lineCount);

var parentRecord = null; // We will load this only if we need to update lines

for (var i = 0; i < lineCount; i++) {
    var itemType = productionOrder.getSublistValue({
        sublistId: 'recmachcustrecord_njt_pro_2',
        fieldId: 'custrecord_njt_itm_type',
        line: i
    });
    var productionPosting = productionOrder.getSublistValue({
        sublistId: 'recmachcustrecord_njt_pro_2',
        fieldId: 'custrecord_njt_production_posting',
        line: i
    });
    var sfgRef = productionOrder.getSublistValue({
        sublistId: 'recmachcustrecord_njt_pro_2',
        fieldId: 'custrecord_njt_product_details_sfgref',
        line: i
    });

    log.debug('Line ' + i, 'Type: ' + itemType + ', Posting: ' + productionPosting + ', SFG Ref: ' + sfgRef);

    // ONLY process if Type is 7, Posting is true, and it does NOT already have an SFG Ref
    if (itemType == 7 && productionPosting == true && !sfgRef) {
        var type7LineData = {
            itemCode: productionOrder.getSublistValue({
                sublistId: 'recmachcustrecord_njt_pro_2',
                fieldId: 'custrecord_njt_itm_code',
                line: i
            }),
            plannedQty: productionOrder.getSublistValue({
                sublistId: 'recmachcustrecord_njt_pro_2',
                fieldId: 'custrecord_njt_planned_qnty',
                line: i
            }),
            productionDivision: productionOrder.getSublistValue({
                sublistId: 'recmachcustrecord_njt_pro_2',
                fieldId: 'custrecord_njt_production_division',
                line: i
            }),
            subsidiary: productionOrder.getSublistValue({
                sublistId: 'recmachcustrecord_njt_pro_2',
                fieldId: 'custrecord_njt_po_subsidiary',
                line: i
            })
        };
        
        log.debug('Type 7 Line Data Found (No SFG Ref)', 'Line: ' + i);
        log.debug('Dynamic Data Collected', JSON.stringify(type7LineData));

        var parentSubsidiary = type7LineData.subsidiary || productionOrder.getValue('custrecord_njt_subsidiar');
        var parentProject = productionOrder.getValue('custrecord_njt_project_2');
        var lineDivision = type7LineData.productionDivision || 2; 

        log.debug('Checking for Existing Child Order', 'Parent ID: ' + recordId + ' | Line Div: ' + lineDivision);

        var existingChildSearch = search.create({
            type: 'customrecord_njt_product_order',
            filters: [
                ['custrecord_njt_parent_prodcu_ord', 'anyof', recordId], 'AND',
                ['custrecord_njt_subsidiar', 'anyof', parentSubsidiary], 'AND',
                ['custrecord_njt_project_2', 'anyof', parentProject], 'AND',
                ['custrecord_njt_pro_ord_devision', 'anyof', lineDivision], 'AND',
                ['custrecord_njt_production_ischild', 'is', true]
            ],
            columns: ['internalid']
        });
        
        var existingResult = existingChildSearch.run().getRange({ start: 0, end: 1 })[0];
        var childOrderId = existingResult ? existingResult.id : null;
        
        if (childOrderId) {
            log.audit('EXISTING Child Order FOUND', 'Using existing Child ID: ' + childOrderId);
        } else {
            log.debug('Creating NEW Child Production Order with Dynamic Data', 'Parent ID: ' + recordId);

            var childProdOrder = record.create({
                type: 'customrecord_njt_product_order',
                isDynamic: true
            });

            childProdOrder.setValue({ fieldId: 'custrecord_njt_parent_prodcu_ord', value: recordId });
            childProdOrder.setValue({ fieldId: 'custrecord_njt_production_ischild', value: true });

            if (type7LineData.itemCode) {
                childProdOrder.setValue({ fieldId: 'custrecord_njt_itm', value: type7LineData.itemCode });
            } else {
                childProdOrder.setValue({ fieldId: 'custrecord_njt_itm', value: 18545 });
            }

            if (type7LineData.plannedQty) {
                childProdOrder.setValue({ fieldId: 'custrecord_njt_plan_qnty', value: type7LineData.plannedQty });
            }

            childProdOrder.setValue({ fieldId: 'custrecord_njt_pro_ord_devision', value: lineDivision });

            if (parentSubsidiary) {
                childProdOrder.setValue({ fieldId: 'custrecord_njt_subsidiar', value: parentSubsidiary });
            }

            var parentAccount = productionOrder.getValue('custrecord_njt_acnt');
            var parentLocation = productionOrder.getValue('custrecord_njt_location_');

            if (parentProject) {
                childProdOrder.setValue({ fieldId: 'custrecord_njt_project_2', value: parentProject });
            }
            if (parentAccount) {
                childProdOrder.setValue({ fieldId: 'custrecord_njt_acnt', value: parentAccount });
            }
            if (parentLocation) {
                childProdOrder.setValue({ fieldId: 'custrecord_njt_location_', value: parentLocation });
            }

            childOrderId = childProdOrder.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.debug('NEW Child Production Order CREATED Successfully', childOrderId);
        }
        
        if (childOrderId) {
            // Load parent record once if not loaded yet
            if (!parentRecord) {
                parentRecord = record.load({
                    type: 'customrecord_njt_product_order',
                    id: recordId,
                    isDynamic: true
                });
                log.debug('Parent Record Reloaded for Update', parentRecord.id);
            }
            
            log.debug('Updating SFG Reference - Line ' + i, childOrderId);
            
            parentRecord.selectLine({
                sublistId: 'recmachcustrecord_njt_pro_2',
                line: i
            });

            parentRecord.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_njt_pro_2',
                fieldId: 'custrecord_njt_product_details_sfgref',
                value: childOrderId,
                ignoreFieldChange: true
            });

            parentRecord.commitLine({
                sublistId: 'recmachcustrecord_njt_pro_2'
            });
            
            log.debug('SFG Reference Set Successfully', 'Line: ' + i + ', SFG ID: ' + childOrderId);
        }
    }
}

if (parentRecord) {
    var parentSavedFinal = parentRecord.save({
        enableSourcing: true,
        ignoreMandatoryFields: true
    });
    log.debug('FINAL: Parent Record Saved with SFG References', parentSavedFinal);
}

          // === PART 3: Update Sales Order with Production Order ID ===

try {
    var salesOrderId = productionOrder.getValue('custrecord_njt_sales_order_num');

    log.debug('Sales Order Fetch', salesOrderId);

    if (salesOrderId) {

        var salesOrderRec = record.load({
            type: record.Type.SALES_ORDER,
            id: salesOrderId,
            isDynamic: true
        });

        log.debug('Sales Order Loaded', salesOrderId);

        salesOrderRec.setValue({
            fieldId: 'custbody_njt_production_ord_id',
            value: recordId
        });

        var soSavedId = salesOrderRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });

        log.debug('Sales Order Updated with Production Order', soSavedId);

    } else {
        log.debug('No Sales Order Found', 'Field custrecord_njt_sales_order_num is empty');
    }

} catch (soErr) {
    log.error('Sales Order Update Error', soErr.toString());
}



        } catch (e) {
            log.error('afterSubmit Error', e.toString() + ' | Stack: ' + e.stack);
        }
    }

      function beforeSubmit(scriptContext) {


    if (scriptContext.type === scriptContext.UserEventType.CREATE) {
      var currentRecord = scriptContext.newRecord;

      var s_auto_prfix = "";
      var recordType = currentRecord.type.toLowerCase();

      // if (recordType === "customrecord_recruit_request_form") {
      //   s_auto_prfix = "RF";
      // } else if (recordType === "customrecord_njt_hr_shortlisted_candidat") {
      //   s_auto_prfix = "SC";
      // } else {
      //   s_auto_prfix = "LA";
      // }

      var i_rec_type_id = currentRecord.getValue({
        fieldId: "rectype",
      });

      var customrecord_hris_unique_reference_numbeSearchObj = search.create({
        type: "customrecord_hris_unique_reference_numbe",
        filters: [
          ["custrecord_hris_record_type", "anyof", i_rec_type_id],
          "AND",
          ["isinactive", "is", "F"],
        ],
        columns: [
          search.createColumn({
            name: "custrecord_hris_unique_number",
            label: "Unique Number",
          }),
          search.createColumn({ name: "internalid", label: "Internal ID" }),
        ],
      });

      var searchResultCount =
        customrecord_hris_unique_reference_numbeSearchObj.runPaged().count;

      if (searchResultCount > 0) {
        customrecord_hris_unique_reference_numbeSearchObj
          .run()
          .each(function (result) {
            var i_id_unique_ref = result.getValue({ name: "internalid" });
            var i_unique_num = result.getValue({
              name: "custrecord_hris_unique_number",
            });

            i_unique_num = parseInt(i_unique_num) + 1;

            var zeros = "";
            if (i_unique_num.toString().length == 1) {
              zeros = "00";
            }
            if (i_unique_num.toString().length == 2) {
              zeros = "0";
            }
            // if (i_unique_num.toString().length == 3) { zeros = '0'; }
            // if (i_unique_num.toString().length == 4) { zeros = '0'; }

            // log.debug('Internal No :', prefix1 + '-' + prefix2 + '-' + shortYear + '-' + zeros + docno);
            var refnumber = zeros + i_unique_num;
            log.debug("refnumber", refnumber);
            var d_current_date = new Date();
            var i_fullYear = d_current_date.getFullYear();

            // var s_name = "";
            var s_auto_number =
              // "MAT" + "-" + "REQ" + "-" + refnumber + "-" + i_fullYear;
              "PRO" + "-" + refnumber;

            currentRecord.setValue({
              fieldId: "name",
              value: s_auto_number,
            });
            record.submitFields({
              type: "customrecord_hris_unique_reference_numbe",
              id: i_id_unique_ref,
              values: {
                custrecord_hris_unique_number: i_unique_num,
              },
            });

            // currentRecord.setValue({
            //   fieldId: "name",
            //   value: s_unique_ref_num,
            // });

            return true;
          });
      }
    }
  }
        
        function getResult(pSQL) {
            var queryResults = query.runSuiteQL({
                query: pSQL
            });
            var records = queryResults.asMappedResults();
            return records;
        }
        
        return {
            beforeLoad: beforeLoad,
            afterSubmit: afterSubmit,
            beforeSubmit:beforeSubmit
        };
    });