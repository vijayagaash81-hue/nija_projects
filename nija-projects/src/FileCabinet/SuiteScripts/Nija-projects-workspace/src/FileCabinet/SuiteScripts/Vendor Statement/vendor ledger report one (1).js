/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
var Email;
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
                //var fromDate = context.request.parameters.fromDate;
                var toDate = context.request.parameters.toDate;
                var Subid = context.request.parameters.Subid;

               // log.debug('fromDate', fromDate);
                log.debug('toDate', toDate);
                log.debug('vendorvalue', vendorvalue);
                log.debug('Subid', Subid);

                // Safely format the date into YYYY-MM-DD to avoid SuiteQL parsing errors
                // due to differing user date preferences.
                var parsedToDate = format.parse({ value: toDate, type: format.Type.DATE });
                var yyyy = parsedToDate.getFullYear();
                var mm = ('0' + (parsedToDate.getMonth() + 1)).slice(-2);
                var dd = ('0' + parsedToDate.getDate()).slice(-2);
                var sqlToDate = yyyy + '-' + mm + '-' + dd;

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
                    var logotag = '';
                    var img_floor = subsidiaryRecord.getValue({ fieldId: 'logo' }); var floorImg = '';
                    var website = subsidiaryRecord.getValue({ fieldId: 'url' }); var floorImg = '';
                    if (img_floor) {
                        logotag = file.load({
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
                    type: 'vendor',
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
                        fieldId: 'phone'
                    });
                }
                var fax = Venrecobj.getValue({
                    fieldId: 'fax'
                });
                
                var salesemp = '';
                try {
                    // Vendors do not have a standard 'salesrep' field. Try-catch prevents crashes.
                    salesemp = Venrecobj.getText({ fieldId: 'custentity121' }) || '';
                } catch(e) {}
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
                ageingsummery = getAgeingDetails(query, vendorvalue, Subid, sqlToDate);

                var transactionResult = [];
                var transactionArray = [];
                var addingtotal = 0;
                var total = 0;
                var totaldebit = 0;
                var totalcredit = 0;
                transactionResult = getTransactionDetails(query, sqlToDate, vendorvalue, Subid);

                // Format raw recordtype into proper labels
                function formatRecordType(type) {
                    var map = {
                        'vendorbill': 'Vendor Bill',
                        'vendorpayment': 'Vendor Payment',
                        'vendorcredit': 'Vendor Credit',
                        'journalentry': 'Journal Entry'
                    };
                    return map[type.toLowerCase()] || type;
                }

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
                        var duedays = recd.duedays || 0;
                        var newbalamt = parseFloat(pendingamt || 0);
                        
                        addingtotal += parseFloat(newbalamt);
                        totaldebit += parseFloat(openingamt);
                        totalcredit += parseFloat(appliedamt);

                        transactionArray.push({
                            docNo: documentno,
                            postDate: trandate,
                            dueDate: duedate,
                            trxType: formatRecordType(recordtype),
                            refNo: ponum,
                            memo: memo,
                            debit: parseFloat(openingamt) || 0,
                            credit: parseFloat(appliedamt) || 0,
                            open: parseFloat(newbalamt) || 0,
                            cumBal: parseFloat(rtotal) || 0,
                            dueDays: parseInt(duedays) || 0
                        });

                    }
                }
                total = parseFloat(totaldebit) - parseFloat(totalcredit);

                var agingArray = [];
                if (ageingsummery && ageingsummery.length > 0) {
                    agingArray = ageingsummery;
                }
                else {
                    agingArray.push({
                        customer: '',
                        balance60: 0,
                        balance90: 0,
                        balance120: 0,
                        balance150: 0,
                        balance180: 0,
                        balance180plus: 0,
                        total: 0
                    });
                }

                var agingData = agingArray[0] || {};

                var tpl_content = file.load({
                    id: 2268
                }).getContents();

                tpl_content = tpl_content.replace(/<br>/gi, '<br />');

                var totalBalanceAbs = Math.abs(addingtotal);

                var bankAcctName = '';
                var bankName = '';
                var bankAcctNo = '';
                var bankIban = '';
                var bankBranch = '';
                var bankSwift = '';

                if (subname && subname.toUpperCase().indexOf('ENGINEERING') !== -1) {
                    bankAcctName = 'Sjs Enersol Engineering Works llc';
                    bankName = 'Abu Dhabi Commercial Bank';
                    bankAcctNo = '116-535379200-01';
                    bankIban = 'AE28 0030 0116 5353 7920 001';
                    bankBranch = 'Ajman Branch';
                    bankSwift = 'ADCBAEAA';
                } else {
                    bankAcctName = 'Sjs Enersol llc';
                    bankName = 'Commercial Bank of Dubai';
                    bankAcctNo = '100-234850-4';
                    bankIban = 'AE93 0230 0000 0100 2348 504';
                    bankBranch = 'Ajman Branch';
                    bankSwift = 'CBDUAEADXXX';
                }

                var customData = {
                    customerName: vendname,
                    customerAddress: Address,
                    customerPhone: phone,
                    customerFax: fax,
                    salesRep: salesemp,
                    asOnDate: toDate,
                    division: subname || '',
                    transactions: transactionArray,
                    aging: agingArray,
                    aging0: formatNumber(agingData.balance60),
                    aging61: formatNumber(agingData.balance90),
                    aging91: formatNumber(agingData.balance120),
                    aging121: formatNumber(agingData.balance150),
                    aging151: formatNumber(agingData.balance180),
                    aging180: formatNumber(agingData.balance180plus),
                    agingDue: formatNumber(totalBalanceAbs),
                    agingBal: formatNumber(totalBalanceAbs),
                    agingOnAcct: '0.00',
                    agingPdc: '0.00',
                    outstandingBal: formatNumber(totalBalanceAbs),
                    pdcOnHand: '0.00',
                    netBalance: formatNumber(totalBalanceAbs),
                    bankAcctName: bankAcctName,
                    bankName: bankName, 
                    bankAcctNo: bankAcctNo,
                    bankIban: bankIban,
                    bankBranch: bankBranch,
                    bankSwift: bankSwift,
                    totalDebit: totaldebit,
                    totalCredit: totalcredit,
                    totalOpen: addingtotal,
                    printedDate: printedDate,
                    printedTime: printedTime,
                    ccode: ccode,
                    logotag1: logotag1,
                    logoUrl: logotag,
                    bpType: 'Vendor',
                    basedOn: 'Posting Date'
                };

                var renderer = render.create();
                renderer.templateContent = tpl_content;
                renderer.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: "customData",
                    data: customData
                });

                var salaryPDF = renderer.renderAsPdf();
                context.response.writeFile(salaryPDF, true);
                // context.response.writePage(form);

                log.audit('USAGE', runtime.getCurrentScript().getRemainingUsage());

            } catch (e) {
                log.error("Error in OnRequest", e.message);
                context.response.write("<h3>Error generating statement</h3><p>" + e.message + "</p>");
            }
        }
        function escapeXML(input) {
            //log.error('Input srtring: ',input);
            var output = '';
            if (input) {
                output = xml.escape({
                    xmlText: String(input)
                });
            }
            return output;
        }

        function formatNumber(val) {
            if (!val) return '0.00';
            var parsed = parseFloat(val);
            if (isNaN(parsed)) return '0.00';
            return parsed.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        return {
            onRequest: onRequest
        };

    });
    
