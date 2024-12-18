export const ActionTypes = {

    CNT_RESET_BODY_ADJUSTMENTS: "CNT_RESET_BODY_ADJUSTMENTS",
    CNT_SCROLL: "CNT_SCROLL",
    CNT_SHOW_FILE_SIZE_ALERT: "CNT_SHOW_FILE_SIZE_ALERT",
    CNT_CAPTURE_SPECIFIC_AREA: "CNT_CAPTURE_SPECIFIC_AREA",
    CNT_SCROLL_TO_TOP: "CNT_SCROLL_TO_TOP",
    CNT_APPLY_BODY_ADJUSTMENTS: "CNT_APPLY_BODY_ADJUSTMENTS",


    BG_CHECK_UPDATES: "BG_CHECK_UPDATES",
    BG_SCROLLING: "BG_SCROLLING",
    BG_COMPLETED: "BG_COMPLETED",
    BG_CAPTURE_SPECIFIC_AREA: "BG_CAPTURE_SPECIFIC_AREA",
    BG_TAKE_FULL_PAGE_SCREENSHOT: "BG_TAKE_FULL_PAGE_SCREENSHOT",
    BG_GET_HISTORY: "BG_GET_HISTORY",
    BG_CLEAR_HISTORY: "BG_CLEAR_HISTORY",
    BG_DELETE_HISTORY_ITEM: "BG_DELETE_HISTORY_ITEM",
    BG_DOWNLOAD_SCREENSHOT: "BG_DOWNLOAD_SCREENSHOT",


    EXT_HISTORY_UPDATED: "EXT_HISTORY_UPDATED",

};

export const Events = {
    TAKE_FULL_PAGE_SCREEN_SHOT: "screen_shot",
    CAPTURE_SPECIFIC_PART: 'capture_specific_part',
    POPUP_OPEN: 'popup_open',
    EXTENSION_INSTALLED: "extension_installed",
    FILE_SAVED: "file_saved",
    EXTENSION_UNINSTALLED: "extension_uninstalled",
};

export const MixPanel = {
    TOKEN: 'MmFmOTY3MDUxMjY4ZDczZWU0MmQ4NmIwODYyMmQ1YWU6',
    PROJECT_ID: "3501236",
};

export const MAX_SCREENSHOTS_PER_FILE = 20;
export const FILE_FORMAT = "png";
export const FILE_QUALITY = 100;
export const MAX_HISTORY_ITEMS = 10;

export const DbData = {
  dbName: "screenshot",
  dbVersion: 3,
  tables:{
    history:{
      tableName: "history",
      keyPath: "id"
    }
  }
}

export const generateUserId = () => {
    let id='';
    for(let i=0; i<2; i++){
        id += Math.random().toString(36).substring(2, 15);
    }
    return id;  
};

export const waitForMessage = (tabId, message) => {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            resolve(response);
        });
    });
};

export const waitFor = (timeout = 100) => {
    return new Promise(resolve => {
        setTimeout(() => resolve(), timeout);
    });
}; 

export const getUserId = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(["userId"], (res) => {
            if(res.userId){
                resolve(res.userId);
            }else{
                const userId = generateUserId();
                chrome.storage.local.set({ userId });
                resolve(userId);
            }
        })
    })
}

export const trackEvent = async (event) => {
    const userId = await getUserId();
    fetch(`https://api.mixpanel.com/import?strict=1&project_id=${MixPanel.PROJECT_ID}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            accept: 'application/json',
            authorization: `Basic ${MixPanel.TOKEN}`
        },
        body: JSON.stringify([{
            event: event,
            properties: {
                extension_id: chrome.runtime.id,
                time: Date.now(),
                distinct_id: userId,
                "$insert_id": `${Date.now()}`
            }
        }])
    }).then(async res => {
        if(res.ok){
            console.log("Event tracked successfully");
        }else{
            const resJson = await res.json();
            throw resJson;
        }
    }).catch(err => {
        console.error("Error tracking event:", err);
    })
}

export const blobToBase64 = blob => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // reader.result contains the base64 string
      // Remove the data URL prefix (data:image/png;base64,)
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

};


export const splitScreenShots = (screenShotsBase64) => {
    const screenShotsCount = screenShotsBase64.length;
    const noOfFiles = Math.ceil(screenShotsCount / MAX_SCREENSHOTS_PER_FILE);
    const base64Array = [];

    for(let i = 0; i < noOfFiles; i++){
      const startIndex = i * MAX_SCREENSHOTS_PER_FILE;
      const endIndex = startIndex + MAX_SCREENSHOTS_PER_FILE;
      base64Array.push(screenShotsBase64.slice(startIndex, endIndex));
    }

    return base64Array;
}   



export const saveScreenshots = async (blobs) => {
    try {
      const timestamp = Date.now();
      
      // Convert all blobs to base64 in parallel
      const base64Promises = blobs.map(async (blob, index) => {
        const base64 = await blobToBase64(blob);
        return {
          base64,
          filename: `screenshot-${timestamp}-part${index + 1}.${FILE_FORMAT}`
        };
      });
  
      const files = await Promise.all(base64Promises);
  
      // Download all files
      const downloadPromises = files.map(file => 
        chrome.downloads.download({
          url: `data:image/${FILE_FORMAT};base64,${file.base64}`,
          filename: file.filename,
          saveAs: false  // Set to false to avoid multiple save dialogs
        })
      );
  
      await Promise.all(downloadPromises);
      trackEvent(Events.FILE_SAVED);
    } catch (err) {
      console.error("Error saving screenshots:", err);
    }
  };



export const stitchImages = async (base64Array, clipOptions=null) => {
    try {

      // Create bitmaps one at a time to manage memory better
      const blobsPromise = base64Array.map((base64) => fetch(`data:image/${FILE_FORMAT};base64,${base64}`).then(res  => res.blob()));
      const blobs = await Promise.all(blobsPromise);

      const {sx=0, sy=0, width=0, height=0} = clipOptions ?? {};
      const btimapsPromise = blobs.map((blob) => clipOptions ?  createImageBitmap(blob, sx, sy, width, height) : createImageBitmap(blob));
      const bitmaps = await Promise.all(btimapsPromise);

      // Calculate total height
      const totalHeight = bitmaps.reduce((height, bitmap) => height + bitmap.height, 0);
      
      // Create canvas with combined height
      const canvas = new OffscreenCanvas(
        bitmaps[0].width,
        totalHeight
      );
      const ctx = canvas.getContext('2d');
  
      // Draw each bitmap onto the canvas
      let currentY = 0;
      for (const bitmap of bitmaps) {
        ctx.drawImage(bitmap, 0, currentY);
        currentY += bitmap.height;
      }
  
      // Create blob with full quality
      const blob = await canvas.convertToBlob({ 
        type: `image/${FILE_FORMAT}`,
        quality: 1.0
      });
  
      return blob;
  
    } catch (err) {
      console.error('Error in stitchImages:', err);
      throw err;
    }
  };

  

export const checkForUpdates = () => {
    chrome.runtime.requestUpdateCheck();
}

/**
 * Convert base64 string to Blob
 * @param {string} base64Data - The base64 string (can include data URL prefix)
 * @returns {Blob} - The converted Blob
 */
export const base64ToBlob = (base64Data) => {
    // Get the base64 content after the comma
    const base64Content = base64Data.split(',')[1];
    
    // Create array buffer from base64
    const byteCharacters = atob(base64Content);
    const byteArray = new Uint8Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
    }
    
    return new Blob([byteArray], { type: `image/${FILE_FORMAT}`});
};

  