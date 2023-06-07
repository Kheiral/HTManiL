const judgementLine = document.getElementById('line')
const comboNumber = document.getElementById('combo');
const judgement = document.getElementById('judgement');
const difSelector = document.getElementById('dif-selector');
const scrollSpeedText = document.getElementById('scroll-speed');
const offsetText = document.getElementById('offset');
const pauseOverlay = document.getElementById('pause-screen');
const resumeButton = document.getElementById('resume-button');
const retryButton = document.getElementById('retry-button');
const quitButton = document.getElementById('quit-button');
const downloadPercent = document.getElementById('download-percent');
const accuracyText = document.getElementById('accuracy');
const scoreText = document.getElementById('score');
const progressBar = document.getElementById('progress-bar');
const _0countText = document.getElementById('_0-count');
const _50countText = document.getElementById('_50-count');
const _100countText = document.getElementById('_100-count');
const _200countText = document.getElementById('_200-count');
const _300countText = document.getElementById('_300-count');
const _320countText = document.getElementById('_320-count');
const ratioText = document.getElementById('user-ratio');
const mapInput = document.getElementById("map-id-input");
const startButton = document.getElementById("start-button");
const urBar = document.getElementById('ur-bar');
const playArea = document.getElementById('playarea');
let frameCounter = 0;
let initialTiming;
let initialOffsetPX;
let previousTimestamp = null;
let modeBpmBeatLength = 0;
let lastTime;
let initialSV;
heldNotes = [false];
erroredHold = [false];
sentInput = [false];
gamePaused = false;
noteID = 0;
altPressed = false;
shiftPressed = false;
ctrlPressed = false;
let scrollSpeedVar
let scrollSpeed
let visualOffset
let audioOffset

function readFromCache() {
  // Check if the browser supports the Cache API
  if ('caches' in window) {
    // Open the "userVars" cache and retrieve the stored response
    caches.open('userVars')
      .then((cache) => {
        return cache.match('userData');
      })
      .then((response) => {
        if (response) {
          // Parse the response body as JSON to get the user variables
          return response.json();
        } else {
          scrollSpeedVar = 32;
          scrollSpeed = 3.2; // pixels per millisecond
          visualOffset = 0;
          audioOffset = 0;
          writeToCache();
          throw new Error('No data found in cache');
        }
      })
      .then((userVars) => {
        // Use the retrieved user variables
        scrollSpeedVar = userVars.scrollSpeedVar
        scrollSpeed = userVars.scrollSpeed;
        visualOffset = userVars.visualOffset;
        audioOffset = userVars.audioOffset;

        // Do something with the user variables
        console.log('Scroll Speed Var:', scrollSpeedVar);
        console.log('Scroll Speed:', scrollSpeed);
        console.log('Visual Offset:', visualOffset);
        console.log('Audio Offset:', audioOffset);
      })
      .catch((error) => {
        console.error('Failed to read from cache:', error);
      });
  }
}

function writeToCache() {
  // Check if the browser supports the Cache API
  if ('caches' in window) {
    // Open or create the "userVars" cache
    caches.open('userVars')
      .then((cache) => {
        // Store the user's variables in the cache
        const userVars = {
          scrollSpeedVar,
          scrollSpeed,
          visualOffset,
          audioOffset
        };
        const response = new Response(JSON.stringify(userVars));
        cache.put('userData', response);
      })
      .catch((error) => {
        console.error('Failed to open the cache:', error);
      });
  }
}

readFromCache();

//USER MODIFIABLE VARIABLES WITHOUT IMPLEMENTATION
let fpsCounter = false;
let autoplay = false;
//END OF USER MODIFIABLE VARIABLES
let judgeTextSize = 40;
let bigJudgeTextSize = judgeTextSize * 1.25;
//const unZipper = new JSZip();
var odMod = 1;
let audio;
let perfTW;
let greatTW;
let goodTW;
let badTW;
let missTW;
retryCount = 0;
let downscrollMod = 'bottom';
let hitPosition = 30;

