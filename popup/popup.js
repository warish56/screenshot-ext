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



const deleteHistoryItem = async (id) => {
    console.log("===deleteHistoryItem popup ===", id);
    chrome.runtime.sendMessage({ action: 'BG_DELETE_HISTORY_ITEM', id: parseInt(id) });
    const historyList = document.getElementById('historyList');
    historyList.querySelector(`[data-id="image_${id}"]`).remove();
    if (!historyList.querySelector('.screenshot-item')) {
        historyList.innerHTML = '<div class="empty-state">No screenshots yet</div>';
    }
}


const addToHistory = async (data) => {
    const historyList = document.getElementById('historyList');
    const div = document.createElement('div');
    div.className = 'screenshot-item';
    div.dataset.id = `image_${data.id}`;
    div.innerHTML = `
        <img src="${data.imageData}" alt="Screenshot" />
        <button class="delete-btn">
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
        </button>
    `;
    const deleteBtn = div.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        deleteHistoryItem(data.id);
    });
    historyList.appendChild(div);
}

const loadHistory = async () => {
    const response = await chrome.runtime.sendMessage({ 
        action: 'BG_GET_HISTORY'
    });

    if (response.history && response.history.length > 0) {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = ''; // Clear empty state
        response.history.forEach((item) => {
            addToHistory(item);
        });
    }
}

const clearAllHistory = async () => {
    chrome.runtime.sendMessage({ action: 'BG_CLEAR_HISTORY' });
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '<div class="empty-state">No screenshots yet</div>';
}


const addNewHistoryItem = async (data=[]) => {
    data.forEach((item) => {
        addToHistory(item);
    });
}

// Load history when popup opens
document.addEventListener('DOMContentLoaded', async () => {
   loadHistory();
});

// Handle clear history button
document.getElementById('clearHistory').addEventListener('click', () => {
    clearAllHistory();
});

chrome.runtime.onMessage.addListener((message) => {
    if(message.action === "EXT_HISTORY_UPDATED"){
        addNewHistoryItem(message.data);
    }
});
