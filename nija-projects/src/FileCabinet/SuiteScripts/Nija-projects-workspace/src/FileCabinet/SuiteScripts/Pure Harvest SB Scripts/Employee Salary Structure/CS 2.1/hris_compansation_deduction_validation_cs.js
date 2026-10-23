/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * Description: Client Script to calculate annual deduction amounts from monthly input
 * and initialize process group on payroll component sublist lines.
 * Converted from SuiteScript 1.0 to SuiteScript 2.1.
 */
define(['N/log'], (log) => {

    /**
     * Executes when a field is changed by a user or script.
     * Calculates annual amount (monthly * 12) for body and sublist fields.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     */
    const fieldChanged = (scriptContext) => {
        try {
            const { currentRecord, sublistId, fieldId } = scriptContext;

            // Body field monthly deduction change
            if (!sublistId && fieldId === 'custrecord_hris_cdd_monthly') {
                const monthlyVal = currentRecord.getValue({ fieldId: 'custrecord_hris_cdd_monthly' });
                log.debug('Body Monthly Deduction Changed', `monthlyVal: ${monthlyVal}`);

                if (monthlyVal !== null && monthlyVal !== '' && monthlyVal !== undefined && !isNaN(monthlyVal)) {
                    const annualAmount = parseFloat(monthlyVal) * 12;
                    currentRecord.setValue({
                        fieldId: 'custrecord_hris_cdd_annually',
                        value: annualAmount
                    });
                } else {
                    currentRecord.setValue({
                        fieldId: 'custrecord_hris_cdd_annually',
                        value: ''
                    });
                }
            }

            // Sublist line monthly deduction change
            if (sublistId === 'recmachcustrecord_hris_employee_data_changeint' && fieldId === 'custrecord_hris_cdd_monthly') {
                const monthPay = currentRecord.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_changeint',
                    fieldId: 'custrecord_hris_cdd_monthly'
                });
                log.debug('Sublist Monthly Deduction Changed', `monthPay: ${monthPay}`);

                if (monthPay !== null && monthPay !== '' && monthPay !== undefined && !isNaN(monthPay)) {
                    const annualAmount = parseFloat(monthPay) * 12;
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_hris_employee_data_changeint',
                        fieldId: 'custrecord_hris_cdd_annually',
                        value: annualAmount
                    });
                } else {
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_hris_employee_data_changeint',
                        fieldId: 'custrecord_hris_cdd_annually',
                        value: ''
                    });
                }
            }
        } catch (e) {
            log.error('Error in fieldChanged', e);
        }
    };

    /**
     * Executes when an existing line is selected or when a new line is added to a sublist.
     * Preserves process group while resetting payroll component selection.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     */
    const lineInit = (scriptContext) => {
        try {
            const { currentRecord, sublistId } = scriptContext;

            if (sublistId === 'recmachcustrecord_hris_employee_data_change') {
                const payGrp = currentRecord.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_process_group'
                });

                currentRecord.setCurrentSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_payroll_component',
                    value: '',
                    ignoreFieldChange: true,
                    forceSyncSourcing: true
                });

                if (payGrp) {
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_hris_employee_data_change',
                        fieldId: 'custrecord_hris_cde_process_group',
                        value: payGrp,
                        ignoreFieldChange: true,
                        forceSyncSourcing: false
                    });
                }
            }
        } catch (e) {
            log.error('Error in lineInit', e);
        }
    };

    /**
     * Executes when record is saved.
     * @returns {boolean} Return true to allow save
     */
    const saveRecord = () => true;

    /**
     * Validation function to be executed when sublist line is committed.
     * @returns {boolean} Return true to commit line
     */
    const validateLine = () => true;

    return {
        fieldChanged,
        lineInit,
        saveRecord,
        validateLine
    };
});
