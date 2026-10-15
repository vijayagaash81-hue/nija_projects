/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

/*
 * NetSuite Daily Transaction Report
 *
 * Flow:
 *
 * getInputData()
 *      ↓
 * Today's transactions grouped by transaction type
 *      ↓
 * map()
 *      ↓
 * type -> count
 *      ↓
 * reduce()
 *      ↓
 * final transaction summary
 *      ↓
 * summarize()
 *      ↓
 * Google Apps Script
 */

define([
    'N/search',
    'N/https',
    'N/log'
], function (search, https, log) {

    /*
     * ---------------------------------------------------------
     * CONFIGURATION
     * ---------------------------------------------------------
     */

    const GOOGLE_APPS_SCRIPT_URL =
        'https://script.google.com/macros/s/AKfycbwdceGO_z4a86B5kY2N2_sM8__E8yIyV-lcYiqhzQGid3e6Q4m4kUfTg0qFpTK_hbRVTQ/exec';


    /*
     * ---------------------------------------------------------
     * GET INPUT DATA
     * ---------------------------------------------------------
     *
     * Search transactions till date (on or before today).
     *
     * mainline = T
     *
     * This means one result per transaction instead of
     * getting every transaction line.
     *
     * We group the search by transaction type and count
     * internal IDs.
     *
     * Example:
     *
     * Sales Order      120
     * Invoice           85
     * Cash Sale         42
     * Purchase Order    67
     *
     */

    function getInputData() {

        try {

            const transactionSearch = search.create({

                type: search.Type.TRANSACTION,

                filters: [
                    ['mainline', 'is', 'T'],
                    'AND',
                    ['trandate', 'onorbefore', 'today']
                ],

                columns: [

                    search.createColumn({
                        name: 'type',
                        summary: search.Summary.GROUP,
                        label: 'Transaction Type'
                    }),

                    search.createColumn({
                        name: 'internalid',
                        summary: search.Summary.COUNT,
                        label: 'Transaction Count'
                    })
                ]
            });

            log.audit({
                title: 'Transaction Search',
                details: 'Transaction search till date created successfully'
            });

            return transactionSearch;

        } catch (e) {

            log.error({
                title: 'getInputData Error',
                details: e.name + ': ' + e.message
            });

            throw e;
        }
    }


    /*
     * ---------------------------------------------------------
     * MAP
     * ---------------------------------------------------------
     *
     * Each grouped search result comes here.
     *
     * We convert:
     *
     * Transaction Type → Count
     *
     * into:
     *
     * key   = Transaction Type
     * value = Count
     *
     */

    function map(context) {

        try {

            const result = JSON.parse(context.value);
            const values = result.values || {};

            /*
             * Depending on search result serialization,
             * type column with summary GROUP can be represented as:
             * - values['GROUP(type)'] ({ value: '...', text: '...' })
             * - values.type
             */

            let transactionType = '';

            const typeProp = values['GROUP(type)'] || values.type;

            if (typeProp) {
                if (typeof typeProp === 'object' && typeProp.text) {
                    transactionType = typeProp.text;
                } else if (typeof typeProp === 'object' && typeProp.value) {
                    transactionType = typeProp.value;
                } else if (typeof typeProp === 'string') {
                    transactionType = typeProp;
                }
            } else {
                /*
                 * Fallback search across keys for any key containing 'type'
                 */
                Object.keys(values).forEach(function (key) {
                    if (key.toLowerCase().indexOf('type') !== -1 && !transactionType) {
                        const val = values[key];
                        if (typeof val === 'object' && val.text) {
                            transactionType = val.text;
                        } else if (typeof val === 'object' && val.value) {
                            transactionType = val.value;
                        } else if (typeof val === 'string') {
                            transactionType = val;
                        }
                    }
                });
            }

            /*
             * Count column.
             */

            let count = 0;

            if (values['COUNT(internalid)'] !== undefined) {
                count = Number(values['COUNT(internalid)']) || 0;
            } else {
                /*
                 * Fallback: find the count value
                 * from the serialized result.
                 */
                Object.keys(values).forEach(function (key) {
                    if (key.toLowerCase().indexOf('count') !== -1) {
                        const possibleCount = Number(values[key]);
                        if (!isNaN(possibleCount)) {
                            count = possibleCount;
                        }
                    }
                });
            }


            /*
             * Make sure we have valid data.
             */

            if (!transactionType) {

                log.debug({
                    title: 'Skipping Result',
                    details: JSON.stringify(result)
                });

                return;
            }


            /*
             * Write:
             *
             * key   = Invoice
             * value = 85
             */

            context.write({
                key: transactionType,
                value: count
            });


            log.debug({
                title: 'Map Result',
                details:
                    transactionType +
                    ' = ' +
                    count
            });

        } catch (e) {

            log.error({
                title: 'Map Error',
                details:
                    e.name +
                    ': ' +
                    e.message +
                    ' | Context: ' +
                    context.value
            });
        }
    }


    /*
     * ---------------------------------------------------------
     * REDUCE
     * ---------------------------------------------------------
     *
     * If the same transaction type appears multiple times,
     * reduce combines the values.
     *
     * Example:
     *
     * Invoice:
     *
     * 50
     * 20
     * 15
     *
     * becomes:
     *
     * Invoice = 85
     *
     */

    function reduce(context) {

        try {

            let total = 0;

            context.values.forEach(function (value) {

                total += Number(value) || 0;

            });


            /*
             * Write the final result.
             */

            context.write({
                key: context.key,
                value: total
            });


            log.debug({
                title: 'Reduce Result',
                details:
                    context.key +
                    ' = ' +
                    total
            });

        } catch (e) {

            log.error({
                title: 'Reduce Error',
                details:
                    e.name +
                    ': ' +
                    e.message
            });
        }
    }


    /*
     * ---------------------------------------------------------
     * SUMMARIZE
     * ---------------------------------------------------------
     *
     * This runs after Map and Reduce are complete.
     *
     * We collect the final results and send them to
     * Google Apps Script.
     *
     */

    function summarize(summary) {

        try {

            /*
             * -------------------------------------------------
             * Check Map Errors
             * -------------------------------------------------
             */

            if (summary.mapSummary.errors) {

                summary.mapSummary.errors.iterator().each(
                    function (key, error) {

                        log.error({
                            title: 'Map Error: ' + key,
                            details: error
                        });

                        return true;
                    }
                );
            }


            /*
             * -------------------------------------------------
             * Check Reduce Errors
             * -------------------------------------------------
             */

            if (summary.reduceSummary.errors) {

                summary.reduceSummary.errors.iterator().each(
                    function (key, error) {

                        log.error({
                            title: 'Reduce Error: ' + key,
                            details: error
                        });

                        return true;
                    }
                );
            }


            /*
             * -------------------------------------------------
             * Collect Final Results
             * -------------------------------------------------
             */

            const transactions = [];

            summary.output.iterator().each(
                function (key, value) {

                    transactions.push({

                        type: key,

                        count: Number(value) || 0

                    });

                    return true;
                }
            );


            /*
             * -------------------------------------------------
             * Today's Date
             * -------------------------------------------------
             *
             * We deliberately generate yyyy-MM-dd ourselves
             * so Google Sheet tab names are consistent.
             *
             */

            const now = new Date();

            const year =
                now.getFullYear();

            const month =
                String(
                    now.getMonth() + 1
                ).padStart(2, '0');

            const day =
                String(
                    now.getDate()
                ).padStart(2, '0');

            const reportDate =
                year +
                '-' +
                month +
                '-' +
                day;


            /*
             * -------------------------------------------------
             * Payload
             * -------------------------------------------------
             */

            const payload = {

                date: reportDate,

                transactions: transactions

            };


            /*
             * Log payload for testing.
             */

            log.audit({

                title: 'Google Report Payload',

                details:
                    JSON.stringify(payload)

            });


            /*
             * -------------------------------------------------
             * Send to Google Apps Script
             * -------------------------------------------------
             */

            const response = https.post({

                url: GOOGLE_APPS_SCRIPT_URL,

                headers: {

                    'Content-Type':
                        'application/json'

                },

                body:
                    JSON.stringify(payload)

            });


            /*
             * -------------------------------------------------
             * Google Response
             * -------------------------------------------------
             */

            log.audit({

                title: 'Google Apps Script Response',

                details:
                    'HTTP Code: ' +
                    response.code +
                    '\nResponse: ' +
                    response.body

            });


            /*
             * -------------------------------------------------
             * Final Summary Log
             * -------------------------------------------------
             */

            log.audit({

                title: 'Daily Report Completed',

                details:
                    'Date: ' +
                    reportDate +
                    '\nTransaction Types: ' +
                    transactions.length +
                    '\nGoogle Status: ' +
                    response.code

            });


        } catch (e) {

            log.error({

                title:
                    'Summarize Error',

                details:
                    e.name +
                    ': ' +
                    e.message

            });

            throw e;
        }
    }


    /*
     * ---------------------------------------------------------
     * RETURN ENTRY POINTS
     * ---------------------------------------------------------
     */

    return {

        getInputData:
            getInputData,

        map:
            map,

        reduce:
            reduce,

        summarize:
            summarize

    };

});
