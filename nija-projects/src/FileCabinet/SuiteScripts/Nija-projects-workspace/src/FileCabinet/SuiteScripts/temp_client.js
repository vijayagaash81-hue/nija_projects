+
var projectData = [];
var currentSort = { col: null, desc: false };
function formatCurrency(val) {
  var sign = val < 0 ? "-" : "";
  var absVal = Math.abs(val);
  return sign + "$" + absVal.toFixed(2).replace(/\\d(?=(\\d{3})+\\.)/g, "$&,");
}
function formatPercentage(val) {
  return (val * 100).toFixed(0) + "%";
}
function setMetricText(selector, text) {
  var elem = document.querySelector(selector);
  if (elem) elem.innerText = text;
}
function renderProjectTable(rows) {
  var tbody = document.getElementById("projBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  var totals = { lpo:0, rev:0, exp:0, gross:0, admin:0, net:0 };
  rows.forEach(function(row) {
    var grossProfit = row.revenue - row.expenses;
    var netProfit = grossProfit - row.admin;
    var margin = row.revenue > 0 ? (netProfit / row.revenue) : 0;
    totals.lpo += row.lpoValue;
    totals.rev += row.revenue;
    totals.exp += row.expenses;
    totals.gross += grossProfit;
    totals.admin += row.admin;
    totals.net += netProfit;
    var grossClass = grossProfit >= 0 ? "prof-pos" : "prof-neg";
    var netClass = netProfit >= 0 ? "prof-pos" : "prof-neg";
    var badgeClass = margin >= 0 ? "badge-pos" : "badge-neg";
    var rowClass = "";
    if (netProfit < 0) {
      rowClass = "row-loss";
    } else if (margin >= 0.3) {
      rowClass = "row-high-profit";
    }
    var tr = document.createElement("tr");
    if (rowClass) tr.className = rowClass;
    tr.innerHTML = 
      '<td class="sticky-col sno-col cell-data">' + row.sno + '</td>' +
      '<td class="sticky-col code-col cell-data">' + row.code + '</td>' +
      '<td class="cell-data" style="text-align:left;">' + row.lpo + '</td>' +
      '<td class="cell-data" style="text-align:left; font-weight:500;">' + row.name + '</td>' +
      '<td class="cell-data num">' + formatCurrency(row.lpoValue) + '</td>' +
      '<td class="cell-data num">' + formatCurrency(row.revenue) + '</td>' +
      '<td class="cell-data num">' + formatCurrency(row.expenses) + '</td>' +
      '<td class="cell-data num ' + grossClass + '">' + formatCurrency(grossProfit) + '</td>' +
      '<td class="cell-data num">' + formatCurrency(row.admin) + '</td>' +
      '<td class="cell-data num ' + netClass + '">' + formatCurrency(netProfit) + '</td>' +
      '<td class="cell-data" style="text-align:center;"><span class="badge ' + badgeClass + '">' + formatPercentage(margin) + '</span></td>';
    tbody.appendChild(tr);
  });
  // Table Summary/Total Row at the bottom
  var overallMargin = totals.rev > 0 ? (totals.net / totals.rev) : 0;
  var trTotal = document.createElement("tr");
  trTotal.className = "total-row";
  trTotal.innerHTML = 
    '<td class="sticky-col sno-col cell-data" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">TOTAL</td>' +
    '<td class="sticky-col code-col cell-data" style="background:#f8fafc; border-top: 2px solid #cbd5e1;"></td>' +
    '<td class="cell-data" style="background:#f8fafc; border-top: 2px solid #cbd5e1;"></td>' +
    '<td class="cell-data" style="background:#f8fafc; border-top: 2px solid #cbd5e1;"></td>' +
    '<td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatCurrency(totals.lpo) + '</td>' +
    '<td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatCurrency(totals.rev) + '</td>' +
    '<td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatCurrency(totals.exp) + '</td>' +
    '<td class="cell-data num ' + (totals.gross >= 0 ? "prof-pos" : "prof-neg") + '" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatCurrency(totals.gross) + '</td>' +
    '<td class="cell-data num" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatCurrency(totals.admin) + '</td>' +
    '<td class="cell-data num ' + (totals.net >= 0 ? "prof-pos" : "prof-neg") + '" style="font-weight:700; background:#f8fafc; border-top: 2px solid #cbd5e1;">' + formatCurrency(totals.net) + '</td>' +
    '<td class="cell-data" style="text-align:center; background:#f8fafc; border-top: 2px solid #cbd5e1;"><span class="badge ' + (overallMargin >= 0 ? "badge-pos" : "badge-neg") + '" style="font-weight:700;">' + formatPercentage(overallMargin) + '</span></td>';
  tbody.appendChild(trTotal);
  setMetricText(".metric-card .lpo-val", formatCurrency(totals.lpo));
  setMetricText(".metric-card .revenue-val", formatCurrency(totals.rev));
  setMetricText(".metric-card .expenses-val", formatCurrency(totals.exp));
  setMetricText(".metric-card .gross-profit-val", formatCurrency(totals.gross));
  setMetricText(".metric-card .admin-val", formatCurrency(totals.admin));
  setMetricText(".metric-card .net-profit-val", formatCurrency(totals.net));
  setMetricText(".metric-card .margin-val", formatPercentage(overallMargin));
}
function parseCurrency(str) {
  if (!str) return 0;
  var clean = str.replace(/[^0-9.-]/g, "");
  var num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}
function filterProjectTable() {
  try {
    var searchInput = document.getElementById("projSearch");
    if (!searchInput) return;
    var filter = searchInput.value.toUpperCase();
    console.log("[DEBUG] filterProjectTable started. Filter:", filter);
    var tbody = document.getElementById("projBody");
    if (!tbody) { console.warn("[DEBUG] tbody projBody not found"); return; }
    var trs = tbody.getElementsByTagName("tr");
    var totals = { lpo: 0, rev: 0, exp: 0, gross: 0, admin: 0, net: 0 };
    for (var i = 0; i < trs.length; i++) {
      var tr = trs[i];
      if (tr.className === "total-row" || tr.classList.contains("total-row")) continue;
      var txt = tr.innerText || tr.textContent || "";
      if (txt.toUpperCase().indexOf(filter) > -1) {
        tr.style.display = "";
        totals.lpo += parseCurrency(tr.cells[4] ? tr.cells[4].innerText : "");
        totals.rev += parseCurrency(tr.cells[5] ? tr.cells[5].innerText : "");
        totals.exp += parseCurrency(tr.cells[6] ? tr.cells[6].innerText : "");
        totals.gross += parseCurrency(tr.cells[7] ? tr.cells[7].innerText : "");
        totals.admin += parseCurrency(tr.cells[8] ? tr.cells[8].innerText : "");
        totals.net += parseCurrency(tr.cells[9] ? tr.cells[9].innerText : "");
      } else {
        tr.style.display = "none";
      }
    }
    var overallMargin = totals.rev > 0 ? (totals.net / totals.rev) : 0;
    setMetricText(".metric-card .lpo-val", formatCurrency(totals.lpo));
    setMetricText(".metric-card .revenue-val", formatCurrency(totals.rev));
    setMetricText(".metric-card .expenses-val", formatCurrency(totals.exp));
    setMetricText(".metric-card .gross-profit-val", formatCurrency(totals.gross));
    setMetricText(".metric-card .admin-val", formatCurrency(totals.admin));
    setMetricText(".metric-card .net-profit-val", formatCurrency(totals.net));
    setMetricText(".metric-card .margin-val", formatPercentage(overallMargin));
    var totalRow = tbody.querySelector("tr.total-row");
    if (totalRow) {
      if (totalRow.cells[4]) totalRow.cells[4].innerText = formatCurrency(totals.lpo);
      if (totalRow.cells[5]) totalRow.cells[5].innerText = formatCurrency(totals.rev);
      if (totalRow.cells[6]) totalRow.cells[6].innerText = formatCurrency(totals.exp);
      if (totalRow.cells[7]) totalRow.cells[7].innerText = formatCurrency(totals.gross);
      if (totalRow.cells[8]) totalRow.cells[8].innerText = formatCurrency(totals.admin);
      if (totalRow.cells[9]) totalRow.cells[9].innerText = formatCurrency(totals.net);
      var badge = totalRow.cells[10] ? totalRow.cells[10].querySelector(".badge") : null;
      if (badge) {
        badge.innerText = formatPercentage(overallMargin);
        badge.className = "badge " + (overallMargin >= 0 ? "badge-pos" : "badge-neg");
      }
    }
    console.log("[DEBUG] filterProjectTable completed. Totals calculated:", totals);
  } catch (err) {
    console.error("[DEBUG] Error in filterProjectTable:", err);
  }
}
function sortTable(colName) {
  if (currentSort.col === colName) {
    currentSort.desc = !currentSort.desc;
  } else {
    currentSort.col = colName;
    currentSort.desc = false;
  }
  updateSortHeaders();
  sortRows(projectData, colName, currentSort.desc);
  filterProjectTable();
}
function sortRows(arr, col, desc) {
  arr.sort(function(a, b) {
    var valA = getSortValue(a, col);
    var valB = getSortValue(b, col);
    if (valA === valB) return 0;
    var cmp = valA > valB ? 1 : -1;
    return desc ? -cmp : cmp;
  });
  renderProjectTable(arr);
}
function getSortValue(row, col) {
  if (col === "gross") return row.revenue - row.expenses;
  if (col === "net") return (row.revenue - row.expenses) - row.admin;
  if (col === "margin") return row.revenue > 0 ? (((row.revenue - row.expenses) - row.admin) / row.revenue) : 0;
  return row[col];
}
function updateSortHeaders() {
  var headers = { sno: "S.NO", code: "PROJECT CODES", lpo: "LPO #", name: "PROJECT NAME", lpoValue: "LPO VALUE", revenue: "REVENUE", expenses: "EXPENSES", gross: "PROFIT / (LOSS)", admin: "Admin Expenses", net: "Profit / (Loss)", margin: "% of Profit / (loss)" };
  for (var key in headers) {
    var elem = document.getElementById("th-" + key);
    if (elem) {
      var text = headers[key];
      if (currentSort.col === key) {
        text += currentSort.desc ? " \\\\u25be" : " \\\\u25b4";
      }
      elem.innerText = text;
    }
  }
}
function triggerExcelExport() {
  var scriptId = "customscript_sl_njt_projsumrep";
  var deployId = "customdeploy_sl_njt_projsumrep";
  var subEl = document.getElementById("custpage_subsidiary");
  var yearEl = document.getElementById("custpage_year");
  var monthEl = document.getElementById("custpage_month");
  var sub = subEl ? subEl.value : "";
  var month = monthEl ? monthEl.value : "";
  var year = yearEl ? yearEl.value : "";
  var exportUrl = "/app/site/hosting/scriptlet.nl?script=" + scriptId + "&deploy=" + deployId + "&custpage_subsidiary=" + sub + "&custpage_month=" + month + "&custpage_year=" + year + "&custpage_export=T";
  window.open(exportUrl, "_blank");
}
function reloadReport() {
  var subEl = document.getElementById("custpage_subsidiary");
  var yearEl = document.getElementById("custpage_year");
  var monthEl = document.getElementById("custpage_month");
  var sub = subEl ? subEl.value : "";
  var year = yearEl ? yearEl.value : "";
  var month = monthEl ? monthEl.value : "";
  var scriptId = "customscript_sl_njt_projsumrep";
  var deployId = "customdeploy_sl_njt_projsumrep";
  var url = "/app/site/hosting/scriptlet.nl?script=" + scriptId + "&deploy=" + deployId;
  if (sub) url += "&custpage_subsidiary=" + sub;
  if (year) url += "&custpage_year=" + year;
  if (month) url += "&custpage_month=" + month;
  window.location.href = url;
}
window.projectData = projectData;
window.currentSort = currentSort;
window.formatCurrency = formatCurrency;
window.formatPercentage = formatPercentage;
window.setMetricText = setMetricText;
window.renderProjectTable = renderProjectTable;
window.parseCurrency = parseCurrency;
window.filterProjectTable = filterProjectTable;
window.sortTable = sortTable;
window.sortRows = sortRows;
window.getSortValue = getSortValue;
window.updateSortHeaders = updateSortHeaders;
window.triggerExcelExport = triggerExcelExport;
window.reloadReport = reloadReport;
'