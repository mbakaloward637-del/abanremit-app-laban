<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Notification extends Model
{
    use HasUuids;
    protected $table = 'notifications_custom';
    protected $fillable = ['user_id', 'title', 'message', 'type', 'read'];
    protected $casts = ['read' => 'boolean'];
}
