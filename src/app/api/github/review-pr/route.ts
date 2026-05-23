import { NextRequest, NextResponse } from 'next/server';
import { loadConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    const { prUrl, checks } = await request.json();

    if (!prUrl) {
      return NextResponse.json(
        { error: 'PR URL is required' },
        { status: 400 }
      );
    }

    // Parse GitHub PR URL
    // Expected format: https://github.com/owner/repo/pull/123
    const urlPattern = /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
    const match = prUrl.match(urlPattern);

    if (!match) {
      return NextResponse.json(
        { error: 'Invalid GitHub PR URL format. Expected: https://github.com/owner/repo/pull/123' },
        { status: 400 }
      );
    }

    const [, owner, repo, prNumber] = match;

    // Fetch PR details from GitHub
    const prData = await fetchPRData(owner, repo, prNumber);

    // Check if AI is configured
    const config = loadConfig();
    const hasAI = config.ai.apiKey && config.ai.apiKey.length > 0;

    let reviewResults;
    if (hasAI) {
      // Use AI for advanced analysis
      reviewResults = await analyzePRWithAI(prData, checks, config);
    } else {
      // Use basic static analysis without AI
      reviewResults = performBasicAnalysis(prData, checks);
    }

    return NextResponse.json({
      success: true,
      pr: {
        owner,
        repo,
        number: prNumber,
        title: prData.title,
        description: prData.description,
        author: prData.author,
        branch: prData.branch,
        baseBranch: prData.baseBranch,
        files: prData.files.map((f: any) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          changes: f.changes
        })),
        stats: {
          totalFiles: prData.files.length,
          totalAdditions: prData.files.reduce((sum: number, f: any) => sum + f.additions, 0),
          totalDeletions: prData.files.reduce((sum: number, f: any) => sum + f.deletions, 0),
        }
      },
      results: reviewResults,
    });
  } catch (error: any) {
    console.error('PR Review Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to review PR' },
      { status: 500 }
    );
  }
}

async function fetchPRData(owner: string, repo: string, prNumber: string) {
  // Fetch PR data from GitHub API
  const prUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;
  const filesUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`;

  const headers: any = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Work-Manager-PR-Review',
  };

  // Use GitHub token if available from config or environment
  const config = loadConfig();
  const githubToken = config.github?.token || process.env.GITHUB_TOKEN;

  if (githubToken) {
    headers['Authorization'] = `Bearer ${githubToken}`;
  }

  const [prResponse, filesResponse] = await Promise.all([
    fetch(prUrl, { headers }),
    fetch(filesUrl, { headers }),
  ]);

  if (!prResponse.ok) {
    const errorBody = await prResponse.text();
    console.error(`GitHub API error (${prResponse.status}):`, errorBody);

    let errorMessage = `Failed to fetch PR: ${prResponse.status} ${prResponse.statusText}`;

    if (prResponse.status === 404) {
      errorMessage = `PR not found (404). Please check:\n1. The PR URL is correct\n2. The PR exists and is not deleted\n3. You have access to the repository`;
    } else if (prResponse.status === 403) {
      try {
        const errorJson = JSON.parse(errorBody);
        errorMessage = `Access forbidden (403): ${errorJson.message || 'Permission denied'}\n\nPossible causes:\n1. Token doesn't have 'repo' scope\n2. Token doesn't have access to the repository or organization\n3. Repository is private and you don't have access`;
      } catch {
        errorMessage = `Access forbidden (403). Please check:\n1. Your GitHub token has 'repo' scope\n2. You have access to the repository\n3. Token is valid and not expired`;
      }
    } else if (prResponse.status === 401) {
      errorMessage = `Unauthorized (401). Invalid or expired GitHub token.`;
    }

    throw new Error(errorMessage);
  }

  const prInfo = await prResponse.json();
  const files = await filesResponse.json();

  return {
    title: prInfo.title,
    description: prInfo.body || '',
    author: prInfo.user.login,
    branch: prInfo.head.ref,
    baseBranch: prInfo.base.ref,
    files: files.map((file: any) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch,
    })),
  };
}

