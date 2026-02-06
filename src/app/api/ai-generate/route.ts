import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ 
      error: 'ANTHROPIC_API_KEY not configured in Netlify environment variables.' 
    }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { prompt, type, mode, context, currentContent, aiSettings, numQuestions } = body

    if (!prompt && type !== 'lesson_content') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Build AI settings context
    let aiContext = ''
    if (aiSettings) {
      const parts = []
      if (aiSettings.brandVoice) parts.push(`Brand Voice: ${aiSettings.brandVoice}`)
      if (aiSettings.targetAudience) parts.push(`Target Audience: ${aiSettings.targetAudience}`)
      if (aiSettings.toneStyle) parts.push(`Tone: ${aiSettings.toneStyle}`)
      if (aiSettings.perspectiveFraming) parts.push(`Perspective: ${aiSettings.perspectiveFraming}`)
      if (aiSettings.preferredTerms) parts.push(`Use these terms: ${aiSettings.preferredTerms}`)
      if (aiSettings.avoidTerms) parts.push(`Avoid these terms: ${aiSettings.avoidTerms}`)
      if (aiSettings.customInstructions) parts.push(`Additional instructions: ${aiSettings.customInstructions}`)
      if (parts.length > 0) {
        aiContext = `\n\nBRAND & STYLE GUIDELINES:\n${parts.join('\n')}`
      }
    }

    let systemPrompt = ''
    let userPrompt = prompt || ''
    
    if (type === 'full_course') {
      systemPrompt = `You are an expert curriculum designer for transformational programs focused on nervous system regulation, VR biofeedback, and capacity training. 

Your task is to create a comprehensive course structure based on the user's description.

IMPORTANT CONTEXT:
- This is for the Neuro Progeny Immersive Mastermind platform
- Focus on capacity building, not pathology
- HRV is used as a mirror (not a score to optimize)
- VR is a feedback amplifier for state awareness
- The goal is state fluidity, not just calm-chasing
- Use empathetic, viscerally relatable language
- Frame patterns as adaptive strategies, not deficits
${aiContext}

You MUST return ONLY valid JSON with no other text, no markdown, no code blocks. Just the raw JSON object:
{
  "course": {
    "title": "Course Title",
    "description": "2-3 sentence course description",
    "weeks": 5
  },
  "weeks": [
    {
      "week_number": 1,
      "title": "Week Title",
      "description": "Week description/theme",
      "lessons": [
        {
          "title": "Lesson Title",
          "type": "video",
          "duration_minutes": 15,
          "description": "Brief lesson description",
          "content_outline": "Key points to cover"
        }
      ]
    }
  ]
}`
    } else if (type === 'lesson_content') {
      if (mode === 'write') {
        systemPrompt = `You are an expert content writer for transformational nervous system training programs.

Write engaging, warm lesson content based on the user's request.
${aiContext}

FORMATTING:
- Use clean semantic HTML (h2, h3, p, ul, ol, blockquote)
- Include <div class="callout" style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;margin:16px 0;border-radius:8px;"> for important notes
- Include <div class="exercise" style="background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;margin:16px 0;border-radius:8px;"> for hands-on activities
- Include <div class="reflection" style="background:#fdf4ff;border-left:4px solid #a855f7;padding:16px;margin:16px 0;border-radius:8px;"> for journaling prompts
- Keep paragraphs concise and scannable
- Write in second person ("you")

Return ONLY the HTML content, no markdown code blocks or explanation.`
      } else if (mode === 'polish') {
        systemPrompt = `You are an expert editor for transformational content.

Polish and improve the provided content while maintaining its core message.
${aiContext}

GUIDELINES:
- Improve clarity, flow, and engagement
- Ensure warm, encouraging tone
- Fix any awkward phrasing
- Add transitions between sections if needed
- Maintain existing HTML structure

Return ONLY the improved HTML content, no markdown code blocks or explanation.`
        userPrompt = `Polish this content based on these instructions: "${prompt}"\n\nCONTENT TO POLISH:\n${currentContent}`
      } else if (mode === 'expand') {
        systemPrompt = `You are an expert content writer for transformational programs.

Expand the provided content with more depth, examples, and practical applications.
${aiContext}

GUIDELINES:
- Add more detail and depth
- Include practical examples
- Add exercises or reflection prompts where appropriate
- Maintain the existing tone and style
- Use proper HTML formatting with inline styles

Return ONLY the expanded HTML content, no markdown code blocks or explanation.`
        userPrompt = `Expand this content based on these instructions: "${prompt}"\n\nCONTENT TO EXPAND:\n${currentContent}`
      } else {
        // Default write mode
        systemPrompt = `You are an expert content writer for transformational nervous system training programs. Write HTML content for lessons. Return ONLY HTML, no markdown.${aiContext}`
      }
    } else if (type === 'quiz') {
      systemPrompt = `You are an expert quiz creator for educational content.

Create an engaging quiz based on the topic provided.
${aiContext}

Return ONLY valid JSON with no other text:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct"
    },
    {
      "id": "q2", 
      "type": "true_false",
      "question": "Statement to evaluate?",
      "correctAnswer": "true",
      "explanation": "Explanation"
    },
    {
      "id": "q3",
      "type": "open_ended",
      "question": "Reflection question?"
    },
    {
      "id": "q4",
      "type": "scale",
      "question": "Rate your understanding of X"
    }
  ]
}

Create ${numQuestions || 5} questions mixing different types. Make questions thought-provoking and relevant to nervous system capacity building.`
      userPrompt = `Create a quiz about: ${prompt}${currentContent ? `\n\nBased on this lesson content:\n${currentContent.substring(0, 2000)}` : ''}`
    } else {
      systemPrompt = `You are an expert curriculum designer for transformational nervous system training programs. Help create educational content that is warm, empathetic, and focused on building capacity rather than fixing problems.${aiContext}`
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: context ? `${userPrompt}\n\nContext:\n${context}` : userPrompt
          }
        ]
      })
    })

    const responseText = await anthropicResponse.text()
    
    if (!anthropicResponse.ok) {
      console.error('Anthropic error:', anthropicResponse.status, responseText)
      return NextResponse.json({ 
        error: `Anthropic API error: ${anthropicResponse.status}`,
        details: responseText
      }, { status: anthropicResponse.status })
    }

    let anthropicData
    try {
      anthropicData = JSON.parse(responseText)
    } catch (e) {
      return NextResponse.json({ 
        error: 'Failed to parse Anthropic response',
        details: responseText.substring(0, 500)
      }, { status: 500 })
    }

    const content = anthropicData.content?.[0]?.text || ''
    
    if (!content) {
      return NextResponse.json({ 
        error: 'No content in Anthropic response',
        details: JSON.stringify(anthropicData).substring(0, 500)
      }, { status: 500 })
    }

    // For JSON responses (course generation, quiz)
    if (type === 'full_course' || type === 'quiz') {
      try {
        let cleanContent = content
          .replace(/```json\s*/gi, '')
          .replace(/```\s*/gi, '')
          .trim()
        
        const parsed = JSON.parse(cleanContent)
        return NextResponse.json({ success: true, data: parsed })
      } catch (parseError: any) {
        console.error('JSON parse failed:', parseError.message)
        return NextResponse.json({ 
          success: true, 
          data: null, 
          raw: content,
          parseError: parseError.message 
        })
      }
    }

    // For HTML content
    let cleanHtml = content
      .replace(/```html\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim()
    
    return NextResponse.json({ success: true, content: cleanHtml })

  } catch (error: any) {
    console.error('AI generate error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}
