import { 
    ActionTypes, 
    Events, 
    trackEvent,
    checkForUpdates,
} from './utils.js';

import {
    getAllHistory,
    clearHistory,
    deleteHistoryItem
} from './jobs/history.js';

import {
    takeFullPageScreenshot,
    captureSpecificPartOfPage
} from './jobs/screenshot.js';





/**
 * Handle command
 * 1. Take full page screenshot
 * 2. Capture specific part of page
 * 
 */
const handleCommand = async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if(command === ActionTypes.BG_TAKE_FULL_PAGE_SCREENSHOT){
    takeFullPageScreenshot(tab.id);
  }else if(command === ActionTypes.BG_CAPTURE_SPECIFIC_AREA){
    captureSpecificPartOfPage(tab.id);
  }
}


/**
 * Listening to incoming messages
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.action === ActionTypes.BG_TAKE_FULL_PAGE_SCREENSHOT){
        takeFullPageScreenshot(message.tabId);
        return true;
    }
    if(message.action === ActionTypes.BG_CAPTURE_SPECIFIC_AREA){
        captureSpecificPartOfPage(message.tabId);
        return true;
    }
    if(message.action === ActionTypes.BG_GET_HISTORY){
        getAllHistory().then((values) => sendResponse({history:values}));
        return true;
    }
    if(message.action === ActionTypes.BG_CLEAR_HISTORY){
        clearHistory();
        return true;
    }
    if(message.action === ActionTypes.BG_DELETE_HISTORY_ITEM){
        deleteHistoryItem(message.id);
        return true;
    } 
})


/**
 * Listening to keyboard shortcuts
 */
chrome.commands.onCommand.addListener((command) => {
  handleCommand(command);
});


/**
 *  Listening on Action btn clicked
 */
chrome.action.onClicked.addListener((tab) => {
    trackEvent(Events.POPUP_OPEN);
});


/**
 * Listeners 
 * 1. Check for updates 
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.action === ActionTypes.CHECK_UPDATES){
        checkForUpdates();
    }
})

// listening for new updates available
chrome.runtime.onUpdateAvailable.addListener(() => {
    chrome.runtime.reload()
})


/**
 * Listen for extension installed
 */
chrome.runtime.onInstalled.addListener((details) => {
    trackEvent(Events.EXTENSION_INSTALLED);
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        trackEvent(Events.EXTENSION_UNINSTALLED);
    }
})
