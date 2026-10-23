function saveRecord() {
  return true;
}

function validateField(type, name, linenum) {
  return true;
}

function Fieldchange_cal_annual_amt(type, name, linenum) {
  if (name == "custrecord_hris_cdd_monthly") {
    var annual_amount=0;
    var monthly_val = nlapiGetFieldValue("custrecord_hris_cdd_monthly");
    nlapiLogExecution("Debug","annual_amount",annual_amount);
    nlapiLogExecution("Debug","monthly_val",monthly_val);
    if (
      monthly_val != null &&
      monthly_val != "" &&
      monthly_val != "undefined"
    ) {
      annual_amount = parseFloat(monthly_val) * 12;
      nlapiSetFieldValue("custrecord_hris_cdd_annually", annual_amount);
      nlapiLogExecution("Debug","annual_amount",annual_amount);
    } else {
      nlapiSetFieldValue("custrecord_hris_cdd_annually", "");
    }
  }

  if (
    type == "recmachcustrecord_hris_employee_data_changeint" &&
    name == "custrecord_hris_cdd_monthly"
  ) {
    var annual_amount = 0;

    var month_pay = nlapiGetCurrentLineItemValue(
      "recmachcustrecord_hris_employee_data_changeint",
      "custrecord_hris_cdd_monthly"
    );

    if (month_pay != null && month_pay != "" && month_pay != "undefined") {
      annual_amount = parseFloat(month_pay) * parseFloat(12);

      nlapiSetCurrentLineItemValue(
        "recmachcustrecord_hris_employee_data_changeint",
        "custrecord_hris_cdd_annually",
        annual_amount
      );
    } else {
      nlapiSetCurrentLineItemValue(
        "recmachcustrecord_hris_employee_data_changeint",
        "custrecord_hris_cdd_annually",
        ""
      );
    }
  }
}

function postSourcing(type, name) {}

function PayrollComp_lineInit(type) {
  if (type == "recmachcustrecord_hris_employee_data_change") {
    var PayGrp = nlapiGetCurrentLineItemValue(
      "recmachcustrecord_hris_employee_data_change",
      "custrecord_hris_cde_process_group"
    );
    nlapiSetCurrentLineItemValue(
      "recmachcustrecord_hris_employee_data_change",
      "custrecord_hris_cde_payroll_component",
      "",
      true,
      true
    );
    nlapiSetCurrentLineItemValue(
      "recmachcustrecord_hris_employee_data_change",
      "custrecord_hris_cde_process_group",
      "",
      true,
      false
    );
    nlapiSetCurrentLineItemValue(
      "recmachcustrecord_hris_employee_data_change",
      "custrecord_hris_cde_process_group",
      PayGrp,
      true,
      false
    );
  }
}

function validateLine(type) {
  return true;
}
