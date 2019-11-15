const os = require('os');
var arpWindows = require('./arpWindows.js');
var arpMac = require('./arpMac.js');
var arpLinux = require('./arpLinux.js');

// function createArp() {
  const platform = os.platform();
  var arpClient;
  switch (platform) {
    case 'win32':
      arpClient = new arpWindows();
      break;
    case 'darwin': 
      arpClient = new arpMac();
      break;
    case 'linux':
      arpClient = new arpLinux();
      break;
    default:
      arpClient = new arpWindows();
  }

  // return arpClient;
// }

module.exports = arpClient;