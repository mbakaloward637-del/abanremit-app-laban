
-- Function: reverse_transaction
-- Reverses a completed wallet-to-wallet send transaction.
-- Only callable by admins/superadmins.
-- Debits receiver, credits sender back, marks original tx as reversed.
CREATE OR REPLACE FUNCTION public.reverse_transaction(
  p_transaction_id uuid,
  p_admin_id uuid,
  p_reason text DEFAULT 'Admin reversal'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE
  v_tx transactions%ROWTYPE;
  v_sender_wallet wallets%ROWTYPE;
  v_receiver_wallet wallets%ROWTYPE;
  v_rev_ref text;
BEGIN
  -- Only admins/superadmins may call this
  IF NOT (public.has_role(p_admin_id, 'admin') OR public.has_role(p_admin_id, 'superadmin')) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Must be authenticated as the admin caller
  IF p_admin_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Fetch original transaction
  SELECT * INTO v_tx FROM transactions WHERE id = p_transaction_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
  END IF;

  -- Only reverse completed send transactions
  IF v_tx.type != 'send' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only send transactions can be reversed');
  END IF;
  IF v_tx.status != 'completed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only completed transactions can be reversed');
  END IF;

  -- Lock wallets for update
  SELECT * INTO v_sender_wallet FROM wallets WHERE id = v_tx.sender_wallet_id FOR UPDATE;
  SELECT * INTO v_receiver_wallet FROM wallets WHERE id = v_tx.receiver_wallet_id FOR UPDATE;

  IF NOT FOUND OR v_sender_wallet.id IS NULL OR v_receiver_wallet.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
  END IF;

  -- Ensure receiver still has enough balance
  IF v_receiver_wallet.balance < v_tx.amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Receiver has insufficient balance for reversal');
  END IF;

  -- Debit receiver, credit sender (return amount + fee)
  UPDATE wallets SET balance = balance - v_tx.amount, updated_at = now() WHERE id = v_receiver_wallet.id;
  UPDATE wallets SET balance = balance + v_tx.amount + v_tx.fee, updated_at = now() WHERE id = v_sender_wallet.id;

  -- Mark original transaction as reversed
  UPDATE transactions SET status = 'reversed', updated_at = now() WHERE id = p_transaction_id;

  -- Also reverse the paired receive record (reference ends in -R)
  UPDATE transactions SET status = 'reversed', updated_at = now()
  WHERE reference = v_tx.reference || '-R';

  -- Create reversal transaction record
  v_rev_ref := 'REV' || extract(epoch from now())::bigint::text || lpad(floor(random() * 9999)::text, 4, '0');

  INSERT INTO transactions (reference, type, sender_user_id, sender_wallet_id, receiver_user_id, receiver_wallet_id,
    amount, fee, currency, description, status, metadata)
  VALUES (
    v_rev_ref, 'send',
    v_tx.receiver_user_id, v_receiver_wallet.id,
    v_tx.sender_user_id,   v_sender_wallet.id,
    v_tx.amount, 0, v_tx.currency,
    'Reversal: ' || p_reason || ' (Ref: ' || v_tx.reference || ')',
    'completed',
    jsonb_build_object('reversal', true, 'original_reference', v_tx.reference, 'admin_id', p_admin_id, 'reason', p_reason)
  );

  -- Notify both parties
  INSERT INTO notifications (user_id, title, message, type)
  VALUES
    (v_tx.sender_user_id, 'Transaction Reversed', v_tx.currency || ' ' || v_tx.amount || ' has been reversed back to your wallet. Ref: ' || v_tx.reference, 'transaction'),
    (v_tx.receiver_user_id, 'Transaction Reversed', v_tx.currency || ' ' || v_tx.amount || ' was reversed from your wallet. Ref: ' || v_tx.reference, 'transaction');

  -- Log admin action
  INSERT INTO activity_logs (actor_id, action, target, metadata)
  VALUES (
    p_admin_id, 'reverse_transaction', p_transaction_id::text,
    jsonb_build_object('reason', p_reason, 'amount', v_tx.amount, 'currency', v_tx.currency, 'reversal_ref', v_rev_ref)
  );

  RETURN jsonb_build_object(
    'success', true,
    'reversal_reference', v_rev_ref,
    'amount', v_tx.amount,
    'fee_refunded', v_tx.fee,
    'currency', v_tx.currency
  );
END;
$$;
