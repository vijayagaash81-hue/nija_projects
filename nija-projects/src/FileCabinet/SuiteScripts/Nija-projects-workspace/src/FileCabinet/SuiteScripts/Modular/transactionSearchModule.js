/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * 
 * Module Name: transactionSearchModule.js
 * Description: Modular SuiteScript 2.1 helper for executing NetSuite Transaction searches.
 */
define(['N/search', 'N/format', 'N/log'], (search, format, log) => {

    /**
     * Converts HTML <input type="date"> (YYYY-MM-DD) or date strings into NetSuite formatted date string.
     * 
     * @param {string} dateStr - Input date string
     * @returns {string|null} Formatted date string for NetSuite search filter
     */
    const formatNetSuiteDate = (dateStr) => {
        if (!dateStr || typeof dateStr !== 'string') return null;
        const trimmed = dateStr.trim();
        if (!trimmed) return null;

        try {
            // Handle HTML5 date input format: YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                const parts = trimmed.split('-');
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                const dateObj = new Date(year, month, day);

                return format.format({
                    value: dateObj,
                    type: format.Type.DATE
                });
            }

            // Fallback: return as-is if already formatted
            return trimmed;
        } catch (e) {
            log.error({
                title: 'Error formatting date in transactionSearchModule',
                details: `Input date: ${dateStr}, Error: ${e.message}`
            });
            return trimmed;
        }
    };

    /**
     * Executes a NetSuite transaction search with dynamic filters.
     * 
     * @param {Object} params - Search filter parameters
     * @param {string} [params.trantype] - Transaction type filter (e.g. 'SalesOrd', 'CustInvc', 'PurchOrd')
     * @param {string} [params.entity] - Entity (Customer/Vendor) name or ID filter
     * @param {string} [params.startDate] - Transaction start date filter
     * @param {string} [params.endDate] - Transaction end date filter
     * @param {string} [params.status] - Transaction status filter
     * @param {number} [params.limit=50] - Maximum number of transaction records to return
     * @returns {Array<Object>} Formatted array of transaction result objects
     */
    const runTransactionSearch = (params = {}) => {
        const results = [];
        try {
            const limit = parseInt(params.limit, 10) || 50;

            // Base filters: Mainline = True to get transaction header records
            const searchFilters = [
                ['mainline', 'is', 'T']
            ];

            // Filter by Transaction Type if provided
            if (params.trantype && params.trantype !== 'ALL') {
                searchFilters.push('AND');
                searchFilters.push(['type', 'anyof', params.trantype]);
            }

            // Filter by Customer / Vendor / Entity if provided
            if (params.entity && params.entity.trim()) {
                searchFilters.push('AND');
                searchFilters.push(['name', 'contains', params.entity.trim()]);
            }

            // Format Date parameters into NetSuite Account Date format
            const formattedStartDate = formatNetSuiteDate(params.startDate);
            const formattedEndDate = formatNetSuiteDate(params.endDate);

            // Filter by Date Range
            if (formattedStartDate && formattedEndDate) {
                searchFilters.push('AND');
                searchFilters.push(['trandate', 'within', formattedStartDate, formattedEndDate]);
            } else if (formattedStartDate) {
                searchFilters.push('AND');
                searchFilters.push(['trandate', 'onorafter', formattedStartDate]);
            } else if (formattedEndDate) {
                searchFilters.push('AND');
                searchFilters.push(['trandate', 'onorbefore', formattedEndDate]);
            }

            log.debug({
                title: 'transactionSearchModule searchFilters',
                details: JSON.stringify(searchFilters)
            });

            // Define Search Columns
            const searchColumns = [
                search.createColumn({ name: 'internalid' }),
                search.createColumn({ name: 'tranid' }),
                search.createColumn({ name: 'type' }),
                search.createColumn({ name: 'trandate', sort: search.Sort.DESC }),
                search.createColumn({ name: 'entity' }),
                search.createColumn({ name: 'amount' }),
                search.createColumn({ name: 'status' }),
                search.createColumn({ name: 'memo' })
            ];

            // Create Transaction Search
            const tranSearch = search.create({
                type: search.Type.TRANSACTION,
                filters: searchFilters,
                columns: searchColumns
            });

            // Execute and parse results
            const searchResultSet = tranSearch.run();
            const rawResults = searchResultSet.getRange({ start: 0, end: limit }) || [];

            rawResults.forEach((row) => {
                results.push({
                    id: row.getValue({ name: 'internalid' }),
                    tranId: row.getValue({ name: 'tranid' }) || `Internal ID #${row.getValue({ name: 'internalid' })}`,
                    type: row.getText({ name: 'type' }) || row.getValue({ name: 'type' }),
                    typeCode: row.getValue({ name: 'type' }),
                    date: row.getValue({ name: 'trandate' }),
                    entity: row.getText({ name: 'entity' }) || row.getValue({ name: 'entity' }) || 'N/A',
                    amount: parseFloat(row.getValue({ name: 'amount' }) || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }),
                    rawAmount: parseFloat(row.getValue({ name: 'amount' }) || 0),
                    status: row.getText({ name: 'status' }) || row.getValue({ name: 'status' }) || 'N/A',
                    memo: row.getValue({ name: 'memo' }) || ''
                });
            });

            log.debug({
                title: 'transactionSearchModule.runTransactionSearch',
                details: `Fetched ${results.length} transactions`
            });

        } catch (error) {
            log.error({
                title: 'Error in transactionSearchModule.runTransactionSearch',
                details: error
            });
            throw error;
        }

        return results;
    };

    /**
     * Helper to get list of transaction types for search dropdowns.
     */
    const getSupportedTransactionTypes = () => {
        return [
            { value: 'ALL', text: 'All Transaction Types' },
            { value: 'SalesOrd', text: 'Sales Order' },
            { value: 'CustInvc', text: 'Invoice' },
            { value: 'PurchOrd', text: 'Purchase Order' },
            { value: 'VendBill', text: 'Vendor Bill' },
            { value: 'CustPymt', text: 'Customer Payment' },
            { value: 'ItemShip', text: 'Item Fulfillment' },
            { value: 'ItemRcpt', text: 'Item Receipt' }
        ];
    };

    return {
        runTransactionSearch,
        getSupportedTransactionTypes
    };
});
