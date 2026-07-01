/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * 
 * Description: A sample scheduled script that searches for specific records 
 * and processes them while monitoring governance limits.
 */
define(['N/search', 'N/record', 'N/log', 'N/task', 'N/runtime'], (search, record, log, task, runtime) => {

    /**
     * Defines the Scheduled script trigger point.
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     */
    const execute = (scriptContext) => {
        try {
            log.audit('Script Execution Started', `Trigger type: ${scriptContext.type}`);

            // 1. Create a search to find records to process
            const mySearch = search.create({
                type: search.Type.CUSTOMER,
                filters: [
                    ['isinactive', 'is', 'F']
                    // Add more filters as needed
                ],
                columns: ['internalid', 'companyname']
            });

            // 2. Run the search and process results
            const pagedData = mySearch.runPaged({ pageSize: 1000 });

            pagedData.pageRanges.forEach((pageRange) => {
                const page = pagedData.fetch({ index: pageRange.index });
                
                page.data.forEach((result) => {
                    // Process each record
                    const customerId = result.id;
                    const companyName = result.getValue({ name: 'companyname' });

                    log.debug('Processing Customer', `ID: ${customerId}, Name: ${companyName}`);

                    // Example: Load record, update a field, and save
                    // const custRec = record.load({ type: record.Type.CUSTOMER, id: customerId });
                    // custRec.setValue({ fieldId: 'comments', value: 'Processed by Scheduled Script' });
                    // custRec.save();

                    // 3. Check governance limits after processing each record
                    checkGovernance();
                });
            });

            log.audit('Script Execution Completed', 'All records processed successfully.');

        } catch (e) {
            log.error('Error in Scheduled Script', e.message);
        }
    };

    /**
     * Helper function to monitor governance limits and reschedule if necessary.
     */
    const checkGovernance = () => {
        const scriptObj = runtime.getCurrentScript();
        const remainingUsage = scriptObj.getRemainingUsage();

        // If remaining usage drops below a safe threshold (e.g., 500 units), reschedule the script
        if (remainingUsage < 500) {
            log.audit('Rescheduling Script', `Usage remaining: ${remainingUsage}. Rescheduling...`);
            const scheduledScriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });
            scheduledScriptTask.scriptId = scriptObj.id;
            scheduledScriptTask.deploymentId = scriptObj.deploymentId;
            scheduledScriptTask.submit();
            throw new Error('Rescheduled due to governance limits.'); // Stop current execution
        }
    };

    return { execute };
});