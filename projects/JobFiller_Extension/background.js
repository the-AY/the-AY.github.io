// Initialize Context Menu
chrome.runtime.onInstalled.addListener(() => {
    createContextMenu();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'UPDATE_MENU') {
        createContextMenu();
    }
});

function createContextMenu() {
    chrome.contextMenus.removeAll(() => {
        const parent = chrome.contextMenus.create({
            id: "jobHunterParent",
            title: "Job Hunter Fill",
            contexts: ["editable"]
        });

        const fields = [
            { id: "fillName", title: "Paste Name" },
            { id: "fillEmail", title: "Paste Email" },
            { id: "fillPhone", title: "Paste Phone" },
            { id: "fillLinkedIn", title: "Paste LinkedIn" },
            { id: "fillPortfolio", title: "Paste Portfolio" },
            { id: "fillSummary", title: "Paste Summary/Cover Letter" }
        ];

        fields.forEach(field => {
            chrome.contextMenus.create({
                id: field.id,
                parentId: parent,
                title: field.title,
                contexts: ["editable"]
            });
        });
    });
}

// Handle Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    chrome.storage.sync.get(null, (data) => {
        let textToPaste = "";

        switch (info.menuItemId) {
            case "fillName": textToPaste = data.name; break;
            case "fillEmail": textToPaste = data.email; break;
            case "fillPhone": textToPaste = data.phone; break;
            case "fillLinkedIn": textToPaste = data.linkedin; break;
            case "fillPortfolio": textToPaste = data.portfolio; break;
            case "fillSummary": textToPaste = data.summary; break;
        }

        if (textToPaste) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (text) => {
                    const el = document.activeElement;
                    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
                        const start = el.selectionStart;
                        const end = el.selectionEnd;
                        const val = el.value;
                        el.value = val.substring(0, start) + text + val.substring(end);
                        el.selectionStart = el.selectionEnd = start + text.length;
                        el.dispatchEvent(new Event('input', { bubbles: true })); // Trigger listeners
                    }
                },
                args: [textToPaste]
            });
        } else {
            // Alert if empty
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => alert("No data saved for this field! Click the extension icon to set up your profile.")
            });
        }
    });
});
