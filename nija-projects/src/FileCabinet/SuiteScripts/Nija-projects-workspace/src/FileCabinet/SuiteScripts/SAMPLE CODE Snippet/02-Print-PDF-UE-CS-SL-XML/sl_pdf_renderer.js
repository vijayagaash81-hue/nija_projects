/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * 
 * Scenario: Printing PDF from Button using UE, CS, SL, and XML
 * Component: Suitelet Script
 * Purpose: Receives record ID and type from URL parameters, loads record & template,
 *          binds data to FreeMarker renderer, generates PDF via N/render, and streams inline.
 */
define(['N/render', 'N/record', 'N/file', 'N/config', 'N/log', 'N/format'], 
(render, record, file, config, log, format) => {

    // =========================================================================
    // CONFIGURATION CONSTANTS
    // =========================================================================
    // Set your XML Template File Cabinet ID or use inline fallback
    const XML_TEMPLATE_FILE_ID = null; // Set to number (e.g. 24312) when stored in File Cabinet
    const DEFAULT_RECORD_TYPE = 'customrecord_disciplinary_memo'; // Or 'salesorder', 'purchaseorder', etc.

    /**
     * Suitelet Request Handler
     * @param {Object} context
     * @param {ServerRequest} context.request
     * @param {ServerResponse} context.response
     */
    const onRequest = (context) => {
        if (context.request.method !== 'GET') {
            context.response.write('Only GET method is supported.');
            return;
        }

        try {
            const params = context.request.parameters;
            const recordId = params.recId || params.id;
            const recordType = params.recType || DEFAULT_RECORD_TYPE;

            log.audit({
                title: 'PDF Generation Requested',
                details: `Record ID: ${recordId}, Record Type: ${recordType}`
            });

            if (!recordId) {
                context.response.write('Missing required parameter: "recId". Example: ?recId=123&recType=salesorder');
                return;
            }

            // 1. Load the target NetSuite record
            const rec = record.load({
                type: recordType,
                id: recordId,
                isDynamic: false
            });

            // 2. Fetch company information for header logo and tax registration
            const companyInfo = config.load({
                type: config.Type.COMPANY_INFORMATION
            });

            // 3. Prepare Custom Data Source for FreeMarker
            // This is ideal for computed metrics (Total in words, formatted dates, summary totals)
            const customData = {
                printDate: format.format({
                    value: new Date(),
                    type: format.Type.DATE
                }),
                printTime: format.format({
                    value: new Date(),
                    type: format.Type.TIMEOFDAY
                }),
                companyName: companyInfo.getValue({ fieldId: 'companyname' }) || 'NIJA ENTERPRISES LLC',
                companyTaxId: companyInfo.getValue({ fieldId: 'employerid' }) || 'TRN: 100234829300003',
                companyAddress: companyInfo.getValue({ fieldId: 'address1' }) || 'Business Bay, Dubai, UAE',
                preparedBy: 'ERP Automated System'
            };

            // 4. Load XML Template Content
            let xmlContent = '';
            if (XML_TEMPLATE_FILE_ID) {
                // Method A: Load from File Cabinet
                const xmlFile = file.load({ id: XML_TEMPLATE_FILE_ID });
                xmlContent = xmlFile.getContents();
            } else {
                // Method B: Embedded / Fallback BFO XML Template
                xmlContent = getEmbeddedXmlTemplate();
            }

            // 5. Initialize the Template Renderer
            const renderer = render.create();
            renderer.templateContent = xmlContent;

            // 6. Bind Primary Record
            // Exposes the record as 'record' in FreeMarker (e.g. ${record.tranid}, ${record.item})
            renderer.addRecord({
                templateName: 'record',
                record: rec
            });

            // 7. Bind Custom Data Object
            // Exposes custom fields as 'custom' in FreeMarker (e.g. ${custom.companyName})
            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: 'custom',
                data: customData
            });

            // 8. Render XML into PDF File
            const pdfFile = renderer.renderAsPdf();
            pdfFile.name = `${recordType}_${recordId}_Document.pdf`;

            // 9. Stream PDF directly to browser (inline opens in browser viewer)
            context.response.writeFile({
                file: pdfFile,
                isInline: true
            });

        } catch (e) {
            log.error({
                title: 'PDF Render Failed',
                details: e
            });

            context.response.setHeader({
                name: 'Content-Type',
                value: 'text/html; charset=utf-8'
            });

            context.response.write(`
                <div style="font-family: Arial, sans-serif; padding: 30px; color: #721c24; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px;">
                    <h2>PDF Generation Error</h2>
                    <p>An error occurred while compiling the PDF document.</p>
                    <pre style="background: #fff; padding: 15px; border-radius: 4px; overflow: auto;">${e.message || JSON.stringify(e)}</pre>
                </div>
            `);
        }
    };

    /**
     * Fallback BFO XML Template with standard professional layout
     * @returns {string} XML string
     */
    function getEmbeddedXmlTemplate() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
    <head>
        <style type="text/css">
            * { font-family: Helvetica, Arial, sans-serif; font-size: 9pt; }
            body { padding: 0; margin: 0; color: #2d3748; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .header-table td { vertical-align: top; }
            .company-title { font-size: 15pt; font-weight: bold; color: #1a365d; }
            .doc-title { font-size: 14pt; font-weight: bold; color: #2b6cb0; text-align: right; }
            .section-title { font-size: 10pt; font-weight: bold; background-color: #edf2f7; padding: 5px; margin-top: 15px; border-left: 3px solid #3182ce; }
            .item-table th { background-color: #2b6cb0; color: #ffffff; font-weight: bold; padding: 6px; text-align: left; }
            .item-table td { padding: 6px; border-bottom: 0.5px solid #e2e8f0; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .total-row td { font-weight: bold; background-color: #f7fafc; border-top: 1px solid #cbd5e0; }
            .footer-text { font-size: 8pt; color: #718096; text-align: center; }
        </style>
        <macrolist>
            <macro id="pageHeader">
                <table class="header-table">
                    <tr>
                        <td width="60%">
                            <div class="company-title">\${custom.companyName}</div>
                            <div>\${custom.companyAddress}</div>
                            <div>\${custom.companyTaxId}</div>
                        </td>
                        <td width="40%" class="text-right">
                            <div class="doc-title">OFFICIAL DOCUMENT</div>
                            <div><b>Document #:</b> \${record.tranid!record.name!"DOC-N/A"}</div>
                            <div><b>Date:</b> \${custom.printDate}</div>
                        </td>
                    </tr>
                </table>
            </macro>
            <macro id="pageFooter">
                <table width="100%">
                    <tr>
                        <td class="footer-text" width="50%" align="left">Printed on \${custom.printDate} at \${custom.printTime}</td>
                        <td class="footer-text" width="50%" align="right">Page <pagenumber/> of <totalpages/></td>
                    </tr>
                </table>
            </macro>
        </macrolist>
    </head>
    <body header="pageHeader" header-height="85pt" footer="pageFooter" footer-height="25pt">
        <div class="section-title">DOCUMENT DETAILS</div>
        <table>
            <tr>
                <td width="20%"><b>Entity / Partner:</b></td>
                <td width="30%">\${record.entity!record.custrecord_employee_name!"N/A"}</td>
                <td width="20%"><b>Status:</b></td>
                <td width="30%">\${record.status!record.custrecord_status!"Active"}</td>
            </tr>
            <tr>
                <td><b>Subsidiary:</b></td>
                <td>\${record.subsidiary!"N/A"}</td>
                <td><b>Department:</b></td>
                <td>\${record.department!"General"}</td>
            </tr>
            <#if record.memo?has_content>
            <tr>
                <td><b>Remarks / Memo:</b></td>
                <td colspan="3">\${record.memo}</td>
            </tr>
            </#if>
        </table>

        <div class="section-title">LINE ITEMS &amp; PARTICULARS</div>
        <table class="item-table">
            <thead>
                <tr>
                    <th width="8%" class="text-center">#</th>
                    <th width="42%">Item / Description</th>
                    <th width="15%" class="text-center">Quantity</th>
                    <th width="15%" class="text-right">Rate</th>
                    <th width="20%" class="text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                <#if record.item?has_content>
                    <#list record.item as line>
                    <tr>
                        <td class="text-center">\${line_index + 1}</td>
                        <td>\${line.item!line.description!"Item"}</td>
                        <td class="text-center">\${line.quantity!1}</td>
                        <td class="text-right">\${line.rate!"0.00"}</td>
                        <td class="text-right">\${line.amount!"0.00"}</td>
                    </tr>
                    </#list>
                <#else>
                    <tr>
                        <td class="text-center">1</td>
                        <td>General Transaction Summary Line</td>
                        <td class="text-center">1</td>
                        <td class="text-right">--</td>
                        <td class="text-right">--</td>
                    </tr>
                </#if>
            </tbody>
        </table>

        <table style="margin-top: 40px;">
            <tr>
                <td width="33%" class="text-center">
                    _________________________<br/>
                    <b>Prepared By</b><br/>
                    \${custom.preparedBy}
                </td>
                <td width="33%" class="text-center">
                    _________________________<br/>
                    <b>Verified By</b><br/>
                    Finance Dept
                </td>
                <td width="34%" class="text-center">
                    _________________________<br/>
                    <b>Authorized Signature</b><br/>
                    Management
                </td>
            </tr>
        </table>
    </body>
</pdf>`;
    }

    return { onRequest };
});