function getAgeingDetails(query, pvendorid, Subid, sqlToDate) {
    try {
        var resultArray = [];
        var amtCalc = "(NVL(e.credit, 0) - NVL(e.debit, 0))";
        var asOfDate = "TO_DATE('" + sqlToDate + "', 'YYYY-MM-DD')";
        
        var SQL = "SELECT " +
            "SUM(CASE WHEN (" + asOfDate + " - NVL(a.duedate, a.trandate)) <= 60 THEN " + amtCalc + " ELSE 0 END) AS balance60, " +
            "SUM(CASE WHEN (" + asOfDate + " - NVL(a.duedate, a.trandate)) BETWEEN 61 AND 90 THEN " + amtCalc + " ELSE 0 END) AS balance90, " +
            "SUM(CASE WHEN (" + asOfDate + " - NVL(a.duedate, a.trandate)) BETWEEN 91 AND 120 THEN " + amtCalc + " ELSE 0 END) AS balance120, " +
            "SUM(CASE WHEN (" + asOfDate + " - NVL(a.duedate, a.trandate)) BETWEEN 121 AND 150 THEN " + amtCalc + " ELSE 0 END) AS balance150, " +
            "SUM(CASE WHEN (" + asOfDate + " - NVL(a.duedate, a.trandate)) BETWEEN 151 AND 180 THEN " + amtCalc + " ELSE 0 END) AS balance180, " +
            "SUM(CASE WHEN (" + asOfDate + " - NVL(a.duedate, a.trandate)) > 180 THEN " + amtCalc + " ELSE 0 END) AS balance180plus, " +
            "SUM(" + amtCalc + ") AS total " +
            "FROM transactionaccountingline e " +
            "JOIN account acc ON acc.id = e.account " +
            "JOIN transaction a ON a.id = e.transaction " +
            "WHERE acc.accttype IN ('AcctPay') " +
            "AND a.trandate <= " + asOfDate + " " +
            "AND a.entity = " + pvendorid;

        log.debug("query-Ageing", SQL);
        // Run the query.
        var queryResults = query.runSuiteQL({ query: SQL });
        var records = queryResults.asMappedResults();
        log.debug('records', JSON.stringify(records));
        
        if (records.length > 0) {
            for (var r = 0; r < records.length; r++) {
                var record = records[r];
                resultArray.push({
                            'customer': record.vendor || '',
                    'balance60': record.balance60,
                    'balance90': record.balance90,
                    'balance120': record.balance120,
                    'balance150': record.balance150,
                    'balance180': record.balance180,
                    'balance180plus': record.balance180plus,
                    'total': record.total,
                });
            }
        }
        return resultArray;
    } catch (e) {
        log.error('Error in getAgeingDetails', e);
    }
}

