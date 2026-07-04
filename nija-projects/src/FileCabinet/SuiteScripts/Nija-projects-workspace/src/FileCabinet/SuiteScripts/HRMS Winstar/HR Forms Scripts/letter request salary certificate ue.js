/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/log'], function(serverWidget, log) {

    function beforeLoad(context) {
        // Only execute when the record is in VIEW mode
        if (context.type !== context.UserEventType.VIEW) {
            return;
        }

        try {
            var currentRecord = context.newRecord;
            var recordType = currentRecord.type;

            // Check if we are on the correct custom record
            if (recordType === 'customrecord_hris_lve_letter_req') {
                var form = context.form;
                
                // Get the Certificate Type ID (2, 3, or 4)
                var certificateType = currentRecord.getValue({
                    fieldId: 'custrecord_hris_letreq_certificate_type'
                });

                var buttonAdded = false;

                // Condition for Offer Letter (ID: 2)
                if (certificateType == '2') {
                    form.addButton({
                        id: 'custpage_print_offer_letter',
                        label: 'Print Offer Letter',
                        functionName: 'triggerPrintOfferLetter'
                    });
                    buttonAdded = true;
                }
                
                // Condition for Salary Certificate (ID: 3)
                else if (certificateType == '3') {
                    form.addButton({
                        id: 'custpage_print_salary_certificate',
                        label: 'Print Salary Certificate',
                        functionName: 'triggerPrintSalaryCertificate'
                    });
                    buttonAdded = true;
                }

                // NEW: Condition for Experience Letter (ID: 4)
                else if (certificateType == '4') {
                    form.addButton({
                        id: 'custpage_print_exp_letter',
                        label: 'Print Experience Letter',
                        functionName: 'triggerPrintExperienceLetter'
                    });
                    buttonAdded = true;
                }

                // Link the Client Script so the buttons actually work
                if (buttonAdded) {
                    form.clientScriptModulePath = './letterrequest salary certificate cs.js'; 
                }
            }

        } catch (e) {
            log.error('Error in beforeLoad', e.message);
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});