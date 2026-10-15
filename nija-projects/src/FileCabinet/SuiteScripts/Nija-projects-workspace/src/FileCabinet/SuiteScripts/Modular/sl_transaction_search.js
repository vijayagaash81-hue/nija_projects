/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * Script Name: sl_transaction_search.js
 * Location: File Cabinet > SuiteScripts > Modular
 * Description: Sample Modular Suitelet for Transaction Search & HTML display.
 */
define([
    'N/ui/serverWidget',
    'N/log',
    './transactionSearchModule',
    './transactionResultsModule'
], (
    serverWidget,
    log,
    searchModule,
    resultsModule
) => {

    /**
     * Suitelet onRequest Handler.
     * 
     * @param {Object} context
     * @param {ServerRequest} context.request
     * @param {ServerResponse} context.response
     */
    const onRequest = (context) => {
        const { request, response } = context;

        try {
            // Extract search filter parameters from GET or POST request
            const filters = {
                trantype: request.parameters.trantype || 'ALL',
                entity: request.parameters.entity || '',
                startDate: request.parameters.startDate || '',
                endDate: request.parameters.endDate || '',
                limit: request.parameters.limit || '50'
            };

            log.debug({
                title: 'sl_transaction_search.onRequest',
                details: `Method: ${request.method}, Filters: ${JSON.stringify(filters)}`
            });

            // 1. Execute transaction search via modular search script
            const searchResults = searchModule.runTransactionSearch(filters);

            // 2. Retrieve available transaction types list
            const transactionTypes = searchModule.getSupportedTransactionTypes();

            // 3. Render HTML view via modular HTML renderer script
            const renderedHtml = resultsModule.renderPageHtml({
                results: searchResults,
                filters: filters,
                transactionTypes: transactionTypes,
                suiteletUrl: request.url
            });

            // 4. Build Suitelet Form and render via writePage
            const form = serverWidget.createForm({
                title: 'Transaction Search'
            });

            const htmlField = form.addField({
                id: 'custpage_transaction_search_html',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Search Results'
            });

            htmlField.defaultValue = renderedHtml;

            response.writePage(form);

        } catch (error) {
            log.error({
                title: 'Error in sl_transaction_search Suitelet',
                details: error
            });

            // Fallback error presentation using serverWidget
            const errorForm = serverWidget.createForm({
                title: 'Transaction Search - Error'
            });

            errorForm.addField({
                id: 'custpage_err_details',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Error Info'
            }).defaultValue = `
                <div style="background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 20px; border-radius: 8px; margin: 20px;">
                    <h3 style="margin-top:0;">Execution Error</h3>
                    <p><strong>Message:</strong> ${error.message || error}</p>
                    <p><strong>Stack / Details:</strong> <pre>${error.stack || JSON.stringify(error)}</pre></p>
                </div>
            `;

            response.writePage(errorForm);
        }
    };

    return {
        onRequest
    };
});
