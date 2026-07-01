function SCH_LeaveCreditOnJoining() {
  nlapiLogExecution("DEBUG", "Schedule script is working");
  var empIntenalId = "";
  empIntenalId = nlapiGetContext().getSetting(
    "SCRIPT",
    //"custscript_employee_id_to_create_leaves"
    "custscript_hrisempidtocreateleaves"
  );
 //empIntenalId = 7592421;
  nlapiLogExecution("DEBUG","empIntenalId", empIntenalId );
  var employeeData = nlapiLookupField("employee", empIntenalId, [
    "hiredate",
    "custentity_hris_empgender",
    "custentity_emp_employee_job_status",
    "custentity_hris_empreligion",
    "custentity_emp_grade_",
    "subsidiary",
    "location",
    "custentity_hris_empmaritalstatus",
    "custentity_hris_empweeklyoffcriteria",
    "custentity_hris_empomani",
  ]);
  var empHireDateObj = nlapiStringToDate(employeeData.hiredate);
  nlapiLogExecution("DEBUG", "empHireDateObj", empHireDateObj);
  var empGender = employeeData.custentity_hris_empgender;
  nlapiLogExecution("DEBUG", "empGender", empGender);
  var emp_job_Status = employeeData.custentity_emp_employee_job_status;
  nlapiLogExecution("DEBUG", "emp_job_Status", emp_job_Status);
  var emp_religion = employeeData.custentity_hris_empreligion;
  nlapiLogExecution("DEBUG", "emp_religion", emp_religion);
  var emp_grade = employeeData.custentity_emp_grade_;
  nlapiLogExecution("DEBUG", "emp_grade", emp_grade);
  var emp_weeklyOffCriteria = employeeData.custentity_hris_empweeklyoffcriteria;
  nlapiLogExecution("DEBUG", "emp_weeklyOffCriteria", emp_weeklyOffCriteria);
  var subsidiary = employeeData.subsidiary;
  nlapiLogExecution("DEBUG", "subsidiary", subsidiary);
  var locationID = employeeData.location;
  nlapiLogExecution("DEBUG", "locationID", locationID);
  var maritalStatus = employeeData.custentity_hris_empmaritalstatus;
  nlapiLogExecution("DEBUG", "maritalStatus", maritalStatus);
  var omani_non_Omani = employeeData.custentity_hris_empomani;
  nlapiLogExecution("DEBUG", "omani_non_Omani", omani_non_Omani);

  var LeaveCreditRec = searchLeaveCreditConfigRecords(
    empIntenalId,
    empHireDateObj,
    empGender,
    emp_job_Status,
    emp_religion,
    emp_grade,
    subsidiary,
    locationID,
    maritalStatus,
    emp_weeklyOffCriteria,
    omani_non_Omani
  );
}

