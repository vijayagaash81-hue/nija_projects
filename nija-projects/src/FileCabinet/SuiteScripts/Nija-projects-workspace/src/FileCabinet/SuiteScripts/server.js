const http = require('http');
const fs = require('fs');
const path = require('path');

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