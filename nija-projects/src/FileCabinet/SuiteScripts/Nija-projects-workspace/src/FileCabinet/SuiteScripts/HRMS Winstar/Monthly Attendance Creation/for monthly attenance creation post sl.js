/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

define(['N/ui/serverWidget', 'N/log', 'N/task', 'N/redirect', 'N/query'],
function(serverWidget, log, task, redirect, query) {

    /**
     * Handles Suitelet requests (GET for page display, POST for form submission).
     * @param {Object} context - The context object containing request and response.
     * @param {HttpRequest} context.request - Encapsulation of the incoming request.
     * @param {HttpResponse} context.response - Encapsulation of the outgoing response.
     */
    function onRequest(context) {
        // Handle GET request - display the form
        if (context.request.method === 'GET') {
            // Create a new form
            var form = serverWidget.createForm({ title: 'Process Monthly Attendance' });

            // Add 'Month' select field
            var payMonth = form.addField({
                id: 'custpage_paymonth',
                type: serverWidget.FieldType.SELECT,
                label: 'Month',
                source: 'customlist_hris_month_list' // Source from a custom list
            });
            payMonth.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED }); // Make it read-only
            payMonth.isMandatory = true; // Make it a required field

            // Add 'Year' select field
            var payYear = form.addField({
                id: 'custpage_payyear',
                type: serverWidget.FieldType.SELECT,
                label: 'Year',
                source: 'customlist_hris_year_master' // Source from a custom list
            });
            payYear.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED }); // Make it read-only
            payYear.isMandatory = true; // Make it a required field

            // Add 'Group' (Pay Group) select field
            var payGroup = form.addField({
                id: 'custpage_paygroup',
                type: serverWidget.FieldType.SELECT,
                label: 'PayGroup',
                source: 'customrecord_hris_process_groupmaster' // Source from a custom record
            });
            payGroup.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED }); // Make it read-only
            payGroup.isMandatory = true; // Make it a required field

            // Add 'Subsidiary' select field
            var subsidiary = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary',
                source: 'subsidiary' // Source from the standard Subsidiary record
            });
            subsidiary.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED }); // Make it read-only
            subsidiary.isMandatory = true; // Make it a required field

            // Add 'Employee Category' select field
            var empCategory = form.addField({
                id: 'custpage_empcategory',
                type: serverWidget.FieldType.SELECT,
                label: 'Employee Category',
                source: 'customrecord_hris_employeecategory' // Source from a custom record
            });
            empCategory.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED }); // Make it read-only

            // Add 'Employee' select field
            var employee = form.addField({
                id: 'custpage_employee',
                type: serverWidget.FieldType.SELECT,
                label: 'Employee',
                source: 'employee' // Source from the standard Employee record
            });
            employee.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED }); // Make it read-only

            // Add a submit button to the form
            form.addSubmitButton({ label: 'Process Monthly Attendance' });

            // Get parameters passed to the Suitelet (e.g., from a redirect or URL)
            var params = context.request.parameters;
            var monthId = params.custparam_paymonth;
            var yearId = params.custparam_payyear;
            var paygroupId = params.custparam_paygroup;
            var subsidiaryId = params.custparam_subsidiary;
            var empCatId = params.custparam_empcategory;
            var employeeId = params.custparam_employee;

            // Set default values for fields if parameters are present
            if (monthId) payMonth.defaultValue = monthId;
            if (yearId) payYear.defaultValue = yearId;
            if (paygroupId) payGroup.defaultValue = paygroupId;
            if (subsidiaryId) subsidiary.defaultValue = subsidiaryId;
            if (empCatId) empCategory.defaultValue = empCatId;
            if (employeeId) employee.defaultValue = employeeId;

            // Create the sublist for displaying attendance records
            var sublist = createSublist(form);

            // Populate the sublist with data based on the retrieved parameters
            populateSublist(sublist, monthId, yearId, paygroupId, subsidiaryId, empCatId, employeeId);

            // Write the form to the response
            context.response.writePage(form);
        }
        // Handle POST request - form submission
        else if (context.request.method === 'POST') {
            // Get parameters from the submitted form
            var params = context.request.parameters;
            var monthId = params.custpage_paymonth;
            var yearId = params.custpage_payyear;
            var paygroupId = params.custpage_paygroup;
            var subsidiaryId = params.custpage_subsidiary;

            // Parse sublist data submitted from the client-side
            // Data is typically '\u0002' separated rows, '\u0001' separated columns
            var rowData = params.employeesheetdata ? params.employeesheetdata.split('\u0002') : [];
            var selectedRecords = [];

            // Iterate through submitted rows to find selected employees
            for (var i = 0; i < rowData.length; i++) {
                var cols = rowData[i].split('\u0001'); // Split columns for each row
                var isChecked = cols[0]; // First column is the checkbox value ('T' or 'F')
                var empInternalId = cols[1]; // Second column is Employee ID (custpage_de_empid)
                var childId = cols[10]; // Tenth column is Monthly Attendance ID (custpage_de_chilid)

                // If checkbox is checked ('T') and employee ID is present, add to selected records
                if (isChecked === 'T' && empInternalId) {
                    selectedRecords.push({
                        monthlyAttendanceId: childId ? parseInt(childId, 10) : 0, // Parse as integer, default to 0
                        employeeId: parseInt(empInternalId, 10), // Parse as integer
                        paymonth: monthId,
                        payyear: yearId,
                        paygroup: paygroupId,
                        subsidiary: subsidiaryId
                    });
                }
            }

            log.debug({ title: 'Selected Records for Approval', details: JSON.stringify(selectedRecords) });

            // If no records were selected, redirect back to the filter page
            if (selectedRecords.length === 0) {
                redirect.toSuitelet({
                    scriptId: 'customscript_hris_for_monthly_attendance',
                    deploymentId: 'customdeploy_hris_for_monthly_attendance'
                });
                return; // Exit the function
            }

            // Create and submit a Map/Reduce task to process the selected records
            var mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_hris_for_month_create_mr', // Script ID of the Map/Reduce script
                //deploymentId: 'customdeploy_njt_mr_month_attendance', // Deployment ID of the Map/Reduce script
                params: {
                    custscript_hris_dailyemplist1: JSON.stringify(selectedRecords) // Pass selected records as a script parameter
                }
            });
            var taskId = mrTask.submit(); // Submit the Map/Reduce task

            log.audit({ title: 'Map/Reduce Task Launched', details: 'Task ID: ' + taskId + ', Number of records to process: ' + selectedRecords.length });

            // Redirect back to the filter page after task submission
            redirect.toSuitelet({
                scriptId: 'customscript_hris_for_monthly_attendance',
                deploymentId: 'customdeploy_hris_for_monthly_attendance'
            });
        }
    }

    /**
     * Creates the sublist definition for displaying attendance records.
     * @param {Form} form - The parent form object.
     * @returns {Sublist} The created sublist object.
     */
    function createSublist(form) {
        // Add a sublist to the form
        var sublist = form.addSublist({
            id: 'employeesheet',
            type: serverWidget.SublistType.LIST,
            label: 'Monthly Attendance Records'
        });

        // Add 'Mark All' and 'Refresh' buttons to the sublist
        sublist.addMarkAllButtons();
        sublist.addRefreshButton();

        // Define columns for the sublist
        sublist.addField({ id: 'custpage_de_check', type: serverWidget.FieldType.CHECKBOX, label: 'Select' });

        sublist.addField({
            id: 'custpage_de_empid',
            type: serverWidget.FieldType.TEXT,
            label: 'Employee ID'
        });
sublist.addField({
            id: 'custpage_de_empcode',
            type: serverWidget.FieldType.TEXT,
            label: 'Employee Code'
        });
        sublist.addField({
            id: 'custpage_de_empname',
            type: serverWidget.FieldType.TEXT,
            label: 'Employee Name'
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE }); // Make employee name inline (read-only, not an input)

        sublist.addField({
            id: 'custpage_de_empcat',
            type: serverWidget.FieldType.SELECT,
            label: 'Category',
            source: 'customrecord_hris_employeecategory'
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED});

        sublist.addField({
            id: 'custpage_de_month',
            type: serverWidget.FieldType.SELECT,
            label: 'Month',
            source: 'customlist_hris_month_list'
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED});

        sublist.addField({
            id: 'custpage_de_year',
            type: serverWidget.FieldType.SELECT,
            label: 'Year',
            source: 'customlist_hris_year_master'
        }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED});

        sublist.addField({ id: 'custpage_de_present', type: serverWidget.FieldType.TEXT, label: 'Present Days' });
        sublist.addField({ id: 'custpage_de_absent', type: serverWidget.FieldType.TEXT, label: 'Absent Days' });

        // Hidden field to store the internal ID of the Monthly Attendance record
        var childIdField = sublist.addField({
            id: 'custpage_de_chilid',
            type: serverWidget.FieldType.TEXT,
            label: 'Monthly Att ID'
        });
        childIdField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN }); // Hide this field from the UI

        return sublist;
    }

    /**
     * Populates the sublist with employee monthly attendance data based on filters.
     * @param {Sublist} sublist - The sublist object to populate.
     * @param {string} monthId - Internal ID of the selected month.
     * @param {string} yearId - Internal ID of the selected year.
     * @param {string} payGroupId - Internal ID of the selected pay group.
     * @param {string} subsidiaryId - Internal ID of the selected subsidiary.
     * @param {string} empCatId - Internal ID of the selected employee category (optional).
     * @param {string} employeeId - Internal ID of the selected employee (optional).
     */
    function populateSublist(sublist, monthId, yearId, payGroupId, subsidiaryId, empCatId, employeeId) {
        try {
            /***********************
             * Helper: Safe Value
             * Ensures a value is not null, undefined, or empty,
             * returning a default if it is.
             ***********************/
            function safeValue(v, defaultVal) {
                return (v === null || v === undefined || v === '' || v === 'null')
                    ? defaultVal
                    : String(v);
            }

            /********************************
             * Validate Required Parameters
             * If any essential filter is missing, log and return early.
             ********************************/
            if (!monthId || !yearId || !payGroupId || !subsidiaryId) {
                log.debug('populateSublist', 'Missing required parameters. monthId: ' + monthId + ', yearId: ' + yearId + ', payGroupId: ' + payGroupId + ', subsidiaryId: ' + subsidiaryId);
                return;
            }

            /********************************
             * STEP 1: Fetch Wage End Date
             * Retrieve the wage period end date for the given pay group, month, and year.
             * This date is used to filter employees based on their hire date.
             ********************************/
            var wageSQL = '';
            wageSQL += 'SELECT custrecord_hris_end_date ';
            wageSQL += 'FROM customrecord_hris_wage_period_details ';
            wageSQL += 'WHERE custrecord_hris_pay_group = ' + payGroupId + ' '; // Filter by Pay Group
            wageSQL += '  AND custrecord_hris_month = ' + monthId + ' ';     // Filter by Month
            wageSQL += '  AND custrecord_hris_year = ' + yearId + ' ';       // Filter by Year
            wageSQL += '  AND isinactive = \'F\'';                           // Ensure the wage period is active

            var wageResult = query.runSuiteQL({ query: wageSQL });
            var wageRecords = wageResult.asMappedResults();

            // If no wage period is found, log and return
            if (wageRecords.length === 0) {
                log.audit('No Wage Period Found', 'Paygroup: ' + payGroupId + ' | Month: ' + monthId + ' | Year: ' + yearId);
                return;
            }

            // Get the wage end date from the first (and only expected) result
            var wageEndDateStr = safeValue(wageRecords[0].custrecord_hris_end_date, '');
            log.audit('Retrieved Wage End Date', wageEndDateStr);

            /********************************
             * STEP 2: Build Main SQL Query
             * This query retrieves employee details along with their monthly attendance data.
             ********************************/
            var sql = '';
sql += 'SELECT ';
sql += '    E.id                     AS employee_internal_id, ';
sql += '    E.entityid               AS employee_code, ';
sql += '    E.custentity_hris_empcode  AS employee_intcode, ';
sql += '    E.firstname || \' \' || E.lastname AS employee_name, ';
sql += '    E.custentity_hris_empcategory     AS emp_category_id, ';
sql += '    MA.id                    AS monthly_attendance_id, ';
sql += '    MA.custrecord_hrms_month_presentdays AS present_days, ';
sql += '    MA.custrecord_hrms_month_absentdays  AS absent_days, ';
sql += '    MA.custrecord_njt_hrms_monthly_status AS monthly_status ';
sql += 'FROM employee E ';
sql += 'LEFT JOIN customrecord_hrms_monthlyattendance MA ';
sql += '    ON MA.custrecord_hrms_month_empid = E.id ';
sql += '   AND MA.custrecord_hrms_month_monthid = ' + monthId + ' ';
sql += '   AND MA.custrecord_hrms_month_yearid = ' + yearId + ' ';
sql += 'WHERE E.isinactive = \'F\' ';
sql += '  AND E.subsidiary = ' + subsidiaryId + ' ';
sql += '  AND E.custentity_hris_emppayrollgroup = ' + payGroupId + ' ';
sql += '  AND E.hiredate <= TO_DATE(\'' + wageEndDateStr + '\', \'DD/MM/YYYY\') ';

// **STATUS CONDITION MOVED TO WHERE CLAUSE**
sql += ' AND (MA.id IS NULL '; // No attendance record
sql += ' OR MA.custrecord_njt_hrms_monthly_status IS NULL '; // Status is NULL
sql += ' OR MA.custrecord_njt_hrms_monthly_status = \'\' ) ';       // OR Status = 2

// Optional: Employee Category
if (empCatId && empCatId !== '' && empCatId !== 'null') {
    sql += ' AND E.custentity_hris_empcategory = ' + empCatId + ' ';
}

// Optional: Specific Employee
if (employeeId && employeeId !== '' && employeeId !== 'null') {
    sql += ' AND E.id = ' + employeeId + ' ';
}

sql += 'ORDER BY E.entityid';

            log.audit({ title: 'Final SuiteQL Query', details: sql });

            /********************************
             * STEP 3: Execute Query
             * Run the constructed SuiteQL query.
             ********************************/
            var resultSet = query.runSuiteQL({ query: sql });
            var records = resultSet.asMappedResults(); // Get results as an array of mapped objects

            /********************************
             * STEP 4: Populate Sublist (using for loop with checks)
             * Iterate through the query results and set values in the sublist.
             ********************************/
            for (var i = 0; i < records.length; i++) {
                var rec = records[i]; // Current record object

                // Build Employee Display Name from code and name
                var empDisplay = '';
                var employeeCode = safeValue(rec.employee_code, '');
                var employeeName = safeValue(rec.employee_name, '');

                if (employeeCode) {
                    empDisplay += employeeCode;
                }
                if (employeeName) {
                    if (empDisplay) { // Add a space if code is already present
                        empDisplay += ' ';
                    }
                    empDisplay += employeeName;
                }
                empDisplay = empDisplay.trim(); // Trim any leading/trailing spaces

                /***********************
                 * 1. Employee Internal ID (custpage_de_empid)
                 ***********************/
                sublist.setSublistValue({
                    id: 'custpage_de_empid',
                    line: i,
                    value: safeValue(rec.employee_internal_id, '')
                });
                sublist.setSublistValue({
                    id: 'custpage_de_empcode',
                    line: i,
                    value: safeValue(rec.employee_intcode, null)
                });
                /***********************
                 * 2. Employee Name (custpage_de_empname)
                 ***********************/
                sublist.setSublistValue({
                    id: 'custpage_de_empname',
                    line: i,
                    value: safeValue(employeeCode, '')
                });

                /***********************
                 * 3. Employee Category (custpage_de_empcat)
                 ***********************/
                sublist.setSublistValue({
                    id: 'custpage_de_empcat',
                    line: i,
                    value: safeValue(rec.emp_category_id, null)
                });

                /***********************
                 * 4. Month (custpage_de_month)
                 ***********************/
                sublist.setSublistValue({
                    id: 'custpage_de_month',
                    line: i,
                    value: safeValue(monthId, null)
                });

                /***********************
                 * 5. Year (custpage_de_year)
                 ***********************/
                sublist.setSublistValue({
                    id: 'custpage_de_year',
                    line: i,
                    value: safeValue(yearId, null)
                });

                /***********************
                 * 6. Present Days (custpage_de_present)
                 ***********************/
                sublist.setSublistValue({
                    id: 'custpage_de_present',
                    line: i,
                    value: safeValue(rec.present_days, '0') // Default to '0' if null/empty
                });

                /***********************
                 * 7. Absent Days (custpage_de_absent)
                 ***********************/
                sublist.setSublistValue({
                    id: 'custpage_de_absent',
                    line: i,
                    value: safeValue(rec.absent_days, '0') // Default to '0' if null/empty
                });

                /*******************************
                 * 8. Monthly Attendance Child ID (custpage_de_chilid)
                 * This is the internal ID of the custom record, used for updates/processing.
                 *******************************/
                sublist.setSublistValue({
                    id: 'custpage_de_chilid',
                    line: i,
                    value: safeValue(rec.monthly_attendance_id, '0') // Default to '0' if no record exists
                });
            }

        } catch (err) {
            log.error({ title: 'populateSublist Error', details: err.message || err });
        }
    }

    // Return the onRequest function as the entry point for the Suitelet
    return { onRequest: onRequest };
});