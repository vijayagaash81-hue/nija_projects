/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], () => {

    const pageInit = (context) => {
        // Required pageInit entry point
    };

    const fieldChanged = (context) => {
        try {
            if (context.fieldId === 'custpage_recordtype_select') {
                const val = context.currentRecord.getValue({ fieldId: 'custpage_recordtype_select' });
                context.currentRecord.setValue({
                    fieldId: 'custrecord_record_type',
                    value: val,
                    ignoreFieldChange: true
                });
            }
        } catch (e) {
            console.error('Error in fieldChanged:', e);
        }
    };

    const saveRecord = (context) => {
        try {
            const val = context.currentRecord.getValue({ fieldId: 'custpage_recordtype_select' });
            context.currentRecord.setValue({
                fieldId: 'custrecord_record_type',
                value: val,
                ignoreFieldChange: true
            });
        } catch (e) {
            console.error('Error in saveRecord:', e);
        }
        return true;
    };

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        saveRecord: saveRecord
    };
});
