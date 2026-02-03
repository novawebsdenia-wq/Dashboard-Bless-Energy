import { google } from 'googleapis';

const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
];

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
});

const calendar = google.calendar({ version: 'v3', auth });

export const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

export async function listEvents() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const response = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: startOfMonth.toISOString(),
            maxResults: 100,
            singleEvents: true,
            orderBy: 'startTime',
        });
        return response.data.items || [];
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        throw error;
    }
}

export async function createEvent(event: any) {
    try {
        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            requestBody: event,
        });
        return response.data;
    } catch (error) {
        console.error('Error creating calendar event:', error);
        throw error;
    }
}

export async function updateEvent(eventId: string, event: any) {
    try {
        const response = await calendar.events.update({
            calendarId: CALENDAR_ID,
            eventId,
            requestBody: event,
        });
        return response.data;
    } catch (error) {
        console.error('Error updating calendar event:', error);
        throw error;
    }
}

export async function deleteEvent(eventId: string) {
    try {
        await calendar.events.delete({
            calendarId: CALENDAR_ID,
            eventId,
        });
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        throw error;
    }
}

export { calendar };
