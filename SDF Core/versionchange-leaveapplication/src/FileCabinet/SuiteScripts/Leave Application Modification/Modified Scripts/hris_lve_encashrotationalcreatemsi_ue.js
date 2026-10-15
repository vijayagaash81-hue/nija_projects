



function afterSubmitRecord_encasment_msi_creatio(type)
{
    
		
	 try
	  {
        if (type !== 'delete') {
		   	// Get current user 
					  var i_Current_User = nlapiGetUser();
					  //nlapiLogExecution('DEBUG', 'Before submit record', 'i_Current_User : '+i_Current_User);
					  
					  //Get record type
					  var i_recType = nlapiGetRecordType();
					  nlapiLogExecution('DEBUG', 'after submit record', 'i_recType : '+i_recType);
					  
					  //Get record ID
					  var i_recID  = nlapiGetRecordId();
					  nlapiLogExecution('DEBUG', 'after submit record', 'i_recID : '+i_recID);
					  
					  // Load record for getting value
					  var o_recordObj = nlapiLoadRecord(i_recType, i_recID);
					  
					  var leave_type =   o_recordObj.getFieldValue('custrecord_hris_lve_leavetype');
					  
					  var leave_status = o_recordObj.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
					   
					  var cancel_check = o_recordObj.getFieldValue('custrecord_hris_lve_cancellation');
					  
					  var i_empID = 	 o_recordObj.getFieldValue('custrecord_hris_lve_employeename');
					  
					  var seq_no = get_sequence_no(leave_type);
					  
					  var appliy_encashment =   o_recordObj.getFieldValue('custrecord_hris_lve_applylveencashment');
					  
					  var leave_status =   o_recordObj.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
					  
					  var leave_balance =   o_recordObj.getFieldValue('custrecord_hris_lve_leavebalance');
							
					  
       
					if(seq_no == '24' && leave_status == '2' ) 
					 {
					  
						 
						  
						  var leave_from_date =  o_recordObj.getFieldValue('custrecord_hris_lve_expectedresumebackdt');// changed FROM DATE to expected work resum date. earliear it was Leave From date. just changed the ID variables remains same // 13-08-2020
						  
						  leave_from_date = nlapiStringToDate(leave_from_date);
						  
						  var leave_get_month = leave_from_date.getMonth() + 1;
						  var leave_year = leave_from_date.getFullYear();
						  
						  var leave_YearId = searchYear(leave_year);
						  
						  var to_Date = o_recordObj.getFieldValue('custrecord_hris_lve_todate');
						  
						  var leave_type = o_recordObj.getFieldValue('custrecord_hris_lve_leavetype');
						  
						  var no_of_encash_days = o_recordObj.getFieldValue('custrecord_hris_lve_noofencashmentdays');
						  
						  
						  var payGroup = search_paygroup(i_empID);
						  
						  var encash_internal_id = getEncashCompId(payGroup);
						  nlapiLogExecution('Debug','encash_internal_id',encash_internal_id);
						  
						var todayDate = new Date();
						var current_month = todayDate.getMonth() + 1
						
						var get_wage_date = search_wageperiod(payGroup);
						var w_Date = get_wage_date.toString().split('#');
						var end_date = w_Date[0];
						var start_date = w_Date[1];
						var mth = nlapiStringToDate(end_date);
						var get_month = leave_get_month;//mth.getMonth() + 1;
						var year = leave_year;//mth.getFullYear();
						 
						var yearId = searchYear(year);
						var lastDay  = new Date(leave_from_date.getFullYear(), leave_from_date.getMonth() + 1, 0);
						var pay_Date =  nlapiDateToString(lastDay);			
											
						
						nlapiLogExecution('Debug','pay_Date',pay_Date);
						
						var wage_period = get_month ;
						// added by florence to get hris month
						wage_period=gethrisMonth(wage_period);
						var wage_year_id = yearId ;
						
						
											
						
						 var customrecord_hris_leavebalanceSearch = nlapiSearchRecord("customrecord_hris_leavebalance",null,
							[
							   
                               ["custrecord_hris_lvbal_employee_name.internalid","anyof",i_empID], 
							   "AND", 
							   ["custrecord_hris_lvbal_employee_name.isinactive","is","F"], 
							   "AND", 
							   ["custrecord_hris_lvbal_leave_type","anyof",leave_type], 
							   "AND", 
							   ["custrecord_hris_rt_basic_pay_msi_created","is","F"]
							], 
							[
							    new nlobjSearchColumn("custrecord_hris_lvbal_leave_type"), 
							   new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"), 
							   new nlobjSearchColumn("internalid","custrecord_hris_lvbal_leave_type",null), 
							   new nlobjSearchColumn("custrecord_hris_lvbal_employee_name"), 
							   new nlobjSearchColumn("custrecord_hris_lvbal_encashable_days"), 
							   new nlobjSearchColumn("internalid")
							]
							);
							
						if(customrecord_hris_leavebalanceSearch)
						{
							 var leave_banalence_id = customrecord_hris_leavebalanceSearch[0].getId();
							 var _load_leave_balance = nlapiLoadRecord('customrecord_hris_leavebalance',leave_banalence_id);
							 _load_leave_balance.setFieldValue('custrecord_hris_lvbal_encashment_msi','T');
						}							
						
						var DENOMINATOR_CONSIDERED_configSearch = nlapiSearchRecord("customrecord_hris_leaveconfig",null,
						[
						   ["internalidnumber","equalto",leave_type]
						], 
						[
						   new nlobjSearchColumn("custrecord_hris_lveconfig_lveencashcal")
						]
						);
						
						var denominator = 0;
						if(DENOMINATOR_CONSIDERED_configSearch)
						{
							denominator = DENOMINATOR_CONSIDERED_configSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lveconfig_lveencashcal"));
						}
						
						if(!denominator)
						{
							denominator = 0;
						}
						
						var Encash_amt_all_comps = getEncashAmount(i_empID,payGroup,encash_internal_id);
						nlapiLogExecution('DEBUG','Encash_amt_all_comps',Encash_amt_all_comps);
						
						var amount = (Encash_amt_all_comps /parseFloat(denominator))  * parseFloat(leave_balance);
						nlapiLogExecution('DEBUG','amount',amount);
						
						no_of_encash_days = parseFloat(no_of_encash_days);
						
									var filters_i = new Array();
				
									var columns_i = new Array(); 
									
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_empname', null, 'is', i_empID ))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_paygroup', null, 'is', payGroup))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_month', null, 'is', wage_period))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_year', null, 'is', wage_year_id))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_paycomponent', null, 'is', encash_internal_id))
									filters_i.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_msileaverefno', null, 'anyof', i_recID))
									
									
									var searchEmp_i = nlapiSearchRecord('customrecord_hris_monthlysalinput', null, filters_i, null);
									
									if (!searchEmp_i && customrecord_hris_leavebalanceSearch) // if old record not exists then create new appraisal
									{
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'searchEmp_i IFFFFFFFF : ');
										
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'searchEmp_i IFFFFFFFF : ');
							
										var rec_create = nlapiCreateRecord('customrecord_hris_monthlysalinput');
										
										rec_create.setFieldValue('custrecord_hris_mthsal_empname',i_empID);
										
										if(payGroup)
										rec_create.setFieldValue('custrecord_hris_mthsal_paygroup',payGroup);
										
										if(wage_period)
										rec_create.setFieldValue('custrecord_hris_mthsal_month',wage_period);
										
										if(wage_year_id)
										rec_create.setFieldValue('custrecord_hris_mthsal_year',wage_year_id);
										
										
										rec_create.setFieldValue('custrecord_hris_mthsal_paycomponent',encash_internal_id);
										
										if(leave_balance)
											rec_create.setFieldValue('custrecord_hris_mthsal_annual_leave_bala',leave_balance);
										
										rec_create.setFieldValue('custrecord_hris_mthsal_leave_encashment',denominator);
										
										rec_create.setFieldValue('custrecord_hris_mthsal_paydt',pay_Date);
										
										if(amount)
										rec_create.setFieldValue('custrecord_hris_mthsal_salaryamount',amount);
									
										if(leave_balance)
											rec_create.setFieldValue('custrecord_hris_mthsal_no_of_encashable',leave_balance);
									
										if(i_recID)
											rec_create.setFieldValue('custrecord_hris_mthsal_msileaverefno',i_recID);
										
										rec_create.setFieldValue('custrecord_hris_mthsal_remarks','This entry is auto created from Leave Application against Rotational Leavae Encashment');
										
										
										var rec_submit = nlapiSubmitRecord(rec_create,true,true);
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'rec_submitrec_submit : ' + rec_submit);
										var bal_submit = nlapiSubmitRecord(_load_leave_balance,true,true);
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'bal_submit : ' + bal_submit);
										
										
									}
					 }
                      }
					  
					  
					 
					  
					 
 		  
	  } 
	  catch(e)//
	  {
		  if (e instanceof nlobjError)
	          nlapiLogExecution('DEBUG', 'system error', e.getCode() + '\n'+ e.getDetails());
	    else
	          nlapiLogExecution('DEBUG', 'unexpected error', e.toString());
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
	var rec_id = null;

			var filters = new Array();
					
			filters[0] = new nlobjSearchFilter('custrecord1421', null, "anyof", empid);
					
					
			var columns = new Array();
			
					columns[0] = new nlobjSearchColumn('internalid').setSort(true);
					
					var SearchResult = nlapiSearchRecord('customrecord_ihr_air_ticket_eligibility', null, filters, columns);
					nlapiLogExecution('DEBUG', 'after submit', 'SearchResult.length :'+SearchResult.length);
					
					if (_logValidation(SearchResult))//
					{
					   rec_id =	SearchResult[0].getValue('internalid', null, null);
					}
		return rec_id;			
}

