import {Router} from 'express';
const faqrouter = Router();
import { validateFaq, store,read ,deleteFaq,getById, update} from '../../controllers/admin/FaqController.js';
faqrouter.post('/store',validateFaq,store);
faqrouter.get('/all',read);
faqrouter.get('/get-one/:_id',getById);
faqrouter.delete('/delete/:_id',deleteFaq);
faqrouter.put('/update/:id',validateFaq,update);

export default faqrouter;