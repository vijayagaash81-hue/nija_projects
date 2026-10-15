/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/runtime'], (record, search, runtime) => {

    
    
    function UES_Monthly_salary_entry(type)
    {
    	
    
    	if (type != 'delete') 
    	{
    		
    		const recordId = (scriptContext.newRecord ? scriptContext.newRecord.id : scriptContext.currentRecord.id)
    		log.debug({ title: 'recordId', details: recordId })
    		const o_leaveApp = record.load({ type: 'customrecord_hris_leaveapplication', id: recordId })
    		
    		const emp_Id = o_leaveApp.getFieldValue('custrecord_hris_lve_employeename')
    		log.debug({ title: 'WFH ', details: 'emp_Id --> '+ emp_Id })
    		
    		const Leave_type = o_leaveApp.getFieldValue('custrecord_hris_lve_leavetype')
    		log.debug({ title: 'WFH ', details: 'Leave_type --> '+ Leave_type })
    		
    		
    		//const leaveTypeRecord = record.load({ type: 'customrecord_hris_leaveconfig', id: Leave_type });
    		const leaveRefNo = o_leaveApp.getFieldValue('name');
    		const LeaveApplication_Status = o_leaveApp.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
    		 log.debug({ title: 'WFH ', details: 'LeaveApplication_Status --> '+ LeaveApplication_Status })
    		 
    		const leaveCancelStatus = o_leaveApp.getFieldValue('custrecord_hris_lve_cancel_leavestatus');
    		 
    		const cancel_check = o_leaveApp.getFieldValue('custrecord_hris_lve_cancellation');
    		
    		const salAmt = o_leaveApp.getFieldValue('custrecord_hris_lve_airticketamount');
    		
    	//	const airTicketChk = o_leaveApp.getFieldValue('custrecord_hris_lve_airticketapplicable');
    		
    		const airTicketChk = o_leaveApp.getFieldValue('custrecord_hris_lve_airticketrequired');
    		log.debug({ title: 'LeaveApplication_Status', details: LeaveApplication_Status })
    		log.debug({ title: 'cancel_check', details: cancel_check })
    		log.debug({ title: 'airTicketChk', details: airTicketChk })
    		const seq_no = get_sequence_no(Leave_type)
    		if(airTicketChk == 'T' && cancel_check=='F' && LeaveApplication_Status=='2')
    		{
    			
    		const fromDate = o_leaveApp.getFieldValue('custrecord_hris_lve_fromdate');
    		log.debug({ title: 'Integration fromDate', details: fromDate });
    		    fromDate = nlapiStringToDate(fromDate)
    		const search_pay_grp = get_paygroup(emp_Id);
    		const payComp = searchPayComp(search_pay_grp)
    		
    		
    			fromDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0);
                const lastDayDate_frmDate = fromDate.getDate();
                const lastDayMonth_frmDate = fromDate.getMonth()+1;
                const lastDayYear_frmDate = fromDate.getFullYear();
    			
    			const finalDate_toDate = remFormatedDate(lastDayYear_frmDate, lastDayMonth_frmDate, lastDayDate_frmDate)
    			log.debug({ title: 'Integration finalDate_toDate', details: finalDate_toDate })
    		    log.debug({ title: 'payComp', details: payComp })
    			
    			const year = lastDayYear_frmDate;	
    					    year = year.toString();
    					const YearId = searchYear(year);
    					
    			const filter = [];
    			const column = [];
    			
    			//filter.push(new nlobjSearchFilter('custrecord_apm_pc_pay_pro_grp', null, 'anyof', search_pay_grp));
    			filter.push(new nlobjSearchFilter('custrecord_hris_mthsal_empname', null, 'is', emp_Id));
    			filter.push(new nlobjSearchFilter('custrecord_hris_mthsal_year', null, 'is', YearId));
    			//filter.push(new nlobjSearchFilter('custrecord_hris_mthsal_month', null, 'is', lastDayMonth_frmDate));
    			filter.push(new nlobjSearchFilter('custrecord_hris_mthsal_paycomponent', null, 'is', payComp));
              filter.push(new nlobjSearchFilter('custrecord_hris_mthsal_msileaverefno', null, 'anyof', recordId));
    			filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    			
    			const search = search.create({ type: 'customrecord_hris_monthlysalinput', filters: filter, columns: column }).run()
    			if(search == null)
    			{
    				const msi_rec = nlapiCreateRecord('customrecord_hris_monthlysalinput');
    			msi_rec.setFieldValue('custrecord_hris_mthsal_empname', emp_Id)
    			//msi_rec.setFieldValue('custrecord_hris_mthsal_paygroup', search_pay_grp)
    			    msi_rec.setFieldValue('custrecord_hris_mthsal_paygroup', search_pay_grp)
    				msi_rec.setFieldValue('custrecord_hris_mthsal_paydt', finalDate_toDate)
    				// Added by florence for getting month
    				lastDayMonth_frmDate = gethrisMonth(lastDayMonth_frmDate);
    				msi_rec.setFieldValue('custrecord_hris_mthsal_month', lastDayMonth_frmDate)
    				msi_rec.setFieldValue('custrecord_hris_mthsal_year', YearId)
    				
    				msi_rec.setFieldValue('custrecord_hris_mthsal_paycomponent', payComp)
    				msi_rec.setFieldValue('custrecord_hris_mthsal_salaryamount', salAmt)
    				msi_rec.setFieldValue('custrecord_hris_mthsal_year', YearId)
    				msi_rec.setFieldValue('custrecord_hris_mthsal_msileaverefno', recordId);
    				
    			const id = msi_rec.save();
    			log.debug({ title: 'created id', details: id });
    			}
    			
    			
    			
    			
    		}
    		
    
    	}//End if (type == 'create' || type == 'edit') 
    //}// End function LMS_LeaveBalanceDebitCredit_AfterSubmit(type)
    }
    function gethrisMonth(monthParameter) {
        if (monthParameter == 1) {
            return '1';
        } else if (monthParameter == 2) {
            return '2';
        } else if (monthParameter == 3) {
            return '3';
        } else if (monthParameter == 4) {
            return '4';
        } else if (monthParameter == 5) {
            return '5';
        } else if (monthParameter == 6) {
            return '6';
        } else if (monthParameter == 7) {
            return '7';
        } else if (monthParameter == 8) {
            return '8';
        } else if (monthParameter == 9) {
            return '9';
        } else if (monthParameter == 10) {
            return '10';
        } else if (monthParameter == 11) {
            return '11';
        } else if (monthParameter == 12) {
            return '12';
        }
    } 
    
    
    function searchYear(year)
    {
    	const yearVal = '';
    	year = year.toString();
    	log.debug({ title: 'Year in searchYear function', details: year });
    	const filter = [];
        filter.push(new nlobjSearchFilter('name', null, 'contains', year));
        filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
        
        const column = [];
        column.push(new nlobjSearchColumn('internalid'));
        
        const search = search.create({ type: 'customlist_hris_year_master', filters: filter, columns: column }).run();
      if(search){
    	  yearVal = search[0].getValue('internalid')
      }
      log.debug({ title: 'yearVal in SearchYear  Func', details: yearVal });
        return yearVal;  
    }
    
    
    
    
    function get_sequence_no(leave_type)
    {
    	const sequence_no =''
    	const filters = new Array();
    	const columns = new Array();
    	
    	filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
    	
    	columns.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_seqno'));
    	
    	const compoff_record_result = search.create({ type: 'customrecord_hris_leaveconfig', filters: filters, columns: columns }).run();
    	
    	if (compoff_record_result != null) 
    	{
    	
    		sequence_no = compoff_record_result[0].getValue('custrecord_hris_lvecnfg_seqno')
    		
    	 log.debug({ title: 'WFH ', details: 'sequence_no --> '+ sequence_no })	
    	}
    	return sequence_no ;
    } // end of function get_sequence_no(leave_type)
    
    
    function get_paygroup(employee_id)
    {   
        const filters = new Array();
        const columns = new Array();
        filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_id));
    	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
        columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))
        
        const result = search.create({ type: 'customrecord_hris_employee_compen_change', filters: filters, columns: columns }).run()
        
        if (result != null) 
    	{
            const paygroup = result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp') 
        }//End of if (result != null)
        return paygroup;
    }//End of function get_paygroup(employee_id)
    
    
    
    
    function searchPayComp(i_paygroup_earn)
    {
    	const PTID;
    	const Filters = new Array();
    	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_paygroup_earn));
    	Filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto',36));
    	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
    	const column = new Array();
    	column.push(new nlobjSearchColumn('internalid'));	
    	const searchPTCheck= search.create({ type: 'customrecord_hris_payroll_component', filters: Filters, columns: column }).run();		
    	if(searchPTCheck !=null)
    	{
    		PTID = searchPTCheck[0].getValue('internalid');	
    	}//End if(searchNetCheck !=null)
    	return PTID;
    }//searchPTId(i_paygroup_earn)
    
    
    
    
      function remFormatedDate(remainMonth_year, remainMonth_month, lastdayOfEachMonth){
    	            
    	            const date_format = checkDateFormat();
    				const year        = remainMonth_year;
    				const Anvr_month  = remainMonth_month
    				const Anvr_DateVal = lastdayOfEachMonth;
    				
    				if (date_format == 'YYYY-MM-DD')
    		  		{
    		  	 const newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
    		  		}
    		 		 if (date_format == 'DD/MM/YYYY' || date_format == 'D/M/YYYY')
    		 		 {
    		  			const newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
    			
    		  		}
    		  		if (date_format == 'MM/DD/YYYY')
    		  		{
    		  			const newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
    		   		}
    				if (date_format == 'M/D/YYYY')
    		  		{
    		  			const newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
    		   		}
    				
    				if (date_format == 'DD-MM-YYYY')
    		  		{
    		  			const newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
    		   		}
    				
    				if (date_format == 'DD-Mon-YYYY')
    		  		{
    		  			const newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
    		   		}
    				
    				if (date_format == 'DD.MM.YYYY')
    		  		{
    		  			const newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
    		   		}
    				if (date_format == 'DD-Month-YYYY')
    		  		{
    		  			const newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
    		   		}
    				if (date_format == 'YYYY/MM/DD')
    		  		{
    		  	 const newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
    		  		}
    				
    				if (date_format == 'DD MONTH, YYYY')
    		  		{
    					
    		  	 const newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;
    			 
    		  		}
    				
    			return newDate;
    				
    }
    
    
    
     function checkDateFormat()
    {
        const context = runtime;
    
        const dateFormatPref = context.getPreference('dateformat');
    
        return dateFormatPref;
    }

    return {
        LMS_LeaveBalanceDebitCredit_AfterSubmit: LMS_LeaveBalanceDebitCredit_AfterSubmit
    };
});
