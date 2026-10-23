const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const folders = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.match(/^\d\d-/))
    .map(d => d.name)
    .sort();

console.log('Found scenario folders:', folders);

const scenarios = [];

folders.forEach((folderName, idx) => {
    const folderPath = path.join(baseDir, folderName);
    const files = fs.readdirSync(folderPath)
        .filter(f => !f.startsWith('.'))
        .sort((a, b) => {
            // README first, then JS, then XML
            if (a.toLowerCase().includes('readme')) return -1;
            if (b.toLowerCase().includes('readme')) return 1;
            return a.localeCompare(b);
        });

    const fileObjects = [];

    files.forEach(fileName => {
        const filePath = path.join(folderPath, fileName);
        const code = fs.readFileSync(filePath, 'utf-8');
        
        let type = 'Script';
        let badgeClass = 'ext-js';
        let badgeText = 'JS';

        if (fileName.endsWith('.js')) {
            if (code.includes('@NScriptType UserEventScript')) type = 'UserEventScript 2.1';
            else if (code.includes('@NScriptType ClientScript')) type = 'ClientScript 2.1';
            else if (code.includes('@NScriptType Suitelet')) type = 'Suitelet 2.1';
            else if (code.includes('@NScriptType MapReduceScript')) type = 'MapReduceScript 2.1';
            else type = 'JavaScript 2.1';
            badgeClass = 'ext-js';
            badgeText = 'JS';
        } else if (fileName.endsWith('.xml')) {
            type = 'Advanced PDF/XML';
            badgeClass = 'ext-xml';
            badgeText = 'XML';
        } else if (fileName.endsWith('.md')) {
            type = 'Documentation';
            badgeClass = 'ext-md';
            badgeText = 'MD';
        }

        fileObjects.push({
            name: fileName,
            type: type,
            badgeClass: badgeClass,
            badgeText: badgeText,
            code: code
        });
    });

    // Human-friendly title
    const cleanTitle = folderName
        .replace(/^\d+-/, '')
        .replace(/-/g, ' ');

    scenarios.push({
        id: 's' + (idx + 1),
        folder: folderName,
        title: `${idx + 1}. ${cleanTitle}`,
        files: fileObjects
    });
});

let jsonStr = JSON.stringify(scenarios, null, 2);
// Critical fix: escape </script> so HTML parser never breaks
jsonStr = jsonStr.replace(/<\/script>/gi, '<\\/script>');

const outputJs = `// Auto-generated scenario data
window.SUITESCRIPT_SCENARIOS = ${jsonStr};
`;

fs.writeFileSync(path.join(baseDir, 'data.js'), outputJs, 'utf-8');
console.log('Successfully generated data.js! Total scenarios:', scenarios.length);
