/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Description User Event script to automatically source holidays from Holiday Master based on working location on Employee save.
 */
define(['N/record', 'N/search', 'N/log'], (record, search, log) => {

    /**
     * Function executed after a record is submitted to database.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type (e.g. create, edit)
     */
    const afterSubmit = (scriptContext) => {
        try {
            const newRecord = scriptContext.newRecord;
            const recordId = newRecord.id;
            const customForm = newRecord.getValue({ fieldId: 'customform' });

            log.debug({ title: 'afterSubmit customform', details: customForm });

            if (String(customForm) === '167') {
                const empLocation = newRecord.getValue({ fieldId: 'custentity_hris_empworkinglocation' });

                if (empLocation) {
                    const holidayList = searchHolidays(empLocation);
                    log.debug({ title: 'Found Holiday List', details: holidayList });

                    // Efficiently update employee record holidays field using submitFields
                    record.submitFields({
                        type: record.Type.EMPLOYEE,
                        id: recordId,
                        values: {
                            custentity_hris_empholidays: holidayList
                        },
                        options: {
                            enforceUniqueFields: false,
                            ignoreMandatoryFields: true
                        }
                    });
                }
            }
        } catch (e) {
            log.error({
                title: 'Error in afterSubmit SourceValueFromEmployeeAfterSubmit',
                details: e.message || e
            });
        }
    };

    /**
     * Searches holiday master custom records matching employee working location region.
     *
     * @param {string|number} empLocation - Employee working location internal ID
     * @returns {Array<string>} Array of holiday master internal IDs
     */
    function searchHolidays(empLocation) {
        try {
            const holidayLt = [];
            if (!empLocation) return holidayLt;

            const holidaySearch = search.create({
                type: 'customrecord_hris_holiday_master',
                filters: [
                    ['isinactive', 'is', 'F'],
                    'AND',
                    ['custrecord_hris_holi_region', 'anyof', empLocation]
                ],
                columns: ['internalid']
            });

            const searchResults = holidaySearch.run().getRange({ start: 0, end: 1000 });

            if (searchResults && searchResults.length > 0) {
                searchResults.forEach(result => {
                    const holidayId = result.getValue({ name: 'internalid' });
                    holidayLt.push(holidayId);
                });
            }

            return holidayLt;
        } catch (e) {
            log.error({ title: 'Error in searchHolidays', details: e.message || e });
            return [];
        }
    }

    return {
        afterSubmit
    };
});
