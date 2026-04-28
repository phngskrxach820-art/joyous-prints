import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

export async function generatePromptPayQR(phone: string, amount: number): Promise<string> {
  const payload = generatePayload(phone, { amount });
  return QRCode.toDataURL(payload, {
    width: 360,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export async function generateUrlQR(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 320,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
