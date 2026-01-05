export async function sendVerificationEmail(email: string, token: string) {
  // In production integrate with an email provider. For MVP we log the magic link.
  const link = `${process.env.APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;
  console.log(`Send verification to ${email}: ${link}`);
}
