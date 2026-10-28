/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * Script Name: NJT | Fynamics E-Invoice Button Handler (Client Script)
 * File Name: njt_cs_fynamics_einvoice_btn.js
 * Description: Client-side click handler and live progress polling modal for Fynamics E-Invoicing.
 *              Triggers the Map/Reduce script in the background via AJAX without interrupting
 *              the screen, keeps the loading popup visible while polling with search.lookupFields,
 *              and only reloads the page once the background process has fully completed.
 */

define(['N/currentRecord', 'N/search'], (currentRecord, search) => {

    const OVERLAY_ID = 'fynamics-einvoice-overlay';
    const STYLE_ID = 'fynamics-einvoice-styles';
    let pollIntervalId = null;

    /**
     * Injects required CSS animations and styles into document head.
     */
    const injectStyles = () => {
        if (document.getElementById(STYLE_ID)) return;

        const styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        styleEl.textContent = `
            @keyframes fynamics-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes fynamics-fade-in {
                0% { opacity: 0; transform: scale(0.96); }
                100% { opacity: 1; transform: scale(1); }
            }
            .fynamics-spinner {
                width: 46px;
                height: 46px;
                border: 4px solid #e2e8f0;
                border-top: 4px solid #0284c7;
                border-radius: 50%;
                animation: fynamics-spin 0.9s linear infinite;
                margin: 0 auto 16px;
            }
            .fynamics-btn {
                display: inline-block;
                padding: 9px 22px;
                border-radius: 6px;
                font-size: 13.5px;
                font-weight: 600;
                cursor: pointer;
                border: none;
                transition: background 0.2s ease;
            }
            .fynamics-btn-primary {
                background: #0284c7;
                color: #ffffff;
            }
            .fynamics-btn-primary:hover {
                background: #0369a1;
            }
            .fynamics-btn-secondary {
                background: #f1f5f9;
                color: #475569;
                margin-left: 8px;
            }
            .fynamics-btn-secondary:hover {
                background: #e2e8f0;
            }
        `;
        document.head.appendChild(styleEl);
    };

    /**
     * Builds and shows the loading popup modal overlay.
     * @param {string} title
     * @param {string} message
     * @param {string} badgeText
     */
    const showLoadingModal = (title, message, badgeText) => {
        injectStyles();

        let overlay = document.getElementById(OVERLAY_ID);
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = OVERLAY_ID;
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(15, 23, 42, 0.65);
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
                z-index: 9999999;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            `;

            overlay.innerHTML = `
                <div id="fynamics-modal-box" style="
                    background: #ffffff;
                    padding: 36px 40px;
                    border-radius: 14px;
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                    text-align: center;
                    width: 430px;
                    max-width: 90vw;
                    border: 1px solid #e2e8f0;
                    animation: fynamics-fade-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                ">
                    <div id="fynamics-modal-icon-container">
                        <div class="fynamics-spinner"></div>
                    </div>
                    <h3 id="fynamics-modal-title" style="margin: 0 0 8px; font-size: 19px; color: #0f172a; font-weight: 600;">
                        ${title || 'Generating E-Invoice'}
                    </h3>
                    <p id="fynamics-modal-desc" style="margin: 0 0 16px; font-size: 13.5px; color: #64748b; line-height: 1.55;">
                        ${message || 'Processing with Fynamics & ZATCA. Please wait...'}
                    </p>
                    <div id="fynamics-modal-badge" style="
                        display: inline-block;
                        padding: 4px 14px;
                        border-radius: 9999px;
                        background: #eff6ff;
                        color: #1d4ed8;
                        font-size: 11.5px;
                        font-weight: 600;
                        letter-spacing: 0.4px;
                        text-transform: uppercase;
                    ">
                        ${badgeText || 'PROCESSING'}
                    </div>
                    <div id="fynamics-modal-actions" style="display: none; margin-top: 24px;"></div>
                </div>
            `;
            document.body.appendChild(overlay);
        } else {
            // Update existing modal elements
            const titleEl = document.getElementById('fynamics-modal-title');
            const descEl = document.getElementById('fynamics-modal-desc');
            const badgeEl = document.getElementById('fynamics-modal-badge');
            if (titleEl) titleEl.textContent = title;
            if (descEl) descEl.textContent = message;
            if (badgeEl) badgeEl.textContent = badgeText;
        }
    };

    /**
     * Switches the modal to a green success state.
     * @param {string} title
     * @param {string} message
     */
    const showSuccessModal = (title, message) => {
        showLoadingModal(title, message, 'CLEARED');

        const iconContainer = document.getElementById('fynamics-modal-icon-container');
        if (iconContainer) {
            iconContainer.innerHTML = `
                <div style="width: 52px; height: 52px; border-radius: 50%; background: #ecfdf5; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
            `;
        }

        const badgeEl = document.getElementById('fynamics-modal-badge');
        if (badgeEl) {
            badgeEl.style.background = '#ecfdf5';
            badgeEl.style.color = '#059669';
            badgeEl.textContent = 'CLEARED';
        }
    };

    /**
     * Switches the modal to an error/warning state.
     * @param {string} title
     * @param {string} message
     * @param {string} badgeText
     */
    const showErrorModal = (title, message, badgeText) => {
        showLoadingModal(title, message, badgeText || 'FAILED');

        const iconContainer = document.getElementById('fynamics-modal-icon-container');
        if (iconContainer) {
            iconContainer.innerHTML = `
                <div style="width: 52px; height: 52px; border-radius: 50%; background: #fef2f2; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
            `;
        }

        const badgeEl = document.getElementById('fynamics-modal-badge');
        if (badgeEl) {
            badgeEl.style.background = '#fef2f2';
            badgeEl.style.color = '#dc2626';
            badgeEl.textContent = badgeText || 'FAILED';
        }

        const actionsEl = document.getElementById('fynamics-modal-actions');
        if (actionsEl) {
            actionsEl.style.display = 'block';
            actionsEl.innerHTML = `
                <button type="button" class="fynamics-btn fynamics-btn-primary" onclick="window.location.reload();">
                    Close & Refresh
                </button>
            `;
        }
    };

    /**
     * Helper to safely extract single string value from search lookup field results.
     */
    const extractLookupValue = (res, fieldId) => {
        if (!res || !res[fieldId]) return '';
        const val = res[fieldId];
        if (Array.isArray(val) && val.length > 0) {
            return val[0].text || val[0].value || '';
        }
        return String(val);
    };

    /**
     * Polls the Invoice fields periodically until the Map/Reduce script completes.
     * @param {string|number} invoiceId
     */
    const startPolling = (invoiceId) => {
        if (!invoiceId) return;

        let elapsedSeconds = 0;
        const POLL_INTERVAL_MS = 2500;
        const TIMEOUT_SECONDS = 180; // 3 minute maximum safety window

        if (pollIntervalId) {
            clearInterval(pollIntervalId);
            pollIntervalId = null;
        }

        pollIntervalId = setInterval(() => {
            elapsedSeconds += Math.round(POLL_INTERVAL_MS / 1000);

            try {
                const lookupRes = search.lookupFields({
                    type: search.Type.INVOICE,
                    id: invoiceId,
                    columns: [
                        'custbody_fynamics_einvoice_status',
                        'custbody_fynamics_error',
                        'custbody_fynamics_qr_code',
                        'custbody_fynamics_uuid'
                    ]
                });

                const status = extractLookupValue(lookupRes, 'custbody_fynamics_einvoice_status');
                const error = extractLookupValue(lookupRes, 'custbody_fynamics_error');
                const qrCode = extractLookupValue(lookupRes, 'custbody_fynamics_qr_code');

                console.log(`[Fynamics E-Invoice] Polling (${elapsedSeconds}s) - Status: "${status}"`);

                // If status is empty, or explicitly 'IN_PROGRESS', or 'PENDING' -> Map/Reduce is still executing
                const isStillRunning = !status || status === 'IN_PROGRESS' || status === 'PENDING';

                if (!isStillRunning) {
                    const upperStatus = status.toUpperCase();

                    // Successful clearance or warning
                    if (upperStatus.indexOf('CLEAR') !== -1 || upperStatus.indexOf('WARN') !== -1 || (qrCode && upperStatus.indexOf('FAIL') === -1)) {
                        clearInterval(pollIntervalId);
                        pollIntervalId = null;

                        showSuccessModal(
                            'E-Invoice Generated Successfully!',
                            `Status: ${status}. Loading updated invoice...`
                        );

                        // Reload page once to render the QR code image, clear status, and hide buttons
                        setTimeout(() => {
                            const cleanUrl = window.location.href
                                .replace(/([&?])generate_einvoice=T&?/g, '$1')
                                .replace(/[?&]$/, '');
                            window.location.href = cleanUrl;
                        }, 1400);
                        return;
                    }

                    // Failed or Rejected
                    if (upperStatus.indexOf('FAIL') !== -1 || upperStatus.indexOf('NOT_CLEAR') !== -1 || error) {
                        clearInterval(pollIntervalId);
                        pollIntervalId = null;

                        showErrorModal(
                            'E-Invoice Generation Failed',
                            error || `The invoice status is: ${status}. Please review the invoice and clearance logs.`,
                            status
                        );
                        return;
                    }
                }

                // Still in progress: update elapsed timer on the modal
                const descEl = document.getElementById('fynamics-modal-desc');
                if (descEl) {
                    descEl.textContent = `Connecting to Fynamics & clearing with ZATCA... (${elapsedSeconds}s)`;
                }

            } catch (pollErr) {
                console.warn('[Fynamics E-Invoice] Polling error:', pollErr);
            }

            // Safety timeout check
            if (elapsedSeconds >= TIMEOUT_SECONDS) {
                clearInterval(pollIntervalId);
                pollIntervalId = null;

                const actionsEl = document.getElementById('fynamics-modal-actions');
                if (actionsEl) {
                    actionsEl.style.display = 'block';
                    actionsEl.innerHTML = `
                        <button type="button" class="fynamics-btn fynamics-btn-primary" onclick="window.location.reload();">
                            Refresh Page Now
                        </button>
                    `;
                }

                const descEl = document.getElementById('fynamics-modal-desc');
                if (descEl) {
                    descEl.textContent = 'Processing is taking longer than expected in the background queue. You can refresh the page in a few moments to view the result.';
                }
            }

        }, POLL_INTERVAL_MS);
    };

    /**
     * Page init hook:
     * - Cleans URL if generate_einvoice=T was present.
     * - Resumes polling if an invoice is currently IN_PROGRESS or PENDING.
     * @param {Object} context
     */
    const pageInit = (context) => {
        try {
            const hasTriggerParam = window.location.search && window.location.search.indexOf('generate_einvoice=T') !== -1;

            if (hasTriggerParam && window.history && window.history.replaceState) {
                const cleanUrl = window.location.href
                    .replace(/([&?])generate_einvoice=T&?/g, '$1')
                    .replace(/[?&]$/, '');
                window.history.replaceState(null, document.title, cleanUrl);
            }

            const rec = context.currentRecord || currentRecord.get();
            const invoiceId = rec.id || window._fynamicsInvoiceId;
            if (!invoiceId) return;

            // Check if status on record is currently IN_PROGRESS or PENDING
            try {
                const checkRes = search.lookupFields({
                    type: search.Type.INVOICE,
                    id: invoiceId,
                    columns: ['custbody_fynamics_einvoice_status']
                });
                const curStatus = extractLookupValue(checkRes, 'custbody_fynamics_einvoice_status');
                if (curStatus === 'IN_PROGRESS' || curStatus === 'PENDING') {
                    showLoadingModal(
                        'Generating E-Invoice',
                        'Map/Reduce task is currently running in the background. Please wait...',
                        'PROCESSING'
                    );
                    startPolling(invoiceId);
                }
            } catch (e) {}

        } catch (e) {
            console.warn('[Fynamics E-Invoice] Error in pageInit:', e);
        }
    };

    /**
     * Handler invoked when the user clicks the "Generate E-Invoice" button on the Invoice.
     * 1. Confirms action with user.
     * 2. Immediately displays the persistent loading popup.
     * 3. Triggers the User Event in the background via AJAX (NO screen reload).
     * 4. Seamlessly starts polling until Map/Reduce completes.
     */
    const onGenerateEInvoice = () => {
        try {
            const rec = currentRecord.get();
            const invoiceId = rec.id;

            if (!invoiceId) {
                alert('Invoice ID not found.');
                return;
            }

            const confirmMsg = `Are you sure you want to generate the Fynamics E-Invoice for this record (Invoice ID: ${invoiceId})?`;
            const proceed = confirm(confirmMsg);
            if (!proceed) {
                return;
            }

            // 1. Immediately show the persistent loading popup
            showLoadingModal(
                'Generating E-Invoice',
                'Submitting background task to NetSuite queue... Please wait.',
                'PROCESSING'
            );

            // 2. Build the background trigger URL
            let triggerUrl = window.location.href;
            triggerUrl = triggerUrl.replace(/([&?])generate_einvoice=T&?/g, '$1').replace(/[?&]$/, '');
            const separator = triggerUrl.indexOf('?') === -1 ? '?' : '&';
            triggerUrl = `${triggerUrl}${separator}generate_einvoice=T`;

            // 3. Trigger User Event via AJAX in the background (prevents jarring screen reload)
            const sendBackgroundTrigger = () => {
                if (window.fetch) {
                    return fetch(triggerUrl, { credentials: 'same-origin' });
                } else {
                    return new Promise((resolve) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', triggerUrl, true);
                        xhr.onload = () => resolve(xhr);
                        xhr.onerror = () => resolve(null);
                        xhr.send();
                    });
                }
            };

            sendBackgroundTrigger()
                .then(() => {
                    console.log('[Fynamics E-Invoice] Background task submitted successfully. Polling for completion...');
                    const descEl = document.getElementById('fynamics-modal-desc');
                    if (descEl) {
                        descEl.textContent = 'Task queued. Connecting to Fynamics & clearing with ZATCA...';
                    }
                    startPolling(invoiceId);
                })
                .catch((err) => {
                    console.warn('[Fynamics E-Invoice] Background trigger notice:', err);
                    startPolling(invoiceId);
                });

        } catch (err) {
            alert('Error initiating E-Invoice generation: ' + err.message);
        }
    };

    // Expose onGenerateEInvoice globally for the NetSuite button functionName hook
    window.onGenerateEInvoice = onGenerateEInvoice;

    return {
        pageInit,
        onGenerateEInvoice
    };
});
