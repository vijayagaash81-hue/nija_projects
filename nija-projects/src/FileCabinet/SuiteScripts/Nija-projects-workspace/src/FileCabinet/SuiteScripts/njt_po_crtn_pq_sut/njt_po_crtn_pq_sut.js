/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/query', 'N/log', 'N/task', 'N/redirect', 'N/format'],
    (ui, query, log, task, redirect, format) => {

        const onRequest = async (context) => {

            const prId = context.request.parameters.pr_id || '';

            const form = ui.createForm({ title: 'PO Creation Based On PO Quotation' });

            const dataField = form.addField({
                id: 'custpage_selected_data',
                type: ui.FieldType.LONGTEXT,
                label: 'Selected Data'
            });
            dataField.updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });

            const htmlField = form.addField({
                id: 'custpage_html',
                type: ui.FieldType.INLINEHTML,
                label: ' '
            });

            // ---- Fetch PR options dynamically ----
            let prOptions = [];
            try {
                const prSql = `SELECT id,name FROM customrecord_njt_pur_req_h WHERE custrecord_njt_pur_req_status !=2 ORDER BY id`;
                prOptions = query.runSuiteQL({ query: prSql }).asMappedResults();
            } catch (e) {
                log.error('PR Fetch Error', e);
            }

            if (context.request.method === 'GET') {

                let thead = '', tbody = '', checkboxRow = '';
                let results = [];

                if (prId) {

                    const sql = `
                          SELECT
    a.id AS quotationid,
    a.custrecord_njt_pq_vendor AS vendor_id,
    COALESCE(v.entityid || ' ' || COALESCE(v.companyname, v.altname, (v.firstname || ' ' || v.lastname), ''), BUILTIN.DF(a.custrecord_njt_pq_vendor)) AS vendor_name,
    a.custrecord_njt_pq_currency AS currencyid,
    BUILTIN.DF(a.custrecord_njt_pq_currency) AS currencyname,

    b.custrecord_njt_pq_items_items AS item_id,
    BUILTIN.DF(b.custrecord_njt_pq_items_items) AS item_name,
    BUILTIN.DF(b.custrecord_njt_pq_items_description) AS item_desc,

    b.custrecord_njt_pq_items_request_quantity AS req_qty,
    b.custrecord_njt_pq_items_quantity AS quoted_qty,
    b.custrecord_njt_pq_items_rate AS price,

    i.lastpurchaseprice AS lastpurchasepriceforitem,

    t.po_id AS last_po_id,
    t.trandate AS last_po_date,
    t.rate AS last_po_item_rate,

    BUILTIN.DF(v.terms) AS paymentterms,

    t_lastvendor.vendor_id AS lastvendorid,
    BUILTIN.DF(t_lastvendor.vendor_id) AS lastvendorname,
     b.custrecord_njt_pq_items_status AS quotaionlne_status

FROM (
    SELECT *
    FROM customrecord_njt_pq_h q
    WHERE q.id IN (
        SELECT MAX(q2.id)
        FROM customrecord_njt_pq_h q2
        JOIN customrecord_njt_pq_items l2
            ON l2.custrecord_njt_pq_items_parent_link = q2.id
        WHERE q2.custrecord_njt_pq_pr = ${prId}
          AND q2.custrecord_njt_pq_status != 2 and l2.custrecord_njt_pq_items_status != 2
        GROUP BY
            q2.custrecord_njt_pq_vendor,
            l2.custrecord_njt_pq_items_items
    )
) a

LEFT JOIN customrecord_njt_pq_items b
    ON b.custrecord_njt_pq_items_parent_link = a.id

LEFT JOIN item i
    ON i.id = b.custrecord_njt_pq_items_items

LEFT JOIN (
    SELECT *
    FROM (
        SELECT
            t.id AS po_id,
            t.entity AS vendor_id,
            t.trandate,
            tl.item AS item_id,
            tl.rate,
            ROW_NUMBER() OVER (
                PARTITION BY t.entity, tl.item
                ORDER BY t.trandate DESC, t.id DESC
            ) AS rn
        FROM transaction t
        JOIN transactionline tl
            ON tl.transaction = t.id
           AND tl.mainline = 'F'
        WHERE t.type = 'PurchOrd'
    ) x
    WHERE rn = 1
) t
    ON t.vendor_id = a.custrecord_njt_pq_vendor
   AND t.item_id = b.custrecord_njt_pq_items_items


LEFT JOIN (
    SELECT *
    FROM (
        SELECT
            tl.item AS item_id,
            t.entity AS vendor_id,
            t.id AS po_id,
            t.trandate,
            ROW_NUMBER() OVER (
                PARTITION BY tl.item
                ORDER BY t.trandate DESC, t.id DESC
            ) AS rn
        FROM transaction t
        JOIN transactionline tl
            ON tl.transaction = t.id
           AND tl.mainline = 'F'
        WHERE t.type = 'PurchOrd'
    ) x
    WHERE rn = 1
) t_lastvendor
    ON t_lastvendor.item_id = b.custrecord_njt_pq_items_items

LEFT JOIN Vendor v
    ON v.id = a.custrecord_njt_pq_vendor

ORDER BY
    vendor_name,
    item_name;

                           `;
                    log.debug("sql", sql);



                    try {
                        results = query.runSuiteQL({ query: sql }).asMappedResults();
                    } catch (e) {
                        log.error('SQL Error', e);
                        htmlField.defaultValue = `<h3 style="color:red;text-align:center;padding:100px;">Query failed: ${e.message}</h3>`;
                        context.response.writePage(form);
                        return;
                    }

                    if (results.length > 0) {
                        // ---- Process results into vendor/item structure ----
                        const currencyName =
                            results.length > 0 ? results[0].currencyname : '';
                        const vendors = {};
                        results.forEach(r => {
                            const vid = r.vendor_id || 'unknown';
                            if (!vendors[vid]) {
                                vendors[vid] = {
                                    id: vid,
                                    name: r.vendor_name || 'Vendor',
                                    items: {},
                                    quotationId: r.quotationid,
                                    paymentterms: r.paymentterms || '0'
                                };
                            }
                            if (r.item_id) {
                                const isActive = r.quotaionlne_status != 2;

                                vendors[vid].items[r.item_id] = {
                                    // desc always
                                    desc: r.item_desc || r.item_name || 'Item',

                                    // rest depends on status
                                    req: isActive ? (r.req_qty || 0) : 0,
                                    quoted: isActive ? (r.quoted_qty || 0) : 0,
                                    price: isActive ? (r.price || 0) : 0,

                                    lastpurchaseprice: isActive ? (r.lastpurchasepriceforitem || 0) : 0,
                                    lastpoid: isActive ? (r.last_po_id || 0) : 0,
                                    lastpodate: isActive ? (r.last_po_date || 0) : 0,
                                    lastporate: isActive ? (r.last_po_item_rate || 0) : 0,
                                    lastvendorname: isActive ? (r.lastvendorname || '') : ''
                                };
                            }

                        });

                        const vendorList = Object.values(vendors);
                        const allItemIds = [...new Set(results.map(r => r.item_id).filter(Boolean))];

                        // ---- Build table HTML ----
                        thead = `<tr>
                            <th rowspan="2" style="width: 50px; min-width: 50px; white-space: nowrap; text-align: center; vertical-align: middle;">Select</th>
                            <th rowspan="2" style="min-width: 180px; text-align: left; padding-left: 12px; vertical-align: middle;">Item Description</th>
                            <th rowspan="2" style="width: 110px; min-width: 100px; text-align: center; vertical-align: middle;">Last Purchased Price (item)</th>
                            <th rowspan="2" style="width: 180px; min-width: 150px; text-align: center; vertical-align: middle;">Last Purchased Vendor (item)</th>`;
                        let subHeader = `<tr>`;
                        checkboxRow = `<tr style="background:#f8f9fa;border-top:4px solid #ddd;">
                    <td colspan="4" style="font-weight:bold;color:#2c3e50;font-size:17px;text-align:left;padding-left:12px;vertical-align:middle;">Select Vendor</td>`;

                        vendorList.forEach((v, i) => {
                            const col = 1 + i * 4;
                            thead += `<th colspan="4" style="text-align: center; vertical-align: middle;">${v.name}/(${v.paymentterms})</th>`;
                            subHeader += `<th style="width: 70px; min-width: 60px; text-align: center; vertical-align: middle;">Price(${currencyName})</th>
                                          <th style="width: 80px; min-width: 70px; text-align: center; vertical-align: middle;">Last PO Price</th>
                                          <th style="width: 80px; min-width: 70px; text-align: center; vertical-align: middle;">Required Qty</th>
                                          <th style="width: 80px; min-width: 70px; text-align: center; vertical-align: middle;">Quoted Qty</th>`;
                            checkboxRow += `<td colspan="4" style="text-align:center;padding:30px;">
                            <input type="checkbox" class="vendorCheck pretty-checkbox"
                                   data-col="${col}"
                                   data-vendor-id="${v.id}"
                                   data-vendor-name="${v.name}"
                                   data-quotation-id="${v.quotationId}">
                        </td>`;
                        });
                        thead += `</tr>${subHeader}</tr>`;
                        checkboxRow += `</tr>`;
                        // {format.format({ value: sample.lastpurchasepriceforitem, type: format.Type.CURRENCY })}
                        tbody = '';
                        allItemIds.forEach(itemId => {
                            const sample = results.find(r => r.item_id === itemId) || {};
                            log.audit("sample", sample);
                            tbody += `<tr class="dataRow" data-item-id="${itemId}">
                             <td><input type="checkbox" class="itemCheck"></td>
                        <td>${sample.item_desc || sample.item_name || 'Item'}</td>
                        
                       <td>
  ${sample.lastpurchasepriceforitem ? format.format({ value: sample.lastpurchasepriceforitem, type: format.Type.CURRENCY }) : format.format({ value: 0, type: format.Type.CURRENCY })}
</td>

                        <td>${sample.lastvendorname || '0'}</td>`;
                            vendorList.forEach(v => {
                                const d = v.items[itemId] || { price: 0, lastpurchaseprice: 0, req: 0, quoted: 0, lastporate: 0 };
                                tbody += `<td>${d.price}</td> <td>
  ${d.lastporate ? format.format({ value: d.lastporate, type: format.Type.CURRENCY }) : format.format({ value: 0, type: format.Type.CURRENCY })}
</td><td>${d.req}</td><td>${d.quoted}</td>`;
                            });
                            tbody += `</tr>`;
                        });
                    }
                }

                // ---- Inject HTML into Suitelet ----
                htmlField.defaultValue = `<!DOCTYPE html>
                                          <html><head>
                                          <meta charset="utf-8">
                                          <style>
                                          body,.uir-machine{font-family:'Segoe UI',sans-serif;background:#f9fbfc;margin:0}
                                          .container{max-width:98%;margin:15px auto;padding:15px;background:white;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.1)}
                                          h2{text-align:center;color:#2c3e50;font-size:24px;margin-bottom:8px}
                                          .subtitle{text-align:center;color:#7f8c8d;font-size:14px;margin-bottom:20px}
                                          .table-wrapper{overflow-x:auto;border-radius:12px;box-shadow:0 8px 25px rgba(0,0,0,0.12);margin-bottom:30px}
                                          #poMatrix{width:100%;border-collapse:separate;border-spacing:0}
                                          #poMatrix th{background:linear-gradient(135deg,#2c3e50,#34495e);color:white;padding:10px 6px;text-transform:uppercase;font-size:11px;letter-spacing:0.5px;white-space:normal;vertical-align:middle;word-break:break-word}
                                          #poMatrix td{padding:10px 6px;background:#fff;text-align:center;font-size:12px;transition:all .3s;word-break:break-word;vertical-align:middle}
                                          #poMatrix tbody tr:hover td{background:#f8f9fa}
                                          #poMatrix tr.dataRow td:first-child{width:50px;min-width:50px;text-align:center;background:#fff}
                                          #poMatrix tr.dataRow td:nth-child(2){font-weight:600;color:#2c3e50;background:#f1f3f5!important;text-align:left;padding-left:12px;white-space:normal;min-width:180px}
                                          
                                          /* Sticky / Frozen columns styling */
                                          #poMatrix thead tr:first-child th:nth-child(1),
                                          #poMatrix tr.dataRow td:nth-child(1) {
                                              position: sticky;
                                              left: 0;
                                              z-index: 5;
                                              background: #fff !important;
                                          }
                                          #poMatrix thead tr:first-child th:nth-child(1) {
                                              z-index: 6;
                                              background: linear-gradient(135deg,#2c3e50,#34495e) !important;
                                          }
                                          #poMatrix thead tr:first-child th:nth-child(2),
                                          #poMatrix tr.dataRow td:nth-child(2) {
                                              position: sticky;
                                              left: 50px;
                                              z-index: 5;
                                              background: #f1f3f5 !important;
                                          }
                                          #poMatrix thead tr:first-child th:nth-child(2) {
                                              z-index: 6;
                                              background: linear-gradient(135deg,#2c3e50,#34495e) !important;
                                          }
                                          
                                          .selected-vendor{background:#d4edda!important;font-weight:700!important;border-left:6px solid #27ae60!important}
                                          .lowest-price{background:#d5f5e3!important;color:#27ae60;font-weight:bold}
                                          .highest-quoted{background:#fef5e7!important;color:#e67e22;font-weight:bold}
                                          .pretty-checkbox{appearance:none;width:36px;height:36px;border:4px solid #3498db;border-radius:12px;position:relative;cursor:pointer;transition:.3s;background:white}
                                          .pretty-checkbox:checked{background:#27ae60;border-color:#27ae60}
                                          .pretty-checkbox:checked::after{content:'✓';color:white;font-weight:bold;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:22px}
                                          #createPOBtn{margin:40px auto;display:block;padding:18px 80px;font-size:20px;font-weight:700;color:white;background:linear-gradient(135deg,#27ae60,#2ecc71);border:none;border-radius:60px;box-shadow:0 12px 30px rgba(39,174,96,.4);cursor:pointer;text-transform:uppercase;letter-spacing:2px}
                                          #createPOBtn:hover{transform:translateY(-6px);box-shadow:0 20px 40px rgba(39,174,96,.5)}
                                          </style>
                                          <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
                                          </head><body>
                                          
                                          <!-- PR Dropdown -->
                                          <div style="margin:20px 0; text-align:center;">
                                              <label style="font-size:18px; font-weight:600; margin-right:10px;">
                                                  Select Purchase Request :
                                              </label>
                                              <select id="prSelect" style="padding:10px 15px; border:2px solid #2c3e50; border-radius:8px; font-size:16px;">
                                                  <option value="">-- Choose PR --</option>
                                                  ${prOptions.map(p => `<option value="${p.id}" ${prId === String(p.id) ? 'selected' : ''}>${p.name}</option>`).join('')}
                                              </select>
                                              <button type="button" id="loadBtn" style="margin-left:20px; padding:10px 25px; background:#3498db; color:white; border:none; border-radius:8px; font-size:16px; cursor:pointer;">
                                                  Load Details
                                              </button>
                                          </div>
                                          
                                          <div class="container">
                                          ${!prId ? `<div style="padding:120px;text-align:center;font-family:Segoe UI;">
                                          <h2 style="color:#e74c3c;">No Data Found</h2>
                                          <p>Please select a Purchase Request above to load the quotation matrix.</p>
                                          </div>` : results.length === 0 ? `<div style="padding:120px;text-align:center;font-family:Segoe UI;">
                                          <h2 style="color:#e67e22;">No Quotation Data</h2>
                                          <p>No approved quotations found for PR Internal ID: <strong>${prId}</strong></p>
                                          </div>` : `
                                          <div style="display:flex;align-items:center;position:relative;margin-bottom:10px;">
                                          
                                              <!-- LEFT : Action Dropdown -->
                                              <div style="flex:1;text-align:left;">
                                                  <select id="actionSelect"
                                                      style="padding:10px 14px;
                                                             border:2px solid #e74c3c;
                                                             border-radius:8px;
                                                             font-size:15px;
                                                             font-weight:600;">
                                                      <option value="">-- Action --</option>
                                                      <option value="approve">Approve</option>
                                                      <option value="reject">Reject</option>
                                                  </select>
                                              </div>
                                          
                                              <!-- CENTER : Heading -->
                                              <div style="flex:1;text-align:center;">
                                                  <h2 style="margin:0;">Purchase Order Quotation Matrix</h2>
                                              </div>
                                          
                                              <!-- RIGHT : Empty (for balance) -->
                                              <div style="flex:1;"></div>
                                          
                                          </div>
                                          
                                          <p class="subtitle">Lowest price = Green | Highest quoted qty = Orange | Click checkbox to select vendor</p>
                                          <div class="table-wrapper">
                                          <table id="poMatrix">
                                          <thead>${thead}</thead>
                                          <tbody>${tbody}${checkboxRow}</tbody>
                                          </table>
                                          </div>
                                          <button type="submit" id="createPOBtn">Submit</button>`}
                                          </div>
                                          
                                       <script>
$("#loadBtn").on("click", function(event){
    event.preventDefault();
    let pr = $("#prSelect").val();
    if(!pr){ 
        alert("Please select a PR ID"); 
        return; 
    }
    let url = window.location.href.split("&pr_id")[0];
    url += url.indexOf("?")===-1 ? "?pr_id=" + pr : "&pr_id=" + pr;
    window.location.href = url;
});

$(document).ready(function(){

    function isActionSelected() {
        return $("#actionSelect").val() !== "";
    }

    function alertNoAction() {
        alert("Please select an action (Approve or Reject) first.");
    }

    // ==============================
    // VENDOR CHECK
    // ==============================
    $(".vendorCheck").on("change", function () {

    if (!isActionSelected()) {
        alertNoAction();
        $(this).prop("checked", false);
        return;
    }

    $(".vendorCheck").not(this).prop("checked", false);
    $("#poMatrix td").removeClass("selected-vendor");
    $("#custpage_selected_data").val('');

    if (this.checked) {

        //  Correct vendor index
        let vendorIndex = $(".vendorCheck").index(this);

        //  Vendor block always starts after 4 fixed columns
        let col = 4 + (vendorIndex * 4);

        $("#poMatrix tr.dataRow").each(function () {
            for (let i = 0; i < 4; i++) {
                $(this).find("td").eq(col + i)
                    .addClass("selected-vendor");
            }
        });
    }
});


    // ==============================
    // ITEM CHECK (CLOSED ITEM FIX)
    // ==============================
$(document).on("change", ".itemCheck", function(){

    let selectedVendor = $(".vendorCheck:checked");
    if(selectedVendor.length === 0){
        alert("Please select a vendor first.");
        $(this).prop("checked", false);
        return;
    }

    //  calculate vendor column safely
    let vendorIndex = $(".vendorCheck").index(selectedVendor);
    let col = 4 + (vendorIndex * 4); // vendor start column

    let row = $(this).closest("tr");

    let reqQty    = parseFloat(row.find("td").eq(col + 2).text());
    let quotedQty = parseFloat(row.find("td").eq(col + 3).text());

    reqQty    = isNaN(reqQty) ? 0 : reqQty;
    quotedQty = isNaN(quotedQty) ? 0 : quotedQty;

    //  CLOSED ONLY FOR SELECTED VENDOR
    if (reqQty === 0 && quotedQty === 0) {
        alert("This item is closed for selected vendor or no quotaion available");
        $(this).prop("checked", false);
        return;
    }

    let vendorId = selectedVendor.data("vendor-id");
    let vendorName = selectedVendor.data("vendor-name");
    let quotationId = selectedVendor.data("quotation-id");

    let vendorData = {
        vendorId,
        vendorName,
        quotationId,
        action: $("#actionSelect").val() === "approve" ? "create" : "close",
        items: []
    };

    $("#poMatrix tr.dataRow").each(function(){
        if($(this).find(".itemCheck").prop("checked")){
            let price = $(this).find("td").eq(col).text().trim();
            if(price){
                vendorData.items.push({
                    itemId: $(this).data("item-id"),
                    itemName: $(this).find("td").eq(1).text().trim()
                });
            }
        }
    });

    $("#custpage_selected_data").val(JSON.stringify(vendorData, null, 2));
});

    // ==============================
    // LOWEST PRICE & HIGHEST QTY (ITEM WISE)
    // ==============================
    let vendorCount = $(".vendorCheck").length;

    $("#poMatrix tr.dataRow").each(function(){

        let tds = $(this).find("td");
        let priceArr = [];
        let qtyArr   = [];

        for(let v = 0; v < vendorCount; v++){
            let baseCol = 4 + (v * 4); // vendor start column

            let price = parseFloat(tds.eq(baseCol).text().trim());
            let qty   = parseFloat(tds.eq(baseCol + 3).text().trim());

            if(!isNaN(price) && price > 0){
                priceArr.push({ val: price, col: baseCol });
            }

            if(!isNaN(qty) && qty > 0){
                qtyArr.push({ val: qty, col: baseCol + 3 });
            }
        }

        // Lowest Price highlight
        if(priceArr.length > 0){
            let minPrice = Math.min(...priceArr.map(p => p.val));
            priceArr.forEach(p => {
                if(p.val === minPrice){
                    tds.eq(p.col).addClass("lowest-price");
                }
            });
        }

        //  Highest Quoted Qty highlight
        if(qtyArr.length > 0){
            let maxQty = Math.max(...qtyArr.map(q => q.val));
            qtyArr.forEach(q => {
                if(q.val === maxQty){
                    tds.eq(q.col).addClass("highest-quoted");
                }
            });
        }
    });

    // ==============================
    // SUBMIT VALIDATION
    // ==============================
    $("#createPOBtn").on("click", function(e){

        if (!isActionSelected()) {
            e.preventDefault();
            alertNoAction();
            return false;
        }

        if ($(".vendorCheck:checked").length === 0) {
            e.preventDefault();
            alert("Please select a vendor before submitting.");
            return false;
        }

        if ($(".itemCheck:checked").length === 0) {
            e.preventDefault();
            alert("Please select at least one item.");
            return false;
        }
    });

});
</script>



                                          
                                          </body></html>`;

                context.response.writePage(form);

            } else {
                // POST: handle selected vendor
                const json = context.request.parameters.custpage_selected_data || '[]';
                log.audit('Selected Data', json);

                // Parse JSON to check action
                let selectedData = {};
                try {
                    selectedData = JSON.parse(json);
                } catch (e) {
                    log.error('JSON Parse Error', e);
                    context.response.write('Invalid data submitted!');
                    return;
                }

                try {
                    if (selectedData.action === "create") {
                        // Redirect to another Suitelet for "create" action
                        redirect.toSuitelet({
                            scriptId: 'customscript_njt_po_crtn_partial_qts_sut',
                            deploymentId: 'customdeploy_njt_po_crtn_partial_qts_sut',
                            parameters: {
                                data: json
                            }
                        });
                    } else {
                        // For Reject option i'll call map and reduce and close status for items in purchase quotaion line level
                        const mrTask = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: 'customscript_njt_quot_status_close_mrs',
                            deploymentId: 'customdeploy_njt_quot_status_close_mrs',
                            params: { custscript_quot_sts_cls_json: [json] }
                        });
                        const taskId = mrTask.submit();
                        log.audit("M/R Task Submitted", taskId);
                        redirect.toSuitelet({
                            scriptId: 'customscript_njt_po_crtn_pq_sut',
                            deploymentId: 'customdeploy_njt_po_crtn_pq_sut',
                        });
                    }
                } catch (e) {
                    log.error('Error Processing Selected Data', e);
                    context.response.write('Error: ' + e.message);
                }
            }

        };

        return { onRequest };
    });