# 🌍 Currency Exchange API

A simple **NestJS-based API** for managing and retrieving **country information** and **currency exchange data**.  
It supports refreshing country data from external sources, querying specific countries, generating image summaries, and monitoring API status.

---

## 🚀 Features
- 🗺️ Fetch and store country data (from an external API)
- 🔍 Retrieve single or multiple countries
- 🗑️ Delete countries from the database
- 🖼️ Generate summary images for countries
- 💱 Extendable for currency exchange features
- 🧠 Built with **NestJS**, **Mongoose**, and **Sharp** (for image generation)

---

## 🧰 Tech Stack
- **Backend Framework:** [NestJS](https://nestjs.com/)
- **Database:** MongoDB (via Mongoose)
- **Image Processing:** Sharp
- **Language:** TypeScript

---

## ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/currency_exchange_api.git
cd currency_exchange_api
Install dependencies:

bash
Copy code
npm install
Set up your .env file:

env
PORT=5000
MONGO_URI=mongodb+srv://your-mongo-uri
EXTERNAL_API_URL=https://restcountries.com/v3.1/all
Start the server:

bash
npm run start:dev
📡 API Endpoints
Method	Endpoint	Description
POST	/countries/refresh	Fetch and refresh all country data
GET	/countries	Retrieve all countries
GET	/countries/:name	Retrieve a specific country
DELETE	/countries/:name	Delete a specific country
GET	/status	Check API and database connection
GET	/countries/image?name={country}	Generate summary image for a country

🧑‍💻 Developer

Nzube Uwakwe (Zubby)
💻 Backend Developer | 🧠 JavaScript | ⚙️ Node.js | 🚀 NestJS
GitHub: Nzube-ctrl