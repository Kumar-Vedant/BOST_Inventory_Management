// Replace with your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBmuxFMqeof0jGlP-VUU6t1kWfvCUIdsII",
    authDomain: "bost-inventory-management.firebaseapp.com",
    projectId: "bost-inventory-management",
    storageBucket: "bost-inventory-management.firebasestorage.app",
    messagingSenderId: "391583213574",
    appId: "1:391583213574:web:b08278d8ab678a2937fb87",
    measurementId: "G-GZML7BBYEY"
  };
  
  firebase.initializeApp(firebaseConfig);
  
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  const adminEmails = ["2023aib1011@iitrpr.ac.in", "2023aib1011@iitrpr.ac.in", "2023aib1016@iitrpr.ac.in", "2023aib1017@iitrpr.ac.in", "admin1@iitrpr.ac.in", "admin2@iitrpr.ac.in"];
  
  const logoutBtn = document.getElementById("logoutBtn");
  const adminControls = document.getElementById("adminControls");
  const addItemForm = document.getElementById("addItemForm");
  const itemList = document.getElementById("itemList");
  
  logoutBtn.onclick = () => {
    auth.signOut();
  };
  
  auth.onAuthStateChanged(user => {
    if (!user) {
      // Not logged in, redirect to login page
      window.location.href = "login.html";
    } else {
      // Show/hide admin controls based on email
      const isAdmin = adminEmails.includes(user.email);
      adminControls.classList.toggle("hidden", !isAdmin);
  
      // Load items
      loadItems();
    }
  });
  
  // Add new item handler
  addItemForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("itemName").value.trim();
    const club = document.getElementById("itemClub").value.trim();
  
    if (!name || !club) {
      alert("Please fill in all fields.");
      return;
    }
  
    db.collection("items").add({
      name,
      club,
      status: "Available",
      issuedTo: ""
    }).then(() => {
      addItemForm.reset();
    }).catch(error => {
      alert("Error adding item: " + error.message);
    });
  });
  
  function loadItems() {
    db.collection("items").orderBy("name").onSnapshot(snapshot => {
      itemList.innerHTML = "";
  
      if (snapshot.empty) {
        itemList.innerHTML = `<p class="text-gray-600 col-span-full">No items found.</p>`;
        return;
      }
  
      snapshot.forEach(doc => {
        const item = doc.data();
        const itemId = doc.id;
        const isAdmin = adminEmails.includes(auth.currentUser.email);
  
        // Build card container
        const card = document.createElement("div");
        // card.className = "bg-white rounded shadow p-4 mb-4 flex flex-col justify-between";
        card.className = "bg-white rounded shadow p-4 mb-4 flex flex-col justify-between min-w-[300px]";
  
        // Status display
        const statusHtml = `
          <span class="text-gray-700"><strong>Status:</strong> ${escapeHtml(item.status)}</span>
        `;
  
        // “Issued To” display (only if issued)
        const issuedToHtml = (item.status === "Issued" && item.issuedTo)
          ? `<p class="text-gray-700 mt-2"><strong>Issued To:</strong> ${escapeHtml(item.issuedTo)}</p>`
          : "";
  
        // Build button row: Request (everyone, if Available), Make Available (admin, if Issued), Delete (admin always)
        let buttonsHtml = `<div class="flex justify-center space-x-4 mt-3">`;
  
        // 1) Request Item (everyone) only if status is Available
        if (item.status === "Available") {
          buttonsHtml += `
            <button
              onclick="requestItem('${itemId}')"
              class="flex-1 text-center bg-blue-500 hover:bg-blue-600 text-white py-2 rounded text-sm transition">
              Request Item
            </button>
          `;
        }
  
        // 2) “Make Available” (admins) only if status is Issued
        if (isAdmin && item.status === "Issued") {
          buttonsHtml += `
            <button
              onclick="makeAvailable('${itemId}')"
              class="flex-1 text-center bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded text-sm transition">
              Make Available
            </button>
          `;
        }
  
        // 3) Delete button (admins, always)
        if (isAdmin) {
          buttonsHtml += `
            <button
              onclick="deleteItem('${itemId}')"
              class="flex-1 text-center bg-red-500 hover:bg-red-600 text-white py-2 rounded text-sm transition">
              Delete
            </button>
          `;
        }
  
        buttonsHtml += `</div>`;
  
        // Pending requests (admins only)
        let pendingRequestsHtml = "";
        if (isAdmin && Array.isArray(item.requests) && item.requests.length > 0) {
          pendingRequestsHtml = `
            <div class="mt-3">
              <p class="font-medium text-gray-800">Pending Requests:</p>
              <ul class="mt-1 space-y-1">
                ${item.requests.map(email => `
                  <li class="flex justify-between items-center text-sm text-gray-700">
                    <span>${escapeHtml(email)}</span>
                    <button
                      onclick="approveRequest('${itemId}', '${email}')"
                      class="ml-2 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs transition">
                      Approve
                    </button>
                  </li>
                `).join("")}
              </ul>
            </div>
          `;
        }
  
        // Assemble full card.HTML
        card.innerHTML = `
          <div>
            <h3 class="text-lg font-bold mb-1">${escapeHtml(item.name)}</h3>
            <p class="text-gray-700 mb-1"><strong>Club:</strong> ${escapeHtml(item.club)}</p>
            ${statusHtml}
            ${issuedToHtml}
          </div>
  
          ${buttonsHtml}
  
          ${pendingRequestsHtml}
        `;
  
        itemList.appendChild(card);
      });
    }, error => {
      itemList.innerHTML = `<p class="text-red-600 col-span-full">Failed to load items: ${error.message}</p>`;
    });
  }
  
  // Admin-only: mark an issued item back to “Available”
  function makeAvailable(itemId) {
    const itemRef = db.collection("items").doc(itemId);
    itemRef.update({
      status: "Available",
      issuedTo: "",
      requests: []  // clear any pending requests
    }).catch(error => {
      alert("Error updating status: " + error.message);
    });
  }
  
  // (Keep escapeHtml, requestItem, approveRequest, deleteItem as before)
  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, m => ({
      '&': "&amp;",
      '<': "&lt;",
      '>': "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[m]);
  }
  
  function requestItem(itemId) {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to request an item.");
      return;
    }
    db.collection("items").doc(itemId).update({
      requests: firebase.firestore.FieldValue.arrayUnion(user.email)
    }).then(() => {
      alert("Your request has been submitted.");
    }).catch(error => {
      alert("Error submitting request: " + error.message);
    });
  }
  
  function approveRequest(itemId, email) {
    const itemRef = db.collection("items").doc(itemId);
    itemRef.update({
      status: "Issued",
      issuedTo: email,
      requests: []
    }).then(() => {
      alert(`Item has been issued to ${email}`);
    }).catch(error => {
      alert("Error approving request: " + error.message);
    });
  }
  
  function deleteItem(itemId) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    db.collection("items").doc(itemId).delete()
      .catch(error => {
        alert("Error deleting item: " + error.message);
      });
  }
     