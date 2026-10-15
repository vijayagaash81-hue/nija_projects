/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 * 
 * Script Name: sjs_sales_quotation_ue.js
 * Description: Adds custom "Print Sales Quotation" button on Estimate (Sales Quotation) record in View mode.
 */
define(['N/log'], (log) => {

    /**
     * Function executed before the page is loaded.
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {string} context.type - Trigger type
     * @param {Form} context.form - Current form object
     */
    const beforeLoad = (context) => {
        try {
            const form = context.form;
            
            // Attach Client Script for button handler
            form.clientScriptModulePath = 'SuiteScripts/Layouts/sjs_sales_quotation_cs.js';
            
            if (context.type === context.UserEventType.VIEW) {
                form.addButton({
                    id: 'custpage_print_sjs_quotation',
                    label: 'Print Sales Quotation',
                    functionName: 'printSalesQuotation()'
                });
                log.debug('beforeLoad', 'Print Sales Quotation button added successfully.');
            }
        } catch (e) {
            log.error('Error in beforeLoad of sjs_sales_quotation_ue.js', e);
        }
    };

    return {
        beforeLoad: beforeLoad
    };
});
