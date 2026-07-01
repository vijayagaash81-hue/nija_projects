/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
var Email;
//479 SJS script internal id
define(['./moment.js', 'N/ui/serverWidget', 'N/file', 'N/encode', 'N/query', 'N/runtime', 'N/format', 'N/email', 'N/record', 'N/search', 'N/render', 'N/xml', 'N/format/i18n'],
    function (moment, serverWidget, file, encode, query, runtime, format, email, record, search, render, xml, formati18n) {
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        Email = email;
        function onRequest(context) {
            try {
                // Get Parameters value
                // var fromDate = context.request.parameters.fromDate;
                // var toDate = context.request.parameters.toDate;
                var currentDate = new Date();
                var printedDate = moment(currentDate).utcOffset("+04:00").format('DD/MM/YYYY');
                var printedTime = moment(currentDate).utcOffset("+04:00").format('hh:mm a');
                var vendorvalue = context.request.parameters.vendorvalue;
               // var fromDate = context.request.parameters.fromDate;
                var toDate = context.request.parameters.toDate;
                var Subid = context.request.parameters.Subid;

               // log.debug('fromDate', fromDate);
                log.debug('toDate', toDate);
                log.debug('vendorvalue', vendorvalue);
                log.debug('Subid', Subid);
                if (Subid) {
                    var subsidiaryRecord = record.load({
                        type: "subsidiary",
                        id: Subid,
                        isDynamic: true
                    });
                    var subname = subsidiaryRecord.getText({
                        fieldId: 'name'
                    })
                    var logotag1 = '';
                    var img_floor = subsidiaryRecord.getValue({ fieldId: 'logo' }); var floorImg = '';
                    var website = subsidiaryRecord.getValue({ fieldId: 'url' }); var floorImg = '';
                    if (img_floor) {
                        var logotag = file.load({
                            id: img_floor
                        }).url;
                        logotag = logotag.replace(/&/gi, '&amp;');
                        // logotag1 = '<img src="' + logotag + '" style="width: 100%;"/>';
                        logotag1 = '<img src="' + logotag + '" style="height:60px;width:500px"/>';
                    }
                    log.debug('logotag1', logotag1);
                    log.debug('website', website);
                }

                log.audit('USAGE', runtime.getCurrentScript().getRemainingUsage());
                var currentDate = new Date();
                var dates = format.format({ value: currentDate, type: format.Type.DATE });
                //Get Vendor Address
                var salesemp = '';
                var Venrecobj = record.load({
                    type: 'customer',
                    id: vendorvalue,
                    isDynamic: true
                });
                var vendname = '';
                var customerType = Venrecobj.getValue({
                    fieldId: 'isperson'
                });
                log.debug("customerType", customerType);
                if (customerType == "F") // False = Company. True = Customer
                {
                    log.debug("customer is", "Company");
                    vendname = Venrecobj.getValue({
                        fieldId: 'companyname'
                    });
                    log.debug("companyName", vendname);
                }
                else {
                    log.debug("customer is", "Person");
                    var salutation = Venrecobj.getValue({
                        fieldId: 'salutation'
                    });
                    salutation = salutation ? salutation + ' ' : '';
                    log.debug("salutation", salutation);
                    var firstName = Venrecobj.getValue({
                        fieldId: 'firstname'
                    });
                    firstName = firstName ? firstName + ' ' : '';
                    log.debug("firstName", firstName);
                    var middleName = Venrecobj.getValue({
                        fieldId: 'middlename'
                    });
                    middleName = middleName ? middleName + ' ' : '';
                    log.debug("middleName", middleName);
                    var lastName = Venrecobj.getValue({
                        fieldId: 'lastname'
                    });
                    lastName = lastName ? lastName : '';
                    log.debug("lastName", lastName);
                    vendname = firstName + middleName + lastName;
                    log.debug("vendname is", vendname);

                }

                var vendname1 = Venrecobj.getText({
                    fieldId: 'entityid'
                });
                var ccode = '';
                var Cname = '';

                if (vendname1) {
                    var vends = vendname1.split(" ");
                    // var vends = vendname1.split(/ - |  /);

                    ccode = vends[0];
                    Cname = vends[1];
                }
                log.debug('vendname1', vendname1)
                var BillAddrs = Venrecobj.getValue({
                    fieldId: 'defaultaddress'
                });
                log.debug('Billing Address', BillAddrs);
                var phone = '';
                var phone = Venrecobj.getValue({
                    fieldId: 'phone'
                }) || '';
                if (!phone) {
                    phone = Venrecobj.getValue({
                        fieldId: 'custentity_njt_mobile_number'
                    });
                }
                var fax = Venrecobj.getValue({
                    fieldId: 'fax'
                });

                salesemp = Venrecobj.getText({ fieldId: 'salesrep' }) || Venrecobj.getText({ fieldId: 'custentity121' }) || '';
                log.debug("salesemployeename", salesemp);

                // if (salesemp) {
                //     var parts = salesemp.split(" - ");
                //     var number = parts[0];
                //     salesemp = parts[1] || '';
                // }

                var Address = Venrecobj.getText({
                    fieldId: 'defaultaddress'
                });

                var ageingsummery = [];
                var ags_lines = '';
                ageingsummery = getAgeingDetails(query, vendorvalue, Subid, toDate);

                var transactionResult = [];
                // var transactionResult1 = [];
                var addingtotal = 0;
                var line_details = '';
                var total = 0;
                var totaldebit = 0;
                var totalcredit = 0;
                transactionResult = getTransactionDetails(query, toDate, vendorvalue, Subid);

                if (transactionResult && transactionResult.length > 0) {

                    for (var j = 0; j < transactionResult.length; j++) {
                        var recd = transactionResult[j];
                        var recid = recd.recid || '';
                        var trandate = recd.trandate || '';
                        var duedate = recd.duedate || '';
                        var recordtype = recd.recordtype || '';
                        var documentno = recd.documentno || ''

                        var ponum = recd.ponum || '';
                        var memo = recd.memo || '';
                        var paidamount = recd.paidamount || 0;
                        var openingamt = recd.openingamt || 0;
                        var appliedamt = recd.appliedamt || 0;
                        var pendingamt = recd.pendingamt || 0;
                        var balance = recd.balance || 0;
                        var foreigntotal = recd.foreigntotal || 0;
                        var rtotal = recd.rtotal || 0;
                        var newbalamt = parseFloat(foreigntotal) - parseFloat(paidamount);
                        log.debug("newbalance amount", newbalamt);
                      // if (newbalamt > 0) {
                            addingtotal += parseFloat(newbalamt);
                            log.debug("addingtotal", addingtotal);
                            // total += parseFloat(balance);
                            totaldebit += parseFloat(openingamt);
                            totalcredit += parseFloat(appliedamt);
                            var soid = '';
                            if (recordtype == 'invoice') {
                                var invrecobj = record.load({
                                    type: 'invoice',
                                    id: recid,
                                    isDynamic: true
                                });
                                soid = invrecobj.getText('createdfrom');
                                log.debug('soid', soid);
                            }

                            line_details += '<tr>';
                            line_details += '<td align="left" border-right="1">' + documentno + '</td>';

                            // line_details += '<td align="center" border-right="1">' + soid + '</td>';
                            line_details += '<td align="center" border-right="1">' + ponum + '</td>';
                            line_details += '<td align="center" border-right="1">' + trandate + '</td>';
                            line_details += '<td align="center" border-right="1">' + duedate + '</td>';
                            line_details += '<td align="center" border-right="1">' + memo + '</td>';
                            line_details += '<td align="right" border-right="1">' + format.format({ value: newbalamt, type: format.Type.CURRENCY }) + '</td>';
                            // line_details += '<td align="right">' + format.format({ value: balance, type: format.Type.CURRENCY }) + '</td>';
                            line_details += '<td align="right">' + format.format({ value: rtotal, type: format.Type.CURRENCY }) + '</td>';
                            line_details += '</tr>';
                       // }

                    }
                }
                log.debug('line_details', line_details);
                total = parseFloat(totaldebit) - parseFloat(totalcredit);

                if (ageingsummery && ageingsummery.length > 0) {
                    for (var i = 0; i < ageingsummery.length; i++) {
                        var recd = ageingsummery[i];
                        var customer = recd.customer;
                        var current = recd.current || 0;
                        var balance30 = recd.balance30 || 0;
                        var balance60 = recd.balance60 || 0;
                        var balance90 = recd.balance90 || 0;
                        var balance120 = recd.balance120 || 0;
                        var balance120plus = recd.balance120plus || 0;
                        var total1 = recd.total || 0;

                        ags_lines += '<tr>';
                        ags_lines += '<td align="center" border-right="1" style="width: 12%;"><b>Total</b></td>';
                        ags_lines += '<td align="center" border-right="1" border-bottom="1" style="width: 14%;">' + format.format({ value: total1, type: format.Type.CURRENCY }) + '</td>';
                        ags_lines += '<td align="center" border-right="1" border-bottom="1" style="width: 14%;">' + format.format({ value: current, type: format.Type.CURRENCY }) + '</td>';
                        ags_lines += '<td align="center" border-right="1" border-bottom="1" style="width: 12%;">' + format.format({ value: balance30, type: format.Type.CURRENCY }) + '</td>';
                        ags_lines += '<td align="center" border-right="1" border-bottom="1" style="width: 12%;">' + format.format({ value: balance60, type: format.Type.CURRENCY }) + '</td>';
                        ags_lines += '<td align="right" border-right="1" border-bottom="1" style="width: 12%;">' + format.format({ value: balance90, type: format.Type.CURRENCY }) + '</td>';
                        ags_lines += '<td align="right" border-right="1" border-bottom="1" style="width: 12%;">' + format.format({ value: balance120, type: format.Type.CURRENCY }) + '</td>';
                        ags_lines += '<td align="right" border-right="1" border-bottom="1" style="width: 12%;">' + format.format({ value: balance120plus, type: format.Type.CURRENCY }) + '</td>';
                        ags_lines += '</tr>';
                    }

                }
                else {
                    ags_lines += '<tr>';
                    ags_lines += '<td align="center" border-right="1" style="width: 12%;"><b>Total</b></td>';
                    ags_lines += '<td align="center" border-right="1" border-bottom="1" style="width: 14%;">0.00</td>';
                    ags_lines += '<td align="center" border-right="1" border-bottom="1" style="width: 14%;"></td>';
                    ags_lines += '<td align="center" border-right="1" border-bottom="1" style="width: 12%;">0.00</td>';
                    ags_lines += '<td align="center" border-right="1" border-bottom="1" style="width: 12%;">0.00</td>';
                    ags_lines += '<td align="right" border-right="1" border-bottom="1" style="width: 12%;">0.00</td>';
                    ags_lines += '<td align="right" border-right="1" border-bottom="1" style="width: 12%;">0.00</td>';
                    ags_lines += '<td align="right" border-right="1" border-bottom="1" style="width: 12%;">0.00</td>';
                    ags_lines += '</tr>';
                }


                var tpl_content = file.load({
                    id: 3595
                }).getContents();

                tpl_content = tpl_content.replace(/<br>/gi, '<br />');
                tpl_content = tpl_content.replace(/{{ccode}}/g, escapeXML(ccode));
                //tpl_content = tpl_content.replace(/{{pro}}/g,(totaldebit));
                tpl_content = tpl_content.replace(/{{vendname}}/g, escapeXML(vendname));
                tpl_content = tpl_content.replace(/{{printedDate}}/g, printedDate);
                tpl_content = tpl_content.replace(/{{printedTime}}/g, printedTime);
                tpl_content = tpl_content.replace(/{{logotag1}}/g, logotag1);
                tpl_content = tpl_content.replace(/{{phone}}/g, phone);
                tpl_content = tpl_content.replace(/{{fax}}/g, fax);
                tpl_content = tpl_content.replace(/{{salesemp}}/g, escapeXML(salesemp));
                tpl_content = tpl_content.replace(/{{Address}}/g, escapeXML(Address));
                tpl_content = tpl_content.replace(/{{ags_lines}}/g, ags_lines);
                tpl_content = tpl_content.replace(/{{line_details}}/g, line_details);
                tpl_content = tpl_content.replace(/{{total}}/g, format.format({ value: addingtotal, type: format.Type.CURRENCY }));
                // Load html file and replace all values salesemp line_details total
                // log.debug('template', template);
                var renderer = render.create();
                renderer.templateContent = tpl_content;
                var salaryPDF = renderer.renderAsPdf();
                context.response.writeFile(salaryPDF, true);
                // context.response.writePage(form);

                log.audit('USAGE', runtime.getCurrentScript().getRemainingUsage());

            } catch (e) {
                log.error("Error in OnRequest", e.message);
            }
        }
        function escapeXML(input) {
            //log.error('Input srtring: ',input);
            var output = '';
            if (input) {
                output = xml.escape({
                    xmlText: input
                });
            }
            return output;
        }

        return {
            onRequest: onRequest
        };

    });
