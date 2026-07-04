/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/ui/serverWidget','N/search','N/record'], function(serverWidget,search,record) {
    /**
     * Function executed before the record is loaded.
     */
    function beforeLoad(context) {
        try {
            if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
                var form = context.form;

                // 1. Add the multi-select field
                var employeeField = form.addField({
                    id: 'custpage_employee_multiselect',
                    type: serverWidget.FieldType.MULTISELECT,
                    label: 'Select Employees'
                });

                employeeField.isMandatory = true;

                // 2. INSERT BEFORE the target field
                // This moves the field from the bottom to before 'custrecord_hris_comp_annou_audience'
                form.insertField({
                    field: employeeField,
                    nextfield: 'custrecord_hris_comp_annou_audience'
                });

                // Attach Client Script
                form.clientScriptModulePath = '/SuiteScripts/HRMS API/_hr_announcement_cs.js';

                log.debug({
                    title: 'Field Positioned',
                    details: 'Field inserted before: custrecord_hris_comp_annou_audience'
                });
            }
        } catch (e) {
            log.error({
                title: 'Error in beforeLoad',
                details: e.toString()
            });
        }
    }
function beforeSubmit(scriptContext) {
        try {
            var currentRecord = scriptContext.newRecord;

            // ONLY RUN ON CREATE
            if (scriptContext.type === scriptContext.UserEventType.CREATE) {
                
                var s_auto_prfix = "CA"; // Prefix for Company Announcement
                
                // Get the numeric internal ID of the record type
                var i_rec_type_id = currentRecord.getValue({ fieldId: "rectype" });

                // Search for the unique counter record for this record type
                var customrecord_hris_unique_reference_numbeSearchObj = search.create({
                    type: "customrecord_hris_unique_reference_numbe",
                    filters: [
                        ["custrecord_hris_record_type", "anyof", i_rec_type_id],
                        "AND",
                        ["isinactive", "is", "F"],
                    ],
                    columns: [
                        search.createColumn({ name: "custrecord_hris_unique_number" }),
                        search.createColumn({ name: "internalid" }),
                    ],
                });

                var searchResultCount = customrecord_hris_unique_reference_numbeSearchObj.runPaged().count;

                if (searchResultCount > 0) {
                    customrecord_hris_unique_reference_numbeSearchObj.run().each(function(result) {
                        var i_id_unique_ref = result.getValue({ name: "internalid" });
                        var i_unique_num = result.getValue({ name: "custrecord_hris_unique_number" });

                        // Increment number
                        i_unique_num = parseInt(i_unique_num) + 1;

                        // Formatting the numeric part (padding)
                        var zeros = "";
                        if (i_unique_num.toString().length == 1) { zeros = "00"; }
                        if (i_unique_num.toString().length == 2) { zeros = "0"; }

                        var refnumber = zeros + i_unique_num;
                        var d_current_date = new Date();
                        var i_fullYear = d_current_date.getFullYear();

                        // Construct Final String: CA-NO-001-2024
                        var s_auto_number = s_auto_prfix + "-" + "NO" + "-" + refnumber + "-" + i_fullYear;

                        // Set the 'name' field (Standard Name/ID field)
                        currentRecord.setValue({
                            fieldId: "name",
                            value: s_auto_number
                        });

                        // IMPORTANT: Also set your custom ref field if needed
                        // currentRecord.setValue({ fieldId: "custrecord_hris_comp_annou_ref_no", value: s_auto_number });

                        // Update the Counter record
                        record.submitFields({
                            type: "customrecord_hris_unique_reference_numbe",
                            id: i_id_unique_ref,
                            values: {
                                'custrecord_hris_unique_number': i_unique_num
                            }
                        });

                        log.debug("Auto Number Generated", s_auto_number);
                        return false; // Exit loop after first result
                    });
                }
            }
        } catch (e) {
            log.error("Error in beforeSubmit AutoNumber", e.toString());
        }
    }

    return {
        beforeLoad: beforeLoad,
      beforeSubmit:beforeSubmit
    };
});