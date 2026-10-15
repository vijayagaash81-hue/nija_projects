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




function afterSubmitRecord_encasment_msi_creatio(type)
{
    
		
	 try
	  {
		   	// Get current user 
					  let i_Current_User = nlapiGetUser();
					  //nlapiLogExecution('DEBUG', 'Before submit record', 'i_Current_User : '+i_Current_User);
					  
					  //Get record type
					  let i_recType = nlapiGetRecordType();
					  nlapiLogExecution('DEBUG', 'after submit record', 'i_recType : '+i_recType);
					  
					  //Get record ID
					  let i_recID  = nlapiGetRecordId();
					  nlapiLogExecution('DEBUG', 'after submit record', 'i_recID : '+i_recID);
					  
					  // Load record for getting value
					  let o_recordObj = nlapiLoadRecord(i_recType, i_recID);
					  
					  let leave_type =   o_recordObj.getFieldValue('custrecord_hris_lve_leavetype');
					  
					  let leave_status = o_recordObj.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
					   
					  let cancel_check = o_recordObj.getFieldValue('custrecord_hris_lve_cancellation');
					  
					  let i_empID = 	 o_recordObj.getFieldValue('custrecord_hris_lve_employeename');
					  
					  let seq_no = get_sequence_no(leave_type);
					  
					  let appliy_encashment =   o_recordObj.getFieldValue('custrecord_hris_lve_applylveencashment');
					  
					  leave_status =   o_recordObj.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
							
					  let omani_nonOmani = o_recordObj.getFieldValue('custrecord_hris_lve_nation_omani_non');
					 
					if(appliy_encashment == 'T' && leave_status == '2' && cancel_check == 'F') //Cancel check added as after final approval of cancellation MSI was getting created-------Sumant Kumar----19/03/2021
					 {
					  
						 
						  
						  let leave_from_date =  o_recordObj.getFieldValue('custrecord_hris_lve_fromdate');
						  
						  leave_from_date = nlapiStringToDate(leave_from_date);
						  
						  let leave_get_month = leave_from_date.getMonth() + 1;
						  let leave_year = leave_from_date.getFullYear();
						  
						  let leave_YearId = searchYear(leave_year);
						  
						  let to_Date = o_recordObj.getFieldValue('custrecord_hris_lve_todate');
						  
						  let leave_type = o_recordObj.getFieldValue('custrecord_hris_lve_leavetype');
						  
						  let no_of_encash_days = o_recordObj.getFieldValue('custrecord_hris_lve_noofencashmentdays');
						  
						  
						  let payGroup = search_paygroup(i_empID);
						  
						  let encash_internal_id = getEncashCompId(payGroup);
						  nlapiLogExecution('Debug','encash_internal_id',encash_internal_id);
						  
						let todayDate = new Date('03/25/2020');
						let current_month = todayDate.getMonth() + 1
						
						let get_wage_date = search_wageperiod(payGroup);
						let w_Date = get_wage_date.toString().split('#');
						let end_date = w_Date[0];
						let start_date = w_Date[1];
						let mth = nlapiStringToDate(end_date);
						let get_month = leave_get_month;//mth.getMonth() + 1;
						let year = leave_year;//mth.getFullYear();
						 
						let yearId = searchYear(year);
						let lastDay  = new Date(leave_from_date.getFullYear(), leave_from_date.getMonth() + 1, 0);
						let pay_Date =  nlapiDateToString(lastDay);				
						
						
						
						nlapiLogExecution('Debug','pay_Date',pay_Date);
						
						let wage_period = get_month ;

						// added by florence for hris month
						wage_period=gethrisMonth(wage_period);
						
						let wage_year_id = yearId ;
						
						
						
						let leave_balance = getLeaveBanlce(i_empID,leave_type);
						nlapiLogExecution('DEBUG','leave_balance',leave_balance);
						
						let DENOMINATOR_CONSIDERED_configSearch = nlapiSearchRecord("customrecord_hris_leaveconfig",null,
						[
						   ["internalidnumber","equalto",leave_type]
						], 
						[
						   new nlobjSearchColumn("custrecord_hris_lveconfig_lveencashcal")
						]
						);
						
						let denominator = 0;
						if(DENOMINATOR_CONSIDERED_configSearch)
						{
							denominator = DENOMINATOR_CONSIDERED_configSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lveconfig_lveencashcal"));
						}
						
						if(!denominator)
						{
							denominator = 0;
						}
						
						let Encash_amt_all_comps = getEncashAmount(i_empID,payGroup,encash_internal_id,omani_nonOmani);
						nlapiLogExecution('DEBUG','Encash_amt_all_comps',Encash_amt_all_comps);

						nlapiLogExecution('DEBUG','Denominator',denominator);
						nlapiLogExecution('DEBUG','no_of_encash_days',no_of_encash_days);
						let amount = (Encash_amt_all_comps /parseFloat(denominator))  * parseFloat(no_of_encash_days);
						nlapiLogExecution('DEBUG','amount',amount);
						
						no_of_encash_days = parseFloat(no_of_encash_days);
						
									let filters_i = new Array();
				
									let columns_i = new Array(); 
									
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_empname', null, 'is', i_empID ))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_paygroup', null, 'is', payGroup))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_month', null, 'is', wage_period))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_year', null, 'is', wage_year_id))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_paycomponent', null, 'is', encash_internal_id))
									filters_i.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'))
									filters_i.push(new nlobjSearchFilter('custrecord_hris_mthsal_msileaverefno', null, 'anyof', i_recID))
									
									
									let searchEmp_i = nlapiSearchRecord('customrecord_hris_monthlysalinput', null, filters_i, null);
									
									if (!searchEmp_i) // if old record not exists then create new appraisal
									{
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'searchEmp_i IFFFFFFFF : ');
										
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'searchEmp_i IFFFFFFFF : ');
							
										let rec_create = nlapiCreateRecord('customrecord_hris_monthlysalinput');
										
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
										
										
										let rec_submit = nlapiSubmitRecord(rec_create,true,true);
										nlapiLogExecution('DEBUG', 'SchedulerFunction', 'rec_submitrec_submit : ' + rec_submit);
										
										
									}
					 }
						
					  
					  
					 
					  
					 
 		  
	  } 
	  catch(e)
	  {
		  if (e instanceof nlobjError)
	          nlapiLogExecution('DEBUG', 'system error', e.getCode() + '\n'+ e.getDetails());
	    else
	          nlapiLogExecution('DEBUG', 'unexpected error', e.toString());
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
	let rec_id = null;

			let filters = new Array();
					
			filters[0] = new nlobjSearchFilter('custrecord1421', null, "anyof", empid);
					
					
			let columns = new Array();
			
					columns[0] = new nlobjSearchColumn('internalid').setSort(true);
					
					let SearchResult = nlapiSearchRecord('customrecord_ihr_air_ticket_eligibility', null, filters, columns);
					nlapiLogExecution('DEBUG', 'after submit', 'SearchResult.length :'+SearchResult.length);
					
					if (_logValidation(SearchResult))//
					{
					   rec_id =	SearchResult[0].getValue('internalid', null, null);
					}
		return rec_id;			
}

