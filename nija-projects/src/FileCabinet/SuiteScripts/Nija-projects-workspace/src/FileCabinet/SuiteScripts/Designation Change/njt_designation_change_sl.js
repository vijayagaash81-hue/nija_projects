/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(['N/render', 'N/record', 'N/file', 'N/log', 'N/search', 'N/format'], (render, record, file, log, search, format) => {

    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    // Replace this with the actual NetSuite File Cabinet ID of the uploaded XML template
    const XML_TEMPLATE_ID = 28857;

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
     * Helper function to parse boolean values robustly
     */
    function parseBool(val) {
        if (!val) return false;
        const s = String(val).toLowerCase().trim();
        return s === 't' || s === 'true' || s === 'y' || s === 'yes' || val === true;
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
            const recordType = context.request.parameters.rectype || 'customrecord_change_in_status';

            if (!recordId) {
                context.response.write('Error: Missing required parameter "id". Usage: ?id=<RECORD_ID>');
                return;
            }

            // 1. Load the Change in Status parent record
            const rec = record.load({
                type: recordType,
                id: recordId
            });

            // 2. Debug Dump Endpoint to view all fields on the record
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

                const sublistLines = [];
                const sublistFields = [
                    'custrecord_hris_cisd_date',
                    'custrecord_hris_cisd_department',
                    'custrecord_hris_cisd_employee_name',
                    'custrecord_hris_cisd_from_designation',
                    'custrecord_hris_cisd_increment',
                    'custrecord_hris_cisd_subsidiary',
                    'custrecord_hris_cisd_to_department',
                    'custrecord_hris_cisd_to_designation',
                    'custrecord_hris_cisd_updated'
                ];

                const lineCount = rec.getLineCount({ sublistId: 'recmachcustrecord_hris_cisd_link' });
                for (let i = 0; i < lineCount; i++) {
                    const lineData = {};
                    sublistFields.forEach(f => {
                        try {
                            lineData[f] = {
                                value: rec.getSublistValue({ sublistId: 'recmachcustrecord_hris_cisd_link', fieldId: f, line: i }),
                                text: rec.getSublistText({ sublistId: 'recmachcustrecord_hris_cisd_link', fieldId: f, line: i }) || ''
                            };
                        } catch (e) {
                            lineData[f] = { error: e.message };
                        }
                    });
                    sublistLines.push(lineData);
                }

                context.response.setHeader({ name: 'Content-Type', value: 'application/json' });
                context.response.write(JSON.stringify({
                    recordType: rec.type,
                    recordId: rec.id,
                    parentFields: parentFields,
                    sublistLines: sublistLines
                }, null, 4));
                return;
            }

            // 3. Process sublist lines to gather transfer details
            const reasonForTransfer = rec.getValue('custrecord_hris_cis_reason_for_transfer') || '';
            const reasons = [];
            try {
                search.create({
                    type: 'customlist_transfer_reason',
                    columns: ['name', 'internalid']
                }).run().each(result => {
                    reasons.push({
                        id: result.getValue('internalid'),
                        name: result.getValue('name')
                    });
                    return true;
                });
            } catch (err) {
                log.error('Error searching customlist_transfer_reason', err.message);
                // Fallback to default reasons if list search fails
                reasons.push(
                    { id: '1', name: 'Promotion' },
                    { id: '2', name: 'Demotion' },
                    { id: '3', name: 'Reliever' },
                    { id: '4', name: 'Job Rotation' },
                    { id: '5', name: 'Others' }
                );
            }
            const lineCount = rec.getLineCount({ sublistId: 'recmachcustrecord_hris_cisd_link' });
            const transfers = [];

            for (let i = 0; i < lineCount; i++) {
                const empId = rec.getSublistValue({ sublistId: 'recmachcustrecord_hris_cisd_link', fieldId: 'custrecord_hris_cisd_employee_name', line: i });
                const rawEmpName = rec.getSublistText({ sublistId: 'recmachcustrecord_hris_cisd_link', fieldId: 'custrecord_hris_cisd_employee_name', line: i }) || '';

                let employeeCode = '';
                let employeeName = rawEmpName;
                let supervisorName = '';
                let siteName = '';

                // Perform Employee Lookup to fetch Employee No., Supervisor, and Work Location (Site)
                if (empId) {
                    try {
                        const empLookup = search.lookupFields({
                            type: search.Type.EMPLOYEE,
                            id: empId,
                            columns: ['custentity_hris_empcode', 'entityid', 'custentity_hris_emp_projectsupervisor', 'location']
                        });

                        if (empLookup) {
                            if (empLookup.custentity_hris_empcode) {
                                employeeCode = empLookup.custentity_hris_empcode;
                            } else if (empLookup.entityid) {
                                employeeCode = empLookup.entityid;
                            }
                            if (empLookup.custentity_hris_emp_projectsupervisor && empLookup.custentity_hris_emp_projectsupervisor.length > 0) {
                                supervisorName = empLookup.custentity_hris_emp_projectsupervisor[0].text || '';
                            }
                            if (supervisorName) {
                                const superMatch = supervisorName.match(/^([A-Za-z0-9_-]+)\s+(.+)$/);
                                if (superMatch) {
                                    const firstPart = superMatch[1];
                                    if (/^[A-Za-z0-9_-]+$/.test(firstPart) && (/[0-9]/.test(firstPart) || /^EM/i.test(firstPart))) {
                                        supervisorName = superMatch[2];
                                    }
                                }
                            }
                            if (empLookup.location && empLookup.location.length > 0) {
                                siteName = empLookup.location[0].text || '';
                            }
                        }
                    } catch (empErr) {
                        log.error(`Error looking up employee details on line ${i}`, empErr.message);
                    }
                }

                // Clean up employee name by stripping the employee code prefix
                if (employeeCode && employeeName.indexOf(employeeCode) === 0) {
                    employeeName = employeeName.substring(employeeCode.length).trim();
                } else {
                    const match = rawEmpName.match(/^([A-Za-z0-9_-]+)\s+(.+)$/);
                    if (match) {
                        if (!employeeCode) {
                            employeeCode = match[1];
                        }
                        employeeName = match[2];
                    }
                }

                // Fetch other sublist field texts and values
                const dateVal = rec.getSublistValue({ sublistId: 'recmachcustrecord_hris_cisd_link', fieldId: 'custrecord_hris_cisd_date', line: i });
                const fromDesignation = rec.getSublistText({ sublistId: 'recmachcustrecord_hris_cisd_link', fieldId: 'custrecord_hris_cisd_from_designation', line: i }) || '';
                const fromDepartment = rec.getSublistText({ sublistId: 'recmachcustrecord_hris_cisd_link', fieldId: 'custrecord_hris_cisd_department', line: i }) || '';
                const toDesignation = rec.getSublistText({ sublistId: 'recmachcustrecord_hris_cisd_link', fieldId: 'custrecord_hris_cisd_to_designation', line: i }) || '';
                const toDepartment = rec.getSublistText({ sublistId: 'recmachcustrecord_hris_cisd_link', fieldId: 'custrecord_hris_cisd_to_department', line: i }) || '';
                const subsidiaryId = rec.getSublistValue({ sublistId: 'recmachcustrecord_hris_cisd_link', fieldId: 'custrecord_hris_cisd_subsidiary', line: i });
                const incrementVal = rec.getSublistValue({ sublistId: 'recmachcustrecord_hris_cisd_link', fieldId: 'custrecord_hris_cisd_increment', line: i });

                const isIncrement = parseBool(incrementVal);

                // Determine Reason for Transfer checkboxes dynamically based on custrecord_hris_cis_reason_for_transfer
                // 1 = Promotion, 2 = Demotion, 3 = Reliever, 4 = Job Rotation, 5 = Others
                const isPromotion = (reasonForTransfer == '1');
                const isDemotion = (reasonForTransfer == '2');
                const isReliever = (reasonForTransfer == '3');
                const isJobRotation = (reasonForTransfer == '4');
                const isOthers = (reasonForTransfer == '5');

                transfers.push({
                    employeeName: employeeName,
                    employeeCode: employeeCode,
                    fromDesignation: fromDesignation,
                    fromDepartment: fromDepartment,
                    toDesignation: toDesignation,
                    toDepartment: toDepartment,
                    date: formatDate(dateVal),
                    supervisorName: supervisorName,
                    siteName: siteName || rec.getText('custrecord_hris_cis_subsidiary') || '',
                    subsidiaryId: subsidiaryId,
                    isPromotion: isPromotion,
                    isDemotion: isDemotion,
                    isReliever: isReliever,
                    isJobRotation: isJobRotation,
                    isOthers: isOthers,
                    reasonId: reasonForTransfer
                });
            }

            // 4. Resolve Subsidiary logo URL dynamically using the first transfer line's subsidiary as reference
            let logoUrl = '';
            if (transfers.length > 0 && transfers[0].subsidiaryId) {
                try {
                    const subRec = record.load({
                        type: 'subsidiary',
                        id: transfers[0].subsidiaryId
                    });
                    const logoId = subRec.getValue('logo') || subRec.getValue('pagelogo');
                    if (logoId) {
                        const logoFile = file.load({ id: logoId });
                        logoUrl = logoFile.url;
                    }
                } catch (subErr) {
                    log.error('Error loading subsidiary logo', subErr.message);
                }
            }

            // 5. Gather PDF template content
            let xmlContent = '';
            const templateId = context.request.parameters.xmlid || XML_TEMPLATE_ID;

            try {
                const xmlFile = file.load({ id: templateId });
                xmlContent = xmlFile.getContents();
                log.debug('Template Loaded', `Loaded via ID: ${templateId}`);
            } catch (err) {
                log.error(`Failed to load template with ID: ${templateId}`, err.message);
                throw new Error(`Could not load XML template. Please ensure the File ID "${templateId}" is correct in the Suitelet configuration.`);
            }

            // 6. Bind data to template and render
            const data = {
                logoUrl: logoUrl,
                transfers: transfers,
                reasons: reasons
            };

            log.debug('PDF Rendering Data Source', JSON.stringify(data));

            const renderer = render.create();
            renderer.templateContent = xmlContent;

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'data',
                data: data
            });

            const pdfFile = renderer.renderAsPdf();

            // 7. Send the PDF response
            context.response.setHeader({ name: 'Content-Type', value: 'application/pdf' });
            context.response.setHeader({
                name: 'Content-Disposition',
                value: `inline; filename="Employee_Transfer_Form_${recordId}.pdf"`
            });
            context.response.writeFile({ file: pdfFile, isInline: true });

        } catch (e) {
            log.error('Error Generating Employee Transfer PDF', e.toString());
            context.response.write(`An error occurred: ${e.message || e.toString()}`);
        }
    };

    return {
        onRequest
    };

});
