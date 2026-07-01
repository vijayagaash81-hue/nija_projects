/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], () => {
    /**
     * Entry point: pageInit
     * Required for ClientScript type
     * @param {Object} scriptContext
     */
    const pageInit = (scriptContext) => {
        // Entry point - logic not required for this use case
    };

    /**
     * Triggered by the "Post JV" button.
     * Prompts for confirmation and redirects the page with the custom URL parameter.
     */
    const postJvTriggered = () => {
        if (confirm('Are you sure you want to post a Journal Entry for this Expense record?')) {
            const searchParams = new URLSearchParams(window.location.search);
            searchParams.set('custparam_postjv', 'T');
            window.location.href = window.location.pathname + '?' + searchParams.toString();
        }
    };

    return {
        pageInit: pageInit,
        postJvTriggered: postJvTriggered
    };
});
