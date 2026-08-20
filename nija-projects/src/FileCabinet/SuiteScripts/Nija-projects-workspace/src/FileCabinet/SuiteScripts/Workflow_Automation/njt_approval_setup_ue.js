/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/ui/serverWidget', 'N/log'], (search, serverWidget, log) => {
    
    // A list of common standard record types that you want to support in the dropdown.
    // You can easily add or remove standard record types here.
    const STANDARD_RECORDS = [
        { value: 'purchaseorder', text: 'Purchase Order' },
        { value: 'salesorder', text: 'Sales Order' },
        { value: 'vendorbill', text: 'Vendor Bill' },
        { value: 'invoice', text: 'Invoice' },
        { value: 'expensereport', text: 'Expense Report' },
        { value: 'journalentry', text: 'Journal Entry' },
        { value: 'customer', text: 'Customer' },
        { value: 'vendor', text: 'Vendor' },
        { value: 'employee', text: 'Employee' },
        { value: 'itemreceipt', text: 'Item Receipt' },
        { value: 'opportunity', text: 'Opportunity' },
        { value: 'estimate', text: 'Quote / Estimate' }
    ];

    const beforeLoad = (context) => {
        try {
            if (context.type !== context.UserEventType.CREATE && 
                context.type !== context.UserEventType.EDIT && 
                context.type !== context.UserEventType.COPY) {
                return;
            }

            const form = context.form;
            
            // 1. Find the original record type text field
            const originalField = form.getField({ id: 'custrecord_record_type' });
            if (!originalField) {
                log.debug('beforeLoad', 'Original field custrecord_record_type not found on form.');
                return;
            }

            // 2. Hide the original text field
            originalField.displayType = serverWidget.FieldDisplayType.HIDDEN;

            // 3. Create the temporary select dropdown field
            const selectField = form.addField({
                id: 'custpage_recordtype_select',
                type: serverWidget.FieldType.SELECT,
                label: 'Record Type'
            });

            // Make it mandatory
            selectField.isMandatory = true;

            // Place it in the same layout position as the hidden text field
            form.insertField({
                field: selectField,
                nextfield: 'custrecord_record_type'
            });

            // 4. Add an empty option
            selectField.addSelectOption({ value: '', text: '- Select -' });

            // 5. Populate standard record options
            STANDARD_RECORDS.forEach(rec => {
                selectField.addSelectOption(rec);
            });

            // 6. Query and populate custom record options
            const customRecordSearch = search.create({
                type: 'customrecordtype',
                filters: [['isinactive', 'is', 'F']],
                columns: ['name', 'scriptid']
            });

            customRecordSearch.run().each(result => {
                let scriptId = result.getValue({ name: 'scriptid' });
                const name = result.getValue({ name: 'name' });

                if (scriptId) {
                    scriptId = scriptId.toLowerCase();
                    // Ensure custom records always have the 'customrecord_' prefix
                    if (scriptId.indexOf('customrecord_') !== 0) {
                        scriptId = 'customrecord_' + scriptId;
                    }
                    selectField.addSelectOption({
                        value: scriptId,
                        text: name
                    });
                }
                return true; // Continue iteration
            });

            // 7. If editing or copying, pre-populate the dropdown with the current value
            if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.COPY) {
                const currentValue = context.newRecord.getValue({ fieldId: 'custrecord_record_type' });
                if (currentValue) {
                    selectField.defaultValue = currentValue;
                }
            }

            // 8. Attach client script for client-side field validation and sync
            form.clientScriptModulePath = 'SuiteScripts/Workflow_Automation/njt_approval_setup_cs.js';

        } catch (e) {
            log.error('Error in beforeLoad', e);
        }
    };

    const beforeSubmit = (context) => {
        try {
            if (context.type !== context.UserEventType.CREATE && 
                context.type !== context.UserEventType.EDIT && 
                context.type !== context.UserEventType.COPY) {
                return;
            }

            const recordTypeVal = context.newRecord.getValue({ fieldId: 'custrecord_record_type' });
            log.debug('beforeSubmit', 'Value of custrecord_record_type at submission: ' + recordTypeVal);

        } catch (e) {
            log.error('Error in beforeSubmit', e);
        }
    };

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
    };
});
