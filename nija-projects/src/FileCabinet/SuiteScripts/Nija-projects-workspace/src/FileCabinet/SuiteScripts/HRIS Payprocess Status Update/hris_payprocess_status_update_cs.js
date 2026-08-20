/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Description Client script to prevent duplicate Pay Process Status Update records from being created via UI.
 */
define(['N/search', 'N/ui/dialog', 'N/url'], (search, dialog, url) => {

    /**
     * Function definition to be triggered when record is saved.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid, false to prevent submission
     */
    const saveRecord = (scriptContext) => {
        const { currentRecord } = scriptContext;

        const employee = currentRecord.getValue({ fieldId: 'custrecord_hris_payupdate_employee' });
        const payMonth = currentRecord.getValue({ fieldId: 'custrecord_hris_payupdate_pay_month' });
        const payYear = currentRecord.getValue({ fieldId: 'custrecord_hris_payupdate_pay_year' });

        if (!employee || !payMonth || !payYear) {
            return true;
        }

        const filters = [
            ['custrecord_hris_payupdate_employee', 'anyof', employee],
            'and',
            ['custrecord_hris_payupdate_pay_month', 'anyof', payMonth],
            'and',
            ['custrecord_hris_payupdate_pay_year', 'anyof', payYear]
        ];

        // If editing an existing record, exclude it from duplicate check
        if (currentRecord.id) {
            filters.push('and');
            filters.push(['internalid', 'noneof', currentRecord.id]);
        }

        try {
            const duplicateSearch = search.create({
                type: 'customrecord_pay_process_status_update',
                filters: filters,
                columns: ['internalid']
            });

            const searchResults = duplicateSearch.run().getRange({ start: 0, end: 1 });

            if (searchResults && searchResults.length > 0) {
                const existingRecordId = searchResults[0].id;
                const recordUrl = url.resolveRecord({
                    recordType: 'customrecord_pay_process_status_update',
                    recordId: existingRecordId,
                    isEditMode: false
                });

                dialog.confirm({
                    title: 'Duplicate Record Found',
                    message: 'A Pay Process Status Update record already exists for this Employee, Month, and Year.\n\nWould you like to open and view the existing record?'
                }).then((confirmed) => {
                    if (confirmed) {
                        window.open(recordUrl, '_blank');
                    }
                }).catch((err) => {
                    console.error('Error showing duplicate dialog', err);
                });

                // Return false to prevent record submission
                return false;
            }
        } catch (e) {
            console.error('Error during duplicate validation', e);
        }

        return true;
    };

    return {
        saveRecord: saveRecord
    };
});
