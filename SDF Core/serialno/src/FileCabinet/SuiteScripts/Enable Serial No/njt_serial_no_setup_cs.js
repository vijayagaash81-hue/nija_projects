/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * 
 * Script Name: Serial No Setup CS
 * Record Type: customrecord_serial_no
 * Description: Client Script attached to customrecord_serial_no to sync dynamic Record Type select dropdown 
 *              with the hidden text field 'custrecord_record_type'.
 */
define([], () => {

    /**
     * Function to be executed after page is initialized.
     * @param {Object} context
     */
    const pageInit = (context) => {
        try {
            const currentRecord = context.currentRecord;
            const selectVal = currentRecord.getValue({ fieldId: 'custpage_recordtype_select' });
            if (selectVal) {
                currentRecord.setValue({
                    fieldId: 'custrecord_record_type',
                    value: selectVal,
                    ignoreFieldChange: true
                });
            }
        } catch (e) {
            console.error('Error in pageInit:', e);
        }
    };

    /**
     * Function to be executed when field is changed.
     * @param {Object} context
     */
    const fieldChanged = (context) => {
        try {
            if (context.fieldId === 'custpage_recordtype_select') {
                const selectedVal = context.currentRecord.getValue({ fieldId: 'custpage_recordtype_select' });
                context.currentRecord.setValue({
                    fieldId: 'custrecord_record_type',
                    value: selectedVal,
                    ignoreFieldChange: true
                });
            }
        } catch (e) {
            console.error('Error in fieldChanged:', e);
        }
    };

    /**
     * Function to be executed when record is saved.
     * @param {Object} context
     * @returns {boolean} Return true to save record
     */
    const saveRecord = (context) => {
        try {
            const selectedVal = context.currentRecord.getValue({ fieldId: 'custpage_recordtype_select' });
            if (selectedVal) {
                context.currentRecord.setValue({
                    fieldId: 'custrecord_record_type',
                    value: selectedVal,
                    ignoreFieldChange: true
                });
            }
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
