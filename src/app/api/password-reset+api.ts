const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

type PasswordResetBody = {
  email?: string;
  code?: string;
};

export function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { email, code } = (await request.json()) as PasswordResetBody;
    const normalizedEmail = String(email ?? '').toLowerCase().trim();
    const resetCode = String(code ?? '').trim();

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || !/^\d{6}$/.test(resetCode)) {
      return Response.json({ error: 'Invalid reset request.' }, { status: 400, headers: corsHeaders });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.PASSWORD_RESET_FROM_EMAIL ?? 'ImpactoEJ <onboarding@resend.dev>';

    if (!resendApiKey) {
      return Response.json(
        { error: 'Password reset email service is not configured.' },
        { status: 500, headers: corsHeaders }
      );
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: normalizedEmail,
        subject: 'Código de recuperação de senha - ImpactoEJ',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #0f172a;">
            <h1 style="font-size: 22px;">Recuperação de senha</h1>
            <p>Use o código abaixo para redefinir sua senha no ImpactoEJ:</p>
            <div style="font-size: 30px; letter-spacing: 8px; font-weight: 700; padding: 18px 20px; background: #f1f5f9; border-radius: 12px; text-align: center;">
              ${resetCode}
            </div>
            <p style="font-size: 14px; color: #475569;">Este código expira em 15 minutos. Se você não pediu a recuperação, ignore este e-mail.</p>
          </div>
        `,
        text: `Seu código de recuperação de senha do ImpactoEJ é ${resetCode}. Ele expira em 15 minutos.`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend password reset error:', errorText);
      return Response.json({ error: 'Could not send reset email.' }, { status: 502, headers: corsHeaders });
    }

    return Response.json({ ok: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Password reset API error:', error);
    return Response.json({ error: 'Internal server error.' }, { status: 500, headers: corsHeaders });
  }
}
