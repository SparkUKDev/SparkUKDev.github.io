import { auth, db } from './firebase.js';
import { updateProfile } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { doc, updateDoc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'; // Added onSnapshot for real-time updates

// Removed STORAGE_KEY, loadSettings, saveSettings related to user-specific data from this file.
// All user-specific settings (username, preferredMood) will now be directly fetched from/saved to Firestore.

document.addEventListener('DOMContentLoaded', () => {
  const displayNameInput = document.getElementById('displayName');
  const moodSelect = document.getElementById('preferredMood');
  const saveBtn = document.getElementById('save-settings');
  const clearBtn = document.getElementById('clear-settings');
  const status = document.getElementById('settings-status');
  const pageLoader = document.getElementById('page-loader'); // Assuming a page-level loader

  // Initially disable the form inputs and save button
  if (displayNameInput) displayNameInput.disabled = true;
  if (moodSelect) moodSelect.disabled = true;
  if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.classList.add('opacity-70'); // Visually indicate disabled state
  }
  if (clearBtn) clearBtn.disabled = true;

  // Show a loading message or loader
  if (status) {
      status.textContent = 'Loading user settings...';
      status.classList.remove('text-red-500', 'text-green-600');
      status.classList.add('text-gray-500');
  }
  if (pageLoader) pageLoader.style.display = 'flex'; // Ensure loader is visible

  // --- Crucial: Wait for Firebase Auth state to be confirmed ---
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // User is logged in, now fetch their settings
      try {
          const userDocRef = doc(db, "users", user.uid);

          // Use onSnapshot for real-time updates to settings if needed,
          // otherwise a simple getDoc is sufficient here for initial load.
          // For initial load, getDoc is simpler and ensures we only populate once.
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              if (displayNameInput && userData.username) {
                  displayNameInput.value = userData.username;
                  displayNameInput.disabled = false; // Enable after loading
              }
              if (moodSelect && userData.preferredMood) {
                  moodSelect.value = userData.preferredMood;
                  moodSelect.disabled = false; // Enable after loading
              }
              // Optionally update Firebase Auth displayName if it's out of sync
              if (user.displayName !== userData.username) { // Use user.displayName directly
                  await updateProfile(user, { displayName: userData.username }); // Pass 'user' object directly
              }
              if (status) {
                  status.textContent = 'Settings loaded.';
                  status.classList.remove('text-red-500', 'text-gray-500');
                  status.classList.add('text-green-600');
              }
              if (saveBtn) {
                  saveBtn.disabled = false;
                  saveBtn.classList.remove('opacity-70'); // Enable save button
              }
              if (clearBtn) clearBtn.disabled = false;

          } else {
              console.warn("User profile not found in Firestore for current user on settings page. Creating default profile.");
              // Profile should ideally be created on signup, but create a default if missing
              const defaultUsername = user.email ? user.email.split('@')[0] : 'NewUser'; // Fallback
              await setDoc(userDocRef, {
                  username: defaultUsername,
                  avatarUrl: null,
                  preferredMood: 'neutral',
                  createdAt: new Date(),
              });
              // Reload the page or manually populate the form with these defaults
              if (displayNameInput) {
                  displayNameInput.value = defaultUsername;
                  displayNameInput.disabled = false;
              }
              if (moodSelect) {
                  moodSelect.value = 'neutral';
                  moodSelect.disabled = false;
              }
              if (status) {
                  status.textContent = 'Default settings loaded. Please update.';
                  status.classList.remove('text-red-500', 'text-green-600');
                  status.classList.add('text-gray-500');
              }
              if (saveBtn) {
                  saveBtn.disabled = false;
                  saveBtn.classList.remove('opacity-70');
              }
              if (clearBtn) clearBtn.disabled = false;
          }
      } catch (error) {
          console.error("Error fetching user profile for settings:", error);
          if (status) {
              status.textContent = 'Error loading settings. Please contact support.';
              status.classList.remove('text-green-600');
              status.classList.add('text-red-500');
          }
          // Keep form disabled on error
      } finally {
          if (pageLoader) pageLoader.style.display = 'none'; // Hide loader once content is loaded or error displayed
      }
    } else {
      // No user logged in. initAuthCheck (from firebase.js) should redirect to auth.html.
      // But if it fails or user navigates directly, we'll display the message.
      if (status) {
          status.textContent = 'Please sign in to view and edit your settings.';
          status.classList.remove('text-green-600', 'text-gray-500');
          status.classList.add('text-red-500');
      }
      if (pageLoader) pageLoader.style.display = 'none'; // Hide loader
      // Form elements remain disabled
    }
  });
  // --- End onAuthStateChanged ---


  // Event listener for the "Apply" (Save) button
  saveBtn && saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    // Ensure buttons are disabled and form is in saving state
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.classList.add('opacity-70');
    }
    if (status) {
        status.textContent = 'Saving...';
        status.classList.remove('text-red-500', 'text-green-600');
        status.classList.add('text-gray-500');
    }

    const newDisplayName = displayNameInput ? displayNameInput.value.trim() : '';
    const newPreferredMood = moodSelect ? moodSelect.value : '';

    let firebaseUpdateSuccessful = true;
    let statusMessage = '';

    try {
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const updates = {};

        // 1. Update Firebase Authentication's displayName
        // Only update if it's actually changed to avoid unnecessary calls and potential rate limits
        if (auth.currentUser.displayName !== newDisplayName) {
          await updateProfile(auth.currentUser, { displayName: newDisplayName });
        }
        updates.username = newDisplayName; // Always set username in Firestore to the new value

        // 2. Update preferredMood in Firestore
        updates.preferredMood = newPreferredMood;

        // Perform the Firestore update
        await updateDoc(userDocRef, updates);

        statusMessage = 'Settings saved.';

      } else {
        // This should ideally not happen if the form is disabled when not logged in
        firebaseUpdateSuccessful = false;
        statusMessage = 'Please sign in to update settings.';
        console.warn('Attempted to save settings without a logged-in user.');
      }
    } catch (err) {
      console.error('Firebase update failed:', err);
      firebaseUpdateSuccessful = false;
      statusMessage = "Something went wrong, please contact support.";
    } finally {
        // Update UI status
        if (status) {
            status.textContent = statusMessage;
            if (firebaseUpdateSuccessful) {
                status.classList.remove('text-red-500', 'text-gray-500');
                status.classList.add('text-green-600');
            } else {
                status.classList.remove('text-green-600', 'text-gray-500');
                status.classList.add('text-red-500');
            }
        }
        // Re-enable save button
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.classList.remove('opacity-70');
        }
    }
  });

  // Clear button now only clears form fields, as local storage for user data is gone.
  clearBtn && clearBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // No localStorage.removeItem(STORAGE_KEY) for user-specific data anymore
    if (displayNameInput) displayNameInput.value = '';
    if (moodSelect) moodSelect.value = '';
    if (status) {
      status.textContent = 'Form fields cleared.';
      status.classList.remove('text-red-500', 'text-green-600');
      status.classList.add('text-gray-500');
    }
    // Re-enable save button
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.classList.remove('opacity-70');
    }
  });
});
