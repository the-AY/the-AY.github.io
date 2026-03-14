/**
 * Shared Firebase Configuration
 * Use this to initialize Firebase across all your portfolio projects.
 */

const firebaseConfig = {
    apiKey: "AIzaSyC0dzlQJu8i5OErbnfYCWR75udGTFRg3Wc",
    authDomain: "gitprofile-bc717.firebaseapp.com",
    projectId: "gitprofile-bc717",
    storageBucket: "gitprofile-bc717.firebasestorage.app",
    messagingSenderId: "81796867460",
    appId: "1:81796867460:web:aa31559b0fbf7a3e5369d1",
    measurementId: "G-8B1CBVLGJD"
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