/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/record', 'N/search', 'N/query', 'N/currentRecord','N/url'], (record, search, query, currentRecord,url) => {

    /**
     * Entry point: pageInit
     */
    /* function pageInit(scriptContext) {
        const rec = scriptContext.currentRecord;

        // Get field objects
        const prodField = rec.getField({ fieldId: 'custpage_item_prod_ord' });
        const bomField = rec.getField({ fieldId: 'custrecord_njt_bom_type_' });

        // Disable the custom UI field so users cannot manually change it
        if (prodField) {
            prodField.isDisabled = true;
        }

        const prodType = rec.getValue('custrecord_njt_production_type');
        const subsidiary = rec.getValue('custrecord_njt_subsidiar');

        // 1. Populate the item dropdown options based on production type and subsidiary on load
        if (prodField && subsidiary && prodType) {
            updateItemOptions(prodField, subsidiary, prodType, bomField);
        } else if ((prodType == 1 || prodType == 3) && bomField) {
            // Fallback rules for BOM field if prodField/subsidiary are missing
            bomField.isMandatory = true;
        }

        // 2. RESTORE SAVED VALUE: 
        // Read the actual saved value from the database field and push it to the custom UI field
        const savedItemValue = rec.getValue({ fieldId: 'custrecord_njt_itm' });
        const savedItemText = rec.getText({ fieldId: 'custrecord_njt_itm' });

        if (savedItemValue && prodField) {
            if (savedItemText) {
                prodField.insertSelectOption({
                    value: savedItemValue,
                    text: savedItemText
                });
            }
            rec.setValue({
                fieldId: 'custpage_item_prod_ord',
                value: savedItemValue,
                ignoreFieldChange: true
            });
        }
    } */
 /*  function pageInit(scriptContext) {
    const rec = scriptContext.currentRecord;
    
    try {
        log.debug('pageInit Started', 'Mode: ' + scriptContext.mode);

        // === 1. GET URL PARAMETER 'soid' ===
        const url = window.location.href;
        const soid = getUrlParameter('soid', url);
        log.debug('URL Parameter', 'soid: ' + soid);

        // === 2. SET Sales Order Reference ===
        if (soid) {
            rec.setValue({
                fieldId: 'custrecord_njt_sales_order_num',
                value: soid,
                ignoreFieldChange: true
            });
            log.debug('1. Sales Order Num Set', soid);
        }

        // === 3. LOAD SALES ORDER AND POPULATE FIELDS ===
        if (soid) {
            loadSalesOrderData(rec, soid);
        }
      

        // === 4. EXISTING LOGIC - Get field objects ===
        const prodField = rec.getField({ fieldId: 'custpage_item_prod_ord' });
        const bomField = rec.getField({ fieldId: 'custrecord_njt_bom_type_' });

        // Disable the custom UI field so users cannot manually change it
        if (prodField) {
            prodField.isDisabled = true;
            log.debug('5. Production Item Field Disabled');
        }

        const prodType = rec.getValue('custrecord_njt_production_type');
        const subsidiary = rec.getValue('custrecord_njt_subsidiar');
       if (subsidiary) {
            rec.selectNewLine({ sublistId: "recmachcustrecord_njt_pro_2" });
            rec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_njt_pro_2",
                fieldId: "custrecord_njt_po_subsidiary",
                value: subsidiary,
                ignoreFieldChange: true
            });
            rec.commitLine({ sublistId: "recmachcustrecord_njt_pro_2" });
            log.debug('8. Sublist Line Added', 'Subsidiary: ' + subsidiary);
        }

        // 6. Populate the item dropdown options based on production type and subsidiary
        if (prodField && subsidiary && prodType) {
            updateItemOptions(prodField, subsidiary, prodType, bomField);
            log.debug('6. Item Options Updated');
        } else if ((prodType == 1 || prodType == 3) && bomField) {
            // Fallback rules for BOM field if prodField/subsidiary are missing
            bomField.isMandatory = true;
            log.debug('6. BOM Field Made Mandatory');
        }

        // === 7. RESTORE SAVED VALUE ===
        const savedItemValue = rec.getValue({ fieldId: 'custrecord_njt_itm' });
        const savedItemText = rec.getText({ fieldId: 'custrecord_njt_itm' });

        if (savedItemValue && prodField) {
            if (savedItemText) {
                prodField.insertSelectOption({
                    value: savedItemValue,
                    text: savedItemText
                });
            }
            rec.setValue({
                fieldId: 'custpage_item_prod_ord',
                value: savedItemValue,
                ignoreFieldChange: true
            });
            log.debug('7. Saved Item Value Restored', savedItemValue);
        }

        log.debug('pageInit Completed Successfully');
        
    } catch (e) {
        log.error('pageInit Error', e.toString());
    }
} */
  function pageInit(scriptContext) {
    const rec = scriptContext.currentRecord;
    
    try {
        log.debug('pageInit Started', 'Mode: ' + scriptContext.mode);

        // === 1. GET URL PARAMETER 'soid' ===
        const url = window.location.href;
        const soid = getUrlParameter('soid', url);
        log.debug('URL Parameter', 'soid: ' + soid);

        let subsidiary = rec.getValue('custrecord_njt_subsidiar'); // 1. Get subsidiary from current record
        let location = rec.getValue('custrecord_njt_location_');   // 2. Get location from current record
        let division=rec.getValue('custrecord_njt_pro_ord_devision');

        // === 2. SET Sales Order Reference ===
        if (soid) {
            rec.setValue({
                fieldId: 'custrecord_njt_sales_order_num',
                value: soid,
                ignoreFieldChange: true
            });
            log.debug('2. Sales Order Num Set', soid);
        }

        // === 3. LOAD SALES ORDER AND POPULATE FIELDS ===
        if (soid) {
            loadSalesOrderData(rec, soid);
            // 3. Update subsidiary/location from Sales Order if loaded
            subsidiary = rec.getValue('custrecord_njt_subsidiar') || subsidiary;
            location = rec.getValue('custrecord_njt_location_') || location;
            division=rec.getValue('custbody_njt_so_projecttype') || location;
            log.debug('3. Updated from SO', 'Subsidiary: ' + subsidiary + ', Location: ' + location);
        }

        // === 4. ADD NEW SUBLIST LINE WITH SUBSIDIARY + LOCATION (IGNORES MANDATORY) ===
        if (subsidiary) {
            // 4.1 Select new line
            rec.selectNewLine({ sublistId: "recmachcustrecord_njt_pro_2" });
            
            // 4.2 Set subsidiary (ignore mandatory/field change)
            rec.setCurrentSublistValue({
                sublistId: "recmachcustrecord_njt_pro_2",
                fieldId: "custrecord_njt_po_subsidiary",
                value: subsidiary,
                ignoreFieldChange: true  // Ignores mandatory validation
            });
            log.debug('4.2 Subsidiary Set on Sublist', subsidiary);
            
            // 4.3 Set location (ignore mandatory/field change)
            if (location) {
                rec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_njt_pro_2",
                    fieldId: "custrecord_njt_loca",  // Location field on sublist
                    value: location,
                    ignoreFieldChange: true  // Ignores mandatory validation
                });
                log.debug('4.3 Location Set on Sublist', location);
            }
           if (division) {
                rec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_njt_pro_2",
                    fieldId: "custrecord_njt_production_division",  // Location field on sublist
                    value: division,
                    ignoreFieldChange: true  // Ignores mandatory validation
                });
                log.debug('4.3 division Set on Sublist', division);
            }
            
            // 4.4 Commit line (saves both values)
            //rec.commitLine({ sublistId: "recmachcustrecord_njt_pro_2" });
            log.debug('4.4 Sublist Line Committed Successfully');
        } else {
            log.debug('4. Skip Sublist', 'No subsidiary available');
        }

        // === 5. EXISTING LOGIC - Get field objects ===
        const prodField = rec.getField({ fieldId: 'custpage_item_prod_ord' });
        const bomField = rec.getField({ fieldId: 'custrecord_njt_bom_type_' });

        // 6. Disable the custom UI field so users cannot manually change it
        if (prodField) {
            prodField.isDisabled = true;
            log.debug('6. Production Item Field Disabled');
        }

        const prodType = rec.getValue('custrecord_njt_production_type');

        // 7. Populate the item dropdown options based on production type and subsidiary
        if (prodField && subsidiary && prodType) {
            updateItemOptions(prodField, subsidiary, prodType, bomField);
            log.debug('7. Item Options Updated');
        } else if ((prodType == 1 || prodType == 3) && bomField) {
            // Fallback rules for BOM field if prodField/subsidiary are missing
            bomField.isMandatory = true;
            log.debug('7. BOM Field Made Mandatory');
        }

        // === 8. RESTORE SAVED VALUE ===
        const savedItemValue = rec.getValue({ fieldId: 'custrecord_njt_itm' });
        const savedItemText = rec.getText({ fieldId: 'custrecord_njt_itm' });

        if (savedItemValue && prodField) {
            if (savedItemText) {
                prodField.insertSelectOption({
                    value: savedItemValue,
                    text: savedItemText
                });
            }
            rec.setValue({
                fieldId: 'custpage_item_prod_ord',
                value: savedItemValue,
                ignoreFieldChange: true
            });
            log.debug('8. Saved Item Value Restored', savedItemValue);
        }

        log.debug('pageInit Completed Successfully');
        
    } catch (e) {
        log.error('pageInit Error', e.toString());
    }
}

