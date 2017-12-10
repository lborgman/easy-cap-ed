"use strict";

/* @license Copyright 2017 Lennart Borgman (lennart.borgman@gmail.com) All rights reserved. */

var thePromiseDOMready = new Promise(function(resolve) {
    if (document.readyState === "complete") return resolve();
    document.addEventListener("DOMContentLoaded", resolve);
});

