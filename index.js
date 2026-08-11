var SUPABASE_URL = "https://wrfsbvklvxngamyyibrr.supabase.co";

var SUPABASE_KEY =
  "sb_publishable_IGLKqmkWcGvnqyknOmwsIw_6gCrqZMo";

var supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


document.addEventListener(
  "DOMContentLoaded",
  function () {

    var notes = [];
    var currentUser = null;
    var deleteId = null;


    var emailInput =
      document.getElementById("emailInput");

    var passwordInput =
      document.getElementById("passwordInput");

    var signupBtn =
      document.getElementById("signupBtn");

    var loginBtn =
      document.getElementById("loginBtn");

    var logoutBtn =
      document.getElementById("logoutBtn");

    var authStatus =
      document.getElementById("authStatus");

    var notesContainer =
      document.getElementById("notesContainer");

    var emptyState =
      document.getElementById("emptyState");

    var addNoteBtn =
      document.getElementById("addNoteBtn");

    var addNoteModal =
      document.getElementById("addNoteModal");

    var closeModalBtn =
      document.getElementById("closeModalBtn");

    var noteForm =
      document.getElementById("noteForm");

    var searchInput =
      document.getElementById("searchInput");

    var filterSelect =
      document.getElementById("filterSelect");

    var confirmModal =
      document.getElementById("confirmModal");

    var cancelDeleteBtn =
      document.getElementById("cancelDeleteBtn");

    var confirmDeleteBtn =
      document.getElementById("confirmDeleteBtn");


    function status(message, error) {

      authStatus.textContent = message;

      authStatus.className =
        "auth-status";

      if (error) {
        authStatus.classList.add(
          "auth-error"
        );
      }
    }


    function loggedIn() {

      emailInput.style.display = "none";

      passwordInput.style.display = "none";

      signupBtn.style.display = "none";

      loginBtn.style.display = "none";

      logoutBtn.style.display =
        "inline-block";
    }


    function loggedOut() {

      emailInput.style.display = "";

      passwordInput.style.display = "";

      signupBtn.style.display =
        "inline-block";

      loginBtn.style.display =
        "inline-block";

      logoutBtn.style.display = "none";
    }


    // SIGN UP

    signupBtn.addEventListener(
      "click",
      async function () {

        var email =
          emailInput.value.trim();

        var password =
          passwordInput.value;


        if (!email || !password) {

          status(
            "Enter an email and password.",
            true
          );

          return;
        }


        if (password.length < 6) {

          status(
            "Password must be at least 6 characters.",
            true
          );

          return;
        }


        signupBtn.disabled = true;

        loginBtn.disabled = true;

        status(
          "Creating account..."
        );


        var result =
          await supabaseClient.auth.signUp(
            {
              email: email,
              password: password
            }
          );


        signupBtn.disabled = false;

        loginBtn.disabled = false;


        if (result.error) {

          console.error(
            "SIGNUP ERROR:",
            result.error
          );

          status(
            result.error.message,
            true
          );

          return;
        }


        if (result.data.session) {

          currentUser =
            result.data.user;

          loggedIn();

          status(
            "Account created and logged in!"
          );

          await loadNotes();

        } else {

          status(
            "Account created! Check your email to confirm it."
          );
        }

      }
    );


    // LOGIN

    loginBtn.addEventListener(
      "click",
      async function () {

        var email =
          emailInput.value.trim();

        var password =
          passwordInput.value;


        if (!email || !password) {

          status(
            "Enter your email and password.",
            true
          );

          return;
        }


        loginBtn.disabled = true;

        signupBtn.disabled = true;

        status(
          "Logging in..."
        );


        var result =
          await supabaseClient.auth.signInWithPassword(
            {
              email: email,
              password: password
            }
          );


        loginBtn.disabled = false;

        signupBtn.disabled = false;


        if (result.error) {

          console.error(
            "LOGIN ERROR:",
            result.error
          );

          status(
            result.error.message,
            true
          );

          return;
        }


        currentUser =
          result.data.user;

        loggedIn();

        status(
          "Logged in as " +
          currentUser.email
        );

        await loadNotes();

      }
    );


    // LOGOUT

    logoutBtn.addEventListener(
      "click",
      async function () {

        var result =
          await supabaseClient.auth.signOut();


        if (result.error) {

          console.error(
            "LOGOUT ERROR:",
            result.error
          );

          return;
        }


        currentUser = null;

        notes = [];

        loggedOut();

        renderNotes();

        status(
          "Logged out."
        );

      }
    );


    // LOAD NOTES

    async function loadNotes() {

      if (!currentUser) {
        return;
      }


      var result =
        await supabaseClient
          .from("notes")
          .select("*")
          .eq(
            "user_id",
            currentUser.id
          )
          .order(
            "created_at",
            {
              ascending: false
            }
          );


      if (result.error) {

        console.error(
          "LOAD NOTES ERROR:",
          result.error
        );

        status(
          "Could not load notes: " +
          result.error.message,
          true
        );

        return;
      }


      notes =
        result.data || [];


      renderNotes();

    }


    // SAVE NOTE

    noteForm.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();


        if (!currentUser) {

          status(
            "Please log in first.",
            true
          );

          return;
        }


        var title =
          document
            .getElementById("noteTitle")
            .value
            .trim();


        var content =
          document
            .getElementById("noteContent")
            .value
            .trim();


        var selected =
          document.querySelector(
            'input[name="noteTag"]:checked'
          );


        var tag =
          selected
            ? selected.value
            : "ideas";


        var result =
          await supabaseClient
            .from("notes")
            .insert(
              {
                user_id:
                  currentUser.id,

                title:
                  title,

                content:
                  content,

                tag:
                  tag
              }
            )
            .select()
            .single();


        if (result.error) {

          console.error(
            "SAVE NOTE ERROR:",
            result.error
          );

          alert(
            result.error.message
          );

          return;
        }


        notes.unshift(
          result.data
        );


        renderNotes();

        closeAddModal();

      }
    );


    // DISPLAY NOTES

    function renderNotes(
      list
    ) {

      if (!list) {
        list = notes;
      }


      notesContainer.innerHTML =
        "";


      list.forEach(
        function (note) {

          var card =
            document.createElement(
              "div"
            );


          card.className =
            "note-card fade-in";


          var content =
            document.createElement(
              "div"
            );


          content.className =
            "note-content";


          var header =
            document.createElement(
              "div"
            );


          header.className =
            "note-header";


          var title =
            document.createElement(
              "h3"
            );


          title.className =
            "note-title";

          title.textContent =
            note.title;


          var actions =
            document.createElement(
              "div"
            );


          actions.className =
            "note-actions";


          var button =
            document.createElement(
              "button"
            );


          button.className =
            "delete-btn";

          button.type =
            "button";

          button.innerHTML =
            '<i class="fas fa-trash"></i>';


          button.addEventListener(
            "click",
            function () {

              deleteId =
                note.id;

              confirmModal.classList.add(
                "active"
              );

            }
          );


          actions.appendChild(
            button
          );


          header.appendChild(
            title
          );

          header.appendChild(
            actions
          );


          var text =
            document.createElement(
              "p"
            );


          text.className =
            "note-text";

          text.textContent =
            note.content;


          var footer =
            document.createElement(
              "div"
            );


          footer.className =
            "note-footer";


          var tag =
            document.createElement(
              "span"
            );


          tag.className =
            "note-tag " +
            getTagClass(
              note.tag
            );


          tag.innerHTML =
            getTagIcon(
              note.tag
            ) +
            " " +
            getTagName(
              note.tag
            );


          var date =
            document.createElement(
              "span"
            );


          date.className =
            "note-date";

          date.textContent =
            formatDate(
              note.created_at
            );


          footer.appendChild(
            tag
          );

          footer.appendChild(
            date
          );


          content.appendChild(
            header
          );

          content.appendChild(
            text
          );

          content.appendChild(
            footer
          );


          card.appendChild(
            content
          );


          notesContainer.appendChild(
            card
          );

        }
      );


      if (list.length === 0) {

        emptyState.style.display =
          "block";

      } else {

        emptyState.style.display =
          "none";
      }

    }


    // DELETE

    confirmDeleteBtn.addEventListener(
      "click",
      async function () {

        if (!deleteId || !currentUser) {
          return;
        }


        var result =
          await supabaseClient
            .from("notes")
            .delete()
            .eq(
              "id",
              deleteId
            )
            .eq(
              "user_id",
              currentUser.id
            );


        if (result.error) {

          console.error(
            "DELETE ERROR:",
            result.error
          );

          alert(
            result.error.message
          );

          return;
        }


        notes =
          notes.filter(
            function (note) {
              return (
                note.id !==
                deleteId
              );
            }
          );


        deleteId = null;

        confirmModal.classList.remove(
          "active"
        );


        renderNotes();

      }
    );


    cancelDeleteBtn.addEventListener(
      "click",
      function () {

        deleteId = null;

        confirmModal.classList.remove(
          "active"
        );

      }
    );


    // ADD NOTE BUTTON

    addNoteBtn.addEventListener(
      "click",
      function () {

        if (!currentUser) {

          status(
            "Please log in first.",
            true
          );

          return;
        }


        addNoteModal.classList.add(
          "active"
        );

      }
    );


    closeModalBtn.addEventListener(
      "click",
      closeAddModal
    );


    function closeAddModal() {

      addNoteModal.classList.remove(
        "active"
      );

      noteForm.reset();

    }


    // SEARCH AND FILTER

    searchInput.addEventListener(
      "input",
      filterNotes
    );


    filterSelect.addEventListener(
      "change",
      filterNotes
    );


    function filterNotes() {

      var search =
        searchInput.value
          .toLowerCase()
          .trim();


      var filter =
        filterSelect.value;


      var filtered =
        notes.filter(
          function (note) {

            var matchesSearch =
              !search ||
              note.title
                .toLowerCase()
                .includes(search) ||
              note.content
                .toLowerCase()
                .includes(search);


            var matchesFilter =
              filter === "all" ||
              note.tag === filter;


            return (
              matchesSearch &&
              matchesFilter
            );

          }
        );


      renderNotes(
        filtered
      );

    }


    // TAG HELPERS

    function getTagClass(tag) {

      var classes = {
        school: "tag-school",
        random: "tag-random",
        ideas: "tag-ideas",
        reminders: "tag-reminders"
      };


      return (
        classes[tag] || ""
      );

    }


    function getTagIcon(tag) {

      var icons = {
        school:
          '<i class="fas fa-briefcase"></i>',

        random:
          '<i class="fas fa-user"></i>',

        ideas:
          '<i class="fas fa-lightbulb"></i>',

        reminders:
          '<i class="fas fa-bell"></i>'
      };


      return (
        icons[tag] || ""
      );

    }


    function getTagName(tag) {

      var names = {
        school: "School",
        random: "Random",
        ideas: "Ideas",
        reminders: "Reminders"
      };


      return (
        names[tag] || tag
      );

    }


    function formatDate(
      value
    ) {

      if (!value) {
        return "";
      }


      return new Date(
        value
      ).toLocaleString(
        "en-GB",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        }
      );

    }


    // CHECK EXISTING SESSION

    async function checkSession() {

      var result =
        await supabaseClient.auth.getSession();


      if (result.error) {

        console.error(
          "SESSION ERROR:",
          result.error
        );

        return;
      }


      if (result.data.session) {

        currentUser =
          result.data.session.user;

        loggedIn();

        status(
          "Logged in as " +
          currentUser.email
        );

        await loadNotes();

      } else {

        loggedOut();

      }

    }


    checkSession();

  }
);
