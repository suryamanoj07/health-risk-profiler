import Tesseract from 'tesseract.js';
import multer from 'multer';
import Profile from '../models/Profile.js';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// OCR Service - Step 1: Extract text from images
const processOCR = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No image file provided"
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid file type. Please upload a valid image file (JPG, PNG, GIF, BMP, TIFF)"
      });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        status: "error",
        message: "File too large. Please upload an image smaller than 10MB"
      });
    }

    console.log('Starting OCR processing...');
    const { data: { text, confidence } } = await Tesseract.recognize(
      req.file.buffer,
      'eng',
      {
        logger: m => console.log(m)
      }
    );

    console.log('OCR Raw Text:', text);
    console.log('OCR Confidence:', confidence);

    // Check if OCR extracted any meaningful text
    if (!text || text.trim().length < 10) {
      return res.status(400).json({
        status: "error",
        message: "No readable text found in the image. Please ensure the image contains clear, readable text."
      });
    }

    // Check if the text contains health survey related keywords
    const healthKeywords = ['age', 'smoker', 'exercise', 'diet', 'health', 'survey', 'risk'];
    const textLower = text.toLowerCase();
    const hasHealthKeywords = healthKeywords.some(keyword => textLower.includes(keyword));
    
    if (!hasHealthKeywords) {
      return res.status(400).json({
        status: "error",
        message: "This doesn't appear to be a health survey form. Please upload an image containing a health survey with fields like Age, Smoker, Exercise, and Diet."
      });
    }

    // Parse the OCR text to extract structured data
    const parsedData = parseOCRText(text);
    
    // Check if we extracted any meaningful data
    if (Object.keys(parsedData.answers).length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Could not extract survey data from the image. Please ensure the form follows the expected format: 'Age: 42', 'Smoker: yes', etc."
      });
    }

    // Convert Tesseract confidence from percentage to decimal (0-1)
    const tesseractConfidence = confidence ? confidence / 100 : 0.5;
    
    res.json({
      answers: parsedData.answers,
      missing_fields: parsedData.missing_fields,
      confidence: Math.min(1.0, Math.max(0.0, Math.max(parsedData.confidence, tesseractConfidence))),
      raw_text: text
    });

  } catch (error) {
    console.error('OCR Error:', error);
    
    // Handle specific OCR errors
    if (error.message.includes('Tesseract')) {
      return res.status(500).json({
        status: "error",
        message: "OCR engine error. Please try with a different image or contact support."
      });
    }
    
    if (error.message.includes('timeout')) {
      return res.status(408).json({
        status: "error",
        message: "OCR processing timed out. Please try with a smaller or clearer image."
      });
    }

    res.status(500).json({
      status: "error",
      message: "OCR processing failed. Please try again with a clearer image."
    });
  }
};

// Text Parser - Extract structured data from OCR text
const parseOCRText = (text) => {
  const answers = {};
  const missing_fields = [];
  let confidence = 0.9; // Base confidence for OCR
  
  // Define patterns for extracting data
  const patterns = {
    age: /age[:\s]*(\d+)/i,
    smoker: /smoker[:\s]*(yes|no|true|false)/i,
    exercise: /exercise[:\s]*(rarely|occasionally|regularly|daily|weekly)/i,
    diet: /diet[:\s]*(high sugar|balanced|high fat|vegetarian|low carb)/i
  };

  // Extract each field
  Object.keys(patterns).forEach(field => {
    const match = text.match(patterns[field]);
    if (match) {
      if (field === 'age') {
        answers[field] = parseInt(match[1]);
      } else if (field === 'smoker') {
        answers[field] = ['yes', 'true'].includes(match[1].toLowerCase());
      } else {
        answers[field] = match[1].toLowerCase();
      }
    } else {
      missing_fields.push(field);
    }
  });

  // Adjust confidence based on missing fields
  confidence = Math.max(0.5, confidence - (missing_fields.length * 0.1));

  return { answers, missing_fields, confidence };
};

// Enhanced Survey Parser - Step 1: Parse text input
const parseSurvey = (req, res) => {
  const { age, smoker, exercise, diet } = req.body;

  const totalFields = 4;
  let missingFields = [];
  if (!age) missingFields.push("age");
  if (smoker === undefined) missingFields.push("smoker");
  if (!exercise) missingFields.push("exercise");
  if (!diet) missingFields.push("diet");

  // Guardrail: Exit if >50% fields missing
  if (missingFields.length > totalFields / 2) {
    return res.json({
      status: "incomplete_profile",
      reason: ">50% fields missing"
    });
  }

  // Step 2: Factor Extraction
  const factors = extractRiskFactors({ age, smoker, exercise, diet });
  
  // Step 3: Risk Classification
  const riskAnalysis = calculateRiskScore({ age, smoker, exercise, diet, factors });
  
  // Step 4: Generate Recommendations
  const recommendations = generateRecommendations(factors, riskAnalysis.risk_level);

  res.json({
    risk_level: riskAnalysis.risk_level,
    score: riskAnalysis.score,
    factors,
    recommendations,
    rationale: riskAnalysis.rationale,
    status: "ok"
  });
};

