import webpush from 'web-push'

export async function POST(req: Request) {
  const { subscription, title, body } = await req.json()

  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  try {
    await webpush.sendNotification(subscription, JSON.stringify({ title, body }))
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ success: false }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}