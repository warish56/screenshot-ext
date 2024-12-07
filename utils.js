

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
  