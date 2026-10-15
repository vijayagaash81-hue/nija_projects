function LMS_workResume_Maternity_AfterSubmit(type) 
{


	 if (type != 'delete') 
	 {
		 var _record_type = nlapiGetRecordType();
		 var _record_id = nlapiGetRecordId(); 
		
		 var todayDate = new Date();
		 
		 var _record_load = nlapiLoadRecord(_record_type,_record_id);
		 
		 var _status = _record_load.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
		 var work_resumption_done = _record_load.getFieldValue('custrecord_hris_lve_workresumptiondone');
		 var empployee_name = _record_load.getFieldValue('custrecord_hris_lve_employeename');
		 
		 var leave_type = _record_load.getFieldValue('custrecord_hris_lve_leavetype');
			
			var customrecord_hris_leaveconfigSearch = nlapiSearchRecord("customrecord_hris_leaveconfig",null,
			[
			   ["internalidnumber","equalto",leave_type]
			], 
			[
			   new nlobjSearchColumn("name").setSort(false), 
			   new nlobjSearchColumn("custrecord_hris_lvecnfg_seqno")
			]
			);
			
			var sequnce_no  = '';
			if(customrecord_hris_leaveconfigSearch)
			{
				 sequnce_no = customrecord_hris_leaveconfigSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lvecnfg_seqno"));
			}
		 
		 var work_resume = _record_load.getFieldValue('custrecord_hris_lve_workresume');
		 
		 if(_status == 2 && work_resumption_done == 'F' && work_resume == 'T' && sequnce_no == '11' )
		 {
			
			nlapiLogExecution('Debug','sequnce_no',sequnce_no);
			 
			
			
			var expected_resume_back_date = _record_load.getFieldValue('custrecord_hris_lve_expectedresumebackdt');
			
			var actual_work_resume_date = _record_load.getFieldValue('custrecord_hris_lve_actualresumedate');
			
			var leave_total_number_of_days = _record_load.getFieldValue('custrecord_hris_lve_totalnodays');
			
			var total_delay_days = _record_load.getFieldValue('custrecord_hris_lve_actualtotdelaydays');
			
			var total_updated_delay_days = _record_load.getFieldValue('custrecord_hris_lve_totalupdateddelayday');
			
			 var leave_from_date = _record_load.getFieldValue('custrecord_hris_lve_fromdate');
			 
			 var paid_leave_end_date = nlapiAddDays(nlapiStringToDate(leave_from_date),45);
			 
			 nlapiLogExecution('Debug','leave_from_date',leave_from_date);
			 nlapiLogExecution('Debug','paid_leave_end_date',paid_leave_end_date);
			 
			 function monthDiff(dateFrom, dateTo) 
			 {
				 return dateTo.getMonth() - dateFrom.getMonth() + 1+
				   (12 * (dateTo.getFullYear() - dateFrom.getFullYear()))
			 }
	
				var total_months_difference = monthDiff(new Date(nlapiStringToDate(leave_from_date)), new Date(paid_leave_end_date));
				
				
			 
			
			
			actual_work_resume_date = nlapiStringToDate(actual_work_resume_date);
			
			expected_resume_back_date = nlapiStringToDate(expected_resume_back_date);
			
			if(!total_delay_days || total_delay_days == '' || total_delay_days == null || total_delay_days == 'null' || total_delay_days == NaN || total_delay_days == 'NaN')
			{
				total_delay_days = 0;
			}
			
			total_delay_days = parseInt(total_delay_days);
			
			total_updated_delay_days = parseInt(total_updated_delay_days);
			
			 var search_pay_grp = search_paygroup(empployee_name);
			nlapiLogExecution('Debug','actual_work_resume_date',actual_work_resume_date);
			nlapiLogExecution('Debug','expected_resume_back_date',expected_resume_back_date);
			nlapiLogExecution('Debug','total_delay_days',total_delay_days);
			nlapiLogExecution('Debug','total_updated_delay_days',total_updated_delay_days);
			nlapiLogExecution('Debug','todayDate',todayDate);
			
			
			var date_day = todayDate.getDate();
					
		//////////////////////////////////////////Getting wage period details /////////////////////////////////////////////////////////////////////////////// 			
					

						var leave_month = actual_work_resume_date.getMonth() + 1;
						var leave_year = actual_work_resume_date.getFullYear();

						nlapiLogExecution('Debug', 'leave_month', leave_month);
						nlapiLogExecution('Debug', 'leave_year', leave_year);

						var leave_year_id = searchYear(leave_year);

						var arrear_month = leave_month;
						var current_month = todayDate.getMonth() + 1
						nlapiLogExecution('Debug', 'current_month', current_month);

						if (todayDate.getDate() > 24 && current_month == leave_month) // date crossed the 24th of the month so and current month and leave month is same so adding next wage period (leave month + 1)
						{
							leave_month = leave_month + 1;

							if (leave_month == 12) {
								leave_year = parseInt(leave_year) + 1;
								leave_year_id = searchYear(leave_year);
							}
						}

						if (current_month != leave_month && todayDate.getDate() < 25) // previous leave record wok resume not done then that time current month and leave month is not same so adding next wage period (leave month + 1)
						{
							leave_month = leave_month + 1;

							if (leave_month == 12) {
								leave_year = parseInt(leave_year) + 1;
								leave_year_id = searchYear(leave_year);
							}
						}
						
						
						nlapiLogExecution('Debug', 'unpaid creation month ', leave_month);
						nlapiLogExecution('Debug', 'unpaid creation year', leave_year);
						nlapiLogExecution('Debug', 'unpaid creation year id', leave_year_id);

						var finalDate = remFormatedDate(leave_year, leave_month, '01')

						var date = nlapiStringToDate(finalDate);

						var lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
					    var end_date = formatedDate(nlapiDateToString(lastDay));
                        nlapiLogExecution('DEBUG', 'formate end_date', end_date);
					
			////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
			
			
			
			
			if(work_resume == 'T')
			{
							if(empployee_name && leave_type && total_delay_days != 0 ) // update the leave balance if total delay days is less than 0 (employee early resumes )
							{
								//total_delay_days = Math.abs(total_delay_days);
								var customrecord_hris_leavebalanceSearch = nlapiSearchRecord("customrecord_hris_leavebalance",null,
								[
								   ["isinactive","is","F"], 
								   "AND", 
								   ["custrecord_hris_lvbal_employee_name","anyof",empployee_name], 
								   "AND", 
								  // ["custrecord_hris_lvbal_leave_type","anyof",1]
								   ["externalidstring","custrecord_hris_lvbal_leave_type","is","1"]
								 
								], 
								[
								   new nlobjSearchColumn("internalid"), 
								   new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"), 
								   new nlobjSearchColumn("custrecord_hris_lvbal_leave_balance_take")
								]
								);
								
								
								
								if(customrecord_hris_leavebalanceSearch)
								{
									 var internal_id = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("internalid")); 
									 
									 var _balace_record = nlapiLoadRecord('customrecord_hris_leavebalance',internal_id);
									 
									var avl_leave_bal = _balace_record.getFieldValue('custrecord_hris_lvbal_available_leave_ba');
									var leave_bal_taken = _balace_record.getFieldValue('custrecord_hris_lvbal_leave_balance_take');
									 
									if(!avl_leave_bal) 
									{
										avl_leave_bal = 0;
									}
									
									if(!leave_bal_taken) 
									{
										leave_bal_taken = 0;
									}
									
									
									
									leave_bal_taken  = parseFloat(leave_bal_taken) + parseFloat(total_delay_days);

									
									_balace_record.setFieldValue('custrecord_hris_lvbal_leave_balance_take',leave_bal_taken);

									
									var leave_balnce_submit = nlapiSubmitRecord(_balace_record,true,true);	
									nlapiLogExecution('Debug','leave_balnce_submit',leave_balnce_submit);
									
									 
								}

								if(total_delay_days > 0)
								{
									var filter = [];
									var column = [];
									// added by florence to get hris month
									leave_month= gethrisMonth(leave_month);
									filter.push(new nlobjSearchFilter('custrecord_hris_ule_leave_reference_no', null, 'is', _record_id));
									filter.push(new nlobjSearchFilter('custrecord_hris_ule_pay_group', null, 'is', search_pay_grp));
									filter.push(new nlobjSearchFilter('custrecord_hris_ule_month', null, 'is', leave_month));
									filter.push(new nlobjSearchFilter('custrecord_hris_ule_year', null, 'is', leave_year_id));
									filter.push(new nlobjSearchFilter('custrecord_hris_ule_leave_type', null, 'is', 3));

									filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));

									column.push(new nlobjSearchColumn('internalid'))
									var unpLeaveSearch = nlapiSearchRecord('customrecord_hris_unpaid_leave_entry', null, filter, column);

									if (!unpLeaveSearch) {
										nlapiLogExecution('DEBUG', 'Inside !unpLeaveSearch Create part')
										var end_date = formatedDate(nlapiDateToString(lastDay));
										nlapiLogExecution('DEBUG', 'formate end_date', end_date);
										var unpLeavRecord = nlapiCreateRecord('customrecord_hris_unpaid_leave_entry');
										unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_reference_no', _record_id);
										unpLeavRecord.setFieldValue('custrecord_hris_ule_employee_name', empployee_name);
										
										unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_type', 3);
										//unpLeavRecord.setFieldValue('custrecord_hris_ule_leave_type', 30);
										unpLeavRecord.setFieldValue('custrecord_hris_ule_noof_days', total_delay_days);
										unpLeavRecord.setFieldValue('custrecord_hris_ule_pay_group', search_pay_grp);
										unpLeavRecord.setFieldValue('custrecord_hris_ule_reason', 'Work Resumption');
										unpLeavRecord.setFieldValue('custrecord_hris_ule_pay_date', end_date);

										unpLeavRecord.setFieldValue('custrecord_hris_ule_month', leave_month);
										unpLeavRecord.setFieldValue('custrecord_hris_ule_year', leave_year_id);



										unpLeavRecord.setFieldValue('custrecord_hris_ule_final_days', total_delay_days);
										var createdRecordID = nlapiSubmitRecord(unpLeavRecord);
										nlapiLogExecution('DEBUG', 'createdRecordID unpaid', createdRecordID);


									} 
									else 
									{
										var unpaid_id = unpLeaveSearch[0].getId();

										var load_record = nlapiLoadRecord('customrecord_hris_unpaid_leave_entry', unpaid_id);

										var no_of_days = load_record.getFieldValue('custrecord_hris_ule_noof_days');

										no_of_days = parseInt(no_of_days) + total_delay_days;

										load_record.setFieldValue('custrecord_hris_ule_noof_days', no_of_days);
										
										load_record.setFieldValue('custrecord_hris_ule_final_days', no_of_days);

										var update_record = nlapiSubmitRecord(load_record);
										nlapiLogExecution('DEBUG', 'unpaid Update RecordID ', update_record);
									}
								}
									
							}
							
				var global_total_arrears_days = 45;
				nlapiLogExecution('Debug','total_months_difference',total_months_difference);
				
				leave_from_date = nlapiStringToDate(leave_from_date);
				for(var months = 1 ; months<=total_months_difference && global_total_arrears_days > 0 ; months++)
				{
					
					nlapiLogExecution('Debug','In For Loop $$$$$$$$$$$$$$$$$$$$$$');
					nlapiLogExecution('Debug','global_total_arrears_days','global_total_arrears_days-'+global_total_arrears_days);
					nlapiLogExecution('Debug','In For Loop $$$$$$$$$$$$$$$$$$$$$$ leave_from_date',leave_from_date);	
						
					var month_start_date = leave_from_date;
					
					if(months > 1)
					{
						nlapiLogExecution('Debug','In For Loop $$$$$$$$$$$$$$$$$$$$$$ month_start_date',month_start_date);
						month_start_date = nlapiAddMonths(month_start_date,(months-1)); // adding 1 month
						nlapiLogExecution('Debug','In For Loop &&&&&&&&&&&&&&&&&&&&&&&& month_start_date',month_start_date);
						month_start_date = new Date(month_start_date.getFullYear(), month_start_date.getMonth(), 1); // get month start date
					}
					
					nlapiLogExecution('Debug','month_start_date','month_start_date-'+month_start_date);
					var lastDay = new Date(month_start_date.getFullYear(), month_start_date.getMonth() + 1, 0);	// get month last date

					var arrear_month = month_start_date.getMonth()+1; // getting arrear month  
							
					
					nlapiLogExecution('Debug','lastDay','lastDay-'+lastDay);
					nlapiLogExecution('Debug','arrear_month','arrear_month-'+arrear_month);
					
					var oneDay = 24  * 60 * 60 * 1000;

					var daysDiff = Math.round((lastDay.getTime() - month_start_date.getTime()) / (oneDay))+1;
					nlapiLogExecution('Debug','daysDiff','daysDiff-'+daysDiff);
					
					if(daysDiff > global_total_arrears_days)
					{
						daysDiff = global_total_arrears_days
					}
					
					global_total_arrears_days = parseInt(global_total_arrears_days) - parseInt(daysDiff)
					
					//if(date_day < 25 )
					{
						
							if(empployee_name && leave_type)
							{
								
								//if(todayDate > expected_resume_back_date) // create arrears only if today date is greater than expected resume date
									{
										if(daysDiff > 0)// arrears create only greater than 0 days
										{
										// added by florence to get hris month
									leave_month= gethrisMonth(leave_month);
											var arrears_record = nlapiSearchRecord("customrecord_hris_unpaid_arrear_entry",null,
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
											   ["custrecord_hris_uae_arrear_month","is",arrear_month],
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
												var create_arrears = nlapiCreateRecord('customrecord_hris_unpaid_arrear_entry');
												
												create_arrears.setFieldValue('custrecord_hris_uae_employee_name',empployee_name);
												
												create_arrears.setFieldValue('custrecord_hris_uae_pay_group',search_pay_grp);
												
												create_arrears.setFieldValue('custrecord_hris_uae_pay_date',end_date);
												
												create_arrears.setFieldValue('custrecord_hris_uae_month',leave_month);
												
												create_arrears.setFieldValue('custrecord_hris_uae_year',leave_year_id);
												
												create_arrears.setFieldValue('custrecord_hris_uae_arrear_days',daysDiff);
												
												create_arrears.setFieldValue('custrecord_hris_uae_arrear_month',arrear_month);
												
												create_arrears.setFieldValue('custrecord_hris_uae_leave_reference_no',_record_id);
												
												create_arrears.setFieldValue('custrecord_hris_uae_remark','Unpaid Arrear entry against work resumption');
												
												var create_arrears = nlapiSubmitRecord(create_arrears,true,true);
												nlapiLogExecution('Debug','create_arrears submit',create_arrears);
											}
											else
											{
												var internal_id = arrears_record[0].getId();
												var load_record = nlapiLoadRecord('customrecord_hris_unpaid_arrear_entry',internal_id);
												
												load_record.setFieldValue('custrecord_hris_uae_arrear_days',daysDiff);
												
												var load_arrears_submit = nlapiSubmitRecord(load_record,true,true);
												nlapiLogExecution('Debug','load_arrears_submit',load_arrears_submit);
											}
										
											
										}
										
									}
								
								
								
							}
						
					}
									
					
					
							
				}
				
					
				
				
				_record_load.setFieldValue('custrecord_hris_lve_workresumptiondone','T');
				var leave_apl_submit = nlapiSubmitRecord(_record_load,true,true);
				nlapiLogExecution('Debug','leave_apl_submit-',leave_apl_submit);
				
			}
			 
		 }
		 
		 
	 }
	
//}
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

function search_paygroup(employee_name) {
    var filters = new Array();
    var columns = new Array();

    filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_name));
    filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    columns.push(new nlobjSearchColumn('internalid'));
    columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))

    columns[0].setSort(true);

    var s_result = nlapiSearchRecord('customrecord_hris_employee_compen_change', null, filters, columns)

    if (s_result != null) {
        var s_paygroup = s_result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp')
    } //End of if (s_result != null) 
    return s_paygroup
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



function _Is_Valid(value) //
{
    if (value != null && value != '' && value != 'undefined') // 
    {
        return true;
    }
    return false;
}

function remFormatedDate(remainMonth_year, remainMonth_month, lastdayOfEachMonth) {

    var date_format = checkDateFormat();
    var year = remainMonth_year;
    var Anvr_month = remainMonth_month
    var Anvr_DateVal = lastdayOfEachMonth;

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

    return newDate;

}



function checkDateFormat() {
    var context = nlapiGetContext();

    var dateFormatPref = context.getPreference('dateformat');

    return dateFormatPref;
}
