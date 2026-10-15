/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 *
 * Script  : hris_postingstagetobiometricintegration_mrs.js
 * Purpose : Reads pending customrecord_hris_biometric_staging records and
 *           creates one customrecord_hris_daily_timesheet_overal record per
 *           employee per day.
 *
 * Logic:
 *   getInputData → reads each staging record and expands its JSON punch array
 *                  into individual punch items.
 *   map          → groups punches by "emp_code|date" key.
 *   reduce       → for each employee+date group:
 *                    - finds the earliest punch time  → IN time
 *                    - finds the latest punch time    → OUT time
 *                    - calculates working hours (decimal)
 *                    - creates customrecord_hris_daily_timesheet_overal
 *                    - marks the staging record as processed (status 2)
 *                    - on error marks staging record as failed (status 3)
 */
define(["N/log", "N/record", "N/query", "N/format"], function (
  log,
  record,
  query,
  format
) {
  // Day names indexed by Date.getDay() (0 = Sunday)
  var DAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // ---------------------------------------------------------------------------
  // getInputData – expand staging records into individual punch items
  // ---------------------------------------------------------------------------
  function getInputData(inputContext) {
    return fetchTransactionData();
  }

  // ---------------------------------------------------------------------------
  // map – write each punch with key = "emp_code|YYYY-MM-DD"
  //       so reduce receives ALL punches for the same employee on the same day
  // ---------------------------------------------------------------------------
  function map(mapContext) {
    var item = JSON.parse(mapContext.value);
    log.audit("map – punch item", item);
    try {
      if (!item.emp_code || !item.date_str) {
        log.audit("map – skipped (missing emp_code or date_str)", item);
        return;
      }
      mapContext.write({
        key: item.emp_code + "|" + item.date_str,
        value: item,
      });
    } catch (err) {
      log.error("ERROR in map stage", JSON.stringify(err));
    }
  }

  // ---------------------------------------------------------------------------
  // reduce – aggregate punches for one employee+date, create timesheet record
  // ---------------------------------------------------------------------------
  function reduce(reduceContext) {
    var key = reduceContext.key; // "EMP001|2024-09-01"
    var punches = reduceContext.values.map(JSON.parse);

    var keyParts = key.split("|");
    var empCode = keyParts[0];
    var dateStr = keyParts[1]; // "YYYY-MM-DD"

    try {
      // ------------------------------------------------------------------
      // 1. Resolve employee in NetSuite
      // ------------------------------------------------------------------
      var empData = getEmployeeData(empCode);
      if (!empData.empId) {
        log.audit(
          "reduce – skipped (no matching employee)",
          "emp_code: " + empCode + " has no active employee with custentity_njt_bio_emp_id set"
        );
        return;
      }

      // ------------------------------------------------------------------
      // 2. Duplicate check – skip if a timesheet record already exists
      //    for this employee on this date (checked via custrecord_hris_bioid)
      // ------------------------------------------------------------------
      if (isTimesheetExists(empData.empId, dateStr)) {
        log.audit(
          "reduce – skipped (timesheet already exists)",
          "emp_code: " + empCode + " | date: " + dateStr
        );
        return;
      }

      // ------------------------------------------------------------------
      // 2. Sort all verify times to find IN (min) and OUT (max)
      // ------------------------------------------------------------------
      var verifyTimes = punches
        .map(function (p) { return p.verify_time; })
        .filter(function (t) { return !!t; })
        .sort(); // ISO strings sort correctly as plain strings

      if (verifyTimes.length === 0) {
        log.audit("reduce – skipped (no verify times)", key);
        return;
      }

      var inTimeStr  = verifyTimes[0];                          // earliest
      var outTimeStr = verifyTimes[verifyTimes.length - 1];     // latest

      // ------------------------------------------------------------------
      // 3. Calculate working hours (decimal, 2 d.p.)
      // ------------------------------------------------------------------
      var workingHours = calcWorkingHours(inTimeStr, outTimeStr);

      // ------------------------------------------------------------------
      // 4. Derive day-of-week name from dateStr
      // ------------------------------------------------------------------
      var dp  = dateStr.split("-");
      var dow = new Date(
        parseInt(dp[0], 10),
        parseInt(dp[1], 10) - 1,
        parseInt(dp[2], 10)
      ).getDay();
      var dayName = DAY_NAMES[dow];

      // ------------------------------------------------------------------
      // 5. Parse date and times for NetSuite field types
      // ------------------------------------------------------------------
      var nsDate = format.parse({
        value: formatNSDate(inTimeStr), // DD/MM/YYYY
        type: format.Type.DATE,
      });

      // Time strings in "H:MM am/pm" format – passed directly to setValue.
      // Do NOT use format.parse(TIMEOFDAY) here: it wraps the time in a JS Date
      // object (with today's full date) which displays as "Fri Sep 25 08:05:00 PDT 2026".
      var inTimeAmPm  = toAmPm(formatNSTime(inTimeStr));  // e.g. "8:05 am"
      var outTimeAmPm = toAmPm(formatNSTime(outTimeStr)); // e.g. "5:30 pm"

      // ------------------------------------------------------------------
      // 6. Create customrecord_hris_daily_timesheet_overal
      // ------------------------------------------------------------------
      var tsRecord = record.create({
        type: "customrecord_hris_daily_timesheet_overal",
        isDynamic: true,
      });

      // Date of attendance
      tsRecord.setValue({
        fieldId: "custrecord_hris_dail_timeheet_date",
        value: nsDate,
      });

      // Day of week (text: Monday, Tuesday …)
      tsRecord.setValue({
        fieldId: "custrecord_hris_dailytime_ove_day",
        value: dayName,
      });

      // Employee (list/record → NetSuite internal ID)
      tsRecord.setValue({
        fieldId: "custrecord_hris_daily_time_over_emp",
        value: empData.empId,
      });

      // IN time (minimum punch time) – set as "H:MM am/pm" string
      tsRecord.setValue({
        fieldId: "custrecord_hris_daily_intime_overal",
        value: inTimeAmPm,
      });

      // OUT time (maximum punch time) – set as "H:MM am/pm" string
      tsRecord.setValue({
        fieldId: "custrecord_hris_daily_time_out_overa",
        value: outTimeAmPm,
      });

      // Working hours (decimal, e.g. 8.5)
      tsRecord.setValue({
        fieldId: "custrecord_hris_daily_time_workinghours",
        value: workingHours,
      });

      // Source → 1 (list/record value)
      tsRecord.setValue({
        fieldId: "custrecord_hris_daily_timesheet_source",
        value: 1,
      });

      // Biometric staging source ID – links back to the staging record
      tsRecord.setValue({
        fieldId: "custrecord_hris_bioid",
        value: punches[0].biostageid || "",
      });

      var newId = tsRecord.save({
        enableSourcing: false,
        ignoreMandatoryFields: true,
      });

      log.audit(
        "reduce – timesheet record created",
        "ID: " + newId +
          " | Emp: " + empCode +
          " | Date: " + dateStr +
          " | IN: " + inTimeStr +
          " | OUT: " + outTimeStr +
          " | Hours: " + workingHours
      );

      // ------------------------------------------------------------------
      // 7. Mark each referenced staging record as Processed (status = 2)
      // ------------------------------------------------------------------
      var processedIds = [];
      punches.forEach(function (p) {
        if (p.biostageid && processedIds.indexOf(p.biostageid) === -1) {
          processedIds.push(p.biostageid);
          var updId = record.submitFields({
            type: "customrecord_hris_biometric_staging",
            id: p.biostageid,
            values: { custrecord_hris_biostage_processingsts: 2 },
            options: { enableSourcing: false, ignoreMandatoryFields: true },
          });
          log.audit("reduce – staging marked processed", "biostageid: " + p.biostageid + " → " + updId);
        }
      });

    } catch (err) {
      log.error(
        "ERROR in reduce stage for key " + key,
        JSON.stringify(err)
      );

      // Mark staging records as Failed (status = 3)
      var errorIds = [];
      punches.forEach(function (p) {
        if (p.biostageid && errorIds.indexOf(p.biostageid) === -1) {
          errorIds.push(p.biostageid);
          record.submitFields({
            type: "customrecord_hris_biometric_staging",
            id: p.biostageid,
            values: {
              custrecord_hris_biostage_processingsts: 3,
              custrecord_hris_biostage_processingerror: JSON.stringify(err),
            },
            options: { enableSourcing: false, ignoreMandatoryFields: true },
          });
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // summarize – log any map / reduce errors
  // ---------------------------------------------------------------------------
  function summarize(summaryContext) {
    try {
      if (
        summaryContext.mapErrors &&
        typeof summaryContext.mapErrors.iterator === "function"
      ) {
        summaryContext.mapErrors.iterator().each(function (key, error) {
          log.error("Map Error for key: " + key, JSON.stringify(error));
          return true;
        });
      } else {
        log.debug("No map errors", "No map errors found or mapErrors is not iterable");
      }

      if (
        summaryContext.reduceErrors &&
        typeof summaryContext.reduceErrors.iterator === "function"
      ) {
        summaryContext.reduceErrors.iterator().each(function (key, error) {
          log.error("Reduce Error for key: " + key, JSON.stringify(error));
          return true;
        });
      } else {
        log.debug("No reduce errors", "No reduce errors found or reduceErrors is not iterable");
      }

      log.audit("summarize", "Daily timesheet creation completed.");
    } catch (e) {
      log.error("ERROR in summarize stage", JSON.stringify(e));
    }
  }

  // ---------------------------------------------------------------------------
  // fetchTransactionData
  // Reads pending staging records and expands each JSON punch array into
  // individual punch objects ready for the map stage.
  // ---------------------------------------------------------------------------
  function fetchTransactionData() {
    try {
      var stagesql =
        "SELECT id, custrecord_hris_biostage_response " +
        "FROM customrecord_hris_biometric_staging " +
        "WHERE custrecord_hris_biostage_responsestatus = 1 " +
        "  AND custrecord_hris_biostage_processingsts = 1 " +
        "  AND isinactive = 'F'";

      log.debug("fetchTransactionData – SQL", stagesql);

      var queryResult = query.runSuiteQL({ query: stagesql });
      var stagerecords = queryResult.asMappedResults();

      var transactionData = [];

      for (var i = 0; i < stagerecords.length; i++) {
        var stagerec = stagerecords[i];
        var biostageid = stagerec.id;
        var responsedataarray = stagerec.custrecord_hris_biostage_response;

        if (!responsedataarray) continue;

        var dataArray = JSON.parse(responsedataarray);

        // Support both single object and array responses
        if (!Array.isArray(dataArray)) {
          dataArray = [dataArray];
        }

        for (var j = 0; j < dataArray.length; j++) {
          var row = dataArray[j];
          var verifyTime = row.VerifyTime || "";
          // Extract "YYYY-MM-DD" from "YYYY-MM-DDTHH:MM:SS"
          var dateStr = verifyTime ? verifyTime.split("T")[0] : "";

          transactionData.push({
            biostageid:    biostageid,
            emp_code:      row.BadgeNumber   || "",
            employee_name: row.EmployeeName  || "",
            verify_time:   verifyTime,
            date_str:      dateStr,
          });
        }
      }

      log.audit(
        "fetchTransactionData – complete",
        "Staging records: " + stagerecords.length +
          " | Total punch items: " + transactionData.length
      );

      return transactionData;
    } catch (e) {
      log.error("ERROR in fetchTransactionData", JSON.stringify(e));
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // getEmployeeData – looks up active employee by biometric badge number
  // ---------------------------------------------------------------------------
  function getEmployeeData(empCode) {
    var sql =
      "SELECT id, BUILTIN.DF(entityid) AS entityid " +
      "FROM employee " +
      "WHERE isinactive = 'F' " +
      "  AND custentity_njt_bio_emp_id = '" + empCode + "'";

    var queryResult = query.runSuiteQL({ query: sql });
    var records = queryResult.asMappedResults();
    var empData = { empId: "", entityId: "" };

    if (records.length > 0) {
      empData.empId    = records[0].id;
      empData.entityId = records[0].entityid;
    }
    return empData;
  }

  // ---------------------------------------------------------------------------
  // isTimesheetExists – returns true if a customrecord_hris_daily_timesheet_overal
  // record already exists for this employee on this date.
  // Prevents duplicate records when the script is re-run.
  // ---------------------------------------------------------------------------
  function isTimesheetExists(empId, dateStr) {
    try {
      var nsDateFormatted = formatNSDate(dateStr + "T00:00:00"); // DD/MM/YYYY
      var sql =
        "SELECT id " +
        "FROM customrecord_hris_daily_timesheet_overal " +
        "WHERE isinactive = 'F' " +
        "  AND custrecord_hris_daily_time_over_emp = " + empId +
        "  AND custrecord_hris_dail_timeheet_date = TO_DATE('" + nsDateFormatted + "', 'DD/MM/YYYY')";

      var queryResult = query.runSuiteQL({ query: sql });
      var records = queryResult.asMappedResults();
      return records.length > 0;
    } catch (e) {
      log.error("isTimesheetExists – query error", JSON.stringify(e));
      return false; // If check fails, allow creation to proceed
    }
  }

  // ---------------------------------------------------------------------------
  // calcWorkingHours – returns decimal hours between two ISO datetime strings
  // e.g. "2024-09-01T08:05:32" and "2024-09-01T17:30:00" → 9.41
  // ---------------------------------------------------------------------------
  function calcWorkingHours(inTimeStr, outTimeStr) {
    try {
      if (!inTimeStr || !outTimeStr) return 0;
      // Replace "T" with a space so new Date() parses correctly cross-browser
      var inDt  = new Date(inTimeStr.replace("T", " "));
      var outDt = new Date(outTimeStr.replace("T", " "));
      var diffMs = outDt - inDt;
      if (diffMs <= 0) return 0;
      var hours = diffMs / (1000 * 60 * 60);
      return Math.round(hours * 100) / 100; // 2 decimal places
    } catch (e) {
      log.error("calcWorkingHours – error", JSON.stringify(e));
      return 0;
    }
  }

  // ---------------------------------------------------------------------------
  // formatNSDate – converts "YYYY-MM-DDTHH:MM:SS" → "DD/MM/YYYY"
  // ---------------------------------------------------------------------------
  function formatNSDate(dt) {
    if (!dt) return "";
    var dt1 = dt.replace("T", " ").split(" ")[0];
    var parts = dt1.split("-");
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  // ---------------------------------------------------------------------------
  // formatNSTime – extracts "HH:MM:SS" from "YYYY-MM-DDTHH:MM:SS"
  // ---------------------------------------------------------------------------
  function formatNSTime(dt) {
    if (!dt) return "";
    return dt.replace("T", " ").split(" ")[1];
  }

  // ---------------------------------------------------------------------------
  // toAmPm – converts "HH:MM:SS" (24-hour) → "H:MM am/pm" (12-hour)
  // NetSuite format.parse(TIMEOFDAY) expects 12-hour am/pm format.
  // Examples:  "08:05:32" → "8:05 am"    "17:30:00" → "5:30 pm"
  // ---------------------------------------------------------------------------
  function toAmPm(timeStr) {
    if (!timeStr) return "";
    var parts = timeStr.split(":");
    var hours   = parseInt(parts[0], 10);
    var minutes = parts[1] || "00";
    var ampm    = hours >= 12 ? "pm" : "am";
    var h12     = hours % 12;
    if (h12 === 0) h12 = 12; // midnight = 12:xx am, noon = 12:xx pm
    return h12 + ":" + minutes + " " + ampm;
  }

  return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
    summarize: summarize,
  };
});