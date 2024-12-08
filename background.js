import { 
    ActionTypes, 
    Events, 
    trackEvent,
    waitForMessage, 
    saveScreenshots,
    splitScreenShots,
    FILE_FORMAT,
    FILE_QUALITY,
    stitchImages,
    checkForUpdates
} from './background-utils.js';





/**
 * On Action btn click listener
 * 1. Track event  
 * 2. Attach debugger   
 * 3. Capture screenshots
 * 4. Split screenshots if more than 12
 * 5. Show file size alert if more than 1 file
 * 6. Stitch images and save
 */

chrome.action.onClicked.addListener(async (tab) => {
  try {
    trackEvent(Events.TAKE_SCREENSHOT);
    await chrome.debugger.attach({ tabId: tab.id }, "1.3");
    const screenShotsBase64 = [];
    let isCompleted = false;

    // 1. Scroll and capture screenshots
    while (!isCompleted) {
      const response = await waitForMessage(tab.id, { action: ActionTypes.SCROLL });
      if (response?.status === ActionTypes.COMPLETED) {
        isCompleted = true;
        break;
      }
      
      const screenshotResponse = await chrome.debugger.sendCommand(
        { tabId: tab.id },
        "Page.captureScreenshot",
        { 
          format: FILE_FORMAT,
          quality: FILE_QUALITY
        }
      );
      screenShotsBase64.push(screenshotResponse.data);
    }

    await chrome.debugger.detach({ tabId: tab.id });
    await waitForMessage(tab.id, { action: ActionTypes.SHOW_FIXED_ELEMENTS });

    // 2. Split screenshots if more than 12
    const screenShots = splitScreenShots(screenShotsBase64);

    // 3. Show file size alert if more than 1 file
    if(screenShots.length > 1){
      const response = await waitForMessage(tab.id, { action: ActionTypes.SHOW_FILE_SIZE_ALERT, noOfFiles: screenShots.length });
      if(!response.confirmed){
        return;
      }
    }
 
    // 4. Stitch images and save
    const blobs = [];
    for(let i = 0; i < screenShots.length; i++){
      const stitchedBlob = await stitchImages(screenShots[i]);
      blobs.push(stitchedBlob);
    }

    // 5. Save all files at once
    await saveScreenshots(blobs);

  } catch (err) {
    console.error("Error capturing screenshot:", err);
    await chrome.debugger.detach({ tabId: tab.id }).catch(() => {});
  }
}); 









/**
 * Listeners 
 * 1. Check for updates 
 * 2. Listen for new updates available
 * 3. Listen for extension installed
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

chrome.runtime.onInstalled.addListener((details) => {
    trackEvent(Events.EXTENSION_INSTALLED);
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        trackEvent(Events.EXTENSION_UNINSTALLED);
    }
})
