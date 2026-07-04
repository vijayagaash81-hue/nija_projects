/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
var SEARCH, MOMENT, RECORD, QUERY;
define(['N/currentRecord', 'N/record', 'N/search', './moment.js', 'N/format', 'N/query'],

  function (currentRecord, record, search, moment, format, query) {
    SEARCH = search;
    MOMENT = moment;
    RECORD = record;
    QUERY = query;

    function pageInit(context) {
      debugger;
    }

    function saveRecord(context) {
      debugger;
      try {
        var record = context.currentRecord;

        // Get the start date and number of days

        var startDateStr = record.getValue({ fieldId: "custbody_start_date" });
        var noOfDays =
          parseInt(record.getValue({ fieldId: "custbody_no_of_days" })) || 0;
        var leaveappid = record.getValue({

        });

        // Validate inputs
        if (!startDateStr || isNaN(noOfDays) || noOfDays < 0) {
          alert("Please provide a valid Start Date and Number of Days.");
          return false; // Prevent record save if inputs are invalid
        }

        // Parse the start date
        var startDate = format.parse({
          value: startDateStr,
          type: format.Type.DATE,
        });

        // Calculate end date by adding days
        var endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + noOfDays);

        // Format the end date to NetSuite's date format
        var newfromdate = format.format({
          value: endDate,
          type: format.Type.DATE,
        });

        // Load and set values in leave application
        // var leaveapplrec=record.load({
        //     type:"customrecord_hris_leaveapplication",
        //     id:leaveappid,
        //     isDynamic:true
        // });

        // // Set the end date in the custom field
        // leaveapplrec.setValue({
        //     fieldId: 'custrecord_hris_lve_todate',
        //     value: newfromdate
        // });

        var leaveaplrec = record.submitFields({
          type: "customrecord_hris_leaveapplication",
          id: leaveappid,
          values: {
            "custrecord_hris_lve_fromdate": newfromdate
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: true,
          },
        });

        return true; // Allow record to save
      } catch (e) {
        alert("Error calculating end date: " + e.message);
        return false; // Prevent save on error
      }
    }
    function fieldChanged(context) {
      try {
        debugger;
        var recordObj = context.currentRecord;







        if (context.fieldId == "custrecord_hris_pass_empname" || context.fieldId == "custrecord_hris_pass_purpose") {


          // All APPROVED Annual Leaves which has more than 10 days and also Leave Considered as should TRUE should come here.
          var empid = recordObj.getValue('custrecord_hris_pass_empname');
           var purposetype = recordObj.getValue('custrecord_hris_pass_purpose');
          var purposeseq = purposesequence(purposetype);
          if (empid && purposeseq == 1) {
            var leaveapplsql = "select * from customrecord_hris_leaveapplication where custrecord_hris_lve_employeename = '" + empid + "' and \
                                                custrecord_hris_lve_hrmsapprovalstatus =2 and custrecord_hris_lve_cancellation='F' and\
                                                 custrecord_hris_lve_pass_required = 'T' and custrecord_hris_lve_pass_issue ='F'"
            // Fist remove select Option from the field
            var leaveapplsqlrecords = getResult(leaveapplsql);
            log.debug('leaveappsql', leaveapplsql);
            // log.debug('records in getEmpTotalLeaveTaken', JSON.stringify(records));
            var empLeaveAppField = recordObj.getField({
              fieldId: 'custpage_leave_app_no'
            });
            // log.debug('empLeaveAppField', empLeaveAppField);
            if (empLeaveAppField) {
            empLeaveAppField.removeSelectOption({
              value: null
            });
            if (leaveapplsqlrecords.length > 0) {
              for (var i = 0; i < leaveapplsqlrecords.length; i++) {
                var leaveAppNoValue = leaveapplsqlrecords[i].id;
                var leaveAppNoText = leaveapplsqlrecords[i].name;
                empLeaveAppField.insertSelectOption({
                  value: leaveAppNoValue,
                  text: leaveAppNoText
                });
              }
              if (leaveapplsqlrecords.length == 1) {
                recordObj.setValue({
                  fieldId: 'custrecord_hris_pass_leave_application',
                  value: leaveAppNoValue,
                  ignoreFieldChange: false
                });
              }
            }
          }

          }
        }
        /* if (context.fieldId == "custrecord_hris_pass_purpose") {

          var purposetype = recordObj.getValue('custrecord_hris_pass_empname');
          var purposeseq = purposesequence(purposetype);
          if (purposeseq == 1) {


          }

        } */

        if (context.fieldId == "custpage_leave_app_no") {
          // Get Leave Application number
          var LeaveAppNo = recordObj.getValue('custpage_leave_app_no');
          log.debug('LeaveAppNo', LeaveAppNo);
          // Set Value
          recordObj.setValue({
            fieldId: 'custrecord_hris_pass_leave_application',
            value: LeaveAppNo,
            ignoreFieldChange: false
          });

        }

// Handle changes to from_date or to_date
        if (context.fieldId == "custrecord_hris_pass_from_date" || context.fieldId == "custrecord_hris_pass_to_date") {
            var fromDate = recordObj.getValue('custrecord_hris_pass_from_date');
            var toDate = recordObj.getValue('custrecord_hris_pass_to_date');

            if (fromDate && toDate) {
                // Convert dates to Date objects
                var startDate = new Date(fromDate);
                var endDate = new Date(toDate);

                // Calculate the difference in days
                var timeDiff = endDate.getTime() - startDate.getTime();
                var daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // Adding 1 to include both start and end dates

                // Ensure the difference is not negative
                if (daysDiff >= 0) {
                    recordObj.setValue({
                        fieldId: 'custrecord_hris_pass_total_days',
                        value: daysDiff,
                        ignoreFieldChange: false
                    });
                } else {
                    log.debug('Invalid Date Range', 'To Date is before From Date');
                    // Optionally clear the total days field or set to 0
                    recordObj.setValue({
                        fieldId: 'custrecord_hris_pass_total_days',
                        value: 0,
                        ignoreFieldChange: false
                    });
                }
            } else {
                // Clear total days if either date is missing
                recordObj.setValue({
                    fieldId: 'custrecord_hris_pass_total_days',
                    value: 0,
                    ignoreFieldChange: false
                });
            }
        }


      } catch (e) {
        log.error("Error in fieldChanged", e);
      }
    }

    function getResult(pSQL) {
      // log.debug("QUERY", pSQL);
      var queryResults = QUERY.runSuiteQL({
        query: pSQL
      });
      var records = queryResults.asMappedResults();
      return records;
    }
    function purposesequence(purposetype) {
      var purposesql = "Select * from customrecord_hris_purpose_type where id =" + purposetype;
      var purposesqlrecords = getResult(purposesql);
      log.debug('purposesql', purposesql);

      if (purposesqlrecords.length > 0) {
        var purposeseq = purposesqlrecords[0].custrecord_hris_purpose_seqno
        log.audit('Purpose Sequence', purposeseq);
      }
      return purposeseq;

    }
    return {
      pageInit: pageInit,
      fieldChanged: fieldChanged,
      // saveRecord: saveRecord,
    }
  });
