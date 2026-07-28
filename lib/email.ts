import { Resend } from "resend";
import type { Booking, Service } from "@/lib/database.types";
import type { SiteSettings } from "@/lib/settings";
import { formatDate, formatPrice, formatTime, formatWeekday } from "@/lib/time";

const resendKey = process.env.RESEND_API_KEY;
const resend = resendKey ? new Resend(resendKey) : null;

const FROM =
  process.env.BOOKING_FROM_EMAIL ?? "HS Detailing <rezervace@hdetailing.cz>";

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

type BookingEmailInput = {
  booking: Booking;
  service: Service;
  settings: SiteSettings;
};

function layout(settings: SiteSettings, title: string, inner: string) {
  const { accent, accent2 } = settings.theme;
  return `<!doctype html>
<html lang="cs"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escape(title)}</title></head>
<body style="margin:0;padding:32px 16px;background:#05070c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e6ebf2;">
  <div style="max-width:560px;margin:0 auto;background:#0b1018;border:1px solid rgba(255,255,255,.08);border-radius:20px;overflow:hidden;">
    <div style="padding:28px 32px;background:linear-gradient(120deg,${accent}22,${accent2}22);border-bottom:1px solid rgba(255,255,255,.08);">
      <div style="font-size:13px;letter-spacing:.22em;text-transform:uppercase;color:${accent};font-weight:700;">
        ${escape(settings.brand.name)}
      </div>
      <div style="font-size:22px;font-weight:700;margin-top:8px;color:#fff;">${escape(title)}</div>
    </div>
    <div style="padding:28px 32px;font-size:15px;line-height:1.65;color:#c3ccda;">
      ${inner}
    </div>
    <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,.08);font-size:12px;color:#7b8798;">
      ${escape(settings.contact.address)}<br />
      ${escape(settings.contact.phone)} · ${escape(settings.contact.email)}
    </div>
  </div>
</body></html>`;
}

function detailTable(booking: Booking, service: Service, settings: SiteSettings) {
  const rows: [string, string][] = [
    ["Služba", service.name],
    ["Termín", `${formatWeekday(booking.starts_at)} ${formatDate(booking.starts_at)}`],
    service.whole_day
      ? ["Předání vozu", `${formatTime(booking.dropoff_at ?? booking.starts_at)} — vůz máme celý den`]
      : ["Čas", `${formatTime(booking.starts_at)} – ${formatTime(booking.ends_at)}`],
    [
      "Cena",
      booking.price_estimate
        ? `${service.price_note || "od"} ${formatPrice(booking.price_estimate)}`.trim()
        : "dle prohlídky",
    ],
    ["Platba", "hotově na místě"],
    ["Kód rezervace", booking.reference],
  ];

  const car = [booking.car_make, booking.car_model, booking.car_plate]
    .filter(Boolean)
    .join(" · ");
  if (car) rows.splice(1, 0, ["Vozidlo", car]);
  if (booking.note) rows.push(["Poznámka", booking.note]);

  return `<table style="width:100%;border-collapse:collapse;margin:20px 0;">
    ${rows
      .map(
        ([label, value]) => `<tr>
          <td style="padding:9px 0;color:#7b8798;font-size:13px;vertical-align:top;width:42%;">${escape(label)}</td>
          <td style="padding:9px 0;color:#fff;font-weight:600;font-size:14px;">${escape(value)}</td>
        </tr>`,
      )
      .join("")}
  </table>
  <div style="padding:14px 16px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);font-size:13px;color:#9aa6b6;">
    ${escape(settings.booking.paymentNote)}
  </div>`;
}

/** Potvrzení rezervace zákazníkovi. */
export async function sendBookingConfirmation({
  booking,
  service,
  settings,
}: BookingEmailInput) {
  const html = layout(
    settings,
    "Rezervace přijata",
    `<p>Dobrý den, <strong style="color:#fff;">${escape(booking.customer_name)}</strong>,</p>
     <p>děkujeme za rezervaci. Níže je její shrnutí — termín máme zapsaný a ozveme se jen v případě, že by bylo potřeba cokoliv upřesnit.</p>
     ${detailTable(booking, service, settings)}
     <p style="margin-top:22px;">Potřebujete termín změnit nebo zrušit? Stačí odpovědět na tento e-mail nebo zavolat na ${escape(settings.contact.phone)}.</p>
     <p style="margin-top:22px;color:#7b8798;">Těšíme se na vás.<br />${escape(settings.brand.name)}</p>`,
  );

  return send({
    to: booking.customer_email,
    subject: `Rezervace ${booking.reference} — ${service.name}`,
    html,
  });
}

/** Interní upozornění na novou rezervaci. */
export async function sendAdminNotification({
  booking,
  service,
  settings,
}: BookingEmailInput) {
  const to = process.env.ADMIN_NOTIFY_EMAIL ?? settings.contact.email;
  if (!to) return { skipped: true as const };

  const html = layout(
    settings,
    "Nová rezervace",
    `<p><strong style="color:#fff;">${escape(booking.customer_name)}</strong> · ${escape(booking.customer_phone)} · ${escape(booking.customer_email)}</p>
     ${detailTable(booking, service, settings)}`,
  );

  return send({
    to,
    subject: `Nová rezervace ${booking.reference} — ${service.name}`,
    html,
  });
}

/** Informace o změně stavu (potvrzeno / zrušeno). */
export async function sendStatusUpdate({
  booking,
  service,
  settings,
}: BookingEmailInput) {
  const isCancelled = booking.status === "cancelled";
  const title = isCancelled ? "Rezervace zrušena" : "Rezervace potvrzena";
  const lead = isCancelled
    ? "vaši rezervaci jsme zrušili. Pokud jde o omyl, ozvěte se nám a najdeme nový termín."
    : "vaši rezervaci máme potvrzenou. Termín je pevně zablokovaný jen pro vás.";

  const html = layout(
    settings,
    title,
    `<p>Dobrý den, <strong style="color:#fff;">${escape(booking.customer_name)}</strong>,</p>
     <p>${lead}</p>
     ${detailTable(booking, service, settings)}`,
  );

  return send({
    to: booking.customer_email,
    subject: `${title} — ${booking.reference}`,
    html,
  });
}

async function send({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY není nastavený — e-mail „${subject}“ pro ${to} se neodeslal.`,
    );
    return { skipped: true as const };
  }

  const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error("[email] odeslání selhalo:", error);
    return { error };
  }
  return { id: data?.id };
}
