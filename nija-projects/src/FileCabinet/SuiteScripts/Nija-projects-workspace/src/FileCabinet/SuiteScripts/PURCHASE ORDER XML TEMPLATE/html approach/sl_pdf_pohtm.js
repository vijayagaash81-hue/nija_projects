/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/file', 'N/record'], function(file, record) {

    function onRequest(context) {

        var recId = context.request.parameters.id;

        var rec = record.load({
            type: record.Type.PURCHASE_ORDER,
            id: recId
        });

        // Load HTML template
        var htmlFile = file.load({
            id: 'SuiteScripts/po_template.html' // change path
        });

        var html = htmlFile.getContents();

        // Replace values
        html = html.replace('{{tranid}}', rec.getValue('tranid'));
        html = html.replace('{{rfq}}', rec.getValue('otherrefnum'));
        html = html.replace('{{delivery}}', rec.getValue('shipaddress'));
        html = html.replace('{{date}}', rec.getValue('trandate'));
        html = html.replace('{{duedate}}', rec.getValue('duedate'));
        html = html.replace('{{terms}}', rec.getText('terms'));
        html = html.replace('{{deliveryterms}}', rec.getText('shipmethod'));

        html = html.replace('{{orderby}}', rec.getText('entity'));
        html = html.replace('{{orderto}}', rec.getText('entity'));

        html = html.replace('{{amount}}', rec.getValue('subtotal'));
        html = html.replace('{{tax}}', rec.getValue('taxtotal'));
        html = html.replace('{{total}}', rec.getValue('total'));
        html = html.replace('{{words}}', rec.getValue('totalwords'));

        // Items
        var itemHtml = '';
        var lineCount = rec.getLineCount({ sublistId: 'item' });

        for (var i = 0; i < lineCount; i++) {
            itemHtml += '<tr>' +
                '<td>' + rec.getSublistText({ sublistId: 'item', fieldId: 'item', line: i }) + '</td>' +
                '<td>' + rec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i }) + '</td>' +
                '<td>' + rec.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i }) + '</td>' +
                '<td>' + rec.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i }) + '</td>' +
                '</tr>';
        }

        html = html.replace('{{items}}', itemHtml);

        context.response.write(html);
    }

    return {
        onRequest: onRequest
    };

});