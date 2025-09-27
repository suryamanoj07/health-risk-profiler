// Step 1 - OCR / Parsing
export const parseInput = async (req, res) => {
  // TODO: Use tesseract.js if OCR needed, here dummy JSON
  res.json({
    answers: { age: 40, smoker: true, exercise: "rarely" },
    missing_fields: [],
    confidence: 0.9
  });
};

// Step 2 - Factor Extraction
export const extractFactors = async (req, res) => {
  const { answers } = req.body;
  let factors = [];
  if (answers.smoker) factors.push("smoking");
  if (answers.exercise === "rarely") factors.push("low exercise");
  res.json({ factors, confidence: 0.88 });
};

// Step 3 - Risk Classification
export const classifyRisk = async (req, res) => {
  const { factors, answers } = req.body;
  let score = 0;
  if (factors.includes("smoking")) score += 30;
  if (factors.includes("low exercise")) score += 20;
  if (answers.age > 40) score += 10;

  let risk = score > 60 ? "high" : score > 30 ? "medium" : "low";
  res.json({ risk_level: risk, score, rationale: factors });
};

// Step 4 - Recommendations
export const getRecommendations = async (req, res) => {
  const { factors, risk_level } = req.body;
  const recs = [];
  if (factors.includes("smoking")) recs.push("Quit smoking");
  if (factors.includes("low exercise")) recs.push("Walk 30 mins daily");

  res.json({ risk_level, recommendations: recs, status: "ok" });
};
