/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url'], (url) => {
    // pageInit is required for Client Scripts
    const pageInit = (scriptContext) => {};

    const onPrintNoc = (recordId, recordType) => {
        // Resolve the URL of the Suitelet
        const suiteletUrl = url.resolveScript({
            scriptId: 'customscript_sl_generate_noc', // Replace with your Suitelet Script ID
            deploymentId: 'customdeploy_sl_generate_noc', // Replace with your Deployment ID
            params: {
                recId: recordId,
                recType: recordType
            }
        });

        // Open the Suitelet in a new window/tab
        window.open(suiteletUrl);
    };

    return {
        pageInit: pageInit,
        onPrintNoc: onPrintNoc
    };
});