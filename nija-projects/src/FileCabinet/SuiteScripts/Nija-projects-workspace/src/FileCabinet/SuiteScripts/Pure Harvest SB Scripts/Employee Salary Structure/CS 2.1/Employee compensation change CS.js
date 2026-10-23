/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * Description: Client Script for Employee Salary Structure (Compensation Change).
 * 1. Automatically sources Employee Category (Pay Process Group) from Employee record.
 * 2. Validates that Salary Structure is not duplicated for the selected Employee.
 * 3. Propagates Pay Process Group to compensation details sublist lines.
 * Converted from SuiteScript 2.0 to SuiteScript 2.1.
 */
define(['N/query', 'N/log'], (query, log) => {

    /**
     * Executes when the page completes loading or when the form is reset.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - Trigger mode ('create', 'copy', 'edit')
     */
    const pageInit = (scriptContext) => {
        try {
            log.debug('pageInit', `Mode: ${scriptContext.mode}`);
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

            // When Employee Name changes
            if (fieldId === 'custrecord_hris_empchange_employee_nam') {
                const empName = currentRecord.getValue({ fieldId: 'custrecord_hris_empchange_employee_nam' });
                log.debug('Employee Name Changed', `empName: ${empName}`);

                if (empName) {
                    // 1. Sourcing Pay Process Group from Employee record via SuiteQL
                    const empCategorySql = 'SELECT custentity_hris_empcategory FROM employee WHERE id = ?';
                    const empCatResults = query.runSuiteQL({
                        query: empCategorySql,
                        params: [empName]
                    }).asMappedResults();

                    if (empCatResults.length > 0 && empCatResults[0].custentity_hris_empcategory) {
                        const payGroupId = empCatResults[0].custentity_hris_empcategory;
                        log.debug('Pay Group Sourced', `payGroupId: ${payGroupId}`);

                        currentRecord.setValue({
                            fieldId: 'custrecord_hris_empchange_emp_pay_pro_gp',
                            value: payGroupId,
                            ignoreFieldChange: false,
                            forceSyncSourcing: false
                        });
                    }

                    // 2. Validate that Employee Salary Structure does not already exist
                    const currentRecordId = currentRecord.id;
                    let compChangeSql = 'SELECT id FROM customrecord_hris_employee_compen_change WHERE custrecord_hris_empchange_employee_nam = ?';
                    const sqlParams = [empName];

                    if (currentRecordId) {
                        compChangeSql += ' AND id != ?';
                        sqlParams.push(currentRecordId);
                    }

                    const existingResults = query.runSuiteQL({
                        query: compChangeSql,
                        params: sqlParams
                    }).asMappedResults();

                    if (existingResults.length > 0 && existingResults[0].id) {
                        alert('Employee Salary Structure is already defined for this employee');
                        currentRecord.setValue({
                            fieldId: 'custrecord_hris_empchange_employee_nam',
                            value: '',
                            ignoreFieldChange: false,
                            forceSyncSourcing: false
                        });
                        return false;
                    }
                }
            }

            // When Pay Process Group changes, add and populate a line in the compensation details sublist
            if (fieldId === 'custrecord_hris_empchange_emp_pay_pro_gp') {
                const payProcess = currentRecord.getValue({ fieldId: 'custrecord_hris_empchange_emp_pay_pro_gp' });
                if (payProcess) {
                    currentRecord.selectNewLine({
                        sublistId: 'recmachcustrecord_hris_employee_comp_details_li'
                    });
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_hris_employee_comp_details_li',
                        fieldId: 'custrecord_hris_cde_process_group',
                        value: payProcess,
                        ignoreFieldChange: true,
                        forceSyncSourcing: true
                    });
                    currentRecord.commitLine({
                        sublistId: 'recmachcustrecord_hris_employee_comp_details_li'
                    });
                }
            }
        } catch (e) {
            log.error('Error in fieldChanged', e);
        }
    };

    /**
     * Executes when an existing line is selected or when a new line is added to a sublist.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     */
    const lineInit = (scriptContext) => {
        try {
            const { currentRecord, sublistId } = scriptContext;

            if (sublistId === 'recmachcustrecord_hris_employee_comp_details_li') {
                const payProcess = currentRecord.getValue({ fieldId: 'custrecord_hris_empchange_emp_pay_pro_gp' });
                if (payProcess) {
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_hris_employee_comp_details_li',
                        fieldId: 'custrecord_hris_cde_process_group',
                        value: payProcess,
                        ignoreFieldChange: true,
                        forceSyncSourcing: true
                    });
                }
            }
        } catch (e) {
            log.error('Error in lineInit', e);
        }
    };

    return {
        pageInit,
        fieldChanged,
        lineInit
    };
});
