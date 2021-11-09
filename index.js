const ethers = require("ethers");
const crypto = require("crypto");

/**
 * @typedef Nonce
 * @property {string} value
 * @property {Date} issuedAt
 * @property {Date|null} expirationTime
 * @property {data|null} notBefore
 */

/**
 * An error indicating the supplied nonce was invalid.
 */
class InvalidNonceError extends Error {}

/**
 * An error indicating the signature was invalid.
 */
class InvalidSignatureError extends Error {}

/**
 * Produce the EIP4361 Message for Wallet to Sign
 *
 * @param {string} domain - The domain making the request
 * @param {string} address - The address that should sign the request.
 * @param {string} statement - A statement for the user to agree to.
 * @param {string} uri - The URI making the request.
 * @param {number} version - The version making the request.
 * @param {Nonce} nonce - The nonce for this request.
 * @param {Number|null} [chainId=null] - The chain ID for this request.
 * @param {string|null} [requestId=null] - The request ID associated with this request.
 * @param {string[]} [resources=[]] - An array of URIs for resources associated with the request.
 * @returns {string} - The message that the client should ask the wallet to sign with `personal_sign`.
 */
function produceMessage(
  domain,
  address,
  statement,
  uri,
  version,
  nonce,
  chainId,
  requestId,
  resources = []
) {
  let message = `${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${uri}
Version: ${version}
Nonce: ${nonce.value}
Issued At: ${nonce.issuedAt.toISOString()}`;

  if (nonce.expirationTime) {
    message += `\nExpiration Time: ${nonce.expirationTime.toISOString()}`;
  }
  if (nonce.notBefore) {
    message += `\nNot Before: ${nonce.notBefore.toISOString()}`;
  }
  if (chainId) {
    message += `\nChain ID: ${chainId}`;
  }
  if (requestId) {
    message += `\nRequest ID: ${requestId}`;
  }
  if (resources && resources.length) {
    message += "\nResources:";
    resources.forEach((resource) => {
      message += `\n- ${resource}`;
    });
  }
  return message;
}

/**
 * Create a new nonce.
 *
 * @param {number|null} [expirationTTLSeconds] - Number of seconds the nonce should be valid for.
 * @param {Data|null} [notBefore] - The date, before which, the request should not be valid.
 * @returns {Nonce} - The requested nonce.
 */
function makeNonce(expirationTTLSeconds = null, notBefore = null) {
  const issuedAt = new Date();
  let expirationTime = null;
  if (expirationTTLSeconds) {
    expirationTime = new Date(issuedAt.getTime());
    expirationTime.setUTCSeconds(
      expirationTime.getUTCSeconds() + expirationTTLSeconds
    );
  }
  const value = crypto.randomBytes(16).toString("hex");
  return {
    value,
    issuedAt,
    expirationTime,
    notBefore,
  };
}

/**
 * Verify a nonce.
 *
 * @param {Nonce} nonce - The nonce to verify
 * @throws {InvalidNonceError} - If the nonce is invalid for any reason.
 */
function verifyNonce(nonce) {
  const currentTime = new Date();
  if (nonce.expirationTime && nonce.expirationTime < currentTime) {
    throw new InvalidNonceError(
      `Nonce is expired: ${nonce.expirationTime.toISOString()} < ${currentTime.toISOString()}`
    );
  }
  if (nonce.notBefore && nonce.notBefore > currentTime) {
    throw new InvalidNonceError(
      `Nonce is not valid yet: ${nonce.notBefore.toISOString()} > ${currentTime.toISOString()}`
    );
  }
}

/**
 * Verifies that a signature was signed by an account.
 *
 * @param {string} domain - The domain that made the request.
 * @param {string} address - The address that should have signed the message.
 * @param {string} statement - The statement used in the request.
 * @param {string} uri - The URI that made the request.
 * @param {Number} version - The version of the request.
 * @param {Nonce} nonce - The nonce that was included in the request.
 * @param {Number} chainId - The chain ID that was used in the request.
 * @param {string[]} resources - The same array of resource URIs included in the request.
 * @throws {InvalidNonceError} - If the supplied nonce was invalid.
 * @throws {InvalidSignatureError} - If the supplied signature was invalid.
 */
async function verifySignature(
  signature,
  domain,
  address,
  statement,
  uri,
  version,
  nonce,
  chainId,
  requestId,
  resources = []
) {
  verifyNonce(nonce);
  const eip4361Message = produceMessage(
    domain,
    address,
    statement,
    uri,
    version,
    nonce,
    chainId,
    requestId,
    resources
  );
  let whoSigned;
  try {
    whoSigned = await ethers.utils.verifyMessage(eip4361Message, signature);
  } catch (error) {
    throw new InvalidSignatureError("Signature is bad.");
  }
  if (address.toLowerCase() !== whoSigned.toLowerCase()) {
    throw new InvalidSignatureError("Signature is signed by other account.");
  }
}

exports.verifySignature = verifySignature;
exports.produceMessage = produceMessage;
exports.makeNonce = makeNonce;
exports.InvalidNonceError = InvalidNonceError;
exports.InvalidSignatureError = InvalidSignatureError;
