import AuthService from "../services/auth.service.js";
import EmailService from "../services/email.service.js";
import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../lib/password.utils.js";

import { generateVerificationToken, generateTokens } from "../lib/generateTokens.js";
import { encryptJson, decryptToJson } from "../lib/crypto.js";


const initiateSignup = async (req, res) => {
    try {
        console.log("--- [initiateSignup] Request received ---");

        if (!req.body || !req.body.data) {
            console.log("[initiateSignup] Error: req.body or req.body.data is missing");
            return res.status(400).json({ data: encryptJson({ message: "Encrypted data is required (Check Content-Type header)" }) });
        }

        const { data } = req.body;

        const decryptedData = decryptToJson(data);
        if (!decryptedData) return res.status(400).json({ message: "Invalid encryption" });

        const { email } = decryptedData;
        console.log(`[initiateSignup] Email provided: ${email}`);

        if (!email) {
            console.log("[initiateSignup] Error: Email is missing");
            return res.status(400).json({ data: encryptJson({ message: "Email is required" }) });
        }

        // Check if user already exists
        console.log("[initiateSignup] Checking if user exists in DB...");
        const exists = await AuthService.userExists(email);
        if (exists) {
            console.log("[initiateSignup] User already exists.");
            return res.status(409).json({ data: encryptJson({ message: "User with this email already exists" }) });
        }
        console.log("[initiateSignup] User does not exist. Proceeding.");

        const otp = EmailService.generateOtp();
        console.log("[initiateSignup] OTP generated.");

        // Store OTP
        console.log("[initiateSignup] Storing OTP in DB...");
        await AuthService.storeOtp(email, otp);
        console.log("[initiateSignup] OTP stored.");

        // Send email
        console.log("[initiateSignup] Sending email via Microsoft Graph...");
        await EmailService.sendOtpEmail(email, otp);
        console.log("[initiateSignup] Email sent successfully.");

        res.status(200).json({ data: encryptJson({ message: "OTP sent successfully to your email." }) });
    } catch (error) {
        console.error("[initiateSignup] CRITICAL ERROR:", error);
        res.status(500).json({ data: encryptJson({ message: error.message }) });
    }
};

const verifyEmail = async (req, res) => {
    try {
        console.log("--- [verifyEmail] Request received ---");

        const { data } = req.body;
        if (!data) return res.status(400).json({ message: "Encrypted data is required" });

        const decryptedData = decryptToJson(data);
        if (!decryptedData) return res.status(400).json({ message: "Invalid encryption" });

        const { email, otp } = decryptedData;
        console.log(`[verifyEmail] Email: ${email}, OTP: ${otp ? "Provided" : "Missing"}`);

        if (!email || !otp) {
            console.log("[verifyEmail] Error: Missing email or OTP");
            return res.status(400).json({ data: encryptJson({ message: "Email and OTP are required" }) });
        }

        console.log("[verifyEmail] Verifying OTP against DB...");
        const isValid = await AuthService.verifyOtp(email, otp);
        if (!isValid) {
            console.log("[verifyEmail] OTP invalid or expired.");
            return res.status(400).json({ data: encryptJson({ message: "Invalid or expired OTP" }) });
        }
        console.log("[verifyEmail] OTP verified successfully.");

        // Generate a temporary token to prove email is verified
        // Valid for limited time (configured in env) to allow them to complete the form
        console.log("[verifyEmail] Generating verification token...");
        const verificationToken = generateVerificationToken(email);
        console.log("[verifyEmail] Token generated.");

        res.status(200).json({
            data: encryptJson({
                message: "Email verified successfully.",
                verificationToken
            })
        });
    } catch (error) {
        console.error("[verifyEmail] CRITICAL ERROR:", error);
        res.status(500).json({ data: encryptJson({ message: "Internal server error" }) });
    }
};

