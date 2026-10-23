/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * 
 * Scenario: External API Integration & Staging Record Architecture (Biometric Attendance)
 * Stage 1: API Fetch & Staging Creation
 * Purpose: Connects to external Biometric / Time-Clock device cloud API via N/https,
 *          fetches raw punch logs, performs deduplication, and creates Staging Custom Records.
 */
define(['N/https', 'N/record', 'N/search', 'N/query', 'N/log', 'N/runtime'], 
(https, record, search, query, log, runtime) => {

    // =========================================================================
    // API CONFIGURATION
    // =========================================================================
    const API_ENDPOINT = 'https://api.biometriccloud.com/v1/attendance/punches';
    const API_KEY = 'Bearer bio_live_token_sec_9938217';
    const STAGING_REC_TYPE = 'customrecord_njt_bio_staging';

    /**
     * getInputData: Fetches data from external API and splits into individual punch items.
     * @returns {Array|Object}
     */
    const getInputData = (inputContext) => {
        try {
            log.audit({
                title: 'Biometric API Sync Started',
                details: 'Connecting to hardware device API...'
            });

            // 1. Prepare Request Headers & Parameters
            const headers = {
                'Authorization': API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            // Query parameter: e.g. punches from last 24 hours
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const dateStr = yesterday.toISOString().split('T')[0];

            const requestUrl = `${API_ENDPOINT}?startDate=${dateStr}&limit=500`;

            // 2. Execute HTTPS GET call
            const response = https.get({
                url: requestUrl,
                headers: headers
            });

            log.debug({
                title: 'API Response Received',
                details: `Status Code: ${response.code}`
            });

            if (response.code !== 200) {
                log.error({
                    title: 'Biometric API Error',
                    details: `HTTP ${response.code}: ${response.body}`
                });
                return [];
            }

            // 3. Parse JSON punches array
            const responseData = JSON.parse(response.body);
            const punchList = responseData.data || responseData.punches || [];

            log.audit({
                title: 'Punches Retrieved',
                details: `Total punch records to stage: ${punchList.length}`
            });

            return punchList;

        } catch (e) {
            log.error({
                title: 'Error in getInputData',
                details: e
            });
            return [];
        }
    };

    /**
     * Map Stage: Receives individual punch, checks if already staged, and creates Staging record.
     * @param {Object} mapContext
     */
    const map = (mapContext) => {
        try {
            const punch = JSON.parse(mapContext.value);
            const externalPunchId = String(punch.punch_id || punch.id);
            const deviceSerial = punch.device_sn || punch.terminal_sn || 'DEVICE_01';
            const employeeBioCode = String(punch.emp_code || punch.employee_id);
            const punchTimestamp = punch.punch_time || punch.timestamp; // e.g. "2026-10-15 08:31:00"
            const punchType = punch.punch_type || 'IN'; // 'IN' or 'OUT'

            if (!employeeBioCode || !externalPunchId) {
                log.warn({
                    title: 'Invalid Punch Data Skipped',
                    details: punch
                });
                return;
            }

            // 1. Deduplication Check: Has this punch_id already been recorded in staging?
            const isDuplicate = checkDuplicateStaging(externalPunchId);
            if (isDuplicate) {
                log.debug({
                    title: 'Duplicate Punch Skipped',
                    details: `Punch ID ${externalPunchId} already exists in staging`
                });
                return;
            }

            // 2. Create Staging Record (customrecord_njt_bio_staging)
            const stagingRec = record.create({
                type: STAGING_REC_TYPE,
                isDynamic: true
            });

            stagingRec.setValue({ fieldId: 'custrecord_bio_punch_id', value: externalPunchId });
            stagingRec.setValue({ fieldId: 'custrecord_bio_emp_code', value: employeeBioCode });
            stagingRec.setValue({ fieldId: 'custrecord_bio_device_sn', value: deviceSerial });
            stagingRec.setValue({ fieldId: 'custrecord_bio_punch_time', value: punchTimestamp });
            stagingRec.setValue({ fieldId: 'custrecord_bio_punch_type', value: punchType });
            stagingRec.setValue({ fieldId: 'custrecord_bio_raw_payload', value: JSON.stringify(punch) });
            stagingRec.setValue({ fieldId: 'custrecord_bio_status', value: '1' }); // 1 = Pending / Ready to Process

            const stagingRecId = stagingRec.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });

            log.debug({
                title: 'Staging Record Created',
                details: `Staging ID: ${stagingRecId} | Emp Code: ${employeeBioCode} | Time: ${punchTimestamp}`
            });

            // Pass to reduce stage if grouping by employee is needed
            mapContext.write({
                key: employeeBioCode,
                value: stagingRecId
            });

        } catch (e) {
            log.error({
                title: 'Error in Map Stage',
                details: e
            });
        }
    };

    /**
     * Checks if a punch ID has already been recorded in NetSuite
     * @param {string} externalPunchId
     * @returns {boolean}
     */
    function checkDuplicateStaging(externalPunchId) {
        try {
            const sql = `SELECT id FROM ${STAGING_REC_TYPE} WHERE custrecord_bio_punch_id = ?`;
            const results = query.runSuiteQL({
                query: sql,
                params: [externalPunchId]
            }).asMappedResults();

            return results.length > 0;
        } catch (err) {
            // Fallback to Search if SuiteQL table name differs
            const searchObj = search.create({
                type: STAGING_REC_TYPE,
                filters: [['custrecord_bio_punch_id', 'is', externalPunchId]],
                columns: ['internalid']
            });
            const searchResults = searchObj.run().getRange({ start: 0, end: 1 });
            return searchResults.length > 0;
        }
    }

    /**
     * summarize: Logs execution metrics and triggers Stage 2 processor
     * @param {Object} summaryContext
     */
    const summarize = (summaryContext) => {
        log.audit({
            title: 'Stage 1 Summary',
            details: `Map Errors: ${summaryContext.mapSummary.errors.count()}, Reduce Errors: ${summaryContext.reduceSummary.errors.count()}`
        });
    };

    return {
        getInputData,
        map,
        summarize
    };
});
