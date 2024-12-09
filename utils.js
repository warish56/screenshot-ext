

const ActionTypes = {
    CNT_SHOW_FILE_SIZE_ALERT: "CNT_SHOW_FILE_SIZE_ALERT",
    CNT_CAPTURE_SPECIFIC_AREA: "CNT_CAPTURE_SPECIFIC_AREA",
    CNT_SHOW_FIXED_ELEMENTS: "CNT_SHOW_FIXED_ELEMENTS",
    CNT_SCROLL: "CNT_SCROLL",

    BG_SCROLLING: "BG_SCROLLING",
    BG_COMPLETED: "BG_COMPLETED",
    BG_CHECK_UPDATES: "BG_CHECK_UPDATES",
}   




 const getScrollableBody = () => {
    return document.documentElement;
}

 const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'instant'
    });
}

 const waitFor = (timeout = 100) => {
    return new Promise(resolve => {
        setTimeout(() => resolve(), timeout);
    });
}   


 const getFixedElements = () => {
    // Find all fixed elements and store them
    const elements = document.querySelectorAll('*');
    return [...elements].filter(element => {
      const style = window.getComputedStyle(element);
      return ['fixed', 'sticky'].includes(style.position) && style.opacity !== '0';
    });
  };
  

  const convertViewPortCoordinatesToImageCoordinates = (x, y, width, height) => {
    const dpr = window.devicePixelRatio || 1;
    return {
        x: Math.round(x * dpr),
        y: Math.round(y * dpr),
        width: Math.round(width * dpr),
        height: Math.round(height * dpr)
    }
  }



const createSelectAreaDiv = () => {
    const div = document.createElement('div');
    div.id = 'capture-specific-part-of-page';
    div.style.border = '1px dashed black';
    div.style.position = 'fixed';
    div.style.width = '0px';
    div.style.height = '0px';
    div.style.inset = '0';
    div.style.zIndex = '100000';
    document.body.appendChild(div);

    const unMount = () => {
        div.remove();
    }
    return {div, unMount};
}

const appendNonSelectStylesToBody = () => {
    const style = document.createElement('style');
    style.textContent = `
        * {
            user-select: none !important;
            cursor: crosshair !important;
        }
    `;
    document.head.appendChild(style);
    return () => {
        style.remove();
    }
}
