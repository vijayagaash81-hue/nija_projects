/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/render', 'N/file'], (render, file) => {

    const onRequest = (context) => {

        if (context.request.method === 'GET') {

            try {

                // ==============================
                // XML TEMPLATE
                // ==============================
                let xmlStr = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>

<head>

<style type="text/css">

    *{
        font-family: Helvetica;
    }

    body{
        font-size:10pt;
    }

    p {
        margin: 0;
        padding: 0;
    }

    .company{
        font-size:15pt;
        font-weight:bold;
        text-align:center;
        padding-bottom: 10px;
    }

    .memo{
        font-size:13pt;
        font-weight:bold;
        text-align:center;
    }

    .bold{
        font-weight:bold;
    }

    .small{
        font-size:8pt;
    }

    .historytable{
        border:1px solid black;
        border-collapse:collapse;
    }

    .historytable td{
        border:1px solid black;
        padding:6px;
    }

    .gray{
        background-color:#bdbdbd;
        text-align:center;
        font-weight:bold;
    }

    .content{
        line-height:18px;
        font-size:11pt;
        text-align:justify;
    }

    .content p {
        margin-bottom: 15px;
    }

    .line{
        border-top:1px solid black;
    }

    .signature{
        border-top:1px solid black;
        width:180px;
        margin-top: 30px;
        margin-bottom: 5px;
    }

    .controlled{
        color:#bfbfbf;
        font-size:36pt;
        font-weight:bold;
    }

</style>

<macrolist>
<macro id="nlfooter">
<table width="100%">

<tr>

<td width="60%" valign="top">

<p>For,</p>

<p class="bold" style="margin-top: 10px;">Al Najma Al Fareeda Int&apos;l Group</p>

<div class="signature"></div>

<p>(Human Resources Department)</p>

<p class="bold" style="margin-top: 10px;">Read and Accepted by</p>

<p class="small" style="margin-top: 10px;">Cc: Employee File/HOD/Accounts/GOM/CEO/MD</p>

<p class="small" style="margin-top: 10px;">Document Code: HRD/HR40/2024</p>

<p class="small">Issue No. 3</p>

<p class="small">Effective date 07.11.2024</p>

<p style="font-size:16pt; margin-top: 20px;">0501978341</p>

</td>

<td width="40%" align="center" valign="bottom">

<p class="controlled">CONTROLLED</p>

</td>

</tr>

</table>
</macro>
</macrolist>
</head>

<body size="A4" padding="25" footer="nlfooter" footer-height="250px">

<!-- TOP HEADER -->

<table width="100%">

<tr>

<td width="15%" valign="top">
&nbsp;
</td>

<td width="70%" align="center">

<p class="company">
Al Najma Al Fareeda Bldg. Cleaning &amp; Pest Control
</p>

<p class="memo">
DISCIPLINARY MEMO(HR40)
</p>

</td>

<td width="15%">&nbsp;</td>

</tr>

</table>

<br/><br/>

<!-- DETAILS -->

<table width="100%">

<tr>

<td width="55%" valign="top">

<table width="100%">

<tr>
<td width="25%" class="bold">Date :</td>
<td>13/05/2026</td>
</tr>

<tr>
<td class="bold">To :</td>
<td>EM60006</td>
</tr>

<tr>
<td>&nbsp;</td>
<td class="bold">RAMESH JAISI</td>
</tr>

<tr>
<td class="bold">Sub:</td>
<td>Overstay Memo</td>
</tr>

<tr>
<td class="bold">Disciplinary Memo Type :</td>
<td>&nbsp;</td>
</tr>

</table>

</td>

<!-- RIGHT TABLE -->

<td width="45%" valign="top">

<div style="margin-bottom: 8px;"><span class="bold">Ref No :</span> C/DS260004</div>

<table width="100%" class="historytable">

<tr>
<td colspan="2" class="gray" align="center" style="text-decoration: underline;">
Violation History
</td>
</tr>

<tr>
<td>
No of issued Memo&apos;s in the year:
</td>

<td align="center">
0
</td>
</tr>

<tr>
<td>
No of current code violation in the
</td>

<td align="center">
0
</td>
</tr>

<tr>
<td>
Total Black Points in the year:
</td>

<td>&nbsp;</td>
</tr>

</table>

</td>

</tr>

</table>

<!-- VIOLATION -->

<table width="100%" style="border-bottom: 1px solid black;">

<tr>

<td class="bold" style="padding-bottom: 10px;">
Violation Code No :
</td>

</tr>

</table>

<br/><br/>

<!-- MAIN CONTENT -->

<div class="content">

<p>It has been observed that you have failed to report to the duty on the agreed date after your ANNUAL
LEAVE completion which was approved from 18-02-2026 to 18-04-2026. You have reported to duty
on 12-05-2026 with 24 days&apos; delay in joining. This is not at all acceptable to the management and HR
as it is against our policy.</p>

<p>As a result of this noncompliance, you shall be liable to pay a fine amount of AED 300 which will be
deducted from your next salary.</p>

<p>Henceforth HRD Strictly instructs you to adhere to our company leaves policy.</p>

</div>

</body>
</pdf>`;

                // ==============================
                // GENERATE PDF
                // ==============================
                let pdfFile = render.xmlToPdf({
                    xmlString: xmlStr
                });

                // ==============================
                // RESPONSE
                // ==============================
                context.response.writeFile({
                    file: pdfFile,
                    isInline: true
                });

            } catch (e) {

                log.error({
                    title: 'PDF ERROR',
                    details: e
                });

                context.response.write(
                    'Error : ' + JSON.stringify(e)
                );
            }
        }
    };

    return {
        onRequest
    };

});