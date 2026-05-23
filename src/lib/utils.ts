import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusColor(status: string): string {
  const lowerStatus = status.toLowerCase();

  if (lowerStatus.includes('done') || lowerStatus.includes('closed')) {
    return 'bg-green-100 text-green-800 border-green-300';
  }

  if (lowerStatus.includes('in progress') || lowerStatus.includes('in-progress')) {
    return 'bg-blue-100 text-blue-800 border-blue-300';
  }

  if (lowerStatus.includes('todo') || lowerStatus.includes('to do') || lowerStatus.includes('open')) {
    return 'bg-gray-100 text-gray-800 border-gray-300';
  }

  return 'bg-purple-100 text-purple-800 border-purple-300';
}

export function getPriorityColor(priority: string): string {
  const lowerPriority = priority.toLowerCase();

  if (lowerPriority.includes('highest') || lowerPriority.includes('critical')) {
    return 'text-red-600';
  }

  if (lowerPriority.includes('high')) {
    return 'text-orange-600';
  }

  if (lowerPriority.includes('medium')) {
    return 'text-yellow-600';
  }

  return 'text-gray-600';
}
