/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], () => {
    const pageInit = (context) => {
        // Nothing needed here
    };

    const fieldChanged = (context) => {
        // Handled via jQuery in SUT HTML
    };

    const validateLine = (context) => {
        // Handled via jQuery in SUT HTML
        return true;
    };

    const saveRecord = (context) => {
        if (typeof nsPicklistValidateAndBuildPayload === 'function') {
            var result = nsPicklistValidateAndBuildPayload();
            if (result === false) {
                return false;
            }
            context.currentRecord.setValue({
                fieldId: 'custpage_payload',
                value: JSON.stringify(result)
            });
            return true;
        }
        return true;
    };

    return {
        pageInit,
        fieldChanged,
        validateLine,
        saveRecord
    };
});
