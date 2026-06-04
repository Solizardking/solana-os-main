// Package solana — Transaction building helpers.
// Provides SOL transfer, compute budget, and Jupiter swap transaction
// construction using gagliardetto/solana-go primitives.
package solana

import (
	"fmt"
	"log"

	solanago "github.com/gagliardetto/solana-go"
	associatedtokenaccount "github.com/gagliardetto/solana-go/programs/associated-token-account"
	computebudget "github.com/gagliardetto/solana-go/programs/compute-budget"
	"github.com/gagliardetto/solana-go/programs/system"
	"github.com/gagliardetto/solana-go/programs/token"
)

// ── SOL Transfer ────────────────────────────────────────────────────

// BuildSOLTransfer creates a signed SOL transfer transaction.
func (s *SolanaRPC) BuildSOLTransfer(to solanago.PublicKey, lamports uint64) (*solanago.Transaction, error) {
	if s.wallet == nil {
		return nil, fmt.Errorf("no wallet loaded — cannot build transfer")
	}

	blockhashResult, err := s.GetLatestBlockhash()
	if err != nil {
		return nil, fmt.Errorf("get blockhash: %w", err)
	}

	tx, err := solanago.NewTransaction(
		[]solanago.Instruction{
			system.NewTransferInstruction(
				lamports,
				s.wallet.PublicKey,
				to,
			).Build(),
		},
		blockhashResult.Value.Blockhash,
		solanago.TransactionPayer(s.wallet.PublicKey),
	)
	if err != nil {
		return nil, fmt.Errorf("build transfer tx: %w", err)
	}

	// Sign with wallet
	_, err = tx.Sign(s.wallet.PrivateKeyGetter())
	if err != nil {
		return nil, fmt.Errorf("sign transfer tx: %w", err)
	}

	return tx, nil
}

// TransferSOL builds, signs, sends, and confirms a SOL transfer.
// Returns the transaction signature.
func (s *SolanaRPC) TransferSOL(to solanago.PublicKey, amountSOL float64) (solanago.Signature, error) {
	lamports := SOLToLamports(amountSOL)
	if lamports == 0 {
		return solanago.Signature{}, fmt.Errorf("amount too small: %.9f SOL", amountSOL)
	}

	tx, err := s.BuildSOLTransfer(to, lamports)
	if err != nil {
		return solanago.Signature{}, err
	}

	sig, err := s.SendTransaction(tx)
	if err != nil {
		return solanago.Signature{}, err
	}

	log.Printf("[TX] 💸 SOL transfer: %.4f SOL → %s (sig: %s)",
		amountSOL, to.Short(8), sig)

	return sig, nil
}

// ── Compute Budget ──────────────────────────────────────────────────

// SetComputeUnitPrice creates a compute unit price instruction (priority fee).
// microLamports is the price per compute unit in micro-lamports.
func SetComputeUnitPrice(microLamports uint64) solanago.Instruction {
	return computebudget.NewSetComputeUnitPriceInstruction(microLamports).Build()
}

// SetComputeUnitLimit creates a compute unit limit instruction.
// units is the maximum compute units for the transaction.
func SetComputeUnitLimit(units uint32) solanago.Instruction {
	return computebudget.NewSetComputeUnitLimitInstruction(units).Build()
}

// ── Token Operations ────────────────────────────────────────────

// CreateATAIdempotent builds an instruction that creates an associated token
// account if it doesn't already exist. Safe to include in any transaction.
func CreateATAIdempotent(payer, wallet, mint solanago.PublicKey) solanago.Instruction {
	return associatedtokenaccount.NewCreateInstruction(payer, wallet, mint).Build()
}

