/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Script Name: Serial No Setup UE
 * Record Type: customrecord_serial_no
 * Description: Dynamically populates standard and custom record types in a dropdown list field on the customrecord_serial_no form.
 *              When a record type is selected, populates its script ID into 'custrecord_record_type'.
 */
define(['N/search', 'N/ui/serverWidget', 'N/log'], (search, serverWidget, log) => {

    // Comprehensive list of standard NetSuite record types
    const STANDARD_RECORDS = [
        { value: 'purchaseorder', text: 'Purchase Order (purchaseorder)' },
        { value: 'salesorder', text: 'Sales Order (salesorder)' },
        { value: 'vendorbill', text: 'Vendor Bill (vendorbill)' },
        { value: 'invoice', text: 'Invoice (invoice)' },
        { value: 'expensereport', text: 'Expense Report (expensereport)' },
        { value: 'journalentry', text: 'Journal Entry (journalentry)' },
        { value: 'customer', text: 'Customer (customer)' },
        { value: 'vendor', text: 'Vendor (vendor)' },
        { value: 'employee', text: 'Employee (employee)' },
        { value: 'itemreceipt', text: 'Item Receipt (itemreceipt)' },
        { value: 'opportunity', text: 'Opportunity (opportunity)' },
        { value: 'estimate', text: 'Quote / Estimate (estimate)' },
        { value: 'purchaserequisition', text: 'Purchase Requisition (purchaserequisition)' },
        { value: 'transferorder', text: 'Transfer Order (transferorder)' },
        { value: 'creditmemo', text: 'Credit Memo (creditmemo)' },
        { value: 'returnauthorization', text: 'Return Authorization (returnauthorization)' },
        { value: 'workorder', text: 'Work Order (workorder)' },
        { value: 'assemblybuild', text: 'Assembly Build (assemblybuild)' },
        { value: 'inventoryadjustment', text: 'Inventory Adjustment (inventoryadjustment)' }
    ];

    /**
     * Function executed before page load.
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {string} context.type - User event type
     * @param {Form} context.form - Current form
     */
    const beforeLoad = (context) => {
        try {
            if (context.type !== context.UserEventType.CREATE && 
                context.type !== context.UserEventType.EDIT && 
                context.type !== context.UserEventType.COPY) {
                return;
            }

            const form = context.form;
            
            // 1. Find the original free-form text field 'custrecord_record_type'
            const originalField = form.getField({ id: 'custrecord_record_type' });
            if (!originalField) {
                log.debug('beforeLoad', 'Original field custrecord_record_type not found on form.');
                return;
            }

            // 2. Hide the original text field
            originalField.displayType = serverWidget.FieldDisplayType.HIDDEN;

            // 3. Create the temporary dynamic select dropdown field
            const selectField = form.addField({
                id: 'custpage_recordtype_select',
                type: serverWidget.FieldType.SELECT,
                label: 'Record Type'
            });

            // Set mandatory flag
            selectField.isMandatory = true;

            // Place dropdown in the same layout position as original field
            form.insertField({
                field: selectField,
                nextfield: 'custrecord_record_type'
            });

            // 4. Add default blank option
            selectField.addSelectOption({ value: '', text: '- Select Record Type -' });

            // 5. Populate standard record options
            STANDARD_RECORDS.forEach(rec => {
                selectField.addSelectOption(rec);
            });

            // 6. Query and populate custom record options from NetSuite metadata
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
                    // Ensure custom record script IDs maintain the 'customrecord_' prefix
                    if (scriptId.indexOf('customrecord_') !== 0) {
                        scriptId = 'customrecord_' + scriptId;
                    }
                    selectField.addSelectOption({
                        value: scriptId,
                        text: `${name} (${scriptId})`
                    });
                }
                return true;
            });

            // 7. Pre-select existing value in edit/copy mode
            if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.COPY) {
                const currentValue = context.newRecord.getValue({ fieldId: 'custrecord_record_type' });
                if (currentValue) {
                    selectField.defaultValue = currentValue;
                }
            }

            // 8. Attach Client Script for real-time field change synchronization
            form.clientScriptModulePath = 'SuiteScripts/Enable Serial No/njt_serial_no_setup_cs.js';

        } catch (e) {
            log.error('Error in beforeLoad', e);
        }
    };

    /**
     * Function executed before record submit to guarantee value persistence.
     * @param {Object} context
     */
    const beforeSubmit = (context) => {
        try {
            if (context.type !== context.UserEventType.CREATE && 
                context.type !== context.UserEventType.EDIT && 
                context.type !== context.UserEventType.COPY) {
                return;
            }

            const newRecord = context.newRecord;
            const selectedVal = newRecord.getValue({ fieldId: 'custpage_recordtype_select' });
            if (selectedVal) {
                newRecord.setValue({
                    fieldId: 'custrecord_record_type',
                    value: selectedVal
                });
            }
        } catch (e) {
            log.error('Error in beforeSubmit', e);
        }
    };

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
    };
});
