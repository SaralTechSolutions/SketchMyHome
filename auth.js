/**
 * auth.js - Mock Authentication Layer for Roomio
 * This simulates a serverless auth provider like Supabase or Clerk.
 */

const Auth = {
    user: null,
    onAuthStateChange: null,

    init() {
        console.log("[Auth] Initializing authentication...");
        const savedUser = localStorage.getItem('roomio_user');
        if (savedUser) {
            this.user = JSON.parse(savedUser);
            console.log("[Auth] Session restored:", this.user.email);
        }
    },

    async signIn() {
        // Simulated sign-in
        const email = prompt("Enter your email (mock):", "user@example.com");
        if (email) {
            this.user = { id: 'user_' + Math.random().toString(36).substr(2, 9), email };
            localStorage.setItem('roomio_user', JSON.stringify(this.user));
            if (this.onAuthStateChange) this.onAuthStateChange(this.user);
            alert("Signed in as " + email);
            return this.user;
        }
        return null;
    },

    async signOut() {
        this.user = null;
        localStorage.removeItem('roomio_user');
        if (this.onAuthStateChange) this.onAuthStateChange(null);
        alert("Signed out");
    },

    isAuthenticated() {
        return !!this.user;
    }
};

Auth.init();
window.RoomioAuth = Auth;
