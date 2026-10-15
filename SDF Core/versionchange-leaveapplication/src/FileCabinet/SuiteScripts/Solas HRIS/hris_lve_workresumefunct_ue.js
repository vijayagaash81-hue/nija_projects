

function LMS_workResume_AfterSubmit(type) 
{
    var custformscript =nlapiGetFieldValue('custrecord_hris_lve_script_version');
   nlapiLogExecution("DEBUG","custformscript",custformscript)
if (custformscript == 1){ 

	
	 if (type != 'delete' && type != 'create')  {
		 

		 
		 var _record_type = nlapiGetRecordType();
		 var _record_id = nlapiGetRecordId();
		 
		// var todayDate = new Date();
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
		 
		 
		 	nlapiLogExecution('Debug','_status@@@',_status);
		 	nlapiLogExecution('Debug','work_resumption_done@@@',work_resumption_done);
		 	nlapiLogExecution('Debug','sequnce_no@@@',sequnce_no);
		 	nlapiLogExecution('Debug','ENTER1@@@','ENTER1');


		 if(_status == 2 && work_resumption_done == 'F' && sequnce_no != '11' && sequnce_no != '22' )//&& empployee_name == 466163
		 {
			
			
			nlapiLogExecution('Debug','ENTER2@@@','ENTER2');

			
			nlapiLogExecution('Debug','sequnce_no',sequnce_no);
			 
			var work_resume = _record_load.getFieldValue('custrecord_hris_lve_workresume');
			
			var expected_resume_back_date = _record_load.getFieldValue('custrecord_hris_lve_expectedresumebackdt');
			
			var actual_work_resume_date = _record_load.getFieldValue('custrecord_hris_lve_actualresumedate');
			
			var leave_total_number_of_days = _record_load.getFieldValue('custrecord_hris_lve_totalnodays');
			
			var total_delay_days = _record_load.getFieldValue('custrecord_hris_lve_actualtotdelaydays');
			
			var total_updated_delay_days = _record_load.getFieldValue('custrecord_hris_lve_totalupdateddelaydays');
			
			 var leave_from_date = _record_load.getFieldValue('custrecord_hris_lve_fromdate');
			
			
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
			nlapiLogExecution('Debug','search_pay_grp',search_pay_grp);
			
			var date_day = todayDate.getDate();
			
			var get_wage_date = search_wageperiod(search_pay_grp);
			var w_Date = get_wage_date.toString().split('#');
			var end_date = w_Date[0];
			var start_date = w_Date[1];
			
			var leave_month = w_Date[2];//mth.getMonth() + 1;
			var leave_year_id = w_Date[3];//mth.getFullYear();
			var mth = nlapiStringToDate(leave_from_date).getMonth()+1;
			var arrear_month = mth;
					
		

			nlapiLogExecution('Debug','_WorkResume#######@@@@@',_record_load.getFieldValue('custrecord_lms_leave_resume'));
			if(work_resume == 'T')
			{
				
				nlapiLogExecution('Debug','ENTER####################','ENTER');
				
				
				_record_load.setFieldValue('custrecord_hris_lve_workresumptiondone','T');
				var leave_apl_submit = nlapiSubmitRecord(_record_load,true,true);
				nlapiLogExecution('Debug','leave_apl_submit-',leave_apl_submit);
				
			}
			 
		 }
		 
		 
	 }
	
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
