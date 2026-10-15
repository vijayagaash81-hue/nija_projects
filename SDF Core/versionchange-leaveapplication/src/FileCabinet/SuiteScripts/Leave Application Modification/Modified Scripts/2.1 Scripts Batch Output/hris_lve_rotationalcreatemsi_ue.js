/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/runtime'], (record, search, runtime) => {

    function afterSubmitRecord_rotational_msi_creatio(type)
    {
        
    		
    	 try
    	  {
            log.debug({ title: 'type', details: 'type : '+type });
            if (type !== 'delete') {
    		   	// Get current user 
    					  const i_Current_User = runtime.getCurrentUser().id;
    					  //log.debug({ title: 'Before submit record', details: 'i_Current_User : '+i_Current_User });
    					  
    					  //Get record type
    					  const i_recType = (scriptContext.newRecord ? scriptContext.newRecord.type : scriptContext.currentRecord.type);
    					  log.debug({ title: 'after submit record', details: 'i_recType : '+i_recType });
    					  
    					  //Get record ID
    					  const i_recID  = (scriptContext.newRecord ? scriptContext.newRecord.id : scriptContext.currentRecord.id);
    					  log.debug({ title: 'after submit record', details: 'i_recID : '+i_recID });
    					  
                            
    					  // Load record for getting value
    					  const o_recordObj = record.load({ type: i_recType, id: i_recID });					  
    					  const leave_type =   o_recordObj.getFieldValue('custrecord_hris_lve_leavetype');					  
    					  const leave_status = o_recordObj.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
    					   
    					  const cancel_check = o_recordObj.getFieldValue('custrecord_hris_lve_cancellation');
    					  
    					  const i_empID = 	 o_recordObj.getFieldValue('custrecord_hris_lve_employeename');
    					  
    					  const seq_no = get_sequence_no(leave_type);
    					  
    					   const customrecord_hris_leavebalanceSearch = search.create({ type: "customrecord_hris_leavebalance", filters: [
    							   ["custrecord_hris_lvbal_employee_name.internalid", columns: "anyof",i_empID], 
    							   "AND", 
    							   ["custrecord_hris_lvbal_employee_name.isinactive","is","F"], 
    							   "AND", 
    							   ["custrecord_hris_lvbal_leave_type","anyof",leave_type], 
    							   "AND", 
    							   ["custrecord_hris_rt_basic_pay_msi_created","is","F"]
    							], 
    							[
    							   new nlobjSearchColumn("custrecord_hris_lvbal_leave_type" }).run(), 
    							   new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"), 
    							   new nlobjSearchColumn("internalid","custrecord_hris_lvbal_leave_type",null), 
    							   new nlobjSearchColumn("custrecord_hris_lvbal_employee_name"), 
    							   new nlobjSearchColumn("custrecord_hris_lvbal_encashable_days"), 
    							   new nlobjSearchColumn("internalid")
    							]
    							);
    							
    					  
    					 //if((leave_type == 11 || leave_type == 13 || leave_type == 14 || leave_type == 15 ) && leave_status == 1 && cancel_check == 'F' ) 
    					if((seq_no == 6 || seq_no == '6') && leave_status == 2 && cancel_check == 'F' && customrecord_hris_leavebalanceSearch ) 
    					 {
    					  
    						  const leave_banalence_id = customrecord_hris_leavebalanceSearch[0].getId();
    						  
    						  const _load_leave_balance = record.load({ type: 'customrecord_hris_leavebalance', id: leave_banalence_id });
    						  
    						  const leave_bal_credited = _load_leave_balance.getFieldValue('custrecord_hris_lvbal_leave_balance_cred')||0;
    						  
    						  _load_leave_balance.setFieldValue('custrecord_hris_rt_basic_pay_msi_created','T');
    						  
    						  const leave_from_date =    o_recordObj.getFieldValue('custrecord_hris_lve_fromdate');
    						  
    						  leave_from_date = nlapiStringToDate(leave_from_date);
    						  
    						  const leave_get_month = leave_from_date.getMonth() + 1;
    						  const leave_year = leave_from_date.getFullYear();
    						  
    						  const leave_YearId = searchYear(leave_year);
    						  
    						  const to_Date = o_recordObj.getFieldValue('custrecord_hris_lve_todate');
    						  
    						  const leave_type = o_recordObj.getFieldValue('custrecord_hris_lve_leavetypee');
    						  
    						  const no_of_days = leave_bal_credited;//o_recordObj.getFieldValue('custrecord_lms_la_total_no_of_days');
    						  
    						  const expected_resume_date = o_recordObj.getFieldValue('custrecord_hris_lve_expectedresumebackdt');
    						  
    						  expected_resume_date = nlapiStringToDate(expected_resume_date);
    						  
    						  const expected_get_month = expected_resume_date.getMonth() + 1;
    						  const expected_year = expected_resume_date.getFullYear();
    						  
    						  const payGroup = search_paygroup(i_empID);
    						  
    						 const comp_id =  getBasicCompId(payGroup)
    						  
    						
    						const get_wage_date = search_wageperiod(payGroup);
    						const w_Date = get_wage_date.toString().split('#');
    						const end_date = w_Date[0];
    						const start_date = w_Date[1];
    						const mth = nlapiStringToDate(end_date);
    						const get_month = expected_get_month;//mth.getMonth() + 1;
    						const year = expected_year;//mth.getFullYear();
    						 
    						const yearId = searchYear(year);
    						const lastDay  = new Date(expected_resume_date.getFullYear(), expected_resume_date.getMonth() + 1, 0);
    						const pay_Date =  nlapiDateToString(lastDay);				
    						
    
    						const todayDate = new Date();
    						const leave_month = leave_from_date.getMonth() + 1;
    						const leave_year = leave_from_date.getFullYear();
    
    						log.debug({ title: 'leave_month', details: leave_month });
    						log.debug({ title: 'leave_year', details: leave_year });
    
    						const leave_year_id = searchYear(leave_year);
    
    						const arrear_month = leave_month;
    						const current_month = todayDate.getMonth() + 1
    						log.debug({ title: 'current_month', details: current_month });
    
    						
    						const wage_period = get_month;
    						// added by florence to get hris month
    						wage_period = gethrisMonth(wage_period);
    						const wage_year_id = yearId;
    						
    						
    						
    						const baisc_amt = getBasic(payGroup, i_empID);
    						const amount = (baisc_amt /30)  * parseFloat(no_of_days);
    						
    						no_of_days = parseFloat(no_of_days)
    						
    									const filters_i = new Array();
    				
    									const columns_i = new Array(); 
    									
    									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_empname', null, 'is', i_empID ))
    									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_paygroup', null, 'is', payGroup))
    									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_month', null, 'is', wage_period))
    									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_year', null, 'is', wage_year_id))
    									
    									// By Florence Paycomponent field is used
    									//filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_component_name', null, 'is', comp_id))
    									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_paycomponent', null, 'is', comp_id))
    									filters_i.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'))
    									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_msileaverefno', null, 'anyof', i_recID))
    									
    									
    									const searchEmp_i = search.create({ type: 'customrecord_hris_monthlysalinput', filters: filters_i, columns: null }).run();
    									
    									if (!searchEmp_i) // if old record not exists then create new appraisal
    									{
    										log.debug({ title: 'SchedulerFunction', details: 'searchEmp_i IFFFFFFFF : ' });
    										
    										log.debug({ title: 'SchedulerFunction', details: 'searchEmp_i IFFFFFFFF : ' });
    							
    										const rec_create = nlapiCreateRecord('customrecord_hris_monthlysalinput');
    										
    										rec_create.setFieldValue('custrecord_hris_mthsal_empname',i_empID);
    										
    										if(payGroup)
    										rec_create.setFieldValue('custrecord_hris_mthsal_paygroup',payGroup);
    										
    										if(wage_period)
    										rec_create.setFieldValue('custrecord_hris_mthsal_month',wage_period);
    										
    										if(wage_year_id)
    										rec_create.setFieldValue('custrecord_hris_mthsal_year',wage_year_id);
    										
    										// Florence
    										rec_create.setFieldValue('custrecord_hris_mthsal_paycomponent',comp_id);
    										
    										
    										rec_create.setFieldValue('custrecord_hris_mthsal_paydt',pay_Date);
    										
    										if(amount)
    										rec_create.setFieldValue('custrecord_hris_mthsal_salaryamount',amount);
    										
    										if(baisc_amt)
    										rec_create.setFieldValue('custrecord_hris_mthsal_fixedmonthlybasic',baisc_amt);
    									
    										if(no_of_days)
    											rec_create.setFieldValue('custrecord_hris_mthsal_noofrtleavedays',no_of_days);
    									
    										if(i_recID)
    											rec_create.setFieldValue('custrecord_hris_mthsal_msileaverefno',i_recID);
    										
    										rec_create.setFieldValue('custrecord_hris_mthsal_remarks','This Transaction auto is auto created from leave application agaist rotational leave');
    										
    										
    										const rec_submit = rec_create.save();
    										log.debug({ title: 'SchedulerFunction', details: 'rec_submitrec_submit : ' + rec_submit });
    										const bal_submit = _load_leave_balance.save();
    										log.debug({ title: 'SchedulerFunction', details: 'bal_submit : ' + bal_submit });
    										
    									}
    					 }
                          }	
    					  
    					  
    					 
    					  
    					 
     		  
    	  } //END -try
    	  catch(e)//
    	  {
    		  if (e instanceof nlobjError)
    	          log.debug({ title: 'system error', details: e.getCode( }) + '\n'+ e.getDetails());
    	    else
    	          log.debug({ title: 'unexpected error', details: e.toString( }));
    	  }
    		
     	
    
    	return true;
    
    }
    
    
    {
    	function _logValidation(value) //
    	{
    	  if(value!='null' && value != null  && value != '' && value != undefined && value != 'undefined' && value != 'NaN' && value != NaN) 
    	  {
    	   return true;
    	  }
    	  else 
    	  { 
    	   return false;
    	  }
    	}
    
    
    }
    
    
    
    function getLatestRecordId(empid)
    {
    	const rec_id = null;
    
    			const filters = new Array();
    					
    			filters[0] = new nlobjSearchFilter('custrecord1421', null, "anyof", empid);
    					
    					
    			const columns = new Array();
    			
    					columns[0] = new nlobjSearchColumn('internalid').setSort(true);
    					
    					const SearchResult = search.create({ type: 'customrecord_ihr_air_ticket_eligibility', filters: filters, columns: columns }).run();
    					log.debug({ title: 'after submit', details: 'SearchResult.length :'+SearchResult.length });
    					
    					if (_logValidation(SearchResult))//
    					{
    					   rec_id =	SearchResult[0].getValue('internalid', null, null);
    					}
    		return rec_id;			
    }
    
    function remFormatedDate(remainMonth_year, remainMonth_month, lastdayOfEachMonth){
    	            
    	            const date_format = checkDateFormat();
    				const year        = remainMonth_year;
    				const Anvr_month  = remainMonth_month
    				const Anvr_DateVal = lastdayOfEachMonth;
    				
    				if (date_format == 'YYYY-MM-DD')
    		  		{
    		  	 const newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
    		  		}
    		 		 if (date_format == 'DD/MM/YYYY')
    		 		 {
    		  			const newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
    			
    		  		}
    				if (date_format == 'D/M/YYYY')
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
    
    
    function search_paygroup(employee_name)
    {
        const filters = new Array();
        const columns = new Array();
        
        filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_name));
    	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
        columns.push(new nlobjSearchColumn('internalid'));
        columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))
    	    
        columns[0].setSort(true);
        
        const s_result = search.create({ type: 'customrecord_hris_employee_compen_change', filters: filters, columns: columns }).run()
        
        if (s_result != null) 
    	{
            const s_paygroup = s_result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp')      
        }//End of if (s_result != null) 
        return s_paygroup 
    }//End of function search_paygroup(employee_name)
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
    function search_payComponent(paygroup)
    {
        const filters = new Array();
        const columns = new Array();
        
        filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto', 24));
    	filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',paygroup));
    	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
    	
    	
        columns.push(new nlobjSearchColumn('internalid'));
        	    
        columns[0].setSort(true);
        
        const s_result = search.create({ type: 'customrecord_hris_payroll_component', filters: filters, columns: columns }).run()
        
        if (s_result != null) 
    	{
            const s_paycomponent = s_result[0].getValue('internalid')      
        }//End of if (s_result != null) 
        return s_paycomponent 
    }//End of function search_paygroup(employee_name)
    
    
    function getmonth(month)
     {
     	//alert('into function')
    	if( month == 1)
    	{
    		return 'january' ;
    	}
    	if( month == 2)
    	{
    		return 'feb' ;
    	}
    	if( month == 3)
    	{
    		return 'march' ;
    	}
    	if( month == 4)
    	{
    		return 'April' ;
    	}
    	if( month == 5)
    	{
    		return 'May' ;
    	}
    	if( month == 6)
    	{
    		return 'June' ;
    	}
    	if( month == 7)
    	{
    		return 'July' ;
    	}
    	if( month == 8)
    	{
    		return 'August' ;
    	}
    	if( month == 9)
    	{
    		return 'September';
    	}
    	if( month == 10)
    	{
    		return 'October';
    	}
    	if( month == 11)
    	{
    		return 'November';
    	}
    	if( month == 12)
    	{
    		return 'December';
    	}
    	
    	
     }
     function searchmonth(month)
    {
    	//alert('into function')
    	const yearId; 
    	const filters = new Array();
        const columns = new Array();
        filters.push(new nlobjSearchFilter('internalid', null, 'is', month))
    	//columns.push(new nlobjSearchColumn('internalid'));
    	columns.push(new nlobjSearchColumn('name'));
    	const result = search.create({ type: 'customlist_hris_month_list', filters: filters, columns: columns }).run()
    	//alert('result'+result)
    	if (result != null) 
    	{
    	 	month_name = result[0].getValue('name');		
    	}
    	return month_name;
    }
    function search_wageperiod(pay_group)
    {	
    	const Filters = new Array();
    	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_group', null,'is',pay_group));
    	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
    	const Column= new Array();
    	Column.push(new nlobjSearchColumn('internalid'));
    	Column.push(new nlobjSearchColumn('custrecord_hris_end_date'));
    	Column.push(new nlobjSearchColumn('custrecord_hris_start_date'));
    	Column.push(new nlobjSearchColumn('custrecord_hris_month'));
    	Column.push(new nlobjSearchColumn('custrecord_hris_year'));
    	Column.push(Column[0].setSort(true));
    	
    	const searchResult =search.create({ type: 'customrecord_hris_wage_period_details', filters: Filters, columns: Column }).run();
    		
    	if(searchResult !=null)
    	{
    		const WagePeriod_EndDate = searchResult[0].getValue('custrecord_hris_end_date')
    		
    		const start_date = searchResult[0].getValue('custrecord_hris_start_date');
    		
    		const month = searchResult[0].getValue('custrecord_hris_month')
    		
    		const year = searchResult[0].getValue('custrecord_hris_year')
    		
    	}//End of if(searchResult !=null)
    	return WagePeriod_EndDate+"#"+ start_date +"#"+month+"#"+year;
    }//End of function search_wageperiod(pay_group)
    
    function searchYear(year)
    {
    	
    	log.debug({ title: 'after submit record', details: 'searchYear year : '+year });	
    	const yearId; 
    	const filters = new Array();
        const columns = new Array();
        filters.push(new nlobjSearchFilter('name', null, 'contains', year))
    	columns.push(new nlobjSearchColumn('internalid'));
    	columns.push(new nlobjSearchColumn('name'));
    	const result = search.create({ type: 'customlist_hris_year_master', filters: filters, columns: columns }).run()
    	if (result != null) 
    	{
    	 	yearId = result[0].getValue('internalid');	
    		log.debug({ title: 'after submit record', details: 'searchYear yearIdyearId : '+yearId });			
    	}
    	return yearId;
    }
    //Function to search employee's wage period end date
    
    
    function getCompanyCurrentDateTime(){
        const currentDateTime = new Date();
        const companyTimeZone = nlapiLoadConfiguration('companyinformation').getFieldText('timezone');
        const timeZoneOffSet = (companyTimeZone.indexOf('(GMT)') == 0) ? 0 : new Number(companyTimeZone.substr(4, 6).replace(/\+|:00/gi, '').replace(/:30/gi, '.5'));
        const UTC = currentDateTime.getTime() + (currentDateTime.getTimezoneOffset() * 60000);
        const companyDateTime = UTC + (timeZoneOffSet * 60 * 60 * 1000);
        
        return new Date(companyDateTime);
    }
    // END FUNCTION =====================================================
    
    
    function searchYear(year) {
        const yearVal = '';
        year = year.toString();
        log.debug({ title: 'Year in searchYear function', details: year });
        const filter = [];
        filter.push(new nlobjSearchFilter('name', null, 'contains', year));
        filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    
        const column = [];
        column.push(new nlobjSearchColumn('internalid'));
    
        const search = search.create({ type: 'customlist_hris_year_master', filters: filter, columns: column }).run();
        if (search) {
            yearVal = search[0].getValue('internalid')
        }
        log.debug({ title: 'yearVal in SearchYear  Func', details: yearVal });
        return yearVal;
    }
    
    
    
    function getBasic(pay_group, emp_id) {
        const salAmt = 0.00;
        const filter = [];
        const column = [];
        filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
        filter.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'anyof', pay_group));
       // filter.push(new nlobjSearchFilter('custrecord_apm_pc_consider_for_encash', null, 'is', 'T'));
        filter.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto', '1'));
    
    
        column.push(new nlobjSearchColumn('internalid'));
    
        const pay_comp_search = search.create({ type: 'customrecord_hris_payroll_component', filters: filter, columns: column }).run();
        //log.debug({ title: 'pay_comp_search length', details: pay_comp_search.length })
        if (pay_comp_search != null) {
            for (const i = 0; i < pay_comp_search.length; i++) {
    
                const comp_id = pay_comp_search[i].getValue('internalid');
    
                log.debug({ title: 'pay_comp_search comp_id', details: comp_id })
    
                const edc_search = search.create({ type: "customrecord_hris_employee_compen_change", filters: [
                        ["custrecord_hris_empchange_employee_nam", columns: "anyof", emp_id],
                        "AND",
                        ["custrecord_hris_employee_data_change.custrecord_hris_cde_payroll_component", "anyof", comp_id]
    
                    ],
                    [
                        new nlobjSearchColumn("custrecord_hris_empchange_employee_nam" }).run(),
                        new nlobjSearchColumn("custrecord_hris_cde_monthly", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null),
                        new nlobjSearchColumn("custrecord_hris_cde_process_group", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null),
                        new nlobjSearchColumn("internalid", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null)
                    ]
                );
                //log.debug({ title: 'edc_search length', details: edc_search.length })
                if (edc_search != null) {
                    for (const j = 0; j < edc_search.length; j++) {
                        const payGrp_Comp_Detail = edc_search[j].getValue("custrecord_hris_cde_monthly", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null);
                        const comp_value = edc_search[j].getValue("custrecord_hris_cde_process_group", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null);
    
    
                        log.debug({ title: 'comp_value', details: comp_value })
                        log.debug({ title: 'payGrp_Comp_Detail', details: payGrp_Comp_Detail })
                        salAmt = parseFloat(salAmt) + parseFloat(payGrp_Comp_Detail);
    
    
    
                    }
                }
            }
        }
    
        return salAmt;
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
    
    
    function getBasicCompId(id)
    {
    	const customrecord_hris_payroll_componentSearch = search.create({ type: "customrecord_hris_payroll_component", filters: [
    		   ["custrecord_hris_pay_process_group", columns: "anyof",id],
    		   "AND",
    		   ["custrecord_hris__sequence_no_","equalto","19"]
    		], 
    		[
    		   new nlobjSearchColumn("internalid" }).run(), 
    		   new nlobjSearchColumn("custrecord_hris_component_short_name").setSort(false),
    		   new nlobjSearchColumn("custrecord_hris__sequence_no_")
    		]
    		);
    
    		if(customrecord_hris_payroll_componentSearch)
    		{
    			const id = customrecord_hris_payroll_componentSearch[0].getId();
    
    		}
    		
    	return id;	
    }

    return {
        afterSubmitRecord_rotational_msi_creatio: afterSubmitRecord_rotational_msi_creatio
    };
});
