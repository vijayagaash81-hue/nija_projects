/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */

define([
  "N/search",
  "N/record",
  "N/log",
  "N/format",
  "./moment",
  "N/query",
], function (search, record, log, format, moment, query) {
  // Function to get input data for the MapReduce script
  function getInputData(context) {
    // Calculate the previous date in IST
    var currentDate = moment.utc();
    log.debug("currentDate (UTC)", currentDate.format());

    // Convert to UTC+5:30 (IST)
    var istDate = currentDate.add(5, "hours").add(30, "minutes");
    log.debug("currentDate (IST)", istDate.format());

    // Subtract 1 day to get the previous date
    var previousDate = istDate.subtract(1, "days").format("DD/MM/YYYY"); // Format as DD/MM/YYYY
    log.debug("previousDate (IST)", previousDate);
    //var previousDate = '02/02/2026'

    // Search for records in customrecord_njt_daily_attendance_bio for the previous date
   var customrecord_njt_daily_attendance_bioSearchObj = search.create({
      type: "customrecord_njt_daily_attendance_bio",
      filters: [
        [
          ["custrecord_hris_bio_attendancemethod", "anyof", "1"], "AND", ["custrecord_njt_bio_date", "on", previousDate]
        ],
        "OR",
        [
          ["custrecord_hris_bio_attendancemethod", "anyof", "2"], "AND", ["custrecord_hris_dailyatten_process_compl", "is", "F"]
        ]
      ],
      columns: [
        search.createColumn({ name: "custrecord_njt_bio_time", summary: "MIN", label: "Bio Time" }),
        search.createColumn({ name: "custrecord_njt_bio_address", summary: "MIN", label: "Min Bio Address" }),
        search.createColumn({ name: "custrecord_njt_bio_time", summary: "MAX", label: "Bio Time" }),
        search.createColumn({ name: "custrecord_njt_bio_address", summary: "MAX", label: "Max Bio Address" }),
        search.createColumn({ name: "custrecord_njt_employee_name", summary: "GROUP", label: "Employee Name" }),
        search.createColumn({ name: "custrecord_njt_bio_date", summary: "GROUP", label: "Bio Date" }),
        search.createColumn({ name: "custrecord_hris_bio_attendancemethod", summary: "GROUP", label: "Attendance Type" }),
        // New fields added to search
      /*   search.createColumn({ name: "custrecord_hris_daily_travel_ot_hours", summary: "MIN", label: "Travel OT Hours" }),
        search.createColumn({ name: "custrecord_hris_daily_travel_location", summary: "GROUP", label: "Travel Location" }),
        search.createColumn({ name: "custrecord_hris_daily_travel_amount", summary: "MIN", label: "Travel Amount" }),
     */  ],
    });

    var searchResults = customrecord_njt_daily_attendance_bioSearchObj.run().getRange({ start: 0, end: 1000 });
    log.debug("Search Results Found", searchResults.length);

    return searchResults;
  }

  // Function to process each record in the map stage
  function map(context) {
    var result = JSON.parse(context.value);
    log.debug("result", result);

    try {
      // Extract values from the search result
      var minBioTime = result.values["MIN(custrecord_njt_bio_time)"];
      var minBioAddress = result.values["MIN(custrecord_njt_bio_address)"];
      var maxBioTime = result.values["MAX(custrecord_njt_bio_time)"];
      var maxBioAddress = result.values["MAX(custrecord_njt_bio_address)"];
      var employeeName =
        result.values["GROUP(custrecord_njt_employee_name)"][0].text;
      var employeeName1 =
        result.values["GROUP(custrecord_njt_employee_name)"][0].value;
      var bioDate = result.values["GROUP(custrecord_njt_bio_date)"];
      var attenMethod =
        result.values["GROUP(custrecord_hris_bio_attendancemethod)"][0].value;
      
      // New Travel Values extraction
     /*  var travelOtHours = result.values["MIN(custrecord_hris_daily_travel_ot_hours)"];
  
      var travelLocObj = result.values["GROUP(custrecord_hris_daily_travel_location)"];
      var travelLocation = (travelLocObj && travelLocObj.length > 0) ? travelLocObj[0].value : "";

      var travelAmount = result.values["MIN(custrecord_hris_daily_travel_amount)"];
 */
      // Log extracted values
      log.debug("minBioTime", minBioTime);
      log.debug("employeeName1", employeeName1);
      log.debug("bioDate", bioDate);
      log.debug("attenMethod", attenMethod);
     /*  log.debug("travelOtHours", travelOtHours);
      log.debug("travelLocation", travelLocation);
     */  

      // Parse bioDate to a Date object
      var bioDateObj = format.parse({
        value: bioDate,
        type: format.Type.DATE,
      });

      // Calculate work hours
      var formattedWorkHours = calculateWorkHours(minBioTime, maxBioTime);
      var workhoursdecimal=calculateWorkHoursdecimal(minBioTime,maxBioTime);

      // Prepare data for the reduce stage
      var recordData = {
        employeeName: employeeName,
        employeeName1: employeeName1,
        bioDate: bioDateObj,
        minBioTime: minBioTime,
        maxBioTime: maxBioTime,
        minBioAddress: minBioAddress,
        maxBioAddress: maxBioAddress,
        formattedWorkHours: formattedWorkHours,
        attenMethod: attenMethod,
        workhoursdecimal:workhoursdecimal,
        // Added travel fields to data object
        /* travelOtHours: travelOtHours,
        travelLocation: travelLocation,
        travelAmount: travelAmount */
      };

      // Pass data to the reduce stage
      context.write({
        key: employeeName1 + ":" + bioDate,
        value: recordData,
      });
    } catch (e) {
      log.error("Error processing result", e);
    }
  }

  // Function to process aggregated data in the reduce stage
  function reduce(context) {
    try {
        var recordsData = context.values.map(function (value) {
            return JSON.parse(value);
        });

        var firstRecord = recordsData[0];
        var employeeName = firstRecord.employeeName;
        var employeeName1 = firstRecord.employeeName1; 
        var bioDate = firstRecord.bioDate;

        if (!bioDate) {
            log.debug("bioDate is empty. Skipping processing.");
            return;
        }

        var formattedBioDate = formatDateToDDMMYYYY(bioDate);
        var isMethodTwoProcessed = false;

        var searchResult = search.create({
            type: "customrecord_njt_emp_daily_atten_ch",
            filters: [
                //["custrecord_njt_daily_atten_ch_emp", "anyof", employeeName1],
                ["custrecord_njt_daily_atten_emp", "anyof", employeeName1],
                "AND",
                ["custrecord_njt_emp_daily_date", "on", formattedBioDate],
            ],
            columns: ["internalid"],
        }).run().getRange({ start: 0, end: 1 });

        if (searchResult.length > 0) {
            var recordId = searchResult[0].id;
            var existingRecord = record.load({
                type: "customrecord_njt_emp_daily_atten_ch",
                id: recordId,
                isDynamic: true,
            });

            recordsData.forEach(function (recordData) {
                var attenMethod = recordData.attenMethod;
                var minBioTime = recordData.minBioTime;
                var maxBioTime = recordData.maxBioTime;
                var minBioAddress = recordData.minBioAddress;
                var maxBioAddress = recordData.maxBioAddress;
                var formattedWorkHours = recordData.formattedWorkHours;
                var workhoursdecimal = recordData.workhoursdecimal;

                if (attenMethod === "2") {
                    isMethodTwoProcessed = true;
                }

               // var internalAttendanceType = (minBioTime) ? 1 : null;
               var internalAttendanceType = existingRecord.getValue({
                        fieldId: "custrecord_njt_emp_daily_intatt",
                       
                    });
                  if (internalAttendanceType == 23) {
                     var internalAttendanceType = 18;
                    existingRecord.setValue({
                        fieldId: "custrecord_njt_emp_daily_intatt",
                        value: internalAttendanceType,
                    });
                }

                if (attenMethod === "1") {
                    existingRecord.setValue({ fieldId: "custrecord_njt_emp_daily_in_time", value: minBioTime });
                    existingRecord.setValue({ fieldId: "custrecord_njt_emp_daily_out_time", value: maxBioTime });
                    existingRecord.setValue({ fieldId: "custrecord_njt_emp_daily_totalhours", value: formattedWorkHours });
                    existingRecord.setValue({ fieldId: "custrecord_njt_emp_atten_location", value: minBioAddress });
                    existingRecord.setValue({ fieldId: "custrecord_njt_emp_atten_out_location", value: maxBioAddress });
                    existingRecord.setValue({ fieldId: "custrecord_hris_actual_woking_hours", value:workhoursdecimal});
                    /*  if (minBioTime && maxBioTime && minBioTime === maxBioTime) {
                        existingRecord.setValue({
                            fieldId: "custrecord_njt_emp_daily_intatt",
                            value: 24
                        });
                    } */
                    
                } else if (attenMethod === "2") {
                    existingRecord.setValue({ fieldId: "custrecord_hris_ot_ch_start_time", value: minBioTime });
                    existingRecord.setValue({ fieldId: "custrecord_hris_overtime_end_time", value: maxBioTime });
                    existingRecord.setValue({ fieldId: "custrecord_njt_ot_hours", value: formattedWorkHours });
                    existingRecord.setValue({ fieldId: "custrecord_njt_emp_atten_ot_in_location", value: minBioAddress });
                    existingRecord.setValue({ fieldId: "custrecord_njt_emp_atten_ot_out_location", value: maxBioAddress });
                    
                    // NEW: Setting Travel OT fields
                  /*   existingRecord.setValue({ fieldId: "custrecord_hris_travel_ot_hours_child", value: recordData.travelOtHours });
                    existingRecord.setValue({ fieldId: "custrecord_hris_travel_ot_location_child", value: recordData.travelLocation });
                    existingRecord.setValue({ fieldId: "custrecord_hris_travel_ot_amt_child", value: recordData.travelAmount });
 */
                    var overtimeType = getOvertimeType(employeeName1, bioDate);
                    existingRecord.setValue({ fieldId: "custrecord_njt_overtime_type", value: overtimeType });
                }
            });

            var savedId = existingRecord.save();
            log.audit("Record Updated Successfully", savedId);

            if (isMethodTwoProcessed) {
                markSourceRecordsComplete(employeeName1, formattedBioDate);
            }
        } else {
            log.debug("No record found", employeeName + " on " + formattedBioDate);
        }
    } catch (e) {
        log.error("Error in reduce function", e);
    }
}

function markSourceRecordsComplete(employeeId, bioDate) {
    var bioSearch = search.create({
      type: "customrecord_njt_daily_attendance_bio",
      filters: [
        ["custrecord_njt_employee_name", "anyof", employeeId], "AND",
        ["custrecord_njt_bio_date", "on", bioDate], "AND",
        ["custrecord_hris_bio_attendancemethod", "anyof", "2"]
      ],
      columns: ["internalid"]
    }).run().getRange({ start: 0, end: 1000 });

    for (var i = 0; i < bioSearch.length; i++) {
      record.submitFields({
        type: "customrecord_njt_daily_attendance_bio",
        id: bioSearch[i].id,
        values: { "custrecord_hris_dailyatten_process_compl": true }
      });
    }
    log.debug("Method 2 Cleanup", "Marked " + bioSearch.length + " records as complete.");
  }

  function summarize(context) {
    try {
      if (context.inputSummary.error) {
        log.error("Error in input", context.inputSummary.error);
      }
      if (context.mapSummary.errors) {
        context.mapSummary.errors.iterator().each(function (key, error) {
          log.error("Map error", error);
          return true;
        });
      }
      if (context.reduceSummary.errors) {
        context.reduceSummary.errors.iterator().each(function (key, error) {
          log.error("Reduce error", error);
          return true;
        });
      }
      log.audit("Summary", "Map/Reduce script completed successfully.");
    } catch (e) {
      log.error("Error in summarize", e);
    }
  }

  function calculateWorkHours(timeIn, timeOut) {
    var punchTimeIn = moment(timeIn, "HH:mm:ss a");
    var punchTimeOut = moment(timeOut, "HH:mm:ss a");
    var duration = moment.duration(punchTimeOut.diff(punchTimeIn));
    var hours = parseInt(duration.asHours());
    var minutes = parseInt(duration.asMinutes()) % 60;
    var formattedWorkHours = hours + "." + (minutes < 10 ? "0" + minutes : minutes);
    return formattedWorkHours;
  }
  
function calculateWorkHoursdecimal(timeIn, timeOut) {

    var punchTimeIn = moment(timeIn, "hh:mm:ss a");   // 12-hour format with AM/PM
    var punchTimeOut = moment(timeOut, "hh:mm:ss a");

    // If timeOut is next day (night shift)
    if (punchTimeOut.isBefore(punchTimeIn)) {
        punchTimeOut.add(1, 'day');
    }

    var duration = moment.duration(punchTimeOut.diff(punchTimeIn));

    // Convert total minutes to decimal hours
    var decimalHours = duration.asMinutes() / 60;

    return decimalHours.toFixed(2);  // returns 2 decimal places
}

  function formatDateToDDMMYYYY(isoDate) {
    var dateObj = new Date(isoDate);
    var day = dateObj.getDate();
    var month = dateObj.getMonth() + 1;
    var year = dateObj.getFullYear();
    return (
      (day < 10 ? "0" + day : day) +
      "/" +
      (month < 10 ? "0" + month : month) +
      "/" +
      year
    );
  }

  function getOvertimeType(employeeId, bioDate) {
    var setsqlquery =
      "SELECT A.custrecord_njt_emp_atten_employee, A.id AS attendance_id, A.custrecord_njt_emp_atten_month, " +
      "A.custrecord_njt_emp_atten_year, B.custrecord_njt_emp_daily_date, B.custrecord_njt_emp_daily_day, " +
      "B.custrecord_njt_emp_daily_intatt, B.id AS attendance_child_id, " +
      "BUILTIN.DF(C.custentity_hris_empweeklyoffs) as weekly_off, BUILTIN.DF(C.custentity_hris_empholidays) as holiday, " +
      "C.id AS employee_id, C.custentity_hris_empweeklyoffs, C.custentity_hris_empholidays, " +
      "D.custrecord_hris_lve_hrmsapprovalstatus, D.custrecord_hris_lve_fromdate, D.custrecord_hris_lve_todate " +
      "FROM CUSTOMRECORD_NJT_EMP_DAILY_ATTENDANCE A " +
      "JOIN CUSTOMRECORD_NJT_EMP_DAILY_ATTEN_CH B ON A.id = B.custrecord_njt_emp_daily_parent " +
      "JOIN employee C ON A.custrecord_njt_emp_atten_employee = C.id " +
      "LEFT JOIN CUSTOMRECORD_HRIS_LEAVEAPPLICATION D ON C.id = D.custrecord_hris_lve_employeename " +
      "WHERE C.id = " +
      employeeId;

    var queryResult = query
      .runSuiteQL({
        query: setsqlquery,
      })
      .asMappedResults();

    if (queryResult.length > 0) {
      var weeklyOff = queryResult[0].weekly_off;
      var holiday = queryResult[0].holiday;
      var bioDay = moment(bioDate).format("dddd"); 
      if (weeklyOff && weeklyOff.indexOf(bioDay) !== -1) {
        return 1; // Weekly off
      }
      var formattedBioDate = moment(bioDate).format("DD/MM/YYYY");
      if (holiday && holiday.indexOf(formattedBioDate) !== -1) {
        return 2; // Holiday
      }
    }
    return 3; // Regular day
  }

  return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
    summarize: summarize,
  };
});