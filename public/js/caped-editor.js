"use strict";

/* @license Copyright 2017 Lennart Borgman (lennart.borgman@gmail.com) All rights reserved. */

// Check for the various File API support and more.
if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
    // console.log("Has window.File");
} else {
    alert('The File APIs are not fully supported in this browser.');
}

var CapLoadTypes = MakeEnum("local", "user", "shared");
var theCapLoadType;

function setCapLoadType(loadType) {
    // theCapLoadType = loadType;
    let loadTypeField = document.getElementById("load-type");
    loadTypeField.classList.add("load-type-button");
    loadTypeField.classList.remove("local");
    loadTypeField.classList.remove("user");
    loadTypeField.classList.remove("shared");
    switch (loadType) {
    // case CapLoadTypes.local:
    case "local":
        theCapLoadType = CapLoadTypes.local;
        loadTypeField.innerText = "On Device";
        loadTypeField.classList.add("local");
        break;
    // case CapLoadTypes.user:
    case "user":
        theCapLoadType = CapLoadTypes.user;
        loadTypeField.innerText = "User Cloud";
        loadTypeField.classList.add("user");
        break;
    // case CapLoadTypes.shared:
    case "shared":
        theCapLoadType = CapLoadTypes.shared;
        loadTypeField.innerText = "Shared Cloud";
        loadTypeField.classList.add("shared");
        break;
    default:
        throw "bad load type: "+loadType;
    }
    // loadTypeField.addEventListener("click", (ev) => loadTypeDialog(ev));
}
function loadTypeDialog(ev) {
    // console.log(ev); return;
    let loadTF = ev.target;

    let thisLoc = "local"; // guess
    if (loadTF.classList.contains("user")) thisLoc = "user";
    if (loadTF.classList.contains("shared")) thisLoc = "shared";

    let title = "These captions are stored ";
    if (thisLoc == "local") title += "on your device";
    if (thisLoc == "user") title += "in your private part of the cloud";
    if (thisLoc == "shared") title += "in the shared part of the cloud";

    let body = mkElt("div", null,
                     [
                         mkElt("p", null, mkElt("b", null, "You can move/copy them to:")),
                         ""
                     ]
                    );
    var popMap = new Map();
    var pop = new Popup(title, body, popMap, true, "move-copy-popup");

    let keyFoundLocal = existLocally(theCurrentKey);

    function mkButtonMC(moveOrCopy, where) {
        let btnDiv = document.createElement("div");
        btnDiv.classList.add("popup-button");
        btnDiv.addEventListener("click", function() {
            showClick(btnDiv);
            // btnDiv.classList.remove("flash");
            // setTimeout(()=>btnDiv.classList.add("flash"), 1);
        });
        switch (moveOrCopy) {
        case "move":
            btnDiv.innerHTML = "Move";
            btnDiv.addEventListener("click", function() {
                setTimeout(function(){alert("Sorry, not implemented yet! "+where)}, 1000);
            });
            break;
        case "copy":
            btnDiv.innerHTML = "Copy";
            btnDiv.addEventListener("click", function() {
                // setTimeout(function(){alert("Sorry, not implemented yet! "+where)}, 1000);
                let title = "dummy";
                let timeMs = 0;
                async function copy() {
                    switch (where) {
                    case "local":
                        throw "niy";
                        break;
                    case "user":
                    case "shared":
                        await uploadElts(theTranscriptDiv, await getBaseDoc(where), theCurrentKey, title, timeMs);
                        break;
                    default:
                        throw "bad arg";
                    }
                    pop.close();
                    setCapLoadType(where);
                    // fix-me: listener etc
                    setTimeout(function(){
                        popupMessage("Copied to "+where, "You are now editing there");
                    }, 1);
                }
                copy();
            });
            break;
        default: throw "bad arg";
        }
        return btnDiv;
    }

    let toLocalLine =
        mkElt("p", null,
              [
                  mkElt("span", {class:"local load-type-button"}, "Device"),
                  " Your device"
              ]);
    if (keyFoundLocal) {
        toLocalLine.appendChild(mkElt("p", null, "(Already exists there)"));
    } else {
        // fix-me: Check for local captions!
        toLocalLine.appendChil(mkButtonMC("move", "local"));
        toLocalLine.appendChild(mkButtonMC("copy", "local"));
    }


    let toUserLine =
        mkElt("p", null,
              [
                  mkElt("span", {class:"user load-type-button"}, "User"),
                  " Your private part of cloud"
              ]);
    keyExistsInCloud(theCurrentKey, "user").then(function(exists){
        if (exists) {
            toUserLine.appendChild(mkElt("p", null, "(Sorry, already exists there)"));
        } else {
            toUserLine.appendChild(mkButtonMC("move", "user"));
            toUserLine.appendChild(mkButtonMC("copy", "user"));
        }
    });

    let toSharedLine =
        mkElt("p", null,
              [
                  mkElt("span", {class:"shared load-type-button"}, "Shared"),
                  " The shared part of cloud"
                  // mkButtonMC("move", "local"),
                  // mkButtonMC("copy", "local")
              ]);
    keyExistsInCloud(theCurrentKey, "shared").then(function(exists){
        if (exists) {
            toSharedLine.appendChild(mkElt("p", null, "(Sorry, already exists there)"));
        } else {
            toSharedLine.appendChild(mkButtonMC("move", "shared"));
            toSharedLine.appendChild(mkButtonMC("copy", "shared"));
        }
    });

    
    if (thisLoc != "local") body.appendChild(toLocalLine);
    if (thisLoc != "user") body.appendChild(toUserLine);
    if (thisLoc != "shared") body.appendChild(toSharedLine);

    setTimeout(function() {pop.show();}, 100);
}

// var theVideoURL = "https://youtu.be/6EVgVqtQsDM";
// var theVideoURL = "../../../../../Downloads/caped-test.mp4";
// var theTrackURL = "../../../../../Downloads/caped-test.vtt";
var theVideoURL = "data/caped-test.mp4";
var theTrackURL  = "data/caped-test.vtt";
var theTrack2URL = "data/ex.ytml";
var theVideoPlayer;
var theVideoContainer;
var theTrack;
var thePlayWord;
var thePlayWordNBefore = 4;
var thePlayWordNAfter  = 2;

var theFollowVideoTimer;

var theOuterEdit;
var theEditor;
var theEditControls;
// var theBadOkDiv;
var theTempMsg;
var theEditedWord;
var theEditedKeyHandler = function(ev) {
    if (ev.charCode == 13) {
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        ev.target.blur();
    }
};
var theCtrlOk;
var theCtrlBad;
var theCtrlNextBad;
var theCtrlPrevBad;
var theCtrlNextChanged;
var theCtrlPrevChanged;
var theCtrlReset;
var theCtrlPunctDot;
var theCtrlPunctExlaim;
var theCtrlPunctQuestion;

var touchDevice = false;

// var thePlayArrow;

function saveCurrentCaptions() {
    let ceNode = theEditor.querySelector("span[contenteditable]");
    if (ceNode) {
        handleWordBlurAction(ceNode);
    }
    removeSpokenSpan();
    removePlayArrows();
    removeReallyNotChanged();
    saveCurrentVideoToLocal();
}
function removePlayArrows() {
    let arrows = theTranscriptDiv.querySelectorAll("span.play-arrow");
    console.log("arrows", arrows);
    arrows.forEach((arrowNode)=>{
        // let wordNode = arrowNode.previousElementSibling;
        // if (!wordNode) debugger;
        // console.log(wordNode, arrowNode);
        // var ow = wordNode.dataset.ow;
        // if (!ow || (ow == wordNode.innerHTML)) {
        //     delete wordNode.dataset.ow;
        //     wordNode.classList.remove("changed");
        // }
        arrowNode.parentElement.removeChild(arrowNode);
    });
}
function removeReallyNotChanged() {
    let changed = theTranscriptDiv.querySelectorAll("span.changed");
    changed.forEach((changedNode)=>{
        var ow = changedNode.dataset.ow;
        if (!ow || (ow == changedNode.innerHTML)) {
            delete changedNode.dataset.ow;
            if (!changedNode.classList.contains("word-bad")) {
                changedNode.classList.remove("changed");
            }
            setTimeout(()=>updateEltToDoc(changedNode), 0);
        }
    });
}
function setUpToSaveLocally() {
    window.addEventListener("beforeunload", function(ev) {
        console.log("before unload");
        document.activeElement.blur(); // fix-me: for saving to web, did not work in Chrome now.
        if (theCapLoadType == CapLoadTypes.local) {
            saveCurrentCaptions();
            countDownFlagEditing(theCurrentKey);
        }

        var dialogText = null; // 'Dialog text here';
        // fix-me: if returnValue is set to null there will be a popup... (MDN says otherwise)
        // ev.returnValue = dialogText;
        return dialogText;
    });
}

var theLatestNode;
function makePlayArrow(wordNode) {
    theLatestNode = wordNode;
    
    let nextSib = wordNode.nextElementSibling;
    if (nextSib && nextSib.classList.contains("play-arrow")) return;
    let arrowElt = document.createElement("span");
    // arrowElt.setAttribute("id", "play-arrow");
    arrowElt.classList.add("play-arrow");
    arrowElt.innerText = "▶";
    arrowElt.addEventListener("click", function(ev){
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        ev.preventDefault();
        var word = arrowElt.previousElementSibling;
        // console.log("word before arrow", word.innerHTML);
        if (!word) debugger;
        word.classList.add("changed");
        endAndStartPlayWordTimer(true, word);
        word.focus();
    });
    let wordParent = wordNode.parentElement;
    wordParent.insertBefore(arrowElt, wordNode.nextElementSibling);
    // return arrowElt;
}

