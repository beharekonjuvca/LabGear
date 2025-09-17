import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { config } from "../config.js";

export const signAccess = (p) =>
  jwt.sign(p, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
export const signRefresh = (p) =>
  jwt.sign(p, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
export const verifyAccess = (t) => jwt.verify(t, config.jwt.secret);
export const verifyRefresh = (t) => jwt.verify(t, config.jwt.refreshSecret);

export async function hashPassword(pw) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}
export async function comparePassword(pw, hash) {
  return bcrypt.compare(pw, hash);
}
