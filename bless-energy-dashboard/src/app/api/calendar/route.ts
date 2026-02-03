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

// Función auxiliar para extraer fecha y hora SIN conversión de zona horaria
// Entrada: "2026-02-03T10:00:00+01:00" o "2026-02-03T10:00:00"
// Salida: { date: "2026-02-03", time: "10:00" }
function extractRawDateTime(isoString: string) {
    if (!isoString) return { date: '', time: '' };

    // Si viene con T, partimos por ahí
    if (isoString.includes('T')) {
        const [datePart, timePart] = isoString.split('T');
        // timePart puede ser "10:00:00+01:00" o "10:00:00.000Z"
        // Cogemos solo los primeros 5 caracteres (HH:MM)
        const time = timePart.substring(0, 5);
        return { date: datePart, time };
    }
    return { date: isoString, time: '' };
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

                // FIX: Usar strings crudos directamente del input, sin pasar por Date()
                const { date, time } = extractRawDateTime(eventData.start.dateTime);

                console.log('[N8N DEBUG] Sending Raw Date/Time:', date, time);

                // Call n8n webhook
                const response = await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        clientName,
                        clientEmail: clientEmail,
                        clientPhone: clientPhone || '',
                        appointmentTitle,
                        appointmentDate: date, // "2026-02-03" -> Directo
                        appointmentTime: time, // "10:00" -> Directo
                        duration: clientDuration || '',
                        address,
                        city,
                        action: 'created'
                    })
                });

                if (response.ok) console.log('[N8N] Email confirmation sent successfully');
                else console.error('[N8N] Webhook response not OK:', await response.text());

            } catch (webhookError) {
                console.error('[N8N] Failed to send email confirmation via webhook:', webhookError);
            }
        }

        // Notify Team Logic
        console.log(`[TEAM NOTIFICATION] New Appointment Scheduled: ${eventData.summary}`);

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

        if (sendInvitation && clientEmail && WEBHOOK_URL) {
            try {
                const clientName = eventData.summary.includes(' - ') ? eventData.summary.split(' - ')[1] : 'Cliente';
                const appointmentTitle = eventData.summary.includes(' - ') ? eventData.summary.split(' - ')[0] : eventData.summary;
                const location = eventData.location || '';
                const [address = '', city = ''] = location.split(',').map((s: string) => s.trim());

                // FIX: Usar strings crudos
                const { date, time } = extractRawDateTime(eventData.start.dateTime);

                console.log('[N8N UPDATE] Sending Raw Date/Time:', date, time);

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
