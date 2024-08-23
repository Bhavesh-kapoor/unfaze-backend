import {Router} from 'express';
const faqrouter = Router();
import { validateFaq, store,read ,deleteFaq,activeOrDeactivate , edit, update} from '../../controllers/admin/FaqController.js';
faqrouter.post('/store',validateFaq,store);
faqrouter.get('/all',read);
faqrouter.put('/activate-deactivate/:_id',activeOrDeactivate);
faqrouter.put('/edit/:_id',edit);
faqrouter.delete('/delete/:_id',deleteFaq);
faqrouter.put('/update',validateFaq,update);


export default faqrouter;