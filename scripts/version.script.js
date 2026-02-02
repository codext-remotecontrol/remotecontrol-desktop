var fs = require('fs');
const { generate, validate, parse, format } = require('build-number-generator');

var file = 'package.json';
fs.readFile(file, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }

  var tmp = JSON.parse(data);
  tmp.version = '##version##'; // generate('##version##');

  fs.writeFile(file, JSON.stringify(tmp), 'utf8', function (err) {
    if (err) return console.log(err);
  });
});
