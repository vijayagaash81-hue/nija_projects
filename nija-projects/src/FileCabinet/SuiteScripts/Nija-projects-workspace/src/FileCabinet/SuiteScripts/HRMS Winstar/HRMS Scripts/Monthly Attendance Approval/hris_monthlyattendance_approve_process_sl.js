/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
define(["N/ui/serverWidget", "N/search", "N/log", "N/task", "N/redirect", "N/record", "N/runtime", "N/format", "N/query", "N/currentRecord", "N/https", "N/url"],
    function (serverWidget, search, log, task, redirectModule, record, runtime, format, query, currentRecord, https, urlMod) {

        function onRequest(context) {
            var sublistValues = context.request.parameters;
            log.debug("sublistValues", sublistValues);


            // Create a form
            var form = serverWidget.createForm({
                title: "Employee Monthly attendance Approval Process",
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
            var nextapprovalField = form.addField({
                id: "custpage_nextapproval",
                type: serverWidget.FieldType.SELECT,
                label: "Next approval",
                source: "employee",
            });
            nextapprovalField.isMandatory = true;
        /*     var mrStatus = form.addField({
                id: 'custpage_mr_status',
                type: serverWidget.FieldType.SELECT,
                label: 'MRS Status Field',
                //container: 'status'
            });
            mrStatus.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED,
            });
  */
            form.addSubmitButton({
                label: "Submit",
            });
            // Set client script module path
          //  form.clientScriptModulePath = "./approval status in monthly attendance cl.js";

            if (context.request.method === "GET") {
                var statusMr = 1
                log.debug("statusMr", statusMr);
                var monthFied = context.request.parameters.custparam_month;
                var yearField = context.request.parameters.custparam_year;
                log.debug("yearField", yearField);
                // var projectField = context.request.parameters.custparam_project;
                // var projectsegField = context.request.parameters.custparam_projectseg;
                var subsidiaryfield = context.request.parameters.custparam_subsi;
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
                log.debug("subsidiaryfieldcheckpart1", subsidiaryfield);
                var sublist = createSublist(form);
                setSublistvalue(sublist, query, monthFied, yearField, subsidiaryfield);
                context.response.writePage(form);
            } else if (context.request.method === "POST") {
                var monthFied = sublistValues.custpage_month;
                var yearField = sublistValues.custpage_year;
                // var projectField = sublistValues.custpage_project;
                //  var projectsegField = sublistValues.custpage_projectseg;
                var subsidiaryfield = sublistValues.custpage_subsi;
                var nextapprovalField = sublistValues.custpage_nextapproval;

                log.debug("monthFied", monthFied);
                log.debug("yearField", yearField);
                //log.debug("vendorValue", vendorValue);
             
              
                var rowArray = sublistValues.employeesheetdata.split("\u0002");
                var selectArray = [];

                for (var line = 0; line < rowArray.length; line++) {
                    var columnArray = rowArray[line].split("\u0001");
                    log.debug("columnArray", columnArray);
                    var selectObj = {};
                    var select = columnArray[0];
                    if (select == 'T') {
                        selectObj.childId = columnArray[15];
                        selectObj.nextapprovalField = nextapprovalField;
                        selectArray.push(selectObj);
                    }
                }
                log.debug("selectArray", selectArray);
                // Step 1: Run the first M/R
                var mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: "customscript_hris_monthlyappro_proces_mr",
                    //deploymentId: "customdeploy_njt_approver_sts_mr",
                    params: {
                        custscript_hris_monthlyapprov_array: JSON.stringify(selectArray)
                    }
                });
                var mrTaskId = mrTask.submit();
                log.debug("mrTaskId", mrTaskId);




                // Step 2: Poll until MR1 finishes, then start MR2
                var checkInterval = 5000; // 5 seconds
                var maxTries = 200; // ~15 mins max wait
                var tries = 0;

                var mr2Submitted = false;

                do {
                    var status = task.checkStatus(mrTaskId);
                    log.debug('MR1 status', status.status);
                 
                    
                    //if (status.status === task.TaskStatus.PROCESSING && !mr2Submitted) {

                    if (status.status === task.TaskStatus.COMPLETE && !mr2Submitted) {
                        // Submit MR2 only after MR1 is done
                        /*   var mr2 = task.create({
                              taskType: task.TaskType.MAP_REDUCE,
                              scriptId: 'customscript_mr2',
                              deploymentId: 'customdeploy_mr2'
                          });
                          var mr2Id = mr2.submit();
                          log.debug('MR2 submitted', mr2Id);*/
                       
                        mr2Submitted = true;
                        break;


                    }

                    tries++;
                    if (tries > maxTries) {
                     /*    record.submitFields({
                            type: "customrecord_hris_mr_status_bar_rec",
                            id: 7,
                            values: {
                                custrecord_hris_mr_sts: 1
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        }); */
                        throw new Error("Timeout: MR1 took too long to finish.");

                    }

                    // Wait before checking again
                    sleep(checkInterval);

                } while (true);
                // After submitting MR





                context.response.write("Both Map/Reduce scripts completed (sequentially).");


                // Redirect to the second Suitelet with manager and date values as parameters
                redirectModule.toSuitelet({
                    scriptId: 'customscript_hris_monthlyappro_criter_sl',
                    deploymentId: 'customdeploy_hris_monthlyappro_criter_sl',
                });

                //context.response.writePage(form);
            }
        }
        // Simple sleep helper
        function sleep(ms) {
            var start = new Date().getTime();
            while (new Date().getTime() < start + ms) { }
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
                label: "Employee ID",
                source: "employee"
            });
            var empcode = salesSublist.addField({
                id: "custpage_de_empidcode",
                type: serverWidget.FieldType.TEXT,
                label: "Employee Code",
            });

          var Empname=  salesSublist.addField({
                id: "custpage_de_name",
                type: serverWidget.FieldType.TEXT,
                label: "Employee Name",
            });
  Empname.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            var projectCode = salesSublist.addField({
                id: "custpage_project_code",
                type: serverWidget.FieldType.SELECT,
                label: "Project Code",
                source: "customrecord_cseg_njt_seg_proj"
            });
            projectCode.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
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
            var noofabsent = salesSublist.addField({
                id: "custpage_noofabsent",
                type: serverWidget.FieldType.TEXT,
                label: "No Of Absent",
            });
            var weeklyOt = salesSublist.addField({
                id: "custpage_weeklyot",
                type: serverWidget.FieldType.TEXT,
                label: "Weeklyoff OT Hours",
            });
            var holidayOt = salesSublist.addField({
                id: "custpage_holiot",
                type: serverWidget.FieldType.TEXT,
                label: "Holiday OT Hours",
            });
            var rotHours = salesSublist.addField({
                id: "custpage_rothours",
                type: serverWidget.FieldType.TEXT,
                label: "ROT Hours",
            });
            var Latemin = salesSublist.addField({
                id: "custpage_latemin",
                type: serverWidget.FieldType.TEXT,
                label: "Late Min",
            });
            var Latehrs = salesSublist.addField({
                id: "custpage_latehrs",
                type: serverWidget.FieldType.TEXT,
                label: "Late Hours",
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
            var childId = salesSublist.addField({
                id: "custpage_de_chilid",
                type: serverWidget.FieldType.TEXT,
                label: "Child ID",
                //source:"employee Id"
            });
            childId.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });


            return salesSublist;
        }

        function setSublistvalue(sublist, query, monthFied, yearField, subsidiaryfield) {
            try {
                var setsqlquery = "SELECT " +
                    "A.custrecord_hrms_month_absentdays AS absent_count, " +
                    "A.custrecord_hrms_month_empid AS employeeid, " +
                    "BUILTIN.DF(A.custrecord_hrms_month_empid) AS emp_name, " +
                    "A.custrecord_hrms_month_holidayothrs AS holi_ot, " +
                    "A.isInactive, " +
                    "A.id AS child_id, " +
                    "A.custrecord_hrms_month_monthid, " +
                    "A.custrecord_hrms_month_paydate, " +
                    "A.custrecord_hrms_month_paygroup, " +
                    "A.custrecord_hrms_month_presentdays AS presenting_count, " +
                    "A.custrecord_hrms_month_project AS project_name, " +
                    "A.custrecord_hrms_month_projectsite AS project_seg, " +
                    "A.custrecord_hrms_month_rothrs AS rotOt, " +
                    "A.scriptId, " +
                    "A.custrecord_hrms_month_weeklyothrs AS weekly_ot, " +
                    "A.custrecord_hrms_month_yearid, " +
                    "A.custrecord_hrms_month_rothrs AS rot_ot, " +
                    "A.custrecord_hrms_month_late_mins AS latemin, " +
                    "A.custrecord_hrms_month_late_hrs AS latehrs, " +
                    "C.subsidiary, " +
                    "C.custentity_hris_empcode AS emp_code " +
                    "FROM " +
                    "CUSTOMRECORD_HRMS_MONTHLYATTENDANCE A " +
                    "INNER JOIN " +
                    "employee C " +
                    "ON " +
                    "A.custrecord_hrms_month_empid = C.id " +
                    "WHERE " +
                    "A.custrecord_hrms_month_monthid = " + monthFied + " " +
                    "AND A.custrecord_hrms_month_yearid = " + yearField + " " +
                    "AND C.subsidiary = " + subsidiaryfield + " " +
                    "AND (A.custrecord_njt_hrms_monthly_status = 2 OR A.custrecord_njt_hrms_monthly_status IS NULL);";



                log.debug("Generated SQL Query", setsqlquery);

                // Run the SuiteQL query
                var queryResult = query.runSuiteQL({ query: setsqlquery });
                var tsResult = queryResult.asMappedResults();
                log.debug("tsResult", tsResult);
                log.debug("tsResult length", tsResult.length);

                // Loop through the results and set sublist values
                for (var loop = 0; loop < tsResult.length; loop++) {
                    var rec = tsResult[loop];

                    var empid = rec.employeeid || "";
                    var empname = rec.emp_name;
                    var empCode = rec.emp_code || "";
                  //  var project = rec.project_name;
                //    var projectSeg = rec.project_seg;
                    var internalAttendanceType = rec.presenting_count || 0; // Default to 0 if PresentCount is null
                    var absentCount = rec.absent_count || 0;
                    var weeklyOTHours = rec.weekly_ot || 0;
                    var holiOt = rec.holi_ot || 0;
                    var rotOt = rec.rot_ot || 0;
                    var childId = rec.child_id;
                    var latemin = rec.latemin || 0;
                    var latehrs = rec.latehrs || 0;



                    try {

                        sublist.setSublistValue({
                            id: "custpage_de_empid",
                            line: loop,
                            value: empid || "",
                            ignoreFieldChange: true,
                        });
                        log.audit('1',empCode)
                        if(empCode){
                            sublist.setSublistValue({
                            id: "custpage_de_empidcode",
                            line: loop,
                            value: empCode,
                            ignoreFieldChange: true,
                        });
                        }
                        
                        log.audit('2',empname)
                        sublist.setSublistValue({
                            id: "custpage_de_name",
                            line: loop,
                            value: empname,
                            ignoreFieldChange: true,
                        });
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
                         log.audit('2',internalAttendanceType.toString())
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
                            id: "custpage_latemin",
                            line: loop,
                            value: latemin.toString(),
                            ignoreFieldChange: true,
                        });
                        sublist.setSublistValue({
                            id: "custpage_latehrs",
                            line: loop,
                            value: latehrs.toString(),
                            ignoreFieldChange: true,
                        });

                        sublist.setSublistValue({
                            id: "custpage_de_empintid",
                            line: loop,
                            value: empid || "",
                            ignoreFieldChange: true,
                        });
                        sublist.setSublistValue({
                            id: "custpage_de_chilid",
                            line: loop,
                            value: childId || "",
                            ignoreFieldChange: true,
                        });


                    } catch (e) {
                        log.error("Error setting sublist value at line " + loop, e);
                    }
                }
            } catch (error) {
                log.error("Error in setSublistvalue function", error);
            }
        }

        return {
            onRequest: onRequest,
        };
    });
