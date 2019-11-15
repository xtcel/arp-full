var spawn = require('child_process').spawn;
var arpProtocol = require('./arpProtocol.js');

module.exports = class arpLinux extends arpProtocol {

  /**
   * get MAC address
   */
  getMACAddress(ipaddress) {

    // ping the ip address to encourage the kernel to populate the arp tables
	var ping = spawn("ping", [ "-c", "1", ipaddress ]);
	
	ping.on('close', function (code) {
		// not bothered if ping did not work
		
		var arp = spawn("arp", [ "-n", ipaddress ]);
		var buffer = '';
		var errstream = '';
		arp.stdout.on('data', function (data) {
			buffer += data;
		});
		arp.stderr.on('data', function (data) {
			errstream += data;
		});
		
		arp.on('close', function (code) {
			if (code !== 0) {
				console.log("Error running arp " + code + " " + errstream);
				cb(true, code);
				return;
			}
			
			//Parse this format
			//Lookup succeeded : Address                  HWtype  HWaddress           Flags Mask            Iface
			//					IPADDRESS	              ether   MACADDRESS   C                     IFACE
			//Lookup failed : HOST (IPADDRESS) -- no entry
			//There is minimum two lines when lookup is successful
			var table = buffer.split('\n');
			if (table.length >= 2) {
				var parts = table[1].split(' ').filter(String);
				cb(false, parts.length == 5 ? parts[2] : parts[1]);
				return;
			}
			cb(true, "Could not find ip in arp table: " + ipaddress);
		});
  });	
  
  }

  /**
   * get ip address 
   * @param {*} MACAddress 
   */
  getIPAddress(MACAddress) {}

}