// window.addEventListener("load", function() {
thePromiseDOMready.then(function() {
    if (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0)) {
        /* browser with either Touch Events of Pointer Events
           running on touch-capable device */
        touchDevice = true;
    }

    // thePlayArrow = document.createElement("span");
    // thePlayArrow.setAttribute("id", "play-arrow");
    // thePlayArrow.innerText = "▶";
    // thePlayArrow.addEventListener("click", function(ev){
    //     ev.stopPropagation();
    //     ev.stopImmediatePropagation();
    //     ev.preventDefault();
    //     var word = thePlayArrow.previousElementSibling;
    //     // console.log("word before arrow", word.innerHTML);
    //     if (!word) debugger;
    //     endAndStartPlayWordTimer(true, word);
    //     word.focus();
    // });

    theOuterEdit = document.getElementById("outer-edit");
    theEditor = document.getElementById("editor");
    theEditor.addEventListener("click", function(ev){
        let target = ev.target;
        switch(target.tagName) {
        case "SPAN":
            if (!target.classList.contains("word")) break;
            handleWordClick(ev);
            break;
        case "P":
            handlePwordsClick(ev);
            break;
        default:
            // console.log("theEditor ev.target", ev.target);
        }
    });
    // theEditor.addEventListener("blur", function(ev){
    theEditor.addEventListener("focusout", function(ev){
        // console.log("do we bet BLUR??? No, but focusout (since it bubbles!)");
        let target = ev.target;
        switch(target.tagName) {
        case "SPAN":
            if (!target.classList.contains("word")) break;
            handleWordBlur(ev);
            break;
        default:
            // console.log("theEditor ev.target", ev.target);
        }
    });
    theEditor.addEventListener("focusin", function(ev){
        let target = ev.target;
        switch(target.tagName) {
        case "SPAN":
            // console.log("theEditor focus ev", target);
            if (!target.classList.contains("word")) break;
            // console.log("theEditor focus ev word");
            handleWordFocus(ev);
            break;
        default:
            // console.log("theEditor ev.target", ev.target);
        }
    });
    // console.log("theEditor", theEditor);
    var endAndStartCheckActiveVisible = (function(){
        var timer;
        return function(duration){
            clearTimeout(timer);
            timer = null;
            timer = setTimeout(function(){
                checkActiveWord();
            }, duration);
        };
    })();
    theEditor.addEventListener("scroll", function(ev) {
        endAndStartCheckActiveVisible();
    });


    // --------------------------------------------------------------------

    theEditControls = document.getElementById("edit-controls");
    theEditControls.classList.add("flx-cont-controls");
    theEditControls.classList.add("no-copy");

    var containerBadCont = document.createElement("div");
    theEditControls.appendChild(containerBadCont);
    containerBadCont.setAttribute("id", "edit-bad-container");
    // theBadOkDiv = document.createElement("div");
    // theBadOkDiv.setAttribute("id", "bad-ok-info");
    var containerBad = makeEditControlContainer("edit-bad-inner-container", containerBadCont);
    // containerBadCont.appendChild(theBadOkDiv);
    var containerPunctuate = makeEditControlContainer("edit-punctuate-container", theEditControls);
    var containerReset = makeEditControlContainer("edit-reset-container", theEditControls);

    theEditControls.childNodes.forEach((child)=>{child.classList.add("flx-box-controls");});

    theCtrlBad = makeEditControl("word-bad", "✘", containerBad, "Mark as wrong", true);
    theCtrlBad.classList.add("word-bad");
    theCtrlBad.addEventListener("click", function(ev){
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        ev.preventDefault();
        if (!theEditControls.classList.contains("enabled")) return;
        var word = getActiveVisibleWordWithMsg();
        if (!word) return;
        // setSpokenSpan(word);
        word.classList.remove("word-ok");
        word.classList.toggle("word-bad");
        if (word.classList.contains("word-bad")) {
            word.classList.add("changed"); // for navigating
        } else {
            // word.classList.add("changed"); // for navigating
        }
        // removePlayArrowIfNotChanged(word);
        refreshTheOkBadSpans();
        refreshTheChangedSpans();
        setTimeout(()=>updateEltToDoc(word), 0);
    });

    theCtrlOk = makeEditControl("word-ok", "✓", containerBad, "Mark OK", true);
    theCtrlOk.classList.add("word-ok");
    theCtrlOk.addEventListener("click", function(ev){
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        ev.preventDefault();
        if (!theEditControls.classList.contains("enabled")) return;
        var word = getActiveVisibleWordWithMsg();
        if (!word) return;
        word.classList.remove("word-bad");
        word.classList.toggle("word-ok");
        if (word.classList.contains("word-ok")) {
            word.classList.add("changed"); // for navigating
        } else {
            word.classList.remove("changed");
        }
        delete word.dataset.ow;
        removePlayArrowIfNotChanged(word);
        refreshTheOkBadSpans();
        refreshTheChangedSpans();
        setTimeout(()=>updateEltToDoc(word), 0);
    });

    theCtrlPrevBad = makeEditControl("prev-bad", "⇦✘", containerBad, "Previous wrong");
    theCtrlPrevBad.classList.add("enabled");
    // function findStartWordPrev() {
    function findStartTimePrev() {
        var cw = getActiveWord();
        var re = theEditor.getBoundingClientRect();
        if (cw) {
            var rcw = cw.getBoundingClientRect();
            if (rcw.bottom < re.top) cw = null;
            if (cw) { if (rcw.top > re.bottom) cw = null; }
            // console.log("cw was outside view");
        }
        if (!cw) {
            cw = document.elementFromPoint(re.left+10, re.top+10);
            // console.log("cw 1", cw);
            if (cw.tagName == "DIV") {
                // Hm, between p?
                cw = document.elementFromPoint(re.left+10, re.top+30);
                // console.log("cw 2", cw);
            }
            // if (cw.tagName == "P") cw = cw.firstElementChild;
            if (cw.tagName == "P") {
                return +cw.getAttribute("t");
            }
            // if (cw.tagName != "SPAN") breakHere();
            // console.log("cw 3", cw);

        }
        // return cw;
        return +cw.getAttribute("abst");
    }
    theCtrlPrevBad.addEventListener("click", function(ev){
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        ev.preventDefault();
        // if (!theEditControls.classList.contains("enabled")) return;
        // var cw = findStartWordPrev();
        var cwTime = findStartTimePrev();
        // var bw = findBadWord(+cw.getAttribute("abst")-10, false);
        var bw = findBadWord(cwTime-10, false);
        if (!bw) {
            tempMessage("No Err marks backwards");
        } else {
            bw.parentElement.scrollIntoViewIfNeeded();
            setSpokenSpan(bw);
        }
    });
    theCtrlNextBad = makeEditControl("next-bad", "✘⇨", containerBad, "Next wrong");
    theCtrlNextBad.classList.add("enabled");
    // function findStartWordNext() {
    function findStartTimeNext() {
        var cw = getActiveWord();
        var re = theEditor.getBoundingClientRect();
        if (cw) {
            var rcw = cw.getBoundingClientRect();
            if (rcw.bottom < re.top) cw = null;
            if (cw) { if (rcw.top > re.bottom) cw = null; }
            // console.log("cw was outside view");
        }
        if (!cw) {
            cw = document.elementFromPoint(re.right-50, re.bottom-10);
            // console.log("cw 1", cw);
            if (cw.tagName == "DIV") {
                // Hm, between p?
                cw = document.elementFromPoint(re.right-50, re.bottom-30);
                // console.log("cw 2", cw);
            }
            // if (cw.tagName == "P") cw = cw.lastElementChild;
            // if (!cw) breakHere();
            // if (cw.tagName != "SPAN") breakHere();
            // console.log("cw 3", cw);
            if (cw.tagName == "P") {
                return +cw.getAttribute("t") + +cw.getAttribute("d");
            }
        }
        // return cw;
        return +cw.getAttribute("abst");
    }
    theCtrlNextBad.addEventListener("click", function(ev){
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        ev.preventDefault();
        // if (!theEditControls.classList.contains("enabled")) return;
        // var cw = findStartWordNext();
        var cwTime = findStartTimeNext();
        var bw = findBadWord(cwTime+10, true);
        if (!bw) {
            tempMessage("No Err marks forwards");
        } else {
            bw.parentElement.scrollIntoViewIfNeeded();
            setSpokenSpan(bw);
        }
    });
   

    theCtrlReset = makeEditControl("word-reset", "↶", containerReset, "Reset to original", true);
    theCtrlPrevChanged = makeEditControl("prev-changed", "⇦⚠", containerReset, "Previous change");
    theCtrlNextChanged = makeEditControl("next-changed", "⚠⇨", containerReset, "Next change");
    theCtrlNextChanged.classList.add("enabled");
    theCtrlPrevChanged.classList.add("enabled");
    theCtrlPrevChanged.addEventListener("click", function(ev){
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        ev.preventDefault();
        var cwTime = findStartTimePrev();
        var chgW = findChangedWord(+cwTime-10, false);
        if (!chgW) {
            tempMessage("No more changes backwards");
            return;
        }
        chgW.scrollIntoViewIfNeeded();
        setSpokenSpan(chgW);
    });
    theCtrlNextChanged.addEventListener("click", function(ev){
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        ev.preventDefault();
        // var cw = findStartWordNext();
        var cwTime = findStartTimeNext();
        // var chgW = findBadWord(+cw.getAttribute("abst")+10, true);
        var chgW = findChangedWord(+cwTime+10, true);
        if (!chgW) {
            tempMessage("No more changes forwards");
            return;
        }
        chgW.scrollIntoViewIfNeeded();
        setSpokenSpan(chgW);
    });
 
    theCtrlReset.addEventListener("click", function(ev){
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        ev.preventDefault();
        if (!theEditControls.classList.contains("enabled")) return;
        // console.log("Reset");
        var word = getActiveVisibleWordWithMsg();
        if (!word) return;
        word.classList.remove("changed");
        refreshTheChangedSpans();
        // var clsRemoved = word.classList.contains("word-bad") || word.classList.contains("word-ok");
        // word.classList.remove("word-bad");
        // word.classList.remove("word-ok");
        refreshTheOkBadSpans();
        var ow = word.dataset.ow;
        var punct = word.dataset.punct;
        // console.log("ow", ow, "punct", punct, word);
        if (!ow && !punct) {
            tempMessage("Nothing to reset at that word");
            return;
        }
        delete word.dataset.ow;
        var tw = word.innerHTML;
        if (!punct && ow == tw) {
            // fix-me: this should not happen
            debugger;
            tempMessage("Nothing to reset at that word 2");
            return;
        }
        var msg = "";
        var twNoP = tw.substr(0, tw.length-1);
        if (ow != twNoP) {
            msg += "<p>Did reset to original word:</p><p>"+twNoP+" ⇨ "+ow+"</p>";
        }
        word.innerHTML = ow;
        if (punct) {
            delete word.dataset.punct;
            msg += "<p>Removed punctuation.</p>";
            var nextW = findPNearSpan(word, 1);
            var tnw = nextW.innerHTML;
            var onw = nextW.dataset.ow;
            if (capitalizeWord(onw) == tnw) {
                nextW.innerHTML = onw;
                delete nextW.dataset.ow;
                nextW.classList.remove("changed");
                refreshTheChangedSpans();
            }
        }
        tempMessage(msg);
        setTimeout(()=>updateEltToDoc(word), 0);
    });


    theCtrlPunctDot = makePunctControl(".", containerPunctuate);
    theCtrlPunctExlaim = makePunctControl("!", containerPunctuate);
    theCtrlPunctQuestion = makePunctControl("?", containerPunctuate);


    // --------------------------------------------------------------------

    theVideoContainer = document.getElementById("video-container");


    theTempMsg = document.createElement("div");
    theTempMsg.setAttribute("id", "temp-msg");
    theTempMsg.classList.add("transform-message");
    theTempMsg.addEventListener("click", function(ev){
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        ev.preventDefault();
        theTempMsg.classList.remove("message-active");
    });
    // theOuterEdit.appendChild(theTempMsg);
    // theEditor.appendChild(theTempMsg);
    // msgAnchor = document.getElementById("msg-anchor");
    // msgAnchor.appendChild(theTempMsg);
    document.body.appendChild(theTempMsg)
    refreshTheOkBadSpans();
});
function hideTempMessage() {
    if (!theTempMsg.dataset.msg) return; // timer
    delete theTempMsg.dataset.msg;
    theTempMsg.removeChild(theTempMsg.firstElementChild)
    theTempMsg.classList.remove("message-active");
}
var endAndStartRemoveMessageTimer = (function(){
    var timer;
    return function(duration){
        clearTimeout(timer);
        timer = null;
        if (!duration) {
            // theTempMsg.removeChild(theTempMsg.firstElementChild)
            // theTempMsg.classList.remove("message-active");
            hideTempMessage();
            return;
        }
        timer = setTimeout(function(){
            // theTempMsg.removeChild(theTempMsg.firstElementChild)
            // theTempMsg.classList.remove("message-active");
            hideTempMessage();
        }, duration);
    };
})();
function closeTempMessageIfActive() {
    return false;
    if (theTempMsg.classList.contains("message-active")) {
        tempMessage(null, null);
        return true;
    }
}
function tempMessage(msg, duration) {
    if (msg) {
        if (msg == theTempMsg.dataset.msg) {
            // msg = null;
            duration = null;
            hideTempMessage();
            return;
        }
        duration = duration || 1000 + msg.length*60;
        // console.log("tempMessage", msg.length, duration);
        theTempMsg.dataset.msg = msg;
        theTempMsg.appendChild(document.createElement("div"));
        theTempMsg.firstChild.innerHTML = String.fromCharCode(0x2139)+" "+msg;
        theTempMsg.classList.add("message-active");
    }
    endAndStartRemoveMessageTimer(duration);
}
function startLoadingCaptionFileFromNet(url) {
    // fix-me
    var prom = getPromiseURLrequest("GET", url);
    prom.then(function(result){
        // console.log("got url", result.length);
        // loadCaptionContents(result, "ytml");
        loadCaptionContents(result, guessCapFormatFromContents(result));
    }).catch(function(err){
        console.log("url", url, err);
        alert("Can't retrieve "+url+"\n"+err);
        // debugger;
    });
}
function getPromiseURLrequest(method, url, errmsg) {
    errmsg = errmsg || "";
    // Return a new promise.
    return new Promise(function(resolve, reject) {
        // Do the usual XHR stuff
        var req = new XMLHttpRequest();
        req.open(method, url, true);

        req.onload = function() {
            // This is called even on 404 etc
            // so check the status
            if (req.status == 200) {
                // Resolve the promise with the response text
                resolve(req.response);
            }
            else {
                // Otherwise reject with the status text
                // which will hopefully be a meaningful error
                errmsg = req.statusText+"("+req.status+")\n"+errmsg;
                // reject(Error(req.statusText));
                console.log("errrmsg", errmsg, "\n------------");
                reject(Error(errmsg));
            }
        };

        // Handle network errors
        req.onerror = function(err) {
            console.log("req.onerror", err);
            reject(Error("Network Error: "+err));
        };

        // Make the request
        req.send();
    });
}

