# eip4361-tools

![Workflow pasing status](https://github.com/generalgalactic/eip4361-tools/actions/workflows/ci.yml/badge.svg)

A set of tools for working with Sign-In With Ethereum (EIP4361).

- See: https://github.com/ethereum/EIPs/pull/4361/files
- See: https://ethereum-magicians.org/t/eip-4361-sign-in-with-ethereum/7263

## Functions

### `eip4361.makeNonce(expirationTTLSeconds = null, notBefore = null)`

Produces a `Nonce` object. If no parameters are specified will produce a `Nonce` with only `value` and `issuedAt` properties.

Optionally, caller can specify `expirationTTLSeconds` to set an `expirationTime` property. May also specify a `notBefore` `Date` object to set the corresponding property.

If either of these two properties are set when verifying, they will be checked for validity.

If operating in a secure context, suggest storing this object and only exposing the `value` to the insecure client. Pass the `value` back to the secure context which can validate the nonce hasn't already been used before attempting to verify the signature.

### `eip4361.produceMessage(domain, address, statement, uri, version, nonce, chainId = null, requestId= null, resources = [])`

Produces an EIP4361 compliant message for a wallet to sign.

- `nonce.expirationTime`, `nonce.notBefore`, `chainId`, `requestID`, and `resources` are all optional.

Request the connected wallet to `personal_sign` (EIP-191) this message and capture the signature.

- See: https://eips.ethereum.org/EIPS/eip-191
- See: https://geth.ethereum.org/docs/rpc/ns-personal#personal_sign
- See: https://docs.ethers.io/v5/api/signer/#Signer-signMessage
- See: https://web3js.readthedocs.io/en/v1.5.2/web3-eth-personal.html#sign

### `eip4361.verifyMessage(signature, domain, address, statement, uri, version, nonce, chainId = null, requestId = null, resources = [])`

Once a wallet has signed the message, pass it back to `verifyMessage` with all the same parameters you used for `produceMessage` to verify it.

- If the nonce is bad `eip4361.InvalidNonceError` will be thrown.
- If the signature is bad `eip4361.InvalidSignatureError` will be thrown.

---

"It almost certainly works." - Clint