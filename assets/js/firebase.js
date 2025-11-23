import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut as _signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword as _createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD0LDHI_JiOgh_S2ALwg4SMmGc99B17cAU",
  authDomain: "spark-youth-67d89.firebaseapp.com",
  projectId: "spark-youth-67d89",
  storageBucket: "spark-youth-67d89.appspot.com",
  messagingSenderId: "649476273344",
  appId: "1:649476273344:web:0ef07acaa8c6df26f7e925",
  measurementId: "G-EZW4S95R9G"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// --- HELPER FUNCTION: generateRandomUsername ---
function generateRandomUsername() {
  const adjectives = ['Sparky', 'Funky', 'Vibrant', 'Playful', 'Brave', 'Bright', 'Clever', 'Witty', 'Curious', 'Cheerful'];
  const animals = ['Fox', 'Lion', 'Panda', 'Owl', 'Dolphin', 'Eagle', 'Koala', 'Tiger', 'Rabbit', 'Wolf'];
  
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
  const randomNumber = Math.floor(Math.random() * 90) + 10; // Generates a number between 10 and 99

  return `${randomAdj}${randomAnimal}${randomNumber}`;
}
// --- END HELPER FUNCTION ---

// --- Wrapped Function: Create User with Firestore Profile ---
export async function createUserWithEmailAndPasswordAndProfile(email, password, initialUsername = null) {
  try {
    const userCredential = await _createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const defaultUsername = (initialUsername && initialUsername.trim() !== '') 
                             ? initialUsername.trim() 
                             : generateRandomUsername();

    // Create a new document in the 'users' collection with the user's UID
    await setDoc(doc(db, "users", user.uid), {
      username: defaultUsername,
      avatarUrl: null,
      preferredMood: 'neutral',
      createdAt: new Date(),
      roles: ['member'] // Default role for new users
    });

    console.log("User account and Firestore profile created successfully for:", user.email, "with username:", defaultUsername);
    return userCredential;
  } catch (error) {
    console.error("Error creating user or Firestore profile:", error.message);
    throw error;
  }
}
// --- END Wrapped Function ---

// --- Admin link IDs that might appear on various pages ---
const adminLinkIds = [
    'admin-panel-dropdown-link',
    'admin-panel-mobile-link',
    'admin-panel-sidebar-link'
];

// --- Helper to update admin link visibility (more graceful) ---
function updateAdminLinkVisibility(isVisible) {
    adminLinkIds.forEach(id => {
        const linkElement = document.getElementById(id);
        if (linkElement) {
            if (isVisible) {
                linkElement.classList.remove('hidden');
                // console.log(`DEBUG: Admin link '${id}' is now visible.`); // Keep for specific debugging if needed
            } else {
                linkElement.classList.add('hidden');
                // console.log(`DEBUG: Admin link '${id}' is now hidden.`); // Keep for specific debugging if needed
            }
        } 
        // We no longer warn if not found. It's expected some links won't be on all pages.
        // If a link *should* be on a page but isn't visible, that points to an HTML error.
    });
}


// --- Wrapped Function: signOut to clear local storage ---
export async function signOut(authInstance) {
  try {
    await _signOut(authInstance);
    localStorage.removeItem('spark_settings');
    console.log("User signed out and relevant local storage cleared.");
    window.currentUserRoles = []; // Clear global roles on sign out

    updateAdminLinkVisibility(false); // Hide all admin links on sign out

  } catch (error) {
    console.error("Error during sign out:", error);
    throw error;
  }
}
// --- END Wrapped Function ---


// Universal Auth Check for UI Pages
export function initAuthCheck(isAuthPage = false, authPageRedirectTo = 'home.html', unauthenticatedRedirectTo = 'auth.html') {
  onAuthStateChanged(auth, async (user) => {
    const loader = document.getElementById('page-loader');
    
    // Initialize or clear global roles
    window.currentUserRoles = []; 

    if (user) {
      // User is logged in
      if (isAuthPage) {
        window.location.href = authPageRedirectTo; // Redirect to specified page if logged in on an auth page
        return;
      }
      
      const placeholderUsername = "Loading...";
      const emailDisplayElements = document.querySelectorAll('.user-email-display');
      emailDisplayElements.forEach(el => el.textContent = placeholderUsername);

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let displayUsername = "User";
        let displayPreferredMood = 'neutral';
        let userRoles = ['member'];

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          if (userData.username) {
            displayUsername = userData.username;
          }
          if (userData.preferredMood) {
            displayPreferredMood = userData.preferredMood;
          }
          if (userData.roles && Array.isArray(userData.roles)) {
            userRoles = userData.roles;
          }
        } else {
          console.warn("No user profile found in Firestore for:", user.uid, ". Creating one now.");
          const newlyGeneratedUsername = generateRandomUsername();
          await setDoc(userDocRef, {
            username: newlyGeneratedUsername,
            avatarUrl: null,
            preferredMood: 'neutral',
            createdAt: new Date(),
            roles: ['member']
          });
          displayUsername = newlyGeneratedUsername;
          userRoles = ['member'];
        }

        emailDisplayElements.forEach(el => {
            el.textContent = displayUsername;
        });

        const moodDisplayElements = document.querySelectorAll('.user-preferred-mood-display');
        moodDisplayElements.forEach(el => { el.textContent = displayPreferredMood; });
        
        // Make roles globally accessible for client-side checks
        window.currentUserRoles = userRoles;
        console.log("User roles loaded:", window.currentUserRoles); // Keep this for overall debugging

        // --- NEW: Centralized admin link visibility update ---
        updateAdminLinkVisibility(userRoles.includes('admin'));
        // --- END NEW ---

        if (loader) loader.style.display = 'none';
        
        const content = document.getElementById('main-content');
        if (content) content.classList.remove('hidden');

      } catch (error) {
        console.error("Error fetching or creating user profile in initAuthCheck:", error);
        if (loader) loader.style.display = 'none';
        emailDisplayElements.forEach(el => el.textContent = "Error loading name");
        window.currentUserRoles = [];
        updateAdminLinkVisibility(false); // Hide admin links on error
      }

    } else {
      // User is logged out
      if (!isAuthPage) {
        window.location.href = unauthenticatedRedirectTo;
      } else {
        if (loader) loader.style.display = 'none';
      }
      localStorage.removeItem('spark_settings');
      console.log("No user logged in, ensuring local storage is clear.");
      window.currentUserRoles = [];
      updateAdminLinkVisibility(false); // Hide admin links if no user is logged in
    }
  });
}

// Export everything needed by other pages from HERE
export { onAuthStateChanged, signInWithEmailAndPassword };
