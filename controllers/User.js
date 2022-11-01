import { User } from "../models/users.js";
import { sendMail } from "../utils/sendMail.js";
import { sendToken } from "../utils/sendToken.js";
import cloudinary from "cloudinary";
import fs from "fs";

/******************************************************************* */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const avatar = req.files.avatar.tempFilePath;
    
    let user = await User.findOne({email});
    if(user) {
      return res
        .status(400)
        .json({ success: false, message:"User already exists!"});
    }

    const otp = Math.floor(Math.random() * 100000);

    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: "toDoApp",
    });

    fs.rmSync("./tmp", { recursive: true});

    user = await User.create({
      name,
      email,
      password,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
      otp,
      otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000)
    });

    await sendMail(email, "Verify your account", `Your OTP is ${otp}`);

    sendToken(
      res, 
      user, 
      201, 
      "OTP sent to your email, please verify your account"
    );


  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/******************************************************************* */
export const verifyAccount = async (req, res) => {
  try {
    const otp = Number(req.body.otp);
    const user = await User.findById(req.user._id);
    if(user.otp !== opt || user.otp_expiry < Date.now()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP or has been Expired!" });
    }
    user.verified = true;
    user.otp = null;
    user.otp_expiry = null;
    await user.save();
    sendToken(res, user, 200, "Account verified successfully");
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/******************************************************************* */
export const login = async (req, res) => {
  try {
    const {email, password } = req.body;
    if(!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter all fields" });
    }

    const user = await User.findOne({email}).select("+password");
    if(user) {
      return res
        .status(400)
        .json({ success: false, message:"Invalid Email or Password!"});
    }

    const isPasswordMatched = await user.comparePassword(password);
    if(!isPasswordMatched) {
      return res
        .status(400)
        .json({ success: false, message:"Invalid Email or Password!"});
    }

    sendToken(
      res, 
      user, 
      200, 
      "Login Successful"
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/******************************************************************* */
export const logOut = async (req, res) => {
  try {
    res
      .status(200)
      .cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true
      })
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/******************************************************************* */
export const addTask = async (req, res) => {
  try {
    const { title, description} = req.body;
    const user = await User.findById(req.user._id);
    user.task.push({
      title,
      description,
      completed: false,
      createdAt: Date.now()
    });
    await user.save();
    res.status(200).json({ success: true, message: "Task added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/******************************************************************* */
export const removeTask = async (req, res) => {
  try {
    const { taskid } = req.params;
    const user = await User.findById(req.user._id);
    user.task = user.task.filter(task => task._id.toString() !== taskid);
    await user.save();
    res.status(200).json({ success: true, message: "Task removed successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/******************************************************************* */
export const updateTask = async (req, res) => {
  try {
    const { taskid } = req.params;
    const user = await User.findById(req.user._id);
    user.task = user.task.find(
      task => task._id.toString() === taskid.toString()
    );
    user.task.completed = !user.task.completed;
    await user.save();
    res.status(200).json({ success: true, message: "Task updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/******************************************************************* */
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    sendToken(
      res, 
      user, 
      201, 
      `Welcome ${user.name}`
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/******************************************************************* */
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const { name } = req.body;
    const avatar = req.files.avatar.tempFilePath;

    if(name) user.name = name;
    if(avatar) {
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      const myCloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: "toDoApp",
      });

      fs.rmSync("./tmp", { recursive: true});
      
      user.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }
    await user.save();
    res.status(200).json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/******************************************************************* */
export const updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+password");
    const { oldPassword, newPassword } = req.body;
    if(!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter all fields" });
    }
    const isPasswordMatched = await user.comparePassword(oldPassword);
    if(!isPasswordMatched) {
      return res
        .status(400)
        .json({ success: false, message:"Invalid Password!"});
    }
    user.password = newPassword;
    await user.save();
    res
    .status(200)
    .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/******************************************************************* */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({email});
    if(!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.resetPasswordOTP = otp;
    user.resetPasswordOTP_expiry = Date.now() + 10 * 60 * 1000;
    await user.save();
    const message = `Your OTP to reset password is ${otp}
          If you did not request this, please ignore this email.`;
    await sendMail(email, "Reset Password", message);
    res
    .status(200)
    .json({ success: true, message: `OTP sent to ${email}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/******************************************************************* */
export const resetPassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordOTP: otp,
      resetPasswordOTPExpiry: { $gt: Date.now() }
    }).select("+password");
    
    if(!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP or has been Expired!" });
    }

    user.password = newPassword;
    user.resetPasswordOTP = null;
    user.resetPasswordOTP_expiry = null;
    await user.save();

    res
    .status(200)
    .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};