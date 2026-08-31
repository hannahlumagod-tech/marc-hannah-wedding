/* =========================================================
   ADMIN DASHBOARD
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
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
});


/* =========================================================
   GLOBAL RSVP DATA
========================================================= */

let allRSVPs = [];


/* =========================================================
   LOAD RSVPS
========================================================= */

async function loadRSVPs() {

  try {

    const response =
      await fetch("/api/rsvps");


    const result =
      await response.json();


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
      result.rsvps;


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
              text-align:center;
              padding:30px;
            "
          >
            Unable to load RSVP records.
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
        (
          total,
          rsvp
        ) => {

          return (
            total +
            Number(
              rsvp.guest_count
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


  if (
    notAttendingElement
  ) {

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
            text-align:center;
            padding:30px;
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
          ${rsvp.guest_count}
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
            onclick="
              deleteRSVP(
                ${rsvp.id}
              )
            "
          >
            Delete
          </button>

        </td>

      `;


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

        return (

          rsvp.full_name
            .toLowerCase()
            .includes(
              searchTerm
            ) ||

          rsvp.email
            .toLowerCase()
            .includes(
              searchTerm
            ) ||

          (
            rsvp.phone &&
            rsvp.phone
              .toLowerCase()
              .includes(
                searchTerm
              )
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
        }
      );


    const result =
      await response.json();


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
    value;


  return div.innerHTML;

}