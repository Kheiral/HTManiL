const difSelector = document.getElementById('dif-selector');
difButtons = difSelector.querySelectorAll("button");
beatmapInfoMap = new Map();

console.log('menu script running')

caches.open('mapCache').then((cache) => {
    // Retrieve the cached response associated with the key
    cache.match('mapData').then((response) => {
        // Convert the response to JSON
        if (response) {
            response.json().then((jsonData) => {
                // Convert the JSON object to a map
                var arrayData = Object.values(jsonData);
                arrayData.forEach(obj => {
                    if (isInteger(obj[0]) && obj[0] != undefined) {
                        beatmapInfoMap.set(obj[0], obj[1]);
                    }
                    else {
                        console.warn('Error with map cache');
                    }
                });
                generateButtons();
            });
        }
        else {
            console.warn('No data found in map cache');
        }
    });
});

async function retrieveMapInfo() {//This uses the API to get info such as SR, Difficulty, etc. of maps to be displayed for the user to select
    const regex = /beatmapsets\/(\d+)#/;
    const match = mapInput.value.match(regex);
    mapInput.value = '';
    if (match) {
        setID = match[1]
        console.log("Isolated ID:", setID);
    } else if (Number.isInteger(parseInt(mapInput.value, 10))) {
        setID = mapInput.value
    }
    else {
        console.log("No match found.");
    }
    if (setID) {
        infoUrl = 'https://api.chimu.moe/v1/set/' + setID
        const infoResponse = await fetch(infoUrl);
        if (!infoResponse.ok) {
            throw new Error('Info network response was not ok');
        }
        const infoJson = await infoResponse.json();
        infoJson.ChildrenBeatmaps.forEach(obj => {
            if (obj.CS == 4) {
                const beatmapMapId = obj.BeatmapId;
                // Exclude the BeatmapId from the value object
                const { BeatmapId, ...rest } = obj;
                rest.Title = infoJson.Title_Unicode
                rest.Artist = infoJson.Artist_Unicode
                rest.Creator = infoJson.creator
                // Set the BeatmapId as the key and the rest of the data as the value
                beatmapInfoMap.set(beatmapMapId, rest);
                const beatmapInfoArray = Array.from(beatmapInfoMap);
                const jsonData = JSON.stringify(beatmapInfoArray);
                caches.open('mapCache').then(cache => {
                    // Store the JSON data in the cache
                    cache.put('mapData', new Response(jsonData));
                });
            }
        });
        generateButtons();
    }
}

async function generateButtons() {
    while (difSelector.firstChild) {
        difSelector.removeChild(difSelector.firstChild);
    }
    const beatmapArray = Array.from(beatmapInfoMap);
    beatmapArray.sort((a, b) => {
        return a[1].DifficultyRating - b[1].DifficultyRating;
    });
    beatmapArray.forEach((element) => {
        const button = document.createElement('button');
        button.id = element[0]
        button.textContent = element[1].Title + '\n' + element[1].DiffName + ' (' + element[1].DifficultyRating + ')'

        difSelector.appendChild(button);
    })
    difButtons = difSelector.querySelectorAll("button");
    difButtons.forEach((button) => {
        button.addEventListener("click", () => {
            //Get the id of the button that was clicked
            downloadFile(parseInt(button.id));
            //Disable all buttons
            difButtons.forEach(button => {
                button.disabled = true;
                difSelector.style.display = 'none';
            });
        });
    });
}

const settingsButton = document.getElementById("settings-btn");
const settingsMenu = document.getElementById("settings-menu");
var settingsOpen = false;
var editingSetting = false;

settingsButton.addEventListener("click", function() {
    if(!settingsOpen){
        this.style.transform = "rotate(-135deg)";
        settingsMenu.style.right = "0px"
        settingsOpen = true;
    }
    else if(!editingSetting){
        this.style.transform = "rotate(0deg)"; 
        settingsMenu.style.right = "-500px"
        settingsOpen = false;
    }
});

const keybindInputBoxes = document.querySelectorAll('.keybind-input');

// Add event listeners to each textbox
keybindInputBoxes.forEach((textbox, index) => {
    textbox.addEventListener('input', function() {
        if (textbox.value.length >= 1) {
        // If the current textbox is filled up, disable it and focus on the next one
        keyBinds[index]=textbox.value
        console.log(keyBinds);
        textbox.readOnly = true;
        const nextTextboxIndex = index + 1;
        if (nextTextboxIndex < keybindInputBoxes.length) {
        keybindInputBoxes[nextTextboxIndex].readOnly = false;
        keybindInputBoxes[nextTextboxIndex].focus();
        } else {
            editingSetting = false;
            textbox.blur();
            rebindKeys(); 
        }
        }
    });
});

  window.addEventListener('mousedown', function(event) {
    if(editingSetting){
        event.preventDefault();
    }
  });

const keybindDiv = document.getElementById('keybinds');
keybindDiv.addEventListener('click', function(){
    keyBinds=["","","",""];
    rebindKeys();
    editingSetting = true;
    keybindInputBoxes[0].readOnly = false;
    keybindInputBoxes[0].focus();
});

const backgroundDimSlider = document.getElementById('background-dim-slider');
backgroundDimSlider.addEventListener('input', function() {
  backgroundDim = backgroundDimSlider.value/100;
  writeToCache();
});

const masterVolumeSlider = document.getElementById('master-volume');
masterVolumeSlider.addEventListener('input', function() {
  masterVolume = masterVolumeSlider.value/100;
  writeToCache();
});