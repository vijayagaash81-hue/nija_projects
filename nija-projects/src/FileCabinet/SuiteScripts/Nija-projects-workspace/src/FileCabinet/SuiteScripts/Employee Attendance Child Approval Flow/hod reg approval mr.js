/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/task', 'N/log', 'N/format', 'N/runtime', 'N/query', 'N/email'],
    function (record, search, task, log, format, runtime, query, email) {

        /**
         * Input Data Phase: Retrieve data to process
         */
        function getInputData() {
            try {
                // Retrieve the main data array from the script parameter passed by the Suitelet
                var scriptParams = runtime.getCurrentScript().getParameter('custscript_hris_hod_approval_mr');

                // Log the raw parameters for debugging purposes
                log.debug('Script Params', scriptParams);

                // Parse the string into a JSON Array to work with it as objects
                var dataArray = [];
                if (scriptParams) {
                    dataArray = JSON.parse(scriptParams);
                }

                // Update the custom Status Bar Record to "Processing" (ID 2)
                record.submitFields({
                    type: "customrecord_hris_mr_status_bar_rec",
                    id: 5,
                    values: {
                        custrecord_hris_mr_sts: 2
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });

                // Return the data array to be processed by the Map phase
                return dataArray;

            } catch (e) {
                // Log any errors encountered during the Input Data phase
                log.error({ title: 'Error in Input Data', details: e.message });

                // Reset the Status Bar to "Idle" (ID 1) if error occurs
                try {
                    record.submitFields({
                        type: "customrecord_hris_mr_status_bar_rec",
                        id: 5,
                        values: { custrecord_hris_mr_sts: 1 }
                    });
                } catch (innerEx) {
                    log.error('Error resetting status bar', innerEx.message);
                }
            }
        }

        /**
         * Map Phase: Group Data and Identify Roles
         */
        function map(context) {
            try {
                // Parse the individual value passed from Input Data
                var data = JSON.parse(context.value);

                // Validation: Ensure essential data (Child ID and Employee ID) exists
                if (!data || !data.idchi || !data.employeeID) {
                    return; // Skip invalid records
                }

                // --- ROLE IDENTIFICATION LOGIC ---
                var lineManagerId = null;
                var hodId = null;

                // Perform a lookup on the Employee Record to find their Line Manager and HOD
                var empFields = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: data.employeeID,
                    columns: ['custentity_hris_emplinemanger', 'custentity_hris_emphod']
                });

                if (empFields.custentity_hris_emplinemanger && empFields.custentity_hris_emplinemanger.length > 0) {
                    lineManagerId = empFields.custentity_hris_emplinemanger[0].value;
                }
                if (empFields.custentity_hris_emphod && empFields.custentity_hris_emphod.length > 0) {
                    hodId = empFields.custentity_hris_emphod[0].value;
                }

                // Add these IDs to the data object for the Reduce phase
                data.lineManagerId = lineManagerId;
                data.hodId = hodId;

                // Group Key: Use the Child Record ID (Unique) to process one by one
                var groupKey = data.idchi;

                context.write({
                    key: groupKey,
                    value: JSON.stringify(data)
                });

            } catch (e) {
                log.error('Map Error', e.toString());
            }
        }

        /**
         * Reduce Phase: Update Records and Output Fully Approved Items
         */
        function reduce(context) {
            try {
                var currentUser = runtime.getCurrentUser();
                var currentUserId = currentUser.id;

                // Iterate through values
                context.values.forEach(function (value) {
                    try {
                        if (!value) return;
                        var data = JSON.parse(value);
                        var childRecordId = data.idchi;

                        // --- LOGIC VARIABLES ---
                        var isLineManager = (currentUserId == data.lineManagerId);
                        var isHod = (currentUserId == data.hodId);

                        // Admin Override (Optional: Treat Admin as Line Manager for testing)
                        if (currentUserId == -4 && data.lineManagerId) {
                            isLineManager = true;
                        }

                        var nextUser = "";
                        var overallStatus = data.osts; // Default from Suitelet

                        // --- SCENARIO 1: CURRENT USER IS LINE MANAGER ---
                        // Action: Approve as LM, Forward to HOD.
                        if (isLineManager) {
                            nextUser = data.hodId; // Next Approver is HOD
                            overallStatus = 4;     // Status: Pending/Forwarded to HOD
                            
                            log.debug("Logic", "User is Line Manager. Forwarding to HOD (" + nextUser + ").");
                        }
                        // --- SCENARIO 2: CURRENT USER IS HOD ---
                        // Action: Final Approval.
                        else if (isHod) {
                            nextUser = "";         // No further approver
                            overallStatus = 1;     // Status: Approved
                            
                            log.debug("Logic", "User is HOD. Status: Approved (1).");
                        }

                        // UPDATE THE RECORD
                        var updateSuccess = updateCustomRecordSublist(data, childRecordId, nextUser, overallStatus);

                        // If fully approved (Status 1), output to Summarize stage for consolidated email
                        if (updateSuccess && parseInt(overallStatus, 10) === 1) {
                            context.write({
                                key: childRecordId,
                                value: JSON.stringify(data)
                            });
                        }

                    } catch (e) {
                        log.error('Error in reduce loop', e.toString());
                    }
                });

            } catch (e) {
                log.error('Reduce Error', e.toString());
            }
        }

        /**
         * Helper: Update Custom Record
         */
        function updateCustomRecordSublist(data, childRecordId, nextUser, overallStatus) {
            try {
                var childRecordIdInt = parseInt(childRecordId, 10);
                var statusOs = parseInt(overallStatus, 10);

                var childRecord = record.load({
                    type: 'CUSTOMRECORD_NJT_EMP_DAILY_ATTEN_CH',
                    id: childRecordIdInt,
                    isDynamic: true
                });

                // Set Standard Fields
                childRecord.setValue({ fieldId: 'custrecord_njt_emp_daily_reg_in', value: data.nin || "" });
                childRecord.setValue({ fieldId: 'custrecord_njt_emp_daily_reg_out', value: data.ouut || "" });
                childRecord.setValue({ fieldId: 'custrecord_hris_reg_overtime_in', value: data.oin || "" });
                childRecord.setValue({ fieldId: 'custrecord_hris_regula_overtime_out', value: data.oout || "" });
                childRecord.setValue({ fieldId: 'custrecord_njt_ot_hours', value: data.othrours || "" });
                childRecord.setValue({ fieldId: 'custrecord_njt_emp_daily_working_hours', value: data.totalhr || "" });

                // Set Calculated Status
                childRecord.setValue({ fieldId: 'custrecord_hris_overall_status', value: statusOs });

                // Set Next User (HOD or Empty)
                childRecord.setValue({ fieldId: 'custrecord_hris_dailyatten_nextuser', value: nextUser || "" });

                childRecord.save();
                log.debug('Record Updated', 'ID: ' + childRecordIdInt + ', Status: ' + statusOs + ', Next User: ' + nextUser);
                return true;

            } catch (e) {
                log.error('Update Failed', 'Child ID: ' + childRecordId + ' | ' + e.message);
                return false;
            }
        }

        /**
         * Summarize Phase
         */
        function summarize(summary) {
            // Log errors if any occurred during map or reduce
            summary.mapSummary.errors.iterator().each(function (key, error) {
                log.error('Map Error Key: ' + key, error);
                return true;
            });
            summary.reduceSummary.errors.iterator().each(function (key, error) {
                log.error('Reduce Error Key: ' + key, error);
                return true;
            });

            // Reset Status Bar to Idle (1) when script finishes
            try {
                record.submitFields({
                    type: "customrecord_hris_mr_status_bar_rec",
                    id: 5,
                    values: { custrecord_hris_mr_sts: 1 },
                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                });
                log.audit("Process Complete", "Status bar reset to Idle.");
            } catch (e) {
                log.error('Summarize Status Update Failed', e.message);
            }

            // --- ENHANCEMENT: Send Consolidated Email to HR Admin (Non-Nijatech employees) ---
            try {
                var approvedRecords = [];
                summary.output.iterator().each(function (key, value) {
                    try {
                        if (value) {
                            var recData = JSON.parse(value);
                            approvedRecords.push(recData);
                        }
                    } catch (err) {
                        log.error('Error parsing approved record in summarize', err.message);
                    }
                    return true;
                });

                log.audit('Approved Records Count for HR Admin Notification', approvedRecords.length);

                if (approvedRecords.length > 0) {
                    sendHrAdminConsolidatedEmail(approvedRecords);
                }
            } catch (e) {
                log.error('Error in Summarize Email Dispatch', e.toString());
            }
        }

        /**
         * Helper: Get employees with HR Admin role
         */
        function getHrAdminEmployees() {
            var hrEmployees = [];
            var empIdMap = {};

            // 1. Try SuiteQL first
            try {
                var sql = "SELECT DISTINCT e.id, e.email, e.firstname, e.lastname, e.middlename, BUILTIN.DF(e.id) as entityname " +
                          "FROM employee e " +
                          "LEFT JOIN employeeRole er ON e.id = er.entity " +
                          "WHERE (er.role = 1019 OR e.role = 1019 OR LOWER(BUILTIN.DF(er.role)) LIKE '%hr admin%' OR LOWER(BUILTIN.DF(e.role)) LIKE '%hr admin%') " +
                          "AND e.isinactive = 'F'";
                var sqlResults = query.runSuiteQL({ query: sql }).asMappedResults();
                log.debug("SuiteQL HR Admin Employees Found", sqlResults.length);

                for (var i = 0; i < sqlResults.length; i++) {
                    var row = sqlResults[i];
                    if (row.id && !empIdMap[row.id]) {
                        empIdMap[row.id] = true;
                        hrEmployees.push({
                            id: row.id,
                            email: row.email || "",
                            firstname: row.firstname || "",
                            lastname: row.lastname || "",
                            middlename: row.middlename || "",
                            entityname: row.entityname || ""
                        });
                    }
                }
            } catch (e) {
                log.error("SuiteQL HR Admin Search Failed", e.message);
            }

            // 2. Fallback using N/search if SuiteQL returned no results
            if (hrEmployees.length === 0) {
                try {
                    var empSearch = search.create({
                        type: search.Type.EMPLOYEE,
                        filters: [
                            ['isinactive', 'is', 'F'],
                            'AND',
                            [
                                ['role', 'anyof', ['1019']],
                                'OR',
                                ['role.name', 'contains', 'HR Admin']
                            ]
                        ],
                        columns: ['email', 'firstname', 'lastname', 'middlename', 'entityid']
                    });

                    empSearch.run().each(function (result) {
                        var empId = result.id;
                        if (!empIdMap[empId]) {
                            empIdMap[empId] = true;
                            hrEmployees.push({
                                id: empId,
                                email: result.getValue('email') || "",
                                firstname: result.getValue('firstname') || "",
                                lastname: result.getValue('lastname') || "",
                                middlename: result.getValue('middlename') || "",
                                entityname: result.getValue('entityid') || ""
                            });
                        }
                        return true;
                    });
                    log.debug("N/search HR Admin Employees Found", hrEmployees.length);
                } catch (err) {
                    log.error("N/search HR Admin Search Failed", err.message);
                }
            }

            return hrEmployees;
        }

        /**
         * Helper: Check if an employee belongs to Nijatech based on email or name fields
         */
        function isNijatechEmployee(emp) {
            var email = (emp.email || '').toLowerCase().trim();
            var firstName = (emp.firstname || '').toLowerCase().trim();
            var lastName = (emp.lastname || '').toLowerCase().trim();
            var middleName = (emp.middlename || '').toLowerCase().trim();
            var entityName = (emp.entityname || '').toLowerCase().trim();

            // 1. Check email field for 'nijatech' (e.g. vijay@nijatech.com)
            if (email.indexOf('nijatech') !== -1) {
                return true;
            }

            // 2. Check firstname, lastname, middlename, entityname for 'njt', 'nijatech', or 'nija'
            var patterns = ['njt', 'nijatech', 'nija'];
            for (var i = 0; i < patterns.length; i++) {
                var p = patterns[i];
                if (firstName.indexOf(p) !== -1 || 
                    lastName.indexOf(p) !== -1 || 
                    middleName.indexOf(p) !== -1 ||
                    entityName.indexOf(p) !== -1) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Helper: Send consolidated email to HR Admin employees (excluding Nijatech employees)
         */
        function sendHrAdminConsolidatedEmail(approvedRecords) {
            try {
                var allHrEmployees = getHrAdminEmployees();
                log.debug("Total HR Admin Employees Found", allHrEmployees.length);

                var recipientEmails = [];
                var recipientIds = [];

                for (var i = 0; i < allHrEmployees.length; i++) {
                    var emp = allHrEmployees[i];
                    
                    // Filter out Nijatech employees
                    if (isNijatechEmployee(emp)) {
                        log.debug("Filtered Out Nijatech Employee", emp);
                        continue;
                    }

                    if (emp.email && emp.email.trim() !== '') {
                        recipientEmails.push(emp.email.trim());
                        recipientIds.push(emp.id);
                    }
                }

                log.audit("Filtered HR Admin Recipient Emails", recipientEmails);

                if (recipientEmails.length === 0 && recipientIds.length === 0) {
                    log.audit("Email Skipped", "No non-Nijatech HR Admin recipients found with valid email addresses.");
                    return;
                }

                // Determine Author ID (Must be a positive employee internal ID)
                var currentUser = runtime.getCurrentUser();
                var authorId = currentUser.id;
                
                if (!authorId || parseInt(authorId, 10) <= 0) {
                    if (recipientIds.length > 0) {
                        authorId = recipientIds[0];
                    } else if (allHrEmployees.length > 0 && allHrEmployees[0].id) {
                        authorId = allHrEmployees[0].id;
                    }
                }

                if (!authorId || parseInt(authorId, 10) <= 0) {
                    log.error("Email Error", "No valid author ID found for sending email.");
                    return;
                }

                // Construct Consolidated HTML Email Table
                var subject = "Consolidated Attendance Regularization Approved Notification";
                
                var tableRowsHtml = "";
                for (var j = 0; j < approvedRecords.length; j++) {
                    var rec = approvedRecords[j];
                    tableRowsHtml += "<tr style='text-align: center;'>" +
                        "<td>" + (j + 1) + "</td>" +
                        "<td style='text-align: left;'>" + (rec.employeeName || "-") + "</td>" +
                        "<td>" + (rec.date || "-") + "</td>" +
                        "<td>" + (rec.nin || "-") + "</td>" +
                        "<td>" + (rec.ouut || "-") + "</td>" +
                        "<td>" + (rec.totalhr || "-") + "</td>" +
                        "<td>" + (rec.othrours || "-") + "</td>" +
                        "</tr>";
                }

                var bodyHtml = "<div style='font-family: Arial, sans-serif; font-size: 14px; color: #333;'>" +
                    "<p>Dear HR Admin Team,</p>" +
                    "<p>The following employee attendance regularization request(s) have been <b>Fully Approved</b>:</p>" +
                    "<table border='1' cellpadding='8' cellspacing='0' style='border-collapse: collapse; font-family: Arial, sans-serif; font-size: 13px; width: 100%; border: 1px solid #ddd;'>" +
                    "<thead>" +
                    "<tr style='background-color: #0056b3; color: white; text-align: center;'>" +
                    "<th>#</th>" +
                    "<th>Employee Name</th>" +
                    "<th>Date</th>" +
                    "<th>Reg IN</th>" +
                    "<th>Reg OUT</th>" +
                    "<th>Total Hours</th>" +
                    "<th>OT Hours</th>" +
                    "</tr>" +
                    "</thead>" +
                    "<tbody>" +
                    tableRowsHtml +
                    "</tbody>" +
                    "</table>" +
                    "<br>" +
                    "<p>This is a consolidated automated notification from the HRMS Attendance System.</p>" +
                    "<p>Regards,<br>HRMS System</p>" +
                    "</div>";

                try {
                    email.send({
                        author: parseInt(authorId, 10),
                        recipients: recipientEmails,
                        subject: subject,
                        body: bodyHtml
                    });
                    log.audit("Consolidated Email Sent Successfully", {
                        recipients: recipientEmails,
                        approvedCount: approvedRecords.length
                    });
                } catch (sendErr) {
                    log.error("Batch Email Send Failed, attempting individual send", sendErr.message);
                    for (var k = 0; k < recipientEmails.length; k++) {
                        try {
                            email.send({
                                author: parseInt(authorId, 10),
                                recipients: recipientEmails[k],
                                subject: subject,
                                body: bodyHtml
                            });
                            log.audit("Individual Email Sent", recipientEmails[k]);
                        } catch (indErr) {
                            log.error("Failed to send email to " + recipientEmails[k], indErr.message);
                        }
                    }
                }

            } catch (e) {
                log.error("Error Sending HR Admin Consolidated Email", e.toString());
            }
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });