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

      if (lineCount === 0) return true;

      var headerLocationId = currentRecord.getValue({ fieldId: 'location' });
      var headerLocationName = currentRecord.getText({ fieldId: 'location' });

      var linesToValidate = [];
      var itemIdsSet = {};
      var locationIdsSet = {};

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

        if (!itemId) continue;

        var toLocationID = currentRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'location',
          line: i
        }) || headerLocationId;

        var locationName = currentRecord.getSublistText({
          sublistId: 'item',
          fieldId: 'location',
          line: i
        }) || headerLocationName;

        var fulfillQty = parseFloat(currentRecord.getSublistValue({
          sublistId: 'item',
          fieldId: 'quantity',
          line: i
        })) || 0;

        linesToValidate.push({
          line: i,
          itemId: itemId,
          locationId: toLocationID,
          locationName: locationName,
          fulfillQty: fulfillQty
        });

        itemIdsSet[itemId] = true;
        if (toLocationID) {
          locationIdsSet[toLocationID] = true;
        }
      }

      if (linesToValidate.length === 0) return true;

      var uniqueItemIds = Object.keys(itemIdsSet);
      var uniqueLocationIds = Object.keys(locationIdsSet);

      // Bulk Query 1: Get item types for all items in 1 query (10 governance units)
      var itemTypeMap = getItemTypesMap(uniqueItemIds);

      // Bulk Query 2: Get location names if missing in 1 query (10 governance units)
      var missingLocationIds = uniqueLocationIds.filter(function (locId) {
        return linesToValidate.some(function (l) { return String(l.locationId) === String(locId) && !l.locationName; });
      });
      var locationNameMap = getLocationNamesMap(missingLocationIds);

      // Bulk Query 3: Get inventory balances for all items in 1 query (10 governance units)
      var onHandMap = getBulkOnHandQtyMap(uniqueItemIds);

      // In-memory validation for each line (0 governance units)
      for (var k = 0; k < linesToValidate.length; k++) {
        var lineData = linesToValidate[k];
        var itemType = itemTypeMap[lineData.itemId] || '';

        // Only validate Inventory Parts & Assembly Parts
        if (itemType && itemType !== 'InvtPart' && itemType !== 'Assembly') {
          log.debug('Skipping Line ' + lineData.line, 'Item type (' + itemType + ') is not an inventory item.');
          continue;
        }

        var locId = lineData.locationId;
        var onHandQty = 0;

        if (locId) {
          onHandQty = onHandMap[lineData.itemId + '_' + locId] || 0;
        } else {
          onHandQty = onHandMap[lineData.itemId + '_TOTAL'] || 0;
        }

        var locName = lineData.locationName || locationNameMap[locId] || (locId ? ("ID: " + locId) : 'N/A');

        log.debug('Quantity Check Line ' + lineData.line, 'Item ID: ' + lineData.itemId + ' | On Hand: ' + onHandQty + ' | Fulfill Qty: ' + lineData.fulfillQty);

        if (onHandQty < lineData.fulfillQty) {
          log.debug('Validation Failed', 'Insufficient inventory for Item ID: ' + lineData.itemId + ' at location: ' + locName);

          dialog.alert({
            title: 'Insufficient Inventory',
            message: 'Cannot save record.<br><br>' +
                     'Available quantity (' + onHandQty + ') is less than the fulfilled quantity (' + lineData.fulfillQty + ') at location "<b>' + locName + '</b>".<br><br>' +
                     'Please update the location or adjust inventory before fulfilling.'
          });
          return false;
        }
      }

      return true;
    }

    function getItemTypesMap(itemIds) {
      var map = {};
      if (!itemIds || itemIds.length === 0) return map;
      try {
        var sql = "SELECT id, itemtype FROM item WHERE id IN (" + itemIds.join(',') + ")";
        var results = query.runSuiteQL({ query: sql }).asMappedResults();
        for (var i = 0; i < results.length; i++) {
          map[results[i].id] = results[i].itemtype;
        }
      } catch (e) {
        log.error('Error in getItemTypesMap', e);
      }
      return map;
    }

    function getLocationNamesMap(locationIds) {
      var map = {};
      if (!locationIds || locationIds.length === 0) return map;
      try {
        var sql = "SELECT id, name FROM location WHERE id IN (" + locationIds.join(',') + ")";
        var results = query.runSuiteQL({ query: sql }).asMappedResults();
        for (var i = 0; i < results.length; i++) {
          map[results[i].id] = results[i].name;
        }
      } catch (e) {
        log.error('Error in getLocationNamesMap', e);
      }
      return map;
    }

    function getBulkOnHandQtyMap(itemIds) {
      var map = {};
      if (!itemIds || itemIds.length === 0) return map;
      try {
        var sql = "SELECT item, location, NVL(SUM(quantityonhand), 0) AS totalonhand " +
                  "FROM inventoryBalance " +
                  "WHERE item IN (" + itemIds.join(',') + ") " +
                  "GROUP BY item, location";

        var results = query.runSuiteQL({ query: sql }).asMappedResults();
        for (var i = 0; i < results.length; i++) {
          var item = results[i].item;
          var loc = results[i].location;
          var qty = parseFloat(results[i].totalonhand) || 0;

          if (loc) {
            map[item + '_' + loc] = qty;
          }
          map[item + '_TOTAL'] = (map[item + '_TOTAL'] || 0) + qty;
        }
      } catch (e) {
        log.error('Error in getBulkOnHandQtyMap', e);
      }
      return map;
    }

    return {
      pageInit: pageInit,
      saveRecord: saveRecord
    };

  });