import { z } from 'zod';

export function emailValidator (req, res, next) {
    try {
        const { user_email } = req.body;

        const emailSchema = z.string().
        trim().
        toLowerCase().
        email("invalid user email");

        const valid_email = z.parse(emailSchema,user_email)

        if(!valid_email) throw new Error("not valid email");

        next();
        
    }catch(err) {
        next(err);
    }

}