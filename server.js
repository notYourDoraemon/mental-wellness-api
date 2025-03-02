const express = require('express');
const moodRoutes = require('./routes/moodRoutes');
const journalRoutes = require('./routes/journalRoutes');
const db = require('./db/database');
const limiter = require('./middleware/rateLimit');
const fs = require('fs');
const yaml = require('js-yaml');

const app = express();
const PORT = process.env.PORT || 6066;

app.use(express.json());
app.use(limiter);

app.post('/api/register', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });

  const apiKey = require('uuid').v4();
  try {
    const stmt = db.prepare('INSERT INTO users (username, api_key) VALUES (?, ?)');
    const result = stmt.run(username, apiKey);
    res.status(201).json({ username, api_key: apiKey });
  } catch (error) {
    res.status(400).json({ error: 'Username already taken' });
  }
});

// Serve API documentation
app.get('/api/docs', (req, res) => {
  try {
    const doc = yaml.load(fs.readFileSync('./docs/openapi.yaml', 'utf8'));
    const acceptHeader = req.headers['accept'] || '';

    if (acceptHeader.includes('application/json')) {
      // Serve JSON for curl or clients requesting JSON
      res.json(doc);
    } else {
      // Serve enhanced HTML for web browsers
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Mental Wellness API Docs</title>
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              margin: 20px;
              line-height: 1.6;
              background-color: #f9f9f9;
              color: #333;
            }
            h1 {
              color: #2c3e50;
              border-bottom: 2px solid #3498db;
              padding-bottom: 10px;
            }
            h2 {
              color: #2980b9;
              margin-top: 20px;
            }
            .section {
              background: #fff;
              border: 1px solid #ddd;
              border-radius: 5px;
              padding: 15px;
              margin-bottom: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .endpoint {
              margin: 10px 0;
            }
            .method {
              font-weight: bold;
              color: #e74c3c;
              margin-right: 10px;
            }
            .path {
              font-family: monospace;
              color: #27ae60;
            }
            pre {
              background: #ecf0f1;
              padding: 10px;
              border-radius: 5px;
              overflow-x: auto;
            }
            code {
              font-family: 'Courier New', monospace;
              background: #ecf0f1;
              padding: 2px 5px;
              border-radius: 3px;
            }
            .curl-instruction {
              background: #34495e;
              color: #ecf0f1;
              padding: 10px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <h1>Mental Wellness API Documentation</h1>
          <div class="curl-instruction">
            <p>Fetch this documentation as JSON using curl:</p>
            <pre>curl http://localhost:${PORT}/api/docs</pre>
          </div>
          <div class="section">
            <h2>Overview</h2>
            <p>${doc.info.description}</p>
            <p><strong>Version:</strong> ${doc.info.version}</p>
          </div>
          <div class="section">
            <h2>Endpoints</h2>
            ${Object.entries(doc.paths).map(([path, methods]) => `
              <div class="endpoint">
                ${Object.entries(methods).map(([method, details]) => `
                  <p><span class="method">${method.toUpperCase()}</span> <span class="path">${path}</span></p>
                  <p>${details.summary}</p>
                  <p>${details.description}</p>
                  ${details.requestBody ? `
                    <h3>Request Body</h3>
                    <pre>${JSON.stringify(details.requestBody.content['application/json'].schema, null, 2)}</pre>
                  ` : ''}
                  ${details.parameters ? `
                    <h3>Parameters</h3>
                    <ul>
                      ${details.parameters.map(param => `
                        <li><strong>${param.name}</strong> (${param.in}): ${param.description} ${param.required ? '(required)' : ''}</li>
                      `).join('')}
                    </ul>
                  ` : ''}
                  <h3>Responses</h3>
                  <pre>${JSON.stringify(details.responses['200'] || details.responses['201'], null, 2)}</pre>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </body>
        </html>
      `;
      res.set('Content-Type', 'text/html');
      res.send(html);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to load API documentation' });
  }
});

app.use('/api', moodRoutes);
app.use('/api', journalRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});