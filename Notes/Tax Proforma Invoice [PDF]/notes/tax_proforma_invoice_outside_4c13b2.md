# Documentation for tax_proforma_invoice_outside.xml

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/Notes/Tax Proforma Invoice/tax_proforma_invoice_outside.xml`

**Description:** This Xml has the PDF Design and Content For Outside UAE Template

**Changes :**

**19/08/2026:** Before update Script has mapped with the Description field in the sales order now it is changed to custom field "custcol_njt_podesc" - Description From Po.

**20/08/2026:** 
- Filtered line items in FreeMarker pagination to only render lines with amount > 0.
- Implemented a safety check to generate a dummy item with "isDummy": true if no billable lines are present, preventing PDF rendering engine crashes.
- Wrapped numeric and serial number cells in a check to print completely blank cells for the dummy fallback row.
- Added a fallback to item.description for the DESCRIPTION column if custcol_njt_podesc is empty.

**Code Changes:**
*Pagination Block:*
```xml
<!-- PAGINATION LOGIC: 10 ITEMS PER PAGE -->
<#assign filteredItems = [] />
<#list record.item as item>
    <#if item.amount?has_content>
        <#if (item.amount > 0)>
            <#assign filteredItems = filteredItems + [item] />
        </#if>
    </#if>
</#list>
<#if filteredItems?size == 0>
    <#assign filteredItems = [ { "custcol_njt_podesc": "", "description": "", "units": "", "quantity": 0, "rate": 0, "amount": 0, "tax1amt": 0, "grossamt": 0, "isDummy": true } ] />
</#if>
<#list filteredItems?chunk(10) as itemBatch>
```

*Table Row Block:*
```xml
        <#list itemBatch as item>
        <tr>
            <td align="center"><#if !(item.isDummy??)>${item_index + 1 + (itemBatch?index * 10)}</#if></td>
            <td align="left"><#if item.custcol_njt_podesc?has_content>${item.custcol_njt_podesc}<#else>${item.description}</#if></td>
            <td align="center">${item.units}</td>
            <td align="right"><#if !(item.isDummy??)>${item.quantity?string("0.00")}</#if></td>
            <td align="right"><#if !(item.isDummy??)>${item.rate?string("#,##0.00")}</#if></td>
            <!-- <td align="right">${item.amount?string("#,##0.00")}</td>
            <td align="right">${item.tax1amt?string("#,##0.00")}</td> -->
            <td align="right"><#if !(item.isDummy??)>${item.grossamt?string("#,##0.00")}</#if></td>
        </tr>
        </#list>
```
**Suitelet File:** [[tax_proforma_invoice_outside_sl.js]]