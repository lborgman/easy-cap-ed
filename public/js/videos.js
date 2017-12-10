"use strict";

/* @license Copyright 2017 Lennart Borgman (lennart.borgman@gmail.com) All rights reserved. */

thePromiseDOMready.then(function(){
    updateCurrentVideoElt();
    // updateUserVideosElt();
    updateVideosElt("user");
    updateVideosElt("shared");
    firebase.auth().onAuthStateChanged(function(user) {
        // updateUserVideosElt();
        updateVideosElt("user");
        // updateSharedVideosElt();
        updateVideosElt("shared");
    });
});


// async function updateSharedVideosElt() {
//     try {
//         await updateVideosElt("shared");
//     } catch (err) { throw err; }
// }
// async function updateUserVideosElt() {
//     try {
//         await updateVideosElt("user");
//     } catch (err) { throw err; }
// }
async function updateVideosElt(userOrShared) {
    try {
        if (!firebase.auth().currentUser) return;
        // let currElt = document.getElementById("user-videos");
        let snapShot = await getVidsInCloud(userOrShared);
        let numCaptions = 0;

        let currElt = document.getElementById(userOrShared+"-captions").lastElementChild;

        let ul = document.createElement("ul");
        snapShot.forEach(function(doc){
            numCaptions++;
            console.log("doc", doc.id, doc.data());
            let key = doc.id;
            let data = doc.data();
            let title = data.title;
            let timeMs = data.time;
            let sharedBy; 
            if (userOrShared == "shared") sharedBy = data.createdBy;
            let divLi = makeLiCaption(ul, key, title, timeMs, sharedBy);

            let divBtns = document.createElement("div");
            divLi.appendChild(divBtns);
            divBtns.classList.add("caption-buttons");

            let btnEdit = document.createElement("div");
            divBtns.appendChild(btnEdit);
            btnEdit.innerText = "Edit";
            btnEdit.classList.add("popup-button");
            btnEdit.addEventListener("click", function(ev){
                showClick(ev.target);
                let url = "caped-editor.html?loadFrom="+userOrShared+"&key="+key;
                setTimeout(()=>{location.href = url;}, 500);
            });

            let btnRemove = document.createElement("div");
            divBtns.appendChild(btnRemove);
            btnRemove.innerText = "Remove";
            btnRemove.classList.add("popup-button");
            btnRemove.addEventListener("click", function(ev){
                showClick(ev.target);
                // let url = "caped-editor.html?loadFrom=user&key="+key;
                // setTimeout(()=>{location.href = url;}, 500);
                setTimeout(function(){
                    removeCaptions(userOrShared, key).then(function() {
                        updateVideosElt(userOrShared);
                    });
                }, 0);
            });

            if (userOrShared == "shared") {
                let btnGetHelp = document.createElement("div");
                divBtns.appendChild(btnGetHelp);
                btnGetHelp.innerText = "Get Help!";
                btnGetHelp.classList.add("popup-button");
                btnGetHelp.addEventListener("click", function(ev){
                    showClick(ev.target);
                    let loc = location.href;
                    loc = loc.replace(new RegExp("[^/]*$"), "");
                    let url = loc+"caped-editor.html?loadFrom=shared&key="+key;
                    var popMap = new Map();
                    popMap.set("Close", null);
                    var pop = new Popup(
                        "Share and ask for help!",
                        mkElt("div", null,
                              [
                                  mkElt("p", null,
                                        "Send this url to someone you think might help"
                                        +" correcting the captions: "),
                                  mkElt("p",
                                        {style:"background:#ccf; user-select:all; padding:1rem"},
                                        url)
                              ]),
                        popMap);
                    setTimeout(function() {pop.show();}, 300);
                });
            }

        });
        currElt.removeChild(currElt.firstElementChild);
        currElt.appendChild(ul);
    } catch (err) { throw err; }
}

