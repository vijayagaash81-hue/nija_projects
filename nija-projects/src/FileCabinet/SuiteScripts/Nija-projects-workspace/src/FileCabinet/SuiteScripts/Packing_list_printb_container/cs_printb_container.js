/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/dialog', 'N/url', 'N/currentRecord', 'N/record'], function (dialog, url, currentRecord, record) {

    function pageInit() {
        // Any initialization code can go here if needed
    }
    
    function openPrintDialog() {

        var rec = currentRecord.get();
        var recId = rec.id;
        var recType = rec.type;

        // In View mode, currentRecord.getLineCount can be unreliable.
        // Loading the record ensures we get the accurate backend line counts.
        record.load.promise({
            type: recType,
            id: recId,
            isDynamic: false
        }).then(function(loadedRec) {
            var drtLineCount = loadedRec.getLineCount({ sublistId: 'recmachcustrecord_njt_packing_list_drt' });
            var parentlinLineCount = loadedRec.getLineCount({ sublistId: 'recmachcustrecord_njt_packing_list_in_parentlin' });

            var dialogButtons = [];

            if (drtLineCount > 0) {
                dialogButtons.push({
                    label: '🖶 Packing List Old',
                    value: 't1'
                });
                dialogButtons.push({
                    label: '🖶 Packing List New',
                    value: 't2'
                });
            } 
            
            if (parentlinLineCount > 0) {
                dialogButtons.push({
                    label: '🖶 Packing List Pallet',
                    value: 't3'
                });
            }

            if (dialogButtons.length === 0) {
                dialog.alert({
                    title: 'No Items',
                    message: 'There is no item to print.'
                });
                return;
            }

            dialogButtons.push({
                label: '⤫ Close',
                value: 'close'
            });

            dialog.create({
                title: 'Select Print Option',
                message: 'Choose a template to print:',
                buttons: dialogButtons
            }).then(function (result) {
                var suiteletUrl;

                if (result === 't1') {
                    suiteletUrl = url.resolveScript({
                        scriptId: 'customscript529',
                        deploymentId: 'customdeploy1',
                        params: { customRecordId: recId }
                    });
                } else if (result === 't2') {
                    suiteletUrl = url.resolveScript({
                        scriptId: 'customscript550',
                        deploymentId: 'customdeploy1',
                        params: { recId: recId }
                    });
                } else if (result === 't3') {
                    suiteletUrl = url.resolveScript({
                        scriptId: 'customscript_sl_print_pdf',
                        deploymentId: 'customdeploy_sl_print_pdf',
                        params: { recId: recId, recType: recType }
                    });
                }

                if (suiteletUrl) {
                    window.open(suiteletUrl, '_blank');
                }
            });
        }).catch(function(e) {
            console.error('Error loading record for print checking: ', e);
        });
    }

    return {
        openPrintDialog: openPrintDialog,
        pageInit: pageInit
    };

}); // ꗈ