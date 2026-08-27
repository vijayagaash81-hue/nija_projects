# Documentation for tax invoice aed xml.xml

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/Notes/Tax Invoice [PDF]/tax invoice aed xml.xml`

**Description:** This xml template will act as the pdf template for the tax invoice from the invoice record.

**Changes:**

**19/08/2026:**

**Before Update:** Order No used with the sales order number.

**After Update:** Order No used with the otherrefnum field.

**21/08/2026:**
- **Zero-Amount Line Filtering**: Fixed an issue where lines with an amount of exactly `0` or `0.00` were still appearing in the PDF. Because NetSuite's custom FreeMarker implementation treats the number `0` as having no content, using `?has_content` caused zero-amount lines to skip the filter. Implemented a robust type-safe check using the `??` (exists) operator and string parsing to identify and filter out lines where the amount is exactly zero.
- **Empty Invoice Render Crash Fix**: Resolved a NetSuite `UNEXPECTED_ERROR` crash that occurred when all lines on an invoice were filtered out. When the filtered item array is completely empty, the PDF rendering engine throws an exception. Added a dummy item fallback when `filteredItems` has a size of 0, and wrapped all table row cells in `item.quantity?has_content` checks to ensure the dummy row renders as clean blank cells instead of causing formatting exceptions.

**Suitlet File:** [[tax invoice sl.js]]