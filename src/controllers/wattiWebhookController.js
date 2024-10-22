export const getTemplateMessage = async (req, res) => {
  const webhookData = req.body;
  console.log("Received webhook data:", webhookData);
  res.status(200).send("Webhook received successfully");
};
