var SUPABASE_URL = "https://wrfsbvklvxngamyyibrr.supabase.co";

var SUPABASE_KEY =
  "sb_publishable_IGLKqmkWcGvnqyknOmwsIw_6gCrqZMo";

var supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

document.addEventListener("DOMContentLoaded", function () {
  var notesContainer =
    document.getElementById("notesContainer");

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

  var emptyState =
    document.getElementById("emptyState");

  var confirmModal =
    document.getElementById("confirmModal");

  var cancelDeleteBtn =
    document.getElementById("cancelDeleteBtn");

  var confirmDeleteBtn =
    document.getElementById("confirmDeleteBtn");

  var emailInput =
    document.getElementById("emailInput");

  var passwordInput =
    document.getElementById("passwordInput");

  var loginBtn =
    document.getElementById("loginBtn");

  var signupBtn =
    document.getElementById("signupBtn");

  var logoutBtn =
    document.getElementById("logoutBtn");

  var authStatus =
    document.getElementById("authStatus");

  var notes = [];

  var currentUser = null;

  var noteToDeleteId = null;


  // --------------------------------
  // Check that Supabase loaded
  // --------------------------------

  if (!window.supabase) {
    console.error(
      "Supabase library did not load."
    );

    return;
  }


  // --------------------------------
  // Authentication status
  // --------------------------------

  function showStatus(message, type) {
    authStatus.textContent = message;

    authStatus.className =
      "auth-status";

    if (type === "error") {
      authStatus.classList.add(
        "auth-error"
      );
    }

    if (type === "success") {
      authStatus.classList.add(
        "auth-success"
      );
    }
  }


  // --------------------------------
  // Sign up
  // --------------------------------

  signupBtn.addEventListener(
    "click",
    function () {
      signUp();
    }
  );


  async function signUp() {
    var email =
      emailInput.value.trim();

    var password =
      passwordInput.value;


    if (!email) {
      showStatus(
        "Please enter your email.",
        "error"
      );

      return;
    }


    if (!password) {
      showStatus(
        "Please enter a password.",
        "error"
      );

      return;
    }


    if (password.length < 6) {
      showStatus(
        "Password must be at least 6 characters.",
        "error"
      );

      return;
    }


    signupBtn.disabled = true;
    loginBtn.disabled = true;


    showStatus(
      "Creating your account..."
    );


    try {
      var result =
        await supabaseClient.auth.signUp(
          {
            email: email,
            password: password
          }
        );


      if (result.error) {
        console.error(
          "Supabase signup error:",
          result.error
        );

        showStatus(
          result.error.message,
          "error"
        );

        return;
      }


      if (result.data.user) {
        currentUser =
          result.data.user;
      }


      if (result.data.session) {
        showLoggedIn();

        showStatus(
          "Account created! You are now logged in.",
          "success"
        );

        await loadNotes();
      } else {
        showStatus(
          "Account created! Check your email to confirm your account, then log in.",
          "success"
        );
      }

    } catch (error) {
      console.error(
        "Signup error:",
        error
      );

      showStatus(
        "Something went wrong. Check the browser console.",
        "error"
      );

    } finally {
      signupBtn.disabled = false;
      loginBtn.disabled = false;
    }
  }


  // --------------------------------
  // Log in
  // --------------------------------

  loginBtn.addEventListener(
    "click",
    function () {
      logIn();
    }
  );


  async function logIn() {
    var email =
      emailInput.value.trim();

    var password =
      passwordInput.value;


    if (!email || !password) {
      showStatus(
        "Please enter your email and password.",
        "error"
      );

      return;
    }


    loginBtn.disabled = true;
    signupBtn.disabled = true;


    showStatus(
      "Logging in..."
    );


    try {
      var result =
        await supabaseClient.auth.signInWithPassword(
          {
            email: email,
            password: password
          }
        );


      if (result.error) {
        console.error(
          "Supabase login error:",
          result.error
        );

        showStatus(
          result.error.message,
          "error"
        );

        return;
      }


      currentUser =
        result.data.user;


      showLoggedIn();


      showStatus(
        "Logged in as " +
          currentUser.email,
        "success"
      );


      await loadNotes();

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      showStatus(
        "Something went wrong. Check the browser console.",
        "error"
      );

    } finally {
      loginBtn.disabled = false;
      signupBtn.disabled = false;
    }
  }


  // --------------------------------
  // Log out
  // --------------------------------

  logoutBtn.addEventListener(
    "click",
    async function () {
      var result =
        await supabaseClient.auth.signOut();


      if (result.error) {
        console.error(
          "Logout error:",
          result.error
        );

        return;
      }


      currentUser = null;

      notes = [];


      emailInput.style.display = "";

      passwordInput.style.display = "";

      loginBtn.style.display = "";

      signupBtn.style.display = "";

      logoutBtn.style.display = "none";


      renderNotes();

      updateEmptyState();


      showStatus(
        "You have been logged out."
      );
    }
  );


  // --------------------------------
  // Show logged-in state
  // --------------------------------

  function showLoggedIn() {
    emailInput.style.display = "none";

    passwordInput.style.display = "none";

    loginBtn.style.display = "none";

    signupBtn.style.display = "none";

    logoutBtn.style.display = "inline-block";
  }


  // --------------------------------
  // Check existing login
  // --------------------------------

  async function checkSession() {
    try {
      var result =
        await supabaseClient.auth.getSession();


      if (result.error) {
        console.error(
          "Session error:",
          result.error
        );

        return;
      }


      if (result.data.session) {
        currentUser =
          result.data.session.user;


        showLoggedIn();


        showStatus(
          "Logged in as " +
            currentUser.email,
          "success"
        );


        await loadNotes();
      }

    } catch (error) {
      console.error(
        "Session check error:",
        error
      );
    }
  }


  // --------------------------------
  // Load notes
  // --------------------------------

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
        "Could not load notes:",
        result.error
      );

      showStatus(
        "Could not load notes: " +
          result.error.message,
        "error"
      );

      return;
    }


    notes =
      result.data || [];


    renderNotes();

    updateEmptyState();
  }


  // --------------------------------
  // Add note
  // --------------------------------

  noteForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();


      if (!currentUser) {
        showStatus(
          "Please log in first.",
          "error"
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


      var selectedTag =
        document.querySelector(
          'input[name="noteTag"]:checked'
        );


      var tag =
        selectedTag
          ? selectedTag.value
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
          "Could not save note:",
          result.error
        );

        alert(
          "Could not save note: " +
            result.error.message
        );

        return;
      }


      notes.unshift(
        result.data
      );


      renderNotes();

      updateEmptyState();

      closeAddNoteModal();
    }
  );


  // --------------------------------
  // Render notes
  // --------------------------------

  function renderNotes(
    notesToRender
  ) {
    if (!notesToRender) {
      notesToRender = notes;
    }


    notesContainer.innerHTML = "";


    notesToRender.forEach(
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
            noteToDeleteId =
              note.id;

            confirmModal.classList.add(
              "active"
            );

            document.body.style.overflow =
              "hidden";
          }
        );


        actions.appendChild(
          deleteButton
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
          getTagClass(note.tag);


        tag.innerHTML =
          getTagIcon(note.tag) +
          " " +
          getTagName(note.tag);


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
  }


  // --------------------------------
  // Search
  // --------------------------------

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
      notes.slice();


    if (search) {
      filtered =
        filtered.filter(
          function (note) {
            return (
              note.title
                .toLowerCase()
                .includes(search) ||
              note.content
                .toLowerCase()
                .includes(search)
            );
          }
        );
    }


    if (filter !== "all") {
      filtered =
        filtered.filter(
          function (note) {
            return (
              note.tag ===
              filter
            );
          }
        );
    }


    renderNotes(
      filtered
    );

    updateEmptyState(
      filtered
    );
  }


  // --------------------------------
  // Tags
  // --------------------------------

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


  // --------------------------------
  // Date
  // --------------------------------

  function formatDate(
    dateString
  ) {
    if (!dateString) {
      return "";
    }


    var date =
      new Date(dateString);


    return date.toLocaleString(
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


  // --------------------------------
  // Add note modal
  // --------------------------------

  addNoteBtn.addEventListener(
    "click",
    function () {
      if (!currentUser) {
        showStatus(
          "Please log in first.",
          "error"
        );

        return;
      }


      addNoteModal.classList.add(
        "active"
      );

      document.body.style.overflow =
        "hidden";
    }
  );


  closeModalBtn.addEventListener(
    "click",
    closeAddNoteModal
  );


  function closeAddNoteModal() {
    addNoteModal.classList.remove(
      "active"
    );

    document.body.style.overflow =
      "auto";

    noteForm.reset();
  }


  // --------------------------------
  // Delete modal
  // --------------------------------

  cancelDeleteBtn.addEventListener(
    "click",
    closeConfirmModal
  );


  confirmDeleteBtn.addEventListener(
    "click",
    async function () {
      if (
        !currentUser ||
        !noteToDeleteId
      ) {
        closeConfirmModal();

        return;
      }


      var result =
        await supabaseClient
          .from("notes")
          .delete()
          .eq(
            "id",
            noteToDeleteId
          )
          .eq(
            "user_id",
            currentUser.id
          );


      if (result.error) {
        console.error(
          "Could not delete note:",
          result.error
        );

        alert(
          "Could not delete note: " +
            result.error.message
        );

        return;
      }


      notes =
        notes.filter(
          function (note) {
            return (
              note.id !==
              noteToDeleteId
            );
          }
        );


      closeConfirmModal();

      renderNotes();

      updateEmptyState();
    }
  );


  function closeConfirmModal() {
    confirmModal.classList.remove(
      "active"
    );

    document.body.style.overflow =
      "auto";

    noteToDeleteId = null;
  }


  // --------------------------------
  // Start
  // --------------------------------

  checkSession();
});
