/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/render', 'N/record', 'N/file', 'N/log', 'N/search', 'N/format'], (render, record, file, log, search, format) => {

    /**
     * Helper function to format dates as DD/MM/YYYY
     */
    function formatDate(dateVal) {
        if (!dateVal) return '';
        let dateObj = dateVal;
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
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year}`;
    }

    /**
     * Helper function to search list of field IDs in order and return first non-empty value
     */
    function getFieldFromList(rec, fieldIdList) {
        for (let i = 0; i < fieldIdList.length; i++) {
            try {
                const val = rec.getValue({ fieldId: fieldIdList[i] });
                if (val) return val;
                const text = rec.getText({ fieldId: fieldIdList[i] });
                if (text) return text;
            } catch (e) {
                // Ignore and continue
            }
        }
        return '';
    }

    /**
     * Definition of the Suitelet office trigger.
     */
    const onRequest = (context) => {
        if (context.request.method !== 'GET') {
            context.response.write('Only GET requests are supported.');
            return;
        }

        try {
            const recordId = context.request.parameters.id;

            if (!recordId) {
                context.response.write('Error: Missing required parameter "id". Usage: ?id=<RECORD_ID>');
                return;
            }

            // 1. Load the Visa Renewal / Cancellation Record
            const rec = record.load({
                type: 'customrecord_hris_visalrenewalcancelform',
                id: recordId
            });

            const empId = rec.getValue('custrecord_hris_visarencan_empname');
            const visaNo = rec.getValue('custrecord_hris_visarencan_visano');

            // Debug Dump Endpoint to view all fields on the records
            if (context.request.parameters.debug === 'T' || context.request.parameters.debug === 'true') {
                const parentFields = {};
                rec.getFields().forEach(f => {
                    try {
                        parentFields[f] = {
                            value: rec.getValue(f),
                            text: rec.getText(f) || ''
                        };
                    } catch (e) {
                        parentFields[f] = { error: e.message };
                    }
                });

                let employeeFields = {};
                if (empId) {
                    try {
                        const empRec = record.load({ type: 'employee', id: empId });
                        empRec.getFields().forEach(f => {
                            try {
                                employeeFields[f] = {
                                    value: empRec.getValue(f),
                                    text: empRec.getText(f) || ''
                                };
                            } catch (e) {
                                employeeFields[f] = { error: e.message };
                            }
                        });
                    } catch (e) {
                        employeeFields = { error: e.message };
                    }
                }

                context.response.setHeader({ name: 'Content-Type', value: 'application/json' });
                context.response.write(JSON.stringify({
                    recordType: rec.type,
                    recordId: rec.id,
                    parentFields: parentFields,
                    employeeFields: employeeFields
                }, null, 4));
                return;
            }

            if (!empId) {
                context.response.write('Error: Employee not selected on the Visa Renewal record.');
                return;
            }

            // 2. Load the Employee record to extract personal details securely
            const empRec = record.load({
                type: 'employee',
                id: empId
            });

            // Employee Name & Code
            const employeeName = empRec.getValue({ fieldId: 'custentity_hris_emplegalname' }) || empRec.getValue({ fieldId: 'entityid' }) || '';
            const employeeCode = empRec.getValue({ fieldId: 'custentity_hris_empcode' }) || empRec.getValue({ fieldId: 'entityid' }) || '';

            // Designation & Department
            const designation = empRec.getText({ fieldId: 'custentity_hris_empdesignation' }) || empRec.getText({ fieldId: 'title' }) || '';
            const department = rec.getText({ fieldId: 'custrecord_hris_visarencan_dept' }) || empRec.getText({ fieldId: 'custentity_hris_empdepartment_new' }) || empRec.getText({ fieldId: 'department' }) || '';

            // Supervisor details (prioritizing Project Supervisor) and stripping code prefix
            let supervisorName = empRec.getText({ fieldId: 'custentity_hris_emp_projectsupervisor' }) || empRec.getText({ fieldId: 'supervisor' }) || '';
            if (supervisorName) {
                const superMatch = supervisorName.match(/^([A-Za-z0-9_-]+)\s+(.+)$/);
                if (superMatch) {
                    const firstPart = superMatch[1];
                    if (/^[A-Za-z0-9_-]+$/.test(firstPart) && (/[0-9]/.test(firstPart) || /^EM/i.test(firstPart))) {
                        supervisorName = superMatch[2];
                    }
                }
            }

            // Passport & Visa Details
            const passportNo = empRec.getValue({ fieldId: 'custentity_hris_emppassportno' }) || '';

            // UID, Labour Card, Visa No and Visa Expiry (Try-catch self-healing matching list)
            const uidNo = getFieldFromList(empRec, ['custentity_hris_empvisauidno', 'custentity_hris_empuid', 'custentity_hris_uidno', 'custentity_uid_no', 'custentity_hris_empuidno']);
            const labourCardNo = getFieldFromList(empRec, ['custentity_hris_emp_labourcard_no', 'custentity_hris_emplabourcardno', 'custentity_hris_labourcardno', 'custentity_labour_card_no', 'custentity_hris_emplaborcard', 'custentity_hris_labourcard']);
            // const visaNo = getFieldFromList(empRec, ['custrecord_hris_visarencan_visano', 'custentity_hris_visano', 'custentity_visa_no', 'custentity_hris_visanumber', 'custentity_hris_empvisanumber']);

            const rawVisaExpiry = getFieldFromList(empRec, ['custentity_hris_empvisadateofexpiry', 'custentity_hris_empvisaexpdate', 'custentity_hris_visaexpdate', 'custentity_visa_expiry_date', 'custentity_hris_visaexpiry', 'custentity_hris_visaexpirydate']);
            const visaExpiryDate = formatDate(rawVisaExpiry);

            // 3. Subsidiary Details & Logo
            let logoUrl = '';
            let companyName = '';
            const subsidiaryId = getFieldFromList(rec, ['custrecord_hris_visarencan_subsidiary', 'custrecord_hris_visaren_subsidiary']) || empRec.getValue({ fieldId: 'subsidiary' });
            if (subsidiaryId) {
                try {
                    const subRec = record.load({
                        type: 'subsidiary',
                        id: subsidiaryId
                    });
                    const logoId = subRec.getValue('logo') || subRec.getValue('pagelogo');
                    if (logoId) {
                        const logoFile = file.load({ id: logoId });
                        logoUrl = logoFile.url;
                    }
                    const legalName = subRec.getValue('legalname') || subRec.getValue('name');
                    if (legalName) {
                        if (legalName.indexOf(':') > -1) {
                            const parts = legalName.split(':');
                            companyName = parts[parts.length - 1].trim();
                        } else {
                            companyName = legalName;
                        }
                    }
                } catch (subErr) {
                    log.error('Error loading subsidiary details', subErr.message);
                }
            }

            if (!companyName) {
                companyName = 'Al Najma Al Fareeda International Group';
            }

            // 4. Gather contract renewal dates if present on the form or fall back to blank lines
            const empContractExpiry = empRec.getValue({ fieldId: 'custentity_hris_emp_labcontract_exp_dt' });
            const contractExpiryDate = formatDate(empContractExpiry) || formatDate(getFieldFromList(rec, ['custrecord_hris_visaren_con_expiry', 'custrecord_hris_visaren_expiry_date', 'custrecord_visaren_con_expiry'])) || '.........................................';
            const contractNewExpiryDate = formatDate(getFieldFromList(rec, ['custrecord_hris_visaren_con_new_expiry', 'custrecord_hris_visaren_new_expiry_date', 'custrecord_visaren_con_new_expiry'])) || '.........................................';
            
            // Calculate Sign Return Date as 15 days after empContractExpiry
            let contractSignReturnDate = '.........................................';
            if (empContractExpiry) {
                try {
                    let expiryObj = empContractExpiry;
                    if (typeof empContractExpiry === 'string') {
                        expiryObj = format.parse({ value: empContractExpiry, type: format.Type.DATE });
                    }
                    if (expiryObj instanceof Date && !isNaN(expiryObj.getTime())) {
                        const returnDateObj = new Date(expiryObj.getTime());
                        returnDateObj.setDate(returnDateObj.getDate() + 15);
                        contractSignReturnDate = formatDate(returnDateObj);
                    }
                } catch (e) {
                    log.error('Error calculating return date', e.message);
                }
            }
            if (contractSignReturnDate === '.........................................') {
                contractSignReturnDate = formatDate(getFieldFromList(rec, ['custrecord_hris_visaren_return_date', 'custrecord_hris_visaren_sign_return', 'custrecord_visaren_return_date'])) || '.........................................';
            }

            // Calculate work permit range dynamically (current year to next 2 years)
            let startYear = new Date().getFullYear();
            const reqDateVal = rec.getValue('custrecord_hris_visarencan_request_date');
            if (reqDateVal) {
                try {
                    let dateObj = reqDateVal;
                    if (typeof reqDateVal === 'string') {
                        dateObj = format.parse({ value: reqDateVal, type: format.Type.DATE });
                    }
                    if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
                        startYear = dateObj.getFullYear();
                    }
                } catch (e) {
                    log.error('Error parsing request date for range', e.message);
                }
            }
            const endYear = startYear + 2;
            const workPermitRange = `${startYear} - ${endYear}`;

            // Today's date for printing
            const printDate = formatDate(rec.getValue('custrecord_hris_visarencan_request_date')) || formatDate(new Date());

            // Checkbox status mapping (1 = Renewal, 2 = Cancellation)
            const visaStatus = rec.getValue('custrecord_hris_visarencan_status');
            const isRenewalChecked = (visaStatus == '1');
            const isCancellationChecked = (visaStatus == '2');

            // 5. Gather PDF variables
            const data = {
                logoUrl: logoUrl,
                companyName: companyName,
                employeeName: employeeName,
                employeeCode: employeeCode,
                designation: designation,
                department: department,
                supervisorName: supervisorName,
                passportNo: passportNo,
                uidNo: uidNo || '.........................................',
                labourCardNo: labourCardNo || '.........................................',
                visaNo: visaNo || '.........................................',
                visaExpiryDate: visaExpiryDate || '.........................................',
                contractExpiryDate: contractExpiryDate,
                contractNewExpiryDate: contractNewExpiryDate,
                contractSignReturnDate: contractSignReturnDate,
                workPermitRange: workPermitRange,
                printDate: printDate,
                isRenewalChecked: isRenewalChecked,
                isCancellationChecked: isCancellationChecked
            };

            log.debug('PDF Rendering Data Source', JSON.stringify(data));

            // 6. Select the appropriate XML Template based on category
            const category = rec.getValue('custrecord_hris_visaren_category');
            let templatePath = '';

            // 6 = Staff, 9 = Management -> Staff Notice (HR42)
            // 8 = Labour, 10 = Daily Wages -> Workers Notice (HR42A)
            if (category == '6' || category == '9') {
                templatePath = './njt_visa_renewal_staff_template.xml';
            } else if (category == '8' || category == '10') {
                templatePath = './njt_visa_renewal_workers_template.xml';
            } else {
                // Fallback to Staff template
                templatePath = 'SuiteScripts/Visa renewal/njt_visa_renewal_staff_template.xml';
            }

            const xmlFile = file.load({ id: templatePath });
            const xmlContent = xmlFile.getContents();

            // 7. Render PDF using N/render
            const renderer = render.create();
            renderer.templateContent = xmlContent;

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'data',
                data: data
            });

            const pdfFile = renderer.renderAsPdf();

            context.response.setHeader({ name: 'Content-Type', value: 'application/pdf' });
            context.response.setHeader({
                name: 'Content-Disposition',
                value: `inline; filename="Visa_Renewal_Notice_${recordId}.pdf"`
            });
            context.response.writeFile({ file: pdfFile, isInline: true });

        } catch (e) {
            log.error('Error Generating Visa Renewal PDF', e.toString());
            context.response.write(`An error occurred: ${e.message || e.toString()}`);
        }
    };

    return {
        onRequest
    };
});
