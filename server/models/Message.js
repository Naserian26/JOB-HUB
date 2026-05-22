const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  senderId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicationId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  text:           { type: String, required: true, trim: true },
  read:           { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);