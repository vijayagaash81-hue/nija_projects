/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
var Email;
define(["N/ui/serverWidget", "N/search", "N/log", "N/task", "N/redirect", "N/record", "N/runtime", "N/format", "N/query", "N/currentRecord", "N/https", "N/url",'N/email'],
    function (serverWidget, search,log, task, redirect, record, runtime, format, query, currentRecord, https, url,email) {
        Email=email;



        function onRequest(context) {
            var sublistValues = context.request.parameters;
           log.debug("sublistValues", sublistValues);

 var currentUser = runtime.getCurrentUser();

        var roleId   = currentUser.role;      // Role internal ID
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
          
           /*    var locationfield=form.addField({
                id: "custpage_location",
            type: serverWidget.FieldType.SELECT,
            label: "Location",
            source: "customrecord_cseg_hris_emploc",
        });
         locationfield.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            }); */
                var employee = form.addField({
                id: "custpage_employee",
            type: serverWidget.FieldType.SELECT,
            label: "Employee",
            source: "employee",
        });
        employee.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
       
             var employeecount = form.addField({
                id: 'custpage_count',
                type: serverWidget.FieldType.INTEGER,
                label: 'COUNT',
                //container: 'status'
            });
            employeecount.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
            });
             var processgroup=form.addField({
                id: "custpage_processgroup",
            type: serverWidget.FieldType.SELECT,
            label: "Pay Group",
            source: "customrecord_hris_process_groupmaster",
        });
        processgroup.updateDisplayType({
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
                 var locationField =context.request.parameters.custparam_location
                 var employee =context.request.parameters.custparam_employee
               log.debug("yearField", yearField);
               log.debug('monthFied',monthFied);
               log.debug('locationField',locationField)
                // var projectField = context.request.parameters.custparam_project;
                // var projectsegField = context.request.parameters.custparam_projectseg;
                var subsidiaryfield = context.request.parameters.custparam_subsi;
               log.debug("subsidiaryfieldcheck", subsidiaryfield);
               var paygroup = context.request.parameters.custparam_paygroup;
               log.debug('paygroup',paygroup);

                if (monthFied) {
                    form.getField({ id: "custpage_month" }).defaultValue = monthFied;
                }
                if (yearField) {
                    form.getField({ id: "custpage_year" }).defaultValue = yearField;

                }
                if(paygroup){
                    form.getField({ id: "custpage_processgroup" }).defaultValue =paygroup
                }
                 if(employee){
                    form.getField({ id: "custpage_employee" }).defaultValue =employee
                }
               
              /*   if (locationField) {
                    form.getField({ id: "custpage_location" }).defaultValue = locationField;

                } */

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
                log.emergency('WStartDate',WStartDate);
                log.emergency('WEndDate',WEndDate);

                if (subsidiaryfield) {
                    form.getField({ id: "custpage_subsi" }).defaultValue = subsidiaryfield;
                }
               log.debug("subsidiaryfieldcheckpart1", subsidiaryfield);

                var sublist = createSublist(form);
                //var dailysetsqlquerytsResult =mainsetSublistvalue(sublist, query, monthFied, yearField, subsidiaryfield,WStartDate,WEndDate,Email,locationField,roleId,userId);
                var setcount = setSublistvalue(sublist, query, monthFied, yearField, subsidiaryfield,paygroup,employee);
                 employeecount.defaultValue=parseInt(setcount);
                context.response.writePage(form);
            } else if (context.request.method === "POST") {
                var monthFied = sublistValues.custpage_month;
                var yearField = sublistValues.custpage_year;
                // var projectField = sublistValues.custpage_project;
                //  var projectsegField = sublistValues.custpage_projectseg;
                var subsidiaryfield = sublistValues.custpage_subsi;
              //  var departmentField = sublistValues.custpage_department;
                var paygroup = sublistValues.custpage_processgroup;

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
              

                var statusMr = context.request.parameters.custpage_mr_status;
                var rowArray = sublistValues.employeesheetdata.split("\u0002");
                var selectArray = [];

                for (var line = 0; line < rowArray.length; line++) {
                    var columnArray = rowArray[line].split("\u0001");
                    log.debug("coulmnArray", columnArray);
                    var selectObj = {};
                    var select = columnArray[0];
                    if (select == 'T') {
                        selectObj.empid = columnArray[2];
                        selectObj.employeeCode = columnArray[3];
                        selectObj.employeeName = columnArray[1];
                     //   selectObj.projectId = columnArray[5]; // Extract internalAtten value
                     //   selectObj.projectSegid = columnArray[6];
                        selectObj.noPresntId = columnArray[7];
                        selectObj.noAbsentId = columnArray[8];
                        selectObj.noweeklyId = columnArray[9];
                        selectObj.noholiId = columnArray[10];
                        selectObj.norotId = columnArray[11];
                        selectObj.intempId = columnArray[12];
                        selectObj.parId = columnArray[13];
                        selectObj.monthFiedid = monthFied;
                        selectObj.yearFiedidid = yearField;
                     //   selectObj.processid = true;
                     //   selectObj.WStartDate=WStartDate;
                     //   selectObj.WEndDate=WEndDate;
                        selectArray.push(selectObj);
                    }
                }
               log.emergency("selectArray", selectArray);
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: "customscript_hris_dailymanmonth_proc_mrs",
                    //deploymentId: "customdeploy_hris_dailymanmonth_proc_mrs",
                    params: {
                        custscript_hris_manual_array: JSON.stringify(selectArray)
                    }
                });
                var mrTaskId = mrTask.submit();
                log.debug("mrTaskId", mrTaskId);

                // Redirect to the second Suitelet with manager and date values as parameters

                    redirect.toSuitelet({
                    scriptId: "customscript_hris_dailymanmonth_statu_sl",
                    deploymentId: "customdeploy_hris_dailymanmonth_statu_sl",
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
               empid.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
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
            var weeklyOt = salesSublist.addField({
                id: "custpage_weeklyot",
                type: serverWidget.FieldType.TEXT,
                label: "Weeklyoff OT Hours",
            });
            /*  weeklyOt.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            }); */
            var holidayOt = salesSublist.addField({
                id: "custpage_holiot",
                type: serverWidget.FieldType.TEXT,
                label: "Holiday OT Hours",
            });
            /*  holidayOt.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            }); */
            var rotHours = salesSublist.addField({
                id: "custpage_rothours",
                type: serverWidget.FieldType.TEXT,
                label: "ROT Hours",
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



            return salesSublist;
        }

        function setSublistvalue(sublist, query, monthField, yearField, subsidiaryfield,paygroup,employee) {
            try {
             
  

                // Loop through the results and set sublist values
                var count =0;
              /*   for (var i = 0; i < dailysetsqlquerytsResult.length; i++) {
                    var dailyrec = dailysetsqlquerytsResult[i];
                     var dailyempid = dailyrec.dailyempid || "";
                     var parId = dailyrec.parId; */

     var sql = '';

if(employee){

sql = "SELECT  " +
"    t.empname, " +
"    t.employee_id, " +
"    t.empcode, " +
"    SUM(t.hoursplanned)                           AS planhours, " +
"    SUM(t.present_count)                          AS present, " +
"    SUM(t.absent_count)                           AS absent, " +
"    SUM(TO_NUMBER(NVL(t.total_actual_working_hours,0)))    AS totalactualworkinghrs, " +
"    SUM(TO_NUMBER(NVL(t.total_emp_daily_working_hours,0))) AS workinghours, " +
"    SUM(TO_NUMBER(NVL(t.total_weekhours,0)))                AS wothours, " +
"    SUM(TO_NUMBER(NVL(t.total_holidayhours,0)))             AS hothours, " +
"    (SUM(TO_NUMBER(NVL(t.total_emp_daily_working_hours,0))) - SUM(t.hoursplanned)) AS rothours " +
"FROM ( " +
"    SELECT " +
"        data.attendance_date, " +
"        data.empname, " +
"        data.employee_id, " +
"        data.intatt, " +
"        data.empcode, " +
"        data.hoursplanned, " +
"        data.present_count, " +
"        data.absent_count, " +
"        SUM(TO_NUMBER(NVL(data.actual_working_hours,0)))      AS total_actual_working_hours, " +
"        SUM(TO_NUMBER(NVL(data.emp_daily_working_hours,0)))   AS total_emp_daily_working_hours, " +
"        SUM(TO_NUMBER(NVL(data.weekhours,0)))                 AS total_weekhours, " +
"        SUM(TO_NUMBER(NVL(data.holidayhours,0)))              AS total_holidayhours " +
"    FROM ( " +
"        SELECT " +
"            emp.custrecord_hris_man_daily_employee          AS employee_id, " +
"            BUILTIN.DF(emp.custrecord_hris_man_daily_employee) AS empname, " +
"            emp.custrecord_hris_man_daily_attendate         AS attendance_date, " +
"            emp.custrecord_hris_emp_atten_status            AS intatt, " +
"            emp.custrecord_hris_daily_hrs_worked            AS actual_working_hours, " +
"            e.custentity_hris_empcode                       AS empcode, " +
"            CASE WHEN emp.custrecord_hris_emp_atten_status NOT IN (17,16,10,1,12,15) THEN 1 " +
"                 WHEN emp.custrecord_hris_emp_atten_status IN (12,15) THEN 0.5 " +
"                 ELSE 0 END                                 AS present_count, " +
"            CASE WHEN emp.custrecord_hris_emp_atten_status IN (17,16,10,1) THEN 1 " +
"                 WHEN emp.custrecord_hris_emp_atten_status IN (12,15) THEN 0.5 " +
"                 ELSE 0 END                                 AS absent_count, " +
"            CASE WHEN emp.custrecord_hris_emp_atten_status = 18 " +
"                 THEN emp.custrecord_hris_man_daily_hrsplanned ELSE 0 END AS hoursplanned, " +
"            CASE WHEN emp.custrecord_hris_emp_atten_status NOT IN (9,21,19) " +
"                 THEN emp.custrecord_hris_daily_hrs_worked ELSE NULL END AS emp_daily_working_hours, " +
"            CASE WHEN emp.custrecord_hris_emp_atten_status = 21 " +
"                 THEN emp.custrecord_hris_daily_hrs_worked ELSE NULL END AS weekhours, " +
"            CASE WHEN emp.custrecord_hris_emp_atten_status = 19 " +
"                 THEN emp.custrecord_hris_daily_hrs_worked ELSE NULL END AS holidayhours " +
"        FROM customrecord_hris_man_dailyattendance emp " +
"        JOIN employee e ON e.id = emp.custrecord_hris_man_daily_employee " +
"        WHERE emp.custrecord_hris_man_daily_employee = " + employee+ " and emp.custrecord_hris_man_daily_subsidiary = "+subsidiaryfield+" and emp.custrecord_hris_man_daily_paygroup = " + paygroup+" " +
"          AND TO_CHAR(emp.custrecord_hris_man_daily_attendate,'MM') = "+ monthField +" " +
"          AND TO_CHAR(emp.custrecord_hris_man_daily_attendate,'YYYY') = ( " +
"              SELECT name FROM customlist_hris_year_master WHERE id = "+ yearField +" " +
"          ) " +
"    ) data " +
"    GROUP BY data.attendance_date, data.empname, data.employee_id, data.intatt, data.empcode, " +
"             data.hoursplanned, data.present_count, data.absent_count " +
") t " +
"GROUP BY t.empname, t.employee_id, t.empcode ";
}

else{

sql = "SELECT  " +
"    t.empname, " +
"    t.employee_id, " +
"    t.empcode, " +
"    SUM(t.hoursplanned)                           AS planhours, " +
"    SUM(t.present_count)                          AS present, " +
"    SUM(t.absent_count)                           AS absent, " +
"    SUM(TO_NUMBER(NVL(t.total_actual_working_hours,0)))    AS totalactualworkinghrs, " +
"    SUM(TO_NUMBER(NVL(t.total_emp_daily_working_hours,0))) AS workinghours, " +
"    SUM(TO_NUMBER(NVL(t.total_weekhours,0)))                AS wothours, " +
"    SUM(TO_NUMBER(NVL(t.total_holidayhours,0)))             AS hothours, " +
"    (SUM(TO_NUMBER(NVL(t.total_emp_daily_working_hours,0))) - SUM(t.hoursplanned)) AS rothours " +
"FROM ( " +
"    SELECT " +
"        data.attendance_date, " +
"        data.empname, " +
"        data.employee_id, " +
"        data.intatt, " +
"        data.empcode, " +
"        data.hoursplanned, " +
"        data.present_count, " +
"        data.absent_count, " +
"        SUM(TO_NUMBER(NVL(data.actual_working_hours,0)))      AS total_actual_working_hours, " +
"        SUM(TO_NUMBER(NVL(data.emp_daily_working_hours,0)))   AS total_emp_daily_working_hours, " +
"        SUM(TO_NUMBER(NVL(data.weekhours,0)))                 AS total_weekhours, " +
"        SUM(TO_NUMBER(NVL(data.holidayhours,0)))              AS total_holidayhours " +
"    FROM ( " +
"        SELECT " +
"            emp.custrecord_hris_man_daily_employee          AS employee_id, " +
"            BUILTIN.DF(emp.custrecord_hris_man_daily_employee) AS empname, " +
"            emp.custrecord_hris_man_daily_attendate         AS attendance_date, " +
"            emp.custrecord_hris_emp_atten_status            AS intatt, " +
"            emp.custrecord_hris_daily_hrs_worked            AS actual_working_hours, " +
"            e.custentity_hris_empcode                       AS empcode, " +
"            CASE WHEN emp.custrecord_hris_emp_atten_status NOT IN (17,16,10,1,12,15) THEN 1 " +
"                 WHEN emp.custrecord_hris_emp_atten_status IN (12,15) THEN 0.5 " +
"                 ELSE 0 END                                 AS present_count, " +
"            CASE WHEN emp.custrecord_hris_emp_atten_status IN (17,16,10,1) THEN 1 " +
"                 WHEN emp.custrecord_hris_emp_atten_status IN (12,15) THEN 0.5 " +
"                 ELSE 0 END                                 AS absent_count, " +
"            CASE WHEN emp.custrecord_hris_emp_atten_status = 18 " +
"                 THEN emp.custrecord_hris_man_daily_hrsplanned ELSE 0 END AS hoursplanned, " +
"            CASE WHEN emp.custrecord_hris_emp_atten_status NOT IN (9,21,19) " +
"                 THEN emp.custrecord_hris_daily_hrs_worked ELSE NULL END AS emp_daily_working_hours, " +
"            CASE WHEN emp.custrecord_hris_emp_atten_status = 21 " +
"                 THEN emp.custrecord_hris_daily_hrs_worked ELSE NULL END AS weekhours, " +
"            CASE WHEN emp.custrecord_hris_emp_atten_status = 19 " +
"                 THEN emp.custrecord_hris_daily_hrs_worked ELSE NULL END AS holidayhours " +
"        FROM customrecord_hris_man_dailyattendance emp " +
"        JOIN employee e ON e.id = emp.custrecord_hris_man_daily_employee " +
"        WHERE emp.custrecord_hris_man_daily_subsidiary = "+subsidiaryfield+" and emp.custrecord_hris_man_daily_paygroup = " + paygroup+" " +
"          AND TO_CHAR(emp.custrecord_hris_man_daily_attendate,'MM') = "+ monthField +" " +
"          AND TO_CHAR(emp.custrecord_hris_man_daily_attendate,'YYYY') = ( " +
"              SELECT name FROM customlist_hris_year_master WHERE id = "+ yearField +" " +
"          ) " +
"    ) data " +
"    GROUP BY data.attendance_date, data.empname, data.employee_id, data.intatt, data.empcode, " +
"             data.hoursplanned, data.present_count, data.absent_count " +
") t " +
"GROUP BY t.empname, t.employee_id, t.empcode ";
}







               log.debug("Generated SQL Query", sql);
                  var senderid =-5;
          var Sendemail = Email.send({
                        author: senderid,
                        recipients: 'florence@nijatech.com',
                        subject: 'Employee Daily Manual  Present and OT  List',
                        body: JSON.stringify(sql),
                        isInternalOnly: true
                    });

                // Run the SuiteQL query
                var queryResult = query.runSuiteQL({ query: sql });
                var tsResult = queryResult.asMappedResults();
           
                      for (var i = 0; i < tsResult.length; i++) {
                    var rec = tsResult[i];

                    var empid = rec.employee_id || "";
                    log.audit('empid',empid)
                    var empname = rec.empname;
                    var empCode = rec.empcode;
                 //   var project = rec.project;
                  //  var projectSeg = rec.project_site;
                    var internalAttendanceType = rec.present || 0; // Default to 0 if PresentCount is null
                    var absentCount = rec.absent || 0;
                   var weeklyOTHours = rec.wothours || 0;
                    var holiOt = rec.hothours || 0;
                    var rotOt = rec.rothours || 0;    
                   



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
                        if(rotOt < 0 && weeklyOTHours !=0 ){
                           var rothours= Math.abs(rotOt);
                            rotOt= parseFloat(weeklyOTHours) -parseFloat(rothours);

                        }
                        if(rotOt < 0 && holiOt !=0){
                            var rothours= Math.abs(rotOt);
                            rotOt= parseFloat(holiOt) -parseFloat(rothours);

                        }
                        if(rotOt<0){
                        rotOt=Math.abs(rotOt);
                        }
                        
                        sublist.setSublistValue({
                            id: "custpage_weeklyot",
                            line: i,
                            value: weeklyOTHours.toString(),
                            ignoreFieldChange: true,
                        });
                        sublist.setSublistValue({
                            id: "custpage_holiot",
                            line: i,
                            value: holiOt.toString(),
                            ignoreFieldChange: true,
                        });
                        sublist.setSublistValue({
                            id: "custpage_rothours",
                            line: i,
                            value: rotOt.toString(),
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
               
           //}
            } catch (error) {
               log.error("Error in setSublistvalue function", error);
            }
            return count;
        }
       
        function mainsetSublistvalue(sublist, query, monthFied, yearField, subsidiaryfield,WStartDate,WEndDate,Email,locationField,roleId,userId) {
          var resultArray=[];
            try {

if(roleId==1294 || roleId ==3){               
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
    " AND C.subsidiary = '" + subsidiaryfield + "'and C.custentity_hris_empdlocation_new ="+locationField+""+
    "AND A.custrecord_hris_regmonthlyatten_process = 'F' "+
"GROUP BY " +
    "A.id, " +
    "A.custrecord_njt_emp_atten_employee " +   
"ORDER BY " +
    "A.custrecord_njt_emp_atten_employee";
}
else{

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
    " AND C.subsidiary = '" + subsidiaryfield + "'and C.custentity_hris_empdlocation_new ="+locationField+""+
    "AND A.custrecord_hris_regmonthlyatten_process = 'F' AND C.custentity_hris_emplinemanger ="+userId+""+
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
             var senderid =-5;
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
            log.debug( 'date_format', date_format);

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
