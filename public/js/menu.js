"use strict";

/* @license Copyright 2017 Lennart Borgman (lennart.borgman@gmail.com) All rights reserved. */

function MakeEnum() {
    function Enum () {
        // if (!(this instanceof Enum)) return new Enum(...arguments)
        Array.from(arguments).forEach(arg => {
            this[arg] = Symbol(arg)
        })
    }
    return Object.freeze(new Enum(...arguments));
}

function mkElt(type, attrib, inner) {
    var elt = document.createElement(type);
    function addInner(inr) {
        if (typeof inr == "string") {
            var txt = document.createTextNode(inr);
            elt.appendChild(txt);
        } else {
            elt.appendChild(inr);
        }
    }
    if (inner) {
        if (inner.length && typeof inner != "string") {
            for (var i=0; i<inner.length; i++)
                if (inner[i])
                    addInner(inner[i]);
        } else
            addInner(inner);
    }
    for (var x in attrib) {
        elt.setAttribute(x, attrib[x]);
    }
    return elt;
}

var theMenu;
function buildMenu() {
    // theMenu = document.getElementById("main-menu");
    var marker = "☰"; // theMenu.innerHTML;
    theMenu.innerHTML = "";
    theMenu.classList.add("tab");

    var inpElt = mkElt("input", {"type":"radio",
                                 "id": "tab-1",
                                 "name": "tab-group-1"});
    theMenu.appendChild(inpElt);
   
    var closedMarker = "List 1 <i>▼</i>";
    closedMarker = marker;
    var labElt = mkElt("label", {"for":"tab-1"}, closedMarker);
    theMenu.appendChild(labElt);


    var openedMarker = "List 1 <i>▲</i";
    openedMarker = marker;
    var divElt = mkElt("div", {"class":"tab close-tab"},
                       [
                           mkElt("input", {"type":"radio",
                                           "id":"tab-close",
                                           "name":"tab-group-1"}),
                           mkElt("label", {"for":"tab-close"},
                                 [openedMarker,
                                  mkElt("div", {"class":"bg-closer"})])
                       ]);
    theMenu.appendChild(divElt);

    var menuAlts = mkElt("ul");
    var divCont = mkElt("div", {"class":"content"}, menuAlts);
    theMenu.appendChild(divCont);

    function addMenuAlt(id, inner) {
        var liElt = mkElt("li", null, inner);
        liElt.setAttribute("id", id);
        menuAlts.appendChild(liElt);
    }
    // addMenuAlt(mkElt("a", {href:"caped-editor.html"}, "Editor"));
    addMenuAlt("menu-alt-videos", mkElt("a", {href:"videos.html"}, "Videos"));
    addMenuAlt("menu-alt-bm", mkElt("a", {href:"caped-bookmarklet.html"}, "Install EasyCapEd bookmark"));
    addMenuAlt("menu-alt-help", mkElt("a", {href:"caped-help.html"}, "Help"));
    if (location.pathname == "/caped-editor.html") {
        addMenuAlt("menu-alt-download", mkElt("a", {href:"javascript:downloadAsWebVTT(theTranscriptDiv)"}, "Download transcript"));
    }

}

var theHeader;
function buildHeader() {
    theHeader = document.getElementById("caped-header");
    theHeader.classList.add("flx-box-vertical");
    
    var left = mkElt("div");
    var right = mkElt("div");
    theHeader.appendChild(left);
    theHeader.appendChild(right);

    var subTitle = document.getElementById("header-subtitle");
    if (subTitle) theHeader.removeChild(subTitle);

    theMenu = document.createElement("div");
    left.appendChild(theMenu);
    theMenu.setAttribute("id", "main-menu");
    buildMenu();

    var txt = document.createTextNode("EasyCapEd");
    left.appendChild(txt);
    if (subTitle) {
        left.appendChild(document.createTextNode(" - "));
        left.appendChild(subTitle);
    }

    var loadTypeField = mkElt("span", {id:"load-type"}, "");
    loadTypeField.addEventListener("click", (ev) => loadTypeDialog(ev));
    right.appendChild(loadTypeField);

    var userIcon = mkElt("span", {id:"user-icon"}, "");
    right.appendChild(userIcon);

}

function showClick(clicked) {
    // use the flash defined in popup.css
    clicked.classList.remove("flash");
    setTimeout(function(){
        clicked.classList.add("flash");
    }, 1);
}

thePromiseDOMready.then(buildHeader);
    