/**
 * Extract URL parameter by name
 */
function getUrlParameter(name, url) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    
    if (!results) return null;
    if (!results[2]) return '';
    
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Load Sales Order data and populate current record
 */
function loadSalesOrderData(rec, soid) {
    try {
        log.debug('Loading Sales Order Data', 'SO ID: ' + soid);

        // === A. LOAD SALES ORDER RECORD ===
        const salesOrderRec = nlapiLoadRecord('salesorder', soid);
        log.debug('A. Sales Order Loaded', salesOrderRec.getId());

        // === B. GET SALES ORDER FIELDS ===
        const soSubsidiary = salesOrderRec.getFieldValue('subsidiary');
        const soLocation = salesOrderRec.getFieldValue('location');
        const soProjectType = salesOrderRec.getFieldValue('custbody_njt_so_projecttype');
        const soProjectSeg = salesOrderRec.getFieldValue('cseg_njt_seg_proj');

        log.debug('B. Sales Order Data Extracted', {
            subsidiary: soSubsidiary,
            location: soLocation,
            projectType: soProjectType,
            projectSeg: soProjectSeg
        });

        // === C. SET CURRENT RECORD FIELDS ===
        
        // C1. Subsidiary (Already set above, but confirm)
        if (soSubsidiary) {
            rec.setValue({
                fieldId: 'custrecord_njt_subsidiar',
                value: soSubsidiary,
                ignoreFieldChange: true
            });
            log.debug('C1. Subsidiary Set from SO', soSubsidiary);
        }

        // C2. Sales Order Number (Already set above)
        log.debug('C2. Sales Order Num Already Set', soid);

        // C3. Location
        if (soLocation) {
            rec.setValue({
                fieldId: 'custrecord_njt_location_',
                value: soLocation,
                ignoreFieldChange: true
            });
            log.debug('C3. Location Set from SO', soLocation);
        }

        // C4. Project (cseg_njt_seg_proj)
        if (soProjectSeg) {
            rec.setValue({
                fieldId: 'custrecord_njt_project_2',
                value: soProjectSeg,
                ignoreFieldChange: true
            });
            log.debug('C4. Project Set from SO', soProjectSeg);
        }

        // C5. Division/Project Type (custbody_njt_so_projecttype)
        if (soProjectType) {
            rec.setValue({
                fieldId: 'custrecord_njt_pro_ord_devision',
                value: soProjectType,
                ignoreFieldChange: true
            });
            log.debug('C5. Division Set from SO', soProjectType);
        }

        log.debug('Sales Order Data Population Completed');
        
    } catch (e) {
        log.error('loadSalesOrderData Error', e.toString());
    }
}


    /**
     * Entry point: fieldChanged
     */
    function fieldChanged(context) {
        const rec = context.currentRecord;
        const fieldName = context.fieldId;
        const sublistName = context.sublistId;

        // 1. Handle Subsidiary Change -> Update Sublist Subsidiary
        if (fieldName === 'custrecord_njt_subsidiar') {
            const subsidiary = rec.getValue('custrecord_njt_subsidiar');
            
            if (subsidiary) {
                rec.selectNewLine({ sublistId: "recmachcustrecord_njt_pro_2" });
                rec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_njt_pro_2",
                    fieldId: "custrecord_njt_po_subsidiary",
                    value: subsidiary,
                    ignoreFieldChange: true
                });
            }
        }
      if (fieldName === 'custrecord_njt_pro_ord_devision') {
            const division = rec.getValue('custrecord_njt_pro_ord_devision');
            
            if (division) {
                rec.selectNewLine({ sublistId: "recmachcustrecord_njt_pro_2" });
                rec.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_njt_pro_2",
                    fieldId: "custrecord_njt_production_division",
                    value: division,
                    ignoreFieldChange: true
                });
            }
        }

        // 2. Handle Production Type or Subsidiary Change -> Refresh Item Dropdown
        if (fieldName === 'custrecord_njt_production_type' || fieldName === 'custrecord_njt_subsidiar') {
            const prodField = rec.getField({ fieldId: 'custpage_item_prod_ord' });
            const bomField = rec.getField({ fieldId: 'custrecord_njt_bom_type_' });
            const subsidiary = rec.getValue('custrecord_njt_subsidiar');
            const prodType = rec.getValue('custrecord_njt_production_type');

            if (prodField && bomField && subsidiary) {
                updateItemOptions(prodField, subsidiary, prodType, bomField);
            }
        }

        // 3. Sync Custom Dropdown to hidden standard field (Saves to Database)
        if (fieldName === 'custpage_item_prod_ord') {
            const prodItem = rec.getValue("custpage_item_prod_ord");
            if (prodItem) {
                rec.setValue({ fieldId: "custrecord_njt_itm", value: prodItem });
            } else {
                rec.setValue({ fieldId: "custrecord_njt_itm", value: "" });
            }
        }

        // 4. Handle standard item field change -> sync custom dropdown UI
        if (fieldName === 'custrecord_njt_itm') {
            const prodField = rec.getField({ fieldId: 'custpage_item_prod_ord' });
            const itemValue = rec.getValue({ fieldId: 'custrecord_njt_itm' });
            const itemText = rec.getText({ fieldId: 'custrecord_njt_itm' });

            if (prodField) {
                prodField.removeSelectOption({ value: null });

                if (itemValue) {
                    prodField.insertSelectOption({
                        value: itemValue,
                        text: itemText
                    });
                    rec.setValue({
                        fieldId: 'custpage_item_prod_ord',
                        value: itemValue,
                        ignoreFieldChange: true
                    });
                } else {
                    rec.setValue({
                        fieldId: 'custpage_item_prod_ord',
                        value: '',
                        ignoreFieldChange: true
                    });
                }
            }
        }

        // 5. Handle BOM Type or Planned Qty Change -> Load BOM Components into Sublist
        if (fieldName === 'custrecord_njt_bom_type_' || fieldName === 'custrecord_njt_plan_qnty') {
            handleBomCalculation(rec);
        }

        // 6. Handle Sublist Quantity Calculations
        /* if (sublistName === 'recmachcustrecord_njt_pro_2' && (fieldName === 'custrecord_njt_issue_qnty' || fieldName === 'custrecord_njt_planned_qnty')) {
            const issueQty = rec.getCurrentSublistValue({ sublistId: 'recmachcustrecord_njt_pro_2', fieldId: 'custrecord_njt_issue_qnty' }) || 0;
            const plannedQty = rec.getCurrentSublistValue({ sublistId: 'recmachcustrecord_njt_pro_2', fieldId: 'custrecord_njt_planned_qnty' }) || 0;
            const balance = plannedQty - issueQty;
            rec.setCurrentSublistValue({
                sublistId: 'recmachcustrecord_njt_pro_2',
                fieldId: 'custrecord_njt_balan_qnty',
                value: balance.toFixed(1)
            });
        } */

        // 7. Sync Main Account to Sublist Account
        if (fieldName === 'custrecord_njt_acnt') {
            const account = rec.getValue('custrecord_njt_acnt');
            if (account && rec.getLineCount({ sublistId: "recmachcustrecord_njt_pro_2" }) > 0) {
                rec.selectLine({ sublistId: "recmachcustrecord_njt_pro_2", line: 0 });
                rec.setCurrentSublistValue({ sublistId: "recmachcustrecord_njt_pro_2", fieldId: "custrecord_njt_account_", value: account });
                rec.commitLine({ sublistId: "recmachcustrecord_njt_pro_2" });
            }
        }
    }

    /**
     * Entry point: lineInit
     */
    function lineInit(context) {
        const rec = context.currentRecord;

        if (context.sublistId === 'recmachcustrecord_njt_pro_2') {
            const account = rec.getValue('custrecord_njt_acnt');
            if (account) {
                rec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecord_njt_account_',
                    value: account,
                    ignoreFieldChange: true
                });
            }

            const subsidiary = rec.getValue('custrecord_njt_subsidiar');
            if (subsidiary) {
                rec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecord_njt_po_subsidiary',
                    value: subsidiary,
                    ignoreFieldChange: true
                });
            }

         // if (context.sublistId === 'recmachcustrecord_njt_pro_2') {
            const location = rec.getValue('	custrecord_njt_loca');
            if (location) {
                rec.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_njt_pro_2',
                    fieldId: 'custrecord_njt_loca',
                    value: location,
                    ignoreFieldChange: true
                });
            }
        //}
    }
    }

    /**
     * Button: Create Material Request (rectype=1) - FULL SCREEN
     */
    function createMaterialRequest() {
        const id = currentRecord.get().id;
        const url = `/app/common/custom/custrecordentry.nl?rectype=1&customRecordId=${id}`;
        window.open(url, '_blank');
    }
    const openCustomRecord = () => {
        const currRec = currentRecord.get();
        const recordId = currRec.id;
        const recordType = currRec.type;

        // Use search.lookupFields to reliably get values directly from the database in View Mode
        const fieldValues = search.lookupFields({
            type: recordType,
            id: recordId,
            columns: ['custrecord_njt_project_2', 'custrecord_njt_acnt', 'custrecord_njt_pro_ord_devision', 'custrecord_njt_subsidiar']
        });

        // Helper function to safely extract the internal ID (NetSuite returns arrays for select fields in lookupFields)
        const extractValue = (data) => (Array.isArray(data) && data.length > 0) ? data[0].value : (data || '');

        const projectCode = extractValue(fieldValues.custrecord_njt_project_2);
        const account = extractValue(fieldValues.custrecord_njt_acnt);
        const division = extractValue(fieldValues.custrecord_njt_pro_ord_devision);
        const subsidiary = extractValue(fieldValues.custrecord_njt_subsidiar);

        log.debug({ title: 'Extracted Data', details: JSON.stringify({ account, division, subsidiary }) });

        // Resolve the URL for the target custom record in Create Mode
        // IMPORTANT: Replace 'customrecord_target_record_id' with your actual target custom record ID
        let recordUrl = url.resolveRecord({
            recordType: 'customrecord_njt_overhead',
            isEditMode: true
        });

        // Append parameters to the URL to be caught by the pageInit function
        recordUrl += `&custparam_source_id=${recordId}&custparam_proj_code=${projectCode || ''}&custparam_proj_subsidiary=${subsidiary || ''}&custparam_proj_account=${account || ''}&custparam_proj_division=${division || ''}`;

        // Open the custom record 
        window.open(recordUrl, '_self'); // Change '_self' to '_blank' if you prefer a new tab
    };
  /* function createSFGProcess() {
        const id = currentRecord.get().id;
        const url = `/app/common/custom/custrecordentry.nl?rectype=609&customRecordId=${id}`;
        window.open(url, '_blank');
    } */

    /**
     * Button: Create Purchase Request - FULL SCREEN
     */
    function createPurchaseReq() {
        const id = currentRecord.get().id;
        const url = `/app/common/custom/custrecordentry.nl?rectype=396&customRecordId=${id}`;
        window.open(url, '_blank');
    } 
  /**
 * Button: Create Purchase Request (rectype = 396)
 * Auto create record and copy body + sublist
 */
