const stitchImages = async (base64Array) => {
  // Create bitmaps from base64 strings

  const blobPromises = base64Array.map(base64 => 
      fetch(`data:image/png;base64,${base64}`).then(r => r.blob())
  );

  const bitmapPromises = await Promise.allSettled(blobPromises).then(blobs => 
    blobs.map(blob => 
      createImageBitmap(blob.value)
    )
  );

  const bitmaps = await Promise.all(bitmapPromises);
  
  // Create canvas with combined height
  const canvas = new OffscreenCanvas(
    bitmaps[0].width,
    bitmaps[0].height * bitmaps.length
  );
  const ctx = canvas.getContext('2d');

  // Draw each bitmap onto the canvas
  bitmaps.forEach((bitmap, index) => {
    ctx.drawImage(bitmap, 0, index * bitmap.height);
    bitmap.close();
  });

  return canvas.convertToBlob({ type: 'image/png' });
};

const blobToBase64 = blob => {
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

const saveScreenshot = async (blob) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `screenshot-${timestamp}.png`;

  // Convert blob to base64
  const arrayBuffer = await blob.arrayBuffer();
  const base64String = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );

  chrome.downloads.download({
    url: `data:image/png;base64,${base64String}`,
    filename: filename,
    saveAs: true
  });
};

const waitForMessage = (tabId, message) => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      console.log("==response===", response);
      resolve(response);
    });
  });
};

const waitFor = (timeout = 100) => {
    return new Promise(resolve => {
        setTimeout(() => resolve(), timeout);
    });
}   


chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.debugger.attach({ tabId: tab.id }, "1.3");
    const screenShotsBase64 = [];
    let isCompleted = false;

    while (!isCompleted) {
      const response = await waitForMessage(tab.id, { action: "scroll" });
      if (response?.status === "COMPLETED") {
        isCompleted = true;
        break;
      }
      
      const screenshotResponse = await chrome.debugger.sendCommand(
        { tabId: tab.id },
        "Page.captureScreenshot",
        { format: "png", quality: 100 }
      );
      screenShotsBase64.push(screenshotResponse.data);
    }

    await chrome.debugger.detach({ tabId: tab.id });
    
    // Stitch images and save the blob directly
    const stitchedBlob = await stitchImages(screenShotsBase64);
    saveScreenshot(stitchedBlob);
    await waitForMessage(tab.id, { action: "showFixedElements" });

  } catch (err) {
    console.error("Error capturing screenshot:", err);
    await chrome.debugger.detach({ tabId: tab.id }).catch(() => {});
  }
}); 