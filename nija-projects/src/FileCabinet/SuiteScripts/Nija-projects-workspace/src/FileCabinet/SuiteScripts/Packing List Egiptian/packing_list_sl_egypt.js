/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/render', 'N/record', 'N/file', 'N/log'], function(render, record, file, log) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            try {
                // 1. Get the record ID passed from the client script or URL parameter
                var recordId = context.request.parameters.recId;

                if (!recordId) {
                    context.response.write('Missing record ID parameter (recId).');
                    return;
                }

                // 2. Load the transaction record
                var rec = record.load({
                    type: "customrecord_njt_packing_list", 
                    id: recordId
                });

                // --- Enhancement: Load Customer Data ---
                var customerId = rec.getValue({ fieldId: 'custrecord_njt_packing_list_customer' });
                var customerData = {
                    address: '',
                    tel: '',
                    email: '',
                    fax: ''
                };

                if (customerId) {
                    try {
                        var customerRec = record.load({
                            type: record.Type.CUSTOMER,
                            id: customerId,
                            isDynamic: false
                        });

                        customerData.address = customerRec.getValue({ fieldId: 'billaddr1' }) || '';
                        customerData.tel = customerRec.getValue({ fieldId: 'phone' }) || '';
                        customerData.email = customerRec.getValue({ fieldId: 'email' }) || '';
                        customerData.fax = customerRec.getValue({ fieldId: 'fax' }) || '';
                        log.debug("customerData",customerData);
                    } catch (custErr) {
                        log.error({ title: 'Error loading customer ' + customerId, details: custErr });
                        // Continue without customer data if it fails to load
                    }
                }

                // 3. Load the XML Template file from the File Cabinet
                var xmlFile = file.load({
                    id: '2480' 
                });
                
                // 4. Initialize the Renderer
                var renderer = render.create();
                renderer.templateContent = xmlFile.getContents();

                // 5. Bind data sources to the template
                renderer.addRecord({
                    templateName: 'record',
                    record: rec
                });

                renderer.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: 'customer',
                    data: customerData
                });

                // 6. Generate the PDF file
                var pdfFile = renderer.renderAsPdf();

                // 7. Serve the generated PDF back to the browser inline (opens in current tab/new tab)
                context.response.writeFile({
                    file: pdfFile,
                    isInline: true 
                });
            } catch (e) {
                log.error({ title: 'Error generating Packing List PDF', details: e });
                context.response.write('An error occurred while generating the PDF: ' + e.message);
            }
        }
    }

    return {
        onRequest: onRequest
    };
});