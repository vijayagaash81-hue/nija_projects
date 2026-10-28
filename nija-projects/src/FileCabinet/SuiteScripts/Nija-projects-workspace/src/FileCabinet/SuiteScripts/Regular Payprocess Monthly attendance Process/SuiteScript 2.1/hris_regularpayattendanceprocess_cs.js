/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 * @Description Client script for filtering employee codes based on month, year, and subsidiary.
 */
define(['N/query', 'N/log'], (query, log) => {

    /**
     * Function to be executed when field is changed.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number (for sublists)
     * @param {number} scriptContext.columnNum - Column number (for sublists)
     */
    const fieldChanged = (scriptContext) => {
        try {
            const { currentRecord, fieldId } = scriptContext;

            if (['custpage_month', 'custpage_year', 'custpage_subsi'].includes(fieldId)) {
                const month = currentRecord.getValue({ fieldId: 'custpage_month' });
                const year = currentRecord.getValue({ fieldId: 'custpage_year' });
                const subsidiary = currentRecord.getValue({ fieldId: 'custpage_subsi' });
                const empCodeField = currentRecord.getField({ fieldId: 'custpage_empcode' });

                if (empCodeField) {
                    empCodeField.removeSelectOption({ value: null });
                }

                if (month && year && subsidiary && empCodeField) {
                    const monthlySql = `
                        SELECT a.*, 
                               e.entityid AS emp_name, 
                               e.custentity_hris_empcode AS emp_code, 
                               e.subsidiary, 
                               e.id AS idemp
                        FROM customrecord_hrms_monthlyattendance a
                        JOIN customlist_hris_month_list b ON a.custrecord_hrms_month_monthid = b.id
                        JOIN customlist_hris_year_master c ON a.custrecord_hrms_month_yearid = c.id
                        JOIN employee e ON e.id = a.custrecord_hrms_month_empid
                        WHERE b.id = ${month} 
                          AND b.isinactive = 'F'
                          AND c.id = ${year} 
                          AND a.custrecord_njt_hrms_monthly_status = 1
                          AND e.subsidiary = ${subsidiary}
                          AND c.isinactive = 'F'
                    `;

                    log.debug({ title: 'Monthly SQL Query', details: monthlySql });

                    const queryResult = query.runSuiteQL({ query: monthlySql });
                    const tsResult = queryResult.asMappedResults();

                    log.debug({ title: 'Query Results Count', details: tsResult.length });

                    // Add an initial empty option
                    empCodeField.insertSelectOption({
                        value: '',
                        text: '- Select Employee -',
                        isSelected: false
                    });

                    // Avoid duplicate employee entries in dropdown
                    const addedEmpIds = new Set();

                    for (const rec of tsResult) {
                        const empId = rec.idemp;
                        const empCode = rec.emp_code;

                        if (empId && empCode && !addedEmpIds.has(empId)) {
                            addedEmpIds.add(empId);
                            empCodeField.insertSelectOption({
                                value: String(empId),
                                text: String(empCode),
                                isSelected: false
                            });
                        }
                    }
                }
            }
        } catch (e) {
            log.error({
                title: 'Error in fieldChanged',
                details: e.message || e
            });
        }
    };

    return {
        fieldChanged
    };
});
