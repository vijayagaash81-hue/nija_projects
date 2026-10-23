/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Description: Automatically syncs active/inactive status across related HRIS records
 * (Employee Compensation Change, Leave Balance, Employee Data Sourcing, Compensation Change History)
 * when the employee's active status changes in user interface mode.
 * Converted from SuiteScript 1.0 to SuiteScript 2.1.
 */
define(['N/record', 'N/search', 'N/runtime', 'N/log'], (record, search, runtime, log) => {

    /**
     * Executes after an employee record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     */
    const afterSubmit = (scriptContext) => {
        try {
            const executionContext = runtime.executionContext;
            if (executionContext !== runtime.ContextType.USER_INTERFACE) {
                return;
            }

            const { type, newRecord } = scriptContext;
            if (type === scriptContext.UserEventType.DELETE) {
                return;
            }

            const empId = newRecord.id;
            const customForm = newRecord.getValue({ fieldId: 'customform' });
            log.debug('afterSubmit', `empId: ${empId}, customform: ${customForm}`);

            if (String(customForm) !== '565') {
                return;
            }

            let isInactive = newRecord.getValue({ fieldId: 'isinactive' });
            if (isInactive === undefined || isInactive === null) {
                const lookup = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: empId,
                    columns: ['isinactive']
                });
                isInactive = lookup.isinactive;
            }

            const isEmployeeInactive = isInactive === true || isInactive === 'T';
            log.debug('afterSubmit Inactive Check', `isEmployeeInactive: ${isEmployeeInactive}`);

            // State to search for and target state to set
            const searchInactiveState = isEmployeeInactive ? 'F' : 'T';
            const targetInactiveValue = isEmployeeInactive; // true or false

            // 1. Employee Compensation Change
            updateRecordStatus(
                'customrecord_hris_employee_compen_change',
                'custrecord_hris_empchange_employee_nam',
                empId,
                searchInactiveState,
                targetInactiveValue,
                true // only first
            );

            // 2. Leave Balance
            updateRecordStatus(
                'customrecord_hris_leavebalance',
                'custrecord_hris_lvbal_employee_name',
                empId,
                searchInactiveState,
                targetInactiveValue,
                false // all records
            );

            // 3. Employee Data Sourcing
            updateRecordStatus(
                'customrecord_hris_employeedatasourcing',
                'custrecord_hris_eds_employee',
                empId,
                searchInactiveState,
                targetInactiveValue,
                true // only first
            );

            // 4. Employee Compensation Change History
            updateRecordStatus(
                'customrecord_hris_employee_compensation',
                'custrecord_hris_employee_name_',
                empId,
                searchInactiveState,
                targetInactiveValue,
                false // all records
            );

        } catch (e) {
            log.error('Error in afterSubmit', e);
        }
    };

    /**
     * Searches for matching records and updates their isinactive status.
     * @param {string} recordType
     * @param {string} empField
     * @param {number|string} empId
     * @param {string} searchInactiveState - 'T' or 'F'
     * @param {boolean} targetInactiveValue - true or false
     * @param {boolean} onlyFirst - Whether to update only the first record or all records
     */
    const updateRecordStatus = (recordType, empField, empId, searchInactiveState, targetInactiveValue, onlyFirst) => {
        try {
            const recordSearch = search.create({
                type: recordType,
                filters: [
                    ['isinactive', 'is', searchInactiveState],
                    'AND',
                    [empField, 'anyof', empId]
                ],
                columns: ['internalid']
            });

            if (onlyFirst) {
                const results = recordSearch.run().getRange({ start: 0, end: 1 });
                if (results && results.length > 0) {
                    submitInactiveStatus(recordType, results[0].id, targetInactiveValue);
                }
            } else {
                recordSearch.run().each((result) => {
                    submitInactiveStatus(recordType, result.id, targetInactiveValue);
                    return true;
                });
            }
        } catch (err) {
            log.error(`Error updating status for ${recordType}`, err);
        }
    };

    /**
     * Submits the isinactive field using record.submitFields with fallback to record.load/save.
     * @param {string} recordType
     * @param {number|string} recordId
     * @param {boolean} isInactive
     */
    const submitInactiveStatus = (recordType, recordId, isInactive) => {
        try {
            record.submitFields({
                type: recordType,
                id: recordId,
                values: {
                    isinactive: isInactive
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });
            log.debug('Updated Status (submitFields)', `${recordType} ID ${recordId} -> isinactive: ${isInactive}`);
        } catch (submitErr) {
            log.debug('submitFields failed, using load/save fallback', submitErr.message);
            try {
                const rec = record.load({
                    type: recordType,
                    id: recordId,
                    isDynamic: false
                });
                rec.setValue({ fieldId: 'isinactive', value: isInactive });
                rec.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
                log.debug('Updated Status (load/save)', `${recordType} ID ${recordId} -> isinactive: ${isInactive}`);
            } catch (loadErr) {
                log.error(`Failed to update ${recordType} ID ${recordId}`, loadErr);
            }
        }
    };

    return {
        afterSubmit
    };
});
