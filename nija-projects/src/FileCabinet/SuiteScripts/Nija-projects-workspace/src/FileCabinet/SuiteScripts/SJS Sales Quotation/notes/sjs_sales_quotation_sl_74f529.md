# Documentation for sjs_sales_quotation_sl.js

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/SJS Sales Quotation/sjs_sales_quotation_sl.js`

**Description:** Suitelet to generate and render SJS Sales Quotation PDF document.

---

## Log of Changes & Implementation Notes

### 09/09/2026:
- **Suitelet PDF Renderer Creation (`sjs_sales_quotation_sl.js`)**:
  - Loads target `estimate` (Sales Quotation) record via parameter `customRecordId`.
  - Implemented `convertAmountToWords()` function to convert grand totals into English words (handling AED Fils / USD Cents).
  - Calculated `netAmount` (`subtotal - Math.abs(discounttotal)`).
  - Formatted billing address details (`addressInfo`) from the `billingaddress` subrecord / `billaddress` field to exclude duplicate customer company names.
  - Bound record data and custom data source (`totalWords`, `netAmount`, `discountTotal`, `addressInfo`) to the Freemarker renderer engine.

- **XML PDF Template Design (`sjs_sales_quotation.xml`)**:
  - **Header & Footer**: Reused SJS Enersol logo (`id=2609` / `id=2619`) and footer contact banner (`id=2610`) from the Tax Proforma Invoice template.
  - **Header Details**: Displays Customer Details, TRN #, Tel, Atten on the left; DATE, Quotation No, CURRENCY, Validity of Quotation, PAYMENT TERMS, Sales Person on the right.
  - **Item Table (8 Columns)**: Configured 8 columns matching the design layout: `S.NO`, `DESCRIPTION`, `UOM`, `QTY`, `RATE`, `TOTAL`, `5% VAT`, `NET TOTAL`.
  - **Pagination & Height Tuning**: Set chunk size to 5 items per page (`chunk(5)`) with max 5 filler rows to keep the summary section cleanly on Page 1 without header collision.
  - **Numeric Formatting Fix (`safeFormat`)**:
    - Fixed Freemarker `safeFormat` helper to check `val?is_number` before string conversion.
    - Resolved issue where `rate`, `amount`, `tax1amt`, `grossamt`, `subtotal`, `taxtotal`, and `total` were rendering blank due to type conversion errors.
    - Added fallbacks for line tax and gross amounts.
  - **Duplicate Customer Name Removal**:
    - Updated Customer Details section to ensure the bold customer name is not duplicated on line 1 of the address block.