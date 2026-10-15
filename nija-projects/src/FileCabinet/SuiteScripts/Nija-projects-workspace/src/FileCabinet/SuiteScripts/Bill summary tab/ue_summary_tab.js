/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget'], (serverWidget) => {

    function beforeLoad(context) {

        if (
            context.type !== context.UserEventType.VIEW &&
            context.type !== context.UserEventType.EDIT &&
            context.type !== context.UserEventType.CREATE
        ) {
            return;
        }

        const form = context.form;
        const rec = context.newRecord;

        const userTotal = Number(rec.getValue({
            fieldId: 'usertotal'
        })) || 0;

        const taxTotal = Number(rec.getValue({
            fieldId: 'taxtotal'
        })) || 0;

        const subtotal = userTotal - taxTotal;

        const summaryHtml = `
            <div id="custpage_bill_summary_card" style="
                width: 350px;
                border: 1px solid #d5d9dd;
                border-radius: 6px;
                padding: 20px 25px;
                background: #ffffff;
                font-family: Arial, sans-serif;
                box-sizing: border-box;
                margin-top: 0px;
            ">

                <div style="
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 14px;
                    color: #333333;
                ">
                    Summary
                </div>

                <div style="
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #e5e5e5;
                    font-size: 14px;
                ">
                    <span style="color: #666666;">Subtotal</span>
                    <strong style="color: #111111;">${subtotal.toFixed(2)}</strong>
                </div>

                <div style="
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #e5e5e5;
                    font-size: 14px;
                ">
                    <span style="color: #666666;">Tax Total</span>
                    <strong style="color: #111111;">${taxTotal.toFixed(2)}</strong>
                </div>

                <div style="
                    display: flex;
                    justify-content: space-between;
                    padding-top: 14px;
                    font-size: 18px;
                    font-weight: bold;
                ">
                    <span style="color: #111111;">Total</span>
                    <strong style="color: #111111;">${userTotal.toFixed(2)}</strong>
                </div>

            </div>
            <script type="text/javascript">
                (function() {
                    function moveSummaryCard() {
                        var card = document.getElementById('custpage_bill_summary_card');
                        if (!card) return;

                        var primaryTable = 
                            document.getElementById('tbl_primaryhtml') ||
                            document.getElementById('primaryhtml_fg') ||
                            document.getElementById('div__primaryhtml') ||
                            document.querySelector('table[id*="primary"]') ||
                            document.querySelector('div[id*="primary"]');

                        if (primaryTable) {
                            var firstRow = primaryTable.querySelector('tr');
                            if (firstRow) {
                                if (card.parentNode.tagName === 'TD' && card.parentNode.parentNode === firstRow) {
                                    return;
                                }
                                var newTd = document.createElement('td');
                                newTd.style.verticalAlign = 'top';
                                newTd.style.paddingLeft = '20px';
                                newTd.style.width = '360px';
                                newTd.appendChild(card);
                                firstRow.appendChild(newTd);

                                var oldWrapper = document.getElementById('custpage_bill_summary_val') || 
                                                 document.getElementById('custpage_bill_summary_fs_lbl');
                                if (oldWrapper) oldWrapper.style.display = 'none';
                                return;
                            }
                        }

                        var pageTitle = document.querySelector('.uir-page-title');
                        if (pageTitle && !pageTitle.contains(card)) {
                            card.style.float = 'right';
                            card.style.marginRight = '20px';
                            pageTitle.appendChild(card);
                        }
                    }

                    if (document.readyState === 'complete' || document.readyState === 'interactive') {
                        setTimeout(moveSummaryCard, 100);
                        setTimeout(moveSummaryCard, 400);
                    } else {
                        window.addEventListener('DOMContentLoaded', function() {
                            setTimeout(moveSummaryCard, 100);
                            setTimeout(moveSummaryCard, 400);
                        });
                    }
                })();
            </script>
        `;

        const summaryField = form.addField({
            id: 'custpage_bill_summary',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Summary'
        });

        summaryField.defaultValue = summaryHtml;
    }

    return {
        beforeLoad: beforeLoad
    };
});