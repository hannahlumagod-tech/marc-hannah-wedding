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

app.use(
  express.urlencoded({
    extended: true,
  })
);


/* =========================================================
   STATIC FILES
========================================================= */

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


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
  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );
});


/* =========================================================
   RSVP SUBMISSION
========================================================= */

app.post(
  "/api/rsvp",
  async (req, res) => {
    try {
      /* =================================================
         CHECK DATABASE
      ================================================= */

      if (!pool) {
        return res.status(500).json({
          success: false,
          message:
            "Database is not configured yet. Please connect PostgreSQL in Railway.",
        });
      }


      /* =================================================
         GET FORM DATA
      ================================================= */

      const {
        fullName,
        email,
        phone,
        attendance,
        guestCount,
        message,
      } = req.body;


      /* =================================================
         VALIDATION
      ================================================= */

      if (
        !fullName ||
        !email ||
        !attendance ||
        !guestCount
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please complete all required fields.",
        });
      }


      /* =================================================
         VALID ATTENDANCE
      ================================================= */

      const validAttendance = [
        "Attending",
        "Not Attending",
      ];


      if (
        !validAttendance.includes(
          attendance
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid attendance selection.",
        });
      }


      /* =================================================
         VALIDATE GUEST COUNT
      ================================================= */

      const guestCountNumber =
        Number(guestCount);


      if (
        !Number.isInteger(
          guestCountNumber
        ) ||
        guestCountNumber < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a valid number of guests.",
        });
      }


      /* =================================================
         INSERT RSVP
      ================================================= */

      const query = `
        INSERT INTO rsvps (
          full_name,
          email,
          phone,
          attendance,
          guest_count,
          message
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        )
        RETURNING
          id,
          full_name,
          attendance,
          guest_count
      `;


      const values = [
        fullName.trim(),

        email.trim(),

        phone
          ? phone.trim()
          : null,

        attendance,

        guestCountNumber,

        message
          ? message.trim()
          : null,
      ];


      const result =
        await pool.query(
          query,
          values
        );


      /* =================================================
         SUCCESS RESPONSE
      ================================================= */

      return res.status(201).json({
        success: true,

        message:
          "Thank you! Your RSVP has been received. We look forward to celebrating with you.",

        rsvp:
          result.rows[0],
      });


    } catch (error) {
      console.error(
        "RSVP submission error:",
        error
      );


      return res.status(500).json({
        success: false,

        message:
          "Something went wrong while submitting your RSVP. Please try again.",
      });
    }
  }
);


/* =========================================================
   GET ALL RSVPS
   ADMIN DASHBOARD
========================================================= */

app.get(
  "/api/rsvps",
  async (req, res) => {
    try {
      /* =================================================
         CHECK DATABASE
      ================================================= */

      if (!pool) {
        return res.status(500).json({
          success: false,
          message:
            "Database is not configured.",
        });
      }


      /* =================================================
         GET RSVP RECORDS
      ================================================= */

      const result =
        await pool.query(`
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


      /* =================================================
         SUCCESS RESPONSE
      ================================================= */

      return res.json({
        success: true,

        total:
          result.rows.length,

        rsvps:
          result.rows,
      });


    } catch (error) {
      console.error(
        "Error retrieving RSVPs:",
        error
      );


      return res.status(500).json({
        success: false,

        message:
          "Unable to retrieve RSVP records.",
      });
    }
  }
);


/* =========================================================
   DELETE RSVP
   ADMIN DASHBOARD
========================================================= */

app.delete(
  "/api/rsvps/:id",
  async (req, res) => {
    try {
      /* =================================================
         CHECK DATABASE
      ================================================= */

      if (!pool) {
        return res.status(500).json({
          success: false,
          message:
            "Database is not configured.",
        });
      }


      /* =================================================
         VALIDATE RSVP ID
      ================================================= */

      const id =
        Number(
          req.params.id
        );


      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid RSVP ID.",
        });
      }


      /* =================================================
         DELETE RSVP
      ================================================= */

      const result =
        await pool.query(
          `
            DELETE FROM rsvps
            WHERE id = $1
            RETURNING
              id,
              full_name
          `,
          [id]
        );


      /* =================================================
         CHECK IF RSVP EXISTS
      ================================================= */

      if (
        result.rowCount === 0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "RSVP record not found.",
        });
      }


      /* =================================================
         SUCCESS RESPONSE
      ================================================= */

      return res.json({
        success: true,

        message:
          "RSVP record deleted successfully.",

        deleted:
          result.rows[0],
      });


    } catch (error) {
      console.error(
        "Error deleting RSVP:",
        error
      );


      return res.status(500).json({
        success: false,

        message:
          "Unable to delete RSVP record.",
      });
    }
  }
);


/* =========================================================
   START SERVER
========================================================= */

app.listen(
  PORT,
  () => {
    console.log(
      `Wedding website running on port ${PORT}`
    );
  }
);