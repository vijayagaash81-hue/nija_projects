function valid_beforeSubmitRecord(type) {
 /*  var customform = nlapiGetFieldValue('customform');
  nlapiLogExecution('DEBUG','customform',customform);
  inf (customform == 204) { */
    var s_rec_type = nlapiGetRecordType();
    nlapiLogExecution(
      "DEBUG",
      "afterSubmit_emp_data_chnage --> s_rec_type:" + s_rec_type
    );
    var s_emp_identification = nlapiGetFieldValue(
      "custrecord_hris_empchange_emp_identify"
    );
    var b_check = isValid(s_emp_identification);
  }
//}
function AfterRecSubmitgross_total(type) {
  /* var customform = nlapiGetFieldValue('customform');
  log.debug('customform', customform);
  if (customform == 204) { */
   if (type == 'delete') {
        nlapiLogExecution('DEBUG', 'Exit Script', 'Record is in delete mode');
        return;
    }
    nlapiLogExecution("DEBUG", "AfterSubmit");
    var i_total_monthly_earn = 0.0;
    var i_total_monthly_ded = 0.0;
    var i_total_monthly_others = 0.0;
    var i_total_annually_earn = 0.0;
    var i_total_bi_monthly_earn = 0.0;
    var i_total_daily_earn = 0.0;
    var i_total_hourly_earn = 0.0;
    var i_total_annually_ded = 0.0;
    var i_total_annually_others = 0.0;
    var RestAmt = 15000;
    
var recType = nlapiGetRecordType();
    var empcompenrecordid = nlapiGetRecordId();
    var empcompenrecord = nlapiLoadRecord(recType, empcompenrecordid);

    var ESICCheck = nlapiGetFieldValue(
      "custrecord_hris_empchange_esic_applicabe"
    );
    var i_linecount_earn = nlapiGetLineItemCount(
      "recmachcustrecord_hris_employee_data_change"
    );
      nlapiLogExecution('AUDIT','i_linecount_earn',i_linecount_earn)
    if (
      i_linecount_earn != null &&
      i_linecount_earn != "" &&
      i_linecount_earn != "undefined"
    ) {
      for (var i = 1; i <= i_linecount_earn; i++) {
        var i_current_monthly_earn = nlapiGetLineItemValue(
          "recmachcustrecord_hris_employee_data_change",
          "custrecord_hris_cde_monthly",
          i
        );
         nlapiLogExecution('AUDIT','i_current_monthly_earn',i_current_monthly_earn)

        var i_current_annually_earn = nlapiGetLineItemValue(
          "recmachcustrecord_hris_employee_data_change",
          "custrecord_hris_cde_annually",
          i
        );
 nlapiLogExecution('AUDIT','i_current_annually_earn',i_current_annually_earn)
        i_current_annually_earn = valueCheck(i_current_annually_earn);

        var i_current_bi_monthly_earn = nlapiGetLineItemValue(
          "recmachcustrecord_hris_employee_data_change",
          "custrecord_hris_bi_monthly",
          i
        );

        var i_current_daily_earn = nlapiGetLineItemValue(
          "recmachcustrecord_hris_employee_data_change",
          "	custrecord_hris_cde_daily",
          i
        );

        var i_current_hourly_earn = nlapiGetLineItemValue(
          "recmachcustrecord_hris_employee_data_change",
          "	custrecord_hris_hourly",
          i
        );

        if (
          i_current_monthly_earn != null &&
          i_current_monthly_earn != "" &&
          i_current_monthly_earn != "undefined"
        ) {
          i_total_monthly_earn =
            parseFloat(i_total_monthly_earn) + parseFloat(i_current_monthly_earn);
        }

        if (
          i_current_annually_earn != null &&
          i_current_annually_earn != "" &&
          i_current_annually_earn != "undefined"
        ) {
          i_total_annually_earn =
            parseFloat(i_total_annually_earn) +
            parseFloat(i_current_annually_earn);
        }

        if (
          i_current_bi_monthly_earn != null &&
          i_current_bi_monthly_earn != "" &&
          i_current_bi_monthly_earn != "undefined"
        ) {
          i_total_bi_monthly_earn =
            parseFloat(i_total_bi_monthly_earn) +
            parseFloat(i_current_bi_monthly_earn);
        }

        if (
          i_current_daily_earn != null &&
          i_current_daily_earn != "" &&
          i_current_daily_earn != "undefined"
        ) {
          i_total_daily_earn =
            parseFloat(i_total_daily_earn) + parseFloat(i_current_daily_earn);
        }

        if (
          i_current_hourly_earn != null &&
          i_current_hourly_earn != "" &&
          i_current_hourly_earn != "undefined"
        ) {
          i_total_hourly_earn =
            parseFloat(i_total_hourly_earn) + parseFloat(i_current_hourly_earn);
        }
      }
    }
    var i_linecount_ded = nlapiGetLineItemCount(
      "recmachcustrecord_hris_employee_datachangeint"
    );
    if (
      i_linecount_ded != null &&
      i_linecount_ded != "" &&
      i_linecount_ded != "undefined"
    ) {
      for (var i = 1; i <= i_linecount_ded; i++) {
        var i_current_monthly_ded = nlapiGetLineItemValue(
          "recmachcustrecord_hris_employee_datachangeint",
          "custrecord_hris_cdb_monthly",
          i
        );

        var i_current_annually_ded = nlapiGetLineItemValue(
          "recmachcustrecord_hris_employee_datachangeint",
          "custrecord_hris_cdb_annually",
          i
        );

        i_current_annually_ded = valueCheck(i_current_annually_ded);

        i_total_monthly_ded =
          parseFloat(i_total_monthly_ded) + parseFloat(i_current_monthly_ded);

        i_total_annually_ded =
          parseFloat(i_total_annually_ded) + parseFloat(i_current_annually_ded);
      }
    }

    var i_linecount_others = nlapiGetLineItemCount(
      "recmachcustrecord_hris_employee_data_change_int"
    );
    if (
      i_linecount_others != null &&
      i_linecount_others != "" &&
      i_linecount_others != "undefined"
    ) {
      for (var i = 1; i <= i_linecount_others; i++) {
        var i_current_monthly_others = nlapiGetLineItemValue(
          "recmachcustrecord_hris_employee_data_change_int",
          "custrecord_hris_monthly",
          i
        );

        var i_current_annually_others = nlapiGetLineItemValue(
          "recmachcustrecord_hris_employee_data_change_int",
          "custrecord_hris_annually",
          i
        );

        i_current_annually_others = valueCheck(i_current_annually_others);

        i_total_monthly_others =
          parseFloat(i_total_monthly_others) +
          parseFloat(i_current_monthly_others);
        i_total_annually_others =
          parseFloat(i_total_annually_others) +
          parseFloat(i_current_annually_others);
      }
    }

    var i_total_month = i_total_monthly_earn;

    var i_total_annual = i_total_annually_earn;

    var i_total_bi_monthly = i_total_bi_monthly_earn;

    var i_total_daily = i_total_daily_earn;

    var i_total_hourly = i_total_hourly_earn;

    nlapiSetFieldValue("custrecord_hris_empchange_month_cross_sy", i_total_month);
    nlapiSetFieldValue(
      "custrecord_hris_empchange_annualgrosssly",
      i_total_annual
    );
   
    nlapiSetFieldValue(
      "custrecord_hris_empchange_bimon_gros_sal",
      i_total_bi_monthly
    );

    nlapiSetFieldValue("custrecord_hris_empchange_daily_grosssly", i_total_daily);
    nlapiSetFieldValue(
      "custrecord_hris_empchange_hourly_grs_sal",
      i_total_hourly
    );

    i_total_month = parseFloat(i_total_month);
    RestAmt = parseFloat(RestAmt);
    if (i_total_month > RestAmt && ESICCheck == "T") {
      alert(
        "Gross Salary cannot Exceed 15000 since ESIC is Applicable to Employee"
      );
    }
    var CTC =
      i_total_annually_earn + i_total_annually_ded + i_total_annually_others;
nlapiLogExecution('DEBUG','CTC',CTC);
nlapiLogExecution('DEBUG','CTC i_total_annual ',i_total_annual);

        if (isNaN(CTC) || CTC == "" || CTC == "undefined" || CTC == null) {
      nlapiSetFieldValue("custrecord_hris_empchange_ctc", "");
       empcompenrecord.setFieldValue("custrecord_hris_empchange_ctc", "");
    } else {
      nlapiSetFieldValue("custrecord_hris_empchange_ctc", CTC);
       empcompenrecord.setFieldValue("custrecord_hris_empchange_ctc", CTC);
    }
    //empcompenrecord.setFieldValue("custrecord_hris_empchange_ctc", i_total_annual);
     empcompenrecord.setFieldValue("custrecord_hris_empchange_month_cross_sy", i_total_month);
    empcompenrecord.setFieldValue("custrecord_hris_empchange_annualgrosssly",i_total_annual);
     empcompenrecord.setFieldValue(
      "custrecord_hris_empchange_bimon_gros_sal",
      i_total_bi_monthly
    );
      empcompenrecord.setFieldValue("custrecord_hris_empchange_daily_grosssly", i_total_daily);
   empcompenrecord.setFieldValue(
      "custrecord_hris_empchange_hourly_grs_sal",
      i_total_hourly
    );
    
    nlapiSubmitRecord(empcompenrecord, true, true);
    var empid = nlapiGetFieldValue("custrecord_hris_empchange_employee_nam");
  nlapiLogExecution('DEBUG', 'employee id', empid);
  var effectivedate = nlapiGetFieldValue("custrecord_hris_empchange_eff_from_date");
  nlapiLogExecution('DEBUG', 'effectivedate',effectivedate); 
   var monthlyamt  =nlapiGetFieldValue("custrecord_hris_empchange_month_cross_sy");
   monthlyamt=parseFloat(monthlyamt);
   monthlyamt=monthlyamt.toFixed(2);
   nlapiLogExecution('DEBUG', 'monthlyamt', monthlyamt); 
   var annualamt  =nlapiGetFieldValue("custrecord_hris_empchange_annualgrosssly");
   annualamt = parseFloat(annualamt);
   annualamt = annualamt.toFixed(2);
   nlapiLogExecution('DEBUG', 'annualamt', annualamt); 
  var paygroupid = nlapiGetFieldValue("custrecord_hris_empchange_emp_pay_pro_gp");
  nlapiLogExecution('DEBUG', 'paygroupid', paygroupid); 
   var employeerecord = nlapiLoadRecord('employee',empid);					
	employeerecord.setFieldValue('custentity_hris_emppayrollgroup', paygroupid);	
  /* employeerecord.setFieldValue('custentity_njt_effective_from_dte',effectivedate);
  employeerecord.setFieldValue('custentity_njt_monthly_gross_sal', monthlyamt);
  employeerecord.setFieldValue('custentity_njt_annual_gross_salary', annualamt); */
  
	nlapiSubmitRecord(employeerecord,true,true);
  //}
}

function isValid(str) {
  var iChars = "@()~`!#$%^&*+=-[]\\';,/{}|\":<>?.";

  for (var i = 0; i < str.length; i++) {
    if (iChars.indexOf(str.charAt(i)) != -1) {
      var error =
        "Employee Identification has special characters \n@()~`!#$%^&*+=-[]\\';,/{}|\":<>?. \nThese are not allowed\n";
      throw error;

      nlapiSetFieldValue("custrecord_hris_empchange_emp_identify", "");
      return false;
    }
  }
  return true;
}
function valueCheck(value)
{
	if(value==Infinity||value==-Infinity||isNaN(value) || value=='' || value==undefined || value==null || value.toString()=='NaN')
    {
		return 0.00;
    }
	else
	{
		return value
	}
}