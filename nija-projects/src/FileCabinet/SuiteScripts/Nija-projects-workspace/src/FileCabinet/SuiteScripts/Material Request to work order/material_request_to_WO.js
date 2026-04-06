/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
  * @NModuleScope Public
 */

define([
    "N/search",
    "N/query",
    "N/format",
    "N/email",
    "N/record",
    "N/currentRecord",
    "N/url",
    // "./moment.js",
    "N/runtime",
    "N/ui/dialog",
], function (
    search,
    query,
    format,
    email,
    record,
    currentRecord,
    url,
    // moment,
    runtime,
    dialog
) {
function pageInit(context) {

        console.log('Mode : ', context.mode);

        // Run only in CREATE mode
        if (context.mode !== 'create') {
            return;
        }

        var rec = context.currentRecord;

        // Get URL
        var url = window.location.href;

        // Get Production Order ID
        var prodOrderId = getUrlParameter('customRecordId', url);

        console.log('Production Order ID : ', prodOrderId);

        /* if (!prodOrderId) {
            alert('Production Order ID Missing');
            return;
        } */

        loadProductionOrder(rec, prodOrderId);
    }


    /* ============================
       GET URL PARAMETER
    ============================ */
    function getUrlParameter(name, url) {

        name = name.replace(/[[]]/g, '\\$&');

        var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');

        var results = regex.exec(url);

        if (!results) return null;

        if (!results[2]) return '';

        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }


    /* ============================
       LOAD HEADER + SUBLIST
    ============================ */
    function loadProductionOrder(rec, prodOrderId) {

        try {

            console.log('Loading Production Order...');

            var prodRec = record.load({
                type: 'customrecord_njt_product_order',
                id: prodOrderId,
                isDynamic: true
            });


            /* ============================
               HEADER VALUES
            ============================ */

            var subsidiary = prodRec.getValue('custrecord_njt_subsidiar');

            var location = prodRec.getValue('custrecord_njt_location_');

            var project = prodRec.getValue('custrecord_njt_project_2');

            var division = prodRec.getValue('custrecord_njt_pro_ord_devision');
           var soNo=prodRec.getValue('custrecord_njt_sales_order_num');


            if (subsidiary) {
                rec.setValue({
                    fieldId: 'custrecord_njt_mat_req_subsidery',
                    value: subsidiary,
                    ignoreFieldChange: true,
                    forceSyncSourcing: true
                });
            }
          if (soNo) {
                rec.setValue({
                    fieldId: 'custrecord_njt_so_no',
                    value: soNo,
                    ignoreFieldChange: true,
                    forceSyncSourcing: true
                });
            }

            if (location) {
                rec.setValue({
                    fieldId: 'custrecord_njt_mat_req_loc',
                    value: location,
                    ignoreFieldChange: true
                });
            }

            if (project) {
                rec.setValue({
                    fieldId: 'custrecord_njt_sales_project',
                    value: project,
                    ignoreFieldChange: true
                });
            }

            if (division) {
                rec.setValue({
                    fieldId: 'custrecord_njt_sjs_devision_mat',
                    value: division,
                    ignoreFieldChange: true
                });
            }

            // Link Production Order
            rec.setValue({
                fieldId: 'custrecord_njt_mr_prodorder',
                value: prodOrderId,
                ignoreFieldChange: true
            });


            // Load Sublist
            // loadSublist(rec, prodRec, project);

        } catch (e) {

            console.error('Header Error : ', e);

            alert(e.message);
        }
    }


    /* ============================
       LOAD SUBLIST (ONLY STATUS != 2)
    ============================ */
    function loadSublist(rec, prodRec, headerProject) {

        try {

            console.log('Loading Sublist...');


            /* ============================
               CLEAR OLD LINES
            ============================ */

            var count = rec.getLineCount({
                sublistId: 'recmachcustrecord_njt_mat_request'
            });

            for (var i = count - 1; i >= 0; i--) {

                rec.removeLine({
                    sublistId: 'recmachcustrecord_njt_mat_request',
                    line: i
                });
            }


            /* ============================
               PRODUCTION ORDER LINES
            ============================ */

            var poLineCount = prodRec.getLineCount({
                sublistId: 'recmachcustrecord_njt_pro_2'
            });

            console.log('PO Lines : ', poLineCount);


            var added = 0;


            /* ============================
               LOOP WITH FILTER
            ============================ */

            for (var line = 0; line < poLineCount; line++) {


                // Get Transfer Order Status
                var status = prodRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecord_njt_transfer_ord_sts',
                    line: line
                });


                // STRICT FILTER
                if (Number(status) === 2) {

                    console.log('Skipped Line (Status = 2) : ', line);

                    continue;
                }


                // Get Item Type
                var itemType = prodRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecord_njt_itm_type',
                    line: line
                });


                // Only Type = 1
                if (Number(itemType) !== 1 && Number(itemType) !== 6) {

                    continue;
                }


                /* ============================
                   GET LINE DATA
                ============================ */

                var subsidiary = prodRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecord_njt_po_subsidiary',
                    line: line
                });
               var idsub = prodRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'id',
                    line: line
                });

                var item = prodRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecord_njt_itm_code',
                    line: line
                });

                var name1 = prodRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecord_njt_item_name_',
                    line: line
                });

                var name2 = prodRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecordnjt_item_name_',
                    line: line
                });

                var qty = prodRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecord_njt_planned_qnty',
                    line: line
                });

                var division = prodRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecord_njt_production_division',
                    line: line
                });


                var itemName = name1 || name2 || '';



                /* ============================
                   ADD LINE
                ============================ */

                rec.selectNewLine({
                    sublistId: 'recmachcustrecord_njt_mat_request'
                });


                if (subsidiary) {

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord_njt_mat_req_det_subsidery',
                        value: subsidiary,
                        ignoreFieldChange: true
                    });
                }


                if (item) {

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord_njt_mat_req_details_item',
                        value: item,
                        ignoreFieldChange: true
                    });
                }


                if (itemName) {

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord_njt_mat_req_det_description',
                        value: itemName,
                        ignoreFieldChange: true
                      
                    });
                }
                if (itemType){
                  rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord1289',
                        value: itemType,
                        ignoreFieldChange: true
                    });
                }


                if (qty) {

                    qty = Number(qty);

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord_njt_mat_req_det_quantity',
                        value: qty
                    });

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord_njt_mat_req_det_quantityplned',
                        value: qty
                    });

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord_njt_matreq_det_consume_quants',
                        value: qty
                    });
                }


                if (division) {

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord_njt_sjs_devision_materidet',
                        value: division
                    });
                }
               if (idsub) {

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord_njt_maatreq_work_detail_id',
                        value: idsub
                    });
                }


                if (headerProject) {

                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord_njt_project_code_matdetails',
                        value: headerProject
                    });
                }


                rec.commitLine({
                    sublistId: 'recmachcustrecord_njt_mat_request'
                });


                added++;
            }


            console.log('Total Lines Added : ', added);


        } catch (e) {

            console.error('Sublist Error : ', e);

            alert(e.message);
        }
    }