async function analyzePRWithAI(prData: any, checks: string[], config: any) {
  const checkDescriptions: Record<string, string> = {
    'code-flaws': 'logical errors, anti-patterns, and code smells',
    'error-handling': 'missing try-catch blocks, unhandled promises, and edge cases',
    'eslint-issues': 'code style violations and linting errors',
    'security': 'security vulnerabilities like SQL injection, XSS, or insecure dependencies',
    'flow-breaking': 'dead code, unreachable statements, or infinite loops',
    'crash-potential': 'null pointer exceptions, undefined references, or potential crashes',
  };

  const enabledChecks = checks.map(check => checkDescriptions[check] || check).join(', ');

  const prompt = `You are an expert code reviewer. Review the following GitHub Pull Request and provide detailed feedback.

**PR Title:** ${prData.title}
**Description:** ${prData.description}
**Author:** ${prData.author}
**Branch:** ${prData.branch} → ${prData.baseBranch}

**Review Focus Areas:**
${enabledChecks}

**Files Changed:**
${prData.files.map((file: any) => `
### ${file.filename} (${file.status})
+${file.additions} -${file.deletions}

\`\`\`diff
${file.patch || 'Binary file or no changes'}
\`\`\`
`).join('\n')}

**Instructions:**
1. First, provide a comprehensive explanation of what this PR does and its purpose
2. Analyze each file for the specified review areas
3. Provide specific line-by-line feedback where issues are found
4. Suggest concrete improvements
5. Rate severity: CRITICAL, HIGH, MEDIUM, LOW

**IMPORTANT JSON FORMATTING RULES:**
- Return ONLY valid JSON, no markdown code blocks
- Escape all quotes and newlines properly in strings
- Use double quotes for strings, not single quotes
- Replace newlines in text with \\n
- Do not include any text before or after the JSON object

