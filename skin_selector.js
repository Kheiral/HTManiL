console.log('skin selector running');




//CHANGE THIS TO CHANGE YOUR SELECTED SKIN

window.selectedSkin = "pl0x";


function loadScript(url) {
    const script = document.createElement('script');
    script.src = url;
    document.head.appendChild(script);
}
  
loadScript(`./skins/${window.selectedSkin}/skin.js`);
loadScript(`script.js`);