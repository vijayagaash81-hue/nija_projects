# Documentation for a4 and a5 print sl.js

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/Notes/Item Fulfillment [PDF]/a4 and a5 print sl.js`

**Description:** This Script is used to print the a4 and a5 /with and without logo print template for the item fulfillment.

**XML File:**

[[do a4 with logo format xml.xml]]

[[Do a5 without logo format xml.xml]]

**Changes:**

**21/08/2026:**
- Changed record load to standard mode (`isDynamic: false`).
- Filtered out items with zero amount (`itemfxamount == 0`) and items that are not received/fulfilled in this shipment (`itemreceive === false`).
- Renamed the quantity property to `qty` and pre-formatted it as a string in JS to avoid rendering bugs and reserved keyword collisions in the PDF engine.
- Implemented an empty list check to push a blank dummy item to prevent PDF engine crash, rendering an empty table instead.