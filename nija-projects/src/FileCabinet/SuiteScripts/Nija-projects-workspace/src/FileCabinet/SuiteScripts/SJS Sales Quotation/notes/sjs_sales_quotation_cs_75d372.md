# Documentation for sjs_sales_quotation_cs.js

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/SJS Sales Quotation/sjs_sales_quotation_cs.js`

**Description:** Client Script to trigger PDF generation Suitelet for SJS Sales Quotation.

---

## Log of Changes & Implementation Notes

### 09/09/2026:
- **Initial Creation (`sjs_sales_quotation_cs.js`)**:
  - SuiteScript 2.1 Client Script containing `printSalesQuotation()` function.
  - Gets current record ID and record type (`estimate`).
  - Resolves Suitelet script URL for `customscript_sjs_sales_quotation_sl` / `customdeploy_sjs_sales_quotation_sl`.
  - Opens the PDF renderer Suitelet in a new browser tab (`window.open(suiteletURL, '_blank')`).