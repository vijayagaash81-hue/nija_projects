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
function beforeLoadRecord(type)
{
return true;
}
function beforeSubmitRecord_record_check(type)
{

	if (type == 'create')
	 {
	
		let emp_name = nlapiGetFieldValue('custrecord_hris_lve_employeename');
		let error = 'This record is already Present for the applied date'
		
		let frm_dt_VL = nlapiGetFieldValue('custrecord_hris_lve_fromdate');
		let frm_date_val = nlapiStringToDate(frm_dt_VL) ;
		
		let to_DTVL = nlapiGetFieldValue('custrecord_hris_lve_todate');
		let to_date_val  = nlapiStringToDate(to_DTVL) ;
		
		if (frm_date_val != '' && frm_date_val != 'undefined' && frm_date_val != null && to_date_val != '' && to_date_val != 'undefined' && to_date_val != null)
		 {
			let LAfilters = new Array();
			let LAcolumns = new Array();
			
			LAfilters.push(new nlobjSearchFilter('custrecord_hris_lve_employeename', null, 'is', emp_name))
			LAfilters.push(new nlobjSearchFilter('custrecord_hris_lve_hrmsapprovalstatus', null, 'noneof', 3 ))
			LAfilters.push(new nlobjSearchFilter('custrecord_hris_lve_cancel_leavestatus', null, 'noneof', 2 ))
			LAcolumns.push(new nlobjSearchColumn('custrecord_hris_lve_fromdate'));
			LAcolumns.push(new nlobjSearchColumn('custrecord_hris_lve_todate'));
			LAcolumns.push(new nlobjSearchColumn('custrecord_hris_lve_leavetype'));
			
			let searchdate = nlapiSearchRecord('customrecord_hris_leaveapplication', null, LAfilters, LAcolumns);
			nlapiLogExecution('DEBUG', 'searchdate', 'searchdate ***********=' + searchdate);
			
			
			if (searchdate != null) 
			{
			   for (let i = 0; i < searchdate.length; i++)
				 {
				    let present_FRMDATE = searchdate[i].getValue('custrecord_hris_lve_fromdate')
                    let present_frm_dt  = nlapiStringToDate(present_FRMDATE) ;
					nlapiLogExecution('DEBUG', 'present_frm_dt', 'present_frm_dt ***********=' + present_frm_dt);
									   
				    let present_TODT = searchdate[i].getValue('custrecord_hris_lve_todate')
                    let present_to_dt  = nlapiStringToDate(present_TODT) ;
					
					nlapiLogExecution('DEBUG', 'present_to_dt', 'present_to_dt ***********=' + present_to_dt);
						
						
					//let leave_type = searchdate[i].getValue('custrecord_hris_lve_leavetype')	
					let E_leavetype = nlapiGetFieldValue("custrecord_hris_lve_leavetype");
        			let leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid'); 
					
				
	                if( leave_type != 6)
					{
						if ((frm_date_val <= present_frm_dt) && (frm_date_val < present_to_dt) && (to_date_val >= present_frm_dt) && (to_date_val <= present_to_dt))
					 {
					 	throw error;
					 }
					else if ((frm_date_val <= present_frm_dt) && (frm_date_val < present_to_dt) && (to_date_val > present_frm_dt) && (to_date_val >= present_to_dt))
					 {
					 	throw error;
					}
					else if ((frm_date_val >= present_frm_dt) && (frm_date_val <= present_to_dt) && (to_date_val > present_frm_dt) && (to_date_val >= present_to_dt)) 
					{
						throw error;
					}
					else if((present_frm_dt < frm_date_val)&& (to_date_val < present_to_dt))
					{
						throw error;
					}
					else if((frm_date_val > present_frm_dt) && (frm_date_val < present_to_dt))
				     {
					    throw error;
				     }
				    else if (+frm_date_val == +present_frm_dt)
			         {
					  throw error;
			         }
						
					}
						
					
				}
				return true;
			}
		}
	}
}
	
	
function afterSubmitRecord_compoff_check(type)
{
	
	if(type != 'delete')
	{
		let RECid = nlapiGetRecordId();
		let LoadRec = nlapiLoadRecord('customrecord_hris_leaveapplication',RECid)
		let Leave_type = LoadRec.getFieldValue('custrecord_hris_lve_leavetype');
		let Employee = LoadRec.getFieldValue('custrecord_hris_lve_employeename');
		nlapiLogExecution('DEBUG', 'Leave_type', 'Leave_type*******'+Leave_type);
		
	let sequence_value = get_sequence_no(Leave_type);
	nlapiLogExecution('DEBUG', 'sequence_value', 'sequence_value*******'+sequence_value);
	
	 if (sequence_value == 5)
	 {
		let status = LoadRec.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
		nlapiLogExecution('DEBUG', 'status', 'status*******'+status);
		let cancel_status = LoadRec.getFieldValue('custrecord_hris_lve_cancel_leavestatus');
		nlapiLogExecution('DEBUG', 'cancel_status', 'cancel_status*******'+cancel_status);
		if (status != 3)
		{
		    let valid_till_date = LoadRec.getFieldValue('custrecord_hris_lve_validtilldate');
			
			let filters = new Array();
			let columns = new Array();
			filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_valid_till_date', null, 'on', valid_till_date))
			filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_employee_name', null, 'is', Employee))
			columns.push(new nlobjSearchColumn('internalid'));
			let compoff_record_result = nlapiSearchRecord('customrecord_hris_lve_raise_comp_off', null, filters, columns);
			if (compoff_record_result != null) 
			{
			    let id = compoff_record_result[0].getValue('internalid')
				let compoff_record = nlapiLoadRecord('customrecord_hris_lve_raise_comp_off', id)
				let check_box = compoff_record.getFieldValue('custrecord_hris_rcomp_checked')
				compoff_record.setFieldValue('custrecord_hris_rcomp_checked', 'T')
				nlapiSubmitRecord(compoff_record);
			}
		}
		
		if (status == 3)
		{
			nlapiLogExecution('DEBUG', '*******reject******', 'into rejected');
		    let valid_till_date = LoadRec.getFieldValue('custrecord_hris_lve_validtilldate');
			nlapiLogExecution('DEBUG', '*******valid_till_date******', 'valid_till_date'+valid_till_date);
			let filters = new Array();
			let columns = new Array();
			filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_valid_till_date', null, 'on',valid_till_date))
            filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_employee_name', null, 'is', Employee))
		    columns.push(new nlobjSearchColumn('internalid'));
			let compoff_record_result = nlapiSearchRecord('customrecord_hris_lve_raise_comp_off', null, filters, columns);
			nlapiLogExecution('DEBUG', '*******compoff_record_result******', 'compoff_record_result'+compoff_record_result);
			if (compoff_record_result != null) 
			{
			    let id = compoff_record_result[0].getValue('internalid')
				nlapiLogExecution('DEBUG', '*******id******', 'id'+id);
				let compoff_record = nlapiLoadRecord('customrecord_hris_lve_raise_comp_off', id)
				let check_box = compoff_record.getFieldValue('custrecord_hris_rcomp_checked')
				nlapiLogExecution('DEBUG', '*******check_box******', 'check_box'+check_box);
				compoff_record.setFieldValue('custrecord_hris_rcomp_checked', 'F')
				nlapiSubmitRecord(compoff_record);
			}
		}
		if (cancel_status == 2)
		{
		    let valid_till_date = LoadRec.getFieldValue('custrecord_hris_lve_validtilldate');
			
			let filters = new Array();
			let columns = new Array();
			filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_valid_till_date', null, 'on', valid_till_date))
            filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_employee_name', null, 'is', Employee))
		
			columns.push(new nlobjSearchColumn('internalid'));
			let compoff_record_result = nlapiSearchRecord('customrecord_hris_lve_raise_comp_off', null, filters, columns);
			if (compoff_record_result != null) 
			{
			    let id = compoff_record_result[0].getValue('internalid')
				let compoff_record = nlapiLoadRecord('customrecord_hris_lve_raise_comp_off', id)
				let check_box = compoff_record.getFieldValue('custrecord_hris_rcomp_checked')
				compoff_record.setFieldValue('custrecord_hris_rcomp_checked', 'F')
				nlapiSubmitRecord(compoff_record);
			}
		}
	}	
		
	}
	
}	
function getDatediffIndays(startDate, endDate)

{
   let one_day=1000*60*60*24;
   let fromDate = startDate;
   let toDate=endDate
   nlapiLogExecution('DEBUG', 'getDatediffIndays', 'From Date = '+fromDate+'To Date = '+toDate);
   let x=fromDate.split("/");
   let y=toDate.split("/");
   let date1=new Date(x[2],(x[1]-1),x[0]);
   let date2=new Date(y[2],(y[1]-1),y[0]);
   let month1=x[1];
   let month2=y[1];
   let Diff = Math.ceil((date2.getTime()-date1.getTime())/(one_day));
   nlapiLogExecution('DEBUG', 'getDatediffIndays', 'Date difference Return Value = '+Diff);
   return Diff;

}



function get_sequence_no(Leave_type)
	{
		
		 nlapiLogExecution('DEBUG', 'intofunction', 'into function leave type'+Leave_type);
		let LCR = nlapiLoadRecord('customrecord_hris_leaveconfig',Leave_type);
		
		let sequence_no = LCR.getFieldValue('custrecord_hris_lvecnfg_seqno')
		return sequence_no ;
	}
{

}


});
