# Documentation for sjs_sales_quotation_ue.js

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/SJS Sales Quotation/sjs_sales_quotation_ue.js`

**Description:** Adds custom "Print Sales Quotation" button on Estimate (Sales Quotation) record in View mode.

---

## Log of Changes & Implementation Notes

### 09/09/2026:
- **Initial Creation (`sjs_sales_quotation_ue.js`)**:
  - SuiteScript 2.1 User Event Script attached to `estimate` (Sales Quotation) records.
  - In `beforeLoad`, checks `context.type === context.UserEventType.VIEW`.
  - Sets `form.clientScriptModulePath = 'SuiteScripts/Layouts/sjs_sales_quotation_cs.js'` to bind the Client Script button handler.
  - Adds custom action button **"Print Sales Quotation"** (`custpage_print_sjs_quotation`) calling client function `printSalesQuotation()`.