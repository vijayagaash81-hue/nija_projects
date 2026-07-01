/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/query', 'N/render', 'N/file', 'N/record', 'N/format', 'N/log'], 
function(serverWidget, query, render, file, record, format, log) {
    
    function onRequest(context) {
        var req = context.request;
        var res = context.response;
        var action = req.parameters.action;
        
        if (action === 'print') {
            generatePdf(req, res);
        } else {
            renderProfessionalUI(req, res);
        }
    }
    
    function renderProfessionalUI(req, res) {
        var paramCustomer = req.parameters.custpage_customer || '';
        var paramAsOfDate = req.parameters.custpage_as_of_date || '';
        var paramDivision = req.parameters.custpage_division || '';
        
        // Fetch Customers and Divisions for Dropdowns
        var custSql = "SELECT id, companyname, isperson, firstname, lastname, entityid FROM customer WHERE isinactive = 'F' ORDER BY entityid ASC FETCH FIRST 2000 ROWS ONLY";
        var customers = [];
        try {
            customers = query.runSuiteQL({ query: custSql }).asMappedResults();
        } catch (e) {
            log.error('Error Fetching Customers', e);
        }
        
        // NOTE: If using a custom created segment instead of native Class/Department, 
        // replace 'classification' with your custom record ID (e.g., customrecord_cseg_my_div)
        var divSql = "SELECT id, name FROM classification WHERE isinactive = 'F' ORDER BY name ASC";
        var divisions = [];
        try {
            divisions = query.runSuiteQL({ query: divSql }).asMappedResults();
        } catch (e) {
            log.error('Error Fetching Divisions/Classes', e);
        }

        // Default the As-Of Date to Today if it is empty
        if (!paramAsOfDate) {
            var d = new Date();
            paramAsOfDate = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
        }
        
        var custOptions = '<option value="">- Select Customer -</option>';
        for (var i = 0; i < customers.length; i++) {
            var c = customers[i];
            var name = (c.isperson === 'T') ? ((c.firstname || '') + ' ' + (c.lastname || '')).trim() : (c.companyname || c.entityid);
            if (!name) name = c.entityid;
            var selected = (paramCustomer == c.id) ? 'selected' : '';
            custOptions += '<option value="' + c.id + '" ' + selected + '>' + name + '</option>';
        }
        
        var divOptions = '<option value="">- All Classes / Divisions -</option>';
        for (var i = 0; i < divisions.length; i++) {
            var d = divisions[i];
            var selected = (paramDivision == d.id) ? 'selected' : '';
            divOptions += '<option value="' + d.id + '" ' + selected + '>' + d.name + '</option>';
        }
        
        // Table Rows & Totals Generation
        var tableRows = '';
        var errorMsg = '';
        var totalDebit = 0, totalCredit = 0, totalOpen = 0;
        
        if (paramCustomer) {
            var txs = [];
            try {
                txs = getTransactions(paramCustomer, paramAsOfDate, paramDivision);
            } catch (e) {
                errorMsg = '<tr><td colspan="9" style="text-align:center; color:red; padding: 25px; font-weight:bold;">Error fetching transactions: ' + e.message + '</td></tr>';
            }
            
            if (txs.length === 0) {
                tableRows = '<tr><td colspan="9" style="text-align:center; padding: 25px;">No outstanding transactions found.</td></tr>';
            } else {
                for (var j = 0; j < txs.length; j++) {
                    var tx = txs[j];
                    totalDebit += tx.debit;
                    totalCredit += tx.credit;
                    totalOpen += tx.open;
                    
                    tableRows += `<tr>
                        <td>${tx.docNo || ''}</td>
                        <td>${tx.postDate || ''}</td>
                        <td>${tx.dueDate || ''}</td>
                        <td>${tx.trxType || ''}</td>
                        <td>${tx.refNo || ''}</td>
                        <td style="text-align:right;">${formatCurrency(tx.debit)}</td>
                        <td style="text-align:right;">${formatCurrency(tx.credit)}</td>
                        <td style="text-align:right;">${formatCurrency(tx.open)}</td>
                        <td style="text-align:right;">${formatCurrency(tx.cumBal)}</td>
                    </tr>`;
                }
                
                tableRows += `<tr class="totals-row">
                    <td colspan="5" style="text-align:right;">Totals:</td>
                    <td style="text-align:right;">${formatCurrency(totalDebit)}</td>
                    <td style="text-align:right;">${formatCurrency(totalCredit)}</td>
                    <td style="text-align:right;">${formatCurrency(totalOpen)}</td>
                    <td></td>
                </tr>`;
            }
        } else {
            tableRows = '<tr><td colspan="9" style="text-align:center; padding: 25px;">Please select a customer and click Generate Statement.</td></tr>';
        }
        
        // Professional HTML Template
        var html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>BP Outstanding Report</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; color: #333; }
                .header { background-color: #1a252f; color: #ffffff; padding: 20px 40px; border-bottom: 3px solid #3498db; }
                .header h1 { margin: 0; font-size: 22px; font-weight: 500; letter-spacing: 0.5px; }
                .container { max-width: 1300px; margin: 30px auto; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-radius: 6px; overflow: hidden; }
                .filters { display: flex; gap: 20px; padding: 25px 40px; background-color: #fafbfc; border-bottom: 1px solid #e1e5eb; align-items: flex-end; flex-wrap: wrap; }
                .filter-group { display: flex; flex-direction: column; flex: 1; min-width: 200px; }
                .filter-group label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #5c6c7c; margin-bottom: 8px; letter-spacing: 0.5px; }
                .filter-group select, .filter-group input { padding: 10px 12px; border: 1px solid #ced4da; border-radius: 4px; font-size: 14px; color: #333; outline: none; transition: border-color 0.2s; }
                .filter-group select:focus, .filter-group input:focus { border-color: #3498db; box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2); }
                .actions { display: flex; gap: 12px; align-items: flex-end; }
                .btn { padding: 11px 20px; border: none; border-radius: 4px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s, transform 0.1s; letter-spacing: 0.3px; }
                .btn:active { transform: translateY(1px); }
                .btn-primary { background-color: #3498db; color: #ffffff; }
                .btn-primary:hover { background-color: #2980b9; }
                .btn-secondary { background-color: #2c3e50; color: #ffffff; }
                .btn-secondary:hover { background-color: #1a252f; }
                .content { padding: 30px 40px; }
                .section-title { font-size: 16px; font-weight: 600; color: #2c3e50; margin-top: 0; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th { background-color: #f8f9fa; color: #495057; font-size: 12px; font-weight: 700; text-transform: uppercase; text-align: left; padding: 14px 15px; border-bottom: 2px solid #e1e5eb; }
                td { padding: 12px 15px; border-bottom: 1px solid #e1e5eb; font-size: 13px; color: #444; }
                tbody tr:hover { background-color: #f8f9fa; }
                .totals-row td { font-weight: 700; background-color: #fafbfc; border-top: 2px solid #cbd3da; color: #1a252f; }
            </style>
            <script>
                function submitAction(actionType) {
                    const customer = document.getElementById('custpage_customer').value;
                    const asOfDate = document.getElementById('custpage_as_of_date').value;
                    const division = document.getElementById('custpage_division').value;
                    
                    if (!customer) {
                        alert('Please select a Customer before proceeding.');
                        return;
                    }
                    
                    const url = new URL(window.location.href);
                    url.searchParams.set('custpage_customer', customer);
                    url.searchParams.set('custpage_as_of_date', asOfDate);
                    url.searchParams.set('custpage_division', division);
                    
                    if (actionType === 'print') {
                        url.searchParams.set('action', 'print');
                        window.open(url.toString(), '_blank');
                    } else {
                        url.searchParams.delete('action');
                        window.location.href = url.toString();
                    }
                }
            </script>
        </head>
        <body>
            <div class="header">
                <h1>Business Partner Outstanding Report</h1>
            </div>
            
            <div class="container">
                <div class="filters">
                    <div class="filter-group">
                        <label>Customer (BP)</label>
                        <select id="custpage_customer">${custOptions}</select>
                    </div>
                    <div class="filter-group">
                        <label>As Of Date</label>
                        <input type="date" id="custpage_as_of_date" value="${paramAsOfDate}" />
                    </div>
                    <div class="filter-group">
                        <label>Division / Department</label>
                        <select id="custpage_division">${divOptions}</select>
                    </div>
                    <div class="actions">
                        <button class="btn btn-primary" onclick="submitAction('view')">Generate Statement</button>
                        <button class="btn btn-secondary" onclick="submitAction('print')">Print PDF</button>
                    </div>
                </div>
                
                <div class="content">
                    <h2 class="section-title">Outstanding Transactions</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Doc No</th>
                                <th>Posting Date</th>
                                <th>Due Date</th>
                                <th>TRX Type</th>
                                <th>LPO/REF No</th>
                                <th style="text-align:right;">Debit</th>
                                <th style="text-align:right;">Credit</th>
                                <th style="text-align:right;">Open Amount</th>
                                <th style="text-align:right;">Cum. Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${errorMsg}
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>`;
        
        res.write(html);
    }

    function formatCurrency(val) {
        return parseFloat(val || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    
    function getTransactions(customerId, asOfDate, division) {
        // Basic Query to get Open Accounts Receivable Transactions
        var sql = "SELECT " +
            "t.tranid AS docno, " +
            "TO_CHAR(t.trandate, 'DD/MM/YYYY') AS postdate, " +
            "TO_CHAR(t.duedate, 'DD/MM/YYYY') AS duedate, " +
            "t.duedate AS raw_duedate, " +
            "BUILTIN.DF(t.type) AS trxtype, " +
            "t.otherrefnum AS refno, " +
            "NVL(tal.debit, 0) AS debit, " +
            "NVL(tal.credit, 0) AS credit, " +
            "(NVL(tal.debit, 0) - NVL(tal.credit, 0)) AS openamount " +
            "FROM transaction t " +
            "JOIN transactionline tl ON t.id = tl.transaction " +
            "JOIN transactionaccountingline tal ON tl.transaction = tal.transaction AND tl.id = tal.transactionline " +
            "JOIN account a ON tal.account = a.id " +
            "LEFT JOIN transactionline tl_main ON t.id = tl_main.transaction AND tl_main.mainline = 'T' " +
            "WHERE a.accttype = 'AcctRec' AND (t.entity = ? OR tl.entity = ?) AND t.posting = 'T' " +
            "AND (NVL(tal.debit, 0) - NVL(tal.credit, 0)) != 0 ";
            
        var params = [parseInt(customerId, 10), parseInt(customerId, 10)];
        
        var targetDate = new Date();
        if (asOfDate) {
            var formattedDate = asOfDate;
            // Check if date is not already YYYY-MM-DD
            if (asOfDate.indexOf('-') === -1) {
                targetDate = format.parse({ value: asOfDate, type: format.Type.DATE });
                formattedDate = targetDate.getFullYear() + '-' + ('0' + (targetDate.getMonth() + 1)).slice(-2) + '-' + ('0' + targetDate.getDate()).slice(-2);
            } else {
                targetDate = new Date(asOfDate);
            }
            sql += " AND t.trandate <= TO_DATE(?, 'YYYY-MM-DD') ";
            params.push(formattedDate);
        }
        
        // Filter by Header Class via the mainline transaction line
        if (division) {
            sql += " AND tl_main.class = ? ";
            params.push(parseInt(division, 10));
        }
        
        sql += " ORDER BY t.trandate, t.id";
        
        var results = query.runSuiteQL({ query: sql, params: params }).asMappedResults();
        
        var mappedResults = [];
        var cumBal = 0;
        
        for (var i = 0; i < results.length; i++) {
            var r = results[i];
            var openAmt = parseFloat(r.openamount) || 0;
            cumBal += openAmt;
            
            var dueDays = 0;
            if (r.raw_duedate) {
                var dueDate = new Date(r.raw_duedate);
                var diffTime = targetDate - dueDate;
                dueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            }
            
            mappedResults.push({
                docNo: r.docno,
                postDate: r.postdate,
                dueDate: r.duedate || r.postdate,
                trxType: r.trxtype,
                refNo: r.refno || '',
                dnNo: '', // Map Delivery Note field if applicable
                debit: parseFloat(r.debit) || 0,
                credit: parseFloat(r.credit) || 0,
                open: openAmt,
                cumBal: cumBal,
                pdc: 0, 
                dueDays: dueDays > 0 ? dueDays : 0,
                maturityDays: '-'
            });
        }
        
        return mappedResults;
    }

    function getCustomerDetails(customerId) {
        var details = {
            customerName: '',
            customerAddress: '',
            customerPhone: '',
            customerFax: '',
            salesRep: '',
            creditLimit: '0.00',
            paymentTerms: '',
            currency: 'AED'
        };

        try {
            var custRec = record.load({ type: record.Type.CUSTOMER, id: customerId });
            var isPerson = custRec.getValue('isperson') === 'T';
            details.customerName = isPerson ? (custRec.getValue('firstname') + ' ' + custRec.getValue('lastname')) : (custRec.getValue('companyname') || custRec.getText('entityid'));
            details.customerPhone = custRec.getValue('phone') || '';
            details.customerFax = custRec.getValue('fax') || '';
            details.creditLimit = format.format({ value: custRec.getValue('creditlimit') || 0, type: format.Type.CURRENCY });
            details.paymentTerms = custRec.getText('terms') || '';
            details.currency = custRec.getText('currency') || 'AED';
            details.salesRep = custRec.getText('salesrep') || '';
            details.customerAddress = custRec.getValue('defaultaddress') ? custRec.getValue('defaultaddress').replace(/\n/g, '<br/>') : '';
        } catch(e) {
            log.error('Error fetching customer', e);
        }
        return details;
    }
    
    function generatePdf(req, res) {
        var customerId = req.parameters.custpage_customer;
        var asOfDate = req.parameters.custpage_as_of_date || format.format({ value: new Date(), type: format.Type.DATE });
        var division = req.parameters.custpage_division;
        
        if (!customerId) {
            res.write('Customer ID is required to generate the PDF.');
            return;
        }

        // Format asOfDate for PDF Template presentation (DD/MM/YYYY)
        var displayDate = asOfDate;
        if (asOfDate && asOfDate.indexOf('-') !== -1) {
            var parts = asOfDate.split('-');
            displayDate = parts[2] + '/' + parts[1] + '/' + parts[0];
        } else if (!asOfDate) {
            var d = new Date();
            displayDate = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
        }

        var customerDetails = getCustomerDetails(customerId);
        var transactions = getTransactions(customerId, asOfDate, division);
        
        // Calculate Totals for XML variables
        var totalDebit = 0, totalCredit = 0, totalOpen = 0;
        var agingDue = 0, aging0 = 0, aging61 = 0, aging91 = 0, aging121 = 0, aging151 = 0, aging180 = 0;

        for (var i = 0; i < transactions.length; i++) {
            var tx = transactions[i];
            totalDebit += tx.debit;
            totalCredit += tx.credit;
            totalOpen += tx.open;

            // Basic Aging Logic
            if (tx.open > 0) {
                agingDue += tx.open;
                if (tx.dueDays <= 60) aging0 += tx.open;
                else if (tx.dueDays <= 90) aging61 += tx.open;
                else if (tx.dueDays <= 120) aging91 += tx.open;
                else if (tx.dueDays <= 150) aging121 += tx.open;
                else if (tx.dueDays <= 180) aging151 += tx.open;
                else aging180 += tx.open;
            }
        }
        
        var data = {
            bpType: 'Customer',
            asOnDate: displayDate,
            division: division ? 'Division Selected' : 'ALL', // You can fetch Division text via query if needed
            basedOn: 'Posting Date',
            
            // Customer Info mapping
            customerName: customerDetails.customerName,
            customerAddress: customerDetails.customerAddress,
            customerPhone: customerDetails.customerPhone,
            customerFax: customerDetails.customerFax,
            salesRep: customerDetails.salesRep,
            currency: customerDetails.currency,
            creditLimit: customerDetails.creditLimit,
            paymentTerms: customerDetails.paymentTerms,
            
            // Transaction & Total mapping
            transactions: transactions,
            totalDebit: format.format({ value: totalDebit, type: format.Type.CURRENCY }),
            totalCredit: format.format({ value: totalCredit, type: format.Type.CURRENCY }),
            totalOpen: format.format({ value: totalOpen, type: format.Type.CURRENCY }),
            totalCumBal: format.format({ value: totalOpen, type: format.Type.CURRENCY }), // End balance
            
            // PDC Mappings (Set your custom logic here to fetch PDCs if you use a custom record)
            pdcs: [], 
            totalPdc: '0.00',
            totalPdcAmt: '0.00',
            pdcOnHand: '0.00',
            
            outstandingBal: format.format({ value: totalOpen, type: format.Type.CURRENCY }),
            netBalance: format.format({ value: totalOpen, type: format.Type.CURRENCY }), // outstanding - PDC
            
            // Aging Mappings
            agingDue: format.format({ value: agingDue, type: format.Type.CURRENCY }),
            agingOnAcct: '0.00',
            agingBal: format.format({ value: agingDue, type: format.Type.CURRENCY }),
            aging180: format.format({ value: aging180, type: format.Type.CURRENCY }),
            aging151: format.format({ value: aging151, type: format.Type.CURRENCY }),
            aging121: format.format({ value: aging121, type: format.Type.CURRENCY }),
            aging91: format.format({ value: aging91, type: format.Type.CURRENCY }),
            aging61: format.format({ value: aging61, type: format.Type.CURRENCY }),
            aging0: format.format({ value: aging0, type: format.Type.CURRENCY }),
            agingPdc: '0.00',
            
            // Bank Details Mapping (Update these with real company setup values)
            bankAcctName: 'SJS ENERSOL LLC',
            bankName: 'Update Bank',
            bankAcctNo: 'Update Acc No',
            bankIban: 'Update IBAN',
            bankBranch: 'Update Branch',
            bankSwift: 'Update Swift',
            
            extraNote: 'This is a system generated statement of account.'
        };
        
        // IMPORTANT: Replace with the actual Internal ID of BP_Outstanding_Report_Template.xml in your File Cabinet
        var xmlFileId = 'REPLACE_WITH_XML_INTERNAL_ID'; 
        var xmlContent = '';
        
        try {
            var xmlFile = file.load({ id: xmlFileId });
            xmlContent = xmlFile.getContents();
        } catch (e) {
            log.error('Template Load Error', e);
            res.write('Error loading XML Template. Please check Suitelet configuration and update xmlFileId.');
            return;
        }
        
        var renderer = render.create();
        renderer.templateContent = xmlContent;
        renderer.addCustomDataSource({
            format: render.DataSource.OBJECT,
            alias: 'customData',
            data: data
        });
        
        var pdfFile = renderer.renderAsPdf();
        res.writeFile({ file: pdfFile, isInline: true });
    }
    
    return { onRequest: onRequest };
});