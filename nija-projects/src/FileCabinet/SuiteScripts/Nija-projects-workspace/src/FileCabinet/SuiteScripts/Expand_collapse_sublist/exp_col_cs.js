/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([
    'N/currentRecord'
], (currentRecord) => {

    const SUBLIST_ID = 'recmachcustrecord_parent_test_od';
    const PARENT_FIELD = 'custrecord_od_child_subrec';

    let treeData = [];
    let initialized = false;
    let taskNameColIndex = -1;
    let observer;

    /*
     * ============================================================
     * PAGE INIT
     * ============================================================
     */
    function pageInit(context) {
        console.log('exp_col_cs.js: pageInit triggered');
        
        // Try to initialize immediately (in case the sublist is already rendered)
        initializeTree();

        // Set up MutationObserver to watch for AJAX loads of the sublist pane
        setupSublistObserver();
    }

    /*
     * ============================================================
     * INITIALIZE TREE
     * ============================================================
     */
    function initializeTree() {
        console.log('exp_col_cs.js: initializeTree started');
        const table = findSublistTable();
        if (!table) {
            console.log('exp_col_cs.js: Sublist table not found in DOM yet.');
            return;
        }

        if (initialized) {
            console.log('exp_col_cs.js: Already initialized.');
            return;
        }
        initialized = true;

        const rec = currentRecord.get();
        let lineCount = 0;

        try {
            lineCount = rec.getLineCount({
                sublistId: SUBLIST_ID
            });
        } catch (e) {
            console.log('exp_col_cs.js: Unable to get line count', e);
            initialized = false;
            return;
        }

        console.log('exp_col_cs.js: Line count =', lineCount);
        if (lineCount === 0) {
            // If line count is 0, sublist might still be loading
            initialized = false;
            return;
        }

        /*
         * Build the tree structure.
         */
        treeData = [];
        const idToLineMap = {};

        for (let i = 0; i < lineCount; i++) {
            let childId = '';
            let parentId = '';

            try {
                childId = rec.getSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: 'id',
                    line: i
                }) || '';
            } catch (e) {
                console.log('exp_col_cs.js: Unable to read child id at line ' + i, e);
            }

            try {
                parentId = rec.getSublistValue({
                    sublistId: SUBLIST_ID,
                    fieldId: PARENT_FIELD,
                    line: i
                }) || '';
            } catch (e) {
                console.log('exp_col_cs.js: Unable to read parent field at line ' + i, e);
            }

            treeData.push({
                line: i,
                id: String(childId),
                parentId: String(parentId),
                parentLine: null,
                children: [],
                expanded: true // initially expanded
            });

            if (childId) {
                idToLineMap[String(childId)] = i;
            }
        }

        // Establish parentLine and children relationships
        treeData.forEach(node => {
            if (node.parentId && idToLineMap[node.parentId] !== undefined) {
                const pLine = idToLineMap[node.parentId];
                node.parentLine = pLine;
                treeData[pLine].children.push(node.line);
            }
        });

        console.log('exp_col_cs.js: Built treeData:', treeData);

        // Find the index of the "TASK NAME" column
        findTaskNameColumnIndex(table);

        renderTree();
    }

    /*
     * ============================================================
     * FIND COLUMN INDEX BY HEADER TEXT
     * ============================================================
     */
    function findTaskNameColumnIndex(table) {
        const headerRow = table.querySelector('tr.uir-list-headerrow') || table.querySelector('tr');
        if (!headerRow) return;

        const headerCells = headerRow.cells;
        for (let col = 0; col < headerCells.length; col++) {
            const text = headerCells[col].textContent || headerCells[col].innerText || '';
            const cleanText = text.trim().toUpperCase();
            // Use indexOf to handle sort arrows or hidden characters (e.g., "TASK NAME ▲")
            if (cleanText.indexOf('TASK NAME') !== -1 || cleanText.indexOf('NAME') !== -1) {
                taskNameColIndex = col;
                break;
            }
        }
        console.log('exp_col_cs.js: Found TASK NAME column index:', taskNameColIndex);
    }

    /*
     * ============================================================
     * RENDER TREE
     * ============================================================
     */
    function renderTree() {
        const table = findSublistTable();
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        let dataRowIndex = 0;
        
        rows.forEach((row) => {
            if (row.classList.contains('uir-list-headerrow') || row.classList.contains('uir-list-total-tr') || row.querySelector('th')) {
                return;
            }
            if (!row.cells || row.cells.length === 0) {
                return;
            }
            row.setAttribute('data-tree-line', dataRowIndex);
            dataRowIndex++;
        });

        // Insert the inline Expand All | Collapse All control to the header
        insertHeaderControls(table);

        // Setup the toggles and indentation inline
        setupRowHandlers();

        // Update the rows visibility
        updateRowVisibilities();
        console.log('exp_col_cs.js: Rendered tree successfully');
    }

    /*
     * ============================================================
     * FIND SUBLIST TABLE
     * ============================================================
     */
    function findSublistTable() {
        let table = document.getElementById(SUBLIST_ID + '_splits') || 
                    document.getElementById(SUBLIST_ID + '_lines') || 
                    document.getElementById(SUBLIST_ID + '_val');
        if (table && table.tagName === 'TABLE') {
            return table;
        }
        
        table = document.querySelector('table[id*="' + SUBLIST_ID + '"]');
        if (table) {
            return table;
        }
        
        table = document.getElementById(SUBLIST_ID);
        if (table && table.tagName === 'TABLE') {
            return table;
        }
        
        // Fallback: look for uir-list-table class inside the pane
        const pane = document.getElementById(SUBLIST_ID + '_pane') || 
                     document.querySelector('[id*="' + SUBLIST_ID + '"]');
        if (pane) {
            if (pane.tagName === 'TABLE') return pane;
            const innerTable = pane.querySelector('table.uir-list-table') || pane.querySelector('table');
            if (innerTable) return innerTable;
        }
        
        return null;
    }

    /*
     * ============================================================
     * MUTATION OBSERVER TO HANDLE AJAX LOADING
     * ============================================================
     */
    function setupSublistObserver() {
        const container = document.getElementById(SUBLIST_ID + '_pane') || 
                          document.getElementById(SUBLIST_ID + '_div') ||
                          document.querySelector('[id*="' + SUBLIST_ID + '"]');
        if (!container) {
            console.log('exp_col_cs.js: Sublist container not found for observing');
            return;
        }
        
        if (observer) {
            observer.disconnect();
        }
        
        observer = new MutationObserver((mutations) => {
            const table = findSublistTable();
            // Check if the table is loaded and we haven't wrapped the cells yet
            if (table && !table.querySelector('.tree-node-wrapper')) {
                console.log('exp_col_cs.js: Observer detected sublist table load/change');
                observer.disconnect();
                
                initialized = false;
                initializeTree();
                
                // Re-enable observer after rendering
                setTimeout(setupSublistObserver, 1000);
            }
        });
        
        observer.observe(container, { childList: true, subtree: true });
        console.log('exp_col_cs.js: Observer attached to sublist container');
    }

    /*
     * ============================================================
     * INSERT HEADER CONTROLS (Expand All | Collapse All)
     * ============================================================
     */
    function insertHeaderControls(table) {
        if (taskNameColIndex === -1) return;

        const headerRow = table.querySelector('tr.uir-list-headerrow') || table.querySelector('tr');
        if (!headerRow) return;

        const headerCell = headerRow.cells[taskNameColIndex];
        if (headerCell && !headerCell.querySelector('#custom_expand_all')) {
            const container = document.createElement('span');
            container.style.marginLeft = '15px';
            container.style.fontWeight = 'normal';
            container.style.fontSize = '11px';
            container.style.display = 'inline-flex';
            container.style.gap = '5px';
            container.style.alignItems = 'center';
            container.style.textTransform = 'none';

            container.innerHTML = `
                <a href="#" id="custom_expand_all" style="text-decoration: none; color: #607799; font-weight: 500;">↗ Expand All</a>
                <span style="color: #ccc;">|</span>
                <a href="#" id="custom_collapse_all" style="text-decoration: none; color: #607799; font-weight: 500;">↗ Collapse All</a>
            `;

            headerCell.appendChild(container);

            container.querySelector('#custom_expand_all').onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                expandAll();
            };
            container.querySelector('#custom_collapse_all').onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                collapseAll();
            };
        }
    }

    /*
     * ============================================================
     * SETUP ROW HANDLERS
     * ============================================================
     */
    function setupRowHandlers() {
        const table = findSublistTable();
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const lineAttr = row.getAttribute('data-tree-line');
            if (lineAttr === null) return;
            const line = parseInt(lineAttr, 10);

            addToggleButton(row, line);
        });
    }

    /*
     * ============================================================
     * ADD +/- BUTTON WITH INDENTATION SPACER INLINE
     * ============================================================
     */
    function addToggleButton(row, line) {
        const targetCellIndex = (taskNameColIndex !== -1) ? taskNameColIndex : 3;
        const cell = row.cells[targetCellIndex];
        if (!cell) return;

        if (cell.querySelector('.tree-node-wrapper')) {
            return;
        }

        const node = treeData[line];
        if (!node) return;

        const hasChildren = node.children && node.children.length > 0;

        const wrapper = document.createElement('span');
        wrapper.className = 'tree-node-wrapper';
        wrapper.style.display = 'inline-flex';
        wrapper.style.alignItems = 'center';

        // Calculate depth for indentation
        let depth = 0;
        let parent = node.parentLine;
        while (parent !== null && parent !== undefined) {
            depth++;
            parent = treeData[parent].parentLine;
        }

        // Add indentation spacer
        if (depth > 0) {
            const spacer = document.createElement('span');
            spacer.style.display = 'inline-block';
            spacer.style.width = (depth * 20) + 'px';
            wrapper.appendChild(spacer);
        }

        // Create toggle element (arrow ▼ or ▶)
        if (hasChildren) {
            const button = document.createElement('span');
            button.className = 'custom-tree-toggle';
            button.style.cursor = 'pointer';
            button.style.fontSize = '12px';
            button.style.fontWeight = 'bold';
            button.style.marginRight = '8px';
            button.style.display = 'inline-flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            button.style.width = '14px';
            button.style.height = '14px';
            button.style.color = '#555';
            button.style.userSelect = 'none';
            
            button.innerHTML = node.expanded ? '▼' : '▶';

            button.onclick = function (event) {
                event.preventDefault();
                event.stopPropagation();
                toggleLine(line);
            };
            wrapper.appendChild(button);
        } else {
            // Spacer to keep text aligned
            const spacer = document.createElement('span');
            spacer.style.display = 'inline-block';
            spacer.style.width = '14px';
            spacer.style.marginRight = '8px';
            wrapper.appendChild(spacer);
        }

        // Move existing contents of the cell inside the wrapper
        while (cell.firstChild) {
            wrapper.appendChild(cell.firstChild);
        }

        cell.appendChild(wrapper);
    }

    /*
     * ============================================================
     * UPDATE ROW VISIBILITIES (RECURSIVE AND ROBUST)
     * ============================================================
     */
    function updateRowVisibilities() {
        const table = findSublistTable();
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr[data-tree-line]');
        const visibleMap = {};

        function isNodeVisible(line) {
            if (visibleMap[line] !== undefined) {
                return visibleMap[line];
            }
            const node = treeData[line];
            if (!node) {
                visibleMap[line] = true;
                return true;
            }
            if (node.parentLine === null || node.parentLine === undefined) {
                visibleMap[line] = true;
                return true;
            }
            const parentVisible = isNodeVisible(node.parentLine);
            const parentExpanded = treeData[node.parentLine].expanded;
            const visible = parentVisible && parentExpanded;
            visibleMap[line] = visible;
            return visible;
        }

        rows.forEach(row => {
            const lineAttr = row.getAttribute('data-tree-line');
            if (lineAttr === null) return;
            const line = parseInt(lineAttr, 10);
            const visible = isNodeVisible(line);

            row.style.display = visible ? '' : 'none';

            const button = row.querySelector('.custom-tree-toggle');
            if (button) {
                const node = treeData[line];
                if (node && node.children && node.children.length > 0) {
                    button.innerHTML = node.expanded ? '▼' : '▶';
                }
            }
        });
    }

    /*
     * ============================================================
     * TOGGLE LINE
     * ============================================================
     */
    function toggleLine(line) {
        const node = treeData[line];
        if (node) {
            node.expanded = !node.expanded;
            updateRowVisibilities();
        }
    }

    /*
     * ============================================================
     * EXPAND ALL
     * ============================================================
     */
    function expandAll() {
        treeData.forEach(node => {
            node.expanded = true;
        });
        updateRowVisibilities();
    }

    /*
     * ============================================================
     * COLLAPSE ALL
     * ============================================================
     */
    function collapseAll() {
        treeData.forEach(node => {
            node.expanded = false;
        });
        updateRowVisibilities();
    }

    return {
        pageInit,
        expandAll,
        collapseAll,
        toggleLine
    };

});