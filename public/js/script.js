/* =========================================================
   MOBILE NAVIGATION
========================================================= */

const menuToggle =
  document.getElementById("menuToggle");

const navMenu =
  document.getElementById("navMenu") ||
  document.getElementById("mainNav");


if (menuToggle && navMenu) {

  menuToggle.addEventListener(
    "click",
    () => {

      const isOpen =
        navMenu.classList.toggle(
          "active"
        );


      menuToggle.setAttribute(
        "aria-expanded",
        isOpen
      );


      menuToggle.textContent =
        isOpen
          ? "✕"
          : "☰";

    }
  );


  /* =====================================================
     CLOSE MOBILE MENU WHEN A LINK IS CLICKED
  ====================================================== */

  const navLinks =
    navMenu.querySelectorAll("a");


  navLinks.forEach(
    (link) => {

      link.addEventListener(
        "click",
        () => {

          navMenu.classList.remove(
            "active"
          );


          menuToggle.setAttribute(
            "aria-expanded",
            "false"
          );


          menuToggle.textContent =
            "☰";

        }
      );

    }
  );


  /* =====================================================
     CLOSE MENU WHEN SCREEN RETURNS TO DESKTOP
  ====================================================== */

  window.addEventListener(
    "resize",
    () => {

      if (
        window.innerWidth > 768
      ) {

        navMenu.classList.remove(
          "active"
        );


        menuToggle.setAttribute(
          "aria-expanded",
          "false"
        );


        menuToggle.textContent =
          "☰";

      }

    }
  );

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


if (
  daysElement &&
  hoursElement &&
  minutesElement &&
  secondsElement
) {

  const weddingDate =
    new Date(
      "2027-02-22T14:00:00+08:00"
    ).getTime();


  function updateCountdown() {

    const now =
      new Date().getTime();


    const distance =
      weddingDate - now;


    /* =====================================================
       WEDDING DAY HAS ARRIVED
    ====================================================== */

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


    /* =====================================================
       CALCULATE TIME
    ====================================================== */

    const days =
      Math.floor(
        distance /
        (1000 * 60 * 60 * 24)
      );


    const hours =
      Math.floor(
        (
          distance %
          (1000 * 60 * 60 * 24)
        ) /
        (1000 * 60 * 60)
      );


    const minutes =
      Math.floor(
        (
          distance %
          (1000 * 60 * 60)
        ) /
        (1000 * 60)
      );


    const seconds =
      Math.floor(
        (
          distance %
          (1000 * 60)
        ) /
        1000
      );


    /* =====================================================
       UPDATE DISPLAY
    ====================================================== */

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


  /* INITIAL LOAD */

  updateCountdown();


  /* UPDATE EVERY SECOND */

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

  if (
    attendance &&
    guestCount
  ) {

    attendance.addEventListener(
      "change",
      () => {

        if (
          attendance.value ===
          "Not Attending"
        ) {

          /*
            A guest who cannot attend
            does not need to choose
            the number of guests.
          */

          guestCount.value =
            "1";


          guestCount.disabled =
            true;

        } else {

          guestCount.disabled =
            false;


          guestCount.value =
            "";

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
        new FormData(
          rsvpForm
        );


      /* =================================================
         FORM DATA
      ================================================= */

      const data = {

        fullName:
          formData
            .get("fullName")
            ?.trim(),

        email:
          formData
            .get("email")
            ?.trim(),

        phone:
          formData
            .get("phone")
            ?.trim(),

        attendance:
          formData.get(
            "attendance"
          ),

        guestCount:
          formData.get(
            "guestCount"
          ),

        message:
          formData
            .get("message")
            ?.trim(),

      };


      /* =================================================
         BUTTON LOADING STATE
      ================================================= */

      if (submitButton) {

        submitButton.disabled =
          true;


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

        const response =
          await fetch(
            "/api/rsvp",
            {
              method:
                "POST",

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


        /*
          Read the response safely.
        */

        const result =
          await response.json();


        /* =============================================
           SUCCESS
        ============================================== */

        if (
          response.ok &&
          result.success
        ) {

          if (rsvpMessage) {

            rsvpMessage.textContent =
              result.message ||
              "Thank you! Your RSVP has been received.";


            rsvpMessage.classList.add(
              "success"
            );

          }


          /* RESET FORM */

          rsvpForm.reset();


          /* ENABLE GUEST COUNT AGAIN */

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

        /* =============================================
           RESTORE BUTTON
        ============================================== */

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
/* =========================================================
   SCROLL REVEAL ANIMATIONS
========================================================= */

const revealElements =
  document.querySelectorAll(
    ".reveal, .reveal-left, .reveal-right, .reveal-zoom"
  );


if (
  revealElements.length > 0
) {

  const revealObserver =
    new IntersectionObserver(
      (
        entries
      ) => {

        entries.forEach(
          (
            entry
          ) => {

            if (
              entry.isIntersecting
            ) {

              entry.target.classList.add(
                "active"
              );

              revealObserver.unobserve(
                entry.target
              );

            }

          }
        );

      },
      {

        threshold: 0.15,

        rootMargin:
          "0px 0px -50px 0px",

      }
    );


  revealElements.forEach(
    (
      element
    ) => {

      revealObserver.observe(
        element
      );

    }
  );

}
