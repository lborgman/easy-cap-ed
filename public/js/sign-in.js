"use strict";

/* @license Copyright 2017 Lennart Borgman (lennart.borgman@gmail.com) All rights reserved. */

var theUser = { };

// https://firebase.google.com/docs/auth/web/google-signin
// https://firebase.google.com/docs/auth/web/facebook-login

function afterSignIn(result) {
    console.log("afterSignIn result", result);
    // fix-me: I don't understand this. credential seems only to be
    // available after new sign in.  What if the user is already
    // signed in? In that case there is no result, just a user after
    // onAuthStateChange.
    if (result.credential) {
        theUser.token = result.credential.accessToken;
    }
    return;

    // theUser.result = result; // fix-me
    // theUser.signedIn = true;
    // theUser.user = result.user;
    // theUser.email = result.user.email;
    // if (!theUser.email) {
    //     // Fix-me: For twitter. See https://github.com/firebase/FirebaseUI-Android/issues/419
    //     let addInfo = result.additionalUserInfo;
    //     let providerId = addInfo.providerId;
    //     theUser.email = addInfo.profile.email;
    //     if (!theUser.email) {
    //         signOut();
    //         var popMap = new Map();
    //         popMap.set("OK", null);
    //         var pop = new Popup("Sorry, no email. Signed out. 👵",
    //                             "No email address was delivered from "+providerId, popMap);
    //         pop.show();
    //     }
    // }
}
function authStateSignedIn(user) {
    // theUser.signedIn = true;
    // theUser.user = user; // fix-me
    // theUser.email = user.email;
    if (!user.email) {
        // Fix-me: For twitter. See https://github.com/firebase/FirebaseUI-Android/issues/419
        //
        // Hm, that was probably no good idea. Removed it to simplify code.
        //
        // let providerData = user.providerData;
        // if (providerData) {
        //     let userData = providerData[0];
        //     theUser.email = userData.email;
        // }
        if (!user.email) {
            let providerId = user.providerData[0].providerId;
            signOut();
            var popMap = new Map();
            popMap.set("OK", null);
            var pop = new Popup("Sorry, no email. Signed out again. 👵",
                                "Your email address is used to identify you in EasyCapEd,"
                                + " but your email address was not provided by "+providerId, popMap);
            pop.show();
        }
    }
}
function signIn(provider, redirect) {
    if (redirect) { 
        firebase.auth().getRedirectResult().then(function(result) {
            afterSignIn(result);
        }).catch(function(error) {
            signInError(error);
        });
        firebase.auth().signInWithRedirect(provider);
    } else {
        firebase.auth().signInWithPopup(provider).then(function(result) {
            afterSignIn(result);
        }).catch(function(error) {
            signInError(error);
        });
    }
}

function signInGoogle(redirect) {
    var provider = new firebase.auth.GoogleAuthProvider();
    signIn(provider, redirect);
}
function signInFacebook(redirect) {
    var provider = new firebase.auth.FacebookAuthProvider();
    signIn(provider, redirect);
}
function signInTwitter(redirect) {
    var provider = new firebase.auth.TwitterAuthProvider();
    signIn(provider, redirect);
}

function signInError(error) {
    console.log("sign in error", error);
    
    var popMap = new Map();
    popMap.set("OK", null);
    var body = document.createElement("div");
    if (error.code == "auth/account-exists-with-different-credential") {
        let p1 = document.createElement("p")
        body.appendChild(p1);
        p1.innerHTML = "You have already created an account here by signing in with this mail address:";
        let p2 = document.createElement("p");
        body.appendChild(p2);
        p2.innerHTML = "<b>"+error.email+"</b>";
    }
    let p1 = document.createElement("p")
    body.appendChild(p1);
    p1.innerHTML = error.message;

    let pop = new Popup("You can't sign in this way now  👵", body, popMap, true);
    pop.show();

    // var credential = error.credential;
}

function fixUserIcon() {
    var iconElt = document.getElementById("user-icon");
    var user = firebase.auth().currentUser;
    if (user) {
        iconElt.innerHTML = "";
        var img = mkElt("img", {src:user.photoURL});
        iconElt.appendChild(img);
        document.body.classList.add("signed-in");
        document.body.classList.remove("signed-out");
    } else {
        iconElt.innerHTML = "Sign In";
        document.body.classList.remove("signed-in");
        document.body.classList.add("signed-out");
    }
}

