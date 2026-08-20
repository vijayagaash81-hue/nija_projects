/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * 
 * Description: A premium, mobile-responsive Suitelet that acts as an external or internal form
 *              to submit NetSuite Expense Reports (including line items and receipt uploads).
 */
define(['N/record', 'N/search', 'N/file', 'N/format', 'N/url', 'N/runtime', 'N/log'], 
(record, search, file, format, url, runtime, log) => {

    /**
     * Helper: Gets or creates a File Cabinet folder named "Expense Receipts"
     */
    function getOrCreateFolder() {
        try {
            const folderSearch = search.create({
                type: 'folder',
                filters: [['name', 'is', 'Expense Receipts']]
            });
            const results = folderSearch.run().getRange({ start: 0, end: 1 });
            if (results.length > 0) {
                return results[0].id;
            } else {
                const folderRec = record.create({ type: 'folder' });
                folderRec.setValue({ fieldId: 'name', value: 'Expense Receipts' });
                return folderRec.save();
            }
        } catch (e) {
            log.error('Error in getOrCreateFolder', e);
            return null;
        }
    }

    /**
     * Helper: Fetches active employees
     */
    function getEmployees() {
        const list = [];
        try {
            const empSearch = search.create({
                type: 'employee',
                filters: [['isinactive', 'is', 'F']],
                columns: [
                    search.createColumn({ name: 'entityid', sort: search.Sort.ASC }),
                    'subsidiary',
                    'department',
                    'class'
                ]
            });
            empSearch.run().each((res) => {
                list.push({ 
                    id: res.id, 
                    name: res.getValue('entityid'),
                    subsidiary: res.getValue('subsidiary') || '',
                    department: res.getValue('department') || '',
                    class: res.getValue('class') || ''
                });
                return true;
            });
        } catch (e) {
            log.error('Error fetching employees', e);
        }
        return list;
    }

    /**
     * Helper: Fetches active subsidiaries (handles non-OneWorld accounts gracefully)
     */
    function getSubsidiaries() {
        const list = [];
        try {
            const subSearch = search.create({
                type: 'subsidiary',
                filters: [['isinactive', 'is', 'F']],
                columns: [search.createColumn({ name: 'name', sort: search.Sort.ASC })]
            });
            subSearch.run().each((res) => {
                list.push({ id: res.id, name: res.getValue('name') });
                return true;
            });
        } catch (e) {
            log.error('Error fetching subsidiaries (possibly non-OneWorld)', e);
        }
        return list;
    }

    /**
     * Helper: Fetches active departments
     */
    function getDepartments() {
        const list = [];
        try {
            const deptSearch = search.create({
                type: 'department',
                filters: [['isinactive', 'is', 'F']],
                columns: [search.createColumn({ name: 'name', sort: search.Sort.ASC })]
            });
            deptSearch.run().each((res) => {
                list.push({ id: res.id, name: res.getValue('name') });
                return true;
            });
        } catch (e) {
            log.error('Error fetching departments', e);
        }
        return list;
    }

    /**
     * Helper: Fetches active classes
     */
    function getClasses() {
        const list = [];
        try {
            const classSearch = search.create({
                type: 'classification',
                filters: [['isinactive', 'is', 'F']],
                columns: [search.createColumn({ name: 'name', sort: search.Sort.ASC })]
            });
            classSearch.run().each((res) => {
                list.push({ id: res.id, name: res.getValue('name') });
                return true;
            });
        } catch (e) {
            log.error('Error fetching classes', e);
        }
        return list;
    }

    /**
     * Helper: Fetches active currencies
     */
    function getCurrencies() {
        const list = [];
        try {
            const currSearch = search.create({
                type: 'currency',
                filters: [['isinactive', 'is', 'F']],
                columns: [search.createColumn({ name: 'name', sort: search.Sort.ASC }), 'symbol']
            });
            currSearch.run().each((res) => {
                list.push({ 
                    id: res.id, 
                    name: res.getValue('name'), 
                    symbol: res.getValue('symbol') 
                });
                return true;
            });
        } catch (e) {
            log.error('Error fetching currencies', e);
        }
        return list;
    }

    /**
     * Helper: Fetches active expense categories
     */
    function getExpenseCategories() {
        const list = [];
        try {
            const catSearch = search.create({
                type: 'expensecategory',
                filters: [['isinactive', 'is', 'F']],
                columns: [search.createColumn({ name: 'name', sort: search.Sort.ASC })]
            });
            catSearch.run().each((res) => {
                list.push({ id: res.id, name: res.getValue('name') });
                return true;
            });
        } catch (e) {
            log.error('Error fetching expense categories', e);
        }
        return list;
    }

    /**
     * Helper: Maps MIME types to N/file Type enums
     */
    function getFileType(mimeType) {
        if (!mimeType) return file.Type.PLAINTEXT;
        const mime = mimeType.toLowerCase();
        if (mime.includes('pdf')) return file.Type.PDF;
        if (mime.includes('png')) return file.Type.PNG;
        if (mime.includes('jpg') || mime.includes('jpeg')) return file.Type.JPGIMAGE;
        if (mime.includes('gif')) return file.Type.GIFIMAGE;
        if (mime.includes('text')) return file.Type.PLAINTEXT;
        return file.Type.PLAINTEXT;
    }

    /**
     * Helper: Parses standard YYYY-MM-DD string into NetSuite Date object
     */
    function parseDate(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        if (parts.length !== 3) return null;
        try {
            return new Date(parts[0], parts[1] - 1, parts[2]);
        } catch (e) {
            log.error('Error parsing date string: ' + dateStr, e);
            return null;
        }
    }

    const onRequest = (context) => {
        const { request, response } = context;

        // --- POST HANDLER: Process Submitted Expense Data ---
        if (request.method === 'POST') {
            try {
                const payload = JSON.parse(request.body);
                log.audit('Received Submission Payload', payload);

                // Validation
                if (!payload.employee) {
                    throw new Error('Employee selection is required.');
                }
                if (!payload.date) {
                    throw new Error('Expense Date is required.');
                }
                if (!payload.lines || payload.lines.length === 0) {
                    throw new Error('At least one expense line must be filled.');
                }

                const folderId = getOrCreateFolder();
                log.debug('Receipts Folder ID', folderId);

                // Create the standard Expense Report record
                const expReport = record.create({
                    type: 'expensereport',
                    isDynamic: true
                });

                expReport.setValue({ fieldId: 'entity', value: payload.employee });
                
                const trandateObj = parseDate(payload.date);
                if (trandateObj) {
                    expReport.setValue({ fieldId: 'trandate', value: trandateObj });
                }

                if (payload.memo) {
                    expReport.setValue({ fieldId: 'memo', value: payload.memo });
                }
                if (payload.subsidiary) {
                    expReport.setValue({ fieldId: 'subsidiary', value: payload.subsidiary });
                }
                if (payload.department) {
                    expReport.setValue({ fieldId: 'department', value: payload.department });
                }
                if (payload.class) {
                    expReport.setValue({ fieldId: 'class', value: payload.class });
                }
                if (payload.currency) {
                    expReport.setValue({ fieldId: 'expensereportcurrency', value: payload.currency });
                }
                if (payload.exchangerate) {
                    expReport.setValue({ fieldId: 'exchangerate', value: parseFloat(payload.exchangerate) || 1.0 });
                }

                // Process and insert lines
                const fileIdsToAttach = [];
                payload.lines.forEach((line) => {
                    let receiptFileId = null;

                    // Save receipt file if uploaded
                    if (line.receipt && line.receipt.base64 && line.receipt.name) {
                        try {
                            // Strip MIME header (e.g., "data:image/png;base64,") if present
                            let base64Content = line.receipt.base64;
                            const commaIndex = base64Content.indexOf(',');
                            if (commaIndex !== -1) {
                                base64Content = base64Content.substring(commaIndex + 1);
                            }

                            const receiptFile = file.create({
                                name: `${Date.now()}_${line.receipt.name}`,
                                fileType: getFileType(line.receipt.type),
                                contents: base64Content,
                                folder: folderId
                            });
                            receiptFileId = receiptFile.save();
                            fileIdsToAttach.push(receiptFileId);
                            log.debug('Saved Receipt File', { fileId: receiptFileId, filename: line.receipt.name });
                        } catch (fileErr) {
                            log.error('Error saving receipt file for line: ' + line.memo, fileErr);
                        }
                    }

                    expReport.selectNewLine({ sublistId: 'expense' });
                    
                    if (line.currency) {
                        expReport.setCurrentSublistValue({ 
                            sublistId: 'expense', 
                            fieldId: 'currency', 
                            value: line.currency 
                        });
                    }
                    
                    if (line.category) {
                        expReport.setCurrentSublistValue({ 
                            sublistId: 'expense', 
                            fieldId: 'category', 
                            value: line.category 
                        });
                    }

                    const lineDateObj = parseDate(line.date);
                    if (lineDateObj) {
                        expReport.setCurrentSublistValue({ 
                            sublistId: 'expense', 
                            fieldId: 'expensedate', 
                            value: lineDateObj 
                        });
                    }

                    expReport.setCurrentSublistValue({ 
                        sublistId: 'expense', 
                        fieldId: 'amount', 
                        value: parseFloat(line.amount) || 0 
                    });

                    if (line.memo) {
                        expReport.setCurrentSublistValue({ 
                            sublistId: 'expense', 
                            fieldId: 'memo', 
                            value: line.memo 
                        });
                    }

                    if (receiptFileId) {
                        expReport.setCurrentSublistValue({ 
                            sublistId: 'expense', 
                            fieldId: 'receipt', 
                            value: true 
                        });
                    }

                    expReport.commitLine({ sublistId: 'expense' });
                });

                const createdId = expReport.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: false
                });

                log.audit('Expense Report Created Successfully', { id: createdId });

                // Attach files to the transaction Communication > Files tab
                fileIdsToAttach.forEach((fileId) => {
                    try {
                        record.attach({
                            record: {
                                type: 'file',
                                id: fileId
                            },
                            to: {
                                type: 'expensereport',
                                id: createdId
                            }
                        });
                        log.debug('Attached File to Expense Report', { fileId: fileId, recordId: createdId });
                    } catch (attachErr) {
                        log.error('Error attaching file #' + fileId + ' to transaction #' + createdId, attachErr);
                    }
                });

                response.setHeader({ name: 'Content-Type', value: 'application/json' });
                response.write(JSON.stringify({
                    success: true,
                    message: 'Expense Report submitted successfully!',
                    id: createdId
                }));

            } catch (e) {
                log.error('Error creating expense report', e);
                response.setHeader({ name: 'Content-Type', value: 'application/json' });
                response.write(JSON.stringify({
                    success: false,
                    message: e.message || 'An unexpected error occurred during submission.'
                }));
            }
            return;
        }

        // --- GET HANDLER: Render the dynamic, responsive form ---
        try {
            const employeeData = getEmployees();
            const subsidiaryData = getSubsidiaries();
            const departmentData = getDepartments();
            const classData = getClasses();
            const currencyData = getCurrencies();
            const categoryData = getExpenseCategories();

            const currentDate = new Date().toISOString().split('T')[0];

            const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee Expense Report</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-body: #f4f6fc;
            --bg-card: #ffffff;
            --primary: #4f46e5;
            --primary-hover: #4338ca;
            --text-main: #1f2937;
            --text-muted: #6b7280;
            --border: #e5e7eb;
            --border-hover: #d1d5db;
            --success: #10b981;
            --danger: #ef4444;
            --indigo-light: #e0e7ff;
            --shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
            --transition: all 0.2s ease-in-out;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Outfit', sans-serif;
        }

        body {
            background-color: var(--bg-body);
            color: var(--text-main);
            padding: 20px 15px;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            overflow-x: hidden;
            width: 100%;
        }

        .container {
            width: 100%;
            max-width: 1000px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 24px;
        }

        header h1 {
            font-size: 1.8rem;
            font-weight: 700;
            color: #1e1b4b;
            margin-bottom: 4px;
        }

        header p {
            font-size: 0.95rem;
            color: var(--text-muted);
        }

        .card {
            background: var(--bg-card);
            border-radius: 16px;
            box-shadow: var(--shadow);
            padding: 24px;
            margin-bottom: 20px;
            border: 1px solid rgba(229, 231, 235, 0.5);
        }

        .card-title {
            font-size: 1.15rem;
            font-weight: 600;
            color: #1e1b4b;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid var(--border);
            padding-bottom: 10px;
        }

        /* Responsive Grid for Header */
        .grid-header {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
        }

        @media (max-width: 768px) {
            .grid-header {
                grid-template-columns: 1fr;
            }
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
            position: relative;
        }

        .form-group.full-width {
            grid-column: span 2;
        }

        @media (max-width: 768px) {
            .form-group.full-width {
                grid-column: span 1;
            }
        }

        label {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--text-main);
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .input-field {
            width: 100%;
            padding: 10px 14px;
            border: 1.5px solid var(--border);
            border-radius: 8px;
            font-size: 0.95rem;
            outline: none;
            transition: var(--transition);
            background-color: #fafafa;
        }

        .input-field:focus {
            border-color: var(--primary);
            background-color: #ffffff;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        /* Custom Searchable Dropdown Styling */
        .dropdown-wrapper {
            position: relative;
        }

        .dropdown-search {
            width: 100%;
            padding: 10px 14px;
            border: 1.5px solid var(--border);
            border-radius: 8px;
            font-size: 0.95rem;
            outline: none;
            transition: var(--transition);
            background-color: #fafafa;
            cursor: text;
        }

        .dropdown-search:focus {
            border-color: var(--primary);
            background-color: #ffffff;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .dropdown-menu {
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            right: 0;
            background: #ffffff;
            border: 1px solid var(--border);
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            max-height: 200px;
            overflow-y: auto;
            z-index: 100;
            display: none;
        }

        .dropdown-item {
            padding: 10px 14px;
            font-size: 0.9rem;
            cursor: pointer;
            transition: var(--transition);
            color: var(--text-main);
        }

        .dropdown-item:hover,
        .dropdown-item.dropdown-active {
            background-color: var(--indigo-light);
            color: var(--primary);
        }

        .dropdown-item.no-results {
            color: var(--text-muted);
            cursor: default;
            text-align: center;
        }

        /* Lines Section Styles */
        .lines-container {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        /* Desktop: Header Row for lines */
        .lines-header-row {
            display: grid;
            grid-template-columns: 190px 120px 120px 120px 1fr 160px 50px;
            gap: 12px;
            padding: 10px 16px;
            background: #f8fafc;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.8rem;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
            border: 1.5px solid var(--border);
        }

        .line-card {
            display: grid;
            grid-template-columns: 190px 120px 120px 120px 1fr 160px 50px;
            gap: 12px;
            padding: 12px 16px;
            background: var(--bg-card);
            border: 1.5px solid var(--border);
            border-radius: 10px;
            align-items: center;
            transition: var(--transition);
            position: relative;
        }

        .line-card:hover {
            border-color: var(--primary);
            box-shadow: 0 6px 16px rgba(79, 70, 229, 0.04);
        }

        /* Desktop: Hide inner labels */
        .line-card label {
            display: none !important;
        }

        .line-mobile-header {
            display: none;
        }

        .delete-row-btn {
            background: transparent;
            border: none;
            color: var(--danger);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px;
            border-radius: 6px;
            transition: var(--transition);
            width: 36px;
            height: 36px;
            margin: 0 auto;
        }

        .delete-row-btn:hover {
            background: #fee2e2;
            color: #ef4444;
            transform: scale(1.05);
        }

        .remove-line-btn {
            background: transparent;
            border: none;
            color: var(--danger);
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: var(--transition);
        }

        .remove-line-btn:hover {
            opacity: 0.8;
        }

        .action-col {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .amount-input-wrapper {
            display: flex;
            align-items: center;
            border: 1.5px solid var(--border);
            border-radius: 8px;
            background-color: #fafafa;
            padding: 0 12px;
            height: 41.5px;
            box-sizing: border-box;
            transition: var(--transition);
            width: 100%;
        }

        .amount-input-wrapper:focus-within {
            border-color: var(--primary);
            background-color: #ffffff;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .amount-input-wrapper .currency-symbol {
            font-size: 0.9rem;
            color: var(--text-muted);
            font-weight: 600;
            margin-right: 6px;
            user-select: none;
            flex-shrink: 0;
        }

        .amount-input-wrapper .amount-input {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            outline: none !important;
            box-shadow: none !important;
            width: 100%;
            font-size: 0.95rem;
            color: var(--text-main);
            height: 100%;
        }

        .amount-input-wrapper .amount-input:focus {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
        }

        /* File Upload Zone - Compact for Row view */
        .upload-zone {
            border: 1.5px dashed #cbd5e1;
            background: #f8fafc;
            border-radius: 6px;
            padding: 6px 12px;
            text-align: center;
            cursor: pointer;
            transition: var(--transition);
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 6px;
            height: 38px;
            box-sizing: border-box;
            width: 100%;
        }

        .upload-zone:hover {
            border-color: var(--primary);
            background: var(--indigo-light);
        }

        .upload-zone svg {
            width: 16px;
            height: 16px;
            fill: var(--text-muted);
            transition: var(--transition);
        }

        .upload-zone:hover svg {
            fill: var(--primary);
        }

        .upload-zone-text {
            font-size: 0.75rem;
            color: var(--text-muted);
            white-space: nowrap;
        }

        .upload-zone-text span {
            font-weight: 600;
            color: var(--primary);
        }

        .file-input {
            display: none;
        }

        .preview-container {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            background: #f1f5f9;
            padding: 4px 8px;
            border-radius: 6px;
            height: 38px;
            box-sizing: border-box;
        }

        .preview-thumbnail {
            width: 24px;
            height: 24px;
            object-fit: cover;
            border-radius: 3px;
            border: 1px solid var(--border);
            flex-shrink: 0;
        }

        .preview-info {
            flex-grow: 1;
            font-size: 0.75rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .preview-info-name {
            font-weight: 600;
            color: var(--text-main);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .preview-info-size {
            color: var(--text-muted);
            display: none;
        }

        .preview-remove {
            background: transparent;
            border: none;
            color: var(--danger);
            cursor: pointer;
            font-size: 1rem;
            padding: 2px;
            line-height: 1;
            flex-shrink: 0;
        }

        /* Mobile Viewport Updates for Line Row */
        @media (max-width: 900px) {
            .lines-header-row {
                display: none !important;
            }

            .line-card {
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 16px;
                border-radius: 12px;
                border-style: dashed;
                background: #fcfdfe;
                align-items: stretch;
            }

            .line-card label {
                display: block !important;
            }

            .line-mobile-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;
                border-bottom: 1.5px solid var(--border);
                padding-bottom: 8px;
            }

            .line-number {
                font-weight: 600;
                font-size: 0.85rem;
                color: var(--primary);
                background: var(--indigo-light);
                padding: 2px 8px;
                border-radius: 4px;
            }

            .action-col {
                display: none !important;
            }

            .upload-zone {
                flex-direction: column;
                height: auto;
                padding: 14px;
                min-height: 80px;
            }

            .upload-zone svg {
                width: 20px;
                height: 20px;
            }

            .upload-zone-text {
                font-size: 0.8rem;
                white-space: normal;
            }

            .preview-container {
                height: auto;
                padding: 8px 12px;
            }

            .preview-thumbnail {
                width: 32px;
                height: 32px;
            }

            .preview-info-size {
                display: block;
            }
        }

        /* Action Buttons */
        .btn-container {
            display: flex;
            gap: 12px;
            margin-top: 10px;
        }

        .btn {
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 0.95rem;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border: none;
            width: 100%;
        }

        .btn-outline {
            background: transparent;
            border: 1.5px solid var(--primary);
            color: var(--primary);
        }

        .btn-outline:hover {
            background: var(--indigo-light);
        }

        .btn-primary {
            background: var(--primary);
            color: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
        }

        .btn-primary:hover {
            background: var(--primary-hover);
        }

        /* Total Section */
        .total-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 1.15rem;
            font-weight: 700;
            color: #1e1b4b;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1.5px solid var(--border);
        }

        .total-amount {
            color: var(--primary);
        }

        /* Loading & Alert Modal Overlay */
        .overlay {
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
            transition: opacity 0.25s ease-in-out;
        }

        .overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        .modal-box {
            background: var(--bg-card);
            border-radius: 16px;
            padding: 30px;
            width: 90%;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15);
            transform: scale(0.9);
            transition: transform 0.25s ease-in-out;
        }

        .overlay.active .modal-box {
            transform: scale(1);
        }

        .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid var(--indigo-light);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 16px auto;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .modal-title {
            font-size: 1.25rem;
            font-weight: 700;
            margin-bottom: 8px;
            color: #1e1b4b;
        }

        .modal-desc {
            font-size: 0.9rem;
            color: var(--text-muted);
            line-height: 1.4;
        }

        .success-icon {
            width: 54px;
            height: 54px;
            background: #d1fae5;
            color: var(--success);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.6rem;
            margin: 0 auto 16px auto;
        }

        .error-icon {
            width: 54px;
            height: 54px;
            background: #fee2e2;
            color: var(--danger);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.6rem;
            margin: 0 auto 16px auto;
        }
    </style>
</head>
<body>

<div class="container">
    <header>
        <h1>Employee Expense Report</h1>
        <p>Submit your business expenses instantly from any device</p>
    </header>

    <form id="expenseForm">
        <!-- GENERAL INFORMATION CARD -->
        <div class="card">
            <div class="card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                General Information
            </div>
            
            <div class="grid-header">
                <!-- Employee Dropdown -->
                <div class="form-group">
                    <label for="employee">Employee *</label>
                    <div class="dropdown-wrapper" id="employeeWrapper">
                        <input type="text" class="dropdown-search" placeholder="Search and select employee..." autocomplete="off">
                        <input type="hidden" name="employee" id="employee" required>
                        <div class="dropdown-menu" id="employeeMenu"></div>
                    </div>
                </div>

                <!-- Date -->
                <div class="form-group">
                    <label for="date">Expense Date *</label>
                    <input type="date" class="input-field" name="date" id="date" value="${currentDate}" required>
                </div>

                <!-- Subsidiary Dropdown -->
                <div class="form-group" id="subsidiaryContainer" style="display: none;">
                    <label for="subsidiary">Subsidiary</label>
                    <div class="dropdown-wrapper" id="subsidiaryWrapper">
                        <input type="text" class="dropdown-search" placeholder="Search and select subsidiary..." autocomplete="off">
                        <input type="hidden" name="subsidiary" id="subsidiary">
                        <div class="dropdown-menu" id="subsidiaryMenu"></div>
                    </div>
                </div>

                <!-- Currency -->
                <div class="form-group">
                    <label for="currency">Currency *</label>
                    <div class="dropdown-wrapper" id="currencyWrapper">
                        <input type="text" class="dropdown-search" placeholder="Search and select currency..." autocomplete="off">
                        <input type="hidden" name="currency" id="currency">
                        <div class="dropdown-menu" id="currencyMenu"></div>
                    </div>
                </div>

                <!-- Exchange Rate -->
                <div class="form-group">
                    <label for="exchangerate">Exchange Rate *</label>
                    <input type="number" class="input-field" name="exchangerate" id="exchangerate" value="1.0" step="any" min="0.00001" required>
                </div>

                <!-- Department -->
                <div class="form-group">
                    <label for="department">Department</label>
                    <div class="dropdown-wrapper" id="departmentWrapper">
                        <input type="text" class="dropdown-search" placeholder="Search and select department..." autocomplete="off">
                        <input type="hidden" name="department" id="department">
                        <div class="dropdown-menu" id="departmentMenu"></div>
                    </div>
                </div>

                <!-- Class -->
                <div class="form-group">
                    <label for="class">Class</label>
                    <div class="dropdown-wrapper" id="classWrapper">
                        <input type="text" class="dropdown-search" placeholder="Search and select class..." autocomplete="off">
                        <input type="hidden" name="class" id="class">
                        <div class="dropdown-menu" id="classMenu"></div>
                    </div>
                </div>

                <!-- Memo / Purpose -->
                <div class="form-group full-width">
                    <label for="memo">Purpose / Description</label>
                    <textarea class="input-field" name="memo" id="memo" rows="2" placeholder="e.g. Sales conference, client visit, office supplies..."></textarea>
                </div>
            </div>
        </div>

        <!-- EXPENSE LINES CARD -->
        <div class="card">
            <div class="card-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-list"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                Expense Lines
            </div>

            <!-- Header Row for Desktop Viewport -->
            <div class="lines-header-row" id="linesHeaderRow">
                <div>Category</div>
                <div>Date *</div>
                <div>Currency *</div>
                <div>Amount *</div>
                <div>Memo / Note</div>
                <div>Attachment</div>
                <div style="text-align: center;">Actions</div>
            </div>

            <div id="linesList" class="lines-container">
                <!-- Lines will be dynamically generated here -->
            </div>

            <div class="btn-container" style="margin-top: 20px;">
                <button type="button" class="btn btn-outline" id="addLineBtn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add Expense Line
                </button>
            </div>

            <div class="total-section">
                <span>Total Amount:</span>
                <span class="total-amount" id="totalAmountDisplay">0.00</span>
            </div>
        </div>

        <!-- SUBMIT CARD -->
        <div style="margin-bottom: 40px;">
            <button type="submit" class="btn btn-primary" style="height: 50px; font-size: 1.05rem;">
                Submit Expense Report
            </button>
        </div>
    </form>
</div>

<!-- OVERLAY (LOADING / NOTIFICATION) -->
<div class="overlay" id="overlay">
    <!-- Inner box will change depending on state -->
    <div class="modal-box" id="modalBox">
        <!-- Content will be injected dynamically -->
    </div>
</div>

<script>
    // --- Metadata Injected from Server ---
    const employees = ${JSON.stringify(employeeData)};
    const subsidiaries = ${JSON.stringify(subsidiaryData)};
    const departments = ${JSON.stringify(departmentData)};
    const classes = ${JSON.stringify(classData)};
    const currencies = ${JSON.stringify(currencyData)};
    const categories = ${JSON.stringify(categoryData)};
    const currentDate = "${currentDate}";

    // --- State variables ---
    let lineCounter = 0;
    const activeLines = new Set();
    const lineReceiptData = {}; // lineId -> { name, type, base64 }
    let activeCurrencySymbol = '$';

    // --- DOM Elements ---
    const linesList = document.getElementById('linesList');
    const addLineBtn = document.getElementById('addLineBtn');
    const totalAmountDisplay = document.getElementById('totalAmountDisplay');
    const expenseForm = document.getElementById('expenseForm');
    const overlay = document.getElementById('overlay');
    const modalBox = document.getElementById('modalBox');

    // --- Utility: Reusable Custom Search Dropdown Component ---
    function initSearchableDropdown(wrapperId, listData, onSelect) {
        const wrapper = document.getElementById(wrapperId);
        if (!wrapper) return;

        const input = wrapper.querySelector('.dropdown-search');
        const hidden = wrapper.querySelector('input[type="hidden"]');
        const menu = wrapper.querySelector('.dropdown-menu');
        let currentFocus = -1;

        function renderMenu(filterText = '') {
            menu.innerHTML = '';
            currentFocus = -1;
            const filtered = listData.filter(item => 
                item.name.toLowerCase().includes(filterText.toLowerCase())
            );

            if (filtered.length === 0) {
                const emptyItem = document.createElement('div');
                emptyItem.className = 'dropdown-item no-results';
                emptyItem.textContent = 'No matches found';
                menu.appendChild(emptyItem);
                return;
            }

            filtered.forEach(item => {
                const div = document.createElement('div');
                div.className = 'dropdown-item';
                div.textContent = item.name;
                div.dataset.value = item.id;
                div.addEventListener('click', () => {
                    input.value = item.name;
                    hidden.value = item.id;
                    menu.style.display = 'none';
                    if (onSelect) onSelect(item);
                    input.dispatchEvent(new Event('change')); // Trigger changes
                });
                menu.appendChild(div);
            });
        }

        input.addEventListener('focus', () => {
            renderMenu(input.value);
            menu.style.display = 'block';
        });

        input.addEventListener('input', () => {
            renderMenu(input.value);
        });

        input.addEventListener('keydown', (e) => {
            let items = menu.querySelectorAll('.dropdown-item:not(.no-results)');
            if (e.key === 'ArrowDown') {
                currentFocus++;
                addActive(items);
            } else if (e.key === 'ArrowUp') {
                currentFocus--;
                addActive(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (currentFocus > -1 && items[currentFocus]) {
                    items[currentFocus].click();
                }
            } else if (e.key === 'Escape') {
                menu.style.display = 'none';
            }
        });

        function addActive(items) {
            if (!items || items.length === 0) return;
            removeActive(items);
            if (currentFocus >= items.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = items.length - 1;
            items[currentFocus].classList.add('dropdown-active');
            items[currentFocus].scrollIntoView({ block: 'nearest' });
        }

        function removeActive(items) {
            items.forEach(item => item.classList.remove('dropdown-active'));
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                menu.style.display = 'none';
            }
        });
    }

    function setDropdownValue(wrapperId, valueId, listData) {
        const wrapper = document.getElementById(wrapperId);
        if (!wrapper) return;
        const input = wrapper.querySelector('.dropdown-search');
        const hidden = wrapper.querySelector('input[type="hidden"]');
        
        const item = listData.find(x => String(x.id) === String(valueId));
        if (item) {
            input.value = item.name;
            hidden.value = item.id;
        } else {
            input.value = '';
            hidden.value = '';
        }
    }

    // --- Function: Add Dynamic Expense Line ---
    function createExpenseLine() {
        lineCounter++;
        const lineId = lineCounter;
        activeLines.add(lineId);

        const card = document.createElement('div');
        card.className = 'line-card';
        card.id = 'line-card-' + lineId;
        card.innerHTML = \`
            <div class="line-mobile-header">
                <span class="line-number">Item #\${activeLines.size}</span>
                <button type="button" class="remove-line-btn" data-line-id="\${lineId}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Remove
                </button>
            </div>
            
            <!-- Category Search -->
            <div class="form-group">
                <label>Category</label>
                <div class="dropdown-wrapper" id="categoryWrapper-\${lineId}">
                    <input type="text" class="dropdown-search" placeholder="Search category..." autocomplete="off">
                    <input type="hidden" name="line_category" id="line_category-\${lineId}">
                    <div class="dropdown-menu"></div>
                </div>
            </div>

            <!-- Date -->
            <div class="form-group">
                <label>Date *</label>
                <input type="date" class="input-field" name="line_date" id="line_date-\${lineId}" value="\${currentDate}" required>
            </div>

            <!-- Currency Search -->
            <div class="form-group">
                <label>Currency *</label>
                <div class="dropdown-wrapper" id="lineCurrencyWrapper-\${lineId}">
                    <input type="text" class="dropdown-search" placeholder="Search currency..." autocomplete="off">
                    <input type="hidden" name="line_currency" id="line_currency-\${lineId}">
                    <div class="dropdown-menu"></div>
                </div>
            </div>

            <!-- Amount -->
            <div class="form-group">
                <label>Amount *</label>
                <div class="amount-input-wrapper">
                    <span class="currency-symbol">\${activeCurrencySymbol}</span>
                    <input type="number" class="input-field amount-input" name="line_amount" id="line_amount-\${lineId}" placeholder="0.00" step="0.01" min="0.01" required>
                </div>
            </div>

            <!-- Memo -->
            <div class="form-group">
                <label>Memo / Note</label>
                <input type="text" class="input-field" name="line_memo" id="line_memo-\${lineId}" placeholder="Notes...">
            </div>

            <!-- Receipt File Upload -->
            <div class="form-group">
                <label>Attachment</label>
                <div class="upload-zone" id="uploadZone-\${lineId}">
                    <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                    <span class="upload-zone-text">Upload</span>
                    <input type="file" class="file-input" id="fileInput-\${lineId}" accept="image/*,application/pdf">
                </div>
                <div id="filePreview-\${lineId}"></div>
            </div>

            <!-- Desktop Action Column -->
            <div class="form-group action-col">
                <button type="button" class="delete-row-btn" data-line-id="\${lineId}" title="Remove Line">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        \`;

        linesList.appendChild(card);

        // Initialize searchable category dropdown for this line
        initSearchableDropdown('categoryWrapper-' + lineId, categories);

        // Initialize searchable currency dropdown for this line
        initSearchableDropdown('lineCurrencyWrapper-' + lineId, currencies, (selectedCurrency) => {
            const symbol = selectedCurrency.symbol || selectedCurrency.name || '$';
            const symbolSpan = card.querySelector('.currency-symbol');
            if (symbolSpan) {
                symbolSpan.textContent = symbol;
            }
        });

        // Default the line currency to the header currency if selected
        const headerCurrencyId = document.getElementById('currency').value;
        if (headerCurrencyId) {
            setDropdownValue('lineCurrencyWrapper-' + lineId, headerCurrencyId, currencies);
            const selected = currencies.find(x => String(x.id) === String(headerCurrencyId));
            if (selected) {
                const symbolSpan = card.querySelector('.currency-symbol');
                if (symbolSpan) {
                    symbolSpan.textContent = selected.symbol || selected.name || '$';
                }
            }
        }

        // Attach listeners for dynamic calculation
        const amountInput = card.querySelector('.amount-input');
        amountInput.addEventListener('input', calculateTotal);

        // Attach receipt upload functionality
        initLineReceiptUpload(lineId);

        // Attach remove button listeners for both mobile and desktop controls
        const removeBtn = card.querySelector('.remove-line-btn');
        removeBtn.addEventListener('click', (e) => {
            const idToRemove = parseInt(e.currentTarget.dataset.lineId);
            removeExpenseLine(idToRemove);
        });

        const deleteRowBtn = card.querySelector('.delete-row-btn');
        deleteRowBtn.addEventListener('click', (e) => {
            const idToRemove = parseInt(e.currentTarget.dataset.lineId);
            removeExpenseLine(idToRemove);
        });

        calculateTotal();
        updateLineNumbers();
    }

    // --- Function: Remove Dynamic Line ---
    function removeExpenseLine(lineId) {
        const card = document.getElementById('line-card-' + lineId);
        if (card) {
            card.remove();
            activeLines.delete(lineId);
            delete lineReceiptData[lineId];
            calculateTotal();
            updateLineNumbers();
        }
    }

    // --- Function: Recalculate and Update Line Labels ---
    function updateLineNumbers() {
        const cards = linesList.querySelectorAll('.line-card');
        cards.forEach((card, index) => {
            const numLabel = card.querySelector('.line-number');
            if (numLabel) {
                numLabel.textContent = 'Item #' + (index + 1);
            }
        });
    }

    // --- Function: Calculate Total Amount ---
    function calculateTotal() {
        let total = 0;
        const amountInputs = linesList.querySelectorAll('.amount-input');
        amountInputs.forEach(input => {
            const val = parseFloat(input.value);
            if (!isNaN(val)) {
                total += val;
            }
        });
        totalAmountDisplay.textContent = total.toFixed(2);
    }

    // --- Function: Receipt File Handling per Line ---
    function initLineReceiptUpload(lineId) {
        const zone = document.getElementById('uploadZone-' + lineId);
        const fileInput = document.getElementById('fileInput-' + lineId);
        const previewContainer = document.getElementById('filePreview-' + lineId);

        zone.addEventListener('click', () => fileInput.click());

        // Drag & drop behavior
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.style.borderColor = 'var(--primary)';
            zone.style.background = 'var(--indigo-light)';
        });

        zone.addEventListener('dragleave', () => {
            zone.style.borderColor = '#cbd5e1';
            zone.style.background = '#f8fafc';
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.style.borderColor = '#cbd5e1';
            zone.style.background = '#f8fafc';

            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files.length > 0) {
                processFile(fileInput.files[0]);
            }
        });

        function processFile(fileObj) {
            if (fileObj.size > 5 * 1024 * 1024) {
                alert('File size exceeds the 5MB limit.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const base64Data = e.target.result;
                
                // Store in memory
                lineReceiptData[lineId] = {
                    name: fileObj.name,
                    type: fileObj.type,
                    base64: base64Data
                };

                // Render Preview Card
                zone.style.display = 'none';
                previewContainer.innerHTML = '';

                const wrapper = document.createElement('div');
                wrapper.className = 'preview-container';

                // Thumbnail (Image vs PDF icon)
                if (fileObj.type.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.className = 'preview-thumbnail';
                    img.src = base64Data;
                    wrapper.appendChild(img);
                } else {
                    const icon = document.createElement('div');
                    icon.className = 'preview-thumbnail';
                    icon.style.display = 'flex';
                    icon.style.alignItems = 'center';
                    icon.style.justifyContent = 'center';
                    icon.style.background = '#fee2e2';
                    icon.style.color = '#ef4444';
                    icon.style.fontWeight = '700';
                    icon.style.fontSize = '0.7rem';
                    icon.textContent = 'PDF';
                    wrapper.appendChild(icon);
                }

                // File details
                const info = document.createElement('div');
                info.className = 'preview-info';
                
                const nameSpan = document.createElement('div');
                nameSpan.className = 'preview-info-name';
                nameSpan.textContent = fileObj.name;
                
                const sizeSpan = document.createElement('div');
                sizeSpan.className = 'preview-info-size';
                sizeSpan.textContent = (fileObj.size / 1024).toFixed(1) + ' KB';
                
                info.appendChild(nameSpan);
                info.appendChild(sizeSpan);
                wrapper.appendChild(info);

                // Remove button
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'preview-remove';
                removeBtn.innerHTML = '&times;';
                removeBtn.addEventListener('click', () => {
                    delete lineReceiptData[lineId];
                    fileInput.value = '';
                    previewContainer.innerHTML = '';
                    zone.style.display = 'flex';
                });
                wrapper.appendChild(removeBtn);

                previewContainer.appendChild(wrapper);
            };

            reader.readAsDataURL(fileObj);
        }
    }

    // --- Overlay Control Helpers ---
    function showLoading(title, desc) {
        modalBox.innerHTML = \`
            <div class="spinner"></div>
            <div class="modal-title">\${title}</div>
            <div class="modal-desc">\${desc}</div>
        \`;
        overlay.className = 'overlay active';
    }

    function showSuccess(title, desc, onOk) {
        modalBox.innerHTML = \`
            <div class="success-icon">&#10004;</div>
            <div class="modal-title">\${title}</div>
            <div class="modal-desc">\${desc}</div>
            <button type="button" class="btn btn-primary" id="modalOkBtn" style="margin-top: 20px;">OK</button>
        \`;
        overlay.className = 'overlay active';
        document.getElementById('modalOkBtn').addEventListener('click', () => {
            overlay.className = 'overlay';
            if (onOk) onOk();
        });
    }

    function showError(title, desc) {
        modalBox.innerHTML = \`
            <div class="error-icon">&#10006;</div>
            <div class="modal-title">\${title}</div>
            <div class="modal-desc">\${desc}</div>
            <button type="button" class="btn btn-primary" id="modalCloseBtn" style="margin-top: 20px; background: var(--danger)">Close</button>
        \`;
        overlay.className = 'overlay active';
        document.getElementById('modalCloseBtn').addEventListener('click', () => {
            overlay.className = 'overlay';
        });
    }

    // --- Form Submission Handler ---
    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // 1. Gather general fields
        const employeeVal = document.getElementById('employee').value;
        const dateVal = document.getElementById('date').value;
        const subsidiaryVal = document.getElementById('subsidiary').value;
        const currencyVal = document.getElementById('currency').value;
        const exchangerateVal = document.getElementById('exchangerate').value;
        const departmentVal = document.getElementById('department').value;
        const classVal = document.getElementById('class').value;
        const memoVal = document.getElementById('memo').value;

        if (!employeeVal) {
            alert('Please select an employee.');
            return;
        }

        if (!currencyVal) {
            alert('Please select a currency.');
            return;
        }

        if (!exchangerateVal || parseFloat(exchangerateVal) <= 0) {
            alert('Please enter a valid exchange rate.');
            return;
        }

        if (activeLines.size === 0) {
            alert('Please add at least one expense line.');
            return;
        }

        // 2. Gather lines
        const lines = [];
        let valid = true;

        activeLines.forEach(lineId => {
            const cat = document.getElementById('line_category-' + lineId).value;
            const dt = document.getElementById('line_date-' + lineId).value;
            const lineCurr = document.getElementById('line_currency-' + lineId).value;
            const amt = document.getElementById('line_amount-' + lineId).value;
            const m = document.getElementById('line_memo-' + lineId).value;

            if (!dt || !lineCurr || !amt) {
                valid = false;
            }

            lines.push({
                category: cat || null,
                date: dt,
                currency: lineCurr,
                amount: amt,
                memo: m,
                receipt: lineReceiptData[lineId] || null
            });
        });

        if (!valid) {
            alert('Please complete all mandatory fields (including Currency, Date, and Amount) on the expense lines.');
            return;
        }

        const payload = {
            employee: employeeVal,
            date: dateVal,
            subsidiary: subsidiaryVal,
            currency: currencyVal,
            exchangerate: exchangerateVal,
            department: departmentVal,
            class: classVal,
            memo: memoVal,
            lines: lines
        };

        // 3. Post to Suitelet
        showLoading('Submitting Expense Report', 'Saving your expense details and processing receipts...');

        fetch(window.location.href, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccess('Submission Successful', data.message || 'Your expense report has been logged.', () => {
                    expenseForm.reset();
                    linesList.innerHTML = '';
                    activeLines.clear();
                    Object.keys(lineReceiptData).forEach(k => delete lineReceiptData[k]);
                    calculateTotal();
                    createExpenseLine(); // Add an initial empty line
                });
            } else {
                showError('Submission Failed', data.message || 'An error occurred while saving the report.');
            }
        })
        .catch(err => {
            console.error(err);
            showError('Submission Failed', 'A network error occurred. Please try again.');
        });
    });

    // --- Initialize the Page ---
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize general dropdowns with employee auto-sourcing callback
        initSearchableDropdown('employeeWrapper', employees, (selectedEmployee) => {
            if (selectedEmployee.subsidiary && subsidiaries && subsidiaries.length > 0) {
                setDropdownValue('subsidiaryWrapper', selectedEmployee.subsidiary, subsidiaries);
            }
            if (selectedEmployee.department) {
                setDropdownValue('departmentWrapper', selectedEmployee.department, departments);
            }
            if (selectedEmployee.class) {
                setDropdownValue('classWrapper', selectedEmployee.class, classes);
            }
        });

        if (subsidiaries && subsidiaries.length > 0) {
            document.getElementById('subsidiaryContainer').style.display = 'block';
            initSearchableDropdown('subsidiaryWrapper', subsidiaries);
        }

        initSearchableDropdown('currencyWrapper', currencies, (selectedCurrency) => {
            activeCurrencySymbol = selectedCurrency.symbol || selectedCurrency.name || '$';
            activeLines.forEach(lineId => {
                setDropdownValue('lineCurrencyWrapper-' + lineId, selectedCurrency.id, currencies);
                const symbolSpan = document.querySelector('#line-card-' + lineId + ' .currency-symbol');
                if (symbolSpan) {
                    symbolSpan.textContent = activeCurrencySymbol;
                }
            });
        });
        initSearchableDropdown('departmentWrapper', departments);
        initSearchableDropdown('classWrapper', classes);

        // Add addLine listener
        addLineBtn.addEventListener('click', createExpenseLine);

        // Add first blank line
        createExpenseLine();
    });
</script>

</body>
</html>`;
            response.write(html);
        } catch (e) {
            log.error('Error rendering HTML page', e);
            response.write(`<h3>Error rendering form: ${e.message}</h3>`);
        }
    };

    return {
        onRequest: onRequest
    };
});
