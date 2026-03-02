import { User } from "../models/userModel.js";
import jwt from "jsonwebtoken";
import "dotenv/config"

// export const isAuthenticated = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res
//         .status(401)
//         .send({ message: "access token is missing or invalid" });
//     }

//     const token = authHeader.split(" ")[1];

//     let decoded;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET);
//     } catch (err) {
//       if (err.name === "TokenExpiredError") {
//         return res.status(401).send({ message: "Access token is expired" });
//       }
//       return res
//         .status(401)
//         .send({ message: "access token is missing or invalid" });
//     }

//     const user = await User.findById(decoded.id);
//     if (!user) {
//       return res.status(403).send({ message: "user not found" });
//     }

//     req.userId = user._id;
//     next();
//   } catch (error) {
//     return res.status(500).send({ message: error.message });
//   }
// };

export const isAuthenticated = async (req, res, next) => {
  try {

    const token = req.cookies.accessToken

    if (!token) {
      return res.status(401).send({
        message: "unauthorized access"
      })
    }

    let decoded

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      return res.status(401).send({
        message: "access token expired or invalid"
      })
    }

    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(403).send({
        message: "user not found"
      })
    }

    req.userId = user._id
    next()

  } catch (error) {
    return res.status(500).send({
      message: error.message
    })
  }
}