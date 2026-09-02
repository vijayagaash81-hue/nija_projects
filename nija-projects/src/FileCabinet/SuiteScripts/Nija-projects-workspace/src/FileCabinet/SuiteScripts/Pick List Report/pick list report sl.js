/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/query', 'N/log', 'N/render', 'N/url', 'N/runtime'], (query, log, render, url, runtime) => {

    const onRequest = (scriptContext) => {
        if (scriptContext.request.method === 'GET' || scriptContext.request.method === 'POST') {
            try {
                // 1. SQL Query (Kept exactly as provided)
                let sql = `
                    SELECT 
                        BUILTIN.DF(A.name) AS picklist_no,
                        BUILTIN.DF(B.custrecord_pl_det_doc_num) AS salesorder, 
                        COALESCE(F.companyname, F.altname, (F.firstname || ' ' || F.lastname), '') AS customer,
                        BUILTIN.DF(B.custrecord_pl_det_item) AS item, 
                        B.custrecord_njt_item_description AS item_desc, 
                        E.description AS item_record_desc,
                        BUILTIN.DF(D.custrecord_inv_bin_lot_det_bin_num) AS bin, 
                        D.custrecord_inv_bin_available AS available, 
                        C.custrecord_cust_inv_det_quantity AS inv_qty,
                        D.custrecord_inv_bin_lot_det_quantity AS qty_to_pick, 
                        B.custrecord_pl_det_picked_quantity AS qty_done, 
                        B.custrecord_pl_det_is_picked AS is_picked 
                    FROM customrecord_njt_pick_list A 
                    INNER JOIN customrecord_pick_list_details B ON B.custrecord_pl_det_parent_link = A.id 
                    INNER JOIN customrecord_cuctom_inv_det C ON C.custrecord_cust_inv_pick_list = A.id 
                        AND C.custrecord_cust_inv_det_item = B.custrecord_pl_det_item
                    INNER JOIN customrecord_inv_bin_lot_det D ON D.custrecord_inv_bin_lot_det_parent_link = C.id
                    LEFT JOIN item E ON E.id = B.custrecord_pl_det_item
                    LEFT JOIN customer F ON F.id = B.custrecord_pl_det_customer`;

                log.debug("Executing SQL", sql);

                let rawResults = query.runSuiteQL({ query: sql }).asMappedResults();

                // Strict deduplication
                let seen = {};
                let results = rawResults.filter(item => {
                    let k = `${item.picklist_no}|${item.salesorder}|${item.item}|${item.bin}|${item.qty_to_pick}`;
                    return seen.hasOwnProperty(k) ? false : (seen[k] = true);
                });

                // Filter by visible keys if parameter is present (passed from front-end search/filter)
                const visibleKeysParam = scriptContext.request.parameters.visible_keys;
                if (visibleKeysParam) {
                    try {
                        let visibleKeys = JSON.parse(visibleKeysParam);
                        let keySet = new Set(visibleKeys);
                        results = results.filter(item => {
                            let k = `${item.picklist_no || ''}||${item.salesorder || ''}||${item.item || ''}||${item.bin || ''}`;
                            return keySet.has(k);
                        });
                    } catch (err) {
                        log.error("Error parsing visible_keys", err);
                    }
                }

                const isPrint = scriptContext.request.parameters.print === 'T';
                const scriptUrl = url.resolveScript({
                    scriptId: runtime.getCurrentScript().id,
                    deploymentId: runtime.getCurrentScript().deploymentId
                });

                // --- Styles: Updated for solid header and consistent layout ---
                let styleHtml = `
                    <style>
                        body { font-family: 'Inter', sans-serif, Arial; color: #1f2937; }
                        .page-header { text-align: center; margin-bottom: 25px; border-bottom: 1px solid #d1d5db; padding-bottom: 15px; }
                        .page-header h1 { font-size: 22px; font-weight: 800; margin: 0; color: #1b3f6b; text-transform: uppercase; letter-spacing: 1px; }

                        .btn-download { 
                            background-color: #1b3f6b; color: #ffffff !important; padding: 8px 16px; 
                            border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: 600;
                            float: right; margin-top: -35px; transition: background 0.2s;
                        }

                        table { width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; background-color: #ffffff; }
                        
                        /* Solid Header Design: No spaces between columns */
                        thead th { 
                            cursor: pointer !important;
                            background-color: #1b3f6b !important; 
                            color: #ffffff !important; 
                            font-size: 11px !important; 
                            padding: 14px 8px !important; 
                            text-align: center !important; 
                            font-weight: 700 !important; 
                            border: 1px solid #1b3f6b !important; /* Border matches background to remove gaps */
                            vertical-align: middle !important;
                        }

                        table.dataTable thead .sorting:before, 
                        table.dataTable thead .sorting:after,
                        table.dataTable thead .sorting_asc:before, 
                        table.dataTable thead .sorting_asc:after,
                        table.dataTable thead .sorting_desc:before, 
                        table.dataTable thead .sorting_desc:after {
                            color: #ffffff !important;
                            opacity: 0.8 !important;
                        }

                        td { padding: 10px 8px; border: 1px solid #d1d5db; font-size: 10.5px; vertical-align: middle; color: #374151; }

                        .group-col { text-align: center; vertical-align: middle; border-top: 0px !important; border-bottom: 0px !important; }
                        .group-end { border-bottom: 1px solid #d1d5db !important; }
                        .picklist-spacer { border-top: 3px solid #1b3f6b !important; }

                        .so-badge { font-weight: 700; color: #1b3f6b; margin: 0; text-align: center; line-height: 1.2; font-size: 10.5px; }
                        .item-name { font-weight: 700; display: block; text-align: center; font-size: 10.5px; color: #111827; }
                        .item-subtext { font-size: 9px; color: #6b7280; display: block; text-align: center; margin-top: 2px; }

                        .bin-container { color: #4b5563; font-weight: 600; }
                        .bin-icon { font-size: 14px; margin-right: 6px; }

                        .progress-text { font-size: 9.5px; font-weight: 700; color: #1b3f6b; text-align: center; margin: 0 0 4px 0; }
                        .progress-container { width: 80px; background-color: #f1f5f9; height: 8px; border-radius: 10px; border: 0.5px solid #d1d5db; margin: 0 auto; overflow: hidden; }
                        .progress-fill { background-color: #1b3f6b; height: 100%; border-radius: 10px; }

                        .status-pill { padding: 4px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; text-align: center; display: inline-block; width: 60px; text-transform: uppercase; }
                        .status-picked { background-color: #dcfce7; color: #15803d; border: 1px solid #15803d; }
                        .status-pending { background-color: #fff7ed; color: #c2410c; border: 1px solid #c2410c; }
                    </style>`;

                const CELL_BORDER = '1px solid #d1d5db';
                const FONT_BASE = 'font-family: sans-serif; font-size: 10px; color: #1f2937;';

                let tableRows = '';
                for (let i = 0; i < results.length; i++) {
                    let row = results[i];
                    let prevRow = i > 0 ? results[i - 1] : null;
                    let nextRow = i < results.length - 1 ? results[i + 1] : null;

                    let isNewPick = !prevRow || row.picklist_no !== prevRow.picklist_no;
                    let isNewSO = isNewPick || (prevRow && row.salesorder !== prevRow.salesorder);
                    let isNewItem = isNewSO || (prevRow && row.item !== prevRow.item);

                    let isEndPick = !nextRow || row.picklist_no !== nextRow.picklist_no;
                    let isEndSO = isEndPick || (nextRow && row.salesorder !== nextRow.salesorder);
                    let isEndItem = isEndSO || (nextRow && row.item !== nextRow.item);

                    const qtyToPick = parseFloat(row.qty_to_pick) || 0;
                    const qtyDone = parseFloat(row.qty_done) || 0;
                    const pickPct = qtyToPick > 0 ? Math.min(100, Math.round((qtyDone / qtyToPick) * 100)) : 0;
                    const isDone = (row.is_picked === 'T' || row.is_picked === true);

                    const itemDesc = row.item_desc || row.item_record_desc || row.item;

                    const pickCellContent = isNewPick ? `<p style="font-weight:bold; margin:0; text-align:center; color:#1b3f6b; font-size:10px;">${row.picklist_no || '\u2014'}</p>` : '';
                    const soCellContent = isNewSO ? `<p style="font-weight:bold; margin:0; text-align:center; color:#1b3f6b; font-size:10px;">#${row.salesorder || 'N/A'}</p>` : '';
                    const customerCellContent = isNewSO ? `<p style="font-weight:bold; margin:0; text-align:center; color:#1f2937; font-size:10px;">${row.customer || '\u2014'}</p>` : '';
                    const itemCellContent = isNewItem ? `<p style="font-weight:bold; margin:0; text-align:center; font-size:10px; color:#1f2937;">${itemDesc}</p>` : '';

                    if (isPrint) {
                        let pickStyle = `${FONT_BASE} border-top:${isNewPick ? CELL_BORDER : 'none'}; border-bottom:${isEndPick ? CELL_BORDER : 'none'}; border-left:${CELL_BORDER}; border-right:${CELL_BORDER}; text-align:center; vertical-align:middle; padding:8px;`;
                        let soStyle = `${FONT_BASE} border-top:${isNewSO ? CELL_BORDER : 'none'}; border-bottom:${isEndSO ? CELL_BORDER : 'none'}; border-left:${CELL_BORDER}; border-right:${CELL_BORDER}; text-align:center; vertical-align:middle; padding:8px;`;
                        let custStyle = `${FONT_BASE} border-top:${isNewSO ? CELL_BORDER : 'none'}; border-bottom:${isEndSO ? CELL_BORDER : 'none'}; border-left:${CELL_BORDER}; border-right:${CELL_BORDER}; text-align:center; vertical-align:middle; padding:8px;`;
                        let itemStyle = `${FONT_BASE} border-top:${isNewItem ? CELL_BORDER : 'none'}; border-bottom:${isEndItem ? CELL_BORDER : 'none'}; border-left:${CELL_BORDER}; border-right:${CELL_BORDER}; text-align:center; vertical-align:middle; padding:8px;`;
                        let pdfDataStyle = `${FONT_BASE} border-top:${CELL_BORDER}; border-bottom:${CELL_BORDER}; border-left:${CELL_BORDER}; border-right:${CELL_BORDER}; padding:8px; vertical-align:middle;`;

                        tableRows += `
                        <tr>
                            <td style="${pickStyle}">${pickCellContent}</td>
                            <td style="${soStyle}">${soCellContent}</td>
                            <td style="${custStyle}">${customerCellContent}</td>
                            <td style="${itemStyle}">${itemCellContent}</td>
                            <td style="${pdfDataStyle}"><p style="margin:0; color:#4b5563; font-weight:600; text-align:left; font-size:10px;">&#128230; ${row.bin || '\u2014'}</p></td>
                            <td align="center" style="${pdfDataStyle} text-align:center;"><b>${row.inv_qty || 0}</b></td>
                            <td align="center" style="${pdfDataStyle} text-align:center;"><b>${row.available || 0}</b></td>
                            <td align="center" style="${pdfDataStyle} text-align:center;">
                                <p style="font-size:9px; font-weight:bold; color:#1b3f6b; margin:0 0 3px 0; text-align:center;">${qtyDone} / ${qtyToPick}</p>
                                <table width="70" align="center" style="border:0.5px solid #d1d5db; height:8px; border-collapse:collapse; margin:0 auto;">
                                    <tr>
                                        <td width="${pickPct}%" style="background-color:#1b3f6b; border:0px; padding:0; height:8px; line-height:0; font-size:0;"></td>
                                        <td width="${100 - pickPct}%" style="background-color:#f1f5f9; border:0px; padding:0; height:8px; line-height:0; font-size:0;"></td>
                                    </tr>
                                </table>
                            </td>
                            <td align="center" style="${pdfDataStyle} text-align:center;">
                                <p style="background-color:${isDone ? '#dcfce7' : '#fff7ed'}; color:${isDone ? '#15803d' : '#c2410c'}; font-weight:bold; border:0.5px solid ${isDone ? '#15803d' : '#c2410c'}; padding:3px 4px; border-radius:3px; font-size:8px; text-align:center; margin:0;">${isDone ? 'Picked' : 'Pending'}</p>
                            </td>
                        </tr>`;
                    } else {
                        let rowSpacer = isNewPick && i > 0 ? 'picklist-spacer' : '';
                        let rowKey = `${row.picklist_no || ''}||${row.salesorder || ''}||${row.item || ''}||${row.bin || ''}`;
                        tableRows += `
                        <tr class="${rowSpacer}" data-row-key="${rowKey}">
                            <td class="group-col ${isEndItem ? 'group-end' : ''}" data-order="${row.picklist_no || ''}" data-search="${row.picklist_no || ''}">${isNewPick ? `<p class="so-badge">${row.picklist_no || '\u2014'}</p>` : ''}</td>
                            <td class="group-col ${isEndItem ? 'group-end' : ''}" data-order="${row.salesorder || ''}" data-search="#${row.salesorder || ''} ${row.salesorder || ''}">${isNewSO ? `<p class="so-badge">#${row.salesorder || 'N/A'}</p>` : ''}</td>
                            <td class="group-col ${isEndItem ? 'group-end' : ''}" data-order="${row.customer || ''}" data-search="${row.customer || ''}">${isNewSO ? `<span class="item-name">${row.customer || '\u2014'}</span>` : ''}</td>
                            <td class="group-col ${isEndItem ? 'group-end' : ''}" data-order="${itemDesc || ''}" data-search="${itemDesc} ${row.item || ''}">${isNewItem ? `<span class="item-name">${itemDesc}</span>` : ''}</td>
                            <td data-order="${row.bin || ''}"><div class="bin-container"><span class="bin-icon">&#128230;</span> ${row.bin || '\u2014'}</div></td>
                            <td align="center" data-order="${parseFloat(row.inv_qty) || 0}"><b>${row.inv_qty || 0}</b></td>
                            <td align="center" data-order="${parseFloat(row.available) || 0}"><b>${row.available || 0}</b></td>
                            <td align="center" data-order="${pickPct}">
                                <p class="progress-text">${qtyDone} / ${qtyToPick}</p>
                                <div class="progress-container"><div class="progress-fill" style="width: ${pickPct}%;"></div></div>
                            </td>
                            <td align="center" data-order="${isDone ? 'Picked' : 'Pending'}"><p class="status-pill ${isDone ? 'status-picked' : 'status-pending'}">${isDone ? 'Picked' : 'Pending'}</p></td>
                        </tr>`;
                    }
                }

                const sortArrow = isPrint ? ' <span style="font-size:8px; vertical-align:middle; color:#ffffff;">&#9650;&#9660;</span>' : '';
                // PDF Header Style: Border color matches background for seamless look
                const headerCellStylePdf = `background-color:#1b3f6b; color:#ffffff; font-family:sans-serif; font-size:10px; padding:12px 5px; text-align:center; font-weight:bold; border:1px solid #1b3f6b;`;

                let contentHtml = `
                    <div class="page-header">
                        <h1>PICK LIST REPORT</h1>
                        ${!isPrint ? `<a href="javascript:void(0)" onclick="downloadFilteredPdf()" class="btn-download">Download PDF</a>` : ''}
                    </div>
                    <table id="reportTable" class="table table-hover" style="${isPrint ? 'border-collapse:collapse; width:100%; border:1px solid #d1d5db; background-color:#ffffff;' : ''}">
                        <thead>
                            <tr>
                                <th width="8%" style="${isPrint ? headerCellStylePdf : ''}">Pick List #${sortArrow}</th>
                                <th width="12%" style="${isPrint ? headerCellStylePdf : ''}">Sales Order${sortArrow}</th>
                                <th width="15%" style="${isPrint ? headerCellStylePdf : ''}">Customer${sortArrow}</th>
                                <th width="20%" style="${isPrint ? headerCellStylePdf : ''}">Item Details${sortArrow}</th>
                                <th width="12%" style="${isPrint ? headerCellStylePdf : ''}">BIN${sortArrow}</th>
                                <th width="6%" style="${isPrint ? headerCellStylePdf : ''}">Inv Qty${sortArrow}</th>
                                <th width="7%" style="${isPrint ? headerCellStylePdf : ''}">Available${sortArrow}</th>
                                <th width="12%" style="${isPrint ? headerCellStylePdf : ''}">Qty / Picked Qty${sortArrow}</th>
                                <th width="8%" style="${isPrint ? headerCellStylePdf : ''}">Status${sortArrow}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>`;

                if (isPrint) {
                    let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n' +
                        '<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">\n' +
                        '<pdf>\n' +
                        '<head><style>body { font-family: sans-serif; color: #1f2937; } .page-header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #d1d5db; padding-bottom: 10px; } .page-header h1 { font-size: 20px; font-weight: bold; margin: 0; color: #1b3f6b; }</style></head>\n' +
                        '<body padding="0.3in" size="A4-landscape">\n' +
                        contentHtml.replace(/&(?![a-z0-9#]+;)/gi, '&amp;') +
                        '</body>\n' +
                        '</pdf>';

                    let pdfFile = render.xmlToPdf({ xmlString: xmlString });
                    pdfFile.name = 'PickListReport.pdf';
                    scriptContext.response.writeFile(pdfFile, false);

                } else {
                    let fullHtml = `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                        <link rel="stylesheet" href="https://cdn.datatables.net/1.13.5/css/dataTables.bootstrap5.min.css">
                        ${styleHtml}
                    </head>
                    <body style="background-color: #f1f5f9; padding: 30px;">
                        <div class="container-fluid" style="background: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                            ${contentHtml}
                        </div>
                        <script src="https://code.jquery.com/jquery-3.7.0.js"></script>
                        <script src="https://cdn.datatables.net/1.13.5/js/jquery.dataTables.min.js"></script>
                        <script src="https://cdn.datatables.net/1.13.5/js/dataTables.bootstrap5.min.js"></script>
                        <script>
                            $(document).ready(function() {
                                $('#reportTable').DataTable({
                                    pageLength: 50,
                                    ordering: true,
                                    order: [],
                                    dom: '<"d-flex justify-content-between mb-4"f l>rt<"d-flex justify-content-between mt-4"i p>',
                                    language: { 
                                        search: "", 
                                        searchPlaceholder: "Search records...",
                                        lengthMenu: "Show _MENU_ entries"
                                    }
                                });
                            });

                            function downloadFilteredPdf() {
                                var table = $('#reportTable').DataTable();
                                var visibleKeys = [];
                                
                                // Get keys of rows that are currently visible/applied search filters
                                table.rows({ search: 'applied' }).every(function() {
                                    var node = this.node();
                                    var key = $(node).attr('data-row-key');
                                    if (key) {
                                        visibleKeys.push(key);
                                    }
                                });

                                // Create a form dynamically to send visible keys via POST
                                var form = document.createElement('form');
                                form.method = 'POST';
                                form.action = window.location.href + (window.location.href.indexOf('?') === -1 ? '?' : '&') + 'print=T';
                                
                                var input = document.createElement('input');
                                input.type = 'hidden';
                                input.name = 'visible_keys';
                                input.value = JSON.stringify(visibleKeys);
                                form.appendChild(input);
                                
                                document.body.appendChild(form);
                                form.submit();
                                document.body.removeChild(form);
                            }
                        </script>
                    </body>
                    </html>`;
                    scriptContext.response.write(fullHtml);
                }

            } catch (e) {
                log.error('UI Generation Error', e);
                scriptContext.response.write('System Error: ' + e.message);
            }
        }
    };

    return { onRequest };
});