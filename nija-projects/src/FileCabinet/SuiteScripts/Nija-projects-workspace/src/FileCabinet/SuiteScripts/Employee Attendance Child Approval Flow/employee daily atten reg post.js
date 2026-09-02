/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(["N/ui/serverWidget", "N/search", "N/log", "N/task", "N/redirect", "N/record", "N/runtime", "N/format", "N/query", "N/currentRecord", "N/https", "N/url"],
    function(serverWidget, searchModule, logModule, taskModule, redirectModule, recordModule, runtimeModule, format, query, currentRecord, https, urlMod) {

        function onRequest(context) {
            var sublistValues = context.request.parameters;
            logModule.debug("sublistValues", sublistValues);
            
            var form = serverWidget.createForm({
                title: "Employee Daily Attendance Regularization And Approval",
            });
            
            var fromDate = form.addField({
                id: "custpage_fromdate",
                type: serverWidget.FieldType.DATE,
                label: "From Date",
            });
            fromDate.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            
            var toDate = form.addField({
                id: "custpage_todate",
                type: serverWidget.FieldType.DATE,
                label: "TO Date",
            });
            toDate.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            var employee = form.addField({
                id: "custpage_emp",
                type: serverWidget.FieldType.SELECT,
                label: "Employee",
                source: "employee",
            });
            employee.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            var mrStatus = form.addField({
                id: 'custpage_mr_status',
                type: serverWidget.FieldType.SELECT,
                label: 'MRS Status Field',
            });
            mrStatus.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });

            form.addSubmitButton({
                label: "Submit",
            });
            form.clientScriptModulePath = "./reg total hour cal cs.js";

            if (context.request.method === "GET") {
                var statusMr = 1;
                logModule.debug("statusMr", statusMr);
                
                var userObj = runtimeModule.getCurrentUser();
                var currentUserId = userObj.id;
                logModule.debug("Current User ID in Script", currentUserId);

                var empPost = context.request.parameters.custparam_employee;
                var fromPost = context.request.parameters.custparam_fromdate;
                var toPost = context.request.parameters.custparam_todate;

                if (empPost) {
                    form.getField({ id: "custpage_emp" }).defaultValue = empPost;
                }
                if (fromPost) {
                    form.getField({ id: "custpage_fromdate" }).defaultValue = fromPost;
                }
                if (toPost) {
                    form.getField({ id: "custpage_todate" }).defaultValue = toPost;
                }

                var sublist = createSublist(form);
                setSublistvalue(sublist, query, empPost, fromPost, toPost);
                context.response.writePage(form);

            } else if (context.request.method === "POST") {
                var employeePost = sublistValues.custpage_emp;
                var fromPost = sublistValues.custpage_fromdate;
                var toPost = sublistValues.custpage_todate;
                
                // Fetch MR Status
                var statusQuery = "select custrecord_hris_mr_sts,BUILTIN.DF(custrecord_hris_mr_sts)as name from customrecord_hris_mr_status_bar_rec where id=5";
                var queryResults = query.runSuiteQL({ query: statusQuery });
                var records = queryResults.asMappedResults();

                if (records.length > 0) {
                    for (var r = 0; r < records.length; r++) {
                        var record = records[r];
                        mrStatus.addSelectOption({
                            value: record.custrecord_hris_mr_sts,
                            text: record.name,
                            isSelected: true
                        });
                    }
                }

                var rowArray = sublistValues.employeesheetdata.split("\u0002");
                var selectArray = [];

                // Parsing based on the Sublist order defined in createSublist
                // 0:Check, 1:EmpID, 2:EmpCode, 3:Date, 4:Name, 5:Dept, 6:Type, 7:AttendID, 8:In, 9:Out, 
                // 10:ShiftName, 11:ShiftStart, 12:ShiftEnd, 13:Total, 14:RegIn, 15:RegOut, 
                // 16:OTType, 17:OTIn, 18:OTOut, 19:OTHrs, 20:RegOTIn, 21:RegOTOut, 22:ID, 23:Status

                for (var line = 0; line < rowArray.length; line++) {
                    var columnArray = rowArray[line].split("\u0001");
                    var selectObj = {};
                    var select = columnArray[0]; // Checkbox
                    
                    if (select == 'T') {
                        selectObj.employeeID = columnArray[1];   // Hidden Employee ID
                        selectObj.date = columnArray[3];          // Date
                        selectObj.employeeName = columnArray[4]; // Employee Name
                        selectObj.internalAtten = columnArray[6]; // Internal Attendance Type
                        selectObj.attendanceId = columnArray[7];  // Hidden Attendance ID
                        
                        selectObj.dept = employeePost;
                        
                        selectObj.totalhr = columnArray[13]; // Total Hours
                        selectObj.nin = columnArray[14];     // Regularization IN
                        selectObj.ouut = columnArray[15];    // Regularization OUT
                        
                        selectObj.overtimeType = columnArray[16]; // OT Type
                        selectObj.othrours = columnArray[19];     // OT Hrs
                        selectObj.oin = columnArray[20];          // Regularization OT IN
                        selectObj.oout = columnArray[21];         // Regularization OT OUT
                        
                        selectObj.idchi = columnArray[22];   // Child Record ID
                        selectObj.osts = columnArray[23];    // Status
                        
                        // Additional params for MR
                        selectObj.fromPost = fromPost;
                        selectObj.toPost = toPost;
                        selectObj.employeePost = employeePost;

                        selectArray.push(selectObj);
                    }
                }
                
                logModule.debug("selectArray", selectArray);
                
                var mrTask = taskModule.create({
                    taskType: taskModule.TaskType.MAP_REDUCE,
                    scriptId: "customscript_hris_reg_atten_mr",
                    // deploymentId: "customdeploy_hris_reg_atten_mr",
                    params: {
                        custscript_njt_column_array_selectreg: JSON.stringify(selectArray)
                    }
                });
                var mrTaskId = mrTask.submit();
                log.debug("mrTaskId", mrTaskId);

                // Redirect to the second Suitelet
                redirectModule.toSuitelet({
                    scriptId: 'customscript_hris_employee_attendance_re',
                    deploymentId: 'customdeploy_hris_employee_attendance_re',
                });

                context.response.writePage(form);
            }
        }

        function createSublist(form) {
            var salesSublist = form.addSublist({
                id: "employeesheet",
                type: serverWidget.SublistType.LIST,
                label: "Employee Daily Sheet List",
            });
            salesSublist.addMarkAllButtons();
            salesSublist.addRefreshButton();
            
            // 0
            salesSublist.addField({
                id: "custpage_de_check",
                type: serverWidget.FieldType.CHECKBOX,
                label: "Select",
            });
            // 1
            var empid = salesSublist.addField({
                id: "custpage_de_empid",
                type: serverWidget.FieldType.TEXT,
                label: "Employee ID",
            });
            empid.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            // 2
            salesSublist.addField({
                id: "custpage_employee_code",
                type: serverWidget.FieldType.TEXT,
                label: "Employee Code",
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 3
            var dateCol = salesSublist.addField({
                id: "custpage_date",
                type: serverWidget.FieldType.DATE,
                label: "Date",
            });
            dateCol.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 4
            salesSublist.addField({
                id: "custpage_de_name",
                type: serverWidget.FieldType.TEXT,
                label: "Employee Name",
            });
            // 5
            var departmentField = salesSublist.addField({
                id: "custpage_department",
                type: serverWidget.FieldType.TEXT, // Changed to TEXT to match SQL result mapping
                label: "Department",
            });
            departmentField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 6
            var selectField = salesSublist.addField({
                id: "custpage_type_name",
                type: serverWidget.FieldType.SELECT,
                label: "Internal Attendance",
                source: "customrecord_hris_attendancetype"
            });
            selectField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 7
            var attenchildid = salesSublist.addField({
                id: "custpage_attendid",
                type: serverWidget.FieldType.TEXT,
                label: "Attendance Id",
            });
            attenchildid.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            // 8
            var normalIn = salesSublist.addField({
                id: "custpage_normal_in", 
                type: serverWidget.FieldType.TEXT,
                label: "IN Time",
            });
            normalIn.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 9
            var normalOut = salesSublist.addField({
                id: "custpage_normal_out",
                type: serverWidget.FieldType.TEXT,
                label: "OUT Time",
            });
            normalOut.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 10
            var shiftName = salesSublist.addField({
                id: "custpage_shift_name",
                type: serverWidget.FieldType.TEXT,
                label: "Shift Name",
            });
            shiftName.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 11
            var shiftStartTime = salesSublist.addField({
                id: "custpage_shift_start_time",
                type: serverWidget.FieldType.TIMEOFDAY,
                label: "Shift Start Time",
            });
            shiftStartTime.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 12
            var shiftEndTime = salesSublist.addField({
                id: "custpage_shift_end_time",
                type: serverWidget.FieldType.TIMEOFDAY,
                label: "Shift End Time",
            });
            shiftEndTime.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 13
            var regTotal = salesSublist.addField({
                id: "custpage_total",
                type: serverWidget.FieldType.TEXT,
                label: "Total Hours"
            });
            regTotal.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY
            });
            regTotal.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 14
            var reginNormalin = salesSublist.addField({
                id: "custpage_regnor_in",
                type: serverWidget.FieldType.TIMEOFDAY,
                label: "Regularization IN",
            });
            reginNormalin.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY
            });
            // 15
            var reginNormalout = salesSublist.addField({
                id: "custpage_regnor_out",
                type: serverWidget.FieldType.TIMEOFDAY,
                label: "Regularization OUT",
            });
            reginNormalout.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY
            });
            // 16
            var overtimetype = salesSublist.addField({
                id: "custpage_overtime",
                type: serverWidget.FieldType.SELECT,
                label: "OverTime Type",
                source: "customlist_njt_custrec_ovt_list"
            });
            overtimetype.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 17
            var otIn = salesSublist.addField({
                id: "custpage_ot_in",
                type: serverWidget.FieldType.TEXT,
                label: "OverTime IN",
            });
            otIn.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 18
            var otOut = salesSublist.addField({
                id: "custpage_ot_out",
                type: serverWidget.FieldType.TEXT,
                label: "OverTime OUT",
            });
            otOut.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 19
            var overtimehrs = salesSublist.addField({
                id: "custpage_othrs",
                type: serverWidget.FieldType.FLOAT,
                label: "OT Hrs",
            });
            overtimehrs.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY
            });
            overtimehrs.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 20
            var reginOtin = salesSublist.addField({
                id: "custpage_regnor_ot_in",
                type: serverWidget.FieldType.TIMEOFDAY,
                label: "Regularization OT IN",
            });
            reginOtin.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY
            });
            // 21
            var reginOtout = salesSublist.addField({
                id: "custpage_regnor_ot_out",
                type: serverWidget.FieldType.TIMEOFDAY,
                label: "Regularization OT OUT",
            });
            reginOtout.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY
            });
            // 22
            var childId = salesSublist.addField({
                id: "custpage_id",
                type: serverWidget.FieldType.TEXT,
                label: "ID"
            });
            childId.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            // 23
            var status = salesSublist.addField({
                id: "custpage_status",
                type: serverWidget.FieldType.SELECT,
                label: "Status",
                source: "customlist_njt_monthly_status_list"
            });
            // DISABLED per request
            status.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            return salesSublist;
        }

        function setSublistvalue(sublist, query, empPost, fromPost, toPost) {
            var allResults = [];
            var offset = 0;
            var pageSize = 5000;
            var hasMore = true;

            // Build the base SQL query
            var baseQuery =
                "SELECT " +
                    "BUILTIN.DF(customrecord_njt_emp_daily_atten_ch.custrecord_njt_daily_atten_ch_emp) AS nammee, " +
                    "employee.id AS int_id, " +
                    "employee.custentity_hris_empcode AS emp_code, " +
                    "customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_date AS atten_date, " +
                    "BUILTIN.DF(employee.custentity_hris_empdepartment_new) AS departmenttt, " +
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
                "FROM employee " +
                "INNER JOIN customrecord_njt_emp_daily_atten_ch " +
                    "ON customrecord_njt_emp_daily_atten_ch.custrecord_njt_daily_atten_ch_emp = employee.id " +
                "INNER JOIN customrecord_hris_shift " +
                    "ON employee.id = customrecord_hris_shift.custrecord_njt_emp_parent_link " +
                "WHERE 1 = 1 ";

            if (fromPost && toPost) {
                baseQuery += " AND customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_date BETWEEN '" + fromPost + "' AND '" + toPost + "' ";
            }
            if (empPost) {
                baseQuery += " AND employee.id = " + empPost + " ";
            }
            baseQuery += " AND ( (TO_CHAR(customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_date, 'DY') = 'SAT' AND customrecord_hris_shift.custrecord_hris_shift_mst_sat_chk = 'T') OR (TO_CHAR(customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_date, 'DY') <> 'SAT' AND (customrecord_hris_shift.custrecord_hris_shift_mst_sat_chk = 'F' OR customrecord_hris_shift.custrecord_hris_shift_mst_sat_chk IS NULL)) ) ";

            // SQL Pagination Concept: Loop with OFFSET to fetch more than 5000 rows
            while (hasMore) {
                var paginatedQuery = baseQuery + " ORDER BY employee.id OFFSET " + offset + " ROWS FETCH NEXT " + pageSize + " ROWS ONLY";
                var queryResult = query.runSuiteQL({ query: paginatedQuery });
                var records = queryResult.asMappedResults();
                
                if (records.length > 0) {
                    allResults = allResults.concat(records);
                    offset += pageSize;
                    if (records.length < pageSize) { hasMore = false; }
                } else {
                    hasMore = false;
                }
                // Safety break for Suitelets (Sublists crash at extreme row counts)
                if (allResults.length >= 10000) { hasMore = false; }
            }

            for (var loop = 0; loop < allResults.length; loop++) {
                var rec = allResults[loop];
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
                var departmet = rec.departmenttt || ""; 
                var shiftNameVal = rec.shift_name || "";
                var shiftStartVal = rec.shift_start || "";
                var shiftEndVal = rec.shift_end || "";

                try {
                    if (empid) {
                        sublist.setSublistValue({ id: "custpage_de_empid", line: loop, value: empid, ignoreFieldChange: true });
                    }
                    if (empCode) {
                        sublist.setSublistValue({ id: "custpage_employee_code", line: loop, value: empCode, ignoreFieldChange: true });
                    }
                    if (attenDate) {
                        sublist.setSublistValue({ id: "custpage_date", line: loop, value: attenDate, ignoreFieldChange: true });
                    }
                    if (empname) {
                        sublist.setSublistValue({ id: "custpage_de_name", line: loop, value: empname, ignoreFieldChange: true });
                    }
                    if (departmet) {
                        sublist.setSublistValue({ id: "custpage_department", line: loop, value: departmet, ignoreFieldChange: true });
                    }
                    if (empType) {
                        sublist.setSublistValue({ id: "custpage_type_name", line: loop, value: empType, ignoreFieldChange: true });
                        sublist.setSublistValue({ id: "custpage_attendid", line: loop, value: empType, ignoreFieldChange: true });
                    }
                    if (norIN) {
                        sublist.setSublistValue({ id: "custpage_normal_in", line: loop, value: norIN, ignoreFieldChange: true });
                    }
                    if (norOut) {
                        sublist.setSublistValue({ id: "custpage_normal_out", line: loop, value: norOut, ignoreFieldChange: true });
                    }
                    sublist.setSublistValue({ id: "custpage_status", line: loop, value: 4, ignoreFieldChange: true });
                    if (id) {
                        sublist.setSublistValue({ id: "custpage_id", line: loop, value: id, ignoreFieldChange: true });
                    }
                    if (totalHouratten) {
                        sublist.setSublistValue({ id: "custpage_total", line: loop, value: totalHouratten, ignoreFieldChange: true });
                    }
                    if (regfillin) {
                        sublist.setSublistValue({ id: "custpage_regnor_in", line: loop, value: regfillin, ignoreFieldChange: true });
                    }
                    if (regfillout) {
                        sublist.setSublistValue({ id: "custpage_regnor_out", line: loop, value: regfillout, ignoreFieldChange: true });
                    }
                    if (otOverin) {
                        sublist.setSublistValue({ id: "custpage_ot_in", line: loop, value: otOverin, ignoreFieldChange: true });
                    }
                    if (otOverout) {
                        sublist.setSublistValue({ id: "custpage_ot_out", line: loop, value: otOverout, ignoreFieldChange: true });
                    }
                    if (overour) {
                        sublist.setSublistValue({ id: "custpage_othrs", line: loop, value: overour, ignoreFieldChange: true });
                    }
                    if (overfillin) {
                        sublist.setSublistValue({ id: "custpage_regnor_ot_in", line: loop, value: overfillin, ignoreFieldChange: true });
                    }
                    if (overfillout) {
                        sublist.setSublistValue({ id: "custpage_regnor_ot_out", line: loop, value: overfillout, ignoreFieldChange: true });
                    }
                    if (OVTtime) {
                        sublist.setSublistValue({ id: "custpage_overtime", line: loop, value: OVTtime, ignoreFieldChange: true });
                    }
                    if (shiftNameVal) {
                        sublist.setSublistValue({ id: "custpage_shift_name", line: loop, value: shiftNameVal, ignoreFieldChange: true });
                    }
                    if (shiftStartVal) {
                        sublist.setSublistValue({ id: "custpage_shift_start_time", line: loop, value: shiftStartVal, ignoreFieldChange: true });
                    }
                    if (shiftEndVal) {
                        sublist.setSublistValue({ id: "custpage_shift_end_time", line: loop, value: shiftEndVal, ignoreFieldChange: true });
                    }
                } catch (e) {
                    logModule.error("Error setting sublist value at line " + loop, e);
                }
            }
        }

        return {
            onRequest: onRequest,
        };
    });