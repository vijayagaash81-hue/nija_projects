# Scenario 4: Record Transformation Flow (SO -> IF, PO -> IR, Quote -> SO)

## Overview
NetSuite's `record.transform` is the native mechanism for progressing business transactions through their lifecycle:
- **Sales Order -> Item Fulfillment / Invoice**
- **Purchase Order -> Item Receipt / Vendor Bill**
- **Estimate / Quote -> Sales Order**
- **Return Authorization -> Item Receipt / Credit Memo**

## Key API Signatures
```javascript
const childRecord = record.transform({
    fromType: record.Type.SALES_ORDER,
    fromId: 1045,
    toType: record.Type.ITEM_FULFILLMENT,
    isDynamic: true,
    defaultValues: {
        inventorylocation: 2 // Targets specific inventory location
    }
});
```

## Important Considerations
1. **Dynamic Mode (`isDynamic: true`):** Always recommended when modifying sublist quantities, serial/lot numbers, or inventory details.
2. **Item Fulfillment Checkbox:** On Item Fulfillment sublists, the field is named `itemreceive` (boolean). Set to `false` for lines that should not be fulfilled yet.
3. **Serial & Lot Assignments:** Use `childRecord.getCurrentSublistSubrecord({ sublistId: 'item', fieldId: 'inventorydetail' })` when fulfilling serialized or lot-numbered items.
