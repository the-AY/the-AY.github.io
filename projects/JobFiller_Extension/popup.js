import firebaseConfig from './firebase-config.js';

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

async function saveOptions() {
    const profile = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        linkedin: document.getElementById('linkedin').value,
        portfolio: document.getElementById('portfolio').value,
        summary: document.getElementById('summary').value
    };

    chrome.storage.sync.set(profile, async () => {
        // Notify background script to update context menu
        chrome.runtime.sendMessage({ type: 'UPDATE_MENU', profile: profile });

        const status = document.getElementById('status');
        status.textContent = 'Saving to Firebase...';

        try {
            if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
                // Remove non-alphanumeric chars for doc ID or use email base
                const docId = profile.email ? profile.email.replace(/[^a-zA-Z0-9]/g, '_') : 'anonymous_' + Date.now();
                const firebaseUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/job_hunter_profiles/${docId}?key=${firebaseConfig.apiKey}`;
                
                // Firestore REST API requires specific format
                const firestoreData = {
                    fields: {
                        name: { stringValue: profile.name },
                        email: { stringValue: profile.email },
                        phone: { stringValue: profile.phone },
                        linkedin: { stringValue: profile.linkedin },
                        portfolio: { stringValue: profile.portfolio },
                        summary: { stringValue: profile.summary },
                        updatedAt: { stringValue: new Date().toISOString() }
                    }
                };

                const res = await fetch(firebaseUrl, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(firestoreData)
                });
                
                if (res.ok) {
                    status.textContent = 'Profile saved to Firebase & locally.';
                } else {
                    status.textContent = 'Saved locally, but Firebase error.';
                    console.error("Firebase save failed:", await res.text());
                }
            } else {
                status.textContent = 'Options saved locally (No Firebase Key).';
            }
        } catch (e) {
            console.error("Firebase error", e);
            status.textContent = 'Saved locally (Firebase fetch failed).';
        }

        setTimeout(() => { status.textContent = ''; }, 2000);
    });
}

function restoreOptions() {
    chrome.storage.sync.get({
        name: '',
        email: '',
        phone: '',
        linkedin: '',
        portfolio: '',
        summary: ''
    }, (items) => {
        document.getElementById('name').value = items.name;
        document.getElementById('email').value = items.email;
        document.getElementById('phone').value = items.phone;
        document.getElementById('linkedin').value = items.linkedin;
        document.getElementById('portfolio').value = items.portfolio;
        document.getElementById('summary').value = items.summary;
    });
}
