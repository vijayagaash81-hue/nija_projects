/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/runtime'], (record, search, runtime) => {

    {
    
    
    	const _prefix = '';
    	const _record_Type = '';
    
    }
    function beforeLoad_highlightStatus(type,form)
    {
    	try
    	{	
    	    const _Role = runtime.getCurrentUser().role;
    	    const i_role = runtime.getCurrentUser().role;
    	    
    		const _record_Type = (scriptContext.newRecord ? scriptContext.newRecord.type : scriptContext.currentRecord.type).toString().toLowerCase();
    		
    		 const hiddenfield = form.getField("name" );
    	        hiddenfield.setDisplayType("disabled");
    		if(type == 'create')
    		{
    			
    			hiddenfield = form.getField("custrecord_" + _prefix + "_workflowstatus");
    	        hiddenfield.setDisplayType("hidden"); 
    		}
    		
    		
    		if(type == 'view' && _record_Type == 'customrecord_hris_lve_letter_req')
    		{
    			const i_currentWFLevel = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_letreq_current_approval' });
    			const i_certificate = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_letreq_certificateletter' });
    			const s_signature = nlapiGetFieldText('custrecord_hris_letreq_signature');
    			const i_workflowStatus = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_letreq_workflow_statuslr' });
    			const i_requester = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_letreq_requester' });
    			const i_internalId = (scriptContext.newRecord ? scriptContext.newRecord.id : scriptContext.currentRecord.id);
    			
    			form.setScript('customscript_cli_ihr_ess_ssr_btnclick');
    			if((i_role == 1001 || i_role == 1003)  && i_currentWFLevel == '2')
    			{
    				if(i_workflowStatus != 5)
    				{
    					if(_nullValidation(i_certificate))
    					{
    						form.addButton('custpage_preview_document', 'Preview Document', 'onClickPreviewDocBtn(\'' + s_signature + '\');');
    					}
    					else{
    						form.addButton('custpage_preview_document', 'Issue Letter', 'onClickIssueLatterBtn(\'' + i_requester + '\');');
    					}
    				}
    				
    			}
    		}
    	 	
    		/* if(type == 'view' && _record_Type == 'customrecord_ihr_ess_awardrequest')
    		{
    			const i_currentWFLevel = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_ihr_ess_awd_current_wflevelno' });
    			const i_certificate = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_ihr_awd_awardcertificate' });			
    			const i_internalId = (scriptContext.newRecord ? scriptContext.newRecord.id : scriptContext.currentRecord.id);
    			const i_workflowStatus = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_ihr_ess_awd_workflowstatus' });
    			form.setScript('customscript_cli_ihr_ess_ssr_btnclick');
    			if(i_role == 1003)
    			{
    				if(i_workflowStatus == 5)
    				{
    					if(_nullValidation(i_certificate))
    					{
    						form.addButton('custpage_award_certificate', 'Generate Award Certificate', 'onClickAward_Certificate();');
    					}
    					
    				}
    				
    			}
    		} */
    		
    		
    		
    		
    	    if (!isFieldEmpty(scriptContext.currentRecord.getValue({ fieldId: "custrecord_" + _prefix + "_status" })))
    		{
    			const statusInColor = '<BR>' + '<font size=2>' + 'STATUS' + '</font>' +
    			'<BR>' +
    			'<font color="red" size=2>' +
    			scriptContext.currentRecord.getValue({ fieldId: "custrecord_" + _prefix + "_status" }) +
    			'</font>';
    		}
    		else
    		{
    			if(type != 'create')
    			{
    				const statusInColor = '<BR>' + '<font size=2>' + 'STATUS' + '</font>' +
    				'<BR>' +
    				'<font color="red" size=2>' +
    				'Draft' +
    				'</font>';
    				
    				
    			}
    		}
    	    scriptContext.currentRecord.setValue({ fieldId: "custrecord_" + _prefix + "_status_in_color", value: statusInColor, ignoreFieldChange: false });
    	    
    	    const statusInColorfield = form.getField("custrecord_" + _prefix + "_status_in_color");
    	    
    	    const namefield = form.getField("custrecord_" + _prefix + "_status");
    	    namefield.setDisplayType("hidden");
    	    
    	    const curWFLval = scriptContext.currentRecord.getValue({ fieldId: "custrecord_" + _prefix + "_current_wflevelno" });
    	    scriptContext.currentRecord.setValue({ fieldId: "custrecord_" + _prefix + "_crntwflvlnohighli", value: curWFLval, ignoreFieldChange: false });	    
    	    
    	    if (_Role != "administrator" && _Role != "full_access") 
    	    {
    	        const hiddenfield = form.getField("custrecord_" + _prefix + "_wfhelp");
    	        hiddenfield.setDisplayType("hidden");
    	        hiddenfield = form.getField("custrecord_" + _prefix + "_app_no");
    	        hiddenfield.setDisplayType("hidden");
    	        hiddenfield = form.getField("custrecord_" + _prefix + "_wfs");
    	        hiddenfield.setDisplayType("hidden");
    	        hiddenfield = form.getField("custrecord_" + _prefix + "_currentapprover");
    	        hiddenfield.setDisplayType("hidden"); 
    	        hiddenfield = form.getField("custrecord_" + _prefix + "_special_comments");
    	        hiddenfield.setDisplayType("hidden");
    	        hiddenfield = form.getField("custrecord_" + _prefix + "_workflowstatus");
    	        hiddenfield = form.getField("custrecord_" + _prefix + "_current_wflevelno");
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
    	        hiddenfield = form.getField("custrecord_" + _prefix + "_furthraprovalflag");
    	        hiddenfield.setDisplayType("hidden");
    	        hiddenfield = form.getField("custrecord_" + _prefix + "_tot_no");
    	        hiddenfield.setDisplayType("hidden");
    	    }	    
    	    
    	   const nonEditableTillLevel = parseInt(scriptContext.currentRecord.getValue({ fieldId: "custrecord_" + _prefix + "_app_no" }));
    	    
    	   for (const i = i_total_no_appr+1; i <= 5; i++)
            {
                
                const apprFld = form.getField("custrecord_" + _prefix + "_approver" + i);
                if (_logValidation(apprFld))
                {
                    apprFld.setDisplayType("hidden");
                }
            }
    	    
    	    
    	}
    	catch(e)
    	{
    		log.debug({ title: 'userEventBeforeLoad', details: 'Exception: ' + e });
    	}
    	return true;
    
    }
    
    function beforeSubmit_AutoNumber(type){
    	  
        if (type == 'create') 
        {
            try 
            {
    			const leaveBal = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_leavebalance' });
    			if(leaveBal){
    				
    				scriptContext.currentRecord.setValue({ fieldId: 'custrecord_lms_leave_bal_for_cal', value: leaveBal, ignoreFieldChange: false });
    				
    			}
    			
            	const s_auto_prfix = '';
            	_record_Type = (scriptContext.newRecord ? scriptContext.newRecord.type : scriptContext.currentRecord.type).toString().toLowerCase();
        	    log.debug({ title: 'userEventBeforeLoad', details: '_record_Type: ' + _record_Type });
        	    const recordType = (scriptContext.newRecord ? scriptContext.newRecord.type : scriptContext.currentRecord.type);
    			if(recordType == 'customrecord_hris_lve_letter_req')
    			{
    				s_auto_prfix = 'LTR';
    			}
    			else if(recordType=='customrecord_hris_empchange_loan_applicn'){
        	        s_auto_prfix = 'LON';
    			}
    			else if(recordType == 'customrecord_hris_lve_raise_comp_off')
    			{
    				s_auto_prfix = 'RC';
    			}
                  else if(recordType == 'customrecord_hris_empallocationtransfer')
    			{
    				s_auto_prfix = 'EA';
    			}
    			else
    			{
    				s_auto_prfix = 'LA'
    			}
        	    
        	    const i_rec_type_id = scriptContext.currentRecord.getValue({ fieldId: 'rectype' });
        	    log.debug({ title: 'i_rec_type_id', details: i_rec_type_id })
        	    const a_filter_unique_rec = new Array();
        	    a_filter_unique_rec[0] = new nlobjSearchFilter('custrecord_hris_record_type', null, 'anyof', i_rec_type_id);
        	    a_filter_unique_rec[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
                const a_col_unique_rec = new Array();
                a_col_unique_rec[0] = new nlobjSearchColumn('custrecord_hris_record_type');
                a_col_unique_rec[1] = new nlobjSearchColumn('custrecord_hris_unique_number');        
                const o_search_unique_ref = search.create({ type: 'customrecord_hris_unique_reference_numbe', filters: a_filter_unique_rec, columns: a_col_unique_rec }).run();
                if (_logValidation(o_search_unique_ref)) 
                {            	
                	const i_id_unique_ref =  o_search_unique_ref[0].getId();
                	const i_unique_num = o_search_unique_ref[0].getValue('custrecord_hris_unique_number');
                	i_unique_num = parseInt(i_unique_num)+1;
                	const d_current_date = getCompanyCurrentDateTime();
                	d_current_date = nlapiDateToString(d_current_date, 'date');
                	d_current_date = nlapiStringToDate(d_current_date, 'date');
                	
                	const i_fullYear = d_current_date.getFullYear();
                	
    				if(recordType == 'customrecord_hris_lve_letter_req')
    				{
                      const i_employee = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_letreq_employee_name' });
    				}
    				else if(recordType=='customrecord_hris_empchange_loan_applicn'){
    					
                      const i_employee = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_loan_emp_code' });
                	
    				}
                      else if(recordType=='customrecord_hris_empallocationtransfer'){
    					
                      const i_employee = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_alloc_empid' });
                	
    				}
    				else if(recordType == 'customrecord_hris_lve_raise_comp_off')
    				{
    					const i_employee = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_rcomp_employee_name' });
    				}
    				else{
    				  
    				  const i_employee = scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_employeename' });
                	
    				}
    				
                	const s_name = nlapiLookupField('employee', i_employee, 'firstname');
                	const s_emp_char = '';
                	/* if(_logValidation(s_name))
                	{
                		s_name = s_name.toUpperCase();
                		s_emp_char = s_name.substring(0, 1);
    					const lastFour = s_name.substr(s_name.length - 3); 
                	} */
                  if (_logValidation(s_name)) {
        const nameParts = s_name.split(" ");
        if (!isNaN(nameParts[0])) {
            nameParts.shift(); // Remove numeric prefix
        }
        s_name = nameParts.join(" "); // Rejoin the remaining parts
        s_name = s_name.toUpperCase();
        s_emp_char = s_name.substring(0, 2); // Extract the first two letters
    }
                	
                	const s_auto_number = s_auto_prfix+'-'+i_unique_num+'-'+i_fullYear;
                	scriptContext.currentRecord.setValue({ fieldId: 'name', value: s_auto_number, ignoreFieldChange: false });
                	
                	record.submitFields({ type: 'customrecord_hris_unique_reference_numbe', id: i_id_unique_ref, values: { 'custrecord_hris_unique_number': i_unique_num } });
                	
                }
        	    
            }
            catch (e) {
                if (e instanceof nlobjError) {                
                    log.debug({ title: 'SearchRecforSameidformed_1 system error', details: e.getCode( }) + '\n' + e.getDetails());
                }
                else {               
                    log.debug({ title: 'SearchRecforSameidformed_1 unexpected error', details: e.toString( }));
                }
            }
        }
    }
    function _AfterSubmit_set_Extended_leaveRefnum(type) 
    {
    	try{
    	 if(type == 'create') 
    	 {
    		 const id = (scriptContext.newRecord ? scriptContext.newRecord.id : scriptContext.currentRecord.id);
    		 const rec_type = (scriptContext.newRecord ? scriptContext.newRecord.type : scriptContext.currentRecord.type);
    		 const rec_load = record.load({ type: rec_type, id: id });
    		 const extended_from_leave = rec_load.getFieldValue('custrecord_hris_lve_levappextenfromlev');
    		 if(extended_from_leave)
    		 {
    			record.submitFields({ type: rec_type, id: extended_from_leave, values: { 'custrecord_hris_lve_exten_lveappli_refn0': id } });
    		 }
    	 }
    	}catch(e)
    	{
    		
    	}
    }
    
    
    function _Is_Valid(value)
    {
        if (value != null && value != '' && value != 'undefined')
        {
            return true;
        }
        return false;
    }
    
    function _logValidation(value){
        if (value != null && value != undefined && value != '' && value != 'undefined') {
            return true;
        }
        else {
            return false;
        }
        
    }
    
    function _nullValidation(val){
        if (val == null || val == undefined || val == '') {
            return true;
        }
        else {
            return false;
        }
        
    }
    function getCompanyCurrentDateTime(){
        const currentDateTime = new Date();
        const companyTimeZone = nlapiLoadConfiguration('companyinformation').getFieldText('timezone');
        const timeZoneOffSet = (companyTimeZone.indexOf('(GMT)') == 0) ? 0 : new Number(companyTimeZone.substr(4, 6).replace(/\+|:00/gi, '').replace(/:30/gi, '.5'));
        const UTC = currentDateTime.getTime() + (currentDateTime.getTimezoneOffset() * 60000);
        const companyDateTime = UTC + (timeZoneOffSet * 60 * 60 * 1000);
        
        return new Date(companyDateTime);
    }

    return {
        beforeLoad_highlightStatus: beforeLoad_highlightStatus,
        beforeSubmit_AutoNumber: beforeSubmit_AutoNumber,
        _AfterSubmit_set_Extended_leaveRefnum: _AfterSubmit_set_Extended_leaveRefnum
    };
});
