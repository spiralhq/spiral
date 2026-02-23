import { Resend } from "resend";
import { env } from "@spiral/env/server";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const resendGateway = {
  async sendInviteEmail(input: {
    to: string;
    organizationName: string;
    inviteUrl: string;
  }): Promise<void> {
    if (!resend) {
      console.warn("[resendGateway] RESEND_API_KEY not configured, skipping email send");
      return;
    }

    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL ?? "noreply@spiralhq.dev",
      to: input.to,
      subject: `You've been invited to join ${input.organizationName} on Spiral`,
      html: `
        <p>You've been invited to join <strong>${input.organizationName}</strong> on Spiral.</p>
        <p>Click the link below to accept the invitation:</p>
        <p><a href="${input.inviteUrl}">${input.inviteUrl}</a></p>
        <p>This invitation will expire in 7 days.</p>
      `,
    });
  },
} as const;