function hasPunct(word) {
    return word.dataset.punct;
}
function capitalizeWord(text) {
    var c1 = text.substr(0,1);
    c1 = c1.toLocaleUpperCase();
    return c1+text.substr(1);
}
function makePunctControl(label, controlContainer) {
    var ctrl = makeEditControl(null, label, controlContainer, "Add punctuation");
    ctrl.addEventListener("click", function(ev){
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        ev.preventDefault();
        if (!theEditControls.classList.contains("enabled")) return;
        var evNode = ev.target;
        var aw = getActiveVisibleWordWithMsg();
        if (!aw) return;
        var taw = aw.innerHTML;
        var oaw = aw.dataset.ow;
        if (!oaw) {
            aw.dataset.ow = taw;
            aw.classList.add("changed");
            refreshTheChangedSpans();
        }
        // console.log("taw:", taw);
        if (hasPunct(aw)) {
            taw = taw.substr(0,taw.length-1);
        } else {
            // upcase next word
            let nextW = findPNearSpan(aw, 1);
            if (nextW) {
                var tnw = nextW.innerHTML;
                var onw = nextW.dataset.ow;
                if (!onw) {
                    nextW.dataset.ow = tnw;
                    nextW.classList.add("changed");
                    refreshTheChangedSpans();
                }
                nextW.innerHTML = capitalizeWord(tnw);
                setTimeout(()=>updateEltToDoc(nextW), 0);
            }
        }
        aw.dataset.punct = label;
        taw += label;
        // console.log("taw:", taw);
        aw.innerHTML = taw;
        setTimeout(()=>updateEltToDoc(aw), 0);
    });
    return ctrl;
}
function makeEditControl(id, label, controlContainer, title, number) {
    var ctrl = document.createElement("div");
    controlContainer.appendChild(ctrl);
    if (id) ctrl.setAttribute("id", id);
    if (title) ctrl.setAttribute("title", title);
    ctrl.appendChild(document.createTextNode(label));
    if (number) {
        let nSpan = document.createElement("span");
        nSpan.classList.add("number-span");
        nSpan.classList.add("hidden");
        ctrl.appendChild(nSpan);
        // nSpan.innerText = "15";
    }
    ctrl.classList.add("edit-control");
    ctrl.addEventListener("click", function(ev){
        // ev.stopPropagation();
        // ev.stopImmediatePropagation();
        ev.preventDefault();
        // ctrl.classList.add("clicked");
        // setTimeout(function(){
        //     ctrl.classList.remove("clicked");
        // }, 500);
        showClick(ctrl);
    });
    return ctrl;
}
function makeEditControlContainer(id, parent) {
    var container = document.createElement("div");
    parent.appendChild(container);
    container.setAttribute("id", id);
    container.classList.add("control-container");
    return container;
}
function walkTheDOM(node, func) {
    func(node);
    node = node.firstChild;
    while (node) {
        walkTheDOM(node, func);
        // node = node.nextSibling; // fix-me: nextElementSibling?
        node = node.nextElementSibling; // fix-me: nextElementSibling?
    }
}
function walkTheDOMmirror(node, mirrorParent, func) {
    var newParent = func(node, mirrorParent);
    if (!newParent) return null;
    node = node.firstChild;
    while (node) {
        walkTheDOMmirror(node, newParent, func);
        // node = node.nextSibling;
        node = node.nextElementSibling; // fix-me: nextElementSibling?
    }
    return newParent;
}
function millisec2hhMM(milliSec) {
    let d = new Date(null);
    let isoT;
    try {
        d.setTime(milliSec);
        isoT = d.toISOString();
    } catch(e) {
        console.log("milliSec", milliSec);
        throw e;
    }
    return isoT.substring(11,23)

    // function fill0(num, fill) {
    //     let zeros = "";
    //     let ret = "000"+num;
    //     return ret.substr(ret.length-fill)
    // }
    // var restMilli = milliSec;
    // var hours   = Math.floor(restMilli / 3600000);
    // restMilli   = restMilli - hours *    3600000;
    // var minutes = Math.floor(restMilli / 60000);
    // restMilli   = restMilli - minutes *  60000;
    // var seconds = Math.floor(restMilli / 1000);
    // restMilli   = restMilli - seconds *  1000;
    // var ret =
    //     fill0(hours, 2) + ":" +
    //     fill0(minutes,2) + ":" +
    //     fill0(seconds, 2) +
    //     "." + fill0(restMilli, 3);
    // return ret;
}
var theSpokenSpan;
function removeSpokenSpan() {
    if (theSpokenSpan) theSpokenSpan.classList.remove("spoken");
    theSpokenSpan = null;
    endAndStartCheckActiveWordTimer();
}
function setSpokenSpan(span) {
    if (span === theSpokenSpan) return;
    removeSpokenSpan();
    theSpokenSpan = span;
    theSpokenSpan.classList.add("spoken");
}

// The active node is the node the control buttons works on.
var theFocusedNode;
function getActiveWord() {
    if (theSpokenSpan) { return theSpokenSpan; }
    // if (thePlayWord) return thePlayWord.wordNode;
    if (theFocusedNode) return theFocusedNode;
}
function getActiveVisibleWord() {
    var cw = getActiveWord();
    if (!cw) return null;
    var re = theEditor.getBoundingClientRect();
    var rcw = cw.getBoundingClientRect();
    if (rcw.top < re.top) return null;
    if (rcw.bottom > re.bottom) return null;
    return cw;
}
function getActiveVisibleWordWithMsg() {
    var vw = getActiveVisibleWord();
    if (!vw) tempMessage("Please choose a word first");
    return vw;
}

var theActiveWord;
function checkActiveWord() {
    theActiveWord = getActiveVisibleWord();
    if (theActiveWord) {
        setEditControlsOn(true);
    } else {
        setEditControlsOn(false);
    }
}
function setEditControlsOn(on) {
    if (on) { 
        if (!theEditControls.classList.contains("enabled")) theEditControls.classList.add("enabled");
    } else {
        if (theEditControls.classList.contains("enabled")) theEditControls.classList.remove("enabled");
    }
}

var endAndStartCheckActiveWordTimer = (function(){
    var timer;
    return function(){
        clearTimeout(timer);
        timer = null;
        timer = setTimeout(function(){
            checkActiveWord();
        }, 200); // Ok.
    };
})();

var theWordSpans;
var theBadWordSpans;
var theOkWordSpans;
var theChangedSpans;
function setNumber(ctrl, num) {
    let numberSpan = ctrl.lastChild;
    if (!numberSpan.classList.contains("number-span")) throw "not number span";
    // let num = theBadWordSpans.length;
    if (num == 0) {
        numberSpan.classList.add("hidden");
    } else {
        numberSpan.innerText = num;
        numberSpan.classList.remove("hidden");
    }
}
function refreshTheChangedSpans() {
    theChangedSpans = theTranscriptDiv.querySelectorAll("span[class*=changed]")
    setNumber(theCtrlReset, theChangedSpans.length);
    if (theChangedSpans.length == 0) theChangedSpans = null;
}
function refreshTheOkBadSpans() {
    if (!theTranscriptDiv) return;
   
    theBadWordSpans = theTranscriptDiv.querySelectorAll("span[class*=word-bad]")
    theOkWordSpans = theTranscriptDiv.querySelectorAll("span[class*=word-ok]")
    setNumber(theCtrlBad, theBadWordSpans.length);
    setNumber(theCtrlOk, theOkWordSpans.length);
    if (theBadWordSpans.length == 0) theBadWordSpans = null;
    if (theOkWordSpans.length == 0) theOkWordSpans = null;
}
function findChangedWord(milliSec, forward) {
    refreshTheChangedSpans();
    if (!theChangedSpans) return;
    var len = theChangedSpans.length;
    if (len == 0) return;
    var bw, t;
    if (forward) {
        for (var i=0; i<len; i++) {
            bw = theChangedSpans[i];
            t = +bw.getAttribute("abst");
            if (t >= milliSec) return bw;
        }
    } else {
        for (var i=len-1; i>=0; i--) {
            bw = theChangedSpans[i];
            t = +bw.getAttribute("abst");
            if (t <= milliSec) return bw;
        }
    }
    return null;
}
function findBadWord(milliSec, forward) {
    if (!theBadWordSpans) return;
    var len = theBadWordSpans.length;
    if (len == 0) return;
    var bw, t;
    if (forward) {
        for (var i=0; i<len; i++) {
            bw = theBadWordSpans[i];
            t = +bw.getAttribute("abst");
            if (t >= milliSec) return bw;
        }
    } else {
        for (var i=len-1; i>=0; i--) {
            bw = theBadWordSpans[i];
            t = +bw.getAttribute("abst");
            if (t <= milliSec) return bw;
        }
    }
    return null;
}