function remFormatedDate(remainMonth_year, remainMonth_month, lastdayOfEachMonth){
	            
	            let date_format = checkDateFormat();
				let year        = remainMonth_year;
				let Anvr_month  = remainMonth_month
				let Anvr_DateVal = lastdayOfEachMonth;
				
				if (date_format == 'YYYY-MM-DD')
		  		{
		  	 let newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
		  		}
		 		 if (date_format == 'DD/MM/YYYY')
		 		 {
		  			let newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
			
		  		}
				if (date_format == 'D/M/YYYY')
		 		 {
		  			let newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;
			
		  		}
		  		if (date_format == 'MM/DD/YYYY')
		  		{
		  			let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
		   		}
				if (date_format == 'M/D/YYYY')
		  		{
		  			let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
		   		}
				
				if (date_format == 'DD-MM-YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				
				if (date_format == 'DD-Mon-YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				
				if (date_format == 'DD.MM.YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
		   		}
				if (date_format == 'DD-Month-YYYY')
		  		{
		  			let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
		   		}
				if (date_format == 'YYYY/MM/DD')
		  		{
		  	 let newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
		  		}
				
				if (date_format == 'DD MONTH, YYYY')
		  		{
					
		  	 let newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;
			 
		  		}
				
			return newDate;
				
}


 function checkDateFormat()
{
    let context = nlapiGetContext();

    let dateFormatPref = context.getPreference('dateformat');

    return dateFormatPref;
}


function search_paygroup(employee_name)
{
    let filters = new Array();
    let columns = new Array();
    
    filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_name));
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
    columns.push(new nlobjSearchColumn('internalid'));
    columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))
	    
    columns[0].setSort(true);
    
    let s_result = nlapiSearchRecord('customrecord_hris_employee_compen_change', null, filters, columns)
    
    if (s_result != null) 
	{
        let s_paygroup = s_result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp')      
    }//End of if (s_result != null) 
    return s_paygroup 
}//End of function search_paygroup(employee_name)

