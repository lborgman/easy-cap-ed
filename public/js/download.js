"use strict";

/* @license Copyright 2017 Lennart Borgman (lennart.borgman@gmail.com) All rights reserved. */

// https://www.speechpad.com/captions/ttml, see karaoke
// https://stackoverflow.com/questions/4184944/javascript-download-data-to-file-from-content-within-the-page

var theTA;
function downloadAsWebVTT(transcriptDiv) {
    let textArea = document.createElement("textarea");
    theTA = textArea;
    textArea.setAttribute("id", "download-textarea");
    textArea.setAttribute("readonly", "");
    // textArea.value = "";

    function writeOutput(txt) {
        // console.log("=====", txt);
        textArea.value += txt+"\n";
    }
    function outputNextP() {
        let thisP = transcriptDiv.children[nextPnum];
        // console.log("thisP", thisP);
        if (!thisP) {
            // console.log("textArea", textArea.value);
            let popMap = new Map();
            // popMap.set("Copy", ()=>console.log("clicked Copy"));
            popMap.set("Download", ()=>alert("Not implemented yet, use select+copy"));
            popMap.set("Cancel");
            let pop = new Popup("Download/Copy Transcript", textArea, popMap, true, "download-popup");
            console.log("pop", pop);
            setTimeout(function() {pop.show();}, 500);
            return;
        }
        splitPifNeeded(thisP).then(function(){
            // fix-me: do the output here
            // console.log(nextPnum, thisP);
            if (thisP.childElementCount > 0) {
                let start = parseInt(thisP.getAttribute("t"));
                let d = thisP.getAttribute("d");
                if (!d) {
                    // fix-me: no idea what to do here. There is nothing in the .vtt file!
                } else {
                    let end   = parseInt(d)+start;
                    // console.log(start, end);
                    writeOutput("\n"+millisec2hhMM(start)+" --> "+millisec2hhMM(end));
                    
                    let line = "";
                    for (let i=0, len=thisP.children.length; i<len; i++) {
                        let elt = thisP.children[i];
                        if (elt.tagName != "SPAN") throw "Not SPAN";
                        let startW = parseInt(elt.getAttribute("t"));
                        if (startW>0) {
                            startW += start;
                            line += " <"+millisec2hhMM(startW)+"> "
                        }
                        line += elt.innerText;
                    }
                    writeOutput(line);
                }
            }

            nextPnum++;
            outputNextP();
        });
    }
    // Check that all are p
    for (let i=0, len=transcriptDiv.children.length; i<len; i++) {
        let elt = transcriptDiv.children[i];
        if (elt.tagName != "P") throw "Not P";
    }

    writeOutput("WEBVTT test");
    // fix-me:
    writeOutput("Kind: captions");
    writeOutput("::cue:past { color:black }");
    writeOutput("::cue:future { color:grey }");
    writeOutput("##");
    let nextPnum = 0;
    outputNextP();
}
