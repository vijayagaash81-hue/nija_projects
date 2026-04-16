/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], function (serverWidget) {

    function beforeLoad(context) {
        try {
            if (
                context.type === context.UserEventType.CREATE ||
                context.type === context.UserEventType.EDIT ||
                context.type === context.UserEventType.VIEW
            ) {
                var form = context.form;

                //Add INLINE HTML field
                var htmlField = form.addField({
                    id: 'custpage_summary_html',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Summary'
                });

                // HTML UI (IDs must match Client Script)
                htmlField.defaultValue = `
                    <div id="summaryBox" style="
                        position: fixed;
                        right: 20px;
                        top: 150px;
                        width: 260px;
                        border: 1px solid #dcdcdc;
                        background: #ffffff;
                        padding: 12px;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                        border-radius: 6px;
                        font-family: Arial, sans-serif;
                        z-index: 9999;
                    ">
                        <h3 style="margin:0 0 10px 0;">Summary</h3>

                        <div style="display:flex; justify-content:space-between;">
                            <span>Amount:</span>
                            <span>₹ <span id="subTotal">0</span></span>
                        </div>

                        <div style="display:flex; justify-content:space-between;">
                            <span>Tax:</span>
                            <span>₹ <span id="taxTotal">0</span></span>
                        </div>

                        <hr style="margin:10px 0;">

                        <div style="display:flex; justify-content:space-between; font-weight:bold;">
                            <span>Total:</span>
                            <span>₹ <span id="grandTotal">0</span></span>
                        </div>
                    </div>
                `;

                // Attach your Client Script
                form.clientScriptModulePath = './summary_cl.js'; // update path if needed
            }
        } catch (e) {
            log.error('beforeLoad error', e);
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});