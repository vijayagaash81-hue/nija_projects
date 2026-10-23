/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Description: Automatically sets employee holiday list based on employee working location and holiday master.
 * Converted from SuiteScript 1.0 to SuiteScript 2.1.
 */
define(['N/record', 'N/search', 'N/log'], (record, search, log) => {

    /**
     * Executes after an employee record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     */
    const afterSubmit = (scriptContext) => {
        try {
            const { type, newRecord } = scriptContext;

            if (type === scriptContext.UserEventType.DELETE) {
                return;
            }

            const recordId = newRecord.id;
            const customForm = newRecord.getValue({ fieldId: 'customform' });
            log.debug('afterSubmit', `recordId: ${recordId}, customform: ${customForm}`);

            if (String(customForm) !== '565') {
                return;
            }

            const empLocation = newRecord.getValue({ fieldId: 'custentity_hris_empworkinglocation' });
            log.debug('Working Location', `empLocation: ${empLocation}`);

            if (!empLocation) {
                log.debug('Working Location', 'No working location defined on employee record');
                return;
            }

            const holidayList = searchHolidays(empLocation);
            log.debug('Holiday Search Results', `Found ${holidayList.length} holidays: ${JSON.stringify(holidayList)}`);

            // Update the employee record with the holiday list
            try {
                record.submitFields({
                    type: record.Type.EMPLOYEE,
                    id: recordId,
                    values: {
                        custentity_hris_empholidays: holidayList
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
                log.debug('Employee Holidays Updated (submitFields)', `Employee ID: ${recordId}`);
            } catch (submitErr) {
                log.debug('submitFields failed, using record.load fallback', submitErr.message);
                const empRecord = record.load({
                    type: record.Type.EMPLOYEE,
                    id: recordId,
                    isDynamic: false
                });
                empRecord.setValue({
                    fieldId: 'custentity_hris_empholidays',
                    value: holidayList
                });
                const savedId = empRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                log.debug('Employee Holidays Updated (load/save)', `Employee ID: ${savedId}`);
            }
        } catch (e) {
            log.error('Error in afterSubmit', e);
        }
    };

    /**
     * Searches holiday master records by location.
     * @param {string|number} empLocation
     * @returns {Array<string>} Array of holiday internal IDs
     */
    const searchHolidays = (empLocation) => {
        const holidayList = [];
        try {
            const holidaySearch = search.create({
                type: 'customrecord_hris_holiday_master',
                filters: [
                    ['isinactive', 'is', 'F'],
                    'AND',
                    ['custrecord_hris_holi_region', 'anyof', empLocation]
                ],
                columns: ['internalid']
            });

            holidaySearch.run().each((result) => {
                const holidayId = result.getValue({ name: 'internalid' });
                holidayList.push(holidayId);
                return true;
            });
        } catch (searchErr) {
            log.error('Error searching holiday master', searchErr);
        }
        return holidayList;
    };

    return {
        afterSubmit
    };
});
