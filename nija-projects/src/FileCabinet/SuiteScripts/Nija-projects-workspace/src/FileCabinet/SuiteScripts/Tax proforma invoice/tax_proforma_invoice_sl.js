/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/render', 'N/record', 'N/file'], function(render, record, file) {

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
        // 1. Get parameters passed from the Client Script
        var recordId = context.request.parameters.customRecordId;
        var currencySelection = context.request.parameters.currencyFormat; // 'AED' or 'USD'

        // 2. Load the transaction record (Invoice/Credit Memo) using the ID
        // Note: Replace 'invoice' with the actual record type if it's a custom record
        var rec = record.load({
            type: record.Type.INVOICE, 
            id: recordId
        });
        // var subsidiaryId= rec.getValue({ fieldID:'subsidiary'});
        // log.debug('Subsidiary Id', subsidiaryId);
        // var vatRegNumber='';
        // if(subsidiaryId){
        //    try{
        //      var subsidiaryRec=record.load({
        //        type: record.Type.SUBSIDIARY,
        //        id: subsidiaryId
        //      });
        //      vatRegNumber=subsidiaryRec.getValue({
        //        fieldId:'federalidnumber'
        //      });
        //      log.debug('VAT reg number',vatRegNumber);
        //    } catch(e){
        //      log.error('Error Loading subsidiary',e);
        //    }
        // }
        // 3. Load your XML Template file from the File Cabinet
        // Replace '1234' with the actual Internal ID of your XML file in NetSuite
        var xmlFile = file.load({
            id: '2243' 
        });
        var xmlContent = xmlFile.getContents();

        // 4. Logic to handle AED vs USD labels without changing the XML file manually
        // This replaces the text "AED" in your XML with "USD" if the USD button was clicked
        if (currencySelection === 'AED') {
            xmlContent = xmlContent.replace(/AED/g, 'USD');
        }

        // 5. Initialize the Renderer engine
        var renderer = render.create();

        // 6. Set the XML content as the template for the renderer
        renderer.templateContent = xmlContent;

        // 7. Bind the record data to the template
        // This maps the ${record.entity}, ${record.item}, etc., in your XML
        renderer.addRecord({
            templateName: 'record',
            record: rec
        });

        // 7b. Convert the total to words and pass it as a custom data source
        var totalAmount = rec.getValue({ fieldId: 'total' });
        var amountInWords = convertAmountToWords(totalAmount, currencySelection);
        renderer.addCustomDataSource({
            format: render.DataSource.OBJECT,
            alias: 'customData',
            data: {
                totalWords: amountInWords,
                // varregnum:vatRegNumber
            }
        });

        // 8. Execute the rendering and generate a PDF file
        var pdfFile = renderer.renderAsPdf();

        // 9. Send the PDF to the user's browser to view/print
        context.response.writeFile({
            file: pdfFile,
            isInline: true // Opens in a new tab instead of downloading
        });
    }

    return {
        onRequest: onRequest
    };
});