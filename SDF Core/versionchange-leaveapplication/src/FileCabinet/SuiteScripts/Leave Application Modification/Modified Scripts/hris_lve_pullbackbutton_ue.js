
function beforeLoadRecord_ShowButton(type)
{

	if(type == 'view')
	{
		var LeaveRecID = nlapiGetRecordId();
		var user = nlapiGetUser();
		if(LeaveRecID != null)
		{
			var LeaveRec_OBJ = nlapiLoadRecord('customrecord_hris_leaveapplication',LeaveRecID);
			var EmpName = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_employeename')
			var approver0 = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_approver0')
			
			/* var CurrentApp_Level = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_current_wflevel_no')
			nlapiLogExecution('DEBUG', 'CurrentApp_Level', 'CurrentApp_Level*************' + CurrentApp_Level);
 */
			
			var CurrentApp_Level = LeaveRec_OBJ.getFieldValue('custrecord_hris_lveappapprovallevel')
			nlapiLogExecution('DEBUG', 'CurrentApp_Level', 'CurrentApp_Level*************' + CurrentApp_Level);
			var Cancelcheck = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_cancellation')
			nlapiLogExecution('DEBUG', 'Cancelcheck', 'Cancelcheck*************' + Cancelcheck);
			var Approvalstatus = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus')
			nlapiLogExecution('DEBUG', 'Approvalstatus', 'Approvalstatus*************' + Approvalstatus);
			
			var Requestor = LeaveRec_OBJ.getFieldValue('custrecordhris_lve_requestor')
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

