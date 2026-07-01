/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/url'], (currentRecord, url) => {

    const getMappingsParam = () => {
        return window.approvalFieldMappings ? JSON.stringify(window.approvalFieldMappings) : '';
    };

    const pageInit = (context) => {

    };

    const approvePO = () => {

        const rec = currentRecord.get();

        const suiteletUrl = url.resolveScript({
            scriptId: 'customscript_approval_engine_sl',
            deploymentId: 'customdeploy_approval_engine_sl',
            params: {
                action: 'approve',
                recordtype: rec.type,
                recordid: rec.id,
                mappings: getMappingsParam()
            }
        });

        window.location.href = suiteletUrl;

    };

    const rejectPO = () => {

        showRejectModal();

    };
    function showRejectModal() {

        if (document.getElementById('approvalRejectModal')) {
            return;
        }

        var html =
            '<div id="approvalRejectModal" style="' +
            'position:fixed;' +
            'top:0;' +
            'left:0;' +
            'width:100%;' +
            'height:100%;' +
            'background:rgba(0,0,0,0.35);' +
            'z-index:99999;' +
            'display:flex;' +
            'justify-content:center;' +
            'align-items:center;">' +

            '<div style="' +
            'background:white;' +
            'width:550px;' +
            'border-radius:8px;' +
            'box-shadow:0 8px 30px rgba(0,0,0,.25);' +
            'overflow:hidden;' +
            'font-family:Arial,sans-serif;">' +

            '<div style="' +
            'background:#e5edf5;' +
            'padding:12px 18px;' +
            'font-size:16px;' +
            'font-weight:bold;' +
            'border-bottom:1px solid #cfd8e3;">' +
            'Reject Transaction' +
            '</div>' +

            '<div style="padding:20px;">' +

            '<div style="' +
            'font-size:13px;' +
            'font-weight:bold;' +
            'margin-bottom:8px;">' +
            'Rejection Reason' +
            '</div>' +

            '<textarea id="rejectReason" style="' +
            'width:100%;' +
            'height:140px;' +
            'resize:none;' +
            'padding:10px;' +
            'border:1px solid #b8c2cc;' +
            'border-radius:4px;' +
            'font-size:13px;' +
            'box-sizing:border-box;"></textarea>' +

            '<div style="' +
            'margin-top:20px;' +
            'text-align:right;">' +

            '<button id="cancelRejectBtn" style="' +
            'margin-right:8px;' +
            'padding:8px 16px;' +
            'cursor:pointer;">' +
            'Cancel' +
            '</button>' +

            '<button id="submitRejectBtn" style="' +
            'background:#d9534f;' +
            'color:white;' +
            'border:none;' +
            'padding:8px 18px;' +
            'border-radius:4px;' +
            'cursor:pointer;' +
            'font-weight:bold;">' +
            'Reject' +
            '</button>' +

            '</div>' +

            '</div>' +

            '</div>' +

            '</div>';

        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('cancelRejectBtn').onclick = function () {
            document.getElementById('approvalRejectModal').remove();
        };

        document.getElementById('submitRejectBtn').onclick = submitReject;
    }
    function submitReject() {

        var reason =
            document.getElementById(
                'rejectReason'
            ).value;

        if (!reason || reason.trim() === '') {

            alert(
                'Rejection reason is mandatory.'
            );

            return;
        }

        const rec = currentRecord.get();

        const suiteletUrl = url.resolveScript({
            scriptId: 'customscript_approval_engine_sl',
            deploymentId: 'customdeploy_approval_engine_sl',
            params: {
                action: 'reject',
                recordtype: rec.type,
                recordid: rec.id,
                reason: reason,
                mappings: getMappingsParam()
            }
        });

        window.location.href = suiteletUrl;
    }
    function submitForApproval() {

        const rec = currentRecord.get();

        const suiteletUrl = url.resolveScript({
            scriptId: 'customscript_approval_engine_sl',
            deploymentId: 'customdeploy_approval_engine_sl',
            params: {
                action: 'submit',
                recordtype: rec.type,
                recordid: rec.id,
                mappings: getMappingsParam()
            }
        });

        window.location.href = suiteletUrl;
    }
    return {
        pageInit: pageInit,
        approvePO: approvePO,
        rejectPO: rejectPO,
        submitForApproval: submitForApproval
    };

});