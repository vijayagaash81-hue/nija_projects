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
function beforeSubmitRecord_check_balance_value(type)
{
   
   if (type == 'create')
    {
		
	let error = 'Leaves exceeds than leave balance available' ;
		
	let leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')
	nlapiLogExecution('DEBUG', 'leave_type', 'leave_type =' + leave_type);
	
	let tot_no_days = nlapiGetFieldValue('custrecord_hris_lve_totalnodays')
	nlapiLogExecution('DEBUG', 'tot_no_days', 'tot_no_days =' + tot_no_days);
	
	let balance = nlapiGetFieldValue('custrecord_hris_lve_leavebalance')
	nlapiLogExecution('DEBUG', 'balance', 'balance =' + balance);
	
	let employee = nlapiGetFieldValue('custrecord_hris_lve_employeename')
	nlapiLogExecution('DEBUG', 'employee', 'employee =' + employee);
	
	 let filters = new Array();
	 let columns = new Array();
	 leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')
// Add by florence For Unpaid Leave annual
	 let seq_no_search = get_sequence_no(leave_type)
	 let seq_no_split = seq_no_search.split('#')
	 let seq_no = seq_no_split[0];
	 let negAllowChk = seq_no_split[1];
	 let maxNegAllow = seq_no_split[2];

	 if (seq_no != 3 && seq_no != 2 && seq_no != 8 && seq_no != 13) {
    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
  
    columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('custrecord_hris_lvbal_total_applied_days'));
	columns.push(new nlobjSearchColumn('custrecord_hris_lvbal_available_leave_ba'));
	
	
	 let leaveBalanceresults = nlapiSearchRecord('customrecord_hris_leavebalance', null, filters, columns);
	 nlapiLogExecution('DEBUG', 'leaveBalanceresults', 'leaveBalanceresults$$$$$$$$$$$$$ =' + leaveBalanceresults);
	 
	 if (leaveBalanceresults != null)
	 {
        let internal_id = leaveBalanceresults[0].getValue('internalid')
		nlapiLogExecution('DEBUG', 'internal_id', 'internal_id =' + internal_id);
		
		let applied_bal = leaveBalanceresults[0].getValue('custrecord_hris_lvbal_total_applied_days')||0;
		nlapiLogExecution('DEBUG', 'applied_bal', 'applied_bal =' + applied_bal);
		
		let LeaveBALANCE = leaveBalanceresults[0].getValue('custrecord_hris_lvbal_available_leave_ba')
		nlapiLogExecution('DEBUG', 'LeaveBALANCE', 'LeaveBALANCE =' + LeaveBALANCE);
		
		let final_APPLIEDdays = parseFloat(applied_bal) + parseFloat(tot_no_days)
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
		
		let rec_id = nlapiGetRecordId();
		nlapiLogExecution('Debug', 'rec_id :', ' rec_id' + rec_id);
		
		if (_logValidation(rec_id))
		 {
		
		    nlapiLogExecution('Debug', 'leave_record :', ' in......................');
			
			
			let old_record = nlapiGetOldRecord();
			nlapiLogExecution('Debug', 'old_record :', ' old_record' + old_record);
			
			
	
			let leave_type = old_record.getFieldValue('custrecord_hris_lve_leavetype')
			nlapiLogExecution('Debug', 'leave_type :', ' leave_type' + leave_type);
			
			let employee = old_record.getFieldValue('custrecord_hris_lve_employeename')
			nlapiLogExecution('DEBUG', 'employee', 'employee =' + employee);
			
			let leave_status = old_record.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus')
			nlapiLogExecution('Debug', 'leave_status :', ' leave_status' + leave_status);
			
			let tot_no_days = old_record.getFieldValue('custrecord_hris_lve_totalnodays')||0;
			nlapiLogExecution('DEBUG', 'tot_no_days', 'tot_no_days =' + tot_no_days);
			
			leave_status = old_record.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus')
			nlapiLogExecution('Debug', 'leave_status :', ' leave_status' + leave_status); 
			
			if (leave_status != 3) 
			{
				
				let filters = new Array();
	            let columns = new Array();
	 
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
				filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
			  
			    columns.push(new nlobjSearchColumn('internalid'));
				
				 let leaveBalanceresults = nlapiSearchRecord('customrecord_hris_leavebalance', null, filters, columns);
				 let total_applied =0;
				 nlapiLogExecution('DEBUG', 'total_applied', 'total_applied =' + total_applied);
				 if (leaveBalanceresults != null)
				 {
			        let internal_id = leaveBalanceresults[0].getValue('internalid')
					
					let load_balance_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id)
					
					total_applied = load_balance_record.getFieldValue('custrecord_hris_lvbal_total_applied_days')||0;
					nlapiLogExecution('DEBUG', 'total_applied', 'total_applied =' + total_applied);
					
					let final_days = parseFloat(total_applied) - parseFloat(tot_no_days)
					nlapiLogExecution('DEBUG', 'final_days', 'final_days =' + final_days);
					
					load_balance_record.setFieldValue('custrecord_hris_lvbal_total_applied_days',final_days)
					
					let balrecid =nlapiSubmitRecord(load_balance_record);
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
	
	let leave_type = nlapiGetFieldValue('custrecord_hris_lve_leavetype')
	nlapiLogExecution('DEBUG', 'leave_type', 'leave_type =' + leave_type);
	
	let tot_no_days = nlapiGetFieldValue('custrecord_hris_lve_totalnodays')
	nlapiLogExecution('DEBUG', 'tot_no_days', 'tot_no_days =' + tot_no_days);
	
	let balance = nlapiGetFieldValue('custrecord_hris_lve_leavebalance')
	nlapiLogExecution('DEBUG', 'balance', 'balance =' + balance);
	
	let employee = nlapiGetFieldValue('custrecord_hris_lve_employeename')
	nlapiLogExecution('DEBUG', 'employee', 'employee =' + employee);
	
	 let filters = new Array();
	 let columns = new Array();
	 
    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
  
    columns.push(new nlobjSearchColumn('internalid'));
	
	 let leaveBalanceresults = nlapiSearchRecord('customrecord_hris_leavebalance', null, filters, columns);
	 nlapiLogExecution('DEBUG', 'leaveBalanceresults', 'leaveBalanceresults =' + leaveBalanceresults);
	 
	 if (leaveBalanceresults != null)
	 {
        let internal_id = leaveBalanceresults[0].getValue('internalid')
		nlapiLogExecution('DEBUG', 'internal_id', 'internal_id =' + internal_id);
		
		let load_balance_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id)
		
		let applied_bal = 0 ;
		
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
	 	
		let flag = 0 ;
	 	
		nlapiLogExecution('Debug', '##################:', ' ******************');
		
		let rec_id = nlapiGetRecordId();
		nlapiLogExecution('Debug', 'rec_id :', ' rec_id' + rec_id);
		
		if (_logValidation(rec_id)) 
		{
			
			let leave_record = nlapiLoadRecord('customrecord_hris_leaveapplication', rec_id);
		    nlapiLogExecution('Debug', 'leave_record :', ' leave_record' + leave_record); 
			
			
			let leave_type = leave_record.getFieldValue('custrecord_hris_lve_leavetype')
			nlapiLogExecution('Debug', 'leave_type :', ' leave_type' + leave_type); 
			
			let employee = leave_record.getFieldValue('custrecord_hris_lve_employeename')
	        nlapiLogExecution('DEBUG', 'employee', 'employee =' + employee);
			
			let leave_status = leave_record.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus')
			nlapiLogExecution('Debug', 'leave_status :', ' leave_status' + leave_status); 
			
			let leaveCANCEL_status = leave_record.getFieldValue('custrecord_hris_lve_cancel_leavestatus')
			nlapiLogExecution('Debug', 'leaveCANCEL_status :', ' leaveCANCEL_status' + leaveCANCEL_status);
			
			let cancelCHECk = leave_record.getFieldValue('custrecord_hris_lve_cancellation')
			nlapiLogExecution('Debug', 'cancelCHECk :', ' cancelCHECk' + cancelCHECk); 
			
			let tot_no_days = leave_record.getFieldValue('custrecord_hris_lve_totalnodays')||0;
	        nlapiLogExecution('DEBUG', 'tot_no_days', 'tot_no_days =' + tot_no_days);
			
			if(leave_status == 2 )
			{
				
				if(cancelCHECk == 'F')
				{
					let filters = new Array();
	            let columns = new Array();
	 
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
				filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
			  
			    columns.push(new nlobjSearchColumn('internalid'));
				
				 let leaveBalanceresults = nlapiSearchRecord('customrecord_hris_leavebalance', null, filters, columns);
				let total_applied=0;
				 if (leaveBalanceresults != null)
				 {
			        let internal_id = leaveBalanceresults[0].getValue('internalid')
					
					let load_balance_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id)
					
					 total_applied = load_balance_record.getFieldValue('custrecord_hris_lvbal_total_applied_days')||0;
					nlapiLogExecution('DEBUG', 'total_applied', 'total_applied =' + total_applied);
					
					let final_days = parseFloat(total_applied) - parseFloat(tot_no_days)
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
				
				let filters = new Array();
	            let columns = new Array();
	 
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
				filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
			  
			    columns.push(new nlobjSearchColumn('internalid'));
				
				 let leaveBalanceresults = nlapiSearchRecord('customrecord_hris_leavebalance', null, filters, columns);
				
				 if (leaveBalanceresults != null)
				 {
			        let internal_id = leaveBalanceresults[0].getValue('internalid')
					
					let load_balance_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id)
					
					let total_applied = load_balance_record.getFieldValue('custrecord_hris_lvbal_total_applied_days')||0;
					nlapiLogExecution('DEBUG', 'total_applied', 'total_applied =' + total_applied);
					
					let final_days = parseFloat(total_applied) - parseFloat(tot_no_days)
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

    let filters = new Array();
    let columns = new Array();

    filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
    //filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type))

    columns.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_seqno'));
    columns.push(new nlobjSearchColumn('custrecord_hris_lveconfig_allowneglevbal'));
    columns.push(new nlobjSearchColumn('custrecord_hris_lvecfg_maxnegativebal'));

    let compoff_record_result = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, columns);

    if (compoff_record_result != null) {

        let sequence_no = compoff_record_result[0].getValue('custrecord_hris_lvecnfg_seqno')
        let negAllowChk = compoff_record_result[0].getValue('custrecord_hris_lveconfig_allowneglevbal')
        let maxNegAllow = compoff_record_result[0].getValue('custrecord_hris_lvecfg_maxnegativebal')


    }
    return sequence_no + "#" + negAllowChk + "#" + maxNegAllow;
}







});
