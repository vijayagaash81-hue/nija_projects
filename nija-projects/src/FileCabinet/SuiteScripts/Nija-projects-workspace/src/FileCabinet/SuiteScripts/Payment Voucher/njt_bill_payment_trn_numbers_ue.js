/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Script Name: njt_bill_payment_trn_numbers_ue.js
 * Description: Populates custbody_billtrnno field on Bill Payment (vendorpayment) record
 *              with an array of objects mapping Bill internal IDs to their transaction numbers:
 *              [ { "internalid": "transactionnumber" }, ... ]
 */
define(['N/record', 'N/search', 'N/log'], (record, search, log) => {

    /**
     * Executes before the record is loaded.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - Current record
     * @param {string} scriptContext.type - Trigger type (e.g. view, edit, create)
     * @param {Form} scriptContext.form - Current form object
     */
    const beforeLoad = (scriptContext) => {
        try {
            const { newRecord, form, type, UserEventType } = scriptContext;

            // Do not execute on delete
            if (type === UserEventType.DELETE) {
                return;
            }

            log.debug('beforeLoad', `Trigger: ${type} | Record ID: ${newRecord.id || 'New'}`);

            populateBillTransactionNumbers(newRecord, form, type);

        } catch (error) {
            log.error('Error in beforeLoad', error);
        }
    };

    /**
     * Executes before the record is saved to ensure the field value is committed to the database.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - Current record being saved
     * @param {string} scriptContext.type - Trigger type (e.g. create, edit)
     */
    const beforeSubmit = (scriptContext) => {
        try {
            const { newRecord, type, UserEventType } = scriptContext;

            if (type === UserEventType.DELETE) {
                return;
            }

            log.debug('beforeSubmit', `Trigger: ${type} | Record ID: ${newRecord.id || 'New'}`);

            populateBillTransactionNumbers(newRecord, null, type);

        } catch (error) {
            log.error('Error in beforeSubmit', error);
        }
    };

    /**
     * Reads all bills from the 'apply' sublist, fetches their transaction numbers,
     * formats the result as an array of key-value objects, and sets 'custbody_billtrnno'.
     *
     * @param {Record} newRecord - Current record
     * @param {Form} [form] - Current form (optional, available in beforeLoad)
     * @param {string} [type] - Trigger type (e.g. 'view', 'edit')
     */
    const populateBillTransactionNumbers = (newRecord, form, type) => {
        const sublistId = 'apply';
        const lineCount = newRecord.getLineCount({ sublistId });

        log.debug('populateBillTransactionNumbers', `Apply sublist line count: ${lineCount}`);

        if (lineCount <= 0) {
            setFieldValue(newRecord, form, JSON.stringify([]), type);
            return;
        }

        // Collect bill internal IDs and refnums from all lines (checked or unchecked)
        const linesData = [];
        const uniqueBillIds = new Set();

        for (let i = 0; i < lineCount; i++) {
            const billId = newRecord.getSublistValue({ sublistId, fieldId: 'doc', line: i })
                        || newRecord.getSublistValue({ sublistId, fieldId: 'internalid', line: i });

            const refnum = newRecord.getSublistValue({ sublistId, fieldId: 'refnum', line: i }) || '';

            if (billId) {
                const idStr = String(billId);
                linesData.push({
                    line: i,
                    billId: idStr,
                    refnum: String(refnum)
                });
                uniqueBillIds.add(idStr);
            }
        }

        const billIdsArray = Array.from(uniqueBillIds);
        log.debug('Bill IDs Found', billIdsArray);

        if (billIdsArray.length === 0) {
            setFieldValue(newRecord, form, JSON.stringify([]), type);
            return;
        }

        // Fetch transactionnumber for all collected bill IDs
        const billMap = fetchTransactionNumbers(billIdsArray);

        // Build array of key-value objects: [ { [internalid]: transactionnumber }, ... ]
        const tranNumbers = [];
        const processedBillIds = new Set();

        for (const line of linesData) {
            if (processedBillIds.has(line.billId)) {
                continue; // Avoid duplicate bill entries in output array
            }
            processedBillIds.add(line.billId);

            // Prefer fetched transactionnumber; fallback to tranid / refnum if blank
            const tranNumber = billMap[line.billId] || line.refnum || '';

            tranNumbers.push({
                [line.billId]: tranNumber
            });
        }

        const jsonString = JSON.stringify(tranNumbers);
        log.debug('Result JSON for custbody_billtrnno', jsonString);

        setFieldValue(newRecord, form, jsonString, type);
    };

    /**
     * Efficiently retrieves transactionnumber / tranid for a list of transaction IDs using search.
     * Handles batching up to 1000 IDs per query.
     *
     * @param {string[]} billIds
     * @returns {Object.<string, string>} Mapping of billId -> transactionnumber
     */
    const fetchTransactionNumbers = (billIds) => {
        const billMap = {};
        const BATCH_SIZE = 1000;

        for (let i = 0; i < billIds.length; i += BATCH_SIZE) {
            const batch = billIds.slice(i, i + BATCH_SIZE);

            try {
                const billSearch = search.create({
                    type: search.Type.TRANSACTION,
                    filters: [
                        ['internalid', 'anyof', batch],
                        'AND',
                        ['mainline', 'is', 'T']
                    ],
                    columns: [
                        search.createColumn({ name: 'internalid' }),
                        search.createColumn({ name: 'transactionnumber' }),
                        search.createColumn({ name: 'tranid' })
                    ]
                });

                const pagedData = billSearch.runPaged({ pageSize: 1000 });
                pagedData.pageRanges.forEach(pageRange => {
                    const page = pagedData.fetch({ index: pageRange.index });
                    page.data.forEach(result => {
                        const id = String(result.id);
                        const tranNum = result.getValue({ name: 'transactionnumber' })
                                     || result.getValue({ name: 'tranid' })
                                     || '';
                        billMap[id] = tranNum;
                    });
                });

            } catch (searchError) {
                log.error('Batch Search Error, falling back to lookupFields', searchError);

                // Fallback: Individual lookup if batch transaction search fails
                for (const singleId of batch) {
                    if (!billMap[singleId]) {
                        try {
                            const lookup = search.lookupFields({
                                type: search.Type.TRANSACTION,
                                id: singleId,
                                columns: ['transactionnumber', 'tranid']
                            });
                            billMap[singleId] = lookup.transactionnumber || lookup.tranid || '';
                        } catch (lookupErr) {
                            log.error(`Lookup failed for transaction ID: ${singleId}`, lookupErr);
                        }
                    }
                }
            }
        }

        return billMap;
    };

    /**
     * Sets value on the record, form UI field, and commits to database via submitFields (in VIEW mode).
     *
     * @param {Record} newRecord
     * @param {Form} [form]
     * @param {string} value
     * @param {string} [type] - Trigger type (e.g. 'view')
     */
    const setFieldValue = (newRecord, form, value, type) => {
        const fieldId = 'custbody_billtrnno';

        // 1. Set on newRecord instance (effective in beforeSubmit / edit / create)
        try {
            newRecord.setValue({
                fieldId,
                value
            });
        } catch (recErr) {
            log.debug('newRecord.setValue note', recErr.message);
        }

        // 2. Set on Form UI field (ensures immediate display in the browser during VIEW/EDIT mode)
        try {
            if (form) {
                const formField = form.getField({ id: fieldId });
                if (formField) {
                    formField.defaultValue = value;
                }
            }
        } catch (formErr) {
            log.debug('form.getField note', formErr.message);
        }

        // 3. In VIEW mode, persist directly to the database using record.submitFields
        if (type === 'view' && newRecord.id) {
            try {
                const currentDbValue = newRecord.getValue({ fieldId }) || '';
                // Only submit if the value is empty or has changed to avoid unnecessary DB writes on every page view
                if (currentDbValue !== value) {
                    record.submitFields({
                        type: newRecord.type,
                        id: newRecord.id,
                        values: {
                            [fieldId]: value
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                    log.audit('record.submitFields', `Successfully saved ${fieldId} to database for record ID: ${newRecord.id}`);
                } else {
                    log.debug('record.submitFields', `Field ${fieldId} is already up-to-date in database for record ID: ${newRecord.id}`);
                }
            } catch (submitErr) {
                log.error('record.submitFields Error', submitErr);
            }
        }
    };

    return {
        beforeLoad,
        beforeSubmit
    };
});
