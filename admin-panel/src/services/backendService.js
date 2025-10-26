class BackendService {
  constructor() {
    this.backends = {
      aws: {
        name: 'AWS Production',
        url: 'https://backend.ziverapp.xyz',
        priority: 1, // Primary backend
        type: 'production'
      },
      render: {
        name: 'Render Development',
        url: 'https://ziver-api.onrender.com', // Replace with actual Render URL
        priority: 2, // Fallback backend
        type: 'development'
      }
    };
    
    this.currentBackend = null;
    this.healthCheckInterval = null;
    this.isHealthChecking = false;
  }

  // Health check for a single backend
  async checkBackendHealth(backend) {
    try {
      const response = await fetch(`${backend.url}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });
      
      return {
        ...backend,
        status: response.ok ? 'healthy' : 'unhealthy',
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      return {
        ...backend,
        status: 'offline',
        lastChecked: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Check all backends and return their status
  async checkAllBackends() {
    const healthChecks = Object.values(this.backends).map(backend => 
      this.checkBackendHealth(backend)
    );
    
    const results = await Promise.all(healthChecks);
    return results;
  }

  // Auto-select the best available backend
  async autoSelectBackend() {
    const results = await this.checkAllBackends();
    const healthyBackends = results.filter(b => b.status === 'healthy');
    
    if (healthyBackends.length === 0) {
      throw new Error('No healthy backends available');
    }
    
    // Select the backend with highest priority (lowest number)
    const bestBackend = healthyBackends.sort((a, b) => a.priority - b.priority)[0];
    this.currentBackend = bestBackend;
    
    return bestBackend;
  }

  // Manual backend selection
  selectBackend(backendKey) {
    if (this.backends[backendKey]) {
      this.currentBackend = this.backends[backendKey];
      localStorage.setItem('selectedBackend', backendKey);
      return this.currentBackend;
    }
    throw new Error(`Backend ${backendKey} not found`);
  }

  // Get current backend URL
  getBaseURL() {
    if (!this.currentBackend) {
      throw new Error('No backend selected');
    }
    return this.currentBackend.url;
  }

  // Start periodic health checks
  startHealthChecks(interval = 30000) { // 30 seconds
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.healthCheckInterval = setInterval(async () => {
      if (this.isHealthChecking) return;
      
      this.isHealthChecking = true;
      try {
        const results = await this.checkAllBackends();
        
        // If current backend is unhealthy, switch to best available
        if (this.currentBackend && 
            results.find(b => b.url === this.currentBackend.url)?.status !== 'healthy') {
          await this.autoSelectBackend();
          console.log('Auto-switched to backup backend:', this.currentBackend.name);
        }
        
        // Emit event for UI updates
        window.dispatchEvent(new CustomEvent('backendHealthUpdate', {
          detail: { backends: results }
        }));
      } catch (error) {
        console.error('Health check failed:', error);
      } finally {
        this.isHealthChecking = false;
      }
    }, interval);
  }

  // Stop health checks
  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Initialize backend service
  async initialize() {
    // Try to use previously selected backend
    const savedBackend = localStorage.getItem('selectedBackend');
    if (savedBackend && this.backends[savedBackend]) {
      try {
        const health = await this.checkBackendHealth(this.backends[savedBackend]);
        if (health.status === 'healthy') {
          this.currentBackend = this.backends[savedBackend];
          return this.currentBackend;
        }
      } catch (error) {
        console.warn('Saved backend unhealthy, auto-selecting...');
      }
    }
    
    // Auto-select best backend
    return await this.autoSelectBackend();
  }
}

// Create singleton instance
const backendService = new BackendService();
export default backendService;