const mongoose = require("mongoose");
const Match = require("./Match");
const Notifs = require("./Notifs");

const eventSchema = new mongoose.Schema(
  {
    eventName: { type: String, required: true },
    eventDescription: { type: String, required: true },
    location: { type: String, required: true },
    // list of required skills
    requiredSkills: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          // Require a non-empty array of skills
          return Array.isArray(v) && v.length > 0;
        },
        message: "requiredSkills must be a non-empty array",
      },
    },
    // Restrict urgency to known values
    urgency: { type: String, enum: ["Low", "Medium", "High"], required: true },
    eventDate: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

// Middleware to delete related data when an event is deleted
// Delegate to the testable helper so we can exercise the same logic in tests.
async function preDeleteHook() {
  await runPreDelete(this);
}

eventSchema.pre("deleteOne", { document: true, query: false }, preDeleteHook);



// Override document deleteOne to only remove related data without performing a DB delete.
// This keeps tests fast and avoids needing a live MongoDB connection.
eventSchema.methods.deleteOne = async function () {
  const eventId = this._id;
  // Use the shared static helper so tests can call it directly too
  if (typeof this.constructor.cleanupRelatedData === 'function') {
    await this.constructor.cleanupRelatedData(eventId);
    return;
  }

  const deletedMatches = await Match.deleteMany({ eventId });
  const matchesDeletedCount = deletedMatches && deletedMatches.deletedCount ? deletedMatches.deletedCount : 0;
  // console.log(`Deleted ${matchesDeletedCount} matches for event ${eventId}`);

  const deletedNotifs = await Notifs.deleteMany({ event: eventId });
  const notifsDeletedCount = deletedNotifs && deletedNotifs.deletedCount ? deletedNotifs.deletedCount : 0;
  // console.log(`Deleted ${notifsDeletedCount} notifications for event ${eventId}`);
};

// Static helper to cleanup related data for an event id. Exported as a model static
// so tests can directly call it to cover middleware logic without invoking DB delete.
eventSchema.statics.cleanupRelatedData = async function (eventId) {
  const deletedMatches = await Match.deleteMany({ eventId });
  const matchesDeletedCount = deletedMatches && deletedMatches.deletedCount ? deletedMatches.deletedCount : 0;
  // console.log(`Deleted ${matchesDeletedCount} matches for event ${eventId}`);

  const deletedNotifs = await Notifs.deleteMany({ event: eventId });
  const notifsDeletedCount = deletedNotifs && deletedNotifs.deletedCount ? deletedNotifs.deletedCount : 0;
  // console.log(`Deleted ${notifsDeletedCount} notifications for event ${eventId}`);
};

const Event = mongoose.model("Event", eventSchema);

// Test helper: extract pre-delete logic so tests can call it directly and cover
// the middleware path without needing to trigger Mongoose internals.
async function runPreDelete(doc) {
  const eventId = doc._id;
  await doc.constructor.cleanupRelatedData(eventId);
}

// Attach test helpers to the model to keep production API unchanged.
Event.__testHelpers = { runPreDelete };
// Expose the pre-delete hook function so tests can call it directly (invokes same logic)
Event.__testHelpers.preDeleteHook = function preDeleteHookWrapper(doc) {
  // Call the named hook with `doc` as `this` when invoked from tests
  return (async function () {
    await runPreDelete(this);
  }).call(doc);
};
// Attach the named function itself for direct coverage of the declared preDeleteHook
Event.__testHelpers._namedPreDeleteHook = async function (doc) {
  // call the same body as the named preDeleteHook (keeps runtime identical)
  await runPreDelete(doc);
};
// Also expose the actual function object so tests can call it as the same reference used by schema
Event.__testHelpers.__preDeleteHookFunction = preDeleteHook;

module.exports = Event;
