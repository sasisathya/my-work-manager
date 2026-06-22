/**
 * Data Processor Worker
 * Handles heavy computation without blocking the UI thread
 *
 * This worker receives messages with:
 * - id: unique identifier for tracking response
 * - operation: type of operation to perform
 * - data: input data
 *
 * It sends back:
 * - id: matching request id
 * - result: computation result
 * - error: error message if failed
 */

console.log('[Worker] Data processor worker initialized');

/**
 * Message handler - receives work from main thread
 */
self.onmessage = (event) => {
  const { id, operation, data } = event.data;

  try {
    let result;

    switch (operation) {
      /**
       * Filter operation
       * Filter array by property value
       */
      case 'filter': {
        const { items, filterKey, filterValue } = data;
        result = items.filter((item) => {
          const value = getNestedValue(item, filterKey);
          return value === filterValue || value.toString().includes(filterValue);
        });
        break;
      }

      /**
       * Sort operation
       * Sort array by property
       */
      case 'sort': {
        const { items, sortKey, ascending = true } = data;
        result = [...items].sort((a, b) => {
          const aVal = getNestedValue(a, sortKey);
          const bVal = getNestedValue(b, sortKey);

          if (aVal < bVal) return ascending ? -1 : 1;
          if (aVal > bVal) return ascending ? 1 : -1;
          return 0;
        });
        break;
      }

      /**
       * Aggregate operation
       * Calculate statistics from data
       */
      case 'aggregate': {
        const { items, groupBy } = data;
        result = {
          total: items.length,
          byStatus: {
            pending: items.filter((i) => i.status === 'pending').length,
            completed: items.filter((i) => i.status === 'completed').length,
            inProgress: items.filter((i) => i.status === 'in_progress').length,
          },
          byPriority: {
            low: items.filter((i) => i.priority === 'low').length,
            medium: items.filter((i) => i.priority === 'medium').length,
            high: items.filter((i) => i.priority === 'high').length,
          },
          averageItems: items.length > 0 ? items.length / items.length : 0,
        };
        break;
      }

      /**
       * Search operation
       * Full-text search across items
       */
      case 'search': {
        const { items, query, searchFields } = data;
        const queryLower = query.toLowerCase();

        result = items.filter((item) => {
          const searchText = searchFields
            .map((field) => getNestedValue(item, field))
            .join(' ')
            .toLowerCase();

          // Simple substring search
          return searchText.includes(queryLower);
        });
        break;
      }

      /**
       * Deduplicate operation
       * Remove duplicate items by ID
       */
      case 'deduplicate': {
        const { items, idKey = 'id' } = data;
        const seen = new Set();
        result = items.filter((item) => {
          const id = getNestedValue(item, idKey);
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });
        break;
      }

      /**
       * Pagination operation
       * Split array into pages
       */
      case 'paginate': {
        const { items, pageSize, pageNumber } = data;
        const startIdx = pageNumber * pageSize;
        const endIdx = startIdx + pageSize;
        result = {
          items: items.slice(startIdx, endIdx),
          pageNumber,
          pageSize,
          totalPages: Math.ceil(items.length / pageSize),
          totalItems: items.length,
        };
        break;
      }

      /**
       * Group operation
       * Group items by property
       */
      case 'group': {
        const { items, groupKey } = data;
        result = items.reduce((groups, item) => {
          const key = getNestedValue(item, groupKey);
          if (!groups[key]) {
            groups[key] = [];
          }
          groups[key].push(item);
          return groups;
        }, {});
        break;
      }

      /**
       * Transform operation
       * Map items through transformation function
       */
      case 'transform': {
        const { items, mapping } = data;
        result = items.map((item) => {
          const transformed = {};
          Object.entries(mapping).forEach(([newKey, oldKey]) => {
            transformed[newKey] = getNestedValue(item, oldKey);
          });
          return transformed;
        });
        break;
      }

      /**
       * Merge operation
       * Merge multiple arrays
       */
      case 'merge': {
        const { arrays } = data;
        result = arrays.flat();
        break;
      }

      /**
       * Unique operation
       * Get unique values from array
       */
      case 'unique': {
        const { items, key } = data;
        const values = items.map((item) => getNestedValue(item, key));
        result = Array.from(new Set(values));
        break;
      }

      /**
       * Calculate operation
       * Perform calculations on numeric data
       */
      case 'calculate': {
        const { items, key, calculation } = data;
        const values = items
          .map((item) => {
            const val = getNestedValue(item, key);
            return typeof val === 'number' ? val : 0;
          })
          .filter((v) => v !== null && v !== undefined);

        if (calculation === 'sum') {
          result = values.reduce((a, b) => a + b, 0);
        } else if (calculation === 'average') {
          result =
            values.length > 0
              ? values.reduce((a, b) => a + b, 0) / values.length
              : 0;
        } else if (calculation === 'max') {
          result = Math.max(...values);
        } else if (calculation === 'min') {
          result = Math.min(...values);
        }
        break;
      }

      default: {
        throw new Error(`Unknown operation: ${operation}`);
      }
    }

    /**
     * Send result back to main thread
     */
    self.postMessage({
      id,
      result,
    });
  } catch (error) {
    /**
     * Send error back to main thread
     */
    self.postMessage({
      id,
      error: error.message,
    });
  }
};

/**
 * Helper function to get nested property value
 * Supports dot notation: 'user.profile.name'
 */
function getNestedValue(obj, key) {
  return key.split('.').reduce((current, prop) => {
    return current?.[prop];
  }, obj);
}

/**
 * Unhandled error handler
 */
self.onerror = (error) => {
  console.error('[Worker] Unhandled error:', error);
};
