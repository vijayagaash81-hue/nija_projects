/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/record', 'N/search', 'N/url'], (record, search, url) => {

    const SUBLIST_ID = 'recmachcustrecord_production_completion';
    const QTY_FIELD_ID = 'custrecord_quantity';
    let isPageInitActive = false;

    const pageInit = (scriptContext) => {
        isPageInitActive = true;
        try {
            if (scriptContext.mode === 'create'){
              const currRec = scriptContext.currentRecord;

              if (typeof window !== 'undefined' && window.location) {
                const urlParams = new URLSearchParams(window.location.search);
                const workOrderid= urlParams.get('workOrderid');
                if (workOrderid){
                  currRec.setValue({
                    fieldId:'custrecord_work_order',
                    value: workOrderid
                  });

                  try {
                    const prodOrderRec = record.load({
                      type: 'customrecord_njt_product_order',
                      id: workOrderid
                    });
                    const projCode= prodOrderRec.getValue({
                        fieldId:'custrecord_njt_project_2'
                    });
                    currRec.setValue({
                        fieldId:'custrecord_project_code',
                        value: projCode
                    });
                    /*
                    const lineCount = prodOrderRec.getLineCount({
                      sublistId: 'recmachcustrecord_njt_pro_2'
                    });
                    for (let i = 0; i < lineCount; i++) {
                      const itemId = prodOrderRec.getSublistValue({
                        sublistId: 'recmachcustrecord_njt_pro_2',
                        fieldId: 'custrecord_njt_itm_code',
                        line: i
                      });
                      if (itemId) {
                        currRec.selectNewLine({
                          sublistId: SUBLIST_ID
                        });
                        currRec.setCurrentSublistValue({
                          sublistId: SUBLIST_ID,
                          fieldId: 'custrecord_item',
                          value: itemId
                        });
                        currRec.commitLine({
                          sublistId: SUBLIST_ID
                        });
                      }
                    }
                    */
                  } catch (e) {
                    console.error('Error fetching production order sublist values', e);
                  }
                }
              }
            }
        } finally {
            isPageInitActive = false;
        }
    };

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

    const fieldChanged = (scriptContext) => {
        const currRec = scriptContext.currentRecord;
        const sublistId = scriptContext.sublistId;
        const fieldId = scriptContext.fieldId;

        if (sublistId === SUBLIST_ID) {
            if (fieldId === 'custrecord_item') {
                const itemId = currRec.getCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_item'
                });

                currRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custpage_location_pc_ui',
                    value: '',
                    ignoreFieldChange: true
                });
                currRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_location_pc',
                    value: '',
                    ignoreFieldChange: true
                });
                currRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custpage_bin_pc_ui',
                    value: '',
                    ignoreFieldChange: true
                });
                currRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_bin_pc',
                    value: '',
                    ignoreFieldChange: true
                });

                updateLocationOptions(currRec, itemId);
            } else if (fieldId === 'custpage_location_pc_ui') {
                const locationId = currRec.getCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custpage_location_pc_ui'
                });

                currRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_location_pc',
                    value: locationId,
                    ignoreFieldChange: true
                });
                currRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custpage_bin_pc_ui',
                    value: '',
                    ignoreFieldChange: true
                });
                currRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_bin_pc',
                    value: '',
                    ignoreFieldChange: true
                });

                updateBinOptions(currRec, locationId);
            } else if (fieldId === 'custpage_bin_pc_ui') {
                const binId = currRec.getCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custpage_bin_pc_ui'
                });

                currRec.setCurrentSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'custrecord_bin_pc',
                    value: binId,
                    ignoreFieldChange: true
                });
            }
        }
    };

    const lineInit = (scriptContext) => {
        const currRec = scriptContext.currentRecord;
        const sublistId = scriptContext.sublistId;

        if (sublistId === SUBLIST_ID) {
            const itemId = currRec.getCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: 'custrecord_item'
            });
            const locationId = currRec.getCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: 'custrecord_location_pc'
            });
            const binId = currRec.getCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: 'custrecord_bin_pc'
            });

            updateLocationOptions(currRec, itemId);
            currRec.setCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: 'custpage_location_pc_ui',
                value: locationId || '',
                ignoreFieldChange: true
            });
            if (locationId) {
                updateBinOptions(currRec, locationId, binId);
            }
        }
    };

    const validateLine = (scriptContext) => {
        if (isPageInitActive) {
            return true;
        }
        const currentRecord = scriptContext.currentRecord;
        const sublistId = scriptContext.sublistId;

        if (sublistId === SUBLIST_ID) {
            const locId = currentRecord.getCurrentSublistValue({
                sublistId: SUBLIST_ID,
                fieldId: 'custrecord_location_pc'
            });
            if (!locId) {
                alert('Please select a Location.');
                return false;
            }

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

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        lineInit: lineInit,
        validateLine: validateLine,
        validateDelete: validateDelete,
        saveRecord: saveRecord
    };
});
