import Rental from "../models/rental.js";
import Event from "../models/event.js";

export async function handleCheckoutCompleted({ sessionId, paymentIntentId }) {
  const rental = await Rental.findOne({ checkoutSessionId: sessionId });
  if (!rental) {
    return { noop: true, reason: "rental-not-found" };
  }
  if (rental.status === "paid") {
    return { noop: true, reason: "already-applied" };
  }

  rental.status = "paid";
  if (paymentIntentId) {
    rental.paymentIntentId = paymentIntentId;
  }
  await rental.save();

  await Event.create({
    eventType: "Billing",
    eventName: "Payment Recieved",
    company: rental.company,
    facility: rental.facility,
    message: `Stripe session ${sessionId} -> paid`,
  });

  return { noop: false };
}
