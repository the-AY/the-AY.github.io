document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

function saveOptions() {
    const profile = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        linkedin: document.getElementById('linkedin').value,
        portfolio: document.getElementById('portfolio').value,
        summary: document.getElementById('summary').value
    };

    chrome.storage.sync.set(profile, () => {
        // Notify background script to update context menu
        chrome.runtime.sendMessage({ type: 'UPDATE_MENU', profile: profile });

        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(() => { status.textContent = ''; }, 1500);
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
