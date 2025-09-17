import { body } from "express-validator";

export const registerSchema = [
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  body("full_name").isLength({ min: 2 }),
];

export const loginSchema = [
  body("email").isEmail(),
  body("password").notEmpty(),
];

export const itemCreateSchema = [
  body("name").isLength({ min: 2 }),
  body("code").isLength({ min: 2 }),
  body("category").isLength({ min: 2 }),
];
