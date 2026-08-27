/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define([
    "N/render",
    "N/log",
    "N/record",
    "N/file",
    "N/ui/serverWidget"
], function (render, log, record, file, serverWidget) {

    function onRequest(context) {
        if (context.request.method === "GET") {

            // 1. Retrieve parameters from the Client Script URL
            var recId = context.request.parameters.recId;
            var layout = context.request.parameters.layout; // 'A4' or 'A5'
            var showLogo = context.request.parameters.showLogo; // 'T' or 'F'
            var debug = context.request.parameters.debug; // 'T' or 'F'

            log.debug("Params Received", "ID: " + recId + " | Layout: " + layout + " | Logo: " + showLogo + " | Debug: " + debug);

            if (recId) {
                try {
                    // 2. Load the Item Fulfillment Record
                    var fulfillmentRecord = record.load({
                        type: record.Type.ITEM_FULFILLMENT,
                        id: recId,
                        isDynamic: false,
                    });

                    // Build filtered items list (amount > 0 and item is received/fulfilled)
                    var filteredItemsList = [];
                    var lineCount = fulfillmentRecord.getLineCount({ sublistId: "item" });
                    log.debug("Total Line Count", lineCount);
                    for (var i = 0; i < lineCount; i++) {
                        var isReceived = fulfillmentRecord.getSublistValue({
                            sublistId: "item",
                            fieldId: "itemreceive",
                            line: i
                        });
                        var amountVal = fulfillmentRecord.getSublistValue({
                            sublistId: "item",
                            fieldId: "itemfxamount",
                            line: i
                        });
                        var qtyVal = fulfillmentRecord.getSublistValue({
                            sublistId: "item",
                            fieldId: "quantity",
                            line: i
                        });

                        log.debug("Line " + i, "Amount: " + amountVal + " | Quantity: " + qtyVal + " | Received: " + isReceived);

                        var hasAmount = false;
                        if (amountVal !== null && amountVal !== undefined && amountVal !== "") {
                            var parsedAmount = parseFloat(amountVal);
                            if (!isNaN(parsedAmount) && parsedAmount > 0) {
                                hasAmount = true;
                            }
                        }
                        var isLineFulfilled = (isReceived === true || isReceived === "T");

                        if (isLineFulfilled && hasAmount) {
                            filteredItemsList.push({
                                custcol_njt_podesc: fulfillmentRecord.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "custcol_njt_podesc",
                                    line: i
                                }) || "",
                                unitsdisplay: fulfillmentRecord.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "unitsdisplay",
                                    line: i
                                }) || "",
                                qty: formatNumber(qtyVal)
                            });
                        }
                    }
                    if (filteredItemsList.length === 0) {
                        filteredItemsList.push({
                            custcol_njt_podesc: "",
                            unitsdisplay: "",
                            qty: ""
                        });
                    }
                    log.debug("Filtered Line Count", filteredItemsList.length);

                    if (debug === "T") {
                        context.response.setHeader({
                            name: "Content-Type",
                            value: "application/json"
                        });
                        context.response.write(JSON.stringify({
                            lineCount: lineCount,
                            filteredItemsList: filteredItemsList,
                            rawLines: (function () {
                                var lines = [];
                                for (var idx = 0; idx < lineCount; idx++) {
                                    lines.push({
                                        index: idx,
                                        isReceived: fulfillmentRecord.getSublistValue({ sublistId: "item", fieldId: "itemreceive", line: idx }),
                                        amountVal: fulfillmentRecord.getSublistValue({ sublistId: "item", fieldId: "itemfxamount", line: idx }),
                                        qtyVal: fulfillmentRecord.getSublistValue({ sublistId: "item", fieldId: "quantity", line: idx }),
                                        qtyRemaining: fulfillmentRecord.getSublistValue({ sublistId: "item", fieldId: "quantityremaining", line: idx }),
                                        description: fulfillmentRecord.getSublistValue({ sublistId: "item", fieldId: "custcol_njt_podesc", line: idx })
                                    });
                                }
                                return lines;
                            })()
                        }));
                        return;
                    }

                    var customer = fulfillmentRecord.getValue({
                        fieldId: 'entity'
                    });
                    var customerRecord = record.load({
                        type: record.Type.CUSTOMER,
                        id: customer,
                        isDynamic: true,
                    });
                    var companyName = customerRecord.getValue({
                        fieldId: 'companyname'
                    });
                    // var createdfrom = fulfillmentRecord.getValue({
                    //   fieldId:'createdfrom'
                    // });
                    // var salesOrder= record.load({
                    //    type: record.Type.SALES_ORDER,
                    //    id: createdfrom
                    // });
                    // var doNum = salesOrder.getValue({
                    //   fieldId:'tranid'
                    // });
                    // var otherrefnum = salesOrder.getValue({
                    //   fieldId:'otherrefnum'
                    // });
                    // 3. Determine the XML file path based on layout
                    // Make sure these paths match exactly where you uploaded the XML files
                    var xmlFilePath = "";
                    if (layout === "A4") {
                        xmlFilePath = "SuiteScripts/Layouts/do a4 with logo format xml.xml";
                    } else {
                        xmlFilePath = "SuiteScripts/Layouts/Do a5 without logo format xml.xml";
                    }

                    // 4. Get the XML content using the helper function
                    var xmlContent = getTemplateContent(xmlFilePath);

                    // 5. Create the renderer
                    var renderer = render.create();
                    renderer.templateContent = xmlContent;

                    // 6. Add the record data to the template
                    renderer.addRecord({
                        templateName: "record",
                        record: fulfillmentRecord,
                    });

                    // Add the filtered items as a custom data source
                    renderer.addCustomDataSource({
                        format: render.DataSource.OBJECT,
                        alias: "filteredItems",
                        data: {
                            list: filteredItemsList
                        }
                    });

                    // 7. Add the custom parameter for the Logo logic
                    // In your XML, use: <#if customparams.showLogo == 'T'> ... </#if>
                    renderer.addCustomDataSource({
                        format: render.DataSource.OBJECT,
                        alias: "customparams",
                        data: {
                            showLogo: showLogo,
                            compName: companyName
                        }
                    });

                    // 8. Render the PDF
                    var pdfContent = renderer.renderAsPdf();

                    // 9. Output the PDF to the browser
                    context.response.writeFile({
                        file: pdfContent,
                        isInline: true, // Opens in browser instead of downloading
                    });

                } catch (e) {
                    log.error("Execution Error", e.message);
                    context.response.write("Error generating PDF: " + e.message);
                }
            } else {
                context.response.write("Missing Record ID parameter.");
            }
        }
    }

    /**
     * Helper Function to load file content from File Cabinet
     * @param {string} filePath - Path in the File Cabinet
     * @returns {string} - Raw XML string
     */
    function getTemplateContent(filePath) {
        var templateFile = file.load({
            id: filePath,
        });
        return templateFile.getContents();
    }

    /**
     * Helper Function to format number as a string with 2 decimal places and thousands separator
     * @param {number|string} num
     * @returns {string}
     */
    function formatNumber(num) {
        var val = parseFloat(num);
        if (isNaN(val)) return "0.00";
        var parts = val.toFixed(2).split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    }

    return {
        onRequest: onRequest,
    };
});