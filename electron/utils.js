const url = require("url");

const isDev = process.mainModule.filename.indexOf('app.asar') === -1;

let mainUrl = (isPopup = false, html = 'index') => url.format({
  pathname: `${__dirname}/../html/${html}.html`,
  protocol: "file:",
  slashes: true,
  hash: isPopup ? '/popout' : null
});

module.exports = {
  isDev,
  mainUrl,
}