function loadSkinStyle(){
  if (window.selectedSkin) {
    playArea.style.width = window.styleVars.playfieldWidth;
    playArea.style.borderRight = window.styleVars.playfieldBorderSize + ' solid ' + window.styleVars.playfieldBorderColor;
    playArea.style.borderLeft = playArea.style.borderRight;
    document.getElementById('hit-count-container').style.right = window.styleVars.hitCountOffset_X;
  
    downscroll = window.styleVars.downscroll;
    judgeTextSize = parseInt(window.styleVars.judgementTextSize);
    bigJudgeTextSize = judgeTextSize * window.styleVars.judgeTextPopFactor
    hitPosition = parseInt(window.styleVars.hitPosition);
  
    accuracyText.style.fontSize = window.styleVars.accuracyTextSize
    comboNumber.style.fontSize = window.styleVars.comboTextSize
    scoreText.style.fontSize = window.styleVars.scoreTextSize
    urBar.style.height = window.styleVars.urBarHeight
  
    window.backgroundDim = window.styleVars.backgroundDim
    judgementLine.style.opacity = window.styleVars.judgementLineOpacity
  
    urBar.style.top = window.styleVars.urBarOffset_Y
    comboNumber.style.top = window.styleVars.comboOffset_Y
    judgement.style.top = window.styleVars.judgementOffset_Y
  
    judgementLine.style.backgroundColor = window.styleVars.judgementLineColor
    downscrollMod = downscroll ? 'bottom' : 'top';
    noteResize();
  }
}
judgementLine.style[downscrollMod] = hitPosition + 'px'

function receptorBuilder() {
  for (let i = 1; i < 5; i++) {
    if (window.selectedSkin) {
      const column = document.getElementById('col' + i);
      const receptor = document.createElement('img');
      receptor.src = window.selectedSkin[`${i}r.png`];
      receptor.style[downscrollMod] = (hitPosition - 4) + 'px';
      receptor.id = ('r' + i);
      receptor.classList.add('receptor');
      column.appendChild(receptor);
    }
    heldNotes.push(false);
    erroredHold.push(false);
    sentInput.push(false);
  }
}

function noteResize() {
  if (window.selectedSkin) {
    const noteHeightCalc = new Image();
    noteHeightCalc.src = window.selectedSkin[`1.png`]
    noteHeightCalc.onload = function () {
      const aspectRatio = noteHeightCalc.naturalWidth / noteHeightCalc.naturalHeight;
      const col1 = document.getElementById('col1');
      halfNoteHeight = (col1.clientWidth * aspectRatio) / 2;
      //console.log(halfNoteHeight);
    };
  }
  else {
    //code for default bar skin here
    halfNoteHeight = 0;
  }
}
noteResize();

window.addEventListener('resize', onWindowResize);
let resizeTimeout;
function onWindowResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    noteResize();
  }, 250);
}

async function start() {
  startButton.disabled = true;
  mapUrl = 'https://api.chimu.moe/v1/download/' + mapInput.value + '?n=1'
  downloadFile(mapUrl, mapInput.value);
}

async function downloadFile(mapUrl, mapID) {
  try {
    const response = await fetch(mapUrl);
    const contentLength = response.headers.get('content-length');
    const totalSize = contentLength ? parseInt(contentLength, 10) : null;
    let loadedSize = 0;

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const reader = response.body.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
      loadedSize += value.length;
      if (totalSize) {
        const progress = Math.round(loadedSize / totalSize * 100);
        downloadPercent.textContent = `Downloaded ${progress}%`;
      }
    }

    const blob = new Blob(chunks);
    const zip = await unZipper.loadAsync(blob);
    unZipFunction(zip);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
}

