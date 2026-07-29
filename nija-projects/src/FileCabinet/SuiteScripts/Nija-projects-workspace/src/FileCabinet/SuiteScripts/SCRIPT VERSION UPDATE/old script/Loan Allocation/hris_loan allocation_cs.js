function pageInit(type) {
  if (type == "create") {
	  
    var empVal = nlapiGetFieldValue("custrecord_hris_loan_emp_name");
    nlapiLogExecution("DEBUG", "empVal", empVal);
	if (empVal!='' || empVal != null ||  empVal != undefined){
    var s_paygrp = search_paygroup(empVal);
    nlapiLogExecution("DEBUG", "s_paygrp", s_paygrp);
    if (s_paygrp) {
      nlapiSetFieldValue("custrecord_hris_loan_process_group", s_paygrp);
    } else {
      nlapiSetFieldValue("custrecord_hris_loan_process_group", "");
    }
  }
  }
}
function saveLoan_Allocation_Record(type) {
  var Emp_id = nlapiGetFieldValue("custrecord_hris_loan_emp_name");
  var EMIStartDate = nlapiGetFieldValue("custrecord_hris_loan_emistartmonth");
  var EMIEndDate = nlapiGetFieldValue("custrecord_hris_loan_emi_end_date");
  var str_EMIEndDate = nlapiStringToDate(EMIEndDate);
  var str_EMIStartDate = nlapiStringToDate(EMIStartDate);
  nlapiLogExecution("DEBUG", "str_EMIStartDate", str_EMIStartDate);
  if (str_EMIEndDate < str_EMIStartDate) {
    return false;
  }

  var rec_Id = nlapiGetRecordId();
  return true;
}
function setLoantype_on_Emp_fieldchange(type, name, linenum) {
  try {
	  debugger;
    var context = nlapiGetContext();
    var date_format = context.getPreference("DATEFORMAT");
    nlapiLogExecution("DEBUG", "date_format", date_format);

    if (name == "custrecord_hris_loan_emp_name") {
      var empVal = nlapiGetFieldValue("custrecord_hris_loan_emp_name");

      var s_paygrp = search_paygroup(empVal);
      if (s_paygrp) {
        nlapiSetFieldValue("custrecord_hris_loan_process_group", s_paygrp);
      } else {
        nlapiSetFieldValue("custrecord_hris_loan_process_group", "");
      }
    }

    if (name == "custrecord_hris_loan_amount") {
      var Emp_Grade = new Array();
      var emp_id = nlapiGetFieldValue("custrecord_hris_loan_emp_name");
      var Loan_amt = nlapiGetFieldValue("custrecord_hris_loan_amount");
      var salAmt = nlapiGetFieldValue("custrecord_hris_loan_mon_approx_net");
      var loan_Type = nlapiGetFieldText("custrecord_hris_loan_loan_type");
      var loan_Tye_Val = nlapiGetFieldValue("custrecord_hris_loan_loan_type");
      Emp_Grade = SearchEmpGrade(emp_id);

      var Ceiling_Amt = searchLoanType(Emp_Grade, loan_Type);
      Ceiling_Amt = parseFloat(Ceiling_Amt);
      Loan_amt = parseFloat(Loan_amt);
      if (Loan_amt > Ceiling_Amt) {
      }

      var loan_eligibility = nlapiGetFieldValue(
        "custrecord_hris_loan_emp_loan_eligible"
      );
      if (loan_Tye_Val == 2) {
        if (salAmt < Loan_amt) {
        }
      }
    }

    if (name == "custrecord_hris_loan_emi_amount") {
      var emi_Amt = nlapiGetFieldValue("custrecord_hris_loan_emi_amount");
      var loan_amt = nlapiGetFieldValue("custrecord_hris_loan_amount");
      emi_Amt = parseFloat(emi_Amt);
      loan_amt = parseFloat(loan_amt);
      if (emi_Amt > loan_amt) {
        alert("EMI Amount should not be greater than Loan Amount");
        nlapiSetFieldValue("custrecord_hris_loan_emi_amount", " ", false);
        return false;
      }
    }

    if (name == "custrecord_hris_loan_emistartmonth") {
      var emi_start_date = nlapiGetFieldValue(
        "custrecord_hris_loan_emistartmonth"
      );
      nlapiLogExecution("DEBUG", "emi_start_date", emi_start_date);
      if (emi_start_date) {
        var str_start_Date = nlapiStringToDate(emi_start_date);
        var no_of_Install = nlapiGetFieldValue(
          "custrecord_hris_loan_no_of_install"
        );
        no_of_Install = parseFloat(no_of_Install) - parseFloat(1);
        var str_emi_start_Date = str_start_Date.getDate();
        nlapiLogExecution("DEBUG", "EMI start getDate", str_emi_start_Date);

        var date = nlapiStringToDate(
          nlapiGetFieldValue("custrecord_hris_loan_emistartmonth")
        );
        nlapiLogExecution("DEBUG", "str Date", date);

        var toDateValue = nlapiStringToDate(
          nlapiGetFieldValue("custrecord_hris_loan_emistartmonth")
        );
        toDateValue = nlapiAddMonths(toDateValue, no_of_Install);

        toDateValue = new Date(
          toDateValue.getFullYear(),
          toDateValue.getMonth() + 1,
          0
        );
        var toDate = toDateValue.getDate();
        var toYear = toDateValue.getFullYear();
        var toMonth = toDateValue.getMonth() + 1;
        if (date_format == "MM/DD/YYYY" || date_format == "M/D/YYYY") {
          toDateValue = toMonth + "/" + toDate + "/" + toYear;
        }
        if (date_format == "DD/MM/YYYY" || date_format == "D/M/YYYY") {
          toDateValue = toDate + "/" + toMonth + "/" + toYear;
        }
        if (date_format == "DD-Mon-YYYY") {
          toDateValue = toDate + "-" + toMonth + "-" + toYear;
        }
        if (date_format == "DD.MM.YYYY") {
          toDateValue = toDate + "." + toMonth + "." + toYear;
        }
        if (date_format == "YYYY/MM/DD") {
          toDateValue = toYear + "/" + toMonth + "/" + toDate;
        }
        if (date_format == "YYYY-MM-DD") {
          toDateValue = toYear + "-" + toMonth + "-" + toDate;
        }

        nlapiLogExecution("DEBUG", "toDateValue", toDateValue);

        var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        if (str_emi_start_Date != lastDay.getDate()) {
          alert("EMI start date should be END DATE of selected month");
          nlapiSetFieldValue("custrecord_hris_loan_emistartmonth", "");
          nlapiSetFieldValue("custrecord_hris_loan_emi_end_date", "");
        } else {
          nlapiSetFieldValue("custrecord_hris_loan_emi_end_date", toDateValue);
        }
      }
    }

    if (name == "custrecord_hris_loan_emi_end_date") {
      var emi_end_date = nlapiGetFieldValue(
        "custrecord_hris_loan_emi_end_date"
      );
      if (emi_end_date) {
        var str_end_Date = nlapiStringToDate(emi_end_date);

        var emi_start_date = nlapiGetFieldValue(
          "custrecord_hris_loan_emistartmonth"
        );
        var str_emi_start_date = nlapiStringToDate(emi_start_date);

        if (str_end_Date < str_emi_start_date) {
          alert("EMI End Month should be greater than EMI Start Month");
          nlapiSetFieldValue("custrecord_hris_loan_emi_end_date", "");
        }

        var str_emi_end_Date = str_end_Date.getDate();
        nlapiLogExecution(
          "DEBUG",
          "str_emi_end_Date Condition",
          str_emi_end_Date
        );
        var date = nlapiStringToDate(
          nlapiGetFieldValue("custrecord_hris_loan_emi_end_date")
        );

        var firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        nlapiLogExecution("DEBUG", "lastDay val", lastDay);

        if (str_emi_end_Date != lastDay.getDate()) {
          alert("EMI end date should be END DATE of selected month");
          nlapiSetFieldValue("custrecord_hris_loan_emi_end_date", "");
        }
      }
    }
  } catch (e) {
    nlapiLogExecution("DEBUG", "ERROR", e.message);
  }
}

