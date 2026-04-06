/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 *
 * Description: Generates a partial invoice from a Sales Order with specific 
 * billing percentages, COGS tracking, and deduction logic for Progress Billing.
 * This has been enhanced to also support quantity-based invoicing from the same interface.
 */
define(['N/record', 'N/ui/serverWidget', 'N/redirect', 'N/log', 'N/search'], 
function(record, serverWidget, redirect, log, search) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var salesOrderId = context.request.parameters.recid;
            var method = context.request.parameters.method;
            log.debug("salesOrderId",salesOrderId);
            log.debug("method", method);
            var form = serverWidget.createForm({ title: 'Generate Invoice' });
            
            var errorMsg = context.request.parameters.error;

            if (errorMsg) {
                form.addField({
                    id: 'custpage_error_msg',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: ' '
                }).defaultValue =
                    '<div style="color:red;font-weight:bold;font-size:14px;">' + errorMsg + '</div>';
            }
            // You must upload the new client script file ('cs_invoice_creation_helper.js') to the File Cabinet
            // and update the path here. For example: '/SuiteScripts/YourApp/cs_invoice_creation_helper.js'
            form.clientScriptModulePath = '/SuiteScripts/cs_invoice_creation_helper.js';
            // --- Main Invoice Method Field ---
            var invoiceMethodFld = form.addField({
                id: 'custpage_invoice_method',
                type: serverWidget.FieldType.SELECT,
                label: 'Invoice Method'
            });
            invoiceMethodFld.addSelectOption({ value: '', text: '' });
            invoiceMethodFld.addSelectOption({ value: 'percentage', text: 'Percentage Based' });
            invoiceMethodFld.addSelectOption({ value: 'quantity', text: 'Quantity Based' });
            invoiceMethodFld.isMandatory = true;
            if (method) {
                invoiceMethodFld.defaultValue = method;
            }

            if (method === 'percentage') {
                // --- Fields for Percentage Based Method ---
                form.addField({ id: 'custpage_inv_type', type: serverWidget.FieldType.SELECT, label: 'Invoice Type', source: 'customlist_njt_invoice_type' }).isMandatory = true;
                form.addField({ id: 'custpage_percentage', type: serverWidget.FieldType.PERCENT, label: 'Billing Percentage (%)' }).isMandatory = true;
                form.addField({ id: 'custpage_advance_pct', type: serverWidget.FieldType.PERCENT, label: 'Advance Deduction (%)' });
                form.addField({ id: 'custpage_cogs_pct', type: serverWidget.FieldType.PERCENT, label: 'COGS Percentage (%)' });

            } else if (method === 'quantity') {
                // --- Sublist for Quantity Based Method ---
                var itemSublist = form.addSublist({
                    id: 'custpage_item_sublist',
                    type: serverWidget.SublistType.LIST,
                    label: 'Items to Invoice'
                });

                // Add the new editable "Invoice Quantity" field first for better UI
                itemSublist.addField({ id: 'custpage_invoice_quantity', type: serverWidget.FieldType.FLOAT, label: 'To be Invoiced' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

                // Add other display-only fields as requested
                
                itemSublist.addField({ id: 'custpage_sub_item', type: serverWidget.FieldType.TEXT, label: 'Item' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                itemSublist.addField({ id: 'custpage_sub_itemcat', type: serverWidget.FieldType.TEXT, label: 'Item Category' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                itemSublist.addField({ id: 'custpage_qty_ordered', type: serverWidget.FieldType.FLOAT, label: 'Ordered Qty' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                itemSublist.addField({ id: 'custpage_qty_invoiced', type: serverWidget.FieldType.FLOAT, label: 'Invoiced Qty' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                itemSublist.addField({ id: 'custpage_qty_remaining', type: serverWidget.FieldType.FLOAT, label: 'Remaining Qty' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                itemSublist.addField({ id: 'custpage_sub_units', type: serverWidget.FieldType.TEXT, label: 'Units' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                itemSublist.addField({ id: 'custpage_sub_desc', type: serverWidget.FieldType.TEXT, label: 'Description' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                itemSublist.addField({ id: 'custpage_sub_rate', type: serverWidget.FieldType.TEXT, label: 'Rate' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                itemSublist.addField({ id: 'custpage_sub_amount', type: serverWidget.FieldType.TEXT, label: 'Amount' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                itemSublist.addField({ id: 'custpage_sub_taxcode', type: serverWidget.FieldType.TEXT, label: 'Tax Code' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                itemSublist.addField({ id: 'custpage_sub_taxrate', type: serverWidget.FieldType.TEXT, label: 'Tax Rate' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                itemSublist.addField({ id: 'custpage_sub_taxamt', type: serverWidget.FieldType.TEXT, label: 'Tax Amount' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                itemSublist.addField({ id: 'custpage_sub_grossamt', type: serverWidget.FieldType.TEXT, label: 'Gross Amount' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                
                // Hidden field for mapping during POST
                var lineKeyFld = itemSublist.addField({ id: 'custpage_so_line_key', type: serverWidget.FieldType.TEXT, label: 'SO Line Key' });
                lineKeyFld.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

                // --- Populate Sublist Data ---
                var salesOrderRec = record.load({ type: record.Type.SALES_ORDER, id: parseInt(salesOrderId), isDynamic: false });
                var soLineCount = salesOrderRec.getLineCount({ sublistId: 'item' });
                var sublistLine = 0;

                // Helper function to prevent NetSuite 'options.value' crashes when fields are empty
                var safeStr = function(val) { return (val === null || val === undefined || val === '') ? ' ' : String(val); };

                for (var i = 0; i < soLineCount; i++) {
                    var quantity = parseFloat(salesOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }));
                    if (isNaN(quantity) || quantity <= 0) continue; // Safely skip description/subtotal lines
                    
                    var quantityBilled = parseFloat(salesOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'quantitybilled', line: i })) || 0;
                    var quantityRemaining = quantity - quantityBilled;

                    if (quantityRemaining <= 0) continue; // Skip fully billed lines

                    // Leaving 'To be Invoiced' blank by default so the user has to explicitly enter the quantity
                    itemSublist.setSublistValue({ id: 'custpage_sub_item', line: sublistLine, value: salesOrderRec.getSublistText({ sublistId: 'item', fieldId: 'item', line: i }) || ' ' });
                    itemSublist.setSublistValue({ id: 'custpage_sub_itemcat', line: sublistLine, value: salesOrderRec.getSublistText({ sublistId: 'item', fieldId: 'custcol_njt_ln_itemcat', line: i }) || ' ' });
                    itemSublist.setSublistValue({ id: 'custpage_qty_ordered', line: sublistLine, value: quantity.toString() });
                    itemSublist.setSublistValue({ id: 'custpage_qty_invoiced', line: sublistLine, value: quantityBilled.toString() });
                    itemSublist.setSublistValue({ id: 'custpage_qty_remaining', line: sublistLine, value: quantityRemaining.toString() });
                    itemSublist.setSublistValue({ id: 'custpage_sub_units', line: sublistLine, value: salesOrderRec.getSublistText({ sublistId: 'item', fieldId: 'units', line: i }) || ' ' });
                    itemSublist.setSublistValue({ id: 'custpage_sub_desc', line: sublistLine, value: safeStr(salesOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i })) });
                    itemSublist.setSublistValue({ id: 'custpage_sub_rate', line: sublistLine, value: safeStr(salesOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i })) });
                    itemSublist.setSublistValue({ id: 'custpage_sub_amount', line: sublistLine, value: safeStr(salesOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i })) });
                    itemSublist.setSublistValue({ id: 'custpage_sub_taxcode', line: sublistLine, value: salesOrderRec.getSublistText({ sublistId: 'item', fieldId: 'taxcode', line: i }) || ' ' });
                    itemSublist.setSublistValue({ id: 'custpage_sub_taxrate', line: sublistLine, value: safeStr(salesOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i })) });
                    itemSublist.setSublistValue({ id: 'custpage_sub_taxamt', line: sublistLine, value: safeStr(salesOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i })) });
                    itemSublist.setSublistValue({ id: 'custpage_sub_grossamt', line: sublistLine, value: safeStr(salesOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'grossamt', line: i })) });
                    
                    // IMPORTANT: 'line' correctly maps to the 'orderline' reference field on the transformed Invoice
                    var lineKey = salesOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'line', line: i });
                    if (lineKey) {
                        itemSublist.setSublistValue({ id: 'custpage_so_line_key', line: sublistLine, value: lineKey.toString() });
                    }
                    sublistLine++;
                }
            }

            var hiddenSOField = form.addField({ id: 'custpage_so_internalid', type: serverWidget.FieldType.TEXT, label: 'Sales Order ID' });
            hiddenSOField.defaultValue = salesOrderId;
            hiddenSOField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            form.addSubmitButton({ label: 'Create Invoice' });
            context.response.writePage(form);
        }
        else {
            try {
                var invoiceMethod = context.request.parameters.custpage_invoice_method;
                var soInternalId = context.request.parameters.custpage_so_internalid;

                if (!soInternalId) throw new Error('Sales Order ID is missing.');

                if (invoiceMethod === 'quantity') {
                    // --- New: Quantity Based Invoice Creation ---
                    var lineCount = context.request.getLineCount({ group: 'custpage_item_sublist' });
                    var itemsToInvoice = {}; // Use an object for O(1) lookups
                    var hasItems = false;

                    for (var i = 0; i < lineCount; i++) {
                        var invoiceQty = parseFloat(context.request.getSublistValue({
                            group: 'custpage_item_sublist',
                            name: 'custpage_invoice_quantity',
                            line: i
                        }) || 0);

                        var lineKey = context.request.getSublistValue({
                            group: 'custpage_item_sublist',
                            name: 'custpage_so_line_key',
                            line: i
                        });

                        if (lineKey && invoiceQty > 0) {
                            var remainingQty = parseFloat(context.request.getSublistValue({
                                group: 'custpage_item_sublist',
                                name: 'custpage_qty_remaining',
                                line: i
                            }) || 0);

                            if (invoiceQty > remainingQty) {
                                throw new Error('Entered quantity (' + invoiceQty + ') exceeds remaining (' + remainingQty + ') for line item.');
                            }

                            itemsToInvoice[lineKey] = invoiceQty;
                            hasItems = true;
                        }
                    }

                    if (!hasItems) {
                        throw new Error('Please enter a quantity greater than 0 for at least one item.');
                    }

                    // Transform the Sales Order to an Invoice, which is more robust
                    var invoiceRecord = record.transform({
                        fromType: record.Type.SALES_ORDER,
                        // FIX: Ensure the ID is passed as a number, not a string. This is the likely cause of the crash.
                        fromId: parseInt(soInternalId, 10),
                        toType: record.Type.INVOICE,
                        isDynamic: true
                    });

                    var invLineCount = invoiceRecord.getLineCount({ sublistId: 'item' });
                    var linesToRemove = [];

                    // Adjust quantities or mark lines for removal
                    for (var j = 0; j < invLineCount; j++) {
                        var soLineKey = invoiceRecord.getSublistValue({ sublistId: 'item', fieldId: 'orderline', line: j });
                        
                        if (itemsToInvoice.hasOwnProperty(soLineKey)) {
                            invoiceRecord.selectLine({ sublistId: 'item', line: j });

                            var rate = invoiceRecord.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate'
                            });

                            invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: itemsToInvoice[soLineKey] });

                            // 🔥 Re-set rate to trigger amount recalculation
                            invoiceRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'rate',
                                value: rate
                            });

                            invoiceRecord.commitLine({ sublistId: 'item' });
                        } else {
                            linesToRemove.push(j);
                        }
                    }

                    // Remove lines in reverse order to avoid index shifting issues
                    for (var k = linesToRemove.length - 1; k >= 0; k--) {
                        invoiceRecord.removeLine({ sublistId: 'item', line: linesToRemove[k] });
                    }

                    var invoiceId = invoiceRecord.save({ enableSourcing: true, ignoreMandatoryFields: false });
                    redirect.toRecord({ type: record.Type.INVOICE, id: invoiceId });

                } else if (invoiceMethod === 'percentage') {
                    // --- Existing: Percentage Based Invoice Creation ---
                    var invoicePercentage = parseFloat(context.request.parameters.custpage_percentage);
                    var invoiceType = context.request.parameters.custpage_inv_type;
                    var invoiceDeduction = parseFloat(context.request.parameters.custpage_advance_pct || 0);
                    var cogsPercentage = parseFloat(context.request.parameters.custpage_cogs_pct || 0);

                    // Transform the Sales Order to an Invoice to carry over all line details
                    var invoiceRecord = record.transform({
                        fromType: record.Type.SALES_ORDER,
                        fromId: parseInt(soInternalId, 10),
                        toType: record.Type.INVOICE,
                        isDynamic: true
                    });

                    invoiceRecord.setValue({ fieldId: 'custbody1', value: invoiceType });
                    invoiceRecord.setValue({ fieldId: 'custbody_njt_invoice_advance_per', value: invoicePercentage });
                    invoiceRecord.setValue({ fieldId: 'custbody_njt_advance_deduction_per', value: invoiceDeduction });

                    if (cogsPercentage) {
                        invoiceRecord.setValue({ fieldId: 'custbody_njt_cogs_percentge_inv', value: cogsPercentage });
                    }

                    var invLineCount = invoiceRecord.getLineCount({ sublistId: 'item' });
                    var validLinesAdded = 0;
                    var firstValidItemCat = null;

                    // Adjust the rate for each line based on the percentage
                    for (var i = 0; i < invLineCount; i++) {
                        invoiceRecord.selectLine({ sublistId: 'item', line: i });
                        var currentRate = invoiceRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'rate' });
                        var itemCat = invoiceRecord.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_njt_ln_itemcat' });
                        
                        if (itemCat && !firstValidItemCat) {
                            firstValidItemCat = itemCat;
                        }

                        if (currentRate) {
                            var adjustedRate = parseFloat(currentRate) * (invoicePercentage / 100);
                            invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: adjustedRate });
                            invoiceRecord.commitLine({ sublistId: 'item' });
                            validLinesAdded++;
                        }
                    }

                    if (String(invoiceType) === '2') { // Progress Billing Deduction Logic
                        var trackerSearch = search.create({
                            type: 'customrecord_njt_progress_billing_tracke',
                            filters: [['custrecord_njt_pro_sales_order', 'anyof', soInternalId]],
                            columns: ['internalid']
                        });
                        var trackerResults = trackerSearch.run().getRange({ start: 0, end: 1 });

                        if (trackerResults.length > 0) {
                            var trackerRec = record.load({ type: 'customrecord_njt_progress_billing_tracke', id: trackerResults[0].getValue('internalid') });
                            var subId = 'recmachcustrecord_njt_billing_cogs_link_parent';
                            var tCount = trackerRec.getLineCount({ sublistId: subId });
                            var deductionAmount = 0;

                            for (var j = 0; j < tCount; j++) {
                                var lineType = trackerRec.getSublistValue({ sublistId: subId, fieldId: 'custrecord_njt_billing_cogs_invoice_type', line: j });
                                if (String(lineType) === '1') { // Find the 'Advance' type line
                                    var stageAmt = parseFloat(trackerRec.getSublistValue({ sublistId: subId, fieldId: 'custrecord_njt_billing_cogs_stages', line: j }) || 0);
                                    deductionAmount = stageAmt * (invoiceDeduction / 100);
                                    break;
                                }
                            }

                            if (deductionAmount > 0) {
                                var setupRec = record.load({ type: 'customrecord_hris_setup_for_account', id: 2 });
                                var setupItem = setupRec.getValue('custrecord_njt_setup_item');

                                if (setupItem) {
                                    invoiceRecord.selectNewLine({ sublistId: 'item' });
                                    invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: setupItem });
                                    invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1 });
                                    invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: -Math.abs(deductionAmount) });
                                    invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_njt_ln_itemcat', value: firstValidItemCat || '' });
                                    var soLocation = invoiceRecord.getValue('location');
                                    if (soLocation) {
                                        invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: soLocation });
                                    }
                                    invoiceRecord.commitLine({ sublistId: 'item' });
                                    validLinesAdded++;
                                }
                            }
                        }
                    }

                    if (validLinesAdded === 0) throw new Error('No valid items were found to add to the invoice.');

                    // FIX: Changed save options to be safer. This will now throw a clear error if a mandatory field is missing, rather than crashing or saving a bad record.
                    var invoiceId = invoiceRecord.save({ enableSourcing: true, ignoreMandatoryFields: false });
                    redirect.toRecord({ type: record.Type.INVOICE, id: invoiceId });
                } else {
                    throw new Error('An invalid invoice method was selected. Please go back and select a method.');
                }

            } catch (error) {
                log.error('Error in POST', error);
                // BEST PRACTICE: Redirect back to the suitelet with the error message
                redirect.toSuitelet({
                    scriptId: 'customscript_njt_salesord_create_invoice', // <-- IMPORTANT: Replace with your Script ID
                    deploymentId: 'customdeploy_njt_salesord_create_invoice', // <-- IMPORTANT: Replace with your Deployment ID
                    parameters: {
                        recid: soInternalId,
                        method: invoiceMethod,
                        error: error.message
                    }
                });
            }
        }
    }

    return { onRequest: onRequest };
});