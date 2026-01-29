import jwt from "jsonwebtoken";

export const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role_type_id: user.role_type_id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role_type_id: user.role_type_id
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

export const generateVerificationToken = (email) => {
  return jwt.sign(
    { email, verified: true },
    process.env.VERIFICATION_TOKEN_SECRET,
    { expiresIn: process.env.VERIFICATION_TOKEN_EXPIRY }
  );
};
