import axios, { AxiosInstance } from 'axios';
import { getConfig } from './config';
import { JiraIssue, JiraTransition, JiraComment } from '@/types/jira';

// Mapping of parent issue types to their allowed subtask types
const PARENT_TYPE_TO_SUBTASK_TYPE: { [key: string]: string } = {
  'Story': 'Sub-task',
  'Defect': 'Sub-task',
  // Add more mappings as discovered by the user
  // Example: 'Task': 'Sub-task', 'Bug': 'Sub-task', 'Epic': 'Epic Task'
};

export class JiraService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    const config = getConfig();
    this.baseUrl = config.jira.baseUrl;

    // Use Bearer token for Jira Server/Data Center (on-premise)
    // instead of Basic auth which is for Jira Cloud
    this.client = axios.create({
      baseURL: `${this.baseUrl}/rest/api/2`,
      headers: {
        'Authorization': `Bearer ${config.jira.apiToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  async getMyOpenIssues(): Promise<JiraIssue[]> {
    try {
      console.log('Fetching Jira issues with JQL: assignee = currentUser() AND resolution = Unresolved');

      const response = await this.client.get('/search', {
        params: {
          jql: 'assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC',
          maxResults: 50,
        },
      });

      console.log('Jira API Response:', JSON.stringify({
        total: response.data.total,
        maxResults: response.data.maxResults,
        issuesCount: response.data.issues?.length || 0,
        firstIssue: response.data.issues?.[0] ? {
          key: response.data.issues[0].key,
          summary: response.data.issues[0].fields?.summary,
        } : null
      }));

      return response.data.issues || [];
    } catch (error: any) {
      console.error('Error fetching Jira issues:');
      console.error('Status:', error.response?.status);
      console.error('Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Message:', error.message);
      throw new Error(error.response?.data?.errorMessages?.[0] || 'Failed to fetch Jira issues');
    }
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    try {
      const response = await this.client.get(`/issue/${issueKey}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching Jira issue:', error.response?.data || error.message);
      throw new Error(`Failed to fetch issue ${issueKey}`);
    }
  }

  async getTransitions(issueKey: string): Promise<JiraTransition[]> {
    try {
      const response = await this.client.get(`/issue/${issueKey}/transitions`);
      return response.data.transitions;
    } catch (error: any) {
      console.error('Error fetching transitions:', error.response?.data || error.message);
      throw new Error('Failed to fetch transitions');
    }
  }

  async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
    try {
      await this.client.post(`/issue/${issueKey}/transitions`, {
        transition: {
          id: transitionId,
        },
      });
    } catch (error: any) {
      console.error('Error transitioning issue:', error.response?.data || error.message);
      throw new Error('Failed to transition issue');
    }
  }

  async addComment(issueKey: string, comment: string): Promise<void> {
    try {
      await this.client.post(`/issue/${issueKey}/comment`, {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: comment,
                },
              ],
            },
          ],
        },
      });
    } catch (error: any) {
      console.error('Error adding comment:', error.response?.data || error.message);
      throw new Error('Failed to add comment');
    }
  }

  async uploadAttachment(issueKey: string, file: Buffer, filename: string): Promise<void> {
    try {
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', file, filename);

      await this.client.post(`/issue/${issueKey}/attachments`, formData, {
        headers: {
          'X-Atlassian-Token': 'no-check',
          ...formData.getHeaders(),
        },
      });
    } catch (error: any) {
      console.error('Error uploading attachment:', error.response?.data || error.message);
      throw new Error('Failed to upload attachment');
    }
  }

  async findInProgressTransition(issueKey: string): Promise<string | null> {
    const transitions = await this.getTransitions(issueKey);

    const inProgressTransition = transitions.find(t =>
      t.to.name.toLowerCase().includes('in progress') ||
      t.to.name.toLowerCase().includes('in-progress') ||
      t.name.toLowerCase().includes('start')
    );

    return inProgressTransition?.id || null;
  }

  async createSubtask(parentIssueKey: string, summary: string, description: string = ''): Promise<any> {
    try {
      // First, fetch the parent issue to get the project key and issue type
      const parentIssue = await this.getIssue(parentIssueKey);
      const projectKey = parentIssue.fields.project.key;
      const parentIssueType = parentIssue.fields.issuetype.name;

      // Check if this parent issue type supports subtask creation
      if (!PARENT_TYPE_TO_SUBTASK_TYPE[parentIssueType]) {
        const supportedTypes = Object.keys(PARENT_TYPE_TO_SUBTASK_TYPE).join(', ');
        throw new Error(
          `Subtasks can only be created for: ${supportedTypes}. "${parentIssueType}" does not support subtasks.`
        );
      }

      const expectedSubtaskType = PARENT_TYPE_TO_SUBTASK_TYPE[parentIssueType];

      // Try to determine the correct subtask issue type ID by fetching available issue types
      let subtaskId = null;
      try {
        const createmeta = await this.client.get('/issue/createmeta', {
          params: {
            projectKeys: projectKey,
            expand: 'projects.issuetypes.fields',
          },
        });

        if (createmeta.data.projects && createmeta.data.projects[0]) {
          const issueTypes = createmeta.data.projects[0].issuetypes || [];
          const subtaskType = issueTypes.find(
            (it: any) =>
              it.name.toLowerCase() === expectedSubtaskType.toLowerCase() ||
              (it.subtask === true &&
               (expectedSubtaskType.toLowerCase() === 'subtask' ||
                expectedSubtaskType.toLowerCase() === 'sub-task'))
          );
          if (subtaskType) {
            subtaskId = subtaskType.id;
          }
        }
      } catch (err) {
        console.warn('Could not fetch issue types via createmeta, will try with standard names');
      }

      const payload: any = {
        fields: {
          project: {
            key: projectKey,
          },
          summary: summary,
          issuetype: subtaskId
            ? { id: subtaskId }
            : { name: expectedSubtaskType },
          parent: {
            key: parentIssueKey,
          },
        },
      };

      if (description) {
        payload.fields.description = {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: description,
                },
              ],
            },
          ],
        };
      }

      const response = await this.client.post('/issue', payload);
      return response.data;
    } catch (error: any) {
      console.error('Error creating subtask:');
      console.error('Status:', error.response?.status);
      console.error('Full Error Data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error Message:', error.message);

      const errorMsg =
        error.message ||
        error.response?.data?.errorMessages?.[0] ||
        Object.values(error.response?.data?.errors || {}).join(', ') ||
        'Failed to create subtask';
      throw new Error(errorMsg);
    }
  }
}

export const jiraService = new JiraService();
