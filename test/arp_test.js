var arp = require('../lib/arp.js');

arp.getMACAddress('192.168.1.1')
  .then((result) => {
    console.log('result: ', result);
  })
  .catch((err) => {
    console.log(err);
  })

// arp.getIPAddress('')
// .then((result) => {
//   console.log('result: ', result);
// })
// .catch((err) => {
//   console.log(err);
// })