/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/render', 'N/record', 'N/file', 'N/log'], function (render, record, file, log) {

    // Helper function to convert numeric amount to words
    function convertAmountToWords(amount, currencyText) {
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
            var decimalName = (currencyText === 'AED') ? 'Fils' : 'Cents'; 
            finalStr += ' and ' + convertGroup(decimal).trim() + ' ' + decimalName;
        }

        return finalStr;
    }

    function onRequest(context) {
        if (context.request.method === 'GET') {
            try {
                var reqId = context.request.parameters.recId;
                var reqType = context.request.parameters.recType;

                if (!reqId || !reqType) {
                    context.response.write('Missing parameters: Record ID or Record Type.');
                    return;
                }

                // 1. Load the corresponding transaction record
                var rec = record.load({
                    type: reqType,
                    id: reqId
                });

                // 2. Load the XML Template file from the File Cabinet
                // IMPORTANT: Replace 'PLACEHOLDER_XML_ID' with the internal ID of pttycash.xml
                var xmlFile = file.load({
                    id: '3179' 
                });

                // 3. Initialize the renderer
                var renderer = render.create();
                renderer.templateContent = xmlFile.getContents();

                var totalAmount = rec.getValue({ fieldId: 'total' }) || rec.getValue({ fieldId: 'payment' }) || rec.getValue({ fieldId: 'amount' });
                var currencyText = rec.getText({ fieldId: 'currency' });
                var amountInWords = convertAmountToWords(totalAmount, currencyText);

                renderer.addCustomDataSource({
                    format: render.DataSource.JSON,
                    alias: 'customData',
                    data: JSON.stringify({
                        totalWords: amountInWords
                    })
                });

                // 4. Bind the loaded record to the 'record' object used in FreeMarker (e.g., ${record.total})
                renderer.addRecord({
                    templateName: 'record',
                    record: rec
                });

                // 5. Render as PDF
                var pdfFile = renderer.renderAsPdf();

                // 6. Write the file to the browser
                context.response.writeFile({
                    file: pdfFile,
                    isInline: true // Opens inside the browser rather than forcing a direct download
                });
            } catch (e) {
                log.error('Error Generating Petty Cash Voucher PDF', e);
                context.response.write('An error occurred while generating the PDF: ' + e.message);
            }
        }
    }

    return {
        onRequest: onRequest
    };
});