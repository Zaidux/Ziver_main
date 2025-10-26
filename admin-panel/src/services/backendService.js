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
        url: 'https://ziver-api.onrender.com',
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
      console.log(`🔍 Health checking ${backend.name}: ${backend.url}/api/system/ping`);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000) // Increased timeout to 10s
      );

      // Create the fetch promise
      const fetchPromise = fetch(`${backend.url}/api/system/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors' // Explicitly set CORS mode
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log(`✅ ${backend.name} health check:`, response.status, response.ok);

      return {
        ...backend,
        status: response.ok ? 'healthy' : 'unhealthy',
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ ${backend.name} health check failed:`, error.message);
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
    console.log('📊 All backend health results:', results);
    return results;
  }

  // Auto-select the best available backend
  async autoSelectBackend() {
    console.log('🔄 Auto-selecting best backend...');
    const results = await this.checkAllBackends();
    const healthyBackends = results.filter(b => b.status === 'healthy');

    console.log('✅ Healthy backends:', healthyBackends.map(b => b.name));

    if (healthyBackends.length === 0) {
      throw new Error('No healthy backends available');
    }

    // Select the backend with highest priority (lowest number)
    const bestBackend = healthyBackends.sort((a, b) => a.priority - b.priority)[0];
    this.currentBackend = bestBackend;

    console.log('🎯 Selected backend:', bestBackend.name);
    return bestBackend;
  }

  // Manual backend selection
  selectBackend(backendKey) {
    if (this.backends[backendKey]) {
      this.currentBackend = this.backends[backendKey];
      localStorage.setItem('selectedBackend', backendKey);
      console.log('🔧 Manually selected backend:', this.currentBackend.name);
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
          console.log('🔄 Current backend unhealthy, switching...');
          await this.autoSelectBackend();
          console.log('✅ Auto-switched to backup backend:', this.currentBackend.name);
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
    console.log('🚀 Initializing backend service...');
    
    // Try to use previously selected backend
    const savedBackend = localStorage.getItem('selectedBackend');
    console.log('💾 Saved backend preference:', savedBackend);
    
    if (savedBackend && this.backends[savedBackend]) {
      try {
        console.log(`🔍 Testing saved backend: ${savedBackend}`);
        const health = await this.checkBackendHealth(this.backends[savedBackend]);
        if (health.status === 'healthy') {
          this.currentBackend = this.backends[savedBackend];
          console.log('✅ Using saved backend:', this.currentBackend.name);
          return this.currentBackend;
        } else {
          console.log('❌ Saved backend unhealthy, will auto-select');
        }
      } catch (error) {
        console.warn('⚠️ Saved backend check failed, auto-selecting...');
      }
    }

    // Auto-select best backend
    console.log('🔄 Starting auto-selection process...');
    return await this.autoSelectBackend();
  }
}

// Create singleton instance
const backendService = new BackendService();
export default backendService;