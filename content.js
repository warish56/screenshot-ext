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
    const {div:pointerDiv, unMount:unMountPointerDiv, setCoordinatesText, setCoordinates} = createPointerDiv();
    const removeStyles = appendNonSelectStylesToBody();
    let initialX = 0;
    let initialY = 0;
    let finalWidth = 0;
    let finalHeight = 0;
    let hasMousePressed = false;


    /**
     * This function is called when user releases the mouse button
     * We need to remove the mouse listeners and remove the styles  
     * And then send the coordinates to the background script
     */
  
    const onMouseUp = () => {
        removeMouseListeners();
        removeStyles();
        unMountDiv();
        unMountPointerDiv();
        const clipOptions = convertViewPortCoordinatesToImageCoordinates(initialX, initialY, finalWidth, finalHeight);
        sendResponse({ 
            success: true, 
            clipOptions
        });
    }

    /**
     * This function is called when user is dragging the div
     * We need to update the width and height of the selected area
     * And then update the pointer div coordinates and its text
     */

    const onMouseMove = (event) => {
        const {clientX, clientY} = event;
        
        if(!hasMousePressed){
            setCoordinates(clientX, clientY);
            setCoordinatesText(clientX, clientY);
            return;
        }

        /**
         * Here width and height can be negative if user is dragging the div from bottom right or bottom left
         * and this is ok, because at the end we are passing this coordinates to createImageBitmap function
         * which accepts negative coordinates
         */
        const width = clientX - div.offsetLeft;
        const height = clientY - div.offsetTop;
        div.style.width = `${Math.abs(width)}px`;
        div.style.height = `${Math.abs(height)}px`;

        /**
         * If the width or height is negative, we need to translate the div to the left or top
         * This is the case when user is dragging the div from bottom right or bottom left
         */
        if(width < 0 || height < 0){
            div.style.transform = `translate(-${Math.abs(width)}px, -${Math.abs(height)}px)`;
        }

        setCoordinates(clientX, clientY);
        setCoordinatesText(hasMousePressed ? Math.abs(width) : clientX, hasMousePressed ? Math.abs(height) : clientY);

        finalWidth = width;
        finalHeight = height;
    }


    /**
     * This function is called when user presses the mouse button
     * We need to set the initial coordinates of the div
     * And then set the hasMousePressed flag to true
     */

    const onMouseDown = (event) => {
        const {clientX, clientY} = event;
        div.style.left = `${clientX}px`;
        div.style.top = `${clientY}px`;
        initialX = clientX;
        initialY = clientY;
        hasMousePressed = true;
    }
    



    const addMouseListeners = () => {
        document.body.addEventListener('mousedown', onMouseDown);
        document.body.addEventListener('mouseup', onMouseUp);
        document.body.addEventListener('mousemove', onMouseMove);
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