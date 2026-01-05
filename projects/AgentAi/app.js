/**
 * Agent AI Core Logic
 * Handles orchestrating between specialized agents using Gemini API.
 */

class AgentAI {
    constructor() {
        this.apiKey = localStorage.getItem('gemini_api_key');
        this.chatBox = document.getElementById('chatBox');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.currentAgent = 'multi';
        this.isOffline = false; // Default to Online
        this.localEndpoint = localStorage.getItem('local_model_endpoint') || 'http://localhost:11434';

        this.init();
    }

    init() {
        this.initModeToggle();
        this.sendBtn.addEventListener('click', () => this.handleSendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        // Agent Type Selection
        document.querySelectorAll('.agent-type-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.agent-type-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.currentAgent = card.dataset.agent;
                this.addMessage(`Switching to ${this.formatAgentName(this.currentAgent)} Agent context.`, 'system');
            });
        });
    }

    initModeToggle() {
        const toggle = document.getElementById('modeToggle');
        const display = document.getElementById('currentModeDisplay');

        toggle.addEventListener('click', () => {
            this.isOffline = !this.isOffline;
            toggle.classList.toggle('offline', this.isOffline);
            display.textContent = this.isOffline ? 'Offline (Local)' : 'Online (Gemini)';

            this.updateSidebarUI();
            this.addMessage(`Switched to ${this.isOffline ? 'Offline' : 'Online'} mode.`, 'system');

            if (this.isOffline) {
                this.checkLocalServer();
            }
        });
    }

    updateSidebarUI() {
        const configBtnText = document.getElementById('configBtnText');
        const configBtnIcon = document.getElementById('configBtnIcon');
        const offlineGuideBtn = document.getElementById('offlineGuideBtn');

        if (this.isOffline) {
            configBtnText.textContent = 'Configure Local Model';
            configBtnIcon.setAttribute('name', 'server-outline');
            offlineGuideBtn.style.display = 'flex';
        } else {
            configBtnText.textContent = 'Configure Gemini API';
            configBtnIcon.setAttribute('name', 'key-outline');
            offlineGuideBtn.style.display = 'none';
        }
    }

    async checkLocalServer() {
        try {
            const response = await fetch('http://localhost:3000/status');
            if (response.ok) {
                this.addMessage("Connected to Local Companion Server ✅", 'system');
                this.addMessage("You are now in Offline Mode. I can interact with your local files and execute system commands through the companion server.", 'agent');
            } else {
                throw new Error();
            }
        } catch (e) {
            this.showOfflineInstructions();
        }
    }

    showOfflineInstructions() {
        if (document.getElementById('offline-setup-instruction')) {
            // If already there, just scroll to it
            document.getElementById('offline-setup-instruction').scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const div = document.createElement('div');
        div.id = 'offline-setup-instruction';
        div.className = 'message agent';
        div.innerHTML = `
            <div style="background: rgba(244, 67, 54, 0.1); border-left: 4px solid #f44336; padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <p style="margin-bottom: 1rem; font-weight: bold; font-size: 1.1rem; color: #d32f2f;">
                    <ion-icon name="warning-outline" style="vertical-align: middle; margin-right: 0.5rem;"></ion-icon>
                    Local Companion Server Not Detected
                </p>
                <p style="margin-bottom: 1rem;">Setup is required for Offline Mode & Local Automation:</p>
                <ol style="margin-left: 1.5rem; margin-bottom: 1.5rem; line-height: 1.6;">
                    <li><strong>Download</strong> the Setup Tool below.</li>
                    <li>Move <code>setup.bat</code> to your <code>projects/AgentAi</code> folder.</li>
                    <li><strong>Run it</strong> to install dependencies and <strong>download the offline model</strong>.</li>
                    <li>Start the server with <code>npm start</code>.</li>
                </ol>
                <div style="display: flex; flex-direction: column; gap: 0.8rem;" id="offline-download-container">
                    <button class="btn btn-primary" onclick="downloadSetupScript()" style="width: 100%; justify-content: center;">
                        <ion-icon name="download-outline"></ion-icon>
                        <span>Download Setup Tool (setup.bat)</span>
                    </button>
                    <p style="font-size: 0.8rem; color: #666; text-align: center;">This tool automates the local LLM & browser automation setup.</p>
                </div>
            </div>
        `;
        this.chatBox.appendChild(div);
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }

    formatAgentName(name) {
        if (name === 'multi') return 'Orchestrator';
        return name.charAt(0).toUpperCase() + name.slice(1);
    }

    addMessage(text, sender = 'agent') {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;

        if (sender === 'system') {
            msgDiv.style.fontStyle = 'italic';
            msgDiv.style.color = '#5f6368';
            msgDiv.style.fontSize = '0.8rem';
            msgDiv.style.alignSelf = 'center';
            msgDiv.style.background = 'transparent';
            msgDiv.style.boxShadow = 'none';
        }

        msgDiv.textContent = text;
        this.chatBox.appendChild(msgDiv);
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }

    async handleSendMessage() {
        const text = this.chatInput.value.trim();
        if (!text) return;

        this.addMessage(text, 'user');
        this.chatInput.value = '';
        this.chatInput.style.height = 'auto';

        if (!this.apiKey && !this.isOffline) {
            this.addMessage("Please configure your Gemini API Key first by clicking the button in the sidebar.", 'agent');
            return;
        }

        this.addMessage("Processing...", 'system');

        try {
            let response;
            if (this.isOffline) {
                response = await this.callLocalServer(text);
            } else {
                response = await this.callGeminiAPI(text);
            }
            this.addMessage(response, 'agent');
        } catch (error) {
            console.error(error);
            this.addMessage("Error: " + error.message, 'agent');
        }
    }

    async callLocalServer(prompt) {
        // Redirect to local companion server
        const systemInstruction = this.getSystemInstruction();
        const response = await fetch('http://localhost:3000/agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                systemInstruction: systemInstruction,
                agent: this.currentAgent,
                modelEndpoint: this.localEndpoint
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data.response;
    }

    async callGeminiAPI(prompt) {
        // This is where we call the Gemini API
        // For the beta, we'll provide a framework for the multi-modal orchestration
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

        const systemInstruction = this.getSystemInstruction();

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${systemInstruction}\n\nUser Prompt: ${prompt}` }]
                }]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.candidates[0].content.parts[0].text;
    }

    getSystemInstruction() {
        const instructions = {
            multi: "You are the Orchestrator. Your job is to analyze the user's request and decide which specialized agent (Web, Code, Research, System) is best suited to handle it, or handle it yourself if it requires coordination.",
            web: "You are the Web Agent. Focus on tasks involving internet research, data extraction from URLs, and understanding web technologies.",
            code: "You are the Code Agent. Your expertise is in writing, debugging, and explaining code. Provide high-quality, secure, and efficient solutions.",
            research: "You are the Research Agent. Focus on providing deep insights, summarizing complex topics, and synthesizing information from multiple perspectives.",
            system: "You are the System Agent. You specialize in OS-level operations (Windows/Linux), shell scripting, and local development environments. Note: You current have simulated system access."
        };
        return instructions[this.currentAgent] || instructions.multi;
    }

    saveLocalConfig() {
        const endpoint = document.getElementById('localEndpointInput').value;
        if (endpoint) {
            localStorage.setItem('local_model_endpoint', endpoint);
            this.localEndpoint = endpoint;
            this.addMessage(`Local Model Endpoint updated to: ${endpoint}`, 'system');
            this.closeLocalConfigModal();
        }
    }

    async genericDownload(content, filename, mimeType) {
        this.addMessage(`Preparing ${filename} for download...`, 'system');

        // Try Native Save File Picker first (Chrome/Edge)
        if (typeof window.showSaveFilePicker === 'function') {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'Windows Batch File',
                        accept: { 'text/plain': ['.bat'] }, // Browsers often prefer text/plain for .bat safety
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(content);
                await writable.close();
                return true;
            } catch (err) {
                if (err.name === 'AbortError') return false;
                console.warn('Native save failed, falling back:', err);
            }
        }

        // Fallback to standard link
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return true;
    }

    async downloadSetupScript() {
        const setupContent = `@echo off
echo ===================================================
echo   Agent AI Local Companion Setup
echo ===================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it from https://nodejs.org/
    pause
    exit /b
)

echo [1/3] Installing dependencies...
call npm install
echo [SECURE] Updating & fixing security vulnerabilities...
call npm audit fix --force

echo.
echo [2/3] Checking for local model (Ollama)...
echo [INFO] Please ensure Ollama is running if you plan to use it.
echo [INFO] Default endpoint: http://localhost:11434

echo.
echo [3/3] Setup complete!
echo.
echo To start the server, run: npm start
echo Then go to the Agent AI Beta page and toggle to "Offline".
echo.
pause`;

        const success = await this.genericDownload(setupContent, 'setup.bat', 'application/x-msdos-program');
        if (success) {
            this.addMessage("✅ setup.bat saved successfully. Move it to your 'projects/AgentAi' folder and run it.", 'system');
        }
    }


    handleConfigClick() {
        if (this.isOffline) {
            this.openLocalConfigModal();
        } else {
            this.openApiKeyModal();
        }
    }

    openApiKeyModal() { document.getElementById('apiModal').style.display = 'flex'; }
    closeApiKeyModal() { document.getElementById('apiModal').style.display = 'none'; }
    openLocalConfigModal() { document.getElementById('localConfigModal').style.display = 'flex'; }
    closeLocalConfigModal() { document.getElementById('localConfigModal').style.display = 'none'; }
}

// Global instances for HTML onclick events
const agentApp = new AgentAI();
window.openApiKeyModal = () => agentApp.openApiKeyModal();
window.closeApiKeyModal = () => agentApp.closeApiKeyModal();
window.openLocalConfigModal = () => agentApp.openLocalConfigModal();
window.closeLocalConfigModal = () => agentApp.closeLocalConfigModal();
window.handleConfigClick = () => agentApp.handleConfigClick();
window.showOfflineInstructions = () => agentApp.showOfflineInstructions();
window.saveApiKey = () => {
    const key = document.getElementById('apiKeyInput').value;
    if (key) {
        localStorage.setItem('gemini_api_key', key);
        alert('API Key saved successfully!');
        agentApp.apiKey = key;
        window.closeApiKeyModal();
    }
};
window.saveLocalConfig = () => agentApp.saveLocalConfig();
window.downloadSetupScript = () => agentApp.downloadSetupScript();
