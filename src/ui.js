import "./ui.css";
import data from "./data.json";

const Clusterize = require('./clusterize.min.js');

// Global variable declarations
let fontsCluster = null;
let searchInput = document.getElementById("search");
let fontRowDiv = [];
let searchResults = [];

let keys = Object.keys(data);
let searchValue = "";

// Fetching list of fonts from figma
window.onload = function(){
  parent.postMessage({ pluginMessage: { type: "fetch-fonts" } }, "*");
  searchInput.focus();
}

// Initing search cluster
let searchCluster = new Clusterize({
  rows: searchResults,
  rows_in_block: 15,
  tag: "div",
  scrollId: "search-scroll-area",
  contentId: "search-content-area",
  show_no_data_row: false,
});

//event handler from figma
onmessage = (event) => {
  const message = event.data.pluginMessage;
  const data = message.data;
  const type = message.type;

  if (type === "FONT_LOADED") {
    addFontRows(data, false);
  }
};

// On click listener for font rows
document.body.addEventListener('click', function(e) {
  if(e.target.className === 'font-row') {
    const name = e.target.getAttribute('data-content');
    parent.postMessage({ pluginMessage: { type: "set-font", data: name } }, "*");
  }
});

const isChiense = (family) => {
  family = family.split(" ")[0].toLowerCase();
  return keys.map(key => key.toLowerCase()).indexOf(family) !== -1;
  // return keys.some((key) => key.toLowerCase() === family);
};

const toChinese = (family) => {
  family = family.split(" ");
  keys.forEach((key) => {
    let index = family.indexOf(key);
    if (index !== -1) {
      family.splice(index, 1, data[key]);
    }
  });

  return family.join(" ");
};

const placeholder = (arr) => {
  return arr.map((d) => d.replace("文本示范", searchValue));
};

// Function to clean out the fonts array returned from figma
const addFontRows = (fonts) => {
  for (let i = 0; i < fonts.length; i++) {
    let family = fonts[i].fontName.family;
    if (fonts[i] && !family.startsWith(".")) {
      if (
        ((i > 0 && family !== fonts[i - 1].fontName.family) || i == 0) &&
        isChiense(family) &&
        detectFont(family)
      ) {
        let cnFamily = toChinese(family);
        fontRowDiv.push(`
            <div class="font-row" data-content="${family}" style="font-family: '${family.toString()}', sans-serif">
              <p class="placeholder">文本示范</p>
              <p class="family">${cnFamily}</p>
            </div>
          `);
      }
    } else {
      fonts.splice(i, 1);
      i++;
    }
  }

  fontsCluster = new Clusterize({
    rows: fontRowDiv,
    rows_in_block: 15,
    tag: "div",
    scrollId: "fonts-scroll-area",
    contentId: "fonts-content-area",
    no_data_text: "No fonts found :(",
  });
};

// Debounce setup variables
let typingTimer;
let doneTypingInterval = 500;

// On keyup event listener
searchInput.addEventListener("keyup", () => {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(doneTyping, doneTypingInterval);
});

// After debounce function
const doneTyping = () => {
  searchValue = searchInput.value;
  const emptySearch = document.getElementById('empty-search');
  const fontsScrollArea = document.getElementById('fonts-scroll-area');
  const searchScrollArea = document.getElementById('search-scroll-area');
  if (searchValue.length > 2) {
    let searchResults = placeholder(fontRowDiv);
    searchCluster.update(searchResults);
    emptySearch.style.display = 'none';
    fontsScrollArea.style.display = 'none';
    searchScrollArea.style.display = 'block';
  }
  if (searchValue.length === 0) {
    fontsScrollArea.style.display = 'block';
    emptySearch.style.display = 'none';
    emptySearch.style.display = 'block';
  }
};

const clearSearch = document.getElementById('clear-search');
clearSearch.addEventListener('click', function (e) {
  searchValue = "";
  searchCluster.update(placeholder(fontRowDiv));
  const search = document.getElementById('search');
  const emptySearch = document.getElementById('empty-search');
  const fontsScrollArea = document.getElementById('fonts-scroll-area');
  const searchScrollArea = document.getElementById('search-scroll-area');
  emptySearch.style.display = 'none';
  searchScrollArea.style.display = 'none';
  fontsScrollArea.style.display = 'block';
  search.value = '';
});

/* Figma returns bunch of unnecessary/weird system fonts that don't render in browser.
 * Hence this following font detection piece to eliminate those fonts
 * https://github.com/alanhogan/bookmarklets/blob/master/font-stack-guess.js
 */

// Using m or w because these two characters take up the maximum width.
// And a LLi so that the same matching fonts can get separated
let testString = "mmmmmmmmmmlli";

//Testing using 72px font size. I guess larger the better.
let testSize = "72px";
let defaultWidth = 0;
let defaultHeight = 0;

let body = document.getElementsByTagName("body")[0];

// create a SPAN in the document to get the width of the text we use to test
let s = document.createElement("span");
s.style.fontSize = testSize;
s.style.visibility = "hidden";
s.innerHTML = testString;
s.style.fontFamily = "serif";
body.appendChild(s);
defaultWidth = s.offsetWidth;
defaultHeight = s.offsetHeight;

/* Function which adds a text layer, calculates the width with defaul ones to
 * detect wether browser has the font installed or not
 */
const detectFont = (font) => {
  let detected = false;
  s.style.fontFamily = '"' + font + '"' + "," + "serif";
  let matched =
    s.offsetWidth != defaultWidth || s.offsetHeight != defaultHeight;
  detected = detected || matched;
  // console.log(font + " : " + detected);
  return detected;
};