function remFormatedDate(remainMonth_year, remainMonth_month, lastdayOfEachMonth){
	            
	            var date_format = checkDateFormat();
				var year        = remainMonth_year;
				var Anvr_month  = remainMonth_month
				var Anvr_DateVal = lastdayOfEachMonth;
				
				if (date_format == 'YYYY-MM-DD')
		  		{
		  	 var newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
		  		}
		 		 if (date_format == 'DD/MM/YYYY')
		 		 {
		  			var newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
			
		  		}
				if (date_format == 'D/M/YYYY')
		 		 {
		  			var newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
			
		  		}
		  		if (date_format == 'MM/DD/YYYY')
		  		{
		  			var newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
		   		}
				if (date_format == 'M/D/YYYY')
		  		{
		  			var newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
		   		}
				
				if (date_format == 'DD-MM-YYYY')
		  		{
		  			var newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				
				if (date_format == 'DD-Mon-YYYY')
		  		{
		  			var newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				
				if (date_format == 'DD.MM.YYYY')
		  		{
		  			var newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
		   		}
				if (date_format == 'DD-Month-YYYY')
		  		{
		  			var newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				if (date_format == 'YYYY/MM/DD')
		  		{
		  	 var newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
		  		}
				
				if (date_format == 'DD MONTH, YYYY')
		  		{
					
		  	 var newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;
			 
		  		}
				
			return newDate;
				
}


 function checkDateFormat()
{
    var context = nlapiGetContext();

    var dateFormatPref = context.getPreference('dateformat');

    return dateFormatPref;
}


function search_paygroup(employee_name)
{
    var filters = new Array();
    var columns = new Array();
    
    filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_name));
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
    columns.push(new nlobjSearchColumn('internalid'));
    columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))
	    
    columns[0].setSort(true);
    
    var s_result = nlapiSearchRecord('customrecord_hris_employee_compen_change', null, filters, columns)
    
    if (s_result != null) 
	{
        var s_paygroup = s_result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp')      
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
    var filters = new Array();
    var columns = new Array();
    
    filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto', 24));
	filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',paygroup));
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	
	
    columns.push(new nlobjSearchColumn('internalid'));
    	    
    columns[0].setSort(true);
    
    var s_result = nlapiSearchRecord('customrecord_hris_payroll_component', null, filters, columns)
    
    if (s_result != null) 
	{
        var s_paycomponent = s_result[0].getValue('internalid')      
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
	var yearId; 
	var filters = new Array();
    var columns = new Array();
    filters.push(new nlobjSearchFilter('internalid', null, 'is', month))
	//columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('name'));
	var result = nlapiSearchRecord('customlist_hris_month_list', null, filters, columns)
	//alert('result'+result)
	if (result != null) 
	{
	 	month_name = result[0].getValue('name');		
	}
	return month_name;
}
function search_wageperiod(pay_group)
{	
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_group', null,'is',pay_group));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var Column= new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_end_date'));
	Column.push(new nlobjSearchColumn('custrecord_hris_start_date'));
	Column.push(new nlobjSearchColumn('custrecord_hris_month'));
	Column.push(new nlobjSearchColumn('custrecord_hris_year'));
	Column.push(Column[0].setSort(true));
	
	var searchResult =nlapiSearchRecord('customrecord_hris_wage_period_details',null,Filters,Column);
		
	if(searchResult !=null)
	{
		var WagePeriod_EndDate = searchResult[0].getValue('custrecord_hris_end_date')
		
		var start_date = searchResult[0].getValue('custrecord_hris_start_date');
		
		var month = searchResult[0].getValue('custrecord_hris_month')
		
		var year = searchResult[0].getValue('custrecord_hris_year')
		
	}//End of if(searchResult !=null)
	return WagePeriod_EndDate+"#"+ start_date +"#"+month+"#"+year;
}//End of function search_wageperiod(pay_group)

