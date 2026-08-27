/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/query', 'N/log'], (query, log) => {

    const onRequest = (scriptContext) => {
        const request = scriptContext.request;
        const response = scriptContext.response;

        if (request.method === 'GET') {
            try {
                const action = request.parameters.action;
                const locationId = request.parameters.location;

                if (action === 'getBins') {
                    let bins = [];
                    if (locationId) {
                        try {
                            const binRes = query.runSuiteQL({
                                query: `SELECT id, binnumber FROM bin WHERE location = ? AND inactive = 'F' ORDER BY binnumber`,
                                params: [locationId]
                            }).asMappedResults();
                            bins = binRes.map(r => ({
                                id: r.id,
                                name: r.binnumber
                            }));
                        } catch (err) {
                            log.error('Error fetching bins for API', err);
                        }
                    }
                    response.setHeader({
                        name: 'Content-Type',
                        value: 'application/json'
                    });
                    response.write(JSON.stringify(bins));
                    return;
                }

                const itemId = request.parameters.item;
                const targetQty = parseFloat(request.parameters.quantity) || 0;
                const lotNumber = request.parameters.lotnumber || '';
                const line = request.parameters.line;
                const existingDetails = request.parameters.details || '';

                log.debug('Suitelet GET request', { itemId, locationId, targetQty, lotNumber, line, existingDetails });

                // Fetch Item Name
                let itemName = 'Unknown Item';
                if (itemId) {
                    try {
                        const itemRes = query.runSuiteQL({
                            query: `SELECT fullname FROM item WHERE id = ?`,
                            params: [itemId]
                        }).asMappedResults();
                        if (itemRes.length > 0) {
                            itemName = itemRes[0].fullname;
                        }
                    } catch (err) {
                        log.error('Error fetching item name', err);
                    }
                }

                // Fetch Location Name
                let locationName = 'Unknown Location';
                if (locationId) {
                    try {
                        const locRes = query.runSuiteQL({
                            query: `SELECT name FROM location WHERE id = ?`,
                            params: [locationId]
                        }).asMappedResults();
                        if (locRes.length > 0) {
                            locationName = locRes[0].name;
                        }
                    } catch (err) {
                        log.error('Error fetching location name', err);
                    }
                }

                // Fetch Bins for this Location
                let bins = [];
                if (locationId) {
                    try {
                        const binRes = query.runSuiteQL({
                            query: `SELECT id, binnumber FROM bin WHERE location = ? AND inactive = 'F' ORDER BY binnumber`,
                            params: [locationId]
                        }).asMappedResults();
                        bins = binRes.map(r => ({
                            id: r.id,
                            name: r.binnumber
                        }));
                    } catch (err) {
                        log.error('Error fetching bins', err);
                    }
                }

                // Render HTML
                const htmlContent = getPopupHtml(itemName, locationName, targetQty, lotNumber, line, existingDetails, bins);
                response.write(htmlContent);

            } catch (e) {
                log.error('Error rendering pop-up Suitelet', e);
                response.write(`<h3>System Error</h3><p>${e.message}</p>`);
            }
        }
    };

    function getPopupHtml(itemName, locationName, targetQty, lotNumber, line, existingDetails, bins) {
        // Stringify bins safely for use in front-end JS
        const binsJson = JSON.stringify(bins);
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventory Detail Assignment</title>
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <style>
        body {
            background-color: #f8fafc;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(226, 232, 240, 0.8);
        }
    </style>
</head>
<body class="p-6 font-sans">

    <div class="max-w-4xl mx-auto glass-card rounded-2xl shadow-xl overflow-hidden">
        
        <!-- Header Banner -->
        <div class="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex justify-between items-center">
            <div>
                <h1 class="text-xl font-bold tracking-tight">Inventory Detail Assignment</h1>
                <p class="text-xs text-slate-300 mt-1">Assign bins, lots, and quantities for Production Completion</p>
            </div>
            <div class="text-right">
                <span class="text-xs text-indigo-200 uppercase tracking-wider block">Target Quantity</span>
                <span class="text-2xl font-extrabold text-white" id="targetQtyDisplay">${targetQty}</span>
            </div>
        </div>

        <!-- Info Card -->
        <div class="grid grid-cols-3 gap-4 p-5 border-b border-slate-200 bg-slate-50">
            <div>
                <span class="text-xs font-semibold text-slate-500 block uppercase">Item Name</span>
                <span class="text-sm font-bold text-slate-800">${itemName}</span>
            </div>
            <div>
                <span class="text-xs font-semibold text-slate-500 block uppercase">Completion Location</span>
                <span class="text-sm font-bold text-slate-800">${locationName}</span>
            </div>
            <div>
                <span class="text-xs font-semibold text-slate-500 block uppercase">Allocation Status</span>
                <div class="flex items-center mt-0.5">
                    <span id="statusBadge" class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Pending Allocation
                    </span>
                </div>
            </div>
        </div>

        <!-- Main Workspace -->
        <div class="p-6">
            <form id="detailsForm" onsubmit="event.preventDefault();">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                            <th class="pb-3 w-1/3">Bin Number</th>
                            <th class="pb-3 w-1/3">Heat / Lot No</th>
                            <th class="pb-3 w-1/4">Quantity</th>
                            <th class="pb-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody id="tableBody" class="divide-y divide-slate-100">
                        <!-- Dynamic Rows go here -->
                    </tbody>
                </table>

                <!-- Control Buttons -->
                <div class="mt-6 flex justify-between items-center">
                    <button type="button" onclick="addRow()" class="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-semibold transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Row
                    </button>
                    
                    <div class="text-right">
                        <span class="text-xs text-slate-500 block uppercase">Total Allocated</span>
                        <span class="text-lg font-bold text-slate-800" id="totalAllocated">0</span>
                        <span class="text-xs text-slate-400">/ ${targetQty}</span>
                    </div>
                </div>
            </form>
        </div>

        <!-- Footer Actions -->
        <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onclick="window.close()" class="px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold transition-all">
                Cancel
            </button>
            <button type="button" onclick="submitDetails()" class="px-5 py-2 text-white bg-slate-900 hover:bg-indigo-950 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg">
                Save & Close
            </button>
        </div>

    </div>

    <!-- Script Section -->
    <script>
        const targetQty = ${targetQty};
        const defaultLot = "${lotNumber}";
        const line = "${line}";
        const bins = ${binsJson};
        const existingDataRaw = "${existingDetails}";

        // Initialize table
        document.addEventListener('DOMContentLoaded', () => {
            if (existingDataRaw && existingDataRaw.trim().length > 2) {
                try {
                    const parsed = JSON.parse(existingDataRaw);
                    parsed.forEach(row => addRow(row.binId, row.lot, row.qty));
                } catch (e) {
                    console.error('Failed to parse existing details JSON', e);
                    addRow(null, defaultLot, targetQty);
                }
            } else {
                addRow(null, defaultLot, targetQty);
            }
            updateTotal();
        });

        // Add Row to Table
        function addRow(binId = null, lot = defaultLot, qty = '') {
            const tbody = document.getElementById('tableBody');
            const rowId = 'row_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            
            const tr = document.createElement('tr');
            tr.id = rowId;
            tr.className = "group hover:bg-slate-50/50 transition-colors";

            // Bin Dropdown Column
            let binOptions = bins.map(b => 
                \`<option value="\${b.id}" \${binId == b.id ? 'selected' : ''}>\${b.name}</option>\`
            ).join('');

            const binSelectHtml = bins.length > 0 
                ? \`<select name="bin" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all">
                        <option value="">-- Select Bin --</option>
                        \${binOptions}
                   </select>\`
                : \`<div class="text-xs text-rose-500 font-semibold py-2">No bins configured for this location</div>\`;

            tr.innerHTML = \`
                <td class="py-3 pr-4">\${binSelectHtml}</td>
                <td class="py-3 pr-4">
                    <input type="text" name="lot" value="\${lot}" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all" placeholder="Enter Lot Number">
                </td>
                <td class="py-3 pr-4">
                    <input type="number" name="qty" value="\${qty}" step="any" oninput="updateTotal()" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all" placeholder="Qty">
                </td>
                <td class="py-3 text-right">
                    <button type="button" onclick="removeRow('\${rowId}')" class="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" class="w-5 h-5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </td>
            \`;

            tbody.appendChild(tr);
            updateTotal();
        }

        // Remove Row
        function removeRow(rowId) {
            const row = document.getElementById(rowId);
            if (row) {
                row.remove();
                updateTotal();
            }
        }

        // Calculate and Update Totals & Badges
        function updateTotal() {
            const qtyInputs = document.getElementsByName('qty');
            let total = 0;
            for (let input of qtyInputs) {
                total += parseFloat(input.value) || 0;
            }
            // Round to 5 decimal places to avoid floating point math issues
            total = Math.round(total * 100000) / 100000;
            
            document.getElementById('totalAllocated').innerText = total;

            const statusBadge = document.getElementById('statusBadge');
            const difference = Math.round((targetQty - total) * 100000) / 100000;

            if (difference === 0) {
                statusBadge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1";
                statusBadge.innerHTML = \`<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Fully Allocated\`;
            } else if (total > targetQty) {
                statusBadge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1";
                statusBadge.innerHTML = \`<span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> Over Allocated (\${total - targetQty} extra)\`;
            } else {
                statusBadge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1";
                statusBadge.innerHTML = \`<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Under Allocated (\${difference} left)\`;
            }
        }

        // Submit Details back to Parent Client Script
        function submitDetails() {
            const rows = document.getElementById('tableBody').children;
            const data = [];
            let total = 0;
            let validationFailed = false;

            for (let tr of rows) {
                const binSelect = tr.querySelector('[name="bin"]');
                const lotInput = tr.querySelector('[name="lot"]');
                const qtyInput = tr.querySelector('[name="qty"]');

                if (!binSelect || !lotInput || !qtyInput) continue;

                const binId = binSelect.value;
                const binName = binSelect.options[binSelect.selectedIndex]?.text || '';
                const lot = lotInput.value.trim();
                const qty = parseFloat(qtyInput.value) || 0;

                if (!binId) {
                    alert('Please select a Bin for all rows.');
                    validationFailed = true;
                    binSelect.focus();
                    break;
                }
                if (!lot) {
                    alert('Please enter a Lot Number for all rows.');
                    validationFailed = true;
                    lotInput.focus();
                    break;
                }
                if (qty <= 0) {
                    alert('Please enter a positive Quantity for all rows.');
                    validationFailed = true;
                    qtyInput.focus();
                    break;
                }

                data.push({
                    binId: Number(binId),
                    binName: binName,
                    lot: lot,
                    qty: qty
                });
                total += qty;
            }

            if (validationFailed) return;

            if (data.length === 0) {
                alert('Please add at least one inventory detail row.');
                return;
            }

            total = Math.round(total * 100000) / 100000;
            if (total !== targetQty) {
                const diff = Math.abs(targetQty - total);
                const msg = total > targetQty 
                    ? \`Total allocated quantity (\${total}) exceeds the target quantity (\${targetQty}) by \${diff}. Please adjust before saving.\`
                    : \`Total allocated quantity (\${total}) is less than the target quantity (\${targetQty}) by \${diff}. Please adjust before saving.\`;
                alert(msg);
                return;
            }

            // Callback to parent client script
            if (window.opener && !window.opener.closed && typeof window.opener.setInventoryDetails === 'function') {
                window.opener.setInventoryDetails(line, JSON.stringify(data));
                window.close();
            } else {
                alert('Error: Parent window callback function not found.');
            }
        }
    </script>

</body>
</html>`;
    }

    return { onRequest };
});
