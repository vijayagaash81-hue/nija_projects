/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(["N/record", "N/runtime", "N/log", "N/query", "N/format"], function (
  record,
  runtime,
  log,
  query,
  format
) {
  function afterSubmit(context) {
    try {
      // Run only on Create or Edit
      if (
        context.type !== context.UserEventType.CREATE &&
        context.type !== context.UserEventType.EDIT
      ) {
        return;
      }

      var rec = context.newRecord;
      var recordId = rec.id;
      var recordType = rec.type;
      var inTime, outTime;

      // For CREATE, reload the record to get the latest values
      if (context.type === context.UserEventType.CREATE) {
        var loadedRecord = record.load({
          type: recordType,
          id: recordId,
        });

        // Get In-Time and Out-Time values after loading
        inTime = loadedRecord.getValue("custrecord_njt_emp_daily_in_time") || "";
        outTime = loadedRecord.getValue("custrecord_njt_emp_daily_out_time") || "";
      } else {
        // For EDIT, get values directly from newRecord
        inTime = rec.getValue("custrecord_njt_emp_daily_in_time") || "";
        outTime = rec.getValue("custrecord_njt_emp_daily_out_time") || "";
      }

      if (inTime && outTime) {
        // Convert time strings to minutes since midnight
        var inMinutes = convertTimeToMinutes(inTime);
        var outMinutes = convertTimeToMinutes(outTime);

        // If out time is less than in time, assume it's the next day
        if (outMinutes < inMinutes) {
          outMinutes += 24 * 60; // Add 24 hours
        }

        // Calculate total time difference in hours
        var totalMinutes = outMinutes - inMinutes;
        var totalHours = totalMinutes / 60;

        // Round to 2 decimal places
        totalHours = parseFloat(totalHours.toFixed(2));

        // Set the value of Working Hours
        record.submitFields({
          type: recordType,
          id: recordId,
          values: {
            custrecord_njt_emp_daily_working_hours: totalHours,
          },
        });

        log.audit("Success", "Total Hours Calculated: " + totalHours);
      } else {
        log.audit(
          "Info",
          "In-Time or Out-Time is missing, skipping calculation."
        );
      }

      // Calculate actual working hours and late hours
      var loadedRecord = record.load({
        type: recordType,
        id: recordId,
      });

      // Calculate actual working hours by subtracting tea and lunch hours
      var workinghrs = parseFloat(
        loadedRecord.getValue("custrecord_njt_emp_daily_working_hours") || 0
      );
      log.debug("workinghrs", workinghrs);

      var Actualworkinghrs = 0.0;
      if (workinghrs > 0) {
        var lunchhrsRaw = loadedRecord.getValue("custrecord_njt_lunch_break") || "00:00";
        var teatimeRaw = loadedRecord.getValue("custrecord_njt_tea_break") || "00:00";

        var lunchhrs = convertHHMMToHours(lunchhrsRaw);
        var teatime = convertHHMMToHours(teatimeRaw);
        var breakhrs = lunchhrs + teatime;

        Actualworkinghrs = parseFloat(workinghrs) - parseFloat(breakhrs);
        Actualworkinghrs = Actualworkinghrs > 0 ? Actualworkinghrs : 0;
      }

      log.debug("Actualworkinghrs", Actualworkinghrs);

      // Set the value of Actual working hours
      record.submitFields({
        type: recordType,
        id: recordId,
        values: {
          custrecord_njt_actual_working_hours: Actualworkinghrs.toFixed(2),
        },
      });
      log.debug("actual working hrs updated successfully");

      // Calculate late hours
      var attendancedate = loadedRecord.getValue("custrecord_njt_emp_daily_date");
      log.debug("attendancedate", attendancedate);

      var formatattendate = format.format({
        value: attendancedate,
        type: format.Type.DATE,
      });
      var newattendate = convertToSQLDateFormat(formatattendate);
      log.debug("newattendate", newattendate);

      var employeeid = loadedRecord.getValue("custrecord_njt_daily_atten_ch_emp") || 0;
      log.debug("employeeid", employeeid);

    /*   var sfhitdetailsqsql =
        "SELECT " +
        "custrecord_njt_shift_start_time, custrecord_njt_shift_end_time, " +
        "custrecord_njt_emp_parent_link " +
        "FROM customrecord_hris_shift " +
        "WHERE custrecord_njt_emp_parent_link = " +
        employeeid +
        " " +
        "AND DATE '" +
        newattendate +
        "' BETWEEN custrecord_njt_shift_sdate AND custrecord_njt_shift_edate;"; */
      var sfhitdetailsqsql = 
    "SELECT " +
    "    custrecord_njt_shift_start_time, " +
    "    custrecord_njt_shift_end_time " +
    "FROM " +
    "    customrecord_hris_shift " +
    "WHERE " +
    "    custrecord_njt_emp_parent_link = " + employeeid + " " +
    "    AND ( " +
    "        (TO_CHAR(DATE '" + newattendate + "', 'DY') = 'SAT' AND custrecord_hris_shift_mst_sat_chk = 'T') " +
    "        OR " +
    "        (TO_CHAR(DATE '" + newattendate + "', 'DY') <> 'SAT' AND (custrecord_hris_shift_mst_sat_chk = 'F' OR custrecord_hris_shift_mst_sat_chk IS NULL)) " +
    "    )";
      log.debug("sfhitdetailsqsql", sfhitdetailsqsql);

      var resultSet = query.runSuiteQL({ query: sfhitdetailsqsql });
      var results = resultSet.asMappedResults();
      var shiftStartTimeraw = "";
      var shiftEndTimeraw = "";

      if (results.length > 0) {
        shiftStartTimeraw = results[0].custrecord_njt_shift_start_time || "";
        shiftEndTimeraw = results[0].custrecord_njt_shift_end_time || "";
        log.debug("Shift Start Time", shiftStartTimeraw);
        log.debug("Shift End Time", shiftEndTimeraw);
      } else {
        log.debug("No matching shift found, setting default values");
      }

      // Calculate late hours
      var INtimeraw = loadedRecord.getValue("custrecord_njt_emp_daily_in_time") || "";
      var INtime = convertHHMMToHours(INtimeraw);
      log.debug("INtime", INtime);

      var shittime = convertHHMMToHours(shiftStartTimeraw);
      log.debug("shittime", shittime);

      var Latehrs = 0;
      if (shittime > 0 && INtime > 0) {
        Latehrs = parseFloat(INtime) - parseFloat(shittime);
        if (Latehrs <= 0.25) {
          Latehrs = 0; // Within grace period
        } else {
          Latehrs -= 0.25; // Subtract grace period
        }
      }
      log.debug("Latehrs", Latehrs);

      var lathrsinHHMM = Latehrs > 0 ? convertHoursToHHMM(Latehrs) : "00:00";
      log.debug("lathrsinHHMM", lathrsinHHMM);

      // Set the value of late hours and shift times
      record.submitFields({
        type: recordType,
        id: recordId,
        values: {
          custrecord_njt_daily_atten_late_hours: lathrsinHHMM,
          custrecord_njt_daily_atten_shift_time: shiftStartTimeraw,
          custrecord_njt_daily_atten_shift_etime: shiftEndTimeraw,
        },
      });
      log.debug("late hrs updated successfully");

      // ============================================================
      // Calculate Regularized Hours
      // ============================================================

      var actualInTime =
        loadedRecord.getValue("custrecord_njt_emp_daily_in_time") || "";

      var actualOutTime =
        loadedRecord.getValue("custrecord_njt_emp_daily_out_time") || "";

      var regOtInTime =
        loadedRecord.getValue("custrecord_njt_emp_daily_reg_in") || "";

      var regOtOutTime =
        loadedRecord.getValue("custrecord_njt_emp_daily_reg_out") || "";

      log.debug("actualInTime", actualInTime);
      log.debug("actualOutTime", actualOutTime);
      log.debug("regOtInTime", regOtInTime);
      log.debug("regOtOutTime", regOtOutTime);

      var totalRegMins = 0;
      var totalRegInHHMM = "00:00";

      // Check whether actual IN/OUT are available
      var hasActualIn =
        actualInTime &&
        String(actualInTime) !== "0";

      var hasActualOut =
        actualOutTime &&
        String(actualOutTime) !== "0";

      // Check whether regularized IN/OUT are available
      var hasRegIn =
        regOtInTime &&
        String(regOtInTime) !== "0";

      var hasRegOut =
        regOtOutTime &&
        String(regOtOutTime) !== "0";

      if (hasRegIn && hasRegOut) {
        var regInMins = convertTimeToMinutes(String(regOtInTime));
        var regOutMins = convertTimeToMinutes(String(regOtOutTime));

        // ==========================================================
        // CASE 1:
        // Actual IN and OUT are missing / 0
        //
        // Use complete Regularize IN -> Regularize OUT duration
        // ==========================================================
        if (!hasActualIn && !hasActualOut) {
          // Handle overnight regularization
          if (regOutMins < regInMins) {
            regOutMins += 24 * 60;
          }

          totalRegMins = regOutMins - regInMins;

          log.debug(
            "Regularization Type",
            "Actual IN/OUT missing - calculating full regularized duration"
          );
        }
        // ==========================================================
        // CASE 2:
        // Actual IN and OUT are available
        //
        // Calculate only the difference caused by regularization
        // ==========================================================
        else if (hasActualIn && hasActualOut) {
          var actualInMins =
            convertTimeToMinutes(String(actualInTime));

          var actualOutMins =
            convertTimeToMinutes(String(actualOutTime));

          // Handle overnight actual attendance
          if (actualOutMins < actualInMins) {
            actualOutMins += 24 * 60;
          }

          // Handle overnight regularization
          if (regOutMins < regInMins) {
            regOutMins += 24 * 60;
          }

          var diffBefore = 0;
          var diffAfter = 0;

          // Regularized IN is earlier than actual IN
          if (actualInMins > regInMins) {
            diffBefore = actualInMins - regInMins;
          }

          // Regularized OUT is later than actual OUT
          if (regOutMins > actualOutMins) {
            diffAfter = regOutMins - actualOutMins;
          }

          totalRegMins = diffBefore + diffAfter;

          log.debug("diffBefore", diffBefore);
          log.debug("diffAfter", diffAfter);
        }
        // ==========================================================
        // CASE 3:
        // Only one actual time is available
        // ==========================================================
        else {
          log.debug(
            "Regularized Hours",
            "Only one actual attendance time is available"
          );

          totalRegMins = 0;
        }

        // Convert minutes to HH:MM
        totalRegInHHMM = convertHoursToHHMM(totalRegMins / 60);

        log.debug("Total Regularized Minutes", totalRegMins);
        log.debug("Total Regularized Hours", totalRegInHHMM);
      }

      // Save Total Regularized Hours
      record.submitFields({
        type: recordType,
        id: recordId,
        values: {
          custrecord_hris_total_regularized_hours: totalRegInHHMM,
        },
      });

      log.debug("Saved Total Regularized Hours", totalRegInHHMM);
    } catch (error) {
      log.error("Error in afterSubmit", error);
    }
  }

  /**
   * Convert time string (e.g., "5:00 AM" or "6:30 PM") to minutes since midnight
   * @param {string} timeStr - Time string to convert
   * @returns {number} - Minutes since midnight
   */
  function convertTimeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== "string") {
      log.debug("Invalid timeStr, returning 0", timeStr);
      return 0;
    }

    var timeParts = timeStr.match(/(\d+):(\d+)\s*(\w+)/i); // Case-insensitive AM/PM
    if (!timeParts) {
      log.debug("Invalid time format, returning 0", timeStr);
      return 0;
    }

    var hours = parseInt(timeParts[1], 10);
    var minutes = parseInt(timeParts[2], 10);
    var period = timeParts[3].toLowerCase();

    if (period === "pm" && hours !== 12) {
      hours += 12;
    } else if (period === "am" && hours === 12) {
      hours = 0; // Midnight edge case
    }

    return hours * 60 + minutes;
  }

  /**
   * Convert time string (e.g., "HH:MM" or "5:00 AM") to hours
   * @param {string} timeStr - Time string to convert
   * @returns {number} - Hours as a float
   */
  function convertHHMMToHours(timeStr) {
    if (!timeStr || typeof timeStr !== "string") return 0;

    // Handle HH:MM format (e.g., "01:30")
    var parts = timeStr.split(":");
    if (parts.length === 2) {
      var hours = parseInt(parts[0], 10) || 0;
      var minutes = parseInt(parts[1], 10) || 0;
      return hours + minutes / 60;
    }

    // Handle "HH:MM AM/PM" format
    var timeParts = timeStr.match(/(\d+):(\d+)\s*(am|pm)/i);
    if (!timeParts) {
      log.debug("Invalid time format in convertHHMMToHours", timeStr);
      return 0;
    }

    var hours = parseInt(timeParts[1], 10);
    var minutes = parseInt(timeParts[2], 10);
    var period = timeParts[3].toLowerCase();

    if (period === "pm" && hours !== 12) {
      hours += 12;
    } else if (period === "am" && hours === 12) {
      hours = 0; // Midnight
    }

    return hours + minutes / 60;
  }

  /**
   * Convert date string (e.g., "MM/DD/YYYY") to SQL format (YYYY-MM-DD)
   * @param {string} dateStr - Date string to convert
   * @returns {string} - Date in YYYY-MM-DD format
   */
  function convertToSQLDateFormat(dateStr) {
    if (!dateStr) return "";
     var parts = dateStr.split("/"); // ["01", "12", "2024"]
    return parts[2] + "-" + parts[1] + "-" + parts[0]; // "2024-12-01"
  }

  /**
   * Convert hours (decimal) to HH:MM format
   * @param {number} hoursDecimal - Hours as a decimal
   * @returns {string} - Time in HH:MM format
   */
  function convertHoursToHHMM(hoursDecimal) {
    hoursDecimal = parseFloat(hoursDecimal);
    if (isNaN(hoursDecimal) || hoursDecimal < 0) return "00:00";

    var hours = Math.floor(hoursDecimal);
    var minutes = Math.round((hoursDecimal - hours) * 60);

    if (minutes === 60) {
      hours += 1;
      minutes = 0;
    }

    var hh = hours < 10 ? "0" + hours : "" + hours;
    var mm = minutes < 10 ? "0" + minutes : "" + minutes;

    return hh + ":" + mm;
  }

  return {
    afterSubmit: afterSubmit,
  };
});