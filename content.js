let fixedElements = [];
let snapshotCount = 0;
let initialBodyHeight = 0;



const hideFixedElements = () => {
    const currentFixedElements = getFixedElements();
    currentFixedElements.forEach((element) => {
        element.style.opacity = '0';
    });
    fixedElements = currentFixedElements;
}

const showFixedElements = () => {
    // Restore fixed elements
    fixedElements.forEach((element) => {
      element.style.opacity = '1';
    });
    
  };


const fixBodyHeight = () => {
    const scrollableBody = getScrollableBody();
    const bodyHeight = scrollableBody.scrollHeight;
    const windowHeight = window.innerHeight;
    const steps = Math.round(bodyHeight / windowHeight);
    scrollableBody.style.height = `${steps * windowHeight}px`;
    initialBodyHeight = bodyHeight;
}

const resetBodyHeight = () => {
    const scrollableBody = getScrollableBody();
    scrollableBody.style.height = `${initialBodyHeight}px`;
}


const showFileSizeAlert = (noOfFiles, sendResponse) => {
    const confirmed = confirm(`File size is too large to process, Screenshots will split into ${noOfFiles} files`);
    sendResponse({ success: true, confirmed });
}


const scrollView = () => {
    const scrollableBody = getScrollableBody();
    if (window.scrollY + window.innerHeight >= scrollableBody.scrollHeight) {
        return ActionTypes.COMPLETED;
    }
    window.scrollBy({
        top: window.innerHeight,
        behavior: 'instant'
    });
    return ActionTypes.SCROLLING;
};



const handleScroll = async (sendResponse) => {
    await waitFor(100);
    if(snapshotCount === 0){
        /**
         * Always Scroll to top before taking a snapshot
         */
        scrollToTop();
        await waitFor(100);
    }

    // Only hide fixed elements after the first snapshot is taken
    if (snapshotCount === 1) {
        hideFixedElements();
        await waitFor(100);
        fixBodyHeight();
        await waitFor(100);
      }
      const status = snapshotCount > 0 ? scrollView() : ActionTypes.SCROLLING;
      snapshotCount++
      sendResponse({ status, success: true });

}



const resetAdjustments = () => {
    showFixedElements();
    resetBodyHeight();
    fixedElements = [];
    snapshotCount = 0;
    initialBodyHeight = 0;
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === ActionTypes.SCROLL) {
    handleScroll(sendResponse);
    return true;
  }

  if(message.action === ActionTypes.SHOW_FIXED_ELEMENTS){
    resetAdjustments();
    sendResponse({ success: true });
  }

  if(message.action === ActionTypes.SHOW_FILE_SIZE_ALERT){
    showFileSizeAlert(message.noOfFiles, sendResponse);
    return true;
  }
});


chrome.runtime.sendMessage({ action: ActionTypes.CHECK_UPDATES });  