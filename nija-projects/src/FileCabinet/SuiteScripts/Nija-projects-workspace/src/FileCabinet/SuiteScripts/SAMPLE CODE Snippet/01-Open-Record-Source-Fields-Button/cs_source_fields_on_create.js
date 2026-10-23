/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * 
 * Scenario: Open Record & Source Fields via Button
 * Purpose: Deployed on the TARGET record (e.g., Work Order / Custom Record).
 *          On pageInit in CREATE mode, reads the URL query parameters (customSourceId),
 *          queries/loads data from the SOURCE record, and populates header fields & sublist lines.
 */
define(['N/record', 'N/query', 'N/ui/dialog', 'N/ui/message', 'N/log'], 
(record, query, dialog, message, log) => {

    /**
     * Executes when the page finishes loading or record is initialized.
     * @param {Object} context
     * @param {Record} context.currentRecord - The current form record
     * @param {string} context.mode - The mode in which the record is being loaded ('create', 'edit', 'copy', etc.)
     */
    function pageInit(context) {
        try {
            console.log('[Sourcing CS] Mode:', context.mode);

            // Execute ONLY when creating a new record
            if (context.mode !== 'create') {
                return;
            }

            const currentRec = context.currentRecord;

            // 1. Extract query parameter from window URL
            const urlString = window.location.href;
            const sourceRecId = getUrlParameter('customSourceId', urlString);
            const sourceRecType = getUrlParameter('customSourceType', urlString) || 'customrecord_material_request';

            console.log('[Sourcing CS] Detected Source Record ID:', sourceRecId);

            if (!sourceRecId) {
                // Regular manual creation, no sourcing needed
                return;
            }

            // Show user a pleasant in-progress banner
            const progressBanner = message.create({
                title: 'Auto-Sourcing Active',
                message: `Pre-populating data from Source Record #${sourceRecId}. Please wait...`,
                type: message.Type.INFORMATION
            });
            progressBanner.show();

            // 2. Fetch data from the source record
            // Approach A: Direct record load (clean and full access to sublists)
            // Approach B: SuiteQL query (ultra-fast for large datasets)
            sourceRecordData(currentRec, sourceRecId, sourceRecType);

            // Hide the banner or update to confirmation after a brief pause
            setTimeout(() => {
                progressBanner.hide();
                const successBanner = message.create({
                    title: 'Sourcing Complete',
                    message: `Header fields and items successfully copied from Source #${sourceRecId}.`,
                    type: message.Type.CONFIRMATION
                });
                successBanner.show({ duration: 5000 });
            }, 1000);

        } catch (e) {
            console.error('[Sourcing CS] Error during sourcing:', e);
            dialog.alert({
                title: 'Data Sourcing Error',
                message: 'Failed to source values from source record: ' + (e.message || e)
            });
        }
    }

    /**
     * Loads the source record and copies header & line-level data to target record
     * @param {Record} targetRec - Current record in create mode
     * @param {number|string} sourceId - ID of source record
     * @param {string} sourceType - Record type of source
     */
    function sourceRecordData(targetRec, sourceId, sourceType) {
        const sourceRec = record.load({
            type: sourceType,
            id: sourceId,
            isDynamic: false
        });

        // -------------------------------------------------------------
        // A. SOURCE HEADER FIELDS
        // -------------------------------------------------------------
        const subsidiary = sourceRec.getValue({ fieldId: 'subsidiary' }) || sourceRec.getValue({ fieldId: 'custrecord_mr_subsidiary' });
        const department = sourceRec.getValue({ fieldId: 'department' }) || sourceRec.getValue({ fieldId: 'custrecord_mr_department' });
        const location = sourceRec.getValue({ fieldId: 'location' }) || sourceRec.getValue({ fieldId: 'custrecord_mr_location' });
        const customer = sourceRec.getValue({ fieldId: 'entity' }) || sourceRec.getValue({ fieldId: 'custrecord_mr_customer' });
        const memoText = sourceRec.getValue({ fieldId: 'memo' }) || sourceRec.getValue({ fieldId: 'custrecord_mr_memo' });

        if (subsidiary) {
            targetRec.setValue({ fieldId: 'subsidiary', value: subsidiary, ignoreFieldChange: false });
        }
        if (department) {
            targetRec.setValue({ fieldId: 'department', value: department, ignoreFieldChange: false });
        }
        if (location) {
            targetRec.setValue({ fieldId: 'location', value: location, ignoreFieldChange: false });
        }
        if (customer) {
            targetRec.setValue({ fieldId: 'entity', value: customer, ignoreFieldChange: false });
        }
        if (memoText) {
            targetRec.setValue({
                fieldId: 'memo',
                value: `Created from Source #${sourceId}: ${memoText}`,
                ignoreFieldChange: true
            });
        }

        // Link back to the parent source record for traceability
        try {
            targetRec.setValue({
                fieldId: 'custrecord_parent_source_record',
                value: sourceId,
                ignoreFieldChange: true
            });
        } catch (fErr) {
            console.log('[Sourcing CS] Traceability field custrecord_parent_source_record not on form');
        }

        // -------------------------------------------------------------
        // B. SOURCE LINE ITEMS (SUBLIST)
        // -------------------------------------------------------------
        const sourceSublistId = 'recmachcustrecord_mr_lines'; // or 'item' on standard records
        const targetSublistId = 'item'; // or custom child sublist id

        const lineCount = sourceRec.getLineCount({ sublistId: sourceSublistId });
        console.log(`[Sourcing CS] Found ${lineCount} lines on source sublist ${sourceSublistId}`);

        for (let i = 0; i < lineCount; i++) {
            const itemId = sourceRec.getSublistValue({
                sublistId: sourceSublistId,
                fieldId: 'custrecord_mr_item', // or 'item'
                line: i
            });
            const quantity = sourceRec.getSublistValue({
                sublistId: sourceSublistId,
                fieldId: 'custrecord_mr_quantity', // or 'quantity'
                line: i
            });
            const unitPrice = sourceRec.getSublistValue({
                sublistId: sourceSublistId,
                fieldId: 'custrecord_mr_rate', // or 'rate'
                line: i
            });
            const lineDescription = sourceRec.getSublistValue({
                sublistId: sourceSublistId,
                fieldId: 'custrecord_mr_description', // or 'description'
                line: i
            });

            if (!itemId) continue;

            // In dynamic mode, select new line, set field values, and commit
            targetRec.selectNewLine({ sublistId: targetSublistId });

            targetRec.setCurrentSublistValue({
                sublistId: targetSublistId,
                fieldId: 'item',
                value: itemId,
                ignoreFieldChange: false
            });

            if (quantity) {
                targetRec.setCurrentSublistValue({
                    sublistId: targetSublistId,
                    fieldId: 'quantity',
                    value: quantity,
                    ignoreFieldChange: false
                });
            }

            if (unitPrice) {
                targetRec.setCurrentSublistValue({
                    sublistId: targetSublistId,
                    fieldId: 'rate',
                    value: unitPrice,
                    ignoreFieldChange: false
                });
            }

            if (lineDescription) {
                targetRec.setCurrentSublistValue({
                    sublistId: targetSublistId,
                    fieldId: 'description',
                    value: lineDescription,
                    ignoreFieldChange: true
                });
            }

            targetRec.commitLine({ sublistId: targetSublistId });
        }
    }

    /**
     * Extracts a parameter value from the URL query string
     * @param {string} paramName - Name of the query parameter
     * @param {string} url - Target URL
     * @returns {string|null}
     */
    function getUrlParameter(paramName, url) {
        paramName = paramName.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp('[?&]' + paramName + '(=([^&#]*)|&|#|$)');
        const results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    return {
        pageInit: pageInit
    };
});
