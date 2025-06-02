// Your Firebase config - replace with your own
const firebaseConfig = {
    apiKey: "AIzaSyBmuxFMqeof0jGlP-VUU6t1kWfvCUIdsII",
    authDomain: "bost-inventory-management.firebaseapp.com",
    projectId: "bost-inventory-management",
    storageBucket: "bost-inventory-management.firebasestorage.app",
    messagingSenderId: "391583213574",
    appId: "1:391583213574:web:b08278d8ab678a2937fb87",
    measurementId: "G-GZML7BBYEY"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  
  // Get Google login button (last button on your page)
  const googleBtn = document.querySelector("button.flex.items-center.justify-center");
  
  // Handle Google login click
  googleBtn.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .then(result => {
        // Redirect to items page after successful login
        window.location.href = "items.html";
      })
      .catch(error => {
        alert("Login failed: " + error.message);
      });
  });
  