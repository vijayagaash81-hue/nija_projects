function beforeLoadRecord(type) {
  return true;
}

function beforeSubmitRecord(type) {
  if (type == "delete") {
    nlapiLogExecution("DEBUG", "", "into type delete" + type);
    var monthly_amount = 0;
    var annualy_amount = 0;
    var approx_monthly_gross = 0;
    var approx_annualy_gross = 0;

    var RecID = nlapiGetRecordId();
    nlapiLogExecution("DEBUG", "", "RecID" + RecID);
    var RecType = nlapiGetRecordType();
    var monthly_val = nlapiGetFieldValue("custrecord_hris_cdd_monthly");
    nlapiLogExecution("DEBUG", "", "monthly_val" + monthly_val);
    var Annual_val = nlapiGetFieldValue("custrecord_hris_cdd_annually");
    nlapiLogExecution("DEBUG", "", "Annual_val" + Annual_val);
    var Emp_C_C_ID = nlapiGetFieldValue(
      "custrecord_hris_employee_data_changeint"
    );
    nlapiLogExecution("DEBUG", "", "Emp_C_C_ID" + Emp_C_C_ID);
    var Emp_C_C_Obj = nlapiLoadRecord(
      "customrecord_hris_employee_compen_change",
      Emp_C_C_ID
    );

    var monthly_deduction = Emp_C_C_Obj.getFieldValue(
      "custrecord_hris_empchange_mon_ded_amt"
    );
    var annualy_deduction = Emp_C_C_Obj.getFieldValue(
      "custrecord_hris_empchange_anual_ded_amt"
    );
    var monthly_gross = Emp_C_C_Obj.getFieldValue(
      "custrecord_hris_empchange_aprox_monthly"
    );
    var annualy_gross = Emp_C_C_Obj.getFieldValue(
      "custrecord_hris_empchange_apprx_annetsly"
    );

    monthly_amount = parseFloat(monthly_deduction) - parseFloat(monthly_val);
    annualy_amount = parseFloat(annualy_deduction) - parseFloat(Annual_val);

    approx_monthly_gross = parseFloat(monthly_gross) + parseFloat(monthly_val);
    approx_annualy_gross = parseFloat(annualy_gross) + parseFloat(Annual_val);

    Emp_C_C_Obj.setFieldValue(
      "custrecord_hris_empchange_mon_ded_amt",
      monthly_amount
    );
    Emp_C_C_Obj.setFieldValue(
      "custrecord_hris_empchange_anual_ded_amt",
      annualy_amount
    );
    Emp_C_C_Obj.setFieldValue(
      "custrecord_hris_empchange_aprox_monthly",
      approx_monthly_gross
    );

    nlapiSubmitRecord(Emp_C_C_Obj);
  }

  return true;
}

