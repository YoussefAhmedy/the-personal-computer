const { init } = require('./src/db/index');
init(); // ensure db is open
const { getBundle } = require('./src/controllers/content.controller');

const res = {
  json: (data) => {
    const fs = require('fs');
    // Replace all `/uploads/` paths with `assets/uploads/`
    // We will do this carefully by iterating over the fields, or simple string replace on the JSON string.
    let str = JSON.stringify(data, null, 2);
    str = str.replace(/"\/uploads\//g, '"assets/uploads/');
    const jsContent = `const LOCAL_DATA = ${str};\n\nmodule.exports = LOCAL_DATA;`; 
    // Wait, state.js is included via <script> tag in the browser, so it shouldn't be a module.exports.
    // I will write it as just a global variable or directly inject it into state.js
    
    // Better: let's just write data.json, and then I will use replace_file_content to put it inside state.js
    fs.writeFileSync('dump.json', str);
    console.log("Dumped to dump.json");
  }
};

getBundle({}, res);
