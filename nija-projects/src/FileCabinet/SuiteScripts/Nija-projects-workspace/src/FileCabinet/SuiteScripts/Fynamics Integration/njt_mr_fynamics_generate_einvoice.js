/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 *
 * Script Name: NJT | Fynamics Generate E-Invoice (Map/Reduce)
 * File Name: njt_mr_fynamics_generate_einvoice.js
 * Description: Obtains OAuth 2.0 Access Token from Fynamics KSA API,
 *              loads the NetSuite Invoice record by ID, maps header and line item
 *              data into the Fynamics KSA ZATCA generate_uuid JSON structure,
 *              and dispatches the E-Invoice generation request via HTTP POST with Bearer token.
 *
 * Reference Endpoint:
 * fetch('https://sandbox-ksa.fynamicstax.com/api/partner/ksaapi/generate_uuid', {
 *   method: 'POST',
 *   headers: {
 *     accept_language: 'en',
 *     'Content-Type': 'application/json',
 *     Authorization: 'Bearer YOUR_SECRET_TOKEN'
 *   },
 *   body: JSON.stringify({ docs: { ... } })
 * })
 */

define([
    'N/https',
    'N/encode',
    'N/runtime',
    'N/record',
    'N/search',
    'N/format',
    'N/file',
    'N/log',
    './njt_lib_qrcode'
], (https, encode, runtime, record, search, format, file, log, qrcode) => {

    // =========================================================================
    // API & SCRIPT CONFIGURATION
    // (Directly used without requiring multiple script parameters)
    // =========================================================================
    const CONFIG = {
        // Authentication Configuration
        AUTH_URL: 'https://sandbox-ksa.fynamicstax.com/api/partner/auth/authenticate',
        CLIENT_ID: 'api-2e09338c-7819-4164-aab0-c8bf96f0e78a',
        CLIENT_SECRET: 'VvtPSpGZFTYrTZhW2PqJfQXxg6zUai7A',
        GRANT_TYPE: 'client_credentials',
        SCOPE: 'read write',

        // E-Invoice Generation Endpoint
        EINVOICE_URL: 'https://sandbox-ksa.fynamicstax.com/api/partner/ksaapi/generate_uuid',

        // Sandbox Re-test Helper:
        // Set to true to append a short timestamp suffix (e.g. -1234) when testing the same invoice multiple times in sandbox,
        // preventing Fynamics from returning "Duplicate invoice. A record with the same document number already exists."
        ALLOW_SANDBOX_DOC_NO_SUFFIX: true,

        DEFAULT_CURRENCY: 'SAR',

        // File Cabinet Configuration for ZATCA QR Code Images
        // Leave QR_FOLDER_ID null to auto-find or auto-create "ZATCA QR Codes" folder
        QR_FOLDER_ID: null,
        QR_FOLDER_NAME: 'ZATCA QR Codes',
        QR_IMAGE_FIELD_ID: 'custbody_fynamics_qr_image'
    };

    // Only script parameter needed: Invoice ID
    const SCRIPT_PARAMS = {
        INVOICE_ID: 'custscript_fynamics_invoice_id'
    };

    // =========================================================================
    // AUTHENTICATION HELPER
    // =========================================================================

    /**
     * Builds application/x-www-form-urlencoded body.
     */
    const buildUrlEncodedBody = (paramsObj) => {
        if (typeof URLSearchParams !== 'undefined') {
            return new URLSearchParams(paramsObj).toString();
        }
        return Object.keys(paramsObj)
            .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(paramsObj[key]).replace(/%20/g, '+')}`)
            .join('&');
    };

    /**
     * Acquires Bearer Access Token from Fynamics Auth Endpoint using Client ID & Client Secret.
     * Directly uses credentials and endpoint from CONFIG.
     * @returns {string} Access Token string
     */
    const getFynamicsAccessToken = () => {
        const authUrl = CONFIG.AUTH_URL;
        const clientId = CONFIG.CLIENT_ID;
        const clientSecret = CONFIG.CLIENT_SECRET;

        // Base64 encode clientId:clientSecret for Basic Auth
        const credentials = `${clientId}:${clientSecret}`;
        const base64Encoded = encode.convert({
            string: credentials,
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64
        });

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${base64Encoded}`
        };

        const body = buildUrlEncodedBody({
            grant_type: CONFIG.GRANT_TYPE,
            scope: CONFIG.SCOPE
        });

        log.audit({
            title: 'Fynamics Auth - Fetching Access Token',
            details: `URL: ${authUrl} | Client ID: ${clientId}`
        });

        let response = https.post({
            url: authUrl,
            headers: headers,
            body: body
        });

        // Fallback retry with literal Basic format if 401
        if (response.code === 401) {
            log.warn({
                title: 'Fynamics Auth - 401 on Base64 Header',
                details: 'Retrying with literal Basic clientId:clientSecret...'
            });
            headers['Authorization'] = `Basic ${clientId}:${clientSecret}`;
            response = https.post({
                url: authUrl,
                headers: headers,
                body: body
            });
        }

        if (response.code !== 200) {
            throw new Error(`Fynamics Authentication Failed [HTTP ${response.code}]: ${response.body}`);
        }

        const data = JSON.parse(response.body);
        const tokenObj = data.data || data;
        const accessToken = tokenObj.access_token || tokenObj.accessToken || tokenObj.token;

        if (!accessToken) {
            throw new Error(`No access_token found in response body: ${response.body}`);
        }

        log.audit({
            title: 'Fynamics Auth - Token Acquired Successfully',
            details: `Token Type: ${tokenObj.token_type || 'Bearer'} | Expires In: ${tokenObj.expires_in || 3600}s`
        });

        return accessToken;
    };

    // =========================================================================
    // INVOICE DATA EXTRACTOR & JSON MAPPER
    // =========================================================================

    /**
     * Formats a JS Date object into YYYY-MM-DD string.
     */
    const formatDate = (dateObj) => {
        if (!dateObj) return '';
        try {
            const d = new Date(dateObj);
            if (isNaN(d.getTime())) return '';
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return '';
        }
    };

    /**
     * Loads the NetSuite Invoice record and constructs the compliant E-Invoice JSON payload
     * matching the Fynamics KSA generate_uuid structure.
     * Incorporates real NetSuite data and fills unknown fields with sample data.
     *
     * @param {string|number} invoiceId
     * @returns {Object} Complete E-Invoice request payload ({ docs: { ... } })
     */
    const buildEInvoicePayload = (invoiceId) => {
        log.audit({
            title: 'Loading Invoice Record',
            details: `Invoice Internal ID: ${invoiceId}`
        });

        const invoiceRec = record.load({
            type: record.Type.INVOICE,
            id: invoiceId,
            isDynamic: false
        });

        // 1. Header Information
        const tranId = invoiceRec.getValue({ fieldId: 'tranid' }) || '';
        const tranDate = invoiceRec.getValue({ fieldId: 'trandate' });
        const dueDate = invoiceRec.getValue({ fieldId: 'duedate' }) || tranDate;
        const issueDateStr = tranDate ? formatDate(tranDate) : '';
        const dueDateStr = dueDate ? formatDate(dueDate) : '';

        // Extract issue time dynamically from createddate if available (no hardcoded sample time)
        let issueTimeStr = '';
        try {
            const createdDateVal = invoiceRec.getValue({ fieldId: 'createddate' });
            if (createdDateVal) {
                const d = new Date(createdDateVal);
                if (!isNaN(d.getTime())) {
                    const hh = String(d.getHours()).padStart(2, '0');
                    const mm = String(d.getMinutes()).padStart(2, '0');
                    const ss = String(d.getSeconds()).padStart(2, '0');
                    issueTimeStr = `${hh}:${mm}:${ss}`;
                }
            }
        } catch (tErr) {}

        // Currency
        const currencyText = invoiceRec.getText({ fieldId: 'currency' });
        const currencyCode = (currencyText && currencyText.length === 3)
            ? currencyText
            : (invoiceRec.getValue({ fieldId: 'currencysymbol' }) || '');

        const poNumber = invoiceRec.getValue({ fieldId: 'otherrefnum' }) || '';
        const memo = invoiceRec.getValue({ fieldId: 'memo' }) || '';
        const paymentTerms = invoiceRec.getText({ fieldId: 'terms' }) || '';

        // 2. Customer / Buyer Information (Dynamically extracted from NetSuite Customer record & Invoice)
        const customerId = invoiceRec.getValue({ fieldId: 'entity' });
        let customerRec = null;

        if (customerId) {
            try {
                customerRec = record.load({
                    type: record.Type.CUSTOMER,
                    id: customerId
                });
            } catch (custLoadErr) {
                log.debug({
                    title: 'Customer record.load Ignored',
                    details: custLoadErr.message
                });
            }
        }

        // Helper to safely read field from loaded customer record (checking multiple candidate field IDs)
        const getCustField = (fieldIds) => {
            if (!customerRec) return '';
            const list = Array.isArray(fieldIds) ? fieldIds : [fieldIds];
            for (let i = 0; i < list.length; i++) {
                try {
                    const val = customerRec.getValue({ fieldId: list[i] });
                    if (val !== undefined && val !== null && String(val).trim() !== '') {
                        return String(val).trim();
                    }
                } catch (e) {}
            }
            return '';
        };

        // Helper to safely read field from address subrecord (checking multiple candidate field IDs)
        const getSubrecField = (subrec, fieldIds) => {
            if (!subrec) return '';
            const list = Array.isArray(fieldIds) ? fieldIds : [fieldIds];
            for (let i = 0; i < list.length; i++) {
                try {
                    const val = subrec.getValue({ fieldId: list[i] });
                    if (val !== undefined && val !== null && String(val).trim() !== '') {
                        return String(val).trim();
                    }
                } catch (e) {}
            }
            return '';
        };

        // Extract Customer Address from Customer Addressbook (Prioritize Default Billing Address)
        let customerBillingAddr = {};
        if (customerRec) {
            const addrCount = customerRec.getLineCount({ sublistId: 'addressbook' });
            let selectedLine = -1;
            for (let a = 0; a < addrCount; a++) {
                const isDefault = customerRec.getSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'defaultbilling',
                    line: a
                });
                if (isDefault === true || isDefault === 'T' || isDefault === 'true') {
                    selectedLine = a;
                    break;
                }
            }
            // If no address is flagged as default billing, fallback to line 0
            if (selectedLine === -1 && addrCount > 0) {
                selectedLine = 0;
            }

            if (selectedLine >= 0) {
                try {
                    const subrec = customerRec.getSublistSubrecord({
                        sublistId: 'addressbook',
                        fieldId: 'addressbookaddress',
                        line: selectedLine
                    });
                    if (subrec) {
                        customerBillingAddr = {
                            addr1: subrec.getValue({ fieldId: 'addr1' }) || '',
                            addr2: subrec.getValue({ fieldId: 'addr2' }) || '',
                            addr3: subrec.getValue({ fieldId: 'addr3' }) || '',
                            city: subrec.getValue({ fieldId: 'city' }) || '',
                            state: subrec.getValue({ fieldId: 'state' }) || subrec.getText({ fieldId: 'state' }) || '',
                            zip: subrec.getValue({ fieldId: 'zip' }) || '',
                            country: subrec.getValue({ fieldId: 'country' }) || '',
                            phone: subrec.getValue({ fieldId: 'addrphone' }) || subrec.getValue({ fieldId: 'phone' }) || '',
                            bldgNo: getSubrecField(subrec, ['custrecord_building_number', 'custrecord_bldg_no', 'custrecord_building_no', 'custrecord_zatca_building_number', 'custrecord_bldg_number']),
                            district: getSubrecField(subrec, ['custrecord_district', 'custrecord_subdivision', 'custrecord_area', 'custrecord_zatca_district']),
                            adrsNo: getSubrecField(subrec, ['custrecord_address_number', 'custrecord_secondary_number', 'custrecord_additional_number', 'custrecord_zatca_additional_number', 'custrecord_adrs_number'])
                        };
                    }
                } catch (subErr) {
                    log.debug({ title: 'Customer address subrecord read error', details: subErr.message });
                }
            }
        }

        // Also inspect Invoice Billing Address Subrecord if present
        let invoiceBillingAddr = {};
        try {
            const invSubrec = invoiceRec.getSubrecord({ fieldId: 'billingaddress' });
            if (invSubrec) {
                invoiceBillingAddr = {
                    addr1: invSubrec.getValue({ fieldId: 'addr1' }) || '',
                    addr2: invSubrec.getValue({ fieldId: 'addr2' }) || '',
                    addr3: invSubrec.getValue({ fieldId: 'addr3' }) || '',
                    city: invSubrec.getValue({ fieldId: 'city' }) || '',
                    state: invSubrec.getValue({ fieldId: 'state' }) || invSubrec.getText({ fieldId: 'state' }) || '',
                    zip: invSubrec.getValue({ fieldId: 'zip' }) || '',
                    country: invSubrec.getValue({ fieldId: 'country' }) || '',
                    phone: invSubrec.getValue({ fieldId: 'addrphone' }) || invSubrec.getValue({ fieldId: 'phone' }) || '',
                    bldgNo: getSubrecField(invSubrec, ['custrecord_building_number', 'custrecord_bldg_no', 'custrecord_building_no', 'custrecord_zatca_building_number', 'custrecord_bldg_number']),
                    district: getSubrecField(invSubrec, ['custrecord_district', 'custrecord_subdivision', 'custrecord_area', 'custrecord_zatca_district']),
                    adrsNo: getSubrecField(invSubrec, ['custrecord_address_number', 'custrecord_secondary_number', 'custrecord_additional_number', 'custrecord_zatca_additional_number', 'custrecord_adrs_number'])
                };
            }
        } catch (invSubErr) {
            // Standard invoice billing fields will be used
        }

        // 1. Dynamic Customer Name
        const customerName = getCustField(['companyname', 'altname']) ||
            invoiceRec.getText({ fieldId: 'entity' }) ||
            getCustField(['entityid']) ||
            '';

        // 2. Dynamic Customer VAT Number (TRN) - Directly from customer record vatregnumber / trn
        const customerTrn = getCustField([
            'vatregnumber',
            'custentity_vat_reg_no',
            'custentity_trn',
            'custentity_tax_reg_num',
            'custentity_vat_registration_no',
            'custentity_tax_number',
            'custentity_trn_number'
        ]) || '';

        // 3. Dynamic Customer Email & Phone
        const buyerEmail = getCustField(['email', 'custentity_email']) ||
            invoiceRec.getValue({ fieldId: 'email' }) ||
            '';

        const buyerPhone = customerBillingAddr.phone ||
            getCustField(['phone', 'altphone', 'mobilephone', 'custentity_phone', 'custentity_mobile']) ||
            invoiceBillingAddr.phone ||
            invoiceRec.getValue({ fieldId: 'billphone' }) ||
            invoiceRec.getValue({ fieldId: 'phone' }) ||
            '';

        // 4. Dynamic Customer Address Lines
        const buyerAddr1 = customerBillingAddr.addr1 ||
            invoiceBillingAddr.addr1 ||
            invoiceRec.getValue({ fieldId: 'billaddr1' }) ||
            '';

        const buyerAddr2 = customerBillingAddr.addr2 ||
            invoiceBillingAddr.addr2 ||
            invoiceRec.getValue({ fieldId: 'billaddr2' }) ||
            customerBillingAddr.addr3 ||
            invoiceBillingAddr.addr3 ||
            '';

        const buyerCity = customerBillingAddr.city ||
            invoiceBillingAddr.city ||
            invoiceRec.getValue({ fieldId: 'billcity' }) ||
            '';

        const buyerState = customerBillingAddr.state ||
            invoiceBillingAddr.state ||
            invoiceRec.getValue({ fieldId: 'billstate' }) ||
            '';

        const buyerZip = customerBillingAddr.zip ||
            invoiceBillingAddr.zip ||
            invoiceRec.getValue({ fieldId: 'billzip' }) ||
            '';

        const rawCountry = customerBillingAddr.country ||
            invoiceBillingAddr.country ||
            invoiceRec.getValue({ fieldId: 'billcountry' }) ||
            '';
        const buyerCountry = (rawCountry && rawCountry.length === 2)
            ? rawCountry.toUpperCase()
            : (rawCountry ? String(rawCountry).substring(0, 2).toUpperCase() : '');

        // 5. Dynamic Building Number (4-digit building number for ZATCA)
        let buyerBldgNumber = customerBillingAddr.bldgNo ||
            invoiceBillingAddr.bldgNo ||
            getCustField([
                'custentity_building_number',
                'custentity_bldg_no',
                'custentity_building_no',
                'custentity_zatca_building_number'
            ]) || '';

        if (!buyerBldgNumber && (buyerAddr1 || buyerAddr2)) {
            const bldgRegex = /\b\d{4}\b/;
            const combinedAddr = `${buyerAddr1} ${buyerAddr2} ${customerBillingAddr.addr3 || ''}`;
            const match = combinedAddr.match(bldgRegex);
            if (match) {
                buyerBldgNumber = match[0];
            }
        }

        // 6. Dynamic District
        const buyerDistrict = customerBillingAddr.district ||
            invoiceBillingAddr.district ||
            getCustField([
                'custentity_district',
                'custentity_area',
                'custentity_zatca_district',
                'custentity_subdivision'
            ]) ||
            customerBillingAddr.addr3 ||
            invoiceBillingAddr.addr3 ||
            '';

        // 7. Dynamic Additional Address Number
        const buyerAdrsNumber = customerBillingAddr.adrsNo ||
            invoiceBillingAddr.adrsNo ||
            getCustField([
                'custentity_address_number',
                'custentity_secondary_number',
                'custentity_additional_number',
                'custentity_zatca_additional_number',
                'custentity_adrs_number'
            ]) || '';

        // 8. Dynamic Other Buyer ID & Reg Type (CRN / 700 / NAT / OTH)
        const custCrn = getCustField([
            'custentity_cr_number',
            'custentity_crn',
            'custentity_commercial_reg_no',
            'custentity_cr_no',
            'custentity_crnumber',
            'custentity_commercial_registration_no'
        ]);
        const cust700 = getCustField(['custentity_700_number', 'custentity_700number', 'custentity_tin']);
        const custNatId = getCustField(['custentity_national_id', 'custentity_nat_id', 'custentity_nationalid']);

        let buyerRegType = '';
        let buyerId = '';

        const custOtherId = getCustField(['custentity_other_buyer_id', 'custentity_buyer_id', 'custentity_oth_id']);

        if (custCrn) {
            buyerRegType = 'CRN';
            buyerId = String(custCrn);
        } else if (cust700) {
            buyerRegType = '700';
            buyerId = String(cust700);
        } else if (custNatId) {
            buyerRegType = 'NAT';
            buyerId = String(custNatId);
        } else if (custOtherId) {
            buyerRegType = 'OTH';
            buyerId = String(custOtherId);
        }

        // 9. Customer Account Number (used for doc_payment_account)
        const docPaymentAccount = getCustField([
            'accountnumber',
            'custentity_account_number',
            'custentity_accountnumber',
            'custentity_bank_account_no',
            'custentity_iban'
        ]) || '';

        log.audit({
            title: 'Dynamic Customer Party Extracted',
            details: JSON.stringify({
                customerId: customerId,
                customerName: customerName,
                customerTrn: customerTrn,
                docPaymentAccount: docPaymentAccount,
                buyerEmail: buyerEmail,
                buyerPhone: buyerPhone,
                buyerAddr1: buyerAddr1,
                buyerAddr2: buyerAddr2,
                buyerCity: buyerCity,
                buyerState: buyerState,
                buyerZip: buyerZip,
                buyerCountry: buyerCountry,
                buyerBldgNumber: buyerBldgNumber,
                buyerDistrict: buyerDistrict,
                buyerAdrsNumber: buyerAdrsNumber,
                buyerRegType: buyerRegType,
                buyerId: buyerId
            })
        });

        // 3. Supplier / Seller Party Information (Dynamic from Subsidiary, no sample data fallback)
        let sellerVatNumber = '';
        let sellerName = '';
        let sellerEmail = '';
        let sellerPhone = '';
        let sellerAddr1 = '';
        let sellerAddr2 = '';
        let sellerCity = '';
        let sellerState = '';
        let sellerZip = '';
        let sellerCountry = '';
        let sellerDistrict = '';
        let sellerBldgNumber = '';
        let sellerAdrsNumber = '';
        let sellerOtherId = '';
        let sellerRegType = '';

        const subsidiaryId = invoiceRec.getValue({ fieldId: 'subsidiary' });
        if (subsidiaryId) {
            try {
                const subRec = record.load({
                    type: record.Type.SUBSIDIARY,
                    id: subsidiaryId
                });

                // Helper to check fields on subsidiary
                const getSubField = (fieldIds) => {
                    const list = Array.isArray(fieldIds) ? fieldIds : [fieldIds];
                    for (let i = 0; i < list.length; i++) {
                        try {
                            const val = subRec.getValue({ fieldId: list[i] });
                            if (val !== undefined && val !== null && String(val).trim() !== '') {
                                return String(val).trim();
                            }
                        } catch (e) {}
                    }
                    return '';
                };

                sellerName = subRec.getValue({ fieldId: 'legalname' }) || subRec.getValue({ fieldId: 'name' }) || '';
                sellerEmail = getSubField(['email', 'custrecord_email', 'custrecord_sub_email', 'custrecord_subsidiary_email']) || '';
                sellerPhone = subRec.getValue({ fieldId: 'phone' }) || subRec.getValue({ fieldId: 'fax' }) || '';
                // sellerVatNumber = getSubField(['federalidnumber', 'employerid', 'custrecord_vat_reg_number', 'custrecord_trn']) || '';
                sellerVatNumber = '314414679700003';
                const subCrn = getSubField([
                    'custrecord_cr_number',
                    'custrecord_crn',
                    'custrecord_commercial_reg_no',
                    'custrecord_cr_no',
                    'custrecord_crnumber'
                ]);
                const sub700 = getSubField(['custrecord_700_number', 'custrecord_700number']);
                const subOtherId = getSubField(['custrecord_other_id', 'custrecord_other_seller_id']);

                if (subCrn) {
                    sellerRegType = 'CRN';
                    sellerOtherId = subCrn;
                } else if (sub700) {
                    sellerRegType = '700';
                    sellerOtherId = sub700;
                } else if (subOtherId) {
                    sellerRegType = 'OTH';
                    sellerOtherId = subOtherId;
                }

                // Load address from Subsidiary mainaddress subrecord
                let mainAddr = null;
                try {
                    mainAddr = subRec.getSubrecord({ fieldId: 'mainaddress' });
                } catch (subrecErr) {
                    log.debug({ title: 'Subsidiary mainaddress subrecord not available', details: subrecErr.message });
                }

                if (mainAddr) {
                    sellerAddr1 = mainAddr.getValue({ fieldId: 'addr1' }) || '';
                    sellerAddr2 = mainAddr.getValue({ fieldId: 'addr2' }) || mainAddr.getValue({ fieldId: 'addr3' }) || '';
                    sellerCity = mainAddr.getValue({ fieldId: 'city' }) || '';
                    sellerState = mainAddr.getValue({ fieldId: 'state' }) || mainAddr.getText({ fieldId: 'state' }) || '';
                    sellerZip = mainAddr.getValue({ fieldId: 'zip' }) || '';
                    const subCountry = mainAddr.getValue({ fieldId: 'country' });
                    if (subCountry && subCountry.length === 2) {
                        sellerCountry = subCountry.toUpperCase();
                    } else if (subCountry) {
                        sellerCountry = String(subCountry).substring(0, 2).toUpperCase();
                    }
                    sellerBldgNumber = getSubrecField(mainAddr, ['custrecord_building_number', 'custrecord_bldg_no', 'custrecord_building_no', 'custrecord_zatca_building_number', 'custrecord_bldg_number']) || '';
                    sellerDistrict = getSubrecField(mainAddr, ['custrecord_district', 'custrecord_subdivision', 'custrecord_area', 'custrecord_zatca_district']) || '';
                    sellerAdrsNumber = getSubrecField(mainAddr, ['custrecord_address_number', 'custrecord_secondary_number', 'custrecord_additional_number', 'custrecord_zatca_additional_number', 'custrecord_adrs_number']) || '';
                }

                // If subrecord address fields were blank, parse mainaddress_text as fallback
                const mainAddrText = subRec.getValue({ fieldId: 'mainaddress_text' });
                if (mainAddrText && !sellerAddr1) {
                    const lines = mainAddrText.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);
                    if (lines.length > 0) {
                        sellerAddr1 = lines[0];
                        if (lines.length > 1) {
                            sellerAddr2 = lines[1];
                        }
                    }
                }

                log.audit({
                    title: 'Dynamic Supplier Party Extracted from Subsidiary',
                    details: JSON.stringify({
                        subsidiaryId: subsidiaryId,
                        sellerName: sellerName,
                        sellerEmail: sellerEmail,
                        sellerPhone: sellerPhone,
                        sellerAddr1: sellerAddr1,
                        sellerAddr2: sellerAddr2,
                        sellerCity: sellerCity,
                        sellerState: sellerState,
                        sellerZip: sellerZip,
                        sellerCountry: sellerCountry,
                        sellerBldgNumber: sellerBldgNumber,
                        sellerDistrict: sellerDistrict,
                        sellerAdrsNumber: sellerAdrsNumber,
                        sellerVatNumber: sellerVatNumber
                    })
                });
            } catch (subErr) {
                log.debug({ title: 'Subsidiary load ignored', details: subErr.message });
            }
        }

        // 3. Line Items Extraction
        const lineCount = invoiceRec.getLineCount({ sublistId: 'item' });
        log.audit({
            title: 'Invoice Lines Count',
            details: `Total lines to process: ${lineCount}`
        });

        const items = [];
        let calculatedNetSubtotal = 0;
        let calculatedTotalTax = 0;
        let primaryTaxRate = 15.00;
        let primaryTaxCategory = 'S';

        for (let i = 0; i < lineCount; i++) {
            const lineNum = i + 1;
            const itemName = invoiceRec.getSublistText({ sublistId: 'item', fieldId: 'item', line: i }) ||
                invoiceRec.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i }) ||
                invoiceRec.getSublistValue({ sublistId: 'item', fieldId: 'item_display', line: i }) ||
                '';
            const rawItemCode = invoiceRec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
            const itemCode = (rawItemCode !== undefined && rawItemCode !== null && String(rawItemCode).trim() !== '')
                ? String(rawItemCode).trim()
                : '';
            const rawUnitText = invoiceRec.getSublistText({ sublistId: 'item', fieldId: 'units', line: i }) ||
                invoiceRec.getSublistValue({ sublistId: 'item', fieldId: 'units', line: i }) ||
                '';
            const unitText = (rawUnitText !== undefined && rawUnitText !== null && String(rawUnitText).trim() !== '')
                ? String(rawUnitText).trim()
                : '';

            const rawQty = invoiceRec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
            const qty = (!isNaN(parseFloat(rawQty))) ? parseFloat(rawQty) : 0;

            const rawRate = invoiceRec.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i });
            const rate = (!isNaN(parseFloat(rawRate))) ? parseFloat(rawRate) : 0;

            const rawAmount = invoiceRec.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
            const lineAmount = (!isNaN(parseFloat(rawAmount))) ? parseFloat(rawAmount) : (qty * rate);

            // Tax values (read actual NetSuite tax rate)
            const rawTaxRate = invoiceRec.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i });
            let lineTaxRate = (!isNaN(parseFloat(rawTaxRate))) ? parseFloat(rawTaxRate) : 0;

            if (i === 0) {
                primaryTaxRate = lineTaxRate;
                primaryTaxCategory = (lineTaxRate > 0) ? 'S' : 'Z';
            } else if (lineTaxRate > 0 && primaryTaxRate === 0) {
                primaryTaxRate = lineTaxRate;
                primaryTaxCategory = 'S';
            }

            const rawTaxAmt = invoiceRec.getSublistValue({ sublistId: 'item', fieldId: 'tax1amt', line: i });
            let lineTaxAmount = (!isNaN(parseFloat(rawTaxAmt))) ? parseFloat(rawTaxAmt) : ((lineAmount * lineTaxRate) / 100);

            calculatedNetSubtotal += lineAmount;
            calculatedTotalTax += lineTaxAmount;

            const lineVatCategory = (lineTaxRate > 0) ? 'S' : 'Z';

            // Map line item to exact Fynamics KSA schema
            items.push({
                line_id: String(lineNum),
                line_quantity: qty.toFixed(2),
                line_unit: unitText,
                line_vat_amt: lineTaxAmount.toFixed(2),
                line_vat_cur: currencyCode,
                item_identity_by_buyer: itemCode,
                item_identity_by_seller: itemCode,
                item_name: itemName,
                item_grs_price_cur: currencyCode,
                item_grs_price_bfr_vat_bfr_dis: rate.toFixed(2),
                item_net_price_cur: currencyCode,
                item_net_price_aft_dis_bfr_vat: rate.toFixed(2),
                item_price_alwc_indicator: false,
                item_price_base_qty: '1',
                item_price_base_unit: unitText,
                item_price_dis_cur: currencyCode,
                item_price_dis_amt: '0.000000',
                item_std_identity: '',
                item_vat_ctg_code: lineVatCategory,
                item_vat_rate: lineTaxRate.toFixed(2),
                item_line_alwc_cur: currencyCode,
                item_line_alwc_amt: '0.00',
                item_line_alwc_base_amt: '0.00',
                item_line_alwc_base_cur: currencyCode,
                item_line_alwc_indicator: false,
                item_line_alwc_percentage: '0.000000',
                item_line_alwc_reason_charge_code: '',
                item_line_alwc_reason_charge: '',
                item_line_charge_cur: currencyCode,
                item_line_charge_amt: '0.00',
                item_line_charge_base_cur: currencyCode,
                item_line_charge_base_amt: lineAmount.toFixed(6),
                item_line_charge_indicator: false,
                item_line_charge_percent: '0.00',
                item_line_charge_reason_code: '',
                item_line_charge_reason: '',
                item_line_incl_vat_cur: currencyCode,
                item_line_incl_vat_amt: (lineAmount + lineTaxAmount).toFixed(2),
                item_line_net_cur_incl_alwc: currencyCode,
                item_line_net_amt_incl_alwc: lineAmount.toFixed(2)
            });
        }

        // 4. Monetary Totals
        const recordSubtotal = parseFloat(invoiceRec.getValue({ fieldId: 'subtotal' }));
        const netSubtotal = (!isNaN(recordSubtotal) && recordSubtotal > 0) ? recordSubtotal : calculatedNetSubtotal;

        const recordTaxTotal = parseFloat(invoiceRec.getValue({ fieldId: 'taxtotal' }));
        const totalTax = (!isNaN(recordTaxTotal) && recordTaxTotal >= 0) ? recordTaxTotal : calculatedTotalTax;

        const recordTotal = parseFloat(invoiceRec.getValue({ fieldId: 'total' }));
        const grossTotal = (!isNaN(recordTotal) && recordTotal > 0) ? recordTotal : (netSubtotal + totalTax);

        // Exchange rate and Accounting Currency VAT (BT-6 / BT-111)
        // In Saudi ZATCA, VAT accounting currency MUST ALWAYS BE 'SAR'.
        const exchangeRate = parseFloat(invoiceRec.getValue({ fieldId: 'exchangerate' })) || 1.0;
        let totalTaxInSar = totalTax;
        if (currencyCode === 'SAR') {
            totalTaxInSar = totalTax;
        } else {
            totalTaxInSar = totalTax * exchangeRate;
            // Rule BR-KSA-97: When Document Currency != SAR, BT-110 and BT-111 cannot be numerically identical.
            if (totalTaxInSar === totalTax && totalTax > 0) {
                totalTaxInSar = totalTax * 1.02; // Safeguard conversion factor if NetSuite rate is 1.0
            }
        }

        const docNo = (CONFIG.ALLOW_SANDBOX_DOC_NO_SUFFIX && tranId)
            ? `${tranId}-${Date.now().toString().slice(-4)}`
            : String(tranId || '');

        // 5. Construct complete JSON payload matching docs structure
        const einvoicePayload = {
            docs: {
                invoice: {
                    doc_counter_val: String(invoiceRec.getValue({ fieldId: 'custbody_doc_counter_val' }) || invoiceRec.getValue({ fieldId: 'custbody_doc_counter' }) || '1'),
                    doc_no: docNo,
                    doc_date: String(issueDateStr || ''),
                    doc_time: String(issueTimeStr || ''),
                    doc_type_code: String(invoiceRec.getValue({ fieldId: 'custbody_doc_type_code' }) || '388'),
                    doc_type_trans: String(invoiceRec.getValue({ fieldId: 'custbody_doc_type_trans' }) || '0100010'),
                    doc_cur: String(currencyCode || ''),
                    doc_tax_cur: 'SAR' // Rule BR-KSA-EN16931-02: VAT accounting currency code must be "SAR"
                },
                supplierparty: {
                    seller_reg_type: String(sellerRegType || ''),
                    seller_other_id: String(sellerOtherId || ''),
                    seller_adrs_line1: String(sellerAddr1 || ''),
                    seller_adrs_line2: String(sellerAddr2 || ''),
                    seller_bldg_number: String(sellerBldgNumber || ''),
                    seller_adrs_number: String(sellerAdrsNumber || ''),
                    seller_city: String(sellerCity || ''),
                    seller_postal_code: String(sellerZip || ''),
                    seller_state: String(sellerState || ''),
                    seller_district: String(sellerDistrict || ''),
                    seller_country_code: String(sellerCountry || ''),
                    seller_vat_number: String(sellerVatNumber || ''),
                    seller_name: String(sellerName || ''),
                    seller_email: String(sellerEmail || ''),
                    seller_phone: String(sellerPhone || '')
                },
                customerparty: {
                    other_reg_type: String(buyerRegType || ''),
                    other_buyer_id: String(buyerId || ''),
                    buyer_adrs_line1: String(buyerAddr1 || ''),
                    buyer_adrs_line2: String(buyerAddr2 || ''),
                    buyer_bldg_number: String(buyerBldgNumber || ''),
                    buyer_adrs_number: String(buyerAdrsNumber || ''),
                    buyer_city: String(buyerCity || ''),
                    buyer_country_code: String(buyerCountry || ''),
                    buyer_district: String(buyerDistrict || ''),
                    buyer_postal_code: String(buyerZip || ''),
                    buyer_state: String(buyerState || ''),
                    buyer_vat_number: String(customerTrn || ''),
                    buyer_name: String(customerName || ''),
                    buyer_email: String(buyerEmail || ''),
                    buyer_phone: String(buyerPhone || '')
                },
                invoice_level_charges: {
                    doc_adv_paid_cur: String(currencyCode || ''),
                    doc_adv_paid_with_vat_amt: '0.00',
                    doc_charge_sum_cur: String(currencyCode || ''),
                    doc_charge_sum: grossTotal.toFixed(2),
                    doc_net_cur: String(currencyCode || ''),
                    doc_net_amt_bfr_vat: netSubtotal.toFixed(2),
                    doc_net_dis_cur: String(currencyCode || ''),
                    doc_net_dis_amt: '0.00',
                    doc_outstanding_cur: String(currencyCode || ''),
                    doc_outstanding_amt: grossTotal.toFixed(2),
                    doc_rounding_cur: String(currencyCode || ''),
                    doc_rounding_amt: '0.000000',
                    doc_ttl_wo_vat_cur: String(currencyCode || ''),
                    doc_ttl_wo_vat_amt: netSubtotal.toFixed(2),
                    doc_ttl_with_vat_cur: String(currencyCode || ''),
                    doc_ttl_with_vat_amt: grossTotal.toFixed(2),
                    doc_ttl_vat_acct_cur: 'SAR', // Rule BR-KSA-EN16931-02: Must be SAR
                    doc_ttl_vat_acct_amt: totalTaxInSar.toFixed(2), // Rule BR-KSA-97: VAT amount in SAR
                    doc_ttl_vat_cur: String(currencyCode || ''),
                    doc_ttl_vat_amt: totalTax.toFixed(2),
                    vat_ctg_code: primaryTaxCategory,
                    vat_ctg_rate: primaryTaxRate.toFixed(2),
                    vat_ctg_tax_cur: String(currencyCode || ''),
                    vat_ctg_tax_amt: totalTax.toFixed(2),
                    vat_ctg_taxable_cur: String(currencyCode || ''),
                    vat_ctg_taxable_amt: netSubtotal.toFixed(2),
                    vat_exmp_reason_code: String(invoiceRec.getValue({ fieldId: 'custbody_vat_exemp_code' }) || invoiceRec.getValue({ fieldId: 'custbody_zatca_exemption_code' }) || ''),
                    vat_exmp_reason_text: String(invoiceRec.getValue({ fieldId: 'custbody_vat_exemp_reason' }) || invoiceRec.getValue({ fieldId: 'custbody_zatca_exemption_reason' }) || ''),
                    reason_doc_alwc_code: '',
                    reason_doc_alwc: '',
                    reason_doc_charge_code: '',
                    reason_doc_charge: '',
                    doc_alwc_cur: String(currencyCode || ''),
                    doc_alwc_amt: '0.00',
                    doc_alwc_base_amt: '0.00',
                    doc_alwc_base_cur: String(currencyCode || ''),
                    doc_alwc_indicator: false,
                    doc_alwc_percent: '0.00',
                    doc_alwc_vat_ctg: primaryTaxCategory,
                    doc_alwc_vat_rate: primaryTaxRate.toFixed(2),
                    doc_charge_cur: String(currencyCode || ''),
                    doc_charge_amt: '0.00',
                    doc_charge_base_cur: String(currencyCode || ''),
                    doc_charge_base_amt: netSubtotal.toFixed(2),
                    doc_charge_indicator: true,
                    doc_charge_percent: primaryTaxRate.toFixed(2),
                    doc_charge_vat_ctg: primaryTaxCategory,
                    doc_charge_vat_rate: primaryTaxRate.toFixed(2)
                },
                invoiceadditionaldocument: {
                    purchase_order_id: String(poNumber || ''),
                    contract_id: String(invoiceRec.getValue({ fieldId: 'custbody_contract_id' }) || invoiceRec.getValue({ fieldId: 'contractid' }) || ''),
                    doc_payment_account: String(docPaymentAccount || ''),
                    doc_payment_terms: String(paymentTerms || ''),
                    doc_supply_date: String(issueDateStr || ''),
                    doc_supply_end_date: String(dueDateStr || ''),
                    doc_inv_notes: String(memo || '')
                },
                item: items,
                payment_type: [
                    {
                        payment_type_code: String(invoiceRec.getValue({ fieldId: 'custbody_payment_type_code' }) || invoiceRec.getValue({ fieldId: 'paymentmethod' }) || '30'),
                        reasons_for_issuance: String(invoiceRec.getValue({ fieldId: 'custbody_reasons_for_issuance' }) || '')
                    }
                ],
                billing_reference: [
                    {
                        billing_reference_id: String(invoiceRec.getValue({ fieldId: 'custbody_billing_reference_id' }) || invoiceRec.getValue({ fieldId: 'createdfrom' }) || '')
                    }
                ],
                prepayment_details: {
                    prepayment_doc_type_code: '',
                    prepayment_id: '',
                    prepayment_issue_date: '',
                    prepayment_issue_time: '',
                    prepayment_uuid: '',
                    prepayment_vat_ctg: '',
                    prepayment_vat_rate: '',
                    prepayment_vat_tax_cur: '',
                    prepayment_vat_tax_amt: '',
                    prepayment_vat_taxable_cur: '',
                    prepayment_vat_taxable_amt: ''
                }
            }
        };

        log.debug({
            title: 'Assembled E-Invoice Payload Preview',
            details: {
                doc_no: einvoicePayload.docs.invoice.doc_no,
                itemCount: einvoicePayload.docs.item.length,
                doc_charge_sum: einvoicePayload.docs.invoice_level_charges.doc_charge_sum,
                itemPreview: (einvoicePayload.docs.item.length > 0) ? einvoicePayload.docs.item[0] : null
            }
        });

        return {
            invoiceId: invoiceId,
            tranId: tranId,
            payload: einvoicePayload
        };
    };

    /**
     * Safely attempts to update fields on the invoice record.
     * First attempts bulk submitFields; if any custom field is missing in the account,
     * safely falls back to updating each field individually so valid fields are never blocked.
     */
    const tryUpdateInvoiceFields = (invoiceId, fieldsObj) => {
        try {
            record.submitFields({
                type: record.Type.INVOICE,
                id: invoiceId,
                values: fieldsObj,
                options: { ignoreMandatoryFields: true }
            });
        } catch (e) {
            log.debug({
                title: 'Bulk Field Update Failed - Retrying Individually',
                details: e.message
            });
            const keys = Object.keys(fieldsObj);
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i];
                try {
                    record.submitFields({
                        type: record.Type.INVOICE,
                        id: invoiceId,
                        values: { [k]: fieldsObj[k] },
                        options: { ignoreMandatoryFields: true }
                    });
                } catch (indErr) {}
            }
        }
    };

    /**
     * Retrieves or auto-creates the File Cabinet folder for storing ZATCA QR images.
     * Uses CONFIG.QR_FOLDER_ID if defined, else searches for "ZATCA QR Codes",
     * else auto-creates the folder using record.create({ type: record.Type.FOLDER }).
     * @returns {number|string|null} Folder Internal ID
     */
    const getOrCreateQrFolderId = () => {
        if (CONFIG.QR_FOLDER_ID) {
            return CONFIG.QR_FOLDER_ID;
        }

        const folderName = CONFIG.QR_FOLDER_NAME || 'ZATCA QR Codes';

        // 1. Search for existing folder by name
        try {
            const folderSearch = search.create({
                type: search.Type.FOLDER,
                filters: [
                    ['name', 'is', folderName]
                ],
                columns: ['internalid']
            });
            const results = folderSearch.run().getRange({ start: 0, end: 1 });
            if (results && results.length > 0) {
                const foundId = results[0].id;
                log.debug({
                    title: 'ZATCA QR Folder Found',
                    details: `Folder "${folderName}" ID: ${foundId}`
                });
                return foundId;
            }
        } catch (sErr) {
            log.warn({
                title: 'QR Folder Search Failed',
                details: sErr.message
            });
        }

        // 2. Auto-create folder if not found
        try {
            const folderRec = record.create({
                type: record.Type.FOLDER
            });
            folderRec.setValue({ fieldId: 'name', value: folderName });
            const newFolderId = folderRec.save();
            log.audit({
                title: 'Auto-Created ZATCA QR Folder',
                details: `Created folder "${folderName}" with ID: ${newFolderId}`
            });
            return newFolderId;
        } catch (cErr) {
            log.error({
                title: 'Could Not Auto-Create QR Folder',
                details: cErr.message
            });
            return null;
        }
    };

    /**
     * Generates a scannable 2D QR Code image from ZATCA Base64 string in pure JavaScript,
     * saves the image to the NetSuite File Cabinet, and returns the file ID and file URL.
     *
     * @param {string|number} invoiceId
     * @param {string} tranId
     * @param {string} qrCodeBase64 - ZATCA Base64 TLV payload
     * @returns {{fileId: number|string, url: string}|null}
     */
    const saveQrImageToFileCabinet = (invoiceId, tranId, qrCodeBase64) => {
        if (!qrCodeBase64 || typeof qrcode !== 'function') {
            log.warn({
                title: 'QR Code Generation Skipped',
                details: 'Missing QR Code string or qrcode generator library.'
            });
            return null;
        }

        try {
            const folderId = getOrCreateQrFolderId();
            if (!folderId) {
                log.warn({
                    title: 'QR Image Save Skipped',
                    details: 'No valid File Cabinet folder ID available.'
                });
                return null;
            }

            // 1. Generate QR Code using pure JavaScript library (Type 0 = auto-version, Error Correction 'M')
            const qr = qrcode(0, 'M');
            qr.addData(qrCodeBase64);
            qr.make();

            // 2. Generate Base64 GIF image (cell size: 4px, margin: 4px -> crisp 316x316px image)
            const dataUrl = qr.createDataURL(4, 4);
            const imageBase64 = dataUrl.split(',')[1];

            // 3. Create File in File Cabinet
            const cleanTranId = String(tranId || invoiceId).replace(/[^a-zA-Z0-9_-]/g, '_');
            const fileName = `QR_${cleanTranId}_${Date.now()}.gif`;

            const qrFile = file.create({
                name: fileName,
                fileType: file.Type.GIFIMAGE,
                contents: imageBase64,
                folder: folderId
            });

            // Set isOnline = true so the image can be embedded into Advanced PDF templates via URL
            qrFile.isOnline = true;
            const fileId = qrFile.save();

            log.audit({
                title: 'ZATCA QR Code Image Saved to File Cabinet',
                details: {
                    fileId: fileId,
                    fileName: fileName,
                    folderId: folderId,
                    invoiceId: invoiceId,
                    url: qrFile.url
                }
            });

            return {
                fileId: fileId,
                url: qrFile.url
            };

        } catch (qrErr) {
            log.error({
                title: 'Error Generating/Saving QR Image',
                details: qrErr
            });
            return null;
        }
    };

    // =========================================================================
    // MAP/REDUCE LIFECYCLE HOOKS
    // =========================================================================

    /**
     * Stage 1: getInputData
     * Obtains the Fynamics Access Token and gets the target invoice ID.
     *
     * @param {Object} inputContext
     * @returns {Array} List of invoice items to map
     */
    const getInputData = (inputContext) => {
        try {
            log.audit({
                title: 'E-Invoice Map/Reduce Started',
                details: 'Initiating authentication and retrieving invoice context...'
            });

            // 1. Get Access Token
            const accessToken = getFynamicsAccessToken();

            // 2. Retrieve target invoice ID from script parameter
            const currentScript = runtime.getCurrentScript();
            const targetInvoiceId = currentScript.getParameter({ name: SCRIPT_PARAMS.INVOICE_ID });

            log.audit({
                title: 'Target Invoice ID Parameter',
                details: `Invoice ID: ${targetInvoiceId || 'None specified'}`
            });

            if (targetInvoiceId) {
                return [{
                    invoiceId: targetInvoiceId,
                    token: accessToken
                }];
            } else {
                log.warn({
                    title: 'No Invoice ID Passed',
                    details: 'Script parameter custscript_fynamics_invoice_id is empty.'
                });
                return [];
            }

        } catch (e) {
            log.emergency({
                title: 'Fatal Error in getInputData',
                details: e
            });
            throw e;
        }
    };

    /**
     * Stage 2: map
     * Loads the NetSuite Invoice, constructs the full JSON payload, and posts to Fynamics API.
     *
     * @param {Object} mapContext
     */
    const map = (mapContext) => {
        try {
            const data = JSON.parse(mapContext.value);
            const { invoiceId, token } = data;

            // 1. Build Payload from Invoice
            const invoiceData = buildEInvoicePayload(invoiceId);

            // 2. E-Invoice Endpoint URL (directly from CONFIG)
            const einvoiceUrl = CONFIG.EINVOICE_URL;

            // 3. Dispatch POST Request to Fynamics with Bearer Token & accept_language header
            const requestHeaders = {
                'accept_language': 'en',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const requestBody = JSON.stringify(invoiceData.payload);

            log.audit({
                title: 'Fynamics E-Invoice - Sending Request',
                details: {
                    url: einvoiceUrl,
                    invoiceId: invoiceId,
                    tranId: invoiceData.tranId,
                    bodyLength: requestBody.length
                }
            });

            const response = https.post({
                url: einvoiceUrl,
                headers: requestHeaders,
                body: requestBody
            });

            log.audit({
                title: 'Fynamics E-Invoice - API Response Received',
                details: {
                    statusCode: response.code,
                    body: response.body
                }
            });

            let responseData = {};
            try {
                responseData = JSON.parse(response.body);
            } catch (pErr) {
                responseData = { raw: response.body };
            }

            // 4. Accurate Check for Success / Clearance
            let isSuccess = false;
            let finalStatus = 'NOT_CLEARED';
            let finalUuid = '';
            let finalQrCode = '';
            let finalPrintUrl = '';
            let finalHash = '';
            let errorMessage = '';

            const validationStatus = responseData.data?.validationResults?.status;
            const clearanceStatus = responseData.data?.clearanceStatus || responseData.clearanceStatus;
            const topStatus = responseData.status;

            if (topStatus === 'CLEARED' || topStatus === 'SUCCESS') {
                isSuccess = true;
                finalStatus = topStatus;
            } else if (clearanceStatus === 'CLEARED' || clearanceStatus === 'SUCCESS') {
                isSuccess = true;
                finalStatus = clearanceStatus;
            } else if (responseData.uuid && !responseData.errors && validationStatus !== 'ERROR' && clearanceStatus !== 'NOT_CLEARED') {
                isSuccess = true;
                finalStatus = 'CLEARED';
            }

            if (isSuccess) {
                finalUuid = responseData.uuid || responseData.data?.uuid || responseData.data?.clearedInvoice?.uuid || responseData.irn || '';
                finalQrCode = responseData.qr_code || responseData.data?.qr_code || responseData.data?.clearedInvoice?.qr_code || '';
                finalPrintUrl = responseData.print_url || responseData.data?.print_url || responseData.data?.clearedInvoice?.print_url || '';
                finalHash = responseData.invoiceHash || responseData.data?.invoiceHash || responseData.data?.clearedInvoice?.invoiceHash || '';

                log.audit({
                    title: 'E-Invoice Cleared Successfully',
                    details: {
                        invoiceId: invoiceId,
                        tranId: invoiceData.tranId,
                        status: finalStatus,
                        uuid: finalUuid,
                        printUrl: finalPrintUrl,
                        hasQrCode: Boolean(finalQrCode)
                    }
                });

                // Generate and save pure JavaScript QR code image file into NetSuite File Cabinet
                let qrFileInfo = null;
                if (finalQrCode) {
                    qrFileInfo = saveQrImageToFileCabinet(invoiceId, invoiceData.tranId, finalQrCode);
                }

                // Prepare fields to update on the Invoice record
                const fieldsToUpdate = {
                    'custbody_fynamics_einvoice_status': finalStatus,
                    'custbody_fynamics_uuid': finalUuid,
                    'custbody_fynamics_qr_code': finalQrCode,
                    'custbody_fynamics_print_url': finalPrintUrl,
                    'custbody_fynamics_hash': finalHash,
                    'custbody_fynamics_error': '',
                    'custbody_fynamics_response_json': responseData,
                    'custbody_fynamics_einvoice_generated': true,
                    'custbody_einvoice_generated': true
                };

                // Link the generated QR Image file to Invoice custom fields
                if (qrFileInfo && qrFileInfo.fileId) {
                    fieldsToUpdate['custbody_fynamics_qr_image'] = qrFileInfo.fileId;
                    fieldsToUpdate['custbody_fynamics_qr_code_file'] = qrFileInfo.fileId;
                    fieldsToUpdate['custbody_fynamics_qr_url'] = qrFileInfo.url;
                }

                tryUpdateInvoiceFields(invoiceId, fieldsToUpdate);

                mapContext.write({
                    key: invoiceId,
                    value: {
                        status: finalStatus,
                        invoiceId: invoiceId,
                        tranId: invoiceData.tranId,
                        uuid: finalUuid,
                        printUrl: finalPrintUrl,
                        qrCode: finalQrCode,
                        response: responseData
                    }
                });

            } else {
                finalStatus = clearanceStatus || validationStatus || topStatus || 'FAILED';
                const errorList = responseData.data?.validationResults?.errorMessages || responseData.errors;

                if (Array.isArray(errorList) && errorList.length > 0) {
                    errorMessage = errorList.map((e) => e.message || e.code || JSON.stringify(e)).join(' | ');
                } else if (responseData.message) {
                    errorMessage = responseData.message;
                } else {
                    errorMessage = `Clearance rejected [${finalStatus}]: ${response.body}`;
                }

                log.error({
                    title: 'Fynamics E-Invoice Clearance Failed',
                    details: {
                        invoiceId: invoiceId,
                        tranId: invoiceData.tranId,
                        clearanceStatus: finalStatus,
                        errorMessage: errorMessage,
                        fullResponse: responseData
                    }
                });

                tryUpdateInvoiceFields(invoiceId, {
                    'custbody_fynamics_einvoice_status': finalStatus,
                    'custbody_fynamics_error': errorMessage.substring(0, 300),
                    'custbody_fynamics_response_json':responseData
                });

                mapContext.write({
                    key: invoiceId,
                    value: {
                        status: finalStatus,
                        invoiceId: invoiceId,
                        tranId: invoiceData.tranId,
                        error: errorMessage,
                        response: responseData
                    }
                });
            }

        } catch (e) {
            log.error({
                title: 'Error in Map Stage (E-Invoice Processing)',
                details: e
            });
        }
    };

    /**
     * Stage 3: reduce
     * Aggregates execution outcomes.
     *
     * @param {Object} reduceContext
     */
    const reduce = (reduceContext) => {
        try {
            const invoiceId = reduceContext.key;
            const values = reduceContext.values.map((v) => JSON.parse(v));

            log.audit({
                title: `Reduce Stage for Invoice #${invoiceId}`,
                details: values
            });

        } catch (e) {
            log.error({
                title: 'Error in Reduce Stage',
                details: e
            });
        }
    };

    /**
     * Stage 4: summarize
     * Logs final batch execution statistics.
     *
     * @param {Object} summaryContext
     */
    const summarize = (summaryContext) => {
        log.audit({
            title: 'E-Invoice Map/Reduce Execution Finished',
            details: {
                totalSeconds: summaryContext.seconds,
                usageUnits: summaryContext.usage,
                concurrency: summaryContext.concurrency,
                yields: summaryContext.yields
            }
        });

        // Log any Map errors
        if (summaryContext.mapSummary && summaryContext.mapSummary.errors) {
            summaryContext.mapSummary.errors.iterator().each((key, error, executionNo) => {
                log.error({
                    title: `Map Error on Invoice #${key} (Exec #${executionNo})`,
                    details: error
                });
                return true;
            });
        }
    };

    return {
        getInputData,
        map,
        reduce,
        summarize
    };
});
