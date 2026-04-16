/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/file', 'N/render', 'N/record'], function (file, render, record) {

    function onRequest(context) {

        try {
            if (context.request.method === 'GET') {

                // 1. Load XML file from File Cabinet
                var xmlFile = file.load({
                    id: 'SuiteScripts/Layouts/nts_sjs_report.xml' // <-- CHANGE PATH
                });

                var xmlContent = xmlFile.getContents();

                // 2. Create renderer
                var renderer = render.create();

                // 3. Assign XML template
                renderer.templateContent = xmlContent;

                // 4. Attach record data
                // Get the recordId passed from the Client Script
                var recordId = context.request.parameters.recordId;
                
                var rec = record.load({
                    type: 'customrecord_njt_non_conformance', // <-- UPDATE THIS to your actual custom record Internal ID
                    id: recordId
                });

                renderer.addRecord({
                    templateName: 'record', // 'values' can conflict with Freemarker keywords. 'record' is safer.
                    record: rec
                });
                

                // 5. Render PDF
                var pdfFile = renderer.renderAsPdf();

                // 6. Send response
                context.response.writeFile({
                    file: pdfFile,
                    isInline: true
                });

            }

        } catch (e) {
            log.error('Error', e);
            context.response.write('Error: ' + e.message);
        }
    }

    return {
        onRequest: onRequest
    };
});