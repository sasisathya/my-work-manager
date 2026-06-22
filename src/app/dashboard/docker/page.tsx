'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Container,
  Play,
  Square,
  RefreshCw,
  Download,
  Trash2,
  Terminal,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Package,
  Database
} from 'lucide-react';
import SetupRequired from '@/components/SetupRequired';

interface DockerImage {
  repository: string;
  tag: string;
  imageId: string;
  created: string;
  size: string;
}

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: string;
  created: string;
}

interface DockerService {
  name: string;
  description: string;
  composePath: string;
  ports: { name: string; port: number; url: string }[];
  containerNames: string[];
  requirements?: string[];
}

// Services will be loaded from config
const getServicesFromConfig = async (): Promise<DockerService[]> => {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();

    const services: DockerService[] = [];

    if (config.docker?.kafkaComposePath) {
      services.push({
        name: 'Kafka Suite',
        description: 'Web-based UI to browse Kafka topics, messages, and consumer groups',
        composePath: config.docker.kafkaComposePath,
        ports: [
          { name: 'Kafka UI', port: 8090, url: 'http://localhost:8090' }
        ],
        containerNames: ['kafka-ui'],
        requirements: ['KAFKA_BOOTSTRAP_SERVERS', 'KAFKA_API_KEY', 'KAFKA_API_SECRET']
      });
    }

    if (config.docker?.observabilityComposePath) {
      services.push({
        name: 'Monitoring Suite',
        description: 'Grafana dashboards and Prometheus metrics for application monitoring',
        composePath: config.docker.observabilityComposePath,
        ports: [
          { name: 'Grafana', port: 3080, url: 'http://localhost:3080' },
          { name: 'Prometheus', port: 9090, url: 'http://localhost:9090' }
        ],
        containerNames: ['talk-pf-grafana', 'talk-pf-prometheus'],
        requirements: ['Grafana login: admin/admin']
      });
    }

    return services;
  } catch (error) {
    console.error('Error loading services from config:', error);
    return [];
  }
};

