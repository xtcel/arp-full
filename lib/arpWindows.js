var spawn = require('child_process').spawn;
const arpProtocol = require('./arpProtocol.js');
var util = require('util');

module.exports = class arpWindows extends arpProtocol {
  /**
   * get MAC address
   */
  getMACAddress(ipaddress, cb) {
    console.log('ipaddress: ', ipaddress);
    console.log('cb: ', cb);
    if (typeof cb !== 'undefined') {
      this.arpScanMACAddress(ipaddress, cb);
    } else {
      const arpScanMACAddressPromise = util.promisify(this.arpScanMACAddress);
      return arpScanMACAddressPromise(ipaddress);
    }
  }

  arpScanMACAddress(ipaddress, cb) {
    // ping the ip address to encourage the kernel to populate the arp tables
    var ping = spawn('ping', ['-n', '1', ipaddress]);

    ping.on('close', function(code) {
      // not bothered if ping did not work

      var arp = spawn('arp', ['-a', ipaddress]);
      var buffer = '';
      var errstream = '';
      var lineIndex;

      arp.stdout.on('data', function(data) {
        buffer += data;
      });
      arp.stderr.on('data', function(data) {
        errstream += data;
      });

      arp.on('close', function(code) {
        if (code !== 0) {
          console.log('Error running arp ' + code + ' ' + errstream);
          cb(true, code);
          return;
        }

        var table = buffer.split('\r\n');
        for (lineIndex = 3; lineIndex < table.length; lineIndex++) {
          //parse this format
          //[blankline]
          //Interface: 192.º68.1.54
          //  Internet Address      Physical Address     Type
          //  192.168.1.1           50-67-f0-8c-7a-3f    dynamic

          var parts = table[lineIndex].split(' ').filter(String);
          if (parts[0] === ipaddress) {
            var mac = parts[1].replace(/-/g, ':');
            cb(false, mac);
            return;
          }
        }
        cb(true, 'Count not find ip in arp table: ' + ipaddress);
      });
    });
  }

  /**
   * get ip address 
   * @param {*} MACAddress 
   */
  getIPAddress(MACAddress, cb) {
    if (typeof cb !== "undefined") {
      this.arpScanIPAddress(MACAddress);
    } else {
      util.promisify(this.arpScanIPAddress);
      const arpScanIPAddressPromise = util.promisify(this.arpScanIPAddress);
      return arpScanIPAddressPromise(MACAddress);
    }
  }

  arpScanIPAddress(MACAddress, cb) {
    let out = [],
        buffer = '',
        errbuf = '';

    var arp = spawn("arp", ['-a']);

    arp.stdout.on('data', function onData(data) { 
      buffer += data; 
    });

    arp.stderr.on('data', function onError(data) { 
      errbuf += data; 
    });

    arp.on('close', function onClose(code) {
        if (code != 0) return cb(code, null);

        buffer = buffer.split('\n');
        buffer.shift();
        buffer.pop();

        var resultLine = buffer.find((line) => {
          var chunks = line.split(' ').filter(String);
          // console.log('line: ', line);
          // MAC Address
          let mac = (chunks[1] || '').toLowerCase();
          if (mac.length < 17) {
            const stringItems = mac.split('-');
            const array = stringItems.map(str => (str.length < 2 ? `0${str}` : str));
            mac = array.join(':');
          } else {
            mac = mac.replace(/-/g, ':');
          }
          console.log('mac:', mac);
          return mac === MACAddress;
        })
        console.log('result line: ', resultLine);
        if (resultLine) {
          var chunks = resultLine.split(' ').filter(String);
          const ip = chunks[0];
          cb(null, ip);
        } else {
          cb(null, new Error('Count not find ip in arp table:', MACAddress));
        }
    });

    arp.on('error', function(err) {
        cb(null, err)
    });

    arp.on('exit', function(code, signal) {
      // console.log('arp exit: ', code, signal);
    });
  }

};