function AfterSubmit_calculate_EDCdeduction(type) {
  nlapiLogExecution("DEBUG", "", "type" + type);
  if (type != "delete") {
    var monthly_total = 0;
    var annualy_total = 0;
    var approx_monthly_net = 0;
    var approx_annualy_net = 0;

    var RecID = nlapiGetRecordId();
    var RecType = nlapiGetRecordType();

    var EDC_Rec_obj = nlapiLoadRecord(RecType, RecID);

    var monthly_gross_salary = EDC_Rec_obj.getFieldValue(
      "custrecord_hris_empchange_month_cross_sy"
    );
    var annualy_gross_salary = EDC_Rec_obj.getFieldValue(
      "custrecord_hris_empchange_annualgrosssly"
    );

    var iban_no = nlapiGetFieldValue("custrecord_hris_empchange_iban_num");
    var Empid = nlapiGetFieldValue("custrecord_hris_empchange_employee_nam");
    var BankName = nlapiGetFieldValue("custrecord_hris_empchange_bank_name");
    var bankAccNo = nlapiGetFieldValue("custrecord_hris_empchange_bank_acc_no");
    var loan_eligibility = nlapiGetFieldValue(
      "custrecord_hris_empchange_emp_loan_eglig"
    );
    var filters = new Array();
    var columns = new Array();

    filters.push(
      new nlobjSearchFilter(
        "custrecord_hris_employee_data_changeint",
        null,
        "is",
        RecID
      )
    );
    filters.push(new nlobjSearchFilter("isinactive", null, "is", "F"));
    columns.push(new nlobjSearchColumn("internalid"));

    var searchresults = nlapiSearchRecord(
      "customrecord_hris_compensation_detail_de",
      null,
      filters,
      columns
    );
    nlapiLogExecution("DEBUG", "", "searchresults" + searchresults);
    if (searchresults != null) {
      for (var i = 0; i < searchresults.length; i++) {
        var cc_dd_Id = searchresults[i].getValue("internalid");
        var cc_dd_Id_obj = nlapiLoadRecord(
          "customrecord_hris_compensation_detail_de",
          cc_dd_Id
        );
        var monthly_amount = cc_dd_Id_obj.getFieldValue(
          "custrecord_hris_cdd_monthly"
        );
        var annualy_amount = cc_dd_Id_obj.getFieldValue(
          "custrecord_hris_cdd_annually"
        );

        monthly_total = parseFloat(monthly_total) + parseFloat(monthly_amount);
        annualy_total = parseFloat(annualy_total) + parseFloat(annualy_amount);

        EDC_Rec_obj.setFieldValue(
          "custrecord_hris_empchange_mon_ded_amt",
          monthly_total
        );
        EDC_Rec_obj.setFieldValue(
          "custrecord_hris_empchange_anual_ded_amt",
          annualy_total
        );

        approx_monthly_net =
          parseFloat(monthly_gross_salary) - parseFloat(monthly_total);
        approx_annualy_net =
          parseFloat(annualy_gross_salary) - parseFloat(annualy_total);

        EDC_Rec_obj.setFieldValue(
          "custrecord_hris_empchange_aprox_monthly",
          approx_monthly_net
        );
        EDC_Rec_obj.setFieldValue(
          "custrecord_hris_empchange_apprx_annetsly",
          approx_annualy_net
        );
      }
    } else {
      EDC_Rec_obj.setFieldValue("custrecord_hris_empchange_mon_ded_amt", 0);
      EDC_Rec_obj.setFieldValue("custrecord_hris_empchange_anual_ded_amt", 0);
      EDC_Rec_obj.setFieldValue(
        "custrecord_hris_empchange_aprox_monthly",
        monthly_gross_salary
      );
      EDC_Rec_obj.setFieldValue(
        "custrecord_hris_empchange_apprx_annetsly",
        annualy_gross_salary
      );
    }
    nlapiSubmitRecord(EDC_Rec_obj, true, true);
    var emp = nlapiGetRecordId();
    var com_detail_oth_count = nlapiGetLineItemCount(
      "recmachcustrecord_hris_employee_data_change_int"
    );
    nlapiLogExecution("DEBUG", "before line item count");
    if (com_detail_oth_count) {
      nlapiLogExecution(
        "DEBUG",
        "Inside line item Count",
        com_detail_oth_count
      );

      var comp_Filter = [];
      comp_Filter.push(
        new nlobjSearchFilter(
          "custrecord_hris_employee_data_change_int",
          null,
          "is",
          emp
        )
      );
      comp_Filter.push(
        new nlobjSearchFilter(
          "custrecord_hris_payroll_component",
          null,
          "anyof",
          "@NONE@"
        )
      );

      var com_col = [];
      com_col.push(new nlobjSearchColumn("internalid"));
      var comp_Detail_Search = nlapiSearchRecord(
        "customrecord_hris_compensation_detail_ot",
        null,
        comp_Filter,
        com_col
      );
      if (comp_Detail_Search != null) {
        for (var i = 0; i < comp_Detail_Search.length; i++) {
          nlapiLogExecution("DEBUG", "inside for loop");
          nlapiDeleteRecord(
            "customrecord_hris_compensation_detail_ot",
            comp_Detail_Search[i].getValue("internalid")
          );
        }
      }
    }

    var comp_detail_earn = nlapiGetLineItemCount(
      "recmachcustrecord_hris_employee_data_change"
    );
    if (comp_detail_earn) {
      var comp_Filter1 = [];
      comp_Filter1.push(
        new nlobjSearchFilter(
          "custrecord_hris_employee_data_change",
          null,
          "is",
          emp
        )
      );
      comp_Filter1.push(
        new nlobjSearchFilter(
          "custrecord_hris_cde_payroll_component",
          null,
          "anyof",
          "@NONE@"
        )
      );

      var com_col1 = [];
      com_col1.push(new nlobjSearchColumn("internalid"));
      var comp_detail_earn_Search = nlapiSearchRecord(
        "customrecord_hris_compensation_details_e",
        null,
        comp_Filter1,
        com_col1
      );
      if (comp_detail_earn_Search != null) {
        for (var i = 0; i < comp_detail_earn_Search.length; i++) {
          nlapiDeleteRecord(
            "customrecord_hris_compensation_details_e",
            comp_detail_earn_Search[i].getValue("internalid")
          );
        }
      }
    }

    var comp_detail_benefit = nlapiGetLineItemCount(
      "recmachcustrecord_hris_employee_data_change"
    );
    if (comp_detail_benefit) {
      var comp_Filter2 = [];
      comp_Filter2.push(
        new nlobjSearchFilter(
          "custrecord_hris_employee_datachangeint",
          null,
          "is",
          emp
        )
      );
      comp_Filter2.push(
        new nlobjSearchFilter(
          "custrecord_hris_cdb_payroll_component",
          null,
          "anyof",
          "@NONE@"
        )
      );

      var com_col2 = [];
      com_col2.push(new nlobjSearchColumn("internalid"));
      var comp_detail_ben_Search = nlapiSearchRecord(
        "customrecord_hris_compensation_details_b",
        null,
        comp_Filter2,
        com_col2
      );
      if (comp_detail_ben_Search != null) {
        for (var i = 0; i < comp_detail_ben_Search.length; i++) {
          nlapiDeleteRecord(
            "customrecord_hris_compensation_details_b",
            comp_detail_ben_Search[i].getValue("internalid")
          );
        }
      }
    }
  }

  return true;
}

{
}
