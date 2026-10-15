/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/search'], (search) => {

    function beforeLoadRecord(type)
    {
    return true;
    }
    function beforeSubmitRecord_SecCheck(type){
    
    	if (type == 'create') 
    	{
    	
    		const emp_name = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
    		const error = 'This record is already Present for the applied date'
    		const frm_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' });
    		const to_date_val = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' });
    		
    		 
    		 const searchdate = search.create({ type: "customrecord_hris_leaveapplication", filters: [
                                 ["custrecord_hris_lve_employeename", columns: "anyof", emp_name], 
                                
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
                                 new nlobjSearchColumn("internalid" }).run(), 
                                 new nlobjSearchColumn("custrecord_hris_lve_cancellation"), 
                                 new nlobjSearchColumn("custrecord_hris_lve_hrmsapprovalstatus"), 
                                 new nlobjSearchColumn("custrecord_hris_lve_cancel_leavestatus")
                              ]
                              );
    		 if (searchdate != null)
    		 {
    			 for(const i= '0'; i < searchdate.length; i++)
    			 {
    				 log.debug({ title: 'searchdate', details: 'searchdate ***********=' + searchdate.length });
    				 const cancelStatus  = searchdate[i].getValue('custrecord_hris_lve_cancel_leavestatus');
    				 const approveStatus = searchdate[i].getValue('custrecord_hris_lve_hrmsapprovalstatus');
    				 const cancelChkBox  = searchdate[i].getValue('custrecord_hris_lve_cancellation');
    				 log.debug({ title: 'aa cancelStatus', details: cancelStatus })
    				 if(cancelStatus == '3' || (approveStatus == '1' && cancelChkBox == 'F') || (cancelStatus == '3' && cancelChkBox == 'T'))
    				 {
    					 log.debug({ title: 'Inside  1 Leave Id', details: searchdate[i].getValue('internalid' }))
    					 throw error;
    				 }
    				 if((approveStatus == '2' && cancelChkBox == 'T' && cancelStatus == '2') || approveStatus == '3')
    				 {
    					 log.debug({ title: 'Inside  2 Leave Id', details: searchdate[i].getValue('internalid' }))
    				 }
    				 else
    				 {
    					 log.debug({ title: 'Inside  3 Leave Id', details: searchdate[i].getValue('internalid' }))
    					 throw error;
    				 }
    			 }
    		 
    		 
    
    		 }
    	}
    }
    function GetCurrentDate()
    {
    	const today = new Date();
    	const dd = today.getDate();
    	const mm = today.getMonth() + 1;
    	const yy = today.getFullYear();
    	return mm+"/"+ dd+"/"+yy;
    	
    }
    {
    }

    return {
        beforeLoadRecord: beforeLoadRecord,
        beforeSubmitRecord_SecCheck: beforeSubmitRecord_SecCheck
    };
});