function makePlayWord(wordNode) {
    var startW = findPNearSpan(wordNode, -thePlayWordNBefore);
    var startT = +startW.getAttribute("abst");
    var endW = findPNearSpan(wordNode, thePlayWordNAfter);
    var endT = +endW.getAttribute("abst") + +endW.getAttribute("d");
    thePlayWord = 
        {
            wordNode: wordNode,
            wT: wordNode.innerText, // debug
            startW: startW.innerText, // debug
            endW: endW.innerText, // debug
            startMilliSec: startT,
            endMilliSec: endT
        };
}
function setupAndStartToPlayWord(wordNode) {
    // console.log("setupAndStartToPlayWord");
    endAndStartPlayWordEndTimer(false);
    endPlayWord();
    makePlayWord(wordNode);
    console.log("=========== thePlayWord", thePlayWord);
    var desiredTime = thePlayWord.startMilliSec / 1000;
    theVideoPlayer.currentTime = desiredTime;
    var timer = setInterval(()=>{
        if (Math.abs(theVideoPlayer.currentTime - desiredTime) > 0.1) return;
        clearInterval(timer);
        theVideoPlayer.play();
        endAndStartPlayWordEndTimer(true);
    },100); // fix-me: we do not have a seeked event
}

// Start point for play word!
var endAndStartPlayWordTimer = (function(){
    var timer;
    return function(start, wordNode){
        clearTimeout(timer);
        timer = null;
        if (start) {
            timer = setTimeout(function(){ setupAndStartToPlayWord(wordNode); }, 10); // Ok.
        }
    };
})();

var endAndStartPlayWordEndTimer = (function(){
    var timer;
    return function(start){
        var timeLeft;
        if (thePlayWord) timeLeft = thePlayWord.endMilliSec - theVideoPlayer.currentTime * 1000;
        console.log("----------- end play word timer, currentTime: start=", start, "tl:", Math.floor(timeLeft), "vpc:", Math.floor(theVideoPlayer.currentTime * 1000),
                    thePlayWord? thePlayWord.endMilliSec: null);
        clearTimeout(timer);
        timer = null;
        if (start) {
            if (timeLeft < 0) { // fix-me: how can this happen???
                endPlayWord(); 
                return;
            }
            if (timeLeft < 500) {
                // console.log("endPlayWord in", timeLeft);
                timer = setTimeout(endPlayWord, timeLeft+2);
            } else {
                timer = setTimeout(()=>{endAndStartPlayWordEndTimer(true)}, 500);
            }

        }
    };
})();
function endPlayWord() {
    theVideoPlayer.pause();
    stopFollowVideo();
    console.log("endPlayWord should be paused now..., at ", theVideoPlayer.currentTime);
    // removeSpokenSpan();
    if (!thePlayWord) return;
    setSpokenSpan(thePlayWord.wordNode);
    thePlayWord = null;
}



function handleWordBlur(ev) {
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    ev.preventDefault();
    var evNode = ev.target;
    handleWordBlurAction(evNode);
}
function removePlayArrowIfNotChanged(wordNode) {
    let possArr = wordNode.nextElementSibling;
    let arrowed = possArr && possArr.classList.contains("play-arrow");
    if (arrowed) {
        if (!wordNode.classList.contains("changed")) {
            possArr.parentElement.removeChild(possArr);
        }
    }
}
function removeChangedIfNotPlayArrow(wordNode) {
    let possArr = wordNode.nextElementSibling;
    let arrowed = possArr && possArr.classList.contains("play-arrow");
    if (!arrowed) wordNode.classList.remove("changed");
}
function handleWordBlurAction(evNode) {
    // if (evNode.nextElementSibling === thePlayArrow) thePlayArrow.parentNode.removeChild(thePlayArrow);
    // setSpokenSpan(evNode);
    endAndStartCheckActiveWordTimer();
    setTimeout(()=>{if (theFocusedNode === evNode) theFocusedNode = null;}, 200);
    evNode.removeAttribute("contenteditable");
    window.getSelection().removeAllRanges();
    evNode.removeEventListener("keypress", theEditedKeyHandler);
    var ow = evNode.dataset.ow;
    if (ow == evNode.innerHTML) {
        delete evNode.dataset.ow;
        removeChangedIfNotPlayArrow(evNode);
        refreshTheChangedSpans();
    }
    // fix-me: keep better control of changes here so we do not have to update to the web
    // fix-me: No blur on unload. 
    if (!theCapLoadType) throw "cap load type not set";
    if (theCapLoadType == CapLoadTypes.local) return;
    setTimeout(()=>updateEltToDoc(evNode), 0);
}


function handleWordClick(ev) {
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    ev.preventDefault();
    var evNode = ev.target;
    if (evNode.getAttribute("contenteditable")) {
        // handleWordClickAction(evNode);
    } else {
        console.log("evNode.focus() in handleWordClick()");
        evNode.focus();
        // fix-me: .focus() seems to not work when ev is handled on theEditor???
        // fix-me: seems to not
        handleWordFocusAction(evNode);
    }
}
function handleWordClickAction(evNode) {
    endAndStartPlayWordTimer(true, evNode);
}

