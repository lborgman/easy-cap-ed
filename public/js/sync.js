"use strict";

/* @license Copyright 2017 Lennart Borgman (lennart.borgman@gmail.com) All rights reserved. */

function eltPath(elt) {
    function fill0(t) { return "00000000".substring(t.length)+t; }
    if (elt === theTranscriptDiv) return null;
    if (!elt) throw "elt is null";
    if (!elt.tagName) return;
    let thisPathPart = elt.tagName + fill0(elt.getAttribute("t"));
    let pathParent = eltPath(elt.parentElement);
    let path = (pathParent? pathParent+"-":"") + thisPathPart;
    // console.log("path", path, "elt", elt);
    return path;
}
function setPathId(elt) {
    let path = eltPath(elt);
    if (!path) return;
    if (path.length == 0) return;
    let oldId = elt.getAttribute("id");
    if (oldId && oldId != path) {
        // console.log("Old id on "+path, elt);
        // debugger;
        // throw "Old id on "+path;
    }
    elt.setAttribute("id", path);
}
function setPathIds() {
    walkTheElementDOM(theTranscriptDiv, setPathId);
}


// https://firebase.google.com/docs/firestore/query-data/listen
// You can listen to a document with the onSnapshot() method. 
//
// Which means that elements should be uploaded as documents!

var theDB;

// var theBaseDoc;
// async function setBaseDoc(userOrShared) {
//     theBaseDoc = await getBaseDoc(userOrShared);
// }
async function getBaseDoc(userOrShared) {
    try {
        let user = firebase.auth().currentUser;
        if (!user) throw "not logged in";
        let userEmail = user.email;
        if (!userEmail) throw "no email address";
        // fix-me: sign out
        theDB = theDB || firebase.firestore();
        switch(userOrShared) {
        case "shared":
            return await theDB.collection("shared").doc("captions");
            break;
        case "user":
            return await theDB.collection("users").doc(userEmail).collection("uploaded").doc("captions");
            break;
        default:
            throw "bad basedoc: "+userOrShared;
        }
    } catch (err) { throw err; }
}
// async function setBaseShared() { await setBaseDoc("shared"); }
// async function setBaseUser() { await setBaseDoc("user"); }
        
async function uploadElt(elt, toBaseDoc, key) {
    try {
        let eltPath = elt.getAttribute("id");
        if (!eltPath) throw "elt id not found";
        let copy = elt.cloneNode(true);
        copy.classList.remove("spoken");
        let eltData  = {html:copy.outerHTML};
        // let eltDoc = await theBaseDoc.collection(key).doc(eltPath).set(eltData);
        let eltDoc = await toBaseDoc.collection(key).doc(eltPath).set(eltData);
        let timeMs = new Date().valueOf().toString();
        let eltCapDoc = await toBaseDoc.collection("caption-keys").doc(key).set({time:timeMs});
    } catch(err) { throw err; }
}

// myBase = await getBaseDoc("user")
// myDoc = await downloadElt(myBase, "YT-UTlmzCIyl80", "/P2520-SPAN3080")
// myDoc.id, myDoc.data()
async function downloadElt(fromBaseDoc, key, path) {
    try {
        let coll = fromBaseDoc.collection(key);
        let docElt = await coll.doc(path).get();
        console.log(docElt.id, docElt.data());
        return docElt;
    } catch(err) { throw err; }
}

async function addListener(userOrShared, key, handleFun) {
    try {
        setCapLoadType(userOrShared);
        
        let fromBaseDoc = await getBaseDoc(userOrShared);
        let coll = await fromBaseDoc.collection(key);
        // https://stackoverflow.com/questions/46669540/firebase-firestore-detach-a-listener-doesnt-work
        // fix-me: use this
        let unsubscribeFun = coll.where("html", ">", "").onSnapshot(function(querySnapshot){
            let sortArr = [], iAdded=0;
            querySnapshot.docChanges.forEach(function(change) {
                let doc = change.doc;
                if (change.type === "added") {
                    sortArr[iAdded++] = doc;
                }
                if (change.type === "modified") {
                    let hasPendingW = doc.metadata.hasPendingWrites;
                    console.log("Modified doc: ", hasPendingW, doc.id, change.doc.data());
                    if (hasPendingW) return; // Fix-me: seems to be from this window. Documentation?
                    if (handleFun) handleFun(doc);
                }
                if (change.type === "removed") {
                    console.log("Removed doc: ", change.doc.data());
                    throw "Removed doc";
                }
            });
            // querySnapshot.forEach((doc)=>sortArr[i++]=doc);
            if (iAdded > 0) { // first snapshot, all elements
                function sort(a,b){if(a.id<b.id) return -1; if (a.id>b.id) return 1; throw "2 equal ids: "+a.id;}
                sortArr.sort(sort);
                insertAll(sortArr).then(function(res){
                    let docFrag = res;
                    let transDiv = docFrag.firstElementChild;
                    insertTranscriptDiv(transDiv);
                    console.log("loadEditor in addListener", "transDiv", transDiv);
                });
            }
        });
        return unsubscribeFun;
    } catch(err) { throw err; }
}

