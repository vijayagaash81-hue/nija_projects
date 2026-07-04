/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(['N/query', 'N/log', 'N/https', 'N/record', 'N/file', 'N/runtime'], function (query, log, https, record, file, runtime) {

    /**
     * Entry point for the Scheduled Script
     */
    function execute(context) {
        try {
            var scriptObj = runtime.getCurrentScript();
            var announcementId = scriptObj.getParameter({ name: 'custscript_announcement_id' }) || "";

            var apiUrl = "https://mobapp.nijatech.com:6000/api/mobileapp/addannouncement";
            var apiMethod = "POST";

            var announcementQuery =
                "SELECT " +
                "A.id AS internalid, " +
                "A.custrecord_hris_comp_annou_title AS title, " +
                "A.custrecord_hris_comp_annou_message AS message, " +
                "TO_CHAR(A.custrecord_hris_comp_annou_start_date, 'YYYY-MM-DD') AS start_date, " +
                "TO_CHAR(A.custrecord_hris_comp_annou_end_date, 'YYYY-MM-DD') AS end_date, " +
                "BUILTIN.DF(A.custrecord_hris_comp_annou_priority) AS priority, " +
                "A.custrecord_hris_comp_annou_attachment AS attachment, " +
                "A.custrecord_hris_comp_annou_is_active AS is_active, " +
                "A.custrecord_hris_comp_annou_audience AS audience_, " + 
                "BUILTIN.DF(A.custrecord_hris_comp_annou_audience) AS audience_names_ " + 
                "FROM customrecord_njt_company_announcements A WHERE A.id=" + announcementId + "";

            log.debug("announcementQuery", announcementQuery);

            var resultSet = query.runSuiteQL({ query: announcementQuery });
            var rows = resultSet.asMappedResults();

            if (!rows.length) {
                log.error("No Data", "Query returned no results for ID: " + announcementId);
                return;
            }

            // 5. Build the JSON structure - Changed nulls to "" to prevent API validation errors
            var finalData = {
                internalid: rows[0].internalid ? rows[0].internalid.toString() : "",
                title: rows[0].title || "", 
                employees: [],
                data: []
            };

            var employeeIds = rows[0].audience_ ? rows[0].audience_.split(",") : [];
            var employeeNames = rows[0].audience_names_ ? rows[0].audience_names_.split(",") : [];

            for (var i = 0; i < employeeIds.length; i++) {
                finalData.employees.push({
                    employeeId: employeeIds[i].trim() || "",
                    emp_name: employeeNames[i] ? employeeNames[i].trim() : ""
                });
            }

            var attachmentId = rows[0].attachment || null;
            var attachmentUrl = "";

            if (attachmentId) {
                try {
                    var fileObj = file.load({ id: attachmentId });
                    if (!fileObj.isOnline) {
                        fileObj.isOnline = true;
                        fileObj.save();
                    }
                    attachmentUrl = "https://11906425.app.netsuite.com" + fileObj.url;
                } catch (e) {
                    log.error("Error loading attachment", e.message);
                }
            }

            finalData.data.push({
                message: rows[0].message || "",
                start_date: rows[0].start_date || "",
                end_date: rows[0].end_date || "",
                priority: rows[0].priority || "",
                attachmentID: attachmentId || 0,
                attachmentURL: attachmentUrl,
                is_active: rows[0].is_active || false
            });

            var jsonData = JSON.stringify(finalData);
            sendToMobileAPI(apiUrl, jsonData, apiMethod, rows[0].internalid);

        } catch (err) {
            log.error("Execution Error", err.message);
        }
    }

    function sendToMobileAPI(apiUrl, jsonData, apiMethod, internalId) {
        var isSuccess = false;
        var response = null;
        var responseBody = {};
        var token = "";

        try {
            // STEP A: Get Token
            var authResponse = https.post({
                url: "https://mobapp.nijatech.com:6000/api/netsuite/gettoken",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ "email": "winstar@gmail.com", "password": "winstar@123" })
            });

            if (authResponse.code === 200) {
                token = JSON.parse(authResponse.body).jwtoken;
            } else {
                throw new Error("Auth Failed");
            }

            // STEP B: Post Data
            response = https.post({
                url: apiUrl,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: jsonData
            });

            log.debug("API Response", "Code: " + response.code + " Body: " + response.body);
            
            if (response.body) {
                responseBody = JSON.parse(response.body);
                // SUCCESS LOGIC: Check code 200 AND (status is true OR message says successfully)
                if (response.code === 200 && (responseBody.status === true || responseBody.message.indexOf("successfully") !== -1)) {
                    isSuccess = true;
                }
            }

        } catch (apiErr) {
            log.error("API Communication Failed", apiErr.message);
        }

        // STEP C: Update Record
        try {
            var announcementRec = record.load({
                type: "customrecord_njt_company_announcements",
                id: internalId
            });

            announcementRec.setValue({ fieldId: "custrecord_hris_comp_annou_process_statu", value: isSuccess ? 2 : 3 });
            announcementRec.setValue({ fieldId: "custrecord_hris_comp_annou_response_stat", value: isSuccess ? "Success" : "Failure" });
            announcementRec.setValue({ fieldId: "custrecord_hris_comp_annou_response_mess", value: responseBody.message || "No message" });
            announcementRec.setValue({ fieldId: "custrecord_hris_comp_annou_response_code", value: response ? response.code : 0 });
            announcementRec.setValue({ fieldId: "custrecord_hris_comp_annou_api_method", value: apiMethod });
            announcementRec.setValue({ fieldId: "custrecord_hris_comp_annou_api_url", value: apiUrl });
            announcementRec.setValue({ fieldId: "custrecord_hris_comp_annou_json_data", value: jsonData });

            announcementRec.save({ ignoreMandatoryFields: true });
        } catch (recErr) {
            log.error("Record Update Failed", recErr.message);
        }
    }

    return { execute: execute };
});