function searchLeaveCreditConfigRecords(
  empIntenalId,
  empHireDateObj,
  empGender,
  emp_job_Status,
  emp_religion,
  emp_grade,
  subsidiary,
  locationID,
  maritalStatus,
  emp_weeklyOffCriteria,
  omani_non_Omani
) {
  try {
    var LeaveCarryFwdMax = 0;
    var finalAnnual = 0;
    var context = nlapiGetContext();
    var filters = new Array();
    var columns = new Array();
    filters.push(
      new nlobjSearchFilter(
        "custrecord_hris_credit_on_joining",
        null,
        "is",
        "T"
      )
    );

    filters.push(
      new nlobjSearchFilter(
        "custrecord_hris_employee_job_status",
        null,
        "anyof",
        emp_job_Status
      )
    );

    // As Per Vanithamam Told Remove this filter by Florence on 16.02.2024 

   /* filters.push(
      new nlobjSearchFilter(
        "custrecord_hris_religion",
        null,
        "anyof",
        emp_religion
      )
    ); */


    filters.push(
      new nlobjSearchFilter("custrecord_hris_grade_", null, "anyof", emp_grade)
    );
    filters.push(
      new nlobjSearchFilter(
        "custrecord_hris_weekly_off_criteria_",
        null,
        "anyof",
        emp_weeklyOffCriteria
      )
    );
    filters.push(
      new nlobjSearchFilter(
        "custrecord_hris_marital_status",
        null,
        "anyof",
        maritalStatus
      )
    );
    filters.push(new nlobjSearchFilter("isinactive", null, "is", "F"));
    filters.push(
      new nlobjSearchFilter("custrecord_hris_gender", null, "anyof", empGender)
    );
    filters.push(
      new nlobjSearchFilter(
        "custrecord_hris_nationality_omani_non",
        null,
        "anyof",
        omani_non_Omani
      )
    );
    filters.push(
      new nlobjSearchFilter(
        "custrecord_hris_sequence_no__",
        null,
        "notequalto",
        4
      )
    );
    // newly added as per vanitha mam on 16.02.2024
    filters.push(
      new nlobjSearchFilter(
        "custrecord_hris_lveconfig_excluautobalan",
        "custrecord_hris_leave_type",        
        "is",
        "F"
      )
    );

    columns.push(new nlobjSearchColumn("internalid"));
    columns.push(
      new nlobjSearchColumn(
        // Florence Field is no
     
        "custrecord_hris_lveconfig_rotationlve",
        "custrecord_hris_leave_type"
      )
    );

    var searchresults = nlapiSearchRecord(
      "customrecord_hris_leave_credit_configura",
      null,
      filters,
      columns
    );
    nlapiLogExecution("DEBUG", "searching credit config");
    nlapiLogExecution("DEBUG","searchresults",searchresults);
   // nlapiLogExecution("DEBUG","searchresults",searchresults.length);
    if (searchresults != null) {
      nlapiLogExecution(
        "DEBUG",
        "Leave credit config search complete",
        "searchresults=" + searchresults.length
      );
      for (var i = 0; i < searchresults.length; i++) {
        var LeaveCreditId = searchresults[i].getValue("internalid");
        nlapiLogExecution("DEBUG", "Leave credit config id", LeaveCreditId);

        var o_leaveCreditConfig = nlapiLoadRecord(
          "customrecord_hris_leave_credit_configura",
          LeaveCreditId
        );

        var leaveType = o_leaveCreditConfig.getFieldValue(
          "custrecord_hris_leave_type"
        );
        nlapiLogExecution("DEBUG", "Leave type: ", leaveType);

        var rot_chkbx = searchresults[i].getValue(
         // "custrecord_hris_is_rotational_leave",
         "custrecord_hris_lveconfig_rotationlve",
         "custrecord_hris_leave_type"
        );
        nlapiLogExecution("DEBUG", "rot_chkbx: ", rot_chkbx);

        var CreditFreq = o_leaveCreditConfig.getFieldValue(
          "custrecord_hris_credit_frequency"
        );
        nlapiLogExecution("DEBUG", "Credit frequency: ", CreditFreq);

        var CreditMonth = o_leaveCreditConfig.getFieldValue(
          "custrecord_hris_credit_month"
        );
        nlapiLogExecution("DEBUG", "Credit month: ", CreditMonth);

        var NoOfDaysCredited = o_leaveCreditConfig.getFieldValue(
          "custrecord_hris_no_of_days_to_credit"
        );
        nlapiLogExecution("DEBUG", "No of days credited", NoOfDaysCredited);

        var CreditOnJoining = o_leaveCreditConfig.getFieldValue(
          "custrecord_hris_credit_on_joining"
        );
        nlapiLogExecution("DEBUG", "Credit on joining", CreditOnJoining);

        var rounded_off_type = o_leaveCreditConfig.getFieldValue(
          "custrecord_hris_round_off"
        );
        nlapiLogExecution("DEBUG", "Round off Type ", rounded_off_type);

        var rounded_off_value_text = o_leaveCreditConfig.getFieldText(
          "custrecord_hris_round_off"
        );
        nlapiLogExecution(
          "DEBUG",
          "Round off Value text ",
          rounded_off_value_text
        );

        var proRataCheck = o_leaveCreditConfig.getFieldValue(
          "custrecord_hris_pro_rata"
        );

        var roundOffId = "";
        if (proRataCheck == "T") {
          roundOffId = o_leaveCreditConfig.getFieldValue(
            "custrecord_hris_round_off"
          );
          nlapiLogExecution("DEBUG", "roundOffId = ", roundOffId);
        }
        if (CreditFreq == 3) {
          nlapiLogExecution("DEBUG", "INside (CreditFreq==3)");
          var final_days_to_credit = NoOfDaysCredited;
          nlapiLogExecution("DEBUG", "final_days_to_credit (CreditFreq==3)");
          var LeaveBalSearch = searchEmpInLeavebalance(
            rot_chkbx,
            empIntenalId,
            leaveType,
            CreditFreq,
            CreditMonth,
            NoOfDaysCredited,
            final_days_to_credit
          );
        }
        if (CreditFreq == 1) {
          nlapiLogExecution("DEBUG", "INside (CreditFreq==1)");
          var date = new Date();
          var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          var lastDayMth = lastDay.getDate();
          lastDayMth = parseFloat(lastDayMth);
          var date_no = getdatenumber(empHireDateObj);
          nlapiLogExecution("DEBUG", "Date Number: ", date_no);

          var month = empHireDateObj.getMonth() + 1;
          var year = empHireDateObj.getFullYear();
          var month_days = getmonth_days(month, year);
          nlapiLogExecution("DEBUG", "month_days : ", month_days);

          var total_months = "";
          var Calender_start_month = nlapiLookupField(
            "customrecord_hris_leave_calender_year",
            1,
            "custrecord_hris_lvecalyr_startmth"
          );
          nlapiLogExecution(
            "DEBUG",
            "Calender_start_month : ",
            Calender_start_month
          );
          var hireDate = empHireDateObj;
          var hireMonth = hireDate.getMonth() + 1;
          var hireDATE = hireDate.getDate();
          hireDATE = parseFloat(hireDATE);
          nlapiLogExecution("DEBUG", "hireMonth : ", hireMonth);

          var final_days_to_credit;
          if (proRataCheck == "T") {
            final_days_to_credit =
              (parseFloat(NoOfDaysCredited) * (lastDayMth - hireDATE + 1)) / 31;

            nlapiLogExecution(
              "DEBUG",
              "Pro rata checked : ",
              "calculating the leave according to pro rata"
            );
            nlapiLogExecution(
              "DEBUG",
              "final_days_to_credit when proRataCheck is true",
              final_days_to_credit
            );
          } else {
            nlapiLogExecution(
              "DEBUG",
              "Pro rata NOT checked : ",
              "final count = no of days credited"
            );
            final_days_to_credit = NoOfDaysCredited;
            nlapiLogExecution(
              "DEBUG",
              "final_days_to_credit when proRataCheck is false",
              final_days_to_credit
            );
          }

          nlapiLogExecution(
            "DEBUG",
            "final_days_to_credit ",
            final_days_to_credit
          );
          nlapiLogExecution(
            "DEBUG",
            "Creating leave balance for config type : " + LeaveCreditId
          );
          var LeaveBalSearch = searchEmpInLeavebalance(
            rot_chkbx,
            empIntenalId,
            leaveType,
            CreditFreq,
            CreditMonth,
            NoOfDaysCredited,
            final_days_to_credit
          );
        }
        if (CreditFreq == 2) {
          nlapiLogExecution("DEBUG", "INside (CreditFreq==2)");

          var date_no = getdatenumber(empHireDateObj);
          nlapiLogExecution("DEBUG", "Date Number: ", date_no);

          var month = empHireDateObj.getMonth() + 1;
          var year = empHireDateObj.getFullYear();
          nlapiLogExecution("DEBUG", "aa month", month);
          nlapiLogExecution("DEBUG", "aa year", year);
          var month_days = getmonth_days(month, year);
          nlapiLogExecution("DEBUG", "month_days : ", month_days);

          var total_months = "";
          var Calender_start_month = nlapiLookupField(
            "customrecord_hris_leave_calender_year",
            1,
            "custrecord_hris_lvecalyr_startmth"
          );
          nlapiLogExecution(
            "DEBUG",
            "Calender_start_month : ",
            Calender_start_month
          );
          var hireDate = empHireDateObj;
          var hireMonth = hireDate.getMonth() + 1;

          nlapiLogExecution("DEBUG", "hireMonth : ", hireMonth);

          if (Calender_start_month == 1 || Calender_start_month == '01') {
            total_months = getmonthcountforendDec(hireMonth);
          }
          if (Calender_start_month == 9 || Calender_start_month == '09') {
            total_months = getmonthcountforendaugust(hireMonth);
          }
          nlapiLogExecution("DEBUG", "Total Months remaining : ", total_months);
          var days_count = nlapiAddMonths(hireDate, total_months);
          var oneDay = 24 * 60 * 60 * 1000;
          var diffDays = Math.round(
            Math.abs((hireDate.getTime() - days_count.getTime()) / oneDay)
          );
          nlapiLogExecution("DEBUG", "diffDays : ", diffDays);

          var No_Of_Daysin_month = parseInt(month_days) - parseInt(date_no);
          nlapiLogExecution(
            "DEBUG",
            "No_Of_Daysin_month : ",
            No_Of_Daysin_month
          );

          var total_days =
            parseInt(No_Of_Daysin_month) + parseInt(diffDays) + 1;
          nlapiLogExecution("DEBUG", "total_days : ", total_days);

          if (total_days == 366 || total_days == "366") {
            total_days = 365;
          }
          var credit_till_month =
            parseFloat(NoOfDaysCredited) * parseFloat(total_days);
          nlapiLogExecution("DEBUG", "credit_till_month : ", credit_till_month);

          finalAnnual = parseInt(credit_till_month) / 365;
          nlapiLogExecution("DEBUG", "finalAnnual : ", finalAnnual);

          var final_days_to_credit;
          if (proRataCheck == "T") {
            nlapiLogExecution(
              "DEBUG",
              "Pro rata checked : ",
              "calculating the leave according to pro rata"
            );
            final_days_to_credit = GetRoundOffvalueEmper(
              rounded_off_type,
              rounded_off_value_text,
              finalAnnual
            );
          } else {
            nlapiLogExecution(
              "DEBUG",
              "Pro rata NOT checked : ",
              "final count = no of days credited"
            );
            final_days_to_credit = NoOfDaysCredited;
          }

          nlapiLogExecution(
            "DEBUG",
            "final_days_to_credit ",
            final_days_to_credit
          );
          nlapiLogExecution(
            "DEBUG",
            "Creating leave balance for config type : " + LeaveCreditId
          );
          var LeaveBalSearch = searchEmpInLeavebalance(
            rot_chkbx,
            empIntenalId,
            leaveType,
            CreditFreq,
            CreditMonth,
            NoOfDaysCredited,
            final_days_to_credit
          );
        }
        if (CreditFreq == 4) {
          nlapiLogExecution("DEBUG", "INside (CreditFreq==4)");
          finalAnnual = NoOfDaysCredited * 4;
        }
// Sick Leave
        if (empHireDateObj) {
          var filters2 = new Array();
          var columns2 = new Array();

          filters2.push(
            new nlobjSearchFilter(
              "custrecord_hris_credit_on_joining",
              null,
              "is",
              "T"
            )
          );
          filters2.push(
            new nlobjSearchFilter(
              "custrecord_hris_employee_job_status",
              null,
              "anyof",
              emp_job_Status
            )
          );
         /* filters2.push(
            new nlobjSearchFilter(
              "custrecord_hris_religion",
              null,
              "anyof",
              emp_religion
            )
          ); */
          filters2.push(
            new nlobjSearchFilter(
              "custrecord_hris_grade_",
              null,
              "anyof",
              emp_grade
            )
          );
          filters2.push(
            new nlobjSearchFilter(
              "custrecord_hris_weekly_off_criteria_",
              null,
              "anyof",
              emp_weeklyOffCriteria
            )
          );
          filters2.push(
            new nlobjSearchFilter(
              "custrecord_hris_marital_status",
              null,
              "anyof",
              maritalStatus
            )
          );
          filters2.push(new nlobjSearchFilter("isinactive", null, "is", "F"));
          filters2.push(
            new nlobjSearchFilter(
              "custrecord_hris_gender",
              null,
              "anyof",
              empGender
            )
          );
          filters2.push(
            new nlobjSearchFilter(
              "custrecord_hris_nationality_omani_non",
              null,
              "anyof",
              omani_non_Omani
            )
          );
          filters2.push(
            new nlobjSearchFilter(
              "custrecord_hris_sequence_no__",
              null,
              "equalto",
              4
            )
          );

          columns2.push(new nlobjSearchColumn("internalid").setSort(false));
          columns2.push(new nlobjSearchColumn("custrecord_hris_leave_type"));

          columns2.push(
            new nlobjSearchColumn("custrecord_hris_no_of_days_to_credit")
          );

          var searchresults2 = nlapiSearchRecord(
            "customrecord_hris_leave_credit_configura",
            null,
            filters2,
            columns2
          );
          nlapiLogExecution("DEBUG","searchresults2",searchresults2); 
         // nlapiLogExecution("DEBUG","searchresults2.length",searchresults2.length);  
          var _year = parseInt(empHireDateObj.getFullYear() + 1);
          var _yearEndObj = new Date(_year, 0, 0);
          var DiffDays = DaysBetweenDates(empHireDateObj, _yearEndObj);
          nlapiLogExecution("debug", "DiffDays", DiffDays);
          nlapiLogExecution("debug", "_yearEndObj", _yearEndObj);
          nlapiLogExecution("debug", "empHireDateObj", empHireDateObj);

          if (searchresults2) {
            var totalDaysToCredit = 0;
            for (var k = 0; k < searchresults2.length; k++) {
              var to_be_credited_days = searchresults2[k].getValue(
                "custrecord_hris_no_of_days_to_credit"
              );
              nlapiLogExecution(
                "DEBUG",
                "to_be_credited_days:::::::::::",
                to_be_credited_days
              );

              totalDaysToCredit =
                parseFloat(totalDaysToCredit) + parseFloat(to_be_credited_days);
              nlapiLogExecution(
                "DEBUG",
                "totalDaysToCredit:::::::::::",
                totalDaysToCredit
              );
            }
            nlapiLogExecution("DEBUG", "totalDaysToCredit", totalDaysToCredit);

            var TotalDays =
              (parseFloat(totalDaysToCredit) * parseFloat(DiffDays)) / 365;
            TotalDays = parseFloat(TotalDays).toFixed(2);
            nlapiLogExecution("DEBUG", "TotalDays%%%%%%%%%%%", TotalDays);

            var credetedDays = 0;
            for (var j = 0; j < searchresults2.length; j++) {
              var leave_type = searchresults2[j].getValue(
                "custrecord_hris_leave_type"
              );
              var dyanamic_Days = searchresults2[j].getValue(
                "custrecord_hris_no_of_days_to_credit"
              );

              var filters3 = new Array();
              var columns3 = new Array();
              filters3.push(
                new nlobjSearchFilter(
                  "custrecord_hris_lvbal_employee_name",
                  null,
                  "is",
                  empIntenalId
                )
              );
              filters3.push(
                new nlobjSearchFilter(
                  "custrecord_hris_lvbal_leave_type",
                  null,
                  "is",
                  leave_type
                )
              );
              columns3.push(new nlobjSearchColumn("internalid"));
              var LeaveBalSearchResults3 = nlapiSearchRecord(
                "customrecord_hris_leavebalance",
                null,
                filters3,
                columns3
              );
              nlapiLogExecution("DEBUG","LeaveBalSearchResults3",LeaveBalSearchResults3);
             // nlapiLogExecution("DEBUG","LeaveBalSearchResults3.length",LeaveBalSearchResults3.length);  
              if (!LeaveBalSearchResults3) {
                var _days = "";

                if (parseFloat(credetedDays) < parseFloat(TotalDays)) {
                  var RemaingDays =
                    parseFloat(TotalDays) - parseFloat(credetedDays);

                  if (parseFloat(RemaingDays) >= parseFloat(dyanamic_Days)) {
                    _days = parseFloat(dyanamic_Days);
                  } else {
                    _days = parseFloat(RemaingDays);
                  }
                } else {
                  _days = parseFloat(0);
                }

                var SL_Type = searchresults2[j].getValue(
                  "custrecord_hris_leave_type"
                );
                var Rec = nlapiCreateRecord("customrecord_hris_leavebalance");
                Rec.setFieldValue(
                  "custrecord_hris_lvbal_employee_name",
                  empIntenalId
                );
                Rec.setFieldValue("custrecord_hris_lvbal_leave_type", SL_Type);
                Rec.setFieldValue(
                  "custrecord_hris_lvbal_annual_leave_bal",
                  parseFloat(dyanamic_Days)
                );
                nlapiLogExecution(
                  "DEBUG",
                  "parseFloat(_days)",
                  parseFloat(_days)
                );
                Rec.setFieldValue(
                  "custrecord_hris_lvbal_leave_balance_cred",
                  RoundValue(_days)
                );
                Rec.setFieldValue(
                  "custrecord_hris_lvbal_leave_balance_take",
                  0
                );
                Rec.setFieldValue(
                  "custrecord_hris_lvbal_available_leave_ba",
                  RoundValue(_days)
                );
                nlapiSubmitRecord(Rec);

                credetedDays =
                  parseInt(credetedDays) + parseInt(RoundValue(_days));
              }
            }
          }
        }

      }
    }
  } catch (e) {
    nlapiLogExecution(
      "DEBUG",
      "Error in function searchLeaveCreditConfigRecords()",
      e.message
    );
  }
}

