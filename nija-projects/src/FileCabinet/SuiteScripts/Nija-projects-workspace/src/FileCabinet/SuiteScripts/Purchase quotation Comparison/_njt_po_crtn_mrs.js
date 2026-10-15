/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/log', 'N/runtime', 'N/query','N/format'],
    (record, log, runtime, query,format) => {


        const getInputData = () => {
            try {
                const jsonStr = runtime.getCurrentScript().getParameter({
                    name: 'custscript_po_crtn_json'
                });

                log.debug('jsonStr', jsonStr);

                if (!jsonStr) {
                    log.error('EMPTY INPUT', 'No JSON received');
                    return [];
                }

                const parsed = JSON.parse(jsonStr);


                return [parsed];

            } catch (e) {
                log.error('GET INPUT ERROR', e);
                return [];
            }
        };


        const map = (context) => {
            try {
                const payload = JSON.parse(context.value);

                if (!payload.bodyFields || !payload.bodyFields.quotationId) {
                    log.error('INVALID PAYLOAD', payload);
                    return;
                }

                context.write({
                    key: payload.bodyFields.quotationId,
                    value: payload
                });

            } catch (e) {
                log.error('MAP ERROR', e);
            }
        };

//below comment line before adding the division
         const reduce = (context) => {
            try {
                const data = JSON.parse(context.values[0]);
                const body = data.bodyFields;
                log.debug("body",body);
                const lines = data.lineFields;

                const suiteql = `
                        SELECT  
                            h.id                                      AS quotation_id,
                            h.custrecord_njt_pq_subsidiary            AS subsidiary,
                            h.custrecord_njt_pq_currency              AS currency,
                            h.custrecord_njt_pq_exchange_rate         AS exchange_rate,
                            h.custrecord_njt_pq_department            AS department,
                            h.custrecord_njt_pq_location              AS location,
                            h.custrecord_njt_pq_class                 AS class,
                            l.custrecord_njt_pq_items_items           AS item,
                            l.custrecord_njt_pq_items_rate            AS rate,
                            l.custrecord_njt_pq_items_taxcode         AS taxcode,
                            l.custrecord_njt_pq_items_taxrate         AS taxrate,
                            l.custrecord_njt_pq_items_units           AS units,
                            l.custrecord_njt_pq_items_amount          AS amount,
                            l.custrecord_njt_pq_items_taxamt          AS taxamt,
                            l.custrecord_njt_pq_items_itemcat         AS itmcat,
                            l.custrecord_njt_pq_items_gross_amt       AS grossamt

                        FROM customrecord_njt_pq_h h
                        JOIN customrecord_njt_pq_items l
                            ON l.custrecord_njt_pq_items_parent_link = h.id
                        WHERE h.id = ?
                        AND l.custrecord_njt_pq_items_items IN (${lines.map(() => '?').join(',')})
                    `;
                log.debug("suiteql", suiteql);

                const params = [
                    body.quotationId,
                    ...lines.map(l => l.item)
                ];

                const results = query.runSuiteQL({
                    query: suiteql,
                    params: params
                }).asMappedResults();

                if (!results.length) {
                    log.error('NO DATA FOUND', body.quotationId);
                    return;
                }

                const subsidiary = results[0].subsidiary;
                const classdiv= results[0].class;
                log.debug("classdiv",classdiv);

                const poRec = record.create({
                    type: record.Type.PURCHASE_ORDER,
                    isDynamic: true
                });

                poRec.setValue({ fieldId: 'entity', value: body.vendorId,ignoreFieldChanged:false });
                poRec.setValue({ fieldId: 'subsidiary', value: subsidiary,ignoreFieldChanged:false });
                poRec.setValue({ fieldId: 'class', value: classdiv,ignoreFieldChanged:false });
              //poRec.setValue({ fieldId: 'subsidiary', value: 1,ignoreFieldChanged:false });
                poRec.setValue({ fieldId: 'currency', value: 1 });
                poRec.setValue({ fieldId: 'exchangerate', value: results[0].exchange_rate });
                poRec.setValue({ fieldId: 'custbody_njt_purc_qout', value: body.quotationId });
                if (body.department) poRec.setValue({ fieldId: 'department', value: results[0].department });


if (body.date) {

                            var dateOnly = body.date.split('T')[0]; // "2025-12-25"
                            var parts = dateOnly.split('-');

                            var jsDate = new Date(
                                parseInt(parts[0], 10),      // year
                                parseInt(parts[1], 10) - 1,  // month (0-based)
                                parseInt(parts[2], 10)       // day
                            );

                            //  FORCE +1 DAY to fix timezone shift
                            jsDate.setDate(jsDate.getDate() + 1);

                            log.debug('Final JS Date', jsDate);

                            poRec.setValue({
                                fieldId: 'trandate',
                                value: jsDate
                            });
                        }



                if (results[0].location) {
                    poRec.setValue({
                        fieldId: 'location',
                        value: results[0].location,
                        ignoreFieldChange: true,
                        forceSync: true
                    });
                }


                log.debug("results", results);
                var Amount = 0;
                var taxamt = '';
                var grsamt = 0;
                lines.forEach(userLine => {
                    const res = results.find(r => r.item == userLine.item);
                    if (!res) return;
                    log.debug("res.rate", res.rate);
                    poRec.selectNewLine({ sublistId: 'item' });
                    poRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: res.item,
                        ignoreFieldChange: false,
                        forceSyncSourcing: true
                    });
                    poRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: userLine.chooseQty,
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    });
                    poRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        value: res.rate,
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    });
                    // poRec.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'taxcode',
                    //     value: res.taxcode,
                    //     //value: 5,
                    //     ignoreFieldChange: true,
                    //     forceSyncSourcing: false
                    // });
                    poRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'units',
                        value: res.units,
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    });
                    Amount = parseFloat(res.rate) * parseFloat(userLine.chooseQty);
                    log.debug("Amount", Amount);
                    poRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        value: Amount || 0,
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    });
                    poRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxrate1',
                        value: res.taxrate || 0,
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    });
                    taxamt = calculatetaxamt(Amount, res.taxrate);
                    log.audit("taxamt", taxamt);
                    poRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'tax1amt',
                        value: taxamt || 0,
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    });
                    grsamt = calculategrsamt(Amount, taxamt);
                    log.audit("grsamt", grsamt);
                    poRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'grossamt',
                        value: grsamt || 0,
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    });

                     poRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_njt_po_purchase_quotation',
                        value: body.quotationId,
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    });
                    log.debug("PQ Item Category", {
                        item: res.item,
                        itmcat: res.itmcat
                    });
                    poRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_njt_ln_itemcat',
                        value: parseInt(res.itmcat),
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    });
                    // poRec.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'custcol_njt_ln_itemcat',
                    //     value: 1,
                    //     //ignoreFieldChange: true,
                    //     //forceSyncSourcing: false
                    // });

                    poRec.commitLine({ sublistId: 'item' });
                });

                const poId = poRec.save();
                log.audit('PO CREATED SUCCESSFULLY', poId);
                // Here Once Purchase Order Created We have to close status for the items in quotation line level
                if (poId) {


                    const quoRec = record.load({
                        type: "customrecord_njt_pq_h",
                        id: body.quotationId,
                        isDynamic: false
                    });

                    // Items selected by user (PO items)
                    const selectedItemIds = lines.map(l => l.item);


                    const quotLineCount = quoRec.getLineCount({
                        sublistId: "recmachcustrecord_njt_pq_items_parent_link"
                    });

                    let closedCount = 0;

                    for (let i = 0; i < quotLineCount; i++) {

                        const quoItem = quoRec.getSublistValue({
                            sublistId: "recmachcustrecord_njt_pq_items_parent_link",
                            fieldId: "custrecord_njt_pq_items_items",
                            line: i
                        });

                        if (selectedItemIds.includes(quoItem)) {

                            quoRec.setSublistValue({
                                sublistId: "recmachcustrecord_njt_pq_items_parent_link",
                                fieldId: "custrecord_njt_pq_items_status",
                                line: i,
                                value: 2   // CLOSED
                            });

                            closedCount++;
                        }
                    }


                    if (closedCount > 0) {
                        quoRec.save({
                            ignoreMandatoryFields: true
                        });

                        log.audit('QUOTATION ITEMS CLOSED', {
                            quotationId: body.quotationId,
                            closedLines: closedCount
                        });
                    }
                    // get lines closed field value from quotation record
                    let linesclosed = parseFloat(quoRec.getValue({
                        fieldId: "custrecord_njt_pq_lines_closed"
                    }));
                    linesclosed = linesclosed + closedCount;
                    log.debug("no of linesclosed", linesclosed);
                    
                    // Submit no of lines closed now
                    var otherId = record.submitFields({
                        type: 'customrecord_njt_pq_h',
                        id: body.quotationId,
                        values: {
                            'custrecord_njt_pq_lines_closed': linesclosed
                        }
                    });
                    log.debug("closed line count updated", otherId);

                    // if no of line count matches the no in that field close body status also
                    if (parseFloat(linesclosed) == parseFloat(quotLineCount)) {

                        var statusclose = record.submitFields({
                            type: 'customrecord_njt_pq_h',
                            id: body.quotationId,
                            values: {
                                'custrecord_njt_pq_status': 2
                            }
                        });
                        log.debug("Status closed for purchse quotation", statusclose);
                    }
                }


            } catch (e) {
                log.error('REDUCE ERROR', e);
            }
        }; 

        const summarize = (summary) => {
            log.audit('MAP/REDUCE COMPLETED', {
                usage: summary.usage,
                yields: summary.yields
            });

            if (summary.inputSummary.error) {
                log.error('INPUT ERROR', summary.inputSummary.error);
            }

            summary.reduceSummary.errors.iterator().each((key, error) => {
                log.error(`REDUCE ERROR KEY ${key}`, error);
                return true;
            });
        };
        function calculatetaxamt(amount, taxrate) {
            return amount * taxrate; // 2000 * 0.05 = 100
        }

        function calculategrsamt(amount, taxamt) {
            return amount + taxamt; // 2000 + 100 = 2100
        }
        return {
            getInputData,
            map,
            reduce,
            summarize
        };
    });