function handleWordFocus(ev) {
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    ev.preventDefault();
    // fix-me: never called. Timer for the handling!
    // console.log("================ focus event");
    var evNode = ev.target;
    handleWordFocusAction(evNode);
    if (!thePlayWord) {
        theVideoPlayer.pause();
        // removeSpokenSpan();
    }
}
function handleWordFocusAction(evNode) {
    // console.log("************************* handleWordFocusAction", evNode, evNode.textContent);
    theFocusedNode = evNode;
    endAndStartCheckActiveWordTimer();
    if (theVideoPlayer.paused) {
        // endAndStartPlayWordTimer(false, evNode);
    }
    theVideoPlayer.currentTime = +evNode.getAttribute("abst") / 1000;
    var origWord = evNode.dataset.ow;
    if (!origWord) {
        evNode.dataset.ow = evNode.innerText;
        evNode.classList.add("changed");
        refreshTheChangedSpans();
    }
    // theEditedWord = evNode;
    setSpokenSpan(evNode);
    evNode.setAttribute("contenteditable", true);
    // console.log("focus", "ev", ev, "evNode", evNode);
    evNode.addEventListener("keypress", theEditedKeyHandler);

    // evNode.parentNode.insertBefore(thePlayArrow, evNode.nextElementSibling);
    makePlayArrow(evNode);

    // fix-me: it seems like selection getting the old node...
    // try setTimeout
    // console.log("================ in focus");
    setTimeout(function() {
        var sel = window.getSelection();
        // fix-me: I do not understand focusNode. Propagation problem? Timing?
        // if (sel.focusNode && sel.focusNode.parentNode !== evNode) {
        if (true) {
            // console.log("================ in focus timer");
            var range = document.createRange();
            // touchDevice = true;
            if (true || touchDevice) {
                // Avoid the popup for a user selection
                var textNode = evNode.firstChild;
                if (!textNode) {
                    // fix-me: should really never be empty. 
                    textNode = document.createTextNode(" ");
                    evNode.appendChild(textNode);
                }
                var caretPos = evNode.textContent.length;
                range.setStart(textNode, caretPos);
                range.setEnd(textNode, caretPos);
            } else {
                range.selectNodeContents(evNode);
            }
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }, 10);
}



var thePs;
function setupThePs() {
    if (thePs) return;
    if (!theTranscriptDiv) return;
    thePs = theTranscriptDiv.querySelectorAll("p.wordp");
    // add index
    var plen = thePs.length;
    for (var i=0; i<plen; i++) { thePs[i].dataset.pi = i; }
}
function findPNearSpan(word, dist) {
    // console.log("findPNearSpan", word.innerText, dist);
    setupThePs();
    var thisP = word.parentNode;

    if (dist > 0) {
        var nextW = word;
        var oldvNextW;
        while (dist-- > 0 && nextW) {
            oldvNextW = nextW;
            nextW = nextW.nextElementSibling;
            if (nextW && !nextW.classList.contains("word")) {
                // oldvNextW = nextW;
                nextW = nextW.nextElementSibling;
            }
        }
        if (nextW) return nextW;
        var nextP = thePs[+word.parentNode.dataset.pi+1];
        if (!nextP) return oldvNextW;
        splitPifNeeded(nextP);
        var firstW = nextP.firstElementChild;
        return findPNearSpan(firstW, dist+1);
    } else {
        var prevW = word;
        var oldPrevW;
        while (dist++ < 0 && prevW) {
            oldPrevW = prevW;
            prevW = prevW.previousElementSibling;
        }
        if (prevW) return prevW;
        var prevP = thePs[+word.parentNode.dataset.pi-1];
        if (!prevP) return oldPrevW;
        splitPifNeeded(prevP);
        var lastW = prevP.lastElementChild;
        return findPNearSpan(lastW, dist-1);
    }
} 
function findPSpanAt(milliSec) {
    // console.log("&&&&&&&&& findPSpanAt", milliSec);
    var ms = milliSec;
    var p = findPAt(ms);
    if (!p) return; // fix-me: how can this happen?
    splitPifNeeded(p);
    // console.log("findPSpanAt p", p);
    var w = p.firstElementChild;
    if (!w) return null;
    // debugger;
    var wn, wnt;
    var i = 0;
    while (i++ < 20) {
        // console.log("findPSpanAt, w", w.textContent);
        if (!w.classList.contains("word")) w = w.nextElementSibling;
        wn = w.nextElementSibling;
        while (wn && !wn.classList.contains("word")) wn = wn.nextElementSibling;
        if (!wn) return w;
        wnt = wn.getAttribute("abst");
        if (!wnt) debugger;
        if (+wnt > milliSec) return w;
        w = wn;
    }
    debugger;
}
function findPAt(milliSec) {
    var idx = findPIndexAt(milliSec);
    return thePs[idx];
}
function findPIndexAt(milliSec) {
    setupThePs();
    if (!thePs) return;
    
    var ps = thePs;
        
    // https://oli.me.uk/2013/06/08/searching-javascript-arrays-with-a-binary-search/
    // https://oli.me.uk/2014/12/17/revisiting-searching-javascript-arrays-with-a-binary-search/
    var minIndex = 0;
    var maxIndex = ps.length - 1;
    var currentIndex = minIndex; // fix-me: so we can quit immediately
    var currentElement, nextElement;
 
    while (minIndex < maxIndex) {
        currentIndex = Math.floor((minIndex + maxIndex) / 2);
        currentElement = ps[currentIndex];
 
        if (+currentElement.getAttribute("t") < milliSec) {
            nextElement = ps[currentIndex+1];
            if (+nextElement.getAttribute("t") < milliSec) {
                minIndex = currentIndex + 1;
            } else {
                return currentIndex;
            }
        }
        else if (+currentElement.getAttribute("t") > milliSec) {
            maxIndex = currentIndex - 1;
        }
        else {
            return currentIndex;
        }
    }
    // return spans[currentIndex];
    return currentIndex;
    // return -1;
}

// fix-me: obsolete
function findNearSpan(word, dist) {
    // fix-me: forgot to use the bin search. But anyway this should perhaps not be used?
    theWordSpans = theWordSpans || theTranscriptDiv.querySelectorAll("span");
    var spans = theWordSpans;
    var len = spans.length;
    var iWord;
    for (var i=0; i<len; i++) {
        if (spans[i] === word) {
            iWord = i;
            break;
        }
    } 
    return spans[iWord+dist];
} 
function findSpanAt(milliSec) {
    return theWordSpans[findSpanIndexAt(milliSec)];
}
function findSpanIndexAt(milliSec) {
    theWordSpans = theWordSpans || (theTranscriptDiv && theTranscriptDiv.querySelectorAll("span"));
    if (!theWordSpans) return;
    
    var spans = theWordSpans;
        
    // https://oli.me.uk/2013/06/08/searching-javascript-arrays-with-a-binary-search/
    var minIndex = 0;
    var maxIndex = spans.length - 1;
    var currentIndex;
    var currentElement;
 
    while (minIndex <= maxIndex) {
        currentIndex = (minIndex + maxIndex) / 2 | 0;
        currentElement = spans[currentIndex];
 
        if (+currentElement.getAttribute("abst") < milliSec) {
            minIndex = currentIndex + 1;
        }
        else if (+currentElement.getAttribute("abst") > milliSec) {
            maxIndex = currentIndex - 1;
        }
        else {
            return currentIndex;
        }
    }
    // return spans[currentIndex];
    return currentIndex;
    // return -1;
}

var theFile;
var theTranscript;
var theTranscriptDiv;
var theHeader;

function handlePwordsClick(ev) {
    var evNode = ev.target;
    console.log("p click ev", evNode, ev);
    splitPifNeeded(evNode);
    var span;
    var tries = 0;
    function getSpanFromPoint() {
        // span = document.elementFromPoint(ev.screenX, ev.screenY);
        span = document.elementFromPoint(ev.clientX, ev.clientY);
        console.log("span from point", span.tagName);
    }
    var timer = setInterval(function(){
        getSpanFromPoint();
        if (span.tagName === "SPAN") {
            clearInterval(timer);
            // handleWordClickAction(span);
            handleWordFocusAction(span);
            return;
        }
        if (span.tagName === "P") {
            if (span.firstElementChild && span.firstElementChild.tagName === "SPAN") {
                clearInterval(timer);
                // if (thePlayArrow.parentNode) thePlayArrow.parentNode.removeChild(thePlayArrow);
                return;
            }
        }
        if (++tries > 100) { debugger; clearInterval(timer); return; }
    }, 10); // fix-me
    // getSpanFromPoint(); // fix-me, trust this? No.
    // debugger;
}


var theEditorBaseDoc;
function updateEltToDoc(elt) {
    if (!theCapLoadType) throw "cap load type not set";
    if (theCapLoadType == CapLoadTypes.local) return;
    uploadElt(elt, theEditorBaseDoc, theCurrentKey);
}
async function downloadEdit(userOrShared, key) {
    try {
        switch (userOrShared) {
        case "user":
            if (theCapLoadType != CapLoadTypes.user) throw "not user";
            break;
        case "shared":
            if (theCapLoadType != CapLoadTypes.shared) throw "not shared";
            break;
        default:
            throw "bad userOrShared";
        }
        theEditorBaseDoc = await getBaseDoc(userOrShared);
        let docFrag = await downloadElts(theEditorBaseDoc, key);
        let transDiv = docFrag.firstElementChild;
        // setTimeout(function() {
        //     // var ps=transDiv.querySelectorAll(":scope>p");
        //     var ps=transDiv.querySelectorAll("p");
        //     console.log("ps", ps);
        //     ps.forEach((p)=>{ joinPifPossible(p); })}, 2000);
        console.log("downloadEdit", userOrShared, key, docFrag);
        return docFrag;
    } catch (err) { throw err; }
}

function loadCaptionsFromTimedText(contents) {
    var parser = new DOMParser();
    var xmlDoc = parser.parseFromString(contents,"application/xml");
    // var xmlDoc = parser.parseFromString(theFile,"application/xml");
    console.log("timedtext xmlDoc", xmlDoc);
    theTranscript = document.createElement("section");
    theTranscriptDiv = document.createElement("div");
    theTranscriptDiv.setAttribute("id", "the-transcript-div");
    walkTheDOMmirror(xmlDoc.firstChild, theTranscript,
                     function(node, mirrorParent) {
                         var newNode;
                         // console.log("node", node);
                         if (node.tagName == "timedtext") {
                             newNode = document.createElement("section");
                         } else if (node.tagName == "head") {
                             // save head, http://innerdom.sourceforge.net/
                             theHeader = document.createElement("header");
                             mirrorParent.appendChild(theHeader);
                             theHeader.appendChild(
                                 document.createTextNode(node.outerHTML));
                             return null;
                         } else if (node.tagName == "body") {
                             newNode = theTranscriptDiv;
                         } else if (node.tagName == "p") {
                             newNode = document.createElement("p");
                             // newNode.dataset.orig = node.outerHTML;
                             // newNode.addEventListener("clickNO", function(ev) {
                             //     var evNode = ev.target;
                             //     console.log("p click ev", evNode, ev);
                             //     splitPifNeeded(evNode);
                             //     var span;
                             //     var tries = 0;
                             //     function getSpanFromPoint() {
                             //         // span = document.elementFromPoint(ev.screenX, ev.screenY);
                             //         span = document.elementFromPoint(ev.clientX, ev.clientY);
                             //         console.log("span from point", span.tagName);
                             //     }
                             //     var timer = setInterval(function(){
                             //         getSpanFromPoint();
                             //         if (span.tagName === "SPAN") {
                             //             clearInterval(timer);
                             //             // handleWordClickAction(span);
                             //             handleWordFocusAction(span);
                             //             return;
                             //         }
                             //         if (span.tagName === "P") {
                             //             if (span.firstElementChild && span.firstElementChild.tagName === "SPAN") {
                             //                 clearInterval(timer);
                             //                 if (thePlayArrow.parentNode) thePlayArrow.parentNode.removeChild(thePlayArrow);
                             //                 return;
                             //             }
                             //         }
                             //         if (++tries > 100) { debugger; clearInterval(timer); return; }
                             //     }, 10); // fix-me
                             //     // getSpanFromPoint(); // fix-me, trust this? No.
                             //     // debugger;
                             // });

                             var startTime = node.getAttribute("t");
                             var duration = node.getAttribute("d");
                             newNode.setAttribute("t", startTime);
                             if (duration) newNode.setAttribute("d", duration);
                             // Fix-me: there are empty p:s, what are they for?
                             var a = node.getAttribute("a");
                             if (a !== null) {
                                 newNode.classList.add("empty");
                                 if (node.childElementCount != 0) breakHere();
                             } else {
                                 newNode.classList.add("wordp");
                             }
                         } else if (node.tagName == "s") {
                             if (mirrorParent.tagName != "P") breakHere();
                             mirrorParent.appendChild(document.createTextNode(" "));
                             newNode = document.createElement("span");
                             // newNode.dataset.orig = node.outerHTML;
                             var relStartTime = +node.getAttribute("t");
                             var acDuration = +node.getAttribute("ac");
                             newNode.setAttribute("t", relStartTime);
                             newNode.setAttribute("d", acDuration);
                             var parentStartTime = +mirrorParent.getAttribute("t");
                             var absStartTime = relStartTime+parentStartTime;
                             newNode.setAttribute("abst", absStartTime);
                             var title = millisec2hhMM(absStartTime);
                             newNode.setAttribute("title", title+ "("+absStartTime+"-"+(absStartTime+acDuration)+")");
                             newNode.classList.add("word");
                             newNode.setAttribute("tabindex", 0); // Make it focusable
                             // newNode.addEventListener("click", handleWordClick);
                             // newNode.addEventListener("focus", function(ev) {
                             //     var evNode = ev.target;
                             //     handleWordFocusAction(evNode);
                             // });
                             // newNode.addEventListener("blur", handleWordBlur);
                         } else {
                             // console.log("node.tagName", node.tagName, node.nodeType, node);
                             if (node.nodeType == node.TEXT_NODE) {
                                 newNode = document.createTextNode(node.textContent.trim());
                             } else {
                                 return null;
                             }
                         }
                         mirrorParent.appendChild(newNode);
                         return newNode;
                     });
}

var enumCapFormats = Object.freeze(
    {
        WebVTT: "WebVTT",
        YouTubeTimedText: "YouTubeTimedText"
    }
);
function guessCapFormatFromContents(contents) {
    if (contents.match(new RegExp("<timedtext"))) {
        return enumCapFormats.YouTubeTimedText;
    } else {
        return enumCapFormats.WebVTT;
    }
}
function guessCapFormatFromFileExt(fileExt) {
    if ("vtt" == fileExt) return enumCapFormats.WebVTT;
    if ("ytml" == fileExt) return enumCapFormats.YouTubeTimedText;
    alert("Don't know captions format for file extension "+fileExt+ " 😕");
    return null;
}
function loadCaptionContents(contents, capFormat) {
    console.log("loadCaptoinContents", contents.length, capFormat);
    document.getElementById('text').value = contents;
    switch(capFormat) {
    case enumCapFormats.WebVTT:
        // console.log("++++++++++++++++++ vtt");
        div = WebVTT.convertCueToDOMTree(window, contents);
        console.log("vtt div", div);
        theTranscript = document.createElement("section");
        theTranscriptDiv = div; // document.createElement("div");
        theTranscriptDiv.setAttribute("id", "the-transcript-div");
        theTranscript.appendChild(theTranscriptDiv);
        break;
    case enumCapFormats.YouTubeTimedText:
        // console.log("++++++++++++++++++ YT");
        loadCaptionsFromTimedText(contents);
        break
    default:
        console.log("bad", capFormat);
        alert("Bad captions format: 😕"+capFormat);
        debugger;
        return;
    }
    setPathIds();
    saveCurrentVideoToLocal();
    // if ("vtt" == fileExt) {
    //     div = WebVTT.convertCueToDOMTree(window, contents);
    // } else if ("ytml" == fileExt) {
    //     loadCaptionsFromTimedText(contents);
    // } else {
    //     alert("Can't parse "+fileName);
    // }
    console.log("theTranscript", theTranscript);
    console.log("theTranscriptDiv", theTranscriptDiv);
    var ps=theTranscriptDiv.querySelectorAll(":scope>p");
    ps.forEach((p)=>{
        let ih = p.innerHTML;
        if (ih) p.dataset.ih = ih;
        p.innerHTML = p.textContent;
        p.setAttribute("tabindex", 0);
    })
    // theEditor.innerHTML = "";
    // theEditor.appendChild(theTranscriptDiv);
    // refreshTheChangedSpans();
    // refreshTheOkBadSpans();
    insertTranscriptDiv(theTranscriptDiv);
}
function insertTranscriptDiv(transDiv) {
    theTranscriptDiv = transDiv;
    theEditor.innerHTML = "";
    theEditor.appendChild(transDiv);
    refreshTheChangedSpans();
    refreshTheOkBadSpans();
    theTranscriptDiv.style.display = "block";
}
function handleFileSelect(ev) {
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    ev.preventDefault();

    var files = ev.dataTransfer.files; // FileList object.

    var fileReader = new FileReader();
    var fileName;
    fileReader.onloadend = function(event) {
        var contents = event.target.result,
        error    = event.target.error;
        console.log("fileName", fileName);

        var re = /(?:\.([^.]+))?$/;
        var ext = re.exec(fileName)[1];   // "txt"
        console.log("ext", ext);
        
        if (error != null) {
            console.error("File could not be read! Code " + error.code);
        } else {
            // progressNode.max = 1;
            // progressNode.value = 1;
            // console.log("Contents: " + contents);
            // loadCaptionContents(contents, ext);
            loadCaptionContents(contents, guessCapFormatFromFileExt(ext));
        }
    };

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
        output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                    f.size, ' bytes, last modified: ',
                    f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a',
                    '</li>');
        fileName = f.name;
        theFile = f;
        fileReader.readAsText(f);
    }
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}

