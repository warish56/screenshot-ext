
export default class History{

    constructor(){
        this.domIds = {
            historyList: "historyList",
            clearHistoryBtn: "clearHistory",
        }
        this.selectors = {
            emptyState: ".empty-state",
            deleteBtn: ".delete-btn",
            historyItem: ".screenshot-item",
        }
    }

    deleteHistoryItem = async (id) => {
        chrome.runtime.sendMessage({ action: 'BG_DELETE_HISTORY_ITEM', id: parseInt(id) });
        const historyList = document.getElementById(this.domIds.historyList);
        historyList.querySelector(`[data-id="image_${id}"]`).remove();
        if (!historyList.children.length) {
            historyList.innerHTML = `<div class="${this.selectors.emptyState.split('.')[1]}">No screenshots yet</div>`;
        }
    }


    addToHistory = async (data) => {
        const historyList = document.getElementById(this.domIds.historyList);
        const div = document.createElement('div');
        div.className = this.selectors.historyItem.split('.')[1];
        div.dataset.id = `image_${data.id}`;
        div.innerHTML = `
            <img src="${data.imageData}" alt="Screenshot" />
            <button class="${this.selectors.deleteBtn.split('.')[1]}">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
            </button>
        `;
        const deleteBtn = div.querySelector(this.selectors.deleteBtn);
        deleteBtn.addEventListener('click', () => {
            this.deleteHistoryItem(data.id);
        });
        historyList.appendChild(div);
    }

    loadHistory = async () => {
        const response = await chrome.runtime.sendMessage({ 
            action: 'BG_GET_HISTORY'
        });

        if (response.history && response.history.length > 0) {
            const historyList = document.getElementById(this.domIds.historyList);
            historyList.innerHTML = ''; // Clear empty state
            response.history.forEach((item) => {
                this.addToHistory(item);
            });
        }
    }

    clearAllHistory = async () => {
        chrome.runtime.sendMessage({ action: 'BG_CLEAR_HISTORY' });
        const historyList = document.getElementById(this.domIds.historyList);
        historyList.innerHTML = `<div class="${this.selectors.emptyState.split('.')[1]}">No screenshots yet</div>`;
    }


    addNewHistoryItem = async (data=[]) => {
        data.forEach((item) => {
            this.addToHistory(item);
        });
    }

}