const signup = async (req, res) => {
    try {
        console.log("--- [signup] Request received ---");

        const { data } = req.body;
        if (!data) return res.status(400).json({ message: "Encrypted data is required" });

        const decryptedData = decryptToJson(data);
        if (!decryptedData) return res.status(400).json({ message: "Invalid encryption" });

        const {
            email,
            password,
            firstName,
            lastName,
            phone,
            roleTypeId, // Dynamic role ID from frontend
            verificationToken
        } = decryptedData;

        console.log(`[signup] Email: ${email}, Role: ${roleTypeId}, Token Provided: ${!!verificationToken}`);

        if (!verificationToken) {
            console.log("[signup] Error: No verification token.");
            return res.status(401).json({ data: encryptJson({ message: "Verification token missing. Please verify email first." }) });
        }

        // Verify the token
        console.log("[signup] Verifying token signature...");
        let decoded;
        try {
            decoded = jwt.verify(verificationToken, process.env.VERIFICATION_TOKEN_SECRET);
            console.log("[signup] Token signature valid.");
        } catch (err) {
            console.log("[signup] Error: Invalid token signature/expired.");
            return res.status(401).json({ data: encryptJson({ message: "Invalid or expired verification token" }) });
        }

        if (decoded.email !== email || !decoded.verified) {
            console.log(`[signup] Error: Token mismatch. Token Email: ${decoded.email}, Body Email: ${email}`);
            return res.status(401).json({ data: encryptJson({ message: "Token does not match provided email" }) });
        }
        console.log("[signup] Token payload verified match.");

        if (!password || !firstName || !lastName || !roleTypeId) {
            console.log("[signup] Error: Missing required fields.");
            return res.status(400).json({ data: encryptJson({ message: "Missing required fields" }) });
        }

        // Hash password
        console.log("[signup] Hashing password...");
        const passwordHash = await hashPassword(password);
        console.log("[signup] Password hashed.");

        // Create user
        console.log("[signup] Creating user transaction in DB...");
        const newUser = await AuthService.createUser({
            email,
            passwordHash,
            firstName,
            lastName,
            phone,
            roleTypeId,
            entryDate: new Date()
        });
        console.log(`[signup] User created successfully. ID: ${newUser.user_id}`);

        res.status(201).json({
            data: encryptJson({
                message: "User registered successfully",
                user: newUser
            })
        });

    } catch (error) {
        console.error("[signup] CRITICAL ERROR:", error);
        res.status(500).json({ data: encryptJson({ message: error.message }) });
    }
};

const login = async (req, res) => {
    try {
        console.log("--- [login] Request received ---");

        const { data } = req.body;
        if (!data) return res.status(400).json({ message: "Encrypted data is required" });

        const decryptedData = decryptToJson(data);
        if (!decryptedData) return res.status(400).json({ message: "Invalid encryption" });

        const { email, password, roleTypeId } = decryptedData;
        console.log(`[login] Email: ${email}, Role: ${roleTypeId}`);

        if (!email || !password || !roleTypeId) {
            return res.status(400).json({ data: encryptJson({ message: "Email, password, and roleTypeId are required" }) });
        }

        // 1. Fetch user by email
        const user = await AuthService.loginUser(email);
        if (!user) {
            console.log("[login] User not found.");
            return res.status(401).json({ data: encryptJson({ message: "Invalid credentials" }) });
        }

        // 2. Check Password
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            console.log("[login] Invalid password.");
            return res.status(401).json({ data: encryptJson({ message: "Invalid credentials" }) });
        }

        // 3. Check Role Match
        if (Number(user.role_type_id) !== Number(roleTypeId)) {
            console.log(`[login] Role mismatch. Expected: ${roleTypeId}, Actual: ${user.role_type_id}`);
            return res.status(403).json({ data: encryptJson({ message: "Unauthorized: Role mismatch" }) });
        }

        // 4. Check Active Status (Optional but good practice)
        if (!user.active) {
            return res.status(403).json({ data: encryptJson({ message: "Account is inactive" }) });
        }

        console.log("[login] Credentials and Role verified.");

        // 5. Generate Tokens
        const tokenUser = {
            user_id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role_type_id: user.role_type_id
        };
        const tokens = generateTokens(tokenUser);
        console.log("[login] Tokens generated.");

        res.status(200).json({
            data: encryptJson({
                message: "Login successful",
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken
            })
        });

    } catch (error) {
        console.error("[login] CRITICAL ERROR:", error);
        res.status(500).json({ data: encryptJson({ message: error.message }) });
    }
};

export { initiateSignup, verifyEmail, signup, login };
