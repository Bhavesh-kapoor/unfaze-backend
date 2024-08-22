  import { allUser } from "../../controllers/admin/user.controller.js"; 
  import { Router } from "express";

  const router = Router()
  router.get("/user-list",allUser)

  export default router;