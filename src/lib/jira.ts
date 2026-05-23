import axios, { AxiosInstance } from 'axios';
import { getConfig } from './config';
import { JiraIssue, JiraTransition, JiraComment } from '@/types/jira';

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
}

export const jiraService = new JiraService();
