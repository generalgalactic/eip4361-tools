const eip4361 = require('../index.js');

test('Can make nonce', () => {
  const nonce = eip4361.makeNonce();
  console.log(nonce);
});