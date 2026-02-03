import { NextResponse } from 'next/server';
import { listEvents, createEvent, updateEvent, deleteEvent } from '@/lib/google-calendar';

// Define Webhook URL with fallback for production safety
const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://bless-energy-n8n.pdlbif.easypanel.host/webhook/appointment-confirmation';

export async function GET() {
    try {
        const events = await listEvents();
        return NextResponse.json({ success: true, data: events });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sendInvitation, clientPhone, clientDuration, clientEmail, ...eventData } = body;

        // Add default reminders if not present
        if (!eventData.reminders) {
            eventData.reminders = {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 2 * 24 * 60 }, // 2 days before
                    { method: 'popup', minutes: 2 * 60 },      // 2 hours before
                    { method: 'popup', minutes: 60 }           // 1 hour before
                ]
            };
        }

        const event = await createEvent(eventData);

        // Send email confirmation via n8n if toggle is enabled
        console.log('[N8N DEBUG] Starting webhook process');
        console.log('[N8N DEBUG] sendInvitation:', sendInvitation);
        console.log('[N8N DEBUG] clientEmail:', clientEmail);
        console.log('[N8N DEBUG] WEBHOOK_URL target:', WEBHOOK_URL);

        // Check conditions individually for better debugging
        if (!sendInvitation) console.log('[N8N DEBUG] Skipped: sendInvitation is false');
        if (!clientEmail) console.log('[N8N DEBUG] Skipped: clientEmail is missing');

        if (sendInvitation && clientEmail && WEBHOOK_URL) {
            try {
                // Extract client data from event
                const clientName = eventData.summary.includes(' - ')
                    ? eventData.summary.split(' - ')[1]
                    : 'Cliente';
                const appointmentTitle = eventData.summary.includes(' - ')
                    ? eventData.summary.split(' - ')[0]
                    : eventData.summary;

                const startDate = new Date(eventData.start.dateTime);
                const location = eventData.location || '';
                const [address = '', city = ''] = location.split(',').map((s: string) => s.trim());

                // Call n8n webhook
                console.log('[N8N DEBUG] Sending fetch request to N8N...');
                const response = await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientName,
                        clientEmail: clientEmail,
                        clientPhone: clientPhone || '',
                        appointmentTitle,
                        appointmentDate: startDate.toISOString().split('T')[0],
                        appointmentTime: startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                        duration: clientDuration || '',
                        address,
                        city,
                        action: 'created'
                    })
                });

                if (response.ok) {
                    console.log('[N8N] Email confirmation sent successfully. Status:', response.status);
                } else {
                    console.error('[N8N] Webhook response not OK:', await response.text());
                }

            } catch (webhookError) {
                console.error('[N8N] Failed to send email confirmation via webhook:', webhookError);
                // Don't fail the whole request if webhook fails
            }
        }

        // Notify Team Logic
        console.log(`[TEAM NOTIFICATION] New Appointment Scheduled: ${eventData.summary} at ${eventData.start.dateTime}`);

        return NextResponse.json({ success: true, data: event });
    } catch (error: any) {
        console.error('Calendar POST Error:', error);
        let message = error.message;
        if (message.includes('notFound')) message = 'Calendario no encontrado. Verifica tu GOOGLE_CALENDAR_ID.';
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { eventId, sendInvitation, clientPhone, clientDuration, clientEmail, ...eventData } = body;
        const event = await updateEvent(eventId, eventData);

        // Send email confirmation via n8n if toggle is enabled
        console.log('[N8N UPDATE DEBUG] sendInvitation:', sendInvitation);
        console.log('[N8N UPDATE DEBUG] clientEmail:', clientEmail);

        if (sendInvitation && clientEmail && WEBHOOK_URL) {
            try {
                const clientName = eventData.summary.includes(' - ')
                    ? eventData.summary.split(' - ')[1]
                    : 'Cliente';
                const appointmentTitle = eventData.summary.includes(' - ')
                    ? eventData.summary.split(' - ')[0]
                    : eventData.summary;

                const startDate = new Date(eventData.start.dateTime);
                const location = eventData.location || '';
                const [address = '', city = ''] = location.split(',').map((s: string) => s.trim());

                console.log('[N8N UPDATE] Sending webhook update...');
                await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientName,
                        clientEmail: clientEmail,
                        clientPhone: clientPhone || '',
                        appointmentTitle,
                        appointmentDate: startDate.toISOString().split('T')[0],
                        appointmentTime: startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                        duration: clientDuration || '',
                        address,
                        city,
                        action: 'updated'
                    })
                });
                console.log('[N8N] Email update confirmation sent successfully');
            } catch (webhookError) {
                console.error('[N8N] Failed to send email update:', webhookError);
            }
        }

        return NextResponse.json({ success: true, data: event });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');
        if (!eventId) throw new Error('Event ID is required');
        await deleteEvent(eventId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
