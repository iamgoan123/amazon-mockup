# 🛒 Amazon Product Page Mockup Generator

An AI-powered tool that generates realistic Amazon product page mockups instantly. Enter a brand name and product — Grok AI generates the entire page including descriptions, specifications, reviews, and more.

![Amazon Mockup Generator](https://img.shields.io/badge/Powered%20by-Grok%20AI-blue) ![Netlify](https://img.shields.io/badge/Hosted%20on-Netlify-00C7B7) ![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- **AI-Generated Content** — Grok AI writes product titles, descriptions, bullet points, specs, and reviews
- **6 Product Categories** — Clothing, Electronics, Home & Kitchen, Sports, Beauty, Books
- **Pixel-Perfect Amazon UI** — Header, navigation, breadcrumbs, buy box, review section, footer
- **Customizable** — Set brand, product name, price, colour, and category
- **Instant Generation** — Full page generated in seconds
- **Mobile Responsive** — Works on all screen sizes
- **Secure** — API key stored server-side via Netlify Functions

## 🚀 Live Demo

👉 [**your-site.netlify.app**](https://amazonmockuppage.netlify.app)

## 📁 Project Structure

```
amazon-mockup/
├── index.html                 # Frontend — input form + Amazon page renderer
├── netlify.toml               # Netlify build configuration
├── package.json               # Project metadata
└── netlify/
    └── functions/
        └── generate.mjs       # Serverless function — calls Grok API
```

## 🛠️ How It Works

1. User enters **Brand Name** and **Product Name**
2. Picks a **category**, **price**, and **colour**
3. Frontend calls the Netlify serverless function
4. Serverless function sends a prompt to **Grok AI** (xAI API)
5. Grok generates all product data as structured JSON
6. Frontend renders a complete Amazon-style product page

## 🔧 Setup & Deployment

### Prerequisites
- GitHub account
- Netlify account (free tier works)
- xAI API key from [console.x.ai](https://console.x.ai)

### Deploy Your Own

1. **Fork this repo** or clone it
2. **Connect to Netlify** — Import from GitHub at [app.netlify.com](https://app.netlify.com)
3. **Set environment variable** in Netlify:
   - Key: `GROK_API_KEY`
   - Value: Your xAI API key (starts with `xai-`)
4. **Deploy** — Netlify builds and publishes automatically

### Local Development

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Clone the repo
git clone https://github.com/iamgoan123/amazon-mockup.git
cd amazon-mockup

# Set your API key
export GROK_API_KEY="xai-your-key-here"

# Run locally
netlify dev
```

## 📋 Generated Page Includes

| Section | Details |
|---------|---------|
| **Header** | Amazon nav bar, search, account links |
| **Breadcrumbs** | Category-appropriate navigation path |
| **Product Title** | AI-generated keyword-rich title |
| **Rating** | Stars, rating count, purchase volume |
| **Pricing** | Price, list price, discount %, payment plans |
| **Options** | Colour swatches, size selector |
| **Highlights** | Material, care, pattern, fit, season |
| **About** | 5 detailed AI-written bullet points |
| **Style Table** | Category-specific attributes |
| **Top Brand Badge** | Brand trust indicators |
| **Buy Box** | Add to Cart, Buy Now, delivery info |
| **Description** | Full AI-generated product paragraph |
| **Product Details** | ASIN, model number, manufacturer |
| **Reviews** | 4 realistic AI-written reviews with ratings |
| **Rating Bars** | 5-star breakdown chart |

## 🤖 Tech Stack

- **Frontend** — Vanilla HTML/CSS/JS (no frameworks, fast loading)
- **Backend** — Netlify Serverless Functions
- **AI** — Grok AI (xAI) via REST API
- **Hosting** — Netlify (free tier)

## ⚠️ Disclaimer

This tool generates **mockups for demonstration purposes only**. The generated pages are not affiliated with or endorsed by Amazon. Use responsibly for client presentations, prototyping, and educational purposes.

## 📝 License

MIT — use it however you like.

---

Built by [Nikhil Deshpande](https://github.com/iamgoan123)
