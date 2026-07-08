/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
var Email;
define(["N/ui/serverWidget", "N/search", "N/log", "N/task", "N/redirect", "N/record", "N/runtime", "N/format", "N/query", "N/currentRecord", "N/https", "N/url", 'N/email'],
    function (serverWidget, search, log, task, redirect, record, runtime, format, query, currentRecord, https, url, email) {
        Email = email;



        function onRequest(context) {
            var sublistValues = context.request.parameters;
            log.debug("sublistValues", sublistValues);

            var currentUser = runtime.getCurrentUser();

            var roleId = currentUser.role;      // Role internal ID
            var roleName = currentUser.roleId;

            var userId = runtime.getCurrentUser().id;
            log.debug("Logged in User ID", userId);
            // if(roleId !=1294 && roleId !=3){
            // Create a form
            var form = serverWidget.createForm({
                title: "Employee  Regular Monthly attendance",
            });

            // Add fields to the form
            var monthField = form.addField({
                id: "custpage_month",
                type: serverWidget.FieldType.SELECT,
                label: "Month",
                source: "customlist_hris_month_list",
            });
            monthField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            var yearField = form.addField({
                id: "custpage_year",
                type: serverWidget.FieldType.SELECT,
                label: "Year",
                source: "customlist_hris_year_master",
            });
            yearField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            // var projectField = form.addField({
            //     id: "custpage_project",
            //     type: serverWidget.FieldType.SELECT,
            //     label: "Project",
            //     source: "customrecord_cseg_njt_seg_proj",
            // });
            // projectField.updateDisplayType({
            //     displayType: serverWidget.FieldDisplayType.DISABLED
            // });
            // var projectsegField = form.addField({
            //     id: "custpage_projectseg",
            //     type: serverWidget.FieldType.SELECT,
            //     label: "Project Site",
            //     source: "customrecord_cseg_njt_seg_pros",
            // });
            // projectsegField.updateDisplayType({
            //     displayType: serverWidget.FieldDisplayType.DISABLED
            // });
            var subsidiaryfield = form.addField({
                id: "custpage_subsi",
                type: serverWidget.FieldType.SELECT,
                label: "Subsidairy",
                source: "subsidiary",
            });
            subsidiaryfield.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
            /*   var departmentfield=form.addField({
                 id: "custpage_department",
             type: serverWidget.FieldType.SELECT,
             label: "Department",
             source: "customrecord_cseg_hris_empdept",
         });
          departmentfield.updateDisplayType({
                 displayType: serverWidget.FieldDisplayType.DISABLED
             }); */
            var locationfield = form.addField({
                id: "custpage_location",
                type: serverWidget.FieldType.SELECT,
                label: "Location",
                source: "customrecord_cseg_hris_emploc",
            });
            locationfield.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            /*     var mrStatus = form.addField({
                    id: 'custpage_mr_status',
                    type: serverWidget.FieldType.SELECT,
                    label: 'MRS Status Field',
                    //container: 'status'
                });
                mrStatus.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED,
                }); */
            var employeecount = form.addField({
                id: 'custpage_count',
                type: serverWidget.FieldType.INTEGER,
                label: 'COUNT',
                //container: 'status'
            });
            employeecount.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
            });

            form.addSubmitButton({
                label: "Submit",
            });
            // Set client script module path
            // form.clientScriptModulePath = "./hris_regularmonthlyattendancecreate_cl.js";


            if (context.request.method === "GET") {
                var statusMr = 1
                log.debug("statusMr", statusMr);
                var monthFied = context.request.parameters.custparam_month;
                var yearField = context.request.parameters.custparam_year;
                //var departmentField =context.request.parameters.custparam_department
                var locationField = context.request.parameters.custparam_location
                log.debug("yearField", yearField);
                log.debug('monthFied', monthFied);
                log.debug('locationField', locationField)
                // var projectField = context.request.parameters.custparam_project;
                // var projectsegField = context.request.parameters.custparam_projectseg;
                var subsidiaryfield = context.request.parameters.custparam_subsi;
                log.debug("subsidiaryfieldcheck", subsidiaryfield);

                if (monthFied) {
                    form.getField({ id: "custpage_month" }).defaultValue = monthFied;
                }
                if (yearField) {
                    form.getField({ id: "custpage_year" }).defaultValue = yearField;

                }
                /*  if (departmentfield) {
                     form.getField({ id: "custpage_department" }).defaultValue = departmentField;
 
                 } */
                if (locationField) {
                    form.getField({ id: "custpage_location" }).defaultValue = locationField;

                }

                // if (projectField) {
                //     form.getField({ id: "custpage_project" }).defaultValue = projectField;
                // }
                // if (projectsegField) {
                //     form.getField({ id: "custpage_projectseg" }).defaultValue = projectsegField;
                // }
                if (yearField) {
                    var rec = record.load({
                        type: 'customlist_hris_year_master', // replace with correct record type
                        id: yearField
                    });

                    var yearText = rec.getValue('name'); // or any text field
                    log.debug('Year Text:', yearText);
                }
                var GetDate = getdate(monthFied, yearText);

                log.debug('GetDate function value', GetDate);
                var DATE = GetDate.toString().split('#');
                var WStartDate = DATE[0];
                var WEndDate = DATE[1];
                log.emergency('WStartDate', WStartDate);
                log.emergency('WEndDate', WEndDate);

                if (subsidiaryfield) {
                    form.getField({ id: "custpage_subsi" }).defaultValue = subsidiaryfield;
                }
                log.debug("subsidiaryfieldcheckpart1", subsidiaryfield);

                var sublist = createSublist(form);
                //  var dailysetsqlquerytsResult =mainsetSublistvalue(sublist, query, monthFied, yearField, subsidiaryfield,WStartDate,WEndDate,Email,locationField,roleId,userId);
                var setcount = setSublistvalue(sublist, query, monthFied, yearField, subsidiaryfield, WStartDate, WEndDate, locationField);
                employeecount.defaultValue = parseInt(setcount);
                context.response.writePage(form);
            } else if (context.request.method === "POST") {
                var monthFied = sublistValues.custpage_month;
                var yearField = sublistValues.custpage_year;
                // var projectField = sublistValues.custpage_project;
                //  var projectsegField = sublistValues.custpage_projectseg;
                var subsidiaryfield = sublistValues.custpage_subsi;
                var departmentField = sublistValues.custpage_department;

                log.debug("monthFied", monthFied);
                log.debug("yearField", yearField);
                if (yearField) {
                    var rec = record.load({
                        type: 'customlist_hris_year_master', // replace with correct record type
                        id: yearField
                    });

                    var yearText = rec.getValue('name'); // or any text field
                    log.debug('Year Text:', yearText);
                }
                var GetDate = getdate(monthFied, yearText);

                log.debug('GetDate function value', GetDate);
                var DATE = GetDate.toString().split('#');
                var WStartDate = DATE[0];
                var WEndDate = DATE[1];

                //logModule.debug("vendorValue", vendorValue);
                var statusQuery = "select custrecord_hris_mr_sts,BUILTIN.DF(custrecord_hris_mr_sts)as name from customrecord_hris_mr_status_bar_rec where id=15";
                var queryResults = query.runSuiteQL({
                    query: statusQuery
                });
                var records = queryResults.asMappedResults();

                if (records.length > 0) {
                    for (var r = 0; r < records.length; r++) {
                        var rec = records[r];
                        var name = rec.name;
                        var id = rec.custrecord_hris_mr_sts; // Assuming 'id' is the value you want to set

                        mrStatus.addSelectOption({
                            value: id,
                            text: name,
                            isSelected: true
                        });


                    }
                }

                var statusMr = context.request.parameters.custpage_mr_status;
                var rowArray = sublistValues.employeesheetdata.split("\u0002");
                var selectArray = [];

                for (var line = 0; line < rowArray.length; line++) {
                    var columnArray = rowArray[line].split("\u0001");
                    log.debug("coulmnArray", columnArray);
                    var selectObj = {};
                    var select = columnArray[0];
                    if (select == 'T') {
                        /*  selectObj.empid = columnArray[2];
                         selectObj.employeeCode = columnArray[3];
                         selectObj.employeeName = columnArray[1];
                         selectObj.projectId = columnArray[5]; // Extract internalAtten value
                         selectObj.projectSegid = columnArray[6];
                         selectObj.noPresntId = columnArray[7];
                         selectObj.noAbsentId = columnArray[8];
                         selectObj.noweeklyId = columnArray[9];
                         selectObj.noholiId = columnArray[10];
                         selectObj.norotId = columnArray[11];
                         selectObj.intempId = columnArray[12];
                         selectObj.parId = columnArray[13];
                         selectObj.monthFiedid = monthFied;
                         selectObj.yearFiedidid = yearField;
                         selectObj.processid = true;
                         selectObj.WStartDate=WStartDate;
                         selectObj.WEndDate=WEndDate;
                         selectArray.push(selectObj); */
                        selectObj.empid = columnArray[2];
                       /*  selectObj.employeeCode = columnArray[3];
                        selectObj.employeeName = columnArray[1];
                        selectObj.projectId = columnArray[5]; // Extract internalAtten value
                        selectObj.projectSegid = columnArray[6];
                    */     selectObj.noPresntId = columnArray[7];
                        selectObj.noAbsentId = columnArray[8];
                        selectObj.noweeklyId = "";
                        selectObj.noholiId = "";
                        selectObj.norotId = columnArray[9];
                        selectObj.intempId = columnArray[10];
                        selectObj.parId = columnArray[11];
                        selectObj.monthFiedid = monthFied;
                        selectObj.yearFiedidid = yearField;
                        selectObj.processid = true;
                        selectObj.WStartDate = WStartDate;
                        selectObj.WEndDate = WEndDate;
                        selectObj.compOff = columnArray[12];
                        selectObj.compOffRound = columnArray[13];
                        selectArray.push(selectObj);
                    }
                }
                log.emergency("selectArray", selectArray);
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: "customscript_hris_dailytomon_process_mrs",
                    deploymentId: "customdeploy_hris_dailytomon_process_mrs",
                    params: {
                        custscript_hris_dailytomon_array: JSON.stringify(selectArray)
                    }
                });
                var mrTaskId = mrTask.submit();
                log.debug("mrTaskId", mrTaskId);

                // Redirect to the second Suitelet with manager and date values as parameters

                redirect.toSuitelet({
                    scriptId: "customscript_hris_dailytomon_status_sl",
                    deploymentId: "customdeploy_hris_dailytomon_status_sl",
                    parameters: {
                        custscript_chqall_tskid: mrTaskId,

                    }
                });
                /*  redirect.toSuitelet({
                     scriptId: 'customscript_hris_dailytomon_status_sl',
                     deploymentId: 'customdeploy_hris_dailytomon_status_sl',
                 }); */

                context.response.writePage(form);
            }
        }

        function createSublist(form) {
            var salesSublist = form.addSublist({
                id: "employeesheet",
                type: serverWidget.SublistType.LIST,
                label: "Employee Monthly Sheet List",
            });
            salesSublist.addMarkAllButtons();
            salesSublist.addRefreshButton();
            salesSublist.addField({
                id: "custpage_de_check",
                type: serverWidget.FieldType.CHECKBOX,
                label: "Select",
            });
            var empid = salesSublist.addField({
                id: "custpage_de_empid",
                type: serverWidget.FieldType.SELECT,
                label: "Employee",
                source: "employee"
            });
            // Add Employee Code field and hide it
            var empcode = salesSublist.addField({
                id: "custpage_de_empidcode",
                type: serverWidget.FieldType.TEXT,
                label: "Employee Code"
            });
            empcode.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            // Add Employee Name field and hide it
            var empname = salesSublist.addField({
                id: "custpage_de_name",
                type: serverWidget.FieldType.TEXT,
                label: "Employee Name"
            });
            empname.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            // Add Project Code field and hide it
            var projectCode = salesSublist.addField({
                id: "custpage_project_code",
                type: serverWidget.FieldType.SELECT,
                label: "Project Code",
                source: "customrecord_cseg_njt_seg_proj"
            });
            projectCode.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            // Add Project Site field and hide it
            var projectSite = salesSublist.addField({
                id: "custpage_site",
                type: serverWidget.FieldType.SELECT,
                label: "Project Site",
                source: "customrecord_cseg_njt_seg_pros"
            });
            projectSite.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            /* attenchildid.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            }); */
            var Noofpresent = salesSublist.addField({
                id: "custpage_noofpresent",
                type: serverWidget.FieldType.TEXT,
                label: "No of Present",
            });
            /*  Noofpresent.updateDisplayType({
                 displayType: serverWidget.FieldDisplayType.HIDDEN
             }); */
            var noofabsent = salesSublist.addField({
                id: "custpage_noofabsent",
                type: serverWidget.FieldType.TEXT,
                label: "No Of Absent",
            });
            /*  noofabsent.updateDisplayType({
                 displayType: serverWidget.FieldDisplayType.HIDDEN
             }); */
            // var weeklyOt = salesSublist.addField({
            //     id: "custpage_weeklyot",
            //     type: serverWidget.FieldType.TEXT,
            //     label: "Weeklyoff OT Hours",
            // });
            /* weeklyOt.updateDisplayType({
               displayType: serverWidget.FieldDisplayType.HIDDEN
           }); */
            // var holidayOt = salesSublist.addField({
            //     id: "custpage_holiot",
            //     type: serverWidget.FieldType.TEXT,
            //     label: "Holiday OT Hours",
            // });
            /*  holidayOt.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            }); */
            var rotHours = salesSublist.addField({
                id: "custpage_rothours",
                type: serverWidget.FieldType.TEXT,
                label: "OT Hours",
            });
            /*  rotHours.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            }); */
            var employeeintid = salesSublist.addField({
                id: "custpage_de_empintid",
                type: serverWidget.FieldType.TEXT,
                label: "Employee ID",
                //source:"employee Id"
            });
            employeeintid.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            var parid = salesSublist.addField({
                id: "custpage_parid",
                type: serverWidget.FieldType.TEXT,
                label: "Parent ID",
                //source:"employee Id"
            });
            parid.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            var compOffField = salesSublist.addField({
                id: "custpage_compoff",
                type: serverWidget.FieldType.TEXT,
                label: "Comp Off"
            });
            // compOffField.updateDisplayType({
            //     displayType: serverWidget.FieldDisplayType.HIDDEN
            // });
            var compOffRoundField = salesSublist.addField({
                id: "custpage_compoffround",
                type: serverWidget.FieldType.TEXT,
                label: "Comp Off Roundoff"
            });
            // compOffRoundField.updateDisplayType({
            //     displayType: serverWidget.FieldDisplayType.HIDDEN
            // });

            return salesSublist;
        }

        function setSublistvalue(sublist, query, monthField, yearField, subsidiaryfield, WStartDate, WEndDate, locationField) {
            try {



                // Loop through the results and set sublist values
                var count = 0;


                if (locationField) {

                    var sql =
                        "SELECT " +
                        "    emp.custrecord_njt_daily_atten_emp AS employee_id, " +
                        "    a.custrecord_njt_emp_atten_month AS month, " +
                        "    a.custrecord_njt_emp_atten_year AS year, " +
                        "    c.subsidiary, " +
                        "    c.custentity_hris_empdlocation_new, " +

                        "    SUM(CASE " +
                        "        WHEN emp.custrecord_njt_emp_daily_intatt IS NOT NULL " +
                        "         AND emp.custrecord_njt_emp_daily_intatt NOT IN (9, 21) " +
                        "        THEN NVL(emp.custrecord_njt_emp_daily_working_hours,0) " +
                        "        ELSE NULL END) AS emp_daily_working_hours, " +

                        "    SUM(CASE " +
                        "        WHEN emp.custrecord_njt_emp_daily_intatt = 21 " +
                        "        THEN NVL(emp.custrecord_hris_actual_woking_hours,0) " +
                        "        ELSE NULL END) AS weekhours, " +

                        "    SUM(CASE " +
                        "        WHEN emp.custrecord_njt_emp_daily_intatt = 19 " +
                        "        THEN NVL(emp.custrecord_hris_actual_woking_hours,0) " +
                        "        ELSE NULL END) AS holidayhours, " +

                        "    SUM(CASE " +
                        "        WHEN NVL(emp.custrecord_hris_actual_woking_hours,0) > 10 " +
                        "        THEN NVL(emp.custrecord_hris_actual_woking_hours,0) " +
                        "             - NVL(emp.custrecord_njt_emp_daily_working_hours,0) " +
                        "        ELSE 0 END) AS rot_hours, " +

                        "    SUM(CASE " +
                        "        WHEN emp.custrecord_njt_emp_daily_intatt IN (12,15) THEN 0.5 " +
                        "        WHEN emp.custrecord_njt_emp_daily_intatt NOT IN (17,16,10,1,12,15,9) THEN 1 " +
                        "        ELSE 0 END) AS present_count, " +

                        "    SUM(CASE " +
                        "        WHEN emp.custrecord_njt_emp_daily_intatt IN (17,16,10,1) THEN 1 " +
                        "        WHEN emp.custrecord_njt_emp_daily_intatt IN (12,15) THEN 0.5 " +
                        "        ELSE 0 END) AS absent_count, " +
                        "    SUM(CASE WHEN NVL(emp.custrecord_njt_emp_daily_working_hours, 0) = 0 THEN 0 ELSE NVL(emp.custrecord_njt_ot_hours, 0) / emp.custrecord_njt_emp_daily_working_hours END) AS comp_off " +

                        "FROM customrecord_njt_emp_daily_atten_ch emp " +

                        "JOIN customrecord_njt_emp_daily_attendance a " +
                        "    ON a.id = emp.custrecord_njt_emp_daily_parent " +

                        "JOIN employee c " +
                        "    ON a.custrecord_njt_emp_atten_employee = c.id " +

                        "WHERE " +//emp.custrecord_njt_daily_atten_emp = 9 " +
                        " a.custrecord_njt_emp_atten_month =  " + monthField + " " +
                        "AND a.custrecord_njt_emp_atten_year = " + yearField + " " +
                        "and c.subsidiary= " + subsidiaryfield + " and c.custentity_hris_empdlocation_new = " + locationField + " " +
                        "GROUP BY " +
                        "    emp.custrecord_njt_daily_atten_emp, " +
                        "    a.custrecord_njt_emp_atten_month, " +
                        "    a.custrecord_njt_emp_atten_year, " +
                        "    c.subsidiary, " +
                        "    c.custentity_hris_empdlocation_new";

                }
                else {


                    var sql =
                        "SELECT " +
                        "    emp.custrecord_njt_daily_atten_emp AS employee_id, " +
                        "    a.custrecord_njt_emp_atten_month AS month, " +
                        "    a.custrecord_njt_emp_atten_year AS year, " +
                        "    c.subsidiary, " +
                        "    c.custentity_hris_empdlocation_new, " +

                        "    SUM(CASE " +
                        "        WHEN emp.custrecord_njt_emp_daily_intatt IS NOT NULL " +
                        "         AND emp.custrecord_njt_emp_daily_intatt NOT IN (9, 21) " +
                        "        THEN NVL(emp.custrecord_njt_emp_daily_working_hours,0) " +
                        "        ELSE NULL END) AS emp_daily_working_hours, " +

                        "    SUM(CASE " +
                        "        WHEN emp.custrecord_njt_emp_daily_intatt = 21 " +
                        "        THEN NVL(emp.custrecord_hris_actual_woking_hours,0) " +
                        "        ELSE NULL END) AS weekhours, " +

                        "    SUM(CASE " +
                        "        WHEN emp.custrecord_njt_emp_daily_intatt = 19 " +
                        "        THEN NVL(emp.custrecord_hris_actual_woking_hours,0) " +
                        "        ELSE NULL END) AS holidayhours, " +

                        "    SUM(CASE " +
                        "        WHEN NVL(emp.custrecord_hris_actual_woking_hours,0) > 10 " +
                        "        THEN NVL(emp.custrecord_hris_actual_woking_hours,0) " +
                        "             - NVL(emp.custrecord_njt_emp_daily_working_hours,0) " +
                        "        ELSE NULL END) AS rot_hours, " +

                        "    SUM(CASE " +
                        "        WHEN emp.custrecord_njt_emp_daily_intatt IN (12,15) THEN 0.5 " +
                        "        WHEN emp.custrecord_njt_emp_daily_intatt NOT IN (17,16,10,1,12,15,9) THEN 1 " +
                        "        ELSE 0 END) AS present_count, " +

                        "    SUM(CASE " +
                        "        WHEN emp.custrecord_njt_emp_daily_intatt IN (17,16,10,1) THEN 1 " +
                        "        WHEN emp.custrecord_njt_emp_daily_intatt IN (12,15) THEN 0.5 " +
                        "        ELSE 0 END) AS absent_count, " +
                        "    SUM(CASE WHEN NVL(emp.custrecord_njt_emp_daily_working_hours, 0) = 0 THEN 0 ELSE NVL(emp.custrecord_njt_ot_hours, 0) / emp.custrecord_njt_emp_daily_working_hours END) AS comp_off " +

                        "FROM customrecord_njt_emp_daily_atten_ch emp " +

                        "JOIN customrecord_njt_emp_daily_attendance a " +
                        "    ON a.id = emp.custrecord_njt_emp_daily_parent " +

                        "JOIN employee c " +
                        "    ON a.custrecord_njt_emp_atten_employee = c.id " +

                        "WHERE " +//emp.custrecord_njt_daily_atten_emp = 9 " +
                        " a.custrecord_njt_emp_atten_month =  " + monthField + " " +
                        "AND a.custrecord_njt_emp_atten_year = " + yearField + " " +
                        "and c.subsidiary= " + subsidiaryfield + " " +
                        "GROUP BY " +
                        "    emp.custrecord_njt_daily_atten_emp, " +
                        "    a.custrecord_njt_emp_atten_month, " +
                        "    a.custrecord_njt_emp_atten_year, " +
                        "    c.subsidiary, " +
                        "    c.custentity_hris_empdlocation_new";

                }
                log.debug("Generated SQL Query", sql);
                var senderid = -5;
                var Sendemail = Email.send({
                    author: senderid,
                    recipients: 'florence@nijatech.com',
                    subject: 'Employee Regular  Present and OT  List',
                    body: JSON.stringify(sql),
                    isInternalOnly: true
                });

                // Run the SuiteQL query
                var queryResult = query.runSuiteQL({ query: sql });
                var tsResult = queryResult.asMappedResults();
                // log.debug("tsResult", tsResult);
                //log.debug("tsResult length", tsResult.length);

                // Loop through the results and set sublist values
                for (var i = 0; i < tsResult.length; i++) {
                    var rec = tsResult[i];

                    var empid = rec.employee_id || "";
                    log.audit('empid', empid)
                    var empname = rec.emp_name;
                    var empCode = rec.emp_code;
                    //   var project = rec.project;
                    //  var projectSeg = rec.project_site;
                    var internalAttendanceType = rec.present_count || 0; // Default to 0 if PresentCount is null
                    var absentCount = rec.absent_count || 0;
                    var weeklyOTHours = rec.weekhours || 0;
                    var holiOt = rec.holidayhours || 0;
                    var rotOt = rec.rot_hours || 0;
                    var compOff = rec.comp_off || 0;
                    var compOffRound = Math.round(compOff);




                    try {

                        sublist.setSublistValue({
                            id: "custpage_de_empid",
                            line: i,
                            value: empid || "",
                            ignoreFieldChange: true,
                        });
                        sublist.setSublistValue({
                            id: "custpage_de_empintid",
                            line: i,
                            value: empid || "",
                            ignoreFieldChange: true,
                        });
                        /*  sublist.setSublistValue({
                             id: "custpage_de_name",
                             line: i,
                             value: empname,
                             ignoreFieldChange: true,
                         });
                         sublist.setSublistValue({
                             id: "custpage_de_empidcode",
                             line: i,
                             value: empCode,
                             ignoreFieldChange: true,
                         }); */
                        /*  sublist.setSublistValue({
                             id: "custpage_project_code",
                             line: loop,
                             value: project,
                             ignoreFieldChange: true,
                         });
                         sublist.setSublistValue({
                             id: "custpage_site",
                             line: loop,
                             value: projectSeg,
                             ignoreFieldChange: true,
                         }); */
                        sublist.setSublistValue({
                            id: "custpage_noofpresent",
                            line: i,
                            value: internalAttendanceType.toString(),
                            ignoreFieldChange: true,
                        });

                        sublist.setSublistValue({
                            id: "custpage_noofabsent",
                            line: i,
                            value: absentCount.toString(),
                            ignoreFieldChange: true,
                        });
                        // sublist.setSublistValue({
                        //     id: "custpage_weeklyot",
                        //     line: i,
                        //     value: weeklyOTHours.toString(),
                        //     ignoreFieldChange: true,
                        // });
                        // sublist.setSublistValue({
                        //     id: "custpage_holiot",
                        //     line: i,
                        //     value: holiOt.toString(),
                        //     ignoreFieldChange: true,
                        // });
                        sublist.setSublistValue({
                            id: "custpage_rothours",
                            line: i,
                            value: rotOt.toString(),
                            ignoreFieldChange: true,
                        });
                        sublist.setSublistValue({
                            id: "custpage_compoff",
                            line: i,
                            value: compOff.toFixed(2),
                            ignoreFieldChange: true,
                        });
                        sublist.setSublistValue({
                            id: "custpage_compoffround",
                            line: i,
                            value: compOffRound.toString(),
                            ignoreFieldChange: true,
                        });
                        /*  sublist.setSublistValue({
                             id: "custpage_parid",
                             line: i,
                             value: parId,
                             ignoreFieldChange: true,
                         }); */
                        count = count + 1

                    } catch (e) {
                        log.error("Error setting sublist value at line " + i, e);
                    }
                }


            } catch (error) {
                log.error("Error in setSublistvalue function", error);
            }
            return count;
        }

        function mainsetSublistvalue(sublist, query, monthFied, yearField, subsidiaryfield, WStartDate, WEndDate, Email, locationField, roleId, userId) {
            var resultArray = [];
            try {

                if (roleId == 1294 || roleId == 3) {
                    var dailysetsqlquery = "SELECT " +
                        "A.id AS parent_id, " +
                        "A.custrecord_njt_emp_atten_employee AS employeeid " +
                        "FROM " +
                        "CUSTOMRECORD_NJT_EMP_DAILY_ATTENDANCE A " +
                        "LEFT JOIN " +
                        "CUSTOMRECORD_NJT_EMP_DAILY_ATTEN_CH B ON B.custrecord_njt_emp_daily_parent = A.id " +
                        "JOIN " +
                        "employee C ON A.custrecord_njt_emp_atten_employee = C.id " +
                        "WHERE " +
                        "A.custrecord_njt_emp_atten_month = '" + monthFied + "' " +
                        "AND A.custrecord_njt_emp_atten_year = '" + yearField + "' " +
                        " AND C.subsidiary = '" + subsidiaryfield + "'and C.custentity_hris_empdlocation_new =" + locationField + "" +
                        "AND A.custrecord_hris_regmonthlyatten_process = 'F' " +
                        "GROUP BY " +
                        "A.id, " +
                        "A.custrecord_njt_emp_atten_employee " +
                        "ORDER BY " +
                        "A.custrecord_njt_emp_atten_employee";
                }
                else {

                    var dailysetsqlquery = "SELECT " +
                        "A.id AS parent_id, " +
                        "A.custrecord_njt_emp_atten_employee AS employeeid " +
                        "FROM " +
                        "CUSTOMRECORD_NJT_EMP_DAILY_ATTENDANCE A " +
                        "LEFT JOIN " +
                        "CUSTOMRECORD_NJT_EMP_DAILY_ATTEN_CH B ON B.custrecord_njt_emp_daily_parent = A.id " +
                        "JOIN " +
                        "employee C ON A.custrecord_njt_emp_atten_employee = C.id " +
                        "WHERE " +
                        "A.custrecord_njt_emp_atten_month = '" + monthFied + "' " +
                        "AND A.custrecord_njt_emp_atten_year = '" + yearField + "' " +
                        " AND C.subsidiary = '" + subsidiaryfield + "'and C.custentity_hris_empdlocation_new =" + locationField + "" +
                        "AND A.custrecord_hris_regmonthlyatten_process = 'F' AND C.custentity_hris_emplinemanger =" + userId + "" +
                        "GROUP BY " +
                        "A.id, " +
                        "A.custrecord_njt_emp_atten_employee " +
                        "ORDER BY " +
                        "A.custrecord_njt_emp_atten_employee";
                }

                log.debug("dailysetsqlquery", dailysetsqlquery);

                // Run the SuiteQL query
                var queryResult = query.runSuiteQL({ query: dailysetsqlquery });
                var dailysetsqlquerytsResult = queryResult.asMappedResults();
                //log.debug("dailysetsqlquerytsResult", dailysetsqlquerytsResult);
                // log.debug("dailysetsqlquerytsResult length", dailysetsqlquerytsResult.length);

                // Loop through the results and set sublist values
                for (var i = 0; i < dailysetsqlquerytsResult.length; i++) {
                    var dailyrec = dailysetsqlquerytsResult[i];
                    var dailyempid = dailyrec.employeeid || "";
                    var parId = dailyrec.parent_id;


                    resultArray.push({
                        'dailyempid': dailyempid,
                        'parId': parId,

                    })
                }
                log.debug('Result Array', resultArray);
                var senderid = -5;
                var Sendemail = Email.send({
                    author: senderid,
                    recipients: 'florence@nijatech.com',
                    subject: 'Employee Regular List',
                    body: JSON.stringify(resultArray),
                    isInternalOnly: true
                });



            } catch (error) {
                log.error("Error in setSublistvalue function", error);
            }
            return resultArray;
        }
        function getdate(Next_WageMonth, yearTxt) {
            var date_format = checkDateFormat();
            log.debug('date_format', date_format);

            if (Next_WageMonth == 1) {
                var EndNext_WageMonth = parseInt(Next_WageMonth);
                var EndyearTxt = parseInt(yearTxt);
                Next_WageMonth = 12;
                yearTxt = parseInt(yearTxt) - 1;
            }
            else {
                var EndNext_WageMonth = parseInt(Next_WageMonth);
                var EndyearTxt = yearTxt;
                Next_WageMonth = Next_WageMonth - 1;
            }


            if (date_format == 'YYYY-MM-DD') {
                var start_date = yearTxt + "-" + Next_WageMonth + "-" + 21

                var End_date = EndyearTxt + "-" + EndNext_WageMonth + "-" + 20
            }
            if (date_format == 'DD/MM/YYYY') {
                var start_date = 21 + "/" + Next_WageMonth + "/" + yearTxt
                var End_date = 20 + "/" + EndNext_WageMonth + "/" + EndyearTxt


            }
            if (date_format == 'MM/DD/YYYY' || date_format == 'M/D/YYYY') {
                var start_date = Next_WageMonth + "/" + 21 + "/" + yearTxt
                var End_date = EndNext_WageMonth + "/" + 20 + "/" + EndyearTxt


            }

            if (date_format == 'DD-MM-YYYY') {
                var start_date = 21 + "-" + Next_WageMonth + "-" + yearTxt
                var End_date = 20 + "-" + EndNext_WageMonth + "-" + EndyearTxt


            }

            if (date_format == 'DD-Mon-YYYY') {
                var start_date = 21 + "-" + Next_WageMonth + "-" + yearTxt
                var End_date = 20 + "-" + EndNext_WageMonth + "-" + EndyearTxt

            }

            if (date_format == 'DD.MM.YYYY') {
                var start_date = 21 + "." + Next_WageMonth + "." + yearTxt
                var End_date = 21 + "." + EndNext_WageMonth + "." + EndyearTxt

            }
            if (date_format == 'DD-Month-YYYY') {
                var start_date = 21 + "-" + Next_WageMonth + "-" + yearTxt
                var End_date = 20 + "-" + Next_WageMonth + "-" + EndyearTxt

            }
            if (date_format == 'YYYY/MM/DD') {
                var start_date = yearTxt + "/" + Next_WageMonth + "/" + 21
                var End_date = EndyearTxt + "/" + EndNext_WageMonth + "/" + 20

            }

            if (date_format == 'D/M/YYYY') {
                var start_date = 21 + "/" + Next_WageMonth + "/" + yearTxt;
                var End_date = 20 + "/" + EndNext_WageMonth + "/" + EndyearTxt;

            }
            if (date_format == 'D-Mon-YYYY') {
                var start_date = 21 + "-" + Next_WageMonth + "-" + yearTxt;
                var End_date = 20 + "-" + EndNext_WageMonth + "-" + EndyearTxt;

            }
            if (date_format == 'D.M.YYYY') {
                var start_date = 21 + "." + Next_WageMonth + "." + yearTxt;
                var End_date = 20 + "." + EndNext_WageMonth + "." + EndyearTxt;

            }
            if (date_format == 'YYYY/M/D') {
                var start_date = yearTxt + "/" + Next_WageMonth + "/" + 21;
                var End_date = EndyearTxt + "/" + EndNext_WageMonth + "/" + 20;

            }
            if (date_format == 'YYYY-M-D') {
                var start_date = yearTxt + "-" + Next_WageMonth + "-" + 21;
                var End_date = EndyearTxt + "-" + EndNext_WageMonth + "-" + 21;

            }

            log.debug('start_date', start_date);
            log.debug('End_date', End_date);


            return start_date + "#" + End_date;

        }
        function checkDateFormat() {
            var dateFormatPref = runtime.getCurrentUser().getPreference({
                name: 'dateformat'
            });
            return dateFormatPref;
        }



        return {
            onRequest: onRequest,
        };
    });
