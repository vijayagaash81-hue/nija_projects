/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * 
 * Script Name: Serial Number Assignment CS
 * Description: Client Script attached to target records (Transaction / Custom Records).
 *              Fires on CREATE and EDIT modes to dynamically assign and re-index 
 *              sequential line serial numbers (1, 2, 3...) when lines are added, edited, or deleted.
 */
define(['N/search', 'N/currentRecord'], (search, currentRecord) => {

    let isRecalculating = false;
    let configsCache = null;

    /**
     * Searches customrecord_serial_no to retrieve sublist & field configuration for current record type.
     * 
     * @param {string} recordType 
     * @returns {Array<{sublistId: string, serialNoField: string}>}
     */
    function getSerialNoConfigs(recordType) {
        if (configsCache !== null) return configsCache;
        configsCache = [];
        try {
            if (!recordType) return configsCache;

            const serialNoSearch = search.create({
                type: 'customrecord_serial_no',
                filters: [
                    ['custrecord_record_type', 'is', recordType]
                ],
                columns: ['custrecord_sublist_id', 'custrecord_serial_no_field']
            });

            serialNoSearch.run().each(result => {
                const sublistId = result.getValue({ name: 'custrecord_sublist_id' }) || '';
                const serialNoField = result.getValue({ name: 'custrecord_serial_no_field' }) || '';

                if (serialNoField) {
                    configsCache.push({
                        sublistId: sublistId.trim(),
                        serialNoField: serialNoField.trim()
                    });
                }
                return true;
            });
        } catch (e) {
            console.error('Error fetching Serial No configs:', e);
        }
        return configsCache;
    }

    /**
     * Recalculates line numbers (1, 2, 3...) for the configured sublist across all lines.
     * 
     * @param {Record} rec 
     * @param {string} sublistId 
     * @param {string} serialNoField 
     */
    function recalculateSerials(rec, sublistId, serialNoField) {
        if (isRecalculating) return;
        isRecalculating = true;
        try {
            const lineCount = rec.getLineCount({ sublistId: sublistId });
            for (let i = 0; i < lineCount; i++) {
                const currentSerial = parseInt(rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: serialNoField,
                    line: i
                }), 10);
                const expectedSerial = i + 1;

                if (isNaN(currentSerial) || currentSerial !== expectedSerial) {
                    rec.selectLine({ sublistId: sublistId, line: i });
                    rec.setCurrentSublistValue({
                        sublistId: sublistId,
                        fieldId: serialNoField,
                        value: expectedSerial,
                        ignoreFieldChange: true
                    });
                    rec.commitLine({ sublistId: sublistId });
                }
            }
        } catch (e) {
            console.error('Error recalculating line serial numbers:', e);
        } finally {
            isRecalculating = false;
        }
    }

    /**
     * Page initialization entry point.
     * @param {Object} context 
     */
    function pageInit(context) {
        try {
            const rec = context.currentRecord;
            const configs = getSerialNoConfigs(rec.type);

            if (configs && configs.length > 0) {
                configs.forEach(config => {
                    if (config.sublistId) {
                        recalculateSerials(rec, config.sublistId, config.serialNoField);
                    }
                });
            }
        } catch (e) {
            console.error('Error in pageInit:', e);
        }
    }

    /**
     * Validates line entry and sets serial number upon committing a line.
     * @param {Object} context 
     * @returns {boolean}
     */
    function validateLine(context) {
        if (isRecalculating) return true;
        try {
            const rec = context.currentRecord;
            const configs = getSerialNoConfigs(rec.type);

            configs.forEach(config => {
                if (config.sublistId && config.sublistId === context.sublistId) {
                    const currentLine = rec.getCurrentSublistIndex({ sublistId: context.sublistId });
                    
                    // Directly assign index + 1 to active line
                    rec.setCurrentSublistValue({
                        sublistId: context.sublistId,
                        fieldId: config.serialNoField,
                        value: currentLine + 1,
                        ignoreFieldChange: true
                    });

                    // Defer re-indexing to ensure all lines remain in sync
                    setTimeout(() => {
                        const activeRec = currentRecord.get();
                        recalculateSerials(activeRec, config.sublistId, config.serialNoField);
                    }, 100);
                }
            });
        } catch (e) {
            console.error('Error in validateLine:', e);
        }
        return true;
    }

    /**
     * Validates line deletion and re-indexes remaining line numbers.
     * @param {Object} context 
     * @returns {boolean}
     */
    function validateDelete(context) {
        if (isRecalculating) return true;
        try {
            const rec = context.currentRecord;
            const configs = getSerialNoConfigs(rec.type);

            configs.forEach(config => {
                if (config.sublistId && config.sublistId === context.sublistId) {
                    // Defer re-indexing until line is removed from sublist
                    setTimeout(() => {
                        const activeRec = currentRecord.get();
                        recalculateSerials(activeRec, config.sublistId, config.serialNoField);
                    }, 100);
                }
            });
        } catch (e) {
            console.error('Error in validateDelete:', e);
        }
        return true;
    }

    /**
     * Re-indexes lines one final time before saving record.
     * @param {Object} context 
     * @returns {boolean}
     */
    function saveRecord(context) {
        try {
            const rec = context.currentRecord;
            const configs = getSerialNoConfigs(rec.type);

            if (configs && configs.length > 0) {
                configs.forEach(config => {
                    if (config.sublistId) {
                        recalculateSerials(rec, config.sublistId, config.serialNoField);
                    }
                });
            }
        } catch (e) {
            console.error('Error in saveRecord:', e);
        }
        return true;
    }

    return {
        pageInit: pageInit,
        validateLine: validateLine,
        validateDelete: validateDelete,
        saveRecord: saveRecord
    };
});