// Step 2: Enhanced Factor Extraction
const extractRiskFactors = (data) => {
  const factors = [];
  const { age, smoker, exercise, diet } = data;

  // Smoking factors
  if (smoker) {
    factors.push("smoking");
  }

  // Exercise factors
  if (exercise === "rarely") {
    factors.push("low exercise");
  } else if (exercise === "occasionally") {
    factors.push("moderate exercise");
  }

  // Diet factors
  if (diet === "high sugar") {
    factors.push("poor diet");
  } else if (diet === "high fat") {
    factors.push("high fat diet");
  }

  // Age-related factors
  if (age && age > 65) {
    factors.push("advanced age");
  } else if (age && age > 50) {
    factors.push("middle age");
  }

  return factors;
};

// Step 3: Enhanced Risk Classification
const calculateRiskScore = (data) => {
  const { age, smoker, exercise, diet, factors } = data;
  let score = 0;
  const rationale = [];

  // Smoking scoring (highest risk)
  if (smoker) {
    score += 40;
    rationale.push("smoking");
  }

  // Exercise scoring
  if (exercise === "rarely") {
    score += 25;
    rationale.push("low activity");
  } else if (exercise === "occasionally") {
    score += 10;
  }

  // Diet scoring
  if (diet === "high sugar") {
    score += 20;
    rationale.push("high sugar diet");
  } else if (diet === "high fat") {
    score += 15;
    rationale.push("high fat diet");
  }

  // Age scoring
  if (age) {
    if (age > 65) {
      score += 15;
    } else if (age > 50) {
      score += 8;
    }
  }

  // Determine risk level
  let risk_level;
  if (score >= 70) {
    risk_level = "high";
  } else if (score >= 40) {
    risk_level = "medium";
  } else {
    risk_level = "low";
  }

  return { score, risk_level, rationale };
};

// Step 4: Enhanced Recommendations Engine
const generateRecommendations = (factors, riskLevel) => {
  const recommendations = [];

  // Smoking recommendations
  if (factors.includes("smoking")) {
    recommendations.push("Quit smoking immediately - consider nicotine replacement therapy");
    recommendations.push("Join a smoking cessation program");
  }

  // Exercise recommendations
  if (factors.includes("low exercise")) {
    recommendations.push("Start with 30 minutes of walking daily");
    recommendations.push("Gradually increase to 150 minutes of moderate exercise per week");
  } else if (factors.includes("moderate exercise")) {
    recommendations.push("Increase exercise frequency to 5 days per week");
  }

  // Diet recommendations
  if (factors.includes("poor diet")) {
    recommendations.push("Reduce sugar intake to less than 25g per day");
    recommendations.push("Increase fiber-rich foods and vegetables");
  }
  if (factors.includes("high fat diet")) {
    recommendations.push("Limit saturated fats to less than 10% of daily calories");
    recommendations.push("Choose lean proteins and healthy fats");
  }

  // Age-related recommendations
  if (factors.includes("advanced age")) {
    recommendations.push("Schedule regular health checkups");
    recommendations.push("Consider bone density and cardiovascular screenings");
  }

  // General recommendations based on risk level
  if (riskLevel === "high") {
    recommendations.push("Consult with a healthcare provider for personalized guidance");
    recommendations.push("Consider regular monitoring of key health metrics");
  }

  return recommendations;
};

// Save profile to database
const saveProfile = async (req, res) => {
  try {
    const profileData = req.body;
    
    const profile = new Profile(profileData);
    await profile.save();
    
    res.json({
      status: "success",
      message: "Profile saved successfully",
      profileId: profile._id
    });
  } catch (error) {
    console.error('Save Profile Error:', error);
    res.status(500).json({
      status: "error",
      message: "Failed to save profile"
    });
  }
};

// Get all profiles
const getProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find().sort({ createdAt: -1 });
    res.json({
      status: "success",
      profiles
    });
  } catch (error) {
    console.error('Get Profiles Error:', error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve profiles"
    });
  }
};

// Get profile by ID
const getProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await Profile.findById(id);
    
    if (!profile) {
      return res.status(404).json({
        status: "error",
        message: "Profile not found"
      });
    }
    
    res.json({
      status: "success",
      profile
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve profile"
    });
  }
};

export { parseSurvey, processOCR, upload, saveProfile, getProfiles, getProfile };
