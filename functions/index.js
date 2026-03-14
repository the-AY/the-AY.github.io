const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();

const app = express();
app.use(cors({ origin: true }));

/**
 * Basic API Status endpoint
 */
app.get("/status", (req, res) => {
    res.json({
        status: "online",
        timestamp: new Date().toISOString(),
        message: "Portfolio API is running"
    });
});

/**
 * Example endpoint to handle Job Hunter stats
 * (In a real MERN-like stack, this replaces direct client-side Firestore access)
 */
app.post("/log-analysis", async (req, res) => {
    try {
        const data = req.body;
        const db = admin.firestore();

        // Log to collection
        await db.collection("analysis_logs").add({
            ...data,
            serverTimestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update global stats
        const statsRef = db.doc("system/stats");
        await statsRef.set({ totalAnalyzed: admin.firestore.FieldValue.increment(1) }, { merge: true });

        res.status(200).send({ success: true });
    } catch (error) {
        console.error("Error logging analysis:", error);
        res.status(500).send({ error: error.message });
    }
});

/**
 * Verify ReCAPTCHA Enterprise token
 */
app.post("/verify-recaptcha", async (req, res) => {
    try {
        const { token, action } = req.body;
        if (!token) {
            return res.status(400).send({ error: "Missing recaptcha token" });
        }

        const apiKey = process.env.RECAPTCHA_ENTERPRISE_API_KEY;
        const projectId = "gitprofile-bc717"; 
        
        if (!apiKey) {
            console.error("Missing RECAPTCHA_ENTERPRISE_API_KEY environment variable.");
            return res.status(500).send({ error: "Server misconfiguration" });
        }

        const url = `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`;

        // Create the assessment request body
        const assessmentBody = {
            event: {
                token: token,
                siteKey: "6LeGOIosAAAAADWpRO-7-TkSa867lKEBvFVY4_xb",
                expectedAction: action || "LOGIN"
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assessmentBody)
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.error("ReCAPTCHA Enterprise API error:", data);
            return res.status(500).send({ error: "Failed to communicate with reCAPTCHA API" });
        }

        // Check if the token is valid
        if (data.tokenProperties && data.tokenProperties.valid) {
            // Usually, you also check the score (0.0 to 1.0) to see if it's a bot
            // data.riskAnalysis.score
            const score = data.riskAnalysis ? data.riskAnalysis.score : 0;
            res.status(200).send({ 
                success: true, 
                score: score,
                action: data.tokenProperties.action
            });
        } else {
            console.warn("Invalid token:", data.tokenProperties?.invalidReason);
            res.status(400).send({ 
                error: `Invalid token: ${data.tokenProperties?.invalidReason || 'Unknown reason'}`
            });
        }
    } catch (error) {
        console.error("Error verifying recaptcha:", error);
        res.status(500).send({ error: error.message });
    }
});

exports.api = functions.https.onRequest(app);
