/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Description Client script for validating and calculating details on Loan Allocation records.
 */
define(['N/search', 'N/log', 'N/format'], (search, log, format) => {

    /**
     * Helper to validate null/undefined/empty values
     */
    const isNullOrEmpty = (val) => {
        return val === null || val === undefined || val === '' || val === 'undefined';
    };

    /**
     * Helper to safely parse Date from string or Date object
     */
    const parseDate = (val) => {
        if (!val) return null;
        if (val instanceof Date) return val;
        return format.parse({
            value: val,
            type: format.Type.DATE
        });
    };

    /**
     * Search employee grade based on employee ID
     */
    const SearchEmpGrade = (empId) => {
        if (!empId) return '';
        try {
            const empLookup = search.lookupFields({
                type: 'employee',
                id: empId,
                columns: ['custentity_emp_grade_']
            });
            if (empLookup && empLookup.custentity_emp_grade_) {
                const gradeVal = empLookup.custentity_emp_grade_;
                if (Array.isArray(gradeVal) && gradeVal.length > 0) {
                    return gradeVal[0].value;
                }
                return gradeVal;
            }
        } catch (e) {
            log.error({ title: 'Error in SearchEmpGrade', details: e.message || e });
        }
        return '';
    };

    /**
     * Search ceiling amount from Loan Master based on employee grade and loan type
     */
    const searchLoanType = (empGrade, loanType) => {
        if (!empGrade || !loanType) return 0;
        try {
            const loanMasterSearch = search.create({
                type: 'customrecord_hris_loan_master',
                filters: [
                    ['custrecord_hris_loan_grade', 'anyof', empGrade],
                    'AND',
                    ['name', 'is', loanType],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
                columns: ['custrecord_hris_ceiling_amount']
            }).run().getRange({ start: 0, end: 1 });

            if (loanMasterSearch && loanMasterSearch.length > 0) {
                return parseFloat(loanMasterSearch[0].getValue({ name: 'custrecord_hris_ceiling_amount' })) || 0;
            }
        } catch (e) {
            log.error({ title: 'Error in searchLoanType', details: e.message || e });
        }
        return 0;
    };

    /**
     * Search duplicate records end date (defined in old script, kept for completeness)
     */
    const searchDuplicateRec = (empId, emiStartDate, emiEndDate, loanType) => {
        if (!empId || !loanType) return [];
        try {
            const dupRecEndDate = [];
            const searchLoanRec = search.create({
                type: 'customrecord_hris_empchange_loan_applicn',
                filters: [
                    ['custrecord_hris_loan_emp_name', 'anyof', empId],
                    'AND',
                    ['custrecord_hris_loan_loan_type', 'anyof', loanType],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
                columns: [
                    'internalid',
                    'custrecord_hris_loan_emi_amount',
                    'custrecord_hris_loan_loan_type',
                    'custrecord_hris_loan_emistartmonth',
                    'custrecord_hris_loan_emi_end_date'
                ]
            }).run().getRange({ start: 0, end: 1000 });

            if (searchLoanRec && searchLoanRec.length > 0) {
                for (let i = 0; i < searchLoanRec.length; i++) {
                    const endDate = searchLoanRec[i].getValue({ name: 'custrecord_hris_loan_emi_end_date' });
                    if (endDate) {
                        dupRecEndDate.push(endDate);
                    }
                }
                log.debug({
                    title: 'Previous end date',
                    details: searchLoanRec[0].getValue({ name: 'custrecord_hris_loan_emi_end_date' })
                });
                return dupRecEndDate;
            }
        } catch (e) {
            log.error({ title: 'Error in searchDuplicateRec', details: e.message || e });
        }
        return [];
    };

    /**
     * Search pay group for employee from compensation change records sorted by internalid desc
     */
    const searchPayGroup = (employeeName) => {
        if (!employeeName) return '';
        try {
            const compChangeSearch = search.create({
                type: 'customrecord_hris_employee_compen_change',
                filters: [
                    ['custrecord_hris_empchange_employee_nam', 'anyof', employeeName],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
                columns: [
                    search.createColumn({
                        name: 'internalid',
                        sort: search.Sort.DESC
                    }),
                    'custrecord_hris_empchange_emp_pay_pro_gp'
                ]
            }).run().getRange({ start: 0, end: 1 });

            if (compChangeSearch && compChangeSearch.length > 0) {
                return compChangeSearch[0].getValue({ name: 'custrecord_hris_empchange_emp_pay_pro_gp' }) || '';
            }
        } catch (e) {
            log.error({ title: 'Error in searchPayGroup', details: e.message || e });
        }
        return '';
    };

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - Mode in which the record is loaded
     */
    const pageInit = (scriptContext) => {
        try {
            if (scriptContext.mode === 'create') {
                const currentRecord = scriptContext.currentRecord;
                const empVal = currentRecord.getValue({ fieldId: 'custrecord_hris_loan_emp_name' });
                log.debug({ title: 'pageInit empVal', details: empVal });

                if (!isNullOrEmpty(empVal)) {
                    const payGrp = searchPayGroup(empVal);
                    log.debug({ title: 'pageInit payGrp', details: payGrp });
                    currentRecord.setValue({
                        fieldId: 'custrecord_hris_loan_process_group',
                        value: payGrp,
                        ignoreFieldChange: true
                    });
                }
            }
        } catch (e) {
            log.error({ title: 'Error in pageInit', details: e.message || e });
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

            if (fieldId === 'custrecord_hris_loan_emp_name') {
                const empVal = currentRecord.getValue({ fieldId: 'custrecord_hris_loan_emp_name' });
                if (!isNullOrEmpty(empVal)) {
                    const payGrp = searchPayGroup(empVal);
                    currentRecord.setValue({
                        fieldId: 'custrecord_hris_loan_process_group',
                        value: payGrp,
                        ignoreFieldChange: true
                    });
                } else {
                    currentRecord.setValue({
                        fieldId: 'custrecord_hris_loan_process_group',
                        value: '',
                        ignoreFieldChange: true
                    });
                }
            }

            if (fieldId === 'custrecord_hris_loan_amount') {
                const empId = currentRecord.getValue({ fieldId: 'custrecord_hris_loan_emp_name' });
                const loanAmt = parseFloat(currentRecord.getValue({ fieldId: 'custrecord_hris_loan_amount' })) || 0;
                const salAmt = parseFloat(currentRecord.getValue({ fieldId: 'custrecord_hris_loan_mon_approx_net' })) || 0;
                const loanType = currentRecord.getText({ fieldId: 'custrecord_hris_loan_loan_type' });
                const loanTypeVal = currentRecord.getValue({ fieldId: 'custrecord_hris_loan_loan_type' });

                const empGrade = SearchEmpGrade(empId);
                const ceilingAmt = searchLoanType(empGrade, loanType);

                // Preserve standard validation structure (original code was empty blocks, keeping for lookups/debug logging)
                log.debug({
                    title: 'Loan Amount check values',
                    details: { empGrade, ceilingAmt, loanAmt, salAmt, loanTypeVal }
                });
                if (loanAmt > ceilingAmt) {
                    // No action taken in original, logged here
                }
                if (String(loanTypeVal) === '2') {
                    if (salAmt < loanAmt) {
                        // No action taken in original, logged here
                    }
                }
            }

            if (fieldId === 'custrecord_hris_loan_emi_amount') {
                let emiAmt = currentRecord.getValue({ fieldId: 'custrecord_hris_loan_emi_amount' });
                let loanAmt = currentRecord.getValue({ fieldId: 'custrecord_hris_loan_amount' });
                emiAmt = parseFloat(emiAmt) || 0;
                loanAmt = parseFloat(loanAmt) || 0;

                if (emiAmt > loanAmt) {
                    alert('EMI Amount should not be greater than Loan Amount');
                    currentRecord.setValue({
                        fieldId: 'custrecord_hris_loan_emi_amount',
                        value: '',
                        ignoreFieldChange: true
                    });
                }
            }

            if (fieldId === 'custrecord_hris_loan_emistartmonth') {
                const emiStartVal = currentRecord.getValue({ fieldId: 'custrecord_hris_loan_emistartmonth' });
                log.debug({ title: 'emiStartVal', details: emiStartVal });

                if (emiStartVal) {
                    const date = parseDate(emiStartVal);
                    if (date) {
                        const noOfInstallVal = currentRecord.getValue({ fieldId: 'custrecord_hris_loan_no_of_install' });
                        const noOfInstall = (parseFloat(noOfInstallVal) || 0) - 1;
                        const strEmiStartDate = date.getDate();

                        let toDateValue = new Date(date.getTime());
                        toDateValue.setMonth(toDateValue.getMonth() + noOfInstall);
                        toDateValue = new Date(toDateValue.getFullYear(), toDateValue.getMonth() + 1, 0);

                        const lastDayOfStartMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

                        if (strEmiStartDate !== lastDayOfStartMonth) {
                            alert('EMI start date should be END DATE of selected month');
                            currentRecord.setValue({
                                fieldId: 'custrecord_hris_loan_emistartmonth',
                                value: '',
                                ignoreFieldChange: true
                            });
                            currentRecord.setValue({
                                fieldId: 'custrecord_hris_loan_emi_end_date',
                                value: '',
                                ignoreFieldChange: true
                            });
                        } else {
                            currentRecord.setValue({
                                fieldId: 'custrecord_hris_loan_emi_end_date',
                                value: toDateValue,
                                ignoreFieldChange: true
                            });
                        }
                    }
                }
            }

            if (fieldId === 'custrecord_hris_loan_emi_end_date') {
                const emiEndDateVal = currentRecord.getValue({ fieldId: 'custrecord_hris_loan_emi_end_date' });
                if (emiEndDateVal) {
                    const strEndDate = parseDate(emiEndDateVal);
                    const emiStartDateVal = currentRecord.getValue({ fieldId: 'custrecord_hris_loan_emistartmonth' });
                    const strEmiStartDate = parseDate(emiStartDateVal);

                    if (strEmiStartDate && strEndDate < strEmiStartDate) {
                        alert('EMI End Month should be greater than EMI Start Month');
                        currentRecord.setValue({
                            fieldId: 'custrecord_hris_loan_emi_end_date',
                            value: '',
                            ignoreFieldChange: true
                        });
                        return;
                    }

                    const strEmiEndDate = strEndDate.getDate();
                    const lastDayOfEndMonth = new Date(strEndDate.getFullYear(), strEndDate.getMonth() + 1, 0).getDate();

                    if (strEmiEndDate !== lastDayOfEndMonth) {
                        alert('EMI end date should be END DATE of selected month');
                        currentRecord.setValue({
                            fieldId: 'custrecord_hris_loan_emi_end_date',
                            value: '',
                            ignoreFieldChange: true
                        });
                    }
                }
            }
        } catch (e) {
            log.error({ title: 'Error in fieldChanged', details: e.message || e });
        }
    };

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid to save
     */
    const saveRecord = (scriptContext) => {
        try {
            const currentRecord = scriptContext.currentRecord;
            const emiStartDateVal = currentRecord.getValue({ fieldId: 'custrecord_hris_loan_emistartmonth' });
            const emiEndDateVal = currentRecord.getValue({ fieldId: 'custrecord_hris_loan_emi_end_date' });

            const strEmiStartDate = parseDate(emiStartDateVal);
            const strEmiEndDate = parseDate(emiEndDateVal);

            log.debug({ title: 'saveRecord dates', details: { strEmiStartDate, strEmiEndDate } });

            if (strEmiEndDate && strEmiStartDate && strEmiEndDate < strEmiStartDate) {
                return false;
            }

            return true;
        } catch (e) {
            log.error({ title: 'Error in saveRecord', details: e.message || e });
            return true;
        }
    };

    return {
        pageInit,
        fieldChanged,
        saveRecord
    };
});
