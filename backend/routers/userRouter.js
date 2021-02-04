import express from "express";
import expressAsyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import data from "../data.js";
import User from "../models/userModel.js";
import { generateToken, isAdmin, isAuth, timedifference } from "../utils.js";
import nodemailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config();

const userRouter = express.Router();

userRouter.get(
  "/top-sellers",
  expressAsyncHandler(async (req, res) => {
    const topSellers = await User.find({ isSeller: true })
      .sort({ "seller.rating": -1 })
      .limit(3);
    res.send(topSellers);
  })
);

userRouter.get(
  "/seed",
  expressAsyncHandler(async (req, res) => {
    // await User.remove({});
    const createdUsers = await User.insertMany(data.users);
    res.send({ createdUsers });
  })
);

userRouter.post(
  "/signin",
  expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        res.send({
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          isSeller: user.isSeller,
          token: generateToken(user),
        });
        return;
      }
    }
    res.status(401).send({ message: "Invalid email or password" });
  })
);

userRouter.post(
  "/register",
  expressAsyncHandler(async (req, res) => {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
    });
    try {
      const createdUser = await user.save();
      res.send({
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        isAdmin: createdUser.isAdmin,
        isSeller: user.isSeller,
        token: generateToken(createdUser),
      });
    } catch (error) {
      for (let i in error.errors) {
        const errorMessage = error.errors[i].message,
          errorValue = error.errors[i].value;
        res.status(409).send({ message: `"${errorValue}" ${errorMessage}` });
      }
    }
  })
);

userRouter.get(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      res.send(user);
    } else {
      res.status(404).send({ message: "User Not Found" });
    }
  })
);
userRouter.put(
  "/profile",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (user.isSeller) {
        user.seller.name = req.body.sellerName || user.seller.name;
        user.seller.logo = req.body.sellerLogo || user.seller.logo;
        user.seller.description =
          req.body.sellerDescription || user.seller.description;
      }
      if (req.body.newPassword) {
        if (bcrypt.compareSync(req.body.password, user.password)) {
          user.password = bcrypt.hashSync(req.body.newPassword, 8);
        } else {
          res.status(401).send({ message: "Invalid old password" });
        }
      }
      try {
        const updatedUser = await user.save();
        res.send({
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          isAdmin: updatedUser.isAdmin,
          isSeller: user.isSeller,
          token: generateToken(updatedUser),
        });
      } catch (error) {
        for (let i in error.errors) {
          const errorMessage = error.errors[i].message,
            errorValue = error.errors[i].value;

          res.status(409).send({ message: `"${errorValue}" ${errorMessage}` });
        }
      }
    }
  })
);

userRouter.get(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const users = await User.find({});
    res.send(users);
  })
);

userRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.email === "admin@example.com") {
        res.status(400).send({ message: "Can Not Delete Admin User" });
        return;
      }
      const deleteUser = await user.remove();
      res.send({ message: "User Deleted", user: deleteUser });
    } else {
      res.status(404).send({ message: "User Not Found" });
    }
  })
);

userRouter.put(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.isSeller = Boolean(req.body.isSeller);
      user.isAdmin = Boolean(req.body.isAdmin);
      // user.isAdmin = req.body.isAdmin || user.isAdmin;
      const updatedUser = await user.save();
      res.send({ message: "User Updated", user: updatedUser });
    } else {
      res.status(404).send({ message: "User Not Found" });
    }
  })
);

userRouter.get(
  "/forgot-password/:token",
  expressAsyncHandler(async (req, res) => {
    const currentDateUnix = Date.now();
    const token = req.params.token;
    const user = await User.findOne({ resetPasswordToken: token });
    if (user) {
      if (Number(user.resetPasswordExpires) > currentDateUnix) {
        res.send({ message: `Welcome back ${user.name}, create new Password` });
      } else {
        const expirydate = Number(user.resetPasswordExpires);
        res.status(401).send({
          message: `Link expired on ${new Date(expirydate)}.`,
        });
      }
    } else {
      res.status(401).send({
        message: `Link doesnt exist.`,
      });
    }
  })
);
userRouter.put(
  "/forgot-password/:token",
  expressAsyncHandler(async (req, res) => {
    const token = req.params.token;
    const newPassword = req.body.newPassword;
    const user = await User.findOne({ resetPasswordToken: token });
    if (user) {
      user.password = bcrypt.hashSync(newPassword, 8);
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      try {
        const updatedUser = await user.save();
        res.send({
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          isSeller: user.isSeller,
          token: generateToken(user),
          message: "User Updated",
          user: updatedUser,
        });
      } catch (error) {
        for (let i in error.errors) {
          const errorMessage = error.errors[i].message,
            errorValue = error.errors[i].value;

          res.status(409).send({ message: `"${errorValue}" ${errorMessage}` });
        }
      }
      return;
    } else {
      res.status(401).send({
        message: `Link doesnt exist.`,
      });
    }
  })
);

userRouter.post(
  "/forgot-password",
  expressAsyncHandler(async (req, res) => {
    var url = req.hostname;
    const email = req.body.email;
    const user = await User.findOne({ email: email });
    const currentDateUnix = Date.now();
    if (user) {
      if (
        Number(user.resetPasswordExpires) < currentDateUnix ||
        isNaN(Number(user.resetPasswordExpires))
      ) {
        const token = generateToken(user);
        user.resetPasswordToken = token;
        user.resetPasswordExpires = currentDateUnix + 300000;
        try {
          await user.save();
          const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
              user: process.env.EMAIL_ADDRESS,
              pass: process.env.EMAIL_PASSWORD,
            },
          });
          const mailOptions = {
            from: {
              name: "TECHIEBEE Support",
              address: process.env.EMAIL_ADDRESS,
            },
            to: email,
            subject: "Password recover",
            text: `  
Click on this link to reset your password: 

http://${url}/forgot-password/${token} 
    `,
          };

          transporter.sendMail(mailOptions, (err, response) => {
            if (err) {
              res.status(404).send({ message: `${err}` });
            } else {
              res.send({
                message: `Instructions sent to ${response.accepted}`,
              });
            }
          });
        } catch (error) {
          for (let i in error.errors) {
            const errorMessage = error.errors[i].message,
              errorValue = error.errors[i].value;
            res.status(409).send({ message: `"${errorValue}" ${errorMessage}` });
          }
        }
      } else {
        const expirydate = Number(user.resetPasswordExpires);
        const expirydateleft = timedifference(expirydate);
        if (expirydateleft > 0) {
          res.status(401).send({
            message: `Email with instructions already sent. Expires in ${expirydateleft} seconds`,
          });
        } else {
          res.status(401).send({
            message: `Link already expired`,
          });
        }
      }
    } else {
      res.status(401).send({ message: "Invalid email" });
    }
  })
);

export default userRouter;
