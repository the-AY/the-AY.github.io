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
        this.localEndpoint = localStorage.getItem('local_model_endpoint') || 'http://127.0.0.1:11434';

        // Voice State
        this.isListening = false;
        this.isTTSEnabled = localStorage.getItem('voice_tts_enabled') === 'true';
        this.recognition = null;
        this.synth = window.speechSynthesis;

        this.init();
        this.initVoice();
    }

    init() {
        this.initModeToggle();
        this.initSpeechToggle();
        this.sendBtn.addEventListener('click', () => this.handleSendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        const micBtn = document.getElementById('micBtn');
        if (micBtn) {
            micBtn.addEventListener('click', () => this.toggleListening());
        }

        // Agent Type Selection
        document.querySelectorAll('.agent-type-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.agent-type-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.currentAgent = card.dataset.agent;
                this.addMessage(`Switching to ${this.formatAgentName(this.currentAgent)} Agent context.`, 'system');

                // Auto-enable voice features if Voice Agent is selected
                if (this.currentAgent === 'voice') {
                    if (!this.isTTSEnabled) this.toggleSpeech(true);
                }
            });
        });
    }

    initVoice() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                document.getElementById('micBtn').classList.add('active');
                this.chatInput.placeholder = "Listening...";
            };

            this.recognition.onend = () => {
                this.isListening = false;
                document.getElementById('micBtn').classList.remove('active');
                this.chatInput.placeholder = "Type your message here...";
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.chatInput.value = transcript;
                this.handleSendMessage();
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isListening = false;
                document.getElementById('micBtn').classList.remove('active');
            };
        } else {
            console.warn('Speech Recognition not supported in this browser.');
            const micBtn = document.getElementById('micBtn');
            if (micBtn) micBtn.style.display = 'none';
        }

        // Sync speech toggle UI
        const speechToggle = document.getElementById('speechToggle');
        if (speechToggle && this.isTTSEnabled) {
            speechToggle.classList.add('active');
        }
    }

    initSpeechToggle() {
        const toggle = document.getElementById('speechToggle');
        toggle.addEventListener('click', () => this.toggleSpeech());
    }

    toggleSpeech(forceState = null) {
        const toggle = document.getElementById('speechToggle');
        this.isTTSEnabled = forceState !== null ? forceState : !this.isTTSEnabled;

        toggle.classList.toggle('active', this.isTTSEnabled);
        localStorage.setItem('voice_tts_enabled', this.isTTSEnabled);

        this.addMessage(`Speech Output ${this.isTTSEnabled ? 'Enabled' : 'Disabled'}.`, 'system');

        if (!this.isTTSEnabled && this.synth.speaking) {
            this.synth.cancel();
        }
    }

    toggleListening() {
        if (!this.recognition) return;

        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    speak(text) {
        if (!this.isTTSEnabled || !this.synth) return;

        // Cancel any ongoing speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Find a preferred voice (e.g., Google US English)
        const voices = this.synth.getVoices();
        const preferredVoice = voices.find(v => v.name.includes('Google') && v.name.includes('US English')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.pitch = 1;
        utterance.rate = 1;
        this.synth.speak(utterance);
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
                    <li><strong>Run <code>setup.bat</code></strong> in your <code>projects/AgentAi</code> folder.</li>
                    <li>It will install dependencies and <strong>launch the server automatically</strong>.</li>
                    <li>If your LLM (Ollama/LM Studio) uses a different port than 11434, click <strong>"Configure Local Model"</strong> in the sidebar to update it.</li>
                </ol>
                <div style="background: rgba(0,0,0,0.05); padding: 1rem; border-radius: 4px; margin-bottom: 1.5rem; font-size: 0.85rem;">
                    <strong>Tip:</strong> If the companion server port (3000) is already in use, you can change it in <code>local-server.js</code> and update the connection URL in the sidebar settings.
                </div>
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

            // Speak the response if enabled
            this.speak(response);
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
            system: "You are the System Agent. You specialize in OS-level operations (Windows/Linux), shell scripting, and local development environments. Note: You current have simulated system access.",
            voice: "You are the Voice Agent. You are a conversational assistant optimized for hands-free interactions. Be concise, clear, and helpful. You excel at answering questions orally, helping with research, and explaining code snippets in an easy-to-understand way. Since you are speaking to the user, keep your responses natural and avoid long blocks of code unless explicitly asked."
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
setlocal
set LOGFILE=setup-log.txt

echo =================================================== > "%LOGFILE%"
echo   Agent AI Local Companion Setup Log             >> "%LOGFILE%"
echo   Date: %DATE% %TIME%                            >> "%LOGFILE%"
echo =================================================== >> "%LOGFILE%"

echo ===================================================
echo   Agent AI Local Companion Setup
echo ===================================================
echo.

echo [1/4] Checking Environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install from https://nodejs.org/
    goto onerror
)

echo [2/4] Verifying Dependencies...
if not exist "node_modules" (
    echo [INFO] Initial setup: Installing packages...
    call npm install >> "%LOGFILE%" 2>&1
    if %errorlevel% neq 0 (
        echo [ERROR] Installation failed. Check %LOGFILE%.
        goto onerror
    )
)

echo [3/4] Preparing Local Model...
node download-model.js >> "%LOGFILE%" 2>&1

echo [4/4] Finalizing...
echo.
echo ===================================================
echo   LAUNCHING AGENT AI
echo ===================================================
start "Agent AI Server" cmd /c "npm start"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:3000/projects/AgentAi/beta.html"

echo SUCCESS: Agent AI is ready!
echo Keep the server window open.
echo =================================================== 
echo.
pause
exit /b 0

:onerror
echo.
echo ===================================================
echo   SETUP FAILED
echo ===================================================
echo Please check %LOGFILE% for info.
echo.
pause
exit /b 1`;

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
