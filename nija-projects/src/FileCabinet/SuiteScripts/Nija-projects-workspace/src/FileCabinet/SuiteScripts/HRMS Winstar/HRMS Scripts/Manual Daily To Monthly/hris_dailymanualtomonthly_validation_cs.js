/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 * @NModuleScope Public
 */

var QUERY;
define([
  "N/currentRecord",
  "N/record",
  "N/ui/dialog",
  "N/search",
  "N/format",
  "N/query",
  "N/url",
], function (currentRecord, record, dialog, search, format, query, url) {
  QUERY = query;

  //function fieldChangedCount(type, name, linenum)
  function pageInit(scriptContext) {
    debugger;
    try {
      var currentRecordObj = currentRecord.get();

      var status = currentRecordObj.getValue({
        fieldId: "custpage_mrstatus",
      });

      function refresh() {
        if (new Date().getTime() - time >= 60000) {
          window.location.reload(true);
        } else {
          setTimeout(refresh(), 1000);
        }
      }

      setTimeout(function () {
        var status = currentRecordObj.getValue({
          fieldId: "custpage_mrstatus",
        });

        if (status != "Completed") {
          // Assuming 'custpage_submitbutton' is the id of the submit button
          document.getElementById("custpage_submitbutton").click();

          saveRecord();
        } else {
          var suiteletURL = url.resolveScript({
            scriptId: "customscript_hris_dailymanmonth_crite_sl",
            deploymentId: "customdeploy_hris_dailymanmonth_crite_sl",
          });

          window.location.href = suiteletURL;
        }
      }, 1000);
    } catch (e) {
      log.debug("error in page init ", e);
    }
  }

  function fieldChanged(scriptContext) {
    debugger;
    try {
      //  var currentRecord = scriptContext.currentRecord;
      var currentRecordObj = currentRecord.get();
      if (
        scriptContext.fieldId == "custpage_month" ||
        scriptContext.fieldId == "custpage_year" ||
        scriptContext.fieldId == "custpage_subsi" ||
        scriptContext.fieldId == "custpage_processgroup" ||
        scriptContext.fieldId == "custpage_employee"
      ) {
        var month = currentRecordObj.getValue({
          fieldId: "custpage_month",
        });

        var year = currentRecordObj.getValue({
          fieldId: "custpage_year",
        });
        var subsidiary = currentRecordObj.getValue({
          fieldId: "custpage_subsi",
        });
        var paygroup = currentRecordObj.getValue({
          fieldId: "custpage_processgroup",
        });
        var employee = currentRecordObj.getValue({
          fieldId: "custpage_employee",
        });

        var monthname = currentRecordObj.getText({
          fieldId: "custpage_month",
        });

        var yearname = currentRecordObj.getText({
          fieldId: "custpage_year",
        });
        var subsidiaryname = currentRecordObj.getText({
          fieldId: "custpage_subsi",
        });
        var paygroupname = currentRecordObj.getText({
          fieldId: "custpage_processgroup",
        });
        var employeename = currentRecordObj.getText({
          fieldId: "custpage_employee",
        });
        
        if (month && year && subsidiary && paygroup && employee) {
          var payprocessQuery =
            "SELECT * FROM  customrecord_hris_pay_process \
                                        WHERE   custrecord_hris_pay_proc_pay_group = " +
            paygroup +
            " \
    AND custrecord_hris_pay_proc_pay_month = " +
            month +
            "  and custrecord_hris_pay_proc_company_name = " +
            subsidiary +
            "\
    AND custrecord_hris_pay_proc_year = " +
            year +
            " and custrecord_hris_pay_proc_employee = " +
            employee +
            "";

          var queryResults = query.runSuiteQL({
            query: payprocessQuery,
          });
          var records = queryResults.asMappedResults();

          if (records.length > 0) {
            alert(
              " Pay Process is already performed  for Employee : " +
                employeename +
                "  Pay Group: " +
                paygroupname +
                ", Month: " +
                monthname +
                " and Year: " +
                yearname +
                " and Subsidiary: " +
                subsidiaryname +
                " so you cannot process the daily attendance"
            );
               currentRecordObj.setValue({
          fieldId: "custpage_month",
          value:""
        });
 currentRecordObj.setValue({
          fieldId: "custpage_year",
          value:""
        });
            return false;
          }
        } else if (month && year && subsidiary && paygroup) {
          var payprocessQuery =
            "SELECT * FROM  customrecord_hris_pay_process \
                                        WHERE   custrecord_hris_pay_proc_pay_group = " +
            paygroup +
            " \
    AND custrecord_hris_pay_proc_pay_month = " +
            month +
            "  and custrecord_hris_pay_proc_company_name = " +
            subsidiary +
            "\
    AND custrecord_hris_pay_proc_year = " +
            year +
            " ";

          var queryResults = query.runSuiteQL({
            query: payprocessQuery,
          });
          var records = queryResults.asMappedResults();

          if (records.length > 0) {
            alert(
              " Pay Process is already performed  for Pay Group: " +
                paygroupname +
                ", Month: " +
                monthname +
                " and Year: " +
                yearname +
                " and Subsidiary: " +
                subsidiaryname+
                " so you cannot process the daily attendance"
            );
              var month = currentRecordObj.getValue({
          fieldId: "custpage_month",
        });

        var year = currentRecordObj.getValue({
          fieldId: "custpage_year",
        });
            currentRecordObj.setValue({
          fieldId: "custpage_month",
          value:""
        });
 currentRecordObj.setValue({
          fieldId: "custpage_year",
          value:""
        });
            return false;
          }
        }

      }
    } catch (e) {
      log.debug("error in fieldchange ", e);
    }
  }

  return {
    fieldChanged: fieldChanged,
  };
});
