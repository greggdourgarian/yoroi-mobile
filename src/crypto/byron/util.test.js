// @flow
import jestSetup from '../../jestSetup'

import {
  getMasterKeyFromMnemonic,
  getAccountFromMasterKey,
  getExternalAddresses,
  getAddressInHex,
  isValidAddress,
  encryptData,
  decryptData,
  signTransaction,
} from './util'

import {InsufficientFunds} from '../errors'

import longAddress from './__fixtures/long_address.json'

import {CONFIG} from '../../config/config'

jestSetup.setup()

const mnemonic = [
  'dry balcony arctic what garbage sort',
  'cart shine egg lamp manual bottom',
  'slide assault bus',
].join(' ')

const externalAddresses = [
  'Ae2tdPwUPEZKAx4zt8YLTGxrhX9L6R8QPWNeefZsPgwaigWab4mEw1ECUZ7',
  'Ae2tdPwUPEZ8wGxWm9VbZXFJcgLeKQJWKqREVEtHXYdqsqc4bLeGqjSwrtu',
]

// getExternalAddresses
test('Can generate external addresses', async () => {
  expect.assertions(1)

  const masterKey = await getMasterKeyFromMnemonic(mnemonic)
  const account = await getAccountFromMasterKey(
    masterKey,
    CONFIG.NUMBERS.ACCOUNT_INDEX,
    CONFIG.NETWORKS.BYRON_MAINNET.PROTOCOL_MAGIC,
  )
  const addresses = await getExternalAddresses(
    account,
    [0, 1],
    CONFIG.NETWORKS.BYRON_MAINNET.PROTOCOL_MAGIC,
  )

  expect(addresses).toEqual(externalAddresses)
})

// getAddressInHex
test('Can convert address to hex', () => {
  const address = externalAddresses[0]
  // prettier-ignore
  // eslint-disable-next-line max-len
  const hex = '82d818582183581ce0256c34965ce528570c22f88073e625020288a1973c1e2d466d39bca0001ab7e3a79a'
  expect(getAddressInHex(address)).toEqual(hex)
})

test('Throws error when converting bad address', () => {
  expect(() => getAddressInHex('&*')).toThrow()
})

// isValidAddress
test('Can validate valid addresses', async () => {
  expect.assertions(externalAddresses.length)
  for (const address of externalAddresses) {
    const isValid = await isValidAddress(address)
    expect(isValid).toBe(true)
  }
})

// isValidAddress
test('Can validate long address', async () => {
  expect.assertions(1)
  const isValid = await isValidAddress(longAddress)
  expect(isValid).toBe(true)
})

test('Can validate invalid addresses', async () => {
  const addresses = [
    // should be invalid
    'Ae2tdPwUPEZKAx4zt8YLTGxrhX9L6R8QPWNeefZsPgwaigWab4mEw1ECUZ6',
    'Ae2tdPwUPEZKAx4zt8YLTGxrhX9L6R8QPWNeefZsPgwaigWab4mEw1ECUZ', // too short
    'Ae2tdPwUPEZKAx4zt8YLTGxrhX9L6R8QPWNeefZsPgwaigWab4mEw1ECUZ77', // too long
    '',
    'bad',
    'badChars&*/',
    '1234',
  ]
  expect.assertions(addresses.length)
  for (const address of addresses) {
    const isValid = await isValidAddress(address)
    expect(isValid).toBe(false)
  }
})

describe('encryption/decryption', () => {
  it('Can encrypt / decrypt masterKey', async () => {
    expect.assertions(1)
    const masterKey = await getMasterKeyFromMnemonic(mnemonic)
    const encryptedKey = await encryptData(masterKey, 'password')
    const decryptedKey = await decryptData(encryptedKey, 'password')
    expect(masterKey).toEqual(decryptedKey)
  })

  it('Can decrypt data encrypted with rust v2 library', async () => {
    expect.assertions(1)

    // the following ciphertext has been generated by encrypting the utf8 string
    // "masterkey" with this rust function:
    // https://github.com/input-output-hk/js-cardano-wasm/blob/master/
    // cardano-wallet/src/lib.rs#L1434
    // and the following salt, nonce and password
    let ciphertextHex = ''
    const salt =
      '50515253c0c1c2c3c4c5c6c750515253c0c1c2c3c4c5c6c750515253c0c1c2c3'
    const nonce = '50515253c0c1c2c3c4c5c6c7'
    const payload = '308f9977d04e7f3a45abd148905c628e2bb2621360a585f352'
    const password = 'password'
    ciphertextHex = ciphertextHex.concat(salt, nonce, payload)

    const decryptedHex = await decryptData(ciphertextHex, password)
    expect(Buffer.from(decryptedHex, 'hex').toString('utf8')).toBe('masterkey')
  })
})

test('Make sure that we are using safe buffers', () => {
  // in response to https://github.com/nodejs/node/issues/4660
  expect(new Buffer(10).toString('hex')).toBe('00000000000000000000')
})

describe('signTransaction', () => {
  const wallet = require('./__fixtures/fake_wallet.json')
  const inputs = require('./__fixtures/transaction_inputs.json')
  const outputAddress =
    'Ae2tdPwUPEZAghGCdQykbGxc991wdoA8bXmSn7eCGuUKXF4EsRhWj4PJitn'
  const change = 'Ae2tdPwUPEZJcamJUVWxJEwR8rj5x74t3FkUFDzKEdoL8YSyeRdwmJCW9c3'

  it('can sign small amount', async () => {
    expect.assertions(1)

    const outputs = [
      {
        address: outputAddress,
        value: '100',
      },
    ]

    const tx = await signTransaction(wallet, inputs, outputs, change)
    expect(tx).not.toBeNull()
  })

  it('can sign large amount', async () => {
    expect.assertions(1)

    const outputs = [
      {
        address: outputAddress,
        value: '15097900',
      },
    ]

    const tx = await signTransaction(wallet, inputs, outputs, change)
    expect(tx).not.toBeNull()
  })

  it('can sign even larger amount', async () => {
    expect.assertions(1)
    const outputs = [
      {
        address: outputAddress,
        value: '15098915',
      },
    ]

    const tx = await signTransaction(wallet, inputs, outputs, change)
    expect(tx).not.toBeNull()
  })

  it('throws InsuffiecientFunds', async () => {
    expect.assertions(1)
    const outputs = [
      {
        address: outputAddress,
        value: '25000000',
      },
    ]

    const promise = signTransaction(wallet, inputs, outputs, change)
    await expect(promise).rejects.toBeInstanceOf(InsufficientFunds)
  })

  it('can handle rust bug', async () => {
    expect.assertions(1)

    const outputs = [
      {
        address: outputAddress,
        value: '15096900',
      },
    ]

    const promise = signTransaction(wallet, inputs, outputs, change)
    await expect(promise).not.toBeNull()
  })

  it('can handle big amounts', async () => {
    expect.assertions(1)
    const outputs = [
      {
        address: outputAddress,
        value: '11111111111111000000',
      },
    ]

    const promise = signTransaction(wallet, inputs, outputs, change)
    await expect(promise).rejects.toBeInstanceOf(InsufficientFunds)
  })

  it('can handle insanely huge amounts', async () => {
    expect.assertions(1)
    const outputs = [
      {
        address: outputAddress,
        value: '1234567891234567890123456789000000',
      },
    ]

    const promise = signTransaction(wallet, inputs, outputs, change)
    await expect(promise).rejects.toBeInstanceOf(InsufficientFunds)
  })

  it('can handle multiple big amounts', async () => {
    expect.assertions(1)
    const outputs = [
      {
        address: outputAddress,
        value: '44000000000000000',
      },
      {
        address: outputAddress,
        value: '44000000000000000',
      },
    ]

    const promise = signTransaction(wallet, inputs, outputs, change)
    await expect(promise).rejects.toBeInstanceOf(InsufficientFunds)
  })

  // Note(ppershing): This is a known bug in rust-cardano implementation
  // and we can do nothing with it
  // Let's hope this test fails (with correct behavior) in the future
  it('can compute correct fee', async () => {
    expect.assertions(1)
    const inputs = [
      {
        ptr: {
          id:
            '0cd1ec4dce33c7872c3e090c88e9af2fc56c4d7fba6745d15d4fce5e1d4620ba',
          index: 0,
        },
        value: {
          address:
            'Ae2tdPwUPEYxoQwHKy1BEiuFLBtHEAtertUUijFeZMFg9NeaW6N1nWbb7T9',
          value: '5000000',
        },
        addressing: {account: 0, change: 0, index: 0},
      },
    ]

    const outputs = [
      {
        address: outputAddress,
        value: '4832139',
      },
    ]

    const result = await signTransaction(wallet, inputs, outputs, change)
    const fee = result.fee.toNumber()
    // Note(ppershing): When building the transaction
    // the best solution is to have 2 outputs:
    // 1) output address with 4832139 uADA (micro ADA)
    // 2) change address with 23 uADA
    // This leads to tx with 283 bytes requiring *minimum* fee of 167818.
    // Note that such Tx will have bigger fee because we failed to include
    // additional 20 uADA. This is a consequence of fact that CBOR encoding of
    // value >=24 is one byte longer than 23. Thus we would require additional
    // 43 uADA in fees
    const BAD_FEE = 167818
    expect(fee).toEqual(BAD_FEE)

    // This is minimum feasible fee for the transaction
    // const GOOD_FEE = 167838
    // expect(fee).toBeGreaterThanOrEqual(GOOD_FEE)
  })
})
