"use strict";

/* @license Copyright 2017 Lennart Borgman (lennart.borgman@gmail.com) All rights reserved. */

// function promiseDOMready() {
//     return new Promise(function(resolve) {
//         if (document.readyState === "complete") return resolve();
//         document.addEventListener("DOMContentLoaded", resolve);
//     });
// }
thePromiseDOMready.then(function(){
    var pagePath = location.href;
    console.log(pagePath);
    pagePath = pagePath.replace(new RegExp('/[^/]*$'), '/');
    console.log("pagePath", pagePath);

    var ab = document.querySelector("#bookmarklet a");
    ab.innerHTML = "EasyCapEd"
    ab.setAttribute("draggable", true);

    // var reURLinScript = new RegExp('\'(http://127.0.0.1.*?)\'');
    // var m = aHref.match(reURLinScript);
    // console.log("m", m);
    // var urlInScript = m[1];
    // var tempA = document.createElement("a")
    // tempA.href = urlInScript;
    // console.log("tempA.href", tempA.href);

    var pathname = location.pathname.replace(new RegExp("[^/]*$"), "")+"caped-editor.html";

    var aHref = ab.getAttribute("href");
    aHref = aHref.replace('PROTOCOL', location.protocol);
    aHref = aHref.replace('HOST', location.host);
    aHref = aHref.replace('PATHNAME', pathname);
    ab.setAttribute("href", aHref);

    ab.addEventListener("click", function(ev) {
        howToMobile1();
    });

    function howToMobile1() {
        let popMap = new Map();
        popMap.set("Copy", function(ev){
            copyTextToClipboard(aHref);
            howToMobile2();
        });
        let body = document.createElement("div");
        let p;
        p = document.createElement("p");
        body.appendChild(p);
        p.innerHTML = "Click <b>Copy</b> below to copy the bookmarklet JavaScript code."
        
        let pop = new Popup("For mobile phones, step 1 🐴", body, popMap, true);
        pop.show();
    }
    function howToMobile2() {
        let popMap = new Map();
        popMap.set("Close", null);
        let body = document.createElement("div");
        let p;

        p = document.createElement("p");
        body.appendChild(p);
        p.innerText = "In this step you will make a bookmark and convert it to a bookmarklet.";
       
        let ol = document.createElement("ol");
        body.appendChild(ol);

        let li;
        li = document.createElement("li");
        ol.appendChild(li);
        let span = document.createElement("span");
        li.appendChild(span);
        span.innerText = "Now save any page as a bookmark. I suggest you save this page. ";
        let a = document.createElement("a");
        a.setAttribute("target", "_blank");
        a.setAttribute("href",
                       "https://support.google.com/chrome/answer/188842?co=GENIE.Platform%3DAndroid&hl=en");
        a.innerText = "help";
        li.appendChild(a);
        
        li = document.createElement("li");
        ol.appendChild(li);
        li.innerText = "Then edit the new bookmark."
            +" Replace the URL link with the code you copied in step 1.";

        p = document.createElement("p");
        body.appendChild(p);
        p.innerHTML = "<b>This is then your bookmarklet.</b> Give it any name you like."
            +" (You type the name of it in the web browser address bar to use it.)";

        let pop = new Popup("For mobile phones, step 2 🦄", body, popMap, true);
        pop.show();
    }
}).catch(function(err){
    console.log("Something went wrong: ", err);
    alert("Something went wrong: "+err);
    debugger;
});

function copyTextToClipboard(text) {
  var textArea = document.createElement("textarea");

  textArea.style.position = 'fixed';
  textArea.style.top = 0;
  textArea.style.left = 0;

  // Ensure it has a small width and height. Setting to 1px / 1em
  // doesn't work as this gives a negative w/h on some browsers.
  textArea.style.width = '2em';
  textArea.style.height = '2em';

  // We don't need padding, reducing the size if it does flash render.
  textArea.style.padding = 0;

  // Clean up any borders.
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';

  // Avoid flash of white box if rendered for any reason.
  textArea.style.background = 'transparent';


  textArea.value = text;

  document.body.appendChild(textArea);

  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    console.log('Copying text command was ' + msg);
  } catch (err) {
    console.log('Oops, unable to copy');
  }

  document.body.removeChild(textArea);
}


