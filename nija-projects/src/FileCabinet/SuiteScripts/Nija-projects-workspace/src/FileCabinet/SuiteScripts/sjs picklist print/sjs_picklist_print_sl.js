/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * 
 * Script Name: sjs_picklist_print_sl.js
 * Description: Suitelet script to generate and render the SJS Pick List PDF document.
 */
define(['N/render', 'N/record', 'N/file', 'N/search', 'N/log'], (render, record, file, search, log) => {

    /**
     * Suitelet Entry Point
     * @param {Object} context 
     */
    const onRequest = (context) => {
        try {
            const request = context.request;
            const response = context.response;

            // 1. Obtain parameters passed from Client Script / UE Script
            const recordId = request.parameters.customRecordId || request.parameters.recordId;
            const recordType = request.parameters.recordType || record.Type.WORK_ORDER;

            if (!recordId) {
                response.write('Error: Missing required customRecordId or recordId parameter.');
                return;
            }

            log.debug('sjs_picklist_print_sl', `Loading record type: ${recordType}, ID: ${recordId}`);

            // 2. Load the target record (Work Order / Pick List / Item Fulfillment / Sales Order)
            const targetRecord = record.load({
                type: recordType,
                id: recordId
            });

            // 3. Locate XML Template file from File Cabinet
            let xmlFile;
            const candidatePaths = [
                'SuiteScripts/sjs picklist print/sjs_picklist_print.xml',
                'SuiteScripts/Layouts/sjs_picklist_print.xml',
                'sjs_picklist_print.xml'
            ];

            for (const path of candidatePaths) {
                try {
                    xmlFile = file.load({ id: path });
                    if (xmlFile) break;
                } catch (e) {
                    log.debug('file.load path attempt failed', `Path: ${path}, Message: ${e.message}`);
                }
            }

            // Fallback file search if file.load by path fails
            if (!xmlFile) {
                try {
                    const fileSearch = search.create({
                        type: 'file',
                        filters: [['name', 'is', 'sjs_picklist_print.xml']],
                        columns: ['internalid']
                    }).run().getRange({ start: 0, end: 1 });

                    if (fileSearch && fileSearch.length > 0) {
                        xmlFile = file.load({ id: fileSearch[0].id });
                    }
                } catch (e) {
                    log.error('File search fallback failed', e);
                }
            }

            if (!xmlFile) {
                throw new Error('Could not locate sjs_picklist_print.xml in the File Cabinet.');
            }

            const xmlContent = xmlFile.getContents();

            // 4. Create Renderer and bind record data
            const renderer = render.create();
            renderer.templateContent = xmlContent;

            renderer.addRecord({
                templateName: 'record',
                record: targetRecord
            });

            // 5. Render PDF
            const pdfFile = renderer.renderAsPdf();

            // 6. Write PDF to response for inline browser view
            response.writeFile({
                file: pdfFile,
                isInline: true
            });

        } catch (e) {
            log.error('Error in sjs_picklist_print_sl.js onRequest', e);
            context.response.write(`Error generating Pick List PDF: ${e.message}`);
        }
    };

    return {
        onRequest: onRequest
    };
});
