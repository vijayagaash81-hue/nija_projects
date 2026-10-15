function beforeSubmitRecord_check_balance_value(type)
{
   
   if (type == 'create')
    {
		
	var error = 'Leaves exceeds than leave balance available' ;
		
	var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')
	nlapiLogExecution('DEBUG', 'leave_type', 'leave_type =' + leave_type);
	
	var tot_no_days = nlapiGetFieldValue('custrecord_hris_lve_totalnodays')
	nlapiLogExecution('DEBUG', 'tot_no_days', 'tot_no_days =' + tot_no_days);
	
	var balance = nlapiGetFieldValue('custrecord_hris_lve_leavebalance')
	nlapiLogExecution('DEBUG', 'balance', 'balance =' + balance);
	
	var employee = nlapiGetFieldValue('custrecord_hris_lve_employeename')
	nlapiLogExecution('DEBUG', 'employee', 'employee =' + employee);
	
	 var filters = new Array();
	 var columns = new Array();
	 var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')
// Add by florence For Unpaid Leave annual
	 var seq_no_search = get_sequence_no(leave_type)
	 var seq_no_split = seq_no_search.split('#')
	 var seq_no = seq_no_split[0];
	 var negAllowChk = seq_no_split[1];
	 var maxNegAllow = seq_no_split[2];

	 if (seq_no != 3 && seq_no != 2 && seq_no != 8 && seq_no != 13) {
    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
  
    columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('custrecord_hris_lvbal_total_applied_days'));
	columns.push(new nlobjSearchColumn('custrecord_hris_lvbal_available_leave_ba'));
	
	
	 var leaveBalanceresults = nlapiSearchRecord('customrecord_hris_leavebalance', null, filters, columns);
	 nlapiLogExecution('DEBUG', 'leaveBalanceresults', 'leaveBalanceresults$$$$$$$$$$$$$ =' + leaveBalanceresults);
	 
	 if (leaveBalanceresults != null)
	 {
        var internal_id = leaveBalanceresults[0].getValue('internalid')
		nlapiLogExecution('DEBUG', 'internal_id', 'internal_id =' + internal_id);
		
		var applied_bal = leaveBalanceresults[0].getValue('custrecord_hris_lvbal_total_applied_days')||0;
		nlapiLogExecution('DEBUG', 'applied_bal', 'applied_bal =' + applied_bal);
		
		var LeaveBALANCE = leaveBalanceresults[0].getValue('custrecord_hris_lvbal_available_leave_ba')
		nlapiLogExecution('DEBUG', 'LeaveBALANCE', 'LeaveBALANCE =' + LeaveBALANCE);
		
		var final_APPLIEDdays = parseFloat(applied_bal) + parseFloat(tot_no_days)
		nlapiLogExecution('DEBUG', 'final_APPLIEDdays', 'final_APPLIEDdays =' + final_APPLIEDdays);
		
		
		if(parseFloat(final_APPLIEDdays) > parseFloat(LeaveBALANCE))
		{
						
						throw error ;
						return false ;
		}
	 }

	 }	 
  }
   
   
    
if (type == 'delete') 
	{
		
		var rec_id = nlapiGetRecordId();
		nlapiLogExecution('Debug', 'rec_id :', ' rec_id' + rec_id);
		
		if (_logValidation(rec_id))
		 {
		
		    nlapiLogExecution('Debug', 'leave_record :', ' in......................');
			
			
			var old_record = nlapiGetOldRecord();
			nlapiLogExecution('Debug', 'old_record :', ' old_record' + old_record);
			
			
	
			var leave_type = old_record.getFieldValue('custrecord_hris_lve_leavetype')
			nlapiLogExecution('Debug', 'leave_type :', ' leave_type' + leave_type);
			
			var employee = old_record.getFieldValue('custrecord_hris_lve_employeename')
			nlapiLogExecution('DEBUG', 'employee', 'employee =' + employee);
			
			var leave_status = old_record.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus')
			nlapiLogExecution('Debug', 'leave_status :', ' leave_status' + leave_status);
			
			var tot_no_days = old_record.getFieldValue('custrecord_hris_lve_totalnodays')||0;
			nlapiLogExecution('DEBUG', 'tot_no_days', 'tot_no_days =' + tot_no_days);
			
			var leave_status = old_record.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus')
			nlapiLogExecution('Debug', 'leave_status :', ' leave_status' + leave_status); 
			
			if (leave_status != 3) 
			{
				
				var filters = new Array();
	            var columns = new Array();
	 
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
				filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
			  
			    columns.push(new nlobjSearchColumn('internalid'));
				
				 var leaveBalanceresults = nlapiSearchRecord('customrecord_hris_leavebalance', null, filters, columns);
				 var total_applied =0;
				 nlapiLogExecution('DEBUG', 'total_applied', 'total_applied =' + total_applied);
				 if (leaveBalanceresults != null)
				 {
			        var internal_id = leaveBalanceresults[0].getValue('internalid')
					
					var load_balance_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id)
					
					total_applied = load_balance_record.getFieldValue('custrecord_hris_lvbal_total_applied_days')||0;
					nlapiLogExecution('DEBUG', 'total_applied', 'total_applied =' + total_applied);
					
					var final_days = parseFloat(total_applied) - parseFloat(tot_no_days)
					nlapiLogExecution('DEBUG', 'final_days', 'final_days =' + final_days);
					
					load_balance_record.setFieldValue('custrecord_hris_lvbal_total_applied_days',final_days)
					
					var balrecid =nlapiSubmitRecord(load_balance_record);
					nlapiLogExecution('DEBUG', 'balrecid', 'balrecid =' + balrecid);

				 }
			}
		}
	}

	nlapiLogExecution('DEBUG', 'check1');
   return true;

}

