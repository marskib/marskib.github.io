'use strict';

//default table of phrases in case localStorage is empty:
let phrases = [
    "ZEGAR",    "ŁYŻKA",    "BLUZKA",    "CHLEB",       "CHOINKA",
    "CUKIERKI", "CZAJNIK",  "CZEKOLADA", "DZIEWCZYNKA", "DŁUGOPIS",
    "GRZEBIEŃ", "JABŁKO",   "KLOCKI",    "KOT",         "KREDKI",
    "KRZESŁO",  "KSIĄŻKA",  "LAMPA",     "MIOTŁA",      "MIŚ",
    "MYSZKA",   "MŁOTEK",   "NOŻYCZKI",  "NÓŻ",         "ODKURZACZ",
    "OKNO",     "OKULARY",  "OŁÓWEK",    "PIES",        "PILOT",
    "PIŁKA",    "PODUSZKA", "POMIDORY",  "RĘCZNIK",     "SPODNIE", 
    "SŁODYCZE", "TALERZ",   "WIDELEC",   "WIEŻA",       "ZEBRA", 
    ];    

let canvas  = document.getElementById('canvas');
let ctx = canvas.getContext('2d');


canvas.width  = window.innerWidth-7;
canvas.height = parseInt(0.93*window.innerHeight-10);

canvas.style.border = '3px solid gray';
canvas.style.letterSpacing = '.3em'; //Chrome only

let canvas_width = canvas.width;
let canvas_height = canvas.height;

//"goracy" Obszar, namiary:
const AREA_X1 = parseInt(0.02*canvas.width);
const AREA_Y1 = parseInt(0.75*canvas.height);
const AREA_X2 = parseInt(0.98*canvas.width);
const AREA_Y2 = parseInt(0.95*canvas.height);
/* ******************* */

const Y_TRIM = AREA_Y1 + parseInt((AREA_Y2 - AREA_Y1)/1.3); 

//Obrazek, namiary:
const PICT_X = AREA_X1;
const PICT_Y = parseInt(0.03*canvas.height);
const PICT_WIDTH  = parseInt(0.3*canvas.width); 
const PICT_HEIGHT = parseInt(0.5*canvas.height);
/* ******************* */

let positions = [];     //polozenia (potencjalne!) wyrazow na ekranie
const MAX_WORDS = 20;   //max. dozwolona liczba wyrazow
let words = [];         //tablica z wyrazami

let current_word_index = null;
let draggingMode = false;
let startX;
let startY;

class Word {
/* Wyraz/Litera zobrazowany(a) na ekranie.
   Obszar Wyrazu okreslany jest przez
   prostokąt/pudelko (może byc niewidoczne).
*/
    static #elemCount = 0;
    static #isBox = false;  //czy wyswietlac pudełko?
    
    #text;               //tekst Wyrazu
    #color = "black";    //kolor wyrazu
    
    //Pudelko na Wyraz.
    //w jego obrebie bedzie aktywna myszka; ulatwia ciagniecie i 'trimowanie'
    #boxX;
    #boxY;
    #boxWidth;
    #boxHeight;
    
    //polozenie tekstu Wyrazu w pudelku:
    #textX;
    #textY;
    #isInArea = false; //czy pudelko jest w obrębie "gorącego" Obszaru?

    constructor(word, x, y) {
        Word.#elemCount++;
        this.#text  = word;
        this.#boxX  = x;
        this.#boxY  = y;
        //Okreslenie wymiarow pudelka na wyraz i okreslenie pozycji wyrazu w pudelku:
        // ctx.font = '32px sans-serif';
        // ctx.font = '2em sans-serif';
        ctx.font = '600 9vh verdana, sans-serif';
        let metrics = ctx.measureText(word);
        let actualHeight = parseInt(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent);
        this.#boxWidth  = parseInt(metrics.width + ctx.measureText('l').width);
        this.#boxHeight = parseInt(actualHeight + ctx.measureText('b').width);
        this.#textX = parseInt(this.#boxX + this.#boxWidth/2 - ctx.measureText(this.#text).width/2 );
        this.#textY = parseInt(this.#boxY + ((this.#boxHeight+actualHeight)/2)-3);
    }

