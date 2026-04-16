/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], function (serverWidget) {

    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {

            var form = context.form;

            form.clientScriptModulePath = './CS_PrintOptions.js';

            form.addButton({
                id: 'custpage_print_btn',
                label: 'Print',
                functionName: 'openPrintDialog'
            });
        }
    }

    return {
        beforeLoad: beforeLoad
    };

}); // ꗈ