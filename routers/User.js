import express from "express";
import { addTask, forgotPassword, getMyProfile, login, logOut, register, removeTask, resetPassword, updatePassword, updateProfile, updateTask, verifyAccount } from "../controllers/User.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

//1.  /api/v1/register
router.route("/register").post(register);

//2.  http://localhost:4000/api/v1/verify
router.route("/verify").post(isAuthenticated, verifyAccount);

//3.  http://localhost:4000/api/v1/login
router.route("/login").post(login);

//4.  http://localhost:4000/api/v1/logout
router.route("/logout").get(logOut);

//5.  http://localhost:4000/api/v1/newtask
router.route("/newtask").post(isAuthenticated, addTask);

//6.  http://localhost:4000/api/v1/me
router.route("/me").get(isAuthenticated, getMyProfile); 

//7.  http://localhost:4000/api/v1/task/5f9f1b1b8b1b8b1b8b1b8b1b
router
  .route("/task/:taskid") 
  .get(isAuthenticated, updateTask)
  .delete(isAuthenticated, removeTask);

//8.  http://localhost:4000/api/v1/updateprofile
router.route("/updateprofile").put(isAuthenticated, updateProfile);

//9.  http://localhost:4000/api/v1/updatepassword
router.route("/updatepassword").put(isAuthenticated, updatePassword); 

//10. http://localhost:4000/api/v1/forgotpassword
router.route("/forgotpassword").put(forgotPassword); 

//11. http://localhost:4000/api/v1/resetpassword
router.route("/resetpassword").put(resetPassword); 

export default router;

