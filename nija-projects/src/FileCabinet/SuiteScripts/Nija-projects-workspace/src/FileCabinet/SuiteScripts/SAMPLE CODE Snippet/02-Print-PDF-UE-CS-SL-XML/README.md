# Scenario 2: Dynamic PDF Generation (UE + CS + SL + Advanced XML)

## Overview
A complete enterprise pattern for generating pixel-perfect PDF documents on demand in NetSuite. When a user clicks the **Print** button on any transaction or custom record, a Suitelet renders an Advanced BFO PDF using FreeMarker and dynamic server-side data, then streams it inline directly into a browser tab.

## Complete Architecture
```
+-------------------------------------------------------------+
| 1. User Event Script (ue_print_button.js)                    |
|    - beforeLoad in VIEW mode                                |
|    - Resolves Suitelet URL: customscript_njt_pdf_renderer_sl|
|    - Injects custom button & Client Script hook             |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 2. Client Script (cs_print_button_trigger.js)               |
|    - onPrintPdfClick() validates document status            |
|    - Calls window.open(suiteletUrl, '_blank')               |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 3. Suitelet (sl_pdf_renderer.js)                            |
|    - Reads &recId=... and &recType=... from request         |
|    - record.load() fetches full record hierarchy            |
|    - Loads template_advanced_pdf.xml from File Cabinet      |
|    - renderer.addRecord({ templateName: 'record', ... })    |
|    - renderer.addCustomDataSource({ alias: 'custom', ... }) |
|    - renderer.renderAsPdf() creates PDF                     |
|    - context.response.writeFile({ isInline: true })         |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 4. User's Browser Window                                    |
|    - Native PDF viewer opens with high-resolution document  |
+-------------------------------------------------------------+
```

## NetSuite Deployment Checklist
1. **Upload XML Template:** Upload `template_advanced_pdf.xml` to `File Cabinet > SuiteScripts > Templates` and note its Internal ID.
2. **Deploy Suitelet:** Deploy `sl_pdf_renderer.js` with Status = `Released`, Access = `All Roles` (or specific roles).
3. **Deploy User Event:** Deploy `ue_print_button.js` on target transactions (e.g. Invoice, Sales Order, Custom Record).
4. **Deploy Client Script:** Attach `cs_print_button_trigger.js` either via `form.clientScriptModulePath` in the UE or directly on the custom form.