function searchYear(year)
{
	
	nlapiLogExecution('DEBUG', 'after submit record', 'searchYear year : '+year);	
	var yearId; 
	var filters = new Array();
    var columns = new Array();
    filters.push(new nlobjSearchFilter('name', null, 'contains', year))
	columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('name'));
	var result = nlapiSearchRecord('customlist_hris_year_master', null, filters, columns)
	if (result != null) 
	{
	 	yearId = result[0].getValue('internalid');	
		nlapiLogExecution('DEBUG', 'after submit record', 'searchYear yearIdyearId : '+yearId);			
	}
	return yearId;
}
//Function to search employee's wage period end date


function getCompanyCurrentDateTime(){
    var currentDateTime = new Date();
    var companyTimeZone = nlapiLoadConfiguration('companyinformation').getFieldText('timezone');
    var timeZoneOffSet = (companyTimeZone.indexOf('(GMT)') == 0) ? 0 : new Number(companyTimeZone.substr(4, 6).replace(/\+|:00/gi, '').replace(/:30/gi, '.5'));
    var UTC = currentDateTime.getTime() + (currentDateTime.getTimezoneOffset() * 60000);
    var companyDateTime = UTC + (timeZoneOffSet * 60 * 60 * 1000);
    
    return new Date(companyDateTime);
}
// END FUNCTION =====================================================


