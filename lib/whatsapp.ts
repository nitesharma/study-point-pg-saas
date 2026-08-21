/**
 * Generic WhatsApp Integration Service
 * 
 * This service abstracts the WhatsApp API integration, allowing the Next.js API route 
 * to handle the actual provider-specific logic (e.g. Meta Cloud API, Twilio, Interakt).
 */

export interface WhatsAppMessagePayload {
  to: string; // The tenant's phone number
  type: "rent_reminder" | "receipt" | "general" | "fine_reminder";
  parameters: {
    tenantName?: string;
    propertyName?: string;
    amount?: number;
    month?: string;
    date?: string;
    link?: string;
    reason?: string;
  };
}

export const whatsappService = {
  /**
   * Sends a generic WhatsApp message payload to our internal API route.
   */
  sendMessage: async (payload: WhatsAppMessagePayload): Promise<boolean> => {
    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to send WhatsApp message: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("WhatsApp Service Error:", error);
      return false;
    }
  },

  sendFineReminder: async (phone: string, data: { tenantName: string, amount: number, reason: string, date: string }): Promise<boolean> => {
    return whatsappService.sendMessage({
      to: phone,
      type: "fine_reminder",
      parameters: {
        tenantName: data.tenantName,
        amount: data.amount,
        reason: data.reason,
        date: data.date
      }
    });
  }
};
