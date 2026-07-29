/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @Description User Event script for highlighting status and auto numbering on Loan Allocation.
 */
define(['N/record', 'N/search', 'N/log', 'N/runtime', 'N/config', 'N/ui/serverWidget'], (record, search, log, runtime, config, serverWidget) => {

    const PREFIX = '';

    /**
     * Helper to validate null/undefined/empty values
     */
    const isNullOrEmpty = (val) => {
        return val === null || val === undefined || val === '' || val === 'undefined';
    };

    /**
     * Helper to get company's current date and time
     */
    const getCompanyCurrentDateTime = () => {
        const companyInfo = config.load({
            type: config.Type.COMPANY_INFORMATION
        });
        const companyTimeZone = companyInfo.getText({ fieldId: 'timezone' }) || '';
        let timeZoneOffSet = 0;
        if (companyTimeZone.indexOf('(GMT)') !== 0) {
            const offsetString = companyTimeZone.substr(4, 6)
                .replace(/\+|:00/gi, '')
                .replace(/:30/gi, '.5');
            timeZoneOffSet = parseFloat(offsetString) || 0;
        }
        const currentDateTime = new Date();
        const UTC = currentDateTime.getTime() + (currentDateTime.getTimezoneOffset() * 60000);
        const companyDateTime = UTC + (timeZoneOffSet * 60 * 60 * 1000);
        return new Date(companyDateTime);
    };

    /**
     * Function executed before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     */
    const beforeLoad = (scriptContext) => {
        try {
            const newRecord = scriptContext.newRecord;
            const form = scriptContext.form;
            const triggerType = scriptContext.type;
            const currentUser = runtime.getCurrentUser();
            const userRoleId = (currentUser.roleId || '').toLowerCase();
            const userRole = currentUser.role;

            const recordType = (newRecord.type || '').toString().toLowerCase();

            const nameField = form.getField({ id: 'name' });
            if (nameField) {
                nameField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });
            }

            if (triggerType === scriptContext.UserEventType.CREATE) {
                const workflowStatusField = form.getField({ id: `custrecord_${PREFIX}_workflowstatus` });
                if (workflowStatusField) {
                    workflowStatusField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                }
            }

            if (triggerType === scriptContext.UserEventType.VIEW && recordType === 'customrecord_hris_lve_letter_req') {
                const currentWFLevel = newRecord.getValue({ fieldId: 'custrecord_hris_letreq_current_approval' });
                const certificate = newRecord.getValue({ fieldId: 'custrecord_hris_letreq_certificateletter' });
                const signature = form.getField({ id: 'custrecord_hris_letreq_signature' }) ? newRecord.getText({ fieldId: 'custrecord_hris_letreq_signature' }) : '';
                const workflowStatus = newRecord.getValue({ fieldId: 'custrecord_hris_letreq_workflow_statuslr' });
                const requester = newRecord.getValue({ fieldId: 'custrecord_hris_letreq_requester' });

                form.clientScriptFileId = 'customscript_cli_ihr_ess_ssr_btnclick';

                if ((userRole === 1001 || userRole === 1003) && String(currentWFLevel) === '2') {
                    if (String(workflowStatus) !== '5') {
                        if (isNullOrEmpty(certificate)) {
                            form.addButton({
                                id: 'custpage_preview_document',
                                label: 'Preview Document',
                                functionName: `onClickPreviewDocBtn('${signature}');`
                            });
                        } else {
                            form.addButton({
                                id: 'custpage_preview_document',
                                label: 'Issue Letter',
                                functionName: `onClickIssueLatterBtn('${requester}');`
                            });
                        }
                    }
                }
            }

            const statusVal = newRecord.getValue({ fieldId: `custrecord_${PREFIX}_status` });
            let statusInColor = '';
            if (!isNullOrEmpty(statusVal)) {
                statusInColor = `<BR><font size=2>STATUS</font><BR><font color="red" size=2>${statusVal}</font>`;
            } else {
                if (triggerType !== scriptContext.UserEventType.CREATE) {
                    statusInColor = '<BR><font size=2>STATUS</font><BR><font color="red" size=2>Draft</font>';
                }
            }

            if (statusInColor) {
                newRecord.setValue({
                    fieldId: `custrecord_${PREFIX}_status_in_color`,
                    value: statusInColor,
                    ignoreFieldChange: true
                });
            }

            const nameFieldStatus = form.getField({ id: `custrecord_${PREFIX}_status` });
            if (nameFieldStatus) {
                nameFieldStatus.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            }

            const curWFLval = newRecord.getValue({ fieldId: `custrecord_${PREFIX}_current_wflevelno` });
            newRecord.setValue({
                fieldId: `custrecord_${PREFIX}_crntwflvlnohighli`,
                value: curWFLval,
                ignoreFieldChange: true
            });

            if (userRoleId !== 'administrator' && userRoleId !== 'full_access') {
                const suffixes = [
                    '_wfhelp', '_app_no', '_wfs', '_currentapprover', '_special_comments',
                    '_workflowstatus', '_current_wflevelno', '_next_wflevel_no', '_nextapprover',
                    '_currenteditor', '_additionalmsg', '_comments', '_confirmflag',
                    '_actiontaken', '_html2', '_approval_dt', '_furthraprovalflag', '_tot_no'
                ];
                suffixes.forEach(suffix => {
                    const fld = form.getField({ id: `custrecord_${PREFIX}${suffix}` });
                    if (fld) {
                        fld.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
                    }
                });
            }

            // Omit the loop that never executed due to undefined 'i_total_no_appr' in the original script
            // to avoid ReferenceError, but preserve the parsing to match original logic signature
            const appNoVal = newRecord.getValue({ fieldId: `custrecord_${PREFIX}_app_no` });
            const nonEditableTillLevel = parseInt(appNoVal, 10);
            log.debug({ title: 'nonEditableTillLevel', details: nonEditableTillLevel });

        } catch (e) {
            log.error({ title: 'Error in beforeLoad', details: e.message || e });
        }
    };

    /**
     * Function executed before record is submitted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     */
    const beforeSubmit = (scriptContext) => {
        const triggerType = scriptContext.type;
        if (triggerType !== scriptContext.UserEventType.CREATE) {
            return;
        }

        try {
            const newRecord = scriptContext.newRecord;
            const recordType = (newRecord.type || '').toString().toLowerCase();
            log.debug({ title: 'beforeSubmit type', details: triggerType });
            log.debug({ title: 'recordType', details: recordType });

            const sAutoPrfix = 'LON';
            const iRecTypeId = newRecord.getValue({ fieldId: 'rectype' });
            log.debug({ title: 'iRecTypeId', details: iRecTypeId });

            const uniqueRefSearch = search.create({
                type: 'customrecord_hris_unique_reference_numbe',
                filters: [
                    ['custrecord_hris_record_type', 'anyof', iRecTypeId],
                    'AND',
                    ['isinactive', 'is', 'F']
                ],
                columns: [
                    'custrecord_hris_record_type',
                    'custrecord_hris_unique_number'
                ]
            }).run().getRange({ start: 0, end: 1 });

            if (uniqueRefSearch && uniqueRefSearch.length > 0) {
                log.debug({ title: 'Unique Reference Match Found' });
                const refRecord = uniqueRefSearch[0];
                const iIdUniqueRef = refRecord.id;
                let iUniqueNum = parseInt(refRecord.getValue({ name: 'custrecord_hris_unique_number' }), 10) || 0;
                iUniqueNum = iUniqueNum + 1;

                const dCurrentDate = getCompanyCurrentDateTime();
                const iFullYear = dCurrentDate.getFullYear();

                const iEmployee = newRecord.getValue({ fieldId: 'custrecord_hris_loan_emp_name' });
                let sName = '';
                if (iEmployee) {
                    const empFields = search.lookupFields({
                        type: 'employee',
                        id: iEmployee,
                        columns: ['firstname']
                    });
                    if (empFields && empFields.firstname) {
                        sName = empFields.firstname;
                    }
                }

                log.debug({ title: 'Employee First Name', details: sName });

                let sEmpChar = '';
                let lastFour = '';
                if (!isNullOrEmpty(sName)) {
                    sName = sName.toUpperCase();
                    sEmpChar = sName.substring(0, 1);
                    lastFour = sName.substr(sName.length - 3);
                }

                const sAutoNumber = `${sAutoPrfix}-${sEmpChar}${lastFour}-${iUniqueNum}-${iFullYear}`;
                log.debug({ title: 'Generated Autonumber', details: sAutoNumber });

                newRecord.setValue({ fieldId: 'name', value: sAutoNumber });

                record.submitFields({
                    type: 'customrecord_hris_unique_reference_numbe',
                    id: iIdUniqueRef,
                    values: {
                        custrecord_hris_unique_number: iUniqueNum
                    }
                });
            }
        } catch (e) {
            log.error({ title: 'Error in beforeSubmit', details: e.message || e });
        }
    };

    return {
        beforeLoad,
        beforeSubmit
    };
});
