type NotificationCampaignPayload = {
  campaignName: string;
  recipients: string[];
  message: string;
};

export async function processNotificationCampaign(
  payload: NotificationCampaignPayload
) {
  if (!payload.campaignName) {
    throw new Error("Campaign name is required");
  }

  if (!payload.recipients?.length) {
    throw new Error("Campaign requires at least one recipient");
  }

  if (!payload.message) {
    throw new Error("Campaign message is required");
  }

  let sent = 0;

  for (const recipient of payload.recipients) {
    console.log(`[NOTIFICATION] Sending to ${recipient}`);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    sent++;

    console.log(`[NOTIFICATION] Sent to ${recipient}`);
  }

  return {
    campaignName: payload.campaignName,
    totalRecipients: payload.recipients.length,
    sent,
    message: payload.message,
    completedAt: new Date().toISOString(),
  };
}