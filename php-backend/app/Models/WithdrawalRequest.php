<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class WithdrawalRequest extends Model
{
    use HasUuids;
    protected $fillable = ['user_id', 'wallet_id', 'amount', 'currency', 'method', 'destination', 'status', 'reviewed_by', 'reviewed_at'];
    protected $casts = ['amount' => 'decimal:2', 'reviewed_at' => 'datetime'];
}
