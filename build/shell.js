const distFolder = '../dist/';
const fs = require('fs');
const path = require('path');

const wrapper = fs.readFileSync('./wrapper.js', {encoding: 'utf8'});

fs.readdir(distFolder, (err, files) => {
  files.forEach(file => {
    if (!file.endsWith('.js')) {
      return;
    }
    const fullPath = path.join(distFolder, file);
    const fileContent = fs.readFileSync(fullPath, {encoding: 'utf8'});
    fs.writeFileSync(fullPath, wrapper.replace(/\/\/ SQLEET_HERE/g, () => fileContent));
    console.log(`Wrapped file: ${file}`);
  });
});