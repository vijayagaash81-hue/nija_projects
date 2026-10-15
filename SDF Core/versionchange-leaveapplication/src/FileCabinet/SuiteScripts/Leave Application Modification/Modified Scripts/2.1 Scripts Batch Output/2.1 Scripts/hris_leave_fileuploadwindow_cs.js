/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/search', 'N/query', 'N/format', 'N/record', 'N/currentRecord', 'N/url', 'N/runtime', 'N/ui/serverWidget', './moment.js'],
    (search, query, format, record, currentRecord, url, runtime, serverWidget, moment) => {

/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
let g_Type = "";

function pageInit_getType(type)
{
	g_Type = type;
}


function validateDelete_fileUpload(type){
	
	//getting the current employee and exp rep employee
	let i_Current_User = nlapiGetUser();
	let i_Exp_Emp = nlapiGetFieldValue('entity');
   
 
	if (type == 'recmachcustrecord_exp_link') 
	{
		
			let i_File_Upload_Id = nlapiGetCurrentLineItemValue('recmachcustrecord_exp_link', 'custrecord_attach_file');
			if (_logValidation(i_File_Upload_Id)) {
				let url = nlapiResolveURL('SUITELET', 'customscript_hris_ess_deletefilecab_sl', 'customdeploy_hris_ess_deletefilecab_sl') + '&entity=' + i_File_Upload_Id;
				nlapiRequestURL(url);
			}		
	}//end of if (type == 'recmachcustrecord_exp_link') 
	return true;

}
// END VALIDATE FIELD ===============================================


function fieldChange_callPOPWindow(type, name, linenum){
	
	let i_Current_User = nlapiGetUser();
	let s_record_type = nlapiGetRecordType();
	let _prefix = '';
	let s_folder_name_document = '';
    let custformscript =nlapiGetFieldValue('custrecord_hris_lve_script_version');
 //  nlapiLogExecution("DEBUG","custformscript",custformscript)
//if (custformscript == 1){ 

	
	if (s_record_type.toString().toLowerCase() == 'customrecord_hris_leaveapplication') // If record is Employee Profile
    {
		
		_prefix = 'ihr_la';
		//alert('_prefix');
		s_folder_name_document = 'ELS Support Document';
    }
	
	if(name == 'custrecord_hris_lve_attachdocument')
	{	
		let s_folder_name = s_folder_name_document;
		let s_fld_attach_file = 'custrecord_hris_lve_supportdocument';
		let s_sublist_id = '';
		
		let b_attachFile = nlapiGetFieldValue(name);
		
		 if (b_attachFile == 'T') {
			 //POPUP window Open
            fileUploadOptimized(s_record_type, name, s_fld_attach_file, false, s_sublist_id, s_folder_name);
        }
        else {
            let i_File_Upload_Id = nlapiGetFieldValue(s_fld_attach_file);
            if (_logValidation(i_File_Upload_Id)) {
                let url = nlapiResolveURL('SUITELET', 'customscript_hris_ess_deletefilecab_sl', 'customdeploy_hris_ess_deletefilecab_sl');
                    url += '&entity=' + i_File_Upload_Id
				nlapiRequestURL(url);
                // alert('success');
                nlapiSetFieldValue(s_fld_attach_file, '');
            }
        }
	} 
	
	
	
	
//}// End function field change
}
function fileUploadOptimized(recType, changedFldID, attchFldID, isLineFld, machineNm, folderNmPrefix){
//alert('folderNmPrefix-'+folderNmPrefix);
    if (isLineFld == true) {
    
        let b_uploafFileCheck = nlapiGetCurrentLineItemValue(machineNm, changedFldID);
        
        if (b_uploafFileCheck == 'T') {//POP Open
            //-------------------Open the popup for upload file-------------------------
            let i_File_Upload_Id = nlapiGetCurrentLineItemValue(machineNm, attchFldID);
            
            let i_recLineId = nlapiGetCurrentLineItemIndex(machineNm);
            
            let winURL = nlapiResolveURL('SUITELET', 'customscript_hris_ess_uploadfile_sl', 'customdeploy_hris_ess_uploadfile_sl');
            
            winURL += '&recType=' + recType + '&attachFldNm=' + attchFldID + '&changedFldNm=' + changedFldID + '&fileUploadId=' + i_File_Upload_Id + '&machineNm=' + machineNm + '&isLineFld=' + isLineFld + '&folderNmPrefix=' + folderNmPrefix;
            
            nlExtOpenWindow(winURL, '', 450, 300, '', false, "Upload File");
            
        }//POP Open
        
    }//end if (isLineFld == true)
    else
    {
    	let b_uploafFileCheck = nlapiGetFieldValue(changedFldID);
        
        if (b_uploafFileCheck == 'T') {//POP Open
            //-------------------Open the popup for upload file-------------------------
            let i_File_Upload_Id = nlapiGetFieldValue(attchFldID);
            let winURL = nlapiResolveURL('SUITELET', 'customscript_hris_ess_uploadfile_sl', 'customdeploy_hris_ess_uploadfile_sl');
            
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
    	nlapiSetFieldValue(attchFldID, File_Id);            
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



});