function search_payComponent(paygroup)
{
    let filters = new Array();
    let columns = new Array();
    
    filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto', 24));
	filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',paygroup));
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	
	
    columns.push(new nlobjSearchColumn('internalid'));
    	    
    columns[0].setSort(true);
    
    let s_result = nlapiSearchRecord('customrecord_hris_payroll_component', null, filters, columns)
    
    if (s_result != null) 
	{
        let s_paycomponent = s_result[0].getValue('internalid')      
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
	let yearId; 
	let filters = new Array();
    let columns = new Array();
    filters.push(new nlobjSearchFilter('internalid', null, 'is', month))
	//columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('name'));
	let result = nlapiSearchRecord('customlist_hris_month_list', null, filters, columns)
	//alert('result'+result)
	if (result != null) 
	{
	 	month_name = result[0].getValue('name');		
	}
	return month_name;
}
function search_wageperiod(pay_group)
{	
	let Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_group', null,'is',pay_group));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	let Column= new Array();
	Column.push(new nlobjSearchColumn('internalid'));
	Column.push(new nlobjSearchColumn('custrecord_hris_end_date'));
	Column.push(new nlobjSearchColumn('custrecord_hris_start_date'));
	Column.push(new nlobjSearchColumn('custrecord_hris_month'));
	Column.push(new nlobjSearchColumn('custrecord_hris_year'));
	Column.push(Column[0].setSort(true));
	
	let searchResult =nlapiSearchRecord('customrecord_hris_wage_period_details',null,Filters,Column);
		
	if(searchResult !=null)
	{
		let WagePeriod_EndDate = searchResult[0].getValue('custrecord_hris_end_date')
		
		let start_date = searchResult[0].getValue('custrecord_hris_start_date');
		
		let month = searchResult[0].getValue('custrecord_hris_month')
		
		let year = searchResult[0].getValue('custrecord_hris_year')
		
	}//End of if(searchResult !=null)
	return WagePeriod_EndDate+"#"+ start_date +"#"+month+"#"+year;
}//End of function search_wageperiod(pay_group)

function searchYear(year)
{
	
	nlapiLogExecution('DEBUG', 'after submit record', 'searchYear year : '+year);	
	let yearId; 
	let filters = new Array();
    let columns = new Array();
    filters.push(new nlobjSearchFilter('name', null, 'contains', year))
	columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('name'));
	let result = nlapiSearchRecord('customlist_hris_year_master', null, filters, columns)
	if (result != null) 
	{
	 	yearId = result[0].getValue('internalid');	
		nlapiLogExecution('DEBUG', 'after submit record', 'searchYear yearIdyearId : '+yearId);			
	}
	return yearId;
}
//Function to search employee's wage period end date


