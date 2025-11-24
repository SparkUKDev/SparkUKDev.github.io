import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { app } from './firebase.js';
getAnalytics(app);

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Mobile Menu
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    // ensure ARIA defaults
    mobileMenuBtn.setAttribute('aria-controls', 'mobile-menu');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');

    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      // update aria-expanded to reflect visible state
      const expanded = !mobileMenu.classList.contains('hidden');
      mobileMenuBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });
  }

  // User Dropdown
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userMenuDropdown = document.getElementById('user-menu-dropdown');
  const chevron = document.getElementById('user-menu-chevron');

  if (userMenuBtn && userMenuDropdown) {
    // ensure ARIA defaults
    userMenuBtn.setAttribute('aria-controls', 'user-menu-dropdown');
    userMenuBtn.setAttribute('aria-expanded', 'false');

    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userMenuDropdown.classList.toggle('hidden');
      if (chevron) {
        chevron.style.transform = userMenuDropdown.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
      }
      // set ARIA attributes
      userMenuBtn.setAttribute('aria-controls', 'user-menu-dropdown');
      const expanded = !userMenuDropdown.classList.contains('hidden');
      userMenuBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      if (!userMenuBtn.contains(e.target) && !userMenuDropdown.contains(e.target)) {
        userMenuDropdown.classList.add('hidden');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
        userMenuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Sign Out
  const signOutBtn = document.getElementById('sign-out-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
        window.location.href = 'auth.html';
      } catch (error) {
        console.error("Sign out error", error);
      }
    });
  }

  // Safety Modal
  const safetyBtns = document.querySelectorAll('.safety-btn');
  const safetyModal = document.getElementById('safety-modal');
  const closeSafetyBtns = document.querySelectorAll('#close-safety-modal, #close-safety-action');

  if (safetyModal) {
    safetyBtns.forEach(btn => {
      btn.addEventListener('click', () => safetyModal.classList.remove('hidden'));
    });
    closeSafetyBtns.forEach(btn => {
      btn.addEventListener('click', () => safetyModal.classList.add('hidden'));
    });
  }
});
