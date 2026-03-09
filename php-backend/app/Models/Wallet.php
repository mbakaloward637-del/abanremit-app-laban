<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Facades\Hash;

class Wallet extends Model
{
    use HasUuids;
    protected $fillable = ['user_id', 'wallet_number', 'balance', 'currency', 'pin_hash', 'failed_pin_attempts', 'is_locked'];
    protected $hidden = ['pin_hash'];
    protected $casts = ['balance' => 'decimal:2', 'is_locked' => 'boolean'];

    public function user() { return $this->belongsTo(User::class); }

    public function verifyPin(string $pin): bool
    {
        return Hash::check($pin, $this->pin_hash);
    }

    public function setPin(string $pin): void
    {
        $this->update([
            'pin_hash' => Hash::make($pin),
            'failed_pin_attempts' => 0,
        ]);
    }

    public static function generateWalletNumber(): string
    {
        $lastNum = self::where('wallet_number', 'like', 'WLT888%')
            ->selectRaw("MAX(CAST(SUBSTRING(wallet_number, 4) AS UNSIGNED)) as max_num")
            ->value('max_num') ?? 8880000000;
        $next = max($lastNum + 1, 8880000001);
        while (self::where('wallet_number', 'WLT' . $next)->exists()) { $next++; }
        return 'WLT' . $next;
    }
}