function getCompanyCurrentDateTime(){
    let currentDateTime = new Date();
    let companyTimeZone = nlapiLoadConfiguration('companyinformation').getFieldText('timezone');
    let timeZoneOffSet = (companyTimeZone.indexOf('(GMT)') == 0) ? 0 : new Number(companyTimeZone.substr(4, 6).replace(/\+|:00/gi, '').replace(/:30/gi, '.5'));
    let UTC = currentDateTime.getTime() + (currentDateTime.getTimezoneOffset() * 60000);
    let companyDateTime = UTC + (timeZoneOffSet * 60 * 60 * 1000);
    
    return new Date(companyDateTime);
}
// END FUNCTION =====================================================


function searchYear(year) {
    let yearVal = '';
    year = year.toString();
    nlapiLogExecution('DEBUG', 'Year in searchYear function', year);
    let filter = [];
    filter.push(new nlobjSearchFilter('name', null, 'contains', year));
    filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));

    let column = [];
    column.push(new nlobjSearchColumn('internalid'));

    let search = nlapiSearchRecord('customlist_hris_year_master', null, filter, column);
    if (search) {
        yearVal = search[0].getValue('internalid')
    }
    nlapiLogExecution('DEBUG', 'yearVal in SearchYear  Func', yearVal);
    return yearVal;
}



