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
    // =========================
    // VARIABLES
    // =========================
    var notes = [];
    var currentUser = null;
    var editingNoteId = null;
    // =========================
    // HTML ELEMENTS
    // =========================
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
    var noteTitle =
      document.getElementById("noteTitle");
    var noteContent =
      document.getElementById("noteContent");
    
    // =========================
    // STATUS MESSAGE
    // =========================
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
    // =========================
    // LOGIN UI
    // =========================
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
    // =========================
    // SIGN UP
    // =========================
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
            "Account created and logged in"
          );
          await loadNotes();
        } else {
          status(
            "Account created. Check your email to confirm it."
          );
        }
      }
    );
    // =========================
    // LOGIN
    // =========================
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
          "Logging in.."
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
    // =========================
    // LOGOUT
    // =========================
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
    // =========================
    // LOAD NOTES
    // =========================
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
    // =========================
    // ADD / EDIT NOTE
    // =========================

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
          noteTitle.value.trim();

        var content =
          noteContent.value.trim();


        var selected =
          document.querySelector(
            'input[name="noteTag"]:checked'
          );


        var tag =
          selected
            ? selected.value
            : "ideas";


        // =========================
        // EDIT EXISTING NOTE
        // =========================

        if (editingNoteId !== null) {

          var updateResult =
            await supabaseClient
              .from("notes")
              .update(
                {
                  title: title,
                  content: content,
                  tag: tag
                }
              )
              .eq(
                "id",
                editingNoteId
              )
              .eq(
                "user_id",
                currentUser.id
              )
              .select()
              .single();


          if (updateResult.error) {

            console.error(
              "UPDATE NOTE ERROR:",
              updateResult.error
            );

            alert(
              updateResult.error.message
            );

            return;
          }


          // Replace the old note
          // with the updated note
          notes =
            notes.map(
              function (note) {

                if (
                  note.id ===
                  editingNoteId
                ) {
                  return updateResult.data;
                }

                return note;
              }
            );


          editingNoteId = null;


          renderNotes();

          closeAddModal();

          return;
        }


        // =========================
        // CREATE NEW NOTE
        // =========================

        var insertResult =
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


        if (insertResult.error) {

          console.error(
            "SAVE NOTE ERROR:",
            insertResult.error
          );

          alert(
            insertResult.error.message
          );

          return;
        }


        notes.unshift(
          insertResult.data
        );


        renderNotes();

        closeAddModal();

      }
    );


    // =========================
    // DISPLAY NOTES
    // =========================

    function renderNotes(list) {

      if (!list) {
        list = notes;
      }


      notesContainer.innerHTML =
        "";


      list.forEach(
        function (note) {

          // =========================
          // NOTE CARD
          // =========================

          var card =
            document.createElement(
              "div"
            );

          card.className =
            "note-card fade-in";


          // =========================
          // CONTENT
          // =========================

          var content =
            document.createElement(
              "div"
            );

          content.className =
            "note-content";


          // =========================
          // HEADER
          // =========================

          var header =
            document.createElement(
              "div"
            );

          header.className =
            "note-header";


          // =========================
          // TITLE
          // =========================

          var title =
            document.createElement(
              "h3"
            );

          title.className =
            "note-title";

          title.textContent =
            note.title;


          // =========================
          // ACTION BUTTONS
          // =========================

          var actions =
            document.createElement(
              "div"
            );

          actions.className =
            "note-actions";


          // =========================
          // EDIT BUTTON
          // =========================

          var editButton =
            document.createElement(
              "button"
            );

          editButton.className =
            "edit-btn";

          editButton.type =
            "button";

          editButton.innerHTML =
            '<i class="fas fa-edit"></i>';


          editButton.addEventListener(
            "click",
            function () {

              openEditModal(
                note
              );

            }
          );


          // =========================
          // DELETE BUTTON
          // =========================

          var deleteButton =
            document.createElement(
              "button"
            );

          deleteButton.className =
            "delete-btn";

          deleteButton.type =
            "button";

          deleteButton.innerHTML =
            '<i class="fas fa-trash"></i>';


          deleteButton.addEventListener(
            "click",
            function () {

              deleteId =
                note.id;

              confirmModal.classList.add(
                "active"
              );

            }
          );


          // Add buttons
          // to actions container

          actions.appendChild(
            editButton
          );

          actions.appendChild(
            deleteButton
          );


          // =========================
          // HEADER
          // =========================

          header.appendChild(
            title
          );

          header.appendChild(
            actions
          );


          // =========================
          // NOTE TEXT
          // =========================

          var text =
            document.createElement(
              "p"
            );

          text.className =
            "note-text";

          text.textContent =
            note.content;


          // =========================
          // FOOTER
          // =========================

          var footer =
            document.createElement(
              "div"
            );

          footer.className =
            "note-footer";


          // =========================
          // TAG
          // =========================

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


          // =========================
          // DATE
          // =========================

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
          // =========================
          // BUILD NOTE
          // =========================
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
      // =========================
      // EMPTY STATE
      // =========================
      if (list.length === 0) {
        emptyState.style.display =
          "block";
      } else {
        emptyState.style.display =
          "none";
      }
    }
    // =========================
    // OPEN EDIT MODAL
    // =========================
    function openEditModal(note) {
      if (!currentUser) {
        status(
          "Please log in first.",
          true
        );
        return;
      }
      editingNoteId =
        note.id;
      noteTitle.value =
        note.title;
      noteContent.value =
        note.content;
      var tagRadio =
        document.querySelector(
          'input[name="noteTag"][value="' +
          note.tag +
          '"]'
        );
      if (tagRadio) {
        tagRadio.checked =
          true;
      }
      // Change modal title
      var modalTitle =
        document.querySelector(
          ".modal-title"
        );
      if (modalTitle) {
        modalTitle.textContent =
          "Edit Note";
      }
      addNoteModal.classList.add(
        "active"
      );
    }
    // =========================
    // DELETE NOTE
    // =========================
    confirmDeleteBtn.addEventListener(
      "click",
      async function () {
        if (
          !deleteId ||
          !currentUser
        ) {
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
    // =========================
    // CANCEL DELETE
    // =========================
    cancelDeleteBtn.addEventListener(
      "click",
      function () {
        deleteId = null;
        confirmModal.classList.remove(
          "active"
        );
      }
    );
    // =========================
    // ADD NOTE BUTTON
    // =========================
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
        editingNoteId = null;
        noteForm.reset();
        var modalTitle =
          document.querySelector(
            ".modal-title"
          );
        if (modalTitle) {
          modalTitle.textContent =
            "New Note";
        }
        addNoteModal.classList.add(
          "active"
        );
      }
    );
    // =========================
    // CLOSE ADD/EDIT MODAL
    // =========================
    closeModalBtn.addEventListener(
      "click",
      closeAddModal
    );
    function closeAddModal() {
      addNoteModal.classList.remove(
        "active"
      );
      noteForm.reset();
      editingNoteId = null;
      var modalTitle =
        document.querySelector(
          ".modal-title"
        );
      if (modalTitle) {
        modalTitle.textContent =
          "New Note";
      }
    }
    // =========================
    // SEARCH
    // =========================
    searchInput.addEventListener(
      "input",
      filterNotes
    );
    // =========================
    // FILTER
    // =========================
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
    // =========================
    // TAG CLASS
    // =========================
    function getTagClass(tag) {
      var classes = {
        school:
          "tag-school",
        random:
          "tag-random",
        ideas:
          "tag-ideas",
        reminders:
          "tag-reminders"
      };
      return (
        classes[tag] || ""
      );
    }
    // =========================
    // TAG ICON
    // =========================
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
    // ========================
    // TAG NAME
    // =========================
    function getTagName(tag) {
      var names = {
        school:
          "School",
        random:
          "Random",
        ideas:
          "Ideas",
        reminders:
          "Reminders"
      };
      return (
        names[tag] || tag
      );
    }
    // =========================
    // FORMAT DATE
    // =========================
    function formatDate(value) {
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
    // =========================
    // CHECK EXISTING SESSION
    // =========================
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
