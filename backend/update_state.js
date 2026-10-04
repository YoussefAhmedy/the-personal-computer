const fs = require('fs');

const dumpPath = './dump.json';
const statePath = '../frontend/js/state.js';

const dumpData = fs.readFileSync(dumpPath, 'utf-8');
const stateData = fs.readFileSync(statePath, 'utf-8');

// Find the start of `const data = {` inside `async function loadContent()`
const startStr = "async function loadContent() {\n  const data = {";
const endStr = "};\n\n  USER = data.site.user ||";

const startIndex = stateData.indexOf(startStr);
if (startIndex === -1) {
  console.error("Could not find start of data in state.js");
  process.exit(1);
}

const endIndex = stateData.indexOf(endStr);
if (endIndex === -1) {
  console.error("Could not find end of data in state.js");
  process.exit(1);
}

const newStateData = stateData.substring(0, startIndex + "async function loadContent() {\n  const data = ".length) 
  + dumpData 
  + stateData.substring(endIndex);

fs.writeFileSync(statePath, newStateData);
console.log("state.js successfully updated with user data!");
