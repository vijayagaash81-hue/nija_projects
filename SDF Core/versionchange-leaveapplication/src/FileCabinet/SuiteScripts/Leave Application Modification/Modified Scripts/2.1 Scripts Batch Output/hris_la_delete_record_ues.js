/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/search', 'N/runtime'], (search, runtime) => {

    {
      const LeaveApp_status = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_leaveapplicationsts" });
      const leaveEncash_Status = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_encashstatus" });
      const encashment_Check = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_applylveencashment" });
      const Tot_no_Days = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_totalnodays" });
      const role = runtime.getCurrentUser().role;
    }
    
    function Leave_pullback_beforeLoadRecord(type, form) {
      const contextObj = runtime;
      if (type == "view") {
        const newType = contextObj.getExecutionContext();
        if (newType == "userinterface") {
          const EditButtonOBJ = form.getButton("edit");
          if (LeaveApp_status == "3" && role != "3") {
            EditButtonOBJ.setDisabled(true);
          }
          if (leaveEncash_Status == "3" && role != "3") {
            EditButtonOBJ.setDisabled(true);
          }
        }
      }
      if (type == "edit") {
        const newType = contextObj.getExecutionContext();
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
      const empArr = [];
      const employeeSearch = search.create({ type: "employee", filters: [["role", columns: "anyof", "1028"]],
        [
          new nlobjSearchColumn("entityid" }).run().setSort(false),
          new nlobjSearchColumn("email"),
          new nlobjSearchColumn("role"),
        ]
      );
      if (employeeSearch) {
        for (const i = 0; i < employeeSearch.length; i++) {
          empArr.push(employeeSearch[i].getValue("email"));
        }
      }
      empArr = empArr.toString();
    
      if (LeaveApp_status == "1") {
        if (type == "delete") {
          const old_record_id = nlapiGetOldRecord();
          const Leave_Status = old_record_id.getFieldValue(
            "custrecord_hris_lve_leaveapplicationsts"
          );
          if (Leave_Status == "1") {
          }
        }
      }
      if (leaveEncash_Status == "1" && encashment_Check == "T") {
        if (type == "delete") {
          const old_record_id = nlapiGetOldRecord();
          const LeaveEncashmnt_Status = old_record_id.getFieldValue(
            "custrecord_hris_lve_leaveapplicationsts"
          );
          if (LeaveEncashmnt_Status == "1") {
          }
        }
      }
    }
    
    function HTMLDesign_LeaveApp(old_record_id) {
      const emp_name = old_record_id.getFieldValue(
        "custrecord_hris_lve_employeename"
      );
      const emp_name_txt = old_record_id.getFieldText(
        "custrecord_hris_lve_employeename"
      );
      const Leave_type = old_record_id.getFieldText("custrecord_hris_lve_leavetype");
    
      const from_date = old_record_id.getFieldValue("custrecord_hris_lve_fromdate");
    
      const to_date = old_record_id.getFieldValue("custrecord_hris_lve_todate");
    
      const tot_days = old_record_id.getFieldValue("custrecord_hris_lve_totalnodays");
    
      const Leave_reason = old_record_id.getFieldValue(
        "custrecord_hris_lve_leavereason"
      );
    
      const Leave_status = old_record_id.getFieldValue(
        "custrecord_hris_lve_leaveapplicationsts"
      );
      const Leave_statusTxt = old_record_id.getFieldText(
        "custrecord_hris_lve_leaveapplicationsts"
      );
      const Manager = old_record_id.getFieldValue("custrecord_hris_lve_supervisor");
    
      const Manager_txt = old_record_id.getFieldText(
        "custrecord_hris_lve_supervisor"
      );
      const manager_email = seachManagerMailId(Manager);
    
      const strVar = "";
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
      const emp_name = old_record_id.getFieldValue(
        "custrecord_hris_lve_employeename"
      );
      const emp_name_txt = old_record_id.getFieldText(
        "custrecord_hris_lve_employeename"
      );
      const Leave_type = old_record_id.getFieldText("custrecord_hris_lve_leavetype");
    
      const tot_EncashDays = old_record_id.getFieldValue(
        "custrecord_hris_lve_noofencashmentdays"
      );
    
      const Leave_EncashStatus = old_record_id.getFieldValue(
        "custrecord_hris_lve_encashstatus"
      );
      const Leave_EncashStatusTxt = old_record_id.getFieldText(
        "custrecord_hris_lve_encashstatus"
      );
      const Manager = old_record_id.getFieldValue("custrecord_hris_lve_supervisor");
    
      const Manager_txt = old_record_id.getFieldText(
        "custrecord_hris_lve_supervisor"
      );
      const manager_email = seachManagerMailId(Manager);
    
      const strVar = "";
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
      const EmailId;
      const Filters = new Array();
      Filters.push(new nlobjSearchFilter("internalid", null, "is", ManagerId));
      const Column = new Array();
      Column.push(new nlobjSearchColumn("email"));
      const ManagerMailSearchResult = search.create({ type: "employee", filters: Filters, columns: Column }).run();
      if (ManagerMailSearchResult != null) {
        EmailId = ManagerMailSearchResult[0].getValue("email");
      }
      return EmailId;
    }

    return {
        Leave_pullback_beforeLoadRecord: Leave_pullback_beforeLoadRecord,
        Leave_pullback_beforeSubmitRecord: Leave_pullback_beforeSubmitRecord,
        afterSubmit_delete_record: afterSubmit_delete_record
    };
});
