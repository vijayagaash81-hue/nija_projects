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

                var transactionResult = getTransactionDetails(query, toDate, vendorvalue, Subid);

                // 1. Map transaction data & Initialize Aging Buckets
                var mappedTransactions = [];
                var totalDebit = 0, totalCredit = 0, totalOpen = 0, totalCumBal = 0;
                var ags = {
                    agingDue: 0, agingOnAcct: 0, agingBal: 0, aging180: 0, aging151: 0,
                    aging121: 0, aging91: 0, aging61: 0, aging0: 0, agingPdc: 0
                };

                // Parse As-Of Date safely for accurate aging calculation
                var asOfDateObj = new Date();
                if (toDate) {
                    try { asOfDateObj = format.parse({ value: toDate, type: format.Type.DATE }); } catch(e){}
                }
                
                if (transactionResult && transactionResult.length > 0) {
                    for (var j = 0; j < transactionResult.length; j++) {
                        var recd = transactionResult[j];
                        var openAmount = parseFloat(recd.amountremaining || 0);
                        totalDebit += parseFloat(recd.openingamt || 0);
                        totalCredit += parseFloat(recd.appliedamt || 0);
                        totalOpen += openAmount;
                        totalCumBal = parseFloat(recd.rtotal || 0);

                        // Calculate Due Days Dynamically against As Of Date
                        var dueDays = 0;
                        var dueDateObj = asOfDateObj;
                        try {
                            if (recd.duedate) {
                                dueDateObj = format.parse({ value: recd.duedate, type: format.Type.DATE });
                            } else if (recd.trandate) {
                                dueDateObj = format.parse({ value: recd.trandate, type: format.Type.DATE });
                            }
                        } catch(e) {}
                        
                        var dTime = asOfDateObj.getTime() - dueDateObj.getTime();
                        dueDays = Math.floor(dTime / (1000 * 60 * 60 * 24));
                        if (dueDays < 0) dueDays = 0;

                        // Aggregate directly into Aging Buckets based on verified openAmount
                        if (Math.abs(openAmount) > 0.001) {
                            ags.agingDue += openAmount;
                            ags.agingBal += openAmount;

                            if (openAmount < 0) {
                                ags.aging0 += openAmount; // Credits/Unapplied payments map to Current bucket
                            } else {
                                if (dueDays <= 60) { ags.aging0 += openAmount; } 
                                else if (dueDays <= 90) { ags.aging61 += openAmount; } 
                                else if (dueDays <= 120) { ags.aging91 += openAmount; } 
                                else if (dueDays <= 150) { ags.aging121 += openAmount; } 
                                else if (dueDays <= 180) { ags.aging151 += openAmount; } 
                                else { ags.aging180 += openAmount; }
                            }
                        }

                        mappedTransactions.push({
                            docNo: escapeXML(recd.documentno || ''),
                            postDate: recd.trandate || '',
                            dueDate: recd.duedate || '',
                            trxType: escapeXML(recd.recordtype || ''),
                            refNo: escapeXML(recd.ponum || ''),
                            dnNo: '',
                            debit: formatNumber(recd.openingamt),
                            credit: formatNumber(recd.appliedamt),
                            open: formatNumber(openAmount),
                            cumBal: formatNumber(recd.rtotal),
                            pdc: '0.00',
                            dueDays: dueDays,
                            maturityDays: '-'
                        });
                    }
                }

                // 3. Get other customer data
                var creditLimit = Venrecobj.getValue({ fieldId: 'creditlimit' }) || 0;
                var paymentTerms = Venrecobj.getText({ fieldId: 'terms' }) || '';
                var currency = Venrecobj.getText({ fieldId: 'currency' }) || 'AED';
                var legalName = typeof subsidiaryRecord !== 'undefined' ? (subsidiaryRecord.getValue({ fieldId: 'legalname' }) || subname) : subname;

                // Determine Bank Details based on Subsidiary Name
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

                // 4. Build the final customData object
                var data = {
                    bpType: 'Customer',
                    asOnDate: toDate,
                    division: escapeXML(subname || 'ALL'),
                    subsidiaryName: escapeXML(legalName || 'SJS ENERSOL LLC'),
                    basedOn: 'Posting Date',
                    
                    customerName: escapeXML(vendname),
                    customerAddress: escapeXML(Address || '').replace(/\r\n/g, '<br/>').replace(/\n/g, '<br/>'),
                    customerPhone: escapeXML(phone || ''),
                    customerFax: escapeXML(fax || ''),
                    
                    salesRep: escapeXML(salesemp || ''),
                    creditLimit: format.format({ value: creditLimit, type: format.Type.CURRENCY, currency: currency }),
                    paymentTerms: escapeXML(paymentTerms),
                    currency: escapeXML(currency),
                    
                    transactions: mappedTransactions,
                    totalDebit: format.format({ value: totalDebit, type: format.Type.CURRENCY, currency: currency }),
                    totalCredit: format.format({ value: totalCredit, type: format.Type.CURRENCY, currency: currency }),
                    totalOpen: format.format({ value: totalOpen, type: format.Type.CURRENCY, currency: currency }),
                    totalCumBal: format.format({ value: totalCumBal, type: format.Type.CURRENCY, currency: currency }),
                    totalPdc: '0.00',
                    
                    outstandingBal: format.format({ value: totalOpen, type: format.Type.CURRENCY, currency: currency }),
                    pdcOnHand: '0.00',
                    netBalance: format.format({ value: totalOpen, type: format.Type.CURRENCY, currency: currency }),
                    
                    pdcs: [],
                    totalPdcAmt: '0.00',
                    
                    agingDue: format.format({ value: ags.agingDue, type: format.Type.CURRENCY, currency: currency }),
                    agingOnAcct: format.format({ value: ags.agingOnAcct, type: format.Type.CURRENCY, currency: currency }),
                    agingBal: format.format({ value: ags.agingBal, type: format.Type.CURRENCY, currency: currency }),
                    aging180: format.format({ value: ags.aging180, type: format.Type.CURRENCY, currency: currency }),
                    aging151: format.format({ value: ags.aging151, type: format.Type.CURRENCY, currency: currency }),
                    aging121: format.format({ value: ags.aging121, type: format.Type.CURRENCY, currency: currency }),
                    aging91: format.format({ value: ags.aging91, type: format.Type.CURRENCY, currency: currency }),
                    aging61: format.format({ value: ags.aging61, type: format.Type.CURRENCY, currency: currency }),
                    aging0: format.format({ value: ags.aging0, type: format.Type.CURRENCY, currency: currency }),
                    agingPdc: format.format({ value: ags.agingPdc, type: format.Type.CURRENCY, currency: currency }),
                    
                    bankAcctName: escapeXML(bankAcctName),
                    bankName: escapeXML(bankName),
                    bankAcctNo: escapeXML(bankAcctNo),
                    bankIban: escapeXML(bankIban),
                    bankBranch: escapeXML(bankBranch),
                    bankSwift: escapeXML(bankSwift),
                    
                    extraNote: 'This is a system generated statement of account.'
                };

                // 5. Render
                var tpl_content = file.load({
                    id: 2270
                }).getContents();
                
                var renderer = render.create();
                renderer.templateContent = tpl_content;
                renderer.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: 'customData',
                    data: data
                });
                
                var salaryPDF = renderer.renderAsPdf();
                context.response.writeFile(salaryPDF, true);

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

        // Safe Number Formatter (e.g. 63000 -> 63,000.00)
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
... (removed old commented blocks for clarity) ... */
        var SQL =
            "SELECT " +
            "    recid, " +
            "    trandate, " +
            "    duedate, " +
            "    recordtype, " +
            "    documentno, " +
            "    ponum, " +
            "    memo, " +
            "    openingamt, " +
            "    appliedamt, " +
            "    amountremaining, " +
            "    SUM(NVL(amountremaining, 0)) OVER (ORDER BY trandate, recid) AS rtotal " +
            "FROM ( " +
            "    SELECT " +
            "        a.id AS recid, " +
            "        a.trandate, " +
            "        a.duedate, " +
            "        a.recordtype, " +
            "        a.trandisplayname AS documentno, " +
            "        a.otherrefnum AS ponum, " +
            "        a.memo, " +
            "        SUM(NVL(e.debit, 0)) AS openingamt, " +
            "        SUM(NVL(e.credit, 0)) AS appliedamt, " +
            "        SUM(NVL(e.debit, 0) - NVL(e.credit, 0)) AS amountremaining " +
            "    FROM transactionaccountingline e " +
            "    JOIN account acc ON acc.id = e.account " +
            "    JOIN transaction a ON a.id = e.transaction " +
            "    WHERE a.trandate <= TO_DATE('" + pToDate + "', 'DD/MM/YYYY') " +
            "      AND acc.accttype = 'AcctRec' " +
            "      AND a.posting = 'T' " +
            "      AND EXISTS ( " +
            "          SELECT 1 " +
            "          FROM transactionline tl " +
            "          WHERE tl.transaction = a.id " +
            "          AND tl.entity = " + pvendorid + " " +
            "      ) " +
            "    GROUP BY " +
            "        a.id, a.trandate, a.duedate, a.recordtype, a.trandisplayname, a.otherrefnum, a.memo " +
            ") " +
            "ORDER BY trandate, recid";

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
                
                resultArray.push({
                    'recid': record.recid,
                    'trandate': record.trandate,
                    'duedate': record.duedate,
                    'recordtype': record.recordtype,
                    'documentno': record.documentno,
                    'ponum': record.ponum,
                    'memo': record.memo,
                    'openingamt': record.openingamt,
                    'appliedamt': record.appliedamt,
                    'amountremaining': record.amountremaining,
                    'rtotal': record.rtotal
                });
            }
        }
        return resultArray;
    } catch (e) {
        log.error('Error in getTransactionDetails', e);
    }
}