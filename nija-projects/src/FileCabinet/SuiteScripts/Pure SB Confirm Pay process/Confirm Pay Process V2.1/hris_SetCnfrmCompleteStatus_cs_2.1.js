/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define(['N/currentRecord', 'N/url', 'N/log'],
    (currentRecord, url, log) => {

        const pageInit = (context) => {
            try {
                const rec = currentRecord.get();

                const count = rec.getLineCount({
                    sublistId: 'custpage_payprocesssublist'
                });
                const i_baseCount = rec.getValue({ fieldId: 'custpage_count' });

                let trueCount = 0;
                for (let i = 0; i < count; i++) {
                    const s_Status = rec.getSublistValue({
                        sublistId: 'custpage_payprocesssublist',
                        fieldId: 'custpage_status',
                        line: i
                    });
                    if (s_Status === 'Completed') {
                        trueCount++;
                    }
                }

                rec.setValue({
                    fieldId: 'custpage_process',
                    value: trueCount,
                    ignoreFieldChange: true
                });

                // Auto refresh after 10 seconds if not 100%
                setTimeout(() => {
                    const i_Refresh = parseFloat(rec.getValue({ fieldId: 'custpage_refresh' }) || 0);
                    const baseCount = parseInt(i_baseCount, 10) || 0;
                    if (i_Refresh < 100 && baseCount !== count) {
                        saveRecord_SetConfrimCompleteStatus();
                    }
                }, 10000);

            } catch (e) {
                log.error('pageInit Error', e);
            }
        };

        const saveRecord_SetConfrimCompleteStatus = () => {
            try {
                const rec = currentRecord.get();

                const i_Ratio = rec.getValue({ fieldId: 'custpage_ratio' });
                const i_PayGroupFilter = rec.getValue({ fieldId: 'custpage_paygroupfilter' });
                const s_DateCreated = rec.getValue({ fieldId: 'custpage_date' });
                const i_baseCount = rec.getValue({ fieldId: 'custpage_count' });
                const i_ParentProcessId = rec.getValue({ fieldId: 'custpage_parentid' });

                const suiteletUrl = url.resolveScript({
                    scriptId: 'customscript_hris_cnfrmpayprocess_sts_sl',
                    deploymentId: 'customdeploy_hris_cnfrmpayprocess_sts_sl',
                    params: {
                        custscript_ratio: i_Ratio,
                        custscript_paygroupfilter: i_PayGroupFilter,
                        custscript_datecreated: s_DateCreated,
                        custscript_count: i_baseCount,
                        custscript_parentid: i_ParentProcessId
                    }
                });

                window.open(suiteletUrl, '_self');
                return true;

            } catch (e) {
                log.error('saveRecord_SetConfrimCompleteStatus Error', e);
                return false;
            }
        };

        // Expose to window so NetSuite Refresh button can invoke it directly
        window.saveRecord_SetConfrimCompleteStatus = saveRecord_SetConfrimCompleteStatus;

        return {
            pageInit: pageInit,
            saveRecord_SetConfrimCompleteStatus: saveRecord_SetConfrimCompleteStatus
        };
    });