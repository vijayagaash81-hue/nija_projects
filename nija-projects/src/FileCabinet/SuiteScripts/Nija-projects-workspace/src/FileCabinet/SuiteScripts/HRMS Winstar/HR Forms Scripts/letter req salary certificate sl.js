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
            var certType = request.parameters.certType; // Received from URL / Client Script ('2', '3', or '4')

            if (!letterReqId) {
                response.write('Missing letter request ID.');
                return;
            }

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

            // Helper function to convert amount to words
            function convertAmountToWords(amount) {
                var units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
                var tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
                var scales = ['', 'Thousand', 'Million', 'Billion'];

                var numStr = parseFloat(amount || 0).toFixed(2);
                var parts = numStr.split('.');
                var num = parseInt(parts[0], 10);

                if (num === 0) return 'Zero';

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

                while (tempNum > 0) {
                    var group = tempNum % 1000;
                    if (group > 0) {
                        var groupStr = convertGroup(group);
                        wordStr = groupStr + scales[scaleIdx] + ' ' + wordStr;
                    }
                    tempNum = Math.floor(tempNum / 1000);
                    scaleIdx++;
                }

                return wordStr.trim().toUpperCase();
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

                // First, check if the user already used a New Line in the text area
                var lines = addressText.split(/\r?\n/).filter(function(s){ return s.trim() !== ""; });
                var finalLines = [];

                if (lines.length === 1) {
                    // If it's one single line, split it at the FIRST comma
                    var firstCommaIdx = lines[0].indexOf(',');
                    if (firstCommaIdx !== -1) {
                        finalLines.push(lines[0].substring(0, firstCommaIdx).trim()); // Part 1: Bank Name
                        finalLines.push(lines[0].substring(firstCommaIdx + 1).trim()); // Part 2: Dubai, UAE
                    } else {
                        finalLines.push(lines[0]);
                    }
                } else {
                    // If user already typed it on multiple lines, just keep them as is
                    finalLines = lines.map(function(s){ return s.trim(); });
                }

                return finalLines.map(escapeXml).join("<br/>");
            }

            // Helper function to format number with commas and two decimal places
            function formatNumberWithCommas(num) {
                var parts = parseFloat(num || 0).toFixed(2).split('.');
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                return parts.join('.');
            }

            // 1. Load the letter request record
            var letterRec = record.load({
                type: 'customrecord_hris_lve_letter_req',
                id: letterReqId
            });

            var employeeId = letterRec.getValue({
                fieldId: 'custrecord_hris_letreq_employee_name'
            });

            if (!employeeId) {
                response.write('Employee not selected on the letter request.');
                return;
            }

            // 2. Load the full employee record
            var empRec = record.load({
                type: 'employee',
                id: employeeId
            });

            // --- Data Fetching & Mapping Logic ---
            var emp_gender = empRec.getText({ fieldId: 'custentity_hris_empgender' });

            // Gender-based mapping
            var emp_mr = (emp_gender === 'Male') ? 'MR' : 'MRS';
            var emp_his_her_cap = (emp_gender === 'Male') ? 'His' : 'Her'; // For start of sentences
            var emp_gender_possessive = (emp_gender === 'Male') ? 'his' : 'her'; // For middle of sentences
            var emp_gender_pronoun = (emp_gender === 'Male') ? 'him' : 'her';    // For "wish him success"
           // BANK NAME from Employee record (New Requirement)
            var emp_bank_name = empRec.getText({ fieldId: 'custentity_hris_empbankname' }) || empRec.getValue({ fieldId: 'custentity_hris_empbankname' }) || '';

            var req_emp_legal_name = letterRec.getValue({ fieldId: 'custrecord_hris_letreq_employee_legal_na' }) || '';
            var req_emp_desi = letterRec.getText({ fieldId: 'custrecord_hris_letreq_designation' }) || '';
            var req_emp_nation = letterRec.getText({ fieldId: 'custrecord_hris_letreq_employee_national' }) || '';
            var req_emp_joining_raw = letterRec.getValue({ fieldId: 'custrecord_hris_letreq_request_date_cre_of_joining' }) ||
                letterRec.getText({ fieldId: 'custrecord_hris_letreq_request_date_cre_of_joining' }) || '';

            var emp_name = empRec.getValue({ fieldId: 'custentity_hris_emplegalname' }) || '';
            var emp_desi = empRec.getText({ fieldId: 'custentity_hris_empdesignation' }) || '';
            var emp_nation = empRec.getText({ fieldId: 'custentity_hris_empnationality' }) || '';
            var emp_pass = empRec.getValue({ fieldId: 'custentity_hris_emppassportno' }) || '';

            var emp_name_final = req_emp_legal_name || emp_name || '';
            var emp_desi_final = req_emp_desi || emp_desi || '';
            var emp_nation_final = req_emp_nation || emp_nation || '';

            var emp_exdate_raw = empRec.getText({ fieldId: 'custentity_hris_emppassexpdate' }) || '';
            var emp_exdate = formatDateLong(emp_exdate_raw);

            var emp_hiredate_raw = empRec.getText({ fieldId: 'hiredate' }) || '';
            var emp_hiredate = formatDateLong(emp_hiredate_raw);
            var emp_startdate_final = req_emp_joining_raw ? formatDateLong(req_emp_joining_raw) : emp_hiredate;

            var emp_sub = empRec.getText({ fieldId: 'subsidiary' }) || '';
            var emp_dept = empRec.getText({ fieldId: 'custentity_hris_empdepartment_new' }) || '';

            var emp_leavedate_raw = empRec.getText({ fieldId: 'custentity_hirs_empdol' }) || '';
            var emp_leavedate = formatDateLong(emp_leavedate_raw);

            var currency = 'AED'; // Default fallback
            var gross_salary_num = 0;
            var gross_salary_formatted = '0.00';
            var gross_salary_words = 'ZERO';

            // Search for the Latest Compensation record
            var compensationSearch = search.create({
                type: 'customrecord_hris_employee_compen_change',
                filters: [['custrecord_hris_empchange_employee_nam', 'anyof', employeeId]],
                columns: [
                    search.createColumn({ name: 'internalid', sort: search.Sort.DESC }),
                    'custrecord_hris_empchange_currency',
                    'custrecord_hris_empchange_month_cross_sy'
                ]
            }).run().getRange({ start: 0, end: 1 });

            var salary_breakdown_rows_html = '';

            if (compensationSearch.length > 0) {
                currency = compensationSearch[0].getText('custrecord_hris_empchange_currency') || 'AED';
                gross_salary_num = parseFloat(compensationSearch[0].getValue('custrecord_hris_empchange_month_cross_sy') || 0);

                // Format currency with commas and two decimal places
                gross_salary_formatted = formatNumberWithCommas(gross_salary_num);
              log.emergency("gross_salary_formatted",gross_salary_formatted);
                gross_salary_words = convertAmountToWords(gross_salary_num);

                // Load sublist from parent record if available to get actual values
                try {
                    var compenChangeId = compensationSearch[0].getValue('internalid');
                    var compRec = record.load({
                        type: 'customrecord_hris_employee_compen_change',
                        id: compenChangeId
                    });
                    var lineCount = compRec.getLineCount({
                        sublistId: 'recmachcustrecord_hris_employee_data_change'
                    });
                    for (var i = 0; i < lineCount; i++) {
                        var componentText = compRec.getSublistText({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_cde_payroll_component',
                            line: i
                        }) || '';

                        var monthlyAmt = parseFloat(compRec.getSublistValue({
                            sublistId: 'recmachcustrecord_hris_employee_data_change',
                            fieldId: 'custrecord_hris_cde_monthly',
                            line: i
                        }) || 0);

                        var isLastRow = (i === lineCount - 1);
                        var rowBorder = isLastRow ? 'border-bottom: 1.5px solid #000000;' : 'border-bottom: 1px solid #d1d5db;';

                        salary_breakdown_rows_html += '<tr style="' + rowBorder + '">' +
                            '<td align="left" style="padding: 4px 8px;">' + escapeXml(componentText) + '</td>' +
                            '<td align="right" style="padding: 4px 8px;">' + formatNumberWithCommas(monthlyAmt) + ' /-</td>' +
                            '</tr>';
                    }
                } catch (loadCompErr) {
                    log.error('Error loading compensation details sublist', loadCompErr.message);
                }
            }

            if (!salary_breakdown_rows_html) {
                salary_breakdown_rows_html = '<tr style="border-bottom: 1.5px solid #000000;">' +
                    '<td align="left" style="padding: 4px 8px;">Gross Salary</td>' +
                    '<td align="right" style="padding: 4px 8px;">' + escapeXml(gross_salary_formatted) + ' /-</td>' +
                    '</tr>';
            }

            // Clean subsidiary name of parent prefixes
            var companyName = emp_sub;
            if (companyName && companyName.indexOf(':') > -1) {
                var subParts = companyName.split(':');
                companyName = subParts[subParts.length - 1].trim();
            }
            if (!companyName) {
                companyName = 'Wherever Technical And Cleaning Services LLC.';
            }

            // Load Subsidiary Record Details for Header Address block
            var companyAddress1 = '';
            var companyAddress2 = '';
            var companyPhone = '';
            var companyFax = '';

            var subsidiaryId = letterRec.getValue({ fieldId: 'custrecord_hris_letreq_subsidiary' }) || empRec.getValue({ fieldId: 'subsidiary' });
            var logoUrl = '';
            if (subsidiaryId) {
                try {
                    var subRec = record.load({
                        type: 'subsidiary',
                        id: subsidiaryId
                    });
                    var logoId = subRec.getValue({ fieldId: 'logo' }) || subRec.getValue({ fieldId: 'pagelogo' });
                    if (logoId) {
                        try {
                            var logoFile = file.load({ id: logoId });
                            logoUrl = logoFile.url;
                        } catch (logoErr) {
                            log.error('Error loading subsidiary logo file', logoErr.message);
                        }
                    }

                    var legalName = subRec.getValue({ fieldId: 'legalname' }) || subRec.getValue({ fieldId: 'name' });
                    if (legalName) {
                        if (legalName.indexOf(':') > -1) {
                            var legalParts = legalName.split(':');
                            companyName = legalParts[legalParts.length - 1].trim();
                        } else {
                            companyName = legalName;
                        }
                    }

                    companyPhone = subRec.getValue({ fieldId: 'phone' }) || '';
                    companyFax = subRec.getValue({ fieldId: 'fax' }) || '';

                    var mainAddress = subRec.getSubrecord({ fieldId: 'mainaddress' });
        if (mainAddress) {
            var fullAddrText = mainAddress.getValue({ fieldId: 'addrtext' }) || '';
            
            // Split by new line and remove empty lines
            var addrLines = fullAddrText.split(/\r?\n/).map(function(s) { return s.trim(); }).filter(function(s) { return s !== ""; });

            if (addrLines.length > 0) {
                // Line 1: Usually the PO Box or Street
                companyAddress1 = addrLines[0];
                
                // Add "Po Box: " prefix if it's missing and looks like a number/box
                if (!/po box|p\.o\.|post box/i.test(companyAddress1)) {
                    companyAddress1 = "Po Box: " + companyAddress1;
                }

                // Line 2: Combine all remaining lines (City, State, Country) with a comma
                if (addrLines.length > 1) {
                    companyAddress2 = addrLines.slice(1).join(', ');
                }
            }

            // 4. Get Phone and Fax specifically
            companyPhone = mainAddress.getValue({ fieldId: 'addrphone' }) || subRec.getValue({ fieldId: 'phone' }) || '';
            companyFax = mainAddress.getValue({ fieldId: 'addrfax' }) || subRec.getValue({ fieldId: 'fax' }) || '';
        }
                } catch (subErr) {
                    log.error('Error loading subsidiary record', subErr.message);
                }
            }

            // --- Template Selection (Dynamic Based on Type) ---
            var rawTemplate = '';
            var docTitle = '';

            if (certType === '2') {
                // OFFER LETTER
                docTitle = 'Offer Letter';
                rawTemplate = letterRec.getValue({ fieldId: 'custrecordnjt_offer_letter' }) || '';
            }
            else if (certType === '4') {
                // EXPERIENCE LETTER
                docTitle = 'Experience Letter';
                rawTemplate = letterRec.getValue({ fieldId: 'custrecordnjt_experience_letter' }) || '';
            }
            else {
                // SALARY CERTIFICATE (Default / Type 3)
                docTitle = 'Salary Certificate';
                rawTemplate = letterRec.getValue({ fieldId: 'custrecord_njt_salary_certificate_tpl' }) || '';
            }

            if (!rawTemplate) {
                response.write('The template body for ' + docTitle + ' is empty on this record.');
                return;
            }

            // --- Placeholder Replacement Logic (XML-Safe) ---
            var filledTemplate = rawTemplate
                .replace(/{{emp_mr}}/g, escapeXml(emp_mr))
                .replace(/{{emp_name}}/g, escapeXml(emp_name))
                .replace(/{{emp_nation}}/g, escapeXml(emp_nation))
                .replace(/{{emp_pass}}/g, escapeXml(emp_pass))
                .replace(/{{emp_exdate}}/g, escapeXml(emp_exdate))
                .replace(/{{emp_hiredate}}/g, escapeXml(emp_hiredate))
                .replace(/{{emp_startdate}}/g, escapeXml(emp_hiredate)) // Mapping Start Date to Hire Date
                .replace(/{{emp_desi}}/g, escapeXml(emp_desi))
                .replace(/{{emp_gender}}/g, escapeXml(emp_his_her_cap))
                .replace(/{{emp_gender_possessive}}/g, escapeXml(emp_gender_possessive))
                .replace(/{{emp_gender_pronoun}}/g, escapeXml(emp_gender_pronoun))
                .replace(/{{currency}}/g, escapeXml(currency))
               // .replace(/{{gross_salary}}/g, escapeXml(gross_salary_formatted))
                //.replace(/{{gross_salary_words}}/g, escapeXml(gross_salary_words))
               .replace(/{{gross_salary}}/g, escapeXml(gross_salary_formatted) + ' (' + escapeXml(gross_salary_words) + ' DIRHAMS ONLY)')
    //.replace(/{{gross_salary_words}}/g, escapeXml(gross_salary_words)) 
                .replace(/{{emp_sub}}/g, escapeXml(emp_sub))
                .replace(/{{company_name}}/g, escapeXml(companyName))
             .replace(/{{company_name}}/g, escapeXml(companyAddress1))
                .replace(/{{emp_dept}}/g, escapeXml(emp_dept))
                .replace(/{{emp_leavedate}}/g, escapeXml(emp_leavedate));

            // Process address line breaks
           /*  var letterTo = letterRec.getValue({ fieldId: 'custrecord_hris_letreq_letter_addressed' }) || '';
            var letterToHtml = escapeXml(letterTo).replace(/\n/g, '<br/>'); */
         /*  var letterTo = letterRec.getValue({ fieldId: 'custrecord_hris_letreq_letter_addressed' }) || '';
          var letterToHtml = escapeXml(letterTo).replace(/[\r\n]+/g, '<br/>'); */

         var letterToRaw = letterRec.getValue({ fieldId: 'custrecord_hris_letreq_letter_addressed' }) || "";
            var letterToHtml = processAddress(letterToRaw);
          log.emergency("letterToHtml",letterToHtml);
            // Get Reference Number
            var refNo = letterRec.getValue({ fieldId: 'name' }) || letterRec.getValue({ fieldId: 'id' }) || '';

            // Get Letter Date
            var letterReqDate_raw = letterRec.getText({ fieldId: 'custrecord_hris_letreq_request_date_cre' }) ||
                letterRec.getValue({ fieldId: 'custrecord_hris_letreq_request_date_cre' }) || '';
            var letterDate = letterReqDate_raw ? formatDateLong(letterReqDate_raw) : formatDateLong(new Date());

            // Signatory details
            var signatoryName = 'ABUTHAHIR MOHAMED ALI MOHAMED ALI';
            var signatoryTitle = 'HR MANAGER';
            var signatoryNameOffer = 'Mr. Abuthahir Mohamed';
            var titlePrefix = (emp_gender === 'Male') ? 'Mr.' : 'Ms.';

            // Base Layout styling
            var baseStyle = '<style type="text/css">' +
                '* { font-family: Helvetica, sans-serif; }' +
                'body { font-size: 9.5pt; color: #000000; }' +
                'p { margin: 0; padding: 0; }' +
                '</style>';

            // Header Section HTML (Dynamic with fallback values)
            var poBoxPrefix = 'Po Box: ';
            if (companyAddress1 && (companyAddress1.toLowerCase().indexOf('po box') > -1 || companyAddress1.toLowerCase().indexOf('p.o. box') > -1)) {
                poBoxPrefix = '';
            }

            var logoHtmlElement = '';
            if (logoUrl) {
                logoHtmlElement = '<table width="130" height="70"><tr><td align="center" valign="middle">' +
                    '<img src="' + escapeXml(logoUrl) + '" width="100" height="50" />' +
                    '</td></tr></table>';
            } else {
                logoHtmlElement = '<table style="border: 1px dashed #cbd5e1; padding: 6px 10px;"><tr><td>' +
                    '<p style="font-size: 10pt; font-weight: bold; color: #000000; text-align: center; margin: 0;">LOGO</p>' +
                    '</td></tr></table>';
            }

            var headerHtml = '<table width="100%" style="border-bottom: 1px solid #000000; padding-bottom: 5px; margin-bottom: 20px;">' +
                '<tr>' +
                '<td width="35%" valign="middle" align="left">' +
                logoHtmlElement +
                '</td>' +
                '<td width="65%" valign="top" align="right" style="font-size: 7.5pt; color: #333333; line-height: 14px;">' +
                '<p style="font-size: 9.5pt; font-weight: bold; color: #000000; margin: 0 0 4px 0;">' + escapeXml(companyName) + '</p>' +
                '<p style="margin: 0;">' + poBoxPrefix + escapeXml(companyAddress1) + '</p>' +
                '<p style="margin: 0;">' + escapeXml(companyAddress2) + '</p>' +
                '<p style="margin: 0;">Phone : ' + escapeXml(companyPhone) + '</p>' +
               '<p style="margin: 0;">Fax : ' + escapeXml(companyFax) + '</p>' +
                '</td>' +
                '</tr>' +
                '</table>';

            // Offer Letter specific header and footer templates are now loaded as image macros

            var bodyHtml = '';

            if (certType === '3') {
                // SALARY CERTIFICATE
                bodyHtml = headerHtml +
                    '<table width="100%" style="margin-top: 15px; margin-bottom: 25px;">' +
                    '<tr>' +
                    '<td align="center">' +
                    '<p style="font-size: 11pt; font-weight: bold; text-decoration: underline; margin: 0;">SALARY CERTIFICATE</p>' +
                    '</td>' +
                    '</tr>' +
                    '</table>' +
                    '<table width="100%" style="margin-bottom: 20px; font-size: 9pt; line-height: 13px;">' +
                    '<tr>' +
                    '<td align="left">' +
                    '<p style="margin: 0;">' + escapeXml(refNo) + '</p>' +
                    '<p style="margin: 2px 0 0 0;">' + escapeXml(letterDate) + '</p>' +
                    '</td>' +
                    '</tr>' +
                    '</table>' +
                    '<table width="100%" style="margin-bottom: 20px; font-size: 9pt; line-height: 13px;">' +
                    '<tr>' +
                    '<td align="left" style="font-weight: bold;">' +
                    '<p style="margin: 0;">' + letterToHtml + '</p>' +
                    '</td>' +
                    '</tr>' +
                    '</table>' +
                    '<p style="font-size: 10pt; font-weight: bold; margin-bottom: 20px; margin-top: 0;">Subject: Salary Certificate</p>' +
                    '<div style="font-size: 10pt; line-height: 22px; text-align: justify; margin-bottom: 25px;">' + filledTemplate + '</div>' +
                    '<p style="font-size: 10pt; margin-bottom: 140px; margin-top: 0;">Yours faithfully ,</p>' +
                    '<table width="100%">' +
                    '<tr>' +
                    '<td align="left">' +
                    '<p style="width: 200px; border-top: 1px dotted #000000; margin: 0 0 5px 0; font-size: 1px;">&nbsp;</p>' +
                    '<p style="font-size: 10pt; font-weight: bold; margin: 0;">' + escapeXml(signatoryName) + '</p>' +
                    '<p style="font-size: 10pt; font-weight: bold; margin: 0;">' + escapeXml(signatoryTitle) + '</p>' +
                    '<p style="font-size: 10pt; font-weight: bold; margin: 0;">' + escapeXml(companyName) + '</p>' +
                    '</td>' +
                    '</tr>' +
                    '</table>';
            }
            else if (certType === '4') {
                // EXPERIENCE LETTER
                bodyHtml = headerHtml +
                    '<table width="100%" style="margin-top: 20px; margin-bottom: 10px;">' +
                    '<tr>' +
                    '<td align="center">' +
                    '<p style="font-size: 11pt; font-weight: bold; text-decoration: underline; margin: 0;">EXPERIENCE CERTIFICATE</p>' +
                    '</td>' +
                    '</tr>' +
                    '<tr>' +
                    '<td align="center" style="padding-top: 45px; padding-bottom: 25px;">' +
                    '<p style="font-size: 10pt; font-weight: bold; text-decoration: underline; margin: 0;">To Whom It May Concern</p>' +
                    '</td>' +
                    '</tr>' +
                    '</table>' +
                    '<div style="font-size: 10pt; line-height: 22px; text-align: justify; margin-bottom: 25px;">' + filledTemplate + '</div>' +
                    '<p style="font-size: 10pt; margin-top: 25px; margin-bottom: 140px;">Sincerely,</p>' +
                    '<table width="100%">' +
                    '<tr>' +
                    '<td align="left">' +
                    '<p style="width: 200px; border-top: 1px solid #000000; margin: 0 0 5px 0; font-size: 1px;">&nbsp;</p>' +
                    '<p style="font-size: 10pt; font-weight: bold; margin: 0;">' + escapeXml(signatoryName) + '</p>' +
                    '<p style="font-size: 10pt; font-weight: bold; margin: 0;">' + escapeXml(signatoryTitle) + '</p>' +
                    '<p style="font-size: 10pt; font-weight: bold; margin: 0;">' + escapeXml(companyName) + '</p>' +
                    '</td>' +
                    '</tr>' +
                    '</table>';
            }
            else if (certType === '2') {
                // OFFER LETTER (Hardcoded Layout matching Reference Images)
                bodyHtml =
                    '<table width="100%" style="margin-bottom: 25px;">' +
                    '<tr>' +
                    '<td align="center">' +
                    '<p style="font-size: 12pt; font-weight: bold; text-decoration: underline; margin: 0;">OFFER LETTER</p>' +
                    '</td>' +
                    '</tr>' +
                    '</table>' +
                    '<p style="font-size: 9.5pt; font-weight: bold; font-style: italic; text-decoration: underline; margin-bottom: 8px;">PRIVATE AND CONFIDENTIAL</p>' +
                    '<table width="100%" style="font-size: 9.5pt; margin-bottom: 15px;">' +
                    '<tr>' +
                    //'<td align="left"><b>Ref:</b> ' + escapeXml(refNo) + '</td>' +
                  '<td align="left"><b>Ref:</b> <b>' + escapeXml(refNo) + '</b></td>' +
                    '<td align="right">' + escapeXml(letterDate) + '</td>' +
                    '</tr>' +
                    '</table>' +
                    '<p style="font-size: 10pt; font-weight: bold; margin: 0 0 2px 0;">' + titlePrefix + ' ' + escapeXml(emp_name_final) + '</p>' +
                    '<p style="font-size: 9.5pt; margin: 0 0 20px 0;"><b>Passport No: ' + escapeXml(emp_pass) + '</b></p>' +

                    // Page 1 body start
                    '<p style="margin-bottom: 12px; text-align: justify; line-height: 14px;">We take great pleasure in confirming your offer for employment of the position of <strong>' + escapeXml(emp_desi_final) + '</strong> with us and you will be reporting to your <strong>Superior</strong> accordingly.</p>' +
                    '<p style="margin-bottom: 15px; text-align: justify; line-height: 14px;">This offer is subject to your acceptance of the salary and conditions of employment as stated below:</p>' +
                    '<p style="font-weight: bold; text-decoration: underline; margin-bottom: 6px;">Salary breakdown:</p>' +
                    '<p style="margin-bottom: 15px; text-align: justify; line-height: 14px;">Your salary package is <strong>' + escapeXml(currency) + ' ' + escapeXml(gross_salary_formatted) + '/- (' + escapeXml(gross_salary_words) + ' DIRHAMS ONLY)</strong> per month Including Accommodation &amp; Transportation.</p>' +

                    // Salary breakdown table
                    '<table width="60%" style="border-collapse: collapse; margin-bottom: 25px; font-size: 9.5pt; line-height: 14px;">' +
                    '<thead>' +
                    '<tr style="background-color: #a3a3a3; border-top: 1.5px solid #000000; border-bottom: 1.5px solid #000000;">' +
                    '<th align="left" style="padding: 4px 8px; font-weight: bold; color: #000000;">Salary Break Down</th>' +
                    '<th align="right" style="padding: 4px 8px; font-weight: bold; color: #000000;">' + escapeXml(currency) + ' (Per Month)</th>' +
                    '</tr>' +
                    '</thead>' +
                    '<tbody>' +
                    salary_breakdown_rows_html +
                    '<tr style="font-weight: bold; border-bottom: 2px double #000000; background-color: #f3f4f6;">' +
                    '<td align="left" style="padding: 4px 8px;">Total Guaranteed Package -</td>' +
                    '<td align="right" style="padding: 4px 8px;">' + escapeXml(gross_salary_formatted) + '/-</td>' +
                    '</tr>' +
                    '</tbody>' +
                    '</table>' +

                    // Rest of Page 1 terms
                    '<p style="font-weight: bold; margin-bottom: 4px;">Air Ticket:</p>' +
                    '<p style="margin-bottom: 12px; line-height: 14px;">Air ticket Allowance <strong>' + escapeXml(currency) + ' 1,000</strong> for self to home country after completion of every <strong>12 months</strong> of service.</p>' +
                    '<p style="font-weight: bold; margin-bottom: 4px;">Medical Insurance:</p>' +
                    '<p style="margin-bottom: 12px; text-align: justify; line-height: 14px;">The employer shall provide the employee on the company has chosen medical insurance scheme outlined in the company medical insurance policy, which may be amended from time to time.</p>' +
                    '<p style="font-weight: bold; margin-bottom: 4px;">Breach of Contract:</p>' +
                    '<p style="margin-bottom: 12px; text-align: justify; line-height: 14px;">Where the employee for any reason terminates the employment contract within a Two (2) year\'s period from commencement of this contract, the employee is obligated to complete the agreed-upon notice period with the company.</p>' +
                    '<p style="font-weight: bold; margin-bottom: 4px;">End of Service Benefits:</p>' +
                    '<p style="margin-bottom: 12px; text-align: justify; line-height: 14px;">The employee who has completed one year or more in the continuous service, is entitled to the end of service remuneration at the end of his service. Days of absence from work without pay are not included in computing the period of service.</p>' +

                    // Page Break
                    '<pbr/>' +

                    // Page 2 start
                    '<table width="100%" style="font-size: 9.5pt; margin-bottom: 10px; padding-bottom: 5px;">' +
                    '<tr>' +
                    //'<td align="left"><b>Ref:</b> ' + escapeXml(refNo) + '</td>' +
                  '<td align="left"><b>Ref:</b> <b>' + escapeXml(refNo) + '</b></td>' +
                    '<td align="right">' + escapeXml(letterDate) + '</td>' +
                    '</tr>' +
                    '</table>' +

                    '<p style="font-weight: bold; margin-bottom: 2px;">Annual Leave:</p>' +
                    '<p style="margin-bottom: 8px; text-align: justify; line-height: 14px;">Annual leave is 30 Calendar days per annum with salary. In the event of termination of an employee\'s service, it shall be entitled to an annual leave for the fractions of the last of service as per UAE Labor Law.</p>' +
                    '<p style="font-weight: bold; margin-bottom: 2px;">Hours of work:</p>' +
                    '<p style="margin-bottom: 2px; line-height: 14px;">Monday to Friday &ndash; 8:30am to 6:00pm</p>' +
                    '<p style="margin-bottom: 4px; line-height: 14px;">Saturday &ndash; 8:30am to 1:00pm</p>' +
                    '<p style="margin-bottom: 8px; text-align: justify; line-height: 14px;">The above timing shall be applicable only to office staff. The operation staff timing may differ based on the work assignment.</p>' +
                    '<p style="font-weight: bold; margin-bottom: 2px;">Transfer:</p>' +
                    '<p style="margin-bottom: 8px; text-align: justify; line-height: 14px;">The company reserves the right to transfer you in any branch within the United Arab Emirates.</p>' +
                    '<p style="font-weight: bold; margin-bottom: 2px;">Probation period:</p>' +
                    '<p style="margin-bottom: 8px; text-align: justify; line-height: 14px;">Confirmation of your permanent employment shall be subject to the satisfactory completion of three (3) months\' probation period starting from the date of your joining but not exceeded for six (6) months.</p>' +
                    '<p style="font-weight: bold; margin-bottom: 2px;">Termination of Service:</p>' +
                    '<p style="margin-bottom: 2px; line-height: 14px;">Employment service may be terminated by employer in writing by giving notice of</p>' +
                    '<ul style="margin: 0 0 8px 0; padding-left: 20px; line-height: 16px;">' +
                    '<li style="margin-bottom: 1px;">Fourteen Days (14) during the probation period.</li>' +
                    '<li style="margin-bottom: 1px;">Three (3) Calendar month upon the completion of probation period. If an employee resigned.</li>' +
                    '<li style="margin-bottom: 1px;">Benefits of service will not pay if terminated during probation period as UAE Law.</li>' +
                    '</ul>' +
                    '<p style="font-weight: bold; margin-bottom: 2px; text-decoration: underline;">Other terms and conditions:</p>' +
                    '<ul style="margin: 0 0 10px 0; padding-left: 20px; line-height: 16px; text-align: justify;">' +
                    '<li style="margin-bottom: 2px;">The appointment is subject to your passing a satisfactory medical examination, obtaining necessary clearance from the department of Naturalization and Immigration of UAE and obtaining positive reference on you.</li>' +
                    '<li style="margin-bottom: 2px;">Upon accepting this offer you will be subjected to the employment conditions described in this letter as well as the company Policies, Procedures &amp; Practices.</li>' +
                    '<li style="margin-bottom: 2px;">If resignation from the company, you are not allowed to take up employment with any other company that is considered as direct competitor of "AL Najma Al Fareeda" for a period of 2 years from the time of cancellation.</li>' +
                    '<li style="margin-bottom: 2px;">Employees must not engage in conversations about company policies, procedures and any other activity including clients, contact, customer complaints, cancelled contracts and former employees when they are out of the office.</li>' +
                    '</ul>' +
                    '<p style="margin-bottom: 15px; text-align: justify; line-height: 14px;">Please inform your acceptance of this offer by signing at the end of this letter and initialing the bottom of each page and forward the signed Offer Letter. We look forward to welcoming you to the <strong>' + escapeXml(companyName) + '</strong> and trust that you will enjoy being part of our family.</p>' +

                    // Signature block
                    '<table width="100%" style="margin-top: 15px; font-size: 9.5pt; line-height: 14px;">' +
                    '<tr>' +
                    '<td width="50%" align="left" valign="top">' +
                    '<p style="font-weight: bold; margin: 0 0 30px 0;">' + escapeXml(signatoryNameOffer) + '</p>' +
                    '<p style="font-weight: bold; margin: 0;">Human Resources Manager.</p>' +
                    '</td>' +
                    '<td width="50%" align="right" valign="top">' +
                    '<p style="font-weight: bold; margin: 0 0 30px 0;">I accept the said terms &amp; conditions:</p>' +
                    '<p style="font-weight: bold; margin: 0 0 2px 0;">' + titlePrefix + ' ' + escapeXml(emp_name_final) + '</p>' +
                    '<p style="font-weight: bold; margin: 0;">Signature and accept</p>' +
                    '</td>' +
                    '</tr>' +
                    '</table>';
            }
            else {
                // generic fallback
                bodyHtml = '<div class="container">' +
                    '<table width="100%" style="border-bottom: 1px solid #000000; padding-bottom: 5px; margin-bottom: 20px;">' +
                    '<tr>' +
                    '<td>' +
                    '<p style="font-size: 10pt; font-weight: bold; margin: 0;">' + escapeXml(companyName) + '</p>' +
                    '<p style="font-size: 9pt; margin: 2px 0 0 0;">' + escapeXml(companyAddress1) + ', ' + escapeXml(companyAddress2) + '</p>' +
                    '</td>' +
                    '</tr>' +
                    '</table>' +
                    '<div class="info" style="margin-top: 30px; margin-bottom: 20px;">' +
                    '<p style="margin: 0 0 10px 0; font-size: 9.5pt;">Date: ' + escapeXml(letterDate) + '</p>' +
                    '<p style="margin: 0; font-size: 9.5pt;"><b>To:</b><br/>' + letterToHtml + '</p>' +
                    '</div>' +
                    '<table width="100%" style="margin-bottom: 30px;">' +
                    '<tr>' +
                    '<td align="center">' +
                    '<p style="font-size: 12px; text-decoration: underline; margin: 0; font-weight: bold;">' + docTitle.toUpperCase() + '</p>' +
                    '</td>' +
                    '</tr>' +
                    '</table>' +
                    '<div style="font-size: 11px; line-height: 140%;">' + filledTemplate + '</div>' +
                    '<div class="footer" style="margin-top: 50px;">' +
                    '<p style="margin: 0 0 40px 0; font-size: 9.5pt;">Yours truly,</p>' +
                    '<p style="margin: 0; font-size: 9.5pt;"><b>Authorized Signatory</b></p>' +
                    '<p style="margin: 0; font-size: 9.5pt;">' + escapeXml(signatoryTitle) + '</p>' +
                    '</div>' +
                    '</div>';
            }

            // Final PDF XML structure
            var pdfBodyAttributes = 'size="A4" padding="20mm 15mm 20mm 15mm" footer="certfooter" footer-height="10mm"';
            if (certType === '2') {
                pdfBodyAttributes = 'size="A4" padding="28mm 12mm 25mm 12mm" header="offerheader" header-height="22mm" footer="offerfooter" footer-height="18mm"';
            }

            var pdfContent = '<?xml version="1.0" encoding="UTF-8"?>' +
                '<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">' +
                '<pdf>' +
                '<head>' +
                baseStyle +
                '<macrolist>' +
                '<macro id="certfooter">' +
                '<table width="100%">' +
                '<tr>' +
                '<td align="left" style="font-size: 8pt; color: #666666;">Page <pagenumber/> of <totalpages/></td>' +
                '<td align="right" style="font-size: 8pt; color: #666666; font-style: italic;">This is an automated document generated by the system</td>' +
                '</tr>' +
                '</table>' +
                '</macro>' +
                (certType === '2' ?
                    '<macro id="offerheader">' +
                    '<table width="100%" style="border-collapse: collapse; margin:0; padding-top: -50;">' +
                    '<tr><td align="center" style="margin: 0; padding: 0;">' +
                    '<img src="" width="100%" style="margin: 0; padding: 0;" />' +
                    '</td></tr></table>' +
                    '</macro>' +
                    '<macro id="offerfooter">' +
                    '<table width="100%" style="border-collapse: collapse; margin: 0; padding-top: 50;">' +
                    '<tr><td align="center" style="margin: 0; padding: 0;">' +
                    '<img src="" width="100%" height="45" style="margin: 0; padding: 0;" />' +
                    '</td></tr></table>' +
                    '</macro>' : '') +
                '</macrolist>' +
                '</head>' +
                '<body ' + pdfBodyAttributes + '>' +
                bodyHtml +
                '</body>' +
                '</pdf>';

            var pdfFile = render.xmlToPdf({ xmlString: pdfContent });

            response.setHeader({ name: 'Content-Type', value: 'application/pdf' });
            response.setHeader({
                name: 'Content-Disposition',
                value: 'inline; filename="' + docTitle.replace(/\s+/g, '_') + '.pdf"'
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