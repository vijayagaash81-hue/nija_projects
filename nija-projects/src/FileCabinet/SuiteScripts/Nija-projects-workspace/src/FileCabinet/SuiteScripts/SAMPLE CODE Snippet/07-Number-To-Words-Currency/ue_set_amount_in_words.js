/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Scenario: Number to Words Currency Conversion
 * Purpose: Deployed on Sales Order, Invoice, or Custom Payment Voucher.
 *          On beforeSubmit, extracts transaction 'total', converts it to AED Dirhams & Fils,
 *          and saves it into a custom field for PDF printing.
 */
define(['./util_number_to_words.js', 'N/log'], (numberToWords, log) => {

    const beforeSubmit = (context) => {
        try {
            // Run on CREATE and EDIT
            if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) {
                return;
            }

            const rec = context.newRecord;
            const totalAmount = parseFloat(rec.getValue('total')) || 0;

            if (totalAmount <= 0) return;

            // Determine currency unit based on transaction currency
            const currencyText = rec.getText('currency') || 'AED';
            let mainUnit = 'Dirhams';
            let subUnit = 'Fils';

            if (currencyText.includes('USD')) {
                mainUnit = 'Dollars';
                subUnit = 'Cents';
            } else if (currencyText.includes('EUR')) {
                mainUnit = 'Euros';
                subUnit = 'Cents';
            } else if (currencyText.includes('SAR')) {
                mainUnit = 'Saudi Riyals';
                subUnit = 'Halalas';
            }

            const amountInWords = numberToWords.toCurrencyWords(totalAmount, mainUnit, subUnit);

            rec.setValue({
                fieldId: 'custbody_total_amount_in_words',
                value: amountInWords
            });

            log.audit({
                title: 'Total in Words Updated',
                details: `Amount: ${totalAmount} -> Words: ${amountInWords}`
            });

        } catch (e) {
            log.error({ title: 'Error in beforeSubmit (Total in Words)', details: e });
        }
    };

    return { beforeSubmit };
});
