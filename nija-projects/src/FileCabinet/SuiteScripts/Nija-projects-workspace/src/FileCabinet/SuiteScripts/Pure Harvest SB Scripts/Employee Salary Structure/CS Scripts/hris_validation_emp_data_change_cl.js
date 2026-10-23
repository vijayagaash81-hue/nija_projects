function pageInitEMP(type) {
  if (type == "create") {
    var emp_id = nlapiGetFieldValue("custrecord_hris_empchange_employee_nam");
    if (emp_id != "" && emp_id != null && emp_id != "undefined") {
      var o_emp_rec = nlapiLoadRecord("employee", emp_id);
      var maritial_status = o_emp_rec.getFieldValue("custentity_hris_empmaritalstatus");
      var gender = o_emp_rec.getFieldValue("custentity_hris_empgender");
	   nlapiSetFieldValue("custrecord_hris_empchange_gender", gender, true, true);
	 /* if (gender == "m" || gender == "Male") {
        nlapiSetFieldValue("custrecord_hris_empchange_gender", "1", true, true);
      }
      if (gender == "f" || gender == "Female") {
        nlapiSetFieldValue("custrecord_hris_empchange_gender", "2", true, true);
      }*/
      nlapiSetFieldValue(
        "custrecord_hris_empchange_marital_status",
        maritial_status,
        true,
        true
      );

      
    }
  }
}

function saveRecord() {
  return true;
}

function emp_date_validateField(type, name, linenum) {
  return true;
}

