/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

const ADMIN_TOKEN_KEY = "adminToken";


/* =========================================================
   GLOBAL RSVP DATA
========================================================= */

let allRSVPs = [];


/* =========================================================
   GET ADMIN TOKEN
========================================================= */

function getAdminToken() {
  return localStorage.getItem(
    ADMIN_TOKEN_KEY
  );
}


/* =========================================================
   LOGOUT ADMIN
========================================================= */

function logoutAdmin() {
  localStorage.removeItem(
    ADMIN_TOKEN_KEY
  );

  window.location.href =
    "/login.html";
}


/* =========================================================
   AUTHENTICATED FETCH
========================================================= */

async function authenticatedFetch(
  url,
  options = {}
) {

  const token =
    getAdminToken();


  if (!token) {

    window.location.href =
      "/login.html";

    return null;

  }


  const headers = {
    ...(options.headers || {}),
    Authorization:
      `Bearer ${token}`,
  };


  const response =
    await fetch(
      url,
      {
        ...options,
        headers,
      }
    );


  /*
    If the token is expired or invalid,
    automatically log out the admin.
  */

  if (
    response.status === 401 ||
    response.status === 403
  ) {

    localStorage.removeItem(
      ADMIN_TOKEN_KEY
    );

    window.location.href =
      "/login.html";

    return null;

  }


  return response;

}


/* =========================================================
   ADMIN DASHBOARD INITIALIZATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const token =
      getAdminToken();


    /*
      Prevent direct access to admin.html
      without authentication.
    */

    if (!token) {

      window.location.href =
        "/login.html";

      return;

    }


    /*
      LOAD RSVPS
    */

    loadRSVPs();


    /*
      REFRESH BUTTON
    */

    const refreshButton =
      document.getElementById(
        "refreshButton"
      );


    if (refreshButton) {

      refreshButton.addEventListener(
        "click",
        loadRSVPs
      );

    }


    /*
      SEARCH INPUT
    */

    const searchInput =
      document.getElementById(
        "searchInput"
      );


    if (searchInput) {

      searchInput.addEventListener(
        "input",
        searchRSVPs
      );

    }


    /*
      LOGOUT BUTTON

      Your admin.html should contain:

      <button id="logoutButton">
        Logout
      </button>
    */

    const logoutButton =
      document.getElementById(
        "logoutButton"
      );


    if (logoutButton) {

      logoutButton.addEventListener(
        "click",
        () => {

          const confirmed =
            confirm(
              "Are you sure you want to log out?"
            );


          if (confirmed) {

            logoutAdmin();

          }

        }
      );

    }

  }
);


/* =========================================================
   LOAD RSVPS
========================================================= */

async function loadRSVPs() {

  const tableBody =
    document.getElementById(
      "rsvpTableBody"
    );


  try {

    /*
      Show loading message.
    */

    if (tableBody) {

      tableBody.innerHTML = `
        <tr>
          <td
            colspan="6"
            style="
              text-align: center;
              padding: 30px;
            "
          >
            Loading RSVP records...
          </td>
        </tr>
      `;

    }


    /*
      Send authenticated request.
    */

    const response =
      await authenticatedFetch(
        "/api/rsvps"
      );


    /*
      Stop if authentication redirected.
    */

    if (!response) {
      return;
    }


    const result =
      await response.json();


    /*
      HANDLE SERVER ERROR
    */

    if (
      !response.ok ||
      !result.success
    ) {

      throw new Error(
        result.message ||
        "Unable to load RSVPs."
      );

    }


    /*
      SAVE RSVP DATA
    */

    allRSVPs =
      result.rsvps || [];


    /*
      UPDATE DASHBOARD
    */

    updateDashboardStats(
      allRSVPs
    );


    /*
      DISPLAY TABLE
    */

    displayRSVPs(
      allRSVPs
    );


  } catch (error) {

    console.error(
      "Error loading RSVPs:",
      error
    );


    if (tableBody) {

      tableBody.innerHTML = `
        <tr>
          <td
            colspan="6"
            style="
              text-align: center;
              padding: 30px;
            "
          >
            ${escapeHTML(
              error.message ||
              "Unable to load RSVP records."
            )}
          </td>
        </tr>
      `;

    }

  }

}


/* =========================================================
   UPDATE DASHBOARD STATISTICS
========================================================= */