function searchEmpInLeavebalance(
  rot_chkbx,
  empIntenalId,
  leaveType,
  CreditFreq,
  CreditMonth,
  NoOfDaysCredited,
  final_days_to_credit
) {
  nlapiLogExecution(
    "DEBUG",
    "In searchEmpInLeavebalance",
    "empIntenalId=" + empIntenalId + " , leaveType " + leaveType
  );
  var filters = new Array();
  var columns = new Array();
  filters.push(
    new nlobjSearchFilter(
      "custrecord_hris_lvbal_employee_name",
      null,
      "is",
      empIntenalId
    )
  );
  filters.push(
    new nlobjSearchFilter(
      "custrecord_hris_lvbal_leave_type",
      null,
      "is",
      leaveType
    )
  );
  columns.push(new nlobjSearchColumn("internalid"));
  var LeaveBalSearchResults = nlapiSearchRecord(
    "customrecord_hris_leavebalance",
    null,
    filters,
    columns
  );

  if (
    LeaveBalSearchResults == undefined ||
    LeaveBalSearchResults == null ||
    LeaveBalSearchResults == ""
  ) {
    nlapiLogExecution(
      "DEBUG",
      "Searcing for leave balance records complete",
      "No record found for give combination of employee and leave type"
    );

    var employee = nlapiLoadRecord("employee", empIntenalId);
    var empLocation = employee.getFieldValue("location");
    var empGrade = employee.getFieldValue("custentity_emp_grade_");
    var empGender = employee.getFieldValue("custentity_hris_empgender");
    var empJobStatus = employee.getFieldValue(
      "custentity_emp_employee_job_status"
    );
    nlapiLogExecution("DEBUG","employee",employee);
    nlapiLogExecution
    var empGender = employee.getFieldValue("custentity_hris_empgender");

    if (empGrade == undefined || empGrade == null || empGrade == "") {
      empGrade = 1;
    }

    try {
      if (rot_chkbx == "T") {
        NoOfDaysCredited = 0;
        final_days_to_credit = 0;
      }

      var LeavebalanceRec = nlapiCreateRecord("customrecord_hris_leavebalance");
      LeavebalanceRec.setFieldValue(
        "custrecord_hris_lvbal_employee_name",
        empIntenalId
      );

      LeavebalanceRec.setFieldValue(
        "custrecord_hris_lvbal_leave_type",
        leaveType
      );
      if (CreditFreq == 1) {
        LeavebalanceRec.setFieldValue(
          "custrecord_hris_lvbal_annual_leave_bal",
          parseFloat(NoOfDaysCredited * 12).toFixed(2)
        );
      } else {
        LeavebalanceRec.setFieldValue(
          "custrecord_hris_lvbal_annual_leave_bal",
          parseFloat(NoOfDaysCredited).toFixed(2)
        );
      }
      if (CreditFreq == 3) {
        LeavebalanceRec.setFieldValue(
          "custrecord_hris_lvbal_leave_balance_cred",
          parseFloat(NoOfDaysCredited).toFixed(2)
        );
        LeavebalanceRec.setFieldValue(
          "custrecord_hris_lvbal_available_leave_ba",
          parseFloat(NoOfDaysCredited).toFixed(2)
        );
      }
      LeavebalanceRec.setFieldValue(
        "custrecord_hris_lvbal_leave_balance_cred",
        parseFloat(final_days_to_credit).toFixed(2)
      );
      LeavebalanceRec.setFieldValue(
        "custrecord_hris_lvbal_available_leave_ba",
        parseFloat(final_days_to_credit).toFixed(2)
      );
      LeavebalanceRec.setFieldValue(
        "custrecord_hris_lvbal_leave_balance_take",
        0
      );

      var leaveBalanceID = nlapiSubmitRecord(LeavebalanceRec, true, true);
      nlapiLogExecution(
        "DEBUG",
        "Inside searchEmpInLeavebalance",
        "Leave balance ID =" + leaveBalanceID
      );
    } catch (e) {
      nlapiLogExecution(
        "ERROR",
        "Error ocurred while creating leave balance record ",
        e.message
      );
    }
  } else {
    nlapiLogExecution(
      "DEBUG",
      "Leave balance record already present. Record ID : " +
        LeaveBalSearchResults[0].getValue("internalid"),
      "employee id : " + empIntenalId + " , Leave Type : " + leaveType
    );
  }
}

