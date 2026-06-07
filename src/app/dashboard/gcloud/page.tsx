'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Terminal,
  Cloud,
  Server,
  Play,
  RefreshCw,
  Search,
  FileText,
  Activity,
  Loader2,
  ChevronRight,
  ChevronDown,
  Copy,
  Circle,
  Layers,
  Database,
  Download,
} from 'lucide-react';

interface Cluster {
  name: string;
  location: string;
  status: string;
}

interface Namespace {
  name: string;
  status: string;
  age: string;
}

interface Pod {
  name: string;
  ready: string;
  status: string;
  restarts: number;
  age: string;
}

interface Service {
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  externalIP: string;
  ports: string;
  age: string;
  podCount: number;
  pods: Pod[];
}

interface CommandHistory {
  command: string;
  output: string;
  timestamp: Date;
  success: boolean;
}

const KUBECTL_COMMANDS = [
  'kubectl get pods',
  'kubectl get pods -n talk-dev',
  'kubectl get deployments',
  'kubectl get services',
  'kubectl get namespaces',
  'kubectl describe pod',
  'kubectl logs',
  'kubectl logs -f',
  'kubectl exec -it',
  'kubectl get events',
  'kubectl top pods',
  'kubectl get nodes',
  'gcloud projects list',
  'gcloud config list',
  'gcloud container clusters list',
];

