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
                // Change record.Type.INVOICE to record.Type.ITEM_FULFILLMENT or Sales Order if necessary
                var rec = record.load({
                    type: "customrecord_njt_packing_list", 
                    id: recordId
                });

                // 3. Load the XML Template file from the File Cabinet
                // IMPORTANT: Replace 'YOUR_XML_FILE_ID' with the actual Internal ID of your packing-list-new.xml file
                var xmlFile = file.load({
                    id: '2415' 
                });
                
                // 4. Initialize the Renderer
                var renderer = render.create();
                renderer.templateContent = xmlFile.getContents();

                // 5. Bind the loaded record to the 'record' object used in the XML template
                renderer.addRecord({
                    templateName: 'record',
                    record: rec
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