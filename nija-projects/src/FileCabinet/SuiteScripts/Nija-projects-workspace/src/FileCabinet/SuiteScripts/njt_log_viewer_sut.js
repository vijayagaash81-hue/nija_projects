/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * 
 * Description: A centralized modern utility Suitelet to search, filter, and page through script execution logs.
 * Features a modern, custom dark-mode SPA dashboard.
 */
define(['N/search', 'N/format', 'N/url', 'N/runtime', 'N/log'], 
(search, format, url, runtime, log) => {

    /**
     * Fetches all scripts in the system and maps them to their active record type deployments.
     * Also compiles a unique list of all deployed record types.
     */
    function getScriptsAndRecordTypes() {
        const scripts = [];
        const scriptRecordTypeMap = {};
        const recordTypes = new Set();

        // 1. Get Script Deployments and map scripts to record types
        try {
            const sdSearch = search.create({
                type: 'scriptdeployment',
                filters: [['isinactive', 'is', 'F']],
                columns: ['script', 'recordtype']
            });
            const pagedData = sdSearch.runPaged({ pageSize: 1000 });
            let debugCount = 0;
            const debugSamples = [];
            pagedData.pageRanges.forEach((pageRange) => {
                const page = pagedData.fetch({ index: pageRange.index });
                page.data.forEach((result) => {
                    const scriptId = result.getValue('script');
                    const recordType = result.getValue('recordtype');
                    const recordTypeText = result.getText('recordtype');
                    
                    if (debugCount < 15) {
                        debugSamples.push({
                            script: scriptId,
                            recordtype_val: recordType,
                            recordtype_txt: recordTypeText
                        });
                        debugCount++;
                    }

                    // Use either recordType or recordTypeText (fallback)
                    const rType = recordType || recordTypeText;
                    
                    if (scriptId && rType) {
                        recordTypes.add(rType);
                        if (!scriptRecordTypeMap[scriptId]) {
                            scriptRecordTypeMap[scriptId] = [];
                        }
                        if (!scriptRecordTypeMap[scriptId].includes(rType)) {
                            scriptRecordTypeMap[scriptId].push(rType);
                        }
                    }
                });
            });
            log.debug('Script Deployments Samples', debugSamples);
            log.debug('Unique Record Types Found', Array.from(recordTypes));
        } catch (e) {
            log.error('Error fetching script deployments mapping', e);
        }

        // 2. Get All Scripts
        try {
            const scriptSearch = search.create({
                type: 'script',
                columns: [
                    search.createColumn({ name: 'name', sort: search.Sort.ASC }),
                    'scriptid',
                    'scripttype'
                ]
            });
            const pagedData = scriptSearch.runPaged({ pageSize: 1000 });
            pagedData.pageRanges.forEach((pageRange) => {
                const page = pagedData.fetch({ index: pageRange.index });
                page.data.forEach((result) => {
                    const scriptId = result.id;
                    const rTypes = scriptRecordTypeMap[scriptId] || [];
                    scripts.push({
                        id: scriptId,
                        name: result.getValue('name') || result.getValue('scriptid'),
                        scriptid: result.getValue('scriptid'),
                        scripttype: result.getValue('scripttype') || 'Unknown',
                        recordTypes: rTypes
                    });
                });
            });
        } catch (e) {
            log.error('Error fetching all scripts', e);
        }

        return {
            scripts: scripts,
            recordTypes: Array.from(recordTypes).sort()
        };
    }

    /**
     * Fetches all active employees in the system.
     */
    function getEmployees() {
        const employees = [];
        try {
            const empSearch = search.create({
                type: 'employee',
                filters: [['isinactive', 'is', 'F']],
                columns: [
                    search.createColumn({ name: 'entityid', sort: search.Sort.ASC })
                ]
            });
            const pagedData = empSearch.runPaged({ pageSize: 1000 });
            pagedData.pageRanges.forEach((pageRange) => {
                const page = pagedData.fetch({ index: pageRange.index });
                page.data.forEach((result) => {
                    employees.push({
                        id: result.id,
                        name: result.getValue('entityid')
                    });
                });
            });
        } catch (e) {
            log.error('Error fetching employees', e);
        }
        return employees;
    }

    /**
     * Helper to format raw YYYY-MM-DD date inputs into localized NetSuite date strings.
     */
    function formatToUserDate(yyyyMmDd) {
        if (!yyyyMmDd) return '';
        const parts = yyyyMmDd.split('-');
        if (parts.length !== 3) return yyyyMmDd;
        
        try {
            // Construct local Date object
            const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            return format.format({
                value: dateObj,
                type: format.Type.DATE
            });
        } catch (e) {
            log.error('Error parsing date: ' + yyyyMmDd, e);
            return yyyyMmDd;
        }
    }

    const onRequest = (context) => {
        const { request, response } = context;
        const parameters = request.parameters;

        // API Endpoint: Get Scripts list (JSON)
        if (parameters.action === 'getScripts') {
            try {
                const data = getScriptsAndRecordTypes();
                response.setHeader({ name: 'Content-Type', value: 'application/json' });
                response.write(JSON.stringify(data));
            } catch (e) {
                log.error('Error in getScripts API', e);
                response.write(JSON.stringify({ success: false, message: e.message }));
            }
            return;
        }

        // API Endpoint: Get Employees list (JSON)
        if (parameters.action === 'getEmployees') {
            try {
                const employees = getEmployees();
                response.setHeader({ name: 'Content-Type', value: 'application/json' });
                response.write(JSON.stringify(employees));
            } catch (e) {
                log.error('Error in getEmployees API', e);
                response.write(JSON.stringify({ success: false, message: e.message }));
            }
            return;
        }

        // API Endpoint: Get Logs list (JSON)
        if (parameters.action === 'getLogs') {
            try {
                log.debug('getLogs Params', parameters);
                const selScript = parameters.filter_script || '';
                const selUser = parameters.user || '';
                const selLevel = parameters.level || '';
                const selFromDateRaw = parameters.fromdate || '';
                const selToDateRaw = parameters.todate || '';
                const selTitle = parameters.title || '';
                const selDetail = parameters.detail || '';
                let selPage = parseInt(parameters.page, 10) || 0;

                // Format dates to user settings format
                const selFromDate = formatToUserDate(selFromDateRaw);
                const selToDate = formatToUserDate(selToDateRaw);

                // Build search filters
                const filters = [];
                if (selScript) {
                    filters.push(['script.scriptid', 'is', selScript]);
                }
                if (selUser) {
                    if (filters.length > 0) filters.push('AND');
                    filters.push(['user', 'anyof', [selUser]]);
                }
                if (selLevel) {
                    if (filters.length > 0) filters.push('AND');
                    filters.push(['type', 'is', selLevel]);
                }
                if (selFromDate) {
                    if (filters.length > 0) filters.push('AND');
                    filters.push(['date', 'onorafter', selFromDate]);
                }
                if (selToDate) {
                    if (filters.length > 0) filters.push('AND');
                    filters.push(['date', 'onorbefore', selToDate]);
                }
                if (selTitle) {
                    if (filters.length > 0) filters.push('AND');
                    filters.push(['title', 'contains', selTitle]);
                }
                if (selDetail) {
                    if (filters.length > 0) filters.push('AND');
                    filters.push(['detail', 'contains', selDetail]);
                }

                // Correct columns utilizing the join to "script"
                const columns = [
                    search.createColumn({ name: 'date', sort: search.Sort.DESC }),
                    'time',
                    'type',
                    search.createColumn({ name: 'name', join: 'script' }),
                    search.createColumn({ name: 'scriptid', join: 'script' }),
                    search.createColumn({ name: 'internalid', join: 'script' }),
                    'user',
                    'title',
                    'detail'
                ];

                const logSearch = search.create({
                    type: 'scriptexecutionlog',
                    filters: filters,
                    columns: columns
                });

                const pageSize = 100;
                const pagedData = logSearch.runPaged({ pageSize: pageSize });
                const totalCount = pagedData.count;
                const pageCount = pagedData.pageRanges.length;

                if (selPage >= pageCount) {
                    selPage = 0;
                }

                const logs = [];
                if (totalCount > 0) {
                    const activePage = pagedData.fetch({ index: selPage });
                    activePage.data.forEach((result) => {
                        const dateVal = result.getValue('date') || '';
                        const timeVal = result.getValue('time') || '';
                        const dateTimeStr = timeVal ? `${dateVal} ${timeVal}` : dateVal;

                        logs.push({
                            datetime: dateTimeStr,
                            type: result.getValue('type') || '',
                            scriptName: result.getValue({ name: 'name', join: 'script' }) || '',
                            scriptCode: result.getValue({ name: 'scriptid', join: 'script' }) || '',
                            scriptId: result.getValue({ name: 'internalid', join: 'script' }) || '',
                            user: result.getText('user') || 'System',
                            title: result.getValue('title') || '-',
                            detail: result.getValue('detail') || ''
                        });
                    });
                }

                response.setHeader({ name: 'Content-Type', value: 'application/json' });
                response.write(JSON.stringify({
                    success: true,
                    totalCount: totalCount,
                    pageCount: pageCount,
                    currentPage: selPage,
                    pageSize: pageSize,
                    logs: logs
                }));
            } catch (e) {
                log.error('Error in getLogs API', e);
                response.setHeader({ name: 'Content-Type', value: 'application/json' });
                response.write(JSON.stringify({ success: false, message: e.message }));
            }
            return;
        }

        // Default Load: Render the gorgeous HTML SPA Page
        const suiteletUrl = url.resolveScript({
            scriptId: runtime.getCurrentScript().id,
            deploymentId: runtime.getCurrentScript().deploymentId
        });

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Script Execution Log Viewer</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-dark: #f8fafc;
            --bg-card: #ffffff;
            --bg-input: #ffffff;
            --border-color: #e2e8f0;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --primary: #2563eb;
            --primary-hover: #1d4ed8;
            --accent-green: #10b981;
            --accent-red: #ef4444;
            --accent-yellow: #f59e0b;
            --accent-cyan: #06b6d4;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            background-color: var(--bg-dark);
            color: var(--text-main);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            padding: 24px;
            min-height: 100vh;
            overflow-x: hidden;
            background-image: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }

        .dashboard-container {
            max-width: 1600px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 320px 1fr;
            gap: 24px;
        }

        @media (max-width: 1024px) {
            .dashboard-container {
                grid-template-columns: 1fr;
            }
        }

        /* Header Area */
        .dashboard-header {
            grid-column: 1 / -1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 8px;
        }

        .header-title h1 {
            font-size: 1.5rem;
            font-weight: 700;
            color: #0f172a;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .header-title p {
            font-size: 0.875rem;
            color: var(--text-muted);
            margin-top: 4px;
        }

        /* Sidebar Filter Panel */
        .filters-panel {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05);
            height: fit-content;
        }

        .filter-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-main);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .filter-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .filter-group label {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .form-input {
            width: 100%;
            background: var(--bg-input);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 10px 14px;
            color: var(--text-main);
            font-size: 0.875rem;
            outline: none;
            transition: all 0.15s;
        }

        .form-input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
        }

        /* Button layout */
        .btn-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-top: 12px;
        }

        .btn {
            padding: 12px;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 0.875rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.15s;
        }

        .btn-primary {
            background: var(--primary);
            color: #fff;
            border: 1px solid var(--primary);
        }

        .btn-primary:hover {
            background: var(--primary-hover);
            transform: translateY(-1px);
        }

        .btn-secondary {
            background: transparent;
            color: var(--text-muted);
            border: 1px solid var(--border-color);
        }

        .btn-secondary:hover {
            background: #f1f5f9;
            color: var(--text-main);
            border-color: #cbd5e1;
        }

        /* Logs Table Area */
        .logs-area {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            position: relative;
        }

        .logs-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logs-count {
            font-size: 1rem;
            font-weight: 500;
            color: var(--text-muted);
        }

        .logs-count span {
            color: var(--text-main);
            font-weight: 600;
        }

        /* Table Design */
        .table-container {
            overflow-x: auto;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            background: #ffffff;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.875rem;
        }

        th {
            background: #f8fafc;
            padding: 12px 16px;
            color: #334155;
            font-weight: 600;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 1px solid var(--border-color);
        }

        td {
            padding: 12px 16px;
            border-bottom: 1px solid var(--border-color);
            color: #334155;
            vertical-align: top;
        }

        tr:last-child td {
            border-bottom: none;
        }

        tr:hover td {
            background: #f8fafc;
        }

        /* Badges */
        .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 700;
            display: inline-block;
            text-transform: uppercase;
            border: 1px solid rgba(0,0,0,0.05);
        }

        .badge-debug {
            background: #f1f5f9;
            color: #475569;
        }

        .badge-audit {
            background: #dcfce7;
            color: #15803d;
        }

        .badge-error {
            background: #fee2e2;
            color: #b91c1c;
        }

        .badge-emergency {
            background: #fde8e8;
            color: #9b1c1c;
            border-color: #f8b4b4;
        }

        /* Clickable links */
        .link-badge {
            color: var(--primary);
            text-decoration: none;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: color 0.15s;
        }

        .link-badge:hover {
            color: var(--primary-hover);
            text-decoration: underline;
        }

        .link-badge svg {
            width: 12px;
            height: 12px;
            opacity: 0.7;
        }

        /* Log details pre-formatted scrollbox */
        .log-detail-pre {
            font-family: 'JetBrains Mono', Consolas, monospace;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            max-height: 90px;
            overflow-y: auto;
            font-size: 0.75rem;
            color: #334155;
            white-space: pre-wrap;
            line-height: 1.4;
            position: relative;
        }

        .detail-cell {
            position: relative;
            max-width: 450px;
        }

        .action-btn-container {
            display: flex;
            gap: 8px;
            margin-top: 4px;
        }

        .cell-btn {
            background: transparent;
            border: 1px solid var(--border-color);
            color: var(--text-muted);
            padding: 4px 8px;
            font-size: 0.7rem;
            border-radius: 4px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: all 0.15s;
        }

        .cell-btn:hover {
            border-color: #cbd5e1;
            color: var(--text-main);
            background: #f1f5f9;
        }

        /* Pagination UI */
        .pagination-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 8px;
        }

        .pagination-buttons {
            display: flex;
            gap: 8px;
        }

        .page-btn {
            background: #ffffff;
            border: 1px solid var(--border-color);
            color: var(--text-main);
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
        }

        .page-btn:hover:not(:disabled) {
            background: #f1f5f9;
            border-color: #cbd5e1;
        }

        .page-btn.active {
            background: var(--primary);
            border-color: var(--primary);
            color: white;
        }

        .page-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }

        .pagination-info {
            font-size: 0.875rem;
            color: var(--text-muted);
        }

        /* Loading Indicator */
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(2px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            border-radius: 12px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.25s ease;
        }

        .loading-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e2e8f0;
            border-top: 3px solid var(--primary);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .no-logs-msg {
            padding: 40px;
            text-align: center;
            color: var(--text-muted);
            font-size: 1rem;
        }

        .no-logs-msg svg {
            width: 48px;
            height: 48px;
            margin-bottom: 12px;
            color: var(--border-color);
        }

        /* Searchable Script Dropdown Styling */
        .dropdown-wrapper {
            position: relative;
        }

        .dropdown-search-list {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            max-height: 250px;
            overflow-y: auto;
            background: #ffffff;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            z-index: 100;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            margin-top: 4px;
            display: none;
        }

        .dropdown-item {
            padding: 8px 12px;
            cursor: pointer;
            font-size: 0.875rem;
            transition: background 0.1s;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--text-main);
        }

        .dropdown-item:hover {
            background: #f1f5f9;
            color: var(--primary);
        }

        /* Cache Sync Button */
        .cache-sync-container {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
        }
        .cache-sync-btn {
            background: transparent;
            border: 1px solid var(--border-color);
            color: var(--text-muted);
            width: 38px;
            height: 38px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s;
            flex-shrink: 0;
        }
        .cache-sync-btn:hover {
            border-color: #cbd5e1;
            color: var(--primary);
            background: #f1f5f9;
        }
        
        /* Stats Bar */
        .stats-bar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 8px;
        }
        .stat-pill {
            background: #ffffff;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.875rem;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .stat-pill .stat-label {
            font-weight: 500;
            color: var(--text-muted);
        }
        .stat-pill .stat-value {
            font-weight: 700;
            font-size: 1.1rem;
        }
        .stat-total { border-left: 4px solid var(--primary); }
        .stat-error { border-left: 4px solid var(--accent-red); color: var(--accent-red); }
        .stat-audit { border-left: 4px solid var(--accent-green); color: #16a34a; }
        .stat-debug { border-left: 4px solid #64748b; color: #475569; }

        /* Scripts list specific styles */
        .rt-tag {
            background: #f1f5f9;
            color: #475569;
            font-size: 0.75rem;
            padding: 2px 6px;
            border-radius: 4px;
            margin-right: 4px;
            margin-bottom: 4px;
            display: inline-block;
            border: 1px solid #e2e8f0;
        }
        .script-row-btn {
            background: var(--primary);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
        }
        .script-row-btn:hover {
            background: var(--primary-hover);
        }
        .script-name-cell {
            font-weight: 600;
            color: var(--primary);
            cursor: pointer;
        }
        .script-name-cell:hover {
            text-decoration: underline;
            color: var(--primary-hover);
        }

        /* Badge clickable */
        .badge.clickable {
            cursor: pointer;
            transition: all 0.15s;
        }
        .badge.clickable:hover {
            transform: scale(1.05);
            opacity: 0.85;
        }

        /* Live Polling toggle UI */
        .live-poll-wrapper {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .live-poll-label {
            font-size: 0.875rem;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            user-select: none;
        }
        .live-poll-checkbox {
            width: 16px;
            height: 16px;
            cursor: pointer;
        }
        
        /* Modal Overlay & Dialog */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
        }
        .modal-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }
        .modal-content {
            background: #ffffff;
            border-radius: 12px;
            width: 90%;
            max-width: 800px;
            max-height: 80%;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border: 1px solid var(--border-color);
            overflow: hidden;
            animation: modalSlide 0.2s ease-out;
        }
        @keyframes modalSlide {
            from { transform: translateY(20px); }
            to { transform: translateY(0); }
        }
        .modal-header {
            padding: 16px 24px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8fafc;
        }
        .modal-header h3 {
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-main);
        }
        .modal-close-btn {
            background: transparent;
            border: none;
            font-size: 1.5rem;
            color: var(--text-muted);
            cursor: pointer;
            line-height: 1;
        }
        .modal-close-btn:hover {
            color: var(--text-main);
        }
        .modal-body {
            padding: 24px;
            overflow-y: auto;
            flex: 1;
            background: #ffffff;
        }
        .modal-pre {
            font-family: 'JetBrains Mono', Consolas, monospace;
            font-size: 0.8rem;
            background: #f8fafc;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 16px;
            color: #334155;
            white-space: pre-wrap;
            line-height: 1.5;
            overflow-x: auto;
        }
        .modal-footer {
            padding: 16px 24px;
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            background: #f8fafc;
        }
    </style>
