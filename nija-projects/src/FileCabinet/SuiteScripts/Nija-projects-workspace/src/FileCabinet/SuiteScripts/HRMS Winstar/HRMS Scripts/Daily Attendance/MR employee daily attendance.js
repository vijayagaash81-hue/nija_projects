/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(["N/record", "N/search", "N/log", "N/format", "N/query", "N/runtime"], function (
    record,
    search,
    log,
    format,
    query,
    runtime
) {
    // Mapping of years to internal IDs
    var yearMapping = {
        2024: 6,
        2025: 7,
    };
    var weeklyOffMapping = {
        "sunday": "1",
        "monday": "2",
        "tuesday": "3",
        "wednesday": "4",
        "thursday": "5",
        "friday": "6",
        "saturday": "7"
    };

    /**
     * Retrieves input data for the Map stage.
     * @return {Array} The array of employee objects from the SuiteQL query.
     */
    function getInputDataold() {
        // Retrieve script parameter
        var scriptParams = runtime.getCurrentScript().getParameter({ name: 'custscript_hris_dailyemplist' });
        log.debug({ title: 'Script Parameters', details: scriptParams });

        var params;
        try {
            params = JSON.parse(scriptParams);
        } catch (e) {
            log.error({ title: 'Parameter Parse Error', details: 'Failed to parse custscript_hris_dailyemplist: ' + e.toString() });
            return [];
        }

        if (!Array.isArray(params) || params.length === 0) {
            log.error({ title: 'Invalid Parameters', details: 'custscript_hris_dailyemplist is empty or not an array' });
            return [];
        }

        // Extract parameters
        var param = params[0]; // Assuming single object as per provided format
        var monthToCreate = parseInt(param.paymonth, 10);
        var yearId = parseInt(param.payyear, 10);

        // Parse employee IDs from string like "(94801,94806)"
        var employeeIds = param.employee
            .slice(1, -1) // Remove parentheses
            .split(',') // Split by comma
            .map(function (id) { return id.trim(); }); // Trim whitespace

        if (!employeeIds.length || isNaN(monthToCreate) || isNaN(yearId)) {
            log.error({ title: 'Invalid Parameter Values', details: 'Missing or invalid employee, month, or year' });
            return [];
        }

        var today = new Date();
        var dateString = format.format({
            value: today,
            type: format.Type.DATE
        });

        log.debug({ title: 'Formatted Current Date', details: dateString });
        // Construct SuiteQL query with multiple employee IDs
        var sqlQuery =
            "SELECT id, hiredate FROM employee WHERE  custentity_hris_emp_employeecheck='T' and isinactive='F' hiredate <= '" +
            dateString +
            "' AND id IN ('" +
            employeeIds.join("', '") + // Add quotes around IDs
            "')";
        log.audit({ title: 'sqlquery', details: sqlQuery });

        try {
            var results = query.runSuiteQL({
                query: sqlQuery
            }).asMappedResults();

            log.debug({ title: 'Result Count', details: results.length });
            // Attach parameters to results for use in map phase
            results.forEach(function (result) {
                result.monthToCreate = monthToCreate;
                result.yearId = yearId;
            });
            return results;
        } catch (e) {
            log.error({ title: 'SuiteQL Error', details: e.toString() });
            return [];
        }
    }
    function getInputData() {
        // Retrieve script parameter
        var scriptParams = runtime.getCurrentScript().getParameter({ name: 'custscript_hris_dailyemplist' });
        log.debug({ title: 'Script Parameters', details: scriptParams });

        var params;
        try {
            params = JSON.parse(scriptParams);
        } catch (e) {
            log.error({ title: 'Parameter Parse Error', details: 'Failed to parse custscript_hris_dailyemplist: ' + e.toString() });
            return [];
        }

        if (!Array.isArray(params) || params.length === 0) {
            log.error({ title: 'Invalid Parameters', details: 'custscript_hris_dailyemplist is empty or not an array' });
            return [];
        }

        // Extract parameters
        var param = params[0]; // Assuming single object as per provided format
        var monthToCreate = parseInt(param.paymonth, 10);
        var yearId = parseInt(param.payyear, 10);

        // Parse employee IDs from string like "(94801,94806)"
        if (param.employee != '') {
            var employeeIds = param.employee
                .slice(1, -1) // Remove parentheses
                .split(',') // Split by comma
                .map(function (id) { return id.trim(); });

        }
        // Trim whitespace

        if (isNaN(monthToCreate) || isNaN(yearId)) {
            log.error({ title: 'Invalid Parameter Values', details: 'Missing or invalid employee, month, or year' });
            return [];
        }

        var today = new Date();
        var dateString = format.format({
            value: today,
            type: format.Type.DATE
        });

        log.debug({ title: 'Formatted Current Date', details: dateString });
        // Construct SuiteQL query with multiple employee IDs

        if (employeeIds) {
            var sqlQuery =
                "SELECT id, hiredate FROM employee WHERE isinactive='F' and  custentity_hris_emp_employeecheck='T' and hiredate <= '" +
                dateString +
                "' AND id IN ('" +
                employeeIds.join("', '") +
                "')";
        }
        else {

            var sqlQuery =
                "SELECT id, hiredate FROM employee WHERE  isinactive='F' and custentity_hris_emp_employeecheck='T' and  hiredate <= '" +
                dateString +
                "' ";

        }
        /*   var sqlQuery =
            "SELECT id, hiredate FROM employee WHERE hiredate <= '" +
            dateString +
            "' AND id IN ('" +
            employeeIds.join("', '") + 
            "')"; */




        log.audit({ title: 'sqlquery', details: sqlQuery });

        try {
            var results = query.runSuiteQL({
                query: sqlQuery
            }).asMappedResults();

            log.debug({ title: 'Result Count', details: results.length });
            // Attach parameters to results for use in map phase
            results.forEach(function (result) {
                result.monthToCreate = monthToCreate;
                result.yearId = yearId;
            });
            return results;
        } catch (e) {
            log.error({ title: 'SuiteQL Error', details: e.toString() });
            return [];
        }
    }
    /**
     * Maps each employee record for attendance creation.
     * @param {Object} context - The context object containing the SuiteQL result.
     */
    function map(context) {
        var result = JSON.parse(context.value);
        var employeeId = result.id;
        var monthcreateId = result.monthToCreate;
        log.debug("monthId", monthcreateId);
        var yearcreateId = result.yearId;
        log.debug("yearcreateId", yearcreateId);
        var hireDateStr = result.hiredate;

        log.emergency("Processing Employee", {
            employeeId: employeeId,
            hireDateStr: hireDateStr,
        });

        // Set target attendance month and year
        var monthToCreate = monthcreateId; // e.g., July
        var yearId = yearcreateId; // Internal ID for 2025
        // var currentYear = 2025; // Logic-based year for this run
        log.debug("yearId", yearId);
        var currentYear = getyearname(yearId);
        log.debug('currentYear', currentYear)
        // Parse the hire date
        var hireDate = hireDateStr
            ? format.parse({ value: hireDateStr, type: format.Type.DATE })
            : null;
        var hireYear = hireDate ? hireDate.getFullYear() : null;
        var hireMonth = hireDate ? hireDate.getMonth() + 1 : null;

        // Skip if employee was hired after or during the target month
        if (
            hireDate &&
            (hireYear > currentYear ||
                (hireYear === currentYear && hireMonth > monthToCreate))
        ) {
            log.debug(
                "Skipping employee",
                "Hire date is after target month: " + hireDate
            );
            return;
        }

        // Check for existing record
        var existingRecordId = findExistingRecord(employeeId, yearId, monthToCreate);
        if (existingRecordId) {
            log.debug(
                "Record Exists",
                "Record already exists with ID: " + existingRecordId
            );
            return;
        }

        try {
            log.emergency("checkifparentreccreateornot");
            // Create parent record
            var attendanceRecord = record.create({
                type: "customrecord_njt_emp_daily_attendance",
                isDynamic: true,
            });

            attendanceRecord.setValue({
                fieldId: "custrecord_njt_emp_atten_employee",
                value: employeeId,
            });

            attendanceRecord.setValue({
                fieldId: "custrecord_njt_emp_atten_month",
                value: monthToCreate,
            });

            attendanceRecord.setValue({
                fieldId: "custrecord_njt_emp_atten_year",
                value: yearId,
            });

            // Call sublist record creation with hire date
            createSublistRecords(
                attendanceRecord,
                currentYear,
                monthToCreate,
                employeeId,
                hireDate
            );

            var parentRecordId = attendanceRecord.save();
            log.emergency("Parent Record ID", parentRecordId);

            if (parentRecordId) {
                // Calculate the start and end dates for the month
                var daysInMonth = new Date(currentYear, monthToCreate, 0).getDate();
                var startDate = format.format({
                    value: new Date(currentYear, monthToCreate - 1, 1),
                    type: format.Type.DATE
                });
                var endDate = format.format({
                    value: new Date(currentYear, monthToCreate - 1, daysInMonth),
                    type: format.Type.DATE
                });

                // Check if the employee has a duty roster for the specified month and year
                var hasDutyRoster = false;
                var weeklyOffValue = null;
                try {
                    var dutyRosterCheck = query.runSuiteQL({
                        query:
                            "SELECT COUNT(*) AS count, A.custrecord_hris_duty_res_weeklyoff AS weekly_off " +
                            "FROM customrecord_hris_duty_ros_details B " +
                            "JOIN customrecord_hris_duty_res_plan A ON A.id = B.custrecord_hris_duty_ros_link " +
                            "WHERE A.custrecord_hris_duty_res_approval_status =2 and B.custrecord_hris_employee_name_duty_ros = ? " +
                            "AND B.custrecord_hris_duty_ros_date >= TO_DATE(?, 'DD/MM/YYYY') " +
                            "AND B.custrecord_hris_duty_ros_date <= TO_DATE(?, 'DD/MM/YYYY') " +
                            "GROUP BY A.custrecord_hris_duty_res_weeklyoff",
                        params: [employeeId, startDate, endDate],
                    }).asMappedResults();

                    if (dutyRosterCheck.length > 0 && dutyRosterCheck[0].count > 0) {
                        hasDutyRoster = true;
                        weeklyOffValue = dutyRosterCheck[0].weekly_off || null;
                    }
                    log.debug(
                        "Duty Roster Check",
                        "Employee: " + employeeId +
                        " | Start Date: " + startDate +
                        " | End Date: " + endDate +
                        " | Has Duty Roster: " + hasDutyRoster +
                        " | Weekly Off: " + weeklyOffValue
                    );
                } catch (e) {
                    log.error(
                        "Duty Roster Check Error",
                        "Employee: " + employeeId + " | Error: " + e.toString()
                    );
                }

                if (hasDutyRoster) {
                    // Update employee record with weekly off value
                    if (weeklyOffValue) {
                        try {
                            // Convert weekly off value to an array of internal IDs
                            var weeklyOffArray = [];
                            var weeklyOffString = String(weeklyOffValue).trim();
                            log.debug("Raw weeklyOffValue", weeklyOffString);

                            if (weeklyOffString.indexOf(',') !== -1) {
                                weeklyOffArray = weeklyOffString.split(',').map(function (value) {
                                    var trimmedValue = value.trim().toLowerCase();
                                    if (weeklyOffMapping[trimmedValue]) {
                                        return weeklyOffMapping[trimmedValue];
                                    }
                                    return trimmedValue;
                                }).filter(function (value) {
                                    return value !== null && value !== '';
                                });
                            } else {
                                var trimmedValue = weeklyOffString.toLowerCase();
                                weeklyOffArray = [weeklyOffMapping[trimmedValue] || trimmedValue];
                            }

                            if (weeklyOffArray.length > 0) {
                                var employeeRecord = record.load({
                                    type: record.Type.EMPLOYEE,
                                    id: employeeId,
                                    isDynamic: true,
                                });

                                employeeRecord.setValue({
                                    fieldId: "custentity_hris_empweeklyoffs",
                                    value: weeklyOffArray
                                });

                                //employeeRecord.save();
                                var updatedemployeeID = employeeRecord.save({
                                    enableSourcing: true,
                                    ignoreMandatoryFields: true
                                });
                                log.debug('Updated Employee Id', updatedemployeeID);
                                log.debug(
                                    "Employee Weekly Off Updated",
                                    "Employee: " + employeeId + " | Weekly Off Values: " + weeklyOffArray.join(',')
                                );
                            } else {
                                log.debug(
                                    "No Valid Weekly Off Values",
                                    "No valid weekly off values after processing for Employee: " + employeeId
                                );
                            }
                        } catch (e) {
                            log.error(
                                "Error Updating Employee Weekly Off",
                                "Employee: " + employeeId + " | Error: " + e.toString()
                            );
                        }
                    } else {
                        log.debug(
                            "No Weekly Off Value",
                            "No valid weekly off value found for Employee: " + employeeId
                        );
                    }

                    try {
                        setDutyRosterAttendance(
                            attendanceRecord,
                            currentYear,
                            monthToCreate,
                            employeeId,
                            record
                        );
                        log.debug("setDutyRosterAttendance", "Executed successfully");
                    } catch (e) {
                        log.error("Error in setDutyRosterAttendance", e.message || e);
                    }
                } else {
                    try {
                        setweeklyoffvalue(
                            attendanceRecord,
                            currentYear,
                            monthToCreate,
                            employeeId
                        );
                        log.debug("setweeklyoffvalue", "Executed successfully");
                    } catch (e) {
                        log.error("Error in setweeklyoffvalue", e.message || e);
                    }

                    try {
                        setpublicholidaysfunc(
                            attendanceRecord,
                            currentYear,
                            monthToCreate,
                            employeeId
                        );
                        log.debug("setpublicholidaysfunc", "Executed successfully");
                    } catch (e) {
                        log.error("Error in setpublicholidaysfunc", e.message || e);
                    }
                }

                log.emergency("callornot", "Reached after all functions");

                try {
                    setleavedays(attendanceRecord, currentYear, monthToCreate, employeeId,parentRecordId);
                    log.debug("setleavedays", "Executed successfully");
                } catch (e) {
                    log.error("Error in setleavedays", e.message || e);
                }
            }
        } catch (e) {
            log.error("Error Creating Record", e.toString());
        }
    }

    /**
     * Finds an existing record for the given employee, year, and month.
     * @param {number} employeeId - The employee ID.
     * @param {number} yearId - The year ID.
     * @param {number} month - The month to check.
     * @return {string|null} The internal ID of the existing record, or null if no record exists.
     */
    function findExistingRecord(employeeId, yearId, month) {
        log.debug("Find Existing Record Parameters", {
            employeeId: employeeId,
            yearId: yearId,
            month: month,
        });

        var existingRecordSearch = search.create({
            type: "customrecord_njt_emp_daily_attendance",
            filters: [
                ["custrecord_njt_emp_atten_employee", "anyof", employeeId],
                "AND",
                ["custrecord_njt_emp_atten_month", "anyof", month],
                "AND",
                ["custrecord_njt_emp_atten_year", "anyof", yearId],
            ],
            columns: ["internalid"],
        });

        var searchResult = existingRecordSearch.run().getRange({
            start: 0,
            end: 1,
        });

        log.debug("Search Result Length", searchResult.length);
        if (searchResult.length > 0) {
            var recordId = searchResult[0].getValue("internalid");
            log.debug("Found Record ID", recordId);
            return recordId;
        } else {
            log.debug(
                "No Record Found",
                "No existing record found for employee ID: " +
                employeeId +
                ", year ID: " +
                yearId +
                ", month: " +
                month
            );
        }

        return null;
    }

    /**
     * Formats a date to D/M/YYYY string.
     * @param {Date} date - The date to format.
     * @return {string} The formatted date string.
     */
    function formatDateToDMYYYY(date) {
        var day = date.getDate();
        var month = date.getMonth() + 1; // Months are 0-based
        var year = date.getFullYear();
        return day + "/" + month + "/" + year;
    }

    /**
     * Creates sublist records for each day in the given month and year, starting from hire date.
     * @param {Record} attendanceRecord - The parent record to which sublist lines are added.
     * @param {number} year - The year for the sublist records.
     * @param {number} month - The month for the sublist records (1-indexed).
     * @param {number} employeeId - The employee ID.
     * @param {Date|null} hireDate - The hire date of the employee.
     */
    function createSublistRecords(
        attendanceRecord,
        year,
        month,
        employeeId,
        hireDate
    ) {
        var daysInMonth = new Date(year, month, 0).getDate();
        log.debug("Days in Month", daysInMonth);

        var sublistId = "recmachcustrecord_njt_emp_daily_parent";

        var startDay = 1;
        if (
            hireDate &&
            hireDate.getFullYear() === year &&
            hireDate.getMonth() + 1 === month
        ) {
            startDay = hireDate.getDate();
            log.debug("Adjusted Start Day", "Starting from hire date: " + startDay);
        } else {
            log.debug(
                "Using Default Start Day",
                "Hire date not in same month/year, starting from day 1"
            );
        }

        for (var day = startDay; day <= daysInMonth; day++) {
            try {
                var date = new Date(year, month - 1, day);
                var formattedDate = formatDateToDMYYYY(date);
                var parsedDate = format.parse({
                    value: formattedDate,
                    type: format.Type.DATE,
                });
                var dayOfWeek = getDayOfWeek(date);
                if (hireDate && parsedDate < hireDate) {
                    continue;
                }

                attendanceRecord.selectNewLine({ sublistId: sublistId });

                attendanceRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: "custrecord_njt_emp_daily_date",
                    value: parsedDate,
                });

                attendanceRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: "custrecord_njt_emp_daily_enddate",
                    value: parsedDate,
                });
              attendanceRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: "custrecord_njt_emp_daily_project",
                    value: 1,
                });

                attendanceRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: "custrecord_njt_emp_daily_day",
                    value: dayOfWeek,
                });

                attendanceRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: "custrecord_njt_daily_atten_emp",
                    value: employeeId,
                });

                // Set attendance type to empty (no default value)
                /*  attendanceRecord.setCurrentSublistValue({
                   sublistId: sublistId,
                   fieldId: "custrecord_njt_emp_daily_intatt",
                   value: '',
                 }); */
                attendanceRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: "custrecord_njt_emp_daily_intatt",
                    value: 23,
                });

                // Set working hours to empty
                var normalworkinghoursresult = getnormalworkinghours();

                var normalworkinghoursresultdetails = normalworkinghoursresult.split("#");

                var normalworkinghours = normalworkinghoursresultdetails[0]; // "08:30"
                var lunchtime = normalworkinghoursresultdetails[1];
                var shiftmaster = normalworkinghoursresultdetails[2];
                attendanceRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: "custrecord_njt_emp_daily_working_hours",
                    value: normalworkinghours,
                });
                attendanceRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: "custrecord_njt_emp_daily_lunch_time",
                    value: lunchtime,
                });
                attendanceRecord.setCurrentSublistValue({
                    sublistId: sublistId,
                    fieldId: "custrecord_hris_shiftmaser",
                    value: shiftmaster,
                    ignoreFieldChange: false
                });

                attendanceRecord.commitLine({ sublistId: sublistId });

                log.debug(
                    "Sublist Line Added",
                    "Employee: " +
                    employeeId +
                    " | Date: " +
                    formattedDate +
                    " | Day: " +
                    dayOfWeek +
                    " | Attendance Type: Empty" +
                    " | Working Hours: Empty"
                );
            } catch (e) {
                log.error("Error Adding Sublist Line", "Day: " + day + " | Error: " + e.toString());
            }
        }
    }

    /**
     * Gets the day of the week for a given date.
     * @param {Date} date - The date to get the day of the week for.
     * @return {string} The day of the week.
     */
    function getDayOfWeek(date) {
        var days = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];
        return days[date.getDay()];
    }

    /**
     * Sets attendance based on duty roster for eligible employees.
     * @param {Record} attendanceRecord - The parent attendance record.
     * @param {number} year - The target year.
     * @param {number} month - The target month.
     * @param {number} employeeId - The employee ID.
     */
    function setDutyRosterAttendance(attendanceRecord, year, month, employeeId,record) {
        var daysInMonth = new Date(year, month, 0).getDate();
        var startDay = 1;
        var endDay = daysInMonth;
        var dutycheck = false;

        for (var day = startDay; day <= endDay; day++) {
            var date = new Date(year, month - 1, day);
            var formattedDate = formatDateToDMYYYY(date);

            try {
                var dutyResult = query.runSuiteQL({
                    query:
                        "SELECT A.id as dutyplanid,B.id as dutyroastdetid,B.custrecord_hris_duty_type_ros, A.custrecord_hris_duty_res_weeklyoff, B.custrecord_hris_duty_ros_wohours, B.custrecord_hris_duty_type_ros, " +
                        "B.custrecord_hris_duty_ros_otcalweekday,B.custrecord_hris_duty_ros_enddate,B.custrecord_hris_duty_ros_lunchtime FROM customrecord_hris_duty_ros_details B " +
                        "JOIN customrecord_hris_duty_res_plan A ON A.id = B.custrecord_hris_duty_ros_link " +
                        "WHERE A.custrecord_hris_duty_res_approval_status =2 and B.custrecord_hris_employee_name_duty_ros = ? AND B.custrecord_hris_duty_ros_date = ?",
                    params: [employeeId, formattedDate],
                }).asMappedResults();

                log.debug("Duty Roster Query Result", dutyResult);

                var childRecordQuery = query.runSuiteQL({
                    query:
                        "SELECT id, custrecord_njt_emp_daily_intatt FROM customrecord_njt_emp_daily_atten_ch " +
                        "WHERE custrecord_njt_daily_atten_emp = ? AND custrecord_njt_emp_daily_date = ?",
                    params: [employeeId, formattedDate],
                }).asMappedResults();

                log.debug("Child Record Query Result", childRecordQuery);

                if (childRecordQuery.length > 0) {
                    var attendanceChildId = childRecordQuery[0].id;
                    var currentAttenType = childRecordQuery[0].custrecord_njt_emp_daily_intatt;
                    // changed after present upload
                    // if (!currentAttenType || currentAttenType === "") {
                    if (!currentAttenType || currentAttenType == 23) {

                        /*  var newAttenType = '';
                         var workTtype = '';
                         var actualHours = ''; */

                        var newAttenType = 23;
                        var workTtype = 1;
                        var actualHours = '';
                        // var otweeklyoffcalc = false;

                        if (dutyResult.length > 0) {
                            var dutyType = dutyResult[0].custrecord_hris_duty_type_ros;
                            actualHours = dutyResult[0].custrecord_hris_duty_ros_wohours;
                            var workingType = dutyResult[0].custrecord_hris_duty_type_ros;
                            var dutyroastdetid = dutyResult[0].dutyroastdetid;
                            var dutyplanid = dutyResult[0].dutyplanid;
                            log.emergency('dutyplanid',dutyplanid);
                            var otweeklyoffcalc = dutyResult[0].custrecord_hris_duty_ros_otcalweekday;
                            var dutyenddate = dutyResult[0].custrecord_hris_duty_ros_enddate || '';
                            log.emergency('otweeklyoffcalc', otweeklyoffcalc);
                            var lunchtime = dutyResult[0].custrecord_hris_duty_ros_lunchtime;
                            if (otweeklyoffcalc == 'T') {
                                var otweekly = true;
                            }
                            else {
                                var otweekly = false;
                            }
                            if (dutyType == 2) {
                                newAttenType = 21; // Weekly Off
                                workTtype = 2; // Weekly Off
                            } else if (dutyType == 3) {
                                newAttenType = 19; // Public Holiday
                                workTtype = 3; // Public Holiday
                            }
                            // If dutyType is not 2 or 3, newAttenType and workTtype remain empty
                        }
                        // If dutyResult.length == 0, newAttenType and workTtype remain empty

                        try {
                            var attendanceChildRecord = record.load({
                                type: "customrecord_njt_emp_daily_atten_ch",
                                id: attendanceChildId,
                                isDynamic: true,
                            });
                            log.emergency('newAttenType', newAttenType);
                            attendanceChildRecord.setValue({
                                fieldId: "custrecord_njt_emp_daily_intatt",
                                value: newAttenType,
                            });
                            if (dutyenddate != '') {

                                var formatdutyenddate = format.parse({
                                    value: dutyenddate,
                                    type: format.Type.DATE
                                });
                                attendanceChildRecord.setValue({
                                    fieldId: "custrecord_njt_emp_daily_enddate",
                                    value: formatdutyenddate,
                                });


                            }
                            attendanceChildRecord.setValue({
                                fieldId: "custrecord_njt_emp_daily_lunch_time",
                                value: lunchtime,
                            });

                            attendanceChildRecord.setValue({
                                fieldId: "custrecord_hris_dutyrosterplan",
                                value: dutyplanid,
                            });
                            /*  attendanceChildRecord.setValue({
                               fieldId: "custrecord_njt_emp_daily_working_hours",
                               value: newAttenType === '' ? '' : (actualHours || ''),
                             }); */

                            //  Modify after present uploaded
                            /*  if (newAttenType == '') {
                               attendanceChildRecord.setValue({
                                 fieldId: "custrecord_njt_emp_daily_working_hours",
                                 value: actualHours,
                               });
                             }
                             else {
                               attendanceChildRecord.setValue({
                                 fieldId: "custrecord_njt_emp_daily_working_hours",
                                 value: '',
                               });
                             } */
                            // if (newAttenType == '') {
                            attendanceChildRecord.setValue({
                                fieldId: "custrecord_njt_emp_daily_working_hours",
                                value: actualHours,
                            });
                            /*   }
                              else {
                                attendanceChildRecord.setValue({
                                  fieldId: "custrecord_njt_emp_daily_working_hours",
                                  value: '',
                                });
                              } */
                            // changed by as per duty
                            /*  attendanceChildRecord.setValue({
                               fieldId: "custrecord_hris_emp_ch_timing_type",
                               value: workTtype,
                             }); */
                            attendanceChildRecord.setValue({
                                fieldId: "custrecord_hris_emp_ch_timing_type",
                                value: workingType,
                            });
                            attendanceChildRecord.setValue({
                                fieldId: "custrecord_hris_emp_daily_attendance_ros",
                                value: dutyroastdetid
                            });

                            if (otweeklyoffcalc == 'T') {
                                attendanceChildRecord.setValue({
                                    fieldId: "custrecord_hris_duty_ros_otcalweekday",
                                    value: otweekly
                                });
                            }
                            else {
                                attendanceChildRecord.setValue({
                                    fieldId: "custrecord_hris_duty_ros_otcalweekday",
                                    value: otweekly
                                });
                            }


                            attendanceChildRecord.save();
                             var updateddutyplanid = record.submitFields({
                type: 'customrecord_hris_duty_res_plan',
                id: dutyplanid,
                values: {
                    'custrecord_hris_duty_res_updatedailyatte': true,

                }
            });
            log.emergency('Dutyplanid', updateddutyplanid);
                            dutycheck = true;
                            log.debug(
                                "Updated Duty Roster Attendance",
                                "Employee: " +
                                employeeId +
                                " | Date: " +
                                formattedDate +
                                " | Attendance Type: " +
                                (newAttenType || 'Empty') +
                                " | Working Hours: " +
                                (newAttenType === '' ? 'Empty' : (actualHours || 'Empty')) +
                                " | Timing Type: " +
                                (workTtype || 'Empty')
                            );
                        } catch (e) {
                            dutycheck = false;
                            log.error(
                                "Error Updating Duty Roster Attendance",
                                "Employee: " +
                                employeeId +
                                " | Date: " +
                                formattedDate +
                                " | Error: " +
                                e.toString()

                            );
                        }
                    }
                }
            } catch (e) {
                log.error(
                    "Error Processing Duty Roster for Date",
                    "Employee: " + employeeId + " | Date: " + formattedDate + " | Error: " + e.toString()
                );
            }
        }
       // if (dutycheck == true) {

           
       // }

    }

    /**
     * Sets weekly off values for the employee.
     * @param {Record} attendanceRecord - The parent attendance record.
     * @param {number} yearId - The year ID.
     * @param {number} monthId - The month ID.
     * @param {number} employeeId - The employee ID.
     */
    function setweeklyoffvalue(attendanceRecord, yearId, monthId, employeeId) {

        /*  var setsqlquery =
             "SELECT BUILTIN.DF(B.custentity_hris_empweeklyoffs) AS weekly_off, A.custrecord_njt_emp_daily_date, " +
             "A.custrecord_njt_emp_daily_intatt, A.id AS attendance_child_id, A.custrecord_njt_emp_daily_day, " +
             "custentity_hris_empholidays AS holidays FROM employee AS B INNER JOIN customrecord_njt_emp_daily_atten_ch AS A " +
             "ON B.id = A.custrecord_njt_daily_atten_emp WHERE B.id = " +
             employeeId; */
        var setsqlquery =
            "SELECT BUILTIN.DF(B.custentity_hris_empweeklyoffs) AS weekly_off, A.custrecord_njt_emp_daily_date, " +
            "A.custrecord_njt_emp_daily_intatt, A.id AS attendance_child_id, A.custrecord_njt_emp_daily_day, " +
            "custentity_hris_empholidays AS holidays FROM employee AS B INNER JOIN customrecord_njt_emp_daily_atten_ch AS A " +
            "ON B.id = A.custrecord_njt_daily_atten_emp WHERE B.id = " +
            employeeId + "and  TO_CHAR(A.custrecord_njt_emp_daily_date, 'YYYY') = '" + yearId + "' AND EXTRACT(MONTH FROM A.custrecord_njt_emp_daily_date) = " + monthId + ""
        log.debug("SQL Query setfunc", setsqlquery);
        var records = getResult(setsqlquery);
        log.debug("recordsforsetfunc", records);

        var dayMap = {
            0: "sunday",
            1: "monday",
            2: "tuesday",
            3: "wednesday",
            4: "thursday",
            5: "friday",
            6: "saturday",
            sun: "sunday",
            mon: "monday",
            tue: "tuesday",
            wed: "wednesday",
            thu: "thursday",
            fri: "friday",
            sat: "saturday",
        };

        for (var i = 0; i < records.length; i++) {
            var result = records[i];
            var weeklyOff = result.weekly_off;
            var dailyDay = result.custrecord_njt_emp_daily_day;
            var attendanceChildId = result.attendance_child_id;
            var setAttenId = result.custrecord_njt_emp_daily_intatt;
            var attendanceDate = result.custrecord_njt_emp_daily_date;

            log.debug(
                "Raw Values",
                "Employee: " +
                employeeId +
                " | Date: " +
                attendanceDate +
                " | dailyDay: " +
                dailyDay +
                " | weeklyOff: " +
                weeklyOff
            );

            if (weeklyOff && (setAttenId == null || setAttenId == 23)) {
                var weekoffIds = weeklyOff.split(",").map(function (id) {
                    return id.trim().toLowerCase();
                });
                log.debug("weekoffIds", weekoffIds);

                var normalizedDailyDay = dailyDay
                    ? dayMap[dailyDay.toLowerCase()] || dailyDay.trim().toLowerCase()
                    : "";
                log.debug(
                    "Comparing dailyDay",
                    "normalizedDailyDay: " + normalizedDailyDay
                );

                var isWeeklyOff = false;
                for (var j = 0; j < weekoffIds.length; j++) {
                    if (weekoffIds[j] == normalizedDailyDay) {
                        isWeeklyOff = true;
                        try {
                            var attendanceChildRecord = record.load({
                                type: "customrecord_njt_emp_daily_atten_ch",
                                id: attendanceChildId,
                                isDynamic: true,
                            });

                            attendanceChildRecord.setValue({
                                fieldId: "custrecord_njt_emp_daily_intatt",
                                value: 21, // Weekly Off
                            });
                            attendanceChildRecord.setValue({
                                fieldId: "custrecord_njt_emp_daily_working_hours",
                                value: '',
                            });

                            attendanceChildRecord.save();
                            log.debug(
                                "Updated Weekly Off",
                                "Employee: " +
                                employeeId +
                                " | Date: " +
                                attendanceDate +
                                " | Day: " +
                                dailyDay +
                                " | Working Hours: Empty"
                            );
                            break;
                        } catch (e) {
                            log.error(
                                "Error Updating Weekly Off",
                                "Employee: " +
                                employeeId +
                                " | Date: " +
                                attendanceDate +
                                " | Error: " +
                                e.toString()
                            );
                        }
                    }
                }

                /*  if (!isWeeklyOff) {
                     log.debug(
                         "Non-Weekly Off Day",
                         "Employee: " +
                         employeeId +
                         " | Date: " +
                         attendanceDate +
                         " | Day: " +
                         dailyDay +
                         " not in " +
                         weekoffIds
                     );
                     try {
                         var attendanceChildRecord = record.load({
                             type: "customrecord_njt_emp_daily_atten_ch",
                             id: attendanceChildId,
                             isDynamic: true,
                         });
 
                         attendanceChildRecord.setValue({
                             fieldId: "custrecord_njt_emp_daily_intatt",
                             value: 23, // Non-weekly off day
                         });
 
                                             attendanceChildRecord.setValue({
                             fieldId: "custrecord_njt_emp_daily_working_hours",
                             value: '',
                         });
 
                         attendanceChildRecord.save();
                         log.debug(
                             "Updated Non-Weekly Off",
                             "Employee: " +
                             employeeId +
                             " | Date: " +
                             attendanceDate +
                             " | Day: " +
                             dailyDay +
                             " | Working Hours: Empty"
                         );
                     } catch (e) {
                         log.error(
                             "Error Updating Non-Weekly Off",
                             "Employee: " +
                             employeeId +
                             " | Date: " +
                             attendanceDate +
                             " | Error: " +
                             e.toString()
                         );
                     }
                 } */
            } else {
                log.debug(
                    "Skipping Weekly Off",
                    "Attendance ID already set or no weekly off found for Employee: " +
                    employeeId +
                    " | Date: " +
                    attendanceDate
                );
            }
        }
    }

    /**
     * Sets public holidays for the employee.
     * @param {Record} attendanceRecord - The parent attendance record.
     * @param {number} currentYear - The target year.
     * @param {number} monthToCreate - The target month.
     * @param {number} employeeId - The employee ID.
     */
    function setpublicholidaysfunc(
        attendanceRecord,
        currentYear,
        monthToCreate,
        employeeId
    ) {
        var publiholsql =
            "SELECT custrecord_hris_holiday_date FROM customrecord_hris_holiday_master";

        var recordsforpublichol = getResult(publiholsql);
        log.audit("recordsforpublichol", recordsforpublichol);
        var publicHolAttenTypeId = getattendancetypeid(19);
        log.audit("publicHolAttenTypeId", publicHolAttenTypeId);

        if (recordsforpublichol && recordsforpublichol.length > 0) {
            for (var k = 0; k < recordsforpublichol.length; k++) {
                var holidayDate = recordsforpublichol[k].custrecord_hris_holiday_date;
                log.emergency("Holiday Date [" + k + "]", holidayDate);

                var setsqlqueryholiday =
                    "SELECT id FROM customrecord_njt_emp_daily_atten_ch WHERE custrecord_njt_emp_daily_date = '" +
                    holidayDate +
                    "' AND custrecord_njt_daily_atten_emp = " +
                    employeeId;

                log.audit("SQL Query setfunc for publichol", setsqlqueryholiday);
                var recordsholiday = getResult(setsqlqueryholiday);
                log.audit("recordsholidayforsetfunc", recordsholiday);

                for (var z = 0; z < recordsholiday.length; z++) {
                    var result = recordsholiday[z];
                    var Attendancechildid = result.id || "";
                    if (!Attendancechildid) {
                        log.error(
                            "No Attendance Child ID",
                            "Skipping update for holiday date: " + holidayDate
                        );
                        continue;
                    }

                    try {
                        var attendanceRecordchildrec = record.load({
                            type: "customrecord_njt_emp_daily_atten_ch",
                            id: Attendancechildid,
                            isDynamic: true,
                        });

                        attendanceRecordchildrec.setValue({
                            fieldId: "custrecord_njt_emp_daily_intatt",
                            value: publicHolAttenTypeId, // Public Holiday
                        });
                        attendanceRecordchildrec.setValue({
                            fieldId: "custrecord_njt_emp_daily_working_hours",
                            value: '',
                        });

                        attendanceRecordchildrec.save();
                        log.audit(
                            "Attendance Updated",
                            "Attendance type set for child record ID: " + Attendancechildid +
                            " | Working Hours: Empty"
                        );
                    } catch (e) {
                        log.error(
                            "Error Updating Public Holiday",
                            "Child ID: " + Attendancechildid + " | Error: " + e.toString()
                        );
                    }
                }
            }
        }
    }

    /**
     * Updates attendance child records based on approved leave applications
     * @param {Object} attendanceRecord - The parent attendance record
     * @param {number} currentYear - The year to process
     * @param {number} monthToCreate - The month to process
     * @param {number} employeeId - The employee ID to filter leave records
     */
    function setleavedays(attendanceRecord, currentYear, monthToCreate, employeeId,parentRecordId) {

var dailydatesql = "select min( custrecord_njt_emp_daily_date) as minstartdate, max( custrecord_njt_emp_daily_date) as maxstartdate \
     from customrecord_njt_emp_daily_attendance a join customrecord_njt_emp_daily_atten_ch b \
     on a.id = b.custrecord_njt_emp_daily_parent where a.id ="+parentRecordId+"";
log.emergency("dailydatesql", dailydatesql);

        var dailydatesqlrec = getResult(dailydatesql);
        log.emergency("dailydatesqlrec", dailydatesqlrec);
        if(dailydatesqlrec.length > 0){
            var startdate = dailydatesqlrec[0].minstartdate;
            var enddate = dailydatesqlrec[0].maxstartdate;

        /* var leavedetailsquery =
            "SELECT " +
            "A.custrecord_hris_lve_fromdate, " +
            "A.custrecord_hris_lve_employeename AS empidleavapp, " +
            "A.custrecord_hris_lve_todate, " +
            "B.custrecord_hris_lvecnfg_seqno AS seqnum, " +
            "A.custrecord_hris_lve_hrmsapprovalstatus AS leavestatus, " +
            "A.custrecord_hris_attn_type_onleaveapp, " +
            "A.custrecord_hris_lve_cancellation,B.custrecord_hris_lveconfig_unpaid as unpaidcheck " +
            "FROM customrecord_hris_leaveapplication AS A " +
            "INNER JOIN customrecord_hris_leaveconfig AS B " +
            "ON A.custrecord_hris_lve_leavetype = B.id " +
            "WHERE A.custrecord_hris_lve_employeename = " + employeeId + " " +
            "AND A.custrecord_hris_lva_year = " + currentYear + " " +
            "AND A.custrecord_hris_lve_month = " + monthToCreate; */


      
            
            var leavedetailsquery =
    "SELECT " +
    "A.custrecord_hris_lve_fromdate, " +
    "A.custrecord_hris_lve_employeename AS empidleavapp, " +
    "A.custrecord_hris_lve_todate, " +
    "B.custrecord_hris_lvecnfg_seqno AS seqnum, " +
    "A.custrecord_hris_lve_hrmsapprovalstatus AS leavestatus, " +
    "A.custrecord_hris_attn_type_onleaveapp, " +
    "A.custrecord_hris_lve_cancellation, " +
    "B.custrecord_hris_lveconfig_unpaid AS unpaidcheck " +
    "FROM customrecord_hris_leaveapplication AS A " +
    "INNER JOIN customrecord_hris_leaveconfig AS B " +
    "ON A.custrecord_hris_lve_leavetype = B.id " +
    "WHERE A.custrecord_hris_lve_employeename = " + employeeId + " " +
    "AND A.custrecord_hris_lve_fromdate <= TO_DATE('" + enddate + "', 'DD/MM/YYYY') " +
    "AND A.custrecord_hris_lve_todate >= TO_DATE('" + startdate + "', 'DD/MM/YYYY')";


        log.emergency("leavedetailsquery", leavedetailsquery);

        var leavedetialsrec = getResult(leavedetailsquery);
        log.emergency("leavedetialsrec", leavedetialsrec);

        for (var i = 0; i < leavedetialsrec.length; i++) {
            var Leavefromdate = leavedetialsrec[i].custrecord_hris_lve_fromdate;
            log.emergency("Leavefromdate", Leavefromdate);
            var Leavetodate = leavedetialsrec[i].custrecord_hris_lve_todate;
            log.emergency("Leavetodate", Leavetodate);
            var Seqnum = leavedetialsrec[i].seqnum;
            var employeeIdFromLeave = leavedetialsrec[i].empidleavapp;
            var leavestatus = leavedetialsrec[i].leavestatus;
            var leaveType = leavedetialsrec[i].custrecord_hris_attn_type_onleaveapp;
            var cancelchk = leavedetialsrec[i].custrecord_hris_lve_cancellation;
             var unpaidcheck=leavedetialsrec[i].unpaidcheck;
            log.emergency('Unpaidcheck',unpaidcheck);
            log.emergency("cancelchk", cancelchk);

            var matchedAttenTypeId = leaveType;
            log.audit("matchedAttenTypeId", matchedAttenTypeId);

            var weeklyoffAttenTypeId = getattendancetypeid(30);
            log.audit("weeklyoffAttenTypeId", weeklyoffAttenTypeId);
            var publicHolAttenTypeId = getattendancetypeid(19);
            log.audit("publicHolAttenTypeId", publicHolAttenTypeId);

            /*   var presentattentypeid = getattendancetypeid(4);
              log.audit("presentattentypeid", presentattentypeid);
        
         */
            var presentattentypeid = getattendancetypeid(22);
            log.audit("presentattentypeid", presentattentypeid);

            var childAttenDetails = getchildattenid(Leavefromdate, Leavetodate, employeeId,parentRecordId);
            log.audit("childAttenDetails", childAttenDetails);

            for (var j = 0; j < childAttenDetails.length; j++) {
                var attenChildId = childAttenDetails[j].attenchildid;
                var setAttenId = childAttenDetails[j].setattendid;
                var currentDate = childAttenDetails[j].date;
                log.audit("attenChildId[" + j + "]", attenChildId);
                log.audit("setAttenId[" + j + "]", setAttenId);
                log.audit("currentDate[" + j + "]", currentDate);

                 if (
                    leavestatus == 2 &&
                    cancelchk != 'T' &&
                    attenChildId &&
                    unpaidcheck=='T'
                ) {
                    log.emergency("Processing approved leave for update");
                    try {
                        var attendanceChildRecord = record.load({
                            type: "customrecord_njt_emp_daily_atten_ch",
                            id: attenChildId,
                            isDynamic: true,
                        });

                        attendanceChildRecord.setValue({
                            fieldId: "custrecord_njt_emp_daily_intatt",
                            value: matchedAttenTypeId,
                        });
                        attendanceChildRecord.setValue({
                            fieldId: "custrecord_njt_emp_daily_working_hours",
                            value: '',
                        });

                        attendanceChildRecord.save();
                        log.emergency(
                            "Updated Leave",
                            "Child record ID: " + attenChildId +
                            " for date: " + currentDate +
                            " with attendance type: " + matchedAttenTypeId +
                            " | Working Hours: Empty"
                        );
                    } catch (e) {
                        log.error(
                            "Error Updating Leave",
                            "Child ID: " + attenChildId +
                            " | Date: " + currentDate +
                            " | Error: " + e.toString()
                        );
                    }
                }
               else if (
                    leavestatus == 2 &&
                    cancelchk != 'T' &&
                    attenChildId && unpaidcheck =='F'&&
                    setAttenId != weeklyoffAttenTypeId &&
                    setAttenId != publicHolAttenTypeId
                ) {
                    log.emergency("Processing approved leave for update");
                    try {
                        var attendanceChildRecord = record.load({
                            type: "customrecord_njt_emp_daily_atten_ch",
                            id: attenChildId,
                            isDynamic: true,
                        });

                        attendanceChildRecord.setValue({
                            fieldId: "custrecord_njt_emp_daily_intatt",
                            value: matchedAttenTypeId,
                        });
                        attendanceChildRecord.setValue({
                            fieldId: "custrecord_njt_emp_daily_working_hours",
                            value: '',
                        });

                        attendanceChildRecord.save();
                        log.emergency(
                            "Updated Leave",
                            "Child record ID: " + attenChildId +
                            " for date: " + currentDate +
                            " with attendance type: " + matchedAttenTypeId +
                            " | Working Hours: Empty"
                        );
                    } catch (e) {
                        log.error(
                            "Error Updating Leave",
                            "Child ID: " + attenChildId +
                            " | Date: " + currentDate +
                            " | Error: " + e.toString()
                        );
                    }
                }
                
                else if (
                    leavestatus == 2 &&
                    cancelchk == 'T' &&
                    attenChildId &&
                    setAttenId != weeklyoffAttenTypeId &&
                    setAttenId != publicHolAttenTypeId
                ) {
                    log.emergency("Processing cancelled leave");
                    try {
                        var attendanceChildRecord = record.load({
                            type: "customrecord_njt_emp_daily_atten_ch",
                            id: attenChildId,
                            isDynamic: true,
                        });

                        attendanceChildRecord.setValue({
                            fieldId: "custrecord_njt_emp_daily_intatt",
                            value: presentattentypeid,
                        });
                        /*  attendanceChildRecord.setValue({
                             fieldId: "custrecord_njt_emp_daily_working_hours",
                             value: '',
                         });
  */
                        attendanceChildRecord.save();

                        log.emergency(
                            "Updated Cancelled Leave",
                            "Child record ID: " + attenChildId +
                            " for date: " + currentDate +
                            " set to present: " + presentattentypeid +
                            " | Working Hours: Empty"
                        );
                    } catch (e) {
                        log.error(
                            "Error Updating Cancelled Leave",
                            "Child ID: " + attenChildId +
                            " | Date: " + currentDate +
                            " | Error: " + e.toString()
                        );
                    }
                }
            }
        }
    }
}

    /**
     * Retrieves child attendance records for a given date range and employee
     * @param {string} lvfrom - Leave start date
     * @param {string} lvTo - Leave end date
     * @param {number} empid - Employee ID
     * @returns {Array} Array of attendance records
     */
    function getchildattenid(lvfrom, lvTo, empid,parentRecordId) {
        var attenchildquery =
            "SELECT custrecord_njt_emp_daily_date, id, custrecord_njt_emp_daily_intatt " +
            "FROM customrecord_njt_emp_daily_atten_ch " +
            "WHERE custrecord_njt_emp_daily_date >= '" + lvfrom + "' " +
            "AND custrecord_njt_emp_daily_date <= '" + lvTo + "' " +
            "AND custrecord_njt_emp_daily_parent = " +parentRecordId +" AND custrecord_njt_daily_atten_emp = " + empid;

        log.debug("attenchildquery", attenchildquery);

        var attenchildrec = getResult(attenchildquery);
        log.audit("getchildattenid results", attenchildrec);

        var results = [];
        for (var i = 0; i < attenchildrec.length; i++) {
            results.push({
                attenchildid: attenchildrec[i].id || null,
                setattendid: attenchildrec[i].custrecord_njt_emp_daily_intatt || null,
                date: attenchildrec[i].custrecord_njt_emp_daily_date,
            });
        }

        return results.length > 0 ? results : [];
    }

    /**
     * Retrieves attendance type ID based on sequence number.
     * @param {number} Sequencenum - The sequence number for the attendance type.
     * @return {string|null} The attendance type ID.
     */
    function getattendancetypeid(Sequencenum) {
        var attensql =
            "SELECT id FROM customrecord_hris_attendancetype WHERE custrecord_hris_leave_type_seq_no = " +
            Sequencenum;
        log.debug("attensql", attensql);

        var queryResult = query.runSuiteQL({
            query: attensql,
        });
        var results = queryResult.asMappedResults();

        if (results.length > 0) {
            var attentypeid = results[0].id;
            return attentypeid;
        }

        return null;
    }

    /**
     * Executes a SuiteQL query and returns results as a mapped array.
     * @param {string} pSQL - The SQL query string.
     * @returns {Array} Query results as mapped objects.
     */
    function getResult(pSQL) {
        var queryResults = query.runSuiteQL({ query: pSQL });
        return queryResults.asMappedResults();
    }

    /**
     * The reduce stage is not used in this script.
     * @param {Object} context - The context object for the reduce stage.
     */
    function reduce(context) {
        // Not needed for this script
    }

    /**
     * Handles post-process logic.
     * @param {Object} summary - The summary object for the script execution.
     */
    function summarize(summary) {
        // Handle any post-process logic here
    }
    function getyearid(yearname) {
        var yearid = '';
        var yearsql =
            "SELECT id FROM customlist_hris_year_master WHERE name = '" + yearname + "'";
        log.debug("yearsql", yearsql);

        var queryResult = query.runSuiteQL({
            query: yearsql,
        });
        var results = queryResult.asMappedResults();

        if (results.length > 0) {
            yearid = results[0].id;

        }

        return yearid;
    }
    function getyearname(yearid) {
        var yearname = '';
        var yearsql =
            "SELECT name FROM customlist_hris_year_master WHERE id = " + yearid + "";
        log.debug("yearsql", yearsql);

        var queryResult = query.runSuiteQL({
            query: yearsql,
        });
        var results = queryResult.asMappedResults();

        if (results.length > 0) {
            yearname = results[0].name;

        }

        return yearname;
    }
    function getnormalworkinghours() {
        var workinghours = 0;
        var lunchtime = 0;
        var workinghourssql =
            "SELECT * FROM customrecord_hris_shift_master WHERE custrecord_hris_shift_normalshift='T' and isinactive='F'";
        // log.debug("workinghourssql", workinghourssql);

        var queryResult = query.runSuiteQL({
            query: workinghourssql,
        });
        var workinghourssqlresults = queryResult.asMappedResults();

        if (workinghourssqlresults.length > 0) {
            workinghours = workinghourssqlresults[0].custrecord_hris_working_shift_hours;
            lunchtime = workinghourssqlresults[0].custrecord_hris_shift_lunch_time;
            var shiftmaster = workinghourssqlresults[0].id;

        }

        return workinghours + "#" + lunchtime + "#" + shiftmaster;
    }
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize,
    };
});