var thePromiseDOMuserIcon = new Promise(function(resolve) {
    var uiElt = document.getElementById("user-icon");
    if (uiElt) {
        return resolve();
    }
    thePromiseDOMready.then(function() {
        var header = document.getElementById("caped-header");
        var uiElt = document.getElementById("user-icon");
        if (uiElt) return resolve();
        var mo = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                console.log(mutation);
            });
            var uiElt = document.getElementById("user-icon");
            if (uiElt) {
                mo.disconnect();
                resolve();
            }
        });
        mo.observe(header, {
            childList: true,
            subtree: true,
        });
    });
});
// fix-me: when to call this??? Never. OnAuthStateChange does it.
// setTimeout(()=> thePromiseDOMuserIcon.then(function() {
//     console.log("DOM user icon ready, fixuserIcon");
//     fixUserIcon();
// }), 1000);

function signOut() {
    firebase.auth().signOut().then(function() {
        // Sign-out successful.
        // thePromiseDOMuserIcon.then(fixUserIcon);
        location.href = "videos.html";
    }).catch(function(error) {
        // An error happened.
    });
}



function setupUserIconClick() {
    thePromiseDOMuserIcon.then(function() {
        var iconElt = document.getElementById("user-icon");
        iconElt.addEventListener("click", function() {
            var user = firebase.auth().currentUser;
            if (user) {
                let email = user.email; // || theUser.email; // fix-me: last part for twitter
                var msg = "You are currently signed in to EasyCapEd as:<br><br>"
                    +"&nbsp;&nbsp;"+user.displayName+"<br>\n"
                    +"&nbsp;&nbsp;"+email+"<br>\n"
                    +"<br>\nDo you want to sign out?"
                if (typeof Popup !== "undefined" && Popup) {
                    var popMap = new Map();
                    popMap.set("Yes", ()=>signOut());
                    popMap.set("No", null);
                    new Popup("Sign Out? 👵", msg, popMap, true).show();
                } else {
                    if (confirm(msg)) signOut();
                }
            } else {
                askSignIn(false);
            }
        });
    });
}
setupUserIconClick();

function askSignIn(force) {
    let imgT = "https://www.gstatic.com/mobilesdk/160409_mobilesdk/images/auth_service_twitter.svg";
    let imgF = "https://www.gstatic.com/mobilesdk/160409_mobilesdk/images/auth_service_facebook.svg";
    let imgG = "https://www.gstatic.com/mobilesdk/160512_mobilesdk/auth_service_google.svg";

    let ways = document.createElement("div");
    ways.classList.add("popup-buttons");

    
    function addBtn(providerFun, title, imgSrc) {
        let btn = document.createElement("div");
        ways.appendChild(btn);
        btn.classList.add("popup-button");
        btn.classList.add("popup-close");
        let img = document.createElement("img");
        img.setAttribute("src", imgSrc);
        btn.appendChild(img);
        let span = document.createElement("span");
        span.innerHTML = "&nbsp;"+title;
        btn.appendChild(span);
        btn.addEventListener("click", (ev)=>{ providerFun(); });
    }
    addBtn(signInGoogle, "Google", imgG);
    addBtn(signInFacebook, "Facebook", imgF);
    addBtn(signInTwitter, "Twitter", imgT);

    let pop = new Popup("Sign In? 👵",
                        "Choose account:",
                        ways, !force);
    pop.show();
}

var theFirstAuthStateChangedDone = false;
var promiseFirstAuthStateChangedDone = new Promise(function(resolve){
    if (theFirstAuthStateChangedDone) { resolve(); return; }
    firebase.auth().onAuthStateChanged(function(user) {
        theFirstAuthStateChangedDone = true;
        resolve();
    });
});

firebase.auth().onAuthStateChanged(function(user) {
    theFirstAuthStateChangedDone = true;
    if (user) {
        console.log("logged in:", user.email);
        // User is signed in.
        authStateSignedIn(user);
    } else {
        // No user is signed in.
        // theUser = { signedIn:false };
    }
    console.log("onAuthStateChanged", user);
    thePromiseDOMuserIcon.then(fixUserIcon);
});

