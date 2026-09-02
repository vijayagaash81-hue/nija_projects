# Documentation for pick list report sl.js

**Original Path:** `c:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/Pick List Report/pick list report sl.js`

**Description:** This Suitelet generates an HTML and PDF Pick List Report displaying pick lists, sales orders, customers, items, bins, stock availability, picked quantities, and picking status.

---

## Log of Changes & Implementation Notes

### 01/09/2026:
- **Interactive Header Sorting (Ascending / Descending)**:
  - **Before Update**: DataTables option `ordering: false` was set, which completely disabled header clicking and sorting for all table columns.
  - **After Update**: Set `ordering: true` and `order: []` to preserve the initial server-rendered grouping while enabling full interactive sorting when clicking any column header.
  - Added explicit `data-order` attributes to all `<td>` elements (`Pick List #`, `Sales Order`, `Customer`, `Item Details`, `BIN`, `Inv Qty`, `Available`, `Qty / Picked Qty`, `Status`) to ensure accurate alphabetical and numerical ordering even across grouped or empty display cells.
  - Added hover cursor (`cursor: pointer !important;`) on table headers to provide clear interactive visual feedback.

### 28/08/2026:
- **Duplicate Row Generation Fix**: 
  - **Before Update**: The SuiteQL query joined the Custom Inventory Detail record (`customrecord_cuctom_inv_det C`) to the parent Pick List record (`customrecord_njt_pick_list A`) using only the parent reference: `C.custrecord_cust_inv_pick_list = A.id`. This created a Cartesian product, resulting in multiple duplicated item rows with incorrect/mismatched bin locations.
  - **After Update**: Appended the item matching constraint to the join: `AND C.custrecord_cust_inv_det_item = B.custrecord_pl_det_item`. This correctly isolates the bin details and quantities to each specific line item.

- **Screen-Only PDF Filtering**:
  - **Before Update**: Clicking "Download PDF" fetched all records, ignoring active search filters.
  - **After Update**: Replaced the static PDF link with a POST submission containing active DataTables row keys, rendering a filtered PDF matching screen results.
