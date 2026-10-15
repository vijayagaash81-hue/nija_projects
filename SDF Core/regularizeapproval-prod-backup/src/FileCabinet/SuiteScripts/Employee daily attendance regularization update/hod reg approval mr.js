/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/task', 'N/log', 'N/format', 'N/runtime'],
    function (record, search, task, log, format, runtime) {

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
         * Reduce Phase: Update Records (No Email)
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

                        // UPDATE THE RECORD ONLY
                        updateCustomRecordSublist(data, childRecordId, nextUser, overallStatus);

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