async function endOfChart(judgementArray, score, beatmapID, accuracy, rate){

    var date = new Date();
    var dd = String(date.getDate()).padStart(2, '0');
    var mm = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = date.getFullYear();
    
    date = mm + '/' + dd + '/' + yyyy;

    if(newScoreArray=window.scoreMap.get(beatmapID)){
        newScoreArray.push({score, accuracy, judgementArray, date, rate})
    }
    else{
        console.log('First Score!');
        newScoreArray=[{score, accuracy, judgementArray, date, rate}];
    }
    window.scoreMap.set(beatmapID, newScoreArray);

    const scoreMapArray = Array.from(window.scoreMap);
                const jsonData = JSON.stringify(scoreMapArray);
                caches.open('scoreCache').then(cache => {
                    // Store the JSON data in the cache
                    cache.put('scoreData', new Response(jsonData));
                });
}