function emp_identification_fieldChanged(type, name) {
 // debugger;
  if (name == "custrecord_hris_empchange_emp_pay_pro_gp") {
    var proc_grp_nm = nlapiGetFieldValue(
      "custrecord_hris_empchange_emp_pay_pro_gp"
    );

    nlapiSetCurrentLineItemValue(
      "recmachcustrecord_hris_employee_data_change",
      "custrecord_hris_cde_process_group",
      proc_grp_nm,
      true,
      true
    );

    nlapiSetCurrentLineItemValue(
      "recmachcustrecord_hris_employee_datachangeint",
      "custrecord_hris_cdb_pay_group",
      proc_grp_nm,
      true,
      true
    );

    nlapiSetCurrentLineItemValue(
      "recmachcustrecord_hris_employee_data_change_int",
      "custrecord_hris_cdo_pay_group",
      proc_grp_nm,
      true,
      true
    );
  }

  if (name == "custrecord_hris_empchange_employee_nam") {
    var emp_id = nlapiGetFieldValue("custrecord_hris_empchange_employee_nam");
    if (emp_id) {
      var o_emp_rec = nlapiLoadRecord("employee", emp_id);
      var maritial_status = o_emp_rec.getFieldValue("custentity_hris_empmaritalstatus");
      var gender = o_emp_rec.getFieldValue("custentity_hris_empgender");
	   nlapiSetFieldValue("custrecord_hris_empchange_gender", gender, true, true);
	 /* if (gender == "m" || gender == "Male") {
        nlapiSetFieldValue("custrecord_hris_empchange_gender", "1", true, true);
      }

      if (gender == "f" || gender == "Female") {
        nlapiSetFieldValue("custrecord_hris_empchange_gender", "2", true, true);
      }*/
      nlapiSetFieldValue(
        "custrecord_hris_empchange_marital_status",
        maritial_status,
        true,
        true
      );

      
    }
  }
 
    if (name == 'custrecord_hris_empchange_eff_from_date') {   
         
      var empchangetype = nlapiGetFieldValue("custrecord_hris_empchange_type");
      nlapiLogExecution('DEBUG', 'empchangetype',empchangetype);
     if (empchangetype != '' && empchangetype == 4){
      var empid = nlapiGetFieldValue("custrecord_hris_empchange_employee_nam");
      nlapiLogExecution('DEBUG', 'employee id', empid);   
       var employeerecord = nlapiLoadRecord('employee',empid);	
       var joiningdate= employeerecord.getFieldValue("hiredate");
       //applied_bal = load_balance_record.getFieldValue('custrecord_hris_lvbal_total_applied_days')||0;
       nlapiLogExecution('DEBUG', 'joiningdate', joiningdate);     
       var fromDate = nlapiGetFieldValue('custrecord_hris_empchange_eff_from_date')      
      fromDate = nlapiStringToDate(fromDate);
      joiningdate = nlapiStringToDate(joiningdate);  
      if (fromDate < joiningdate ) {
          alert('Effective Date should be greater than joining Date ')
          nlapiSetFieldValue('custrecord_hris_empchange_eff_from_date', '', false);
          return false;
      }
      if (!empchangetype) {
        alert("Please select Type ");
        nlapiSetFieldValue('custrecord_hris_empchange_eff_from_date', '', false);
        return false;
    }
    }

  }
 
    
// Not needed by florence  field is change
  /* if (name == "custrecord_hris_empchange_eff_from_date") {
    var d_date = nlapiGetFieldValue("custrecord_hris_empchange_eff_from_date");
    d_date = nlapiStringToDate(d_date);
    var i_month_val = d_date.getMonth() + 1;
    var i_date_val = d_date.getDate();
    var i_year_val = d_date.getFullYear();

    if (
      i_month_val == 1 ||
      i_month_val == 3 ||
      i_month_val == 5 ||
      i_month_val == 7 ||
      i_month_val == 9 ||
      i_month_val == 11
    ) {
      if (i_date_val != 31) {
        alert("Increment Applied Date Should be End Date of the Month");
        nlapiSetFieldValue(
          "custrecord_hris_empchange_eff_from_date",
          " ",
          false,
          false
        );
        return false;
      }
    }
    if (
      i_month_val == 4 ||
      i_month_val == 6 ||
      i_month_val == 8 ||
      i_month_val == 10 ||
      i_month_val == 12
    ) {
      if (i_date_val != 30) {
        alert("Increment Applied Date Should be End Date of the Month");
        nlapiSetFieldValue(
          "custrecord_hris_empchange_eff_from_date",
          " ",
          false,
          false
        );
        return false;
      }
    }
    if (i_month_val == 2) {
      if (i_date_val != 29 && i_date_val != 28) {
        alert("Increment Applied Date Should be End Date of the Month");
        nlapiSetFieldValue(
          "custrecord_hris_empchange_eff_from_date",
          " ",
          false,
          false
        );
        return false;
      }
    }
  } */
}

function compe_earn_lineInit(type) {
  debugger;
  var proc_grp = nlapiGetFieldValue("custrecord_hris_empchange_emp_pay_pro_gp");

  if (
    (type == "recmachcustrecord_hris_employee_data_change",
    "custrecord_hris_cdb_pay_group")
  ) {
    nlapiSetCurrentLineItemValue(
      "recmachcustrecord_hris_employee_data_change",
      "custrecord_hris_cde_process_group",
      proc_grp,
      true,
      true
    );
  }

  if (type == "recmachcustrecord_hris_employee_data_change_int") {
    nlapiSetCurrentLineItemValue(
      "recmachcustrecord_hris_employee_data_change_int",
      "custrecord_hris_cdo_pay_group",
      proc_grp,
      true,
      true
    );
  }
}

function validateLine(type) {
  return true;
}

function isValid(str) {
  var iChars = "@()~`!#$%^&*+=-[]\\';,/{}|\":<>?.";

  for (var i = 0; i < str.length; i++) {
    if (iChars.indexOf(str.charAt(i)) != -1) {
      alert(
        "Employee Identification has special characters @()~`!#$%^&*+=-[]\\';,/{}|\":<>?. \nThese are not allowed\n"
      );
      nlapiSetFieldValue("custrecord_hris_empchange_emp_identify", "");
      return false;
    }
  }
  return true;
}