function makeLiCaption(ul, key, title, timeMs) {
    let li = document.createElement("li");
    ul.appendChild(li);

    let divLi = document.createElement("div");
    li.appendChild(divLi);

    let p = document.createElement("p");
    divLi.appendChild(p);
    divLi.classList.add("videos-list-item");

    p.appendChild(document.createTextNode("YouTube: "));

    // let key = keyArr[i];
    let a = document.createElement("a");
    p.appendChild(a);
    let ytId = key2YTid(key);
    a.setAttribute("href", "https://youtube.com/watch?v="+ytId);
    a.setAttribute("target", "_blank");
    a.innerText = ytId;

    p.appendChild(document.createElement("br"));
    let titleSpan = document.createElement("span");
    p.appendChild(titleSpan);
    titleSpan.classList.add("video-title");
    titleSpan.innerText = title;

    if (timeMs) { // fix-me
        p.appendChild(document.createElement("br"));
        let timeSpan = document.createElement("span");
        p.appendChild(timeSpan);
        timeSpan.classList.add("video-time");
        var tzOffset = new Date().getTimezoneOffset();
        var date = new Date(+timeMs-tzOffset*60*1000);
        var ds = date.toISOString();
        var ts = ds.substring(0, ds.length-5);
        ts = ts.replace("T", " ");
        // ts += " UTC";
        timeSpan.innerText = "("+ts+")";
    }

    return divLi;
}
function updateCurrentVideoElt() {
    let currElt = document.getElementById("local-captions");
    let keyArr = findLocallySavedVideos();
    console.log("updateCurrentVideoElt, key", keyArr);
    if (!keyArr) {
        currElt.innerHTML = "";
        let p = document.createElement("p");
        currElt.appendChild(p);
        p.appendChild(
            document.createTextNode("You have no locally stored video captions."));
        // currElt.appendChild(document.createTextNode("NO VIDEO???????"));
    } else {
        currElt.innerHTML = "";
        let p = document.createElement("p");
        currElt.appendChild(p);

        let ul = document.createElement("ul");
        currElt.appendChild(ul);

        for (let i=0; i<keyArr.length; i++) {
            let key = keyArr[i];
            let title = getVideoTitle(key) || "(unknown title)";
            let timeMs = getVideoTimeMs(key);

            let divLi = makeLiCaption(ul, key, title, timeMs);

            let divBtns = document.createElement("div");
            divLi.appendChild(divBtns);

            let btnEdit = document.createElement("div");
            divBtns.appendChild(btnEdit);
            btnEdit.innerText = "Edit";
            btnEdit.classList.add("popup-button");
            btnEdit.addEventListener("click", function(ev){
                showClick(ev.target);
                let url = "caped-editor.html?loadFrom=local&key="+key;
                // fix-me: check if already editing in another window
                setTimeout(()=>{location.href = url;}, 500);
            });

            let btnRemove = document.createElement("div");
            divBtns.appendChild(btnRemove);
            btnRemove.innerText = "Remove";
            btnRemove.classList.add("popup-button");
            btnRemove.addEventListener("click", function(ev){
                showClick(ev.target);
                deleteLocallySavedVideo(key);
                setTimeout(updateCurrentVideoElt, 500);
            });

            let btnUpload = document.createElement("div");
            divBtns.appendChild(btnUpload);
            btnUpload.innerText = "Upload privately";
            btnUpload.classList.add("popup-button");
            btnUpload.addEventListener("click", function(ev){
                showClick(ev.target);
                let transHtml = getLocallySavedVideoTranscript(key);
                let tempElt = document.createElement("div");
                tempElt.innerHTML = transHtml;
                let transcriptDiv = tempElt.firstElementChild;
                let endTime = +transcriptDiv.lastElementChild.getAttribute("t");
                console.log("transcriptDiv", transcriptDiv, endTime);
                async function uploadNow() {
                    try {
                        // await setBaseUser();
                        await uploadElts(transcriptDiv, await getBaseDoc("user"), key, title, timeMs);
                        // updateUserVideosElt(); // fix-me: when?
                        updateVideosElt("user");
                        // // // // // // // // deleteLocallySavedVideo(key);
                        // fix-me: flag new origin
                        // fix-me: show progress
                        setTimeout(updateCurrentVideoElt, 500);
                    } catch (err) { throw err; }
                }
                uploadNow();
            });

            let btnShare = document.createElement("div");
            divBtns.appendChild(btnShare);
            btnShare.innerText = "Upload and share";
            btnShare.classList.add("popup-button");
            btnShare.addEventListener("click", function(ev){
                showClick(ev.target);
                let transHtml = getLocallySavedVideoTranscript(key);
                let tempElt = document.createElement("div");
                tempElt.innerHTML = transHtml;
                let transcriptDiv = tempElt.firstElementChild;
                let endTime = +transcriptDiv.lastElementChild.getAttribute("t");
                console.log("transcriptDiv", transcriptDiv, endTime);
                async function uploadNow() {
                    try {
                        // await setBaseUser();
                        await uploadElts(transcriptDiv, await getBaseDoc("shared"), key, title, timeMs);
                        // // // // // // // // deleteLocallySavedVideo(key);
                        // fix-me: flag new origin
                        // fix-me: show progress
                        setTimeout(updateCurrentVideoElt, 500);
                        updateVideosElt("shared");
                    } catch (err) { throw err; }
                }
                uploadNow();
            });

        }
    }
    ///////////////////// Debug:
    let dbgElt = document.createElement("section");
    dbgElt.classList.add("debug");
    currElt.appendChild(dbgElt);

    dbgElt.appendChild(document.createElement("hr"));
    let h3 = document.createElement("h3");
    h3.innerHTML = "localStorage";
    dbgElt.appendChild(h3);
    for (let i=0; i<localStorage.length; i++) {
        let key = localStorage.key(i);
        let data = localStorage.getItem(key);
        // console.log("ls key", i, key, data.length);

        let div = document.createElement("div");
        dbgElt.appendChild(div);

        let bK = document.createElement("b");
        div.appendChild(bK);
        bK.innerText = key;

        let span = document.createElement("span");
        div.appendChild(span);
        span.innerText = ", "+ data.length;

        let btn = document.createElement("div");
        div.appendChild(btn);
        btn.innerText = "delete";
        btn.classList.add("popup-button");
        btn.addEventListener("click", function(ev){
            localStorage.removeItem(key);
            setTimeout(updateCurrentVideoElt, 100);
        });
    }

}
