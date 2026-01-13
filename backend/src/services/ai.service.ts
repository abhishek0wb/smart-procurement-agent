import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export const generateStructuredRFP = async (text: string) => {
  const systemPrompt = `You are an AI assistant that helps structure RFP (Request for Proposal) documents. 
  Extract the following information from the provided RFP text and return it as a JSON object:
  - title: A concise title for the RFP
  - items: Array of items/services being requested
  - budget: The budget range or amount (if mentioned)
  - deadline: The submission deadline (if mentioned)
  - requirements: Array of key requirements or specifications
  - additionalNotes: Any other relevant information

  Format the response as a valid JSON object. If a field is not mentioned, set it to null.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content in AI response');

    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('Error generating structured RFP:', error);
    throw new Error('Failed to process RFP with AI');
  }
};

export const extractProposalDetails = async (text: string) => {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an AI that extracts structured proposal data from email text. Extract the price, timeline, and key terms. Return JSON with keys: price, timeline, terms.',
        },
        { role: 'user', content: text },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content || '{}';
    return JSON.parse(content);
  } catch (error) {
    console.error('Error extracting proposal details:', error);
    return { price: 'Unknown', timeline: 'Unknown', terms: 'Check email' };
  }
};

export const generateComparison = async (rfp: any, proposals: any[]) => {
  const systemPrompt = `Act as a senior procurement officer. Compare the following vendor proposals against the RFP requirements.
  
  RFP Title: ${rfp.title}
  RFP Budget: ${rfp.structuredData?.budget || 'Not specified'}
  RFP Timeline: ${rfp.structuredData?.deadline || 'Not specified'}
  requirements: ${JSON.stringify(rfp.structuredData?.items || [])}

  Proposals:
  ${proposals.map((p, i) => `
    Vendor ${i + 1}: ${p.vendor.name}
    Price: ${p.price}
    Timeline: ${p.timeline}
    Terms: ${p.terms}
    Raw Text: ${p.rawText ? p.rawText.substring(0, 200) + '...' : ''}
  `).join('\n')}

  Return a JSON object with:
  - summary: A brief executive summary of the comparison.
  - winner: The name of the winning vendor.
  - comparison: Array of objects { vendor: string, score: number (1-100), pros: string[], cons: string[] }.
  - reasoning: Detailed explanation of why the winner was chosen.
  `;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate the comparison.' },
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content || '{}';
    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating comparison:', error);
    throw new Error('Failed to generate recommendation');
  }
};
