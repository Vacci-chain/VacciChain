use soroban_sdk::{contracttype, Address, Bytes, String, BytesN, Env, xdr::ToXdr};

/// Hash an address to a 32-byte key using SHA-256.
///
/// This helper is useful for storage key derivation and indexing.
pub fn hash_address(env: &Env, address: &Address) -> BytesN<32> {
    env.crypto().sha256(&address.to_xdr(env)).into()
}

/// Compute a deterministic token ID for a vaccination record.
///
/// The token ID is derived from the patient wallet, vaccine name, date,
/// issuer, and ledger sequence. The first 8 bytes of the SHA-256 digest are
/// interpreted as a big-endian `u64`.
///
/// # Arguments
/// * `env` - The Soroban environment.
/// * `patient` - The patient wallet address.
/// * `vaccine_name` - The vaccine name string.
/// * `date_administered` - The administration date string.
/// * `issuer` - The issuer wallet address.
/// * `ledger_sequence` - The current ledger sequence number.
///
/// # Returns
/// * `u64` deterministic token ID.
pub fn compute_token_id(
    env: &Env,
    patient: &Address,
    vaccine_name: &String,
    date_administered: &String,
    issuer: &Address,
    ledger_sequence: u32,
) -> u64 {
    let mut preimage = Bytes::new(env);

    // patient address (XDR-encoded)
    preimage.append(&patient.to_xdr(env));

    // vaccine_name (XDR-encoded soroban String)
    preimage.append(&vaccine_name.clone().to_xdr(env));

    // date_administered (XDR-encoded soroban String)
    preimage.append(&date_administered.clone().to_xdr(env));

    // issuer address (XDR-encoded)
    preimage.append(&issuer.to_xdr(env));

    // ledger_sequence as big-endian 4 bytes
    let seq_bytes = [
        ((ledger_sequence >> 24) & 0xff) as u8,
        ((ledger_sequence >> 16) & 0xff) as u8,
        ((ledger_sequence >> 8) & 0xff) as u8,
        (ledger_sequence & 0xff) as u8,
    ];
    let mut seq_buf = Bytes::new(env);
    for b in seq_bytes {
        seq_buf.push_back(b);
    }
    preimage.append(&seq_buf);

    let digest: BytesN<32> = env.crypto().sha256(&preimage).into();

    // Take first 8 bytes as big-endian u64
    let b0 = digest.get(0).unwrap() as u64;
    let b1 = digest.get(1).unwrap() as u64;
    let b2 = digest.get(2).unwrap() as u64;
    let b3 = digest.get(3).unwrap() as u64;
    let b4 = digest.get(4).unwrap() as u64;
    let b5 = digest.get(5).unwrap() as u64;
    let b6 = digest.get(6).unwrap() as u64;
    let b7 = digest.get(7).unwrap() as u64;

    (b0 << 56) | (b1 << 48) | (b2 << 40) | (b3 << 32)
        | (b4 << 24) | (b5 << 16) | (b6 << 8) | b7
}


#[contracttype]
#[derive(Clone)]
pub struct VaccinationRecord {
    /// Unique token identifier for the vaccination record.
    pub token_id: u64,
    /// The patient wallet address owning this record.
    pub patient: Address,
    /// Vaccine name, stored as a Soroban string.
    pub vaccine_name: String,
    /// Date when the vaccine was administered.
    pub date_administered: String,
    /// Issuer address that minted the record.
    pub issuer: Address,
    /// Ledger timestamp at mint time.
    pub timestamp: u64,
    /// Schema version for backwards compatibility.
    pub schema_version: u32,
    /// Revocation flag; true when this record has been revoked.
    pub revoked: bool,
    /// Which dose in the series this record represents (e.g. 1, 2, 3).
    /// `None` indicates a single-dose or legacy record.
    pub dose_number: Option<u32>,
    /// Total doses required for the series (e.g. 3 for a primary series).
    /// `None` indicates a single-dose or legacy record.
    pub dose_series: Option<u32>,
}

#[contracttype]
#[derive(Clone)]
pub struct IssuerRecord {
    /// Human-friendly issuer name.
    pub name: String,
    /// Issuer license or registration identifier.
    pub license: String,
    /// Issuer country of operation.
    pub country: String,
    /// Authorization status for minting vaccination records.
    pub authorized: bool,
}

#[contracttype]
pub enum DataKey {
    /// Stored admin address.
    Admin,
    /// Initialization marker for the contract.
    Initialized,
    /// Pending admin address during admin transfer.
    PendingAdmin,
    /// Expiry for delayed admin transfer operations.
    AdminTransferExpiry,
    /// Authorized issuer record keyed by issuer address.
    Issuer(Address),
    /// Hashed issuer metadata index.
    IssuerMeta(BytesN<32>),
    /// List of authorized issuers.
    IssuerList,
    /// Token IDs owned by a patient wallet.
    PatientTokens(Address),
    /// Patient allowlist flag for self-registration.
    PatientAllowlist(Address),
    /// Configurable per-patient record limit.
    PatientRecordLimit,
    /// Stored vaccination record by token ID.
    Token(u64),
    /// Revocation marker for a token ID.
    Revoked(u64),
    /// Legacy next token ID counter (not required for deterministic token IDs).
    NextTokenId,
    /// Paused contract flag.
    Paused,
}
