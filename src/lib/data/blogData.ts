export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  tags: string[];
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    slug: "buying-property-northern-cyprus-guide",
    title: "Complete Guide to Buying Property in Northern Cyprus",
    excerpt: "Everything you need to know about purchasing real estate in Northern Cyprus, from legal requirements to market trends.",
    content: `<p>Buying property in Northern Cyprus has become increasingly popular among international buyers. This comprehensive guide will walk you through the entire process.</p>
<h2>Legal Requirements</h2>
<p>Foreigners can purchase property in Northern Cyprus with certain restrictions. You are allowed to purchase one property per family (up to 5 donum of land for land purchases). The process involves:</p>
<ul>
<li>Permission from the Council of Ministers</li>
<li>Survey and valuation reports</li>
<li>Title deed transfer (Tapsu)</li>
<li>Stamp duty payment</li>
</ul>
<h2>Financing Options</h2>
<p>Several banks in Northern Cyprus offer mortgages to foreign buyers. Typical requirements include:</p>
<ul>
<li>Minimum 30% down payment</li>
<li>Proof of income</li>
<li>Interest rates ranging from 5-8%</li>
</ul>
<h2>Popular Areas</h2>
<p>Kyrenia (Girne) remains the most popular area, followed by Iskele with its stunning beaches, and Famagusta with its university-driven rental market.</p>`,
    image: "https://images.pexels.com/photos/29702273/pexels-photo-29702273.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    category: "Buying Guide",
    author: "Ahmet Yılmaz",
    date: "2025-03-15",
    readTime: "8 min read",
    tags: ["buying", "guide", "northern cyprus", "legal"],
  },
  {
    id: 2,
    slug: "northern-cyprus-investment-roi-2025",
    title: "Northern Cyprus Real Estate Investment ROI in 2025",
    excerpt: "Analysis of rental yields and property appreciation rates in Northern Cyprus. Discover the best investment opportunities.",
    content: `<p>Northern Cyprus continues to offer attractive returns for real estate investors in 2025. Here's what you need to know.</p>
<h2>Rental Yields</h2>
<p>The average rental yields in Northern Cyprus range from 6-10% annually, making it one of the most attractive investment destinations in the Mediterranean.</p>
<h2>Property Appreciation</h2>
<p>Property prices have shown consistent appreciation of 5-8% annually, with beachfront properties in Iskele showing the highest growth.</p>
<h2>Best Investment Areas</h2>
<ul>
<li><strong>Iskele Long Beach</strong>: 8-10% rental yield</li>
<li><strong>Kyrenia Harbor</strong>: 6-8% rental yield</li>
<li><strong>Famagusta</strong>: 7-9% rental yield (student rentals)</li>
</ul>`,
    image: "https://images.pexels.com/photos/35069530/pexels-photo-35069530.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    category: "Investment",
    author: "Elena Petrova",
    date: "2025-03-10",
    readTime: "6 min read",
    tags: ["investment", "ROI", "rental yield", "2025"],
  },
  {
    id: 3,
    slug: "living-northern-cyprus-expat-guide",
    title: "Living in Northern Cyprus: The Ultimate Expat Guide",
    excerpt: "From healthcare to education, cost of living to social life - everything expats need to know about moving to Northern Cyprus.",
    content: `<p>Northern Cyprus is becoming an increasingly popular destination for expats from around the world. Here's your comprehensive guide.</p>
<h2>Cost of Living</h2>
<p>The cost of living in Northern Cyprus is significantly lower than most European countries. A couple can live comfortably on £1,500-2,000 per month.</p>
<h2>Healthcare</h2>
<p>Both public and private healthcare facilities are available. Private hospitals in Kyrenia offer international standard care at affordable prices.</p>
<h2>Education</h2>
<p>Several international schools are available, and the region hosts multiple universities, making it a vibrant academic hub.</p>
<h2>Weather</h2>
<p>Northern Cyprus enjoys a Mediterranean climate with over 300 days of sunshine per year. Summers are hot and dry, winters are mild.</p>`,
    image: "https://images.pexels.com/photos/20975729/pexels-photo-20975729.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    category: "Lifestyle",
    author: "Mehmet Kaya",
    date: "2025-02-28",
    readTime: "10 min read",
    tags: ["expat", "lifestyle", "living", "guide"],
  },
  {
    id: 4,
    slug: "kyrenia-vs-iskele-where-buy",
    title: "Kyrenia vs Iskele: Where Should You Buy Property?",
    excerpt: "A detailed comparison of the two most popular property investment areas in Northern Cyprus to help you make the right choice.",
    content: `<p>Choosing between Kyrenia and Iskele is one of the most common decisions buyers face. Here's a detailed comparison.</p>
<h2>Kyrenia (Girne)</h2>
<p>Kyrenia is the tourism capital with a vibrant harbor, castle, and established infrastructure. Property prices are higher but so is rental demand.</p>
<h2>Iskele</h2>
<p>Iskele is the fastest-growing area with new developments and beautiful beaches. Prices are more affordable and growth potential is higher.</p>
<h2>Comparison</h2>
<ul>
<li><strong>Price</strong>: Iskele 20-30% cheaper</li>
<li><strong>Rental Demand</strong>: Kyrenia year-round, Iskele seasonal</li>
<li><strong>Growth Potential</strong>: Iskele higher</li>
<li><strong>Infrastructure</strong>: Kyrenia more developed</li>
</ul>`,
    image: "https://images.pexels.com/photos/19075379/pexels-photo-19075379.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    category: "Comparison",
    author: "Ahmet Yılmaz",
    date: "2025-02-20",
    readTime: "7 min read",
    tags: ["kyrenia", "iskele", "comparison", "investment"],
  },
  {
    id: 5,
    slug: "taxes-fees-buying-property-trnc",
    title: "Taxes and Fees When Buying Property in TRNC",
    excerpt: "Complete breakdown of all costs associated with buying property in Northern Cyprus including taxes, fees, and legal costs.",
    content: `<p>Understanding the full cost of buying property in Northern Cyprus is crucial for budgeting. Here's a complete breakdown.</p>
<h2>Stamp Duty</h2>
<p>0.5% of the contract value, paid upon signing the sales agreement.</p>
<h2>Transfer Fee</h2>
<p>6% of the declared value, paid to the government upon title deed transfer.</p>
<h2>Legal Fees</h2>
<p>Typically 1-2% of the property value for a lawyer's services.</p>
<h2>Agent Commission</h2>
<p>Usually 3% + VAT, paid by the seller.</p>
<h2>Annual Property Tax</h2>
<p>Very affordable, ranging from £50-£200 depending on property value.</p>`,
    image: "https://images.pexels.com/photos/29702291/pexels-photo-29702291.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    category: "Legal",
    author: "Elena Petrova",
    date: "2025-02-10",
    readTime: "5 min read",
    tags: ["taxes", "fees", "legal", "buying"],
  },
  {
    id: 6,
    slug: "top-5-beach-villas-northern-cyprus",
    title: "Top 5 Beach Villas in Northern Cyprus",
    excerpt: "Explore the most stunning beachfront villas available in Northern Cyprus. From infinity pools to private beach access.",
    content: `<p>Northern Cyprus is home to some of the most beautiful beach villas in the Mediterranean. Here are our top 5 picks.</p>
<h2>1. Bafra Beachfront Villa</h2>
<p>Stunning 5-bedroom villa with infinity pool and direct beach access.</p>
<h2>2. Long Beach Luxury Villa</h2>
<p>Modern 4-bedroom villa with panoramic sea views.</p>
<h2>3. Kyrenia Bay Villa</h2>
<p>Classic Mediterranean style villa with private garden.</p>`,
    image: "https://images.pexels.com/photos/29702290/pexels-photo-29702290.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    category: "Property Showcase",
    author: "Ahmet Yılmaz",
    date: "2025-01-25",
    readTime: "6 min read",
    tags: ["villas", "beach", "luxury", "top picks"],
  },
];

export const blogCategories = [
  "All",
  "Buying Guide",
  "Investment",
  "Lifestyle",
  "Comparison",
  "Legal",
  "Property Showcase",
];