function SearchEmpGrade(emp_id) {
  var filters1 = new Array();
  var columns1 = new Array();
  var Emp_Grade = new Array();
  filters1.push(new nlobjSearchFilter("internalid", null, "is", emp_id));
  filters1.push(new nlobjSearchFilter("isinactive", null, "is", "F"));
  columns1.push(new nlobjSearchColumn("custentity_emp_grade_"));
  var searchEmp = nlapiSearchRecord("employee", null, filters1, columns1);
  if (searchEmp != null) {
    for (var emp = 0; emp < searchEmp.length; emp++) {
      Emp_Grade = searchEmp[emp].getValue("custentity_emp_grade_");
    }
  }
  return Emp_Grade;
}

function searchLoanType(Emp_Grade, loan_Type) {
  var filters1 = new Array();
  var columns1 = new Array();
  var LoanType = new Array();
  var LType = new Array();
  var s = new Array();
  filters1.push(
    new nlobjSearchFilter(
      "custrecord_hris_loan_grade",
      null,
      "anyof",
      Emp_Grade
    )
  );
  filters1.push(new nlobjSearchFilter("name", null, "is", loan_Type));
  filters1.push(new nlobjSearchFilter("isinactive", null, "is", "F"));
  columns1.push(new nlobjSearchColumn("custrecord_hris_ceiling_amount"));
  var searchLoanMaster = nlapiSearchRecord(
    "customrecord_hris_loan_master",
    null,
    filters1,
    columns1
  );

  if (searchLoanMaster != null) {
    var CeilingAmt = searchLoanMaster[0].getValue(
      "custrecord_hris_ceiling_amount"
    );
  }
  return CeilingAmt;
}

