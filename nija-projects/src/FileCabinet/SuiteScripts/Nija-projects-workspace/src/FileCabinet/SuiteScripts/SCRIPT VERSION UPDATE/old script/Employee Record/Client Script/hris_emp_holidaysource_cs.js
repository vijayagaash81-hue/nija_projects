function pageInit(){
  //var holidayList = new Array();
  //debugger;
  var customform = nlapiGetFieldValue('customform');
nlapiLogExecution('DEBUG','customform',customform);
if (customform == 167) {
  nlapiSetFieldValues("custentity_hris_empholidays", holidayList);
}
}
function HolidaySource_fieldChanged(type, name, linenum) {
debugger;
var customform = nlapiGetFieldValue('customform');
nlapiLogExecution('DEBUG','customform',customform);
if (customform == 167) {
  
  if (name == "custentity_hris_empworkinglocation") {
    var empRegion = nlapiGetFieldValue("custentity_hris_empworkinglocation");
    nlapiLogExecution('Debug','empRegion',empRegion);
    var empWeekCriteria = nlapiGetFieldValue(
      "custentity_hris_empweeklyoffcriteria"
    );
    nlapiLogExecution('Debug','empWeekCriteria',empWeekCriteria);
    if (empRegion && empWeekCriteria) {
      var holidayList = new Array();
      holidayList = SearchHoildays(empRegion, empWeekCriteria);
      nlapiSetFieldValues("custentity_hris_empholidays", holidayList);
      nlapiLogExecution('Debug','holidayList',holidayList);
    } else {
      var values = new Array();
      nlapiSetFieldValues("custentity_hris_empholidays", values);
      nlapiLogExecution('Debug','values',values);
    }
  }
  if (name == "custentity_hris_empweeklyoffcriteria") {
    var empRegion = nlapiGetFieldValue("custentity_hris_empworkinglocation");
    var empWeekCriteria = nlapiGetFieldValue(
      "custentity_hris_empweeklyoffcriteria"
    );
    if (empRegion && empWeekCriteria) {
      var holidayList = new Array();
      holidayList = SearchHoildays(empRegion, empWeekCriteria);
      nlapiSetFieldValues("custentity_hris_empholidays", holidayList);
    } else {
      var values = new Array();
      nlapiSetFieldValues("custentity_hris_empholidays", values);
    }
  }

  if (name == "custentity_emp_employee_job_status") {
    var emp_job_status = nlapiGetFieldValue(
      "custentity_emp_employee_job_status"
    );
    if (emp_job_status == 3) {
      nlapiDisableField("custentity_hris_empjobconfirmationdt", false);
    }
  }
  nlapiLogExecution('Debug','emp_job_status',emp_job_status);
}
}
//Get Holiday list
function SearchHoildays(empRegion, empWeekCriteria) {
 // debugger;
  var HolidayList = new Array();
  var HolidayLt = new Array();
  var Filters = new Array();
  Filters.push(
    new nlobjSearchFilter(
      "custrecord_hris_holi_region",
      null,
      "anyof",
      empRegion
    )
  );
  Filters.push(
    new nlobjSearchFilter(
      "custrecord_hris_holidayweeklyoffcriteria",
      null,
      "anyof",
      empWeekCriteria
    )
  );
  Filters.push(new nlobjSearchFilter("isinactive", null, "is", "F"));
  var Column = new Array();
  Column.push(new nlobjSearchColumn("internalid"));
  var EmpSearchResult = nlapiSearchRecord(
    "customrecord_hris_holiday_master",
    null,
    Filters,
    Column
  );

  if (EmpSearchResult != null) {
    for (HoL = 0; HoL < EmpSearchResult.length; HoL++) {
      HolidayList = EmpSearchResult[HoL].getValue("internalid");
      nlapiLogExecution(
        "DEBUG",
        "after Submit",
        "HolidayList->=" + HolidayList
      );
      HolidayLt.push(HolidayList);
    }
  }
  return HolidayLt;
}
