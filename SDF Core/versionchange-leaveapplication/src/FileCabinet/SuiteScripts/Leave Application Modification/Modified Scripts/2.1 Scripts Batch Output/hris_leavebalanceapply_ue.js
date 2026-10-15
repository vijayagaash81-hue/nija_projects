/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search'], (record, search) => {

    function beforeSubmitRecord_check_balance_value(type)
    {
       
       if (type == 'create')
        {
    		
    	const error = 'Leaves exceeds than leave balance available' ;
    		
    	const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' })
    	log.debug({ title: 'leave_type', details: 'leave_type =' + leave_type });
    	
    	const tot_no_days = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_totalnodays' })
    	log.debug({ title: 'tot_no_days', details: 'tot_no_days =' + tot_no_days });
    	
    	const balance = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavebalance' })
    	log.debug({ title: 'balance', details: 'balance =' + balance });
    	
    	const employee = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' })
    	log.debug({ title: 'employee', details: 'employee =' + employee });
    	
    	 const filters = new Array();
    	 const columns = new Array();
    	 const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' })
    // Add by florence For Unpaid Leave annual
    	 const seq_no_search = get_sequence_no(leave_type)
    	 const seq_no_split = seq_no_search.split('#')
    	 const seq_no = seq_no_split[0];
    	 const negAllowChk = seq_no_split[1];
    	 const maxNegAllow = seq_no_split[2];
    
    	 if (seq_no != 3 && seq_no != 2 && seq_no != 8 && seq_no != 13) {
        filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
        filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
    	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
      
        columns.push(new nlobjSearchColumn('internalid'));
    	columns.push(new nlobjSearchColumn('custrecord_hris_lvbal_total_applied_days'));
    	columns.push(new nlobjSearchColumn('custrecord_hris_lvbal_available_leave_ba'));
    	
    	
    	 const leaveBalanceresults = search.create({ type: 'customrecord_hris_leavebalance', filters: filters, columns: columns }).run();
    	 log.debug({ title: 'leaveBalanceresults', details: 'leaveBalanceresults$$$$$$$$$$$$$ =' + leaveBalanceresults });
    	 
    	 if (leaveBalanceresults != null)
    	 {
            const internal_id = leaveBalanceresults[0].getValue('internalid')
    		log.debug({ title: 'internal_id', details: 'internal_id =' + internal_id });
    		
    		const applied_bal = leaveBalanceresults[0].getValue('custrecord_hris_lvbal_total_applied_days')||0;
    		log.debug({ title: 'applied_bal', details: 'applied_bal =' + applied_bal });
    		
    		const LeaveBALANCE = leaveBalanceresults[0].getValue('custrecord_hris_lvbal_available_leave_ba')
    		log.debug({ title: 'LeaveBALANCE', details: 'LeaveBALANCE =' + LeaveBALANCE });
    		
    		const final_APPLIEDdays = parseFloat(applied_bal) + parseFloat(tot_no_days)
    		log.debug({ title: 'final_APPLIEDdays', details: 'final_APPLIEDdays =' + final_APPLIEDdays });
    		
    		
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
    		
    		const rec_id = (scriptContext.newRecord ? scriptContext.newRecord.id : scriptContext.currentRecord.id);
    		log.debug({ title: 'rec_id :', details: ' rec_id' + rec_id });
    		
    		if (_logValidation(rec_id))
    		 {
    		
    		    log.debug({ title: 'leave_record :', details: ' in......................' });
    			
    			
    			const old_record = nlapiGetOldRecord();
    			log.debug({ title: 'old_record :', details: ' old_record' + old_record });
    			
    			
    	
    			const leave_type = old_record.getFieldValue('custrecord_hris_lve_leavetype')
    			log.debug({ title: 'leave_type :', details: ' leave_type' + leave_type });
    			
    			const employee = old_record.getFieldValue('custrecord_hris_lve_employeename')
    			log.debug({ title: 'employee', details: 'employee =' + employee });
    			
    			const leave_status = old_record.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus')
    			log.debug({ title: 'leave_status :', details: ' leave_status' + leave_status });
    			
    			const tot_no_days = old_record.getFieldValue('custrecord_hris_lve_totalnodays')||0;
    			log.debug({ title: 'tot_no_days', details: 'tot_no_days =' + tot_no_days });
    			
    			const leave_status = old_record.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus')
    			log.debug({ title: 'leave_status :', details: ' leave_status' + leave_status }); 
    			
    			if (leave_status != 3) 
    			{
    				
    				const filters = new Array();
    	            const columns = new Array();
    	 
    			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
    			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
    				filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
    			  
    			    columns.push(new nlobjSearchColumn('internalid'));
    				
    				 const leaveBalanceresults = search.create({ type: 'customrecord_hris_leavebalance', filters: filters, columns: columns }).run();
    				 const total_applied =0;
    				 log.debug({ title: 'total_applied', details: 'total_applied =' + total_applied });
    				 if (leaveBalanceresults != null)
    				 {
    			        const internal_id = leaveBalanceresults[0].getValue('internalid')
    					
    					const load_balance_record = record.load({ type: 'customrecord_hris_leavebalance', id: internal_id })
    					
    					total_applied = load_balance_record.getFieldValue('custrecord_hris_lvbal_total_applied_days')||0;
    					log.debug({ title: 'total_applied', details: 'total_applied =' + total_applied });
    					
    					const final_days = parseFloat(total_applied) - parseFloat(tot_no_days)
    					log.debug({ title: 'final_days', details: 'final_days =' + final_days });
    					
    					load_balance_record.setFieldValue('custrecord_hris_lvbal_total_applied_days',final_days)
    					
    					const balrecid =load_balance_record.save();
    					log.debug({ title: 'balrecid', details: 'balrecid =' + balrecid });
    
    				 }
    			}
    		}
    	}
    
    	log.debug({ title: 'check1', details: '' });
       return true;
    
    }
    
    function afterSubmitRecord_balance_check(type)
    {
       
      if (type == 'create')
       {
       	
    	log.debug({ title: 'into_AfterDUBMIT', details: 'into_AfterDUBMIT' });
    	
    	const leave_type = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavetype' })
    	log.debug({ title: 'leave_type', details: 'leave_type =' + leave_type });
    	
    	const tot_no_days = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_totalnodays' })
    	log.debug({ title: 'tot_no_days', details: 'tot_no_days =' + tot_no_days });
    	
    	const balance = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavebalance' })
    	log.debug({ title: 'balance', details: 'balance =' + balance });
    	
    	const employee = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' })
    	log.debug({ title: 'employee', details: 'employee =' + employee });
    	
    	 const filters = new Array();
    	 const columns = new Array();
    	 
        filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
        filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
    	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
      
        columns.push(new nlobjSearchColumn('internalid'));
    	
    	 const leaveBalanceresults = search.create({ type: 'customrecord_hris_leavebalance', filters: filters, columns: columns }).run();
    	 log.debug({ title: 'leaveBalanceresults', details: 'leaveBalanceresults =' + leaveBalanceresults });
    	 
    	 if (leaveBalanceresults != null)
    	 {
            const internal_id = leaveBalanceresults[0].getValue('internalid')
    		log.debug({ title: 'internal_id', details: 'internal_id =' + internal_id });
    		
    		const load_balance_record = record.load({ type: 'customrecord_hris_leavebalance', id: internal_id })
    		
    		const applied_bal = 0 ;
    		
    		 applied_bal = load_balance_record.getFieldValue('custrecord_hris_lvbal_total_applied_days')||0;
    		log.debug({ title: 'applied_bal', details: 'applied_bal =' + applied_bal });
    		
    		log.debug({ title: 'tot_no_days', details: 'tot_no_days =' + tot_no_days });
    		
    		applied_bal = parseFloat(applied_bal) + parseFloat(tot_no_days) 
    		
    		
    		load_balance_record.setFieldValue('custrecord_hris_lvbal_total_applied_days', applied_bal);
    		
    		load_balance_record.save();
    	 }
    	
     }
    		log.debug({ title: 'type :', details: ' type' + type }); 
    	// florence  for pullback error	
     //  if (type != 'create' || type != 'delete')
       if (type != 'create' && type != 'delete')
    	 {
    	 	
    		const flag = 0 ;
    	 	
    		log.debug({ title: '##################:', details: ' ******************' });
    		
    		const rec_id = (scriptContext.newRecord ? scriptContext.newRecord.id : scriptContext.currentRecord.id);
    		log.debug({ title: 'rec_id :', details: ' rec_id' + rec_id });
    		
    		if (_logValidation(rec_id)) 
    		{
    			
    			const leave_record = record.load({ type: 'customrecord_hris_leaveapplication', id: rec_id });
    		    log.debug({ title: 'leave_record :', details: ' leave_record' + leave_record }); 
    			
    			
    			const leave_type = leave_record.getFieldValue('custrecord_hris_lve_leavetype')
    			log.debug({ title: 'leave_type :', details: ' leave_type' + leave_type }); 
    			
    			const employee = leave_record.getFieldValue('custrecord_hris_lve_employeename')
    	        log.debug({ title: 'employee', details: 'employee =' + employee });
    			
    			const leave_status = leave_record.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus')
    			log.debug({ title: 'leave_status :', details: ' leave_status' + leave_status }); 
    			
    			const leaveCANCEL_status = leave_record.getFieldValue('custrecord_hris_lve_cancel_leavestatus')
    			log.debug({ title: 'leaveCANCEL_status :', details: ' leaveCANCEL_status' + leaveCANCEL_status });
    			
    			const cancelCHECk = leave_record.getFieldValue('custrecord_hris_lve_cancellation')
    			log.debug({ title: 'cancelCHECk :', details: ' cancelCHECk' + cancelCHECk }); 
    			
    			const tot_no_days = leave_record.getFieldValue('custrecord_hris_lve_totalnodays')||0;
    	        log.debug({ title: 'tot_no_days', details: 'tot_no_days =' + tot_no_days });
    			
    			if(leave_status == 2 )
    			{
    				
    				if(cancelCHECk == 'F')
    				{
    					const filters = new Array();
    	            const columns = new Array();
    	 
    			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
    			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
    				filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
    			  
    			    columns.push(new nlobjSearchColumn('internalid'));
    				
    				 const leaveBalanceresults = search.create({ type: 'customrecord_hris_leavebalance', filters: filters, columns: columns }).run();
    				const total_applied=0;
    				 if (leaveBalanceresults != null)
    				 {
    			        const internal_id = leaveBalanceresults[0].getValue('internalid')
    					
    					const load_balance_record = record.load({ type: 'customrecord_hris_leavebalance', id: internal_id })
    					
    					 total_applied = load_balance_record.getFieldValue('custrecord_hris_lvbal_total_applied_days')||0;
    					log.debug({ title: 'total_applied', details: 'total_applied =' + total_applied });
    					
    					const final_days = parseFloat(total_applied) - parseFloat(tot_no_days)
    					log.debug({ title: 'final_days', details: 'final_days =' + final_days });
    					
    					load_balance_record.setFieldValue('custrecord_hris_lvbal_total_applied_days',final_days)
    					
    					load_balance_record.save();
    				 }
    							
    				
    				
    					
    				}
    				
    				
    				
    			}
    			if(leave_status == 3)
    			{
    				if(flag == 0)
    				{
    					
    					log.debug({ title: '**************into reject*************', details: '******************into reject****************' });
    				
    				const filters = new Array();
    	            const columns = new Array();
    	 
    			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_leave_type', null, 'is', leave_type))
    			    filters.push(new nlobjSearchFilter('custrecord_hris_lvbal_employee_name', null, 'is', employee))
    				filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'))
    			  
    			    columns.push(new nlobjSearchColumn('internalid'));
    				
    				 const leaveBalanceresults = search.create({ type: 'customrecord_hris_leavebalance', filters: filters, columns: columns }).run();
    				
    				 if (leaveBalanceresults != null)
    				 {
    			        const internal_id = leaveBalanceresults[0].getValue('internalid')
    					
    					const load_balance_record = record.load({ type: 'customrecord_hris_leavebalance', id: internal_id })
    					
    					const total_applied = load_balance_record.getFieldValue('custrecord_hris_lvbal_total_applied_days')||0;
    					log.debug({ title: 'total_applied', details: 'total_applied =' + total_applied });
    					
    					const final_days = parseFloat(total_applied) - parseFloat(tot_no_days)
    					log.debug({ title: 'final_days', details: 'final_days =' + final_days });
    					
    					load_balance_record.setFieldValue('custrecord_hris_lvbal_total_applied_days',final_days)
    					
    					load_balance_record.save();
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
    
        const filters = new Array();
        const columns = new Array();
    
        filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
        //filters.push(new nlobjSearchFilter('externalid', null, 'is', leave_type))
    
        columns.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_seqno'));
        columns.push(new nlobjSearchColumn('custrecord_hris_lveconfig_allowneglevbal'));
        columns.push(new nlobjSearchColumn('custrecord_hris_lvecfg_maxnegativebal'));
    
        const compoff_record_result = search.create({ type: 'customrecord_hris_leaveconfig', filters: filters, columns: columns }).run();
    
        if (compoff_record_result != null) {
    
            const sequence_no = compoff_record_result[0].getValue('custrecord_hris_lvecnfg_seqno')
            const negAllowChk = compoff_record_result[0].getValue('custrecord_hris_lveconfig_allowneglevbal')
            const maxNegAllow = compoff_record_result[0].getValue('custrecord_hris_lvecfg_maxnegativebal')
    
    
        }
        return sequence_no + "#" + negAllowChk + "#" + maxNegAllow;
    }

    return {
        beforeSubmitRecord_check_balance_value: beforeSubmitRecord_check_balance_value,
        afterSubmitRecord_balance_check: afterSubmitRecord_balance_check
    };
});
