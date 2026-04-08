/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/ui/serverWidget', 'N/search'],
function (record, log, serverWidget, search) {

    function beforeLoad(context) {

        // Run only in VIEW mode
        if (context.type !== context.UserEventType.VIEW) return;

        var form = context.form;
        var rec = context.newRecord;

        // ---------------- GET VALUES ----------------
        var soId = rec.getValue({
            fieldId: 'custrecord_njt_sales_order_num'
        });

        var budget = rec.getValue({
            fieldId: 'custrecord_njt_productionbudget'
        });

        // ---------------- DEFAULT VALUES ----------------
        var contractValue = "0.00";
        var wip = 0;
        var subJobs = "2";

        // ---------------- FORMAT BUDGET ----------------
        budget = budget ? parseFloat(budget).toFixed(2) : "0.00";

        // ---------------- GET CONTRACT VALUE ----------------
        if (soId) {
            try {
                var soData = search.lookupFields({
                    type: search.Type.SALES_ORDER,
                    id: soId,
                    columns: ['total']
                });

                if (soData.total) {
                    contractValue = parseFloat(soData.total).toFixed(2);
                }

            } catch (e) {
                log.error('SO Fetch Error', e);
            }
        }

        // ---------------- EXACT SAME SAVED SEARCH LOGIC ----------------
        try {

            var transactionSearchObj = search.create({
                type: "transaction",
                settings: [
                    { name: "consolidationtype", value: "ACCTTYPE" }
                ],
                filters: [
                    ["posting","is","T"],
                    "AND",
                    ["account","anyof","851"]
                ],
                columns: [
                    search.createColumn({ name: "debitamount" })
                ]
            });

            var count = transactionSearchObj.runPaged().count;
            log.debug("Search Count", count);

            transactionSearchObj.run().each(function(result){

                var debit = parseFloat(result.getValue({
                    name: 'debitamount'
                })) || 0;

                wip += debit;

                return true;
            });

            log.debug("Final WIP (Debit Only)", wip);

        } catch (e) {
            log.error('WIP Calculation Error', e);
        }

        // ---------------- FORMAT WIP ----------------
        wip = parseFloat(wip).toFixed(2);

        // ---------------- ADD INLINE HTML ----------------
        var htmlField = form.addField({
            id: 'custpage_summary_tiles',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Summary'
        });

        htmlField.updateLayoutType({
            layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE
        });

        // ---------------- UI ----------------
        htmlField.defaultValue =
            '<div style="width:100vw; margin-left:-20px; display:flex; gap:20px; padding:10px 20px;">' +

                '<div style="flex:1; padding:15px; border:1px solid #ccc; border-radius:10px; background:#f8f8f8; text-align:center;">' +
                    '<div style="font-size:20px; font-weight:bold;">AED ' + contractValue + '</div>' +
                    '<div style="font-size:12px; color:#666;">Contract Value</div>' +
                '</div>' +

                '<div style="flex:1; padding:15px; border:1px solid #ccc; border-radius:10px; background:#f8f8f8; text-align:center;">' +
                    '<div style="font-size:20px; font-weight:bold; color:#f57c00;">AED ' + wip + '</div>' +
                    '<div style="font-size:12px; color:#666;">WIP Accumulated</div>' +
                '</div>' +

                '<div style="flex:1; padding:15px; border:1px solid #ccc; border-radius:10px; background:#f8f8f8; text-align:center;">' +
                    '<div style="font-size:20px; font-weight:bold;">AED ' + budget + '</div>' +
                    '<div style="font-size:12px; color:#666;">Budget</div>' +
                '</div>' +

                '<div style="flex:1; padding:15px; border:1px solid #ccc; border-radius:10px; background:#f8f8f8; text-align:center;">' +
                    '<div style="font-size:20px; font-weight:bold; color:#d32f2f;">' + subJobs + ' Open</div>' +
                    '<div style="font-size:12px; color:#666;">Sub Jobs</div>' +
                '</div>' +

            '</div>';
    }

    return {
        beforeLoad: beforeLoad
    };

});