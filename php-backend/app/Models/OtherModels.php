<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ExchangeRate extends Model { use HasUuids; protected $fillable = ['from_currency','to_currency','rate','margin_percent','is_active','updated_by']; protected $casts = ['rate'=>'decimal:6','is_active'=>'boolean']; }
class FeeConfig extends Model { use HasUuids; protected $table = 'fee_config'; protected $fillable = ['name','transaction_type','fee_type','flat_amount','percentage','min_amount','max_amount','is_active','updated_by']; protected $casts = ['is_active'=>'boolean']; }
class VirtualCard extends Model { use HasUuids; protected $fillable = ['user_id','card_number','cvv','expiry','cardholder_name','provider','provider_ref','is_frozen']; protected $casts = ['is_frozen'=>'boolean']; }
class ActivityLog extends Model { use HasUuids; protected $fillable = ['actor_id','action','target','ip_address','metadata']; protected $casts = ['metadata'=>'array']; }
class SecurityAlert extends Model { use HasUuids; protected $fillable = ['type','user_id','description','severity','resolved','resolved_by']; protected $casts = ['resolved'=>'boolean']; }
class SupportTicket extends Model { use HasUuids; protected $fillable = ['user_id','subject','description','category','priority','status']; }
class PaymentGateway extends Model { use HasUuids; protected $fillable = ['name','provider','mode','is_enabled','config','updated_by']; protected $casts = ['is_enabled'=>'boolean','config'=>'array']; }
class PlatformConfig extends Model { use HasUuids; protected $table = 'platform_config'; protected $fillable = ['key','value','updated_by']; protected $casts = ['value'=>'array']; }
