const SPREADSHEET_ID = '1z0okqni2kJ3-0SkfNVzLFpolttPufTn5ngchuOZ1ToU';

function doPost(e) {
  try {

    // --------------------------------------------------
    // Read request from NetSuite
    // --------------------------------------------------

    const request = JSON.parse(e.postData.contents);

    const reportDate = request.date;
    const transactions = request.transactions || [];

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // --------------------------------------------------
    // 1. Create / Get Dashboard
    // --------------------------------------------------

    let dashboard = ss.getSheetByName('Dashboard');

    if (!dashboard) {
      dashboard = ss.insertSheet('Dashboard', 0);
    }

    // Always keep Dashboard as first tab
    ss.setActiveSheet(dashboard);
    ss.moveActiveSheet(1);

    // --------------------------------------------------
    // 2. Create / Get Daily Sheet
    // --------------------------------------------------

    let sheet = ss.getSheetByName(reportDate);

    if (!sheet) {
      sheet = ss.insertSheet(reportDate);

      // Put new daily sheet immediately after Dashboard
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(2);
    }

    // --------------------------------------------------
    // Clear previous data/charts
    // --------------------------------------------------

    sheet.clear();

    sheet.getCharts().forEach(function(chart) {
      sheet.removeChart(chart);
    });

    // --------------------------------------------------
    // 3. Prepare Transaction Data
    // --------------------------------------------------

    const data = [
      ['Transaction Type', 'Count']
    ];

    transactions.forEach(function(item) {

      data.push([
        item.type,
        Number(item.count)
      ]);

    });

    // --------------------------------------------------
    // 4. Write Transaction Data
    // --------------------------------------------------

    sheet
      .getRange(1, 1, data.length, 2)
      .setValues(data);

    // Header formatting
    sheet
      .getRange('A1:B1')
      .setFontWeight('bold')
      .setBackground('#1a73e8')
      .setFontColor('#ffffff');

    sheet.autoResizeColumns(1, 2);

    // --------------------------------------------------
    // 5. Daily Bar Chart
    // --------------------------------------------------

    const barChart = sheet
      .newChart()
      .setChartType(Charts.ChartType.BAR)
      .addRange(
        sheet.getRange(
          1,
          1,
          data.length,
          2
        )
      )
      .setPosition(2, 4, 0, 0)
      .setOption(
        'title',
        'Transactions by Type'
      )
      .setOption(
        'legend',
        {
          position: 'none'
        }
      )
      .build();

    sheet.insertChart(barChart);

    // --------------------------------------------------
    // 6. Daily Pie Chart
    // --------------------------------------------------

    const pieChart = sheet
      .newChart()
      .setChartType(Charts.ChartType.PIE)
      .addRange(
        sheet.getRange(
          1,
          1,
          data.length,
          2
        )
      )
      .setPosition(20, 4, 0, 0)
      .setOption(
        'title',
        'Transaction Distribution'
      )
      .build();

    sheet.insertChart(pieChart);

    // --------------------------------------------------
    // 7. Update Dashboard
    // --------------------------------------------------

    updateDashboard(
      dashboard,
      reportDate,
      transactions
    );

    // --------------------------------------------------
    // 8. Return Response
    // --------------------------------------------------

    return ContentService
      .createTextOutput(
        JSON.stringify({
          success: true,
          sheet: reportDate,
          url: ss.getUrl()
        })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  } catch (error) {

    return ContentService
      .createTextOutput(
        JSON.stringify({
          success: false,
          error: error.message
        })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );
  }
}


// ======================================================
// DASHBOARD FUNCTION
// ======================================================

function updateDashboard(
  dashboard,
  reportDate,
  transactions
) {

  // --------------------------------------------------
  // Clear Dashboard
  // --------------------------------------------------

  dashboard.clear();

  // Remove old charts
  dashboard.getCharts().forEach(function(chart) {
    dashboard.removeChart(chart);
  });

  // --------------------------------------------------
  // Dashboard Title
  // --------------------------------------------------

  dashboard
    .getRange('A1:F1')
    .merge()
    .setValue(
      'NetSuite Daily Transaction Dashboard'
    )
    .setFontSize(18)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  // --------------------------------------------------
  // Latest Report Date
  // --------------------------------------------------

  dashboard
    .getRange('A3')
    .setValue('Latest Report');

  dashboard
    .getRange('B3')
    .setValue(reportDate);

  dashboard
    .getRange('A3:B3')
    .setFontWeight('bold');

  // --------------------------------------------------
  // Prepare Dashboard Data
  // --------------------------------------------------

  const data = [
    ['Transaction Type', 'Count']
  ];

  let total = 0;

  transactions.forEach(function(item) {

    const count = Number(item.count);

    data.push([
      item.type,
      count
    ]);

    total += count;

  });

  // --------------------------------------------------
  // Write Dashboard Data
  // --------------------------------------------------

  dashboard
    .getRange(
      5,
      1,
      data.length,
      2
    )
    .setValues(data);

  // Header formatting
  dashboard
    .getRange('A5:B5')
    .setBackground('#1a73e8')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  // --------------------------------------------------
  // Total Transactions
  // --------------------------------------------------

  const totalRow = data.length + 7;

  dashboard
    .getRange(totalRow, 1)
    .setValue('Total Transactions');

  dashboard
    .getRange(totalRow, 2)
    .setValue(total);

  dashboard
    .getRange(totalRow, 1, 1, 2)
    .setFontWeight('bold');

  dashboard.autoResizeColumns(1, 2);

  // --------------------------------------------------
  // Dashboard Bar Chart
  // --------------------------------------------------

  const dashboardBarChart = dashboard
    .newChart()
    .setChartType(
      Charts.ChartType.BAR
    )
    .addRange(
      dashboard.getRange(
        5,
        1,
        data.length,
        2
      )
    )
    .setPosition(5, 4, 0, 0)
    .setOption(
      'title',
      'Latest Transaction Summary'
    )
    .setOption(
      'legend',
      {
        position: 'none'
      }
    )
    .build();

  dashboard.insertChart(
    dashboardBarChart
  );

  // --------------------------------------------------
  // Dashboard Pie Chart
  // --------------------------------------------------

  const dashboardPieChart = dashboard
    .newChart()
    .setChartType(
      Charts.ChartType.PIE
    )
    .addRange(
      dashboard.getRange(
        5,
        1,
        data.length,
        2
      )
    )
    .setPosition(23, 4, 0, 0)
    .setOption(
      'title',
      'Transaction Distribution'
    )
    .build();

  dashboard.insertChart(
    dashboardPieChart
  );
}