function afterSubmitRecord_balance_check(type)
{
   
  if (type == 'create')
   {
   	
	nlapiLogExecution('DEBUG', 'into_AfterDUBMIT', 'into_AfterDUBMIT');
	
	var leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')
	nlapiLogExecution('DEBUG', 'leave_type', 'leave_type =' + leave_type);
	
	var tot_no_days = nlapiGetFieldValue('custrecord_hris_lve_totalnodays')
	nlapiLogExecution('DEBUG', 'tot_no_days', 'tot_no_days =' + tot_no_days);
	
	var balance = nlapiGetFieldValue('custrecord_hris_lve_leavebalance')
	nlapiLogExecution('DEBUG', 'balance', 'balance =' + balance);
	
	var employee = nlapiGetFieldValue('custrecord_hris_lve_employeename')
	nlapiLogExecution('DEBUG', 'employee', 'employee =' + employee);
	
	 var filters = new Array();
	 var columns = new Array();
	 
    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
  
    columns.push(new nlobjSearchColumn('internalid'));
	
	 var leaveBalanceresults = nlapiSearchRecord('customrecord_hris_leavebalance', null, filters, columns);
	 nlapiLogExecution('DEBUG', 'leaveBalanceresults', 'leaveBalanceresults =' + leaveBalanceresults);
	 
	 if (leaveBalanceresults != null)
	 {
        var internal_id = leaveBalanceresults[0].getValue('internalid')
		nlapiLogExecution('DEBUG', 'internal_id', 'internal_id =' + internal_id);
		
		var load_balance_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id)
		
		var applied_bal = 0 ;
		
		 applied_bal = load_balance_record.getFieldValue('custrecord_hris_lvbal_total_applied_days')||0;
		nlapiLogExecution('DEBUG', 'applied_bal', 'applied_bal =' + applied_bal);
		
		nlapiLogExecution('DEBUG', 'tot_no_days', 'tot_no_days =' + tot_no_days);
		
		applied_bal = parseFloat(applied_bal) + parseFloat(tot_no_days) 
		
		
		load_balance_record.setFieldValue('custrecord_hris_lvbal_total_applied_days', applied_bal);
		
		nlapiSubmitRecord(load_balance_record);
	 }
	
 }
		nlapiLogExecution('Debug', 'type :', ' type' + type); 
	// florence  for pullback error	
 //  if (type != 'create' || type != 'delete')
   if (type != 'create' && type != 'delete')
	 {
	 	
		var flag = 0 ;
	 	
		nlapiLogExecution('Debug', '##################:', ' ******************');
		
		var rec_id = nlapiGetRecordId();
		nlapiLogExecution('Debug', 'rec_id :', ' rec_id' + rec_id);
		
		if (_logValidation(rec_id)) 
		{
			
			var leave_record = nlapiLoadRecord('customrecord_hris_leaveapplication', rec_id);
		    nlapiLogExecution('Debug', 'leave_record :', ' leave_record' + leave_record); 
			
			
			var leave_type = leave_record.getFieldValue('custrecord_hris_lve_leavetype')
			nlapiLogExecution('Debug', 'leave_type :', ' leave_type' + leave_type); 
			
			var employee = leave_record.getFieldValue('custrecord_hris_lve_employeename')
	        nlapiLogExecution('DEBUG', 'employee', 'employee =' + employee);
			
			var leave_status = leave_record.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus')
			nlapiLogExecution('Debug', 'leave_status :', ' leave_status' + leave_status); 
			
			var leaveCANCEL_status = leave_record.getFieldValue('custrecord_hris_lve_cancel_leavestatus')
			nlapiLogExecution('Debug', 'leaveCANCEL_status :', ' leaveCANCEL_status' + leaveCANCEL_status);
			
			var cancelCHECk = leave_record.getFieldValue('custrecord_hris_lve_cancellation')
			nlapiLogExecution('Debug', 'cancelCHECk :', ' cancelCHECk' + cancelCHECk); 
			
			var tot_no_days = leave_record.getFieldValue('custrecord_hris_lve_totalnodays')||0;
	        nlapiLogExecution('DEBUG', 'tot_no_days', 'tot_no_days =' + tot_no_days);
			
			if(leave_status == 2 )
			{
				
				if(cancelCHECk == 'F')
				{
					var filters = new Array();
	            var columns = new Array();
	 
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
				filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
			  
			    columns.push(new nlobjSearchColumn('internalid'));
				
				 var leaveBalanceresults = nlapiSearchRecord('customrecord_hris_leavebalance', null, filters, columns);
				var total_applied=0;
				 if (leaveBalanceresults != null)
				 {
			        var internal_id = leaveBalanceresults[0].getValue('internalid')
					
					var load_balance_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id)
					
					 total_applied = load_balance_record.getFieldValue('custrecord_hris_lvbal_total_applied_days')||0;
					nlapiLogExecution('DEBUG', 'total_applied', 'total_applied =' + total_applied);
					
					var final_days = parseFloat(total_applied) - parseFloat(tot_no_days)
					nlapiLogExecution('DEBUG', 'final_days', 'final_days =' + final_days);
					
					load_balance_record.setFieldValue('custrecord_hris_lvbal_total_applied_days',final_days)
					
					nlapiSubmitRecord(load_balance_record);
				 }
							
				
				
					
				}
				
				
				
			}
			if(leave_status == 3)
			{
				if(flag == 0)
				{
					
					nlapiLogExecution('DEBUG', '**************into reject*************', '******************into reject****************');
				
				var filters = new Array();
	            var columns = new Array();
	 
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
				filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
			  
			    columns.push(new nlobjSearchColumn('internalid'));
				
				 var leaveBalanceresults = nlapiSearchRecord('customrecord_hris_leavebalance', null, filters, columns);
				
				 if (leaveBalanceresults != null)
				 {
			        var internal_id = leaveBalanceresults[0].getValue('internalid')
					
					var load_balance_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id)
					
					var total_applied = load_balance_record.getFieldValue('custrecord_hris_lvbal_total_applied_days')||0;
					nlapiLogExecution('DEBUG', 'total_applied', 'total_applied =' + total_applied);
					
					var final_days = parseFloat(total_applied) - parseFloat(tot_no_days)
					nlapiLogExecution('DEBUG', 'final_days', 'final_days =' + final_days);
					
					load_balance_record.setFieldValue('custrecord_hris_lvbal_total_applied_days',final_days)
					
					nlapiSubmitRecord(load_balance_record);
				 }
							
					
				}
				
				
				flag = flag + 1;
				
				
			}
			
			
		}
		
		
		
		
	}
	

  

   
   
   
	return true;

}










function _logValidation(value) 
{
 if(value!='null' && value != null && value != null && value != '' && value != undefined && value != undefined && value != 'undefined' && value != 'undefined'&& value != 'NaN' && value != NaN) 
 {
  return true;
 }
 else 
 { 
  return false;
 }
}
function get_sequence_no(leave_type) {

    var filters = new Array();
    var columns = new Array();

    filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
    //filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type))

    columns.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_seqno'));
    columns.push(new nlobjSearchColumn('custrecord_hris_lveconfig_allowneglevbal'));
    columns.push(new nlobjSearchColumn('custrecord_hris_lvecfg_maxnegativebal'));

    var compoff_record_result = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, columns);

    if (compoff_record_result != null) {

        var sequence_no = compoff_record_result[0].getValue('custrecord_hris_lvecnfg_seqno')
        var negAllowChk = compoff_record_result[0].getValue('custrecord_hris_lveconfig_allowneglevbal')
        var maxNegAllow = compoff_record_result[0].getValue('custrecord_hris_lvecfg_maxnegativebal')


    }
    return sequence_no + "#" + negAllowChk + "#" + maxNegAllow;
}





