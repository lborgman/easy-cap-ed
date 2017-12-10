'use strict';

/* @license Copyright 2017 Lennart Borgman (lennart.borgman@gmail.com) All rights reserved. */

function getYTtimedtextURL() {
    let ret;
    let resources = performance.getEntriesByType('resource');
    resources.forEach(function(r){
        // console.log('r.name', r.name);
	if (r.name.match('timedtext')) {
            console.log('r.name', r.name);
            ret = r.name;
        }
    });
    return ret;
}

function getYouTubeIdFromURL(ytURL) {
    let re = new RegExp('(?:[=/]|^)'+'((?:[A-Z0-9_-]){11})(?:[?&#\n]|$)', 'ig');
    let m2 = re.exec(ytURL);
    console.log('m2', m2);
    if (m2) return m2[1];
}

run: {
    console.log('this=', this);
    if (location.href.match(/\/caped-bookmarklet\.html$/)) {
        break run;
    }
    let capEdURL = 'http://dummy/path/caped-editor.html';
    let tempA = document.createElement('a');
    tempA.href = capEdURL;
    tempA.protocol = 'PROTOCOL';
    tempA.host     = 'HOST';
    tempA.pathname = 'PATHNAME';
    if (!location.hostname.match(/\.youtube\.com$/)) {
        if (confirm('Please go to YouTube and open your video. 🦁\nThen start this bookmarklet again.'
                    +'\n\nOr, perhaps you wanted to go to the EasyCapEd editor?')) location.href = tempA.href; 
        break run;
    }
    let ytId = getYouTubeIdFromURL(location.href);
    if (!ytId) {
        alert('Please choose a video. 🐶\nThen start this bookmarklet again.');
        break run;
    }
    // let ytTitle = document.head.querySelector('title').innerText;
    let ytTitle = document.title;

    let urlTT;
    /* Check for html5 */
    let video = document.querySelector('video');
    if (video) {
        let tracks = video.querySelectorAll('track');
        for (let i=0; i<tracks.length; i++) {
            let track = tracks[i];
            let src = track.getAttribute('src');
	    if (src.match('timedtext')) {
                urlTT = src;
            }
        }
    }
    urlTT = urlTT || getYTtimedtextURL();
    if (!urlTT) {
        alert('Please turn on the auto-generated captions you want. 🦄\nThen start this bookmarklet again.');
        break run;
    }
    // Try replacing on mobile so we do not have to parse WebVTT now
    urlTT = urlTT.replace(new RegExp('fmt=vtt'), 'fmt=srv3');
    if (!confirm('Open this in EasyCapEd? 👷‍♀️')) break run;
    // let goURL = capEdURL+'?ytId='+ytId+'&ytTimedText='+encodeURIComponent(urlTT);
    let goURL = tempA.href
        +'?ytId='+ytId
        +'&ytTitle='+encodeURIComponent(ytTitle)
        +'&ytTimedText='+encodeURIComponent(urlTT)
    ;
    window.open(goURL);
}
