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

exports.api = functions.https.onRequest(app);
