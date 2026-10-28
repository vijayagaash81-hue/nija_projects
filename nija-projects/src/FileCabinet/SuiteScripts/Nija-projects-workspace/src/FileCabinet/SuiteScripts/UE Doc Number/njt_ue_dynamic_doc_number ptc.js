/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 *
 * Script Name: njt_ue_dynamic_doc_number.js
 * Description: Dynamically generates custom Document Numbers / Transaction Numbers 
 *              for transactions (Bill Payment [PV], Vendor Bill [SB], etc.) when 
 *              the field transactionnumber / tranid contains "To Be Generated".
 *
 * Pattern:     {SUBSIDIARY}/{DIVISION}/{RECORD_TYPE}/${YY}-{SEQUENCE}
 * Example:     MH/FB/PV/26-0001
 *
 * Initial Number & Auto-Increment Logic:
 *  1. Initial Number is given directly inside this script in INITIAL_NUMBER_RULES below.
 *  2. If NO record exists yet with this prefix -> Starts with the number given in INITIAL_NUMBER_RULES.
 *  3. If records ALREADY exist with this prefix -> Auto-creates the next number (highestExisting + 1).
 */
define(['N/record', 'N/search', 'N/log', 'N/runtime'], (record, search, log, runtime) => {

    /**
     * =========================================================================
     * 1. INITIAL NUMBER CONFIGURATION (EDIT YOUR STARTING NUMBERS HERE)
     * =========================================================================
     * The sequence number is tracked based ONLY on the SUBSIDIARY (shared across
     * all classes/divisions for that subsidiary).
     * 
     * Set the starting number for each Subsidiary directly below:
     */
    const INITIAL_NUMBER_RULES = {
        // By Subsidiary Code (MH, SH, EN, SE)
        'MH': 1,     // Mohsin Hardware Trading Co LLC
        'SH': 1,     // Shoreline Pipes Installation
        'EN': 1,     // SJS Enersol Engineering Works LLC
        'SE': 1,     // SJS Enersol LLC

        // Optional class-specific overrides (if ever needed)
        'MH-FB': 1, 'MH-FS': 1, 'MH-PF': 1,
        'SH-FB': 1, 'SH-FS': 1, 'SH-PF': 1,
        'EN-FB': 1, 'EN-FS': 1, 'EN-PF': 1,
        'SE-FB': 1, 'SE-FS': 1, 'SE-PF': 1,

        // Default initial number if a specific rule is not found
        'DEFAULT': 1
    };

    /**
     * Default Minimum Digits for Sequence Padding (e.g. 4 -> 0001)
     */
    const DEFAULT_MIN_DIGITS = 4;

    /**
     * Standard Subsidiary Code Mapping
     * MH -> Mohsin Hardware Trading Co LLC
     * SH -> Shoreline Pipes Installation
     * EN -> SJS Enersol Engineering Works LLC
     * SE -> SJS Enersol LLC
     */
    const DEFAULT_SUBSIDIARY_MAP = [
        { code: 'MH', matchKeywords: ['mohsin', 'hardware'], ids: [] },
        { code: 'SH', matchKeywords: ['shoreline'], ids: [] },
        { code: 'EN', matchKeywords: ['engineering works', 'engineering'], ids: [] },
        { code: 'SE', matchKeywords: ['sjs enersol', 'enersol'], excludeKeywords: ['engineering'], ids: [] }
    ];

    /**
     * Standard Division Code Mapping
     * FB -> Fabrication (Class ID 2, Segment ID 1)
     * FS -> Fasteners   (Class ID 1, Segment ID 3)
     * PF -> Pipe Fitting (Class ID 3, Segment ID 2)
     */
    const DEFAULT_DIVISION_MAP = [
        { code: 'FB', matchKeywords: ['fabrication', 'fab'], classIds: ['2'], csegIds: ['1'] },
        { code: 'FS', matchKeywords: ['fastener', 'fasteners'], classIds: ['1'], csegIds: ['3'] },
        { code: 'PF', matchKeywords: ['pipe', 'fitting', 'fittings'], classIds: ['3'], csegIds: ['2'] },
        { code: 'GN', matchKeywords: ['general'], classIds: ['4'], csegIds: ['4'] }
    ];

    /**
     * Default Record Type / Transaction Type Codes
     * Dynamic: script detects the record type and uses the appropriate abbreviation.
     */
    const DEFAULT_RECORD_TYPE_CODES = {
        'vendorpayment': 'PV',      // Payment Voucher (Bill Payment)
        'vendorbill': 'SB',         // Standalone Bill / Vendor Bill
        'invoice': 'INV',           // Tax Invoice
        'customerpayment': 'RV',    // Receipt Voucher
        'creditmemo': 'CM',         // Credit Memo
        'vendorcredit': 'VC',       // Vendor Credit
        'salesorder': 'SO',         // Sales Order
        'purchaseorder': 'PO',      // Purchase Order
        'journalentry': 'JE',       // Journal Entry
        'check': 'CK'               // Check
    };

    /**
     * Executes before the record is saved into the database.
     * Generates and sets the custom document number.
     *
     * @param {Object} context
     * @param {Record} context.newRecord - Current record being submitted
     * @param {string} context.type - User event trigger type (create, edit, copy, etc.)
     * @param {Object} context.UserEventType - Enum for event types
     */
    const beforeSubmit = (context) => {
        try {
            const { newRecord, type, UserEventType } = context;

            // Only run on create, copy, or edit
            if (type === UserEventType.DELETE || type === UserEventType.XEDIT) {
                return;
            }

            log.audit('beforeSubmit Start', {
                recordType: newRecord.type,
                recordId: newRecord.id || 'New Record',
                eventType: type
            });

            // 1. Read script parameters & configuration
            const config = getScriptConfiguration(newRecord.type);

            // 2. Resolve Subsidiary Code (MH, SH, EN, SE)
            const subCode = getSubsidiaryCode(newRecord, config.customSubMapping);
            if (!subCode) {
                log.error('Missing Subsidiary Code', 'Unable to determine Subsidiary Code from record.');
                return;
            }

            // 3. Resolve Division Code (FB, FS, PF)
            const divCode = getDivisionCode(newRecord, config);
            if (!divCode) {
                log.error('Missing Division Code', 'Unable to determine Division Code from record.');
                return;
            }

            // 4. Resolve Record Type Code (PV for Bill Payment, SB for Bill, etc.)
            const typeCode = config.recordTypeCode;

            // 5. Resolve Year Code (${YY} or ${YYYY})
            const { yy, yyyy } = getYearCodes(newRecord);

            // 6. Build Document Prefix (e.g. MH/FB/PV/26-)
            const prefix = buildPrefix(config.prefixFormat, subCode, divCode, typeCode, yy, yyyy);
            log.debug('Constructed Prefix', prefix);

            // 7. Check if document number needs to be generated (checks for "To Be Generated")
            const needsGeneration = checkNeedsGeneration(newRecord, config, type, UserEventType, prefix);
            if (!needsGeneration) {
                log.debug('Generation Skipped', 'Record already has a valid document number.');
                return;
            }

            // 8. Resolve the Initial Starting Number given inside the script for this subsidiary
            const initialNumberGiven = getInitialNumberForRule(subCode, divCode, typeCode, config);
            log.debug('Initial Number Given in Script for Subsidiary', { subCode, initialNumberGiven });

            // 9. Generate Sequence Number (tracked based ONLY on Subsidiary, shared across all classes/divisions):
            // - If no record exists for this subsidiary -> starts with initialNumberGiven
            // - If records already exist for this subsidiary -> auto-creates the next number (highestExisting + 1)
            const nextSeqNum = getNextSequenceNumber(newRecord.type, subCode, typeCode, yy, prefix, initialNumberGiven, config.minDigits);
            const formattedDocNumber = formatDocumentNumber(prefix, nextSeqNum, config.minDigits);

            log.audit('Generated Document Number', {
                subsidiary: subCode,
                division: divCode,
                prefix: prefix,
                initialNumberGivenInScript: initialNumberGiven,
                finalSequenceAssigned: nextSeqNum,
                documentNumber: formattedDocNumber
            });

            // 10. Assign Document Number to target field(s)
            applyDocumentNumber(newRecord, formattedDocNumber, config.targetField);

        } catch (error) {
            log.error('Error in beforeSubmit Dynamic Doc Numbering', error);
        }
    };

    /**
     * Executes after the record is saved to ensure values are persisted in the database.
     *
     * @param {Object} context
     */
    const afterSubmit = (context) => {
        try {
            const { newRecord, type, UserEventType } = context;

            if (type === UserEventType.DELETE) {
                return;
            }

            // Check tranid and transactionnumber in DB after save
            if (newRecord.id && type === UserEventType.CREATE) {
                const lookup = search.lookupFields({
                    type: newRecord.type,
                    id: newRecord.id,
                    columns: ['tranid', 'transactionnumber']
                });

                const tranId = (lookup.tranid || '').trim();
                const tranNum = (lookup.transactionnumber || '').trim();

                log.debug('afterSubmit Check', { tranId, tranNum });

                const targetDocNumber = (!isToBeGeneratedText(tranId) && tranId) ? tranId : tranNum;

                // If transactionnumber in DB does not match targetDocNumber, load record and save it
                if (targetDocNumber && !isToBeGeneratedText(targetDocNumber) && tranNum !== targetDocNumber) {
                    try {
                        const recToUpdate = record.load({
                            type: newRecord.type,
                            id: newRecord.id,
                            isDynamic: false
                        });

                        recToUpdate.setValue({
                            fieldId: 'transactionnumber',
                            value: targetDocNumber
                        });

                        recToUpdate.setValue({
                            fieldId: 'tranid',
                            value: targetDocNumber
                        });

                        const savedId = recToUpdate.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        });

                        log.audit('transactionnumber successfully saved to DB via record.load', {
                            recordId: savedId,
                            transactionnumber: targetDocNumber
                        });
                    } catch (loadErr) {
                        log.error('record.load could not set transactionnumber', loadErr.message);

                        // Fallback attempt via record.submitFields
                        try {
                            record.submitFields({
                                type: newRecord.type,
                                id: newRecord.id,
                                values: {
                                    transactionnumber: targetDocNumber,
                                    tranid: targetDocNumber
                                },
                                options: { enableSourcing: false, ignoreMandatoryFields: true }
                            });
                        } catch (submitErr) {
                            log.debug('submitFields fallback note', submitErr.message);
                        }
                    }
                }
            }
        } catch (afterError) {
            log.debug('afterSubmit note', afterError.message);
        }
    };

    /**
     * Gets the initial starting number given inside the script for the current rule.
     *
     * Checks in order:
     * 1. Sub-Div-Type rule (e.g. 'MH-FB-PV')
     * 2. Sub-Div rule (e.g. 'MH-FB')
     * 3. Script parameter override (if configured)
     * 4. 'DEFAULT' rule in INITIAL_NUMBER_RULES
     *
     * @param {string} subCode
     * @param {string} divCode
     * @param {string} typeCode
     * @param {Object} config
     * @returns {number}
     */
    const getInitialNumberForRule = (subCode, divCode, typeCode, config) => {
        // 1. Check Subsidiary first (sequence number is tracked per subsidiary)
        if (INITIAL_NUMBER_RULES[subCode] !== undefined) {
            return parseInt(INITIAL_NUMBER_RULES[subCode], 10) || 1;
        }

        const fullRuleKey = `${subCode}-${divCode}-${typeCode}`;
        const subDivKey = `${subCode}-${divCode}`;

        if (INITIAL_NUMBER_RULES[fullRuleKey] !== undefined) {
            return parseInt(INITIAL_NUMBER_RULES[fullRuleKey], 10) || 1;
        }

        if (INITIAL_NUMBER_RULES[subDivKey] !== undefined) {
            return parseInt(INITIAL_NUMBER_RULES[subDivKey], 10) || 1;
        }

        // 2. Check script parameter initial number if set
        if (config.initialNumber && config.initialNumber > 1) {
            return config.initialNumber;
        }

        // 3. Fallback to DEFAULT rule in INITIAL_NUMBER_RULES
        return parseInt(INITIAL_NUMBER_RULES['DEFAULT'], 10) || 1;
    };

    /**
     * Reads configuration from Script Deployment parameters or defaults.
     *
     * @param {string} recordType
     * @returns {Object} configuration
     */
    const getScriptConfiguration = (recordType) => {
        const scriptObj = runtime.getCurrentScript();

        const paramRecTypeCode = scriptObj.getParameter({ name: 'custscript_njt_doc_rec_type_code' });
        const paramTargetField = scriptObj.getParameter({ name: 'custscript_njt_doc_target_field' });
        const paramFormat = scriptObj.getParameter({ name: 'custscript_njt_doc_prefix_format' });
        const paramMinDigits = parseInt(scriptObj.getParameter({ name: 'custscript_njt_doc_min_digits' }), 10);
        const paramInitialNum = parseInt(scriptObj.getParameter({ name: 'custscript_njt_doc_initial_num' }), 10);
        const paramDivField = scriptObj.getParameter({ name: 'custscript_njt_doc_div_field' });
        const paramSubMapping = scriptObj.getParameter({ name: 'custscript_njt_doc_sub_mapping' });
        const paramDivMapping = scriptObj.getParameter({ name: 'custscript_njt_doc_div_mapping' });

        let customSubMap = null;
        if (paramSubMapping) {
            try {
                customSubMap = JSON.parse(paramSubMapping);
            } catch (e) {
                log.error('Invalid JSON in custscript_njt_doc_sub_mapping', e);
            }
        }
        
        let customDivMap = null;
        if (paramDivMapping) {
            try {
                customDivMap = JSON.parse(paramDivMapping);
            } catch (e) {
                log.error('Invalid JSON in custscript_njt_doc_div_mapping', e);
            }
        }

        return {
            recordTypeCode: (paramRecTypeCode || DEFAULT_RECORD_TYPE_CODES[recordType] || 'PV').trim().toUpperCase(),
            targetField: (paramTargetField || 'transactionnumber').trim(),
            prefixFormat: (paramFormat || '{SUBSIDIARY}/{DIVISION}/{TYPE}/${YY}-').trim(),
            minDigits: !isNaN(paramMinDigits) && paramMinDigits > 0 ? paramMinDigits : DEFAULT_MIN_DIGITS,
            initialNumber: !isNaN(paramInitialNum) && paramInitialNum > 0 ? paramInitialNum : 1,
            divFieldId: paramDivField ? paramDivField.trim() : null,
            customSubMapping: customSubMap,
            customDivMapping: customDivMap
        };
    };

    /**
     * Determines whether document number generation should run.
     * Triggers when transactionnumber or tranid is "To Be Generated" or blank on creation.
     *
     * @param {Record} newRecord
     * @param {Object} config
     * @param {string} type
     * @param {Object} UserEventType
     * @param {string} prefix
     * @returns {boolean}
     */
    const checkNeedsGeneration = (newRecord, config, type, UserEventType, prefix) => {
        const tranNum = (newRecord.getValue({ fieldId: 'transactionnumber' }) || '').toString().trim();
        const tranId = (newRecord.getValue({ fieldId: 'tranid' }) || '').toString().trim();
        const targetVal = (newRecord.getValue({ fieldId: config.targetField }) || '').toString().trim();

        // 1. Explicit check: if any field has "To Be Generated"
        if (isToBeGeneratedText(tranNum) || isToBeGeneratedText(tranId) || isToBeGeneratedText(targetVal)) {
            return true;
        }

        // 2. On CREATE or COPY:
        if (type === UserEventType.CREATE || type === UserEventType.COPY) {
            // If tranid or targetField is blank
            if (!tranId || !targetVal) {
                return true;
            }

            // If the document number does not yet follow the full prefix
            if (prefix && (!tranId.startsWith(prefix) && !tranNum.startsWith(prefix))) {
                return true;
            }
        }

        return false;
    };

    /**
     * Helper to test if a string represents "To Be Generated"
     *
     * @param {string} text
     * @returns {boolean}
     */
    const isToBeGeneratedText = (text) => {
        if (!text) return false;
        const lower = text.toLowerCase().trim();
        return lower === 'to be generated' || lower.includes('to be generated') || lower === 'to_be_generated';
    };

    /**
     * Resolves Subsidiary Code (MH, SH, EN, SE)
     * Safely handles cases where getText() throws SSS_INVALID_API_USAGE
     * (e.g. when subsidiary was populated via setValue or record transform).
     *
     * @param {Record} newRecord
     * @param {Object} [customMapping]
     * @returns {string|null}
     */
    const getSubsidiaryCode = (newRecord, customMapping) => {
        let subId = '';
        try {
            subId = String(newRecord.getValue({ fieldId: 'subsidiary' }) || '');
        } catch (e) {
            log.debug('getValue subsidiary note', e.message);
        }

        let subText = '';
        try {
            subText = (newRecord.getText({ fieldId: 'subsidiary' }) || '').toLowerCase();
        } catch (e) {
            // NetSuite throws SSS_INVALID_API_USAGE if the field was set with setValue
            log.debug('getText subsidiary skipped', e.message);
        }

        // If subText is unavailable from getText(), look up the name using subId
        if (!subText && subId) {
            try {
                const subLookup = search.lookupFields({
                    type: search.Type.SUBSIDIARY,
                    id: subId,
                    columns: ['name']
                });
                subText = (subLookup.name || '').toLowerCase();
                log.debug('Looked up Subsidiary Name', { subId, subText });
            } catch (lookupErr) {
                log.debug('Subsidiary lookup error', lookupErr.message);
            }
        }

        log.debug('Resolving Subsidiary', { subId, subText });

        // 1. Check custom JSON mapping if provided
        if (customMapping) {
            if (customMapping[subId]) return customMapping[subId];
            for (const key in customMapping) {
                if (subText && subText.includes(key.toLowerCase())) {
                    return customMapping[key];
                }
            }
        }

        // 2. Match standard mapping
        for (const item of DEFAULT_SUBSIDIARY_MAP) {
            if (item.ids && item.ids.includes(subId)) {
                return item.code;
            }

            if (subText) {
                if (item.excludeKeywords) {
                    const hasExcluded = item.excludeKeywords.some(kw => subText.includes(kw.toLowerCase()));
                    if (hasExcluded) continue;
                }

                const isMatch = item.matchKeywords.some(kw => subText.includes(kw.toLowerCase()));
                if (isMatch) {
                    return item.code;
                }
            }
        }

        return null;
    };

    /**
     * Resolves Division Code (FB, FS, PF)
     * Safely checks classIds/csegIds first, safely calls getText(), and falls back to lookup.
     *
     * @param {Record} newRecord
     * @param {Object} config
     * @returns {string|null}
     */
    const getDivisionCode = (newRecord, config) => {
        const fieldsToCheck = [];

        if (config.divFieldId) {
            fieldsToCheck.push(config.divFieldId);
        }
        fieldsToCheck.push('cseg_njt_divisions');
        fieldsToCheck.push('class');
        fieldsToCheck.push('department');

        for (const fieldId of fieldsToCheck) {
            try {
                let val = '';
                try {
                    val = String(newRecord.getValue({ fieldId }) || '').trim();
                } catch (e) {}

                let text = '';
                try {
                    text = (newRecord.getText({ fieldId }) || '').toLowerCase().trim();
                } catch (e) {
                    // NetSuite throws SSS_INVALID_API_USAGE if field was set via setValue
                }

                if (!val && !text) continue;

                log.debug('Checking Division Field', { fieldId, val, text });

                // 1. Direct match by Class ID or Custom Segment ID using val (Fastest & safest)
                for (const item of DEFAULT_DIVISION_MAP) {
                    if (fieldId === 'class' && item.classIds.includes(val)) {
                        return item.code;
                    }
                    if (fieldId === 'cseg_njt_divisions' && item.csegIds.includes(val)) {
                        return item.code;
                    }
                }

                // 2. Check custom division mapping
                if (config.customDivMapping) {
                    if (config.customDivMapping[val]) return config.customDivMapping[val];
                    for (const key in config.customDivMapping) {
                        if (text && text.includes(key.toLowerCase())) {
                            return config.customDivMapping[key];
                        }
                    }
                }

                // 3. Match by text keywords if text was retrieved
                if (text) {
                    for (const item of DEFAULT_DIVISION_MAP) {
                        const isTextMatch = item.matchKeywords.some(kw => text.includes(kw.toLowerCase()));
                        if (isTextMatch) {
                            return item.code;
                        }
                    }
                }

                // 4. If text is empty and val was not matched, perform lookup
                if (!text && val) {
                    try {
                        let recType = search.Type.CLASSIFICATION;
                        if (fieldId === 'department') recType = search.Type.DEPARTMENT;
                        if (fieldId === 'cseg_njt_divisions') recType = 'customrecord_cseg_njt_divisions';

                        const divLookup = search.lookupFields({
                            type: recType,
                            id: val,
                            columns: ['name']
                        });
                        const lookedUpName = (divLookup.name || '').toLowerCase();
                        for (const item of DEFAULT_DIVISION_MAP) {
                            if (item.matchKeywords.some(kw => lookedUpName.includes(kw.toLowerCase()))) {
                                return item.code;
                            }
                        }
                    } catch (lookupErr) {
                        log.debug(`Lookup skipped for ${fieldId}`, lookupErr.message);
                    }
                }

            } catch (err) {
                log.debug(`Field check skipped for ${fieldId}`, err.message);
            }
        }

        return null;
    };

    /**
     * Resolves 2-digit and 4-digit Year from transaction date (trandate)
     *
     * @param {Record} newRecord
     * @returns {{ yy: string, yyyy: string }}
     */
    const getYearCodes = (newRecord) => {
        let dateVal = newRecord.getValue({ fieldId: 'trandate' });
        let dateObj = dateVal instanceof Date ? dateVal : (dateVal ? new Date(dateVal) : new Date());

        if (isNaN(dateObj.getTime())) {
            dateObj = new Date();
        }

        const fullYear = String(dateObj.getFullYear());
        const twoDigitYear = fullYear.slice(-2);

        return {
            yy: twoDigitYear,
            yyyy: fullYear
        };
    };

    /**
     * Builds Document Number Prefix by substituting template tokens.
     *
     * @param {string} formatTemplate
     * @param {string} subCode
     * @param {string} divCode
     * @param {string} typeCode
     * @param {string} yy
     * @param {string} yyyy
     * @returns {string}
     */
    const buildPrefix = (formatTemplate, subCode, divCode, typeCode, yy, yyyy) => {
        return formatTemplate
            .replace(/\{SUBSIDIARY\}/g, subCode)
            .replace(/\{DIVISION\}/g, divCode)
            .replace(/\{TYPE\}/g, typeCode)
            .replace(/\$\{YY\}/g, yy)
            .replace(/\{YY\}/g, yy)
            .replace(/\$\{YYYY\}/g, yyyy)
            .replace(/\{YYYY\}/g, yyyy);
    };

    /**
     * Helper to escape special characters for Regular Expressions
     *
     * @param {string} str
     * @returns {string}
     */
    const escapeRegex = (str) => {
        return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    /**
     * Parses numeric sequence from a document number string based on Subsidiary.
     * Matches any class/division for that subsidiary, e.g.:
     * SE/FB/PV/26-0001 -> 1
     * SE/FS/PV/26-0002 -> 2
     * SE/PF/PV/26-0003 -> 3
     *
     * @param {string} docStr
     * @param {string} subCode
     * @param {string} typeCode
     * @param {string} yy
     * @returns {number}
     */
    const parseSequenceForSubsidiary = (docStr, subCode, typeCode, yy) => {
        if (!docStr) return 0;
        const str = String(docStr).trim();

        // Must start with subsidiary code, e.g. "SE/"
        if (!str.startsWith(`${subCode}/`)) {
            return 0;
        }

        // Primary regex pattern: {SUB}/{ANY_CLASS}/{TYPE}/{YY}-{SEQUENCE}
        // E.g.: SE/FB/PV/26-0001 or SE/FS/PV/26-0002
        const strictRegex = new RegExp(`^${escapeRegex(subCode)}/[^/]+/${escapeRegex(typeCode)}/${escapeRegex(yy)}-(\\d+)`);
        const strictMatch = str.match(strictRegex);
        if (strictMatch) {
            return parseInt(strictMatch[1], 10) || 0;
        }

        // Secondary fallback pattern in case of custom separator
        const flexRegex = new RegExp(`^${escapeRegex(subCode)}/.*${escapeRegex(typeCode)}.*${escapeRegex(yy)}-(\\d+)`);
        const flexMatch = str.match(flexRegex);
        if (flexMatch) {
            return parseInt(flexMatch[1], 10) || 0;
        }

        return 0;
    };

    /**
     * Searches existing transactions in NetSuite to find the highest sequence number
     * for a given Subsidiary (shared across ALL classes/divisions for this subsidiary).
     *
     * @param {string} subCode
     * @param {string} typeCode
     * @param {string} yy
     * @param {string} recordType
     * @returns {number}
     */
    const getHighestExistingSequenceForSubsidiary = (subCode, typeCode, yy, recordType) => {
        let highestNumber = 0;

        try {
            const subPrefix = `${subCode}/`;
            const typeYearFilter = `/${typeCode}/${yy}-`;

            const docSearch = search.create({
                type: search.Type.TRANSACTION,
                filters: [
                    ['mainline', 'is', 'T'],
                    'AND',
                    [
                        [
                            ['tranid', 'startswith', subPrefix],
                            'AND',
                            ['tranid', 'contains', typeYearFilter]
                        ],
                        'OR',
                        [
                            ['transactionnumber', 'startswith', subPrefix],
                            'AND',
                            ['transactionnumber', 'contains', typeYearFilter]
                        ]
                    ]
                ],
                columns: [
                    search.createColumn({ name: 'tranid' }),
                    search.createColumn({ name: 'transactionnumber' }),
                    search.createColumn({ name: 'internalid', sort: search.Sort.DESC })
                ]
            });

            const pagedData = docSearch.runPaged({ pageSize: 1000 });
            pagedData.pageRanges.forEach(pageRange => {
                const page = pagedData.fetch({ index: pageRange.index });
                page.data.forEach(result => {
                    const tranId = result.getValue({ name: 'tranid' }) || '';
                    const tranNum = result.getValue({ name: 'transactionnumber' }) || '';

                    const seq1 = parseSequenceForSubsidiary(tranId, subCode, typeCode, yy);
                    const seq2 = parseSequenceForSubsidiary(tranNum, subCode, typeCode, yy);

                    if (seq1 > highestNumber) highestNumber = seq1;
                    if (seq2 > highestNumber) highestNumber = seq2;
                });
            });

        } catch (searchError) {
            log.error('Error in getHighestExistingSequenceForSubsidiary search', searchError);

            // Fallback search with startswith on subsidiary prefix
            try {
                const simpleSearch = search.create({
                    type: search.Type.TRANSACTION,
                    filters: [
                        ['mainline', 'is', 'T'],
                        'AND',
                        ['tranid', 'startswith', `${subCode}/`]
                    ],
                    columns: [
                        search.createColumn({ name: 'tranid', sort: search.Sort.DESC })
                    ]
                });
                simpleSearch.run().each(res => {
                    const tId = res.getValue({ name: 'tranid' }) || '';
                    const seq = parseSequenceForSubsidiary(tId, subCode, typeCode, yy);
                    if (seq > highestNumber) highestNumber = seq;
                    return true;
                });
            } catch (fallbackErr) {
                log.debug('Fallback subsidiary search note', fallbackErr.message);
            }
        }

        return highestNumber;
    };

    /**
     * Resolves the next sequence number based ONLY on the Subsidiary:
     * - If highest existing number for this subsidiary in DB >= initialNumberGiven:
     *   "already there is a number is has to auto create the next number"
     *   -> nextSeq = highestExisting + 1
     * - Else (first record for this subsidiary):
     *   "the numbering has to start what number i gave inside the script"
     *   -> nextSeq = initialNumberGiven
     *
     * @param {string} recordType
     * @param {string} subCode
     * @param {string} typeCode
     * @param {string} yy
     * @param {string} prefix
     * @param {number} initialNumberGiven
     * @param {number} minDigits
     * @returns {number}
     */
    const getNextSequenceNumber = (recordType, subCode, typeCode, yy, prefix, initialNumberGiven, minDigits) => {
        const highestExistingInDB = getHighestExistingSequenceForSubsidiary(subCode, typeCode, yy, recordType);
        log.debug('Sequence Calculation State (Subsidiary Based)', {
            subsidiary: subCode,
            type: typeCode,
            year: yy,
            prefix: prefix,
            initialNumberGiven: initialNumberGiven,
            highestExistingInDB: highestExistingInDB
        });

        let nextSeq = initialNumberGiven;

        if (highestExistingInDB >= initialNumberGiven) {
            // A number >= initialNumberGiven already exists for this subsidiary -> auto create next number!
            nextSeq = highestExistingInDB + 1;
            log.audit('Auto-incremented to next number for subsidiary', `Subsidiary ${subCode} highest sequence is ${highestExistingInDB}. Generating next number: ${nextSeq}`);
        } else {
            // First transaction for this subsidiary -> starts with initial number given in script!
            nextSeq = initialNumberGiven;
            log.audit('Starting with number given in script for subsidiary', `Subsidiary ${subCode} starting sequence at: ${nextSeq}`);
        }

        // Safety loop to ensure candidate is not duplicate
        let formattedCandidate = formatDocumentNumber(prefix, nextSeq, minDigits);
        let safetyCounter = 0;

        while (isDocumentNumberInUse(formattedCandidate) && safetyCounter < 500) {
            nextSeq++;
            formattedCandidate = formatDocumentNumber(prefix, nextSeq, minDigits);
            safetyCounter++;
        }

        return nextSeq;
    };

    /**
     * Checks if a document number is already in use by any transaction
     *
     * @param {string} docNumber
     * @returns {boolean}
     */
    const isDocumentNumberInUse = (docNumber) => {
        try {
            const checkSearch = search.create({
                type: search.Type.TRANSACTION,
                filters: [
                    ['mainline', 'is', 'T'],
                    'AND',
                    [
                        ['tranid', 'is', docNumber],
                        'OR',
                        ['transactionnumber', 'is', docNumber]
                    ]
                ],
                columns: ['internalid']
            });

            return checkSearch.runPaged().count > 0;
        } catch (e) {
            return false;
        }
    };

    /**
     * Formats full document number with zero-padding
     *
     * @param {string} prefix
     * @param {number} sequenceNumber
     * @param {number} minDigits
     * @returns {string}
     */
    const formatDocumentNumber = (prefix, sequenceNumber, minDigits) => {
        const paddedSeq = String(sequenceNumber).padStart(minDigits, '0');
        return `${prefix}${paddedSeq}`;
    };

    /**
     * Sets document number to tranid, targetField, and attempts transactionnumber
     *
     * @param {Record} newRecord
     * @param {string} docNumber
     * @param {string} targetField
     */
    const applyDocumentNumber = (newRecord, docNumber, targetField) => {
        // 1. Set configured target field (default tranid)
        try {
            newRecord.setValue({
                fieldId: targetField,
                value: docNumber
            });
            log.debug(`Set ${targetField}`, docNumber);
        } catch (e) {
            log.error(`Failed to set ${targetField}`, e.message);
        }

        // 2. Set tranid (standard NetSuite Document Number) if targetField is different
        if (targetField !== 'tranid') {
            try {
                newRecord.setValue({
                    fieldId: 'tranid',
                    value: docNumber
                });
                log.debug('Set tranid', docNumber);
            } catch (e) {
                log.debug('Setting tranid note', e.message);
            }
        }

        // 3. Attempt to set transactionnumber (if allowed / editable)
        if (targetField !== 'transactionnumber') {
            try {
                newRecord.setValue({
                    fieldId: 'transactionnumber',
                    value: docNumber
                });
                log.debug('Set transactionnumber', docNumber);
            } catch (e) {
                log.debug('Setting transactionnumber note', e.message);
            }
        }
    };

    return {
        beforeSubmit,
        afterSubmit
    };
});
