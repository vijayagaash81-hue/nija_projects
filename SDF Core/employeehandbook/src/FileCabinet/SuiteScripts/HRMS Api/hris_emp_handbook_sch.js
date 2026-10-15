/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/query', 'N/log', 'N/https', 'N/record', 'N/file', 'N/runtime'], function (
    query, log, https, record, file, runtime
) {

    /**
     * execute - Entry point for the scheduled script.
     * Reads the handbook internal ID from the script parameter, fetches the record
     * data via SuiteQL, builds the required JSON payload, and POSTs it to the
     * mobile API endpoint.
     *
     * @param {Object} context
     */
    function execute(context) {
        var scriptObj  = runtime.getCurrentScript();
        var handbookId = scriptObj.getParameter({ name: 'custscript_handbook_id' }) || '';

        log.debug({ title: 'hris_emp_handbook_sch | execute', details: 'Handbook ID: ' + handbookId });

        if (!handbookId) {
            log.error({ title: 'hris_emp_handbook_sch | Missing Parameter', details: 'custscript_handbook_id is empty.' });
            return;
        }

        var apiUrl = 'https://mobapp.nijatech.com:5612/api/mobileapp/addhandbook';

        // ── SuiteQL ──────────────────────────────────────────────────────────────
        // Fetch core fields from the Employee Handbook custom record.
        // Multi-select fields (subsidiary, location, employee category) are fetched
        // as comma-separated IDs + display values via BUILTIN.DF().
        var handbookQuery =
            'SELECT ' +
            '  H.id                                                                    AS internalid, ' +
            '  H.name                                                                   AS title, ' +
            '  H.custrecord_emp_handbook_type                                           AS attachment_file_id, ' +
            '  H.custrecord_emp_handbook_company_policies                               AS company_policies, ' +
            '  H.custrecord_emp_handbook_hr_guidelines                                  AS hr_guidelines, ' +
            '  TO_CHAR(H.custrecord_publish_date,       \'DD/MM/YYYY\')                 AS publish_date, ' +
            '  TO_CHAR(H.custrecord_effective_from_ehf, \'DD/MM/YYYY\')                 AS effective_from, ' +
            '  TO_CHAR(H.custrecord_effective_to_ehf,   \'DD/MM/YYYY\')                 AS effective_to, ' +
            '  H.custrecord_emp_handbook_subsidiary                                     AS subsidiary_ids, ' +
            '  BUILTIN.DF(H.custrecord_emp_handbook_subsidiary)                         AS subsidiary_names, ' +
            '  H.custrecord_emp_handbook_location                                       AS location_ids, ' +
            '  BUILTIN.DF(H.custrecord_emp_handbook_location)                           AS location_names, ' +
            '  H.custrecord_emp_handbook_emp_category                                   AS emp_category_ids, ' +
            '  BUILTIN.DF(H.custrecord_emp_handbook_emp_category)                       AS emp_category_names, ' +
            '  H.isinactive                                                             AS is_inactive ' +
            'FROM customrecordhris_employee_handbook H ' +
            'WHERE H.id = ' + handbookId;

        log.debug({ title: 'hris_emp_handbook_sch | SuiteQL', details: handbookQuery });

        var resultSet = query.runSuiteQL({ query: handbookQuery });
        var rows      = resultSet.asMappedResults();

        if (!rows || !rows.length) {
            log.error({ title: 'hris_emp_handbook_sch | No Data', details: 'Query returned no results for ID ' + handbookId });
            return;
        }

        var row = rows[0];
        log.debug({ title: 'hris_emp_handbook_sch | Query Row', details: JSON.stringify(row) });

        // ── Resolve File attachment (custrecord_emp_handbook_type is a File field) ──
        // The field stores the internal ID of a file in the NetSuite File Cabinet.
        // Load the file object to obtain the publicly accessible external URL.
        var attachmentFileId  = row.attachment_file_id || null;
        var attachmentUrl     = '';

        if (attachmentFileId) {
            try {
                var fileObj = file.load({ id: attachmentFileId });

                // Make the file publicly accessible if it is not already online
                if (!fileObj.isOnline) {
                    fileObj.isOnline = true;
                    fileObj.save();
                }

                // Build the full external URL using the account-specific domain
                attachmentUrl = 'https://11951030.app.netsuite.com' + fileObj.url;

                log.debug({
                    title:   'hris_emp_handbook_sch | Attachment Resolved',
                    details: 'File ID: ' + attachmentFileId + ' | URL: ' + attachmentUrl
                });
            } catch (fileErr) {
                log.error({
                    title:   'hris_emp_handbook_sch | Attachment Load Error',
                    details: 'File ID: ' + attachmentFileId + ' | ' + fileErr.message
                });
            }
        }

        // ── Build multi-select arrays ─────────────────────────────────────────
        var subsidiaryArr  = buildPairArray(row.subsidiary_ids,   row.subsidiary_names,   'subsidiaryId', 'subsidiaryName');
        var locationArr    = buildPairArray(row.location_ids,     row.location_names,     'locationCode', 'locationName');
        var empCategoryArr = buildPairArray(row.emp_category_ids, row.emp_category_names, 'departmentId', 'departmentName');

        // ── Build the API payload ─────────────────────────────────────────────
        var payload = {
            internalId:      parseInt(row.internalid, 10) || null,
            title:           row.title            || '',
            companyPolicies: row.company_policies  || '',
            hrGuidelines:    row.hr_guidelines     || '',
            publishDate:     row.publish_date      || '',
            effectiveFrom:   row.effective_from    || '',
            effectiveTo:     row.effective_to      || '',
            attachmentId:    attachmentFileId      ? String(attachmentFileId) : '',
            attachmentUrl:   attachmentUrl,
            subsidiary:      subsidiaryArr,
            locations:       locationArr,
            departments:     empCategoryArr,
            isActive:        (row.is_inactive === 'F' || row.is_inactive === false),
            createdBy:       String(runtime.getCurrentUser().id)
        };

        var jsonData = JSON.stringify(payload);
        log.debug({ title: 'hris_emp_handbook_sch | Payload', details: jsonData });

        // ── Send to API ───────────────────────────────────────────────────────
        sendToMobileAPI(apiUrl, jsonData, row.internalid);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * buildPairArray
     * Converts parallel comma-separated id/name strings returned by SuiteQL into
     * an array of key-value objects expected by the mobile API.
     *
     * @param {string} idsStr   - Comma-separated internal IDs
     * @param {string} namesStr - Comma-separated display names
     * @param {string} idKey    - Key name for the ID in the output object
     * @param {string} nameKey  - Key name for the name in the output object
     * @returns {Array}
     */
    function buildPairArray(idsStr, namesStr, idKey, nameKey) {
        if (!idsStr) { return []; }

        var ids   = idsStr.split(',');
        var names = namesStr ? namesStr.split(',') : [];
        var arr   = [];

        for (var i = 0; i < ids.length; i++) {
            var obj        = {};
            obj[idKey]     = (ids[i]   || '').trim();
            obj[nameKey]   = (names[i] || '').trim();
            arr.push(obj);
        }
        return arr;
    }

    /**
     * getToken
     * Authenticates with the mobile API and returns a JWT bearer token.
     *
     * @returns {string|null}
     */
    function getToken() {
        try {
            var authData = {
                email:    'elevate@gmail.com',
                password: 'elevate@123'
            };

            var authResponse = https.post({
                url:     'https://mobapp.nijatech.com:5612/api/netsuite/gettoken',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(authData)
            });

            log.debug({ title: 'hris_emp_handbook_sch | getToken Response Code', details: authResponse.code });

            if (authResponse.code === 200) {
                var authBody = JSON.parse(authResponse.body);
                return authBody.jwtoken || null;
            }

            log.error({ title: 'hris_emp_handbook_sch | getToken Failed', details: 'HTTP ' + authResponse.code });
            return null;
        } catch (e) {
            log.error({ title: 'hris_emp_handbook_sch | getToken Error', details: e.message });
            return null;
        }
    }

    /**
     * sendToMobileAPI
     * Obtains a token, POSTs the handbook payload to the mobile API endpoint,
     * then updates the handbook record with the response status.
     *
     * @param {string} apiUrl    - Target API URL
     * @param {string} jsonData  - Stringified JSON payload
     * @param {string|number} internalId - Employee Handbook record internal ID
     */
    function sendToMobileAPI(apiUrl, jsonData, internalId) {
        var isSuccess    = false;
        var response     = null;
        var responseBody = {};

        try {
            var token = getToken();
            log.debug({ title: 'hris_emp_handbook_sch | Token Retrieved', details: token ? 'Yes' : 'No' });

            if (!token) {
                log.error({ title: 'hris_emp_handbook_sch | sendToMobileAPI', details: 'Cannot proceed without a valid token.' });
                return;
            }

            response = https.post({
                url:     apiUrl,
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: jsonData
            });

            log.debug({ title: 'hris_emp_handbook_sch | API Response Code', details: response.code });
            log.debug({ title: 'hris_emp_handbook_sch | API Response Body', details: response.body });

            isSuccess = (response.code === 200);

            try {
                responseBody = response.body ? JSON.parse(response.body) : {};
            } catch (parseErr) {
                log.error({ title: 'hris_emp_handbook_sch | Response Parse Error', details: parseErr.message });
            }

        } catch (apiErr) {
            log.error({ title: 'hris_emp_handbook_sch | API Call Failed', details: apiErr.message });
        }

        // ── Update the Employee Handbook record with API response details ─────
        // try {
        //     var handbookRec = record.load({
        //         type:      'customrecordhris_employee_handbook',
        //         id:        internalId,
        //         isDynamic: true
        //     });

        //     handbookRec.setValue({ fieldId: 'custrecord_emp_handbook_process_status',  value: isSuccess ? 2 : 3 });
        //     handbookRec.setValue({ fieldId: 'custrecord_emp_handbook_response_status', value: isSuccess ? 'Success' : 'Failure' });
        //     handbookRec.setValue({ fieldId: 'custrecord_emp_handbook_response_msg',    value: responseBody.message || 'No message received' });
        //     handbookRec.setValue({ fieldId: 'custrecord_emp_handbook_response_code',   value: response ? String(response.code) : '0' });
        //     handbookRec.setValue({ fieldId: 'custrecord_emp_handbook_api_url',         value: apiUrl });
        //     handbookRec.setValue({ fieldId: 'custrecord_emp_handbook_json_payload',    value: jsonData });

        //     handbookRec.save({ enableSourcing: true, ignoreMandatoryFields: true });

        //     log.debug({ title: 'hris_emp_handbook_sch | Record Updated', details: 'Internal ID: ' + internalId });

        // } catch (recErr) {
        //     log.error({
        //         title:   'hris_emp_handbook_sch | Record Update Failed',
        //         details: 'Record ID: ' + internalId + ' | Error: ' + recErr.message
        //     });
        // }
    }

    return { execute: execute };
});
