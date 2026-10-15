# Documentation for sjs_po_template.xml

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/SJS Po update/sjs_po_template.xml`

**Description:** Advanced PDF/HTML template for SJS Purchase Order printouts.

---

## Log of Changes & Implementation Notes

### 17/09/2026:

- **Atten To & Contact Person Fields**:
  - Configured both `Atten To:` and `Contact Person:` fields to draw from `record.custbody6`.
  - Added Freemarker logic (`?split(":")[1]` and `?replace("^[0-9\\s\\-_]+", "", "r")?trim`) to extract the clean contact name after the parent entity colon while stripping out leading spaced ID digits (e.g., `2 1 2 2 - 0 5 2 1`).

- **Item Table & Subtotal Table Column Alignment**:
  - Enforced `table-layout: fixed;` on both the main item table and subtotal/total-in-words table (`.main-table`).
  - Adjusted subtotal table cell width percentages (`55%`, `11%`, `9%`, `12%`, `13%`) to sum to 100% and align straight vertically with the corresponding columns of the item table above (`Amount`, `Tax Rate`, `Tax Amount`, `Total`).

- **Table Layout Text Overlapping Fix (`white-space: nowrap`)**:
  - Removed `white-space: nowrap` from `<table class="main-table">` inline styles to allow multi-line item descriptions and headers to wrap naturally inside fixed-width columns without character overlapping.
  - Applied `white-space: nowrap` specifically to header cells (`.main-table th`) so column titles (`S.NO`, `Description`, `Tax Rate`, `Tax Amount`, etc.) never split letters across lines.

- **Column Width & Proportion Rebalancing**:
  - Rebalanced column widths: `S.NO: 5%`, `Description: 28%`, `UOM: 6%`, `Quantity: 8%`, `Rate: 8%`, `Amount: 11%`, `Tax Rate: 9%`, `Tax Amount: 12%`, `Total: 13%`.
  - Rebalanced total-in-words subtotal table column widths to `55% | 11% | 9% | 12% | 13%` so all vertical grid lines align 100% precisely.

- **Top Details Section (Label-Value Spacing)**:
  - Added `table-layout: fixed; width: 100%;` to nested key-value tables in the top details section.
  - Set explicit column width ratios (**40% / 60%** for left column table, **35% / 65%** for right column table) to eliminate large empty gaps between field labels (`Purchase Order No:`, `Date:`, `Atten To:`, `Contact Person:`) and their record values.

- **Text Justification & Extra Word-Spacing Removal**:
  - Added Freemarker regex `?replace("\\s+", " ", "r")` to `Atten To:`, `Contact Person:`, and `Description` text expressions to collapse consecutive whitespace or tab characters down to single spaces.
  - Wrapped text values inside `<p align="left" style="margin:0;padding:0;text-align:left;align:left;">` paragraph blocks and added `align: left; text-align: left;` to CSS rules. This disables NetSuite BFO text justification when multi-line text wraps, ensuring normal single-space word rendering.

- **Purchase Order Title Centering**:
  - Restored center alignment for the main `Purchase Order` heading by refining `.title, td.title, .no-border td.title` CSS specificity and adding explicit `align="center"` attributes to the title table cell.