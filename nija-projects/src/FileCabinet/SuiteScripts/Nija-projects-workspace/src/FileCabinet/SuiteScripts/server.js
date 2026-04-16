const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const PORT = 3000;
const dbPath = path.join(__dirname, 'projects.json');

const server = http.createServer((req, res) => {
    // 1. Handle saving the new project to JSON
    if (req.method === 'POST' && req.url === '/api/projects') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const newProject = JSON.parse(body);
                
                fs.readFile(dbPath, 'utf8', (err, data) => {
                    let projects = [];
                    if (!err && data) {
                        try { projects = JSON.parse(data); } catch (e) {}
                    }
                    
                    projects.push(newProject); // Add the new project
                    
                    // Save back to projects.json
                    fs.writeFile(dbPath, JSON.stringify(projects, null, 2), (err) => {
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify({ error: 'Failed to write to file' }));
                        }
                        res.writeHead(201, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Success' }));
                    });
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // 1b. Handle local PDF live rendering
    if (req.method === 'POST' && req.url === '/api/render-pdf') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                // 1. Extract Page Size and Margins from NetSuite's proprietary <body> tag
                let format = 'Letter'; // Default NetSuite page size
                let margin = { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' };
                
                const bodyMatch = body.match(/<body\s+([^>]+)>/i);
                if (bodyMatch) {
                    const attrs = bodyMatch[1];
                    const sizeMatch = attrs.match(/size="([^"]+)"/i);
                    if (sizeMatch) format = sizeMatch[1]; // Sets format to 'A4', 'Letter', etc.
                    
                    const padMatch = attrs.match(/padding="([^"]+)"/i);
                    if (padMatch) {
                        const p = padMatch[1].trim().split(/\s+/);
                        if (p.length === 1) margin = { top: p[0], right: p[0], bottom: p[0], left: p[0] };
                        else if (p.length === 2) margin = { top: p[0], right: p[1], bottom: p[0], left: p[1] };
                        else if (p.length === 4) margin = { top: p[0], right: p[1], bottom: p[2], left: p[3] };
                    }
                }

                // 2. Replace NetSuite specific tags
                let htmlContent = body.replace(/<pdf>/gi, '<html>').replace(/<\/pdf>/gi, '</html>');
                
                // 3. Inject base CSS to mimic the BFO (NetSuite) renderer behavior
                const bfoCss = `
                    <style>
                        body { margin: 0 !important; padding: 0 !important; }
                        table { border-spacing: 0; border-collapse: collapse; }
                        td, th { box-sizing: border-box; }
                        macrolist { display: none; } /* Hide macros so they don't break main body flow in Chrome */
                    </style>
                    </head>`;
                htmlContent = htmlContent.replace(/<\/head>/gi, bfoCss);
                
                const browser = await puppeteer.launch({ headless: 'new' });
                const page = await browser.newPage();
                await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
                
                const pdfBuffer = await page.pdf({ 
                    format: format,
                    printBackground: true,
                    margin: margin
                });
                
                await browser.close();
                
                res.writeHead(200, { 'Content-Type': 'application/pdf' });
                res.end(pdfBuffer);
            } catch (error) {
                console.error('PDF Render Error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to generate PDF' }));
            }
        });
        return;
    }

    // 2. Serve the HTML, CSS, and JSON files to the browser
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200);
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Open http://localhost:${PORT}/my-projects.html to test adding projects.`);
});