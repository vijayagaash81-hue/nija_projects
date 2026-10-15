/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * 
 * Script Name: sjs_sales_quotation_bank_sl.js
 * Description: Suitelet to generate and render SJS Sales Quotation PDF document WITH BANK DETAILS.
 */
define(['N/render', 'N/record', 'N/file', 'N/search', 'N/log'], (render, record, file, search, log) => {

    /**
     * Helper function to convert numeric amount to words.
     * @param {number|string} amount 
     * @param {string} currencyName 
     * @returns {string} Amount in words
     */
    const convertAmountToWords = (amount, currencyName) => {
        const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const scales = ['', 'Thousand', 'Million', 'Billion'];

        const numStr = parseFloat(amount || 0).toFixed(2);
        const parts = numStr.split('.');
        let num = parseInt(parts[0], 10);
        const decimal = parseInt(parts[1], 10);

        if (num === 0 && decimal === 0) return 'Zero';

        const convertGroup = (n) => {
            let str = '';
            const h = Math.floor(n / 100);
            const t = n % 100;
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
        };

        let wordStr = '';
        let scaleIdx = 0;
        let tempNum = num;

        if (tempNum === 0) {
            wordStr = 'Zero ';
        } else {
            while (tempNum > 0) {
                const group = tempNum % 1000;
                if (group > 0) {
                    const groupStr = convertGroup(group);
                    wordStr = groupStr + scales[scaleIdx] + ' ' + wordStr;
                }
                tempNum = Math.floor(tempNum / 1000);
                scaleIdx++;
            }
        }

        let finalStr = wordStr.trim();

        if (decimal > 0) {
            const decimalName = (currencyName === 'AED') ? 'Fils' : 'Cents';
            finalStr += ' and ' + convertGroup(decimal).trim() + ' ' + decimalName;
        }

        return finalStr;
    };

    /**
     * Suitelet Entry Point
     * @param {Object} context 
     */
    const onRequest = (context) => {
        try {
            const request = context.request;
            const response = context.response;

            // 1. Get record parameters passed from Client Script
            const recordId = request.parameters.customRecordId;
            const recordType = request.parameters.recordType || record.Type.ESTIMATE;

            if (!recordId) {
                response.write('Error: Missing customRecordId parameter.');
                return;
            }

            log.debug('onRequest', `Loading record type: ${recordType}, ID: ${recordId} (With Bank Details)`);

            // 2. Load the Estimate (Sales Quotation) record
            const estimateRecord = record.load({
                type: recordType,
                id: recordId
            });

            // 3. Extract transaction amounts and details
            const currencyText = estimateRecord.getText({ fieldId: 'currency' }) || 'AED';
            const subtotal = parseFloat(estimateRecord.getValue({ fieldId: 'subtotal' }) || 0);
            const discountTotal = parseFloat(estimateRecord.getValue({ fieldId: 'discounttotal' }) || 0);
            const taxTotal = parseFloat(estimateRecord.getValue({ fieldId: 'taxtotal' }) || 0);
            const grandTotal = parseFloat(estimateRecord.getValue({ fieldId: 'total' }) || 0);

            // Calculate Net Amount (Subtotal minus discount)
            const netAmount = subtotal - Math.abs(discountTotal);

            // Convert grand total to words
            const totalWords = convertAmountToWords(grandTotal, currencyText);

            // 4. Extract billing address subrecord or formatted address excluding addressee/company name
            let addressInfo = { formattedAddress: '' };
            try {
                const billAddressSubrec = estimateRecord.getSubrecord({ fieldId: 'billingaddress' });
                if (billAddressSubrec) {
                    const addr1 = billAddressSubrec.getValue({ fieldId: 'addr1' }) || '';
                    const addr2 = billAddressSubrec.getValue({ fieldId: 'addr2' }) || '';
                    const city = billAddressSubrec.getValue({ fieldId: 'city' }) || '';
                    const state = billAddressSubrec.getValue({ fieldId: 'state' }) || '';
                    const zip = billAddressSubrec.getValue({ fieldId: 'zip' }) || '';
                    const country = billAddressSubrec.getText({ fieldId: 'country' }) || billAddressSubrec.getValue({ fieldId: 'country' }) || '';

                    let lines = [];
                    if (addr1) lines.push(addr1);
                    if (addr2) lines.push(addr2);
                    let line3 = [];
                    if (city) line3.push(city);
                    if (state) line3.push(state);
                    if (zip) line3.push(zip);
                    if (line3.length > 0) lines.push(line3.join(', '));
                    if (country) lines.push(country);

                    addressInfo.formattedAddress = lines.join('<br/>');
                    addressInfo.addr1 = addr1;
                    addressInfo.addr2 = addr2;
                    addressInfo.city = city;
                    addressInfo.state = state;
                    addressInfo.zip = zip;
                    addressInfo.country = country;
                }
            } catch (e) {
                log.debug('Could not load billingaddress subrecord, falling back to billaddress field', e);
            }

            if (!addressInfo.formattedAddress) {
                let billAddress = estimateRecord.getValue({ fieldId: 'billaddress' }) || '';
                let lines = billAddress.split(/\r?\n|<br\s*\/?>/gi).map(l => l.trim()).filter(l => l.length > 0);
                const entityText = estimateRecord.getText({ fieldId: 'entity' }) || '';
                if (lines.length > 1 && entityText && (lines[0].toLowerCase() === entityText.toLowerCase() || lines[0].toLowerCase().includes(entityText.toLowerCase()))) {
                    lines.shift(); // Remove duplicate company name/addressee line
                }
                addressInfo.formattedAddress = lines.join('<br/>');
            }

            // 5. Load XML Template from File Cabinet
            let xmlFile;
            const possiblePaths = [
                'SuiteScripts/Layouts/Sales Quotation Layout/sjs_sales_quotation_bank.xml',
                'SuiteScripts/SJS Sales Quotation/sjs_sales_quotation_bank.xml'
            ];

            for (const filePath of possiblePaths) {
                try {
                    xmlFile = file.load({ id: filePath });
                    if (xmlFile) break;
                } catch (e) {
                    log.debug('file.load by path failed, trying next option', `Path: ${filePath}, Error: ${e.message}`);
                }
            }

            if (!xmlFile) {
                try {
                    const fileSearch = search.create({
                        type: 'file',
                        filters: [['name', 'is', 'sjs_sales_quotation_bank.xml']],
                        columns: ['internalid']
                    }).run().getRange({ start: 0, end: 1 });

                    if (fileSearch && fileSearch.length > 0) {
                        xmlFile = file.load({ id: fileSearch[0].id });
                    }
                } catch (e) {
                    log.error('Fallback file search failed', e);
                }
            }

            if (!xmlFile) {
                throw new Error('Could not locate sjs_sales_quotation_bank.xml in File Cabinet.');
            }

            let xmlContent = xmlFile.getContents();

            // Extract Shipping Method / Carrier text
            let shipCarrierText = estimateRecord.getText({ fieldId: 'shipcarrier' });
            if (!shipCarrierText) {
                const val = estimateRecord.getValue({ fieldId: 'shipcarrier' });
                if (val === 'nonups') shipCarrierText = 'FedEx/USPS/More';
                else if (val === 'ups') shipCarrierText = 'UPS';
                else shipCarrierText = val || '';
            }
            const shipMethodText = estimateRecord.getText({ fieldId: 'shipmethod' }) || estimateRecord.getValue({ fieldId: 'shipmethod' }) || '';
            const shippingMethod = shipCarrierText || shipMethodText || '';

            // 6. Build Renderer and bind record data
            const renderer = render.create();
            renderer.templateContent = xmlContent;

            renderer.addRecord({
                templateName: 'record',
                record: estimateRecord
            });

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'customData',
                data: {
                    totalWords: totalWords,
                    netAmount: netAmount,
                    discountTotal: Math.abs(discountTotal),
                    addressInfo: addressInfo,
                    shippingMethod: shippingMethod,
                    shipCarrierText: shipCarrierText,
                    shipMethodText: shipMethodText
                }
            });

            // 7. Render as PDF
            const pdfFile = renderer.renderAsPdf();

            // 8. Output PDF to browser
            response.writeFile({
                file: pdfFile,
                isInline: true
            });

        } catch (e) {
            log.error('Error in onRequest of sjs_sales_quotation_bank_sl.js', e);
            context.response.write(`Error generating Sales Quotation PDF (With Bank Details): ${e.message}`);
        }
    };

    return {
        onRequest: onRequest
    };
});
