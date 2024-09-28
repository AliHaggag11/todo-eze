import webPush from 'web-push';
import { NextResponse } from 'next/server';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY!;

webPush.setVapidDetails(
  'mailto:your-email@example.com',
  publicVapidKey,
  privateVapidKey
);

export async function POST(req: Request) {
  try {
    const { subscription, title, body, url } = await req.json();
    console.log('Received notification request', { subscription, title, body, url });

    if (!subscription) {
      throw new Error('No subscription provided');
    }

    // Send notification to the specific subscription
    await webPush.sendNotification(
      subscription,
      JSON.stringify({ title, body, url })
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in POST handler:', error);
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: 'Failed to send notification', details: error.message }, { status: 400 });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to send notification', details: 'Unknown error' }, { status: 400 });
    }
  }
}