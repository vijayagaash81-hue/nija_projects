# Scenario 7: Currency Number to Words Conversion

## Overview
Compliant invoices, tax summaries, payment vouchers, and official receipts in the UAE / Middle East and international markets require writing out amounts in words (e.g. `AED 15,250.75` -> *"Fifteen Thousand Two Hundred Fifty Dirhams and Seventy-Five Fils Only"*).

## Architecture
- `util_number_to_words.js`: Standalone AMD utility. Supports chunks of Thousands, Millions, Billions, and proper decimal unit formatting.
- `ue_set_amount_in_words.js`: User Event script attached to transactions that automatically sets `custbody_total_amount_in_words` on `beforeSubmit`.
- **In Advanced PDF/HTML Template:** Can be outputted cleanly as `${record.custbody_total_amount_in_words}`.
