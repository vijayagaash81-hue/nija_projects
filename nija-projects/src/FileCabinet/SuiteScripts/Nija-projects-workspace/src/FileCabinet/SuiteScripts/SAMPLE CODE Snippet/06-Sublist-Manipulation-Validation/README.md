# Scenario 6: Sublist Manipulation, Dynamic Validation & UI Controls

## Overview
Transactions in NetSuite require strict validation to prevent duplicate lines, negative rates, or accidental row clearing. This scenario showcases:
1. **Line Validation (`validateLine`):** Prevents commits if quantities <= 0 or if the item already exists on an earlier line.
2. **Real-time Recalculation (`fieldChanged`):** Calculates custom margin/markup columns as users edit cells without needing to save.
3. **Form Sublist Button Control (`ue_hide_sublist_buttons.js`):** Strips buttons like "Clear All Lines" and "Add Multiple" to enforce controlled data entry.
