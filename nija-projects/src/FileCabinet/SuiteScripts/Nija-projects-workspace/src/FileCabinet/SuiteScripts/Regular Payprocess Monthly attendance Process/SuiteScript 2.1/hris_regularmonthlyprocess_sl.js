/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @Description Suitelet for Regular Payprocess Monthly Attendance list and processing.
 */
define(['N/ui/serverWidget', 'N/task', 'N/redirect', 'N/query', 'N/log'], (serverWidget, task, redirect, query, log) => {

    /**
     * Helper function to pad single digit numbers with a leading zero
     */
    const padZero = (num) => String(num).padStart(2, '0');

    /**
     * Definition of the Suitelet script trigger point.
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     */
    const onRequest = (context) => {
        try {
            const { request, response } = context;
            const sublistValues = request.parameters;
            log.debug('Request Parameters', sublistValues);

            // Create form
            const form = serverWidget.createForm({
                title: 'Regular Payprocess Monthly attendance Process'
            });

            // Add fields to form
            const monthField = form.addField({
                id: 'custpage_month',
                type: serverWidget.FieldType.SELECT,
                label: 'Month',
                source: 'customlist_hris_month_list'
            });
            monthField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            const yearField = form.addField({
                id: 'custpage_year',
                type: serverWidget.FieldType.SELECT,
                label: 'Year',
                source: 'customlist_hris_year_master'
            });
            yearField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            const subsidiaryField = form.addField({
                id: 'custpage_subsi',
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary',
                source: 'subsidiary'
            });
            subsidiaryField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            const empCodeField = form.addField({
                id: 'custpage_empcode',
                type: serverWidget.FieldType.SELECT,
                label: 'Employee Code'
            });
            empCodeField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            const mrStatusField = form.addField({
                id: 'custpage_mr_status',
                type: serverWidget.FieldType.SELECT,
                label: 'MRS Status Field'
            });
            mrStatusField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.DISABLED
            });

            form.addSubmitButton({
                label: 'Submit'
            });

            // Link client script to the form
            form.clientScriptModulePath = './hris_regularmonthlyprocess_cs.js';

            if (request.method === 'GET') {
                const monthParam = request.parameters.custparam_month;
                const yearParam = request.parameters.custparam_year;
                const subsidiaryParam = request.parameters.custparam_subsi;
                const empCodeParam = request.parameters.custparam_empcode;

                log.debug('GET Filter Params', {
                    monthParam,
                    yearParam,
                    subsidiaryParam,
                    empCodeParam
                });

                if (empCodeParam) {
                    form.getField({ id: 'custpage_empcode' }).defaultValue = empCodeParam;
                }
                if (monthParam) {
                    form.getField({ id: 'custpage_month' }).defaultValue = monthParam;
                }
                if (yearParam) {
                    form.getField({ id: 'custpage_year' }).defaultValue = yearParam;
                }
                if (subsidiaryParam) {
                    form.getField({ id: 'custpage_subsi' }).defaultValue = subsidiaryParam;
                }

                const sublist = createSublist(form);
                setSublistvalue(sublist, query, monthParam, yearParam, subsidiaryParam, empCodeParam);

                response.writePage(form);
            } else if (request.method === 'POST') {
                const monthVal = sublistValues.custpage_month;
                const yearVal = sublistValues.custpage_year;
                const subsidiaryVal = sublistValues.custpage_subsi;
                const empCodeVal = sublistValues.custpage_empcode;

                log.debug('POST Form Values', {
                    monthVal,
                    yearVal,
                    subsidiaryVal,
                    empCodeVal
                });

                const statusQuery = `
                    SELECT custrecord_hris_mr_sts, BUILTIN.DF(custrecord_hris_mr_sts) AS name 
                    FROM customrecord_hris_mr_status_bar_rec 
                    WHERE id = 16
                `;
                const queryResults = query.runSuiteQL({ query: statusQuery });
                const records = queryResults.asMappedResults();

                if (records && records.length > 0) {
                    for (const record of records) {
                        mrStatusField.addSelectOption({
                            value: String(record.custrecord_hris_mr_sts),
                            text: record.name,
                            isSelected: true
                        });
                    }
                }

                const employeesheetdata = sublistValues.employeesheetdata || '';
                const rowArray = employeesheetdata ? employeesheetdata.split('\u0002') : [];
                log.debug('Sublist Row Count', rowArray.length);

                const selectArray = [];
                for (const line of rowArray) {
                    if (!line) continue;
                    const columnArray = line.split('\u0001');

                    const select = columnArray[0];
                    if (select === 'T') {
                        selectArray.push({
                            empid: columnArray[2],
                            employeeCode: columnArray[3],
                            employeeName: columnArray[4],
                            noPresntId: columnArray[5],
                            noAbsentId: columnArray[6],
                            noweeklyId: columnArray[7],
                            noholiId: columnArray[8],
                            norotId: columnArray[9],
                            latemin: columnArray[10],
                            latehrs: columnArray[11],
                            intempId: columnArray[12],
                            parId: columnArray[13],
                            monthFiedid: monthVal,
                            yearFiedidid: yearVal,
                            processid: true
                        });
                    }
                }

                log.debug('Selected Rows for Processing', selectArray);

                // Trigger Map/Reduce task
                const mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_hris_regpaymonproce_mrs',
                    deploymentId: 'customdeploy_hris_regpaymonproce_mrs',
                    params: {
                        custscript_hris_monthlyattenlist: JSON.stringify(selectArray)
                    }
                });
                const mrTaskId = mrTask.submit();
                log.audit('Map/Reduce Task Submitted', { mrTaskId });

                // Redirect to the criteria Suitelet
                redirect.toSuitelet({
                    scriptId: 'customscript_hris_regpaymonprocecrite_sl',
                    deploymentId: 'customdeploy_hris_regpaymonprocecrite_sl'
                });

                response.writePage(form);
            }
        } catch (e) {
            log.error({
                title: 'Error in onRequest',
                details: e.message || e
            });
            context.response.write(`Error processing request: ${e.message}`);
        }
    };

    /**
     * Creates and configures the sublist on the Suitelet form.
     * @param {serverWidget.Form} form
     * @returns {serverWidget.Sublist}
     */
    const createSublist = (form) => {
        const salesSublist = form.addSublist({
            id: 'employeesheet',
            type: serverWidget.SublistType.LIST,
            label: 'Monthly Attendance Sheet List'
        });

        salesSublist.addMarkAllButtons();
        salesSublist.addRefreshButton();

        salesSublist.addField({
            id: 'custpage_de_check',
            type: serverWidget.FieldType.CHECKBOX,
            label: 'Select'
        });

        const empIdField = salesSublist.addField({
            id: 'custpage_de_empid',
            type: serverWidget.FieldType.SELECT,
            label: 'Employee ID',
            source: 'employee'
        });
        empIdField.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.DISABLED
        });

        salesSublist.addField({
            id: 'custpage_de_empidcode',
            type: serverWidget.FieldType.TEXT,
            label: 'Employee Code'
        });

        salesSublist.addField({
            id: 'custpage_de_name',
            type: serverWidget.FieldType.TEXT,
            label: 'Employee Name'
        });

        salesSublist.addField({
            id: 'custpage_noofpresent',
            type: serverWidget.FieldType.TEXT,
            label: 'No of Present'
        });

        salesSublist.addField({
            id: 'custpage_noofabsent',
            type: serverWidget.FieldType.TEXT,
            label: 'No Of Absent'
        });

        const weeklyOt = salesSublist.addField({
            id: 'custpage_weeklyot',
            type: serverWidget.FieldType.TEXT,
            label: 'Weeklyoff OT Hours'
        });
        weeklyOt.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        const holidayOt = salesSublist.addField({
            id: 'custpage_holiot',
            type: serverWidget.FieldType.TEXT,
            label: 'Holiday OT Hours'
        });
        holidayOt.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        const rotHours = salesSublist.addField({
            id: 'custpage_rothours',
            type: serverWidget.FieldType.TEXT,
            label: 'ROT Hours'
        });
        rotHours.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        const lateMin = salesSublist.addField({
            id: 'custpage_latemin',
            type: serverWidget.FieldType.TEXT,
            label: 'Late Min'
        });
        lateMin.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        const lateHrs = salesSublist.addField({
            id: 'custpage_latehrs',
            type: serverWidget.FieldType.TEXT,
            label: 'Late Hours'
        });
        lateHrs.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        const employeeIntId = salesSublist.addField({
            id: 'custpage_de_empintid',
            type: serverWidget.FieldType.TEXT,
            label: 'Employee ID'
        });
        employeeIntId.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        const parId = salesSublist.addField({
            id: 'custpage_parid',
            type: serverWidget.FieldType.TEXT,
            label: 'Parent ID'
        });
        parId.updateDisplayType({
            displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        return salesSublist;
    };

    /**
     * Executes SuiteQL and populates the attendance sublist rows.
     * @param {serverWidget.Sublist} sublist
     * @param {Object} query
     * @param {string|number} monthField
     * @param {string|number} yearField
     * @param {string|number} subsidiaryfield
     * @param {string|number} epcodee
     */
    const setSublistvalue = (sublist, query, monthField, yearField, subsidiaryfield, epcodee) => {
        try {
            if (!monthField || !yearField || !subsidiaryfield) {
                return;
            }

            let monthlySql = '';
            if (epcodee) {
                monthlySql = `
                    SELECT a.*, 
                           e.entityid AS emp_name, 
                           e.custentity_hris_empcode AS emp_code, 
                           e.subsidiary, 
                           e.id AS emp_int_id, 
                           a.custrecord_hrms_month_late_mins AS latemin, 
                           a.custrecord_hrms_month_late_hrs AS latehrs
                    FROM customrecord_hrms_monthlyattendance a 
                    JOIN customlist_hris_month_list b ON a.custrecord_hrms_month_monthid = b.id 
                    JOIN customlist_hris_year_master c ON a.custrecord_hrms_month_yearid = c.id 
                    JOIN employee e ON e.id = a.custrecord_hrms_month_empid 
                    WHERE b.id = ${monthField} 
                      AND a.custrecord_hrms_month_processcompleted = 'F' 
                      AND b.isinactive = 'F' 
                      AND c.id = ${yearField} 
                      AND a.custrecord_njt_hrms_monthly_status = 1 
                      AND e.id = '${epcodee}' 
                      AND e.subsidiary = '${subsidiaryfield}' 
                      AND c.isinactive = 'F'
                `;
            } else {
                monthlySql = `
                    SELECT a.*, 
                           e.entityid AS emp_name, 
                           e.custentity_hris_empcode AS emp_code, 
                           e.subsidiary 
                    FROM customrecord_hrms_monthlyattendance a 
                    JOIN customlist_hris_month_list b ON a.custrecord_hrms_month_monthid = b.id 
                    JOIN customlist_hris_year_master c ON a.custrecord_hrms_month_yearid = c.id 
                    JOIN employee e ON e.id = a.custrecord_hrms_month_empid 
                    WHERE b.id = ${monthField} 
                      AND b.isinactive = 'F' 
                      AND a.custrecord_hrms_month_processcompleted = 'F' 
                      AND c.id = ${yearField} 
                      AND a.custrecord_njt_hrms_monthly_status = 1 
                      AND e.subsidiary = '${subsidiaryfield}' 
                      AND c.isinactive = 'F'
                `;
            }

            log.debug('Monthly SQL Query', monthlySql);

            const queryResult = query.runSuiteQL({ query: monthlySql });
            const tsResult = queryResult.asMappedResults();

            log.debug('Sublist Query Results Length', tsResult.length);

            // Loop through results and populate sublist rows
            tsResult.forEach((rec, loop) => {
                const empid = rec.custrecord_hrms_month_empid || '';
                const empName = rec.emp_name || '';
                const empCode = rec.emp_code || '';
                const internalAttendanceType = rec.custrecord_hrms_month_presentdays ?? 0;
                const absentCount = rec.custrecord_hrms_month_absentdays ?? 0;
                const weeklyOTHours = rec.custrecord_hrms_month_weeklyothrs ?? 0;
                const holiOt = rec.custrecord_hrms_month_holidayothrs ?? 0;
                const rotOt = rec.custrecord_hrms_month_rothrs ?? 0;
                const parId = rec.id || '';

                try {
                    if (empid) {
                        sublist.setSublistValue({
                            id: 'custpage_de_empid',
                            line: loop,
                            value: String(empid),
                            ignoreFieldChange: true
                        });
                        sublist.setSublistValue({
                            id: 'custpage_de_empintid',
                            line: loop,
                            value: String(empid),
                            ignoreFieldChange: true
                        });
                    }
                    if (empName) {
                        sublist.setSublistValue({
                            id: 'custpage_de_name',
                            line: loop,
                            value: String(empName),
                            ignoreFieldChange: true
                        });
                    }
                    if (empCode) {
                        sublist.setSublistValue({
                            id: 'custpage_de_empidcode',
                            line: loop,
                            value: String(empCode),
                            ignoreFieldChange: true
                        });
                    }
                    sublist.setSublistValue({
                        id: 'custpage_noofpresent',
                        line: loop,
                        value: String(internalAttendanceType),
                        ignoreFieldChange: true
                    });
                    sublist.setSublistValue({
                        id: 'custpage_noofabsent',
                        line: loop,
                        value: String(absentCount),
                        ignoreFieldChange: true
                    });
                    sublist.setSublistValue({
                        id: 'custpage_weeklyot',
                        line: loop,
                        value: String(weeklyOTHours),
                        ignoreFieldChange: true
                    });
                    sublist.setSublistValue({
                        id: 'custpage_holiot',
                        line: loop,
                        value: String(holiOt),
                        ignoreFieldChange: true
                    });
                    sublist.setSublistValue({
                        id: 'custpage_rothours',
                        line: loop,
                        value: String(rotOt),
                        ignoreFieldChange: true
                    });
                    if (parId) {
                        sublist.setSublistValue({
                            id: 'custpage_parid',
                            line: loop,
                            value: String(parId),
                            ignoreFieldChange: true
                        });
                    }
                } catch (e) {
                    log.error({
                        title: `Error setting sublist value at line ${loop}`,
                        details: e.message || e
                    });
                }
            });
        } catch (error) {
            log.error({
                title: 'Error in setSublistvalue function',
                details: error.message || error
            });
        }
    };

    return {
        onRequest
    };
});
