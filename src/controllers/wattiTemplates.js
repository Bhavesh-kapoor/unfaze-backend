import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const templateConfig = {
  welcomeMessage: {
    template_name: "register_user",
    broadcast_name: "register_user_221020241628",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  booking_confirmation_for_user: {
    template_name: "booking_confirmation_for_user",
    broadcast_name: "booking_confirmation_for_user_221020241538",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  feedback_by_user: {
    template_name: "feedback_by_user",
    broadcast_name: "feedback_by_user_221020241540",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  package_purchase: {
    template_name: "package_purchase",
    broadcast_name: "package_purchase_221020241541",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  session_missed_by_user: {
    template_name: "session_missed_by_user",
    broadcast_name: "session_missed_by_user_221020241541",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  session_rescheduled_by_user: {
    template_name: "session_rescheduled_by_user",
    broadcast_name: "session_rescheduled_by_user_221020241541",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  session_reminder_for_user: {
    template_name: "session_reminder_for_user",
    broadcast_name: "session_reminder_for_user_221020241541",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  session_reminder_for_therapists: {
    template_name: "session_reminder_for_therapists",
    broadcast_name: "session_reminder_for_therapists_221020241542",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  session_stopped_for_user: {
    template_name: "session_stopped_for_user",
    broadcast_name: "session_stopped_for_user_221020241542",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  new_offer_for_user: {
    template_name: "new_offer_for_user",
    broadcast_name: "new_offer_for_user_221020241542",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessages",
  },
  payment_issue_for_user: {
    template_name: "payment_issue_for_user",
    broadcast_name: "payment_issue_for_user_221020241543",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  not_booked_after_30_minutes: {
    template_name: "not_booked_after_30_minutes",
    broadcast_name: "not_booked_after_30_minutes_221020241606",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  session_pending_reminder_for_user: {
    template_name: "session_pending_reminder_for_user",
    broadcast_name: "session_pending_reminder_for_user_221020241607",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  chat_pending_for_6_hours_for_user: {
    template_name: "chat_pending_for_6_hours_for_user",
    broadcast_name: "chat_pending_for_6_hours_for_user_221020241607",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  chat_reminder_for_therapists: {
    template_name: "chat_reminder_for_therapists",
    broadcast_name: "chat_reminder_for_therapists_221020241607",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  session_alerttherapist: {
    template_name: "session_alerttherapist",
    broadcast_name: "session_alerttherapist_231020241429",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
};

export const makeParameterForWATTI = (data) => {
  return Object.keys(data).map((key) => ({
    name: key,
    value: data[key] || "",
  }));
};

export async function sendTemplateMessage(templateKey, request) {
  const accessToken = process.env.ACCESS_TOKEN;

  const template = templateConfig[templateKey]; // to get the template configuration
  if (!template) return console.error(`Invalid templateKey: ${templateKey}`);

  const url = `${template?.endpoint}${request?.mobile}`; // to get the template configuration url
  delete request?.mobile;

  const data = {
    template_name: template.template_name,
    broadcast_name: template.broadcast_name,
    parameters: makeParameterForWATTI(request),
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    if (process.env.NODE_ENV !== "prod")
      console.log("-------SENT SUCCESSFULLY-------", response?.data);
    if (response?.data?.result) return true;
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response ? error.response.data : error.message
    );
  }
}

export async function sendTemplateMultipleUserMessages(templateKey, request) {
  const accessToken = process.env.ACCESS_TOKEN;

  const template = templateConfig[templateKey]; // to get the template configuration
  if (!template) return console.error(`Invalid templateKey: ${templateKey}`);

  const url = template?.endpoint; // to get the template configuration url

  const data = {
    receivers: request,
    template_name: template.template_name,
    broadcast_name: template.broadcast_name,
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        Authorization: `${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    if (process.env.NODE_ENV !== "prod")
      console.log("-------SENT SUCCESSFULLY-------", response?.data);
    if (response?.data?.result) return true;
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response ? error.response.data : error.message
    );
  }
}
