/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], () => {

    function pageInit(){}


    function openChildSO(url) {
        window.open(url, '_self');
    }

    return {
        openChildSO,
        pageInit
    };
});