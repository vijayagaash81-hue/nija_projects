/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/search', 'N/query', 'N/format', 'N/record', 'N/currentRecord', 'N/url', 'N/runtime', 'N/ui/serverWidget', './moment.js'],
    (search, query, format, record, currentRecord, url, runtime, serverWidget, moment) => {

/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
{


	let _prefix = '';
	let _record_Type = '';

}
function beforeLoad_highlightStatus(type,form)
{
	try
	{	
	    let _Role = nlapiGetContext().getRoleId();
	    let i_role = nlapiGetRole();
	    
		let _record_Type = nlapiGetRecordType().toString().toLowerCase();
		
		 let hiddenfield = form.getField("name" );
	        hiddenfield.setDisplayType("disabled");
		if(type == 'create')
		{
			
			hiddenfield = form.getField("custrecord_" + _prefix + "_workflowstatus");
	        hiddenfield.setDisplayType("hidden"); 
		}
		
		
		if(type == 'view' && _record_Type == 'customrecord_hris_lve_letter_req')
		{
			let i_currentWFLevel = nlapiGetFieldValue('custrecord_hris_letreq_current_approval');
			let i_certificate = nlapiGetFieldValue('custrecord_hris_letreq_certificateletter');
			let s_signature = nlapiGetFieldText('custrecord_hris_letreq_signature');
			let i_workflowStatus = nlapiGetFieldValue('custrecord_hris_letreq_workflow_statuslr');
			let i_requester = nlapiGetFieldValue('custrecord_hris_letreq_requester');
			let i_internalId = nlapiGetRecordId();
			
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
			let i_currentWFLevel = nlapiGetFieldValue('custrecord_ihr_ess_awd_current_wflevelno');
			let i_certificate = nlapiGetFieldValue('custrecord_ihr_awd_awardcertificate');			
			let i_internalId = nlapiGetRecordId();
			let i_workflowStatus = nlapiGetFieldValue('custrecord_ihr_ess_awd_workflowstatus');
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
		
		
		
		
	    if (!isFieldEmpty(nlapiGetFieldValue("custrecord_" + _prefix + "_status")))
		{
			let statusInColor = '<BR>' + '<font size=2>' + 'STATUS' + '</font>' +
			'<BR>' +
			'<font color="red" size=2>' +
			nlapiGetFieldValue("custrecord_" + _prefix + "_status") +
			'</font>';
		}
		else
		{
			if(type != 'create')
			{
				let statusInColor = '<BR>' + '<font size=2>' + 'STATUS' + '</font>' +
				'<BR>' +
				'<font color="red" size=2>' +
				'Draft' +
				'</font>';
				
				
			}
		}
	    nlapiSetFieldValue("custrecord_" + _prefix + "_status_in_color", statusInColor, false);
	    
	    let statusInColorfield = form.getField("custrecord_" + _prefix + "_status_in_color");
	    
	    let namefield = form.getField("custrecord_" + _prefix + "_status");
	    namefield.setDisplayType("hidden");
	    
	    let curWFLval = nlapiGetFieldValue("custrecord_" + _prefix + "_current_wflevelno");
	    nlapiSetFieldValue("custrecord_" + _prefix + "_crntwflvlnohighli", curWFLval, false);	    
	    
	    if (_Role != "administrator" && _Role != "full_access") 
	    {
	        let hiddenfield = form.getField("custrecord_" + _prefix + "_wfhelp");
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
	    
	   let nonEditableTillLevel = parseInt(nlapiGetFieldValue("custrecord_" + _prefix + "_app_no"));
	    
	   for (let i = i_total_no_appr+1; i <= 5; i++)
        {
            
            let apprFld = form.getField("custrecord_" + _prefix + "_approver" + i);
            if (_logValidation(apprFld))
            {
                apprFld.setDisplayType("hidden");
            }
        }
	    
	    
	}
	catch(e)
	{
		nlapiLogExecution('DEBUG', 'userEventBeforeLoad', 'Exception: ' + e);
	}
	return true;

}

function beforeSubmit_AutoNumber(type){
	  
    if (type == 'create') 
    {
        try 
        {
			let leaveBal = nlapiGetFieldValue('custrecord_hris_lve_leavebalance');
			if(leaveBal){
				
				nlapiSetFieldValue('custrecord_lms_leave_bal_for_cal', leaveBal);
				
			}
			
        	let s_auto_prfix = '';
        	_record_Type = nlapiGetRecordType().toString().toLowerCase();
    	    nlapiLogExecution('DEBUG', 'userEventBeforeLoad', '_record_Type: ' + _record_Type);
    	    let recordType = nlapiGetRecordType();
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
    	    
    	    let i_rec_type_id = nlapiGetFieldValue('rectype');
    	    nlapiLogExecution('DEBUG', 'i_rec_type_id', i_rec_type_id)
    	    let a_filter_unique_rec = new Array();
    	    a_filter_unique_rec[0] = new nlobjSearchFilter('custrecord_hris_record_type', null, 'anyof', i_rec_type_id);
    	    a_filter_unique_rec[1] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
            let a_col_unique_rec = new Array();
            a_col_unique_rec[0] = new nlobjSearchColumn('custrecord_hris_record_type');
            a_col_unique_rec[1] = new nlobjSearchColumn('custrecord_hris_unique_number');        
            let o_search_unique_ref = nlapiSearchRecord('customrecord_hris_unique_reference_numbe', null, a_filter_unique_rec, a_col_unique_rec);
            if (_logValidation(o_search_unique_ref)) 
            {            	
            	let i_id_unique_ref =  o_search_unique_ref[0].getId();
            	let i_unique_num = o_search_unique_ref[0].getValue('custrecord_hris_unique_number');
            	i_unique_num = parseInt(i_unique_num)+1;
            	let d_current_date = getCompanyCurrentDateTime();
            	d_current_date = nlapiDateToString(d_current_date, 'date');
            	d_current_date = nlapiStringToDate(d_current_date, 'date');
            	
            	let i_fullYear = d_current_date.getFullYear();
            	
				if(recordType == 'customrecord_hris_lve_letter_req')
				{
                  let i_employee = nlapiGetFieldValue('custrecord_hris_letreq_employee_name');
				}
				else if(recordType=='customrecord_hris_empchange_loan_applicn'){
					
                  let i_employee = nlapiGetFieldValue('custrecord_hris_loan_emp_code');
            	
				}
                  else if(recordType=='customrecord_hris_empallocationtransfer'){
					
                  let i_employee = nlapiGetFieldValue('custrecord_hris_alloc_empid');
            	
				}
				else if(recordType == 'customrecord_hris_lve_raise_comp_off')
				{
					let i_employee = nlapiGetFieldValue('custrecord_hris_rcomp_employee_name');
				}
				else{
				  
				  let i_employee = nlapiGetFieldValue('custrecord_hris_lve_employeename');
            	
				}
				
            	let s_name = nlapiLookupField('employee', i_employee, 'firstname');
            	let s_emp_char = '';
            	/* if(_logValidation(s_name))
            	{
            		s_name = s_name.toUpperCase();
            		s_emp_char = s_name.substring(0, 1);
					let lastFour = s_name.substr(s_name.length - 3); 
            	} */
              if (_logValidation(s_name)) {
    let nameParts = s_name.split(" ");
    if (!isNaN(nameParts[0])) {
        nameParts.shift(); // Remove numeric prefix
    }
    s_name = nameParts.join(" "); // Rejoin the remaining parts
    s_name = s_name.toUpperCase();
    s_emp_char = s_name.substring(0, 2); // Extract the first two letters
}
            	
            	let s_auto_number = s_auto_prfix+'-'+i_unique_num+'-'+i_fullYear;
            	nlapiSetFieldValue('name', s_auto_number);
            	
            	nlapiSubmitField('customrecord_hris_unique_reference_numbe', i_id_unique_ref, 'custrecord_hris_unique_number', i_unique_num);
            	
            }
    	    
        }
        catch (e) {
            if (e instanceof nlobjError) {                
                nlapiLogExecution('DEBUG', 'SearchRecforSameidformed_1 system error', e.getCode() + '\n' + e.getDetails());
            }
            else {               
                nlapiLogExecution('DEBUG', 'SearchRecforSameidformed_1 unexpected error', e.toString());
            }
        }
    }
}
function _AfterSubmit_set_Extended_leaveRefnum(type) 
{
	try{
	 if(type == 'create') 
	 {
		 let id = nlapiGetRecordId();
		 let rec_type = nlapiGetRecordType();
		 let rec_load = nlapiLoadRecord(rec_type,id);
		 let extended_from_leave = rec_load.getFieldValue('custrecord_hris_lve_levappextenfromlev');
		 if(extended_from_leave)
		 {
			nlapiSubmitField(rec_type,extended_from_leave,'custrecord_hris_lve_exten_lveappli_refn0',id);
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
    let currentDateTime = new Date();
    let companyTimeZone = nlapiLoadConfiguration('companyinformation').getFieldText('timezone');
    let timeZoneOffSet = (companyTimeZone.indexOf('(GMT)') == 0) ? 0 : new Number(companyTimeZone.substr(4, 6).replace(/\+|:00/gi, '').replace(/:30/gi, '.5'));
    let UTC = currentDateTime.getTime() + (currentDateTime.getTimezoneOffset() * 60000);
    let companyDateTime = UTC + (timeZoneOffSet * 60 * 60 * 1000);
    
    return new Date(companyDateTime);
}


});
