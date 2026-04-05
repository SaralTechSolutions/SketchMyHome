/**
 * api-client.js - Mock API Client for Roomio
 * This simulates requests to serverless functions that connect to a database like Supabase.
 */

const ApiClient = {
    // Current mock storage for demonstration
    _store: {},

    init() {
        const savedProjects = localStorage.getItem('roomio_projects');
        if (savedProjects) {
            this._store = JSON.parse(savedProjects);
            console.log("[API] Mock database initialized with", Object.keys(this._store).length, "projects.");
        }
    },

    /**
     * Simulates fetching projects from serverless API /api/projects
     */
    async fetchProjects() {
        console.log("[API] GET /api/projects");
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return Object.values(this._store);
    },

    /**
     * Simulates saving a project to serverless API /api/project/:id
     */
    async saveProject(project) {
        if (!project.id) project.id = 'project_' + Date.now();
        console.log("[API] POST /api/project/" + project.id);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        this._store[project.id] = {
            ...project,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem('roomio_projects', JSON.stringify(this._store));
        return this._store[project.id];
    },

    /**
     * Simulates deleting a project from serverless API /api/project/:id
     */
    async deleteProject(id) {
        console.log("[API] DELETE /api/project/" + id);
        await new Promise(resolve => setTimeout(resolve, 300));
        delete this._store[id];
        localStorage.setItem('roomio_projects', JSON.stringify(this._store));
        return true;
    }
};

ApiClient.init();
window.RoomioApi = ApiClient;
