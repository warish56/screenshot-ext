



const showFileSizeAlert = (noOfFiles, sendResponse) => {
    const confirmed = confirm(`File size is too large to process, Screenshots will split into ${noOfFiles} files`);
    sendResponse({ success: true, confirmed });
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    switch(message.action){
        case ActionTypes.CNT_SCROLL:
            /**
             * check file - full_page_screenshot.js
             */
            handleScroll(sendResponse);
            return true;
        case ActionTypes.CNT_SHOW_FIXED_ELEMENTS:
            /**
             * check file - full_page_screenshot.js
             */
            resetAdjustments();
            sendResponse({ success: true });
            break;
        case ActionTypes.CNT_CAPTURE_SPECIFIC_AREA:
            /**
             * check file - specific-part-util.js
             */
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