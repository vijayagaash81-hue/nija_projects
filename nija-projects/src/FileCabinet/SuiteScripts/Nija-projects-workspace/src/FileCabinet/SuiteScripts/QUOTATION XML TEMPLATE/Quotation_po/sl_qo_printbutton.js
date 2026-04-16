/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/file', 'N/render', 'N/record'], function(file, render, record) {

    // Helper function to convert numeric amount to words
    function convertAmountToWords(amount, currencySelection) {
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
             var decimalName = (currencySelection === 'AED') ? 'Fils' : 'Cents'; 
            finalStr += ' and ' + convertGroup(decimal).trim() + ' ' + decimalName;
        }

        return finalStr;
    }

    function onRequest(context) {

        var request = context.request;
        var response = context.response;

        var recId = request.parameters.recId;
        var recType = request.parameters.recType;

        // Load record
        var rec = record.load({
            type: recType,
            id: recId
        });

        var vendorId = rec.getValue({ fieldId: 'custrecord_njt_pq_vendor' });
        var vendorAddress = '';
        var vendorPhone = '';

        if (vendorId) {
            try {
                var vendorRec = record.load({ type: record.Type.VENDOR, id: vendorId });
                
                vendorAddress = vendorRec.getValue({ fieldId: 'defaultaddress' });
                vendorPhone = vendorRec.getValue({ fieldId: 'phone' });
            } catch (e) {
                // Fail silently if vendor cannot be loaded (e.g. deleted or permissions issue)
            }
        }

        // Load XML file (replace with your file ID)
        var xmlFile = file.load({
            id: 2438
        });

        var xmlContent = xmlFile.getContents();

        // Create renderer
        var renderer = render.create();

        renderer.templateContent = xmlContent;

        renderer.addRecord({
            templateName: 'record',
            record: rec
        });

        var totalAmount = rec.getValue({ fieldId: 'custrecord_total' });
        var amountInWords = convertAmountToWords(totalAmount, 'AED'); // Assuming AED for Purchase quotation

        renderer.addCustomDataSource({
            format: render.DataSource.OBJECT,
            alias: 'customData',
            data: {
                totalWords: amountInWords,
                vendorAddress: vendorAddress || '',
                vendorPhone: vendorPhone || ''
            }
        });

        var pdfFile = renderer.renderAsPdf();

        response.writeFile(pdfFile, true);
    }

    return {
        onRequest: onRequest
    };

}); // ꗈ