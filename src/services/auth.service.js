import pool from "../db/postgres.js";
import crypto from "crypto";

class AuthService {

    // Store OTP in database
    static async storeOtp(email, otp) {
        // Schema: otp_log_id, otp_log_type, otp, account_email, created_by, created_date_time
        const client = await pool.connect();
        try {
            const query = `
                INSERT INTO otp_logs (account_email, otp, otp_log_type, created_date_time)
                VALUES ($1, $2, 'EMAIL_VERIFICATION', NOW())
                RETURNING *
            `;
            await client.query(query, [email, otp]);
        } catch (error) {
            console.error("Error storing OTP:", error);
            throw new Error("Database error while storing OTP");
        } finally {
            client.release();
        }
    }

    // Verify OTP
    static async verifyOtp(email, otp) {
        const client = await pool.connect();
        try {
            // No is_verified column. Check existence within 10 mins window.
            // Optionally could store verified records elsewhere or delete them, but simpler to just check.
            const query = `
                SELECT * FROM otp_logs 
                WHERE account_email = $1 
                  AND otp = $2 
                  AND created_date_time > NOW() - INTERVAL '10 minutes'
                ORDER BY created_date_time DESC 
                LIMIT 1
            `;
            const result = await client.query(query, [email, otp]);

            if (result.rows.length === 0) {
                return false;
            }

            // Since we don't have is_verified, we can't mark it. 
            // We rely on the short 10-minute window and perhaps application logic (token generation) to be singular.
            return true;
        } catch (error) {
            console.error("Error verifying OTP:", error);
            throw new Error("Database error while verifying OTP");
        } finally {
            client.release();
        }
    }

    // Create User Transaction
    static async createUser({ email, passwordHash, firstName, lastName, phone, roleTypeId, entryDate }) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Insert into user_details (Metadata)
            // Schema: user_id, role_type_id, email_verified, created_by, created_date
            const userDetailsQuery = `
                INSERT INTO user_details 
                (role_type_id, email_verified, created_date, created_by)
                VALUES ($1, $2, $3, 0)
                RETURNING user_id
            `;
            const userResult = await client.query(userDetailsQuery, [roleTypeId, true, entryDate]);
            const userId = userResult.rows[0].user_id;

            // 2. Insert into user_profile (Personal Info)
            // Schema: user_id, first_name, last_name, email, phone_number, created_date, updated_date
            const profileQuery = `
                INSERT INTO user_profile
                (user_id, first_name, last_name, email, phone_number, created_date)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;
            await client.query(profileQuery, [
                userId,
                firstName,
                lastName,
                email,
                phone, // This variable holds the phone number value
                entryDate
            ]);

            // 3. Insert into login_details (Credentials)
            // Schema: user_id, user_name, password, active, created_date
            const loginQuery = `
                INSERT INTO login_details
                (user_id, user_name, password, active, created_date)
                VALUES ($1, $2, $3, $4, $5)
            `;
            await client.query(loginQuery, [
                userId,
                email,
                passwordHash,
                true,
                entryDate
            ]);

            await client.query('COMMIT');
            return { user_id: userId, email };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error("Error creating user:", error);
            throw error; // Propagate error (e.g. duplicate email)
        } finally {
            client.release();
        }
    }

    // Check if user exists
    static async userExists(email) {
        const client = await pool.connect();
        try {
            // Check against user_name (which holds the email)
            const result = await client.query('SELECT 1 FROM login_details WHERE user_name = $1', [email]);
            return result.rows.length > 0;
        } finally {
            client.release();
        }
    }
    // Get user for login
    static async loginUser(email) {
        const client = await pool.connect();
        try {
            const query = `
                SELECT 
                    l.user_id, 
                    l.password, 
                    l.active,
                    u.role_type_id, 
                    p.first_name, 
                    p.last_name, 
                    p.email
                FROM login_details l
                JOIN user_details u ON l.user_id = u.user_id
                JOIN user_profile p ON l.user_id = p.user_id
                WHERE l.user_name = $1
            `;
            const result = await client.query(query, [email]);
            return result.rows[0];
        } finally {
            client.release();
        }
    }
}

export default AuthService;
