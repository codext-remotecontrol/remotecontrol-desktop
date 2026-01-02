var fs = require('fs');
var dir = './released';

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

var files = fs.readdirSync('./release/').filter((fn) => fn.endsWith('.exe'));
if (files[0]) {
  fs.copyFile('./release/' + files[0], './released/' + files[0], (err) => {
    if (err) throw err;
  });
}
fs.copyFile('./release/latest.yml', './released/latest.yml', (err) => {
  if (err) throw err;
});
