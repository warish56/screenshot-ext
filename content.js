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
        return ActionTypes.BG_COMPLETED;
    }
    window.scrollBy({
        top: window.innerHeight,
        behavior: 'instant'
    });
    return ActionTypes.BG_SCROLLING;
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
      const status = snapshotCount > 0 ? scrollView() : ActionTypes.BG_SCROLLING;
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





const captureSpecificPartOfPage = (sendResponse) => {
    const {div, unMount:unMountDiv} = createSelectAreaDiv();
    const removeStyles = appendNonSelectStylesToBody();
    let initialX = 0;
    let initialY = 0;
    let finalWidth = 0;
    let finalHeight = 0;

  
    const onMouseUp = () => {
        removeMouseListeners();
        removeStyles();
        unMountDiv();
        const clipOptions = convertViewPortCoordinatesToImageCoordinates(initialX, initialY, finalWidth, finalHeight);
        sendResponse({ 
            success: true, 
            clipOptions
        });
    }

    const onMouseMove = (event) => {
        const {clientX, clientY} = event;
        const width = clientX - div.offsetLeft;
        const height = clientY - div.offsetTop;
        div.style.width = `${width}px`;
        div.style.height = `${height}px`;
        finalWidth = width;
        finalHeight = height;
    }

    const onMouseDown = (event) => {
        const {clientX, clientY} = event;
        div.style.left = `${clientX}px`;
        div.style.top = `${clientY}px`;
        initialX = clientX;
        initialY = clientY;
        document.body.addEventListener('mousemove', onMouseMove);
    }
    



    const addMouseListeners = () => {
        document.body.addEventListener('mousedown', onMouseDown);
        document.body.addEventListener('mouseup', onMouseUp);
    }
    
    const removeMouseListeners = () => {
        document.body.removeEventListener('mousedown', onMouseDown);
        document.body.removeEventListener('mouseup', onMouseUp);
        document.body.removeEventListener('mousemove', onMouseMove);
    }
     addMouseListeners();
}



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    switch(message.action){
        case ActionTypes.CNT_SCROLL:
            handleScroll(sendResponse);
            return true;
        case ActionTypes.CNT_SHOW_FIXED_ELEMENTS:
            resetAdjustments();
            sendResponse({ success: true });
            break;
        case ActionTypes.CNT_CAPTURE_SPECIFIC_AREA:
            captureSpecificPartOfPage(sendResponse);
            return true;
        case ActionTypes.CNT_SHOW_FILE_SIZE_ALERT:
            showFileSizeAlert(message.noOfFiles, sendResponse);
            return true;
        default:
            return true;
    }       
});


chrome.runtime.sendMessage({ action: ActionTypes.BG_CHECK_UPDATES });  