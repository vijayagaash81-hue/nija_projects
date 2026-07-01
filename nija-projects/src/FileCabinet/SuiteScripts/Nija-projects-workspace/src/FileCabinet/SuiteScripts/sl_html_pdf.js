/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([], function () {

    function onRequest(context) {

        var html = `
        <html>
        <head>
            <style>
                @page {
                    size: A4;
                    margin: 10mm;
                }

                body {
                    font-family: 'Segoe UI', sans-serif;
                    background: #f5f5f5;
                }

                .invoice {
                    width: 800px;
                    margin: auto;
                    background: #fdf6e3;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                }

                /* HEADER */
                .header {
                    background: #111;
                    color: white;
                    padding: 30px;
                }

                .header h1 {
                    margin: 0;
                    font-size: 40px;
                }

                /* CUSTOMER SECTION */
                .top-section {
                    background: linear-gradient(90deg, #f97316, #facc15);
                    padding: 20px;
                    display: flex;
                    justify-content: space-between;
                    border-radius: 0 0 20px 20px;
                }

                .top-left h2 {
                    margin: 5px 0;
                }

                .amount-box {
                    background: #fff;
                    padding: 15px;
                    border-radius: 10px;
                    font-weight: bold;
                }

                /* TABLE */
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }

                th {
                    background: #333;
                    color: white;
                    padding: 10px;
                    font-size: 14px;
                }

                td {
                    padding: 10px;
                    text-align: center;
                    border-bottom: 1px solid #ddd;
                }

                .content {
                    padding: 20px;
                }

                /* FOOTER */
                .footer {
                    display: flex;
                    justify-content: space-between;
                    padding: 20px;
                }

                .box {
                    background: #f97316;
                    padding: 15px;
                    border-radius: 10px;
                    width: 45%;
                    color: white;
                }

                .box.yellow {
                    background: #facc15;
                    color: black;
                }

                /* PRINT */
                @media print {
                    body {
                        background: none;
                    }
                }
            </style>
        </head>

        <body size="A4">

            <div class="invoice">

                <!-- HEADER -->
                <div class="header">
                    <h1>Invoice</h1>
                </div>

                <!-- CUSTOMER -->
                <div class="top-section">
                    <div class="top-left">
                        <p>Invoice To</p>
                        <h2>Vijay</h2>
                        <p>Chennai, India</p>
                    </div>

                    <div>
                        <p><b>Invoice No:</b> INV-001</p>
                        <p><b>Date:</b> ${new Date().toLocaleDateString()}</p>
                        <div class="amount-box">₹420.00</div>
                    </div>
                </div>

                <!-- TABLE -->
                <div class="content">
                    <table>
                        <tr>
                            <th>Item</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th>Total</th>
                        </tr>

                        <tr>
                            <td>T-Shirt</td>
                            <td>₹500</td>
                            <td>1</td>
                            <td>₹500</td>
                        </tr>

                        <tr>
                            <td>Jacket</td>
                            <td>₹1500</td>
                            <td>1</td>
                            <td>₹1500</td>
                        </tr>

                        <tr>
                            <td>Shoes</td>
                            <td>₹2000</td>
                            <td>1</td>
                            <td>₹2000</td>
                        </tr>
                    </table>

                    <h3 style="text-align:right; margin-top:20px;">
                        Sub Total: ₹4000
                    </h3>
                </div>

                <!-- FOOTER -->
                <div class="footer">
                    <div class="box">
                        <b>Terms & Conditions</b>
                        <p>Payment due within 7 days.</p>
                    </div>

                    <div class="box yellow">
                        <b>Contact</b>
                        <p>Email: test@email.com</p>
                        <p>Phone: 9876543210</p>
                    </div>
                </div>

            </div>

            <script>
                window.onload = function() {
                    window.print();
                }
            </script>

        </body>
        </html>
        `;

        context.response.write(html);
    }

    return {
        onRequest: onRequest
    };

});