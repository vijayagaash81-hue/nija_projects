/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search'], (record, search) => {

    function beforeLoadRecord(type)
    {
    return true;
    }
    function beforeSubmitRecord_record_check(type)
    {
    
    	if (type == 'create')
    	 {
    	
    		const emp_name = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
    		const error = 'This record is already Present for the applied date'
    		
    		const frm_dt_VL = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_fromdate' });
    		const frm_date_val = nlapiStringToDate(frm_dt_VL) ;
    		
    		const to_DTVL = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_todate' });
    		const to_date_val  = nlapiStringToDate(to_DTVL) ;
    		
    		if (frm_date_val != '' && frm_date_val != 'undefined' && frm_date_val != null && to_date_val != '' && to_date_val != 'undefined' && to_date_val != null)
    		 {
    			const LAfilters = new Array();
    			const LAcolumns = new Array();
    			
    			LAfilters.push(new nlobjSearchFilter('custrecord_hris_lve_employeename', null, 'is', emp_name))
    			LAfilters.push(new nlobjSearchFilter('custrecord_hris_lve_hrmsapprovalstatus', null, 'noneof', 3 ))
    			LAfilters.push(new nlobjSearchFilter('custrecord_hris_lve_cancel_leavestatus', null, 'noneof', 2 ))
    			LAcolumns.push(new nlobjSearchColumn('custrecord_hris_lve_fromdate'));
    			LAcolumns.push(new nlobjSearchColumn('custrecord_hris_lve_todate'));
    			LAcolumns.push(new nlobjSearchColumn('custrecord_hris_lve_leavetype'));
    			
    			const searchdate = search.create({ type: 'customrecord_hris_leaveapplication', filters: LAfilters, columns: LAcolumns }).run();
    			log.debug({ title: 'searchdate', details: 'searchdate ***********=' + searchdate });
    			
    			
    			if (searchdate != null) 
    			{
    			   for (const i = 0; i < searchdate.length; i++)
    				 {
    				    const present_FRMDATE = searchdate[i].getValue('custrecord_hris_lve_fromdate')
                        const present_frm_dt  = nlapiStringToDate(present_FRMDATE) ;
    					log.debug({ title: 'present_frm_dt', details: 'present_frm_dt ***********=' + present_frm_dt });
    									   
    				    const present_TODT = searchdate[i].getValue('custrecord_hris_lve_todate')
                        const present_to_dt  = nlapiStringToDate(present_TODT) ;
    					
    					log.debug({ title: 'present_to_dt', details: 'present_to_dt ***********=' + present_to_dt });
    						
    						
    					//const leave_type = searchdate[i].getValue('custrecord_hris_lve_leavetype')	
    					const E_leavetype = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_leavetype" });
            			const leave_type  = nlapiLookupField('customrecord_hris_leaveconfig', E_leavetype, 'externalid'); 
    					
    				
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
    		const RECid = (scriptContext.newRecord ? scriptContext.newRecord.id : scriptContext.currentRecord.id);
    		const LoadRec = record.load({ type: 'customrecord_hris_leaveapplication', id: RECid })
    		const Leave_type = LoadRec.getFieldValue('custrecord_hris_lve_leavetype');
    		const Employee = LoadRec.getFieldValue('custrecord_hris_lve_employeename');
    		log.debug({ title: 'Leave_type', details: 'Leave_type*******'+Leave_type });
    		
    	const sequence_value = get_sequence_no(Leave_type);
    	log.debug({ title: 'sequence_value', details: 'sequence_value*******'+sequence_value });
    	
    	 if (sequence_value == 5)
    	 {
    		const status = LoadRec.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
    		log.debug({ title: 'status', details: 'status*******'+status });
    		const cancel_status = LoadRec.getFieldValue('custrecord_hris_lve_cancel_leavestatus');
    		log.debug({ title: 'cancel_status', details: 'cancel_status*******'+cancel_status });
    		if (status != 3)
    		{
    		    const valid_till_date = LoadRec.getFieldValue('custrecord_hris_lve_validtilldate');
    			
    			const filters = new Array();
    			const columns = new Array();
    			filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_valid_till_date', null, 'on', valid_till_date))
    			filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_employee_name', null, 'is', Employee))
    			columns.push(new nlobjSearchColumn('internalid'));
    			const compoff_record_result = search.create({ type: 'customrecord_hris_lve_raise_comp_off', filters: filters, columns: columns }).run();
    			if (compoff_record_result != null) 
    			{
    			    const id = compoff_record_result[0].getValue('internalid')
    				const compoff_record = record.load({ type: 'customrecord_hris_lve_raise_comp_off', id: id })
    				const check_box = compoff_record.getFieldValue('custrecord_hris_rcomp_checked')
    				compoff_record.setFieldValue('custrecord_hris_rcomp_checked', 'T')
    				compoff_record.save();
    			}
    		}
    		
    		if (status == 3)
    		{
    			log.debug({ title: '*******reject******', details: 'into rejected' });
    		    const valid_till_date = LoadRec.getFieldValue('custrecord_hris_lve_validtilldate');
    			log.debug({ title: '*******valid_till_date******', details: 'valid_till_date'+valid_till_date });
    			const filters = new Array();
    			const columns = new Array();
    			filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_valid_till_date', null, 'on',valid_till_date))
                filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_employee_name', null, 'is', Employee))
    		    columns.push(new nlobjSearchColumn('internalid'));
    			const compoff_record_result = search.create({ type: 'customrecord_hris_lve_raise_comp_off', filters: filters, columns: columns }).run();
    			log.debug({ title: '*******compoff_record_result******', details: 'compoff_record_result'+compoff_record_result });
    			if (compoff_record_result != null) 
    			{
    			    const id = compoff_record_result[0].getValue('internalid')
    				log.debug({ title: '*******id******', details: 'id'+id });
    				const compoff_record = record.load({ type: 'customrecord_hris_lve_raise_comp_off', id: id })
    				const check_box = compoff_record.getFieldValue('custrecord_hris_rcomp_checked')
    				log.debug({ title: '*******check_box******', details: 'check_box'+check_box });
    				compoff_record.setFieldValue('custrecord_hris_rcomp_checked', 'F')
    				compoff_record.save();
    			}
    		}
    		if (cancel_status == 2)
    		{
    		    const valid_till_date = LoadRec.getFieldValue('custrecord_hris_lve_validtilldate');
    			
    			const filters = new Array();
    			const columns = new Array();
    			filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_valid_till_date', null, 'on', valid_till_date))
                filters.push(new nlobjSearchFilter('custrecord_hris_rcomp_employee_name', null, 'is', Employee))
    		
    			columns.push(new nlobjSearchColumn('internalid'));
    			const compoff_record_result = search.create({ type: 'customrecord_hris_lve_raise_comp_off', filters: filters, columns: columns }).run();
    			if (compoff_record_result != null) 
    			{
    			    const id = compoff_record_result[0].getValue('internalid')
    				const compoff_record = record.load({ type: 'customrecord_hris_lve_raise_comp_off', id: id })
    				const check_box = compoff_record.getFieldValue('custrecord_hris_rcomp_checked')
    				compoff_record.setFieldValue('custrecord_hris_rcomp_checked', 'F')
    				compoff_record.save();
    			}
    		}
    	}	
    		
    	}
    	
    }	
    function getDatediffIndays(startDate, endDate)
    
    {
       const one_day=1000*60*60*24;
       const fromDate = startDate;
       const toDate=endDate
       log.debug({ title: 'getDatediffIndays', details: 'From Date = '+fromDate+'To Date = '+toDate });
       const x=fromDate.split("/");
       const y=toDate.split("/");
       const date1=new Date(x[2],(x[1]-1),x[0]);
       const date2=new Date(y[2],(y[1]-1),y[0]);
       const month1=x[1];
       const month2=y[1];
       const Diff = Math.ceil((date2.getTime()-date1.getTime())/(one_day));
       log.debug({ title: 'getDatediffIndays', details: 'Date difference Return Value = '+Diff });
       return Diff;
    
    }
    
    
    
    function get_sequence_no(Leave_type)
    	{
    		
    		 log.debug({ title: 'intofunction', details: 'into function leave type'+Leave_type });
    		const LCR = record.load({ type: 'customrecord_hris_leaveconfig', id: Leave_type });
    		
    		const sequence_no = LCR.getFieldValue('custrecord_hris_lvecnfg_seqno')
    		return sequence_no ;
    	}
    {
    
    }

    return {
        beforeLoadRecord: beforeLoadRecord,
        beforeSubmitRecord_record_check: beforeSubmitRecord_record_check,
        afterSubmitRecord_compoff_check: afterSubmitRecord_compoff_check
    };
});
