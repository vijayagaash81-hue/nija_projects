function SUT_PayProcessSec(request, response) {
 try{ 
  if (request.getMethod() == "GET") {
    var sublistArray = new Array();

    var WagePeriod = new Array();
    var WagePeriodtxt = new Array();
    var WageYear = new Array();
    var WagePeriodNew = new Array();
    var Paygrp = request.getParameter("custscript_hris_paygroup");// wageMonthTotal9#July#2023#31/07/2023
   // var Paygrp = 1;
    nlapiLogExecution("DEBUG", "context", "Paygrp......" + Paygrp);
    var PayG = Paygrp;
    WagePeriod = request.getParameter("custscript_hris_wagemonth");
   // WagePeriod = 9;
    nlapiLogExecution("DEBUG", "context", "WagePeriod........" + WagePeriod);

    WagePeriodtxt = request.getParameter("custscript_hris_wagemonthtxt");
   // WagePeriodtxt = 'July';
    nlapiLogExecution(
      "DEBUG",
      "context",
      "WagePeriodtxt........" + WagePeriodtxt
    );
    WageYear = request.getParameter("custscript_hris_emp_year");
   // WageYear = '2023'
    nlapiLogExecution("DEBUG", "context", "WageYear........####" + WageYear);
   //var Emp_count = 4
    var Emp_count = request.getParameter("custscript_hris_emp_count");
    nlapiLogExecution("DEBUG", "context", "Emp_count........" + Emp_count);

    var WagePeriodNew = request.getParameter("custscript_hris_emp_period");
   // var WagePeriodNew = '31/07/2023'
    nlapiLogExecution(
      "DEBUG",
      "context",
      "WagePeriodNew........*************" + WagePeriodNew
    );
  var payFreq_Seq = request.getParameter("custscript_hris_payfreq_seq");
   // var payFreq_Seq = 2;
    nlapiLogExecution(
      "DEBUG",
      "context",
      "payFreq_Seq........*************" + payFreq_Seq
    );

    var Emp_List = nlapiCreateForm("Pay Process");
    var emp_Paygrp = Emp_List.addField(
      "custpage_paygroup",
      "select",
      "Pay Group",
      "customrecord_hris_process_groupmaster"
    );
    emp_Paygrp.setDisplayType("inline");
    emp_Paygrp.setDefaultValue(Paygrp);

    var Pay_Date = Emp_List.addField("custpage_paydate", "date", "Pay Date");
    Pay_Date.setDisplayType("inline");
    Pay_Date.setDefaultValue(WagePeriodNew);

    var wage_Period = Emp_List.addField(
      "custpage_wageperiod",
      "text",
      "Pay Month",
      "customrecord_hris_wage_period_details"
    );
    wage_Period.setDisplayType("inline");
    wage_Period.setDefaultValue(WagePeriodtxt);

    var wage_Year = Emp_List.addField(
      "custpage_wageyr",
      "text",
      "Year",
      "customrecord_hris_year_master"
    );
    wage_Year.setDisplayType("inline");
    nlapiLogExecution("DEBUG", "context", "WageYear........$$" + WageYear);
    wage_Year.setDefaultValue(WageYear);

    var Employee_count = Emp_List.addField(
      "custscript_counter",
      "text",
      "Employee count",
      "employeecount"
    );
    Employee_count.setDisplayType("disabled");
    Employee_count.setDefaultValue(Emp_count);

    var pay_freq = Emp_List.addField("custpage_payfrq", "text", "Pay Freq");
    pay_freq.setDisplayType("disabled");
    pay_freq.setDefaultValue(payFreq_Seq);

    var emp_sublist = Emp_List.addSubList(
      "custpage_apm_employee_sublist",
      "list",
      "Employee List"
    );
    var chk_box = emp_sublist.addField(
      "custscript_apm_check",
      "checkbox",
      "Checkbox"
    );
    chk_box.setDefaultValue("T");
    var add_cd = emp_sublist.addField(
      "custpage_empcode",
      "text",
      " Employee code"
    );
    var emp_name = emp_sublist.addField("custpage_em", "text", "Employee Name");
    var mark_all = emp_sublist.addMarkAllButtons();

    var emp = new Array();
    var filters1 = new Array();
    var columns1 = new Array();
    filters1.push(
      new nlobjSearchFilter(
        "custrecord_hris_empchange_emp_pay_pro_gp",
        null,
        "is",
        PayG
      )
    );
    filters1.push(
      new nlobjSearchFilter(
        "custentity_hris_empemploymentstatus",
        "custrecord_hris_empchange_employee_nam",
        "anyof",
        1
      )
    );
    filters1.push(new nlobjSearchFilter("isinactive", null, "is", "F"));
    columns1.push(
      new nlobjSearchColumn(
        "custrecord_hris_empchange_employee_nam",
        null,
        "group"
      ).setSort(false)
    );
    columns1.push(
      new nlobjSearchColumn("custrecord_hris_empchange_emp_code", null, "group")
    );
    columns1.push(
      new nlobjSearchColumn(
        "custrecord_hris_empchange_increment_eff",
        null,
        "max"
      )
    );
    columns1.push(
      new nlobjSearchColumn(
        "custrecord_hris_empchange_emp_pay_pro_gp",
        null,
        "group"
      )
    );
    columns1.push(
      new nlobjSearchColumn(
        "custrecord_hris_empchange_date_of_join",
        null,
        "group"
      )
    );
   /* var searchEmp = nlapiSearchRecord(
      "customrecord_hris_employee_compen_change",
      "customsearch_latest_employeedata_change",
      filters1,
      columns1
    );*/
    var searchEmp = nlapiSearchRecord(
      "customrecord_hris_employee_compen_change",
     null,
      filters1,
      columns1
    );
    nlapiLogExecution(
      "DEBUG",
      "searchEmp"
       + searchEmp
    );
    nlapiLogExecution(
      "DEBUG",
      "searchEmp"
       + searchEmp.length
    );
    if (searchEmp != null) {
      WagePeriodNew = nlapiStringToDate(WagePeriodNew);
      nlapiLogExecution(
        "DEBUG",
        "In SearchUnit",
        "WagePeriodNew : " + WagePeriodNew
      );
      for (var edc = 0; edc < searchEmp.length; edc++) {
        var emp_id = searchEmp[edc].getText(
          "custrecord_hris_empchange_employee_nam",
          null,
          "group"
        );

        var DOJ = searchEmp[edc].getValue(
          "custrecord_hris_empchange_date_of_join",
          null,
          "group"
        );

        DOJ = nlapiStringToDate(DOJ);
        nlapiLogExecution("DEBUG", "In SearchUnit", "DOJ : " + DOJ);
        var emp_code = searchEmp[edc].getValue(
          "custrecord_hris_empchange_emp_code",
          null,
          "group"
        );
        if (WagePeriodNew >= DOJ) {
          sublistArray[edc] = {
            custpage_em: emp_id,
            custpage_empcode: emp_code,
          };
        }
      }
      emp_sublist.setLineItemValues(sublistArray);
     // Emp_List.setScript("customscript_clipayprocess");
     Emp_List.setScript("customscript_hris_payprocess_cl");
      Emp_List.addSubmitButton("Start Pay Process");
      response.writePage(Emp_List);
    }
    
    else {
      response.write(
        "<b>" + "Data Not Found for the selected PAY GROUP" + "</b>"
      );
     }
     
  }
 

if (request.getMethod() == "POST") {
  var param = new Array();
  var params = new Array();
  var emp_list = new Array();
  var checked_emps_name = new Array();
  var emp_list_final = new Array();
  var count = 0;
  var year = new Array();
  var payGroup = request.getParameter("custpage_paygroup");

  params["custpage_apm_employee_sublist"] = request.getParameter(
    "custpage_apm_employee_sublist"
  );

  var wageMonth = request.getParameter("custpage_wageperiod");
  var year = request.getParameter("custpage_wageyr");
  nlapiLogExecution("DEBUG", "POST", "Year***********==" + year);
  var i_linecount = request.getLineItemCount("custpage_apm_employee_sublist");
  nlapiLogExecution("DEBUG", "POST", "i_linecount***********==" + i_linecount);
  var payfreq = request.getParameter("custpage_payfrq");
  var j = 0;
  var empList;
  if (
    i_linecount != null &&
    i_linecount != "undefined" &&
    i_linecount != ""
  ) {
    for (i = 1; i <= i_linecount; i++) {
      var checked_emps = request.getLineItemValue(
        "custpage_apm_employee_sublist",
        "custscript_apm_check",
        i
      );

      if (checked_emps == "T") {
        try {
          checked_emps_name = request.getLineItemValue(
            "custpage_apm_employee_sublist",
            "custpage_em",
            i
          );
          emp_list[j++] = checked_emps_name;
          empList = empList + "#";
          empList = empList + checked_emps_name;

          count = count + 1;

        }
        
         catch (e) {
          //nlapiLogExecution('DEBUG', 'ERROR', e.message);
        }
      }
    }
    nlapiLogExecution('DEBUG', 'empList', +empList);
    param["custscript_hris_checked_emp_pre"] = checked_emps;
    param["custscript_hris_paygroup_pre"] = payGroup;
    param["custscript_hris_wagemonth_pre"] = wageMonth;
    param["custscript_hris_counter_pre"] = count;
    param["custscript_hris_emp_id_pre"] = empList;
    param["custscript_hris_sch_prepayprocess_year"] = year;
    param["custscript_hris_payfrq_seqno"] = payfreq;
    var status = nlapiScheduleScript(
      "customscript_hris_prepayproce_ss",
      null,
      param
    );
    nlapiSetRedirectURL(
      "suitelet",
      "customscript_hris_payprocess_sl",
      "customdeploy_hris_payprocess_sl",
      null,
      null
    );
  }
}
}       
catch (e) {
 nlapiLogExecution('DEBUG', 'ERROR', e.message);
} 
}
