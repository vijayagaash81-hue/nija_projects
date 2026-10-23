/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Description: User Event Script to maintain deduction totals and approximate net salary on Employee Compensation Change:
 * 1. On deletion of a deduction line, adjusts the parent compensation record deduction totals and net salary.
 * 2. On submit, recalculates total monthly/annual deductions and approximate net salary from child deduction records.
 * 3. Cleans up empty / unselected child component rows across compensation sublists.
 * Converted from SuiteScript 1.0 to SuiteScript 2.1.
 */
define(['N/record', 'N/search', 'N/log'], (record, search, log) => {

    /**
     * Executes before a record is submitted to the database.
     * When a deduction detail record is deleted, adjusts the parent compensation change record.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     */
    const beforeSubmit = (scriptContext) => {
        try {
            const { type, oldRecord } = scriptContext;

            if (type === scriptContext.UserEventType.DELETE && oldRecord) {
                const monthlyVal = parseFloat(oldRecord.getValue({ fieldId: 'custrecord_hris_cdd_monthly' })) || 0;
                const annualVal = parseFloat(oldRecord.getValue({ fieldId: 'custrecord_hris_cdd_annually' })) || 0;
                const parentId = oldRecord.getValue({ fieldId: 'custrecord_hris_employee_data_changeint' });

                log.debug('beforeSubmit DELETE Deduction Line', { parentId, monthlyVal, annualVal });

                if (parentId) {
                    const parentLookup = search.lookupFields({
                        type: 'customrecord_hris_employee_compen_change',
                        id: parentId,
                        columns: [
                            'custrecord_hris_empchange_mon_ded_amt',
                            'custrecord_hris_empchange_anual_ded_amt',
                            'custrecord_hris_empchange_aprox_monthly',
                            'custrecord_hris_empchange_apprx_annetsly'
                        ]
                    });

                    const currentMonDed = parseFloat(parentLookup.custrecord_hris_empchange_mon_ded_amt) || 0;
                    const currentAnnualDed = parseFloat(parentLookup.custrecord_hris_empchange_anual_ded_amt) || 0;
                    const currentMonNet = parseFloat(parentLookup.custrecord_hris_empchange_aprox_monthly) || 0;
                    const currentAnnualNet = parseFloat(parentLookup.custrecord_hris_empchange_apprx_annetsly) || 0;

                    const newMonDed = Math.max(0, currentMonDed - monthlyVal);
                    const newAnnualDed = Math.max(0, currentAnnualDed - annualVal);
                    const newMonNet = currentMonNet + monthlyVal;
                    const newAnnualNet = currentAnnualNet + annualVal;

                    record.submitFields({
                        type: 'customrecord_hris_employee_compen_change',
                        id: parentId,
                        values: {
                            custrecord_hris_empchange_mon_ded_amt: newMonDed,
                            custrecord_hris_empchange_anual_ded_amt: newAnnualDed,
                            custrecord_hris_empchange_aprox_monthly: newMonNet,
                            custrecord_hris_empchange_apprx_annetsly: newAnnualNet
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                    log.debug('Parent Record Deduction Adjusted on Delete', `Parent ID: ${parentId}`);
                }
            }
        } catch (e) {
            log.error('Error in beforeSubmit', e);
        }
    };

    /**
     * Executes after a record is submitted.
     * Recalculates total deductions and approximate net salary on the Employee Compensation Change record.
     * Cleans up any child records with empty/invalid component selection.
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

            const recId = newRecord.id;
            const recType = newRecord.type;
            log.debug('afterSubmit Deduction Calculation', `Record ID: ${recId}, Type: ${recType}`);

            const monthlyGrossSalary = parseFloat(newRecord.getValue({ fieldId: 'custrecord_hris_empchange_month_cross_sy' })) || 0;
            const annualGrossSalary = parseFloat(newRecord.getValue({ fieldId: 'custrecord_hris_empchange_annualgrosssly' })) || 0;

            // 1. Search all active compensation deduction detail records for this parent
            let monthlyTotal = 0;
            let annualTotal = 0;

            const dedSearch = search.create({
                type: 'customrecord_hris_compensation_detail_de',
                filters: [
                    ['custrecord_hris_employee_data_changeint', 'is', recId],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
                columns: ['custrecord_hris_cdd_monthly', 'custrecord_hris_cdd_annually']
            });

            dedSearch.run().each((result) => {
                const mon = parseFloat(result.getValue({ name: 'custrecord_hris_cdd_monthly' })) || 0;
                const ann = parseFloat(result.getValue({ name: 'custrecord_hris_cdd_annually' })) || 0;
                monthlyTotal += mon;
                annualTotal += ann;
                return true;
            });

            const approxMonthlyNet = monthlyGrossSalary - monthlyTotal;
            const approxAnnualNet = annualGrossSalary - annualTotal;

            log.debug('Deduction Totals Computed', { monthlyTotal, annualTotal, approxMonthlyNet, approxAnnualNet });

            record.submitFields({
                type: recType,
                id: recId,
                values: {
                    custrecord_hris_empchange_mon_ded_amt: monthlyTotal,
                    custrecord_hris_empchange_anual_ded_amt: annualTotal,
                    custrecord_hris_empchange_aprox_monthly: approxMonthlyNet,
                    custrecord_hris_empchange_apprx_annetsly: approxAnnualNet
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });

            // 2. Clean up empty/unselected child records across other/earn/benefit sublists
            cleanupEmptyChildRecords('customrecord_hris_compensation_detail_ot', 'custrecord_hris_employee_data_change_int', recId, 'custrecord_hris_payroll_component');
            cleanupEmptyChildRecords('customrecord_hris_compensation_details_e', 'custrecord_hris_employee_data_change', recId, 'custrecord_hris_cde_payroll_component');
            cleanupEmptyChildRecords('customrecord_hris_compensation_details_b', 'custrecord_hris_employee_datachangeint', recId, 'custrecord_hris_cdb_payroll_component');

        } catch (e) {
            log.error('Error in afterSubmit', e);
        }
    };

    /**
     * Cleans up child records where the payroll component was not selected or left empty.
     */
    const cleanupEmptyChildRecords = (recordType, parentFieldId, parentId, componentFieldId) => {
        try {
            const emptySearch = search.create({
                type: recordType,
                filters: [
                    [parentFieldId, 'is', parentId],
                    'AND',
                    [componentFieldId, 'anyof', '@NONE@']
                ],
                columns: ['internalid']
            });

            emptySearch.run().each((res) => {
                const childId = res.getValue({ name: 'internalid' });
                try {
                    record.delete({ type: recordType, id: childId });
                    log.debug('Cleaned up empty child record', `${recordType} ID: ${childId}`);
                } catch (delErr) {
                    log.error('Failed to delete empty child record', delErr);
                }
                return true;
            });
        } catch (searchErr) {
            log.error(`Error searching empty child records for ${recordType}`, searchErr);
        }
    };

    return {
        beforeSubmit,
        afterSubmit
    };
});
