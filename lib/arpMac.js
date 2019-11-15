var spawn = require('child_process').spawn;
var util = require('util');
var arpProtocol = require('./arpProtocol.js');

module.exports = class arpMac extends arpProtocol {
  /**
   * get MAC address
   */
  getMACAddress(ipaddress, cb) {
    console.log('ipaddress: ', ipaddress);
    console.log('cb: ', cb);
    if (typeof cb !== "undefined") {
      this.arpScanMACAddress(ipaddress, cb);
    } else {
      const arpScanMACAddressPromise = util.promisify(this.arpScanMACAddress);
      return arpScanMACAddressPromise(ipaddress);
    }
  }

  arpScanMACAddress(ipaddress, cb) {
    // ping the ip address to encourage the kernel to populate the arp tables
	  var ping = spawn("ping", ["-c", "1", ipaddress ]);
	
    ping.on('close', function (code) {
      // not bothered if ping did not work
      
      var arp = spawn("arp", ["-n", ipaddress] );
      var buffer = '';
      var errstream = '';
      arp.stdout.on('data', function (data) {
        buffer += data;
      });
      arp.stderr.on('data', function (data) {
        errstream += data;
      });
      
      arp.on('close', function (code) {
        // On lookup failed OSX returns code 1
        // but errstream will be empty
        if (code !== 0 && errstream !== '') {
          console.log("Error running arp " + code + " " + errstream);
          cb(true, code);
          return;
        }
        
        //parse this format
        //Lookup succeeded : HOST (IPADDRESS) at MACADDRESS on IFACE ifscope [ethernet]
        //Lookup failed : HOST (IPADDRESS) -- no entry
        var parts = buffer.split(' ').filter(String);
        if (parts[3] !== 'no') {
          var mac = parts[3].replace(/^0:/g, '00:').replace(/:0:/g, ':00:').replace(/:0$/g, ':00').replace(/:([^:]{1}):/g, ':0$1:');
          cb(false, mac);
          return;
        }
          
        cb(true, "Count not find ip in arp table: " + ipaddress);
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

    var arp = spawn("arp", ['-a', '-l', '-n']);

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
          var chunks = line.split(/\s+/);
          // MAC Address
          let mac = (chunks[1] || '').toLowerCase();
          if (mac.length < 17) {
            const stringItems = mac.split(':');
            const array = stringItems.map(str => (str.length < 2 ? `0${str}` : str));
            mac = array.join(':');
          }

          return mac === MACAddress;
        })
        console.log('result line: ', resultLine);
        if (resultLine) {
          var chunks = resultLine.split(/\s+/);
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
}

