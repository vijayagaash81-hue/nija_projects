/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Description Client Script for file upload window integration on Employee Record support documents.
 */
define([
    'N/runtime',
    'N/url',
    'N/https',
    'N/ui/dialog',
    'N/currentRecord'
], (runtime, urlModule, httpsModule, dialog, currentRecordModule) => {

    let g_Type = "";

    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - Mode in which the record is loaded ('create', 'edit', etc.)
     */
    const pageInit = (scriptContext) => {
        try {
            g_Type = scriptContext.mode;
        } catch (e) {
            console.error('Error in pageInit:', e);
        }
    };

    /**
     * Validation function to be executed when a record line is deleted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if line delete is valid
     */
    const validateDelete = (scriptContext) => {
        try {
            const currentRec = scriptContext.currentRecord;
            const sublistId = scriptContext.sublistId;

            if (sublistId === 'recmachcustrecord_hris_emp_supp_doc_employee_li') {
                // Checking Role Restriction
                const currentUser = runtime.getCurrentUser();
                const i_Current_User = currentUser.id;
                const i_Current_Role = currentUser.role;
                const i_Requester = currentRec.getValue({ fieldId: 'entity' });

                if (i_Current_User == i_Requester || i_Current_Role == 3) {
                    const i_File_Upload_Id = currentRec.getCurrentSublistValue({
                        sublistId: 'recmachcustrecord_hris_emp_supp_doc_employee_li',
                        fieldId: 'custrecord_hris_emp_supp_doc_employee_li'
                    });

                    if (_logValidation(i_File_Upload_Id)) {
                        const urlStr = urlModule.resolveScript({
                            scriptId: 'customscript_hris_ess_deletefilecab_sl',
                            deploymentId: 'customdeploy_hris_ess_deletefilecab_sl',
                            params: { entity: i_File_Upload_Id }
                        });
                        httpsModule.get({ url: urlStr });
                    }
                    return true;
                } else {
                    alert("You dont have access to remove files");
                    return false;
                }
            }
            return true;
        } catch (e) {
            console.error('Error in validateDelete:', e);
            return true;
        }
    };

    /**
     * Function to be executed when a field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.line - Line number (1-indexed)
     * @param {number} scriptContext.column - Column number
     */
    const fieldChanged = (scriptContext) => {
        try {
            const currentRec = scriptContext.currentRecord;
            const sublistId = scriptContext.sublistId;
            const fieldId = scriptContext.fieldId;
            const s_record_type = currentRec.type;

            if (sublistId === 'recmachcustrecord_hris_emp_supp_doc_employee_li' && fieldId === 'custrecord_hris_emp_supp_doc_click_here') {
                const s_folder_name = 'Employee Support Document';
                const s_fld_attach_file = 'custrecord_hris_emp_supp_doc_supporting';
                const s_sublist_id = 'recmachcustrecord_hris_emp_supp_doc_employee_li';

                const b_attachFile = currentRec.getCurrentSublistValue({
                    sublistId: s_sublist_id,
                    fieldId: fieldId
                });

                if (b_attachFile === true || b_attachFile === 'T') {
                    // POPUP window Open
                    fileUploadOptimized(s_record_type, fieldId, s_fld_attach_file, true, s_sublist_id, s_folder_name, currentRec);
                } else {
                    const i_File_Upload_Id = currentRec.getCurrentSublistValue({
                        sublistId: s_sublist_id,
                        fieldId: s_fld_attach_file
                    });

                    if (_logValidation(i_File_Upload_Id)) {
                        const urlStr = urlModule.resolveScript({
                            scriptId: 'customscript_hris_ess_deletefilecab_sl',
                            deploymentId: 'customdeploy_hris_ess_deletefilecab_sl',
                            params: { entity: i_File_Upload_Id }
                        });
                        httpsModule.get({ url: urlStr });
                        currentRec.setCurrentSublistValue({
                            sublistId: s_sublist_id,
                            fieldId: s_fld_attach_file,
                            value: '',
                            ignoreFieldChange: true
                        });
                    }
                }
            }
        } catch (e) {
            console.error('Error in fieldChanged:', e);
        }
    };

    /**
     * Opens optimized file upload popup window.
     */
    function fileUploadOptimized(recType, changedFldID, attchFldID, isLineFld, machineNm, folderNmPrefix, curRec) {
        try {
            const currentRec = curRec || currentRecordModule.get();

            if (isLineFld === true || isLineFld === 'true') {
                const b_uploafFileCheck = currentRec.getCurrentSublistValue({
                    sublistId: machineNm,
                    fieldId: changedFldID
                });

                if (b_uploafFileCheck === true || b_uploafFileCheck === 'T') {
                    const i_File_Upload_Id = currentRec.getCurrentSublistValue({
                        sublistId: machineNm,
                        fieldId: attchFldID
                    });

                    let winURL = urlModule.resolveScript({
                        scriptId: 'customscript_hris_ess_uploadfile_sl',
                        deploymentId: 'customdeploy_hris_ess_uploadfile_sl'
                    });

                    winURL += '&recType=' + recType +
                             '&attachFldNm=' + attchFldID +
                             '&changedFldNm=' + changedFldID +
                             '&fileUploadId=' + i_File_Upload_Id +
                             '&machineNm=' + machineNm +
                             '&isLineFld=' + isLineFld +
                             '&folderNmPrefix=' + folderNmPrefix;

                    if (typeof window.nlExtOpenWindow === 'function') {
                        window.nlExtOpenWindow(winURL, '', 450, 300, '', false, "Upload File");
                    } else {
                        window.open(winURL, "Upload File", "width=450,height=300,resizable=yes,scrollbars=yes");
                    }
                }
            } else {
                const b_uploafFileCheck = currentRec.getValue({ fieldId: changedFldID });

                if (b_uploafFileCheck === true || b_uploafFileCheck === 'T') {
                    const i_File_Upload_Id = currentRec.getValue({ fieldId: attchFldID });

                    let winURL = urlModule.resolveScript({
                        scriptId: 'customscript_hris_ess_uploadfile_sl',
                        deploymentId: 'customdeploy_hris_ess_uploadfile_sl'
                    });

                    winURL += '&recType=' + recType +
                             '&attachFldNm=' + attchFldID +
                             '&changedFldNm=' + changedFldID +
                             '&fileUploadId=' + i_File_Upload_Id +
                             '&machineNm=' + machineNm +
                             '&isLineFld=' + isLineFld +
                             '&folderNmPrefix=' + folderNmPrefix;

                    if (typeof window.nlExtOpenWindow === 'function') {
                        window.nlExtOpenWindow(winURL, '', 450, 300, '', false, "Upload File");
                    } else {
                        window.open(winURL, "Upload File", "width=450,height=300,resizable=yes,scrollbars=yes");
                    }
                }
            }
        } catch (e) {
            console.error('Error in fileUploadOptimized:', e);
        }
    }

    /**
     * Triggered from suitelet form (upload file suitelet) to set file ID.
     */
    function setFileOptimized(File_Id, type, attchFldID, fileExist, foldername, fileSize, fileType, changedFldID, machineNm, isLineFld) {
        try {
            const currentRec = currentRecordModule.get();
            if (isLineFld === 'true' || isLineFld === true) {
                currentRec.setCurrentSublistValue({
                    sublistId: machineNm,
                    fieldId: attchFldID,
                    value: File_Id
                });
                closePopup();
            } else {
                currentRec.setValue({
                    fieldId: attchFldID,
                    value: File_Id
                });
                closePopup();
            }
        } catch (e) {
            console.error('Error in setFileOptimized:', e);
        }
    }

    /**
     * Triggered from suitelet form when folder does not exist.
     */
    function folderDoesNotExist() {
        alert('Please Create Folder');
        closePopup();
    }

    /**
     * Closes the Ext or browser popup window.
     */
    function closePopup() {
        try {
            if (typeof window.close === 'function') {
                window.close();
            }
        } catch (e) {
            console.error('Error closing popup:', e);
        }
    }

    /**
     * Helper validation function.
     * Returns true if value is non-empty / valid, else false.
     */
    function _logValidation(value) {
        if (value !== null && value !== undefined && value !== '' && value.toString() !== 'null' && value.toString() !== 'undefined' && value.toString() !== 'NaN') {
            return true;
        }
        return false;
    }

    // Expose global helper functions on window scope for Suitelet window popups & callbacks
    if (typeof window !== 'undefined') {
        window.setFileOptimized = setFileOptimized;
        window.folderDoesNotExist = folderDoesNotExist;
        window.fileUploadOptimized = fileUploadOptimized;
        window._logValidation = _logValidation;
    }

    return {
        pageInit,
        fieldChanged,
        validateDelete
    };
});

