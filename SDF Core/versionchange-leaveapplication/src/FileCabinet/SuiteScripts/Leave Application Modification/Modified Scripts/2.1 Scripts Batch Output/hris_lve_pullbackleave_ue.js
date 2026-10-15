/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record'], (record) => {

    function BeforeSubmit_Create_Pullback_Record(type)
    {
       const custformscript =scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_script_version' });
       log.debug({ title: "custformscript", details: custformscript })
    if (custformscript == 1){ 
    
       if(type =='delete')
      {
      
       //Get field values
       const EmployeeNAME = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
       const EmployeeCODE = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_empcode' });
       const Manager = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_supervisor' });
       const ProjectSupervisor = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_project_supervisor' });
       const LeaveType = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' });
       const LeaveBalance = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavebalance' });
       const FromDate = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' });
       const FromHalfDay = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromhalfday' });
       const ToDate = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' });
       const ToHalfDay = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_tohalfday' });
       const TotalNoDays = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_totalnodays' });
       const ValidTillDate = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_validtilldate' });
       const LeaveReason = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavereason' });
       const SupportDoc = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_supportdocument' });
       const LeaveAppStatus = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_staus' });
       
       //create Pullback record
       const PullBackRecord = nlapiCreateRecord('customrecord_hris_pullback_lveapplicatio');   
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
       const PullBackRecord_ID = PullBackRecord.save()
       log.debug({ title: 'pullid', details: PullBackRecord_ID });
    	return true;
    
    	
       }
     
    }
    }

    return {
        BeforeSubmit_Create_Pullback_Record: BeforeSubmit_Create_Pullback_Record
    };
});