function searchYear(year) {
    var yearVal = '';
    year = year.toString();
    nlapiLogExecution('DEBUG', 'Year in searchYear function', year);
    var filter = [];
    filter.push(new nlobjSearchFilter('name', null, 'contains', year));
    filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));

    var column = [];
    column.push(new nlobjSearchColumn('internalid'));

    var search = nlapiSearchRecord('customlist_hris_year_master', null, filter, column);
    if (search) {
        yearVal = search[0].getValue('internalid')
    }
    nlapiLogExecution('DEBUG', 'yearVal in SearchYear  Func', yearVal);
    return yearVal;
}



function getBasic(pay_group, emp_id) {
    var salAmt = 0.00;
    var filter = [];
    var column = [];
    filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    filter.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'anyof', pay_group));
   // filter.push(new nlobjSearchFilter('custrecord_hris_consider_for_encashment', null, 'is', 'T'));
    filter.push(new nlobjSearchFilter('internalid', null, 'is', 1));


    column.push(new nlobjSearchColumn('internalid'));

    var pay_comp_search = nlapiSearchRecord('customrecord_hris_payroll_component', null, filter, column);
    //nlapiLogExecution('DEBUG', 'pay_comp_search length', pay_comp_search.length)
    if (pay_comp_search != null) {
        for (var i = 0; i < pay_comp_search.length; i++) {

            var comp_id = pay_comp_search[i].getValue('internalid');

            nlapiLogExecution('DEBUG', 'pay_comp_search comp_id', comp_id)

            var edc_search = nlapiSearchRecord("customrecord_hris_employee_compen_change", null,
                [
                    ["custrecord_hris_empchange_employee_nam", "anyof", emp_id],
                    "AND",
                    ["custrecord_hris_employee_data_change.custrecord_hris_cde_payroll_component", "anyof", comp_id]

                ],
                [
                    new nlobjSearchColumn("custrecord_hris_empchange_employee_nam"),
                    new nlobjSearchColumn("custrecord_hris_cde_monthly", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null),
                    new nlobjSearchColumn("custrecord_hris_cde_process_group", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null),
                    new nlobjSearchColumn("internalid", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null)
                ]
            );
            //nlapiLogExecution('DEBUG', 'edc_search length', edc_search.length)
            if (edc_search != null) {
                for (var j = 0; j < edc_search.length; j++) {
                    var payGrp_Comp_Detail = edc_search[j].getValue("custrecord_hris_cde_monthly", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null);
                    var comp_value = edc_search[j].getValue("custrecord_hris_cde_process_group", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null);


                    nlapiLogExecution('DEBUG', 'comp_value', comp_value)
                    nlapiLogExecution('DEBUG', 'payGrp_Comp_Detail', payGrp_Comp_Detail)
                    salAmt = parseFloat(salAmt) + parseFloat(payGrp_Comp_Detail);



                }
            }
        }
    }

    return salAmt;
}