function getTransactionDetails(query, sqlToDate, pvendorid, psubid) {
    try {
        var resultArray = [];
 var SQL = "SELECT invid, invnum, trandate, recid, foreigntotal, paidamount, duedate, duedays, recordtype, status, posting, " +
          "(SELECT MAX(subsidiary) FROM transactionline WHERE transaction = invid AND mainline='T') AS transubsidiary, " +
          "documentno, ponum, memo, openingamt, appliedamt, pendingamt, " +
          "SUM(NVL(foreigntotal, 0) - NVL(paidamount, 0)) OVER (ORDER BY NVL(invid, NULL)) AS RTotal " +
          "FROM ( " +
              "SELECT a.id AS invid, " +
                     "a.tranid AS invnum, " +
                     "a.trandate, " +
                     "a.id AS recid, " +
                     "SUM(NVL(e.debit, 0) - NVL(e.credit, 0)) AS foreigntotal, " +
                     "0 AS paidamount, " +
                     "a.duedate, " +
                     "(TO_DATE('" + sqlToDate + "', 'YYYY-MM-DD') - NVL(a.duedate, a.trandate)) AS duedays, " +
                     "a.recordtype, " +
                     "a.status, " +
                         "a.posting, " +
                     "a.trandisplayname AS documentno, " +
                     "a.otherrefnum AS ponum, " +
                     "a.memo, " +
                     "SUM(COALESCE(e.credit, 0)) AS openingamt, " +
                     "SUM(COALESCE(e.debit, 0)) AS appliedamt, " +
                     "SUM(COALESCE(e.debit, 0) - COALESCE(e.credit, 0)) AS pendingamt " +
              "FROM transactionaccountingline e " +
              "JOIN account acc ON acc.id = e.account " +
              "JOIN transaction a ON a.id = e.transaction " +
              "WHERE a.trandate <= TO_DATE('" + sqlToDate + "', 'YYYY-MM-DD') " +
              "AND acc.accttype IN ('AcctPay') " +
              "AND a.entity = " + pvendorid + " " +
              "GROUP BY a.tranid, a.trandate, a.duedate, " +
                       "(TO_DATE('" + sqlToDate + "', 'YYYY-MM-DD') - NVL(a.duedate, a.trandate)), " +
                       "a.id, a.recordtype, " +
                       "a.trandisplayname, a.otherrefnum, a.trandate, " +
                       "a.duedate, a.memo, a.status, a.posting " +
          ") " +
         "ORDER BY trandate, invid";



        log.debug("query", SQL);
        // Run the query.
        var queryResults = query.runSuiteQL({
            query: SQL
        });

        var records = queryResults.asMappedResults();
        log.debug('records', JSON.stringify(records));
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
                var foreigntotal = record.foreigntotal;
                var rtotal = record.rtotal;
                
                resultArray.push({
                    'recid': recid,
                    'trandate': trandate,
                    'duedate': duedate,
                    'duedays': record.duedays,
                    'recordtype': recordtype,
                    'documentno': documentno,
                    'ponum': ponum,
                    'memo': memo,
                    'openingamt': openingamt,
                    'appliedamt': appliedamt,
                    'pendingamt': pendingamt,
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