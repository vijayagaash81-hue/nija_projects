/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/runtime'], (runtime) => {

    
    function userEventBeforeLoad(type, form, request) {
    	
    	if (!isFieldEmpty(scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_staus" }))) {
    
    		const statusInColor = '<BR>' + '<font size=2>' + 'STATUS' + '</font>'
    				+ '<BR>' + '<font color="red" size=2>'
    				+ scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_staus" }) + '</font>';
    	} else {
    		const statusInColor = '<BR>' + '<font size=2>' + 'STATUS' + '</font>'
    				+ '<BR>' + '<font color="red" size=2>' + 'Draft' + '</font>';
    	}
    	scriptContext.currentRecord.setValue({ fieldId: "custrecord_hris_lve_status_incolor", value: statusInColor, ignoreFieldChange: false });
    	
    	const statusInColorfield = form.getField("custrecord_hris_lve_status_incolor");
    	statusInColorfield.setLabel("");
    	
    	const namefield = form.getField("custrecord_hris_lve_staus");
    	namefield.setDisplayType("hidden");
    	/* hide status in text */
    	
    	
    	const curWFLval = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_current_wflevel_no" });
      scriptContext.currentRecord.setValue({ fieldId: "custrecord_hris_lve_curt_wflevel_no_high", value: curWFLval, ignoreFieldChange: false });
    	
    
    	
    	const nonEditableTillLevel = parseInt(scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_current_wflevel_no" }));
    
    	if (scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_current_wflevel_no" }) >= 20) {
    		nonEditableTillLevel = 8; // set it to Total WF Levels
    	}
    
    	if (scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_current_wflevel_no" }) > 0
    			& scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_current_wflevel_no" }) < 8) {
    		for (const n = 1; n <= nonEditableTillLevel; n++) {
    			const approverfield = form.getField("custrecord_hris_lve_approver" + n);
    			//approverfield.setDisplayType("inline");
    		}
    	}
    	
    	
    	const _Role = runtime.getCurrentUser().role;
        log.debug({ title: '', details: 'Role: ' + _Role });
        
        if (_Role != "administrator" && _Role != "full_access" && _Role != "customrole1128") //
    	//if (runtime.getCurrentUser().role != "administrator") 
    	
    	{
    		const hiddenfield = form.getField("custrecord_hris_lve_wfhelp");
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
    	
    	const totNoWFLevel = scriptContext.currentRecord.getValue({ fieldId: "custrecord_hris_lve_total_wflevels" });
    	if(!isFieldEmpty(totNoWFLevel)){
    		totNoWFLevel = parseInt(totNoWFLevel);
    		if(totNoWFLevel< 10){
    			log.debug({ title: 'Hide Unused Apporvers Fields', details: 'totNoWFLevel:'+totNoWFLevel })
    			for(const i = totNoWFLevel+1;i<=10;i++){
    				log.debug({ title: 'Hide Unused Apporvers Fields', details: 'custrecord_hris_lve_approver:'+i })
    				const apprFld = form.getField("custrecord_hris_lve_approver"+i)
    				if(apprFld != null){
    					log.debug({ title: 'Hide Unused Apporvers Fields', details: 'Hide: custrecord_hris_lve_approver:'+i })
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

    return {
        userEventBeforeLoad: userEventBeforeLoad
    };
});
