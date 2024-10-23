async function endOfChart(judgementArray, score, beatmapID){
    try{
        newScoreArray=scoreMap.get(beatmapID).push({score, judgementArray});
    }
    catch{
        console.log('First Score!');
        newScoreArray=[{score, judgementArray}];
    }

    scoreMap.set(beatmapID, newScoreArray);

    const scoreMapArray = Array.from(scoreMap);
                const jsonData = JSON.stringify(scoreMapArray);
                caches.open('mapCache').then(cache => {
                    // Store the JSON data in the cache
                    cache.put('mapData', new Response(jsonData));
                });
}