/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * Description: Client Script for salary structure formula calculation, rate breakdowns (monthly, annually, bi-monthly, daily, hourly),
 * dynamic component formula resolution, and gross salary / CTC summation on save.
 * Converted from SuiteScript 1.0 to SuiteScript 2.1.
 */
define(['N/search', 'N/record', 'N/log'], (search, record, log) => {

    /**
     * Executes when record is saved.
     * Calculates gross totals, ESIC cap validation, and CTC summation across all compensation sublists.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true to allow save
     */
    const saveRecord = (scriptContext) => {
        try {
            const { currentRecord } = scriptContext;
            let totalMonthlyEarn = 0.0;
            let totalAnnuallyEarn = 0.0;
            let totalBiMonthlyEarn = 0.0;
            let totalDailyEarn = 0.0;
            let totalHourlyEarn = 0.0;

            let totalMonthlyDed = 0.0;
            let totalAnnuallyDed = 0.0;

            let totalMonthlyOthers = 0.0;
            let totalAnnuallyOthers = 0.0;

            const REST_AMT = 15000;
            const esicCheck = currentRecord.getValue({ fieldId: 'custrecord_hris_empchange_esic_applicabe' });

            // 1. Calculate Earnings sublist totals
            const earnLineCount = currentRecord.getLineCount({ sublistId: 'recmachcustrecord_hris_employee_data_change' });
            for (let i = 0; i < earnLineCount; i++) {
                const monthlyEarn = parseFloat(currentRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_monthly',
                    line: i
                })) || 0;

                const annualEarn = parseFloat(currentRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_annually',
                    line: i
                })) || 0;

                const biMonthlyEarn = parseFloat(currentRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_bi_monthly',
                    line: i
                })) || 0;

                const dailyEarn = parseFloat(currentRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_daily',
                    line: i
                })) || 0;

                const hourlyEarn = parseFloat(currentRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_hourly',
                    line: i
                })) || 0;

                totalMonthlyEarn += monthlyEarn;
                totalAnnuallyEarn += annualEarn;
                totalBiMonthlyEarn += biMonthlyEarn;
                totalDailyEarn += dailyEarn;
                totalHourlyEarn += hourlyEarn;
            }

            // 2. Calculate Deductions sublist totals
            const dedLineCount = currentRecord.getLineCount({ sublistId: 'recmachcustrecord_hris_employee_datachangeint' });
            for (let i = 0; i < dedLineCount; i++) {
                const monthlyDed = parseFloat(currentRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_datachangeint',
                    fieldId: 'custrecord_hris_cdb_monthly',
                    line: i
                })) || 0;

                const annualDed = parseFloat(currentRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_datachangeint',
                    fieldId: 'custrecord_hris_cdb_annually',
                    line: i
                })) || 0;

                totalMonthlyDed += monthlyDed;
                totalAnnuallyDed += annualDed;
            }

            // 3. Calculate Others sublist totals
            const othersLineCount = currentRecord.getLineCount({ sublistId: 'recmachcustrecord_hris_employee_data_change_int' });
            for (let i = 0; i < othersLineCount; i++) {
                const monthlyOther = parseFloat(currentRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change_int',
                    fieldId: 'custrecord_hris_monthly',
                    line: i
                })) || 0;

                const annualOther = parseFloat(currentRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change_int',
                    fieldId: 'custrecord_hris_annually',
                    line: i
                })) || 0;

                totalMonthlyOthers += monthlyOther;
                totalAnnuallyOthers += annualOther;
            }

            // Set Header Gross totals
            currentRecord.setValue({ fieldId: 'custrecord_hris_empchange_month_cross_sy', value: totalMonthlyEarn });
            currentRecord.setValue({ fieldId: 'custrecord_hris_empchange_annualgrosssly', value: totalAnnuallyEarn });
            currentRecord.setValue({ fieldId: 'custrecord_hris_empchange_bimon_gros_sal', value: totalBiMonthlyEarn });
            currentRecord.setValue({ fieldId: 'custrecord_hris_empchange_daily_grosssly', value: totalDailyEarn });
            currentRecord.setValue({ fieldId: 'custrecord_hris_empchange_hourly_grs_sal', value: totalHourlyEarn });

            // ESIC limit verification
            if (totalMonthlyEarn > REST_AMT && (esicCheck === true || String(esicCheck) === 'T')) {
                alert('Gross Salary cannot Exceed 15000 since ESIC is Applicable to Employee');
            }

            // Set CTC
            const ctc = totalAnnuallyEarn + totalAnnuallyDed + totalAnnuallyOthers;
            if (isNaN(ctc) || ctc === 0) {
                currentRecord.setValue({ fieldId: 'custrecord_hris_empchange_ctc', value: '' });
            } else {
                currentRecord.setValue({ fieldId: 'custrecord_hris_empchange_ctc', value: ctc });
            }

            return true;
        } catch (e) {
            log.error('Error in saveRecord', e);
            return true;
        }
    };

    /**
     * Executes when a field is changed by a user or script.
     * Computes bi-monthly, daily, hourly, annual amounts, and dynamic formula calculations.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     */
    const fieldChanged = (scriptContext) => {
        try {
            const { currentRecord, sublistId, fieldId } = scriptContext;

            // 1. Earnings Monthly Amount Changed
            if (sublistId === 'recmachcustrecord_hris_employee_data_change' && fieldId === 'custrecord_hris_cde_monthly') {
                const monthPay = parseFloat(currentRecord.getCurrentSublistValue({
                    sublistId,
                    fieldId: 'custrecord_hris_cde_monthly'
                })) || 0;

                const weeklyOff = currentRecord.getText({ fieldId: 'custrecord_hris_empchange_working_days_w' });
                log.debug('Earnings Monthly Changed', { monthPay, weeklyOff });

                // Calculate Bi-Monthly
                if (weeklyOff) {
                    const biMonthly = (monthPay / 2).toFixed(2);
                    currentRecord.setCurrentSublistValue({ sublistId, fieldId: 'custrecord_hris_bi_monthly', value: biMonthly });
                } else {
                    currentRecord.setCurrentSublistValue({ sublistId, fieldId: 'custrecord_hris_bi_monthly', value: '' });
                }

                // Calculate Daily and Hourly based on 5 or 6 working days
                let daily = 0;
                if (weeklyOff === '5' || weeklyOff === 5) {
                    const fixNumber = parseFloat(searchPFValue(11)) || 1;
                    daily = ((monthPay / fixNumber) * 12).toFixed(2);
                    currentRecord.setCurrentSublistValue({ sublistId, fieldId: 'custrecord_hris_cde_daily', value: daily });
                } else if (weeklyOff === '6' || weeklyOff === 6) {
                    const fixNumber = parseFloat(searchPFValue(12)) || 1;
                    daily = ((monthPay / fixNumber) * 12).toFixed(2);
                    currentRecord.setCurrentSublistValue({ sublistId, fieldId: 'custrecord_hris_cde_daily', value: daily });
                } else {
                    currentRecord.setCurrentSublistValue({ sublistId, fieldId: 'custrecord_hris_cde_daily', value: '' });
                }

                if (parseFloat(daily) > 0) {
                    const hourly = (parseFloat(daily) / 8).toFixed(2);
                    currentRecord.setCurrentSublistValue({ sublistId, fieldId: 'custrecord_hris_hourly', value: hourly });
                } else {
                    currentRecord.setCurrentSublistValue({ sublistId, fieldId: 'custrecord_hris_hourly', value: '' });
                }

                // Calculate Annual Amount for standard CTC monthly earnings
                const payCompId = currentRecord.getCurrentSublistValue({ sublistId, fieldId: 'custrecord_hris_cde_payroll_component' });
                if (payCompId) {
                    const compLookup = search.lookupFields({
                        type: 'customrecord_hris_payroll_component',
                        id: payCompId,
                        columns: [
                            'custrecord_hris__ctc',
                            'custrecord_hris_benefits',
                            'custrecord_hris_pay_frequency',
                            'custrecord_hris_payroll_calculation_type'
                        ]
                    });

                    const chCtc = compLookup.custrecord_hris__ctc;
                    const chBenefits = compLookup.custrecord_hris_benefits;
                    const payFreq = compLookup.custrecord_hris_pay_frequency ? compLookup.custrecord_hris_pay_frequency[0]?.value : '';
                    const calcType = compLookup.custrecord_hris_payroll_calculation_type ? compLookup.custrecord_hris_payroll_calculation_type[0]?.value : '';

                    if (chCtc && !chBenefits && String(payFreq) === '1' && (String(calcType) === '1' || String(calcType) === '2')) {
                        const annual = monthPay * 12;
                        currentRecord.setCurrentSublistValue({ sublistId, fieldId: 'custrecord_hris_cde_annually', value: annual });
                    }
                }
            }

            // 2. Earnings Payroll Component Changed
            if (sublistId === 'recmachcustrecord_hris_employee_data_change' && fieldId === 'custrecord_hris_cde_payroll_component') {
                const payCompId = currentRecord.getCurrentSublistValue({ sublistId, fieldId });
                const payGroupId = currentRecord.getValue({ fieldId: 'custrecord_hris_empchange_emp_pay_pro_gp' });

                if (payCompId) {
                    const compLookup = search.lookupFields({
                        type: 'customrecord_hris_payroll_component',
                        id: payCompId,
                        columns: [
                            'custrecord_hris__ctc',
                            'custrecord_hris_benefits',
                            'custrecord_hris_pay_frequency',
                            'custrecord_hris_payroll_calculation_type',
                            'custrecord_hris_fixed_amount'
                        ]
                    });

                    const chCtc = compLookup.custrecord_hris__ctc;
                    const chBenefits = compLookup.custrecord_hris_benefits;
                    const payFreq = compLookup.custrecord_hris_pay_frequency ? compLookup.custrecord_hris_pay_frequency[0]?.value : '';
                    const calcType = compLookup.custrecord_hris_payroll_calculation_type ? compLookup.custrecord_hris_payroll_calculation_type[0]?.value : '';
                    const fixedAmt = compLookup.custrecord_hris_fixed_amount;

                    // Fixed amount component
                    if (chCtc && !chBenefits && String(payFreq) === '1' && String(calcType) === '1') {
                        if (fixedAmt !== '' && fixedAmt !== null && fixedAmt !== undefined) {
                            const fixedVal = parseFloat(fixedAmt);
                            currentRecord.setCurrentSublistValue({ sublistId, fieldId: 'custrecord_hris_cde_monthly', value: fixedVal });
                            currentRecord.setCurrentSublistValue({ sublistId, fieldId: 'custrecord_hris_cde_annually', value: fixedVal * 12 });
                        } else {
                            const curMonth = parseFloat(currentRecord.getCurrentSublistValue({ sublistId, fieldId: 'custrecord_hris_cde_monthly' })) || 0;
                            currentRecord.setCurrentSublistValue({ sublistId, fieldId: 'custrecord_hris_cde_annually', value: curMonth * 12 });
                        }
                    }

                    // Formula calculated component (Calc Type 3)
                    if (String(calcType) === '3' && String(payFreq) === '1') {
                        applyFormulaCalculation(currentRecord, sublistId, payCompId, payGroupId, calcType, 'custrecord_hris_cde_monthly', 'custrecord_hris_cde_annually');
                    }
                }
            }

            // 3. Deductions Payroll Component Changed
            if (sublistId === 'recmachcustrecord_hris_employee_datachangeint' && fieldId === 'custrecord_hris_cdb_payroll_component') {
                const payCompId = currentRecord.getCurrentSublistValue({ sublistId, fieldId });
                const payGroupId = currentRecord.getValue({ fieldId: 'custrecord_hris_empchange_emp_pay_pro_gp' });

                if (payCompId) {
                    const compLookup = search.lookupFields({
                        type: 'customrecord_hris_payroll_component',
                        id: payCompId,
                        columns: ['custrecord_hris_payroll_calculation_type', 'custrecord_hris_pay_frequency']
                    });

                    const calcType = compLookup.custrecord_hris_payroll_calculation_type ? compLookup.custrecord_hris_payroll_calculation_type[0]?.value : '';
                    const payFreq = compLookup.custrecord_hris_pay_frequency ? compLookup.custrecord_hris_pay_frequency[0]?.value : '';

                    if (String(calcType) === '3') {
                        applyFormulaCalculation(currentRecord, sublistId, payCompId, payGroupId, calcType, 'custrecord_hris_cdb_monthly', 'custrecord_hris_cdb_annually');
                    }
                }
            }

            // 4. Deductions Monthly Changed
            if (sublistId === 'recmachcustrecord_hris_employee_datachangeint' && fieldId === 'custrecord_hris_cdb_monthly') {
                const monthVal = parseFloat(currentRecord.getCurrentSublistValue({ sublistId, fieldId: 'custrecord_hris_cdb_monthly' })) || 0;
                currentRecord.setCurrentSublistValue({ sublistId, fieldId: 'custrecord_hris_cdb_annually', value: monthVal * 12 });
            }

            // 5. Others Payroll Component Changed
            if (sublistId === 'recmachcustrecord_hris_employee_data_change_int' && fieldId === 'custrecord_hris_payroll_component') {
                const payCompId = currentRecord.getCurrentSublistValue({ sublistId, fieldId });
                const payGroupId = currentRecord.getValue({ fieldId: 'custrecord_hris_empchange_emp_pay_pro_gp' });

                if (payCompId) {
                    const compLookup = search.lookupFields({
                        type: 'customrecord_hris_payroll_component',
                        id: payCompId,
                        columns: ['custrecord_hris_payroll_calculation_type', 'custrecord_hris_pay_frequency']
                    });

                    const calcType = compLookup.custrecord_hris_payroll_calculation_type ? compLookup.custrecord_hris_payroll_calculation_type[0]?.value : '';
                    const payFreq = compLookup.custrecord_hris_pay_frequency ? compLookup.custrecord_hris_pay_frequency[0]?.value : '';

                    if (String(calcType) === '3' && String(payFreq) === '2') {
                        applyFormulaCalculation(currentRecord, sublistId, payCompId, payGroupId, calcType, 'custrecord_hris_monthly', 'custrecord_hris_annually');
                    }
                }
            }
        } catch (e) {
            log.error('Error in fieldChanged', e);
        }
    };

    /**
     * Resolves formula tokens and evaluates mathematical result.
     */
    const applyFormulaCalculation = (currentRecord, sublistId, payCompId, payGroupId, calcType, monthlyFld, annualFld) => {
        try {
            const rawFormula = getFormula(payCompId, payGroupId, calcType);
            if (!rawFormula) return;

            log.debug('Applying Formula', `Formula: ${rawFormula}`);
            const tokens = rawFormula.split(' ');
            let resolvedFormula = rawFormula;

            const operators = ['*', '/', '+', '-', '(', ')', '%', '='];
            tokens.forEach((token) => {
                const trimmed = token.trim();
                if (trimmed && isNaN(trimmed) && !operators.includes(trimmed)) {
                    const compData = getComponentNameAndAmount(trimmed, currentRecord);
                    if (compData && compData.monthlyAmount !== undefined) {
                        resolvedFormula = resolvedFormula.replace(new RegExp(`\\b${trimmed}\\b`, 'g'), compData.monthlyAmount);
                    }
                }
            });

            log.debug('Resolved Formula Expression', resolvedFormula);
            // Safely evaluate formula with math expression
            // Replace any percent token like X% with (X/100)
            const sanitizedExpression = resolvedFormula.replace(/(\d+(\.\d+)?)%/g, '($1/100)');
            const computedMonthly = Function(`'use strict'; return (${sanitizedExpression})`)();

            if (!isNaN(computedMonthly)) {
                const monthlyNum = parseFloat(computedMonthly).toFixed(2);
                const annualNum = (parseFloat(monthlyNum) * 12).toFixed(2);

                currentRecord.setCurrentSublistValue({ sublistId, fieldId: monthlyFld, value: monthlyNum });
                currentRecord.setCurrentSublistValue({ sublistId, fieldId: annualFld, value: annualNum });
            }
        } catch (err) {
            log.error('Error applying formula', err);
        }
    };

    /**
     * Fetches formula expression from payroll component master.
     */
    const getFormula = (payCompId, payGroupId, calcType) => {
        try {
            const filters = [
                ['internalid', 'is', payCompId],
                'AND',
                ['custrecord_hris_payroll_calculation_type', 'is', calcType]
            ];
            if (payGroupId) {
                filters.push('AND');
                filters.push(['custrecord_hris_pay_process_group', 'is', payGroupId]);
            }

            const compSearch = search.create({
                type: 'customrecord_hris_payroll_component',
                filters,
                columns: ['custrecord_hris_pay_formula']
            });

            const results = compSearch.run().getRange({ start: 0, end: 1 });
            if (results && results.length > 0) {
                return results[0].getValue({ name: 'custrecord_hris_pay_formula' });
            }
        } catch (e) {
            log.error('Error fetching formula', e);
        }
        return '';
    };

    /**
     * Finds component name and current monthly amount across sublists.
     */
    const getComponentNameAndAmount = (componentName, currentRecord) => {
        // Search in Earnings sublist
        const earnCount = currentRecord.getLineCount({ sublistId: 'recmachcustrecord_hris_employee_data_change' });
        for (let i = 0; i < earnCount; i++) {
            const compText = currentRecord.getSublistText({
                sublistId: 'recmachcustrecord_hris_employee_data_change',
                fieldId: 'custrecord_hris_cde_payroll_component',
                line: i
            });
            if (compText === componentName) {
                const amount = parseFloat(currentRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change',
                    fieldId: 'custrecord_hris_cde_monthly',
                    line: i
                })) || 0;
                return { componentName: compText, monthlyAmount: amount };
            }
        }

        // Search in Deductions sublist
        const dedCount = currentRecord.getLineCount({ sublistId: 'recmachcustrecord_hris_employee_datachangeint' });
        for (let j = 0; j < dedCount; j++) {
            const compText = currentRecord.getSublistText({
                sublistId: 'recmachcustrecord_hris_employee_datachangeint',
                fieldId: 'custrecord_hris_cdb_payroll_component',
                line: j
            });
            if (compText === componentName) {
                const amount = parseFloat(currentRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_datachangeint',
                    fieldId: 'custrecord_hris_cdb_monthly',
                    line: j
                })) || 0;
                return { componentName: compText, monthlyAmount: amount };
            }
        }

        // Search in Others sublist
        const otherCount = currentRecord.getLineCount({ sublistId: 'recmachcustrecord_hris_employee_data_change_int' });
        for (let k = 0; k < otherCount; k++) {
            const compText = currentRecord.getSublistText({
                sublistId: 'recmachcustrecord_hris_employee_data_change_int',
                fieldId: 'custrecord_hris_payroll_component',
                line: k
            });
            if (compText === componentName) {
                const amount = parseFloat(currentRecord.getSublistValue({
                    sublistId: 'recmachcustrecord_hris_employee_data_change_int',
                    fieldId: 'custrecord_hris_monthly',
                    line: k
                })) || 0;
                return { componentName: compText, monthlyAmount: amount };
            }
        }

        return null;
    };

    /**
     * Searches global parameters table for specified sequence value.
     */
    const searchPFValue = (seqNo) => {
        try {
            const paramSearch = search.create({
                type: 'customrecord_hris_global_parameter',
                filters: [
                    ['custrecord_hris_gp_sequence_no', 'equalto', seqNo],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
                columns: ['custrecord_hris_gp_value']
            });
            const results = paramSearch.run().getRange({ start: 0, end: 1 });
            if (results && results.length > 0) {
                return results[0].getValue({ name: 'custrecord_hris_gp_value' });
            }
        } catch (e) {
            log.error('Error in searchPFValue', e);
        }
        return '';
    };

    return {
        saveRecord,
        fieldChanged
    };
});
