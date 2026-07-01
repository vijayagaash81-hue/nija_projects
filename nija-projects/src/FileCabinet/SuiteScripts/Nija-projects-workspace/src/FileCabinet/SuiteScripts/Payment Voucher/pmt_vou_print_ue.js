/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], function (serverWidget) {
    
    function beforeLoad(context) {
        // We only want to add the button in VIEW mode
        if (context.type !== context.UserEventType.VIEW) {
            return;
        }

        var form = context.form;
        var recId = context.newRecord.id;
        var recType = context.newRecord.type;

        // Add the custom Print button
        form.addButton({
            id: 'custpage_print_pmt_vou_btn',
            label: 'Print Payment Voucher',
            functionName: 'printPaymentVoucher()' // Function defined in the inline script below
        });

        // Inject Client-Side logic directly into the form via an INLINEHTML field
        var inlineHtmlField = form.addField({
            id: 'custpage_pmt_vou_inline_script',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Inline Script'
        });

        // The client script injected directly inside the <script> tag
        inlineHtmlField.defaultValue = "<script>" +
            "function printPaymentVoucher() {" +
            "   require(['N/url'], function(url) {" +
            "       var suiteletUrl = url.resolveScript({" +
            "           scriptId: 'customscript_pmt_vou_print_sl', " +     // Ensure this matches your Suitelet Script ID
            "           deploymentId: 'customdeploy_pmt_vou_print_sl', " + // Ensure this matches your Suitelet Deployment ID
            "           params: { recId: '" + recId + "', recType: '" + recType + "' }" +
            "       });" +
            "       window.open(suiteletUrl, '_blank');" +
            "   });" +
            "}" +
            "</script>";
    }

    return {
        beforeLoad: beforeLoad
    };
});