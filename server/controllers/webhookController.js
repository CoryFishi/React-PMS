import * as leaseService from "../services/leaseService.js";

export const docusignEnvelopeEvent = async (req, res) => {
  try {
    const body = req.body || {};
    const envelopeId = body?.data?.envelopeId ?? body.envelopeId ?? null;
    const status = body?.data?.envelopeSummary?.status ?? body.status ?? null;

    if (!envelopeId) {
      console.warn("[docusignWebhook] payload missing envelopeId; ignoring");
      return res.status(200).json({ ok: true, ignored: true });
    }

    const result = await leaseService.applyEnvelopeEvent({ envelopeId, status });
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("[docusignWebhook] handler failed:", error?.message || error);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
};
