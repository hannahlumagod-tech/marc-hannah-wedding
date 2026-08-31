const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

const PORT = process.env.PORT || 3000;

/* =========================================================
   CONFIGURATION
========================================================= */

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "change-this-secret-before-production";


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
    "DATABASE_URL not found. Database features are disabled locally."
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
   AUTHENTICATION MIDDLEWARE
========================================================= */

function authenticateAdmin(
  req,
  res,
  next
) {
  const authorization =
    req.headers.authorization;

  if (!authorization) {
    return res
      .status(401)
      .json({
        success: false,
        message:
          "Authentication required.",
      });
  }


  const parts =
    authorization.split(" ");


  if (
    parts.length !== 2 ||
    parts[0] !== "Bearer"
  ) {
    return res
      .status(401)
      .json({
        success: false,
        message:
          "Invalid authentication token.",
      });
  }


  const token =
    parts[1];


  try {

    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      );


    req.admin =
      decoded;


    next();

  } catch (error) {

    return res
      .status(401)
      .json({
        success: false,
        message:
          "Your session has expired. Please log in again.",
      });

  }
}


/* =========================================================
   STATIC FILES
========================================================= */

app.use(
  express.static(
    path.join(
      __dirname,
      "public"
    )
  )
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/health",
  (req, res) => {

    res.json({
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
   ADMIN LOGIN
========================================================= */

app.post(
  "/api/admin/login",
  async (
    req,
    res
  ) => {

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


      const {
        username,
        password,
      } = req.body;


      if (
        !username ||
        !password
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Username and password are required.",
          });
      }


      const result =
        await pool.query(
          `
            SELECT
              id,
              username,
              password_hash
            FROM admins
            WHERE username = $1
            LIMIT 1
          `,
          [
            username.trim(),
          ]
        );


      if (
        result.rows.length === 0
      ) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Invalid username or password.",
          });
      }


      const admin =
        result.rows[0];


      const passwordMatches =
        await bcrypt.compare(
          password,
          admin.password_hash
        );


      if (
        !passwordMatches
      ) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Invalid username or password.",
          });
      }


      const token =
        jwt.sign(
          {
            id:
              admin.id,

            username:
              admin.username,
          },
          JWT_SECRET,
          {
            expiresIn:
              "8h",
          }
        );


      return res.json({
        success: true,
        message:
          "Login successful.",
        token,
      });


    } catch (error) {

      console.error(
        "Admin login error:",
        error
      );


      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to process login.",
        });

    }

  }
);


/* =========================================================
   CHECK ADMIN AUTHENTICATION
========================================================= */

app.get(
  "/api/admin/check",
  authenticateAdmin,
  (
    req,
    res
  ) => {

    return res.json({
      success: true,
      admin:
        req.admin,
    });

  }
);


/* =========================================================
   LOGOUT
========================================================= */

app.post(
  "/api/admin/logout",
  authenticateAdmin,
  (
    req,
    res
  ) => {

    /*
      JWT logout is handled
      on the client by removing
      the stored token.
    */

    return res.json({
      success: true,
      message:
        "Logged out successfully.",
    });

  }
);


/* =========================================================
   RSVP SUBMISSION
   PUBLIC
========================================================= */

app.post(
  "/api/rsvp",
  async (
    req,
    res
  ) => {

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
        Number(
          guestCount
        );


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
        RETURNING id
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
   PROTECTED
========================================================= */

app.get(
  "/api/rsvps",
  authenticateAdmin,
  async (
    req,
    res
  ) => {

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
   PROTECTED
========================================================= */

app.get(
  "/api/rsvps/:id",
  authenticateAdmin,
  async (
    req,
    res
  ) => {

    try {

      const id =
        Number(
          req.params.id
        );


      if (
        Number.isNaN(
          id
        )
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
          [
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
   PROTECTED
========================================================= */

app.put(
  "/api/rsvps/:id",
  authenticateAdmin,
  async (
    req,
    res
  ) => {

    try {

      const id =
        Number(
          req.params.id
        );


      const {
        fullName,
        email,
        phone,
        attendance,
        guestCount,
        message,
      } = req.body;


      if (
        Number.isNaN(
          id
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid RSVP ID.",
          });
      }


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
        Number(
          guestCount
        );


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
   PROTECTED
========================================================= */

app.delete(
  "/api/rsvps/:id",
  authenticateAdmin,
  async (
    req,
    res
  ) => {

    try {

      const id =
        Number(
          req.params.id
        );


      if (
        Number.isNaN(
          id
        )
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
          [
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