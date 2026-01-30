import { Client } from "@microsoft/microsoft-graph-client";
import { ClientSecretCredential } from "@azure/identity";
import env from "dotenv";
env.config();

const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;
const senderEmail = "noreply@signpubliq.com";

const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

export const sendMail = async ({ to, subject, text, html }) => {
  try {
    const client = Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async () => {
          const token = await credential.getToken("https://graph.microsoft.com/.default");
          return token.token;
        },
      },
    });

    const message = {
      message: {
        subject,
        body: {
          contentType: html ? "HTML" : "Text",
          content: html || text,
        },
        toRecipients: [
          {
            emailAddress: { address: to },
          },
        ],
      },
      saveToSentItems: "false",
    };

    await client.api(`/users/${senderEmail}/sendMail`).post(message);

    console.log(`Email sent via Microsoft Graph to ${to}`);
  } catch (error) {
    console.error("Error sending email via Microsoft Graph:", error);
    throw error;
  }
};

