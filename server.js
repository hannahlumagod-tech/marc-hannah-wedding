const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 3000;

/* =========================================================
   DATABASE CONNECTION
========================================================= */

let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  console.log("PostgreSQL database connection configured.");
} else {
  console.log(
    "DATABASE_URL not found. RSVP database features are disabled locally."
  );
}

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Marc & Hannah Wedding Website is running.",
  });
});

/* =========================================================
   HOME PAGE
========================================================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* =========================================================
   RSVP SUBMISSION
========================================================= */

app.post("/api/rsvp", async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        message:
          "Database is not configured yet. Please connect PostgreSQL in Railway.",
      });
    }

    const {
      fullName,
      email,
      phone,
      attendance,
      guestCount,
      message,
    } = req.body;

    /* =========================
       VALIDATION
    ========================= */

    if (!fullName || !email || !attendance || !guestCount) {
      return res.status(400).json({
        success: false,
        message: "Please complete all required fields.",
      });
    }

    const validAttendance = ["Attending", "Not Attending"];

    if (!validAttendance.includes(attendance)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance selection.",
      });
    }

    /* =========================
       INSERT RSVP
    ========================= */

    const query = `
      INSERT INTO rsvps (
        full_name,
        email,
        phone,
        attendance,
        guest_count,
        message
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const values = [
      fullName.trim(),
      email.trim(),
      phone ? phone.trim() : null,
      attendance,
      Number(guestCount),
      message ? message.trim() : null,
    ];

    const result = await pool.query(query, values);

    return res.status(201).json({
      success: true,
      message:
        "Thank you! Your RSVP has been received. We look forward to celebrating with you.",
      rsvp: result.rows[0],
    });
  } catch (error) {
    console.error("RSVP submission error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while submitting your RSVP. Please try again.",
    });
  }
});

/* =========================================================
   GET ALL RSVPS
   TEMPORARY ADMIN ENDPOINT
========================================================= */

app.get("/api/rsvps", async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({
        success: false,
        message: "Database is not configured.",
      });
    }

    const result = await pool.query(`
      SELECT
        id,
        full_name,
        email,
        phone,
        attendance,
        guest_count,
        message
      FROM rsvps
      ORDER BY id DESC
    `);

    return res.json({
      success: true,
      total: result.rows.length,
      rsvps: result.rows,
    });
  } catch (error) {
    console.error("Error retrieving RSVPs:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve RSVP records.",
    });
  }
});

/* =========================================================
   START SERVER
========================================================= */

app.listen(PORT, () => {
  console.log(`Wedding website running on port ${PORT}`);
});