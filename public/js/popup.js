"use strict";

/* @license Copyright 2017 Lennart Borgman (lennart.borgman@gmail.com) All rights reserved. */

var tempBg;
class Popup {
    constructor(header, body, buttonsMap, discardable, id) {
        this.header = header;
        this.body = body;
        this.buttonsMap = buttonsMap;
        this.discardable = discardable;
        this.id = id;
    }
    close() {
        setTimeout(()=>this.bg.style.opacity = "0", 1);
        setTimeout(()=>{
            console.log("checking to remove");
            if (this.bg.parentElement) {
                console.log("doing remove");
                this.bg.parentElement.removeChild(this.bg);
            }}, this.bgDuration);
    }
    show() {
        // let bgDuration = 200; // guess
        this.bgDuration = 200; // guess
        let me = this;
        function closePop() {
            me.close();
        }

        let bg = document.createElement("div");
        this.bg = bg;
        tempBg = bg;
        bg.classList.add("popup-bg");

        // let popOuter = document.createElement("div");
        // bg.appendChild(popOuter);
        let pop = document.createElement("div");
        if (this.id) pop.setAttribute("id", this.id);
        
        bg.appendChild(pop);
        pop.addEventListener("click", (ev)=>{
            let tCL = ev.target.classList;
            let pCL = ev.target.parentElement.classList;
            let gCL = ev.target.parentElement.parentElement.classList;
            if (tCL.contains("popup-close") || pCL.contains("popup-close") || gCL.contains("popup-close")) {
                closePop();
            } else {
                ev.stopPropagation();
            }
        });

        if (this.discardable) {
            bg.addEventListener("click", (ev)=>{
                closePop();
            });
        } else {
            // pop.classList.add("flash");
            bg.addEventListener("click", (ev)=>{
                pop.classList.remove("flash");
                setTimeout(()=>pop.classList.add("flash"), 1);
            });
        }


        let closeX = mkElt("span", null, "x");
        closeX.classList.add("pop-close-x");
        closeX.addEventListener("click", (ev)=>closePop());
        pop.appendChild(closeX);

        let header = this.header;
        if (!(this.header instanceof Element)) {
            header = document.createElement("div");
            header.innerHTML = this.header;
        }
        header.classList.add("popup-header");
        pop.appendChild(header);
        
        let body = this.body;
        if (!(this.body instanceof Element)) {
            body = document.createElement("div");
            body.innerHTML = this.body;
        }
        body.classList.add("popup-body");
        pop.appendChild(body);
      
        let btnDiv = document.createElement("div");
        btnDiv.classList.add("popup-buttons");
        pop.appendChild(btnDiv);

        if (this.buttonsMap instanceof Element) {
            btnDiv.appendChild(this.buttonsMap);
        } else {
            if (!this.buttonsMap) {
                this.buttonsMap = new Map();
                this.buttonsMap.set("OK", null);
            }
            for (let [key, fun] of this.buttonsMap) {
                let btnElt = document.createElement("div");
                btnElt.classList.add("popup-button");
                btnElt.classList.add("popup-close");
                btnDiv.appendChild(btnElt);
                btnElt.innerHTML = key;
                if (fun) btnElt.addEventListener("click", fun);
                btnElt.addEventListener("click", (ev)=>{ showClick(ev.target); });
            }
        }
       
        document.body.appendChild(bg);
        setTimeout(()=>bg.style.opacity = "1", 10);

        setTimeout(()=>{
            let bgStyle = window.getComputedStyle(bg);
            if (!bgStyle) {
                debugger;
                return;
            }
            let tD = bgStyle.transitionDuration;
            if (!tD) {
                debugger;
                return;
            }
            let dur = parseFloat(tD);
            if (isNaN(dur)) {
                debugger;
                return;
            }
            this.bgDuration = Math.floor(1000 * dur);
        }, 100);

    }
}

function popupMessage(title, msg) {
    new Popup(title, msg).show();
}
// var popMap = new Map();
// popMap.set("OK", ()=>console.log("clicked OK"));
// popMap.set("No", ()=>console.log("said No"));
// var pop = new Popup("Test!!!", "the body", popMap);
// setTimeout(function() {pop.show();}, 3000);
