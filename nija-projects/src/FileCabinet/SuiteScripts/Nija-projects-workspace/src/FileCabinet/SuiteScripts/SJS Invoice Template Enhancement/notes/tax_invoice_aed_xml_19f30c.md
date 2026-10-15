# Documentation for tax invoice aed xml.xml

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/SJS Invoice Template Enhancement/tax invoice aed xml.xml`

**Description:** Advanced PDF/HTML BFL XML Template for rendering the Tax Invoice. Defines styling, header/footer macros, item pagination, summary tables, and bank details.

**Changes:**

**17/09/2026:**
- **Standard Image Definitions Maintained**: Retained clean HTML `<img>` tag definitions for company header logo, footer logo, and stamp image.
- **Dynamic Compatibility**: Verified XML structure compatibility with dynamic image stripping in `tax invoice sl.js` when printing without logo.

---

## Template Structure & Components

### 1. Styling & Page Settings
- Font: Times New Roman, 12px body text.
- Header height: `80pt`, Footer height: `70pt`.

### 2. Macros (`<macrolist>`)
- **`nlheader`:** Displays subsidiary-specific top header logo:
  - `SJS Enersol LLC` header logo banner.
  - Default subsidiary header logo banner.
- **`nlfooter`:** Displays footer information:
  - Receiver signature line & name/mobile field.
  - Subsidiary footer logo / company name declaration.
  - Bottom blue banner: `"Hex Bolt, Stud Bolt, Anchor Bolt And Heavy Engineering Construction"`.

### 3. Pagination & Line Items
- Filters out items with zero amount (`amtVal == 0`).
- Chunks items into 5 items per page (`filteredItems?chunk(5)`).
- Columns displayed: S. No., Description, UOM, Quantity, Rate, Total, VAT %, 5% VAT, Net Total.
- Fills empty rows to maintain uniform table height per page.

### 4. Summary & Bank Details Section
- Displays **Amount in Words** (`${customData.totalWords}`).
- Bank account details (Commercial Bank of Dubai / ADCB depending on `record.subsidiary`).
- Discount, Gross Amount, VAT, and Net Total summary table.
- Subsidiary stamp image displayed over summary area.