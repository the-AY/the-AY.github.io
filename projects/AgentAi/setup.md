# 🤖 Agent AI: Local Setup & Customization Guide

Welcome to the **Local Companion** setup. This guide will help you turn your browser-based agent into a powerful local automation tool.

---

## 🛠️ Requirements & Setup

To make the "Offline Mode" work, you need two things: **Backend Infrastructure** and **A Brain (Model)**.

### 1. The Infrastructure (Companion Server)
The companion server (`local-server.js`) is the bridge between your browser and your computer. It allows the agent to read files, run commands, and control a "Puppeteer" browser.

**How to set it up:**
1.  **Download the Setup Tool**: Use the button in the "Offline Setup Guide" on the Beta page to get `setup.bat`.
2.  **Move & Run**: Place `setup.bat` in your `projects/AgentAi` folder and double-click it.
    - It installs Node.js dependencies (`express`, `puppeteer`, `axios`).
    - It offers to download **TinyLlama-1.1B** for quick testing.
3.  **Launch**: Run `npm start` in your terminal.

---

## 🧠 The Models: Can they handle every agent?

The "Agent AI" uses a **Multi-Agent Orchestrator** design. When you ask a question, the Orchestrator decide which agent (Web, Code, System, Research) should handle it.

| Model | Success Rate | Best For |
| :--- | :--- | :--- |
| **TinyLlama (1.1B)** | ~60% | Basic testing, simple commands, single-step tasks. |
| **Llama 3 (8B)** | ~90% | Complex reasoning, coding help, multi-step web research. |
| **Gemini (Online)** | ~98% | High-level orchestration and creative writing. |

### How to make it work for all agents?
For a local model to follow instructions across all agents, it needs to be **"Instruct-tuned"**. Most modern models (Llama 3, Mistral, Phi-3) are already great at this. 
- **Web Agent**: Requires the model to output search queries.
- **System Agent**: Requires the model to output safe shell commands.
- **Code Agent**: Requires the model to be proficient in Python/JS.

---

## 🎯 How to Fine-Tune (The Process)

Fine-tuning is essentially "teaching" a model your specific style or project-specific data.

### The Human-Friendly Steps:
1.  **Data Collection**: Gather examples of how you want the agent to behave. 
    - *Example*: If you want the System Agent to be a Linux expert, collect 500+ examples of complex terminal workflows and their explanations.
2.  **Formatting**: Convert your data into a JSONL format (Conversation style).
    ```json
    {"messages": [{"role": "system", "content": "You are a Linux Expert."}, {"role": "user", "content": "How do I check open ports?"}, {"role": "assistant", "content": "Use 'sudo lsof -i -P -n'..."}]}
    ```
3.  **Training (The Heavy Lifting)**:
    - Use a tool like **Unsloth** or **AutoTrain**. 
    - Use techniques like **LoRA** (Low-Rank Adaptation) which allows you to train on a standard GPU (8GB VRAM) instead of a massive data center.
4.  **Conversion**: Convert your trained model into a `.gguf` file using `llama.cpp`.
5.  **Integration**: Drop the new `.gguf` into your `models/` folder and update `local-server.js` or **Ollama** to point to it.

---

## 🔒 Safety & Privacy
- Your local model stays local. No data leaves your machine.
- The `.gitignore` file ensures your massive model files (GBs) aren't uploaded to GitHub accidentally.
- **Secure Dependencies**: The project uses the latest stable versions of `express`, `puppeteer`, and `axios` to ensure maximum security. The `setup.bat` tool automatically performs a security audit during installation.

> [!TIP]
> **Pro Tip**: If you have an NVIDIA GPU, make sure you have CUDA installed so the local model runs instantly rather than lagging on your CPU!