export default function GCloudPage() {
  // State for hierarchy: Clusters -> Namespaces -> Services
  // Initialize with all clusters statically
  const [clusters, setClusters] = useState<Cluster[]>([
    { name: 'tlk-dev01-eng01-gke', location: 'us-central1-a', status: 'RUNNING' },
    { name: 'tlk-perf01-eng01-gke', location: 'us-east1-b', status: 'RUNNING' },
    { name: 'tlk-intgrn01-eng01-gke', location: 'us-west1-a', status: 'RUNNING' },
  ]);
  // Set default cluster to tlk-dev01-eng01-gke
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>({
    name: 'tlk-dev01-eng01-gke',
    location: 'us-central1-a',
    status: 'RUNNING'
  });
  const [namespaces, setNamespaces] = useState<Namespace[]>([]);
  const [selectedNamespace, setSelectedNamespace] = useState<Namespace | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<'terminal' | 'logs' | 'describe' | 'search'>('terminal');

  // Terminal state
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [autoCompleteVisible, setAutoCompleteVisible] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<string[]>([]);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  // Loading states
  const [loadingClusters, setLoadingClusters] = useState(false);
  const [loadingNamespaces, setLoadingNamespaces] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Data states
  const [podDetails, setPodDetails] = useState('');
  const [podLogs, setPodLogs] = useState('');
  const [requestId, setRequestId] = useState('');
  const [logSearchResults, setLogSearchResults] = useState<any[]>([]);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState('');

  const terminalRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  // No need to load clusters on mount - they are initialized statically
  // useEffect(() => {
  //   loadClusters();
  // }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);

  // Auto-complete logic
  useEffect(() => {
    if (command.trim()) {
      const filtered = KUBECTL_COMMANDS.filter(cmd =>
        cmd.toLowerCase().includes(command.toLowerCase())
      );
      setFilteredCommands(filtered);
      setAutoCompleteVisible(filtered.length > 0);
      setSelectedCommandIndex(0);
    } else {
      setAutoCompleteVisible(false);
    }
  }, [command]);

  const loadClusters = async () => {
    // Clusters are static, just refresh by resetting to default state
    setLoadingClusters(true);
    setTimeout(() => {
      setClusters([
        { name: 'tlk-dev01-eng01-gke', location: 'us-central1-a', status: 'RUNNING' },
        { name: 'tlk-perf01-eng01-gke', location: 'us-east1-b', status: 'RUNNING' },
        { name: 'tlk-intgrn01-eng01-gke', location: 'us-west1-a', status: 'RUNNING' },
      ]);
      setLoadingClusters(false);
    }, 500);
  };

  const loadNamespaces = async (cluster: Cluster) => {
    try {
      setLoadingNamespaces(true);
      setSelectedCluster(cluster);
      setSelectedNamespace(null); // Clear selected namespace when switching clusters
      setServices([]); // Clear services
      setNamespaces([]); // Clear namespaces immediately when switching clusters
      setSearchQuery(''); // Clear search when changing view

      const response = await fetch(`/api/kubectl/namespaces?cluster=${cluster.name}`);
      const data = await response.json();

      if (response.ok) {
        // Sort namespaces: talk-* namespaces first, then others alphabetically
        const sortedNamespaces = (data.namespaces || []).sort((a: Namespace, b: Namespace) => {
          const aIsTalk = a.name.startsWith('talk-');
          const bIsTalk = b.name.startsWith('talk-');

          // Both are talk-* namespaces, sort alphabetically
          if (aIsTalk && bIsTalk) {
            return a.name.localeCompare(b.name);
          }
          // a is talk-*, b is not - a comes first
          if (aIsTalk && !bIsTalk) return -1;
          // b is talk-*, a is not - b comes first
          if (!aIsTalk && bIsTalk) return 1;
          // Neither is talk-*, sort alphabetically
          return a.name.localeCompare(b.name);
        });
        setNamespaces(sortedNamespaces);
      }
    } catch (error) {
      console.error('Failed to load namespaces:', error);
    } finally {
      setLoadingNamespaces(false);
    }
  };

  const loadServices = async (namespace: Namespace) => {
    try {
      setLoadingServices(true);
      setSelectedNamespace(namespace);
      setSearchQuery(''); // Clear search when changing view

      const response = await fetch(`/api/kubectl/services?namespace=${namespace.name}`);
      const data = await response.json();

      if (response.ok) {
        // Sort services: talk-related first, then by pod count, then alphabetically
        const sortedServices = (data.services || []).sort((a: Service, b: Service) => {
          const aIsTalk = a.name.toLowerCase().includes('talk');
          const bIsTalk = b.name.toLowerCase().includes('talk');

          // First priority: talk-related services come first
          if (aIsTalk && !bIsTalk) return -1;
          if (!aIsTalk && bIsTalk) return 1;

          // Second priority: more pods first (within same group)
          if (a.podCount !== b.podCount) return b.podCount - a.podCount;

          // Third priority: alphabetically by name
          return a.name.localeCompare(b.name);
        });
        setServices(sortedServices);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  // Pick a random running pod from the service
  const getRandomPod = (service: Service): Pod | null => {
    if (!service.pods || service.pods.length === 0) return null;

    // Prefer running pods
    const runningPods = service.pods.filter(p => p.status === 'Running');
    const podsToChooseFrom = runningPods.length > 0 ? runningPods : service.pods;

    // Pick random pod
    const randomIndex = Math.floor(Math.random() * podsToChooseFrom.length);
    return podsToChooseFrom[randomIndex];
  };

  const describeService = async () => {
    if (!selectedService || !selectedNamespace) return;

    const pod = getRandomPod(selectedService);
    if (!pod) {
      setPodDetails('No pods available for this service');
      return;
    }

    setViewMode('describe');
    setLoading(true);

    try {
      const response = await fetch('/api/kubectl/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podName: pod.name, namespace: selectedNamespace.name }),
      });

      const data = await response.json();
      setPodDetails(data.output || 'No details available');
    } catch (error) {
      setPodDetails('Failed to load pod details');
    } finally {
      setLoading(false);
    }
  };

  const viewServiceLogs = async () => {
    if (!selectedService || !selectedNamespace) return;

    const pod = getRandomPod(selectedService);
    if (!pod) {
      setPodLogs('No pods available for this service');
      return;
    }

    setViewMode('logs');
    setLoading(true);

    try {
      const response = await fetch('/api/kubectl/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ podName: pod.name, namespace: selectedNamespace.name }),
      });

      const data = await response.json();
      setPodLogs(data.output || 'No logs available');
    } catch (error) {
      setPodLogs('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const searchLogsAcrossPods = async () => {
    if (!requestId.trim() || !selectedNamespace || !selectedService) return;

    setSearching(true);
    setViewMode('search');
    setLogSearchResults([]);

    try {
      // Search across all pods of the selected service
      const response = await fetch('/api/kubectl/search-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namespace: selectedNamespace.name,
          requestId: requestId,
          pods: selectedService.pods.map(p => p.name),
        }),
      });

      const data = await response.json();
      setLogSearchResults(data.results || []);
    } catch (error) {
      console.error('Failed to search logs:', error);
    } finally {
      setSearching(false);
    }
  };

  const executeCommand = async (cmd?: string) => {
    const commandToExecute = cmd || command;
    if (!commandToExecute.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/kubectl/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: commandToExecute }),
      });

      const data = await response.json();

      const historyEntry: CommandHistory = {
        command: commandToExecute,
        output: data.output || data.error || 'Command executed',
        timestamp: new Date(),
        success: response.ok,
      };

      setCommandHistory([...commandHistory, historyEntry]);
      setCommand('');
      setAutoCompleteVisible(false);
    } catch (error: any) {
      const historyEntry: CommandHistory = {
        command: commandToExecute,
        output: `Error: ${error.message}`,
        timestamp: new Date(),
        success: false,
      };
      setCommandHistory([...commandHistory, historyEntry]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (autoCompleteVisible && filteredCommands.length > 0) {
        setCommand(filteredCommands[selectedCommandIndex]);
        setAutoCompleteVisible(false);
      } else {
        executeCommand();
      }
    } else if (e.key === 'ArrowDown' && autoCompleteVisible) {
      e.preventDefault();
      setSelectedCommandIndex((prev) =>
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp' && autoCompleteVisible) {
      e.preventDefault();
      setSelectedCommandIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    } else if (e.key === 'Escape') {
      setAutoCompleteVisible(false);
    }
  };

  const getPodStatusColor = (status: string) => {
    if (status === 'Running') return 'text-green-400';
    if (status === 'Pending') return 'text-yellow-400';
    if (status === 'Failed' || status === 'Error') return 'text-red-400';
    return 'text-gray-400';
  };

  const getStatusColor = (status: string) => {
    if (status === 'Running' || status === 'Active' || status === 'RUNNING') return 'text-green-400';
    if (status === 'Pending') return 'text-yellow-400';
    if (status === 'Failed' || status === 'Error') return 'text-red-400';
    return 'text-gray-400';
  };

  // Parse log line to extract structured data
  const parseLogLine = (line: string) => {
    try {
      // Try to parse as JSON first
      const jsonMatch = line.match(/\{.*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          raw: line,
          isJson: true,
          timestamp: parsed.timestamp || parsed.time || parsed['@timestamp'] || '',
          level: parsed.level || parsed.severity || '',
          message: parsed.message || parsed.msg || '',
          data: parsed,
        };
      }
    } catch (e) {
      // Not JSON, try to parse common log formats
    }

    // Try to extract timestamp, level, and message from common formats
    const patterns = [
      // ISO timestamp format: 2024-01-15T10:30:45.123Z [INFO] message
      /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\s+\[?(\w+)\]?\s+(.+)$/,
      // Simple format: INFO: message
      /^(\w+):\s+(.+)$/,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        if (match.length === 4) {
          return {
            raw: line,
            isJson: false,
            timestamp: match[1],
            level: match[2],
            message: match[3],
          };
        } else if (match.length === 3) {
          return {
            raw: line,
            isJson: false,
            timestamp: '',
            level: match[1],
            message: match[2],
          };
        }
      }
    }

    // Return as-is if no pattern matches
    return {
      raw: line,
      isJson: false,
      timestamp: '',
      level: '',
      message: line,
    };
  };

  const getLevelColor = (level: string) => {
    const lowerLevel = level.toLowerCase();
    if (lowerLevel.includes('error') || lowerLevel.includes('fatal')) return 'text-red-400';
    if (lowerLevel.includes('warn')) return 'text-yellow-400';
    if (lowerLevel.includes('info')) return 'text-blue-400';
    if (lowerLevel.includes('debug')) return 'text-gray-400';
    return 'text-gray-300';
  };

  // Download search results as JSON
  const downloadLogsAsJson = () => {
    const data = {
      searchQuery: requestId,
      namespace: selectedNamespace?.name,
      service: selectedService?.name,
      timestamp: new Date().toISOString(),
      totalPods: selectedService?.pods.length || 0,
      podsWithMatches: logSearchResults.length,
      totalMatches: logSearchResults.reduce((sum, r) => sum + r.matchCount, 0),
      results: logSearchResults.map(result => {
        // Parse log lines into structured JSON objects
        const logLines = (result.logs || '').split('\n').filter((line: string) => line.trim());
        const parsedLogs = logLines.map((line: string) => {
          try {
            // Try to parse as JSON
            const jsonMatch = line.match(/\{.*\}/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
            // If not JSON, return as plain text object
            return { rawText: line };
          } catch (e) {
            // If parsing fails, return as plain text
            return { rawText: line };
          }
        });

        return {
          podName: result.podName,
          podStatus: result.podStatus,
          containerName: result.containerName,
          matchCount: result.matchCount,
          logs: parsedLogs,
        };
      }),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `search-logs-${requestId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download search results as text
  const downloadLogsAsText = () => {
    let textContent = `Search Logs Export\n`;
    textContent += `===================\n\n`;
    textContent += `Search Query: ${requestId}\n`;
    textContent += `Namespace: ${selectedNamespace?.name}\n`;
    textContent += `Service: ${selectedService?.name}\n`;
    textContent += `Export Date: ${new Date().toLocaleString()}\n`;
    textContent += `Total Pods Searched: ${selectedService?.pods.length || 0}\n`;
    textContent += `Pods with Matches: ${logSearchResults.length}\n`;
    textContent += `Total Matches: ${logSearchResults.reduce((sum, r) => sum + r.matchCount, 0)}\n`;
    textContent += `\n${'='.repeat(80)}\n\n`;

    logSearchResults.forEach((result, index) => {
      textContent += `\nPod ${index + 1}: ${result.podName}\n`;
      textContent += `${'─'.repeat(80)}\n`;
      textContent += `Status: ${result.podStatus}\n`;
      textContent += `Container: ${result.containerName}\n`;
      textContent += `Match Count: ${result.matchCount}\n`;
      textContent += `\nLogs:\n`;
      textContent += `${'-'.repeat(80)}\n`;
      textContent += result.logs || 'No logs';
      textContent += `\n${'─'.repeat(80)}\n\n`;
    });

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `search-logs-${requestId}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter functions based on search query
  const filteredClusters = clusters.filter(cluster =>
    cluster.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNamespaces = namespaces.filter(namespace =>
    namespace.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col space-y-4">
      {/* Header - Compact Clusters */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            {/* Clusters Section */}
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <h3 className="text-sm font-semibold text-gray-400 whitespace-nowrap">GCloud Clusters</h3>

              {loadingClusters ? (
                <div className="flex items-center">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400 ml-2" />
                </div>
              ) : clusters.length === 0 ? (
                <span className="text-gray-500 text-sm ml-2">No clusters found</span>
              ) : (
                <div className="flex items-center gap-2 ml-4">
                  {clusters.map((cluster) => (
                    <button
                      key={cluster.name}
                      onClick={() => loadNamespaces(cluster)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        selectedCluster?.name === cluster.name
                          ? 'bg-cyan-600 text-white shadow-lg'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{cluster.name}</span>
                        {cluster.status === 'RUNNING' && (
                          <Circle className="w-2 h-2 fill-green-400 text-green-400" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Access Namespaces - Same line */}
            {(() => {
              // Define default namespaces for each cluster
              const clusterNamespaces: { [key: string]: string[] } = {
                'tlk-dev01-eng01-gke': ['talk-dev', 'talk-test', 'notification', 'notification-test'],
                'tlk-perf01-eng01-gke': ['talk-perf', 'notification'],
                'tlk-intgrn01-eng01-gke': ['intgrn', 'notification-intgrn'],
              };

              // Get default namespaces for selected cluster, or use dev cluster defaults
              const currentClusterName = selectedCluster?.name || 'tlk-dev01-eng01-gke';
              const defaultNamespaceNames = clusterNamespaces[currentClusterName] || ['talk-dev', 'talk-test'];

              // Always show the default namespaces for the current cluster as static buttons
              // These will be enriched with full namespace data if available
              const displayNamespaces: Array<{ name: string; status?: string; age?: string }> = defaultNamespaceNames.map(name => {
                // If namespaces are loaded, find the matching namespace with full details
                const matchedNamespace = namespaces.find(ns => ns.name === name);
                return matchedNamespace || { name }; // Use matched namespace or just the name
              });

              if (displayNamespaces.length === 0) return null;

              return (
                <div className="ml-4 pl-4 border-l border-gray-600 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <div className="flex items-center gap-2">
                    {displayNamespaces.map((namespace) => (
                      <button
                        key={namespace.name}
                        onClick={async () => {
                          // If namespaces are loaded, use the full namespace object
                          if (namespaces.length > 0 && namespace.status) {
                            loadServices(namespace as Namespace);
                          } else {
                            // For static buttons, first load namespaces for selected cluster
                            if (selectedCluster) {
                              setLoadingNamespaces(true);
                              setLoadingServices(true);
                              try {
                                const response = await fetch(`/api/kubectl/namespaces?cluster=${selectedCluster.name}`);
                                const data = await response.json();

                                if (response.ok && data.namespaces) {
                                  const sortedNamespaces = (data.namespaces || []).sort((a: Namespace, b: Namespace) => {
                                    const aIsTalk = a.name.startsWith('talk-');
                                    const bIsTalk = b.name.startsWith('talk-');
                                    if (aIsTalk && bIsTalk) return a.name.localeCompare(b.name);
                                    if (aIsTalk && !bIsTalk) return -1;
                                    if (!aIsTalk && bIsTalk) return 1;
                                    return a.name.localeCompare(b.name);
                                  });
                                  setNamespaces(sortedNamespaces);

                                  // Find the matching namespace and load its services
                                  const matchedNamespace = sortedNamespaces.find((ns: Namespace) => ns.name === namespace.name);
                                  if (matchedNamespace) {
                                    setSelectedNamespace(matchedNamespace);

                                    // Load services for the namespace
                                    const servicesResponse = await fetch(`/api/kubectl/services?namespace=${matchedNamespace.name}`);
                                    const servicesData = await servicesResponse.json();

                                    if (servicesResponse.ok) {
                                      const sortedServices = (servicesData.services || []).sort((a: any, b: any) => {
                                        const aIsTalk = a.name.toLowerCase().includes('talk');
                                        const bIsTalk = b.name.toLowerCase().includes('talk');
                                        if (aIsTalk && !bIsTalk) return -1;
                                        if (!aIsTalk && bIsTalk) return 1;
                                        if (a.podCount !== b.podCount) return b.podCount - a.podCount;
                                        return a.name.localeCompare(b.name);
                                      });
                                      setServices(sortedServices);
                                    }
                                  }
                                }
                              } catch (error) {
                                console.error('Failed to load namespaces/services:', error);
                              } finally {
                                setLoadingNamespaces(false);
                                setLoadingServices(false);
                              }
                            }
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                          selectedNamespace?.name === namespace.name
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        {namespace.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          <Button
            onClick={loadClusters}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg ml-4 flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loadingClusters ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Request ID Search - Only show when namespace is selected */}
        {selectedNamespace && (
          <div className="mt-4 flex items-center gap-3 border-t border-gray-700 pt-4">
            <Input
              placeholder="Enter Request ID to search across all pods..."
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchLogsAcrossPods()}
              className="bg-gray-800 border border-gray-600 text-white flex-1"
            />
            <Button
              onClick={searchLogsAcrossPods}
              disabled={searching || !requestId.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
            >
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search Logs
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Sidebar - Namespaces and Pods */}
        <div className="w-80 bg-gray-900 border border-gray-700 rounded-2xl p-4 overflow-y-auto">
          {!selectedCluster || namespaces.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-4">
                <div className="relative mb-6">
                  <div className="absolute inset-0 blur-2xl bg-cyan-500/20 animate-pulse" />
                  <div className="relative">
                    <Cloud className="w-20 h-20 mx-auto text-cyan-400/60" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {loadingNamespaces ? 'Loading Namespaces...' : 'Get Started'}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {loadingNamespaces
                    ? 'Fetching namespaces from the selected cluster'
                    : 'Click on a cluster tab above to view its namespaces, or use the quick access buttons to jump directly to a namespace'
                  }
                </p>
                {loadingNamespaces && (
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-cyan-400" />
                )}
                {!loadingNamespaces && !selectedCluster && (
                  <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-500">
                      💡 Tip: Quick access buttons load pods directly
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : !selectedNamespace ? (
            // Namespaces View
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  Namespaces ({filteredNamespaces.length})
                </h2>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <Input
                  placeholder="Search namespaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-800 border border-gray-600 text-white placeholder:text-gray-500"
                />
              </div>

              {loadingNamespaces ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : filteredNamespaces.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-500 text-sm">
                    {searchQuery ? 'No matching namespaces found' : 'No namespaces found'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNamespaces.map((namespace: Namespace) => (
                    <div
                      key={namespace.name}
                      onClick={() => loadServices(namespace)}
                      className="p-4 rounded-xl border transition-all cursor-pointer group bg-gray-800 border-gray-700 hover:border-blue-600 hover:bg-blue-900/20"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-blue-400" />
                          <span className="text-white font-medium">{namespace.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div className={getStatusColor(namespace.status)}>
                          Status: {namespace.status}
                        </div>
                        <div>Age: {namespace.age}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Services View
            <>
              <div className="mb-4">
                <Button
                  onClick={() => {
                    setSelectedNamespace(null);
                    setServices([]);
                    setSelectedService(null);
                    setSearchQuery('');
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm w-full mb-4"
                >
                  <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                  Back to Namespaces
                </Button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-green-400" />
                  Services ({filteredServices.length})
                </h2>
                <Button
                  onClick={() => setViewMode('terminal')}
                  className={`px-3 py-1 rounded-lg text-xs ${
                    viewMode === 'terminal'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Terminal className="w-3 h-3" />
                </Button>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-800 border border-gray-600 text-white placeholder:text-gray-500"
                />
              </div>

              {loadingServices ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="text-center py-12">
                  <Server className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-500 text-sm">
                    {searchQuery ? 'No matching services found' : 'No services found'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredServices.map((service) => (
                    <div
                      key={service.name}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedService?.name === service.name
                          ? 'bg-green-900/30 border-green-600'
                          : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedService(service)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-green-400" />
                          <span className="text-white text-sm font-medium truncate">
                            {service.name}
                          </span>
                        </div>
                        <span className="text-xs text-blue-400">
                          {service.podCount} pods
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>Type: {service.type}</div>
                        <div>Ports: {service.ports}</div>
                        <div>Age: {service.age}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Panel - Terminal/Logs/Details */}
        <div className="flex-1 bg-gray-900 border border-gray-700 rounded-2xl flex flex-col min-w-0">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-2 p-4 border-b border-gray-700">
            <Button
              onClick={() => setViewMode('terminal')}
              className={`px-4 py-2 rounded-lg text-sm ${
                viewMode === 'terminal'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Terminal className="w-4 h-4 mr-2" />
              Terminal
            </Button>
            {selectedService && (
              <>
                <Button
                  onClick={() => describeService()}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    viewMode === 'describe'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Describe
                </Button>
                <Button
                  onClick={() => viewServiceLogs()}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    viewMode === 'logs'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Logs
                </Button>
              </>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {viewMode === 'terminal' && (
              <>
                {/* Terminal Output */}
                <div
                  ref={terminalRef}
                  className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-gray-950"
                >
                  {commandHistory.length === 0 ? (
                    <div className="text-gray-500">
                      <p className="mb-2">$ Welcome to Kubernetes Terminal</p>
                      <p className="mb-2">$ Select: Cluster → Namespace → Service to manage resources</p>
                      <p className="mb-2">$ Type commands or use auto-complete (Tab/Enter)</p>
                      <p>$ Available: kubectl, gcloud commands</p>
                    </div>
                  ) : (
                    commandHistory.map((entry, index) => (
                      <div key={index} className="mb-4">
                        <div className="flex items-center gap-2 text-blue-400 mb-1">
                          <ChevronRight className="w-4 h-4" />
                          <span>{entry.command}</span>
                          <span className="text-xs text-gray-500">
                            {entry.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <pre
                          className={`pl-6 whitespace-pre-wrap ${
                            entry.success ? 'text-gray-300' : 'text-red-400'
                          }`}
                        >
                          {entry.output}
                        </pre>
                      </div>
                    ))
                  )}
                </div>

                {/* Command Input with Auto-Complete */}
                <div className="border-t border-gray-700 p-4 relative">
                  {autoCompleteVisible && (
                    <div className="absolute bottom-full left-4 right-4 mb-2 bg-gray-800 border border-gray-600 rounded-lg shadow-2xl max-h-60 overflow-y-auto z-10">
                      {filteredCommands.map((cmd, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setCommand(cmd);
                            setAutoCompleteVisible(false);
                            commandInputRef.current?.focus();
                          }}
                          className={`px-4 py-2 cursor-pointer ${
                            index === selectedCommandIndex
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {cmd}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <ChevronRight className="w-5 h-5 text-blue-400" />
                    <Input
                      ref={commandInputRef}
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type kubectl or gcloud command... (auto-complete enabled)"
                      className="flex-1 bg-gray-950 border-0 text-white font-mono focus:ring-0"
                      disabled={loading}
                    />
                    <Button
                      onClick={() => executeCommand()}
                      disabled={loading || !command.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Press Enter to execute • Arrow keys to navigate • Esc to close
                  </p>
                </div>
              </>
            )}

            {viewMode === 'describe' && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">
                    Service: {selectedService?.name}
                  </h3>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(podDetails);
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="bg-gray-950 p-4 rounded-lg text-gray-300 text-xs font-mono whitespace-pre-wrap">
                  {podDetails || 'Loading...'}
                </pre>
              </div>
            )}

            {viewMode === 'logs' && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">
                    Service Logs: {selectedService?.name}
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => viewServiceLogs()}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Refresh
                    </Button>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(podLogs);
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
                <pre className="bg-gray-950 p-4 rounded-lg text-gray-300 text-xs font-mono whitespace-pre-wrap">
                  {podLogs || 'Loading...'}
                </pre>
              </div>
            )}

            {viewMode === 'search' && (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Search Results Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        Search Results for: <span className="text-cyan-400">{requestId}</span>
                      </h3>
                      <p className="text-sm text-gray-400">
                        Searched across {selectedService?.pods.length || 0} pods in service: {selectedService?.name}
                      </p>
                    </div>
                    {logSearchResults.length > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-green-900/30 text-green-400 rounded text-sm">
                          {logSearchResults.reduce((sum, r) => sum + r.matchCount, 0)} total matches
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={downloadLogsAsJson}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                            title="Download as JSON"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            JSON
                          </Button>
                          <Button
                            onClick={downloadLogsAsText}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                            title="Download as Text"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            TXT
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Filter Input */}
                  {logSearchResults.length > 0 && (
                    <Input
                      placeholder="Filter results by keyword..."
                      value={resultFilter}
                      onChange={(e) => setResultFilter(e.target.value)}
                      className="bg-gray-800 border border-gray-600 text-white placeholder:text-gray-500"
                    />
                  )}
                </div>

                {/* Results Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  {searching ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                  ) : logSearchResults.length === 0 ? (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                      <p className="text-gray-500">No matching logs found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {logSearchResults.map((result, index) => {
                        // Filter logs if filter is active
                        const logs = result.logs || '';
                        const logLines = logs.split('\n');
                        const filteredLines = resultFilter
                          ? logLines.filter((line: string) =>
                              line.toLowerCase().includes(resultFilter.toLowerCase())
                            )
                          : logLines;

                        if (resultFilter && filteredLines.length === 0) return null;

                        return (
                          <div
                            key={index}
                            className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden"
                          >
                            {/* Pod Header */}
                            <div className="bg-gray-900/50 p-3 border-b border-gray-700">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Server className="w-4 h-4 text-blue-400" />
                                  <span className="text-white font-medium text-sm">
                                    {result.podName}
                                  </span>
                                  {result.podStatus && (
                                    <span className={`text-xs ${getStatusColor(result.podStatus)}`}>
                                      [{result.podStatus}]
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {resultFilter && filteredLines.length !== logLines.length && (
                                    <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-xs rounded">
                                      {filteredLines.length} / {logLines.length} lines
                                    </span>
                                  )}
                                  <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">
                                    {resultFilter ? filteredLines.length : result.matchCount} matches
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Log Lines */}
                            <div className="p-4 bg-gray-950 max-h-96 overflow-y-auto">
                              <div className="space-y-2">
                                {filteredLines.map((line: string, lineIndex: number) => {
                                  const parsed = parseLogLine(line);
                                  return (
                                    <div key={lineIndex} className="group">
                                      {parsed.isJson ? (
                                        // JSON Log Display
                                        <div className="bg-gray-900/50 rounded p-2 border border-gray-800 hover:border-gray-600">
                                          <div className="flex items-start gap-2 mb-1">
                                            {parsed.timestamp && (
                                              <span className="text-gray-500 text-xs font-mono">
                                                {new Date(parsed.timestamp).toLocaleTimeString()}
                                              </span>
                                            )}
                                            {parsed.level && (
                                              <span className={`text-xs font-semibold ${getLevelColor(parsed.level)}`}>
                                                [{parsed.level.toUpperCase()}]
                                              </span>
                                            )}
                                          </div>
                                          {parsed.message && (
                                            <div className="text-sm text-gray-200 mb-2 pl-2 border-l-2 border-cyan-600">
                                              {parsed.message}
                                            </div>
                                          )}
                                          <details className="cursor-pointer">
                                            <summary className="text-xs text-gray-400 hover:text-gray-300">
                                              View JSON data
                                            </summary>
                                            <pre className="mt-2 text-xs text-gray-300 font-mono overflow-x-auto">
                                              {JSON.stringify(parsed.data, null, 2)}
                                            </pre>
                                          </details>
                                        </div>
                                      ) : (
                                        // Plain Text Log Display
                                        <div className="font-mono text-xs hover:bg-gray-900/30 rounded px-2 py-1">
                                          <div className="flex items-start gap-2">
                                            {parsed.timestamp && (
                                              <span className="text-gray-500 flex-shrink-0">
                                                {parsed.timestamp}
                                              </span>
                                            )}
                                            {parsed.level && (
                                              <span className={`flex-shrink-0 ${getLevelColor(parsed.level)}`}>
                                                [{parsed.level}]
                                              </span>
                                            )}
                                            <span className="text-gray-300 break-all">
                                              {parsed.message}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
