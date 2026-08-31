/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("adminToken");

  /*
    If there is no login token,
    redirect immediately to login page.
  */

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  /*
    Verify that the token is still valid.
  */

  try {
    const response = await fetch("/api/admin/check", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      localStorage.removeItem("adminToken");

      window.location.href = "login.html";

      return;
    }

    /*
      Authentication successful.
      Load the dashboard.
    */

    initializeDashboard();

  } catch (error) {
    console.error(
      "Authentication check error:",
      error
    );

    localStorage.removeItem("adminToken");

    window.location.href = "login.html";
  }
});


/* =========================================================
   INITIALIZE DASHBOARD
========================================================= */

function initializeDashboard() {

  loadRSVPs();

  const refreshButton =
    document.getElementById("refreshButton");

  if (refreshButton) {

    refreshButton.addEventListener(
      "click",
      loadRSVPs
    );

  }


  const searchInput =
    document.getElementById("searchInput");

  if (searchInput) {

    searchInput.addEventListener(
      "input",
      searchRSVPs
    );

  }


  const logoutButton =
    document.getElementById("logoutButton");

  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      logoutAdmin
    );

  }

}


/* =========================================================
   GLOBAL RSVP DATA
========================================================= */

let allRSVPs = [];


/* =========================================================
   GET AUTHORIZATION HEADERS
========================================================= */

function getAuthHeaders() {

  const token =
    localStorage.getItem("adminToken");

  return {
    Authorization:
      `Bearer ${token}`,
  };

}


/* =========================================================
   LOAD RSVPS
========================================================= */

async function loadRSVPs() {

  try {

    const response =
      await fetch(
        "/api/rsvps",
        {
          headers:
            getAuthHeaders(),
        }
      );


    const result =
      await response.json();


    /*
      Token expired or invalid.
    */

    if (response.status === 401) {

      localStorage.removeItem(
        "adminToken"
      );

      window.location.href =
        "login.html";

      return;

    }


    if (
      !response.ok ||
      !result.success
    ) {

      throw new Error(
        result.message ||
        "Unable to load RSVPs."
      );

    }


    allRSVPs =
      result.rsvps || [];


    updateDashboardStats(
      allRSVPs
    );


    displayRSVPs(
      allRSVPs
    );


  } catch (error) {

    console.error(
      "Error loading RSVPs:",
      error
    );


    const tableBody =
      document.getElementById(
        "rsvpTableBody"
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

  const totalRSVPs =
    rsvps.length;


  const attending =
    rsvps.filter(
      (rsvp) =>
        rsvp.attendance ===
        "Attending"
    ).length;


  const notAttending =
    rsvps.filter(
      (rsvp) =>
        rsvp.attendance ===
        "Not Attending"
    ).length;


  const totalGuests =
    rsvps
      .filter(
        (rsvp) =>
          rsvp.attendance ===
          "Attending"
      )
      .reduce(
        (total, rsvp) => {

          return (
            total +
            Number(
              rsvp.guest_count || 0
            )
          );

        },
        0
      );


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


  tableBody.innerHTML =
    "";


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

        <td>
          ${escapeHTML(
            rsvp.full_name
          )}
        </td>


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


        <td>
          ${escapeHTML(
            rsvp.guest_count
          )}
        </td>


        <td>
          ${
            rsvp.message
              ? escapeHTML(
                  rsvp.message
                )
              : "-"
          }
        </td>


        <td>

          <button
            class="delete-button"
            data-id="${rsvp.id}"
          >
            Delete
          </button>

        </td>

      `;


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
          String(
            rsvp.full_name || ""
          ).toLowerCase();


        const email =
          String(
            rsvp.email || ""
          ).toLowerCase();


        const phone =
          String(
            rsvp.phone || ""
          ).toLowerCase();


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

    const response =
      await fetch(
        `/api/rsvps/${id}`,
        {
          method:
            "DELETE",

          headers:
            getAuthHeaders(),
        }
      );


    const result =
      await response.json();


    /*
      Token expired or invalid.
    */

    if (response.status === 401) {

      localStorage.removeItem(
        "adminToken"
      );

      window.location.href =
        "login.html";

      return;

    }


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
   LOGOUT ADMIN
========================================================= */

async function logoutAdmin() {

  const token =
    localStorage.getItem(
      "adminToken"
    );


  try {

    if (token) {

      await fetch(
        "/api/admin/logout",
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

    }

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

  }


  /*
    Remove the token from browser.
  */

  localStorage.removeItem(
    "adminToken"
  );


  window.location.href =
    "login.html";

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