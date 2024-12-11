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
    waitFor,
    base64ToBlob,
} from '../utils.js';

import {
    addToHistory,
    getHistory
} from './history.js';



const takeCurrentViewScreenshot = async (tabId=null) => {
  /**
   *  null tabId means capture current window
   */
    const dataUrl = await chrome.tabs.captureVisibleTab(tabId, {
        format: FILE_FORMAT,
        quality: FILE_QUALITY
    });
    return dataUrl.split(',')[1]; // Returns base64 without data URL prefix
};


/**
 * On Action btn click listener
 * 1. Track event  
 * 2. Attach debugger   
 * 3. Capture screenshots
 * 4. Split screenshots if more than 12
 * 5. Show file size alert if more than 1 file
 * 6. Stitch images and save
 */

export const takeFullPageScreenshot = async (tabId) => {
    try {
        trackEvent(Events.TAKE_FULL_PAGE_SCREEN_SHOT);
        const screenShotsBase64 = [];
        let isCompleted = false;


        // Scroll to top before taking a snapshot
        await waitForMessage(tabId, { action: ActionTypes.CNT_SCROLL_TO_TOP });
        // First Take the current view screenshot
        const screenshotResponse = await takeCurrentViewScreenshot();
        screenShotsBase64.push(screenshotResponse);


        // Apply body adjustments for fixed style elements
        await waitForMessage(tabId, { action: ActionTypes.CNT_APPLY_BODY_ADJUSTMENTS });
    
        // 2. Take rest of the views screenshots
        while (!isCompleted) {
          const response = await waitForMessage(tabId, { action: ActionTypes.CNT_SCROLL });
          if (response?.status === ActionTypes.BG_COMPLETED) {
            isCompleted = true;
            break;
          }
          const screenshotResponse = await takeCurrentViewScreenshot();
          screenShotsBase64.push(screenshotResponse);
          await waitFor(500);
        }
    
        await waitForMessage(tabId, { action: ActionTypes.CNT_RESET_BODY_ADJUSTMENTS });
    
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
        addToHistory(blobs);
      } catch (err) {
        console.error("Error capturing screenshot:", err);
        await waitForMessage(tabId, { action: ActionTypes.CNT_RESET_BODY_ADJUSTMENTS });
      }
}   


/**
 * Capture specific part of page
 * 1. Track event
 * 2. Wait for message
 * 3. Capture screenshot
 * 4. Stitch images and save
 * 5. Add to history
 */

export const captureSpecificPartOfPage = async (tabId) => {
    try{
      trackEvent(Events.CAPTURE_SPECIFIC_PART);
      const response = await waitForMessage(tabId, { action: ActionTypes.CNT_CAPTURE_SPECIFIC_AREA });
      const {x, y, width, height} = response.clipOptions;
  
      if(width === 0 || height === 0){
        return;
      }
  
      const screenshotResponse = await takeCurrentViewScreenshot();

      const stitchedBlob = await stitchImages([screenshotResponse], {sx: x, sy: y, width, height});
      await saveScreenshots([stitchedBlob]);
      addToHistory([stitchedBlob]);
    } catch(err){
      console.error("Error capturing screenshot:", err);
    }
  }
  
  

  export const downloadScreenshot = async(screenshotId) => {
    try {
        const screenshot = await getHistory(screenshotId);
        if (!screenshot) {
            throw new Error('Screenshot not found');
        }

        const blob = base64ToBlob(screenshot.imageData);
        await saveScreenshots([blob]);
    } catch (err) {
        console.error('Error downloading screenshot:', err);
    }
};