"use strict";

/* @license Copyright 2017 Lennart Borgman (lennart.borgman@gmail.com) All rights reserved. */

function isYTkey(key) { return key.substr(0,3) == "YT-"; }
function key2YTid(key) { if (!isYTkey(key)) throw "Not a YouTube key"; return key.substr(3); }
function YTid2key(ytId) { return "YT-"+ytId; }

const LocalDBtypes = {
    LOCALSTORAGE: Symbol("localStorage"),
    INDEXEDDB: Symbol("indexedDB")
};
Object.freeze(LocalDBtypes);

var theLocalDBtype = LocalDBtypes.LOCALSTORAGE;

var theCurrentIsLocallySaved = false;


const MyLocalStorage =
    (function() {
        const prefixCap = "easycaped--cap--";
        const prefixTit = "easycaped--tit--";
        const prefixTim = "easycaped--tim--";
        const prefixFlg = "easycaped--flg--";
        return class {
            static lsKeyCap(key) { return prefixCap+key; }
            static lsKeyTit(key) { return prefixTit+key; }
            static lsKeyTim(key) { return prefixTim+key; }
            static lsKeyFlg(key) { return prefixFlg+key; }
            static save(key, title, outerHTML) {
                localStorage.setItem(MyLocalStorage.lsKeyCap(key), outerHTML);
                localStorage.setItem(MyLocalStorage.lsKeyTit(key), title);
                localStorage.setItem(MyLocalStorage.lsKeyTim(key), new Date().valueOf());
            }
            static lsKey2key(lsKey) { return lsKey.substr(prefixCap.length); }
            static listLocalStorage() {
                for (let i=0; i<localStorage.length; i++) {
                    let key = localStorage.key(i);
                    let data = localStorage.getItem(key);
                    console.log("ls key", i, key, data.length);
                }
            }
            static findVideos() {
                let vids = [];
                for (let i=0; i<localStorage.length; i++) {
                    let key = localStorage.key(i);
                    // console.log("ls key", i, key);
                    if (key.match("^"+prefixCap)) vids.push(MyLocalStorage.lsKey2key(key));
                }
                if (vids.length == 0) return null;
                if (vids.length > 1) throw "There is more than one video in localStorage";
                return vids;
            }
            static capKey2titKey(capKey) {
                return prefixTit+capKey.substr(prefixCap.length);
            }
            static hasKey(key) {
                let keyTim = MyLocalStorage.lsKeyTim(key);
                let tim = localStorage.getItem(keyTim);
                if (tim) return true; else return false;
            }
            static remove(key) {
                let keyCap = MyLocalStorage.lsKeyCap(key);
                let keyTit = MyLocalStorage.lsKeyTit(key);
                let keyTim = MyLocalStorage.lsKeyTim(key);
                let keyFlg = MyLocalStorage.lsKeyFlg(key);
                localStorage.removeItem(keyCap);
                localStorage.removeItem(keyTit);
                localStorage.removeItem(keyTim);
                localStorage.removeItem(keyFlg);
                return;

                let vids = MyLocalStorage.findVideos();
                for (let i=0; i<vids.length; i++) {
                    let keyCap = vids[i];
                    localStorage.removeItem(keyCap);
                    let keyTit = MyLocalStorage.capKey2titKey(keyCap);
                    localStorage.removeItem(keyTit);
                }
            }
            static localCollision(key) {
                let vids = MyLocalStorage.findVideos();
                if (!vids) return false;
                return !MyLocalStorage.hasKey(key);
            }
            static getTitle(key) {
                return localStorage.getItem(MyLocalStorage.lsKeyTit(key));
            }
            static getTimeMs(key) {
                return localStorage.getItem(MyLocalStorage.lsKeyTim(key));
            }
            static getCaptions(key) {
                return localStorage.getItem(MyLocalStorage.lsKeyCap(key));
            }

            static setFlagEditing(key, count) {
                let flagKey = MyLocalStorage.lsKeyFlg(key);
                localStorage.setItem(flagKey, ""+count);
            }
            static getFlagEditing(key) {
                let flagKey = MyLocalStorage.lsKeyFlg(key);
                let cnt = localStorage.getItem(flagKey);
                if (cnt) return +cnt;
                return null;
            }
            static removeFlagEditing(key) {
                let flagKey = MyLocalStorage.lsKeyFlg(key);
                localStorage.removeItem(flagKey);
            }

        }})();

const myLocalDB = MyLocalStorage;

// Add this to caped-editor.html
function countUpFlagEditing(key) {
    let cnt = myLocalDB.getFlagEditing(key) || 0;
    myLocalDB.setFlagEditing(key, ++cnt);
}
function countDownFlagEditing(key) {
    let cnt = myLocalDB.getFlagEditing(key);
    if (!cnt) return;
    cnt = --cnt;
    if (cnt == 0) {
        myLocalDB.removeFlagEditing(key);
    } else {
        myLocalDB.setFlagEditing(key, cnt);
    }
}
function isFlaggedEditing(key) {
    return myLocalDB.getFlagEditing(key);
}

function getVideoTitle(key) {
    return myLocalDB.getTitle(key);
}
function getVideoTimeMs(key) {
    return myLocalDB.getTimeMs(key);
}

