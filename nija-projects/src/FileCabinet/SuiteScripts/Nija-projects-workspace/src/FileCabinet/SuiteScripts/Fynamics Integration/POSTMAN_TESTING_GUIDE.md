# Postman Testing Guide for Fynamics API (KSA ZATCA)

You can test both the **Authentication** and **Generate UUID (E-Invoice)** endpoints in Postman using the specifications below, or by importing the pre-configured collection:
👉 [`Fynamics_EInvoice_Postman_Collection.json`](file:///c:/Users/EDWIN/Documents/Nija%20Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/Fynamics%20Integration/Fynamics_EInvoice_Postman_Collection.json)

---

## Request 1: Get Access Token (Authentication)

### Request Details
* **Method**: `POST`
* **URL**: `https://sandbox-ksa.fynamicstax.com/api/partner/auth/authenticate`

### Authorization Tab
* **Type**: `Basic Auth`
* **Username**: `api-2e09338c-7819-4164-aab0-c8bf96f0e78a`
* **Password**: `VvtPSpGZFTYrTZhW2PqJfQXxg6zUai7A`

*(Or in Headers tab: `Authorization: Basic YXBpLTJlMDkzMzhjLTc4MTktNDE2NC1hYWIwLWM4YmY5NmYwZTc4YTpWdnRQU3BHWkZUWXJUWmhXMlBxSmZRWHhnNnpVYWk3QQ==`)*

### Headers Tab
| Key | Value |
| :--- | :--- |
| `Content-Type` | `application/x-www-form-urlencoded` |

### Body Tab (`x-www-form-urlencoded`)
| Key | Value |
| :--- | :--- |
| `grant_type` | `client_credentials` |
| `scope` | `read write` |

### Expected Response (HTTP 200)
```json
{
  "success": 1,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```
> Copy the returned `access_token` for Request 2 below.

---

## Request 2: Generate UUID (E-Invoice Submission)

### Request Details
* **Method**: `POST`
* **URL**: `https://sandbox-ksa.fynamicstax.com/api/partner/ksaapi/generate_uuid`

### Authorization Tab
* **Type**: `Bearer Token`
* **Token**: Paste the `access_token` from Request 1.

### Headers Tab
| Key | Value |
| :--- | :--- |
| `accept_language` | `en` |
| `Content-Type` | `application/json` |

### Body Tab (`raw` > `JSON`)
```json
{
  "docs": {
    "invoice": {
      "doc_counter_val": "1",
      "doc_no": "InvSample002",
      "doc_date": "2026-05-13",
      "doc_time": "11:10:00",
      "doc_type_code": "388",
      "doc_type_trans": "0100010",
      "doc_cur": "SAR",
      "doc_tax_cur": "SAR"
    },
    "supplierparty": {
      "seller_reg_type": "CRN",
      "seller_other_id": "2055004471",
      "seller_adrs_line1": "Road 120",
      "seller_adrs_line2": "Jubail Industrial City",
      "seller_bldg_number": "0223",
      "seller_adrs_number": "11111",
      "seller_city": "Al Jubail",
      "seller_postal_code": "11111",
      "seller_state": "Eastern Province",
      "seller_district": "Al Jubail",
      "seller_country_code": "SA",
      "seller_vat_number": "314414679700003",
      "seller_name": "SJS ENERSOL COM",
      "seller_email": "sedres@sedres.com",
      "seller_phone": "0532024948"
    },
    "customerparty": {
      "other_reg_type": "OTH",
      "other_buyer_id": "3116215961",
      "buyer_adrs_line1": "Sagarpur",
      "buyer_adrs_line2": "Janakpuri",
      "buyer_bldg_number": "1452",
      "buyer_adrs_number": "3rd cross",
      "buyer_city": "Bangalore",
      "buyer_country_code": "IN",
      "buyer_district": "Delhi",
      "buyer_postal_code": "110046",
      "buyer_state": "New Delhi",
      "buyer_vat_number": "311621596100003",
      "buyer_name": "CASH MASTER - CASH SALES",
      "buyer_email": "zain@yopmail.com",
      "buyer_phone": "+918851326523"
    },
    "invoice_level_charges": {
      "doc_adv_paid_cur": "SAR",
      "doc_adv_paid_with_vat_amt": "0.00",
      "doc_charge_sum_cur": "SAR",
      "doc_charge_sum": "61.81",
      "doc_net_cur": "SAR",
      "doc_net_amt_bfr_vat": "53.75",
      "doc_net_dis_cur": "SAR",
      "doc_net_dis_amt": "0.00",
      "doc_outstanding_cur": "SAR",
      "doc_outstanding_amt": "61.81",
      "doc_rounding_cur": "SAR",
      "doc_rounding_amt": "0.000000",
      "doc_ttl_wo_vat_cur": "SAR",
      "doc_ttl_wo_vat_amt": "53.75",
      "doc_ttl_with_vat_cur": "SAR",
      "doc_ttl_with_vat_amt": "61.81",
      "doc_ttl_vat_acct_cur": "SAR",
      "doc_ttl_vat_acct_amt": "61.81",
      "doc_ttl_vat_cur": "SAR",
      "doc_ttl_vat_amt": "8.06",
      "vat_ctg_code": "S",
      "vat_ctg_rate": "15.00",
      "vat_ctg_tax_cur": "SAR",
      "vat_ctg_tax_amt": "8.06",
      "vat_ctg_taxable_cur": "SAR",
      "vat_ctg_taxable_amt": "53.75",
      "vat_exmp_reason_code": "",
      "vat_exmp_reason_text": "",
      "reason_doc_alwc_code": "95",
      "reason_doc_alwc": "discount",
      "reason_doc_charge_code": "CG",
      "reason_doc_charge": "Cleaning",
      "doc_alwc_cur": "SAR",
      "doc_alwc_amt": "0.00",
      "doc_alwc_base_amt": "0.00",
      "doc_alwc_base_cur": "SAR",
      "doc_alwc_indicator": false,
      "doc_alwc_percent": "0.00",
      "doc_alwc_vat_ctg": "S",
      "doc_alwc_vat_rate": "15.00",
      "doc_charge_cur": "SAR",
      "doc_charge_amt": "0.00",
      "doc_charge_base_cur": "SAR",
      "doc_charge_base_amt": "53.75",
      "doc_charge_indicator": true,
      "doc_charge_percent": "15.00",
      "doc_charge_vat_ctg": "S",
      "doc_charge_vat_rate": "15.00"
    },
    "invoiceadditionaldocument": {
      "purchase_order_id": "1073149",
      "contract_id": "161313031",
      "doc_payment_account": "SA000000000000001",
      "doc_payment_terms": "Payment by credit",
      "doc_supply_date": "2026-04-09",
      "doc_supply_end_date": "2026-04-09",
      "doc_inv_notes": "Invoice notes"
    },
    "item": [
      {
        "line_id": "1",
        "line_quantity": "1.00",
        "line_unit": "BAG",
        "line_vat_amt": "8.06",
        "line_vat_cur": "SAR",
        "item_identity_by_buyer": "CH000532",
        "item_identity_by_seller": "CH000532",
        "item_name": "Rice Basmati Taj Mahal 10Kgs",
        "item_grs_price_cur": "SAR",
        "item_grs_price_bfr_vat_bfr_dis": "53.75",
        "item_net_price_cur": "SAR",
        "item_net_price_aft_dis_bfr_vat": "53.75",
        "item_price_alwc_indicator": false,
        "item_price_base_qty": "1",
        "item_price_base_unit": "BAG",
        "item_price_dis_cur": "SAR",
        "item_price_dis_amt": "0.000000",
        "item_std_identity": "",
        "item_vat_ctg_code": "S",
        "item_vat_rate": "15.00",
        "item_line_alwc_cur": "SAR",
        "item_line_alwc_amt": "0.00",
        "item_line_alwc_base_amt": "0.00",
        "item_line_alwc_base_cur": "SAR",
        "item_line_alwc_indicator": false,
        "item_line_alwc_percentage": "0.000000",
        "item_line_alwc_reason_charge_code": "95",
        "item_line_alwc_reason_charge": "Discount",
        "item_line_charge_cur": "SAR",
        "item_line_charge_amt": "0.00",
        "item_line_charge_base_cur": "SAR",
        "item_line_charge_base_amt": "53.750000",
        "item_line_charge_indicator": false,
        "item_line_charge_percent": "0.00",
        "item_line_charge_reason_code": "CG",
        "item_line_charge_reason": "Cleaning",
        "item_line_incl_vat_cur": "SAR",
        "item_line_incl_vat_amt": "61.81",
        "item_line_net_cur_incl_alwc": "SAR",
        "item_line_net_amt_incl_alwc": "53.75"
      }
    ],
    "payment_type": [
      {
        "payment_type_code": "30",
        "reasons_for_issuance": "partially"
      }
    ],
    "billing_reference": [
      {
        "billing_reference_id": "166166151"
      }
    ],
    "prepayment_details": {
      "prepayment_doc_type_code": "",
      "prepayment_id": "",
      "prepayment_issue_date": "",
      "prepayment_issue_time": "",
      "prepayment_uuid": "",
      "prepayment_vat_ctg": "",
      "prepayment_vat_rate": "",
      "prepayment_vat_tax_cur": "",
      "prepayment_vat_tax_amt": "",
      "prepayment_vat_taxable_cur": "",
      "prepayment_vat_taxable_amt": ""
    }
  }
}
```

### Expected Response (HTTP 200 - Successful Clearance)
```json
{
  "invoiceHash": "k/Ha2M/3TOmBRDSAhQBoDF9Sn2iT/QGZJYJi8aGImLg=",
  "status": "CLEARED",
  "warnings": [],
  "errors": null,
  "qr_code": "AQ9TSlMgRU5FUlNPTCBDT00CDzMxNDQxNDY3OTcwMDAwMwMTMjAyNi0wNS0xM1QxMToxMDowMAQGMjU5LjYxBQUzMy44NgYsay9IYTJNLzNUT21CUkRTQWhRQm9ERjlTbjJpVC9RR1pKWUppOGFHSW1MZz0HYE1FVUNJQWdxMVY2R0J6d3h2OU05QkNVcHR2QnJmbGR2S094SmFBd2l1Y2N3Z3lQYUFpRUFnMHI2b0ttUDEzMkNqTkwvaFVZK3dkcEY1T0ZIbzFySThab2Z4eGNKQ0hFPQhYMFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEFQ0ytf10ebwyZBn7jMPZVrIsdjd8T+rqVro/uHeyAcXPLe3ueLcsIkLyC6wWJVmwtZotZQ9bFLF92n6/ZmdFRA==",
  "uuid": "d8412e9a-e385-4363-adf3-fcc9777f6fc0",
  "print_url": "https://sandbox-ksa.fynamicstax.com/api/partner/sales-invoice/download-print/NjMxMQ"
}
```

---

## 3. How to Import the Pre-built Collection in Postman
1. Open **Postman**.
2. Click **Import** (top left).
3. Select [`Fynamics_EInvoice_Postman_Collection.json`](file:///c:/Users/EDWIN/Documents/Nija%20Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/Fynamics%20Integration/Fynamics_EInvoice_Postman_Collection.json).
4. Run request **"1. Get OAuth Access Token"** — it stores the `access_token` automatically.
5. Run request **"2. Generate UUID (E-Invoice)"** — it uses that Bearer token to submit the payload.
