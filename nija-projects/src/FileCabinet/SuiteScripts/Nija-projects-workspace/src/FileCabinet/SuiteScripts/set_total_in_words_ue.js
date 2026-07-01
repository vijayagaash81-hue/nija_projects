/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/log'], function(log) {

    // Helper function to convert numeric amount to words
    function convertAmountToWords(amount) {
        var units = [ '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen' ];
        var tens = [ '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety' ];
        var scales = [ '', 'Thousand', 'Million', 'Billion' ];

        var numStr = parseFloat(amount || 0).toFixed(2);
        var parts = numStr.split('.');
        var num = parseInt(parts[0], 10);
        var decimal = parseInt(parts[1], 10);

        if (num === 0 && decimal === 0) return 'Zero';

        function convertGroup(n) {
            var str = '';
            var h = Math.floor(n / 100);
            var t = n % 100;
            if (h > 0) {
                str += units[h] + ' Hundred ';
            }
            if (t > 0) {
                if (t < 20) {
                    str += units[t] + ' ';
                } else {
                    str += tens[Math.floor(t / 10)] + ' ';
                    if (t % 10 > 0) {
                        str += units[t % 10] + ' ';
                    }
                }
            }
            return str;
        }

        var wordStr = '';
        var scaleIdx = 0;
        var tempNum = num;
        if (tempNum === 0) {
            wordStr = 'Zero ';
        } else {
            while (tempNum > 0) {
                var group = tempNum % 1000;
                if (group > 0) {
                    var groupStr = convertGroup(group);
                    wordStr = groupStr + scales[scaleIdx] + ' ' + wordStr;
                }
                tempNum = Math.floor(tempNum / 1000);
                scaleIdx++;
            }
        }

        var finalStr = wordStr.trim();
        
        if (decimal > 0) {
            finalStr += ' and ' + convertGroup(decimal).trim() + ' Cents'; 
        }

        return finalStr;
    }

    function beforeSubmit(context) {
        // Ensure we do not execute this logic when a record is deleted
        if (context.type === context.UserEventType.DELETE) {
            return;
        }

        try {
            var newRecord = context.newRecord;
            
            // Retrieve the total value
            var totalAmount = newRecord.getValue({ fieldId: 'total' });

            // If total amount exists, convert it to words and set the custom field
            if (totalAmount !== null && totalAmount !== '') {
                var amountInWords = convertAmountToWords(totalAmount);
                
                newRecord.setValue({
                    fieldId: 'custbody_njt_tran_tiw',
                    value: amountInWords
                });
            }
        } catch (e) {
            log.error('Error in beforeSubmit - Set Total in Words', e.message);
        }
    }

    return {
        beforeSubmit: beforeSubmit
    };
}); // ꗈ