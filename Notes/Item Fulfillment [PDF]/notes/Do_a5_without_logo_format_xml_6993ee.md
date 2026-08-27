# Documentation for Do a5 without logo format xml.xml

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/Notes/Item Fulfillment [PDF]/Do a5 without logo format xml.xml`

**Description:** This xml will act as the template for Do a5 without logo format.


**Changes:**

**19/08/2026:** Before Update Standard description is used it is changed to custcol_njt_podesc

**20/08/2026:** Changed order number field from record.createdfrom.tranid to record.custbody_njt_item_po

**21/08/2026:**
- Changed list iteration from `record.item` to `filteredItems.list` to loop over items filtered in the Suitelet.
- Changed quantity rendering to `${item.qty}` (pre-formatted as string in the Suitelet).
- Wrapped the table row in a `<#if item.custcol_njt_podesc?has_content || item.qty?has_content>` condition to hide the dummy blank row if the items list is empty.

**Suitlet File:** [[a4 and a5 print sl.js]]