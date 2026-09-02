/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
// Define module and dependencies
define(["N/ui/serverWidget", "N/search", "N/log", "N/task", "N/redirect", "N/record", "N/runtime", "N/format", "N/query", "N/currentRecord", "N/https", "N/url"],
    function (serverWidget, searchModule, logModule, taskModule, redirectModule, recordModule, runtimeModule, format, query, currentRecord, https, urlMod) {

        // ---------------------------------------------------------------------
        // Main Entry Point: onRequest
        // ---------------------------------------------------------------------
        function onRequest(context) {
            // Retrieve parameters from the HTTP request
            var sublistValues = context.request.parameters;
            logModule.debug("sublistValues", sublistValues);

            // Create the main UI Form
            var form = serverWidget.createForm({
                title: "Employee Daily Attendance Regularization And Approval",
            });

            // --- Header Fields ---
            var fromDate = form.addField({
                id: "custpage_fromdate",
                type: serverWidget.FieldType.DATE,
                label: "From Date",
            });
            fromDate.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

            var toDate = form.addField({
                id: "custpage_todate",
                type: serverWidget.FieldType.DATE,
                label: "TO Date",
            });
            toDate.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

            var employee = form.addField({
                id: "custpage_emp",
                type: serverWidget.FieldType.SELECT,
                label: "Employee",
                source: "employee",
            });
            employee.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

            var mrStatus = form.addField({
                id: 'custpage_mr_status',
                type: serverWidget.FieldType.SELECT,
                label: 'MRS Status Field',
            });
            mrStatus.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            form.addSubmitButton({ label: "Submit" });
            
            // Client Script Path
            form.clientScriptModulePath = "./reg total hour cal cs.js";

            // -----------------------------------------------------------------
            // GET Request Handling
            // -----------------------------------------------------------------
            if (context.request.method === "GET") {
                var statusMr = 1;
                logModule.debug("statusMr", statusMr);

                // Get Current User ID (HOD)
                var userObj = runtimeModule.getCurrentUser();
                var currentUserId = userObj.id;
                logModule.debug("Current User ID in Script", currentUserId);

                var empPost = context.request.parameters.custparam_employee;
                var fromPost = context.request.parameters.custparam_fromdate;
                var toPost = context.request.parameters.custparam_todate;

                // Always set the header Employee field to the current logged-in HOD
                form.getField({ id: "custpage_emp" }).defaultValue = currentUserId;
                if (fromPost) form.getField({ id: "custpage_fromdate" }).defaultValue = fromPost;
                if (toPost) form.getField({ id: "custpage_todate" }).defaultValue = toPost;

                // Create Sublist
                var sublist = createSublist(form);

                // Populate Sublist
                try {
                    setSublistvalue(sublist, query, empPost, fromPost, toPost, currentUserId);
                } catch (e) {
                    logModule.error("Error Loading Data", e.message);
                    form.addField({
                        id: 'custpage_error_msg',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: 'Error'
                    }).defaultValue = "<b style='color:red;'>Error: " + e.message + "</b>";
                }

                context.response.writePage(form);

            } 
            // -----------------------------------------------------------------
            // POST Request Handling
            // -----------------------------------------------------------------
            else if (context.request.method === "POST") {
                var employeePost = sublistValues.custpage_emp;
                
                // MR Status Check
                var statusQuery = "select custrecord_hris_mr_sts, BUILTIN.DF(custrecord_hris_mr_sts) as name from customrecord_hris_mr_status_bar_rec where id=5";
                var queryResults = query.runSuiteQL({ query: statusQuery });
                var records = queryResults.asMappedResults();

                if (records.length > 0) {
                    for (var r = 0; r < records.length; r++) {
                        mrStatus.addSelectOption({
                            value: records[r].custrecord_hris_mr_sts,
                            text: records[r].name,
                            isSelected: true
                        });
                    }
                }

                // Process Selected Rows
                // Sublist Order:
                // 0:Check, 1:EmpID, 2:AttendID, 3:EmpCode, 4:Date, 5:Name, 6:Dept, 7:Type, 8:In, 9:Out, 
                // 10:ShiftName, 11:ShiftStart, 12:ShiftEnd, 13:Total, 14:RegIn, 15:RegOut, 
                // 16:OTType, 17:OTIn, 18:OTOut, 19:OTHrs, 20:RegOTIn, 21:RegOTOut, 22:ID, 23:Status
                var rowArray = sublistValues.employeesheetdata.split("\u0002");
                var selectArray = [];

                for (var line = 0; line < rowArray.length; line++) {
                    var columnArray = rowArray[line].split("\u0001");
                    var select = columnArray[0];

                    if (select == 'T') {
                        var selectObj = {
                            employeeID: columnArray[1],
                            attendanceId: columnArray[2],
                            date: columnArray[4],
                            employeeName: columnArray[5],
                            internalAtten: columnArray[7],
                            dept: employeePost,
                            totalhr: columnArray[13], // Captures edited Total Hours
                            nin: columnArray[14],
                            ouut: columnArray[15],
                            overtimeType: columnArray[16],
                            othrours: columnArray[19], // Captures edited OT Hours
                            oin: columnArray[20],
                            oout: columnArray[21],
                            idchi: columnArray[22],
                            osts: columnArray[23]
                        };
                        selectArray.push(selectObj);
                    }
                }
                logModule.debug("selectArray", selectArray);

                // Create Map/Reduce Task
                var mrTask = taskModule.create({
                    taskType: taskModule.TaskType.MAP_REDUCE,
                    scriptId: "customscript_hris_hod_reg_approval_mr",
                    params: {
                        custscript_hris_hod_approval_mr: JSON.stringify(selectArray)
                    }
                });
                var mrTaskId = mrTask.submit();
                logModule.debug("mrTaskId", mrTaskId);

                // Redirect
                redirectModule.toSuitelet({
                    scriptId: 'customscript_hris_employee_attendance_re',
                    deploymentId: 'customdeploy_hris_employee_attendance_re',
                });

                context.response.writePage(form);
            }
        }

        // ---------------------------------------------------------------------
        // Helper Function: createSublist
        // ---------------------------------------------------------------------
        function createSublist(form) {
            var salesSublist = form.addSublist({
                id: "employeesheet",
                type: serverWidget.SublistType.LIST,
                label: "Employee Daily Sheet List",
            });
            salesSublist.addMarkAllButtons();
            salesSublist.addRefreshButton();

            // Checkbox
            salesSublist.addField({ id: "custpage_de_check", type: serverWidget.FieldType.CHECKBOX, label: "Select" });

            // Hidden Fields
            salesSublist.addField({ id: "custpage_de_empid", type: serverWidget.FieldType.TEXT, label: "Employee ID" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            salesSublist.addField({ id: "custpage_attendid", type: serverWidget.FieldType.TEXT, label: "Attendance Id" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            
            // --- DISABLED FIELDS (READ ONLY) ---
            salesSublist.addField({ id: "custpage_employee_code", type: serverWidget.FieldType.TEXT, label: "Employee Code" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            salesSublist.addField({ id: "custpage_date", type: serverWidget.FieldType.DATE, label: "Date" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            salesSublist.addField({ id: "custpage_de_name", type: serverWidget.FieldType.TEXT, label: "Employee Name" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            salesSublist.addField({ id: "custpage_department", type: serverWidget.FieldType.SELECT, label: "Department", source: "customrecord_cseg_hris_empdept" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            salesSublist.addField({ id: "custpage_type_name", type: serverWidget.FieldType.SELECT, label: "Internal Attendance", source: "customrecord_hris_attendancetype" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            salesSublist.addField({ id: "custpage_normal_in", type: serverWidget.FieldType.TEXT, label: "IN Time" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            salesSublist.addField({ id: "custpage_normal_out", type: serverWidget.FieldType.TEXT, label: "OUT Time" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            salesSublist.addField({ id: "custpage_shift_name", type: serverWidget.FieldType.TEXT, label: "Shift Name" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            salesSublist.addField({ id: "custpage_shift_start_time", type: serverWidget.FieldType.TIMEOFDAY, label: "Shift Start Time" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            salesSublist.addField({ id: "custpage_shift_end_time", type: serverWidget.FieldType.TIMEOFDAY, label: "Shift End Time" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            
            // --- ENTRY FIELDS (EDITABLE) ---
            
            // 1. Total Hours: ENTRY (Set to ENTRY to make it editable)
            salesSublist.addField({ id: "custpage_total", type: serverWidget.FieldType.TEXT, label: "Total Hours" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            
            // 2. Regularization IN/OUT: ENTRY
            salesSublist.addField({ id: "custpage_regnor_in", type: serverWidget.FieldType.TIMEOFDAY, label: "Regularization IN" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            salesSublist.addField({ id: "custpage_regnor_out", type: serverWidget.FieldType.TIMEOFDAY, label: "Regularization OUT" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            
            // OT Details (Disabled)
            salesSublist.addField({ id: "custpage_overtime", type: serverWidget.FieldType.SELECT, label: "OverTime Type", source: "customlist_njt_custrec_ovt_list" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            salesSublist.addField({ id: "custpage_ot_in", type: serverWidget.FieldType.TEXT, label: "OverTime IN" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            salesSublist.addField({ id: "custpage_ot_out", type: serverWidget.FieldType.TEXT, label: "OverTime OUT" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            
            // 3. OT Hours: ENTRY (Set to ENTRY to make it editable)
            salesSublist.addField({ id: "custpage_othrs", type: serverWidget.FieldType.FLOAT, label: "OT Hrs" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            
            // 4. Regularization OT IN/OUT: ENTRY
            salesSublist.addField({ id: "custpage_regnor_ot_in", type: serverWidget.FieldType.TIMEOFDAY, label: "Regularization OT IN" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });
            salesSublist.addField({ id: "custpage_regnor_ot_out", type: serverWidget.FieldType.TIMEOFDAY, label: "Regularization OT OUT" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.ENTRY });

            salesSublist.addField({ id: "custpage_id", type: serverWidget.FieldType.TEXT, label: "ID" })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

            var statusField = salesSublist.addField({ id: "custpage_status", type: serverWidget.FieldType.SELECT, label: "Status", source: "customlist_njt_monthly_status_list" });
            statusField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

            return salesSublist;
        }

        // ---------------------------------------------------------------------
        // Helper Function: setSublistvalue
        // ---------------------------------------------------------------------
        function setSublistvalue(sublist, query, empPost, fromPost, toPost, currentUserId) {
            
            // --- SQL with DISTINCT ---
            // Added DISTINCT to avoid duplicate rows from the Shift join
            var setsqlquery = "SELECT DISTINCT " + 
                "BUILTIN.DF(customrecord_njt_emp_daily_atten_ch.custrecord_njt_daily_atten_ch_emp) AS nammee, " +
                "employee.id AS int_id, " +
                "employee.custentity_hris_empcode as emp_code, " +
                "customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_date AS atten_date, " +
                "employee.custentity_hris_empdepartment_new, " +
                "employee.custentity_hris_emplinemanger as line_manager, " +
                "employee.custentity_hris_emphod as hod, " +
                "customrecord_njt_emp_daily_atten_ch.id AS child_id, " +
                "customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_intatt AS internal_attendance_type, " +
                "customrecord_njt_emp_daily_atten_ch.custrecord_njt_ot_hours AS othrs, " +
                "customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_working_hours AS total_hour, " +
                "customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_reg_in AS regin, " +
                "customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_reg_out AS regout, " +
                "customrecord_njt_emp_daily_atten_ch.custrecord_hris_reg_overtime_in AS regovin, " +
                "customrecord_njt_emp_daily_atten_ch.custrecord_hris_regula_overtime_out AS regovout, " +
                "customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_in_time AS intime, " +
                "customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_out_time AS outtime, " +
                "customrecord_njt_emp_daily_atten_ch.custrecord_hris_ot_ch_start_time AS otin, " +
                "customrecord_njt_emp_daily_atten_ch.custrecord_hris_overtime_end_time AS otout, " +
                "customrecord_njt_emp_daily_atten_ch.custrecord_njt_overtime_type AS ottype, " +
                "BUILTIN.DF(customrecord_hris_shift.custrecord_njt_shift_name) AS shift_name, " +
                "customrecord_hris_shift.custrecord_njt_shift_start_time AS shift_start, " +
                "customrecord_hris_shift.custrecord_njt_shift_end_time AS shift_end " +
                "FROM " +
                "employee " +
                "INNER JOIN " +
                "customrecord_njt_emp_daily_atten_ch " +
                "ON " +
                "customrecord_njt_emp_daily_atten_ch.custrecord_njt_daily_atten_ch_emp = employee.id " +
                "INNER JOIN " +
                "customrecord_hris_shift " +
                "ON " +
                "employee.id = customrecord_hris_shift.custrecord_njt_emp_parent_link " +
                
                // --- WHERE CLAUSE ---
                "WHERE employee.custentity_hris_emphod = " + currentUserId + 
                " AND customrecord_njt_emp_daily_atten_ch.custrecord_hris_dailyatten_nextuser = " + currentUserId + 
                " AND customrecord_njt_emp_daily_atten_ch.custrecord_hris_overall_status = 4";

            if (fromPost && toPost) {
                setsqlquery += " AND customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_date BETWEEN '" + fromPost + "' AND '" + toPost + "' ";
            }

            setsqlquery += " AND ( (TO_CHAR(customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_date, 'DY') = 'SAT' AND customrecord_hris_shift.custrecord_hris_shift_mst_sat_chk = 'T') OR (TO_CHAR(customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_date, 'DY') <> 'SAT' AND (customrecord_hris_shift.custrecord_hris_shift_mst_sat_chk = 'F' OR customrecord_hris_shift.custrecord_hris_shift_mst_sat_chk IS NULL)) ) ";

            logModule.debug("Generated SQL", setsqlquery);
            
            var queryResult = query.runSuiteQL({ query: setsqlquery });
            var tsResult = queryResult.asMappedResults();
            logModule.debug("tsResult",tsResult);

            for (var loop = 0; loop < tsResult.length; loop++) {
                var rec = tsResult[loop];

                var empid = parseInt(rec.int_id);
                var empname = rec.nammee;
                var empCode = rec.emp_code;
                var attenDate = rec.atten_date || "";
                var empType = rec.internal_attendance_type || 2;
                var OVTtime = rec.ottype || "";
                var overour = rec.othrs || "";
                var norIN = rec.intime || "";
                var norOut = rec.outtime || "";
                var otOverin = rec.otin || "";
                var otOverout = rec.otout || "";
                var totalHouratten = rec.total_hour || "";
                var regfillin = rec.regin || "";
                var regfillout = rec.regout || "";
                var overfillin = rec.regovin || "";
                var overfillout = rec.regovout || "";
                var id = parseInt(rec.child_id, 10);
                var departmet = rec.custentity_hris_empdepartment_new;
                var shiftNameVal = rec.shift_name || "";
                var shiftStartVal = rec.shift_start || "";
                var shiftEndVal = rec.shift_end || "";
                
                var lineManagerId = parseInt(rec.line_manager, 10);
                var hodId = parseInt(rec.hod, 10);
                
                // --- DETERMINE STATUS DEFAULT ---
                var defaultStatus = 4; // Pending
                
                // Logic based on previous HOD script context
                if (currentUserId == hodId) {
                    defaultStatus = 1; // Approve if HOD
                }
                else if (currentUserId == lineManagerId) {
                    defaultStatus = 4; // Pending if Line Manager
                }
                
                try {
                    if (empid) sublist.setSublistValue({ id: "custpage_de_empid", line: loop, value: empid, ignoreFieldChange: true });
                    if (empCode) sublist.setSublistValue({ id: "custpage_employee_code", line: loop, value: empCode, ignoreFieldChange: true });
                    if (attenDate) sublist.setSublistValue({ id: "custpage_date", line: loop, value: attenDate, ignoreFieldChange: true });
                    if (empname) sublist.setSublistValue({ id: "custpage_de_name", line: loop, value: empname, ignoreFieldChange: true });
                    if (departmet) sublist.setSublistValue({ id: "custpage_department", line: loop, value: departmet, ignoreFieldChange: true });
                    if (empType) sublist.setSublistValue({ id: "custpage_type_name", line: loop, value: empType, ignoreFieldChange: true });
                    if (empType) sublist.setSublistValue({ id: "custpage_attendid", line: loop, value: empType, ignoreFieldChange: true });
                    if (norIN) sublist.setSublistValue({ id: "custpage_normal_in", line: loop, value: norIN, ignoreFieldChange: true });
                    if (norOut) sublist.setSublistValue({ id: "custpage_normal_out", line: loop, value: norOut, ignoreFieldChange: true });

                    sublist.setSublistValue({ id: "custpage_status", line: loop, value: defaultStatus, ignoreFieldChange: true });
                    
                    if (id) sublist.setSublistValue({ id: "custpage_id", line: loop, value: id, ignoreFieldChange: true });
                    if (totalHouratten) sublist.setSublistValue({ id: "custpage_total", line: loop, value: totalHouratten, ignoreFieldChange: true });
                    if (regfillin) sublist.setSublistValue({ id: "custpage_regnor_in", line: loop, value: regfillin, ignoreFieldChange: true });
                    if (regfillout) sublist.setSublistValue({ id: "custpage_regnor_out", line: loop, value: regfillout, ignoreFieldChange: true });

                    if (otOverin) sublist.setSublistValue({ id: "custpage_ot_in", line: loop, value: otOverin, ignoreFieldChange: true });
                    if (otOverout) sublist.setSublistValue({ id: "custpage_ot_out", line: loop, value: otOverout, ignoreFieldChange: true });
                    if (overour) sublist.setSublistValue({ id: "custpage_othrs", line: loop, value: overour, ignoreFieldChange: true });
                    if (overfillin) sublist.setSublistValue({ id: "custpage_regnor_ot_in", line: loop, value: overfillin, ignoreFieldChange: true });
                    if (overfillout) sublist.setSublistValue({ id: "custpage_regnor_ot_out", line: loop, value: overfillout, ignoreFieldChange: true });
                    if (OVTtime) sublist.setSublistValue({ id: "custpage_overtime", line: loop, value: OVTtime, ignoreFieldChange: true });
                    if (shiftNameVal) sublist.setSublistValue({ id: "custpage_shift_name", line: loop, value: shiftNameVal, ignoreFieldChange: true });
                    if (shiftStartVal) sublist.setSublistValue({ id: "custpage_shift_start_time", line: loop, value: shiftStartVal, ignoreFieldChange: true });
                    if (shiftEndVal) sublist.setSublistValue({ id: "custpage_shift_end_time", line: loop, value: shiftEndVal, ignoreFieldChange: true });

                } catch (e) {
                    logModule.error("Error setting sublist value at line " + loop, e);
                }
            }
        }

        return { onRequest: onRequest };
    });