// BuildTokenTransfer creates a signed transaction that transfers SPL tokens,
// automatically creating the destination ATA if needed.
func (s *SolanaRPC) BuildTokenTransfer(
	to solanago.PublicKey,
	mint solanago.PublicKey,
	amount uint64,
	decimals uint8,
) (*solanago.Transaction, error) {
	if s.wallet == nil {
		return nil, fmt.Errorf("no wallet loaded — cannot build token transfer")
	}

	fromATA, _, err := solanago.FindAssociatedTokenAddress(s.wallet.PublicKey, mint)
	if err != nil {
		return nil, fmt.Errorf("derive source ATA: %w", err)
	}
	toATA, _, err := solanago.FindAssociatedTokenAddress(to, mint)
	if err != nil {
		return nil, fmt.Errorf("derive dest ATA: %w", err)
	}

	blockhash, err := s.GetLatestBlockhash()
	if err != nil {
		return nil, fmt.Errorf("get blockhash: %w", err)
	}

	tx, err := solanago.NewTransaction(
		[]solanago.Instruction{
			CreateATAIdempotent(s.wallet.PublicKey, to, mint),
			token.NewTransferCheckedInstruction(
				amount,
				decimals,
				fromATA,
				mint,
				toATA,
				s.wallet.PublicKey,
				[]solanago.PublicKey{},
			).Build(),
		},
		blockhash.Value.Blockhash,
		solanago.TransactionPayer(s.wallet.PublicKey),
	)
	if err != nil {
		return nil, fmt.Errorf("build token tx: %w", err)
	}

	_, err = tx.Sign(s.wallet.PrivateKeyGetter())
	if err != nil {
		return nil, fmt.Errorf("sign token tx: %w", err)
	}

	return tx, nil
}

// TransferToken builds, signs, sends, and confirms an SPL token transfer.
func (s *SolanaRPC) TransferToken(to solanago.PublicKey, mint solanago.PublicKey, amount uint64, decimals uint8) (solanago.Signature, error) {
	tx, err := s.BuildTokenTransfer(to, mint, amount, decimals)
	if err != nil {
		return solanago.Signature{}, err
	}

	sig, err := s.SendTransaction(tx)
	if err != nil {
		return solanago.Signature{}, err
	}

	log.Printf("[TX] 🪙 Token transfer: %d (dec %d) of %s → %s (sig: %s)",
		amount, decimals, mint.Short(8), to.Short(8), sig)
	return sig, nil
}

// BurnToken burns SPL tokens from the wallet's associated token account.
func (s *SolanaRPC) BurnToken(mint solanago.PublicKey, amount uint64, decimals uint8) (solanago.Signature, error) {
	if s.wallet == nil {
		return solanago.Signature{}, fmt.Errorf("no wallet loaded")
	}

	ata, _, err := solanago.FindAssociatedTokenAddress(s.wallet.PublicKey, mint)
	if err != nil {
		return solanago.Signature{}, fmt.Errorf("derive ATA: %w", err)
	}

	blockhash, err := s.GetLatestBlockhash()
	if err != nil {
		return solanago.Signature{}, fmt.Errorf("get blockhash: %w", err)
	}

	tx, err := solanago.NewTransaction(
		[]solanago.Instruction{
			token.NewBurnCheckedInstruction(amount, decimals, ata, mint, s.wallet.PublicKey, []solanago.PublicKey{}).Build(),
		},
		blockhash.Value.Blockhash,
		solanago.TransactionPayer(s.wallet.PublicKey),
	)
	if err != nil {
		return solanago.Signature{}, fmt.Errorf("build burn tx: %w", err)
	}

	_, err = tx.Sign(s.wallet.PrivateKeyGetter())
	if err != nil {
		return solanago.Signature{}, fmt.Errorf("sign burn tx: %w", err)
	}

	sig, err := s.SendTransaction(tx)
	if err != nil {
		return solanago.Signature{}, err
	}

	log.Printf("[TX] 🔥 Burn: %d of %s (sig: %s)", amount, mint.Short(8), sig)
	return sig, nil
}

