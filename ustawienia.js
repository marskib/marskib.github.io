"use strict";
const NBSP = String.fromCharCode(160); // Non-breakable HTML space is char 160

//Defaultowa tablica z wyrazami:
let phrases = [
    "zegar",    "łyżka",    "bluzka",    "chleb",       "choinka",
    "cukierki", "czajnik",  "czekolada", "dziewczynka", "długopis",
    "grzebień", "jabłko",   "klocki",    "kot",         "kredki",
    "krzesło",  "książka",  "lampa",     "miotła",      "miś",
    "myszka",   "młotek",   "nożyczki",  "nóż",         "odkurzacz",
    "okno",     "okulary",  "ołówek",    "pies",        "pilot",
    "piłka",    "poduszka", "pomidory",  "ręcznik",     "spodnie", 
    "słodycze", "talerz",   "widelec",   "wieża",       "zebra", 
    ];

let phrasesFromStorage = [];

const fSkib = (tablica,word) => tablica.includes(word);

window.onload = ()=>{
    sortDefaultTable();
    readParameters();
}

function sortDefaultTable() {
    let collator = new Intl.Collator( 'pl' );
    phrases.sort( collator.compare );
}

function selecting(idx){
    return '<input type="checkbox" checked>'+'&nbsp;'+ phrases[idx];
}

function unSelecting(idx){
    return '<input type="checkbox">'+'&nbsp;'+ phrases[idx];
}

function selUnsel(callback) {
    let ul = document.getElementById('item-list');
    ul.childNodes.forEach((item,i) => {
        if ( i>=1 )
            item.innerHTML = callback(i-1);
    });
}

function buildListOfPhrases(callback){
    let ul = document.getElementById('item-list');
    for (let phr of phrases) {
        let li = document.createElement('li');
        ul.appendChild(li);
        if (callback(phrasesFromStorage, phr))
            li.innerHTML = '<input type="checkbox" checked>'+'&nbsp;'+ phr;
        else
            li.innerHTML = '<input type="checkbox">'+'&nbsp;'+ phr;
    }
}

function readParameters() {
    //--------------------------------------------------
    //Pobranie parametrow z ustawienia.html
    //Uwaga - wartosci w LocalStorage sa zawsze typu string!!!
    //--------------------------------------------------

    //if localStorage is empty -> with pictures and with hints:
    let cbPict = document.getElementById("cb-with-pict");
    if (localStorage.getItem('zObrazkiem')===null) {
        cbPict.setAttribute("checked","");
    } else {
        (localStorage.getItem('zObrazkiem')==="true")?cbPict.setAttribute("checked",""):cbPict.removeAttribute("checked");
    }
    let cbHint = document.getElementById("cb-with-hint");
    if (localStorage.getItem('zPodpowiedzia')===null) {
        cbHint.setAttribute("checked","");
    } else {
        (localStorage.getItem('zPodpowiedzia')==="true")?cbHint.setAttribute("checked",""):cbHint.removeAttribute("checked");
    }
    //phrases: If localStorage is not empty -> getting them from localStorage,
    //if empty -> getting them from the default table:  
     if (localStorage.getItem('arrPhrases')) {
        phrasesFromStorage = getPhrasesFromStorage();
        // buildListOfPhrases(function(tablica,wyraz) {return tablica.includes(wyraz);}); mozna tak....
        buildListOfPhrases((tablica,wyraz) => tablica.includes(wyraz));                 //mozna tak...
    } else {
        // buildListOfPhrases((tablica,word) => true);  mozna tak..
        buildListOfPhrases((tablica,word) => true);   //mozna tak....  
    }
}

function saveParameters() {
//--------------------------------------------------------------------
//Zapisanie parametrow do localStorage w celu przekazania na inną 'formę'/'activity
//--------------------------------------------------------------------
    let HINT = document.getElementById("cb-with-hint").checked;
    let PICT = document.getElementById("cb-with-pict").checked;
    localStorage.setItem('zPodpowiedzia', HINT);
    localStorage.setItem('zObrazkiem',    PICT);

    //Przekazanie wyrazów/zdań, które user wybrał (checkboxes):
    let chosenPhrases = getChosenPhrasesFromPage();
    if (chosenPhrases.length === 0) {
        alert("Musisz wybrać przynajmniej 1 wyraz!");
    } else {
        localStorage.setItem('arrPhrases', chosenPhrases);
        window.location.assign("index.html");
    }
}

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

function getPhrasesFromStorage() {
    return localStorage.getItem('arrPhrases').split(',');
}
