/* =========================================================
   MOBILE NAVIGATION
========================================================= */

const menuToggle = document.getElementById("menuToggle");
const navMenu =
  document.getElementById("navMenu") ||
  document.getElementById("mainNav");

if (menuToggle && navMenu) {
  menuToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");
  });

  const navLinks = navMenu.querySelectorAll("a");

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
    });
  });
}


/* =========================================================
   WEDDING COUNTDOWN
========================================================= */

const daysElement =
  document.getElementById("days");

const hoursElement =
  document.getElementById("hours");

const minutesElement =
  document.getElementById("minutes");

const secondsElement =
  document.getElementById("seconds");


/*
  Only run the countdown if the current page
  actually contains the countdown elements.
*/

if (
  daysElement &&
  hoursElement &&
  minutesElement &&
  secondsElement
) {

  const weddingDate = new Date(
    "2027-02-22T14:00:00+08:00"
  ).getTime();


  function updateCountdown() {

    const now =
      new Date().getTime();

    const distance =
      weddingDate - now;


    if (distance <= 0) {

      daysElement.textContent =
        "00";

      hoursElement.textContent =
        "00";

      minutesElement.textContent =
        "00";

      secondsElement.textContent =
        "00";

      return;
    }


    const days = Math.floor(
      distance /
      (1000 * 60 * 60 * 24)
    );


    const hours = Math.floor(
      (
        distance %
        (1000 * 60 * 60 * 24)
      ) /
      (1000 * 60 * 60)
    );


    const minutes = Math.floor(
      (
        distance %
        (1000 * 60 * 60)
      ) /
      (1000 * 60)
    );


    const seconds = Math.floor(
      (
        distance %
        (1000 * 60)
      ) /
      1000
    );


    daysElement.textContent =
      String(days).padStart(
        2,
        "0"
      );


    hoursElement.textContent =
      String(hours).padStart(
        2,
        "0"
      );


    minutesElement.textContent =
      String(minutes).padStart(
        2,
        "0"
      );


    secondsElement.textContent =
      String(seconds).padStart(
        2,
        "0"
      );
  }


  updateCountdown();


  setInterval(
    updateCountdown,
    1000
  );
}


/* =========================================================
   RSVP FORM
========================================================= */

const rsvpForm =
  document.getElementById("rsvpForm");


if (rsvpForm) {

  const attendance =
    document.getElementById("attendance");

  const guestCount =
    document.getElementById("guestCount");

  const submitButton =
    document.getElementById("submitButton");

  const rsvpMessage =
    document.getElementById("rsvpMessage");


  /* =====================================================
     ATTENDANCE CHANGE
  ====================================================== */

  if (attendance && guestCount) {

    attendance.addEventListener(
      "change",
      () => {

        if (
          attendance.value ===
          "Not Attending"
        ) {

          /*
            A declining guest does not need
            to select the number of guests.
          */

          guestCount.value = "1";

          guestCount.disabled = true;

        } else {

          guestCount.disabled = false;

          guestCount.value = "";

        }

      }
    );

  }


  /* =====================================================
     RSVP FORM SUBMISSION
  ====================================================== */

  rsvpForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const formData =
        new FormData(rsvpForm);


      /*
        Data sent to the Express API.

        dietaryRequirements has been removed
        because it was removed from the form
        and PostgreSQL table.
      */

      const data = {

        fullName:
          formData.get("fullName"),

        email:
          formData.get("email"),

        phone:
          formData.get("phone"),

        attendance:
          formData.get("attendance"),

        guestCount:
          formData.get("guestCount"),

        message:
          formData.get("message"),

      };


      /* =================================================
         BUTTON LOADING STATE
      ================================================= */

      if (submitButton) {

        submitButton.disabled = true;

        submitButton.textContent =
          "Submitting...";

      }


      /* =================================================
         CLEAR PREVIOUS MESSAGE
      ================================================= */

      if (rsvpMessage) {

        rsvpMessage.textContent =
          "";

        rsvpMessage.className =
          "rsvp-message";

      }


      try {

        console.log(
          "Submitting RSVP:",
          data
        );


        const response =
          await fetch(
            "/api/rsvp",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  data
                ),
            }
          );


        const result =
          await response.json();


        console.log(
          "RSVP Response:",
          result
        );


        /* =============================================
           SUCCESS
        ============================================== */

        if (
          response.ok &&
          result.success
        ) {

          if (rsvpMessage) {

            rsvpMessage.textContent =
              result.message;

            rsvpMessage.classList.add(
              "success"
            );

          }


          rsvpForm.reset();


          /*
            Make sure guest count is enabled
            after resetting the form.
          */

          if (guestCount) {

            guestCount.disabled =
              false;

          }


        } else {

          /* ===========================================
             SERVER ERROR
          ============================================ */

          if (rsvpMessage) {

            rsvpMessage.textContent =
              result.message ||
              "Unable to submit your RSVP.";

            rsvpMessage.classList.add(
              "error"
            );

          }

        }


      } catch (error) {

        console.error(
          "RSVP Error:",
          error
        );


        if (rsvpMessage) {

          rsvpMessage.textContent =
            "Unable to connect to the server. Please try again.";

          rsvpMessage.classList.add(
            "error"
          );

        }


      } finally {

        if (submitButton) {

          submitButton.disabled =
            false;

          submitButton.textContent =
            "Confirm RSVP";

        }

      }

    }
  );

}