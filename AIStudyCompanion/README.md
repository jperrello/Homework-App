# Canvas AI Study Companion

A React Native mobile application that integrates with Canvas LMS to provide AI-powered study materials and personalized learning experiences.

## 🚀 Features

### Core Features
- **Canvas Integration**: Secure OAuth authentication and API integration with Canvas LMS
- **AI-Powered Content Generation**: 
  - Flashcards with spaced repetition
  - Interactive quizzes
  - Study summaries
  - Video explanations (planned)
  - Audio podcasts (planned)
- **Skills Coach**: Interactive AI chat interface with reflective learning prompts
- **Custom Instructions**: Personalize AI behavior and learning style
- **Study Queue**: Smart spaced repetition system for optimal retention

### Navigation Structure
- **Welcome & Authentication**: Onboarding and Canvas connection
- **Study Queue**: Daily study items with spaced repetition
- **Content Creator**: Generate study materials from course content
- **Skills Coach**: Interactive AI learning companion
- **Settings**: Customization and account management

## 🛠 Technical Architecture

### Frontend (React Native + Expo)
- **Framework**: React Native with Expo
- **Navigation**: React Navigation 6 with stack and tab navigators
- **UI Components**: React Native Elements + React Native Paper
- **State Management**: Context API (expandable to Redux)
- **Storage**: AsyncStorage for offline data persistence

### Backend Services (Planned)
- **AI Service**: OpenAI GPT-4 integration for content generation
- **Canvas API**: RESTful integration with Canvas LMS
- **Vector Database**: For semantic search and RAG (Retrieval Augmented Generation)
- **TTS Service**: Text-to-speech for audio content

### Project Structure
```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── navigation/         # Navigation configuration
├── services/          # API services (Canvas, AI)
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
├── contexts/          # React contexts for state management
└── constants/         # App constants and configuration
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (Mac) or Android Studio (for emulator)

### Installation
1. **Clone and install dependencies**:
   ```bash
   cd AIStudyCompanion
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Run on device/emulator**:
   - iOS: `npm run ios`
   - Android: `npm run android` 
   - Web: `npm run web`

4. **Using Expo Go**:
   - Install Expo Go app on your mobile device
   - Scan the QR code from the terminal

### Configuration
1. **Canvas API Setup**:
   - Update `src/constants/index.ts` with your Canvas instance URL
   - Set up OAuth2 application in Canvas
   - Configure client ID and redirect URI

2. **AI Service Setup**:
   - Add OpenAI API key to `src/services/aiService.ts`
   - Configure AI generation parameters

## 📱 Current Implementation Status

### ✅ Completed
- [x] Project structure and navigation
- [x] Authentication flow (UI only)
- [x] Main tab navigation with 4 screens
- [x] Canvas API service foundation
- [x] AI service foundation
- [x] TypeScript type definitions
- [x] UI components and styling
- [x] Settings and preferences structure

### 🚧 In Progress
- [ ] Canvas OAuth implementation
- [ ] Data persistence and storage
- [ ] Spaced repetition algorithm
- [ ] Flashcard and quiz components

### 📋 Planned Features
- [ ] Real Canvas API integration
- [ ] AI content generation pipeline
- [ ] Multimodal content (video/audio)
- [ ] Advanced study analytics
- [ ] Push notifications
- [ ] Offline study mode

## 🎨 Design Philosophy

The app follows these principles:
- **Student-Centric**: Focuses on learning outcomes rather than just providing answers
- **AI as Coach**: Uses AI to ask questions and encourage reflection
- **Ethical Learning**: Promotes academic integrity through reflection prompts
- **Personalization**: Adapts to individual learning preferences
- **Evidence-Based**: Uses proven learning techniques like spaced repetition

## 🔐 Privacy & Security

- Canvas tokens are encrypted and stored securely
- AI interactions are logged only for improvement purposes
- No academic content is permanently stored without user consent
- FERPA compliance considerations built into the design

## 🤝 Contributing

This is a capstone project demonstrating:
- **Mobile Development**: Cross-platform React Native expertise
- **AI Integration**: Modern LLM and multimodal AI services  
- **Educational Technology**: Learning science principles in software
- **System Architecture**: Production-ready backend design
- **API Integration**: Canvas LMS and third-party services

## 📄 License

This project is part of a master's capstone program. Please see the institution's guidelines for usage and attribution.

---

*Built as part of a Master's Capstone project exploring AI-assisted learning in higher education.*