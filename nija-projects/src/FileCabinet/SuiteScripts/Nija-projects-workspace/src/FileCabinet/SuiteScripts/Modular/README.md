# Transaction Search - Suitelet Documentation

This folder contains a modular **SuiteScript 2.1 Suitelet** for searching transaction records in NetSuite with a simple **White & Grey** user interface.

---

## Directory & File Structure

Location in File Cabinet: `SuiteScripts/Modular/`

```
Modular/
├── sl_transaction_search.js           # Main Suitelet Script
├── transactionSearchModule.js         # Transaction Search Module
├── transactionResultsModule.js        # HTML UI Renderer Module
├── transaction_results_template.html  # Standalone HTML Template Reference
└── README.md                          # Documentation File
```

---

## How the Files Work Together

### 1. `sl_transaction_search.js` (Main Suitelet)
- The main script entry point in NetSuite.
- Collects user filter inputs (Transaction Type, Entity, Date Range, Limit).
- Calls `transactionSearchModule.js` to run the search.
- Calls `transactionResultsModule.js` to generate the HTML design.
- Displays the complete form page in NetSuite.

---

### 2. `transactionSearchModule.js` (Search Module)
- Handles the search logic using NetSuite's `N/search` module.
- Converts dates to match NetSuite account date settings using `N/format`.
- Fetches transaction fields: Document #, Type, Date, Customer/Vendor, Amount, Status, and Memo.

---

### 3. `transactionResultsModule.js` (HTML UI Module)
- Generates the clean White & Grey webpage interface.
- Displays top summary cards: Total Records, Total Amount, and Average Amount.
- Builds the filter inputs form and search results data table.

---

### 4. `transaction_results_template.html` (HTML Template)
- A standalone HTML sample file for quick reference or direct template loading.

---

## NetSuite Deployment Steps

1. **Upload Files**:
   - Upload all files into `FileCabinet > SuiteScripts > Modular/`.

2. **Create Script Record**:
   - Go to **Customization > Scripting > Scripts > New**.
   - Select `sl_transaction_search.js`.
   - Set Name to `Transaction Search SL`.

3. **Deploy Script**:
   - Click **Deploy Script**.
   - Set Status to `Testing` or `Released`.
   - Select roles to grant access and save.

4. **Run Suitelet**:
   - Open the generated Suitelet URL to search and view transactions.
