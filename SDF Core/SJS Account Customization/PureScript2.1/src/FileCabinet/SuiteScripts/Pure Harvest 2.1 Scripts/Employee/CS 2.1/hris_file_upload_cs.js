/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 * Description: Client Script for file upload and deletion integration on Employee record attachments
 * Sublist: recmachcustrecord_hris_emp_link
 * Attached File Field: custrecord_hris_attachment
 * Checkbox Field: custrecord_hris_attach_doc
 * Converted from SuiteScript 1.0 to SuiteScript 2.1.
 */
define([
    'N/runtime',
    'N/url',
    'N/https',
    'N/log',
    'N/currentRecord'
], (runtime, url, https, log, currentRecordModule) => {

    let g_Type = '';

    /**
     * Executes when the page completes loading or when the form is reset.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - Trigger mode ('create', 'copy', 'edit')
     */
    const pageInit = (scriptContext) => {
        try {
            g_Type = scriptContext.mode;
            log.debug('pageInit', `Mode: ${g_Type}`);
        } catch (e) {
            log.error('Error in pageInit', e);
        }
    };

    /**
     * Validation function to be executed when a record line is deleted.
     * Enforces role-based restriction (Administrator Role 3 or Role 1294, or Requester).
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @returns {boolean} Return true if line delete is valid, false to prevent deletion
     */
    const validateDelete = (scriptContext) => {
        try {
            const { currentRecord, sublistId } = scriptContext;

            if (sublistId === 'recmachcustrecord_hris_emp_link') {
                const currentUser = runtime.getCurrentUser();
                const currentUserId = currentUser.id;
                const currentUserRole = currentUser.role;
                const requesterId = currentRecord.getValue({ fieldId: 'entity' });

                // Allow delete if current user is the employee, Administrator (3), or Authorized Role (1294)
                if (String(currentUserId) === String(requesterId) || String(currentUserRole) === '3' || String(currentUserRole) === '1294') {
                    const fileUploadId = currentRecord.getCurrentSublistValue({
                        sublistId: 'recmachcustrecord_hris_emp_link',
                        fieldId: 'custrecord_hris_attachment'
                    });
                    const attachCheck = currentRecord.getCurrentSublistValue({
                        sublistId: 'recmachcustrecord_hris_emp_link',
                        fieldId: 'custrecord_hris_attach_doc'
                    });

                    if (_logValidation(fileUploadId) && (attachCheck === false || String(attachCheck) === 'F')) {
                        const suiteletUrl = url.resolveScript({
                            scriptId: 'customscript_hris_ess_deletefilecab_sl',
                            deploymentId: 'customdeploy_hris_ess_deletefilecab_sl',
                            params: { entity: fileUploadId }
                        });
                        https.get({ url: suiteletUrl });
                    }
                    return true;
                } else {
                    alert('You dont have access to remove files');
                    return false;
                }
            }
            return true;
        } catch (e) {
            log.error('Error in validateDelete', e);
            return true;
        }
    };

    /**
     * Executes when a field is changed by a user or script.
     * Launches upload file popup or deletes file if unchecked.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     */
    const fieldChanged = (scriptContext) => {
        try {
            const { currentRecord, sublistId, fieldId } = scriptContext;

            if (sublistId === 'recmachcustrecord_hris_emp_link' && fieldId === 'custrecord_hris_attach_doc') {
                const folderName = 'Employee Support Document';
                const attachFileField = 'custrecord_hris_attachment';
                const targetSublist = 'recmachcustrecord_hris_emp_link';

                const isAttachChecked = currentRecord.getCurrentSublistValue({
                    sublistId: targetSublist,
                    fieldId: fieldId
                });

                if (isAttachChecked === true || String(isAttachChecked) === 'T') {
                    // Open popup window to upload file
                    fileUploadOptimized(currentRecord.type, fieldId, attachFileField, true, targetSublist, folderName, currentRecord);
                } else {
                    // Check sublist first, then fallback to body field
                    let fileUploadId = currentRecord.getCurrentSublistValue({
                        sublistId: targetSublist,
                        fieldId: attachFileField
                    });

                    if (!_logValidation(fileUploadId)) {
                        fileUploadId = currentRecord.getValue({ fieldId: attachFileField });
                    }

                    if (_logValidation(fileUploadId)) {
                        const deleteUrl = url.resolveScript({
                            scriptId: 'customscript_hris_ess_deletefilecab_sl',
                            deploymentId: 'customdeploy_hris_ess_deletefilecab_sl',
                            params: { entity: fileUploadId }
                        });
                        https.get({ url: deleteUrl });

                        currentRecord.setCurrentSublistValue({
                            sublistId: targetSublist,
                            fieldId: attachFileField,
                            value: '',
                            ignoreFieldChange: true
                        });
                    }
                }
            }
        } catch (e) {
            log.error('Error in fieldChanged', e);
        }
    };

    /**
     * Opens optimized file upload popup window.
     */
    const fileUploadOptimized = (recType, changedFldID, attchFldID, isLineFld, machineNm, folderNmPrefix, curRec) => {
        try {
            const currentRec = curRec || currentRecordModule.get();

            if (isLineFld === true || isLineFld === 'true') {
                const isUploadChecked = currentRec.getCurrentSublistValue({
                    sublistId: machineNm,
                    fieldId: changedFldID
                });

                if (isUploadChecked === true || String(isUploadChecked) === 'T') {
                    const fileUploadId = currentRec.getCurrentSublistValue({
                        sublistId: machineNm,
                        fieldId: attchFldID
                    });

                    let winURL = url.resolveScript({
                        scriptId: 'customscript_hris_ess_uploadfile_sl',
                        deploymentId: 'customdeploy_hris_ess_uploadfile_sl'
                    });

                    winURL += `&recType=${encodeURIComponent(recType)}` +
                              `&attachFldNm=${encodeURIComponent(attchFldID)}` +
                              `&changedFldNm=${encodeURIComponent(changedFldID)}` +
                              `&fileUploadId=${encodeURIComponent(fileUploadId || '')}` +
                              `&machineNm=${encodeURIComponent(machineNm)}` +
                              `&isLineFld=${encodeURIComponent(isLineFld)}` +
                              `&folderNmPrefix=${encodeURIComponent(folderNmPrefix)}`;

                    if (typeof window !== 'undefined' && typeof window.nlExtOpenWindow === 'function') {
                        window.nlExtOpenWindow(winURL, '', 450, 300, '', false, 'Upload File');
                    } else if (typeof window !== 'undefined') {
                        window.open(winURL, 'Upload File', 'width=450,height=300,resizable=yes,scrollbars=yes');
                    }
                }
            } else {
                const isUploadChecked = currentRec.getValue({ fieldId: changedFldID });

                if (isUploadChecked === true || String(isUploadChecked) === 'T') {
                    const fileUploadId = currentRec.getValue({ fieldId: attchFldID });

                    let winURL = url.resolveScript({
                        scriptId: 'customscript_hris_ess_uploadfile_sl',
                        deploymentId: 'customdeploy_hris_ess_uploadfile_sl'
                    });

                    winURL += `&recType=${encodeURIComponent(recType)}` +
                              `&attachFldNm=${encodeURIComponent(attchFldID)}` +
                              `&changedFldNm=${encodeURIComponent(changedFldID)}` +
                              `&fileUploadId=${encodeURIComponent(fileUploadId || '')}` +
                              `&machineNm=${encodeURIComponent(machineNm)}` +
                              `&isLineFld=${encodeURIComponent(isLineFld)}` +
                              `&folderNmPrefix=${encodeURIComponent(folderNmPrefix)}`;

                    if (typeof window !== 'undefined' && typeof window.nlExtOpenWindow === 'function') {
                        window.nlExtOpenWindow(winURL, '', 450, 300, '', false, 'Upload File');
                    } else if (typeof window !== 'undefined') {
                        window.open(winURL, 'Upload File', 'width=450,height=300,resizable=yes,scrollbars=yes');
                    }
                }
            }
        } catch (e) {
            log.error('Error in fileUploadOptimized', e);
        }
    };

    /**
     * Triggered from suitelet form (upload file suitelet) to set file ID.
     */
    const setFileOptimized = (fileId, type, attchFldID, fileExist, foldername, fileSize, fileType, changedFldID, machineNm, isLineFld) => {
        try {
            const currentRec = currentRecordModule.get();
            if (isLineFld === 'true' || isLineFld === true) {
                currentRec.setCurrentSublistValue({
                    sublistId: machineNm,
                    fieldId: attchFldID,
                    value: fileId
                });
                closePopup();
            } else {
                currentRec.setValue({
                    fieldId: attchFldID,
                    value: fileId
                });
                closePopup();
            }
        } catch (e) {
            log.error('Error in setFileOptimized', e);
        }
    };

    /**
     * Triggered from suitelet form when folder does not exist.
     */
    const folderDoesNotExist = () => {
        alert('Please Create Folder');
        closePopup();
    };

    /**
     * Closes the popup window.
     */
    const closePopup = () => {
        try {
            if (typeof window !== 'undefined' && typeof window.close === 'function') {
                window.close();
            }
        } catch (e) {
            log.error('Error in closePopup', e);
        }
    };

    /**
     * Validation helper function.
     * Returns true if value is non-empty / valid, else false.
     */
    const _logValidation = (value) => {
        if (value !== null && value !== undefined && value !== '' && String(value) !== 'null' && String(value) !== 'undefined' && String(value) !== 'NaN') {
            return true;
        }
        return false;
    };

    // Expose global callback functions on window scope for Suitelet window popups
    if (typeof window !== 'undefined') {
        window.setFileOptimized = setFileOptimized;
        window.folderDoesNotExist = folderDoesNotExist;
        window.fileUploadOptimized = fileUploadOptimized;
        window._logValidation = _logValidation;
    }

    return {
        pageInit,
        validateDelete,
        fieldChanged
    };
});
