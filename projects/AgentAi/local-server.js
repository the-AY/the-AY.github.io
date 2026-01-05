/**
 * Agent AI Local Companion Server
 * Provides system-level access, browser automation, and local model integration.
 */

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// CONFIGURATION
const REPO_ROOT = path.join(__dirname, '../../');
const LOCAL_LLM_ENDPOINT = "http://127.0.0.1:11434/api/generate"; // Use IP to avoid IPv6 issues
const DEFAULT_MODEL = "llama3"; // Change to your preferred local model

// Serve static files from the repository root
app.use(express.static(REPO_ROOT));

// Status check
app.get('/status', (req, res) => {
    res.json({ status: 'ok', message: 'Agent AI Companion is active.' });
});

// Agent Orchestration Endpoint
app.post('/agent', async (req, res) => {
    const { prompt, agent, modelEndpoint, systemInstruction } = req.body;

    // Ensure the endpoint has the correct path for Ollama if it's the default or missing path
    let endpoint = modelEndpoint || LOCAL_LLM_ENDPOINT;
    if (endpoint.includes('11434') && !endpoint.includes('/api/generate')) {
        endpoint = endpoint.replace(/\/+$/, '') + '/api/generate';
    }

    console.log(`[${agent}] Received request: ${prompt}`);

    try {
        let responseText = "";

        // 1. Specialized Task Routing
        if (agent === 'system') {
            responseText = await handleSystemTask(prompt);
        }
        else if (agent === 'web') {
            responseText = await handleWebAutomation(prompt);
        }
        else {
            // 2. Local LLM Inference for general/reasoning tasks
            const fullPrompt = systemInstruction ? `${systemInstruction}\n\nUser request: ${prompt}` : `You are the ${agent} Agent for Agent AI. User request: ${prompt}`;
            responseText = await callLocalLLM(fullPrompt, endpoint);
        }

        res.json({ response: responseText });
    } catch (error) {
        console.error(`[Error] ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

async function handleSystemTask(prompt) {
    if (prompt.toLowerCase().includes('list files') || prompt.toLowerCase().includes('dir')) {
        const files = fs.readdirSync('.');
        return `I found the following files in the current directory:\n${files.join('\n')}`;
    }
    // Add more system capabilities here
    return `System command simulation for: "${prompt}".`;
}

async function handleWebAutomation(prompt) {
    console.log(`[Web] Launching browser for: ${prompt}`);
    const browser = await puppeteer.launch({ headless: "new" });
    try {
        const page = await browser.newPage();
        // Basic search automation simulation
        await page.goto('https://www.google.com/search?q=' + encodeURIComponent(prompt));
        const title = await page.title();
        const results = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('h3')).slice(0, 3).map(el => el.innerText);
        });

        return `I searched for "${prompt}" and found these top results:\n- ${results.join('\n- ')}\n(Page Title: ${title})`;
    } finally {
        await browser.close();
    }
}

async function callLocalLLM(prompt, endpoint) {
    console.log(`[LLM] Calling local model at ${endpoint}...`);
    try {
        const response = await axios.post(endpoint, {
            model: DEFAULT_MODEL,
            prompt: prompt,
            stream: false
        });
        return response.data.response || response.data.content || JSON.stringify(response.data);
    } catch (e) {
        return `Local Model Error: ${e.message}. Ensure Ollama (or your local provider) is running at ${endpoint}.`;
    }
}

// Start Server
const server = app.listen(port, () => {
    console.log(`\n===========================================`);
    console.log(`   Agent AI Local Companion Active`);
    console.log(`   Running at: http://127.0.0.1:${port}`);
    console.log(`===========================================\n`);
});

// Graceful Shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down server gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\nTerminating server...');
    server.close(() => {
        process.exit(0);
    });
});
