/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/runtime'], (runtime) => {

    const g_Type = "";
    
    function pageInit_getType(type)
    {
    	g_Type = type;
    }
    
    
    function validateDelete_fileUpload(type){
    	
    	//getting the current employee and exp rep employee
    	const i_Current_User = runtime.getCurrentUser().id;
    	const i_Exp_Emp = scriptContext.currentRecord.getValue({ fieldId: 'entity' });
       
     
    	if (type == 'recmachcustrecord_exp_link') 
    	{
    		
    			const i_File_Upload_Id = nlapiGetCurrentLineItemValue('recmachcustrecord_exp_link', 'custrecord_attach_file');
    			if (_logValidation(i_File_Upload_Id)) {
    				const url = nlapiResolveURL('SUITELET', 'customscript_hris_ess_deletefilecab_sl', 'customdeploy_hris_ess_deletefilecab_sl') + '&entity=' + i_File_Upload_Id;
    				nlapiRequestURL(url);
    			}		
    	}//end of if (type == 'recmachcustrecord_exp_link') 
    	return true;
    
    }
    // END VALIDATE FIELD ===============================================
    
    
    function fieldChange_callPOPWindow(type, name, linenum){
    	
    	const i_Current_User = runtime.getCurrentUser().id;
    	const s_record_type = (scriptContext.newRecord ? scriptContext.newRecord.type : scriptContext.currentRecord.type);
    	const _prefix = '';
    	const s_folder_name_document = '';
        const custformscript =scriptContext.currentRecord.getValue({ fieldId: 'custrecord_hris_lve_script_version' });
     //  log.debug({ title: "custformscript", details: custformscript })
    //if (custformscript == 1){ 
    
    	
    	if (s_record_type.toString().toLowerCase() == 'customrecord_hris_leaveapplication') // If record is Employee Profile
        {
    		
    		_prefix = 'ihr_la';
    		//alert('_prefix');
    		s_folder_name_document = 'ELS Support Document';
        }
    	
    	if(name == 'custrecord_hris_lve_attachdocument')
    	{	
    		const s_folder_name = s_folder_name_document;
    		const s_fld_attach_file = 'custrecord_hris_lve_supportdocument';
    		const s_sublist_id = '';
    		
    		const b_attachFile = scriptContext.currentRecord.getValue({ fieldId: name });
    		
    		 if (b_attachFile == 'T') {
    			 //POPUP window Open
                fileUploadOptimized(s_record_type, name, s_fld_attach_file, false, s_sublist_id, s_folder_name);
            }
            else {
                const i_File_Upload_Id = scriptContext.currentRecord.getValue({ fieldId: s_fld_attach_file });
                if (_logValidation(i_File_Upload_Id)) {
                    const url = nlapiResolveURL('SUITELET', 'customscript_hris_ess_deletefilecab_sl', 'customdeploy_hris_ess_deletefilecab_sl');
                        url += '&entity=' + i_File_Upload_Id
    				nlapiRequestURL(url);
                    // alert('success');
                    scriptContext.currentRecord.setValue({ fieldId: s_fld_attach_file, value: '', ignoreFieldChange: false });
                }
            }
    	} 
    	
    	
    	
    	
    //}// End function field change
    }
    function fileUploadOptimized(recType, changedFldID, attchFldID, isLineFld, machineNm, folderNmPrefix){
    //alert('folderNmPrefix-'+folderNmPrefix);
        if (isLineFld == true) {
        
            const b_uploafFileCheck = nlapiGetCurrentLineItemValue(machineNm, changedFldID);
            
            if (b_uploafFileCheck == 'T') {//POP Open
                //-------------------Open the popup for upload file-------------------------
                const i_File_Upload_Id = nlapiGetCurrentLineItemValue(machineNm, attchFldID);
                
                const i_recLineId = nlapiGetCurrentLineItemIndex(machineNm);
                
                const winURL = nlapiResolveURL('SUITELET', 'customscript_hris_ess_uploadfile_sl', 'customdeploy_hris_ess_uploadfile_sl');
                
                winURL += '&recType=' + recType + '&attachFldNm=' + attchFldID + '&changedFldNm=' + changedFldID + '&fileUploadId=' + i_File_Upload_Id + '&machineNm=' + machineNm + '&isLineFld=' + isLineFld + '&folderNmPrefix=' + folderNmPrefix;
                
                nlExtOpenWindow(winURL, '', 450, 300, '', false, "Upload File");
                
            }//POP Open
            
        }//end if (isLineFld == true)
        else
        {
        	const b_uploafFileCheck = scriptContext.currentRecord.getValue({ fieldId: changedFldID });
            
            if (b_uploafFileCheck == 'T') {//POP Open
                //-------------------Open the popup for upload file-------------------------
                const i_File_Upload_Id = scriptContext.currentRecord.getValue({ fieldId: attchFldID });
                const winURL = nlapiResolveURL('SUITELET', 'customscript_hris_ess_uploadfile_sl', 'customdeploy_hris_ess_uploadfile_sl');
                
                winURL += '&recType=' + recType + '&attachFldNm=' + attchFldID + '&changedFldNm=' + changedFldID + '&fileUploadId=' + i_File_Upload_Id + '&machineNm=' + machineNm + '&isLineFld=' + isLineFld + '&folderNmPrefix=' + folderNmPrefix;
                
                nlExtOpenWindow(winURL, '', 450, 300, '', false, "Upload File");
            }
        }//else of if (isLineFld == true)
       
        
    }// End function fileUploadOptimized
    
    //Below function trigger from suitelet form (upload file suitelet)
    function setFileOptimized(File_Id, type, attchFldID, fileExist, foldername, fileSize, fileType, changedFldID, machineNm, isLineFld)
    {
    	
    	//For line level upload
        if (isLineFld == 'true') 
        {     
            nlapiSetCurrentLineItemValue(machineNm, attchFldID, File_Id);            
            closePopup();        
        }//end if (isLineFld)
        else
        {
        	//For Body field upload    	
        	scriptContext.currentRecord.setValue({ fieldId: attchFldID, value: File_Id, ignoreFieldChange: false });            
            closePopup();
        }    
    }//End function setFileOptimized
    
    
    //Below function trigger from suitelet form (upload file suitelet)
    function folderDoesNotExist()
    {
    	alert('Please Create Folder');
    	closePopup();
    }
    
    //-----------------------------------------
    /**
     *
     * @param {Object} value
     *
     * Description --> If the value is blank /null/undefined returns false else returns true
     */
    function _logValidation(value){
        if (value != null && value.toString() != null && value != '' && value != undefined && value.toString() != undefined && value != 'undefined' && value.toString() != 'undefined' && value.toString() != 'NaN' && value != NaN) {
            return true;
        }
        else {
            return false;
        }
    }

    return {
        pageInit_getType: pageInit_getType,
        validateDelete_fileUpload: validateDelete_fileUpload
    };
});
