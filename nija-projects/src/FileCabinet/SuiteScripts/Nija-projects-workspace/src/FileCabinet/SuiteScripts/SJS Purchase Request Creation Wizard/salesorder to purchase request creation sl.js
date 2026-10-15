/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/ui/serverWidget', 'N/log', 'N/record', 'N/query', 'N/redirect'],
    function(ui, log, record, query, redirect) {

        /**
         * The entry point for the Suitelet.
         */
        function onRequest(context) {
            try {
                var request = context.request;

                // --- GET SECTION: BUILDING THE WIZARD INTERFACE ---
                if (request.method === 'GET') {
                    // 1. Create the main Form object
                    var form = ui.createForm({ title: 'Purchase Request Creation (Zero Stock Items)' });

                    // 2. Extract parameters passed via the URL (usually from a button click)
                    var params = request.parameters || {};
                    var subsidiaryParam = params.custpage_subsidiary || '';
                    var salesOrderParam = params.custpage_sales_request || '';

                    // 3. Add Header Field: Subsidiary (Disabled, just for reference)
                    var subField = form.addField({ id: 'custpage_subsidiary', type: ui.FieldType.SELECT, label: 'Subsidiary', source: 'subsidiary' });
                    subField.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                    if (subsidiaryParam) subField.defaultValue = subsidiaryParam;

                    // 4. Add Header Field: Sales Order Reference (Disabled)
                    var mrField = form.addField({ id: 'custpage_sales_request', type: ui.FieldType.SELECT, label: 'Sales Order#', source: 'salesorder' });
                    mrField.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
                    if (salesOrderParam) mrField.defaultValue = salesOrderParam;

                    // 5. Add Header Field: Date
                    form.addField({ id: 'custpage_date', type: ui.FieldType.DATE, label: 'Date' }).defaultValue = new Date();

                    // Total Entries Header Field
                    var totalField = form.addField({ id: 'custpage_total_entries', type: ui.FieldType.INTEGER, label: 'Total Entries' });
                    totalField.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });

                    // 6. HIDDEN FIELD: Used by the Client Script to pass the selected row data to the POST section
                    form.addField({ id: 'custpage_selected_data', type: ui.FieldType.LONGTEXT, label: 'JSON Data' })
                        .updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });

                    // Inline HTML Banner above sublist
                    var totalHtml = form.addField({ id: 'custpage_total_html', type: ui.FieldType.INLINEHTML, label: 'Total Entries HTML' });

                    // 7. Create the Sublist on the form
                    var sublist = createSublist(form, ui);

                    // 8. Populate the Sublist with only zero-stock items from the Sales Order
                    var totalEntries = 0;
                    if (salesOrderParam) {
                        totalEntries = setSublistValues(sublist, salesOrderParam) || 0;
                    }
                    totalField.defaultValue = totalEntries;
                    totalHtml.defaultValue = '<div style="font-size: 14px; font-weight: bold; margin: 10px 0 5px 0; color: #333;">Total Entries: <span style="color: #205493;">' + totalEntries + '</span></div>';

                    // 9. Add buttons and link the Client Script (ID 2668)
                    form.addSubmitButton({ label: 'Create Purchase Request' });
                    form.clientScriptFileId = 2668; 

                    context.response.writePage(form);

                } 
                // --- POST SECTION: CREATING THE RECORD ---
                else {
                    var req = context.request.parameters;
                    
                    // 10. Parse the JSON string of selected items sent by the Client Script
                    var selectedData = JSON.parse(req.custpage_selected_data || '[]');

                    if (selectedData.length > 0) {
                        // 11. Load the Sales Order to get header fields (Project, Class, etc.)
                        var soRec = record.load({ type: 'salesorder', id: req.custpage_sales_request });
                        var prodOrder = soRec.getValue('custbody_njt_production_ord_id') || "";
                        var projectCode = soRec.getValue('cseg_njt_seg_proj') || "";
                        var division = soRec.getValue('class') || "";

                        // 12. Create the Custom Purchase Request Header Record
                        var newPR = record.create({ type: 'customrecord_njt_pur_req_h', isDynamic: false });

                        // 13. Set Header Values
                        newPR.setValue({ fieldId: 'custrecord_njt_pur_req_subsidery', value: req.custpage_subsidiary });
                        newPR.setValue({ fieldId: 'custrecord_njt_pur_req_category', value: 6 }); 
                        newPR.setValue({ fieldId: 'custrecord_njt_production_ord_', value: prodOrder });
                        newPR.setValue({ fieldId: 'custrecord_njt_purchase_project_code', value: projectCode });
                        newPR.setValue({ fieldId: 'custrecord_njt_purchase_sjs_devison', value: division });
                        newPR.setValue({ fieldId: 'custrecord_njt_purchase_request_salod', value: req.custpage_sales_request });

                        // 14. Loop through the JSON data and create Sublist Lines
                        var subId = 'recmachcustrecord_njt_pur_req_det_pl';
                        for (var i = 0; i < selectedData.length; i++) {
                            var line = selectedData[i];
                            newPR.setSublistValue({ sublistId: subId, fieldId: 'custrecord_njt_pur_req_det_subsidery', line: i, value: req.custpage_subsidiary });
                            newPR.setSublistValue({ sublistId: subId, fieldId: 'custrecord_njt_pur_req_det_item', line: i, value: line.custpage_item });
                            newPR.setSublistValue({
    sublistId: subId,
    fieldId: 'custrecord_njt_pur_req_det_itemcat',
    line: i,
    value: parseInt(line.custpage_itemcat)
});
                            newPR.setSublistValue({ sublistId: subId, fieldId: 'custrecord_njt_pur_req_det_category', line: i, value: 6 });
                            newPR.setSublistValue({ sublistId: subId, fieldId: 'custrecord_njt_pur_req_det_quantity', line: i, value: line.custpage_quantity });
                            newPR.setSublistValue({ sublistId: subId, fieldId: 'custrecord_njt_pur_req_open_quantity', line: i, value: line.custpage_quantity });
                            newPR.setSublistValue({ sublistId: subId, fieldId: 'custrecord_njt_purchase_pro_code', line: i, value: projectCode });
                            newPR.setSublistValue({ sublistId: subId, fieldId: 'custrecord_njt_purchase_s_devision', line: i, value: division });
                        }

                        // 15. Save the record and Redirect to it in Edit Mode
                       var newId = newPR.save({ enableSourcing: true, ignoreMandatoryFields: true });
                        redirect.toRecord({
                            type: 'customrecord_njt_pur_req_h',
                            id: newId,
                            isEditMode: true 
                        });
                    }
                }
            } catch (e) {
                log.error('Suitelet Error', e.message);
                context.response.write('Error: ' + e.message);
            }
        }

        /**
         * Helper: Defines the columns for the UI Sublist
         */
        function createSublist(form, ui) {
            var sublist = form.addSublist({ id: 'custpage_items', label: 'Items with Zero Stock', type: ui.SublistType.LIST });
            sublist.addField({ id: 'custpage_select', type: ui.FieldType.CHECKBOX, label: 'Select' });
            sublist.addField({ id: 'custpage_item', type: ui.FieldType.SELECT, label: 'Item', source: 'item' }).updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
            sublist.addField({ id: 'custpage_itemname', type: ui.FieldType.TEXT, label: 'Item Name' }).updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
            sublist.addField({ id: 'custpage_seral_quants', type: ui.FieldType.TEXT, label: 'Current Stock' }).updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
            sublist.addField({ id: 'custpage_opequantity', type: ui.FieldType.TEXT, label: 'Needed Qty' }).updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
            sublist.addField({ id: 'custpage_quantity', type: ui.FieldType.TEXT, label: 'PR Qty' }).updateDisplayType({ displayType: ui.FieldDisplayType.ENTRY });
            sublist.addField({
    id: 'custpage_itemcat',
    type: ui.FieldType.TEXT,
    label: 'Item Category'
}).updateDisplayType({
    displayType: ui.FieldDisplayType.HIDDEN
});  
          return sublist;
        }

        /**
         * Helper: Loads Sales Order lines and filters for items where Stock <= 0
         */
        function setSublistValues(sublist, soId) {
            try {
                // 16. Load the Sales Order record to iterate through lines
                var soRec = record.load({ type: 'salesorder', id: soId });
                var lineCount = soRec.getLineCount({ sublistId: 'item' });
                if (lineCount === 0) return 0;

                // Collect all unique item IDs from the Sales Order
                var itemIds = [];
                for (var i = 0; i < lineCount; i++) {
                    var itemId = soRec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                    if (itemId && itemIds.indexOf(itemId) === -1) {
                        itemIds.push(itemId);
                    }
                }

                // Batch fetch stock levels for all items in 1 query (10 governance units total)
                var stockMap = getItemStockMap(itemIds);

                var lineIndex = 0;
                for (var j = 0; j < lineCount; j++) {
                    var item = soRec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: j });
                    var itemName = soRec.getSublistText({ sublistId: 'item', fieldId: 'item', line: j }) || '';
                    var location = soRec.getSublistValue({ sublistId: 'item', fieldId: 'location', line: j }) || soRec.getValue('location');
                    var neededQty = soRec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: j }) || 0;
                    var itemCategory = soRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_njt_ln_itemcat',
                        line: j
                    });
                    
                    var stockKey = item + '_' + location;
                    var currentStock = (stockMap[stockKey] !== undefined) ? stockMap[stockKey] : 0;

                    // 18. FILTER LOGIC: Only show items where stock is 0 or less
                    if (Number(currentStock) <= 0) {
                        sublist.setSublistValue({ id: 'custpage_item', line: lineIndex, value: item.toString() });
                        sublist.setSublistValue({ id: 'custpage_itemname', line: lineIndex, value: itemName });
                        sublist.setSublistValue({ id: 'custpage_seral_quants', line: lineIndex, value: currentStock.toString() });
                        sublist.setSublistValue({ id: 'custpage_opequantity', line: lineIndex, value: neededQty.toString() });
                        sublist.setSublistValue({ id: 'custpage_quantity', line: lineIndex, value: neededQty.toString() });
                        sublist.setSublistValue({
                            id: 'custpage_itemcat',
                            line: lineIndex,
                            value: itemCategory ? itemCategory.toString() : ''
                        });
                        lineIndex++;
                    }
                }
                return lineIndex;
            } catch (e) {
                log.error('setSublistValues Error', e.message);
                return 0;
            }
        }

        /**
         * Helper: Uses SuiteQL to get Quantity on Hand in batch for a set of items
         */
        function getItemStockMap(itemIds) {
            var stockMap = {};
            if (!itemIds || itemIds.length === 0) return stockMap;
            try {
                var sql = "SELECT item, location, quantityonhand FROM itemlocation WHERE item IN (" + itemIds.join(',') + ")";
                var results = query.runSuiteQL({ query: sql }).asMappedResults();
                for (var i = 0; i < results.length; i++) {
                    var key = results[i].item + '_' + results[i].location;
                    stockMap[key] = results[i].quantityonhand || 0;
                }
            } catch (e) {
                log.error('getItemStockMap Error', e.message);
            }
            return stockMap;
        }

        return { onRequest: onRequest };
    });