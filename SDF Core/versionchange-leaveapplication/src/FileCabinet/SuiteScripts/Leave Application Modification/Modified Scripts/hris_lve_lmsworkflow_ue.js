
function userEventBeforeLoad(type, form, request) {
	
	if (!isFieldEmpty(nlapiGetFieldValue("custrecord_hris_lve_staus"))) {

		var statusInColor = '<BR>' + '<font size=2>' + 'STATUS' + '</font>'
				+ '<BR>' + '<font color="red" size=2>'
				+ nlapiGetFieldValue("custrecord_hris_lve_staus") + '</font>';
	} else {
		var statusInColor = '<BR>' + '<font size=2>' + 'STATUS' + '</font>'
				+ '<BR>' + '<font color="red" size=2>' + 'Draft' + '</font>';
	}
	nlapiSetFieldValue("custrecord_hris_lve_status_incolor", statusInColor, false);
	
	var statusInColorfield = form.getField("custrecord_hris_lve_status_incolor");
	statusInColorfield.setLabel("");
	
	var namefield = form.getField("custrecord_hris_lve_staus");
	namefield.setDisplayType("hidden");
	/* hide status in text */
	
	
	var curWFLval = nlapiGetFieldValue("custrecord_hris_lve_current_wflevel_no");
  nlapiSetFieldValue("custrecord_hris_lve_curt_wflevel_no_high", curWFLval, false);
	

	
	var nonEditableTillLevel = parseInt(nlapiGetFieldValue("custrecord_hris_lve_current_wflevel_no"));

	if (nlapiGetFieldValue("custrecord_hris_lve_current_wflevel_no") >= 20) {
		nonEditableTillLevel = 8; // set it to Total WF Levels
	}

	if (nlapiGetFieldValue("custrecord_hris_lve_current_wflevel_no") > 0
			& nlapiGetFieldValue("custrecord_hris_lve_current_wflevel_no") < 8) {
		for (var n = 1; n <= nonEditableTillLevel; n++) {
			var approverfield = form.getField("custrecord_hris_lve_approver" + n);
			//approverfield.setDisplayType("inline");
		}
	}
	
	
	var _Role = nlapiGetContext().getRoleId();
    nlapiLogExecution('DEBUG', '', 'Role: ' + _Role);
    
    if (_Role != "administrator" && _Role != "full_access" && _Role != "customrole1128") //
	//if (nlapiGetContext().getRoleId() != "administrator") 
	
	{
		var hiddenfield = form.getField("custrecord_hris_lve_wfhelp");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_totno_approvers");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_wflow_setup");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_current_approver");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_current_wflevel_no");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_next_wflevel_no");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_next_approver");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_current_editor");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_additional_msg");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_comments");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_workflow_actionflag");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_action_taken");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_approval_date");
		hiddenfield.setDisplayType("hidden");

		hiddenfield = form.getField("custrecord_hris_lve_html2");
		hiddenfield.setDisplayType("hidden");

	}
	
	var totNoWFLevel = nlapiGetFieldValue("custrecord_hris_lve_total_wflevels");
	if(!isFieldEmpty(totNoWFLevel)){
		totNoWFLevel = parseInt(totNoWFLevel);
		if(totNoWFLevel< 10){
			nlapiLogExecution('DEBUG', 'Hide Unused Apporvers Fields', 'totNoWFLevel:'+totNoWFLevel)
			for(var i = totNoWFLevel+1;i<=10;i++){
				nlapiLogExecution('DEBUG', 'Hide Unused Apporvers Fields', 'custrecord_hris_lve_approver:'+i)
				var apprFld = form.getField("custrecord_hris_lve_approver"+i)
				if(apprFld != null){
					nlapiLogExecution('DEBUG', 'Hide Unused Apporvers Fields', 'Hide: custrecord_hris_lve_approver:'+i)
					apprFld.setDisplayType("hidden");
				}
			}
		}
	}
	
}



function isFieldEmpty(value)
{
    if(value =='null' || value == null || value == null || value == '' || value == undefined || value == undefined || value == 'undefined' || value == 'undefined'|| value == 'NaN' || value == NaN)
    {
        return true;
    }
    else
    {
        return false;
    }
}