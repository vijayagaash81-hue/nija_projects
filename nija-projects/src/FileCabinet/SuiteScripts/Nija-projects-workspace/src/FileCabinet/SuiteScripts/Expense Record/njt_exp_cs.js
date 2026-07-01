/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/search', 'N/log'], (currentRecord, search, log) => {

    /**
     * Entry point: pageInit
     * Required for ClientScript type
     * @param {Object} scriptContext
     */
    const pageInit = (scriptContext) => {
        try {
            if (scriptContext.mode === 'create') {
                const rec = scriptContext.currentRecord;
                const urlStr = window.location.href;
                
                // Helper to extract URL parameters
                const getUrlParameter = (name, url) => {
                    name = name.replace(/[\[\]]/g, '\\$&');
                    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
                    const results = regex.exec(url);
                    if (!results) return null;
                    if (!results[2]) return '';
                    return decodeURIComponent(results[2].replace(/\+/g, ' '));
                };

                const projectCode = getUrlParameter('custrecordexp_project_code', urlStr);
                const division = getUrlParameter('custrecordexp_division', urlStr);

                log.debug({
                    title: 'pageInit Parameter Population',
                    details: JSON.stringify({ projectCode, division })
                });

                if (projectCode) {
                    rec.setValue({
                        fieldId: 'custrecordexp_project_code',
                        value: projectCode,
                        ignoreFieldChange: true
                    });
                }
                if (division) {
                    rec.setValue({
                        fieldId: 'custrecordexp_division',
                        value: division,
                        ignoreFieldChange: true
                    });
                }
            }
        } catch (e) {
            log.error('Error in Client Script pageInit', e.toString());
        }
    };

    /**
     * Triggered by the "Create Expenses" button.
     * Extracts values from the current record and opens the Expense Record creation form.
     */
    const createExpensesTriggered = () => {
        try {
            const currRec = currentRecord.get();
            const recordId = currRec.id;
            const recordType = currRec.type;

            if (!recordId) {
                alert('Please save the record before creating expenses.');
                return;
            }

            // Lookup project and division values directly from the database to ensure correctness in View Mode
            const fieldValues = search.lookupFields({
                type: recordType,
                id: recordId,
                columns: ['custrecord_njt_project_2', 'custrecord_njt_pro_ord_devision']
            });

            // Helper to safely extract the internal ID of select/list fields
            const extractValue = (data) => (Array.isArray(data) && data.length > 0) ? data[0].value : (data || '');

            const projectCode = extractValue(fieldValues.custrecord_njt_project_2);
            const division = extractValue(fieldValues.custrecord_njt_pro_ord_devision);

            log.debug({
                title: 'Extracted Details for Redirection',
                details: JSON.stringify({ recordId, projectCode, division })
            });

            // Build relative URL to custom record type 749 in create mode
            let targetUrl = `/app/common/custom/custrecordentry.nl?rectype=749&pf=CUSTRECORD_WORK_ORDER_PARENT&pi=${recordId}&pr=609`;

            if (projectCode) {
                targetUrl += `&custrecordexp_project_code=${encodeURIComponent(projectCode)}`;
            }
            if (division) {
                targetUrl += `&custrecordexp_division=${encodeURIComponent(division)}`;
            }

            // Open target URL in a new window/tab
            window.open(targetUrl, '_blank');

        } catch (e) {
            log.error('Error triggering Create Expenses redirection', e.toString());
            alert('An error occurred while attempting to create expenses: ' + e.message);
        }
    };

    return {
        pageInit: pageInit,
        createExpensesTriggered: createExpensesTriggered
    };
});
