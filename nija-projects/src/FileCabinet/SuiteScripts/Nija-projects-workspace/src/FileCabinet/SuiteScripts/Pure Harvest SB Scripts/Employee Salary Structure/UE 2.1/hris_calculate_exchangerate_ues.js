/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Description: User Event Script to calculate and store the exchange rate converted amounts (in AED)
 * for monthly gross salary and annual gross salary based on the Pay Process Group's currency exchange rate.
 * Converted from SuiteScript 1.0 to SuiteScript 2.1.
 */
define(['N/record', 'N/search', 'N/log'], (record, search, log) => {

    /**
     * Executes after a record is submitted.
     * Calculates monthly and annual gross salary in AED based on the process group's exchange rate.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     */
    const afterSubmit = (scriptContext) => {
        try {
            const { type, newRecord } = scriptContext;

            if (type !== scriptContext.UserEventType.CREATE && type !== scriptContext.UserEventType.EDIT) {
                return;
            }

            const recordId = newRecord.id;
            const recordType = newRecord.type;
            log.debug('afterSubmit', `Record ID: ${recordId}, Type: ${type}`);

            const monthlyEarn = parseFloat(newRecord.getValue({ fieldId: 'custrecord_hris_empchange_month_cross_sy' })) || 0;
            const payGroupId = newRecord.getValue({ fieldId: 'custrecord_hris_empchange_emp_pay_pro_gp' });

            log.debug('Input Values', { monthlyEarn, payGroupId });

            let exchangeRate = 0;
            if (payGroupId) {
                const groupLookup = search.lookupFields({
                    type: 'customrecord_hris_process_groupmaster',
                    id: payGroupId,
                    columns: ['custrecord_hris_allowance_currency_excha']
                });

                const rateVal = groupLookup.custrecord_hris_allowance_currency_excha;
                if (rateVal !== null && rateVal !== undefined && rateVal !== '') {
                    exchangeRate = parseFloat(rateVal) || 0;
                }
            }

            log.debug('Exchange Rate Sourced', `exchangeRate: ${exchangeRate}`);

            const monthlyTotalAmountInAED = (monthlyEarn * exchangeRate).toFixed(2);
            const annualTotalInAED = (parseFloat(monthlyTotalAmountInAED) * 12).toFixed(2);

            log.debug('Calculated Totals in AED', { monthlyTotalAmountInAED, annualTotalInAED });

            record.submitFields({
                type: recordType,
                id: recordId,
                values: {
                    custrecord_hris_empchange_mon_gross: monthlyTotalAmountInAED,
                    custrecord_hris_empchange_an_gross_salar: annualTotalInAED
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });

            log.debug('Record Updated Successfully', `Record ID: ${recordId}`);
        } catch (e) {
            log.error('Error in afterSubmit', e);
        }
    };

    return {
        afterSubmit
    };
});
