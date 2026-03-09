<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use Illuminate\Http\Request;

class SupportController extends Controller
{
    /**
     * GET /api/v1/support-tickets
     */
    public function index(Request $request)
    {
        $tickets = SupportTicket::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($tickets);
    }

    /**
     * POST /api/v1/support-tickets
     */
    public function store(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'nullable|in:failed_transaction,login_issue,payment_dispute,general,account_issue',
            'priority' => 'nullable|in:low,medium,high,critical',
        ]);

        $ticket = SupportTicket::create([
            'user_id' => $request->user()->id,
            'subject' => $request->subject,
            'description' => $request->description,
            'category' => $request->category ?? 'general',
            'priority' => $request->priority ?? 'medium',
            'status' => 'open',
        ]);

        return response()->json(['success' => true, 'ticket' => $ticket], 201);
    }

    /**
     * GET /api/v1/support-tickets/{id}
     */
    public function show(Request $request, string $id)
    {
        $ticket = SupportTicket::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();
        return response()->json($ticket);
    }
}
