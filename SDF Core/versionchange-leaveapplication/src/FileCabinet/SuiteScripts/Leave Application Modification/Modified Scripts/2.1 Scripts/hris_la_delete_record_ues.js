/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/search', 'N/query', 'N/format', 'N/record', 'N/currentRecord', 'N/url', 'N/runtime', 'N/ui/serverWidget', './moment.js'],
    (search, query, format, record, currentRecord, url, runtime, serverWidget, moment) => {

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
{
  let LeaveApp_status = nlapiGetFieldValue(
    "custrecord_hris_lve_leaveapplicationsts"
  );
  let leaveEncash_Status = nlapiGetFieldValue(
    "custrecord_hris_lve_encashstatus"
  );
  let encashment_Check = nlapiGetFieldValue(
    "custrecord_hris_lve_applylveencashment"
  );
  let Tot_no_Days = nlapiGetFieldValue("custrecord_hris_lve_totalnodays");
  let role = nlapiGetRole();
}

function Leave_pullback_beforeLoadRecord(type, form) {
  let contextObj = nlapiGetContext();
  if (type == "view") {
    let newType = contextObj.getExecutionContext();
    if (newType == "userinterface") {
      let EditButtonOBJ = form.getButton("edit");
      if (LeaveApp_status == "3" && role != "3") {
        EditButtonOBJ.setDisabled(true);
      }
      if (leaveEncash_Status == "3" && role != "3") {
        EditButtonOBJ.setDisabled(true);
      }
    }
  }
  if (type == "edit") {
    let newType = contextObj.getExecutionContext();
    if (newType == "userinterface") {
      if (LeaveApp_status == "3" && role != "3") {
        throw "You can not edit this record";
      }
      if (leaveEncash_Status == "3" && role != "3") {
        throw "You can not edit this record";
      }
    }
  }

  return true;
}

function Leave_pullback_beforeSubmitRecord(type) {
  if (Tot_no_Days < 0) {
    throw "Please Select Comp-Off";
    return false;
  }

  if (LeaveApp_status == "2" || LeaveApp_status == "3") {
    if (type == "delete") {
      throw "You Can not Delete Approved or Rejected Leave";
      return false;
    }
  }
  if (leaveEncash_Status == "2" || leaveEncash_Status == "3") {
    if (type == "delete") {
      throw "You can not delete Approved or Rejected Leave Encashmeent record";
      return false;
    }
  }
  return true;
}

function afterSubmit_delete_record(type) {
  let empArr = [];
  let employeeSearch = nlapiSearchRecord(
    "employee",
    null,
    [["role", "anyof", "1028"]],
    [
      new nlobjSearchColumn("entityid").setSort(false),
      new nlobjSearchColumn("email"),
      new nlobjSearchColumn("role"),
    ]
  );
  if (employeeSearch) {
    for (let i = 0; i < employeeSearch.length; i++) {
      empArr.push(employeeSearch[i].getValue("email"));
    }
  }
  empArr = empArr.toString();

  if (LeaveApp_status == "1") {
    if (type == "delete") {
      let old_record_id = nlapiGetOldRecord();
      let Leave_Status = old_record_id.getFieldValue(
        "custrecord_hris_lve_leaveapplicationsts"
      );
      if (Leave_Status == "1") {
      }
    }
  }
  if (leaveEncash_Status == "1" && encashment_Check == "T") {
    if (type == "delete") {
      let old_record_id = nlapiGetOldRecord();
      let LeaveEncashmnt_Status = old_record_id.getFieldValue(
        "custrecord_hris_lve_leaveapplicationsts"
      );
      if (LeaveEncashmnt_Status == "1") {
      }
    }
  }
}

function HTMLDesign_LeaveApp(old_record_id) {
  let emp_name = old_record_id.getFieldValue(
    "custrecord_hris_lve_employeename"
  );
  let emp_name_txt = old_record_id.getFieldText(
    "custrecord_hris_lve_employeename"
  );
  let Leave_type = old_record_id.getFieldText("custrecord_hris_lve_leavetype");

  let from_date = old_record_id.getFieldValue("custrecord_hris_lve_fromdate");

  let to_date = old_record_id.getFieldValue("custrecord_hris_lve_todate");

  let tot_days = old_record_id.getFieldValue("custrecord_hris_lve_totalnodays");

  let Leave_reason = old_record_id.getFieldValue(
    "custrecord_hris_lve_leavereason"
  );

  let Leave_status = old_record_id.getFieldValue(
    "custrecord_hris_lve_leaveapplicationsts"
  );
  let Leave_statusTxt = old_record_id.getFieldText(
    "custrecord_hris_lve_leaveapplicationsts"
  );
  let Manager = old_record_id.getFieldValue("custrecord_hris_lve_supervisor");

  let Manager_txt = old_record_id.getFieldText(
    "custrecord_hris_lve_supervisor"
  );
  let manager_email = seachManagerMailId(Manager);

  let strVar = "";
  strVar +=
    "	Leave Application raised by " +
    emp_name_txt +
    " has been Pullback. Following are the leave application details:";
  strVar += "<tr>";
  strVar += "		<td>&nbsp;</td>";
  strVar += "	</tr>";
  strVar += '<table border="1" width="493">';
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Employee Name</b></font></td>';
  strVar += '		<td><font color="000000">' + emp_name_txt + "</font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Leave</span> ';
  strVar += "		Type</b></font></td>";
  strVar += "		<td>" + Leave_type + "</span></font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>From Date</b></font></td>';
  strVar += "		<td>" + from_date + "</td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>To Date</b></font></td>';
  strVar += "		<td>" + to_date + "</td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Total no. Of Days</b></font> ';
  strVar += "		</td>";
  strVar += '		<td><font color="000000">' + tot_days + "</font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Leave</span> ';
  strVar += "		Reason</b></font></td>";
  strVar += "		<td>" + Leave_reason + "</font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Leave</span> ';
  strVar += "		Status</b></font></td>";
  strVar += "		<td>" + Leave_statusTxt + "</font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Manager <br>';
  strVar += "&nbsp;</b></font></td>";
  strVar += "		<td>" + Manager_txt + "</font></td>";
  strVar += "	</tr>";
  strVar += "</table>";
  return strVar + "#" + manager_email + "#" + emp_name_txt + "#" + Leave_type;
}

function HTMLDesign_LeaveEncash(old_record_id) {
  let emp_name = old_record_id.getFieldValue(
    "custrecord_hris_lve_employeename"
  );
  let emp_name_txt = old_record_id.getFieldText(
    "custrecord_hris_lve_employeename"
  );
  let Leave_type = old_record_id.getFieldText("custrecord_hris_lve_leavetype");

  let tot_EncashDays = old_record_id.getFieldValue(
    "custrecord_hris_lve_noofencashmentdays"
  );

  let Leave_EncashStatus = old_record_id.getFieldValue(
    "custrecord_hris_lve_encashstatus"
  );
  let Leave_EncashStatusTxt = old_record_id.getFieldText(
    "custrecord_hris_lve_encashstatus"
  );
  let Manager = old_record_id.getFieldValue("custrecord_hris_lve_supervisor");

  let Manager_txt = old_record_id.getFieldText(
    "custrecord_hris_lve_supervisor"
  );
  let manager_email = seachManagerMailId(Manager);

  let strVar = "";
  strVar +=
    "	Leave Encashment application raised by " +
    emp_name_txt +
    " has been Pullback. Following are the leave encashment details:";
  strVar += "<tr>";
  strVar += "		<td>&nbsp;</td>";
  strVar += "	</tr>";
  strVar += '<table border="1" width="493">';
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Employee Name</b></font></td>';
  strVar += '		<td><font color="000000">' + emp_name_txt + "</font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Leave</span> ';
  strVar += "		Type</b></font></td>";
  strVar += "		<td>" + Leave_type + "</span></font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>No. of Encashment days</b></font> ';
  strVar += "		</td>";
  strVar += '		<td><font color="000000">' + tot_EncashDays + "</font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Leave</span> ';
  strVar += "		Status</b></font></td>";
  strVar += "		<td>" + Leave_EncashStatusTxt + "</font></td>";
  strVar += "	</tr>";
  strVar += "	<tr>";
  strVar += '		<td width="300"><b>Manager <br>';
  strVar += "&nbsp;</b></font></td>";
  strVar += "		<td>" + Manager_txt + "</font></td>";
  strVar += "	</tr>";
  strVar += "</table>";
  return strVar + "#" + manager_email + "#" + emp_name_txt + "#" + Leave_type;
}
function seachManagerMailId(ManagerId) {
  let EmailId;
  let Filters = new Array();
  Filters.push(new nlobjSearchFilter("internalid", null, "is", ManagerId));
  let Column = new Array();
  Column.push(new nlobjSearchColumn("email"));
  let ManagerMailSearchResult = nlapiSearchRecord(
    "employee",
    null,
    Filters,
    Column
  );
  if (ManagerMailSearchResult != null) {
    EmailId = ManagerMailSearchResult[0].getValue("email");
  }
  return EmailId;
}


});