function handleDragOver(ev) {
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

window.onload = function() {
    // Setup the dnd listeners.
    var dropZone = document.getElementById('drop-zone');
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleFileSelect, false);
}



function shareToFacebook(lnk) {
    // fix-me: mobile?
    var escLnk = encodeURIComponent(lnk);
    var shareLnk = "https://facebook.com/share.php?u="+escLnk; 
    // Facebook resizes the window
    var specs = "width=400,height=400,menubar=no,titlebar=no,toolbar=no,top=50,left=50";
    var popup = window.open(shareLnk, null, specs);
    // Try iframe, not allowed because X-Frame-Options does not allow it
    // if (!popup) {
    //     iframe = document.createElement("iframe");
    //     iframe.setAttribute("id", "facebook-share-iframe");
    //     document.body.appendChild(iframe);
    //     iframe.src = shareLnk;
    // }
}
window.addEventListener("load", function(){
    var shareElt = document.getElementById("share-facebook");
    shareElt.addEventListener("click", function(ev){
        shareToFacebook(window.location.href);
    });
});


//-----------------------------------------------------------------------
function videoPlayEvent(ev) {
    // console.log("videoPlayEvent", ev);
    // if (!thePlayWord && thePlayArrow && thePlayArrow.parentNode) {
    //     thePlayArrow.parentNode.removeChild(thePlayArrow);
    // }
    startFollowVideo();
    // return;
    // if (thePlayWord != null) return;
    // var word = findSpanAt(theVideoPlayer.currentTime * 1000);
    // word.parentElement.scrollIntoViewIfNeeded();
    // setSpokenSpan(word);
}

function videoPauseEvent(ev) {
    stopFollowVideo();
}

function startFollowVideo() {
    setupThePs();
    if (!thePs) return;
    // var wi = findSpanIndexAt(theVideoPlayer.currentTime * 1000);
    var word = findPSpanAt(theVideoPlayer.currentTime * 1000);
    var wt = word? word.textContent : null;
    console.log("====>>>>>>>>>> startFollowVideo", word, wt, theVideoPlayer.currentTime);
    // followVideoToNext(wi);
    if (word) followVideoToNext(word);
}

function followVideoToNext(currentWord) {
    var word = currentWord;
    setSpokenSpan(word);
    // fix-me: It does not seem like we need to split here, DOM
    // updating of word marking works nicely once setSpokenSpan is
    // first.
    var re = theEditor.getBoundingClientRect();
    if (thePlayWord) {
        word.parentElement.scrollIntoViewIfNeeded();
    } else {
        var where = (re.height < 120) ? "end":"center";
        word.parentElement.scrollIntoView({ block: where, behavior: "smooth"});
    }
    var nextWord = word.nextElementSibling;
    if (nextWord && !nextWord.classList.contains("word")) nextWord = nextWord.nextElementSibling;
    if (!nextWord) {
        var thisP = word.parentElement;
        var nextP = thePs[+thisP.dataset.pi+1];
        if (!nextP) return; // fix-me, ok?
        // Fix-me: need MutationObserver (on all splitPifNeeded!)
        splitPifNeeded(nextP);
        nextWord = nextP.firstElementChild;
        if (!nextWord) debugger;
        if (nextWord.tagName !== "SPAN") debugger;
        if (!nextWord.classList.contains("word")) debugger;
    }
    var nextTime = +nextWord.getAttribute("abst");
    if (thePlayWord) console.log("++++++followVideoToNext", thePlayWord.endMilliSec, nextTime, nextWord.innerText);
    if (thePlayWord && (thePlayWord.endMilliSec < nextTime)) return;
    var vidTime = theVideoPlayer.currentTime * 1000;
    var delay = nextTime - vidTime;
    // Avoid looping if something goes wrong;
    // if (delay < 10) { console.log("followVideoToNext, delay", delay); return; }
    // console.log("followVideoToNext", currentWordI, word.innerHTML, nextTime, vidTime, delay);
    theFollowVideoTimer = setTimeout(function(){
        // console.log("to next word", nextI, nextWord.innerHTML);
        // followVideoToNext(nextI);

        followVideoToNext(nextWord);
        // fix-me: spoken span, must be cleared before join! Ok, here?
        if (thisP) joinPifPossible(thisP);
    }, delay);
}

function stopFollowVideo() {
    // console.log("stopFollowVideo");
    clearTimeout(theFollowVideoTimer);
}

function videoSeekedEvent(ev) {
}
class VideoPlayer {
    constructor(id, container) {
        container.innerHTML = "";
        if (id) this.id = id;
        this.container = container;
        this.kind = "";
        // console.log("VideoPlayer.container", this.container);
        this.evtHand = {
            seeked: videoSeekedEvent,
            play:   videoPlayEvent,
            pause:  videoPauseEvent
        };
        // console.log("this.evtHand", this.evtHand);
            
    }
    destroy() { debugger; } // remove eventlisteners, remove from container, etc.
    pause() { debugger; }
    play() { debugger; }
    get paused() { debugger; }
    get currentTime() { debugger; }
    set currentTime(seconds) { debugger; }
}

class VideoPlayerHTML5 extends VideoPlayer {
    constructor(id, container) {
        super(id, container);
        this.kind = "html5";
        this.vidElt5 = document.createElement("video");
        if (container) this.container.appendChild(this.vidElt5);
        this.vidElt5.setAttribute("id", this.id);
        this.vidElt5.setAttribute("controls", "true");
        this.vidElt5.setAttribute("playsinline", "true");

        var me = this;
        // console.log("this.evtHand", this.evtHand);
        this.vidElt5.addEventListener("play",   function(ev){
            // console.log("html5 play ev", ev);
            me.evtHand.play(ev); });
        this.vidElt5.addEventListener("pause",  function(ev){
            // console.log("html5 pause ev", ev);
            me.evtHand.pause(ev); });
        this.vidElt5.addEventListener("seeked", function(ev){
            // console.log("html5 seeked ev", ev);
            me.evtHand.seeked(ev); });
    }
    setSourceURL(videoURL) {
        this.vidElt5.setAttribute("src", videoURL);
    }
    addTrack(arg) {
        var trackElt = document.createElement("track");
        this.vidElt5.appendChild(trackElt);
        trackElt.setAttribute("src", arg.srcURL);
        trackElt.setAttribute("srclang", arg.srclang);
        trackElt.setAttribute("label", arg.label);
        trackElt.setAttribute("kind", arg.kind);
    }
    pause() { this.vidElt5.pause(); }
    play() { this.vidElt5.play(); }
    get paused() { return this.vidElt5.paused; }
    get currentTime() { return this.vidElt5.currentTime; }
    set currentTime(seconds) { this.vidElt5.currentTime = seconds; }
}


// https://developers.google.com/youtube/iframe_api_reference
class VideoPlayerYouTube extends VideoPlayer {
    constructor(id, container) {
        super(id, container);
        this.kind = "youtube";

        // fix-me: where to set id?
        var tempDiv = document.createElement("div");
        tempDiv.setAttribute("id", "temp-div-yt");

        //container.appendChild(tempDiv);
        var ytContainer = document.createElement("div");
        ytContainer.setAttribute("id", "my-yt-div");
        ytContainer.appendChild(tempDiv);
        container.appendChild(ytContainer);

        this.vidYT = new YT.Player(
            tempDiv,
            {
                // 'onReady': function() { debugger; },
                // 'onStateChange': function(evt) { debugger; }
            });
        var me = this;
        me.pausedValue = undefined;
        me.initialized = false;
        this.promiseReady = new Promise(function(a){
            me.vidYT.addEventListener("onReady", ()=>{a();});
        });
        this.mobilePlayProtect = true; // fix-me: guess, removed on play event
        me.mobilePlayProtectOn = function() {
            if (me.mobilePlayProtect) {
                let msg = "Your mobile device is protected from playing videos unless"
                          + " you yourself first start them directly."
                          + " Please start and stop the video and then try this again.";
                if (typeof Popup !== "undefined" && Popup) {
                    var popMap = new Map();
                    popMap.set("OK, got it!", null);
                    new Popup("Your mobile can't play the video yet! 🐿️", msg, popMap, false).show();
                } else {
                    alert(msg + " 🐿️");
                }
            } else {
                // alert("no mobile play protect on now");
            }
            return me.mobilePlayProtect;
        }
                                   
        // this.vidElt5.setAttribute("id", this.id);

        // ----------------------- How to scale the iframe?
        // https://stackoverflow.com/questions/11122249/scale-iframe-css-width-100-like-an-image
        // var ytIframe = container.firstElementChild;
        // ytIframe.removeAttribute("width");
        // ytIframe.removeAttribute("height");


        // https://www.ostraining.com/blog/coding/responsive-videos/
        // ytContainer.classList.add("video-responsive");

        // https://benmarshall.me/responsive-iframes/
        // get aspect ratio
        var ytIframe = ytContainer.firstElementChild;
        var h = ytIframe.getAttribute("height");
        var w = ytIframe.getAttribute("width");
        // 16x9 ?
        var w16x9 = h / 9 * 16;
        var is16x9 = w16x9 == w;
        console.log("w16x9", w16x9, is16x9);
        ytContainer.classList.add("intrinsic-container");
        if (is16x9) {
            ytContainer.classList.add("intrinsic-container-16x9");
        } else {
            var w4x3 = h / 3 * 4;
            var is4x3 = w4x3 == w;
            if (is4x3) {
                ytContainer.classList.add("intrinsic-container-4x3");
            } else {
                debugger;
            }
        }

        console.log("adding onStateChange");
        this.vidYT.addEventListener("onStateChange", function(ev){
            // console.log("vidYT onstatechange", ev);
            var evData = ev.data;
            var what;
            switch (ev.data) {
            case -1: // -1 (unstarted)
                what = "unstarted";
                me.pausedValue = true;
                break;
            case YT.PlayerState.ENDED: // 0:
                what = "ended";
                me.pausedValue = true;
                break;
            case YT.PlayerState.PLAYING: // 1:
                what = "playing";
                me.mobilePlayProtect = false;
                me.pausedValue = false;
                me.evtHand.play();
                // handle seeked here
                break;
            case YT.PlayerState.PAUSED: // 2:
                what = "paused";
                if (!me.initialized) {
                    me.vidYT.seekTo(0);
                    me.initialized = true;
                }
                me.pausedValue = true;
                me.evtHand.pause();
                break;
            case YT.PlayerState.BUFFERING: // 3:
                what = "buffering";
                break;
            case YT.PlayerState.CUED: // 5:
                what = "cued";
                console.log("cued");
                // var ttURL = getYTtimedtextURL();
                // console.log("ttURL", ttURL);
                break;
            default:
                what = "(unknown)";
                // console.log("onStateChange, unknown ev.data", evData);
            }
            // console.log("onStateChange", evData, what);
        });
        this.vidYT.addEventListener("onReady", function(){
            // debugger;
            // fix-me: set the video here?
            // console.log("yt player ready");
        });
        // this.container.addEventListener("seeked", function(ev){
        //     console.log("yt seeked", ev);
        // });
        // debugger;
        return;

        // this.vidElt5.setAttribute("controls", "true");
        // this.vidElt5.setAttribute("playsinline", "true");

    }
    // setSourceURL(videoURL) { debugger; this.vidElt5.setAttribute("src", videoURL); }
    // addTrack(arg) {
    //     debugger;
    //     var trackElt = document.createElement("track");
    //     this.vidElt5.appendChild(trackElt);
    //     trackElt.setAttribute("src", arg.srcURL);
    //     trackElt.setAttribute("srclang", arg.srclang);
    //     trackElt.setAttribute("label", arg.label);
    //     trackElt.setAttribute("kind", arg.kind);
    // }