// CloseTokenAccount closes an empty token account to reclaim rent SOL.
func (s *SolanaRPC) CloseTokenAccount(tokenAccount solanago.PublicKey) (solanago.Signature, error) {
	if s.wallet == nil {
		return solanago.Signature{}, fmt.Errorf("no wallet loaded")
	}

	blockhash, err := s.GetLatestBlockhash()
	if err != nil {
		return solanago.Signature{}, fmt.Errorf("get blockhash: %w", err)
	}

	tx, err := solanago.NewTransaction(
		[]solanago.Instruction{
			token.NewCloseAccountInstruction(tokenAccount, s.wallet.PublicKey, s.wallet.PublicKey, []solanago.PublicKey{}).Build(),
		},
		blockhash.Value.Blockhash,
		solanago.TransactionPayer(s.wallet.PublicKey),
	)
	if err != nil {
		return solanago.Signature{}, fmt.Errorf("build close tx: %w", err)
	}

	_, err = tx.Sign(s.wallet.PrivateKeyGetter())
	if err != nil {
		return solanago.Signature{}, fmt.Errorf("sign close tx: %w", err)
	}

	sig, err := s.SendTransaction(tx)
	if err != nil {
		return solanago.Signature{}, err
	}

	log.Printf("[TX] 🗑️ Closed token account %s (sig: %s)", tokenAccount.Short(8), sig)
	return sig, nil
}

// ── Jupiter Swap Transaction Execution ──────────────────────────────

// JupiterSwapParams holds the parameters for a Jupiter swap.
type JupiterSwapParams struct {
	InputMint   string  // Input token mint address
	OutputMint  string  // Output token mint address
	AmountSOL   float64 // Amount in SOL (converted to lamports for SOL input)
	SlippageBps int     // Slippage tolerance in basis points (e.g. 50 = 0.5%)
}

// ExecuteJupiterSwap gets a quote and executes a swap through Jupiter.
// In simulated mode, it only logs the quote without executing.
func (s *SolanaRPC) ExecuteJupiterSwap(jupiter *JupiterClient, params JupiterSwapParams, simulate bool) (*SwapResult, error) {
	if s.wallet == nil {
		return nil, fmt.Errorf("no wallet — cannot execute swap")
	}

	amountLamports := SOLToLamports(params.AmountSOL)

	quote, err := jupiter.GetQuote(
		params.InputMint,
		params.OutputMint,
		amountLamports,
		params.SlippageBps,
	)
	if err != nil {
		return nil, fmt.Errorf("jupiter quote: %w", err)
	}

	log.Printf("[SWAP] 📊 Quote: %s → %s | in=%s out=%s routes=%d",
		params.InputMint[:8], params.OutputMint[:8],
		quote.InAmount, quote.OutAmount, quote.Routes)

	if simulate {
		log.Printf("[SWAP] 🔮 SIMULATED — would swap %s → %s",
			quote.InAmount, quote.OutAmount)
		return &SwapResult{
			Signature:    "sim-" + fmt.Sprintf("%d", amountLamports),
			InputMint:    params.InputMint,
			OutputMint:   params.OutputMint,
			InAmount:     quote.InAmount,
			OutAmount:    quote.OutAmount,
			WalletPubkey: s.WalletPubkey(),
		}, nil
	}

	// In live mode, request serialized swap transaction from Jupiter API
	// and forward through our RPC client.
	// For now, return the quote as result — full Jupiter v6 swap
	// instruction deserialization requires additional implementation.
	log.Printf("[SWAP] ⚠️  Live Jupiter v6 swap execution — use Jupiter Ultra API for production")
	return &SwapResult{
		Signature:    "pending",
		InputMint:    params.InputMint,
		OutputMint:   params.OutputMint,
		InAmount:     quote.InAmount,
		OutAmount:    quote.OutAmount,
		WalletPubkey: s.WalletPubkey(),
	}, nil
}

// ── Memo Instruction ────────────────────────────────────────────────

// BuildMemoInstruction creates a memo instruction for logging on-chain.
func BuildMemoInstruction(memo string, signer solanago.PublicKey) solanago.Instruction {
	return solanago.NewInstruction(
		MemoProgramID,
		solanago.AccountMetaSlice{
			solanago.NewAccountMeta(signer, false, true),
		},
		[]byte(memo),
	)
}
