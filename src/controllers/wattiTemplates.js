import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const templateConfig = {
  welcomeMessage: {
    template_name: "register_userv2",
    broadcast_name: "register_user_221020241628",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  booking_confirmation_for_user: {
    template_name: "booking_confirmation_for_userv2",
    broadcast_name: "booking_confirmation_for_userv2_231020241559",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  feedback_by_user: {
    template_name: "feedback_for_user_v2",
    broadcast_name: "feedback_for_user_v2_231020241600",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  package_purchase: {
    template_name: "package_purchase_v2",
    broadcast_name: "package_purchase_v2_231020241602",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  session_missed_by_user: {
    template_name: "session_missed_by_user_v2",
    broadcast_name: "session_missed_by_user_v2_231020241605",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  session_rescheduled_by_user: {
    template_name: "session_rescheduled_for_user_v2",
    broadcast_name: "session_rescheduled_for_user_v2_231020241609",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  session_reminder_for_user: {
    template_name: "session_reminder_for_user_v2",
    broadcast_name: "session_reminder_for_user_v2_231020241607",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessage?whatsappNumber=",
  },
  session_reminder_for_therapists: {
    template_name: "session_reminder_for_therapist_v2",
    broadcast_name: "session_reminder_for_therapist_v2_231020241611",
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
  chat_pending_for_user: {
    template_name: "pending_chat_reminder_user",
    broadcast_name: "pending_chat_reminder_user_231020241751",
    endpoint:
      "https://live-mt-server.wati.io/355255/api/v1/sendTemplateMessages",
  },
  chat_reminder_for_therapists: {
    template_name: "chat_reminder_therapist_v2",
    broadcast_name: "chat_reminder_therapist_v2_231020241713",
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
    if (response?.data?.result) return response?.data?.result;
  } catch (error) {
    console.error(
      "Error sending message:",
      error.response ? error.response.data : error.message
    );
  }
}
