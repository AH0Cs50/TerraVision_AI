import { Router } from 'express';

const router = Router(); //protected router so have user via middleware

//get all planets for user 
router.get('',(req,res,next)=>{});
// planet by id 
router.get('/:id',(req,res,next)=>{});

//create new planet
router.post('',(req,res,next)=>{});
//upload photo to detect
router.post('/:id/detect',(req,res,next)=>{});
//detect if plant have diagnosis
router.post('/:id/diagnosis',(req,res,next)=>{});
//analyze based on plant envioroment conditions (Weather, soil, plant_age)
//and save history 
router.post('/:id/analyze',(req,res,next)=>{});

//use it as general feature 
router.post('/detect',(req,res,next)=>{});
router.post('/diagnosis',(req,res,next)=>{});

//update some planet profile by id 
router.put('/:id',(req,res,next)=>{});

//delete planet by id
router.delete('/:id',(req,res,next)=>{});

export default router;