function searchRoundoff(roundOffId) {
  var roundoffName;
  //Modified By Florence

  var filters = new Array();
  var columns = new Array();
  filters.push(new nlobjSearchFilter("internalid", null, "is", roundOffId));
  columns.push(new nlobjSearchColumn("name"));
  var roundoffSearchResults = nlapiSearchRecord(
    "customlist_hris_rounded_off_value_list",
    null,
    filters,
    columns
  );
  if (roundoffSearchResults != null) {
    roundoffName = roundoffSearchResults[0].getValue("name");
    nlapiLogExecution(
      "DEBUG",
      "function searchRoundoff",
      "roundoffName =" + roundoffName
    );
  }
  return roundoffName;
}

function getmonthcountforendDec(month) {
  if (month == 1 || month == '01') {
    return 11;
  }
  if (month == 2 || month == '02') {
    return 10;
  }

  if (month == 3 || month == '03') {
    return 9;
  }

  if (month == 4 || month == '04') {
    return 8;
  }
  if (month == 5 || month == '05') {
    return 7;
  }
  if (month == 6 || month == '06') {
    return 6;
  }
  if (month == 7 || month == '07') {
    return 5;
  }
  if (month == 8) {
    return 4;
  }
  if (month == 9) {
    return 3;
  }
  if (month == 10) {
    return 2;
  }
  if (month == 11) {
    return 1;
  }
  if (month == 12) {
    return 0;
  }
}