var addScriptToForm = function (pForm, serverWidgetModule) {
    var clientScript = '<script>\r\n';
    clientScript += 'window.jQuery = window.$ = jQuery;\r\n' +
        "$('#custpage_excel_export').click(function(e) {\r\n" +
        " excelexport();\r\n" +
        " });\r\n" +
        "function excelexport() {\r\n" +
        "  $('#main_form').append('<input type=\"hidden\" name=\"excelexport\" value=\"yes\" />');\r\n" +
        "  $('#main_form').submit();\r\n " +
        "} \r\n" +
        "</script>\r\n";
    //clientScript += '</script>\r\n';
    log.debug("Client Script", clientScript);
    var scriptfield = pForm.addField({
        id: 'clientscript',
        label: 'Client Script',
        type: serverWidgetModule.FieldType.INLINEHTML
    });
    scriptfield.defaultValue = clientScript;
}
function getAgeingDetails(query, pvendorid, Subid, toDate) {
    try {
        var resultArray = [];
        // Querying the required result
       /*  var SQL = "SELECT \
        BUILTIN.DF( Transaction.Entity ) AS Customer,\
        SUM( \
            CASE \
                WHEN \
                    ( TRUNC( SYSDATE ) - Transaction.DueDate ) < 1 \
                THEN \
                    COALESCE( TransactionAccountingLine.AmountUnpaid, 0 ) - COALESCE( TransactionAccountingLine.PaymentAmountUnused, 0 )\
                ELSE \
                    0 \
                END\
        ) AS current,\
        SUM( \
            CASE \
                WHEN \
                    ( TRUNC( SYSDATE ) - Transaction.DueDate ) BETWEEN 1 AND 30\
                THEN \
                    COALESCE( TransactionAccountingLine.AmountUnpaid, 0 ) - COALESCE( TransactionAccountingLine.PaymentAmountUnused, 0 )\
                ELSE \
                    0 \
                END\
        ) AS balance30,\
        SUM( \
            CASE \
                WHEN \
                    ( TRUNC( SYSDATE ) - Transaction.DueDate ) BETWEEN 31 AND 60\
                THEN \
                    COALESCE( TransactionAccountingLine.AmountUnpaid, 0 ) - COALESCE( TransactionAccountingLine.PaymentAmountUnused, 0 )\
                ELSE \
                    0 \
                END\
        ) AS balance60,	\
        SUM( \
            CASE \
                WHEN \
                    ( TRUNC( SYSDATE ) - Transaction.DueDate ) BETWEEN 61 AND 90 \
                THEN \
                    COALESCE( TransactionAccountingLine.AmountUnpaid, 0 ) - COALESCE( TransactionAccountingLine.PaymentAmountUnused, 0 ) \
                ELSE \
                    0 \
                END \
        ) AS balance90,\
         SUM( \
            CASE \
                WHEN \
                    ( TRUNC( SYSDATE ) - Transaction.DueDate ) BETWEEN 91 AND 120 \
                THEN \
                    COALESCE( TransactionAccountingLine.AmountUnpaid, 0 ) - COALESCE( TransactionAccountingLine.PaymentAmountUnused, 0 ) \
                ELSE \
                    0 \
                END\
        ) AS balance120,\
         SUM( \
            CASE \
                WHEN \
                    ( TRUNC( SYSDATE ) - Transaction.DueDate ) > 120 \
                THEN \
                    COALESCE( TransactionAccountingLine.AmountUnpaid, 0 ) - COALESCE( TransactionAccountingLine.PaymentAmountUnused, 0 ) \
                ELSE \
                    0 \
                END \
        ) AS balance120plus,\
         SUM ( \
            COALESCE( TransactionAccountingLine.AmountUnpaid, 0 ) - COALESCE( TransactionAccountingLine.PaymentAmountUnused, 0 ) \
        ) AS total \
    FROM \
        Transaction \
        INNER JOIN TransactionAccountingLine ON \
            ( TransactionAccountingLine.Transaction = Transaction.ID )\
             INNER JOIN Transactionline \
ON ( Transactionline.Transaction = Transaction.ID ) \
        INNER JOIN Customer ON \
            ( Customer.ID = Transaction.Entity )\
    WHERE\
        ( Transaction.Posting = 'T' )\
        AND ( Transaction.Voided = 'F' )  AND (Transaction.Entity ='" + pvendorid + "') and Transactionline.subsidiary = " + Subid + " \
        AND Transaction.trandate<='"+ toDate + "' AND ( \
            ( TransactionAccountingLine.AmountUnpaid <> 0 )\
            OR ( TransactionAccountingLine.PaymentAmountUnused <> 0 )  \
        ) and mainline = 'T' and taxline = 'F' \
    GROUP BY\
        BUILTIN.DF( Transaction.Entity )\
    ORDER BY \
    BUILTIN.DF( Transaction.Entity )"; */
/*  var SQL = "SELECT " +
    "Customer, " +
    "SUM(current) AS current, " +
    "SUM(balance30) AS balance30, " +
    "SUM(balance60) AS balance60, " +
    "SUM(balance90) AS balance90, " +
    "SUM(balance120) AS balance120, " +
    "SUM(balance120plus) AS balance120plus, " +
    "SUM(total) AS total " +
"FROM ( " +
    "SELECT " +
        "(SELECT MAX(Transactionline.Entity) " +
         "FROM Transactionline " +
         "WHERE Transactionline.Transaction = Transaction.id) AS Customer1, " +
        "(SELECT MAX(Customer.Fullname) " +
         "FROM Transactionline " +
         "INNER JOIN Customer ON Transactionline.entity = Customer.id " +
         "WHERE Transactionline.Transaction = Transaction.id) AS Customer, " +
        "Transaction.id, " +
        "Transaction.type, " +
        "SUM(CASE WHEN (TRUNC(SYSDATE) - Transaction.DueDate) < 1 " +
            "THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) " +
            "ELSE 0 END) AS current, " +
        "SUM(CASE WHEN (TRUNC(SYSDATE) - Transaction.DueDate) BETWEEN 1 AND 30 " +
            "THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) " +
            "ELSE 0 END) AS balance30, " +
        "SUM(CASE WHEN (TRUNC(SYSDATE) - Transaction.DueDate) BETWEEN 31 AND 60 " +
            "THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) " +
            "ELSE 0 END) AS balance60, " +
        "SUM(CASE WHEN (TRUNC(SYSDATE) - Transaction.DueDate) BETWEEN 61 AND 90 " +
            "THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) " +
            "ELSE 0 END) AS balance90, " +
        "SUM(CASE WHEN (TRUNC(SYSDATE) - Transaction.DueDate) BETWEEN 91 AND 120 " +
            "THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) " +
            "ELSE 0 END) AS balance120, " +
        "SUM(CASE WHEN (TRUNC(SYSDATE) - Transaction.DueDate) > 120 " +
            "THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) " +
            "ELSE 0 END) AS balance120plus, " +
        "SUM(COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0)) AS total " +
    "FROM Transaction " +
    "INNER JOIN TransactionAccountingLine ON TransactionAccountingLine.Transaction = Transaction.ID " +
    "WHERE TransactionAccountingLine.accounttype IN ('AcctRec') " +
        "AND Transaction.Posting = 'T' " +
        "AND '9' IN (SELECT Transactionline.subsidiary " +
                    "FROM Transactionline " +
                    "WHERE Transaction.id = Transactionline.Transaction) " +
        "AND Transaction.trandate <= TO_DATE('" + toDate + "', 'DD/MM/YYYY') " +
    "GROUP BY Transaction.id, Transaction.type " +
") subquery " +
"WHERE Customer1 = '" + pvendorid + "' " +
"GROUP BY Customer"; */
     /*  var SQL = "SELECT " +
    "Customer, " +
    "SUM(current) AS current, " +
    "SUM(balance30) AS balance30, " +
    "SUM(balance60) AS balance60, " +
    "SUM(balance90) AS balance90, " +
    "SUM(balance120) AS balance120, " +
    "SUM(balance120plus) AS balance120plus, " +
    "SUM(total) AS total " +
"FROM ( " +
    "SELECT " +
        "(SELECT MAX(Transactionline.Entity) " +
         "FROM Transactionline " +
         "WHERE Transactionline.Transaction = Transaction.id) AS Customer1, " +
        "(SELECT MAX(Customer.Fullname) " +
         "FROM Transactionline " +
         "INNER JOIN Customer ON Transactionline.entity = Customer.id " +
         "WHERE Transactionline.Transaction = Transaction.id) AS Customer, " +
        "Transaction.id, " +
        "Transaction.type, " +
        "(SELECT MAX(Transactionline.subsidiary) " +
         "FROM Transactionline " +
         "WHERE Transaction.id = Transactionline.Transaction) AS Subsidiary, " +
        "SUM(CASE WHEN (TRUNC(SYSDATE) - Transaction.DueDate) < 1 " +
            "THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) " +
            "ELSE 0 END) AS current, " +
        "SUM(CASE WHEN (TRUNC(SYSDATE) - Transaction.DueDate) BETWEEN 1 AND 30 " +
            "THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) " +
            "ELSE 0 END) AS balance30, " +
        "SUM(CASE WHEN (TRUNC(SYSDATE) - Transaction.DueDate) BETWEEN 31 AND 60 " +
            "THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) " +
            "ELSE 0 END) AS balance60, " +
        "SUM(CASE WHEN (TRUNC(SYSDATE) - Transaction.DueDate) BETWEEN 61 AND 90 " +
            "THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) " +
            "ELSE 0 END) AS balance90, " +
        "SUM(CASE WHEN (TRUNC(SYSDATE) - Transaction.DueDate) BETWEEN 91 AND 120 " +
            "THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) " +
            "ELSE 0 END) AS balance120, " +
        "SUM(CASE WHEN (TRUNC(SYSDATE) - Transaction.DueDate) > 120 " +
            "THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) " +
            "ELSE 0 END) AS balance120plus, " +
        "SUM(COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0)) AS total " +
    "FROM Transaction " +
    "INNER JOIN TransactionAccountingLine ON TransactionAccountingLine.Transaction = Transaction.ID " +
    "WHERE TransactionAccountingLine.accounttype IN ('AcctRec') " +
        "AND Transaction.Posting = 'T' " +
        "AND Transaction.trandate <= TO_DATE('" + toDate + "', 'DD/MM/YYYY') " +
    "GROUP BY Transaction.id, Transaction.type " +
") subquery " +
"WHERE Customer1 = '" + pvendorid + "' AND Subsidiary = '" + Subid + "' " +
"GROUP BY Customer"; */
      var SQL = "SELECT Customer, SUM(current) AS current, SUM(balance30) AS balance30, SUM(balance60) AS balance60, " +
          "SUM(balance90) AS balance90, SUM(balance120) AS balance120, SUM(balance120plus) AS balance120plus, SUM(total) AS total " +
          "FROM ( " +
              "SELECT (SELECT MAX(Transactionline.Entity) FROM Transactionline WHERE Transactionline.Transaction = Transaction.id) AS Customer1, " +
                     "(SELECT MAX(Customer.Fullname) FROM Transactionline INNER JOIN Customer ON Transactionline.entity = Customer.id WHERE Transactionline.Transaction = Transaction.id) AS Customer, " +
                     "Transaction.id, Transaction.type, " +
                     "(SELECT MAX(Transactionline.subsidiary) FROM Transactionline WHERE Transaction.id = Transactionline.Transaction) AS Subsidiary, " +
                     "SUM(CASE WHEN (TRUNC(SYSDATE) - NVL(Transaction.DueDate, Transaction.trandate)) < 1 THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) ELSE 0 END) AS current, " +
                     "SUM(CASE WHEN (TRUNC(SYSDATE) - NVL(Transaction.DueDate, Transaction.trandate)) BETWEEN 1 AND 30 THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) ELSE 0 END) AS balance30, " +
                     "SUM(CASE WHEN (TRUNC(SYSDATE) - NVL(Transaction.DueDate, Transaction.trandate)) BETWEEN 31 AND 60 THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) ELSE 0 END) AS balance60, " +
                     "SUM(CASE WHEN (TRUNC(SYSDATE) - NVL(Transaction.DueDate, Transaction.trandate)) BETWEEN 61 AND 90 THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) ELSE 0 END) AS balance90, " +
                     "SUM(CASE WHEN (TRUNC(SYSDATE) - NVL(Transaction.DueDate, Transaction.trandate)) BETWEEN 91 AND 120 THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) ELSE 0 END) AS balance120, " +
                     "SUM(CASE WHEN (TRUNC(SYSDATE) - NVL(Transaction.DueDate, Transaction.trandate)) > 120 THEN COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0) ELSE 0 END) AS balance120plus, " +
                     "SUM(COALESCE(TransactionAccountingLine.AmountUnpaid, 0) - COALESCE(TransactionAccountingLine.PaymentAmountUnused, 0)) AS total " +
              "FROM Transaction " +
              "INNER JOIN TransactionAccountingLine ON TransactionAccountingLine.Transaction = Transaction.ID " +
              "WHERE TransactionAccountingLine.accounttype IN ('AcctRec') " +
              "AND Transaction.Posting = 'T' " +
              "AND Transaction.trandate <= TO_DATE('" + toDate + "', 'DD/MM/YYYY') " +
              "GROUP BY Transaction.id, Transaction.type " +
          ") subquery " +
          "WHERE Customer1 = '" + pvendorid + "' AND Subsidiary = '" + Subid + "' " +
          "GROUP BY Customer";
      

        log.debug("query-Ageing", SQL);
        // Run the query.
        var queryResults = query.runSuiteQL({
            query: SQL
        });
        // Get the mapped results.
        var records = queryResults.asMappedResults();
        log.debug('records.length', records.length);
        if (records.length > 0) {
            for (r = 0; r < records.length; r++) {
                // Get the record.
                var record = records[r];
                // log.debug('record in ' + (r + 0), record);
                //var recId = record.id;
                var customer = record.customer;
                var current = record.current;
                var balance30 = record.balance30;
                var balance60 = record.balance60;
                var balance90 = record.balance90;
                var balance120 = record.balance120;
                var balance120plus = record.balance120plus;
                var total = record.total;
                resultArray.push({
                    'customer': customer,
                    'current': current,
                    'balance30': balance30,
                    'balance60': balance60,
                    'balance90': balance90,
                    'balance120': balance120,
                    'balance120plus': balance120plus,
                    'total': total,
                })
            }
        }
        return resultArray;
    } catch (e) {
        log.error('Error in getTransactionDetails', e);
    }
}
function getTransactionDetails(query, pToDate, pvendorid, psubid) {
    try {
        var resultArray = [];
        // Querying the required result

        // var SQL = "Select recid,trandate,duedate,recordtype,documentno,memo,openingamt,appliedamt,pendingamt, \
        //  SUM(nvl(openingamt,0)-nvl(appliedamt,0)) OVER(ORDER BY nvl(trandate,null),nvl(id,null)) as balance, foreigntotal \
        //   from (select a.id as recid,a.trandate,a.duedate, a.recordtype,a.id,\
        //   case when a.recordType = 'invoice' then a.custbody_njt_old_doc_no else a.trandisplayname end as documentno,\
        //   a.memo, sum(nvl(e.debit,0)) as openingamt, \
        //  sum(nvl(e.credit,0)) as appliedamt,SUM(nvl(e.debit,0)-nvl(e.credit,0)) as pendingamt,SUM(a.foreigntotal) as foreigntotal \
        //  from transactionaccountingline e join account acc on acc.id=e.account join transaction a on a.id=e.transaction \
        //  left join transactionline b on e.transactionline=b.id and e.transaction=b.transaction  \
        //  where a.trandate >= '" + pfromDate + "' and a.trandate <= '" + pToDate + "' and acc.accttype in ('AcctRec') and a.posting = 'T'  \
        //  and b.entity in (" + pvendorid + ") and b.subsidiary = (" + psubid + ") Group by a.id,a.custbody_njt_old_doc_no,a.trandisplayname,a.recordType,a.trandate,a.duedate,a.memo,a.transactionnumber,a.number,b.Class,a.id,a.recordtype)";
      //For testing purpose comment
        /* var SQL = "select invid, invnum, trandate, recid, foreigntotal, paidamount, duedate, recordtype, status,documentno, \
ponum,memo,openingamt, appliedamt, pendingamt,\
SUM(nvl(foreigntotal,0)-nvl(paidamount,0)) OVER(ORDER BY nvl(trandate,null)) as RTotal \
    from(select a.id as invid,a.tranid as invnum,  a.trandate , a.id AS recid,\
SUM(a.foreigntotal) as foreigntotal, MAX(pay.AmountPaid) as paidamount,\
a.duedate,a.recordtype,a.status,\
COALESCE(a.custbody_njt_old_doc_no, a.trandisplayname) AS documentno,\
a.otherrefnum AS ponum,a.memo,\
SUM(COALESCE(e.debit, 0)) AS openingamt,\
SUM(COALESCE(e.credit, 0)) AS appliedamt,\
SUM(COALESCE(e.debit, 0) - COALESCE(e.credit, 0)) AS pendingamt \
from transactionaccountingline e join account acc on acc.id=e.account join transaction a on a.id=e.transaction \
         left join transactionline b on e.transactionline=b.id and e.transaction=b.transaction \
         left join(SELECT\
     Invoice.id AS invoiceid,\
     SUM(PTLL.ForeignAmount) AS AmountPaid \
FROM\
     Transaction AS Payment\
     INNER JOIN TransactionLine AS PaymentLine ON\
          ( PaymentLine.Transaction = Payment.ID )\
          AND ( PaymentLine.MainLine = 'F' )\
     INNER JOIN PreviousTransactionLineLink AS PTLL ON\
          ( PTLL.NextDoc = PaymentLine.Transaction )\
          AND ( PTLL.NextLine = PaymentLine.ID )\
          AND ( PTLL.LinkType = 'Payment' )\
     INNER JOIN TransactionLine AS InvoiceLine ON\
          ( InvoiceLine.Transaction = PTLL.PreviousDoc )\
          AND ( InvoiceLine.ID = PTLL.PreviousLine )\
     INNER JOIN Transaction AS Invoice ON\
          ( Invoice.ID = InvoiceLine.Transaction )\
     INNER JOIN TransactionLine AS InvoiceMainLine ON\
          ( InvoiceMainLine.Transaction = Invoice.ID )\
          AND ( InvoiceMainLine.MainLine = 'T') where Payment.trandate >= '" + pfromDate + "' and Payment.trandate <= '" + pToDate + "' and PaymentLine.subsidiary =" + psubid + " Group By Invoice.id) pay on pay.invoiceid = a.id\
         where a.trandate >= '" + pfromDate + "' and a.trandate <= '" + pToDate + "' and acc.accttype in ('AcctRec')\
        and ( \
    (a.recordtype = 'invoice' AND a.status = 'A') \
    OR \
    (a.recordtype != 'invoice')\
) \
         and a.posting = 'T' and a.recordtype in ('invoice','customsale_njt_sales_downpayment')\
         and b.entity in ("+ pvendorid + ") and b.subsidiary =" + psubid + "\
         Group by a.tranid,  a.trandate,a.duedate,(a.trandate- nvl(a.duedate,a.trandate)),\
         a.id,\
         a.recordtype,\
         a.custbody_njt_old_doc_no,\
         a.trandisplayname,\
         a.otherrefnum,\
         a.trandate,\
         a.duedate,\
         a.memo,\
         a.status) Order by trandate"; */
  var SQL =
  "SELECT invid, invnum, trandate, recid, foreigntotal, paidamount, duedate, recordtype, status, documentno, ponum, memo, openingamt, appliedamt, pendingamt, " +
  "SUM(NVL(foreigntotal, 0) - NVL(paidamount, 0)) OVER (ORDER BY NVL(invid, NULL)) AS RTotal " +
  "FROM ( " +
  "  SELECT " +
  "    a.id AS invid, " +
  "    a.tranid AS invnum, " +
  "    a.trandate, " +
  "    a.id AS recid, " +
  "    SUM(NVL(e.debit, 0) - NVL(e.credit, 0)) AS foreigntotal, " +
  "    0 AS paidamount, " +
  "    a.duedate, " +
  "    a.recordtype, " +
  "    a.status, " +
  "    COALESCE(a.custbody_njt_old_doc_no, a.trandisplayname) AS documentno, " +
  "    a.otherrefnum AS ponum, " +
  "    a.memo, " +
  "    SUM(COALESCE(e.debit, 0)) AS openingamt, " +
  "    SUM(COALESCE(e.credit, 0)) AS appliedamt, " +
  "    SUM(COALESCE(e.debit, 0) - COALESCE(e.credit, 0)) AS pendingamt " +
  "  FROM transactionaccountingline e " +
  "  JOIN account acc ON acc.id = e.account " +
  "  JOIN transaction a ON a.id = e.transaction " +
  "  LEFT JOIN transactionline b ON e.transactionline = b.id AND e.transaction = b.transaction " +
  "  WHERE a.trandate <= TO_DATE('" + pToDate + "', 'DD/MM/YYYY') " +
  "    AND acc.accttype IN ('AcctRec') " +
  "    AND a.posting = 'T' " +
  "    AND b.entity IN (" + pvendorid + ") " +
  "    AND b.subsidiary = " + psubid + " " +
  "  GROUP BY " +
  "    a.tranid, a.trandate, a.duedate, (a.trandate - NVL(a.duedate, a.trandate)), a.id, a.recordtype, " +
  "    a.custbody_njt_old_doc_no, a.trandisplayname, a.otherrefnum, a.trandate, a.duedate, a.memo, a.status " +
  ") " +
  "ORDER BY invid, trandate";





        log.debug("query", SQL);
        // Run the query.
        var queryResults = query.runSuiteQL({
            query: SQL
        });

        var records = queryResults.asMappedResults();
        log.debug('records.length', records.length);
        if (records.length > 0) {
            for (r = 0; r < records.length; r++) {
                // Get the record.
                var record = records[r];
                // log.debug('record in ' + (r + 0), record);
                var recid = record.recid;
              log.debug("invoiceid",recid);
                var trandate = record.trandate;
                var duedate = record.duedate;
                var recordtype = record.recordtype;
                var documentno = record.documentno;
                var ponum = record.ponum;
                var paidamount = record.paidamount;
                log.debug("ponum of sql", ponum);
                var memo = record.memo;
                var openingamt = record.openingamt;
                var appliedamt = record.appliedamt;
                var pendingamt = record.pendingamt;
                var balance = record.balance;
                var foreigntotal = record.foreigntotal;
                var rtotal = record.rtotal;
                
                resultArray.push({
                    'recid': recid,
                    'trandate': trandate,
                    'duedate': duedate,
                    'recordtype': recordtype,
                    'documentno': documentno,
                    'ponum': ponum,
                    'memo': memo,
                    'openingamt': openingamt,
                    'appliedamt': appliedamt,
                    'pendingamt': pendingamt,
                    'balance': balance,
                    'paidamount': record.paidamount,
                    'foreigntotal': foreigntotal,
                    'rtotal': rtotal,
                })
            }
        }
        return resultArray;
    } catch (e) {
        log.error('Error in getTransactionDetails', e);
    }
}