# Documentation for letter req salary certificate sl.js

**Original Path:** `C:/Users/EDWIN/Documents/Nija Projects/nija-projects/src/FileCabinet/SuiteScripts/Nija-projects-workspace/src/FileCabinet/SuiteScripts/ELV8_Templates/letter req salary certificate sl.js`

**Description:** Suitelet script to generate dynamic PDF certificates (Offer Letter, Salary Certificate, Experience Letter, Salary Transfer Letter) from HR Letter Request and Employee records.

---

## Log of Changes & Implementation Notes

### 30/09/2026:
- **Salary Transfer Letter Enhancement (`certType = '5'`)**:
  - Added support for `certType === '5'` to handle **Salary Transfer Letter** PDF generation.
  - Dynamically fetched employee bank account details (`custentity_hris_emp_bankaccno`) and IBAN / Routing number (`custentity_hris_empbankibanacctno` / `custentity_hris_empbankroutingno`).
  - Added dynamic calculation of effective date (`effectiveDate`) based on the letter request date (`custrecord_hris_letreq_request_date_cre`).
  - Integrated the standard Salary Transfer Letter PDF layout from `letter req salary transfer sl.js` with dynamic placeholders for employee legal name, passport details, position, total remuneration, bank account, IBAN, subsidiary company name, contact info, and signatory block.
  - Added template placeholder replacement support (`{{account_no}}`, `{{iban_no}}`, `{{effective_date}}`) in `filledTemplate` parsing logic.
  - Configured PDF document title to `'Salary Transfer Letter'`, outputting `Salary_Transfer_Letter.pdf`.