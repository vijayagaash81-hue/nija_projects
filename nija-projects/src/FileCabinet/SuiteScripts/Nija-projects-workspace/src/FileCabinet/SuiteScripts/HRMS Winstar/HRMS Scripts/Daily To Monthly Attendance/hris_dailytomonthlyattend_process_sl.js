/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(["N/ui/serverWidget", "N/search", "N/log", "N/task", "N/redirect", "N/record", "N/runtime", "N/format", "N/query", "N/currentRecord", "N/https", "N/url"],
    function (serverWidget, searchModule, logModule, taskModule, redirectModule, recordModule, runtimeModule, format, query, currentRecord, https, urlMod) {
        var monthMapping = {
            '1': 'January',
            '2': 'February',
            '3': 'March',
            '4': 'April',
            '5': 'May',
            '6': 'June',
            '7': 'July',
            '8': 'August',
            '9': 'September',
            '10': 'October',
            '11': 'November',
            '12': 'December',
        };
      var yearMapping = {
        '1': '2019',
        '2': '2020',
        '3': '2021',
        '4': '2022',
        '5': '2023',
        '6': '2024',
        '7': '2025',
        '8': '2026',
    };

        // Function to add a leading zero to single-digit numbers
        function padZero(num) {
            return (num < 10 ? '0' : '') + num;
        }

        // Function to get the abbreviated day name from day index
        function getDayName(dayIndex) {
            switch (dayIndex) {
                case 0: return 'Sun';
                case 1: return 'Mon';
                case 2: return 'Tue';
                case 3: return 'Wed';
                case 4: return 'Thu';
                case 5: return 'Fri';
                case 6: return 'Sat';
                default: return '';
            }
        }
        function onRequest(context) {
            var sublistValues = context.request.parameters;
            logModule.debug("sublistValues", sublistValues);


// Create a form
var form = serverWidget.createForm({
    title: "Employee Monthly attendance",
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
            var subsidiaryfield=form.addField({
                id: "custpage_subsi",
            type: serverWidget.FieldType.SELECT,
            label: "Subsidairy",
            source: "subsidiary",
        });
        subsidiaryfield.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });
           var mrStatus = form.addField({
                id: 'custpage_mr_status',
                type: serverWidget.FieldType.SELECT,
                label: 'MRS Status Field',
                //container: 'status'
            });
            mrStatus.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
            });
        
            form.addSubmitButton({
                label: "Submit",
            });
           // Set client script module path
             form.clientScriptModulePath = "./monthly attendance create cl.js";


            if (context.request.method === "GET") {
               var statusMr = 1
                log.debug("statusMr", statusMr);
                var monthFied = context.request.parameters.custparam_month;
                var yearField = context.request.parameters.custparam_year;
                logModule.debug("yearField", yearField);
                // var projectField = context.request.parameters.custparam_project;
                // var projectsegField = context.request.parameters.custparam_projectseg;
                 var subsidiaryfield = context.request.parameters.custparam_subsi;
                 logModule.debug("subsidiaryfieldcheck", subsidiaryfield);

                if (monthFied) {
                    form.getField({ id: "custpage_month" }).defaultValue = monthFied;
                }
                if (yearField) {
                    form.getField({ id: "custpage_year" }).defaultValue = yearField;
                }
                // if (projectField) {
                //     form.getField({ id: "custpage_project" }).defaultValue = projectField;
                // }
                // if (projectsegField) {
                //     form.getField({ id: "custpage_projectseg" }).defaultValue = projectsegField;
                // }
               if (subsidiaryfield) {
                    form.getField({ id: "custpage_subsi" }).defaultValue = subsidiaryfield;
                }
                logModule.debug("subsidiaryfieldcheckpart1", subsidiaryfield);

                var sublist = createSublist(form);
                setSublistvalue(sublist, query, monthFied, yearField, subsidiaryfield);
                context.response.writePage(form);
            } else if (context.request.method === "POST") {
                var monthFied = sublistValues.custpage_month;
                var yearField = sublistValues.custpage_year;
                // var projectField = sublistValues.custpage_project;
                //  var projectsegField = sublistValues.custpage_projectseg;
                 var subsidiaryfield=sublistValues.custpage_subsi

                logModule.debug("monthFied", monthFied);
                logModule.debug("yearField", yearField);
                //logModule.debug("vendorValue", vendorValue);
var statusQuery = "select custrecord_hris_mr_sts,BUILTIN.DF(custrecord_hris_mr_sts)as name from customrecord_hris_mr_status_bar_rec where id=13";
                var queryResults = query.runSuiteQL({
                    query: statusQuery
                });
                var records = queryResults.asMappedResults();

                if (records.length > 0) {
                    for (var r = 0; r < records.length; r++) {
                        var record = records[r];
                        var name = record.name;
                        var id = record.custrecord_hris_mr_sts; // Assuming 'id' is the value you want to set

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
                    log.debug("coulmnArray",columnArray);
                    var selectObj = {};
                    var select = columnArray[0];
                     if (select == 'T') {
                        selectObj.empid = columnArray[2];
                        selectObj.employeeCode = columnArray[3];
                        selectObj.employeeName = columnArray[1];
                        selectObj.projectId = columnArray[5]; // Extract internalAtten value
                        selectObj.projectSegid = columnArray[6];
                        selectObj.noPresntId = columnArray[7];
                        selectObj.noAbsentId =columnArray[8];
                        selectObj.noweeklyId =columnArray[9];
                        selectObj.noholiId =columnArray[10];
                        selectObj.norotId =columnArray[11];
                        selectObj.intempId =columnArray[12];
                       selectObj.parId =columnArray[13];
                        selectObj.monthFiedid = monthFied;
                        selectObj.yearFiedidid = yearField;
                        selectObj.processid = true;
                        selectArray.push(selectObj);
                    }
                }
                logModule.debug("selectArray", selectArray);
                var mrTask = taskModule.create({
                    taskType: taskModule.TaskType.MAP_REDUCE,
                    scriptId: "customscript_njt_monthly_atten_rec_creat",
                    deploymentId: "customdeploy_njt_monthly_atten_rec_creat",
                    params: {
                        custscript_njt_column_array_selectm: JSON.stringify(selectArray)
                    }
                });
                var mrTaskId = mrTask.submit();
                log.debug("mrTaskId", mrTaskId);

                // Redirect to the second Suitelet with manager and date values as parameters
                redirectModule.toSuitelet({
                    scriptId: 'customscript_njt_monthly_atten_fliter',
                    deploymentId: 'customdeploy_njt_monthly_atten_fliter',
                });

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
                source:"employee"
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
             Noofpresent.updateDisplayType({
    displayType: serverWidget.FieldDisplayType.HIDDEN
});
            var noofabsent=salesSublist.addField({
                id: "custpage_noofabsent",
                type: serverWidget.FieldType.TEXT,
                label: "No Of Absent",
            }); 
            noofabsent.updateDisplayType({
    displayType: serverWidget.FieldDisplayType.HIDDEN
});
            var weeklyOt=salesSublist.addField({
                id: "custpage_weeklyot",
                type: serverWidget.FieldType.TEXT,
                label: "Weeklyoff OT Hours",
            });
            var holidayOt=salesSublist.addField({
                id: "custpage_holiot",
                type: serverWidget.FieldType.TEXT,
                label: "Holiday OT Hours",
            });
            var rotHours=salesSublist.addField({
                id: "custpage_rothours",
                type: serverWidget.FieldType.TEXT,
                label: "ROT Hours",
            });
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

         function setSublistvalue(sublist, query, monthField, yearField, subsidiaryfield) {
            try {
  
   


    var setsqlquery ="SELECT A.id AS parent_id, \
    A.custrecord_njt_emp_atten_employee AS employeeid, C.entityid AS emp_name, \
    C.custentity_hris_empcode AS emp_code, \
    B.custrecord_njt_emp_daily_project AS project, \
    B.custrecord_njt_hr_project_site AS project_site, \
    SUM(CASE WHEN B.custrecord_njt_emp_daily_intatt = 18 THEN 1 ELSE 0 END) AS present_count, \
    SUM(CASE WHEN B.custrecord_njt_emp_daily_intatt = 2 THEN 1 ELSE 0 END) AS absent_count, \
    D.custrecord_hris_weeklyoff_month AS weeklyoff_month, \
    D.custrecord_hris_weekly_otyear AS weeklyoff_year, \
    D.custrecord_hris_emp_wee_off_employee AS weeklyoff_employee,\
	(select SUM(custrecord_hris_emp_atten_rot) from customrecord_hris_emp_attendance_weeklyo where custrecord_hris_weeklyoff_month ='" + monthField + "'  \
	and custrecord_hris_weekly_otyear = '" + yearField + "' and custrecord_hris_emp_wee_off_employee = A.custrecord_njt_emp_atten_employee) as rot_ot, \
(select SUM(custrecord_hris_employee_wot) from customrecord_hris_emp_attendance_weeklyo where custrecord_hris_weeklyoff_month ='" + monthField + "'  \
	and custrecord_hris_weekly_otyear = '" + yearField + "' and custrecord_hris_emp_wee_off_employee = A.custrecord_njt_emp_atten_employee) as weekly_ot, \
(select SUM(custrecord_hris_employee_attenda_rot) from customrecord_hris_emp_attendance_weeklyo where custrecord_hris_weeklyoff_month ='" + monthField + "'  \
	and custrecord_hris_weekly_otyear = '" + yearField + "' and custrecord_hris_emp_wee_off_employee = A.custrecord_njt_emp_atten_employee) as holi_ot \
FROM \
    CUSTOMRECORD_NJT_EMP_DAILY_ATTENDANCE A  \
    LEFT JOIN CUSTOMRECORD_NJT_EMP_DAILY_ATTEN_CH B  \
        ON B.custrecord_njt_emp_daily_parent = A.id \
    JOIN employee C \
        ON A.custrecord_njt_emp_atten_employee = C.id \
    LEFT JOIN customrecord_hris_emp_attendance_weeklyo D \
        ON A.custrecord_njt_emp_atten_employee = D.custrecord_hris_emp_wee_off_employee \
        AND A.custrecord_njt_emp_atten_month = D.custrecord_hris_weeklyoff_month \
        AND A.custrecord_njt_emp_atten_year = D.custrecord_hris_weekly_otyear \
WHERE \
    A.custrecord_njt_emp_atten_month = '" + monthField + "'  \
    AND A.custrecord_njt_emp_atten_year = '" + yearField + "' \
    AND C.subsidiary = '" + subsidiaryfield + "' \
    AND A.custrecord_njt_monthly_atten_process = 'F' \
GROUP BY \
    A.id,  \
    A.custrecord_njt_emp_atten_employee, \
    C.entityid, \
    C.subsidiary, \
    C.custentity_hris_empcode,\
    B.custrecord_njt_emp_daily_project, \
    B.custrecord_njt_hr_project_site, \
    D.custrecord_hris_weeklyoff_month, \
    D.custrecord_hris_weekly_otyear, \
    D.custrecord_hris_emp_wee_off_employee \
ORDER BY \
    A.custrecord_njt_emp_atten_employee";
       var sql = '';
                    sql += 'WITH AttendanceData AS ( ';
                    sql += '    SELECT ';
                    sql += '        emp.custrecord_njt_emp_daily_date AS attendance_date, ';
                    sql += '        emp.custrecord_njt_emp_daily_intatt AS intatt, ';
                    sql += '        emp.custrecord_njt_emp_daily_working_hours AS emp_daily_working_hours, ';
                    sql += '        emp.custrecord_hris_actual_woking_hours AS actual_working_hours,emp.custrecord_hris_daily_otcalc_weekday AS otcalc, ';
                    sql += '        CASE WHEN emp.custrecord_njt_emp_daily_intatt = 21 THEN emp.custrecord_hris_actual_woking_hours ELSE NULL END AS weekhours, ';
                    sql += '        CASE WHEN emp.custrecord_njt_emp_daily_intatt = 19 THEN emp.custrecord_hris_actual_woking_hours ELSE NULL END AS holidayhours, ';
                    sql += '        CASE WHEN emp.custrecord_njt_emp_daily_intatt = 21 AND emp.custrecord_hris_daily_otcalc_weekday = \'T\' THEN 1 ELSE 0 END AS is_weekly_off ';
                    sql += '    FROM customrecord_njt_emp_daily_atten_ch emp ';
                    sql += '    WHERE emp.custrecord_njt_daily_atten_emp = ' + employeeId + ' ';
                    sql += '        AND EXTRACT(MONTH FROM emp.custrecord_njt_emp_daily_date) = ' + month + ' ';
                    sql += '        AND EXTRACT(YEAR FROM emp.custrecord_njt_emp_daily_date) = (SELECT name FROM customlist_hris_year_master WHERE id = ' + yearId + ') ';
                    sql += '        AND (emp.custrecord_njt_emp_daily_intatt IN (18, 19, 21) OR emp.custrecord_njt_emp_daily_intatt IS NULL) ';
                    sql += '), ';
                    sql += 'WeeklyOffMarkers AS ( ';
                    sql += '    SELECT ';
                    sql += '        attendance_date, ';
                    sql += '        is_weekly_off,otcalc, ';
                    sql += '        CASE ';
                    sql += '            WHEN is_weekly_off = 1 AND ';
                    sql += '                 (LAG(is_weekly_off, 1, 0) OVER (ORDER BY attendance_date) = 0) ';
                    sql += '            THEN 1 ';
                    sql += '            ELSE 0 ';
                    sql += '        END AS new_week_marker ';
                    sql += '    FROM AttendanceData ';
                    sql += '), ';
                    sql += 'WeekGroups AS ( ';
                    sql += '    SELECT ';
                    sql += '        attendance_date,otcalc, ';
                    sql += '        SUM(new_week_marker) OVER (ORDER BY attendance_date) AS week_group ';
                    sql += '    FROM WeeklyOffMarkers ';
                    sql += '), ';
                    sql += 'DateRanges AS ( ';
                    sql += '    SELECT ';
                    sql += '        a.attendance_date,a.otcalc, ';
                    sql += '        a.intatt, ';
                    sql += '        a.emp_daily_working_hours, ';
                    sql += '        a.actual_working_hours, ';
                    sql += '        a.weekhours, ';
                    sql += '        a.holidayhours, ';
                    sql += '        a.is_weekly_off, ';
                    sql += '        w.week_group ';
                    sql += '    FROM AttendanceData a ';
                    sql += '    JOIN WeekGroups w ON a.attendance_date = w.attendance_date ';
                    sql += '), ';
                    sql += 'WeekAggregates AS ( ';
                    sql += '    SELECT ';
                    sql += '        week_group, ';
                    sql += '        MIN(attendance_date) AS start_date, ';
                    sql += '        MAX(attendance_date) AS end_date, ';
                    sql += '        LISTAGG( ';
                    sql += '            CASE WHEN intatt = 21 and otcalc=\'T\'   THEN TO_CHAR(attendance_date, \'DD/MM/YYYY\') ELSE NULL END, ';
                    sql += '            \', \' ';
                    sql += '        ) WITHIN GROUP (ORDER BY attendance_date) AS weeklyoff_dates, ';
                    sql += '        LISTAGG( ';
                    sql += '            CASE WHEN intatt = 21 and otcalc=\'T\'  THEN TRIM(TO_CHAR(attendance_date, \'Day\')) ELSE NULL END, ';
                    sql += '            \', \' ';
                    sql += '        ) WITHIN GROUP (ORDER BY attendance_date) AS weeklyoff_days, ';
                    sql += '        SUM(actual_working_hours) AS total_actual_hours, ';
                    sql += '        SUM(weekhours) AS weekhours, ';
                    sql += '        SUM(holidayhours) AS holidayhours, ';
                    sql += '        SUM(emp_daily_working_hours) AS total_weekly_hours, ';
                    sql += '        COUNT(DISTINCT CASE WHEN intatt = 21 and otcalc=\'T\'  THEN attendance_date END) AS weekly_off_count,MAX(otcalc) AS otcalc ';
                    sql += '    FROM DateRanges ';
                    sql += '    GROUP BY week_group ';
                    sql += ') ';
                    sql += 'SELECT ';
                    sql += '    start_date, ';
                    sql += '    end_date, ';
                    sql += '    (total_actual_hours - NVL(weekhours, 0) - NVL(holidayhours, 0)) AS actual_working_hours, ';
                    sql += '    NVL(weekhours, 0) AS weekhours, ';
                    sql += '    NVL(holidayhours, 0) AS holidayhours, ';
                    sql += '    (NVL(total_actual_hours, 0) - NVL(weekhours, 0) - NVL(holidayhours, 0))-NVL(total_weekly_hours, 0) AS rot_hours, ';
                    sql += '    NVL(total_weekly_hours, 0) AS total_weekly_hours, ';
                    sql += '    week_group + 1 AS week_number, ';
                    sql += '    NVL(weeklyoff_dates, \'None\') AS weeklyoff_dates, ';
                    sql += '    NVL(weeklyoff_days, \'None\') AS weeklyoff_days, ';
                    sql += '    ' + employeeId + ' AS employee_id, ';
                    sql += '    ' + month + ' AS month, ';
                    sql += '    ' + yearId + ' AS year_id ';
                    sql += 'FROM WeekAggregates ';
                    sql += 'ORDER BY week_number';



          //changed query          

  var sql = '';


sql += 'WITH AttendanceData AS ( ';
sql += '    SELECT ';
sql += '        emp.custrecord_njt_emp_daily_date AS attendance_date,';
sql += '        emp.custrecord_njt_emp_daily_intatt AS intatt, ';
sql += '        emp.custrecord_hris_actual_woking_hours AS actual_working_hours,';
sql += '       emp.custrecord_hris_daily_otcalc_weekday AS otcalc, ';
sql += '        CASE ';
sql += '            WHEN emp.custrecord_njt_emp_daily_intatt NOT IN (9, 21) ';
sql += '            THEN emp.custrecord_njt_emp_daily_working_hours ';
sql += '            ELSE NULL ';
sql += '        END AS emp_daily_working_hours, ';
sql += '        CASE ';
sql += '            WHEN emp.custrecord_njt_emp_daily_intatt = 21 ';
sql += '                AND emp.custrecord_njt_emp_daily_date NOT IN ( ';
sql += '                    SELECT custrecord_hris_rcomp_comp_off_from_date ';
sql += '                    FROM customrecord_hris_lve_raise_comp_off co ';
sql += '                    WHERE co.custrecord_hris_rcomp_employee_name = emp.custrecord_njt_daily_atten_emp ';
sql += '                        AND co.custrecord_hris_rcomp_appstatus = 2 ';
sql += '                        AND co.custrecord_hris_rcomp_checked = \'T\' ';
sql += '                ) ';
sql += '            THEN emp.custrecord_hris_actual_woking_hours ';
sql += '            ELSE NULL ';
sql += '       END AS weekhours, ';
sql += '        CASE ';
sql += '            WHEN emp.custrecord_njt_emp_daily_intatt = 19 ';
sql += '                AND emp.custrecord_njt_emp_daily_date NOT IN ( ';
sql += '                    SELECT custrecord_hris_rcomp_comp_off_from_date ';
sql += '                    FROM customrecord_hris_lve_raise_comp_off co ';
sql += '                    WHERE co.custrecord_hris_rcomp_employee_name = emp.custrecord_njt_daily_atten_emp ';
sql += '                        AND co.custrecord_hris_rcomp_appstatus = 2 ';
sql += '                        AND co.custrecord_hris_rcomp_checked = \'T\'';
sql += '                ) ';
sql += '            THEN emp.custrecord_hris_actual_woking_hours ';
sql += '            ELSE NULL ';
sql += '        END AS holidayhours, ';
sql += '        CASE ';
sql += '            WHEN emp.custrecord_njt_emp_daily_intatt = 21 ';
sql += '         AND emp.custrecord_hris_daily_otcalc_weekday = \'T\' ';
sql += '            THEN 1 ';
sql += '            ELSE 0 ';
sql += '        END AS is_weekly_off ';
sql += '    FROM customrecord_njt_emp_daily_atten_ch emp ';
sql += '   WHERE emp.custrecord_njt_daily_atten_emp = 2688';
sql += '        AND EXTRACT(MONTH FROM emp.custrecord_njt_emp_daily_date) = 9 ';
sql += '        AND EXTRACT(YEAR FROM emp.custrecord_njt_emp_daily_date) = ( ';
sql += '            SELECT name FROM customlist_hris_year_master WHERE id = 7 ';
sql += '        ) ';
sql += '        AND (emp.custrecord_njt_emp_daily_intatt IN (18, 19, 21, 9)';
sql += '             OR emp.custrecord_njt_emp_daily_intatt IS NULL)';
sql += ' ),';
sql += ' WeeklyOffMarkers AS (';
sql += '    SELECT ';
sql += '        attendance_date, ';
sql += '        is_weekly_off, ';
sql += '        otcalc, ';
sql += '        CASE ';
sql += '            WHEN is_weekly_off = 1 ';
sql += '                 AND (LAG(is_weekly_off, 1, 0) OVER (ORDER BY attendance_date) = 0) ';
sql += '            THEN 1 ';
sql += '            ELSE 0 ';
sql += '        END AS new_week_marker ';
sql += '    FROM AttendanceData ';
sql += ' ), ';
sql += ' WeekGroups AS ( ';
sql += '    SELECT ';
sql += '        attendance_date,';
sql += '        otcalc,';
sql += '        SUM(new_week_marker) OVER (ORDER BY attendance_date) AS week_group ';
sql += '    FROM WeeklyOffMarkers ';
sql += ' ), ';
sql += ' DateRanges AS ( ';
sql += '    SELECT ';
sql += '        a.attendance_date, ';
sql += '        a.otcalc, ';
sql += '    a.intatt, ';
sql += '        a.emp_daily_working_hours, ';
sql += '        a.actual_working_hours, ';
sql += '        a.weekhours, ';
sql += '        a.holidayhours, ';
sql += '        a.is_weekly_off, ';
sql += '        w.week_group ';
sql += '    FROM AttendanceData a ';
sql += '    JOIN WeekGroups w ';
sql += '        ON a.attendance_date = w.attendance_date ';
sql += ' ), ';
sql += ' WeekAggregates AS ( ';
sql += '    SELECT ';
sql += '        week_group,';
sql += '        MIN(attendance_date) AS start_date,';
sql += '        MAX(attendance_date) AS end_date,';
sql += '        LISTAGG(';
sql += '            CASE WHEN intatt = 21 AND otcalc = \'T\' ';
sql += '                THEN TO_CHAR(attendance_date, \'DD/MM/YYYY\') ';
sql += '            END, ', '';
sql += '        ) WITHIN GROUP (ORDER BY attendance_date) AS weeklyoff_dates, ';
sql += '       LISTAGG( ';
sql += '            CASE WHEN intatt = 21 AND otcalc = \'T\''; 
sql += '                THEN TRIM(TO_CHAR(attendance_date, \'Day\')) ';
sql += '            END, ', '';
sql += '        ) WITHIN GROUP (ORDER BY attendance_date) AS weeklyoff_days,';
sql += '        SUM(actual_working_hours) AS total_actual_hours,';
sql += '        SUM(weekhours) AS weekhours,';
sql += '        SUM(holidayhours) AS holidayhours,';
sql += '        SUM(emp_daily_working_hours) AS total_weekly_hours, ';
sql += '        COUNT(DISTINCT CASE WHEN intatt = 21 AND otcalc = \'T\' THEN attendance_date END) AS weekly_off_count,';
sql += '        MAX(otcalc) AS otcalc, ';
sql += '        SUM(CASE WHEN intatt NOT IN (17,16,10,1,12,15) THEN 1 WHEN intatt IN (12,15) THEN 0.5 ELSE 0 END) AS present_count,';
sql += '        SUM(CASE WHEN intatt IN (17,16,10,1) THEN 1 WHEN intatt IN (12,15) THEN 0.5 ELSE 0 END) AS absent_count';
sql += '    FROM DateRanges ';
sql += '    GROUP BY week_group ';
sql += ' ), ';
sql += ' FinalAggregate AS ( ';
sql += '    SELECT ';
sql += '        SUM(total_actual_hours) AS total_actual_hours,';
sql += '        SUM(weekhours) AS total_weekhours,';
sql += '        SUM(holidayhours) AS total_holidayhours,';
sql += '        SUM(total_weekly_hours) AS total_weekly_hours,';
sql += '        SUM(present_count) AS present_count,';
sql += '        SUM(absent_count) AS absent_count ';
sql += '    FROM WeekAggregates ';
sql += ' ) ';
sql += ' SELECT ';
sql += '    (total_actual_hours - NVL(total_weekhours, 0) - NVL(total_holidayhours, 0)) AS actual_working_hours,';
sql += '    NVL(total_weekhours, 0) AS weekhours,';
sql += '    NVL(total_holidayhours, 0) AS holidayhours,';
sql += '    (NVL(total_actual_hours, 0) - NVL(total_weekhours, 0) - NVL(total_holidayhours, 0)) - NVL(total_weekly_hours, 0) AS rot_hours,';
sql += '    NVL(total_weekly_hours, 0) AS total_weekly_hours,';
sql += '    NVL(present_count, 0) AS present_count,';
sql += '    NVL(absent_count, 0) AS absent_count,';
sql += '    2688 AS employee_id,';
sql += '    9 AS month,';
sql += '    7 AS year_id';
sql += 'FROM FinalAggregate';






    


                logModule.debug("Generated SQL Query", setsqlquery);
        
                // Run the SuiteQL query
                var queryResult = query.runSuiteQL({ query: setsqlquery });
                var tsResult = queryResult.asMappedResults();
                logModule.debug("tsResult",tsResult);
                logModule.debug("tsResult length",tsResult.length);
        
                // Loop through the results and set sublist values
                for (var loop = 0; loop < tsResult.length; loop++) {
                    var rec = tsResult[loop];
        
                    var empid = rec.employeeid||"";
                    var empname = rec.emp_name;
                    var empCode=rec.emp_code;
                    var project=rec.project;
                    var projectSeg=rec.project_site;
                    var internalAttendanceType = rec.present_count || 0; // Default to 0 if PresentCount is null
                    var absentCount = rec.absent_count || 0;
                    var weeklyOTHours = rec.weekly_ot || 0;
                    var holiOt=rec.holi_ot || 0;
                    var rotOt=rec.rot_ot || 0;
                    var parId=rec.parent_id
        
                    

                    try {
                        
                         sublist.setSublistValue({
                            id: "custpage_de_empid",
                            line: loop,
                            value: empid||"",
                            ignoreFieldChange: true,
                        });
                        sublist.setSublistValue({
                            id: "custpage_de_empintid",
                            line: loop,
                            value: empid||"",
                            ignoreFieldChange: true,
                        });
                        sublist.setSublistValue({
                            id: "custpage_de_name",
                            line: loop,
                            value: empname,
                            ignoreFieldChange: true,
                        });
                        sublist.setSublistValue({
                            id: "custpage_de_empidcode",
                            line: loop,
                            value: empCode,
                            ignoreFieldChange: true,
                        });
                        sublist.setSublistValue({
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
                        });
                        sublist.setSublistValue({
                            id: "custpage_noofpresent",
                            line: loop,
                            value: internalAttendanceType.toString(),
                            ignoreFieldChange: true,
                        });
                        
                        sublist.setSublistValue({
                            id: "custpage_noofabsent",
                            line: loop,
                            value: absentCount.toString(),
                            ignoreFieldChange: true,
                        });
                        sublist.setSublistValue({
                            id: "custpage_weeklyot",
                            line: loop,
                            value: weeklyOTHours.toString(),
                            ignoreFieldChange: true,
                        });
                        sublist.setSublistValue({
                            id: "custpage_holiot",
                            line: loop,
                            value: holiOt.toString(),
                            ignoreFieldChange: true,
                        });
                        sublist.setSublistValue({
                            id: "custpage_rothours",
                            line: loop,
                            value: rotOt.toString(),
                            ignoreFieldChange: true,
                        });
                        sublist.setSublistValue({
                            id: "custpage_parid",
                            line: loop,
                            value: parId,
                            ignoreFieldChange: true,
                        });
        
                    } catch (e) {
                        logModule.error("Error setting sublist value at line " + loop, e);
                    }
                }
            } catch (error) {
                logModule.error("Error in setSublistvalue function", error);
            }
        }
        
        return {
            onRequest: onRequest,
        };
    });
