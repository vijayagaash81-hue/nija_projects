/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @description Client Script for Purchase Request record.
 *
 *  createPurchaseInquiry() – Reads header + sublist data from the current PR
 *                            and opens the PI new record page with the values
 *                            appended as URL query parameters.
 *                            The PI's pageInit reads them from window.location.
 *
 *  Deploy on: customrecord_njt_pur_req_h  (attached via pr_pi_button_ue.js)
 */
define(['N/url', 'N/currentRecord', 'N/log'],
    (url, currentRecord, log) => {

    const createPurchaseInquiry = () => {
        try {
            const rec = currentRecord.get();
            const prId = rec.id;

            if (!prId) {
                alert('Please save the Purchase Request before creating a Purchase Inquiry.');
                return;
            }

            // ---- Build URL for PI new record with PR ID ----
            const piBaseUrl = url.resolveRecord({
                recordType: 'customrecord_njt_pur_inq',
                isEditMode : true
            });

            const separator = piBaseUrl.includes('?') ? '&' : '?';
            const fullUrl   = `${piBaseUrl}${separator}pr_id=${encodeURIComponent(prId)}`;

            console.log('[PR→PI] Opening URL:', fullUrl);
            window.open(fullUrl, '_blank');

        } catch (e) {
            log.error({ title: 'createPurchaseInquiry', details: e.message });
            alert('Error: ' + e.message);
        }
    };

    return { createPurchaseInquiry };
});
