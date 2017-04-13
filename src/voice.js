var recognition;
var words;
var isRecording = false;
var dialog;
var numbers = [
  "zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"
];
var parent;
function promptProduct(element) {
  parent = element;
  dialog = element.$.voiceDialog;
  $(dialog).empty();
  $(dialog).append("<h3>Say something like...</h3>");
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.start();
  isRecording = true;
  recognition.onspeechend = parseResult;
  recognition.onresult = getResult;
}

function getResult(event) {
  recognition.stop();
  isRecording = false;
  var result = event.results[0][0].transcript;
  words = result.split(' ');
  if (words[0] == "add" || words[0] == "had" || words[0] == "ad" || words[0] == "and" || words[0] == "at")
    words.shift();
}

function promptProductKeyboard(element) {
  parent = element;
  dialog = element.$.voiceDialog;
  $(dialog).empty(); //Make sure it's empty
  $(dialog).css('padding', '1em');
  $(dialog).append("<h3>Enter product info using speech-recognition</h3>");
  $(dialog).append("<em>Tip: Use the enter button on your keyboard or press the \'submit\' button.</em><br>");
  $(dialog).append("<div><paper-input></paper-input></div>");
  $(dialog).append("<div><paper-button id=\"submitProduct\" style=\"background-color: #53aca1; color: white;\">Submit</paper-button></div>");
  $(dialog).find("#submitProduct").click({ dia: dialog },getResultKeyboard);
}

function getResultKeyboard() {
  var result = dialog.querySelector("paper-input").value;
  words = result.split(' ');
  if (words[0] == "add" || words[0] == "had" || words[0] == "ad" || words[0] == "and" || words[0] == "at")
    words.shift();
  parseResult();
}



function parseResult() {
  console.debug("Words: ", words);

  /******************************
   * QUANTITY
   ******************************/
  var tempQuant;
  var quantity = 0;
  if (words.lastIndexOf("of") >= 0) {
    tempQuant = words.splice(0, words.lastIndexOf("of") + 1);
    tempQuant.pop();
  } else {
    tempQuant = words;
  }
  if (!isNumeric(tempQuant[0])) {
    if (tempQuant.indexOf("a") >= 0 && tempQuant.indexOf("pound") >= 0 && tempQuant.indexOf("quarter") == -1) {
      quantity += 1;
    }
    for (var i = 0; i < numbers.length; i++) {
      if (tempQuant[0] == numbers[i]) {
        // tempQuant[0] = numbers.indexOf(tempQuant[0]);
        quantity += i;
      }
    }
  } else {
    // Account for "a pound" etc
    quantity += parseFloat(tempQuant[0]);
  }
  if (tempQuant.indexOf("half") >= 0) {
    quantity += 0.5;
  } else if (tempQuant.indexOf("quarter") >= 0) {
    quantity += 0.25;
  } else if (tempQuant.indexOf("quarters") >= 0 || tempQuant.indexOf("three-quarters") >= 0) {
    quantity += 0.75;
  }
  // $('#quantity').val(quantity);
  if (isNumeric(words[0])) {
      words.splice(0,1);
  }
  /******************************
   * NAME
   ******************************/
  var name;
  var tmp;
  if (words.indexOf("for") >= 0) {
    tmp = words.splice(0, words.indexOf("for"));
  } else {
    tmp = words.splice(0, words.indexOf("at"));
  }
  name = tmp.join(' ');
  name = capitalizeFirstLetter(name);
  // $('#name').val(name);
  // $('#name').css('textTransform', 'capitalize');
  /******************************
   * PRICE
   ******************************/
  var price;
  if (words.indexOf("at") >= 0) {
    words.splice(0,words.indexOf("at") + 1);
  } else if (words.indexOf("for") >= 0) {
    words.splice(0,words.indexOf("for") + 1);
  }
  if (words.indexOf("pound") >= 0 || words.indexOf("ounce") >= 0) {
    words.pop();
    words.pop();
  } else if (words.indexOf("each") >= 0) {
    words.pop();
  }
  // Take care of "a dollar" (instead of "one dollar")
  if (words.indexOf("a") >= 0) {
    words.splice(0,1);
    words[0] = 1;
    // If we have cents
    if (words.length > 1) {
      if (words.indexOf("and") >= 1) {
        words.splice(words.indexOf("and"), 1);
      }
      // Anomaly...
      if (words[1][0] == '$') {
        words[1] = words[1].slice(-2);
      }
      if (words[1] == "fifty") {
        words[1] = 50;
      }
    }
    price = words.join('');
    // End result, purely integers
  } else if (words[0][0] == '$') {
    price = words.join('');
    // Remove the dollar sign
    price = price.replace('$', '');
    if (parseFloat(price) >= 100) {
      price += "00";
    }
    // Remove the period
    price = price.replace('.','');
    // End result, purely integers
  } else {
    if (words.length > 1) {
      price = words.join('');
    } else {
      price = words[0];
    }
    if (price.search(':') >= 0) {
      price = words.join('');
      price = price.replace(':', '');
    }
  } // End result, purely integers
  if (parseInt(price) < 100 && price[0] != '0') {
    price += "00";
  }
  // Insert dollar sign
  price = "$" + price;
  // Insert period
  price = price.slice(0, -2) + '.' + price.slice(-2);
  if (dialog) {
    $(dialog).children().css("display","none");
    $(dialog).append("<h2>Does this look right?</h2>");
    $(dialog).append("<div><product-item id=\"newProduct\" name=\"" + name + "\" quantity=\"" + quantity + "\" price=\"" + price + "\"></product-item></div>");
    $(dialog).append("<div><paper-button id=\"confirmProduct\" class=\"blue\">Yes</paper-button></div>");
    $(dialog).find("#confirmProduct").on("tap", _confirmProduct);
  }
}

