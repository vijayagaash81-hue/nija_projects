/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/record', 'N/render', 'N/search', 'N/log', 'N/format', 'N/file'], function (record, render, search, log, format, file) {

    function onRequest(context) {
        try {
            var request = context.request;
            var response = context.response;

            var letterReqId = request.parameters.recordId;

            // Helper function to format date as DD-Month-YYYY
            function formatDateLong(dateVal) {
                if (!dateVal) return '';
                var dateObj = dateVal;
                if (typeof dateVal === 'string') {
                    try {
                        dateObj = format.parse({
                            value: dateVal,
                            type: format.Type.DATE
                        });
                    } catch (e) {
                        dateObj = new Date(dateVal);
                    }
                }
                if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
                    return dateVal;
                }
                var months = [
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                ];
                var day = dateObj.getDate();
                var month = months[dateObj.getMonth()];
                var year = dateObj.getFullYear();
                return day + '-' + month + '-' + year;
            }

            // Helper function to escape XML special characters
            function escapeXml(string) {
                if (!string) return '';
                return string.toString()
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&apos;');
            }

            function processAddress(addressText) {
                if (!addressText) return "";
                var lines = addressText.split(/\r?\n/).filter(function (s) { return s.trim() !== ""; });
                var finalLines = [];

                if (lines.length === 1) {
                    var firstCommaIdx = lines[0].indexOf(',');
                    if (firstCommaIdx !== -1) {
                        finalLines.push(lines[0].substring(0, firstCommaIdx).trim());
                        finalLines.push(lines[0].substring(firstCommaIdx + 1).trim());
                    } else {
                        finalLines.push(lines[0]);
                    }
                } else {
                    finalLines = lines.map(function (s) { return s.trim(); });
                }

                return finalLines.map(escapeXml).join("<br/>");
            }

            // Helper function to format number with commas and two decimal places
            function formatNumberWithCommas(num) {
                var parts = parseFloat(num || 0).toFixed(2).split('.');
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                return parts.join('.');
            }

            // Default Sample Data (Fallback if no record ID is provided)
            var refNo = 'EL8-HR-LTR-2026-00XX';
            var letterDate = formatDateLong(new Date());
            var letterToHtml = 'The Manager<br/>Emirates NBD Bank<br/>Dubai, United Arab Emirates';
            var empPrefix = 'Mr.';
            var empNameFinal = 'XXX';
            var empNationFinal = 'XXX';
            var empPass = 'XXX';
            var empJobConfirmDt = 'XXX';
            var empDesiFinal = 'XXX';
            var empGenderPossessive = 'his';
            var empGenderPronoun = 'him';
            var empGenderPossessiveCap = 'His';
            var grossSalaryFormatted = 'XXX';
            var accountNo = 'XXX';
            var ibanNo = 'XXX';
            var effectiveDate = 'XXX';
            var companyLegalName = 'Eleveight Architectural Design Consultancy LLC';
            var signatoryName = 'Jene Roa';
            var signatoryTitle = 'People & Talent Manager';

            var companyAddressHtml = 'Office No. 508, Building No. 2,<br/>Emaar Business Park, Sheikh Zayed RD.<br/>Dubai, United Arab Emirates';
            var companyPhone = '+971 04 451 1196';
            var companyEmail = 'info@elev8architects.com';
            var logoUrl = '';

            // Load main logo file if possible
            try {
                var logoFile = file.load({ id: 5448 });
                logoUrl = logoFile.url;
            } catch (logoErr) {
                log.error('Error loading main logo file 5448', logoErr.message);
            }

            // If a recordId is provided, retrieve dynamic values
            if (letterReqId) {
                try {
                    var letterRec = record.load({
                        type: 'customrecord_hris_lve_letter_req',
                        id: letterReqId
                    });

                    refNo = letterRec.getValue({ fieldId: 'name' }) || letterRec.getValue({ fieldId: 'id' }) || refNo;

                    var letterReqDateRaw = letterRec.getText({ fieldId: 'custrecord_hris_letreq_request_date_cre' }) ||
                        letterRec.getValue({ fieldId: 'custrecord_hris_letreq_request_date_cre' });
                    if (letterReqDateRaw) {
                        letterDate = formatDateLong(letterReqDateRaw);
                    }

                    var letterToRaw = letterRec.getValue({ fieldId: 'custrecord_hris_letreq_letter_addressed' }) || "";
                    if (letterToRaw) {
                        letterToHtml = processAddress(letterToRaw);
                    }

                    var employeeId = letterRec.getValue({ fieldId: 'custrecord_hris_letreq_employee_name' });
                    if (employeeId) {
                        var empRec = record.load({
                            type: 'employee',
                            id: employeeId
                        });

                        var empGender = empRec.getText({ fieldId: 'custentity_hris_empgender' });
                        empPrefix = (empGender === 'Male') ? 'Mr.' : 'Mrs.';
                        empGenderPossessive = (empGender === 'Male') ? 'his' : 'her';
                        empGenderPossessiveCap = (empGender === 'Male') ? 'His' : 'Her';
                        empGenderPronoun = (empGender === 'Male') ? 'him' : 'her';

                        var reqEmpLegalName = letterRec.getValue({ fieldId: 'custrecord_hris_letreq_employee_legal_na' });
                        var empName = empRec.getValue({ fieldId: 'custentity_hris_emplegalname' }) || empRec.getValue({ fieldId: 'entityid' });
                        empNameFinal = empName || reqEmpLegalName || empNameFinal;

                        var reqEmpDesi = letterRec.getText({ fieldId: 'custrecord_hris_letreq_designation' });
                        var empDesi = empRec.getText({ fieldId: 'custentity_hris_empdesignation' });
                        empDesiFinal = reqEmpDesi || empDesi || empDesiFinal;

                        var reqEmpNation = letterRec.getText({ fieldId: 'custrecord_hris_letreq_employee_national' });
                        var empNation = empRec.getText({ fieldId: 'custentity_hris_empnationality' });
                        empNationFinal = reqEmpNation || empNation || empNationFinal;

                        // Passport details
                        var sublistPass = '';
                        try {
                            var lineCount = empRec.getLineCount({ sublistId: 'recmachcustrecord_hris_emp_link' });
                            for (var i = 0; i < lineCount; i++) {
                                var idType = empRec.getSublistValue({
                                    sublistId: 'recmachcustrecord_hris_emp_link',
                                    fieldId: 'custrecord_hris_emp_id_type',
                                    line: i
                                });
                                if (idType == '2' || idType == 2) {
                                    sublistPass = empRec.getSublistValue({
                                        sublistId: 'recmachcustrecord_hris_emp_link',
                                        fieldId: 'custrecord_hris_id_no',
                                        line: i
                                    }) || '';
                                    break;
                                }
                            }
                        } catch (sublistErr) {
                            log.error('Error fetching passport from sublist', sublistErr.message);
                        }
                        empPass = sublistPass || empRec.getValue({ fieldId: 'custentity_hris_emppassportno' }) || empPass;

                        // Job confirmation / Start date
                        var reqJoiningRaw = letterRec.getValue({ fieldId: 'custrecord_hris_letreq_request_date_cre_of_joining' }) ||
                            letterRec.getText({ fieldId: 'custrecord_hris_letreq_request_date_cre_of_joining' });
                        var empHiredateRaw = empRec.getText({ fieldId: 'hiredate' });
                        var empStartDateFinal = reqJoiningRaw ? formatDateLong(reqJoiningRaw) : formatDateLong(empHiredateRaw);

                        var empJobConfirmDtRaw = empRec.getValue({ fieldId: 'custentity_hris_empjobconfirmationdt' }) || empRec.getText({ fieldId: 'custentity_hris_empjobconfirmationdt' });
                        empJobConfirmDt = formatDateLong(empJobConfirmDtRaw) || empStartDateFinal || empJobConfirmDt;

                        // Bank Details
                        accountNo = empRec.getValue({ fieldId: 'custentity_hris_emp_bankaccno' }) || accountNo;
                        // For IBAN, we'll try routing number, or we use a fallback if not available
                        ibanNo = empRec.getValue({ fieldId: 'custentity_hris_empbankroutingno' }) || ibanNo;

                        // Compensation / Salary
                        var compensationSearch = search.create({
                            type: 'customrecord_hris_employee_compen_change',
                            filters: [['custrecord_hris_empchange_employee_nam', 'anyof', employeeId]],
                            columns: [
                                search.createColumn({ name: 'internalid', sort: search.Sort.DESC }),
                                'custrecord_hris_empchange_month_cross_sy'
                            ]
                        }).run().getRange({ start: 0, end: 1 });

                        if (compensationSearch.length > 0) {
                            var grossSalaryNum = parseFloat(compensationSearch[0].getValue('custrecord_hris_empchange_month_cross_sy') || 0);
                            grossSalaryFormatted = formatNumberWithCommas(grossSalaryNum);
                        }

                        // Subsidiary Details
                        var subsidiaryId = letterRec.getValue({ fieldId: 'custrecord_hris_letreq_subsidiary' }) || empRec.getValue({ fieldId: 'subsidiary' });
                        if (subsidiaryId) {
                            var subRec = record.load({
                                type: 'subsidiary',
                                id: subsidiaryId
                            });
                            var legalName = subRec.getValue({ fieldId: 'legalname' }) || subRec.getValue({ fieldId: 'name' });
                            if (legalName) {
                                if (legalName.indexOf(':') > -1) {
                                    var legalParts = legalName.split(':');
                                    companyLegalName = legalParts[legalParts.length - 1].trim();
                                } else {
                                    companyLegalName = legalName;
                                }
                            }
                            companyPhone = subRec.getValue({ fieldId: 'phone' }) || companyPhone;
                            companyEmail = subRec.getValue({ fieldId: 'email' }) || companyEmail;

                            var mainAddress = subRec.getSubrecord({ fieldId: 'mainaddress' });
                            if (mainAddress) {
                                var fullAddrText = mainAddress.getValue({ fieldId: 'addrtext' }) || '';
                                var addrLines = fullAddrText.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(function (s) { return s !== ""; });
                                if (addrLines.length > 0) {
                                    companyAddressHtml = addrLines.map(escapeXml).join('<br/>');
                                }
                            }
                        }
                    }
                } catch (loadErr) {
                    log.error('Error loading letter req record', loadErr.message);
                }
            } else {
                // If there's no recordId (Sample Mode), we fill all fields with realistic sample data matching the reference layout
                refNo = 'EL8-HR-LTR-2026-0012';
                letterDate = formatDateLong(new Date());
                letterToHtml = 'The Manager<br/>Emirates NBD Bank<br/>Dubai, United Arab Emirates';
                empPrefix = 'Mr.';
                empNameFinal = 'Alexander Wright';
                empNationFinal = 'British';
                empPass = 'N9876543';
                empJobConfirmDt = '15-January-2024';
                empDesiFinal = 'Senior Architect';
                empGenderPossessive = 'his';
                empGenderPossessiveCap = 'His';
                empGenderPronoun = 'him';
                grossSalaryFormatted = '25,000.00';
                accountNo = '1012345678901';
                ibanNo = 'AE12 0030 0001 0123 4567 8901';
                effectiveDate = '01-August-2026';
                companyLegalName = 'Eleveight Architectural Design Consultancy LLC';
                signatoryName = 'Jene Roa';
                signatoryTitle = 'People & Talent Manager';
            }

            // Construct the PDF XML content
            var baseStyle = '<style type="text/css">' +
                '@page {' +
                ' margin-top: 0;' +
                ' margin-bottom: 0;' +
                ' margin-left: 0;' +
                ' margin-right: 0;' +
                '}' +
                'body, p, div, table, tr, td, a, span { font-family: Helvetica, Arial, sans-serif; }' +
                'body { font-size: 9.5pt; color: #000000; }' +
                '.address-block { margin: 0 0 15pt 0; line-height: 14px; font-family: Helvetica, Arial, sans-serif; }' +
                '.letter-title { font-weight: bold; text-decoration: underline; margin: 0 0 20pt 0; font-family: Helvetica, Arial, sans-serif; }' +
                '.body-paragraph { margin: 0 0 12pt 0; line-height: 17px; text-align: justify; font-family: Helvetica, Arial, sans-serif; }' +
                '.signatory-block { margin-top: 40pt; line-height: 14px; font-family: Helvetica, Arial, sans-serif; }' +
                '</style>';

            var logoHtmlElement = '';
            if (logoUrl) {
                logoHtmlElement = '<img src="' + escapeXml(logoUrl) + '" width="70" height="90" style="object-fit: contain;" />';
            } else {
                logoHtmlElement = '<table style="background-color: #8c8c8c; width: 95px; height: 95px; border-collapse: collapse; margin: 0; font-family: Helvetica, Arial, sans-serif;">' +
                    '<tr>' +
                    '<td align="center" valign="middle" style="padding: 0 5px; font-family: Helvetica, Arial, sans-serif;">' +
                    '<p style="font-size: 20pt; color: #ffffff; margin: 0 0 -2px 0; font-weight: normal; line-height: 22px; font-family: Helvetica, Arial, sans-serif;">Elev8</p>' +
                    '<p style="font-size: 5.5pt; color: #e5e5e5; margin: 0; letter-spacing: 2px; line-height: 7px; text-transform: uppercase; font-weight: bold; font-family: Helvetica, Arial, sans-serif;">Architects</p>' +
                    '</td>' +
                    '</tr>' +
                    '</table>';
            }

            var headerHtml = '<table width="100%" style="border-collapse: collapse; margin-top: 0; margin-bottom: 15px; font-family: Helvetica, Arial, sans-serif;">' +
                '<tr>' +
                '<td width="35%" valign="top" align="left" style="padding-top: -72pt; font-family: Helvetica, Arial, sans-serif;">' +
                logoHtmlElement +
                '</td>' +
                '<td width="40%" valign="top" align="left" style="font-size: 7.5pt; color: #8e8e8e; line-height: 12px; padding-top: -52pt; font-family: Helvetica, Arial, sans-serif;">' +
                '<p style="margin: 0; font-family: Helvetica, Arial, sans-serif;">' + companyAddressHtml + '</p>' +
                '</td>' +
                '<td width="25%" valign="top" align="left" style="font-size: 7.5pt; color: #8e8e8e; line-height: 12px; padding-top: -52pt; font-family: Helvetica, Arial, sans-serif;">' +
                '<p style="margin: 0; font-family: Helvetica, Arial, sans-serif;">T: ' + escapeXml(companyPhone) + '</p>' +
                '<p style="margin: 0; font-family: Helvetica, Arial, sans-serif;">' + escapeXml(companyEmail) + '</p>' +
                '</td>' +
                '</tr>' +
                '</table>';

            var pStyle = 'font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt; margin: 0 0 14pt 0; line-height: 19px; text-align: justify; color: #000000;';
            var signatoryStyle = 'font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt; line-height: 18px; margin-top: 15pt;';

            var bodyHtml =
                '<div style="font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt; line-height: 18px; margin-bottom: 14pt;">' +
                '<p style="margin: 0 0 4px 0; font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt;">Ref: ' + escapeXml(refNo) + '</p>' +
                '<p style="margin: 0 0 14pt 0; font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt;">Date: ' + escapeXml(letterDate) + '</p>' +
                '<p style="margin: 0 0 14pt 0; font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt; line-height: 16px;">' + letterToHtml + '</p>' +
                '<p style="margin: 0 0 14pt 0; font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt;">Dear Sir,</p>' +
                '</div>' +

                '<p style="font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt; margin: 0 0 14pt 0;"><b><u>Subject: Salary Transfer Letter</u></b></p>' +

                '<p style="' + pStyle + '">This is to certify that ' + empPrefix + ' ' + escapeXml(empNameFinal) + ', holder of ' + escapeXml(empNationFinal) + ' passport no. ' + escapeXml(empPass) + ' is currently joined and an employee of ' + escapeXml(companyLegalName) + ' since ' + escapeXml(empJobConfirmDt) + ' up to the present and holds the position of ' + escapeXml(empDesiFinal) + '. ' + empGenderPossessiveCap + ' total monthly remuneration is AED ' + escapeXml(grossSalaryFormatted) + ' inclusive of all allowances.</p>' +

                '<p style="' + pStyle + '">We confirm that ' + empGenderPossessive + ' monthly salary will be transferred for the credit of ' + empGenderPossessive + ' Account no:' + escapeXml(accountNo) + ' IBAN no.: ' + escapeXml(ibanNo) + ' with yourself effective ' + escapeXml(effectiveDate) + ' and undertake not to transfer the salary to any other bank unless ' + empGenderPossessive + ' produces a clearance letter from you.</p>' +

                '<p style="' + pStyle + '">In case of ' + empGenderPossessive + ' resignation/termination we will inform you accordingly and will transfer ' + empGenderPossessive + ' gratuity and final settlement of ' + empGenderPossessive + ' dues for ' + empGenderPossessive + ' account with your bank.</p>' +

                '<p style="' + pStyle + '">This certification is issued upon the request of ' + empPrefix + ' ' + escapeXml(empNameFinal) + ' for the purpose of updating ' + empGenderPossessive + ' account with you.</p>' +

                '<p style="' + pStyle + '">Please note that this letter does not constitute any guarantee on our part towards repayment of any type of loan or credit card nor will the company have any legal and financial liability as a result of non-payment. This letter is issued with no liability on the part of the undersigned or the company.</p>' +

                '<p style="' + pStyle + '">For any questions, please reach us through e-mail at <a href="mailto:' + escapeXml(companyEmail) + '" style="color: #0000ff; text-decoration: underline; font-family: Helvetica, Arial, sans-serif;">' + escapeXml(companyEmail) + '</a> or office number ' + escapeXml(companyPhone.replace('+971 ', '')) + '.</p>' +

                '<div style="' + signatoryStyle + '">' +
                '<p style="margin: 0 0 14pt 0; font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt; line-height: 18px;">Yours faithfully,<br/>' +
                'For and on behalf of ' + escapeXml(companyLegalName) + '</p>' +
                '<p style="font-weight: bold; margin: 45px 0 2px 0; font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt;">' + escapeXml(signatoryName) + '</p>' +
                '<p style="margin: 0; font-family: Helvetica, Arial, sans-serif; font-size: 9.5pt;">' + escapeXml(signatoryTitle) + '</p>' +
                '</div>';

            var pdfBodyAttributes = 'size="A4" padding="25mm 15mm 12mm 15mm" header="certheader" header-height="25mm" footer="certfooter" footer-height="8mm"';

            var pdfContent = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">' +
                '<pdf>' +
                '<head>' +
                baseStyle +
                '<macrolist>' +
                '<macro id="certheader">' +
                headerHtml +
                '</macro>' +
                '<macro id="certfooter">' +
                '<table width="100%" style="border-collapse: collapse; font-family: Helvetica, Arial, sans-serif;">' +
                '<tr>' +
                '<td align="left" style="font-size: 7.5pt; color: #8e8e8e; font-family: Helvetica, Arial, sans-serif;">www.elev8architects.com</td>' +
                '<td align="right" style="font-size: 7.5pt; color: #8e8e8e; font-family: Helvetica, Arial, sans-serif;">DUBAI | LONDON | ABU DHABI | MANILA</td>' +
                '</tr>' +
                '</table>' +
                '</macro>' +
                '</macrolist>' +
                '</head>' +
                '<body ' + pdfBodyAttributes + '>' +
                bodyHtml +
                '</body>' +
                '</pdf>';

            log.audit('pdfContent', pdfContent);
            var pdfFile = render.xmlToPdf({ xmlString: pdfContent });

            response.setHeader({ name: 'Content-Type', value: 'application/pdf' });
            response.setHeader({
                name: 'Content-Disposition',
                value: 'inline; filename="Salary_Transfer_Letter.pdf"'
            });

            response.writeFile(pdfFile);

        } catch (e) {
            log.error('Error Generating Document', 'Error: ' + e.message);
            context.response.write('An error occurred: ' + e.message);
        }
    }

    return {
        onRequest: onRequest
    };
});