function updateDashboardStats(
  rsvps
) {

  /*
    TOTAL RSVPS
  */

  const totalRSVPs =
    rsvps.length;


  /*
    ATTENDING
  */

  const attending =
    rsvps.filter(
      (rsvp) =>
        rsvp.attendance ===
        "Attending"
    ).length;


  /*
    NOT ATTENDING
  */

  const notAttending =
    rsvps.filter(
      (rsvp) =>
        rsvp.attendance ===
        "Not Attending"
    ).length;


  /*
    TOTAL GUESTS

    Only count guests who are attending.
  */

  const totalGuests =
    rsvps
      .filter(
        (rsvp) =>
          rsvp.attendance ===
          "Attending"
      )
      .reduce(
        (
          total,
          rsvp
        ) => {

          return (
            total +
            Number(
              rsvp.guest_count || 0
            )
          );

        },
        0
      );


  /*
    DASHBOARD ELEMENTS
  */

  const totalElement =
    document.getElementById(
      "totalRSVPs"
    );


  const attendingElement =
    document.getElementById(
      "attendingCount"
    );


  const notAttendingElement =
    document.getElementById(
      "notAttendingCount"
    );


  const guestsElement =
    document.getElementById(
      "totalGuests"
    );


  /*
    UPDATE VALUES
  */

  if (totalElement) {

    totalElement.textContent =
      totalRSVPs;

  }


  if (attendingElement) {

    attendingElement.textContent =
      attending;

  }


  if (notAttendingElement) {

    notAttendingElement.textContent =
      notAttending;

  }


  if (guestsElement) {

    guestsElement.textContent =
      totalGuests;

  }

}


/* =========================================================
   DISPLAY RSVP TABLE
========================================================= */

function displayRSVPs(
  rsvps
) {

  const tableBody =
    document.getElementById(
      "rsvpTableBody"
    );


  if (!tableBody) {
    return;
  }


  /*
    CLEAR TABLE
  */

  tableBody.innerHTML =
    "";


  /*
    NO RECORDS
  */

  if (
    rsvps.length === 0
  ) {

    tableBody.innerHTML = `
      <tr>
        <td
          colspan="6"
          style="
            text-align: center;
            padding: 30px;
          "
        >
          No RSVP records found.
        </td>
      </tr>
    `;


    return;

  }


  /*
    CREATE ROWS
  */

  rsvps.forEach(
    (rsvp) => {

      const row =
        document.createElement(
          "tr"
        );


      const attendanceClass =
        rsvp.attendance ===
        "Attending"
          ? "attending"
          : "not-attending";


      row.innerHTML = `

        <!-- GUEST -->

        <td>
          ${escapeHTML(
            rsvp.full_name
          )}
        </td>


        <!-- CONTACT -->

        <td>

          <div>
            ${escapeHTML(
              rsvp.email
            )}
          </div>

          <small>
            ${
              rsvp.phone
                ? escapeHTML(
                    rsvp.phone
                  )
                : "-"
            }
          </small>

        </td>


        <!-- ATTENDANCE -->

        <td>

          <span
            class="
              attendance-badge
              ${attendanceClass}
            "
          >
            ${escapeHTML(
              rsvp.attendance
            )}
          </span>

        </td>


        <!-- GUEST COUNT -->

        <td>
          ${Number(
            rsvp.guest_count
          )}
        </td>


        <!-- MESSAGE -->

        <td>
          ${
            rsvp.message
              ? escapeHTML(
                  rsvp.message
                )
              : "-"
          }
        </td>


        <!-- ACTION -->

        <td>

          <button
            class="delete-button"
            data-rsvp-id="${rsvp.id}"
          >
            Delete
          </button>

        </td>

      `;


      /*
        DELETE BUTTON EVENT
      */

      const deleteButton =
        row.querySelector(
          ".delete-button"
        );


      if (deleteButton) {

        deleteButton.addEventListener(
          "click",
          () => {

            deleteRSVP(
              rsvp.id
            );

          }
        );

      }


      tableBody.appendChild(
        row
      );

    }
  );

}


/* =========================================================
   SEARCH RSVP
========================================================= */

function searchRSVPs(
  event
) {

  const searchTerm =
    event.target.value
      .toLowerCase()
      .trim();


  const filteredRSVPs =
    allRSVPs.filter(
      (rsvp) => {

        const fullName =
          (
            rsvp.full_name ||
            ""
          )
            .toLowerCase();


        const email =
          (
            rsvp.email ||
            ""
          )
            .toLowerCase();


        const phone =
          (
            rsvp.phone ||
            ""
          )
            .toLowerCase();


        return (

          fullName.includes(
            searchTerm
          ) ||

          email.includes(
            searchTerm
          ) ||

          phone.includes(
            searchTerm
          )

        );

      }
    );


  displayRSVPs(
    filteredRSVPs
  );

}


/* =========================================================
   DELETE RSVP
========================================================= */

async function deleteRSVP(
  id
) {

  const confirmed =
    confirm(
      "Are you sure you want to delete this RSVP?"
    );


  if (!confirmed) {
    return;
  }


  try {

    /*
      Send authenticated DELETE request.
    */

    const response =
      await authenticatedFetch(
        `/api/rsvps/${id}`,
        {
          method:
            "DELETE",
        }
      );


    if (!response) {
      return;
    }


    const result =
      await response.json();


    /*
      HANDLE ERROR
    */

    if (
      !response.ok ||
      !result.success
    ) {

      throw new Error(
        result.message ||
        "Unable to delete RSVP."
      );

    }


    alert(
      "RSVP deleted successfully."
    );


    /*
      RELOAD DATA
    */

    loadRSVPs();


  } catch (error) {

    console.error(
      "Delete RSVP error:",
      error
    );


    alert(
      error.message ||
      "Unable to delete RSVP."
    );

  }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    String(value);


  return div.innerHTML;

}