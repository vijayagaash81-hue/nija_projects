/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@NModuleScope Public
 */
 define(['N/search', 'N/query', 'N/format', 'N/record', 'N/currentRecord', 'N/url', './moment.js', 'N/runtime'],
    function (search, query, format, record, currentRecord, url, moment, runtime) {
    
    function pageInit_open_window() {
        debugger;
        let rec = currentRecord.get();
        let openwindow = rec.getValue({ fieldId: 'custpage_triggerredirect' });
        
        log.debug({ title: 'openwindow', details: openwindow });
        
        if (openwindow === 'open') {
            window.open('https://2772245.app.netsuite.com/app/common/custom/custrecordentrylist.nl?rectype=894', '_self');
        }
    }
    
    function PullbackLeave(LeaveRecID) {
        let createURL = url.resolveScript({
            scriptId: 'customscript_hris_lve_pullbkwindow_sl',
            deploymentId: 'customdeploy_hris_lve_pullbkwindow_sl',
            params: { leavid: LeaveRecID }
        });
        
        window.open(createURL, '_self');
    }
    
    return {
        pageInit: pageInit_open_window,
        PullbackLeave: PullbackLeave
    };
});
