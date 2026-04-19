import nodemailer from "nodemailer";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const verifyMail = async (verifyLink, email) => {
    try {
        // Load HBS template
        const templatePath = path.join(__dirname, "templete.hbs");
        const source = fs.readFileSync(templatePath, "utf8");
        const template = handlebars.compile(source);
        
        // Data for the template
        const replacements = {
            verifyLink: verifyLink
        };
        
        const htmlToSend = template(replacements);

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        const mailConfiguration = {
            from: `"Helplytics AI Support" <${process.env.MAIL_USER}>`,
            to: email,
            subject: "Activate Your Helplytics AI Account",
            html: htmlToSend,
        };

        const info = await transporter.sendMail(mailConfiguration);
        console.log("Verification email sent successfully: " + info.messageId);
        return info;
    } catch (error) {
        console.error("Error in verifyMail:", error);
        throw error;
    }
};