    setSourceId(ytId) {
        var me = this;
        this.promiseReady.then(function() {
            me.vidYT.cueVideoById({videoId:ytId, startSeconds:0});
            // fix-me: this will dispatch a cued event. How to handle this?

            //////////////////////////////////////
            // fix-me: seeking hangs if no play, does this fix it?

            // This seems to work
            me.vidYT.playVideo();
            // me.vidYT.pauseVideo();
            // me.vidYT.seekTo(0);
            // return;
            var tries = 0;
            var timer = setInterval(()=>{
                let dur = me.vidYT.getDuration();
                // console.log("dur", dur);
                if (++tries > 15) {
                    // alert("tries:"+tries);
                    clearInterval(timer);
                    return;
                }
                if (!dur || dur < 1) return;
                let tim = me.vidYT.getCurrentTime();
                if (!tim || tim < 0.01) {
                    // alert("tim:"+tim+", tries:"+tries+", dur:"+dur+", play protect:"+me.mobilePlayProtect);
                    clearInterval(timer);
                    me.vidYT.pauseVideo();
                    return;
                }
                console.log("init tries:"+tries+", dur:"+dur+", getCurrentTime:"+tim);
                // alert(      "init tries:"+tries+", dur:"+dur+", getCurrentTime:"+tim+", play protect:"+me.mobilePlayProtect);
                // getDuration did not fix it on my mobile. Try getCurrentTime too:
                clearInterval(timer);
                me.vidYT.pauseVideo();
            }, 300);

            // This doesn't work
            // me.vidYT.pauseVideo();
            // me.vidYT.currentTime = 0;
        });
    }
    setSourceURL(ytURLorId) {
        var ytId = getYouTubeIdFromURL(ytURLorId);
        if (!ytId) {
            alert("Can't get YouTube ID from that URL");
        } else {
            setSourceId(ytId);
        }
    }
    pause() { this.vidYT.pauseVideo(); }
    play() {
        if (this.mobilePlayProtectOn()) return;
        this.vidYT.playVideo();
    }
    get paused() { return this.pausedValue; }
    get currentTime() { return this.vidYT.getCurrentTime(); }
    set currentTime(seconds) {
        console.log("vidYt, set currentTime", seconds);
        this.vidYT.seekTo(seconds, true);
        // videoSeekedEvent(); // fix-me: there is no seeked event. Call here or raise one?
        setTimeout(videoSeekedEvent, 10); // fix-me: there is no seeked event. Call here or raise one?
        // this.vidYT.dispatchEvent(new Event("seeked"));
    }
}


var promiseYouTubeLoaded = new Promise(function(a){
    window.addEventListener("youtubeapiloaded", ()=>{a();});
});

