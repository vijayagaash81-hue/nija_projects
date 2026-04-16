/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], function(serverWidget) {

    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {

            var form = context.form;

            form.clientScriptModulePath = './cl_printbutton.js';

            form.addButton({
                id: 'custpage_print_pdf',
                label: 'Print PDF',
                functionName: 'printPDF'
            });
        }
    }

    return {
        beforeLoad: beforeLoad
    };

}); // ꗈ