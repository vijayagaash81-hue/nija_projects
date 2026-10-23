/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * Description: Client Script to dynamically source holidays based on employee working location and weekly off criteria (Form 565).
 * Also enables the job confirmation date field when employee job status is set to Confirmed (value 3).
 * Converted from SuiteScript 1.0 to SuiteScript 2.1.
 */
define(['N/search', 'N/log'], (search, log) => {

    /**
     * Executes when the page completes loading or when the form is reset.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - Trigger mode ('create', 'copy', 'edit')
     */
    const pageInit = (scriptContext) => {
        try {
            const { currentRecord } = scriptContext;
            const customForm = currentRecord.getValue({ fieldId: 'customform' });
            log.debug('pageInit', `customform: ${customForm}, mode: ${scriptContext.mode}`);
        } catch (e) {
            log.error('Error in pageInit', e);
        }
    };

    /**
     * Executes when a field is changed by a user or script.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.line - Line number (1-indexed)
     * @param {number} scriptContext.column - Column number
     */
    const fieldChanged = (scriptContext) => {
        try {
            const { currentRecord, fieldId } = scriptContext;
            const customForm = currentRecord.getValue({ fieldId: 'customform' });

            if (String(customForm) !== '565') {
                return;
            }

            // Sourcing holidays on working location or weekly off criteria change
            if (fieldId === 'custentity_hris_empworkinglocation' || fieldId === 'custentity_hris_empweeklyoffcriteria') {
                const empRegion = currentRecord.getValue({ fieldId: 'custentity_hris_empworkinglocation' });
                const empWeekCriteria = currentRecord.getValue({ fieldId: 'custentity_hris_empweeklyoffcriteria' });

                log.debug('Holiday Filter Changed', { empRegion, empWeekCriteria });

                if (empRegion && empWeekCriteria) {
                    const holidayList = searchHolidays(empRegion, empWeekCriteria);
                    log.debug('Setting Holiday List', holidayList);
                    currentRecord.setValue({
                        fieldId: 'custentity_hris_empholidays',
                        value: holidayList
                    });
                } else {
                    currentRecord.setValue({
                        fieldId: 'custentity_hris_empholidays',
                        value: []
                    });
                }
            }

            // Enable Job Confirmation Date if Employee Job Status is Confirmed (ID: 3)
            if (fieldId === 'custentity_emp_employee_job_status') {
                const empJobStatus = currentRecord.getValue({ fieldId: 'custentity_emp_employee_job_status' });
                log.debug('Employee Job Status Changed', `empJobStatus: ${empJobStatus}`);

                if (String(empJobStatus) === '3') {
                    const confirmationDateField = currentRecord.getField({ fieldId: 'custentity_hris_empjobconfirmationdt' });
                    if (confirmationDateField) {
                        confirmationDateField.isDisabled = false;
                    }
                }
            }
        } catch (e) {
            log.error('Error in fieldChanged', e);
        }
    };

    /**
     * Searches holiday master records based on region and weekly off criteria.
     * @param {string|number} empRegion - Employee working location region
     * @param {string|number} empWeekCriteria - Employee weekly off criteria
     * @returns {Array<string>} Array of holiday internal IDs
     */
    const searchHolidays = (empRegion, empWeekCriteria) => {
        const holidayList = [];
        try {
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

            holidaySearch.run().each((result) => {
                const holidayId = result.getValue({ name: 'internalid' });
                holidayList.push(holidayId);
                return true;
            });
        } catch (e) {
            log.error('Error in searchHolidays', e);
        }
        return holidayList;
    };

    return {
        pageInit,
        fieldChanged
    };
});
