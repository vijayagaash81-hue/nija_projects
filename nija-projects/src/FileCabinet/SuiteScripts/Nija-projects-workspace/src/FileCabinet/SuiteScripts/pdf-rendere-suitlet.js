/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/render', 'N/record', 'N/file'], function (render, record, file) {

    function onRequest(context) {

        try {
            // Get record ID dynamically (recommended)
            var recId = context.request.parameters.id;

            //   Load record (example: Invoice)
            var rec = record.load({
                type: record.Type.INVOICE,
                id: recId
            });

            //   Load XML file from File Cabinet
            var xmlFile = file.load({
                id: 12345   // 👉 replace with your XML file ID
            });

            var xmlContent = xmlFile.getContents();

            //  Create renderer
            var renderer = render.create();

            //  Assign XML content
            renderer.templateContent = xmlContent;

            //  Bind record
            renderer.addRecord({
                templateName: 'record',
                record: rec
            });

            // Render PDF
            var pdfFile = renderer.renderAsPdf();

            //  Show PDF
            context.response.writeFile({
                file: pdfFile,
                isInline: true
            });

        } catch (e) {
            context.response.write("Error: " + e.message);
        }
    }

    return {
        onRequest: onRequest
    };
});