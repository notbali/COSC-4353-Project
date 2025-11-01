const mongoose = require("mongoose");
const Schema = mongoose.Schema; // Import Schema from mongoose

const notifsSchema = new Schema(
  {
    title: { type: String },
    message: { type: String }, // keep route's message
    event: {
      type: Schema.Types.ObjectId,
      ref: "EventDetails",
      required: false,
    },
    eventName: { type: String },
    eventDescription: { type: String }, // Add description
    location: { type: String }, // Add location
    eventDate: { type: Date }, // Add date
    user: {
      type: Schema.Types.ObjectId,
      ref: "UserCredentials",
      required: false,
    },
  },
  { timestamps: true }
); // adding createdAt/updatedAt fields

const Notifs = mongoose.model("Notifs", notifsSchema);

module.exports = Notifs;
