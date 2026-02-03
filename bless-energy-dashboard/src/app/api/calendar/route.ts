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

// Función CRÍTICA: Extraer hora y fecha LITERALMENTE del string ISO
function extractRawDateTime(isoString: string) {
    if (!isoString) return { date: '', time: '' };

    // El formato ISO local del frontend viene como YYYY-MM-DDTHH:mm:ss
    const parts = isoString.split('T');
    if (parts.length < 2) return { date: isoString, time: '' };

    const date = parts[0];
    const time = parts[1].substring(0, 5);

    return { date, time };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sendInvitation, clientPhone, clientDuration, clientEmail, ...eventData } = body;

        // FIX: Google Calendar exige zona horaria si el string no tiene offset (Z o +hh:mm)
        // Como mandamos "2026-02-03T10:00:00" (Local), debemos decir que es Madrid.
        if (eventData.start && !eventData.start.timeZone) {
            eventData.start.timeZone = 'Europe/Madrid';
        }
        if (eventData.end && !eventData.end.timeZone) {
            eventData.end.timeZone = 'Europe/Madrid';
        }

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
        console.log('[N8N DEBUG] Starting webhook process (RAW TIME)');

        if (sendInvitation && clientEmail && WEBHOOK_URL) {
            try {
                // Extract client data from event
                const clientName = eventData.summary.includes(' - ')
                    ? eventData.summary.split(' - ')[1]
                    : 'Cliente';
                const appointmentTitle = eventData.summary.includes(' - ')
                    ? eventData.summary.split(' - ')[0]
                    : eventData.summary;

                const location = eventData.location || '';
                const [address = '', city = ''] = location.split(',').map((s: string) => s.trim());

                // USO LA FUNCIÓN SEGURA
                // eventData.start.dateTime ahora es el string "local" que mandó el frontend
                const rawStart = eventData.start.dateTime;
                const { date, time } = extractRawDateTime(rawStart);

                console.log('[N8N DEBUG] Raw Input:', rawStart);
                console.log('[N8N DEBUG] Extracted:', date, time);

                // Call n8n webhook
                const response = await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientName,
                        clientEmail: clientEmail,
                        clientPhone: clientPhone || '',
                        appointmentTitle,
                        appointmentDate: date, // literal
                        appointmentTime: time, // literal
                        duration: clientDuration || '',
                        address,
                        city,
                        action: 'created'
                    })
                });

                if (response.ok) {
                    console.log('[N8N] Email confirmation sent successfully');
                } else {
                    console.error('[N8N] Webhook response not OK:', await response.text());
                }

            } catch (webhookError) {
                console.error('[N8N] Failed to send email confirmation via webhook:', webhookError);
            }
        }

        console.log(`[TEAM NOTIFICATION] New Appointment Scheduled: ${eventData.summary}`);

        return NextResponse.json({ success: true, data: event });
    } catch (error: any) {
        console.error('Calendar POST Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { eventId, sendInvitation, clientPhone, clientDuration, clientEmail, ...eventData } = body;

        // FIX: Inyectar TimeZone para Google
        if (eventData.start && !eventData.start.timeZone) {
            eventData.start.timeZone = 'Europe/Madrid';
        }
        if (eventData.end && !eventData.end.timeZone) {
            eventData.end.timeZone = 'Europe/Madrid';
        }

        const event = await updateEvent(eventId, eventData);

        if (sendInvitation && clientEmail && WEBHOOK_URL) {
            try {
                const clientName = eventData.summary.includes(' - ') ? eventData.summary.split(' - ')[1] : 'Cliente';
                const appointmentTitle = eventData.summary.includes(' - ') ? eventData.summary.split(' - ')[0] : eventData.summary;
                const location = eventData.location || '';
                const [address = '', city = ''] = location.split(',').map((s: string) => s.trim());

                // USO LA FUNCIÓN SEGURA
                const rawStart = eventData.start.dateTime;
                const { date, time } = extractRawDateTime(rawStart);

                console.log('[N8N UPDATE] Raw Extracted:', date, time);

                await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientName,
                        clientEmail: clientEmail,
                        clientPhone: clientPhone || '',
                        appointmentTitle,
                        appointmentDate: date,
                        appointmentTime: time,
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
