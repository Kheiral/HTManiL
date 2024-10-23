const difSelector = document.getElementById('dif-selector');
difButtons = difSelector.querySelectorAll("button");
beatmapInfoMap = new Map();
window.scoreMap = new Map();
var currentSelectedSR = '';

caches.open('scoreCache').then((cache) => {
    // Retrieve the cached response associated with the key
    cache.match('scoreData').then((response) => {
        // Convert the response to JSON
        if (response) {
            response.json().then((jsonData) => {
                // Convert the JSON object to a map
                var arrayData = Object.values(jsonData);
                arrayData.forEach(obj => {
                    if (Number.isInteger(obj[0])) {
                        window.scoreMap.set(obj[0], obj[1]);
                    }
                    else {
                        console.warn('Error with score cache');
                    }
                });
                //console.log(window.scoreMap);
            });
        }
        else {
            console.warn('No data found in score cache');
        }
    });
});

caches.open('mapCache').then((cache) => {
    // Retrieve the cached response associated with the key
    cache.match('mapData').then((response) => {
        // Convert the response to JSON
        if (response) {
            response.json().then((jsonData) => {
                // Convert the JSON object to a map
                var arrayData = Object.values(jsonData);
                //console.log(arrayData);
                arrayData.forEach(obj => {
                    if (Number.isInteger(obj[0])) {
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
        infoUrl = 'https://catboy.best/api/v2/s/' + setID
        const infoResponse = await fetch(infoUrl);
        if (!infoResponse.ok) {
            throw new Error('Info network response was not ok');
        }
        const infoJson = await infoResponse.json();
        console.log(infoJson.beatmaps);
        infoJson.beatmaps.forEach(obj => {
            if (obj.cs == 4) {
                const beatmapMapId = obj.id;
                // Exclude the BeatmapId from the value object
                const { BeatmapId, ...rest } = obj;
                rest.Title = infoJson.title
                rest.Artist = infoJson.artist
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
        console.log(beatmapInfoMap);
        generateButtons();
    }
}

async function generateButtons() {
    while (difSelector.firstChild) {
        difSelector.removeChild(difSelector.firstChild);
    }
    const beatmapArray = Array.from(beatmapInfoMap);
    beatmapArray.sort((a, b) => {
        return a[1].difficulty_rating - b[1].difficulty_rating;
    });
    beatmapArray.forEach((element) => {
        const button = document.createElement('button');
        button.id = element[0]
        var difRounded = Math.floor(element[1].difficulty_rating);
        if (difRounded == 0){difRounded = 1;}
        const currentDiff = difRounded > 10 ? '10star' : difRounded + 'star';
        const currentDiffButton = document.getElementById('Button'+currentDiff);
        currentDiffButton.classList.remove('disabledDiffButton');
        currentDiffButton.classList.add('enabledDiffButton')
        const titleDiv = document.createElement('div');
        const diffNameDiv = document.createElement('div');
        const artistDiv = document.createElement('div');
        const diffInfoContainer = document.createElement('div');
        titleDiv.classList.add('diffTitle');
        diffNameDiv.classList.add('diffText');
        artistDiv.classList.add('diffArtist')
        diffInfoContainer.classList.add('diffInfoContainer');
        artistDiv.textContent = element[1].Artist;
        titleDiv.textContent = element[1].Title;
        diffNameDiv.textContent = element[1].version + ' (' + Math.floor(element[1].difficulty_rating*100)/100 + ')'
        //diffRatingDiv.textContent
        button.appendChild(titleDiv);
        diffInfoContainer.appendChild(artistDiv);
        diffInfoContainer.appendChild(diffNameDiv);
        button.appendChild(diffInfoContainer)
        button.classList.add(currentDiff);
        button.classList.add('difficulty-button');
        button.style.display='none';
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
    if(currentSelectedSR){
        placeholder = currentSelectedSR;
        currentSelectedSR = '';
        changeDiffSelection('Button'+placeholder);
    }
}

async function changeDiffSelection(buttonId){
    var newSelectedSR = buttonId.match(/\d+star/)[0];
    if(currentSelectedSR!=newSelectedSR){
        var buttonsToHide = document.getElementsByClassName(currentSelectedSR);
        for (var i = 0; i < buttonsToHide.length; i++) {
            buttonsToHide[i].style.display = 'none';
        }
        var buttonsToShow = document.getElementsByClassName(newSelectedSR);
        for (var i = 0; i < buttonsToShow.length; i++) {
            buttonsToShow[i].style.display = 'flex';
        }
        currentSelectedSR=newSelectedSR;
    }
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