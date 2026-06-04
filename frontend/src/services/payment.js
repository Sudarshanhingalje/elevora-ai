const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const razorpayScriptUrl = "https://checkout.razorpay.com/v1/checkout.js";

let razorpayScriptPromise;

function loadRazorpayScript() {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = razorpayScriptUrl;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("Unable to load Razorpay checkout"));
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
}

async function createCheckoutOrder(productId) {
  const response = await fetch(`${apiBaseUrl}/api/payments/razorpay/orders`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId }),
  });

  if (!response.ok) {
    throw new Error("Unable to create payment order");
  }

  return response.json();
}

async function verifyPayment(payload) {
  const response = await fetch(`${apiBaseUrl}/api/payments/razorpay/verify`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Unable to verify payment");
  }

  return response.json();
}

export async function startRazorpayCheckout(product) {
  await loadRazorpayScript();
  const order = await createCheckoutOrder(product.id);

  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay({
      key: order.razorpayKeyId,
      amount: order.amountInPaise,
      currency: order.currency,
      name: "Elevora AI",
      description: order.productName,
      order_id: order.razorpayOrderId,
      theme: { color: "#6366F1" },
      modal: {
        ondismiss: () => reject(new Error("Payment checkout closed")),
      },
      handler: async (response) => {
        try {
          const verification = await verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          resolve(verification);
        } catch (error) {
          reject(error);
        }
      },
    });

    checkout.open();
  });
}
