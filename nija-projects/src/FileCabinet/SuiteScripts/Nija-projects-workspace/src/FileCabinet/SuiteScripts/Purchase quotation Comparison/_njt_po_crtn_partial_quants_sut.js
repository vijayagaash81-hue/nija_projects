/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/query', 'N/log', 'N/task', 'N/redirect'],
    (ui, query, log, task, redirect) => {


        /**
         * Fetch items for a given quotationId filtered by item IDs
         * @param {Number} quotationId 
         * @param {Array} itemArray 
         * @returns {Array} List of item objects
         */
        const getQuotationItems = (quotationId, itemArray) => {
            if (!quotationId || !itemArray || itemArray.length === 0) return [];

            const allResults = [];

            itemArray.forEach(item => {
                const sql = `
                SELECT
    a.custrecord_njt_pq_vendor AS vendorid,
    BUILTIN.DF(a.custrecord_njt_pq_vendor) AS vendorname,
    b.custrecord_njt_pq_items_items AS itemid,
    b.custrecord_njt_pq_items_description AS itemsdesc,
    b.custrecord_njt_pq_items_request_quantity AS requestedquants,
    b.custrecord_njt_pq_items_quantity AS quoted_quants,
    b.custrecord_njt_pq_items_rate AS rate,
    d.custrecord_njt_pur_req_open_quantity AS propenquantity,
    c.id
FROM
    customrecord_njt_pq_h a
    LEFT JOIN customrecord_njt_pq_items b
        ON b.custrecord_njt_pq_items_parent_link = a.id
    LEFT JOIN customrecord_njt_pur_req_h c
        ON c.id = a.custrecord_njt_pq_pr
    LEFT JOIN customrecord_njt_pur_req_det_l d
        ON d.custrecord_njt_pur_req_det_pl = c.id
       AND d.custrecord_njt_pur_req_det_item = b.custrecord_njt_pq_items_items
WHERE
    a.id = ${quotationId}
    AND b.custrecord_njt_pq_items_items = ${item}
    --AND c.id = 369;

            `;
                log.debug("SQL Query", sql);

                try {
                    const result = query.runSuiteQL({ query: sql }).asMappedResults();
                    if (result && result.length > 0) {
                        allResults.push(result[0]);
                    }
                } catch (e) {
                    log.error('Query Error', e);
                }
            });

            log.debug('All Fetched Items', allResults);
            return allResults;
        };


        /**
         * Create and populate sublist
         * @param {Object} form 
         * @param {Array} items 
         */
        const createItemsSublist = (form, items) => {
            const sublist = form.addSublist({
                id: 'custpage_items',
                type: ui.SublistType.LIST,
                label: 'Items'
            });


            sublist.addField({ id: 'custpage_select', type: ui.FieldType.CHECKBOX, label: 'Select' }).updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });;
            sublist.addField({ id: 'custpage_item', type: ui.FieldType.SELECT, label: 'Item', source: 'item' }).updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });
            sublist.addField({ id: 'custpage_price', type: ui.FieldType.TEXT, label: 'Price' });
            sublist.addField({ id: 'custpage_req_qty', type: ui.FieldType.TEXT, label: 'Required Qty' });
            sublist.addField({ id: 'custpage_propen', type: ui.FieldType.TEXT, label: 'PR Open Quantity' }).updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });;
            sublist.addField({ id: 'custpage_quoted_qty', type: ui.FieldType.FLOAT, label: 'Quoted Qty' });

            const chooseQtyFld = sublist.addField({
                id: 'custpage_choose_qty',
                type: ui.FieldType.FLOAT,
                label: 'Choose Qty'
            });
            chooseQtyFld.updateDisplayType({ displayType: ui.FieldDisplayType.ENTRY });
            chooseQtyFld.isMandatory = true;

            items.forEach((item, index) => {
                sublist.setSublistValue({ id: 'custpage_item', line: index, value: item.itemid || '' });
                sublist.setSublistValue({ id: 'custpage_price', line: index, value: (item.rate !== undefined && item.rate !== null) ? item.rate.toString() : '0' });
                sublist.setSublistValue({ id: 'custpage_req_qty', line: index, value: (item.requestedquants !== undefined && item.requestedquants !== null) ? item.requestedquants.toString() : '0' });

                sublist.setSublistValue({ id: 'custpage_propen', line: index, value: (item.propenquantity !== undefined && item.propenquantity !== null) ? item.propenquantity.toString() : '0' });
                sublist.setSublistValue({ id: 'custpage_quoted_qty', line: index, value: (item.quoted_quants !== undefined && item.quoted_quants !== null) ? item.quoted_quants.toString() : '0' });
            });
        };


        const onRequest = (context) => {

            if (context.request.method === 'POST') {
                // Handle submitted JSON
                const selectedData = context.request.parameters.custpage_selected_data || null;
                log.debug("selectedData", selectedData);


                try {
                    const mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_njt_po_crtn_mrs',
                        deploymentId: 'customdeploy_njt_po_crtn_mrs',
                        params: {
                            custscript_po_crtn_json: selectedData
                        }
                    });

                    const taskId = mrTask.submit();
                    log.audit("M/R Task Submitted", taskId);



                    redirect.toSuitelet({
                        scriptId: 'customscript_njt_po_crtn_pq_sut', // <-- change to your target Suitelet ID
                        deploymentId: 'customdeploy_njt_po_crtn_pq_sut', // <-- change to target deployment ID

                    });

                } catch (e) {
                    log.error('Error Processing Selected Data', e);
                    context.response.write('Error: ' + e.message);
                }


                return; // Exit after POST
            }

            // GET: Build form
            let data = context.request.parameters.data || '';
            let parsed = {};
            try {
                parsed = JSON.parse(data);
                log.debug('Parsed JSON', parsed);
            } catch (e) {
                log.error('JSON Parse Error', e);
            }

            const quotationId = parsed.quotationId || '';
            const vendorId = parsed.vendorId || '';
            const itemIds = (parsed.items || []).map(i => i.itemId);
            log.debug("itemIds", itemIds);

            const form = ui.createForm({ title: 'PO Creation – Vendor Selection' });

            const vendorFld = form.addField({
                id: 'custpage_vendor',
                type: ui.FieldType.SELECT,
                label: 'Vendor',
                source: 'vendor'
            });
            vendorFld.defaultValue = vendorId;
            vendorFld.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });

            const quotationFld = form.addField({
                id: 'custpage_quotationid',
                type: ui.FieldType.SELECT,
                label: 'Quotation ID',
                source: 'customrecord_njt_pq_h'
            });
            quotationFld.defaultValue = quotationId;
            quotationFld.updateDisplayType({ displayType: ui.FieldDisplayType.DISABLED });

            // Hidden JSON field for selected data
            const selectedDataField = form.addField({
                id: 'custpage_selected_data',
                type: ui.FieldType.LONGTEXT,
                label: 'Selected Data (JSON)'
            });
            selectedDataField.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });

            // Fetch items and create sublist
            const items = getQuotationItems(quotationId, itemIds);
            if (items && items.length > 0) {
                createItemsSublist(form, items);
            } else {
                log.debug('No items found for this quotation and item IDs', itemIds);
            }
            // Date Field
            const DateField = form.addField({
                id: 'custpage_date',
                type: ui.FieldType.DATE,
                label: 'Date'
            });

            // Set current date
            DateField.defaultValue = new Date();

            form.addSubmitButton({ label: 'Create Purchase Order' });
            form.clientScriptFileId = 428; // Your Client Script file ID
            context.response.writePage(form);
        };

        return { onRequest };
    });
