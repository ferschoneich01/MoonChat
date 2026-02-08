
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirm-password');
const message = document.getElementById('password-msg');
const registerBtn = document.getElementById('register-btn');

function validatePasswords() {
    if (confirmPassword.value === '') {
        message.textContent = '';
        registerBtn.disabled = true;
        return;
    }

    if (password.value === confirmPassword.value) {
        message.textContent = 'Passwords match';
        message.style.color = '#4ade80'; // verde
        registerBtn.disabled = false;
    } else {
        message.textContent = 'Passwords do not match';
        message.style.color = '#f87171'; // rojo
        registerBtn.disabled = true;
    }
}

password.addEventListener('input', validatePasswords);
confirmPassword.addEventListener('input', validatePasswords);