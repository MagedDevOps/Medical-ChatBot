# Medical Chatbot Web App

A modern, Arabic-language medical chatbot web application built with React, Vite, and Chakra UI. The chatbot provides information about hospitals, medicines, first aid, and other medical topics.

## Features
- Right-to-left (RTL) layout and Arabic interface
- Clean, modern UI inspired by the provided design
- Uses OpenRouter API (GPT-4o) for medical Q&A
- Responsive and accessible

## Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your OpenRouter API key:
   ```env
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
   VITE_SITE_URL=http://localhost:5173
   VITE_SITE_NAME=MedicalChatbot
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage
- Type your medical question in Arabic (e.g., about hospitals, medicines, or first aid) and press "إرسال".
- The chatbot will respond with helpful information.

## Customization
- Colors and layout can be adjusted in `App.jsx` and Chakra UI theme settings.

---

**Note:** This chatbot is for informational purposes only and does not provide medical advice, diagnosis, or treatment. 