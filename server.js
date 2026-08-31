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

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/health",
  (req, res) => {
    res.json({
      success: true,
      status: "ok",
      message:
        "Marc & Hannah Wedding Website is running.",
    });
  }
);


/* =========================================================
   HOME PAGE
========================================================= */

app.get(
  "/",
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        "public",
        "index.html"
      )
    );
  }
);


/* =========================================================
   CREATE RSVP
========================================================= */

app.post(
  "/api/rsvp",
  async (req, res) => {
    try {

      if (!pool) {
        return res
          .status(500)
          .json({
            success: false,
            message:
              "Database is not configured yet.",
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


      /* =====================================================
         VALIDATION
      ====================================================== */

      if (
        !fullName ||
        !email ||
        !attendance ||
        !guestCount
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Please complete all required fields.",
          });
      }


      const validAttendance = [
        "Attending",
        "Not Attending",
      ];


      if (
        !validAttendance.includes(
          attendance
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid attendance selection.",
          });
      }


      const guestCountNumber =
        Number(guestCount);


      if (
        Number.isNaN(
          guestCountNumber
        ) ||
        guestCountNumber < 1
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid number of guests.",
          });
      }


      /* =====================================================
         INSERT RSVP
      ====================================================== */

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
          email,
          phone,
          attendance,
          guest_count,
          message
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


      return res
        .status(201)
        .json({
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


      return res
        .status(500)
        .json({
          success: false,
          message:
            "Something went wrong while submitting your RSVP. Please try again.",
        });

    }

  }
);


/* =========================================================
   GET ALL RSVPS
========================================================= */

app.get(
  "/api/rsvps",
  async (req, res) => {
    try {

      if (!pool) {
        return res
          .status(500)
          .json({
            success: false,
            message:
              "Database is not configured.",
          });
      }


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


      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to retrieve RSVP records.",
        });

    }

  }
);


/* =========================================================
   GET SINGLE RSVP
========================================================= */

app.get(
  "/api/rsvps/:id",
  async (req, res) => {
    try {

      if (!pool) {
        return res
          .status(500)
          .json({
            success: false,
            message:
              "Database is not configured.",
          });
      }


      const id =
        Number(
          req.params.id
        );


      if (
        !Number.isInteger(id) ||
        id < 1
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid RSVP ID.",
          });
      }


      const result =
        await pool.query(
          `
            SELECT
              id,
              full_name,
              email,
              phone,
              attendance,
              guest_count,
              message
            FROM rsvps
            WHERE id = $1
          `,
          [id]
        );


      if (
        result.rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "RSVP record not found.",
          });
      }


      return res.json({
        success: true,
        rsvp:
          result.rows[0],
      });


    } catch (error) {

      console.error(
        "Error retrieving RSVP:",
        error
      );


      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to retrieve RSVP.",
        });

    }

  }
);


/* =========================================================
   UPDATE RSVP
========================================================= */

app.put(
  "/api/rsvps/:id",
  async (req, res) => {
    try {

      if (!pool) {
        return res
          .status(500)
          .json({
            success: false,
            message:
              "Database is not configured.",
          });
      }


      const id =
        Number(
          req.params.id
        );


      if (
        !Number.isInteger(id) ||
        id < 1
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid RSVP ID.",
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


      /* =====================================================
         VALIDATION
      ====================================================== */

      if (
        !fullName ||
        !email ||
        !attendance ||
        !guestCount
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Please complete all required fields.",
          });
      }


      const validAttendance = [
        "Attending",
        "Not Attending",
      ];


      if (
        !validAttendance.includes(
          attendance
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid attendance selection.",
          });
      }


      const guestCountNumber =
        Number(guestCount);


      if (
        Number.isNaN(
          guestCountNumber
        ) ||
        guestCountNumber < 1
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid number of guests.",
          });
      }


      /* =====================================================
         UPDATE RSVP
      ====================================================== */

      const result =
        await pool.query(
          `
            UPDATE rsvps
            SET
              full_name = $1,
              email = $2,
              phone = $3,
              attendance = $4,
              guest_count = $5,
              message = $6
            WHERE id = $7
            RETURNING
              id,
              full_name,
              email,
              phone,
              attendance,
              guest_count,
              message
          `,
          [
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
            id,
          ]
        );


      if (
        result.rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "RSVP record not found.",
          });
      }


      return res.json({
        success: true,
        message:
          "RSVP updated successfully.",
        rsvp:
          result.rows[0],
      });


    } catch (error) {

      console.error(
        "Update RSVP error:",
        error
      );


      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to update RSVP.",
        });

    }

  }
);


/* =========================================================
   DELETE RSVP
========================================================= */

app.delete(
  "/api/rsvps/:id",
  async (req, res) => {
    try {

      if (!pool) {
        return res
          .status(500)
          .json({
            success: false,
            message:
              "Database is not configured.",
          });
      }


      const id =
        Number(
          req.params.id
        );


      if (
        !Number.isInteger(id) ||
        id < 1
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid RSVP ID.",
          });
      }


      const result =
        await pool.query(
          `
            DELETE FROM rsvps
            WHERE id = $1
            RETURNING id
          `,
          [id]
        );


      if (
        result.rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "RSVP record not found.",
          });
      }


      return res.json({
        success: true,
        message:
          "RSVP deleted successfully.",
      });


    } catch (error) {

      console.error(
        "Delete RSVP error:",
        error
      );


      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to delete RSVP.",
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