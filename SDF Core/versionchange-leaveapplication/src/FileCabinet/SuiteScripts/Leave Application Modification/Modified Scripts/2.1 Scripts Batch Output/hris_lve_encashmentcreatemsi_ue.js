/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/runtime'], (record, search, runtime) => {

    
    
    
    
    function afterSubmitRecord_encasment_msi_creatio(type)
    {
        
    		
    	 try
    	  {
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
    					  
    					  const appliy_encashment =   o_recordObj.getFieldValue('custrecord_hris_lve_applylveencashment');
    					  
    					  const leave_status =   o_recordObj.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
    							
    					  const omani_nonOmani = o_recordObj.getFieldValue('custrecord_hris_lve_nation_omani_non');
    					 
    					if(appliy_encashment == 'T' && leave_status == '2' && cancel_check == 'F') //Cancel check added as after final approval of cancellation MSI was getting created-------Sumant Kumar----19/03/2021
    					 {
    					  
    						 
    						  
    						  const leave_from_date =  o_recordObj.getFieldValue('custrecord_hris_lve_fromdate');
    						  
    						  leave_from_date = nlapiStringToDate(leave_from_date);
    						  
    						  const leave_get_month = leave_from_date.getMonth() + 1;
    						  const leave_year = leave_from_date.getFullYear();
    						  
    						  const leave_YearId = searchYear(leave_year);
    						  
    						  const to_Date = o_recordObj.getFieldValue('custrecord_hris_lve_todate');
    						  
    						  const leave_type = o_recordObj.getFieldValue('custrecord_hris_lve_leavetype');
    						  
    						  const no_of_encash_days = o_recordObj.getFieldValue('custrecord_hris_lve_noofencashmentdays');
    						  
    						  
    						  const payGroup = search_paygroup(i_empID);
    						  
    						  const encash_internal_id = getEncashCompId(payGroup);
    						  log.debug({ title: 'encash_internal_id', details: encash_internal_id });
    						  
    						const todayDate = new Date('03/25/2020');
    						const current_month = todayDate.getMonth() + 1
    						
    						const get_wage_date = search_wageperiod(payGroup);
    						const w_Date = get_wage_date.toString().split('#');
    						const end_date = w_Date[0];
    						const start_date = w_Date[1];
    						const mth = nlapiStringToDate(end_date);
    						const get_month = leave_get_month;//mth.getMonth() + 1;
    						const year = leave_year;//mth.getFullYear();
    						 
    						const yearId = searchYear(year);
    						const lastDay  = new Date(leave_from_date.getFullYear(), leave_from_date.getMonth() + 1, 0);
    						const pay_Date =  nlapiDateToString(lastDay);				
    						
    						
    						
    						log.debug({ title: 'pay_Date', details: pay_Date });
    						
    						const wage_period = get_month ;
    
    						// added by florence for hris month
    						wage_period=gethrisMonth(wage_period);
    						
    						const wage_year_id = yearId ;
    						
    						
    						
    						const leave_balance = getLeaveBanlce(i_empID,leave_type);
    						log.debug({ title: 'leave_balance', details: leave_balance });
    						
    						const DENOMINATOR_CONSIDERED_configSearch = search.create({ type: "customrecord_hris_leaveconfig", filters: [
    						   ["internalidnumber", columns: "equalto",leave_type]
    						], 
    						[
    						   new nlobjSearchColumn("custrecord_hris_lveconfig_lveencashcal" }).run()
    						]
    						);
    						
    						const denominator = 0;
    						if(DENOMINATOR_CONSIDERED_configSearch)
    						{
    							denominator = DENOMINATOR_CONSIDERED_configSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lveconfig_lveencashcal"));
    						}
    						
    						if(!denominator)
    						{
    							denominator = 0;
    						}
    						
    						const Encash_amt_all_comps = getEncashAmount(i_empID,payGroup,encash_internal_id,omani_nonOmani);
    						log.debug({ title: 'Encash_amt_all_comps', details: Encash_amt_all_comps });
    
    						log.debug({ title: 'Denominator', details: denominator });
    						log.debug({ title: 'no_of_encash_days', details: no_of_encash_days });
    						const amount = (Encash_amt_all_comps /parseFloat(denominator))  * parseFloat(no_of_encash_days);
    						log.debug({ title: 'amount', details: amount });
    						
    						no_of_encash_days = parseFloat(no_of_encash_days);
    						
    									const filters_i = new Array();
    				
    									const columns_i = new Array(); 
    									
    									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_empname', null, 'is', i_empID ))
    									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_paygroup', null, 'is', payGroup))
    									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_month', null, 'is', wage_period))
    									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_year', null, 'is', wage_year_id))
    									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_paycomponent', null, 'is', encash_internal_id))
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
    										
    										
    										rec_create.setFieldValue('custrecord_hris_mthsal_paycomponent',encash_internal_id);
    										
    										//if(leave_balance)
    										//	rec_create.setFieldValue('custrecord_apm_msi_annualavailablebal',leave_balance);
    										
    										rec_create.setFieldValue('custrecord_hris_mthsal_leave_encashment',denominator);
    										
    										rec_create.setFieldValue('custrecord_hris_mthsal_paydt',pay_Date);
    										
    										if(amount)
    										rec_create.setFieldValue('custrecord_hris_mthsal_salaryamount',amount);
    									
    										if(no_of_encash_days)
    											rec_create.setFieldValue('custrecord_hris_mthsal_no_of_encashable',no_of_encash_days);
    									
    										if(i_recID)
    											rec_create.setFieldValue('custrecord_hris_mthsal_msileaverefno',i_recID);
    										
    										rec_create.setFieldValue('custrecord_hris_mthsal_remarks','This entry is auto created from Leave Application against Leave Encashment');
    										
    										
    										const rec_submit = rec_create.save();
    										log.debug({ title: 'SchedulerFunction', details: 'rec_submitrec_submit : ' + rec_submit });
    										
    										
    									}
    					 }
    						
    					  
    					  
    					 
    					  
    					 
     		  
    	  } 
    	  catch(e)
    	  {
    		  if (e instanceof nlobjError)
    	          log.debug({ title: 'system error', details: e.getCode( }) + '\n'+ e.getDetails());
    	    else
    	          log.debug({ title: 'unexpected error', details: e.toString( }));
    	  }
    		
    	
    
    	return true;
    
    }
    
    
    {
    	function _logValidation(value) 
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
    // END FUNCTION =====================================================
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
       // filter.push(new nlobjSearchFilter('custrecord_hris_consider_for_encashment', null, 'is', 'T'));
        filter.push(new nlobjSearchFilter('internalid', null, 'is', 1));
    
    
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
    
    
    
    
    
    
    function getEncashAmount(empName,processGrp,encash_internal_id){
    	    
        const compType = encash_internal_id;
         
       
        const salAmt = 0.00;
        
        const filter3 = [];
        filter3.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'anyof', processGrp));
        filter3.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null,'equalto', 40));
        
        const column3 = [];
        column3.push(new nlobjSearchColumn('internalid'))
        const search_comp = search.create({ type: 'customrecord_hris_payroll_component', filters: filter3, columns: column3 }).run()
        if(search_comp){
            const comp_intID = search_comp[0].getValue('internalid');
            
            if(compType == comp_intID){
            log.debug({ title: 'inside LeaveType condition', details: '' })
            const filter = [];
            const column = [];
            filter.push(new nlobjSearchFilter('isinactive',null, 'is', 'F'));
            filter.push(new nlobjSearchFilter('custrecord_hris_pay_process_group',null, 'anyof', processGrp));
            filter.push(new nlobjSearchFilter('custrecord_hris_consider_for_encashment', null, 'is', 'T'));
            
            column.push(new nlobjSearchColumn('internalid'));
            
            const pay_comp_search = search.create({ type: 'customrecord_hris_payroll_component', filters: filter, columns: column }).run();
           // log.debug({ title: 'pay_comp_search length', details: pay_comp_search.length })
            if(pay_comp_search!= null){
                for(const i = 0; i < pay_comp_search.length; i++){
                    
                 const comp_id = pay_comp_search[i].getValue('internalid');
                 
                 const edc_search = search.create({ type: "customrecord_hris_employee_compen_change", filters: [
                       ["custrecord_hris_empchange_employee_nam", columns: "anyof", empName],
                       "AND", 
                       ["custrecord_hris_employee_data_change.custrecord_hris_cde_payroll_component","anyof",comp_id]					  
                       
                    ], 
                    [
                       new nlobjSearchColumn("custrecord_hris_empchange_employee_nam" }).run(), 
                       new nlobjSearchColumn("custrecord_hris_cde_monthly","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null), 
                       new nlobjSearchColumn("custrecord_hris_cde_process_group","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null), 
                       new nlobjSearchColumn("internalid","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null)
                    ]
                    );
                 //log.debug({ title: 'edc_search length', details: edc_search.length })
                  if(edc_search!=null){
                      for(const j=0; j < edc_search.length; j++){
                          const payGrp_Comp_Detail = edc_search[j].getValue("custrecord_hris_cde_monthly","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null);
                          const comp_value = edc_search[j].getValue("custrecord_hris_cde_process_group","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null);
                          
                             
                              log.debug({ title: 'comp_value', details: comp_value })
                              log.debug({ title: 'payGrp_Comp_Detail', details: payGrp_Comp_Detail })
                              salAmt = parseFloat(salAmt) + parseFloat(payGrp_Comp_Detail);
                          
                          
                          
                      }
                  }
              }
                
                
           }
          salAmt = salAmt.toFixed(3)
       
       }//if(leaveType== 22)
     }
        
     return   salAmt; 
        
    }//if(name== 'custrecord_apm_msi_noofencashabledays')
           
    function getLeaveBanlce(employee,leave_type)
    {
    	const bal = 0.00;  
    	const customrecord_hris_leavebalanceSearch = search.create({ type: "customrecord_hris_leavebalance", filters: [
    	   ["custrecord_hris_lvbal_employee_name", columns: "anyof",employee], 
    	   "AND", 
    	   ["custrecord_hris_lvbal_leave_type","anyof",leave_type]
    	], 
    	[
    	   new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba" }).run(), 
    	   new nlobjSearchColumn("custrecord_hris_lvbal_encashable_days")
    	]
    	);
    	if(customrecord_hris_leavebalanceSearch)
    	{
    		const annual = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"));
    		const encash = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lvbal_encashable_days"));
    		
    		if(!annual)
    			annual = 0;
    		
    		
    		if(!encash)
    			encash = 0;
    		
    		bal = parseFloat(annual) + parseFloat(encash)
    	}
    	
    	return bal;
    }	  
     
    
    function formatedDate(end_date) {
    
        const date_format = checkDateFormat();
        const endDate = nlapiStringToDate(end_date);
        const year = endDate.getFullYear();
        log.debug({ title: 'formated year', details: year })
        const Anvr_month = endDate.getMonth() + 1;
        log.debug({ title: 'formated Anvr_month', details: Anvr_month })
        const Anvr_DateVal = endDate.getDate();
        log.debug({ title: 'formated Anvr_DateVal', details: Anvr_DateVal })
    
        if (date_format == 'YYYY-MM-DD') {
            const newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
        }
        if (date_format == 'DD/MM/YYYY') {
            const newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
    
        }
        if (date_format == 'D/M/YYYY') {
            const newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
    
        }
        if (date_format == 'MM/DD/YYYY') {
            const newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
        }
        if (date_format == 'M/D/YYYY') {
            const newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
        }
    
        if (date_format == 'DD-MM-YYYY') {
            const newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
    
        if (date_format == 'DD-Mon-YYYY') {
            const newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
    
        if (date_format == 'DD.MM.YYYY') {
            const newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
        }
        if (date_format == 'DD-Month-YYYY') {
            const newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
        }
        if (date_format == 'YYYY/MM/DD') {
            const newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
        }
    
        if (date_format == 'DD MONTH, YYYY') {
    
            const newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;
    
        }
        log.debug({ title: 'formated newDate', details: newDate });
        return newDate;
    
    }
    
    function checkDateFormat() {
        const context = runtime;
    
        const dateFormatPref = context.getPreference('dateformat');
    
        return dateFormatPref;
    }
    
    function getEncashCompId(id)
    {
    	const customrecord_hris_payroll_componentSearch = search.create({ type: "customrecord_hris_payroll_component", filters: [
    		   ["custrecord_hris_pay_process_group", columns: "anyof",id],
    		   "AND",
    		   ["custrecord_hris__sequence_no_","equalto","40"]
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
        afterSubmitRecord_encasment_msi_creatio: afterSubmitRecord_encasment_msi_creatio
    };
});
