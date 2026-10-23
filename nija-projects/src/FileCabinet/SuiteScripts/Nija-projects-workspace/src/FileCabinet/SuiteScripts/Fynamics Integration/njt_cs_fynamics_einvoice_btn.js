/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * Script Name: NJT | Fynamics E-Invoice Button Handler (Client Script)
 * File Name: njt_cs_fynamics_einvoice_btn.js
 * Description: Client-side click handler for the "Generate E-Invoice" button on the Invoice.
 *              Directly triggers the User Event script by reloading the record with
 *              generate_einvoice=T. No Suitelet is required.
 */

define(['N/currentRecord'], (currentRecord) => {

    /**
     * Page init hook required for Client Scripts.
     * Cleans the browser address bar immediately if generate_einvoice=T is present,
     * ensuring that subsequent page refreshes (F5 / Ctrl+R) will NOT re-trigger the Map/Reduce.
     * @param {Object} context
     */
    const pageInit = (context) => {
        try {
            if (window.location.search && window.location.search.indexOf('generate_einvoice=T') !== -1) {
                if (window.history && window.history.replaceState) {
                    const cleanUrl = window.location.href
                        .replace(/([&?])generate_einvoice=T&?/g, '$1')
                        .replace(/[?&]$/, '');
                    window.history.replaceState(null, document.title, cleanUrl);
                }
            }
        } catch (e) {
            console.warn('Could not clean URL:', e);
        }
    };

    /**
     * Handler invoked when the user clicks "Generate E-Invoice".
     * Prompts confirmation and reloads the current Invoice with trigger parameter.
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

            // Strip any existing generate_einvoice parameter to avoid duplication
            let currentUrl = window.location.href;
            currentUrl = currentUrl.replace(/([&?])generate_einvoice=T&?/g, '$1').replace(/[?&]$/, '');

            // Append &generate_einvoice=T to trigger User Event task submission
            const separator = currentUrl.indexOf('?') === -1 ? '?' : '&';
            window.location.href = `${currentUrl}${separator}generate_einvoice=T`;

        } catch (err) {
            alert('Error initiating E-Invoice generation: ' + err.message);
        }
    };

    // Expose onGenerateEInvoice globally so the button functionName can call it
    window.onGenerateEInvoice = onGenerateEInvoice;

    return {
        pageInit,
        onGenerateEInvoice
    };
});
