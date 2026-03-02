import mongoose from "mongoose";
const sessionSchema = new mongoose.Schema({
    userId: {
        type : mongoose.Schema.Types.ObjectId,
        ref: "noteusers"
    }

});

export const Session = mongoose.model("sessions", sessionSchema)
