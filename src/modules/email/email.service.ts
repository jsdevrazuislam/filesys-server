import { env } from '../../config';
import logger from '../../utils/logger';

export async function sendEmail(
  subject: string,
  email: string,
  name: string,
  params: object,
  templateId: number,
) {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'api-key': env.SMTP_TOKEN as string,
      },
      body: JSON.stringify({
        to: [{ email, name }],
        templateId,
        params,
        subject,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('Failed to send email via Brevo', { error: errorData });
      return false;
    }

    logger.info(`Email sent successfully to ${email}`, { subject, templateId });
    return true;
  } catch (error) {
    logger.error('Error in sendEmail service', { error });
    return false;
  }
}

export const EmailService = {
  sendEmail,
};
