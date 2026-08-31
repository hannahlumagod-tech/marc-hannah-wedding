/* =========================================================
   WEDDING ENVELOPE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {


    /* =====================================================
       ELEMENTS
    ====================================================== */

    const envelopeWrapper =
      document.getElementById(
        "envelopeWrapper"
      );


    const waxSeal =
      document.getElementById(
        "waxSeal"
      );


    const openButton =
      document.getElementById(
        "openButton"
      );


    const invitationMessage =
      document.getElementById(
        "invitationMessage"
      );


    /* =====================================================
       OPEN ENVELOPE FUNCTION
    ====================================================== */

    function openEnvelope() {


      if (
        !envelopeWrapper
      ) {

        return;

      }


      /*
        Prevent the animation
        from running repeatedly.
      */

      if (
        envelopeWrapper.classList.contains(
          "open"
        )
      ) {

        return;

      }


      /* Open envelope */

      envelopeWrapper.classList.add(
        "open"
      );


      /*
        Update text below
        the envelope.
      */

      if (
        invitationMessage
      ) {

        invitationMessage.textContent =
          "OUR LOVE STORY BEGINS HERE";

      }


      /*
        Update button.
      */

      if (
        openButton
      ) {

        openButton.textContent =
          "INVITATION OPENED";

        openButton.disabled =
          true;

      }


      /*
        Scroll slightly toward
        the invitation after opening.
      */

      setTimeout(
        () => {

          envelopeWrapper.scrollIntoView(
            {
              behavior:
                "smooth",

              block:
                "center"
            }
          );

        },
        700
      );

    }


    /* =====================================================
       WAX SEAL CLICK
    ====================================================== */

    if (
      waxSeal
    ) {

      waxSeal.addEventListener(
        "click",
        openEnvelope
      );

    }


    /* =====================================================
       ENVELOPE CLICK
    ====================================================== */

    if (
      envelopeWrapper
    ) {

      envelopeWrapper.addEventListener(
        "click",
        (event) => {


          /*
            Prevent the Enter Website
            button from opening the envelope.
          */

          if (
            event.target.closest(
              ".enter-website-button"
            )
          ) {

            return;

          }


          openEnvelope();

        }
      );

    }


    /* =====================================================
       OPEN BUTTON CLICK
    ====================================================== */

    if (
      openButton
    ) {

      openButton.addEventListener(
        "click",
        openEnvelope
      );

    }


  }
);