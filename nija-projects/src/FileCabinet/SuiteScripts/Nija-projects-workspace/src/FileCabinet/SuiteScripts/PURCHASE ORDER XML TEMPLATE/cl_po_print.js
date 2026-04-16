/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord'], function(url, currentRecord) {

    function pageInit(context) {    

    }

    function printPDF() {

        var rec = currentRecord.get();

        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_sl_po_print_pdf',
            deploymentId: 'customdeploy_sl_po_print_pdf',
            params: {
                recId: rec.id,
                recType: rec.type
            }
        });

        window.open(suiteletUrl, '_blank');
    }

    return {
        pageInit: pageInit,
        printPDF: printPDF
    };

}); // ꗈ