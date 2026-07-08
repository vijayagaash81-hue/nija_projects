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
                var lines = addressText.split(/\r?\n/).filter(function (s) { return s.trim() !== ""; });
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

            var emp_name = empRec.getValue({ fieldId: 'custentity_hris_emplegalname' }) || empRec.getValue({ fieldId: 'entityid' }) || '';
            var emp_desi = empRec.getText({ fieldId: 'custentity_hris_empdesignation' }) || '';
            var emp_nation = empRec.getText({ fieldId: 'custentity_hris_empnationality' }) || '';

            // Get passport details from the recmachcustrecord_hris_emp_link sublist
            var emp_pass = '';
            var emp_exdate_raw = '';
            try {
                var lineCount = empRec.getLineCount({ sublistId: 'recmachcustrecord_hris_emp_link' });
                for (var i = 0; i < lineCount; i++) {
                    var idType = empRec.getSublistValue({
                        sublistId: 'recmachcustrecord_hris_emp_link',
                        fieldId: 'custrecord_hris_emp_id_type',
                        line: i
                    });
                    if (idType == '2' || idType == 2) {
                        emp_pass = empRec.getSublistValue({
                            sublistId: 'recmachcustrecord_hris_emp_link',
                            fieldId: 'custrecord_hris_id_no',
                            line: i
                        }) || '';
                        emp_exdate_raw = empRec.getSublistValue({
                            sublistId: 'recmachcustrecord_hris_emp_link',
                            fieldId: 'custrecord_hris_date_exp',
                            line: i
                        }) || '';
                        break;
                    }
                }
            } catch (sublistErr) {
                log.error('Error fetching passport from sublist', sublistErr.message);
            }

            // Fallbacks in case sublist check yields nothing
            if (!emp_pass) {
                emp_pass = empRec.getValue({ fieldId: 'custentity_hris_emppassportno' }) || '';
            }
            if (!emp_exdate_raw) {
                emp_exdate_raw = empRec.getValue({ fieldId: 'custentity_hris_emppassexpdate' }) || empRec.getText({ fieldId: 'custentity_hris_emppassexpdate' }) || '';
            }

            var emp_name_final = emp_name || req_emp_legal_name || '';
            var emp_desi_final = req_emp_desi || emp_desi || '';
            var emp_nation_final = req_emp_nation || emp_nation || '';

            var emp_exdate = formatDateLong(emp_exdate_raw);

            var emp_hiredate_raw = empRec.getText({ fieldId: 'hiredate' }) || '';
            var emp_hiredate = formatDateLong(emp_hiredate_raw);
            var emp_startdate_final = req_emp_joining_raw ? formatDateLong(req_emp_joining_raw) : emp_hiredate;

            // Get job confirmation date for "since XXX"
            var emp_job_confirm_dt_raw = empRec.getValue({ fieldId: 'custentity_hris_empjobconfirmationdt' }) || empRec.getText({ fieldId: 'custentity_hris_empjobconfirmationdt' }) || '';
            var emp_job_confirm_dt = formatDateLong(emp_job_confirm_dt_raw);
            if (!emp_job_confirm_dt) {
                emp_job_confirm_dt = emp_startdate_final;
            }

            // Get purpose of request
            var purpose_of_request = letterRec.getValue({ fieldId: 'custrecord_hris_letreq_purposed_requeste' }) || letterRec.getText({ fieldId: 'custrecord_hris_letreq_purposed_requeste' }) || '';

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
                log.emergency("gross_salary_formatted", gross_salary_formatted);
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
                    var breakdownRows = [];
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

                        if (monthlyAmt > 0) {
                            breakdownRows.push({
                                name: componentText,
                                amount: monthlyAmt
                            });
                        }
                    }

                    for (var j = 0; j < breakdownRows.length; j++) {
                        var isLastRow = (j === breakdownRows.length - 1);
                        var rowBorder = isLastRow ? 'border-bottom: 1.5px solid #000000;' : 'border-bottom: 1px solid #d1d5db;';

                        salary_breakdown_rows_html += '<tr style="' + rowBorder + ' line-height: 22px;">' +
                            '<td width="60%" align="left" style="padding: 4px 8px;">' + escapeXml(breakdownRows[j].name) + '</td>' +
                            '<td width="10%" align="left" style="padding: 4px 8px;">' + escapeXml(currency) + '</td>' +
                            '<td align="right" style="padding: 4px 8px;">' + formatNumberWithCommas(breakdownRows[j].amount) + '</td>' +
                            '</tr>';
                    }
                } catch (loadCompErr) {
                    log.error('Error loading compensation details sublist', loadCompErr.message);
                }
            }

            if (!salary_breakdown_rows_html) {
                salary_breakdown_rows_html = '<tr style="border-bottom: 1.5px solid #000000; line-height: 22px;">' +
                    '<td width="60%" align="left" style="padding: 4px 8px;">Gross Salary</td>' +
                    '<td width="10%" align="left" style="padding: 4px 8px;">' + escapeXml(currency) + '</td>' +
                    '<td align="right" style="padding: 4px 8px;">' + escapeXml(gross_salary_formatted) + '</td>' +
                    '</tr>';
            }

            var salary_breakdown_table_html = '<table width="90%" style="border-collapse: collapse; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; margin-bottom: 20px;">' +
                '<tbody>' +
                salary_breakdown_rows_html +
                '<tr style="font-weight: bold; border-bottom: 2px double #000000; line-height: 24px;">' +
                '<td>Total Monthly Salary:</td>' +
                '<td>' + escapeXml(currency) + '</td>' +
                '<td align="right">' + escapeXml(gross_salary_formatted) + '</td>' +
                '</tr>' +
                '</tbody>' +
                '</table>';

            // Clean subsidiary name of parent prefixes
            var companyName = emp_sub;
            if (companyName && companyName.indexOf(':') > -1) {
                var subParts = companyName.split(':');
                companyName = subParts[subParts.length - 1].trim();
            }
            if (!companyName) {
                companyName = 'Elev8 Architectural Design Consultancy LLC';
            }

            // Load Subsidiary Record Details for Header Address block
            var companyAddress1 = '';
            var companyAddress2 = '';
            var companyPhone = '';
            var companyFax = '';
            var companyEmail = '';
            var companyAddressHtml = '';

            var subsidiaryId = letterRec.getValue({ fieldId: 'custrecord_hris_letreq_subsidiary' }) || empRec.getValue({ fieldId: 'subsidiary' });
            var logoUrl = '';
            try {
                var logoFile = file.load({ id: 5448 });
                logoUrl = logoFile.url;
            } catch (logoErr) {
                log.error('Error loading main logo file 5448', logoErr.message);
            }

            if (subsidiaryId) {
                try {
                    var subRec = record.load({
                        type: 'subsidiary',
                        id: subsidiaryId
                    });

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
                    companyEmail = subRec.getValue({ fieldId: 'email' }) || '';

                    var mainAddress = subRec.getSubrecord({ fieldId: 'mainaddress' });
                    if (mainAddress) {
                        var fullAddrText = mainAddress.getValue({ fieldId: 'addrtext' }) || '';

                        // Split by new line and remove empty lines
                        var addrLines = fullAddrText.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(function (s) { return s !== ""; });
                        if (addrLines.length > 0) {
                            companyAddressHtml = addrLines.map(escapeXml).join('<br/>');
                        }

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

            if (!companyAddressHtml) {
                companyAddressHtml = 'Office No. 508, Building No. 2,<br/>Emaar Business Park, Sheikh Zayed RD.<br/>Dubai, United Arab Emirates';
            }
            if (!companyPhone) {
                companyPhone = '+971 04 451 1196';
            }
            if (!companyEmail) {
                companyEmail = 'info@elev8architects.com';
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
                .replace(/{{emp_name}}/g, escapeXml(emp_name_final))
                .replace(/{{emp_nation}}/g, escapeXml(emp_nation_final))
                .replace(/{{emp_pass}}/g, escapeXml(emp_pass))
                .replace(/{{emp_exdate}}/g, escapeXml(emp_exdate))
                .replace(/{{emp_hiredate}}/g, escapeXml(emp_hiredate))
                .replace(/{{emp_startdate}}/g, escapeXml(emp_startdate_final)) // Mapping Start Date to final start date
                .replace(/{{emp_desi}}/g, escapeXml(emp_desi_final))
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
                .replace(/{{company_address}}/g, escapeXml(companyAddress1))
                .replace(/{{emp_dept}}/g, escapeXml(emp_dept))
                .replace(/{{emp_leavedate}}/g, escapeXml(emp_leavedate))
                .replace(/{{salary_breakdown}}/g, salary_breakdown_table_html);

            // Process address line breaks
            /*  var letterTo = letterRec.getValue({ fieldId: 'custrecord_hris_letreq_letter_addressed' }) || '';
             var letterToHtml = escapeXml(letterTo).replace(/\n/g, '<br/>'); */
            /*  var letterTo = letterRec.getValue({ fieldId: 'custrecord_hris_letreq_letter_addressed' }) || '';
             var letterToHtml = escapeXml(letterTo).replace(/[\r\n]+/g, '<br/>'); */

            var letterToRaw = letterRec.getValue({ fieldId: 'custrecord_hris_letreq_letter_addressed' }) || "";
            var letterToHtml = processAddress(letterToRaw);
            log.emergency("letterToHtml", letterToHtml);
            // Get Reference Number
            var refNo = letterRec.getValue({ fieldId: 'name' }) || letterRec.getValue({ fieldId: 'id' }) || '';

            // Get Letter Date
            var letterReqDate_raw = letterRec.getText({ fieldId: 'custrecord_hris_letreq_request_date_cre' }) ||
                letterRec.getValue({ fieldId: 'custrecord_hris_letreq_request_date_cre' }) || '';
            var letterDate = letterReqDate_raw ? formatDateLong(letterReqDate_raw) : formatDateLong(new Date());

            // Signatory details
            var signatoryName = 'Jene Roa';
            var signatoryTitle = 'People & Talent Manager';
            var signatoryNameOffer = 'Mr. Abuthahir Mohamed';
            var titlePrefix = (emp_gender === 'Male') ? 'Mr.' : 'Ms.';

            // Base Layout styling
            var baseStyle = '<style type="text/css">' +
                '@page {' +
                ' margin-top: 0;' +
                ' margin-bottom: 0;' +
                ' margin-left: 0;' +
                ' margin-right: 0;' +
                '}' +
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
                logoHtmlElement = '<img src="' + escapeXml(logoUrl) + '" width="70" height="90" style="object-fit: contain;" />';
            } else {
                logoHtmlElement = '<table style="background-color: #8c8c8c; width: 95px; height: 95px; border-collapse: collapse; margin: 0;">' +
                    '<tr>' +
                    '<td align="center" valign="middle" style="padding: 0 5px;">' +
                    '<p style="font-size: 20pt; color: #ffffff; margin: 0 0 -2px 0; font-family: Arial, Helvetica, sans-serif; font-weight: normal; line-height: 22px;">Elev8</p>' +
                    '<p style="font-size: 5.5pt; color: #e5e5e5; margin: 0; font-family: Arial, Helvetica, sans-serif; letter-spacing: 2px; line-height: 7px; text-transform: uppercase; font-weight: bold;">Architects</p>' +
                    '</td>' +
                    '</tr>' +
                    '</table>';
            }

            var headerHtml = '<table width="100%" style="border-collapse: collapse; margin-top: 0; margin-bottom: 30px;">' +
                '<tr>' +
                '<td width="35%" valign="top" align="left" style="padding-top: -72pt;">' +
                logoHtmlElement +
                '</td>' +
                '<td width="40%" valign="top" align="left" style="font-size: 7.5pt; color: #8e8e8e; line-height: 12px; font-family: Arial, Helvetica, sans-serif; padding-top: -52pt;">' +
                '<p style="margin: 0;">' + companyAddressHtml + '</p>' +
                '</td>' +
                '<td width="25%" valign="top" align="left" style="font-size: 7.5pt; color: #8e8e8e; line-height: 12px; font-family: Arial, Helvetica, sans-serif; padding-top: -52pt;">' +
                '<p style="margin: 0;">T: ' + escapeXml(companyPhone) + '</p>' +
                '<p style="margin: 0;">' + escapeXml(companyEmail) + '</p>' +
                '</td>' +
                '</tr>' +
                '</table>';

            // Offer Letter specific header and footer templates are now loaded as image macros

            var bodyHtml = '';

            if (certType === '3') {
                // SALARY CERTIFICATE
                var emp_mr_prefix = (emp_gender === 'Male') ? 'Mr.' : 'Mrs.';

                var passportPhrase = '';
                if (emp_nation_final && emp_pass) {
                    passportPhrase = ', holder of ' + escapeXml(emp_nation_final) + ' passport no. ' + escapeXml(emp_pass) + ',';
                } else if (emp_pass) {
                    passportPhrase = ', holder of passport no. ' + escapeXml(emp_pass) + ',';
                } else if (emp_nation_final) {
                    passportPhrase = ', of ' + escapeXml(emp_nation_final) + ' nationality,';
                }

                var certificateBodyText = '<p style="margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 17px; text-align: justify; color: #000000;">This is to certify that ' + emp_mr_prefix + ' ' + escapeXml(emp_name_final) + passportPhrase + ' is associated with Eleveight Architectural Design Consultancy LLC since ' + escapeXml(emp_job_confirm_dt) + ' up to the present and holds the position of ' + escapeXml(emp_desi_final) + '. ' + emp_his_her_cap + ' total monthly remuneration is AED ' + escapeXml(gross_salary_formatted) + ' inclusive of all allowances.</p>' +
                    '<p style="margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 17px; text-align: justify; color: #000000;">This certification is issued upon the request of ' + emp_mr_prefix + ' ' + escapeXml(emp_name_final) + ' for the purpose of ' + escapeXml(purpose_of_request) + '.</p>' +
                    '<p style="margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 17px; text-align: justify; color: #000000;">Please note that this letter does not constitute any guarantee on our part towards repayment of any type of loan or credit card nor will the company have any legal and financial liability as a result of non-payment. This letter is issued with no liability on the part of the undersigned or the company.</p>' +
                    '<p style="margin: 0 0 25px 0; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 17px; text-align: justify; color: #000000;">For any questions, please reach us through e-mail at <a href="mailto:j.roa@elev8architects.com" style="color: #0000ff; text-decoration: underline;">j.roa@elev8architects.com</a> or office number 04 451 1196.</p>';

                bodyHtml =
                    '<p style="margin: 0 0 4px 0; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 15px; color: #000000;">Ref: ' + escapeXml(refNo) + '</p>' +
                    '<p style="margin: 0 0 15px 0; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 15px; color: #000000;">Date: ' + escapeXml(letterDate) + '</p>' +
                    '<p style="margin: 0 0 15px 0; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 14px; color: #000000;">' + letterToHtml + '</p>' +
                    '<p style="margin: 0 0 15px 0; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000000;">To Whom It May Concern,</p>' +
                    '<p style="margin: 0 0 15px 0; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000000;">Dear Sir/Madam,</p>' +
                    '<p style="margin: 0 0 20px 0; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; font-weight: bold; text-decoration: underline; color: #000000;">Subject: Salary Certificate</p>' +
                    certificateBodyText +
                    '<p style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; margin: 0 0 40px 0; line-height: 14px; color: #000000;">' +
                    'Yours faithfully,<br/>' +
                    'For and on behalf of Eleveight Architectural Design Consultancy LLC' +
                    '</p>' +
                    '<div style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000000; line-height: 14px;">' +
                    '<p style="font-weight: bold; margin: 0;">' + escapeXml(signatoryName) + '</p>' +
                    '<p style="margin: 0;">' + escapeXml(signatoryTitle) + '</p>' +
                    '</div>';
            }
            else if (certType === '4') {
                // EXPERIENCE LETTER
                bodyHtml =
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
                bodyHtml =
                    // Page 1
                    '<div style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 15px; color: #000000; margin-bottom: 20px;">' +
                    '<p style="margin: 0 0 4px 0;"><b>Ref:</b> ' + escapeXml(refNo) + '</p>' +
                    '<p style="margin: 0;"><b>Date:</b> ' + escapeXml(letterDate) + '</p>' +
                    '</div>' +

                    '<div style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 14px; color: #000000; margin-bottom: 20px;">' +
                    '<p style="margin: 0;"><b>Attn:</b> ' + escapeXml(emp_name_final) + '</p>' +
                    '</div>' +

                    '<p style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; font-weight: bold; color: #000000; margin-bottom: 20px;">Appointment Letter for the position of ' + escapeXml(emp_desi_final) + '.</p>' +

                    '<p style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000000; margin-bottom: 15px;">Dear ' + escapeXml(emp_name_final) + ',</p>' +

                    '<p style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000000; margin-bottom: 15px; text-align: justify; line-height: 15px;">' +
                    'We are pleased to offer you the position of <b>' + escapeXml(emp_desi_final) + '</b> within our company.' +
                    '</p>' +

                    '<p style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000000; margin-bottom: 15px;">We propose the following, as part of your package:</p>' +

                    '<table style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 18px; margin-bottom: 20px;">' +
                    '<tr><td width="100"><b>Position:</b></td><td>' + escapeXml(emp_desi_final) + '</td></tr>' +
                    '<tr><td width="100"><b>Location:</b></td><td>Dubai</td></tr>' +
                    '<tr><td width="100"><b>Start Date:</b></td><td>' + escapeXml(emp_startdate_final) + '</td></tr>' +
                    '</table>' +

                    '<p style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000000; margin-bottom: 15px; text-align: justify; line-height: 15px;">' +
                    'Upon issuance of the official UAE Ministry of Human Resources and Emiratisation Contract, both the MOHRE Contract\'s and Appointment Letter\'s information / details should apply at all times.' +
                    '</p>' +

                    '<p style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000000; margin-bottom: 15px; text-align: justify; line-height: 15px;">' +
                    'Your remuneration shall be <b>AED ' + escapeXml(gross_salary_formatted) + ' (Dirhams ' + escapeXml(gross_salary_words) + ' Only)</b> per month, inclusive of all allowances (i.e. Transportation, Housing, Flight &amp; Other Allowance).' +
                    '</p>' +

                    '<p style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000000; margin-bottom: 12px;">The compensation package will be:</p>' +

                    salary_breakdown_table_html +

                    // Page Break to Page 2
                    '<pbr/>' +

                    // Page 2
                    '<p style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; font-weight: bold; color: #000000; margin-bottom: 12px;">Your Other Benefits:</p>' +
                    '<table style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 16px; margin-bottom: 20px;">' +
                    '<tr><td valign="top" width="20">1.</td><td align="justify">Vacation &ndash; 30 calendar days per year.</td></tr>' +
                    '<tr><td valign="top">2.</td><td align="justify">End of service Gratuity &ndash; Upon satisfactory completion of your service, you will be entitled to Severance Pay in accordance with the UAE Labour Law.</td></tr>' +
                    '<tr><td valign="top">3.</td><td align="justify">Medical Insurance will be provided by the company for the employee.</td></tr>' +
                    '</table>' +

                    '<p style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; font-weight: bold; color: #000000; margin-bottom: 12px;">Some information about your employment to note is as follows:</p>' +
                    '<table style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 16px; margin-bottom: 20px;">' +
                    '<tr><td valign="top" width="20">1.</td><td align="justify">Office timings from 08:30 am &ndash; 6:00 pm daily (Lunch break 1:00&ndash; 2:00pm) 5 days a week (Monday to Friday).</td></tr>' +
                    '<tr><td valign="top">2.</td><td align="justify">The Allowance is an all-inclusive company contribution toward accommodation, dependent children education tuitions, cost of utilities, local transportation, relocation and other costs associated with living in the United Arab Emirates.</td></tr>' +
                    '<tr><td valign="top">3.</td><td align="justify">The employee is subject to a probationary period of (6) six months. A confirmation of employment will be shared upon completion of the probationary period.</td></tr>' +
                    '<tr><td valign="top">4.</td><td align="justify">Should the Employee or the Company terminate employment during the probationary period, a notice period in line with article 9 of UAE labor law must be provided.</td></tr>' +
                    '<tr><td valign="top">5.</td><td align="justify">Confidentiality: The Employee understands and acknowledges that during the course of employment with Elev8, he will have access to and learn about confidential documents and other information, in tangible and intangible form, relating to the Employer and Co- employees ("Confidential Information"). This information includes, but is not limited to, all information not generally known to the public, in spoken, printed, electronic or any other form. The Employee further understands and acknowledges that this Confidential Information is of the Employer&rsquo;s ability to reserve it for the exclusive knowledge and use of the Employer is of great importance, and that improper use or disclosure of the Confidential Information may lead to strict disciplinary action.</td></tr>' +
                    '<tr><td valign="top">6.</td><td align="justify">This appointment offer is subject to Elev8 successfully obtaining the necessary MOHRE work permit.</td></tr>' +
                    '</table>' +

                    '<p style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000000; margin-bottom: 15px;">This offer is valid for 5 working days from the date of issue.</p>' +

                    '<p style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000000; margin-bottom: 15px; text-align: justify; line-height: 15px;">' +
                    'We hope the above information is helpful and to your approval. As soon as you officially notify us that the above would be acceptable and of your date of availability, we will initiate joining formalities.' +
                    '</p>' +

                    '<p style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000000; margin-bottom: 15px;">Please do not hesitate to ask any questions you may have. Looking forward to your favorable response.</p>' +

                    // Page Break to Page 3
                    '<pbr/>' +

                    // Page 3
                    '<p style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000000; margin-bottom: 40px; line-height: 15px;">' +
                    'Yours sincerely,<br/><br/>' +
                    '<b>Elev8 Architects HR Department</b>' +
                    '</p>' +

                    '<p style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; color: #000000; margin-bottom: 50px;">Received and Accepted:</p>' +

                    '<table width="100%" style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; margin-top: 30px;">' +
                    '<tr>' +
                    '<td width="45%" align="center" valign="bottom" style="border-top: 1px solid #000000; padding-top: 5px;">' +
                    escapeXml(emp_name_final) +
                    '</td>' +
                    '<td width="10%"></td>' +
                    '<td width="45%" align="center" valign="bottom" style="border-top: 1px solid #000000; padding-top: 5px;">' +
                    'Date' +
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
            var pdfBodyAttributes = 'size="A4" padding="25mm 15mm 20mm 15mm" header="certheader" header-height="25mm" footer="certfooter" footer-height="12mm"';

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
                '<table width="100%" style="border-collapse: collapse;">' +
                '<tr>' +
                '<td align="left" style="font-size: 7.5pt; color: #8e8e8e; font-family: Arial, Helvetica, sans-serif;">www.elev8architects.com</td>' +
                '<td align="right" style="font-size: 7.5pt; color: #8e8e8e; font-family: Arial, Helvetica, sans-serif;">DUBAI | LONDON | ABU DHABI | MANILA</td>' +
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