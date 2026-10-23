/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * 
 * Scenario: Multi-Level Approval Flow & Dynamic Action Buttons
 * Purpose: Evaluates current approval status, employee hierarchy (Line Manager / Approver),
 *          and user role in VIEW mode, dynamically adding "Approve", "Reject", or
 *          "Submit for Approval" buttons that securely invoke an approval Suitelet.
 */
define(['N/runtime', 'N/url', 'N/ui/serverWidget', 'N/log'], 
(runtime, url, serverWidget, log) => {

    // Status Constants
    const STATUS_DRAFT = '1';
    const STATUS_PENDING_APPROVAL = '2';
    const STATUS_APPROVED = '3';
    const STATUS_REJECTED = '4';

    const beforeLoad = (context) => {
        try {
            if (context.type !== context.UserEventType.VIEW) return;

            const rec = context.newRecord;
            const form = context.form;
            const recId = rec.id;
            const recType = rec.type;

            const currentUserId = runtime.getCurrentUser().id;
            const currentUserRole = runtime.getCurrentUser().role;

            const currentStatus = String(rec.getValue('custrecord_approval_status') || STATUS_DRAFT);
            const designatedApprover = rec.getValue('custrecord_approver_employee');

            log.debug({
                title: 'Approval Evaluation',
                details: `Status: ${currentStatus}, User: ${currentUserId}, Approver: ${designatedApprover}`
            });

            // 1. Resolve Action Suitelet URL base
            const suiteletBaseUrl = url.resolveScript({
                scriptId: 'customscript_njt_approval_action_sl',
                deploymentId: 'customdeploy_njt_approval_action_sl'
            });

            // Helper script injection for prompt/confirmation
            const inlineScript = form.addField({
                id: 'custpage_approval_action_script',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Approval Script'
            });

            inlineScript.defaultValue = `
                <script type="text/javascript">
                    function processApprovalAction(actionType) {
                        var comments = '';
                        if (actionType === 'REJECT') {
                            comments = prompt('Please enter the reason for rejection:');
                            if (!comments || comments.trim() === '') {
                                alert('Rejection reason is mandatory.');
                                return;
                            }
                        } else {
                            if (!confirm('Are you sure you want to ' + actionType.toLowerCase() + ' this document?')) {
                                return;
                            }
                        }

                        var targetUrl = '${suiteletBaseUrl}&action=' + actionType + 
                                        '&recId=${recId}&recType=${recType}&notes=' + encodeURIComponent(comments || '');
                        window.location.href = targetUrl;
                    }
                </script>
            `;

            // 2. State-Based Button Rendering
            if (currentStatus === STATUS_DRAFT || currentStatus === STATUS_REJECTED) {
                // Show "Submit for Approval"
                form.addButton({
                    id: 'custpage_btn_submit_approval',
                    label: 'Submit for Approval',
                    functionName: "processApprovalAction('SUBMIT')"
                });
            } else if (currentStatus === STATUS_PENDING_APPROVAL) {
                // Show "Approve" & "Reject" ONLY if user is the designated Approver or Administrator (Role 3)
                const isAuthorized = (currentUserId == designatedApprover) || (currentUserRole === 3);

                if (isAuthorized) {
                    form.addButton({
                        id: 'custpage_btn_approve_action',
                        label: 'Approve',
                        functionName: "processApprovalAction('APPROVE')"
                    });

                    form.addButton({
                        id: 'custpage_btn_reject_action',
                        label: 'Reject',
                        functionName: "processApprovalAction('REJECT')"
                    });
                }
            }

        } catch (e) {
            log.error({ title: 'Error in beforeLoad (Approval Buttons)', details: e });
        }
    };

    return { beforeLoad };
});
