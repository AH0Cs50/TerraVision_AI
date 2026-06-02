import { z } from 'zod';

export function emailValidator (req, res, next) {
    try {
        const { email } = req.body;

        const emailSchema = z.string().
        trim().
        toLowerCase().
        email("invalid user email");

        emailSchema.parse(email);

        next();
    } catch (err) {
        next(err);
    }
}