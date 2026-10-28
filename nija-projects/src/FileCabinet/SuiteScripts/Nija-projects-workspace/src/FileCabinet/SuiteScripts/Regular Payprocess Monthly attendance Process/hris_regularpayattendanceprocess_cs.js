/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/https', 'N/url', 'N/query', 'N/log'], function (https, url, query, log) {
    function fieldChanged(context) {
        debugger;
        var fieldId = context.fieldId;

        if (fieldId === 'custpage_month' || fieldId === 'custpage_year' || fieldId === 'custpage_subsi') {
            var currentRecord = context.currentRecord;
            var month = currentRecord.getValue('custpage_month');
            var year = currentRecord.getValue('custpage_year');
            var subsidiary = currentRecord.getValue('custpage_subsi');
            var Empcode = currentRecord.getField('custpage_empcode');

            if (month && year && subsidiary) {
                // Construct SuiteQL query
            //     var monthlysql = "SELECT a.*, e.entityid AS emp_name, e.custentity_hris_empcode AS emp_code, e.subsidiary " +
            //     "FROM customrecord_hrms_monthlyattendance a " +
            //     "JOIN customlist_hris_month_list b ON a.custrecord_hrms_month_monthid = b.id " +
            //     "JOIN customlist_hris_year_master c ON a.custrecord_hrms_month_yearid = c.id " +
            //     "JOIN employee e ON e.id = a.custrecord_hrms_month_empid " +
            //     "WHERE b.id = " + month + " AND b.isinactive = 'F' " +
            //     "AND c.id = " + year + " AND a.custrecord_njt_hrms_monthly_status = 1 " +
            //    //  "AND a.custrecord_hrms_month_processcompleted = 'F' " +
            //     "AND e.subsidiary = '"+subsidiary+"' " +
            //     "AND c.isinactive = 'F' ";
            //     log.debug("Generated SQL Query", monthlysql);
                // logModule.debug("Generated SQL Query", monthlysql);
                var monthlysql = 
    "SELECT a.*, e.entityid AS emp_name, e.custentity_hris_empcode AS emp_code, e.subsidiary, e.id AS idemp " +
    "FROM customrecord_hrms_monthlyattendance a " +
    "JOIN customlist_hris_month_list b ON a.custrecord_hrms_month_monthid = b.id " +
    "JOIN customlist_hris_year_master c ON a.custrecord_hrms_month_yearid = c.id " +
    "JOIN employee e ON e.id = a.custrecord_hrms_month_empid " +
    "WHERE b.id = " + month + " AND b.isinactive = 'F' " +
    "AND c.id = " + year + " AND a.custrecord_njt_hrms_monthly_status = 1 " +
    "AND e.subsidiary = " + subsidiary + " " +
    "AND c.isinactive = 'F';";

            
            
            
            
                    //    logModule.debug("Monthly SQL Query", monthlysql);
               
                       // Run the SuiteQL query
                       var queryResult = query.runSuiteQL({ query: monthlysql });
                       var tsResult = queryResult.asMappedResults();
                    //    logModule.debug("tsResult",tsResult);
                    //    logModule.debug("tsResult length",tsResult.length);
               
                       // Loop through the results and set sublist values
                       for (var loop = 0; loop < tsResult.length; loop++) {
                           var rec = tsResult[loop];
               
                           var empid = rec.idemp||"";
                           var empname = rec.emp_name;
                           var empCode=rec.emp_code||"";
                           var project=rec.custrecord_hrms_month_project;
                           var projectSeg=rec.custrecord_hrms_month_projectsite;
                           var internalAttendanceType = rec.custrecord_hrms_month_presentdays || 0; // Default to 0 if PresentCount is null
                           var absentCount = rec.custrecord_hrms_month_absentdays || 0;
                           var weeklyOTHours = rec.custrecord_hrms_month_weeklyothrs || 0;
                           var holiOt=rec.custrecord_hrms_month_holidayothrs || 0;
                           var rotOt=rec.custrecord_hrms_month_rothrs || 0;
                            var parId=rec.id 

              Empcode.insertSelectOption({
                value: empid,
                text: empCode,
                isSelected: false
            });

        }
        }
        }
    }

    return {
        fieldChanged: fieldChanged,
    };
});
