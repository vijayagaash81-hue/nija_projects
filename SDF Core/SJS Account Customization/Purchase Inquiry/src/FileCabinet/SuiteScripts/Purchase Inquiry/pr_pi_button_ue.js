/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @description User Event Script for Purchase Request record.
 *              Adds a "Purchase Inquiry" button that opens the PI record
 *              in create mode with fields pre-populated from the PR.
 */
define(['N/log'], (log) => {

    /**
     * beforeLoad – runs when the PR record is loaded/viewed.
     * Adds the "Purchase Inquiry" button only when the record is in view mode
     * and the status condition allows it.
     */
    const beforeLoad = (context) => {
        try {
            // Only add the button in View mode (not on Edit / Create)
            if (context.type !== context.UserEventType.VIEW) {
                return;
            }

            const newRecord = context.newRecord;
            const status = newRecord.getValue('custrecord_njt_pur_req_status');

            // Show the button only for approved / relevant status
            // Adjust this condition to match your approved-status internal id
            if (!status) {
                return;
            }

            const form = context.form;

            // Attach the client script that contains createPurchaseInquiry()
            form.clientScriptModulePath = './pr_pi_button_cs.js';

            // Add the "Purchase Inquiry" button
            form.addButton({
                id: 'custpage_create_pi',
                label: 'Purchase Inquiry',
                functionName: 'createPurchaseInquiry'
            });

        } catch (error) {
            log.error({
                title: 'beforeLoad – pr_pi_button_ue',
                details: error.message
            });
        }
    };

    return {
        beforeLoad
    };
});
