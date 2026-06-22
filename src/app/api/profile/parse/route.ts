import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
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
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description?: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    year: string;
  }>;
}

async function extractTextFromPdf(filePath: string): Promise<string> {
  try {
    const fileBuffer = await readFile(filePath);

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
    // Return a placeholder text if PDF parsing fails
    return 'Unable to extract PDF content. Please ensure the PDF is valid.';
  }
}

async function parseResumeWithAI(resumeText: string): Promise<ParsedProfile> {
  const client = new Anthropic();

  const prompt = `You are a resume parser. Extract the following information from the resume text below and return it as a valid JSON object.

Resume Text:
${resumeText}

Return a JSON object with this exact structure (use only what you can find in the resume):
{
  "personalInfo": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+1234567890",
    "location": "City, Country",
    "summary": "Professional summary if available"
  },
  "skills": [
    {"name": "Skill Name", "level": 4, "yearsOfExperience": 3}
  ],
  "experience": [
    {"title": "Job Title", "company": "Company Name", "duration": "2020-2023", "description": "Brief description"}
  ],
  "education": [
    {"degree": "Degree Name", "school": "School Name", "year": "2020"}
  ],
  "certifications": [
    {"name": "Certification Name", "issuer": "Issuer Name", "year": "2023"}
  ]
}

Guidelines:
1. For skills level, use 1-5 scale (5 being expert)
2. For duration, use "YYYY-YYYY" format or "YYYY-Present"
3. Extract only data that is explicitly mentioned in the resume
4. If a field is not found, omit it or use null
5. Return ONLY the JSON object, no additional text`;

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
      })),
      experience: (parsedData.experience || []).map((exp) => ({
        title: exp.title,
        company: exp.company,
        duration: exp.duration,
        description: exp.description,
      })),
      education: (parsedData.education || []).map((edu) => ({
        degree: edu.degree,
        school: edu.school,
        year: edu.year,
      })),
      certifications: (parsedData.certifications || []).map((cert) => ({
        name: cert.name,
        issuer: cert.issuer,
        year: cert.year,
      })),
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
