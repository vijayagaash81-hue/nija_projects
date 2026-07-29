{
  var _prefix = "";
  var _record_Type = "";
}

function beforeLoad_highlightStatus(type, form) {
  try {
    var _Role = nlapiGetContext().getRoleId();
    var i_role = nlapiGetRole();

    var _record_Type = nlapiGetRecordType().toString().toLowerCase();

    var hiddenfield = form.getField("name");
    hiddenfield.setDisplayType("disabled");
    if (type == "create") {
      hiddenfield = form.getField("custrecord_" + _prefix + "_workflowstatus");
      hiddenfield.setDisplayType("hidden");
    }

    if (type == "view" && _record_Type == "customrecord_hris_lve_letter_req") {
      var i_currentWFLevel = nlapiGetFieldValue(
        "custrecord_hris_letreq_current_approval"
      );
      var i_certificate = nlapiGetFieldValue(
        "custrecord_hris_letreq_certificateletter"
      );
      var s_signature = nlapiGetFieldText("custrecord_hris_letreq_signature");
      var i_workflowStatus = nlapiGetFieldValue(
        "custrecord_hris_letreq_workflow_statuslr"
      );
      var i_requester = nlapiGetFieldValue("custrecord_hris_letreq_requester");
      var i_internalId = nlapiGetRecordId();

      form.setScript("customscript_cli_ihr_ess_ssr_btnclick");
      if ((i_role == 1001 || i_role == 1003) && i_currentWFLevel == "2") {
        if (i_workflowStatus != 5) {
          if (_nullValidation(i_certificate)) {
            form.addButton(
              "custpage_preview_document",
              "Preview Document",
              "onClickPreviewDocBtn('" + s_signature + "');"
            );
          } else {
            form.addButton(
              "custpage_preview_document",
              "Issue Letter",
              "onClickIssueLatterBtn('" + i_requester + "');"
            );
          }
        }
      }
    }

    /* if (type == "view" && _record_Type == "customrecord_ihr_ess_awardrequest") {
      var i_currentWFLevel = nlapiGetFieldValue(
        "custrecord_ihr_ess_awd_current_wflevelno"
      );
      var i_certificate = nlapiGetFieldValue(
        "custrecord_ihr_awd_awardcertificate"
      );
      var i_internalId = nlapiGetRecordId();
      var i_workflowStatus = nlapiGetFieldValue(
        "custrecord_ihr_ess_awd_workflowstatus"
      );
      form.setScript("customscript_cli_ihr_ess_ssr_btnclick");
      if (i_role == 1003) {
        if (i_workflowStatus == 5) {
          if (_nullValidation(i_certificate)) {
            form.addButton(
              "custpage_award_certificate",
              "Generate Award Certificate",
              "onClickAward_Certificate();"
            );
          }
        }
      }
    } */

    if (
      !isFieldEmpty(nlapiGetFieldValue("custrecord_" + _prefix + "_status"))
    ) {
      var statusInColor =
        "<BR>" +
        "<font size=2>" +
        "STATUS" +
        "</font>" +
        "<BR>" +
        '<font color="red" size=2>' +
        nlapiGetFieldValue("custrecord_" + _prefix + "_status") +
        "</font>";
    } else {
      if (type != "create") {
        var statusInColor =
          "<BR>" +
          "<font size=2>" +
          "STATUS" +
          "</font>" +
          "<BR>" +
          '<font color="red" size=2>' +
          "Draft" +
          "</font>";
      }
    }
    nlapiSetFieldValue(
      "custrecord_" + _prefix + "_status_in_color",
      statusInColor,
      false
    );

    var statusInColorfield = form.getField(
      "custrecord_" + _prefix + "_status_in_color"
    );

    var namefield = form.getField("custrecord_" + _prefix + "_status");
    namefield.setDisplayType("hidden");

    var curWFLval = nlapiGetFieldValue(
      "custrecord_" + _prefix + "_current_wflevelno"
    );
    nlapiSetFieldValue(
      "custrecord_" + _prefix + "_crntwflvlnohighli",
      curWFLval,
      false
    );

    if (_Role != "administrator" && _Role != "full_access") {
      var hiddenfield = form.getField("custrecord_" + _prefix + "_wfhelp");
      hiddenfield.setDisplayType("hidden");
      hiddenfield = form.getField("custrecord_" + _prefix + "_app_no");
      hiddenfield.setDisplayType("hidden");
      hiddenfield = form.getField("custrecord_" + _prefix + "_wfs");
      hiddenfield.setDisplayType("hidden");
      hiddenfield = form.getField("custrecord_" + _prefix + "_currentapprover");
      hiddenfield.setDisplayType("hidden");
      hiddenfield = form.getField(
        "custrecord_" + _prefix + "_special_comments"
      );
      hiddenfield.setDisplayType("hidden");
      hiddenfield = form.getField("custrecord_" + _prefix + "_workflowstatus");
      hiddenfield = form.getField(
        "custrecord_" + _prefix + "_current_wflevelno"
      );
      hiddenfield.setDisplayType("hidden");
      hiddenfield = form.getField("custrecord_" + _prefix + "_next_wflevel_no");
      hiddenfield.setDisplayType("hidden");
      hiddenfield = form.getField("custrecord_" + _prefix + "_nextapprover");
      hiddenfield.setDisplayType("hidden");
      hiddenfield = form.getField("custrecord_" + _prefix + "_currenteditor");
      hiddenfield.setDisplayType("hidden");
      hiddenfield = form.getField("custrecord_" + _prefix + "_additionalmsg");
      hiddenfield.setDisplayType("hidden");
      hiddenfield = form.getField("custrecord_" + _prefix + "_comments");
      hiddenfield.setDisplayType("hidden");
      hiddenfield = form.getField("custrecord_" + _prefix + "_confirmflag");
      hiddenfield.setDisplayType("hidden");
      hiddenfield = form.getField("custrecord_" + _prefix + "_actiontaken");
      hiddenfield.setDisplayType("hidden");
      hiddenfield = form.getField("custrecord_" + _prefix + "_html2");
      hiddenfield.setDisplayType("hidden");
      hiddenfield = form.getField("custrecord_" + _prefix + "_approval_dt");
      hiddenfield.setDisplayType("hidden");
      hiddenfield = form.getField(
        "custrecord_" + _prefix + "_furthraprovalflag"
      );
      hiddenfield.setDisplayType("hidden");
      hiddenfield = form.getField("custrecord_" + _prefix + "_tot_no");
      hiddenfield.setDisplayType("hidden");
    }

    var nonEditableTillLevel = parseInt(
      nlapiGetFieldValue("custrecord_" + _prefix + "_app_no")
    );

    for (var i = i_total_no_appr + 1; i <= 5; i++) {
      var apprFld = form.getField("custrecord_" + _prefix + "_approver" + i);
      if (_logValidation(apprFld)) {
        apprFld.setDisplayType("hidden");
      }
    }
  } catch (e) {
    nlapiLogExecution("DEBUG", "userEventBeforeLoad", "Exception: " + e);
  }
  return true;
}