//create purchase issues
  function prissue() {
        const id = currentRecord.get().id;
        const url = `/app/common/custom/custrecordentry.nl?rectype=632&customRecordId=${id}`;
        window.open(url, '_blank');
    }
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

  
    /**
     * Button: Create Production Receipt - FULL SCREEN
     */
    function createPR() {
        const id = currentRecord.get().id;
        const url = `/app/common/custom/custrecordentry.nl?rectype=615&customRecordId=${id}`;
        window.open(url, '_blank');
    }

    /**
     * Button: Close Production Order
     */
    function Close() {
        const recObj = currentRecord.get();
        const id = recObj.id;

        const amtSql = `SELECT SUM(NVL(t2.foreigntotal, 0)) AS total FROM customrecord_njt_prod_issue t1 
                        JOIN transaction t2 ON t2.id = t1.custrecord_njt_invent_adjust 
                        WHERE t1.custrecord_njt_prod_num = ?`;
        const amtRes = getResult(amtSql, [id]);
        const totalAmt = amtRes.length ? amtRes[0].total : 0;

        const qtySql = `SELECT SUM(ABS(tl.quantity)) as totalqty FROM customrecord_njt_prod_recei pr
                        JOIN transactionline tl ON tl.transaction = pr.custrecord_njt_inve_adj
                        WHERE pr.custrecord_njt_order_numb = ? AND tl.mainline = 'F'`;
        const qtyRes = getResult(qtySql, [id]);
        const totalQty = qtyRes.length ? qtyRes[0].totalqty : 0;

        const unitCost = (totalQty > 0) ? (totalAmt / totalQty) : 0;

        record.submitFields({
            type: 'customrecord_njt_product_order',
            id: id,
            values: { 'custrecord_njt_prod_status': 3 }
        });

        window.location.reload();
    }

    /**
     * Helper: Updates the dynamic item dropdown based on Production Type
     */
    function updateItemOptions(prodField, subsidiary, prodType, bomField) {
        prodField.removeSelectOption({ value: null });
        prodField.insertSelectOption({ value: '', text: ' ' });

        let sql = "";
        let params = [subsidiary];

        if (prodType == 1 || prodType == 3) {
            if (bomField) { bomField.isMandatory = true }
            sql = `SELECT A.custrecord_njt_product_name AS id, BUILTIN.DF(A.custrecord_njt_product_name) AS name, i.displayname AS code
                   FROM customrecord_njt_bom A LEFT JOIN item i ON i.id = A.custrecord_njt_product_name
                   WHERE A.custrecord_njt_subsidiary = ?`;
        } else if (prodType == 2 || prodType == 4) {
            if (bomField) { bomField.isMandatory = false }
            sql = `SELECT i.id, i.itemid AS name, i.displayname AS code
                   FROM item i JOIN itemsubsidiarymap ism ON ism.item = i.id
                   WHERE ism.subsidiary = ? AND NOT EXISTS (SELECT 1 FROM customrecord_njt_bom b WHERE b.custrecord_njt_product_name = i.id)`;
        }

        if (sql) {
            const results = getResult(sql, params);
            results.forEach(res => {
                prodField.insertSelectOption({
                    value: res.id,
                    text: `${res.name || ''} - ${res.code || ''}`
                });
            });
        }
    }

    /**
     * Helper: Handles BOM components and sublist population
     */
    function handleBomCalculation(rec) {
        const item = rec.getValue('custrecord_njt_itm');
        const bomType = rec.getValue('custrecord_njt_bom_type_');
        const plannedQty = rec.getValue('custrecord_njt_plan_qnty');

        if (!item || !bomType || !plannedQty) return;

        const checkLocSql = `SELECT t1.id FROM customrecord_njt_bom t1 
                             LEFT JOIN customrecord_njt_bom_details t2 ON t2.custrecord_njt_ = t1.id 
                             WHERE (t2.custrecord_njt_loc IS NULL) AND t1.custrecord_njt_product_name = ? AND t1.custrecord_njt_bom_type = ?`;
        const missingLocs = getResult(checkLocSql, [item, bomType]);
        if (missingLocs.length > 0) {
            alert('Component location is missing in this BOM Record lines.');
            return;
        }

        const headerSql = `SELECT id, custrecord_njt_subsidiary, custrecord_njt_location_3, custrecord_njt_accnt FROM customrecord_njt_bom 
                           WHERE custrecord_njt_product_name = ? AND custrecord_njt_bom_type = ?`;
        const headerData = getResult(headerSql, [item, bomType]);

        if (headerData.length > 0) {
            rec.setValue('custrecord_njt_subsidiar', headerData[0].custrecord_njt_subsidiary || '');
            rec.setValue('custrecord_njt_location_', headerData[0].custrecord_njt_location_3 || '');
            rec.setValue('custrecord_njt_acnt', headerData[0].custrecord_njt_accnt || '');
        }

        const count = rec.getLineCount({ sublistId: 'recmachcustrecord_njt_pro_2' });
        for (let i = count - 1; i >= 0; i--) {
            rec.removeLine({ sublistId: 'recmachcustrecord_njt_pro_2', line: i });
        }

        const linesSql = `SELECT t1.custrecord_njt_quantity as headerqty, t2.custrecord_njt_type_2 as type, t2.custrecord_njt_item_2 as itemid, 
                          t2.custrecord_njt_item_name as itemname, t2.custrecord_njt_quan as qty, t2.custrecord_njt_loc as location, t2.custrecord_njt_accnt_ as account 
                          FROM customrecord_njt_bom t1 LEFT JOIN customrecord_njt_bom_details t2 ON t2.custrecord_njt_ = t1.id 
                          WHERE t1.custrecord_njt_product_name = ? AND t1.custrecord_njt_bom_type = ?`;
        const lines = getResult(linesSql, [item, bomType]);

        lines.forEach(line => {
            rec.selectNewLine({ sublistId: 'recmachcustrecord_njt_pro_2' });
            rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_njt_pro_2', fieldId: 'custrecord_njt_itm_type', value: line.type });
            rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_njt_pro_2', fieldId: 'custrecord_njt_itm_code', value: line.itemid });
            rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_njt_pro_2', fieldId: 'custrecord_njt_item_name_', value: line.itemname });
            
            const baseQty = (line.qty / line.headerqty) || 0;
            rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_njt_pro_2', fieldId: 'custrecord_njt_base_qnty', value: baseQty.toFixed(1) });
            rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_njt_pro_2', fieldId: 'custrecord_njt_planned_qnty', value: (baseQty * plannedQty).toFixed(1) });
            rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_njt_pro_2', fieldId: 'custrecord_njt_loca', value: line.location });
            rec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_njt_pro_2', fieldId: 'custrecord_njt_account_', value: line.account });
            rec.commitLine({ sublistId: 'recmachcustrecord_njt_pro_2' });
        });
    }

    /**
     * Utility: Run SuiteQL and return results as mapped array
     */
    function getResult(sql, params = []) {
        try {
            return query.runSuiteQL({ query: sql, params: params }).asMappedResults();
        } catch (e) {
            console.error("SQL Error", e);
            return [];
        }
    }
  function createCogs() {
        var rec = currentRecord.get();
        var prodOrderId = rec.id;

        // Resolve the URL of the first Suitelet (Form)
        // Note: Update scriptId and deploymentId to match your deployment
        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_njt_cogs_journal_filter_sl',
            deploymentId: 'customdeploy_njt_cogs_journal_filter_sl',
            params: {
                prodid: prodOrderId
            }
        });

        // Open the Suitelet form in a popup or new window
        window.open(suiteletUrl, '_self');
    }

    return {
        pageInit,
        fieldChanged,
        lineInit,
        createMaterialRequest,
        openCustomRecord,
        createPurchaseReq,
        createPR,
        Close,
      intercomReq,
      createCogs,
      prissue
    };
});
