/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 *@NModuleScope Public
 */


define([
  "N/search",
  "N/query",
  "N/format",
  "N/record",
  "./moment.js",
], function (search, query, format, record, moment) {
 
  function pageInit(scriptContext) {
    try {
      debugger;
      var currentObjRecord = scriptContext.currentRecord;
      var timesheetdate =
        currentObjRecord.getValue({
          fieldId: "custrecord_hris_time_date",
        }) || "";
      console.log("timesheetdate", timesheetdate);
      var sublistcount = currentObjRecord.getLineCount({
        sublistId: "recmachcustrecord_hris_time_linkid",
      });
      console.log("sublistcount", sublistcount);
      if (sublistcount == 0) {
        currentObjRecord.setCurrentSublistValue({
          sublistId: "recmachcustrecord_hris_time_linkid",
          fieldId: "custrecord_njt_est_det_lines_subsidiary",
          line: 0,
          value: timesheetdate,
        });
      }
    } catch (e) {
      console.log("error in lineinit : " + e);
    }
  }

  function fieldChanged(scriptContext) {
    try {
      var currentObjRecord = scriptContext.currentRecord;

      debugger;
      if (
        scriptContext.fieldId == "custrecord_hris_man_daily_attendate" ||
        scriptContext.fieldId == "custrecord_hris_man_daily_employee"
      ) {
        var currentObjRecord = scriptContext.currentRecord;
        var timesheetdate =
          currentObjRecord.getValue({
            fieldId: "custrecord_hris_man_daily_attendate",
          }) || "";
        var employee =
          currentObjRecord.getValue({
            fieldId: "custrecord_hris_man_daily_employee",
          }) || "";
          var employeename = currentObjRecord.getText({
            fieldId: "custrecord_hris_man_daily_employee",
          }) || "";
        var employeecategory =
          currentObjRecord.getValue({
            fieldId: "custrecord_hris_man_daily_emp_catagory",
          }) || "";

        var empcatseq = getempcategorysequence(employeecategory);
        var timesheetdate = format.format({
    value: timesheetdate,
    type: format.Type.DATE
});
        if (empcatseq != 3 && timesheetdate && employee) {
          var manualsql =
            " select * from customrecord_hris_man_dailyattendance where custrecord_hris_man_daily_attendate='" +
            timesheetdate +
            "' \
                         and custrecord_hris_man_daily_employee =" + employee + " and isinactive='F'";

          var result = query
            .runSuiteQL({
              query: manualsql,
            })
            .asMappedResults();

          if (result && result.length > 0) {
            alert(
    'Attendance is already there for employee ' +
    employeename +
    ' on ' +
    timesheetdate
);
currentObjRecord.setValue({
            fieldId: "custrecord_hris_man_daily_attendate",
            value:'',
            ignoreFieldchange:true
          }) 

          }
        }
      }
    } catch (e) {
      console.log("error in fieldchange : " + e);
    }
  }

  function saveRecord(scriptContext) {
    try {
      debugger;

      var currentObjRecord = scriptContext.currentRecord;

      var BudEstimateCost =
        currentObjRecord.getValue({
          fieldId: "custrecord_njt_total_amount",
        }) || 0;
      console.log("BudEstimateCost", BudEstimateCost);

      var itermcount = currentObjRecord.getLineCount({
        sublistId: "recmachcustrecord_hris_time_linkid",
      });
      log.debug("itermcount", itermcount);
      var totdiscamt = 0;
      var check = 0;
      if (itermcount != 0) {
        var totalcost = 0;
        for (var i = 0; i < itermcount; i++) {
          var currentObjRecord = scriptContext.currentRecord;
          var Netamount =
            currentObjRecord.getSublistValue({
              sublistId: "recmachcustrecord_hris_time_linkid",
              //  fieldId: 'custrecord_njt_est_det_lines_net_amt',
              fieldId: "custrecord_njt_est_det_lines_net_uamt",
              line: i,
            }) || 0;
          console.log("Netamount", Netamount);
          totalcost = totalcost + parseFloat(Netamount);
          console.log("totalcost", totalcost);
        }
      }
      if (totalcost == BudEstimateCost) {
        currentObjRecord.setValue({
          // fieldId: 'discounttotal',
          fieldId: "custrecord_njt_revised_budget",
          value: totalcost,
        });
        return true;
      } else if (totalcost != BudEstimateCost) {
        alert("BOQ actual amount not tally with estimate amount");
        return false;
      }
    } catch (e) {
      console.log("error in lineinit : " + e);
    }
  }
  /**
   * Get Employee Category Sequence using SuiteQL
   * @param {number|string} empcategory - Employee Category internal ID
   * @returns {number|null}
   */
  function getempcategorysequence(empcategory) {
    var seq = null;

    try {
      if (!empcategory) {
        return null;
      }

      var sql =
        " SELECT  custrecord_hris_emp_cat_seq AS category_sequence FROM \
                customrecord_hris_employeecategory \
            WHERE id = " + empcategory;

      var result = query
        .runSuiteQL({
          query: sql,
        })
        .asMappedResults();

      if (result && result.length > 0) {
        seq = result[0].category_sequence;
      }
    } catch (e) {
      log.error("Error in getempcategorysequence", e);
    }

    return seq;
  }

  return {
    fieldChanged: fieldChanged,
   // lineInit: lineInit,
    //  pageInit: pageInit,
    // saveRecord: saveRecord,
  };
});

function _logValidation(value) {
  if (
    value != null &&
    value !== "" &&
    value != undefined &&
    value.toString() != "NaN" &&
    value != NaN
  ) {
    return true;
  } else {
    return false;
  }
}

function ZeroPad(number) {
  const digits = 2; // Number of digits we want
  return (
    Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number
  );
}
