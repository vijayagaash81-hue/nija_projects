/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * 
 * Description: Generates a partial invoice from a Sales Order with specific 
 * billing percentages, COGS tracking, and deduction logic for Progress Billing.
 */

define(['N/record', 'N/ui/serverWidget', 'N/redirect', 'N/log', 'N/search'], 
function(record, serverWidget, redirect, log, search) {

    function onRequest(context) {

        if (context.request.method === 'GET') {
            var salesOrderId = context.request.parameters.recid;
            log.debug("salesOrderId",salesOrderId);
            var form = serverWidget.createForm({ title: 'Generate Invoice' });

            form.addField({ id: 'custpage_inv_type', type: serverWidget.FieldType.SELECT, label: 'Invoice Type', source: 'customlist_njt_invoice_type' }).isMandatory = true;
            form.addField({ id: 'custpage_percentage', type: serverWidget.FieldType.PERCENT, label: 'Billing Percentage (%)' }).isMandatory = true;
            form.addField({ id: 'custpage_advance_pct', type: serverWidget.FieldType.PERCENT, label: 'Advance Deduction (%)' });
            form.addField({ id: 'custpage_cogs_pct', type: serverWidget.FieldType.PERCENT, label: 'COGS Percentage (%)' });

            var hiddenSOField = form.addField({ id: 'custpage_so_internalid', type: serverWidget.FieldType.TEXT, label: 'Sales Order ID' });
            hiddenSOField.defaultValue = salesOrderId;
            hiddenSOField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            form.addSubmitButton({ label: 'Create Invoice' });
            context.response.writePage(form);
        }
        else {
            try {
                var soInternalId = context.request.parameters.custpage_so_internalid;
                var invoicePercentage = parseFloat(context.request.parameters.custpage_percentage);
                var invoiceType = context.request.parameters.custpage_inv_type;
                var invoiceDeduction = parseFloat(context.request.parameters.custpage_advance_pct || 0);
                var cogsPercentage = parseFloat(context.request.parameters.custpage_cogs_pct || 0);

                if (!soInternalId) throw new Error('Sales Order ID is missing.');

                var salesOrderRec = record.load({
                    type: record.Type.SALES_ORDER,
                    id: parseInt(soInternalId),
                    isDynamic: false
                });

                // Get Location from SO Header to use for lines
                var soLocation = salesOrderRec.getValue('location');

                var invoiceRecord = record.create({
                    type: record.Type.INVOICE,
                    isDynamic: true
                });

                invoiceRecord.setValue({ fieldId: 'entity', value: salesOrderRec.getValue('entity') });
                invoiceRecord.setValue({ fieldId: 'subsidiary', value: salesOrderRec.getValue('subsidiary') });
                invoiceRecord.setValue({ fieldId: 'currency', value: salesOrderRec.getValue('currency') });
                invoiceRecord.setValue({ fieldId: 'location', value: soLocation });
                invoiceRecord.setValue({ fieldId: 'createdfrom', value: parseInt(soInternalId) });

                invoiceRecord.setValue({ fieldId: 'custbody1', value: invoiceType });
                invoiceRecord.setValue({ fieldId: 'custbody_njt_invoice_advance_per', value: invoicePercentage });
                invoiceRecord.setValue({ fieldId: 'custbody_njt_advance_deduction_per', value: invoiceDeduction });
                
                if (cogsPercentage) {
                    invoiceRecord.setValue({ fieldId: 'custbody_njt_cogs_percentge_inv', value: cogsPercentage });
                }

                var soCsegProj = salesOrderRec.getValue('cseg_njt_seg_proj');
                if (soCsegProj) {
                    invoiceRecord.setValue({ fieldId: 'cseg_njt_seg_proj', value: soCsegProj });
                }

                var soLineCount = salesOrderRec.getLineCount({ sublistId: 'item' });
                var validLinesAdded = 0;
                var firstValidItemCat = null; 
                
                for (var i = 0; i < soLineCount; i++) {
                    var soItemId = salesOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                    var soQuantity = salesOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                    var soRate = salesOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i });
                    var soItemCat = salesOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_njt_ln_itemcat', line: i });
                    var lineLoc = salesOrderRec.getSublistValue({ sublistId: 'item', fieldId: 'location', line: i }) || soLocation;

                    if (soItemCat && !firstValidItemCat) firstValidItemCat = soItemCat;

                    if (soItemId && soQuantity && soRate) {
                        invoiceRecord.selectNewLine({ sublistId: 'item' });
                        var adjustedRate = parseFloat(soRate) * (invoicePercentage / 100);
                        
                        invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: soItemId });
                        invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: parseFloat(soQuantity) });
                        invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: adjustedRate });
                        invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_njt_ln_itemcat', value: soItemCat || '' });
                        
                        // FIX: Explicitly set Location on the line
                        if (lineLoc) {
                            invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: lineLoc });
                        }

                        invoiceRecord.commitLine({ sublistId: 'item' });
                        validLinesAdded++;
                    }
                }

                if (String(invoiceType) === '2') {
                    var trackerSearch = search.create({
                        type: 'customrecord_njt_progress_billing_tracke',
                        filters: [['custrecord_njt_pro_sales_order', 'anyof', soInternalId]],
                        columns: ['internalid']
                    });

                    var trackerResults = trackerSearch.run().getRange({ start: 0, end: 1 });

                    if (trackerResults.length > 0) {
                        var trackerRec = record.load({
                            type: 'customrecord_njt_progress_billing_tracke',
                            id: trackerResults[0].getValue('internalid')
                        });

                        var subId = 'recmachcustrecord_njt_billing_cogs_link_parent';
                        var tCount = trackerRec.getLineCount({ sublistId: subId });
                        var deductionAmount = 0;
                        var foundMatch = false;

                        for (var j = 0; j < tCount; j++) {
                            var lineType = trackerRec.getSublistValue({ sublistId: subId, fieldId: 'custrecord_njt_billing_cogs_invoice_type', line: j });
                            if (String(lineType) === '1') {
                                var stageAmt = parseFloat(trackerRec.getSublistValue({ sublistId: subId, fieldId: 'custrecord_njt_billing_cogs_stages', line: j }) || 0);
                                deductionAmount = stageAmt * (invoiceDeduction / 100);
                                foundMatch = true;
                                break;
                            }
                        }

                        if (foundMatch && deductionAmount > 0) {
                            var setupRec = record.load({ type: 'customrecord_hris_setup_for_account', id: 2 });
                            var setupItem = setupRec.getValue('custrecord_njt_setup_item');

                            if (setupItem) {
                                invoiceRecord.selectNewLine({ sublistId: 'item' });
                                invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: setupItem });
                                invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: 1 });
                                invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: -Math.abs(deductionAmount) });
                                invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_njt_ln_itemcat', value: firstValidItemCat || '' });
                                
                                // FIX: Explicitly set Location on the deduction line
                                if (soLocation) {
                                    invoiceRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: soLocation });
                                }

                                invoiceRecord.commitLine({ sublistId: 'item' });
                                validLinesAdded++;
                            }
                        }
                    }
                }

                if (validLinesAdded === 0) throw new Error('No valid items were added to the invoice.');

                var invoiceId = invoiceRecord.save({ enableSourcing: false, ignoreMandatoryFields: true });

                redirect.toRecord({ type: record.Type.INVOICE, id: invoiceId });

            } catch (error) {
                log.error('Error in POST', error);
                var errForm = serverWidget.createForm({ title: 'Error Creating Invoice' });
                errForm.addField({ id: 'custpage_err', type: serverWidget.FieldType.INLINEHTML, label: ' ' }).defaultValue = '<p style="color:red;">' + error.message + '</p>';
                context.response.writePage(errForm);
            }
        }
    }

    return { onRequest: onRequest };
});