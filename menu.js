beatmapInfoMap = new Map();

caches.open('mapCache').then((cache) => {
    // Retrieve the cached response associated with the key
    cache.match('mapData').then((response) => {
        // Convert the response to JSON
        if(response){
            response.json().then((jsonData) => {
                // Convert the JSON object to a map
                const mapData = new Map(Object.entries(jsonData));
                beatmapInfoMap = mapData;
                console.log(beatmapInfoMap);
            });
        }
        else{
            console.log('No data found in the cache or cache name does not exist.');
        }
    });
});



async function retrieveMapInfo() {//This uses the API to get info such as SR, Difficulty, etc. of maps to be displayed for the user to select
    const regex = /beatmapsets\/(\d+)#/;
    const match = mapInput.value.match(regex);
    if (match) {
      setID = match[1]
      console.log("Isolated ID:", setID);
    } else if(Number.isInteger(parseInt(mapInput.value, 10))){
      setID = mapInput.value
    }
    else{
      console.log("No match found.");
    }
    if(setID){
        infoUrl = 'https://api.chimu.moe/v1/set/' + setID
        startButton.disabled = true;
        const infoResponse = await fetch(infoUrl);
        if (!infoResponse.ok) {
            throw new Error('Info network response was not ok');
        }
        const infoJson = await infoResponse.json();
        infoJson.ChildrenBeatmaps.forEach(obj => {
            const beatmapMapId = obj.BeatmapId;
            // Exclude the BeatmapId from the value object
            const { BeatmapId, ...rest } = obj;
            rest.Title=infoJson.Title_Unicode
            rest.Artist=infoJson.Artist_Unicode
            rest.Creator=infoJson.creator
            // Set the BeatmapId as the key and the rest of the data as the value
            beatmapInfoMap.set(beatmapMapId, rest);
            const beatmapInfoArray = Array.from(beatmapInfoMap);
            const jsonData = JSON.stringify(beatmapInfoArray);
            caches.open('mapCache').then(cache => {
                // Store the JSON data in the cache
                cache.put('mapData', new Response(jsonData));
            });
        });
    }
}