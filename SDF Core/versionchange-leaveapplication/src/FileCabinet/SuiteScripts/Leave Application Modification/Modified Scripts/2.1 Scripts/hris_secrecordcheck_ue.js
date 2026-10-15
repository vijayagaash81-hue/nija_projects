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
function beforeSubmitRecord_SecCheck(type){

	if (type == 'create') 
	{
	
		let emp_name = nlapiGetFieldValue('custrecord_hris_lve_employeename');
		let error = 'This record is already Present for the applied date'
		let frm_date_val = nlapiGetFieldValue('custrecord_hris_lve_fromdate');
		let to_date_val = nlapiGetFieldValue('custrecord_hris_lve_todate');
		
		 
		 let searchdate = nlapiSearchRecord("customrecord_hris_leaveapplication",null,
                          					  
						  [
                             ["custrecord_hris_lve_employeename","anyof", emp_name], 
                            
							"AND", 
                           [[
						     ["custrecord_hris_lve_fromdate","onorafter", frm_date_val],
							   
							   "AND",
							 ["custrecord_hris_lve_todate","onorbefore", to_date_val]],
							 
							  "OR",
                             [
                             [
                              ["custrecord_hris_lve_fromdate","within",frm_date_val,to_date_val]
                             ],
							 
                              "OR",
                             [
                                ["custrecord_hris_lve_todate","within",frm_date_val,to_date_val]
                             ]
                             
							 ]]
                           
						   ], 
						  
                          [
                             new nlobjSearchColumn("internalid"), 
                             new nlobjSearchColumn("custrecord_hris_lve_cancellation"), 
                             new nlobjSearchColumn("custrecord_hris_lve_hrmsapprovalstatus"), 
                             new nlobjSearchColumn("custrecord_hris_lve_cancel_leavestatus")
                          ]
                          );
		 if (searchdate != null)
		 {
			 for(let i= '0'; i < searchdate.length; i++)
			 {
				 nlapiLogExecution('DEBUG', 'searchdate', 'searchdate ***********=' + searchdate.length);
				 let cancelStatus  = searchdate[i].getValue('custrecord_hris_lve_cancel_leavestatus');
				 let approveStatus = searchdate[i].getValue('custrecord_hris_lve_hrmsapprovalstatus');
				 let cancelChkBox  = searchdate[i].getValue('custrecord_hris_lve_cancellation');
				 nlapiLogExecution('DEBUG', 'aa cancelStatus', cancelStatus)
				 if(cancelStatus == '3' || (approveStatus == '1' && cancelChkBox == 'F') || (cancelStatus == '3' && cancelChkBox == 'T'))
				 {
					 nlapiLogExecution('DEBUG', 'Inside  1 Leave Id', searchdate[i].getValue('internalid'))
					 throw error;
				 }
				 if((approveStatus == '2' && cancelChkBox == 'T' && cancelStatus == '2') || approveStatus == '3')
				 {
					 nlapiLogExecution('DEBUG', 'Inside  2 Leave Id', searchdate[i].getValue('internalid'))
				 }
				 else
				 {
					 nlapiLogExecution('DEBUG', 'Inside  3 Leave Id', searchdate[i].getValue('internalid'))
					 throw error;
				 }
			 }
		 
		 

		 }
	}
}
function GetCurrentDate()
{
	let today = new Date();
	let dd = today.getDate();
	let mm = today.getMonth() + 1;
	let yy = today.getFullYear();
	return mm+"/"+ dd+"/"+yy;
	
}
{
}


});
