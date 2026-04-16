/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/file', 'N/render', 'N/record'], function(file, render, record) {

    function onRequest(context) {

        var request = context.request;
        var response = context.response;

        var recId = request.parameters.recId;
        var recType = request.parameters.recType;

        // Load record
        var rec = record.load({
            type: recType,
            id: recId
        });

        // Load XML file (replace with your file ID)
        var xmlFile = file.load({
            id: 'SuiteScripts/template.xml'
        });

        var xmlContent = xmlFile.getContents();

        // Create renderer
        var renderer = render.create();

        renderer.templateContent = xmlContent;

        renderer.addRecord({
            templateName: 'record',
            record: rec
        });

        var pdfFile = renderer.renderAsPdf();

        response.writeFile(pdfFile, true);
    }

    return {
        onRequest: onRequest
    };

}); // ꗈ