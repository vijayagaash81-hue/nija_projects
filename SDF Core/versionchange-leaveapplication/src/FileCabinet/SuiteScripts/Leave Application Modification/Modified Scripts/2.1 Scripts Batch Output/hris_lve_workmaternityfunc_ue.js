/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/runtime'], (record, search, runtime) => {

    function LMS_workResume_Maternity_AfterSubmit(type) 
    {
    
    
    	 if (type != 'delete') 
    	 {
    		 const _record_type = (scriptContext.newRecord ? scriptContext.newRecord.type : scriptContext.currentRecord.type);
    		 const _record_id = (scriptContext.newRecord ? scriptContext.newRecord.id : scriptContext.currentRecord.id); 
    		
    		 const todayDate = new Date();
    		 
    		 const _record_load = record.load({ type: _record_type, id: _record_id });
    		 
    		 const _status = _record_load.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
    		 const work_resumption_done = _record_load.getFieldValue('custrecord_hris_lve_workresumptiondone');
    		 const empployee_name = _record_load.getFieldValue('custrecord_hris_lve_employeename');
    		 
    		 const leave_type = _record_load.getFieldValue('custrecord_hris_lve_leavetype');
    			
    			const customrecord_hris_leaveconfigSearch = search.create({ type: "customrecord_hris_leaveconfig", filters: [
    			   ["internalidnumber", columns: "equalto",leave_type]
    			], 
    			[
    			   new nlobjSearchColumn("name" }).run().setSort(false), 
    			   new nlobjSearchColumn("custrecord_hris_lvecnfg_seqno")
    			]
    			);
    			
    			const sequnce_no  = '';
    			if(customrecord_hris_leaveconfigSearch)
    			{
    				 sequnce_no = customrecord_hris_leaveconfigSearch[0].getValue(new nlobjSearchColumn("custrecord_hris_lvecnfg_seqno"));
    			}
    		 
    		 const work_resume = _record_load.getFieldValue('custrecord_hris_lve_workresume');
    		 
    		 if(_status == 2 && work_resumption_done == 'F' && work_resume == 'T' && sequnce_no == '11' )
    		 {
    			
    			log.debug({ title: 'sequnce_no', details: sequnce_no });
    			 
    			
    			
    			const expected_resume_back_date = _record_load.getFieldValue('custrecord_hris_lve_expectedresumebackdt');
    			
    			const actual_work_resume_date = _record_load.getFieldValue('custrecord_hris_lve_actualresumedate');
    			
    			const leave_total_number_of_days = _record_load.getFieldValue('custrecord_hris_lve_totalnodays');
    			
    			const total_delay_days = _record_load.getFieldValue('custrecord_hris_lve_actualtotdelaydays');
    			
    			const total_updated_delay_days = _record_load.getFieldValue('custrecord_hris_lve_totalupdateddelayday');
    			
    			 const leave_from_date = _record_load.getFieldValue('custrecord_hris_lve_fromdate');
    			 
    			 const paid_leave_end_date = nlapiAddDays(nlapiStringToDate(leave_from_date),45);
    			 
    			 log.debug({ title: 'leave_from_date', details: leave_from_date });
    			 log.debug({ title: 'paid_leave_end_date', details: paid_leave_end_date });
    			 
    			 function monthDiff(dateFrom, dateTo) 
    			 {
    				 return dateTo.getMonth() - dateFrom.getMonth() + 1+
    				   (12 * (dateTo.getFullYear() - dateFrom.getFullYear()))
    			 }
    	
    				const total_months_difference = monthDiff(new Date(nlapiStringToDate(leave_from_date)), new Date(paid_leave_end_date));
    				
    				
    			 
    			
    			
    			actual_work_resume_date = nlapiStringToDate(actual_work_resume_date);
    			
    			expected_resume_back_date = nlapiStringToDate(expected_resume_back_date);
    			
    			if(!total_delay_days || total_delay_days == '' || total_delay_days == null || total_delay_days == 'null' || total_delay_days == NaN || total_delay_days == 'NaN')
    			{
    				total_delay_days = 0;
    			}
    			
    			total_delay_days = parseInt(total_delay_days);
    			
    			total_updated_delay_days = parseInt(total_updated_delay_days);
    			
    			 const search_pay_grp = search_paygroup(empployee_name);
    			log.debug({ title: 'actual_work_resume_date', details: actual_work_resume_date });
    			log.debug({ title: 'expected_resume_back_date', details: expected_resume_back_date });
    			log.debug({ title: 'total_delay_days', details: total_delay_days });
    			log.debug({ title: 'total_updated_delay_days', details: total_updated_delay_days });
    			log.debug({ title: 'todayDate', details: todayDate });
    			
    			
    			const date_day = todayDate.getDate();
    					
    		//////////////////////////////////////////Getting wage period details /////////////////////////////////////////////////////////////////////////////// 			
    					
    
    						const leave_month = actual_work_resume_date.getMonth() + 1;
    						const leave_year = actual_work_resume_date.getFullYear();
    
    						log.debug({ title: 'leave_month', details: leave_month });
    						log.debug({ title: 'leave_year', details: leave_year });
    
    						const leave_year_id = searchYear(leave_year);
    
    						const arrear_month = leave_month;
    						const current_month = todayDate.getMonth() + 1
    						log.debug({ title: 'current_month', details: current_month });
    
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
    						
    						
    						log.debug({ title: 'unpaid creation month ', details: leave_month });
    						log.debug({ title: 'unpaid creation year', details: leave_year });
    						log.debug({ title: 'unpaid creation year id', details: leave_year_id });
    
    						const finalDate = remFormatedDate(leave_year, leave_month, '01')
    
    						const date = nlapiStringToDate(finalDate);
    
    						const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    					    const end_date = formatedDate(nlapiDateToString(lastDay));
                            log.debug({ title: 'formate end_date', details: end_date });
    					
    			////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    			
    			
    			
    			
    			if(work_resume == 'T')
    			{
    							if(empployee_name && leave_type && total_delay_days != 0 ) // update the leave balance if total delay days is less than 0 (employee early resumes )
    							{
    								//total_delay_days = Math.abs(total_delay_days);
    								const customrecord_hris_leavebalanceSearch = search.create({ type: "customrecord_hris_leavebalance", filters: [
    								   ["isinactive", columns: "is","F"], 
    								   "AND", 
    								   ["custrecord_hris_lvbal_employee_name","anyof",empployee_name], 
    								   "AND", 
    								  // ["custrecord_hris_lvbal_leave_type","anyof",1]
    								   ["externalidstring","custrecord_hris_lvbal_leave_type","is","1"]
    								 
    								], 
    								[
    								   new nlobjSearchColumn("internalid" }).run(), 
    								   new nlobjSearchColumn("custrecord_hris_lvbal_available_leave_ba"), 
    								   new nlobjSearchColumn("custrecord_hris_lvbal_leave_balance_take")
    								]
    								);
    								
    								
    								
    								if(customrecord_hris_leavebalanceSearch)
    								{
    									 const internal_id = customrecord_hris_leavebalanceSearch[0].getValue(new nlobjSearchColumn("internalid")); 
    									 
    									 const _balace_record = record.load({ type: 'customrecord_hris_leavebalance', id: internal_id });
    									 
    									const avl_leave_bal = _balace_record.getFieldValue('custrecord_hris_lvbal_available_leave_ba');
    									const leave_bal_taken = _balace_record.getFieldValue('custrecord_hris_lvbal_leave_balance_take');
    									 
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
    
    									
    									const leave_balnce_submit = _balace_record.save();	
    									log.debug({ title: 'leave_balnce_submit', details: leave_balnce_submit });
    									
    									 
    								}
    
    								if(total_delay_days > 0)
    								{
    									const filter = [];
    									const column = [];
    									// added by florence to get hris month
    									leave_month= gethrisMonth(leave_month);
    									filter.push(new nlobjSearchFilter('custrecord_hris_ule_leave_reference_no', null, 'is', _record_id));
    									filter.push(new nlobjSearchFilter('custrecord_hris_ule_pay_group', null, 'is', search_pay_grp));
    									filter.push(new nlobjSearchFilter('custrecord_hris_ule_month', null, 'is', leave_month));
    									filter.push(new nlobjSearchFilter('custrecord_hris_ule_year', null, 'is', leave_year_id));
    									filter.push(new nlobjSearchFilter('custrecord_hris_ule_leave_type', null, 'is', 3));
    
    									filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    
    									column.push(new nlobjSearchColumn('internalid'))
    									const unpLeaveSearch = search.create({ type: 'customrecord_hris_unpaid_leave_entry', filters: filter, columns: column }).run();
    
    									if (!unpLeaveSearch) {
    										log.debug({ title: 'Inside !unpLeaveSearch Create part', details: '' })
    										const end_date = formatedDate(nlapiDateToString(lastDay));
    										log.debug({ title: 'formate end_date', details: end_date });
    										const unpLeavRecord = nlapiCreateRecord('customrecord_hris_unpaid_leave_entry');
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
    										const createdRecordID = unpLeavRecord.save();
    										log.debug({ title: 'createdRecordID unpaid', details: createdRecordID });
    
    
    									} 
    									else 
    									{
    										const unpaid_id = unpLeaveSearch[0].getId();
    
    										const load_record = record.load({ type: 'customrecord_hris_unpaid_leave_entry', id: unpaid_id });
    
    										const no_of_days = load_record.getFieldValue('custrecord_hris_ule_noof_days');
    
    										no_of_days = parseInt(no_of_days) + total_delay_days;
    
    										load_record.setFieldValue('custrecord_hris_ule_noof_days', no_of_days);
    										
    										load_record.setFieldValue('custrecord_hris_ule_final_days', no_of_days);
    
    										const update_record = load_record.save();
    										log.debug({ title: 'unpaid Update RecordID ', details: update_record });
    									}
    								}
    									
    							}
    							
    				const global_total_arrears_days = 45;
    				log.debug({ title: 'total_months_difference', details: total_months_difference });
    				
    				leave_from_date = nlapiStringToDate(leave_from_date);
    				for(const months = 1 ; months<=total_months_difference && global_total_arrears_days > 0 ; months++)
    				{
    					
    					log.debug({ title: 'In For Loop $$$$$$$$$$$$$$$$$$$$$$', details: '' });
    					log.debug({ title: 'global_total_arrears_days', details: 'global_total_arrears_days-'+global_total_arrears_days });
    					log.debug({ title: 'In For Loop $$$$$$$$$$$$$$$$$$$$$$ leave_from_date', details: leave_from_date });	
    						
    					const month_start_date = leave_from_date;
    					
    					if(months > 1)
    					{
    						log.debug({ title: 'In For Loop $$$$$$$$$$$$$$$$$$$$$$ month_start_date', details: month_start_date });
    						month_start_date = nlapiAddMonths(month_start_date,(months-1)); // adding 1 month
    						log.debug({ title: 'In For Loop &&&&&&&&&&&&&&&&&&&&&&&& month_start_date', details: month_start_date });
    						month_start_date = new Date(month_start_date.getFullYear(), month_start_date.getMonth(), 1); // get month start date
    					}
    					
    					log.debug({ title: 'month_start_date', details: 'month_start_date-'+month_start_date });
    					const lastDay = new Date(month_start_date.getFullYear(), month_start_date.getMonth() + 1, 0);	// get month last date
    
    					const arrear_month = month_start_date.getMonth()+1; // getting arrear month  
    							
    					
    					log.debug({ title: 'lastDay', details: 'lastDay-'+lastDay });
    					log.debug({ title: 'arrear_month', details: 'arrear_month-'+arrear_month });
    					
    					const oneDay = 24  * 60 * 60 * 1000;
    
    					const daysDiff = Math.round((lastDay.getTime() - month_start_date.getTime()) / (oneDay))+1;
    					log.debug({ title: 'daysDiff', details: 'daysDiff-'+daysDiff });
    					
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
    											const arrears_record = search.create({ type: "customrecord_hris_unpaid_arrear_entry", filters: [
    											   ["isinactive", columns: "is","F"], 
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
    											   new nlobjSearchColumn("internalid" }).run()
    											   
    											]
    											);
    										
    										
    											if(!arrears_record)
    											{										
    												log.debug({ title: 'Arrear creation below 25', details: '' });
    												const create_arrears = nlapiCreateRecord('customrecord_hris_unpaid_arrear_entry');
    												
    												create_arrears.setFieldValue('custrecord_hris_uae_employee_name',empployee_name);
    												
    												create_arrears.setFieldValue('custrecord_hris_uae_pay_group',search_pay_grp);
    												
    												create_arrears.setFieldValue('custrecord_hris_uae_pay_date',end_date);
    												
    												create_arrears.setFieldValue('custrecord_hris_uae_month',leave_month);
    												
    												create_arrears.setFieldValue('custrecord_hris_uae_year',leave_year_id);
    												
    												create_arrears.setFieldValue('custrecord_hris_uae_arrear_days',daysDiff);
    												
    												create_arrears.setFieldValue('custrecord_hris_uae_arrear_month',arrear_month);
    												
    												create_arrears.setFieldValue('custrecord_hris_uae_leave_reference_no',_record_id);
    												
    												create_arrears.setFieldValue('custrecord_hris_uae_remark','Unpaid Arrear entry against work resumption');
    												
    												const create_arrears = create_arrears.save();
    												log.debug({ title: 'create_arrears submit', details: create_arrears });
    											}
    											else
    											{
    												const internal_id = arrears_record[0].getId();
    												const load_record = record.load({ type: 'customrecord_hris_unpaid_arrear_entry', id: internal_id });
    												
    												load_record.setFieldValue('custrecord_hris_uae_arrear_days',daysDiff);
    												
    												const load_arrears_submit = load_record.save();
    												log.debug({ title: 'load_arrears_submit', details: load_arrears_submit });
    											}
    										
    											
    										}
    										
    									}
    								
    								
    								
    							}
    						
    					}
    									
    					
    					
    							
    				}
    				
    					
    				
    				
    				_record_load.setFieldValue('custrecord_hris_lve_workresumptiondone','T');
    				const leave_apl_submit = _record_load.save();
    				log.debug({ title: 'leave_apl_submit-', details: leave_apl_submit });
    				
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
        const filters = new Array();
        const columns = new Array();
    
        filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_name));
        filters.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
        columns.push(new nlobjSearchColumn('internalid'));
        columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))
    
        columns[0].setSort(true);
    
        const s_result = search.create({ type: 'customrecord_hris_employee_compen_change', filters: filters, columns: columns }).run()
    
        if (s_result != null) {
            const s_paygroup = s_result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp')
        } //End of if (s_result != null) 
        return s_paygroup
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
    
    
    
    function _Is_Valid(value) //
    {
        if (value != null && value != '' && value != 'undefined') // 
        {
            return true;
        }
        return false;
    }
    
    function remFormatedDate(remainMonth_year, remainMonth_month, lastdayOfEachMonth) {
    
        const date_format = checkDateFormat();
        const year = remainMonth_year;
        const Anvr_month = remainMonth_month
        const Anvr_DateVal = lastdayOfEachMonth;
    
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
    
        return newDate;
    
    }
    
    
    
    function checkDateFormat() {
        const context = runtime;
    
        const dateFormatPref = context.getPreference('dateformat');
    
        return dateFormatPref;
    }

    return {
        LMS_workResume_Maternity_AfterSubmit: LMS_workResume_Maternity_AfterSubmit
    };
});
