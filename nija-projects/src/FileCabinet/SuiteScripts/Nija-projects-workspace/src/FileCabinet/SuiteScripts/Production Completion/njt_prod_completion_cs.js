/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/log', 'N/search'], (url, log, search) => {

    const SUBLIST_ID = 'recmachcustrecord_production_completion';
    const ICON_FIELD_ID = 'custrecord_njt_pc_inv_detail_icon';
    const JSON_FIELD_ID = 'custrecord_njt_pc_inv_detail_json';
    const LOT_FIELD_ID = 'custrecord_heatlot_no';
    const QTY_FIELD_ID = 'custrecord_quantity';
    const LOCATION_FIELD_ID = 'custrecord_location_pc';
    const ITEM_FIELD_ID = 'custrecord_item';

    let nsRecord = null;

    const getSubsidiaryId = (currRec) => {
        try {
            const workOrderId = currRec.getValue('custrecord_work_order');
            console.log('getSubsidiaryId: workOrderId =', workOrderId);
            if (workOrderId) {
                const lookup = search.lookupFields({
                    type: 'customrecord_njt_product_order',
                    id: workOrderId,
                    columns: ['custrecord_njt_subsidiar']
                });
                console.log('getSubsidiaryId: lookup result =', JSON.stringify(lookup));
                if (lookup && lookup.custrecord_njt_subsidiar) {
                    const subVal = lookup.custrecord_njt_subsidiar;
                    if (Array.isArray(subVal) && subVal.length > 0) {
                        return subVal[0].value;
                    } else if (subVal.value) {
                        return subVal.value;
                    } else {
                        return subVal;
                    }
                }
            }
        } catch (e) {
            console.error('Error fetching subsidiary from work order lookup', e);
        }
        return '';
    };

    const updateLocationOptions = (currRec, itemId) => {
        console.log('updateLocationOptions: filtering by subsidiary only');
        try {
            const line = currRec.getCurrentSublistIndex({ sublistId: SUBLIST_ID });
            const locationField = currRec.getSublistField({
                sublistId: SUBLIST_ID,
                fieldId: 'custpage_location_pc_ui',
                line: line
            });
            if (!locationField) {
                console.log('updateLocationOptions: locationField is not available on line', line);
                return;
            }

            locationField.removeSelectOption({ value: null });
            locationField.insertSelectOption({ value: '', text: ' ' });

            const subsidiaryId = getSubsidiaryId(currRec);
            console.log('updateLocationOptions: resolved subsidiaryId =', subsidiaryId);
            const filters = [
                ['isinactive', 'is', 'F']
            ];
            if (subsidiaryId) {
                filters.push('AND', ['subsidiary', 'anyof', [subsidiaryId]]);
            }

            const locSearch = search.create({
                type: 'location',
                filters: filters,
                columns: ['name']
            });
            const results = [];
            locSearch.run().each((result) => {
                results.push({
                    id: result.id,
                    name: result.getValue('name')
                });
                return true;
            });

            console.log('updateLocationOptions: final locations found =', results);

            results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            results.forEach(res => {
                locationField.insertSelectOption({
                    value: String(res.id),
                    text: res.name
                });
            });
        } catch (e) {
            console.error('Error updating location options', e);
        }
    };

    const updateBinOptions = (currRec, locationId, selectedBinId) => {
        console.log('updateBinOptions: locationId =', locationId);
        try {
            const line = currRec.getCurrentSublistIndex({ sublistId: SUBLIST_ID });
            const binField = currRec.getSublistField({
                sublistId: SUBLIST_ID,
                fieldId: 'custpage_bin_pc_ui',
                line: line
            });
            if (!binField) {
                console.log('updateBinOptions: binField is not available on line', line);
                return;
            }

            binField.removeSelectOption({ value: null });
            binField.insertSelectOption({ value: '', text: ' ' });

            if (!locationId || String(locationId).trim() === '') return;

            let results = [];

            // Query bins directly for the selected location
            try {
                const binSearch = search.create({
                    type: 'bin',
                    filters: [
                        ['location', 'anyof', [locationId]],
                        'AND',
                        ['inactive', 'is', 'F']
                    ],
                    columns: ['binnumber']
                });
                binSearch.run().each((result) => {
                    results.push({
                        id: result.id,
                        name: result.getValue('binnumber')
                    });
                    return true;
                });
            } catch (err) {
                console.error('Direct bin search failed:', err.name, err.message);
            }

            console.log('updateBinOptions final bins =', results);

            // Populate select options
            results.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            results.forEach(res => {
                binField.insertSelectOption({
                    value: String(res.id),
                    text: res.name
                });
            });

            // Set selected value if applicable
            if (selectedBinId) {
                currRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custpage_bin_pc_ui',
                    value: String(selectedBinId),
                    ignoreFieldChange: true
                });
            }

        } catch (e) {
            console.error('Error updating bin options', e);
        }
    };

    const pageInit = (scriptContext) => {
        nsRecord = scriptContext.currentRecord;
        console.log('pageInit triggered');
        window.triggerInventoryDetailPopup = triggerInventoryDetailPopup;
    };

    const lineInit = (scriptContext) => {
        const currentRecord = scriptContext.currentRecord;
        const sublistId = scriptContext.sublistId;

        if (sublistId === SUBLIST_ID) {
            const line = currentRecord.getCurrentSublistIndex({ sublistId: SUBLIST_ID });
            const jsonVal = currentRecord.getCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: JSON_FIELD_ID
            });

            // Set the HTML value first
            currentRecord.setCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: ICON_FIELD_ID,
                value: getIconHtml(line, jsonVal),
                ignoreFieldChange: true
            });

            // Disable it after setting the value
            try {
                const iconField = currentRecord.getSublistField({
                    sublistId: SUBLIST_ID,
                    fieldId: ICON_FIELD_ID
                });
                if (iconField) {
                    iconField.isDisabled = true;
                }
            } catch (err) {
                console.error('Error disabling icon field', err);
            }

            // Location/Bin custom fields UI update
            const itemId = currentRecord.getCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: 'custrecord_item'
            });
            const locationId = currentRecord.getCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: 'custrecord_location_pc'
            });
            const binId = currentRecord.getCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: 'custrecord_bin_pc'
            });

            updateLocationOptions(currentRecord, itemId);
            currentRecord.setCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: 'custpage_location_pc_ui',
                value: locationId || '',
                ignoreFieldChange: true
            });
            if (locationId) {
                updateBinOptions(currentRecord, locationId, binId);
            }
        }
    };

    const validateLine = (scriptContext) => {
        const currentRecord = scriptContext.currentRecord;
        const sublistId = scriptContext.sublistId;

        if (sublistId === SUBLIST_ID) {
            const currentLineQty = parseFloat(currentRecord.getCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: QTY_FIELD_ID
            })) || 0;

            const currentIndex = currentRecord.getCurrentSublistIndex({ sublistId: SUBLIST_ID });
            const lineCount = currentRecord.getLineCount({ sublistId: SUBLIST_ID });
            
            let totalQty = 0;
            for (let i = 0; i < lineCount; i++) {
                if (i !== currentIndex) {
                    const lQty = parseFloat(currentRecord.getSublistValue({
                        sublistId: SUBLIST_ID,
                        fieldId: QTY_FIELD_ID,
                        line: i
                    })) || 0;
                    totalQty += lQty;
                }
            }
            totalQty += currentLineQty;

            // Dynamically set the sum of all line quantities to the parent field
            currentRecord.setValue({
                fieldId: 'custrecord_completion_qty',
                value: totalQty
            });

            const line = currentRecord.getCurrentSublistIndex({ sublistId: SUBLIST_ID });
            const jsonVal = currentRecord.getCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: JSON_FIELD_ID
            });

            currentRecord.setCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: ICON_FIELD_ID,
                value: getIconHtml(line, jsonVal),
                ignoreFieldChange: true
            });

            try {
                const iconField = currentRecord.getSublistField({
                    sublistId: SUBLIST_ID,
                    fieldId: ICON_FIELD_ID
                });
                if (iconField) {
                    iconField.isDisabled = true;
                }
            } catch (err) {
                console.error('Error disabling icon field', err);
            }
        }
        return true;
    };

    const validateDelete = (scriptContext) => {
        const currentRecord = scriptContext.currentRecord;
        const sublistId = scriptContext.sublistId;
        if (sublistId === SUBLIST_ID) {
            const deleteIndex = currentRecord.getCurrentSublistIndex({ sublistId: SUBLIST_ID });
            const lineCount = currentRecord.getLineCount({ sublistId: SUBLIST_ID });
            let totalQty = 0;
            for (let i = 0; i < lineCount; i++) {
                if (i !== deleteIndex) {
                    const lQty = parseFloat(currentRecord.getSublistValue({
                        sublistId: SUBLIST_ID,
                        fieldId: QTY_FIELD_ID,
                        line: i
                    })) || 0;
                    totalQty += lQty;
                }
            }
            currentRecord.setValue({
                fieldId: 'custrecord_completion_qty',
                value: totalQty
            });
        }
        return true;
    };

    const saveRecord = (scriptContext) => {
        const currentRecord = scriptContext.currentRecord;
        const lineCount = currentRecord.getLineCount({ sublistId: SUBLIST_ID });
        
        let totalQty = 0;
        for (let i = 0; i < lineCount; i++) {
            const lQty = parseFloat(currentRecord.getSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: QTY_FIELD_ID,
                line: i
            })) || 0;
            totalQty += lQty;
        }

        currentRecord.setValue({
            fieldId: 'custrecord_completion_qty',
            value: totalQty
        });
        return true;
    };

    const fieldChanged = (scriptContext) => {
        const currentRecord = scriptContext.currentRecord;
        const sublistId = scriptContext.sublistId;
        const fieldId = scriptContext.fieldId;

        if (sublistId === SUBLIST_ID) {
            if (fieldId === ITEM_FIELD_ID) {
                const line = currentRecord.getCurrentSublistIndex({ sublistId: SUBLIST_ID });
                const jsonVal = currentRecord.getCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: JSON_FIELD_ID
                });

                currentRecord.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: ICON_FIELD_ID,
                    value: getIconHtml(line, jsonVal),
                    ignoreFieldChange: true
                });

                try {
                    const iconField = currentRecord.getSublistField({
                        sublistId: SUBLIST_ID,
                        fieldId: ICON_FIELD_ID
                    });
                    if (iconField) {
                        iconField.isDisabled = true;
                    }
                } catch (err) {
                    console.error('Error disabling icon field', err);
                }

                // Location/Bin custom fields UI update
                currentRecord.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custpage_location_pc_ui',
                    value: '',
                    ignoreFieldChange: true
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_location_pc',
                    value: '',
                    ignoreFieldChange: true
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custpage_bin_pc_ui',
                    value: '',
                    ignoreFieldChange: true
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_bin_pc',
                    value: '',
                    ignoreFieldChange: true
                });

                const itemId = currentRecord.getCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_item'
                });
                updateLocationOptions(currentRecord, itemId);
            } else if (fieldId === 'custpage_location_pc_ui') {
                const locationId = currentRecord.getCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custpage_location_pc_ui'
                });

                currentRecord.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_location_pc',
                    value: locationId,
                    ignoreFieldChange: true
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custpage_bin_pc_ui',
                    value: '',
                    ignoreFieldChange: true
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_bin_pc',
                    value: '',
                    ignoreFieldChange: true
                });

                updateBinOptions(currentRecord, locationId);
            } else if (fieldId === 'custpage_bin_pc_ui') {
                const binId = currentRecord.getCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custpage_bin_pc_ui'
                });

                currentRecord.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_bin_pc',
                    value: binId,
                    ignoreFieldChange: true
                });
            }
        }
    };

    /**
     * Entrypoint triggered by the sublist toolbar button
     */
    const triggerInventoryDetailPopup = () => {
        try {
            const line = nsRecord.getCurrentSublistIndex({ sublistId: SUBLIST_ID });
            console.log('triggerInventoryDetailPopup line index:', line);
            if (line < 0) {
                alert('Please select a line first.');
                return;
            }
            openInventoryDetailPopup(line);
        } catch (err) {
            console.error('Error in triggerInventoryDetailPopup', err);
        }
    };

    /**
     * Opens the Suitelet custom inventory detail pop-up in an inline modal dialog
     */
    function openInventoryDetailPopup(line) {
        try {
            const activeLine = nsRecord.getCurrentSublistIndex({ sublistId: SUBLIST_ID });
            let itemVal, locationVal, qtyVal, lotVal, detailsVal, itemName, locationName;

            if (activeLine === Number(line)) {
                itemVal = nsRecord.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: ITEM_FIELD_ID });
                locationVal = nsRecord.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: LOCATION_FIELD_ID });
                qtyVal = nsRecord.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: QTY_FIELD_ID });
                lotVal = nsRecord.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: LOT_FIELD_ID });
                detailsVal = nsRecord.getCurrentSublistValue({ sublistId: SUBLIST_ID, fieldId: JSON_FIELD_ID });
                itemName = nsRecord.getCurrentSublistText({ sublistId: SUBLIST_ID, fieldId: ITEM_FIELD_ID }) || 'Unknown Item';
                locationName = nsRecord.getCurrentSublistText({ sublistId: SUBLIST_ID, fieldId: LOCATION_FIELD_ID }) || 'Unknown Location';
            } else {
                itemVal = nsRecord.getSublistValue({ sublistId: SUBLIST_ID, fieldId: ITEM_FIELD_ID, line: Number(line) });
                locationVal = nsRecord.getSublistValue({ sublistId: SUBLIST_ID, fieldId: LOCATION_FIELD_ID, line: Number(line) });
                qtyVal = nsRecord.getSublistValue({ sublistId: SUBLIST_ID, fieldId: QTY_FIELD_ID, line: Number(line) });
                lotVal = nsRecord.getSublistValue({ sublistId: SUBLIST_ID, fieldId: LOT_FIELD_ID, line: Number(line) });
                detailsVal = nsRecord.getSublistValue({ sublistId: SUBLIST_ID, fieldId: JSON_FIELD_ID, line: Number(line) });
                itemName = nsRecord.getSublistText({ sublistId: SUBLIST_ID, fieldId: ITEM_FIELD_ID, line: Number(line) }) || 'Unknown Item';
                locationName = nsRecord.getSublistText({ sublistId: SUBLIST_ID, fieldId: LOCATION_FIELD_ID, line: Number(line) }) || 'Unknown Location';
            }

            if (!locationVal) {
                alert('Please select a Location before entering Inventory Details.');
                return;
            }
            if (!qtyVal || Number(qtyVal) <= 0) {
                alert('Please enter a valid Quantity before entering Inventory Details.');
                return;
            }

            // Ensure styles are added
            if (!document.getElementById('pc-modal-styles')) {
                const styleEl = document.createElement('style');
                styleEl.id = 'pc-modal-styles';
                styleEl.innerHTML = `
                    .pc-modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        background-color: rgba(15, 23, 42, 0.6);
                        backdrop-filter: blur(8px);
                        z-index: 99999;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    }
                    .pc-modal-container {
                        background: #ffffff;
                        width: 90%;
                        max-width: 800px;
                        border-radius: 16px;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                        border: 1px solid rgba(226, 232, 240, 0.8);
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                        max-height: 90vh;
                        animation: pcModalFadeIn 0.25s ease-out;
                    }
                    @keyframes pcModalFadeIn {
                        from { opacity: 0; transform: scale(0.95) translateY(10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    .pc-modal-header {
                        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
                        padding: 20px 24px;
                        color: #ffffff;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .pc-modal-header h2 {
                        margin: 0;
                        font-size: 1.25rem;
                        font-weight: 700;
                        letter-spacing: -0.025em;
                        color: #ffffff;
                    }
                    .pc-modal-header p {
                        margin: 4px 0 0 0;
                        font-size: 0.75rem;
                        color: #cbd5e1;
                    }
                    .pc-modal-target-qty-container {
                        text-align: right;
                    }
                    .pc-modal-target-qty-label {
                        font-size: 0.65rem;
                        color: #c7d2fe;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    }
                    .pc-modal-target-qty-value {
                        font-size: 1.75rem;
                        font-weight: 800;
                        color: #ffffff;
                        line-height: 1;
                        margin-top: 2px;
                    }
                    .pc-modal-info-bar {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 16px;
                        padding: 16px 24px;
                        background-color: #f8fafc;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .pc-modal-info-item {
                        display: flex;
                        flex-direction: column;
                    }
                    .pc-modal-info-label {
                        font-size: 0.7rem;
                        font-weight: 600;
                        color: #64748b;
                        text-transform: uppercase;
                        margin-bottom: 4px;
                    }
                    .pc-modal-info-value {
                        font-size: 0.875rem;
                        font-weight: 700;
                        color: #1e293b;
                        word-break: break-all;
                    }
                    .pc-modal-status-badge {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        padding: 4px 10px;
                        border-radius: 9999px;
                        font-size: 0.75rem;
                        font-weight: 700;
                        width: fit-content;
                    }
                    .pc-badge-pending {
                        background-color: #fef3c7;
                        color: #92400e;
                        border: 1px solid #fde68a;
                    }
                    .pc-badge-fully {
                        background-color: #ecfdf5;
                        color: #065f46;
                        border: 1px solid #a7f3d0;
                    }
                    .pc-badge-under {
                        background-color: #fffbeb;
                        color: #92400e;
                        border: 1px solid #fde68a;
                    }
                    .pc-badge-over {
                        background-color: #fef2f2;
                        color: #991b1b;
                        border: 1px solid #fecaca;
                    }
                    .pc-modal-badge-dot {
                        width: 6px;
                        height: 6px;
                        border-radius: 50%;
                    }
                    .pc-badge-pending .pc-modal-badge-dot, .pc-badge-under .pc-modal-badge-dot {
                        background-color: #d97706;
                    }
                    .pc-badge-fully .pc-modal-badge-dot {
                        background-color: #10b981;
                    }
                    .pc-badge-over .pc-modal-badge-dot {
                        background-color: #ef4444;
                    }
                    .pc-modal-body {
                        padding: 24px;
                        overflow-y: auto;
                        flex: 1;
                    }
                    .pc-modal-table {
                        width: 100%;
                        border-collapse: collapse;
                        text-align: left;
                    }
                    .pc-modal-table th {
                        padding-bottom: 12px;
                        border-bottom: 1px solid #e2e8f0;
                        font-size: 0.75rem;
                        font-weight: 600;
                        color: #64748b;
                        text-transform: uppercase;
                    }
                    .pc-modal-table td {
                        padding: 10px 0;
                        border-bottom: 1px solid #f1f5f9;
                        vertical-align: middle;
                    }
                    .pc-modal-input-select, .pc-modal-input-text, .pc-modal-input-number {
                        width: 95%;
                        padding: 8px 12px;
                        border: 1px solid #cbd5e1;
                        border-radius: 8px;
                        font-size: 0.875rem;
                        box-sizing: border-box;
                        transition: all 0.2s;
                        background-color: #ffffff;
                        color: #1e293b;
                    }
                    .pc-modal-input-select:focus, .pc-modal-input-text:focus, .pc-modal-input-number:focus {
                        outline: none;
                        border-color: #6366f1;
                        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
                    }
                    .pc-modal-btn-delete {
                        background: transparent;
                        border: none;
                        cursor: pointer;
                        color: #94a3b8;
                        padding: 6px;
                        border-radius: 6px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                    }
                    .pc-modal-btn-delete:hover {
                        color: #ef4444;
                        background-color: #fee2e2;
                    }
                    .pc-modal-controls {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 20px;
                    }
                    .pc-modal-btn-add {
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        padding: 8px 16px;
                        border: 1px solid #cbd5e1;
                        background-color: #ffffff;
                        color: #334155;
                        border-radius: 8px;
                        font-size: 0.875rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .pc-modal-btn-add:hover {
                        background-color: #f8fafc;
                        border-color: #94a3b8;
                    }
                    .pc-modal-total-allocated-container {
                        text-align: right;
                    }
                    .pc-modal-total-allocated-label {
                        font-size: 0.7rem;
                        color: #64748b;
                        text-transform: uppercase;
                    }
                    .pc-modal-total-allocated-val {
                        font-size: 1.125rem;
                        font-weight: 700;
                        color: #1e293b;
                    }
                    .pc-modal-total-allocated-target {
                        font-size: 0.75rem;
                        color: #94a3b8;
                    }
                    .pc-modal-footer {
                        background-color: #f8fafc;
                        padding: 16px 24px;
                        border-top: 1px solid #e2e8f0;
                        display: flex;
                        justify-content: flex-end;
                        gap: 12px;
                    }
                    .pc-btn-secondary {
                        padding: 10px 18px;
                        background-color: #ffffff;
                        border: 1px solid #e2e8f0;
                        color: #475569;
                        border-radius: 8px;
                        font-size: 0.875rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .pc-btn-secondary:hover {
                        background-color: #f1f5f9;
                    }
                    .pc-btn-primary {
                        padding: 10px 20px;
                        background-color: #0f172a;
                        border: 1px solid #0f172a;
                        color: #ffffff;
                        border-radius: 8px;
                        font-size: 0.875rem;
                        font-weight: 600;
                        cursor: pointer;
                        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                        transition: all 0.2s;
                    }
                    .pc-btn-primary:hover {
                        background-color: #1e1b4b;
                        border-color: #1e1b4b;
                    }
                    .pc-loading-overlay {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 40px;
                        color: #475569;
                    }
                    .pc-spinner {
                        border: 3px solid #f3f3f3;
                        border-top: 3px solid #6366f1;
                        border-radius: 50%;
                        width: 24px;
                        height: 24px;
                        animation: pcSpinner 1s linear infinite;
                        margin-bottom: 12px;
                    }
                    @keyframes pcSpinner {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(styleEl);
            }

            // Create Modal Overlay
            const overlay = document.createElement('div');
            overlay.id = 'pc-inv-detail-modal-overlay';
            overlay.className = 'pc-modal-overlay';
            overlay.innerHTML = `
                <div class="pc-modal-container">
                    <div class="pc-modal-header">
                        <div>
                            <h2>Inventory Detail Assignment</h2>
                            <p>Retrieving bins for location...</p>
                        </div>
                    </div>
                    <div class="pc-loading-overlay">
                        <div class="pc-spinner"></div>
                        <div>Loading available bins...</div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            // Resolve Suitelet URL using script IDs to query bins API
            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript_njt_prod_completion_sl',
                deploymentId: 'customdeploy_njt_prod_completion_sl',
                params: {
                    action: 'getBins',
                    location: locationVal
                }
            });

            // Fetch bins asynchronously
            fetch(suiteletUrl)
                .then(response => response.json())
                .then(bins => {
                    renderModalContent(overlay, line, itemVal, itemName, locationName, qtyVal, lotVal, detailsVal, bins);
                })
                .catch(err => {
                    console.error('Error fetching bins from Suitelet', err);
                    const loadingOverlay = overlay.querySelector('.pc-loading-overlay');
                    if (loadingOverlay) {
                        loadingOverlay.innerHTML = `
                            <div style="color: #ef4444; font-weight: 600; margin-bottom: 12px;">Failed to load bins from server.</div>
                            <button type="button" class="pc-btn-secondary" id="pc-modal-fail-close">Close</button>
                        `;
                        overlay.querySelector('#pc-modal-fail-close').addEventListener('click', () => {
                            overlay.remove();
                        });
                    }
                });

        } catch (e) {
            console.error('Error opening inventory details popup modal', e);
        }
    }

    /**
     * Renders the modal workspace content once the bins are loaded
     */
    function renderModalContent(overlay, line, itemId, itemName, locationName, targetQty, defaultLot, existingDetails, bins) {
        const container = overlay.querySelector('.pc-modal-container');
        
        container.innerHTML = `
            <div class="pc-modal-header">
                <div>
                    <h2>Inventory Detail Assignment</h2>
                    <p>Assign bins, lots, and quantities for Production Completion</p>
                </div>
                <div class="pc-modal-target-qty-container">
                    <span class="pc-modal-target-qty-label">Target Quantity</span>
                    <div class="pc-modal-target-qty-value">${targetQty}</div>
                </div>
            </div>

            <div class="pc-modal-info-bar">
                <div class="pc-modal-info-item">
                    <span class="pc-modal-info-label">Item Name</span>
                    <span class="pc-modal-info-value">${itemName}</span>
                </div>
                <div class="pc-modal-info-item">
                    <span class="pc-modal-info-label">Completion Location</span>
                    <span class="pc-modal-info-value">${locationName}</span>
                </div>
                <div class="pc-modal-info-item">
                    <span class="pc-modal-info-label">Allocation Status</span>
                    <div id="pc-modal-status-badge" class="pc-modal-status-badge pc-badge-pending">
                        <span class="pc-modal-badge-dot"></span>
                        <span class="pc-badge-text">Pending Allocation</span>
                    </div>
                </div>
            </div>

            <div class="pc-modal-body">
                <form id="pc-modal-form" onsubmit="return false;">
                    <table class="pc-modal-table">
                        <thead>
                            <tr>
                                <th style="width: 40%;">Bin Number</th>
                                <th style="width: 35%;">Heat / Lot No</th>
                                <th style="width: 20%;">Quantity</th>
                                <th style="width: 5%; text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="pc-modal-tbody">
                            <!-- Dynamic rows -->
                        </tbody>
                    </table>

                    <div class="pc-modal-controls">
                        <button type="button" id="pc-modal-add-row-btn" class="pc-modal-btn-add">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="width: 16px; height: 16px;">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Add Row
                        </button>
                        
                        <div class="pc-modal-total-allocated-container">
                            <span class="pc-modal-total-allocated-label">Total Allocated</span>
                            <div class="pc-modal-total-allocated-val">
                                <span id="pc-modal-total-allocated-value">0</span>
                                <span class="pc-modal-total-allocated-target">/ ${targetQty}</span>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <div class="pc-modal-footer">
                <button type="button" id="pc-modal-cancel-btn" class="pc-btn-secondary">Cancel</button>
                <button type="button" id="pc-modal-save-btn" class="pc-btn-primary">Save & Close</button>
            </div>
        `;

        const tbody = container.querySelector('#pc-modal-tbody');
        
        function addRow(binId = null, lot = defaultLot, qty = '') {
            const rowId = 'pc_row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            const tr = document.createElement('tr');
            tr.id = rowId;
            
            let binOptions = bins.map(b => 
                `<option value="${b.id}" ${Number(binId) === Number(b.id) ? 'selected' : ''}>${b.name}</option>`
            ).join('');

            const binSelectHtml = bins.length > 0 
                ? `<select name="bin" class="pc-modal-input-select">
                        <option value="">-- Select Bin --</option>
                        ${binOptions}
                   </select>`
                : `<div style="color: #ef4444; font-size: 0.75rem; font-weight: 600; padding: 8px 0;">No active bins for this location</div>`;

            tr.innerHTML = `
                <td>${binSelectHtml}</td>
                <td>
                    <input type="text" name="lot" value="${lot}" class="pc-modal-input-text" placeholder="Enter Lot Number">
                </td>
                <td>
                    <input type="number" name="qty" value="${qty}" step="any" class="pc-modal-input-number" placeholder="Qty">
                </td>
                <td style="text-align: right;">
                    <button type="button" class="pc-modal-btn-delete" title="Delete Row">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" style="width: 18px; height: 18px;">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </td>
            `;

            tbody.appendChild(tr);

            tr.querySelector('.pc-modal-btn-delete').addEventListener('click', () => {
                tr.remove();
                updateTotal();
            });

            tr.querySelector('[name="qty"]').addEventListener('input', updateTotal);
            
            updateTotal();
        }

        function updateTotal() {
            const qtyInputs = tbody.querySelectorAll('[name="qty"]');
            let total = 0;
            qtyInputs.forEach(input => {
                total += parseFloat(input.value) || 0;
            });
            total = Math.round(total * 100000) / 100000;
            
            container.querySelector('#pc-modal-total-allocated-value').innerText = total;

            const badge = container.querySelector('#pc-modal-status-badge');
            const textSpan = badge.querySelector('.pc-badge-text');
            const diff = Math.round((targetQty - total) * 100000) / 100000;

            badge.className = 'pc-modal-status-badge';
            if (diff === 0) {
                badge.classList.add('pc-badge-fully');
                textSpan.innerText = 'Fully Allocated';
            } else if (total > targetQty) {
                badge.classList.add('pc-badge-over');
                textSpan.innerText = `Over Allocated (${Math.round((total - targetQty) * 100000) / 100000} extra)`;
            } else {
                badge.classList.add('pc-badge-under');
                textSpan.innerText = `Under Allocated (${diff} left)`;
            }
        }

        // Populating initial data
        if (existingDetails && existingDetails.trim().length > 2) {
            try {
                const parsed = JSON.parse(existingDetails);
                parsed.forEach(row => addRow(row.binId, row.lot, row.qty));
            } catch (e) {
                console.error('Failed to parse existing details JSON', e);
                addRow(null, defaultLot, targetQty);
            }
        } else {
            addRow(null, defaultLot, targetQty);
        }

        container.querySelector('#pc-modal-add-row-btn').addEventListener('click', () => {
            addRow(null, defaultLot, '');
        });

        container.querySelector('#pc-modal-cancel-btn').addEventListener('click', () => {
            overlay.remove();
        });

        container.querySelector('#pc-modal-save-btn').addEventListener('click', () => {
            const rows = tbody.children;
            const data = [];
            let total = 0;
            let validationFailed = false;

            for (let i = 0; i < rows.length; i++) {
                const tr = rows[i];
                const binSelect = tr.querySelector('[name="bin"]');
                const lotInput = tr.querySelector('[name="lot"]');
                const qtyInput = tr.querySelector('[name="qty"]');

                if (!binSelect || !lotInput || !qtyInput) continue;

                const binId = binSelect.value;
                const binName = binSelect.options[binSelect.selectedIndex]?.text || '';
                const lot = lotInput.value.trim();
                const qty = parseFloat(qtyInput.value) || 0;

                if (!binId) {
                    alert('Please select a Bin for all rows.');
                    validationFailed = true;
                    binSelect.focus();
                    break;
                }
                if (!lot) {
                    alert('Please enter a Lot Number for all rows.');
                    validationFailed = true;
                    lotInput.focus();
                    break;
                }
                if (qty <= 0) {
                    alert('Please enter a positive Quantity for all rows.');
                    validationFailed = true;
                    qtyInput.focus();
                    break;
                }

                data.push({
                    binId: Number(binId),
                    binName: binName,
                    lot: lot,
                    qty: qty
                });
                total += qty;
            }

            if (validationFailed) return;

            if (data.length === 0) {
                alert('Please add at least one inventory detail row.');
                return;
            }

            total = Math.round(total * 100000) / 100000;
            if (total !== targetQty) {
                const diff = Math.abs(targetQty - total);
                const msg = total > targetQty 
                    ? `Total allocated quantity (${total}) exceeds the target quantity (${targetQty}) by ${diff}. Please adjust before saving.`
                    : `Total allocated quantity (${total}) is less than the target quantity (${targetQty}) by ${diff}. Please adjust before saving.`;
                alert(msg);
                return;
            }

            // Callback to parent client script
            window.setInventoryDetails(line, JSON.stringify(data));
            overlay.remove();
        });
    }

    /**
     * Callback function triggered by the Suitelet pop-up to save results
     */
    window.setInventoryDetails = function (line, jsonStr) {
        try {
            console.log('setInventoryDetails called from popup', { line, jsonStr });
            const activeLine = nsRecord.getCurrentSublistIndex({ sublistId: SUBLIST_ID });

            if (activeLine === Number(line)) {
                nsRecord.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: JSON_FIELD_ID,
                    value: jsonStr,
                    ignoreFieldChange: true
                });
                nsRecord.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: ICON_FIELD_ID,
                    value: getIconHtml(line, jsonStr),
                    ignoreFieldChange: true
                });
            } else {
                nsRecord.selectLine({ sublistId: SUBLIST_ID, line: Number(line) });
                nsRecord.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: JSON_FIELD_ID,
                    value: jsonStr,
                    ignoreFieldChange: true
                });
                nsRecord.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: ICON_FIELD_ID,
                    value: getIconHtml(line, jsonStr),
                    ignoreFieldChange: true
                });
                nsRecord.commitLine({ sublistId: SUBLIST_ID });
            }

            // Direct DOM update fallback to visually reflect the change immediately
            if (typeof jQuery !== 'undefined') {
                const tr = jQuery(`tr[id*="row${line}"], tr[id*="row_${line}"]`);
                const cell = tr.find(`td[id*="${ICON_FIELD_ID}"], td[data-field-name="${ICON_FIELD_ID}"]`);
                if (cell.length > 0) {
                    cell.html('<span style="color:#2ecc71; font-weight:bold; font-size:13px; user-select:none;">✅ Configured</span>');
                }
            }
        } catch (err) {
            console.error('Error updating record with details', err);
        }
    };

    /**
     * Generates HTML for the Inventory Detail status icon
     */
    function getIconHtml(line, jsonVal) {
        const hasDetails = !!jsonVal && jsonVal.trim().length > 2;
        return hasDetails 
            ? '<span style="color:#2ecc71; font-weight:bold; font-size:13px; user-select:none;">✅ Configured</span>' 
            : '<span style="color:#e74c3c; font-weight:bold; font-size:13px; user-select:none;">❌ Pending</span>';
    }

    return {
        pageInit: pageInit,
        lineInit: lineInit,
        validateLine: validateLine,
        validateDelete: validateDelete,
        fieldChanged: fieldChanged,
        triggerInventoryDetailPopup: triggerInventoryDetailPopup,
        saveRecord: saveRecord
    };
});
