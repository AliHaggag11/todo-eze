import webPush from 'web-push';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY!;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

webPush.setVapidDetails(
  'mailto:your-email@example.com',
  publicVapidKey,
  privateVapidKey
);

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(req: Request) {
  const { title, body, url } = await req.json();

  try {
    console.log('Sending notification', { title, body, url });

    // Fetch all push subscriptions from the database
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) {
      throw new Error('Failed to fetch push subscriptions');
    }

    // Send notifications to all subscribed clients
    const notificationPromises = subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          sub.subscription,
          JSON.stringify({ title, body, url })
        );
      } catch (error) {
        console.error('Error sending push notification:', error);
        // If the subscription is invalid, remove it from the database
        if ((error as any).statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
        }
      }
    });

    await Promise.all(notificationPromises);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error sending push notifications:', error);
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: 'Failed to send notifications', details: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to send notifications', details: 'Unknown error' }, { status: 500 });
    }
  }
}