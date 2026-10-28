/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/record', 'N/url', 'N/search', 'N/log', 'N/format', 'N/runtime'],
    (record, url, search, log, format, runtime) => {

        /**
         * Optional: Standard pageInit entry point to satisfy SuiteScript 2.1 requirements
         */
        const pageInit = (scriptContext) => {
            // Your initialization logic here (if any)
        };

        /**
         * Called from the Confirm Process button
         */
        const callConfirmPayProcess = (ConfirmProcessid) => {
            debugger;
            
            try {
                const ConfProcessObj = record.load({
                    type: 'customrecord_hris_confirm_pay_process',
                    id: ConfirmProcessid,
                    isDynamic: false
                });

                const lineCount = ConfProcessObj.getLineCount({
                    sublistId: 'recmachcustrecord_hris_confirm_proc_process_gro'
                });

                let trueCount = 0;
                const a_PayGroup = [];

                for (let CP = 0; CP < lineCount; CP++) {
                    const i_Check = ConfProcessObj.getSublistValue({
                        sublistId: 'recmachcustrecord_hris_confirm_proc_process_gro',
                        fieldId: 'custrecord_hris_confirm_proc_check',
                        line: CP
                    });

                    if (i_Check === true || i_Check === 'T') {
                        const payGroupId = ConfProcessObj.getSublistValue({
                            sublistId: 'recmachcustrecord_hris_confirm_proc_process_gro',
                            fieldId: 'custrecord_hris_confirm_proc_paygroup',
                            line: CP
                        });

                        a_PayGroup.push(payGroupId);
                        trueCount++;
                    }
                }

                const suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_hris_cnfrmpayproce_oncal_sl',
                    deploymentId: 'customdeploy_hris_cnfrmpayproce_oncal_sl',
                    params: {
                        custscript_truecount: trueCount,
                        custscript_pagegroup: a_PayGroup.join(','),
                        custscript_processid: ConfirmProcessid
                    }
                });

                window.open(suiteletUrl, '_blank');

            } catch (e) {
                log.error('callConfirmPayProcess Error', e);
                alert('Error while starting Confirm Pay Process: ' + e.message);
            }
        };

        // Expose to window so NetSuite custom button can invoke it directly
        window.callConfirmPayProcess = callConfirmPayProcess;

        return {
            pageInit: pageInit,
            callConfirmPayProcess: callConfirmPayProcess
        };
    });