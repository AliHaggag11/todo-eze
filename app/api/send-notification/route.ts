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
  const { subscription, title, body, url } = await req.json();

  try {
    await webPush.sendNotification(
      subscription,
      JSON.stringify({ title, body, url })
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
  }
}