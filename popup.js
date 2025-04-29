document.addEventListener('DOMContentLoaded', function() {
  const greetButton = document.getElementById('greetButton');
  const messageElement = document.getElementById('message');

  greetButton.addEventListener('click', function() {
    const currentTime = new Date().toLocaleTimeString();
    messageElement.textContent = `Hello! The current time is ${currentTime}`;
    messageElement.style.color = '#4285f4';
  });
}); 