import { auth, db, onAuthStateChanged, signOut, initAuthCheck } from './firebase.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Ensure auth check runs so pages behave like other pages
initAuthCheck();

// Helper to format Firestore timestamp or JS Date
function formatDate(value) {
  if (!value) return '—';
  // Firestore Timestamp has toDate()
  try {
    if (typeof value.toDate === 'function') {
      return value.toDate().toLocaleDateString();
    }
  } catch (e) {}
  if (value instanceof Date) return value.toLocaleDateString();
  return new Date(value).toLocaleDateString();
}

onAuthStateChanged(auth, async (user) => {
  const main = document.getElementById('profile-main');
  const loader = document.getElementById('page-loader');

  if (!user) {
    // not signed in — redirect to auth page
    if (loader) loader.style.display = 'none';
    window.location.href = 'auth.html';
    return;
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    let data = {};
    if (snap.exists()) data = snap.data();

    // Render values
    const username = data.username || user.displayName || user.email || 'User';
    const avatar = data.avatarUrl || user.photoURL || '';
    const roles = Array.isArray(data.roles) ? data.roles : (data.roles ? [data.roles] : ['member']);
    const registered = data.createdAt || data.created_at || data.created || user.metadata?.creationTime || null;

    // Set main content
    document.getElementById('profile-username').textContent = username;
    document.getElementById('detail-username').textContent = username;
    document.getElementById('detail-roles').textContent = roles.join(', ');
    document.getElementById('detail-registered').textContent = formatDate(registered);

    const avatarImg = document.getElementById('profile-avatar');
    if (avatar) {
      avatarImg.src = avatar;
      avatarImg.alt = username + "'s profile picture";
      document.getElementById('detail-avatar').textContent = avatar;
    } else {
      // generate a visible default-avatar PNG at runtime (no extra files)
      const canvas = document.createElement('canvas');
      const size = 128;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      // circular background
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = '#e6e6e6';
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();

      // silhouette (head)
      ctx.fillStyle = '#9b9b9b';
      ctx.beginPath();
      ctx.arc(size / 2, size * 0.34, size * 0.14, 0, Math.PI * 2);
      ctx.fill();

      // silhouette (shoulders)
      ctx.beginPath();
      const left = size * 0.22;
      const right = size * 0.78;
      const top = size * 0.58;
      const bottom = size * 0.86;
      ctx.moveTo(left, bottom);
      ctx.quadraticCurveTo(size * 0.5, top, right, bottom);
      ctx.lineTo(right, bottom);
      ctx.quadraticCurveTo(size * 0.5, top + size * 0.06, left, bottom);
      ctx.closePath();
      ctx.fill();

      avatarImg.src = canvas.toDataURL('image/png');
      avatarImg.alt = 'Default avatar';
      document.getElementById('detail-avatar').textContent = '(none)';
    }

    if (loader) loader.style.display = 'none';
    if (main) main.classList.remove('hidden');

  } catch (err) {
    console.error('Failed to load profile:', err);
    if (loader) loader.style.display = 'none';
    if (main) main.classList.remove('hidden');
  }
});

// Wire sign out buttons
const signOutBtn = document.getElementById('sign-out-btn');
if (signOutBtn) signOutBtn.addEventListener('click', async () => { await signOut(auth); window.location.href = 'auth.html'; });

// Small hook for Edit Profile (placeholder)
const editBtn = document.getElementById('edit-profile');
if (editBtn) editBtn.addEventListener('click', () => {
  alert('Edit profile is not implemented in this version.');
});
