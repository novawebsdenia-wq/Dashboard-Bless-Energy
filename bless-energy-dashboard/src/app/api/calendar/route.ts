import { NextResponse } from 'next/server';
import { listEvents, createEvent, updateEvent, deleteEvent } from '@/lib/google-calendar';

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
        const event = await createEvent(body);
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
        const { eventId, ...eventData } = body;
        const event = await updateEvent(eventId, eventData);
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
