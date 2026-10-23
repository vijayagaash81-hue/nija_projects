/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * Description: Client Script to validate Employee Data Change (Salary Structure):
 * 1. Sources gender and marital status on pageInit / employee change.
 * 2. Propagates process group to child sublists on header change and lineInit.
 * 3. Validates that Effective From Date is not prior to the Employee's hire date.
 * Converted from SuiteScript 1.0 to SuiteScript 2.1.
 */
define(['N/search', 'N/format', 'N/log'], (search, format, log) => {

    /**
     * Executes when the page completes loading or when the form is reset.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - Trigger mode ('create', 'copy', 'edit')
     */
    const pageInit = (scriptContext) => {
        try {
            const { currentRecord, mode } = scriptContext;
            if (mode === 'create') {
                const empId = currentRecord.getValue({ fieldId: 'custrecord_hris_empchange_employee_nam' });
                if (empId) {
                    sourceEmployeeDemographics(currentRecord, empId);
                }
            }
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
     */
    const fieldChanged = (scriptContext) => {
        try {
            const { currentRecord, fieldId } = scriptContext;

            // 1. Process Group propagation to active lines
            if (fieldId === 'custrecord_hris_empchange_emp_pay_pro_gp') {
                const procGrp = currentRecord.getValue({ fieldId: 'custrecord_hris_empchange_emp_pay_pro_gp' });
                if (procGrp) {
                    try {
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_cde_process_group',
                            value: procGrp,
                            ignoreFieldChange: true
                        });
                    } catch (e) {}

                    try {
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_datachangeint',
                            fieldId: 'custrecord_hris_cdb_pay_group',
                            value: procGrp,
                            ignoreFieldChange: true
                        });
                    } catch (e) {}

                    try {
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change_int',
                            fieldId: 'custrecord_hris_cdo_pay_group',
                            value: procGrp,
                            ignoreFieldChange: true
                        });
                    } catch (e) {}
                }
            }

            // 2. Employee selection: sources gender and marital status
            if (fieldId === 'custrecord_hris_empchange_employee_nam') {
                const empId = currentRecord.getValue({ fieldId: 'custrecord_hris_empchange_employee_nam' });
                if (empId) {
                    sourceEmployeeDemographics(currentRecord, empId);
                }
            }

            // 3. Effective From Date validation against Hire Date
            if (fieldId === 'custrecord_hris_empchange_eff_from_date') {
                const empChangeType = currentRecord.getValue({ fieldId: 'custrecord_hris_empchange_type' });
                log.debug('Effective Date Changed', `empChangeType: ${empChangeType}`);

                if (String(empChangeType) === '4') {
                    const empId = currentRecord.getValue({ fieldId: 'custrecord_hris_empchange_employee_nam' });

                    if (empId) {
                        const empLookup = search.lookupFields({
                            type: search.Type.EMPLOYEE,
                            id: empId,
                            columns: ['hiredate']
                        });

                        const hireDateVal = empLookup.hiredate;
                        const fromDateVal = currentRecord.getValue({ fieldId: 'custrecord_hris_empchange_eff_from_date' });

                        if (hireDateVal && fromDateVal) {
                            const hireDate = hireDateVal instanceof Date ? hireDateVal : format.parse({ value: hireDateVal, type: format.Type.DATE });
                            const fromDate = fromDateVal instanceof Date ? fromDateVal : format.parse({ value: fromDateVal, type: format.Type.DATE });

                            if (fromDate < hireDate) {
                                alert('Effective Date should be greater than joining Date ');
                                currentRecord.setValue({
                                    fieldId: 'custrecord_hris_empchange_eff_from_date',
                                    value: '',
                                    ignoreFieldChange: true
                                });
                                return false;
                            }
                        }
                    }

                    if (!empChangeType) {
                        alert('Please select Type ');
                        currentRecord.setValue({
                            fieldId: 'custrecord_hris_empchange_eff_from_date',
                            value: '',
                            ignoreFieldChange: true
                        });
                        return false;
                    }
                }
            }
        } catch (e) {
            log.error('Error in fieldChanged', e);
        }
    };

    /**
     * Executes when an existing line is selected or when a new line is added to a sublist.
     * Sets process group on earnings and others sublists.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     */
    const lineInit = (scriptContext) => {
        try {
            const { currentRecord, sublistId } = scriptContext;
            const procGrp = currentRecord.getValue({ fieldId: 'custrecord_hris_empchange_emp_pay_pro_gp' });

            if (procGrp) {
                if (sublistId === 'recmachcustrecord_hris_employee_data_change') {
                    currentRecord.setCurrentSublistValue({
                        sublistId,
                        fieldId: 'custrecord_hris_cde_process_group',
                        value: procGrp,
                        ignoreFieldChange: true
                    });
                } else if (sublistId === 'recmachcustrecord_hris_employee_data_change_int') {
                    currentRecord.setCurrentSublistValue({
                        sublistId,
                        fieldId: 'custrecord_hris_cdo_pay_group',
                        value: procGrp,
                        ignoreFieldChange: true
                    });
                }
            }
        } catch (e) {
            log.error('Error in lineInit', e);
        }
    };

    /**
     * Helper to source gender and marital status from Employee record.
     */
    const sourceEmployeeDemographics = (currentRecord, empId) => {
        try {
            const empLookup = search.lookupFields({
                type: search.Type.EMPLOYEE,
                id: empId,
                columns: ['custentity_hris_empmaritalstatus', 'custentity_hris_empgender']
            });

            const maritalStatus = empLookup.custentity_hris_empmaritalstatus ? empLookup.custentity_hris_empmaritalstatus[0]?.value : '';
            const gender = empLookup.custentity_hris_empgender ? empLookup.custentity_hris_empgender[0]?.value : '';

            if (gender) {
                currentRecord.setValue({ fieldId: 'custrecord_hris_empchange_gender', value: gender });
            }
            if (maritalStatus) {
                currentRecord.setValue({ fieldId: 'custrecord_hris_empchange_marital_status', value: maritalStatus });
            }
        } catch (e) {
            log.error('Error in sourceEmployeeDemographics', e);
        }
    };

    /**
     * Executes when record is saved.
     * @returns {boolean} Return true to allow save
     */
    const saveRecord = () => true;

    /**
     * Validates employee identification code against forbidden special characters.
     * @param {string} str - Employee identification string
     * @returns {boolean}
     */
    const isValid = (str) => {
        const forbiddenChars = /[@()~`!#$%^&*+=\-[\]\\';,/{}|":<>?.]/;
        if (forbiddenChars.test(str)) {
            alert('Employee Identification has special characters @()~`!#$%^&*+=-[]\\\';,/{}|":<>?. \nThese are not allowed\n');
            return false;
        }
        return true;
    };

    return {
        pageInit,
        fieldChanged,
        lineInit,
        saveRecord,
        isValid
    };
});
