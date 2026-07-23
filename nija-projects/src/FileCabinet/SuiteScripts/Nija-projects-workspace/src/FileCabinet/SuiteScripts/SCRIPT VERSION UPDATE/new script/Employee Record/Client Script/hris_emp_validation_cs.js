/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/log'], (search, log) => {

    /**
     * Validation function executed when the record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid, false to prevent saving
     */
    function saveRecord(scriptContext) {
        try {
            const currentRecord = scriptContext.currentRecord;
            const empStatus = currentRecord.getValue({ fieldId: 'employeestatus' });
            const customForm = currentRecord.getValue({ fieldId: 'customform' });

            log.debug({
                title: 'customform',
                details: customForm
            });

            if (String(customForm) === '131') {
                if (String(empStatus) === '6' || String(empStatus) === '7') {
                    const dateLeaving = currentRecord.getValue({ fieldId: 'custentity_hirs_empdol' });

                    if (!dateLeaving || dateLeaving === 'undefined') {
                        alert('Please enter the date of leaving of employee');
                        return false;
                    }
                }

                const ptCheck = currentRecord.getValue({ fieldId: 'custentity_hris_emp_isptapplicable' });

                if (ptCheck === true || String(ptCheck) === 'T') {
                    const ptLoc = currentRecord.getValue({ fieldId: 'custentity_hris_empptlocation' });

                    if (!ptLoc || ptLoc === 'undefined') {
                        alert('Please enter PT Location');
                        return false;
                    }
                } else {
                    return true;
                }
            } else {
                return true;
            }

            return true;
        } catch (e) {
            log.error({
                title: 'Error in saveRecord',
                details: e
            });
            return true;
        }
    }

    /**
     * Searches for duplicate employee ID records.
     *
     * @param {string} employeeIdCheck - Employee ID code to check
     * @returns {Array} Search results
     */
    function searchEmployeeIdduplicate(employeeIdCheck) {
        try {
            const searchEmpRec = search.create({
                type: search.Type.EMPLOYEE,
                filters: [
                    ['custentity_hris_empcode', 'is', employeeIdCheck]
                ],
                columns: [
                    'internalid',
                    'custentity_hris_empcode'
                ]
            }).run().getRange({ start: 0, end: 100 });

            if (searchEmpRec && searchEmpRec.length > 0) {
                const empId = searchEmpRec[0].getValue({ name: 'custentity_hris_empcode' });
                alert('empId====searchEmpRec' + empId + '  ' + searchEmpRec);
            }

            return searchEmpRec;
        } catch (e) {
            log.error({
                title: 'Error in searchEmployeeIdduplicate',
                details: e
            });
            return [];
        }
    }

    return {
        saveRecord: saveRecord,
        searchEmployeeIdduplicate: searchEmployeeIdduplicate
    };
});
