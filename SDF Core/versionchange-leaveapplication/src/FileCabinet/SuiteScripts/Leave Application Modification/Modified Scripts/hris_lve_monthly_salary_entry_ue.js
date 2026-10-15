

function UES_Monthly_salary_entry(type)
{
	

	if (type != 'delete') 
	{
		
		var recordId = nlapiGetRecordId()
		nlapiLogExecution('DEBUG', 'recordId', recordId)
		var o_leaveApp = nlapiLoadRecord('customrecord_hris_leaveapplication', recordId)
		
		var emp_Id = o_leaveApp.getFieldValue('custrecord_hris_lve_employeename')
		nlapiLogExecution('DEBUG','WFH ', 'emp_Id --> '+ emp_Id)
		
		var Leave_type = o_leaveApp.getFieldValue('custrecord_hris_lve_leavetype')
		nlapiLogExecution('DEBUG','WFH ', 'Leave_type --> '+ Leave_type)
		
		
		//var leaveTypeRecord = nlapiLoadRecord('customrecord_hris_leaveconfig', Leave_type);
		var leaveRefNo = o_leaveApp.getFieldValue('name');
		var LeaveApplication_Status = o_leaveApp.getFieldValue('custrecord_hris_lve_hrmsapprovalstatus');
		 nlapiLogExecution('DEBUG','WFH ', 'LeaveApplication_Status --> '+ LeaveApplication_Status)
		 
		var leaveCancelStatus = o_leaveApp.getFieldValue('custrecord_hris_lve_cancel_leavestatus');
		 
		var cancel_check = o_leaveApp.getFieldValue('custrecord_hris_lve_cancellation');
		
		var salAmt = o_leaveApp.getFieldValue('custrecord_hris_lve_airticketamount');
		
	//	var airTicketChk = o_leaveApp.getFieldValue('custrecord_hris_lve_airticketapplicable');
		
		var airTicketChk = o_leaveApp.getFieldValue('custrecord_hris_lve_airticketrequired');
		nlapiLogExecution('DEBUG', 'LeaveApplication_Status', LeaveApplication_Status)
		nlapiLogExecution('DEBUG', 'cancel_check', cancel_check)
		nlapiLogExecution('DEBUG', 'airTicketChk', airTicketChk)
		var seq_no = get_sequence_no(Leave_type)
		if(airTicketChk == 'T' && cancel_check=='F' && LeaveApplication_Status=='2')
		{
			
		var fromDate = o_leaveApp.getFieldValue('custrecord_hris_lve_fromdate');
		nlapiLogExecution('DEBUG', 'Integration fromDate', fromDate);
		    fromDate = nlapiStringToDate(fromDate)
		var search_pay_grp = get_paygroup(emp_Id);
		var payComp = searchPayComp(search_pay_grp)
		
		
			fromDate = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0);
            var lastDayDate_frmDate = fromDate.getDate();
            var lastDayMonth_frmDate = fromDate.getMonth()+1;
            var lastDayYear_frmDate = fromDate.getFullYear();
			
			var finalDate_toDate = remFormatedDate(lastDayYear_frmDate, lastDayMonth_frmDate, lastDayDate_frmDate)
			nlapiLogExecution('DEBUG', 'Integration finalDate_toDate', finalDate_toDate)
		    nlapiLogExecution('DEBUG', 'payComp',payComp)
			
			var year = lastDayYear_frmDate;	
					    year = year.toString();
					var YearId = searchYear(year);
					
			var filter = [];
			var column = [];
			
			//filter.push(new nlobjSearchFilter('custrecord_apm_pc_pay_pro_grp', null, 'anyof', search_pay_grp));
			filter.push(new nlobjSearchFilter('custrecord_hris_mthsal_empname', null, 'is', emp_Id));
			filter.push(new nlobjSearchFilter('custrecord_hris_mthsal_year', null, 'is', YearId));
			//filter.push(new nlobjSearchFilter('custrecord_hris_mthsal_month', null, 'is', lastDayMonth_frmDate));
			filter.push(new nlobjSearchFilter('custrecord_hris_mthsal_paycomponent', null, 'is', payComp));
          filter.push(new nlobjSearchFilter('custrecord_hris_mthsal_msileaverefno', null, 'anyof', recordId));
			filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
			
			var search = nlapiSearchRecord('customrecord_hris_monthlysalinput', null, filter, column)
			if(search == null)
			{
				var msi_rec = nlapiCreateRecord('customrecord_hris_monthlysalinput');
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
				
			var id = nlapiSubmitRecord(msi_rec, true, true);
			nlapiLogExecution('DEBUG', 'created id', id);
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
	var yearVal = '';
	year = year.toString();
	nlapiLogExecution('DEBUG', 'Year in searchYear function', year);
	var filter = [];
    filter.push(new nlobjSearchFilter('name', null, 'contains', year));
    filter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
    
    var column = [];
    column.push(new nlobjSearchColumn('internalid'));
    
    var search = nlapiSearchRecord('customlist_hris_year_master', null, filter, column);
  if(search){
	  yearVal = search[0].getValue('internalid')
  }
  nlapiLogExecution('DEBUG', 'yearVal in SearchYear  Func', yearVal);
    return yearVal;  
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


function get_paygroup(employee_id)
{   
    var filters = new Array();
    var columns = new Array();
    filters.push(new nlobjSearchFilter('custrecord_hris_empchange_employee_nam', null, 'is', employee_id));
	filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
    columns.push(new nlobjSearchColumn('custrecord_hris_empchange_emp_pay_pro_gp'))
    
    var result = nlapiSearchRecord('customrecord_hris_employee_compen_change', null, filters, columns)
    
    if (result != null) 
	{
        var paygroup = result[0].getValue('custrecord_hris_empchange_emp_pay_pro_gp') 
    }//End of if (result != null)
    return paygroup;
}//End of function get_paygroup(employee_id)




function searchPayComp(i_paygroup_earn)
{
	var PTID;
	var Filters = new Array();
	Filters.push(new nlobjSearchFilter('custrecord_hris_pay_process_group', null, 'is',i_paygroup_earn));
	Filters.push(new nlobjSearchFilter('custrecord_hris__sequence_no_', null, 'equalto',36));
	Filters.push(new nlobjSearchFilter('isinactive', null, 'is','F'));
	var column = new Array();
	column.push(new nlobjSearchColumn('internalid'));	
	var searchPTCheck= nlapiSearchRecord('customrecord_hris_payroll_component',null, Filters, column);		
	if(searchPTCheck !=null)
	{
		PTID = searchPTCheck[0].getValue('internalid');	
	}//End if(searchNetCheck !=null)
	return PTID;
}//searchPTId(i_paygroup_earn)




  function remFormatedDate(remainMonth_year, remainMonth_month, lastdayOfEachMonth){
	            
	            var date_format = checkDateFormat();
				var year        = remainMonth_year;
				var Anvr_month  = remainMonth_month
				var Anvr_DateVal = lastdayOfEachMonth;
				
				if (date_format == 'YYYY-MM-DD')
		  		{
		  	 var newDate = year + '-' + Anvr_month + '-' + Anvr_DateVal;
		  		}
		 		 if (date_format == 'DD/MM/YYYY' || date_format == 'D/M/YYYY')
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

