const { expect, test } = require("@jest/globals");
const eip4361 = require("../index");

test("Can make nonce with no parameters supplied", () => {
  const nonce = eip4361.makeNonce();
  expect(nonce.value).not.toBe(null);
  expect(typeof nonce.value).toBe("string");
  expect(nonce.value.length).toBe(32);
  expect(Object.prototype.toString.call(nonce.issuedAt)).toBe("[object Date]");
  expect(nonce.expirationTime).toBe(null);
  expect(nonce.notBefore).toBe(null);
});

test("Can make nonce with expiration time", () => {
  const nonce = eip4361.makeNonce(300);
  expect(
    (nonce.expirationTime.getTime() - nonce.issuedAt.getTime()) / 1000
  ).toBe(300);
  expect(nonce.notBefore).toBe(null);
});

test("Can make nonce with not before time", () => {
  const nonce = eip4361.makeNonce(300, new Date("2021-01-01T00:00:00.000Z"));
  expect(nonce.notBefore.toISOString()).toBe("2021-01-01T00:00:00.000Z");
});

test("Can produce signing message with minimum of arguments", () => {
  const message = eip4361.produceMessage(
    "fancy.xyz",
    "0x123456789ABCDEF0123456789ABCDEF01234567",
    "I agree to all the terms and services!",
    "https://fancy.xyz/login",
    1,
    {
      value: "aAbBcCdD",
      issuedAt: new Date("2021-10-10T12:34:56.000Z"),
    }
  );
  const expectedMessage = `fancy.xyz wants you to sign in with your Ethereum account:
0x123456789ABCDEF0123456789ABCDEF01234567

I agree to all the terms and services!

URI: https://fancy.xyz/login
Version: 1
Nonce: aAbBcCdD
Issued At: 2021-10-10T12:34:56.000Z`;
  expect(message).toBe(expectedMessage);
});

test("Can produce signing message with minimum of arguments", () => {
  const message = eip4361.produceMessage(
    "fancy.xyz",
    "0x123456789ABCDEF0123456789ABCDEF01234567",
    "I agree to all the terms and services!",
    "https://fancy.xyz/login",
    1,
    {
      value: "aAbBcCdD",
      issuedAt: new Date("2021-10-10T12:34:56.000Z"),
      expirationTime: new Date("2021-10-11T12:34:56.000Z"),
      notBefore: new Date("2021-01-01T00:00:00.000Z"),
    },
    4,
    "AAA-BBB-CCC-DDD",
    ["https://fancy.xyz/tos", "https://fancy.xyz/uap"]
  );
  const expectedMessage = `fancy.xyz wants you to sign in with your Ethereum account:
0x123456789ABCDEF0123456789ABCDEF01234567

I agree to all the terms and services!

URI: https://fancy.xyz/login
Version: 1
Nonce: aAbBcCdD
Issued At: 2021-10-10T12:34:56.000Z
Expiration Time: 2021-10-11T12:34:56.000Z
Not Before: 2021-01-01T00:00:00.000Z
Chain ID: 4
Request ID: AAA-BBB-CCC-DDD
Resources:
- https://fancy.xyz/tos
- https://fancy.xyz/uap`;
  expect(message).toBe(expectedMessage);
});

test("Throws an exception if signature is bad", async () => {
  const signingAddress = "0xc536CF93bD20eec139A3Bb7EaA132a89738F8604";
  const signature = "XXX";
  const nonce = eip4361.makeNonce(3600, new Date("2021-01-01T00:00:00.000Z"));
  try {
    await eip4361.verifySignature(
      signature,
      "fancy.xyz",
      signingAddress,
      "I agree to all the terms and services!",
      "https://fancy.xyz/login",
      1,
      nonce,
      4,
      "AAA-BBB-CCC-DDD",
      ["https://fancy.xyz/tos", "https://fancy.xyz/uap"]
    );
  } catch (error) {
    expect(error instanceof eip4361.InvalidSignatureError).toBeTruthy();
  }
});

test("Throws an exception if nonce is expired", async () => {
  const signingAddress = "0xc536CF93bD20eec139A3Bb7EaA132a89738F8604";
  const signature = "XXX";
  const nonce = eip4361.makeNonce(-3600);
  try {
    await eip4361.verifySignature(
      signature,
      "fancy.xyz",
      signingAddress,
      "I agree to all the terms and services!",
      "https://fancy.xyz/login",
      1,
      nonce,
      4,
      "AAA-BBB-CCC-DDD",
      ["https://fancy.xyz/tos", "https://fancy.xyz/uap"]
    );
  } catch (error) {
    expect(error instanceof eip4361.InvalidNonceError).toBeTruthy();
  }
});

test("Throws an exception if nonce is not valid yet", async () => {
  const signingAddress = "0xc536CF93bD20eec139A3Bb7EaA132a89738F8604";
  const signature = "XXX";
  const notBefore = new Date();
  notBefore.setUTCSeconds(notBefore.getUTCSeconds() + 3600);
  const nonce = eip4361.makeNonce(3600, notBefore);
  try {
    await eip4361.verifySignature(
      signature,
      "fancy.xyz",
      signingAddress,
      "I agree to all the terms and services!",
      "https://fancy.xyz/login",
      1,
      nonce,
      4,
      "AAA-BBB-CCC-DDD",
      ["https://fancy.xyz/tos", "https://fancy.xyz/uap"]
    );
  } catch (error) {
    expect(error instanceof eip4361.InvalidNonceError).toBeTruthy();
  }
});

test("Should not throw an exception if signature is good", async () => {
  const signingAddress = "0xc536CF93bD20eec139A3Bb7EaA132a89738F8604";
  const signature =
    "0x3791bc2ccdfc772919dc315d91aac0eccbc26d20b5b470f71b9285b65a0376237acfa2658cabaa0fe76100cc7e816cbdee5f5b24bdc7e67c2f8897b18008cf201b";
  const nonce = {
    value: "b852b5f0a966f184bbaf1b874efc09e8",
    issuedAt: new Date("2021-11-09T20:32:08.132Z"),
  };
  await eip4361.verifySignature(
    signature,
    "fancy.xyz",
    signingAddress,
    "I agree to all the terms and services!",
    "https://fancy.xyz/login",
    1,
    nonce,
    4,
    "AAA-BBB-CCC-DDD",
    ["https://fancy.xyz/tos", "https://fancy.xyz/uap"]
  );
});
