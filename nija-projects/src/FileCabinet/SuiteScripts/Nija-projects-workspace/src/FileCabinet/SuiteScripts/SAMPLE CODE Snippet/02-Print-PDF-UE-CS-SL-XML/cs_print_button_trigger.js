/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * 
 * Scenario: Printing PDF from Button using UE, CS, SL, and XML
 * Component: Client Script
 * Purpose: Handles client-side validations (e.g. checking status, checking if lines exist)
 *          before launching the Suitelet PDF generator.
 */
define(['N/url', 'N/ui/dialog', 'N/currentRecord'], (url, dialog, currentRecord) => {

    /**
     * Optional pageInit function
     */
    function pageInit(context) {
        console.log('[Print CS] Client Script initialized for PDF printing');
    }

    /**
     * Custom function invoked by the Print button
     * Defined globally or called via functionName binding
     */
    function onPrintPdfClick() {
        try {
            const currentRec = currentRecord.get();
            const recId = currentRec.id;
            const recType = currentRec.type;

            if (!recId) {
                dialog.alert({
                    title: 'Save Required',
                    message: 'Please save the record first before generating the PDF document.'
                });
                return;
            }

            // Optional Validation: Check approval or status before printing
            const approvalStatus = currentRec.getValue('custrecord_approval_status') || currentRec.getValue('approvalstatus');
            // If approval status is Rejected (e.g. 3), warn user:
            if (approvalStatus == '3') {
                dialog.alert({
                    title: 'Cannot Print',
                    message: 'This document has been rejected and cannot be printed.'
                });
                return;
            }

            // Resolve Suitelet URL dynamically
            const printSuiteletUrl = url.resolveScript({
                scriptId: 'customscript_njt_pdf_renderer_sl',
                deploymentId: 'customdeploy_njt_pdf_renderer_sl',
                params: {
                    recId: recId,
                    recType: recType
                }
            });

            // Open PDF in a new tab
            window.open(printSuiteletUrl, '_blank');

        } catch (e) {
            console.error('[Print CS] Error invoking print:', e);
            dialog.alert({
                title: 'Print Error',
                message: 'Failed to generate PDF: ' + (e.message || e)
            });
        }
    }

    return {
        pageInit: pageInit,
        onPrintPdfClick: onPrintPdfClick
    };
});