</head>
<body>
    <div class="dashboard-container" style="position: relative;">
        
        <!-- Header -->
        <div class="dashboard-header">
            <div class="header-title">
                <h1>
                    <svg style="width: 28px; height: 28px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Script Execution Log Viewer
                </h1>
                <p>Centralized developer console for monitoring SuiteScript health, errors, and audits</p>
            </div>
        </div>

        <!-- Sidebar Filters -->
        <div class="filters-panel">
            <div class="filter-title">
                <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                Filter Controls
            </div>

            <!-- Record Type -->
            <div class="filter-group">
                <label>Record Type</label>
                <select id="filter-recordtype" class="form-input">
                    <option value="">- All Record Types -</option>
                    <!-- Populated dynamically -->
                </select>
            </div>

            <!-- Script Autocomplete Field -->
            <div class="filter-group">
                <label>Script</label>
                <div class="cache-sync-container">
                    <div class="dropdown-wrapper" style="flex: 1;">
                        <input type="text" id="script-search-input" class="form-input" placeholder="Type to search script...">
                        <input type="hidden" id="filter-script" value="">
                        <div class="dropdown-search-list" id="script-dropdown-list">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                    <button type="button" class="cache-sync-btn" id="btn-sync-cache" title="Clear & Sync Dropdowns Cache">
                        <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M23 4v6h-6"></path>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Employee Selector -->
            <div class="filter-group">
                <label>User</label>
                <select id="filter-user" class="form-input">
                    <option value="">- All Users -</option>
                    <!-- Populated dynamically -->
                </select>
            </div>

            <!-- Log Level selector -->
            <div class="filter-group">
                <label>Log Level</label>
                <select id="filter-level" class="form-input">
                    <option value="">- All Levels -</option>
                    <option value="DEBUG">DEBUG</option>
                    <option value="AUDIT">AUDIT</option>
                    <option value="ERROR">ERROR</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                </select>
            </div>

            <!-- Date range -->
            <div class="filter-group">
                <label>From Date</label>
                <input type="date" id="filter-fromdate" class="form-input">
            </div>

            <div class="filter-group">
                <label>To Date</label>
                <input type="date" id="filter-todate" class="form-input">
            </div>

            <!-- Keywords -->
            <div class="filter-group">
                <label>Title Contains</label>
                <input type="text" id="filter-title" class="form-input" placeholder="Log title keywords...">
            </div>

            <div class="filter-group">
                <label>Details Contains</label>
                <input type="text" id="filter-detail" class="form-input" placeholder="Error stack, payload text...">
            </div>

            <!-- Buttons -->
            <div class="btn-container">
                <button class="btn btn-primary" id="btn-search">
                    <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    Filter Logs
                </button>
                <button class="btn btn-secondary" id="btn-reset">
                    Reset Filters
                </button>
            </div>
        </div>

        <!-- Main Logs View -->
        <!-- Main Logs View -->
        <div class="logs-area">
            <!-- Loading Overlay -->
            <div class="loading-overlay" id="loading-overlay">
                <div class="spinner"></div>
            </div>

            <!-- Scripts View -->
            <div id="scripts-view">
                <div class="logs-meta" style="margin-bottom: 16px;">
                    <div class="logs-count">
                        Available Scripts (<span id="scripts-count">0</span>)
                    </div>
                </div>
                <div class="table-container">
                    <table id="scripts-table">
                        <thead>
                            <tr>
                                <th>Script Name</th>
                                <th>Script ID</th>
                                <th>Script Type</th>
                                <th>Deployments</th>
                                <th style="width: 120px; text-align: center;">Action</th>
                            </tr>
                        </thead>
                        <tbody id="scripts-table-body">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>
                <div class="pagination-container" style="margin-top: 16px;">
                    <div class="pagination-info" id="scripts-pagination-info">
                        Page 1 of 1
                    </div>
                    <div class="pagination-buttons" id="scripts-pagination-buttons">
                        <!-- Populated dynamically -->
                    </div>
                </div>
            </div>

            <!-- Logs View -->
            <div id="logs-view" style="display: none;">
                <!-- Header with Back Button -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
                    <button type="button" class="btn btn-secondary" id="btn-back-to-scripts" style="padding: 8px 16px; margin: 0; display: inline-flex; align-items: center; gap: 8px;">
                        <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        Back to Scripts
                    </button>
                    <h3 id="current-selected-script-header" style="color: var(--primary); font-size: 1.1rem; font-weight: 600;">Logs</h3>
                </div>

                <!-- Stats Bar -->
                <div class="stats-bar">
                    <div class="stat-pill stat-total">
                        <span class="stat-label">Loaded (Page)</span>
                        <span class="stat-value" id="stat-total-val">0</span>
                    </div>
                    <div class="stat-pill stat-error">
                        <span class="stat-label">Errors</span>
                        <span class="stat-value" id="stat-error-val">0</span>
                    </div>
                    <div class="stat-pill stat-audit">
                        <span class="stat-label">Audits</span>
                        <span class="stat-value" id="stat-audit-val">0</span>
                    </div>
                    <div class="stat-pill stat-debug">
                        <span class="stat-label">Debugs</span>
                        <span class="stat-value" id="stat-debug-val">0</span>
                    </div>
                </div>

                <div class="logs-meta">
                    <div class="logs-count" id="logs-count-info">
                        Showing logs <span>0 - 0</span> of <span>0</span>
                    </div>
                    <div class="live-poll-wrapper">
                        <label class="live-poll-label">
                            <input type="checkbox" id="live-poll-checkbox" class="live-poll-checkbox">
                            Auto Refresh (10s)
                        </label>
                        <button type="button" class="cell-btn" id="btn-refresh-now" style="padding: 6px 10px; font-size: 0.75rem;" title="Refresh logs list now">
                            <svg style="width: 12px; height: 12px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path d="M23 4v6h-6"></path>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                            </svg>
                            Refresh
                        </button>
                    </div>
                </div>

                <!-- Table Container -->
                <div class="table-container">
                    <table id="logs-table">
                        <thead>
                            <tr>
                                <th style="width: 175px;">Date & Time</th>
                                <th style="width: 110px;">Level</th>
                                <th>Script Name</th>
                                <th style="width: 150px;">User</th>
                                <th>Title</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody id="logs-table-body">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="pagination-container">
                    <div class="pagination-info" id="pagination-info-text">
                        Page 1 of 1
                    </div>
                    <div class="pagination-buttons" id="pagination-nav-buttons">
                        <!-- Populated dynamically -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Log Details Modal -->
    <div id="detail-modal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modal-title">Log Detail Payload</h3>
                <button class="modal-close-btn" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <pre class="modal-pre" id="modal-pre"></pre>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" style="padding: 8px 16px;" onclick="copyModalContent(this)">Copy Details</button>
                <button class="btn btn-primary" style="padding: 8px 16px;" onclick="closeModal()">Close</button>
            </div>
        </div>
    </div>

    <script>
        const API_URL = "${suiteletUrl}";
        
        // State Management
        let state = {
            scripts: [],
            employees: [],
            recordTypes: [],
            filters: {
                script: "",
                user: "",
                level: "",
                fromdate: "",
                todate: "",
                title: "",
                detail: "",
                page: 0
            },
            totalCount: 0,
            pageCount: 0,
            view: "scripts"
        };

        let scriptsState = {
            page: 0,
            pageSize: 25,
            filteredScripts: []
        };

        // Initialize Today's Date
        function setTodayDate() {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const dateString = year + '-' + month + '-' + day;
            document.getElementById('filter-fromdate').value = dateString;
            state.filters.fromdate = dateString;
        }

        // Helper: Display UI Spinner
        function toggleLoading(show) {
            const overlay = document.getElementById('loading-overlay');
            if (show) {
                overlay.classList.add('active');
            } else {
                overlay.classList.remove('active');
            }
        }

        // Filter scripts list based on record type and text query
        function applyScriptsFiltering() {
            const rtVal = document.getElementById('filter-recordtype').value;
            const searchVal = document.getElementById('script-search-input').value.toLowerCase().trim();

            scriptsState.filteredScripts = state.scripts.filter(s => {
                const matchesRT = !rtVal || (s.recordTypes && s.recordTypes.includes(rtVal));
                const matchesSearch = !searchVal || 
                    s.name.toLowerCase().includes(searchVal) || 
                    s.scriptid.toLowerCase().includes(searchVal);
                return matchesRT && matchesSearch;
            });

            scriptsState.page = 0;
            renderScriptsTable();
            renderScriptsPagination();
        }

        // Render scripts table UI
        function renderScriptsTable() {
            const tbody = document.getElementById('scripts-table-body');
            const countInfo = document.getElementById('scripts-count');
            
            tbody.innerHTML = "";
            
            const start = scriptsState.page * scriptsState.pageSize;
            const end = start + scriptsState.pageSize;
            const pageScripts = scriptsState.filteredScripts.slice(start, end);
            
            countInfo.textContent = scriptsState.filteredScripts.length;
            
            if (pageScripts.length === 0) {
                tbody.innerHTML = \`
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">
                            No scripts found matching the filters.
                        </td>
                    </tr>
                \`;
                return;
            }
            
            pageScripts.forEach(s => {
                const tr = document.createElement('tr');
                
                // Format record type tags
                let tagsHtml = "";
                if (s.recordTypes && s.recordTypes.length > 0) {
                    s.recordTypes.forEach(rt => {
                        tagsHtml += \`<span class="rt-tag">\${escapeString(rt)}</span>\`;
                    });
                } else {
                    tagsHtml = \`<span style="color: var(--text-muted); font-size: 0.8rem;">None</span>\`;
                }
                
                tr.innerHTML = \`
                    <td class="script-name-cell" onclick="selectScriptAndLoadLogs('\${escapeString(s.scriptid)}', '\${escapeString(s.name)}')">
                        \${escapeString(s.name)}
                    </td>
                    <td><code style="font-size: 0.75rem;">\${escapeString(s.scriptid)}</code></td>
                    <td><span class="badge badge-debug">\${escapeString(s.scripttype)}</span></td>
                    <td>\${tagsHtml}</td>
                    <td style="text-align: center;">
                        <button class="script-row-btn" onclick="selectScriptAndLoadLogs('\${escapeString(s.scriptid)}', '\${escapeString(s.name)}')">
                            View Logs
                        </button>
                    </td>
                \`;
                tbody.appendChild(tr);
            });
        }

        // Action when a user clicks a script to view its logs
        window.selectScriptAndLoadLogs = function(scriptId, scriptName) {
            document.getElementById('filter-script').value = scriptId;
            state.filters.script = scriptId;
            state.filters.page = 0;
            
            switchView('logs', { name: scriptName, scriptid: scriptId });
            fetchLogs();
        };

        // Render client-side pagination for scripts
        function renderScriptsPagination() {
            const info = document.getElementById('scripts-pagination-info');
            const container = document.getElementById('scripts-pagination-buttons');
            
            container.innerHTML = "";
            
            const totalScripts = scriptsState.filteredScripts.length;
            const pageCount = Math.ceil(totalScripts / scriptsState.pageSize);
            
            if (pageCount <= 1) {
                info.textContent = "Page 1 of 1";
                return;
            }
            
            info.textContent = "Page " + (scriptsState.page + 1) + " of " + pageCount;
            
            // Prev Button
            const prevBtn = document.createElement('button');
            prevBtn.className = 'page-btn';
            prevBtn.innerHTML = "&larr;";
            prevBtn.disabled = scriptsState.page === 0;
            prevBtn.onclick = () => {
                if (scriptsState.page > 0) {
                    scriptsState.page--;
                    renderScriptsTable();
                    renderScriptsPagination();
                }
            };
            container.appendChild(prevBtn);
            
            // Numeric pages (max 5 visible)
            let startPage = Math.max(0, scriptsState.page - 2);
            let endPage = Math.min(pageCount - 1, startPage + 4);
            
            if (endPage - startPage < 4) {
                startPage = Math.max(0, endPage - 4);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'page-btn' + (i === scriptsState.page ? ' active' : '');
                pageBtn.textContent = i + 1;
                pageBtn.onclick = () => {
                    if (scriptsState.page !== i) {
                        scriptsState.page = i;
                        renderScriptsTable();
                        renderScriptsPagination();
                    }
                };
                container.appendChild(pageBtn);
            }
            
            // Next Button
            const nextBtn = document.createElement('button');
            nextBtn.className = 'page-btn';
            nextBtn.innerHTML = "&rarr;";
            nextBtn.disabled = scriptsState.page === pageCount - 1;
            nextBtn.onclick = () => {
                if (scriptsState.page < pageCount - 1) {
                    scriptsState.page++;
                    renderScriptsTable();
                    renderScriptsPagination();
                }
            };
            container.appendChild(nextBtn);
        }

        // Toggle visibility between Scripts View and Logs View
        function switchView(viewName, scriptInfo) {
            state.view = viewName;
            const scriptsDiv = document.getElementById('scripts-view');
            const logsDiv = document.getElementById('logs-view');
            
            if (viewName === 'scripts') {
                scriptsDiv.style.display = 'block';
                logsDiv.style.display = 'none';
                
                // Clear active script selection on back
                document.getElementById('filter-script').value = "";
                state.filters.script = "";
                
                // Clear script search input so they see all scripts
                document.getElementById('script-search-input').value = "";
                
                // Refresh list
                applyScriptsFiltering();
            } else {
                scriptsDiv.style.display = 'none';
                logsDiv.style.display = 'block';
                
                if (scriptInfo) {
                    document.getElementById('current-selected-script-header').textContent = "Logs for: " + scriptInfo.name + " (" + scriptInfo.scriptid + ")";
                }
            }
        }

        // Fetch Scripts and Record Types
        async function loadScripts(forceSync) {
            try {
                const cacheKey = 'njt_logs_scripts_cache_v2';
                let cachedData = sessionStorage.getItem(cacheKey);
                let responseData;
                
                if (forceSync || !cachedData) {
                    const res = await fetch(API_URL + '&action=getScripts');
                    responseData = await res.json();
                    sessionStorage.setItem(cacheKey, JSON.stringify(responseData));
                } else {
                    responseData = JSON.parse(cachedData);
                }
                
                state.scripts = responseData.scripts || [];
                state.recordTypes = responseData.recordTypes || [];
                
                // Populate Record Type dropdown
                const rtSelect = document.getElementById('filter-recordtype');
                rtSelect.innerHTML = '<option value="">- All Record Types -</option>';
                state.recordTypes.forEach(rt => {
                    const opt = document.createElement('option');
                    opt.value = rt;
                    opt.textContent = rt;
                    rtSelect.appendChild(opt);
                });
                
                // Connect search filters
                const input = document.getElementById('script-search-input');
                const hiddenInput = document.getElementById('filter-script');
                const list = document.getElementById('script-dropdown-list');
                
                if (list) list.style.display = "none";

                if (!input.dataset.bound) {
                    input.addEventListener('input', function() {
                        hiddenInput.value = "";
                        applyScriptsFiltering();
                    });
                    
                    // Filter dropdown listener
                    document.getElementById('filter-recordtype').addEventListener('change', applyScriptsFiltering);
                    
                    input.dataset.bound = "true";
                }
                
                // Set initial filtered scripts
                applyScriptsFiltering();

            } catch (e) {
                console.error('Error loading scripts', e);
            }
        }

        // Fetch Employees for User dropdown
        async function loadEmployees(forceSync) {
            try {
                const cacheKey = 'njt_logs_employees_cache';
                let cachedData = sessionStorage.getItem(cacheKey);
                if (forceSync || !cachedData) {
                    const res = await fetch(API_URL + '&action=getEmployees');
                    state.employees = await res.json();
                    sessionStorage.setItem(cacheKey, JSON.stringify(state.employees));
                } else {
                    state.employees = JSON.parse(cachedData);
                }
                
                const select = document.getElementById('filter-user');
                select.innerHTML = '<option value="">- All Users -</option>';
                state.employees.forEach(emp => {
                    const opt = document.createElement('option');
                    opt.value = emp.id;
                    opt.textContent = emp.name;
                    select.appendChild(opt);
                });
            } catch (e) {
                console.error('Error loading employees', e);
            }
        }

        // Copy to Clipboard utility
        function copyToClipboard(text, btnElement) {
            navigator.clipboard.writeText(text).then(() => {
                const origText = btnElement.innerHTML;
                btnElement.style.borderColor = "#10b981";
                btnElement.style.color = "#10b981";
                btnElement.innerHTML = \`
                    <svg style="width: 12px; height: 12px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg> Copied!
                \`;
                setTimeout(() => {
                    btnElement.style.borderColor = "";
                    btnElement.style.color = "";
                    btnElement.innerHTML = origText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
            });
        }

        // Fetch logs using active state filters
        async function fetchLogs(silent) {
            if (!silent) toggleLoading(true);
            
            try {
                // Gather input parameters
                const scriptVal = document.getElementById('filter-script').value;
                const userVal = document.getElementById('filter-user').value;
                const levelVal = document.getElementById('filter-level').value;
                const fromVal = document.getElementById('filter-fromdate').value;
                const toVal = document.getElementById('filter-todate').value;
                const titleVal = document.getElementById('filter-title').value;
                const detailVal = document.getElementById('filter-detail').value;

                let queryStr = API_URL + "&action=getLogs" +
                    "&filter_script=" + encodeURIComponent(scriptVal) +
                    "&user=" + encodeURIComponent(userVal) +
                    "&level=" + encodeURIComponent(levelVal) +
                    "&fromdate=" + encodeURIComponent(fromVal) + 
                    "&todate=" + encodeURIComponent(toVal) +     
                    "&title=" + encodeURIComponent(titleVal) +
                    "&detail=" + encodeURIComponent(detailVal) +
                    "&page=" + state.filters.page;

                const response = await fetch(queryStr);
                const data = await response.json();

                if (!data.success) {
                    alert("Error fetching logs: " + data.message);
                    if (!silent) toggleLoading(false);
                    return;
                }

                state.totalCount = data.totalCount;
                state.pageCount = data.pageCount;
                
                renderLogsTable(data.logs);
                renderPagination();

            } catch (e) {
                console.error("Error executing fetchLogs", e);
                alert("An error occurred fetching logs. Check console logs.");
            } finally {
                if (!silent) toggleLoading(false);
            }
        }

        // Render logs in the HTML Table
        function renderLogsTable(logs) {
            const tbody = document.getElementById('logs-table-body');
            tbody.innerHTML = "";

            const countInfo = document.getElementById('logs-count-info');

            // Reset and compute statistics for stats bar
            let total = 0;
            let errors = 0;
            let audits = 0;
            let debugs = 0;

            if (!logs || logs.length === 0) {
                countInfo.innerHTML = "Showing logs <span>0 - 0</span> of <span>0</span>";
                tbody.innerHTML = \`
                    <tr>
                        <td colspan="6">
                            <div class="no-logs-msg">
                                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <p>No execution logs found matching the selected criteria.</p>
                            </div>
                        </td>
                    </tr>
                \`;
                
                document.getElementById('stat-total-val').textContent = total;
                document.getElementById('stat-error-val').textContent = errors;
                document.getElementById('stat-audit-val').textContent = audits;
                document.getElementById('stat-debug-val').textContent = debugs;
                return;
            }

            total = logs.length;
            const startIdx = state.filters.page * 100 + 1;
            const endIdx = startIdx + logs.length - 1;
            countInfo.innerHTML = "Showing logs <span>" + startIdx + " - " + endIdx + "</span> of <span>" + state.totalCount + "</span>";

            logs.forEach((log, idx) => {
                const tr = document.createElement('tr');
                
                // Level Badge styling & stats tracking
                let levelClass = "badge-debug";
                if (log.type === "ERROR" || log.type === "EMERGENCY") {
                    levelClass = "badge-error";
                    errors++;
                } else if (log.type === "AUDIT") {
                    levelClass = "badge-audit";
                    audits++;
                } else if (log.type === "DEBUG") {
                    levelClass = "badge-debug";
                    debugs++;
                } else {
                    levelClass = "badge-debug";
                    debugs++; // default count for other system details
                }

                if (log.type === "EMERGENCY") {
                    levelClass = "badge-emergency";
                }

                // Script links (if internal ID exists)
                let scriptLinkHtml = escapeString(log.scriptName || 'No Name');
                if (log.scriptId) {
                    scriptLinkHtml = \`
                        <a class="link-badge" href="/app/common/scripting/script.nl?id=\${log.scriptId}" target="_blank">
                            \&nbsp;\${escapeString(log.scriptName)}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </a>
                        <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">\${escapeString(log.scriptCode)}</div>
                    \`;
                }

                // Try to Prettify JSON strings inside details
                let detailEscaped = "";
                if (log.detail) {
                    try {
                        const trimmed = log.detail.trim();
                        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                            const parsed = JSON.parse(log.detail);
                            detailEscaped = escapeString(JSON.stringify(parsed, null, 4));
                        } else {
                            detailEscaped = escapeString(log.detail);
                        }
                    } catch (e) {
                        detailEscaped = escapeString(log.detail);
                    }
                }
                const detailId = "detail-" + idx;

                tr.innerHTML = \`
                    <td>\${escapeString(log.datetime)}</td>
                    <td><span class="badge clickable \${levelClass}" onclick="filterByLevel('\${log.type}')" title="Click to filter by \${log.type}">\${escapeString(log.type)}</span></td>
                    <td>\${scriptLinkHtml}</td>
                    <td>\${escapeString(log.user)}</td>
                    <td style="font-weight: 500; font-size: 0.825rem;">\${escapeString(log.title)}</td>
                    <td class="detail-cell">
                        \${log.detail ? \`
                            <pre class="log-detail-pre" id="\${detailId}">\${detailEscaped}</pre>
                            <div class="action-btn-container">
                                <button class="cell-btn" onclick="copyDetail('\&apos;'\${detailId}'\&apos;', this)">
                                    <svg style="width: 12px; height: 12px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                    Copy
                                </button>
                                <button class="cell-btn" onclick="toggleExpand('\&apos;'\${detailId}'\&apos;', this)">
                                    Expand
                                </button>
                                <button class="cell-btn" onclick="viewFullDetail('\&apos;'\${detailId}'\&apos;')">
                                    <svg style="width: 12px; height: 12px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path d="M15 3h6v6"></path>
                                        <path d="M9 21H3v-6"></path>
                                        <path d="M21 3l-7 7M3 21l7-7"></path>
                                    </svg>
                                    View Full
                                </button>
                            </div>
                        \` : '-'}
                    </td>
                \`;
                tbody.appendChild(tr);
            });

            // Update stats bar UI elements
            document.getElementById('stat-total-val').textContent = total;
            document.getElementById('stat-error-val').textContent = errors;
            document.getElementById('stat-audit-val').textContent = audits;
            document.getElementById('stat-debug-val').textContent = debugs;
        }

        // Global Helpers for cell actions (defined on window)
        window.copyDetail = function(detailId, btn) {
            const text = document.getElementById(detailId).textContent;
            copyToClipboard(text, btn);
        };

        window.toggleExpand = function(detailId, btn) {
            const pre = document.getElementById(detailId);
            if (pre.style.maxHeight === "none" || pre.style.maxHeight === "500px") {
                pre.style.maxHeight = "90px";
                btn.textContent = "Expand";
            } else {
                pre.style.maxHeight = "500px";
                btn.textContent = "Collapse";
            }
        };

        window.viewFullDetail = function(detailId) {
            const text = document.getElementById(detailId).textContent;
            document.getElementById('modal-pre').textContent = text;
            document.getElementById('detail-modal').classList.add('active');
        };

        window.closeModal = function() {
            document.getElementById('detail-modal').classList.remove('active');
        };

        window.copyModalContent = function(btn) {
            const text = document.getElementById('modal-pre').textContent;
            copyToClipboard(text, btn);
        };

        window.filterByLevel = function(level) {
            // Translate EMERGENCY to ERROR level if dropdown doesn't have it, or set level directly
            const select = document.getElementById('filter-level');
            select.value = level;
            // Trigger filter change logic
            state.filters.page = 0;
            fetchLogs();
        };

        function escapeString(str) {
            if (!str) return "";
            return str
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        // Render Pagination controls
        function renderPagination() {
            const info = document.getElementById('pagination-info-text');
            const container = document.getElementById('pagination-nav-buttons');
            
            container.innerHTML = "";
            
            if (state.pageCount <= 1) {
                info.textContent = "Page 1 of 1";
                return;
            }

            info.textContent = "Page " + (state.filters.page + 1) + " of " + state.pageCount;

            // Prev Button
            const prevBtn = document.createElement('button');
            prevBtn.className = 'page-btn';
            prevBtn.innerHTML = "&larr;";
            prevBtn.disabled = state.filters.page === 0;
            prevBtn.onclick = () => {
                if (state.filters.page > 0) {
                    state.filters.page--;
                    fetchLogs();
                }
            };
            container.appendChild(prevBtn);

            // Numeric pages (max 5 visible pages to prevent UI overflow)
            let startPage = Math.max(0, state.filters.page - 2);
            let endPage = Math.min(state.pageCount - 1, startPage + 4);
            
            // Adjust start page if near the end
            if (endPage - startPage < 4) {
                startPage = Math.max(0, endPage - 4);
            }

            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'page-btn' + (i === state.filters.page ? ' active' : '');
                pageBtn.textContent = i + 1;
                pageBtn.onclick = () => {
                    if (state.filters.page !== i) {
                        state.filters.page = i;
                        fetchLogs();
                    }
                };
                container.appendChild(pageBtn);
            }

            // Next Button
            const nextBtn = document.createElement('button');
            nextBtn.className = 'page-btn';
            nextBtn.innerHTML = "&rarr;";
            nextBtn.disabled = state.filters.page === state.pageCount - 1;
            nextBtn.onclick = () => {
                if (state.filters.page < state.pageCount - 1) {
                    state.filters.page++;
                    fetchLogs();
                }
            };
            container.appendChild(nextBtn);
        }

        // Reset all filters
        function resetAllFilters() {
            document.getElementById('script-search-input').value = "";
            document.getElementById('filter-script').value = "";
            document.getElementById('filter-recordtype').value = "";
            document.getElementById('filter-user').value = "";
            document.getElementById('filter-level').value = "";
            document.getElementById('filter-title').value = "";
            document.getElementById('filter-detail').value = "";
            document.getElementById('filter-todate').value = "";
            
            setTodayDate();
            
            switchView('scripts');
        }

        // Event Listeners setup
        document.getElementById('btn-search').addEventListener('click', () => {
            const scriptId = document.getElementById('filter-script').value;
            if (scriptId) {
                state.filters.page = 0;
                fetchLogs();
            } else {
                applyScriptsFiltering();
            }
        });
        
        document.getElementById('btn-reset').addEventListener('click', resetAllFilters);

        document.getElementById('btn-back-to-scripts').addEventListener('click', () => {
            switchView('scripts');
        });

        // Sync Cache Button Action
        document.getElementById('btn-sync-cache').addEventListener('click', async function() {
            const btn = this;
            const origHtml = btn.innerHTML;
            btn.disabled = true;
            btn.style.color = "var(--primary)";
            btn.innerHTML = \`
                <svg style="width: 16px; height: 16px; border: 2px solid #e2e8f0; border-top: 2px solid var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;" fill="none" viewBox="0 0 24 24"></svg>
            \`;
            try {
                // Clear session storage cache
                sessionStorage.removeItem('njt_logs_scripts_cache_v2');
                sessionStorage.removeItem('njt_logs_employees_cache');
                // Re-fetch scripts & employees
                await Promise.all([
                    loadScripts(true),
                    loadEmployees(true)
                ]);
                // Give visual success feedback
                btn.style.color = "var(--accent-green)";
                btn.innerHTML = \`
                    <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                \`;
                setTimeout(() => {
                    btn.disabled = false;
                    btn.style.color = "";
                    btn.innerHTML = origHtml;
                }, 1500);
            } catch (e) {
                console.error("Cache sync failed", e);
                btn.disabled = false;
                btn.style.color = "var(--accent-red)";
                btn.innerHTML = origHtml;
            }
        });

        // Live Polling (Auto-Refresh) & Refresh Action
        let autoRefreshInterval = null;
        const pollCheckbox = document.getElementById('live-poll-checkbox');
        
        pollCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // Start interval (fetch silently every 10 seconds)
                autoRefreshInterval = setInterval(() => {
                    if (pollCheckbox.checked && state.view === 'logs') {
                        fetchLogs(true);
                    }
                }, 10000);
            } else {
                // Stop interval
                if (autoRefreshInterval) {
                    clearInterval(autoRefreshInterval);
                    autoRefreshInterval = null;
                }
            }
        });

        document.getElementById('btn-refresh-now').addEventListener('click', () => {
            if (state.view === 'logs') {
                fetchLogs(false);
            } else {
                applyScriptsFiltering();
            }
        });

        // Initializer
        window.onload = async () => {
            toggleLoading(true);
            setTodayDate();
            
            // Run scripts and employees loading in parallel
            await Promise.all([
                loadScripts(),
                loadEmployees()
            ]);
            
            switchView('scripts');
            toggleLoading(false);
        };
    </script>
</body>
</html>`;

        response.write(html);
    };

    return {
        onRequest: onRequest
    };
    
});
