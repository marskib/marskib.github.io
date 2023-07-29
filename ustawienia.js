"use strict";
const NBSP = String.fromCharCode(160); // Non-breakable HTML space is char 160

//Defaultowa tablica z wyrazami:
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

let phrasesFromStorage = [];

window.onload = ()=>{
    sortDefaultTable();
    readParameters();
}

function sortDefaultTable() {
    let collator = new Intl.Collator( 'pl' );
    phrases.sort( collator.compare );
}

function selecting(idx){
//Function used as callback in selUnsel(callback)
    return '<input type="checkbox" checked>'+'&nbsp;'+ phrases[idx];
}

function unSelecting(idx){
//Function used as callback in selUnsel(callback)
    return '<input type="checkbox">'+'&nbsp;'+ phrases[idx];
}

function selUnselAll(callback) {
    let ul = document.getElementById('item-list');
    ul.childNodes.forEach((item,i) => {
        if ( i>=1 )
            item.innerHTML = callback(i-1);
    });
}

function buildListOfPhrases(baseArray=phrases, controlArray=phrases) {
    //Na ekranie tworzona jest czeklista z phrases.
    //Tworzona jest na podstawie tablic baseArray i controlArray
    //Jezeli element jest w controlArray - jego checkbox jest na 'checked'.
    //Jezeli nie podamy parametrów - wszystkie na 'checked'.
    let ul = document.getElementById('item-list');
    for (let phr of baseArray) {
        let li = document.createElement('li');
        ul.appendChild(li);
            if (controlArray.includes(phr))
                li.innerHTML = '<input type="checkbox" checked>'+'&nbsp;'+ phr;
            else
                li.innerHTML = '<input type="checkbox">'+'&nbsp;'+ phr;
    }
}

(function bigSmallWrapper() {
//Setting for the click on #big-small-button to change phreases to upper/lower case.
//1.zmiana wielkosci liter w tablicy phrases
//2.ponowne naczytanie (rebuilding)
//---------------------------------------------------------------    
    let klawisz = document.getElementById('big-small-button');
    klawisz.onclick = (event)=>{
        //1.changing letter register in phrases array
        let f;
        let elements = document.querySelectorAll("#item-list li");
        //what is the size of the letters on the screen? Then we'll know how to change them:
        if (elements[0].innerText.toUpperCase()===elements[0].innerText)
            f=(s)=>s.toLowerCase();
        else
            f=(s)=>s.toUpperCase();
        let chosenOnes = getChosenPhrasesFromPage();
        phrases     = phrases.map(e=>f(e));
        chosenOnes  = chosenOnes.map(e=>f(e));
        //2.rebuilding
        elements.forEach((e,i)=>elements[i].remove()); //czyszczenie
        buildListOfPhrases(phrases, chosenOnes);
    }
})(); //IIFE

function getChosenPhrasesFromPage() {
//---------------------------------
//Returns the table of all phrases
//that the user (left) checked
//---------------------------------
    let chosenPhrases = [];
    let elements = document.querySelectorAll("#item-list li");
    elements.forEach(item => {
        if (item.firstChild.checked) {
            let str = item.textContent;
            str = str.substring(str.indexOf(NBSP) + 1); //removing first (unbreakable) space (if any)
            chosenPhrases.push(str);
        }
    });
    return chosenPhrases;
}

function testAndSet(checkBoxName, storageOptionName) {
//Ustawienie checkboxa na podstawie zawartosci localStorage.
//Jesli localStorage empty -> chackbox na true, else -> checkbox = localStorage
    let elem = document.getElementById(checkBoxName);
    if (localStorage.getItem(storageOptionName)===null) {
        elem.setAttribute("checked","");
    } else {
        (localStorage.getItem(storageOptionName)==="true")?elem.setAttribute("checked",""):elem.removeAttribute("checked");
    }    
}

function readParameters() {
    //--------------------------------------------------
    //Pobranie parametrow z ustawienia.html
    //Uwaga - wartosci w LocalStorage sa zawsze typu string!!!
    //--------------------------------------------------

    //if localStorage is empty -> with pictures, with hints, with lektor, with reward:
    testAndSet("cb-with-pict", "zObrazkiem");
    testAndSet("cb-with-hint", "zPodpowiedzia");
    testAndSet("cb-with-lector", "zLektorem");
    testAndSet("cb-with-reward", "zOklaskami");

    //phrases: If localStorage is not empty -> getting them from localStorage,
    //if empty -> getting them from the default table:  
     if (localStorage.getItem('arrPhrases')) {
        phrasesFromStorage = getPhrasesFromStorage();
        //if in different registries buildListOfPhrases() wont't find any... :
        phrases = getInTheSameRegisterAs(phrases, phrasesFromStorage);
        buildListOfPhrases(phrases, phrasesFromStorage);
    } else {
        buildListOfPhrases();   //'check' given to all elements
    }
}

function getInTheSameRegisterAs(arrayToChange, elements) {
    //Checks the registry (upper/lowerCase) of elements in elements,
    //and then returns the copy of arrayToChange in the same registry
    //as elements. All elements of elements are in the same registry,
    //so it is enough to check the first one.
    // 
    let f;
    (elements[0].toUpperCase()===elements[0])?(f=(s)=>s.toUpperCase()):(f=(s)=>s.toLowerCase());
    return arrayToChange.map(e=>f(e));
    (elements[0].toUpperCase()===elements[0])?(f=(s)=>s.toUpperCase()):(f=(s)=>s.toLowerCase());
}

function saveParameters() {
// --------------------------------------------------------------------
// Zapisanie parametrow do localStorage w celu przekazania na inną 'formę'/'activity
//--------------------------------------------------------------------
    let HINT   = document.getElementById("cb-with-hint").checked;
    let PICT   = document.getElementById("cb-with-pict").checked;
    let LECTOR = document.getElementById("cb-with-lector").checked;
    let REWARD = document.getElementById("cb-with-reward").checked;
    localStorage.setItem('zPodpowiedzia', HINT);
    localStorage.setItem('zObrazkiem',    PICT);
    localStorage.setItem('zLektorem',     LECTOR);
    localStorage.setItem('zOklaskami',    REWARD);

    //Przekazanie wyrazów/zdań, które user wybrał (checkboxes):
    let chosenPhrases = getChosenPhrasesFromPage();
    if (chosenPhrases.length === 0) {
        alert("Musisz wybrać przynajmniej 1 wyraz!");
    } else {
        localStorage.setItem('arrPhrases', chosenPhrases);
        window.location.assign("index.html");
    }
}

function getPhrasesFromStorage() {
    return localStorage.getItem('arrPhrases').split(',');
}
