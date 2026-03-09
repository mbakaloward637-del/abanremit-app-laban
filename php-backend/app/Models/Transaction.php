<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Transaction extends Model
{
    use HasUuids;
    protected $fillable = [
        'reference', 'type', 'sender_user_id', 'sender_wallet_id',
        'receiver_user_id', 'receiver_wallet_id', 'amount', 'fee',
        'currency', 'description', 'status', 'method', 'provider', 'metadata',
    ];
    protected $casts = ['amount' => 'decimal:2', 'fee' => 'decimal:2', 'metadata' => 'array'];

    public function senderWallet() { return $this->belongsTo(Wallet::class, 'sender_wallet_id'); }
    public function receiverWallet() { return $this->belongsTo(Wallet::class, 'receiver_wallet_id'); }
}
