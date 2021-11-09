const ethers = require('ethers');

exports.produceEIP4361Message = function (domain, address, statement, uri, version, nonce, issuedAt, expirationTime, notBefore, chainId, resources) {
  let message = `${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${uri}
Version: ${version}
Nonce: ${nonce}
Issued At: ${issuedAt}`;

  if (expirationTime) {
    message = message + `\nExpiration Time: ${expirationTime}`;
  }
  if (notBefore) {
    message = message + `\nNot Before: ${notBefore}`;
  }
  if (chainId) {
    message = message + `\nChain ID: ${chainId}`;
  }
  if (resources) {
    message = message + `\nResources:`;
    resources.forEach((resource) => {
      message = message + `\n- ${resource}`;
    });
  }
  return message;
}

exports.makeNonce = function(expirationTTLSeconds) {
  const issuedAt = new Date();
  const expirationTime = new Date(issuedAt.getTime());
  expirationTime.setUTCSeconds(expirationTime.getUTCSeconds + expirationTime);
  const value = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return {
    value,
    issuedAt,
    expirationTime,
    notBefore: issuedAt,
  }
}

exports.verifyNonce = function(nonce) {
  const currentTime = new Date();
  if (nonce.expirationTime < currentTime) {
    throw new Error(`Nonce is expired: ${expirationDate} < ${currentTime}`);
  }
  if (nonce.notBefore > currentTime) {
    throw new Error(`Nonce is not valid yet: ${notBeforeDate} > ${currentTime}`);
  }
  return true;
}

exports.verifySignature = async function(address, chainId, signature, nonce) {
  verifyNonce(nonce);
  const eip4361Message = produceMessage(address, chainId, nonce);
  let whoSigned;
  try {
    whoSigned = await ethers.utils.verifyMessage(eip4361Message, signature);
  } catch(error) {
    console.error(error);
    throw new Error("Signature is bad.")
  }
  console.log("Message was signed by", whoSigned);
  if (address.toLowerCase() === whoSigned.toLowerCase()) {
    return true;
  }
  return false;
}

exports.produceMessage = function(address, chainId, nonce, domain, terms, uri, version) {
  return produceEIP4361Message(
      domain,
      address,
      terms,
      uri,
      version,
      nonce.value,
      nonce.issuedAt.toISOString(),
      nonce.expirationTime.toISOString(),
      nonce.notBefore.toISOString(),
      chainId
  )
}
