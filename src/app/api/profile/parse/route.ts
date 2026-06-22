import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

interface ParsedProfile {
  personalInfo: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
  skills: Array<{
    name: string;
    level: number;
    yearsOfExperience?: number;
    category?: string;
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    location?: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
    field?: string;
    grade?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    year: string;
    credentialId?: string;
  }>;
  languages?: Array<{
    language: string;
    proficiency: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    year: string;
  }>;
  metadata?: {
    totalYearsExperience: number;
    parsedAt: string;
    resumeVersion: number;
    completionScore: number;
    missingFields: string[];
  };
}

async function extractTextFromPdf(filePath: string): Promise<string> {
  try {
    // Resolve path to ensure it's absolute
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

    console.log('Attempting to read PDF from:', absolutePath);
    const fileBuffer = await readFile(absolutePath);
    console.log('Successfully read PDF file, size:', fileBuffer.length);

    // Dynamically import pdf-parse for Node.js compatibility
    const pdfParse = await import('pdf2json');
    const parser = new pdfParse.default();

    return new Promise((resolve, reject) => {
      parser.on('pdfParser_dataError', (errData: any) => {
        reject(new Error('PDF parsing error: ' + errData));
      });

      parser.on('pdfParser_dataReady', () => {
        const text = parser.getRawTextContent();
        // Limit output for performance
        const lines = text.split('\n').slice(0, 500);
        resolve(lines.join('\n'));
      });

      parser.parseBuffer(fileBuffer);
    });
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

async function parseResumeWithAI(resumeText: string): Promise<ParsedProfile> {
  const client = new Anthropic();

  const prompt = `You are a professional resume parser. Extract the following information from the resume text below and return it as a valid JSON object. Be thorough and accurate.

Resume Text:
${resumeText}

Return a JSON object with this EXACT structure. For missing fields, include them with null values:
{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+1234567890",
    "location": "City, Country",
    "summary": "Professional summary or objective"
  },
  "skills": [
    {
      "name": "Skill Name",
      "level": 4,
      "yearsOfExperience": 3,
      "category": "Technical"
    }
  ],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "2020-2023",
      "startDate": "2020",
      "endDate": "2023",
      "description": "Key responsibilities and achievements",
      "location": "City, Country"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "school": "School Name",
      "year": "2020",
      "field": "Field of Study",
      "grade": "3.8"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuer Name",
      "year": "2023",
      "credentialId": "ID if available"
    }
  ],
  "languages": [
    {
      "language": "English",
      "proficiency": "Native"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Project description",
      "technologies": ["Tech1", "Tech2"],
      "year": "2023"
    }
  ],
  "metadata": {
    "totalYearsExperience": 5,
    "parsedAt": "2024-06-22T10:30:00Z",
    "resumeVersion": 1,
    "completionScore": 85,
    "missingFields": ["location", "projects"]
  }
}

Guidelines:
1. For skills level, use 1-5 scale (1=Beginner, 5=Expert)
2. For duration, use "YYYY-YYYY" format or "YYYY-Present"
3. Extract ALL data explicitly mentioned in the resume
4. Include skill categories: Technical, Soft, Languages
5. Calculate total years of experience from work history
6. Track which fields are missing for later prompting
7. Calculate a completion score (0-100) based on how many fields are filled
8. Return ONLY the JSON object, no additional text`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Extract JSON from response (handle markdown code blocks if present)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else if (responseText.includes('{')) {
      // Extract JSON directly if not in code block
      const startIdx = responseText.indexOf('{');
      const endIdx = responseText.lastIndexOf('}');
      if (startIdx !== -1 && endIdx !== -1) {
        jsonStr = responseText.substring(startIdx, endIdx + 1);
      }
    }

    const parsedData = JSON.parse(jsonStr) as ParsedProfile;

    // Calculate completion score based on filled fields
    const calculateCompletionScore = (data: ParsedProfile): number => {
      let filledFields = 0;
      let totalFields = 0;

      // Personal Info (5 fields)
      if (data.personalInfo?.name) filledFields++;
      if (data.personalInfo?.email) filledFields++;
      if (data.personalInfo?.phone) filledFields++;
      if (data.personalInfo?.location) filledFields++;
      if (data.personalInfo?.summary) filledFields++;
      totalFields += 5;

      // Skills, Experience, Education (3 fields)
      if ((data.skills || []).length > 0) filledFields++;
      if ((data.experience || []).length > 0) filledFields++;
      if ((data.education || []).length > 0) filledFields++;
      totalFields += 3;

      // Optional fields (3 fields)
      if ((data.certifications || []).length > 0) filledFields++;
      if ((data.languages || []).length > 0) filledFields++;
      if ((data.projects || []).length > 0) filledFields++;
      totalFields += 3;

      return Math.round((filledFields / totalFields) * 100);
    };

    // Identify missing fields
    const identifyMissingFields = (data: ParsedProfile): string[] => {
      const missing: string[] = [];

      if (!data.personalInfo?.email) missing.push('email');
      if (!data.personalInfo?.phone) missing.push('phone');
      if (!data.personalInfo?.location) missing.push('location');
      if (!data.personalInfo?.summary) missing.push('summary');
      if ((data.skills || []).length === 0) missing.push('skills');
      if ((data.certifications || []).length === 0) missing.push('certifications');
      if ((data.languages || []).length === 0) missing.push('languages');
      if ((data.projects || []).length === 0) missing.push('projects');

      return missing;
    };

    // Calculate total years of experience
    const totalYearsExperience = (parsedData.experience || []).reduce((sum, exp) => {
      if (exp.startDate && exp.endDate && exp.endDate !== 'Present') {
        const start = parseInt(exp.startDate);
        const end = parseInt(exp.endDate);
        if (!isNaN(start) && !isNaN(end)) {
          return sum + (end - start);
        }
      }
      return sum;
    }, 0);

    const completionScore = calculateCompletionScore(parsedData);
    const missingFields = identifyMissingFields(parsedData);

    // Validate and normalize the parsed data
    return {
      personalInfo: {
        name: parsedData.personalInfo?.name || 'User',
        email: parsedData.personalInfo?.email,
        phone: parsedData.personalInfo?.phone,
        location: parsedData.personalInfo?.location,
        summary: parsedData.personalInfo?.summary,
      },
      skills: (parsedData.skills || []).map((skill) => ({
        name: skill.name,
        level: Math.min(5, Math.max(1, skill.level || 3)),
        yearsOfExperience: skill.yearsOfExperience,
        category: skill.category,
      })),
      experience: (parsedData.experience || []).map((exp) => ({
        title: exp.title,
        company: exp.company,
        duration: exp.duration,
        startDate: exp.startDate,
        endDate: exp.endDate,
        description: exp.description,
        location: exp.location,
      })),
      education: (parsedData.education || []).map((edu) => ({
        degree: edu.degree,
        school: edu.school,
        year: edu.year,
        field: edu.field,
        grade: edu.grade,
      })),
      certifications: (parsedData.certifications || []).map((cert) => ({
        name: cert.name,
        issuer: cert.issuer,
        year: cert.year,
        credentialId: cert.credentialId,
      })),
      languages: (parsedData.languages || []).map((lang) => ({
        language: lang.language,
        proficiency: lang.proficiency,
      })),
      projects: (parsedData.projects || []).map((proj) => ({
        name: proj.name,
        description: proj.description,
        technologies: proj.technologies || [],
        year: proj.year,
      })),
      metadata: {
        totalYearsExperience,
        parsedAt: new Date().toISOString(),
        resumeVersion: 1,
        completionScore,
        missingFields,
      },
    };
  } catch (error) {
    console.error('Error parsing resume with AI:', error);
    throw new Error('Failed to parse resume content');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filePath } = body;

    if (!filePath) {
      return NextResponse.json(
        { success: false, error: 'No file path provided' },
        { status: 400 }
      );
    }

    // Extract text from PDF
    const resumeText = await extractTextFromPdf(filePath);

    if (!resumeText || resumeText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Could not extract text from PDF' },
        { status: 400 }
      );
    }

    // Parse resume with AI
    const profile = await parseResumeWithAI(resumeText);

    return NextResponse.json({
      success: true,
      message: 'Resume parsed successfully',
      profile,
    });
  } catch (error) {
    console.error('Error in parse endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to parse resume',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
