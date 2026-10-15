/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 *
 * Description: Suitelet to find and return the preferred form Script ID and Internal ID for a given custom record ID
 * or custom record type ID. Supports interactive UI, plain text Script ID / Internal ID output, and JSON response formats.
 */
define([
    'N/ui/serverWidget',
    'N/record',
    'N/search',
    'N/query',
    'N/url',
    'N/redirect',
    'N/log'
], (serverWidget, record, search, query, url, redirect, log) => {

    /**
     * Entry point for Suitelet
     * @param {Object} scriptContext
     * @param {ServerRequest} scriptContext.request
     * @param {ServerResponse} scriptContext.response
     */
    const onRequest = (scriptContext) => {
        const { request, response } = scriptContext;

        try {
            const params = request.parameters;
            const recTypeInput = (params.custpage_rectype || params.rectype || params.recordtype || '').trim();
            const recIdInput = (params.custpage_recid || params.recid || params.id || '').trim();
            const action = (params.custpage_action || params.action || '').trim();
            const outputFormat = (params.output || params.format || '').toLowerCase().trim();

            // 1. Plain Text Script ID Output (Returns ONLY the Form Script ID)
            if (outputFormat === 'scriptid' || outputFormat === 'formscriptid') {
                if (!recTypeInput) {
                    response.writeHeader({ contentType: 'text/plain' });
                    response.write('ERROR: Missing record type parameter (rectype)');
                    return;
                }
                const formDetails = getPreferredFormDetails(recTypeInput, recIdInput);
                response.writeHeader({ contentType: 'text/plain' });
                response.write(formDetails.formScriptId ? String(formDetails.formScriptId) : (formDetails.formId ? String(formDetails.formId) : ''));
                return;
            }

            // 2. Plain Text Internal ID Output (Returns ONLY the Form Internal ID)
            if (outputFormat === 'id' || outputFormat === 'raw' || outputFormat === 'txt' || outputFormat === 'internalid') {
                if (!recTypeInput) {
                    response.writeHeader({ contentType: 'text/plain' });
                    response.write('ERROR: Missing record type parameter (rectype)');
                    return;
                }
                const formDetails = getPreferredFormDetails(recTypeInput, recIdInput);
                response.writeHeader({ contentType: 'text/plain' });
                response.write(formDetails.formId ? String(formDetails.formId) : '');
                return;
            }

            // 3. JSON Output Format
            if (outputFormat === 'json') {
                response.writeHeader({ contentType: 'application/json' });
                if (!recTypeInput) {
                    response.write(JSON.stringify({ success: false, error: 'Missing record type parameter (rectype)' }));
                    return;
                }
                const formDetails = getPreferredFormDetails(recTypeInput, recIdInput);
                response.write(JSON.stringify({
                    success: !formDetails.error,
                    formScriptId: formDetails.formScriptId,
                    formInternalId: formDetails.formId ? parseInt(formDetails.formId, 10) : null,
                    formName: formDetails.formName,
                    recordType: formDetails.resolvedType,
                    recordId: recIdInput ? parseInt(recIdInput, 10) : null,
                    source: formDetails.source,
                    error: formDetails.error
                }));
                return;
            }

            // 4. Direct Redirect Mode
            if (action === 'redirect' && recTypeInput && recIdInput) {
                const formDetails = getPreferredFormDetails(recTypeInput, recIdInput);
                const redirectParams = {};
                if (formDetails.formId) {
                    redirectParams.cf = formDetails.formId;
                }
                redirect.toRecord({
                    type: formDetails.resolvedType || recTypeInput,
                    id: recIdInput,
                    isEditMode: false,
                    parameters: redirectParams
                });
                return;
            }

            // 5. Interactive HTML / UI Form View
            const form = serverWidget.createForm({
                title: 'Custom Record Preferred Form Details'
            });

            form.addSubmitButton({ label: 'Get Form Details' });

            if (recTypeInput && recIdInput) {
                form.addButton({
                    id: 'custpage_btn_redirect',
                    label: 'Open Record in Preferred Form',
                    functionName: `window.open('${buildRecordUrl(recTypeInput, recIdInput, false)}', '_blank')`
                });
            }

            form.addButton({
                id: 'custpage_btn_reset',
                label: 'Reset',
                functionName: 'window.location.href = window.location.pathname'
            });

            // Field Group 1: Inputs
            const searchGroup = form.addFieldGroup({
                id: 'grp_search_criteria',
                label: 'Lookup Criteria'
            });
            searchGroup.isSingleColumn = false;

            const recTypeField = form.addField({
                id: 'custpage_rectype',
                type: serverWidget.FieldType.TEXT,
                label: 'Custom Record Type (Script ID or Internal ID)',
                container: 'grp_search_criteria'
            });
            recTypeField.isMandatory = true;
            recTypeField.defaultValue = recTypeInput;
            recTypeField.helpText = 'e.g., customrecord_hris_leaveapplication or numeric internal ID';

            const recIdField = form.addField({
                id: 'custpage_recid',
                type: serverWidget.FieldType.INTEGER,
                label: 'Custom Record Internal ID',
                container: 'grp_search_criteria'
            });
            recIdField.defaultValue = recIdInput;
            recIdField.helpText = 'Internal ID of the record instance (e.g., 1052). Optional if looking up default form for record type.';

            // Execute Lookup if record type input is present
            if (recTypeInput) {
                const resultsGroup = form.addFieldGroup({
                    id: 'grp_form_results',
                    label: 'Form Details Result'
                });

                try {
                    const formDetails = getPreferredFormDetails(recTypeInput, recIdInput);

                    if (formDetails.error) {
                        const errorField = form.addField({
                            id: 'custpage_error_msg',
                            type: serverWidget.FieldType.INLINEHTML,
                            label: 'Status',
                            container: 'grp_form_results'
                        });
                        errorField.defaultValue = `<div style="color: #d9534f; font-weight: bold; padding: 12px; background-color: #fdf7f7; border: 1px solid #d9534f; border-radius: 4px;">
                            ⚠️ ${escapeHtml(formDetails.error)}
                        </div>`;
                    } else {
                        // Prominent Form Details Highlight Banner
                        const formIdHighlight = form.addField({
                            id: 'custpage_form_id_banner',
                            type: serverWidget.FieldType.INLINEHTML,
                            label: 'Form Details Banner',
                            container: 'grp_form_results'
                        });

                        const formScriptIdVal = formDetails.formScriptId ? escapeHtml(String(formDetails.formScriptId)) : 'N/A';
                        const formIdVal = formDetails.formId ? escapeHtml(String(formDetails.formId)) : 'N/A (Default Form)';

                        formIdHighlight.defaultValue = `
                            <div style="padding: 18px; background-color: #eef7ff; border: 2px solid #0066cc; border-radius: 6px; margin-bottom: 20px;">
                                <div style="display: flex; gap: 40px; flex-wrap: wrap;">
                                    <div>
                                        <span style="font-size: 12px; text-transform: uppercase; color: #555; font-weight: bold; letter-spacing: 1px;">Form Script ID</span>
                                        <div style="font-size: 24px; font-weight: bold; color: #0066cc; margin-top: 4px; font-family: monospace;">
                                            ${formScriptIdVal}
                                        </div>
                                    </div>
                                    <div style="border-left: 1px solid #cce0ff; padding-left: 30px;">
                                        <span style="font-size: 12px; text-transform: uppercase; color: #555; font-weight: bold; letter-spacing: 1px;">Form Internal ID</span>
                                        <div style="font-size: 24px; font-weight: bold; color: #333; margin-top: 4px;">
                                            ${formIdVal}
                                        </div>
                                    </div>
                                </div>
                                <div style="font-size: 13px; color: #444; margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddebf8;">
                                    Form Name: <strong>${escapeHtml(formDetails.formName || 'Standard Entry Form')}</strong>
                                </div>
                            </div>
                        `;

                        // Form Script ID Field
                        const formScriptIdField = form.addField({
                            id: 'custpage_disp_form_script_id',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Form Script ID',
                            container: 'grp_form_results'
                        });
                        formScriptIdField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                        formScriptIdField.defaultValue = formDetails.formScriptId || 'N/A';

                        // Form Internal ID Field (Inline Text)
                        const formIdField = form.addField({
                            id: 'custpage_disp_form_id',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Form Internal ID (customform / cf)',
                            container: 'grp_form_results'
                        });
                        formIdField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                        formIdField.defaultValue = formDetails.formId ? String(formDetails.formId) : 'Standard System Form';

                        // Custom Form Name
                        const formNameField = form.addField({
                            id: 'custpage_disp_form_name',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Custom Form Name',
                            container: 'grp_form_results'
                        });
                        formNameField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                        formNameField.defaultValue = formDetails.formName || 'Standard Form';

                        // Record Type Script ID
                        const resolvedTypeField = form.addField({
                            id: 'custpage_disp_rectype',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Record Type Script ID',
                            container: 'grp_form_results'
                        });
                        resolvedTypeField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                        resolvedTypeField.defaultValue = formDetails.resolvedType || recTypeInput;

                        // Record ID Display
                        if (recIdInput) {
                            const dispRecIdField = form.addField({
                                id: 'custpage_disp_recid',
                                type: serverWidget.FieldType.TEXT,
                                label: 'Record Internal ID',
                                container: 'grp_form_results'
                            });
                            dispRecIdField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                            dispRecIdField.defaultValue = recIdInput;
                        }

                        // Determination Source
                        const formSourceField = form.addField({
                            id: 'custpage_disp_form_source',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Form Determination Method',
                            container: 'grp_form_results'
                        });
                        formSourceField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
                        formSourceField.defaultValue = formDetails.source || 'N/A';

                        // Direct Record Links
                        if (recIdInput) {
                            const linksField = form.addField({
                                id: 'custpage_disp_links',
                                type: serverWidget.FieldType.INLINEHTML,
                                label: 'Quick Links',
                                container: 'grp_form_results'
                            });

                            const viewUrl = buildRecordUrl(formDetails.resolvedType || recTypeInput, recIdInput, false, formDetails.formId);
                            const editUrl = buildRecordUrl(formDetails.resolvedType || recTypeInput, recIdInput, true, formDetails.formId);

                            linksField.defaultValue = `
                                <div style="margin-top: 15px; padding: 12px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px;">
                                    <h4 style="margin-top:0; margin-bottom:10px; color:#333;">Record Access Links:</h4>
                                    <p style="margin: 5px 0;">
                                        🔗 <a href="${viewUrl}" target="_blank" style="color: #0066cc; font-weight: bold; text-decoration: underline;">
                                            View Record with Form (ID: ${formDetails.formId || 'Default'})
                                        </a>
                                    </p>
                                    <p style="margin: 5px 0;">
                                        ✏️ <a href="${editUrl}" target="_blank" style="color: #0066cc; font-weight: bold; text-decoration: underline;">
                                            Edit Record with Form (ID: ${formDetails.formId || 'Default'})
                                        </a>
                                    </p>
                                </div>
                            `;
                        }
                    }
                } catch (err) {
                    log.error({ title: 'Error processing form lookup', details: err });
                    const errorField = form.addField({
                        id: 'custpage_err_catched',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: 'Error',
                        container: 'grp_form_results'
                    });
                    errorField.defaultValue = `<div style="color: #d9534f; font-weight: bold; padding: 10px; background-color: #fdf7f7; border: 1px solid #d9534f; border-radius: 4px;">
                        ⚠️ Unexpected Error: ${escapeHtml(err.message || err.toString())}
                    </div>`;
                }
            }

            response.writePage(form);

        } catch (globalErr) {
            log.error({ title: 'Global Suitelet Error', details: globalErr });
            response.write(`<h3>Error processing request:</h3><p>${escapeHtml(globalErr.message)}</p>`);
        }
    };

    /**
     * Determines preferred form details, script ID, and internal ID for custom record instance or record type
     * @param {string} recType - Custom Record Type Script ID or Internal ID
     * @param {string|number} [recId] - Custom Record Instance Internal ID
     * @returns {Object} { formId, formScriptId, formName, resolvedType, source, error }
     */
    const getPreferredFormDetails = (recType, recId) => {
        const result = {
            formId: null,
            formScriptId: null,
            formName: null,
            resolvedType: recType,
            source: '',
            error: null
        };

        const cleanType = recType.toLowerCase().replace(/^customrecord_/, '');
        const fullType = 'customrecord_' + cleanType;
        result.resolvedType = fullType;

        let crtNumericId = null;

        // Step 1: Look up Numeric Custom Record Type ID from customrecordtype metadata table
        try {
            const crtQuery = query.runSuiteQL({
                query: `
                    SELECT id, scriptid, name 
                    FROM customrecordtype 
                    WHERE LOWER(scriptid) = LOWER(?) 
                       OR LOWER(scriptid) = LOWER(?) 
                       OR id = ?
                `,
                params: [fullType, cleanType, isNaN(recType) ? 0 : parseInt(recType, 10)]
            }).asMappedResults();

            if (crtQuery && crtQuery.length > 0) {
                crtNumericId = crtQuery[0].id;
                if (crtQuery[0].scriptid) {
                    result.resolvedType = crtQuery[0].scriptid.toLowerCase().startsWith('customrecord')
                        ? crtQuery[0].scriptid.toLowerCase()
                        : 'customrecord_' + crtQuery[0].scriptid.toLowerCase();
                }
            }
        } catch (e) {
            log.debug({ title: 'customrecordtype SuiteQL failed', details: e.message });
        }

        // Step 2: Check explicit customform field on record instance if recId provided
        if (recId) {
            // 2a. Try SuiteQL on actual custom record table
            try {
                const recTableQuery = query.runSuiteQL({
                    query: `SELECT customform FROM ${result.resolvedType} WHERE id = ?`,
                    params: [parseInt(recId, 10)]
                }).asMappedResults();

                if (recTableQuery && recTableQuery.length > 0 && recTableQuery[0].customform) {
                    result.formId = recTableQuery[0].customform;
                    result.source = 'Explicitly Assigned customform Field on Record Instance (SuiteQL)';
                    enrichFormScriptId(result);
                    return result;
                }
            } catch (tblErr) {
                log.debug({ title: 'Record table SuiteQL customform lookup failed', details: tblErr.message });
            }

            // 2b. Try search.lookupFields
            try {
                const fieldLookup = search.lookupFields({
                    type: result.resolvedType,
                    id: recId,
                    columns: ['customform']
                });

                if (fieldLookup && fieldLookup.customform && fieldLookup.customform.length > 0) {
                    result.formId = fieldLookup.customform[0].value;
                    result.formName = fieldLookup.customform[0].text;
                    result.source = 'Explicitly Assigned customform Field on Record Instance (search.lookupFields)';
                    enrichFormScriptId(result);
                    return result;
                }
            } catch (lookupErr) {
                log.warn({ title: 'search.lookupFields customform failed', details: lookupErr.message });
            }

            // 2c. Try record.load
            try {
                const recObj = record.load({
                    type: result.resolvedType,
                    id: recId,
                    isDynamic: false
                });
                const customFormId = recObj.getValue({ fieldId: 'customform' });
                const customFormText = recObj.getText({ fieldId: 'customform' });
                if (customFormId) {
                    result.formId = customFormId;
                    result.formName = customFormText || `Form #${customFormId}`;
                    result.source = 'Loaded customform Field from Record Instance';
                    enrichFormScriptId(result);
                    return result;
                }
            } catch (loadErr) {
                log.debug({ title: 'record.load customform lookup failed', details: loadErr.message });
            }
        }

        // Step 3: Query Preferred Entry Form via SuiteQL (entryform table by customrecordtype ID or scriptid)
        try {
            let sql = `
                SELECT ef.id, ef.name, ef.scriptid, ef.ispreferred
                FROM entryform ef
            `;
            const paramsArr = [];

            if (crtNumericId) {
                sql += ` WHERE ef.customrecordtype = ? `;
                paramsArr.push(crtNumericId);
            } else {
                sql += ` 
                    INNER JOIN customrecordtype crt ON crt.id = ef.customrecordtype
                    WHERE (LOWER(crt.scriptid) = LOWER(?) OR LOWER(crt.scriptid) = LOWER(?))
                `;
                paramsArr.push(fullType, cleanType);
            }

            sql += ` ORDER BY CASE WHEN ef.ispreferred = 'T' THEN 1 ELSE 2 END, ef.id ASC `;

            const queryRes = query.runSuiteQL({
                query: sql,
                params: paramsArr
            }).asMappedResults();

            if (queryRes && queryRes.length > 0) {
                const preferredForm = queryRes.find(f => f.ispreferred === 'T' || f.ispreferred === true) || queryRes[0];
                result.formId = preferredForm.id;
                result.formScriptId = preferredForm.scriptid;
                result.formName = preferredForm.name;
                result.source = (preferredForm.ispreferred === 'T' || preferredForm.ispreferred === true)
                    ? 'Default Preferred Form for Custom Record Type (SuiteQL)'
                    : 'First Entry Form for Custom Record Type (SuiteQL)';
                return result;
            }
        } catch (sqlErr) {
            log.debug({ title: 'SuiteQL entryform query failed', details: sqlErr.message });
        }

        // Step 4: Try search.create on entryform using crtNumericId
        if (crtNumericId) {
            try {
                const entryFormSearch = search.create({
                    type: 'entryform',
                    filters: [['customrecordtype', 'anyof', crtNumericId]],
                    columns: ['name', 'scriptid', 'ispreferred']
                }).run().getRange({ start: 0, end: 50 });

                if (entryFormSearch && entryFormSearch.length > 0) {
                    let chosenResult = entryFormSearch.find(res => res.getValue({ name: 'ispreferred' }) === true || res.getValue({ name: 'ispreferred' }) === 'T');
                    if (!chosenResult) chosenResult = entryFormSearch[0];

                    result.formId = chosenResult.id;
                    result.formScriptId = chosenResult.getValue({ name: 'scriptid' });
                    result.formName = chosenResult.getValue({ name: 'name' });
                    result.source = 'Preferred Form resolved via entryform Search';
                    return result;
                }
            } catch (searchErr) {
                log.debug({ title: 'entryform search failed', details: searchErr.message });
            }
        }

        // Step 5: Preferred Form resolution via record.create() (In-Memory Default Preferred Form)
        try {
            const dummyRec = record.create({
                type: result.resolvedType,
                isDynamic: false
            });
            const prefFormId = dummyRec.getValue({ fieldId: 'customform' });
            const prefFormText = dummyRec.getText({ fieldId: 'customform' });

            if (prefFormId) {
                result.formId = prefFormId;
                result.formName = prefFormText || `Form #${prefFormId}`;
                result.source = 'Preferred Form resolved via record.create()';
                enrichFormScriptId(result);
                return result;
            }
        } catch (createErr) {
            log.debug({ title: 'record.create preferred form lookup failed', details: createErr.message });
        }

        // Step 6: URL Resolution Fallback for cf parameter
        if (recId) {
            try {
                const resolvedUrl = url.resolveRecord({
                    recordType: result.resolvedType,
                    recordId: recId,
                    isEditMode: false
                });

                const match = resolvedUrl.match(/[?&]cf=([^&]+)/);
                if (match && match[1]) {
                    result.formId = match[1];
                    result.formName = `Form ID ${match[1]}`;
                    result.source = 'Resolved via NetSuite URL cf Parameter';
                    enrichFormScriptId(result);
                    return result;
                }
            } catch (urlErr) {
                log.debug({ title: 'URL resolution fallback error', details: urlErr.message });
            }
        }

        result.source = 'Default System Form (No explicit custom form override found)';
        return result;
    };

    /**
     * Helper to look up the entryform scriptid given numeric formId
     */
    const enrichFormScriptId = (resultObj) => {
        if (!resultObj.formId) return;

        // 1. Try SuiteQL on entryform by internal ID or scriptid
        try {
            const formRes = query.runSuiteQL({
                query: `SELECT id, scriptid, name FROM entryform WHERE id = ? OR LOWER(scriptid) = LOWER(?)`,
                params: [parseInt(resultObj.formId, 10) || 0, String(resultObj.formId)]
            }).asMappedResults();

            if (formRes && formRes.length > 0) {
                resultObj.formScriptId = formRes[0].scriptid;
                if (!resultObj.formName || resultObj.formName.startsWith('Form #')) {
                    resultObj.formName = formRes[0].name;
                }
                return;
            }
        } catch (e) {
            log.debug({ title: 'enrichFormScriptId SuiteQL error', details: e.message });
        }

        // 2. Fallback: search.create on entryform
        try {
            const entryFormSearch = search.create({
                type: 'entryform',
                filters: [['internalid', 'is', resultObj.formId]],
                columns: ['name', 'scriptid']
            }).run().getRange({ start: 0, end: 1 });

            if (entryFormSearch && entryFormSearch.length > 0) {
                resultObj.formScriptId = entryFormSearch[0].getValue({ name: 'scriptid' });
                const nameVal = entryFormSearch[0].getValue({ name: 'name' });
                if (nameVal && (!resultObj.formName || resultObj.formName.startsWith('Form #'))) {
                    resultObj.formName = nameVal;
                }
            }
        } catch (searchErr) {
            log.debug({ title: 'search entryform failed', details: searchErr.message });
        }
    };

    /**
     * Builds standard NetSuite URL for custom record with custom form parameter
     */
    const buildRecordUrl = (recType, recId, isEdit, customFormId) => {
        try {
            const params = {};
            if (customFormId) {
                params.cf = customFormId;
            }
            return url.resolveRecord({
                recordType: recType,
                recordId: recId,
                isEditMode: isEdit,
                parameters: params
            });
        } catch (e) {
            const mode = isEdit ? 'e' : 'v';
            let link = `/app/common/custom/custrecordentry.nl?rectype=${encodeURIComponent(recType)}&id=${encodeURIComponent(recId)}&e=${mode}`;
            if (customFormId) {
                link += `&cf=${encodeURIComponent(customFormId)}`;
            }
            return link;
        }
    };

    /**
     * Helper to escape HTML characters
     */
    const escapeHtml = (str) => {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    return { onRequest };
});
