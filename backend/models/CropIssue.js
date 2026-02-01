const mongoose = require('mongoose');

const CropIssueSchema = new mongoose.Schema({
	title: { type: String, required: true },
	category: { type: String, required: true },
	severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
	status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
	reportedDate: { type: Date, default: Date.now },
	location: { type: String, required: true },
	description: { type: String, required: true },
	urgency: { type: Boolean, default: false },
	images: [{ type: String }], // file paths or URLs
	farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
	replies: [{
		message: { type: String, required: true },
		senderType: { type: String, enum: ['admin', 'farmer'], required: true },
		admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
		farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },
		createdAt: { type: Date, default: Date.now }
	}],
}, { timestamps: true });

module.exports = mongoose.model('CropIssue', CropIssueSchema);