function beforeSubmit_AutoNumber(type) {
  if (type == "create") {
    try {
      var s_auto_prfix = "";
      _record_Type = nlapiGetRecordType().toString().toLowerCase();
      nlapiLogExecution(
        "DEBUG",
        "userEventBeforeLoad",
        "_record_Type: " + _record_Type
      );

      s_auto_prfix = "LON";

      var i_rec_type_id = nlapiGetFieldValue("rectype");

      var a_filter_unique_rec = new Array();
      a_filter_unique_rec[0] = new nlobjSearchFilter(
        "custrecord_hris_record_type",
        null,
        "anyof",
        i_rec_type_id
      );
      a_filter_unique_rec[1] = new nlobjSearchFilter(
        "isinactive",
        null,
        "is",
        "F"
      );
      var a_col_unique_rec = new Array();
      a_col_unique_rec[0] = new nlobjSearchColumn(
        "custrecord_hris_record_type"
      );
      a_col_unique_rec[1] = new nlobjSearchColumn(
        "custrecord_hris_unique_number"
      );
        nlapiLogExecution(
        "DEBUG",
        'beforesearch');
      var o_search_unique_ref = nlapiSearchRecord(
        "customrecord_hris_unique_reference_numbe",
        null,
        a_filter_unique_rec,
        a_col_unique_rec
      );
      if (_logValidation(o_search_unique_ref)) {
          nlapiLogExecution(
        "DEBUG",
        'inside search'
      );
        var i_id_unique_ref = o_search_unique_ref[0].getId();
        var i_unique_num = o_search_unique_ref[0].getValue(
          "custrecord_hris_unique_number"
        );
        i_unique_num = parseInt(i_unique_num) + 1;
        var d_current_date = getCompanyCurrentDateTime();
        d_current_date = nlapiDateToString(d_current_date, "date");
        d_current_date = nlapiStringToDate(d_current_date, "date");

        var i_fullYear = d_current_date.getFullYear();

        var i_employee = nlapiGetFieldValue("custrecord_hris_loan_emp_name");

        var s_name = nlapiLookupField("employee", i_employee, "firstname");
          nlapiLogExecution(
        "DEBUG",
        "userEventBeforeLoad",
        "s_name: " + s_name
      );
        var s_emp_char = "";
        if (_logValidation(s_name)) {
          s_name = s_name.toUpperCase();
          s_emp_char = s_name.substring(0, 1);

          var lastFour = s_name.substr(s_name.length - 3);
        }

        var s_auto_number =
          s_auto_prfix +
          "-" +
          (s_emp_char.toString() + lastFour.toString()) +
          "-" +
          i_unique_num +
          "-" +
          i_fullYear;
        nlapiSetFieldValue("name", s_auto_number);

        nlapiSubmitField(
          "customrecord_hris_unique_reference_numbe",
          i_id_unique_ref,
          "custrecord_hris_unique_number",
          i_unique_num
        );
      }
    } catch (e) {
      if (e instanceof nlobjError) {
        nlapiLogExecution(
          "DEBUG",
          "SearchRecforSameidformed_1 system error",
          e.getCode() + "\n" + e.getDetails()
        );
      } else {
        nlapiLogExecution(
          "DEBUG",
          "SearchRecforSameidformed_1 unexpected error",
          e.toString()
        );
      }
    }
  }
}

function _Is_Valid(value) {
  if (value != null && value != "" && value != "undefined") {
    return true;
  }
  return false;
}

function _logValidation(value) {
  if (
    value != null &&
    value != undefined &&
    value != "" &&
    value != "undefined"
  ) {
    return true;
  } else {
    return false;
  }
}

function _nullValidation(val) {
  if (val == null || val == undefined || val == "") {
    return true;
  } else {
    return false;
  }
}
function getCompanyCurrentDateTime() {
  var currentDateTime = new Date();
  var companyTimeZone =
    nlapiLoadConfiguration("companyinformation").getFieldText("timezone");
  var timeZoneOffSet =
    companyTimeZone.indexOf("(GMT)") == 0
      ? 0
      : new Number(
          companyTimeZone
            .substr(4, 6)
            .replace(/\+|:00/gi, "")
            .replace(/:30/gi, ".5")
        );
  var UTC =
    currentDateTime.getTime() + currentDateTime.getTimezoneOffset() * 60000;
  var companyDateTime = UTC + timeZoneOffSet * 60 * 60 * 1000;

  return new Date(companyDateTime);
}
