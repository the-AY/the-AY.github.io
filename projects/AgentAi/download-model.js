const fs = require('fs');
const path = require('path');
const axios = require('axios');

const MODEL_URL = "https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf";
const MODELS_DIR = path.join(__dirname, 'models');
const MODEL_PATH = path.join(MODELS_DIR, 'tinyllama-1.1b.gguf');

async function downloadModel() {
    if (!fs.existsSync(MODELS_DIR)) {
        fs.mkdirSync(MODELS_DIR);
    }

    if (fs.existsSync(MODEL_PATH)) {
        console.log("Model already exists at: " + MODEL_PATH);
        return;
    }

    console.log("Downloading small offline model (TinyLlama)...");
    console.log("This may take a few minutes (approx 600MB)...");

    try {
        const response = await axios({
            url: MODEL_URL,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(MODEL_PATH);

        let downloadedBytes = 0;
        const totalBytes = parseInt(response.headers['content-length'], 10);

        response.data.on('data', (chunk) => {
            downloadedBytes += chunk.length;
            const progress = ((downloadedBytes / totalBytes) * 100).toFixed(2);
            process.stdout.write(`\rProgress: ${progress}%`);
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log("\nDownload complete!");
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error("\nError downloading model: " + error.message);
        process.exit(1);
    }
}

downloadModel();
