


const captureSpecificPartOfPage = (sendResponse) => {
    const {div, unMount:unMountDiv} = createSelectAreaDiv();
    const { unMount:unMountPointerDiv, setCoordinatesText, setCoordinates} = createPointerDiv();
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

        /**
         * We need to wait for 100ms so that the selected area get times to be unmounted from th ui
         * so that it should not be present in the screenshot
         */
        setTimeout(() => {
            sendResponse({ 
                success: true, 
                clipOptions
            });
        }, 100)
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
