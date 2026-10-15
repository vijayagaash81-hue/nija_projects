{
  var LeaveApp_status = nlapiGetFieldValue(
    "custrecord_hris_lve_leaveapplicationsts"
  );
  var leaveEncash_Status = nlapiGetFieldValue(
    "custrecord_hris_lve_encashstatus"
  );
  var encashment_Check = nlapiGetFieldValue(
    "custrecord_hris_lve_applylveencashment"
  );
  var Tot_no_Days = nlapiGetFieldValue("custrecord_hris_lve_totalnodays");
  var role = nlapiGetRole();
}

function Leave_pullback_beforeLoadRecord(type, form) {
  var contextObj = nlapiGetContext();
  if (type == "view") {
    var newType = contextObj.getExecutionContext();
    if (newType == "userinterface") {
      var EditButtonOBJ = form.getButton("edit");
      if (LeaveApp_status == "3" && role != "3") {
        EditButtonOBJ.setDisabled(true);
      }
      if (leaveEncash_Status == "3" && role != "3") {
        EditButtonOBJ.setDisabled(true);
      }
    }
  }
  if (type == "edit") {
    var newType = contextObj.getExecutionContext();
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
  var empArr = [];
  var employeeSearch = nlapiSearchRecord(
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
    for (var i = 0; i < employeeSearch.length; i++) {
      empArr.push(employeeSearch[i].getValue("email"));
    }
  }
  empArr = empArr.toString();

  if (LeaveApp_status == "1") {
    if (type == "delete") {
      var old_record_id = nlapiGetOldRecord();
      var Leave_Status = old_record_id.getFieldValue(
        "custrecord_hris_lve_leaveapplicationsts"
      );
      if (Leave_Status == "1") {
      }
    }
  }
  if (leaveEncash_Status == "1" && encashment_Check == "T") {
    if (type == "delete") {
      var old_record_id = nlapiGetOldRecord();
      var LeaveEncashmnt_Status = old_record_id.getFieldValue(
        "custrecord_hris_lve_leaveapplicationsts"
      );
      if (LeaveEncashmnt_Status == "1") {
      }
    }
  }
}

function HTMLDesign_LeaveApp(old_record_id) {
  var emp_name = old_record_id.getFieldValue(
    "custrecord_hris_lve_employeename"
  );
  var emp_name_txt = old_record_id.getFieldText(
    "custrecord_hris_lve_employeename"
  );
  var Leave_type = old_record_id.getFieldText("custrecord_hris_lve_leavetype");

  var from_date = old_record_id.getFieldValue("custrecord_hris_lve_fromdate");

  var to_date = old_record_id.getFieldValue("custrecord_hris_lve_todate");

  var tot_days = old_record_id.getFieldValue("custrecord_hris_lve_totalnodays");

  var Leave_reason = old_record_id.getFieldValue(
    "custrecord_hris_lve_leavereason"
  );

  var Leave_status = old_record_id.getFieldValue(
    "custrecord_hris_lve_leaveapplicationsts"
  );
  var Leave_statusTxt = old_record_id.getFieldText(
    "custrecord_hris_lve_leaveapplicationsts"
  );
  var Manager = old_record_id.getFieldValue("custrecord_hris_lve_supervisor");

  var Manager_txt = old_record_id.getFieldText(
    "custrecord_hris_lve_supervisor"
  );
  var manager_email = seachManagerMailId(Manager);

  var strVar = "";
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
  var emp_name = old_record_id.getFieldValue(
    "custrecord_hris_lve_employeename"
  );
  var emp_name_txt = old_record_id.getFieldText(
    "custrecord_hris_lve_employeename"
  );
  var Leave_type = old_record_id.getFieldText("custrecord_hris_lve_leavetype");

  var tot_EncashDays = old_record_id.getFieldValue(
    "custrecord_hris_lve_noofencashmentdays"
  );

  var Leave_EncashStatus = old_record_id.getFieldValue(
    "custrecord_hris_lve_encashstatus"
  );
  var Leave_EncashStatusTxt = old_record_id.getFieldText(
    "custrecord_hris_lve_encashstatus"
  );
  var Manager = old_record_id.getFieldValue("custrecord_hris_lve_supervisor");

  var Manager_txt = old_record_id.getFieldText(
    "custrecord_hris_lve_supervisor"
  );
  var manager_email = seachManagerMailId(Manager);

  var strVar = "";
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
  var EmailId;
  var Filters = new Array();
  Filters.push(new nlobjSearchFilter("internalid", null, "is", ManagerId));
  var Column = new Array();
  Column.push(new nlobjSearchColumn("email"));
  var ManagerMailSearchResult = nlapiSearchRecord(
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
