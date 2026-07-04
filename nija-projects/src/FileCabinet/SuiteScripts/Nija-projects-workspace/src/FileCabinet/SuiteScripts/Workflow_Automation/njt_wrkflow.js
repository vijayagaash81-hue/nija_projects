/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', 'N/record', 'N/log', 'N/runtime', 'N/email'], (search, record, log, runtime, email) => {

    const FIELD_MAPPINGS = {
        status: 'custbody_approval_status',
        approval_setup: 'custbody_approval_setup',
        current_level: 'custbody_current_level',
        next_approver: 'custbody_next_approver',
        next_approver_role: 'custbody_next_approver_role',
        rejection_reason: 'custbody_rejection_reason',
        approval_requestor: 'custbody_approval_requestor',
        department: 'department'
    };

    const beforeLoad = (context) => {

        try {

            if (context.type !== context.UserEventType.VIEW) {
                return;
            }

            var rec = context.newRecord;
            var form = context.form;

            // Inject field mappings for the client script to read
            var mappingField = form.addField({
                id: 'custpage_approval_mappings',
                type: 'inlinehtml',
                label: ' '
            });
            mappingField.defaultValue =
                '<script>' +
                '  window.approvalFieldMappings = ' + JSON.stringify(FIELD_MAPPINGS) + ';' +
                '</script>';

            var currentUser = runtime.getCurrentUser().id;
            var currentRole = runtime.getCurrentUser().role;
            var requestor = rec.getValue({
                fieldId: FIELD_MAPPINGS.approval_requestor
            });

            var nextApprover = rec.getValue({
                fieldId: FIELD_MAPPINGS.next_approver
            });
            var nextApproverRole = rec.getValue({
                fieldId: FIELD_MAPPINGS.next_approver_role
            });

            var approvalStatus = rec.getText({
                fieldId: FIELD_MAPPINGS.status
            });
            var approvalSetup = rec.getValue({
                fieldId: FIELD_MAPPINGS.approval_setup
            });
            var isCustomRecord = rec.type.indexOf('customrecord_') === 0;
            if ((approvalStatus === 'Pending Approval' || approvalStatus === 'Rejected') && !isCustomRecord) {

                ['receive', 'enterprepayment', 'closeremaining']
                    .forEach(function (btn) {

                        try {

                            form.removeButton({
                                id: btn
                            });

                        } catch (e) {

                            log.debug(
                                'Button Not Found',
                                btn
                            );
                        }

                    });

            }
            //       if (approvalStatus === 'Pending Approval' || approvalStatus=== 'Rejected') {

            //      var hideStatusField = form.addField({
            //         id: 'custpage_hide_status',
            //         type: 'inlinehtml',
            //         label: ' '
            //     });

            //     hideStatusField.defaultValue =
            //         '<script>' +
            //         'jQuery(function(){' +
            //         '   jQuery(".uir-record-status").hide();' +
            //         '});' +
            //         '</script>';
            // }

            log.debug('Current User', currentUser);
            log.debug('Next Approver', nextApprover);
            log.debug('Status', approvalStatus);
            // Dynamic Approval Banner

            var bannerHtml = '';

            if (approvalStatus === 'Pending Approval') {

                bannerHtml =
                    '<div style="background:#f8d775;' +
                    'padding:10px;' +
                    'font-size:16px;' +
                    'font-weight:bold;' +
                    'text-align:center;' +
                    'border-radius:4px;">' +
                    'PENDING APPROVAL' +
                    '</div>';

            } else if (approvalStatus === 'Approved') {

                bannerHtml =
                    '<div style="background:#28a745;' +
                    'color:white;' +
                    'padding:10px;' +
                    'font-size:16px;' +
                    'font-weight:bold;' +
                    'text-align:center;' +
                    'border-radius:4px;">' +
                    'APPROVED' +
                    '</div>';

            } else if (approvalStatus === 'Rejected') {

                bannerHtml =
                    '<div style="background:#dc3545;' +
                    'color:white;' +
                    'padding:10px;' +
                    'font-size:16px;' +
                    'font-weight:bold;' +
                    'text-align:center;' +
                    'border-radius:4px;">' +
                    'REJECTED' +
                    '</div>';
            }

            var bannerColor = '';
            var bannerText = '';

            if (approvalStatus === 'Pending Approval') {

                bannerColor = '#dce6f2';
                bannerText = 'PENDING APPROVAL';

            } else if (approvalStatus === 'Approved') {

                bannerColor = '#dce6f2';
                bannerText = 'APPROVED';

            } else if (approvalStatus === 'Rejected') {

                bannerColor = '#dce6f2';
                bannerText = 'REJECTED';
            }

            if (bannerText) {
                var bannerField = form.addField({
                    id: 'custpage_approval_banner',
                    type: 'inlinehtml',
                    label: ' '
                });

                bannerField.defaultValue =
                    "<script>" +
                    "jQuery(function(){" +
                    "var banner = '<span style=\"" +
                    "background:" + bannerColor + ";" +
                    "color:#000;" +
                    "padding:4px 10px;" +
                    "font-size:14px;" +
                    "font-weight:700;" +
                    "display:inline-block;" +
                    "margin-left:15px;" +
                    "text-transform:uppercase;" +
                    "\">' +" +
                    "'" + bannerText + "'" +
                    "+ '</span>';" +
                    "jQuery('.uir-page-title-secondline').append(banner);" +
                    "});" +
                    "</script>";
            };
            var canApprove = false;

            if (
                nextApprover &&
                Number(currentUser) === Number(nextApprover)
            ) {
                canApprove = true;
            }

            if (
                nextApproverRole &&
                Number(currentRole) === Number(nextApproverRole)
            ) {
                canApprove = true;
            }
            if (
                approvalSetup &&
                Number(currentUser) === Number(requestor)
                &&
                !nextApprover
                &&
                !nextApproverRole
                &&
                approvalStatus !== 'Approved'
                &&
                approvalStatus !== 'Rejected'
            ) {

                form.addButton({
                    id: 'custpage_submitapproval',
                    label: 'Submit For Approval',
                    functionName: 'submitForApproval'
                });

                form.clientScriptModulePath =
                    'SuiteScripts/approval_cs.js';
            }
            if (
                approvalSetup &&
                Number(currentUser) === Number(requestor)
                &&
                approvalStatus === 'Rejected'
            ) {
                var allowResubmission = false;
                try {
                    var lookupSetup = search.lookupFields({
                        type: 'customrecord_approval_setup',
                        id: approvalSetup,
                        columns: ['custrecord_as_allow_resubmit']
                    });
                    allowResubmission = lookupSetup.custrecord_as_allow_resubmit === true || 
                                        lookupSetup.custrecord_as_allow_resubmit === 'T';
                } catch (lookupErr) {
                    log.error('Error looking up approval setup resubmit field', lookupErr);
                }

                if (allowResubmission) {
                    form.addButton({
                        id: 'custpage_resubmitapproval',
                        label: 'Resubmit for Approval',
                        functionName: 'resubmitForApproval'
                    });

                    form.clientScriptModulePath =
                        'SuiteScripts/approval_cs.js';
                }
            }
            if (
                approvalSetup &&
                canApprove &&
                approvalStatus === 'Pending Approval'
            ) {

                form.addButton({
                    id: 'custpage_approve',
                    label: 'Approve',
                    functionName: 'approvePO'
                });

                form.addButton({
                    id: 'custpage_reject',
                    label: 'Reject',
                    functionName: 'rejectPO'
                });

                form.clientScriptModulePath =
                    'SuiteScripts/approval_cs.js';
            }

        } catch (e) {

            log.error({
                title: 'beforeLoad Error',
                details: e
            });

        }


    };
    const afterSubmit = (context) => {

        try {

            if (context.type !== context.UserEventType.CREATE) {
                return;
            }

            const poId = context.newRecord.id;

            const poRec = record.load({
                type: context.newRecord.type,
                id: poId,
                isDynamic: false
            });

            var department = poRec.getValue(FIELD_MAPPINGS.department);

            if (!department) {
                log.debug('Department Missing', 'Department is required');
                return;
            }

            var recordTypeSearchVal = context.newRecord.type;
            if (recordTypeSearchVal.indexOf('customrecord_') === 0) {
                var typeSearch = search.create({
                    type: 'customrecordtype',
                    filters: [['scriptid', 'is', recordTypeSearchVal]],
                    columns: ['internalid']
                });
                var typeResult = typeSearch.run().getRange({ start: 0, end: 1 });
                if (typeResult && typeResult.length > 0) {
                    recordTypeSearchVal = typeResult[0].getValue('internalid');
                } else {
                    // Try without prefix
                    var cleanScriptId = recordTypeSearchVal.replace('customrecord_', '');
                    var typeSearch2 = search.create({
                        type: 'customrecordtype',
                        filters: [['scriptid', 'is', cleanScriptId]],
                        columns: ['internalid']
                    });
                    var typeResult2 = typeSearch2.run().getRange({ start: 0, end: 1 });
                    if (typeResult2 && typeResult2.length > 0) {
                        recordTypeSearchVal = typeResult2[0].getValue('internalid');
                    }
                }
            }

            // Determine field type of custrecord_as_recordtype dynamically
            var recordTypeFieldType = 'text';
            try {
                var dummyRec = record.create({ type: 'customrecord_approval_setup' });
                var fieldObj = dummyRec.getField({ fieldId: 'custrecord_as_recordtype' });
                if (fieldObj && fieldObj.type) {
                    recordTypeFieldType = fieldObj.type;
                }
            } catch (err) {
                log.debug('Error getting field type, defaulting to text', err.message);
            }

            var recordTypeFilter = null;
            if (recordTypeFieldType === 'select') {
                recordTypeFilter = ['custrecord_as_recordtype', 'anyof', recordTypeSearchVal];
            } else {
                recordTypeFilter = ['custrecord_as_recordtype', 'is', context.newRecord.type];
            }

            var approvalSetupId = null;
            try {
                var approvalSetupSearch = search.create({
                    type: 'customrecord_approval_setup',
                    filters: [
                        recordTypeFilter,
                        'AND',
                        ['custrecord_as_department', 'anyof', department],
                        'AND',
                        ['custrecord_as_active', 'is', 'T']
                    ],
                    columns: ['internalid']
                });

                var approvalSetupResult = approvalSetupSearch.run().getRange({ start: 0, end: 1 });
                if (approvalSetupResult && approvalSetupResult.length > 0) {
                    approvalSetupId = approvalSetupResult[0].getValue('internalid');
                }
            } catch (searchError) {
                log.error('Error searching approval setup, trying fallback', searchError.message);
                try {
                    var fallbackSearch = search.create({
                        type: 'customrecord_approval_setup',
                        filters: [
                            ['custrecord_as_department', 'anyof', department],
                            'AND',
                            ['custrecord_as_active', 'is', 'T']
                        ],
                        columns: ['internalid', 'custrecord_as_recordtype']
                    });
                    var fallbackResults = fallbackSearch.run().getRange({ start: 0, end: 100 });
                    for (var r = 0; r < fallbackResults.length; r++) {
                        var recTypeVal = fallbackResults[r].getValue('custrecord_as_recordtype');
                        var recTypeText = fallbackResults[r].getText('custrecord_as_recordtype');
                        if (String(recTypeVal) === String(recordTypeSearchVal) || 
                            String(recTypeVal) === String(context.newRecord.type) ||
                            String(recTypeText) === String(context.newRecord.type)) {
                            approvalSetupId = fallbackResults[r].getValue('internalid');
                            break;
                        }
                    }
                } catch (fallbackError) {
                    log.error('Fallback search failed', fallbackError.message);
                }
            }
            if (!approvalSetupId) {
                log.debug(
                    'Approval Setup Not Found',
                    'No approval setup configured for department ' + department
                );
                return;
            }
            var approvalSetupRec = record.load({
                type: 'customrecord_approval_setup',
                id: approvalSetupId
            });

            var emailEnabled =
                approvalSetupRec.getValue(
                    'custrecord_as_email_enabled'
                );

            // Find Level 1 Approver
            var detailSearch = search.create({
                type: 'customrecord_approval_setup_detail',
                filters: [
                    ['custrecord_asd_parent', 'is', approvalSetupId],
                    'AND',
                    ['custrecord_asd_level', 'equalto', '1']
                ],
                columns: [
                    'custrecord_asd_type',
                    'custrecord_asd_employee',
                    'custrecord_asd_role'
                ]
            });

            var detailResult = detailSearch.run().getRange({
                start: 0,
                end: 1
            });

            if (!detailResult || detailResult.length === 0) {

                log.debug(
                    'Level 1 Not Found',
                    'No level 1 approver found'
                );

                return;
            }

            var approvalType =
                detailResult[0].getText(
                    'custrecord_asd_type'
                );

            var approverId =
                detailResult[0].getValue(
                    'custrecord_asd_employee'
                );

            var roleId =
                detailResult[0].getValue(
                    'custrecord_asd_role'
                );

            // Update record values dynamically
            var values = {};
            values[FIELD_MAPPINGS.approval_setup] = approvalSetupId;
            values[FIELD_MAPPINGS.status] = 1;
            values[FIELD_MAPPINGS.approval_requestor] = runtime.getCurrentUser().id;

            record.submitFields({
                type: context.newRecord.type,
                id: poId,
                values: values
            });
            var tranId = poRec.getValue('tranid') || poRec.getValue('name') || poId;

            // if (
            //     emailEnabled &&
            //     approvalType === 'Employee'
            // ) {

            //     sendApprovalEmail(
            //         approverId,
            //         tranId,
            //         context.newRecord.type
            //     );

            // }
            var historyRec = record.create({
                type: 'customrecord_approval_history'
            });

            historyRec.setValue({
                fieldId: 'custrecord_ah_recordid',
                value: poId
            });

            historyRec.setValue({
                fieldId: 'custrecord_ah_recordtype',
                value: context.newRecord.type
            });

            historyRec.setValue({
                fieldId: 'custrecord_ah_setup',
                value: approvalSetupId
            });

            historyRec.setValue({
                fieldId: 'custrecord_ah_level',
                value: 1
            });

            historyRec.setValue({
                fieldId: 'custrecord_ah_action',
                value: 3 // Submitted
            });

            historyRec.setValue({
                fieldId: 'custrecord_ah_employee',
                value: runtime.getCurrentUser().id
            });
            historyRec.setValue({
                fieldId: 'custrecord_ah_role',
                value: runtime.getCurrentUser().role
            });

            historyRec.setValue({
                fieldId: 'custrecord_ah_actiondate',
                value: new Date()
            });

            historyRec.save();

            log.debug('Approval Initialized', {
                approvalSetupId: approvalSetupId,
                approverId: approverId
            });

        } catch (e) {

            log.error({
                title: 'Approval Initialization Error',
                details: e
            });

        }

    };
    function sendApprovalEmail(
        recipient,
        tranId,
        recordType
    ) {

        try {

            email.send({

                author: runtime.getCurrentUser().id,

                recipients: recipient,

                subject:
                    'Approval Required - ' +
                    tranId,

                body:
                    'A ' + recordType +
                    ' requires your approval.\n\n' +

                    'Document Number: ' +
                    tranId +

                    '\n\nPlease login to NetSuite and review.'

            });

        } catch (e) {

            log.error({
                title: 'Email Error',
                details: e
            });

        }

    }

    return {
        beforeLoad: beforeLoad,
        afterSubmit: afterSubmit
    };

});