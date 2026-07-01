/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/query', 'N/render', 'N/file', 'N/record', 'N/format', 'N/log'], function(serverWidget, query, render, file, record, format, log) {
    
    function onRequest(context) {
        var req = context.request;
        var res = context.response;
        var action = req.parameters.action;
        
        if (action === 'print') {
            generatePdf(req, res);
        } else {
            renderForm(req, res);
        }
    }
    
    function renderForm(req, res) {
        // Extract parameters first to prevent undefined variable scoping
        var paramType = req.parameters.custpage_type || 'AR';
        var paramSub = req.parameters.custpage_subsidiary;
        var paramEntity = req.parameters.custpage_entity;
        var paramFromDate = req.parameters.custpage_from_date;
        var paramToDate = req.parameters.custpage_to_date;

        var form = serverWidget.createForm({ title: 'Statement of Account (SOA)' });
        
        // Link to the Client Script for the Print button logic
        form.clientScriptModulePath = './Report/statement_of_account_cs.js'; 

        // Add filter fields
        var typeFld = form.addField({ id: 'custpage_type', type: serverWidget.FieldType.SELECT, label: 'Type' });
        typeFld.addSelectOption({ value: 'AR', text: 'Accounts Receivable (Customer)' });
        typeFld.addSelectOption({ value: 'AP', text: 'Accounts Payable (Vendor)' });
        
        var subFld = form.addField({ id: 'custpage_subsidiary', type: serverWidget.FieldType.SELECT, label: 'Subsidiary', source: 'subsidiary' });
        var entitySource = (paramType === 'AR') ? 'customer' : 'vendor';
        var entityFld = form.addField({ id: 'custpage_entity', type: serverWidget.FieldType.SELECT, label: 'Customer/Vendor', source: entitySource });
        
        var fromDateFld = form.addField({ id: 'custpage_from_date', type: serverWidget.FieldType.DATE, label: 'From Date' });
        var toDateFld = form.addField({ id: 'custpage_to_date', type: serverWidget.FieldType.DATE, label: 'To Date' });
        
        form.addSubmitButton({ label: 'Search' });
        form.addButton({ id: 'custpage_print_btn', label: 'Print PDF', functionName: 'printPdf()' });
        
        typeFld.defaultValue = paramType;
        if (paramSub) subFld.defaultValue = paramSub;
        if (paramEntity) entityFld.defaultValue = paramEntity;
        if (paramFromDate) fromDateFld.defaultValue = paramFromDate;
        if (paramToDate) toDateFld.defaultValue = paramToDate;
        
        // Create Results Sublist
        var sublist = form.addSublist({ id: 'custpage_soa_list', type: serverWidget.SublistType.LIST, label: 'Transactions' });
        sublist.addField({ id: 'custpage_col_date', type: serverWidget.FieldType.TEXT, label: 'Date' });
        sublist.addField({ id: 'custpage_col_type', type: serverWidget.FieldType.TEXT, label: 'Type' });
        sublist.addField({ id: 'custpage_col_doc', type: serverWidget.FieldType.TEXT, label: 'Document Number' });
        sublist.addField({ id: 'custpage_col_memo', type: serverWidget.FieldType.TEXT, label: 'Memo' });
        sublist.addField({ id: 'custpage_col_debit', type: serverWidget.FieldType.CURRENCY, label: 'Debit' });
        sublist.addField({ id: 'custpage_col_credit', type: serverWidget.FieldType.CURRENCY, label: 'Credit' });
        sublist.addField({ id: 'custpage_col_balance', type: serverWidget.FieldType.CURRENCY, label: 'Balance' });
        
        if (req.method === 'POST' && paramEntity) {
            populateSublist(sublist, paramType, paramSub, paramEntity, paramFromDate, paramToDate);
        }
        
        res.writePage(form);
    }
    
    function populateSublist(sublist, type, subsidiary, entity, fromDate, toDate) {
        var results = getTransactions(type, subsidiary, entity, fromDate, toDate);
        log.debug('SOA Results Count', results.length);
        
        var runningBalance = 0;
        for (var i = 0; i < results.length; i++) {
            var row = results[i];
            
            var debit = parseFloat(row.debit) || 0;
            var credit = parseFloat(row.credit) || 0;
            
            if (type === 'AR') {
                runningBalance += (debit - credit);
            } else {
                runningBalance += (credit - debit);
            }
            
            sublist.setSublistValue({ id: 'custpage_col_date', line: i, value: row.trandate || ' ' });
            sublist.setSublistValue({ id: 'custpage_col_type', line: i, value: row.type || ' ' });
            sublist.setSublistValue({ id: 'custpage_col_doc', line: i, value: row.tranid || ' ' });
            sublist.setSublistValue({ id: 'custpage_col_memo', line: i, value: row.memo || ' ' });
            sublist.setSublistValue({ id: 'custpage_col_debit', line: i, value: debit });
            sublist.setSublistValue({ id: 'custpage_col_credit', line: i, value: credit });
            sublist.setSublistValue({ id: 'custpage_col_balance', line: i, value: runningBalance });
        }
    }
    
    function getTransactions(type, subsidiary, entity, fromDate, toDate) {
        var accountType = (type === 'AR') ? 'AcctRec' : 'AcctPay';
        
        var sql = "SELECT TO_CHAR(t.trandate, 'DD/MM/YYYY') AS trandate, BUILTIN.DF(t.type) AS type, t.tranid, tl.memo, " +
                  "NVL(tal.debit, 0) AS debit, NVL(tal.credit, 0) AS credit " +
                  "FROM transaction t " +
                  "JOIN transactionline tl ON t.id = tl.transaction " +
                  "JOIN transactionaccountingline tal ON tl.transaction = tal.transaction AND tl.id = tal.transactionline " +
                  "JOIN account a ON tal.account = a.id " +
                  "WHERE a.accttype = ? AND NVL(tl.entity, t.entity) = ? AND t.posting = 'T' ";
                  
        var params = [accountType, parseInt(entity, 10)];
        
        if (subsidiary) {
            sql += " AND tl.subsidiary = ? ";
            params.push(parseInt(subsidiary, 10));
        }
        
        if (fromDate) {
            sql += " AND t.trandate >= TO_DATE(?, 'YYYY-MM-DD') ";
            params.push(parseDateForSuiteQL(fromDate));
        }
        
        if (toDate) {
            sql += " AND t.trandate <= TO_DATE(?, 'YYYY-MM-DD') ";
            params.push(parseDateForSuiteQL(toDate));
        }
        
        sql += " ORDER BY t.trandate, t.id";
        
        return query.runSuiteQL({ query: sql, params: params }).asMappedResults();
    }
    
    function parseDateForSuiteQL(dateString) {
        if (!dateString) return null;
        var parsedDate = format.parse({ value: dateString, type: format.Type.DATE });
        var yyyy = parsedDate.getFullYear();
        var mm = ('0' + (parsedDate.getMonth() + 1)).slice(-2);
        var dd = ('0' + parsedDate.getDate()).slice(-2);
        return yyyy + '-' + mm + '-' + dd;
    }
    
    function generatePdf(req, res) {
        var type = req.parameters.custpage_type;
        var subsidiary = req.parameters.custpage_subsidiary;
        var entity = req.parameters.custpage_entity;
        var fromDate = req.parameters.custpage_from_date;
        var toDate = req.parameters.custpage_to_date;
        
        var results = getTransactions(type, subsidiary, entity, fromDate, toDate);
        
        var runningBalance = 0;
        for (var i = 0; i < results.length; i++) {
            var debit = parseFloat(results[i].debit) || 0;
            var credit = parseFloat(results[i].credit) || 0;
            
            if (type === 'AR') {
                runningBalance += (debit - credit);
            } else {
                runningBalance += (credit - debit);
            }
            results[i].debit = debit;
            results[i].credit = credit;
            results[i].balance = runningBalance;
        }
        
        var entityName = '';
        if (entity) {
            try {
                var lookupFields = query.runSuiteQL({query: "SELECT altname FROM entity WHERE id = ?", params: [entity]}).asMappedResults();
                if (lookupFields.length > 0) {
                    entityName = lookupFields[0].altname || '';
                }
            } catch(e) {}
        }
        
        var data = {
            title: (type === 'AR') ? 'Customer Statement of Account' : 'Vendor Statement of Account',
            entityName: entityName,
            fromDate: fromDate || 'Beginning',
            toDate: toDate || 'Today',
            transactions: results
        };
        
        // IMPORTANT: Replace 'XML_FILE_INTERNAL_ID' with the actual File Cabinet internal ID of your XML Template.
        var xmlFileId = 'XML_FILE_INTERNAL_ID'; 
        var xmlContent = '';
        
        try {
            var xmlFile = file.load({ id: xmlFileId });
            xmlContent = xmlFile.getContents();
        } catch (e) {
            log.error('Template Load Error', 'Could not load XML file. Ensure you replace "XML_FILE_INTERNAL_ID" with the correct internal ID from your File Cabinet.');
            res.write('Error loading XML Template. Please check Suitelet configuration.');
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