function get_sequence_no(leave_type)
{
	var sequence_no =''
	var filters = new Array();
	var columns = new Array();
	
	filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
	
	columns.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_seqno'));
	
	var compoff_record_result = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, columns);
	
	if (compoff_record_result != null) 
	{
	
		sequence_no = compoff_record_result[0].getValue('custrecord_hris_lvecnfg_seqno')
		
	 nlapiLogExecution('DEBUG','WFH ', 'sequence_no --> '+ sequence_no)	
	}
	return sequence_no ;
} // end of function get_sequence_no(leave_type)






function getEncashAmount(empName,processGrp,encash_internal_id){
	    
	   var compType = encash_internal_id;
	    
	  
	   var salAmt = 0.00;
	   
	   var filter3 = [];
	   filter3.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'anyof', processGrp));
	   filter3.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null,'equalto', 40));
	   
	   var column3 = [];
	   column3.push(new nlobjSearchColumn('internalid'))
	   var search_comp = nlapiSearchRecord('customrecord_hris_payroll_component', null, filter3, column3)
	   if(search_comp){
		   var comp_intID = search_comp[0].getValue('internalid');
		   
		   if(compType == comp_intID){
		   nlapiLogExecution('DEBUG', 'inside LeaveType condition')
		   var filter = [];
		   var column = [];
		   filter.push(new nlobjSearchFilter('isinactive',null, 'is', 'F'));
		   filter.push(new nlobjSearchFilter('custrecord_hris_pay_process_group',null, 'anyof', processGrp));
		   filter.push(new nlobjSearchFilter('custrecord_hris_consider_for_encashment', null, 'is', 'T'));
		   
		   column.push(new nlobjSearchColumn('internalid'));
		   
		   var pay_comp_search = nlapiSearchRecord('customrecord_hris_payroll_component', null, filter, column);
		  // nlapiLogExecution('DEBUG', 'pay_comp_search length', pay_comp_search.length)
		   if(pay_comp_search!= null){
			   for(var i = 0; i < pay_comp_search.length; i++){
				   
				var comp_id = pay_comp_search[i].getValue('internalid');
				
				var edc_search = nlapiSearchRecord("customrecord_hris_employee_compen_change",null,
                   [
                      ["custrecord_hris_empchange_employee_nam","anyof", empName],
                      "AND", 
                      ["custrecord_hris_employee_data_change.custrecord_hris_cde_payroll_component","anyof",comp_id]					  
                      
                   ], 
                   [
                      new nlobjSearchColumn("custrecord_hris_empchange_employee_nam"), 
                      new nlobjSearchColumn("custrecord_hris_cde_monthly","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null), 
                      new nlobjSearchColumn("custrecord_hris_cde_process_group","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null), 
                      new nlobjSearchColumn("internalid","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null)
                   ]
                   );
				//nlapiLogExecution('DEBUG', 'edc_search length', edc_search.length)
			     if(edc_search!=null){
					 for(var j=0; j < edc_search.length; j++){
						 var payGrp_Comp_Detail = edc_search[j].getValue("custrecord_hris_cde_monthly","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null);
						 var comp_value = edc_search[j].getValue("custrecord_hris_cde_process_group","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null);
						 
						    
							 nlapiLogExecution('DEBUG', 'comp_value', comp_value)
							 nlapiLogExecution('DEBUG', 'payGrp_Comp_Detail', payGrp_Comp_Detail)
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
	var bal = 0.00;  
	var customrecord_hris_leavebalanceSearch = nlapiSearchRecord("customrecord_hris_leavebalance",null,
	[
	   ["custrecord_hris_lvbal_employee_name","anyof",employee], 
	   "AND", 
	   ["custrecord_hris_lvbal_leave_type","anyof",leave_type]
	], 
	[
	   new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"), 
	   new nlobjSearchColumn("custrecord_hris_lvbal_encashable_days")
	]
	);
	if(customrecord_hris_leavebalanceSearch)
	{
		var annual = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"));
		var encash = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lvbal_encashable_days"));
		
		if(!annual)
			annual = 0;
		
		
		if(!encash)
			encash = 0;
		
		bal = parseFloat(annual) + parseFloat(encash)
	}
	
	return bal;
}	  

function formatedDate(end_date) {

    var date_format = checkDateFormat();
    var endDate = nlapiStringToDate(end_date);
    var year = endDate.getFullYear();
    nlapiLogExecution('DEBUG', 'formated year', year)
    var Anvr_month = endDate.getMonth() + 1;
    nlapiLogExecution('DEBUG', 'formated Anvr_month', Anvr_month)
    var Anvr_DateVal = endDate.getDate();
    nlapiLogExecution('DEBUG', 'formated Anvr_DateVal', Anvr_DateVal)

    if (date_format == 'YYYY-MM-DD') {
        var newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
    }
    if (date_format == 'DD/MM/YYYY') {
        var newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;

    }
    if (date_format == 'D/M/YYYY') {
        var newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;

    }
    if (date_format == 'MM/DD/YYYY') {
        var newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
    }
    if (date_format == 'M/D/YYYY') {
        var newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
    }

    if (date_format == 'DD-MM-YYYY') {
        var newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
    }

    if (date_format == 'DD-Mon-YYYY') {
        var newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
    }

    if (date_format == 'DD.MM.YYYY') {
        var newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
    }
    if (date_format == 'DD-Month-YYYY') {
        var newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
    }
    if (date_format == 'YYYY/MM/DD') {
        var newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
    }

    if (date_format == 'DD MONTH, YYYY') {

        var newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;

    }
    nlapiLogExecution('DEBUG', 'formated newDate', newDate);
    return newDate;

}

function checkDateFormat() {
    var context = nlapiGetContext();

    var dateFormatPref = context.getPreference('dateformat');

    return dateFormatPref;
}

function getEncashCompId(id)
{
	var customrecord_hris_payroll_componentSearch = nlapiSearchRecord("customrecord_hris_payroll_component",null,
		[
		   ["custrecord_hris_pay_process_group","anyof",id],
		   "AND",
		   ["custrecord_hris__sequence_no_","equalto","40"]
		], 
		[
		   new nlobjSearchColumn("internalid"), 
		   new nlobjSearchColumn("custrecord_hris_component_short_name").setSort(false),
		   new nlobjSearchColumn("custrecord_hris__sequence_no_")
		]
		);

		if(customrecord_hris_payroll_componentSearch)
		{
			var id = customrecord_hris_payroll_componentSearch[0].getId();

		}
	return id;	
}