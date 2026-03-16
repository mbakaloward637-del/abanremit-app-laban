<?php
// ─── Profile Model ───
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Profile extends Model
{
    use HasUuids;
    protected $fillable = [
        'user_id', 'first_name', 'last_name', 'middle_name', 'email', 'phone',
        'country', 'country_code', 'city', 'address', 'gender', 'date_of_birth',
        'avatar_url', 'id_front_url', 'id_back_url', 'selfie_url',
        'kyc_status', 'kyc_rejection_reason', 'status',
    ];
    public function user() { return $this->belongsTo(User::class); }
}