    static resetNumberOfElements() { Word.#elemCount = 0; }
    static getNumberOfElements() { return Word.#elemCount; }
    static setIsBox(value) { Word.#isBox = value; }

    getText  = function() {return this.#text;}
    setText  = function(value) {this.#text = value;}
    getTextX = function() {return this.#textX;}
    setColor = function(value) {this.#color = value;}

    getBoxX = function() {return this.#boxX;}
    getBoxY = function() {return this.#boxY;}
    getBoxWidth  = function() {return this.#boxWidth;}
    getBoxHeight = function() {return this.#boxHeight;}
    
    drawTheWord = function() {
        ctx.save();
        ctx.strokeStyle = (Word.#isBox)? "black" : "transparent";
        ctx.strokeRect(this.#boxX, this.#boxY, this.#boxWidth, this.#boxHeight);
        ctx.fillStyle=this.#color;
        ctx.fillText(this.#text, this.#textX, this.#textY);
        ctx.restore();
    }

    addToBoxX = function(dx) {
        this.#boxX  += dx;
        this.#textX += dx;
    }
    
    addToBoxY = function(dy) {
        this.#boxY  += dy;
        this.#textY += dy;
    }

    getIsInArea = function() { return this.#isInArea; }
    setIsInArea = function(value) { this.#isInArea = value; }
    
    areCoordinatesInArea = function(x1,y1,x2,y2) {
    /* Czy element znajduje sie fizycznie goracym Obszarze; badamy textX, textY */    
        if ( this.#textX>x1 && this.#textX<x2 && this.#textY>y1 && this.#textY<y2 ) {
            return true;
        }
        return false;
    }

    dragToTrimLine = function() {
    /* "Dragging" (=changing coordinates of the object) to the trimline in Area */
        let dy = Y_TRIM - (this.getBoxY() + this.getBoxHeight());
        this.addToBoxY(dy);
    }

} //koniec klasy Word

/* Konstruktor "pojemnika/polozenia" wyrazu na ekranie */
/*obiekty te posluza do przydzielania wyrazom poczatkowego, "losowego" polozenia*/
function Cell(x,y) {
    this.x = x;
    this.y = y;
    this.taken = false; //czy polozenie zajete/wolne
}

Cell.prototype.setOccupied = function(isTaken) {
    //Zajmij/zwolnij polozenie
    this.taken = isTaken;
}
/* "pojemnik/polozenie" - koniec definicji */

function hardCodeCellsPositions() {
    const DIST_FROM_LEFT = PICT_X+PICT_WIDTH+parseInt(0.03*canvas.width);
    const DIST_FROM_TOP  = parseInt(0.*canvas.height); 
    const DCOL = parseInt(0.16*canvas.width);   //distance between columns
    const DROW = parseInt(0.14*canvas.height);  //distance between rows
    for (let i=0; i<MAX_WORDS; i++) {
        let row = Math.floor(i/4);
        let col = i%4;
        positions.push(new Cell(DIST_FROM_LEFT + col*DCOL, DIST_FROM_TOP+ row*DROW));
        // positions.push(new Cell(DIST_FROM_LEFT + 0*DCOL, DIST_FROM_TOP+ row*DROW));
    }
}

function getFreeRandomPosition() {
//Z tablicy positions wybiera losowo wolną pozycję
    // wzor: let rnd = Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
    let rnd = Math.floor(Math.random()* MAX_WORDS);
    while (positions[rnd].taken) {
        rnd = Math.floor(Math.random()* MAX_WORDS);
    }
    return positions[rnd];
}

function howManyInArea() {
/* Ile Wyrazow znajduje sie obecnie w goracym Obszarze */  
  let count = 0;
  words.forEach( el=>( count=(el.getIsInArea())?count+1:count) );
  return count;
}

function getSortedTable(tbl) {
//Simple bubble sort as the table is small
//The sort is asc, by the left textX coordinate
    let sortOccured = true;
    while (sortOccured) {
        sortOccured = false;
        for (let i=0; i<tbl.length-1; i++) {
            if (tbl[i+1].getTextX() < tbl[i].getTextX()) {
                let tmp = tbl[i];
                tbl[i] = tbl[i+1];
                tbl[i+1] = tmp;
                sortOccured = true;
            }
        }
    }
    return tbl;
}

function getLeftmostElemIdx(table) {
//Finds the index of leftmost element in the Area
    let idxOfMin;
    let min = table[0].getTextX();
    for ( let i=0; i < table.length; i++) {
        if (table[i].getTextX() <= min) {
            idxOfMin = i;
            min = table[idxOfMin].getTextX();
        }
    }
    return idxOfMin;
}

function trimAndShowThePhrase(phr) {
//Showing the winning phrase (phr) in the Area and alligning it to the middle (trim) line.
//The phr is placed in the words["most on the left"] element, other elements are not shown
    let lftmIdx = getLeftmostElemIdx(words);
    phr = phr.replaceAll(' ','  '); //if Rozsypanka, wider gap between words - better for small childeren
    words[lftmIdx].setText(phr);
    let dy = Y_TRIM - (words[lftmIdx].getBoxY() + words[lftmIdx].getBoxHeight());
    words[lftmIdx].addToBoxY(dy);
    drawOnlyWordOnIdx(lftmIdx);
}

function allInArea(){
//What we do after all the words have been placed in the 'hot' Area.
//1.sprawdzenie, czy poprawnie ulozono
//2.if ok - 'trymowanie' - wyrownanie wyrazow wzdluz srodkowej linii
//3.sound effects

    //Sortujemy wyrazy w Area pod wzgledem polozenia - 
    //(najbardziej na lewo -> najbardziej na lewo w tablicy roboczej).
    //W ten sposob dowiemy sie CO zostalo ulozone:
    let tmpTbl = [...words];
    tmpTbl = getSortedTable(tmpTbl);

    //Getting the 'essence' from the tables (i.e. words without extra burden like coordinates, etc.)
    //Having done so, we'll be able to compare tables.
    //retrieving (as table) the phrase that has been set in Area:
    let phrInArea = [];
    tmpTbl.forEach(e => phrInArea.push(e.getText()));

    //retrieving (as table) the currentPhrase:
    let phrBeingGuessed = [];
    words.forEach(e => phrBeingGuessed.push(e.getText()));

    //actual comparing:
    if (phrInArea.toString() === phrBeingGuessed.toString()) { //Zwyciestwo!!!
        odegrajEfekty('ding.mp3',100, 'oklaski.mp3',800);
        setTimeout(trimAndShowThePhrase,500, currentPhrase);
        turnHandlersOff();
        setTimeout(enableButton, 1200, bNextTask);
    } else {
        odegrajEfekty("zle.mp3", 50);
        stopAnim = false;
        animate();
        setTimeout(()=>stopAnim = true,500);
    }
}

const isMouseInWord = function(x, y, word) {
    let word_left   = word.getBoxX();
    let word_right  = word.getBoxX() + word.getBoxWidth();
    let word_top    = word.getBoxY();
    let word_bottom = word.getBoxY() + word.getBoxHeight();

    if (x>word_left && x<word_right && y>word_top && y<word_bottom) {
        return true;
    }
    return false;
}

const mouse_down = function(event) {
    event.preventDefault();

    startX = parseInt(event.clientX);
    startY = parseInt(event.clientY);

    //dowiadujemy sie, na ktorym wyrazie/pudelku jest mysz:
    let index = 0;
    for (let word of words) {
        if (isMouseInWord(startX, startY, word)) {
            current_word_index = index;
            draggingMode = true;
            let elemPressed = words[current_word_index];
            elemPressed.setColor('red');
            drawAllObjects();
            return;
        }
        index++;
    }
}

const mouse_up = function(event) {
    if (!draggingMode) {
        return;
    }
    event.preventDefault();
    canvas.style.cursor = 'default';
    let elemDragged = words[current_word_index];
    if (elemDragged.areCoordinatesInArea(AREA_X1,AREA_Y1,AREA_X2,AREA_Y2)) {
        elemDragged.setIsInArea(true);
        elemDragged.dragToTrimLine();
        drawAllObjects();
    } else {
        elemDragged.setIsInArea(false);
    }
    
    elemDragged.setColor('black');
    drawAllObjects();
    
    draggingMode = false;
    if (howManyInArea() === Word.getNumberOfElements()) {
        allInArea();
    }
}

const mouse_out = function(event) {
    if (!draggingMode) {
        return;
    }
    event.preventDefault();
    draggingMode = false;
}

const mouse_move = function(event) {
    //jesli wchodzimy/wychodzimy w/z obreb(u) wyrazu - zmiana wskaznika myszy:
    let mouseX = parseInt(event.clientX);
    let mouseY = parseInt(event.clientY);
    let inWord = false;
    for (let word of words) {
        if (isMouseInWord(mouseX, mouseY, word)) {
            inWord = true;
            canvas.style.cursor = 'pointer';
            break;
        }
    }
    if (!inWord) canvas.style.cursor = 'default';
    
    //jesli z LKM wcisnietym - ciagniemy wyraz:
    if (!draggingMode) {
        return;
    } else {
        event.preventDefault();

        let dx = mouseX - startX;
        let dy = mouseY - startY;

        let current_word = words[current_word_index];
        
        current_word.addToBoxX(dx);
        current_word.addToBoxY(dy);

        drawAllObjects();

        startX = mouseX;
        startY = mouseY;
    }
}  

const turnHandlersOn = function() {
    canvas.onmousedown = mouse_down;
    canvas.onmouseup   = mouse_up;
    canvas.onmouseout  = mouse_out;
    canvas.onmousemove = mouse_move;
}

const turnHandlersOff = function() {
    canvas.onmousedown = null;
    canvas.onmouseup   = null;
    canvas.onmouseout  = null;
    canvas.onmousemove = null;      
}

const drawAllObjects = function() {
    ctx.clearRect(0,0, canvas_width, canvas_height);
    drawHotArea(AREA_X1, AREA_Y1, AREA_X2, AREA_Y2);
    placeCurrentImage();
    placeTheHint();
    for (let word of words)
      word.drawTheWord();
    }  

const drawOnlyWordOnIdx = function(idx) {
//drawing only ONE object -> words[idx] (plus other "constant" entities)   
//from the Area, after the phrase has been set correctly.
    ctx.clearRect(0,0, canvas_width, canvas_height);
    drawHotArea(AREA_X1, AREA_Y1, AREA_X2, AREA_Y2);
    placeCurrentImage();
    words[idx].drawTheWord();    
}

const drawHotArea = function(x1,y1,x2,y2) {
    ctx.save();
    ctx.strokeStyle = "maroon";
    ctx.lineWidth = 4;
    ctx.strokeRect(x1, y1, x2-x1, y2-y1);
    ctx.restore();
}

function placeCurrentImage() {
    if (!parameters.WITH_PICTURE) return;
    let x0 = currentImage.width;
    let y0 = currentImage.height;

    //proba 'upchniecia' w calej szerokosci poziomu:
    let y = (y0 * PICT_WIDTH) / x0;
    if (y <= PICT_HEIGHT) {
        ctx.drawImage(currentImage, PICT_X, PICT_Y, PICT_WIDTH, y);
    } else { //dosuwamy w pionie
        let x = (x0 * PICT_HEIGHT) / y0;

        //kosmetyka - zeby umiecic/"zawiesic" na srodku ramki
        let frameCenter = (PICT_WIDTH/2);
        let imgCenter = x/2;
        let dx = frameCenter-imgCenter;
        //kosmetyka - koniec

        ctx.drawImage(currentImage, PICT_X+dx, PICT_Y, x, PICT_HEIGHT);
    }
}

function placeThePhrase(phrase, where) {
//Umieszczenie wyrazow zdania w tablicy na wyrazy
//Parameters:   phrase - phrase/word to be placed in a table,
//              where - the table to place in
    Word.resetNumberOfElements();
    where.length = 0; //czyszczenie tablicy na wyrazy
    positions.forEach(pos => pos.setOccupied(false));
    let pos = null;

    // const phrElems = phrase.split(' ');  //wyluskanie wyrazow ze zdania - jesli Rozsypanka
    const phrElems = phrase.split('');      //wyluskanie liter z wyrazu    - jesli Literowanka

    for (let el of phrElems) {
         //wspolrzedne 'geograficzne' na wyraz pobierane sa z tablicy positions:
        pos = getFreeRandomPosition();
        pos.setOccupied(true);
        //tworzenie wyrazu i umieszczenie w tablicy 'where':
        let rndMod = getRandomIntInclusive(-0.05*canvas.height,+0.1*canvas.height);
        where.push(new Word(el, pos.x+rndMod, pos.y));    
    }
}

function rearrangePhrase() {
//"Wymieszanie" wyrazu na onclick na "@ button"
    placeThePhrase(currentPhrase, words);
    drawAllObjects();
    turnHandlersOn(); //bo mogly byc wylaczone po Zwyciestwie
}

function getRandomPhrase() {
    if (phrases.length === 1) {
        return phrases[0];
    }
    let drawn = '';
    do
        drawn = phrases[Math.floor(Math.random() * phrases.length)];
    while (drawn === currentPhrase);
    return drawn;
}

function getcurrentImageObj(phrase) {
    let img  =  new Image();
    let path = 'zasoby/' + phrase.toLowerCase() + '.webp';
    path = path.replace('..webp','.webp'); //jesli Rozsypanka, to zdanie mialo na koncu kropke, usuwamy
    img.src  =  path;
    return img;
}

function sayThePhrase(phr) {
    if (!parameters.WITH_LECTOR) return;
    disableButton(bPlay);
    let plikSnd = new Audio("zasoby/" + phr.toLowerCase() +'.mp3');
    plikSnd.onended = ()=>{
        // setTimeout(enableButton, 2000, bNextTask);
        setTimeout(enableButton, 2000, bPlay);
    }
    plikSnd.play();
}

function enableButton(b) {
   // b.style.visibility = "visible"; //old solution
   //New solution:
    switch (b) {
        case bPlay:
            b.style.visibility = "visible";       
            break;
        case bNextTask:
            b.disabled = false;
            b.style.backgroundColor = 'green';             
            break;
    }
}

function disableButton(b) {
    //b.style.visibility = "hidden"; //old solution
    switch (b) {
        case bPlay:
            b.style.visibility = "hidden";       
            break;
        case bNextTask:
            b.disabled = true;
            b.style.backgroundColor = 'inherit';             
            break;
    }
}                                                                                                                                                                           

function placeTheHint() {
    if (!parameters.WITH_HINT) return;
    let x,y;
    ctx.save();
    ctx.font = '5vh verdana, sans-serif';
    ctx.fillStyle = "gray";
    y = (PICT_Y+PICT_HEIGHT+AREA_Y1)/2;
    x = (PICT_X+PICT_WIDTH - ctx.measureText(currentPhrase).width)/2;
    ctx.fillText(currentPhrase, x, y);
    ctx.restore();    
}

function getTask() {
    disableButton(bNextTask);        
    currentPhrase = getRandomPhrase();
    placeThePhrase(currentPhrase, words);  //umieszczenie wylosowanego zdania w tablicy words
    currentImage = getcurrentImageObj(currentPhrase);
    currentImage.onload = () => {
        drawAllObjects();
        turnHandlersOn();
    };
    sayThePhrase(currentPhrase);
}

//------------------------------------------ START -----------------------------//

//Default parameters:
let parameters = {
    WITH_HINT:true,
    WITH_PICTURE:true,
    WITH_LECTOR:true,
    WITH_REWARD:true
};
readParameters();

//fizyczne wspolrzedne wyrazow na ekranie:
hardCodeCellsPositions();
//czy wyrazy maja byc w pudełkach :
Word.setIsBox(false); 

let currentPhrase = '';
let currentImage;
let bNextTask = document.getElementById('btn-next');
let bPlay     = document.getElementById('bplay');

//-----------------------------------------------------//

bNextTask.click();

(parameters.WITH_LECTOR)?enableButton(bPlay):disableButton(bPlay);

// setTimeout(enableButton,2000, bNextTask);
disableButton(bNextTask);


//------------------------------ AUXILIARIES -------------------------------------

function readParameters(){
    //--------------------------------------------------
    //Pobranie parametrow z ustawienia.html
    //Uwaga - wartosci w LocalStorage sa zawsze typu string!!!
    //--------------------------------------------------

    // LKL = parseInt(localStorage.liczbaKlawiszy);
    //mozna tez tak: LKL = localStorage.getItem('liczbaKlawiszy');

    //if localStorage is empty -> with pictures, with hints, with lector:
    localStorage.getItem('zObrazkiem')   ? parameters.WITH_PICTURE = (localStorage.getItem('zObrazkiem')==="true")   : parameters.WITH_PICTURE=true;
    localStorage.getItem('zPodpowiedzia')? parameters.WITH_HINT    = (localStorage.getItem('zPodpowiedzia')==="true"): parameters.WITH_HINT=true; 
    localStorage.getItem('zLektorem')    ? parameters.WITH_LECTOR  = (localStorage.getItem('zLektorem')==="true")    : parameters.WITH_LECTOR=true; 
    localStorage.getItem('zOklaskami')   ? parameters.WITH_REWARD  = (localStorage.getItem('zOklaskami')==="true")   : parameters.WITH_REWARD=true; 
                
    //if localStorage is empty -> we're getting default table of phrases,
    //but if not empty, we're getting the phrases from localStorage:
    if (localStorage.getItem('arrPhrases')) {
        phrases = localStorage.getItem('arrPhrases').split(',');
    }
}

function odegrajEfekty(plik1, delay1, plik2, delay2) {
    let plikSnd1 = new Audio("zasoby/" + plik1);
    setTimeout(() => plikSnd1.play(), delay1);
    if (arguments.length === 2) return;
    //oklaski (optional):
    if (!parameters.WITH_REWARD) return;
    let plikSnd2 = new Audio("zasoby/" + plik2);
    setTimeout(() => plikSnd2.play(), delay2);
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

//-------animacja---------------------------------------------------------------------------

function preShake() {
    ctx.save();
    var dx = Math.random()*10;
    var dy = Math.random()*10;
    ctx.translate(dx, dy);  
}
      
function postShake() {
    ctx.restore();
}
      
function drawThings() {  
    drawAllObjects();
}
    
let stopAnim = false;

function animate() {
//Keep animation alive
    if (stopAnim)
        return;
    requestAnimationFrame(animate);
    // erase
    ctx.clearRect(0,0, canvas_width, canvas_height);
    //
    preShake();
    //
    drawThings();
    //
    postShake();
}
      

      


      