function getmonthcountforendaugust(month) {
  if (month == 1 || month == '01') {
    return 7;
  }
  if (month == 2 || month == '02') {
    return 6;
  }

  if (month == 3 || month == '03') {
    return 5;
  }

  if (month == 4 || month == '04') {
    return 4;
  }
  if (month == 5 || month == '05') {
    return 3;
  }
  if (month == 6 || month == '06') {
    return 2;
  }
  if (month == 7 || month == '07') {
    return 1;
  }
  if (month == 8) {
    return 0;
  }
  if (month == 9) {
    return 11;
  }
  if (month == 10) {
    return 10;
  }
  if (month == 11) {
    return 9;
  }
  if (month == 12) {
    return 8;
  }
}

function getmonth_days(wage_month, year) {
  year = year.toString();
  var standard_month_days;
  if (
    wage_month == "1" ||
    wage_month == "3" ||
    wage_month == "5" ||
    wage_month == "7" ||
    wage_month == "8" ||
    wage_month == "10" ||
    wage_month == "12"
  ) {
    standard_month_days = 31;
  }
  if (
    wage_month == "4" ||
    wage_month == "6" ||
    wage_month == "9" ||
    wage_month == "11"
  ) {
    standard_month_days = 30;
  } else if (wage_month == "2") {
    var dash_index = year.indexOf("-");
    

    if (dash_index != -1) {
      var split_year = year.split("-");
      var second_year = split_year[1];

      if (second_year % 4 == 0) {
        standard_month_days = 29;
      } else {
        standard_month_days = 28;
      }
    } else {
      if (year % 4 == 0) {
        standard_month_days = 29;
      } else {
        standard_month_days = 28;
      }
    }
  }
  return standard_month_days;
}

