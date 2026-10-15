/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * 
 * Module Name: transactionResultsModule.js
 * Description: Simple, clean White & Grey HTML renderer for Transaction Search results.
 */
define([], () => {

    /**
     * Generates a clean, modern White & Grey HTML page with filter controls and results table.
     * 
     * @param {Object} options
     * @param {Array<Object>} options.results - List of transaction result objects
     * @param {Object} options.filters - Current active filter values
     * @param {Array<Object>} options.transactionTypes - Supported transaction type options
     * @param {string} [options.suiteletUrl] - Suitelet action URL for form submission
     * @returns {string} Fully rendered HTML string
     */
    const renderPageHtml = (options = {}) => {
        const {
            results = [],
            filters = {},
            transactionTypes = [],
            suiteletUrl = ''
        } = options;

        // Calculate KPI summary metrics
        const totalRecords = results.length;
        const totalAmount = results.reduce((sum, item) => sum + (item.rawAmount || 0), 0);
        const avgAmount = totalRecords > 0 ? totalAmount / totalRecords : 0;

        const formattedTotalAmount = totalAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        const formattedAvgAmount = avgAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Build Type Select Options HTML
        const typeOptionsHtml = transactionTypes.map(type => {
            const selected = (filters.trantype || 'ALL') === type.value ? 'selected' : '';
            return `<option value="${type.value}" ${selected}>${type.text}</option>`;
        }).join('');

        // Build Table Rows HTML
        const tableRowsHtml = results.length > 0 ? results.map((item, index) => {
            const statusClass = getStatusBadgeClass(item.status);
            return `
                <tr class="table-row">
                    <td class="cell-center">${index + 1}</td>
                    <td class="cell-bold">
                        <a href="/app/accounting/transactions/transaction.nl?id=${item.id}" target="_blank" class="record-link">
                            ${escapeHtml(item.tranId)}
                        </a>
                    </td>
                    <td><span class="type-pill">${escapeHtml(item.type)}</span></td>
                    <td>${escapeHtml(item.date)}</td>
                    <td><strong>${escapeHtml(item.entity)}</strong></td>
                    <td class="cell-right amount-col">$${escapeHtml(item.amount)}</td>
                    <td><span class="badge ${statusClass}">${escapeHtml(item.status)}</span></td>
                    <td class="cell-memo">${escapeHtml(item.memo || '-')}</td>
                </tr>
            `;
        }).join('') : `
            <tr>
                <td colspan="8" class="no-data">
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>No Transactions Found</h3>
                        <p>Adjust your search filters above to find matching records.</p>
                    </div>
                </td>
            </tr>
        `;

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Transaction Search</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    :root {
                        --bg-main: #f8fafc;
                        --card-bg: #ffffff;
                        --border-color: #e2e8f0;
                        --border-dark: #cbd5e1;
                        --text-main: #1e293b;
                        --text-muted: #64748b;
                        --text-dark: #0f172a;
                        --primary-blue: #2563eb;
                        --primary-hover: #1d4ed8;
                    }

                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    }

                    body {
                        background: var(--bg-main);
                        color: var(--text-main);
                        padding: 16px;
                    }

                    .search-container {
                        max-width: 1350px;
                        margin: 0 auto;
                    }

                    /* Header Title */
                    .page-header {
                        margin-bottom: 20px;
                        padding-bottom: 12px;
                        border-bottom: 2px solid var(--border-color);
                    }

                    .page-header h1 {
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: var(--text-dark);
                    }

                    .page-header p {
                        font-size: 0.875rem;
                        color: var(--text-muted);
                        margin-top: 4px;
                    }

                    /* KPI Summary Cards */
                    .kpi-row {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                        gap: 16px;
                        margin-bottom: 20px;
                    }

                    .kpi-card {
                        background: var(--card-bg);
                        border: 1px solid var(--border-color);
                        border-radius: 8px;
                        padding: 16px 20px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                    }

                    .kpi-card label {
                        font-size: 0.75rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        color: var(--text-muted);
                        letter-spacing: 0.03em;
                    }

                    .kpi-card .kpi-num {
                        font-size: 1.35rem;
                        font-weight: 700;
                        color: var(--text-dark);
                        margin-top: 4px;
                    }

                    /* Filter Form */
                    .filter-card {
                        background: var(--card-bg);
                        border: 1px solid var(--border-color);
                        border-radius: 8px;
                        padding: 20px;
                        margin-bottom: 20px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                    }

                    .filter-title {
                        font-size: 0.95rem;
                        font-weight: 600;
                        color: var(--text-dark);
                        margin-bottom: 14px;
                    }

                    .filter-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                        gap: 14px;
                        align-items: end;
                    }

                    .form-group {
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                    }

                    .form-group label {
                        font-size: 0.8rem;
                        font-weight: 500;
                        color: var(--text-main);
                    }

                    .form-control {
                        background: #ffffff;
                        border: 1px solid var(--border-dark);
                        color: var(--text-dark);
                        padding: 8px 12px;
                        border-radius: 6px;
                        font-size: 0.875rem;
                        outline: none;
                    }

                    .form-control:focus {
                        border-color: var(--primary-blue);
                        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
                    }

                    .btn-group {
                        display: flex;
                        gap: 8px;
                    }

                    .btn-submit {
                        background: var(--primary-blue);
                        color: #ffffff;
                        border: none;
                        padding: 9px 20px;
                        border-radius: 6px;
                        font-weight: 600;
                        font-size: 0.875rem;
                        cursor: pointer;
                        transition: background 0.2s ease;
                    }

                    .btn-submit:hover {
                        background: var(--primary-hover);
                    }

                    .btn-clear {
                        background: #f1f5f9;
                        color: var(--text-main);
                        border: 1px solid var(--border-dark);
                        padding: 9px 16px;
                        border-radius: 6px;
                        font-weight: 500;
                        font-size: 0.875rem;
                        text-decoration: none;
                        display: inline-block;
                    }

                    .btn-clear:hover {
                        background: #e2e8f0;
                    }

                    /* Results Table */
                    .table-card {
                        background: var(--card-bg);
                        border: 1px solid var(--border-color);
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                    }

                    .table-header {
                        padding: 14px 20px;
                        background: #f1f5f9;
                        border-bottom: 1px solid var(--border-color);
                        font-size: 0.95rem;
                        font-weight: 600;
                        color: var(--text-dark);
                    }

                    .table-responsive {
                        overflow-x: auto;
                    }

                    .simple-table {
                        width: 100%;
                        border-collapse: collapse;
                        text-align: left;
                        font-size: 0.85rem;
                    }

                    .simple-table th {
                        background: #f8fafc;
                        color: var(--text-muted);
                        padding: 10px 16px;
                        font-weight: 600;
                        font-size: 0.75rem;
                        text-transform: uppercase;
                        letter-spacing: 0.03em;
                        border-bottom: 1px solid var(--border-color);
                    }

                    .simple-table td {
                        padding: 12px 16px;
                        border-bottom: 1px solid var(--border-color);
                        color: var(--text-main);
                    }

                    .table-row:nth-child(even) {
                        background: #f8fafc;
                    }

                    .table-row:hover {
                        background: #f1f5f9;
                    }

                    .cell-center { text-align: center; }
                    .cell-right { text-align: right; }
                    .cell-bold { font-weight: 600; }
                    .cell-memo { max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-muted); }

                    .record-link {
                        color: var(--primary-blue);
                        text-decoration: none;
                        font-weight: 600;
                    }

                    .record-link:hover {
                        text-decoration: underline;
                    }

                    .type-pill {
                        background: #e2e8f0;
                        color: var(--text-dark);
                        padding: 3px 8px;
                        border-radius: 4px;
                        font-size: 0.75rem;
                        font-weight: 500;
                    }

                    .amount-col {
                        font-family: monospace;
                        font-weight: 700;
                        color: #0f172a;
                    }

                    /* Simple Badges */
                    .badge {
                        padding: 3px 8px;
                        border-radius: 4px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        display: inline-block;
                    }

                    .badge-success { background: #dcfce7; color: #15803d; }
                    .badge-warning { background: #fef9c3; color: #a16207; }
                    .badge-danger { background: #fee2e2; color: #b91c1c; }
                    .badge-info { background: #dbeafe; color: #1d4ed8; }
                    .badge-neutral { background: #f1f5f9; color: #475569; }

                    /* Empty State */
                    .empty-state {
                        text-align: center;
                        padding: 40px 20px;
                    }

                    .empty-icon {
                        font-size: 2.5rem;
                        margin-bottom: 8px;
                        color: var(--text-muted);
                    }

                    .empty-state h3 {
                        font-size: 1rem;
                        color: var(--text-dark);
                        margin-bottom: 4px;
                    }

                    .empty-state p {
                        color: var(--text-muted);
                        font-size: 0.85rem;
                    }
                </style>
            </head>
            <body>

                <div class="search-container">

                    <!-- Page Header -->
                    <div class="page-header">
                        <h1>Transaction Search</h1>
                        <p>Search and filter transaction records</p>
                    </div>

                    <!-- Summary Cards -->
                    <div class="kpi-row">
                        <div class="kpi-card">
                            <label>Total Records</label>
                            <div class="kpi-num">${totalRecords}</div>
                        </div>

                        <div class="kpi-card">
                            <label>Total Amount</label>
                            <div class="kpi-num">$${formattedTotalAmount}</div>
                        </div>

                        <div class="kpi-card">
                            <label>Average Amount</label>
                            <div class="kpi-num">$${formattedAvgAmount}</div>
                        </div>
                    </div>

                    <!-- Search Filter Form -->
                    <div class="filter-card">
                        <div class="filter-title">Filters</div>
                        <form method="GET" action="${suiteletUrl}">
                            <div class="filter-grid">
                                <div class="form-group">
                                    <label for="trantype">Transaction Type</label>
                                    <select name="trantype" id="trantype" class="form-control">
                                        ${typeOptionsHtml}
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="entity">Customer / Vendor</label>
                                    <input type="text" name="entity" id="entity" class="form-control" placeholder="Search Entity..." value="${escapeHtml(filters.entity || '')}">
                                </div>

                                <div class="form-group">
                                    <label for="startDate">Start Date</label>
                                    <input type="date" name="startDate" id="startDate" class="form-control" value="${escapeHtml(filters.startDate || '')}">
                                </div>

                                <div class="form-group">
                                    <label for="endDate">End Date</label>
                                    <input type="date" name="endDate" id="endDate" class="form-control" value="${escapeHtml(filters.endDate || '')}">
                                </div>

                                <div class="form-group">
                                    <label for="limit">Limit</label>
                                    <select name="limit" id="limit" class="form-control">
                                        <option value="25" ${(filters.limit == 25) ? 'selected' : ''}>25 Records</option>
                                        <option value="50" ${(filters.limit == 50 || !filters.limit) ? 'selected' : ''}>50 Records</option>
                                        <option value="100" ${(filters.limit == 100) ? 'selected' : ''}>100 Records</option>
                                        <option value="200" ${(filters.limit == 200) ? 'selected' : ''}>200 Records</option>
                                    </select>
                                </div>

                                <div class="btn-group">
                                    <button type="submit" class="btn-submit">Search</button>
                                    <a href="${suiteletUrl}" class="btn-clear">Reset</a>
                                </div>
                            </div>
                        </form>
                    </div>

                    <!-- Results Table -->
                    <div class="table-card">
                        <div class="table-header">
                            Results (${totalRecords})
                        </div>

                        <div class="table-responsive">
                            <table class="simple-table">
                                <thead>
                                    <tr>
                                        <th class="cell-center" style="width: 50px;">#</th>
                                        <th>Doc #</th>
                                        <th>Type</th>
                                        <th>Date</th>
                                        <th>Customer / Entity</th>
                                        <th class="cell-right">Amount</th>
                                        <th>Status</th>
                                        <th>Memo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRowsHtml}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

            </body>
            </html>
        `;
    };

    /**
     * Determines badge CSS class according to status string.
     */
    const getStatusBadgeClass = (statusStr = '') => {
        const lower = statusStr.toLowerCase();
        if (lower.includes('paid') || lower.includes('approved') || lower.includes('fully billed') || lower.includes('closed') || lower.includes('deposited')) {
            return 'badge-success';
        }
        if (lower.includes('pending') || lower.includes('open') || lower.includes('unapproved') || lower.includes('partially')) {
            return 'badge-warning';
        }
        if (lower.includes('rejected') || lower.includes('cancelled') || lower.includes('overdue')) {
            return 'badge-danger';
        }
        if (lower.includes('in transit') || lower.includes('billed')) {
            return 'badge-info';
        }
        return 'badge-neutral';
    };

    /**
     * Simple HTML escape utility to prevent XSS issues.
     */
    const escapeHtml = (str) => {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    return {
        renderPageHtml
    };
});
