import History from "./history.js";

const history = new History();


/**
 * Listen for full page screenshot click
 */
document.getElementById('fullPage').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.runtime.sendMessage({ 
        action: 'BG_TAKE_FULL_PAGE_SCREENSHOT',
        tabId: tab.id 
    });
    window.close();
});


/**
 * Listen for select area screenshot click
 */
document.getElementById('selectArea').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.runtime.sendMessage({ 
        action: 'BG_CAPTURE_SPECIFIC_AREA',
        tabId: tab.id 
    });
    window.close();
}); 


/**
 * Display extension version
 */
document.getElementById('ext_version').innerText = chrome.runtime.getManifest().version;




/**
 * Load history when popup opens
 */
document.addEventListener('DOMContentLoaded', async () => {
    history.loadHistory();
});

// Handle clear history button
document.getElementById('clearHistory').addEventListener('click', () => {
    history.clearAllHistory();
});




/**
 * Listen for history updated message
 */
chrome.runtime.onMessage.addListener((message) => {
    if(message.action === "EXT_HISTORY_UPDATED"){
        history.addToHistory(message.data);
    }
});
