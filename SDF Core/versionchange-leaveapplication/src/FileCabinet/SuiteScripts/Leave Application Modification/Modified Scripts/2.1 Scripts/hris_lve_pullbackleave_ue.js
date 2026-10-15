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
function BeforeSubmit_Create_Pullback_Record(type)
{
   let custformscript =nlapiGetFieldValue('custrecord_hris_lve_script_version');
   nlapiLogExecution("DEBUG","custformscript",custformscript)
if (custformscript == 1){ 

   if(type =='delete')
  {
  
   //Get field values
   let EmployeeNAME = nlapiGetFieldValue('custrecord_hris_lve_employeename');
   let EmployeeCODE = nlapiGetFieldValue('custrecord_hris_lve_empcode');
   let Manager = nlapiGetFieldValue('custrecord_hris_lve_supervisor');
   let ProjectSupervisor = nlapiGetFieldValue('custrecord_hris_lve_project_supervisor');
   let LeaveType = nlapiGetFieldValue('custrecord_hris_lve_leavetype');
   let LeaveBalance = nlapiGetFieldValue('custrecord_hris_lve_leavebalance');
   let FromDate = nlapiGetFieldValue('custrecord_hris_lve_fromdate');
   let FromHalfDay = nlapiGetFieldValue('custrecord_hris_lve_fromhalfday');
   let ToDate = nlapiGetFieldValue('custrecord_hris_lve_todate');
   let ToHalfDay = nlapiGetFieldValue('custrecord_hris_lve_tohalfday');
   let TotalNoDays = nlapiGetFieldValue('custrecord_hris_lve_totalnodays');
   let ValidTillDate = nlapiGetFieldValue('custrecord_hris_lve_validtilldate');
   let LeaveReason = nlapiGetFieldValue('custrecord_hris_lve_leavereason');
   let SupportDoc = nlapiGetFieldValue('custrecord_hris_lve_supportdocument');
   let LeaveAppStatus = nlapiGetFieldValue('custrecord_hris_lve_staus');
   
   //create Pullback record
   let PullBackRecord = nlapiCreateRecord('customrecord_hris_pullback_lveapplicatio');   
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
   let PullBackRecord_ID = nlapiSubmitRecord(PullBackRecord,true,true)
   nlapiLogExecution('DEBUG', 'pullid', PullBackRecord_ID);
	return true;

	
   }
 
}
}



});
