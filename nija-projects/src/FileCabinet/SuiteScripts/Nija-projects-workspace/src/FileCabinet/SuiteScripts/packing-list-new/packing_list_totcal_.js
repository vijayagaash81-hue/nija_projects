/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/currentRecord'], function (currentRecord) {

    function validateLine(context) {
        try {
            var rec = currentRecord.get();

            var sublistId = 'recmachcustrecord_njt_packing_list_drt';

            // Run only for your sublist
            if (context.sublistId !== sublistId) {
                return true;
            }

            var lineCount = rec.getLineCount({ sublistId: sublistId });

            var concatValues = '';
            var totalValue = 0;

            for (var i = 0; i < lineCount; i++) {

                // Get text/number field for concatenation
                var textValue = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord_njt_packing_list_det_tbox',
                    line: i
                });

                if (textValue) {
                    if (concatValues) {
                        concatValues += ', ' + textValue;
                    } else {
                        concatValues = textValue;
                    }
                }

                // Get numeric field for sum
                var numValue = rec.getSublistValue({
                    sublistId: sublistId,
                    fieldId: 'custrecord1297',
                    line: i
                });

                if (numValue) {
                    totalValue += parseFloat(numValue) || 0;
                }
            }

            // Set concatenated value to body field
            rec.setValue({
                fieldId: 'custrecord1293',
                value: concatValues
            });

            // Set summed value to body field
            rec.setValue({
                fieldId: 'custrecord1294',
                value: totalValue
            });

        } catch (e) {
            console.log('Error in validateLine:', e);
        }

        return true;
    }

    return {
        validateLine: validateLine
    };

}); // ꗈ