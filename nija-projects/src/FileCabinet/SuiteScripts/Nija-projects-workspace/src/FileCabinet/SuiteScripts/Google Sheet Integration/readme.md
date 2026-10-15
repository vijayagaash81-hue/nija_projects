# NetSuite to Google Sheet Integration

This integration automatically syncs NetSuite transaction summaries into a Google Sheet daily dashboard and dated reporting tabs.

---

## 1. NetSuite Map/Reduce Script (`gsi.js`)
- **Type:** NetSuite SuiteScript 2.1 Map/Reduce
- **File:** [gsi.js](file:///c:/Users/EDWIN/Documents/Nija%20Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/Google%20Sheet%20Integration/gsi.js)

### Logic Flow:
1. **`getInputData()`**: Runs a transaction saved search filtered by mainline records (`mainline = T`) and transaction date till date (`trandate onorbefore today`), grouped by transaction type with internal ID counts.
2. **`map()`**: Parses each grouped search result (`GROUP(type)` and `COUNT(internalid)`) into `{ key: type, value: count }`.
3. **`reduce()`**: Combines transaction counts for duplicate keys.
4. **`summarize()`**: Formats the date (`YYYY-MM-DD`) and transaction array, then sends an HTTP POST JSON payload to Google Apps Script.

---

## 2. Google Apps Script Web App (`appscript.js`)
- **Type:** Google Apps Script Web App
- **File:** [appscript.js](file:///c:/Users/EDWIN/Documents/Nija%20Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/Google%20Sheet%20Integration/appscript.js)

### Logic Flow:
1. **`doPost(e)`**: Webhook endpoint that receives NetSuite JSON payload.
2. **Daily Tab Generation**: Creates or clears a tab named by date (`YYYY-MM-DD`), populates the transaction table, and inserts **Bar** and **Pie** charts.
3. **Dashboard Update (`updateDashboard()`)**: Clears and refreshes the master `Dashboard` tab with latest date, total count, summary table, and executive charts.

---

## 3. Data Payload Contract

```json
{
  "date": "2026-09-20",
  "transactions": [
    { "type": "Purchase Order", "count": 97 },
    { "type": "Sales Order", "count": 47 },
    { "type": "Invoice", "count": 31 }
  ]
}
```

---

## 4. Setup & Deployment

1. **NetSuite (`gsi.js`)**: Deploy as Map/Reduce script and set schedule. Ensure `GOOGLE_APPS_SCRIPT_URL` matches Web App deployment URL.
2. **Google Apps Script (`appscript.js`)**: Deploy as **Web App** (Execute as: `Me`, Access: `Anyone`).
