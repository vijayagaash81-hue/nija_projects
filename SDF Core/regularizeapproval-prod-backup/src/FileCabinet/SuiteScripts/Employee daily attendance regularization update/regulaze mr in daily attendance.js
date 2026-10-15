/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/task', 'N/log', 'N/format', 'N/runtime', 'N/url', 'N/query'],
    function (record, search, task, log, format, runtime, url, query) {

        // Get input data function
        function getInputData() {
            try {
            var scriptParams = runtime.getCurrentScript().getParameter('custscript_njt_column_array_selectreg');
            log.debug('Script Params', scriptParams); // Log the raw script parameter
            var dataArray = JSON.parse(scriptParams);
            log.debug('Input Data', dataArray);
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
                title: 'Error in MRS',
                details: e.message
            });
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

        // Map function
        function map(context) {
            try {
                var data = JSON.parse(context.value);
                log.debug('Map Data', data);

                // Check if the data is valid
                if (!data || !data.idchi) {
                    log.error('Invalid data encountered', data);
                    return; // Skip this data
                }

                var key = data.idchi; // Using child record ID as the unique key
                context.write({
                    key: key,
                    value: JSON.stringify(data) // Ensure this is a valid JSON string
                });
            } catch (e) {
                log.error('Error in map function', e.toString());
            }
        }

        // Reduce function
        function reduce(context) {
            try {
                context.values.forEach(function (value) {
                    try {
                        log.debug('Value before JSON.parse', value);

                        // Check if the value is undefined or null
                        if (!value || value === "undefined" || value === "null") {
                            log.error('Invalid value encountered', value);
                            return; // Skip this value
                        }

                        // Parse the value
                        var data = JSON.parse(value);
                        log.debug('Parsed Data', data);

                        var empId = data.employeeID;
                        var internalAttn = data.internalAtten;
                        var project = data.project;
                        var date = data.date;
                        var normalregin = data.nin;
                        var normalregout = data.ouut;
                        var overregin = data.oin;
                        var overregout = data.oout;
                        var shiftt=data.shiftstr;
                      var shifte=data.shiftend;
                        var childRecordId = data.idchi;

                        // Update custom record sublist
                        try {
                            updateCustomRecordSublist(data, childRecordId);
                        } catch (e) {
                            log.error('Error updating custom record sublist for employee ' + empId, e.toString());
                        }
                    } catch (e) {
                        log.error('Error parsing value in reduce function', e.toString());
                    }
                });
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
            } catch (e) {
                log.error('Reduce Error', e.toString());
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

        // Function to update the child record
        function updateCustomRecordSublist(data, childRecordId) {
            try {
                var childRecordIdInt = parseInt(childRecordId, 10);
                log.debug('Child Record ID (Integer)', childRecordIdInt);
              var statusOs = parseInt(data.osts, 10);
                log.debug('statusOs (Integer)', childRecordIdInt);

                // Load the child record
                var childRecord = record.load({
                    type: 'CUSTOMRECORD_NJT_EMP_DAILY_ATTEN_CH', // Replace with your custom record type
                    id: childRecordIdInt, // Use the integer value
                    isDynamic: true
                });

                // Set values on the child record
                childRecord.setValue({
                    fieldId: 'custrecord_njt_emp_daily_reg_in', // Replace with your field ID
                    value: data.nin
                });

                childRecord.setValue({
                    fieldId: 'custrecord_njt_emp_daily_reg_out', // Replace with your field ID
                    value: data.ouut
                });

                childRecord.setValue({
                    fieldId: 'custrecord_hris_reg_overtime_in', // Replace with your field ID
                    value: data.oin
                });

                childRecord.setValue({
                    fieldId: 'custrecord_hris_regula_overtime_out', // Replace with your field ID
                    value: data.oout
                });
              childRecord.setValue({
                    fieldId: 'custrecord_njt_ot_hours', // Replace with your field ID
                    value: data.othrours
                });
              childRecord.setValue({
                    fieldId: 'custrecord_njt_emp_daily_working_hours', // Replace with your field ID
                    value: data.totalhr
                });
                childRecord.setValue({
                    fieldId: 'custrecord_njt_daily_atten_shift_time', // Replace with your field ID
                    value: data.shiftstr
                });
                childRecord.setValue({
                    fieldId: 'custrecord_njt_daily_atten_shift_etime', // Replace with your field ID
                    value: data.shiftend
                });
              childRecord.setValue({
                    fieldId: 'custrecord_hris_overall_status', // Replace with your field ID
                    value: statusOs
                });

                // Save the child record
                var recordId = childRecord.save();
                log.debug('Child Record Updated Successfully for employee ' + data.employeeID, recordId);
            } catch (e) {
                log.error('Error updating child record for employee ' + data.employeeID, e.toString());
            }
        }

        // Summarize function
        function summarize(summary) {
            summary.mapSummary.errors.iterator().each(function (key, error, executionNo) {
                log.error('Map Error for Key: ' + key, error);
                return true;
            });

            summary.reduceSummary.errors.iterator().each(function (key, error, executionNo) {
                log.error('Reduce Error for Key: ' + key, error);
                return true;
            });
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };
    });