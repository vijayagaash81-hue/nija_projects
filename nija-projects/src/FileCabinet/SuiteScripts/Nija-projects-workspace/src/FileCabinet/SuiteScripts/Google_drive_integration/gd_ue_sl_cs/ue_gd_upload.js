/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], function(serverWidget) {

    function beforeLoad(context) {
        if (context.type !== context.UserEventType.CREATE && 
            context.type !== context.UserEventType.EDIT) return;

        var form = context.form;

        form.clientScriptModulePath = './cs_gd_upload.js'; // adjust path

        var sublist = form.getSublist({
            id: 'recmachcustrecord_njt_teone_link' // your child sublist id
        });

        sublist.addField({
            id: 'custpage_upload_btn',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Upload'
        });

        // Inject JS function for clickable link
        form.addField({
            id: 'custpage_inline_js',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'inlinejs'
        }).defaultValue = '<script>' +
            'function triggerUpload(line){window.open("/app/site/hosting/scriptlet.nl?script=customscript_upload_sl&deploy=1&line="+line,"uploadWin","width=600,height=600");}' +
            '</script>';

    }

    return {
        beforeLoad: beforeLoad
    };

}); //ꗈ