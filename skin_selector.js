console.log('skin selector running');
const skinDropdown = document.getElementById('skin-dropdown');

const unZipper = new JSZip();
const cacheName = 'skin-cache';
const dataKey = 'skin-cache-array';

document.addEventListener('dragover', handleDragOver);
document.addEventListener('drop', handleSkinDrop);

const defaultSkins = [
  'default',
  'pl0x',
  //'yugen',
  'attang',
  //'stepmania',
]

window.skinMap = new Map();

for (let i = 0; i < defaultSkins.length; i++) {
  const fileMap = {
    'skin.js': `./skins/${defaultSkins[i]}/skin.js`,
    '1r.png': `./skins/${defaultSkins[i]}/1r.png`,
    '2r.png': `./skins/${defaultSkins[i]}/2r.png`,
    '3r.png': `./skins/${defaultSkins[i]}/3r.png`,
    '4r.png': `./skins/${defaultSkins[i]}/4r.png`,
    '1rd.png': `./skins/${defaultSkins[i]}/1rd.png`,
    '2rd.png': `./skins/${defaultSkins[i]}/2rd.png`,
    '3rd.png': `./skins/${defaultSkins[i]}/3rd.png`,
    '4rd.png': `./skins/${defaultSkins[i]}/4rd.png`,
    '1.png': `./skins/${defaultSkins[i]}/1.png`,
    '2.png': `./skins/${defaultSkins[i]}/2.png`,
    '3.png': `./skins/${defaultSkins[i]}/3.png`,
    '4.png': `./skins/${defaultSkins[i]}/4.png`,
    'lnbody.png': `./skins/${defaultSkins[i]}/lnbody.png`,
    'lntip.png': `./skins/${defaultSkins[i]}/lntip.png`
  };
  window.skinMap.set(defaultSkins[i], fileMap)
}

let selectedSkinName = 'pl0x'
createDropdown();
window.selectedSkin = window.skinMap.get('pl0x');
loadScript(window.selectedSkin[`skin.js`]);

// Retrieve skin array from cache
caches.open(cacheName).then((cache) => {
  cache.match(dataKey).then((response) => {
    if (response) {
      response.text().then((json) => {
        try {
          const cacheData = JSON.parse(json);
          fileMap = {};
          for (let p = 0; p < cacheData.files.length; p++) {
            if (cacheData.files[p].filename.endsWith('.png')) {
              base64String = cacheData.files[p].file;
              const uint8Array = new Uint8Array([...atob(base64String)].map((char) => char.charCodeAt(0)));
              const arrayBuffer = uint8Array.buffer;
              fileURL = URL.createObjectURL(new Blob([arrayBuffer]));
            } else {
              fileURL = URL.createObjectURL(new Blob([cacheData.files[p].file]));
            }
            fileMap[cacheData.files[p].filename] = fileURL;
          }
          console.log('Loaded skin from cache')
          window.skinMap.set(cacheData.name, fileMap);
          window.selectedSkin = window.skinMap.get(cacheData.name);
          console.log('Selected: ' + cacheData.name)
          selectedSkinName = cacheData.name
          createDropdown();
          loadScript(window.selectedSkin[`skin.js`]);
        } catch (error) {
          console.error('Error parsing cache data:', error);
        }
      });
    } else {
      console.warn('No data found in skin cache');
    }
  }).catch((error) => {
    console.error('Error retrieving cache:', error);
  });
});


let droppedSkinName

function handleSkinDrop(event) {
  event.preventDefault();
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0]; // Get the first file
    droppedSkinName = file.name.replace('.zip', '');
    if (file.name.endsWith('.zip')) {
      console.log('.zip skin file dropped')
      const reader = new FileReader();
      reader.onload = async function (event) {
        const zipData = event.target.result;
        const zip = await unZipper.loadAsync(zipData)
        skinUnzipper(zip);
      };
      reader.readAsArrayBuffer(file);
    }
  }
}

async function skinUnzipper(zip) {
  fileMap = {};
  const cacheableFiles = []
  await Promise.all(
    Object.keys(zip.files).map(async (filename) => {
      if (filename.endsWith(".js")) {
        const file = await zip.file(filename).async("string");
        base64String = file;
        fileURL = URL.createObjectURL(new Blob([file]));
      }
      else {
        const file = await zip.file(filename).async("arraybuffer");
        fileURL = URL.createObjectURL(new Blob([file]));
        const uint8Array = new Uint8Array(file);
        base64String = btoa(String.fromCharCode.apply(null, uint8Array));
      }
      fileMap[filename] = fileURL
      cacheableFiles.push({ filename, file: base64String });
    })
  );
  cacheData = {
    name: droppedSkinName,
    files: cacheableFiles
  }
  window.skinMap.set(droppedSkinName, fileMap);
  caches.open(cacheName).then((cache) => {
    const json = JSON.stringify(cacheData);
    console.log('Added skin to cache');
    cache.put(dataKey, new Response(json));
  });
  console.log(window.skinMap)
  window.selectedSkin = window.skinMap.get(droppedSkinName);
  console.log('Selected: ' + droppedSkinName)
  selectedSkinName = droppedSkinName
  createDropdown();
  loadScript(window.selectedSkin[`skin.js`]);
}

function loadScript(url) {
  const script = document.createElement('script');
  script.src = url;
  document.head.appendChild(script);
}

function createDropdown() {
  skinDropdown.innerHTML = ""
  console.log(window.skinMap)
  window.skinMap.forEach((value, key) => {
    const option = document.createElement('option');
    //console.log(key)
    option.value = key;
    option.textContent = key;
    skinDropdown.appendChild(option);
    skinDropdown.value = selectedSkinName;
  });
}

function handleSelectionChange() {
  selectedSkinName = skinDropdown.value;
  if(skinDropdown.value === 'default'){
    window.selectedSkin = false
    loadScript('./default_skin.js');
  }
  else{
    window.selectedSkin = window.skinMap.get(skinDropdown.value)
    loadScript(window.selectedSkin[`skin.js`]);
  }
}

skinDropdown.addEventListener('change', handleSelectionChange);