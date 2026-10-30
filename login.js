const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showStatus(element, message, state = "info") {
  if (!element) return;
  element.textContent = message;
  element.dataset.state = state;
}

function setFieldError(input, message) {
  if (!input) return false;
  const error = document.getElementById(`${input.id}-error`);
  const wrapper = input.closest(".input-wrap");
  input.setAttribute("aria-invalid", String(Boolean(message)));
  wrapper?.setAttribute("aria-invalid", String(Boolean(message)));
  if (error) error.textContent = message;
  return Boolean(message);
}

function clearFormErrors(form) {
  form.querySelectorAll("input").forEach(input => setFieldError(input, ""));
  const status = form.querySelector(".auth-status");
  if (status) {
    status.textContent = "";
    delete status.dataset.state;
  }
}

function validateEmail(input) {
  if (!input.value.trim()) return "Enter your email address.";
  if (!emailPattern.test(input.value.trim())) return "Enter a valid email address.";
  return "";
}

document.querySelectorAll("[data-auth-form]").forEach(form => {
  const mode = form.dataset.authForm;
  const fieldset = form.querySelector(".auth-fields");
  const status = form.querySelector(".auth-status");

  form.addEventListener("submit", event => {
    event.preventDefault();
    clearFormErrors(form);

    const invalidInputs = [];
    const addError = (input, message) => {
      if (setFieldError(input, message)) invalidInputs.push(input);
    };

    if (mode === "login") {
      const email = form.querySelector('[name="email"]');
      const password = form.querySelector('[name="password"]');
      addError(email, validateEmail(email));
      addError(password, password.value.length < 8 ? "Password must be at least 8 characters." : "");

      if (!invalidInputs.length) {
        showStatus(status, "Your details look valid, but sign-in is not connected yet. Nothing was sent or saved.", "info");
      }
    }

    if (mode === "signup") {
      const name = form.querySelector('[name="name"]');
      const email = form.querySelector('[name="email"]');
      const password = form.querySelector('[name="password"]');
      const confirmation = form.querySelector('[name="confirm-password"]');
      addError(name, name.value.trim().length < 2 ? "Enter your full name." : "");
      addError(email, validateEmail(email));
      addError(password, password.value.length < 8 ? "Use at least 8 characters for your password." : "");
      addError(confirmation, !confirmation.value ? "Confirm your password." : confirmation.value !== password.value ? "The passwords do not match." : "");

      if (!invalidInputs.length) {
        showStatus(status, "Your details look valid, but account creation is not connected yet. No account was created and nothing was saved.", "info");
      }
    }

    if (invalidInputs.length) {
      showStatus(status, "Please review the highlighted fields.", "error");
      invalidInputs[0].focus();
    }
  });

  form.querySelectorAll("[data-auth-action]").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.authAction === "google") {
        showStatus(status, "Google sign-in is not configured yet. No sign-in was attempted.", "info");
      }
      if (button.dataset.authAction === "forgot") {
        showStatus(status, "Password reset is not available until AUTOX authentication is connected.", "info");
      }
    });
  });

  fieldset.disabled = false;
});

document.querySelectorAll("[data-toggle-password]").forEach(button => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.togglePassword);
    const icon = button.querySelector("i");
    if (!input) return;

    const showPassword = input.type === "password";
    input.type = showPassword ? "text" : "password";
    button.setAttribute("aria-label", showPassword ? "Hide password" : "Show password");
    button.setAttribute("aria-pressed", String(showPassword));
    icon?.classList.toggle("fa-eye", !showPassword);
    icon?.classList.toggle("fa-eye-slash", showPassword);
  });
});
