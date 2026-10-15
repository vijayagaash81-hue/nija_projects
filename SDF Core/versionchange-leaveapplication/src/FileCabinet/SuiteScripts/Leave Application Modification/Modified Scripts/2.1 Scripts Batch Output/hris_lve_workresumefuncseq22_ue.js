/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/runtime'], (record, search, runtime) => {

    
    
    
    
    function LMS_workResume_AfterSubmit(type) 
    {
    	
    	 if (type != 'delete' && type != 'create') 
    	 {
    		 const _record_type = (scriptContext.newRecord ? scriptContext.newRecord.type : scriptContext.currentRecord.type);
    		 const _record_id = (scriptContext.newRecord ? scriptContext.newRecord.id : scriptContext.currentRecord.id);
    		 
    		// const todayDate = new Date();
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
    		  const cancel_check = _record_load.getFieldValue('custrecord_hris_lve_cancellation');
    		  log.debug({ title: 'work_resumption_done', details: work_resumption_done });
    		 
    		 if(work_resume == 'T' && _status == 2 && work_resumption_done == 'F' && cancel_check =='F' && sequnce_no != '11' && sequnce_no != '22' )//&& empployee_name == 466163
    		 {
    			
    			
    			
    			
    			log.debug({ title: 'sequnce_no', details: sequnce_no });
    			 
    			
    			
    			const expected_resume_back_date = _record_load.getFieldValue('custrecord_hris_lve_expectedresumebackdt');
    			
    			const actual_work_resume_date = _record_load.getFieldValue('custrecord_hris_lve_actualresumedate');
    			
    			const leave_total_number_of_days = _record_load.getFieldValue('custrecord_hris_lve_totalnodays');
    			
    			const total_delay_days = _record_load.getFieldValue('custrecord_hris_lve_actualtotdelaydays');
    			
    			
    			const total_updated_delay_days = _record_load.getFieldValue('custrecord_hris_lve_totalupdateddelayday')||0;
    			
    			 const leave_from_date = _record_load.getFieldValue('custrecord_hris_lve_fromdate');
    			
    			
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
    			
    			const get_wage_date = search_wageperiod(search_pay_grp);
    			const w_Date = get_wage_date.toString().split('#');
    			log.debug({ title: 'w_Date', details: w_Date });
    			const end_date = w_Date[0];
    			log.debug({ title: 'end_date', details: end_date });
    			const start_date = w_Date[1];
    			log.debug({ title: 'start_date', details: start_date });
    			const leave_month = w_Date[2];//mth.getMonth() + 1;
    			log.debug({ title: 'leave_month', details: leave_month });
    			const leave_year_id = w_Date[3];//mth.getFullYear();
    			log.debug({ title: 'leave_year_id', details: leave_year_id });
    			//const mth = nlapiStringToDate(actual_work_resume_date).getMonth()+1;
    			log.debug({ title: 'actual_work_resume_date1', details: actual_work_resume_date });
    			const mth = actual_work_resume_date;
    			log.debug({ title: 'mth1', details: mth });
    			mth = mth.getMonth()+1;
    			log.debug({ title: 'mth', details: mth });
    			const arrear_month = mth;
    					
    	
    			
    			
    			if(work_resume == 'T')
    			{
    				if((actual_work_resume_date < todayDate || total_delay_days < total_updated_delay_days) && sequnce_no != '2' )
    				{
    					
    					log.debug({ title: 'Called Sequence not equal to 2 $$$$$$$$$$$$$$$$$$$$$$', details: '' });
    							
    							if(empployee_name && leave_type && total_delay_days < 0) // update the leave balance if total delay days is less than 0 (employee early resumes )
    							{
    								total_delay_days = Math.abs(total_delay_days);
    								const customrecord_hris_leavebalanceSearch = search.create({ type: "customrecord_hris_leavebalance", filters: [
    								   ["isinactive", columns: "is","F"], 
    								   "AND", 
    								   ["custrecord_hris_lvbal_employee_name","anyof",empployee_name], 
    								   "AND", 
    								   ["custrecord_hris_lvbal_leave_type","anyof",leave_type]
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
    									
    									avl_leave_bal = parseFloat(avl_leave_bal) + parseFloat(total_delay_days)
    									
    									leave_bal_taken  = parseFloat(leave_bal_taken) - parseFloat(total_delay_days);
    
    									if(sequnce_no != '2')// if unpaid not equal to
    									{
    										_balace_record.setFieldValue('custrecord_hris_lvbal_available_leave_ba',avl_leave_bal);
    									}
    									
    									_balace_record.setFieldValue('custrecord_hris_lvbal_leave_balance_take',leave_bal_taken);
    
    									
    									const leave_balnce_submit = _balace_record.save();	
    									log.debug({ title: 'leave_balnce_submit', details: leave_balnce_submit });
    									
    									 
    								}	
    							}
    							else if(total_delay_days > 0)
    							{
    								const customrecord_hris_leavebalanceSearch = search.create({ type: "customrecord_hris_leavebalance", filters: [
    								   ["isinactive", columns: "is","F"], 
    								   "AND", 
    								   ["custrecord_hris_lvbal_employee_name","anyof",empployee_name], 
    								   "AND", 
    								   ["custrecord_hris_lvbal_leave_type.custrecord_hris_lvecnfg_seqno","equalto","2"]
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
    									 
    									
    									const leave_bal_taken = _balace_record.getFieldValue('custrecord_hris_lvbal_leave_balance_take');
    									 
    									
    									
    									if(!leave_bal_taken) 
    									{
    										leave_bal_taken = 0;
    									}
    									
    									
    									leave_bal_taken  = (parseFloat(leave_bal_taken) +  parseFloat(total_delay_days)); // it will deduct if negative value and it will add if positive value
    
    									_balace_record.setFieldValue('custrecord_hris_lvbal_leave_balance_take',leave_bal_taken);
    
    									
    									const leave_balnce_submit = _balace_record.save();	
    									log.debug({ title: 'leave_balnce_submit for sequnce_no 2', details: leave_balnce_submit });
    									
    								
    								}
    							}
    					
    					
    					//if(date_day < 25 )
    					{
    						
    							if(empployee_name && leave_type)
    							{
    								
    								if(todayDate > expected_resume_back_date) // create arrears only if today date is greater than expected resume date
    									{
    									log.debug({ title: 'create arrear entry', details: '' });	
    									// calculating the arears days based on the below condition, calculate date is nothing but	
    										if(actual_work_resume_date < expected_resume_back_date)
    										{
    											const calculate_date = expected_resume_back_date
    										}
    										else
    										{
    											const calculate_date = actual_work_resume_date
    										}
    											
    										
    										const oneDay = 24  * 60 * 60 * 1000;
    
    										const daysDiff = Math.round((todayDate.getTime() - calculate_date.getTime()) / (oneDay));
    										
    										log.debug({ title: 'create arrear entry daysDiff', details: daysDiff });
    										if(daysDiff > 0)// arrears create only greater than 0 days
    										{
    										
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
    				
    				if(sequnce_no == '2')
    				{
    					log.debug({ title: 'Called Sequence equal to 2 ***********************', details: '' });
    					
    						if(empployee_name && leave_type ) // update the leave balance if total delay days is 
    							{
    								//total_delay_days = Math.abs(total_delay_days);
    								const customrecord_hris_leavebalanceSearch = search.create({ type: "customrecord_hris_leavebalance", filters: [
    								   ["isinactive", columns: "is","F"], 
    								   "AND", 
    								   ["custrecord_hris_lvbal_employee_name","anyof",empployee_name], 
    								   "AND", 
    								   ["custrecord_hris_lvbal_leave_type","anyof",leave_type]
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
    									 
    									
    									const leave_bal_taken = _balace_record.getFieldValue('custrecord_hris_lvbal_leave_balance_take');
    									 
    									
    									
    									if(!leave_bal_taken) 
    									{
    										leave_bal_taken = 0;
    									}
    									
    									
    									leave_bal_taken  = (parseFloat(leave_bal_taken) +  parseFloat(total_delay_days)); // it will deduct if negative value and it will add if positive value
    
    									_balace_record.setFieldValue('custrecord_hris_lvbal_leave_balance_take',leave_bal_taken);
    
    									
    									const leave_balnce_submit = _balace_record.save();	
    									log.debug({ title: 'leave_balnce_submit for sequnce_no 2', details: leave_balnce_submit });
    									
    									
    									
    										const oneDay = 24  * 60 * 60 * 1000;
    
    										const daysDiff = Math.round((actual_work_resume_date.getTime() - todayDate.getTime()) / (oneDay));
    										
    										
    										if(daysDiff > 0)// arrears create only greater than 0 days
    										{
    										
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
    											   ["custrecord_hris_uae_leave_reference_no","is",_record_id]
    											], 
    											[
    											   new nlobjSearchColumn("internalid" }).run()
    											   
    											]
    											);
    										
    										
    											if(!arrears_record)
    											{										
    												log.debug({ title: 'Arrear creation for sequnce_no 2', details: '' });
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
    												log.debug({ title: 'load_arrears_submit for sequnce_no 2', details: load_arrears_submit });
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

    return {
        LMS_workResume_AfterSubmit: LMS_workResume_AfterSubmit
    };
});
