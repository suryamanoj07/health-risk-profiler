# Health Risk Profiler

A service that analyzes lifestyle survey responses (typed or scanned forms) and generates a structured health risk profile with actionable recommendations.

## Features

- **OCR Processing**: Extract text from scanned survey forms
- **Factor Extraction**: Convert answers into risk factors
- **Risk Classification**: Compute risk levels with scoring logic
- **Recommendations**: Generate actionable, non-diagnostic guidance
- **Guardrails**: Handle noisy inputs and missing data

## Architecture

```
Frontend (React) → Backend (Node.js) → Database (MongoDB)
```

### Backend Structure
```
backend/
├── controllers/survey.controller.js  # Main logic
├── models/Profile.js                 # Database schema
├── routes/survey.routes.js           # API endpoints
└── server.js                         # Server setup
```

### Frontend Structure
```
frontend/
├── src/components/
│   ├── SurveyForm.js                 # Input form
│   └── Results.js                    # Results display
└── App.js                            # Main app
```

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- MongoDB
- npm

### Installation

1. **Clone Repository**
```bash
git clone https://github.com/suryamanoj07/health-risk-profiler.git
cd health-risk-profiler
```

2. **Backend Setup**
```bash
cd backend
npm install
```

3. **Start Backend**
```bash
npm run dev
```
Runs on `http://localhost:5000`

4. **Frontend Setup**
```bash
cd frontend
npm install
npm start
```
Runs on `http://localhost:3000`

## API Usage Examples

### Step 1 - OCR/Text Parsing

#### Manual Input
**Endpoint:** `POST /api/parse`

**Request:**
```json
{
  "age": 42,
  "smoker": true,
  "exercise": "rarely",
  "diet": "high sugar"
}
```

**Response:**
```json
{
  "risk_level": "high",
  "score": 85,
  "factors": ["smoking", "poor diet", "low exercise"],
  "recommendations": ["Quit smoking", "Reduce sugar", "Walk 30 mins daily"],
  "rationale": ["smoking", "high sugar diet", "low activity"],
  "status": "ok"
}
```

#### OCR Processing
**Endpoint:** `POST /api/ocr`

**Request:** Upload image file (multipart/form-data)

**Response:**
```json
{
  "answers": {
    "age": 42,
    "smoker": true,
    "exercise": "rarely",
    "diet": "high sugar"
  },
  "missing_fields": [],
  "confidence": 0.92
}
```

### Step 2 - Factor Extraction

**Input:** Survey answers
**Output:** Risk factors array
```json
{
  "factors": ["smoking", "poor diet", "low exercise"]
}
```

### Step 3 - Risk Classification

**Scoring Logic:**
- Smoking: 40 points
- Low Exercise: 25 points
- High Sugar Diet: 20 points
- Age 50+: 8 points

**Risk Levels:**
- 0-39: Low
- 40-69: Medium
- 70+: High

### Step 4 - Recommendations

**Output:**
```json
{
  "risk_level": "high",
  "factors": ["smoking", "poor diet", "low exercise"],
  "recommendations": ["Quit smoking", "Reduce sugar", "Walk 30 mins daily"],
  "status": "ok"
}
```

## Guardrails & Error Handling

### Incomplete Data
```json
{
  "status": "incomplete_profile",
  "reason": ">50% fields missing"
}
```

### OCR Errors
```json
{
  "status": "error",
  "message": "No readable text found in image"
}
```

## OCR Image Requirements

### Supported Formats
- JPG, PNG, GIF, BMP, TIFF
- Max size: 10MB

### Expected Format
```
Age: 42
Smoker: yes
Exercise: rarely
Diet: high sugar
```


### Test High Risk Profile
```bash
curl -X POST http://localhost:5000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"age":42,"smoker":true,"exercise":"rarely","diet":"high sugar"}'
```

### Test Low Risk Profile
```bash
curl -X POST http://localhost:5000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"age":25,"smoker":false,"exercise":"regularly","diet":"balanced"}'
```

## Dependencies

### Backend
- express
- mongoose
- tesseract.js
- multer
- cors

### Frontend
- react
- axios
- tailwindcss
