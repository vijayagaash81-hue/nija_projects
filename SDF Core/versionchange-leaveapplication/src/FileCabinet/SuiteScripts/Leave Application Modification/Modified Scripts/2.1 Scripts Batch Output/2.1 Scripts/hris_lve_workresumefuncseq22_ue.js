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




function LMS_workResume_AfterSubmit(type) 
{
	
	 if (type != 'delete' && type != 'create') 
	 {
		 let _record_type = nlapiGetRecordType();
		 let _record_id = nlapiGetRecordId();
		 
		// let todayDate = new Date();
		 let todayDate = new Date();
		 
		 let _record_load = nlapiLoadRecord(_record_type,_record_id);
		 
		 let _status = _record_load.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
		 let work_resumption_done = _record_load.getFieldValue('custrecord_hris_lve_workresumptiondone');
		 let empployee_name = _record_load.getFieldValue('custrecord_hris_lve_employeename');
		 
		 let leave_type = _record_load.getFieldValue('custrecord_hris_lve_leavetype');
			
			let customrecord_hris_leaveconfigSearch = nlapiSearchRecord("customrecord_hris_leaveconfig",null,
			[
			   ["internalidnumber","equalto",leave_type]
			], 
			[
			   new nlobjSearchColumn("name").setSort(false), 
			   new nlobjSearchColumn("custrecord_hris_lvecnfg_seqno")
			]
			);
			
			let sequnce_no  = '';
			if(customrecord_hris_leaveconfigSearch)
			{
				 sequnce_no = customrecord_hris_leaveconfigSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lvecnfg_seqno"));
			}
		 
		 let work_resume = _record_load.getFieldValue('custrecord_hris_lve_workresume');
		  let cancel_check = _record_load.getFieldValue('custrecord_hris_lve_cancellation');
		  nlapiLogExecution('Debug','work_resumption_done',work_resumption_done);
		 
		 if(work_resume == 'T' && _status == 2 && work_resumption_done == 'F' && cancel_check =='F' && sequnce_no != '11' && sequnce_no != '22' )//&& empployee_name == 466163
		 {
			
			
			
			
			nlapiLogExecution('Debug','sequnce_no',sequnce_no);
			 
			
			
			let expected_resume_back_date = _record_load.getFieldValue('custrecord_hris_lve_expectedresumebackdt');
			
			let actual_work_resume_date = _record_load.getFieldValue('custrecord_hris_lve_actualresumedate');
			
			let leave_total_number_of_days = _record_load.getFieldValue('custrecord_hris_lve_totalnodays');
			
			let total_delay_days = _record_load.getFieldValue('custrecord_hris_lve_actualtotdelaydays');
			
			
			let total_updated_delay_days = _record_load.getFieldValue('custrecord_hris_lve_totalupdateddelayday')||0;
			
			 let leave_from_date = _record_load.getFieldValue('custrecord_hris_lve_fromdate');
			
			
			actual_work_resume_date = nlapiStringToDate(actual_work_resume_date);
			
			expected_resume_back_date = nlapiStringToDate(expected_resume_back_date);
			
			if(!total_delay_days || total_delay_days == '' || total_delay_days == null || total_delay_days == 'null' || total_delay_days == NaN || total_delay_days == 'NaN')
			{
				total_delay_days = 0;
			}
			
			total_delay_days = parseInt(total_delay_days);
			
			total_updated_delay_days = parseInt(total_updated_delay_days);
			
			 let search_pay_grp = search_paygroup(empployee_name);
			nlapiLogExecution('Debug','actual_work_resume_date',actual_work_resume_date);
			nlapiLogExecution('Debug','expected_resume_back_date',expected_resume_back_date);
			nlapiLogExecution('Debug','total_delay_days',total_delay_days);
			nlapiLogExecution('Debug','total_updated_delay_days',total_updated_delay_days);
			nlapiLogExecution('Debug','todayDate',todayDate);
			
			
			let date_day = todayDate.getDate();
			
			let get_wage_date = search_wageperiod(search_pay_grp);
			let w_Date = get_wage_date.toString().split('#');
			nlapiLogExecution('Debug','w_Date',w_Date);
			let end_date = w_Date[0];
			nlapiLogExecution('Debug','end_date',end_date);
			let start_date = w_Date[1];
			nlapiLogExecution('Debug','start_date',start_date);
			let leave_month = w_Date[2];//mth.getMonth() + 1;
			nlapiLogExecution('Debug','leave_month',leave_month);
			let leave_year_id = w_Date[3];//mth.getFullYear();
			nlapiLogExecution('Debug','leave_year_id',leave_year_id);
			//let mth = nlapiStringToDate(actual_work_resume_date).getMonth()+1;
			nlapiLogExecution('Debug','actual_work_resume_date1',actual_work_resume_date);
			let mth = actual_work_resume_date;
			nlapiLogExecution('Debug','mth1',mth);
			mth = mth.getMonth()+1;
			nlapiLogExecution('Debug','mth',mth);
			let arrear_month = mth;
					
	
			
			
			if(work_resume == 'T')
			{
				if((actual_work_resume_date < todayDate || total_delay_days < total_updated_delay_days) && sequnce_no != '2' )
				{
					
					nlapiLogExecution('Debug','Called Sequence not equal to 2 $$$$$$$$$$$$$$$$$$$$$$');
							
							if(empployee_name && leave_type && total_delay_days < 0) // update the leave balance if total delay days is less than 0 (employee early resumes )
							{
								total_delay_days = Math.abs(total_delay_days);
								let customrecord_hris_leavebalanceSearch = nlapiSearchRecord("customrecord_hris_leavebalance",null,
								[
								   ["isinactive","is","F"], 
								   "AND", 
								   ["custrecord_hris_lvbal_employee_name","anyof",empployee_name], 
								   "AND", 
								   ["custrecord_hris_lvbal_leave_type","anyof",leave_type]
								], 
								[
								   new nlobjSearchColumn("internalid"), 
								   new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"), 
								   new nlobjSearchColumn("custrecord_hris_lvbal_leave_balance_take")
								]
								);
								
								
								
								if(customrecord_hris_leavebalanceSearch)
								{
									 let internal_id = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("internalid")); 
									 
									 let _balace_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id);
									 
									let avl_leave_bal = _balace_record.getFieldValue('custrecord_hris_lvbal_available_leave_ba');
									let leave_bal_taken = _balace_record.getFieldValue('custrecord_hris_lvbal_leave_balance_take');
									 
									if(!avl_leave_bal) 
									{
										avl_leave_bal = 0;
									}
									
									if(!leave_bal_taken) 
									{
										leave_bal_taken = 0;
									}
									
									avl_leave_bal = parseFloat(avl_leave_bal) + parseFloat(total_delay_days)
									
									leave_bal_taken  = parseFloat(leave_bal_taken) - parseFloat(total_delay_days);

									if(sequnce_no != '2')// if unpaid not equal to
									{
										_balace_record.setFieldValue('custrecord_hris_lvbal_available_leave_ba',avl_leave_bal);
									}
									
									_balace_record.setFieldValue('custrecord_hris_lvbal_leave_balance_take',leave_bal_taken);

									
									let leave_balnce_submit = nlapiSubmitRecord(_balace_record,true,true);	
									nlapiLogExecution('Debug','leave_balnce_submit',leave_balnce_submit);
									
									 
								}	
							}
							else if(total_delay_days > 0)
							{
								let customrecord_hris_leavebalanceSearch = nlapiSearchRecord("customrecord_hris_leavebalance",null,
								[
								   ["isinactive","is","F"], 
								   "AND", 
								   ["custrecord_hris_lvbal_employee_name","anyof",empployee_name], 
								   "AND", 
								   ["custrecord_hris_lvbal_leave_type.custrecord_hris_lvecnfg_seqno","equalto","2"]
								], 
								[
								   new nlobjSearchColumn("internalid"), 
								   new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"), 
								   new nlobjSearchColumn("custrecord_hris_lvbal_leave_balance_take")
								]
								);
								
								
								
								if(customrecord_hris_leavebalanceSearch)
								{
									 let internal_id = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("internalid")); 
									 
								    let _balace_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id);
									 
									
									let leave_bal_taken = _balace_record.getFieldValue('custrecord_hris_lvbal_leave_balance_take');
									 
									
									
									if(!leave_bal_taken) 
									{
										leave_bal_taken = 0;
									}
									
									
									leave_bal_taken  = (parseFloat(leave_bal_taken) +  parseFloat(total_delay_days)); // it will deduct if negative value and it will add if positive value

									_balace_record.setFieldValue('custrecord_hris_lvbal_leave_balance_take',leave_bal_taken);

									
									let leave_balnce_submit = nlapiSubmitRecord(_balace_record,true,true);	
									nlapiLogExecution('Debug','leave_balnce_submit for sequnce_no 2',leave_balnce_submit);
									
								
								}
							}
					
					
					//if(date_day < 25 )
					{
						
							if(empployee_name && leave_type)
							{
								
								if(todayDate > expected_resume_back_date) // create arrears only if today date is greater than expected resume date
									{
									nlapiLogExecution('Debug','create arrear entry');	
									// calculating the arears days based on the below condition, calculate date is nothing but	
										if(actual_work_resume_date < expected_resume_back_date)
										{
											let calculate_date = expected_resume_back_date
										}
										else
										{
											let calculate_date = actual_work_resume_date
										}
											
										
										let oneDay = 24  * 60 * 60 * 1000;

										let daysDiff = Math.round((todayDate.getTime() - calculate_date.getTime()) / (oneDay));
										
										nlapiLogExecution('Debug','create arrear entry daysDiff',daysDiff);
										if(daysDiff > 0)// arrears create only greater than 0 days
										{
										
											let arrears_record = nlapiSearchRecord("customrecord_hris_unpaid_arrear_entry",null,
											[
											   ["isinactive","is","F"], 
											   "AND", 
											   ["custrecord_hris_uae_employee_name","anyof",empployee_name], 
											   "AND", 
											   ["custrecord_hris_uae_pay_group","anyof",search_pay_grp],
											   "AND",
											   ["custrecord_hris_uae_month","is",leave_month],
											   "AND",
											   ["custrecord_hris_uae_year","is",leave_year_id],
											   "AND",
											   ["custrecord_hris_uae_leave_reference_no","is",_record_id]
											], 
											[
											   new nlobjSearchColumn("internalid")
											   
											]
											);
										
										
											if(!arrears_record)
											{										
												nlapiLogExecution('Debug','Arrear creation below 25');
												let create_arrears = nlapiCreateRecord('customrecord_hris_unpaid_arrear_entry');
												
												create_arrears.setFieldValue('custrecord_hris_uae_employee_name',empployee_name);
												
												create_arrears.setFieldValue('custrecord_hris_uae_pay_group',search_pay_grp);
												
												create_arrears.setFieldValue('custrecord_hris_uae_pay_date',end_date);
												
												create_arrears.setFieldValue('custrecord_hris_uae_month',leave_month);
												
												create_arrears.setFieldValue('custrecord_hris_uae_year',leave_year_id);
												
												create_arrears.setFieldValue('custrecord_hris_uae_arrear_days',daysDiff);
												
												create_arrears.setFieldValue('custrecord_hris_uae_arrear_month',arrear_month);
												
												create_arrears.setFieldValue('custrecord_hris_uae_leave_reference_no',_record_id);
												
												create_arrears.setFieldValue('custrecord_hris_uae_remark','Unpaid Arrear entry against work resumption');
												
												create_arrears = nlapiSubmitRecord(create_arrears,true,true);
												nlapiLogExecution('Debug','create_arrears submit',create_arrears);
											}
											else
											{
												let internal_id = arrears_record[0].getId();
												let load_record = nlapiLoadRecord('customrecord_hris_unpaid_arrear_entry',internal_id);
												
												load_record.setFieldValue('custrecord_hris_uae_arrear_days',daysDiff);
												
												let load_arrears_submit = nlapiSubmitRecord(load_record,true,true);
												nlapiLogExecution('Debug','load_arrears_submit',load_arrears_submit);
											}
										
											
										}
										
									}
								
								
								
							}
						
					}
									
					
					
							
				}
				
				if(sequnce_no == '2')
				{
					nlapiLogExecution('Debug','Called Sequence equal to 2 ***********************');
					
						if(empployee_name && leave_type ) // update the leave balance if total delay days is 
							{
								//total_delay_days = Math.abs(total_delay_days);
								let customrecord_hris_leavebalanceSearch = nlapiSearchRecord("customrecord_hris_leavebalance",null,
								[
								   ["isinactive","is","F"], 
								   "AND", 
								   ["custrecord_hris_lvbal_employee_name","anyof",empployee_name], 
								   "AND", 
								   ["custrecord_hris_lvbal_leave_type","anyof",leave_type]
								], 
								[
								   new nlobjSearchColumn("internalid"), 
								   new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"), 
								   new nlobjSearchColumn("custrecord_hris_lvbal_leave_balance_take")
								]
								);
								
								
								
								if(customrecord_hris_leavebalanceSearch)
								{
									 let internal_id = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("internalid")); 
									 
									 let _balace_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id);
									 
									
									let leave_bal_taken = _balace_record.getFieldValue('custrecord_hris_lvbal_leave_balance_take');
									 
									
									
									if(!leave_bal_taken) 
									{
										leave_bal_taken = 0;
									}
									
									
									leave_bal_taken  = (parseFloat(leave_bal_taken) +  parseFloat(total_delay_days)); // it will deduct if negative value and it will add if positive value

									_balace_record.setFieldValue('custrecord_hris_lvbal_leave_balance_take',leave_bal_taken);

									
									let leave_balnce_submit = nlapiSubmitRecord(_balace_record,true,true);	
									nlapiLogExecution('Debug','leave_balnce_submit for sequnce_no 2',leave_balnce_submit);
									
									
									
										let oneDay = 24  * 60 * 60 * 1000;

										let daysDiff = Math.round((actual_work_resume_date.getTime() - todayDate.getTime()) / (oneDay));
										
										
										if(daysDiff > 0)// arrears create only greater than 0 days
										{
										
											let arrears_record = nlapiSearchRecord("customrecord_hris_unpaid_arrear_entry",null,
											[
											   ["isinactive","is","F"], 
											   "AND", 
											   ["custrecord_hris_uae_employee_name","anyof",empployee_name], 
											   "AND", 
											   ["custrecord_hris_uae_pay_group","anyof",search_pay_grp],
											   "AND",
											   ["custrecord_hris_uae_month","is",leave_month],
											   "AND",
											   ["custrecord_hris_uae_year","is",leave_year_id],
											   "AND",
											   ["custrecord_hris_uae_leave_reference_no","is",_record_id]
											], 
											[
											   new nlobjSearchColumn("internalid")
											   
											]
											);
										
										
											if(!arrears_record)
											{										
												nlapiLogExecution('Debug','Arrear creation for sequnce_no 2');
												let create_arrears = nlapiCreateRecord('customrecord_hris_unpaid_arrear_entry');
												
												create_arrears.setFieldValue('custrecord_hris_uae_employee_name',empployee_name);
												
												create_arrears.setFieldValue('custrecord_hris_uae_pay_group',search_pay_grp);
												
												create_arrears.setFieldValue('custrecord_hris_uae_pay_date',end_date);
												
												create_arrears.setFieldValue('custrecord_hris_uae_month',leave_month);
												
												create_arrears.setFieldValue('custrecord_hris_uae_year',leave_year_id);
												
												create_arrears.setFieldValue('custrecord_hris_uae_arrear_days',daysDiff);
												
												create_arrears.setFieldValue('custrecord_hris_uae_arrear_month',arrear_month);
												
												create_arrears.setFieldValue('custrecord_hris_uae_leave_reference_no',_record_id);
												
												create_arrears.setFieldValue('custrecord_hris_uae_remark','Unpaid Arrear entry against work resumption');
												
												create_arrears = nlapiSubmitRecord(create_arrears,true,true);
												nlapiLogExecution('Debug','create_arrears submit',create_arrears);
											}
											else
											{
												let internal_id = arrears_record[0].getId();
												let load_record = nlapiLoadRecord('customrecord_hris_unpaid_arrear_entry',internal_id);
												
												load_record.setFieldValue('custrecord_hris_uae_arrear_days',daysDiff);
												
												let load_arrears_submit = nlapiSubmitRecord(load_record,true,true);
												nlapiLogExecution('Debug','load_arrears_submit for sequnce_no 2',load_arrears_submit);
											}
										
											
										}
										
									
									
									
									
									
									
									 
								}	
							}
					
				}	
				
				
				_record_load.setFieldValue('custrecord_hris_lve_workresumptiondone','T');
				let leave_apl_submit = nlapiSubmitRecord(_record_load,true,true);
				nlapiLogExecution('Debug','leave_apl_submit-',leave_apl_submit);
				
			}
			 
		 }
		 
		 
	 }
	
}


function search_paygroup(employee_name) {
    let filters = new Array();
    let columns = new Array();

    filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_name));
    filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    columns.push(new nlobjSearchColumn('internalid'));
    columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))

    columns[0].setSort(true);

    let s_result = nlapiSearchRecord('customrecord_hris_employee_compen_change', null, filters, columns)

    if (s_result != null) {
        let s_paygroup = s_result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp')
    } //End of if (s_result != null) 
    return s_paygroup
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



function _Is_Valid(value) //
{
    if (value != null && value != '' && value != 'undefined') // 
    {
        return true;
    }
    return false;
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
function remFormatedDate(remainMonth_year, remainMonth_month, lastdayOfEachMonth) {

    let date_format = checkDateFormat();
    let year = remainMonth_year;
    let Anvr_month = remainMonth_month
    let Anvr_DateVal = lastdayOfEachMonth;

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

    return newDate;

}



function checkDateFormat() {
    let context = nlapiGetContext();

    let dateFormatPref = context.getPreference('dateformat');

    return dateFormatPref;
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


});
