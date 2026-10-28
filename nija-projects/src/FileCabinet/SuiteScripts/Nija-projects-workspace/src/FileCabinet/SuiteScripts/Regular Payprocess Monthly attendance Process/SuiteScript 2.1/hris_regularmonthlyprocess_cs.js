/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 * @Description Client script for Regular Payprocess Monthly Attendance Process.
 */
define(['N/currentRecord', 'N/query', 'N/log'], (currentRecord, query, log) => {

    /**
     * Function to be executed after page is initialized.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being handled (create, copy, or edit)
     */
    const pageInit = (scriptContext) => {
        try {
            const recordObj = currentRecord.get();
            const statusQuery = `
                SELECT custrecord_hris_mr_sts, BUILTIN.DF(custrecord_hris_mr_sts) AS name 
                FROM customrecord_hris_mr_status_bar_rec 
                WHERE id = 16
            `;

            const queryResults = query.runSuiteQL({ query: statusQuery });
            const records = queryResults.asMappedResults();

            const mrStatus = recordObj.getField({ fieldId: 'custpage_mr_status' });
            if (mrStatus) {
                mrStatus.removeSelectOption({ value: null });
                if (records && records.length > 0) {
                    for (const rec of records) {
                        mrStatus.insertSelectOption({
                            value: String(rec.custrecord_hris_mr_sts),
                            text: rec.name,
                            isSelected: true
                        });
                    }
                }
            }

            const status = recordObj.getValue({ fieldId: 'custpage_mr_status' });
            if (status == 2) {
                refreshPayProcess();
            }
        } catch (e) {
            log.error({
                title: 'Error in pageInit',
                details: e.message || e
            });
        }
    };

    /**
     * Alerts the user and reloads the page to check process progress.
     */
    const refreshPayProcess = () => {
        alert('Please wait for some time, Regular Payprocess Monthly Attendance is in progress.....');
        location.reload(true);
    };

    return {
        pageInit
    };
});
