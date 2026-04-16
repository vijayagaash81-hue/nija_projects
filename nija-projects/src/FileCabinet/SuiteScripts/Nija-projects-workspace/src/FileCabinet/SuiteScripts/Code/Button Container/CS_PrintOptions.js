/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/dialog', 'N/url', 'N/currentRecord'], function (dialog, url, currentRecord) {

    function openPrintDialog() {

        var rec = currentRecord.get();
        var recId = rec.id;

        dialog.create({
            title: 'Select Print Option',
            message: 'Choose a template to print:',
            buttons: [
                {
                    label: 'Print Template 1',
                    value: 't1'
                },
                {
                    label: 'Print Template 2',
                    value: 't2'
                },
                {
                    label: 'Print Template 3',
                    value: 't3'
                }
            ]
        }).then(function (result) {

            var suiteletUrl;

            if (result === 't1') {
                suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_sl_print1',
                    deploymentId: 'customdeploy_sl_print1',
                    params: { recId: recId }
                });
            }

            if (result === 't2') {
                suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_sl_print2',
                    deploymentId: 'customdeploy_sl_print2',
                    params: { recId: recId }
                });
            }

            if (result === 't3') {
                suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_sl_print3',
                    deploymentId: 'customdeploy_sl_print3',
                    params: { recId: recId }
                });
            }

            if (suiteletUrl) {
                window.open(suiteletUrl, '_blank');
            }

        });
    }

    return {
        openPrintDialog: openPrintDialog
    };

}); // ꗈ