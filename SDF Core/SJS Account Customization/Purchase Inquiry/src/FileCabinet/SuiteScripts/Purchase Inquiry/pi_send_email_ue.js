/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @description User Event Script for the Purchase Inquiry (PI) record.
 *
 *  beforeLoad  – Adds the "Send Email" button in View mode.
 *
 *  NOTE: The PI Client Script (pi_send_email_cs.js) is deployed separately
 *        via its own Script record (customscript_pi_send_email_cs).
 *        This handles pageInit (field population), fieldChanged (vendor email),
 *        and sendVendorEmail (button action) automatically.
 *
 *  Deploy on: customrecord_njt_pur_inq
 */
define(['N/log'], (log) => {

    const beforeLoad = (context) => {
        try {
            // Add "Send Email" button only in View mode
            if (context.type !== context.UserEventType.VIEW) {
                return;
            }

            const rec = context.newRecord;
            const isEmailSent = rec.getValue('custrecord_email_sent');

            // If email has already been sent, do not show the "Send Email" button
            if (isEmailSent === true || isEmailSent === 'T') {
                return;
            }

            // Attach client script so sendVendorEmail function is available in View mode
            context.form.clientScriptModulePath = './pi_send_email_cs.js';

            context.form.addButton({
                id          : 'custpage_send_email',
                label       : 'Send Email',
                functionName: 'sendVendorEmail'
            });

        } catch (error) {
            log.error({
                title  : 'beforeLoad – pi_send_email_ue',
                details: error.message
            });
        }
    };

    return { beforeLoad };
});
