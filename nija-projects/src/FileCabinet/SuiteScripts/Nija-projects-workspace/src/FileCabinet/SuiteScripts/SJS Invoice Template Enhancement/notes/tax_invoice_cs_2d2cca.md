# Documentation for tax invoice cs.js

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/SJS Invoice Template Enhancement/tax invoice cs.js`

**Description:** Client Script (v2.x) triggered when the user clicks the "Print" button on the Invoice record. Displays an interactive dialog popup allowing the user to select printing options (standard print by currency, print without logo, or close).

**Changes:**

**17/09/2026:**
- **Close Button Addition**: Added a `Close` button option to the popup dialog to allow users to dismiss the dialog without generating a PDF.
- **Tax Invoice Without Logo Enhancement**: Added `Tax Invoice without logo` button option (`value: 'NOLOGO'`) to the popup dialog options.
- **Suitelet Parameter Passing**: Updated `url.resolveScript` to pass `hideLogo: 'T'` when `Tax Invoice without logo` is selected, and `hideLogo: 'F'` for standard print.

---

## Technical Overview

- **Script Type:** Client Script (`@NScriptType ClientScript`)
- **API Version:** SuiteScript 2.0 (`@NApiVersion 2.x`)
- **Modules Used:** `N/ui/dialog`, `N/currentRecord`, `N/url`, `N/record`

---

## Functions & Entry Points

### `pageInit(context)`
- Standard client script entry point required by NetSuite (no initial page load logic needed for this feature).

### `printSelectedTemplate()`
- **Trigger:** Called by the custom `🖶 Print` button created by the User Event script.
- **Execution Steps:**
  1. Retrieves the active record ID and type using `N/currentRecord`.
  2. Loads the invoice record via `N/record` to accurately read field values (such as `currency`).
  3. Detects the currency text (e.g., `'AED'`, `'USD'`).
  4. Dynamically builds the dialog options:
     - **Standard Format Button:** e.g., `Tax Invoice (AED)` or `Tax Invoice (USD)` (`value: 'AED'` / `'USD'`)
     - **No-Logo Format Button:** `Tax Invoice without logo` (`value: 'NOLOGO'`)
     - **Close Button:** `Close` (`value: 'CLOSE'`)
  5. Opens popup dialog box using `dialog.create(options)`.
  6. On user response:
     - If `Close` is clicked: Dismisses popup without action.
     - If format option is selected: Resolves Suitelet URL (`customscript_hris_taxinvoice_sl_print` / `customdeploy_hris_taxinvoice_sl_print`) with parameters:
       - `customRecordId`: Invoice Record ID
       - `currencyFormat`: Detected currency (`AED`/`USD`)
       - `hideLogo`: `'T'` if `Tax Invoice without logo` clicked, else `'F'`
     - Opens the Suitelet PDF URL in a new browser tab (`window.open(suiteletURL, '_blank')`).