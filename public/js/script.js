const menuToggle = document.getElementById("menuToggle");
const navMenu = document.getElementById("navMenu");

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


const weddingDate = new Date(
  "2027-02-22T14:00:00+08:00"
).getTime();


function updateCountdown() {
  const now = new Date().getTime();

  const distance = weddingDate - now;


  if (distance <= 0) {

    document.getElementById("days").textContent = "00";

    document.getElementById("hours").textContent = "00";

    document.getElementById("minutes").textContent = "00";

    document.getElementById("seconds").textContent = "00";

    return;
  }


  const days = Math.floor(
    distance / (1000 * 60 * 60 * 24)
  );


  const hours = Math.floor(
    (distance % (1000 * 60 * 60 * 24)) /
    (1000 * 60 * 60)
  );


  const minutes = Math.floor(
    (distance % (1000 * 60 * 60)) /
    (1000 * 60)
  );


  const seconds = Math.floor(
    (distance % (1000 * 60)) /
    1000
  );


  document.getElementById("days").textContent =
    String(days).padStart(2, "0");


  document.getElementById("hours").textContent =
    String(hours).padStart(2, "0");


  document.getElementById("minutes").textContent =
    String(minutes).padStart(2, "0");


  document.getElementById("seconds").textContent =
    String(seconds).padStart(2, "0");
}


updateCountdown();


setInterval(updateCountdown, 1000);

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


  /* =====================================
     ATTENDANCE CHANGE
  ===================================== */

  attendance.addEventListener(
    "change",
    () => {

      if (
        attendance.value === "Not Attending"
      ) {

        guestCount.value = "1";

        guestCount.disabled = true;

      } else {

        guestCount.disabled = false;

      }

    }
  );


  /* =====================================
     FORM SUBMISSION
  ===================================== */

  rsvpForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const formData =
        new FormData(rsvpForm);


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

        dietaryRequirements:
          formData.get(
            "dietaryRequirements"
          ),

        message:
          formData.get("message"),

      };


      submitButton.disabled = true;

      submitButton.textContent =
        "Submitting...";


      rsvpMessage.textContent = "";

      rsvpMessage.className =
        "rsvp-message";


      try {

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
                JSON.stringify(data),
            }
          );


        const result =
          await response.json();


        if (
          response.ok &&
          result.success
        ) {

          rsvpMessage.textContent =
            result.message;


          rsvpMessage.classList.add(
            "success"
          );


          rsvpForm.reset();


        } else {

          rsvpMessage.textContent =
            result.message ||
            "Unable to submit your RSVP.";


          rsvpMessage.classList.add(
            "error"
          );

        }


      } catch (error) {

        console.error(
          "RSVP Error:",
          error
        );


        rsvpMessage.textContent =
          "Unable to connect to the server. Please try again.";


        rsvpMessage.classList.add(
          "error"
        );


      } finally {

        submitButton.disabled = false;

        submitButton.textContent =
          "Confirm RSVP";

      }

    }
  );

}