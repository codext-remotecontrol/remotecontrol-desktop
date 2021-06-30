var fs = require('fs');
var dir = './released';

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

var files = fs.readdirSync('./release/').filter((fn) => fn.endsWith('.AppImage'));
if (files[0]) {
  fs.copyFile('./release/' + files[0], './released/' + files[0], (err) => {
    if (err) throw err;
  });
}
fs.copyFile('./release/latest-linux.yml', './released/latest-linux.yml', (err) => {
  if (err) throw err;
});
