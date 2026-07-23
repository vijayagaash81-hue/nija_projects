/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Description Client Script for dynamically sourcing holidays based on employee working location and weekly off criteria.
 */
define(['N/search', 'N/log'], (search, log) => {

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - Mode in which the record is loaded
     */
    const pageInit = (scriptContext) => {
        try {
            const currentRecord = scriptContext.currentRecord;
            const customForm = currentRecord.getValue({ fieldId: 'customform' });
            log.debug({ title: 'customform', details: customForm });

            if (String(customForm) === '167') {
                // Initializing custom holidays field if needed
            }
        } catch (e) {
            log.error({ title: 'Error in pageInit', details: e });
        }
    };

    /**
     * Function to be executed when a field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.fieldId - Field name
     */
    const fieldChanged = (scriptContext) => {
        try {
            const currentRecord = scriptContext.currentRecord;
            const fieldId = scriptContext.fieldId;
            const customForm = currentRecord.getValue({ fieldId: 'customform' });

            log.debug({ title: 'customform', details: customForm });

            if (String(customForm) === '167') {
                if (fieldId === 'custentity_hris_empworkinglocation' || fieldId === 'custentity_hris_empweeklyoffcriteria') {
                    const empRegion = currentRecord.getValue({ fieldId: 'custentity_hris_empworkinglocation' });
                    const empWeekCriteria = currentRecord.getValue({ fieldId: 'custentity_hris_empweeklyoffcriteria' });

                    log.debug({ title: 'empRegion & empWeekCriteria', details: { empRegion, empWeekCriteria } });

                    if (empRegion && empWeekCriteria) {
                        const holidayList = searchHolidays(empRegion, empWeekCriteria);
                        currentRecord.setValue({
                            fieldId: 'custentity_hris_empholidays',
                            value: holidayList
                        });
                        log.debug({ title: 'holidayList set', details: holidayList });
                    } else {
                        currentRecord.setValue({
                            fieldId: 'custentity_hris_empholidays',
                            value: []
                        });
                    }
                }

                if (fieldId === 'custentity_emp_employee_job_status') {
                    const empJobStatus = currentRecord.getValue({ fieldId: 'custentity_emp_employee_job_status' });
                    log.debug({ title: 'empJobStatus', details: empJobStatus });

                    if (String(empJobStatus) === '3') {
                        const jobConfirmationField = currentRecord.getField({ fieldId: 'custentity_hris_empjobconfirmationdt' });
                        if (jobConfirmationField) {
                            jobConfirmationField.isDisabled = false;
                        }
                    }
                }
            }
        } catch (e) {
            log.error({ title: 'Error in fieldChanged', details: e });
        }
    };

    /**
     * Searches for holiday master records based on region and weekly off criteria.
     *
     * @param {string|number} empRegion - Region filter
     * @param {string|number} empWeekCriteria - Weekly off criteria filter
     * @returns {Array<string>} Array of holiday master record internal IDs
     */
    function searchHolidays(empRegion, empWeekCriteria) {
        try {
            const holidayLt = [];
            if (!empRegion || !empWeekCriteria) return holidayLt;

            const holidaySearch = search.create({
                type: 'customrecord_hris_holiday_master',
                filters: [
                    ['custrecord_hris_holi_region', 'anyof', empRegion],
                    'AND',
                    ['custrecord_hris_holidayweeklyoffcriteria', 'anyof', empWeekCriteria],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
                columns: ['internalid']
            });

            const searchResults = holidaySearch.run().getRange({ start: 0, end: 1000 });

            if (searchResults && searchResults.length > 0) {
                searchResults.forEach(result => {
                    const holidayId = result.getValue({ name: 'internalid' });
                    log.debug({ title: 'Found Holiday ID', details: holidayId });
                    holidayLt.push(holidayId);
                });
            }

            return holidayLt;
        } catch (e) {
            log.error({ title: 'Error in searchHolidays', details: e });
            return [];
        }
    }

    return {
        pageInit,
        fieldChanged
    };
});
