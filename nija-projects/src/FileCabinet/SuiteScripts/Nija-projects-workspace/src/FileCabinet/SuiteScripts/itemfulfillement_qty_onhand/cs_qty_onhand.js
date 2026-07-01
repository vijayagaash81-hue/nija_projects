/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
var currentMode = null;
define(['N/currentRecord', 'N/search', 'N/log', 'N/format', 'N/record', 'N/query', 'N/ui/dialog'],
  function (currentRecord, searchModule, log, format, record, query, dialog) {

    function pageInit(scriptContext) {
      currentMode = scriptContext.mode;
    }

    function saveRecord(scriptContext) {
      var currentRecord = scriptContext.currentRecord;
      var lineCount = currentRecord.getLineCount({ sublistId: 'item' });

      log.debug('saveRecord', 'Total item lines to process: ' + lineCount);

      if (lineCount > 0) {
        for (var i = 0; i < lineCount; i++) {

          var isReceive = currentRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'itemreceive',
            line: i
          });
          if (isReceive !== true) continue; // Only check lines that are checked for fulfillment

          var itemId = currentRecord.getSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: i
          });

          

          

            var toLocationID = currentRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'location',
              line: i
            });

            var itemName = currentRecord.getSublistText({
              sublistId: 'item',
              fieldId: 'item',
              line: i
            });

            var locationName = currentRecord.getSublistText({
              sublistId: 'item',
              fieldId: 'location',
              line: i
            });

            if (!locationName && toLocationID) {
              try {
                var locResults = query.runSuiteQL({ query: "SELECT name FROM location WHERE id = " + toLocationID }).asMappedResults();
                if (locResults.length > 0) {
                  locationName = locResults[0].name;
                }
              } catch (e) { log.error('Error fetching location name', e); }
              if (!locationName) locationName = "ID: " + toLocationID;
            }

            var fulfillQty = parseFloat(currentRecord.getSublistValue({
              sublistId: 'item',
              fieldId: 'quantity',
              line: i
            })) || 0;

            log.debug('Line ' + i + ' Details', 'Item ID: ' + itemId + ', Location: ' + toLocationID + ', Fulfill Qty: ' + fulfillQty);

            // Get item type via SuiteQL
            var sql = "SELECT itemtype FROM item WHERE id = " + itemId;
            var queryResults = query.runSuiteQL({ query: sql });
            var records1 = queryResults.asMappedResults();
            var itemType = (records1.length > 0) ? records1[0].itemtype : '';

            log.debug('Line ' + i + ' Item Type', itemType);

            // Only validate Inventory Parts
            

              var onHandQty = getOnHandQty(itemId, toLocationID);
              
              log.debug('Quantity Check', 'Item ID: ' + itemId + ' | On Hand: ' + onHandQty + ' | Fulfill Qty: ' + fulfillQty);

              if (onHandQty < fulfillQty) {
                
                log.debug('Validation Failed', 'Insufficient inventory for Item ID: ' + itemId + ' at location ID: ' + toLocationID);

                dialog.alert({
                  title: 'Insufficient Inventory',
                  message: 'Cannot save record.<br><br>' +
                           'Available quantity (' + onHandQty + ') is less than the fulfilled quantity (' + fulfillQty + ') at location "<b>' + locationName + '</b>".<br><br>' +
                           'Please update the location or adjust inventory before fulfilling.'
                });
                return false; 
              }
            
          
        }
      }
      return true; 
    }

    
    function getOnHandQty(itemId, locId) {
      try {
        var sql = "SELECT quantityonhand FROM inventoryBalance " +
                  "WHERE item = " + itemId + " AND location = " + locId;

        var results = query.runSuiteQL({ query: sql }).asMappedResults();

        if (results.length > 0) {
          return parseFloat(results[0].quantityonhand) || 0;
        }
        return 0;
      } catch (e) {
        log.error('Error in getOnHandQty', e);
        return 0;
      }
    }

    return {
      pageInit: pageInit,
      saveRecord: saveRecord
    };

  });