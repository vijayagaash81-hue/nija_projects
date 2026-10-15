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

function beforeLoadRecord_ShowButton(type)
{

	if(type == 'view')
	{
		let LeaveRecID = nlapiGetRecordId();
		let user = nlapiGetUser();
		if(LeaveRecID != null)
		{
			let LeaveRec_OBJ = nlapiLoadRecord('customrecord_hris_leaveapplication',LeaveRecID);
			let EmpName = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_employeename')
			let approver0 = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_approver0')
			
			/* let CurrentApp_Level = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_current_wflevel_no')
			nlapiLogExecution('DEBUG', 'CurrentApp_Level', 'CurrentApp_Level*************' + CurrentApp_Level);
 */
			
			let CurrentApp_Level = LeaveRec_OBJ.getFieldValue('custrecord_hris_lveappapprovallevel')
			nlapiLogExecution('DEBUG', 'CurrentApp_Level', 'CurrentApp_Level*************' + CurrentApp_Level);
			let Cancelcheck = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_cancellation')
			nlapiLogExecution('DEBUG', 'Cancelcheck', 'Cancelcheck*************' + Cancelcheck);
			let Approvalstatus = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus')
			nlapiLogExecution('DEBUG', 'Approvalstatus', 'Approvalstatus*************' + Approvalstatus);
			
			let Requestor = LeaveRec_OBJ.getFieldValue('custrecordhris_lve_requestor')
			nlapiLogExecution('DEBUG', 'Requestor', 'Requestor*************' +Requestor);
			//if((CurrentApp_Level == '1' || CurrentApp_Level == '2' || CurrentApp_Level == '3' || CurrentApp_Level == '4') && (Approvalstatus ==1 ))
			if (Approvalstatus ==1 )

			{
				if(Cancelcheck == 'F')
				{
					if(user == EmpName || user == Requestor)
				{
					form.setScript('customscript_hris_lve_pullbackcall_cs');
				    form.addButton('custpage_DeleteButton', 'Pullback Leave', 'PullbackLeave(\'' +LeaveRecID+ '\');');
				}
			   }
				
			}
		}
	}
}



});
