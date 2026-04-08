const Anthropic = require('@anthropic-ai/sdk')

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514'

const SYSTEM_PROMPT = `You are an expert AI business assistant for AgrIProperty Manager AI — a platform managing two businesses simultaneously:

1. 🏠 GHANA REAL ESTATE BUSINESS
   - Deep knowledge of Ghana's property market (Accra, Kumasi, Takoradi, Cape Coast, Tema)
   - Ghana tenancy law and landlord rights under the Rent Act 1963 (Act 220)
   - GHS (Ghana Cedis) financial management and local market rates
   - Property valuation, rental pricing strategy, tenant screening
   - Ghana Land Commission, leasehold vs freehold, stamp duty
   - Common maintenance issues in tropical West African climate

2. 🌾 ESWATINI & SOUTH AFRICA VEGETABLE FARMING BUSINESS
   - Vegetable farming in Eswatini (Kingdom of Eswatini, formerly Swaziland)
   - SA and Eswatini fresh produce markets: Johannesburg Fresh Produce Market (JFPM), Cape Town Market, Durban Market, Manzini Fresh Produce Market, Mbabane market
   - SIZA (Sustainability Initiative of South Africa) and GlobalG.A.P certification requirements
   - SA food safety regulations, PPECB (Perishable Products Export Control Board)
   - Seasonal planting calendars for Southern African climate (subtropical highland)
   - Common crop diseases, pest management in humid subtropical conditions
   - Market entry strategy for SA fresh produce retailers (Woolworths Food, Checkers, Pick n Pay)
   - Eswatini export procedures to South Africa (customs, phytosanitary certificates)
   - SZL (Swazi Lilangeni) and ZAR (South African Rand) — they are pegged 1:1
   - Water management and irrigation in Eswatini's varying rainfall regions

3. 💰 UNIFIED FINANCIAL MANAGEMENT
   - Cross-border business financial management
   - Multi-currency accounting (GHS, SZL, ZAR, USD)
   - African SME financial planning, cash flow management
   - Tax obligations in both Ghana and Eswatini
   - Profit optimization strategies

4. 🤝 AFRICAN BUSINESS CONTEXT
   - Mobile money payments (MTN Mobile Money, Eswatini Mobile)
   - African market trends and opportunities
   - Cross-border trade between SADC countries
   - Agricultural financing and grants available in Southern Africa

IMPORTANT GUIDELINES:
- Always provide practical, actionable advice specific to the African context
- Reference real markets, regulations, and institutions when possible
- When analyzing business data, be specific and data-driven
- For farming advice, consider the subtropical highland climate of Eswatini
- For real estate advice, consider Ghanaian legal and cultural context
- Format responses clearly with headers and bullet points when appropriate
- When generating documents (contracts, invoices, emails), make them professional and legally appropriate for the jurisdiction
- Always show amounts in the relevant currency (GHS for Ghana, SZL/ZAR for Eswatini/SA)
- Be encouraging and supportive — the user is an entrepreneur managing cross-border businesses`

/**
 * Send a message to Claude and get a streaming or regular response
 */
async function chat(messages, businessContext = null) {
  const contextPrefix = businessContext
    ? `\n\nCURRENT BUSINESS CONTEXT:\n${JSON.stringify(businessContext, null, 2)}\n\nUse this data to give personalized, data-driven responses.\n\n---\n\n`
    : ''

  const systemWithContext = SYSTEM_PROMPT + contextPrefix

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: systemWithContext,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  })

  return response.content[0].text
}

/**
 * Generate a tenancy agreement
 */
async function generateTenancyAgreement(property, tenant) {
  const prompt = `Generate a professional Ghana tenancy agreement for the following:

PROPERTY:
- Name: ${property.name}
- Location: ${property.location}, ${property.city || ''}, ${property.region || 'Ghana'}
- Type: ${property.type}
- Size: ${property.size_sqm ? property.size_sqm + ' sqm' : 'Not specified'}

TENANT:
- Full Name: ${tenant.full_name}
- ID Number: ${tenant.id_number || 'Not provided'}
- Phone: ${tenant.phone}
- Email: ${tenant.email || 'Not provided'}

LEASE TERMS:
- Start Date: ${tenant.lease_start}
- End Date: ${tenant.lease_end}
- Monthly Rent: GHS ${tenant.monthly_rent.toLocaleString()}
- Security Deposit: GHS ${tenant.deposit_amount ? tenant.deposit_amount.toLocaleString() : '0'}
- Rent Due Day: ${tenant.rent_due_day || 1}st of each month

Generate a complete, legally appropriate tenancy agreement for Ghana. Include all standard clauses covering:
- Parties, property description
- Lease term and renewal options
- Rent amount, payment method, late fees
- Deposit terms and conditions
- Landlord and tenant obligations
- Maintenance responsibilities
- Termination and notice period
- Ghana-specific legal provisions under the Rent Act 1963 (Act 220)

Format it as a proper legal document with numbered sections.`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  return response.content[0].text
}

/**
 * Generate a buyer email / proposal
 */
async function generateBuyerEmail(buyer, crops, context = '') {
  const prompt = `Generate a professional sales email to a South African/Eswatini produce buyer:

BUYER:
- Company: ${buyer.company_name || buyer.contact_name}
- Contact: ${buyer.contact_name}
- Country: ${buyer.country}

AVAILABLE PRODUCE:
${crops.map(c => `- ${c.name} (${c.crop_type}): Estimated ${c.quantity_planted} ${c.unit}, Field: ${c.field_plot}`).join('\n')}

ADDITIONAL CONTEXT: ${context}

Write a compelling, professional email that:
1. Introduces the Eswatini farm
2. Highlights product quality and certifications (SIZA/GlobalG.A.P if applicable)
3. Lists available produce with estimated quantities and pricing
4. Mentions competitive advantages (freshness, proximity to SA markets, sustainable farming)
5. Includes a clear call to action
6. Is appropriate for the SA fresh produce market context`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  return response.content[0].text
}

/**
 * Generate a market analysis report
 */
async function generateMarketReport(businessData) {
  const prompt = `Generate a comprehensive business performance and market analysis report based on this data:

${JSON.stringify(businessData, null, 2)}

Include:
1. Executive Summary
2. Real Estate Performance Analysis (Ghana)
   - Occupancy rates and trends
   - Revenue performance vs market rates
   - Property recommendations
3. Farm Business Analysis (Eswatini)
   - Crop performance and yield analysis
   - Revenue vs SA market prices
   - Buyer diversification
4. Financial Health Assessment
   - Combined P&L analysis
   - Cash flow insights
   - Currency exposure
5. Strategic Recommendations
   - Next 3 months priorities
   - Growth opportunities
   - Risk mitigation

Make it professional, data-driven, and actionable.`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  return response.content[0].text
}

module.exports = { chat, generateTenancyAgreement, generateBuyerEmail, generateMarketReport }
