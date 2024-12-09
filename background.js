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

const takeFullPageScreenshot = async (tabId) => {
    try {
        trackEvent(Events.TAKE_FULL_PAGE_SCREEN_SHOT);
        await chrome.debugger.attach({ tabId }, "1.3");
        const screenShotsBase64 = [];
        let isCompleted = false;
    
        // 1. Scroll and capture screenshots
        while (!isCompleted) {
          const response = await waitForMessage(tabId, { action: ActionTypes.CNT_SCROLL });
          if (response?.status === ActionTypes.BG_COMPLETED) {
            isCompleted = true;
            break;
          }
          
          const screenshotResponse = await chrome.debugger.sendCommand(
            { tabId },
            "Page.captureScreenshot",
            { 
              format: FILE_FORMAT,
              quality: FILE_QUALITY
            }
          );
          screenShotsBase64.push(screenshotResponse.data);
        }
    
        await chrome.debugger.detach({ tabId });
        await waitForMessage(tabId, { action: ActionTypes.CNT_SHOW_FIXED_ELEMENTS });
    
        // 2. Split screenshots if more than 12
        const screenShots = splitScreenShots(screenShotsBase64);
    
        // 3. Show file size alert if more than 1 file
        if(screenShots.length > 1){
          const response = await waitForMessage(tabId, { action: ActionTypes.CNT_SHOW_FILE_SIZE_ALERT, noOfFiles: screenShots.length });
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
        await chrome.debugger.detach({ tabId }).catch(() => {});
      }
}   


const captureSpecificPartOfPage = async (tabId) => {
  try{
    trackEvent(Events.CAPTURE_SPECIFIC_PART);
    const response = await waitForMessage(tabId, { action: ActionTypes.CNT_CAPTURE_SPECIFIC_AREA });
    const {x, y, width, height} = response.clipOptions;

    if(width === 0 || height === 0){
      return;
    }

    await chrome.debugger.attach({ tabId: tabId }, "1.3");
    const screenshotResponse = await chrome.debugger.sendCommand(
        { tabId: tabId },
        "Page.captureScreenshot",
        { 
          format: FILE_FORMAT,
          quality: FILE_QUALITY
        }
    );
    await chrome.debugger.detach({ tabId: tabId });
    const stitchedBlob = await stitchImages([screenshotResponse.data], {sx: x, sy: y, width, height});
    await saveScreenshots([stitchedBlob]);
  } catch(err){
    console.error("Error capturing screenshot:", err);
    await chrome.debugger.detach({ tabId: tabId }).catch(() => {});
  }
}

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
