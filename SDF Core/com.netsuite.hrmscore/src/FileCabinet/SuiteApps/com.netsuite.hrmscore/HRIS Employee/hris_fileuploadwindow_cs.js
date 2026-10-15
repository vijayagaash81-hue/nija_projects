var g_Type = "";

function pageInit_getType(type)
{
    g_Type = type;
}

function validateDelete_fileUpload(type)
{
    if (type == 'recmachcustrecord_hris_emp_supp_doc_employee_li') 
    {
        //Checking Role Restriction
        i_Current_User = nlapiGetUser();
        i_Current_Role = nlapiGetRole();
        i_Requester = nlapiGetFieldValue('entity');
        if(i_Current_User == i_Requester || i_Current_Role == 3)
        {
            var i_File_Upload_Id = nlapiGetCurrentLineItemValue('recmachcustrecord_hris_emp_supp_doc_employee_li', 'custrecord_hris_emp_supp_doc_employee_li');
            if (_logValidation(i_File_Upload_Id)) 
            {
                var url = nlapiResolveURL('SUITELET', 'customscript_hris_ess_deletefilecab_sl', 'customdeploy_hris_ess_deletefilecab_sl') + '&entity=' + i_File_Upload_Id;
                nlapiRequestURL(url);
            } 
            return true;
        }
        else
        {
            alert("You dont have access to remove files");
            return false;
        }
    }
  return true;
}



function fieldChange_callPOPWindows(type, name, linenum){
    
    var i_Current_User = nlapiGetUser();
    var s_record_type = nlapiGetRecordType();
    
    
    if(type == 'recmachcustrecord_hris_emp_supp_doc_employee_li' && name == 'custrecord_hris_emp_supp_doc_click_here')
    {
        //alert("In Field Change Record Type : " +s_record_type);
        var s_folder_name = 'Employee Support Document';
        var s_fld_attach_file = 'custrecord_hris_emp_supp_doc_supporting';
        var s_sublist_id = 'recmachcustrecord_hris_emp_supp_doc_employee_li';
        
        var b_attachFile = nlapiGetCurrentLineItemValue(s_sublist_id,name);
        //alert("b_attachFile: " +b_attachFile);
        if (b_attachFile == 'T') 
        {
            //POPUP window Open
            fileUploadOptimized(s_record_type, name, s_fld_attach_file, true, s_sublist_id, s_folder_name);
        }
        else 
        {
            var i_File_Upload_Id = nlapiGetCurrentLineItemValue(s_sublist_id,s_fld_attach_file);
            if (_logValidation(i_File_Upload_Id)) {
                var url = nlapiResolveURL('SUITELET', 'customscript_hris_ess_deletefilecab_sl', 'customdeploy_hris_ess_deletefilecab_sl') + '&entity=' + i_File_Upload_Id;
                nlapiRequestURL(url);
                // alert('success');
                nlapiSetCurrentLineItemValue(s_sublist_id,s_fld_attach_file,'');
            }
        }
    }
}

function fileUploadOptimized(recType, changedFldID, attchFldID, isLineFld, machineNm, folderNmPrefix){
    //alert("In fileUploadOptimized");
    if (isLineFld == true) {
    
        var b_uploafFileCheck = nlapiGetCurrentLineItemValue(machineNm, changedFldID);
        
        if (b_uploafFileCheck == 'T') {//POP Open
            //-------------------Open the popup for upload file-------------------------
            var i_File_Upload_Id = nlapiGetCurrentLineItemValue(machineNm, attchFldID);
            
            var i_recLineId = nlapiGetCurrentLineItemIndex(machineNm);
            
            var winURL = nlapiResolveURL('SUITELET', 'customscript_hris_ess_uploadfile_sl', 'customdeploy_hris_ess_uploadfile_sl');
            
            winURL += '&recType=' + recType + '&attachFldNm=' + attchFldID + '&changedFldNm=' + changedFldID + '&fileUploadId=' + i_File_Upload_Id + '&machineNm=' + machineNm + '&isLineFld=' + isLineFld + '&folderNmPrefix=' + folderNmPrefix;
            
            nlExtOpenWindow(winURL, '', 450, 300, '', false, "Upload File");
            
        }//POP Open  
    }//end if (isLineFld == true)
    else
    {
        var b_uploafFileCheck = nlapiGetFieldValue(changedFldID);
        
        if (b_uploafFileCheck == 'T') {//POP Open
            //-------------------Open the popup for upload file-------------------------
            var i_File_Upload_Id = nlapiGetFieldValue(attchFldID);
            var winURL = nlapiResolveURL('SUITELET', 'customscript_hris_ess_uploadfile_sl', 'customdeploy_hris_ess_uploadfile_sl');
            
            winURL += '&recType=' + recType + '&attachFldNm=' + attchFldID + '&changedFldNm=' + changedFldID + '&fileUploadId=' + i_File_Upload_Id + '&machineNm=' + machineNm + '&isLineFld=' + isLineFld + '&folderNmPrefix=' + folderNmPrefix;
            
            nlExtOpenWindow(winURL, '', 450, 300, '', false, "Upload File");
        }
    }//else of if (isLineFld == true)
   
    
}

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

