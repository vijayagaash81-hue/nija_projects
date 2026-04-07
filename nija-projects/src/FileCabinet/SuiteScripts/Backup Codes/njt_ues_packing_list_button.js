/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/url','N/log'], function (ui, url,log) {

    function beforeLoad(context) {
        if (context.type !== context.UserEventType.VIEW) return;

        var form = context.form;
        var rec = context.newRecord;

        var salesOrderId = rec.id;
        var customerId = rec.getValue('entity');
        log.debug('customer',customerId);
        

        // Attach client script
        form.clientScriptModulePath = 'SuiteScripts/njt_cs_packing_list_default.js';

        // Add button
        form.addButton({
    id: 'custpage_packing_list_btn',
    label: 'Packing List',
    functionName: "openPackingList('" + salesOrderId + "','" + customerId + "')"
});
    }

    return {
        beforeLoad: beforeLoad
    };
});