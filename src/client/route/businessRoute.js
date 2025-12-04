import { Router } from 'express';
import { 
    businessLogIn,
    returnBusinessData
} from "../controller/businessController.js";
import { requireAuth } from "../../middlewares/authJWT.js";

const r = Router();

r.post('/business-login', businessLogIn);
r.get('/business-data', requireAuth, returnBusinessData);

export default r;
