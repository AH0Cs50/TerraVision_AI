import { Router } from 'express';
import { authenticate } from './../middlewares/auth.middleware.js';

const router = Router();

//get user data by id
router.get('/:id',(req,res,next)=>{})
//update user id
router.put('/:id',(req,res,next)=>{});
//delete user by id
router.delete('/:id',(req,res,next)=>{});//specified for admin
//send verify link to email
router.post('/email',authenticate,(req,res,next)=>{}); 
// make user active
router.get('/email',authenticate,(req,res,next)=>{}); 

export default router;