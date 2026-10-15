/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/runtime'], (record, runtime) => {

    
    function beforeLoadRecord_ShowButton(type)
    {
    
    	if(type == 'view')
    	{
    		const LeaveRecID = (scriptContext.newRecord ? scriptContext.newRecord.id : scriptContext.currentRecord.id);
    		const user = runtime.getCurrentUser().id;
    		if(LeaveRecID != null)
    		{
    			const LeaveRec_OBJ = record.load({ type: 'customrecord_hris_leaveapplication', id: LeaveRecID });
    			const EmpName = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_employeename')
    			const approver0 = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_approver0')
    			
    			/* const CurrentApp_Level = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_current_wflevel_no')
    			log.debug({ title: 'CurrentApp_Level', details: 'CurrentApp_Level*************' + CurrentApp_Level });
     */
    			
    			const CurrentApp_Level = LeaveRec_OBJ.getFieldValue('custrecord_hris_lveappapprovallevel')
    			log.debug({ title: 'CurrentApp_Level', details: 'CurrentApp_Level*************' + CurrentApp_Level });
    			const Cancelcheck = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_cancellation')
    			log.debug({ title: 'Cancelcheck', details: 'Cancelcheck*************' + Cancelcheck });
    			const Approvalstatus = LeaveRec_OBJ.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus')
    			log.debug({ title: 'Approvalstatus', details: 'Approvalstatus*************' + Approvalstatus });
    			
    			const Requestor = LeaveRec_OBJ.getFieldValue('custrecordhris_lve_requestor')
    			log.debug({ title: 'Requestor', details: 'Requestor*************' +Requestor });
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

    return {
        beforeLoadRecord_ShowButton: beforeLoadRecord_ShowButton
    };
});
