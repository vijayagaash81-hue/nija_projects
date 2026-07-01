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

            // 1. Load the passport request record directly using the script ID
            const rec = record.load({
                type: 'customrecord_hris_passport_requestform',
                id: recordId
            });

            // Debug Dump Endpoint to view all fields on the record
            if (context.request.parameters.debug === 'T' || context.request.parameters.debug === 'true') {
                const fieldList = rec.getFields();
                const fieldValues = {};
                fieldList.forEach(f => {
                    try {
                        fieldValues[f] = {
                            value: rec.getValue(f),
                            text: rec.getText(f) || ''
                        };
                    } catch (e) {
                        fieldValues[f] = { error: e.message };
                    }
                });
                context.response.setHeader({ name: 'Content-Type', value: 'application/json' });
                context.response.write(JSON.stringify({
                    recordType: rec.type,
                    recordId: rec.id,
                    fields: fieldValues
                }, null, 4));
                return;
            }

            // 2. Fetch Employee details via lookup
            const empId = rec.getValue('custrecord_hris_pass_empname');
            let employeeCode = '';
            let siteName = '';
            let employeeName = rec.getText('custrecord_hris_pass_empname') || '';

            if (empId) {
                try {
                    const empLookup = search.lookupFields({
                        type: search.Type.EMPLOYEE,
                        id: empId,
                        columns: ['custentity_hris_empcode', 'entityid', 'location', 'custentity_hris_emplegalname']
                    });

                    if (empLookup) {
                        if (empLookup.custentity_hris_empcode) {
                            employeeCode = empLookup.custentity_hris_empcode;
                        } else if (empLookup.entityid) {
                            employeeCode = empLookup.entityid;
                        }
                        if (empLookup.location && empLookup.location.length > 0) {
                            siteName = empLookup.location[0].text;
                        }
                        if (!employeeName) {
                            employeeName = empLookup.custentity_hris_emplegalname || '';
                        }
                    }
                } catch (empErr) {
                    log.error('Error looking up employee fields', empErr.message);
                }
            }

            // 3. Resolve subsidiary details & logo
            let logoUrl = '';
            const subsidiaryId = rec.getValue('custrecord_hris_pass_subsidiary');
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
                } catch (subErr) {
                    log.error('Error loading subsidiary details', subErr.message);
                }
            }

            // 4. Resolve purpose checkmarks dynamically from customrecord_hris_purpose_type
            const selectedPurpose = rec.getValue({ fieldId: 'custrecord_hris_pass_purpose' });
            let selectedPurposeIds = [];
            if (selectedPurpose) {
                if (Array.isArray(selectedPurpose)) {
                    selectedPurposeIds = selectedPurpose.map(id => String(id).trim());
                } else {
                    selectedPurposeIds = [String(selectedPurpose).trim()];
                }
            }

            const purposesList = [];

            try {
                const purposeSearch = search.create({
                    type: 'customrecord_hris_purpose_type',
                    filters: [['isinactive', 'is', 'false']],
                    columns: ['name']
                });

                purposeSearch.run().each(result => {
                    const id = String(result.id).trim(); // ALWAYS use result.id
                    let name = result.getValue('name') || '';

                    purposesList.push({
                        id: id,
                        name: name,
                        checked: (selectedPurposeIds.indexOf(id) > -1)
                    });
                    return true;
                });
            } catch (err) {
                log.error('Error fetching dynamic purpose list', err.message);
            }

            // Fallback standard list if search returns empty, for safety
            if (purposesList.length === 0) {
                const fallbackItems = [
                    'Renewal', 'EL', 'AL', 'FINAL EXIT', 'Emirates ID',
                    'NOC', 'Police Station', 'Bank Purpose',
                    'Court Case', 'Immigration Case', 'Others'
                ];
                
                const selectedTextVal = rec.getText({ fieldId: 'custrecord_hris_pass_purpose' });
                let selectedTexts = [];
                if (selectedTextVal) {
                    if (Array.isArray(selectedTextVal)) {
                        selectedTexts = selectedTextVal.map(t => String(t).toLowerCase().trim());
                    } else {
                        selectedTexts = [String(selectedTextVal).toLowerCase().trim()];
                    }
                }

                fallbackItems.forEach((name, index) => {
                    const matchText = name.replace(' please specify', '').toLowerCase().trim();
                    const isChecked = selectedTexts.some(t => t.indexOf(matchText) > -1);
                    purposesList.push({
                        id: 'fb_' + index,
                        name: name,
                        checked: isChecked
                    });
                });
            }

            // 5. Gather PDF variables
            const data = {
                logoUrl: logoUrl,
                employeeName: employeeName,
                employeeCode: employeeCode,
                jobTitle: rec.getText('custrecord_hris_pass_designation') || '',
                department: rec.getText('custrecord_hris_pass_department') || '',
                passportNo: rec.getValue('custrecord_hris_pass_passno') || '',
                siteName: siteName || rec.getText('custrecord_hris_pass_subsidiary') || '',
                purposes: purposesList,
                dateOfRelease: formatDate(rec.getValue('custrecord_hris_pass_requestdate') || rec.getValue('custrecord_hris_pass_from_date')),
                dateOfReturn: formatDate(rec.getValue('custrecord_hris_pass_returndate') || rec.getValue('custrecord_hris_pass_to_date'))
            };

            log.debug('PDF Rendering Data Source', JSON.stringify(data));

            // 6. Load XML Template content directly from File Cabinet ID 28735
            const xmlFile = file.load({ id: 28735 });
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
                value: `inline; filename="Documents_Release_Form_${recordId}.pdf"`
            });
            context.response.writeFile({ file: pdfFile, isInline: true });

        } catch (e) {
            log.error('Error Generating Passport Request PDF', e.toString());
            context.response.write(`An error occurred: ${e.message || e.toString()}`);
        }
    };

    return {
        onRequest
    };

});
