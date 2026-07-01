/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/render', 'N/record', 'N/file', 'N/log'], (render, record, file, log) => {

    // =========================================================================
    // CONFIGURATION
    // =========================================================================
    // Replace with your actual XML file ID in NetSuite File Cabinet
    const DEFAULT_XML_FILE_ID = 24312;

    // Replace with your actual Custom Record Type ID
    const DEFAULT_RECORD_TYPE = 'customrecord_disciplinary_memo';

    const onRequest = (context) => {

        if (context.request.method === 'GET') {

            try {
                // 1. Get the dynamic record ID from URL parameters
                const recordId = context.request.parameters.id;

                // Allow dynamic override of record type and XML File ID via URL parameters for maximum flexibility
                const recordType = context.request.parameters.rectype || DEFAULT_RECORD_TYPE;
                const xmlFileId = context.request.parameters.xmlid || DEFAULT_XML_FILE_ID;

                if (!recordId) {
                    context.response.write('Error: Missing required parameter "id". Usage: ?id=<RECORD_ID>');
                    return;
                }

                log.debug({
                    title: 'Loading Record',
                    details: `Type: ${recordType}, ID: ${recordId}, XML File ID: ${xmlFileId}`
                });

                // 2. Load the custom record from NetSuite database
                const rec = record.load({
                    type: recordType,
                    id: recordId
                });

                // Calculate the overstay delay days dynamically on the server side
                let delayDays = 0;
                try {
                    const rejoinDate = rec.getValue('custrecord_dm_rejoin_date');
                    const leaveEndDate = rec.getValue('custrecord_dm_to_date');
                    if (rejoinDate instanceof Date && leaveEndDate instanceof Date) {
                        const diffTime = rejoinDate.getTime() - leaveEndDate.getTime();
                        if (diffTime > 0) {
                            delayDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        }
                    }
                } catch (calcError) {
                    log.error({
                        title: 'Error calculating delay days',
                        details: calcError
                    });
                }

                log.debug({
                    title: 'Calculated Delay Days',
                    details: `Delay: ${delayDays} days`
                });

                // 3. Load the XML template file from the File Cabinet by ID (Dynamic XML)
                const xmlFile = file.load({
                    id: xmlFileId
                });
                const xmlContent = xmlFile.getContents();

                // 4. Initialize render engine and template content
                const renderer = render.create();
                renderer.templateContent = xmlContent;

                // 5. Bind the loaded record to the renderer (makes "record" variable available in FreeMarker)
                renderer.addRecord({
                    templateName: 'record',
                    record: rec
                });

                // 6. Pass calculated delay days as a custom object datasource to FreeMarker using the correct API method
                renderer.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: 'customData',
                    data: {
                        delayDays: delayDays.toString()
                    }
                });

                // 7. Generate PDF file
                const pdfFile = renderer.renderAsPdf();

                // 8. Stream the generated PDF dynamically as browser response
                context.response.writeFile({
                    file: pdfFile,
                    isInline: true
                });

            } catch (e) {

                log.error({
                    title: 'PDF GENERATION ERROR',
                    details: e
                });

                context.response.write(
                    'Error generating PDF. Details: ' + (e.message || JSON.stringify(e))
                );
            }
        }
    };

    return {
        onRequest
    };

});