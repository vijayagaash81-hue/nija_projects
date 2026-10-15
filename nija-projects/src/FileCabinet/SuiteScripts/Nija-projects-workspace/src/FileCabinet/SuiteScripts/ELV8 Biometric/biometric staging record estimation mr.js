/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * 
 * Description: Biometric Staging Estimation MapReduce script.
 * Fetches transactions from external API, checks against existing customrecord_hris_biometric_staging records,
 * and provides an estimation count of how many records WOULD be created without actually creating any records.
 */
define(['N/https', 'N/log', 'N/format', 'N/search', 'N/runtime'], (https, log, format, search, runtime) => {

    /**
     * getInputData stage: Fetches biometric transactions from external API and filters by date range.
     * @returns {Array} List of filtered transaction objects
     */
    const getInputData = () => {
        try {
            const dataUrl = 'https://63.biocloud.me:8194/api_gettransactions';
            
            // Get NetSuite User Timezone or default to Asia/Dubai
            let userTz = 'Asia/Dubai';
            try {
                if (runtime.getUser()) {
                    let prefTz = runtime.getUser().getPreference({ name: 'TIMEZONE' });
                    if (prefTz) userTz = prefTz;
                }
            } catch (tzErr) {
                log.debug('Timezone Fetch Warning', tzErr.message);
            }

            let todayStr = getTodayFormatted(userTz);
            let startDate = todayStr;
            let endDate = todayStr;

            // Optional custom date range for estimation:
            // let startDate = '2026-09-01';
            // let endDate = '2026-09-04';

            log.debug("User Timezone", userTz);
            log.debug("StartDate", startDate);
            log.debug("EndDate", endDate);

            let dataBody = {};

            let dataResponse = https.post({
                url: dataUrl,
                body: JSON.stringify(dataBody),
                headers: { 
                    'Content-Type': 'application/json', 
                    'token': 'e0c1ebcce42140ab95fdb8e7896cea27'
                }
            });

            log.debug("dataResponse RAW:", dataResponse);
            let responseData = JSON.parse(dataResponse.body);
            log.debug("response data", responseData);
            let transactions = responseData.message || responseData.results || (Array.isArray(responseData) ? responseData : []);

            let filteredTransactions = transactions.filter(txn => {
                if (!txn.VerifyTime) return false;
                let txnDate = txn.VerifyTime.split('T')[0];
                return txnDate >= startDate && txnDate <= endDate;
            });

            log.audit('Data Fetch Summary for Estimation', `Total transactions retrieved: ${transactions.length}. Filtered for date ${startDate} to ${endDate}: ${filteredTransactions.length}`);

            return filteredTransactions;

        } catch (e) {
            log.error('getInputData Error', e.message);
            return [];
        }
    };

    /**
     * Map stage: Checks if transaction already exists in NetSuite staging record without creating any record.
     * Writes key 'ESTIMATED_TO_CREATE' or 'ALREADY_EXISTS' for aggregation.
     * @param {Object} context 
     */
    const map = (context) => {
        try {
            let punchData = JSON.parse(context.value);
            log.debug("Punch Data (MAP Estimation):", punchData);
            
            let transactionId = punchData.Id;
            let externalId = 'bio_' + transactionId;

            // Check if staging record already exists for this transaction ID
            let alreadyExists = false;
            search.create({
                type: 'customrecord_hris_biometric_staging',
                filters: [['custrecord_externalid', 'is', externalId]]
            }).run().each(result => {
                alreadyExists = true;
                return false; // Stop search iteration
            });

            if (alreadyExists) {
                log.debug('Skipped Duplicate (Estimation)', `Transaction ID ${transactionId} already exists in customrecord_hris_biometric_staging.`);
                context.write({
                    key: 'ALREADY_EXISTS',
                    value: transactionId
                });
            } else {
                log.debug('Would Create Record (Estimation)', `Transaction ID ${transactionId} does NOT exist yet. Record WOULD be created.`);
                context.write({
                    key: 'ESTIMATED_TO_CREATE',
                    value: transactionId
                });
            }

        } catch (e) {
            log.error('Map Error', e.message);
        }
    };

    /**
     * Reduce stage: Aggregates counts for each outcome key ('ESTIMATED_TO_CREATE' vs 'ALREADY_EXISTS').
     * @param {Object} context 
     */
    const reduce = (context) => {
        try {
            let count = context.values.length;
            log.audit(`Reduce Estimation [${context.key}]`, `Count: ${count}`);
            context.write({
                key: context.key,
                value: count
            });
        } catch (e) {
            log.error('Reduce Error', e.message);
        }
    };

    /**
     * Summarize stage: Calculates and logs final estimation counts and error logs.
     * @param {Object} summary 
     */
    const summarize = (summary) => {
        try {
            let estimatedToCreate = 0;
            let alreadyExists = 0;

            summary.output.iterator().each((key, value) => {
                let count = parseInt(value, 10) || 0;
                if (key === 'ESTIMATED_TO_CREATE') {
                    estimatedToCreate = count;
                } else if (key === 'ALREADY_EXISTS') {
                    alreadyExists = count;
                }
                return true;
            });

            let totalProcessed = estimatedToCreate + alreadyExists;

            log.audit('================ ESTMATION RESULT SUMMARY ================', {
                'Total Biometric Transactions Evaluated': totalProcessed,
                'ESTIMATED RECORDS TO BE CREATED': estimatedToCreate,
                'RECORDS ALREADY EXISTING (SKIPPED)': alreadyExists
            });

            // Log map errors if any occurred
            if (summary.mapSummary && typeof summary.mapSummary.errors.iterator === 'function') {
                summary.mapSummary.errors.iterator().each((key, error) => {
                    log.error(`Map Error for Key: ${key}`, error);
                    return true;
                });
            }

            // Log reduce errors if any occurred
            if (summary.reduceSummary && typeof summary.reduceSummary.errors.iterator === 'function') {
                summary.reduceSummary.errors.iterator().each((key, error) => {
                    log.error(`Reduce Error for Key: ${key}`, error);
                    return true;
                });
            }

            log.audit('Estimation Completed', `Finished processing. Estimated records to be created: ${estimatedToCreate}`);
        } catch (e) {
            log.error('Summarize Error', e.message);
        }
    };

    /**
     * Helper function to get today's date formatted as YYYY-MM-DD in the target/user timezone.
     * Prevents date offset issues where NetSuite server OS time (US Pacific) is on the previous day.
     * @param {string} userTz 
     * @returns {string} Date string in YYYY-MM-DD format
     */
    function getTodayFormatted(userTz) {
        let now = new Date();
        let tz = userTz || 'Asia/Dubai';
        try {
            if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
                return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now);
            }
        } catch (e) {
            log.debug('Intl.DateTimeFormat fallback', e.message);
        }
        
        try {
            let formattedStr = format.format({
                value: now,
                type: format.Type.DATETIME,
                timezone: tz
            });
            let datePart = formattedStr.split(' ')[0];
            let nsDate = format.parse({ value: datePart, type: format.Type.DATE });
            let yyyy = nsDate.getFullYear();
            let mm = String(nsDate.getMonth() + 1).padStart(2, '0');
            let dd = String(nsDate.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        } catch (err) {
            log.error('getTodayFormatted Fallback Error', err.message);
            let year = now.getFullYear();
            let month = String(now.getMonth() + 1).padStart(2, '0');
            let day = String(now.getDate()).padStart(2, '0');  
            return `${year}-${month}-${day}`;
        }
    }

    return { getInputData, map, reduce, summarize };
});

