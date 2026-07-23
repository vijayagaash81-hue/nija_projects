/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Description User Event script to sync inactive status across employee compensation, leave balance, data sourcing, and compensation history records.
 */
define(['N/record', 'N/search', 'N/runtime', 'N/log'], (record, search, runtime, log) => {

    /**
     * Function executed after a record is submitted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type (e.g. create, edit)
     */
    const afterSubmit = (scriptContext) => {
        try {
            const executionContext = runtime.executionContext;
            log.debug({ title: 'afterSubmit executionContext', details: executionContext });

            if (executionContext === runtime.ContextType.USER_INTERFACE) {
                const newRecord = scriptContext.newRecord;
                const empId = newRecord.id;
                const customForm = newRecord.getValue({ fieldId: 'customform' });

                log.debug({ title: 'customform', details: customForm });

                if (String(customForm) === '167') {
                    const isInactive = newRecord.getValue({ fieldId: 'isinactive' });
                    const isEmployeeInactive = (isInactive === true || isInactive === 'T');
                    const targetInactiveVal = isEmployeeInactive;
                    const searchInactiveFilter = isEmployeeInactive ? 'F' : 'T';

                    log.debug({
                        title: 'Employee Inactive Status Sync',
                        details: { empId, isEmployeeInactive, searchInactiveFilter }
                    });

                    // 1. Inactive/Active customrecord_hris_employee_compen_change
                    toggleRecordInactiveStatus({
                        recordType: 'customrecord_hris_employee_compen_change',
                        employeeField: 'custrecord_hris_empchange_employee_nam',
                        empId: empId,
                        searchInactiveFilter: searchInactiveFilter,
                        targetInactiveVal: targetInactiveVal
                    });

                    // 2. Inactive/Active customrecord_hris_leavebalance
                    toggleRecordInactiveStatus({
                        recordType: 'customrecord_hris_leavebalance',
                        employeeField: 'custrecord_hris_lvbal_employee_name',
                        empId: empId,
                        searchInactiveFilter: searchInactiveFilter,
                        targetInactiveVal: targetInactiveVal
                    });

                    // 3. Inactive/Active customrecord_hris_employeedatasourcing
                    toggleRecordInactiveStatus({
                        recordType: 'customrecord_hris_employeedatasourcing',
                        employeeField: 'custrecord_hris_eds_employee',
                        empId: empId,
                        searchInactiveFilter: searchInactiveFilter,
                        targetInactiveVal: targetInactiveVal
                    });

                    // 4. Inactive/Active customrecord_hris_employee_compensation
                    toggleRecordInactiveStatus({
                        recordType: 'customrecord_hris_employee_compensation',
                        employeeField: 'custrecord_hris_employee_name_',
                        empId: empId,
                        searchInactiveFilter: searchInactiveFilter,
                        targetInactiveVal: targetInactiveVal
                    });
                }
            }
        } catch (e) {
            log.error({
                title: 'Error in EventAfterSubmit',
                details: e.message || e
            });
        }
    };

    /**
     * Helper function to search matching custom records and update their isinactive flag.
     */
    function toggleRecordInactiveStatus(options) {
        try {
            const searchObj = search.create({
                type: options.recordType,
                filters: [
                    ['isinactive', 'is', options.searchInactiveFilter],
                    'AND',
                    [options.employeeField, 'anyof', options.empId]
                ],
                columns: ['internalid']
            });

            const searchResults = searchObj.run().getRange({ start: 0, end: 1000 });

            if (searchResults && searchResults.length > 0) {
                searchResults.forEach(res => {
                    const recId = res.id;
                    record.submitFields({
                        type: options.recordType,
                        id: recId,
                        values: {
                            isinactive: options.targetInactiveVal
                        },
                        options: {
                            enforceUniqueFields: false,
                            ignoreMandatoryFields: true
                        }
                    });
                    log.debug({
                        title: 'Updated Record Inactive Flag',
                        details: { type: options.recordType, id: recId, isinactive: options.targetInactiveVal }
                    });
                });
            }
        } catch (e) {
            log.error({
                title: 'Error updating ' + options.recordType,
                details: e.message || e
            });
        }
    }

    return {
        afterSubmit
    };
});