Format your response as JSON with this exact structure:
{
  "summary": "Overall assessment",
  "whatThisPRDoes": "Detailed explanation - escape all quotes and newlines",
  "keyChanges": [
    "List of main changes",
    "Each item should explain a significant modification"
  ],
  "issues": [
    {
      "file": "filename",
      "line": 0,
      "severity": "CRITICAL",
      "category": "code-flaws",
      "issue": "Description - properly escaped",
      "suggestion": "How to fix - properly escaped"
    }
  ],
  "positives": ["Things done well"],
  "overallScore": 8
}`;

  // Use configured AI provider
  if (config.ai.provider === 'openai') {
    return await analyzeWithOpenAI(prompt, config.ai.apiKey);
  } else if (config.ai.provider === 'claude') {
    return await analyzeWithClaude(prompt, config.ai.apiKey);
  } else {
    throw new Error('Invalid AI provider configured');
  }
}

async function analyzeWithOpenAI(prompt: string, apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert code reviewer. Provide detailed, actionable feedback in JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function analyzeWithClaude(prompt: string, apiKey: string) {
  const config = loadConfig();

  // Use baseUrl from config if available, otherwise default to Anthropic
  const baseUrl = config.ai.baseUrl || 'https://api.anthropic.com';
  const apiEndpoint = `${baseUrl}/v1/messages`;
  const modelName = config.ai.model || 'claude-sonnet-4-5';

  console.log('Using Claude endpoint for PR review:', apiEndpoint);
  console.log('Using model for PR review:', modelName);

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelName,
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: `${prompt}\n\nProvide your response as valid JSON only, no additional text.`,
          },
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    return await parseClaudeResponse(response);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Claude API request timed out after 120 seconds');
    }
    throw error;
  }
}

async function parseClaudeResponse(response: Response) {
  const data = await response.json();
  let content = data.content[0].text;

  // Strip markdown code blocks if present (```json ... ``` or ``` ... ```)
  content = content.trim();
  if (content.startsWith('```')) {
    // Remove opening ```json or ```
    content = content.replace(/^```(?:json)?\s*\n/, '');
    // Remove closing ```
    content = content.replace(/\n```\s*$/, '');
  }

  // Clean up and attempt to parse JSON
  try {
    return JSON.parse(content.trim());
  } catch (parseError: any) {
    console.error('Failed to parse Claude response as JSON:', parseError.message);
    console.error('Response content (first 500 chars):', content.substring(0, 500));

    // Try to fix common JSON issues
    let fixedContent = content.trim();

    // Remove any trailing commas before closing braces/brackets
    fixedContent = fixedContent.replace(/,(\s*[}\]])/g, '$1');

    // Try parsing again
    try {
      return JSON.parse(fixedContent);
    } catch (secondError) {
      throw new Error(`Claude returned invalid JSON: ${parseError.message}. Content preview: ${content.substring(0, 200)}...`);
    }
  }
}

function performBasicAnalysis(prData: any, checks: string[]) {
  const issues: any[] = [];
  const positives: string[] = [];

  // Analyze each file
  prData.files.forEach((file: any) => {
    if (!file.patch) return;

    const lines = file.patch.split('\n');
    let currentLineNumber = 0;

    lines.forEach((line: string) => {
      // Track line numbers from patch format
      const lineMatch = line.match(/^@@.*\+(\d+)/);
      if (lineMatch) {
        currentLineNumber = parseInt(lineMatch[1]);
        return;
      }

      // Only check added lines (starting with +)
      if (!line.startsWith('+')) {
        if (!line.startsWith('-')) {
          currentLineNumber++;
        }
        return;
      }

      const code = line.substring(1).trim(); // Remove the + prefix
      if (!code) return; // Skip empty lines

      // Check for common issues based on enabled checks
      if (checks.includes('code-flaws')) {
        if (code.includes('console.log(')) {
          issues.push({
            file: file.filename,
            line: currentLineNumber,
            severity: 'LOW',
            category: 'code-flaws',
            issue: 'Console.log statement found',
            suggestion: 'Remove console.log before production. Use a proper logging library instead.'
          });
        }
        if (code.includes('console.error(') || code.includes('console.warn(')) {
          issues.push({
            file: file.filename,
            line: currentLineNumber,
            severity: 'LOW',
            category: 'code-flaws',
            issue: 'Console statement found',
            suggestion: 'Consider using a proper logging library instead of console methods.'
          });
        }
        if (code.includes('debugger')) {
          issues.push({
            file: file.filename,
            line: currentLineNumber,
            severity: 'MEDIUM',
            category: 'code-flaws',
            issue: 'Debugger statement found',
            suggestion: 'Remove debugger statement before committing to production.'
          });
        }
        if (/\/\/\s*TODO/i.test(code) || /\/\/\s*FIXME/i.test(code)) {
          issues.push({
            file: file.filename,
            line: currentLineNumber,
            severity: 'LOW',
            category: 'code-flaws',
            issue: 'TODO/FIXME comment found',
            suggestion: 'Consider addressing this TODO before merging, or create a tracking issue.'
          });
        }
      }

      if (checks.includes('security')) {
        if (code.includes('eval(')) {
          issues.push({
            file: file.filename,
            line: currentLineNumber,
            severity: 'CRITICAL',
            category: 'security',
            issue: 'Use of eval() detected - serious security vulnerability',
            suggestion: 'Never use eval(). It can execute arbitrary code and is a major security risk.'
          });
        }
        if (code.includes('innerHTML') && !code.includes('textContent')) {
          issues.push({
            file: file.filename,
            line: currentLineNumber,
            severity: 'HIGH',
            category: 'security',
            issue: 'Use of innerHTML detected (XSS vulnerability risk)',
            suggestion: 'Use textContent or properly sanitize input with DOMPurify before using innerHTML.'
          });
        }
        if (/password|secret|api[_-]?key|token/i.test(code) && /['"]\w+['"]/.test(code)) {
          issues.push({
            file: file.filename,
            line: currentLineNumber,
            severity: 'CRITICAL',
            category: 'security',
            issue: 'Possible hardcoded credential detected',
            suggestion: 'Never hardcode passwords, API keys, or secrets. Use environment variables.'
          });
        }
        if (code.includes('dangerouslySetInnerHTML')) {
          issues.push({
            file: file.filename,
            line: currentLineNumber,
            severity: 'HIGH',
            category: 'security',
            issue: 'Use of dangerouslySetInnerHTML (XSS risk)',
            suggestion: 'Ensure the content is properly sanitized before using dangerouslySetInnerHTML.'
          });
        }
      }

      if (checks.includes('error-handling')) {
        if ((code.includes('async ') || code.includes('await ')) && !code.includes('try') && !code.includes('catch')) {
          issues.push({
            file: file.filename,
            line: currentLineNumber,
            severity: 'MEDIUM',
            category: 'error-handling',
            issue: 'Async operation without visible error handling',
            suggestion: 'Add try-catch block or .catch() handler for async operations.'
          });
        }
        if (code.includes('JSON.parse(') && !code.includes('try')) {
          issues.push({
            file: file.filename,
            line: currentLineNumber,
            severity: 'MEDIUM',
            category: 'error-handling',
            issue: 'JSON.parse without error handling',
            suggestion: 'Wrap JSON.parse in try-catch to handle invalid JSON gracefully.'
          });
        }
        if (code.includes('throw new Error') && code.includes('catch')) {
          positives.push('Good error handling with try-catch blocks');
        }
      }

      if (checks.includes('crash-potential')) {
        if (/\.\w+\(/.test(code) && !code.includes('?.') && !code.includes('if (')) {
          if (code.includes('.map(') || code.includes('.filter(') || code.includes('.forEach(')) {
            issues.push({
              file: file.filename,
              line: currentLineNumber,
              severity: 'MEDIUM',
              category: 'crash-potential',
              issue: 'Array method called without null/undefined check',
              suggestion: 'Add null/undefined check or use optional chaining (?.) before calling array methods.'
            });
          }
        }
        if (code.includes('!') && /!\w+\./.test(code)) {
          issues.push({
            file: file.filename,
            line: currentLineNumber,
            severity: 'LOW',
            category: 'crash-potential',
            issue: 'Non-null assertion operator (!) used',
            suggestion: 'Consider proper null checking instead of using ! operator.'
          });
        }
      }

      if (checks.includes('eslint-issues')) {
        if (/var\s+\w+/.test(code)) {
          issues.push({
            file: file.filename,
            line: currentLineNumber,
            severity: 'LOW',
            category: 'eslint-issues',
            issue: 'Use of var keyword',
            suggestion: 'Use const or let instead of var for better scoping.'
          });
        }
        if (code.includes('==') && !code.includes('===')) {
          issues.push({
            file: file.filename,
            line: currentLineNumber,
            severity: 'LOW',
            category: 'eslint-issues',
            issue: 'Use of == instead of ===',
            suggestion: 'Use === for strict equality comparison.'
          });
        }
      }

      if (checks.includes('flow-breaking')) {
        if (code.includes('while(true)') || code.includes('while (true)')) {
          issues.push({
            file: file.filename,
            line: currentLineNumber,
            severity: 'HIGH',
            category: 'flow-breaking',
            issue: 'Infinite loop detected',
            suggestion: 'Ensure there is a proper exit condition for this loop.'
          });
        }
        if (code.includes('return;') && code.trim() !== 'return;') {
          const afterReturn = code.substring(code.indexOf('return;') + 7).trim();
          if (afterReturn.length > 0) {
            issues.push({
              file: file.filename,
              line: currentLineNumber,
              severity: 'MEDIUM',
              category: 'flow-breaking',
              issue: 'Unreachable code after return statement',
              suggestion: 'Remove code after return statement as it will never execute.'
            });
          }
        }
      }

      currentLineNumber++;
    });
  });

  // Add some positives if no critical issues found
  if (issues.filter(i => i.severity === 'CRITICAL').length === 0) {
    positives.push('No critical security vulnerabilities detected');
  }
  if (issues.filter(i => i.severity === 'HIGH').length === 0) {
    positives.push('No high-severity issues found');
  }
  if (issues.length === 0) {
    positives.push('Code appears clean with no obvious issues');
    positives.push('Good coding practices observed');
  }

  // Calculate overall score (1-10)
  const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
  const highCount = issues.filter(i => i.severity === 'HIGH').length;
  const mediumCount = issues.filter(i => i.severity === 'MEDIUM').length;
  const lowCount = issues.filter(i => i.severity === 'LOW').length;

  let score = 10;
  score -= criticalCount * 3;
  score -= highCount * 2;
  score -= mediumCount * 1;
  score -= lowCount * 0.5;
  score = Math.max(1, Math.min(10, Math.round(score)));

  // Generate "What this PR does" summary
  const filesSummary = prData.files.map((f: any) => f.filename).join(', ');
  const whatThisPRDoes = `This PR modifies ${prData.files.length} file(s): ${filesSummary}. ` +
    `It includes ${prData.files.reduce((sum: number, f: any) => sum + f.additions, 0)} additions and ` +
    `${prData.files.reduce((sum: number, f: any) => sum + f.deletions, 0)} deletions. ` +
    `Based on the changes, this appears to be a ${prData.files.length > 5 ? 'major' : 'focused'} update to the codebase.`;

  // Identify key changes from file modifications
  const keyChanges = prData.files.map((file: any) => {
    const changeType = file.status === 'added' ? 'Added new file' :
                       file.status === 'removed' ? 'Removed file' :
                       file.status === 'renamed' ? 'Renamed file' : 'Modified';
    return `${changeType}: ${file.filename} (+${file.additions}/-${file.deletions})`;
  });

  return {
    summary: issues.length === 0
      ? 'Basic static analysis completed. No obvious issues detected.'
      : `Basic static analysis found ${issues.length} issue(s): ${criticalCount} critical, ${highCount} high, ${mediumCount} medium, ${lowCount} low.`,
    whatThisPRDoes: whatThisPRDoes,
    keyChanges: keyChanges,
    issues: issues,
    positives: positives.length > 0 ? positives : ['Analysis completed'],
    overallScore: score,
    usedAI: false,
    note: 'This is a basic static analysis. Configure AI in settings for more advanced code review.'
  };
}
