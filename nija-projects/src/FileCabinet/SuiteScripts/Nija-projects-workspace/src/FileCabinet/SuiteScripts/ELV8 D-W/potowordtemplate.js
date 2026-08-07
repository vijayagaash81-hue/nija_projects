/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/record', 'N/file', 'N/render', 'N/log'],
    (serverWidget, record, file, render, log) => {

        const onRequest = (context) => {
            const request = context.request;
            const response = context.response;

            try {
                // Helper function to handle record rendering and downloading
                const generateAndSendDoc = (poId) => {
                    // 1. Load the Purchase Order Record
                    const poRecord = record.load({
                        type: record.Type.PURCHASE_ORDER,
                        id: poId
                    });

                    // Retrieve PO Number/Transaction ID for the filename
                    const tranId = poRecord.getValue({ fieldId: 'tranid' }) || poId;

                    // 2. Load the HTML Template from the File Cabinet
                    // Relative to the NetSuite File Cabinet root: SuiteScripts/ELV8 D-W/powordtemplate.html
                    const templateFile = file.load({
                        id: 'SuiteScripts/ELV8 D-W/powordtemplate.html'
                    });

                    // 3. Initialize the Render module and bind data
                    const renderer = render.create();
                    renderer.templateContent = templateFile.getContents();
                    renderer.addRecord({
                        templateName: 'record',
                        record: poRecord
                    });

                    // 4. Render the template as HTML string with merged data
                    const renderedHtml = renderer.renderAsString();

                    // 5. Configure response headers to serve as MS Word attachment
                    response.setHeader({
                        name: 'Content-Type',
                        value: 'application/msword; charset=UTF-8'
                    });
                    response.setHeader({
                        name: 'Content-Disposition',
                        value: `attachment; filename="Purchase_Order_${tranId}.doc"`
                    });

                    // Write content to browser response
                    response.write(renderedHtml);
                };

                if (request.method === 'GET') {
                    const poId = request.parameters.id || request.parameters.po_id;

                    if (poId) {
                        // Render download directly if ID is passed via URL query
                        generateAndSendDoc(poId);
                    } else {
                        // No ID provided - Render a simple Form to request a Purchase Order ID
                        const form = serverWidget.createForm({ title: 'Print Purchase Order as Word' });
                        
                        form.addField({
                            id: 'custpage_po_id',
                            type: serverWidget.FieldType.TEXT,
                            label: 'Enter Purchase Order ID (Internal ID)'
                        });

                        form.addSubmitButton({
                            label: 'Download Word Document'
                        });

                        response.writePage(form);
                    }
                } else {
                    // POST Request: Process and download directly from the form submission
                    const poId = request.parameters.custpage_po_id;
                    if (poId) {
                        generateAndSendDoc(poId);
                    } else {
                        response.write('Please provide a valid Purchase Order Internal ID.');
                    }
                }
            } catch (err) {
                log.error('onRequest Error', err);
                response.write(`
                    <div style="font-family: Arial, sans-serif; padding: 30px; border: 1px solid #ffcccc; background-color: #fff5f5; border-radius: 5px;">
                        <h2 style="color: #d9534f; margin-top: 0;">Suitelet Execution Error</h2>
                        <p><b>Error Code:</b> ${err.name}</p>
                        <p><b>Error Message:</b> ${err.message}</p>
                        <p><b>Stack Trace:</b></p>
                        <pre style="background-color: #f9f9f9; padding: 15px; border: 1px solid #ddd; border-radius: 3px; overflow-x: auto;">${err.stack}</pre>
                    </div>
                `);
            }
        };

        return { onRequest };
    });
