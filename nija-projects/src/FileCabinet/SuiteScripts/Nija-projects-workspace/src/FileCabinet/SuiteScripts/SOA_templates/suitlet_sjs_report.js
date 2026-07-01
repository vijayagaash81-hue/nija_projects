/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/ui/serverWidget', 'N/render', 'N/file'], 
function(serverWidget, render, file) {

    function onRequest(context) {

        var request = context.request;

        // =========================
        // PRINT PDF
        // =========================
        if (request.parameters.action === 'print') {

            var subsidiary = request.parameters.subsidiary;

            // ==========================================
            // CHANGE THESE FILE IDS
            // ==========================================
            var xmlFileId = '';

            if (subsidiary == '1') {

                // SJS ENERSOL XML FILE ID
                xmlFileId = 2615;

            } else {

                // SJS ENGG XML FILE ID
                xmlFileId = 2616;
            }

            // Load XML File
            var xmlContent = file.load({
                id: xmlFileId
            }).getContents();

            // Render PDF
            var renderer = render.create();

            renderer.templateContent = xmlContent;

            var pdfFile = renderer.renderAsPdf();

            context.response.writeFile({
                file: pdfFile,
                isInline: true
            });

            return;
        }

        // =========================
        // FORM
        // =========================

        var form = serverWidget.createForm({
            title: 'Statement Of Account'
        });

        // Subsidiary Field
        var subsidiaryFld = form.addField({
            id: 'custpage_subsidiary',
            type: serverWidget.FieldType.SELECT,
            label: 'Subsidiary'
        });

        subsidiaryFld.addSelectOption({
            value: '',
            text: '-Select-'
        });

        subsidiaryFld.addSelectOption({
            value: '1',
            text: 'SJS ENERSOL'
        });

        subsidiaryFld.addSelectOption({
            value: '2',
            text: 'SJS ENGG'
        });

        // Print Button
        form.addButton({
            id: 'custpage_print',
            label: 'Print PDF',
            functionName: 'printPdf'
        });

        // Inline Client Script
        var htmlFld = form.addField({
            id: 'custpage_html',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'HTML'
        });

        htmlFld.defaultValue = `
            <script>

                function printPdf(){

                    var subsidiary = nlapiGetFieldValue('custpage_subsidiary');

                    if(!subsidiary){

                        alert('Please select subsidiary');
                        return;
                    }

                    var url = window.location.href;

                    url += '&action=print';
                    url += '&subsidiary=' + subsidiary;

                    window.open(url, '_blank');
                }

            </script>
        `;

        context.response.writePage(form);
    }

    return {
        onRequest: onRequest
    };

});