function _confirmProduct() {
  var newProduct = $(dialog).find("#newProduct")[0];
  $(dialog).find("#newProduct").css("display", "none");  //Save the item so you can still call the associated functions
  $(dialog).find("h2").css("display", "none");  //These are weird round-about hacks
  $(dialog).find("#confirmProduct").css("display", "none");   // This one too
  $(dialog).append("<h3>Which of these carts do you want to add to?</h3>");
  $(dialog).append("<div id=\"dCarts\"role=\"listbox\"></div>");
  var carts = $(dialog).find("#dCarts")[0];
  for (cart of parent.data) {
    $(carts).append("<paper-item id=\"" + cart.$key + "\">" + cart.name + "</paper-item>");
    $(carts).find("#" + cart.$key).click({key: cart.$key}, function (event) {
      newProduct.cartId = event.data.key;
      newProduct._pushProduct();
      $(dialog).empty();
      dialog.close();
    });
  }
}


























function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function canUse() {
  // Opera 8.0+
  var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
  // Firefox 1.0+
  var isFirefox = typeof InstallTrigger !== 'undefined';
  // Safari 3.0+ "[object HTMLElementConstructor]"
  var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || safari.pushNotification);
  // Internet Explorer 6-11
  var isIE = /*@cc_on!@*/false || !!document.documentMode;
  // Edge 20+
  var isEdge = !isIE && !!window.StyleMedia;
  // Chrome 1+
  var isChrome = !!window.chrome && !!window.chrome.webstore;
  // Blink engine detection
  var isBlink = (isChrome || isOpera) && !!window.CSS;

  if (isChrome) {
    return { browser: "chrome", voice: true, ocr: true, search: true };
  } else if (isOpera) {
    return { browser: "opera", voice: false, ocr: true, search: true };
  } else if (isFirefox) {
    return { browser: "firefox", voice: false, ocr: true, search: true };
  } else if (isSafari) {
    return { browser: "safari", voice: false, ocr: false, search: true };
  } else if (isIE) {
    return { browser: "ie", voice: false, ocr: false, search: true };
  } else if (isEdge) {
    return { browser: "edge", voice: false, ocr: true, search: true };
  } else {
    console.debug("Use a different browser please!");
    return { browser: "unknown", voice: false, ocr: false, search: true };
  }

}
