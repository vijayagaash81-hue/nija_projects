function gross_total_SaveRecord() {
  debugger;
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
  var ESICCheck = nlapiGetFieldValue(
    "custrecord_hris_empchange_esic_applicabe"
  );
  var i_linecount_earn = nlapiGetLineItemCount(
    "recmachcustrecord_hris_employee_data_change"
  );
  nlapiLogExecution("Debug","i_linecount_earn",i_linecount_earn);
  if (
    i_linecount_earn != null &&
    i_linecount_earn != "" &&
    i_linecount_earn != "undefined"
  ) {
    debugger;
    for (var i = 1; i <= i_linecount_earn; i++) {
      var i_current_monthly_earn = nlapiGetLineItemValue(
        "recmachcustrecord_hris_employee_data_change",
        "custrecord_hris_cde_monthly",
        i
      );
      nlapiLogExecution("Debug","i_current_monthly_earn",i_current_monthly_earn);

      var i_current_annually_earn = nlapiGetLineItemValue(
        "recmachcustrecord_hris_employee_data_change",
        "custrecord_hris_cde_annually",
        i
      );
      nlapiLogExecution("Debug","i_current_annually_earn",i_current_annually_earn);

      i_current_annually_earn = valueCheck(i_current_annually_earn);

      var i_current_bi_monthly_earn = nlapiGetLineItemValue(
        "recmachcustrecord_hris_employee_data_change",
        "custrecord_hris_bi_monthly",
        i
      );
      nlapiLogExecution("Debug","i_current_bi_monthly_earn",i_current_bi_monthly_earn);
      var i_current_daily_earn = nlapiGetLineItemValue(
        "recmachcustrecord_hris_employee_data_change",
        "custrecord_hris_cde_daily",
        i
      );
      nlapiLogExecution("Debug","i_current_daily_earn",i_current_daily_earn);
      var i_current_hourly_earn = nlapiGetLineItemValue(
        "recmachcustrecord_hris_employee_data_change",
        "custrecord_hris_hourly",
        i
      );
      nlapiLogExecution("Debug","i_current_hourly_earn",i_current_hourly_earn);
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

  if (isNaN(CTC) || CTC == "" || CTC == "undefined" || CTC == null) {
    nlapiSetFieldValue("custrecord_hris_empchange_ctc", "");
  } else {
    nlapiSetFieldValue("custrecord_hris_empchange_ctc", CTC);
  }

  return true;
}

function fieldChanged_validation_emp_data_change(type, name, linenum) {
  try {
    debugger;
    if (
      type == "recmachcustrecord_hris_employee_data_change" &&
      name == "custrecord_hris_cde_monthly"
    ) {
      var month_pay = nlapiGetCurrentLineItemValue(
        "recmachcustrecord_hris_employee_data_change",
        "custrecord_hris_cde_monthly"
      );

nlapiLogExecution("Debug","month_pay",month_pay);
      var weeklyoff_present = nlapiGetFieldText(
        "custrecord_hris_empchange_working_days_w"
      );
      nlapiLogExecution("Debug","weeklyoff_present",weeklyoff_present);
      if (weeklyoff_present != null) {
        var bi_monthly = parseFloat(month_pay) / 2;

        nlapiSetCurrentLineItemValue(
          "recmachcustrecord_hris_employee_data_change",
          "custrecord_hris_bi_monthly",
          bi_monthly
        );
      }
      if (weeklyoff_present == null || weeklyoff_present == "") {
        var bi_monthly = "";

        nlapiSetCurrentLineItemValue(
          "recmachcustrecord_hris_employee_data_change",
          "custrecord_hris_bi_monthly",
          bi_monthly
        );
      }

      if (weeklyoff_present != null) {
        if (weeklyoff_present == 5) {
          var seq_no = 11;
          var fix_number = searchPFValue(seq_no);

          var daily = parseFloat(month_pay) / parseFloat(fix_number);

          daily = daily * 12;

          daily = daily.toFixed(2);

nlapiLogExecution("Debug","daily",daily);
          nlapiSetCurrentLineItemValue(
            "recmachcustrecord_hris_employee_data_change",
            "custrecord_hris_cde_daily",
            daily
          );
        }
        if (weeklyoff_present == 6) {
          var seq_no = 12;
          var fix_number = searchPFValue(seq_no);

          var daily = parseFloat(month_pay) / parseFloat(fix_number);

          daily = daily * 12;

          daily = daily.toFixed(2);

          nlapiSetCurrentLineItemValue(
            "recmachcustrecord_hris_employee_data_change",
            "custrecord_hris_cde_daily",
            daily
          );
        }
      }
      if (weeklyoff_present == null || weeklyoff_present == "") {
        var daily = "";
        nlapiSetCurrentLineItemValue(
          "recmachcustrecord_hris_employee_data_change",
          "custrecord_hris_cde_daily",
          daily
        );
      }

      if (daily != 0) {
        var hourly = parseFloat(daily) / 8;

        hourly = hourly.toFixed(2);

        nlapiSetCurrentLineItemValue(
          "recmachcustrecord_hris_employee_data_change",
          "custrecord_hris_hourly",
          hourly
        );
      }
      if (daily == null || daily == "") {
        var hourly = "";
        nlapiSetCurrentLineItemValue(
          "recmachcustrecord_hris_employee_data_change",
          "custrecord_hris_hourly",
          hourly
        );
      }

      var i_linecount = nlapiGetCurrentLineItemIndex(
        "recmachcustrecord_hris_employee_data_change"
      );

nlapiLogExecution("Debug","i_linecount",i_linecount);
      if (
        i_linecount != null &&
        i_linecount != "" &&
        i_linecount != "undefined"
      ) {
        var s_pay_comp = nlapiGetCurrentLineItemValue(
          "recmachcustrecord_hris_employee_data_change",
          "custrecord_hris_cde_payroll_component"
        );
        nlapiLogExecution("Debug","s_pay_comp",s_pay_comp);
        if (
          s_pay_comp != null &&
          s_pay_comp != "" &&
          s_pay_comp != "undefined"
        ) {
          var o_pay_component = nlapiLoadRecord(
            "customrecord_hris_payroll_component",
            s_pay_comp
          );

 nlapiLogExecution("Debug","o_pay_component",o_pay_component);
          var ch_CTC = o_pay_component.getFieldValue("custrecord_hris__ctc");
          nlapiLogExecution("Debug","ch_CTC",ch_CTC);

          var ch_benefits = o_pay_component.getFieldValue(
            "custrecord_hris_benefits"
          );
          nlapiLogExecution("Debug","ch_benefits",ch_benefits);
          var s_pay_freq = o_pay_component.getFieldValue(
            "custrecord_hris_pay_frequency"
          );
          nlapiLogExecution("Debug","s_pay_freq",s_pay_freq);
          var s_calc_type = o_pay_component.getFieldValue(
            "custrecord_hris_payroll_calculation_type"
          );
          nlapiLogExecution("Debug","s_calc_type",s_calc_type);
          if (
            ch_CTC == "T" &&
            ch_benefits == "F" &&
            s_pay_freq == 1 &&
             (s_calc_type == 1 || s_calc_type==2)
          ) {
            nlapiDisableLineItemField(
              "recmachcustrecord_hris_employee_data_change",
              "custrecord_hris_cde_monthly",
              false
            );
            var i_month = nlapiGetCurrentLineItemValue(
              "recmachcustrecord_hris_employee_data_change",
              "custrecord_hris_cde_monthly"
            );

            var i_annual = i_month * 12;
            nlapiSetCurrentLineItemValue(
              "recmachcustrecord_hris_employee_data_change",
              "custrecord_hris_cde_annually",
              i_annual
            );
            nlapiDisableLineItemField(
              "recmachcustrecord_hris_employee_data_change",
              "custrecord_hris_cde_annually",
              true
            );
          }
        }
      }
    }

    if (
      type == "recmachcustrecord_hris_employee_data_change" &&
      name == "custrecord_hris_cde_payroll_component"
    ) {
      var i_linecount = nlapiGetCurrentLineItemIndex(
        "recmachcustrecord_hris_employee_data_change"
      );
      var i_annual = 0;
      if (
        i_linecount != null &&
        i_linecount != "" &&
        i_linecount != "undefined"
      ) {
        var s_pay_comp = nlapiGetCurrentLineItemValue(
          "recmachcustrecord_hris_employee_data_change",
          "custrecord_hris_cde_payroll_component"
        );

        if (
          s_pay_comp != null &&
          s_pay_comp != "" &&
          s_pay_comp != "undefined"
        ) {
          var o_pay_component = nlapiLoadRecord(
            "customrecord_hris_payroll_component",
            s_pay_comp
          );

          var ch_CTC = o_pay_component.getFieldValue("custrecord_hris__ctc");

          var ch_benefits = o_pay_component.getFieldValue(
            "custrecord_hris_benefits"
          );

          var s_pay_freq = o_pay_component.getFieldValue(
            "custrecord_hris_pay_frequency"
          );

          var s_calc_type = o_pay_component.getFieldValue(
            "custrecord_hris_payroll_calculation_type"
          );
          var Fixed_Amt = o_pay_component.getFieldValue(
            "custrecord_hris_fixed_amount"
          );

          if (
            ch_CTC == "T" &&
            ch_benefits == "F" &&
            s_pay_freq == 1 &&
            s_calc_type == 1
          ) {
            nlapiDisableLineItemField(
              "recmachcustrecord_hris_employee_data_change",
              "custrecord_hris_cde_monthly",
              false
            );
            var i_month = nlapiGetCurrentLineItemValue(
              "recmachcustrecord_hris_employee_data_change",
              "custrecord_hris_cde_monthly"
            );
            if (
              Fixed_Amt != "" &&
              Fixed_Amt != null &&
              Fixed_Amt != "undefined"
            ) {
              nlapiSetCurrentLineItemValue(
                "recmachcustrecord_hris_employee_data_change",
                "custrecord_hris_cde_monthly",
                Fixed_Amt
              );
              i_annual = Fixed_Amt * 12;
              nlapiSetCurrentLineItemValue(
                "recmachcustrecord_hris_employee_data_change",
                "custrecord_hris_cde_annually",
                i_annual
              );
            } else {
              var i_annual = i_month * 12;
              nlapiSetCurrentLineItemValue(
                "recmachcustrecord_hris_employee_data_change",
                "custrecord_hris_cde_annually",
                i_annual
              );
            }

            nlapiDisableLineItemField(
              "recmachcustrecord_hris_employee_data_change",
              "custrecord_hris_cde_annually",
              true
            );
          }
        }
      }
    }

    if (
      type == "recmachcustrecord_hris_employee_datachangeint" &&
      name == "custrecord_hris_cdb_payroll_component"
    ) {
      var i_linecount = nlapiGetCurrentLineItemIndex(
        "recmachcustrecord_hris_employee_datachangeint"
      );

      if (
        i_linecount != null &&
        i_linecount != "" &&
        i_linecount != "undefined"
      ) {
        var s_pay_comp = nlapiGetCurrentLineItemValue(
          "recmachcustrecord_hris_employee_datachangeint",
          "custrecord_hris_cdb_payroll_component"
        );

        if (
          s_pay_comp != null &&
          s_pay_comp != "" &&
          s_pay_comp != "undefined"
        ) {
          var o_pay_component = nlapiLoadRecord(
            "customrecord_hris_payroll_component",
            s_pay_comp
          );

          var ch_CTC = o_pay_component.getFieldValue("custrecord_hris__ctc");

          var ch_benefits = o_pay_component.getFieldValue(
            "custrecord_hris_benefits"
          );

          var s_pay_freq = o_pay_component.getFieldValue(
            "custrecord_hris_pay_frequency"
          );

          var s_calc_type = o_pay_component.getFieldValue(
            "custrecord_hris_payroll_calculation_type"
          );

          if (
            ch_CTC == "T" &&
            ch_benefits == "T" &&
            s_pay_freq == 2 &&
            s_calc_type == 1
          ) {
            nlapiDisableLineItemField(
              "recmachcustrecord_hris_employee_datachangeint",
              "custrecord_hris_cdb_annually",
              false
            );
            nlapiDisableLineItemField(
              "recmachcustrecord_hris_employee_datachangeint",
              "custrecord_hris_cdb_monthly",
              true
            );
          }

          if (
            ch_CTC == "T" &&
            ch_benefits == "T" &&
            s_pay_freq == 1 &&
            s_calc_type == 1
          ) {
            nlapiDisableLineItemField(
              "recmachcustrecord_hris_employee_datachangeint",
              "custrecord_hris_cdb_monthly",
              false
            );
            var i_month = nlapiGetCurrentLineItemValue(
              "recmachcustrecord_hris_employee_datachangeint",
              "custrecord_hris_cdb_monthly"
            );

            var i_annual = i_month * 12;

            nlapiSetCurrentLineItemValue(
              "recmachcustrecord_hris_employee_datachangeint",
              "custrecord_hris_cdb_annually",
              i_annual
            );
            nlapiDisableLineItemField(
              "recmachcustrecord_hris_employee_datachangeint",
              "custrecord_hris_cdb_annually",
              true
            );
          }
        }
      }
    }

    if (
      type == "recmachcustrecord_hris_employee_datachangeint" &&
      name == "custrecord_hris_cdb_monthly"
    ) {
      var i_linecount = nlapiGetCurrentLineItemIndex(
        "recmachcustrecord_hris_employee_datachangeint"
      );

      if (
        i_linecount != null &&
        i_linecount != "" &&
        i_linecount != "undefined"
      ) {
        var s_pay_comp = nlapiGetCurrentLineItemValue(
          "recmachcustrecord_hris_employee_datachangeint",
          "custrecord_hris_cdb_payroll_component"
        );

        if (
          s_pay_comp != null &&
          s_pay_comp != "" &&
          s_pay_comp != "undefined"
        ) {
          var o_pay_component = nlapiLoadRecord(
            "customrecord_hris_payroll_component",
            s_pay_comp
          );

          var ch_CTC = o_pay_component.getFieldValue("custrecord_hris__ctc");

          var ch_benefits = o_pay_component.getFieldValue(
            "custrecord_hris_benefits"
          );

          var s_pay_freq = o_pay_component.getFieldValue(
            "custrecord_hris_pay_frequency"
          );

          var s_calc_type = o_pay_component.getFieldValue(
            "custrecord_hris_payroll_calculation_type"
          );

          if (
            ch_CTC == "T" &&
            ch_benefits == "T" &&
            s_pay_freq == 1 &&
            s_calc_type == 1
          ) {
            var i_month = nlapiGetCurrentLineItemValue(
              "recmachcustrecord_hris_employee_datachangeint",
              "custrecord_hris_cdb_monthly"
            );

            var i_annual = i_month * 12;

            nlapiSetCurrentLineItemValue(
              "recmachcustrecord_hris_employee_datachangeint",
              "custrecord_hris_cdb_annually",
              i_annual
            );
            nlapiDisableLineItemField(
              "recmachcustrecord_hris_employee_datachangeint",
              "custrecord_hris_cdb_annually",
              true
            );
          }
        }
      }
    }

    if (
      type == "recmachcustrecord_hris_employee_data_change_int" &&
      name == "custrecord_hris_payroll_component"
    ) {
      var i_linecount = nlapiGetCurrentLineItemIndex(
        "recmachcustrecord_hris_employee_data_change_int"
      );

      if (
        i_linecount != null &&
        i_linecount != "" &&
        i_linecount != "undefined"
      ) {
        var s_pay_comp = nlapiGetCurrentLineItemValue(
          "recmachcustrecord_hris_employee_data_change_int",
          "custrecord_hris_payroll_component"
        );

        if (
          s_pay_comp != null &&
          s_pay_comp != "" &&
          s_pay_comp != "undefined"
        ) {
          var o_pay_component = nlapiLoadRecord(
            "customrecord_hris_payroll_component",
            s_pay_comp
          );

          var ch_CTC = o_pay_component.getFieldValue("custrecord_hris__ctc");

          var ch_benefits = o_pay_component.getFieldValue(
            "custrecord_hris_benefits"
          );

          var s_pay_freq = o_pay_component.getFieldValue(
            "custrecord_hris_pay_frequency"
          );

          var s_calc_type = o_pay_component.getFieldValue(
            "custrecord_hris_payroll_calculation_type"
          );

          var pay_grp_on_comp_master = o_pay_component.getFieldValue(
            "custrecord_hris_pay_process_group"
          );

          var paygrp_on_emp_data_change = nlapiGetFieldValue(
            "custrecord_hris_empchange_emp_pay_pro_gp"
          );

          if (
            ch_CTC == "T" &&
            ch_benefits == "F" &&
            s_pay_freq == 2 &&
            s_calc_type == 1
          ) {
            var i_month = nlapiGetCurrentLineItemValue(
              "recmachcustrecord_hris_employee_data_change_int",
              "custrecord_hris_monthly"
            );

            nlapiDisableLineItemField(
              "recmachcustrecord_hris_employee_data_change_int",
              "custrecord_hris_monthly",
              true
            );
          }
        }
      }
    }

    if (
      type == "recmachcustrecord_hris_employee_data_change" &&
      name == "custrecord_hris_cde_payroll_component"
    ) {
      var paygrp_on_emp_data_change = nlapiGetFieldValue(
        "custrecord_hris_empchange_emp_pay_pro_gp"
      );

      var s_pay_comp = nlapiGetCurrentLineItemValue(
        "recmachcustrecord_hris_employee_data_change",
        "custrecord_hris_cde_payroll_component"
      );

      if (s_pay_comp != null && s_pay_comp != "" && s_pay_comp != "undefined") {
        var calc_type_and_pay_freq =
          get_calculation_type_and_pay_freq(s_pay_comp);

        var split_calc_type_and_pay_freq = calc_type_and_pay_freq.split("#");

        var s_calc_type = split_calc_type_and_pay_freq[0];

        var s_pay_freq = split_calc_type_and_pay_freq[1];

        if (s_calc_type == 3 && s_pay_freq == 1) {
          var s_formula = get_formula(
            s_pay_comp,
            paygrp_on_emp_data_change,
            s_calc_type
          );

          var split_formula = new Array();
          split_formula = s_formula.split(" ");

          var len = split_formula.length;

          for (var i = 0; i < len; i++) {
            var type = isNaN(split_formula[i]);

            if (isNaN(split_formula[i]) == true) {
              if (
                split_formula[i] != "*" &&
                split_formula[i] != "/" &&
                split_formula[i] != "=" &&
                split_formula[i] != "-" &&
                split_formula[i] != "(" &&
                split_formula[i] != ")" &&
                split_formula[i] != "%" &&
                split_formula[i] != "+"
              ) {
                var comp_name = split_formula[i];

                var matched_component = get_component_name(comp_name);

                var split_matched_component = matched_component.split("#");

                var s_comp_name_on_sublist = split_matched_component[0];

                var monthly_value = split_matched_component[1];

                var result = s_formula.replace(
                  s_comp_name_on_sublist,
                  monthly_value
                );

                nlapiSetCurrentLineItemValue(
                  "recmachcustrecord_hris_employee_data_change",
                  "custrecord_hris_cde_monthly",
                  result
                );
                nlapiDisableLineItemField(
                  "recmachcustrecord_hris_employee_data_change",
                  "custrecord_hris_cde_monthly",
                  true
                );

                var i_get_monthly_amt = nlapiGetCurrentLineItemValue(
                  "recmachcustrecord_hris_employee_data_change",
                  "custrecord_hris_cde_monthly"
                );

                var i_annual = parseFloat(i_get_monthly_amt) * 12;

                nlapiSetCurrentLineItemValue(
                  "recmachcustrecord_hris_employee_data_change",
                  "custrecord_hris_cde_annually",
                  i_annual
                );
                nlapiDisableLineItemField(
                  "recmachcustrecord_hris_employee_data_change",
                  "custrecord_hris_cde_annually",
                  true
                );
              }
            }
          }
        }
      }
    }

    if (
      type == "recmachcustrecord_hris_employee_datachangeint" &&
      name == "custrecord_hris_cdb_payroll_component"
    ) {
      var paygrp_on_emp_data_change = nlapiGetFieldValue(
        "custrecord_hris_empchange_emp_pay_pro_gp"
      );

      var s_pay_comp = nlapiGetCurrentLineItemValue(
        "recmachcustrecord_hris_employee_datachangeint",
        "custrecord_hris_cdb_payroll_component"
      );

      if (s_pay_comp != null && s_pay_comp != "" && s_pay_comp != "undefined") {
        var calc_type_and_pay_freq =
          get_calculation_type_and_pay_freq(s_pay_comp);

        var split_calc_type_and_pay_freq = calc_type_and_pay_freq.split("#");

        var s_calc_type = split_calc_type_and_pay_freq[0];

        var s_pay_freq = split_calc_type_and_pay_freq[1];

        if (s_calc_type == 3) {
          var s_formula = get_formula(
            s_pay_comp,
            paygrp_on_emp_data_change,
            s_calc_type
          );

          var split_formula = new Array();
          split_formula = s_formula.split(" ");

          var len = split_formula.length;

          for (var i = 0; i < len; i++) {
            var type = isNaN(split_formula[i]);

            if (isNaN(split_formula[i]) == true) {
              if (
                split_formula[i] != "*" &&
                split_formula[i] != "/" &&
                split_formula[i] != "=" &&
                split_formula[i] != "-" &&
                split_formula[i] != "(" &&
                split_formula[i] != ")" &&
                split_formula[i] != "%" &&
                split_formula[i] != "+"
              ) {
                var comp_name = split_formula[i];

                var matched_component = get_component_name(comp_name);

                var split_matched_component = matched_component.split("#");

                var s_comp_name_on_sublist = split_matched_component[0];

                var monthly_value = split_matched_component[1];

                var result = s_formula.replace(
                  s_comp_name_on_sublist,
                  monthly_value
                );

                if (s_pay_freq == 1 || s_pay_freq == 2) {
                  nlapiSetCurrentLineItemValue(
                    "recmachcustrecord_hris_employee_datachangeint",
                    "custrecord_hris_cdb_monthly",
                    result
                  );
                  nlapiDisableLineItemField(
                    "recmachcustrecord_hris_employee_datachangeint",
                    "custrecord_hris_cdb_monthly",
                    true
                  );

                  var i_get_monthly_amt = nlapiGetCurrentLineItemValue(
                    "recmachcustrecord_hris_employee_datachangeint",
                    "custrecord_hris_cdb_monthly"
                  );

                  var i_annual = parseFloat(i_get_monthly_amt) * 12;

                  nlapiSetCurrentLineItemValue(
                    "recmachcustrecord_hris_employee_datachangeint",
                    "custrecord_hris_cdb_annually",
                    i_annual
                  );
                  nlapiDisableLineItemField(
                    "recmachcustrecord_hris_employee_datachangeint",
                    "custrecord_hris_cdb_annually",
                    true
                  );
                }
              }
            }
          }
        }
      }
    }

    if (
      type == "recmachcustrecord_hris_employee_data_change_int" &&
      name == "custrecord_hris_payroll_component"
    ) {
      var paygrp_on_emp_data_change = nlapiGetFieldValue(
        "custrecord_hris_empchange_emp_pay_pro_gp"
      );

      var s_pay_comp = nlapiGetCurrentLineItemValue(
        "recmachcustrecord_hris_employee_data_change_int",
        "custrecord_hris_payroll_component"
      );

      if (s_pay_comp != null && s_pay_comp != "" && s_pay_comp != "undefined") {
        var calc_type_and_pay_freq =
          get_calculation_type_and_pay_freq(s_pay_comp);

        var split_calc_type_and_pay_freq = calc_type_and_pay_freq.split("#");

        var s_calc_type = split_calc_type_and_pay_freq[0];

        var s_pay_freq = split_calc_type_and_pay_freq[1];

        if (s_calc_type == 3 && s_pay_freq == 2) {
          var s_formula = get_formula(
            s_pay_comp,
            paygrp_on_emp_data_change,
            s_calc_type
          );

          var split_formula = new Array();
          split_formula = s_formula.split(" ");

          var len = split_formula.length;

          for (var i = 0; i < len; i++) {
            var type = isNaN(split_formula[i]);

            if (isNaN(split_formula[i]) == true) {
              if (
                split_formula[i] != "*" &&
                split_formula[i] != "/" &&
                split_formula[i] != "=" &&
                split_formula[i] != "-" &&
                split_formula[i] != "(" &&
                split_formula[i] != ")" &&
                split_formula[i] != "%" &&
                split_formula[i] != "+"
              ) {
                var comp_name = split_formula[i];

                var matched_component = get_component_name(comp_name);

                var split_matched_component = matched_component.split("#");

                var s_comp_name_on_sublist = split_matched_component[0];

                var monthly_value = split_matched_component[1];

                var result = s_formula.replace(
                  s_comp_name_on_sublist,
                  monthly_value
                );

                nlapiSetCurrentLineItemValue(
                  "recmachcustrecord_hris_employee_data_change_int",
                  "custrecord_hris_monthly",
                  result
                );
                nlapiDisableLineItemField(
                  "recmachcustrecord_hris_employee_data_change_int",
                  "custrecord_hris_monthly",
                  true
                );

                var i_get_monthly_amt = nlapiGetCurrentLineItemValue(
                  "recmachcustrecord_hris_employee_data_change_int",
                  "custrecord_hris_monthly"
                );

                var i_annual = parseFloat(i_get_monthly_amt) * 12;

                nlapiSetCurrentLineItemValue(
                  "recmachcustrecord_hris_employee_data_change_int",
                  "custrecord_hris_annually",
                  i_annual
                );
                nlapiDisableLineItemField(
                  "recmachcustrecord_hris_employee_data_change_int",
                  "custrecord_hris_annually",
                  true
                );

                nlapiSetCurrentLineItemValue(
                  "recmachcustrecord_hris_employee_data_change_int",
                  "custrecord_hris_monthly",
                  ""
                );
                nlapiDisableLineItemField(
                  "recmachcustrecord_hris_employee_data_change_int",
                  "custrecord_hris_monthly",
                  true
                );
              }
            }
          }
        }
      }
    }
  } catch (e) {}
}

function validateLine(type) {
  return true;
}

function get_calculation_type_and_pay_freq(s_pay_comp) {
  var filters = new Array();
  var columns = new Array();

  filters.push(new nlobjSearchFilter("internalid", null, "is", s_pay_comp));
  columns.push(
    new nlobjSearchColumn("custrecord_hris_payroll_calculation_type")
  );
  columns.push(new nlobjSearchColumn("custrecord_hris_pay_frequency"));

  var result = nlapiSearchRecord(
    "customrecord_hris_payroll_component",
    null,
    filters,
    columns
  );

  if (result != null) {
    var calc_type = result[0].getValue(
      "custrecord_hris_payroll_calculation_type"
    );

    var pay_freq = result[0].getValue("custrecord_hris_pay_frequency");
  }
  return calc_type + "#" + pay_freq;
}

function get_formula(s_pay_comp, paygrp_on_emp_data_change, calc_type) {
  var filters = new Array();
  var columns = new Array();

  filters.push(new nlobjSearchFilter("internalid", null, "is", s_pay_comp));
  filters.push(
    new nlobjSearchFilter(
      "custrecord_hris_pay_process_group",
      null,
      "is",
      paygrp_on_emp_data_change
    )
  );
  filters.push(
    new nlobjSearchFilter(
      "custrecord_hris_payroll_calculation_type",
      null,
      "is",
      calc_type
    )
  );
  columns.push(new nlobjSearchColumn("custrecord_hris_pay_formula"));

  var result = nlapiSearchRecord(
    "customrecord_hris_payroll_component",
    null,
    filters,
    columns
  );

  if (result != null) {
    var formula = result[0].getValue("custrecord_hris_pay_formula");
  }
  return formula;
}

function get_component_name(component_name) {
  var i_linecount = nlapiGetLineItemCount(
    "recmachcustrecord_hris_employee_data_change"
  );

  if (i_linecount > 0) {
    for (var i = 1; i <= i_linecount; i++) {
      var earn_comp_name = nlapiGetLineItemText(
        "recmachcustrecord_hris_employee_data_change",
        "custrecord_hris_cde_payroll_component",
        i
      );
      if (earn_comp_name == component_name) {
        var i_earn_monthly_amt = nlapiGetLineItemValue(
          "recmachcustrecord_hris_employee_data_change",
          "custrecord_hris_cde_monthly",
          i
        );

        return earn_comp_name + "#" + i_earn_monthly_amt;
        break;
      }
    }
  }

  var j_linecount = nlapiGetLineItemCount(
    "recmachcustrecord_hris_employee_datachangeint"
  );

  if (j_linecount > 0) {
    for (var j = 1; j <= i_linecount; j++) {
      var ded_comp_name = nlapiGetLineItemText(
        "recmachcustrecord_hris_employee_datachangeint",
        "custrecord_hris_cdb_payroll_component",
        j
      );
      if (ded_comp_name == component_name) {
        var i_ded_monthly_amt = nlapiGetLineItemValue(
          "recmachcustrecord_hris_employee_datachangeint",
          "custrecord_hris_cdb_monthly",
          j
        );

        return ded_comp_name + "#" + i_ded_monthly_amt;
        break;
      }
    }
  }

  var k_linecount = nlapiGetLineItemCount(
    "recmachcustrecord_hris_employee_data_change_int"
  );

  if (k_linecount > 0) {
    for (var k = 1; k <= k_linecount; k++) {
      var oth_comp_name = nlapiGetLineItemText(
        "recmachcustrecord_hris_employee_data_change_int",
        "custrecord_hris_payroll_component",
        k
      );
      if (oth_comp_name == component_name) {
        var i_oth_monthly_amt = nlapiGetLineItemValue(
          "recmachcustrecord_hris_employee_data_change_int",
          "custrecord_hris_monthly",
          k
        );

        return oth_comp_name + "#" + i_oth_monthly_amt;
        break;
      }
    }
  }
}

function searchPFValue(seq_no) {
  var EmpPFValue;

  var sequence = seq_no;

  var Filters = new Array();

  Filters.push(
    new nlobjSearchFilter(
      "custrecord_hris_gp_sequence_no",
      null,
      "equalto",
      sequence
    )
  );
  Filters.push(new nlobjSearchFilter("isinactive", null, "is", "F"));

  var column = new Array();

  column.push(new nlobjSearchColumn("internalid"));
  column.push(new nlobjSearchColumn("custrecord_hris_gp_value"));

  var searchPFCheck = nlapiSearchRecord(
    "customrecord_hris_global_parameter",
    null,
    Filters,
    column
  );

  if (searchPFCheck != null) {
    EmpPFValue = searchPFCheck[0].getValue("custrecord_hris_gp_value");
  }
  return EmpPFValue;
}

function valueCheck(value) {
  if (
    value == Infinity ||
    value == -Infinity ||
    isNaN(value) ||
    value == "" ||
    value == undefined ||
    value == null ||
    value.toString() == "NaN"
  ) {
    return 0.0;
  } else {
    return value;
  }
}
