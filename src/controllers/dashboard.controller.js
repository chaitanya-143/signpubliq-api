import DashboardService from "../services/dashboard.service.js";
import { encryptJson, decryptToJson } from "../lib/crypto.js";

const getDashboardSummary = async (req, res) => {
    try {
        console.log("--- [getDashboardSummary] Request received ---");

        // User ID passed in the URL (Encrypted)
        const { userId: encryptedUserId } = req.params;

        console.log(`[getDashboardSummary] raw params: ${encryptedUserId}`);

        const userId = decryptToJson(decodeURIComponent(encryptedUserId));

        if (!userId) {
            return res.status(400).json({ data: encryptJson({ message: "Invalid encrypted User ID" }) });
        }
        console.log(`[getDashboardSummary] Fetching summary for User ID: ${userId}`);
        const summary = await DashboardService.getSummaryByUserId(userId);

        if (!summary) {
            console.log("[getDashboardSummary] No summary found for this user.");
            // Optionally decide if you want to return 404 or just empty data
            // For now, let's return a default structure or 404
            return res.status(404).json({ data: encryptJson({ message: "Dashboard data not found" }) });
        }

        console.log("[getDashboardSummary] Data fetched successfully.");
        res.status(200).json({
            data: encryptJson({
                message: "Dashboard summary fetched successfully",
                summary
            })
        });

    } catch (error) {
        console.error("[getDashboardSummary] CRITICAL ERROR:", error);
        res.status(500).json({ data: encryptJson({ message: "Internal server error" }) });
    }
};

export { getDashboardSummary };