async function insertAll(sortArr) {
    try {
        let docFrag = document.createDocumentFragment();
        let transDiv = document.createElement("div");
        transDiv.setAttribute("id", "the-transcript-div");
        docFrag.appendChild(transDiv);

        let iTimer=0;
        function continueInserting(currP) {
            let nSpans = 0;
            if (!currP) {
                if (iTimer != 0) throw "iTimer != 0 && !currP";
            } else {
                let muSpans = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        // console.log(mutation);
                        if (mutation.target !== currP) throw "target != currP in mutation";
                        mutation.addedNodes.forEach((node)=> { if (node.nodeType == node.ELEMENT_NODE) nSpans--; });
                        if (nSpans == 0) {
                            // joinPifPossible(currP); // fix-me: This might already be in the document. 
                            muSpans.disconnect();
                        }
                    });
                });
                muSpans.observe(currP, {childList:true});
            }
            for (let i=iTimer, len=sortArr.length; i<len; i++) {
                iTimer++;
                let doc = sortArr[i];
                let id = doc.id;
                let path = id.split("-");
                let data = doc.data();
                let html = data.html;
                if (path.length == 1) {
                    let nextCurrP = document.createElement("p");
                    transDiv.appendChild(nextCurrP);
                    // fix-me: This removes the child elements.... and the element...
                    // Add a mutation observer on its parent to fix this.
                    // And continue there...
                    // setTimeout(function() { continueInserting(nextCurrP) }, 0);
                    let muP = new MutationObserver(function(mutations) {
                        muP.disconnect();
                        mutations.forEach(function(mutation) {
                            // console.log("mutation", mutation);
                            let addedNodes = mutation.addedNodes;
                            if (addedNodes.length != 1) throw "addedNodes should be just 1: "+addedNodes.length;
                            let addedNode = addedNodes[0];
                            if (addedNode.nodeName != "P") throw "addedNode is not P";
                            // console.log("addedNode", addedNode);
                            continueInserting(addedNode);
                        });});
                    muP.observe(nextCurrP.parentElement, {
                        childList: true,
                        attribute: true,
                        characterData: true,
                        subtree: true
                        // attributeOldValue: true,
                        // characterDataOldValue: true
                    });
                    nextCurrP.outerHTML = html;
                    // fix-me: after setting outerHTML nexCurrP has no
                    // parentElement. The pointer is useless. We must
                    // look at the parentElement that we had before.
                    // continueInserting(nextCurrP);
                    return;
                    // setTimeout(continueInserting, 0);
                    // return;
                } if (path.length == 2) {
                    nSpans++;
                    let elt = document.createElement("span");
                    currP.appendChild(elt);
                    currP.appendChild(document.createTextNode(" "));
                    elt.outerHTML = html;
                }
            }
        }
        continueInserting();
        // return sortArr;
        return docFrag;
    } catch(err) { throw err; }
}

