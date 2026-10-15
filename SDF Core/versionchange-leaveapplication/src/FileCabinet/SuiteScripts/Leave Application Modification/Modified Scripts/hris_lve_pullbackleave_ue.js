function BeforeSubmit_Create_Pullback_Record(type)
{
   var custformscript =nlapiGetFieldValue('custrecord_hris_lve_script_version');
   nlapiLogExecution("DEBUG","custformscript",custformscript)
if (custformscript == 1){ 

   if(type =='delete')
  {
  
   //Get field values
   var EmployeeNAME = nlapiGetFieldValue('custrecord_hris_lve_employeename');
   var EmployeeCODE = nlapiGetFieldValue('custrecord_hris_lve_empcode');
   var Manager = nlapiGetFieldValue('custrecord_hris_lve_supervisor');
   var ProjectSupervisor = nlapiGetFieldValue('custrecord_hris_lve_project_supervisor');
   var LeaveType = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
   var LeaveBalance = nlapiGetFieldValue('custrecord_hris_lve_leavebalance');
   var FromDate = nlapiGetFieldValue('custrecord_hris_lve_fromdate');
   var FromHalfDay = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
   var ToDate = nlapiGetFieldValue('custrecord_hris_lve_todate');
   var ToHalfDay = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');
   var TotalNoDays = nlapiGetFieldValue('custrecord_hris_lve_totalnodays');
   var ValidTillDate = nlapiGetFieldValue('custrecord_hris_lve_validtilldate');
   var LeaveReason = nlapiGetFieldValue('custrecord_hris_lve_leavereason');
   var SupportDoc = nlapiGetFieldValue('custrecord_hris_lve_supportdocument');
   var LeaveAppStatus = nlapiGetFieldValue('custrecord_hris_lve_staus');
   
   //create Pullback record
   var PullBackRecord = nlapiCreateRecord('customrecord_hris_pullback_lveapplicatio');   
   PullBackRecord.setFieldValue('custrecord_hris_plb_employee_name',EmployeeNAME);
   PullBackRecord.setFieldValue('custrecord_hris_plb_employee_code',EmployeeCODE);
   PullBackRecord.setFieldValue('custrecord_hris_plb_supervisor',Manager);
   PullBackRecord.setFieldValue('custrecord_hris_plb_hod',ProjectSupervisor);
   PullBackRecord.setFieldValue('custrecord_hris_plb_leave_type',LeaveType);
   PullBackRecord.setFieldValue('custrecord_hris_plb_leave_balance',LeaveBalance);
   PullBackRecord.setFieldValue('custrecord_hris_plb_from_date',FromDate);
   PullBackRecord.setFieldValue('custrecord_hris_plb_from_halfday',FromHalfDay);
   PullBackRecord.setFieldValue('custrecord_hris_plb_todate',ToDate);
   PullBackRecord.setFieldValue('custrecord_hris_plb_to_halfday',ToHalfDay);
   PullBackRecord.setFieldValue('custrecord_hris_plb_total_days',TotalNoDays);
   PullBackRecord.setFieldValue('custrecord_hris_plb_vaid_tilldate',ValidTillDate);
   PullBackRecord.setFieldValue('custrecord_hris_plb_leave_reason',LeaveReason);
   PullBackRecord.setFieldValue('custrecord_hris_plb_support_document',SupportDoc);
   PullBackRecord.setFieldValue('custrecord_hris_plb_leave_applica_status',LeaveAppStatus);   
   var PullBackRecord_ID = nlapiSubmitRecord(PullBackRecord,true,true)
   nlapiLogExecution('DEBUG', 'pullid', PullBackRecord_ID);
	return true;

	
   }
 
}
}

