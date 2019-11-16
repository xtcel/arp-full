const os = require('os');
var arpWindows = require('./arpWindows.js');
var arpMac = require('./arpMac.js');
var arpLinux = require('./arpLinux.js');

  const platform = os.platform();
  var arp;
  switch (platform) {
    case 'win32':
      arp = new arpWindows();
      break;
    case 'darwin': 
      arp = new arpMac();
      break;
    case 'linux':
      arp = new arpLinux();
      break;
    default:
      arp = new arpWindows();
  }

module.exports = arp;