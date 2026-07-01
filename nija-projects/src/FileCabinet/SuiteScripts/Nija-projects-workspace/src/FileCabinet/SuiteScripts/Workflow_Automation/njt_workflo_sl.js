/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/redirect', 'N/runtime', 'N/email'], (
    record,
    search,
    redirect,
    runtime,
    email
) => {

    const onRequest = (context) => {

        try {

            const action =
                context.request.parameters.action;
            const reason =
                context.request.parameters.reason || '';
            log.debug("r-reason", reason);

            const recordType =
                context.request.parameters.recordtype;

            const recordId =
                context.request.parameters.recordid;

            if (!recordType || !recordId) {
                return;
            }

            const rawMappings = context.request.parameters.mappings;
            const mappings = rawMappings ? JSON.parse(rawMappings) : {
                status: 'custbody_approval_status',
                approval_setup: 'custbody_approval_setup',
                current_level: 'custbody_current_level',
                next_approver: 'custbody_next_approver',
                next_approver_role: 'custbody_next_approver_role',
                rejection_reason: 'custbody_rejection_reason',
                approval_requestor: 'custbody_approval_requestor',
                email_recipient_field: '',
                email_cc: ''
            };

            const rec = record.load({
                type: recordType,
                id: recordId,
                isDynamic: false
            });

            const approvalSetup =
                rec.getValue(mappings.approval_setup);

            const currentLevel =
                Number(rec.getValue(mappings.current_level)) || 1;

            if (action === 'submit') {

                processSubmit(
                    rec,
                    approvalSetup,
                    mappings
                );

            } else if (action === 'approve') {

                processApproval(
                    rec,
                    approvalSetup,
                    currentLevel,
                    mappings
                );

            } else if (action === 'reject') {

                processReject(
                    rec,
                    reason,
                    approvalSetup,
                    currentLevel,
                    mappings
                );
            }

            redirect.toRecord({
                type: recordType,
                id: recordId
            });

        } catch (e) {

            log.error({
                title: 'Approval Engine Error',
                details: e
            });
        }
    };

    function processSubmit(
        rec,
        approvalSetup,
        mappings
    ) {

        var detailSearch = search.create({
            type: 'customrecord_approval_setup_detail',
            filters: [
                ['custrecord_asd_parent', 'anyof', approvalSetup],
                'AND',
                ['custrecord_asd_level', 'equalto', '1']
            ],
            columns: [
                'custrecord_asd_type',
                'custrecord_asd_employee',
                'custrecord_asd_role'
            ]
        });

        var result = detailSearch.run().getRange({
            start: 0,
            end: 1
        });

        if (!result.length) {
            return;
        }

        var approvalType =
            result[0].getText(
                'custrecord_asd_type'
            );

        var approverId =
            result[0].getValue(
                'custrecord_asd_employee'
            );

        var roleId =
            result[0].getValue(
                'custrecord_asd_role'
            );

        rec.setValue({
            fieldId: mappings.current_level,
            value: 1
        });

        if (approvalType === 'Employee') {

            rec.setValue({
                fieldId: mappings.next_approver,
                value: approverId
            });

            rec.setValue({
                fieldId: mappings.next_approver_role,
                value: null
            });

        } else {

            rec.setValue({
                fieldId: mappings.next_approver,
                value: null
            });

            rec.setValue({
                fieldId: mappings.next_approver_role,
                value: roleId
            });

        }

        rec.save();
    }

    function processApproval(
        rec,
        approvalSetup,
        currentLevel,
        mappings
    ) {
        var setupRec = record.load({
            type: 'customrecord_approval_setup',
            id: approvalSetup
        });

        var emailEnabled = setupRec.getValue({
            fieldId: 'custrecord_as_email_enabled'
        });

        const nextLevel = currentLevel + 1;

        const detailSearch = search.create({
            type: 'customrecord_approval_setup_detail',
            filters: [
                ['custrecord_asd_parent', 'anyof', approvalSetup],
                'AND',
                ['custrecord_asd_level', 'equalto', nextLevel]
            ],
            columns: [
                'custrecord_asd_type',
                'custrecord_asd_employee',
                'custrecord_asd_role'
            ]
        });

        const result =
            detailSearch.run().getRange({
                start: 0,
                end: 1
            });

        if (result.length > 0) {

            var approvalType =
                result[0].getText(
                    'custrecord_asd_type'
                );

            var nextApprover =
                result[0].getValue(
                    'custrecord_asd_employee'
                );

            var nextRole =
                result[0].getValue(
                    'custrecord_asd_role'
                );

            log.debug('Next Level Type', approvalType);

            rec.setValue({
                fieldId: mappings.current_level,
                value: nextLevel
            });

            if (approvalType === 'Employee') {

                rec.setValue({
                    fieldId: mappings.next_approver,
                    value: nextApprover
                });

                rec.setValue({
                    fieldId: mappings.next_approver_role,
                    value: null
                });
                if (
                    emailEnabled &&
                    approvalType === 'Employee' &&
                    nextApprover
                ) {

                    var tranId = rec.getValue('tranid') || rec.getValue('name') || rec.id;
                    var emailHtml = buildHtmlEmail(
                        'Action Required: Document Approval',
                        '<p>Hello,</p><p>A <strong>' + rec.type.toUpperCase() + '</strong> is waiting for your review and approval.</p>' +
                        '<table style="width:100%; border-collapse: collapse; margin-top:15px; margin-bottom:15px;">' +
                        '<tr><td style="padding:8px 0; border-bottom:1px solid #e5e7eb; color:#4b5563; width:140px;"><strong>Document Number:</strong></td><td style="padding:8px 0; border-bottom:1px solid #e5e7eb; color:#111827;"><strong>' + tranId + '</strong></td></tr>' +
                        '</table>' +
                        '<p style="margin-top:20px;">Please log in to NetSuite to review the details and take the necessary action.</p>',
                        '#3b82f6' // Blue
                    );

                    sendApprovalEmail(
                        nextApprover,
                        'Approval Required - ' + tranId,
                        emailHtml
                    );
                }

            } else if (approvalType === 'Role') {

                rec.setValue({
                    fieldId: mappings.next_approver,
                    value: null
                });

                rec.setValue({
                    fieldId: mappings.next_approver_role,
                    value: nextRole
                });

            }

        } else {

            rec.setValue({
                fieldId: mappings.status,
                value: 2
            });

            rec.setValue({
                fieldId: mappings.next_approver,
                value: null
            });

            rec.setValue({
                fieldId: mappings.next_approver_role,
                value: null
            });

            rec.setValue({
                fieldId: mappings.rejection_reason,
                value: ''
            });

            if (mappings.additional_approved_values) {
                for (var fieldId in mappings.additional_approved_values) {
                    if (mappings.additional_approved_values.hasOwnProperty(fieldId)) {
                        rec.setValue({
                            fieldId: fieldId,
                            value: mappings.additional_approved_values[fieldId]
                        });
                    }
                }
            }
            var recipient;
            if (mappings.email_recipient_field) {
                recipient = rec.getValue({
                    fieldId: mappings.email_recipient_field
                });
            } else {
                recipient = rec.getValue({
                    fieldId: mappings.approval_requestor
                });
            }

            var tranId = rec.getValue('tranid') || rec.getValue('name') || rec.id;
            var emailHtml = '';
            var subject = '';

            if (mappings.email_template_approved) {
                var template = mappings.email_template_approved;
                var parsedBody = fillTemplate(template.body, rec);
                var parsedSubject = fillTemplate(template.subject, rec);

                emailHtml = buildSimpleHtmlEmail(parsedBody);
                subject = parsedSubject || ('Document Approved - ' + tranId);
            } else {
                var bodyText = '<p>Hello,</p><p>Good news! Your document has been <strong>fully approved</strong>.</p>' +
                    '<table style="width:100%; border-collapse: collapse; margin-top:15px; margin-bottom:15px;">' +
                    '<tr><td style="padding:8px 0; border-bottom:1px solid #e5e7eb; color:#4b5563; width:140px;"><strong>Document Number:</strong></td><td style="padding:8px 0; border-bottom:1px solid #e5e7eb; color:#111827;"><strong>' + tranId + '</strong></td></tr>' +
                    '</table>';
                emailHtml = buildSimpleHtmlEmail(bodyText);
                subject = 'Document Approved - ' + tranId;
            }

            var ccRecipient = mappings.email_cc || [];

            if (recipient) {
                sendApprovalEmail(
                    recipient,
                    subject,
                    emailHtml,
                    ccRecipient
                );
            }

            // Role-based notification dynamically configured on the Approval Setup record
            var notifyRole = setupRec.getValue('custrecord_as_email_notifying_role');
            if (notifyRole) {
                var roleEmployees = getEmployeesInRole(notifyRole);
                log.debug('Notifying Role ' + notifyRole, 'Employees: ' + JSON.stringify(roleEmployees));
                for (var r = 0; r < roleEmployees.length; r++) {
                    if (Number(roleEmployees[r]) !== Number(recipient)) {
                        sendApprovalEmail(
                            roleEmployees[r],
                            subject,
                            emailHtml
                        );
                    }
                }
            }

        }
        createApprovalHistory({

            recordId: rec.id,
            recordType: rec.type,
            approvalSetup: approvalSetup,
            level: currentLevel,
            action: 1, // Approved

            employee:
                runtime.getCurrentUser().id,
            role: runtime.getCurrentUser().role

        });
        rec.save();
    }

    function processReject(rec, reason, approvalSetup,
        currentLevel, mappings) {
        var setupRec = record.load({
            type: 'customrecord_approval_setup',
            id: approvalSetup
        });

        var emailEnabled = setupRec.getValue({
            fieldId: 'custrecord_as_email_enabled'
        });
        rec.setValue({
            fieldId: mappings.status,
            value: 3
        });

        rec.setValue({
            fieldId: mappings.rejection_reason,
            value: reason
        });

        rec.setValue({
            fieldId: mappings.next_approver,
            value: null
        });
        rec.setValue({
            fieldId: mappings.next_approver_role,
            value: null
        });

        if (mappings.additional_rejected_values) {
            for (var fieldId in mappings.additional_rejected_values) {
                if (mappings.additional_rejected_values.hasOwnProperty(fieldId)) {
                    rec.setValue({
                        fieldId: fieldId,
                        value: mappings.additional_rejected_values[fieldId]
                    });
                }
            }
        }
        createApprovalHistory({

            recordId: rec.id,
            recordType: rec.type,
            approvalSetup: approvalSetup,
            level: currentLevel,
            action: 2, // Rejected

            employee:
                runtime.getCurrentUser().id,
            role: runtime.getCurrentUser().role,

            comments: reason

        });
        var recipient;
        if (mappings.email_recipient_field) {
            recipient = rec.getValue({
                fieldId: mappings.email_recipient_field
            });
        } else {
            recipient = rec.getValue({
                fieldId: mappings.approval_requestor
            });
        }

        if (recipient) {

            var tranId = rec.getValue('tranid') || rec.getValue('name') || rec.id;
            var emailHtml = '';
            var subject = '';

            if (mappings.email_template_rejected) {
                var template = mappings.email_template_rejected;
                var parsedBody = fillTemplate(template.body, rec);
                var parsedSubject = fillTemplate(template.subject, rec);

                emailHtml = buildSimpleHtmlEmail(parsedBody);
                subject = parsedSubject || ('Document Rejected - ' + tranId);
            } else {
                var bodyText = '<p>Hello,</p><p>Your document has been <strong>rejected</strong>.</p>' +
                    '<table style="width:100%; border-collapse: collapse; margin-top:15px; margin-bottom:15px;">' +
                    '<tr><td style="padding:8px 0; border-bottom:1px solid #e5e7eb; color:#4b5563; width:140px;"><strong>Document Number:</strong></td><td style="padding:8px 0; border-bottom:1px solid #e5e7eb; color:#111827;"><strong>' + tranId + '</strong></td></tr>' +
                    '</table>' +
                    '<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin-top: 15px; color: #991b1b;">' +
                    '<strong style="display:block; margin-bottom:4px;">Reason for Rejection:</strong>' + (reason || 'No reason provided.') + '</div>' +
                    '<p style="margin-top:20px;">Please review the comments and make the necessary corrections before resubmitting.</p>';
                emailHtml = buildHtmlEmail('Document Rejected', bodyText, '#ef4444');
                subject = 'Document Rejected - ' + tranId;
            }

            var ccRecipient = mappings.email_cc || [];

            sendApprovalEmail(
                recipient,
                subject,
                emailHtml,
                ccRecipient
            );
        }

        rec.save();
    }
    function createApprovalHistory(data) {

        var historyRec = record.create({
            type: 'customrecord_approval_history'
        });

        historyRec.setValue({
            fieldId: 'custrecord_ah_recordid',
            value: data.recordId
        });

        historyRec.setValue({
            fieldId: 'custrecord_ah_recordtype',
            value: data.recordType
        });

        historyRec.setValue({
            fieldId: 'custrecord_ah_setup',
            value: data.approvalSetup
        });

        historyRec.setValue({
            fieldId: 'custrecord_ah_level',
            value: data.level
        });

        historyRec.setValue({
            fieldId: 'custrecord_ah_action',
            value: data.action
        });

        if (data.employee) {

            historyRec.setValue({
                fieldId: 'custrecord_ah_employee',
                value: data.employee
            });

        }

        if (data.role) {

            historyRec.setValue({
                fieldId: 'custrecord_ah_role',
                value: data.role
            });

        }

        historyRec.setValue({
            fieldId: 'custrecord_ah_comments',
            value: data.comments || ''
        });

        historyRec.setValue({
            fieldId: 'custrecord_ah_actiondate',
            value: new Date()
        });

        historyRec.save();
    }
    function getEmployeesInRole(roleId) {
        var employeeIds = [];
        if (!roleId) return employeeIds;
        try {
            var employeeSearch = search.create({
                type: search.Type.EMPLOYEE,
                filters: [
                    ['role', 'anyof', roleId],
                    'AND',
                    ['isinactive', 'is', 'F'],
                    'AND',
                    ['email', 'isnotempty', '']
                ],
                columns: ['internalid']
            });
            employeeSearch.run().each(function (result) {
                employeeIds.push(result.getValue('internalid'));
                return true;
            });
        } catch (e) {
            log.error({
                title: 'Error getting employees in role',
                details: e
            });
        }
        return employeeIds;
    }

    function sendApprovalEmail(recipient, subject, body, cc) {

        try {

            var emailOptions = {
                author: runtime.getCurrentUser().id,
                recipients: recipient,
                subject: subject,
                body: body
            };

            if (cc) {
                if (typeof cc === 'string') {
                    if (cc.indexOf(',') > -1) {
                        emailOptions.cc = cc.split(',').map(function (item) { return item.trim(); });
                    } else if (cc.trim() !== '') {
                        emailOptions.cc = [cc.trim()];
                    }
                } else if (Array.isArray(cc) && cc.length > 0) {
                    emailOptions.cc = cc;
                } else if (typeof cc === 'number') {
                    emailOptions.cc = [cc];
                }
            }

            email.send(emailOptions);

        } catch (e) {

            log.error({
                title: 'Email Error',
                details: e
            });

        }
    }

    function fillTemplate(templateStr, rec) {
        if (!templateStr) return '';
        return templateStr.replace(/\{([a-zA-Z0-9_]+)\}/g, function (match, fieldId) {
            if (fieldId === 'tranid') {
                return rec.getValue('tranid') || rec.getValue('name') || rec.id || '';
            }
            try {
                var textVal = rec.getText({ fieldId: fieldId });
                if (textVal) {
                    return textVal;
                }
                var val = rec.getValue({ fieldId: fieldId });
                return (val !== null && val !== undefined) ? String(val) : '';
            } catch (err) {
                return '';
            }
        });
    }

    function buildSimpleHtmlEmail(messageHtml) {
        return '<div style="font-family: \'Segoe UI\', Arial, sans-serif; font-size: 14px; color: #333333; line-height: 1.6;">' +
            messageHtml +
            '</div>';
    }

    function buildHtmlEmail(title, messageHtml, headerColor) {
        return '' +
            '<div style="font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">' +
            '    <div style="background-color: ' + headerColor + '; padding: 20px 25px; color: #ffffff; text-align: center;">' +
            '        <h2 style="margin: 0; font-size: 22px; font-weight: 600; letter-spacing: 0.5px;">' + title + '</h2>' +
            '    </div>' +
            '    <div style="padding: 30px 25px; color: #374151; line-height: 1.6; font-size: 15px; background-color: #ffffff;">' +
            '        ' + messageHtml +
            '    </div>' +
            '    <div style="background-color: #f9fafb; padding: 15px 25px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb;">' +
            '        This is an automated notification from your NetSuite Workflow System.<br/>' +
            '        Please do not reply directly to this email.' +
            '    </div>' +
            '</div>';
    }

    return {
        onRequest
    };

});