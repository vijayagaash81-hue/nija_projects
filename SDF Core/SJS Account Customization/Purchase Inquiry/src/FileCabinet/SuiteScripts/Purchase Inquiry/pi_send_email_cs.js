/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @description Client Script for the Purchase Inquiry (PI) record.
 *
 *  pageInit        – Runs when a new PI record opens in CREATE mode.
 *                    Reads the PR ID from URL parameters (or the PR field)
 *                    and uses record.load to retrieve PR header and sublist lines,
 *                    populating PI header fields and child lines.
 *
 *  fieldChanged    – When custrecord_njt_pur_inq_pr changes, loads the PR
 *                    record and populates the PI header and sublist lines.
 *                    When custrecord_njt_pur_inq_vendor changes, looks up
 *                    the vendor's email and stores it in
 *                    custrecord_njt_pur_inq_ven_email.
 *
 *  sendVendorEmail – Triggered by the "Send Email" button. Reads all PI
 *                    body + line fields and sends an HTML email to the
 *                    vendor email stored on the record.
 *
 *  Deploy on: customrecord_njt_pur_inq  (attached via pi_send_email_ue.js)
 */
define(['N/currentRecord', 'N/search', 'N/email', 'N/runtime', 'N/log', 'N/record'],
    (currentRecord, search, email, runtime, log, record) => {

    let isPopulating = false;

    /**
     * Helper function to extract a query parameter from window.location
     */
    const getUrlParameter = (paramName) => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            let val = urlParams.get(paramName);
            if (!val && window.location.href.includes('?')) {
                const searchPart = window.location.href.split('?')[1].split('#')[0];
                const secondaryParams = new URLSearchParams(searchPart);
                val = secondaryParams.get(paramName);
            }
            return val;
        } catch (e) {
            console.warn('[PI] Could not parse URL parameter:', e.message);
            return null;
        }
    };

    /**
     * Loads the Purchase Request record using record.load and populates
     * the Purchase Inquiry header fields and sublist lines.
     *
     * @param {Record} rec - The current Purchase Inquiry record
     * @param {number|string} prId - Internal ID of the Purchase Request
     */
    const populateFromPR = (rec, prId) => {
        if (!prId || isPopulating) {
            return;
        }
        isPopulating = true;

        try {
            console.log('[PI] Loading Purchase Request record using record.load, PR ID:', prId);

            // 1. Ensure the PR link field is set on PI
            const currentPr = rec.getValue('custrecord_njt_pur_inq_pr');
            if (!currentPr || String(currentPr) !== String(prId)) {
                rec.setValue({
                    fieldId: 'custrecord_njt_pur_inq_pr',
                    value: Number(prId) || prId,
                    ignoreFieldChange: true
                });
            }

            // 2. Load the Purchase Request header record
            const prRecord = record.load({
                type: 'customrecord_njt_pur_req_h',
                id: prId,
                isDynamic: false
            });

            // 3. Retrieve PR Header fields
            const subsidiary = prRecord.getValue('custrecord_njt_pur_req_subsidery');
            const division   = prRecord.getValue('custrecord_njt_purchase_sjs_devison');
            const location   = prRecord.getValue('custrecord_njt_pur_req_loc');

            console.log('[PI] Retrieved PR header values:', { subsidiary, division, location });

            // 4. Set Header fields on PI
            if (subsidiary) {
                rec.setValue({
                    fieldId: 'custrecord_njt_pur_inq_subsidiary',
                    value: Number(subsidiary) || subsidiary,
                    ignoreFieldChange: true
                });
            }

            if (division) {
                rec.setValue({
                    fieldId: 'custrecord_njt_pur_inq_division',
                    value: Number(division) || division,
                    ignoreFieldChange: true
                });
            }

            if (location) {
                rec.setValue({
                    fieldId: 'custrecord_njt_pur_inq_location',
                    value: Number(location) || location,
                    ignoreFieldChange: true
                });
            }

            // 5. Retrieve PR Sublist lines and populate PI sublist
            const prSublistId = 'recmachcustrecord_njt_pur_req_det_pl';
            const piSublistId = 'recmachcustrecord_njt_pur_inq_link';

            const lineCount = prRecord.getLineCount({ sublistId: prSublistId });
            console.log('[PI] PR lineCount:', lineCount);

            // Cancel any active line in the edit buffer before clearing
            try {
                rec.cancelLine({ sublistId: piSublistId });
            } catch (cancelErr) {
                // Ignore if no line is currently being edited
            }

            // Clear any existing lines on the PI sublist first
            const existingLines = rec.getLineCount({ sublistId: piSublistId });
            for (let i = existingLines - 1; i >= 0; i--) {
                try {
                    rec.removeLine({
                        sublistId: piSublistId,
                        line: i,
                        ignoreRecalc: true
                    });
                } catch (err) {
                    console.warn('[PI] Could not remove line', i, err.message);
                }
            }

            // Populate lines from the loaded PR record
            let addedCount = 0;
            for (let i = 0; i < lineCount; i++) {
                const item = prRecord.getSublistValue({
                    sublistId: prSublistId,
                    fieldId: 'custrecord_njt_pur_req_det_item',
                    line: i
                });

                if (!item) {
                    continue;
                }

                const qty = prRecord.getSublistValue({
                    sublistId: prSublistId,
                    fieldId: 'custrecord_njt_pur_req_det_quantity',
                    line: i
                });

                const openQty = prRecord.getSublistValue({
                    sublistId: prSublistId,
                    fieldId: 'custrecord_njt_pur_req_open_quantity',
                    line: i
                });

                const lineQty = (qty !== null && qty !== undefined && qty !== '') ? qty : openQty;

                rec.selectNewLine({
                    sublistId: piSublistId
                });

                // Set Serial Number
                try {
                    rec.setCurrentSublistValue({
                        sublistId: piSublistId,
                        fieldId: 'custrecord_njt_pur_inq_child',
                        value: addedCount + 1,
                        ignoreFieldChange: true
                    });
                } catch (err) {
                    console.warn('[PI] Could not set serial no:', err.message);
                }

                // Set Item - fireSlavingSync forces NetSuite to synchronously wait
                // for dependent sourced fields (Description, Units) before proceeding
                rec.setCurrentSublistValue({
                    sublistId: piSublistId,
                    fieldId: 'custrecord_njt_pur_inq_child_item',
                    value: Number(item) || item,
                    ignoreFieldChange: false,
                    fireSlavingSync: true,
                    forceSyncSourcing: true
                });

                // Set Required Quantity
                if (lineQty !== undefined && lineQty !== null && lineQty !== '') {
                    rec.setCurrentSublistValue({
                        sublistId: piSublistId,
                        fieldId: 'custrecord_njt_pi_child_qty',
                        value: Number(lineQty),
                        ignoreFieldChange: true
                    });
                }

                rec.commitLine({
                    sublistId: piSublistId
                });

                addedCount++;
                console.log(`[PI] Committed line ${addedCount} (Item: ${item}, Qty: ${lineQty}). Current sublist line count: ${rec.getLineCount({ sublistId: piSublistId })}`);
            }

            console.log(`[PI] Prefill completed successfully. Added ${addedCount} line(s) from PR.`);

        } catch (e) {
            log.error({
                title: 'populateFromPR Error',
                details: e
            });
            console.error('[PI] Error in populateFromPR:', e);
            alert('Error loading Purchase Request data: ' + e.message);
        } finally {
            isPopulating = false;
        }
    };

    /* -----------------------------------------------------------------------
     * pageInit
     * Fires after the PI page loads in the browser (CREATE mode only).
     * Reads pr_id from URL query parameters (or PR field) and calls
     * populateFromPR which uses record.load to retrieve all PR fields & lines.
     * ----------------------------------------------------------------------- */
    const pageInit = (context) => {
        try {
            if (context.mode !== 'create') {
                return;
            }

            const rec = context.currentRecord;

            // Read PR ID from URL query parameters
            let prId = getUrlParameter('pr_id');

            // Fallback: check if the PR field on the record already has a value
            if (!prId) {
                prId = rec.getValue('custrecord_njt_pur_inq_pr');
            }

            console.log('[PI pageInit] PR ID resolved:', prId);

            if (prId) {
                // Short timeout gives NetSuite's client-side sublist machine time to finish UI initialization
                setTimeout(() => {
                    try {
                        const liveRec = currentRecord.get();
                        populateFromPR(liveRec, prId);
                    } catch (timeErr) {
                        console.error('[PI pageInit] Error in delayed populateFromPR:', timeErr);
                    }
                }, 200);
            }

        } catch (e) {
            log.error({
                title: 'PI pageInit Error',
                details: e
            });
            console.error('[PI pageInit] Error:', e);
            alert('Error populating Purchase Inquiry: ' + e.message);
        }
    };

    /* -----------------------------------------------------------------------
     * fieldChanged
     * 1. When custrecord_njt_pur_inq_pr changes, load the PR record and
     *    populate header fields and sublist lines.
     * 2. When custrecord_njt_pur_inq_vendor changes, look up that vendor's
     *    email address and auto-populate custrecord_njt_pur_inq_ven_email.
     * ----------------------------------------------------------------------- */
    const fieldChanged = (context) => {
        try {
            const rec = context.currentRecord;

            // When PR field changes
            if (context.fieldId === 'custrecord_njt_pur_inq_pr') {
                const prId = rec.getValue('custrecord_njt_pur_inq_pr');
                if (prId) {
                    populateFromPR(rec, prId);
                } else {
                    // Clear header fields and sublist if PR is removed
                    rec.setValue({ fieldId: 'custrecord_njt_pur_inq_subsidiary', value: '', ignoreFieldChange: true });
                    rec.setValue({ fieldId: 'custrecord_njt_pur_inq_division', value: '', ignoreFieldChange: true });
                    rec.setValue({ fieldId: 'custrecord_njt_pur_inq_location', value: '', ignoreFieldChange: true });

                    const sublistId = 'recmachcustrecord_njt_pur_inq_link';
                    const lineCount = rec.getLineCount({ sublistId });
                    for (let i = lineCount - 1; i >= 0; i--) {
                        try {
                            rec.removeLine({ sublistId, line: i, ignoreRecalc: true });
                        } catch (err) {
                            console.warn('[PI] Could not remove line', i, err.message);
                        }
                    }
                }
                return;
            }

            // When vendor field changes
            if (context.fieldId === 'custrecord_njt_pur_inq_vendor') {
                const vendorId = rec.getValue('custrecord_njt_pur_inq_vendor');

                if (!vendorId) {
                    rec.setValue({ fieldId: 'custrecord_njt_pur_inq_ven_email', value: '' });
                    return;
                }

                const vendorFields = search.lookupFields({
                    type   : search.Type.VENDOR,
                    id     : vendorId,
                    columns: ['email']
                });

                rec.setValue({
                    fieldId: 'custrecord_njt_pur_inq_ven_email',
                    value  : vendorFields.email || ''
                });
            }

        } catch (e) {
            log.error({ title: 'fieldChanged – pi_send_email_cs', details: e.message });
        }
    };

    /* -----------------------------------------------------------------------
     * sendVendorEmail
     * Triggered by the "Send Email" button on the PI record in View mode.
     * Collects PI body fields + all sublist lines and sends a formatted
     * HTML email to the vendor's email address on the record.
     * ----------------------------------------------------------------------- */
    const sendVendorEmail = () => {
        try {
            const rec = currentRecord.get();
            const piId = rec.id;

            // Load PI record directly if we have internal ID to ensure all lines are read
            let piRec = rec;
            if (piId) {
                try {
                    piRec = record.load({
                        type: 'customrecord_njt_pur_inq',
                        id: piId,
                        isDynamic: false
                    });
                } catch (loadErr) {
                    console.warn('[PI] Could not load record with record.load, using currentRecord', loadErr);
                    piRec = rec;
                }
            }

            // ---- Body fields ----
            const vendorEmail = piRec.getValue('custrecord_njt_pur_inq_ven_email');
            const vendorName  = piRec.getText ('custrecord_njt_pur_inq_vendor')     || '';
            const subsidiary  = piRec.getText ('custrecord_njt_pur_inq_subsidiary') || '';
            const prLink      = piRec.getText ('custrecord_njt_pur_inq_pr')         || piRec.getValue('custrecord_njt_pur_inq_pr') || '';
            const division    = piRec.getText ('custrecord_njt_pur_inq_division')   || '';
            const location    = piRec.getText ('custrecord_njt_pur_inq_location')   || '';

            if (!vendorEmail) {
                alert('No vendor email address found. Please select a vendor and ensure their email is populated.');
                return;
            }

            // ---- Sublist lines ----
            const sublistId = 'recmachcustrecord_njt_pur_inq_link';
            const lineCount = piRec.getLineCount({ sublistId });
            let lineRows    = '';

            for (let i = 0; i < lineCount; i++) {
                const serialNo  = piRec.getSublistValue({ sublistId, fieldId: 'custrecord_njt_pur_inq_child',       line: i }) || (i + 1);
                const itemText  = piRec.getSublistText ({ sublistId, fieldId: 'custrecord_njt_pur_inq_child_item',  line: i }) || piRec.getSublistValue({ sublistId, fieldId: 'custrecord_njt_pur_inq_child_item', line: i }) || '';
                const desc      = piRec.getSublistValue({ sublistId, fieldId: 'custrecord_njt_pi_child_des',        line: i }) || '';
                const descPo    = piRec.getSublistValue({ sublistId, fieldId: 'custrecord_njt_pi_child_des_po',     line: i }) || '';
                const units     = piRec.getSublistText ({ sublistId, fieldId: 'custrecord_njt_pi_child_units',      line: i }) || piRec.getSublistValue({ sublistId, fieldId: 'custrecord_njt_pi_child_units', line: i }) || '';
                const qty       = piRec.getSublistValue({ sublistId, fieldId: 'custrecord_njt_pi_child_qty',        line: i }) || '';
                const rate      = piRec.getSublistValue({ sublistId, fieldId: 'custrecord_njt_pi_child_rate',       line: i }) || '';

                lineRows += `
                    <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#ffffff'}">
                        <td style="padding:6px 10px;border:1px solid #ddd;">${serialNo}</td>
                        <td style="padding:6px 10px;border:1px solid #ddd;">${itemText}</td>
                        <td style="padding:6px 10px;border:1px solid #ddd;">${desc}</td>
                        <td style="padding:6px 10px;border:1px solid #ddd;">${descPo}</td>
                        <td style="padding:6px 10px;border:1px solid #ddd;">${units}</td>
                        <td style="padding:6px 10px;border:1px solid #ddd;">${qty}</td>
                        <td style="padding:6px 10px;border:1px solid #ddd;">${rate}</td>
                    </tr>`;
            }

            // ---- Build HTML email ----
            const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body  { font-family: Arial, sans-serif; color: #333; font-size: 13px; }
    h2    { color: #2c3e50; border-bottom: 2px solid #2980b9; padding-bottom: 6px; }
    .info-table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    .info-table td { padding: 6px 12px; border: 1px solid #ddd; }
    .info-table td:first-child { font-weight: bold; width: 200px; background: #f2f2f2; }
    .line-table { border-collapse: collapse; width: 100%; }
    .line-table th { background: #2980b9; color: #fff; padding: 8px 10px; border: 1px solid #2471a3; text-align: left; }
    .footer { margin-top: 30px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
  </style>
</head>
<body>

<h2>Purchase Inquiry – Request for Quotation</h2>
<p>Dear <strong>${vendorName}</strong>,</p>
<p>We would like to request a quotation for the items listed below. Please review the details and respond at your earliest convenience.</p>

<h3 style="color:#2c3e50;">Requested Items</h3>
<table class="line-table">
  <thead>
    <tr>
      <th>S.No</th><th>Item</th><th>Description</th>
      <th>Description as per PO</th><th>Units</th>
      <th>Required Qty</th><th>Rate</th>
    </tr>
  </thead>
  <tbody>
    ${lineRows || '<tr><td colspan="7" style="padding:10px;text-align:center;">No items found</td></tr>'}
  </tbody>
</table>

<p style="margin-top:20px;">Kindly provide your best price and delivery schedule for the above items.</p>
<p>Thank you for your time and cooperation.</p>

<div class="footer">This is a system-generated email from NetSuite. Please do not reply directly to this message.</div>
</body>
</html>`;

            email.send({
                author        : runtime.getCurrentUser().id,
                recipients    : [vendorEmail],
                subject       : `Purchase Inquiry – Quotation Request [PI #${piId || ''}]`,
                body          : emailBody,
                isInternalOnly: false
            });

            // Mark the Email Sent checkbox as checked on the Purchase Inquiry record
            if (piId) {
                try {
                    record.submitFields({
                        type   : 'customrecord_njt_pur_inq',
                        id     : piId,
                        values : {
                            custrecord_email_sent: true
                        },
                        options: {
                            enableSourcing        : false,
                            ignoreMandatoryFields : true
                        }
                    });
                    console.log('[PI] Marked custrecord_email_sent as true for PI ID:', piId);
                } catch (recErr) {
                    log.error({
                        title  : 'Error updating custrecord_email_sent',
                        details: recErr
                    });
                    console.error('[PI] Could not update custrecord_email_sent:', recErr);
                }
            }

            alert(`Email sent successfully to ${vendorEmail}`);

            // Reload the page to refresh status and hide the "Send Email" button
            window.location.reload();

        } catch (e) {
            log.error({ title: 'sendVendorEmail – pi_send_email_cs', details: e.message });
            alert('Error sending email: ' + e.message);
        }
    };

    return {
        pageInit,
        fieldChanged,
        sendVendorEmail
    };
});