export default function DockerKafkaPage() {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<DockerImage[]>([]);
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [serviceStatus, setServiceStatus] = useState<Record<string, boolean>>({});
  const [services, setServices] = useState<DockerService[]>([]);
  const [configExists, setConfigExists] = useState<boolean | null>(null);

  useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = async () => {
    try {
      const response = await fetch('/api/config/check');
      const data = await response.json();
      setConfigExists(data.configured);

      if (data.configured) {
        loadServices();
        fetchDockerImages();
        fetchDockerContainers();
      }
    } catch (err) {
      setConfigExists(false);
    }
  };

  useEffect(() => {
    checkServiceStatus();
  }, [containers]);

  const loadServices = async () => {
    const configServices = await getServicesFromConfig();
    setServices(configServices);
  };

  const checkServiceStatus = () => {
    services.forEach(service => {
      service.containerNames.forEach(async (containerName) => {
        const isRunning = containers.some(
          c => c.name === containerName && c.state === 'running'
        );
        setServiceStatus(prev => ({
          ...prev,
          [service.name]: isRunning
        }));
      });
    });
  };

  const startService = async (service: DockerService) => {
    setLoading(true);
    addLog(`Starting ${service.name}...`);

    try {
      const response = await fetch('/api/docker/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'up',
          composePath: service.composePath
        })
      });

      const data = await response.json();

      if (response.ok) {
        addLog(`✅ ${service.name} started successfully`);
        service.ports.forEach(portInfo => {
          addLog(`🌐 ${portInfo.name}: ${portInfo.url}`);
        });
        await fetchDockerContainers();
        setServiceStatus(prev => ({ ...prev, [service.name]: true }));
      } else {
        addLog(`❌ Failed to start ${service.name}: ${data.error}`);
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const stopService = async (service: DockerService) => {
    setLoading(true);
    addLog(`Stopping ${service.name}...`);

    try {
      const response = await fetch('/api/docker/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'down',
          composePath: service.composePath
        })
      });

      const data = await response.json();

      if (response.ok) {
        addLog(`✅ ${service.name} stopped successfully`);
        await fetchDockerContainers();
        setServiceStatus(prev => ({ ...prev, [service.name]: false }));
      } else {
        addLog(`❌ Failed to stop ${service.name}: ${data.error}`);
      }
    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchDockerImages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/docker/images');
      const data = await response.json();

      if (data.images) {
        // Filter for Kafka-related images
        const kafkaImages = data.images.filter((img: DockerImage) =>
          img.repository.toLowerCase().includes('kafka') ||
          img.repository.toLowerCase().includes('zookeeper') ||
          img.repository.toLowerCase().includes('confluent')
        );
        setImages(kafkaImages);

        if (kafkaImages.length === 0) {
          addLog('No Kafka-related Docker images found');
        } else {
          addLog(`Found ${kafkaImages.length} Kafka-related image(s)`);
        }
      }
    } catch (error: any) {
      console.error('Error fetching images:', error);
      addLog(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchDockerContainers = async () => {
    try {
      const response = await fetch('/api/docker/containers');
      const data = await response.json();

      if (data.containers) {
        // Show all containers
        setContainers(data.containers);

        if (data.containers.length > 0) {
          addLog(`Found ${data.containers.length} container(s)`);
        }
      }
    } catch (error: any) {
      console.error('Error fetching containers:', error);
    }
  };

  const pullKafkaImage = async () => {
    setLoading(true);
    addLog('Pulling latest Kafka image from Docker Hub...');

    try {
      const response = await fetch('/api/docker/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: 'confluentinc/cp-kafka:latest' })
      });

      const data = await response.json();

      if (response.ok) {
        addLog('Successfully pulled Kafka image');
        await fetchDockerImages();
      } else {
        addLog(`Error: ${data.error || 'Failed to pull image'}`);
      }
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const pullZookeeperImage = async () => {
    setLoading(true);
    addLog('Pulling latest Zookeeper image from Docker Hub...');

    try {
      const response = await fetch('/api/docker/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: 'confluentinc/cp-zookeeper:latest' })
      });

      const data = await response.json();

      if (response.ok) {
        addLog('Successfully pulled Zookeeper image');
        await fetchDockerImages();
      } else {
        addLog(`Error: ${data.error || 'Failed to pull image'}`);
      }
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startContainer = async (containerId: string) => {
    addLog(`Starting container ${containerId.substring(0, 12)}...`);

    try {
      const response = await fetch('/api/docker/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ containerId })
      });

      const data = await response.json();

      if (response.ok) {
        addLog('Container started successfully');
        await fetchDockerContainers();
      } else {
        addLog(`Error: ${data.error || 'Failed to start container'}`);
      }
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
    }
  };

  const stopContainer = async (containerId: string) => {
    addLog(`Stopping container ${containerId.substring(0, 12)}...`);

    try {
      const response = await fetch('/api/docker/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ containerId })
      });

      const data = await response.json();

      if (response.ok) {
        addLog('Container stopped successfully');
        await fetchDockerContainers();
      } else {
        addLog(`Error: ${data.error || 'Failed to stop container'}`);
      }
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
    }
  };

  const removeImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to remove this image?')) return;

    addLog(`Removing image ${imageId.substring(0, 12)}...`);

    try {
      const response = await fetch('/api/docker/remove-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId })
      });

      const data = await response.json();

      if (response.ok) {
        addLog('Image removed successfully');
        await fetchDockerImages();
      } else {
        addLog(`Error: ${data.error || 'Failed to remove image'}`);
      }
    } catch (error: any) {
      addLog(`Error: ${error.message}`);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  const refreshAll = () => {
    fetchDockerImages();
    fetchDockerContainers();
    addLog('Refreshed all Docker data');
  };

  // Show setup required if config doesn't exist
  if (configExists === false) {
    return (
      <SetupRequired
        title="Docker Configuration Required"
        message="To manage Docker services, you need to configure your Docker compose file paths in settings."
        feature="Docker & Kafka management"
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Quick Actions */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Container className="w-8 h-8 text-gray-400" />
            Docker
          </h1>
          <div className="flex gap-2">
            <Button
              onClick={pullKafkaImage}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg border border-blue-500 transition-colors text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1" />
              )}
              Pull Kafka
            </Button>

            <Button
              onClick={pullZookeeperImage}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg border border-green-500 transition-colors text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-1" />
              )}
              Pull Zookeeper
            </Button>

            <Button
              onClick={refreshAll}
              disabled={loading}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg border border-gray-600 transition-colors text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Predefined Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, idx) => {
            const isRunning = serviceStatus[service.name] || false;

            return (
              <div
                key={idx}
                className={`bg-gradient-to-br from-gray-800 to-gray-900 border rounded-2xl p-6 transition-all hover:shadow-xl ${
                  isRunning ? 'border-green-500 shadow-lg shadow-green-500/20' : 'border-gray-700'
                }`}
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {isRunning ? (
                      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        Running
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-gray-700/50 border border-gray-600 text-gray-400 px-3 py-1 rounded-full text-xs font-semibold">
                        <XCircle className="w-3 h-3" />
                        Stopped
                      </div>
                    )}
                  </div>
                  <div className="bg-gray-700 border border-gray-600 rounded-lg p-2">
                    <Container className="w-5 h-5 text-gray-300" />
                  </div>
                </div>

                {/* Service Info */}
                <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{service.description}</p>

                {/* Ports & URLs */}
                <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 mb-4 space-y-2">
                  {service.ports.map((portInfo, pidx) => (
                    <div key={pidx}>
                      <div className="flex items-center gap-2 text-xs text-gray-300 font-semibold mb-1">
                        <Database className="w-3 h-3 text-blue-400" />
                        <span>{portInfo.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 ml-5">
                        <Terminal className="w-3 h-3" />
                        <span className="font-mono">Port: {portInfo.port}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 ml-5">
                        <span className="font-mono truncate">{portInfo.url}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Requirements */}
                {service.requirements && service.requirements.length > 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                    <p className="text-xs text-yellow-400 font-semibold mb-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Requirements:
                    </p>
                    <ul className="text-xs text-yellow-300/80 space-y-1 ml-4">
                      {service.requirements.map((req, ridx) => (
                        <li key={ridx} className="font-mono">• {req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                {isRunning ? (
                  <div className="space-y-2">
                    {/* Open Buttons for Each Port */}
                    <div className="grid grid-cols-2 gap-2">
                      {service.ports.map((portInfo, pidx) => (
                        <Button
                          key={pidx}
                          onClick={() => window.open(portInfo.url, '_blank')}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg border border-blue-500 transition-colors text-xs"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          {portInfo.name}
                        </Button>
                      ))}
                    </div>
                    {/* Stop Button */}
                    <Button
                      onClick={() => stopService(service)}
                      disabled={loading}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl border border-red-500 transition-colors"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Square className="w-4 h-4 mr-2" />
                      )}
                      Stop Suite
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => startService(service)}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl border border-green-500 transition-colors"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Start Suite
                  </Button>
                )}

                {/* Container Names */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Containers:</p>
                  <div className="flex flex-wrap gap-1">
                    {service.containerNames.map((containerName, cidx) => (
                      <span
                        key={cidx}
                        className="bg-gray-800 border border-gray-700 text-gray-400 px-2 py-1 rounded text-xs font-mono"
                      >
                        {containerName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Running Containers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Running Containers
              </h2>
              <span className="text-xs text-green-400 font-semibold bg-green-500/20 px-2 py-1 rounded-full">
                {containers.filter(c => c.state === 'running').length}
              </span>
            </div>
            <Button
              onClick={fetchDockerContainers}
              disabled={loading}
              className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {containers.filter(c => c.state === 'running').length === 0 ? (
            <div className="text-center py-4 text-gray-500 bg-gray-800/50 rounded-lg">
              <p className="text-sm">No running containers</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {containers
                .filter(c => c.state === 'running')
                .map((container, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-800 border border-green-600 rounded-lg p-2.5 hover:shadow-lg hover:shadow-green-500/20 transition-all"
                  >
                    <div className="flex items-start gap-1.5 mb-1.5">
                      <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-xs truncate">{container.name}</p>
                        <p className="text-xs text-gray-600 truncate">{container.image.split('/').pop()}</p>
                      </div>
                    </div>

                    {container.ports && (
                      <button
                        onClick={() => {
                          // Docker ports format: "0.0.0.0:8090->8090/tcp" or "8090/tcp"
                          let port = null;

                          // Try to match "0.0.0.0:PORT->" format (mapped port)
                          const mappedMatch = container.ports.match(/0\.0\.0\.0:(\d+)->/);
                          if (mappedMatch) {
                            port = mappedMatch[1];
                          } else {
                            // Try to match just the first port number
                            const firstPortMatch = container.ports.match(/(\d+)/);
                            if (firstPortMatch) {
                              port = firstPortMatch[1];
                            }
                          }

                          if (port) {
                            window.open(`http://localhost:${port}`, '_blank');
                          }
                        }}
                        className="w-full text-xs text-green-400 bg-green-500/10 border border-green-500/30 rounded px-1.5 py-0.5 mb-1.5 hover:bg-green-500/20 hover:border-green-400 transition-colors text-left"
                      >
                        → {container.ports
                          .replace(/0\.0\.0\.0:/g, '')
                          .replace(/\/tcp|\/udp/g, '')
                        }
                      </button>
                    )}

                    <Button
                      onClick={() => stopContainer(container.id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-1.5 py-0.5 rounded text-xs h-6"
                    >
                      <Square className="w-2 h-2 mr-0.5" />
                      Stop
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Stopped Containers */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-gray-500" />
              Stopped Containers
            </h2>
            <span className="text-xs text-gray-400 font-semibold bg-gray-700 px-2 py-1 rounded-full">
              {containers.filter(c => c.state !== 'running').length}
            </span>
          </div>

          {containers.filter(c => c.state !== 'running').length === 0 ? (
            <div className="text-center py-4 text-gray-500 bg-gray-800/50 rounded-lg">
              <p className="text-sm">No stopped containers</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {containers
                .filter(c => c.state !== 'running')
                .map((container, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 hover:shadow-lg hover:shadow-gray-500/10 transition-all"
                  >
                    <div className="flex items-start gap-1.5 mb-1.5">
                      <XCircle className="w-3 h-3 text-gray-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-xs truncate">{container.name}</p>
                        <p className="text-xs text-gray-600 truncate">{container.image.split('/').pop()}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => startContainer(container.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-1.5 py-0.5 rounded text-xs h-6"
                    >
                      <Play className="w-2 h-2 mr-0.5" />
                      Start
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-6 h-6 text-gray-400" />
            Activity Log
          </h2>
          <Button
            onClick={() => setLogs([])}
            className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg"
          >
            Clear
          </Button>
        </div>

        <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 max-h-64 overflow-y-auto font-mono text-xs">
          {logs.length === 0 ? (
            <p className="text-gray-500">No activity yet...</p>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className="text-gray-300 mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
