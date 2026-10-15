# Documentation for tax invoice sl.js

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/SJS Invoice Template Enhancement/tax invoice sl.js`

**Description:** Suitelet script (v2.x) that generates and outputs the customized Tax Invoice PDF using Advanced PDF/HTML template renderer (`N/render`) and XML template.

**Changes:**

**17/09/2026:**
- **USD Currency Condition Fix**: Fixed currency check from `currencySelection === 'AED'` to `currencySelection === 'USD'` to correctly swap AED text to USD in XML headers.
- **Dynamic Image Removal for No-Logo Print**: Added `hideLogo` parameter handling. When `hideLogo === 'T'`, dynamically strips all `<img ...>` tags from `xmlContent` via regex (`xmlContent.replace(/<img[^>]*>/gi, '')`), removing header logo, footer logo, and stamp image while maintaining layout alignment.
- **Normal Print Preservation**: Ensured standard print requests (`hideLogo: 'F'`) leave image tags intact so logos and stamp render normally.

---

## Technical Overview

- **Script Type:** Suitelet (`@NScriptType Suitelet`)
- **API Version:** SuiteScript 2.0 (`@NApiVersion 2.x`)
- **Modules Used:** `N/render`, `N/record`, `N/file`, `N/search`

---

## Script Flow & Features

### `onRequest(context)`
1. **Parameter Extraction:**
   - `customRecordId`: Transaction record ID to print.
   - `currencyFormat`: Currency format selected (`'AED'` or `'USD'`).
   - `hideLogo`: Flag indicating whether to hide logo/stamp (`'T'` or `'F'`).

2. **Data Fetching:**
   - Loads the Invoice record (`record.load`).
   - Fetches customer default billing address from the customer record (`N/record.load` type `CUSTOMER`, inspects `addressbook` sublist).
   - Searches for related Item Fulfillment transaction ID using `createdfrom` filter to populate `deliveryOrderNo`.

3. **Number to Words Conversion:**
   - Invokes `convertAmountToWords(amount, currencySelection)` helper to calculate spelling of total invoice amount in AED (Fils) or USD (Cents).

4. **XML Template Processing & Rendering:**
   - Loads the XML template from File Cabinet (file ID: `2243`).
   - **Currency Replacement:** If `currencySelection === 'USD'`, replaces occurrences of `'AED'` in XML headers/labels with `'USD'`.
   - **Logo & Stamp Control:** If `hideLogo === 'T'`, strips all `<img ...>` tags from `xmlContent` using regex (`xmlContent.replace(/<img[^>]*>/gi, '')`), removing header logo, footer logo, and stamp image while preserving perfect table layout alignment.
   - Sets template content in `renderer.templateContent`.
   - Binds main record (`renderer.addRecord`).
   - Binds custom data source (`customData`: `totalWords`, `addressInfo`, `deliveryOrderNo`, `hideLogo`).

5. **Output Delivery:**
   - Calls `renderer.renderAsPdf()` to produce the PDF file.
   - Sends the PDF inline to browser (`context.response.writeFile({ isInline: true })`).