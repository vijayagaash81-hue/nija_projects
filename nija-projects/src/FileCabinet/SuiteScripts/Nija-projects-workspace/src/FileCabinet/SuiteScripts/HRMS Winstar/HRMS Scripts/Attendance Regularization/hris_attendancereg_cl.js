/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define([
  "N/record",
  "N/query",
  "N/ui/message",
  "N/currentRecord",
  "N/format",
], function (record, query, message, currentRecord, format) {
  function fieldChanged(context) {
    var currentRec = context.currentRecord;
    var fieldId = context.fieldId;
    debugger;
    if (
      fieldId === "custrecord_hr_attend_regular_date" ||
      fieldId === "custrecord_hr_attend_reg_employee"
    ) {
      var regularDateValue = currentRec.getValue(
        "custrecord_hr_attend_regular_date"
      );
      var regularEmployee = currentRec.getValue(
        "custrecord_hr_attend_reg_employee"
      );

      if (regularDateValue && regularEmployee) {
        var regularDateObj = format.parse({
          value: regularDateValue,
          type: format.Type.DATE,
        });
        var regularDate = format.format({
          value: regularDateObj,
          type: format.Type.DATE,
        });

        /*  var sqlQuery =
                    "SELECT " +
                    "CUSTRECORD_HR_DAILY_ATTENDANCE_DATE as date, " +
                    "CUSTRECORD_HR_DAILY_ATTENDANCE_EMP_NAME as employee, " +
                    "CUSTRECORD_HR_DAILY_ATTENDANCE_IN_TIME as intime, " +
                    "CUSTRECORD_HR_DAILY_ATTENDANCE_OUT_TIME as outtime, " +
                    "id as internalid " +
                    "FROM " +
                    "customrecord_njt_hr_daily_attendance " +
                    "WHERE " +
                    "CUSTRECORD_HR_DAILY_ATTENDANCE_DATE = '" + regularDate + "' AND " +
                    "CUSTRECORD_HR_DAILY_ATTENDANCE_EMP_NAME = '" + regularEmployee + "'";
 */

        var sqlQuery =
          "SELECT " +
          "custrecord_njt_emp_daily_date as date, " +
          "custrecord_njt_daily_atten_emp as employee, " +
          "custrecord_njt_emp_daily_in_time as intime, " +
          "custrecord_njt_emp_daily_out_time as outtime,custrecord_hris_shiftmaser as shift,custrecord_hris_emp_daily_nightshift as nightshift," +
          "id as internalid ,custrecord_njt_emp_daily_enddate as enddate " +
          "FROM " +
          "customrecord_njt_emp_daily_atten_ch " +
          "WHERE " +
          "custrecord_njt_emp_daily_date = '" +
          regularDate +
          "' AND " +
          "custrecord_njt_daily_atten_emp = '" +
          regularEmployee +
          "'";
        log.debug("sqlQuery", sqlQuery);
        var results = query.runSuiteQL({
          query: sqlQuery,
        });

        var resultSet = results.asMappedResults();

        if (resultSet.length > 0) {
          var result = resultSet[0];
          var enddate = result.enddate || "";
          var nightshift = result.nightshift || "F";

          if (enddate != "") {
            var formatenddate = format.parse({
              value: enddate,
              type: format.Type.DATE,
            });
            currentRec.setValue("custrecord_hr_attend_enddate", formatenddate);
          }

          currentRec.setValue(
            "custrecord_hr_attend_reg_daily_id",
            result.internalid
          );
          currentRec.setValue("custrecord_hr_attend_reg_in_", result.intime);
          currentRec.setValue(
            "custrecord_hr_attend_reg_out_time",
            result.outtime
          );
          currentRec.setValue("custrecord_hr_attend_reg_shift", result.shift);
          if (nightshift == "T") {
            var nightcheck = true;
          } else {
            var nightcheck = false;
          }
          currentRec.setValue(
            "custrecord_hr_attend_reg_nightshift",
            nightcheck
          );
        }
      }
    }
    if (
      fieldId === "custrecord_hr_attend_regularstartdate" ||
      fieldId === "custrecord_hr_attend_regularenddate" ||
      fieldId == "custrecord_hr_attend_regular_reg_in" ||
      fieldId == "custrecord_hr_attend_regular_reg_out"
    ) {
      var regularstartdate =
        currentRec.getValue("custrecord_hr_attend_regularstartdate") || "";
      var regularenddate =
        currentRec.getValue("custrecord_hr_attend_regularenddate") || "";
      var regularIn =
        currentRec.getValue("custrecord_hr_attend_regular_reg_in") || "";
      var regularOut =
        currentRec.getValue("custrecord_hr_attend_regular_reg_out") || "";
      var nightcheck =
        currentRec.getValue("custrecord_hr_attend_reg_nightshift") || false;

      if (regularstartdate != "" && regularenddate != "") {
        var formatregularworkstartdate = format.format({
          value: new Date(regularstartdate),
          type: format.Type.DATE,
        });

        var formatregularworkenddate = format.format({
          value: new Date(regularenddate),
          type: format.Type.DATE,
        });

        if (nightcheck == true) {
          if (formatregularworkstartdate == formatregularworkenddate) {
            alert("For Night Shift you have to given next date of start date");
            currentRec.setValue({
              fieldId: "custrecord_hr_attend_regularenddate",
              value: "",
            });

            return false;
          }
        }

        log.emergency("formatregularstartdate", formatregularworkstartdate);
        log.emergency("formatregularenddate", formatregularworkenddate);
        if (regularIn != "" && regularOut != "") {
          var totalWorkingHours = calculateHoursDiffdecimal(
            formatregularworkstartdate,
            regularIn,
            formatregularworkenddate,
            regularOut
          );
          log.debug("totalWorkingHours", totalWorkingHours);
          currentRec.setValue(
            "custrecord_hr_attend_reg_hours",
            totalWorkingHours.toFixed(2)
          );
        }
      }
    }
    if (
      fieldId == "custrecord_hr_attend_regular_reg_in" ||
      fieldId == "custrecord_hr_attend_regular_reg_out"
    ) {
      var IntimeValue = currentRec.getValue({
        fieldId: "custrecord_hr_attend_regular_reg_in",
      });

      if (IntimeValue) {
        // Match hh:mm AM/PM
        var timePattern = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;

        if (!timePattern.test(IntimeValue)) {
          alert(
            "Please enter Regular time in hh:mm AM/PM format. Example: 07:00 AM"
          );
          currentRec.setValue({
            fieldId: "custrecord_hr_attend_regular_reg_in",
            value: "",
          });
        }
      }
      var OuttimeValue = currentRec.getValue({
        fieldId: "custrecord_hr_attend_regular_reg_out",
      });

      if (OuttimeValue) {
        // Match hh:mm AM/PM
        var timePattern = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;

        if (!timePattern.test(OuttimeValue)) {
          alert(
            "Please enter Regular time in hh:mm AM/PM format. Example: 07:00 PM"
          );
          currentRec.setValue({
            fieldId: "custrecord_hr_attend_regular_reg_out",
            value: "",
          });
        }
      }
    }
  }
  function saveRecord(context) {
    debugger;
    var currentRec = context.currentRecord;
    var reghrs = currentRec.getValue({
      fieldId: "custrecord_hr_attend_reg_hours",
    });
    if (reghrs <= 0) {
      alert("Please Enter Correct Regularization In and Out Time ");
      return false;
    } else {
      return true;
    }
  }
  return {
    fieldChanged: fieldChanged,
    saveRecord: saveRecord,
  };
});
function calculateHoursDiffdecimal(startDate, startTime, endDate, endTime) {
  function parseDateTime(dateStr, timeStr) {
    // dateStr = "15/06/2025"
    var parts = dateStr.split("/");
    var day = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1; // JS month 0-11
    var year = parseInt(parts[2], 10);

    // timeStr = "10:47 AM"
    var timeParts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeParts) throw new Error("Invalid time format: " + timeStr);

    var hour = parseInt(timeParts[1], 10);
    var minute = parseInt(timeParts[2], 10);
    var ampm = timeParts[3].toUpperCase();

    if (ampm === "PM" && hour !== 12) hour += 12;
    if (ampm === "AM" && hour === 12) hour = 0;

    return new Date(year, month, day, hour, minute, 0, 0);
  }

  var start = parseDateTime(startDate, startTime);
  var end = parseDateTime(endDate, endTime);

  var diffHours = (end - start) / (1000 * 60 * 60);
  return diffHours;
}