async function unZipFunction(zip) {
  const files = [];
  await Promise.all(
    Object.keys(zip.files).map(async (filename) => {
      if (filename.endsWith(".osu")) {
        const file = await zip.file(filename).async("string");
        finalFile = file.replace(/\r\n/g, "\n");
      }
      else {
        const file = await zip.file(filename).async("arraybuffer");
        finalFile = URL.createObjectURL(new Blob([file]));
      }
      files.push({ filename, file: finalFile });
    })
  );
  for (let i = 0; i < files.length; i++) {
    if (files[i].filename.endsWith(".osu")) {
      const fileContent = files[i].file;
      const metadataSection = fileContent.match(/\[Metadata\][\s\S]*?\n\n/);
      if (metadataSection) {
        const metadata = metadataSection[0].trim();
        const titleMatch = metadata.match(/Title:(.*)/);
        const artistMatch = metadata.match(/Artist:(.*)/);
        const creatorMatch = metadata.match(/Creator:(.*)/);
        const versionMatch = metadata.match(/Version:(.*)/);
        const sourceMatch = metadata.match(/Source:(.*)/);

        const version = versionMatch ? versionMatch[1].trim() : '';

        const button = document.createElement('button');
        button.textContent = version;
        button.id = i;
        difSelector.appendChild(button);
      }
    }
  }
  const difButtons = difSelector.querySelectorAll("button");
  difButtons.forEach((button) => {
    button.addEventListener("click", () => {
      //Get the id of the button that was clicked
      const id = button.id;
      //Disable all buttons
      difButtons.forEach(button => {
        button.disabled = true;
      });
      mapInput.style.display = 'none';
      difSelector.style.display = 'none';
      startButton.style.display = 'none';
      downloadPercent.style.display = 'none';
      skinDropdown.style.display = 'none';
      window.hitValue = 0;
      window.totalNotes = 0;
      //PARSE [HitObjects] FIELD
      const fileContent = files[id].file;
      window.hitObjects = fileContent.substring(fileContent.indexOf("[HitObjects]") + 13).trim();
      const hoLines = window.hitObjects.split("\n");
      const lastLine = hoLines[hoLines.length - 1];
      var [, , lastHOTime, , , lastHOTimeStr] = lastLine.split(',');
      lastHOTime = parseInt(lastHOTime);
      lastHOReleaseTime = parseInt(lastHOTimeStr.split(':')[0]); // parse release time if long note
      if (lastHOReleaseTime > lastHOTime) {
        window.finalTime = lastHOReleaseTime
      }
      else {
        window.finalTime = lastHOTime;
      }

      //PARSE [TimingPoints] FIELD
      rawTimingPoints = fileContent.substring(fileContent.indexOf("[TimingPoints]") + 15).trim();
      const timingPointsLines = rawTimingPoints.split('\n');

      timingPoints = [];
      for (const line of timingPointsLines) {
        if (line.startsWith("[HitObjects]") || line.trim() === "") {
          break; // Stop parsing when [HitObjects] or an empty line is encountered
        }
        var [offset, beatLength, meter, sampleIndex, sampleID, volume, unique, fx] = line.split(',');
        beatLength = parseFloat(beatLength);
        offset = parseFloat(offset);
        unique = !!parseInt(unique);
        timingPoints.push({ offset, beatLength, meter, sampleIndex, sampleID, volume, unique, fx });
      }

      initialTiming = timingPoints[0].offset
      const calcMap = new Map();
      previousBPMBeatLength = 0;
      for (let i = 0; i < timingPoints.length - 1; i++) {
        thisTimingPointLength = (timingPoints[i + 1].offset - timingPoints[i].offset)
        if (timingPoints[i].unique) {//If this is a unique timing point and does not inherit the previous BPM
          if (calcMap.get(timingPoints[i].beatLength)) {//If that beatlength already exists
            totalTimeAtBpm = calcMap.get(timingPoints[i].beatLength) + thisTimingPointLength;
          }
          else {//Otherwise, dont parse it
            totalTimeAtBpm = thisTimingPointLength
          }
          calcMap.set(timingPoints[i].beatLength, totalTimeAtBpm)
          previousBPMBeatLength = timingPoints[i].beatLength;
        }
        else if (timingPoints[i + 1]) {//If this inherits the previous BPM and does not define a new one, add it the time it runs for to the total time since the last BPM change
          totalTimeAtBpm = calcMap.get(previousBPMBeatLength) + thisTimingPointLength;
          calcMap.set(previousBPMBeatLength, totalTimeAtBpm);
        }
      }
      maxValue = Number.NEGATIVE_INFINITY;
      for (const [key, value] of calcMap.entries()) {
        if (value > maxValue) {
          maxValue = value;
          modeBpmBeatLength = key;
        }
      }
      console.log(modeBpmBeatLength);
      window.simplifiedSVArray = [];
      let totalSV = 1;
      let lastBPMSV = 1;
      let lastSimpleSV = 1;
      for (i = 0; i < timingPoints.length - 1; i++) {
        if (!timingPoints[i].unique) {
          lastSimpleSV = (-100 / timingPoints[i].beatLength);
        }
        else {
          lastBPMSV = modeBpmBeatLength / timingPoints[i].beatLength;
          lastSimpleSV = 1;
        }
        totalSV = parseFloat(lastSimpleSV * lastBPMSV);
        if (timingPoints[i + 1]) {
          svDuration = timingPoints[i + 1].offset - timingPoints[i].offset
        }
        else {
          svDuration = window.finalTime - timingPoints[i].offset;
        }
        window.simplifiedSVArray.push({
          'offset': timingPoints[i].offset,
          'SV': totalSV,
          'duration': svDuration,
        });
      }
      if (!window.simplifiedSVArray[1]) {
        initialSV = 1;
      }
      else if (window.simplifiedSVArray[0].offset == window.simplifiedSVArray[1].offset) {
        initialSV = window.simplifiedSVArray[1].SV;
      }
      else {
        initialSV = window.simplifiedSVArray[0].SV;
      }
      window.simplifiedSVArray.unshift({
        'offset': -3000,
        'SV': initialSV,
        'duration': timingPoints[0].offset + 3000,
      })
      window.simplifiedSVArray.push({
        'offset': window.finalTime + 1,
        'SV': totalSV,
        'duration': 0,
      })
      console.log(window.simplifiedSVArray)
      //PARSE [Difficulty] FIELD
      const difficultySelection = fileContent.match(/\[Difficulty\][\s\S]*?\n\n/);
      const difficultyInfo = difficultySelection[0].trim();
      const ODMatch = difficultyInfo.match(/OverallDifficulty:(.*)/);
      const fileOD = ODMatch ? ODMatch[1].trim() : '';
      const OD = fileOD * odMod;
      perfTW = 64 - (3 * OD);
      greatTW = 97 - (3 * OD);
      goodTW = 127 - (3 * OD);
      badTW = 151 - (3 * OD);
      missTW = 188 - (3 * OD);
      //PARSE [General] FIELD
      const generalSelection = fileContent.match(/\[General\][\s\S]*?\n\n/);
      const general = generalSelection[0].trim();
      const audioFilenameMatch = general.match(/AudioFilename:(.*)/);
      const audioFilename = audioFilenameMatch ? audioFilenameMatch[1].trim() : '';
      const audioFileIndex = files.findIndex(file => file.filename === audioFilename);
      audio = new Audio(files[audioFileIndex].file);
      //PARSE [Events] FIELD
      const eventsSelection = fileContent.match(/\[Events\][\s\S]*?\n\n/);
      const events = eventsSelection[0].trim();
      const eventLines = events.split('\n');
      let imageName = '';
      const startIndex = eventLines.indexOf("//Background and Video events");
      if (startIndex !== -1) {
        const line = eventLines[startIndex + 1]
        imageName = line.split(',')[2].replace(/"/g, '');
        //console.log('BG image: '+imageName);
      }
      const imageIndex = files.findIndex(file => file.filename.toLowerCase() === imageName.toLowerCase());
      document.body.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,${window.backgroundDim}), rgba(0,0,0,${window.backgroundDim})), url(${files[imageIndex].file})`;
      //STARTS THE CHART
      audio.volume = 0.05;
      mapStart();
    });
  });
}

function mapStart() {
  document.body.style.cursor = 'none';
  receptorBuilder();
  lastTime = null;
  comboNumber.textContent = 0;
  totalPausedTime = 0;
  timingPointIndex = 0;
  totalSVpxOffset = 0;
  scrolledDistance = 0;
  //window.currentOffset = window.simplifiedSVArray[0].offset;
  //window.currentSV = initialSV;
  window.hitValue = 0;
  score = 0;
  initialOffsetPX = initialTiming * scrollSpeed * initialSV;
  _320count = 0;
  _320countText.textContent = 0;
  _300count = 0;
  _300countText.textContent = 0;
  _200count = 0;
  _200countText.textContent = 0;
  _100count = 0;
  _100countText.textContent = 0;
  _50count = 0;
  _50countText.textContent = 0;
  _0count = 0;
  _0countText.textContent = 0;
  score = 0;
  scoreText.textContent = '0000000';
  totalHit = 0;
  noteID = 0;
  calcAcc();
  window.notes = mapSetup(window.hitObjects);
  gamePaused = false;
  audio.currentTime = 0;
  setTimeout(() => {
    if (!gamePaused) {
      audio.play();
    }
  }, 3000 + audioOffset);
  window.startTime = new Date(new Date().getTime() + 3000);
  adjustedTime = window.startTime;
  //previousTimestamp = -adjustedTime
  requestAnimationFrame(animateNotes);
}
function animateNotes() {
  const now = new Date();
  window.elapsed = now - adjustedTime;
  progressPercent = window.elapsed / window.finalTime
  frameCounter++;
  if (frameCounter >= 15) {
    if (progressPercent < 1) {
      progressBar.style.width = progressPercent * 100 + '%';
      frameCounter = 0;
    }
    // Update the progress bar here
    else {
      progressBar.style.width = '100%'
      document.body.style.cursor = 'auto';
    }
  }
  if (window.simplifiedSVArray[timingPointIndex]) {//If we're passed the most recent timing point assuming the timing point exists
    for (; window.simplifiedSVArray[timingPointIndex].offset < window.elapsed;) {
      window.currentSV = window.simplifiedSVArray[timingPointIndex].SV;
      //console.log('SV Change: ' + window.currentSV);
      //console.log('Time: '+window.elapsed);
      window.currentOffset = window.simplifiedSVArray[timingPointIndex].offset;
      if (timingPointIndex > 0) {
        const previousSV = window.simplifiedSVArray[timingPointIndex - 1];
        totalSVpxOffset += previousSV.SV * previousSV.duration * scrollSpeed;
      }
      timingPointIndex++
      if (!window.simplifiedSVArray[timingPointIndex]) {
        break;
      }
    }
  }
  currentSVpxOffset = (window.elapsed - window.currentOffset) * scrollSpeed * window.currentSV;
  //console.log(initialOffsetPX);
  //console.log('current: '+currentSVpxOffset);
  scrolledDistance = totalSVpxOffset + currentSVpxOffset //+ initialOffsetPX;
  //console.log(scrolledDistance)
  //CALCULATE FRAMERATE
  if (fpsCounter) {
    frameElapsed = window.elapsed - lastTime;
    document.getElementById('fps-counter').textContent = Math.round(1000 / frameElapsed) + 'FPS';
    lastTime = window.elapsed;
  }

  for (let i = 0; i < 100 && i < window.notes.length; i++) { //only calculate the most recent 100 notes
    const { note, time, holdBody, holdHead, releaseTime, held, colNum, ln, standardNoteOffset, standardLNheight } = window.notes[i];
    const delta = time - window.elapsed;
    if (autoplay) {
      //console.log('AUTO');
      if (Math.abs(delta) < 16) {
        hitNote(colNum);
        if (!ln) {
          releaseNote(colNum);
        }
      }
      if (releaseTime - window.elapsed < 16 && ln) {
        releaseNote(colNum);
      }
    }
    if (!held) {
      noteOffset = standardNoteOffset - scrolledDistance + hitPosition;
    }
    else if (delta > 0) {
      noteOffset = standardNoteOffset - scrolledDistance + hitPosition;
    }
    else if (!erroredHold[colNum]) {//If a note is held and is passed the judgement line
      noteOffset = hitPosition;
      if (releaseTime < window.elapsed) {
        holdBody.style.height = '0px'
      }
      else {
        holdBody.style.height = (standardNoteOffset - scrolledDistance + standardLNheight) + 'px';
      }
      if (parseInt(holdBody.style.height) <= halfNoteHeight) {
        holdBody.style.display = 'none'
        if (holdHead) {
          holdHead.style.display = 'none'
        }
      }
      if (holdHead) {
        holdHead.style[downscrollMod] = holdBody.style.height;
      }
    }
    if (noteOffset < window.innerHeight) {//if the note below the top of the screen
      note.style.display = 'block';
    }
    if (delta < -missTW && releaseTime <= 1) { //if you miss a note and it's NOT a long note
      const thisNote = window.notes.findIndex(note => note.colNum === colNum);
      window.notes.splice(thisNote, 1);
      missWithoutHit();
      //console.log("1")
      note.innerHTML = ""
      note.remove();
      continue;
    }
    else if (delta < -missTW && !erroredHold[colNum] && !held) {// if you miss the start of a long note
      erroredHold[colNum] = true;
      missWithoutHit();
      note.style.opacity = 0.5;
      console.log(colNum)
    }
    if ((releaseTime - window.elapsed) < -missTW && ln) {//Check if you miss the release of an ln
      const thisNote = window.notes.findIndex(note => note.colNum === colNum);
      erroredHold[colNum] = false;
      missWithoutHit();
      window.notes.splice(thisNote, 1);
      //console.log("3")
      note.innerHTML = ""
      note.remove();
      continue;
    }

    note.style[downscrollMod] = noteOffset + 'px';
    if (holdBody) {
      holdBody.style[downscrollMod] = halfNoteHeight + 'px';
      //console.log(holdOffset + " "+ noteOffset)
    }
  }
  if (!gamePaused && progressPercent < 1.1) {
    requestAnimationFrame(animateNotes);
  }
}

// Parse data and create note elements
function mapSetup(data) {
  const notes = data.split('\n').map(line => {
    var [x, , time, , , timeStr] = line.split(',');
    x = parseInt(x);
    time = parseInt(time);
    ln = false;
    held = false;
    var erroredHold = false;
    const releaseTime = parseInt(timeStr.split(':')[0]); // parse release time if long note
    if (releaseTime > time) {
      ln = true;
      window.totalNotes++
    }
    window.totalNotes++
    const note = document.createElement('div');
    note.classList.add('note');
    note.style.display = 'none';
    noteID++
    note.id = 'note' + noteID;
    const colNum = (Math.floor(Math.abs(((x / 64) - 1) / 2))) + 1
    const column = document.getElementById(`col${colNum}`);
    let holdBody;
    let holdHead;
    let standardLNheight;
    standardNoteOffset = calcNoteOffset(time)
    if (window.selectedSkin) {
      const noteImage = document.createElement('img');
      noteImage.src = window.selectedSkin[`${colNum}.png`]
      noteImage.classList.add('note-item');
      note.appendChild(noteImage);
      note.style.backgroundColor = 'transparent';
    }
    column.appendChild(note);
    if (ln) {
      standardLNheight = calcNoteOffset(releaseTime) - standardNoteOffset;
      holdBody = document.createElement('img');
      holdBody.classList.add('hold');
      holdBody.style.height = standardLNheight + 'px';
      holdBody.style[downscrollMod] = halfNoteHeight + 'px';
      note.appendChild(holdBody);
      if (window.selectedSkin) {
        holdBody.src = window.selectedSkin[`lnbody.png`];
        holdBody.style.backgroundColor = 'transparent';
        holdHead = document.createElement('img');
        holdHead.src = window.selectedSkin[`lntip.png`];
        holdHead.classList.add('hold-head');
        if (!downscroll) {
          holdHead.style.transform = 'scaleY(-1)';
        }
        holdHead.style[downscrollMod] = standardLNheight + 'px';
        holdHead.style.backgroundColor = 'transparent'
        note.appendChild(holdHead);
      }
    }
    return { note, time, holdBody, holdHead, releaseTime, held, colNum, erroredHold, noteID, ln, standardNoteOffset, standardLNheight };
  });
  return notes;
}
function calcNoteOffset(time) {
  let tpConstructor = 0;
  let calcNoteOffset = 0;
  for (; window.simplifiedSVArray[tpConstructor] && window.simplifiedSVArray[tpConstructor].offset < time; tpConstructor++) {
    if (window.simplifiedSVArray[tpConstructor]) {
      if (window.simplifiedSVArray[tpConstructor + 1] && window.simplifiedSVArray[tpConstructor + 1].offset > time && window.simplifiedSVArray[tpConstructor].offset < time) {
        //console.log(time - window.simplifiedSVArray[tpConstructor].offset)
        calcNoteOffset += window.simplifiedSVArray[tpConstructor].SV * (time - window.simplifiedSVArray[tpConstructor].offset) * scrollSpeed;
        break
      }
      else {
        calcNoteOffset += (window.simplifiedSVArray[tpConstructor].duration) * window.simplifiedSVArray[tpConstructor].SV * scrollSpeed;
      }
    }
  }
  //console.log(calcNoteOffset);
  return calcNoteOffset;
}


//KEY INPUT

const col1 = document.getElementById('col1');
const col2 = document.getElementById('col2');
const col3 = document.getElementById('col3');
const col4 = document.getElementById('col4');

function missWithoutHit() {
  judgement.textContent = 'MISS';
  judgement.style.color = '#ff0000';
  comboNumber.textContent = 0;
  _0count++
  totalHit++
  _0countText.textContent = _0count;
  calcAcc();
  judgeTextAnimate();
}

function noteJudge(hitError) {
  comboNumber.textContent++;
  const urNote = document.createElement('div');
  urNote.classList.add('ur-note');
  urNote.style.transform = `translate(${hitError * -2}px, 0)`
  netError = Math.abs(hitError);
  let judgementText;
  let judgeColor;
  switch (true) {
    case netError < 16:
      judgementText = 'MARVELOUS';
      judgeColor = '#53c3ef';
      window.hitValue += 320;
      _320count++
      _320countText.textContent = _320count;
      if (_300count == 0) {
        ratioText.textContent = (_320count).toFixed(2) + ':0';
      }
      else {
        ratioText.textContent = (_320count / _300count).toFixed(2) + ':1';
      }
      break;
    case netError < perfTW:
      judgementText = 'PERFECT';
      judgeColor = '#ffe061';
      window.hitValue += 300;
      _300count++
      _300countText.textContent = _300count;
      if (_320count == 0) {
        ratioText.textContent = (1 / _320count).toFixed(2) + ':1';
      }
      else {
        ratioText.textContent = (_320count / _300count).toFixed(2) + ':1';
      }
      break;
    case netError < greatTW:
      judgementText = 'GREAT';
      judgeColor = '#41ff18';
      window.hitValue += 200;
      _200count++
      _200countText.textContent = _200count;
      break;
    case netError < goodTW:
      judgementText = 'GOOD';
      judgeColor = '#57acff';
      window.hitValue += 100;
      _100count++
      _100countText.textContent = _100count;
      break;
    case netError < badTW:
      judgementText = 'BAD';
      judgeColor = '#b900e4';
      window.hitValue += 50;
      _50count++
      _50countText.textContent = _50count;
      break;
    default:
      judgementText = 'MISS';
      judgeColor = '#ff0000';
      comboNumber.textContent = 0;
      _0count++
      _0countText.textContent = _0count;
      break;
  }
  judgeTextAnimate();
  urNote.style.backgroundColor = judgeColor + '33';
  judgement.textContent = judgementText;
  judgement.style.color = judgeColor;
  totalHit++
  urBar.appendChild(urNote);
  if (urBar.childElementCount > 50) {
    urBar.removeChild(urBar.firstChild);
  }
  calcAcc();
}

function judgeTextAnimate() {
  judgement.style.transition = "";
  judgement.style.opacity = 1;
  judgement.style.fontSize = bigJudgeTextSize + 'px';

  // Clear the previous timeout if it exists
  if (judgement.timeoutId) {
    clearTimeout(judgement.timeoutId);
  }
  if (judgement.timeoutId2) {
    clearTimeout(judgement.timeoutId2);
  }

  // Assign a new timeout ID to the input element
  judgement.timeoutId = setTimeout(() => {
    requestAnimationFrame(() => {
      judgement.style.fontSize = judgeTextSize + 'px';
      judgement.style.transition = "font-size 0.1s";
    });
  }, 0);
  judgement.timeoutId2 = setTimeout(() => {
    judgement.style.opacity = 0;
    judgement.style.transition = "opacity 0.1s";
  }, 500);
}

const keyToColumnMap = {
  'z': 1,
  'x': 2,
  '.': 3,
  '/': 4
};

document.addEventListener('keydown', function (event) {
  const keyPressed = event.key.toLowerCase();
  if (keyPressed === 'tab' || keyPressed === 'enter') { // Disable buttons that could be annoying
    event.preventDefault();
  }
  if (event.keyCode === 91 || event.keyCode === 92) { // pause code goes here
    pauseGame();
  }
  if (keyPressed === 'escape') {
    if (gamePaused) {
      resumeGame();
    }
    else if (gamePaused == false) {
      pauseGame();
    }
  }
  if (keyPressed === 'control') {
    ctrlPressed = true;
  }

  if (keyPressed === 'shift') {
    shiftPressed = true;
  }

  if (keyPressed === 'alt') {
    altPressed = true;
  }

  if (keyPressed === 'f4') {
    event.preventDefault();
    scrollSpeedVar++
    scrollSpeed = scrollSpeedVar / 10;
    fadeoutText(scrollSpeedText);
    scrollSpeedText.textContent = `Scroll Speed: ${scrollSpeed} pixels/ms`
    writeToCache();
  }

  if (keyPressed === 'f3') {
    event.preventDefault();
    scrollSpeedVar--
    scrollSpeed = scrollSpeedVar / 10;
    fadeoutText(scrollSpeedText);
    scrollSpeedText.textContent = `Scroll Speed: ${scrollSpeed} pixels/ms`
    writeToCache();
  }

  if (keyPressed === '=' || keyPressed === '+') {
    event.preventDefault()
    if (shiftPressed) {
      if (altPressed) {
        visualOffset += 1
      }
      else {
        visualOffset += 5
      }
    }
    else if (ctrlPressed) {
      if (altPressed) {
        audioOffset += 1
      }
      else {
        audioOffset += 5
      }
    }
    offsetText.textContent = `Visual Offset: ${visualOffset}ms\nAudio Offset: ${audioOffset}ms`
    fadeoutText(offsetText);
    writeToCache();
  }
  if (keyPressed === '-' || keyPressed === '_') {
    event.preventDefault()
    if (shiftPressed) {
      if (altPressed) {
        visualOffset -= 1
      }
      else {
        visualOffset -= 5
      }
    }
    else if (ctrlPressed) {
      if (altPressed) {
        audioOffset -= 1
      }
      else {
        audioOffset -= 5
      }
    }
    offsetText.textContent = `Visual Offset: ${visualOffset}ms\nAudio Offset: ${audioOffset}ms`
    fadeoutText(offsetText);
    writeToCache();
  }
  if (!gamePaused && !autoplay) {
    for (let key in keyToColumnMap) {
      const column = keyToColumnMap[key];
      if (keyPressed === key && !sentInput[column]) {
        event.preventDefault();
        hitNote(column);
        //console.log(notes[hitNoteIndex].note);
        //break;
      }
    }
  }
});

function fadeoutText(input) {
  input.style.transition = "";
  input.style.opacity = 1;
  // Clear the previous timeout if it exists
  if (input.timeoutId) {
    clearTimeout(input.timeoutId);
  }
  // Assign a new timeout ID to the input element
  input.timeoutId = setTimeout(() => {
    input.style.opacity = 0;
    input.style.transition = "opacity 1s ease-out";
  }, 1000);
}

document.addEventListener('keyup', function (releaseEvent) {// Upon release
  const keyReleased = releaseEvent.key.toLowerCase();
  if (keyReleased === 'control') {
    ctrlPressed = false;
  }
  if (keyReleased === 'shift') {
    shiftPressed = false;
  }
  if (keyReleased === 'alt') {
    altPressed = false;
  }
  if (!gamePaused && !autoplay) {
    for (let key in keyToColumnMap) {
      if (keyReleased === key) {
        releaseEvent.preventDefault();
        const column = keyToColumnMap[key];
        releaseNote(column);
      }
    }
  }
});

function calcAcc() {
  currentAccuracy = 100 * (((300 * (_320count + _300count)) + (200 * _200count) + (100 * _100count) + (50 * _50count)) / (300 * totalHit))
  if (isNaN(currentAccuracy)) {
    currentAccuracy = 100
  }
  accuracyText.textContent = currentAccuracy.toFixed(2) + '%';
  score = (1000000 / window.totalNotes) * (window.hitValue / 320);
  if (isNaN(score)) {
    score = 0;
  }
  scoreText.textContent = String(score.toFixed(0)).padStart(7, '0');
}

document.addEventListener('visibilitychange', handleVisibilityChange, false);
function handleVisibilityChange() {
  if (document.hidden) {
    pauseGame();
  }
}

function pauseGame() {
  if (!gamePaused) {
    gamePaused = true;
    window.pauseStart = new Date()
    audio.pause();
    pauseOverlay.style.display = 'flex';
    document.body.style.cursor = 'auto';
  }
}

function resumeGame() {
  if (gamePaused) {
    document.body.style.cursor = 'none';
    pauseOverlay.style.display = 'none';
    setTimeout(() => {
      gamePaused = false;
      window.pauseEnd = new Date()
      totalPausedTime += (window.pauseEnd - window.pauseStart);
      adjustedTime = new Date(window.startTime.getTime() + totalPausedTime);
      if (window.elapsed < 0) {
        setTimeout(() => {
          audio.play();
        }, window.elapsed * -1)
      }
      else {
        audio.play();
      }

      animateNotes();
    }, 1000);
  }
}

resumeButton.addEventListener('click', () => resumeGame());
retryButton.addEventListener('click', () => restartMap());
quitButton.addEventListener('click', () => quitMap());

function restartMap() {
  retryCount++;
  for (let i = 1; i < 5; i++) {
    const column = document.getElementById('col' + i);
    column.innerHTML = ""
  }
  urBar.innerHTML = ""
  judgement.textContent = ""
  pauseOverlay.style.display = 'none';
  mapStart();
  window.hitValue = 0;
  score = 0;
  scoreText.textContent = '0000000';
  ratioText.textContent = '0.00:0'
  progressBar.style.width = '0%'
}

function quitMap() {
  location.reload();
}

function hitNote(column) {
  if (window.selectedSkin) {
    document.getElementById('r' + [column]).src = window.selectedSkin[`${column}rd.png`]
  }
  sentInput[column] = true;
  const hitNoteIndex = window.notes.findIndex(note => note.colNum === column);
  const hitNote = notes[hitNoteIndex];
  hitError = hitNote.time - window.elapsed + visualOffset;
  const hitNoteElement = document.getElementById(`note${hitNote.noteID}`);
  if (hitNote.ln && hitError < missTW && !heldNotes[column] && column) { // If it's a long note that isn't already held
    heldNotes[column] = true; // Add the note to the heldNotes array
    window.notes[hitNoteIndex].held = true; // Set the held value to true
    if (Math.abs(hitError) < missTW) {
      noteJudge(hitError);
    }
  }
  else if (Math.abs(hitError) < missTW && !hitNote.ln) { // If within miss timing window
    window.notes.splice(hitNoteIndex, 1);
    hitNoteElement.innerHTML = "";
    hitNoteElement.remove(); // Remove the hit note's element from the DOM
    noteJudge(hitError);
  }
}

function releaseNote(column) {
  if (window.selectedSkin) {
    document.getElementById('r' + [column]).src = window.selectedSkin[`${column}r.png`]
  }
  sentInput[column] = false;
  if (heldNotes[column]) {
    heldNotes[column] = false;
    erroredHold[column] = false;
    const releasedNoteIndex = window.notes.findIndex(note => note.colNum === column);
    const releasedNote = notes[releasedNoteIndex];
    const releaseNoteElement = document.getElementById(`note${releasedNote.noteID}`);
    releasedNote.held = false;
    releaseError = releasedNote.releaseTime - window.elapsed + visualOffset;
    noteJudge(releaseError);
    window.notes.splice(releasedNoteIndex, 1);
    releaseNoteElement.innerHTML = ""
    releaseNoteElement.remove(); // Remove the hit note's element from the DOM
  }
}

document.addEventListener('dragover', handleDragOver);
document.addEventListener('drop', handleFileDrop);

function handleDragOver(event) {
  event.preventDefault();
}

let mapLoaded = false;
function handleFileDrop(event) {
  if (!mapLoaded) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0]; // Get the first file
      if (file.name.endsWith('.osz')) {
        mapLoaded = true;
        const reader = new FileReader();
        reader.onload = async function (event) {
          const zipData = event.target.result;
          const zip = await unZipper.loadAsync(zipData)
          unZipFunction(zip);
        };
        reader.readAsArrayBuffer(file);
      }
    }
  }
}