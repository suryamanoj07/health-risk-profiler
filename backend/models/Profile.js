import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema({
  // Basic survey data
  age: {
    type: Number,
    required: true
  },
  smoker: {
    type: Boolean,
    required: true
  },
  exercise: {
    type: String,
    required: true,
    enum: ['rarely', 'occasionally', 'regularly']
  },
  diet: {
    type: String,
    required: true,
    enum: ['high sugar', 'balanced', 'high fat', 'vegetarian']
  },
  
  // OCR data (if applicable)
  ocrData: {
    rawText: String,
    confidence: Number,
    missingFields: [String]
  },
  
  // Analysis results
  riskFactors: [String],
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  rationale: [String],
  recommendations: [String],
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
ProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Profile', ProfileSchema);