// fix-me: key
var theCaptionKey;
function saveCurrentVideoToLocal() {
    if (!theCurrentKey) throw "No currently loaded video captions";
    if (localCollision(theCurrentKey)) throw "already a saved video, only one can be locally saved";
    
    let transHtml = theTranscriptDiv.outerHTML;
    // if (!hasKey(currentVid)) throw "not locally stored";
    console.log("save", theCurrentKey, theCurrentTitle, transHtml.length);
    myLocalDB.save(theCurrentKey, theCurrentTitle, transHtml);
    theCurrentIsLocallySaved = true;
}
function localCollision(key) {
    return myLocalDB.localCollision(key);
}

function existLocally(key) {
    return myLocalDB.hasKey(key);
}
function findLocallySavedVideos() {
    return myLocalDB.findVideos();
}

function deleteLocallySavedVideo(key) {
    if (!key) throw "no key";
    if (!myLocalDB.hasKey(key)) throw "not locally stored";
    myLocalDB.remove(key);
}
function getLocallySavedVideoIdAndTitle(key) {
    return;
    let key = findLocallySavedVideo();
    if (!key) return null;
    return key.split(/----/);
}

function getLocallySavedVideoTranscript(key) {
    if (!key) throw "no key";
    // let key = findLocallySavedVideo();
    // if (!key) return false;
    // let transHtml = localStorage.getItem(key);
    let transHtml = myLocalDB.getCaptions(key);
    console.log("transHtml", transHtml.length);
    return transHtml;
}
function loadCaptionsFromLocal(key) {
    theCapLoadType = CapLoadTypes.local;
    // fix-me: move most to caped-editor.js
    let editorElt = document.getElementById("editor");
    if (!editorElt) throw "Can't find editor, wrong page";
    let transHtml = getLocallySavedVideoTranscript(key);
    if (!transHtml) throw "No locally saved video found";
    editorElt.innerHTML = transHtml;
    setTimeout(function(){
        theTranscriptDiv = document.querySelector("#the-transcript-div");
        refreshTheChangedSpans();
        refreshTheOkBadSpans();
        resizeThrottler();
        var popMap = new Map();
        popMap.set("OK", null);
        var pop = new Popup("Loaded captions from your device",
                            "If you want to load the captions from YouTube again,"
                            +" please delete the local copy of the captions for this video.", popMap);
        // setTimeout(function() {pop.show();}, 1);
    }, 1000);
}

function joinPifPossible(pNode) {
    // console.log("joinPifPossible");
    if (pNode.querySelector(":scope>span.spoken")) return;
    // console.log("joinPifPossible, spoken ok");
    if (pNode.querySelector(":scope>span.word-ok")) return;
    if (pNode.querySelector(":scope>span.word-bad")) return;
    if (pNode.querySelector(":scope>span.changed")) return;
    if (pNode.querySelector(":scope>span[contenteditable]")) return;

    // if (thePlayArrow && thePlayArrow.parentNode === pNode) return;
    if (pNode.querySelector(":scope>span.play-arrow")) return;

    // console.log("joinPifPossible, JOINING", pNode.textContent);
    let ih = pNode.innerHTML;
    console.log("joinPifPossible, ih", ih);
    if (ih) pNode.dataset.ih = ih;
    pNode.innerHTML = pNode.textContent;
    pNode.setAttribute("tabindex", 0);
}

// fix-me: rewrite as Promise, change all uses:
// https://stackoverflow.com/questions/22519784/how-do-i-convert-an-existing-callback-api-to-promises
var theSpinN = 0; // for checking the number of callbacks
var theSpinNarr = []; // for checking the number of callbacks
function splitPifNeeded(pNode) {
    // if (!pNode.dataset.ih) return;

    // new
    let mySpinN = theSpinN++;
    theSpinNarr[mySpinN] = 0;
    return new Promise(function(resolve, reject) {
        if (!pNode.dataset.ih) {
            // console.log("splitPifNeeded, ih null");
            resolve(); return;
        }
        // console.log("splitPifNeeded, ih exists", pNode);
        let mu = new MutationObserver(function(mutations) {
            // Fix-me: We do not know the number of call to the
            // callback. Probably it is just one. For the moment I assume
            // it is only one. As a test do not mu.disconnect() directly,
            // but in a timer and log to console.
            console.log("mySpinN == ", mySpinN, mutations);
            if (theSpinNarr[mySpinN] > 2) throw "Third call to mu splitPifNeeded";
            theSpinNarr[mySpinN]++;
            setTimeout(()=>{ mu.disconnect(); }, 1000);
            // fix-me: is it correct to do this on first mu callback?
            if (theSpinNarr[mySpinN] == 1) {
            }
            resolve();
        });
        mu.observe(pNode, {childList:true});
        pNode.removeAttribute("tabindex");
        pNode.innerHTML = pNode.dataset.ih;
        delete pNode.dataset.ih;
    });
    // end new

    // pNode.removeAttribute("tabindex");
    // pNode.innerHTML = pNode.dataset.ih;
    // delete pNode.dataset.ih;
}

var theCurrentKey;
