/**
 * Shared Firebase Configuration
 * Use this to initialize Firebase across all your portfolio projects.
 */

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_ID",
    appId: "YOUR_APP_ID"
};

// Helper to check if Firebase is properly configured
export const checkFirebaseStatus = async (db) => {
    if (firebaseConfig.apiKey === "YOUR_API_KEY") {
        return { status: "pending", message: "Placeholder credentials detected. Please provide your actual Firebase config." };
    }
    try {
        // Attempt to read the stats doc as a connectivity test
        const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
        const snap = await getDoc(doc(db, "system", "stats"));
        return { status: "connected", message: "Successfully connected to Firestore!" };
    } catch (e) {
        return { status: "error", message: e.message };
    }
};

// Export for use in other modules
export default firebaseConfig;
