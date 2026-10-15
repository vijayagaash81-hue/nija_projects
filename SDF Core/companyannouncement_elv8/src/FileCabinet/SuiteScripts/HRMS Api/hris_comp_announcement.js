/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(['N/query', 'N/log', 'N/https', 'N/record', 'N/file', 'N/runtime'], function (query, log, https, record, file, runtime) {
    function execute(context) {
         var scriptObj = runtime.getCurrentScript();
        var announcementId = scriptObj.getParameter({ name: 'custscript_announcementid' }) || "";
        log.debug("announcementId",announcementId);
        var apiUrl = "https://mobapp.nijatech.com:5612/api/mobileapp/addannouncement";
        var apiMethod = "POST";

        // SuiteQL query with correct date format (YYYY-MM-DD)
        var announcementQuery =
            "SELECT " +
            "A.id AS internalid, " +
            "A.custrecord_hris_comp_annou_title AS title, " +
            "A.custrecord_hris_comp_annou_message AS message, " +
            "TO_CHAR(A.custrecord_hris_comp_annou_start_date, 'YYYY-MM-DD') AS start_date, " +
            "TO_CHAR(A.custrecord_hris_comp_annou_end_date, 'YYYY-MM-DD') AS end_date, " +
            "A.custrecord_hris_comp_annou_priority AS priority, " +
            "A.custrecord_hris_comp_annou_attachment AS attachment, " +
            "A.custrecord_hris_comp_annou_is_active AS is_active, " +
            "A.custrecord_hris_comp_annou_audience AS audience_, " +
            "BUILTIN.DF(A.custrecord_hris_comp_annou_audience) AS audience_names_ " +
            "FROM customrecord_njt_company_announcements A WHERE A.id="+announcementId+"";

        log.debug("announcementQuery", announcementQuery);

        var resultSet = query.runSuiteQL({ query: announcementQuery });
        var rows = resultSet.asMappedResults();

        if (!rows.length) {
            log.error("No Data", "Query returned no results");
            return;
        }

        log.debug("Query Results", JSON.stringify(rows));

        // Load the record once to get display text values (getText is reliable for custom list fields)
        var priorityText = "";
        try {
            var annRec = record.load({
                type: "customrecord_njt_company_announcements",
                id: announcementId
            });
            priorityText = annRec.getText({ fieldId: "custrecord_hris_comp_annou_priority" }) || "";
            log.debug("Priority Text", priorityText);
        } catch (recLoadErr) {
            log.error("Error loading record for priority text", recLoadErr.message);
        }

        // Structure the JSON to match the provided format
        var finalData = {
            internalid: rows[0].internalid || null,
            title: rows[0].title || null,
            employees: [],
            data: []
        };

        // Combine audience_ and audience_names_ into employees array
        var employeeIds = rows[0].audience_ ? rows[0].audience_.split(",") : [];
        var employeeNames = rows[0].audience_names_ ? rows[0].audience_names_.split(",") : [];

        for (var i = 0; i < employeeIds.length; i++) {
            finalData.employees.push({
                employeeId: employeeIds[i].trim() || "",
                emp_name: employeeNames[i] ? employeeNames[i].trim() : ""
            });
        }

        // Populate the data array with attachment URL
        rows.forEach(function (ann) {
            var attachmentId = ann.attachment || null;
            var attachmentUrl = "";

            // Generate attachment URL if attachmentId exists
            if (attachmentId) {
                try {
                    var fileObj = file.load({ id: attachmentId });

                    // Set file to online if not already
                    if (!fileObj.isOnline) {
                        fileObj.isOnline = true;
                        fileObj.save();
                    }

                    // Construct URL in the format https://example.com/<filename>
                    // Replace 'example.com' with your actual domain if needed
                    attachmentUrl = "https://11951030.app.netsuite.com" + fileObj.url;
                } catch (e) {
                    log.error("Error loading attachment file for ID " + attachmentId, e.message);
                }
            }

            finalData.data.push({
                message: ann.message || "",
                start_date: ann.start_date || "",
                end_date: ann.end_date || "",
                priority: priorityText,
                attachmentID: attachmentId || 0,
                attachmentURL: attachmentUrl,
                is_active: ann.is_active || false
            });
        });

        if (finalData.data.length > 0) {
            var jsonData = JSON.stringify(finalData);
            log.debug("Final JSON for API", jsonData);
            sendToMobileAPI(apiUrl, jsonData, apiMethod, finalData.internalid);
        } else {
            log.error("No Data", "No valid announcement data to send to API");
        }
    }

    function sendToMobileAPI(apiUrl, jsonData, apiMethod, internalId) {
        var isSuccess = false;
        var response = null;
        var responseBody = {};

        // API call
        try {
                 var token = getToken();
             log.debug("Token",token);

            response = https.post({
                url: apiUrl,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '+ token // Replace with actual token
                },
                body: jsonData
            });

            log.debug("API Response Code", response.code);
            log.debug("API Response Body", response.body);

            isSuccess = (response.code === 200);
            try {
                responseBody = response.body ? JSON.parse(response.body) : {};
            } catch (parseErr) {
                log.error("Response Parse Error", parseErr.message);
            }
        } catch (apiErr) {
            log.error("API Call Failed", apiErr.message);
        }

        // Update the announcement record
        try {
            var announcementRec = record.load({
                type: "customrecord_njt_company_announcements",
                id: internalId,
                isDynamic: true
            });

            announcementRec.setValue({
                fieldId: "custrecord_hris_comp_annou_process_statu",
                value: isSuccess ? 2 : 3
            });
            announcementRec.setValue({
                fieldId: "custrecord_hris_comp_annou_response_stat",
                value: isSuccess ? "Success" : "Failure"
            });
            announcementRec.setValue({
                fieldId: "custrecord_hris_comp_annou_response_mess",
                value: responseBody.message || "No message received"
            });
            announcementRec.setValue({
                fieldId: "custrecord_hris_comp_annou_response_code",
                value: response ? response.code : 0
            });
            announcementRec.setValue({
                fieldId: "custrecord_hris_comp_annou_api_method",
                value: apiMethod
            });
            announcementRec.setValue({
                fieldId: "custrecord_hris_comp_annou_api_url",
                value: apiUrl
            });
            announcementRec.setValue({
                fieldId: "custrecord_hris_comp_annou_json_data",
                value: jsonData
            });

            announcementRec.save({ enableSourcing: true, ignoreMandatoryFields: true });
            log.debug("Announcement record updated successfully", internalId);
        } catch (recErr) {
            log.error("Record Update Failed", "Record ID: " + internalId + ", Error: " + recErr.message);
        }
    }
  function getToken() {
            try {
                var authData = {
                    "email": "elevate@gmail.com",
                    "password": "elevate@123"
                };
                var authResponse = https.post({
                    url: "https://mobapp.nijatech.com:5612/api/netsuite/gettoken",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(authData)
                });
                if (authResponse.code === 200) {
                    var authBody = JSON.parse(authResponse.body);
                    return authBody.jwtoken;
                }
                return null;
            } catch (e) {
                log.error('Error getting token', e.message);
                return null;
            }
        }

    return { execute: execute };
});