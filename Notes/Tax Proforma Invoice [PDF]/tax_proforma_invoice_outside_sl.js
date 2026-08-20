/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/render', 'N/record', 'N/file'], function(render, record, file) {

    // Helper function to convert numeric amount to words
    function convertAmountToWords(amount, currencySelection) {

    var units = [
        '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six',
        'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
        'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'
    ];

    var tens = [
        '', '', 'Twenty', 'Thirty', 'Forty',
        'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
    ];

    var scales = ['', 'Thousand', 'Million', 'Billion'];

    var numStr = parseFloat(amount || 0).toFixed(2);
    var parts = numStr.split('.');

    var num = parseInt(parts[0], 10);
    var decimal = parseInt(parts[1], 10);

    function convertGroup(n) {

        var str = '';

        var h = Math.floor(n / 100);
        var t = n % 100;

        if (h > 0) {
            str += units[h] + ' Hundred ';
        }

        if (t > 0) {

            if (t < 20) {

                str += units[t];

            } else {

                var tenVal = Math.floor(t / 10);
                var unitVal = t % 10;

                str += tens[tenVal];

                if (unitVal > 0) {
                    str += '-' + units[unitVal];
                }
            }
        }

        return str.trim();
    }

    var wordStr = '';
    var scaleIdx = 0;

    while (num > 0) {

        var group = num % 1000;

        if (group > 0) {

            var groupWords = convertGroup(group);

            if (scales[scaleIdx]) {
                groupWords += ' ' + scales[scaleIdx];
            }

            wordStr = groupWords + ' ' + wordStr;
        }

        num = Math.floor(num / 1000);
        scaleIdx++;
    }

    wordStr = wordStr.trim();

    // Currency label
    var currencyName = (currencySelection === 'AED')
        ? 'Dirhams'
        : 'Dollars';

    var decimalName = (currencySelection === 'AED')
        ? 'Fils'
        : 'Cents';

    var finalStr = wordStr + ' ' + currencyName;

    if (decimal > 0) {
        finalStr += ' and ' + convertGroup(decimal) + ' ' + decimalName;
    }

    finalStr += '.';

    return finalStr;
}

    function onRequest(context) {
        // 1. Get parameters passed from the Client Script
        var recordId = context.request.parameters.customRecordId;
        var currencySelection = context.request.parameters.currencyFormat; // 'AED' or 'USD'

        // 2. Load the transaction record (Invoice/Credit Memo) using the ID
        // Note: Replace 'invoice' with the actual record type if it's a custom record
        var rec = record.load({
            type: record.Type.SALES_ORDER, 
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

        // Fetch customer default billing address from Address Book
        var customerId = rec.getValue({ fieldId: 'entity' });
        var addressData = {
            addressee: '',
            addr1: '',
            country: '',
            zip: '',
            state: '',
            city: '',
            formattedAddress: ''
        };

        if (customerId) {
            try {
                var customerRec = record.load({
                    type: record.Type.CUSTOMER,
                    id: customerId
                });

                var numAddresses = customerRec.getLineCount({ sublistId: 'addressbook' });
                for (var i = 0; i < numAddresses; i++) {
                    var isDefaultBilling = customerRec.getSublistValue({ sublistId: 'addressbook', fieldId: 'defaultbilling', line: i });
                    
                    if (isDefaultBilling) {
                        var addressSubrecord = customerRec.getSublistSubrecord({ sublistId: 'addressbook', fieldId: 'addressbookaddress', line: i });
                        
                        // addressData.addressee = addressSubrecord.getValue('addressee') || '';
                        addressData.addr1 = addressSubrecord.getValue('addr1') || '';
                        addressData.country = addressSubrecord.getText('country') || addressSubrecord.getValue('country') || '';
                        addressData.zip = addressSubrecord.getValue('zip') || '';
                        addressData.state = addressSubrecord.getValue('state') || '';
                        addressData.city = addressSubrecord.getValue('city') || '';
                        
                        // Format the address properly, making use of 'if' accordingly to avoid extra spaces/commas
                        var formattedStr = '';
                        // if (addressData.addressee) { formattedStr += addressData.addressee + '<br/>'; }
                        if (addressData.addr1) { formattedStr += addressData.addr1 + '<br/>'; }
                        
                        var line3 = '';
                        if (addressData.city) { line3 += addressData.city; }
                        if (addressData.state) { line3 += (line3 ? ', ' : '') + addressData.state; }
                        if (addressData.zip) { line3 += (line3 ? ' ' : '') + addressData.zip; }
                        
                        if (line3) { formattedStr += line3 + '<br/>'; }
                        if (addressData.country) { formattedStr += addressData.country; }
                        
                        addressData.formattedAddress = formattedStr;
                        break;
                    }
                }
            } catch (e) {
                log.error('Error fetching customer address', e.message);
            }
        }

        // 3. Load your XML Template file from the File Cabinet
        // Replace '1234' with the actual Internal ID of your XML file in NetSuite
        var xmlFile = file.load({
            id: '2607' 
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

        // 7b. Calculate NET AMOUNT and convert to words

var totalAmount = parseFloat(rec.getValue({ fieldId: 'total' }) || 0);
var discountAmount = parseFloat(rec.getValue({ fieldId: 'discounttotal' }) || 0);

// Advance Received field
var advanceClaim = parseFloat(rec.getValue({ fieldId: 'custbody3' }) || 0);

// Same calculation used in XML
var grossAmount = totalAmount - discountAmount - advanceClaim;
var vatAmount = grossAmount * 0.05;
var netAmount = grossAmount + vatAmount;

// Convert NET AMOUNT into words
var amountInWords = convertAmountToWords(netAmount, currencySelection);

renderer.addCustomDataSource({
    format: render.DataSource.OBJECT,
    alias: 'customData',
    data: {
        totalWords: amountInWords,
        addressInfo: addressData
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