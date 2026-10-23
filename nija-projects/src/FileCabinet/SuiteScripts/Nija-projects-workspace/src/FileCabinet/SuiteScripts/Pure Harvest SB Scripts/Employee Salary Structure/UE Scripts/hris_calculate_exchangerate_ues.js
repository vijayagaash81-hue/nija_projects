function UES_apm_Calculate_ExchangeRate(type) {
  debugger;
  try {
    if (type == "create" || type == "edit") {
      var s_rec_type = nlapiGetRecordType();
      nlapiLogExecution(
        "DEBUG",
        "afterSubmit_emp_data_chnage --> s_rec_type:" + s_rec_type
      );
      var s_rec_Id = nlapiGetRecordId();
      nlapiLogExecution(
        "DEBUG",
        "afterSubmit_emp_data_chnage --> s_rec_Id:" + s_rec_Id
      );
      var o_edcRecObj = nlapiLoadRecord(s_rec_type, s_rec_Id);

      var i_total_monthly_earn = o_edcRecObj.getFieldValue(
        "custrecord_hris_empchange_month_cross_sy"
      );
      nlapiLogExecution(
        "DEBUG",
        "i_total_monthly_earn --> i_total_monthly_earn:" + i_total_monthly_earn
      );
      if (checkValidOrNot(i_total_monthly_earn)) {
        i_total_monthly_earn = parseFloat(i_total_monthly_earn);
      } else {
        i_total_monthly_earn = 0;
      }
      var payGroupId = o_edcRecObj.getFieldValue(
        "custrecord_hris_empchange_emp_pay_pro_gp"
      );
      nlapiLogExecution("DEBUG", "payGroupId --> payGroupId:" + payGroupId);
      var i_exchangeRate = 0;
      if (checkValidOrNot(payGroupId)) {
        i_exchangeRate = nlapiLookupField(
          "customrecord_hris_process_groupmaster",
          payGroupId,
          "custrecord_hris_allowance_currency_excha"
        );
        nlapiLogExecution(
          "DEBUG",
          "i_exchangeRate --> i_exchangeRate:" + i_exchangeRate
        );
        if (checkValidOrNot(i_exchangeRate)) {
          i_exchangeRate = parseFloat(i_exchangeRate);
        } else {
          i_exchangeRate = 0;
        }
      }

      var monthlyTotalAmountInAED =
        parseFloat(i_total_monthly_earn) * parseFloat(i_exchangeRate);
      nlapiLogExecution(
        "DEBUG",
        "monthlyTotalAmountInAED --> monthlyTotalAmountInAED:" +
          monthlyTotalAmountInAED
      );
      monthlyTotalAmountInAED = parseFloat(monthlyTotalAmountInAED).toFixed(2);
      var anuualTotalInAED = parseFloat(monthlyTotalAmountInAED) * 12;
      nlapiLogExecution(
        "DEBUG",
        "anuualTotalInAED --> anuualTotalInAED:" + anuualTotalInAED
      );
      anuualTotalInAED = parseFloat(anuualTotalInAED).toFixed(2);
      o_edcRecObj.setFieldValue(
        "custrecord_hris_empchange_mon_gross",
        monthlyTotalAmountInAED
      );
      o_edcRecObj.setFieldValue(
        "custrecord_hris_empchange_an_gross_salar",
        anuualTotalInAED
      );
      var i_edcRecId = nlapiSubmitRecord(o_edcRecObj, true, true);
      nlapiLogExecution("DEBUG", "EDC RECORD INTERNAL ID", i_edcRecId);
    }
  } catch (ex) {
    nlapiLogExecution("DEBUG", "HRIS_Calculate_ExchangeRate_UES", ex);
  }
}

function checkValidOrNot(value) {
  if (
    value != null &&
    value != "" &&
    value != undefined &&
    value.toString() != "NaN"
  ) {
    return true;
  } else {
    return false;
  }
}

function ValueOrNot(Value) {
  if (checkValidOrNot(Value) && Value != "- None -") {
    return true;
  } else {
    return false;
  }
}
