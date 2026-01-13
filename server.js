const express = require("express");
const axios = require("axios");
const cors = require("cors");

require("dotenv").config();



// ------------------ App Setup ------------------
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ------------------ Test Route ------------------
app.get("/", (req, res) => {
  res.send("AQI Backend is running 🚀");
});

// ------------------ AQI Route ------------------
app.get("/api/aqi", async (req, res) => {
  try {
    const city = req.query.city;

    if (!city) {
      return res.status(400).json({ error: "City is required" });
    }

    // 1️⃣ City → Lat / Lon
    const geoResponse = await axios.get(
      `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${process.env.API_KEY}`
    );

    if (geoResponse.data.length === 0) {
      return res.status(404).json({ error: "City not found" });
    }

    const { lat, lon } = geoResponse.data[0];

    // 2️⃣ Get AQI data
    const aqiResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.API_KEY}`
    );

    const aqi = aqiResponse.data.list[0].main.aqi;
    const components = aqiResponse.data.list[0].components;

    // 3️⃣ AQI Logic
    let category = "";
    let advice = "";
    let color = "";
    let riskLevel = "";

    if (aqi === 1) {
      category = "Good";
      advice = "Air quality is good. Safe for outdoor activities.";
      color = "green";
      riskLevel = "Low";
    } else if (aqi === 2) {
      category = "Fair";
      advice = "Air quality is fair. Sensitive people should be cautious.";
      color = "yellow";
      riskLevel = "Moderate";
    } else if (aqi === 3) {
      category = "Moderate";
      advice = "Avoid prolonged outdoor exertion.";
      color = "orange";
      riskLevel = "High";
    } else if (aqi === 4) {
      category = "Poor";
      advice = "Avoid outdoor activities. Wear masks.";
      color = "red";
      riskLevel = "Very High";
    } else if (aqi === 5) {
      category = "Very Poor";
      advice = "Stay indoors. Health risk for all groups.";
      color = "maroon";
      riskLevel = "Severe";
    }

   

    // ------------------ Response ------------------
    res.json({
      city,
      aqi,
      category,
      riskLevel,
      advice,
      color,
      pollutants: components,
      timestamp: new Date()
    });

  } catch (error) {
    console.error("ERROR:", error.response?.data || error.message);
    res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
});

// ------------------ Server Start ------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
  