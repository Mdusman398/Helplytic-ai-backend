import nodemailer from "nodemailer"
import "dotenv/config"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import handlebars from "handlebars"
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const emailTempleteSource = fs.readFileSync(
    path.join(__dirname, "templete.hbs"),
    "utf-8"
)
const templete = handlebars.compile(emailTempleteSource)

export const verifyMail = async(token,email) => {
    const htmlToSend = templete({ token: token })
    const transporter = nodemailer.createTransport({
        service:"gmail",
        auth: {
            user:process.env.MAIL_USER,
            pass:process.env.MAIL_PASS
        }
    })

    const mailConfiguration = {
        from: process.env.MAIL_USER,
        to: email,
        subject: "Email Verification",
        html: htmlToSend,
    }

    await transporter.sendMail(mailConfiguration)
    console.log("Email sent successfully")
}