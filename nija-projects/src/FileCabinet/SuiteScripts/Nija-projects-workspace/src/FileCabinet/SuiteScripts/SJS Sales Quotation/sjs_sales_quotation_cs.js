/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * 
 * Script Name: sjs_sales_quotation_cs.js
 * Description: Client Script to trigger PDF generation Suitelets for SJS Sales Quotation with layout choice dialog.
 */
define(['N/currentRecord', 'N/url', 'N/record', 'N/ui/dialog', 'N/log'], (currentrecord, url, record, dialog, log) => {

    /**
     * Function executed when page completes loading.
     * @param {Object} context
     */
    const pageInit = (context) => {
        // Entry point required by NetSuite Client Script specification
    };

    /**
     * Function triggered by custom "Print Sales Quotation" button.
     * Displays a dialog to choose between "Without Bank Details" and "With Bank Details".
     */
    const printSalesQuotation = () => {
        try {
            const currentRec = currentrecord.get();
            const recordId = currentRec.id;
            const recordType = currentRec.type || 'estimate';

            if (!recordId) {
                alert('Please save the record before printing.');
                return;
            }

            dialog.create({
                title: 'Print Sales Quotation',
                message: 'Please select the quotation print format:',
                buttons: [
                    { label: 'Without Bank Details', value: 1 },
                    { label: 'With Bank Details', value: 2 },
                    { label: 'Close', value: 0 }
                ]
            }).then((result) => {
                if (result === 0 || !result) {
                    return; // User clicked Close or dismissed dialog
                }

                let scriptId, deploymentId;

                if (result === 1) {
                    // Standard Sales Quotation (Without Bank Details)
                    scriptId = 'customscript_sjs_sales_quotation_sl';
                    deploymentId = 'customdeploy_sjs_sales_quotation_sl';
                } else if (result === 2) {
                    // Sales Quotation With Bank Details
                    scriptId = 'customscript_sjs_sales_quot_bank_sl';
                    deploymentId = 'customdeploy_sjs_sales_quot_bank_sl';
                } else {
                    return;
                }

                // Resolve the chosen Suitelet URL for generating the Sales Quotation PDF
                const suiteletURL = url.resolveScript({
                    scriptId: scriptId,
                    deploymentId: deploymentId,
                    params: {
                        customRecordId: recordId,
                        recordType: recordType
                    }
                });

                // Open the PDF in a new browser tab
                window.open(suiteletURL, '_blank');
            }).catch((err) => {
                log.error('Error displaying print dialog', err);
            });

        } catch (e) {
            log.error('Error in printSalesQuotation', e);
            alert('An error occurred while generating the PDF: ' + e.message);
        }
    };

    return {
        pageInit: pageInit,
        printSalesQuotation: printSalesQuotation
    };
});