// myBase = await getBaseDoc("user")
// myRes = await downloadElts(myBase, "YT-UTlmzCIyl80")
async function downloadElts(fromBaseDoc, key) {
    try {
        throw "downloadElts, should not happen right now";
        let docFrag = document.createDocumentFragment();
        let transDiv = document.createElement("div");
        transDiv.setAttribute("id", "the-transcript-div");
        docFrag.appendChild(transDiv);

        let coll = fromBaseDoc.collection(key);
        let querySnapshot = await coll.get();
        console.log("querySnapshot", querySnapshot);

        let sortArr = [], i=0;
        querySnapshot.forEach((doc)=>sortArr[i++]=doc);
        function sort(a,b){if(a.id<b.id) return -1; if (a.id>b.id) return 1; throw "2 equal ids: "+a.id;}
        sortArr.sort(sort);
        // https://stackoverflow.com/questions/779379/why-is-settimeoutfn-0-sometimes-useful
        // https://stackoverflow.com/questions/11513392/how-to-detect-when-innerhtml-is-complete (wrong!!!)
        let iTimer=0;
        let currP;
        function continueInserting() {
            if (currP) joinPifPossible(currP); // fix-me: This might already be in the document. 
            currP = transDiv.lastElementChild;
            // console.log("continueInserting", iTimer, currP);
            for (let i=iTimer, len=sortArr.length; i<len; i++) {
                iTimer++;
                let doc = sortArr[i];
                let id = doc.id;
                let path = id.split("-");
                let data = doc.data();
                let html = data.html;
                if (path.length == 1) {
                    let elt = document.createElement("p");
                    // currP = elt;
                    transDiv.appendChild(elt);
                    elt.outerHTML = html;
                    setTimeout(continueInserting, 0);
                    return;
                } if (path.length == 2) {
                    let elt = document.createElement("span");
                    currP.appendChild(elt);
                    currP.appendChild(document.createTextNode(" "));
                    elt.outerHTML = html;
                }
            }
        }
        continueInserting();
        // return sortArr;
        return docFrag;
    } catch(err) { throw err; }
}

// https://firebase.google.com/docs/firestore/manage-data/delete-data
// https://stackoverflow.com/questions/46692845/why-single-bulk-delete-collection-in-firestore-is-not-possible-like-it-is-whit
function deleteCollection(db, collectionRef, batchSize) {
    var query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise(function(resolve, reject) {
        deleteQueryBatch(db, query, batchSize, resolve, reject);
    });
}
function deleteQueryBatch(db, query, batchSize, resolve, reject) {
    query.get()
        .then((snapshot) => {
            // When there are no documents left, we are done
            if (snapshot.size == 0) {
                return 0;
            }

            // Delete documents in a batch
            var batch = db.batch();
            snapshot.docs.forEach(function(doc) {
                batch.delete(doc.ref);
            });

            return batch.commit().then(function() {
                return snapshot.size;
            });
        }).then(function(numDeleted) {
            if (numDeleted <= batchSize) {
                resolve();
                return;
            }

            // Recurse on the next process tick, to avoid
            // exploding the stack.
            //
            // Fix-me: is this correct? Or is he guessing?
            // https://www.quora.com/Does-JavaScript-in-the-browser-have-the-equivalent-of-process-nextTick-or-setImmediate-in-node-js-or-do-we-just-have-setTimeout
            // process.nextTick(function() {
            Promise.resolve().then(function() {
                deleteQueryBatch(db, query, batchSize, resolve, reject);
            });
        })
        .catch(reject);
}
async function removeCaptions(userOrShared, key) {
    try {
        // https://firebase.google.com/docs/firestore/manage-data/delete-data
        let baseDoc = await getBaseDoc(userOrShared);
        let doc = await baseDoc.collection("caption-keys").doc(key).get();
        console.log("remove doc", doc.id, doc.data());
        let collectionRef = baseDoc.collection(key);
        await deleteCollection(theDB, collectionRef, 100);
        // fix-me: listen on doc(key) and stop the editor when this signals deleted!
        await baseDoc.collection("caption-keys").doc(key).delete();
    } catch(err) { throw err; }
}
async function uploadElts(transcriptDiv, toBaseDoc, key, title, timeMs) {
    try {
        async function uploadEltFromCopy(elt) {
            try {
                // from the copy
                if (elt == transCopy) return;
                if (elt.tagName == "P") { 
                    let eltCopy = elt.cloneNode(false);
                    await uploadElt(eltCopy, toBaseDoc, key);
                } else {
                    if (elt.tagName != "SPAN") {
                        console.log("not span", elt.tagName, elt);
                        throw "not span";
                    }
                    await uploadElt(elt, toBaseDoc, key);
                }
            } catch(err) { throw err; }
        }
        // Clone so we can split p nodes
        let transCopy = transcriptDiv.cloneNode(true);
        let endTime = +transCopy.lastElementChild.getAttribute("t");
        let pL = transCopy.querySelectorAll("p");
        pL.forEach((pNode)=>splitPifNeeded(pNode));

        // There is no getCollections yet so we must save the transcript collection name in a document.
        // However this might not be to bad since we must store title somewhere...
        // await theBaseDoc.collection("caption-keys").doc(key)
        await toBaseDoc.collection("caption-keys").doc(key)
            .set({
                title     : title,
                createdby : firebase.auth().currentUser.email,
                time      : timeMs
            }); // fix-me

        walkTheElementDOM(transCopy, uploadEltFromCopy);
    } catch(err) { throw err; }
}



