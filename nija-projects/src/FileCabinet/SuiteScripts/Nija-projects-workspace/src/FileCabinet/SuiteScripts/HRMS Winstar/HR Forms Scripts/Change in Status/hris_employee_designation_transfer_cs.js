/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(["N/record"], function (record) {

    function fieldChanged(context) {
      debugger;
        var currentRecord = context.currentRecord;
        var fieldId = context.fieldId;
     



        // Only run if one of the header fields changed
        if (fieldId === 'custrecord_hris_cis_date' || 
            fieldId === 'custrecord_hris_cis_subsidiary' || 
            fieldId === 'custrecord_hris_cis_department') {

            var transferDate = currentRecord.getValue({ fieldId: "custrecord_hris_cis_date" });
            var subsidiary = currentRecord.getValue({ fieldId: "custrecord_hris_cis_subsidiary" });
            var department = currentRecord.getValue({ fieldId: "custrecord_hris_cis_department" });

            // Apply values to the line currently being edited
            if (transferDate) {
                currentRecord.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_hris_cisd_link",
                    fieldId: "custrecord_hris_cisd_date",
                    line:0,
                    value: transferDate,
                    ignoreFieldChange: true
                });
     


            }
            if (subsidiary) {
                currentRecord.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_hris_cisd_link",
                    fieldId: "custrecord_hris_cisd_subsidiary",                
                    value: subsidiary,                    
                    ignoreFieldChange: false
                });
            }
            if (department) {
                currentRecord.setCurrentSublistValue({
                    sublistId: "recmachcustrecord_hris_cisd_link",
                    fieldId: "custrecord_hris_cisd_department",                 
                    value: department, 
                    ignoreFieldChange: false
                });
            }
        }
    }

    function lineInit(context) {
        if (context.sublistId === "recmachcustrecord_hris_cisd_link") {
            var currentRecord = context.currentRecord;
            
            // Populate values when a new line is initialized
            var transferDate = currentRecord.getValue({ fieldId: "custrecord_hris_cis_date" });
            var subsidiary = currentRecord.getValue({ fieldId: "custrecord_hris_cis_subsidiary" });
            var department = currentRecord.getValue({ fieldId: "custrecord_hris_cis_department" });

            if (transferDate) currentRecord.setCurrentSublistValue({ sublistId: context.sublistId, fieldId: "custrecord_hris_cisd_date", value: transferDate, ignoreFieldChange: true });
            if (subsidiary) currentRecord.setCurrentSublistValue({ sublistId: context.sublistId, fieldId: "custrecord_hris_cisd_subsidiary", value: subsidiary, ignoreFieldChange: false });
            if (department) currentRecord.setCurrentSublistValue({ sublistId: context.sublistId, fieldId: "custrecord_hris_cisd_department", value: department, ignoreFieldChange: false });
        }
    }

    return {
        fieldChanged: fieldChanged,
        lineInit: lineInit
    };
});