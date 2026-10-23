/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Description: User Event Script on Employee Compensation Change record:
 * 1. Validates employee identification code against forbidden special characters on beforeSubmit.
 * 2. Calculates gross salary breakdown (monthly, bi-monthly, daily, hourly, annually, CTC) across sublists on afterSubmit.
 * 3. Updates the linked Employee record's payroll process group (custentity_hris_emppayrollgroup).
 * Converted from SuiteScript 1.0 to SuiteScript 2.1.
 */
define(['N/record', 'N/error', 'N/log'], (record, error, log) => {

    /**
     * Executes before a record is submitted to the database.
     * Validates employee identification code.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     */
    const beforeSubmit = (scriptContext) => {
        try {
            const { type, newRecord } = scriptContext;

            if (type === scriptContext.UserEventType.DELETE) {
                return;
            }

            const empIdentification = newRecord.getValue({ fieldId: 'custrecord_hris_empchange_emp_identify' }) || '';
            if (empIdentification) {
                const forbiddenChars = /[@()~`!#$%^&*+=\-[\]\\';,/{}|":<>?.]/;
                if (forbiddenChars.test(empIdentification)) {
                    throw error.create({
                        name: 'INVALID_EMPLOYEE_IDENTIFICATION',
                        message: 'Employee Identification has special characters @()~`!#$%^&*+=-[]\\\';,/{}|":<>?. These are not allowed.',
                        notifyOff: false
                    });
                }
            }
        } catch (e) {
            if (e.name === 'INVALID_EMPLOYEE_IDENTIFICATION') throw e;
            log.error('Error in beforeSubmit', e);
        }
    };

    /**
     * Executes after a record is submitted.
     * Sums earnings, deductions, and other components to update parent gross/CTC totals,
     * and synchronizes the employee record's payroll group.
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
            log.debug('afterSubmit Gross & Employee Sync', `Record ID: ${recId}, Type: ${type}`);

            // Load the record to read all sublists
            const compRecord = record.load({
                type: recType,
                id: recId,
                isDynamic: false
            });

            let totalMonthlyEarn = 0.0;
            let totalAnnuallyEarn = 0.0;
            let totalBiMonthlyEarn = 0.0;
            let totalDailyEarn = 0.0;
            let totalHourlyEarn = 0.0;

            let totalMonthlyDed = 0.0;
            let totalAnnuallyDed = 0.0;

            let totalMonthlyOthers = 0.0;
            let totalAnnuallyOthers = 0.0;

            // 1. Earnings Sublist
            const earnLineCount = compRecord.getLineCount({ sublistId: 'recmachcustrecord_hris_employee_data_change' });
            for (let i = 0; i < earnLineCount; i++) {
                const mon = parseFloat(compRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_monthly',
                    line: i
                })) || 0;

                const ann = parseFloat(compRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_annually',
                    line: i
                })) || 0;

                const biMon = parseFloat(compRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_bi_monthly',
                    line: i
                })) || 0;

                const daily = parseFloat(compRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_daily',
                    line: i
                })) || 0;

                const hourly = parseFloat(compRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_hourly',
                    line: i
                })) || 0;

                totalMonthlyEarn += mon;
                totalAnnuallyEarn += ann;
                totalBiMonthlyEarn += biMon;
                totalDailyEarn += daily;
                totalHourlyEarn += hourly;
            }

            // 2. Deductions Sublist
            const dedLineCount = compRecord.getLineCount({ sublistId: 'recmachcustrecord_hris_employee_datachangeint' });
            for (let j = 0; j < dedLineCount; j++) {
                const mon = parseFloat(compRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_datachangeint',
                    fieldId: 'custrecord_hris_cdb_monthly',
                    line: j
                })) || 0;

                const ann = parseFloat(compRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_datachangeint',
                    fieldId: 'custrecord_hris_cdb_annually',
                    line: j
                })) || 0;

                totalMonthlyDed += mon;
                totalAnnuallyDed += ann;
            }

            // 3. Others Sublist
            const otherLineCount = compRecord.getLineCount({ sublistId: 'recmachcustrecord_hris_employee_data_change_int' });
            for (let k = 0; k < otherLineCount; k++) {
                const mon = parseFloat(compRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change_int',
                    fieldId: 'custrecord_hris_monthly',
                    line: k
                })) || 0;

                const ann = parseFloat(compRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change_int',
                    fieldId: 'custrecord_hris_annually',
                    line: k
                })) || 0;

                totalMonthlyOthers += mon;
                totalAnnuallyOthers += ann;
            }

            const ctc = totalAnnuallyEarn + totalAnnuallyDed + totalAnnuallyOthers;

            log.debug('Calculated Totals', {
                totalMonthlyEarn,
                totalAnnuallyEarn,
                totalBiMonthlyEarn,
                totalDailyEarn,
                totalHourlyEarn,
                ctc
            });

            // Update parent compensation record fields
            compRecord.setValue({ fieldId: 'custrecord_hris_empchange_month_cross_sy', value: totalMonthlyEarn });
            compRecord.setValue({ fieldId: 'custrecord_hris_empchange_annualgrosssly', value: totalAnnuallyEarn });
            compRecord.setValue({ fieldId: 'custrecord_hris_empchange_bimon_gros_sal', value: totalBiMonthlyEarn });
            compRecord.setValue({ fieldId: 'custrecord_hris_empchange_daily_grosssly', value: totalDailyEarn });
            compRecord.setValue({ fieldId: 'custrecord_hris_empchange_hourly_grs_sal', value: totalHourlyEarn });
            compRecord.setValue({ fieldId: 'custrecord_hris_empchange_ctc', value: isNaN(ctc) || ctc === 0 ? '' : ctc });

            compRecord.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });

            // Synchronize Employee record's payroll group
            const empId = newRecord.getValue({ fieldId: 'custrecord_hris_empchange_employee_nam' });
            const payGroupId = newRecord.getValue({ fieldId: 'custrecord_hris_empchange_emp_pay_pro_gp' });

            if (empId && payGroupId) {
                try {
                    record.submitFields({
                        type: record.Type.EMPLOYEE,
                        id: empId,
                        values: {
                            custentity_hris_emppayrollgroup: payGroupId
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });
                    log.debug('Employee Payroll Group Synchronized', `Employee ID: ${empId}, Pay Group: ${payGroupId}`);
                } catch (empErr) {
                    log.error('Failed to update employee payroll group', empErr);
                }
            }
        } catch (e) {
            log.error('Error in afterSubmit', e);
        }
    };

    return {
        beforeSubmit,
        afterSubmit
    };
});
