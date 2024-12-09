document.getElementById('fullPage').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.runtime.sendMessage({ 
        action: 'BG_TAKE_FULL_PAGE_SCREENSHOT',
        tabId: tab.id 
    });
    window.close();
});

document.getElementById('selectArea').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.runtime.sendMessage({ 
        action: 'BG_CAPTURE_SPECIFIC_AREA',
        tabId: tab.id 
    });
    window.close();
}); 

document.getElementById('ext_version').innerText = chrome.runtime.getManifest().version;