import { getSupabaseService } from '../_shared/supabase.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const APP_URL = Deno.env.get('APP_URL') || 'https://massagematchthai.com'

interface Body {
  user_id: string
  trigger: 'signup' | 'profile_completed'
}

function getCustomerTemplate(firstName: string) {
  return {
    subject: 'Welcome to MassageMatch Thailand! 🇹🇭 Find Your Perfect Therapist',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #f59e0b;">Welcome to MassageMatch Thailand! 🇹🇭</h1>
  <p>Hi ${firstName},</p>
  <p>You're now connected to Thailand's best massage therapists!</p>
  <ul style="list-style: none; padding: 0;">
    <li style="margin: 10px 0;">✅ Browse 1000+ verified profiles</li>
    <li style="margin: 10px 0;">✅ Swipe like Tinder → unlock contacts</li>
    <li style="margin: 10px 0;">✅ 5 FREE swipes included</li>
  </ul>
  <p style="margin: 30px 0;">
    <a href="${APP_URL}/swipe" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">👉 Start Swiping</a>
  </p>
  <p><strong>Pro Tip:</strong> Silver (149 THB) = 20 swipes + 12h unlimited!</p>
  <p>Need help? <a href="mailto:support@massagematchthai.com">support@massagematchthai.com</a></p>
  <p>Happy massaging! 💆‍♀️<br>Team MassageMatch</p>
</body>
</html>
    `,
  }
}

function getTherapistTemplate(firstName: string) {
  return {
    subject: `${firstName}, FREE 3-Months Premium + Customers Waiting! 🚀`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #f59e0b;">Congratulations therapist!</h1>
  <p>Hi ${firstName},</p>
  <p><strong>🎁 FREE 3-MONTHS PREMIUM</strong> (code NEWTHERAPIST90 auto-applied)</p>
  <ul style="list-style: none; padding: 0;">
    <li style="margin: 10px 0;">✅ Top search/swipe/toplist visibility</li>
    <li style="margin: 10px 0;">✅ Unlimited profile views</li>
  </ul>
  <p><strong>💰 65k+ tourists searching RIGHT NOW</strong><br>
  📱 Add social links → Go live instantly</p>
  <p style="margin: 30px 0;">
    <a href="${APP_URL}/profile" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">👉 Complete Profile</a>
  </p>
  <p>99 THB/month after trial. Keep 100% earnings!</p>
  <p>Questions? <a href="mailto:thaimassagematch@hotmail.com">thaimassagematch@hotmail.com</a></p>
  <p>Welcome aboard! 🌟<br>MassageMatch Team</p>
</body>
</html>
    `,
  }
}

function getSalongTemplate(salongName: string, ownerName: string) {
  return {
    subject: `Welcome ${salongName}! Dominate Thailand Massage Search`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #f59e0b;">Welcome ${salongName}!</h1>
  <p>Hi ${ownerName},</p>
  <p>Your salong is live on MassageMatch!</p>
  <ul style="list-style: none; padding: 0;">
    <li style="margin: 10px 0;">✅ Premium 1 Month FREE trial (199 THB value)</li>
    <li style="margin: 10px 0;">✅ Featured in toplist + search</li>
  </ul>
  <p style="margin: 30px 0;">
    <a href="${APP_URL}/admin/content" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">👉 Add Team Therapists</a>
  </p>
  <p>Boost bookings 3x! Hotels/tourists love verified salongs.</p>
  <p><a href="mailto:support@massagematchthai.com">support@massagematchthai.com</a></p>
  <p>Let's fill your schedule! 🏆<br>MassageMatch Team</p>
</body>
</html>
    `,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'Resend not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  try {
    const body = (await req.json()) as Body
    const { user_id, trigger } = body

    const supabase = getSupabaseService()

    // Get user profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('role, user_id')
      .eq('user_id', user_id)
      .single()

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Get user email from auth
    const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(user_id)
    if (authErr || !authUser?.user?.email) {
      return new Response(JSON.stringify({ error: 'User email not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const email = authUser.user.email
    const firstName = email.split('@')[0] || 'there'
    const role = profile.role

    // Select template based on role
    let template
    if (role === 'therapist') {
      template = getTherapistTemplate(firstName)
    } else if (role === 'salong') {
      template = getSalongTemplate('Your Salong', firstName)
    } else {
      template = getCustomerTemplate(firstName)
    }

    // Send via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MassageMatch <noreply@massagematchthai.com>',
        to: email,
        subject: template.subject,
        html: template.html,
      }),
    })

    if (!resendResponse.ok) {
      const error = await resendResponse.text()
      return new Response(JSON.stringify({ error: `Resend failed: ${error}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Log email sent
    await supabase.from('logs').insert({
      level: 'info',
      event: 'welcome_email_sent',
      user_id,
      payload: { role, trigger, email },
    })

    return new Response(JSON.stringify({ ok: true, email }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Email send failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    )
  }
})
