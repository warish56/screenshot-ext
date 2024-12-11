
let fixedElements = [];
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

const handleScrollToTop = async (sendResponse) => {
    await scrollToTop();
    sendResponse({ success: true });
}

const handleBodyAdjustments = async (sendResponse) => {
    hideFixedElements();
    await waitFor(100);
    fixBodyHeight();
    await waitFor(100);
    sendResponse({ success: true });
}

const handleScroll = async (sendResponse) => {
    const status = scrollView();
    await waitFor(100);
    sendResponse({ status, success: true });

}

const resetAdjustments = () => {
    showFixedElements();
    resetBodyHeight();
    fixedElements = [];
    initialBodyHeight = 0;
}

