/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Script Name: NJT | Fynamics E-Invoice Button (User Event)
 * File Name: njt_ue_fynamics_einvoice_btn.js
 * Description: Adds the "Generate E-Invoice" button on the Invoice record in VIEW mode.
 *              When triggered, directly launches Map/Reduce task via N/task and checks
 *              the E-Invoice triggered checkbox on the record.
 *              If the checkbox is checked, hides the "Generate E-Invoice" button and
 *              removes the standard "Edit" button from the Invoice form.
 */

define([
    'N/record',
    'N/task',
    'N/ui/message',
    'N/log'
], (record, task, message, log) => {

    const CONFIG = {
        // Candidate checkbox field IDs on Invoice record (user-confirmed custbody_fynamics_einvoice_generated with auto-fallbacks)
        TRIGGER_CHECKBOX_FIELDS: [
            'custbody_fynamics_einvoice_generated',
            'custbody_einvoice_generated',
            'custbody_fynamics_triggered',
            'custbody_fynamics_is_einvoiced',
            'custbody_einvoice_triggered'
        ]
    };

    /**
     * Checks if the Invoice has already been triggered or cleared.
     * @param {Record} invoiceRec
     * @returns {boolean}
     */
    const isInvoiceTriggered = (invoiceRec) => {
        if (!invoiceRec) return false;

        // 1. Check candidate checkbox fields
        for (let i = 0; i < CONFIG.TRIGGER_CHECKBOX_FIELDS.length; i++) {
            try {
                const val = invoiceRec.getValue({ fieldId: CONFIG.TRIGGER_CHECKBOX_FIELDS[i] });
                if (val === true || val === 'T' || val === 'true') {
                    return true;
                }
            } catch (e) {}
        }

        // 2. Also check if already CLEARED
        try {
            const status = invoiceRec.getValue({ fieldId: 'custbody_fynamics_einvoice_status' });
            if (status === 'CLEARED' || status === 'SUCCESS') {
                return true;
            }
        } catch (e) {}

        return false;
    };

    /**
     * Marks the invoice trigger checkbox as true on the record.
     * @param {number|string} invoiceId
     */
    const setInvoiceTriggered = (invoiceId) => {
        for (let i = 0; i < CONFIG.TRIGGER_CHECKBOX_FIELDS.length; i++) {
            const fieldId = CONFIG.TRIGGER_CHECKBOX_FIELDS[i];
            try {
                record.submitFields({
                    type: record.Type.INVOICE,
                    id: invoiceId,
                    values: {
                        [fieldId]: true,
                        'custbody_fynamics_einvoice_status': 'IN_PROGRESS'
                    },
                    options: {
                        ignoreMandatoryFields: true
                    }
                });
                log.audit({
                    title: 'Invoice Checkbox Set Successfully & Status set to IN_PROGRESS',
                    details: `Field ${fieldId} checked on Invoice #${invoiceId}`
                });
                return fieldId;
            } catch (err) {
                try {
                    record.submitFields({
                        type: record.Type.INVOICE,
                        id: invoiceId,
                        values: { [fieldId]: true },
                        options: { ignoreMandatoryFields: true }
                    });
                    return fieldId;
                } catch (fallbackErr) {}
            }
        }
        log.warn({
            title: 'Could not set trigger checkbox',
            details: `None of candidate fields (${CONFIG.TRIGGER_CHECKBOX_FIELDS.join(', ')}) exist on Invoice #${invoiceId}.`
        });
        return null;
    };

    /**
     * Executes before the record is presented to the user.
     * 1. In EDIT mode: blocks editing if invoice has already been triggered.
     * 2. In VIEW mode:
     *    - If triggered (generate_einvoice=T), submits Map/Reduce and sets checkbox to true.
     *    - If checkbox is checked: removes standard "Edit" button and suppresses "Generate E-Invoice" button.
     *    - If not checked: renders "Generate E-Invoice" button.
     *
     * @param {Object} context
     * @param {Record} context.newRecord - New record
     * @param {string} context.type - Trigger type
     * @param {Form} context.form - Current form
     */
    const beforeLoad = (context) => {
        try {
            const invoiceRec = context.newRecord;
            const invoiceId = invoiceRec.id;

            if (!invoiceId) {
                return;
            }

            // 1. Guard against direct EDIT access if already triggered
            if (context.type === context.UserEventType.EDIT) {
                if (isInvoiceTriggered(invoiceRec)) {
                    throw new Error('This invoice has already been submitted for E-Invoicing and cannot be edited.');
                }
                return;
            }

            // Only proceed for VIEW mode
            if (context.type !== context.UserEventType.VIEW) {
                return;
            }

            const form = context.form;
            const request = context.request;

            let justTriggered = false;

            // 2. Check if user clicked "Generate E-Invoice" (URL contains generate_einvoice=T)
            if (request && request.parameters && request.parameters.generate_einvoice === 'T') {
                justTriggered = true;

                try {
                    log.audit({
                        title: 'Triggering Map/Reduce Directly from User Event',
                        details: `Invoice ID: ${invoiceId}`
                    });

                    // Directly trigger Map/Reduce script without any Suitelet
                    const mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_njt_mr_fynamics_einvoice',
                        deploymentId: 'customdeploy_njt_mr_fynamics_einvoice',
                        params: {
                            custscript_fynamics_invoice_id: invoiceId
                        }
                    });

                    const taskId = mrTask.submit();

                    log.audit({
                        title: 'Map/Reduce Task Submitted Successfully from User Event',
                        details: `Task ID: ${taskId} | Invoice ID: ${invoiceId}`
                    });

                    // Immediately mark the checkbox as true on the Invoice record
                    setInvoiceTriggered(invoiceId);

                    // Display native NetSuite confirmation banner on top of the Invoice page
                    form.addPageInitMessage({
                        type: message.Type.CONFIRMATION,
                        title: 'E-Invoice Task Submitted Successfully',
                        message: `Map/Reduce task has been queued in the background (Task ID: ${taskId}). The invoice is being processed with Fynamics.`
                    });

                } catch (taskErr) {
                    log.error({
                        title: 'Failed to Submit Map/Reduce Task from User Event',
                        details: taskErr
                    });

                    form.addPageInitMessage({
                        type: message.Type.ERROR,
                        title: 'E-Invoice Generation Failed',
                        message: `Could not launch background task: ${taskErr.message}`
                    });
                }

                // Strip &generate_einvoice=T from the browser URL immediately
                // and pass flags to trigger the Client Script loading popup
                const cleanScriptField = form.addField({
                    id: 'custpage_clean_url_script',
                    type: 'inlinehtml',
                    label: 'Clean URL and Trigger Popup'
                });
                cleanScriptField.defaultValue = `<script>
                    window._fynamicsJustTriggered = true;
                    window._fynamicsInvoiceId = "${invoiceId}";
                    if (window.history && window.history.replaceState) {
                        var cleanUrl = window.location.href.replace(/([&?])generate_einvoice=T&?/g, '$1').replace(/[?&]$/, '');
                        window.history.replaceState(null, document.title, cleanUrl);
                    }
                </script>`;
            }

            // 3. Always attach Client Script for VIEW mode (needed for button click and loading popup polling)
            form.clientScriptModulePath = './njt_cs_fynamics_einvoice_btn.js';

            // 4. Check if invoice is triggered (either just now or previously recorded)
            const isTriggered = justTriggered || isInvoiceTriggered(invoiceRec);

            if (isTriggered) {
                // Remove the standard NetSuite "Edit" button
                try {
                    form.removeButton({ id: 'edit' });
                    log.debug({
                        title: 'Edit Button Removed',
                        details: `Invoice #${invoiceId} is marked as triggered/cleared.`
                    });
                } catch (btnErr) {
                    log.debug({ title: 'Remove Edit button ignored', details: btnErr.message });
                }

                // Do NOT add the "Generate E-Invoice" button (hides it once triggered)
                log.debug({
                    title: 'Generate E-Invoice Button Hidden',
                    details: `Invoice #${invoiceId} has already been triggered.`
                });
                return;
            }

            // 5. If NOT triggered yet: add "Generate E-Invoice" button
            form.addButton({
                id: 'custpage_btn_generate_einvoice',
                label: 'Generate E-Invoice',
                functionName: 'onGenerateEInvoice'
            });

            log.debug({
                title: 'Generate E-Invoice Button Rendered',
                details: `Invoice ID: ${invoiceId}`
            });

        } catch (e) {
            log.error({
                title: 'Error in beforeLoad (Generate E-Invoice Button)',
                details: e
            });
        }
    };

    /**
     * Optional afterSubmit hook: ready for post-save events if needed.
     */
    const afterSubmit = (context) => {
        // Ready for post-save events if needed
    };

    return {
        beforeLoad,
        afterSubmit
    };
});