/* function pageInit(context) {
    console.log('pageInit - Mode:', context.mode);
    
    if (context.mode !== 'create') {
        console.log('Skipping - not create mode');
        return;
    }
    
    var rec = context.currentRecord;
    var currentUrl = window.location.href;
    var prodOrderId = getUrlParameter('customRecordId', currentUrl);
    
    console.log('Production Order ID:', prodOrderId);
    
    if (!prodOrderId) {
        alert('Production Order ID missing');
        return;
    }
    
    loadAndPopulateProductionOrder(rec, prodOrderId);
}

function getUrlParameter(name, urlString) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    var results = regex.exec(urlString);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function loadAndPopulateProductionOrder(rec, prodOrderId) {
    try {
        console.log('Loading PO:', prodOrderId);
        
        var prodOrderRec = record.load({
            type: 'customrecord_njt_product_order',
            id: prodOrderId,
            isDynamic: true
        });

        var subsidiary = prodOrderRec.getValue('custrecord_njt_subsidiar');
        var location = prodOrderRec.getValue('custrecord_njt_location_');
        var project = prodOrderRec.getValue('custrecord_njt_project_2');
        var division = prodOrderRec.getValue('custrecord_njt_pro_ord_devision');

        console.log('PO Header:', {
            subsidiary: subsidiary,
            location: location,
            project: project,
            division: division
        });

        // Header fields with sourcing
        if (subsidiary) {
            rec.setValue({
                fieldId: 'custrecord_njt_mat_req_subsidery',
                value: subsidiary,
                ignoreFieldChange: true,
                forceSyncSourcing: true
            });
            console.log('Set subsidiary with sourcing:', subsidiary);
        }
        if (location) {
            rec.setValue({
                fieldId: 'custrecord_njt_mat_req_loc',
                value: location,
                ignoreFieldChange: true
            });
        }
        if (project) {
            rec.setValue({
                fieldId: 'custrecord_njt_sales_project',
                value: project,
                ignoreFieldChange: true
            });
        }
        if (division) {
            rec.setValue({
                fieldId: 'custrecord_njt_sjs_devision_mat',
                value: division,
                ignoreFieldChange: true
            });
        }
        rec.setValue({
            fieldId: 'custrecord_njt_mr_prodorder',
            value: prodOrderId,
            ignoreFieldChange: true
        });

        console.log('Header fields set with sourcing');

        loadProductionOrderSublist(rec, prodOrderRec);

    } catch (e) {
        console.error('Header Error:', e.toString());
        alert('Header Error: ' + e.toString());
    }
}

function loadProductionOrderSublist(rec, prodOrderRec) {
    try {
        console.log('=== SUBLIST PROCESSING WITH SOURCING ===');
        
        var matLineCount = rec.getLineCount({
            sublistId: 'recmachcustrecord_njt_mat_request'
        });
        console.log('Clearing MR sublist lines:', matLineCount);
        
        for (var i = matLineCount - 1; i >= 0; i--) {
            rec.removeLine({
                sublistId: 'recmachcustrecord_njt_mat_request',
                line: i
            });
        }

        var poLineCount = prodOrderRec.getLineCount({
            sublistId: 'recmachcustrecord_njt_pro_2'
        });
        console.log('PO sublist lines found:', poLineCount);

        // Fetch the project from the PO header to apply to all material lines
        var headerProject = prodOrderRec.getValue('custrecord_njt_project_2');

        var addedLines = 0;
        for (var line = 0; line < poLineCount; line++) {
            console.log('--- Processing PO Line:', line, '---');
            
            var itemType = prodOrderRec.getSublistValue({
                sublistId: 'recmachcustrecord_njt_pro_2',
                fieldId: 'custrecord_njt_itm_type',
                line: line
            });
            console.log('Line', line, 'Item Type:', itemType);

            if (itemType == 1 || itemType == true) {
                console.log('*** ADDING ITEM TYPE 1 LINE ***');

                var poSubsidiary = prodOrderRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecord_njt_po_subsidiary',
                    line: line
                });
                
                var itemCode = prodOrderRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecord_njt_itm_code',
                    line: line
                });
                
                var itemNameField1 = prodOrderRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecord_njt_item_name_',
                    line: line
                });
                
                var itemNameField2 = prodOrderRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecordnjt_item_name_',
                    line: line
                });
                
                var plannedQty = prodOrderRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecord_njt_planned_qnty',
                    line: line
                });
                
                var prodDivision = prodOrderRec.getSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecord_njt_production_division',
                    line: line
                });

                console.log('RAW LINE DATA:', {
                    poSubsidiary: poSubsidiary,
                    itemCode: itemCode,
                    itemName1: itemNameField1,
                    itemName2: itemNameField2,
                    plannedQty: plannedQty,
                    prodDivision: prodDivision,
                    project: headerProject
                });

                // ADD NEW LINE
                rec.selectNewLine({
                    sublistId: 'recmachcustrecord_njt_mat_request'
                });
                
                // 1. SET SUBSIDIARY FIRST (triggers item filtering)
                if (poSubsidiary) {
                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord_njt_mat_req_det_subsidery',
                        value: poSubsidiary,
                        ignoreFieldChange: true,
                        forceSyncSourcing: true
                    });
                    console.log('✅ Set SUBSIDIARY with sourcing:', poSubsidiary);
                }
                
                // 2. SET ITEM (triggers all field sourcing)
                if (itemCode) {
                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord_njt_mat_req_details_item',
                        value: itemCode,
                        ignoreFieldChange: false,
                        forceSyncSourcing: true
                    });
                    console.log('✅ SET ITEM CODE with sourcing:', itemCode);
                }
                
                // 3. SET DESCRIPTION
                var itemName = itemNameField1 || itemNameField2 || '';
                if (itemName) {
                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord_njt_mat_req_det_description',
                        value: itemName,
                        ignoreFieldChange: true
                    });
                    console.log('✅ Set item name:', itemName);
                }
                
                // 4. SET QUANTITY
                if (plannedQty) {
                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord_njt_mat_req_det_quantity',
                        value: plannedQty || 0,
                        ignoreFieldChange: true
                    });
                    
                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord_njt_mat_req_det_quantityplned',
                        value: plannedQty || 0,
                        ignoreFieldChange: true
                    });
                  rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord_njt_matreq_det_consume_quants',
                        value: plannedQty || 0,
                        ignoreFieldChange: true
                    });
                  
                    console.log('✅ Set planned qty to quantity field:', plannedQty);
                }
                
                // 5. SET DIVISION
                if (prodDivision) {
                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord_njt_sjs_devision_materidet',
                        value: prodDivision,
                        ignoreFieldChange: true
                    });
                    console.log('✅ Set division:', prodDivision);
                }

                // 6. SET PROJECT CODE (UPDATED THIS SECTION)
                if (headerProject) {
                    rec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_njt_mat_request',
                        fieldId: 'custrecord_njt_project_code_matdetails',
                        value: headerProject,
                        ignoreFieldChange: true
                    });
                    console.log('✅ Set project code:', headerProject);
                }
                
                // COMMIT LINE (triggers ALL sourcing)
                rec.commitLine({
                    sublistId: 'recmachcustrecord_njt_mat_request'
                });
                console.log('✅ COMMITTED LINE', addedLines + 1, '***');
                addedLines++;
            } else {
                console.log('⏭️ Skipping line', line, '- Item Type:', itemType);
            }
        }

        console.log('🎉 TOTAL LINES ADDED:', addedLines, 'WITH FULL SOURCING');

    } catch (e) {
        console.error('SUBLIST ERROR:', e.toString());
        alert('Sublist Error: ' + e.toString());
    }
} */
    function fieldChanged(context) {
        debugger;
        var currentRecord = context.currentRecord;
        // Map subsidairy body field in line item also
        if (context.fieldId === "custrecord_njt_mat_req_subsidery") {
            debugger;
            var SUBBBSSS = currentRecord.getValue({
                fieldId: "custrecord_njt_mat_req_subsidery",
            });


            currentRecord.selectNewLine({
                sublistId: "recmachcustrecord_njt_mat_request",
            });

            currentRecord.setCurrentSublistValue({
                sublistId: "recmachcustrecord_njt_mat_request",
                fieldId: "custrecord_njt_mat_req_det_subsidery",
                value: SUBBBSSS,
                ignoreFieldChange: true,
                forceSyncSourcing: true,
            });
        }
     if (context.sublistId === 'recmachcustrecord_njt_mat_request' ||
    context.fieldId === 'custrecord_njt_mat_req_details_item') {

    var currentItem = currentRecord.getCurrentSublistValue({
        sublistId: 'recmachcustrecord_njt_mat_request',
        fieldId: 'custrecord_njt_mat_req_details_item'
    });

    if (!currentItem) {
        return;
    }

    var currentLine = currentRecord.getCurrentSublistIndex({
        sublistId: 'recmachcustrecord_njt_mat_request'
    });

    var lineCount = currentRecord.getLineCount({
        sublistId: 'recmachcustrecord_njt_mat_request'
    });

    for (var i = 0; i < lineCount; i++) {

        if (i === currentLine) {
            continue;
        }

        var existingItem = currentRecord.getSublistValue({
            sublistId: 'recmachcustrecord_njt_mat_request',
            fieldId: 'custrecord_njt_mat_req_details_item',
            line: i
        });

        if (existingItem == currentItem) {

            dialog.alert({
                title: 'Duplicate Item',
                message: 'This item is already added in another line.'
            });

            currentRecord.cancelLine({
                sublistId: 'recmachcustrecord_njt_mat_request'
            });

            break;
        }
    }
}
if (context.sublistId === 'recmachcustrecord_njt_mat_request' ||
    context.fieldId === 'custrecord_njt_mat_req_details_item') {
       var location=currentRecord.getValue({
        fieldId:"custrecord_njt_mat_req_loc"
       });
      /*  if(location == "" || location == null){
         alert("Please choose location");
       } */
       var currentItem = currentRecord.getCurrentSublistValue({
        sublistId: 'recmachcustrecord_njt_mat_request',
        fieldId: 'custrecord_njt_mat_req_details_item'
    });
    var isavailable=checkIsSerialized(currentItem, location);
    /* if(!isavailable){
        dialog.alert({
                title: 'Stock Not available',
                message: 'This item is not having stock for this location.'
            });
            currentRecord.setCurrentSublistValue({
        sublistId: 'recmachcustrecord_njt_mat_request',
        fieldId: 'custrecord_njt_mat_req_details_item',
        value:''
    });

            currentRecord.cancelLine({
                sublistId: 'recmachcustrecord_njt_mat_request'
            });
    } */



    }



        // Map Required quantity value to both po open quants and consumed open quants
        if (
            context.sublistId === 'recmachcustrecord_njt_mat_request' &&
            (context.fieldId === 'custrecord_njt_mat_req_det_quantity')
        ) {



            var lineCount = currentRecord.getLineCount({
                sublistId: "recmachcustrecord_njt_mat_request"
            });

            log.debug("lineCount", lineCount);



            for (var i = 0; i <= lineCount; i++) {
                var Requestedquantity = currentRecord.getCurrentSublistValue({
                    sublistId: "recmachcustrecord_njt_mat_request",
                    fieldId: "custrecord_njt_mat_req_det_quantity",
                    line: i
                }) || 0;



                log.debug("Requestedquantity", Requestedquantity);




                // PO Open Quantity
                currentRecord.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_njt_mat_request",
                    fieldId: 'custrecord_njt_mat_req_open_quants',
                    value: Requestedquantity,
                    ignoreFieldChange: true,
                    forceSyncSourcing: true


                });
                // Consumed Open Quantity
                currentRecord.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_njt_mat_request",
                    fieldId: 'custrecord_njt_matreq_det_consume_quants',
                    value: Requestedquantity,
                    ignoreFieldChange: true,
                    forceSyncSourcing: true


                });


            }



        }

    }
    function purchaseorder() {
        debugger;
        try {
            var rec = currentRecord.get();

            // Get required values from Material Request
            var matReqId = rec.id;
            var matreqrecord = record.load({
                type: "customrecord_njt_material_req_h",
                id: matReqId
            });

            var subsidiary = matreqrecord.getValue({ fieldId: "custrecord_njt_mat_req_subsidery" });
            var department = matreqrecord.getValue({ fieldId: "custrecord_njt_mat_req_department" });
            var location = matreqrecord.getValue({ fieldId: "custrecord_njt_mat_req_loc" });
            var remarks = matreqrecord.getValue({ fieldId: "custrecord_njt_mat_req_remarks" });

            // Generate Suitelet URL and pass parameters
            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript_njt_mat_req_to_po_req_sut', // Replace with your Suitelet script ID
                deploymentId: 'customdeploy_njt_mat_req_to_po_req_sut', // Replace with your Suitelet deployment ID
                params: {
                    custpage_material_request: matReqId,
                    custpage_subsidiary: subsidiary,
                    custpage_department: department,
                    custpage_location: location,
                    remarks: remarks
                }
            });

            // Redirect to Suitelet
            window.open(suiteletUrl, '_blank'); // opens in new tab
            // OR use redirect.redirect({ url: suiteletUrl }); // if you want in same tab
        } catch (e) {
            log.error("Error in purchaseorder", e);
            alert("Error while calling Suitelet: " + e.message);
        }

    }
    function inventory() {
        debugger;
        try {
            var rec = currentRecord.get();

            // Get required values from Material Request
            var matReqId = rec.id;
            var matreqrecord = record.load({
                type: "customrecord_njt_material_req_h",
                id: matReqId
            });

            var subsidiary = matreqrecord.getValue({ fieldId: "custrecord_njt_mat_req_subsidery" });
            var department = matreqrecord.getValue({ fieldId: "custrecord_njt_mat_req_department" });
            var location = matreqrecord.getValue({ fieldId: "custrecord_njt_mat_req_loc" });
            var remarks = matreqrecord.getValue({ fieldId: "custrecord_njt_mat_req_remarks" });

            // Generate Suitelet URL and pass parameters
            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript_njt_mat_req_to_invent_sut', // Replace with your Suitelet script ID
                deploymentId: 'customdeploy_njt_mat_req_to_invent_sut', // Replace with your Suitelet deployment ID
                params: {
                    custpage_material_request: matReqId,
                    custpage_subsidiary: subsidiary,
                    custpage_department: department,
                    custpage_location: location,
                    remarks: remarks
                }
            });

            // Redirect to Suitelet
            window.open(suiteletUrl, '_blank'); // opens in new tab
            // OR use redirect.redirect({ url: suiteletUrl }); // if you want in same tab
        } catch (e) {
            log.error("Error in purchaseorder", e);
            alert("Error while calling Suitelet: " + e.message);
        }

    }
  //purchase request creation
  function request() {
        debugger;
        try {
            var rec = currentRecord.get();

            // Get required values from Material Request
            var matReqId = rec.id;
            var matreqrecord = record.load({
                type: "customrecord_njt_material_req_h",
                id: matReqId
            });

            var subsidiary = matreqrecord.getValue({ fieldId: "custrecord_njt_mat_req_subsidery" });
            var department = matreqrecord.getValue({ fieldId: "custrecord_njt_mat_req_department" });
            var location = matreqrecord.getValue({ fieldId: "custrecord_njt_mat_req_loc" });
            var remarks = matreqrecord.getValue({ fieldId: "custrecord_njt_mat_req_remarks" });

            // Generate Suitelet URL and pass parameters
            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript_njt_material_req_purchase_r', // Replace with your Suitelet script ID
                deploymentId: 'customdeploy_njt_material_req_purchase_r', // Replace with your Suitelet deployment ID
                params: {
                    custpage_material_request: matReqId,
                    custpage_subsidiary: subsidiary,
                    custpage_department: department,
                    custpage_location: location,
                    remarks: remarks
                }
            });

            // Redirect to Suitelet
            window.open(suiteletUrl, '_blank'); // opens in new tab
            // OR use redirect.redirect({ url: suiteletUrl }); // if you want in same tab
        } catch (e) {
            log.error("Error in purchaseorder", e);
            alert("Error while calling Suitelet: " + e.message);
        }

    }
  //create intercompany transfer order
  function intercomReq() {

    try {

        // ====================================
        // 1. GET CURRENT RECORD
        // ====================================

        var recObj = currentRecord.get();

        var prodOrderId = recObj.id;

        // Must be saved first
        if (!prodOrderId) {
            alert('Please save the record first.');
            return;
        }


        // ====================================
        // 2. BUILD TRANSFER ORDER URL
        // ====================================

        // Base NetSuite domain (auto-detected)
        var baseUrl = window.location.origin;

        // Build URL similar to your sample
        var url =
            baseUrl +
            "/app/accounting/transactions/trnfrord.nl" +
            "?icto=T" +                       // Intercompany Transfer
            "&whence=" +
            "&siaT=" + new Date().getTime() + // Timestamp
            "&siaWhc=%2Fapp%2Fcommon%2Fscripting%2Fscript.nl" +
            "&siaNv=ct2" +
            "&custparam_prodorder=" + prodOrderId; // Optional: pass your record ID


        // ====================================
        // 3. OPEN IN NEW TAB
        // ====================================

        window.open(url, '_blank');


    } catch (e) {

        console.error('Intercom Error', e);

        alert('Error: ' + e.message);
    }
}
    function lineInit(context) {
        debugger;
        var currentRecord = context.currentRecord;
        var Subsidary = currentRecord.getValue({
            fieldId: "custrecord_njt_mat_req_subsidery",
        });
        // Map subsidiary to next new line 
        if (Subsidary) {
            currentRecord.setCurrentSublistValue({
                sublistId: "recmachcustrecord_njt_mat_request",
                fieldId: "custrecord_njt_mat_req_det_subsidery",
                value: Subsidary,
                ignoreFieldChange: true,
                forceSyncSourcing: true,
            });

        }

        var Remarks = currentRecord.getValue({
            fieldId: "custrecord_njt_mat_req_remarks",
        });
        if (Remarks) {
            currentRecord.setCurrentSublistValue({
                sublistId: "recmachcustrecord_njt_mat_request",
                fieldId: "custrecord_njt_mat_req_det_remarks",
                value: Remarks,
                ignoreFieldChange: true,
                forceSyncSourcing: true,
            });
        }
        return true;
    }
    /**
     * Function to execute a SQL query and retrieve results
     * @param {string} sql - The SQL query to execute
     * @param {string} recordId - The ID of the record to filter the query
     * @returns {Array} - The result set of the query
     */
    function getResult(sql, recordId) {
        var queryResults = query.runSuiteQL({
            query: sql,
            params: [recordId],
        });

        return queryResults.asMappedResults();
    }
    function getUrlParameter(param) {
        // debugger;
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == param) {
                return decodeURIComponent(pair[1]);
            }
        }
        return false;
    }
    //CHECK IF ITEM IS SERIALIZED:
        function checkIsSerialized(itemId, locationId) {
            var sql =
                "SELECT F.inventorynumber AS lot_number, SUM(B.quantity) AS total_quantity " +
                "FROM transaction A " +
                "INNER JOIN transactionline B ON A.id = B.transaction " +
                "INNER JOIN item D ON D.id = B.item " +
                "INNER JOIN inventoryassignment E ON E.transactionline = B.id AND E.transaction = B.transaction " +
                "INNER JOIN inventorynumber F ON E.inventorynumber = F.id " +
                "WHERE B.location = ? AND D.id = ? " +
                "AND A.recordtype IN ('inventoryadjustment','itemreceipt','itemfulfillment','inventorytransfer','assemblybuild','assemblyunbuild','workorderissue','workordercompletion') " +
                "GROUP BY F.inventorynumber HAVING SUM(B.quantity) > 0 " +
                "ORDER BY F.inventorynumber";

            var results = query.runSuiteQL({ query: sql, params: [locationId, itemId] }).asMappedResults();
            return (results && results.length > 0);
        }

    function validateLine(context) {
        var currentRecord = context.currentRecord;
        
        if (context.sublistId === 'recmachcustrecord_njt_mat_request') {
            var itemType = currentRecord.getCurrentSublistValue({
                sublistId: 'recmachcustrecord_njt_mat_request',
                fieldId: 'custrecord1289'
            });

            if (itemType != 1 && itemType != 6) {
                dialog.alert({
                    title: 'Invalid Item Type',
                    message: 'Item Type Should be Raw material or Trading Are allowded for the material request'
                });
                return false;
            }
        }
        return true;
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        purchaseorder: purchaseorder,
        inventory: inventory,
        lineInit: lineInit,
        request: request,
        intercomReq: intercomReq,
        validateLine: validateLine
    };
});