function addYouTubeAPI() {
    var tag = document.createElement('script');
    tag.id = 'youtube-api-loader';
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// This must be global since it is called from the YouTube API framework when that is loaded.
function onYouTubeIframeAPIReady() {
    // console.log("onYouTubeIframeAPIReady");
    window.dispatchEvent(new Event("youtubeapiloaded"));
    return;
    player = new YT.Player('existing-iframe-example', {
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// ----------- tests
function testYT() {
    console.log("testYT");
    // window.addEventListener("load", function() {
    thePromiseDOMready.then(function() {
        addYouTubeAPI();
        promiseYouTubeLoaded.then(function(){
            theVideoPlayer = new VideoPlayerYouTube("temp-yt-player", theVideoContainer);
            // theVideoPlayer.setSourceId("6EVgVqtQsD"); // bad
            theVideoPlayer.setSourceId("6EVgVqtQsDM"); // ok
        });
    });
}
/////////////////////////////////////////////////////////////////////////

thePromiseDOMready.then(function() {
    // window.addEventListener("resize", resizeThrottler, false);

    // Initial resize
    // resizeThrottler();
});
window.addEventListener("load", ()=>resizeThrottler());
var resizeTimeout;
function resizeThrottler() {
    // ignore resize events as long as an actualResizeHandler execution is in the queue (MDN)
    // Just reque instead. We do not need to follow resizing here.
    if ( resizeTimeout ) clearTimeout(resizeTimeout);
    if (theTranscriptDiv) theTranscriptDiv.style.display = "none";
    theEditor.style.height = null;
    resizeTimeout = setTimeout(function() {
        resizeTimeout = null;
        actualResizeHandler();
        if (theTranscriptDiv) theTranscriptDiv.style.display = "block";
        // The actualResizeHandler will execute at a rate of 15fps
    }, 200);
}
function actualResizeHandler() {
    // console.log("resize handler here!!!!!!!!!!!!!!", "theEditor");
    var bcr = theEditor.parentElement.getBoundingClientRect();
    console.log("resize bcr", bcr);
    var outerEditorH = bcr.height;
    var bcr2 = theEditControls.getBoundingClientRect();
    var editControlsH = bcr2.height;
    var upperMargin = 10; // from .css
    var remainingH = outerEditorH - editControlsH - upperMargin;
    theEditor.style.height = remainingH + "px";
}
/////////////////////////////////////////////////////////////////////////


function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    // console.log("regex", regex);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function theFirstTest() {
    /* stackoverflow.com/questions/36849329/how-can-i-set-video-source-in-html */
    theVideoPlayer = new VideoPlayerHTML5("video-html5", theVideoContainer);
    theVideoPlayer.setSourceURL(theVideoURL); // fix-me: html5 only?

    theVideoPlayer.addTrack( 
        {
            srcURL: theTrackURL,
            srclang: "en",
            label: "caped-test EN",
            kind: "subtitles"
        });
    
    if (window.location.href.substr(0,4) == "http") {
        console.log("load caption file from network");
        var fullPath = location.href.replace(new RegExp("[^/]*$"), "");
        // var url = "http://"+window.location.host+"/"+theTrackURL;
        var url = fullPath+theTrackURL;
        startLoadingCaptionFileFromNet(url);
    }
}



////////////////////////////////////////////////////////////////////////////

var theYTIdParam = getParameterByName("ytId");
var theTitleParam = getParameterByName("ytTitle");
var theYTTimedTextURLParam = getParameterByName("ytTimedText");
var theLoadFromParam = getParameterByName("loadFrom");
var theKeyParam = getParameterByName("key");
console.log("par", theYTIdParam, theTitleParam, theYTTimedTextURLParam);
// if (theLoadSavedKey) {

if (theKeyParam) {
    if (theYTIdParam || theTitleParam || theYTTimedTextURLParam) throw "bad parameters to page";
    if (!theLoadFromParam) throw "bad parameters 3 to page";
} else {
    if (!(theYTIdParam && theTitleParam && theYTTimedTextURLParam)) throw "bad parameter 2 to page";
}
if (theLoadFromParam) {
    switch (theLoadFromParam) {
    case "local":
        // theCapLoadType = CapLoadTypes.local;
        break;
    case "user":
        // theCapLoadType = CapLoadTypes.user;
        break;
    case "shared":
        // theCapLoadType = CapLoadTypes.shared;
        break;
    default:
        throw "bad parameter 4 to page";
    }
}

theCurrentKey = theKeyParam || YTid2key(theYTIdParam);
var theCurrentTitle = theTitleParam;

thePromiseDOMready.then(function() {
    addYouTubeAPI();
    
    // let keyFoundLocal = getVideoTimeMs(theCurrentKey);
    let keyFoundLocal = existLocally(theCurrentKey);
    let keyFoundUser;
    let keyFoundShared;
    async function checkKeyCloudAlternatives() {
        try {
            await promiseFirstAuthStateChangedDone;
            if (!firebase.auth().currentUser) return;

            // let baseDocUser = await getBaseDoc("user");
            // let keysCollUser = baseDocUser.collection("caption-keys");
            // let docUser = await keysCollUser.doc(theCurrentKey).get();
            // keyFoundUser = docUser.exists;
            keyFoundUser = await keyExistsInCloud(theCurrentKey, "user");

            // let baseDocShared = await getBaseDoc("shared");
            // let keysCollShared = baseDocShared.collection("caption-keys");
            // let docShared = await keysCollShared.doc(theCurrentKey).get();
            // keyFoundShared = docShared.exists;
            keyFoundUser = await keyExistsInCloud(theCurrentKey, "shared");
        } catch (err) { throw err; }
    }

    if (false && isFlaggedEditing(theCurrentKey)) {
        let cont =
            confirm("I can be wrong, but it looks like you are editing this video's caption in another window."
                    +" Editing in several windows can currently cause lost changes."
                    +"\n\nContinue anyway?");
        if (!cont) {
            location.href = "videos.html";
        } else {
            countDownFlagEditing(theCurrentKey);
        }
    }

    // let wantFromYouTube = false;
    // if (theYTIdParam) { wantFromYouTube = !existLocally(YTid2key(theYTIdParam)); }
    // if (theYTIdParam) { wantFromYouTube = !existLocally(theCurrentKey); }
    // if (wantFromYouTube && !theYTTimedTextURLParam) return; // fix-me

    function loadCaptionsFromYouTube() {
        // theCapLoadType = CapLoadTypes.local;
        // setCapLoadType(CapLoadTypes.local);
        setCapLoadType("local");
        var checkYTid = getYouTubeIdFromURL(theYTTimedTextURLParam);
        if (checkYTid != theYTIdParam) {
            alert("Something is wrong, the <timedtext> is not for this YouTube video. 😕");
            return;
        }
        let promiseCaptions = getPromiseURLrequest("GET", theYTTimedTextURLParam,
                                                   "when trying to fetch YouTube timed text");
        promiseCaptions.then(function(contents){
            loadCaptionContents(contents, guessCapFormatFromContents(contents));
            countUpFlagEditing(theCurrentKey);
            setUpToSaveLocally();
        }).catch(function(err){
            console.log("err when getting yt timed text: ", err);
            var userMsg = err;
            // fix-me: check the error code to give a correct errror message.
            var popMap = new Map();
            popMap.set("OK", ()=>{location.href="videos.html";});
            var pop = new Popup(
                "Could not get the auto-generated caption. 😕",
                mkElt("div", null,
                      [mkElt("p", null,
                             "This is probably due to that the link to the captions must be refreshed."),
                       mkElt("p", null, "Please go back to YouTube."
                             +" Reload the YouTube page."
                             +" Then click the EasyCapEd bookmark again."),
                       mkElt("div", {style:"color:red"}, ""+userMsg)
                      ]),
                      popMap);
            pop.show();
        });
    }

    let thingsToPromise = [];
    thingsToPromise.push(promiseYouTubeLoaded);
    if (!theCapLoadType) thingsToPromise.push(checkKeyCloudAlternatives());

    Promise.all(thingsToPromise).then(function(){
        theVideoPlayer = new VideoPlayerYouTube("temp-yt-player", theVideoContainer);
        theVideoPlayer.setSourceId(key2YTid(theCurrentKey));
        
        resizeThrottler();

        async function loadEditor(userOrShared, key) {
            try {
                theEditorBaseDoc = await getBaseDoc(userOrShared);
                if (!firebase.auth().currentUser) {
                    if (iTried++ > 0) return;
                    console.log("before popup 0", iTried);
                    new Popup("Please sign in!", "The captions will load after you have signed in.").show();
                    let unsubscribeFun = firebase.auth().onAuthStateChanged(async function(user) {
                        console.log("after popup, in auth state change. with setTimeout 1", user);
                        if (!user) return;
                        await loadEditor(userOrShared, key);
                        // Promise.resolve().then(()=>unsubscribeFun()); // fix-me: loops, why?
                        setTimeout(()=>unsubscribeFun(),1);
                    });
                    return;
                }
                let unsubscribeFun = firebase.auth().onAuthStateChanged(function(user) {
                    if (user) return;
                    theEditor.removeChild(transDiv);
                    setTimeout(()=>unsubscribeFun(),1);
                });
                let handleFun = function(doc){
                    let elt = document.getElementById(doc.id);
                    let html = doc.data().html;
                    let editing = elt.getAttribute("contenteditable");
                    if (editing) {
                        let tempP = document.createElement("p");
                        let tempSpan = document.createElement("span");
                        tempP.appendChild(tempSpan);
                        tempSpan.outerHTML = html;
                        setTimeout(()=>{
                            elt.innerHTML = tempSpan.innerHTML;
                        }, 100);
                        return;
                    }
                    // let spoken = elt.classList.contains("spoken");
                    console.log("html", doc.id, elt, html);
                    elt.outerHTML = html;
                    // setTimeout(()=>{if (spoken) elt.classList.add("spoken");}, 100);
                };
                // You can get "not logged in here"
                addListener(userOrShared, key, handleFun);
                addListenerAndHandleFun(userOrShared, key);
            } catch (err) { throw err; }
        }

        function addListenerAndHandleFun(userOrShared, key) {
        }


        if (theYTIdParam) {
            if (theCapLoadType) throw "cap load type set";
            var popMap = new Map();

            // popMap.set("YouTube", ()=>loadCaptionsFromYouTube());
            // if (keyFoundLocal) popMap.set("Local", ()=>loadCaptionsFromLocal(theCurrentKey));
            // if (keyFoundUser) popMap.set("User", ()=>loadEditor("user", theCurrentKey));
            // if (keyFoundShared) popMap.set("Shared", ()=>loadEditor("shared", theCurrentKey));
            popMap.set("Cancel", ()=>{ location.href = "videos.html"; });

            var msgBody = document.createElement("div");
            msgBody.appendChild(mkElt("p", null,
                                      ""
                                      // "You gave us a video from YouTube."
                                      // +" We took the id and searched for alternatives."
                                      +" The alternatives below with buttons can currently be used for"
                                      +" editing captions for this video."));
            // if (keyFoundLocal) {
            //     msgBody.appendChild(
            //         mkElt("p", {style:"background:yellow"},
            //               "NOTE: To download captions from YouTube again please delete"
            //               +" your local copy on your device first!"));
            // }
            if (!firebase.auth().currentUser) {
                msgBody.appendChild(
                    mkElt("p", {style:"color:red"},
                          "NOTE: You can't see the alternatives in EasyCapEd cloud if you are not signed in."
                          +" If you want to see those alternative then please sign in"
                          +" and then reload this page. (See upper right corner for Sign In.)"
                         ));
            }
            function mkButton(key, fun) {
                let btnElt = document.createElement("div");
                btnElt.classList.add("popup-button");
                btnElt.classList.add("popup-close");
                // btnDiv.appendChild(btnElt);
                btnElt.innerHTML = key;
                if (fun) btnElt.addEventListener("click", fun);
                btnElt.addEventListener("click", (ev)=>{ showClick(ev.target); });
                return btnElt;
            }
            let ddListYouTube = 
                [mkElt("div", null, "Download captions from YouTube to your local device and edit.")];
            // popMap.set("YouTube", ()=>loadCaptionsFromYouTube());
            if (!keyFoundLocal) {
                ddListYouTube.push(mkButton("Fetch and edit", ()=>loadCaptionsFromYouTube()));
            } else {
                ddListYouTube.push(
                    mkElt("p", {style:"background:yellow"},
                          "NOTE: To download captions from YouTube again please delete"
                          +" your local copy on your device first!"));
            }

            let ddListLocal = 
                [mkElt("div", null, "The local copy on your device")];
            // if (keyFoundLocal) popMap.set("Local", ()=>loadCaptionsFromLocal(theCurrentKey));
            if (keyFoundLocal) {
                let btn = mkButton("Edit", ()=>loadCaptionsFromLocal(theCurrentKey));
                ddListLocal.push(btn);
            }

            let ddListUser = [mkElt("div", null, "Your own copy in the cloud.")];
            // if (keyFoundUser) popMap.set("User", ()=>loadEditor("user", theCurrentKey));
            if (keyFoundUser) {
                let btn = mkButton("Edit", ()=>loadEditor("user", theCurrentKey));
                ddListUser.push(btn);
            }

            let ddListShared = [mkElt("div", null, "The shared copy in the cloud."
                                      +" You edit together with others and can see their"
                                      +" contributions in real time.")];
            if (keyFoundShared) {
                let btn = mkButton("Edit", ()=>loadEditor("shared", theCurrentKey));
                ddListShared.push(btn);
            }

            msgBody.appendChild(
                mkElt("dl", null,
                      [
                          mkElt("dt", null, [
                              mkElt("img",
                                    {src:"https://www.youtube.com/yts/img/favicon_96-vflW9Ec0w.png",
                                     style:"vertical-align: text-bottom",
                                     height:"25"}),
                              mkElt("b", null, " YouTube")]), 
                          mkElt("dd", null, ddListYouTube),
                          
                          mkElt("dt", null,
                                // "Local"
                                mkElt("span", {class:"local load-type-button"}, "Device")
                               ),
                          mkElt("dd", null, ddListLocal),

                          mkElt("dt", null,
                                // "User"
                                mkElt("span", {class:"user load-type-button"}, "User")
                               ),
                          mkElt("dd", null, ddListUser),

                          mkElt("dt", null,
                                // "Shared"
                                mkElt("span", {class:"shared load-type-button"}, "Shared")
                               ),
                          mkElt("dd", null, ddListShared)
                      ]));

            msgBody.appendChild(mkElt("p", {style:"color:red"},
                                      "NOTE: To upload captions to the cloud,"
                                      +" you must currently first save them to your device."));

            var pop = new Popup("From where do you want to load captions to edit?",
                                msgBody, popMap, false);
            setTimeout(function() {pop.show();}, 3000);

            return;
        } else {
            promiseFirstAuthStateChangedDone.then(function() {
                if (!firebase.auth().currentUser) {
                    firebase.auth().onAuthStateChanged(function(user) {
                        if (firebase.auth().currentUser) location.reload();
                    });
                    askSignIn(true);
                }
            });

            let iTried = 0;
            async function loadEditorOrWaitForAuth(userOrShared, key) {
                try {
                    if (theFirstAuthStateChangedDone) {
                        console.log("first already done");
                        await loadEditor(userOrShared, key);
                        return;
                    }
                    let unsubscribeFun = firebase.auth().onAuthStateChanged(function(user) {
                        if (!user) return;
                        console.log("first not done, state change");
                        loadEditor(userOrShared, key);
                        Promise.resolve().then(()=>unsubscribeFun());
                    });
                } catch(err) {
                    console.log("load err", err);
                }
            }
            switch (theLoadFromParam) {
            case "local":
                // theCapLoadType = CapLoadTypes.local;
                // setCapLoadType(CapLoadTypes.local);
                setCapLoadType("local");
                // let key = theLoadSavedKey || YTid2key(theYTIdParam);
                // let key = theKeyParam || YTid2key(theYTIdParam);
                setTimeout(()=>{
                    // loadCaptionsFromLocal(key);
                    loadCaptionsFromLocal(theCurrentKey);
                    countUpFlagEditing(theCurrentKey);
                    // resizeThrottler();
                    setUpToSaveLocally();
                }, 2000);
                break;
            case "user":
                // theCapLoadType = CapLoadTypes.user;
                // setCapLoadType(CapLoadTypes.user);
                setCapLoadType("user");
                loadEditorOrWaitForAuth("user", theCurrentKey);
                break;
            case "shared":
                // theCapLoadType = CapLoadTypes.shared;
                // setCapLoadType(CapLoadTypes.shared);
                setCapLoadType("shared");
                loadEditorOrWaitForAuth("shared", theCurrentKey);
                break;
            default:
                throw "bad parameter 4 to page";
            }
        }
        // showCapLoadType();
    });
    // theFirstTest();
});

// fix-me: The regexp upsets the Emacs parser so put it here at the end
function getYouTubeIdFromURL(ytURL) {
    var re = new RegExp("(?:[=/]|^)"+"((?:[A-Z0-9_-]){11})(?:[?&#\n]|$)", "ig");
    var m2 = re.exec(ytURL);
    // console.log("m2", m2);
    if (m2) return m2[1];
}

// https://m.youtube.com/api/timedtext?expire=1508395801&signature=BB4E634338EFE93EAFB7D280581DF3694F36E79C.607EB7D4CA8418C320D4651624507420AB233FF7&sparams=asr_langs%2Ccaps%2Cv%2Cexpire&v=UTlmzCIyl80&asr_langs=fr%2Cpt%2Cit%2Ces%2Cru%2Cnl%2Cja%2Cen%2Cko%2Cde&key=yttt1&hl=en-US&caps=asr&type=track&lang=en&name&kind=asr&fmt=vtt
// https://www.youtube.com/api/timedtext?hl=en_US&key=yttt1&signature=DD0C4B6A3971C3915D879F54E6CCC685383963EF.BFC41D7D271A492CB5B3FCE715F0DFC985C8DA5B&sparams=asr_langs%2Ccaps%2Cv%2Cexpire&caps=asr&asr_langs=ko%2Cru%2Cja%2Cen%2Cde%2Cit%2Ces%2Cnl%2Cpt%2Cfr&expire=1508395470&v=UTlmzCIyl80&kind=asr&lang=en&fmt=srv3
