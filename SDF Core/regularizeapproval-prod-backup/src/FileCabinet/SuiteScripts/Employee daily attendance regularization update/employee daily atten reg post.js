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
                log.debug("statusMr", statusMr);
                
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
                // 0:Check, 1:EmpID, 2:EmpCode, 3:Name, 4:Dept, 5:Type, 6:AttendID, 7:In, 8:Out, 
                // 9:ShiftName, 10:ShiftStart, 11:ShiftEnd, 12:Total, 13:RegIn, 14:RegOut, 
                // 15:OTType, 16:OTIn, 17:OTOut, 18:OTHrs, 19:RegOTIn, 20:RegOTOut, 21:ID, 22:Status

                for (var line = 0; line < rowArray.length; line++) {
                    var columnArray = rowArray[line].split("\u0001");
                    var selectObj = {};
                    var select = columnArray[0]; // Checkbox
                    
                    if (select == 'T') {
                        selectObj.employeeID = columnArray[1];   // Hidden Employee ID
                        selectObj.employeeName = columnArray[3]; // Employee Name
                        selectObj.internalAtten = columnArray[5]; // Internal Attendance Type
                        selectObj.attendanceId = columnArray[6];  // Hidden Attendance ID
                        
                        selectObj.dept = employeePost;
                        selectObj.shiftstr = columnArray[10];
                        selectObj.shiftend = columnArray[11];
                        selectObj.totalhr = columnArray[12]; // Total Hours
                        selectObj.nin = columnArray[13];     // Regularization IN
                        selectObj.ouut = columnArray[14];    // Regularization OUT
                        
                        selectObj.overtimeType = columnArray[15]; // OT Type
                        selectObj.othrours = columnArray[18];     // OT Hrs
                        selectObj.oin = columnArray[19];          // Regularization OT IN
                        selectObj.oout = columnArray[20];         // Regularization OT OUT
                        
                        selectObj.idchi = columnArray[21];   // Child Record ID
                        selectObj.osts = columnArray[22];    // Status
                        
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
            salesSublist.addField({
                id: "custpage_de_name",
                type: serverWidget.FieldType.TEXT,
                label: "Employee Name",
            });
            // 4
            var departmentField = salesSublist.addField({
                id: "custpage_department",
                type: serverWidget.FieldType.TEXT, // Changed to TEXT to match SQL result mapping
                label: "Department",
            });
            departmentField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 5
            var selectField = salesSublist.addField({
                id: "custpage_type_name",
                type: serverWidget.FieldType.SELECT,
                label: "Internal Attendance",
                source: "customrecord_hris_attendancetype"
            });
            selectField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 6
            var attenchildid = salesSublist.addField({
                id: "custpage_attendid",
                type: serverWidget.FieldType.TEXT,
                label: "Attendance Id",
            });
            attenchildid.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            // 7
            var normalIn = salesSublist.addField({
                id: "custpage_normal_in", 
                type: serverWidget.FieldType.TEXT,
                label: "IN Time",
            });
            normalIn.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 8
            var normalOut = salesSublist.addField({
                id: "custpage_normal_out",
                type: serverWidget.FieldType.TEXT,
                label: "OUT Time",
            });
            normalOut.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 9
            var shiftName = salesSublist.addField({
                id: "custpage_shift_name",
                type: serverWidget.FieldType.TEXT,
                label: "Shift Name",
            });
            shiftName.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 10
            var shiftStartTime = salesSublist.addField({
                id: "custpage_shift_start_time",
                type: serverWidget.FieldType.TIMEOFDAY,
                label: "Shift Start Time",
            });
            shiftStartTime.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 11
            var shiftEndTime = salesSublist.addField({
                id: "custpage_shift_end_time",
                type: serverWidget.FieldType.TIMEOFDAY,
                label: "Shift End Time",
            });
            shiftEndTime.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 12
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
            // 13
            var reginNormalin = salesSublist.addField({
                id: "custpage_regnor_in",
                type: serverWidget.FieldType.TIMEOFDAY,
                label: "Regularization IN",
            });
            reginNormalin.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY
            });
            // 14
            var reginNormalout = salesSublist.addField({
                id: "custpage_regnor_out",
                type: serverWidget.FieldType.TIMEOFDAY,
                label: "Regularization OUT",
            });
            reginNormalout.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY
            });
            // 15
            var overtimetype = salesSublist.addField({
                id: "custpage_overtime",
                type: serverWidget.FieldType.SELECT,
                label: "OverTime Type",
                source: "customlist_njt_custrec_ovt_list"
            });
            overtimetype.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 16
            var otIn = salesSublist.addField({
                id: "custpage_ot_in",
                type: serverWidget.FieldType.TEXT,
                label: "OverTime IN",
            });
            otIn.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 17
            var otOut = salesSublist.addField({
                id: "custpage_ot_out",
                type: serverWidget.FieldType.TEXT,
                label: "OverTime OUT",
            });
            otOut.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // 18
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
            // 19
            var reginOtin = salesSublist.addField({
                id: "custpage_regnor_ot_in",
                type: serverWidget.FieldType.TIMEOFDAY,
                label: "Regularization OT IN",
            });
            reginOtin.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY
            });
            // 20
            var reginOtout = salesSublist.addField({
                id: "custpage_regnor_ot_out",
                type: serverWidget.FieldType.TIMEOFDAY,
                label: "Regularization OT OUT",
            });
            reginOtout.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY
            });
            // 21
            var childId = salesSublist.addField({
                id: "custpage_id",
                type: serverWidget.FieldType.TEXT,
                label: "ID"
            });
            childId.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            // 22
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
            // Using the SQL with strict Saturday/Weekday shift logic
            var setsqlquery =
                "SELECT " +
                    "BUILTIN.DF(customrecord_njt_emp_daily_atten_ch.custrecord_njt_daily_atten_ch_emp) AS nammee, " +
                    "employee.id AS int_id, " +
                    "employee.custentity_hris_empcode AS emp_code, " +
                    "BUILTIN.DF(employee.custentity_hris_empdepartment_new) AS departmenttt, " +
                    "customrecord_njt_emp_daily_atten_ch.id AS child_id, " +
                    "customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_date AS date, " +
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

            // Date filter
            if (fromPost && toPost) {
                setsqlquery +=
                    " AND customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_date BETWEEN '" +
                    fromPost + "' AND '" + toPost + "' ";
            }

            // Employee filter
            if (empPost) {
                setsqlquery += " AND employee.id = " + empPost + " ";
            }

            // Strict shift logic (Saturday vs Weekday)
            setsqlquery +=
                " AND ( " +
                    // Saturday → only Saturday shift
                    " (TO_CHAR(customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_date, 'DY') = 'SAT' " +
                    "  AND customrecord_hris_shift.custrecord_hris_shift_mst_sat_chk = 'T') " +
                    " OR " +
                    // Weekdays → only non-Saturday shift
                    " (TO_CHAR(customrecord_njt_emp_daily_atten_ch.custrecord_njt_emp_daily_date, 'DY') <> 'SAT' " +
                    "  AND (customrecord_hris_shift.custrecord_hris_shift_mst_sat_chk = 'F' " +
                    "       OR customrecord_hris_shift.custrecord_hris_shift_mst_sat_chk IS NULL)) " +
                ") ";

            logModule.debug("setsqlquery", setsqlquery);
            var queryResult = query.runSuiteQL({
                query: setsqlquery,
            });

            var tsResult = queryResult.asMappedResults();

            for (var loop = 0; loop < tsResult.length; loop++) {
                var rec = tsResult[loop];

                var empid = parseInt(rec.int_id);
                var empname = rec.nammee;
                var empCode = rec.emp_code;
                var empType = rec.internal_attendance_type || 1;
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
                var departmet = rec.departmenttt || ""; // Using alias from SQL
                var shiftNameVal = rec.shift_name || "";
                var shiftStartVal = rec.shift_start || "";
                var shiftEndVal = rec.shift_end || "";
                var dateVal = rec.date || ""; // Although not used in sublist column logic explicitly in script 2, it is good to have.

                try {
                    if (empid != "") {
                        sublist.setSublistValue({
                            id: "custpage_de_empid",
                            line: loop,
                            value: empid,
                            ignoreFieldChange: true,
                        });
                    }
                    // Note: Date field 'custpage_de_date' is not in createSublist of script 2 logic provided, 
                    // so skipping it to match script 2's createSublist structure.

                    if (empname != "") {
                        sublist.setSublistValue({
                            id: "custpage_de_name",
                            line: loop,
                            value: empname,
                            ignoreFieldChange: true,
                        });
                    }
                    if (empCode != "") {
                        sublist.setSublistValue({
                            id: "custpage_employee_code",
                            line: loop,
                            value: empCode,
                            ignoreFieldChange: true,
                        });
                    }
                    if (departmet != "") {
                        sublist.setSublistValue({
                            id: "custpage_department",
                            line: loop,
                            value: departmet,
                            ignoreFieldChange: true,
                        });
                    }
                    if (empType != "") {
                        sublist.setSublistValue({
                            id: "custpage_type_name",
                            line: loop,
                            value: empType,
                            ignoreFieldChange: true,
                        });
                        // Duplicate set for attendid as per logic
                        sublist.setSublistValue({
                            id: "custpage_attendid",
                            line: loop,
                            value: empType,
                            ignoreFieldChange: true,
                        });
                    }
                    if (norIN != "") {
                        sublist.setSublistValue({
                            id: "custpage_normal_in",
                            line: loop,
                            value: norIN,
                            ignoreFieldChange: true,
                        });
                    }
                    if (norOut != "") {
                        sublist.setSublistValue({
                            id: "custpage_normal_out",
                            line: loop,
                            value: norOut,
                            ignoreFieldChange: true,
                        });
                    }

                    // Setting Status to 4 by default
                    sublist.setSublistValue({
                        id: "custpage_status",
                        line: loop,
                        value: 1, 
                        ignoreFieldChange: true,
                    });

                    if (id != "") {
                        sublist.setSublistValue({
                            id: "custpage_id",
                            line: loop,
                            value: id,
                            ignoreFieldChange: true,
                        });
                    }

                    if (totalHouratten != "") {
                        sublist.setSublistValue({
                            id: "custpage_total",
                            line: loop,
                            value: totalHouratten,
                            ignoreFieldChange: true,
                        });
                    }
                    if (regfillin != "") {
                        sublist.setSublistValue({
                            id: "custpage_regnor_in",
                            line: loop,
                            value: regfillin,
                            ignoreFieldChange: true,
                        });
                    }
                    if (regfillout != "") {
                        sublist.setSublistValue({
                            id: "custpage_regnor_out",
                            line: loop,
                            value: regfillout,
                            ignoreFieldChange: true,
                        });
                    }

                    if (otOverin != "") {
                        sublist.setSublistValue({
                            id: "custpage_ot_in",
                            line: loop,
                            value: otOverin,
                            ignoreFieldChange: true,
                        });
                    }
                    if (otOverout != "") {
                        sublist.setSublistValue({
                            id: "custpage_ot_out",
                            line: loop,
                            value: otOverout,
                            ignoreFieldChange: true,
                        });
                    }
                    if (overour != "") {
                        sublist.setSublistValue({
                            id: "custpage_othrs",
                            line: loop,
                            value: overour,
                            ignoreFieldChange: true,
                        });
                    }
                    if (overfillin != "") {
                        sublist.setSublistValue({
                            id: "custpage_regnor_ot_in",
                            line: loop,
                            value: overfillin,
                            ignoreFieldChange: true,
                        });
                    }
                    if (overfillout != "") {
                        sublist.setSublistValue({
                            id: "custpage_regnor_ot_out",
                            line: loop,
                            value: overfillout,
                            ignoreFieldChange: true,
                        });
                    }
                    if (OVTtime != "") {
                        sublist.setSublistValue({
                            id: "custpage_overtime",
                            line: loop,
                            value: OVTtime,
                            ignoreFieldChange: true,
                        });
                    }
                    if (shiftNameVal != "") {
                        sublist.setSublistValue({
                            id: "custpage_shift_name",
                            line: loop,
                            value: shiftNameVal,
                            ignoreFieldChange: true,
                        });
                    }
                    if (shiftStartVal != "") {
                        sublist.setSublistValue({
                            id: "custpage_shift_start_time",
                            line: loop,
                            value: shiftStartVal,
                            ignoreFieldChange: true,
                        });
                    }
                    if (shiftEndVal != "") {
                        sublist.setSublistValue({
                            id: "custpage_shift_end_time",
                            line: loop,
                            value: shiftEndVal,
                            ignoreFieldChange: true,
                        });
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