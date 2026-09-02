/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/task', 'N/log', 'N/format', 'N/runtime', 'N/url', 'N/query', 'N/email'],
    function (record, search, task, log, format, runtime, url, query, email) {

        // ---------------------------------------------------------------------
        // Input Data Phase: Retrieve data to process
        // ---------------------------------------------------------------------
        function getInputData() {
            try {
                var scriptParams = runtime.getCurrentScript().getParameter('custscript_njt_column_array_selectreg');
                log.debug('Script Params', scriptParams); // Log the raw script parameter

                var dataArray = [];
                if (scriptParams) {
                    dataArray = JSON.parse(scriptParams);
                }
                log.debug('Input Data', dataArray);

                // Set Status Bar to "Processing" (2)
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
                return dataArray;
            } catch (e) {
                log.error({
                    title: 'Error in MRS Input Data',
                    details: e.message
                });
                // If error, reset Status Bar to "Idle" (1)
                record.submitFields({
                    type: "customrecord_hris_mr_status_bar_rec",
                    id: 5,
                    values: {
                        custrecord_hris_mr_sts: 1
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
            }
        }

        // ---------------------------------------------------------------------
        // Map Phase: Group Data and Determine Target Manager & URL
        // ---------------------------------------------------------------------
        function map(context) {
            try {
                var data = JSON.parse(context.value);
                log.debug('Map Data', data);

                // Check if the data is valid
                if (!data || !data.idchi || !data.employeeID) {
                    log.error('Invalid data encountered', data);
                    return; // Skip this data
                }

                // --- NEW LOGIC: Manager Lookup & Routing ---
                var targetManagerId = null;
                var targetManagerName = "Manager";
                var targetScriptId = "";
                var targetDeployId = "";

                // Lookup Line Manager and HOD
                var empFields = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: data.employeeID,
                    columns: ['custentity_hris_emplinemanger', 'custentity_hris_emphod']
                });

                var lineManagerVal = empFields.custentity_hris_emplinemanger;
                var hodVal = empFields.custentity_hris_emphod;

                // Priority 1: Line Manager
                if (lineManagerVal && lineManagerVal.length > 0) {
                    targetManagerId = lineManagerVal[0].value;
                    targetManagerName = lineManagerVal[0].text;
                    targetScriptId = 'customscript_hris_employee_linemanger_re';
                    targetDeployId = 'customdeploy_hris_employee_linemanger_re';
                }
                // Priority 2: HOD (if no Line Manager)
                else if (hodVal && hodVal.length > 0) {
                    targetManagerId = hodVal[0].value;
                    targetManagerName = hodVal[0].text;
                    targetScriptId = 'customscript_hris_hod_reg_approval_proce';
                    targetDeployId = 'customdeploy_hris_hod_reg_approval_proce';
                }

                // Add calculated manager details to the data object
                data.managerId = targetManagerId;
                data.managerName = targetManagerName;
                data.scriptIdToLink = targetScriptId;
                data.deployIdToLink = targetDeployId;

                // Group Key: Use Manager ID (so we send one email per manager). 
                // If no manager, fallback to employee ID to process without email.
                var groupKey = targetManagerId ? targetManagerId : ("NoMgr_" + data.employeeID);

                context.write({
                    key: groupKey,
                    value: JSON.stringify(data)
                });

            } catch (e) {
                log.error('Error in map function', e.toString());
            }
        }

        // ---------------------------------------------------------------------
        // Reduce Phase: Update Records and Send Conditional Email
        // ---------------------------------------------------------------------
        function reduce(context) {
            try {
                var managerId = context.key;
                var processedCount = 0;

                // Variables to hold metadata for the email
                var managerName = "Manager";
                var scriptIdToUse = "";
                var deployIdToUse = "";
                var fromDate = "";
                var toDate = "";
                var employeeFilter = "";
                var validManagerFound = false;

                // Array to track processed IDs to prevent duplicates in batch
                var processedRecordIds = [];

                context.values.forEach(function (value) {
                    try {
                        // Check if the value is valid
                        if (!value || value === "undefined" || value === "null") {
                            return;
                        }

                        var data = JSON.parse(value);
                        var childRecordId = data.idchi;

                        // Skip duplicates
                        if (processedRecordIds.indexOf(childRecordId) !== -1) {
                            return;
                        }
                        processedRecordIds.push(childRecordId);

                        // Capture Metadata from the first valid record for the email
                        if (!validManagerFound && data.managerId) {
                            managerName = data.managerName;
                            scriptIdToUse = data.scriptIdToLink;
                            deployIdToUse = data.deployIdToLink;
                            if (managerId === data.managerId) {
                                validManagerFound = true;
                            }
                            if (data.fromPost) fromDate = data.fromPost;
                            if (data.toPost) toDate = data.toPost;
                            if (data.employeePost) employeeFilter = data.employeePost;
                        }

                        // Update custom record sublist
                        try {
                            updateCustomRecordSublist(data, childRecordId);
                            processedCount++;
                        } catch (e) {
                            log.error('Error updating custom record sublist for employee ' + data.employeeID, e.toString());
                        }

                    } catch (e) {
                        log.error('Error parsing value in reduce function', e.toString());
                    }
                });

                // --- SEND EMAIL NOTIFICATION ---
                if (validManagerFound && processedCount > 0 && scriptIdToUse && deployIdToUse) {
                    sendSummaryEmail(managerId, managerName, processedCount, fromDate, toDate, scriptIdToUse, deployIdToUse, employeeFilter);
                }

            } catch (e) {
                log.error('Reduce Error', e.toString());
            }
        }

        // ---------------------------------------------------------------------
        // Helper: Update Custom Record
        // ---------------------------------------------------------------------
        function updateCustomRecordSublist(data, childRecordId) {
            try {
                var childRecordIdInt = parseInt(childRecordId, 10);
                var statusOs = parseInt(data.osts, 10);

                // Load the child record
                var childRecord = record.load({
                    type: 'CUSTOMRECORD_NJT_EMP_DAILY_ATTEN_CH',
                    id: childRecordIdInt,
                    isDynamic: true
                });

                // Set values on the child record
                childRecord.setValue({
                    fieldId: 'custrecord_njt_emp_daily_reg_in',
                    value: data.nin
                });

                childRecord.setValue({
                    fieldId: 'custrecord_njt_emp_daily_reg_out',
                    value: data.ouut
                });

                childRecord.setValue({
                    fieldId: 'custrecord_hris_reg_overtime_in',
                    value: data.oin
                });

                childRecord.setValue({
                    fieldId: 'custrecord_hris_regula_overtime_out',
                    value: data.oout
                });

                childRecord.setValue({
                    fieldId: 'custrecord_njt_ot_hours',
                    value: data.othrours
                });

                childRecord.setValue({
                    fieldId: 'custrecord_njt_emp_daily_working_hours',
                    value: data.totalhr
                });

                childRecord.setValue({
                    fieldId: 'custrecord_hris_overall_status',
                    value: statusOs
                });

                // --- NEW: Set Next User (Manager) ---
                if (data.managerId) {
                    childRecord.setValue({
                        fieldId: 'custrecord_hris_dailyatten_nextuser',
                        value: data.managerId
                    });
                }

                // Save the child record
                var recordId = childRecord.save();
                log.debug('Child Record Updated Successfully for employee ' + data.employeeID, recordId);
            } catch (e) {
                log.error('Error updating child record for employee ' + data.employeeID, e.toString());
            }
        }

        // ---------------------------------------------------------------------
        // Helper: Send Summary Email
        // ---------------------------------------------------------------------
        function sendSummaryEmail(recipientId, recipientName, count, fromDate, toDate, scriptId, deployId, empFilter) {
            try {
                var currentUser = runtime.getCurrentUser();

                // Construct the Suitelet Link dynamically
                var suiteletUrl = url.resolveScript({
                    scriptId: scriptId,
                    deploymentId: deployId,
                    returnExternalUrl: false
                });

                // Append parameters for the target Suitelet
                var fullLink = 'https://' + url.resolveDomain({
                    hostType: url.HostType.APPLICATION
                }) + suiteletUrl +
                    '&custparam_employee=' + (empFilter || "") +
                    '&custparam_fromdate=' + (fromDate || "") +
                    '&custparam_todate=' + (toDate || "");

                var subject = 'Attendance Regularization Approved';

                var body = 'Dear ' + recipientName + ',<br><br>' +
                    'Attendance regularization has been approved for <b>' + count + '</b> employee(s) reporting to you.<br><br>' +
                    'You can view the details by clicking the link below:<br>' +
                    '<a href="' + fullLink + '">View Attendance Regularization</a><br><br>' +
                    'Regards,<br>' +
                    currentUser.name;

                email.send({
                    author: currentUser.id,
                    recipients: recipientId,
                    subject: subject,
                    body: body
                });

                log.audit('Email Sent', 'To: ' + recipientName + ' | Count: ' + count);

            } catch (e) {
                log.error('Email Error', e.toString());
            }
        }

        // ---------------------------------------------------------------------
        // Summarize Phase
        // ---------------------------------------------------------------------
        function summarize(summary) {
            summary.mapSummary.errors.iterator().each(function (key, error, executionNo) {
                log.error('Map Error for Key: ' + key, error);
                return true;
            });

            summary.reduceSummary.errors.iterator().each(function (key, error, executionNo) {
                log.error('Reduce Error for Key: ' + key, error);
                return true;
            });

            // Reset Status Bar to "Idle" (1) after completion
            try {
                record.submitFields({
                    type: "customrecord_hris_mr_status_bar_rec",
                    id: 5,
                    values: {
                        custrecord_hris_mr_sts: 1
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
                log.debug("Process Complete", "Status bar reset to Idle.");
            } catch (e) {
                log.error('Summarize Status Update Failed', e.toString());
            }
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });