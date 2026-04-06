/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/ui/dialog'], function (dialog) {

    function lineInit(context) {
        var rec = context.currentRecord;

        if (context.sublistId === 'recmachcustrecord_njt_pro_2') {

            var lineId = rec.getCurrentSublistValue({
                sublistId: context.sublistId,
                fieldId: 'id' //  correct field
            });

            if (lineId) {
                dialog.alert({
                    title: 'Restricted',
                    message: 'You cannot edit existing lines. Only new lines allowed.'
                });

                // Move user out of edit mode
                setTimeout(function () {
                    rec.cancelLine({
                        sublistId: context.sublistId
                    });
                }, 100);

                return false;
            }
        }
        return true;
    }

    function validateLine(context) {
        var rec = context.currentRecord;

        if (context.sublistId === 'recmachcustrecord_njt_pro_2') {

            var lineId = rec.getCurrentSublistValue({
                sublistId: context.sublistId,
                fieldId: 'id' 
            });

            if (lineId) {
                dialog.alert({
                    title: 'Blocked',
                    message: 'Editing existing lines is not allowed.'
                });

                return false; 
            }
        }

        return true;
    }

    return {
        lineInit: lineInit,
        validateLine: validateLine
    };
});