function getdatenumber(DOC) {
  var month = DOC.getDate();
  return month;
}

function GetRoundOffvalueEmper(
  rounded_off_type,
  rounded_off_value_text,
  finalAnnual
) {
  var final_days = finalAnnual;
  nlapiLogExecution(
    "DEBUG",
    "",
    "final_days************************************" + final_days
  );
  var rounded_final_value;
  var split_final_days = new Array();

  split_final_days = final_days.toString().split(".");

  var integer_no = split_final_days[0];
  nlapiLogExecution(
    "DEBUG",
    "",
    "integer_no************************************" + integer_no
  );

  var i_decimal_val = split_final_days[1];
  nlapiLogExecution(
    "DEBUG",
    "",
    "i_decimal_val************************************" + i_decimal_val
  );

  var EmperContrires;

  var compare_no = "0" + "." + i_decimal_val;
  nlapiLogExecution(
    "DEBUG",
    "typeof(compare_no)" + typeof compare_no,
    "compare_no************************************" + compare_no
  );

  if (rounded_off_type == 1) {
    nlapiLogExecution("DEBUG", "", "into next near");

    if (rounded_off_value_text == 0.25 || rounded_off_value_text == 0.75) {
      if (compare_no > 0 && compare_no <= 0.25) {
        nlapiLogExecution("DEBUG", "", "condition one");
        rounded_final_value = parseFloat(integer_no) + parseFloat(0.25);
      }
      if (compare_no > 0.25 && compare_no <= 0.5) {
        nlapiLogExecution("DEBUG", "", "condition 2");
        rounded_final_value = parseFloat(integer_no) + parseFloat(0.5);
      }
      if (compare_no > 0.5 && compare_no <= 0.75) {
        nlapiLogExecution("DEBUG", "", "condition 3");
        rounded_final_value = parseFloat(integer_no) + parseFloat(0.75);
      }
      if (compare_no > 0.75 && compare_no <= 1.0) {
        nlapiLogExecution("DEBUG", "", "condition 4");
        rounded_final_value = parseFloat(integer_no) + parseFloat(1);
      }
      if (compare_no == 0) {
        nlapiLogExecution("DEBUG", "", "condition 5");
        rounded_final_value = parseFloat(integer_no) + parseFloat(0.0);
      }
    }

    if (rounded_off_value_text == 0.5) {
      nlapiLogExecution("DEBUG", "", "into 0.5");
      nlapiLogExecution("DEBUG", "compare_no", compare_no);

      if (compare_no > 0 && compare_no <= 0.5) {
        rounded_final_value = parseFloat(integer_no) + parseFloat(0.5);
        nlapiLogExecution("DEBUG", "", " rounded_final_value into 0.5",rounded_final_value);
      }
      if (compare_no > 0.5 && compare_no <= 1.0) {
        rounded_final_value = parseFloat(integer_no) + parseFloat(1);
      }
    }

    if (rounded_off_value_text == 1.0) {
      nlapiLogExecution("DEBUG", "", "into 1");
      if (compare_no > 0 && compare_no <= 1.0) {
        rounded_final_value = parseFloat(integer_no) + parseFloat(1.0);
      }
    }
  }

  if (rounded_off_type == 2) {
    nlapiLogExecution(
      "DEBUG",
      "Round off type is 2",
      "typeof : rounded_off_value_text == " +
        typeof rounded_off_value_text +
        "typeof : 0.25 == " +
        typeof 0.25
    );

    if (rounded_off_value_text == 0.25 || rounded_off_value_text == 0.75) {
      if (compare_no > 0 && compare_no <= 0.25) {
        rounded_final_value = parseFloat(integer_no) + parseFloat(0.0);
      }
      if (compare_no > 0.25 && compare_no <= 0.5) {
        rounded_final_value = parseFloat(integer_no) + parseFloat(0.25);
      }
      if (compare_no > 0.5 && compare_no <= 0.75) {
        rounded_final_value = parseFloat(integer_no) + parseFloat(0.5);
      }
      if (compare_no > 0.75 && compare_no <= 1.0) {
        rounded_final_value = parseFloat(integer_no) + parseFloat(0.75);
      }
      if (compare_no == 0) {
        rounded_final_value = parseFloat(integer_no) + parseFloat(0.0);
      }
    }
    if (rounded_off_value_text == "Nearest to 0.5") {
      compare_no = parseFloat(compare_no);

      if (compare_no > 0.0 && compare_no <= 0.25) {
        rounded_final_value = parseFloat(integer_no) + parseFloat(0.0);
      }
      if (compare_no > 0.25 && compare_no <= 0.5) {
        rounded_final_value = parseFloat(integer_no) + parseFloat(0.5);
      }
      if (compare_no > 0.5 && compare_no <= 0.75) {
        rounded_final_value = parseFloat(integer_no) + parseFloat(0.5);
      }
      if (compare_no > 0.75 && compare_no <= 1.0) {
        rounded_final_value = parseFloat(integer_no) + parseFloat(1.0);
      }
      if (compare_no == 0.0) {
        rounded_final_value = parseFloat(integer_no) + parseFloat(0.0);
      }
    }
    if (rounded_off_value_text == 1.0) {
      if (compare_no > 0 && compare_no <= 1.0) {
        rounded_final_value = parseFloat(integer_no) + parseFloat(0.0);
      }
    }
  } else {
    rounded_final_value = final_days.toFixed(2);
    nlapiLogExecution(
      "DEBUG",
      "",
      "rounded_final_value 1109************************************" +
        rounded_final_value
    );
  }

  nlapiLogExecution(
    "DEBUG",
    "",
    "rounded_final_value************************************" +
      rounded_final_value
  );
  return rounded_final_value;
}

function DaysBetweenDates(val1, val2) {
  var date1 = val1;
  var date2 = val2;

  var diffTime = Math.abs(date2.getTime() - date1.getTime());
  var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

function GetZero(Value) {
  if (CheckValidOrNot(Value) && Value != "- None -") {
    return Value;
  } else {
    return 0;
  }
}

function CheckValidOrNot(value) {
  if (
    value != null &&
    value != "" &&
    value != undefined &&
    value.toString() != "NaN"
  ) {
    return true;
  } else {
    return false;
  }
}

function ValueOrNot(Value) {
  if (CheckValidOrNot(Value) && Value != "- None -") {
    return Value;
  } else {
    return "";
  }
}

function RoundValue(val) {
  var val = parseFloat(val);
  var diff = parseFloat(val) - parseInt(val);
  if (parseFloat(diff) < 0.25) {
    val = parseInt(val);
  } else if (parseFloat(diff) >= 0.25 && parseFloat(diff) < 0.75) {
    val = parseFloat(parseInt(val)) + 0.5;
  } else if (parseFloat(diff) >= 0.75) {
    val = parseInt(val) + 1;
  }
  return val;
}
