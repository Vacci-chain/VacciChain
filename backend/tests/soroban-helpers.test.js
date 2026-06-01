/**
 * Tests for Soroban error classes and helper function signatures
 */
const {
  SorobanError,
  SorobanTransactionError,
  SorobanSimulationError,
  SorobanRpcError,
} = require('../src/stellar/soroban');

describe('Soroban Error Classes', () => {
  describe('SorobanError', () => {
    it('is an Error subclass with proper name', () => {
      const original = new Error('original error');
      const error = new SorobanError('test message', original);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('SorobanError');
      expect(error.message).toBe('test message');
      expect(error.original).toBe(original);
    });

    it('can be thrown and caught', () => {
      const error = new SorobanError('test', null);
      
      expect(() => {
        throw error;
      }).toThrow(SorobanError);
    });
  });

  describe('SorobanRpcError', () => {
    it('is subclass of SorobanError', () => {
      const error = new SorobanRpcError('RPC failed', new Error('network'));
      
      expect(error).toBeInstanceOf(SorobanError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('SorobanRpcError');
      expect(error.message).toBe('RPC failed');
    });
  });

  describe('SorobanTransactionError', () => {
    it('is subclass of SorobanError', () => {
      const error = new SorobanTransactionError('TX failed', new Error('gas'));
      
      expect(error).toBeInstanceOf(SorobanError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('SorobanTransactionError');
      expect(error.message).toBe('TX failed');
    });

    it('preserves original error', () => {
      const originalError = new Error('insufficient fee');
      const error = new SorobanTransactionError('Mint failed', originalError);
      
      expect(error.original).toBe(originalError);
      expect(error.original.message).toBe('insufficient fee');
    });
  });

  describe('SorobanSimulationError', () => {
    it('is subclass of SorobanError', () => {
      const error = new SorobanSimulationError('Simulation failed', new Error('contract'));
      
      expect(error).toBeInstanceOf(SorobanError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('SorobanSimulationError');
      expect(error.message).toBe('Simulation failed');
    });

    it('can be caught as SorobanError', () => {
      const error = new SorobanSimulationError('Verify failed', null);
      
      expect(() => {
        throw error;
      }).toThrow(SorobanError);
    });
  });

  describe('Error Hierarchy', () => {
    it('all custom errors inherit from Error', () => {
      const errors = [
        new SorobanError('e1', null),
        new SorobanRpcError('e2', null),
        new SorobanTransactionError('e3', null),
        new SorobanSimulationError('e4', null),
      ];

      errors.forEach((err) => {
        expect(err).toBeInstanceOf(Error);
      });
    });

    it('typed errors can be distinguished', () => {
      const rpc = new SorobanRpcError('rpc', null);
      const tx = new SorobanTransactionError('tx', null);
      const sim = new SorobanSimulationError('sim', null);

      expect(rpc.name).toBe('SorobanRpcError');
      expect(tx.name).toBe('SorobanTransactionError');
      expect(sim.name).toBe('SorobanSimulationError');
    });
  });

  describe('Typed error catching', () => {
    it('instanceof checks work for error filtering', () => {
      const errors = [
        new SorobanTransactionError('tx error', null),
        new SorobanSimulationError('sim error', null),
        new Error('generic error'),
      ];

      const txErrors = errors.filter((e) => e instanceof SorobanTransactionError);
      const simErrors = errors.filter((e) => e instanceof SorobanSimulationError);
      const sorobanErrors = errors.filter((e) => e instanceof SorobanError);

      expect(txErrors).toHaveLength(1);
      expect(simErrors).toHaveLength(1);
      expect(sorobanErrors).toHaveLength(2);
    });
  });
});