function getBasic(pay_group, emp_id) {
    let salAmt = 0.00;
    let filter = [];
    let column = [];
    filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    filter.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'anyof', pay_group));
   // filter.push(new nlobjSearchFilter('custrecord_hris_consider_for_encashment', null, 'is', 'T'));
    filter.push(new nlobjSearchFilter('internalid', null, 'is', 1));


    column.push(new nlobjSearchColumn('internalid'));

    let pay_comp_search = nlapiSearchRecord('customrecord_hris_payroll_component', null, filter, column);
    //nlapiLogExecution('DEBUG', 'pay_comp_search length', pay_comp_search.length)
    if (pay_comp_search != null) {
        for (let i = 0; i < pay_comp_search.length; i++) {

            let comp_id = pay_comp_search[i].getValue('internalid');

            nlapiLogExecution('DEBUG', 'pay_comp_search comp_id', comp_id)

            let edc_search = nlapiSearchRecord("customrecord_hris_employee_compen_change", null,
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
                for (let j = 0; j < edc_search.length; j++) {
                    let payGrp_Comp_Detail = edc_search[j].getValue("custrecord_hris_cde_monthly", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null);
                    let comp_value = edc_search[j].getValue("custrecord_hris_cde_process_group", "CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE", null);


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
	let sequence_no =''
	let filters = new Array();
	let columns = new Array();
	
	filters.push(new nlobjSearchFilter('internalid', null, 'is', leave_type))
	
	columns.push(new nlobjSearchColumn('custrecord_hris_lvecnfg_seqno'));
	
	let compoff_record_result = nlapiSearchRecord('customrecord_hris_leaveconfig', null, filters, columns);
	
	if (compoff_record_result != null) 
	{
	
		sequence_no = compoff_record_result[0].getValue('custrecord_hris_lvecnfg_seqno')
		
	 nlapiLogExecution('DEBUG','WFH ', 'sequence_no --> '+ sequence_no)	
	}
	return sequence_no ;
} // end of function get_sequence_no(leave_type)






function getEncashAmount(empName,processGrp,encash_internal_id){
	    
    let compType = encash_internal_id;
     
   
    let salAmt = 0.00;
    
    let filter3 = [];
    filter3.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'anyof', processGrp));
    filter3.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null,'equalto', 40));
    
    let column3 = [];
    column3.push(new nlobjSearchColumn('internalid'))
    let search_comp = nlapiSearchRecord('customrecord_hris_payroll_component', null, filter3, column3)
    if(search_comp){
        let comp_intID = search_comp[0].getValue('internalid');
        
        if(compType == comp_intID){
        nlapiLogExecution('DEBUG', 'inside LeaveType condition')
        let filter = [];
        let column = [];
        filter.push(new nlobjSearchFilter('isinactive',null, 'is', 'F'));
        filter.push(new nlobjSearchFilter('custrecord_hris_pay_process_group',null, 'anyof', processGrp));
        filter.push(new nlobjSearchFilter('custrecord_hris_consider_for_encashment', null, 'is', 'T'));
        
        column.push(new nlobjSearchColumn('internalid'));
        
        let pay_comp_search = nlapiSearchRecord('customrecord_hris_payroll_component', null, filter, column);
       // nlapiLogExecution('DEBUG', 'pay_comp_search length', pay_comp_search.length)
        if(pay_comp_search!= null){
            for(let i = 0; i < pay_comp_search.length; i++){
                
             let comp_id = pay_comp_search[i].getValue('internalid');
             
             let edc_search = nlapiSearchRecord("customrecord_hris_employee_compen_change",null,
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
                  for(let j=0; j < edc_search.length; j++){
                      let payGrp_Comp_Detail = edc_search[j].getValue("custrecord_hris_cde_monthly","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null);
                      let comp_value = edc_search[j].getValue("custrecord_hris_cde_process_group","CUSTRECORD_HRIS_EMPLOYEE_DATA_CHANGE",null);
                      
                         
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
	let bal = 0.00;  
	let customrecord_hris_leavebalanceSearch = nlapiSearchRecord("customrecord_hris_leavebalance",null,
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
		let annual = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"));
		let encash = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lvbal_encashable_days"));
		
		if(!annual)
			annual = 0;
		
		
		if(!encash)
			encash = 0;
		
		bal = parseFloat(annual) + parseFloat(encash)
	}
	
	return bal;
}	  
 

function formatedDate(end_date) {

    let date_format = checkDateFormat();
    let endDate = nlapiStringToDate(end_date);
    let year = endDate.getFullYear();
    nlapiLogExecution('DEBUG', 'formated year', year)
    let Anvr_month = endDate.getMonth() + 1;
    nlapiLogExecution('DEBUG', 'formated Anvr_month', Anvr_month)
    let Anvr_DateVal = endDate.getDate();
    nlapiLogExecution('DEBUG', 'formated Anvr_DateVal', Anvr_DateVal)

    if (date_format == 'YYYY-MM-DD') {
        let newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
    }
    if (date_format == 'DD/MM/YYYY') {
        let newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;

    }
    if (date_format == 'D/M/YYYY') {
        let newDate = Anvr_DateVal + '/' + Anvr_month + '/' + year;

    }
    if (date_format == 'MM/DD/YYYY') {
        let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
    }
    if (date_format == 'M/D/YYYY') {
        let newDate = Anvr_month + '/' + Anvr_DateVal + '/' + year;
    }

    if (date_format == 'DD-MM-YYYY') {
        let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
    }

    if (date_format == 'DD-Mon-YYYY') {
        let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
    }

    if (date_format == 'DD.MM.YYYY') {
        let newDate = Anvr_DateVal + '.' + Anvr_month + '.' + year;
    }
    if (date_format == 'DD-Month-YYYY') {
        let newDate = Anvr_DateVal + '-' + Anvr_month + '-' + year;
    }
    if (date_format == 'YYYY/MM/DD') {
        let newDate = year + '/' + Anvr_month + '/' + Anvr_DateVal;
    }

    if (date_format == 'DD MONTH, YYYY') {

        let newDate = Anvr_DateVal + ' ' + Anvr_month + ',' + year;

    }
    nlapiLogExecution('DEBUG', 'formated newDate', newDate);
    return newDate;

}

function checkDateFormat() {
    let context = nlapiGetContext();

    let dateFormatPref = context.getPreference('dateformat');

    return dateFormatPref;
}

function getEncashCompId(id)
{
	let customrecord_hris_payroll_componentSearch = nlapiSearchRecord("customrecord_hris_payroll_component",null,
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
			let id = customrecord_hris_payroll_componentSearch[0].getId();

		}
	return id;	
}

});
