/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/task', 'N/log', 'N/format', 'N/runtime', 'N/url', 'N/query', 'N/email'],
    function (record, search, task, log, format, runtime, url, query, email) {

        /**
         * Input Data Phase: Retrieve data to process
         */
        function getInputData() {
            try {
                // Retrieve the main data array from the script parameter passed by the Suitelet
                var scriptParams = runtime.getCurrentScript().getParameter('custscript_njt_column_array_line');

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
                var hodName = ""; // Variable to store HOD Name for Email

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
                    hodName = empFields.custentity_hris_emphod[0].text; // Get the Name/Text of the HOD
                }

                // Add these IDs and Names to the data object for the Reduce phase
                data.lineManagerId = lineManagerId;
                data.hodId = hodId;
                data.hodName = hodName;

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
         * Reduce Phase: Update Records and Conditional Email to HOD
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
                        var sendEmailToHod = false;

                        // --- SCENARIO 1: CURRENT USER IS LINE MANAGER ---
                        // Action: Approve as LM, Forward to HOD, Send Email to HOD
                        if (isLineManager) {
                            nextUser = data.hodId; // Next Approver is HOD
                            overallStatus = 4;     // Status: Pending/Forwarded
                            
                            // Only trigger email if HOD exists
                            if (data.hodId) {
                                sendEmailToHod = true;
                            }

                            log.debug("Logic", "User is Line Manager. Forwarding to HOD (" + nextUser + "). Email Triggered.");
                        }
                        // --- SCENARIO 2: CURRENT USER IS HOD ---
                        // Action: Final Approval, No Email required
                        else if (isHod) {
                            nextUser = "";         // No further approver
                            overallStatus = 1;     // Status: Approved
                            sendEmailToHod = false;

                            log.debug("Logic", "User is HOD. Status: Approved (1). No Email.");
                        }

                        // 1. UPDATE THE RECORD
                        updateCustomRecordSublist(data, childRecordId, nextUser, overallStatus);

                        // 2. SEND EMAIL TO HOD (If Logic matches)
                        if (sendEmailToHod && data.hodId) {
                            // Look up HOD's email address
                            var hodEmail = getEmployeeEmail(data.hodId);
                            
                            if (hodEmail) {
                                // Pass HOD Name extracted in Map phase
                                sendHodNotificationEmail(hodEmail, data.hodName);
                            } else {
                                log.audit("Email Skipped", "HOD defined but no email address found on record.");
                            }
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

            } catch (e) {
                log.error('Update Failed', 'Child ID: ' + childRecordId + ' | ' + e.message);
            }
        }

        /**
         * Helper: Get Email Address of a specific Employee ID
         */
        function getEmployeeEmail(employeeId) {
            try {
                if (!employeeId) return null;
                
                var fields = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: employeeId,
                    columns: ['email']
                });
                
                return fields.email;
            } catch (e) {
                log.error("Lookup Email Error", e.message);
                return null;
            }
        }

        /**
         * Helper: Send Email specifically to HOD with specific format
         */
        function sendHodNotificationEmail(recipientEmail, recipientName) {
            try {
                var currentUser = runtime.getCurrentUser();

                // Construct Suitelet Link for the Approver
                var suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_hris_hod_reg_approval_proce',
                    deploymentId: 'customdeploy_hris_hod_reg_approval_proce',
                    returnExternalUrl: false
                });

                // Generate basic link (without specific params as per new format request)
                // Or keep params if the suitelet requires them to load the list. 
                // Usually for a generic "View" link, we just send them to the tool.
                var fullLink = 'https://' + url.resolveDomain({ hostType: url.HostType.APPLICATION }) + suiteletUrl;

                var subject = 'Attendance Regularization Approved';
                
                // Specific Content Requested
                var body = 'Dear ' + (recipientName || 'HOD') + ',<br><br>' +
                           'Attendance regularization has been approved for employee(s) reporting to you.<br><br>' +
                           'You can view the details by clicking the link below:<br>' +
                           '<a href="' + fullLink + '">View Attendance Regularization</a><br><br>' +
                           'Regards,<br>' +
                           currentUser.name;

                email.send({
                    author: currentUser.id, // Sent by the current user (Line Manager)
                    recipients: recipientEmail, // Sent to the HOD
                    subject: subject,
                    body: body
                });

                log.audit('Email Sent to HOD', 'Recipient: ' + recipientEmail);

            } catch (e) {
                log.error('Email Error', e.toString());
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
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });