/**
 * Network configuration derived from the VITE_STELLAR_NETWORK environment
 * variable set at build time.  Defaults to 'testnet' when not specified.
 *
 * Usage:
 *   import { STELLAR_NETWORK, isTestnet } from '../config/network';
 */

const STELLAR_NETWORK = (import.meta.env.VITE_STELLAR_NETWORK || 'testnet').toLowerCase();

const isTestnet = STELLAR_NETWORK === 'testnet';
const isMainnet = STELLAR_NETWORK === 'mainnet';

/**
 * Freighter expects the network name in UPPER CASE ('TESTNET' | 'PUBLIC').
 * Mainnet is called 'PUBLIC' in the Freighter/Stellar SDK.
 */
const freighterNetwork = isMainnet ? 'PUBLIC' : 'TESTNET';

export { STELLAR_NETWORK, isTestnet, isMainnet, freighterNetwork };
