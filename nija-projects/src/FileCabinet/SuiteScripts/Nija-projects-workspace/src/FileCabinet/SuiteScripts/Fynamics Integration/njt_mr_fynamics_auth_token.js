/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 *
 * Script Name: Fynamics UAE - OAuth Token Authentication (Map/Reduce)
 * File Name: njt_mr_fynamics_auth_token.js
 * Description: Obtains OAuth 2.0 Access Token from Fynamics UAE E-Invoicing API
 *              via HTTP POST (application/x-www-form-urlencoded) using Client ID & Client Secret.
 *              No custom records are used to store the token.
 *
 * Reference Fetch Implementation:
 * fetch('https://sandbox-uae.fynamicstax.com/api/partner/auth/authenticate', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/x-www-form-urlencoded',
 *     Authorization: 'Basic clientId:clientSecret'
 *   },
 *   body: new URLSearchParams({
 *     grant_type: 'client_credentials',
 *     scope: 'read write'
 *   })
 * })
 */

define([
    'N/https',
    'N/encode',
    'N/runtime',
    'N/log'
], (https, encode, runtime, log) => {

    // =========================================================================
    // SCRIPT CONFIGURATION DEFAULTS
    // (Can be overridden via Script Parameters in NetSuite UI / Deployment)
    // =========================================================================
    const DEFAULT_CONFIG = {
        SANDBOX_AUTH_URL: 'https://sandbox-uae.fynamicstax.com/api/partner/auth/authenticate',
        PRODUCTION_AUTH_URL: 'https://uae.fynamicstax.com/api/partner/auth/authenticate',
        GRANT_TYPE: 'client_credentials',
        SCOPE: 'read write',
        DEFAULT_EXPIRY_SECONDS: 3600, // 1 hour token validity
        CLIENT_ID: '',                // Set via script parameter custscript_fynamics_client_id
        CLIENT_SECRET: ''             // Set via script parameter custscript_fynamics_client_secret
    };

    // Script Parameter IDs
    // const SCRIPT_PARAMS = {
    //     AUTH_URL: 'custscript_fynamics_auth_url',
    //     CLIENT_ID: 'custscript_fynamics_client_id',
    //     CLIENT_SECRET: 'custscript_fynamics_client_secret',
    //     BASIC_AUTH: 'custscript_fynamics_basic_auth',
    //     GRANT_TYPE: 'custscript_fynamics_grant_type',
    //     SCOPE: 'custscript_fynamics_scope'
    // };
    const SCRIPT_PARAMS = {
        AUTH_URL: 'https://sandbox-ksa.fynamicstax.com/api/partner/auth/authenticate',
        CLIENT_ID: 'api-2e09338c-7819-4164-aab0-c8bf96f0e78a',
        CLIENT_SECRET: 'VvtPSpGZFTYrTZhW2PqJfQXxg6zUai7A',
        GRANT_TYPE: 'client_credentials',
        SCOPE: 'read write'
    };
    /**
     * Helper: Builds application/x-www-form-urlencoded payload body
     * Equivalent to: new URLSearchParams({ grant_type: '...', scope: '...' }).toString()
     *
     * @param {Object} paramsObj
     * @returns {string} URL-encoded query string
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
     * Helper: Constructs the Authorization Header using Client ID and Client Secret.
     * Supports:
     * 1. Direct custom header string from script parameter (e.g. "Basic clientId:clientSecret" or Base64 string)
     * 2. RFC 7617 standard Base64 encoding of "clientId:clientSecret"
     * 3. Plain literal "Basic clientId:clientSecret"
     *
     * @param {string} clientId
     * @param {string} clientSecret
     * @param {string} directAuth
     * @param {boolean} useBase64
     * @returns {string} Formatted Authorization header
     */
    const buildAuthorizationHeader = (clientId, clientSecret, directAuth, useBase64 = true) => {
        // Priority 1: User explicitly provided direct Basic header
        if (directAuth && directAuth.trim()) {
            const trimmed = directAuth.trim();
            return trimmed.startsWith('Basic ') ? trimmed : `Basic ${trimmed}`;
        }

        const safeId = (clientId || '').trim();
        const safeSecret = (clientSecret || '').trim();

        if (useBase64) {
            // RFC 7617 Standard: Basic base64(clientId:clientSecret)
            const credentials = `${safeId}:${safeSecret}`;
            const encoded = encode.convert({
                string: credentials,
                inputEncoding: encode.Encoding.UTF_8,
                outputEncoding: encode.Encoding.BASE_64
            });
            return `Basic ${encoded}`;
        } else {
            // Literal plain: Basic clientId:clientSecret
            return `Basic ${safeId}:${safeSecret}`;
        }
    };

    /**
     * Executes the HTTP POST authentication call to Fynamics API.
     * Includes automatic retry with plain Basic format if Base64 returns 401 Unauthorized (or vice versa).
     *
     * @param {Object} config
     * @returns {Object} Result object containing success status, token data, or error details
     */
    const authenticateWithFynamics = (config) => {
        const authUrl = config.authUrl;
        const bodyPayload = buildUrlEncodedBody({
            grant_type: config.grantType,
            scope: config.scope
        });

        // Determine initial Authorization header using Client ID and Client Secret
        let authHeader = buildAuthorizationHeader(
            config.clientId,
            config.clientSecret,
            config.directAuth,
            true // Standard Base64 first
        );

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': authHeader
        };

        log.audit({
            title: 'Fynamics Auth - Dispatching POST Request',
            details: {
                url: authUrl,
                contentType: headers['Content-Type'],
                authHeaderFormat: authHeader.substring(0, 10) + '...',
                body: bodyPayload
            }
        });

        let response = https.post({
            url: authUrl,
            headers: headers,
            body: bodyPayload
        });

        log.debug({
            title: 'Fynamics Auth - Initial Response Received',
            details: `Status Code: ${response.code} | Body Length: ${(response.body || '').length}`
        });

        // If Base64 returned 401 Unauthorized and directAuth wasn't hardcoded, retry with literal Basic clientId:clientSecret
        if (response.code === 401 && !config.directAuth && config.clientId && config.clientSecret) {
            log.warn({
                title: 'Fynamics Auth - 401 with Base64 Auth',
                details: 'Retrying authentication with literal Basic clientId:clientSecret format...'
            });

            const fallbackAuthHeader = buildAuthorizationHeader(
                config.clientId,
                config.clientSecret,
                null,
                false // Literal plain format
            );

            headers['Authorization'] = fallbackAuthHeader;
            response = https.post({
                url: authUrl,
                headers: headers,
                body: bodyPayload
            });

            log.debug({
                title: 'Fynamics Auth - Fallback Response Received',
                details: `Status Code: ${response.code}`
            });
        }

        // Evaluate Response
        if (response.code === 200) {
            try {
                const responseData = JSON.parse(response.body);
                const tokenData = responseData.data || responseData;

                const accessToken = tokenData.access_token || tokenData.token;
                const tokenType = tokenData.token_type || 'Bearer';
                const expiresIn = parseInt(tokenData.expires_in, 10) || DEFAULT_CONFIG.DEFAULT_EXPIRY_SECONDS;

                if (!accessToken) {
                    throw new Error(`Authentication responded with HTTP 200, but no access_token found in body: ${response.body}`);
                }

                const acquiredAt = new Date();
                const expiresAt = new Date(acquiredAt.getTime() + (expiresIn * 1000));

                log.audit({
                    title: 'Fynamics Auth - Success',
                    details: {
                        message: 'Access Token acquired successfully.',
                        tokenType: tokenType,
                        expiresInSeconds: expiresIn,
                        acquiredAt: acquiredAt.toISOString(),
                        expiresAt: expiresAt.toISOString(),
                        tokenSample: `${accessToken.substring(0, 15)}...${accessToken.slice(-8)}`
                    }
                });

                return {
                    success: true,
                    statusCode: response.code,
                    accessToken: accessToken,
                    tokenType: tokenType,
                    expiresIn: expiresIn,
                    acquiredAt: acquiredAt.toISOString(),
                    expiresAt: expiresAt.toISOString(),
                    rawResponse: responseData
                };

            } catch (parseError) {
                log.error({
                    title: 'Fynamics Auth - JSON Parsing Error',
                    details: `Failed to parse response body: ${parseError.message} | Raw Body: ${response.body}`
                });
                return {
                    success: false,
                    statusCode: response.code,
                    error: `JSON parse error: ${parseError.message}`,
                    rawBody: response.body
                };
            }
        } else {
            log.error({
                title: 'Fynamics Auth - HTTP Error',
                details: `HTTP Status ${response.code}: ${response.body}`
            });
            return {
                success: false,
                statusCode: response.code,
                error: `HTTP ${response.code}`,
                rawBody: response.body
            };
        }
    };

    /**
     * Loads script configuration from script parameters or defaults.
     * @returns {Object}
     */
    const loadConfiguration = () => {
        const currentScript = runtime.getCurrentScript();

        // const authUrl = currentScript.getParameter({ name: SCRIPT_PARAMS.AUTH_URL }) || DEFAULT_CONFIG.SANDBOX_AUTH_URL;
        const authUrl = "https://sandbox-ksa.fynamicstax.com/api/partner/auth/authenticate";
        // Supports custscript_fynamics_client_id (or legacy custscript_fynamics_username)
        // const clientId = currentScript.getParameter({ name: SCRIPT_PARAMS.CLIENT_ID }) 
        //     || currentScript.getParameter({ name: 'custscript_fynamics_username' }) 
        //     || DEFAULT_CONFIG.CLIENT_ID;
        const clientId = SCRIPT_PARAMS.CLIENT_ID;
        const clientSecret = SCRIPT_PARAMS.CLIENT_SECRET;
        // Supports custscript_fynamics_client_secret (or legacy custscript_fynamics_password)
        // const clientSecret = currentScript.getParameter({ name: SCRIPT_PARAMS.CLIENT_SECRET }) 
        //     || currentScript.getParameter({ name: 'custscript_fynamics_password' }) 
        //     || DEFAULT_CONFIG.CLIENT_SECRET;

        // const directAuth = currentScript.getParameter({ name: SCRIPT_PARAMS.BASIC_AUTH }) || '';
        const grantType = SCRIPT_PARAMS.GRANT_TYPE;
        const scope = SCRIPT_PARAMS.SCOPE;

        return {
            authUrl,
            clientId,
            clientSecret,
            // directAuth,
            grantType,
            scope
        };
    };

    // =========================================================================
    // MAP/REDUCE LIFECYCLE HOOKS
    // =========================================================================

    /**
     * Stage 1: getInputData
     * Obtains the access token via POST to Fynamics API using Client ID & Client Secret.
     * Passes the token payload into the Map stage.
     *
     * @param {Object} inputContext
     * @returns {Array|Object}
     */
    const getInputData = (inputContext) => {
        try {
            log.audit({
                title: 'Map/Reduce Stage: getInputData Started',
                details: 'Initiating Fynamics OAuth 2.0 authentication handshake with Client ID & Client Secret...'
            });

            const config = loadConfiguration();
            const authResult = authenticateWithFynamics(config);

            if (authResult.success) {
                // Pass token payload to Map stage
                return [{
                    id: 'FYNAMICS_AUTH_SESSION',
                    success: true,
                    accessToken: authResult.accessToken,
                    tokenType: authResult.tokenType,
                    expiresIn: authResult.expiresIn,
                    acquiredAt: authResult.acquiredAt,
                    expiresAt: authResult.expiresAt
                }];
            } else {
                log.error({
                    title: 'Authentication Failed in getInputData',
                    details: authResult
                });

                // Return error item so map/summarize stages can report failure cleanly
                return [{
                    id: 'FYNAMICS_AUTH_ERROR',
                    success: false,
                    error: authResult.error,
                    statusCode: authResult.statusCode,
                    rawBody: authResult.rawBody
                }];
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
     * Processes token object and logs acquisition details.
     *
     * @param {Object} mapContext
     */
    const map = (mapContext) => {
        try {
            const data = JSON.parse(mapContext.value);

            if (!data.success) {
                log.error({
                    title: 'Map Stage - Skipping Due to Auth Failure',
                    details: data
                });
                mapContext.write({
                    key: 'AUTH_FAILED',
                    value: data
                });
                return;
            }

            log.audit({
                title: 'Map Stage - Token Verified',
                details: {
                    tokenType: data.tokenType,
                    expiresIn: data.expiresIn,
                    acquiredAt: data.acquiredAt,
                    expiresAt: data.expiresAt,
                    accessTokenSample: `${data.accessToken.substring(0, 12)}...${data.accessToken.slice(-6)}`
                }
            });

            mapContext.write({
                key: 'FYNAMICS_TOKEN_SESSION',
                value: {
                    status: 'AUTHENTICATED',
                    tokenType: data.tokenType,
                    expiresIn: data.expiresIn,
                    acquiredAt: data.acquiredAt,
                    expiresAt: data.expiresAt,
                    accessToken: data.accessToken
                }
            });

        } catch (e) {
            log.error({
                title: 'Error in Map Stage',
                details: e
            });
        }
    };

    /**
     * Stage 3: reduce
     * Consolidates output and confirms token ready state.
     *
     * @param {Object} reduceContext
     */
    const reduce = (reduceContext) => {
        try {
            const key = reduceContext.key;
            const values = reduceContext.values.map((v) => JSON.parse(v));

            log.audit({
                title: `Reduce Stage: Key [${key}]`,
                details: {
                    count: values.length,
                    status: values[0]?.status,
                    expiresAt: values[0]?.expiresAt
                }
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
     * Logs final statistics, execution time, yields, and overall success state.
     *
     * @param {Object} summaryContext
     */
    const summarize = (summaryContext) => {
        log.audit({
            title: 'Map/Reduce Execution Summary',
            details: {
                totalSeconds: summaryContext.seconds,
                usageUnitsConsumed: summaryContext.usage,
                concurrency: summaryContext.concurrency,
                yields: summaryContext.yields
            }
        });

        // Check for Input Errors
        if (summaryContext.inputSummary && summaryContext.inputSummary.error) {
            log.error({
                title: 'Input Stage Error',
                details: summaryContext.inputSummary.error
            });
        }

        // Check for Map Errors
        if (summaryContext.mapSummary && summaryContext.mapSummary.errors) {
            summaryContext.mapSummary.errors.iterator().each((key, error, executionNo) => {
                log.error({
                    title: `Map Error on Key: ${key} (Exec #${executionNo})`,
                    details: error
                });
                return true;
            });
        }

        // Check for Reduce Errors
        if (summaryContext.reduceSummary && summaryContext.reduceSummary.errors) {
            summaryContext.reduceSummary.errors.iterator().each((key, error, executionNo) => {
                log.error({
                    title: `Reduce Error on Key: ${key} (Exec #${executionNo})`,
                    details: error
                });
                return true;
            });
        }

        log.audit({
            title: 'Fynamics OAuth Token Map/Reduce Completed',
            details: 'Script execution finished.'
        });
    };

    return {
        getInputData,
        map,
        reduce,
        summarize
    };
});