////////////////////////////////////////// tests
// var theCapCloudRoot;
// async function getCapCloudRoot() {
//     let db = firebase.firestore();
//     let sharedVids = db.collection("videos-shared")
//     let firstId;
//     function getFirst(data) {
//         firstId = firstId || data.id;
//         console.log("firstId", firstId, data.id);
//     }
//     let list = await FSgetVids();
//     list.forEach((vid)=>{
//         theCapCloudRoot = theCapCloudRoot || vid.id;
//     });
//     return "hej";
// }


// var theTest;
// async function FSupload(id, vidId, transHtml) {
//     let cu = firebase.auth().currentUser;
//     let user = {
//         email: cu.email,
//         name: cu.displayName
//     }
//     let video = {
//         id: vidId,
//         transHtml: transHtml
//     }
//     let rec = {
//         id: id,
//         user: user,
//         video: video
//     }
//     let db = firebase.firestore();
//     let sharedVids = db.collection("videos-shared")
//     console.log("sharedVids", sharedVids);
//     const theTest = await sharedVids.add(rec);
//     console.log("theTest", theTest);
//     return theTest.id;
//     // fix-me: returns a promise which resolves with the id of the written rec
// }
async function getVidsInCloud(userOrShared, key, uploader) {
    try {
        if (key && uploader) throw "both key and uploader";
        // There is currently no getCollections method in Web (but in jsNode).
        // allColl collection is a workaround for this.
        let baseDoc = await getBaseDoc(userOrShared);
        let keysColl = baseDoc.collection("caption-keys");
        let querySnapshot;
        if (!key && !uploader) {
            querySnapshot = await keysColl.get();
        } else if (key) {
            querySnapshot = await keysColl.doc(key).get();
        } else {
            querySnapshot = await keysColl.where("createdby", "==", uploader).doc(key).get();
        }
        querySnapshot.forEach(function(doc) {
            console.log("getVidsInCloud: ", doc.id, " => ", doc.data());
        });
        return querySnapshot;
    } catch (err) { throw err; }
}

function walkTheElementDOM(node, func) {
    func(node);
    node = node.firstElementChild;
    while (node) {
        walkTheElementDOM(node, func);
        // node = node.nextSibling; // fix-me: nextElementSibling?
        node = node.nextElementSibling; // fix-me: nextElementSibling?
    }
}

async function keyExistsInCloud(key, userOrShared) {
    await promiseFirstAuthStateChangedDone;
    if (!firebase.auth().currentUser) return false; // we don't know
    
    let baseDoc = await getBaseDoc(userOrShared);
    let keysColl = baseDoc.collection("caption-keys");
    let doc = await keysColl.doc(key).get();
    return doc.exists;
}

//// Shared I am editing. fix-me
async function addToSharedIamEditing(key, title, sharedBy) {
    try {
        let coll = await theDB.collection("users").doc(userEmail).collection("my-edit-shared");
        let data = {title:title};
        await coll.doc(key).set(data);
    } catch (err) { throw err; }
}
async function removeFromSharedIamEditing(key) {
    try {
        let coll = await theDB.collection("users").doc(userEmail).collection("my-edit-shared");
        await coll.doc(key).delete();
    } catch (err) { throw err; }
}
async function findInSharedIamEditing() {
    try {
        let coll = await theDB.collection("users").doc(userEmail).collection("my-edit-shared");
        let docs = await coll.doc(key);
    } catch (err) { throw err; }
}
