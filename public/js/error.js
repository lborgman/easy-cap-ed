window.addEventListener('error', function (e) {
  console.log(e);
  var error = e.error;
  var msg = "Error: "+error+"\n\n"+error.stack;
  console.log(msg);
  alert(msg);
});
