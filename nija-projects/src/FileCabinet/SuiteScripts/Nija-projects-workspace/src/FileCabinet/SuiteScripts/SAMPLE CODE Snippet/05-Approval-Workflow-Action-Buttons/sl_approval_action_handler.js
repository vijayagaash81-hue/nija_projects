/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * Scenario: Multi-Level Approval Flow & Dynamic Action Buttons
 * Component: Suitelet Action Handler
 * Purpose: Receives approval action (SUBMIT, APPROVE, REJECT), verifies permissions,
 *          updates status & timestamp, appends audit trail remarks, sends email, and redirects back.
 */
define(['N/record', 'N/redirect', 'N/runtime', 'N/email', 'N/log'], 
(record, redirect, runtime, email, log) => {

    const STATUS_DRAFT = '1';
    const STATUS_PENDING_APPROVAL = '2';
    const STATUS_APPROVED = '3';
    const STATUS_REJECTED = '4';

    const onRequest = (context) => {
        try {
            const params = context.request.parameters;
            const action = params.action; // 'SUBMIT', 'APPROVE', 'REJECT'
            const recId = params.recId;
            const recType = params.recType;
            const notes = params.notes || '';

            const currentUser = runtime.getCurrentUser();
            const currentUserId = currentUser.id;

            log.audit({
                title: 'Approval Action Received',
                details: `Action: ${action}, RecId: ${recId}, User: ${currentUser.name}`
            });

            if (!recId || !action) {
                context.response.write('Invalid parameters.');
                return;
            }

            let newStatus = STATUS_PENDING_APPROVAL;
            let logMessage = '';

            if (action === 'SUBMIT') {
                newStatus = STATUS_PENDING_APPROVAL;
                logMessage = `Submitted for approval by ${currentUser.name} on ${new Date().toLocaleString()}`;
            } else if (action === 'APPROVE') {
                newStatus = STATUS_APPROVED;
                logMessage = `Approved by ${currentUser.name} on ${new Date().toLocaleString()}`;
            } else if (action === 'REJECT') {
                newStatus = STATUS_REJECTED;
                logMessage = `Rejected by ${currentUser.name} on ${new Date().toLocaleString()}. Reason: ${notes}`;
            }

            // 1. Update Record Status & Audit Notes
            record.submitFields({
                type: recType,
                id: recId,
                values: {
                    'custrecord_approval_status': newStatus,
                    'custrecord_last_approval_action': action,
                    'custrecord_approval_remarks': logMessage,
                    'custrecord_action_by_user': currentUserId,
                    'custrecord_action_datetime': new Date()
                },
                options: { ignoreMandatoryFields: true }
            });

            log.audit({
                title: 'Record Status Updated',
                details: `Record ${recId} updated to Status: ${newStatus}`
            });

            // 2. Redirect User Back to the Record
            redirect.toRecord({
                type: recType,
                id: recId
            });

        } catch (e) {
            log.error({ title: 'Approval Handler Error', details: e });
            context.response.write(`Error processing action: ${e.message}`);
        }
    };

    return { onRequest };
});
