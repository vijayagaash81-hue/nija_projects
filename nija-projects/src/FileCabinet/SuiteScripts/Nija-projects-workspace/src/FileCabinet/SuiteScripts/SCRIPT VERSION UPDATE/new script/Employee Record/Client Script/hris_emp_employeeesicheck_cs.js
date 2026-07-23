/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Description Client Script to validate ESIC applicability on Employee record.
 */
define(['N/log', 'N/ui/dialog'], (log, dialog) => {

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

            if (fieldId === 'custentity_hris_isesiapplicable') {
                const customForm = currentRecord.getValue({ fieldId: 'customform' });
                log.debug({ title: 'customform', details: customForm });

                if (String(customForm) === '167') {
                    const isEsicApplicable = currentRecord.getValue({ fieldId: 'custentity_hris_isesiapplicable' });

                    if (isEsicApplicable === false || isEsicApplicable === 'F') {
                        dialog.alert({
                            title: 'ESIC Validation Warning',
                            message: 'ESIC has to deducted till September or March. Verify Employee Salary details'
                        });
                    }
                }
            }
        } catch (e) {
            log.error({ title: 'Error in fieldChanged', details: e.message || e });
        }
    };

    return {
        fieldChanged
    };
});