function searchDuplicateRec(Emp_id, EMIStartDate, EMIEndDate, loanType) {
  var Loan_Type;
  var total_loanAmt = 0.0;
  var dup_rec_endDate = [];
  var Filters = new Array();
  Filters.push(
    new nlobjSearchFilter("custrecord_hris_loan_emp_name", null, "is", Emp_id)
  );
  Filters.push(
    new nlobjSearchFilter(
      "custrecord_hris_loan_loan_type",
      null,
      "is",
      loanType
    )
  );
  Filters.push(new nlobjSearchFilter("isinactive", null, "is", "F"));
  var Column = new Array();
  Column.push(new nlobjSearchColumn("internalid"));
  Column.push(new nlobjSearchColumn("custrecord_hris_loan_emi_amount"));
  Column.push(new nlobjSearchColumn("custrecord_hris_loan_loan_type"));
  Column.push(new nlobjSearchColumn("custrecord_hris_loan_emistartmonth"));
  Column.push(new nlobjSearchColumn("custrecord_hris_loan_emi_end_date"));
  var searchLoanRec = nlapiSearchRecord(
    "customrecord_hris_empchange_loan_applicn",
    null,
    Filters,
    Column
  );
  if (searchLoanRec != null) {
    for (var i = 0; i < searchLoanRec.length; i++) {
      dup_rec_endDate.push(
        searchLoanRec[i].getValue("custrecord_hris_loan_emi_end_date")
      );
    }
    nlapiLogExecution(
      "DEBUG",
      "Previous end date",
      searchLoanRec[0].getValue("custrecord_hris_loan_emi_end_date")
    );

    return dup_rec_endDate;
  }
}

function search_paygroup(employee_name) {
  var filters = new Array();
  var columns = new Array();

  filters.push(
    new nlobjSearchFilter(
      "custrecord_hris_empchange_employee_nam",
      null,
      "is",
      employee_name
    )
  );
  filters.push(new nlobjSearchFilter("isinactive", null, "is", "F"));
  columns.push(new nlobjSearchColumn("internalid"));
  columns.push(
    new nlobjSearchColumn("custrecord_hris_empchange_emp_pay_pro_gp")
  );

  columns[0].setSort(true);

  var s_result = nlapiSearchRecord(
    "customrecord_hris_employee_compen_change",
    null,
    filters,
    columns
  );

  if (s_result != null) {
    var s_paygroup = s_result[0].getValue(
      "custrecord_hris_empchange_emp_pay_pro_gp"
    );
  }
  return s_paygroup;
}

function _nullValidation(value) {
  if (value == null || value == undefined || value == "") {
    return true;
  } else {
    return false;
  }
}
