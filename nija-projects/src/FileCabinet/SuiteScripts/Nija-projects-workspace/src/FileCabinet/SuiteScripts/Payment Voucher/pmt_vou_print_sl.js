/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/render', 'N/record', 'N/file', 'N/log', 'N/search'], function (render, record, file, log, search) {

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

                // Ensure the Cheque Copy image is accessible to the PDF renderer
                var chequeImageId = rec.getValue({ fieldId: 'custbody8' });
                if (chequeImageId) {
                    try {
                        var imgFile = file.load({ id: chequeImageId });
                        if (!imgFile.isOnline) {
                            imgFile.isOnline = true;
                            imgFile.save();
                            log.debug('Image Permission Updated', 'Set isOnline to true for File ID: ' + chequeImageId);
                        }
                    } catch (imgErr) {
                        log.error('Error updating image permissions', imgErr.message);
                    }
                }

                // Get Bank Name from Account
                var accountId = rec.getValue({ fieldId: 'account' });
                var bankName = '';
                if (accountId) {
                    try {
                        // Using record.load instead of search.lookupFields prevents search column mapping errors
                        // and allows you to use the exact UI field IDs (like 'acctname' or 'sbankname').
                        var accountRec = record.load({
                            type: record.Type.ACCOUNT,
                            id: accountId
                        });

                        bankName = accountRec.getValue({ fieldId: 'sbankname' }) || 
                                   accountRec.getValue({ fieldId: 'acctname' }) || 
                                   accountRec.getValue({ fieldId: 'name' }) || 
                                   '';
                    } catch (e) {
                        log.error('Error fetching bank name', e.message);
                        bankName = rec.getText({ fieldId: 'account' }) || '';
                    }
                }

                // Get Subsidiary Address and Phone
                var subsidiaryId = rec.getValue({ fieldId: 'subsidiary' });
                var subsidiaryAddress = '';
                var subsidiaryPhone = '';
                if (subsidiaryId) {
                    try {
                        var subsidiaryRec = record.load({
                            type: record.Type.SUBSIDIARY,
                            id: subsidiaryId
                        });
                        subsidiaryAddress = subsidiaryRec.getValue({ fieldId: 'mainaddress_text' }) || '';
                        
                        // Remove the first line of the address to avoid repeating the Subsidiary Name
                        if (subsidiaryAddress) {
                            var addressLines = subsidiaryAddress.replace(/\r/g, '').split('\n');
                            if (addressLines.length > 1) {
                                addressLines.shift(); // Removes the first line
                                subsidiaryAddress = addressLines.join('\n');
                            }
                        }

                        try {
                            var mainAddressSubrec = subsidiaryRec.getSubrecord({ fieldId: 'mainaddress' });
                            subsidiaryPhone = mainAddressSubrec.getValue({ fieldId: 'addrphone' }) || '';
                        } catch (subErr) {
                            log.error('Error fetching address subrecord', subErr.message);
                        }
                    } catch (e) {
                        log.error('Error fetching subsidiary data', e.message);
                    }
                }

                // Build custom data source for applied lines
                var applyLines = [];
                var lineCount = rec.getLineCount({ sublistId: 'apply' });

                for (var i = 0; i < lineCount; i++) {
                    var isApplied = rec.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: i });
                    
                    // Check if line is applied ('T' or true)
                    if (isApplied === true || isApplied === 'T') {
                        var docId = rec.getSublistValue({ sublistId: 'apply', fieldId: 'doc', line: i });
                        var amount = rec.getSublistValue({ sublistId: 'apply', fieldId: 'amount', line: i });
                        var refnum = rec.getSublistValue({ sublistId: 'apply', fieldId: 'refnum', line: i });
                        
                        var transNum = refnum;
                        var projCode = '';

                        try {
                            // 1. Get the actual record type of the applied transaction using search
                            var typeLookup = search.lookupFields({
                                type: search.Type.TRANSACTION,
                                id: docId,
                                columns: ['recordtype']
                            });
                            
                            var rType = typeLookup.recordtype;
                            if (Array.isArray(rType) && rType.length > 0) {
                                rType = rType[0].value;
                            }

                            if (rType) {
                                // 2. Load the record based on its record type
                                var appliedRec = record.load({
                                    type: rType,
                                    id: docId
                                });
                                
                                // 3. Get Transaction Number and Project Code
                                transNum = appliedRec.getValue({ fieldId: 'transactionnumber' }) || appliedRec.getValue({ fieldId: 'tranid' }) || refnum;
                                projCode = appliedRec.getText({ fieldId: 'cseg_njt_seg_proj' }) || appliedRec.getValue({ fieldId: 'cseg_njt_seg_proj' }) || '';
                                log.debug("transactionnumber",transNum);
                                log.debug("cseg_njt_seg_proj",projCode);
                            }
                        } catch (e) {
                            log.error('Error loading applied record ID: ' + docId, e.message);
                        }

                        applyLines.push({
                            transactionnumber: transNum,
                            cseg_njt_seg_proj: projCode,
                            doc: refnum,
                            refnum: refnum,
                            amount: amount
                        });
                    }
                }

                // 2. Load the XML Template file from the File Cabinet
                // IMPORTANT: Change '3173' to the actual internal ID of your pmt_vou.xml file
                var xmlFile = file.load({
                    id: '3173' 
                });

                // 3. Initialize the renderer
                var renderer = render.create();
                renderer.templateContent = xmlFile.getContents();

                var totalAmount = rec.getValue({ fieldId: 'total' }) || rec.getValue({ fieldId: 'payment' }) || rec.getValue({ fieldId: 'amount' });
                var currencyText = rec.getText({ fieldId: 'currency' });
                var amountInWords = convertAmountToWords(totalAmount, currencyText);

                // Add the custom lines data to the renderer
                renderer.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: 'customApply',
                    data: { 
                        lines: applyLines,
                        bankName: bankName,
                        totalWords: amountInWords,
                        subsidiaryAddress: subsidiaryAddress,
                        subsidiaryPhone: subsidiaryPhone
                    }
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
                log.error('Error Generating Payment Voucher PDF', e);
                context.response.write('An error occurred while generating the PDF: ' + e.message);
            }
        }
    }

    return {
        onRequest: onRequest
    };
});