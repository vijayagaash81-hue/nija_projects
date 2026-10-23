/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * Description: Client Script to validate ESIC applicability on Employee record (Form 565).
 * Alerts the user if ESIC is unmarked ('F'), reminding them of the deduction period.
 * Converted from SuiteScript 1.0 to SuiteScript 2.1.
 */
define(['N/ui/dialog', 'N/log'], (dialog, log) => {

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

            if (fieldId === 'custentity_hris_isesiapplicable') {
                const customForm = currentRecord.getValue({ fieldId: 'customform' });
                log.debug('fieldChanged', `customform: ${customForm}, fieldId: ${fieldId}`);

                if (String(customForm) === '565') {
                    const isEsicApplicable = currentRecord.getValue({ fieldId: 'custentity_hris_isesiapplicable' });

                    if (isEsicApplicable === false || String(isEsicApplicable) === 'F') {
                        const alertMsg = 'ESIC has to deducted till September or March. Verify Employee Salary details';
                        if (dialog && typeof dialog.alert === 'function') {
                            dialog.alert({
                                title: 'ESIC Notice',
                                message: alertMsg
                            });
                        } else {
                            alert(alertMsg);
                        }
                    }
                }
            }
        } catch (e) {
            log.error('Error in fieldChanged', e);
        }
    };

    return {
        fieldChanged
    };
});
