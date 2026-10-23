# Scenario 3: External API Integration & Staging Record Architecture (Biometric Attendance)

## Why the Staging Architecture is Crucial in NetSuite
When integrating external hardware (biometric fingerprint/facial scanners, IoT devices, courier APIs, POS systems) into NetSuite:
1. **Never create production records directly in real-time webhook/API calls:** If validation fails, or an employee doesn't exist yet, raw API calls fail silently or abort transactions.
2. **Governor Limit Protection:** External hardware can fire hundreds of punches simultaneously. A staging record acts as an asynchronous buffer/queue.
3. **Auditability & Replayability:** Raw device payloads are preserved in `custrecord_bio_raw_payload`. If an employee ID was mistyped, an admin can correct the employee ID and re-process the staging records without re-querying the hardware device.

## Architectural Pipeline
```
+-----------------------------------+
| External Biometric / Cloud API    |
+-----------------+-----------------+
                  |
                  | 1. N/https GET (mr_biometric_api_sync_staging.js)
                  v
+-----------------------------------+
| STAGING CUSTOM RECORD             |
| (customrecord_njt_bio_staging)    |
| - External Punch ID (dedup key)   |
| - Biometric Emp Code              |
| - Timestamp & Punch Type          |
| - Status: 1 (Pending)             |
+-----------------+-----------------+
                  |
                  | 2. Map/Reduce Processor (mr_process_staging_records.js)
                  v
+-----------------------------------+
| VALIDATION & MATCHING ENGINE      |
| - Finds Employee via              |
|   custentity_njt_bio_emp_id       |
| - Consolidates Daily Punches      |
| - Calculates IN/OUT & Shift       |
+-----------------+-----------------+
                  |
         +--------+--------+
         |                 |
         v                 v
+------------------+ +------------------+
| SUCCESS:         | | FAILURE:         |
| Daily Attendance | | Staging Status=3 |
| Created/Updated  | | Error Reason     |
| Staging Status=2 | | Logged in Record |
+------------------+ +------------------+
```

## Included Scripts
- `mr_biometric_api_sync_staging.js`: Connects to REST endpoint via `N/https`, fetches punches, checks duplicates via SuiteQL, and writes staging records.
- `mr_process_staging_records.js`: Groups punches by employee & date, calculates first IN & last OUT, creates Daily Attendance, and updates staging statuses.
- `sl_manual_sync_trigger.js`: An admin dashboard Suitelet with live KPIs and an on-demand "Trigger Sync Now" button utilizing `N/task`.
