/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * Description: Client Script to validate Date of Leaving (DOL) and Professional Tax (PT) Location on Employee record (Form 565).
 * Converted from SuiteScript 1.0 to SuiteScript 2.1.
 */
define(['N/search', 'N/log'], (search, log) => {

    /**
     * Executes when the record is saved.
     * Validates:
     * 1. Date of leaving when employee status is 6 or 7.
     * 2. PT Location when PT is marked as applicable.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid to save, false to prevent saving
     */
    const saveRecord = (scriptContext) => {
        try {
            const { currentRecord } = scriptContext;
            const customForm = currentRecord.getValue({ fieldId: 'customform' });
            log.debug('saveRecord', `customform: ${customForm}`);

            if (String(customForm) === '565') {
                const empStatus = currentRecord.getValue({ fieldId: 'employeestatus' });

                // Check Date of Leaving for resigned/terminated statuses (6 or 7)
                if (String(empStatus) === '6' || String(empStatus) === '7') {
                    const dateLeaving = currentRecord.getValue({ fieldId: 'custentity_hirs_empdol' });

                    if (!dateLeaving || dateLeaving === 'undefined') {
                        alert('Please enter the date of leaving of employee');
                        return false;
                    }
                }

                // Check PT Location when PT is applicable
                const ptCheck = currentRecord.getValue({ fieldId: 'custentity_hris_emp_isptapplicable' });

                if (ptCheck === true || String(ptCheck) === 'T') {
                    const ptLoc = currentRecord.getValue({ fieldId: 'custentity_hris_empptlocation' });

                    if (!ptLoc || ptLoc === 'undefined') {
                        alert('Please enter PT Location');
                        return false;
                    }
                }
            }

            return true;
        } catch (e) {
            log.error('Error in saveRecord', e);
            return true;
        }
    };

    /**
     * Searches for existing employee records with the specified employee ID code.
     * @param {string} employeeIdCheck - Employee code to search for
     * @returns {Array<Object>} Search result objects
     */
    const searchEmployeeIdduplicate = (employeeIdCheck) => {
        try {
            if (!employeeIdCheck) return [];

            const empSearch = search.create({
                type: search.Type.EMPLOYEE,
                filters: [
                    ['custentity_hris_empcode', 'is', employeeIdCheck],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
                columns: ['internalid', 'custentity_hris_empcode']
            });

            const searchResults = empSearch.run().getRange({ start: 0, end: 10 });
            if (searchResults && searchResults.length > 0) {
                const empId = searchResults[0].getValue({ name: 'custentity_hris_empcode' });
                alert(`Duplicate Employee Code Found: ${empId}`);
            }
            return searchResults;
        } catch (e) {
            log.error('Error in searchEmployeeIdduplicate', e);
            return [];
        }
    };

    return {
        saveRecord,
        searchEmployeeIdduplicate
    };
});
