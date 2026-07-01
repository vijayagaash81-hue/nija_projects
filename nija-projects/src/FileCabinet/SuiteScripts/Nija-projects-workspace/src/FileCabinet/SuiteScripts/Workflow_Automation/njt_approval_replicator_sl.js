/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/search', 'N/url', 'N/runtime', 'N/log', 'N/redirect'], 
(serverWidget, record, search, url, runtime, log, redirect) => {

    const RECORD_TYPES = [
        { type: 'customrecord_hris_leaveapplication', suffix: 'Leave Application' },
        { type: 'customrecord_noc', suffix: 'NOC' },
        { type: 'customrecord_hris_passport_requestform', suffix: 'Passport Request' },
        { type: 'customrecord_hris_emp_transfer', suffix: 'Employee Transfer' },
        { type: 'customrecord_change_in_status', suffix: 'Change In Status' },
        { type: 'customrecord_disciplinary_memo', suffix: 'Disciplinary Memo' },
        { type: 'customrecord_hris_resign_form', suffix: 'Resignation Form' },
        { type: 'customrecord_hris_visarenewalcancelform', suffix: 'Visa Renewal' },
        { type: 'customrecord_hr_interview_evaluation_for', suffix: 'Interview Assessment Form' }
    ];

    const onRequest = (context) => {
        try {
            if (context.request.method === 'GET') {
                handleGet(context);
            } else {
                handlePost(context);
            }
        } catch (e) {
            log.error({
                title: 'Suitelet Error',
                details: e
            });
            context.response.write('An error occurred: ' + e.message);
        }
    };

    /**
     * Renders the Approval Setup Bulk Creator Form
     */
    const handleGet = (context) => {
        var form = serverWidget.createForm({
            title: 'Bulk Approval Setup Creator'
        });

        // 1. Target Department Select Field
        var deptField = form.addField({
            id: 'custpage_department',
            type: serverWidget.FieldType.SELECT,
            label: 'Target Department'
        });
        deptField.isMandatory = true;
        deptField.addSelectOption({ value: '', text: 'Select Department...' });

        var deptSearch = search.create({
            type: 'customrecord_cseg_hris_empdept',
            filters: [['isinactive', 'is', 'F']],
            columns: [
                search.createColumn({ name: 'name', sort: search.Sort.ASC }),
                'internalid'
            ]
        });
        var deptResults = deptSearch.run().getRange({ start: 0, end: 1000 }) || [];
        for (var d = 0; d < deptResults.length; d++) {
            deptField.addSelectOption({
                value: deptResults[d].getValue('internalid'),
                text: deptResults[d].getValue('name')
            });
        }

        // 2. Name Prefix Text Field
        var prefixField = form.addField({
            id: 'custpage_prefix',
            type: serverWidget.FieldType.TEXT,
            label: 'Name Prefix (e.g. QHSE, MAR)'
        });
        prefixField.isMandatory = true;
        prefixField.helpText = 'This prefix will be prepended to the name of each generated setup (e.g. "QHSE Leave Application").';

        // 3. Enable Email Notification Checkbox
        var emailField = form.addField({
            id: 'custpage_email_enabled',
            type: serverWidget.FieldType.CHECKBOX,
            label: 'Enable Email Notification'
        });
        emailField.defaultValue = 'F';

        // 4. Inline Editor Sublist for Approval Levels
        var sublist = form.addSublist({
            id: 'custpage_levels_sublist',
            type: serverWidget.SublistType.INLINEEDITOR,
            label: 'Approval Levels Flow'
        });

        // Level Column
        var colLevel = sublist.addField({
            id: 'custpage_level',
            type: serverWidget.FieldType.INTEGER,
            label: 'Level'
        });
        colLevel.isMandatory = true;

        // Approval Type Column
        var colType = sublist.addField({
            id: 'custpage_type',
            type: serverWidget.FieldType.SELECT,
            label: 'Approval Type'
        });
        colType.isMandatory = true;
        colType.addSelectOption({ value: '', text: '' });
        colType.addSelectOption({ value: '1', text: 'Employee' });
        colType.addSelectOption({ value: '2', text: 'Role' });

        // Role Column
        var colRole = sublist.addField({
            id: 'custpage_role',
            type: serverWidget.FieldType.SELECT,
            label: 'Role'
        });
        colRole.addSelectOption({ value: '', text: '' });
        try {
            var roleSearch = search.create({
                type: 'role',
                filters: [['isinactive', 'is', 'F']],
                columns: [
                    search.createColumn({ name: 'name', sort: search.Sort.ASC }),
                    'internalid'
                ]
            });
            var roleResults = roleSearch.run().getRange({ start: 0, end: 1000 }) || [];
            for (var r = 0; r < roleResults.length; r++) {
                colRole.addSelectOption({
                    value: roleResults[r].getValue('internalid'),
                    text: roleResults[r].getValue('name')
                });
            }
        } catch (roleErr) {
            log.error('Error fetching roles for select', roleErr);
        }

        // Employee Column
        var colEmployee = sublist.addField({
            id: 'custpage_employee',
            type: serverWidget.FieldType.SELECT,
            label: 'Employee'
        });
        colEmployee.addSelectOption({ value: '', text: '' });
        
        var empSearch = search.create({
            type: 'employee',
            filters: [['isinactive', 'is', 'F']],
            columns: [
                search.createColumn({ name: 'entityid', sort: search.Sort.ASC }),
                'internalid'
            ]
        });
        var empResults = empSearch.run().getRange({ start: 0, end: 1000 }) || [];
        for (var e = 0; e < empResults.length; e++) {
            colEmployee.addSelectOption({
                value: empResults[e].getValue('internalid'),
                text: empResults[e].getValue('entityid')
            });
        }

        form.addSubmitButton({
            label: 'Generate Department Setups'
        });

        context.response.writePage(form);
    };

    /**
     * Processes submission and bulk creates setups
     */
    const handlePost = (context) => {
        var request = context.request;
        var departmentId = request.parameters.custpage_department;
        var prefix = request.parameters.custpage_prefix.trim();
        var emailEnabled = request.parameters.custpage_email_enabled === 'T';

        // Fetch department name for the confirmation screen
        var departmentName = '';
        try {
            var deptLookup = search.lookupFields({
                type: 'customrecord_cseg_hris_empdept',
                id: departmentId,
                columns: ['name']
            });
            if (deptLookup && deptLookup.name) {
                departmentName = Array.isArray(deptLookup.name) ? (deptLookup.name[0].text || deptLookup.name[0]) : deptLookup.name;
            }
        } catch (deptErr) {
            log.error('Error looking up department name', deptErr);
        }
        if (!departmentName) {
            departmentName = 'Department ID ' + departmentId;
        }

        // Parse sublist lines
        var lineCount = request.getLineCount({ group: 'custpage_levels_sublist' });
        var levels = [];
        for (var i = 0; i < lineCount; i++) {
            var levelVal = request.getSublistValue({ group: 'custpage_levels_sublist', name: 'custpage_level', line: i });
            var typeVal = request.getSublistValue({ group: 'custpage_levels_sublist', name: 'custpage_type', line: i });
            var roleVal = request.getSublistValue({ group: 'custpage_levels_sublist', name: 'custpage_role', line: i });
            var empVal = request.getSublistValue({ group: 'custpage_levels_sublist', name: 'custpage_employee', line: i });

            if (levelVal && typeVal) {
                levels.push({
                    level: levelVal,
                    type: typeVal,
                    role: typeVal === '2' ? roleVal : '',
                    employee: typeVal === '1' ? empVal : ''
                });
            }
        }

        if (levels.length === 0) {
            throw new Error('Please define at least one approval level in the sublist.');
        }

        // Dynamically determine the field type of custrecord_as_recordtype (mirroring njt_wrkflow.js behavior)
        var recordTypeFieldType = 'text';
        try {
            var dummyRec = record.create({ type: 'customrecord_approval_setup' });
            var fieldObj = dummyRec.getField({ fieldId: 'custrecord_as_recordtype' });
            if (fieldObj && fieldObj.type) {
                recordTypeFieldType = fieldObj.type;
            }
        } catch (err) {
            log.debug('Error checking field type, defaulting to text', err.message);
        }

        var createdRecords = [];

        // Loop through each of the 9 record types
        RECORD_TYPES.forEach(function(recDef) {
            var recordTypeScriptId = recDef.type;
            var suffix = recDef.suffix;

            var recordTypeVal = recordTypeScriptId;
            if (recordTypeFieldType === 'select') {
                recordTypeVal = getRecordTypeInternalId(recordTypeScriptId);
            }

            // 1. Inactivate existing active setups for this department + record type
            inactivateExistingSetups(recordTypeVal, recordTypeFieldType, departmentId);

            // 2. Create the parent customrecord_approval_setup record
            var setupRec = record.create({
                type: 'customrecord_approval_setup',
                isDynamic: true
            });
            setupRec.setValue({
                fieldId: 'name',
                value: prefix + ' ' + suffix
            });
            setupRec.setValue({
                fieldId: 'custrecord_as_recordtype',
                value: recordTypeVal
            });
            setupRec.setValue({
                fieldId: 'custrecord_as_department',
                value: departmentId
            });
            setupRec.setValue({
                fieldId: 'custrecord_as_active',
                value: true
            });
            setupRec.setValue({
                fieldId: 'custrecord_as_email_enabled',
                value: emailEnabled
            });

            var setupId = setupRec.save();

            // 3. Create child levels details
            levels.forEach(function(level) {
                var detailRec = record.create({
                    type: 'customrecord_approval_setup_detail',
                    isDynamic: true
                });
                detailRec.setValue({
                    fieldId: 'name',
                    value: (prefix + ' ' + suffix + ' - Level ' + level.level).substring(0, 80)
                });
                detailRec.setValue({
                    fieldId: 'custrecord_asd_parent',
                    value: setupId
                });
                detailRec.setValue({
                    fieldId: 'custrecord_asd_level',
                    value: level.level
                });
                detailRec.setValue({
                    fieldId: 'custrecord_asd_type',
                    value: level.type
                });

                if (level.type === '1') { // Employee
                    detailRec.setValue({
                        fieldId: 'custrecord_asd_employee',
                        value: level.employee
                    });
                } else if (level.type === '2') { // Role
                    detailRec.setValue({
                        fieldId: 'custrecord_asd_role',
                        value: level.role
                    });
                }

                detailRec.save();
            });

            // Get link to the newly created record
            var viewUrl = url.resolveRecord({
                recordType: 'customrecord_approval_setup',
                recordId: setupId
            });

            createdRecords.push({
                name: prefix + ' ' + suffix,
                recordType: suffix,
                url: viewUrl
            });
        });

        // Build premium confirmation page
        var backUrl = url.resolveScript({
            scriptId: runtime.getCurrentScript().id,
            deploymentId: runtime.getCurrentScript().deploymentId
        });

        var html = buildSuccessHtml(departmentName, prefix, createdRecords, backUrl);

        var responseForm = serverWidget.createForm({
            title: 'Generation Status'
        });
        var htmlField = responseForm.addField({
            id: 'custpage_status_html',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Status'
        });
        htmlField.defaultValue = html;

        context.response.writePage(responseForm);
    };

    /**
     * Resolves the custom record type's internal ID from its scriptid
     */
    function getRecordTypeInternalId(scriptId) {
        try {
            var typeSearch = search.create({
                type: 'customrecordtype',
                filters: [['scriptid', 'is', scriptId]],
                columns: ['internalid']
            });
            var typeResult = typeSearch.run().getRange({ start: 0, end: 1 });
            if (typeResult && typeResult.length > 0) {
                return typeResult[0].getValue('internalid');
            }
        } catch (e) {
            log.error('Error resolving record type internal id', e);
        }
        return scriptId;
    }

    /**
     * Searches for active setups and sets them to inactive
     */
    function inactivateExistingSetups(recordTypeVal, fieldType, departmentId) {
        try {
            var filterOperator = fieldType === 'select' ? 'anyof' : 'is';
            var existingSetupSearch = search.create({
                type: 'customrecord_approval_setup',
                filters: [
                    ['custrecord_as_recordtype', filterOperator, recordTypeVal],
                    'AND',
                    ['custrecord_as_department', 'anyof', departmentId],
                    'AND',
                    ['custrecord_as_active', 'is', 'T']
                ],
                columns: ['internalid']
            });

            var existingResults = existingSetupSearch.run().getRange({ start: 0, end: 100 }) || [];
            for (var x = 0; x < existingResults.length; x++) {
                record.submitFields({
                    type: 'customrecord_approval_setup',
                    id: existingResults[x].getValue('internalid'),
                    values: {
                        custrecord_as_active: false
                    }
                });
            }
        } catch (e) {
            log.error('Error inactivating existing setups', e);
        }
    }

    /**
     * Renders a premium HTML confirmation dashboard
     */
    function buildSuccessHtml(departmentName, prefix, createdRecords, backUrl) {
        var rowsHtml = '';
        createdRecords.forEach(function(rec) {
            rowsHtml += `
                <tr style="border-bottom: 1px solid #e2e8f0; transition: background-color 0.2s;">
                    <td style="padding: 12px 16px; color: #0f172a; font-weight: 500;">${escapeHtml(rec.name)}</td>
                    <td style="padding: 12px 16px; color: #64748b; font-size: 13px;">${escapeHtml(rec.recordType)}</td>
                    <td style="padding: 12px 16px; text-align: center;">
                        <a href="${rec.url}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 500; font-size: 13px; display: inline-flex; align-items: center;">
                            View Record <span style="margin-left: 4px;">↗</span>
                        </a>
                    </td>
                </tr>
            `;
        });

        return `
            <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; max-width: 900px; margin: 10px auto; padding: 30px; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
                <div style="display: flex; align-items: center; background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px 20px; border-radius: 8px; margin-bottom: 25px;">
                    <span style="background-color: #22c55e; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; margin-right: 16px; flex-shrink: 0;">✓</span>
                    <div>
                        <h2 style="color: #15803d; margin: 0; font-size: 18px; font-weight: 600;">Approval Setups Created Successfully</h2>
                        <p style="color: #166534; margin: 2px 0 0 0; font-size: 14px;">Activated and configured 9 setups for department: <strong>${escapeHtml(departmentName)}</strong></p>
                    </div>
                </div>
                
                <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">
                    The approval levels flow has been replicated across all 9 custom workflows. Any pre-existing active setups for the combination of <strong>${escapeHtml(departmentName)}</strong> and these record types have been set to Inactive automatically.
                </p>

                <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 25px;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; background-color: #ffffff;">
                        <thead>
                            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                                <th style="padding: 12px 16px; font-weight: 600; color: #475569; font-size: 13px;">Created Approval Setup Name</th>
                                <th style="padding: 12px 16px; font-weight: 600; color: #475569; font-size: 13px;">Record Suffix</th>
                                <th style="padding: 12px 16px; font-weight: 600; color: #475569; font-size: 13px; text-align: center; width: 120px;">Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>

                <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    <a href="${backUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: background-color 0.2s;">
                        ← Configure Another Department
                    </a>
                </div>
            </div>
        `;
    }

    function escapeHtml(string) {
        return String(string).replace(/[&<>"']/g, function(s) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[s];
        });
    }

    return {
        onRequest
    };
});
