import pool from "../db/postgres.js";

class DashboardService {
    static async getSummaryByUserId(userId) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT 
                    dashboard_id,
                    user_id,
                    total_envelopes,
                    drafts_count,
                    sent_count,
                    completed_count,
                    declined_count,
                    expired_count,
                    created_date,
                    updated_date
                FROM dashboard_summary
                WHERE user_id = $1
            `;
            const result = await client.query(query, [userId]);

            // If no record exists, optionally return a default object or null
            return result.rows[0] || null;
        } catch (error) {
            console.error("Error fetching dashboard summary:", error);
            throw new Error("Database error while fetching dashboard summary");
        } finally {
            client.release();
        }
    }
}

export default DashboardService;
